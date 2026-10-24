<?php
/* Interactive host-owner setup. Passwords stay on a hidden terminal and in a pipe, never arguments/logs. */
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404);exit; }
$_SERVER['DOCUMENT_ROOT']=dirname(__DIR__);
require dirname(__DIR__).'/api/lib/payments.php';
function setup_prompt(string $label): string {
    fwrite(STDOUT,$label);$v=fgets(STDIN);if($v===false) throw new RuntimeException('Setup cancelled');return trim($v);
}
function setup_password(string $label): string {
    if(!function_exists('stream_isatty') || !stream_isatty(STDIN) || !function_exists('shell_exec')) throw new RuntimeException('Use an interactive cPanel/SSH terminal with hidden input; use the existing stdin hash helper otherwise');
    $state=trim((string)shell_exec('stty -g 2>/dev/null'));
    if($state==='') throw new RuntimeException('Hidden terminal input is unavailable');
    shell_exec('stty -echo');fwrite(STDOUT,$label);
    try { $v=fgets(STDIN);if($v===false) throw new RuntimeException('Setup cancelled');return rtrim($v,"\r\n"); }
    finally { shell_exec('stty '.escapeshellarg($state));fwrite(STDOUT,"\n"); }
}
try {
    fwrite(STDOUT,"PCI named-account setup. Confirm the person's identity and approved role before continuing.\n");
    $name=setup_prompt('Username (for example joshua): ');
    if(!preg_match('/^[a-z][a-z0-9-]{2,60}$/D',$name)) throw new InvalidArgumentException('Use 3–61 lowercase letters, numbers or hyphens, starting with a letter');
    $role=setup_prompt('Role [coordinator / finance / owner / editor / recorder / admin] (default coordinator): ') ?: 'coordinator';
    if(!in_array($role,['coordinator','finance','owner','editor','recorder','admin'],true)) throw new InvalidArgumentException('Choose a listed role');
    $password=setup_password('New personal password (hidden): ');
    if(strlen($password)<14) throw new InvalidArgumentException('Use at least 14 characters for the personal password');
    if(!hash_equals($password,setup_password('Repeat password (hidden): '))) throw new InvalidArgumentException('Passwords do not match; nothing was changed');
    $hash=password_hash($password,PASSWORD_DEFAULT);unset($password);
    $private=pci_config()['private_dir'];$file=$private.'/config.php';
    // If all previous configuration came from defaults/environment, only add the named-user setting.
    if(!is_file($file)) {
        $oldMask=umask(0077);$f=@fopen($file,'x');umask($oldMask);
        if($f) { if(fwrite($f,"<?php\nreturn ['admin_users'=>[]];\n")===false) throw new RuntimeException('Could not initialise private configuration');fclose($f);chmod($file,0600); }
        elseif(!is_file($file)) throw new RuntimeException('Private configuration is not writable');
    }
    $config=require $file;
    if(isset($config['admin_users'][$name]) && strtolower(setup_prompt('That username exists. Type replace to change its password/role: '))!=='replace') throw new RuntimeException('Existing account preserved');
    $descriptors=[0=>['pipe','r'],1=>STDOUT,2=>STDERR];
    $process=proc_open([PHP_BINARY,__DIR__.'/provision-operations-user.php'],$descriptors,$pipes,dirname(__DIR__));
    if(!is_resource($process)) throw new RuntimeException('Could not open the private account provisioner');
    fwrite($pipes[0],json_encode(['username'=>$name,'role'=>$role,'hash'=>$hash],JSON_THROW_ON_ERROR));fclose($pipes[0]);
    if(proc_close($process)!==0) throw new RuntimeException('Account was not activated; review the message above');
    fwrite(STDOUT,"Next: give the verified person their login privately, open /admin/operations/start.html and complete the walkthrough.\n");
} catch(Throwable $e) { fwrite(STDERR,$e->getMessage()."\n");exit(1); }
