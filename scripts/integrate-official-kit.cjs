/* Apply the accepted collection to handwritten pages without reserialising frozen form fragments. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/wfe-2026/official-kit/manifest.json")));
const records = new Map(manifest.scenes.map((item) => [item.id, item]));
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

function picture(id, prefix, alt = "", eager = false, wideOnly = false) {
  const record = records.get(id);
  const base = `${prefix}assets/wfe-2026/official-kit/scene-${id}`;
  const set = (orientation, format, widths) => widths.map((w) => `${base}-${orientation}-${w}.${format} ${w}w`).join(", ");
  const d = record.compositions.desktop;
  const m = record.compositions.mobile;
  return `<picture data-campaign-scene="${id}">${wideOnly ? "" : `<source media="(max-width: 719px)" type="image/avif" srcset="${set("mobile", "avif", [480, 800])}" sizes="100vw" width="${m.width}" height="${m.height}" /><source media="(max-width: 719px)" srcset="${set("mobile", "webp", [480, 800])}" sizes="100vw" width="${m.width}" height="${m.height}" />`}<source type="image/avif" srcset="${set("desktop", "avif", [800, 1440])}" sizes="100vw" /><img src="${base}-desktop-1440.webp" srcset="${set("desktop", "webp", [800, 1440])}" sizes="100vw" width="${d.width}" height="${d.height}" alt="${escape(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""} /></picture>`;
}

function editPage(file, prefix, apply) {
  let html = fs.readFileSync(path.join(root, file), "utf8");
  if (html.includes('href="' + prefix + 'css/official-kit.css')) return;
  const dom = new JSDOM(html, { includeNodeLocations: true });
  const doc = dom.window.document;
  const edits = [];
  const replace = (selector, content) => {
    const node = typeof selector === "string" ? doc.querySelector(selector) : selector;
    if (!node) throw new Error(`${file}: missing ${selector}`);
    const loc = dom.nodeLocation(node);
    edits.push([loc.startOffset, loc.endOffset, content]);
  };
  const backdrop = (selector, id, dark = false) => {
    const node = doc.querySelector(selector);
    if (!node) throw new Error(`${file}: missing ${selector}`);
    const loc = dom.nodeLocation(node).startTag;
    let open = html.slice(loc.startOffset, loc.endOffset);
    open = open.replace(/class="([^"]*)"/, (_, c) => `class="${c} kit-scene${dark ? " kit-scene--dark" : ""}"`);
    const image = id === "18"
      ? `<picture data-campaign-scene="18"><source media="(max-width: 719px)" type="image/avif" srcset="${prefix}assets/wfe-2026/official-kit/backdrop-18-mobile.avif" /><source media="(max-width: 719px)" srcset="${prefix}assets/wfe-2026/official-kit/backdrop-18-mobile.webp" /><source type="image/avif" srcset="${prefix}assets/wfe-2026/official-kit/backdrop-18-desktop.avif" /><img src="${prefix}assets/wfe-2026/official-kit/backdrop-18-desktop.webp" width="800" height="450" alt="" loading="eager" decoding="async" /></picture>`
      : picture(id, prefix);
    edits.push([loc.startOffset, loc.endOffset, open + `<div class="kit-scene__media" aria-hidden="true">${image}</div>`]);
  };
  apply({ doc, replace, backdrop, picture: (id, alt, eager, wideOnly) => picture(id, prefix, alt, eager, wideOnly) });
  for (const [start, end, content] of edits.sort((a, b) => b[0] - a[0])) html = html.slice(0, start) + content + html.slice(end);
  html = html.replace(/<link\b[^>]*href="[^"]*css\/one-look\.css[^"]*"[^>]*>/, (last) => `<link rel="stylesheet" href="${prefix}css/official-kit.css" />${last}`);
  fs.writeFileSync(path.join(root, file), html);
}

editPage("walk-for-education/index.html", "../", ({ doc, replace, backdrop, picture: pic }) => {
  replace(".w-hero__portrait picture", pic("02", "Campaign illustration of Shyaka walking in his official black kit, with the actual main university block behind him.", true));
  replace(".w-hero__inset picture", pic("08", "Reference-led illustration of the actual UCU–Kagando main block.", false, true));
  const bag = manifest.bagCutout;
  replace(".w-pledge__bag picture", `<picture class="kit-bag-cutout"><source type="image/avif" srcset="../assets/wfe-2026/official-kit/bag-cutout-360.avif 360w, ../assets/wfe-2026/official-kit/bag-cutout-640.avif 640w" sizes="(max-width: 899px) 50vw, 22vw" /><img src="../assets/wfe-2026/official-kit/bag-cutout-640.webp" srcset="../assets/wfe-2026/official-kit/bag-cutout-360.webp 360w, ../assets/wfe-2026/official-kit/bag-cutout-640.webp 640w" sizes="(max-width: 899px) 50vw, 22vw" width="${bag.width}" height="${bag.height}" loading="lazy" decoding="async" alt="" /></picture>`);
  replace(".w-meet__photo img", pic("03", "Reference-led campaign illustration of Shyaka in his official black Walk for Education T-shirt and backpack."));
  const meetCaption = doc.querySelector(".w-meet__photo figcaption");
  if (meetCaption) replace(meetCaption, "<figcaption>Shyaka Mbanda · reference-led campaign illustration</figcaption>");
  const frames = [...doc.querySelectorAll(".w-bag__frame")];
  for (const [index, id] of ["04", "05", "12"].entries()) {
    replace(frames[index].querySelector("picture"), pic(id, `Reference-led campaign illustration: ${records.get(id).title.toLowerCase()}.`));
    const caption = frames[index].querySelector("figcaption");
    if (caption) replace(caption, `<figcaption>${index === 0 ? "The official campaign backpack." : index === 1 ? "Carrying the purpose, step by step." : "A moment of persistence."}</figcaption>`);
  }
  const learning = [...doc.querySelectorAll(".w-learn__fig picture")];
  learning.forEach((node, index) => {
    const id = ["09", "07", "10", "19"][index % 4];
    replace(node, pic(id, `Illustrative learning scene with fictional participants: ${records.get(id).title.toLowerCase()}.`));
  });
  replace(".w-learn__hinge picture", pic("14", "Campaign illustration of Shyaka walking with fictional children and an accompanying adult."));
  replace(".w-ambition__bg picture", pic("08"));
  replace(".w-priorities__fig picture", pic("08", "Reference-led illustration of the main university building's blue and cream facade."));
  replace(".w-journey__bg picture", pic("06"));
  // The new complete scene supplies the real-kit walker; the previous generic cutout is not layered over it.
  replace(".w-journey__walker", '<div class="w-journey__walker" aria-hidden="true" data-depth="18" hidden></div>');
  replace(".w-journey__road picture", pic("13", "Campaign illustration of the Walking Rotarian continuing along a path in morning light."));
  replace(".w-five__fig picture", pic("11", "Campaign illustration of community members walking alongside Shyaka."));
  replace(".w-closing__bg picture", pic("20"));
  backdrop("#progress", "13");
  backdrop("#visual-stories", "16");
  replace("#viewerImage", '<picture><source media="(max-width: 719px)" /><img id="viewerImage" alt="" /></picture>');
});

editPage("walk-for-education/partners/index.html", "../../", ({ backdrop }) => {
  backdrop(".wfp-hero", "15");
  backdrop(".wfp-coalition", "17");
});
editPage("walk-for-education/take-part/index.html", "../../", ({ backdrop }) => {
  backdrop(".wfe2-page-hero", "18");
});

// Replace the twenty older campaign-art records, retaining the existing 36 school/campus illustrations and IDs.
const galleryFile = path.join(root, "assets/wfe-2026/gallery.json");
const gallery = JSON.parse(fs.readFileSync(galleryFile));
for (let index = 0; index < gallery.length; index++) {
  if (!gallery[index].id.startsWith("art-")) continue;
  const id = gallery[index].id.slice(4);
  const record = records.get(id);
  const base = `../assets/wfe-2026/official-kit/scene-${id}`;
  gallery[index] = {
    id: gallery[index].id,
    title: record.title,
    group: "campaign",
    label: record.imaginedArrival ? "Imagined arrival · campaign illustration" : "Official-kit campaign illustration",
    alt: `Reference-led campaign illustration: ${record.title.toLowerCase()}.`,
    width: record.compositions.desktop.width,
    height: record.compositions.desktop.height,
    src: `${base}-desktop-master.webp`,
    thumb: `${base}-desktop-800.webp`,
    mobileSrc: `${base}-mobile-master.webp`,
    note: record.imaginedArrival
      ? "AI-generated campaign illustration of an imagined future welcome, not a record of arrival or a real event. Fictional supporting people."
      : "AI-generated reference-led campaign illustration using the official kit. Supporting people and events are fictional; this is not verified field reporting.",
  };
}
fs.writeFileSync(galleryFile, JSON.stringify(gallery, null, 2) + "\n");
console.log("Integrated official-kit scenes without changing frozen pledge/payment forms.");
