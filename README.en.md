<div align="center">
  <img src="public/icons/icon-128.png" width="108" height="108" alt="PostPress Icon" />

  <h1>PostPress · 印推</h1>
  <p>
    <b>Skip manual cropping and screenshots—copy X (Twitter) posts and same-author threads as publication-grade 3× cards, ready to paste anywhere</b>
  </p>

  <p>
    <a href="README.md">简体中文</a> | English · <a href="https://shirolin.github.io/postpress/">Interactive Showcase & Gallery ↗</a>
  </p>

  <p>
    <a href="https://chromewebstore.google.com/detail/mfmldbbkajimckojjgceehiackjpakai"><img src="https://img.shields.io/badge/Chrome_Web_Store-Install_Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Web Store" /></a>
    <a href="https://github.com/Shirolin/postpress/releases/latest"><img src="https://img.shields.io/github/v/release/Shirolin/postpress?color=success&label=Release" alt="Release" /></a>
    <a href="https://github.com/Shirolin/postpress/actions/workflows/ci.yml"><img src="https://img.shields.io/github/v/release/Shirolin/postpress/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg" alt="License" /></a>
  </p>

  <p>
    <code>Manifest V3</code> · <code>Preact 10 + Shadow DOM</code> · <code>12 Tactile Themes</code> · <code>14 Languages (i18n)</code> · <code>100% Local Rendering</code> · <code>GPL-3.0-or-later</code>
  </p>
</div>

---

## 🚀 Overview

**PostPress** is a publication-grade card copy and typesetting extension built for X (Twitter). Skip the tedious crop-and-screenshot routine, multi-part thread stitching, and cluttered, low-DPI browser captures—click the **press icon** in any post's action bar (or press `Alt + C`), and PostPress turns a single post or multi-post thread into a clean **3× Retina card** ready to **copy straight to your clipboard** and paste into chats, notes, or docs (or save as a PNG, with 12 paper materials, aspect ratios, and outer canvas mats).

Every step—parsing, layout, and rasterization—runs 100% locally in your browser: **no login required, zero credential access, and zero external server communication**.

---

## 📸 Preview

> Explore interactive theme switching and all 12 materials on the product page: <https://shirolin.github.io/postpress/> (source in [`site/`](site/)).

### Material Themes (6 of 12 Shown)

| Minimal | Riso | Darkroom |
| :---: | :---: | :---: |
| ![Minimal](site/assets/cards/minimal.webp) | ![Riso](site/assets/cards/riso.webp) | ![Darkroom](site/assets/cards/darkroom.webp) |
| **Sumi** | **Liquid Glass** | **Receipt** |
| ![Sumi](site/assets/cards/sumi.webp) | ![Liquid Glass](site/assets/cards/glass.webp) | ![Receipt](site/assets/cards/receipt.webp) |

### Thread Stitching, Long-form Articles & Live Controls

| Same-Author Thread Stitching | X Long-form Article Layout | Live Customization Panel |
| :---: | :---: | :---: |
| ![Thread](site/assets/cards/thread-riso.webp) | ![Article](site/assets/cards/article-gallery.webp) | ![Controls Panel](site/assets/cards/panel-minimal.webp) |

### Granular Footer & Per-Author Privacy

| Full Footer (QR + Stats + Credit) | Clean Mode (Footer Hidden) | Author Privacy Blur |
| :---: | :---: | :---: |
| ![Full Footer](site/assets/cards/switch-full-minimal.webp) | ![Plain Footer](site/assets/cards/switch-plain-minimal.webp) | ![Author Blur](site/assets/cards/switch-blur-minimal.webp) |

---

## ✨ Key Features

