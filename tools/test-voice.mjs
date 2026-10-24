/**
 * 朗读模块的检查。
 *
 *   node tools/test-voice.mjs
 *
 * 朗读是播放用户提供的原声素材（assets/voice/line-N.*），不走
 * speechSynthesis——所以这里测的是「选对了文件、切档时停掉上一句、
 * 静音真的不出声」。
 *
 * 四句对六个果位：0/1 用第一句，2/3 第二句，4/5 第三句... 见 LINE_FOR_RANK。
 */

import assert from "node:assert/strict";

import { createVoice, lineIndexForRank, voiceAssetFor } from "../src/client/voice.js";

const failures = [];
const queue = [];
function check(name, fn) {
  queue.push({ name, fn });
}

/** 一个最小的 Audio 替身，记录播放与暂停。 */
function fakeAudioFactory() {
  const created = [];
  const createAudio = () => {
    const audio = {
      src: "",
      preload: "",
      currentTime: 0,
      paused: true,
      playCount: 0,
      pauseCount: 0,
      play() {
        this.playCount += 1;
        this.paused = false;
        return Promise.resolve();
      },
      pause() {
        this.pauseCount += 1;
        this.paused = true;
      },
      addEventListener() {},
    };
    created.push(audio);
    return audio;
  };
  return { createAudio, created };
}

console.log("rank to line mapping");

check("four lines cover six ranks", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(lineIndexForRank), [0, 1, 1, 2, 2, 3]);
});

check("out-of-range ranks clamp to a real line", () => {
  assert.equal(lineIndexForRank(-3), 0);
  assert.equal(lineIndexForRank(99), 3);
  assert.equal(lineIndexForRank(Number.NaN), 0);
});

check("each line maps to its own file", () => {
  assert.equal(voiceAssetFor(0), "/voice/line-0.wav");
  assert.equal(voiceAssetFor(1), "/voice/line-1.wav");
  assert.equal(voiceAssetFor(3), "/voice/line-2.wav");
  assert.equal(voiceAssetFor(5), "/voice/line-3.wav");
});

check("ranks that share a line share a file", () => {
  // LINE_FOR_RANK = [0, 1, 1, 2, 2, 3]
  assert.equal(voiceAssetFor(1), voiceAssetFor(2));
  assert.equal(voiceAssetFor(3), voiceAssetFor(4));
});

console.log("");
console.log("playback");

check("speaking a rank plays that rank's line", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  assert.equal(voice.speak("妖怪", 3), true);
  assert.equal(created.length, 1);
  assert.equal(created[0].src, "/voice/line-2.wav");
  assert.equal(created[0].playCount, 1);
});

check("the same line reuses one player instead of making new ones", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.speak("a", 1);
  voice.speak("b", 2); // 同一句
  assert.equal(created.length, 1, "ranks 1 and 2 share a line and must share the player");
});

check("crossing to a different line stops the previous one", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.speak("俺老孙来也", 0);
  const first = created[0];
  voice.speak("吃俺老孙一棒", 1);
  assert.equal(first.pauseCount, 1, "the previous clip must be paused");
  assert.equal(first.currentTime, 0, "and rewound");
});

check("replaying the same line does not pause itself", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.speak("a", 1);
  voice.speak("b", 2);
  assert.equal(created[0].pauseCount, 0, "must not pause the player it is about to play");
});

check("preload warms all four clips", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.preload();
  assert.equal(created.length, 4);
  assert.deepEqual(created.map((a) => a.src).sort(), [
    "/voice/line-0.wav",
    "/voice/line-1.wav",
    "/voice/line-2.wav",
    "/voice/line-3.wav",
  ]);
  // 预加载不能出声
  assert.equal(created.reduce((n, a) => n + a.playCount, 0), 0);
});

console.log("");
console.log("muting");

check("muting stops playback and pauses what is playing", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.speak("a", 2);
  const player = created[0];
  voice.setMuted(true);
  assert.equal(player.pauseCount, 1, "muting must pause immediately");
  assert.equal(voice.muted, true);
  assert.equal(voice.speak("b", 0), false);
});

check("unmuting lets the next line through", () => {
  const { createAudio } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.setMuted(true);
  voice.setMuted(false);
  assert.equal(voice.speak("a", 1), true);
});

console.log("");
console.log("failure handling");

check("no Audio constructor means unsupported, not a crash", () => {
  const voice = createVoice({ createAudio: () => null });
  assert.equal(voice.supported, false);
  assert.equal(voice.speak("a", 0), false);
});

check("a play() that throws never reaches the caller", () => {
  const voice = createVoice({
    createAudio: () => ({
      src: "",
      currentTime: 0,
      play() {
        throw new Error("boom");
      },
      pause() {},
      addEventListener() {},
    }),
  });
  assert.equal(voice.speak("a", 0), false);
});

check("a rejected play() reports the missing asset", async () => {
  const missing = [];
  const voice = createVoice({
    createAudio: () => ({
      src: "",
      currentTime: 0,
      play: () => Promise.reject(new Error("NotAllowedError")),
      pause() {},
      addEventListener() {},
    }),
    onMissing: (url) => missing.push(url),
  });
  voice.speak("a", 4);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(missing, ["/voice/line-2.wav"]);});

check("dispose pauses every player", () => {
  const { createAudio, created } = fakeAudioFactory();
  const voice = createVoice({ createAudio });
  voice.preload();
  voice.dispose();
  assert.equal(created.every((a) => a.pauseCount >= 1), true);
});

console.log("");
for (const { name, fn } of queue) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}\n       ${error.message}`);
  }
}

if (failures.length > 0) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
