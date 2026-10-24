# 滑动变佛 · DeepSeek Harness 皮肤

[English](README.en.md) | 简体中文

拖一条强度滑块，孙悟空从石猴一路修到斗战胜祖——界面配色、深浅主题、人像三者同步变化。滑块可以直接绑定模型的推理等级，于是「调档」这件事第一次有了画面。

![31 帧人像阶梯](assets/ladder-preview.jpg)

- **六级果位**：石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖
- **31 帧人像**：0–30 每一级都有对应画面，15 与 27 是跨果位的换装过渡帧
- **自适应配色**：石白 → 赭石 → 蟠桃金 → 丹炉火 → 黑金，颜色从同一张表插值出来
- **不改宿主**：外观开关并入原生「设置 → 通用设置 → 外观」，点原生主题按钮即退出皮肤

## 安装

### 方法一（推荐）：把提示词交给 DSH

不需要懂命令行。**复制下面整段，粘贴给 DSH**，它自己会检查冲突、安装、验证：

```text
请把「滑动变佛」皮肤安装到 DSH 的 desktop profile。必须先检查冲突，确认可以继续后再安装。

1. 安装前只读检查 desktop profile 的 package.json（dependencies 与 dsh.profile.bundles）、
   该 profile 的 cordis.patch.yml 和 $DSH_HOME/cordis.patch.yml（如有）。
2. 从当前启用的 bundles 中识别其他皮肤、主题或外观插件：排除 @deepseek-ai/dsh-base、
   @deepseek-ai/dsh-web-app、dsh-skin-market 和本次目标
   @daily-vibe/dsh-client-wukong-intensity-skin；读取候选 package.json 的名称、描述、
   dsh.client/dsh.bundle 声明，必要时再读 README。
3. 如果发现其他已启用的皮肤插件，列出它们并停在安装前，提醒我先停用；
   未经我确认不得修改任何 profile 文件，也不得执行安装。
4. 如果没有冲突，明确说「未检测到其他已启用的皮肤插件」，然后执行：

   dsh plugin --profile desktop add 'github:JerryZ01/dsh-wukong-skin'

5. 安装后读取 desktop profile 的 package.json，确认 dependencies 和 dsh.profile.bundles
   中都有 @daily-vibe/dsh-client-wukong-intensity-skin；再检查目标 package.json 的
   dsh.client/dsh.bundle 声明和 cordis.patch.yml 里的 wukong-intensity-skin 注册项。
   任一缺失都要报告安装或注册失败。
6. 告诉我如何重启 DSH。不要替我安装、停用或卸载其他皮肤。
```

第 3 步是重点：你 profile 里若已经开着「滑动变祖」或别的皮肤，它会**停下来问你**，而不是直接装上去把界面搞花。

### 方法二：命令行安装

```sh
dsh plugin --profile desktop add 'github:JerryZ01/dsh-wukong-skin'
```

验证是否装好（应能在输出里看到 `@daily-vibe/dsh-client-wukong-intensity-skin`）：

```sh
dsh plugin --profile desktop list
```

> **`desktop` 是什么？** profile 名，即 `~/.dsh/profiles/` 下的目录名。官方 Desktop 用的是 `desktop`，`dsh web` 用的是 `web`。装错了不会报错，但皮肤不会出现在你正在用的那个界面里。不确定就跑 `ls ~/.dsh/profiles`（PowerShell 用 `dir ~/.dsh/profiles`）。

> **提示 `dsh` 不是内部或外部命令？** 说明 DSH 的 CLI 不在 PATH 里。用完整路径调用，位置随安装方式不同：
>
> - 官方 Desktop：`"$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"`
> - 便携版/自定义目录：`"<安装目录>\resources\runtime\cli\bin\dsh.cmd"`
>
> 例如：`& "<安装目录>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add 'github:JerryZ01/dsh-wukong-skin'`
>
> 实在找不到，就直接用方法一——把提示词交给 DSH，它会自己定位命令。

### 方法三：克隆后从本地装（改代码用）

构建产物 `lib/client.js` 已随仓库提交，克隆后**不需要** `npm install` 或 `npm run build`：

```sh
git clone https://github.com/JerryZ01/dsh-wukong-skin.git
cd dsh-wukong-skin
dsh plugin --profile desktop add .
```

