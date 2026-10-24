// Real-browser checks for the scroll and entrance motion. Run by CI; nothing is submitted.
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 450) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(2600);
}

// Everything that motion may hide until it arrives must be fully shown once it has been scrolled past.
async function stuckElements(page) {
  return page.evaluate(() => {
    const selectors = [
      "[data-reveal]",
      "[data-reveal-group] > *",
      ".pci-split-line",
      ".pci-project__media",
      ".pci-campaign-panel__media",
      ".pci-footer__invitation .pci-actions > *",
    ];
    const stuck = [];
    for (const selector of selectors)
      for (const element of document.querySelectorAll(selector)) {
        if (element.closest("[hidden]")) continue;
        const style = getComputedStyle(element);
        const clipped = style.clipPath !== "none" && /inset\(\s*100%/.test(style.clipPath);
        if (Number(style.opacity) < 0.99 || clipped)
          stuck.push(selector + " " + (element.className || element.tagName));
      }
    document.querySelectorAll(".pci-rule:not(.is-in)").forEach((element) => stuck.push("rule " + element.className));
    return stuck;
  });
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCI_TEST_CHROMIUM || undefined });
  try {
    const errors = [];
    const watch = (page) => {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    };

    // ---- Full motion on desktop ----
    const motion = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    watch(motion);
    await motion.goto(base + "/");
    await motion.waitForFunction(() => document.querySelector(".pci-strip.is-marquee"), null, { timeout: 8000 });
    assert.equal(await motion.locator(".pci-strip__track ul").count(), 4, "Marquee repeats the principle list");
    assert.equal(
      await motion.locator('.pci-strip__track ul[aria-hidden="true"]').count(),
      3,
      "Only the first copy of the principle list is exposed to assistive technology",
    );
    assert.ok((await motion.locator(".pci-split-mask").count()) > 5, "Headlines are split into masked lines");
    assert.equal(
      await motion.locator("main h2").first().getAttribute("aria-label"),
      null,
      "No aria-label is added to split text",
    );
    await scrollThrough(motion);
    assert.deepEqual(await stuckElements(motion), [], "Home: nothing stays hidden after it has been scrolled past");
    assert.equal(
      await motion.evaluate(() =>
        getComputedStyle(document.querySelector(".pci-footer__wordmark")).getPropertyValue("--pci-fill").trim(),
      ),
      "1",
      "The footer wordmark fills as the footer arrives",
    );

    for (const route of [
      "/about/",
      "/what-we-do/",
      "/model/",
      "/projects/",
      "/impact/",
      "/partnerships/",
      "/governance/",
      "/apartments/",
      "/community/",
      "/contact/",
    ]) {
      await motion.goto(base + route);
      await motion.waitForTimeout(900);
      await scrollThrough(motion);
      assert.deepEqual(
        await stuckElements(motion),
        [],
        route + ": nothing stays hidden after it has been scrolled past",
      );
      assert.equal(
        await motion.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        route + " fits",
      );
    }

    await motion.goto(base + "/impact/");
    await motion.waitForTimeout(700);
    await scrollThrough(motion);
    assert.deepEqual(
      await motion.locator("[data-count]").allInnerTexts(),
      ["55", "50", "16"],
      "Counted figures end on the published numbers",
    );

    await motion.goto(base + "/governance/");
    await motion.waitForTimeout(700);
    await scrollThrough(motion);
    assert.equal(await motion.locator(".pci-steps li.is-lit").count(), 8, "Every step of the money trail lights up");

    await motion.goto(base + "/community/");
    await motion.waitForTimeout(700);
    await scrollThrough(motion);
    assert.equal(
      await motion.locator(".pci-timeline__item.is-reached").count(),
      await motion.locator(".pci-timeline__item").count(),
      "The review timeline is fully drawn at the end",
    );

    // The project filter reflows with a transition and still ends in the right state.
    await motion.goto(base + "/projects/");
    await motion.waitForTimeout(900);
    await motion.getByRole("button", { name: "Pipeline", exact: true }).click();
    await motion.waitForTimeout(1800);
    assert.equal(await motion.locator("[data-project-status]:visible").count(), 1);
    assert.equal(
      await motion.locator("[data-project-status]:visible").evaluate((el) => getComputedStyle(el).opacity),
      "1",
    );
    await motion.getByRole("button", { name: "All projects", exact: true }).click();
    await motion.waitForTimeout(1800);
    assert.equal(await motion.locator("[data-project-status]:visible").count(), 4);
    assert.deepEqual(
      await motion
        .locator("[data-project-status]")
        .evaluateAll((cards) => cards.map((card) => getComputedStyle(card).opacity)),
      ["1", "1", "1", "1"],
      "No card is left faded after filtering",
    );

    // Turning reduced motion on while the page is open removes every scripted change.
    await motion.goto(base + "/");
    await motion.waitForFunction(() => document.querySelector(".pci-strip.is-marquee"), null, { timeout: 8000 });
    await motion.emulateMedia({ reducedMotion: "reduce" });
    await motion.waitForFunction(() => !document.querySelector(".pci-strip.is-marquee"), null, { timeout: 5000 });
    assert.equal(await motion.locator(".pci-split-mask").count(), 0, "Split headlines are restored");
    assert.equal(await motion.locator(".pci-strip__track").count(), 0, "The principle strip is a plain list again");

    // ---- Reduced motion from the start ----
    const still = await (
      await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
    ).newPage();
    watch(still);
    await still.goto(base + "/");
    await still.waitForTimeout(1500);
    assert.equal(await still.locator(".pci-strip.is-marquee").count(), 0, "No marquee under reduced motion");
    assert.equal(await still.locator(".pci-split-mask").count(), 0, "No split text under reduced motion");
    assert.equal(
      await still.evaluate(() => getComputedStyle(document.querySelector(".pci-hero__line > span")).animationName),
      "none",
      "No entrance animation under reduced motion",
    );
    assert.equal(
      await still.evaluate(() => document.documentElement.classList.contains("lenis")),
      false,
      "No smooth scrolling",
    );
    assert.deepEqual(await stuckElements(still), [], "Reduced motion shows everything immediately");

    // ---- Phone width ----
    const phone = await (
      await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true })
    ).newPage();
    watch(phone);
    for (const route of ["/", "/model/", "/projects/", "/impact/"]) {
      await phone.goto(base + route);
      await phone.waitForTimeout(900);
      await scrollThrough(phone);
      assert.deepEqual(await stuckElements(phone), [], "Phone " + route + ": nothing stays hidden");
      assert.equal(
        await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        "Phone " + route + " fits",
      );
    }

    // ---- JavaScript off: nothing is hidden, nothing moves ----
    const plain = await (
      await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } })
    ).newPage();
    await plain.goto(base + "/impact/");
    await plain.waitForTimeout(1500);
    assert.deepEqual(await plain.locator("[data-count]").allInnerTexts(), ["55", "50", "16"]);
    assert.deepEqual(await stuckElements(plain), [], "Without JavaScript nothing is hidden");

    assert.deepEqual(errors, []);
    console.log(
      "Motion checks passed: entrance, scroll effects, filter reflow, reduced motion, phone width and no-JS.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
