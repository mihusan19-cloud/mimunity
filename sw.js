// 1. 定義快取名稱（如果你推送後發現沒更新，請把 v2 改成 v3）
const CACHE_NAME = 'mimmunity-v2.1'; 

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

// 核心邏輯：攔截與放行
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 【守門員邏輯】如果是 Supabase 的 API 請求，絕對不攔截、不快取
  // 這樣能解決 406 錯誤、排行榜無紀錄、最高分同步問題
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/')) {
    return; // 直接交給瀏覽器處理，不執行 event.respondWith
  }

  // 靜態資源採用「先看快取，沒有才抓網路」的策略
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // 如果連網路都斷了且快取也沒有，至少不讓它噴紅字
        console.log('網路請求失敗且無快取:', event.request.url);
      });
    })
  );
});
