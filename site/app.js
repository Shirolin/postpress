/**
 * PostPress 产品页：语言切换、材质样张、展示标签、入场动效。
 *
 * 页面本身是静态 HTML（根路径 `/` 为中文，`en/` 为英文）；这里负责多语言原地切换、
 * 全页材质样张联动、长文/多图网格切换以及动效。JS 不跑时静态版本仍然完整可读。
 */

const MATERIALS = {
  minimal: {
    zh: '极简',
    en: 'Minimal',
    surface: '#faf9f5', // taste-skill-ignore 产品自身的纸色，不是页面配色
    ink: '#121211',
    accent: '#2563eb',
    zhNote: '暖白纸面，没有边框线，只留排版自身。',
    enNote: 'Warm white, no frame, nothing but the typesetting.',
  },
  midnight: {
    zh: '夜幕',
    en: 'Midnight',
    surface: '#181b22',
    ink: '#f0f2f5',
    accent: '#7aa2ff',
    zhNote: '深墨底、浅字，夜里读也不刺眼。',
    enNote: 'A deep ground with pale type, easy at night.',
  },
  glass: {
    zh: '液态玻璃',
    en: 'Liquid Glass',
    surface: '#ebf1f8',
    ink: '#0f172a',
    accent: '#0369a1',
    zhNote: '半透明玻璃片，边缘一道细光。',
    enNote: 'A translucent pane with a thin lit edge.',
  },
  material: {
    zh: '质感',
    en: 'Material 3',
    surface: '#f4f6f0',
    ink: '#191d17',
    accent: '#3e6837',
    zhNote: 'MD3 的色块层次与圆角。',
    enNote: 'Material 3 tonal blocks and corners.',
  },
  gallery: {
    zh: '画廊',
    en: 'Gallery',
    surface: '#f7f7f4',
    ink: '#101011',
    accent: '#1b3bd6',
    zhNote: '墙标与左侧装帧线，像美术馆的展签。',
    enNote: 'A wall label and a mounting rule, like a museum caption.',
  },
  darkroom: {
    zh: '暗房',
    en: 'Darkroom',
    surface: '#1b1b1e',
    ink: '#ededf0',
    accent: '#ffb02e',
    zhNote: '接触印相：片号、留白、银盐的灰。',
    enNote: 'A contact print: frame numbers, margins, silver grey.',
  },
  riso: {
    zh: '孔版',
    en: 'Riso',
    surface: '#f2f3ee',
    ink: '#17238a',
    accent: '#ff3d8b',
    zhNote: '荧光墨、错位套印、纸的颗粒。',
    enNote: 'Fluorescent inks, a misregistered pass, paper grain.',
  },
  sumi: {
    zh: '水墨',
    en: 'Sumi',
    surface: '#e4e9e3',
    ink: '#161f1a',
    accent: '#b4281d',
    zhNote: '宣纸、淡墨、一枚朱砂印。',
    enNote: 'Rice paper, diluted ink, a cinnabar seal.',
  },
  clay: {
    zh: '软陶',
    en: 'Clay',
    surface: '#d8e6f4',
    ink: '#0d2540',
    accent: '#ff6a2b',
    zhNote: '圆角、软过渡，像捏出来的。',
    enNote: 'Rounded and soft, as if pressed by hand.',
  },
  terminal: {
    zh: '终端',
    en: 'Terminal',
    surface: '#161d16',
    ink: '#d8f5d0',
    accent: '#5ee08a',
    zhNote: '等宽字、扫描线、命令行绿。',
    enNote: 'Monospace, scanlines, console green.',
  },
  receipt: {
    zh: '小票',
    en: 'Receipt',
    surface: '#f5f5f1',
    ink: '#1c1c1b',
    accent: '#1c1c1b',
    zhNote: '热敏纸、虚线、紧排的等宽小字。',
    enNote: 'Thermal paper, dashed rules, tight monospace.',
  },
  brutalist: {
    zh: '粗野派',
    en: 'Brutalist',
    surface: '#ffe64a',
    ink: '#111110',
    accent: '#5a14d8',
    zhNote: '3px 硬边、荧光黄，实验性的一档。',
    enNote: 'A 3px hard frame and fluorescent yellow. Experimental.',
  },
};

