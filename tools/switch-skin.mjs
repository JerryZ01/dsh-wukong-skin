/**
 * 开关这个皮肤。
 *
 * 皮肤会往 body 前插背景层、覆写一批 --dsw-alias-* 变量、调用 theme.setTheme()，
 * 和同类皮肤同时启用会互相盖住。所以这里只动 `dsh.profile.bundles` 一个数组：
 * 要么把它加进去，要么摘掉，其余 bundle 一律不碰。
 *
 *   node tools/switch-skin.mjs             # 看当前状态
 *   node tools/switch-skin.mjs on          # 启用
 *   node tools/switch-skin.mjs off         # 停用
 *
 * 改完必须**完全退出并重新打开** DSH，bundles 只在启动时读一次。
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROFILES_DIR = join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "profiles");

const PLUGIN = {
  label: "如意金箍棒",
  dependency: "@daily-vibe/dsh-client-wukong-intensity-skin",
};

const args = process.argv.slice(2);
const profileName = process.env.DSH_PROFILE ?? "desktop";
const profileDir = join(PROFILES_DIR, profileName);
const packageFile = join(profileDir, "package.json");

if (!existsSync(packageFile)) {
  console.error(`找不到 profile：${packageFile}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(packageFile, "utf8"));
const bundles = pkg.dsh?.profile?.bundles;
if (!Array.isArray(bundles)) {
  console.error("这个 profile 的 package.json 里没有 dsh.profile.bundles。");
  process.exit(1);
}

const enabled = bundles.includes(PLUGIN.dependency);
const describe = () =>
  enabled
    ? `当前：${PLUGIN.label} 已启用（${PLUGIN.dependency}）`
    : `当前：${PLUGIN.label} 未启用`;

const target = args[0];

if (target === undefined) {
  console.log(describe());
  if (!pkg.dependencies?.[PLUGIN.dependency]) {
    console.log("注意：依赖不在 dependencies 里，启用前需要先安装。");
  }
  console.log("");
  console.log("可用：node tools/switch-skin.mjs [on|off]");
  process.exit(0);
}

if (target !== "on" && target !== "off") {
  console.error(`未知目标：${target}（可选 on / off）`);
  process.exit(1);
}

const want = target === "on";

if (want === enabled) {
  console.log(describe());
  console.log("已经是这个状态，无需改动。");
  process.exit(0);
}

// 只增删自己这一个元素，其余 bundle 的顺序与内容原样保留。
const next = want
  ? [...bundles, PLUGIN.dependency]
  : bundles.filter((name) => name !== PLUGIN.dependency);

if (want && !pkg.dependencies?.[PLUGIN.dependency]) {
  console.warn(`注意：${PLUGIN.dependency} 不在 dependencies 里，先装再启用。`);
}

pkg.dsh.profile.bundles = next;
// 保留原文件的缩进与末尾换行，避免把 profile 文件改得面目全非。
writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log(target === "on" ? `已启用 ${PLUGIN.label}` : `已停用 ${PLUGIN.label}`);
console.log("");
console.log("已写入 " + packageFile);
console.log("下一步：完全退出 DSH（包括托盘图标）再重新打开。");
