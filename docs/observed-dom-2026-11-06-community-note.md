# 社区笔记（Community Notes）真实 DOM / 载荷 — 2026-11-06

> **状态：本轮只覆盖一条笔记，两种显示形态。** 采集方式：用户本人登录的 Chrome，经
> ego-browser 驱动一个由 Agent 新建的标签页，读实时 DOM 与页面自己发出的 GraphQL 响应；
> 界面语言 zh-CN，X 的「自动翻译」开启。样本：
> `/VGC_News/status/2118431991993364868`（正文被翻译成中文，笔记也被翻译成中文）。
> 采集后被改成「显示原文」再读了一次结构，见 §3。**未采到**真正的「无翻译行」形态
> （源语言与界面语言相同的笔记），见 §5。

## 1. 结论

- 容器：`div[data-testid="birdwatch-pivot"]`，带 `role="link"`，指向笔记详情页。
  时间线与详情页都出现；它挂在推文 `article` 内部、媒体之后。
- 容器内**没有**可用的正文 testid；其余 testid 只有两个图标：
  `icon-birdwatch-fill`（状态行）和 `icon-birdwatch-level`（评分等级）。
- 正文是容器的直接子 `div`，靠「不是另外三块」定位：状态行有鸟形图标，翻译行有
  `button`，评分页脚的控制是 `div[role="link"]`（笔记自己的链接都是 `<a>`）。
  按位置数行会错：未翻译的笔记少一行（未被本轮采到），翻译后的笔记多一行。
- 卡片只印正文。状态行（「读者已提议补充背景信息」「正在收集评分」）是 X 实时本地化
  的界面文案，评分页脚是不可点击的控件，二者都不进卡片。卡片用自己语言的小标题
  「社区笔记」标识这一块。

## 2. DOM 形状（翻译态，直接子元素按文档顺序）

```html
<div data-testid="birdwatch-pivot" role="link">
  <div>                                  <!-- 状态行 -->
    <svg data-testid="icon-birdwatch-fill"></svg>
    <span>读者已提议补充背景信息</span>
    <div data-testid="icon-birdwatch-level">…3 个 svg…</div>
    <span>正在收集评分</span>
  </div>
  <span></span>                          <!-- 间距 -->
  <div>                                  <!-- 翻译行（可无？未采到） -->
    <div dir="ltr">
      <span>翻译自 英语</span>
      <button aria-label="显示原文">…</button>
      <button aria-label="关于自动翻译">…</button>
    </div>
  </div>
  <div dir="ltr">                        <!-- 正文：卡片取这一块 -->
    <span>声称的游戏大小增加到 366GB …</span>
    <a href="https://t.co/…">videogameschronicle.com/news/nier-auto…</a>
    …
  </div>
  <span></span>
  <div>                                  <!-- 评分页脚：卡片不取 -->
    <div dir="ltr">你觉得此信息是否有帮助？</div>
    <div role="link" tabindex="0">评价</div>
  </div>
</div>
```

正文里的换行与链接的三点省略号都是 X 渲染出来的文本；`cleanTweetText` 逐文本节点
还原，链接保留其显示形态（`videogameschronicle.com/news/nier-auto…`），不重新拼 URL。

## 3. 「显示原文」

点笔记里的 `button[aria-label="显示原文"]` 后，结构**不变**，翻译行的文案变成
「显示翻译」，正文变成英文源文。所以本轮只证明了「翻译行始终在」这一种形态；
真正的无翻译行形态仍未采到（见 §5）。

## 4. GraphQL 载荷

同一篇帖的 `TweetDetail` 响应里，带笔记的推文多一个 `birdwatch_pivot`：

```json
{
  "shorttitle": "读者已提议补充背景信息",
  "title": "读者已提议补充背景信息",
  "footer": { "text": "正在收集评分", "entities": [] },
  "footerIconType": "BirdwatchLevelLow",
  "iconType": "BirdwatchV1Icon",
  "visualStyle": "Tentative",
  "callToAction": {
    "title": "评价",
    "prompt": "你觉得此信息是否有帮助？",
    "destinationUrl": "https://twitter.com/i/birdwatch/n/<noteId>"
  },
  "note": {
    "rest_id": "<noteId>",
    "language": "en",
    "is_community_note_translatable": true,
    "grok_translated_community_note_with_availability": {
      "data": {
        "source_language": "en",
        "destination_language": "zh",
        "translation": "<中文笔记正文 + t.co 链接>",
        "rich_text_entities": [ … ]
      }
    }
  },
  "subtitle": {
    "text": "<英文笔记正文 + 显示形态链接>",
    "entities": [ { "fromIndex": 169, "toIndex": 208, "ref": { … } } ]
  }
}
```

- 卡片取 `subtitle.text`：它是笔记自己的话，且与卡片「来源语言」的既有口径一致。
- `shorttitle` / `footer.text` 是 X 本地化的实时状态，`callToAction` 是评分控件，
  都不取。
- 页面若把笔记翻译了，可见译文只在 DOM 里；`bridge.ts` 的 `applyDomTranslation`
  在 DOM 有笔记时用可见文本覆盖载荷。它不再只看帖子正文是否被翻译——正文与笔记
  可以各自独立翻译。

## 5. 未采到 / 待查

- **无翻译行的笔记**：源语言与界面语言相同时，X 是否仍渲染翻译行（只是按钮消失）
  未知。提取规则不依赖行数，理论上前两种形态都能命中；若以后遇到，
  把 `article` 的 `outerHTML` 补进 `tests/fixtures/community-note.ts` 的同类夹具。
- **笔记在不同入口的差异**：本轮只看了时间线搜索页与详情页，两者形状一致。
  列表视图、引用帖内部、被折叠的长笔记都未采。
- **`TweetResultByRestId` 的载荷外形与 `parse.ts` 不一致**：本轮抓到的是
  `data.tweetResult.result`，而 `parse.ts` 只认 `data.tweet.result`。本轮没有改它
  （详情页同时会发 `TweetDetail`，不影响卡片），但这是一个独立问题：
  如果某个入口只走 `TweetResultByRestId`，GraphQL 通道会静默 miss。
- 评分 thumbs（`thumbsUpVoteButton` / `thumbsDownVoteButton`）在本次样本中不在
  `birdwatch-pivot` 内部，位置未记录；卡片不取它们，所以不影响本功能。

## 6. 落点

| 位置 | 作用 |
|---|---|
| `src/types/tweet.ts` `TweetData.communityNote` | 卡片与两个通道共用的字段 |
| `src/content/adapter/extractor.ts` `extractCommunityNote` | DOM 通道：`birdwatch-pivot` → 正文 |
| `src/content/graphql/parse.ts` `parseCommunityNote` | 载荷通道：`birdwatch_pivot.subtitle.text` |
| `src/content/graphql/bridge.ts` `applyDomTranslation` | 可见译文覆盖载荷原文 |
| `src/content/ui/Card.tsx` `renderCommunityNote` | 小标题 + 正文 |
| `tests/fixtures/community-note.ts` | 本轮真实标记（去掉截图浏览器的下载扩展节点） |
| `tests/fixtures/graphql.ts` `TWEET_DETAIL_COMMUNITY_NOTE_JSON` | 载荷夹具 |
