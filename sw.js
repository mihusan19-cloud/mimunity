const CACHE_NAME = 'mimunity-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/utils.js',
  './js/notification.js',
  './js/app.js',
  './js/auth.js',
  './js/profile.js',
  './js/chat.js',
  './js/notebook.js',
  './js/avatarfx.js',
  './icon-192.png',
  './icon-512.png',
  './effects/fx1.svg',
  './effects/fx2.svg',
  './effects/fx3.svg',
  './effects/fx4.svg',
  './effects/fx5.svg',
  './effects/fx6.svg',
  './effects/effectsfx7.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
