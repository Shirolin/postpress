# 实测记录：单帖 20 张媒体（轮播形态）

> **状态：判据已落地**，锁在 `tier1` F12.6 / F28.9、`tier_graphql` gql.35。
> 本文是一次性快照，不是待办清单。采集日期 2026-11-13，界面语言 zh-CN。
> 采集方式：登录态 Chrome，直接读实时 DOM 与页面发出的 GraphQL 响应，**没有**保留完整
> `outerHTML`（见文末）；下面的数量与结构都是当时量到的。

## 为什么会有这篇

X 于 2026-11-12 把单帖图片/视频上限从 4 提到 20（Jonah Katz 公告；网页版先上线）。
此前的提取器与卡片都把媒体截到 4，需要确认新形态在两条通道里的真实结构。

## 实测对象

`https://x.com/Sunne_Three/status/2120992137848451326` —— 正文「Wdym twenty image posts
holy shit」，实际带 **16 张图**（不是 20），全部是照片，无视频/GIF。

## DOM：轮播结构

```
article[data-testid="tweet"]
  └─ … [data-testid="ScrollSnap-SwipeableList"]
       └─ [data-testid="ScrollSnap-List"]
            ├─ div[role="presentation"]              ← 1 个 slide = 1 张图
            │    └─ a[href="/<user>/status/<id>/photo/N"]
            │         └─ div[data-testid="tweetPhoto"]
            │              ├─ div[style*="background-image"]  ← 懒加载后的缩略图
            │              └─ img[src="…?format=jpg&name=240x240"]
            └─ … 共 16 个 slide
```

- **16 个 slide 全部在 DOM 里**，没有观察到虚拟化；`a[href*="/photo/"]` 也是 16 个，
  `photo/1`–`photo/16` 连续。
- **图片是懒加载的**：`article` 刚可见时 `div[data-testid="tweetPhoto"]` 为 **0**，
  `img` 也为 0；图片解码后才变成 16 个 `tweetPhoto`。
- 图片地址是 `name=240x240` 的缩略图；`upgradePhotoUrl` 换 `name=orig` 的既有规则仍然适用。
- 每张图的 `aspect-ratio` 由 slide 内层容器声明（本例 1.17647 / 1）。

## GraphQL

页面发出的 `TweetDetail` 响应里，目标帖：

- `legacy.extended_entities.media.length === 16`
- `legacy.entities.media.length === 16`

同一页面的时间线响应里还抓到一条 **6 图帖**（`2121017784020677117`），说明 >4 已是常态，
不是一次性的异常载荷。

## 对代码的影响

- DOM 通道按 `tweetPhoto` 逐个读，超过四个的结果是「同一个 testid 出现更多次」，
  不需要新选择器；因此**没有**把 `ScrollSnap-*` 写进判据。
- 两条通道的上限都改为 `MAX_MEDIA_PER_POST = 20`（`src/types/tweet.ts`）。
- 卡片五张起按四列多行排；完整展示保留每张比例，填充铺满裁成方块。

## 没采到什么

- **20 张整的帖子**：没有遇到，16 已是本次样本的最大值。
- **混合媒体轮播**（照片 + 视频/GIF）：`tweetPhoto` 里如何区分视频海报未单独采样。
- **图片未加载时点击按钮**的端到端行为：本文只确认了「加载前 `tweetPhoto` 为 0」。
  content script 现在在「帖子有轮播、解析结果又没有媒体」时有界等待（≤1 秒）再重解析，
  但该等待在真实网络下的表现没有逐帧验证。
- **完整 `outerHTML`**：本轮为控制体积只存了 `snapshot()` 级的结构与计数。若将来要复核，
  请按 `docs/real-dom-sampling-checklist.md` 的口径补一份 `article[data-testid="tweet"]` 的
  outerHTML，放进 `tests/fixtures/` 前先去掉扩展注入的 `ujs-*` 节点。
