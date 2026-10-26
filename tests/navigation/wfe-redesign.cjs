/* Presentation regression: isolated PHP records; no requests to external payment or messaging services. */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const net = require("node:net");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PCI_TEST_PLAYWRIGHT || "playwright");
const packedModule = process.env.PCI_TEST_CHROMIUM_MODULE ? require(process.env.PCI_TEST_CHROMIUM_MODULE) : null;
const packed = packedModule && (packedModule.default || packedModule);
const root = path.resolve(__dirname, "../..");
const shots = process.env.PCI_TEST_SCREENSHOTS || path.join(os.tmpdir(), "pci-wfe-redesign");
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
  console.log("PASS " + message);
}

(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "pci-redesign-"));
  fs.writeFileSync(path.join(privateDir, "config.php"), "<?php return ['environment'=>'sandbox'];");
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const server = cp.spawn(process.env.PCI_TEST_PHP || "php", ["-S", "127.0.0.1:" + port, "-t", root], {
    env: { ...process.env, PCI_PRIVATE_DIR: privateDir },
    stdio: "ignore",
  });
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.PCI_TEST_CHROMIUM || undefined,
      args: packed ? packed.args.filter((arg) => arg !== "--single-process") : ["--no-sandbox"],
    });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + port + "/walk-for-education/?ref=redesign-fixture&country=UG&steps=50");
    await page.locator("#campaignTotal").filter({ hasText: "250,000" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".site-loader").waitFor({ state: "detached" });
    await page.locator("#wfeMenuButton").click();
    check(
      await page.locator("#wfeMenu").evaluate((menu) => {
        const rect = menu.getBoundingClientRect();
        return Math.abs(rect.top) < 1 && Math.abs(rect.height - innerHeight) < 2;
      }),
      "mobile menu fills the viewport instead of collapsing inside the blurred header",
    );
    check(
      await page.evaluate(() => document.querySelector("main").inert && document.body.style.overflow === "hidden"),
      "mobile menu locks the background",
    );
    await page.locator("#wfeMenuButton").focus();
    await page.keyboard.press("Tab");
    check(
      await page.evaluate(() => document.activeElement === document.querySelector("#wfeMenu a")),
      "mobile menu traps forward focus",
    );
    await page.keyboard.press("Shift+Tab");
    check(await page.evaluate(() => document.activeElement.id === "wfeMenuButton"), "mobile menu traps reverse focus");
    await page.keyboard.press("Escape");
    check(
      await page.evaluate(() => !document.querySelector("main").inert && document.activeElement.id === "wfeMenuButton"),
      "Escape closes the mobile menu and returns focus",
    );
    for (const width of [320, 768, 1180]) {
      await page.setViewportSize({ width, height: width === 768 ? 375 : 844 });
      await page.evaluate(() => scrollTo({ top: 900, behavior: "instant" }));
      const scrollBefore = await page.evaluate(() => scrollY);
      await page.locator("#wfeMenuButton").click();
      await page.waitForFunction(() => document.getElementById("wfeMenu").dataset.state === "open");
      const menuGeometry = await page.locator("#wfeMenu").evaluate((menu) => {
        const rect = menu.getBoundingClientRect();
        const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        return {
          top: rect.top,
          height: rect.height,
          viewportHeight: innerHeight,
          viewportWidth: innerWidth,
          receivesTaps: menu.contains(hit),
          hit: hit?.tagName + "." + hit?.className,
          clip: getComputedStyle(menu).clipPath,
          headerFilter: getComputedStyle(document.querySelector(".w-header")).backdropFilter,
          bodyTop: document.body.style.top,
        };
      });
      check(
        Math.abs(menuGeometry.top) < 1 &&
          Math.abs(menuGeometry.height - menuGeometry.viewportHeight) < 2 &&
          menuGeometry.receivesTaps,
        "menu remains full height and receives taps after scrolling at " +
          width +
          "px: " +
          JSON.stringify(menuGeometry),
      );
      await page.locator("#wfeMenu a").last().scrollIntoViewIfNeeded();
      check(
        await page
          .locator("#wfeMenu a")
          .last()
          .evaluate((link) => {
            const rect = link.getBoundingClientRect();
            return (
              rect.top >= 0 &&
              rect.bottom <= innerHeight + 1 &&
              link.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))
            );
          }),
        "last menu action is reachable even in a short viewport at " + width + "px",
      );
      await page.keyboard.press("Escape");
      check(
        Math.abs((await page.evaluate(() => scrollY)) - scrollBefore) < 2,
        "closing restores the exact page position at " + width + "px",
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#wfeMenuButton").click();
    await page.locator("#wfeMenuButton").click();
    await page.locator("#wfeMenuButton").click();
    await page.waitForFunction(() => document.getElementById("wfeMenu").dataset.state === "open");
    check(
      (await page.locator("#wfeMenuButton").getAttribute("aria-expanded")) === "true",
      "rapid taps settle in the requested open state",
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    check(
      await page.evaluate(() => !document.getElementById("wfeMenu").inert && document.body.style.position !== "fixed"),
      "desktop resize releases the mobile lock",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForFunction(() => !document.querySelector('[data-scene="bag"]').classList.contains("is-scrolly"));
    check(
      await page.locator(".w-bag__frame").evaluateAll((frames) =>
        frames.every((frame) => {
          const caption = frame.querySelector("figcaption").getBoundingClientRect();
          const box = frame.getBoundingClientRect();
          return getComputedStyle(frame).position !== "absolute" && caption.bottom <= box.bottom + 1;
        }),
      ),
      "short landscape screens show every backpack frame and caption in normal flow",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-scene="bag"]').classList.contains("is-scrolly"));
    check(true, "portrait resize restores the backpack scene when it has enough height");
    const enlargedText = await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await page.evaluate(() => dispatchEvent(new Event("resize")));
    check(
      await page.locator('[data-scene="bag"]').evaluate((bag) => {
        const scrolly = bag.classList.contains("is-scrolly");
        const frames = [...bag.querySelectorAll(".w-bag__frame")].filter(
          (frame) => !scrolly || frame.classList.contains("is-active"),
        );
        return (
          !document.body.classList.contains("r-motion-paused") &&
          frames.length > 0 &&
          frames.every((frame) => {
            const caption = frame.querySelector("figcaption").getBoundingClientRect();
            return caption.bottom <= frame.getBoundingClientRect().bottom + 1;
          })
        );
      }),
      "enlarged text keeps backpack captions readable while decorative motion is enabled",
    );
    await enlargedText.evaluate((style) => style.remove());
    await page.evaluate(() => dispatchEvent(new Event("resize")));
    await page.locator("[data-gallery-filter='school']").click();
    await page.locator("#galleryCount").filter({ hasText: "9 of 15" }).waitFor();
    check(
      (await page.locator("#galleryCount").innerText()).includes("9 of 15"),
      "school filter contains the complete 15-image school collection",
    );
    await page.locator("#galleryLoadMore").click();
    check(
      (await page.locator("#campaignGallery [data-image-id]").count()) === 15,
      "load more reveals the remaining school images",
    );
    const card = page.locator("#campaignGallery [data-image-id]").first();
    await card.click();
    await page.locator("#imageViewer").waitFor({ state: "visible" });
    check(await page.locator("#imageViewer").evaluate((el) => el.open), "image viewer opens as a modal");
    const firstTitle = await page.locator("#viewerTitle").innerText();
    await page.keyboard.press("ArrowRight");
    check(
      (await page.locator("#viewerTitle").innerText()) !== firstTitle,
      "keyboard arrow selects the next illustration",
    );
    await page.keyboard.press("ArrowLeft");
    check(
      (await page.locator("#viewerTitle").innerText()) === firstTitle,
      "keyboard arrow returns to the previous illustration",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.body.classList.contains("r-viewer-open"));
    check(
      await card.evaluate((el) => document.activeElement === el),
      "closing the viewer returns focus to its image card",
    );
    check(
      await page.evaluate(() => document.body.style.overflow !== "hidden"),
      "closing the viewer restores scrolling",
    );
    await page.locator("[data-gallery-filter='all']").click();
    while (await page.locator("#galleryLoadMore").isVisible()) await page.locator("#galleryLoadMore").click();
    check(
      (await page.locator("#campaignGallery [data-image-id]").count()) === 56,
      "the public gallery exposes all 56 generated images",
    );
    await page.locator("[data-gallery-filter='campaign']").click();
    await page.locator("#galleryCount").filter({ hasText: "9 of 20" }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#campaignGallery [data-image-id]").first().click();
    await page.waitForFunction(() =>
      /scene-\d+-mobile-master\.webp/.test(document.getElementById("viewerImage").currentSrc),
    );
    check(true, "campaign viewer selects the separately composed portrait on a phone");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() =>
      /scene-\d+-desktop-master\.webp/.test(document.getElementById("viewerImage").currentSrc),
    );
    check(true, "campaign viewer selects the wide companion on desktop");
    await page.keyboard.press("Escape");
    await page.locator("[data-gallery-filter='school']").click();
    await page.locator("#campaignGallery [data-image-id]").first().click();
    await page.waitForFunction(
      () => !document.getElementById("viewerImage").parentElement.querySelector("source").hasAttribute("srcset"),
    );
    check(
      !(await page
        .locator("#viewerImage")
        .evaluate((img) => img.parentElement.querySelector("source").hasAttribute("srcset"))),
      "switching to the original school collection clears the previous campaign portrait",
    );
    await page.keyboard.press("Escape");
    await page.locator("[data-gallery-filter='all']").click();
    await page.locator("#motionToggle").click();
    check(
      await page.locator("body").evaluate((el) => el.classList.contains("r-motion-paused")),
      "visible motion toggle pauses decorative motion",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.getElementById("motionToggle").disabled);
    check(await page.locator("#motionToggle").isDisabled(), "device reduced-motion preference cannot be overridden");
    for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "redesign fits " + width + "px after gallery interactions",
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".w-hero__portrait img").evaluate((img) => img.decode());
    check(
      await page.locator(".w-hero__portrait img").evaluate((img) => img.naturalWidth > 0),
      "official-kit hero decodes with reduced motion and after responsive source changes",
    );
    await page.locator("#choose-steps").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "PCI_WFE_Mobile_Pledge.png") });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(shots, "PCI_WFE_Mobile_Hero.png") });
    await page.locator("#wfeMenuButton").click();
    await page.screenshot({ path: path.join(shots, "PCI_WFE_Mobile_Menu.png") });
    await page.keyboard.press("Escape");
    await page.locator("#visual-stories").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "PCI_WFE_Mobile_Gallery.png") });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(shots, "PCI_WFE_Desktop_Hero.png") });
    check(
      await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily.includes("MTN Brighter Sans")),
      "display type uses MTN Brighter Sans",
    );
    check(
      await page
        .locator("h1 .w-line span")
        .evaluateAll(
          (spans) =>
            spans.length > 0 && spans.every((span) => getComputedStyle(span).fontFamily.includes("MTN Brighter Sans")),
        ),
      "nested headline text inherits the heading font instead of switching to the reading font",
    );
    check(
      await page.locator("#campaignSteps").evaluate((el) => getComputedStyle(el).fontFamily.includes("Sky Text")),
      "controls use Sky Text",
    );
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const scanAccessibility = () =>
      page.evaluate(async () =>
        (
          await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      );
    const violations = await scanAccessibility();
    // Also audit the sample certificate in view, where its textured paper background is painted.
    await page.locator("#certificate").scrollIntoViewIfNeeded();
    violations.push(...(await scanAccessibility()));
    fs.writeFileSync(path.join(shots, "accessibility-results.json"), JSON.stringify(violations, null, 2));
    if (violations.length) console.error("Accessibility violations:", JSON.stringify(violations, null, 2));
    check(violations.length === 0, "redesigned page passes the WCAG A/AA accessibility scan");
    check(errors.length === 0, "redesign interactions produce no JavaScript errors");
    console.log(checks + " redesign browser checks passed. Screenshots: " + shots);
  } finally {
    if (browser) await browser.close();
    server.kill();
    fs.rmSync(privateDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
