window.__ModuleLoader__.load({id:"@daily-vibe/dsh-client-wukong-intensity-skin",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/skin.css
var skin_default = `.wk-skin-backdrop {
  position: fixed;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: var(--wk-page, transparent);
  opacity: 0;
  transition: opacity 220ms ease, background-color 180ms linear;
}

body[data-wk-skin="on"] .wk-skin-backdrop {
  opacity: 1;
}

.wk-skin-backdrop img {
  position: absolute;
  top: 50%;
  right: 0;
  display: block;
  width: min(42vw, 720px);
  height: 100%;
  object-fit: cover;
  object-position: 50% 42%;
  opacity: var(--wk-portrait-opacity, 0.45);
  transform: translateY(-50%);
  filter: none;
  mask-image: linear-gradient(90deg, transparent 0%, rgb(0 0 0 / 20%) 10%, black 30%, black 100%);
  transition: filter 180ms linear;
}

.wk-skin-backdrop img {
  display: none;
}

.wk-skin-backdrop[data-media="sequence"] .wk-skin-sequence-frame {
  display: block;
  opacity: var(--wk-portrait-opacity, 0.82);
}

.wk-skin-backdrop[data-media="color"] img {
  display: none;
}

body[data-wk-skin="on"] {
  /* Keep the backdrop above the canvas but below content and native portals.
     The host owns root positioning, dimensions, and its own stacking order. */
  isolation: isolate;
  --dsw-alias-bg-base: transparent !important;
  --dsw-alias-bg-layer-1: var(--wk-layer-1) !important;
  --dsw-alias-bg-layer-2: var(--wk-layer-2) !important;
  --dsw-alias-bg-layer-3: var(--wk-layer-3) !important;
  --dsw-specific-sidebar-fill: var(--wk-sidebar) !important;
  --dsw-alias-label-primary: var(--wk-ink) !important;
  --dsw-alias-label-primary-dimmed: var(--wk-ink) !important;
  --dsw-alias-label-secondary: var(--wk-secondary) !important;
  --dsw-alias-label-tertiary: var(--wk-tertiary) !important;
  --dsw-alias-label-caption: var(--wk-tertiary) !important;
  --dsw-alias-border-l1: var(--wk-border) !important;
  --dsw-alias-border-l2-darkmode-thin: var(--wk-border) !important;
  --dsw-alias-border-l2: var(--wk-border) !important;
  --dsw-alias-border-l3: var(--wk-border) !important;
  --dsw-alias-button-primary-fill: var(--wk-accent) !important;
  --dsw-alias-button-primary-hover: var(--wk-accent-hover) !important;
  --dsw-alias-button-info-fill: var(--wk-accent) !important;
  --dsw-alias-button-info-hover: var(--wk-accent-hover) !important;
  --dsw-alias-state-business-primary: var(--wk-accent) !important;
  --dsw-alias-interactive-bg-hover: var(--wk-hover) !important;
  --dsw-alias-interactive-bg-active: var(--wk-hover) !important;
  --dsw-alias-button-elevated-fill: var(--wk-layer-1) !important;
  --dsw-alias-button-floating-fill: var(--wk-layer-2) !important;
  --dsw-alias-button-floating-hover: var(--wk-layer-3) !important;
  --dsw-alias-interactive-bg-hover-solid: var(--wk-layer-2) !important;
  --dsw-specific-bubble: var(--wk-layer-2) !important;
  --dsw-specific-input-major: var(--wk-layer-1) !important;
  --dsw-specific-menu: var(--wk-layer-3) !important;
  --dsw-specific-selector: var(--wk-layer-2) !important;
  --dsw-alias-markdown-citation: var(--wk-layer-2) !important;
  --dsw-alias-markdown-code-block-banner: var(--wk-layer-1) !important;
  --dsw-alias-markdown-code-block: var(--wk-layer-1) !important;
  --dsw-alias-markdown-code-segment-selected: var(--wk-layer-2) !important;
  --dsw-alias-markdown-code-segment-unselected: var(--wk-layer-1) !important;
  --dsw-alias-markdown-inline-code: var(--wk-layer-2) !important;
  --dsw-alias-markdown-placeholder: var(--wk-layer-1) !important;
  --dsw-alias-markdown-tag: var(--wk-layer-2) !important;
  background: var(--wk-page) !important;
}

body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) {
  --dsw-alias-brand-primary-new-colorprimary-new-color: rgb(65 118 230) !important;
  --dsw-alias-brand-primary: rgb(15 17 21) !important;
  --dsw-alias-brand-text: rgb(15 17 21) !important;
  --dsw-alias-button-primary-fill: rgb(15 17 21) !important;
  --dsw-alias-button-primary-hover: rgb(53 54 56) !important;
  --dsw-alias-button-info-fill: rgb(65 118 230) !important;
  --dsw-alias-button-info-hover: rgb(103 158 254) !important;
  --dsw-alias-state-business-primary: rgb(65 118 230) !important;
  --dsw-alias-label-primary-inverted: rgb(249 250 251) !important;
  --dsw-alias-button-elevated-fill: rgb(255 255 255) !important;
  --dsw-alias-button-floating-fill: rgb(255 255 255) !important;
  --dsw-alias-button-floating-hover: rgb(241 243 245) !important;
  --dsw-alias-interactive-bg-hover-solid: rgb(241 243 245) !important;
  --dsw-specific-bubble: rgb(237 243 254) !important;
  --dsw-specific-input-major: rgb(255 255 255) !important;
  --dsw-specific-menu: rgb(255 255 255) !important;
  --dsw-specific-selector: rgb(245 246 247) !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] {
  --dsw-alias-brand-primary-new-colorprimary-new-color: #c8a03c !important;
  --dsw-alias-brand-primary: #c8a03c !important;
  --dsw-alias-brand-text: #e0bb63 !important;
  --dsw-alias-button-info-fill: #c8a03c !important;
  --dsw-alias-button-info-hover: #e0bb63 !important;
  --dsw-alias-state-business-primary: #c8a03c !important;
  --dsw-alias-bg-module-platform: var(--wk-layer-3) !important;
  --dsw-specific-sidebar-nav-item-active: var(--wk-layer-3) !important;
  --dsw-specific-sidebar-nav-item-hover: var(--wk-hover) !important;
}

/* The host renders the running-turn label as a clipped blue text gradient.
   Retarget only that gradient's color tokens in the custom dark skin; keep
   the host's text clipping and shimmer behavior, and leave light mode alone. */
body[data-wk-skin="on"][data-wk-stage="5"] [class*="_turnStatus"] {
  --dsw-static-deepseek-500: #c8a03c !important;
  --dsw-static-deepseek-200: #e0bb63 !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] [class*="_turnStatusClock"] {
  color: #c8a03c !important;
  -webkit-text-fill-color: #c8a03c !important;
}

/* Preserve the wordmark badge contrast in the low-intensity shell. */
body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) button[aria-label="\u65B0\u5EFA\u4F1A\u8BDD"] svg[viewBox="0 0 182 24"] > rect[width="52"] {
  fill: rgb(15 17 21) !important;
}

body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) button[aria-label="\u65B0\u5EFA\u4F1A\u8BDD"] svg[viewBox="0 0 182 24"] > g[clip-path*="badge"] path {
  fill: rgb(249 250 251) !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] button[aria-label="\u65B0\u5EFA\u4F1A\u8BDD"] svg[viewBox="0 0 182 24"] > rect[width="52"] {
  fill: #c8a03c !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] button[aria-label="\u65B0\u5EFA\u4F1A\u8BDD"] svg[viewBox="0 0 182 24"] > g[clip-path*="badge"] path {
  fill: #171310 !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] [aria-label^="\u9009\u62E9\u6A21\u578B"] > span:nth-of-type(2) {
  color: #e0bb63 !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] [class*="heroGlow"] ellipse {
  fill: #c8a03c !important;
  fill-opacity: 0.16 !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] span[class*="_previewBadge"] {
  color: #171310 !important;
  background: #c8a03c !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] button[aria-label="\u53D1\u9001\u6D88\u606F"] {
  color: #171310 !important;
}

body[data-wk-skin="on"][data-wk-stage="5"] button[aria-label="\u53D1\u9001\u6D88\u606F"]:disabled {
  opacity: 0.62;
}

body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) button[aria-label="\u53D1\u9001\u6D88\u606F"] {
  color: #fff !important;
}

body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) button[aria-label="\u53D1\u9001\u6D88\u606F"]:disabled {
  color: rgb(255 255 255 / 92%) !important;
  background: rgb(65 118 230 / 42%) !important;
  opacity: 1;
}

body[data-wk-skin="on"] > #root {
  background: transparent !important;
}

body[data-wk-skin="on"]:is(
  [data-dsh-desktop-mode="compatibility"],
  [data-dsh-desktop-mode="extended"]
) .wk-skin-backdrop {
  top: var(--dsh-desktop-frame-height, 0px);
}

/* Native account pages are full-screen body portals. Their header and loading
   surface must stay opaque when the chat background token is transparent. */
body[data-wk-skin="on"] > [role="dialog"][aria-modal="true"][class*="_overlay"]:has(> header[data-window-drag] button[class*="_back"]):has(> [class*="_viewport"]) {
  --dsw-alias-bg-base: var(--wk-page, #fff) !important;
  background: var(--wk-page, #fff) !important;
}

/* Windows paints the sidebar fill across the host frame, covering the portrait.
   Match macOS's transparent frame while keeping the sidebar, caption, and
   conversation surfaces painted by their own host rules. */
html[data-windows-titlebar] body[data-wk-skin="on"] #root [class*="_frame"]:has(> [class*="_centerCol"]) {
  background: transparent !important;
}

/* macOS adds different translucent sidebar materials for native light/dark.
   While Wukong is active, the effort palette owns the sidebar fill. */
html[data-platform="darwin"] body[data-wk-skin="on"] #root [class*="_frame"]:has(> [class*="_centerCol"]) > [class*="_sidebarCol"] {
  background: var(--wk-sidebar) !important;
}

/* Keep the host's expanded new-session surface on the same palette. The
   collapsed icon keeps its native transparent surface and hover behavior. */
html[data-platform="darwin"] body[data-wk-skin="on"] #root [class*="_sidebarCol"] [class*="_root"]:has(> [class*="_logoRow"]):not([class*="_collapsed"]) button[class*="_newSession"] {
  background: var(--dsw-alias-button-elevated-fill) !important;
}

html[data-platform="darwin"] body[data-wk-skin="on"] #root [class*="_sidebarCol"] [class*="_root"]:has(> [class*="_logoRow"]):not([class*="_collapsed"]) button[class*="_newSession"]:hover {
  background: var(--dsw-alias-button-floating-hover) !important;
}

/* The native dark rule also outranks the collapsed icon's transparent fill. */
html[data-platform="darwin"] body[data-wk-skin="on"] #root [class*="_sidebarCol"] [class*="_root"][class*="_collapsed"]:has(> [class*="_logoRow"]) button[class*="_newSession"] {
  background: transparent !important;
}

html[data-platform="darwin"] body[data-wk-skin="on"] #root [class*="_sidebarCol"] [class*="_root"][class*="_collapsed"]:has(> [class*="_logoRow"]) button[class*="_newSession"]:hover {
  background: var(--dsw-alias-interactive-bg-hover) !important;
}

body[data-wk-skin="on"] button,
body[data-wk-skin="on"] input,
body[data-wk-skin="on"] textarea {
  transition: color 160ms linear, background-color 160ms linear, border-color 160ms linear;
}

/* The composer card has a native theme-mode fill, so keep its surface and
   readable ink aligned with the active Wukong palette. */
body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) [data-composer-card="true"] {
  border-color: var(--wk-border) !important;
  color: var(--wk-ink) !important;
  background: var(--wk-layer-1) !important;
  box-shadow: 0 8px 28px rgb(20 22 20 / 8%);
}

body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) [data-composer-card="true"] :is(textarea, button, [data-input-mirror="true"]) {
  color: var(--wk-ink) !important;
  caret-color: var(--wk-accent) !important;
}

body[data-wk-skin="on"]:is(
  [data-wk-stage="0"],
  [data-wk-stage="1"],
  [data-wk-stage="2"],
  [data-wk-stage="3"]
) [data-composer-card="true"] textarea::placeholder {
  color: var(--wk-tertiary) !important;
  opacity: 1;
}

.wk-effort-control {
  --wk-control-accent: var(--dsw-alias-brand-primary-new-colorprimary-new-color, #4176e6);
  --wk-control-rail: var(--dsw-alias-border-l3, rgb(0 0 0 / 16%));
  position: relative;
  display: flex;
  width: 124px;
  height: 28px;
  align-items: center;
  margin: 0 3px;
  overflow: visible;
}

body[data-wk-skin="on"] .wk-effort-control {
  --wk-control-accent: var(--wk-secondary);
  --wk-control-rail: color-mix(in srgb, var(--wk-secondary) 28%, transparent);
}

.wk-effort-control__ticks {
  position: absolute;
  z-index: 0;
  inset: 0 10px;
  pointer-events: none;
}

.wk-effort-control__ticks::before {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 1px;
  content: "";
  background: var(--wk-control-rail);
  transform: translateY(-50%);
}

.wk-effort-control__tooltip {
  position: absolute;
  z-index: 4;
  bottom: calc(100% + 7px);
  left: calc(10px + (100% - 20px) * var(--wk-slider-ratio));
  min-width: max-content;
  padding: 5px 8px;
  border: 1px solid var(--wk-border, rgb(0 0 0 / 12%));
  border-radius: 7px;
  color: var(--wk-ink, #171310);
  background: var(--wk-layer-1, #fff);
  box-shadow: 0 5px 16px rgb(0 0 0 / 16%);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.01em;
  pointer-events: none;
  transform: translateX(-50%);
  white-space: nowrap;
}

.wk-effort-control__tooltip::after {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 7px;
  height: 7px;
  content: "";
  background: inherit;
  transform: translate(-50%, -4px) rotate(45deg);
}

.wk-effort-control__tick {
  position: absolute;
  top: 50%;
  width: 1px;
  height: 7px;
  background: var(--wk-control-accent);
  opacity: 0.42;
  transform: translate(-50%, -50%);
}

.wk-effort-control__range {
  position: relative;
  z-index: 1;
  width: calc(100% - 7px);
  height: 28px;
  margin: 0 3.5px;
  cursor: ew-resize;
  appearance: none;
  background: transparent;
  touch-action: pan-y;
}

.wk-effort-control__range:disabled {
  cursor: progress;
  opacity: 0.58;
}

.wk-effort-control__range::-webkit-slider-runnable-track {
  height: 1px;
  border-radius: 1px;
  background: transparent;
}

.wk-effort-control__range::-webkit-slider-thumb {
  width: 13px;
  height: 13px;
  margin-top: -6px;
  border: 1.5px solid color-mix(in srgb, var(--wk-control-accent) 72%, transparent);
  border-radius: 50%;
  appearance: none;
  background: radial-gradient(circle, var(--wk-control-accent) 0 2px, color-mix(in srgb, var(--wk-control-accent) 22%, var(--dsw-alias-bg-layer-1, #fff)) 2.5px);
  box-shadow: 0 1px 4px rgb(0 0 0 / 14%);
}

body[data-wk-skin="on"] .wk-effort-control__range::-webkit-slider-thumb {
  width: 13px;
  height: 13px;
  margin-top: -6px;
  border-color: color-mix(in srgb, var(--wk-control-accent) 72%, transparent);
  background: radial-gradient(circle, var(--wk-control-accent) 0 2px, color-mix(in srgb, var(--wk-control-accent) 22%, var(--wk-layer-1)) 2.5px);
}

.wk-effort-control__range::-moz-range-track {
  height: 1px;
  background: transparent;
}

.wk-effort-control__range::-moz-range-progress {
  height: 1px;
  background: transparent;
}

.wk-effort-control__range::-moz-range-thumb {
  width: 11px;
  height: 11px;
  border: 1.5px solid color-mix(in srgb, var(--wk-control-accent) 72%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--wk-control-accent) 24%, var(--dsw-alias-bg-layer-1, #fff));
}

.wk-effort-control__range:focus-visible {
  outline: none;
}

.wk-effort-control[data-state="error"] {
  --wk-control-accent: var(--dsw-alias-state-error-primary, #e43c3c);
}

.wk-appearance-choice {
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l2);
  flex: 180px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 20px 32px;
  border-radius: 16px;
  font: inherit;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  background: transparent;
  font-size: 14px;
  line-height: 22px;
  display: flex;
}

[class*="_cubeRow"]:has(.wk-appearance-choice) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.wk-appearance-choice:hover:not([aria-pressed="true"]) {
  background: var(--dsw-alias-interactive-bg-hover);
}

.wk-appearance-choice[aria-pressed="true"] {
  border-color: var(--dsw-static-neutral-bluish-400);
  background: var(--dsw-alias-bg-module-platform);
}

.wk-appearance-choice__icon {
  display: block;
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  color: currentColor;
  font-size: 16px;
  line-height: 16px;
}

.wk-appearance-choice__label {
  display: block;
}

/* Keep the host's three theme cubes untouched. These rules only style the
   fourth button that is appended to the host cube row. */
.wk-appearance-choice:disabled {
  cursor: progress;
  opacity: 0.7;
}

.wk-appearance-binding {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  font-size: 14px;
  line-height: 20px;
}

@media (max-width: 760px) {
  .wk-effort-control {
    width: 92px;
  }

  .wk-skin-backdrop img {
    right: -18vw;
    width: 92vw;
    opacity: calc(var(--wk-portrait-opacity, 0.45) * 0.72);
  }

}

@media (prefers-reduced-motion: reduce) {
  .wk-skin-backdrop,
  .wk-skin-backdrop img,
  body[data-wk-skin="on"] button,
  body[data-wk-skin="on"] input,
  body[data-wk-skin="on"] textarea {
    transition: none;
  }
}
`;

// src/client/appearance.js
var LIANG_APPEARANCE_ROW = '[class*="_cubeRow"]';
var WUKONG_APPEARANCE_BUTTON = "wk-appearance-choice";
function hasClassSuffix(node, suffix) {
  return [...node.classList].some((name) => name.endsWith(suffix));
}
function findAppearanceRow() {
  for (const row of document.querySelectorAll(LIANG_APPEARANCE_ROW)) {
    if (!hasClassSuffix(row, "_cubeRow")) continue;
    const nativeButtons = [...row.children].filter(
      (node) => node instanceof HTMLButtonElement && hasClassSuffix(node, "_themeCube")
    );
    if (nativeButtons.length < 3) continue;
    let group = row.parentElement;
    while (group !== null && !hasClassSuffix(group, "_group")) {
      group = group.parentElement;
    }
    group ??= row.parentElement;
    if (group !== null) return { row, group, nativeButtons };
  }
  return null;
}
function installWukongAppearanceButton(scope, presenter, packageId) {
  let pending = false;
  let disposed = false;
  let mounted = null;
  const nativeClickHandlers = /* @__PURE__ */ new Map();
  const unmount = () => {
    for (const [button, handler] of nativeClickHandlers) {
      button.removeEventListener("click", handler, { capture: true });
    }
    nativeClickHandlers.clear();
    if (mounted === null) return;
    mounted.button.removeEventListener("click", mounted.handleCustomClick);
    mounted.button.remove();
    mounted = null;
  };
  const choose = async (enabled) => {
    if (disposed || pending || scope.getSnapshot().enabled === enabled) return;
    pending = true;
    sync();
    try {
      await presenter.choose(enabled);
    } catch {
    } finally {
      pending = false;
      if (!disposed) sync();
    }
  };
  const createMount = (row, group) => {
    const english = document.documentElement.lang.toLowerCase().startsWith("en");
    const button = document.createElement("button");
    button.className = WUKONG_APPEARANCE_BUTTON;
    button.type = "button";
    button.dataset.plugin = packageId;
    button.setAttribute("aria-label", "\u6ED1\u52A8\u53D8\u4F5B");
    const icon = document.createElement("span");
    icon.className = "wk-appearance-choice__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "\u262F";
    const label = document.createElement("span");
    label.className = "wk-appearance-choice__label";
    label.textContent = english ? "Wukong" : "\u6ED1\u52A8\u53D8\u4F5B";
    button.append(icon, label);
    const handleCustomClick = () => {
      void choose(true);
    };
    button.addEventListener("click", handleCustomClick);
    return { row, group, button, handleCustomClick };
  };
  const sync = () => {
    if (disposed) return;
    const target = findAppearanceRow();
    if (target === null) {
      unmount();
      return;
    }
    if (mounted !== null && (mounted.row !== target.row || mounted.group !== target.group)) {
      unmount();
    }
    mounted ??= createMount(target.row, target.group);
    const { row, button } = mounted;
    if (button.parentElement !== row) row.append(button);
    const snapshot = scope.getSnapshot();
    button.disabled = pending;
    button.setAttribute("aria-pressed", String(snapshot.enabled));
    for (const [nativeButton, handler] of nativeClickHandlers) {
      if (target.nativeButtons.includes(nativeButton)) continue;
      nativeButton.removeEventListener("click", handler, { capture: true });
      nativeClickHandlers.delete(nativeButton);
    }
    for (const nativeButton of target.nativeButtons) {
      if (nativeClickHandlers.has(nativeButton)) continue;
      const handleNativeClick = () => {
        void choose(false);
      };
      nativeClickHandlers.set(nativeButton, handleNativeClick);
      nativeButton.addEventListener("click", handleNativeClick, { capture: true });
    }
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  const unsubscribe = scope.subscribe(sync);
  sync();
  return () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    unsubscribe();
    unmount();
  };
}

// src/client/portrait-loader.js
var RETRY_DELAYS = [500, 1500, 3e3];
function retryUrl(source, retry) {
  if (retry === 0) return source;
  const hashIndex = source.indexOf("#");
  const hash = hashIndex < 0 ? "" : source.slice(hashIndex);
  const base = hashIndex < 0 ? source : source.slice(0, hashIndex);
  const queryIndex = base.indexOf("?");
  const path = queryIndex < 0 ? base : base.slice(0, queryIndex);
  const query = new URLSearchParams(queryIndex < 0 ? "" : base.slice(queryIndex + 1));
  query.set("retry", String(retry));
  return `${path}?${query}${hash}`;
}
function createPortraitLoader(options) {
  const sources = options.sources.map((source) => ({ ...source }));
  const assets = /* @__PURE__ */ new Map();
  for (const { url } of sources) {
    if (!assets.has(url)) {
      assets.set(url, {
        url,
        status: "idle",
        loadedUrl: null,
        retries: 0,
        image: null,
        timer: null,
        detach: null
      });
    }
  }
  const createImage = options.createImage ?? (() => new Image());
  let onChange = options.onChange;
  let active = false;
  let disposed = false;
  let generation = 0;
  let targetLevel = sources[0]?.level ?? 0;
  let displayedIndex = null;
  let lastState = null;
  const isCurrent = (run) => active && !disposed && generation === run;
  const nearestIndex = (available) => {
    let nearest = null;
    for (let index = 0; index < sources.length; index += 1) {
      if (!available(index)) continue;
      const distance = Math.abs(sources[index].level - targetLevel);
      const previous = nearest === null ? Infinity : Math.abs(sources[nearest].level - targetLevel);
      if (nearest === null || distance < previous || distance === previous && sources[index].level > sources[nearest].level) {
        nearest = index;
      }
    }
    return nearest;
  };
  const isReady = (index) => assets.get(sources[index].url)?.status === "ready";
  const emit = (state) => {
    if (lastState?.index === state.index && lastState.url === state.url && lastState.status === state.status) return;
    lastState = state;
    onChange?.(state);
  };
  const reconcile = () => {
    if (!active || disposed) return;
    const target = nearestIndex(() => true);
    if (target !== null && isReady(target)) displayedIndex = target;
    else if (displayedIndex === null) displayedIndex = nearestIndex(isReady);
    if (displayedIndex !== null) {
      const asset = assets.get(sources[displayedIndex].url);
      emit({ index: displayedIndex, url: asset.loadedUrl, image: asset.image, status: "ready" });
    } else {
      const exhausted = [...assets.values()].every((asset) => asset.status === "failed");
      emit({ index: null, url: null, image: null, status: exhausted ? "failed" : "loading" });
    }
  };
  const request = (asset, run) => {
    if (!isCurrent(run)) return;
    asset.status = "loading";
    const image = createImage();
    asset.image = image;
    image.loading = "eager";
    image.decoding = "async";
    const url = retryUrl(asset.url, asset.retries);
    let settled = false;
    let decoding = false;
    const current = () => !settled && isCurrent(run) && asset.image === image;
    const detach = () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      asset.detach = null;
    };
    const handleError = () => {
      if (!current()) return;
      settled = true;
      detach();
      image.removeAttribute("src");
      asset.image = null;
      if (asset.retries < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[asset.retries];
        asset.retries += 1;
        asset.timer = setTimeout(() => {
          if (!isCurrent(run)) return;
          asset.timer = null;
          request(asset, run);
        }, delay);
      } else {
        asset.status = "failed";
        reconcile();
      }
    };
    const handleLoad = () => {
      if (!current() || decoding) return;
      decoding = true;
      void image.decode().then(() => {
        if (!current()) return;
        settled = true;
        detach();
        asset.loadedUrl = url;
        asset.status = "ready";
        reconcile();
      }, handleError);
    };
    asset.detach = detach;
    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    image.src = url;
  };
  const stop = () => {
    active = false;
    generation += 1;
    for (const asset of assets.values()) {
      if (asset.timer !== null) clearTimeout(asset.timer);
      asset.timer = null;
      asset.detach?.();
      asset.image?.removeAttribute("src");
      asset.image = null;
      asset.status = "idle";
      asset.loadedUrl = null;
      asset.retries = 0;
    }
    displayedIndex = null;
    lastState = null;
  };
  return {
    start() {
      if (disposed || active) return;
      active = true;
      const run = ++generation;
      reconcile();
      for (const asset of assets.values()) request(asset, run);
    },
    select(level) {
      if (disposed || !Number.isFinite(level)) return;
      targetLevel = level;
      reconcile();
    },
    stop,
    dispose() {
      stop();
      disposed = true;
      onChange = null;
    }
  };
}

// src/client/logic.js
var PREVIEW_MAX_FRAME = 240;
var MAX_LEVEL = 30;
var RANKS = ["\u77F3\u7334", "\u7F8E\u7334\u738B", "\u9F50\u5929\u5927\u5723", "\u5B59\u884C\u8005", "\u6597\u6218\u80DC\u4F5B", "\u6597\u6218\u80DC\u7956"];
function clampFrame(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(PREVIEW_MAX_FRAME, Math.max(0, Math.round(value)));
}
function frameForEffort(index, count) {
  if (count <= 1 || !Number.isFinite(index)) return 0;
  const safe = Math.min(count - 1, Math.max(0, Math.round(index)));
  return Math.round(safe / (count - 1) * PREVIEW_MAX_FRAME);
}
function nearestEffortIndex(frame, efforts) {
  if (efforts.length === 0) return -1;
  const safe = clampFrame(frame);
  let best = 0;
  let distance = Math.abs(safe - frameForEffort(0, efforts.length));
  for (let index = 1; index < efforts.length; index += 1) {
    const next = Math.abs(safe - frameForEffort(index, efforts.length));
    if (next < distance) {
      best = index;
      distance = next;
    }
  }
  return best;
}
function selectedEffortIndex(efforts, selectedId, defaultId) {
  const id = selectedId ?? defaultId;
  return id === void 0 ? -1 : efforts.findIndex((effort) => effort.id === id);
}
function rankForFrame(rawFrame) {
  const level = clampFrame(rawFrame) / PREVIEW_MAX_FRAME * MAX_LEVEL;
  const index = level >= MAX_LEVEL ? RANKS.length - 1 : Math.floor(level / 6);
  return RANKS[Math.min(RANKS.length - 1, Math.max(0, index))];
}
function indicatorLabel(rawFrame, efforts) {
  const effort = efforts[nearestEffortIndex(rawFrame, efforts)];
  return effort === void 0 ? rankForFrame(rawFrame) : `${rankForFrame(rawFrame)} \xB7 ${effort.name}`;
}
function lerp(a, b, amount) {
  return a + (b - a) * amount;
}
function mix(a, b, amount) {
  return [
    Math.round(lerp(a[0], b[0], amount)),
    Math.round(lerp(a[1], b[1], amount)),
    Math.round(lerp(a[2], b[2], amount))
  ];
}
function rgb(value, alpha = 1) {
  return alpha === 1 ? `rgb(${value[0]} ${value[1]} ${value[2]})` : `rgb(${value[0]} ${value[1]} ${value[2]} / ${alpha})`;
}
var STOPS = [
  { at: 0, page: [236, 234, 228], surface: [250, 249, 245], surface2: [241, 239, 233], ink: [24, 22, 20], secondary: [116, 110, 102], accent: [192, 57, 43], portraitOpacity: 0.9 },
  { at: 6, page: [222, 214, 199], surface: [244, 240, 231], surface2: [232, 226, 214], ink: [27, 24, 20], secondary: [104, 96, 86], accent: [190, 60, 45], portraitOpacity: 0.92 },
  { at: 12, page: [196, 178, 148], surface: [222, 210, 188], surface2: [206, 192, 168], ink: [30, 26, 20], secondary: [88, 80, 68], accent: [184, 64, 46], portraitOpacity: 0.93 },
  { at: 18, page: [140, 116, 86], surface: [172, 150, 120], surface2: [152, 130, 102], ink: [26, 22, 18], secondary: [70, 62, 52], accent: [176, 74, 48], portraitOpacity: 0.94 },
  { at: 24, page: [46, 38, 32], surface: [54, 45, 38], surface2: [66, 55, 45], ink: [246, 238, 224], secondary: [190, 178, 158], accent: [200, 140, 54], portraitOpacity: 0.94 },
  { at: 30, page: [18, 16, 14], surface: [32, 28, 24], surface2: [44, 38, 32], ink: [248, 240, 226], secondary: [198, 186, 164], accent: [200, 160, 60], portraitOpacity: 0.94 }
];
var LIGHT_ACCENT = [192, 57, 43];
function paletteForFrame(rawFrame) {
  const frame = clampFrame(rawFrame);
  const level = frame / PREVIEW_MAX_FRAME * MAX_LEVEL;
  const portraitStage = Math.min(5, Math.floor(level / 6));
  const from = STOPS[portraitStage];
  const to = STOPS[Math.min(5, portraitStage + 1)];
  const amount = from === to ? 0 : (level - from.at) / (to.at - from.at);
  const dark = level >= 24;
  const stage = dark ? 5 : 0;
  const ui = dark ? STOPS[5] : STOPS[0];
  const page = ui.page;
  const surface = ui.surface;
  const surface2 = ui.surface2;
  const sidebar = mix(page, surface2, 0.25);
  const ink = ui.ink;
  const secondary = ui.secondary;
  const accent = dark ? [200, 160, 60] : LIGHT_ACCENT;
  const accentHover = mix(accent, ink, 0.13);
  return {
    level,
    stage,
    strength: level / MAX_LEVEL,
    page: rgb(page),
    base: rgb(page, dark ? 0.42 : 0.28),
    layer1: rgb(surface, 0.94),
    layer2: rgb(surface2, 0.96),
    layer3: rgb(surface2, 0.99),
    sidebar: rgb(sidebar, 0.96),
    ink: rgb(ink),
    secondary: rgb(secondary),
    tertiary: rgb(mix(secondary, page, 0.28)),
    border: rgb(ink, dark ? 0.15 : 0.12),
    accent: rgb(accent),
    accentHover: rgb(accentHover),
    hover: rgb(ink, dark ? 0.09 : 0.07),
    portraitOpacity: String(lerp(from.portraitOpacity, to.portraitOpacity, amount))
  };
}

// src/client/index.jsx
var import_jsx_runtime = require("react/jsx-runtime");
var PACKAGE_ID = "dsh-client-wukong-intensity-skin";
var LOCALE_NAMESPACE = "wukong.skin";
var ASSET_PREFIX = `/plugins/${PACKAGE_ID}/assets`;
var BIND_EFFORT_KEY = "dsh-wukong-intensity-skin.bind-effort";
var PORTRAIT_ANCHORS = [
  { level: 0, file: "stage-00.webp" },
  { level: 1, file: "level-01.webp" },
  { level: 2, file: "level-02.webp" },
  { level: 3, file: "level-03.webp" },
  { level: 4, file: "level-04.webp" },
  { level: 5, file: "level-05.webp" },
  { level: 6, file: "stage-06.webp" },
  { level: 7, file: "level-07.webp" },
  { level: 8, file: "level-08.webp" },
  { level: 9, file: "level-09.webp" },
  { level: 10, file: "level-10.webp" },
  { level: 11, file: "level-11.webp" },
  { level: 12, file: "stage-12.webp" },
  { level: 13, file: "level-13.webp" },
  { level: 14, file: "level-14.webp" },
  { level: 15, file: "bridge-15.webp" },
  { level: 16, file: "level-16.webp" },
  { level: 17, file: "level-17.webp" },
  { level: 18, file: "stage-18.webp" },
  { level: 19, file: "level-19.webp" },
  { level: 20, file: "level-20.webp" },
  { level: 21, file: "level-21.webp" },
  { level: 22, file: "level-22.webp" },
  { level: 23, file: "level-23.webp" },
  { level: 24, file: "stage-24.webp" },
  { level: 25, file: "level-25.webp" },
  { level: 26, file: "level-26.webp" },
  { level: 27, file: "bridge-27.webp" },
  { level: 28, file: "level-28.webp" },
  { level: 29, file: "level-29.webp" },
  { level: 30, file: "stage-30.webp" }
];
var cssVariables = [
  "--wk-strength",
  "--wk-page",
  "--wk-bg-base",
  "--wk-layer-1",
  "--wk-layer-2",
  "--wk-layer-3",
  "--wk-sidebar",
  "--wk-ink",
  "--wk-secondary",
  "--wk-tertiary",
  "--wk-border",
  "--wk-accent",
  "--wk-accent-hover",
  "--wk-hover",
  "--wk-portrait-opacity"
];
var SkinPresenter = class {
  constructor(scope, theme) {
    this.scope = scope;
    this.theme = theme;
    this.enabled = true;
    this.frame = PREVIEW_MAX_FRAME;
    this.pendingFrame = PREVIEW_MAX_FRAME;
    this.raf = 0;
    this.disposed = false;
    this.root = document.createElement("div");
    this.root.className = "wk-skin-backdrop";
    this.root.dataset.plugin = PACKAGE_ID;
    this.root.dataset.media = "color";
    this.root.setAttribute("aria-hidden", "true");
    this.portraits = createPortraitLoader({
      sources: PORTRAIT_ANCHORS.map(({ level, file }) => ({
        level,
        url: `${ASSET_PREFIX}/portrait/${file}`
      })),
      onChange: ({ image }) => {
        if (this.disposed || !this.enabled) return;
        if (image === null) {
          this.root.dataset.media = "color";
          this.root.replaceChildren();
          return;
        }
        const portrait = image;
        portrait.className = "wk-skin-sequence-frame";
        portrait.alt = "";
        portrait.draggable = false;
        if (this.root.firstChild !== portrait) this.root.replaceChildren(portrait);
        this.root.dataset.media = "sequence";
      }
    });
    this.unsubscribe = scope.subscribe(() => this.syncSettings());
    this.syncSettings();
  }
  syncSettings() {
    this.setEnabled(this.scope.getSnapshot().enabled);
  }
  isEnabled() {
    return this.enabled;
  }
  getFrame() {
    return this.frame;
  }
  setEnabled(enabled) {
    if (this.disposed) return;
    this.enabled = enabled;
    if (enabled) {
      if (!this.root.isConnected) document.body.prepend(this.root);
      document.body.dataset.wkSkin = "on";
      this.applyFrame();
      this.portraits.start();
    } else {
      if (this.raf !== 0) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.root.remove();
      this.portraits.stop();
      this.root.replaceChildren();
      this.root.dataset.media = "color";
      delete document.body.dataset.wkSkin;
      delete document.body.dataset.wkStage;
      for (const name of cssVariables) document.body.style.removeProperty(name);
    }
  }
  setFrame(frame) {
    if (this.disposed) return;
    this.pendingFrame = Math.min(PREVIEW_MAX_FRAME, Math.max(0, Math.round(frame)));
    this.frame = this.pendingFrame;
    if (!this.enabled) return;
    if (this.raf !== 0) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.frame = this.pendingFrame;
      this.applyFrame();
    });
  }
  applyFrame() {
    if (this.disposed || !this.enabled) return;
    const palette = paletteForFrame(this.frame);
    const body = document.body;
    this.syncNativeTheme(palette.stage === 5 ? "dark" : "light");
    body.dataset.wkStage = String(palette.stage);
    body.style.setProperty("--wk-strength", String(palette.strength));
    body.style.setProperty("--wk-page", palette.page);
    body.style.setProperty("--wk-bg-base", palette.base);
    body.style.setProperty("--wk-layer-1", palette.layer1);
    body.style.setProperty("--wk-layer-2", palette.layer2);
    body.style.setProperty("--wk-layer-3", palette.layer3);
    body.style.setProperty("--wk-sidebar", palette.sidebar);
    body.style.setProperty("--wk-ink", palette.ink);
    body.style.setProperty("--wk-secondary", palette.secondary);
    body.style.setProperty("--wk-tertiary", palette.tertiary);
    body.style.setProperty("--wk-border", palette.border);
    body.style.setProperty("--wk-accent", palette.accent);
    body.style.setProperty("--wk-accent-hover", palette.accentHover);
    body.style.setProperty("--wk-hover", palette.hover);
    body.style.setProperty("--wk-portrait-opacity", palette.portraitOpacity);
    this.portraits.select(palette.level);
  }
  syncNativeTheme(theme = paletteForFrame(this.frame).stage === 5 ? "dark" : "light") {
    if (!this.enabled || this.theme.getTheme().preference === theme) return;
    this.theme.setTheme(theme);
  }
  async choose(enabled) {
    this.setEnabled(enabled);
    try {
      await this.scope.set(enabled);
    } catch (error) {
      this.syncSettings();
      throw error;
    }
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe();
    if (this.raf !== 0) cancelAnimationFrame(this.raf);
    this.portraits.dispose();
    this.root.remove();
    delete document.body.dataset.wkSkin;
    delete document.body.dataset.wkStage;
    for (const name of cssVariables) document.body.style.removeProperty(name);
  }
};
function modelReasoning(state) {
  const current = state.current;
  if (current === null) return null;
  const group = state.groups.find((item) => item.id === current.provider);
  const model = group?.models.find((item) => item.id === current.model);
  if (model?.reasoning === void 0) return null;
  return {
    selection: current,
    efforts: model.reasoning.efforts,
    defaultEffort: model.reasoning.defaultEffort
  };
}
function WukongEffortSlider({ directory, load, select, presenter, scope }) {
  const state = (0, import_react.useSyncExternalStore)(
    (listener) => directory.subscribe(listener),
    () => directory.getSnapshot()
  );
  const skin = (0, import_react.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const reasoning = (0, import_react.useMemo)(() => modelReasoning(state), [state]);
  const efforts = reasoning?.efforts ?? [];
  const committedIndex = selectedEffortIndex(
    efforts,
    reasoning?.selection.reasoningEffort,
    reasoning?.defaultEffort
  );
  const committedFrame = committedIndex < 0 ? PREVIEW_MAX_FRAME : frameForEffort(committedIndex, efforts.length);
  const bindEffort = skin.bindEffort;
  const [frame, setFrame] = (0, import_react.useState)(() => bindEffort ? committedFrame : presenter.getFrame());
  const [pending, setPending] = (0, import_react.useState)(false);
  const [failed, setFailed] = (0, import_react.useState)(false);
  const [interacting, setInteracting] = (0, import_react.useState)(false);
  const dragging = (0, import_react.useRef)(false);
  const dragStartFrame = (0, import_react.useRef)(frame);
  const enabled = skin.enabled;
  (0, import_react.useEffect)(() => {
    if (enabled) load();
  }, [enabled, load]);
  (0, import_react.useEffect)(() => {
    if (!bindEffort || dragging.current || pending) return;
    setFrame(committedFrame);
    presenter.setFrame(committedFrame);
  }, [bindEffort, committedFrame, pending, presenter]);
  if (!enabled) return null;
  if (bindEffort && (reasoning === null || efforts.length < 2)) return null;
  const previewIndex = nearestEffortIndex(frame, efforts);
  const previewEffort = efforts[previewIndex];
  const progressRatio = frame / PREVIEW_MAX_FRAME;
  const tooltipLabel = indicatorLabel(frame, bindEffort ? efforts : []);
  const commit = async (rawFrame) => {
    if (!bindEffort) {
      dragging.current = false;
      setFrame(rawFrame);
      presenter.setFrame(rawFrame);
      return;
    }
    const targetIndex = nearestEffortIndex(rawFrame, efforts);
    const target = efforts[targetIndex];
    if (target === void 0) return;
    const targetFrame = frameForEffort(targetIndex, efforts.length);
    dragging.current = false;
    setFrame(targetFrame);
    presenter.setFrame(targetFrame);
    if (targetIndex === committedIndex || pending) return;
    setPending(true);
    setFailed(false);
    const accepted = await select({
      provider: reasoning.selection.provider,
      model: reasoning.selection.model,
      reasoningEffort: target.id
    });
    setPending(false);
    if (!accepted) {
      setFailed(true);
      setFrame(committedFrame);
      presenter.setFrame(committedFrame);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: "wk-effort-control",
      "data-plugin": PACKAGE_ID,
      "data-state": failed ? "error" : pending ? "pending" : "ready",
      title: bindEffort ? previewEffort?.name : void 0,
      children: [
        interacting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "output",
          {
            className: "wk-effort-control__tooltip",
            style: { "--wk-slider-ratio": progressRatio },
            children: tooltipLabel
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wk-effort-control__ticks", "aria-hidden": "true", children: efforts.map((effort, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "i",
          {
            className: "wk-effort-control__tick",
            style: { left: `${frameForEffort(index, efforts.length) / PREVIEW_MAX_FRAME * 100}%` }
          },
          effort.id
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wk-effort-control__range",
            type: "range",
            min: 0,
            max: PREVIEW_MAX_FRAME,
            step: 1,
            value: frame,
            disabled: pending || state.status === "selecting",
            "aria-label": bindEffort ? "\u601D\u8003\u7B49\u7EA7" : "\u76AE\u80A4\u8FDB\u5EA6",
            "aria-valuetext": bindEffort ? previewEffort?.name ?? "" : tooltipLabel,
            onPointerDown: () => {
              dragging.current = true;
              dragStartFrame.current = frame;
              setInteracting(true);
            },
            onInput: (event) => {
              dragging.current = true;
              const next = Number(event.currentTarget.value);
              setFrame(next);
              presenter.setFrame(next);
            },
            onPointerUp: (event) => {
              setInteracting(false);
              void commit(Number(event.currentTarget.value));
            },
            onPointerCancel: () => {
              setInteracting(false);
              dragging.current = false;
              setFrame(dragStartFrame.current);
              presenter.setFrame(dragStartFrame.current);
            },
            onKeyUp: (event) => {
              setInteracting(false);
              if (event.key !== "Escape") void commit(Number(event.currentTarget.value));
            },
            onBlur: (event) => {
              setInteracting(false);
              if (dragging.current) void commit(Number(event.currentTarget.value));
            },
            onKeyDown: (event) => {
              setInteracting(true);
              if (event.key === "Escape" && !pending) {
                setInteracting(false);
                dragging.current = false;
                setFrame(dragStartFrame.current);
                presenter.setFrame(dragStartFrame.current);
              }
            }
          }
        )
      ]
    }
  );
}
function EffortBindingRow({ scope, t }) {
  const snapshot = (0, import_react.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const [pending, setPending] = (0, import_react.useState)(false);
  if (!snapshot.enabled) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wk-appearance-binding", "data-plugin": PACKAGE_ID, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("effort.binding") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Switch,
      {
        checked: snapshot.bindEffort,
        disabled: pending,
        label: t("effort.binding"),
        onChange: (next) => {
          if (pending) return;
          setPending(true);
          void scope.setBindEffort(next).catch(() => void 0).finally(() => setPending(false));
        }
      }
    )
  ] });
}
var inject = ["slots", "sessions", "modelDirectories", "locale", "theme"];
function createPreferenceStore() {
  try {
    localStorage.removeItem("dsh-wukong-intensity-skin.enabled");
  } catch {
  }
  let snapshot = {
    enabled: true,
    bindEffort: localStorage.getItem(BIND_EFFORT_KEY) !== "0"
  };
  const listeners = /* @__PURE__ */ new Set();
  const onStorage = (event) => {
    if (event.key !== BIND_EFFORT_KEY) return;
    const next = {
      enabled: snapshot.enabled,
      bindEffort: event.newValue !== "0"
    };
    if (next.enabled === snapshot.enabled && next.bindEffort === snapshot.bindEffort) return;
    snapshot = next;
    for (const listener of listeners) listener();
  };
  window.addEventListener("storage", onStorage);
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async set(enabled) {
      if (enabled === snapshot.enabled) return;
      snapshot = { ...snapshot, enabled };
      for (const listener of listeners) listener();
    },
    async setBindEffort(bindEffort) {
      if (bindEffort === snapshot.bindEffort) return;
      localStorage.setItem(BIND_EFFORT_KEY, bindEffort ? "1" : "0");
      snapshot = { ...snapshot, bindEffort };
      for (const listener of listeners) listener();
    },
    dispose() {
      window.removeEventListener("storage", onStorage);
      listeners.clear();
    }
  };
}
function apply(ctx) {
  const style = document.createElement("style");
  style.dataset.plugin = PACKAGE_ID;
  style.textContent = skin_default;
  document.head.append(style);
  ctx.effect(() => () => style.remove(), "wukong-intensity-skin: scoped styles");
  const scope = createPreferenceStore();
  ctx.effect(() => () => scope.dispose(), "wukong-intensity-skin: appearance preference");
  const theme = ctx.get("theme");
  const presenter = new SkinPresenter(scope, theme);
  ctx.effect(() => () => presenter.dispose(), "wukong-intensity-skin: backdrop presenter");
  ctx.effect(
    () => installWukongAppearanceButton(scope, presenter, PACKAGE_ID),
    "wukong-intensity-skin: native appearance extension"
  );
  ctx.effect(
    () => ctx.locale.register(LOCALE_NAMESPACE, {
      zh: { "effort.binding": "\u6ED1\u52A8\u53D8\u4F5B\u7ED1\u5B9A\u601D\u8003\u7B49\u7EA7" },
      en: { "effort.binding": "Bind slider to reasoning level" }
    }),
    "wukong-intensity-skin: settings locale"
  );
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "wukong-effort-binding",
    order: 10.5,
    locale: LOCALE_NAMESPACE,
    inject: () => ({ scope })
  }, EffortBindingRow));
  ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
    name: "conversation.input.right",
    id: "wukong-intensity-control",
    order: 10,
    inject: (sessionId) => {
      const available = ctx.sessions.subagentAddress(sessionId) === void 0;
      const directory = ctx.modelDirectories.directoryFor(sessionId);
      return {
        directory: directory.store,
        presenter,
        scope,
        load: () => {
          if (available) void directory.load().catch(() => void 0);
        },
        select: (selection) => available ? directory.select(selection).then((result) => result.ok, () => false) : Promise.resolve(false)
      };
    }
  }, WukongEffortSlider));
}
return module.exports;}});
//# sourceMappingURL=client.js.map
