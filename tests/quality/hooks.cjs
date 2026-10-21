/* Hooks gate: proves a page keeps everything the pledge, payment, enquiry and register scripts bind to.
   For every protected page it records the ids, data-* attributes, form fields (with their price bounds), form
   actions, script sources and inline script hashes, then compares a site root against that record.

     node tests/quality/hooks.cjs                     compare the repository with tests/quality/baseline/hooks.json
     node tests/quality/hooks.cjs --root build-v3     compare another site root (a migrated build)
     node tests/quality/hooks.cjs --record            rewrite the record from the repository (a reviewed act)

   A hook that is removed or changed fails the gate. A hook that is added is reported but allowed.
   Attributes that only drive presentation are listed under "presentationOnly" in the record. */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { root, routes, fileFor, hookRoutes } = require("./routes.cjs");

const RECORD = path.join(__dirname, "baseline/hooks.json");
const args = process.argv.slice(2);
const record = args.includes("--record");
const rootArg = args.indexOf("--root");
const base = rootArg === -1 ? root : path.resolve(root, args[rootArg + 1]);

// Reveal, parallax and transition attributes change with the design. Nothing reads them to move money.
const PRESENTATION_ONLY = [
  "data-reveal",
  "data-parallax",
  "data-motion",
  "data-page-transition",
  "data-stagger",
  "data-delay",
  "data-lines",
];

function unique(values) {
  return [...new Set(values)].sort();
}

function inventory(file) {
  const html = fs.readFileSync(file, "utf8");
  const { document } = new JSDOM(html).window;
  const all = [...document.querySelectorAll("*")];

  const data = {};
  for (const element of all) {
    for (const attribute of element.getAttributeNames()) {
      if (!attribute.startsWith("data-") || PRESENTATION_ONLY.includes(attribute)) continue;
      (data[attribute] ||= []).push(element.getAttribute(attribute));
    }
  }
  for (const name of Object.keys(data)) data[name] = unique(data[name]);

  const fields = all
    .filter((el) => /^(input|select|textarea)$/.test(el.localName))
    .map((el) => {
      const keys = ["id", "name", "type", "min", "max", "step", "required", "inputmode", "autocomplete"];
      return (
        el.localName +
        keys
          .filter((key) => el.hasAttribute(key))
          .map((key) => `[${key}=${el.getAttribute(key)}]`)
          .join("")
      );
    });

  const forms = [...document.querySelectorAll("form")].map(
    (form) =>
      `form#${form.id || "-"}[action=${form.getAttribute("action") || ""}][method=${form.getAttribute("method") || ""}]`,
  );

  const scripts = [...document.querySelectorAll("script[src]")].map((el) =>
    el.getAttribute("src").replace(/\?.*$/, ""),
  );
  const inline = [...document.querySelectorAll("script:not([src])")].map((el) =>
    crypto.createHash("sha256").update(el.textContent.trim()).digest("hex").slice(0, 16),
  );

  return {
    ids: unique(all.filter((el) => el.id).map((el) => el.id)),
    data,
    fields: unique(fields),
    forms: unique(forms),
    scripts,
    inlineScripts: inline,
  };
}

function compareLists(label, before, after, problems, added) {
  const now = new Set(after);
  const was = new Set(before);
  for (const item of before) if (!now.has(item)) problems.push(`${label} removed or changed: ${item}`);
  for (const item of after) if (!was.has(item)) added.push(`${label} added: ${item}`);
}

function compare(route, before, after) {
  const problems = [];
  const added = [];
  compareLists("id", before.ids, after.ids, problems, added);
  compareLists("field", before.fields, after.fields, problems, added);
  compareLists("form", before.forms, after.forms, problems, added);
  compareLists("inline script hash", before.inlineScripts, after.inlineScripts, problems, added);
  if (before.scripts.join("\n") !== after.scripts.join("\n")) {
    problems.push(
      `script sources or their order changed:\n    was ${before.scripts.join(", ")}\n    now ${after.scripts.join(", ")}`,
    );
  }
  for (const name of unique([...Object.keys(before.data), ...Object.keys(after.data)])) {
    const was = before.data[name] || [];
    const now = after.data[name] || [];
    compareLists(`${name} value`, was, now, problems, added);
  }
  return { route, problems, added };
}

const tracked = hookRoutes(routes());

if (record) {
  const pages = {};
  for (const route of tracked) pages[route] = inventory(fileFor(route, root));
  fs.mkdirSync(path.dirname(RECORD), { recursive: true });
  fs.writeFileSync(
    RECORD,
    JSON.stringify(
      {
        note: "Recorded by tests/quality/hooks.cjs --record. Recording again is a reviewed act: it accepts the current markup as the new reference for money and register hooks.",
        presentationOnly: PRESENTATION_ONLY,
        pages,
      },
      null,
      1,
    ) + "\n",
  );
  console.log(`Recorded hooks for ${tracked.length} pages in ${path.relative(root, RECORD)}.`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(RECORD, "utf8"));
let failures = 0;
let addedTotal = 0;
for (const route of Object.keys(baseline.pages)) {
  const file = fileFor(route, base);
  if (!fs.existsSync(file)) {
    failures++;
    console.log(`FAIL ${route}: page not found in ${path.relative(root, base) || "."}`);
    continue;
  }
  const result = compare(route, baseline.pages[route], inventory(file));
  addedTotal += result.added.length;
  if (result.problems.length) {
    failures++;
    console.log(`FAIL ${route}`);
    for (const problem of result.problems) console.log(`  - ${problem}`);
  }
}
if (failures) {
  console.error(`${failures} page(s) lost or changed a recorded hook.`);
  process.exit(1);
}
console.log(
  `Hooks match the record on ${Object.keys(baseline.pages).length} protected pages` +
    (addedTotal ? ` (${addedTotal} hook(s) added, allowed).` : "."),
);