#### 🎨 Publication-Grade Materials & Matting
- **12 Curated Material Themes**: Includes 11 permanent themes (*Minimal*, *Midnight*, *Liquid Glass*, *Material 3*, *Gallery*, *Darkroom*, *Riso*, *Sumi*, *Clay*, *Terminal*, *Receipt*) plus 1 experimental *Brutalist* theme. Each theme is a cohesive design system defining paper tone, border rules, typographic pairings, a single accent ink, and a custom signature mark.
- **Independent Canvas Matting (`Mat`)**: Mount your card onto an outer canvas for social-ready exports. Canvas aspect ratios (`1:1` / `4:5` / `3:4` / `16:9`) and backdrops (Follow Theme / Solid / Gradient) are controlled independently. Ratios enforce an elastic `min-height` floor so long posts never truncate; selecting a ratio alone keeps surrounding whitespace transparent for compositing.
- **14 Interface & Card Languages**: Native localization across 14 locales (EN, ZH-CN, ZH-TW, JA, KO, DE, FR, ES, IT, PT-BR, RU, TR, UK, ID). Automatically follows your browser or pins to a chosen language, localizing modal controls and card timestamps while leaving the author's original post text untouched.

#### 🔍 Dual-Channel Extraction Engine
- **Smart Thread Stitching**: Powered by a **GraphQL-first + DOM fallback** pipeline (`resolveThread`). Automatically connects consecutive posts by the same author, strips promoted ads and unrelated replies, and lets you exclude individual posts inside the live preview.
- **Long-form Articles & Rich Media**: Natively parses X Articles (extracting cover images, kickers, titles, and ledes); renders quoted posts in filled or outlined styles matching the active material; restores native Twemoji Unicode characters; upgrades photos via a `name=orig` 4K fallback chain across 1–20 image grids (four to a row past the first four) and stack layouts.

#### ⚡ Retina Export & Privacy Guardrails
- **3× Retina Rasterization & Gesture-Safe Copy**: Single posts export at 3× resolution by default; ultra-tall threads adapt to 2× to prevent platform downscaling artifacts (with an optional global 3× override). Clicking **Copy** claims the system clipboard immediately inside the user gesture via a Promise-backed `ClipboardItem`, ensuring long thread renders never fail due to transient activation timeouts.
- **Per-Author Privacy & Readability Warning**: Independently toggle the source QR code, engagement stats, timestamp, video play badge, and credit line. Anonymize all authors globally with one switch, or **click any individual post's avatar on the card to blur just that author**. Alerts you proactively when an ultra-tall card would scale down too small in social feeds.

---

## 🛠️ Tech Stack

