# Chrome Web Store 上架清单

这份清单按**后台填报顺序**排，每一项都指出仓库里对应的来源。商店后台的字段是独立存储：
改 `manifest.json` 或 `public/_locales/` 不会同步过去，反过来也一样。

---

## 0. 只有账号持有人能做的（先做，最慢）

- **注册开发者账号**：一次性 5 美元，需身份证明（护照或身份证），审核通常 1–3 个工作日。
- **开两步验证**：没开会挡住发布。
- **联系邮箱**：会作为公开的开发者联系邮箱展示。

这三件事在仓库外面，却是整条链路的前置。它们跑的时候，可以并行把下面几项准备好。

---

## 1. 打包

```bash
pnpm run build
Compress-Archive -Path 'dist\*' -DestinationPath 'postpress-1.1.0.zip'
```

- `manifest.json` 必须在 zip **根目录**，不能是 `dist/manifest.json`。
- 版本号取 `manifest.json` 的 `version`（当前 `1.1.0`）。商店不接受重复版本号，**每次上传都要改**。
- zip 里只有运行时文件：`manifest.json`、四个 JS 入口、`popup.html`、`icons/`、`_locales/`。
  源码、`node_modules/`、`site/` 都不进去。

## 2. 图片

图片全部在 `docs/store/`，由 dev harness 渲染（`dev/preview.ts` 的合成夹具，不含任何真实用户内容）；
两份成片不在仓库里，见下表下面的说明：

