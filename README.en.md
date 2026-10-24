# Slide to Buddha · a DeepSeek Harness skin

[简体中文](README.md) | English

Drag a single intensity slider and watch Sun Wukong grow from a stone monkey into the Victorious Fighting Buddha. The UI palette, the light/dark theme and the portrait all move together —and the slider can drive the model's own reasoning effort, so changing a setting finally has a picture attached to it.

![The 31-frame portrait ladder](assets/ladder-preview.jpg)

- **Six ranks**: Stone Monkey → Handsome Monkey King → Great Sage Equal to Heaven → Sun the Pilgrim → Victorious Fighting Buddha → Victorious Fighting Ancestor
- **31 portrait frames**, one for every level from 0 to 30 (15 and 27 are costume-change bridges between ranks)
- **Adaptive palette**: rice-paper white → ochre → peach gold → furnace fire → black and gold, all interpolated from one table
- **Leaves the host alone**: the switch lives inside the native *Settings → General → Appearance* row, and clicking any native theme button leaves the skin

## Install

### Option 1 (recommended): hand the prompt to DSH

No command line needed. **Copy the whole block below and paste it to DSH** — it checks for conflicts, installs, then verifies:

```text
Please install the "Slide to Buddha" skin into DSH's desktop profile. Check for
conflicts first and only install once you have confirmed it is safe.

1. Before installing, read the desktop profile's package.json (dependencies and
   dsh.profile.bundles), that profile's cordis.patch.yml and
   $DSH_HOME/cordis.patch.yml if present.
2. From the currently enabled bundles, identify any other skin, theme or
   appearance plugin. Exclude @deepseek-ai/dsh-base, @deepseek-ai/dsh-web-app,
   dsh-skin-market and the target itself
   @daily-vibe/dsh-client-wukong-intensity-skin. Inspect each candidate's
   package.json (name, description, dsh.client / dsh.bundle declarations) and
   read its README if needed.
3. If you find another enabled skin plugin, list it and stop before installing.
   Ask me to disable it first. Do not modify any profile file and do not install
   without my confirmation.
4. If there is no conflict, say "no other enabled skin plugins detected" and run:

   dsh plugin --profile desktop add 'github:JerryZ01/dsh-wukong-skin'

5. After installing, read the desktop profile's package.json and confirm both
   dependencies and dsh.profile.bundles contain
   @daily-vibe/dsh-client-wukong-intensity-skin. Then check the package's
   dsh.client / dsh.bundle declarations and the wukong-intensity-skin entry in
   cordis.patch.yml. Report a failure if anything is missing.
6. Tell me how to restart DSH. Do not install, disable or uninstall any other
   skin on my behalf.
```

Step 3 matters: if *Slide to Ancestor* or another skin is already enabled in your profile, it **stops and asks** instead of painting over your UI.

### Option 2: command line

```sh
dsh plugin --profile desktop add 'github:JerryZ01/dsh-wukong-skin'
```

Verify (the package name should appear in the output):

```sh
dsh plugin --profile desktop list
```

> **What is `desktop`?** A profile name — the directory name under `~/.dsh/profiles/`. The official Desktop uses `desktop`; `dsh web` uses `web`. Installing into the wrong one does not error, but the skin will not show up in the UI you are actually using. Run `ls ~/.dsh/profiles` if unsure.

> **"`dsh` is not recognized"?** The DSH CLI is not on your PATH. Call it by full path — the location depends on how DSH was installed:
>
> - Official Desktop: `"$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"`
> - Portable / custom directory: `"<install dir>\resources\runtime\cli\bin\dsh.cmd"`
>
> For example: `& "<install dir>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add 'github:JerryZ01/dsh-wukong-skin'`
>
> If you cannot find it, use Option 1 — hand the prompt to DSH and it will locate the command itself.

### Option 3: clone and install locally (for hacking on it)

The built bundle `lib/client.js` is committed, so a clone needs **no** `npm install` or `npm run build`:

```sh
git clone https://github.com/JerryZ01/dsh-wukong-skin.git
cd dsh-wukong-skin
dsh plugin --profile desktop add .
```

