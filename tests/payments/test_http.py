"""Exercise the actual PHP routes with isolated fixture accounts and storage."""
import os, sys, json, time, socket, sqlite3, subprocess, tempfile, urllib.request, urllib.error, http.cookiejar
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
        check(status['stepUnit']==5000 and status['minimumSteps']==5 and status['maximumSteps']==20000,'public API advertises the approved step price and five-step minimum')
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
        check(look['contribution']['steps']==10 and look['contribution']['certificate'] is None,'pledge carries steps without a certificate')
        check(request('certificate',{'reference':ref,'token':token},csrf)[0]==409,'pledge certificate download is denied')
        check(request('certificate',{'reference':ref,'token':'wrong'},csrf)[0]==401,'certificate download requires the private viewer token')
        check(request('certificate',{'reference':ref,'token':token})[0]==401,'certificate download requires CSRF protection')
        check(request('create',dict(body,steps=1,requestId='http-mismatch-steps-001'),csrf)[0]==422,'HTTP API rejects a step-count and amount mismatch')
        check(request('create',dict(body,steps=4,amount=20000,requestId='http-below-minimum-001'),csrf)[0]==422,'HTTP pledge rejects four steps even when the amount matches')
        check(request('create',dict(body,kind='payment',steps=4,amount=20000,requestId='http-below-minimum-002'),csrf)[0]==422,'HTTP payment rejects four steps before provider submission')
        check(request('create',dict(body,amount=5000,requestId='http-below-minimum-003'),csrf)[0]==422,'legacy request without a step count cannot bypass the minimum')
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
        for path in ['/walk-for-education/','/contribute/','/contribute/payment/','/contribute/verify/','/contribute/privacy/','/contribute/terms/','/admin/collections/']:
            check(urllib.request.urlopen(base+path).status==200,'page available: '+path)
        # Isolated ledger fixture only. No provider call or production record is changed.
        cert='WFE-'+'A'*24
        with sqlite3.connect(Path(private,'collections.sqlite')) as fixture:
            fixture.execute("UPDATE contributions SET environment='live',kind='payment',status='successful',tracking_id='fixture-tracking',receipt='fixture-receipt' WHERE reference=?",(ref,))
            fixture.execute('INSERT INTO certificates(reference,code,issued_at) VALUES(?,?,?)',(ref,cert,'2026-10-05T10:00:00+00:00'))
        code,verified,_=request('verify-certificate&code='+cert);check(code==200 and verified['valid'] and verified['steps']==10 and verified['amount']==50000,'public certificate verification confirms the recorded step payment')
        check(not any(k in verified for k in ['name','email','phone','reference','tracking_id']),'public certificate verification discloses no supporter identity or payment identifiers')
        check(request('verify-certificate&code=WFE-'+'B'*24)[0]==404,'unknown certificate code is not found')
        check(request('verify-certificate&code=invalid')[0]==422,'malformed certificate code is rejected')
        code,delayed,_=request('lookup',{'reference':ref,'token':token},csrf);check(code==200 and delayed['verificationDelayed'],'unavailable matching gateway marks the receipt check delayed')
        check(request('certificate',{'reference':ref,'token':token},csrf)[0]==409,'cached failed verification cannot unlock certificate download')
        with sqlite3.connect(Path(private,'collections.sqlite')) as fixture:fixture.execute("UPDATE contributions SET status='refunded' WHERE reference=?",(ref,))
        code,inactive,_=request('verify-certificate&code='+cert);check(code==200 and not inactive['valid'] and inactive['status']=='inactive' and inactive['amount'] is None,'refunded certificate is publicly inactive without contribution details')
        try:urllib.request.urlopen(base+'/api/payments/certificate-pdf.php');check(False,'PDF renderer inaccessible directly')
        except urllib.error.HTTPError as e:check(e.code==404,'PDF renderer inaccessible directly')
        raw=urllib.request.urlopen(base+'/api/payments/maintenance.php');check(False,'CLI maintenance inaccessible over HTTP')
    except urllib.error.HTTPError as e:
        if e.code==404 and e.url.endswith('maintenance.php'):check(True,'CLI maintenance inaccessible over HTTP')
        else:raise
    finally:server.terminate();server.wait(timeout=5);log.close()
print(f'\n{checks} HTTP checks passed. No external payment requests were sent.')