const EN = {
  skip: 'Skip to content',
  'nav.thread': 'Threads',
  'nav.article': 'Articles',
  'nav.privacy': 'Privacy',
  'nav.install': 'Install',
  'hero.h1': 'Copy any post as a card.',
  'hero.sub':
    'Skip the manual crop-and-screenshot routine. Click the button on a post (or press Alt + C) to copy a single post or same-author thread as a crisp 3× card straight to your clipboard, ready to paste anywhere. Twelve materials, rendered entirely on your machine.',
  'hero.meta':
    'Free and open source · GPL-3.0-or-later · Chrome / Edge (Manifest V3, Chrome 111 and later)',
  'cta.install': 'Add from Chrome Web Store',
  'cta.install2': 'Add from Chrome Web Store',
  'cta.source': 'Source and docs',
  'spec.pick': 'Pick a material',
  'facts.materials': 'materials',
  'facts.canvas': 'canvas shapes',
  'facts.locales': 'interface languages',
  'facts.export': 'Retina copy',
  'thread.h2': 'Threads stitch themselves.',
  'thread.body':
    "Posts in one thread are joined by author and time, with ads and stray replies filtered out. Two ways in: X's own GraphQL cache first, then the rendered DOM when nothing is cached. Any post you would rather not show comes off with one click.",
  'thread.tick1': 'Consecutive posts by one author are joined; ads and third-party replies stay out',
  'thread.tick2': 'Long threads export at 2× by default, under the platform size ceiling',
  'thread.tick3': 'When a card would read too small in a feed, the panel says so before you export',
  'thread.cap': 'Three posts by one author, one of them quoting: the whole card as it exports.',
  'thread.d1': 'Posts',
  'thread.d2': 'Photos',
  'thread.d3': 'Quote',
  'thread.d4': 'Export',
  'guide.h2': 'How to screenshot a tweet without the clutter',
  'guide.intro':
    'Most people grab a tweet screenshot to share an idea in a deck, newsletter, or group chat—only to end up with reply threads, sidebars, and soft text. There are three common ways to turn a tweet to image, and each carries a clear trade-off.',
  'guide.m1t': 'Phone screenshot',
  'guide.m1':
    'Press the hardware buttons on iOS or Android, then crop out the status bar, navigation icons, and the first reply underneath. It is fast for a single short post, but the trade-off is fixed screen resolution, uneven margins, and no clean way to capture a multi-post thread without stitching several screenshots together by hand.',
  'guide.m2t': 'Browser region capture',
  'guide.m2':
    'Use the OS snipping tool or a browser screenshot shortcut to drag a rectangle around the post on desktop. You get slightly more control over framing than on a phone, yet the trade-off is still display DPI, visible browser chrome or hover states, and re-cropping every time a quote card or photo grid sits near the edge of the viewport.',
  'guide.m3t': 'Render the post as a card',
  'guide.m3':
    'Instead of photographing pixels off the screen, parse the post’s text, media, and thread structure and lay them out fresh on a clean canvas. The trade-off is that hosted web tools usually ask you to paste a tweet URL into a third-party server, wait on rate-limited APIs, or live with watermarks and broken long threads.',
  'guide.outro':
    'PostPress takes that third approach and runs it entirely inside your browser: click the card button on any X post (or press Alt + C), pick a material, and copy a crisp 3× PNG straight to your clipboard—with replies and ads filtered out, no server, and no login.',
  'guide.cap':
    'A tweet rendered locally in the Midnight material—no browser chrome, no stray replies.',
  'article.h2': 'Articles, quotes and image grids survive.',
  'article.tab1': 'X Article',
  'article.tab2': 'Zero-Crop Quad',
  'article.tab3': '20-Image Grid',
  'article.lead':
    'An X Article brings out its cover and lead; a quoted post is filled or outlined to suit the material; one to twenty pictures keep their own proportions in the grid, four to a row past the first four (fill crops them square).',
  'article.lede': '“Not a filter — paper, rule and type at the right ratio.”',
  'article.s1t': 'Article',
  'article.s1': 'Cover, kicker, title and lead come through together.',
  'article.s2t': 'Quote',
  'article.s2': 'Filled or outlined, following the material.',
  'article.s3t': 'Pictures',
  'article.s3': 'One to twenty keep their own proportions instead of being cropped square; four to a row past the first four, and fill crops them square.',
  'switch.h2': 'Eight switches, one Studio.',
  'switch.lead':
    'Material, canvas, background, footer details, author blur and export resolution all live on this one Studio modal; change one and the live preview follows. Your choices are remembered, so day to day you just open and hit Copy.',
  'switch.panelCap': 'The real Studio modal: left preview and right controls stay in sync live.',
  'switch.cap1': 'All on',
  'switch.cap1b': 'QR, counts, time, credit.',
  'switch.cap2': 'Footer off',
  'switch.cap2b': 'The body alone.',
  'switch.cap3': 'Blurred',
  'switch.cap3b': 'Author and quoted author together.',
  'privacy.h2': 'It runs on your machine, end to end.',
  'privacy.body':
    "No account, no server, no telemetry. Typesetting happens inside an isolated Shadow DOM and the export is drawn by the browser's own canvas. Apart from fetching the pictures already in your card from X's image hosts, nothing leaves the machine.",
  'privacy.note':
    'It does not read your timeline, needs no X account and no X API. Not affiliated with X Corp.',
  'privacy.p1': 'Puts the finished image on your clipboard, only when you press Copy.',
  'privacy.p2': 'Remembers your material, canvas and switches; stored locally.',
  'privacy.p3': "Fetches the card's pictures. A canvas cannot read cross-origin images without it.",
  'install.h2': 'Into your browser.',
  'install.lead':
    'Install from the Chrome Web Store in one click; or expand the three-step build from source below.',
  'install.store': 'Add from Chrome Web Store',
  'install.cta': 'Open GitHub repository',
  'install.sourceSummary': 'For developers: build from source (3 steps)',
  'install.s1t': 'Build',
  'install.s1':
    'Clone the source, install and build. The output lands in <code>dist/</code>.',
  'install.s2t': 'Load',
  'install.s2':
    'Open <code>chrome://extensions</code>, turn on Developer mode, choose Load unpacked, and pick the <code>dist/</code> folder.',
  'install.s3t': 'Use',
  'install.s3': 'Press the card button on any post (or hover and hit <kbd>Alt</kbd> + <kbd>C</kbd>), click Copy Image, and paste anywhere.',
  'install.note': 'Released under GPL-3.0-or-later: redistribute your changes under the same licence.',
  'faq.h2': 'Asked most',
  'faq.lead': 'Eight real questions, answers on the right.',
  'faq.q1': 'Why not just screenshot?',
  'faq.a1':
    "Cropping a screenshot by hand means dodging replies, stitching long threads across multiple captures, and settling for display DPI and browser chrome. One click on PostPress lays out the whole post or thread to the material's rules and puts a crisp 3× image straight on your clipboard, ready to paste.",
  'faq.q2': 'Does a long card blur in the feed?',
  'faq.a2':
    'A single post exports at 3×. A very long thread defaults to 2× to stay under the size ceiling; when it would read too small, the panel warns and suggests splitting. A global 3× switch lives in the export settings.',
  'faq.q3': 'Do I need to log in or connect X?',
  'faq.a3':
    'No. There is no account system: it reads only what the page in front of you has already rendered, and never touches a credential.',
  'faq.q4': 'Is anything uploaded?',
  'faq.a4':
    'No. The image goes to your clipboard and your disk; closing the preview releases the rest. No post content is stored.',
  'faq.q5': 'Can I use it commercially?',
  'faq.a5':
    'The software is GPL-3.0-or-later and free to use commercially. The words and pictures inside a card still belong to their author; check before you redistribute.',
  'faq.q6': 'Which browsers can run it?',
  'faq.a6':
    'Chrome and Edge, from Chrome 111 (Manifest V3). Firefox and Safari are not supported yet: the extension is built on Chromium’s extension APIs.',
  'faq.q7': 'How do I screenshot a tweet without replies?',
  'faq.a7':
    'Click the PostPress card button on the post (or hover and press Alt + C). PostPress reads only that post—or consecutive posts by the same author in a thread—and automatically leaves out ads and third-party replies. If a thread includes a post you want to omit, click once to exclude it before copying.',
  'faq.q8': 'Can I turn a tweet into a PNG?',
  'faq.a8':
    'Yes. PostPress renders the card locally in your browser and copies a 3× PNG straight to your clipboard (or downloads the PNG file to your disk). Very long threads default to 2× to stay under the size ceiling, with an option in export settings for 3×.',
  'close.h2': 'Your next post deserves paper.',
  'close.sub': 'Install once, then it sits in the action bar of every post. One click to the clipboard, ready to paste anywhere.',
  'foot.readme': 'README',
  'foot.privacy': 'Privacy',
  'foot.license': 'Licence',
  'foot.credit':
    'Sample card photographs via Unsplash (Unsplash License): @declansun, @xanderart, @parrish, @hngstrm, @dnevozhai, @kugedo6060, @nicolonimor, @peemaglama, @markusspiske, @hannynaibaho, @jakobowens1, @mitchures, @migueljoya, @kellysikkema, @bady, @egorghetto, @vonshnauzer, @kimonmaritz, @monadiform, @deconovo, @evstyle, @chatelp, @a7med7, @renjunn, @benchaccounting, and @andrew_bright. @claranovak, @kenjisato_35mm, @marcusreid, @noralind, and @postpress_ext are invented sample accounts.',
  'foot.gpl': 'GPL-3.0-or-later',
  'theme.minimal': 'Minimal',
  'theme.midnight': 'Midnight',
  'theme.glass': 'Liquid Glass',
  'theme.material': 'Material 3',
  'theme.gallery': 'Gallery',
  'theme.darkroom': 'Darkroom',
  'theme.riso': 'Riso',
  'theme.sumi': 'Sumi',
  'theme.clay': 'Clay',
  'theme.terminal': 'Terminal',
  'theme.receipt': 'Receipt',
  'theme.brutalist': 'Brutalist',
};

