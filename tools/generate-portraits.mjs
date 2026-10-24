/**
 * Generate the 31-frame Wukong portrait ladder with gpt-image-2.5.
 *
 * 真正的生图通道：apikl 的 OpenAI 兼容网关，
 *   POST /v1/images/generations   文生图
 *   POST /v1/images/edits         图生图（body 里带 images[].image_url，data URL 就行）
 * 两个模型：
 *   gpt-image-2.5-sunburst   主打出图质量，默认用它
 *   gpt-image-2.5-flare      出图快，适合反复调
 *
 * 31 次独立生成会得到 31 只不一样的猴子。两条规则把它按住：
 *
 *   1. 六个果位各有一张「定型帧」（stage-00/06/12/18/24/30），全部串成一条
 *      链：石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖。
 *      每一级拿上一级的成品当参考图，所以六级下来还是同一张脸。
 *   2. 同一果位内的另外五帧，拿该果位的定型帧当参考图做图生图，
 *      只推强度（纹样密度、金色比例、光轮层数），不换人。
 *
 * 背景色不是拍脑袋定的：直接从 `src/client/logic.js` 的 `paletteForFrame()`
 * 取每一档的 `--wk-page` 写进提示词，人像底色与界面底色永远同源。
 *
 *   $env:IMAGE_KEY='sk-...'      生图分组的 key
 *   $env:SHARP_DIR='<有 sharp 的目录>'
 *
 *   node tools/generate-portraits.mjs                    # 全部 31 帧
 *   node tools/generate-portraits.mjs --only stage-12    # 只重画一帧
 *   node tools/generate-portraits.mjs --from 12 --to 17  # 只做一个果位
 *   node tools/generate-portraits.mjs --force            # 忽略缓存重画
 *   node tools/generate-portraits.mjs --fast             # 换成 flare 模型
 */

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MAX_LEVEL, RANKS, paletteForFrame, PREVIEW_MAX_FRAME } from "../src/client/logic.js";

const BASE_URL = "https://api.apikl.ai/v1";
const MODEL_QUALITY = "gpt-image-2.5-sunburst";
const MODEL_FAST = "gpt-image-2.5-flare";
const SIZE = 1024;
const CONCURRENCY = 2;
const ATTEMPTS = 3;

const outDir = fileURLToPath(new URL("../assets/portrait/", import.meta.url));
const cacheDir = fileURLToPath(new URL("../.cache/gen/", import.meta.url));

// ---- cli --------------------------------------------------------------
const argv = process.argv.slice(2);
const valueOf = (name) => {
  const index = argv.indexOf(`--${name}`);
  return index < 0 ? undefined : argv[index + 1];
};
const numberOf = (name, fallback) => {
  const raw = valueOf(name);
  return raw === undefined ? fallback : Number(raw);
};

const force = argv.includes("--force");
const model = argv.includes("--fast") ? MODEL_FAST : MODEL_QUALITY;
const only = valueOf("only");
const from = numberOf("from", 0);
const to = numberOf("to", MAX_LEVEL);

const key = process.env.IMAGE_KEY;
if (!key) {
  console.error("需要 IMAGE_KEY（生图分组的 sk-...）。");
  process.exit(1);
}
// sharp ships as a devDependency, so a plain `npm install` is enough; SHARP_DIR
// remains for machines that keep it outside the checkout.
const sharpRoot = process.env.SHARP_DIR ?? fileURLToPath(new URL("..", import.meta.url));
let sharp;
try {
  sharp = createRequire(`${sharpRoot.replace(/[\\/]$/, "")}/`)("sharp");
} catch {
  console.error("sharp 缺失。先跑 `npm install`，或用 SHARP_DIR 指向装了 sharp 的目录。");
  process.exit(1);
}

