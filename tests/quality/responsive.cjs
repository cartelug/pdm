/* Responsive gate: every public page at 320 to 2560 px, in phone landscape and with text at 200%.
   Measures what a visitor would notice:
     fail  hScroll     the page scrolls sideways (rules R3 and R15)
     fail  clipped     content is cut off at the page edge instead of reflowing
     fail  below24     a tap target under 24 x 24 px on a phone with another target within 24 px (WCAG 2.5.8)
     note  truncated   text cut off inside its own box instead of wrapping
     note  textCutOff  wrapped text clipped by its own box or a non-scrolling ancestor
     note  brokenWords heading words split across rendered lines
     note  narrowHeads headings squeezed into at least five short lines
     note  under44     tap targets under the 44 px design floor (rule R9)
     note  smallText   visible text under 13 px (rule R7)
     note  smallInput  form fields under 16 px, which makes iPhones zoom in (rule R12)
     note  imageSize   images without width and height, which jump while loading (rule R11)
     note  viewportFit pages without viewport-fit=cover (rule R6)
   It also scans the stylesheets for breakpoints other than 640, 900 and 1200 and for 100vh (rules R2 and R8).

     node tests/quality/responsive.cjs                       report on every page, exit 0
     node tests/quality/responsive.cjs --strict              exit 1 when any "fail" measure is above zero
     node tests/quality/responsive.cjs --routes /,/about/    only these pages
     node tests/quality/responsive.cjs --viewports 320,390   only these viewports (names below)
     node tests/quality/responsive.cjs --json out.json       write every measurement
     node tests/quality/responsive.cjs --shots dir           also save a screenshot of each key page at each viewport

   Set PCI_TEST_CHROMIUM to use a browser installed outside Playwright's own path. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { start, root } = require("./server.cjs");
const { routes, keyRoutes } = require("./routes.cjs");

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const strict = args.includes("--strict");
const jsonOut = option("--json");
const shotsDir = option("--shots");

const viewports = [
  { name: "320", width: 320, height: 640, phone: true },
  { name: "360", width: 360, height: 740, phone: true },
  { name: "390", width: 390, height: 844, phone: true },
  { name: "414", width: 414, height: 896, phone: true },
  { name: "430", width: 430, height: 932, phone: true },
  { name: "768", width: 768, height: 1024 },
  { name: "900", width: 900, height: 1180 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1180", width: 1180, height: 820 },
  { name: "1200", width: 1200, height: 800 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1360", width: 1360, height: 800 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1536", width: 1536, height: 864 },
  { name: "1920", width: 1920, height: 1080 },
  { name: "2560", width: 2560, height: 1440 },
  { name: "landscape", width: 667, height: 375, phone: true },
  { name: "text200-390", width: 390, height: 844, phone: true, textZoom: true, noShot: true },
  { name: "text200-1280", width: 1280, height: 800, textZoom: true, noShot: true },
].filter((v) => !option("--viewports") || option("--viewports").split(",").includes(v.name));

const wanted = option("--routes") ? option("--routes").split(",") : routes();

// Runs inside the page.
function inspect(phone) {
  const vw = document.documentElement.clientWidth;
  const label = (el) =>
    el.localName +
    (el.id ? "#" + el.id : "") +
    (typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "");
  const shown = (el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      rect.width > 2 &&
      rect.height > 2
    );
  };
  const hiddenFromUsers = (el) =>
    el.closest('[aria-hidden="true"], [hidden], dialog:not([open]), svg, noscript, template');

  const clipsLegitimately = (el) => {
    for (
      let node = el.parentElement;
      node && node !== document.body && node !== document.documentElement;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node);
      if (style.position === "fixed") return true;
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
        const box = node.getBoundingClientRect();
        if (box.right <= vw + 1 && box.left >= -1) return true;
      }
    }
    return getComputedStyle(el).position === "fixed";
  };

  const overflowing = new Set();
  for (const el of document.body.querySelectorAll("*")) {
    if (/^(script|style|link|meta|source|br|path|use)$/i.test(el.localName)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.right <= vw + 1 && rect.left >= -1) continue;
    if (!shown(el) || hiddenFromUsers(el) || clipsLegitimately(el)) continue;
    overflowing.add(el);
  }
  const clipped = [...overflowing]
    .filter((el) => !overflowing.has(el.parentElement))
    .slice(0, 6)
    .map(
      (el) =>
        `${label(el)} (${Math.round(el.getBoundingClientRect().left)} to ${Math.round(el.getBoundingClientRect().right)} of ${vw})`,
    );

  const smallText = new Map();
  for (const el of document.body.querySelectorAll("*")) {
    if (/^(script|style|noscript|title)$/i.test(el.localName)) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own || !shown(el) || hiddenFromUsers(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 13) smallText.set(label(el), Math.round(size * 10) / 10);
  }

  // Text cut off inside its own box: a pill, label or button that clips or truncates instead of wrapping.
  const truncated = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.scrollWidth <= el.clientWidth + 1 || el.clientWidth < 8 || el.clientHeight > 160) continue;
    const style = getComputedStyle(el);
    if (!/(hidden|clip)/.test(style.overflowX) || !shown(el) || hiddenFromUsers(el)) continue;
    if (style.whiteSpace !== "nowrap" && style.textOverflow !== "ellipsis") continue;
    if (el.textContent.trim().length > 2) truncated.push(label(el));
  }

  // A page can pass the overflow gate while its headings form a one-word-wide column.
  // Measure rendered word fragments, rather than guessing from CSS or counting <br>s.
  // These remain review notes: a deliberate editorial line break is not a failed layout.
  const brokenWords = [];
  const narrowHeads = [];
  // The archived campaign places its public hero before <main>. Include that
  // content explicitly and always inspect h1, wherever the page authors put it.
  const contentRoots = [...document.querySelectorAll('main, [role="main"], .hero, .page-hero, .w-hero')];
  const textVisible = (el) => {
    if (
      !shown(el) ||
      hiddenFromUsers(el) ||
      el.closest('[inert], details:not([open]), nav, footer, [role="navigation"], [role="contentinfo"]')
    )
      return false;
    for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const textLabel = (el) => {
    const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    return `${label(el)} “${text.length > 84 ? text.slice(0, 83) + "…" : text}”`;
  };
  const headings = [
    ...document.querySelectorAll("h1"),
    ...contentRoots.flatMap((main) => [...main.querySelectorAll("h1, h2, h3")]),
  ];
  for (const heading of new Set(headings)) {
    if (!textVisible(heading)) continue;
    const size = parseFloat(getComputedStyle(heading).fontSize);
    const lines = [];
    let textLeft = Infinity;
    let textRight = -Infinity;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!textVisible(node.parentElement)) continue;
      for (const word of node.textContent.matchAll(/[\p{L}\p{N}][\p{L}\p{N}\u2019']*/gu)) {
        const range = document.createRange();
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0.5 && rect.height > 0.5);
        const wordLines = [];
        for (const rect of rects) {
          textLeft = Math.min(textLeft, rect.left);
          textRight = Math.max(textRight, rect.right);
          if (!wordLines.some((top) => Math.abs(top - rect.top) < 2)) wordLines.push(rect.top);
          if (!lines.some((top) => Math.abs(top - rect.top) < Math.max(3, size * 0.2))) lines.push(rect.top);
        }
        if (word[0].length >= 6 && wordLines.length > 1) {
          brokenWords.push(`${textLabel(heading)} splits “${word[0]}” across ${wordLines.length} lines`);
        }
      }
    }
    const width = Math.min(heading.getBoundingClientRect().width, textRight - textLeft);
    if (lines.length >= 5 && width / size < 7 && heading.textContent.trim().length >= 24) {
      narrowHeads.push(
        `${textLabel(heading)} ${lines.length} lines in ${Math.round(width)}px at ${Math.round(size)}px type`,
      );
    }
  }

  // Unlike the old nowrap-only check, this also catches a paragraph or caption whose
  // final lines disappear under its own or an ancestor's overflow. Skip mixed media
  // and closed UI; an auto/scroll container permits content beyond its scrollport.
  const textCutOff = [];
  const clipBoxes = new Map();
  const textBoxes = [
    ...document.querySelectorAll("h1, h1 span"),
    ...contentRoots.flatMap((main) => [
      ...main.querySelectorAll("h1, h2, h3, h4, h1 span, h2 span, h3 span, p, li, dd, dt, label, figcaption"),
    ]),
  ];
  for (const el of new Set(textBoxes)) {
    if (!textVisible(el) || !el.textContent.trim() || el.querySelector("img, svg, video, canvas, iframe, table, form"))
      continue;
    const style = getComputedStyle(el);
    const tolerance = Math.max(4, parseFloat(style.fontSize) * 0.25);
    const hasBox = style.display !== "inline" && el.clientWidth >= 8 && el.clientHeight >= 8;
    const clippedX = hasBox && /(hidden|clip)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + tolerance;
    const clippedY = hasBox && /(hidden|clip)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + tolerance;
    if (clippedX || clippedY) {
      textCutOff.push(
        `${textLabel(el)} clips ${[clippedX && "width", clippedY && "height"].filter(Boolean).join(" and ")}`,
      );
      continue;
    }

    const range = document.createRange();
    range.selectNodeContents(el);
    const textRect = range.getBoundingClientRect();
    if (textRect.width < 1 || textRect.height < 1) continue;
    let scrollsX = false;
    let scrollsY = false;
    for (
      let ancestor = el.parentElement;
      ancestor && ancestor !== document.body && ancestor !== document.documentElement;
      ancestor = ancestor.parentElement
    ) {
      if (!clipBoxes.has(ancestor)) {
        clipBoxes.set(ancestor, { style: getComputedStyle(ancestor), rect: ancestor.getBoundingClientRect() });
      }
      const clip = clipBoxes.get(ancestor);
      scrollsX ||= /(auto|scroll)/.test(clip.style.overflowX);
      scrollsY ||= /(auto|scroll)/.test(clip.style.overflowY);
      if (scrollsX && scrollsY) break;
      const outsideX =
        !scrollsX &&
        /(hidden|clip)/.test(clip.style.overflowX) &&
        (textRect.left < clip.rect.left - tolerance || textRect.right > clip.rect.right + tolerance);
      const outsideY =
        !scrollsY &&
        /(hidden|clip)/.test(clip.style.overflowY) &&
        (textRect.top < clip.rect.top - tolerance || textRect.bottom > clip.rect.bottom + tolerance);
      if (outsideX || outsideY) {
        textCutOff.push(
          `${textLabel(el)} clipped by ${label(ancestor)} (${[outsideX && "width", outsideY && "height"].filter(Boolean).join(" and ")})`,
        );
        break;
      }
    }
  }

  let below24 = 0;
  let under44 = 0;
  const targetSamples = [];
  const smallInputs = [];
  const found = [
    ...document.body.querySelectorAll(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"]',
    ),
  ].filter((el) => shown(el) && !hiddenFromUsers(el));
  const boxes = found.map((el) => ({ el, rect: el.getBoundingClientRect() }));
  // WCAG 2.5.8: a target under 24 px passes when a 24 px circle centred on it touches no other target.
  const crowded = (box) => {
    const cx = box.rect.left + box.rect.width / 2;
    const cy = box.rect.top + box.rect.height / 2;
    return boxes.some((other) => {
      if (other === box || other.el.contains(box.el) || box.el.contains(other.el)) return false;
      const dx = Math.max(other.rect.left - cx, 0, cx - other.rect.right);
      const dy = Math.max(other.rect.top - cy, 0, cy - other.rect.bottom);
      return Math.hypot(dx, dy) < 12;
    });
  };
  for (const box of boxes) {
    const { el, rect } = box;
    const style = getComputedStyle(el);
    if (el.localName === "a" && style.display === "inline") continue; // WCAG 2.5.8 inline exception
    if (!phone) continue;
    if (rect.width < 24 || rect.height < 24) {
      if (crowded(box)) {
        below24++;
        if (targetSamples.length < 5)
          targetSamples.push(`${label(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    } else if (rect.width < 44 || rect.height < 44) under44++;
    if (/^(input|select|textarea)$/.test(el.localName) && !/^(checkbox|radio|button|submit|range)$/.test(el.type)) {
      if (parseFloat(style.fontSize) < 16) smallInputs.push(label(el));
    }
  }

  return {
    vw,
    hScroll: document.documentElement.scrollWidth - vw,
    clipped,
    truncated: truncated.slice(0, 5),
    textCutOff: textCutOff.slice(0, 5),
    textCutOffCount: textCutOff.length,
    brokenWords: brokenWords.slice(0, 5),
    brokenWordCount: brokenWords.length,
    narrowHeads: narrowHeads.slice(0, 5),
    narrowHeadCount: narrowHeads.length,
    smallText: [...smallText].slice(0, 5).map(([name, size]) => `${name} ${size}px`),
    smallTextCount: smallText.size,
    below24,
    targetSamples,
    under44,
    smallInputs: smallInputs.slice(0, 5),
    smallInputCount: smallInputs.length,
    imageSize: [...document.images].filter((img) => !img.hasAttribute("width") || !img.hasAttribute("height")).length,
    viewportFit: /viewport-fit=cover/.test(document.querySelector('meta[name="viewport"]')?.content || ""),
  };
}

// Static scan of the stylesheets for rules R2 and R8.
function stylesheetScan() {
  const files = [];
  for (const dir of ["css", "src/styles"]) {
    const full = path.join(root, dir);
    if (fs.existsSync(full))
      for (const name of fs.readdirSync(full)) if (name.endsWith(".css")) files.push(path.join(dir, name));
  }
  const widths = {};
  const vh = [];
  for (const file of files) {
    const css = fs.readFileSync(path.join(root, file), "utf8");
    for (const m of css.matchAll(/@media[^{]*?\(\s*(?:min|max)-width:\s*([\d.]+)(px|em|rem)\s*\)/g)) {
      const px = Math.round(parseFloat(m[1]) * (m[2] === "px" ? 1 : 16));
      (widths[px] ||= new Set()).add(file);
    }
    const count = (css.match(/\b100vh\b/g) || []).length;
    if (count) vh.push(`${file} (${count})`);
  }
  const allowed = [640, 900, 1200];
  const strays = Object.keys(widths)
    .map(Number)
    .filter((w) => !allowed.includes(w))
    .sort((a, b) => a - b);
  return { distinct: Object.keys(widths).length, strays, vh };
}

(async () => {
  const server = await start();
  const browser = await chromium.launch({ executablePath: process.env.PCI_TEST_CHROMIUM || undefined });
  const results = [];
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: Boolean(viewport.phone),
      hasTouch: Boolean(viewport.phone),
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (request) => request.abort());
    const page = await context.newPage();
    for (const route of wanted) {
      try {
        await page.goto(server.base + route, { waitUntil: "load", timeout: 20000 });
      } catch {
        await page.waitForLoadState("domcontentloaded").catch(() => {});
      }
      if (viewport.textZoom) await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(450);
      const measured = await page.evaluate(inspect, Boolean(viewport.phone));
      results.push({
        route,
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        textZoom: Boolean(viewport.textZoom),
        ...measured,
      });
      if (shotsDir && !viewport.noShot && keyRoutes.includes(route)) {
        const name =
          (route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "_")) + `.${viewport.name}.jpg`;
        await page
          .screenshot({ path: path.join(shotsDir, name), fullPage: true, type: "jpeg", quality: 60 })
          .catch(() => {});
      }
    }
    await context.close();
    process.stdout.write(`measured ${viewport.name} px\n`);
  }
  await browser.close();
  server.stop();

  const failing = (r) => r.hScroll > 1 || r.clipped.length > 0 || r.below24 > 0;
  const sum = (key, filter = () => true) =>
    results.filter(filter).reduce((n, r) => n + (Array.isArray(r[key]) ? r[key].length : r[key]), 0);

  console.log(`\n${wanted.length} pages x ${viewports.length} viewports = ${results.length} measurements\n`);
  console.log(
    "viewport".padEnd(14),
    "hScroll".padStart(8),
    "clipped".padStart(8),
    "below24".padStart(8),
    "under44".padStart(8),
    "smallTxt".padStart(9),
    "smallInp".padStart(9),
  );
  for (const viewport of viewports) {
    const set = results.filter((r) => r.viewport === viewport.name);
    console.log(
      viewport.name.padEnd(14),
      String(set.filter((r) => r.hScroll > 1).length).padStart(8),
      String(set.filter((r) => r.clipped.length).length).padStart(8),
      String(set.reduce((n, r) => n + r.below24, 0)).padStart(8),
      String(set.reduce((n, r) => n + r.under44, 0)).padStart(8),
      String(set.filter((r) => r.smallTextCount).length).padStart(9),
      String(set.reduce((n, r) => n + r.smallInputCount, 0)).padStart(9),
    );
  }
  console.log(
    "(hScroll and clipped count pages; below24, under44 and smallInp count controls; smallTxt counts pages)\n",
  );

  for (const r of results.filter(failing)) {
    const parts = [];
    if (r.hScroll > 1) parts.push(`scrolls sideways by ${r.hScroll}px`);
    if (r.clipped.length) parts.push(`clipped: ${r.clipped.slice(0, 3).join("; ")}`);
    if (r.below24) parts.push(`${r.below24} target(s) under 24px: ${r.targetSamples.slice(0, 3).join("; ")}`);
    console.log(`FAIL ${r.viewport.padEnd(12)} ${r.route}  ${parts.join(" | ")}`);
  }
  for (const r of results.filter((r) => r.truncated.length)) {
    console.log(`note: truncated ${r.viewport.padEnd(12)} ${r.route}  ${r.truncated.slice(0, 3).join("; ")}`);
  }
  for (const key of ["textCutOff", "brokenWords", "narrowHeads"]) {
    for (const r of results.filter((r) => r[key].length)) {
      console.log(`note: ${key} ${r.viewport.padEnd(12)} ${r.route}  ${r[key].slice(0, 3).join("; ")}`);
    }
  }
  const noFit = [...new Set(results.filter((r) => !r.viewportFit).map((r) => r.route))];
  const noSize = [...new Set(results.filter((r) => r.imageSize).map((r) => r.route))];
  console.log(`note: ${noFit.length} page(s) lack viewport-fit=cover`);
  console.log(
    `note: ${noSize.length} page(s) have images without width and height (${sum("imageSize", (r) => r.viewport === "390")} images at 390 px)`,
  );

  const css = stylesheetScan();
  console.log(
    `note: ${css.distinct} distinct breakpoint widths in the stylesheets; ${css.strays.length} are not 640, 900 or 1200: ${css.strays.join(", ")}`,
  );
  console.log(`note: 100vh is used in ${css.vh.length} stylesheet(s): ${css.vh.join(", ") || "none"}`);

  if (jsonOut) {
    fs.writeFileSync(
      jsonOut,
      JSON.stringify({ measured: new Date().toISOString(), stylesheets: css, results }, null, 1),
    );
    console.log(`details written to ${jsonOut}`);
  }
  const failures = results.filter(failing).length;
  if (failures) {
    console.log(`\n${failures} measurement(s) fail a responsive rule.`);
    if (strict) process.exit(1);
  } else console.log("\nNo responsive failures.");
})();
