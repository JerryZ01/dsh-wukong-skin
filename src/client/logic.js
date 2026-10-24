export const PREVIEW_MAX_FRAME = 240;
export const MAX_LEVEL = 30;

// 六级果位：石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖
export const RANKS = ["石猴", "美猴王", "齐天大圣", "孙行者", "斗战胜佛", "斗战胜祖"];

export function clampFrame(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(PREVIEW_MAX_FRAME, Math.max(0, Math.round(value)));
}

export function frameForEffort(index, count) {
  if (count <= 1 || !Number.isFinite(index)) return 0;
  const safe = Math.min(count - 1, Math.max(0, Math.round(index)));
  return Math.round((safe / (count - 1)) * PREVIEW_MAX_FRAME);
}

export function nearestEffortIndex(frame, efforts) {
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

export function selectedEffortIndex(efforts, selectedId, defaultId) {
  const id = selectedId ?? defaultId;
  return id === undefined ? -1 : efforts.findIndex((effort) => effort.id === id);
}

export function rankIndexForFrame(rawFrame) {
  const level = (clampFrame(rawFrame) / PREVIEW_MAX_FRAME) * MAX_LEVEL;
  const index = level >= MAX_LEVEL ? RANKS.length - 1 : Math.floor(level / 6);
  return Math.min(RANKS.length - 1, Math.max(0, index));
}

export function rankForFrame(rawFrame) {
  return RANKS[rankIndexForFrame(rawFrame)];
}

export function indicatorLabel(rawFrame, efforts) {
  const effort = efforts[nearestEffortIndex(rawFrame, efforts)];
  return effort === undefined
    ? rankForFrame(rawFrame)
    : `${rankForFrame(rawFrame)} · ${effort.name}`;
}

// ---- 台词 --------------------------------------------------------------
// 每个果位一句，全部逐字核对过原著（正文用繁体，这里转成简体）：
//   石猴     第 1 回  猴王忧生死，「将来年老血衰，暗中有阎王老子管着」
//   美猴王   第 3 回  龙宫试金箍棒，「忒粗忒长些，再短细些方可用」
//   齐天大圣 第 7 回  大闹天宫，「皇帝轮流做，明年到我家」
//   孙行者   第 24 回 行者劝唐僧，「念念回首处，即是灵山」
//   斗战胜佛 第 100 回 成佛后，「师父，此时我已成佛，与你一般」
//   斗战胜祖 第 100 回 摸头不见金箍，「趁早儿念个松箍儿咒，脱下来，打得粉碎」
//
// 「心生种种魔生，心灭种种魔灭」很想用，但那是第 13 回**唐僧**说的，
// 安到悟空头上算张冠李戴，所以没有收。
export const LINES = [
  { rank: 0, text: "将来年老血衰，暗中有阎王老子管着。", source: "第一回" },
  { rank: 1, text: "忒粗忒长些，再短细些方可用。", source: "第三回" },
  { rank: 2, text: "皇帝轮流做，明年到我家。", source: "第七回" },
  { rank: 3, text: "念念回首处，即是灵山。", source: "第二十四回" },
  { rank: 4, text: "师父，此时我已成佛，与你一般。", source: "第一百回" },
  { rank: 5, text: "趁早儿念个松箍儿咒，脱下来，打得粉碎。", source: "第一百回" },
];

export function lineForFrame(rawFrame) {
  return LINES[rankIndexForFrame(rawFrame)];
}



function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function mix(a, b, amount) {
  return [
    Math.round(lerp(a[0], b[0], amount)),
    Math.round(lerp(a[1], b[1], amount)),
    Math.round(lerp(a[2], b[2], amount)),
  ];
}

function rgb(value, alpha = 1) {
  return alpha === 1
    ? `rgb(${value[0]} ${value[1]} ${value[2]})`
    : `rgb(${value[0]} ${value[1]} ${value[2]} / ${alpha})`;
}

// 石白 → 赭石 → 蟠桃金 → 丹炉火 → 黑金。六级停靠点与果位一一对应。
const STOPS = [
  { at: 0, page: [236, 234, 228], surface: [250, 249, 245], surface2: [241, 239, 233], ink: [24, 22, 20], secondary: [116, 110, 102], accent: [192, 57, 43], portraitOpacity: 0.90 },
  { at: 6, page: [222, 214, 199], surface: [244, 240, 231], surface2: [232, 226, 214], ink: [27, 24, 20], secondary: [104, 96, 86], accent: [190, 60, 45], portraitOpacity: 0.92 },
  { at: 12, page: [196, 178, 148], surface: [222, 210, 188], surface2: [206, 192, 168], ink: [30, 26, 20], secondary: [88, 80, 68], accent: [184, 64, 46], portraitOpacity: 0.93 },
  { at: 18, page: [140, 116, 86], surface: [172, 150, 120], surface2: [152, 130, 102], ink: [26, 22, 18], secondary: [70, 62, 52], accent: [176, 74, 48], portraitOpacity: 0.94 },
  { at: 24, page: [46, 38, 32], surface: [54, 45, 38], surface2: [66, 55, 45], ink: [246, 238, 224], secondary: [190, 178, 158], accent: [200, 140, 54], portraitOpacity: 0.94 },
  { at: 30, page: [18, 16, 14], surface: [32, 28, 24], surface2: [44, 38, 32], ink: [248, 240, 226], secondary: [198, 186, 164], accent: [200, 160, 60], portraitOpacity: 0.94 },
];

const LIGHT_ACCENT = [192, 57, 43];

export function paletteForFrame(rawFrame) {
  const frame = clampFrame(rawFrame);
  const level = (frame / PREVIEW_MAX_FRAME) * MAX_LEVEL;
  const portraitStage = Math.min(5, Math.floor(level / 6));
  const from = STOPS[portraitStage];
  const to = STOPS[Math.min(5, portraitStage + 1)];
  const amount = from === to ? 0 : (level - from.at) / (to.at - from.at);

  // 界面本身保持二元：石猴到孙行者沿用原生浅色外壳，进入斗战胜佛(24)后切黑金。
  // `stage` is therefore the shell stage (0 or 5), not the portrait stage - the
  // stylesheet keys its light and dark rule sets off exactly those two values.
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
    portraitOpacity: String(lerp(from.portraitOpacity, to.portraitOpacity, amount)),
  };
}
