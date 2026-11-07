/* CAW Social — minimal service worker: caches the app shell so the site
   opens like an app. Chain data always comes from the network (the fetch
   handler below only handles same-origin GET requests, and revalidates
   them in the background). */
const CACHE = 'caw-shell-v3';
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
    caches.match(event.request, { ignoreSearch: true }).then(hit => {
      const network = fetch(event.request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
