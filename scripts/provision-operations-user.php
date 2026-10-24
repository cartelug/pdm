<?php
/* Host-owner CLI only. Input JSON over stdin; never put passwords or hashes in shell arguments. */
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404);exit; }
require dirname(__DIR__).'/api/lib/payments.php';
try {
  $b=json_decode(stream_get_contents(STDIN),true,32,JSON_THROW_ON_ERROR);
  if (!is_array($b) || !preg_match('/^[a-z][a-z0-9-]{2,60}$/D',$b['username'] ?? '')) throw new InvalidArgumentException('Use a named username: 3–61 lowercase letters, numbers or hyphens');
  if (!in_array($b['role'] ?? '',['admin','finance','coordinator','recorder','owner','editor','viewer'],true)) throw new InvalidArgumentException('Invalid role');
  if (!is_string($b['hash'] ?? null) || (password_get_info($b['hash'])['algoName'] ?? 'unknown')==='unknown') throw new InvalidArgumentException('Provide a password_hash output, never a plaintext password');
  $dir=pci_config()['private_dir'];$lock=fopen($dir.'/accounts.lock','c');chmod($dir.'/accounts.lock',0600);if(!$lock || !flock($lock,LOCK_EX)) throw new RuntimeException('Could not lock private configuration');
  $file=$dir.'/config.php';if(!is_file($file)) throw new RuntimeException('Configure private config.php first; this tool does not invent a host configuration');
  $config=require $file;if(!is_array($config)) throw new RuntimeException('Invalid private configuration');
  $config['admin_users'][$b['username']]=['hash'=>$b['hash'],'role'=>$b['role']];
  $backup=$dir.'/config-before-accounts-'.gmdate('Ymd-His').'-'.bin2hex(random_bytes(4)).'.php';if(!copy($file,$backup)) throw new RuntimeException('Backup failed');chmod($backup,0600);
  $tmp=$dir.'/config-'.bin2hex(random_bytes(8)).'.tmp';$text="<?php\nreturn ".var_export($config,true).";\n";
  if(file_put_contents($tmp,$text,LOCK_EX)===false) throw new RuntimeException('Could not save private configuration');chmod($tmp,0600);if(!rename($tmp,$file)) throw new RuntimeException('Could not replace private configuration');
  flock($lock,LOCK_UN);fclose($lock);echo "Provisioned named account ".$b['username']." with role ".$b['role'].". Deliver the password privately to the verified person.\n";
} catch(Throwable $e) { fwrite(STDERR,$e->getMessage()."\n");exit(1); }
