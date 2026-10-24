import { createReadStream, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSingleRange } from "./range.js";

export { parseSingleRange } from "./range.js";

export const PACKAGE_ID = "dsh-client-wukong-intensity-skin";
export const SETTINGS_NAMESPACE = "wukong-intensity-skin";
export const ASSET_PREFIX = `/plugins/${PACKAGE_ID}/assets/`;

// The 31-frame ladder mirrors the reasoning axis: 0-30 plus the frame-15 and
// frame-27 bridges that carry the costume change without a visible jump.
const FRAMES = [
  "stage-00",
  "level-01", "level-02", "level-03", "level-04", "level-05",
  "stage-06",
  "level-07", "level-08", "level-09", "level-10", "level-11",
  "stage-12",
  "level-13", "level-14",
  "bridge-15",
  "level-16", "level-17",
  "stage-18",
  "level-19", "level-20", "level-21", "level-22", "level-23",
  "stage-24",
  "level-25", "level-26",
  "bridge-27",
  "level-28", "level-29", "stage-30",
];

const ASSET_SPECS = FRAMES.map((name) => [`portrait/${name}.webp`, "image/webp"]);

// 四句台词的音频，一句一个文件。
//
// 扫描整个目录而不是写死 .wav：用户换成本地拿到的原声素材时，格式可能是
// mp3 / m4a / ogg，不该为了换个文件去改代码。同一句有多个格式时按下面的
// 顺序取第一个，wav 优先（无损）。
const VOICE_COUNT = 4;
const VOICE_PREFIX = "/voice/";
const VOICE_FORMATS = [
  ["wav", "audio/wav"],
  ["mp3", "audio/mpeg"],
  ["m4a", "audio/mp4"],
  ["ogg", "audio/ogg"],
  ["flac", "audio/flac"],
];

function voicePathFor(rank) {
  return fileURLToPath(new URL(`../assets/voice/line-${rank}`, import.meta.url));
}

function send(res, status, headers = {}) {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end();
}

function buildAssets() {
  const assets = new Map();
  for (const [name, type] of ASSET_SPECS) {
    const path = fileURLToPath(new URL(`../assets/${name}`, import.meta.url));
    try {
      const info = statSync(path);
      if (!info.isFile()) continue;
      assets.set(`${ASSET_PREFIX}${name}`, {
        path,
        type,
        size: info.size,
        etag: `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`,
      });
    } catch {
      // A missing optional medium falls back to the browser-side gradient.
    }
  }
  return assets;
}

// 音频走独立前缀，和插件被挂载的位置无关：前端固定请求 /voice/rank-N。
// 每个级别挑一个实际存在的格式，格式和扩展名一起记下来给路由用。
function buildVoiceAssets() {
  const assets = new Map();
  for (let rank = 0; rank < VOICE_COUNT; rank += 1) {
    const base = voicePathFor(rank);
    for (const [extension, type] of VOICE_FORMATS) {
      const path = `${base}.${extension}`;
      let info;
      try {
        info = statSync(path);
      } catch {
        continue; // 这个格式没有，试下一个
      }
      if (!info.isFile()) continue;
      assets.set(`${VOICE_PREFIX}line-${rank}.${extension}`, {
        path,
        type,
        size: info.size,
        etag: `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`,
        rank,
        extension,
      });
      break; // 一句只要一个文件
    }
  }
  return assets;
}

function createAssetHandler(assets, activeStreams) {
  return (req, res) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      send(res, 405, { Allow: "GET, HEAD" });
      return;
    }

    let pathname;
    try {
      pathname = new URL(req.url ?? "/", "http://dsh.local").pathname;
    } catch {
      send(res, 404);
      return;
    }
    const asset = assets.get(pathname);
    if (asset === undefined) {
      send(res, 404);
      return;
    }

    if (req.headers["if-none-match"] === asset.etag) {
      send(res, 304, { ETag: asset.etag });
      return;
    }

    const ifRange = req.headers["if-range"];
    const rangeHeader = ifRange !== undefined && ifRange !== asset.etag
      ? undefined
      : req.headers.range;
    const range = parseSingleRange(rangeHeader, asset.size);
    if (range === false) {
      send(res, 416, { "Content-Range": `bytes */${asset.size}` });
      return;
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? asset.size - 1;
    const status = range === null ? 200 : 206;
    const headers = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600, must-revalidate",
      "Content-Length": String(end - start + 1),
      "Content-Type": asset.type,
      ETag: asset.etag,
      ...(range === null ? {} : { "Content-Range": `bytes ${start}-${end}/${asset.size}` }),
    };

    if (method === "HEAD") {
      send(res, status, headers);
      return;
    }

    res.writeHead(status, {
      "X-Content-Type-Options": "nosniff",
      ...headers,
    });
    const stream = createReadStream(asset.path, { start, end });
    activeStreams.add(stream);
    const release = () => activeStreams.delete(stream);
    stream.once("close", release);
    stream.once("end", release);
    stream.once("error", () => {
      release();
      if (!res.headersSent) send(res, 500);
      else res.destroy();
    });
    res.once("close", () => {
      if (!stream.destroyed) stream.destroy();
    });
    stream.pipe(res);
  };
}

export const inject = ["webServer"];

export function apply(ctx) {
  const assets = buildAssets();
  const activeStreams = new Set();
  ctx.effect(() => {
    const handler = createAssetHandler(assets, activeStreams);
    const unregister = [...assets.keys()].map((path) => ctx.webServer.register({
      kind: "exact",
      path,
      handler,
    }));
    return () => {
      for (const dispose of unregister) dispose();
      for (const stream of activeStreams) stream.destroy();
      activeStreams.clear();
    };
  }, "wukong-intensity-skin: static media route");

  ctx.effect(() => {
    const voiceAssets = buildVoiceAssets();
    const handler = createAssetHandler(voiceAssets, activeStreams);
    const unregister = [...voiceAssets.keys()].map((path) => ctx.webServer.register({
      kind: "exact",
      path,
      handler,
    }));

    // 清单：告诉前端每一句实际是哪个格式。换素材时只换文件，不用改代码。
    const manifest = JSON.stringify({
      lines: Array.from({ length: VOICE_COUNT }, (_, line) => {
        for (const [extension] of VOICE_FORMATS) {
          if (voiceAssets.has(`${VOICE_PREFIX}line-${line}.${extension}`)) {
            return `${VOICE_PREFIX}line-${line}.${extension}`;
          }
        }
        return null;
      }),
    });
    const manifestBody = Buffer.from(manifest, "utf8");
    unregister.push(ctx.webServer.register({
      kind: "exact",
      path: `${VOICE_PREFIX}manifest.json`,
      handler: (req, res) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          send(res, 405, { Allow: "GET, HEAD" });
          return;
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": String(manifestBody.byteLength),
          "Cache-Control": "private, max-age=0, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(req.method === "HEAD" ? undefined : manifestBody);
      },
    }));

    return () => {
      for (const dispose of unregister) dispose();
      for (const stream of activeStreams) stream.destroy();
      activeStreams.clear();
    };
  }, "wukong-intensity-skin: spoken line audio route");
}
