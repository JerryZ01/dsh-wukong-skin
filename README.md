# 滑动变佛 · DeepSeek Harness 皮肤

[English](README.en.md) | 简体中文

拖一条强度滑块，孙悟空从石猴一路修到斗战胜祖——界面配色、深浅主题、人像三者同步变化。滑块可以直接绑定模型的推理等级，于是「调档」这件事第一次有了画面。

![31 帧人像阶梯](assets/ladder-preview.jpg)

- **六级果位**：石猴 → 美猴王 → 齐天大圣 → 孙行者 → 斗战胜佛 → 斗战胜祖
- **31 帧人像**：0–30 每一级都有对应画面，15 与 27 是跨果位的换装过渡帧
- **自适应配色**：石白 → 赭石 → 蟠桃金 → 丹炉火 → 黑金，六个配色停靠点随果位插值，界面变量与人像底色同源
- **四句原声**：跨果位时报一句台词，可选念出来（默认关闭）
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

第 3 步是重点：你 profile 里若已经开着别的皮肤，它会**停下来问你**，而不是直接装上去把界面搞花。

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

> **与其它皮肤互斥。** 这个皮肤会往 `body` 前插背景层、覆写一批 `--dsw-alias-*` 变量、调用 `theme.setTheme()`。和同类皮肤同时启用会互相盖住，同一 profile 里只留一个。

## 用法

### 滑块

输入框右侧出现一条滑轨。它读的是**当前模型自己的** `reasoning.efforts`，不写死档位数量或名称：

- 任意 N 档均匀铺在 0–30 上：两档是 `0 / 30`，三档是 `0 / 15 / 30`，五档是 `0 / 7.5 / 15 / 22.5 / 30`。
- 拖动期间只做连续视觉预览，不提交。
- 指针松开、键盘操作完成或控件失焦时，才吸附到最近档位，并通过官方 `ModelDirectory` 提交该档位的原始 ID。
- 不支持推理、或只有一个可选档位的模型不显示滑块；addressed subagent 也不显示。

### 台词

滑轨上方常驻一句台词，**每跨一个果位换一句**。四句撑六级：

| 果位 | 台词 | 语气 |
| --- | --- | --- |
| 石猴 | 俺老孙来也！ | 自报登场 |
| 美猴王 | 吃俺老孙一棒！ | 动手前 |
| 齐天大圣 | 吃俺老孙一棒！ | 动手前 |
| 孙行者 | 妖怪，哪里跑！ | 追打 |
| 斗战胜佛 | 妖怪，哪里跑！ | 追打 |
| 斗战胜祖 | 俺上天看看路径，日后好带你们上去同住。 | 称王后 |

中间两级各与前一级共用一句——四句比六句好搜，而且短，切档时来得快。顶档那句最长（3.8 秒），是四段里唯一的完整句子，其余三句都是五六个字的短喝。

> 早先这里放的是原著原文（「将来年老血衰，暗中有阎王老子管着」这类），逐字核对过百回本，但演员未必念过，音效平台上搜不到，等于配不上声音。现在以「平台上真有原声」为准。

台词随档位切换即时生效，不需要松手提交；拖动过程中会自动淡到 35%，避免和档位提示抢读。

### 念出来

在设置里打开「滑动变佛念出台词」，跨果位时会**把台词念出来**。

- 念的是四个音频文件（`assets/voice/line-N.*`），由插件自带的静态路由提供。
- 支持 `wav` / `mp3` / `m4a` / `ogg` / `flac`，放什么格式都行，宿主会扫描目录并通过 `/voice/manifest.json` 告诉前端。
- 四句对六个果位：`[0, 1, 1, 2, 2, 3]`。
- 四个文件在挂载时一次性预加载，切档就是重放，没有网络延迟。
- 切到新果位会先停掉上一句，否则两句会叠在一起。
- 关掉开关立刻静音，不等那句念完。
- 默认**关闭**：进页面不会突然开口。
- 不联网、不调用任何语音 API、不把文字发给任何服务。
- **仓库自带这四段音频**（`assets/voice/line-0..3.wav`，共 321 KB），开箱即有声。

**为什么不走浏览器的 `speechSynthesis`**：试过了，在 Electron 里它会被自动播放策略静默拒绝（`error: not-allowed`），而且首次同步调用 `getVoices()` 返回空数组，机器之间语音差异也大。预生成的文件是**可以当场验证的**——用真实 Chromium 解码播放，能确认 `currentTime` 真的在走。

