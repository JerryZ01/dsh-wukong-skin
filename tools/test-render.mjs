/**
 * Render test: mounts the plugin's two slot components with real React 19 in
 * jsdom and drives the slider the way a user does.
 *
 * This is the only test that exercises the React half, so it is the one that
 * catches hook-order mistakes, wrong prop names, and a slider that previews but
 * never commits.
 *
 *   $env:REACT_PATH='<dir with react + react-dom installed>'
 *   node tools/test-render.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const reactRoot = process.env.REACT_PATH ?? fileURLToPath(new URL("..", import.meta.url));
const requireFromReact = createRequire(`${reactRoot.replace(/[\\/]$/, "")}/`);
let JSDOM;
try {
  ({ JSDOM } = requireFromReact("jsdom"));
} catch {
  console.error("jsdom is missing. Run `npm install`, or set REACT_PATH to a directory that has jsdom + react + react-dom.");
  process.exit(1);
}

const PACKAGE_ID = "dsh-client-wukong-intensity-skin";
const source = readFileSync(fileURLToPath(new URL("../lib/client.js", import.meta.url)), "utf8");

// ---- DOM --------------------------------------------------------------
const dom = new JSDOM("<!doctype html><html lang=\"zh-CN\"><body><div id=\"root\"></div></body></html>", {
  url: "http://127.0.0.1:51723/",
  pretendToBeVisual: true,
  runScripts: "outside-only",
});
const { window } = dom;
const { document } = window;

// React and the bundle must share one document/window pair. Node 24 defines
// `navigator` and friends as getter-only globals, so each one is installed with
// defineProperty and skipped when the global is genuinely read-only.
//
// This block MUST run before react-dom is required: it decides `canUseDOM` once
// at module init, and with no global `window` it silently disables every event
// plugin - which is what turns a working slider into a dead one under test.
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLDivElement", "Element", "Node", "Image", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame", "localStorage", "getComputedStyle", "Event", "MouseEvent", "KeyboardEvent", "InputEvent"]) {
  try {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: window[key],
    });
  } catch {
    // Already present and locked down; the existing global works.
  }
}

// jsdom exposes no `oninput` property, so React's feature detection concludes
// `input` events are unsupported and installs its IE polyfill, which dereferences
// a detached fiber when the node re-renders mid-dispatch. Chromium does expose
// `oninput`, so declaring it keeps React on the path production actually takes.
Object.defineProperty(window.HTMLDivElement.prototype, "oninput", {
  configurable: true,
  get() { return function oninput() {}; },
  set() {},
});

// React 19's scheduler needs MessageChannel, which must come from Node.
globalThis.MessageChannel = createRequire(import.meta.url)("node:worker_threads").MessageChannel;

const React = requireFromReact("react");
const ReactDOMClient = requireFromReact("react-dom/client");
const { act } = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Cross-realm structural compare: the bundle builds its objects inside the
// jsdom realm, so their prototypes never match this realm's Object.prototype
// and assert.deepStrictEqual would reject equal data.
const plain = (value) => JSON.parse(JSON.stringify(value));

// ---- load the bundle --------------------------------------------------
const Switch = (props) => React.createElement("input", {
  type: "checkbox",
  checked: props.checked,
  disabled: props.disabled,
  onChange: (event) => props.onChange?.(event.currentTarget.checked),
});
let captured = null;
window.__ModuleLoader__ = {
  load({ id, factory }) {
    assert.equal(id, "@daily-vibe/dsh-client-wukong-intensity-skin");
    captured = factory((name) => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return requireFromReact("react/jsx-runtime");
      if (name === "@deepseek-ai/dsh-client-ui-primitives") return { Switch };
      throw new Error(`unexpected require(${JSON.stringify(name)})`);
    });
  },
};
new window.Function("window", "document", "localStorage", source)(
  window,
  document,
  window.localStorage,
);

// ---- fake host --------------------------------------------------------
const slots = [];
const effects = [];
const ctx = {
  effect(fn, label) {
    const dispose = fn();
    effects.push({ label, dispose });
    return () => {};
  },
  get: () => ({ getTheme: () => ({ preference: "dark" }), setTheme: () => {} }),
  locale: { register: () => () => {} },
  slots: {
    inject: (name, fn) => { fn(); },
    register: (options, component) => {
      slots.push({ options, component });
      return () => {};
    },
  },
  sessions: { subagentAddress: () => undefined },
  modelDirectories: { directoryFor: () => ({}) },
};
captured.apply(ctx);

const sliderSlot = slots.find((slot) => slot.options.name === "conversation.input.right");
const bindingSlot = slots.find((slot) => slot.options.name === "settings.general.item");
assert.ok(sliderSlot && bindingSlot, "both slots must register");
const Slider = sliderSlot.component;
const Binding = bindingSlot.component;

// A directory store double: two reasoning efforts, high selected. It is mutable
// on purpose - the component re-reads the committed effort after every select,
// and a frozen snapshot would leave it re-syncing to the stale value forever.
const efforts = [
  { id: "low", name: "快速" },
  { id: "high", name: "深度" },
];
const groups = [{ id: "deepseek", models: [{ id: "reasoner", reasoning: { efforts, defaultEffort: "low" } }] }];
let current = { provider: "deepseek", model: "reasoner", reasoningEffort: "high" };
let snapshot = { current, groups, status: "ready" };
const listeners = new Set();
const store = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  // useSyncExternalStore compares snapshots by identity, so every change has to
  // publish a new object.
  getSnapshot: () => snapshot,
  publish(next) {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener();
  },
};
const selectCalls = [];
const props = {
  directory: store,
  presenter: null,
  scope: null,
  load: () => {},
  select: async (next) => {
    selectCalls.push(next);
    current = next;
    store.publish({ current });
    return true;
  },
};const injected = sliderSlot.options.inject("session-1");
props.presenter = injected.presenter;
props.scope = injected.scope;

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

const container = document.createElement("div");
document.body.append(container);
const root = ReactDOMClient.createRoot(container);
const render = async (element) => {
  await act(async () => { root.render(element); });
};
// The presenter applies frames on requestAnimationFrame, so a style assertion
// has to wait one frame - and the wait belongs inside act().
const flushFrame = async () => {
  await act(async () => {
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  });
};
// React tracks an input's value through an own property on the node; a plain
// `node.value = x` update is swallowed as "unchanged". Going through the
// prototype setter is the supported way to make React see the change.
const setRangeValue = (node, value) => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
    .set.call(node, String(value));
};

console.log("effort slider");
await render(React.createElement(Slider, props));

const range = () => container.querySelector("input.wk-effort-control__range");
const ticks = () => [...container.querySelectorAll(".wk-effort-control__tick")];

check("renders one range input and one tick per effort", () => {
  assert.ok(range() !== null, "no range input");
  assert.equal(range().max, "240");
  assert.equal(ticks().length, 2);
});

check("ticks sit at the effort stops", () => {
  const left = ticks().map((tick) => tick.style.left);
  assert.deepEqual(left, ["0%", "100%"]);
});

check("the thumb reflects the committed high effort", () => {
  assert.equal(range().value, "240");
});

check("the tooltip is hidden until the user interacts", () => {
  assert.equal(container.querySelector(".wk-effort-control__tooltip"), null);
});

const lineNode = () => container.querySelector(".wk-effort-control__line");

check("a line from the source text is always on screen", () => {
  const line = lineNode();
  assert.ok(line !== null, "no line rendered");
  assert.equal(line.querySelector(".wk-effort-control__line-text").textContent, "趁早儿念个松箍儿咒，脱下来，打得粉碎。");
  assert.equal(line.querySelector(".wk-effort-control__line-source").textContent, "第一百回");
});

check("the line is polite to screen readers", () => {
  assert.equal(lineNode().getAttribute("aria-live"), "polite");
});

await act(async () => {
  range().dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
});
check("pressing the thumb reveals the preview tooltip", () => {
  const tooltip = container.querySelector(".wk-effort-control__tooltip");
  assert.ok(tooltip !== null, "tooltip did not appear");
  assert.equal(tooltip.textContent, "斗战胜祖 · 深度");
});

check("the control marks itself as interacting so the line can fade back", () => {
  assert.equal(container.querySelector(".wk-effort-control").dataset.interacting, "true");
});

await act(async () => {
  setRangeValue(range(), 30);
  range().dispatchEvent(new window.Event("input", { bubbles: true }));
});
await flushFrame();
check("dragging previews continuously without committing", () => {
  assert.equal(props.presenter.getFrame(), 30);
  assert.equal(selectCalls.length, 0, "a drag must never commit mid-gesture");
  assert.equal(document.body.style.getPropertyValue("--wk-strength"), String(30 / 240));
});

await act(async () => {
  range().dispatchEvent(new window.MouseEvent("pointerup", { bubbles: true }));
});
await flushFrame();
check("releasing snaps to the nearest effort and commits it", () => {
  assert.equal(props.presenter.getFrame(), 0, "the preview must snap to the low stop");
  assert.deepEqual(plain(selectCalls), [{ provider: "deepseek", model: "reasoner", reasoningEffort: "low" }]);
});

check("the line follows the thumb down to the first rank", () => {
  assert.equal(
    lineNode().querySelector(".wk-effort-control__line-text").textContent,
    "将来年老血衰，暗中有阎王老子管着。",
  );
  assert.equal(lineNode().querySelector(".wk-effort-control__line-source").textContent, "第一回");
});

await act(async () => {
  setRangeValue(range(), 200);
  range().dispatchEvent(new window.Event("input", { bubbles: true }));
  range().dispatchEvent(new window.KeyboardEvent("keyup", { bubbles: true, key: "ArrowRight" }));
});
await flushFrame();
check("a keyboard change also commits on key release", () => {
  assert.equal(props.presenter.getFrame(), 240);
  assert.equal(selectCalls.length, 2);
  assert.equal(selectCalls[1].reasoningEffort, "high");
});

check("the line returns to the last rank after the keyboard jump", () => {
  assert.equal(
    lineNode().querySelector(".wk-effort-control__line-text").textContent,
    "趁早儿念个松箍儿咒，脱下来，打得粉碎。",
  );
});

console.log("");
console.log("bind toggle");
await render(React.createElement(Binding, { ...bindingSlot.options.inject(), t: (key) => key }));
const toggle = () => container.querySelector(".wk-appearance-binding input[type=checkbox]");

check("the settings row renders a switch", () => {
  assert.ok(toggle() !== null, "no switch");
  assert.equal(toggle().checked, true);
});

await act(async () => {
  toggle().dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
});
check("turning the binding off flips the switch", () => {
  assert.equal(toggle().checked, false);
  assert.equal(window.localStorage.getItem("dsh-wukong-intensity-skin.bind-effort"), "0");
});

await render(React.createElement(Slider, { ...props }));
check("an unbound slider stays visible as a pure appearance control", () => {
  assert.ok(range() !== null, "the slider must remain usable without the binding");
});

await act(async () => {
  setRangeValue(range(), 240);
  range().dispatchEvent(new window.Event("input", { bubbles: true }));
  range().dispatchEvent(new window.MouseEvent("pointerup", { bubbles: true }));
});
await flushFrame();
check("an unbound slider never touches the model", () => {
  assert.equal(props.presenter.getFrame(), 240);
  assert.equal(selectCalls.length, 2, "no third commit may be issued");
});

await act(async () => { root.unmount(); });
for (const { dispose } of [...effects].reverse()) {
  if (typeof dispose === "function") dispose();
}
check("unmount and dispose leave no DOM behind", () => {
  assert.equal(document.body.querySelector(".wk-effort-control"), null);
  assert.equal(document.body.querySelector(".wk-skin-backdrop"), null);
  assert.equal(document.querySelector(".wk-appearance-choice"), null);
  assert.equal(container.innerHTML, "");
});

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
