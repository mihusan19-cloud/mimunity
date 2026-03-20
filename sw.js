// sw.js 內容
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

// sw.js 建議小改動
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