要导入音频：

```sh
npm run voices
```

脚本会把素材转成 16kHz 单声道、校验有声，再写进 `assets/voice/`。素材放在 `.cache/raw-voice/`（已在 `.gitignore` 里）。

文件名两种写法都认：

- **显式编号**（最可靠）：`line-0.mp3` ~ `line-3.mp3`，直接指定是第几句。
- **按内容匹配**：认不出编号时退回关键词——`来也` / `一棒` / `哪里跑` / `上天看看`。音效站导出的文件名通常带台词原文，不编号也能对上。

改台词要同时改三处：`src/client/logic.js` 的 `LINES`、`tools/import-voice.mjs` 顶部的 `LINES`、以及 `tools/test-logic.mjs` 里钉死的那四句。

### 外观开关

入口在 **设置 → 通用设置 → 外观**，紧挨着原生主题按钮：

| 控件 | 行为 |
| --- | --- |
| `滑动变佛` | 显示滑块，并启用人物、背景和自适应配色 |
| 原生 `浅色` / `深色` / `跟随系统` | 移除背景层、皮肤变量和滑块，切回对应原生外观 |
| `滑动变佛绑定思考等级` | 关闭后滑块只切换外观，不改模型的推理等级 |
| `滑动变佛念出台词` | 跨果位时朗读原声片段；默认关闭 |

两个开关只在皮肤启用时出现，状态存浏览器 localStorage：

| 开关 | 键 |
| --- | --- |
| 绑定思考等级 | `dsh-wukong-intensity-skin.bind-effort` |
| 念出台词 | `dsh-wukong-intensity-skin.speak` |

「绑定思考等级」默认开启，「念出台词」默认关闭——进页面不会突然开口。

### 深浅主题

进入斗战胜佛（等级 24）后配色转黑金，此时皮肤会把宿主的深浅主题切到 dark；退回浅色档时切回 light。这是设计行为，不是副作用——否则原生控件会在黑金背景上留下一堆浅色补丁。

## 人像

31 张半身立绘（1024×1024，WebP，约 9 MB）是 AI 逐帧生成的，没有调色图也没有占位图。六果位串成一条参考图链——每个果位先画定型帧，下一级拿上一级的成品做图生图——所以从头拖到尾是同一张脸在长大，而不是 31 只猴子。装饰上限按果位逐级抬升，不允许倒挂（否则后面的档位反而更素）。

想换成自己的图：准备 31 张 1024×1024，文件名对齐 `assets/portrait/` 现有的，直接覆盖即可，不用改代码也不用重新构建。

想重新生成、看帧表、或者了解提示词怎么防风格漂移，见 [`assets/portrait/SOURCES.md`](assets/portrait/SOURCES.md)。

## 构建

```sh
npm install
npm run build
```

`npm run build` 用 esbuild 把 `src/client/index.jsx` 打成 `lib/client.js`（CJS + `window.__ModuleLoader__.load` 外壳），CSS 以文本内联。**提交时要把 `lib/client.js` 一起提交**，否则装上去没有浏览器半部；CI 会检查产物是否与源码同步。

### 全部脚本

| 命令 | 作用 |
| --- | --- |
| `npm run build` | 打包客户端半部到 `lib/client.js` |
| `npm run portraits` | 逐帧重新生成人像（需 `IMAGE_KEY`），`-- --only <帧名>` 单帧重画 |
| `npm run voices` | 把 `.cache/raw-voice/` 的素材导入 `assets/voice/` |
| `npm run preview` | 重拼 README 顶部的 31 帧预览图 |
| `npm run skin` | 开关本项目：`-- on` / `-- off`，只改 profile 的 bundles 数组 |
| `npm test` | 五套离线测试 |
| `npm run test:compose` | 用真实运行时验证 profile 组合，需 DSH 本体 |

`npm run skin` 改完同样要**完全退出 DSH 再打开**。它只增删 `@daily-vibe/dsh-client-wukong-intensity-skin` 这一个元素，profile 里其他 bundle 一律不碰。

## 测试

`npm test` 一次跑完五套，都不需要启动 DSH：

