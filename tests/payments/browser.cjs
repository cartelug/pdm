/* Local browser QA with isolated database. Requires Playwright and a Chromium executable. */
const fs = require("fs"),
  os = require("os"),
  path = require("path"),
  cp = require("child_process"),
  net = require("net");
const { chromium: playwright } = require(process.env.PCI_TEST_PLAYWRIGHT || "playwright");
const packedModule = process.env.PCI_TEST_CHROMIUM_MODULE ? require(process.env.PCI_TEST_CHROMIUM_MODULE) : null;
const packedChromium = packedModule && (packedModule.default || packedModule);
const root = path.resolve(__dirname, "../..");
let checks = 0;
function check(value, message) {
  if (!value) throw new Error(message);
  checks++;
  console.log("PASS " + message);
}
async function savePledge(page, base) {
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("api/payments/index.php?action=create") && response.request().method() === "POST",
  );
  await page.click("#submitContribution");
  const result = await (await saved).json();
  await page.locator("#pledgeSavedPanel:not([hidden])").waitFor();
  check(page.url().startsWith(base + "/contribute/?"), "saving a pledge keeps the supporter on the saved confirmation");
  const whatsapp = new URL(await page.locator("#openPledgeWhatsapp").getAttribute("href"));
  const message = whatsapp.searchParams.get("text");
  check(
    whatsapp.pathname === "/256772150281" && message.includes(result.contribution.reference),
    "saved pledge prepares the campaign WhatsApp with its recorded reference",
  );
  check(!whatsapp.href.includes(result.token), "WhatsApp handoff excludes the private viewer token");
  check(!page.url().includes(result.token), "saved confirmation URL excludes the private viewer token");
  check(
    (await page.locator("#pledgeSavedMessage").inputValue()) === message &&
      (await page.locator("#pledgeSavedMessage").getAttribute("readonly")) !== null,
    "saved pledge keeps the exact prepared message available for manual copying",
  );
  return { result, message };
}
async function submitPledgeViaWhatsapp(page, base) {
  const { result, message } = await savePledge(page, base);
  await page.route("https://wa.me/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>Local WhatsApp handoff fixture</title>" }),
  );
  await page.click("#openPledgeWhatsapp");
  await page.waitForURL("https://wa.me/**");
  check(
    page.url().includes(encodeURIComponent(result.contribution.reference)),
    "WhatsApp opens only after the explicit supporter action",
  );
  await page.goto(base + "/contribute/payment/?reference=" + encodeURIComponent(result.contribution.reference));
  return message;
}
(async () => {
  const privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "pci-browser-"));
  const php = process.env.PCI_TEST_PHP || "php",
    flags = process.env.PCI_TEST_PHP_INI ? ["-c", process.env.PCI_TEST_PHP_INI] : [];
  const hash = cp.execFileSync(
    php,
    [...flags, "-r", 'echo password_hash("Fixture-Only-Password", PASSWORD_DEFAULT);'],
    { encoding: "utf8" },
  );
  fs.writeFileSync(
    path.join(privateDir, "config.php"),
    `<?php return ['environment'=>'sandbox','admin_users'=>['admin'=>['hash'=>'${hash}','role'=>'admin']]];`,
  );
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const server = cp.spawn(php, [...flags, "-S", "127.0.0.1:" + port, "-t", root], {
    env: { ...process.env, PCI_PRIVATE_DIR: privateDir },
    stdio: "ignore",
  });
  let browser;
  try {
    const executablePath =
      process.env.PCI_TEST_CHROMIUM || (packedChromium ? await packedChromium.executablePath() : undefined);
    browser = await playwright.launch({
      executablePath,
      headless: true,
      // Separate browser processes keep timezone emulation isolated between visitor contexts.
      args: packedChromium ? packedChromium.args.filter((arg) => arg !== "--single-process") : ["--no-sandbox"],
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "Africa/Kampala" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = "http://127.0.0.1:" + port;
    const shots = process.env.PCI_TEST_SCREENSHOTS || path.join(os.tmpdir(), "pci-screenshots");
    fs.mkdirSync(shots, { recursive: true });
    await page.goto(base + "/walk-for-education/?ref=qa-club");
    await page.locator("#campaignCheckoutStatus").filter({ hasText: "Pledge your steps" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    check(
      (await page.locator("#campaignTotal").innerText()) === "UGX 250,000",
      "campaign suggests fifty steps at UGX 5,000 each",
    );
    check(
      (await page.locator("[data-step-option]").first().getAttribute("data-step-option")) === "100",
      "campaign presents higher contribution options first",
    );
    check(
      (await page.locator(".wfe2-nav .wfe2-brand img").getAttribute("src")).endsWith("pamodzi-logo-transparent.png"),
      "campaign uses the main website PCI logo",
    );
    await page.click('[data-step-option="5"]');
    check(
      (await page.locator("#campaignTotal").innerText()) === "UGX 25,000",
      "minimum five-step option computes the correct price",
    );
    check(await page.locator('[data-step-adjust="-1"]').isDisabled(), "campaign decrement stops at five steps");
    await page.fill("#campaignSteps", "4");
    check(
      (await page.locator("#campaignContribute").getAttribute("aria-disabled")) === "true",
      "four campaign steps cannot continue",
    );
    await page.fill("#campaignSteps", "20001");
    check(
      (await page.locator("#campaignContribute").getAttribute("aria-disabled")) === "true",
      "campaign enforces maximum steps",
    );
    await page.click("#campaignCustom");
    check(
      await page.locator("#campaignSteps").evaluate((el) => el === document.activeElement),
      "custom option focuses the number field",
    );
    await page.fill("#campaignSteps", "7");
    check(
      (await page.locator("#campaignTotal").innerText()) === "UGX 35,000",
      "custom campaign steps compute the correct price",
    );
    check(
      (await page.locator("#campaignContribute").getAttribute("href")).includes("steps=7&country=UG&ref=qa-club"),
      "campaign carries steps and referral into checkout",
    );
    await page.fill("#campaignSteps", "1.5");
    check(
      (await page.locator("#campaignContribute").getAttribute("aria-disabled")) === "true",
      "fractional campaign steps cannot continue",
    );
    await page.fill("#campaignSteps", "7");
    for (const width of [320, 360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
        console.log(
          await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
            client: innerWidth,
            elements: [...document.querySelectorAll("body *")]
              .map((e) => ({
                tag: e.tagName,
                id: e.id,
                cls: e.className,
                right: e.getBoundingClientRect().right,
                left: e.getBoundingClientRect().left,
                width: e.getBoundingClientRect().width,
                scroll: e.scrollWidth,
                client: e.clientWidth,
              }))
              .filter((e) => e.right > innerWidth + 0.05 || e.left < -0.05 || e.scroll > e.client + 1)
              .slice(0, 25),
          })),
        );
        await page.screenshot({ path: path.join(shots, "campaign-overflow.png"), fullPage: true });
      }
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "campaign layout fits " + width + "px",
      );
      if (width === 390 || width === 1440) {
        for (const section of await page.locator("main section").all()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(150);
        }
        await page.evaluate(() => {
          document.activeElement.blur();
          scrollTo({ top: 0, behavior: "instant" });
        });
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(shots, width === 390 ? "campaign-mobile.png" : "campaign-desktop.png"),
          fullPage: true,
        });
        await page.screenshot({
          path: path.join(shots, width === 390 ? "campaign-mobile-hero.png" : "campaign-desktop-hero.png"),
        });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click("#wfeMenuButton");
    check(
      (await page.locator("#wfeMenuButton").getAttribute("aria-expanded")) === "true",
      "mobile campaign menu opens",
    );
    await page.keyboard.press("Escape");
    check(
      (await page.locator("#wfeMenuButton").getAttribute("aria-expanded")) === "false",
      "Escape closes the mobile campaign menu",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    check((await page.locator(".wfe-reveal.waiting").count()) === 0, "reduced motion keeps campaign sections visible");
    for (const slug of ["take-part", "partners", "accountability", "updates"]) {
      await page.goto(base + "/walk-for-education/" + slug + "/");
      await page.locator(".wfe2-nav").waitFor();
      check((await page.locator("h1").count()) === 1, slug + " has one clear page heading");
      check(
        (await page.locator(".wfe2-footer-contact a[data-wfe-email]").getAttribute("href")) ===
          "mailto:pci.uganda@gmail.com",
        slug + " uses the coordinator contact from the supplied proposal",
      );
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          slug + " layout fits " + width + "px",
        );
        if (width === 390 || width === 1440)
          await page.screenshot({
            path: path.join(shots, slug + (width === 390 ? "-mobile.png" : "-desktop.png")),
            fullPage: true,
          });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/walk-for-education/take-part/#rotary");
    check(
      (await page.locator("#tab-rotary").getAttribute("aria-selected")) === "true" &&
        (await page.locator("#panel-rotary").isVisible()),
      "club link opens the Rotary participation panel",
    );
    await page.locator("#tab-rotary").focus();
    await page.keyboard.press("ArrowRight");
    check(
      (await page.locator("#tab-organisation").getAttribute("aria-selected")) === "true",
      "participation tabs support keyboard arrow navigation",
    );
    await page.goto(base + "/walk-for-education/partners/?priority=school#request-pack");
    check(
      (await page.locator('[name="priority"]').inputValue()) === "school",
      "education priority link prefills the partnership request",
    );
    await page.goto(base + "/walk-for-education/partners/?builder=platinum#request-pack");
    check(
      (await page.locator('[name="builder"]').inputValue()) === "platinum",
      "Builder level link prefills the partnership request",
    );
    await page.locator('.wfe-enquiry-form button[type="submit"]').click();
    check(
      (await page.locator('[name="name"]').getAttribute("aria-invalid")) === "true",
      "partnership enquiry explains missing name",
    );
    await page.fill('[name="name"]', "Local QA Supporter");
    await page.fill('[name="contact"]', "invalid");
    await page.locator('.wfe-enquiry-form button[type="submit"]').click();
    check(
      (await page.locator('[name="contact"]').getAttribute("aria-invalid")) === "true",
      "partnership enquiry validates contact before preparing an email",
    );
    await page.route("**/api/campaign.php", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: 'window.WFE_LIVE={updates:[{date:"2026-10-06",location:"Local QA",title:"Approved fixture field note",body:"A local fixture, not a published campaign event."}]};',
      }),
    );
    await page.goto(base + "/walk-for-education/");
    await page.locator("[data-wfe-latest-update]").filter({ hasText: "Approved fixture field note" }).waitFor();
    check(
      await page.locator(".wfe2-latest").isVisible(),
      "main campaign shows approved field updates from the shared campaign record",
    );
    await page.unroute("**/api/campaign.php");
    await page.goto(base + "/walk-for-education/");
    await page.locator("#campaignCheckoutStatus").filter({ hasText: "Pledge your steps" }).waitFor();
    check(
      await page.locator(".wfe2-latest").isVisible(),
      "campaign mission briefings remain available before walk field notes arrive",
    );
    check(
      (await page.locator("[data-wfe-latest-update] article").count()) === 3 &&
        !(await page.locator("[data-wfe-latest-update]").innerText()).includes("Approved fixture field note"),
      "the live homepage shows three mission briefings without inventing or retaining fixture activities",
    );
    await page.fill("#campaignSteps", "7");
    await page.locator("#campaignContribute").click();
    await page.waitForURL("**/contribute/?steps=7&country=UG&ref=qa-club");
    await page.locator("#submitContribution:not([disabled])").waitFor();
    const retained = {
      steps: await page.locator("#stepCount").inputValue(),
      amount: await page.locator("#summaryAmount").innerText(),
    };
    check(
      retained.steps === "7" && retained.amount === "UGX 35,000",
      "checkout retains selected steps and amount" +
        (retained.steps === "7" && retained.amount === "UGX 35,000" ? "" : " (got " + JSON.stringify(retained) + ")"),
    );
    check(
      (await page.locator("#checkoutChoicePanel").isHidden()) &&
        (await page.locator("#selectedStepsAmount").innerText()) === "UGX 35,000",
      "preselected checkout leads straight to details with a clear amount",
    );
    await page.screenshot({ path: path.join(shots, "contribute-selected-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator("header.collections-header nav a").filter({ hasText: "The campaign" }).click();
    await page.waitForURL((url) => url.pathname === "/walk-for-education/");
    check(await page.locator("#campaignSteps").isVisible(), "checkout header navigation returns to the campaign");
    await page.fill("#campaignSteps", "7");
    await page.click("#campaignContribute");
    await page.waitForURL("**/contribute/?steps=7&country=UG&ref=qa-club");
    await page.locator("#submitContribution:not([disabled])").waitFor();
    await page.locator("#submitContribution:not([disabled])").waitFor();
    check(
      (await page.locator('[data-kind="pledge"]').getAttribute("aria-pressed")) === "true",
      "closed checkout selects pledge",
    );
    check(await page.locator('[data-kind="payment"]').isDisabled(), "unconfigured payment option cannot be selected");
    await page.click("#changeContribution");
    check(
      await page.locator("#checkoutChoicePanel").isVisible(),
      "selected contribution can be changed before submitting",
    );
    await page.fill("#stepCount", "4");
    check(await page.locator("#submitContribution").isDisabled(), "checkout rejects fewer than five steps");
    await page.fill("#stepCount", "5");
    check(
      (await page.locator("#summaryAmount").innerText()) === "UGX 25,000" &&
        (await page.locator('[data-checkout-adjust="-1"]').isDisabled()),
      "checkout accepts five steps and stops decrementing",
    );
    await page.click('[data-steps="20"]');
    check(
      (await page.locator("#summaryAmount").textContent()).replace(/[\s,]/g, "") === "UGX100000",
      "suggested amount updates summary",
    );
    await page.fill("#stepCount", "15");
    check(
      (await page.locator("#summaryAmount").textContent()).replace(/[\s,]/g, "") === "UGX75000",
      "custom steps update checkout amount",
    );
    let invalidSubmissions = 0;
    const observeInvalid = (request) => {
      if (request.url().endsWith("?action=create")) invalidSubmissions++;
    };
    page.on("request", observeInvalid);
    for (const value of ["", "0", "-5", "4", "1.5", "20001"]) {
      await page.fill("#stepCount", value);
      check(
        (await page.locator("#summaryAmount").innerText()) === "—" &&
          (await page.locator("#selectedStepsAmount").innerText()) === "—" &&
          (await page.locator("#stepCount").getAttribute("aria-invalid")) === "true" &&
          (await page.locator("#submitContribution").isDisabled()),
        "invalid steps " + JSON.stringify(value) + " clear both amounts and block submission",
      );
      await page
        .locator("#contributionForm")
        .evaluate((form) => form.dispatchEvent(new Event("submit", { cancelable: true })));
    }
    check(
      invalidSubmissions === 0,
      "invalid whole-step values never reach the create API, including a direct submit event",
    );
    page.off("request", observeInvalid);
    await page.fill("#stepCount", "15");
    await page.screenshot({ path: path.join(shots, "contribute-desktop.png"), fullPage: true });
    for (const width of [320, 360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
        console.log(
          await page.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .map((e) => ({ tag: e.tagName, id: e.id, cls: e.className, rect: e.getBoundingClientRect().toJSON() }))
              .filter((e) => e.rect.right > innerWidth || e.rect.left < 0)
              .slice(0, 10),
          ),
        );
        await page.screenshot({ path: path.join(shots, "contribute-overflow.png"), fullPage: true });
      }
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "contribution layout fits " + width + "px",
      );
      if (width === 390) await page.screenshot({ path: path.join(shots, "contribute-mobile.png"), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.fill("#supporterName", "Browser QA Supporter");
    await page.fill("#phone", "+256700000000");
    await page.check("#consent");
    const ugPledgeMessage = await submitPledgeViaWhatsapp(page, base);
    check(ugPledgeMessage.includes("15 steps (UGX 75,000)"), "WhatsApp message retains the Ugandan pledge amount");
    await page.locator("#receiptContent:not([hidden])").waitFor();
    const pledgeResultUrl = page.url();
    check(
      (await page.locator("#receiptState").innerText()) === "PLEDGED" ||
        (await page.locator("#receiptState").innerText()) === "pledged",
      "pledge result shows pledged status",
    );
    check((await page.locator("#receiptAmount").innerText()) === "UGX 75,000", "result retains selected amount");
    check(await page.locator("#printReceipt").isHidden(), "pledge does not produce paid receipt");
    check(await page.locator("#certificatePanel").isHidden(), "pledge does not unlock a certificate");
    check(
      await page.locator("#pledgeWhatsappPanel").isVisible(),
      "private pledge record offers a WhatsApp message fallback",
    );
    check(
      await page.locator("#pledgeCommunityInvite").isVisible(),
      "recorded pledge offers the campaign community invitation",
    );
    check(
      (await page.locator("#joinCampaignGroup").getAttribute("href")) ===
        "https://chat.whatsapp.com/D4gV4yL5q4HA6DqCYjvEwE?mode=gi_t",
      "pledge invitation uses the supplied WhatsApp group link",
    );
    check(page.url().includes("/contribute/payment/"), "joining WhatsApp requires a separate supporter action");
    check(
      (await page.locator("#receiptSteps").innerText()) === "15 steps × UGX 5,000",
      "result retains sponsored step count and unit price",
    );
    check(
      (await page.locator("#receiptEnvironment").innerText()) === "TEST — excluded from collections",
      "sandbox result is visibly labelled",
    );
    await page.click("#refreshPayment");
    check(
      (await page.locator("#feedback").innerText()).includes("No payment has been taken"),
      "status refresh preserves pledge outcome",
    );
    await page.screenshot({ path: path.join(shots, "pledge-result-mobile.png"), fullPage: true });
    await page.goto(base + "/admin/collections/");
    await page.fill("#password", "Fixture-Only-Password");
    await page.click("#loginButton");
    await page.locator("#dashboard:not([hidden])").waitFor();
    check(
      (await page.locator("#registerBody").innerText()).includes("Browser QA Supporter"),
      "admin sees recorded pledge",
    );
    check(
      (await page.locator("#totalPledged").innerText()) === "UGX 0",
      "sandbox pledge absent from live dashboard total",
    );
    check(
      (await page.locator("#registerBody").innerText()).includes("qa-club") === false,
      "referral not confused with supporter or campaign",
    );
    await page.fill("#searchRows", "no-matching-supporter");
    check((await page.locator("#registerBody").innerText()).includes("No matching"), "console search filters records");
    await page.fill("#searchRows", "");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(shots, "collections-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "console has contained mobile table scrolling",
    );
    await page.click("#logout");
    await page.locator("#loginPanel:not([hidden])").waitFor();
    check(await page.locator("#dashboard").isHidden(), "sign-out hides private dashboard");
    await page.goto(base + "/contribute/?steps=1");
    await page.waitForLoadState("networkidle");
    check(
      (await page.locator("#stepCount").inputValue()) === "1" &&
        (await page.locator("#selectedStepsAmount").innerText()) === "—" &&
        (await page.locator("#submitContribution").isDisabled()),
      "old one-step links ask the supporter to choose valid steps without silently changing the pledge",
    );
    check(
      await page.locator(".skip-link").evaluate((e) => e.getBoundingClientRect().bottom < 0),
      "skip link stays hidden until focused even with reduced motion",
    );
    if (process.env.PCI_TEST_CERTIFICATE_PATH) {
      /* Browser-only fixture responses test the callback-to-download UI. No ledger or provider is changed. */
      const cert = "WFE-" + "A".repeat(24),
        ref = "BROWSER-CERTIFICATE-FIXTURE";
      let looks = 0;
      await page.evaluate((ref) => sessionStorage.setItem("pci-view-" + ref, "fixture-viewer-token"), ref);
      await page.clock.install();
      await page.route("**/api/payments/index.php?action=lookup", async (route) => {
        looks++;
        const successful = looks > 1;
        await route.fulfill({
          json: {
            verificationDelayed: false,
            contribution: {
              reference: ref,
              campaign: "walk-for-education-2026",
              kind: "payment",
              environment: "live",
              status: successful ? "successful" : "pending",
              amount: 50000,
              steps: 10,
              step_unit: 5000,
              receipt: successful ? "R-" + ref : null,
              certificate: successful ? cert : null,
              created_at: "2026-10-05T10:00:00+00:00",
            },
          },
        });
      });
      await page.route("**/api/payments/index.php?action=certificate", async (route) => {
        const request = route.request();
        check(
          request.postDataJSON().token === "fixture-viewer-token" && !!request.headers()["x-csrf-token"],
          "certificate browser download sends viewer token and CSRF protection",
        );
        await route.fulfill({
          contentType: "application/pdf",
          body: fs.readFileSync(process.env.PCI_TEST_CERTIFICATE_PATH),
        });
      });
      await page.goto(base + "/contribute/payment/?reference=" + ref);
      await page.locator("#receiptContent:not([hidden])").waitFor();
      check(
        await page.locator("#certificatePanel").isHidden(),
        "pending callback fixture keeps the certificate locked",
      );
      await page.clock.fastForward(26000);
      await page.locator("#certificatePanel:not([hidden])").waitFor();
      check(
        (await page.locator("#receiptState").innerText()).toLowerCase() === "successful",
        "automatic pending-status check reveals verified successful callback fixture",
      );
      check(
        (await page.locator("#printReceipt").evaluate((e) => getComputedStyle(e).color)) !== "rgb(255, 255, 255)",
        "paid receipt print button has readable contrast",
      );
      const download = await Promise.all([page.waitForEvent("download"), page.click("#downloadCertificate")]);
      check(
        download[0].suggestedFilename() === cert + ".pdf",
        "verified certificate downloads with its certificate number",
      );
      await page.screenshot({ path: path.join(shots, "verified-certificate-mobile.png"), fullPage: true });
      await page.route("**/api/payments/index.php?action=verify-certificate&code=*", (route) =>
        route.fulfill({ json: { valid: true, steps: 10, amount: 50000, issuedAt: "2026-10-05T10:00:00+00:00" } }),
      );
      await page.goto(base + "/contribute/verify/?code=" + cert);
      await page.locator("#verifiedCertificate:not([hidden])").waitFor();
      check(
        (await page.locator("#verifiedAmount").innerText()) === "UGX 50,000" &&
          (await page.locator("#verifiedSteps").innerText()) === "10 steps",
        "public certificate page displays amount and steps from verification",
      );
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "certificate verification page fits mobile",
      );
    }
    /* Country question: the country sets the currency and the price of a step (Kenya: KSh 200). */
    {
      const nairobi = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        timezoneId: "Africa/Nairobi",
        locale: "en-US",
      });
      const visitor = await nairobi.newPage();
      visitor.on("pageerror", (e) => errors.push(e.message));
      await visitor.goto(base + "/walk-for-education/");
      await visitor.waitForFunction(() => !document.querySelector(".site-loader"));
      await visitor.waitForFunction(() => document.getElementById("campaignCountry").value === "KE");
      const text = (selector) => visitor.locator(selector).first().innerText();
      check(
        (await visitor
          .locator("#campaignCountry")
          .evaluate((el) => el === el.closest(".v3-give-card").querySelector("select"))) &&
          (await visitor.locator("#campaignCountry").inputValue()) === "KE",
        "campaign asks for the country first and detects Kenya from the visitor's time zone",
      );
      check(
        (await text('[data-sp="unit"]')) === "KSh 200" && (await text("#campaignTotal")) === "KSh 10,000",
        "Kenya: one step is KSh 200 and fifty steps are KSh 10,000",
      );
      check(
        (await visitor.locator("[data-step-option] strong").allInnerTexts())
          .map((t) => t.replace(/\s+/g, " "))
          .join("|") === "KSh 20,000|KSh 10,000|KSh 4,000|KSh 2,000|KSh 1,000",
        "every amount option is shown in KSh",
      );
      check(
        (await visitor.locator("#campaignContribute").getAttribute("href")).includes("steps=50&country=KE"),
        "the checkout link carries the chosen country",
      );
      check(
        (await visitor.locator(".wfe-sticky-contribute small").textContent()).includes("KSh 1,000"),
        "the sticky bar shows the minimum in KSh",
      );
      await visitor.fill("#campaignSteps", "4");
      check((await text("#campaignValidation")).includes("KSh 1,000"), "the five-step minimum is explained in KSh");
      await visitor.fill("#campaignSteps", "50");
      await visitor.locator("[data-country-panel] summary").click();
      await visitor.selectOption("#campaignCountry", "TZ");
      check(
        (await text("#campaignTotal")) === "TSh 200,000" && (await text('[data-sp="unit"]')) === "TSh 4,000",
        "changing the country to Tanzania changes the currency at once",
      );
      await visitor.selectOption("#campaignCountry", "US");
      check((await text("#campaignTotal")) === "US$100", "United States: fifty steps are US$100");
      await visitor.selectOption("#campaignCountry", "UG");
      check((await text("#campaignTotal")) === "UGX 250,000", "Uganda stays UGX 5,000 per step");
      await visitor.selectOption("#campaignCountry", "KE");

      await visitor.goto(base + "/contribute/?steps=50&country=KE");
      await visitor.waitForFunction(() => !document.querySelector(".site-loader"));
      await visitor.waitForFunction(() => document.getElementById("summaryAmount").textContent === "KSh 10,000");
      check(
        (await visitor.locator("#country").inputValue()) === "KE" &&
          (await visitor.locator('[data-sp="unit"]').first().textContent()) === "KSh 200",
        "the contribution form opens on the chosen country and price",
      );
      await visitor.fill("#supporterName", "Kenya Browser Supporter");
      await visitor.fill("#phone", "+254700000000");
      await visitor.check("#consent");
      const kePledgeMessage = await submitPledgeViaWhatsapp(visitor, base);
      check(kePledgeMessage.includes("50 steps (KSh 10,000)"), "WhatsApp message retains the Kenyan pledge amount");
      await visitor.locator("#receiptContent:not([hidden])").waitFor();
      check(
        (await text("#receiptAmount")) === "KSh 10,000" && (await text("#receiptSteps")) === "50 steps × KSh 200",
        "a Kenyan pledge is recorded and shown in KSh at 200 per step",
      );

      /* Checkout open for UGX only: Kenya stays on pledges; Uganda can explicitly choose online payment. */
      await visitor.route("**/api/payments/index.php?action=status", (route) =>
        route.fulfill({
          json: {
            checkoutEnabled: true,
            pledgesEnabled: true,
            environment: "live",
            stepUnit: 5000,
            stepCurrency: "UGX",
            paymentCurrencies: ["UGX"],
            minimumSteps: 5,
            maximumSteps: 20000,
          },
        }),
      );
      await visitor.goto(base + "/contribute/?steps=50&country=KE");
      await visitor.waitForFunction(() => !document.querySelector(".site-loader"));
      await visitor.waitForFunction(() => document.querySelector('[data-kind="payment"]').disabled);
      check(
        (await visitor.locator('[data-kind="pledge"]').getAttribute("aria-pressed")) === "true" &&
          (await text("#submitContribution")) === "Save my pledge" &&
          (await text('[data-kind="payment"]')).includes("KSh"),
        "while online payment is open only for UGX, a Kenyan is steered to a pledge",
      );
      await visitor.click('[data-country-featured="UG"]');
      await visitor.waitForFunction(() => !document.querySelector('[data-kind="payment"]').disabled);
      check(
        (await visitor.locator('[data-kind="pledge"]').getAttribute("aria-pressed")) === "true" &&
          (await text("#submitContribution")) === "Save my pledge",
        "switching to a payable country preserves the supporter's selected pledge",
      );
      await visitor.click('[data-kind="payment"]');
      check(
        (await visitor.locator('[data-kind="payment"]').getAttribute("aria-pressed")) === "true" &&
          (await text("#submitContribution")) === "Continue to secure payment",
        "a Ugandan can choose online payment when the service is enabled",
      );
      await visitor.unroute("**/api/payments/index.php?action=status");

      await visitor.route("**/api/payments/index.php?action=verify-certificate&code=*", (route) =>
        route.fulfill({
          json: { valid: true, steps: 50, amount: 10000, currency: "KES", issuedAt: "2026-10-05T10:00:00+00:00" },
        }),
      );
      await visitor.goto(base + "/contribute/verify/?code=WFE-" + "A".repeat(24));
      await visitor.locator("#verifiedCertificate:not([hidden])").waitFor();
      check(
        (await text("#verifiedAmount")) === "KSh 10,000",
        "the public certificate check shows the contribution in its own currency",
      );
      await nairobi.close();
    }
    /* Country-first controls, deep links and small-screen presentation. */
    {
      const countries = await browser.newContext({
        viewport: { width: 375, height: 844 },
        timezoneId: "Africa/Kampala",
        reducedMotion: "reduce",
      });
      const view = await countries.newPage();
      view.on("pageerror", (e) => errors.push(e.message));
      await view.goto(base + "/walk-for-education/?country=KE&steps=20&ref=country-fixture");
      await view.waitForLoadState("networkidle");
      check(
        (await view.locator("#campaignCountry option:not([disabled])").count()) === 199,
        "all 199 countries remain available before filtering",
      );
      check(
        (await view.locator("#campaignCountry").inputValue()) === "KE" &&
          (await view.locator("#campaignSteps").inputValue()) === "20" &&
          (await view.locator("#campaignTotal").innerText()) === "KSh 4,000" &&
          (await view.locator('[data-country-featured="KE"]').getAttribute("aria-pressed")) === "true",
        "an explicit Kenya deep link overrides Kampala detection and sets steps, currency and country control",
      );
      check(
        await view.locator("a[href]").evaluateAll((links) => {
          const pledges = links.filter((link) => {
            const url = new URL(link.href);
            return url.origin === location.origin && /\/contribute\/$/.test(url.pathname);
          });
          return pledges.length > 0 && pledges.every((link) => new URL(link.href).searchParams.get("country") === "KE");
        }),
        "every campaign pledge link carries the selected Kenyan country",
      );
      await view.click('[data-country-featured="UG"]');
      check(
        (await view.locator("#campaignTotal").innerText()) === "UGX 100,000",
        "the Uganda country button reprices the same steps immediately",
      );
      await view.click('[data-country-featured="INT"]');
      check(
        (await view.locator("#campaignCountry").inputValue()) === "US" &&
          (await view.locator('[data-sp="policy"]').first().innerText()).includes("Indicative pledge amount"),
        "International exposes indicative pricing and a concrete country selection",
      );
      await view.fill("#campaignCountrySearch", "Tanzania");
      check(
        (await view.locator("#campaignCountry option:not([disabled])").allTextContents()).join("|") === "Tanzania",
        "country search filters the native country selector",
      );
      await view.selectOption("#campaignCountry", "TZ");
      check(
        (await view.locator("#campaignTotal").innerText()) === "TSh 80,000",
        "the searched country sets its own indicative amount",
      );
      await view.goto(base + "/walk-for-education/");
      await view.waitForLoadState("networkidle");
      check(
        (await view.locator("#campaignCountry").inputValue()) === "TZ" &&
          (await view.locator("#campaignSteps").inputValue()) === "20",
        "country and valid steps survive same-session page navigation",
      );
      await view.goto(base + "/walk-for-education/?country=KE&steps=50");
      await view.waitForLoadState("networkidle");
      for (const width of [320, 360, 375, 390, 768, 1024, 1440, 1920]) {
        await view.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
        check(
          await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          "Kenya campaign fits " + width + "px",
        );
        if (width === 375 || width === 1440) {
          for (const section of await view.locator("main section").all()) await section.scrollIntoViewIfNeeded();
          await view.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await view.screenshot({ path: path.join(shots, "kenya-campaign-" + width + ".png"), fullPage: true });
          await view.screenshot({ path: path.join(shots, "kenya-campaign-" + width + "-hero.png") });
        }
      }
      await view.goto(base + "/contribute/?country=KE&steps=50");
      await view.locator("#submitContribution:not([disabled])").waitFor();
      await view.click("#changeContribution");
      await view.click('[data-steps="5"]');
      await view.click('[data-steps="50"]');
      await view.reload();
      await view.locator("#submitContribution:not([disabled])").waitFor();
      const refreshed = {
        steps: await view.locator("#stepCount").inputValue(),
        amount: await view.locator("#summaryAmount").innerText(),
      };
      check(
        refreshed.steps === "50" && refreshed.amount === "KSh 10,000",
        "refresh keeps the latest preset rather than an older deep-link amount" +
          (refreshed.steps === "50" && refreshed.amount === "KSh 10,000"
            ? ""
            : " (got " + JSON.stringify(refreshed) + ")"),
      );
      await view.click("#changeContribution");
      for (const width of [320, 360, 375, 390, 768, 1024, 1440, 1920]) {
        await view.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
        check(
          await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          "Kenya pledge form fits " + width + "px",
        );
        if (width === 375 || width === 1440) {
          await view.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await view.screenshot({ path: path.join(shots, "kenya-contribute-" + width + ".png"), fullPage: true });
        }
      }
      await view.click('[data-country-featured="INT"]');
      await view.fill("#supporterName", "Search Enter Fixture");
      await view.fill("#phone", "+254700000000");
      await view.check("#consent");
      let searchSubmissions = 0;
      view.on("request", (request) => {
        if (request.url().endsWith("?action=create")) searchSubmissions++;
      });
      await view.fill("#pledgeCountrySearch", "Kenya");
      await view.locator("#pledgeCountrySearch").press("Enter");
      await view.waitForTimeout(200);
      check(
        searchSubmissions === 0 && (await view.locator("#contributionForm").isVisible()),
        "pressing Enter in country search cannot submit the pledge for the previously selected country",
      );
      await countries.close();
    }
    /* Optional browser storage and clipboard failures must preserve a saved pledge. */
    {
      const restricted = await browser.newContext({
        viewport: { width: 375, height: 844 },
        timezoneId: "Africa/Kampala",
      });
      await restricted.addInitScript(() => {
        Storage.prototype.getItem =
          Storage.prototype.setItem =
          Storage.prototype.removeItem =
            function () {
              throw new DOMException("Storage denied", "SecurityError");
            };
        Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: () => Promise.reject(new DOMException("Clipboard denied", "NotAllowedError")) },
          configurable: true,
        });
      });
      const view = await restricted.newPage();
      view.on("pageerror", (e) => errors.push(e.message));
      await view.goto(base + "/walk-for-education/?country=KE&steps=7&ref=denied-storage");
      await view
        .locator("#campaignContribute")
        .filter({ hasNot: view.locator('[aria-disabled="true"]') })
        .waitFor();
      await view.waitForLoadState("networkidle");
      check(
        (await view.locator("#campaignTotal").innerText()) === "KSh 1,400",
        "country and step deep links work when session storage is denied",
      );
      const fiveLink = view.locator('a[href*="mode=pledge"]');
      const fiveUrl = new URL(await fiveLink.getAttribute("href"));
      check(
        fiveUrl.searchParams.get("country") === "KE" &&
          fiveUrl.searchParams.get("steps") === "5" &&
          fiveUrl.searchParams.get("ref") === "denied-storage",
        "the five-step invitation preserves Kenya and referral while keeping its explicit five steps with storage denied",
      );
      await fiveLink.click();
      await view.locator("#submitContribution:not([disabled])").waitFor();
      check(
        (await view.locator("#summaryAmount").innerText()) === "KSh 1,000",
        "the five-step invitation opens a Kenyan pledge at KSh 1,000",
      );
      await view.goto(base + "/walk-for-education/?country=KE&steps=7&ref=denied-storage");
      await view.waitForLoadState("networkidle");
      await view.click("#wfeShare");
      await view.waitForFunction(() => document.querySelector("#wfeShareFeedback").textContent.includes("country=KE"));
      check(
        (await view.locator("#wfeShareFeedback").innerText()).includes("steps=7"),
        "denied clipboard leaves a shareable country-and-steps URL",
      );
      await view.click("#campaignContribute");
      await view.locator("#submitContribution:not([disabled])").waitFor();
      check(
        (await view.locator("#stepCount").inputValue()) === "7" &&
          new URL(view.url()).searchParams.get("ref") === "denied-storage",
        "checkout keeps steps and referral without optional browser storage",
      );
      await view.fill("#supporterName", "Storage Denied Fixture");
      await view.fill("#phone", "+254700000000");
      await view.check("#consent");
      const { result, message } = await savePledge(view, base);
      await view.click("#copyPledgeMessage");
      await view.waitForFunction(() => document.querySelector("#pledgeCopyStatus").textContent.includes("selected"));
      check(
        (await view
          .locator("#pledgeSavedMessage")
          .evaluate((area) => area.selectionStart === 0 && area.selectionEnd === area.value.length)) &&
          !(await view.locator("#pledgeCopyStatus").innerText()).includes("message copied"),
        "denied clipboard selects the entire pledge message and reports the manual copy fallback honestly",
      );
      await view.screenshot({ path: path.join(shots, "kenya-saved-pledge-375.png"), fullPage: true });
      await view.reload();
      await view.locator("#pledgeSavedPanel:not([hidden])").waitFor();
      check(
        (await view.locator("#pledgeSavedMessage").inputValue()) === message,
        "same-tab reload preserves the saved pledge confirmation with storage denied",
      );
      await view.click("#viewPledgeRecord");
      await view.locator("#receiptContent:not([hidden])").waitFor();
      check(
        (await view.locator("#receiptAmount").innerText()) === "KSh 1,400" && !view.url().includes(result.token),
        "the private pledge record opens from same-origin history state without putting its secret in the URL",
      );
      await view.goBack();
      await view.locator("#pledgeSavedPanel:not([hidden])").waitFor();
      check(
        (await view.locator("#pledgeSavedReference").innerText()) === result.contribution.reference,
        "returning from a private record restores the saved confirmation with storage denied",
      );
      await restricted.close();
    }
    /* Delayed pricing hides initial money values until the correct country is ready. */
    {
      const loading = await browser.newContext();
      let releasePrice;
      const priceGate = new Promise((resolve) => {
        releasePrice = resolve;
      });
      await loading.route("**/assets/data/step-prices.json", async (route) => {
        await priceGate;
        await route.fulfill({
          contentType: "application/json",
          body: fs.readFileSync(path.join(root, "assets/data/step-prices.json")),
        });
      });
      const view = await loading.newPage();
      view.on("pageerror", (e) => errors.push(e.message));
      await view.goto(base + "/contribute/?country=KE&steps=50", { waitUntil: "domcontentloaded" });
      check(
        (await view.locator("#submitContribution").isDisabled()) &&
          (await view.evaluate(
            () =>
              !window.StepPricing.current().ready &&
              [...document.querySelectorAll('[data-sp="unit"], #summaryAmount, #selectedStepsAmount')].every(
                (node) => getComputedStyle(node).visibility === "hidden",
              ),
          )),
        "while country pricing loads, monetary values stay hidden and saving stays disabled",
      );
      releasePrice();
      await view.locator("#submitContribution:not([disabled])").waitFor();
      check(
        (await view.locator("#summaryAmount").innerText()) === "KSh 10,000",
        "ready country pricing reveals the correct Kenyan amount",
      );
      await loading.close();
    }
    /* A failed pricing script must not guess a country or leave stale Ugandan totals. */
    {
      const missing = await browser.newContext();
      await missing.route("**/js/step-pricing.js*", (route) => route.abort("failed"));
      const view = await missing.newPage();
      view.on("pageerror", (e) => errors.push(e.message));
      for (const slug of ["walk-for-education", "contribute"]) {
        await view.goto(base + "/" + slug + "/?country=KE&steps=50");
        await view.waitForLoadState("networkidle");
        check(
          new URL(view.url()).searchParams.get("country") === "KE" &&
            (await view.locator('[data-sp="unit"]').first().innerText()) === "—" &&
            (await view.locator("[data-pricing-status]").innerText()).includes("could not load") &&
            (await view.locator('[data-country-featured="KE"]').isDisabled()),
          slug + " preserves the Kenyan deep link and explains a missing pricing script without quoting Uganda",
        );
        check(
          slug === "contribute"
            ? (await view.locator("#summaryAmount").innerText()) === "—" &&
                (await view.locator("#submitContribution").isDisabled())
            : (await view.locator("#campaignTotal").innerText()) === "—" &&
                (await view.locator("#campaignContribute").getAttribute("aria-disabled")) === "true",
          slug + " clears stale totals and disables continuation when the pricing script is missing",
        );
      }
      await missing.close();
    }
    /* An unavailable international price never silently becomes a Ugandan pledge. */
    {
      const failed = await browser.newContext();
      await failed.route("**/assets/data/step-prices.json", (route) => route.abort("failed"));
      const view = await failed.newPage();
      view.on("pageerror", (e) => errors.push(e.message));
      await view.goto(base + "/contribute/?country=US&steps=50");
      await view.waitForLoadState("networkidle");
      check(
        (await view.locator("#summaryAmount").innerText()) === "—" &&
          (await view.locator("#submitContribution").isDisabled()) &&
          (await view.locator("[data-pricing-status]").innerText()).includes("could not load"),
        "failed international price loading clears the amount, explains the problem and blocks submission",
      );
      await view.goto(base + "/contribute/?country=KE&steps=50");
      await view.locator("#submitContribution:not([disabled])").waitFor();
      check(
        (await view.locator("#summaryAmount").innerText()) === "KSh 10,000",
        "published Kenyan fallback remains correct when the price-table request fails",
      );
      await failed.close();
    }
    /* No page holds a loading screen any more (decision D9): every page paints at once. The hand-written
       campaign pages keep the page-ready contract (html.is-preloaded, PamodziPreloader.whenDone) that their
       entrance animations use. A fresh context keeps these independent of payment fixtures. */
    {
      const fresh = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const view = await fresh.newPage();
      view.on("pageerror", (e) => errors.push(e.message));
      await view.goto(pledgeResultUrl);
      check(
        await view.locator("#pledgeCommunityInvite").isHidden(),
        "a fresh visitor is not shown a private pledge community invitation",
      );
      check(await view.locator("#receiptContent").isHidden(), "a fresh visitor cannot see the private pledge record");
      for (const url of [
        "/",
        "/faith-in-motion/",
        "/projects/",
        "/walk-for-education/partners/",
        "/contribute/",
        "/404.html",
      ]) {
        await view.goto(base + url);
        check(
          (await view.locator(".site-loader").count()) === 0 && (await view.locator("h1").first().isVisible()),
          url + " paints its content at once, with no loading screen",
        );
        if (!(await view.locator("body[data-pci-v3]").count())) {
          check(
            await view.evaluate(
              () =>
                document.documentElement.classList.contains("is-preloaded") &&
                !document.documentElement.classList.contains("has-preloader"),
            ),
            url + " is ready at once and never covers the page",
          );
        }
      }
      await fresh.close();
      const noScript = await browser.newContext({ javaScriptEnabled: false });
      const still = await noScript.newPage();
      await still.goto(base + "/about/");
      check(
        (await still.locator(".site-loader").count()) === 0 && (await still.locator("h1").isVisible()),
        "institutional content is readable without JavaScript",
      );
      await still.goto(base + "/walk-for-education/");
      check(
        (await still.locator(".site-loader").count()) === 0 && (await still.locator("h1").first().isVisible()),
        "without JavaScript the campaign page has no loading screen and shows its heading",
      );
      await noScript.close();
    }
    check(errors.length === 0, "no browser JavaScript errors: " + errors.join("; "));
    console.log(`\n${checks} browser checks passed. Screenshots: ${shots}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
    fs.rmSync(privateDir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
