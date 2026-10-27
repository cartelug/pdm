<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
require __DIR__.'/lib/operations.php';
require __DIR__.'/lib/operations-reports.php';
function ops_respond(array $b,int $code=200): never { http_response_code($code);echo json_encode($b,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);exit; }
try {
    $action=$_GET['action'] ?? 'public';$method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    if(!is_string($action)) throw new InvalidArgumentException('Invalid action');
    if($method==='GET' && $action==='public') ops_respond(ops_public());
    if($method==='GET' && $action==='session') {
        pci_session();$signed=!empty($_SESSION['pci_admin']) && time()-(int)($_SESSION['pci_active'] ?? 0)<=1800;
        ops_respond(['csrf'=>$_SESSION['pci_csrf'],'signedIn'=>$signed,'username'=>$signed?$_SESSION['pci_admin']:null,'role'=>$signed?($_SESSION['pci_role'] ?? ''):null]);
    }
    if($method!=='POST') ops_respond(['error'=>'Use POST'],405);
    if(stripos($_SERVER['CONTENT_TYPE'] ?? '','application/json')!==0) ops_respond(['error'=>'Send JSON'],415);
    $raw=file_get_contents('php://input',false,null,0,1000001);if(strlen($raw)>1000000) ops_respond(['error'=>'At most 1 MB per request'],413);
    $b=json_decode($raw,true);if(!is_array($b)) throw new InvalidArgumentException('Invalid JSON');
    pci_session();pci_require_csrf();
    if($action==='login') {
        pci_limit('ops-login',8,900);$name=ops_text($b['username'] ?? '',80,true);
        if(!isset(pci_config()['admin_users'][$name]) || !pci_login($name,ops_text($b['password'] ?? '',300,true))) throw new DomainException('Incorrect named username or password');
        ops_respond(['ok'=>true,'csrf'=>$_SESSION['pci_csrf'],'username'=>$name,'role'=>$_SESSION['pci_role']]);
    }
    if($action==='logout') { pci_require_admin();$_SESSION=[];session_destroy();ops_respond(['ok'=>true]); }
    if($action==='dashboard') {
        ops_actor('read');$db=ops_db();
        ops_respond(['rows'=>$db->query('SELECT r.*,a.pledge_ref gateway_pledge_id FROM ops_records r LEFT JOIN ops_allocations a ON a.receipt_id=r.id ORDER BY r.created_at DESC LIMIT 2000')->fetchAll(),'gatewayPledges'=>$db->query("SELECT reference,name,amount,currency,country,step_unit FROM contributions WHERE kind='pledge' AND status='pledged' AND environment='live' ORDER BY created_at DESC")->fetchAll(),'totals'=>ops_totals(),'audit'=>$db->query("SELECT * FROM audit WHERE event LIKE 'ops_%' ORDER BY id DESC LIMIT 100")->fetchAll(),'limit'=>2000,'totalRecords'=>(int)$db->query('SELECT count(*) FROM ops_records')->fetchColumn()]);
    }
    if($action==='record') { $actor=ops_actor('record');ops_respond(['record'=>ops_record($b,$actor)]); }
    if($action==='reconcile') { $actor=ops_actor('finance');ops_reconcile(ops_text($b['id'] ?? '',100,true),ops_text($b['evidence'] ?? '',1000,true),$actor);ops_respond(['ok'=>true]); }
    if($action==='reverse') { $actor=ops_actor('finance');ops_reverse(ops_text($b['id'] ?? '',100,true),ops_text($b['reason'] ?? '',1000,true),$actor);ops_respond(['ok'=>true]); }
    if($action==='consent') {
        $actor=ops_actor('consent');if(!is_bool($b['displayName'] ?? null) || !is_bool($b['displayAmount'] ?? null)) throw new InvalidArgumentException('Set both permissions explicitly');
        ops_consent(ops_text($b['id'] ?? '',100,true),$b['displayName'],$b['displayAmount'],ops_text($b['evidence'] ?? '',1000,true),$actor);ops_respond(['ok'=>true]);
    }
    if($action==='milestone') {
        $actor=ops_actor('milestone');$amount=ops_amount($b['amount'] ?? null);$currency=ops_text($b['currency'] ?? '',3,true);
        if(!in_array($currency,['UGX','KES','USD','GBP','EUR'],true)) throw new InvalidArgumentException('Invalid milestone currency');
        $m=['amount'=>$amount,'currency'=>$currency,'label'=>ops_text($b['label'] ?? '',120,true),'approval'=>ops_text($b['approval'] ?? '',500,true),'approvedBy'=>$actor,'approvedAt'=>pci_now()];
        ops_transaction(function() use($m,$actor) { pci_set('ops_milestone',json_encode($m));pci_audit(null,$actor,'ops_milestone_approved',json_encode($m)); });ops_respond(['ok'=>true]);
    }
    if($action==='photo-upload') {
        $actor=ops_actor('publish');if(($b['approved'] ?? false)!==true) throw new InvalidArgumentException('Confirm this photo is approved for public use');
        $encoded=$b['data'] ?? '';if(!is_string($encoded) || strlen($encoded)>820000) throw new InvalidArgumentException('Choose a photo smaller than 600 KB');
        $bytes=base64_decode($encoded,true);if($bytes===false || strlen($bytes)>600000) throw new InvalidArgumentException('Invalid photo');
        $info=@getimagesizefromstring($bytes);$ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$info['mime'] ?? ''] ?? null;
        if(!$ext || $info[0]<100 || $info[1]<100 || $info[0]>6000 || $info[1]>6000) throw new InvalidArgumentException('Use a valid JPG, PNG or WebP, 100–6000 pixels per side');
        $relative='assets/operations/uploads/'.hash('sha256',$bytes).'.'.$ext;$file=dirname(__DIR__).'/'.$relative;$dir=dirname($file);
        if(!is_dir($dir) && !mkdir($dir,0755,true) && !is_dir($dir)) throw new RuntimeException('Approved photo directory is not writable');
        if(!is_file($file)) { $temp=$dir.'/'.bin2hex(random_bytes(12)).'.tmp';if(file_put_contents($temp,$bytes,LOCK_EX)===false || !rename($temp,$file)) throw new RuntimeException('Could not store approved photo');chmod($file,0644); }
        pci_audit(null,$actor,'ops_approved_photo_uploaded',$relative);ops_respond(['path'=>$relative]);
    }
    if($action==='walk-history') { ops_actor('publish');ops_respond(['versions'=>ops_db()->query('SELECT * FROM ops_walk ORDER BY id DESC LIMIT 100')->fetchAll()]); }
    if($action==='walk-preview') { ops_actor('publish');ops_respond(['walk'=>ops_walk_validate($b)]); }
    if($action==='walk-save' || $action==='walk-publish') { $actor=ops_actor('publish');ops_respond(ops_walk($b,$actor,$action==='walk-publish')); }
    if($action==='walk-revert') {
        $actor=ops_actor('publish');$q=ops_db()->prepare('SELECT payload FROM ops_walk WHERE id=? AND published_at IS NOT NULL');$q->execute([(int)($b['id'] ?? 0)]);$old=$q->fetchColumn();
        if(!$old) throw new InvalidArgumentException('Unknown published version');$payload=json_decode($old,true);$payload['baseVersion']=$b['baseVersion'] ?? 0;ops_respond(ops_walk($payload,$actor,true));
    }
    if($action==='snapshot') { ops_actor('graphic');ops_respond(ops_snapshot(pci_require_admin())); }
    if($action==='snapshot-read') {
        ops_actor('graphic');$q=ops_db()->prepare('SELECT payload FROM ops_snapshots WHERE id=?');$q->execute([ops_text($b['id'] ?? '',32,true)]);$raw=$q->fetchColumn();if(!$raw) throw new InvalidArgumentException('Unknown snapshot');ops_respond(json_decode($raw,true));
    }
    if($action==='import-preview') { ops_actor('record');ops_respond(['preview'=>ops_import_preview($b)]); }
    if($action==='import-commit') {
        $actor=ops_actor('record');$saved=ops_transaction(function() use($b,$actor) {
          $preview=ops_import_preview($b);$ids=[];
          foreach($preview as $row) if($row['issues']) throw new LogicException('Resolve preview issues before importing; no rows were imported');
          foreach($preview as $row) $ids[]=ops_record($row['record'],$actor)['id'];return $ids;
        });ops_respond(['ids'=>$saved]);
    }
    if($action==='report-data') {
        $actor=ops_actor('read');$report=ops_report();
        pci_audit(null,$actor,'ops_report_downloaded');ops_respond($report);
    }
    if($action==='download-database') {
        $actor=ops_actor('read');pci_require_role(['admin']);
        pci_audit(null,$actor,'ops_database_downloaded');$name=pci_backup();
        $file=pci_config()['private_dir'].'/backups/'.$name;
        header('Content-Type: application/vnd.sqlite3');header('Content-Disposition: attachment; filename="'.$name.'"');
        header('Content-Length: '.filesize($file));readfile($file);exit;
    }
    if($action==='export') {
        $actor=ops_actor('read');header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="pci-operations-'.gmdate('Ymd').'.csv"');
        $f=fopen('php://output','w');$columns=['ledger','id','name','amount','currency','kind','date','channel','transaction_ref','pledge_id','country','step_unit','status','reconciled_at','source','source_row','created_at','environment','included_received'];fputcsv($f,$columns);
        $write=static function(array $r) use($columns,$f) { $v=[];foreach($columns as $c) { $s=(string)($r[$c] ?? '');$v[]=preg_match('/^[=+\-@\t\r]/',$s)?"'".$s:$s; }fputcsv($f,$v); };
        foreach(ops_db()->query('SELECT r.*,a.pledge_ref gateway_pledge_id FROM ops_records r LEFT JOIN ops_allocations a ON a.receipt_id=r.id ORDER BY r.created_at') as $r) {
          $r['ledger']='manual';$r['pledge_id']=$r['pledge_id'] ?: $r['gateway_pledge_id'];
          $r['included_received']=$r['kind']==='payment' && $r['status']==='reconciled' && $r['environment']==='live' && !ops_gateway_overlap((string)$r['transaction_ref'])?'yes':'no';$write($r);
        }
        foreach(ops_db()->query("SELECT * FROM contributions WHERE campaign='walk-for-education-2026' ORDER BY created_at") as $r) {
          $r['ledger']='gateway';$r['id']=$r['reference'];$r['date']=substr($r['created_at'],0,10);$r['channel']=$r['method'] ?: 'Pesapal';$r['transaction_ref']=$r['receipt'];
          $r['included_received']=$r['kind']==='payment' && $r['status']==='successful' && $r['reconciled_at'] && $r['environment']==='live'?'yes':'no';$write($r);
        }
        pci_audit(null,$actor,'ops_report_exported');fclose($f);exit;
    }
    ops_respond(['error'=>'Unknown action'],404);
} catch(InvalidArgumentException $e) { ops_respond(['error'=>$e->getMessage()],422);
} catch(DomainException $e) { ops_respond(['error'=>$e->getMessage()],401);
} catch(OverflowException $e) { ops_respond(['error'=>$e->getMessage()],429);
} catch(LogicException $e) { ops_respond(['error'=>$e->getMessage()],409);
} catch(PDOException $e) { error_log('PCI operations database failure: '.$e->getCode());ops_respond(['error'=>'Duplicate record or storage conflict. Refresh and review before retrying.'],409);
} catch(Throwable $e) { error_log('PCI operations: '.get_class($e));ops_respond(['available'=>false,'error'=>'Verified reporting is temporarily unavailable. No zero balance is inferred.'],503); }