// ---- the ladder -------------------------------------------------------
// 帧名与 assets/portrait/ 的文件名一一对应，是插件的稳定契约。
const FRAMES = [
  "stage-00",
  "level-01", "level-02", "level-03", "level-04", "level-05",
  "stage-06",
  "level-07", "level-08", "level-09", "level-10", "level-11",
  "stage-12",
  "level-13", "level-14",
  "bridge-15",
  "level-16", "level-17",
  "stage-18",
  "level-19", "level-20", "level-21", "level-22", "level-23",
  "stage-24",
  "level-25", "level-26",
  "bridge-27",
  "level-28", "level-29", "stage-30",
];

const ANCHORS = [0, 6, 12, 18, 24, 30];
const rankOf = (level) => Math.min(5, Math.floor(level / 6));

// ---- 六个果位的造型 ------------------------------------------------
// 每级写清「头、身、光」三件事，跨级换装才有西游记的叙事感。
const LOOKS = [
  {
    head: "完全没有头饰。额头与脸颊是粗糙的石灰质感，带碎石裂纹与青苔，毛发蓬乱呈扇贝形分块，头顶两块碎石像没长好的角",
    body: "赤裸的肩膀，锁骨与肩头的石块棱角分明，肩上落着几粒碎石，颈间能看到岩层断口",
    halo: "背后只有一圈极淡的圆形光晕和几道放射细线，像刚睁开眼时的一点微光",
  },
  {
    head: "头戴四角软巾，巾角压着额前，两根雉鸡翎从脑后向外上方扬起，额心一道浅浅的竖纹",
    body: "鹅黄团花锦袄，立领，肩头绣满团花，颈间一圈短毛领，双层护肩",
    halo: "背后两层同心圆光晕，外圈有放射细线；左侧留白处垂下水帘洞的石钟乳与水流",
  },
  {
    head: "头戴凤翅紫金冠，冠身三尖，两侧各一支上翘的凤翅，两根雉鸡翎从冠后高扬，额上金锁子甲头箍，眉眼细长上挑，火眼金睛",
    body: "全套黄金锁子甲，肩甲三层叠片，甲片边缘有铆钉，胸前两枚圆形护心镜，颈间朱红披巾",
    halo: "背后三层同心圆光晕，最外圈带云纹，左右两侧翻卷着云气",
  },
  {
    head: "头戴金箍，一道素金圆环压在额前发际，箍上有两道凸起的金线，眉心一道竖纹，脸上带风尘",
    body: "青布直裰配虎皮裙，肩上斜挎皮质背带，右肩露出锁子甲内衬，画面左下方竖起金箍棒的上端",
    halo: "背后三层同心圆光晕，外圈是远山与云海，色调转成赭褐，留白减少",
  },
  {
    head: "头戴毗卢帽，帽檐垂一圈珠串与五个小叶片，双耳垂肩、耳垂各一枚金环，眉心有白毫相，面目收敛",
    body: "金红袈裟披肩，右肩袒露，袈裟上是田相格纹，胸口一串念珠，肩部是鎏金莲瓣护肩",
    halo: "背后五层同心光轮，最外一层是莲花瓣与火焰纹的背光，整体转成黑金",
  },
  {
    head: "宝冠化作纯金火焰纹，冠顶嵌一颗暗红宝珠，眉心生第三只竖眼（一道闭着的金色细缝），毛发边缘被金箔取代",
    body: "黑金铠甲与袈裟融为一体，肩上是熔金流动的莲瓣护肩，胸口一颗暗红宝石，甲缝里透出金光",
    halo: "背后五层同心光轮，外圈是熊熊燃烧的金色火焰与莲花瓣，几乎填满背景",
  },
];

const STYLE = `画风：中国国潮浮世绘风格的角色半身立绘，正面视角，胸像（头顶到大腿根），1:1 正方形构图，头顶留一点空隙，人物居中。
必须是实色块面平涂加粗黑轮廓勾边，毛发做剪纸与浮世绘式的几何化分块；不要写实素描、不要照片质感、不要 3D 渲染、不要厚涂油画笔触。`;

const FORBID = `禁止出现：任何文字、汉字、印章、签名、水印、logo、边框、分屏、多人、完整的腿和脚、全身站姿。`;

