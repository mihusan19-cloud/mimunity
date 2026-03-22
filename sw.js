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

// 攔截請求：當沒網路時，從快取中提取檔案
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果快取有，就直接給；沒有的話，才去聯網抓
      return response || fetch(event.request);
    })
  );
});
