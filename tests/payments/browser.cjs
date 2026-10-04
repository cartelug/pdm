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
    const base = 'http://127.0.0.1:' + port;await page.goto(base + '/contribute/?ref=qa-club');
    await page.locator('#submitContribution:not([disabled])').waitFor();
    check(await page.locator('[data-kind="pledge"]').getAttribute('aria-pressed') === 'true', 'closed checkout selects pledge');
    await page.click('[data-kind="payment"]');check(await page.locator('#submitContribution').isDisabled(), 'unconfigured payment option cannot submit');
    await page.click('[data-kind="pledge"]');
    await page.click('[data-amount="100000"]');check((await page.locator('#summaryAmount').textContent()).replace(/[\s,]/g, '') === 'UGX100000', 'suggested amount updates summary');
    await page.fill('#amount', '75000');check((await page.locator('#summaryAmount').textContent()).replace(/[\s,]/g, '') === 'UGX75000', 'custom amount updates summary');
    const shots = process.env.PCI_TEST_SCREENSHOTS || path.join(os.tmpdir(), 'pci-screenshots'); fs.mkdirSync(shots, { recursive: true });
    await page.screenshot({ path: path.join(shots, 'contribute-desktop.png'), fullPage: true });
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'contribution layout fits ' + width + 'px');
      if (width === 390) await page.screenshot({ path: path.join(shots, 'contribute-mobile.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.fill('#supporterName', 'Browser QA Supporter');await page.fill('#phone', '+256700000000');await page.check('#consent');
    await page.click('#submitContribution');await page.waitForURL('**/contribute/payment/?reference=*');await page.locator('#receiptContent:not([hidden])').waitFor();
    check(await page.locator('#receiptState').innerText() === 'PLEDGED' || await page.locator('#receiptState').innerText() === 'pledged', 'pledge result shows pledged status');
    check(await page.locator('#receiptAmount').innerText() === 'UGX 75,000', 'result retains selected amount');
    check(await page.locator('#printReceipt').isHidden(), 'pledge does not produce paid receipt');
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
    check(errors.length === 0, 'no browser JavaScript errors: ' + errors.join('; '));
    console.log(`\n${checks} browser checks passed. Screenshots: ${shots}`);
  } finally { if (browser) await browser.close();server.kill();fs.rmSync(privateDir, { recursive: true, force: true }); }
})().catch(e => { console.error(e);process.exitCode = 1; });
