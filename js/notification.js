function updateNotifBtn(status) {
    const btn = document.getElementById('notif-btn');
    if (!btn) return;
    if (status === 'granted') {
        btn.innerHTML = '<span class="nav-icon">●</span><span>通知開啟</span>';
        btn.classList.add('notification-on');
        btn.classList.remove('notification-blocked');
    } else if (status === 'denied') {
        btn.innerHTML = '<span class="nav-icon">×</span><span>通知封鎖</span>';
        btn.classList.add('notification-blocked');
        btn.classList.remove('notification-on');
    } else {
        btn.innerHTML = '<span class="nav-icon">♢</span><span>通知</span>';
        btn.classList.remove('notification-on', 'notification-blocked');
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
