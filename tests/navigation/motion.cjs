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
      ".pci-spotlight__copy > *",
      ".pci-spotlight__facts > div",
      ".pci-spotlight__media figcaption",
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

    // ---- Brand intro: plays briefly, never takes clicks, ends on its own, skips on input ----
    const introPage = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    watch(introPage);
    await introPage.goto(base + "/about/", { waitUntil: "commit" });
    await introPage.waitForSelector(".pci-intro");
    assert.equal(
      await introPage.evaluate(() => getComputedStyle(document.querySelector(".pci-intro")).pointerEvents),
      "none",
      "The intro never takes clicks",
    );
    assert.equal(
      (await introPage.locator(".pci-intro__title").textContent()).trim(),
      "About Pamodzi",
      "The intro names the page",
    );
    await introPage.waitForTimeout(2600);
    assert.equal(
      await introPage.evaluate(() => getComputedStyle(document.querySelector(".pci-intro")).visibility),
      "hidden",
      "The intro ends on its own",
    );
    await introPage.goto(base + "/impact/", { waitUntil: "commit" });
    await introPage.waitForSelector(".pci-intro");
    assert.ok(
      await introPage.evaluate(() => document.documentElement.classList.contains("pci-intro-short")),
      "Later pages in the same visit get the short intro",
    );
    await introPage.waitForLoadState("load");
    await introPage.keyboard.press("Shift");
    await introPage.waitForTimeout(400);
    assert.equal(
      await introPage.evaluate(() => getComputedStyle(document.querySelector(".pci-intro")).visibility),
      "hidden",
      "Any key skips the intro",
    );
    await introPage.context().close();

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

    // The six homepage scenes end in their complete, still state after a scroll through the page.
    const scenes = await motion.evaluate(() => {
      const t = (selector) => getComputedStyle(document.querySelector(selector)).transform;
      return {
        cover: t(".pci-spotlight__cover"),
        thread: t(".pci-spotlight__thread"),
        footerThread: t(".pci-footer__thread"),
        routeLine: getComputedStyle(document.querySelector(".pci-route__svg--wide [data-route-line]")).strokeDashoffset,
        marker: getComputedStyle(document.querySelector(".pci-route__svg--wide [data-route-marker]")).opacity,
        heroImage: getComputedStyle(document.querySelector(".pci-hero__media img")).getPropertyValue("--img-y").trim(),
      };
    });
    assert.equal(scenes.cover, "matrix(1, 0, 0, 0, 0, 0)", "The campus cover has fully retracted");
    assert.equal(scenes.thread, "none", "The campus thread is fully drawn");
    assert.equal(scenes.footerThread, "none", "The closing thread is fully drawn");
    assert.ok(["0", "0px"].includes(scenes.routeLine), "The route line is complete at the end: " + scenes.routeLine);
    assert.equal(scenes.marker, "0", "The abstract route marker is hidden once the line is complete");
    assert.ok(Math.abs(parseFloat(scenes.heroImage)) <= 24, "Hero image depth stays within its overscan");

    // Desktop director: active at 1440 px with a mouse; centred layers stay centred; pointer light works.
    const director = await motion.evaluate(() => {
      const centre = (selector) => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return [box.left + box.width / 2, box.top + box.height / 2];
      };
      const [bx, by] = centre(".pci-band");
      const [rx, ry] = centre(".pci-band__rings");
      return {
        glow: getComputedStyle(document.querySelector(".pci-hero__glow")).display,
        ringsOffset: Math.hypot(bx - rx, by - ry),
      };
    });
    assert.equal(director.glow, "block", "The desktop director's hero light exists on a desktop");
    assert.ok(director.ringsOffset < 40, "The partnership rings stay centred under GSAP: " + director.ringsOffset);
    await motion.locator(".pci-spotlight__facts > div").first().hover();
    assert.equal(
      await motion.locator(".pci-spotlight__facts > div.is-lit-pointer").count(),
      1,
      "Facts carry the pointer light on a desktop",
    );

    // The model diagram accompanies the list on a desktop (sticky is not disabled by an ancestor).
    await motion.evaluate(() => {
      const list = document.querySelector("[data-model]");
      window.scrollTo({ top: list.getBoundingClientRect().top + scrollY + list.offsetHeight / 2, behavior: "instant" });
    });
    await motion.waitForTimeout(700);
    const stick = await motion.evaluate(() => document.querySelector(".pci-cycle__stick").getBoundingClientRect().top);
    assert.ok(stick > 0 && stick < 200, "The model diagram stays in view beside its list: " + stick);
    assert.equal(await motion.locator(".pci-model a.is-current").count(), 1, "One stage is current while reading");

    // The menu holds every scene still while it locks the page, and puts the reading position back.
    const before = await motion.evaluate(() => window.scrollY);
    const ringBefore = await motion.evaluate(
      () => document.querySelector("[data-model-progress]").style.strokeDashoffset,
    );
    await motion.setViewportSize({ width: 1000, height: 900 });
    await motion.waitForTimeout(600);
    const scrolled = await motion.evaluate(() => window.scrollY);
    // A direct click: Playwright's own click would first scroll the toggle "into view".
    await motion.evaluate(() => document.querySelector("[data-menu-open]").click());
    await motion.waitForTimeout(400);
    const ringOpen = await motion.evaluate(
      () => document.querySelector("[data-model-progress]").style.strokeDashoffset,
    );
    await motion.keyboard.press("Escape");
    await motion.waitForTimeout(500);
    assert.equal(
      await motion.evaluate(() => window.scrollY),
      scrolled,
      "Closing the menu restores the reading position",
    );
    assert.notEqual(ringOpen, "1", "Locking the page does not rewind the model ring to the start");
    assert.ok(before > 0 && ringBefore !== "");
    await motion.setViewportSize({ width: 1440, height: 900 });

    // Pillars: one controller, even after the page is restored from the back/forward cache.
    await motion.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });
    await motion.waitForTimeout(300);
    await motion.locator('#our-pillars [role="tab"][aria-selected="true"]').focus();
    const selected = await motion
      .locator('#our-pillars [role="tab"][aria-selected="true"]')
      .getAttribute("data-pillar");
    await motion.keyboard.press("ArrowRight");
    await motion.waitForTimeout(100);
    const order = ["education", "health", "climate", "inclusion"];
    assert.equal(
      await motion.locator('#our-pillars [role="tab"][aria-selected="true"]').getAttribute("data-pillar"),
      order[(order.indexOf(selected) + 1) % 4],
      "One arrow key press moves exactly one pillar (no duplicate controller after restore)",
    );
    await motion.waitForTimeout(700);
    assert.equal(
      await motion.locator("#our-pillars [role=tabpanel]:visible a").count(),
      1,
      "Only the chosen pillar's link is reachable on a desktop",
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

    // Rapid alternating filters: the latest choice wins and nothing is left mid-flight.
    for (const name of ["Pipeline", "All projects", "Pipeline", "All projects", "Pipeline", "All projects"]) {
      await motion.getByRole("button", { name, exact: true }).click();
      await motion.waitForTimeout(60);
    }
    await motion.waitForTimeout(1200);
    assert.equal(await motion.locator("[data-project-status]:visible").count(), 4, "Rapid filters end on All");
    assert.deepEqual(
      await motion
        .locator("[data-project-status]")
        .evaluateAll((cards) => cards.map((card) => [getComputedStyle(card).opacity, card.style.position || ""])),
      [
        ["1", ""],
        ["1", ""],
        ["1", ""],
        ["1", ""],
      ],
      "No card keeps a temporary position or fade after rapid filtering",
    );
    assert.equal(await motion.locator("[data-filter-count]").textContent(), "4 projects shown");

    // Focus wins over a pending reveal: focusing a control below the fold shows it at once.
    await motion.goto(base + "/");
    await motion.waitForFunction(() => document.querySelector(".pci-strip.is-marquee"), null, { timeout: 8000 });
    await motion.locator(".pci-spotlight__copy .pci-button").focus();
    await motion.waitForTimeout(150);
    assert.equal(
      await motion.locator(".pci-spotlight__copy > .pci-actions").evaluate((el) => getComputedStyle(el).opacity),
      "1",
      "A focused action is never left hidden by its entrance",
    );

    // Turning reduced motion on while the page is open removes every scripted change.
    await motion.goto(base + "/");
    await motion.waitForFunction(() => document.querySelector(".pci-strip.is-marquee"), null, { timeout: 8000 });
    await motion.emulateMedia({ reducedMotion: "reduce" });
    await motion.waitForFunction(() => !document.querySelector(".pci-strip.is-marquee"), null, { timeout: 5000 });
    assert.equal(await motion.locator(".pci-split-mask").count(), 0, "Split headlines are restored");
    assert.equal(await motion.locator(".pci-strip__track").count(), 0, "The principle strip is a plain list again");
    assert.deepEqual(
      await motion.evaluate(() =>
        [
          ".pci-spotlight__cover",
          ".pci-spotlight__thread",
          ".pci-footer__thread",
          "[data-route-line]",
          ".pci-hero__media img",
        ]
          .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
          .filter((element) => element.getAttribute("style"))
          .map((element) => element.className.baseVal ?? element.className),
      ),
      [],
      "Every scene owner removes its inline state on teardown",
    );

    // Reduced motion switched on while the motion bundle is still waiting on fonts and imports.
    const early = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    watch(early);
    await early.goto(base + "/");
    await early.emulateMedia({ reducedMotion: "reduce" });
    await early.waitForTimeout(2500);
    assert.equal(await early.locator(".pci-split-mask").count(), 0, "A cancelled setup leaves no split text");
    assert.equal(await early.locator(".pci-strip.is-marquee").count(), 0, "A cancelled setup leaves no marquee");
    await scrollThrough(early);
    assert.deepEqual(await stuckElements(early), [], "A cancelled setup hides nothing");

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
    assert.equal(
      await still.evaluate(() => getComputedStyle(document.querySelector(".pci-intro")).display),
      "none",
      "No brand intro under reduced motion",
    );

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

    // The desktop director never runs on a phone.
    await phone.goto(base + "/");
    await phone.waitForTimeout(1500);
    assert.deepEqual(
      await phone.evaluate(() => [
        getComputedStyle(document.querySelector(".pci-hero__glow")).display,
        document.querySelector(".pci-pillar__coin").getAttribute("style"),
      ]),
      ["none", null],
      "No desktop choreography on a phone",
    );

    // Phone pillars: a swipe of the native card row selects the card that settles in view.
    await phone.goto(base + "/");
    await phone.waitForTimeout(900);
    await phone.locator("[data-pillars-panels]").evaluate((track) => {
      const cards = track.querySelectorAll('[role="tabpanel"]');
      track.scrollTo({ left: cards[2].offsetLeft - cards[0].offsetLeft, behavior: "instant" });
    });
    await phone.waitForTimeout(400);
    assert.equal(
      await phone.locator('#our-pillars [role="tab"][aria-selected="true"]').getAttribute("data-pillar"),
      "climate",
      "Swiping the cards keeps the stage in step",
    );
    assert.equal(
      await phone.evaluate(() => getComputedStyle(document.querySelector(".pci-route__svg--compact")).display),
      "block",
      "Phones get the compact route composition",
    );

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
      "Motion checks passed: six scenes, ownership and teardown, menu lock, filter transaction, pillars restore, focus, reduced motion, phone and no-JS.",
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
