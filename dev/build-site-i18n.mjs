/**
 * Generates all 14 static localized HTML entrypoints under `site/` and updates
 * `site/en/index.html` and `site/sitemap.xml` from `site/template.html` and
 * `site/locales/<slug>.json`.
 *
 * Usage:
 *   node dev/build-site-i18n.mjs          # write generated files
 *   node dev/build-site-i18n.mjs --check  # verify generated files are in sync
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const SITE = join(REPO, 'site');
const LOCALES_DIR = join(SITE, 'locales');
const BASE_URL = 'https://shirolin.github.io/postpress';
const EXTENSION_VERSION = JSON.parse(readFileSync(join(REPO, 'manifest.json'), 'utf8')).version;

export const SITE_LOCALES = [
  { slug: 'en', htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', endonym: 'English', ogImage: 'og-en.jpg', isDefault: true },
  { slug: 'zh', htmlLang: 'zh-CN', hreflang: 'zh-CN', ogLocale: 'zh_CN', endonym: '简体中文', ogImage: 'og.jpg' },
  { slug: 'zh-tw', htmlLang: 'zh-TW', hreflang: 'zh-TW', ogLocale: 'zh_TW', endonym: '繁體中文', ogImage: 'og.jpg' },
  { slug: 'ja', htmlLang: 'ja', hreflang: 'ja', ogLocale: 'ja_JP', endonym: '日本語', ogImage: 'og-en.jpg' },
  { slug: 'ko', htmlLang: 'ko', hreflang: 'ko', ogLocale: 'ko_KR', endonym: '한국어', ogImage: 'og-en.jpg' },
  { slug: 'de', htmlLang: 'de', hreflang: 'de', ogLocale: 'de_DE', endonym: 'Deutsch', ogImage: 'og-en.jpg' },
  { slug: 'fr', htmlLang: 'fr', hreflang: 'fr', ogLocale: 'fr_FR', endonym: 'Français', ogImage: 'og-en.jpg' },
  { slug: 'es', htmlLang: 'es', hreflang: 'es', ogLocale: 'es_ES', endonym: 'Español', ogImage: 'og-en.jpg' },
  { slug: 'it', htmlLang: 'it', hreflang: 'it', ogLocale: 'it_IT', endonym: 'Italiano', ogImage: 'og-en.jpg' },
  { slug: 'pt-br', htmlLang: 'pt-BR', hreflang: 'pt-BR', ogLocale: 'pt_BR', endonym: 'Português', ogImage: 'og-en.jpg' },
  { slug: 'ru', htmlLang: 'ru', hreflang: 'ru', ogLocale: 'ru_RU', endonym: 'Русский', ogImage: 'og-en.jpg' },
  { slug: 'tr', htmlLang: 'tr', hreflang: 'tr', ogLocale: 'tr_TR', endonym: 'Türkçe', ogImage: 'og-en.jpg' },
  { slug: 'uk', htmlLang: 'uk', hreflang: 'uk', ogLocale: 'uk_UA', endonym: 'Українська', ogImage: 'og-en.jpg' },
  { slug: 'id', htmlLang: 'id', hreflang: 'id', ogLocale: 'id_ID', endonym: 'Bahasa Indonesia', ogImage: 'og-en.jpg' },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectKeyPaths(obj, prefix = '') {
  const paths = [];
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...collectKeyPaths(value, next));
    } else {
      paths.push(next);
    }
  }
  return paths.sort();
}

function getByPath(obj, dotPath) {
  let cur = obj;
  for (const part of dotPath.split('.')) {
    if (cur == null || typeof cur !== 'object' || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function validateLocales(dicts) {
  const en = dicts.get('en');
  if (!en) throw new Error('Missing reference locale: site/locales/en.json');
  const expectedKeys = collectKeyPaths(en);

  for (const locale of SITE_LOCALES) {
    const dict = dicts.get(locale.slug);
    if (!dict) throw new Error(`Missing locale file: site/locales/${locale.slug}.json`);
    const actualKeys = collectKeyPaths(dict);
    const missing = expectedKeys.filter((k) => !actualKeys.includes(k));
    const extra = actualKeys.filter((k) => !expectedKeys.includes(k));
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `Locale "${locale.slug}" key mismatch:` +
          (missing.length ? ` missing=[${missing.join(', ')}]` : '') +
          (extra.length ? ` extra=[${extra.join(', ')}]` : '')
      );
    }
    for (const key of actualKeys) {
      const val = getByPath(dict, key);
      if (typeof val !== 'string') {
        throw new Error(`Locale "${locale.slug}" key "${key}" must be a string`);
      }
      if (key !== 'brandCnSuffix' && val.trim().length === 0) {
        throw new Error(`Locale "${locale.slug}" key "${key}" must not be empty`);
      }
    }
  }
}

function localeUrl(locale) {
  return locale.isDefault ? `${BASE_URL}/` : `${BASE_URL}/${locale.slug}/`;
}

function buildJsonLd(locale, dict) {
  const url = localeUrl(locale);
  const faqEntries = [];
  for (let i = 1; i <= 8; i++) {
    faqEntries.push({
      '@type': 'Question',
      name: dict.faq[`q${i}`],
      acceptedAnswer: {
        '@type': 'Answer',
        text: dict.faq[`a${i}`],
      },
    });
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: dict.brandName,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Chrome, Edge',
        url,
        downloadUrl: 'https://chromewebstore.google.com/detail/mfmldbbkajimckojjgceehiackjpakai',
        sameAs: 'https://github.com/Shirolin/postpress',
        license: 'https://www.gnu.org/licenses/gpl-3.0.html',
        softwareVersion: EXTENSION_VERSION,
        author: {
          '@type': 'Person',
          name: 'Shirolin',
          url: 'https://github.com/Shirolin',
        },
        image: `${BASE_URL}/assets/cards/${locale.ogImage}`,
        description: dict.meta.appDescription,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqEntries,
      },
    ],
  };

  return JSON.stringify(graph, null, 2)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');
}

function buildClientI18nJson(locale, dict) {
  const payload = {
    lang: locale.slug,
    themeLabel: {
      light: dict.themeToggle.light,
      dark: dict.themeToggle.dark,
    },
    themeAria: {
      light: dict.themeToggle.ariaToLight,
      dark: dict.themeToggle.ariaToDark,
    },
    specCardAltTemplate: dict.spec.cardAltTemplate,
    articleAlts: dict.article.alts,
    materials: dict.materials,
  };
  return JSON.stringify(payload).replace(/<\/(script)/gi, '<\\/$1');
}

function renderLocaleHtml(template, locale, dict) {
  const base = locale.isDefault ? '.' : '..';
  const canonicalUrl = localeUrl(locale);

  const hreflangLinks = [
    ...SITE_LOCALES.map(
      (l) => `    <link rel="alternate" hreflang="${l.hreflang}" href="${localeUrl(l)}" />`
    ),
    `    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`,
  ].join('\n');

  const ogLocaleAlternates = SITE_LOCALES.filter((l) => l.slug !== locale.slug)
    .map((l) => `    <meta property="og:locale:alternate" content="${l.ogLocale}" />`)
    .join('\n');

  const langOptions = SITE_LOCALES.map((l) => {
    const href = l.isDefault ? `${base}/` : `${base}/${l.slug}/`;
    const selected = l.slug === locale.slug ? ' selected' : '';
    return `            <option value="${l.slug}" data-href="${href}"${selected}>${escapeHtml(l.endonym)}</option>`;
  }).join('\n');

  const brandCnSpan = dict.brandCnSuffix
    ? `\n            <span class="brand-cn">${escapeHtml(dict.brandCnSuffix)}</span>`
    : '';

  const initialAlt = dict.spec.cardAltTemplate.replace('{name}', dict.materials.midnight.name);

  const computed = {
    slug: locale.slug,
    htmlLang: locale.htmlLang,
    base,
    canonicalUrl,
    ogImage: locale.ogImage,
    ogLocale: locale.ogLocale,
    hreflangLinks,
    ogLocaleAlternates,
    langOptions,
    brandCnSpan,
    jsonLd: buildJsonLd(locale, dict),
    clientI18nJson: buildClientI18nJson(locale, dict),
    'spec.initialAlt': initialAlt,
  };

  let out = template.replace(/\{\{\{([a-zA-Z0-9_.]+)\}\}\}/g, (_, key) => {
    const val = getByPath(dict, key);
    if (val === undefined) throw new Error(`Missing raw template key "${key}" for "${locale.slug}"`);
    return String(val);
  });

  out = out.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => {
    if (key in computed) return computed[key];
    const val = getByPath(dict, key);
    if (val === undefined) throw new Error(`Missing template key "${key}" for "${locale.slug}"`);
    return escapeHtml(val);
  });

  if (/\{\{[^}]+\}\}/.test(out)) {
    throw new Error(`Unresolved template placeholder left in rendered "${locale.slug}"`);
  }
  return out;
}

function buildEnRedirectHtml(enDict) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=../" />
    <link rel="canonical" href="${BASE_URL}/" />
    <title>${escapeHtml(enDict.meta.title)}</title>
    <script>location.replace('../');</script>
  </head>
  <body>
    <p>Redirecting to <a href="../">PostPress</a>…</p>
  </body>
</html>
`;
}

function buildSitemapXml() {
  const urls = SITE_LOCALES.map((locale) => {
    const priority = locale.isDefault ? '1.0' : '0.9';
    return `  <url>
    <loc>${localeUrl(locale)}</loc>
    <lastmod>2026-11-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const template = readFileSync(join(SITE, 'template.html'), 'utf8');
  const dicts = new Map();

  for (const locale of SITE_LOCALES) {
    const file = join(LOCALES_DIR, `${locale.slug}.json`);
    if (!existsSync(file)) throw new Error(`Missing locale file: ${file}`);
    dicts.set(locale.slug, JSON.parse(readFileSync(file, 'utf8')));
  }

  validateLocales(dicts);

  const outputs = new Map();
  for (const locale of SITE_LOCALES) {
    const target = locale.isDefault
      ? join(SITE, 'index.html')
      : join(SITE, locale.slug, 'index.html');
    outputs.set(target, renderLocaleHtml(template, locale, dicts.get(locale.slug)));
  }
  outputs.set(join(SITE, 'en', 'index.html'), buildEnRedirectHtml(dicts.get('en')));
  outputs.set(join(SITE, 'sitemap.xml'), buildSitemapXml());

  if (checkOnly) {
    const stale = [];
    for (const [file, content] of outputs) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== content) {
        stale.push(file);
      }
    }
    if (stale.length > 0) {
      console.error('Generated site files are out of date:\n' + stale.join('\n'));
      process.exit(1);
    }
    console.log(`site i18n check ok (${SITE_LOCALES.length} locales, ${outputs.size} files)`);
    return;
  }

  for (const [file, content] of outputs) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content, 'utf8');
  }
  console.log(`Generated ${outputs.size} files across ${SITE_LOCALES.length} locales.`);
}

main();