| 用途 | 尺寸 | 文件 | 必需 |
| :--- | :--- | :--- | :--- |
| 截图 ×5 | 1280×800 | `screenshots/01`–`05` | 至少 1 张 |
| 小型宣传图 | 440×280 | `promo-440x280.png` | 强烈建议 |
| 大型宣传图 | 1400×560 | `promo-1400x560.png` | 可选（上首页轮播才用） |
| 宣传视频 | 1920×1080 · 30s | [中文](https://youtu.be/HIsYVIfMv2Q) · [English](https://youtu.be/jhM5ysK1C2c)（均公开） | 可选 |
| 视频封面 | 1920×1080 | `postpress-promo-poster.png` / `-poster-en.png` | — |

- 成片不进 git（`.gitignore` 里有 `docs/store/*.mp4`），母版挂在 GitHub Release
  [store-assets-v2](https://github.com/Shirolin/postpress/releases/tag/store-assets-v2)；换片时传新 Release
  （`store-assets-v3`…）再把上面两条链接改过去。封面帧很小，继续跟着仓库走。
- 后台填的是 YouTube 链接，不上传文件；`-en` 那份填**全局**视频，中文版填进 `zh_CN` 的本地化视频。
  其余语言留空时按「本地化视频 → 本地化截图 → 全局视频 → 全局截图」回落，不必逐语言再录。
- 两条视频都是公开的，链接不变；标题、说明、封面与必填项见 `docs/store/youtube.md`。
- 两版共用同一条音轨（音乐 + 音效，无旁白），只是画面文字图层不同；分镜时间点完全一致。

### 五张截图怎么来的

它们**不是**界面截图，而是以真实卡片渲染为素材排出来的五张海报，每张一个主张：

| 文件 | 主张 | 画面 |
| :--- | :--- | :--- |
| `01-before-after` | 别再手拉框选截屏 | 左：一张被裁掉的时间线截图（**示意图**，非真实 X 截图）；右：同一帖子的卡片 |
| `02-copy-paste` | 点一下就在剪贴板里 | 卡片 + `Copy image` + 粘进笔记的样子 |
| `03-materials` | 十二套材质，同一段话 | 四张 3:4 纸样并排，只换材质不换文字 |
| `04-resolution` | 3× 放大依然锐利 | 同一处文字放大 2×：1× 渲染 vs 3× 渲染 |
| `05-thread` | 三条推文一张卡 | 左：三条推文 + 一条被丢弃的回复；右：合并后的长卡 |

- 卡片本身是真实组件渲染（`dev/preview.ts` 的合成夹具，不含任何真实用户内容），构图页与抓图脚本在
  `.tmp/store-shots/`（不进版本库）：`main.ts` 是卡片夹具、`tiles.html` 是五张的排版、`shoot-*.mjs` 抓图。
- 01 左边那张时间线是**画的示意图**，不要当成产品截图理解，也不要换成真实 X 界面（会把 X 的商标带进商店图）。
- 商店要求方角、满幅、无内边距；五张都是 1280×800，按 640×400 缩略时标题仍可读——**标题字号不要低于 40px**。
- 抓图流程：2× 渲染（2560×1600）再 LANCZOS 缩到 1280×800；不要直接 1× 抓，正文会发虚。

## 3. 后台字段

| 字段 | 填什么 | 来源 |
| :--- | :--- | :--- |
| 名称 | `PostPress — X & Thread Card Studio` | `public/_locales/en_US/messages.json` |
| 简短说明 | 125 字符版（上限 132） | `docs/store-listing.md` |
| 详细说明 | 英文 / 中文两版 | `docs/store-listing.md` |
| 类别 | **Social & Communication** | 与 X 相关的工具集中在这里；类别改一次要重新审一次 |
| 语言 | English；其余 13 种可在「翻译」里逐个添加 | `_locales/` |
| 隐私政策 URL | `https://github.com/Shirolin/postpress/blob/main/PRIVACY.md` | `PRIVACY.md` |
| 主页 | `https://shirolin.github.io/postpress/` | 已部署 |
| 支持 URL | `https://github.com/Shirolin/postpress/issues` | |
| 权限理由（逐项） | 三行现成英文 | `docs/store-listing.md` §单项权限理由 |

**单一用途说明**（后台必填，建议照抄）：

> PostPress turns the post you are viewing on X into a shareable card image. Themes, aspect
> ratio, canvas and privacy toggles all serve that one purpose.

**测试说明**（后台必填，审核员会照着做）：

> No account or setup is needed. Open any post on x.com, click the press icon in the action
> bar under the post (or press Alt+C while hovering it). The card opens in a modal; Copy
> Image puts a PNG on the clipboard.

## 4. 隐私字段怎么填

按 Google 的定义，「收集」指数据**离开设备**。这个扩展不上传任何东西，所以：

- 「是否收集用户数据」→ **不收集**。
- 但要在权限理由和详细说明里讲清楚：它读取**当前页面已渲染的内容**，只在本机用于生成卡片，
  关闭弹窗即丢弃。`PRIVACY.md` 是这条声明的证据，URL 必须能公开访问。
- 不要为了少填而隐藏读取页面这件事——审核看到 `content_scripts` 匹配 `x.com` 就会问，
  答不上来比多写一句更麻烦。

## 5. 会被拒的几种写法

- **截图与实物不符**：截图里出现的功能必须在包里真的存在。
- **权限过度**：`clipboardWrite` / `storage` / `*.twimg.com` 已经是最小集合，理由要具体到「为什么非它不可」。
  想加 `tabs`、`scripting`、`<all_urls>` 之前先想清楚——`hygiene.6` 就是为这类回归写的。
- **远程代码**：包内不得 `eval`、不得远程加载脚本或配置。当前实现完全满足，改构建时别破坏它。
- **商标**：详细说明末尾「Not affiliated with X Corp.」不能删；图标和截图里不要用 X 的 logo。

## 6. 审核与发布

- 首次审核通常 1–7 天，新账号更久；期间不要重复提交，会排到队尾。
- 通过后可设为 Public；地区、定价（免费）、可见性在 Distribution 页。
- 更新流程：改 `manifest.version` → `pnpm run build` → 重新打包 → 上传 → 提交审核。
  只改图片或文案不需要新版本包，但同样要走审核。

## 7. 发布之后

- 已上架：<https://chromewebstore.google.com/detail/mfmldbbkajimckojjgceehiackjpakai>
  （条目 ID `mfmldbbkajimckojjgceehiackjpakai`，2026-11-01 通过审核）。
- 版本号按 semver 递增，`CHANGELOG.md` 同步记一条。
- 商店页的「详细说明」与 `docs/store-listing.md` 是两份副本，改一边记得改另一边。
