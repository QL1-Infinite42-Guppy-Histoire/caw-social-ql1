/* CAW Social — web viewer (reading for everyone, name minting
   through the visitor's own wallet, posting through the built-in
   posting wallet whose key never leaves the visitor's browser).
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
const CACHE = 'caw-view-v20';
const SHELL = [
  './', 'index.html', 'en.html', 'ja.html',
  'style.css', 'viewer.js', 'bip39-words.js', 'manifest.webmanifest',
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

/* Web Push for the X -> CAW mirror inbox (v19, the ETH web
   inbox's worker pattern): a push from the eth-caw-mirror
   Worker shows a notification; tapping it focuses/opens the
   viewer at the mirror inbox — ?mirror=1&item=<id> when the
   payload carries an item id, plain ?mirror=1 otherwise —
   resolved against this worker's scope (the language gate at
   the scope root keeps the query string, so the deep link
   survives to the en/ja shell). Push handling never touches
   the cache strategy above. */
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); }
    catch (e) {
      try { data = { text: event.data.text() }; } catch (e2) { data = {}; }
    }
  }
  const title = data.title || 'CAW Mirror';
  const body = data.body || data.text || '';
  const target = data.id != null ? '?mirror=1&item=' + encodeURIComponent(data.id) : '?mirror=1';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { target },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.target) || '?mirror=1';
  const url = new URL(target, self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (let i = 0; i < list.length; i++) {
        const client = list[i];
        if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
          const nav = client.navigate ? client.navigate(url).catch(() => null) : Promise.resolve(null);
          return nav.then(() => client.focus());
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return null;
    })
  );
});
