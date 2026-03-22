const CACHE_NAME = 'mimunity-v3.0'; // 建議手動升級版本號
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // 確認 icon-192.png 等圖示檔案確實存在於根目錄再加入
];

// 安裝：快取靜態資源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// 激活：清理舊快取
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
    ))
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 關鍵修正：如果是連往 Supabase 的 API 請求，直接放行，不走快取
  if (url.hostname.includes('supabase.co')) {
    return; // 讓瀏覽器正常處理網路請求
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
