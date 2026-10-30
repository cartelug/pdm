/* Explicit sample generation only. Synthetic data never reaches the live ledger. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.PDFLib = require("../admin/vendor/pdf-lib.min.js");
globalThis.fontkit = require("../admin/vendor/fontkit.umd.min.js");
require("../js/campaign-report-pdf.js");
const base64 = (file) => fs.readFileSync(path.join(root, file)).toString("base64");
const assets = {
  logos: [
    "assets/brand/pamodzi/pamodzi-logo-320.png",
    "assets/walk-for-education/walk-for-education-logo.png",
    "assets/walk-for-education/south-rwenzori.png",
  ].map(base64),
  fonts: {
    regular: base64("assets/fonts/sky-text-regular-pdf.ttf"),
    bold: base64("assets/fonts/mtn-brighter-sans-bold-pdf.ttf"),
  },
};
const report = {
  sample: true,
  audience: "public",
  reportId: "WFE-SAMPLE-UPDATE",
  reportingCutoff: "2026-10-29T09:00:00Z",
  totals: {
    currencies: [
      { currency: "UGX", received: 2500000, pledged: 4000000, outstanding: 1500000 },
      { currency: "KES", received: 12000, pledged: 20000, outstanding: 8000 },
    ],
    confirmedSteps: 0,
    lastReconciledAt: "2026-10-29T08:30:00Z",
  },
  walk: null,
};
const pledge = {
  sample: true,
  name: "Sample Supporter",
  reference: "WFE-SAMPLE-PLEDGE",
  amount: 100000,
  currency: "UGX",
  country: "UG",
  steps: 20,
  step_unit: 5000,
  created_at: report.reportingCutoff,
};
const output = path.join(root, "assets/operations/samples");
fs.mkdirSync(output, { recursive: true });
for (const [name, bytes] of [
  ["PCI-SAMPLE-campaign-update.pdf", await globalThis.PCICampaignPDF.update(report, assets)],
  ["PCI-SAMPLE-pledge-confirmation.pdf", await globalThis.PCICampaignPDF.pledge(pledge, assets)],
]) {
  const doc = await globalThis.PDFLib.PDFDocument.load(bytes);
  if (doc.getPageCount() < 1 || bytes.length < 1000) throw new Error("Incomplete sample PDF");
  fs.writeFileSync(path.join(output, name), bytes);
  process.stdout.write(name + ": " + doc.getPageCount() + " page(s), " + bytes.length + " bytes\n");
}
