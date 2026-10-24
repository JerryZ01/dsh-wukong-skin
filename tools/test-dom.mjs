/**
 * DOM smoke test for the built browser bundle: loads lib/client.js into jsdom
 * through a stand-in __ModuleLoader__ and drives the real activate/dispose path.
 *
 * React is never rendered here - the slots are only registered - so the two
 * externals it imports are stubbed with inert objects. What is exercised is the
 * imperative half: style injection, the backdrop, the document-level tokens,
 * the appearance-row button, and full teardown.
 *
 *   $env:JSDOM_PATH='<dir containing node_modules/jsdom>'
 *   node tools/test-dom.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Prefer a plain `npm install`; JSDOM_PATH stays as an escape hatch for
// machines that keep jsdom somewhere outside the checkout.
const jsdomRoot = process.env.JSDOM_PATH ?? fileURLToPath(new URL("..", import.meta.url));
const requireJsdom = createRequire(`${jsdomRoot.replace(/[\\/]$/, "")}/`);
let JSDOM;
try {
  ({ JSDOM } = requireJsdom("jsdom"));
} catch {
  console.error("jsdom is missing. Run `npm install`, or set JSDOM_PATH to a directory that has it.");
  process.exit(1);
}

const PACKAGE_ID = "dsh-client-wukong-intensity-skin";
const bundlePath = fileURLToPath(new URL("../lib/client.js", import.meta.url));
const source = readFileSync(bundlePath, "utf8");

const NOOP = () => null;
const reactStub = new Proxy({}, { get: () => NOOP });
const jsxRuntimeStub = { jsx: NOOP, jsxs: NOOP, Fragment: "div" };
const primitivesStub = { Switch: NOOP };

const dom = new JSDOM(
  `<!doctype html><html lang="zh-CN"><body>
     <div id="root"></div>
     <div class="v01cdW_group">
       <div class="v01cdW_cubeRow">
         <button class="v01cdW_themeCube" data-theme="light">浅色</button>
         <button class="v01cdW_themeCube" data-theme="dark">深色</button>
         <button class="v01cdW_themeCube" data-theme="system">跟随系统</button>
       </div>
     </div>
   </body></html>`,
  { url: "http://127.0.0.1:51723/", pretendToBeVisual: true, runScripts: "outside-only" },
);
const { window } = dom;
const { document } = window;

let captured = null;
window.__ModuleLoader__ = {
  load({ id, factory }) {
    assert.equal(id, "@daily-vibe/dsh-client-wukong-intensity-skin", "module id must match package");
    captured = factory((name) => {
      if (name === "react") return reactStub;
      if (name === "react/jsx-runtime") return jsxRuntimeStub;
      if (name === "@deepseek-ai/dsh-client-ui-primitives") return primitivesStub;
      throw new Error(`unexpected require(${JSON.stringify(name)})`);
    });
  },
};

new window.Function("window", "document", "localStorage", source)(
  window,
  document,
  window.localStorage,
);

assert.ok(captured !== null, "the bundle did not call __ModuleLoader__.load");
assert.equal(typeof captured.apply, "function", "the client module must export apply");

// ---- fake cordis context --------------------------------------------------
const effects = [];
const themeCalls = [];
const locales = [];
const slots = [];
const ctx = {
  effect(fn, label) {
    const dispose = fn();
    effects.push({ label, dispose });
    return () => {};
  },
  get(name) {
    assert.equal(name, "theme");
    return {
      getTheme: () => ({ preference: "light" }),
      setTheme: (id) => themeCalls.push(id),
    };
  },
  locale: { register: (namespace, table) => { locales.push({ namespace, table }); return () => {}; } },
  slots: {
    inject: (name, fn) => { fn(); },
    register: (options, component) => { slots.push({ options, component }); return () => {}; },
  },
  sessions: { subagentAddress: () => undefined },
  modelDirectories: { directoryFor: () => ({
    store: { subscribe: () => () => {}, getSnapshot: () => ({ current: null, groups: [], status: "ready" }) },
    load: async () => {},
    select: async () => ({ ok: true }),
  }) },
};

const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}\n       ${error.message}`);
  }
}

console.log("activation");
const client = captured.apply(ctx);

check("injects the services the slot handlers need", () => {
  // The bundle runs in the jsdom realm, so its arrays carry that realm's
  // Array.prototype; copy into this one before a strict deep compare.
  assert.deepEqual([...captured.inject], ["slots", "sessions", "modelDirectories", "locale", "theme"]);
});

check("a scoped style element reaches the head", () => {
  const style = document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`);
  assert.ok(style !== null, "no style element");
  assert.ok(style.textContent.includes(".wk-skin-backdrop"), "stylesheet body is missing");
  assert.ok(style.textContent.includes('[data-wk-stage="5"]'), "dark rule set is missing");
});

check("the skin turns itself on by default", () => {
  assert.equal(document.body.dataset.wkSkin, "on");
});

check("the backdrop mounts behind content", () => {
  const backdrop = document.body.querySelector(`.wk-skin-backdrop[data-plugin="${PACKAGE_ID}"]`);
  assert.ok(backdrop !== null, "no backdrop");
  assert.equal(backdrop.getAttribute("aria-hidden"), "true");
  assert.equal(document.body.firstElementChild, backdrop, "backdrop must be the first body child");
});

check("the initial frame is the top of the ladder, so the shell is dark", () => {
  assert.equal(document.body.dataset.wkStage, "5");
  assert.equal(document.body.style.getPropertyValue("--wk-strength"), "1");
});

check("the document tokens are all written", () => {
  const missing = [
    "--wk-page", "--wk-bg-base", "--wk-layer-1", "--wk-layer-2", "--wk-layer-3",
    "--wk-sidebar", "--wk-ink", "--wk-secondary", "--wk-tertiary", "--wk-border",
    "--wk-accent", "--wk-accent-hover", "--wk-hover", "--wk-portrait-opacity",
  ].filter((name) => document.body.style.getPropertyValue(name) === "");
  assert.deepEqual(missing, []);
});

check("the native theme is driven to dark for the top frame", () => {
  assert.deepEqual(themeCalls, ["dark"]);
});

check("the appearance button joins the native cube row", () => {
  const row = document.querySelector('[class*="_cubeRow"]');
  const custom = row.querySelector(".wk-appearance-choice");
  assert.ok(custom !== null, "no appearance button");
  assert.equal(custom.getAttribute("aria-pressed"), "true");
  assert.ok(custom.textContent.includes("滑动变佛"), `unexpected label: ${custom.textContent}`);
  assert.equal(custom.querySelector(".wk-appearance-choice__icon").textContent, "☯");
  assert.equal(row.children.length, 4, "the three native cubes must survive");
});

check("every slot registered with a distinct id", () => {
  const names = slots.map((slot) => slot.options.name).sort();
  assert.deepEqual(names, [
    "conversation.input.right",
    "settings.general.item",
  ]);
  assert.deepEqual(slots.map((slot) => slot.options.id).sort(), [
    "wukong-effort-binding",
    "wukong-intensity-control",
  ]);
  for (const slot of slots) {
    assert.equal(typeof slot.component, "function", `${slot.options.id} has no component`);
  }
});

check("the settings row is localized", () => {
  assert.equal(locales.length, 1);
  assert.equal(locales[0].namespace, "wukong.skin");
  assert.equal(locales[0].table.zh["effort.binding"], "滑动变佛绑定思考等级");
});

console.log("");
console.log("teardown");
// Clicking a native appearance choice must take the skin down for this
// activation, and the custom button must be able to bring it back.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const nativeDark = document.querySelectorAll(".v01cdW_themeCube")[1];
nativeDark.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await settle();

check("a native theme choice disables the skin", () => {
  assert.equal(document.body.dataset.wkSkin, undefined);
  assert.equal(document.body.querySelector(".wk-skin-backdrop"), null);
  assert.equal(document.body.style.getPropertyValue("--wk-page"), "");
  assert.equal(
    document.querySelector(".wk-appearance-choice").getAttribute("aria-pressed"),
    "false",
  );
});

const custom = document.querySelector(".wk-appearance-choice");
custom.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await settle();

check("the custom button restores the skin", () => {
  assert.equal(document.body.dataset.wkSkin, "on");
  assert.ok(document.body.querySelector(".wk-skin-backdrop") !== null);
  assert.equal(
    document.querySelector(".wk-appearance-choice").getAttribute("aria-pressed"),
    "true",
  );
});

check("dispose removes every trace", () => {
  // Effects run in reverse order in cordis; the LIFO order here matches it.
  for (const { dispose } of [...effects].reverse()) {
    if (typeof dispose === "function") dispose();
  }
  assert.equal(document.head.querySelector("style[data-plugin]"), null, "style survived");
  assert.equal(document.body.querySelector(".wk-skin-backdrop"), null, "backdrop survived");
  assert.equal(document.querySelector(".wk-appearance-choice"), null, "appearance button survived");
  assert.equal(document.body.dataset.wkSkin, undefined, "body attribute survived");
  assert.equal(document.body.dataset.wkStage, undefined, "stage attribute survived");
  assert.equal(document.body.style.getPropertyValue("--wk-page"), "", "tokens survived");
  assert.equal(document.querySelectorAll(".v01cdW_themeCube").length, 3, "native cubes were damaged");
  void client;
});

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
