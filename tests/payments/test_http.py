"""Exercise the actual PHP routes with isolated fixture accounts and storage."""
import os, sys, json, time, socket, subprocess, tempfile, urllib.request, urllib.error, http.cookiejar
from pathlib import Path

root=Path(__file__).resolve().parents[2]
php=os.environ.get('PCI_TEST_PHP','php')
ini=os.environ.get('PCI_TEST_PHP_INI')
phpcmd=[php]+(['-c',ini] if ini else [])
checks=0
def check(value,label):
    global checks
    assert value,label
    checks+=1
    print('PASS',label)

with tempfile.TemporaryDirectory(prefix='pci-http-test-') as private:
    hashed=subprocess.check_output(phpcmd+['-r','echo password_hash("Fixture-Only-Password", PASSWORD_DEFAULT);'],text=True)
    Path(private,'config.php').write_text("<?php return ['environment'=>'sandbox','admin_users'=>['finance'=>['hash'=>'"+hashed+"','role'=>'finance'],'viewer'=>['hash'=>'"+hashed+"','role'=>'viewer'],'admin'=>['hash'=>'"+hashed+"','role'=>'admin']]];")
    sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
    env=os.environ.copy();env['PCI_PRIVATE_DIR']=private
    log=tempfile.TemporaryFile()
    server=subprocess.Popen(phpcmd+['-S',f'127.0.0.1:{port}','-t',str(root)],env=env,stdout=log,stderr=log)
    base=f'http://127.0.0.1:{port}'
    jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    def request(action,body=None,csrf='',opener=client):
        headers={'X-CSRF-Token':csrf}
        if body is not None:headers['Content-Type']='application/json'
        req=urllib.request.Request(base+'/api/payments/index.php?action='+action,data=None if body is None else json.dumps(body).encode(),headers=headers)
        try:
            with opener.open(req,timeout=10) as r:
                raw=r.read();return r.status,json.loads(raw) if 'json' in r.headers.get('Content-Type','') else raw.decode(),r.headers
        except urllib.error.HTTPError as e:return e.code,json.loads(e.read()),e.headers
    try:
        for _ in range(100):
            try:urllib.request.urlopen(base+'/contribute/',timeout=.2);break
            except (OSError,urllib.error.URLError):time.sleep(.05)
        code,status,_=request('status');check(code==200 and not status['checkoutEnabled'] and status['pledgesEnabled'],'public checkout closed and pledges available')
        code,session,headers=request('session');csrf=session['csrf'];check(code==200 and not session['signedIn'],'anonymous session does not sign in')
        check('HttpOnly' in headers.get('Set-Cookie','') and 'SameSite=Lax' in headers.get('Set-Cookie',''),'session cookie has HttpOnly and SameSite protections')
        body={'campaign':'walk-for-education-2026','amount':50000,'kind':'pledge','name':'=SUM(A1:A2)','phone':'+256700000000','email':'','referral':'fixture','consent':True,'requestId':'http-fixture-pledge-001'}
        check(request('create',body)[0]==401,'missing CSRF token blocked')
        check(request('dashboard',{},csrf)[0]==401,'unauthenticated register access blocked')
        code,result,_=request('create',body,csrf);check(code==200 and result['contribution']['status']=='pledged','HTTP pledge creates record')
        ref=result['contribution']['reference'];token=result['token']
        code,again,_=request('create',body,csrf);check(code==200 and again['contribution']['reference']==ref,'HTTP duplicate request reuses one record')
        check(request('lookup',{'reference':ref,'token':'wrong-token'},csrf)[0]==401,'wrong receipt token blocked')
        code,look,_=request('lookup',{'reference':ref,'token':token},csrf);check(code==200 and 'name' not in look['contribution'],'private receipt returns no supporter contact data')
        payment=dict(body,kind='payment',requestId='http-fixture-payment-001');check(request('create',payment,csrf)[0]==409,'payment API remains closed without Pesapal access')
        code,progress,_=request('progress');check(progress['received']==0 and progress['pledged']==0,'sandbox pledge excluded from public totals')
        check(request('login',{'username':'finance','password':'incorrect'},csrf)[0]==401,'wrong password blocked')
        code,login,_=request('login',{'username':'viewer','password':'Fixture-Only-Password'},csrf);csrf=login['csrf'];check(code==200 and login['role']=='viewer','named viewer sign-in works')
        code,dashboard,_=request('dashboard',{},csrf);check(code==200 and len(dashboard['rows'])==1 and 'viewer_hash' not in dashboard['rows'][0],'authorised register shows records without viewer secrets')
        check(request('close-pledge',{'reference':ref},csrf)[0]==401,'viewer cannot modify pledge')
        check(request('export',{},csrf)[0]==401,'viewer cannot export private records')
        check(request('backup',{},csrf)[0]==401,'viewer cannot create server backup')
        request('logout',{},csrf);code,session,_=request('session');csrf=session['csrf'];check(not session['signedIn'],'logout revokes sign-in')
        code,login,_=request('login',{'username':'finance','password':'Fixture-Only-Password'},csrf);csrf=login['csrf']
        code,csv,_=request('export',{},csrf);check(code==200 and "'=SUM(A1:A2)" in csv,'CSV protects spreadsheet formulas in supporter input')
        check(request('backup',{},csrf)[0]==401,'finance role cannot perform administrator action')
        check(request('close-pledge',{'reference':ref},csrf)[0]==200,'finance can close pledge without marking it paid')
        check(request('reconcile',{'reference':ref,'fee':0,'settlementReference':'fixture'},csrf)[0]==422,'pledge cannot be reconciled as payment')
        request('logout',{},csrf);_,s,_=request('session');csrf=s['csrf'];_,login,_=request('login',{'username':'admin','password':'Fixture-Only-Password'},csrf);csrf=login['csrf']
        code,backup,_=request('backup',{},csrf);check(code==200 and Path(private,'backups',backup['backup']).is_file(),'administrator creates actual snapshot')
        code,data,_=request('dashboard',{},csrf);check(data['rows'][0]['status']=='closed' and len(data['audit'])>=4,'pledge changes and exports audited')
        for path in ['/contribute/','/contribute/payment/','/contribute/privacy/','/contribute/terms/','/admin/collections/']:
            check(urllib.request.urlopen(base+path).status==200,'page available: '+path)
        raw=urllib.request.urlopen(base+'/api/payments/maintenance.php');check(False,'CLI maintenance inaccessible over HTTP')
    except urllib.error.HTTPError as e:
        if e.code==404 and e.url.endswith('maintenance.php'):check(True,'CLI maintenance inaccessible over HTTP')
        else:raise
    finally:server.terminate();server.wait(timeout=5);log.close()
print(f'\n{checks} HTTP checks passed. No external payment requests were sent.')
