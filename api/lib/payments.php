<?php
declare(strict_types=1);

/* Shared payment logic. Secrets and the SQLite ledger live outside the document root. */
function pci_config(): array {
    static $config;
    if ($config !== null) return $config;
    $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 2)) ?: dirname(__DIR__, 2);
    $private = getenv('PCI_PRIVATE_DIR') ?: dirname($root) . '/pci-private';
    if (!is_dir($private) && !mkdir($private, 0700, true) && !is_dir($private)) throw new RuntimeException('Private storage unavailable');
    $private = realpath($private);
    if (!$private || $private === $root || strpos($private, $root . DIRECTORY_SEPARATOR) === 0) throw new RuntimeException('Private storage must be outside the website');
    $local = is_file($private . '/config.php') ? require $private . '/config.php' : [];
    if (!is_array($local)) throw new RuntimeException('Invalid configuration');
    $get = static function ($key, $default = '') use ($local) { $env = getenv('PCI_' . strtoupper($key)); return $env === false ? ($local[$key] ?? $default) : $env; };
    $config = [
        'private_dir' => $private, 'environment' => $get('environment', 'live'),
        'consumer_key' => $get('consumer_key'), 'consumer_secret' => $get('consumer_secret'),
        'site_url' => rtrim((string)$get('site_url', 'https://pamodzici.com'), '/'),
        'checkout_enabled' => filter_var($get('checkout_enabled', false), FILTER_VALIDATE_BOOLEAN),
        'live_approved' => filter_var($get('live_approved', false), FILTER_VALIDATE_BOOLEAN),
        'policies_approved' => filter_var($get('policies_approved', false), FILTER_VALIDATE_BOOLEAN),
        'admin_users' => $local['admin_users'] ?? [],
    ];
    if (!in_array($config['environment'], ['sandbox', 'live'], true)) throw new RuntimeException('Invalid environment');
    if (!preg_match('#^https://[a-z0-9.-]+(?::[0-9]+)?(?:/[a-zA-Z0-9_-]+)*$#', $config['site_url'])) throw new RuntimeException('Invalid site URL');
    return $config;
}