const ZH = {
  skip: '跳到正文',
  'nav.thread': '长串',
  'nav.article': '长文',
  'nav.privacy': '隐私',
  'nav.install': '安装',
  'hero.h1': '把推文复制成卡片。',
  'hero.sub':
    '不用手拉框选截屏。点一下按钮（或按 Alt + C），整条推文与同作者长串直接排成 3× 高清卡片写进剪贴板，随手粘贴到任何地方；十二套材质，全部在本机完成，不登录、不上传。',
  'hero.meta':
    '免费开源 · GPL-3.0-or-later · Chrome / Edge（Manifest V3，Chrome 111 起）',
  'cta.install': '从 Chrome 商店安装',
  'cta.install2': '从 Chrome 商店安装',
  'cta.source': '源码与文档',
  'spec.pick': '挑一种材质',
  'facts.materials': '套材质',
  'facts.canvas': '种外层画幅',
  'facts.locales': '种界面语言',
  'facts.export': '超清复制',
  'thread.h2': '长串会自己接上。',
  'thread.body':
    '同一条串里的推文按作者与时间接起来，广告和第三方回复被剔除。解析走两条路：先读 X 自己的 GraphQL 缓存，读不到再退回页面上的 DOM 标记。不想展示的那一条，点一下剔掉。',
  'thread.tick1': '同作者连续推文自动拼合，广告与路人回复不进来',
  'thread.tick2': '长串默认 2× 导出，躲开平台尺寸上限',
  'thread.tick3': '比例过大、缩进信息流会看不清时，面板会先提醒你分段',
  'thread.cap': '三条同作者推文，其中一条带引用，导出的就是这一整张长卡片。',
  'thread.d1': '推文',
  'thread.d2': '配图',
  'thread.d3': '引用',
  'thread.d4': '导出',
  'guide.h2': '如何把推文截得干净，不带页面杂讯',
  'guide.intro':
    '把推文转成图片放进文档、简报或群聊时，普通截屏往往会带进底下的评论、侧边栏和发虚的文字。把推文保存成图片常见有三种做法，各自都有明确代价。',
  'guide.m1t': '手机自带截屏',
  'guide.m1':
    '按下手机截屏键，再手动裁掉状态栏、导航图标和下面露出来的第一条评论。单条短推文确实顺手，但代价是清晰度锁死在屏幕分辨率、留白参差不齐，遇到同作者长串只能滚动截好几张再手工拼接。',
  'guide.m2t': '浏览器选区截屏',
  'guide.m2':
    '在桌面端用系统截图工具或浏览器快捷键框选推文区域。构图比手机稍微可控，但代价依然是跟着显示器 DPI 走，容易截进悬停态或滚动条，遇到带引用卡片或多图网格的推文，每次都得反复拉框重裁。',
  'guide.m3t': '直接渲染成卡片',
  'guide.m3':
    '不再对着屏幕拍像素，而是读取推文的正文、配图与长串结构，在干净的画布上重新排版输出。代价是市面上的在线网页工具大多需要把链接粘给第三方服务器，受限于接口额度，还常带水印或长串断层。',
  'guide.outro':
    '印推（PostPress）采用的正是第三种做法，但全程留在你的浏览器本机完成：在任意 X 推文上点一下按钮（或按 Alt + C），选好材质就能把 3× 高清 PNG 直接复制进剪贴板——自动滤掉评论与广告，无需服务器，也无需登录。',
  'guide.cap': '夜幕材质下的本机渲染卡片：没有浏览器边框，也没有多余评论。',
  'article.h2': '长文、引用、四宫格，都不丢。',
  'article.tab1': 'X 长文',
  'article.tab2': '四图无裁切',
  'article.tab3': '20 图拼版',
  'article.lead':
    'X 长文会带出封面与导语；引用帖按材质填充或描边；一到二十张配图按各自比例拼成网格，五张起四列多行，填充铺满时每格裁成方块。',
  'article.lede': '“不是滤镜，是纸、线与字的比例。”',
  'article.s1t': '长文',
  'article.s1': '封面、栏目名、标题与导语一起带出来。',
  'article.s2t': '引用',
  'article.s2': '填充或描边，跟当前材质走。',
  'article.s3t': '配图',
  'article.s3': '一到二十张按各自比例拼成网格，五张起四列多行；填充铺满时裁成方块。',
  'switch.h2': '八个开关，一块工作台。',
  'switch.lead':
    '材质、画幅、背景、页脚信息、作者模糊、导出清晰度都在这个弹窗工作台上；改一下，左侧卡片预览立刻跟着变。偏好会自动记住，平时点开直接点「复制图片」就能走。',
  'switch.panelCap': '真实 Studio 弹窗，左侧预览与右侧开关实时联动。',
  'switch.cap1': '全开',
  'switch.cap1b': '二维码、数据、时间、署名。',
  'switch.cap2': '关页脚',
  'switch.cap2b': '只剩正文。',
  'switch.cap3': '打码',
  'switch.cap3b': '作者与引用作者一起模糊。',
  'privacy.h2': '全程在本机跑完。',
  'privacy.body':
    '没有账号，没有服务器，没有遥测。排版在隔离的 Shadow DOM 里完成，导出交给浏览器自己的画布；除了向 X 的图片域名取你卡片里本来就有的配图，不发任何请求。',
  'privacy.note': '不读取你的时间线，不需要 X 账号，也不用 X API。与 X Corp. 无关联。',
  'privacy.p1': '把渲染好的图片放进剪贴板，只在你点「复制」时用。',
  'privacy.p2': '记住你选的材质、画幅与开关；只存在本地。',
  'privacy.p3': '取卡片里的配图。画布读不了跨域图片，没有它导出会失败。',
  'install.h2': '装进浏览器。',
  'install.lead': '从 Chrome 应用商店一键安装；想自己编译，也可在下方展开源码三步构建。',
  'install.store': '从 Chrome 应用商店安装',
  'install.cta': '打开 GitHub 仓库',
  'install.sourceSummary': '开发者与自定义：从源码构建（三步）',
  'install.s1t': '构建',
  'install.s1': '拉下源码装依赖再构建，产物在 <code>dist/</code>。',
  'install.s2t': '载入',
  'install.s2':
    '打开 <code>chrome://extensions</code>，开启「开发者模式」，点「加载已解压的扩展程序」，选 <code>dist/</code>。',
  'install.s3t': '用',
  'install.s3': '在任意推文的操作栏点卡片按钮（或悬停按 <kbd>Alt</kbd> + <kbd>C</kbd>），点「复制图片」，去别处直接粘贴。',
  'install.note': '以 GPL-3.0-or-later 发布：改完再分发请同样开源。',
  'faq.h2': '常被问到的',
  'faq.lead': '八个真问题，答案就在右边。',
  'faq.q1': '为什么不直接截屏？',
  'faq.a1':
    '截屏要手拉框选、躲开底下的评论，遇到长推文还得滚动截好几张；截出来的图跟着屏幕 DPI 走，还夹带浏览器界面。点一下印推，整条推文或长串直接按材质规范重新排成 3× 高清图写进剪贴板，随手就能粘贴，缩到信息流宽度依然锐利。',
  'faq.q2': '长串发到信息流会被压糊吗？',
  'faq.a2':
    '单条按 3× 导出。超长串默认 2× 以躲开尺寸上限；缩进信息流会小到难读时，面板会提示并建议分段。要极清可以在导出设置里强制 3×。',
  'faq.q3': '需要登录或绑定 X 吗？',
  'faq.a3': '不需要。没有账号体系，只读当前页面已经渲染出来的内容和宿主自己的缓存，不碰任何凭据。',
  'faq.q4': '导出的东西会被上传吗？',
  'faq.a4': '不会。图片只写到剪贴板和你的硬盘；关掉预览即释放内存，不在本地保存推文内容。',
  'faq.q5': '能商用吗？',
  'faq.a5':
    '软件本身是 GPL-3.0-or-later，可以商用。卡片里的文字与配图仍属于原作者，公开可见不等于可以随意商用，分发前请自己确认。',
  'faq.q6': '能装在哪些浏览器上？',
  'faq.a6': 'Chrome 与 Edge，Chrome 111 起（Manifest V3）。Firefox 与 Safari 还没适配——扩展用的是 Chromium 的扩展接口。',
  'faq.q7': '怎么只截推文正文、不把底下的评论截进去？',
  'faq.a7':
    '在目标推文上点一下印推卡片按钮（或悬停按 Alt + C）。印推只读取当前推文或同作者连续长串，自动过滤广告与第三方回复；如果长串里某一条不想展示，导出前点一下即可剔除。',
  'faq.q8': '能把推文直接转成 PNG 图片吗？',
  'faq.a8':
    '可以。印推在浏览器本机渲染卡片，单条推文默认导出 3× 高清 PNG，一键复制到剪贴板或保存为本地 PNG 文件。超长串默认按 2× 输出以避开尺寸上限，也可以在导出设置里强制开启 3×。',
  'close.h2': '下一条推文，印出来。',
  'close.sub': '装一次，之后每条推文的操作栏里都有它。点一下进剪贴板，随处都能粘贴。',
  'foot.readme': 'README',
  'foot.privacy': '隐私说明',
  'foot.license': '许可',
  'foot.credit':
    '示例卡片摄影来自 Unsplash（Unsplash License）：@declansun、@xanderart、@parrish、@hngstrm、@dnevozhai、@kugedo6060、@nicolonimor、@peemaglama、@markusspiske、@hannynaibaho、@jakobowens1、@mitchures、@migueljoya、@kellysikkema、@bady、@egorghetto、@vonshnauzer、@kimonmaritz、@monadiform、@deconovo、@evstyle、@chatelp、@a7med7、@renjunn、@benchaccounting、@andrew_bright。卡片中的 @claranovak、@kenjisato_35mm、@marcusreid、@noralind 与 @postpress_ext 均为虚构示例账号。',
  'foot.gpl': 'GPL-3.0-or-later',
  'theme.minimal': '极简',
  'theme.midnight': '夜幕',
  'theme.glass': '液态玻璃',
  'theme.material': '质感',
  'theme.gallery': '画廊',
  'theme.darkroom': '暗房',
  'theme.riso': '孔版',
  'theme.sumi': '水墨',
  'theme.clay': '软陶',
  'theme.terminal': '终端',
  'theme.receipt': '小票',
  'theme.brutalist': '粗野派',
};

