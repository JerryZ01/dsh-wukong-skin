/**
 * 打包检查：`package.json` 里声明的每个入口和发布文件都必须真的存在。
 *
 *   node tools/check-pack.mjs
 *
 * 这条防的是发布事故：`files` 里写错一个目录、`exports` 指向一个漏提交的
 * 产物，`npm publish` 照样会成功，但别人装下来就是坏的。
 */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// 有人用记事本改过 package.json 就会带 BOM，JSON.parse 会直接抛；
// 这里主动剥掉，让检查报出真正的问题而不是编码问题。
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8").replace(/^\uFEFF/, ""));

const problems = [];

const check = (label, path) => {
  const full = `${root}${path.replace(/^\.\//, "")}`;
  if (!existsSync(full)) {
    problems.push(`${label} → ${path} (不存在)`);
    return;
  }
  const st = statSync(full);
  if (st.isDirectory()) {
    if (readdirSync(full).length === 0) problems.push(`${label} → ${path} (空目录)`);
  } else if (st.size === 0) {
    problems.push(`${label} → ${path} (空文件)`);
  }
};

// 入口：main 与 exports 的每个字符串值。`./package.json` 之类也一并在内。
check("main", pkg.main);

for (const [key, value] of Object.entries(pkg.exports ?? {})) {
  if (typeof value === "string") {
    check(`exports["${key}"]`, value);
  } else if (value && typeof value === "object") {
    for (const [sub, target] of Object.entries(value)) {
      if (typeof target === "string") check(`exports["${key}"]["${sub}"]`, target);
    }
  }
}

// dsh 补丁文件：宿主启动时按这个路径找，找不到插件就静默不生效。
if (pkg.dsh?.bundle?.patch) check("dsh.bundle.patch", pkg.dsh.bundle.patch);

// 浏览器半部的产物：漏提交就不会被打进包里。
if (pkg.dsh?.client) check("dsh.client.bundle", pkg.exports?.["./client"] ?? "./lib/client.js");

for (const entry of pkg.files ?? []) check("files", entry);

assert.deepEqual(problems, [], `package.json 声明了不存在的路径：\n  ${problems.join("\n  ")}`);

console.log(
  `pack check passed: main + exports + dsh patch + ${(pkg.files ?? []).length} files entries all exist`,
);
