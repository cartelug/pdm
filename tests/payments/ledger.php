<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404);exit; }
$temp=sys_get_temp_dir().'/pci-ledger-test-'.bin2hex(random_bytes(8));mkdir($temp,0700);
putenv('PCI_PRIVATE_DIR='.$temp);putenv('PCI_ENVIRONMENT=live');putenv('PCI_CONSUMER_KEY=test-key');putenv('PCI_CONSUMER_SECRET=test-secret');putenv('PCI_POLICIES_APPROVED=true');putenv('PCI_LIVE_APPROVED=true');putenv('PCI_CHECKOUT_ENABLED=true');
$_SERVER['DOCUMENT_ROOT']=dirname(__DIR__,2);$_SESSION=[];
require dirname(__DIR__,2).'/api/lib/payments.php';
$checks=0;
function check(bool $condition,string $name): void { global $checks;if (!$condition) throw new RuntimeException('FAILED: '.$name);$checks++;echo "PASS $name\n"; }
function rejects(callable $fn,string $name): void { try {$fn();}catch(Throwable $e){check(true,$name);return;}check(false,$name); }
$calls=0;$responseCode=1;
$GLOBALS['pci_test_transport']=function($path,$body,$token) use (&$calls,&$responseCode) {
    if ($path==='Auth/RequestToken') return ['token'=>'test-token','status'=>200];
    if ($path==='URLSetup/RegisterIPN') return ['ipn_id'=>'12345678-1234-1234-1234-123456789abc','status'=>200];
    if ($path==='Transactions/SubmitOrderRequest') { $calls++;return ['merchant_reference'=>$body['id'],'order_tracking_id'=>sprintf('%08x-1234-1234-1234-123456789abc',$calls),'redirect_url'=>'https://pay.pesapal.com/checkout/test','status'=>200]; }
    $tracking=substr($path,strpos($path,'=')+1);$q=pci_db()->prepare('SELECT * FROM contributions WHERE tracking_id=?');$q->execute([$tracking]);$row=$q->fetch();
    return ['merchant_reference'=>$row['reference'],'amount'=>$row['amount'],'currency'=>'UGX','status_code'=>$responseCode,'confirmation_code'=>'CONFIRMED-TEST','payment_method'=>'MTN','status'=>200];
};
$body=['campaign'=>'walk-for-education-2026','amount'=>50000,'kind'=>'payment','name'=>'Test Supporter','email'=>'supporter@example.com','phone'=>'','referral'=>'test-club','consent'=>true,'requestId'=>'test-payment-request-001'];
try {
    check(!pci_checkout_ready(),'checkout closed before IPN registration');
    pci_register_ipn();check(pci_checkout_ready(),'checkout requires all configured gates');
    $row=pci_create($body,'owner-session');check($row['status']==='pending' && $row['tracking_id']!==null,'order starts pending with tracking ID');
    $again=pci_create($body,'owner-session');check($again['reference']===$row['reference'] && $calls===1,'duplicate request submits one gateway order');
    $changed=$body;$changed['amount']=70000;rejects(fn()=>pci_create($changed,'owner-session'),'same request cannot change amount');
    $bad=$body;$bad['campaign']='faith-in-motion';rejects(fn()=>pci_validate($bad),'different beneficiary cannot be pooled');
    $bad=$body;$bad['amount']=50000.5;rejects(fn()=>pci_validate($bad),'fractional UGX rejected');
    $bad=$body;$bad['consent']=false;rejects(fn()=>pci_validate($bad),'missing consent rejected');
    $bad=$body;$bad['email']='bad-address';rejects(fn()=>pci_validate($bad),'invalid contact rejected');
    rejects(fn()=>pci_reconcile($row['reference'],'SETTLE',0,'finance'),'pending payment cannot be reconciled');
    $reply=['merchant_reference'=>$row['reference'],'amount'=>50000,'currency'=>'UGX','status_code'=>1];
    $wrong=$reply;$wrong['amount']=49999;rejects(fn()=>pci_apply_status($row,$wrong),'amount mismatch rejected');
    $wrong=$reply;$wrong['currency']='USD';rejects(fn()=>pci_apply_status($row,$wrong),'currency mismatch rejected');
    $wrong=$reply;$wrong['merchant_reference']='OTHER';rejects(fn()=>pci_apply_status($row,$wrong),'merchant reference mismatch rejected');
    $wrong=$reply;$wrong['status_code']=99;rejects(fn()=>pci_apply_status($row,$wrong),'unknown status rejected');
    $paid=pci_verify($row);check($paid['status']==='successful' && $paid['receipt']!==null,'server verification issues receipt');
    $duplicate=pci_verify($paid);check($duplicate['receipt']===$paid['receipt'],'repeated notification retains one receipt');
    check((int)pci_totals()['successful']===50000 && (int)pci_totals()['reconciled']===0,'successful funds remain outside public total until reconciled');
    rejects(fn()=>pci_reconcile($paid['reference'],'',0,'finance'),'settlement reference required');
    rejects(fn()=>pci_reconcile($paid['reference'],'SETTLE',50001,'finance'),'invalid fee rejected');
    pci_reconcile($paid['reference'],'SETTLE-001',1000,'finance');$t=pci_totals();check((int)$t['reconciled']===50000 && (int)$t['net']===49000 && (int)$t['fees']===1000,'gross, fees and net settlement kept separate');
    pci_reconcile($paid['reference'],'SETTLE-001',1000,'finance');check((int)pci_totals()['reconciled']===50000,'reconciliation never double counts');
    $responseCode=0;$late=pci_verify($paid);check($late['status']==='successful','stale pending callback cannot undo success');
    $responseCode=3;$reversed=pci_verify($paid);check($reversed['status']==='refunded' && (int)pci_totals()['reconciled']===0,'reversal removes received and settled totals');
    $responseCode=1;check(pci_verify($paid)['status']==='refunded','late completion cannot undo reversal');
    $pledge=$body;$pledge['kind']='pledge';$pledge['requestId']='test-pledge-request-001';$p=pci_create($pledge,'owner-session');check($p['status']==='pledged' && $p['tracking_id']===null && $calls===1,'pledge never submits to gateway');
    check((int)pci_totals()['pledged']===50000 && (int)pci_totals()['reconciled']===0,'pledges counted separately');
    rejects(fn()=>pci_reconcile($p['reference'],'SETTLE',0,'finance'),'pledge cannot become received through reconciliation');
    $db=pci_db();$db->exec("UPDATE contributions SET environment='sandbox' WHERE kind='pledge'");check((int)pci_totals()['pledged']===0,'sandbox excluded from public totals');
    check(!array_key_exists('email',pci_public_row($p)) && !array_key_exists('phone',pci_public_row($p)) && !array_key_exists('viewer_hash',pci_public_row($p)),'receipt lookup exposes no private contacts or secrets');
    $failed=$body;$failed['requestId']='test-failed-request-001';$f=pci_create($failed,'owner-session');$responseCode=2;check(pci_verify($f)['status']==='failed','failed outcome mapped correctly');
    $pending=$body;$pending['requestId']='test-pending-request-001';$n=pci_create($pending,'owner-session');$responseCode=0;check(pci_verify($n)['status']==='pending','invalid/unresolved provider status remains pending');
    $snapshot=pci_backup();$restored=new PDO('sqlite:'.$temp.'/backups/'.$snapshot);check($restored->query('SELECT count(*) FROM contributions')->fetchColumn()===$db->query('SELECT count(*) FROM contributions')->fetchColumn(),'backup reopens with matching records');
    check(is_file($temp.'/collections.sqlite') && !is_file($_SERVER['DOCUMENT_ROOT'].'/collections.sqlite'),'database stored outside website');
    $GLOBALS['pci_test_transport']=function(){throw new RuntimeException('Timeout');};$ambiguous=$body;$ambiguous['requestId']='test-timeout-request-001';$a=pci_create($ambiguous,'owner-session');check($a['status']==='pending' && $a['tracking_id']===null,'ambiguous submission preserved for review');
    check(pci_create($ambiguous,'owner-session')['reference']===$a['reference'],'retry of ambiguous request does not create second attempt');
    echo "\n$checks checks passed. No live payments were sent.\n";
} finally {
    /* Isolated fixtures only; never operate on a server ledger. */
    foreach (glob($temp.'/backups/*') ?: [] as $file) unlink($file);if(is_dir($temp.'/backups'))rmdir($temp.'/backups');
    foreach (glob($temp.'/*') ?: [] as $file) if (is_file($file)) unlink($file);rmdir($temp);
}
