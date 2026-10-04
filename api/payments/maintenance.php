<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404);exit; }
require dirname(__DIR__).'/lib/payments.php';
try {
    $mode=$argv[1] ?? 'recheck';
    if ($mode==='backup') { echo pci_backup().PHP_EOL;exit; }
    if ($mode!=='recheck') throw new InvalidArgumentException('Use recheck or backup');
    $env=pci_config()['environment'];$q=pci_db()->prepare("SELECT * FROM contributions WHERE kind='payment' AND tracking_id IS NOT NULL AND environment=? AND (status IN ('pending','cancelled') OR (status='successful' AND updated_at>=?)) ORDER BY updated_at ASC LIMIT 100");$q->execute([$env,gmdate('c',time()-30*86400)]);
    $errors=0;foreach ($q->fetchAll() as $row) { try { pci_verify($row);echo $row['reference']." checked\n"; } catch(Throwable $e) { $errors++;echo $row['reference']." needs review\n"; } }
    exit($errors?1:0);
} catch(Throwable $e) { fwrite(STDERR,"Maintenance could not complete\n");exit(1); }
