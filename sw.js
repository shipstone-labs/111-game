/* sw.js — PWA-installable version */
const VERSION = 'v11';
const CACHE_NAME = `111-game-${VERSION}`;
const CORE_FILES = [
  '/111-game/',
  '/111-game/index.html',
  '/111-game/game.html',
  '/111-game/manifest.json',
  '/111-game/icon-192b.png',
  '/111-game/icon-512.png',
  '/111-game/icon-1024.png',
  '/111-game/apple-touch-icon.png',
  '/111-game/maskable-192.png',
  '/111-game/maskable-512.png',
  '/111-game/maskable-1024.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a fresh copy
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback — serve from cache
        return caches.match(event.request);
      })
  );
});
