async function loadUserInfo() {
    const { data } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) document.getElementById('welcome-msg').innerText = `嗨，${data.username || '使用者'}！`;
}

async function loadProfileData() {
    const idToFetch = viewingUserId || currentUser.id;
    const isSelf = idToFetch === currentUser.id;
    const { data: profile, error } = await supabaseClient.from('profiles').select('*').eq('id', idToFetch).single();
    if (error) {
        console.error('loadProfileData error:', error);
    }

    let profileData = profile;
    if (!profileData && isSelf) {
        const { data: upserted, error: upsertError } = await supabaseClient.from('profiles').upsert({
            id: currentUser.id,
            username: '',
            bio: ''
        });
        if (upsertError) console.error('loadProfileData upsert error:', upsertError);
        profileData = Array.isArray(upserted) ? upserted[0] : upserted;
    }

    if (!profileData) {
        document.getElementById('p-img').src = defaultAvatarUrl;
        if (isSelf) {
            document.getElementById('profile-display-title').innerText = '我的個人檔案';
            document.getElementById('profile-edit-area').style.display = 'block';
            document.getElementById('profile-view-area').style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('bio').value = '';
        } else {
            document.getElementById('profile-display-title').innerText = '匿名 的檔案';
            document.getElementById('profile-edit-area').style.display = 'none';
            document.getElementById('profile-view-area').style.display = 'block';
            document.getElementById('view-username').innerText = '匿名';
            document.getElementById('view-bio').innerText = '這個人很懶，什麼都沒留下...';
            document.getElementById('btn-quick-chat').onclick = () => { openChat(idToFetch); };
        }
        return;
    }

    document.getElementById('p-img').src = getImageUrl(profileData.avatar_url) || defaultAvatarUrl;
    const effectElement = document.getElementById('p-img-effect');
    const effectValue = profileData.avatar_fx || '';
    if (effectElement) {
        effectElement.src = effectValue;
        effectElement.style.display = effectValue ? 'block' : 'none';
        effectElement.className = 'avatar-decoration avatar-decoration-image';
    }

    if (isSelf) {
        document.getElementById('profile-display-title').innerText = '我的個人檔案';
        document.getElementById('profile-edit-area').style.display = 'block';
        document.getElementById('profile-view-area').style.display = 'none';
        document.getElementById('username').value = profileData.username || '';
        document.getElementById('bio').value = profileData.bio || '';
    } else {
        document.getElementById('profile-display-title').innerText = `${profileData.username || '用戶'} 的檔案`;
        document.getElementById('profile-edit-area').style.display = 'none';
        document.getElementById('profile-view-area').style.display = 'block';
        document.getElementById('view-username').innerText = profileData.username || '匿名';
        document.getElementById('view-bio').innerHTML = linkify(escapeHTML(profileData.bio)) || '這個人很懶，什麼都沒留下...';
        document.getElementById('btn-quick-chat').onclick = () => { openChat(idToFetch); };
    }
}

