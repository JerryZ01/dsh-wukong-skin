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
// 朗读替身：记录每个 Audio 的播放。朗读现在播的是预生成 wav，
// 所以打桩的对象是 Audio，不再是 speechSynthesis。
const spoken = [];
window.Audio = class {
  constructor() {
    this.src = "";
    this.preload = "";
    this.currentTime = 0;
    this.paused = true;
    this.__playCount = 0;
    this.__pauseCount = 0;
    spoken.push(this);
  }
  play() {
    this.__playCount += 1;
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.__pauseCount += 1;
    this.paused = true;
  }
  addEventListener() {}
};
Object.defineProperty(globalThis, "Audio", {
  configurable: true,
  writable: true,
  value: window.Audio,
});

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

// voice.js 通过 globalThis.Audio 造播放器；window 已经装到 globalThis 上，
// 这里确认那条路径能通，而不是默默拿到 undefined。
if (typeof globalThis.Audio !== "function") {
  throw new Error("Audio stub is not reachable through globalThis");
}

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
};
const injected = sliderSlot.options.inject("session-1");
props.presenter = injected.presenter;
props.scope = injected.scope;
// 朗读开关：默认打开。真实 scope 由设置项驱动，这里直接覆盖读取路径。
// 注意 props.scope === injected.scope，先存原函数，否则会无限递归。
// useSyncExternalStore 要求快照按身份比较，所以只在 speak 变化时重建对象。
const speakEnabled = { value: true };
const baseGetSnapshot = injected.scope.getSnapshot;
let cachedSpeak = speakEnabled.value;
let cachedSnapshot = { ...baseGetSnapshot(), speak: cachedSpeak };
props.scope.getSnapshot = () => {
  const base = baseGetSnapshot();
  if (cachedSpeak !== speakEnabled.value || cachedSnapshot.bindEffort !== base.bindEffort || cachedSnapshot.enabled !== base.enabled) {
    cachedSpeak = speakEnabled.value;
    cachedSnapshot = { ...base, speak: cachedSpeak };
  }
  return cachedSnapshot;
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

// 朗读现在播预生成 wav：只有 __playCount > 0 的才算"念过"。
// preload 会让六个 Audio 都建出来，但都不出声。
const playedFiles = () => spoken.filter((a) => a.__playCount > 0).map((a) => a.src);

check("a line is always on screen", () => {
  const line = lineNode();
  assert.ok(line !== null, "no line rendered");
  // 顶档是斗战胜祖，念第四句。
  assert.equal(line.querySelector(".wk-effort-control__line-text").textContent, "俺上天看看路径，日后好带你们上去同住。");
  assert.equal(line.querySelector(".wk-effort-control__line-source").textContent, "称王后");
});

check("the line is polite to screen readers", () => {
  assert.equal(lineNode().getAttribute("aria-live"), "polite");
});

check("mounting preloads the four clips but plays none", () => {
  assert.equal(spoken.length, 4, "all four clips should be preloaded");
  assert.deepEqual(playedFiles(), [], "nothing may play on mount");
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
    "俺老孙来也！",
  );
  assert.equal(lineNode().querySelector(".wk-effort-control__line-source").textContent, "自报登场");
});

check("crossing down to 石猴 plays rank 0's clip", () => {
  // 从 frame 240（斗战胜祖）拖到 30 再吸附到 0：跨到石猴。
  assert.deepEqual(playedFiles(), ["/voice/line-0.wav"]);
});

check("staying inside one rank does not replay the clip", () => {
  const count = playedFiles().filter((src) => src === "/voice/line-0.wav").length;
  assert.equal(count, 1, `rank 0 was played ${count} times`);
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
    "俺上天看看路径，日后好带你们上去同住。",
  );
});

// 现在从头往上走一遍，逐级检查跨果位时放的是哪一段。
// 注意不能清空 spoken：组件里的 Audio 实例是复用的，清空数组只是让
// 后续播放"看不见"，并不会真的重建播放器。改用打点快照。
const sweepStart = spoken.map((audio) => audio.__playCount);
const playedSince = (baseline) =>
  spoken
    .map((audio, index) => ({ audio, delta: audio.__playCount - (baseline[index] ?? 0) }))
    .filter((entry) => entry.delta > 0)
    .map((entry) => entry.audio.src);

