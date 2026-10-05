/* Local browser QA with isolated database. Requires Playwright and a Chromium executable. */
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), net = require('net');
const { chromium: playwright } = require(process.env.PCI_TEST_PLAYWRIGHT || 'playwright');
const packedModule = process.env.PCI_TEST_CHROMIUM_MODULE ? require(process.env.PCI_TEST_CHROMIUM_MODULE) : null;
const packedChromium = packedModule && (packedModule.default || packedModule);
const root = path.resolve(__dirname, '../..');
let checks = 0;
function check(value, message) { if (!value) throw new Error(message); checks++; console.log('PASS ' + message); }
(async () => {
  const privateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pci-browser-'));
  const php = process.env.PCI_TEST_PHP || 'php', flags = process.env.PCI_TEST_PHP_INI ? ['-c', process.env.PCI_TEST_PHP_INI] : [];
  const hash = cp.execFileSync(php, [...flags, '-r', 'echo password_hash("Fixture-Only-Password", PASSWORD_DEFAULT);'], { encoding: 'utf8' });
  fs.writeFileSync(path.join(privateDir, 'config.php'), `<?php return ['environment'=>'sandbox','admin_users'=>['admin'=>['hash'=>'${hash}','role'=>'admin']]];`);
  const socket = net.createServer(); await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve)); const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const server = cp.spawn(php, [...flags, '-S', '127.0.0.1:' + port, '-t', root], { env: { ...process.env, PCI_PRIVATE_DIR: privateDir }, stdio: 'ignore' });
  let browser;
  try {
    const executablePath = process.env.PCI_TEST_CHROMIUM || (packedChromium ? await packedChromium.executablePath() : undefined);
    browser = await playwright.launch({ executablePath, headless: true, args: packedChromium ? packedChromium.args : ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(); const errors = [];page.on('pageerror', e => errors.push(e.message));
    const base = 'http://127.0.0.1:' + port;
    const shots = process.env.PCI_TEST_SCREENSHOTS || path.join(os.tmpdir(), 'pci-screenshots'); fs.mkdirSync(shots, { recursive: true });
    await page.goto(base + '/walk-for-education/?ref=qa-club');
    await page.locator('#campaignCheckoutStatus').filter({hasText:'Pledge your steps'}).waitFor();
    await page.evaluate(() => document.fonts.ready);
    check(await page.locator('#campaignTotal').innerText() === 'UGX 50,000', 'campaign defaults to ten steps at UGX 5,000 each');
    await page.click('[data-step-option="1"]');check(await page.locator('#campaignTotal').innerText() === 'UGX 5,000', 'one-step campaign option computes the correct price');
    await page.fill('#campaignSteps', '7');check(await page.locator('#campaignTotal').innerText() === 'UGX 35,000', 'custom campaign steps compute the correct price');
    check((await page.locator('#campaignContribute').getAttribute('href')).includes('steps=7&ref=qa-club'), 'campaign carries steps and referral into checkout');
    await page.fill('#campaignSteps', '1.5');check(await page.locator('#campaignContribute').getAttribute('aria-disabled') === 'true', 'fractional campaign steps cannot continue');
    await page.fill('#campaignSteps', '7');
    for (const width of [320, 360, 390, 768, 1440]) {
      await page.setViewportSize({width, height: width > 1000 ? 1000 : 844});
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'campaign layout fits ' + width + 'px');
      if (width === 390 || width === 1440) {
        for (const section of await page.locator('main section').all()) {await section.scrollIntoViewIfNeeded();await page.waitForTimeout(150);}
        await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(400);
        await page.screenshot({path:path.join(shots, width===390?'campaign-mobile.png':'campaign-desktop.png'),fullPage:true});
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.click('#wfeMenuButton');check(await page.locator('#wfeMenuButton').getAttribute('aria-expanded') === 'true', 'mobile campaign menu opens');
    await page.keyboard.press('Escape');check(await page.locator('#wfeMenuButton').getAttribute('aria-expanded') === 'false', 'Escape closes the mobile campaign menu');
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
    check(await page.locator('.wfe-reveal.waiting').count() === 0, 'reduced motion keeps campaign sections visible');
    await page.fill('#campaignSteps', '7');
    await page.locator('#campaignContribute').click();await page.waitForURL('**/contribute/?steps=7&ref=qa-club');
    await page.locator('#submitContribution:not([disabled])').waitFor();
    check(await page.locator('#stepCount').inputValue() === '7' && await page.locator('#summaryAmount').innerText() === 'UGX 35,000', 'checkout retains selected steps and amount');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#submitContribution:not([disabled])').waitFor();
    check(await page.locator('[data-kind="pledge"]').getAttribute('aria-pressed') === 'true', 'closed checkout selects pledge');
    await page.click('[data-kind="payment"]');check(await page.locator('#submitContribution').isDisabled(), 'unconfigured payment option cannot submit');
    await page.click('[data-kind="pledge"]');
    await page.click('[data-amount="100000"]');check((await page.locator('#summaryAmount').textContent()).replace(/[\s,]/g, '') === 'UGX100000', 'suggested amount updates summary');
    await page.fill('#stepCount', '15');check((await page.locator('#summaryAmount').textContent()).replace(/[\s,]/g, '') === 'UGX75000', 'custom steps update checkout amount');
    await page.screenshot({ path: path.join(shots, 'contribute-desktop.png'), fullPage: true });
    for (const width of [320, 360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
        console.log(await page.evaluate(() => [...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,id:e.id,cls:e.className,rect:e.getBoundingClientRect().toJSON()})).filter(e=>e.rect.right>innerWidth || e.rect.left<0).slice(0,10)));
        await page.screenshot({path:path.join(shots,'contribute-overflow.png'),fullPage:true});
      }
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'contribution layout fits ' + width + 'px');
      if (width === 390) await page.screenshot({ path: path.join(shots, 'contribute-mobile.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.fill('#supporterName', 'Browser QA Supporter');await page.fill('#phone', '+256700000000');await page.check('#consent');
    await page.click('#submitContribution');await page.waitForURL('**/contribute/payment/?reference=*');await page.locator('#receiptContent:not([hidden])').waitFor();
    check(await page.locator('#receiptState').innerText() === 'PLEDGED' || await page.locator('#receiptState').innerText() === 'pledged', 'pledge result shows pledged status');
    check(await page.locator('#receiptAmount').innerText() === 'UGX 75,000', 'result retains selected amount');
    check(await page.locator('#printReceipt').isHidden(), 'pledge does not produce paid receipt');
    check(await page.locator('#certificatePanel').isHidden(), 'pledge does not unlock a certificate');
    check(await page.locator('#receiptSteps').innerText() === '15 steps × UGX 5,000', 'result retains sponsored step count and unit price');
    check(await page.locator('#receiptEnvironment').innerText() === 'TEST — excluded from collections', 'sandbox result is visibly labelled');
    await page.click('#refreshPayment');check((await page.locator('#feedback').innerText()).includes('No payment has been taken'), 'status refresh preserves pledge outcome');
    await page.screenshot({ path: path.join(shots, 'pledge-result-mobile.png'), fullPage: true });
    await page.goto(base + '/admin/collections/');await page.fill('#password', 'Fixture-Only-Password');await page.click('#loginButton');await page.locator('#dashboard:not([hidden])').waitFor();
    check((await page.locator('#registerBody').innerText()).includes('Browser QA Supporter'), 'admin sees recorded pledge');
    check(await page.locator('#totalPledged').innerText() === 'UGX 0', 'sandbox pledge absent from live dashboard total');
    check((await page.locator('#registerBody').innerText()).includes('qa-club') === false, 'referral not confused with supporter or campaign');
    await page.fill('#searchRows', 'no-matching-supporter');check((await page.locator('#registerBody').innerText()).includes('No matching'), 'console search filters records');
    await page.fill('#searchRows', '');
    await page.setViewportSize({ width: 1440, height: 1000 });await page.screenshot({ path: path.join(shots, 'collections-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'console has contained mobile table scrolling');
    await page.click('#logout');await page.locator('#loginPanel:not([hidden])').waitFor();check(await page.locator('#dashboard').isHidden(), 'sign-out hides private dashboard');
    if (process.env.PCI_TEST_CERTIFICATE_PATH) {
      /* Browser-only fixture responses test the callback-to-download UI. No ledger or provider is changed. */
      const cert='WFE-'+'A'.repeat(24), ref='BROWSER-CERTIFICATE-FIXTURE';let looks=0;
      await page.evaluate(ref=>sessionStorage.setItem('pci-view-'+ref,'fixture-viewer-token'),ref);
      await page.clock.install();
      await page.route('**/api/payments/index.php?action=lookup',async route=>{
        looks++;const successful=looks>1;
        await route.fulfill({json:{verificationDelayed:false,contribution:{reference:ref,campaign:'walk-for-education-2026',kind:'payment',environment:'live',status:successful?'successful':'pending',amount:50000,steps:10,step_unit:5000,receipt:successful?'R-'+ref:null,certificate:successful?cert:null,created_at:'2026-10-05T10:00:00+00:00'}}});
      });
      await page.route('**/api/payments/index.php?action=certificate',async route=>{
        const request=route.request();check(request.postDataJSON().token==='fixture-viewer-token' && !!request.headers()['x-csrf-token'],'certificate browser download sends viewer token and CSRF protection');
        await route.fulfill({contentType:'application/pdf',body:fs.readFileSync(process.env.PCI_TEST_CERTIFICATE_PATH)});
      });
      await page.goto(base+'/contribute/payment/?reference='+ref);await page.locator('#receiptContent:not([hidden])').waitFor();
      check(await page.locator('#certificatePanel').isHidden(),'pending callback fixture keeps the certificate locked');
      await page.clock.fastForward(26000);await page.locator('#certificatePanel:not([hidden])').waitFor();
      check((await page.locator('#receiptState').innerText()).toLowerCase()==='successful','automatic pending-status check reveals verified successful callback fixture');
      check(await page.locator('#printReceipt').evaluate(e=>getComputedStyle(e).color)!=='rgb(255, 255, 255)','paid receipt print button has readable contrast');
      const download=await Promise.all([page.waitForEvent('download'),page.click('#downloadCertificate')]);
      check(download[0].suggestedFilename()===cert+'.pdf','verified certificate downloads with its certificate number');
      await page.screenshot({path:path.join(shots,'verified-certificate-mobile.png'),fullPage:true});
      await page.route('**/api/payments/index.php?action=verify-certificate&code=*',route=>route.fulfill({json:{valid:true,steps:10,amount:50000,issuedAt:'2026-10-05T10:00:00+00:00'}}));
      await page.goto(base+'/contribute/verify/?code='+cert);await page.locator('#verifiedCertificate:not([hidden])').waitFor();
      check(await page.locator('#verifiedAmount').innerText()==='UGX 50,000' && await page.locator('#verifiedSteps').innerText()==='10 steps','public certificate page displays amount and steps from verification');
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'certificate verification page fits mobile');
    }
    check(errors.length === 0, 'no browser JavaScript errors: ' + errors.join('; '));
    console.log(`\n${checks} browser checks passed. Screenshots: ${shots}`);
  } finally { if (browser) await browser.close();server.kill();fs.rmSync(privateDir, { recursive: true, force: true }); }
})().catch(e => { console.error(e);process.exitCode = 1; });
