/* Links gate: no shared link may ever break. Reads every public page and checks, without a browser, that:
     - every internal link, script, stylesheet, image, source set, poster, form action and social card resolves to a file;
     - every #fragment points at an id that exists on the target page;
     - every URL in sitemap.xml resolves, and no indexable page is missing from it;
     - every root name.html redirect stub points at /name/, the pattern one server rule (Appendix D) can replace;
     - every canonical URL names its own page.
   Pages and files only; nothing is fetched from the network.

     node tests/quality/links.cjs            list every problem, exit 1 if any link or fragment is broken
     node tests/quality/links.cjs --report   same list, always exit 0 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { root, routes, fileFor } = require("./routes.cjs");

const report = process.argv.includes("--report");
const ORIGIN = "https://pamodzici.com";
const problems = [];
const advice = [];
const stats = { pages: 0, links: 0, fragments: 0 };
const documents = new Map();
const scripted = new Set();

function load(file) {
  if (!documents.has(file)) {
    const html = fs.readFileSync(file, "utf8");
    const { document } = new JSDOM(html).window;
    const ids = new Set([...document.querySelectorAll("[id]")].map((el) => el.id));
    for (const el of document.querySelectorAll("a[name]")) ids.add(el.getAttribute("name"));
    // A script may open a panel or tab named by the fragment (for example #rotary), so remember data-* values too.
    const handled = new Set();
    for (const el of document.querySelectorAll("*")) {
      for (const name of el.getAttributeNames()) if (name.startsWith("data-")) handled.add(el.getAttribute(name));
    }
    documents.set(file, { document, ids, handled, html });
  }
  return documents.get(file);
}

// Maps a URL path on this site to the file a server would send, or null when there is none.
function resolveLocal(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  const absolute = path.join(root, clean);
  if (!absolute.startsWith(root)) return null;
  if (pathname.endsWith("/") || clean === "") {
    const index = path.join(absolute, "index.html");
    return fs.existsSync(index) ? { file: index } : null;
  }
  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return { file: absolute };
  if (fs.existsSync(path.join(absolute, "index.html"))) return { file: path.join(absolute, "index.html"), slash: true };
  return null;
}

const pageFiles = routes().map((route) => ({ route, file: fileFor(route), url: ORIGIN + route }));
for (const name of fs.readdirSync(root)) {
  if (name.endsWith(".html") && name !== "index.html")
    pageFiles.push({ route: "/" + name, file: path.join(root, name), url: ORIGIN + "/" + name });
}

function candidates(document) {
  const found = [];
  const add = (selector, attribute) => {
    for (const el of document.querySelectorAll(selector)) {
      const value = el.getAttribute(attribute);
      if (value) found.push({ el, attribute, value });
    }
  };
  add("a[href], link[href], area[href]", "href");
  add("script[src], img[src], source[src], video[src], audio[src], iframe[src]", "src");
  add("video[poster]", "poster");
  add("form[action]", "action");
  add('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:url"]', "content");
  for (const el of document.querySelectorAll("[srcset]")) {
    for (const part of el.getAttribute("srcset").split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url) found.push({ el, attribute: "srcset", value: url });
    }
  }
  return found;
}

for (const page of pageFiles) {
  stats.pages++;
  const here = path.relative(root, page.file);
  const { document, ids } = load(page.file);

  const seenIds = new Set();
  for (const el of document.querySelectorAll("[id]")) {
    if (seenIds.has(el.id)) advice.push(`${here}: id "${el.id}" is used more than once`);
    seenIds.add(el.id);
  }

  for (const { el, attribute, value } of candidates(document)) {
    if (/^(mailto:|tel:|sms:|javascript:|data:|blob:|whatsapp:|#?$)/i.test(value)) continue;
    let url;
    try {
      url = new URL(value, page.url);
    } catch {
      problems.push(`${here}: <${el.localName}> ${attribute}="${value}" is not a valid URL`);
      continue;
    }
    if (!/^https?:$/.test(url.protocol)) continue;
    if (url.origin !== ORIGIN && url.origin !== "https://www.pamodzici.com") continue;
    stats.links++;
    const target = resolveLocal(url.pathname);
    if (!target) {
      problems.push(`${here}: <${el.localName}> ${attribute}="${value}" does not resolve to a file`);
      continue;
    }
    if (target.slash) advice.push(`${here}: ${attribute}="${value}" is missing its trailing slash`);
    if (url.hash.length > 1 && /\.html$/.test(target.file)) {
      stats.fragments++;
      const targetPage = target.file === page.file ? { ids, handled: load(target.file).handled } : load(target.file);
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (!targetPage.ids.has(fragment)) {
        if (targetPage.handled.has(fragment)) {
          scripted.add(`${path.relative(root, target.file)}#${fragment}`);
        } else {
          problems.push(
            `${here}: ${attribute}="${value}" points at #${fragment}, which is not on ${path.relative(root, target.file)}`,
          );
        }
      }
    }
  }

  // A canonical URL must name its own page (stubs are checked below).
  const canonical = document.querySelector('link[rel="canonical"]');
  if (/^\/.*\/$/.test(page.route) && canonical && canonical.getAttribute("href") !== page.url) {
    advice.push(`${here}: canonical is ${canonical.getAttribute("href")}, expected ${page.url}`);
  }
  if (/^\/.*\/$/.test(page.route) && !canonical) advice.push(`${here}: has no canonical link`);
}

// Redirect stubs: name.html -> /name/ is the one pattern a single server rule can replace.
const stubs = pageFiles.filter((page) => /^\/[a-z-]+\.html$/.test(page.route) && page.route !== "/404.html");
const stubReport = [];
for (const stub of stubs) {
  const name = stub.route.slice(1, -".html".length);
  const { document } = load(stub.file);
  const refresh = document.querySelector('meta[http-equiv="refresh" i]');
  const target = refresh && (refresh.getAttribute("content").match(/url=(\S+)/i) || [])[1];
  const resolved = target && new URL(target, stub.url);
  if (!resolved || resolved.pathname !== `/${name}/`) {
    problems.push(`${stub.route}: redirect stub points at ${target || "nothing"}, expected /${name}/`);
  } else if (!resolveLocal(resolved.pathname)) {
    problems.push(`${stub.route}: redirect target /${name}/ does not exist`);
  } else stubReport.push(name);
}

// Sitemap: every URL resolves, and indexable pages are listed.
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
for (const pathname of listed) {
  const target = resolveLocal(pathname);
  if (!target) problems.push(`sitemap.xml: ${pathname} does not resolve to a file`);
  else {
    const robots = load(target.file).document.querySelector('meta[name="robots"]');
    if (robots && /noindex/i.test(robots.getAttribute("content")))
      advice.push(`sitemap.xml: ${pathname} is listed but marked noindex`);
  }
}
const notListed = [];
for (const page of pageFiles.filter((p) => /^\/.*\/$/.test(p.route))) {
  const robots = load(page.file).document.querySelector('meta[name="robots"]');
  const noindex = robots && /noindex/i.test(robots.getAttribute("content"));
  if (!noindex && !listed.includes(page.route)) notListed.push(page.route);
}
if (notListed.length)
  advice.push(`sitemap.xml does not list ${notListed.length} indexable page(s): ${notListed.join(", ")}`);

// Share cards: how many pages use each image.
const cards = {};
for (const page of pageFiles) {
  const tag = load(page.file).document.querySelector('meta[property="og:image"]');
  if (tag) {
    const image = new URL(tag.getAttribute("content"), page.url).pathname;
    (cards[image] ||= []).push(page.route);
  }
}

console.log(
  `Checked ${stats.pages} pages, ${stats.links} internal links, ${stats.fragments} fragments, ${stubReport.length} redirect stubs, ${listed.length} sitemap URLs.`,
);
console.log(
  `Share cards: ${Object.keys(cards).length} different image(s) across ${Object.values(cards).flat().length} pages` +
    Object.entries(cards)
      .map(([image, pages]) => `\n  ${String(pages.length).padStart(2)} page(s) use ${image}`)
      .join(""),
);
for (const line of advice) console.log(`note: ${line}`);
if (scripted.size)
  console.log(`note: ${scripted.size} fragment(s) are opened by script, not by an id: ${[...scripted].join(", ")}`);
if (problems.length) {
  for (const problem of problems) console.log(`FAIL ${problem}`);
  console.error(`${problems.length} broken link(s) or redirect(s).`);
  if (!report) process.exit(1);
} else {
  console.log("No broken links, fragments, redirects or sitemap entries.");
}
