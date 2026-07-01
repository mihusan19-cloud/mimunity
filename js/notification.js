function updateNotifBtn(status) {
    const btn = document.getElementById('notif-btn');
    if (!btn) return;
    if (status === 'granted') {
        btn.innerText = '🔔 通知已開啟';
        btn.style.color = 'var(--fb-green)';
    } else if (status === 'denied') {
        btn.innerText = '🚫 通知被封鎖';
        btn.style.color = 'red';
    } else {
        btn.innerText = '開啟通知';
        btn.style.color = 'var(--fb-gray)';
    }
}

async function toggleNotification() {
    if (!('Notification' in window)) {
        alert('此瀏覽器不支援通知');
        return;
    }
    const permission = await Notification.requestPermission();
    updateNotifBtn(permission);
    if (permission === 'granted') {
        new Notification('mimunity', {
            body: '通知功能已成功啟動！',
            icon: 'icon-192.png'
        });
    }
}
