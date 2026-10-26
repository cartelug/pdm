// Real-browser staging checks. Run by CI; no production forms or payments are submitted.
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
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCI_TEST_CHROMIUM || undefined });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 850 });
      for (const route of ["/", "/about/", "/what-we-do/", "/projects/", "/contact/", "/model/", "/apartments/"]) {
        await page.goto(base + route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          true,
          route + " fits " + width,
        );
        assert.equal(await page.locator("h1").isVisible(), true);
        if (route === "/") {
          assert.equal(
            await page
              .locator(".pci-brand__mark")
              .first()
              .evaluate((el) => getComputedStyle(el).backgroundColor),
            "rgba(0, 0, 0, 0)",
            "Approved logo has no container background",
          );
          const hero = await page
            .locator(".pci-hero__media img")
            .evaluate((el) => ({ source: el.currentSrc, loaded: el.complete && el.naturalWidth > 0 }));
          assert.equal(hero.loaded, true, "Hero image loads at " + width);
          assert.match(
            hero.source,
            width <= 719
              ? /\/assets\/wfe-2026\/official-kit\/scene-01-mobile-\d+\.(avif|webp)$/
              : /\/assets\/wfe-2026\/official-kit\/scene-01-desktop-\d+\.(avif|webp)$/,
          );
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 640 });
    await page.goto(base + "/");
    await page.locator(".pci-pillars").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll(".pci-pillar img")).every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    assert.equal(await page.locator(".pci-pillar").count(), 4, "All four programme areas remain navigable");
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("#our-pillars [data-reveal]")).every(
        (el) => getComputedStyle(el).opacity === "1",
      ),
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    // Let every finite entrance animation finish so contrast is measured on the settled page.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (a) =>
            a.playState !== "running" ||
            a.effect.getTiming().iterations === Infinity ||
            a.timeline.constructor.name !== "DocumentTimeline",
        ),
    );
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const accessibility = await page.evaluate(() =>
      window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }),
    );
    assert.deepEqual(
      accessibility.violations.filter((v) => ["critical", "serious"].includes(v.impact)).map((v) => v.id),
      [],
      "Homepage accessibility: " +
        JSON.stringify(
          accessibility.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        ),
    );
    const trigger = page.locator("[data-menu-open]");
    await trigger.click();
    assert.equal(await page.locator("dialog").evaluate((el) => el.open), true);
    assert.equal(await page.locator("main").evaluate((el) => el.inert), true);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(260);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
    await trigger.click();
    await page.locator("dialog").getByRole("link", { name: "About Pamodzi" }).click();
    await page.waitForURL("**/about/index.html");
    assert.equal(await page.evaluate(() => document.body.style.position), "");
    await page.goBack();
    assert.equal(await page.locator("dialog").evaluate((el) => el.open), false);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("[data-menu-open]").click();
    await page.locator("[data-menu-close]").click();
    assert.equal(await page.locator("dialog").evaluate((el) => el.open), false);
    await page.goto(base + "/projects/");
    await page.getByRole("button", { name: "Under review", exact: true }).click();
    assert.equal(
      await page.locator("[data-project-status]:visible").count(),
      0,
      "Retired apartment concept is not promoted",
    );
    await page.getByRole("button", { name: "All projects", exact: true }).click();
    const titles = await page.locator(".pci-project h3").allTextContents();
    assert.match(titles[0], /Walk for Education/);
    assert.match(titles[1], /Faith in Motion/);
    assert.ok(!titles.join(" ").includes("Kasese Apartment"));
    await page.goto(base + "/contact/");
    assert.equal(await page.locator("#enquiry").isVisible(), true, "Enhanced enquiry form stays visible");
    await page.locator("#enquiryName").fill("Fixture Person");
    await page.locator("#enquiryEmail").fill("fixture@example.invalid");
    await page.locator("#enquiryMessage").fill("This tests the email draft fallback without sending any message.");
    await page.getByRole("button", { name: "Send Enquiry" }).click();
    await page.waitForFunction(() =>
      document.querySelector("[data-enquiry-status]").textContent.includes("email draft"),
    );
    assert.equal(await page.locator("#enquiryName").inputValue(), "Fixture Person");
    assert.match(await page.locator("[data-enquiry-fallback]").getAttribute("href"), /^mailto:/);
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
    const plain = await nojs.newPage();
    await plain.goto(base + "/");
    await plain.locator("summary").click();
    assert.equal(
      await plain.locator("[data-nav-fallback]").getByRole("link", { name: "Walk for Education" }).isVisible(),
      true,
    );
    assert.equal(await plain.getByRole("link", { name: "Explore Our Work" }).isVisible(), true);
    await nojs.close();
    // Four pillars: choosing, keyboard, a phone swipe and the no-script reading order.
    const stage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await stage.goto(base + "/");
    const pillars = stage.locator(".pci-pillars");
    await pillars.scrollIntoViewIfNeeded();
    assert.equal(await pillars.getAttribute("data-active"), "education");
    await stage.locator("#pillar-tab-climate").click();
    assert.equal(await pillars.getAttribute("data-active"), "climate");
    assert.equal(await stage.locator("#pillar-tab-climate").getAttribute("aria-selected"), "true");
    assert.equal(await stage.locator("#pillar-tab-education").getAttribute("aria-selected"), "false");
    await stage.locator("#pillar-tab-climate").focus();
    await stage.keyboard.press("ArrowRight");
    assert.equal(await pillars.getAttribute("data-active"), "inclusion");
    await stage.keyboard.press("ArrowRight");
    assert.equal(await pillars.getAttribute("data-active"), "education", "arrow keys wrap round the ring");
    await stage.keyboard.press("End");
    assert.equal(await pillars.getAttribute("data-active"), "inclusion");
    await stage.waitForFunction(
      () =>
        Array.from(document.querySelectorAll(".pci-pillars__panel"))
          .map((el) => getComputedStyle(el).visibility)
          .join() === "hidden,hidden,hidden,visible",
    );
    assert.equal(
      await stage.locator('.pci-pillars__panel[data-pillar="inclusion"] a').getAttribute("href"),
      "what-we-do/index.html#inclusion",
    );
    await stage.close();
    const swipe = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const phone = await swipe.newPage();
    await phone.goto(base + "/");
    const phonePillars = phone.locator(".pci-pillars");
    await phonePillars.scrollIntoViewIfNeeded();
    await phone.locator("#pillar-tab-health").tap();
    await phone.waitForFunction(() => document.querySelector("[data-pillars-panels]").scrollLeft > 100);
    assert.equal(await phonePillars.getAttribute("data-active"), "health");
    await phone.evaluate(() => {
      const track = document.querySelector("[data-pillars-panels]");
      const card = track.querySelectorAll(".pci-pillars__panel")[3];
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "instant" });
    });
    await phone.waitForFunction(() => document.querySelector(".pci-pillars").dataset.active === "inclusion");
    assert.equal(await phone.locator("#pillar-tab-inclusion").getAttribute("aria-selected"), "true");
    assert.ok(
      await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      "the pillar cards swipe inside the stage without widening the page",
    );
    await swipe.close();
    const bare = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const bareStage = await bare.newPage();
    await bareStage.goto(base + "/");
    assert.equal(await bareStage.locator(".pci-pillars__tabs").evaluate((el) => getComputedStyle(el).display), "none");
    assert.deepEqual(
      await bareStage
        .locator(".pci-pillars__panel")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).visibility + "/" + getComputedStyle(el).opacity)),
      ["visible/1", "visible/1", "visible/1", "visible/1"],
      "without the script all four pillars are stacked and readable",
    );
    await bare.close();
    assert.deepEqual(errors, []);
    console.log(
      "Institutional browser checks passed: responsive routes, modal lifecycle, reduced motion, filters and no-JS navigation.",
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
