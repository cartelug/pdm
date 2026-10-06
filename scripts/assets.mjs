/* ==========================================================================
   assets — content-hash cache busting for local CSS and JS
   --------------------------------------------------------------------------
   usage: node scripts/assets.mjs          rewrite every reference to ?v=<hash>
          node scripts/assets.mjs --check  fail if a reference is stale or missing

   Every <link href="…css/*.css"> and <script src="…js/*.js"> in the site's
   HTML gets `?v=` + the first 10 hex characters of the file's SHA-256, so a
   browser fetches a stylesheet or script again exactly when it changes. Run
   it (npm run assets) after editing anything in css/ or js/; CI runs --check.
   js/roll-data.js and js/fim-content.js are refreshed from the admin console,
   so a stale hash on those only produces a warning.
   ========================================================================== */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SKIP = new Set([".git", "node_modules", "tests", "deploy"]);
const REFERENCE = /(\b(?:href|src)=")((?:\/|\.\.\/|\.\/)*(?:css|js)\/[\w.-]+\.(?:css|js))(\?v=[^"]*)?(")/g;
const check = process.argv.includes("--check");
// Content files refreshed from the admin console, often without these tools: a stale hash on them is
// reported but does not fail the check.
const CONSOLE_DATA = new Set(["js/roll-data.js", "js/fim-content.js"]);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const hashes = new Map();
function hashOf(file) {
  if (!hashes.has(file)) {
    hashes.set(file, crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10));
  }
  return hashes.get(file);
}

const problems = [];
const warnings = [];
let rewritten = 0;

for (const page of htmlFiles(ROOT)) {
  const html = fs.readFileSync(page, "utf8");
  const updated = html.replace(REFERENCE, (match, open, url, version, close) => {
    const target = url.startsWith("/") ? path.join(ROOT, url) : path.resolve(path.dirname(page), url);
    const where = path.relative(ROOT, page);
    if (!fs.existsSync(target)) {
      problems.push(`${where}: ${url} does not exist`);
      return match;
    }
    const expected = `?v=${hashOf(target)}`;
    if (version !== expected) {
      const note = `${where}: ${url}${version || ""} should be ${url}${expected}`;
      if (CONSOLE_DATA.has(path.relative(ROOT, target))) warnings.push(note);
      else problems.push(note);
      rewritten++;
    }
    return open + url + expected + close;
  });
  if (!check && updated !== html) fs.writeFileSync(page, updated);
}

if (check) {
  if (warnings.length)
    console.warn(`Console-managed data changed — run npm run assets when convenient:\n${warnings.join("\n")}\n`);
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error(`\n${problems.length} asset reference(s) out of date. Run: npm run assets`);
    process.exit(1);
  }
  console.log("All CSS and JS references carry their current content hash.");
} else {
  const missing = problems.filter((p) => p.includes("does not exist"));
  if (missing.length) {
    console.error(missing.join("\n"));
    process.exit(1);
  }
  console.log(`Updated ${rewritten} reference(s).`);
}
