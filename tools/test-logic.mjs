/**
 * Pure-function checks for the browser half's ladder math and palette.
 * No DOM, no DSH process involved.
 *
 *   node tools/test-logic.mjs
 */

import assert from "node:assert/strict";
import {
  MAX_LEVEL,
  PREVIEW_MAX_FRAME,
  RANKS,
  clampFrame,
  frameForEffort,
  indicatorLabel,
  nearestEffortIndex,
  paletteForFrame,
  rankForFrame,
  selectedEffortIndex,
} from "../src/client/logic.js";

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

console.log("ladder");

check("the six ranks are exactly the documented ladder", () => {
  assert.deepEqual(RANKS, ["石猴", "美猴王", "齐天大圣", "孙行者", "斗战胜佛", "斗战胜祖"]);
  assert.equal(RANKS.length, 6);
  assert.equal(MAX_LEVEL, 30);
});

check("rank boundaries fall on multiples of six", () => {
  const at = (level) => rankForFrame((level / MAX_LEVEL) * PREVIEW_MAX_FRAME);
  assert.equal(at(0), "石猴");
  assert.equal(at(5), "石猴");
  assert.equal(at(6), "美猴王");
  assert.equal(at(11), "美猴王");
  assert.equal(at(12), "齐天大圣");
  assert.equal(at(17), "齐天大圣");
  assert.equal(at(18), "孙行者");
  assert.equal(at(23), "孙行者");
  assert.equal(at(24), "斗战胜佛");
  assert.equal(at(29), "斗战胜佛");
  assert.equal(at(30), "斗战胜祖");
});

check("out-of-range frames clamp instead of throwing", () => {
  assert.equal(clampFrame(-500), 0);
  assert.equal(clampFrame(9999), PREVIEW_MAX_FRAME);
  assert.equal(clampFrame(Number.NaN), 0);
  assert.equal(rankForFrame(Number.NaN), "石猴");
});

console.log("");
console.log("effort mapping");

check("N efforts spread evenly across 0-240", () => {
  assert.deepEqual([0, 1].map((i) => frameForEffort(i, 2)), [0, 240]);
  assert.deepEqual([0, 1, 2].map((i) => frameForEffort(i, 3)), [0, 120, 240]);
  const five = [0, 1, 2, 3, 4].map((i) => frameForEffort(i, 5));
  assert.deepEqual(five, [0, 60, 120, 180, 240]);
});

check("a single effort pins to frame 0 and never snaps", () => {
  assert.equal(frameForEffort(0, 1), 0);
  const efforts = [{ id: "only", name: "唯一档" }];
  assert.equal(nearestEffortIndex(240, efforts), 0);
});

check("nearestEffortIndex rounds to the closest stop", () => {
  const efforts = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(nearestEffortIndex(0, efforts), 0);
  assert.equal(nearestEffortIndex(59, efforts), 0);
  assert.equal(nearestEffortIndex(61, efforts), 1);
  assert.equal(nearestEffortIndex(240, efforts), 2);
  assert.equal(nearestEffortIndex(240, []), -1);
});

check("selectedEffortIndex falls back from selected to default", () => {
  const efforts = [{ id: "low" }, { id: "high" }];
  assert.equal(selectedEffortIndex(efforts, "high"), 1);
  assert.equal(selectedEffortIndex(efforts, undefined, "high"), 1);
  assert.equal(selectedEffortIndex(efforts, "gone", "low"), -1);
  assert.equal(selectedEffortIndex(efforts, undefined, undefined), -1);
});

console.log("");
console.log("labels");

check("the indicator joins the rank with the effort name", () => {
  const efforts = [{ id: "a", name: "快速" }, { id: "b", name: "深度" }];
  assert.equal(indicatorLabel(0, efforts), "石猴 · 快速");
  assert.equal(indicatorLabel(240, efforts), "斗战胜祖 · 深度");
});

check("without efforts the indicator shows the rank alone", () => {
  assert.equal(indicatorLabel(120, []), "齐天大圣");
});

console.log("");
console.log("palette");

check("the shell stays light until 斗战胜佛, then flips dark", () => {
  assert.equal(paletteForFrame(0).stage, 0);
  assert.equal(paletteForFrame(PREVIEW_MAX_FRAME).stage, 5);
  // Frame 191 is level 23.875 - still the light shell.
  assert.equal(paletteForFrame(191).stage, 0);
  // Frame 193 is level 24.125 - the black-and-gold shell.
  assert.equal(paletteForFrame(193).stage, 5);
});

check("every palette token is a usable css colour", () => {
  for (const frame of [0, 40, 96, 144, 192, 240]) {
    const p = paletteForFrame(frame);
    for (const key of ["page", "base", "layer1", "layer2", "layer3", "sidebar", "ink", "secondary", "tertiary", "border", "accent", "accentHover", "hover"]) {
      assert.match(p[key], /^rgb\(\d+ \d+ \d+( \/ [\d.]+)?\)$/, `${key} at frame ${frame}: ${p[key]}`);
    }
    const opacity = Number(p.portraitOpacity);
    assert.ok(Number.isFinite(opacity) && opacity > 0 && opacity <= 1, `opacity at ${frame}: ${p.portraitOpacity}`);
  }
});

check("strength tracks the sliders 0..1 range", () => {
  assert.equal(paletteForFrame(0).strength, 0);
  assert.equal(paletteForFrame(PREVIEW_MAX_FRAME).strength, 1);
  assert.ok(Math.abs(paletteForFrame(120).strength - 0.5) < 1e-9);
});

check("the level mirrors the frame across the whole range", () => {
  for (const frame of [0, 60, 120, 180, 240]) {
    assert.ok(Math.abs(paletteForFrame(frame).level - (frame / PREVIEW_MAX_FRAME) * MAX_LEVEL) < 1e-9);
  }
});

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
