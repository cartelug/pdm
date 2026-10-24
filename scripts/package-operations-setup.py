"""Package the two CLI-only host activation helpers without any private configuration."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
readme='''PCI ACCOUNT SETUP — HOSTING ADMINISTRATOR ONLY
1. Upload this ZIP to the PCI website root in cPanel File Manager and extract it there.
2. Open cPanel Terminal/SSH, change to the website root and run:
   php scripts/setup-operations-user.php
3. Follow the prompts once per verified person. Suggested standard roles:
   Neeza: coordinator; Joshua: coordinator; appointed finance verifier: finance.
Use a separate personal password for each account. Password input is hidden.
The helper backs up and preserves private configuration, asks before replacing
an existing account, and does not enable checkout or import historical balances.
Both PHP files refuse web-browser execution; they run only from a terminal.
Give each person their login privately. Never put passwords in a public build log.
Training: https://pamodzici.com/admin/operations/start.html
Console: https://pamodzici.com/admin/operations/
'''
files={p:(root/p).read_bytes() for p in ['scripts/setup-operations-user.php','scripts/provision-operations-user.php']}
files['PCI-SETUP.txt']=readme.encode()
out=root/'assets/operations/setup/PCI_Account_Setup.zip'
with ZipFile(out,'w') as z:
    for path,content in files.items():
        info=ZipInfo(path,(2026,10,24,0,0,0));info.compress_type=ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,content)
print('Packaged CLI-only setup helpers and host instructions; no accounts or secrets are included.')
