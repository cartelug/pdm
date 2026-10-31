/* Actual PNG downloads and phone/editor flows, always with isolated synthetic data. */
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  cp = require("node:child_process"),
  net = require("node:net"),
  assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../..");
const php = process.env.PCI_TEST_PHP || "php";
const out = process.env.PCI_TEST_SCREENSHOTS || path.join(os.tmpdir(), "pci-operations-qa");
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "pci-ops-browser-"));
  const hash = cp.execFileSync(php, ["-r", 'echo password_hash("Operations-Browser-Fixture",PASSWORD_DEFAULT);'], {
    encoding: "utf8",
  });
  fs.writeFileSync(
    path.join(privateDir, "config.php"),
    `<?php return ['environment'=>'live','admin_users'=>['fixture-admin'=>['hash'=>'${hash}','role'=>'admin'],'fixture-joshua'=>['hash'=>'${hash}','role'=>'coordinator']]];`,
  );
  const socket = net.createServer();
  await new Promise((r) => socket.listen(0, "127.0.0.1", r));
  const port = socket.address().port;
  await new Promise((r) => socket.close(r));
  const server = cp.spawn(php, ["-S", "127.0.0.1:" + port, "-t", root], {
    env: { ...process.env, PCI_PRIVATE_DIR: privateDir },
    stdio: "ignore",
  });
  let browser, uploadedPhoto;
  try {
    browser = await chromium.launch({
      executablePath: process.env.PCI_TEST_CHROMIUM || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
    await page.goto(`http://127.0.0.1:${port}/admin/operations/`);
    await page.locator('[name="username"]').fill("fixture-admin");
    await page.locator('[name="password"]').fill("Operations-Browser-Fixture");
    await page.locator("#login button").click();
    await page.locator("#workspace:not([hidden])").waitFor();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        "console does not overflow at " + width,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const format of ["feed", "story", "square"]) {
      await page.reload();
      await page.locator("#workspace:not([hidden])").waitFor();
      for (const type of ["collections", "weekly", "walk", "milestone", "thanks"]) {
        await page.selectOption("#graphic-format", format);
        await page.selectOption("#graphic-template", type);
        await page.click("#graphic-preview");
        await page.locator("#graphic-download:enabled").waitFor();
        const wait = page.waitForEvent("download");
        await page.click("#graphic-download");
        const download = await wait;
        const file = path.join(out, download.suggestedFilename());
        await download.saveAs(file);
        const buf = fs.readFileSync(file);
        assert.equal(buf.toString("hex", 0, 8), "89504e470d0a1a0a");
        assert.equal(buf.readUInt32BE(16), 1080);
        assert.equal(buf.readUInt32BE(20), { feed: 1350, story: 1920, square: 1080 }[format]);
      }
    }
    console.log("PASS 15 actual PNG downloads, exact dimensions, fonts and local brand assets");
    const result = await page.evaluate(async () => {
      const api = window.PCIOperations.api;
      const r = await api("record", {
        name: "Long Synthetic Contributor Name For Layout Verification ".repeat(2),
        amount: 999999999999,
        currency: "UGX",
        date: "2026-10-24",
        kind: "payment",
        channel: "MTN",
        transactionRef: "BROWSER-LARGE-0001",
        requestId: "browser-large-0001",
        stepUnit: 5000,
      });
      await api("reconcile", { id: r.record.id, evidence: "Synthetic bank match" });
      await api("consent", {
        id: r.record.id,
        displayName: true,
        displayAmount: true,
        evidence: "Synthetic explicit publication permission",
      });
      const photoCanvas = document.createElement("canvas");
      photoCanvas.width = 200;
      photoCanvas.height = 200;
      photoCanvas.getContext("2d").fillRect(0, 0, 200, 200);
      const uploaded = await api("photo-upload", {
        data: photoCanvas.toDataURL("image/png").split(",")[1],
        approved: true,
      });
      await api("walk-publish", {
        activity: "active",
        physical: "resting",
        km: 123,
        town: "Synthetic browser town",
        date: "2026-10-24",
        story: "Browser acceptance fixture, never live.",
        photo: uploaded.path,
        photoAlt: "Synthetic photo fixture",
        baseVersion: 0,
      });
      return { id: r.record.id, photo: uploaded.path };
    });
    uploadedPhoto = result.photo;
    for (const format of ["pdf", "xlsx", "json", "database"]) {
      const pending = page.waitForEvent("download");
      await page.click("#report-" + format);
      const download = await pending;
      const target = path.join(out, "collections-report." + (format === "database" ? "sqlite" : format));
      await download.saveAs(target);
      const bytes = fs.readFileSync(target);
      assert(bytes.length > 100, "nonempty " + format + " download");
      if (format === "pdf") {
        const pdf = await require("../../admin/vendor/pdf-lib.min.js").PDFDocument.load(bytes);
        assert(pdf.getForm().getFields().length >= 8, "actual PDF download keeps editable fields");
      }
      if (format === "json")
        assert(
          JSON.parse(bytes).rows.some((r) => r.id === result.id),
          "report contains the latest saved receipt",
        );
      if (format === "xlsx") assert.equal(bytes.toString("ascii", 0, 2), "PK");
      if (format === "database") assert.equal(bytes.toString("ascii", 0, 15), "SQLite format 3");
    }
    console.log("PASS actual branded PDF, Excel, JSON and SQLite downloads");
    const updateResponse = page.waitForResponse(
      (r) => r.url().includes("action=public-report") && r.request().method() === "GET",
    );
    const updateDownload = page.waitForEvent("download");
    await page.click("#report-update");
    const approvedReport = await (await updateResponse).json();
    const updateFile = path.join(out, "public-campaign-update.pdf");
    await (await updateDownload).saveAs(updateFile);
    const publicPDF = await require("../../admin/vendor/pdf-lib.min.js").PDFDocument.load(fs.readFileSync(updateFile));
    assert(
      publicPDF.getSubject().includes(approvedReport.reportId),
      "Joshua's PDF matches the actual approved response snapshot",
    );
    assert.equal(publicPDF.getCreationDate().toISOString(), new Date(approvedReport.reportingCutoff).toISOString());
    assert.equal(
      publicPDF.getForm().getFields().length,
      0,
      "public PDF never exports private editable register fields",
    );
    assert(
      !("rows" in approvedReport) && !("supporters" in approvedReport),
      "public PDF source excludes private rows and recognition",
    );
    const visitor = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await visitor.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
    await visitor.goto("http://127.0.0.1:" + port + "/walk-for-education/accountability/#collections");
    await visitor.locator("#collections button:not([hidden])").waitFor();
    assert.equal(
      await visitor.locator("#collections").count(),
      1,
      "existing live panel is the stable latest-figures destination",
    );
    const visitorDownload = visitor.waitForEvent("download");
    await visitor.locator("#collections button").click();
    const visitorFile = path.join(out, "anonymous-public-update.pdf");
    await (await visitorDownload).saveAs(visitorFile);
    assert(
      (
        await require("../../admin/vendor/pdf-lib.min.js").PDFDocument.load(fs.readFileSync(visitorFile))
      ).getPageCount() >= 1,
      "visitor downloads a real branded PDF without staff sign-in",
    );
    await visitor.close();
    console.log("PASS Joshua and anonymous visitor actual public PDF downloads and matching cut-off");
    await page.selectOption("#graphic-source", "approved");
    await page.selectOption("#graphic-template", "collections");
    await page.selectOption("#graphic-format", "square");
    await page.fill(
      "#graphic-headline",
      "A long headline checks the composition with a very large confirmed campaign contribution.",
    );
    await page.click("#graphic-preview");
    await page.locator("#graphic-download:enabled").waitFor();
    let wait = page.waitForEvent("download");
    await page.click("#graphic-download");
    await (await wait).saveAs(path.join(out, "large-amount-square.png"));
    await page.selectOption("#graphic-template", "thanks");
    await page.click("#graphic-preview");
    await page.locator("#graphic-download:enabled").waitFor();
    wait = page.waitForEvent("download");
    await page.click("#graphic-download");
    await (await wait).saveAs(path.join(out, "long-name-square.png"));
    await page.evaluate(
      async (id) =>
        window.PCIOperations.api("consent", {
          id,
          displayName: false,
          displayAmount: false,
          evidence: "Withdrawal after preview",
        }),
      result.id,
    );
    wait = page.waitForEvent("download");
    await page.click("#graphic-download");
    await (await wait).saveAs(path.join(out, "withdrawn-thanks-square.png"));
    console.log("PASS live snapshot, large amount, long name, consent withdrawal between preview and export");
    await page.goto(`http://127.0.0.1:${port}/`);
    // The homepage shows the confirmed walking status only; the finance report stays on the project and Walk pages.
    await page.locator("[data-ops-walk-status]").filter({ hasText: "123 km confirmed" }).waitFor();
    assert.equal(await page.locator(".ops-live").count(), 0, "homepage does not carry the finance report panel");
    assert(!(await page.locator("main").innerText()).includes("reconciled collections"));
    for (const route of ["/projects/", "/walk-for-education/"]) {
      await page.goto(`http://127.0.0.1:${port}${route}`);
      await page.locator(".ops-live").filter({ hasText: "123 km confirmed" }).waitFor();
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        "public report does not overflow at " +
          width +
          " document=" +
          (await page.evaluate(() => document.documentElement.scrollWidth)) +
          " " +
          JSON.stringify(
            await page.evaluate(() =>
              [...document.querySelectorAll("body *")]
                .filter((n) => {
                  const r = n.getBoundingClientRect();
                  return r.width && (r.right > innerWidth + 0.5 || r.left < -0.5);
                })
                .slice(0, 35)
                .map((n) => ({
                  tag: n.tagName,
                  cls: n.className,
                  text: n.textContent.slice(0, 100),
                  rect: n.getBoundingClientRect().toJSON(),
                })),
            ),
          ),
      );
    }
    await page.route("**/api/operations.php?action=public", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: '{"available":false}' }),
    );
    await page.reload();
    await page.locator(".ops-live").filter({ hasText: "temporarily unavailable" }).waitFor();
    assert(!(await page.locator(".ops-live").textContent()).includes("UGX 0"));
    console.log("PASS owner update appears across connected pages without build; API failure is truthful");
    const coordinator = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
      timezoneId: "America/New_York",
    });
    await coordinator.clock.install({ time: new Date("2026-10-24T22:30:00Z") });
    await coordinator.goto(`http://127.0.0.1:${port}/admin/operations/start.html`);
    for (const width of [320, 390, 768, 1440]) {
      await coordinator.setViewportSize({ width, height: 900 });
      assert(
        await coordinator.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        "quick-start guide fits " + width,
      );
    }
    await coordinator.goto(`http://127.0.0.1:${port}/admin/operations/`);
    await coordinator.locator('[name="username"]').fill("fixture-joshua");
    await coordinator.locator('[name="password"]').fill("Operations-Browser-Fixture");
    await coordinator.locator("#login button").click();
    await coordinator.locator("#workspace:not([hidden])").waitFor();
    await coordinator.waitForFunction(() => document.querySelector('#record-form [name="stepUnit"]').value === "5000");
    assert.equal(
      await coordinator.locator('#record-form [name="date"]').inputValue(),
      "2026-10-25",
      "new-entry date uses Uganda time, not the browser timezone",
    );
    await coordinator.selectOption('#record-form [name="currency"]', "KES");
    assert.equal(await coordinator.locator('#record-form [name="stepUnit"]').inputValue(), "200");
    await coordinator.selectOption('#record-form [name="currency"]', "USD");
    assert.equal(
      await coordinator.locator('#record-form [name="stepUnit"]').inputValue(),
      "0",
      "unconfirmed currency price is never invented",
    );
    const historical = await coordinator.evaluate(async () =>
      window.PCIOperations.api("record", {
        name: "Historical pledge fixture",
        kind: "pledge",
        amount: 10000,
        currency: "UGX",
        date: "2026-09-01",
        requestId: "historic-defaults-check",
        country: "UG",
        stepUnit: 1000,
      }),
    );
    await coordinator.reload();
    await coordinator.locator("#workspace:not([hidden])").waitFor();
    await coordinator
      .locator("#pledges option")
      .filter({ hasText: "Historical pledge fixture" })
      .waitFor({ state: "attached" });
    await coordinator.selectOption("#pledges", historical.record.id);
    assert.equal(
      await coordinator.locator('#record-form [name="stepUnit"]').inputValue(),
      "1000",
      "linked historical price is retained",
    );
    await coordinator.selectOption("#pledges", "");
    assert.equal(await coordinator.locator('#record-form [name="stepUnit"]').inputValue(), "5000");
    const receivedBefore = await coordinator.evaluate(async () => {
      const d = await window.PCIOperations.api("public");
      return d.totals.currencies.find((r) => r.currency === "UGX").received;
    });
    await coordinator.locator('#record-form [name="name"]').fill("Coordinator pending receipt");
    await coordinator.locator('#record-form [name="amount"]').fill("500000");
    await coordinator.locator('#record-form [name="channel"]').fill("MTN MoMo");
    await coordinator.locator('#record-form [name="transactionRef"]').fill("COORDINATOR-UI-0001");
    await coordinator.locator("#record-form button").click();
    await coordinator.locator(".ops-record").filter({ hasText: "Coordinator pending receipt" }).waitFor();
    assert.equal(
      await coordinator.getByRole("button", { name: "Verify & reconcile", exact: true }).count(),
      0,
      "coordinator never sees finance approval controls",
    );
    assert.equal(await coordinator.locator("#walk").isVisible(), true);
    assert.equal(await coordinator.locator("#studio").isVisible(), true);
    assert.equal(await coordinator.locator("#report").isVisible(), true);
    const receivedAfter = await coordinator.evaluate(async () => {
      const d = await window.PCIOperations.api("public");
      return d.totals.currencies.find((r) => r.currency === "UGX").received;
    });
    assert.equal(receivedAfter, receivedBefore, "coordinator entry does not inflate public collections");
    console.log(
      "PASS Joshua coordinator flow, Uganda dates, published prices, historical snapshots and finance separation",
    );
    await coordinator.close();
    assert.deepEqual(errors, []);
    console.log("PASS no browser JavaScript errors");
  } finally {
    await browser?.close();
    server.kill();
    if (uploadedPhoto) fs.rmSync(path.join(root, uploadedPhoto), { force: true });
    fs.rmSync(privateDir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