`add .` creates a **link dependency pointing at the clone**, so afterwards you can edit the source, run `npm run build`, restart DSH, and see your change without reinstalling. This is the path to take if you want to swap the portraits or the palette.

### After installing

**Quit DSH completely and reopen it** (including the tray icon — closing the window is not enough). `bundles` is read once at startup; without a restart the skin is not loaded.

`dsh plugin` appends the plugin to `dsh.profile.bundles` and loads the bundled `cordis.patch.yml` for you — **no manual config editing required**.

### Uninstall

```sh
dsh plugin --profile desktop remove @daily-vibe/dsh-client-wukong-intensity-skin
```

`remove` also drops it from `dsh.profile.bundles`; after a restart the settings entry is gone.

> **This skin is mutually exclusive with other skins.** It prepends a backdrop to `body`, overwrites a batch of `--dsw-alias-*` variables and calls `theme.setTheme()`. Running it alongside a sibling skin such as *Slide to Ancestor* makes the two paint over each other. Keep exactly one per profile — see "Switching between skins" below.
## Usage

### The slider

A track appears at the right edge of the composer. It reads **the current model's own** `reasoning.efforts`; no step count or step name is hardcoded.

- Any N efforts spread evenly across 0–30: two steps give `0 / 30`, three give `0 / 15 / 30`, five give `0 / 7.5 / 15 / 22.5 / 30`.
- While dragging, the skin only previews. Nothing is committed.
- On pointer-up, keyboard completion or blur, it snaps to the nearest step and commits that step's original ID through the official `ModelDirectory`.
- Models without reasoning support, or with a single selectable step, show no slider. Addressed subagents show none either.

### The appearance row

Everything lives in **Settings → General → Appearance**:

| Control | Effect |
| --- | --- |
| `婊戝姩鍙樹經` (Wukong) | Shows the slider and turns on the portrait, backdrop and adaptive palette |
| Native `Light` / `Dark` / `Follow system` | Removes the backdrop, the skin variables and the slider; returns to that native appearance |
| `滑动变佛绑定思考等级` (bind effort) | When off, the slider only changes the look and leaves the model's reasoning effort alone |

The bind flag is stored in browser localStorage (`dsh-wukong-intensity-skin.bind-effort`).

### Light and dark

Past level 24 the palette turns black and gold, and the skin sets the host theme to dark; dropping back below it restores light. That is deliberate, not a side effect —otherwise every native control would sit on the black-gold backdrop as a pale patch.

## Portraits

The 31 WebPs under `assets/portrait/` are **generated frame by frame**: 1024脳1024, about 9 MB in total. There is no recoloured source art and no geometric placeholder in the repository.

They come from an OpenAI-compatible gateway (`POST /v1/images/generations` and `/v1/images/edits`) using `gpt-image-2.5-sunburst`. What ships in the repo is exactly that output.

### Stopping 31 independent generations from producing 31 different monkeys

This is the trap every slider skin falls into: a slider promises "further right is stronger", but 31 independent generations only give you 31 different styles. Three rules hold it together:

1. **The six ranks form a chain.** Each rank first gets a defining frame (`stage-00/06/12/18/24/30`), and the next rank uses the previous rank's *finished frame* as its image-to-image reference. Stone Monkey → Handsome Monkey King → Great Sage → Pilgrim → Buddha → Ancestor: the same face growing up across six ranks.
2. **Within a rank, only intensity moves.** The other five frames reference their own rank's defining frame and change pattern density, gold-leaf ratio and halo depth —never the person.
3. **Decoration ceilings rise monotonically; inversions are forbidden.** The `ESCALATION` table gives each rank three mutually exclusive caps: the Stone Monkey tier explicitly says "no gold, no flames, no cloud patterns", and flames are not allowed to appear until the Great Sage.

Rule 3 exists because we got it wrong first. An early version put "gold leaf, flames, lotus petals" into every rank, which made the level-4 stone monkey more ornate than the level-6 Monkey King —dragging right made the screen *plainer*. This is the easiest thing to break when editing prompts; always re-run `npm run preview` and compare cell by cell.

