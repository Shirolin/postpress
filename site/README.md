# 产品页

`site/` 是 PostPress 的产品页，纯静态：`index.html`（默认英文入口）+ 其余 13 门语言的独立静态目录（`zh/`、`zh-tw/`、`ja/`、`ko/`、`de/`、`fr/`、`es/`、`it/`、`pt-br/`、`ru/`、`tr/`、`uk/`、`id/`）+ `en/index.html`（旧链接兼容跳转）+ `styles.css` + `app.js` + `assets/`，由 [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) 直接发布到 GitHub Pages。仓库设置里 Pages 的 Source 要选 **GitHub Actions**，否则工作流不会生效。

- **14 语言静态生成**：所有页面由 [`dev/build-site-i18n.mjs`](../dev/build-site-i18n.mjs) 从 [`site/template.html`](./template.html) 与 [`site/locales/*.json`](./locales) 静态生成，同时更新 `site/en/index.html` 与 `site/sitemap.xml`。修改文案或模板后执行：
  - `node dev/build-site-i18n.mjs` 重新生成全部 HTML 与 sitemap；
  - `node dev/build-site-i18n.mjs --check` 校验生成产物与字典同步。
- **两套皮，同一张版**：默认近黑（`#0c0e11` 底 + 薄荷按钮），另一套是纸面（`#ecedea` 底 + 深绿按钮 + 近黑结尾）。右上角切换，存在 `localStorage`，`?theme=light` 也能直接打开。
- **14 门语言与 hreflang 互指**：`/` 为英文默认页（`x-default`），其余 13 门语言各有独立目录与 `og:locale`，全部页面通过 `<link rel="alternate" hreflang="...">` 互指；右上角语言下拉框可跳转对应语言路径并保留当前 `?theme=` 参数。
- **内容带停在 1680px**：超宽屏时背景色块仍铺满整宽，文字与栅格收进 `--edge` 边距，字号也上一个台阶。
- **配色取品牌**：近黑 `#0c0e11`（底）、`#1e2229`（右侧舞台）、米白 `#f2f4f0`（字）、薄荷 `#6cc59c`（只给按钮与选中态，来自 `ui/brandMark.ts` 的机身）、结尾的纸色 `#f5f6f4`。卡片自己的纸色是页面上唯一的彩色，别的颜色不要加。
- 首屏右半是产品本身：一张真实导出的卡片 + 12 个材质按钮（`data-ui`），点一张换一张，**页面下方跟着换**。默认材质跟着皮走：深色给「夜幕」，浅色给「极简」；手动点过任意材质后就不再自动切。
- `assets/cards/*` 由 `src/content/ui/Card.tsx` 与 `src/content/ui/App.tsx` 在 2× DSF 下渲染并经 Pillow 转为 WebP：
  - 12 套材质 × 6 张卡片（首屏 `{id}.webp`、长串 `thread-{id}.webp`、长文 `article-{id}.webp`、三种页脚状态 `switch-{full|plain|blur}-{id}.webp`）、12 张 `thumb-{id}.webp` 与 12 张左右分栏真实 `App.tsx` Studio 弹窗截图 `panel-{id}.webp`（带透明圆角 Alpha 通道）。
  - `#article` 区域另配 `showcase-quad.webp`（四图无裁切）与 `showcase-grid20.webp`（20 图四列拼版），支持标签切换。
  - `og.jpg`（中文）与 `og-en.jpg`（英文及其他语言，1200×630 JPEG）用于社交分享预览。
  - 全部示例人物、账号与推文均为虚构；摄影配图来自 Unsplash（Unsplash License），摄影师署名列在页面页脚。
- 卡片样式或弹窗改版后可用 `.tmp/community-promo/shoot-site-cards.mjs` 重新渲染并替换同名文件。
