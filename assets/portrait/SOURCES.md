# 人像来源

`assets/portrait/` 下 31 个 WebP 全部由 `tools/generate-portraits.mjs` 调用
`gpt-image-2.5-sunburst` 逐帧生成，没有使用任何第三方图库素材，也没有调色或占位图。

- 生成时间：2026-10-24
- 模型：`gpt-image-2.5-sunburst`（OpenAI 兼容网关，`POST /v1/images/generations` 与 `POST /v1/images/edits`）
- 尺寸：全部 1024×1024，WebP q90，合计约 9 MB
- 提示词与果位/档位表的对应关系，见 `tools/generate-portraits.mjs` 里的 `LOOKS` 与 `ESCALATION`

## 为什么 31 次独立生成不会变成 31 只猴子

这是滑块皮肤最要命的一个坑：滑动条承诺「越往右越强」，而 31 次互相独立的生成只会给出
31 种风格。三条规则把它按住。

### 1. 六果位串成一条链

每个果位先画一张定型帧（`stage-00/06/12/18/24/30`），下一级拿上一级的**成品**当参考图
做图生图。石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖，六级下来是同一张脸
在长大，而不是六个不相干的角色。

### 2. 同果位内只推强度

另外五帧以该果位的定型帧为参考图，改的是纹样密度、金箔比例、光轮层数，不动人。
所以拖动时看到的是「同一个人越来越强」，不是「换了个姿势」。

### 3. 装饰上限逐级抬升，不允许倒挂

`ESCALATION` 表给每个果位的三档写了互斥的装饰上限：石猴档明令「没有任何金色、没有火焰、
没有云纹」，到齐天大圣才允许第一次出现火焰纹。

第三条是踩过坑才加的。早期版本把「金箔、火焰、莲花瓣」写进了所有果位，结果第 4 级的
石猴比第 6 级的美猴王还华丽——滑块往右拖反而变素。**改提示词时这条最容易翻车**，改完
务必 `npm run preview` 逐格比对。

### 画风与底色为什么统一

每条提示词里都夹了一段逐字复制的画风块（国潮浮世绘、实色平涂、粗黑勾边、禁止写实质感）。
背景色则由 `src/client/logic.js` 的 `paletteForFrame()` 直接算出 `--wk-page` 再写进提示词，
所以人像底色和界面底色永远同源，换档时不会露出硬边。

## 帧表

| 帧名 | 等级 | 果位 | 生成方式 |
| --- | --- | --- | --- |
| `stage-00` | 0 | 石猴 | 文生图（起点） |
| `level-01` … `level-05` | 1–5 | 石猴 | 以 `stage-00` 为参考图做图生图 |
| `stage-06` | 6 | 美猴王 | 以 `stage-00` 为参考图，换装为美猴王 |
| `level-07` … `level-11` | 7–11 | 美猴王 | 以 `stage-06` 为参考图 |
| `stage-12` | 12 | 齐天大圣 | 以 `stage-06` 为参考图，换装为齐天大圣 |
| `level-13` `level-14` `bridge-15` `level-16` `level-17` | 13–17 | 齐天大圣 | 以 `stage-12` 为参考图；`bridge-15` 是换装过渡帧 |
| `stage-18` | 18 | 孙行者 | 以 `stage-12` 为参考图，换装为孙行者 |
| `level-19` … `level-23` | 19–23 | 孙行者 | 以 `stage-18` 为参考图 |
| `stage-24` | 24 | 斗战胜佛 | 以 `stage-18` 为参考图，转黑金 |
| `level-25` `level-26` `bridge-27` `level-28` `level-29` | 25–29 | 斗战胜佛 | 以 `stage-24` 为参考图；`bridge-27` 是换装过渡帧 |
| `stage-30` | 30 | 斗战胜祖 | 以 `stage-24` 为参考图，换装为斗战胜祖 |

`bridge-15` 与 `bridge-27` 这两个名字不是笔误：它们分别落在「齐天大圣 → 孙行者」与
「斗战胜佛 → 斗战胜祖」的换装边界上，提示词要求头饰与肩甲同时带两个果位的元素。

## 重新生成

```powershell
$env:IMAGE_KEY = 'sk-...'    # 生图分组的 key；sharp 已是 devDependency，先 npm install

npm run portraits                        # 全部 31 帧，约 25 分钟
npm run preview                          # 重拼 README 顶部预览图
```

```powershell
npm run portraits -- --only stage-12     # 只重画一帧
npm run portraits -- --from 12 --to 17   # 只做一个果位
npm run portraits -- --fast              # 换 flare 模型，快很多
npm run portraits -- --force             # 忽略 .cache/gen 里的缓存
```

中间 PNG 缓存在 `.cache/gen/`，重跑会跳过已完成的帧。

单帧重画不会影响其他帧，因为参考图取自同果位的定型帧，而定型帧取自上一果位的定型帧。
但如果你重画的是**定型帧**（`stage-*`），它下游那五帧的参考图就变了，建议一并重画那个果位：

```powershell
npm run portraits -- --from 12 --to 17 --force
```

## 替代方案

没有图源时，仓库里带了一份纯几何占位图生成器（金箍棒 + 紧箍 + 果位印）可以兜底：

```sh
python tools/make-placeholders.py
```
