/**
 * 用真实 Chromium 播放 assets/voice 下的四段音频。
 *
 *   node tools/probe-voice.mjs
 *
 * 起一个本地静态服务器（带 Range 支持）当源，用真实解码器验证：
 * 能不能解码、时长对不对、播放时 currentTime 是否真的在走。
 *
 * 为什么不直接打 DSH 的 URL：GUI 每次启动换 token，外部客户端一律 401，
 * 探针拿不到页面上下文。这里验证的是音频文件本身，与鉴权无关。
 */

import { createServer } from "node:http";
import { createReadStream, readdirSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9487;
const SERVE_PORT = 8791;
const voiceDir = fileURLToPath(new URL("../assets/voice/", import.meta.url));

const files = readdirSync(voiceDir).filter((name) => /^line-\d\.(wav|mp3|m4a|ogg|flac)$/.test(name)).sort();
const types = { wav: "audio/wav", mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", flac: "audio/flac" };

const server = createServer((req, res) => {
  const name = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/^\//, "");
  if (name === "" || name === "index.html") {
    const body = `<!doctype html><meta charset="utf-8"><title>voice</title><body>${files
      .map((f) => `<audio controls src="/${f}"></audio>`)
      .join("")}</body>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
    return;
  }
  if (!files.includes(name)) {
    res.writeHead(404).end();
    return;
  }
  const path = join(voiceDir, name);
  const size = statSync(path).size;
  const extension = name.split(".").pop();
  const range = req.headers.range;
  if (range) {
    const match = range.match(/bytes=(\d+)-(\d*)/);
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    res.writeHead(206, {
      "Content-Type": types[extension],
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    });
    createReadStream(path, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    "Content-Type": types[extension],
    "Content-Length": String(size),
    "Accept-Ranges": "bytes",
  });
  createReadStream(path).pipe(res);
});

await new Promise((resolve) => server.listen(SERVE_PORT, "127.0.0.1", resolve));

const dir = mkdtempSync(join(tmpdir(), "voice-probe-"));
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${join(dir, "profile")}`,
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
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

const evaluate = async (send, expression, userGesture = false) => {
  const reply = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture,
  });
  if (reply.result?.exceptionDetails) return { __error: reply.result.exceptionDetails.text };
  return reply.result?.result?.value;
};

try {
  const { send, socket } = await attach();
  await send("Runtime.enable");
  await sleep(1500);

  // 音频自动播放需要用户手势。真实用户拖动滑块就是手势，所以这里
  // 用 CDP 的 userGesture 复现同一条件——否则 headless 一律 NotAllowedError，
  // 测出来的「失败」是浏览器策略，跟音频质量无关。
  await evaluate(send, "document.body.click()", true);

  console.log(`源: http://127.0.0.1:${SERVE_PORT}`);
  console.log(`文件: ${files.join(", ")}`);
  console.log("");

  const results = await evaluate(send, `
    (async () => {
      const names = ${JSON.stringify(files)};
      const out = [];
      for (const name of names) {
        const a = new Audio("/" + name);
        a.volume = 1;
        const meta = await new Promise((res) => {
          a.addEventListener("loadedmetadata", () => res({ ok: true, duration: a.duration }), { once: true });
          a.addEventListener("error", () => res({ ok: false, code: a.error?.code }), { once: true });
          setTimeout(() => res({ ok: false, code: "timeout" }), 8000);
        });
        let play;
        try { await a.play(); play = "played"; }
        catch (e) { play = e.name; }
        await new Promise((r) => setTimeout(r, 700));
        const advanced = a.currentTime > 0.1;
        const t = Number(a.currentTime.toFixed(2));
        a.pause();
        out.push({ name, ...meta, play, advanced, t });
      }
      return out;
    })()
  `, true);

  let bad = 0;
  for (const r of results ?? []) {
    const ok = r.ok === true && r.play === "played" && r.advanced === true && r.duration > 0.5;
    if (!ok) bad += 1;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${r.name.padEnd(12)} ${r.duration?.toFixed?.(2) ?? "?"}s  play=${r.play}  advanced=${r.advanced}  t=${r.t}`,
    );
  }
  console.log("");
  console.log(bad === 0 ? "四段全部可播放，且 currentTime 真的在走。" : `${bad} 段有问题。`);

  socket.close();
} finally {
  chrome.kill();
  server.close();
  await sleep(500);
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // profile locked
  }
}
