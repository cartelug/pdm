<?php
declare(strict_types=1);
require_once __DIR__.'/payments.php';

/* Additive tables in the existing private ledger. Never migrate or rewrite historical receipts. */
function ops_db(): PDO {
    $db=pci_db();
    $db->exec("CREATE TABLE IF NOT EXISTS ops_records (
      id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, source_key TEXT UNIQUE,
      name TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), currency TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('pledge','payment')), date TEXT NOT NULL,
      channel TEXT NOT NULL, transaction_ref TEXT, transaction_key TEXT UNIQUE,
      pledge_id TEXT REFERENCES ops_records(id), country TEXT NOT NULL, step_unit INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', evidence TEXT NOT NULL, notes TEXT NOT NULL,
      source TEXT NOT NULL, source_row TEXT NOT NULL, environment TEXT NOT NULL,
      reconciled_at TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ops_allocations (receipt_id TEXT PRIMARY KEY REFERENCES ops_records(id), pledge_ref TEXT NOT NULL REFERENCES contributions(reference));
      CREATE TABLE IF NOT EXISTS ops_consent (
      record_id TEXT PRIMARY KEY REFERENCES ops_records(id), display_name INTEGER NOT NULL,
      display_amount INTEGER NOT NULL, evidence TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ops_walk (
      id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL, actor TEXT NOT NULL,
      created_at TEXT NOT NULL, published_at TEXT);
      CREATE TABLE IF NOT EXISTS ops_snapshots (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL);");
    return $db;
}
function ops_text($v,int $max=200,bool $required=false): string {
    if (!is_string($v) || strlen($v)>$max || ($required && trim($v)==='')) throw new InvalidArgumentException('Check required text and length');
    return trim($v);
}
function ops_amount($v): int {
    if (!is_int($v) || $v<=0 || $v>1000000000000) throw new InvalidArgumentException('Use a positive whole amount, at most 1 trillion');
    return $v;
}
function ops_date($v): string {
    $s=ops_text($v,10,true);$d=DateTimeImmutable::createFromFormat('!Y-m-d',$s);
    if (!$d || $d->format('Y-m-d')!==$s) throw new InvalidArgumentException('Use a valid date');return $s;
}
function ops_key(string $s): string { return strtoupper(preg_replace('/[^a-zA-Z0-9]/','',$s)); }
function ops_transaction(callable $f) {
    static $depth=0;$db=ops_db();
    if ($depth>0) return $f($db);
    $db->exec('BEGIN IMMEDIATE');$depth++;
    try { $out=$f($db);$db->exec('COMMIT');return $out; }
    catch(Throwable $e) { $db->exec('ROLLBACK');throw $e; }
    finally { $depth--; }
}
function ops_actor(string $capability): string {
    $actor=pci_require_admin();$u=pci_config()['admin_users'][$actor] ?? null;
    // The legacy shared-password fallback is deliberately not accepted here.
    if (!$u || !ops_named_account_configured($u)) throw new DomainException('A named account must be configured by the host owner');
    $role=$u['role'] ?? 'viewer';if ($role!==($_SESSION['pci_role'] ?? '')) throw new DomainException('Permissions changed; sign in again');
    $caps=['admin'=>['read','record','finance','publish','consent','milestone','graphic'],
      'finance'=>['read','record','finance','consent','milestone','graphic'],
      'recorder'=>['read','record','graphic'], 'owner'=>['publish','graphic'], 'editor'=>['publish','graphic'], 'viewer'=>[]];
    if (!in_array($capability,$caps[$role] ?? [],true)) throw new DomainException('Your named account cannot perform this action');
    return $actor;
}
function ops_named_account_configured(array $u): bool {
    return isset($u['hash']) && is_string($u['hash']) && strlen($u['hash'])>20;
}
function ops_find(string $id): array {
    $q=ops_db()->prepare('SELECT * FROM ops_records WHERE id=?');$q->execute([$id]);$r=$q->fetch();
    if (!$r) throw new InvalidArgumentException('Unknown record');return $r;
}
function ops_gateway_overlap(string $ref): bool {
    $key=ops_key($ref);if ($key==='') return false;
    foreach (pci_db()->query("SELECT reference,tracking_id,confirmation,receipt,settlement_reference FROM contributions WHERE kind='payment' AND environment='live'") as $r) {
        foreach ($r as $s) if (is_string($s) && ops_key($s)===$key) return true;
    }return false;
}
function ops_record(array $b,string $actor): array {
    $name=ops_text($b['name'] ?? '',160,true);$amount=ops_amount($b['amount'] ?? null);
    $currency=ops_text($b['currency'] ?? '',3,true);
    if (!in_array($currency,['UGX','KES','USD','GBP','EUR'],true)) throw new InvalidArgumentException('Choose a supported currency');
    $kind=$b['kind'] ?? 'payment';if (!in_array($kind,['payment','pledge'],true)) throw new InvalidArgumentException('Choose payment or pledge');
    $date=ops_date($b['date'] ?? '');$channel=ops_text($b['channel'] ?? '',60,$kind==='payment');
    if (preg_match('/pesa|gateway/i',$channel)) throw new InvalidArgumentException('Gateway payments belong in the existing gateway ledger; do not import them again');
    $ref=ops_text($b['transactionRef'] ?? '',100,$kind==='payment');
    $tx=$kind==='payment'?ops_key($ref):null;
    if ($kind==='payment' && strlen($tx)<4) throw new InvalidArgumentException('A usable transaction reference is required');
    $request=ops_text($b['requestId'] ?? '',100,true);
    $source=ops_text($b['source'] ?? '',200);$sourceRow=ops_text($b['sourceRow'] ?? '',60);
    $sourceKey=$source!=='' && $sourceRow!==''?hash('sha256',strtolower($source).'|'.$sourceRow):null;
    $pledge=ops_text($b['pledgeId'] ?? '',100);
    $gatewayPledge=null;
    if ($pledge!=='') {
        if ($kind!=='payment') throw new InvalidArgumentException('Only a payment may be allocated to a related pledge');
        $p=str_starts_with($pledge,'OPS-')?ops_find($pledge):pci_find($pledge);
        if (!$p) throw new InvalidArgumentException('Unknown related pledge');
        if ($p['kind']!=='pledge' || $p['currency']!==$currency || $p['environment']!==pci_config()['environment'] || $p['status']!=='pledged') throw new InvalidArgumentException('Related pledge must be open and use the same currency and environment');
        if (!str_starts_with($pledge,'OPS-')) { $gatewayPledge=$pledge;$pledge=''; }
    }
    // Unit snapshots are explicit historical facts; a missing value does not invent sponsored steps.
    $unit=$b['stepUnit'] ?? 0;$country=ops_text($b['country'] ?? '',2);
    if (!is_int($unit) || $unit<0 || $unit>1000000000) throw new InvalidArgumentException('Invalid historical step-price snapshot');
    $evidence=ops_text($b['evidence'] ?? '',1000);$notes=ops_text($b['notes'] ?? '',2000);
    return ops_transaction(function($db) use($b,$actor,$name,$amount,$currency,$kind,$date,$channel,$ref,$tx,$request,$source,$sourceRow,$sourceKey,$pledge,$unit,$country,$evidence,$notes,$gatewayPledge) {
        $q=$db->prepare('SELECT * FROM ops_records WHERE request_key=? OR (source_key IS NOT NULL AND source_key=?)');$q->execute([$request,$sourceKey]);
        if ($existing=$q->fetch()) {
            if ($existing['name']!==$name || (int)$existing['amount']!==$amount || $existing['currency']!==$currency || $existing['kind']!==$kind || $existing['transaction_ref']!==($ref ?: null)) throw new LogicException('This source row or request already exists with different values; preserve it and record an audited correction');
            return $existing;
        }
        if ($tx && ops_gateway_overlap($ref)) throw new LogicException('Duplicate candidate in gateway ledger');
        $id='OPS-'.bin2hex(random_bytes(12));
        $q=$db->prepare('INSERT INTO ops_records(id,request_key,source_key,name,amount,currency,kind,date,channel,transaction_ref,transaction_key,pledge_id,country,step_unit,status,evidence,notes,source,source_row,environment,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $q->execute([$id,$request,$sourceKey,$name,$amount,$currency,$kind,$date,$channel,$ref ?: null,$tx,$pledge ?: null,$country,$unit,$kind==='pledge'?'pledged':'pending',$evidence,$notes,$source,$sourceRow,pci_config()['environment'],pci_now()]);
        if ($gatewayPledge) { $link=$db->prepare('INSERT INTO ops_allocations VALUES(?,?)');$link->execute([$id,$gatewayPledge]); }
        pci_audit($id,$actor,'ops_recorded',json_encode(['source'=>$source,'row'=>$sourceRow]));return ops_find($id);
    });
}
function ops_reconcile(string $id,string $evidence,string $actor): void {
    $evidence=ops_text($evidence,1000,true);
    ops_transaction(function($db) use($id,$evidence,$actor) {
        $r=ops_find($id);
        if ($r['kind']!=='payment' || $r['status']!=='pending' || $r['environment']!=='live') throw new LogicException('Only pending live receipts can be reconciled');
        if (ops_gateway_overlap($r['transaction_ref'])) throw new LogicException('Gateway overlap must be resolved before reconciliation');
        $q=$db->prepare("UPDATE ops_records SET status='reconciled',reconciled_at=? WHERE id=?");$q->execute([pci_now(),$id]);
        pci_audit($id,$actor,'ops_finance_reconciled',$evidence);
    });
}
function ops_reverse(string $id,string $reason,string $actor): void {
    $reason=ops_text($reason,1000,true);
    ops_transaction(function($db) use($id,$reason,$actor) {
        $r=ops_find($id);if ($r['status']==='reversed') throw new LogicException('Already reversed');
        $q=$db->prepare("UPDATE ops_records SET status='reversed' WHERE id=?");$q->execute([$id]);pci_audit($id,$actor,'ops_reversed',$reason);
    });
}
function ops_consent(string $id,bool $name,bool $amount,string $evidence,string $actor): void {
    ops_find($id);$evidence=ops_text($evidence,1000,true);
    ops_transaction(function($db) use($id,$name,$amount,$evidence,$actor) {
        $q=$db->prepare('INSERT INTO ops_consent VALUES(?,?,?,?,?) ON CONFLICT(record_id) DO UPDATE SET display_name=excluded.display_name,display_amount=excluded.display_amount,evidence=excluded.evidence,updated_at=excluded.updated_at');
        $q->execute([$id,(int)$name,(int)$amount,$evidence,pci_now()]);pci_audit($id,$actor,'ops_consent_changed',json_encode(['name'=>$name,'amount'=>$amount,'evidence'=>$evidence]));
    });
}
function ops_totals(): array {
    $db=ops_db();$currencies=[];$last=null;$steps=0;$stepAmounts=[];
    $bucket=static function(string $c) use(&$currencies) { if (!isset($currencies[$c])) $currencies[$c]=['currency'=>$c,'received'=>0,'pending'=>0,'pledged'=>0,'outstanding'=>0]; };
    $manual=$db->query("SELECT r.*,a.pledge_ref gateway_pledge_id FROM ops_records r LEFT JOIN ops_allocations a ON a.receipt_id=r.id WHERE r.environment='live'")->fetchAll();$paid=[];
    foreach($manual as $r) {
        $c=$r['currency'];$bucket($c);$n=(int)$r['amount'];
        if ($r['kind']==='payment' && $r['status']!=='reversed' && !ops_gateway_overlap((string)$r['transaction_ref'])) {
            if ($r['status']==='reconciled') {
                $currencies[$c]['received']+=$n;if ((int)$r['step_unit']>0) { $group=($r['pledge_id'] ?: ($r['gateway_pledge_id'] ?: $r['id'])).'|'.$c.'|'.$r['country'].'|'.$r['step_unit'];$stepAmounts[$group]=['amount'=>($stepAmounts[$group]['amount'] ?? 0)+$n,'unit'=>(int)$r['step_unit']]; }
                $last=max($last ?? '',$r['reconciled_at']);$linked=$r['pledge_id'] ?: $r['gateway_pledge_id'];if ($linked) $paid[$linked]=($paid[$linked] ?? 0)+$n;
            } else $currencies[$c]['pending']+=$n;
        }
    }
    foreach($manual as $r) if($r['kind']==='pledge' && $r['status']==='pledged') {
        $currencies[$r['currency']]['pledged']+=(int)$r['amount'];
        $currencies[$r['currency']]['outstanding']+=max(0,(int)$r['amount']-($paid[$r['id']] ?? 0));
    }
    // Gateway rows are authoritative for their own identities. No legacy aggregate is ever added.
    foreach($db->query("SELECT * FROM contributions WHERE environment='live' AND campaign='walk-for-education-2026'") as $r) {
        $c=$r['currency'];$bucket($c);$n=(int)$r['amount'];
        if ($r['kind']==='pledge' && $r['status']==='pledged') { $currencies[$c]['pledged']+=$n;$currencies[$c]['outstanding']+=max(0,$n-($paid[$r['reference']] ?? 0)); }
        if ($r['kind']==='payment' && $r['status']==='successful' && $r['reconciled_at']) {
            $currencies[$c]['received']+=$n;$steps+=(int)$r['steps'];$last=max($last ?? '',$r['reconciled_at']);
        } elseif($r['kind']==='payment' && in_array($r['status'],['pending','successful','submitted'],true)) $currencies[$c]['pending']+=$n;
    }
    foreach($stepAmounts as $funded) $steps+=intdiv($funded['amount'],$funded['unit']);
    ksort($currencies);$milestone=json_decode(pci_setting('ops_milestone'),true) ?: null;
    if($milestone) { unset($milestone['approval'],$milestone['approvedBy']);$received=$currencies[$milestone['currency']]['received'] ?? 0;$milestone['remaining']=max(0,$milestone['amount']-$received); }
    return ['currencies'=>array_values($currencies),'confirmedSteps'=>$steps,'lastReconciledAt'=>$last,'milestone'=>$milestone,'policy'=>'Itemised reconciled manual receipts plus gateway receipts; gateway identity takes precedence. Legacy aggregate totals excluded. Currencies never converted.'];
}
function ops_walk_validate(array $b): array {
    $activity=$b['activity'] ?? ''; $physical=$b['physical'] ?? '';
    if (!in_array($activity,['preparing','active','paused','completed','archived'],true) || !in_array($physical,['preparing','on-the-road','resting','arrived','completed'],true)) throw new InvalidArgumentException('Choose campaign and walking states');
    $km=$b['km'] ?? null;if (!is_int($km) || $km<0 || $km>5000) throw new InvalidArgumentException('Use confirmed whole kilometres, 0–5000');
    $photo=ops_text($b['photo'] ?? '',250);$alt=ops_text($b['photoAlt'] ?? '',200,$photo!=='');
    if($photo!=='' && (!preg_match('#^assets/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$#D',$photo) || !is_file(dirname(__DIR__,2).'/'.$photo))) throw new InvalidArgumentException('Choose an existing approved campaign photograph');
    return ['activity'=>$activity,'physical'=>$physical,'km'=>$km,'date'=>ops_date($b['date'] ?? ''),'town'=>ops_text($b['town'] ?? '',100,true),'story'=>ops_text($b['story'] ?? '',1200,true),'photo'=>$photo,'photoAlt'=>$alt];
}
function ops_walk(array $b,string $actor,bool $publish): array {
    $payload=ops_walk_validate($b);
    return ops_transaction(function($db) use($payload,$actor,$publish,$b) {
        $expected=(int)($b['baseVersion'] ?? 0);$current=(int)$db->query('SELECT COALESCE(MAX(id),0) FROM ops_walk WHERE published_at IS NOT NULL')->fetchColumn();
        if ($expected!==$current) throw new LogicException('Another update was published; refresh before saving');
        $now=pci_now();$q=$db->prepare('INSERT INTO ops_walk(payload,actor,created_at,published_at) VALUES(?,?,?,?)');$q->execute([json_encode($payload),$actor,$now,$publish?$now:null]);$id=(int)$db->lastInsertId();
        pci_audit(null,$actor,$publish?'ops_walk_published':'ops_walk_draft',(string)$id);return ['id'=>$id,'walk'=>$payload];
    });
}
function ops_public(): array {
    $db=ops_db();$r=$db->query('SELECT * FROM ops_walk WHERE published_at IS NOT NULL ORDER BY id DESC LIMIT 1')->fetch();
    $t=ops_totals();unset($t['policy']);
    $supporters=[];
    foreach($db->query("SELECT r.*,c.display_name,c.display_amount FROM ops_records r JOIN ops_consent c ON c.record_id=r.id WHERE r.kind='payment' AND r.status='reconciled' AND r.environment='live' AND (c.display_name=1 OR c.display_amount=1) ORDER BY r.created_at DESC") as $s) {
        if(ops_gateway_overlap((string)$s['transaction_ref'])) continue;
        $supporters[]=['name'=>$s['display_name']?$s['name']:'Anonymous supporter','amount'=>$s['display_amount']?(int)$s['amount']:null,'currency'=>$s['display_amount']?$s['currency']:null];
    }
    return ['schema'=>1,'available'=>true,'reportingCutoff'=>pci_now(),'verificationLabel'=>'Finance-reconciled receipts only','totals'=>$t,'walk'=>$r?json_decode($r['payload'],true):null,'version'=>$r?(int)$r['id']:0,'approvedAt'=>$r?$r['published_at']:null,'supporters'=>$supporters];
}
function ops_snapshot(string $actor): array {
    // No names or private fields in persisted financial/graphic snapshots. Recognition is checked afresh.
    return ops_transaction(function($db) use($actor) {
        $data=ops_public();unset($data['supporters']);$id=bin2hex(random_bytes(16));$data['snapshotId']=$id;
        $q=$db->prepare('INSERT INTO ops_snapshots VALUES(?,?,?,?)');$q->execute([$id,json_encode($data),$actor,pci_now()]);pci_audit(null,$actor,'ops_snapshot_created',$id);return $data;
    });
}
function ops_import_preview(array $b): array {
    $rows=$b['rows'] ?? []; $mapping=$b['mapping'] ?? []; $source=ops_text($b['source'] ?? '',200,true);
    if (!is_array($rows) || count($rows)>500 || !is_array($mapping)) throw new InvalidArgumentException('Preview at most 500 rows');
    $preview=[];$seen=[];
    foreach($rows as $i=>$raw) {
        $out=['source'=>$source,'sourceRow'=>(string)($i+2),'requestId'=>hash('sha256',$source.'|'.($i+2)),'kind'=>'payment'];$issues=[];
        if(!is_array($raw)) throw new InvalidArgumentException('Invalid source row');
        foreach(['name','amount','currency','date','channel','transactionRef','pledgeId','country','stepUnit','kind'] as $key) {
            $v=$raw[$mapping[$key] ?? $key] ?? '';
            if(!is_scalar($v)) $v='';
            $out[$key]=$v;
        }
        $out['kind']=$out['kind']===''?'payment':strtolower((string)$out['kind']);
        if(!in_array($out['kind'],['payment','pledge'],true)) $issues[]='Record type must be payment or pledge';
        foreach(['amount','stepUnit'] as $key) {
            $v=(string)$out[$key];if($key==='stepUnit' && $v==='') $v='0';
            if(!preg_match('/^\d{1,13}$/D',$v)) $issues[]='Invalid '.$key.'; use unformatted whole units';
            $out[$key]=preg_match('/^\d{1,13}$/D',$v)?(int)$v:0;
        }
        $required=['name','currency','date'];if($out['kind']==='payment') $required=array_merge($required,['channel','transactionRef']);
        foreach($required as $key) if(trim((string)$out[$key])==='') $issues[]='Missing '.$key;
        try { ops_date((string)$out['date']); } catch(Throwable $e) { $issues[]='Invalid date'; }
        if($out['amount']<=0 || $out['amount']>1000000000000) $issues[]='Invalid amount';
        if(!in_array($out['currency'],['UGX','KES','USD','GBP','EUR'],true)) $issues[]='Invalid currency';
        $tx=ops_key((string)$out['transactionRef']);
        $q=ops_db()->prepare('SELECT id FROM ops_records WHERE transaction_key=? OR source_key=?');$q->execute([$tx,hash('sha256',strtolower($source).'|'.$out['sourceRow'])]);
        if($q->fetch() || ($out['kind']==='payment' && (isset($seen[$tx]) || ops_gateway_overlap((string)$out['transactionRef'])))) $issues[]='Duplicate candidate';
        $seen[$tx]=true;$out['notes']='Original source row: '.json_encode($raw,JSON_UNESCAPED_UNICODE);
        if(strlen($out['notes'])>2000) $issues[]='Original source row exceeds 2000 bytes; review manually';
        $preview[]=['record'=>$out,'issues'=>$issues,'review'=>'Awaiting finance verification; imported paid labels never count as received'];
    }
    return $preview;
}