`add .` 装的是**指向克隆目录的 link 依赖**，所以之后改源码、跑 `npm run build`、重启 DSH 就生效，不用重装。适合想换人像或改配色的人。

### 装完之后

**完全退出 DSH 再重新打开**（含托盘图标，不是只关窗口）。`bundles` 只在启动时读一次，不重启等于没装。

`dsh plugin` 会自动把插件追加进 profile 的 `dsh.profile.bundles`，并加载它自带的 `cordis.patch.yml`，**不需要手动改配置**。

### 卸载

```sh
dsh plugin --profile desktop remove @daily-vibe/dsh-client-wukong-intensity-skin
```

`remove` 会自动把它从 `dsh.profile.bundles` 摘除；重启后设置入口完全消失。

> **与其它皮肤互斥。** 这个皮肤会往 `body` 前插背景层、覆写一批 `--dsw-alias-*` 变量、调用 `theme.setTheme()`。和「滑动变祖」等同类皮肤同时启用会互相盖住。同一 profile 里只留一个，见下面的「与滑动变祖互切」。

## 用法

### 滑块

输入框右侧出现一条滑轨。它读的是**当前模型自己的** `reasoning.efforts`，不写死档位数量或名称：

- 任意 N 档均匀铺在 0–30 上：两档是 `0 / 30`，三档是 `0 / 15 / 30`，五档是 `0 / 7.5 / 15 / 22.5 / 30`。
- 拖动期间只做连续视觉预览，不提交。
- 指针松开、键盘操作完成或控件失焦时，才吸附到最近档位，并通过官方 `ModelDirectory` 提交该档位的原始 ID。
- 不支持推理、或只有一个可选档位的模型不显示滑块；addressed subagent 也不显示。

### 外观开关

入口在 **设置 → 通用设置 → 外观**：

| 控件 | 行为 |
| --- | --- |
| `滑动变佛` | 显示滑块，并启用人物、背景和自适应配色 |
| 原生 `浅色` / `深色` / `跟随系统` | 移除背景层、皮肤变量和滑块，切回对应原生外观 |
| `滑动变佛绑定思考等级` | 关闭后滑块只切换外观，不改模型的推理等级 |

绑定开关存在浏览器 localStorage（`dsh-wukong-intensity-skin.bind-effort`）。

### 深浅主题

进入斗战胜佛（等级 24）后配色转黑金，此时皮肤会把宿主的深浅主题切到 dark；退回浅色档时切回 light。这是设计行为，不是副作用——否则原生控件会在黑金背景上留下一堆浅色补丁。

## 人像

`assets/portrait/` 下 31 个 WebP 是**逐帧生成**的半身立绘，1024×1024，合计约 9 MB。没有调色图，没有几何占位图。

生图走 OpenAI 兼容网关（`POST /v1/images/generations` 与 `/v1/images/edits`），模型 `gpt-image-2.5-sunburst`。仓库里的图就是这批产物。

### 31 次独立生成，怎么才不会变成 31 只猴子

这是滑块皮肤最要命的坑：滑动条要的是「越往右越强」的确定感，而 31 次互相独立的生成只会给出 31 种风格。三条规则把它按住：

1. **六果位串成一条链。** 每个果位先画一张定型帧（`stage-00/06/12/18/24/30`），下一级拿上一级的**成品**当参考图做图生图。石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖，六级下来是同一张脸在长大。
2. **同果位内只推强度。** 另外五帧以该果位的定型帧为参考图，改的是纹样密度、金箔比例、光轮层数，不动人。
3. **装饰上限逐级抬升，不允许倒挂。** `ESCALATION` 表给每个果位的三档写了互斥的上限：石猴档明令「没有任何金色、没有火焰、没有云纹」，到齐天大圣才允许第一次出现火焰纹。

第 3 条是踩过坑才加的。早期版本把「金箔、火焰、莲花瓣」写进了所有果位，结果第 4 级的石猴比第 6 级的美猴王还华丽——滑块往右拖反而变素。改提示词时这条最容易翻车，改完务必 `npm run preview` 逐格比对。

另外每条提示词里都夹了一段逐字复制的画风块（国潮浮世绘、实色平涂、粗黑勾边、禁止写实质感），背景色则由 `src/client/logic.js` 的 `paletteForFrame()` 直接算出 `--wk-page` 再写进提示词，所以人像底色和界面底色永远同源。

