/* CAW Social — web viewer (reading for everyone, name minting
   through the visitor's own wallet).
   Fresh cache name per release; old caches are deleted on activate.
   Strategy is NETWORK FIRST for same-origin pages and assets, with
   the cache only as an offline fallback — a fresh visitor always
   gets the newest build, never a stale shell.

   The viewer script is called viewer.js ON PURPOSE — do not rename
   it back to app.js. Retired workers attack the old name: the pause
   worker (caw-shell-v6-paused) answers ANY app.js request with an
   empty stub ("paused for maintenance"), and the cache-first shells
   before it serve their cached app.js for app.js?v=… because they
   match with ignoreSearch. Either way the page shell loads but the
   viewer never boots and the timeline stays blank (this bit real
   users on 2026-11-08). viewer.js is in no old cache and matches no
   stub rule, so it reaches the network untouched; once this worker
   installs (skipWaiting + clients.claim) it takes over cleanly. */
const CACHE = 'caw-view-v11';
const SHELL = [
  './', 'index.html', 'en.html', 'ja.html',
  'style.css', 'viewer.js', 'manifest.webmanifest',
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
