// updateAppHtml.js
// ----------------------------------------------
// ✓ Draait bij zowel SPA als STATIC builds
// ✓ Slaat dev-modus over
// ✓ Veilig voor prerender (adapter-static)
// ✓ Houdt meta-tags up-to-date o.b.v. marker-count
// ----------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { siteMeta as siteMetaBase } from '../src/lib/data/siteMeta.ts';

// --- Determine file locations ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appHtmlPath = path.resolve(__dirname, '../src/app.html');
const markersPath = path.resolve(__dirname, '../static/data/markers.json');

// --- Prevent running during dev ---
if (process.argv.includes('dev')) {
  console.log('ℹ️ updateAppHtml.js overgeslagen (development mode)');
  process.exit(0);
}

// --- Detect build mode ---
const BUILD_MODE = process.env.BUILD_MODE || 'static';
console.log(`🔧 updateAppHtml.js gestart (mode: ${BUILD_MODE})`);

// --- Validate files ---
if (!fs.existsSync(appHtmlPath)) {
  console.error('❌ src/app.html niet gevonden!');
  process.exit(1);
}

if (!fs.existsSync(markersPath)) {
  console.error('❌ static/data/markers.json niet gevonden!');
  process.exit(1);
}

// --- Read markers.json ---
const markers = JSON.parse(fs.readFileSync(markersPath, 'utf8'));
const markerCount = Array.isArray(markers) ? markers.length : 0;

// --- Construct updated meta ---
const siteMeta = {
  ...siteMetaBase,
  description: siteMetaBase.description.replace('%COUNT%', markerCount),
  ogDescription: siteMetaBase.ogDescription.replace('%COUNT%', markerCount),
  twitterDescription: siteMetaBase.twitterDescription.replace('%COUNT%', markerCount)
};

// --- Load app.html ---
let html = fs.readFileSync(appHtmlPath, 'utf8');

// ⭐⭐⭐ NEW: Replace %COUNT% globally (also inside JSON-LD)
html = html.replace(/%COUNT%/g, markerCount);

// --- Helpers ---
function upsertMeta(name, content) {
  const tag = `<meta name="${name}" content="${content}">`;
  const regex = new RegExp(`<meta[^>]*name="${name}"[^>]*>`, 'i');
  html = regex.test(html)
    ? html.replace(regex, tag)
    : html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertOg(property, content) {
  const tag = `<meta property="${property}" content="${content}">`;
  const regex = new RegExp(`<meta[^>]*property="${property}"[^>]*>`, 'i');
  html = regex.test(html)
    ? html.replace(regex, tag)
    : html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertTwitter(name, content) {
  const tag = `<meta name="twitter:${name}" content="${content}">`;
  const regex = new RegExp(`<meta[^>]*name="twitter:${name}"[^>]*>`, 'i');
  html = regex.test(html)
    ? html.replace(regex, tag)
    : html.replace('</head>', `  ${tag}\n</head>`);
}

// --- Update <title> ---
html = html.replace(/<title>.*?<\/title>/i, `<title>${siteMeta.title}</title>`);

// --- Inject meta tags ---
upsertMeta('description', siteMeta.description);
upsertMeta('keywords', siteMeta.keywords);
upsertMeta('author', siteMeta.author);
upsertMeta('robots', siteMeta.robots);

upsertOg('og:title', siteMeta.ogTitle);
upsertOg('og:description', siteMeta.ogDescription);
upsertOg('og:image', siteMeta.ogImage);
upsertOg('og:image:alt', siteMeta.ogImageAlt);
upsertOg('og:url', siteMeta.ogUrl);
upsertOg('og:type', siteMeta.ogType);
upsertOg('og:locale', siteMeta.ogLocale);

upsertTwitter('card', siteMeta.twitterCard);
upsertTwitter('title', siteMeta.twitterTitle);
upsertTwitter('description', siteMeta.twitterDescription);
upsertTwitter('image', siteMeta.twitterImage);

// --- Write updated html back to file ---
fs.writeFileSync(appHtmlPath, html);

console.log(`✅ app.html bijgewerkt (COUNT=${markerCount}, mode=${BUILD_MODE})`);