const TITLES = {
  zh: 'PostPress · 印推：把 X 推文复制成卡片',
  en: 'PostPress: Clean Tweet Screenshot Tool for X',
};

const DESCRIPTIONS = {
  zh: '不用手拉框选截屏。点一下按钮（或按 Alt + C），把 X 推文与同作者长串复制成 3× 高清卡片，随手粘贴到任何地方；十二套材质，纯本机渲染，不登录、不上传。',
  en: 'Turn any tweet to image in one click. Copy X posts and threads as 3× PNG cards to your clipboard—12 materials, 100% local, no login.',
};

const root = document.documentElement;
root.classList.add('js');

const BASE = root.dataset.base || '.';
const pageLang = root.dataset.pageLang === 'en' ? 'en' : 'zh';

/* -------------------------------------------------------------- 语言 */

const langButton = document.getElementById('lang');
const description = document.querySelector('meta[name="description"]');
const textNodes = [...document.querySelectorAll('[data-i18n]')];
const original = new Map(textNodes.map((el) => [el, el.innerHTML]));

let lang = pageLang;
if (pageLang === 'en') {
  try {
    if (localStorage.getItem('pp-lang') === 'zh') lang = 'zh';
  } catch {
    /* 隐私模式下读不到存储，用默认语言 */
  }
}

