import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Switch } from "@deepseek-ai/dsh-client-ui-primitives";
import styles from "./skin.css";
import { installWukongAppearanceButton } from "./appearance.js";
import { createPortraitLoader } from "./portrait-loader.js";
import {
  PREVIEW_MAX_FRAME,
  frameForEffort,
  indicatorLabel,
  lineForFrame,
  nearestEffortIndex,
  paletteForFrame,
  rankIndexForFrame,
  selectedEffortIndex,
} from "./logic.js";

const PACKAGE_ID = "dsh-client-wukong-intensity-skin";
const LOCALE_NAMESPACE = "wukong.skin";
const ASSET_PREFIX = `/plugins/${PACKAGE_ID}/assets`;
const BIND_EFFORT_KEY = "dsh-wukong-intensity-skin.bind-effort";

// The 31-step ladder: a stage frame every six levels, with 15 and 27 carrying
// the costume change so the sequence never jumps across a dress boundary.
const PORTRAIT_ANCHORS = [
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
  { level: 30, file: "stage-30.webp" },
];

const cssVariables = [
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
  "--wk-portrait-opacity",
];

class SkinPresenter {
  constructor(scope, theme) {
    this.scope = scope;
    this.theme = theme;
    this.enabled = true;
    // Start at the top frame so the first paint after load is the black-and-gold
    // shell instead of flashing the pale palette until the directory resolves.
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
        url: `${ASSET_PREFIX}/portrait/${file}`,
      })),
      onChange: ({ image }) => {
        if (this.disposed || !this.enabled) return;
        if (image === null) {
          this.root.dataset.media = "color";
          this.root.replaceChildren();
          return;
        }
        // Reuse the decoded node so a frame swap cannot start a second fetch.
        const portrait = image;
        portrait.className = "wk-skin-sequence-frame";
        portrait.alt = "";
        portrait.draggable = false;
        if (this.root.firstChild !== portrait) this.root.replaceChildren(portrait);
        this.root.dataset.media = "sequence";
      },
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
}

function modelReasoning(state) {
  const current = state.current;
  if (current === null) return null;
  const group = state.groups.find((item) => item.id === current.provider);
  const model = group?.models.find((item) => item.id === current.model);
  if (model?.reasoning === undefined) return null;
  return {
    selection: current,
    efforts: model.reasoning.efforts,
    defaultEffort: model.reasoning.defaultEffort,
  };
}

function WukongEffortSlider({ directory, load, select, presenter, scope }) {
  const state = useSyncExternalStore(
    (listener) => directory.subscribe(listener),
    () => directory.getSnapshot(),
  );
  const skin = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  );
  const reasoning = useMemo(() => modelReasoning(state), [state]);
  const efforts = reasoning?.efforts ?? [];
  const committedIndex = selectedEffortIndex(
    efforts,
    reasoning?.selection.reasoningEffort,
    reasoning?.defaultEffort,
  );
  // An unknown committed effort defaults to the top frame: a fresh conversation
  // paints the black-and-gold shell instead of the pale one.
  const committedFrame = committedIndex < 0
    ? PREVIEW_MAX_FRAME
    : frameForEffort(committedIndex, efforts.length);
  const bindEffort = skin.bindEffort;
  const [frame, setFrame] = useState(() => (bindEffort ? committedFrame : presenter.getFrame()));
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const dragging = useRef(false);
  const dragStartFrame = useRef(frame);
  const enabled = skin.enabled;

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  useEffect(() => {
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
  const line = lineForFrame(frame);
  const rankIndex = rankIndexForFrame(frame);

  const commit = async (rawFrame) => {
    if (!bindEffort) {
      dragging.current = false;
      setFrame(rawFrame);
      presenter.setFrame(rawFrame);
      return;
    }
    const targetIndex = nearestEffortIndex(rawFrame, efforts);
    const target = efforts[targetIndex];
    if (target === undefined) return;
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
      reasoningEffort: target.id,
    });
    setPending(false);
    if (!accepted) {
      setFailed(true);
      setFrame(committedFrame);
      presenter.setFrame(committedFrame);
    }
  };

  return (
    <div
      className="wk-effort-control"
      data-plugin={PACKAGE_ID}
      data-state={failed ? "error" : pending ? "pending" : "ready"}
      data-interacting={interacting ? "true" : "false"}
      title={bindEffort ? previewEffort?.name : undefined}
    >
      {interacting && (
        <output
          className="wk-effort-control__tooltip"
          style={{ "--wk-slider-ratio": progressRatio }}
        >
          {tooltipLabel}
        </output>
      )}
      {/* 台词：跨果位时换一句。key 用 rank 让它重挂载，淡入动画才会重放。 */}
      {line !== undefined && (
        <p className="wk-effort-control__line" key={rankIndex} aria-live="polite">
          <span className="wk-effort-control__line-text">{line.text}</span>
          <span className="wk-effort-control__line-source">{line.source}</span>
        </p>
      )}
      <div className="wk-effort-control__ticks" aria-hidden="true">
        {efforts.map((effort, index) => (
          <i
            className="wk-effort-control__tick"
            key={effort.id}
            style={{ left: `${(frameForEffort(index, efforts.length) / PREVIEW_MAX_FRAME) * 100}%` }}
          />
        ))}
      </div>
      <input
        className="wk-effort-control__range"
        type="range"
        min={0}
        max={PREVIEW_MAX_FRAME}
        step={1}
        value={frame}
        disabled={pending || state.status === "selecting"}
        aria-label={bindEffort ? "思考等级" : "皮肤进度"}
        aria-valuetext={bindEffort ? previewEffort?.name ?? "" : tooltipLabel}
        onPointerDown={() => {
          dragging.current = true;
          dragStartFrame.current = frame;
          setInteracting(true);
        }}
        onInput={(event) => {
          dragging.current = true;
          const next = Number(event.currentTarget.value);
          setFrame(next);
          presenter.setFrame(next);
        }}
        onPointerUp={(event) => {
          setInteracting(false);
          void commit(Number(event.currentTarget.value));
        }}
        onPointerCancel={() => {
          setInteracting(false);
          dragging.current = false;
          setFrame(dragStartFrame.current);
          presenter.setFrame(dragStartFrame.current);
        }}
        onKeyUp={(event) => {
          setInteracting(false);
          if (event.key !== "Escape") void commit(Number(event.currentTarget.value));
        }}
        onBlur={(event) => {
          setInteracting(false);
          if (dragging.current) void commit(Number(event.currentTarget.value));
        }}
        onKeyDown={(event) => {
          setInteracting(true);
          if (event.key === "Escape" && !pending) {
            setInteracting(false);
            dragging.current = false;
            setFrame(dragStartFrame.current);
            presenter.setFrame(dragStartFrame.current);
          }
        }}
      />
    </div>
  );
}

