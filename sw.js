/* sw.js — THE BYPASS VERSION */
const VERSION = 'restore-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// The "Pass-Through": Just go to the network for everything
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
