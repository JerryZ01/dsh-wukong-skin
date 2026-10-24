# 人像来源

`assets/portrait/` 下 31 个 WebP 全部由 `tools/generate-portraits.mjs` 调用
`gpt-image-2.5-sunburst` 逐帧生成，没有使用任何第三方图库素材，也没有调色或占位图。

- 生成时间：2026-10-24
- 模型：`gpt-image-2.5-sunburst`（apikl 网关，`POST /v1/images/generations` 与 `/v1/images/edits`）
- 尺寸：全部 1024×1024，WebP q90，合计约 9 MB
- 提示词与果位/档位表的对应关系，见 `tools/generate-portraits.mjs` 里的 `LOOKS` 与 `ESCALATION`

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
$env:IMAGE_KEY = 'sk-...'          # 生图分组的 key
$env:SHARP_DIR = '<装着 sharp 的目录>'

node tools/generate-portraits.mjs                     # 全部 31 帧，约 25 分钟
node tools/generate-portraits.mjs --only stage-12     # 只重画一帧
node tools/generate-portraits.mjs --fast              # 换 flare 模型，快很多
```

单帧重画不会影响其他帧，因为参考图取自同果位的定型帧，而定型帧取自上一果位的定型帧。
但如果你重画的是**定型帧**（`stage-*`），它下游那五帧的参考图就变了，建议一并重画那个果位：

```powershell
node tools/generate-portraits.mjs --from 12 --to 17 --force
```