Every prompt also carries a verbatim style block (Chinese national-trend ukiyo-e, flat solid colour, heavy black outlines, no photorealism), and the background colour is computed by `paletteForFrame()` in `src/client/logic.js` and written into the prompt —so the portrait's backdrop and the UI can never drift apart.

### Regenerating

```powershell
$env:IMAGE_KEY = 'sk-...'    # a key from an image-capable group
npm install
npm run portraits                        # all 31 frames, roughly 25 minutes
npm run preview                          # rebuild the preview at the top of the README
```

```powershell
npm run portraits -- --only stage-12     # one frame
npm run portraits -- --from 12 --to 17   # one rank
npm run portraits -- --fast              # the faster flare model
npm run portraits -- --force             # ignore the cache in .cache/gen
```

Intermediate PNGs are cached in `.cache/gen/`, so a re-run skips finished frames. **Redrawing a defining frame (`stage-*`) changes the reference for its five siblings**, so redraw the whole rank together.

The frame table lives in [`assets/portrait/SOURCES.md`](assets/portrait/SOURCES.md).

### Use your own art

1. Prepare 31 images at 1024脳1024 whose names match the existing files in `assets/portrait/`.
2. Overwrite them in place. No code change, no rebuild.
3. To change the frame count or spacing, see "Adding steps / changing the frame count" in CONTRIBUTING.md.

If you have no art source at all, a purely geometric placeholder generator (staff + circlet + rank seal) is included:

```sh
python tools/make-placeholders.py
```

## Switching between skins

Both this skin and *Slide to Ancestor* prepend a backdrop, overwrite the same `--dsw-alias-*` variables and call `theme.setTheme()`, so enabling both makes them paint over each other. Only one may live in a profile.

Switching does not touch dependencies — it only edits the `dsh.profile.bundles` array, so both can stay installed and you can swap whenever. The repo ships a script for it:

```sh
# if you installed via Option 3 (clone), run this inside the clone
node tools/switch-skin.mjs            # show which one is active
node tools/switch-skin.mjs liang      # switch to Slide to Ancestor
node tools/switch-skin.mjs wukong     # switch to this skin
node tools/switch-skin.mjs off        # disable both
```

`npm run skin -- liang` works too. The script only edits the profile's `package.json`; **quit and reopen DSH afterwards**, because `bundles` is read once at startup.

The profile defaults to `~/.dsh/profiles/<name>/package.json`. Set `DSH_HOME` to change the root and `DSH_PROFILE` to change the profile name (default `desktop`).

### If you installed via Option 1 or 2

Those paths leave no local clone, so the script is not available. Ask DSH to edit it instead — paste this:

```text
Please switch the skin in my desktop profile, changing only this one thing.

1. Read ~/.dsh/profiles/desktop/package.json and find the dsh.profile.bundles array.
2. I want to enable: Slide to Ancestor @leon___/dsh-client-liang-intensity-skin
   (for Slide to Buddha it is @daily-vibe/dsh-client-wukong-intensity-skin)
3. Remove the other skin from bundles and add mine back. Do not touch or reorder
   any other element.
4. Confirm the package is in dependencies; if not, run
   dsh plugin --profile desktop add 'github:kingOfSoySauce/dsh-liang-skin' first.
5. Print the resulting bundles array and remind me to quit and reopen DSH.
```

Step 3 is the important one: every other element in `bundles` — `dsh-base`, `dsh-web-app` and friends — is required at runtime, and removing one stops the UI from starting at all.

## Build

```sh
npm install
npm run build
```

`npm run build` bundles `src/client/index.jsx` into `lib/client.js` with esbuild (CJS wrapped in `window.__ModuleLoader__.load`), with the CSS inlined as text. **Commit `lib/client.js` along with your source changes** —without it the installed plugin has no browser half. CI fails if the committed bundle is stale.

## Tests

Five offline suites, none of which needs a running DSH:

