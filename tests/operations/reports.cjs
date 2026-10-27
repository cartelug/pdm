/* Export regression: actual PDF form and XLSX package, isolated synthetic data only. */
const assert = require("node:assert/strict");
globalThis.PDFLib = require("../../admin/vendor/pdf-lib.min.js");
globalThis.fontkit = require("../../admin/vendor/fontkit.umd.min.js");
require("../../js/operations-reports.js");
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