function applyLanguage(next) {
  lang = next;
  root.lang = next === 'en' ? 'en' : 'zh-CN';
  document.title = TITLES[next];
  if (description) description.setAttribute('content', DESCRIPTIONS[next]);

  const dict = next === 'en' ? EN : ZH;
  for (const el of textNodes) {
    const key = el.getAttribute('data-i18n');
    if (next === pageLang) el.innerHTML = original.get(el);
    else if (dict[key]) el.innerHTML = dict[key];
  }

  langButton.textContent = next === 'en' ? '中文' : 'EN';
  langButton.setAttribute('aria-label', next === 'en' ? '切换到中文' : 'Switch to English');

  renderThemeLabel();
  renderCaption();
  updateArticleAlt();
}

langButton.addEventListener('click', () => {
  const next = lang === 'en' ? 'zh' : 'en';
  try {
    localStorage.setItem('pp-lang', next);
  } catch {
    /* 存不下也不影响这次切换 */
  }
  applyLanguage(next);
});

/* ---------------------------------------------------------------- 主题 */

const themeButton = document.getElementById('theme');
const THEME_LABEL = {
  zh: { light: '浅色', dark: '深色' },
  en: { light: 'Light', dark: 'Dark' },
};

function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function renderThemeLabel() {
  const target = currentTheme() === 'light' ? 'dark' : 'light';
  themeButton.textContent = THEME_LABEL[lang][target];
  themeButton.setAttribute(
    'aria-label',
    lang === 'en'
      ? `Switch to the ${target} version`
      : `切换到${target === 'light' ? '浅色' : '深色'}版`
  );
}