// 装饰上限必须逐级抬升，否则低果位会被写上「金箔、火焰、莲花瓣」，
// 出现「石猴比美猴王还华丽」的倒挂。每一档只允许本果位能有的东西。
const ESCALATION = [
  [
    "完全留白，只有一圈极淡的圆形光晕和几道放射细线；画面里没有任何金色、没有火焰、没有云纹",
    "石化加重：碎石裂纹更密，肩头与头顶的碎石增多，光晕略亮一点",
    "石缝里渗出一点暗红余烬，脸颊的岩层开始剥落，露出底下的皮毛；依然没有金色、没有火焰、没有云纹",
  ],
  [
    "留白多，背后两层同心光晕与放射细线，只有极细的金线勾边，没有火焰",
    "云纹浮现在脸颊与肩头，水帘洞的石钟乳与水流更明显，团花更密",
    "金线勾边增多，团花铺满肩背，雉鸡翎更长；仍然没有火焰",
  ],
  [
    "三层光晕与云纹，金线勾边清晰，甲片干净",
    "云气翻卷更密，甲片铆钉与护心镜的细节更锐利，朱红披巾更饱和",
    "肩甲上第一次出现火焰纹，金线满勾，金翅冠反光更强",
  ],
  [
    "远山云海，赭褐调，留白明显减少",
    "云海翻涌，风尘感加重，金箍更亮，虎皮裙纹理更清晰",
    "画幅边缘翻卷起赭色云气与细碎火星，天色转沉",
  ],
  [
    "五层光轮，莲花瓣与火焰背光成形，整体转黑金",
    "金箔增多，火焰背光加厚，甲缝透出的光更亮",
    "金箔满贴，火焰几乎顶到画幅边缘，暗红宝石开始发光",
  ],
  [
    "火焰与莲花瓣填满背景，金箔厚重",
    "金箔最密，火焰最盛，莲瓣边缘熔成流动的金",
    "极盛：火焰与金箔把背景完全吞没，第三只竖眼透出一线金光",
  ],
];

function promptFor(level, name) {
  const rank = rankOf(level);
  const look = LOOKS[rank];
  const dark = level >= 24;
  const page = paletteForFrame(Math.round((level / MAX_LEVEL) * PREVIEW_MAX_FRAME)).page;
  const t = Math.min(1, (level - rank * 6) / 6);
  const step = t < 0.4 ? 0 : t < 0.75 ? 1 : 2;

  const role = name.startsWith("stage-")
    ? "这是本果位的定型帧：构图最完整、最有代表性。"
    : name.startsWith("bridge-")
      ? `这是换装过渡帧：正在从「${RANKS[rank]}」过渡到「${RANKS[Math.min(5, rank + 1)]}」，头饰与肩甲上能同时看到两个果位的元素，处于中间态。`
      : `这是「${RANKS[rank]}」果位内的第 ${(level - rank * 6) + 1}/6 档，强度约 ${Math.round(t * 100)}%。`;

  const palette = dark
    ? `配色：深墨底 ${page}，鎏金与金箔，暗红点缀，冷灰高光。整体压暗，金色是唯一光源。`
    : `配色：宣纸米白底 ${page}，墨黑轮廓，暖灰面部，朱砂红与赭石点缀。整体明亮，纸感强。`;

  return `绘制一张孙悟空半身立绘。

当前果位：「${RANKS[rank]}」，第 ${level} / ${MAX_LEVEL} 级。
头部：${look.head}。
肩部与身体：${look.body}。
光轮：${look.halo}。
本档装饰程度：${ESCALATION[rank][step]}。
${palette}
${role}

${STYLE}
${FORBID}`;
}

