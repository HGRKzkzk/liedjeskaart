// src/service-worker.ts
/// <reference lib="webworker" />

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const TILE_CACHE = `tiles-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',                // startpagina
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/global.css',
];

// Install: cache de belangrijkste statische bestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: verwijder oude caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, TILE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: probeer eerst cache, dan netwerk
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 🗺️ MapTiler-tegels → cache met stale-while-revalidate
  if (url.hostname.includes('api.maptiler.com')) {
    event.respondWith(cacheTile(req));
    return;
  }

  // 🧱 Statische assets uit cache
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((res) => res || fetch(req)));
    return;
  }

  // 🌐 Fallback: probeer netwerk, val anders terug op cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Helper: stale-while-revalidate voor MapTiler-tiles
async function cacheTile(req: Request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then((networkRes) => {
      if (networkRes.ok) cache.put(req, networkRes.clone());
      return networkRes;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
