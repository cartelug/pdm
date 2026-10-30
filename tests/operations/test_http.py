"""Financial and editorial acceptance checks against actual HTTP routes, isolated from live storage."""
import os, json, time, socket, subprocess, tempfile, urllib.request, urllib.error, http.cookiejar, sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[2]
php=os.environ.get('PCI_TEST_PHP','php')
checks=0
def check(ok,label):
    global checks
    assert ok,label
    checks+=1
    print('PASS',label)
with tempfile.TemporaryDirectory(prefix='pci-ops-test-') as private:
    hashed=subprocess.check_output([php,'-r','echo password_hash("Operations-Fixture-Only",PASSWORD_DEFAULT);'],text=True)
    users=','.join("'%s'=>['hash'=>'%s','role'=>'%s']"%(u,hashed,r) for u,r in [('finance','finance'),('joshua','coordinator'),('recorder','recorder'),('neeza','owner'),('communications','editor'),('administrator','admin')])
    Path(private,'config.php').write_text("<?php return ['environment'=>'live','admin_users'=>["+users+"]];")
    sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
    env={**os.environ,'PCI_PRIVATE_DIR':private};log=tempfile.TemporaryFile()
    server=subprocess.Popen([php,'-S',f'127.0.0.1:{port}','-t',str(root)],env=env,stdout=log,stderr=log)
    base=f'http://127.0.0.1:{port}'
    jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));csrf=''
    def request(action,body=None,path='/api/operations.php'):
        req=urllib.request.Request(base+path+'?action='+action,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json','X-CSRF-Token':csrf})
        try:
            with client.open(req,timeout=10) as r:
                raw=r.read();return r.status,json.loads(raw) if 'json' in r.headers.get('Content-Type','') else raw.decode()
        except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
    def login(user):
        global csrf
        request('logout',{})
        code,s=request('session');csrf=s['csrf']
        code,d=request('login',{'username':user,'password':'Operations-Fixture-Only'});check(code==200,'named '+user+' login');csrf=d['csrf']
    def received(c='UGX'):
        code,d=request('public');assert code==200
        return next((r['received'] for r in d['totals']['currencies'] if r['currency']==c),0)
    def record(**extra):
        b=dict(name='Synthetic Contributor',amount=500000,currency='UGX',date='2026-10-24',kind='payment',channel='MTN MoMo',transactionRef='SYNTH-0001',requestId='fixture-request-0001',stepUnit=5000,country='UG',notes='PRIVATE-NOTE',evidence='PRIVATE-EVIDENCE')
        b.update(extra);return request('record',b)
    try:
        for _ in range(100):
            try:urllib.request.urlopen(base+'/admin/operations/',timeout=.2);break
            except OSError:time.sleep(.05)
        check(request('dashboard',{})[0]==401,'anonymous private dashboard blocked')
        check(request('register',{})[0]==401,'anonymous unified register blocked')
        check(request('report-data',{})[0]==401 and request('download-database',{})[0]==401,'anonymous report and database downloads blocked')
        code,d=request('public');check(code==200 and received()==0,'empty ledger has no invented opening balance')
        code,public_report=request('public-report')
        check(code==200 and public_report['audience']=='public' and public_report['totals']['currencies']==[], 'public update works without private sign-in or an invented balance')
        check(set(public_report)=={'schema','audience','campaign','reportingCutoff','verificationLabel','totals','walk','approvedAt','url','reportId'},'public report uses an explicit field allowlist')
        check(d['totals']['milestone'] is None,'proposed milestone unpublished without approval')
        login('recorder')
        token=csrf;csrf='bad';check(record()[0]==401,'CSRF is mandatory');csrf=token
        code,r=record(status='reconciled',reconciled_at='2026-10-24T12:00:00Z');check(code==200 and r['record']['status']=='pending','reported payment starts pending');payment=r['record']['id']
        check(received()==0,'pending UGX 500,000 increases public collections by UGX 0')
        check(record()[1]['record']['id']==payment,'retry uses the original record')
        check(record(requestId='different-request')[0]==409,'duplicate transaction with another request is rejected')
        check(record(amount=500000.5,requestId='fractional')[0]==422,'fractional monetary amounts rejected')
        check(record(amount=-1,requestId='negative')[0]==422,'negative monetary amounts rejected')
        check(request('reconcile',{'id':payment,'evidence':'bank matched'})[0]==401,'recorder cannot reconcile')
        check(request('walk-publish',{})[0]==401,'recorder cannot publish walk updates')
        check(request('photo-upload',{'data':'invalid','approved':True})[0]==401,'recorder cannot upload public photos')
        login('finance')
        check(request('community-save',{'groupUrl':'https://chat.whatsapp.com/ABCDEFGHIJKLMN'})[0]==401,'finance cannot change the group invitation')
        check(request('reconcile',{'id':payment,'evidence':''})[0]==422,'finance confirmation requires reconciliation evidence')
        check(request('reconcile',{'id':payment,'evidence':'Synthetic bank settlement matched 0001'})[0]==200,'finance reconciliation succeeds')
        check(received()==500000,'reconciled collections increase by exactly UGX 500,000')
        check(request('reconcile',{'id':payment,'evidence':'retry'})[0]==409 and received()==500000,'repeated reconciliation does not double-count')
        code,p=record(kind='pledge',requestId='pledge-1',transactionRef='',amount=1000000,channel='');pledge=p['record']['id']
        code,part=record(requestId='partial-1',transactionRef='SYNTH-PART1',pledgeId=pledge,amount=250000)
        request('reconcile',{'id':part['record']['id'],'evidence':'Synthetic partial settlement'})
        totals=request('public')[1]['totals'];ugx=next(x for x in totals['currencies'] if x['currency']=='UGX')
        check(ugx['pledged']==1000000 and ugx['outstanding']==750000,'partial receipt reduces pledge outstanding separately from target')
        check(request('reverse',{'id':part['record']['id'],'reason':'Synthetic reversal'})[0]==200 and received()==500000,'reversal removes the receipt without deleting it')
        ugx=next(x for x in request('public')[1]['totals']['currencies'] if x['currency']=='UGX');check(ugx['outstanding']==1000000,'reversal restores outstanding pledge balance')
        check(request('public')[1]['supporters']==[],'recognition defaults to anonymous/unpublished')
        request('consent',{'id':payment,'displayName':True,'displayAmount':False,'evidence':'Synthetic explicit name-only permission'})
        supporter=request('public')[1]['supporters'][0];check(supporter['name']=='Synthetic Contributor' and supporter['amount'] is None,'name and amount permissions are independent')
        request('consent',{'id':payment,'displayName':False,'displayAmount':False,'evidence':'Synthetic withdrawal'})
        check(request('public')[1]['supporters']==[],'withdrawal removes recognition')
        code,k=record(amount=1000,currency='KES',requestId='kenya-1',transactionRef='SYNTH-KES1',stepUnit=200,country='KE');request('reconcile',{'id':k['record']['id'],'evidence':'KES settlement matched'})
        check(received('KES')==1000 and received()==500000,'currencies are preserved without conversion or pooling')
        check(request('public')[1]['totals']['confirmedSteps']==105,'historical country price snapshots drive confirmed steps')
        source={'source':'fixture-original.csv','rows':[{'Name':'Import person','Amount':'500000','Currency':'UGX','Date':'2026-10-24','Channel':'MTN','Ref':'SYNTH-IMP1','Paid':'yes'}],'mapping':{'name':'Name','amount':'Amount','currency':'Currency','date':'Date','channel':'Channel','transactionRef':'Ref'}}
        code,d=request('import-preview',source);check(code==200 and not d['preview'][0]['issues'] and d['preview'][0]['record']['sourceRow']=='2','import preview maps original source row')
        check(request('import-commit',source)[0]==200 and received()==500000,'imported paid label remains pending')
        pledge_import={**source,'source':'pledge-fixture.csv','rows':[{'name':'Pledge import','amount':'20000','currency':'UGX','date':'2026-10-24','kind':'pledge'}],'mapping':{}}
        check(not request('import-preview',pledge_import)[1]['preview'][0]['issues'],'import preview supports pledges without inventing a payment reference')
        check(request('import-commit',source)[0]==409 and len(request('dashboard',{})[1]['rows'])==5,'repeated import creates no duplicate')
        bad={**source,'rows':[{'Name':'Incomplete','Amount':'500,000'}]};check(request('import-preview',bad)[1]['preview'][0]['issues'],'import preview flags missing fields and inconsistent amounts')
        check(request('milestone',{'label':'Approved operational milestone','amount':25000000,'currency':'UGX','approval':'Synthetic committee approval'})[0]==200,'finance can approve a milestone with evidence')
        public=request('public')[1];m=public['totals']['milestone'];check(m['remaining']==24500000 and 'approval' not in m and 'approvedBy' not in m,'remaining milestone differs from pledge outstanding and public omits approval evidence')
        private_json=json.dumps(public);check(all(s not in private_json for s in ['PRIVATE-NOTE','PRIVATE-EVIDENCE','transaction_ref','request_key','source_row','email','phone']),'public projection excludes private fields and references')
        check(request('walk-publish',{})[0]==401,'finance is not implicitly an editorial publisher')
        login('neeza');check(request('dashboard',{})[0]==401,'owner editorial role cannot read private financial rows')
        check(request('register',{})[0]==401,'editorial role cannot read the unified private register')
        original_received=received()
        check(request('community-save',{'groupUrl':'https://example.com/not-whatsapp'})[0]==422,'group invitation rejects another host')
        group='https://chat.whatsapp.com/SYNTHETICINVITATIONONLY'
        check(request('community-save',{'groupUrl':group,'receivedTotal':999999999})[0]==200 and request('community')[1]['groupUrl']==group,'authorised publisher can update the invitation')
        check(received()==original_received,'group invitation update cannot change collected money')
        check(request('dashboard',{},'/api/payments/index.php')[0]==401,'editorial role cannot bypass privacy through gateway dashboard')
        check(request('reconcile',{'id':payment,'evidence':'invalid'})[0]==401,'owner editorial role cannot approve receipts')
        w=dict(activity='active',physical='resting',km=100,date='2026-10-24',town='Synthetic town',story='Approved synthetic walk story',photo='',photoAlt='',baseVersion=0)
        code,prev=request('walk-preview',w);check(code==200 and request('public')[1]['walk'] is None,'preview does not publish')
        check(request('walk-save',w)[0]==200 and request('public')[1]['walk'] is None,'draft remains private')
        check(request('walk-publish',w)[0]==200,'named owner publishes')
        pub=request('public')[1];check(pub['walk']['physical']=='resting' and pub['walk']['activity']=='active','campaign activity stays separate from physical walking state')
        code,snapshot=request('snapshot',{});check(code==200 and 'supporters' not in snapshot,'server locks a privacy-safe graphic snapshot')
        w['baseVersion']=pub['version'];w['km']=120;request('walk-publish',w)
        check(received()==500000 and request('public')[1]['walk']['km']==120,'changing kilometres does not change collections')
        check(request('snapshot-read',{'id':snapshot['snapshotId']})[1]['walk']['km']==100,'export snapshot remains immutable after a new update')
        check(request('walk-publish',w)[0]==409,'stale editorial write cannot overwrite a newer version')
        check(request('photo-upload',{'data':'invalid','approved':False})[0]==422,'photo upload requires explicit approval')
        check(request('photo-upload',{'data':'invalid','approved':True})[0]==422,'invalid photo bytes are rejected')
        check(request('walk-publish',{**w,'baseVersion':request('public')[1]['version'],'photo':'https://example.com/private.jpg'})[0]==422,'unapproved remote photo rejected')
        code,legacy=request('unused',{},'/api/campaign.php');check(code==410,'shared-password legacy publisher is retired')
        with urllib.request.urlopen(base+'/api/campaign.php?format=json') as r:legacy=json.load(r)
        check(legacy['campaign']['receivedTotal']==500000 and legacy['campaign']['distanceCoveredKm']==120,'legacy Walk projection reads the same approved data without rebuild')
        check('SYNTH' not in json.dumps(legacy),'legacy public projection excludes transaction references')
        request('walk-revert',{'id':pub['version'],'baseVersion':request('public')[1]['version']});check(request('public')[1]['walk']['km']==100,'revert appends an audited published version')
        # Seed an authentic gateway identity after a manual receipt: gateway wins, so no overlapping manual sum.
        db=sqlite3.connect(Path(private,'collections.sqlite'));db.execute("INSERT INTO contributions(reference,request_key,campaign,amount,currency,kind,name,email,phone,referral,environment,status,viewer_hash,receipt,reconciled_at,created_at,updated_at,steps,step_unit) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",('WFE-FIXTURE-GW','gateway-key','walk-for-education-2026',500000,'UGX','payment','Private Gateway Person','private@example.com','','','live','successful','hash','SYNTH-0001','2026-10-24T12:00:00Z','2026-10-24T12:00:00Z','2026-10-24T12:00:00Z',100,5000));db.commit();db.close()
        check(received()==500000,'gateway overlap is counted exactly once under the shared aggregation policy')
        login('finance');check(record(transactionRef='SYNTH-0001',requestId='gateway-overlap-new')[0]==409,'manual record overlapping a gateway identity is rejected')
        db=sqlite3.connect(Path(private,'collections.sqlite'));db.execute("INSERT INTO contributions(reference,request_key,campaign,amount,currency,kind,name,email,phone,referral,environment,status,viewer_hash,created_at,updated_at,steps,step_unit) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",('WFE-PLEDGE-FIXTURE','gateway-pledge-key','walk-for-education-2026',100000,'UGX','pledge','Gateway pledge fixture','','','','live','pledged','hash','2026-10-24T12:00:00Z','2026-10-24T12:00:00Z',20,5000));db.commit();db.close()
        code,partial=record(amount=2500,requestId='fraction-step-1',transactionRef='FRAC-STEP-0001',pledgeId='WFE-PLEDGE-FIXTURE');check(code==200,'manual partial receipt may link to an existing gateway pledge')
        request('reconcile',{'id':partial['record']['id'],'evidence':'Synthetic partial gateway pledge settlement'})
        code,partial=record(amount=2500,requestId='fraction-step-2',transactionRef='FRAC-STEP-0002',pledgeId='WFE-PLEDGE-FIXTURE');request('reconcile',{'id':partial['record']['id'],'evidence':'Synthetic second partial settlement'})
        ugx=next(x for x in request('public')[1]['totals']['currencies'] if x['currency']=='UGX');check(ugx['outstanding']==1095000,'gateway pledge outstanding decreases by allocated partial receipts')
        check(request('public')[1]['totals']['confirmedSteps']==106,'partial receipts combine before counting fully funded sponsored steps')
        code,register=request('register',{'query':'WFE-PLEDGE-FIXTURE','page':1,'limit':1})
        check(code==200 and register['total']==1 and register['rows'][0]['ledger']=='gateway','website pledge appears once in the unified staff register')
        row=register['rows'][0]
        check(row['received_amount']==5000 and row['outstanding_amount']==95000 and row['financial_status']=='Part-paid','website pledge shows linked verified receipts and its remaining balance')
        check(request('register',{'limit':101})[0]==422,'register pagination limits validated')
        code,page=request('register',{'page':1,'limit':1})
        check(code==200 and len(page['rows'])==1 and page['total']>1 and page['pages']==page['total'],'register pagination retains the complete result count')
        code,public_report=request('public-report')
        check(code==200 and next(r['received'] for r in public_report['totals']['currencies'] if r['currency']=='UGX')==received(),'public PDF source matches the canonical received total')
        check(all(s not in json.dumps(public_report) for s in ['PRIVATE-NOTE','PRIVATE-EVIDENCE','transaction_ref','phone','email','supporters','source_row']),'public report cannot expose private register or recognition fields')
        check(public_report['walk']['km']==100 and public_report['reportId'].startswith('WFE-UPDATE-'),'public report carries the approved walking update and report identity')
        batch={**source,'source':'batch-atomic-fixture.csv','rows':[{'Name':'Valid first','Amount':'5000','Currency':'UGX','Date':'2026-10-24','Channel':'MTN','Ref':'BATCH-FIRST'},{'Name':'Invalid channel','Amount':'5000','Currency':'UGX','Date':'2026-10-24','Channel':'Pesapal','Ref':'BATCH-LAST'}]}
        before=len(request('dashboard',{})[1]['rows']);check(request('import-commit',batch)[0]==422 and len(request('dashboard',{})[1]['rows'])==before,'failed import batch rolls back earlier rows atomically')
        check(request('export',{})[0]==200,'unified CSV report downloads')
        code,report=request('report-data',{})
        check(code==200 and len(report['rows'])==request('dashboard',{})[1]['totalRecords']+2,'complete report contains manual records and both gateway rows')
        check(sum(r['amount'] for r in report['rows'] if r['included_received'] and r['currency']=='UGX')==received(),'report eligibility reconciles exactly to public received total')
        check(any(r['status']=='reversed' and not r['included_received'] for r in report['rows']),'report retains reversals without counting them')
        check(request('download-database',{})[0]==401,'finance cannot download full database')
        login('administrator')
        req=urllib.request.Request(base+' /api/operations.php?action=download-database'.lstrip(),data=b'{}',headers={'Content-Type':'application/json','X-CSRF-Token':csrf})
        with client.open(req) as response: backup=response.read()
        check(backup.startswith(b'SQLite format 3\x00'),'administrator downloads a consistent SQLite database')
        copy=Path(private,'downloaded.sqlite');copy.write_bytes(backup)
        snapshot_db=sqlite3.connect(copy)
        check(snapshot_db.execute('PRAGMA integrity_check').fetchone()[0]=='ok' and snapshot_db.execute('SELECT COUNT(*) FROM ops_records').fetchone()[0]>0,'downloaded backup opens with complete operations tables')
        snapshot_db.close()
        check(request('public')[1]['totals']['confirmedSteps']==106,'overlap also cannot inflate sponsored steps')
        check(request('status',None,'/api/payments/index.php')[1]['checkoutEnabled'] is False,'Pesapal checkout remains closed')
        login('joshua');check(request('dashboard',{})[0]==200,'coordinator can view contribution records')
        check(request('download-database',{})[0]==401,'coordinator cannot download full database')
        before_received=received();code,c=record(name='Synthetic coordinator entry',amount=1000,transactionRef='COORD-0001',requestId='coord-record-0001');check(code==200 and c['record']['status']=='pending' and received()==before_received,'coordinator entry cannot increase collections before finance verification')
        check(request('reconcile',{'id':c['record']['id'],'evidence':'not authorised'})[0]==401,'coordinator cannot approve financial receipts')
        check(request('reverse',{'id':c['record']['id'],'reason':'not authorised'})[0]==401,'coordinator cannot reverse receipts')
        check(request('consent',{'id':c['record']['id'],'displayName':True,'displayAmount':True,'evidence':'not authorised'})[0]==401,'coordinator cannot grant recognition consent')
        check(request('milestone',{'label':'Not authorised','amount':25000000,'currency':'UGX','approval':'Not authorised'})[0]==401,'coordinator cannot approve milestones')
        check(request('walk-preview',{**w,'baseVersion':request('public')[1]['version']})[0]==200,'coordinator can prepare walk updates')
        check(request('snapshot',{})[0]==200 and request('export',{})[0]==200,'coordinator can generate graphics and download reports')
        print(f'\n{checks} operations HTTP checks passed. Synthetic data only.')
    finally:
        server.terminate();server.wait(timeout=5);log.close()