```sh
npm test                # runs the four below

npm run check           # frame tables agree: client PORTRAIT_ANCHORS ↔ host FRAMES ↔ files on disk
npm run test:unit       # pure functions, plus the node half's 31 asset routes and Range/ETag/304/416
npm run test:dom        # browser half: style injection, backdrop, appearance button, full teardown
npm run test:render     # React half: drag preview, commit on release, bind switch
```

Everything runs after `npm install`; `jsdom`, `react` and `react-dom` are devDependencies. If your machine keeps them outside the checkout, override with `JSDOM_PATH` / `REACT_PATH`.

The fifth suite, `test:compose`, runs the **real runtime's** `loadProfileDirectory()` and therefore needs DSH itself:

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
$env:DSH_RUNTIME_MODULES  = 'file:///<install dir>/resources/app.asar/dsh/node_modules'
& '<install dir>\DeepSeek Harness.exe' tools/test-compose.mjs
```

It assembles a throwaway profile in a temp directory to verify patch-layer order and final row order, and never touches your own profile.

## Troubleshooting

**Installed, but there is no "Slide to Buddha" in Settings.**

In order:

1. **Did you restart?** Quit DSH fully (tray icon included). `bundles` is read once at startup.
2. **Right profile?** `dsh plugin --profile desktop list` shows the package, but the UI you are looking at may be served by a different profile.
3. **Is it in `bundles`?** Being in `dependencies` does not enable anything. Open `~/.dsh/profiles/desktop/package.json` and confirm `dsh.profile.bundles` contains `@daily-vibe/dsh-client-wukong-intensity-skin`.
4. **Is another skin enabled?** See "Switching between skins" above.

**The settings entry is there, but no slider appears.**

The slider only shows for models that **support reasoning and expose at least two steps**. With a model that has no reasoning options it stays hidden — that is correct behaviour, not a broken install.

**The palette changed and my light/dark theme got switched.**

By design. Past level 24 (Victorious Fighting Buddha) the palette turns black and gold and the skin sets the host theme to dark; dropping back below restores light. Otherwise every native control would sit on the black-gold backdrop as a pale patch.

**Hard edges or a dark fringe around the portrait.**

The backdrop colour is computed by `paletteForFrame()` and baked into the art so the two always match. If you swapped in your own images without updating the palette, the seam shows — see "Use your own art".

**Can I run Slide to Ancestor and Slide to Buddha together?**

No. Both prepend a backdrop, overwrite the same `--dsw-alias-*` variables and call `theme.setTheme()`, so they paint over each other. Use the switching method above and keep one at a time.

## Known limitations

- **The five frames inside a rank show one character at increasing intensity, not five different poses.** Silhouette changes happen between ranks (crown, armour, halo); inside a rank it is pattern density and gold ratio. That is the price of monotonicity —dragging through a rank shows density change rather than motion.
- All six ranks share one reference chain, so the face stays the same monkey, but chained image-to-image drifts slightly and more so at later levels. Redraw any single frame with `npm run portraits -- --only <frame>`.
- The skin changes the host's light/dark theme and intercepts clicks on the native appearance buttons. Both are intentional.
- Native appearance choices are not remembered across reloads: returning to a native theme only lasts for the current client activation.
- Running alongside *Slide to Ancestor* conflicts; use `tools/switch-skin.mjs`.
- Portraits are AI-generated and included for demonstration —see Licensing below.

## Licensing

Code is released under the [MIT License](LICENSE).

The 31 portraits under `assets/portrait/` are **stylised character illustrations** generated with `gpt-image-2.5`. They are not based on any real person's likeness or any third-party artwork, and ship under the same MIT terms. For commercial distribution, prefer regenerating them with `npm run portraits` so that upstream model output terms do not get tangled in.

*Journey to the West* and Sun Wukong are public-domain material. The DeepSeek Harness mechanism was inspired by [`@leon___/dsh-client-liang-intensity-skin`](https://github.com/kingOfSoySauce/dsh-liang-skin); the code and the portraits here are independent implementations.
