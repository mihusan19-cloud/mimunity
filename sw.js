// sw.js
const CACHE_NAME = 'mimmunity-v3.0'; // 升級版本號以強制更新

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        }));
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;
  // 核心守門員：放行 Supabase API
  if (requestUrl.includes('supabase.co') || requestUrl.includes('/rest/v1/')) {
    return; 
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// 頁面載入或切換回首頁時執行
async function syncUserStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. 取得個人檔案
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

    // 2. 取得歷史最高分 (從 game_scores 資料表)
    const { data: scoreData, error } = await supabase
        .from('game_scores')
        .select('score')
        .eq('user_id', user.id)
        .maybeSingle();

    const highScore = scoreData ? scoreData.score : 0;

    // 更新介面 (假設你有這些 ID 的元素)
    if(document.getElementById('highScoreDisplay')) {
        document.getElementById('highScoreDisplay').innerText = `個人最高紀錄: ${highScore}`;
    }
    return highScore;
}

async function handleGameOver(finalScore) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 先抓取目前紀錄
    const currentBest = await syncUserStats();

    // 只有打破紀錄才更新資料庫
    if (finalScore > currentBest) {
        const { error } = await supabase
            .from('game_scores')
            .upsert({ 
                user_id: user.id, 
                score: finalScore, 
                updated_at: new Date() 
            });
        
        if (!error) {
            console.log("新紀錄已同步！");
            syncUserStats(); // 重新整理顯示的分數
        }
    }
}
