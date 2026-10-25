/* Build responsive delivery images from forty individually generated, art-directed masters.
   Usage: node scripts/official-kit-images.mjs /absolute/path/to/accepted-images.json
   Source JSON maps NN-desktop / NN-mobile to native master paths. No visual cropping or upscaling. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
if (!input) throw new Error("Pass the accepted-images.json source mapping");
const sources = JSON.parse(fs.readFileSync(input, "utf8"));
const out = path.join(root, "assets/wfe-2026/official-kit");
const previousFile = path.join(out, "manifest.json");
const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, "utf8")) : null;
const sceneSpecs = JSON.parse(fs.readFileSync(path.join(root, "docs/official-kit-prompts.json"), "utf8"));
fs.mkdirSync(out, { recursive: true });
const manifest = {
  generatedOn: "2026-10-25",
  method: "Built-in image generation; individual desktop and mobile compositions, reference-led illustrations.",
  references: [
    "assets/wfe-2026/references/official-backpack.png",
    "assets/wfe-2026/references/official-shirt.png",
    "assets/walk-for-education/walking-rotarian-photo.jpg",
    "assets/walk-for-education/kagando-campus.webp",
  ],
  scenes: [],
};

for (const scene of sceneSpecs.scenes) {
  const record = {
    id: scene.id,
    title: scene.title,
    illustration: true,
    imaginedArrival: ["16", "17"].includes(scene.id),
    textSafe: { desktop: "left 6–43%; main action right", mobile: "upper 8–34%; action below" },
    compositions: {},
  };
  for (const orientation of ["desktop", "mobile"]) {
    const source = sources[`${scene.id}-${orientation}`];
    if (!source || !fs.existsSync(source)) throw new Error(`Missing ${scene.id}-${orientation}`);
    const sourceSha256 = crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex");
    const old = previous?.scenes.find((s) => s.id === scene.id)?.compositions[orientation];
    if (
      old?.sourceSha256 === sourceSha256 &&
      fs.existsSync(path.join(out, old.master)) &&
      old.images.every((image) => fs.existsSync(path.join(out, image.file)))
    ) {
      record.compositions[orientation] = old;
      continue;
    }
    const metadata = await sharp(source).metadata();
    if (orientation === "desktop" && metadata.width <= metadata.height) throw new Error("Desktop is not landscape");
    if (orientation === "mobile" && metadata.height <= metadata.width) throw new Error("Mobile is not portrait");
    const prefix = `scene-${scene.id}-${orientation}`;
    // Native-resolution compressed source remains in Git; original generator PNGs are preserved separately.
    await sharp(source)
      .webp({ quality: 94, effort: 5 })
      .toFile(path.join(out, `${prefix}-master.webp`));
    const images = [];
    for (const width of orientation === "desktop" ? [800, 1440] : [480, 800]) {
      const w = Math.min(width, metadata.width);
      const resize = sharp(source).resize({ width: w, withoutEnlargement: true });
      for (const format of ["avif", "webp"]) {
        const file = `${prefix}-${width}.${format}`;
        const pipe = resize.clone();
        if (format === "avif") pipe.avif({ quality: 47, effort: 4 });
        else pipe.webp({ quality: 74, effort: 5 });
        await pipe.toFile(path.join(out, file));
        images.push({
          file,
          format,
          width: w,
          height: Math.round((w * metadata.height) / metadata.width),
          bytes: fs.statSync(path.join(out, file)).size,
        });
      }
    }
    record.compositions[orientation] = {
      width: metadata.width,
      height: metadata.height,
      sourceSha256,
      master: `${prefix}-master.webp`,
      images,
    };
  }
  manifest.scenes.push(record);
  console.log(`Encoded scene ${scene.id}: desktop + mobile`);
}
if (sources["bag-cutout"]) {
  const source = sources["bag-cutout"];
  const meta = await sharp(source).metadata();
  if (!meta.hasAlpha) throw new Error("The actual bag cutout must retain transparency");
  await sharp(source).webp({ quality: 94, alphaQuality: 100 }).toFile(path.join(out, "bag-cutout-master.webp"));
  for (const width of [360, 640]) {
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 100 })
      .toFile(path.join(out, `bag-cutout-${width}.webp`));
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 60, effort: 4 })
      .toFile(path.join(out, `bag-cutout-${width}.avif`));
  }
  manifest.bagCutout = { source: "bag-cutout-master.webp", width: meta.width, height: meta.height, alpha: true };
}
// The participation hero uses a faint decorative layer, while its gallery retains both HD compositions.
for (const [orientation, width] of [
  ["mobile", 360],
  ["desktop", 800],
]) {
  const source = path.join(out, `scene-18-${orientation}-master.webp`);
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .avif({ quality: 35, effort: 4 })
    .toFile(path.join(out, `backdrop-18-${orientation}.avif`));
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 62 })
    .toFile(path.join(out, `backdrop-18-${orientation}.webp`));
}
manifest.decorativeBackdrops = {
  18: "backdrop-18-mobile / backdrop-18-desktop; same art-directed sources, smaller decorative delivery",
};
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
