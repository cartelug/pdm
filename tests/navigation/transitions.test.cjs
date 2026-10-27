const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const component = fs.readFileSync(path.resolve(__dirname, "../../src/components/global/TransitionGuard.astro"), "utf8");
const source = component.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
test("cross-document navigation opts in synchronously before its event handlers", () => {
  const layout = fs.readFileSync(path.resolve(__dirname, "../../src/layouts/InstitutionalLayout.astro"), "utf8");
  assert.match(layout, /<style is:inline[^>]*>[\s\S]*@view-transition\s*\{\s*navigation:\s*auto;/);
  assert.ok(layout.indexOf("<style") < layout.indexOf("<TransitionGuard"));
});
function fixture() {
  const listeners = {};
  const errors = [];
  vm.runInNewContext(source, {
    window: {
      addEventListener: (name, listener) => {
        listeners[name] = listener;
      },
      setTimeout: (callback) => {
        try {
          callback();
        } catch (error) {
          errors.push(error);
        }
      },
    },
  });
  return { listeners, errors };
}
test("expected browser transition cancellation is handled for outgoing and incoming pages", async () => {
  for (const name of ["pageswap", "pagereveal"]) {
    for (const error of [
      new DOMException("Skipped", "AbortError"),
      new DOMException("Too slow", "TimeoutError"),
      new DOMException(
        "Transition was aborted because of invalid state. ViewTransition opt-in disabled",
        "InvalidStateError",
      ),
      new DOMException("Transition was aborted because of invalid state. Viewport size changed", "InvalidStateError"),
    ]) {
      const f = fixture();
      f.listeners[name]({ viewTransition: { ready: Promise.reject(error) } });
      await Promise.resolve();
      assert.deepEqual(f.errors, []);
    }
  }
});
test("unrelated transition errors are reported and ordinary page lifecycle events do nothing", async () => {
  const f = fixture();
  f.listeners.pageswap({});
  const error = new TypeError("Unexpected application failure");
  f.listeners.pagereveal({ viewTransition: { ready: Promise.reject(error) } });
  await Promise.resolve();
  assert.deepEqual(f.errors, [error]);
});
