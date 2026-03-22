// 1. 定義快取名稱（每次更新遊戲內容，建議把 v1 改成 v2，瀏覽器才會更新）
const CACHE_NAME = 'mimunity-v1';

// 2. 列出所有「斷網時也要能跑」的檔案
// 請確保這些檔案在你的 GitHub 倉庫中路徑正確
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // 如果你有外部的 CSS 或 JS 檔案，也要加進來，例如：
  // './style.css',
  // './game.js'
];

// 安裝階段：下載資源並存入 Cache Storage
self.addEventListener('install', (event) => {
  console.log('Service Worker: 正在安裝並快取資源...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // 強制更新
  );
});

// 激活階段：清理舊版的過期快取
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 已激活');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('清理舊快取:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// ... 前面是 install 和 activate 事件 ...

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // ✨ 關鍵修改：如果是 API 請求 (例如 Supabase)，直接放行不處理
    if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/')) {
        return; // 直接返回，交由瀏覽器正常處理
    }

    // 原本的快取處理邏輯 (處理 HTML, CSS, JS 等靜態資源)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});;
