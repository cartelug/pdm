/* Renders one 1200x630 share card per institutional page into assets/og/pages/.
   usage: node scripts/og-cards.cjs   (needs Playwright with a Chromium; set PCI_TEST_CHROMIUM for a custom path)
   The headline and its italic accent are read from each built page, so cards follow the copy. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const pages = [
  "about",
  "what-we-do",
  "model",
  "impact",
  "projects",
  "apartments",
  "community",
  "partnerships",
  "governance",
  "contact",
  "updates",
];
const b64 = (f) => fs.readFileSync(path.join(root, f)).toString("base64");
const fonts = `
@font-face{font-family:I;src:url(data:font/woff2;base64,${b64("assets/fonts/inter-latin-opsz-normal.woff2")});font-weight:100 900}
@font-face{font-family:S;src:url(data:font/woff2;base64,${b64("assets/fonts/instrument-serif-latin-400-italic.woff2")});font-style:italic}
@font-face{font-family:M;src:url(data:font/woff2;base64,${b64("assets/fonts/geist-mono-latin-wght-normal.woff2")});font-weight:100 900}`;
const logo = "data:image/png;base64," + b64("assets/brand/pamodzi/pamodzi-logo-transparent.png");
const strip = (s) =>
  s
    .replace(/<br\s*\/?>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
(async () => {
  const browser = await chromium.launch(
    process.env.PCI_TEST_CHROMIUM ? { executablePath: process.env.PCI_TEST_CHROMIUM } : {},
  );
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  fs.mkdirSync(path.join(root, "assets/og/pages"), { recursive: true });
  for (const slug of pages) {
    const html = fs.readFileSync(path.join(root, slug, "index.html"), "utf8");
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "";
    const label = (html.match(/<title>([^<]*?) — Pamodzi/) || [])[1] || slug;
    const em = (h1.match(/<em[^>]*>([\s\S]*?)<\/em>/) || [])[1];
    const lead = strip(h1.replace(/<em[\s\S]*?<\/em>/, "").replace(/<[^>]+>/g, ""));
    const doc = `<style>${fonts}*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:#faf6f1;color:#1b0a0e;font-family:I;position:relative;overflow:hidden}
.arch{position:absolute;right:-170px;bottom:-250px;width:760px;height:760px;border-radius:50%;border:2px solid #b7193533;box-shadow:0 0 0 70px #b719350a,0 0 0 140px #b7193508}
.top{position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:18px}.top img{width:72px}.top b{font-size:30px;letter-spacing:-.04em}
.lab{position:absolute;left:72px;top:176px;font:500 20px M;letter-spacing:.14em;text-transform:uppercase;color:#b71935}
h1{position:absolute;left:72px;right:72px;top:222px;font-size:92px;line-height:.98;letter-spacing:-.04em;font-weight:620}
h1 em{font-family:S;font-style:italic;font-weight:400;font-size:1.08em;letter-spacing:-.01em;color:#b71935}
.foot{position:absolute;left:72px;bottom:52px;font:500 20px M;letter-spacing:.12em;text-transform:uppercase;color:#66565a}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:linear-gradient(90deg,#b71935,#e6ad3e)}</style>
<div class="arch"></div><div class="top"><img src="${logo}"><b>Pamodzi</b></div><div class="lab">${strip(label)}</div>
<h1>${lead}${em ? " <em>" + strip(em) + "</em>" : ""}</h1><div class="foot">People · Partnerships · Lasting change</div><div class="bar"></div>`;
    await page.setContent(doc);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(root, "assets/og/pages", slug + ".jpg"), type: "jpeg", quality: 84 });
    console.log(slug, "-", lead, em ? "| " + strip(em) : "");
  }
  await browser.close();
})();
