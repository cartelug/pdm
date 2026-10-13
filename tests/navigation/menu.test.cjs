const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "../..");

function fixture(reduced = false) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
    url: "https://pamodzici.com/",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: reduced });
  w.innerWidth = 390;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.getClientRects = () => [{ width: 100, height: 40 }];
  const dialog = w.document.querySelector("dialog");
  dialog.showModal = function () {
    this.setAttribute("open", "");
  };
  dialog.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new w.Event("close"));
  };
  w.exports = {};
  const output = ts.transpileModule(fs.readFileSync(path.join(root, "src/scripts/navigation.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  w.eval(output);
  const destroy = w.exports.initGlobalNavigation();
  return { w, dom, dialog, trigger: w.document.querySelector("[data-menu-open]"), destroy };
}

test("opening moves focus, makes the background inert and locks scroll; closing restores it", async () => {
  const f = fixture();
  const { w, dialog, trigger } = f;
  trigger.focus();
  trigger.click();
  assert.equal(dialog.open, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  assert.equal(w.document.activeElement, w.document.querySelector("[data-menu-close]"));
  assert.equal(w.document.querySelector("main").inert, true);
  assert.equal(w.document.body.style.position, "fixed");
  dialog.dispatchEvent(new w.Event("cancel", { cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(dialog.open, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(w.document.body.style.position, "");
  assert.equal(w.document.activeElement, trigger);
  f.destroy();
  f.dom.window.close();
});

test("rapid close/reopen cancels stale timers, and navigation clears the lock immediately", async () => {
  const f = fixture();
  f.trigger.click();
  f.w.document.querySelector("[data-menu-close]").click();
  f.trigger.click();
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(f.dialog.open, true);
  const link = f.dialog.querySelector("a");
  link.addEventListener("click", (e) => e.preventDefault());
  link.click();
  assert.equal(f.dialog.open, false);
  assert.equal(f.w.document.body.style.position, "");
  f.destroy();
  f.dom.window.close();
});

test("Tab wraps both directions and reduced motion closes immediately", () => {
  const f = fixture(true);
  f.trigger.click();
  const items = Array.from(f.dialog.querySelectorAll("a[href],button"));
  items.at(-1).focus();
  f.dialog.dispatchEvent(new f.w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  assert.equal(f.w.document.activeElement, items[0]);
  items[0].focus();
  f.dialog.dispatchEvent(
    new f.w.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }),
  );
  assert.equal(f.w.document.activeElement, items.at(-1));
  f.w.document.querySelector("[data-menu-close]").click();
  assert.equal(f.dialog.open, false);
  f.destroy();
  f.dom.window.close();
});

test("cleanup restores prior body styles and pre-existing inert state", () => {
  const f = fixture();
  f.w.document.body.style.color = "red";
  const main = f.w.document.querySelector("main");
  main.inert = true;
  f.trigger.click();
  f.destroy();
  assert.equal(f.dialog.open, false);
  assert.equal(f.w.document.body.style.color, "red");
  assert.equal(main.inert, true);
  f.dom.window.close();
});
