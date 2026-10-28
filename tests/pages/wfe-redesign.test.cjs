const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const sharp = require("sharp");
const root = path.resolve(__dirname, "../..");
const file = path.join(root, "walk-for-education/index.html");
const html = fs.readFileSync(file, "utf8");
const doc = new JSDOM(html).window.document;

test("the campaign keeps its existing contribution contract and clearly identifies the mission", () => {
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.match(doc.querySelector("h1").textContent, /Every step builds a future/);
  assert.match(doc.querySelector(".r-hero").textContent, /UCU–Kagando University College/);
  assert.match(doc.querySelector(".r-hero").textContent, /Kagando Nursery/);
  for (const id of [
    "campaignCountry",
    "campaignSteps",
    "campaignTotal",
    "campaignContribute",
    "campaignAction",
    "campaignValidation",
  ]) {
    assert.ok(doc.getElementById(id), id);
  }
  assert.equal(doc.getElementById("campaignSteps").min, "5");
  assert.equal(doc.getElementById("campaignSteps").max, "20000");
  assert.deepEqual(
    Array.from(doc.querySelectorAll("[data-step-option]"), (el) => el.dataset.stepOption),
    ["100", "50", "20", "10", "5"],
  );
  assert.match(html, /pledges, pending payments and test payments do not unlock a certificate/i);
  assert.ok(doc.querySelector("[data-wfe-progress][data-wfe-show-if]"));
  assert.ok(doc.querySelector("[data-wfe-latest-update]"));
  assert.ok(doc.querySelector("[data-wfe-stages]"));
  assert.ok(doc.querySelector("[data-wfe-payment-channels]"));
  assert.ok(doc.querySelector("dialog[aria-labelledby]"));
});

test("all 46 generated images have valid, decodable responsive exports and honest provenance", async () => {
  const records = JSON.parse(fs.readFileSync(path.join(root, "assets/wfe-2026/gallery.json"), "utf8"));
  assert.equal(records.length, 46);
  assert.equal(new Set(records.map((r) => r.id)).size, 46);
  assert.equal(records.filter((r) => r.id.startsWith("fresh-")).length, 10);
  assert.equal(records.filter((r) => r.id.startsWith("life-")).length, 36);
  for (const record of records) {
    assert.match(record.label, /illustration|artwork/i);
    assert.match(record.note, /AI-generated|illustrat|fictional/i);
    for (const [field, max] of [
      ["src", 2000],
      ["thumb", 800],
    ]) {
      const local = path.resolve(path.dirname(file), record[field]);
      assert.ok(local.startsWith(path.join(root, "assets/wfe-2026")));
      assert.ok(fs.statSync(local).size > 0);
      const meta = await sharp(local).metadata();
      assert.equal(meta.format, "webp");
      assert.ok(meta.width <= max);
      assert.ok(Math.abs(meta.width / meta.height - record.width / record.height) < 0.01);
    }
  }
  assert.equal(doc.querySelectorAll(".r-resource-grid a").length, 10);
  assert.equal(doc.querySelectorAll("#campaignGallery img[loading='lazy']").length, 9);
});

test("all campaign page links, fragments and media resolve without duplicate IDs", () => {
  const ids = Array.from(doc.querySelectorAll("[id]"), (el) => el.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const el of doc.querySelectorAll("[href],[src],[srcset]")) {
    const urls = [
      el.getAttribute("href"),
      el.getAttribute("src"),
      ...(el.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(" ")[0]),
    ].filter(Boolean);
    for (const value of urls) {
      if (/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
      const [uri, fragment] = value.split("#");
      let target = uri ? path.resolve(path.dirname(file), uri.split("?")[0]) : file;
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
      assert.ok(fs.existsSync(target), value);
      if (fragment && target.endsWith(".html")) {
        const targetDoc = target === file ? doc : new JSDOM(fs.readFileSync(target, "utf8")).window.document;
        assert.ok(
          targetDoc.getElementById(fragment) || targetDoc.querySelector('[data-audience-tab="' + fragment + '"]'),
          value,
        );
      }
    }
  }
});
