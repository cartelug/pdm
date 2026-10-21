/* ==========================================================================
   sitemap — generate sitemap.xml from the public pages
   --------------------------------------------------------------------------
   usage: node scripts/sitemap.mjs            write sitemap.xml
          node scripts/sitemap.mjs --check    fail when sitemap.xml is not what the pages produce

   Every public page (an index.html outside admin/ and api/) that is not marked noindex is listed, so a new page
   appears and a removed one disappears without anyone editing the file. lastmod is left out on purpose: it is
   optional, and a date taken from git is wrong in a shallow checkout.
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { routes, fileFor } = require(path.join(ROOT, "tests/quality/routes.cjs"));
const ORIGIN = "https://pamodzici.com";
const check = process.argv.includes("--check");

const indexable = routes().filter((route) => {
  const html = fs.readFileSync(fileFor(route), "utf8");
  return !/<meta[^>]+name="robots"[^>]+noindex/i.test(html);
});

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  indexable.map((route) => `  <url><loc>${ORIGIN}${route}</loc></url>`).join("\n") +
  "\n</urlset>\n";

const file = path.join(ROOT, "sitemap.xml");
if (check) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current !== xml) {
    console.error("sitemap.xml is out of date. Run: npm run sitemap");
    process.exit(1);
  }
  console.log(`sitemap.xml lists the ${indexable.length} indexable pages.`);
} else {
  fs.writeFileSync(file, xml);
  console.log(`Wrote sitemap.xml with ${indexable.length} URLs.`);
}
