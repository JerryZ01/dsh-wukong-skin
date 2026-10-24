# Slide to Buddha · a DeepSeek Harness skin

[简体中文](README.md) | English

Drag a single intensity slider and watch Sun Wukong grow from a stone monkey into the Victorious Fighting Buddha. The UI palette, the light/dark theme and the portrait all move together 鈥?and the slider can drive the model's own reasoning effort, so changing a setting finally has a picture attached to it.

![The 31-frame portrait ladder](assets/ladder-preview.jpg)

- **Six ranks**: Stone Monkey 鈫?Handsome Monkey King 鈫?Great Sage Equal to Heaven 鈫?Sun the Pilgrim 鈫?Victorious Fighting Buddha 鈫?Victorious Fighting Ancestor
- **31 portrait frames**, one for every level from 0 to 30 (15 and 27 are costume-change bridges between ranks)
- **Adaptive palette**: rice-paper white 鈫?ochre 鈫?peach gold 鈫?furnace fire 鈫?black and gold, all interpolated from one table
- **Leaves the host alone**: the switch lives inside the native *Settings 鈫?General 鈫?Appearance* row, and clicking any native theme button leaves the skin

## Install

```sh
# From GitHub (recommended)
dsh plugin --profile <profile> add 'github:JerryZ01/dsh-wukong-skin'
```

Or from a local checkout (handy while developing; the built bundle is committed, so there is no prepare step):

```sh
git clone https://github.com/JerryZ01/dsh-wukong-skin.git
cd dsh-wukong-skin
dsh plugin --profile <profile> add .
```

**Quit DSH completely and reopen it** (including the tray icon). `dsh plugin` appends the plugin to `dsh.profile.bundles` and loads the bundled `cordis.patch.yml`.

> **This skin is mutually exclusive with other skins.** It prepends a backdrop to `body`, overwrites a batch of `--dsw-alias-*` variables and calls `theme.setTheme()`. Running it alongside a sibling skin such as *Slide to Ancestor* makes the two paint over each other. Keep exactly one per profile 鈥?see "Switching between skins" below.

## Usage

### The slider

A track appears at the right edge of the composer. It reads **the current model's own** `reasoning.efforts`; no step count or step name is hardcoded.

- Any N efforts spread evenly across 0鈥?0: two steps give `0 / 30`, three give `0 / 15 / 30`, five give `0 / 7.5 / 15 / 22.5 / 30`.
- While dragging, the skin only previews. Nothing is committed.
- On pointer-up, keyboard completion or blur, it snaps to the nearest step and commits that step's original ID through the official `ModelDirectory`.
- Models without reasoning support, or with a single selectable step, show no slider. Addressed subagents show none either.

### The appearance row

Everything lives in **Settings 鈫?General 鈫?Appearance**:

| Control | Effect |
| --- | --- |
| `婊戝姩鍙樹經` (Wukong) | Shows the slider and turns on the portrait, backdrop and adaptive palette |
| Native `Light` / `Dark` / `Follow system` | Removes the backdrop, the skin variables and the slider; returns to that native appearance |
| `婊戝姩鍙樹經缁戝畾鎬濊€冪瓑绾 (bind effort) | When off, the slider only changes the look and leaves the model's reasoning effort alone |

The bind flag is stored in browser localStorage (`dsh-wukong-intensity-skin.bind-effort`).

### Light and dark

Past level 24 the palette turns black and gold, and the skin sets the host theme to dark; dropping back below it restores light. That is deliberate, not a side effect 鈥?otherwise every native control would sit on the black-gold backdrop as a pale patch.

## Portraits

The 31 WebPs under `assets/portrait/` are **generated frame by frame**: 1024脳1024, about 9 MB in total. There is no recoloured source art and no geometric placeholder in the repository.

They come from an OpenAI-compatible gateway (`POST /v1/images/generations` and `/v1/images/edits`) using `gpt-image-2.5-sunburst`. What ships in the repo is exactly that output.

### Stopping 31 independent generations from producing 31 different monkeys

This is the trap every slider skin falls into: a slider promises "further right is stronger", but 31 independent generations only give you 31 different styles. Three rules hold it together:

1. **The six ranks form a chain.** Each rank first gets a defining frame (`stage-00/06/12/18/24/30`), and the next rank uses the previous rank's *finished frame* as its image-to-image reference. Stone Monkey 鈫?Handsome Monkey King 鈫?Great Sage 鈫?Pilgrim 鈫?Buddha 鈫?Ancestor: the same face growing up across six ranks.
2. **Within a rank, only intensity moves.** The other five frames reference their own rank's defining frame and change pattern density, gold-leaf ratio and halo depth 鈥?never the person.
3. **Decoration ceilings rise monotonically; inversions are forbidden.** The `ESCALATION` table gives each rank three mutually exclusive caps: the Stone Monkey tier explicitly says "no gold, no flames, no cloud patterns", and flames are not allowed to appear until the Great Sage.

Rule 3 exists because we got it wrong first. An early version put "gold leaf, flames, lotus petals" into every rank, which made the level-4 stone monkey more ornate than the level-6 Monkey King 鈥?dragging right made the screen *plainer*. This is the easiest thing to break when editing prompts; always re-run `npm run preview` and compare cell by cell.

Every prompt also carries a verbatim style block (Chinese national-trend ukiyo-e, flat solid colour, heavy black outlines, no photorealism), and the background colour is computed by `paletteForFrame()` in `src/client/logic.js` and written into the prompt 鈥?so the portrait's backdrop and the UI can never drift apart.

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

Both this skin and *Slide to Ancestor* prepend a backdrop, overwrite the same `--dsw-alias-*` variables and call `theme.setTheme()`, so enabling both makes them paint over each other. Only one may live in a profile, but both stay installed 鈥?switching is just a matter of editing one array, `dsh.profile.bundles`:

```sh
node tools/switch-skin.mjs            # show which one is active
node tools/switch-skin.mjs liang      # switch to Slide to Ancestor
node tools/switch-skin.mjs wukong     # switch to this skin
node tools/switch-skin.mjs off        # disable both
```

`npm run skin -- liang` works too. The script only edits the profile's `package.json`; **quit and reopen DSH afterwards**, because `bundles` is read once at startup.

The profile defaults to `~/.dsh/profiles/<name>/package.json`. Set `DSH_HOME` to change the root and `DSH_PROFILE` to change the profile name (default `desktop`).

## Build

```sh
npm install
npm run build
```

`npm run build` bundles `src/client/index.jsx` into `lib/client.js` with esbuild (CJS wrapped in `window.__ModuleLoader__.load`), with the CSS inlined as text. **Commit `lib/client.js` along with your source changes** 鈥?without it the installed plugin has no browser half. CI fails if the committed bundle is stale.

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

## Uninstall

```sh
dsh plugin --profile <profile> remove @daily-vibe/dsh-client-wukong-intensity-skin
```

`remove` also drops it from `dsh.profile.bundles`; after a restart the settings entry is gone.

## Known limitations

- **The five frames inside a rank show one character at increasing intensity, not five different poses.** Silhouette changes happen between ranks (crown, armour, halo); inside a rank it is pattern density and gold ratio. That is the price of monotonicity 鈥?dragging through a rank shows density change rather than motion.
- All six ranks share one reference chain, so the face stays the same monkey, but chained image-to-image drifts slightly and more so at later levels. Redraw any single frame with `npm run portraits -- --only <frame>`.
- The skin changes the host's light/dark theme and intercepts clicks on the native appearance buttons. Both are intentional.
- Native appearance choices are not remembered across reloads: returning to a native theme only lasts for the current client activation.
- Running alongside *Slide to Ancestor* conflicts; use `tools/switch-skin.mjs`.
- Portraits are AI-generated and included for demonstration 鈥?see Licensing below.

## Licensing

Code is released under the [MIT License](LICENSE).

The 31 portraits under `assets/portrait/` are **stylised character illustrations** generated with `gpt-image-2.5`. They are not based on any real person's likeness or any third-party artwork, and ship under the same MIT terms. For commercial distribution, prefer regenerating them with `npm run portraits` so that upstream model output terms do not get tangled in.

*Journey to the West* and Sun Wukong are public-domain material. The DeepSeek Harness mechanism was inspired by [`@leon___/dsh-client-liang-intensity-skin`](https://github.com/kingOfSoySauce/dsh-liang-skin); the code and the portraits here are independent implementations.
