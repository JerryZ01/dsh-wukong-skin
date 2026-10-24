/**
 * 台词排版预览：把六个果位的滑块 + 台词画成一张图，检查长句会不会顶出边界。
 *
 *   node tools/line-preview.mjs
 *
 * 纯静态渲染，不启动 DSH。产物在 .cache/probe/。
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { LINES, MAX_LEVEL, RANKS, lineForFrame } from "../src/client/logic.js";

const sharpRoot = process.env.SHARP_DIR ?? fileURLToPath(new URL("..", import.meta.url));
const sharp = createRequire(`${sharpRoot.replace(/[\\/]$/, "")}/`)("sharp");

const WIDTH = 760;
const ROW = 118;
const PAD = 26;
const height = LINES.length * ROW + PAD * 2;

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 六个果位各取中点等级，看看那一档的台词
const rows = LINES.map((line, index) => {
  const level = line.rank * 6 + 3;
  const frame = (level / MAX_LEVEL) * 240;
  const resolved = lineForFrame(frame);
  const y = PAD + index * ROW;
  const ratio = frame / 240;
  const knobX = 60 + ratio * 300;

  return `
    <g>
      <text x="${PAD}" y="${y + 16}" font-family="sans-serif" font-size="13" fill="#8a8177">
        L${level}  ${RANKS[index]}
      </text>
      <text x="${PAD}" y="${y + 46}" font-family="sans-serif" font-size="17" font-weight="600" fill="#241f1a">
        ${escape(resolved.text)}
      </text>
      <text x="${PAD + 470}" y="${y + 46}" font-family="sans-serif" font-size="12" fill="#9a9188">
        ${escape(resolved.source)}
      </text>
      <line x1="60" y1="${y + 76}" x2="360" y2="${y + 76}" stroke="#c9c2b8" stroke-width="1"/>
      <circle cx="${knobX}" cy="${y + 76}" r="6" fill="#c0392b"/>
    </g>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">
  <rect width="${WIDTH}" height="${height}" fill="#f6f4ef"/>
  ${rows}
</svg>`;

const outDir = fileURLToPath(new URL("../.cache/probe/", import.meta.url));
mkdirSync(outDir, { recursive: true });
const png = await sharp(Buffer.from(svg)).png().toBuffer();
const file = `${outDir}lines.png`;
writeFileSync(file, png);

// 顺带量一下最长那句的实际宽度，判断 300px 的 max-width 够不够
const longest = LINES.reduce((best, line) => (line.text.length > best.text.length ? line : best));
console.log(`最长台词: 「${longest.text}」${longest.text.length} 字（${longest.source}）`);
console.log(`预览图: ${file}`);
