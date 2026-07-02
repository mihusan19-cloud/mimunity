const CACHE_NAME = 'mimmunity-v1';
const ASSETS = [
  './',
  './index.html',
  // 這裡放入你需要快取的其他路徑
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});