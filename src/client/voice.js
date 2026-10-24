/**
 * 台词朗读。
 *
 * 播放的是 assets/voice/line-N.<ext>，由插件的宿主半段用静态路由提供。
 * 不用浏览器自带的 speechSynthesis：在 Electron 里它常被自动播放策略
 * 静默拒绝（not-allowed），机器之间语音差异也大，而且没法预先验证
 * "到底有没有声音"。
 *
 * 四句对六个果位：中间两级跟上一级共用一句，所以这里要先把果位折成台词号。
 */

export const VOICE_ASSET_PREFIX = "/voice/";

/** 果位 -> 台词号。四句撑六级，1/2 共用第二句，3/4 共用第三句。 */
const LINE_FOR_RANK = [0, 1, 1, 2, 2, 3];

/** 一共几句。别用 LINE_FOR_RANK.length 推，那是六级。 */
export const VOICE_LINE_COUNT = 4;

/**
 * 第 rank 级对应哪个音频文件。
 *
 * 素材可能是 wav / mp3 / m4a，具体用哪个由宿主扫描目录决定，前端通过
 * /voice/manifest.json 拿到实际地址。清单还没加载完时先退回 wav，
 * 这样即使清单端点不可用也不会完全没声音。
 */
const manifest = { lines: [] };

export function lineIndexForRank(rawRank) {
  const index = Number.isFinite(rawRank) ? Math.round(rawRank) : 0;
  return LINE_FOR_RANK[Math.min(5, Math.max(0, index))];
}

export function voiceAssetFor(rawRank) {
  const line = lineIndexForRank(rawRank);
  const fromManifest = manifest.lines[line];
  if (typeof fromManifest === "string") return fromManifest;
  return `${VOICE_ASSET_PREFIX}line-${line}.wav`;
}

/** 读取清单；失败就保持 wav 兜底，不抛错。 */
export async function loadVoiceManifest(fetchImpl) {
  try {
    const response = await fetchImpl(`${VOICE_ASSET_PREFIX}manifest.json`, { cache: "no-store" });
    if (!response.ok) return false;
    const body = await response.json();
    if (!Array.isArray(body?.lines)) return false;
    manifest.lines = body.lines;
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {object} [options]
 * @param {() => object} [options.createAudio] 便于测试注入
 * @param {(url: string) => void} [options.onMissing] 音频加载或播放失败时回调
 */
export function createVoice(options = {}) {
  const makeAudio =
    options.createAudio ??
    (() => {
      try {
        return new globalThis.Audio();
      } catch {
        return null;
      }
    });
  const onMissing = options.onMissing ?? (() => {});

  // 一句一个 Audio 实例，预加载后切档就是重放，没有网络延迟。
  // 键用台词号而不是果位号：四句撑六级，2/3 和 4/5 同一句，理应复用同一个播放器。
  const players = new Map();
  let muted = false;
  let current = null;

  const playerFor = (rank) => {
    const key = lineIndexForRank(rank);
    let player = players.get(key);
    if (player !== undefined) return player;
    const audio = makeAudio();
    if (audio === null) return null;
    audio.src = voiceAssetFor(rank);
    audio.preload = "auto";
    audio.addEventListener?.("error", () => onMissing(voiceAssetFor(rank)));
    players.set(key, audio);
    return audio;
  };

  return {
    /** 是否可能出声（有 Audio 构造器就有机会）。 */
    get supported() {
      return makeAudio() !== null;
    },
    setMuted(next) {
      muted = Boolean(next);
      if (muted && current !== null) {
        try {
          current.pause();
          current.currentTime = 0;
        } catch {
          // 暂停失败不影响静音状态
        }
      }
    },
    get muted() {
      return muted;
    },
    /** 预加载全部音频，第一次拖动就不会卡。四句，不是六级。 */
    preload() {
      for (let line = 0; line < VOICE_LINE_COUNT; line += 1) {
        if (players.has(line)) continue;
        const audio = makeAudio();
        if (audio === null) return;
        audio.src = (manifest.lines[line]) ?? `${VOICE_ASSET_PREFIX}line-${line}.wav`;
        audio.preload = "auto";
        audio.addEventListener?.("error", () => onMissing(audio.src));
        players.set(line, audio);
      }
    },
    /**
     * 念一句。音频播放失败不能影响滑块，所以整段吞掉异常。
     * @returns {boolean} 是否真的发起了播放
     */
    speak(_text, rank) {
      if (muted) return false;
      const player = playerFor(rank);
      if (player === null) return false;
      try {
        // 上一句没放完就切档，先停掉，否则两句会叠在一起。
        if (current !== null && current !== player) {
          current.pause();
          current.currentTime = 0;
        }
        current = player;
        player.currentTime = 0;
        const result = player.play();
        // 现代浏览器返回 Promise；被自动播放策略拒绝时在这里兜住。
        if (result !== undefined && typeof result.catch === "function") {
          result.catch(() => onMissing(voiceAssetFor(rank)));
        }
        return true;
      } catch {
        return false;
      }
    },
    dispose() {
      for (const player of players.values()) {
        try {
          player.pause();
        } catch {
          // 卸载时失败无所谓
        }
      }
      players.clear();
      current = null;
    },
  };
}
