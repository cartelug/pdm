<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
require dirname(__DIR__).'/lib/payments.php';

function respond(array $data,int $code=200): void { http_response_code($code);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);exit; }
try {
    $action=$_GET['action'] ?? 'status';
    if (!is_string($action)) throw new InvalidArgumentException('Invalid action');
    $method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (in_array($action,['status','progress','session'],true)) {
        if ($method!=='GET') respond(['error'=>'Use GET'],405);
        if ($action==='status') {
            $c=pci_config();$storage=extension_loaded('pdo_sqlite');
            respond(['checkoutEnabled'=>$storage && pci_checkout_ready(),'pledgesEnabled'=>$storage,'environment'=>$c['environment'],
                'campaigns'=>[['id'=>'walk-for-education-2026','name'=>'Walk for Education 2026','target'=>25000000000]],
                'message'=>'Online payments open after PCI approval. Pledges are recorded separately from payments.']);
        }
        if ($action==='progress') {
            $t=pci_totals();respond(['campaign'=>'walk-for-education-2026','target'=>25000000000,'received'=>(int)$t['reconciled'],'pledged'=>(int)$t['pledged'],'lastReconciledAt'=>$t['lastReconciledAt'],'scope'=>'pesapal-ledger','includesLegacyCollections'=>false]);
        }
        pci_session();respond(['csrf'=>$_SESSION['pci_csrf'],'signedIn'=>!empty($_SESSION['pci_admin']) && time()-(int)($_SESSION['pci_active'] ?? 0)<=1800,'username'=>$_SESSION['pci_admin'] ?? null,'role'=>$_SESSION['pci_role'] ?? null]);
    }
    if ($method!=='POST') respond(['error'=>'Use POST'],405);
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '','application/json')!==0) respond(['error'=>'Send JSON'],415);
    $raw=file_get_contents('php://input',false,null,0,16001);if (strlen($raw)>16000) respond(['error'=>'Request too large'],413);
    $body=json_decode($raw,true);if (!is_array($body)) throw new InvalidArgumentException('Invalid request');
    pci_session();pci_require_csrf();
    if ($action==='create') {
        pci_limit('create',20,600);$row=pci_create($body,session_id());$token=$_SESSION['pci_view'][$row['reference']] ?? '';
        if ($token==='') throw new DomainException('Open your original contribution session');
        respond(['contribution'=>pci_public_row($row),'token'=>$token,'redirectUrl'=>$row['redirect_url'],'needsReview'=>$row['kind']==='payment' && !$row['tracking_id']]);
    }
    if ($action==='lookup') {
        pci_limit('lookup',90,60);$row=pci_find((string)($body['reference'] ?? ''));
        if (!$row || !hash_equals($row['viewer_hash'],hash('sha256',(string)($body['token'] ?? '')))) throw new DomainException('This receipt link is not available in this session');
        $delayed=false;
        /* IPN is the primary updater. User refresh verifies at most once per 20 seconds per session. */
        if ($row['kind']==='payment' && $row['tracking_id'] && time()-(int)($_SESSION['pci_checked'][$row['reference']] ?? 0)>=20) {
            $_SESSION['pci_checked'][$row['reference']]=time();try { $row=pci_verify($row); } catch(Throwable $e) { $delayed=true; }
        }
        respond(['contribution'=>pci_public_row($row),'verificationDelayed'=>$delayed]);
    }
    if ($action==='login') {
        pci_limit('login',8,900);
        if (!pci_login((string)($body['username'] ?? ''),(string)($body['password'] ?? ''))) throw new DomainException('Incorrect username or password');
        respond(['ok'=>true,'csrf'=>$_SESSION['pci_csrf'],'role'=>$_SESSION['pci_role']]);
    }
    $actor=pci_require_admin();
    if ($action==='logout') { $_SESSION=[];session_destroy();respond(['ok'=>true]); }
    if ($action==='dashboard') {
        $rows=pci_db()->query('SELECT * FROM contributions ORDER BY created_at DESC LIMIT 2000')->fetchAll();
        foreach ($rows as &$r) unset($r['viewer_hash'],$r['request_key'],$r['redirect_url']);unset($r);
        $c=pci_config();$audit=pci_db()->query('SELECT * FROM audit ORDER BY id DESC LIMIT 100')->fetchAll();
        respond(['rows'=>$rows,'totals'=>pci_totals(),'audit'=>$audit,'setup'=>[
            'environment'=>$c['environment'],'credentialsConfigured'=>$c['consumer_key']!=='' && $c['consumer_secret']!=='',
            'ipnRegistered'=>pci_setting('ipn_'.$c['environment'])!=='','checkoutEnabled'=>pci_checkout_ready(),
            'policiesApproved'=>$c['policies_approved'],'liveApproved'=>$c['live_approved'],'curlAvailable'=>extension_loaded('curl')],
            'limit'=>2000,'totalRecords'=>(int)pci_db()->query('SELECT count(*) FROM contributions')->fetchColumn()]);
    }
    if ($action==='register-ipn') { pci_require_role(['admin']);pci_register_ipn($actor);respond(['ok'=>true]); }
    if ($action==='recheck') {
        pci_require_role(['admin','finance']);$row=pci_find((string)($body['reference'] ?? ''));if (!$row) throw new InvalidArgumentException('Unknown reference');
        pci_verify($row);pci_audit($row['reference'],$actor,'manual_status_check');respond(['ok'=>true]);
    }
    if ($action==='reconcile') {
        pci_require_role(['admin','finance']);$fee=$body['fee'] ?? null;if (!is_int($fee)) throw new InvalidArgumentException('Fee must be a whole UGX amount');
        pci_reconcile((string)($body['reference'] ?? ''),(string)($body['settlementReference'] ?? ''),$fee,$actor);respond(['ok'=>true]);
    }
    if ($action==='close-pledge') {
        pci_require_role(['admin','finance']);$row=pci_find((string)($body['reference'] ?? ''));if (!$row || $row['kind']!=='pledge') throw new InvalidArgumentException('Unknown pledge');
        $q=pci_db()->prepare("UPDATE contributions SET status='closed',updated_at=? WHERE reference=?");$q->execute([pci_now(),$row['reference']]);pci_audit($row['reference'],$actor,'pledge_closed');respond(['ok'=>true]);
    }
    if ($action==='backup') { pci_require_role(['admin']);$name=pci_backup();pci_audit(null,$actor,'backup_created',$name);respond(['ok'=>true,'backup'=>$name]); }
    if ($action==='export') {
        pci_require_role(['admin','finance']);pci_audit(null,$actor,'report_exported');
        header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="pci-collections-'.gmdate('Ymd').'.csv"');
        $f=fopen('php://output','w');$columns=['reference','campaign','name','email','phone','amount','currency','kind','environment','status','receipt','confirmation','method','referral','settlement_reference','fee','net','reconciled_at','created_at'];fputcsv($f,$columns);
        foreach (pci_db()->query('SELECT * FROM contributions ORDER BY created_at DESC') as $row) {
            $values=[];foreach ($columns as $col) { $v=(string)($row[$col] ?? '');if (preg_match('/^[=+\-@\t\r]/',$v)) $v="'".$v;$values[]=$v; }fputcsv($f,$values);
        }fclose($f);exit;
    }
    respond(['error'=>'Unknown action'],404);
} catch(InvalidArgumentException $e) { respond(['error'=>$e->getMessage()],422);
} catch(DomainException $e) { respond(['error'=>$e->getMessage()],401);
} catch(OverflowException $e) { respond(['error'=>$e->getMessage()],429);
} catch(LogicException $e) { respond(['error'=>$e->getMessage()],409);
} catch(Throwable $e) { error_log('PCI collections: '.get_class($e));respond(['error'=>'Collections service is temporarily unavailable. Please contact PCI or try again later.'],503); }
