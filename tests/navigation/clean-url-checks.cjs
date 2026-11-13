const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { root, routes, fileFor } = require("../quality/routes.cjs");

const staff = ["/admin/", "/admin/collections/", "/admin/operations/"];
const standalone = ["/admin/quick", "/admin/wfe", "/admin/operations/start", "/admin/operations/guide", "/404"];
const query = "?country=KE&steps=7&ref=url-check";

async function verify(base) {
  let checked = 0;
  async function page(route, file) {
    const response = await fetch(base + route, { redirect: "manual" });
    assert.equal(response.status, 200, route + " returns 200");
    assert.match(response.headers.get("content-type"), /text\/html/, route + " serves HTML");
    assert.equal(await response.text(), fs.readFileSync(file, "utf8"), route + " matches the deployed source");
    checked++;
  }
  async function redirect(from, to) {
    const response = await fetch(base + from + query, { redirect: "manual" });
    assert.equal(response.status, 301, from + " redirects permanently");
    const location = new URL(response.headers.get("location"), base);
    assert.equal(location.origin, new URL(base).origin, from + " stays on the same origin");
    assert.equal(location.pathname + location.search, to + query, from + " preserves the query string");
    checked++;
  }
  for (const route of [...routes(), ...staff]) {
    // The retired apartment concept already redirects to Projects on the host.
    if (route === "/apartments/") await redirect(route, "/projects/");
    else await page(route, fileFor(route));
    await redirect(route + "index.html", route);
  }
  for (const route of standalone) {
    await page(route, path.join(root, route + ".html"));
    await redirect(route + ".html", route);
  }
  for (const name of fs.readdirSync(root).filter((name) => /^[a-z-]+\.html$/.test(name) && name !== "index.html")) {
    await redirect("/" + name, "/" + name.slice(0, -5) + "/");
  }
  for (const route of ["/missing-page.html", "/missing-page", "/api/missing.php"]) {
    const response = await fetch(base + route, { redirect: "manual" });
    assert.equal(response.status, 404, route + " remains a real 404");
    checked++;
  }
  console.log(`Passed ${checked} clean URL, content, legacy redirect and missing-page checks at ${base}.`);
}

module.exports = { verify };