function setTheme(theme) {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem('pp-theme', theme);
  } catch {
    /* 存不下也不影响这次切换 */
  }
  renderThemeLabel();
  syncMaterialToTheme();
}

themeButton.addEventListener('click', () => {
  setTheme(currentTheme() === 'light' ? 'dark' : 'light');
});

/* ------------------------------------------------------------ 材质样张 & 展示标签 */

const specimenImg = document.getElementById('specimen-img');
const capName = document.getElementById('cap-name');
const capNote = document.getElementById('cap-note');
const capTokens = document.querySelector('.cap-tokens');
const materialButtons = [...document.querySelectorAll('.material')];
// 页面下方的长串、长文与三种页脚状态也跟着材质换，别只换顶上那一张。
const followingCards = [...document.querySelectorAll('[data-card]')];
const articleImg = document.getElementById('article-img');
const showcaseTabs = [...document.querySelectorAll('.showcase-tab')];

let material = currentTheme() === 'light' ? 'minimal' : 'midnight';
let pickedManually = false;
let showcaseMode = 'article';

function showMaterial(id) {
  material = id;
  specimenImg.src = `${BASE}/assets/cards/${id}.webp`;
  for (const img of followingCards) {
    if (img === articleImg && showcaseMode !== 'article') continue;
    img.src = `${BASE}/assets/cards/${img.dataset.card}-${id}.webp`;
  }
  renderCaption();
}