```sh
npm test                # 等价于下面四条

npm run check           # 帧表一致性：客户端 PORTRAIT_ANCHORS ↔ 宿主 FRAMES ↔ 磁盘文件；打包清单；tarball 内容
npm run test:unit       # logic + assets + voice：档位/果位/配色纯函数、资源路由与 Range/ETag/304/416、朗读播放器
npm run test:dom        # 浏览器半部：样式注入、背景层、外观按钮、整体卸载
npm run test:render     # React 半部：拖动预览、松手提交、两个开关、跨档播哪一段、hook 顺序
```

`npm install` 之后就全都能跑，`jsdom` / `react` / `react-dom` / `esbuild` / `sharp` 都是 devDependencies。若你的机器把依赖放在检出目录之外，可以用 `JSDOM_PATH` / `REACT_PATH` 覆盖。

两样东西**不在** `npm test` 里，需要单独跑：

**探针** —— 用真实 Chromium 验证四段音频能否解码、能否播放、`currentTime` 是否真的在走。换素材后跑一次，比人工试听可靠：

```sh
node tools/probe-voice.mjs
```

**组合测试** —— `test:compose` 跑的是**真实运行时**的 `loadProfileDirectory()`，需要 DSH 本体：

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
4. **是不是开着别的皮肤？** 同类皮肤会互相覆盖背景层与主题变量，同一 profile 里只留一个。

**设置里有按钮，但滑块不出现。**

滑块只在**支持推理、且至少两个档位**的模型上出现。换成不支持 reasoning 的模型时它不显示，这是正常的，不是装坏了。

**界面配色变了，但深浅主题被切换了。**

这是设计。档位跨过 24（斗战胜佛）时配色转黑金，皮肤会把宿主主题切到 dark；退回浅色档时切回 light。否则原生控件会在黑金背景上留下一堆浅色补丁。

**头像边缘有硬边或黑边。**

底色由 `paletteForFrame()` 算出来写进人像，和界面同源。如果你换了自定义图但没同步改配色，就会露边——见上面「人像」一节。

**能同时开两个皮肤吗？**

不能。两者都会插背景层、覆写同一批 `--dsw-alias-*`、调 `theme.setTheme()`，会互相盖住。一次只留一个。

## 已知边界

- 同果位内的五帧是「同一个人推强度」，不是五个不同姿态：拖过某一果位时看到的是纹样密度变化，不是动作变化。这是为单调性做的取舍。
- 链式图生图有轻微漂移，级别越远越明显。某帧不满意就 `npm run portraits -- --only <帧名>` 单独重画。
- 皮肤会改宿主的深浅主题（见上文），也会劫持原生外观按钮的点击。两者都是设计。
- 跨刷新不记忆原生外观选择：切回原生主题只对本次客户端激活有效，刷新后默认重新启用皮肤。
- 与同类皮肤同装会冲突，同一 profile 里只留一个。
- 人像为 AI 生成，仅作演示用途，详见下方「许可」。

## 许可

代码以 [MIT](LICENSE) 发布。

`assets/portrait/` 下的 31 张人像是用 `gpt-image-2.5` 生成的**风格化角色插画**，不基于任何真人肖像或第三方作品，随仓库一并以 MIT 提供。如果你要用于商业发行，建议先用 `npm run portraits` 换成自己生成的图，避免和上游模型的输出条款产生牵连。

「孙悟空」「西游记」属公有领域题材，本项目为独立实现。

## 版权与素材

**上面的 MIT 只覆盖代码，不覆盖 `assets/voice/` 里的四段录音。**

| 项 | 情况 |
| --- | --- |
| 录音来源 | 1986 版中央电视台《西游记》电视剧 |
| 著作权 | 中央电视台 |
| 表演者权 | 李世宏（前五集）、李扬（其余） |
| 状态 | 未经授权，随仓库提供 |

这四段是直接从剧里截出来的对白，不是翻录、不是合成。把它们放进 MIT 仓库是一个**有意的例外**：许可证声明覆盖的是我写的代码，而不是别人的表演。

如果你要商用、再分发，或者放到公开可访问的服务上，**请自行取得授权，或换成你有权使用的素材**。换素材的流程：

```sh
# 1. 把音频放进 .cache/raw-voice/，命名 line-0 ~ line-3
# 2. 导入（会转成 16kHz 单声道并校验非静音）
npm run voices
# 3. 验证能真的出声
node tools/probe-voice.mjs
```

删掉这四段不影响代码运行——朗读会静默，界面其余部分照常。
