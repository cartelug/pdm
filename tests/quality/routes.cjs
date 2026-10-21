/* Shared by the design gates: which pages are public, and where their files live. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");

const skip = new Set([
  "admin",
  "api",
  "node_modules",
  "_astro",
  "src",
  "tests",
  "scripts",
  "assets",
  "css",
  "js",
  "data",
  "docs",
  "deploy",
  "build-v3",
  "public-v3",
  "legacy",
  "dist",
]);

// Every public route that has an index.html, such as "/" or "/walk-for-education/take-part/".
function routes(dir = root, prefix = "/") {
  const found = [];
  if (fs.existsSync(path.join(dir, "index.html"))) found.push(prefix);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || skip.has(entry.name) || entry.name.startsWith(".")) continue;
    found.push(...routes(path.join(dir, entry.name), prefix + entry.name + "/"));
  }
  return found;
}

// The route's HTML file inside a site root (defaults to the repository).
function fileFor(route, base = root) {
  return path.join(base, route.replace(/^\//, ""), "index.html");
}

// Pages that matter most: the speed-budget pages plus the rest of the Walk for Education journey.
const keyRoutes = [
  "/",
  "/about/",
  "/projects/",
  "/walk-for-education/",
  "/walk-for-education/take-part/",
  "/walk-for-education/partners/",
  "/walk-for-education/accountability/",
  "/walk-for-education/updates/",
  "/contribute/",
  "/faith-in-motion/",
  "/give/",
];

// Pages that carry pledge, payment, enquiry or register hooks. Their markup is protected.
const hookRoutes = (all = routes()) =>
  all.filter((route) => /^\/(walk-for-education|contribute)\//.test(route) || fimRoutes.includes(route));
const fimRoutes = ["/faith-in-motion/", "/give/", "/roll/", "/church/", "/take-part/", "/walk/", "/accountability/"];

module.exports = { root, routes, fileFor, keyRoutes, hookRoutes, fimRoutes };
