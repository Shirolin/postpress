/**
 * End-to-end screenshot comparison for the export formats.
 *
 * The unit tiers run the export engine against a rasterizer stand-in; they can
 * prove the wiring, not that a real canvas writes a real JPEG or WebP. This
 * drives the shipped bundle in a real Chrome, exports the same card as PNG,
 * JPEG and WebP, and compares the files it produced:
 *
 *   - every file is the format its extension claims (container signature),
 *   - the format setting does not move the layout (identical pixel dimensions),
 *   - the lossy files are smaller than the PNG, and how much detail they lose,
 *   - the panel screenshot for each state.
 *
 * Artifacts and a self-contained `report.html` land in
 * `.tmp/e2e-export-formats-<timestamp>/`.
 *
 *   node dev/verify-export-formats.mjs
 *   PTC_HEADED=0 node dev/verify-export-formats.mjs   # force headless
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const REPO = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST = join(REPO, 'dist');

/** Pulls the fixture's markup out of its TypeScript module. */
function fixtureHtml(file, name) {
  const src = readFileSync(join(REPO, file), 'utf8');
  const match = src.match(new RegExp(`export const ${name} = \`([\\s\\S]*?)\`;`));
  if (!match) throw new Error(`no ${name} in ${file}`);
  return match[1];
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const OUT = join(REPO, '.tmp', `e2e-export-formats-${stamp()}`);
const EXPORTS = join(OUT, 'downloads');
mkdirSync(EXPORTS, { recursive: true });

const failures = [];
const checks = [];
function check(label, ok, detail = '') {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  checks.push({ label, ok, detail });
  if (!ok) failures.push(label);
  return ok;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createNetServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      } else {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', () => rej(new Error('could not open the CDP socket')), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`timed out: ${method}`));
      }, 60000);
    });
  }

  on(fn) { this.listeners.push(fn); }

  async attach(targetId) {
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    await this.send('Runtime.enable', {}, sessionId);
    await this.send('Log.enable', {}, sessionId);
    return sessionId;
  }

  async eval(sessionId, expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }

  close() { try { this.ws.close(); } catch { /* already gone */ } }
}

async function waitForBrowser(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch { /* not listening yet */ }
    await sleep(500);
  }
  throw new Error(`nothing came up on 127.0.0.1:${port}`);
}

function base64(file) {
  return readFileSync(file).toString('base64');
}

/**
 * The fixture's remote pictures replaced with one generated data URL.
 *
 * The proxy that normally turns twimg URLs into origin-clean data URLs is an
 * extension API, and this page is not the extension. Without the swap the
 * export would either taint the canvas or draw grey placeholders, neither of
 * which is a format question. A data URL exercises the same `data:` early
 * return in `resolveImageForExport`, so the comparison is about the encoder.
 */
function imageStubSource(sitePort) {
  return `(() => {
    const generated = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 450;
      const g = canvas.getContext('2d');
      const gradient = g.createLinearGradient(0, 0, 800, 450);
      gradient.addColorStop(0, '#ff7a59');
      gradient.addColorStop(0.5, '#7b5cff');
      gradient.addColorStop(1, '#1fd3b0');
      g.fillStyle = gradient;
      g.fillRect(0, 0, 800, 450);
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath(); g.arc(620, 130, 72, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(48, 300, 430, 16);
      g.fillRect(48, 334, 300, 16);
      return canvas.toDataURL('image/png');
    };
    const load = () => {
      const src = generated();
      for (const img of document.querySelectorAll('img')) {
        img.removeAttribute('srcset');
        img.src = src;
      }
      for (const video of document.querySelectorAll('video[poster]')) {
        video.setAttribute('poster', src);
      }
      const script = document.createElement('script');
      script.src = 'http://127.0.0.1:${sitePort}/content.js';
      (document.head || document.documentElement || document.body).appendChild(script);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', load, { once: true });
    } else {
      load();
    }
  })();`;
}