### 重新生成

```powershell
$env:IMAGE_KEY = 'sk-...'    # 生图分组的 key
npm install
npm run portraits                        # 全部 31 帧，约 25 分钟
npm run preview                          # 重拼 README 顶部预览图
```

```powershell
npm run portraits -- --only stage-12     # 只重画一帧
npm run portraits -- --from 12 --to 17   # 只做一个果位
npm run portraits -- --fast              # 换 flare 模型，快很多
npm run portraits -- --force             # 忽略 .cache/gen 里的缓存
```

中间 PNG 缓存在 `.cache/gen/`，重跑会跳过已完成的帧。**重画定型帧（`stage-*`）会改变它下游五帧的参考图**，建议整个果位一起重画。

帧表与生成方式见 [`assets/portrait/SOURCES.md`](assets/portrait/SOURCES.md)。

### 换成你自己的图

1. 准备 31 张 1024×1024 图，文件名与 `assets/portrait/` 现有文件一一对应；
2. 直接覆盖同名文件，不需要改代码、不需要重新构建；
3. 想改帧数或密度，见 CONTRIBUTING 的「加档位 / 改帧数」。

没有图源时，还有一份纯几何占位图生成器（金箍棒 + 紧箍 + 果位印）可以兜底：

```sh
python tools/make-placeholders.py
```

## 与「滑动变祖」互切

两个皮肤都会往 `body` 前插背景层、都会覆写同一批 `--dsw-alias-*`、都会调 `theme.setTheme()`，同时启用会互相盖住。所以同一 profile 里只能留一个。

切换不改依赖，只改 `dsh.profile.bundles` 这一个数组，所以两边可以同时装着、随时换。仓库里带了个脚本替你做这件事：

```sh
# 如果你是用方法三（克隆）装的，在克隆目录里跑
node tools/switch-skin.mjs            # 看当前是哪个
node tools/switch-skin.mjs liang      # 切到滑动变祖
node tools/switch-skin.mjs wukong     # 切到滑动变佛
node tools/switch-skin.mjs off        # 两个都关掉
```

也可以 `npm run skin -- liang`。脚本只改 profile 的 `package.json`，**切完必须完全退出 DSH 再重新打开**——`bundles` 只在启动时读一次。

profile 位置默认 `~/.dsh/profiles/<名字>/package.json`；用 `DSH_HOME` 改根目录、`DSH_PROFILE` 改 profile 名（默认 `desktop`）。

### 用方法一/二装的，怎么切

那两个方法不会把仓库留在本地，脚本用不上。直接让 DSH 帮你改，把这段粘贴过去：

```text
请帮我在 desktop profile 里切换皮肤，只改这一处。

1. 读取 ~/.dsh/profiles/desktop/package.json，找到 dsh.profile.bundles 数组。
2. 我要启用的皮肤是：滑动变祖 @leon___/dsh-client-liang-intensity-skin
   （换成滑动变佛就是 @daily-vibe/dsh-client-wukong-intensity-skin）
3. 从 bundles 中移除另一个皮肤，把我要的这个加回去。其余元素和顺序一律不动。
4. 确认这个包已在 dependencies 里；不在就先跑
   dsh plugin --profile desktop add 'github:kingOfSoySauce/dsh-liang-skin'
5. 改完把 bundles 数组打印给我看，并提醒我完全退出 DSH 再重新打开。
```

关键第 3 条：`bundles` 里其他元素**一个都不能动**，那里面是 `dsh-base`、`dsh-web-app` 等运行时必需的 bundle，删错了整个界面起不来。

## 构建

```sh
npm install
npm run build
```

`npm run build` 用 esbuild 把 `src/client/index.jsx` 打成 `lib/client.js`（CJS + `window.__ModuleLoader__.load` 外壳），CSS 以文本内联。**提交时要把 `lib/client.js` 一起提交**，否则装上去没有浏览器半部；CI 会检查产物是否与源码同步。

## 测试

五套离线测试，都不需要启动 DSH：

