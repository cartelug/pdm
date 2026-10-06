/* ==========================================================================
   pages — structural checks every public page must pass
   --------------------------------------------------------------------------
   usage: node scripts/pages.mjs

   Public pages are index.html files outside admin/, plus 404.html. Each must:
     • load css/preloader.css and js/preloader.js in <head>, before any other
       stylesheet, so the branded preloader paints with the first frame;
     • open <body> with the .site-loader markup (Walk for Education and
       contribution pages use data-variant="wfe");
     • declare a language, a viewport and a <title>.
   Root-level *.html files other than 404.html are redirects and are skipped.
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SKIP = new Set([".git", "node_modules", "tests", "deploy", "admin", "api", "assets", "scripts", "css", "js"]);

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
  const where = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const fail = (message) => problems.push(`${where}: ${message}`);

  if (!/<html lang="[a-z-]+"/i.test(html)) fail("missing <html lang>");
  if (!/<meta name="viewport"/.test(head)) fail("missing viewport meta");
  if (!/<title>[^<]+<\/title>/.test(head)) fail("missing <title>");

  const firstStylesheet = head.search(/<link[^>]+rel="stylesheet"|<link href="https:\/\/fonts/);
  const preloaderCss = head.search(/<link rel="stylesheet" href="[^"]*css\/preloader\.css(\?v=[^"]*)?">/);
  const preloaderJs = head.search(/<script src="[^"]*js\/preloader\.js(\?v=[^"]*)?"><\/script>/);
  if (preloaderCss === -1) fail("css/preloader.css is not loaded in <head>");
  else if (preloaderCss !== firstStylesheet) fail("css/preloader.css must be the first stylesheet");
  if (preloaderJs === -1) fail("js/preloader.js is not loaded synchronously in <head>");

  const body = html.match(/<body[^>]*>\s*([\s\S]{0,400})/);
  const loader = body && body[1].match(/^<div class="site-loader"( data-variant="(\w+)")? aria-hidden="true">/);
  if (!loader) fail("<body> must start with the .site-loader markup");
  else {
    const campaign = /^(walk-for-education|contribute)\//.test(where);
    if (campaign && loader[2] !== "wfe") fail('campaign pages use data-variant="wfe" on .site-loader');
    if (!campaign && loader[2]) fail("only campaign pages set a loader variant");
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${pages.length} public pages: preloader, language, viewport and title all present.`);
