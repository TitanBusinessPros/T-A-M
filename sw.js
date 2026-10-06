const CACHE_PREFIX = `titan-app-maker-${encodeURIComponent(new URL(self.registration.scope).pathname)}-`;
const CACHE = `${CACHE_PREFIX}v31`;
const FILES = [
  './', './index.html', './admin.html', './terms.html', './privacy.html', './space-game.html', './checkers-game.html', './pinball-game.html', './qr-maker.html', './website-maker.html', './website-photo-builder.html', './invoice-generator.html', './match-3-game.html', './follow-along-game.html', './manifest.webmanifest',
  './src/style.css', './src/main.js', './src/checkers-builder.js', './src/checkers-logo.js', './src/chess-builder.js', './src/chess-brand.js', './src/pinball-builder.js', './src/pinball-brand.js', './src/qr-maker-builder.js', './src/qr-maker-brand.js', './src/website-maker-builder.js', './src/website-maker-brand.js', './src/website-photo-builder-builder.js', './src/website-photo-builder-brand.js', './src/invoice-generator-builder.js', './src/invoice-generator-brand.js', './src/match3-builder.js', './src/match3-brand.js', './src/follow-along-builder.js', './src/follow-along-brand.js', './src/admin.js', './src/credit-balance.js', './src/firebase.js', './src/game-logo.js', './src/install.js', './src/learn-money.js',
  './assets/titan-logo.png', './assets/galactic-drift.mp3', './assets/qrcode.min.js',
  './assets/icons/favicon.ico', './assets/icons/favicon-96x96.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/web-app-manifest-192x192.png',
  './assets/icons/web-app-manifest-512x512.png',
];
const cachedPaths = new Set(FILES.map((file) => new URL(file, self.registration.scope).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => (key.startsWith(CACHE_PREFIX) && key !== CACHE) || key === 'titan-app-maker-v1')
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !cachedPaths.has(url.pathname)) return;

  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE);
    const response = await cache.match(url.pathname);
    return response || Response.error();
  }));
});
