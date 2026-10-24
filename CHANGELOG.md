# Changelog

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-10-24

首个公开版本。

### Added

- 31 帧人像阶梯，覆盖 0–30 每一级；六个果位定型帧，15 与 27 是跨果位换装过渡帧。
- 六级果位：石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖。
- **台词**：每跨一个果位换一句原著台词，六句全部逐字核对过百回本，并在界面上标注回数。
- 推理等级滑块：档位直接读当前模型的 `reasoning.efforts`，任意 N 档均匀铺在 0–30 上。
- 拖动期只做连续视觉预览；指针松开、键盘操作完成或失焦时才吸附并通过 ModelDirectory 提交。
- 自适应配色：石白 → 赭石 → 蟠桃金 → 丹炉火 → 黑金，界面变量与人像底色同源（都来自 `paletteForFrame()`）。
- 进入斗战胜佛（等级 24）时自动把宿主深浅主题切到 dark，退回浅色档时切回 light。
- 外观开关并入原生「设置 → 通用设置 → 外观」行，`滑动变佛` 自定义按钮与原生三个主题按钮互斥。
- 「滑动变佛绑定思考等级」开关，关闭后滑块只换外观、不改模型推理等级；状态存在 localStorage。
- 宿主半部注册 31 条资源路由，支持 ETag / Range / HEAD / 304 / 416。
- `tools/generate-portraits.mjs`：调 `gpt-image-2.5` 逐帧生图，六果位串成参考图链保证同一张脸，`ESCALATION` 表防装饰倒挂。
- `tools/ladder-preview.mjs`：拼 README 顶部的 31 帧预览图。
- `tools/switch-skin.mjs`：与「滑动变祖」互切，只改 `dsh.profile.bundles` 一个数组。
- 五套离线测试（logic / assets / dom / render / compose），其中前四套 `npm install` 后即可跑。

### Known limitations

- 同果位内的五帧是「同一个人推强度」，造型变化集中在果位之间，果位内部靠纹样密度与金光比例递增。
- 链式图生图有轻微漂移，级别越远越明显；可用 `--only <帧名>` 单帧重画。
- 与本项目的姊妹皮肤「滑动变祖」不能同时启用，会互相覆盖背景层与 `--dsw-alias-*`。
- 跨刷新不记忆原生外观选择：切回原生主题只对本次客户端激活有效。
