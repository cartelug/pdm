/* Accessibility gate: axe-core WCAG 2.0 to 2.2 A and AA on every public page at 1440 and 390 px.
   Automated scans catch only part of the problems, so this complements the manual keyboard pass. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { start, root } = require("./server.cjs");

const skip = new Set([
  "admin",
  "api",
  "node_modules",
  "_astro",
  "src",
  "tests",
  "scripts",
  "assets",
  "css",
  "js",
  "data",
  ".git",
  ".github",
  "dist",
]);

function routes(dir = root, prefix = "/") {
  const found = [];
  if (fs.existsSync(path.join(dir, "index.html"))) found.push(prefix);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || skip.has(entry.name) || entry.name.startsWith(".")) continue;
    found.push(...routes(path.join(dir, entry.name), prefix + entry.name + "/"));
  }
  return found;
}

(async () => {
  const server = await start();
  const browser = await chromium.launch({ executablePath: process.env.PCI_TEST_CHROMIUM || undefined });
  const pages = routes();
  let failures = 0;
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (request) => request.abort());
    const page = await context.newPage();
    for (const route of pages) {
      await page.goto(server.base + route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(900);
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const result = await page.evaluate(() =>
        window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }),
      );
      for (const violation of result.violations) {
        failures++;
        console.log(`FAIL ${width}px ${route} ${violation.impact} ${violation.id}: ${violation.nodes.length} node(s)`);
      }
    }
    await context.close();
  }
  await browser.close();
  server.stop();
  if (failures) {
    console.error(`${failures} accessibility violation(s) across ${pages.length} pages.`);
    process.exit(1);
  }
  console.log(`No WCAG 2.2 A or AA violations found by axe on ${pages.length} pages at 1440 and 390 px.`);
})();
