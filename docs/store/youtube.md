# 宣传片的 YouTube 那两份

商店后台的视频字段只收 YouTube 链接，不收文件。两条都已上传，**不公开列出**：能嵌入、能看，
不进搜索、不进频道页。要公开就在 Studio 里改公开范围，链接不变。

| | 中文 | English |
| :--- | :--- | :--- |
| 链接 | <https://youtu.be/HIsYVIfMv2Q> | <https://youtu.be/jhM5ysK1C2c> |
| 母版 | `store-assets-v2/postpress-promo.mp4` | `store-assets-v2/postpress-promo-en.mp4` |
| 时长 | 30.0 s（YouTube 显示 0:31） | 同 |
| 后台填哪 | `zh_CN` 的本地化视频 | **全局**视频 |

封面 1280×720，由成片封面帧缩放得到（`docs/store/postpress-promo-poster*.png`），
换成专门设计的封面也可以，YouTube 只要求 1280×720、2 MB 以内。

## 两条的标题与说明

中文标题：

```
PostPress · 印推 — 把 X 推文一键复制成印刷级卡片（30 秒演示）
```

英文标题：

```
PostPress — Copy any X post as a print-grade card (30s demo)
```

说明两版都以「点一下按钮 → 卡片进剪贴板 → 随手粘贴」开头，列 12 材质 / 4 画幅 / 长串合并 /
本地渲染 / 14 语言，末尾给商店与仓库链接，并注明「与 X Corp. 无关」。

## 上传时选了什么

| 选项 | 值 |
| :--- | :--- |
| 受众 | 不是面向儿童的内容（必填，填错会被下架） |
| 年龄限制 | 无 |
| 类别 | Science & Technology |
| 标签 | `PostPress, Chrome extension, Twitter, X, screenshot, typesetting, clipboard` |
| 可见性 | 不公开列出 |

## 背景音乐的授权还没结清

BGM 是 Google Flow Music 生成的，`CREDITS.md` 记着「不是 CC0，使用与再分发以 Flow Music 的
服务条款为准」；音效全部 CC0 1.0，没有问题。

传到 YouTube 属于公开再分发，还会进 Content ID 比对，比挂在 GitHub Release 上暴露面大。
现在是不公开状态，撤回成本低。要彻底稳妥就换一条明确允许商用的曲子重混：
`.tmp/promo/build-audio-v15.mjs` 里换 BGM 输入重跑，画面不用重渲，然后传新 Release、重传两条视频。
