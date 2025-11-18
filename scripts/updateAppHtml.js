// Alleen draaien tijdens SPA builds
if (process.env.BUILD_MODE !== 'spa') {
  console.log('ℹ️ updateAppHtml.js overgeslagen (geen SPA build)');
  process.exit(0);
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { siteMeta as siteMetaBase } from '../src/lib/data/siteMeta.ts'; // extensieloos beter ⚠️

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// markers.json inlezen
const markersPath = path.resolve(__dirname, '../static/data/markers.json');
const markers = JSON.parse(fs.readFileSync(markersPath, 'utf8'));
const markerCount = markers.length;

const siteMeta = {
  ...siteMetaBase,
  description: siteMetaBase.description.replace('%COUNT%', markerCount)
};

const appHtmlPath = path.resolve(__dirname, '../src/app.html');

if (!fs.existsSync(appHtmlPath)) {
  console.error('❌ src/app.html niet gevonden!');
  process.exit(1);
}

let html = fs.readFileSync(appHtmlPath, 'utf8');

// helpers (ongewijzigd)
function upsertMeta(name, content) { /* ... */ }
function upsertOg(prop, content) { /* ... */ }
function upsertTwitter(name, content) { /* ... */ }

// title
if (/<title>.*<\/title>/i.test(html)) {
  html = html.replace(/<title>.*<\/title>/i, `<title>${siteMeta.title}</title>`);
}

// meta
upsertMeta('description', siteMeta.description);
upsertMeta('keywords', siteMeta.keywords);
upsertMeta('author', siteMeta.author);
upsertMeta('robots', siteMeta.robots);

// Open Graph
upsertOg('og:title', siteMeta.ogTitle);
upsertOg('og:description', siteMeta.ogDescription);
upsertOg('og:image', siteMeta.ogImage);
upsertOg('og:url', siteMeta.ogUrl);
upsertOg('og:type', siteMeta.ogType);
upsertOg('og:locale', siteMeta.ogLocale);

// Twitter
upsertTwitter('card', siteMeta.twitterCard);
upsertTwitter('title', siteMeta.twitterTitle);
upsertTwitter('description', siteMeta.twitterDescription);
upsertTwitter('image', siteMeta.twitterImage);

fs.writeFileSync(appHtmlPath, html);
console.log('✅ app.html bijgewerkt (SPA build)');