const FORMAT_TO_EXT = { PNG: '.png', JPEG: '.jpg', WebP: '.webp' };
const FORMAT_TO_MIME = { PNG: 'image/png', JPEG: 'image/jpeg', WebP: 'image/webp' };

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error(`No Chrome found. Looked in:\n  ${CHROME_CANDIDATES.join('\n')}\nSet CHROME_PATH.`);
  process.exit(1);
}
if (!existsSync(join(DIST, 'manifest.json'))) {
  console.error(`${DIST}/manifest.json is missing. Run \`npm run build\` first.`);
  process.exit(1);
}

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>x.com</title></head>
<body><div id="react-root"><main><div id="timeline">
${fixtureHtml('tests/fixtures/single-tweet.ts', 'SINGLE_TWEET_HTML')}
</div></main></div></body></html>`;

const sitePort = await freePort();
const server = createServer((req, res) => {
  if (req.url === '/content.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end(readFileSync(join(DIST, 'content.js')));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page);
});
await new Promise((resolve) => server.listen(sitePort, '127.0.0.1', resolve));

const debugPort = await freePort();
const profile = mkdtempSync(join(tmpdir(), 'ptc-formats-'));
// Chrome also writes unrelated browser downloads (component updates arrive as
// `.crx`) into the directory it is given. Keeping that directory inside the
// throwaway profile leaves the artifact folder holding only this run's files.
const DOWNLOADS = join(profile, 'downloads');
mkdirSync(DOWNLOADS, { recursive: true });
const headedByFlag = process.env.PTC_HEADED;
const headed =
  headedByFlag === undefined
    ? process.platform === 'win32' || process.platform === 'darwin' || !!process.env.DISPLAY
    : headedByFlag === '1';

console.log(`artifacts ${OUT}`);
console.log(`chrome    ${chrome}`);
console.log(`bundle    ${join(DIST, 'content.js')}`);
console.log(`server    http://127.0.0.1:${sitePort}/`);
console.log(`browser   ${headed ? 'headed' : 'headless'}\n`);

