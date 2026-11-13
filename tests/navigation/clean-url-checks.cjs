const assert = require("node:assert/strict");
const fs = require("node:fs");
const { root, routes, fileFor } = require("../quality/routes.cjs");

const staff = ["/admin/", "/admin/collections/", "/admin/operations/"];
const standalone = ["/admin/quick/", "/admin/wfe/", "/admin/operations/start/", "/admin/operations/guide/", "/404/"];
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
    await response.arrayBuffer();
    assert.equal(response.status, 301, from + " redirects permanently");
    const location = new URL(response.headers.get("location"), base);
    assert.equal(location.origin, new URL(base).origin, from + " stays on the same origin");
    const targets = [to].flat().map((route) => route + query);
    assert.ok(
      targets.includes(location.pathname + location.search),
      from + " preserves the query string and target: " + location.pathname + location.search,
    );
    checked++;
  }
  for (const route of [...routes(), ...staff]) {
    // The retired apartment concept already redirects to Projects on the host.
    if (route === "/apartments/") await redirect(route, "/projects/");
    else await page(route, fileFor(route));
    // LiteSpeed applies the existing child RedirectMatch before the parent rewrite;
    // Apache applies the parent first. Both paths must end at the retired page's replacement.
    await redirect(route + "index.html", route === "/apartments/" ? [route, "/projects/"] : route);
  }
  for (const route of standalone) {
    // Reuse the HTTP connection after internal rewrites, as a real browser does.
    for (let repetition = 0; repetition < 3; repetition++) {
      await page(route, fileFor(route));
      await redirect(route.slice(0, -1) + ".html", route);
    }
  }
  for (const name of fs.readdirSync(root).filter((name) => /^[a-z-]+\.html$/.test(name) && name !== "index.html")) {
    await redirect("/" + name, "/" + name.slice(0, -5) + "/");
  }
  for (const route of ["/missing-page.html", "/missing-page", "/api/missing.php"]) {
    const response = await fetch(base + route, { redirect: "manual" });
    await response.arrayBuffer();
    assert.equal(response.status, 404, route + " remains a real 404");
    checked++;
  }
  console.log(`Passed ${checked} clean URL, content, legacy redirect and missing-page checks at ${base}.`);
}

module.exports = { verify };