- **UI & View Layer**: [Preact 10](https://preactjs.com/) + TypeScript (mounted inside an open Shadow DOM on `<post-to-card-container>` with inline `:host { all: initial }` CSS for 100% style isolation)
- **Rasterization Engine**: [modern-screenshot](https://github.com/qq15725/modern-screenshot) (paired with a Background Service Worker Base64 image proxy to eliminate HTML5 Canvas CORS tainting)
- **Offline QR & Icons**: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (pure local SVG generation) + [lucide-preact](https://lucide.dev/)
- **Build & Quality Gates**: [Vite 6](https://vite.dev/) 4-entry build pipeline + [Knip](https://knip.dev/) dead-code analysis + Node.js 24 native TypeScript E2E & adversarial verification suite (Tiers 1–5 + real-browser CDP probes)

---

## 📦 Getting Started

### Install from the Chrome Web Store

<https://chromewebstore.google.com/detail/mfmldbbkajimckojjgceehiackjpakai>

Click **Add to Chrome**, then reload any open `x.com` tab. The store build is the same extension as the two options below.

### Download

Grab `postpress-1.1.0.zip` from [Releases](https://github.com/Shirolin/postpress/releases/latest), unzip it somewhere permanent, then skip to the two "Load unpacked" steps below.

### Build from Source

Prerequisites: **Node.js >= 24**, **pnpm >= 10**.

```bash
# 1. Clone the repository and install dependencies
git clone https://github.com/Shirolin/postpress.git
cd postpress
pnpm install

# 2. Build the production extension into dist/
pnpm run build
```

Load unpacked into Chrome / Chromium:
1. Open `chrome://extensions/` and enable **Developer mode** in the top-right corner.
2. Click **Load unpacked** and select the folder you unzipped (the build's `dist/` when building from source).

### Quick Workflow

| Step | Action |
| :--- | :--- |
| **1. Open Modal** | Click the **press icon** in any post's action bar, or hover over a post and press `Alt + C` (also triggerable from the browser toolbar popup). |
| **2. Customize** | Pick a material theme, padding, corner radius, card aspect ratio, and outer canvas backdrop in the right-hand panel; toggle footer QR and stats as needed. |
| **3. Curate Thread** | Click any post inside a thread to stitch its context automatically; click a post's top-right button to exclude it, or click an avatar to blur just that author. |
| **4. Copy & Share** | Click **Copy Image** (writes directly to your system clipboard, falling back to download if browser focus is lost) or **Save PNG**. |

---

## 🔒 Privacy & Security

PostPress enforces **"100% local, zero external services"** as a hard architectural constraint:

- **Zero External Remote Calls**: Apart from fetching post media from X's official image CDN (`*.twimg.com`, strictly validated via `isAllowedHost` to prevent SSRF) through the extension Background proxy, PostPress never makes requests to any third-party server.
- **Zero Telemetry & Tracking**: No analytics beacons, no crash reporters, and no remote dynamic configuration.
- **Zero Credential Access**: Requires no login or API keys. Reads only the already-rendered DOM and the page's own GraphQL response stream; post content lives strictly in memory and is released as soon as the modal closes.
- **Minimal Permissions**: Declares only `clipboardWrite` (to copy images to your clipboard), `storage` (to save layout preferences in `chrome.storage.local`), and `*.twimg.com` image proxy access—never requesting `tabs` or broad host permissions.

See [PRIVACY.md](PRIVACY.md) for the full privacy commitment and [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## ❓ FAQ

<details>
<summary><b>Why not just take a system screenshot?</b></summary>

Taking a screenshot means dragging a selection box by hand, dodging replies below, and scrolling through multiple captures to stitch a thread—while still inheriting your display's DPI and browser UI clutter. PostPress skips the manual crop: it re-layouts the entire post or thread inside an isolated Shadow DOM at 2× / 3× resolution and puts a clean image straight on your clipboard, ready to paste anywhere.
</details>

<details>
<summary><b>Will ultra-tall threads look blurry when posted to social feeds?</b></summary>

Single posts export at 3× and stay razor-sharp across social feeds. For very tall threads, social platforms scale images to a fixed width, which can shrink body text below comfortable reading size—when that happens, the panel proactively displays a **readability warning** and suggests splitting the thread. Tall threads default to 2× to keep pixel dimensions reasonable, with an optional **"Prefer highest resolution"** toggle in Export Settings to force 3× rendering.
</details>

<details>
<summary><b>What happens to exported cards if the original post is deleted?</b></summary>

Nothing—exported PNG images live entirely offline on your clipboard or local disk. The extension never persists post content in the background and frees memory as soon as you close the preview modal.
</details>

<details>
<summary><b>What are the copyright boundaries when quoting public posts?</b></summary>

Cards retain the original author's display name, handle, timestamp, and a source QR code by default. Public visibility does not waive copyright; please verify author permission before commercial use or large-scale redistribution.
</details>

---

## 🏗️ Architecture & Local Development

![Architecture: Four build entries, two JS worlds, one export](docs/images/architecture.png)

- **Dual-World Isolated Messaging**: `graphql-hook.js` injects at `document_start` into the page's `MAIN` world to intercept structured post responses; `content.js` runs in the extension's `ISOLATED` world, communicating strictly via sanitized `window.postMessage` payloads.
- **Dual-Channel Thread Resolution**: `resolveThread` prioritizes the structured GraphQL conversation tree (natively supporting full `note_tweet` bodies and parent-child thread links) and falls back gracefully to chronological DOM extraction corroborated by Snowflake IDs and visual connectors.
- **Clean 4-Entry Build**: Driven by Vite across four independent entries (ESM `background` + IIFE `content` / `popup` / `hook`), locking runtime dependencies to exactly 4 packages (`preact`, `modern-screenshot`, `qrcode-generator`, `lucide-preact`).

### Build & Verification Gates

The repository uses a tiered verification suite that **must be run in order** (Tier 5 audits the freshly built `dist/` bundle directly and rejects stale builds):

```bash
pnpm run build       # 1. Typecheck (tsc + node --check) + dead-code scan (knip) + 4-entry build
pnpm test            # 2. Tiers 1–4 unit/edge/interaction/workflow tests + i18n / GraphQL / Resolver / Article / Hygiene suites
pnpm run test:tier5  # 3. Tier 5 adversarial stress & bundle forensics (CORS taint guard, clipboard fallback, Shadow DOM isolation)
```

### Standalone Visual Debug Harness

Preview card layouts and all theme states in a local browser without installing the extension or visiting `x.com`:

```bash
pnpm exec vite --config dev/vite.harness.config.ts
```

Open `http://127.0.0.1:5199/preview.html` and switch states via URL parameters (e.g. `?theme=riso&ratio=3:4&bg=paper&canvas=4:5`). For real-browser verification scripts (extension loading, offline DOM fixture extraction, frame-rate and pixel motion probes), see [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📚 Documentation Map

| Document | Description |
| :--- | :--- |
| [PROJECT.md](PROJECT.md) | Architectural overview, Feature Inventory, and data channel design |
| [GLOSSARY.md](GLOSSARY.md) | Canonical domain terminology (Card, Canvas / Mat, Thread Session, etc.) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines, coding standards, architecture diagram rules, and PR workflow |
| [AGENTS.md](AGENTS.md) | Build gate chain, TypeScript check blind spots, and real-browser verification guides |
| [PRIVACY.md](PRIVACY.md) / [SECURITY.md](SECURITY.md) | Privacy commitments, permission justifications, and vulnerability disclosure policy |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [docs/i18n.md](docs/i18n.md) | 14-locale dictionary architecture, auto-resolution rules, and `_locales` conventions |
| [docs/loading-states.md](docs/loading-states.md) | First-frame `fit` measurement, image placeholders, motion trade-offs, and pixel probes |
| [docs/detection-audit.md](docs/detection-audit.md) | X platform DOM selector reliability tiers and extraction audit |
| [docs/real-dom-sampling-checklist.md](docs/real-dom-sampling-checklist.md) | Logged-out offline DOM sampling and extractor verification guide |
| [docs/architecture-review-2026-10-21.md](docs/architecture-review-2026-10-21.md) | Historical architectural decisions and verified dead-ends |
| [docs/store-listing.md](docs/store-listing.md) | Chrome Web Store listing copy (name, short/detailed descriptions) and `_locales` sync rules |
| [docs/store-checklist.md](docs/store-checklist.md) | Store submission checklist: packaging, store images, dashboard fields, and privacy disclosures |

---

## 🤝 Support & Sponsorship

If PostPress speeds up your workflow, consider supporting its ongoing maintenance:

- **Afdian (爱发电)**: <https://ifdian.net/a/shirolin>
- **Ko-fi**: <https://ko-fi.com/shirolin>
- **GitHub Star**: Star [Shirolin/postpress](https://github.com/Shirolin/postpress) in the top-right corner to help others discover the project.

Issues and Pull Requests are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

---

## 📄 License

Released under the **GNU General Public License v3.0 or later** (`GPL-3.0-or-later`). See [LICENSE](LICENSE) for full terms.

You are free to use, modify, and redistribute this software (including commercially), provided that **any distributed modifications or derivative works are licensed under the same GPLv3+ terms with complete source code**. The source attribution link in the bottom-right corner of the card serves as the compliance notice under GPL §6.

Third-party artworks embedded inside sample card images remain under their respective Creative Commons licenses; see [CREDITS.md](CREDITS.md) for attributions.

```text
Copyright (C) 2026 Shirolin

Post-to-Card is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later version.
```

<sub>X (Twitter) is a registered trademark of X Corp. This project is an independent open-source tool and is not affiliated with or endorsed by X Corp.</sub>
