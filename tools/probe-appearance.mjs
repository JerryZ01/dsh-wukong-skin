/**
 * 用真实 Chromium 渲染外观按钮，确认改名后文案正确、不折行。
 *
 *   node tools/probe-appearance.mjs
 *
 * 起一个静态页，把 skin.css 套上一个模拟的宿主 cube row（三个原生按钮 + 我们的
 * 第四个），量出按钮宽度与行高。字号固定 14px，五个汉字若被折成两行，高度会
 * 明显超过单行的 22px。
 */

import { createServer } from "node:http";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9488;
const SERVE_PORT = 8792;
const css = readFileSync(fileURLToPath(new URL("../src/client/skin.css", import.meta.url)), "utf8");

const page = `<!doctype html>
<meta charset="utf-8">
<title>appearance</title>
<style>
:root {
  --dsw-alias-border-l2: #ccc;
  --dsw-alias-label-primary: #111;
  --dsw-alias-interactive-bg-hover: #eee;
  --dsw-alias-bg-module-platform: #fafafa;
  --dsw-static-neutral-bluish-400: #4a7;
}
body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
/* 模拟宿主：三个原生 cube + 我们追加的第四个，放在一个固定宽度的容器里 */
.host-narrow { width: 720px; }
${css}
</style>
<body>
<div class="host-narrow">
  <div class="_cubeRow_x1">
    <button class="_themeCube_a">浅色</button>
    <button class="_themeCube_a">深色</button>
    <button class="_themeCube_a">跟随系统</button>
    <button class="wk-appearance-choice" aria-pressed="true">
      <span class="wk-appearance-choice__icon" aria-hidden="true">☯</span>
      <span class="wk-appearance-choice__label">如意金箍棒</span>
    </button>
  </div>
</div>
</body>`;

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(page);
});
await new Promise((resolve) => server.listen(SERVE_PORT, "127.0.0.1", resolve));

const dir = mkdtempSync(join(tmpdir(), "appearance-probe-"));
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${join(dir, "profile")}`,
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--window-size=1280,800",
  `http://127.0.0.1:${SERVE_PORT}/`,
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function attach() {
  let target = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      target = list.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
      if (target) break;
    } catch {
      // not ready
    }
    await sleep(250);
  }
  if (!target) throw new Error("chrome did not expose a page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      waiter(message);
    }
  });
  const send = (method, params) =>
    new Promise((resolve) => {
      const messageId = (id += 1);
      pending.set(messageId, resolve);
      socket.send(JSON.stringify({ id: messageId, method, params }));
    });
  return { send, socket };
}

try {
  const { send, socket } = await attach();
  await send("Runtime.enable");
  await sleep(600);

  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector(".wk-appearance-choice");
      const label = document.querySelector(".wk-appearance-choice__label");
      const b = btn.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      const cs = getComputedStyle(label);
      return {
        text: label.textContent,
        buttonW: Math.round(b.width),
        buttonH: Math.round(b.height),
        labelW: Math.round(l.width),
        labelH: Math.round(l.height),
        whiteSpace: cs.whiteSpace,
        lineHeight: Math.round(parseFloat(cs.lineHeight)),
        font: Math.round(parseFloat(cs.fontSize)),
        slots: document.querySelector(".host-narrow > div").children.length,
      };
    })()`,
    returnByValue: true,
  });

  const r = result.result.result.value;
  console.log("文案: " + r.text);
  console.log(`按钮: ${r.buttonW} x ${r.buttonH}px`);
  console.log(`文字: ${r.labelW} x ${r.labelH}px (font ${r.font}px, line-height ${r.lineHeight}px)`);
  console.log(`white-space: ${r.whiteSpace}`);
  console.log(`槽位: ${r.slots}（应为 4）`);
  console.log("");

  const checks = [
    ["文案是如意金箍棒", r.text === "如意金箍棒"],
    ["不折行（高度未超单行）", r.labelH <= r.lineHeight + 2],
    ["五个字放得下", r.labelW > 0 && r.labelW < r.buttonW],
    ["第四个槽位存在", r.slots === 4],
  ];
  let bad = 0;
  for (const [name, ok] of checks) {
    if (!ok) bad += 1;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${name}`);
  }
  console.log("");
  console.log(bad === 0 ? "外观按钮渲染正常。" : `${bad} 项有问题。`);

  socket.close();
} finally {
  chrome.kill();
  server.close();
  await sleep(400);
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // profile locked
  }
}
