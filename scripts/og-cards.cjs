/* Renders one 1200x630 share card per page into assets/og/pages/, so a link shared on WhatsApp looks like this site.
   usage: node scripts/og-cards.cjs   (needs Playwright with a Chromium; set PCI_TEST_CHROMIUM for a custom path)
   The headline is read from each built page, so cards follow the copy. Type is MTN Brighter Sans and Sky Text, the
   accent words are set in colour (no italics), and the Walk for Education and Faith in Motion cards carry their campaign colours
   under the PCI mark. Walk for Education and Contribute keep their campaign artwork card. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");

const institutional = [
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
].map((slug) => ({ slug, dir: slug, brand: "pci", tagline: "People · Partnerships · Lasting change" }));

const pages = [
  {
    slug: "home",
    dir: "",
    brand: "pci",
    label: "Pamodzi Community Initiative",
    tagline: "People · Partnerships · Lasting change",
  },
  ...institutional,
  ...[
    ["walk-take-part", "walk-for-education/take-part", "Take part"],
    ["walk-partners", "walk-for-education/partners", "Partners"],
    ["walk-accountability", "walk-for-education/accountability", "Accountability"],
    ["walk-updates", "walk-for-education/updates", "Updates"],
  ].map(([slug, dir, label]) => ({
    slug,
    dir,
    brand: "walk",
    label: "Walk for Education · " + label,
    tagline: "A PCI campaign · Every step builds a future",
  })),
  ...[
    ["fim-home", "faith-in-motion", "Faith in Motion"],
    ["fim-give", "give", "Faith in Motion · Sponsor a step"],
    ["fim-roll", "roll", "Faith in Motion · Roll of Honour"],
    ["fim-church", "church", "Faith in Motion · The church"],
    ["fim-take-part", "take-part", "Faith in Motion · Take part"],
    ["fim-walk", "walk", "Faith in Motion · The walk"],
    ["fim-accountability", "accountability", "Faith in Motion · Accountability"],
  ].map(([slug, dir, label]) => ({
    slug,
    dir,
    brand: "pci",
    label,
    tagline: "A PCI campaign · Journey completed, fundraising continues",
  })),
];

const palette = {
  pci: {
    paper: "#faf6f1",
    ink: "#1b0a0e",
    accent: "#b71935",
    muted: "#66565a",
    bar: "linear-gradient(90deg,#b71935,#e6ad3e)",
  },
  walk: {
    paper: "#fbf8f2",
    ink: "#0e1f3a",
    accent: "#0b6e8e",
    muted: "#5b6474",
    bar: "linear-gradient(90deg,#c9a04a,#2a9cc1)",
  },
};

const b64 = (f) => fs.readFileSync(path.join(root, f)).toString("base64");
const fonts = `
@font-face{font-family:A;src:url(data:font/woff2;base64,${b64("assets/fonts/mtn-brighter-sans-bold.woff2")});font-weight:100 900}
@font-face{font-family:L;src:url(data:font/woff2;base64,${b64("assets/fonts/sky-text-regular.woff2")});font-weight:100 900}`;
const logo = "data:image/png;base64," + b64("assets/brand/pamodzi/pamodzi-logo-transparent.png");
const strip = (s) =>
  s
    .replace(/<br\s*\/?>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "’")
    .trim();
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

(async () => {
  const browser = await chromium.launch(
    process.env.PCI_TEST_CHROMIUM ? { executablePath: process.env.PCI_TEST_CHROMIUM } : {},
  );
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  fs.mkdirSync(path.join(root, "assets/og/pages"), { recursive: true });
  for (const card of pages) {
    const file = path.join(root, card.dir, "index.html");
    const html = fs.readFileSync(file, "utf8");
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "";
    const title = (html.match(/<title>([^<]*?)(?: [—|]| ·|<)/) || [])[1] || card.slug;
    const label = card.label || strip(title);
    const accent = (h1.match(/<em[^>]*>([\s\S]*?)<\/em>/) || [])[1];
    const lead = strip(h1.replace(/<br\s*\/?>/g, " ").replace(/<em[\s\S]*?<\/em>/, "").replace(/<[^>]+>/g, " "));
    const c = palette[card.brand];
    const route =
      card.brand === "walk"
        ? `<svg class="route" viewBox="0 0 520 14" width="520" height="14"><path d="M7 7 H513" stroke="#2a9cc1" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 11" fill="none"/><circle cx="7" cy="7" r="5" fill="#2a9cc1"/><circle cx="513" cy="7" r="5" fill="#c9a04a"/></svg>`
        : `<div class="arch"></div>`;
    const doc = `<style>${fonts}*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:${c.paper};color:${c.ink};font-family:L;position:relative;overflow:hidden}
.arch{position:absolute;right:-170px;bottom:-250px;width:760px;height:760px;border-radius:50%;border:2px solid ${c.accent}33;box-shadow:0 0 0 70px ${c.accent}0a,0 0 0 140px ${c.accent}08}
.route{position:absolute;right:72px;top:70px}
.top{position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:18px}.top img{width:72px}.top b{font:800 32px A;letter-spacing:-.03em}
.lab{position:absolute;left:72px;top:176px;right:72px;font:600 22px A;letter-spacing:.09em;text-transform:uppercase;color:${c.accent}}
h1{position:absolute;left:72px;right:90px;top:222px;max-height:300px;font:800 92px/1 A;letter-spacing:-.03em}
h1 em{font-style:normal;color:${c.accent}}
.foot{position:absolute;left:72px;bottom:52px;font:500 20px L;letter-spacing:.04em;color:${c.muted}}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:${c.bar}}</style>
<div class="arch-wrap">${route}</div><div class="top"><img src="${logo}"><b>Pamodzi</b></div><div class="lab">${escape(label)}</div>
<h1 id="h">${escape(lead)}${accent ? " <em>" + escape(strip(accent)) + "</em>" : ""}</h1><div class="foot">${escape(card.tagline)}</div><div class="bar"></div>`;
    await page.setContent(doc);
    await page.evaluate(() => document.fonts.ready);
    // Shrink the headline until it fits above the footer line.
    await page.evaluate(() => {
      const h = document.getElementById("h");
      let size = 92;
      while (h.scrollHeight > 290 && size > 44) {
        size -= 4;
        h.style.fontSize = size + "px";
      }
    });
    await page.screenshot({ path: path.join(root, "assets/og/pages", card.slug + ".jpg"), type: "jpeg", quality: 84 });
    console.log(card.slug, "-", lead, accent ? "| " + strip(accent) : "");
  }
  await browser.close();
})();
