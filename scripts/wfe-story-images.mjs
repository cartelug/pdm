/* ==========================================================================
   wfe-story-images — art-directed crops for the Walk for Education page
   --------------------------------------------------------------------------
   usage: node scripts/wfe-story-images.mjs

   Reads the supplied campaign and campus-life illustrations in
   assets/wfe-2026/{campaign,campus}/full and writes the crops the campaign
   page places in its story (assets/wfe-2026/story) as AVIF and WebP at a few
   widths, plus small WebP previews of the ten explainers. Crops are fractions
   of the source frame. Children's scenes are cropped low so the university
   building reference does not read as the neighbouring primary school.
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets/wfe-2026");
const OUT = path.join(SRC, "story");

// name, source, crop [left, top, right, bottom] as fractions, output widths
const CROPS = [
  ["hero-portrait", "campaign/full/10-rotarian-editorial-portrait.webp", [0, 0, 1, 1], [480, 800, 1120]],
  ["hero-campus", "campus/full/19-first-light-on-campus.webp", [0.08, 0.02, 0.98, 0.86], [480, 800]],
  ["bag-detail", "campaign/full/12-backpack-editorial-detail.webp", [0, 0, 1, 1], [640, 1000, 1254]],
  ["bag-staff", "campaign/full/11-shoulder-strap-and-staff-detail.webp", [0, 0, 1, 1], [640, 1000]],
  ["bag-purpose", "campaign/full/16-bag-and-purpose-editorial.webp", [0, 0, 1, 1], [800, 1400]],
  ["bag-cutout", "campaign/full/08-black-backpack-cutout.webp", [0, 0, 1, 1], [360, 640], true],
  ["learn-bubbles", "campus/full/21-bubbles-and-playground-wonder.webp", [0, 0.36, 1, 1], [800, 1400]],
  ["learn-scientists", "campus/full/13-young-scientists-in-sunlight.webp", [0, 0.02, 0.66, 1], [640, 1000]],
  ["learn-blocks", "campus/full/17-children-building-together.webp", [0, 0.22, 0.66, 1], [640, 1000]],
  ["learn-hinge", "campus/full/23-older-students-mentoring-children.webp", [0, 0, 1, 1], [800, 1400, 1672]],
  ["learn-solar", "campus/full/14-student-solar-maker-workshop.webp", [0, 0.1, 0.75, 1], [640, 1000]],
  ["learn-model", "campus/full/24-students-making-a-campus-model.webp", [0.15, 0.2, 0.9, 1], [640, 1000]],
  ["learn-ideas", "campus/full/20-ideas-shared-under-the-trees.webp", [0, 0, 1, 1], [800, 1400]],
  ["ambition-bg", "campaign/full/03-project-purpose-background.webp", [0, 0, 1, 1], [800, 1400, 1672]],
  ["ambition-detail", "campaign/full/14-campus-architectural-detail.webp", [0, 0, 1, 1], [560, 900]],
  ["journey-bg", "campaign/full/02-progress-path-background.webp", [0, 0, 1, 1], [800, 1400, 1672]],
  ["journey-walker", "campaign/full/07-walker-and-bag-cutout.webp", [0, 0, 1, 1], [480, 860], true],
  // Full-bleed: a 2x super-resolution master of 05-journey-transition-background (campaign/hd).
  ["journey-road", "campaign/hd/05-journey-transition-background-2x.webp", [0, 0, 1, 1], [800, 1400, 2000, 2800]],
  ["friends-books", "campus/full/31-books-passed-between-friends.webp", [0, 0.12, 0.76, 1], [640, 1000]],
  ["together-music", "campus/full/16-campus-acoustic-music-circle.webp", [0, 0.22, 1, 1], [800, 1400]],
  ["trust-rain", "campus/full/18-campus-after-the-rain.webp", [0, 0.3, 1, 0.92], [800, 1600]],
  ["trust-report", "campaign/full/18-payment-report-received-artwork.webp", [0.42, 0.3, 1, 1], [400, 700]],
  ["updates-lens", "campus/full/22-students-exploring-photography.webp", [0, 0.1, 0.8, 1], [640, 1000]],
  ["close-blue-hour", "campus/full/34-campus-at-blue-hour.webp", [0, 0, 1, 1], [800, 1400, 1672]],
];

fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const [name, source, [l, t, r, b], widths, alpha] of CROPS) {
  const input = path.join(SRC, source);
  const meta = await sharp(input).metadata();
  const left = Math.round(l * meta.width);
  const top = Math.round(t * meta.height);
  const width = Math.round((r - l) * meta.width);
  const height = Math.round((b - t) * meta.height);
  manifest[name] = { source, width, height, widths };
  for (const w of widths) {
    const size = Math.min(w, width);
    const base = sharp(input).extract({ left, top, width, height }).resize({ width: size });
    await base
      .clone()
      .avif({ quality: alpha ? 58 : 52, effort: 6 })
      .toFile(path.join(OUT, `${name}-${w}.avif`));
    await base
      .clone()
      .webp({ quality: alpha ? 78 : 72, effort: 6, alphaQuality: 90 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const EXPLAINERS = path.join(SRC, "explainers");
const PREVIEWS = path.join(EXPLAINERS, "previews");
fs.mkdirSync(PREVIEWS, { recursive: true });
for (const file of fs.readdirSync(EXPLAINERS).filter((f) => f.endsWith(".svg"))) {
  await sharp(path.join(EXPLAINERS, file), { density: 96 })
    .resize({ width: 560 })
    .flatten({ background: "#f4efe6" })
    .webp({ quality: 74, effort: 6 })
    .toFile(path.join(PREVIEWS, file.replace(/\.svg$/, ".webp")));
}
console.log(`${CROPS.length} story crops and explainer previews written.`);
