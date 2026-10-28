import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

// Run only when replacing accepted artwork: node scripts/refresh-images.mjs /absolute/source-map.json.
// Routine builds consume the committed exports and never require generation inputs.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const directory = path.join(root, "assets/wfe-2026/refresh");
fs.mkdirSync(directory, { recursive: true });
const records = [];
for (const source of sources) {
  const input = fs.readFileSync(source.path);
  const metadata = await sharp(input).metadata();
  const id = String(source.id).padStart(2, "0");
  const outputs = [];
  const master = `${id}-master.webp`;
  await sharp(input).webp({ quality: 94 }).toFile(path.join(directory, master));
  for (const width of [480, 800, 1440]) {
    for (const format of ["avif", "webp"]) {
      const file = `${id}-${width}.${format}`;
      const image = sharp(input).resize({ width: Math.min(width, metadata.width), withoutEnlargement: true });
      const info = await image[format]({ quality: format === "avif" ? 52 : 84, effort: 4 }).toFile(
        path.join(directory, file),
      );
      outputs.push({ file, width: info.width, height: info.height, bytes: info.size });
    }
  }
  let thumbnail;
  if (source.thumbnailPath) {
    const input = fs.readFileSync(source.thumbnailPath);
    const file = `${id}-gallery-800.webp`;
    const info = await sharp(input)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(directory, file));
    thumbnail = {
      file,
      width: info.width,
      height: info.height,
      bytes: info.size,
      sourceSha256: crypto.createHash("sha256").update(input).digest("hex"),
      note: "Landscape gallery companion generated from the accepted portrait; original portrait remains the full-size identity reference.",
    };
  }
  records.push({
    id,
    title: source.title,
    alt: source.alt,
    group: source.group,
    artwork: true,
    note:
      source.note ||
      "AI-generated campaign artwork guided by authentic photographs. This is not a record of an actual event or verified impact.",
    sourceSha256: crypto.createHash("sha256").update(input).digest("hex"),
    width: metadata.width,
    height: metadata.height,
    master,
    outputs,
    ...(thumbnail ? { thumbnail } : {}),
  });
}
fs.writeFileSync(
  path.join(directory, "manifest.json"),
  JSON.stringify({ date: "2026-10-28", records }, null, 2) + "\n",
);
const galleryFile = path.join(root, "assets/wfe-2026/gallery.json");
const retained = JSON.parse(fs.readFileSync(galleryFile, "utf8")).filter((r) => r.id.startsWith("life-"));
fs.writeFileSync(
  galleryFile,
  JSON.stringify(
    [
      ...records.map((r) => ({
        ...r,
        id: `fresh-${r.id}`,
        group: "campaign",
        label: "Campaign artwork",
        src: `../assets/wfe-2026/refresh/${r.master}`,
        thumb: `../assets/wfe-2026/refresh/${r.thumbnail?.file || r.id + "-800.webp"}`,
        thumbWidth: r.thumbnail?.width || r.outputs.find((output) => output.file === r.id + "-800.webp").width,
        thumbHeight: r.thumbnail?.height || r.outputs.find((output) => output.file === r.id + "-800.webp").height,
        ...(r.id === "01" ? { mobileSrc: "../assets/wfe-2026/refresh/02-master.webp" } : {}),
      })),
      ...retained,
    ],
    null,
    2,
  ) + "\n",
);
for (const [orientation, id, width] of [
  ["mobile", "02", 360],
  ["desktop", "09", 800],
]) {
  for (const format of ["avif", "webp"]) {
    const image = sharp(path.join(directory, `${id}-master.webp`)).resize({ width, withoutEnlargement: true });
    await image[format]({ quality: format === "avif" ? 35 : 62, effort: 4 }).toFile(
      path.join(directory, `participation-${orientation}.${format}`),
    );
  }
}
const share = await sharp(path.join(directory, "01-master.webp"))
  .resize({ width: 1200, withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer();
fs.writeFileSync(path.join(root, "assets/walk-for-education/hero-share.jpg"), share);
fs.writeFileSync(path.join(root, "assets/og/pages/home.jpg"), share);
console.log(`Prepared ${records.length} distinct accepted images, with responsive exports and provenance.`);
