/* CAW Social — read-only web viewer.
   Replaces the maintenance worker (caw-shell-v6-paused) and all
   earlier shells: fresh cache name, old caches deleted on activate,
   app.js cached again (the viewer has no write features at all).
   Strategy is NETWORK FIRST for same-origin pages and assets, with
   the cache only as an offline fallback — a fresh visitor always
   gets the newest build, never a stale shell. */
const CACHE = 'caw-view-v7';
const SHELL = [
  './', 'index.html', 'en.html', 'ja.html',
  'style.css', 'app.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy));
      }
      return res;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
