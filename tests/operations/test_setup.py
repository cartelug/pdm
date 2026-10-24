"""Hidden-input activation wizard checks. Never connects to production or prints credentials."""
import os, pty, select, subprocess, tempfile, time
from pathlib import Path
from zipfile import ZipFile
root=Path(__file__).resolve().parents[2]
php=os.environ.get('PCI_TEST_PHP','php')
with ZipFile(root/'assets/operations/setup/PCI_Account_Setup.zip') as bundle:
    assert set(bundle.namelist())=={'scripts/setup-operations-user.php','scripts/provision-operations-user.php','PCI-SETUP.txt'}
    for path in ['scripts/setup-operations-user.php','scripts/provision-operations-user.php']:
        assert bundle.read(path)==(root/path).read_bytes(),'Setup bundle must contain the current reviewed helpers'
secret='Synthetic-Only-Password-1234'
new_secret='Different-Synthetic-Password-5678'
def run_wizard(private,replace=None,mismatch=False):
    master,slave=pty.openpty()
    process=subprocess.Popen([php,str(root/'scripts/setup-operations-user.php')],stdin=slave,stdout=slave,stderr=slave,cwd=root,env={**os.environ,'PCI_PRIVATE_DIR':str(private)})
    os.close(slave);transcript=bytearray()
    def until(needle):
        deadline=time.monotonic()+10
        while needle.encode() not in transcript:
            if time.monotonic()>deadline:raise AssertionError('Activation prompt timed out')
            if select.select([master],[],[],.1)[0]:
                try:chunk=os.read(master,4096)
                except OSError:chunk=b''
                if not chunk:raise AssertionError('Activation stopped before its expected prompt')
                transcript.extend(chunk)
    def send(value):os.write(master,(value+'\n').encode())
    try:
        until('Username (');send('fixture-coordinator')
        until('Role [');send('finance' if replace is not None else 'coordinator')
        until('New personal password (hidden): ');send(new_secret if replace is not None else secret)
        until('Repeat password (hidden): ');send(new_secret if replace is not None else (new_secret if mismatch else secret))
        if replace is not None:until('Type replace');send(replace)
        while process.poll() is None:
            if select.select([master],[],[],.1)[0]:
                try:transcript.extend(os.read(master,4096))
                except OSError:break
        result=process.wait(timeout=10)
        while select.select([master],[],[],0)[0]:
            try:
                chunk=os.read(master,4096)
                if not chunk:break
                transcript.extend(chunk)
            except OSError:break
        assert secret.encode() not in transcript and new_secret.encode() not in transcript,'Password input must never be echoed'
        return result
    finally:
        if process.poll() is None:process.terminate();process.wait(timeout=5)
        os.close(master)
with tempfile.TemporaryDirectory(prefix='pci-activation-test-') as temp:
    private=Path(temp)
    config=private/'config.php'
    config.write_text("<?php return ['environment'=>'sandbox','consumer_key'=>'Synthetic-Preserve-Only','admin_users'=>[]];")
    assert run_wizard(private)==0,'Named coordinator activation succeeds'
    verify="""$c=require getenv('PCI_PRIVATE_DIR').'/config.php';echo ($c['environment']==='sandbox' && $c['consumer_key']==='Synthetic-Preserve-Only' && $c['admin_users']['fixture-coordinator']['role']==='coordinator' && password_verify('Synthetic-Only-Password-1234',$c['admin_users']['fixture-coordinator']['hash']))?'OK':'FAIL';"""
    assert subprocess.check_output([php,'-r',verify],env={**os.environ,'PCI_PRIVATE_DIR':temp},text=True)=='OK'
    assert config.stat().st_mode & 0o777==0o600,'Private configuration retains restricted permissions'
    original=config.read_bytes()
    assert len(list(private.glob('config-before-accounts-*.php')))==1,'Existing private config is backed up'
    assert run_wizard(private,replace='cancel')!=0 and config.read_bytes()==original,'Existing account cannot be replaced without explicit host confirmation'
    assert run_wizard(private,mismatch=True)!=0 and config.read_bytes()==original,'Mismatched passwords do not modify private configuration'
    with tempfile.TemporaryDirectory(prefix='pci-empty-activation-test-') as empty:
        assert run_wizard(Path(empty))==0,'First activation can create only a named-user setting when private config is absent'
        verify_empty="$c=require getenv('PCI_PRIVATE_DIR').'/config.php';echo (array_keys($c)===['admin_users'] && $c['admin_users']['fixture-coordinator']['role']==='coordinator')?'OK':'FAIL';"
        assert subprocess.check_output([php,'-r',verify_empty],env={**os.environ,'PCI_PRIVATE_DIR':empty},text=True)=='OK'
    print('PASS activation wizard: hidden passwords, named coordinator role, private config preservation, backup, restricted permissions, replacement confirmation and mismatch rejection')
