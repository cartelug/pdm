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
      await page.evaluate(() => document.querySelector("main").inert && document.body.style.overflow === "hidden"),
      "mobile menu locks the background",
    );
    // The header's frosted backdrop must never become the containing block of the fixed menu panel: that
    // shrank it to a strip over the Menu / Close button, so the button could not be tapped to close.
    check(
      await page.evaluate(() => document.getElementById("wfeMenu").getBoundingClientRect().height === innerHeight),
      "mobile menu panel fills the screen while open",
    );
    check(
      await page.evaluate(() => {
        const rect = document.getElementById("wfeMenuButton").getBoundingClientRect();
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).id === "wfeMenuButton";
      }),
      "the Close button stays above the open menu panel",
    );
    await page.locator("#wfeMenuButton").click();
    check(
      await page.evaluate(() => !document.getElementById("wfeMenu").classList.contains("is-open")),
      "tapping the Close button closes the mobile menu",
    );
    await page.locator("#wfeMenuButton").click();
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
      await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily.includes("Montserrat")),
      "display type uses Montserrat",
    );
    check(
      await page.locator("#campaignSteps").evaluate((el) => getComputedStyle(el).fontFamily.includes("Montserrat")),
      "controls use Montserrat",
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