const proc = spawn(chrome, [
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  ...(headed ? [] : ['--headless=new']),
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-default-browser-check',
  '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

const artifacts = { panels: {}, exports: {}, diffs: {} };
let cdp;
try {
  cdp = await Cdp.connect(await waitForBrowser(debugPort));
  const version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
  const browserVersion = version['Browser'] || 'unknown';
  await cdp.send('Target.setDiscoverTargets', { discover: true });
  try {
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOADS,
      eventsEnabled: true,
    });
  } catch {
    // Older Chromium only knows the page-scoped command; it has to be sent
    // after the tab below exists, so it is deferred to the first use.
  }

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const tab = await cdp.attach(targetId);
  try {
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS }, tab);
  } catch { /* the browser-level command already worked */ }
  const entries = [];
  cdp.on((msg) => {
    if (msg.sessionId !== tab) return;
    if (msg.method === 'Runtime.consoleAPICalled') {
      entries.push({
        kind: msg.params.type,
        text: (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 240),
      });
    } else if (msg.method === 'Runtime.exceptionThrown') {
      entries.push({ kind: 'EXCEPTION', text: String(msg.params.exceptionDetails.exception?.description || '').slice(0, 400) });
    }
  });

  await cdp.send('Page.enable', {}, tab);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false,
  }, tab);
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: imageStubSource(sitePort),
  }, tab);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${sitePort}/` }, tab);
  await sleep(5000);

  const probe = JSON.parse(await cdp.eval(tab, `JSON.stringify((() => {
    const articles = Array.from(document.querySelectorAll('article'));
    return {
      articles: articles.length,
      triggers: document.querySelectorAll('[data-post-to-card-btn="true"]').length,
    };
  })())`));
  check('the content script found the post', probe.articles > 0, `${probe.articles} article(s)`);
  check('the trigger reached the action bar', probe.triggers > 0, `${probe.triggers} trigger(s)`);

  const opened = JSON.parse(await cdp.eval(tab, `JSON.stringify((() => {
    const btn = document.querySelector('[data-post-to-card-btn="true"]');
    if (!btn) return { ok: false };
    btn.click();
    return { ok: true };
  })())`));
  check('the trigger opened the card', opened.ok === true);
  await sleep(2500);

  const card = JSON.parse(await cdp.eval(tab, `JSON.stringify((() => {
    const host = document.querySelector('post-to-card-container');
    const root = host && host.shadowRoot;
    const card = root && root.querySelector('#post-to-card-export-target');
    if (!card) return { ok: false, why: 'no card' };
    return {
      ok: true,
      width: card.offsetWidth,
      height: card.offsetHeight,
      text: (card.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
    };
  })())`));
  check('the card rendered', card.ok === true, card.why || `${card.width}x${card.height}`);

  /**
   * Opens the settings disclosure and selects one format.
   *
   * Detection is by the three radio labels, not by the group's localized
   * `aria-label`: this is the one control whose values are format names, so it
   * can be found without knowing the page's language.
   */
  const selectFormat = async (label) => {
    // Open the disclosure first and let it render: a `hidden` body has no
    // layout, so `scrollIntoView` against it is a no-op and the screenshot
    // would keep showing the top of the panel.
    await cdp.eval(tab, `(() => {
      const root = document.querySelector('post-to-card-container').shadowRoot;
      const more = root && root.querySelector('.more-section .more-toggle');
      if (more && more.getAttribute('aria-expanded') !== 'true') more.click();
      return true;
    })()`);
    await sleep(350);

    const result = JSON.parse(await cdp.eval(tab, `JSON.stringify((() => {
      const host = document.querySelector('post-to-card-container');
      const root = host && host.shadowRoot;
      if (!root) return { ok: false, why: 'no shadow root' };
      const groups = Array.from(root.querySelectorAll('[role="radiogroup"]'));
      const group = groups.find((g) =>
        Array.from(g.querySelectorAll('[role="radio"]')).map((r) => r.textContent.trim()).join(',') === 'PNG,JPEG,WebP'
      );
      if (!group) return { ok: false, why: 'no format picker' };
      const radio = Array.from(group.querySelectorAll('[role="radio"]'))
        .find((r) => r.textContent.trim() === ${JSON.stringify(label)});
      if (!radio) return { ok: false, why: 'no ${label} radio' };
      // The screenshot has to show the control this report is about, and the
      // export settings sit below the first screen of the panel.
      const section = group.closest('.control-section');
      if (section && section.scrollIntoView) section.scrollIntoView({ block: 'center' });
      radio.click();
      return { ok: true };
    })())`));
    if (!result.ok) throw new Error(`could not select ${label}: ${result.why}`);
    await sleep(500);

    // Read after the state update has rendered. The quality picker is
    // conditional, so asking in the same tick as the click would always see
    // the previous format's controls.
    const quality = JSON.parse(await cdp.eval(tab, `JSON.stringify((() => {
      const root = document.querySelector('post-to-card-container').shadowRoot;
      const groups = Array.from(root.querySelectorAll('[role="radiogroup"]'));
      const group = groups.find((g) =>
        Array.from(g.querySelectorAll('[role="radio"]')).map((r) => r.textContent.trim()).join(',') === 'PNG,JPEG,WebP'
      );
      const section = group && group.closest('.control-section');
      const quality = section
        ? Array.from(section.querySelectorAll('[role="radiogroup"]')).find((g) => g !== group)
        : null;
      return { shown: Boolean(quality) };
    })())`));
    return { ...result, quality: quality.shown };
  };

  const clickDownload = async () => {
    const result = JSON.parse(await cdp.eval(tab, `JSON.stringify((() => {
      const host = document.querySelector('post-to-card-container');
      const root = host && host.shadowRoot;
      const button = root && root.querySelector('.export-actions .btn-secondary');
      if (!button) return { ok: false, why: 'no download button' };
      button.click();
      return { ok: true };
    })())`));
    if (!result.ok) throw new Error(`could not press download: ${result.why}`);
  };

  async function waitForDownload(extension, before, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    let last = '';
    let lastSize = -1;
    let stableAt = 0;
    while (Date.now() < deadline) {
      const files = readdirSync(DOWNLOADS).filter(
        (name) =>
          !before.has(name) &&
          name.startsWith('post-to-card_') &&
          name.toLowerCase().endsWith(extension) &&
          !name.endsWith('.crdownload')
      );
      if (files.length) {
        const name = files[0];
        const full = join(DOWNLOADS, name);
        const size = statSync(full).size;
        if (size === lastSize && name === last) {
          if (Date.now() - stableAt > 400) return full;
        } else {
          last = name;
          lastSize = size;
          stableAt = Date.now();
        }
      }
      await sleep(200);
    }
    throw new Error(`no ${extension} download appeared in ${timeoutMs}ms`);
  }

  const screenshot = async (name) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, tab);
    const file = join(OUT, name);
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  };

  const startedAt = Date.now();
  for (const label of ['PNG', 'JPEG', 'WebP']) {
    const extension = FORMAT_TO_EXT[label];
    const state = await selectFormat(label);
    check(
      `${label}: quality control is ${label === 'PNG' ? 'hidden' : 'shown'}`,
      state.quality === (label !== 'PNG'),
      state.quality ? 'shown' : 'hidden'
    );

    // The panel is captured before the export: the format picker and, for the
    // lossy formats, the quality level are what this report is about.
    artifacts.panels[label] = await screenshot(`panel-${label.toLowerCase()}.png`);

    const before = new Set(readdirSync(DOWNLOADS));
    await clickDownload();
    const downloaded = await waitForDownload(extension, before);
    await sleep(600);
    // Copied out of the throwaway profile so the report folder holds only the
    // three files this run produced.
    const file = join(EXPORTS, downloaded.split(/[\\/]/).pop());
    copyFileSync(downloaded, file);
    artifacts.exports[label] = file;
    check(`${label}: the download is named ${extension}`, file.toLowerCase().endsWith(extension), file.split(/[\\/]/).pop());
  }
  const exportMs = Date.now() - startedAt;

  // ---- Image analysis in a second, unencumbered page -----------------------
  //
  // Node has no image decoder and no dependency is being added for a report.
  // A blank tab has a canvas: decode each file there and compare it with the
  // PNG baseline byte-for-byte in RGBA.
  const { targetId: analysisTarget } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const analysis = await cdp.attach(analysisTarget);

  const inputs = [
    { name: 'PNG', mime: FORMAT_TO_MIME.PNG, b64: base64(artifacts.exports.PNG) },
    { name: 'JPEG', mime: FORMAT_TO_MIME.JPEG, b64: base64(artifacts.exports.JPEG) },
    { name: 'WebP', mime: FORMAT_TO_MIME.WebP, b64: base64(artifacts.exports.WebP) },
  ];
  const analysisResult = await cdp.eval(analysis, `(async () => {
    const inputs = ${JSON.stringify(inputs)};
    const decode = async (input) => {
      const blob = await (await fetch('data:' + input.mime + ';base64,' + input.b64)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0);
      return {
        width: bitmap.width,
        height: bitmap.height,
        data: context.getImageData(0, 0, bitmap.width, bitmap.height).data,
      };
    };
    const toBase64 = (canvas) => new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.readAsDataURL(blob);
      }, 'image/png');
    });

    const baseline = await decode(inputs[0]);
    const formatResults = [];
    for (const input of inputs.slice(1)) {
      const current = await decode(input);
      const sameDimensions = current.width === baseline.width && current.height === baseline.height;
      const pixels = Math.min(baseline.data.length, current.data.length) / 4;
      let channelSum = 0;
      let channelSamples = 0;
      let maxDiff = 0;
      let changed = 0;
      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = current.width;
      diffCanvas.height = current.height;
      const diffContext = diffCanvas.getContext('2d');
      const diffImage = diffContext.createImageData(current.width, current.height);
      for (let i = 0; i < baseline.data.length && i < current.data.length; i += 4) {
        const dr = Math.abs(baseline.data[i] - current.data[i]);
        const dg = Math.abs(baseline.data[i + 1] - current.data[i + 1]);
        const db = Math.abs(baseline.data[i + 2] - current.data[i + 2]);
        const d = Math.max(dr, dg, db);
        channelSum += dr + dg + db;
        channelSamples += 3;
        if (d > maxDiff) maxDiff = d;
        if (d > 16) changed++;
        const shown = Math.min(255, d * 4);
        diffImage.data[i] = shown;
        diffImage.data[i + 1] = shown;
        diffImage.data[i + 2] = shown;
        diffImage.data[i + 3] = 255;
      }
      diffContext.putImageData(diffImage, 0, 0);
      formatResults.push({
        name: input.name,
        width: current.width,
        height: current.height,
        sameDimensions,
        meanAbsDiff: channelSum / Math.max(1, channelSamples),
        maxDiff,
        changedFraction: changed / Math.max(1, pixels),
        diffBase64: await toBase64(diffCanvas),
      });
    }
    return {
      baseline: { width: baseline.width, height: baseline.height },
      formats: formatResults,
    };
  })()`);

  for (const result of analysisResult.formats) {
    const file = join(OUT, `diff-${result.name.toLowerCase()}.png`);
    writeFileSync(file, Buffer.from(result.diffBase64, 'base64'));
    artifacts.diffs[result.name] = file;
    check(`${result.name}: dimensions match the PNG`, result.sameDimensions,
      `${result.width}x${result.height} vs ${analysisResult.baseline.width}x${analysisResult.baseline.height}`);
    check(`${result.name}: average channel difference is small`, result.meanAbsDiff < 12,
      result.meanAbsDiff.toFixed(2) + ' / 255');
  }

  const sizes = Object.fromEntries(
    Object.entries(artifacts.exports).map(([label, file]) => [label, statSync(file).size])
  );
  for (const label of ['JPEG', 'WebP']) {
    check(
      `${label}: smaller than the PNG`,
      sizes[label] < sizes.PNG,
      `${sizes.PNG} -> ${sizes[label]} bytes`
    );
  }

  const signatures = {
    PNG: [0x89, 0x50, 0x4e, 0x47],
    JPEG: [0xff, 0xd8, 0xff],
    WebP: [0x52, 0x49, 0x46, 0x46],
  };
  for (const [label, signature] of Object.entries(signatures)) {
    const bytes = readFileSync(artifacts.exports[label]);
    const ok = signature.every((byte, index) => bytes[index] === byte);
    check(`${label}: file begins with its format's signature`, ok);
  }

  check('the bundle threw nothing on the page', !entries.some((e) => e.kind === 'EXCEPTION'));

  // ---- Report --------------------------------------------------------------
  const rows = analysisResult.formats.map((result) => ({
    label: result.name,
    file: artifacts.exports[result.name],
    bytes: sizes[result.name],
    width: result.width,
    height: result.height,
    meanAbsDiff: result.meanAbsDiff,
    maxDiff: result.maxDiff,
    changedFraction: result.changedFraction,
  }));

  const metrics = {
    generatedAt: new Date().toISOString(),
    browser: browserVersion,
    card: { width: card.width, height: card.height },
    baseline: analysisResult.baseline,
    exportMs,
    sizes,
    formats: rows.map((row) => ({ ...row, diff: artifacts.diffs[row.label] })),
    checks,
    console: entries,
    artifacts,
  };
  writeFileSync(join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));

  // A data URL's MIME has to match its bytes; JPEG shown as image/png does not
  // decode in every engine.
  const embed = (file, mime = 'image/png') => `data:${mime};base64,${base64(file)}`;
  const fmtPct = (value) => `${(value * 100).toFixed(1)}%`;
  const rowHtml = rows.map((row) => `
      <tr>
        <th>${row.label}</th>
        <td>${row.width}×${row.height}</td>
        <td>${(row.bytes / 1024).toFixed(1)} KiB</td>
        <td>${(((row.bytes - sizes.PNG) / sizes.PNG) * 100).toFixed(1)}%</td>
        <td>${row.meanAbsDiff.toFixed(2)}</td>
        <td>${row.maxDiff}</td>
        <td>${fmtPct(row.changedFraction)}</td>
      </tr>`).join('');

  const reportHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>导出格式 E2E 截图对比</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; font: 15px/1.6 system-ui, "Segoe UI", sans-serif; background: #0f1115; color: #e7e9ee; }
  main { max-width: 1180px; margin: 0 auto; padding: 40px 28px 80px; }
  h1 { font-size: 30px; margin: 0 0 6px; }
  h2 { margin-top: 42px; font-size: 20px; border-bottom: 1px solid #262a33; padding-bottom: 8px; }
  .meta { color: #98a0ad; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; font-variant-numeric: tabular-nums; }
  th, td { text-align: right; padding: 9px 10px; border-bottom: 1px solid #232832; }
  th:first-child, td:first-child { text-align: left; }
  thead th { color: #98a0ad; font-weight: 600; border-bottom: 1px solid #3a4150; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 14px; }
  figure { margin: 0; }
  figure img { width: 100%; border-radius: 10px; border: 1px solid #262a33; display: block; background: #141821; }
  figcaption { margin-top: 8px; color: #98a0ad; font-size: 13px; }
  .diff img { image-rendering: pixelated; }
  .checks { list-style: none; padding: 0; margin: 14px 0 0; }
  .checks li { padding: 6px 0; border-bottom: 1px solid #1c2029; }
  .ok { color: #53d18a; }
  .fail { color: #ff6b6b; }
  code { background: #1a1f28; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  .note { color: #98a0ad; font-size: 13px; }
</style></head>
<body><main>
  <h1>导出格式 E2E 截图对比</h1>
  <p class="meta">${metrics.generatedAt} · ${browserVersion} · 卡片 ${card.width}×${card.height} · 导出耗时 ${exportMs} ms</p>

  <h2>面板状态</h2>
  <div class="grid">
    ${['PNG', 'JPEG', 'WebP'].map((label) => `
    <figure><img src="${embed(artifacts.panels[label])}" alt="${label} 面板">
      <figcaption>${label}${label === 'PNG' ? '（质量档隐藏）' : '（显示质量档）'}</figcaption>
    </figure>`).join('')}
  </div>

  <h2>导出文件</h2>
  <div class="grid">
    ${['PNG', 'JPEG', 'WebP'].map((label) => `
    <figure><img src="${embed(artifacts.exports[label], FORMAT_TO_MIME[label])}" alt="${label} 导出">
      <figcaption>${label} · ${(sizes[label] / 1024).toFixed(1)} KiB</figcaption>
    </figure>`).join('')}
  </div>

  <h2>量化对比</h2>
  <table>
    <thead><tr><th>格式</th><th>像素尺寸</th><th>文件大小</th><th>相对 PNG</th><th>平均通道差</th><th>最大通道差</th><th>可见差异像素</th></tr></thead>
    <tbody>${rowHtml}</tbody>
  </table>
  <p class="note">平均通道差与可见差异像素以 PNG 为基准，在 RGBA 上逐像素比较；可见差异指任一通道差 &gt; 16（0–255）。</p>

  <h2>差异放大 4×</h2>
  <div class="grid diff">
    ${['JPEG', 'WebP'].map((label) => `
    <figure><img src="${embed(artifacts.diffs[label])}" alt="${label} 差异图">
      <figcaption>${label} 与 PNG 的像素差（×4 放大）</figcaption>
    </figure>`).join('')}
  </div>

  <h2>检查项</h2>
  <ul class="checks">
    ${checks.map((item) => `<li class="${item.ok ? 'ok' : 'fail'}">${item.ok ? '✓' : '✗'} ${item.label}${item.detail ? ` · <span class="note">${item.detail}</span>` : ''}</li>`).join('\n    ')}
  </ul>
</main></body></html>`;
  writeFileSync(join(OUT, 'report.html'), reportHtml);

  const reportMd = [
    '# 导出格式 E2E 截图对比',
    '',
    `- 生成时间：${metrics.generatedAt}`,
    `- 浏览器：${browserVersion}`,
    `- 卡片：${card.width}×${card.height}px`,
    `- 导出总耗时：${exportMs}ms`,
    '',
    '| 格式 | 文件 | 像素尺寸 | 文件大小 | 相对 PNG | 平均通道差 | 最大通道差 | 可见差异像素 |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.label} | ${row.file.split(/[\\/]/).pop()} | ${row.width}×${row.height} | ${(row.bytes / 1024).toFixed(1)} KiB | ${(((row.bytes - sizes.PNG) / sizes.PNG) * 100).toFixed(1)}% | ${row.meanAbsDiff.toFixed(2)} | ${row.maxDiff} | ${fmtPct(row.changedFraction)} |`),
    '',
    '## 产物',
    '',
    '- `report.html`（自包含，含截图与差异图）',
    '- `metrics.json`',
    `- 面板截图：${['PNG', 'JPEG', 'WebP'].map((l) => '`' + artifacts.panels[l].split(/[\\/]/).pop() + '`').join('、')}`,
    `- 导出文件：${['PNG', 'JPEG', 'WebP'].map((l) => '`' + artifacts.exports[l].split(/[\\/]/).pop() + '`').join('、')}`,
    `- 差异图：${['JPEG', 'WebP'].map((l) => '`' + artifacts.diffs[l].split(/[\\/]/).pop() + '`').join('、')}`,
    '',
    `## 检查：${failures.length ? `❌ ${failures.length} 项失败` : '✅ 全部通过'}`,
    '',
    ...checks.map((item) => `- ${item.ok ? '✓' : '✗'} ${item.label}${item.detail ? ` — ${item.detail}` : ''}`),
    '',
  ].join('\n');
  writeFileSync(join(OUT, 'report.md'), reportMd);

  console.log(`\nreport    ${join(OUT, 'report.html')}`);
  console.log(`metrics   ${join(OUT, 'metrics.json')}`);
  console.log(`\n| 格式 | 像素尺寸 | 文件大小 | 相对 PNG | 平均通道差 | 可见差异像素 |`);
  console.log(`|---|---|---|---|---|---|`);
  for (const row of rows) {
    console.log(`| ${row.label} | ${row.width}×${row.height} | ${(row.bytes / 1024).toFixed(1)} KiB | ${(((row.bytes - sizes.PNG) / sizes.PNG) * 100).toFixed(1)}% | ${row.meanAbsDiff.toFixed(2)} | ${fmtPct(row.changedFraction)} |`);
  }
} finally {
  cdp?.close();
  proc.kill();
  server.close();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}

console.log(failures.length ? `\n${failures.length} check(s) failed: ${failures.join(', ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
