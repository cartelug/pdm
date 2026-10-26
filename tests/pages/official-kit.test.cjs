const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require("sharp");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "../..");
const base = path.join(root, "assets/wfe-2026/official-kit");
const manifest = JSON.parse(fs.readFileSync(path.join(base, "manifest.json")));

test("the official kit collection has twenty independently composed desktop/mobile pairs and valid delivery files", async () => {
  assert.equal(manifest.scenes.length, 20);
  const hashes = new Set();
  for (const [index, scene] of manifest.scenes.entries()) {
    assert.equal(scene.id, String(index + 1).padStart(2, "0"));
    assert.equal(scene.illustration, true);
    for (const [orientation, composition] of Object.entries(scene.compositions)) {
      assert.ok(!hashes.has(composition.sourceSha256), "every composition is a distinct generated source");
      hashes.add(composition.sourceSha256);
      const meta = await sharp(path.join(base, composition.master)).metadata();
      assert.equal(meta.width, composition.width);
      assert.equal(meta.height, composition.height);
      assert.equal(orientation === "mobile", meta.height > meta.width);
      for (const output of composition.images) {
        const file = path.join(base, output.file);
        assert.equal(fs.statSync(file).size, output.bytes);
        const decoded = await sharp(file).resize({ width: 16 }).raw().toBuffer({ resolveWithObject: true });
        assert.ok(decoded.data.length > 0, output.file);
        const delivery = await sharp(file).metadata();
        assert.equal(delivery.width, output.width);
        assert.ok(delivery.width <= composition.width, "no fabricated upscaled detail");
        assert.ok(Math.abs(delivery.width / delivery.height - meta.width / meta.height) < 0.01);
      }
    }
  }
  assert.equal(hashes.size, 40);
});

test("all twenty scenes appear in actual pages while original physical references and honest arrival captions are retained", () => {
  const pages = [
    "index.html",
    "walk-for-education/index.html",
    "walk-for-education/partners/index.html",
    "walk-for-education/take-part/index.html",
  ];
  const seen = new Set();
  for (const file of pages) {
    const doc = new JSDOM(fs.readFileSync(path.join(root, file), "utf8")).window.document;
    for (const picture of doc.querySelectorAll("[data-campaign-scene]")) {
      seen.add(picture.dataset.campaignScene);
      // A picture has a phone source, or sits in the small inset, or deliberately uses the tall (mobile) composition at
      // every size inside a portrait frame.
      const portraitFrame = picture.closest(".pci-spotlight__frame");
      assert.ok(
        picture.querySelector('source[media="(max-width: 719px)"]') ||
          picture.closest(".w-hero__inset") ||
          (portraitFrame && /scene-\d+-mobile-/.test(picture.querySelector("img").getAttribute("src"))),
      );
    }
  }
  for (const scene of manifest.scenes) assert.ok(seen.has(scene.id), `scene ${scene.id} is integrated`);
  for (const [file, expected] of [
    ["official-backpack.png", "34a3318cc01cf0e4e8e19afbf3071f410d9a7628449839fdb442ee206886cad8"],
    ["official-shirt.png", "2d3806a33feda9ec6baac1514121db6cbf967b461cb562d7764ea7e1b8f8a6ec"],
  ])
    assert.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(path.join(root, "assets/wfe-2026/references", file)))
        .digest("hex"),
      expected,
    );
  const gallery = JSON.parse(fs.readFileSync(path.join(root, "assets/wfe-2026/gallery.json")));
  for (const id of ["art-16", "art-17"]) {
    const scene = gallery.find((item) => item.id === id);
    assert.match(scene.label, /imagined arrival/i);
    assert.match(scene.note, /not a record of arrival/);
    assert.ok(fs.existsSync(path.resolve(root, "walk-for-education", scene.mobileSrc)));
  }
});
