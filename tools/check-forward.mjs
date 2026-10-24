/**
 * 一致性检查：源码、资源路由、实际文件三者必须对得上。
 *
 *   node tools/check-forward.mjs
 *
 * 检查四件事：
 *   1. `src/client/index.jsx` 的 PORTRAIT_ANCHORS 与 `src/index.js` 的 FRAMES 完全一致
 *   2. 两者引用的每个 WebP 都真的在 `assets/portrait/` 里
 *   3. `assets/portrait/` 里没有没人引用的多余图
 *   4. 每张图都够大（不是被截断的空文件）
 *
 * 这条最容易被忽略：只改一处帧表，装上去就是 404 或者某几档空白。
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, "utf8");

const client = read("src/client/index.jsx");
const server = read("src/index.js");

// 客户端：{ level: 0, file: "stage-00.webp" }
const clientFiles = [...client.matchAll(/file:\s*"([^"]+\.webp)"/g)].map((match) => match[1]);

// 宿主：FRAMES 是一个纯字符串数组，帧名不带扩展名。
const framesBlock = server.match(/const FRAMES = \[([\s\S]*?)\];/);
assert.ok(framesBlock, "src/index.js 里找不到 FRAMES 数组");
const serverFiles = [...framesBlock[1].matchAll(/"([^"]+)"/g)].map((match) => `${match[1]}.webp`);

assert.equal(clientFiles.length > 0, true, "客户端没有解析出任何帧");
assert.equal(serverFiles.length > 0, true, "宿主没有解析出任何帧");
assert.deepEqual(
  clientFiles,
  serverFiles,
  "PORTRAIT_ANCHORS 与 FRAMES 不一致：两处必须逐一对应",
);

const onDisk = readdirSync(`${root}assets/portrait`).filter((name) => name.endsWith(".webp")).sort();
const referenced = [...new Set(clientFiles)].sort();

const missing = referenced.filter((name) => !onDisk.includes(name));
const extra = onDisk.filter((name) => !referenced.includes(name));
assert.deepEqual(missing, [], `这些帧被引用但文件不存在：${missing.join(", ")}`);
assert.deepEqual(extra, [], `这些文件存在但没人引用：${extra.join(", ")}`);

// 一张 1024×1024 的 WebP 不会小于 20 KB；比这小基本是截断或占位。
for (const name of onDisk) {
  const { size } = statSync(`${root}assets/portrait/${name}`);
  assert.ok(size > 20_000, `${name} 看起来被截断了（${size} 字节）`);
}

console.log(`forward check passed: ${onDisk.length} frames, client and host agree`);