function updateArticleAlt() {
  if (!articleImg) return;
  const alts = {
    article: {
      zh: '示例卡片：一条带 X 长文的推文，上方是横版封面照片，下方是长文标题与导语。',
      en: 'Sample card: an X Article post with its cover photograph, kicker, title and opening line.',
    },
    quad: {
      zh: '示例卡片：Gallery 材质下的四张 3:2 建筑摄影，在 Fit 模式下零裁切完整对齐。',
      en: 'Sample card: four 3:2 architectural photographs mounted in Gallery with zero cropping in Fit mode.',
    },
    grid20: {
      zh: '示例卡片：单条推文携带 20 张照片，按四列多行均衡铺排。',
      en: 'Sample card: a 20-image post laid out cleanly in 4-column balanced rows.',
    },
  };
  articleImg.alt = alts[showcaseMode][lang];
}

function setShowcaseMode(mode) {
  showcaseMode = mode;
  for (const tab of showcaseTabs) {
    tab.setAttribute('aria-selected', String(tab.dataset.showcase === mode));
  }
  if (!articleImg) return;
  if (mode === 'article') articleImg.src = `${BASE}/assets/cards/article-${material}.webp`;
  else if (mode === 'quad') articleImg.src = `${BASE}/assets/cards/showcase-quad.webp`;
  else if (mode === 'grid20') articleImg.src = `${BASE}/assets/cards/showcase-grid20.webp`;
  updateArticleAlt();
}

