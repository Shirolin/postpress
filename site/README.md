# 产品页

`site/` 是 PostPress 的产品页，纯静态：`index.html`（默认英文入口）+ `zh/index.html`（独立静态中文入口）+ `en/index.html`（旧链接兼容跳转）+ `styles.css` + `app.js` + `assets/`，
没有构建步骤，由 [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) 发布到 GitHub Pages。
仓库设置里 Pages 的 Source 要选 **GitHub Actions**，否则工作流不会生效。

- **两套皮，同一张版**：默认近黑（`#0c0e11` 底 + 薄荷按钮），另一套是纸面（`#ecedea` 底 + 深绿按钮 + 近黑结尾）。
  右上角切换，存在 `localStorage`，`?theme=light` 也能直接打开。
- **默认英文 + 双语静态入口**：`/` 原生写死英文语义与 `og-en.jpg`（供海外社区与社交平台默认抓取），`zh/` 原生写死中文语义与 `og.jpg`（通过 `hreflang` 互指）。右上角按钮可随时原地切换中英文。
- **内容带停在 1680px**：超宽屏时背景色块仍铺满整宽，文字与栅格收进 `--edge` 边距，字号也上一个台阶。
- **配色取品牌**：近黑 `#0c0e11`（底）、`#1e2229`（右侧舞台）、米白 `#f2f4f0`（字）、
  薄荷 `#6cc59c`（只给按钮与选中态，来自 `ui/brandMark.ts` 的机身）、结尾的纸色 `#f5f6f4`。
  卡片自己的纸色是页面上唯一的彩色，别的颜色不要加。
- 首屏右半是产品本身：一张真实导出的卡片 + 12 个材质按钮（`data-ui`），点一张换一张，**页面下方跟着换**。
  默认材质跟着皮走：深色给「夜幕」，浅色给「极简」；手动点过任意材质后就不再自动切。
- `assets/cards/*` 由 `src/content/ui/Card.tsx` 与 `src/content/ui/App.tsx` 在 2× DSF 下渲染并经 Pillow 转为 WebP：
  - 12 套材质 × 6 张卡片（首屏 `{id}.webp`、长串 `thread-{id}.webp`、长文 `article-{id}.webp`、三种页脚状态 `switch-{full|plain|blur}-{id}.webp`）、12 张 `thumb-{id}.webp` 与 12 张左右分栏真实 `App.tsx` Studio 弹窗截图 `panel-{id}.webp`（带透明圆角 Alpha 通道）。
  - `#article` 区域另配 `showcase-quad.webp`（四图无裁切）与 `showcase-grid20.webp`（20 图四列拼版），支持标签切换。
  - `og.jpg` 与 `og-en.jpg`（1200×630 JPEG）分别服务中文 `/` 与英文 `en/` 社交预览。
  - 全部示例人物、账号与推文均为虚构；摄影配图来自 Unsplash（Unsplash License），摄影师署名列在页面页脚。
- 卡片样式或弹窗改版后可用 `.tmp/community-promo/shoot-site-cards.mjs` 重新渲染并替换同名文件。
