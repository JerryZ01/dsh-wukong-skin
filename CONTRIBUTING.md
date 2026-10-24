# 贡献指南

谢谢愿意帮这个皮肤。这是个小项目，规则不多，但下面几条是真会卡住人的。

## 开发环境

```sh
git clone https://github.com/JerryZ01/dsh-wukong-skin.git
cd dsh-wukong-skin
npm install
npm run build     # 改过 src/ 就必须重新构建
npm test
```

`npm install` 会装 `esbuild`、`jsdom`、`react`、`react-dom`、`sharp`。前四套测试不需要启动 DSH，装完直接跑。

第五套 `npm run test:compose` 需要 DSH 运行时本体，它跑的是真实 `loadProfileDirectory()`：

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
$env:DSH_RUNTIME_MODULES  = 'file:///<安装目录>/resources/app.asar/dsh/node_modules'
& '<安装目录>\DeepSeek Harness.exe' tools/test-compose.mjs
```

拿不到运行时就不用跑这一套，前四套足以覆盖绝大多数改动。

## 提交前必做

1. **`npm run build`** —— `lib/client.js` 是产物但必须提交，否则装上去没有浏览器半部。CI 会做一致性检查。
2. **`npm test`** —— 四套全绿。
3. **改过 `src/` 就同步 `lib/client.js`**，两者不一致的 PR 会被 CI 拦下。

## 代码结构

| 路径 | 职责 |
| --- | --- |
| `src/index.js` | 宿主半部：注册 31 条资源路由，处理 ETag / Range / 304 / 416 |
| `src/range.js` | Range 解析，与宿主共享的小工具 |
| `src/client/index.jsx` | 浏览器半部：`SkinPresenter`、滑块组件、绑定开关、slot 注册 |
| `src/client/logic.js` | 纯函数：档位↔帧映射、果位判定、配色插值。**所有颜色都从这里出** |
| `src/client/portrait-loader.js` | 31 张图的加载器：独立解码、重试、按等级取最近帧 |
| `src/client/appearance.js` | 把按钮插进原生「外观」行，并劫持原生主题按钮的点击 |
| `src/client/skin.css` | 皮肤样式，靠 `body[data-wk-stage]` 在浅色/黑金两套规则间切 |

## 改配色

**不要**在 CSS 里写死颜色。所有颜色都从 `src/client/logic.js` 的 `STOPS` 表出，`paletteForFrame()` 按等级插值后写到 `--wk-*` 变量上。改 `STOPS` 会让界面、人像提示词、预览图一起变——这是设计意图。

注意 `stage` 字段是**外壳阶段**（只有 0 和 5），不是人像阶段；CSS 的浅色/黑金规则就挂在 `body[data-wk-stage="0"]` 和 `"5"` 上。人像阶段是 `portraitStage`，只用来插值。

## 改人像

换 31 张图最简单：文件名与 `assets/portrait/` 现有文件一一对应，直接覆盖同名 WebP，代码零改动。

要重生图，先看 `assets/portrait/SOURCES.md` 的帧表，再：

```powershell
$env:IMAGE_KEY = 'sk-...'    # 生图分组的 key
npm run portraits -- --only stage-12
```

**改提示词时最容易踩的坑是装饰倒挂**：`ESCALATION` 表给每个果位的三档写了互斥的装饰上限。曾经把「金箔、火焰、莲花瓣」写进所有果位，结果第 4 级的石猴比第 6 级的美猴王还华丽，滑块往右拖反而变素。改完务必 `npm run preview` 逐格比对。

重画定型帧（`stage-*`）会改变它下游五帧的参考图，建议整个果位一起重画：

```powershell
npm run portraits -- --from 12 --to 17 --force
```

## 加档位 / 改帧数

要改帧数得同时动三处，缺一不可：

- `src/client/index.jsx` 的 `PORTRAIT_ANCHORS`（等级 → 文件）
- `src/index.js` 的 `FRAMES`（资源路由列表）
- `src/client/logic.js` 的 `PREVIEW_MAX_FRAME`（滑块上限）

`test-assets` 会核对前两处是否一致，`test-logic` 会核对档位映射。

## 冲突须知

「滑动变祖」（`@leon___/dsh-client-liang-intensity-skin`）和本项目**不能同时启用**：两者都会往 `body` 前插背景层、都会覆写同一批 `--dsw-alias-*`、都会调 `theme.setTheme()`。同时开着会互相盖住。

如果你在 PR 里加了新的 skin 互斥处理，请同时更新 `tools/switch-skin.mjs` 的 `SKINS` 表和 README 的「与滑动变祖互切」一节。

## 提交信息

用祈使句，说清「做了什么」而不是「改了什么文件」：

```
fix: keep the slider from committing a stale effort on blur
feat: add a rank jump control
docs: explain why the escalation table exists
```

## 提问

开 issue 就行。附上：DSH 版本、操作系统、复现步骤。皮肤类问题最好带上截图。
