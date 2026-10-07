<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404);exit; }
$temp=sys_get_temp_dir().'/pci-ledger-test-'.bin2hex(random_bytes(8));mkdir($temp,0700);
putenv('PCI_PRIVATE_DIR='.$temp);putenv('PCI_ENVIRONMENT=live');putenv('PCI_CONSUMER_KEY=test-key');putenv('PCI_CONSUMER_SECRET=test-secret');putenv('PCI_POLICIES_APPROVED=true');putenv('PCI_LIVE_APPROVED=true');putenv('PCI_CHECKOUT_ENABLED=true');putenv('PCI_PAYMENT_CURRENCIES=UGX,KES');
$_SERVER['DOCUMENT_ROOT']=dirname(__DIR__,2);$_SESSION=[];
require dirname(__DIR__,2).'/api/lib/payments.php';
require dirname(__DIR__,2).'/api/payments/certificate-pdf.php';
$checks=0;
function check(bool $condition,string $name): void { global $checks;if (!$condition) throw new RuntimeException('FAILED: '.$name);$checks++;echo "PASS $name\n"; }
function rejects(callable $fn,string $name): void { try {$fn();}catch(Throwable $e){check(true,$name);return;}check(false,$name); }
$calls=0;$responseCode=1;
$GLOBALS['pci_test_transport']=function($path,$body,$token) use (&$calls,&$responseCode) {
    if ($path==='Auth/RequestToken') return ['token'=>'test-token','status'=>200];
    if ($path==='URLSetup/RegisterIPN') return ['ipn_id'=>'12345678-1234-1234-1234-123456789abc','status'=>200];
    if ($path==='Transactions/SubmitOrderRequest') { $calls++;$GLOBALS['pci_last_order']=$body;return ['merchant_reference'=>$body['id'],'order_tracking_id'=>sprintf('%08x-1234-1234-1234-123456789abc',$calls),'redirect_url'=>'https://pay.pesapal.com/checkout/test','status'=>200]; }
    $tracking=substr($path,strpos($path,'=')+1);$q=pci_db()->prepare('SELECT * FROM contributions WHERE tracking_id=?');$q->execute([$tracking]);$row=$q->fetch();
    return ['merchant_reference'=>$row['reference'],'amount'=>$row['amount'],'currency'=>$row['currency'],'status_code'=>$responseCode,'confirmation_code'=>'CONFIRMED-TEST','payment_method'=>'MTN','status'=>200];
};
$gateway=$GLOBALS['pci_test_transport'];
$body=['campaign'=>'walk-for-education-2026','amount'=>50000,'kind'=>'payment','name'=>'Test Supporter','email'=>'supporter@example.com','phone'=>'','referral'=>'test-club','consent'=>true,'requestId'=>'test-payment-request-001'];
try {
    check(!pci_checkout_ready(),'checkout closed before IPN registration');
    pci_register_ipn();check(pci_checkout_ready(),'checkout requires all configured gates');
    $row=pci_create($body,'owner-session');check($row['status']==='pending' && $row['tracking_id']!==null,'order starts pending with tracking ID');
    check((int)$row['steps']===10 && (int)$row['step_unit']===5000,'contribution stores the fixed step-price snapshot');
    check(pci_certificate($row)===null,'pending payment has no certificate');
    $again=pci_create($body,'owner-session');check($again['reference']===$row['reference'] && $calls===1,'duplicate request submits one gateway order');
    $changed=$body;$changed['amount']=70000;rejects(fn()=>pci_create($changed,'owner-session'),'same request cannot change amount');
    $bad=$body;$bad['campaign']='faith-in-motion';rejects(fn()=>pci_validate($bad),'different beneficiary cannot be pooled');
    $bad=$body;$bad['amount']=50000.5;rejects(fn()=>pci_validate($bad),'fractional UGX rejected');
    $bad=$body;$bad['amount']=51000;rejects(fn()=>pci_validate($bad),'non-step contribution amounts rejected');
    $bad=$body;$bad['steps']=9;rejects(fn()=>pci_validate($bad),'step count cannot disagree with payment amount');
    $bad=$body;$bad['steps']=10.5;rejects(fn()=>pci_validate($bad),'fractional step counts rejected');
    $small=$body;$small['steps']=5;$small['amount']=25000;check(pci_validate($small)['steps']===5,'five steps are accepted at the UGX 25,000 minimum');
    $small['steps']=4;$small['amount']=20000;rejects(fn()=>pci_validate($small),'payment below five steps is rejected');
    $small['kind']='pledge';rejects(fn()=>pci_validate($small),'pledge below five steps is rejected');
    unset($small['steps']);rejects(fn()=>pci_validate($small),'omitting steps cannot bypass the minimum');
    $maximum=$body;$maximum['steps']=20000;$maximum['amount']=100000000;check(pci_validate($maximum)['steps']===20000,'maximum whole-step contribution remains accepted');
    $bad=$body;$bad['consent']=false;rejects(fn()=>pci_validate($bad),'missing consent rejected');
    $bad=$body;$bad['email']='bad-address';rejects(fn()=>pci_validate($bad),'invalid contact rejected');
    rejects(fn()=>pci_reconcile($row['reference'],'SETTLE',0,'finance'),'pending payment cannot be reconciled');
    $reply=['merchant_reference'=>$row['reference'],'amount'=>50000,'currency'=>'UGX','status_code'=>1];
    $wrong=$reply;$wrong['amount']=49999;rejects(fn()=>pci_apply_status($row,$wrong),'amount mismatch rejected');
    $wrong=$reply;$wrong['currency']='USD';rejects(fn()=>pci_apply_status($row,$wrong),'currency mismatch rejected');
    $wrong=$reply;$wrong['merchant_reference']='OTHER';rejects(fn()=>pci_apply_status($row,$wrong),'merchant reference mismatch rejected');
    $wrong=$reply;$wrong['status_code']=99;rejects(fn()=>pci_apply_status($row,$wrong),'unknown status rejected');
    $paid=pci_verify($row);check($paid['status']==='successful' && $paid['receipt']!==null,'server verification issues receipt');
    $certificate=pci_certificate($paid);check($certificate!==null && preg_match('/^WFE-[A-F0-9]{24}$/D',$certificate['code'])===1,'verified live payment receives an unguessable certificate code');
    $pdf=pci_certificate_pdf($paid,$certificate);check(strpos($pdf,'%PDF-1.4')===0 && strpos($pdf,'UGX 50,000')!==false && strpos($pdf,'10 steps')!==false,'certificate PDF contains verified amount and steps');
    check(strpos($pdf,$paid['email'])===false && strpos($pdf,'supporter@example.com')===false,'certificate PDF omits private contact details');
    if (getenv('PCI_TEST_CERTIFICATE_PATH')) file_put_contents(getenv('PCI_TEST_CERTIFICATE_PATH'),$pdf);
    $duplicate=pci_verify($paid);check($duplicate['receipt']===$paid['receipt'],'repeated notification retains one receipt');
    check(pci_certificate($duplicate)===$certificate && (int)pci_db()->query('SELECT count(*) FROM certificates')->fetchColumn()===1,'repeated successful callbacks preserve one certificate');
    $testOnly=$paid;$testOnly['environment']='sandbox';check(pci_certificate($testOnly)===null,'successful sandbox payment cannot unlock a certificate');
    $historic=$paid;$historic['steps']=0;$historic['step_unit']=0;check(pci_certificate($historic)===null,'historic payments without a step snapshot are not relabelled');
    $earlier=$paid;$earlier['steps']=1;$earlier['amount']=5000;check(pci_certificate_eligible($earlier),'a previously paid one-step record retains certificate eligibility after the minimum changes');
    check((int)pci_totals()['successful']===50000 && (int)pci_totals()['reconciled']===0,'successful funds remain outside public total until reconciled');
    rejects(fn()=>pci_reconcile($paid['reference'],'',0,'finance'),'settlement reference required');
    rejects(fn()=>pci_reconcile($paid['reference'],'SETTLE',50001,'finance'),'invalid fee rejected');
    pci_reconcile($paid['reference'],'SETTLE-001',1000,'finance');$t=pci_totals();check((int)$t['reconciled']===50000 && (int)$t['net']===49000 && (int)$t['fees']===1000,'gross, fees and net settlement kept separate');
    pci_reconcile($paid['reference'],'SETTLE-001',1000,'finance');check((int)pci_totals()['reconciled']===50000,'reconciliation never double counts');
    $responseCode=0;$late=pci_verify($paid);check($late['status']==='successful','stale pending callback cannot undo success');
    $responseCode=3;$reversed=pci_verify($paid);check($reversed['status']==='refunded' && (int)pci_totals()['reconciled']===0,'reversal removes received and settled totals');
    check(pci_certificate($reversed)===null,'refunded payment certificate is inactive');
    rejects(fn()=>pci_certificate_pdf($reversed,$certificate),'refunded payment cannot produce a certificate PDF');
    $responseCode=1;check(pci_verify($paid)['status']==='refunded','late completion cannot undo reversal');
    $pledge=$body;$pledge['kind']='pledge';$pledge['requestId']='test-pledge-request-001';$p=pci_create($pledge,'owner-session');check($p['status']==='pledged' && $p['tracking_id']===null && $calls===1,'pledge never submits to gateway');
    check(pci_certificate($p)===null,'pledge does not issue a certificate');
    check((int)pci_totals()['pledged']===50000 && (int)pci_totals()['reconciled']===0,'pledges counted separately');
    rejects(fn()=>pci_reconcile($p['reference'],'SETTLE',0,'finance'),'pledge cannot become received through reconciliation');
    $db=pci_db();$db->exec("UPDATE contributions SET environment='sandbox' WHERE kind='pledge'");check((int)pci_totals()['pledged']===0,'sandbox excluded from public totals');
    check(!array_key_exists('email',pci_public_row($p)) && !array_key_exists('phone',pci_public_row($p)) && !array_key_exists('viewer_hash',pci_public_row($p)),'receipt lookup exposes no private contacts or secrets');
    $failed=$body;$failed['requestId']='test-failed-request-001';$f=pci_create($failed,'owner-session');$responseCode=2;check(pci_verify($f)['status']==='failed','failed outcome mapped correctly');
    check(pci_certificate(pci_find($f['reference']))===null,'failed payment cannot unlock a certificate');
    $pending=$body;$pending['requestId']='test-pending-request-001';$n=pci_create($pending,'owner-session');$responseCode=0;check(pci_verify($n)['status']==='pending','invalid/unresolved provider status remains pending');
    $snapshot=pci_backup();$restored=new PDO('sqlite:'.$temp.'/backups/'.$snapshot);check($restored->query('SELECT count(*) FROM contributions')->fetchColumn()===$db->query('SELECT count(*) FROM contributions')->fetchColumn(),'backup reopens with matching records');
    check(is_file($temp.'/collections.sqlite') && !is_file($_SERVER['DOCUMENT_ROOT'].'/collections.sqlite'),'database stored outside website');
    $GLOBALS['pci_test_transport']=function(){throw new RuntimeException('Timeout');};$ambiguous=$body;$ambiguous['requestId']='test-timeout-request-001';$a=pci_create($ambiguous,'owner-session');check($a['status']==='pending' && $a['tracking_id']===null,'ambiguous submission preserved for review');
    check(pci_create($ambiguous,'owner-session')['reference']===$a['reference'],'retry of ambiguous request does not create second attempt');
    $GLOBALS['pci_test_transport']=$gateway; /* the timeout fixture above replaced it */
    /* Country step prices: Kenya is KES 200 per step, Uganda UGX 5,000, and every request is priced by its country. */
    $prices=pci_pricing();
    check(count($prices)>150 && $prices['KE']['currency']==='KES' && $prices['KE']['step']===200 && $prices['UG']['currency']==='UGX' && $prices['UG']['step']===5000,'price table: Kenya KES 200, Uganda UGX 5,000, every country priced');
    foreach ($prices as $code=>$price) if (!is_int($price['step']) || $price['step']<1 || !preg_match('/^[A-Z]{3}$/D',$price['currency'])) check(false,'every country has a whole-number price in a three-letter currency ('.$code.')');
    check(true,'every country has a whole-number price in a three-letter currency');
    $ke=['campaign'=>'walk-for-education-2026','country'=>'KE','kind'=>'payment','steps'=>50,'amount'=>10000,'name'=>'Kenyan Supporter','email'=>'kenya@example.com','phone'=>'','referral'=>'','consent'=>true,'requestId'=>'test-kenya-payment-001'];
    $v=pci_validate($ke);check($v['currency']==='KES' && $v['unit']===200 && $v['steps']===50 && $v['country']==='KE','a Kenyan contribution is priced per step in KES');
    $bad=$ke;$bad['amount']=250000;rejects(fn()=>pci_validate($bad),'a Ugandan-priced amount is rejected for Kenya');
    $bad=$ke;$bad['steps']=4;$bad['amount']=800;rejects(fn()=>pci_validate($bad),'four steps are rejected in KES');
    $bad=$ke;unset($bad['steps']);$bad['amount']=900;rejects(fn()=>pci_validate($bad),'omitting steps cannot bypass the KES minimum');
    $bad=$ke;$bad['country']='ZZ';rejects(fn()=>pci_validate($bad),'an unknown country is rejected');
    $bad=$ke;$bad['country']='ke';rejects(fn()=>pci_validate($bad),'country codes must be exact');
    $bad=$ke;$bad['currency']='UGX';rejects(fn()=>pci_validate($bad),'a currency that does not match the country is rejected');
    $edge=$ke;$edge['steps']=5;$edge['amount']=1000;check(pci_validate($edge)['amount']===1000,'five steps are accepted at KES 1,000');
    $edge['steps']=20000;$edge['amount']=4000000;check(pci_validate($edge)['steps']===20000,'20,000 steps are accepted at KES 4,000,000');
    $edge['amount']=4000200;rejects(fn()=>pci_validate($edge),'more than 20,000 steps are rejected in KES');
    $legacy=$ke;unset($legacy['country']);$legacy['amount']=250000;check(pci_validate($legacy)['currency']==='UGX' && pci_validate($legacy)['country']==='UG','requests without a country keep the Ugandan price');
    $kRow=pci_create($ke,'owner-session');
    check($kRow['currency']==='KES' && $kRow['country']==='KE' && (int)$kRow['amount']===10000 && (int)$kRow['step_unit']===200 && $kRow['status']==='pending','Kenyan payment stores KES, country and the step price');
    check(($GLOBALS['pci_last_order']['currency'] ?? '')==='KES' && (int)$GLOBALS['pci_last_order']['amount']===10000,'the gateway order is created in KES');
    $moved=$ke;$moved['country']='UG';$moved['amount']=250000;rejects(fn()=>pci_create($moved,'owner-session'),'a request cannot switch country after it was used');
    $responseCode=1;$kPaid=pci_verify($kRow);check($kPaid['status']==='successful' && $kPaid['currency']==='KES','a KES payment is verified against a KES provider reply');
    $wrongCurrency=['merchant_reference'=>$kRow['reference'],'amount'=>10000,'currency'=>'UGX','status_code'=>1];rejects(fn()=>pci_apply_status($kRow,$wrongCurrency),'a provider reply in a different currency is rejected');
    check(pci_certificate($kPaid)!==null,'a verified KES payment unlocks a certificate');
    $tamper=$kPaid;$tamper['step_unit']=5000;check(!pci_certificate_eligible($tamper),'a step price that does not multiply to the amount is not certified');
    $pdf=pci_certificate_pdf($kPaid,pci_certificate($kPaid));check(str_contains($pdf,'KES 10,000') && str_contains($pdf,'KES 200 per sponsored step') && !str_contains($pdf,'UGX 5,000'),'the certificate names the contribution in KES');
    $before=pci_totals();pci_reconcile($kPaid['reference'],'SETTLE-KES-001',100,'finance');$after=pci_totals();
    check((int)$after['reconciled']-(int)$before['reconciled']===250000,'campaign totals count a KES payment as its steps at the UGX 5,000 campaign step value');
    $kes=array_values(array_filter($after['byCurrency'],fn($r)=>$r['currency']==='KES'))[0] ?? [];check((int)($kes['reconciled'] ?? 0)===10000 && (int)($kes['fees'] ?? -1)===100 && (int)$after['fees']===(int)$before['fees'],'exact KES amounts are kept per currency and never mixed into UGX fees');
    $tz=$ke;$tz['country']='TZ';$tz['amount']=200000;$tz['requestId']='test-tanzania-payment-001';rejects(fn()=>pci_create($tz,'owner-session'),'online payment in a currency the gateway cannot take yet is refused');
    $tzPledge=$tz;$tzPledge['kind']='pledge';$tzPledge['requestId']='test-tanzania-pledge-001';$before=(int)pci_totals()['pledged'];$tp=pci_create($tzPledge,'owner-session');
    check($tp['status']==='pledged' && $tp['currency']==='TZS' && (int)$tp['step_unit']===4000 && (int)pci_totals()['pledged']-$before===250000,'a pledge in TZS is recorded in TZS and counted at the campaign step value');
    echo "\n$checks checks passed. No live payments were sent.\n";
} finally {
    /* Isolated fixtures only; never operate on a server ledger. */
    foreach (glob($temp.'/backups/*') ?: [] as $file) unlink($file);if(is_dir($temp.'/backups'))rmdir($temp.'/backups');
    foreach (glob($temp.'/*') ?: [] as $file) if (is_file($file)) unlink($file);rmdir($temp);
}
