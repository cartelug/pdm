/* Fragments gate: the blocks that carry pledge, price, form, referral or payment hooks must stay byte-identical
   to the originals while everything around them is redesigned. Each fragment is located by page and selector and
   compared as the exact characters of the source file (not a re-serialised copy).

     node tests/quality/fragments.cjs                    compare the repository with tests/quality/baseline/fragments.json
     node tests/quality/fragments.cjs --root build-v3    compare another site root (a migrated build)
     node tests/quality/fragments.cjs --record           rewrite the record from the repository (a reviewed act)

   The list of fragments lives in the "fragments" array of the record: page, selector and a plain-words reason. */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { root, fileFor } = require("./routes.cjs");

const RECORD = path.join(__dirname, "baseline/fragments.json");
const args = process.argv.slice(2);
const record = args.includes("--record");
const rootArg = args.indexOf("--root");
const base = rootArg === -1 ? root : path.resolve(root, args[rootArg + 1]);

const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");

// Returns the exact source text of the one element matching the selector, or an explanation of why not.
function extract(route, selector, site) {
  const file = fileFor(route, site);
  if (!fs.existsSync(file)) return { error: "page not found" };
  const html = fs.readFileSync(file, "utf8");
  const dom = new JSDOM(html, { includeNodeLocations: true });
  const matches = dom.window.document.querySelectorAll(selector);
  if (matches.length !== 1) return { error: `${matches.length} elements match ${selector}, expected 1` };
  const location = dom.nodeLocation(matches[0]);
  return { text: html.slice(location.startOffset, location.endOffset) };
}

const definitions = [
  [
    "wfe-pledge-chooser",
    "/walk-for-education/",
    "#choose-steps",
    "Country, step chips, custom steps, live total and the continue link; carries pledge, price and bounds hooks",
  ],
  ["wfe-pricing-status", "/walk-for-education/", "[data-pricing-status]", "Country price loading and failure notice"],
  [
    "wfe-checkout-status",
    "/walk-for-education/",
    "#campaignCheckoutStatus",
    "Pledge-only reassurance line the chooser script updates",
  ],
  [
    "wfe-official-channels",
    "/walk-for-education/",
    "#official-channels",
    "Exact payment channel numbers and names confirmed by the campaign team",
  ],
  [
    "wfe-certificate",
    "/walk-for-education/",
    "#certificate",
    "Certificate eligibility rules tied to a verified payment",
  ],
  [
    "wfe-take-part-enquiry",
    "/walk-for-education/take-part/",
    "form.wfe-enquiry-form",
    "Enquiry form field names and validation hooks",
  ],
  [
    "wfe-partners-enquiry",
    "/walk-for-education/partners/",
    "form.wfe-enquiry-form",
    "Institution and club enquiry form field names and validation hooks",
  ],
  [
    "contribute-form",
    "/contribute/",
    "#contributionForm",
    "The pledge and payment form: steps, country, name, WhatsApp number",
  ],
  [
    "contribute-checkout-notice",
    "/contribute/",
    "#checkoutNotice",
    "Checkout availability notice the payment script updates",
  ],
  [
    "contribute-payment-main",
    "/contribute/payment/",
    "main",
    "Payment result page: status check, receipt and certificate download",
  ],
  ["contribute-verify-form", "/contribute/verify/", "#certificateVerification", "Certificate verification form"],
].map(([id, page, selector, reason]) => ({ id, page, selector, reason }));

if (record) {
  const fragments = definitions.map((definition) => {
    const found = extract(definition.page, definition.selector, root);
    if (found.error) {
      console.error(`${definition.id}: ${found.error}`);
      process.exit(1);
    }
    return { ...definition, bytes: Buffer.byteLength(found.text), sha256: sha(found.text) };
  });
  fs.mkdirSync(path.dirname(RECORD), { recursive: true });
  fs.writeFileSync(
    RECORD,
    JSON.stringify(
      {
        note: "Recorded by tests/quality/fragments.cjs --record. Recording again is a reviewed act: it accepts the current text of every fragment as the new reference.",
        fragments,
      },
      null,
      1,
    ) + "\n",
  );
  console.log(`Recorded ${fragments.length} fragments in ${path.relative(root, RECORD)}.`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(RECORD, "utf8"));
let failures = 0;
for (const fragment of baseline.fragments) {
  const found = extract(fragment.page, fragment.selector, base);
  if (found.error) {
    failures++;
    console.log(`FAIL ${fragment.id} (${fragment.page}): ${found.error}`);
  } else if (sha(found.text) !== fragment.sha256) {
    failures++;
    console.log(
      `FAIL ${fragment.id} (${fragment.page} ${fragment.selector}): changed, ${Buffer.byteLength(found.text)} bytes now, ${fragment.bytes} recorded`,
    );
  }
}
if (failures) {
  console.error(`${failures} fragment(s) are not byte-identical to the record.`);
  process.exit(1);
}
console.log(`All ${baseline.fragments.length} frozen fragments are byte-identical to the record.`);