// ---- transport --------------------------------------------------------
async function request(path, body) {
  let lastError = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(BASE_URL + path, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(900000),
      });
      const text = await response.text();
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`非 JSON 响应 (HTTP ${response.status}): ${text.slice(0, 160)}`);
      }
      if (payload?.error) {
        const message = payload.error.message ?? JSON.stringify(payload.error);
        // 4xx 里只有限流值得重试，其余立刻抛出来，免得白等。
        if (response.status !== 429 && response.status < 500) {
          throw Object.assign(new Error(message), { fatal: true });
        }
        throw new Error(`HTTP ${response.status}: ${message}`);
      }
      const b64 = payload?.data?.[0]?.b64_json;
      if (!b64) throw new Error("响应里没有 b64_json");
      return Buffer.from(b64, "base64");
    } catch (error) {
      if (error.fatal) throw error;
      lastError = error;
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
  throw lastError;
}

const rawPath = (name) => `${cacheDir}${name}.png`;
const webpPath = (name) => `${outDir}${name}.webp`;

async function draw(name, reference) {
  if (!force && existsSync(rawPath(name)) && statSync(rawPath(name)).size > 1024) return "cached";
  const level = FRAMES.indexOf(name);
  const prompt = promptFor(level, name);

  if (reference !== undefined && existsSync(reference)) {
    const png = await sharp(reference).resize(SIZE, SIZE, { fit: "cover" }).png().toBuffer();
    const buffer = await request("/images/edits", {
      model,
      prompt,
      images: [{ image_url: `data:image/png;base64,${png.toString("base64")}` }],
      n: 1,
      size: `${SIZE}x${SIZE}`,
    });
    writeFileSync(rawPath(name), buffer);
    return "edited";
  }

  writeFileSync(rawPath(name), await request("/images/generations", {
    model,
    prompt,
    n: 1,
    size: `${SIZE}x${SIZE}`,
  }));
  return "drawn";
}

async function rasterize(name) {
  await sharp(readFileSync(rawPath(name)))
    .resize(SIZE, SIZE, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(webpPath(name));
}

/** 定型帧的参考图是上一果位的成品，用来把六张脸串成同一个人。 */
function chainedReference(level) {
  const rank = rankOf(level);
  if (rank === 0) return undefined;
  const previous = webpPath(FRAMES[ANCHORS[rank - 1]]);
  return existsSync(previous) ? previous : undefined;
}

// ---- driver -----------------------------------------------------------
mkdirSync(outDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

const failures = [];

async function run(name, reference) {
  const level = FRAMES.indexOf(name);
  const started = Date.now();
  try {
    const mode = await draw(name, reference);
    await rasterize(name);
    const seconds = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`  ok    ${name.padEnd(9)} L${String(level).padStart(2)}  ${RANKS[rankOf(level)].padEnd(5)} ${mode.padEnd(7)} ${seconds}s`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL  ${name.padEnd(9)} L${String(level).padStart(2)}  ${error.message.slice(0, 150)}`);
  }
}

if (only !== undefined) {
  if (!FRAMES.includes(only)) {
    console.error(`没有这一帧：${only}`);
    process.exit(1);
  }
  const level = FRAMES.indexOf(only);
  const anchor = FRAMES[ANCHORS[rankOf(level)]];
  await run(only, only === anchor ? chainedReference(level) : webpPath(anchor));
  process.exit(failures.length > 0 ? 1 : 0);
}

console.log(`模型 ${model}，帧范围 ${from}..${to}`);
for (let rank = 0; rank < ANCHORS.length; rank += 1) {
  const anchorLevel = ANCHORS[rank];
  const anchorName = FRAMES[anchorLevel];
  if (anchorLevel >= from && anchorLevel <= to) {
    await run(anchorName, chainedReference(anchorLevel));
  }

  const end = Math.min(ANCHORS[rank] + 5, FRAMES.length - 1);
  const siblings = [];
  for (let level = ANCHORS[rank] + 1; level <= end; level += 1) {
    if (level >= from && level <= to) siblings.push(FRAMES[level]);
  }

  // 同一果位内并发，但别把网关打爆。
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, siblings.length) }, async () => {
    while (cursor < siblings.length) {
      const name = siblings[cursor];
      cursor += 1;
      await run(name, webpPath(anchorName));
    }
  }));
}

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} 帧失败：`);
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(1);
}
console.log(`全部完成，输出在 ${outDir}`);
