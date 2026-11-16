# Privacy Policy

> English | [简体中文](PRIVACY.zh-CN.md)

Last updated: 2026-10-29

PostPress (the "Extension") is a Chrome extension that **runs 100% locally on your device**.
This page explains what data it touches and where that data goes.

## In one sentence

**No data is collected, uploaded, or sold.** There are no accounts, no analytics, no telemetry, and no backend servers.

## What the Extension processes

| Data | Source | Purpose | Destination |
|---|---|---|---|
| The post you are viewing (text, author, media URLs, timestamp, counts) | The **already-rendered** DOM on the current page and GraphQL responses fetched by the host page | Typesetting the card | Memory only; discarded when the modal closes |
| Post media (`*.twimg.com`) | Fetched by the background service worker from X's image servers | Allows HTML5 Canvas to draw cross-origin images | Memory only; the extension's in-memory cache clears when the service worker sleeps |
| Your preferences (theme, switches, per-author blur overrides, etc.) | Your selections in the Studio panel | Restores your settings next time you open the modal | `chrome.storage.local`, strictly inside your own browser |
| Exported PNGs | Rendered locally on your machine | Copied to your clipboard or saved to your Downloads folder | Wherever you paste or save it; the extension keeps no copy |

## What the Extension never does

- Never makes requests outside `*.twimg.com`. Hostnames are validated before fetching; any other URL is rejected.
- Never sends post content, page content, clipboard content, or preferences anywhere.
- Never reads your X credentials, never calls the X API, and requires no login.
- Never injects remote scripts or uses remote configuration flags.
- Never includes third-party analytics, ads, or crash-reporting SDKs.
- Never reads other browser tabs or existing clipboard contents.

## Permissions

| Permission | Why it is required |
|---|---|
| `clipboardWrite` | Writes the rendered PNG image to your clipboard |
| `storage` | Remembers your material, canvas, and switch preferences locally |
| `host_permissions: *.twimg.com` | Fetches post media so HTML5 Canvas can render cross-origin images without tainting (`*` covers `pbs.twimg.com` and subdomains) |

## Exported images and third-party content

Cards preserve the original author's avatar, display name, handle, and post link, along with a small attribution line. Where you share the exported image or whether you use it commercially is up to you; the Extension is not involved and cannot track it.

## Changes

This policy is versioned alongside the source code. Any changes are visible in the repository's commit history.

## Contact

Please open an issue at <https://github.com/Shirolin/postpress/issues>.
Security-related reports should be submitted privately via [SECURITY.md](SECURITY.md).
