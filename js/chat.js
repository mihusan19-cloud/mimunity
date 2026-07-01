function setupPresence() {
    if (presenceChannel) {
        supabaseClient.removeChannel(presenceChannel);
    }
    presenceChannel = supabaseClient.channel('online-users');
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const newState = presenceChannel.presenceState();
            userPresence = {};
            Object.values(newState).forEach(arr => arr.forEach(p => { userPresence[p.user_id] = true; }));
            fetchUserList();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: currentUser.id });
            }
        });
}

async function fetchUserList() {
    const { data: users } = await supabaseClient.from('profiles').select('id, username, avatar_url, avatar_fx');
    const listEl = document.getElementById('user-list');
    listEl.innerHTML = (users || []).map(u => {
        if (u.id === currentUser.id) return '';
        const isOnline = userPresence[u.id];
        return `<div style="text-align:center; cursor:pointer; min-width:60px;" onclick="showUserMenu(event, '${u.id}')">
            <div class="avatar-wrapper">
                <img src="${getImageUrl(u.avatar_url) || ''}" class="chat-avatar" onerror="this.src='https://via.placeholder.com/40'">
                <div class="status-dot ${isOnline ? 'online' : ''}"></div>
            </div>
            <div style="font-size:10px;">${escapeHTML(u.username || '匿名')}</div>
        </div>`;
    }).join('');
}

async function fetchMessages() {
    console.log('--- 開始抓取訊息 ---');
    console.log('目前登入者 ID:', currentUser?.id);
    console.log('當前私訊目標 ID (chatTarget):', chatTarget);

    let query = supabaseClient.from('messages').select('*, profiles(username, avatar_url, avatar_fx)');
    if (chatTarget) {
        query = query.or(`and(user_id.eq.${currentUser.id},receiver_id.eq.${chatTarget}),and(user_id.eq.${chatTarget},receiver_id.eq.${currentUser.id})`);
        document.getElementById('chat-title').innerHTML = `💬 私訊中 <button onclick="chatTarget=null;fetchMessages();" style="font-size:10px; cursor:pointer; background:none; border:1px solid #ddd; padding:2px 5px; border-radius:4px;">返回大廳</button>`;
    } else {
        query = query.is('receiver_id', null);
        document.getElementById('chat-title').innerHTML = '💬 公共聊天大廳';
    }

    const { data: msgs, error } = await query.order('created_at', { ascending: true });
    if (error) {
        console.error('Supabase 抓取錯誤:', error.message);
        return;
    }

    const box = document.getElementById('chat-box');
    box.innerHTML = (msgs || []).map(m => {
        const isMe = m.user_id === currentUser.id;
        let content = (m.content || '').replace(/\|\|(.*?)\|\|/g, '<span class="spoiler" onclick="this.classList.add(\'revealed\')">$1</span>');
        content = linkify(content);
        let file = '';
        if (m.file_url) {
            const imgUrl = getImageUrl(m.file_url);
            file = m.is_spoiler ?
                `<div class="spoiler-img-container" onclick="this.classList.add('revealed'); this.querySelector('img').classList.add('revealed')">
                    <img src="${imgUrl}" class="spoiler-img" onload="scrollToBottom()">
                    <div class="spoiler-label">防雷</div>
                </div>` :
                `<img src="${imgUrl}" style="max-width:100%; border-radius:8px; margin-top:5px;" loading="lazy" onload="scrollToBottom()">`;
        }
        return `<div class="msg-container ${isMe ? 'msg-me' : 'msg-other'}">
            <div class="avatar-wrapper">
                <img src="${getImageUrl(m.profiles?.avatar_url) || ''}" class="chat-avatar" onclick="showUserMenu(event, '${m.user_id}')" onerror="this.src='https://via.placeholder.com/32'">
                ${m.profiles?.avatar_fx ? `<img src="${m.profiles.avatar_fx}" class="avatar-decoration">` : ''}
            </div>
            <div class="bubble">
                <div style="font-size:10px; opacity:0.7; margin-bottom:3px;">${escapeHTML(m.profiles?.username || '未知用戶')}</div>
                <div>${content}</div>
                ${file}
            </div>
        </div>`;
    }).join('');

    scrollToBottom();
}

async function handleSendMessage() {
    const input = document.getElementById('chat-input');
    const fileInput = document.getElementById('chat-file');
    const isSpoiler = document.getElementById('chat-is-spoiler').checked;
    if (!input.value.trim() && !fileInput.files[0]) return;
    let fileUrl = null;
    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        const path = `chat/${Date.now()}_chat.${file.name.split('.').pop()}`;
        await supabaseClient.storage.from('avatars').upload(path, file);
        fileUrl = path;
    }
    await supabaseClient.from('messages').insert([{ content: input.value, user_id: currentUser.id, receiver_id: chatTarget, file_url: fileUrl, is_spoiler: isSpoiler }]);
    input.value = '';
    fileInput.value = '';
    document.getElementById('chat-is-spoiler').checked = false;
    fetchMessages();
}

function setupRealtime() {
    if (messageChannel) {
        supabaseClient.removeChannel(messageChannel);
    }
    messageChannel = supabaseClient.channel('any')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMsg = payload.new;
            if (newMsg.user_id !== currentUser.id && Notification.permission === 'granted' && document.hidden) {
                new Notification('收到新訊息', {
                    body: newMsg.content || '傳送了一個檔案',
                    icon: 'icon-192.png'
                });
            }
            fetchMessages();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => fetchPosts())
        .subscribe();
}
