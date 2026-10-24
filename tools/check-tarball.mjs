/**
 * 发布检查：`npm pack` 真正会打进包里的东西，必须够用。
 *
 *   node tools/check-tarball.mjs
 *
 * check-pack.mjs 验的是「声明的路径存在」，这一条验的是「npm 实际装进包的
 * 内容对」。差一个没被 `files` 覆盖的目录、`files` 写漏一项，npm publish 都
 * 会成功，但用户装下来缺资源。
 *
 * 走 `npm pack --dry-run --json` 而不是解 tarball：Windows 上 `tar -tzf` 输出
 * 是 UTF-16LE，按文本匹配会全部落空。
 */

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// Node 24 在 Windows 上不再允许直接 spawn `.cmd`（EINVAL），而 execFileSync 传
// 参数数组又需要 shell:true（触发 DEP0190）。这里用一个命令字符串交给 execSync，
// 参数全是常量、没有外部输入，不存在注入面。
const raw = execSync("npm pack --dry-run --json", {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  maxBuffer: 32 * 1024 * 1024,
});

// npm 有时会在 JSON 前面打公告行，从第一个 `[` 开始截。
const info = JSON.parse(raw.slice(raw.indexOf("[")))[0];
const paths = info.files.map((file) => file.path);

// 装上就必须在的东西。少一个，插件要么没有浏览器半部，要么某几档空白。
const required = [
  "lib/client.js",
  "cordis.patch.yml",
  "src/index.js",
  "package.json",
  "README.md",
  "LICENSE",
];

const missing = required.filter((path) => !paths.includes(path));
assert.deepEqual(missing, [], `这些文件没被打进包里：${missing.join(", ")}`);

// 源映射可以不带，带了也不算错；但客户端产物必须有。
assert.ok(
  paths.some((path) => path.startsWith("src/")),
  "包里没有任何 src/ 文件，宿主半部会加载失败",
);

// 31 帧一张都不能少——少一张就是某一档的空白。
const frames = paths.filter((path) => /^assets\/portrait\/.*\.webp$/.test(path));
assert.equal(frames.length, 31, `人像帧数应为 31，实际 ${frames.length}`);

// 六个果位定型帧是关键参考图，单独点名。
for (const name of ["stage-00", "stage-06", "stage-12", "stage-18", "stage-24", "stage-30"]) {
  assert.ok(
    paths.includes(`assets/portrait/${name}.webp`),
    `果位定型帧 ${name}.webp 不在包里`,
  );
}

// 打包体积失控通常意味着误把 .cache 或 node_modules 收进来了。
const megabytes = info.size / 1024 / 1024;
assert.ok(
  megabytes < 20,
  `包体积 ${megabytes.toFixed(1)} MB 超出预期，检查 files 是否漏排除缓存目录`,
);

console.log(
  `tarball check passed: ${info.entryCount} entries, ${frames.length} frames, ${megabytes.toFixed(1)} MB`,
);
