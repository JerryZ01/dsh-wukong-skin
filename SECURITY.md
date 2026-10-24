# 安全说明

## 报告问题

发现安全问题请**不要**开公开 issue。用 GitHub 的 [私密漏洞报告](https://github.com/JerryZ01/dsh-wukong-skin/security/advisories/new)，或直接邮件联系维护者。

请说明：影响范围、复现步骤、你判断的严重程度。会在 7 天内回。

## 这个插件的攻击面

皮肤本身不联网、不收集数据、不执行外部代码。它会：

- 在宿主进程里注册 31 条只读的资源路由（`/plugins/dsh-client-wukong-intensity-skin/assets/portrait/*.webp`），只服务仓库里的静态图；
- 在浏览器里往 `document.body` 插一个背景层、覆写一批 `--dsw-alias-*` CSS 变量；
- 调用宿主的 `theme.setTheme()` 切换深浅主题；
- 往 localStorage 写一个开关（`dsh-wukong-intensity-skin.bind-effort`）。

没有网络请求，没有 `eval`，没有动态代码加载。

## 已知的行为副作用（不是漏洞）

- **会改宿主的深浅主题。** 档位跨过 24 时切到 dark，退回浅色档时切回 light。这是设计。
- **会劫持原生外观按钮的点击。** 点原生「浅色 / 深色 / 跟随系统」会关闭皮肤。这是设计。
- **与其它皮肤互斥。** 同时启用会互相覆盖，见 README。

## 图片生成脚本

`tools/generate-portraits.mjs` **不随插件运行**，只在你自己手动重建人像时才跑。它会：

- 读取 `IMAGE_KEY` 环境变量并发送到你指定的中转站；
- 把生成的 PNG 写进 `.cache/gen/`。

**不要把 key 提交进仓库。** `.gitignore` 已忽略 `.cache/`，但 key 本身请只放在环境变量里。

## 依赖

运行时零第三方依赖。`devDependencies`（esbuild / jsdom / react / sharp）只用于构建和测试，不进入产物。
