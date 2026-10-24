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

check("registers one exact route per shipped frame", () => {
  assert.ok(routes.size >= 31, `expected >= 31 routes, got ${routes.size}`);
  for (const path of routes.keys()) {
    assert.ok(path.startsWith(ASSET_PREFIX), `route escaped the prefix: ${path}`);
  }
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

check("every route resolves to a real WebP on disk", () => {
  const broken = [];
  for (const path of routes.keys()) {
    const name = path.slice(ASSET_PREFIX.length);
    const file = fileURLToPath(new URL(`../assets/${name}`, import.meta.url));
    if (!statSync(file).isFile()) broken.push(name);
  }
  assert.deepEqual(broken, []);
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