async function handleAvatarUpload() {
    const file = document.getElementById('avatar-file').files[0];
    if (!file) return;
    const path = `avatars/${currentUser.id}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabaseClient.storage.from('avatars').upload(path, file);
    if (!error) {
        await supabaseClient.from('profiles').update({ avatar_url: path }).eq('id', currentUser.id);
        const { data } = await supabaseClient.from('profiles').select('avatar_url').eq('id', currentUser.id).single();
        document.getElementById('p-img').src = getImageUrl(data.avatar_url, true);
    }
}

function encodeForJsTemplate(str) {
    if (str == null) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r?\n/g, '\\n');
}

async function saveProfile() {
    const { error } = await supabaseClient.from('profiles').upsert({
        id: currentUser.id,
        username: document.getElementById('username').value,
        bio: document.getElementById('bio').value
    });
    if (!error) {
        alert('儲存成功！');
        loadProfileData();
    }
}

async function fetchPosts() {
    const list = document.getElementById('posts-list');
    const { data: posts, error } = await supabaseClient.from('posts')
        .select('*, profiles(username, avatar_url, avatar_fx), post_likes(user_id), comments(*, profiles(username))')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('fetchPosts error:', error);
        const fallback = await loadPostsFallback();
        if (fallback) {
            renderPosts(fallback);
            return;
        }
        list.innerHTML = '<div class="empty-state">貼文載入失敗，請稍後重整。</div>';
        return;
    }
    if (!posts || posts.length === 0) {
        list.innerHTML = '<div class="empty-state">目前還沒有貼文，快來發表第一則吧！</div>';
        return;
    }
    renderPosts(posts);
}

async function loadPostsFallback() {
    const { data, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('loadPostsFallback error:', error);
        return null;
    }
    return data || [];
}

function renderPosts(posts) {
    const list = document.getElementById('posts-list');
    list.innerHTML = (posts || []).map(p => {
        const hasLiked = p.post_likes?.some(l => l.user_id === currentUser.id);
        const postImg = getImageUrl(p.image_url);
        const postContent = linkify(escapeHTML(p.content));
        const editActions = currentUser.id === p.user_id ? `<div>
                        <span style="color:blue; cursor:pointer; font-size:12px; margin-right:10px;" onclick="editPost('${p.id}', '${encodeForJsTemplate(p.content)}')">編輯</span>
                        <span style="color:red; cursor:pointer; font-size:12px;" onclick="deletePost('${p.id}')">刪除</span>
                    </div>` : '';
        const commentsHtml = (p.comments || []).map(c => {
            const commentUsername = escapeHTML(c.profiles?.username || '匿名');
            const commentContent = linkify(escapeHTML(c.content));
            const commentActions = currentUser.id === c.user_id ? `<span style="color:blue; font-size:10px; cursor:pointer; margin-left:10px;" onclick="editComment('${c.id}', '${encodeForJsTemplate(c.content)}')">編輯</span>
                    <span style="color:red; font-size:10px; cursor:pointer; margin-left:5px;" onclick="deleteComment('${c.id}')">刪除</span>` : '';
            return `<div class="comment-item">
                        <b>${commentUsername}:</b> ${commentContent}
                        ${commentActions}
                    </div>`;
        }).join('');
        const authorFxImg = p.profiles?.avatar_fx ? `<img src="${escapeHTML(p.profiles.avatar_fx)}" class="avatar-decoration avatar-decoration-image" alt="avatar effect">` : '';
        return `<div class="post-card">
                <div class="post-header">
                    <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="showUserMenu(event, '${p.user_id}')">
                        <div class="avatar-wrapper post-avatar-wrapper">
                            <img src="${getImageUrl(p.profiles?.avatar_url) || defaultAvatarUrl}" class="post-avatar" onerror="this.onerror=null;this.src='icon-192.png'">
                            ${authorFxImg}
                        </div>
                        <b>${escapeHTML(p.profiles?.username || '匿名')}</b>
                    </div>
                    ${editActions}
                </div>
                <div style="white-space:pre-wrap;">${postContent}</div>
                ${postImg ? `<img src="${postImg}" class="post-image" loading="lazy" onerror="this.style.display='none'">` : ''}
                <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                    <span style="cursor:pointer; color:${hasLiked ? '#1877f2' : '#65676b'}" onclick="handleLike('${p.id}', ${p.likes||0}, ${hasLiked})">
                        ${hasLiked ? '❤️' : '🤍'} ${p.likes||0}
                    </span>
                </div>
                <div class="comment-area">
                    ${commentsHtml}
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <input type="text" id="comment-in-${p.id}" placeholder="寫留言..." style="padding:8px; margin:0; font-size:12px;">
                        <button style="width:50px; padding:5px; font-size:11px; background:var(--fb-blue); color:white; border-radius:5px; border:none;" onclick="addComment('${p.id}')">送出</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

async function handleCreatePost() {
    const content = document.getElementById('post-content').value.trim();
    const file = document.getElementById('post-file').files[0];
    if (!content && !file) return;
    let imageUrl = null;
    if (file) {
        const path = `posts/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${file.name.split('.').pop()}`;
        await supabaseClient.storage.from('avatars').upload(path, file);
        imageUrl = path;
    }
    await supabaseClient.from('posts').insert([{ content, user_id: currentUser.id, image_url: imageUrl }]);
    document.getElementById('post-content').value = '';
    document.getElementById('post-file').value = '';
    fetchPosts();
}

async function handleLike(postId, count, hasLiked) {
    try {
        if (hasLiked) {
            await supabaseClient.from('post_likes').delete().match({ user_id: currentUser.id, post_id: postId });
            await supabaseClient.from('posts').update({ likes: Math.max(0, count - 1) }).eq('id', postId);
        } else {
            await supabaseClient.from('post_likes').insert([{ user_id: currentUser.id, post_id: postId }]);
            await supabaseClient.from('posts').update({ likes: count + 1 }).eq('id', postId);
        }
        await fetchPosts();
    } catch (err) {
        console.error('點讚錯誤:', err);
    }
}

async function addComment(postId) {
    const val = document.getElementById(`comment-in-${postId}`).value.trim();
    if (!val) return;
    await supabaseClient.from('comments').insert([{ post_id: postId, user_id: currentUser.id, content: val }]);
    fetchPosts();
}

async function deletePost(id) {
    if (confirm('刪除貼文？')) {
        await supabaseClient.from('posts').delete().eq('id', id);
        fetchPosts();
    }
}

async function deleteComment(id) {
    if (confirm('刪除留言？')) {
        await supabaseClient.from('comments').delete().eq('id', id);
        fetchPosts();
    }
}

async function editPost(id, oldContent) {
    const n = prompt('編輯貼文：', oldContent);
    if (n !== null && n.trim() !== '') {
        await supabaseClient.from('posts').update({ content: n.trim() }).eq('id', id);
        fetchPosts();
    }
}

async function editComment(id, oldContent) {
    const newContent = prompt('編輯留言：', oldContent);
    if (newContent !== null && newContent.trim() !== '') {
        await supabaseClient.from('comments').update({ content: newContent.trim() }).eq('id', id);
        fetchPosts();
    }
}
