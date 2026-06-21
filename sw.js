/* sw.js — PWA-installable version */
const VERSION = 'v25';
const CACHE_NAME = `111-game-${VERSION}`;

self.addEventListener('install', (e) => {
  // Skip pre-caching; the fetch handler caches assets on first request.
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
  // Network-first with cache fallback.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a fresh copy of successful GETs.
        if (event.request.method === 'GET' && response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
