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

## 背景音乐的授权

BGM 是 Google Flow Music 生成的，音效全部 CC0 1.0。`flowmusic.app/terms` 直接跳转到
Google 服务条款，没有音乐专属的授权页；Google 条款写的是你保留自己内容的权利，也没有禁止把输出发布出去。
所以「不能用」没有依据。

会咬人的是另一件事：Content ID。YouTube 会把音轨拿去比对已登记的音乐库，生成模型有可能撞上训练素材里的
段落，命中后果是限流、分地区屏蔽或消音——这和公开与否无关，不公开一样比对。

这一关目前是过的：上传时 YouTube 的版权检查给出「检查完毕。未发现任何问题。」，频道的内容检测页也没有
任何主张。残余风险是主张事后才来（有人事后登记曲库），代价是这条视频被限制，那时换 BGM 重混即可
——`.tmp/promo/build-audio-v15.mjs` 换 BGM 输入重跑，画面不用重渲，再传新 Release 与两条新视频。
