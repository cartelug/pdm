const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "../..");
const routes = [
  "",
  "about",
  "what-we-do",
  "model",
  "projects",
  "impact",
  "partnerships",
  "governance",
  "updates",
  "contact",
  "apartments",
  "community",
  "design-system",
];

test("root index.html contains the complete static homepage, without a redirect or JS dependency", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /Together, we build what lasts/);
  assert.match(html, /<main[^>]*id="main-content"/);
  assert.doesNotMatch(html, /http-equiv="refresh"/i);
  assert.match(html, /Explore Our Work/);
});

test("compiled presentation assets resolve at both the domain root and the GitHub Pages subpath", () => {
  for (const base of ["https://pamodzici.com/", "https://cartelug.github.io/pdm/"]) {
    const basePath = new URL(base).pathname;
    for (const route of routes) {
      const html = fs.readFileSync(path.join(root, route, "index.html"), "utf8");
      const doc = new JSDOM(html, { url: base + (route ? route + "/" : "") }).window.document;
      for (const element of doc.querySelectorAll('link[rel="stylesheet"],script[src]')) {
        const value = element.getAttribute("href") || element.getAttribute("src");
        if (!value.includes("_astro/")) continue;
        const resolved = new URL(value, doc.URL);
        assert.ok(resolved.pathname.startsWith(basePath + "_astro/"), route + " keeps assets under " + basePath);
        const local = path.join(root, resolved.pathname.slice(basePath.length));
        assert.ok(fs.existsSync(local), value + " resolves to an exported asset");
      }
    }
  }
  for (const name of fs.readdirSync(path.join(root, "_astro")).filter((name) => name.endsWith(".css"))) {
    const css = fs.readFileSync(path.join(root, "_astro", name), "utf8");
    assert.doesNotMatch(css, /\/_astro\//, "Fonts and imagery stay relative to their compiled stylesheet");
  }
});

test("every upgraded page has valid local links, fragments, assets and unique IDs", () => {
  for (const route of routes) {
    const file = path.join(root, route, "index.html");
    const doc = new JSDOM(fs.readFileSync(file, "utf8"), { url: "https://pamodzici.com/" + (route ? route + "/" : "") })
      .window.document;
    assert.equal(doc.querySelectorAll("h1").length, 1, route + " has one H1");
    const ids = Array.from(doc.querySelectorAll("[id]"), (x) => x.id);
    assert.equal(new Set(ids).size, ids.length, route + " has unique IDs");
    for (const el of doc.querySelectorAll("[href],[src],[srcset]")) {
      const values = [
        el.getAttribute("href"),
        el.getAttribute("src"),
        ...(el.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(" ")[0]),
      ].filter(Boolean);
      for (const value of values) {
        if (/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
        const [url, fragment] = value.split("#");
        let target = url
          ? url.startsWith("/")
            ? path.join(root, url)
            : path.resolve(path.dirname(file), url.split("?")[0])
          : file;
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
        assert.ok(fs.existsSync(target), route + ": missing " + value);
        if (fragment && target.endsWith(".html")) {
          const targetDoc = target === file ? doc : new JSDOM(fs.readFileSync(target, "utf8")).window.document;
          assert.ok(targetDoc.getElementById(fragment), route + ": missing fragment " + value);
        }
      }
    }
    assert.ok(doc.querySelector("[data-nav-fallback] a"), "no-JS navigation exists");
    assert.ok(doc.querySelector('[rel="canonical"]'));
    assert.ok(doc.querySelector('meta[property="og:image"]'));
    assert.ok(doc.querySelector("dialog[aria-labelledby]"));
  }
});

test("under-review concept stays distinct from a live campaign; draft updates are excluded", () => {
  const doc = new JSDOM(fs.readFileSync(path.join(root, "projects/index.html"), "utf8")).window.document;
  const concept = doc.querySelector('[data-project-status="Under review"]');
  assert.ok(concept.textContent.includes("Kasese Apartment Concept"));
  assert.ok(concept.textContent.includes("No public investment"));
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(home, /Pledges open/);
  // The home page describes the campaign with the record's own wording, not a second copy of it.
  const walkLabel = require("node:vm").runInNewContext(
    fs.readFileSync(path.join(root, "js/wfe-data.js"), "utf8") + ";window.WFE_CAMPAIGN.statusLabel",
    { window: {} },
  );
  assert.ok(home.includes(walkLabel), "home shows the campaign record's status label: " + walkLabel);
  assert.doesNotMatch(home, /UGX 3,460,000|Campaign register reaches 33 entries/);
});

test("V3 never injects its scripts or stylesheet into protected campaign documents", () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(root, "tests/protected-campaign/baseline.json"), "utf8"));
  for (const file of Object.keys(baseline.files).filter((f) => /^(walk-for-education|contribute)\/.+\.html$/.test(f))) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(html, /data-pci-v3|pciNavigation|_astro\//, file);
  }
});

test("all linked financial services remain separate from institutional enquiries", () => {
  const api = fs.readFileSync(path.join(root, "api/enquiry.php"), "utf8");
  assert.doesNotMatch(api, /require.+payments|pci_create|ROLL_DATA|collections\.sqlite/);
  assert.match(api, /hash_equals/);
  assert.match(api, /FILTER_VALIDATE_EMAIL/);
  assert.match(api, /PCI_ENQUIRY_ENABLED/);
});
