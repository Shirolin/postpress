/**
 * PostPress 产品页：14 语言跳转、材质样张、展示标签、浅深切换与入场动效。
 *
 * 页面由 `dev/build-site-i18n.mjs` 生成为 14 份静态 HTML（`/` 为英文，其余 13 门语言
 * 位于 `/<slug>/`）；当前页的动态交互文案内联在 `<script id="pp-i18n">` 中，JS 不跑时
 * 静态版本仍然完整可读。
 */

const MATERIAL_PALETTE = {
  minimal: { surface: '#faf9f5', ink: '#121211', accent: '#2563eb' }, // taste-skill-ignore 产品自身的纸色，不是页面配色
  midnight: { surface: '#181b22', ink: '#f0f2f5', accent: '#7aa2ff' },
  glass: { surface: '#ebf1f8', ink: '#0f172a', accent: '#0369a1' },
  material: { surface: '#f4f6f0', ink: '#191d17', accent: '#3e6837' },
  gallery: { surface: '#f7f7f4', ink: '#101011', accent: '#1b3bd6' },
  darkroom: { surface: '#1b1b1e', ink: '#ededf0', accent: '#ffb02e' },
  riso: { surface: '#f2f3ee', ink: '#17238a', accent: '#ff3d8b' },
  sumi: { surface: '#e4e9e3', ink: '#161f1a', accent: '#b4281d' },
  clay: { surface: '#d8e6f4', ink: '#0d2540', accent: '#ff6a2b' },
  terminal: { surface: '#161d16', ink: '#d8f5d0', accent: '#5ee08a' },
  receipt: { surface: '#f5f5f1', ink: '#1c1c1b', accent: '#1c1c1b' },
  brutalist: { surface: '#ffe64a', ink: '#111110', accent: '#5a14d8' },
};

const root = document.documentElement;
root.classList.add('js');

const BASE = root.dataset.base || '.';
const pageLang = root.dataset.pageLang || 'en';

let i18n = {};
try {
  const raw = document.getElementById('pp-i18n')?.textContent;
  if (raw) i18n = JSON.parse(raw);
} catch {
  i18n = {};
}

/* -------------------------------------------------------------- 语言切换 */

const langSelect = document.getElementById('lang');
if (langSelect) {
  langSelect.value = pageLang;
  langSelect.addEventListener('change', () => {
    const selected = langSelect.options[langSelect.selectedIndex];
    const targetSlug = langSelect.value;
    try {
      localStorage.setItem('pp-lang', targetSlug);
    } catch {
      /* 隐私模式下存不下也不影响跳转 */
    }
    const href = selected?.dataset.href || (targetSlug === 'en' ? `${BASE}/` : `${BASE}/${targetSlug}/`);
    location.href = `${href}${location.search}${location.hash}`;
  });
}

/* ---------------------------------------------------------------- 主题 */

const themeButton = document.getElementById('theme');

function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function renderThemeLabel() {
  if (!themeButton) return;
  const target = currentTheme() === 'light' ? 'dark' : 'light';
  const labels = i18n.themeLabel || { light: 'Light', dark: 'Dark' };
  const arias = i18n.themeAria || {
    light: 'Switch to the light version',
    dark: 'Switch to the dark version',
  };
  themeButton.textContent = labels[target];
  themeButton.setAttribute('aria-label', arias[target]);
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

if (themeButton) {
  themeButton.addEventListener('click', () => {
    setTheme(currentTheme() === 'light' ? 'dark' : 'light');
  });
}

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
  if (specimenImg) specimenImg.src = `${BASE}/assets/cards/${id}.webp`;
  for (const img of followingCards) {
    if (img === articleImg && showcaseMode !== 'article') continue;
    img.src = `${BASE}/assets/cards/${img.dataset.card}-${id}.webp`;
  }
  renderCaption();
}

function updateArticleAlt() {
  if (!articleImg || !i18n.articleAlts) return;
  const nextAlt = i18n.articleAlts[showcaseMode];
  if (nextAlt) articleImg.alt = nextAlt;
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
  const palette = MATERIAL_PALETTE[material];
  const copy = i18n.materials?.[material];
  if (!palette) return;
  if (copy) {
    if (capName) capName.textContent = copy.name;
    if (capNote) capNote.textContent = copy.note;
    if (specimenImg && i18n.specCardAltTemplate) {
      specimenImg.alt = i18n.specCardAltTemplate.replace('{name}', copy.name);
    }
  }
  if (capTokens) {
    capTokens.innerHTML = [palette.surface, palette.ink, palette.accent]
      .map((c) => `<i style="background:${c}"></i>`)
      .join('');
  }

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

renderThemeLabel();
showMaterial(material);
