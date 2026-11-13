// Exercise real Apache rewrite handling, including internal DirectoryIndex and ErrorDocument requests.
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const { root } = require("../quality/routes.cjs");
const { verify } = require("./clean-url-checks.cjs");

(async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pdm-clean-urls-"));
  const documentRoot = path.join(temporary, "site");
  fs.mkdirSync(documentRoot);
  const moduleRoot = process.env.PCI_TEST_APACHE_MODULES || "/usr/lib/apache2/modules";
  let server;
  let browser;
  try {
    for (const entry of fs.readdirSync(root)) {
      if (entry.startsWith(".") || ["node_modules", "tests", "scripts"].includes(entry)) continue;
      fs.symlinkSync(path.join(root, entry), path.join(documentRoot, entry));
    }
    const hostSettings = "# Existing host configuration\nErrorDocument 404 /404.html\n";
    const htaccess = path.join(documentRoot, ".htaccess");
    fs.writeFileSync(htaccess, hostSettings, { mode: 0o640 });
    fs.chmodSync(htaccess, 0o640);
    const install = () =>
      cp.execFileSync(process.env.PCI_TEST_PHP || "php", [
        path.join(root, "hosting/install-clean-urls.php"),
        documentRoot,
      ]);
    install();
    const installed = fs.readFileSync(htaccess, "utf8");
    assert.ok(installed.endsWith(hostSettings), "Existing host configuration is preserved byte for byte");
    assert.equal(fs.statSync(htaccess).mode & 0o777, 0o640, "Existing permissions are preserved");
    install();
    assert.equal(fs.readFileSync(htaccess, "utf8"), installed, "Repeated deploys are idempotent");
    fs.writeFileSync(htaccess, "# BEGIN PDM CLEAN URLS\n" + hostSettings);
    assert.throws(
      install,
      (error) =>
        String(error.stdout).includes("Malformed clean URL block") ||
        String(error.stderr).includes("Malformed clean URL block"),
      "A partial block is never overwritten",
    );
    fs.writeFileSync(htaccess, installed);
    const probe = net.createServer();
    await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const base = "http://127.0.0.1:" + port;
    const config = path.join(temporary, "httpd.conf");
    fs.writeFileSync(
      config,
      `ServerRoot "${temporary}"
ServerName 127.0.0.1
Listen 127.0.0.1:${port}
PidFile "${temporary}/httpd.pid"
ErrorLog "${temporary}/error.log"
LoadModule mpm_event_module "${moduleRoot}/mod_mpm_event.so"
LoadModule authz_core_module "${moduleRoot}/mod_authz_core.so"
LoadModule alias_module "${moduleRoot}/mod_alias.so"
LoadModule dir_module "${moduleRoot}/mod_dir.so"
LoadModule mime_module "${moduleRoot}/mod_mime.so"
LoadModule rewrite_module "${moduleRoot}/mod_rewrite.so"
TypesConfig /dev/null
AddType text/html .html
AddType text/css .css
AddType application/javascript .js
DirectoryIndex index.html
DocumentRoot "${documentRoot}"
<Directory "${documentRoot}">
  Require all granted
  Options FollowSymLinks
  AllowOverride FileInfo
</Directory>
`,
    );
    server = cp.spawn(process.env.PCI_TEST_APACHE || "/usr/sbin/apache2", ["-f", config, "-DFOREGROUND"], {
      stdio: "ignore",
    });
    server.on("error", () => {});
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch(base);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        // Wait for the unprivileged Apache instance to bind its port.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(
      ready,
      "Apache starts: " +
        (fs.existsSync(path.join(temporary, "error.log"))
          ? fs.readFileSync(path.join(temporary, "error.log"), "utf8")
          : "check PCI_TEST_APACHE"),
    );
    await verify(base);
    browser = await chromium.launch({ headless: true, executablePath: process.env.PCI_TEST_CHROMIUM || undefined });
    // Redirects and navigation must also work with JavaScript disabled.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base + "/admin/quick/");
    assert.equal(
      await page.evaluate(() => new URL("../api/roll.php", document.baseURI).pathname),
      "/api/roll.php",
      "Directory export preserves the staff API base",
    );
    assert.equal(await page.locator(".footlink").getAttribute("href"), "./", "Staff source link remains unchanged");
    assert.equal(
      await page.locator(".footlink").evaluate((link) => new URL(link.href).pathname),
      "/admin/",
      "Staff navigation resolves against the original parent directory",
    );
    await page.goto(base + "/admin/operations/start/");
    assert.equal(
      await page
        .getByRole("link", { name: "Full staff guide", exact: true })
        .first()
        .evaluate((link) => new URL(link.href).pathname),
      "/admin/operations/guide/",
      "Staff guide links use real directory URLs",
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/faith-in-motion/index.html?ref=url-check#road");
      assert.equal(page.url(), base + "/faith-in-motion/?ref=url-check#road", "Redirect preserves browser fragment");
      await page.locator(".brand").click();
      assert.equal(page.url(), base + "/", "Campaign home link returns to extensionless homepage");
      await page.locator("[data-nav-fallback] summary").click();
      await page.locator("[data-nav-fallback]").getByRole("link", { name: "About Pamodzi", exact: true }).click();
      assert.equal(page.url(), base + "/about/", "Navigation uses clean URLs without JavaScript");
    }
    console.log("Clean URL browser navigation passed at phone and desktop widths without JavaScript.");
  } catch (error) {
    const log = path.join(temporary, "error.log");
    if (fs.existsSync(log)) console.error(fs.readFileSync(log, "utf8"));
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill("SIGTERM");
      await new Promise((resolve) => server.once("exit", resolve));
    }
    fs.rmSync(temporary, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
