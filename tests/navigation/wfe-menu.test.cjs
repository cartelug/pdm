const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "../..");
const shell = fs.readFileSync(path.join(root, "js/wfe-shell.js"), "utf8");
const menuSource = shell.split("/* ---------- 4. Mobile menu ---------- */")[1].split("/* ---------- 5.")[0];

function fixture(reduced = false) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, "walk-for-education/index.html"), "utf8"), {
    url: "https://pamodzici.com/walk-for-education/",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: reduced });
  w.innerWidth = 390;
  w.scrollY = 900;
  w.scrollTo = ({ top }) => {
    w.scrollY = top;
  };
  Object.defineProperty(w.document.documentElement, "clientWidth", { value: 375 });
  w.HTMLElement.prototype.getClientRects = () => [{ width: 120, height: 52 }];
  w.document.body.style.cssText = "padding-right: 3px; color: navy";
  w.document.documentElement.style.scrollBehavior = "smooth";
  const main = w.document.querySelector("main");
  const footer = w.document.querySelector("footer");
  main.inert = false;
  footer.inert = true;
  w.eval(`(function () {
    var byId = function (id) { return document.getElementById(id); };
    var all = function (selector) { return document.querySelectorAll(selector); };
    ${menuSource}
  })();`);
  return {
    w,
    dom,
    main,
    footer,
    menu: w.document.getElementById("wfeMenu"),
    button: w.document.getElementById("wfeMenuButton"),
  };
}

test("campaign menu preserves the scrolled position, body styles and prior inert state", () => {
  const f = fixture();
  const before = f.w.document.body.style.cssText;
  f.button.click();
  assert.equal(f.w.document.body.style.top, "-900px");
  assert.equal(f.w.document.body.style.position, "fixed");
  assert.equal(f.w.document.body.style.paddingRight, "18px");
  assert.equal(f.main.inert, true);
  assert.equal(f.menu.inert, false);
  assert.equal(f.w.document.activeElement, f.menu.querySelector("a"));
  f.w.document.dispatchEvent(new f.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(f.w.document.body.style.cssText, before);
  assert.equal(f.w.scrollY, 900);
  assert.equal(f.w.document.documentElement.style.scrollBehavior, "smooth");
  assert.equal(f.main.inert, false);
  assert.equal(f.footer.inert, true);
  assert.equal(f.w.document.activeElement, f.button);
  f.dom.window.close();
});

test("rapid open, close and reopen cannot leave a stale closing state or lose the original position", async () => {
  const f = fixture();
  f.button.click();
  f.w.scrollY = 0; // Fixed-body scrolling on a phone.
  f.button.click();
  f.button.click();
  await new Promise((resolve) => setTimeout(resolve, 450));
  assert.equal(f.menu.dataset.state, "open");
  assert.equal(f.button.getAttribute("aria-expanded"), "true");
  assert.equal(f.w.document.body.style.top, "-900px");
  f.button.click();
  assert.equal(f.w.scrollY, 900);
  assert.equal(f.w.document.body.style.position, "");
  f.dom.window.close();
});

test("anchor navigation unlocks before the browser follows the link and keeps the chosen steps", () => {
  const f = fixture();
  const steps = f.w.document.getElementById("campaignSteps").value;
  f.button.click();
  const link = f.menu.querySelector('a[href="#choose-steps"]');
  link.addEventListener("click", (event) => {
    event.preventDefault();
    assert.equal(f.w.document.body.style.position, "");
    assert.equal(f.main.inert, false);
  });
  link.click();
  assert.equal(f.menu.inert, true);
  assert.equal(f.w.document.getElementById("campaignSteps").value, steps);
  f.dom.window.close();
});

test("desktop resize clears the scroll lock and leaves desktop navigation usable", () => {
  const f = fixture();
  f.button.click();
  f.button.style.display = "none";
  f.w.dispatchEvent(new f.w.Event("resize"));
  assert.equal(f.menu.dataset.state, "closed");
  assert.equal(f.menu.inert, false);
  assert.equal(f.w.document.body.style.position, "");
  assert.equal(f.main.inert, false);
  f.button.style.display = "inline-flex";
  f.w.dispatchEvent(new f.w.Event("resize"));
  assert.equal(f.menu.inert, true);
  f.dom.window.close();
});

test("reduced motion has immediate states and keyboard focus wraps through the menu", () => {
  const f = fixture(true);
  f.button.click();
  assert.equal(f.menu.dataset.state, "open");
  const first = f.menu.querySelector("a");
  first.focus();
  f.w.document.dispatchEvent(new f.w.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true }));
  assert.equal(f.w.document.activeElement, f.button);
  f.w.document.dispatchEvent(new f.w.KeyboardEvent("keydown", { key: "Tab", cancelable: true }));
  assert.equal(f.w.document.activeElement, first);
  f.button.click();
  assert.equal(f.menu.dataset.state, "closed");
  f.dom.window.close();
});

test("page navigation and back-forward restoration cannot retain a frozen body", () => {
  const f = fixture();
  f.button.click();
  f.w.dispatchEvent(new f.w.Event("pagehide"));
  assert.equal(f.menu.dataset.state, "closed");
  assert.equal(f.w.document.body.style.position, "");
  f.button.click();
  f.w.dispatchEvent(new f.w.PageTransitionEvent("pageshow", { persisted: true }));
  assert.equal(f.menu.dataset.state, "closed");
  assert.equal(f.w.document.body.style.position, "");
  f.dom.window.close();
});