for (const frame of [0, 48, 96, 144, 192, 240]) {
  await act(async () => {
    setRangeValue(range(), frame);
    range().dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await flushFrame();
}

check("a full sweep plays the four clips in order", () => {
  // 果位 0..5 对应台词 0,1,1,2,2,3：中间两级各与前一级共用一句。
  assert.deepEqual(playedSince(sweepStart), [
    "/voice/line-0.wav",
    "/voice/line-1.wav",
    "/voice/line-2.wav",
    "/voice/line-3.wav",
  ]);
});

check("a full sweep never replays the same clip", () => {
  const files = playedSince(sweepStart);
  assert.equal(new Set(files).size, files.length, `duplicated clip: ${files.join(" / ")}`);
});

// 关掉朗读开关：正在放的那句必须立刻停，而不是放完才静音。
// 先确保有一段真在播，否则 pause 无从观察。
speakEnabled.value = false;
const playingBeforeMute = spoken.filter((audio) => audio.__playCount > 0);
assert.ok(playingBeforeMute.length > 0, "need at least one played clip before testing mute");
const pauseCountBeforeMute = playingBeforeMute.reduce((n, a) => n + a.__pauseCount, 0);
const playedBeforeMute = playingBeforeMute.map((a) => a.src);
await act(async () => {
  setRangeValue(range(), 0);
  range().dispatchEvent(new window.Event("input", { bubbles: true }));
});
await flushFrame();

check("turning speech off pauses the clip that is playing", () => {
  const pauseCountAfter = playingBeforeMute.reduce((n, a) => n + a.__pauseCount, 0);
  assert.ok(
    pauseCountAfter > pauseCountBeforeMute,
    "muting must pause immediately, not let the clip finish",
  );
});

await act(async () => {
  setRangeValue(range(), 240);
  range().dispatchEvent(new window.Event("input", { bubbles: true }));
});
await flushFrame();
check("with speech off, crossing ranks stays silent", () => {
  const playedAfterMute = spoken.filter(
    (audio) => audio.__playCount > 0 && !playedBeforeMute.includes(audio.src),
  );
  assert.equal(playedAfterMute.length, 0, "nothing new may play while muted");
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
console.log("hook order");

// 回归：readiness 从「模型还没有推理档位」变成「档位就绪」时，组件里的
// hook 数量必须保持一致。曾经 useMemo/useEffect 写在提前 return 之后，
// 于是 reasoning 由 null 变为有值那一刻 React 抛
// "Rendered more hooks than during the previous render"，整个滑块崩掉，
// 朗读 effect 也跟着不挂载。
const emptySnapshot = {
  current: { provider: "deepseek", model: "plain", reasoningEffort: null },
  groups: [{ id: "deepseek", models: [{ id: "plain" }] }],
  status: "ready",
};
const emptyStore = {
  subscribe: () => () => {},
  getSnapshot: () => emptySnapshot,
};
// useSyncExternalStore 按身份比较快照，必须缓存，否则每次 getSnapshot
// 都返回新对象会触发 Maximum update depth exceeded。
const hookScopeSnapshot = { ...injected.scope.getSnapshot(), bindEffort: true, enabled: true, speak: true };
const hookScope = {
  subscribe: () => () => {},
  getSnapshot: () => hookScopeSnapshot,
  setBindEffort: async () => {},
  setSpeak: async () => {},
};

// 同一个 store 实例，先没有推理档位、后有——两次渲染之间 reasoning 由
// null 变成有值，正是触发 hook 数量变化的条件。
let hookHasEfforts = false;
const flippingGroups = [{ id: "deepseek", models: [{ id: "plain", reasoning: { efforts: [{ id: "low", name: "low" }, { id: "high", name: "high" }], defaultEffort: "low" } }] }];
const flipSnapshotNone = {
  current: { provider: "deepseek", model: "plain", reasoningEffort: null },
  groups: [{ id: "deepseek", models: [{ id: "plain" }] }],
  status: "ready",
};
const flipSnapshotSome = {
  current: { provider: "deepseek", model: "plain", reasoningEffort: "low" },
  groups: flippingGroups,
  status: "ready",
};
const flippingStore = {
  subscribe: () => () => {},
  getSnapshot: () => (hookHasEfforts ? flipSnapshotSome : flipSnapshotNone),
};

const hookContainer = document.createElement("div");
document.body.append(hookContainer);
const hookRoot = ReactDOMClient.createRoot(hookContainer);

// 第一次：没有档位 → 组件走到 return null
await act(async () => {
  hookRoot.render(
    React.createElement(Slider, { ...props, directory: flippingStore, scope: hookScope }),
  );
});
// 第二次：档位就绪 → 组件完整渲染，hook 数量必须与上次一致
hookHasEfforts = true;
await act(async () => {
  hookRoot.render(
    React.createElement(Slider, { ...props, directory: flippingStore, scope: hookScope }),
  );
});
await act(async () => { hookRoot.unmount(); });
hookContainer.remove();

check("re-rendering across the no-efforts guard does not break hook order", () => {
  // React 若发现 hook 数量变化会直接抛 "Rendered more hooks than during the
  // previous render"，整段测试进程当场挂掉，能走到这里就说明顺序稳定。
  assert.ok(true);
});

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
