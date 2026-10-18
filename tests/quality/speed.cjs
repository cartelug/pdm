/* Speed gate: lab test on a throttled phone profile (390 px at 2x, 1.6 Mbps, 150 ms round trip, 4x slower CPU).
   Median of three runs per page. Fails when a page is slower or heavier than its ceiling in budget.json.
   The ceilings ratchet down toward the targets (LCP 2.5 s, 450 KB, 200 ms blocking time) as fixes land. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { chromium } = require("playwright");
const { start } = require("./server.cjs");

const budget = JSON.parse(fs.readFileSync(path.join(__dirname, "budget.json"), "utf8"));
const runs = Number(process.env.PCI_SPEED_RUNS || 3);
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function measure(browser, base, route) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (request) => request.abort());
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, blocking: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__m.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__m.blocking += Math.max(0, entry.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });
  let bytes = 0;
  page.on("response", async (response) => {
    try {
      const body = await response.body();
      const type = response.headers()["content-type"] || "";
      bytes += /text|javascript|json|svg|xml/.test(type) ? zlib.gzipSync(body).length : body.length;
    } catch {
      /* redirects and aborted requests carry no body */
    }
  });
  await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3500);
  const metrics = await page.evaluate(() => window.__m);
  await context.close();
  return { lcp: metrics.lcp, blocking: metrics.blocking, kb: bytes / 1024 };
}

(async () => {
  const server = await start();
  const browser = await chromium.launch({ executablePath: process.env.PCI_TEST_CHROMIUM || undefined });
  let failed = 0;
  console.log(
    "page".padEnd(36),
    "LCP ms".padStart(7),
    "ceiling".padStart(8),
    "KB".padStart(6),
    "ceiling".padStart(8),
    "block ms".padStart(9),
  );
  for (const [route, limit] of Object.entries(budget.pages)) {
    if (process.env.PCI_SPEED_ONLY && route !== process.env.PCI_SPEED_ONLY) continue;
    const samples = [];
    for (let i = 0; i < runs; i++) samples.push(await measure(browser, server.base, route));
    const lcp = median(samples.map((s) => s.lcp));
    const kb = median(samples.map((s) => s.kb));
    const blocking = median(samples.map((s) => s.blocking));
    const over = lcp > limit.lcpMs || kb > limit.kb || (limit.blockingMs && blocking > limit.blockingMs);
    if (over) failed++;
    console.log(
      route.padEnd(36),
      String(Math.round(lcp)).padStart(7),
      String(limit.lcpMs).padStart(8),
      String(Math.round(kb)).padStart(6),
      String(limit.kb).padStart(8),
      String(Math.round(blocking)).padStart(9),
      over ? "  OVER BUDGET" : "",
    );
  }
  await browser.close();
  server.stop();
  if (failed) {
    console.error(`${failed} page(s) are over the speed budget.`);
    process.exit(1);
  }
  console.log("All pages are within the speed budget.");
})();
