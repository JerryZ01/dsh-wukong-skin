/**
 * 把下载来的原声素材接进插件。
 *
 *   node tools/import-voice.mjs
 *   node tools/import-voice.mjs --from "D:\\下载\\悟空"
 *   node tools/import-voice.mjs --list
 *
 * 从 --from（默认 .cache/raw-voice/）里找出每句对应的音频，
 * 统一转成 16kHz 单声道，写进 assets/voice/line-N.wav。
 *
 * 四句台词（按烈度递增）：
 *   0  俺老孙来也！
 *   1  俺上天看看路径，日后好带你们上去同住。
 *   2  妖怪，哪里跑！
 *   3  吃俺老孙一棒！
 *
 * 为什么是 16kHz 单声道：台词就三五秒，人声有效频段在 8kHz 以内，
 * 再高的采样率只是让仓库变大。
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/**
 * 四句台词，和 src/client/logic.js 的 LINES 对应。
 *
 * `match` 是用来认下载文件的关键词。音效站导出的文件名通常长这样：
 *   孙悟空：俺老孙来也！_爱给网_aigei_com.mp3
 * 没有句号可依，所以按内容匹配，而不是靠 rank-N 命名。
 * 顺序有讲究：越具体的越靠前，避免「俺老孙」这种泛词抢先命中。
 */
/**
 * 四句台词，和 src/client/logic.js 的 LINES 下标一一对应。
 *
 * 顺序按「烈度」递增：登场 → 谋划 → 追打 → 动手。
 * 不是按剧情先后，而是按听感——越往上拖，语气越燥。
 *
 * `match` 是用来认下载文件的关键词。音效站导出的文件名通常长这样：
 *   孙悟空：俺老孙来也！_爱给网_aigei_com.mp3
 * 没有句号可依，所以按内容匹配，而不是靠 rank-N 命名。
 */
const LINES = [
  {
    index: 0,
    text: "俺老孙来也！",
    match: ["来也"],
  },
  {
    index: 1,
    text: "俺上天看看路径，日后好带你们上去同住。",
    match: ["上天看看", "路径", "同住"],
  },
  {
    index: 2,
    text: "妖怪，哪里跑！",
    match: ["哪里跑", "妖怪"],
  },
  {
    index: 3,
    text: "吃俺老孙一棒！",
    match: ["一棒", "吃俺老孙"],
  },
];

// ffmpeg：优先用环境变量，其次用 imageio-ffmpeg 自带的那个。
function findFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try {
    const bundled = execFileSync(process.env.PYTHON ?? "python", [
      "-c",
      "import imageio_ffmpeg,sys;sys.stdout.write(imageio_ffmpeg.get_ffmpeg_exe())",
    ], { encoding: "utf8" }).trim();
    if (bundled && existsSync(bundled)) return bundled;
  } catch {
    // 没装 imageio-ffmpeg
  }
  return "ffmpeg";
}

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".wma"];

const fromDir = (() => {
  const index = process.argv.indexOf("--from");
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fileURLToPath(new URL("../.cache/raw-voice/", import.meta.url));
})();

const outDir = fileURLToPath(new URL("../assets/voice/", import.meta.url));
mkdirSync(outDir, { recursive: true });

if (!existsSync(fromDir)) {
  console.log(`素材目录不存在：${fromDir}`);
  console.log("");
  console.log("把下载来的原声放进去，文件名里带上句号就行，例如：");
  for (const line of LINES) {
    console.log(`  line-${line.index}.mp3   ${line.text}`);
  }
  console.log("");
  console.log("也可以先跑 node tools/import-voice.mjs --list 看目录里现在有什么。");
  process.exit(0);
}

const files = readdirSync(fromDir).filter((name) => {
  const lower = name.toLowerCase();
  return AUDIO_EXTENSIONS.some((extension) => lower.endsWith(extension));
});

if (process.argv.includes("--list")) {
  console.log(`目录：${fromDir}`);
  console.log(`${files.length} 个音频文件`);
  for (const name of files) {
    const kb = Math.round(statSync(join(fromDir, name)).size / 1024);
    console.log(`  ${name.padEnd(40)} ${kb} KB`);
  }
  process.exit(0);
}

if (files.length === 0) {
  console.log(`目录里没有音频文件：${fromDir}`);
  console.log(`支持的扩展名：${AUDIO_EXTENSIONS.join(" ")}`);
  process.exit(1);
}

/**
 * 认一个文件属于哪一句。
 *
 * 优先看文件名里的 `line-N` 显式编号（最可靠，也方便手动指定）；
 * 没有编号就退回关键词匹配。两套都认，因为素材来自不同地方，
 * 命名风格完全不统一。
 */
function lineForName(name) {
  const explicit = name.match(/line-([0-3])/i);
  if (explicit) return Number(explicit[1]);

  const lower = name.toLowerCase();
  for (const line of LINES) {
    if (line.match.some((word) => lower.includes(word.toLowerCase()))) {
      return line.index;
    }
  }
  return null;
}

const picked = new Map();
for (const name of files) {
  const line = lineForName(name);
  if (line === null) {
    console.log(`  跳过（认不出是哪一句）：${name}`);
    console.log(`       改名成 line-0 ~ line-3 就能强制指定`);
    continue;
  }
  if (picked.has(line)) {
    console.log(`  警告：line-${line} 有多个候选，用第一个：${picked.get(line)}，忽略 ${name}`);
    continue;
  }
  picked.set(line, name);
}

if (picked.size === 0) {
  console.log("一个都没对上。把文件名改成 line-0.mp3 ~ line-3.mp3 即可，例如：");
  for (const line of LINES) console.log(`  line-${line.index}.mp3   ${line.text}`);
  process.exit(1);
}

const ffmpeg = findFfmpeg();
console.log(`ffmpeg: ${ffmpeg}`);
console.log(`素材目录：${fromDir}`);
console.log("");

let failed = 0;
for (const [line, name] of [...picked.entries()].sort((a, b) => a[0] - b[0])) {
  const source = join(fromDir, name);
  const target = join(outDir, `line-${line}.wav`);
  try {
    execFileSync(ffmpeg, [
      "-y", "-loglevel", "error",
      "-i", source,
      "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le",
      target,
    ], { stdio: ["ignore", "pipe", "pipe"] });

    const size = statSync(target).size;
    console.log(`  ok   line-${line}  <- ${name}  ${Math.round(size / 1024)} KB   ${LINES[line].text}`);
  } catch (error) {
    failed += 1;
    const detail = error.stderr?.toString().split("\n").slice(0, 2).join(" ") ?? String(error);
    console.log(`  FAIL line-${line}  <- ${name}  ${detail}`);
  }
}

const missing = LINES.filter((line) => !picked.has(line.index)).map((line) => line.index);

console.log("");
if (missing.length > 0) {
  console.log(`还缺这几句：${missing.map((l) => `line-${l}`).join(", ")}`);
  for (const index of missing) console.log(`  line-${index}  ${LINES[index].text}`);
  console.log("缺的那句不会出声，其余正常。");
}
if (failed > 0) {
  console.log(`${failed} 个转换失败。`);
  process.exit(1);
}
console.log("完成。重启 DSH 后生效。");
