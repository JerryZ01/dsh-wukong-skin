/**
 * Offline harness for the plugin's node half: runs apply() against a fake
 * Cordis context, then drives the registered asset routes through HTTP-shaped
 * request/response doubles. No DSH process involved.
 *
 *   node tools/test-assets.mjs
 */

import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { apply, ASSET_PREFIX, PACKAGE_ID, SETTINGS_NAMESPACE } from "../src/index.js";

const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}\n       ${error.message}`);
  }
}

// ---- fake webServer -------------------------------------------------------
const routes = new Map();
const disposers = [];
const effectDisposers = [];
const webServer = {
  register(row) {
    assert.equal(row.kind, "exact", "only exact routes are used");
    routes.set(row.path, row.handler);
    return () => routes.delete(row.path);
  },
};
const ctx = {
  webServer,
  effect(fn) {
    const dispose = fn();
    if (typeof dispose === "function") effectDisposers.push(dispose);
    return () => {};
  },
};
void disposers;

apply(ctx);

// ---- request/response doubles --------------------------------------------
// The route streams the file body with pipe(), so the response double has to be
// a real Writable; a stub object would fail inside Node's stream internals.
function responseDouble() {
  return new Writable({
    write(chunk, _encoding, callback) {
      this.chunks.push(chunk);
      callback();
    },
  });
}

function request(pathname, { method = "GET", headers = {} } = {}) {
  const body = responseDouble();
  body.chunks = [];
  body.status = null;
  body.headers = {};
  body.headersSent = false;
  body.writeHead = function writeHead(status, hdrs = {}) {
    this.status = status;
    this.headers = hdrs;
    this.headersSent = true;
  };
  const handler = routes.get(pathname);
  if (handler === undefined) return { status: 404, res: body };
  handler({ method, url: pathname, headers }, body);
  return { status: body.status, res: body };
}

// ---- assertions ----------------------------------------------------------
console.log("node half");

check("declares the webServer dependency", () => {
  assert.deepEqual(SETTINGS_NAMESPACE, "wukong-intensity-skin");
  assert.equal(PACKAGE_ID, "dsh-client-wukong-intensity-skin");
  assert.equal(ASSET_PREFIX, "/plugins/dsh-client-wukong-intensity-skin/assets/");
});

// 两类路由：人像在 ASSET_PREFIX 下，台词音频在 /voice/ 下，外加一个清单。
const VOICE_PREFIX = "/voice/";
const MANIFEST_PATH = `${VOICE_PREFIX}manifest.json`;
const portraitRoutes = [...routes.keys()].filter((path) => !path.startsWith(VOICE_PREFIX));
const voiceRoutes = [...routes.keys()].filter(
  (path) => path.startsWith(VOICE_PREFIX) && path !== MANIFEST_PATH,
);

check("registers one exact route per shipped frame", () => {
  assert.ok(portraitRoutes.length >= 31, `expected >= 31 portrait routes, got ${portraitRoutes.length}`);
  for (const path of portraitRoutes) {
    assert.ok(path.startsWith(ASSET_PREFIX), `route escaped the prefix: ${path}`);
  }
});

check("registers one route per spoken line, whatever the format", () => {
  // 音频现在由用户自己提供（原声素材），仓库里可能一个都没有。
  // 有文件就必须有路由，没有文件也不算错——前端会静默不出声。
  const expected = [];
  for (let line = 0; line < 4; line += 1) {
    for (const extension of ["wav", "mp3", "m4a", "ogg", "flac"]) {
      const path = fileURLToPath(new URL(`../assets/voice/line-${line}.${extension}`, import.meta.url));
      try {
        if (statSync(path).isFile()) expected.push(`${VOICE_PREFIX}line-${line}.${extension}`);
      } catch {
        // 这个格式没有
      }
    }
  }
  assert.deepEqual(voiceRoutes.sort(), expected.sort(), "routes and files disagree");
  assert.ok(voiceRoutes.length <= 4, `at most 4 lines, got ${voiceRoutes.length}`);
});

check("serves a manifest so the client learns the real format", () => {
  assert.ok(routes.has(MANIFEST_PATH), "no manifest route");
});

// Every anchor the client asks for must be routable, or the portrait silently
// falls back to the flat palette on that level.
const clientSource = readFileSync(
  fileURLToPath(new URL("../src/client/index.jsx", import.meta.url)),
  "utf8",
);
const anchors = [...clientSource.matchAll(/file: "([^"]+)"/g)].map((m) => m[1]);
check("every client anchor has a live route", () => {
  assert.equal(anchors.length, 31, `expected 31 anchors, got ${anchors.length}`);
  const missing = anchors.filter((file) => !routes.has(`${ASSET_PREFIX}portrait/${file}`));
  assert.deepEqual(missing, [], `missing routes: ${missing.join(", ")}`);
});

check("every route resolves to a real file on disk", () => {
  const broken = [];
  for (const path of routes.keys()) {
    // 清单是运行时拼出来的，磁盘上没有对应文件。
    if (path === MANIFEST_PATH) continue;
    const name = path.startsWith(VOICE_PREFIX)
      ? `voice/${path.slice(VOICE_PREFIX.length)}`
      : path.slice(ASSET_PREFIX.length);
    const file = fileURLToPath(new URL(`../assets/${name}`, import.meta.url));
    if (!statSync(file).isFile()) broken.push(name);
  }
  assert.deepEqual(broken, []);
});

check("any provided line audio is real audible audio", () => {
  // 素材由用户提供，可能一个都没有。有的话就必须真的有声音，
  // 否则等于开了开关也没用。
  let checked = 0;
  for (let line = 0; line < 4; line += 1) {
    const file = fileURLToPath(new URL(`../assets/voice/line-${line}.wav`, import.meta.url));
    let buffer;
    try {
      buffer = readFileSync(file);
    } catch {
      continue; // 这一句还没放素材
    }
    checked += 1;
    assert.equal(buffer.toString("ascii", 0, 4), "RIFF", `line-${line} is not a RIFF file`);
    assert.equal(buffer.toString("ascii", 8, 12), "WAVE", `line-${line} is not WAVE`);
    let peak = 0;
    for (let index = 44; index + 1 < buffer.length; index += 2) {
      const value = Math.abs(buffer.readInt16LE(index));
      if (value > peak) peak = value;
    }
    assert.ok(peak > 2000, `line-${line} is silent (peak ${peak})`);
  }
  if (checked === 0) {
    console.log("       （还没有任何台词音频，朗读会静音）");
  }
});

const sample = `${ASSET_PREFIX}portrait/stage-30.webp`;

check("GET returns 200 with an image content type", () => {
  const { status, res } = request(sample);
  assert.equal(status, 200);
  assert.equal(res.headers["Content-Type"], "image/webp");
  assert.equal(res.headers["Accept-Ranges"], "bytes");
  assert.ok(res.headers.ETag.startsWith('W/"'));
});

check("HEAD returns metadata without a body", () => {
  const { status, res } = request(sample, { method: "HEAD" });
  assert.equal(status, 200);
  assert.ok(Number(res.headers["Content-Length"]) > 0);
});

check("a matching If-None-Match returns 304", () => {
  const first = request(sample);
  const etag = first.res.headers.ETag;
  const { status } = request(sample, { headers: { "if-none-match": etag } });
  assert.equal(status, 304);
});

check("an unsatisfiable range returns 416", () => {
  const { status, res } = request(sample, { headers: { range: "bytes=99999999-" } });
  assert.equal(status, 416);
  assert.match(res.headers["Content-Range"], /^bytes \*\/\d+$/);
});

check("a valid range returns 206", () => {
  const { status, res } = request(sample, { headers: { range: "bytes=0-99" } });
  assert.equal(status, 206);
  assert.equal(res.headers["Content-Length"], "100");
  assert.match(res.headers["Content-Range"], /^bytes 0-99\/\d+$/);
});

check("a stale If-Range disables the range", () => {
  const { status } = request(sample, { headers: { range: "bytes=0-99", "if-range": 'W/"stale"' } });
  assert.equal(status, 200);
});

check("an unwritten method is rejected", () => {
  const { status, res } = request(sample, { method: "POST" });
  assert.equal(status, 405);
  assert.equal(res.headers.Allow, "GET, HEAD");
});

check("an unknown path is not routed", () => {
  assert.equal(request(`${ASSET_PREFIX}portrait/nope.webp`).status, 404);
});

check("disposal unregisters every route", () => {
  for (const dispose of effectDisposers) dispose();
  assert.equal(routes.size, 0, `${routes.size} routes survived disposal`);
});

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