function pci_db(): PDO {
    static $db;
    if ($db) return $db;
    if (!extension_loaded('pdo_sqlite')) throw new RuntimeException('PDO SQLite is required');
    $db = new PDO('sqlite:' . pci_config()['private_dir'] . '/collections.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $db->exec('PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
    $db->exec("CREATE TABLE IF NOT EXISTS contributions (
        reference TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, campaign TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK(amount>0), currency TEXT NOT NULL DEFAULT 'UGX', kind TEXT NOT NULL,
        name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, referral TEXT NOT NULL,
        environment TEXT NOT NULL, status TEXT NOT NULL, tracking_id TEXT UNIQUE, redirect_url TEXT,
        viewer_hash TEXT NOT NULL, confirmation TEXT, method TEXT, receipt TEXT UNIQUE,
        reconciled_at TEXT, settlement_reference TEXT, fee INTEGER, net INTEGER,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT, actor TEXT NOT NULL, event TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);");
    @chmod(pci_config()['private_dir'] . '/collections.sqlite', 0600);
    return $db;
}

function pci_now(): string { return gmdate('c'); }
function pci_find(string $reference): ?array { $q=pci_db()->prepare('SELECT * FROM contributions WHERE reference=?'); $q->execute([$reference]); return $q->fetch() ?: null; }
function pci_setting(string $key): string { $q=pci_db()->prepare('SELECT value FROM settings WHERE key=?');$q->execute([$key]);return (string)($q->fetchColumn() ?: ''); }
function pci_set(string $key,string $value): void { $q=pci_db()->prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');$q->execute([$key,$value]); }
function pci_audit(?string $ref,string $actor,string $event,string $detail=''): void { $q=pci_db()->prepare('INSERT INTO audit(reference,actor,event,detail,created_at) VALUES(?,?,?,?,?)');$q->execute([$ref,$actor,$event,$detail,pci_now()]); }
function pci_limit(string $bucket,int $max,int $seconds): void {
    $key=hash('sha256',$bucket.'|'.($_SERVER['REMOTE_ADDR'] ?? 'cli'));$now=time();$db=pci_db();
    $db->exec('BEGIN IMMEDIATE');
    try {
        $q=$db->prepare('SELECT count,expires FROM limits WHERE key=?');$q->execute([$key]);$r=$q->fetch();
        if ($r && (int)$r['expires']>$now && (int)$r['count']>=$max) { $db->exec('ROLLBACK'); throw new OverflowException('Please wait before trying again'); }
        $count=($r && (int)$r['expires']>$now)?(int)$r['count']+1:1;$expires=($r && (int)$r['expires']>$now)?(int)$r['expires']:$now+$seconds;
        $q=$db->prepare('INSERT INTO limits(key,count,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,expires=excluded.expires');$q->execute([$key,$count,$expires]);
        $q=$db->prepare('DELETE FROM limits WHERE expires<?');$q->execute([$now]);$db->exec('COMMIT');
    } catch (Throwable $e) { if ($db->inTransaction()) $db->exec('ROLLBACK');throw $e; }
}

function pci_checkout_ready(): bool {
    $c=pci_config();
    return $c['checkout_enabled'] && $c['policies_approved'] && $c['consumer_key'] !== '' && $c['consumer_secret'] !== ''
        && ($c['environment'] !== 'live' || $c['live_approved']) && pci_setting('ipn_'.$c['environment']) !== '';
}

function pci_http(string $path,?array $body=null,?string $token=null): array {
    if (PHP_SAPI === 'cli' && isset($GLOBALS['pci_test_transport'])) return ($GLOBALS['pci_test_transport'])($path,$body,$token);
    if (!extension_loaded('curl')) throw new RuntimeException('cURL is required');
    $base=pci_config()['environment']==='live'?'https://pay.pesapal.com/v3/api/':'https://cybqa.pesapal.com/pesapalv3/api/';
    $h=curl_init($base.$path);$headers=['Accept: application/json','Content-Type: application/json'];
    if ($token) $headers[]='Authorization: Bearer '.$token;
    curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>25,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
    if ($body !== null) { curl_setopt($h,CURLOPT_POST,true);curl_setopt($h,CURLOPT_POSTFIELDS,json_encode($body,JSON_THROW_ON_ERROR)); }
    $raw=curl_exec($h);$code=curl_getinfo($h,CURLINFO_HTTP_CODE);curl_close($h);
    $out=is_string($raw)?json_decode($raw,true):null;
    if ($code<200 || $code>=300 || !is_array($out) || (isset($out['status']) && (int)$out['status']!==200)) throw new RuntimeException('Payment provider unavailable');
    if (!empty($out['error']) && (!is_array($out['error']) || array_filter($out['error']))) throw new RuntimeException('Payment provider rejected request');
    return $out;
}
function pci_token(): string {
    $c=pci_config();if (!$c['consumer_key'] || !$c['consumer_secret']) throw new RuntimeException('Pesapal access is not configured');
    $r=pci_http('Auth/RequestToken',['consumer_key'=>$c['consumer_key'],'consumer_secret'=>$c['consumer_secret']]);
    if (empty($r['token']) || !is_string($r['token'])) throw new RuntimeException('Payment authentication unavailable');return $r['token'];
}
function pci_register_ipn(string $actor='admin'): string {
    $c=pci_config();$r=pci_http('URLSetup/RegisterIPN',['url'=>$c['site_url'].'/api/payments/ipn.php','ipn_notification_type'=>'POST'],pci_token());
    if (empty($r['ipn_id']) || !preg_match('/^[a-f0-9-]{36}$/i',$r['ipn_id'])) throw new RuntimeException('Notification registration failed');
    pci_set('ipn_'.$c['environment'],$r['ipn_id']);pci_audit(null,$actor,'ipn_registered',$c['environment']);return $r['ipn_id'];
}

function pci_validate(array $body): array {
    $campaign=$body['campaign'] ?? '';if ($campaign !== 'walk-for-education-2026') throw new InvalidArgumentException('Choose an approved campaign');
    $amount=$body['amount'] ?? null;if (!is_int($amount) || $amount<1000 || $amount>100000000) throw new InvalidArgumentException('Enter a whole UGX amount between 1,000 and 100,000,000');
    $kind=$body['kind'] ?? 'payment';if (!in_array($kind,['payment','pledge'],true)) throw new InvalidArgumentException('Invalid contribution type');
    $text=static function($value,int $max): string { if (!is_string($value) || strlen($value)>$max || preg_match('/[\x00-\x1f\x7f]/',$value)) throw new InvalidArgumentException('Check your contact details');return trim($value); };
    $name=$text($body['name'] ?? '',120);$email=$text($body['email'] ?? '',180);$phone=$text($body['phone'] ?? '',30);$referral=$text($body['referral'] ?? '',60);
    if ($name === '' || ($email === '' && $phone === '')) throw new InvalidArgumentException('Provide your name and phone or email');
    if ($email !== '' && !filter_var($email,FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Enter a valid email address');
    if ($phone !== '' && !preg_match('/^\+?[0-9 ()-]{7,25}$/',$phone)) throw new InvalidArgumentException('Enter a valid phone number');
    if (($body['consent'] ?? false) !== true) throw new InvalidArgumentException('Please agree to the contribution privacy notice');
    if (!is_string($body['requestId'] ?? null) || !preg_match('/^[a-zA-Z0-9-]{16,80}$/',$body['requestId'])) throw new InvalidArgumentException('Invalid request reference');
    return compact('campaign','amount','kind','name','email','phone','referral');
}

function pci_create(array $body,string $owner): array {
    $v=pci_validate($body);$db=pci_db();$c=pci_config();$key=hash('sha256',$owner.'|'.$body['requestId']);
    $q=$db->prepare('SELECT * FROM contributions WHERE request_key=?');$q->execute([$key]);$prior=$q->fetch();
    if ($prior) {
        foreach (['campaign','amount','kind','name','email','phone','referral'] as $f) if ((string)$prior[$f] !== (string)$v[$f]) throw new InvalidArgumentException('This request was already used; start a new contribution');
        return $prior;
    }
    if ($v['kind']==='payment' && !pci_checkout_ready()) throw new LogicException('Online payments are not open yet. You can record a pledge or contact PCI.');
    $ref='PCI-'.gmdate('Ymd').'-'.strtoupper(bin2hex(random_bytes(6)));$view=bin2hex(random_bytes(32));$now=pci_now();
    $env=$c['environment'];$state=$v['kind']==='pledge'?'pledged':'pending';
    $q=$db->prepare('INSERT INTO contributions(reference,request_key,campaign,amount,kind,name,email,phone,referral,environment,status,viewer_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $q->execute([$ref,$key,$v['campaign'],$v['amount'],$v['kind'],$v['name'],$v['email'],$v['phone'],$v['referral'],$env,$state,hash('sha256',$view),$now,$now]);
    $_SESSION['pci_view'][$ref]=$view;
    pci_audit($ref,'supporter','created',$v['kind']);
    if ($v['kind']==='payment') {
        try {
            $r=pci_http('Transactions/SubmitOrderRequest',[
                'id'=>$ref,'currency'=>'UGX','amount'=>$v['amount'],'description'=>'Walk for Education contribution',
                'callback_url'=>$c['site_url'].'/api/payments/return.php','cancellation_url'=>$c['site_url'].'/api/payments/return.php?cancelled=1&reference='.rawurlencode($ref),
                'notification_id'=>pci_setting('ipn_'.$c['environment']),
                'billing_address'=>['first_name'=>$v['name'],'email_address'=>$v['email'],'phone_number'=>$v['phone']]
            ],pci_token());
            $url=$r['redirect_url'] ?? ''; $expected=$env==='live'?'pay.pesapal.com':'cybqa.pesapal.com';
            if (($r['merchant_reference'] ?? '')!==$ref || !preg_match('/^[a-f0-9-]{36}$/i',$r['order_tracking_id'] ?? '') || parse_url($url,PHP_URL_SCHEME)!=='https' || parse_url($url,PHP_URL_HOST)!==$expected) throw new RuntimeException('Invalid provider response');
            $q=$db->prepare('UPDATE contributions SET tracking_id=?,redirect_url=?,updated_at=? WHERE reference=?');$q->execute([$r['order_tracking_id'],$url,pci_now(),$ref]);
            pci_audit($ref,'gateway','order_submitted');
        } catch (Throwable $e) {
            /* Submission can have reached Pesapal before a timeout. Never automatically create a second order. */
            pci_audit($ref,'system','submission_needs_review');
        }
    }
    return pci_find($ref);
}

function pci_apply_status(array $row,array $reply): array {
    if (($reply['merchant_reference'] ?? '')!==$row['reference'] || strtoupper((string)($reply['currency'] ?? ''))!==$row['currency']
        || !is_numeric($reply['amount'] ?? null) || abs((float)$reply['amount']-(int)$row['amount'])>0.001) throw new UnexpectedValueException('Transaction details do not match');
    $map=[0=>'pending',1=>'successful',2=>'failed',3=>'refunded'];
    $code=filter_var($reply['status_code'] ?? null,FILTER_VALIDATE_INT);if ($code===false || !array_key_exists($code,$map)) throw new UnexpectedValueException('Unrecognised payment status');
    $state=$map[$code];$db=pci_db();$db->exec('BEGIN IMMEDIATE');
    try {
        $current=pci_find($row['reference']);
        /* An older pending notification cannot erase a verified completion or reversal. */
        if ($current['status']==='refunded' || ($state==='pending' && in_array($current['status'],['successful','failed','cancelled'],true))) $state=$current['status'];
        if ($current['status']==='successful' && $state==='failed') $state='successful';
        $receipt=$current['receipt'];if ($state==='successful' && !$receipt) $receipt='R-'.$current['reference'];
        $q=$db->prepare('UPDATE contributions SET status=?,confirmation=?,method=?,receipt=?,updated_at=? WHERE reference=?');
        $q->execute([$state,substr((string)($reply['confirmation_code'] ?? ''),0,100),substr((string)($reply['payment_method'] ?? ''),0,50),$receipt,pci_now(),$row['reference']]);
        if ($current['status']!==$state) pci_audit($row['reference'],'gateway','status_changed',$current['status'].' -> '.$state);
        $db->exec('COMMIT');
    } catch(Throwable $e) { if ($db->inTransaction()) $db->exec('ROLLBACK');throw $e; }
    return pci_find($row['reference']);
}

function pci_verify(array $row): array {
    if ($row['kind']!=='payment' || !$row['tracking_id']) return $row;
    if ($row['environment']!==pci_config()['environment']) throw new LogicException('Use the matching gateway environment to verify this payment');
    $r=pci_http('Transactions/GetTransactionStatus?orderTrackingId='.rawurlencode($row['tracking_id']),null,pci_token());
    return pci_apply_status($row,$r);
}
function pci_public_row(array $row): array {
    return array_intersect_key($row,array_flip(['reference','campaign','amount','currency','kind','environment','status','receipt','method','created_at','updated_at','reconciled_at']));
}
function pci_totals(): array {
    $q=pci_db()->query("SELECT COALESCE(SUM(CASE WHEN kind='payment' AND status='successful' THEN amount ELSE 0 END),0) successful,
        COALESCE(SUM(CASE WHEN kind='payment' AND status='successful' AND reconciled_at IS NOT NULL THEN amount ELSE 0 END),0) reconciled,
        COALESCE(SUM(CASE WHEN kind='pledge' AND status='pledged' THEN amount ELSE 0 END),0) pledged,
        COALESCE(SUM(CASE WHEN kind='payment' AND status='successful' AND reconciled_at IS NOT NULL THEN fee ELSE 0 END),0) fees,
        COALESCE(SUM(CASE WHEN kind='payment' AND status='successful' AND reconciled_at IS NOT NULL THEN net ELSE 0 END),0) net,
        MAX(CASE WHEN kind='payment' AND status='successful' AND reconciled_at IS NOT NULL THEN reconciled_at END) lastReconciledAt
        FROM contributions WHERE environment='live'");return $q->fetch();
}
function pci_reconcile(string $reference,string $settlement,int $fee,string $actor): void {
    $row=pci_find($reference);
    if (!$row || $row['kind']!=='payment' || $row['status']!=='successful' || $row['environment']!=='live') throw new InvalidArgumentException('Only verified successful live payments can be reconciled');
    if (trim($settlement)==='' || strlen($settlement)>100 || $fee<0 || $fee>(int)$row['amount']) throw new InvalidArgumentException('Check settlement reference and fee');
    $db=pci_db();$db->exec('BEGIN IMMEDIATE');
    try {
        $fresh=pci_find($reference);if ($fresh['status']!=='successful') throw new InvalidArgumentException('Payment status changed; reload the record');
        $q=$db->prepare('UPDATE contributions SET reconciled_at=?,settlement_reference=?,fee=?,net=?,updated_at=? WHERE reference=?');$now=pci_now();$q->execute([$now,trim($settlement),$fee,(int)$row['amount']-$fee,$now,$reference]);
        pci_audit($reference,$actor,'finance_reconciled',trim($settlement));$db->exec('COMMIT');
    } catch(Throwable $e) { if ($db->inTransaction()) $db->exec('ROLLBACK');throw $e; }
}

function pci_session(): void {
    if (session_status()===PHP_SESSION_ACTIVE) return;
    $dir=pci_config()['private_dir'].'/sessions';if (!is_dir($dir) && !mkdir($dir,0700,true) && !is_dir($dir)) throw new RuntimeException('Session storage unavailable');
    session_save_path($dir);ini_set('session.use_strict_mode','1');
    session_name('pci_collections');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);
    if (!session_start()) throw new RuntimeException('Session unavailable');
    if (empty($_SESSION['pci_csrf'])) $_SESSION['pci_csrf']=bin2hex(random_bytes(32));
}
function pci_require_admin(): string {
    pci_session();
    if (empty($_SESSION['pci_admin']) || time()-(int)($_SESSION['pci_active'] ?? 0)>1800) throw new DomainException('Sign in to the collections console');
    $_SESSION['pci_active']=time();return $_SESSION['pci_admin'];
}
function pci_require_csrf(): void {
    if (!hash_equals($_SESSION['pci_csrf'],(string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) throw new DomainException('Session expired; reload this page');
}
function pci_login(string $username,string $password): bool {
    $users=pci_config()['admin_users'];
    if (!$users) { require_once dirname(__DIR__).'/config.php';$users=['admin'=>['hash'=>FIM_ADMIN_PASSWORD_HASH,'role'=>'admin']]; }
    $u=$users[$username] ?? null;
    if (!$u || !password_verify($password,(string)($u['hash'] ?? ''))) return false;
    session_regenerate_id(true);$_SESSION['pci_admin']=$username;$_SESSION['pci_role']=$u['role'] ?? 'viewer';$_SESSION['pci_active']=time();$_SESSION['pci_csrf']=bin2hex(random_bytes(32));return true;
}
function pci_require_role(array $roles): void { if (!in_array($_SESSION['pci_role'] ?? '',$roles,true)) throw new DomainException('Your account cannot perform this action'); }
function pci_backup(): string {
    $dir=pci_config()['private_dir'].'/backups';if (!is_dir($dir)) mkdir($dir,0700,true);
    $file=$dir.'/collections-'.gmdate('Ymd-His').'-'.bin2hex(random_bytes(3)).'.sqlite';
    pci_db()->exec('VACUUM INTO '.pci_db()->quote($file));chmod($file,0600);return basename($file);
}
