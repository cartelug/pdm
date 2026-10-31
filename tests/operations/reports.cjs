/* Export regression: actual PDF form and XLSX package, isolated synthetic data only. */
const assert = require("node:assert/strict");
globalThis.PDFLib = require("../../admin/vendor/pdf-lib.min.js");
globalThis.fontkit = require("../../admin/vendor/fontkit.umd.min.js");
require("../../js/operations-reports.js");
require("../../js/campaign-report-pdf.js");
const report = {
  exportedAt: "2026-10-27T09:00:00Z",
  totals: {
    confirmedSteps: 0,
    currencies: [{ currency: "UGX", pledged: 2500, received: 0, pending: 0, outstanding: 2500 }],
  },
  rows: Array.from({ length: 29 }, (_, i) => ({
    id: "TEST-" + i,
    name: i === 0 ? "=SUM(1,2) & <synthetic>" : "Synthetic family with a long supporter name",
    amount: 2500,
    currency: "UGX",
    kind: "pledge",
    step_unit: 5000,
    status: "pledged",
    included_received: false,
  })),
};
(async () => {
  const fs = require("node:fs"),
    path = require("node:path");
  const fonts = {
    regular: fs.readFileSync(path.join(__dirname, "../../assets/fonts/sky-text-regular-pdf.ttf")).toString("base64"),
    bold: fs.readFileSync(path.join(__dirname, "../../assets/fonts/mtn-brighter-sans-bold-pdf.ttf")).toString("base64"),
  };
  const bytes = await globalThis.PCIReports.pdf(report, [], fonts);
  const pdf = await globalThis.PDFLib.PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 3);
  assert.equal(
    pdf.getForm().getTextField("row_28_1").getText(),
    report.rows[28].name,
    "all pages have canonical editable fields",
  );
  assert.equal(pdf.getForm().getTextField("row_0_2").getText(), "0.5", "fractional pledged steps survive PDF export");
  const assets = {
    fonts,
    logos: [
      "assets/brand/pamodzi/pamodzi-logo-320.png",
      "assets/walk-for-education/walk-for-education-logo.png",
      "assets/walk-for-education/south-rwenzori.png",
    ].map((file) => fs.readFileSync(path.join(__dirname, "../..", file)).toString("base64")),
  };
  const publicReport = {
    audience: "public",
    reportId: "WFE-UPDATE-TEST-ONLY",
    reportingCutoff: report.exportedAt,
    totals: report.totals,
    walk: null,
  };
  const original = JSON.stringify(publicReport);
  const update = await globalThis.PDFLib.PDFDocument.load(await globalThis.PCICampaignPDF.update(publicReport, assets));
  assert.equal(update.getPageCount(), 1, "normal public report fits a readable A4 page");
  assert.equal(update.getForm().getFields().length, 0, "public update is not the private editable register");
  assert.equal(update.getCreationDate().toISOString(), new Date(report.exportedAt).toISOString());
  const firstPage = update.getPages()[0];
  assert.equal(
    new Set(
      firstPage.node
        .Resources()
        .lookup(globalThis.PDFLib.PDFName.of("Font"))
        .values()
        .map((ref) => ref.toString()),
    ).size,
    2,
    "both house fonts embedded",
  );
  assert.equal(
    firstPage.node.Resources().lookup(globalThis.PDFLib.PDFName.of("XObject")).keys().length,
    3,
    "three approved brand images embedded",
  );
  const annotation = firstPage.node.Annots().lookup(0);
  assert.equal(
    annotation.lookup(globalThis.PDFLib.PDFName.of("A")).lookup(globalThis.PDFLib.PDFName.of("URI")).decodeText(),
    "https://pamodzici.com/walk-for-education/accountability/#collections",
    "footer links to current public figures",
  );
  assert.equal(JSON.stringify(publicReport), original, "rendering does not change its snapshot");
  const longReport = {
    ...publicReport,
    totals: {
      ...report.totals,
      currencies: ["EUR", "GBP", "KES", "UGX", "USD"].map((currency) => ({
        currency,
        received: 1000000000000,
        pledged: 1000000000000,
        outstanding: 0,
      })),
    },
    walk: {
      date: "2026-10-29",
      town: "Synthetic town",
      physical: "on-the-road",
      activity: "active",
      km: 100,
      story: "Approved synthetic field note with complete details. ".repeat(23),
    },
  };
  const continued = await globalThis.PDFLib.PDFDocument.load(
    await globalThis.PCICampaignPDF.update(longReport, assets),
  );
  assert(continued.getPageCount() >= 2, "long approved updates continue without shrinking or clipping");
  const empty = await globalThis.PDFLib.PDFDocument.load(
    await globalThis.PCICampaignPDF.update(
      { ...publicReport, totals: { currencies: [], lastReconciledAt: null } },
      assets,
    ),
  );
  assert.equal(empty.getPageCount(), 1, "empty reporting state renders without an invented opening balance");
  await assert.rejects(globalThis.PCICampaignPDF.update(publicReport, { logos: [], fonts }), /fonts and logos/);
  await assert.rejects(
    globalThis.PCICampaignPDF.update({ ...publicReport, audience: "private" }, assets),
    /public report/,
  );
  const pledgeDoc = await globalThis.PDFLib.PDFDocument.load(
    await globalThis.PCICampaignPDF.pledge(
      {
        reference: "WFE-SYNTHETIC-PLEDGE",
        created_at: report.exportedAt,
        amount: 100000,
        currency: "UGX",
        country: "UG",
        steps: 20,
        step_unit: 5000,
        name: "Synthetic Supporter",
      },
      assets,
    ),
  );
  assert.equal(pledgeDoc.getPageCount(), 1);
  assert(pledgeDoc.getSubject().includes("Not a payment receipt"), "pledge document cannot imply received money");
  const blob = globalThis.PCIReports.xlsx(report),
    buffer = Buffer.from(await blob.arrayBuffer());
  const files = {};
  let at = 0;
  while (buffer.readUInt32LE(at) === 0x04034b50) {
    const size = buffer.readUInt32LE(at + 18),
      length = buffer.readUInt16LE(at + 26),
      extra = buffer.readUInt16LE(at + 28);
    const name = buffer.toString("utf8", at + 30, at + 30 + length),
      start = at + 30 + length + extra;
    files[name] = buffer.toString("utf8", start, start + size);
    at = start + size;
  }
  assert.equal(Object.keys(files).length, 7);
  const register = files["xl/worksheets/sheet2.xml"];
  assert(
    register.includes("=SUM(1,2) &amp; &lt;synthetic&gt;") && !register.includes("<f>"),
    "untrusted names stay text, never formulas",
  );
  assert.equal((register.match(/<row /g) || []).length, 30);
  assert(
    register.includes('state="frozen"') && register.includes("<autoFilter"),
    "Excel freeze and filters are present",
  );
  const many = { ...report, rows: Array.from({ length: 2101 }, (_, i) => ({ ...report.rows[0], id: "MANY-" + i })) };
  assert(
    (await globalThis.PCIReports.xlsx(many).text()).includes("MANY-2100"),
    "exports are not limited to dashboard row count",
  );
  console.log(
    "PASS report pagination, editable PDF fields, fractional steps, full XLSX package, filters and injection safety",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
