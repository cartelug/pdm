import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build-v3");
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
const baseline = JSON.parse(fs.readFileSync(path.join(root, "tests/protected-campaign/baseline.json"), "utf8"));
// The same export is served at / on cPanel and /pdm/ on GitHub Pages.
// Astro emits root-based asset links; make the static export portable without
// changing canonical URLs or the campaign runtime. Rehash modified stylesheets.
const assetDirectory = path.join(output, "_astro");
const renamedStyles = new Map();
for (const name of fs.readdirSync(assetDirectory).filter((name) => name.endsWith(".css"))) {
  const location = path.join(assetDirectory, name);
  const css = fs.readFileSync(location, "utf8").replaceAll("/_astro/", "./");
  const next = "pci-" + createHash("sha256").update(css).digest("hex").slice(0, 12) + ".css";
  fs.writeFileSync(path.join(assetDirectory, next), css);
  if (name !== next) fs.rmSync(location);
  renamedStyles.set(name, next);
}
function makeDocumentsPortable(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) makeDocumentsPortable(location);
    else if (entry.name.endsWith(".html")) {
      const back = path.relative(path.dirname(location), output).split(path.sep).join("/");
      const prefix = (back ? back + "/" : "") + "_astro/";
      let html = fs.readFileSync(location, "utf8");
      for (const [oldName, newName] of renamedStyles)
        html = html.replaceAll("/_astro/" + oldName, "/_astro/" + newName);
      html = html.replaceAll("/_astro/", prefix);
      fs.writeFileSync(location, html);
    }
  }
}
makeDocumentsPortable(output);
for (const route of routes) {
  const relative = path.join(route, "index.html");
  if (baseline.files[relative]) throw new Error("Export attempts to overwrite protected file: " + relative);
  const source = path.join(output, relative);
  if (!fs.existsSync(source)) throw new Error("Missing generated document: " + relative);
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  fs.copyFileSync(source, path.join(root, relative));
}
// _astro is generated exclusively by this isolated authoring layer.
fs.copyFileSync(path.join(output, "404.html"), path.join(root, "404.html"));
fs.rmSync(path.join(root, "_astro"), { recursive: true, force: true });
fs.cpSync(path.join(output, "_astro"), path.join(root, "_astro"), { recursive: true });
const articleRoot = path.join(output, "updates");
for (const entry of fs.readdirSync(articleRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  fs.cpSync(path.join(articleRoot, entry.name), path.join(root, "updates", entry.name), { recursive: true });
}
console.log("Exported " + routes.length + " static pages. Repository root index.html is ready for cPanel.");
