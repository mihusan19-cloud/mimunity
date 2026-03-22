// 1. 定義快取名稱（如果你推送後發現沒更新，請把 v2 改成 v3）
const CACHE_NAME = 'mimmunity-v2.2'; 

// 2. 靜態資源列表
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝階段：立即接管
self.addEventListener('install', (event) => {
  console.log('SW: 正在安裝新版本...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // 強制跳過等待，立即取代舊版 SW
  );
});

// 激活階段：清理所有舊快取
self.addEventListener('activate', (event) => {
  console.log('SW: 已激活並清理舊快取');
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // 立即控制所有開啟的分頁
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
    // 取得完整的請求網址字串
    const requestUrl = event.request.url;

    // ✨ 強化版守門員：只要網址包含 supabase.co 或 rest/v1，徹底放行
    if (requestUrl.includes('supabase.co') || requestUrl.includes('/rest/v1/')) {
        console.log('SW 放行 API 請求:', requestUrl);
        return; // 直接中斷 SW 處理，讓瀏覽器接手
    }

    // 原本的靜態資源處理邏輯
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
