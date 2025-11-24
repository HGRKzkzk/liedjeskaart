/// <reference lib="webworker" />

// ⚡ FORCE VERSION BUMP — altijd een nieuwe versie afdwingen
const SW_VERSION = '2025-11-21-01';

// ❌ Geen caching van tiles meer. 
// ❌ Geen caching van statische assets meer.
// ✔️ Alles komt altijd vers van de server.
// ✔️ Oude versies worden direct vernietigd.

// INSTALL — vervang direct de oude service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ACTIVATE — wis ALLE bestaande caches op het domein
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH — laat ALLES gewoon via netwerk lopen
self.addEventListener('fetch', (event) => {
  // GEEN interceptie → GEEN cache issues meer
  return;
});
