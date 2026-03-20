// sw.js 內容
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // 必須有這個空監聽器才能觸發 PWA 安裝
});