function EffortBindingRow({ scope, t }) {
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  );
  const [pending, setPending] = useState(false);
  if (!snapshot.enabled) return null;

  return (
    <div className="wk-appearance-binding" data-plugin={PACKAGE_ID}>
      <span>{t("effort.binding")}</span>
      <Switch
        checked={snapshot.bindEffort}
        disabled={pending}
        label={t("effort.binding")}
        onChange={(next) => {
          if (pending) return;
          setPending(true);
          void scope.setBindEffort(next).catch(() => undefined).finally(() => setPending(false));
        }}
      />
    </div>
  );
}

export const inject = ["slots", "sessions", "modelDirectories", "locale", "theme"];

function createPreferenceStore() {
  // The appearance switch is scoped to this client activation: switching away
  // to a native theme and back must leave the skin visible again.
  try {
    localStorage.removeItem("dsh-wukong-intensity-skin.enabled");
  } catch {
    // Storage may be unavailable; the in-memory default still enables the skin.
  }
  let snapshot = {
    enabled: true,
    bindEffort: localStorage.getItem(BIND_EFFORT_KEY) !== "0",
  };
  const listeners = new Set();
  const onStorage = (event) => {
    if (event.key !== BIND_EFFORT_KEY) return;
    const next = {
      enabled: snapshot.enabled,
      bindEffort: event.newValue !== "0",
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
    },
  };
}

export function apply(ctx) {
  const style = document.createElement("style");
  style.dataset.plugin = PACKAGE_ID;
  style.textContent = styles;
  document.head.append(style);
  ctx.effect(() => () => style.remove(), "wukong-intensity-skin: scoped styles");

  const scope = createPreferenceStore();
  ctx.effect(() => () => scope.dispose(), "wukong-intensity-skin: appearance preference");
  const theme = ctx.get("theme");
  const presenter = new SkinPresenter(scope, theme);
  ctx.effect(() => () => presenter.dispose(), "wukong-intensity-skin: backdrop presenter");
  ctx.effect(
    () => installWukongAppearanceButton(scope, presenter, PACKAGE_ID),
    "wukong-intensity-skin: native appearance extension",
  );
  ctx.effect(
    () => ctx.locale.register(LOCALE_NAMESPACE, {
      zh: { "effort.binding": "滑动变佛绑定思考等级" },
      en: { "effort.binding": "Bind slider to reasoning level" },
    }),
    "wukong-intensity-skin: settings locale",
  );

  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "wukong-effort-binding",
    order: 10.5,
    locale: LOCALE_NAMESPACE,
    inject: () => ({ scope }),
  }, EffortBindingRow));

  ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
    name: "conversation.input.right",
    id: "wukong-intensity-control",
    order: 10,
    inject: (sessionId) => {
      const available = ctx.sessions.subagentAddress(sessionId) === undefined;
      const directory = ctx.modelDirectories.directoryFor(sessionId);
      return {
        directory: directory.store,
        presenter,
        scope,
        load: () => {
          if (available) void directory.load().catch(() => undefined);
        },
        select: (selection) => (available
          ? directory.select(selection).then((result) => result.ok, () => false)
          : Promise.resolve(false)),
      };
    },
  }, WukongEffortSlider));
}