for (const tab of showcaseTabs) {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.showcase;
    if (mode && mode !== showcaseMode) setShowcaseMode(mode);
  });
}

/** 没手动挑过时，默认材质跟着皮走：深色给夜幕，浅色给极简。 */
function syncMaterialToTheme() {
  if (pickedManually) return;
  showMaterial(currentTheme() === 'light' ? 'minimal' : 'midnight');
}

function renderCaption() {
  const m = MATERIALS[material];
  if (!m) return;
  capName.textContent = m[lang === 'en' ? 'en' : 'zh'];
  capNote.textContent = m[lang === 'en' ? 'enNote' : 'zhNote'];
  capTokens.innerHTML = [m.surface, m.ink, m.accent]
    .map((c) => `<i style="background:${c}"></i>`)
    .join('');
  specimenImg.alt =
    lang === 'en'
      ? `${m.en} material: sample post rendered as a card.`
      : `${m.zh}材质的卡片：实拍样张渲染效果。`;

  for (const button of materialButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.material === material));
  }
}

for (const button of materialButtons) {
  button.addEventListener('click', () => {
    const id = button.dataset.material;
    if (!id || id === material) return;
    pickedManually = true;
    showMaterial(id);
  });
}

/* ---------------------------------------------------------------- 动效 */

const ENTER_SELECTORS = [
  '.hero-copy > *',
  '.studio',
  '.close-line',
  '.close-foot',
  '.sec-head > *',
  '.facts',
  '.thread-text > *',
  '.thread-figure',
  '.guide-content > *',
  '.guide-methods > li',
  '.guide-figure',
  '.article-figure',
  '.article-lead',
  '.article-lede',
  '.article-points > li',
  '.panel-shot',
  '.switch-list > figure',
  '.privacy-text > *',
  '.perms > li',
  '.install-primary',
  '.install-source',
  '.faq-row',
];

const enters = [];
for (const section of document.querySelectorAll('.hero, .sec, .close')) {
  const parts = new Set();
  for (const selector of ENTER_SELECTORS) {
    for (const el of section.querySelectorAll(selector)) parts.add(el);
  }
  const ordered = [...parts].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
  ordered.forEach((el, i) => {
    el.setAttribute('data-enter', '');
    el.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
    enters.push(el);
  });
}

/**
 * Scroll 事件驱动，而不是 IntersectionObserver：后者在后台标签页里会被推迟投递，
 * 页面看着完成、实际每一块都还停在起始状态。这里只读几何，代价是每帧一次 rect。
 */
function reveal() {
  const limit = window.innerHeight * 0.92;
  for (const el of enters) {
    if (el.classList.contains('is-in')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top < limit && rect.bottom > 0) el.classList.add('is-in');
  }
}

window.addEventListener('scroll', reveal, { passive: true });
window.addEventListener('resize', reveal, { passive: true });
reveal();

// A tab that opens in the background delivers no scroll events and no frames, so
// the first reveal is also polled. It stops as soon as every block has arrived.
const poll = setInterval(() => {
  reveal();
  if (enters.every((el) => el.classList.contains('is-in'))) clearInterval(poll);
}, 250);

applyLanguage(lang);
showMaterial(material);
