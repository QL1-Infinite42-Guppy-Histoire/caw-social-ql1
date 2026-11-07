/* CAW Social — PAUSED for maintenance.
   This service worker replaces the app-shell worker (caw-shell-v5 and
   earlier): it deletes every old cache, never caches or serves app.js,
   and always tries the network first so the pause page is what people
   see. When the site reopens, ship a new worker with a fresh cache
   name that caches the app shell again. */
const CACHE = 'caw-shell-v6-paused';
const SHELL = [
  './', 'index.html', 'en.html', 'ja.html',
  'style.css', 'manifest.webmanifest',
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
  // The app is paused: never hand out the app script, even to a tab that
  // still holds the old page.
  if (url.pathname.endsWith('/app.js') || url.pathname.endsWith('app.js')) {
    event.respondWith(new Response('/* CAW Social is paused for maintenance. */', {
      headers: { 'Content-Type': 'application/javascript' },
    }));
    return;
  }
  // Network first, cache as a fallback: the pause page must win over any
  // stale copy of the old app shell.
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
