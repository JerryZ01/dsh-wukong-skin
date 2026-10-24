/**
 * 在「滑动变祖」与「滑动变佛」之间切换。
 *
 * 两个皮肤都会往 body 前插背景层、都会覆写同一批 --dsw-alias-* 变量，
 * 同时启用会互相盖住，所以同一 profile 里只能留一个。
 * 它们的依赖都还在，切换只是改 `dsh.profile.bundles` 这一个数组。
 *
 *   node tools/switch-skin.mjs             # 看当前状态
 *   node tools/switch-skin.mjs liang       # 切到滑动变祖
 *   node tools/switch-skin.mjs wukong      # 切到滑动变佛
 *   node tools/switch-skin.mjs off         # 两个都关掉
 *
 * 切完必须**完全退出并重新打开** DSH，bundles 只在启动时读一次。
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";

const PROFILES_DIR = join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "profiles");

const SKINS = {
  wukong: {
    label: "滑动变佛",
    dependency: "@daily-vibe/dsh-client-wukong-intensity-skin",
  },
  liang: {
    label: "滑动变祖",
    dependency: "@leon___/dsh-client-liang-intensity-skin",
  },
};

const args = process.argv.slice(2);
const profileName = process.env.DSH_PROFILE ?? "desktop";
const profileDir = join(PROFILES_DIR, profileName);
const packageFile = join(profileDir, "package.json");

if (!existsSync(packageFile)) {
  console.error(`找不到 profile：${packageFile}`);
  process.exit(1);
}

const text = readFileSync(packageFile, "utf8");
const pkg = JSON.parse(text);
const bundles = pkg.dsh?.profile?.bundles;
if (!Array.isArray(bundles)) {
  console.error("这个 profile 的 package.json 里没有 dsh.profile.bundles。");
  process.exit(1);
}

const skinsOf = (list) => Object.entries(SKINS).filter(([, skin]) => list.includes(skin.dependency));

const describe = (list) => {
  const active = skinsOf(list);
  if (active.length === 0) return "当前：没有启用任何强度皮肤";
  if (active.length === 1) return `当前：${active[0][1].label}（${active[0][1].dependency}）`;
  return `当前：!! 同时启用了 ${active.map(([, skin]) => skin.label).join(" + ")}，会互相覆盖`;
};

const target = args[0];

if (target === undefined) {
  console.log(describe(bundles));
  console.log("");
  console.log("可用：node tools/switch-skin.mjs [liang|wukong|off]");
  process.exit(0);
}

if (target !== "off" && SKINS[target] === undefined) {
  console.error(`未知目标：${target}（可选 liang / wukong / off）`);
  process.exit(1);
}

// 先把所有已知皮肤摘掉，再按目标插回一个，顺序保持其余 bundle 不变。
const without = bundles.filter((name) => !Object.values(SKINS).some((skin) => skin.dependency === name));
const next = target === "off" ? without : [...without, SKINS[target].dependency];

if (next.join("\n") === bundles.join("\n")) {
  console.log(describe(bundles));
  console.log("已经是这个状态，无需改动。");
  process.exit(0);
}

for (const skin of Object.values(SKINS)) {
  if (!next.includes(skin.dependency) && !pkg.dependencies?.[skin.dependency]) {
    console.warn(`注意：${skin.label} 的依赖不在 dependencies 里，切回去之前需要先安装。`);
  }
}

pkg.dsh.profile.bundles = next;
// 保留原文件的缩进与末尾换行，避免把 profile 文件改得面目全非。
writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log(describe(next));
console.log("");
console.log("已写入 " + packageFile);
console.log("下一步：完全退出 DSH（包括托盘图标）再重新打开。");
