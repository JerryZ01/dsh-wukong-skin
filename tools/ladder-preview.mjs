/**
 * Build `assets/ladder-preview.jpg` —— README 里那张 31 帧人像阶梯的预览。
 *
 *   $env:SHARP_DIR='<有 sharp 的目录>'
 *   node tools/ladder-preview.mjs
 *
 * 上排是 6 个果位的定型帧（stage-00/06/12/18/24/30），
 * 下排是从石猴到斗战胜祖均匀取的 8 帧，能一眼看出整条强度曲线。
 */

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MAX_LEVEL, RANKS } from "../src/client/logic.js";

const sharpRoot = process.env.SHARP_DIR ?? fileURLToPath(new URL("..", import.meta.url));
let sharp;
try {
  sharp = createRequire(`${sharpRoot.replace(/[\\/]$/, "")}/`)("sharp");
} catch {
  console.error("sharp is missing. Run `npm install`, or set SHARP_DIR.");
  process.exit(1);
}

const portraitDir = fileURLToPath(new URL("../assets/portrait/", import.meta.url));
const outFile = fileURLToPath(new URL("../assets/ladder-preview.jpg", import.meta.url));

const ANCHORS = ["stage-00", "stage-06", "stage-12", "stage-18", "stage-24", "stage-30"];
const RAMP = ["stage-00", "level-04", "stage-06", "level-10", "stage-12", "level-17", "stage-24", "stage-30"];

const CELL = 240;
const COLS = 8;
const LABEL = 30;
const PAD = 12;

async function cell(name, caption, accent) {
  const image = await sharp(`${portraitDir}${name}.webp`)
    .resize(CELL, CELL, { fit: "cover" })
    .toBuffer();
  const svg = Buffer.from(
    `<svg width="${CELL}" height="${LABEL}">`
    + `<rect width="100%" height="100%" fill="#111"/>`
    + `<text x="8" y="20" font-family="monospace" font-size="15" fill="${accent}">${caption}</text></svg>`,
  );
  return [
    { input: image, left: 0, top: 0 },
    { input: svg, left: 0, top: CELL },
  ];
}

const width = COLS * CELL + PAD * (COLS + 1);
const height = PAD + (CELL + LABEL) * 2 + PAD * 3;

const composites = [];
const place = (parts, column, row) => {
  const left = PAD + column * (CELL + PAD);
  const top = PAD + row * (CELL + LABEL + PAD);
  for (const part of parts) composites.push({ ...part, left: left + part.left, top: top + part.top });
};

// 上排：六果位定型帧，用金色标注。
for (const [index, name] of ANCHORS.entries()) {
  place(await cell(name, `L${index * 6} ${RANKS[index]}`, "#e0b44a"), index, 0);
}

// 下排：均匀 8 帧，露出果位之间的过渡。
for (const [index, name] of RAMP.entries()) {
  const level = name.startsWith("stage-") ? Number(name.slice(6)) : Number(name.slice(6));
  place(await cell(name, name, "#9a938a"), index, 1);
}

const sheet = await sharp({
  create: { width, height, channels: 3, background: "#0c0b0a" },
}).composite(composites).jpeg({ quality: 88 }).toBuffer();

writeFileSync(outFile, sheet);
console.log(`ladder-preview.jpg  ${width}x${height}  ${sheet.length} bytes`);
