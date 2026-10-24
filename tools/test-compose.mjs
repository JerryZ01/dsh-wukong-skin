/**
 * Proves the plugin composes into a real DSH profile without touching the
 * user's own profile: builds a throwaway profile directory in the OS temp
 * folder, points it at this checkout, and runs the runtime's own
 * loadProfileDirectory() over it.
 *
 * The runtime modules live inside app.asar, so DSH_RUNTIME_MODULES must be a
 * file:// URL that Electron can read through the asar:
 *   $env:ELECTRON_RUN_AS_NODE=1
 *   $env:DSH_RUNTIME_MODULES='file:///F:/deepseek-harness/resources/app.asar/dsh/node_modules'
 *   & '<runtime>\DeepSeek Harness.exe' tools/test-compose.mjs
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "");
const runtimeModules = process.env.DSH_RUNTIME_MODULES;
if (!runtimeModules) {
  console.error("DSH_RUNTIME_MODULES is required; see this file's header.");
  process.exit(1);
}

const { loadProfileDirectory, composeEntries } = await import(
  `${runtimeModules}/@deepseek-ai/dsh-app-boot/lib/index.js`
);
const installAnchor = `${runtimeModules}/@deepseek-ai/dsh/package.json`;

// A profile is just package.json + node_modules. Link this checkout in as the
// one installed plugin, and let the shipped bundles come from the runtime.
const scratch = mkdtempSync(join(tmpdir(), "wk-compose-"));
mkdirSync(join(scratch, "node_modules", "@daily-vibe"), { recursive: true });
writeFileSync(
  join(scratch, "package.json"),
  `${JSON.stringify({
    name: "dsh-profile-wk-scratch",
    private: true,
    dependencies: { "@daily-vibe/dsh-client-wukong-intensity-skin": "link:" },
    dsh: {
      profile: {
        bundles: [
          "@deepseek-ai/dsh-base",
          "@deepseek-ai/dsh-web-app",
          "@daily-vibe/dsh-client-wukong-intensity-skin",
        ],
      },
    },
  }, null, 2)}\n`,
  "utf8",
);
symlinkSync(projectDir, join(scratch, "node_modules", "@daily-vibe", "dsh-client-wukong-intensity-skin"), "junction");

const profile = loadProfileDirectory("dsh", scratch, installAnchor);
// `profile.patches` is only the profile's own user layer. The effective document
// is the flattened stack of every layer's patch list — composeEntries() takes
// those lists, not the layer records, so map them out first.
const entries = composeEntries(profile.layers.map((layer) => layer.patches));

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

console.log(`scratch profile: ${scratch}`);
console.log("composition");

check("no bundle was skipped", () => {
  assert.deepEqual(profile.skippedBundles ?? [], []);
});

check("every bundle contributes at least one patch", () => {
  for (const layer of profile.layers) {
    assert.ok(layer.patches.length > 0, `${layer.packageName} contributed no patches`);
  }
});

check("the plugin became its own patch layer, last in the stack", () => {
  const last = profile.layers.at(-1);
  assert.equal(last?.packageName, "@daily-vibe/dsh-client-wukong-intensity-skin");
  assert.equal(last.patchPaths.length, 1);
  assert.match(last.patchPaths[0], /cordis\.patch\.yml$/);
});

check("the layer inserts the loader row under the expected id", () => {
  const last = profile.layers.at(-1);
  assert.deepEqual(last.patches, [{
    insert: [{
      id: "wukong-intensity-skin",
      name: "@daily-vibe/dsh-client-wukong-intensity-skin",
    }],
  }]);
});

check("the composed document carries exactly one wukong row", () => {
  const text = JSON.stringify(entries);
  const hits = text.split('"id":"wukong-intensity-skin"').length - 1;
  assert.equal(hits, 1, `expected one row, found ${hits}`);
});

check("the composed document still carries the host rows", () => {
  const text = JSON.stringify(entries);
  for (const id of ['"id":"webserver"', '"id":"connection"', '"id":"ui-theme"']) {
    assert.ok(text.includes(id), `missing host row ${id}`);
  }
});

check("the plugin row is appended after the host rows, not before", () => {
  const text = JSON.stringify(entries);
  assert.ok(
    text.indexOf('"id":"wukong-intensity-skin"') > text.indexOf('"id":"connection"'),
    "plugin row must come after the host rows so it can override them",
  );
});

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
