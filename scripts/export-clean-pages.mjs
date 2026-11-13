import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["admin/quick", "admin/wfe", "admin/operations/start", "admin/operations/guide", "404"];
for (const route of pages) {
  const source = fs.readFileSync(path.join(root, route + ".html"), "utf8");
  // Keep the authoring document's asset, fetch and navigation base at its parent
  // directory. The page itself is served from a real directory, with no rewrite.
  const name = path.basename(route);
  const html = source
    .replace(/<head>/i, '<head><base href="../">')
    .replace(/href=(['"])#([^'"]*)\1/g, (_match, quote, fragment) => `href=${quote}${name}/#${fragment}${quote}`);
  const output = path.join(root, route, "index.html");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html);
}
console.log("Exported five clean directory pages with their original asset and API bases.");
