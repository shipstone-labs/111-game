/* sw.js — cache-busting version for 111-game
   Goals:
   - Always fetch fresh: HTML, manifest, icons
   - Cache static assets (optional) with versioned cache name
   - Immediately activate new SW and delete old caches
*/

const CACHE_VERSION = "v20260220-final-restore";
const STATIC_CACHE = `111-static-${CACHE_VERSION}`;

// File types we NEVER want to serve from cache (these cause "unchanged" launch page / icons)
const NEVER_CACHE_EXT = [".html", ".json", ".png", ".webmanifest"];

self.addEventListener("install", () => {
  // Activate this service worker immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Take control of all clients immediately
    await self.clients.claim();
    // Delete old caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k.startsWith("111-static-") && k !== STATIC_CACHE) ? caches.delete(k) : Promise.resolve()));
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const path = url.pathname.toLowerCase();

  // Never cache these (force fresh from network)
  const isNever =
    path.endsWith("/") ||
    NEVER_CACHE_EXT.some((ext) => path.endsWith(ext)) ||
    path.includes("manifest") ||
    path.includes("icon-") ||
    path.includes("111-logo");

  if (isNever) {
    event.respondWith((async () => {
      try {
        return await fetch(req, { cache: "no-store" });
      } catch (e) {
        const cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Cache-first for other same-origin assets (js/css/fonts/etc)
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    const res = await fetch(req);
    if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  })());
});