```sh
npm test                # 一次跑完下面四项

npm run check           # 帧表一致性：客户端 PORTRAIT_ANCHORS ↔ 宿主 FRAMES ↔ 磁盘文件
npm run test:unit       # 档位/果位/配色纯函数；宿主半部的 31 条资源路由、Range/ETag/304/416
npm run test:dom        # 浏览器半部：样式注入、背景层、外观按钮、整体卸载
npm run test:render     # React 半部：滑块拖动预览、松手提交、绑定开关
```

`npm install` 之后就全都能跑，`jsdom` / `react` / `react-dom` 都是 devDependencies。若你的机器把依赖放在检出目录之外，可以用 `JSDOM_PATH` / `REACT_PATH` 覆盖。

第五套 `test:compose` 跑的是**真实运行时**的 `loadProfileDirectory()`，需要 DSH 本体：

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
$env:DSH_RUNTIME_MODULES  = 'file:///<安装目录>/resources/app.asar/dsh/node_modules'
& '<安装目录>\DeepSeek Harness.exe' tools/test-compose.mjs
```

它在临时目录里拼一个假 profile，验证 patch 层顺序与最终行序，不会碰你自己的 profile。

## 常见问题

**装完了，设置里没有「滑动变佛」。**

按顺序排查：

1. **重启了吗？** 要完全退出 DSH（含托盘图标）。`bundles` 只在启动时读一次。
2. **装对 profile 了吗？** `dsh plugin --profile desktop list` 里能看到包名，但你在用的界面可能是另一个 profile 起的。
3. **`bundles` 里有吗？** 装进 `dependencies` 不等于启用。打开 `~/.dsh/profiles/desktop/package.json`，确认 `dsh.profile.bundles` 数组里有 `@daily-vibe/dsh-client-wukong-intensity-skin`。
4. **是不是开着别的皮肤？** 见上面的「与滑动变祖互切」。

**设置里有按钮，但滑块不出现。**

滑块只在**支持推理、且至少两个档位**的模型上出现。换成不支持 reasoning 的模型时它不显示，这是正常的，不是装坏了。

**界面配色变了，但深浅主题被切换了。**

这是设计。档位跨过 24（斗战胜佛）时配色转黑金，皮肤会把宿主主题切到 dark；退回浅色档时切回 light。否则原生控件会在黑金背景上留下一堆浅色补丁。

**头像边缘有硬边或黑边。**

底色由 `paletteForFrame()` 算出来写进人像，和界面同源。如果你换了自定义图但没同步改配色，就会露边——见「换成你自己的图」。

**能同时用「滑动变祖」和「滑动变佛」吗？**

不能。两者都会插背景层、覆写同一批 `--dsw-alias-*`、调 `theme.setTheme()`，会互相盖住。用上面的互切方法，一次只留一个。

## 已知边界

- **同果位内的五帧是「同一个人推强度」，不是五个不同姿态。** 造型变化集中在果位之间的换装（冠、甲、光轮），果位内部靠纹样密度与金光比例递增。这是为单调性做的取舍；代价是拖过某一果位时看到的是密度变化而非动作变化。
- 六个果位共用一条参考图链，脸能保持是同一只猴子，但链式图生图有轻微漂移，级别越远越明显。某帧不满意就 `npm run portraits -- --only <帧名>` 单独重画。
- 皮肤会改宿主的深浅主题（见上文），也会劫持原生外观按钮的点击。两者都是设计。
- 跨刷新不记忆原生外观选择：切回原生主题只对本次客户端激活有效，刷新后默认重新启用皮肤。
- 与「滑动变祖」同装会冲突，用 `tools/switch-skin.mjs` 互切。
- 人像为 AI 生成，仅作演示用途，详见下方「许可」。

## 许可

代码以 [MIT](LICENSE) 发布。

`assets/portrait/` 下的 31 张人像是用 `gpt-image-2.5` 生成的**风格化角色插画**，不基于任何真人肖像或第三方作品，随仓库一并以 MIT 提供。如果你要用于商业发行，建议先用 `npm run portraits` 换成自己生成的图，避免和上游模型的输出条款产生牵连。

「孙悟空」「西游记」属公有领域题材。本项目的 DeepSeek Harness 机制灵感来自 [`@leon___/dsh-client-liang-intensity-skin`](https://github.com/kingOfSoySauce/dsh-liang-skin)（滑动变祖），但代码与人像均为独立实现。
