/* ==========================================================================
   pages — structural checks every public page must pass
   --------------------------------------------------------------------------
   usage: node scripts/pages.mjs

   Public pages are index.html files outside admin/, plus 404.html. Each must:
     • declare a language, a viewport and a <title>;
     • on the hand-written pages: declare data-brand, load css/brand.css then css/one-look.css last,
       preload only Archivo and Lexend, and hold no loading screen (no .site-loader, no preloader.css).
   Root-level *.html files other than 404.html are redirects and are skipped.
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set([
  ".git",
  ".astro",
  "build-v3",
  "public-v3",
  "src",
  "_astro",
  "node_modules",
  "tests",
  "deploy",
  "admin",
  "api",
  "assets",
  "scripts",
  "css",
  "js",
]);

function publicPages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return publicPages(full);
    return entry.name === "index.html" || full === path.join(ROOT, "404.html") ? [full] : [];
  });
}

const problems = [];
const pages = publicPages(ROOT);

for (const file of pages) {
  const where = path.relative(ROOT, file).split(path.sep).join("/");
  const html = fs.readFileSync(file, "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const fail = (message) => problems.push(`${where}: ${message}`);

  if (!/<html lang="[a-z-]+"/i.test(html)) fail("missing <html lang>");
  if (!/<meta name="viewport"/.test(head)) fail("missing viewport meta");
  if (!/<title>[^<]+<\/title>/.test(head)) fail("missing <title>");

  // The isolated V3 shell intentionally has no blocking preloader. Legacy campaign rules stay intact.
  if (/<body[^>]*\bdata-pci-v3\b/.test(html)) {
    if (!/<main[^>]*id="main-content"/.test(html)) fail("missing V3 main landmark");
    if (!/<dialog[^>]*id="pciNavigation"/.test(html)) fail("missing accessible navigation dialog");
    if (!/aria-controls="pciNavigation"/.test(html)) fail("missing menu control association");
    if (/css\/(base|preloader)\.css|js\/(core|site-motion)\.js/.test(html))
      fail("V3 must not load legacy shell effects");
    continue;
  }

  // Hand-written pages share one type system and never hold a loading screen (decision D9).
  if (!/<html[^>]*\bdata-brand="(walk|pci)"/.test(html)) fail('missing data-brand="walk" or "pci" on <html>');
  if (!/viewport-fit=cover/.test(head)) fail("viewport meta needs viewport-fit=cover");
  if (/css\/preloader\.css/.test(head)) fail("css/preloader.css must not be loaded; there is no loading screen");
  if (/class="site-loader"/.test(html)) fail("the .site-loader markup must not be present");
  const sheets = [...head.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) =>
    m[1].replace(/^(\.\.\/)+/, "").replace(/\?.*$/, ""),
  );
  const brandAt = sheets.indexOf("css/brand.css");
  if (brandAt === -1) fail("css/brand.css is not loaded");
  if (sheets[sheets.length - 1] !== "css/one-look.css") fail("css/one-look.css must be the last stylesheet");
  else if (brandAt === -1 || brandAt > sheets.length - 2) fail("css/brand.css must come before css/one-look.css");
  for (const preload of head.matchAll(/<link rel="preload"[^>]*href="([^"]+\.woff2)"/g)) {
    if (!/archivo-latin-wght-normal|lexend-latin-wght-normal/.test(preload[1]))
      fail(`preloads an old font: ${preload[1]}`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${pages.length} public pages: family-appropriate shell, language, viewport and title all present.`);
