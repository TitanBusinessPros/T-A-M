const CACHE = 'titan-app-maker-v1';
const FILES = [
  './', './index.html', './space-game.html', './manifest.webmanifest',
  './src/style.css', './src/main.js', './src/firebase.js', './src/game-logo.js',
  './assets/titan-logo.png', './assets/galactic-drift.mp3',
  './assets/icons/favicon-96x96.png',
  './assets/icons/web-app-manifest-192x192.png',
  './assets/icons/web-app-manifest-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
