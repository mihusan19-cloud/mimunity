function showPage(p) {
    if (p !== 'profile') viewingUserId = null;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    const targetPage = document.getElementById('page-' + p);
    if (!targetPage) return;
    targetPage.classList.add('active');
    if (document.getElementById('nav-' + p)) document.getElementById('nav-' + p).classList.add('active');

    if (p === 'home' && document.getElementById('posts-list').innerHTML === '') fetchPosts();
    if (p === 'chat' && document.getElementById('chat-box').innerHTML === '') { fetchUserList(); fetchMessages(); }
    if (p === 'profile') loadProfileData();
    if (p === 'avatarfx') initAvatarFx();
}

function showUserMenu(e, userId) {
    e.stopPropagation();
    const menu = document.getElementById('user-action-menu');
    if (!menu) return;
    menu.style.display = 'block';
    menu.style.top = e.pageY + 'px';
    menu.style.left = e.pageX + 'px';
    document.getElementById('menu-view-profile').onclick = () => { viewingUserId = userId; showPage('profile'); };
    document.getElementById('menu-start-chat').onclick = () => { openChat(userId); };
}

function hideUserMenu() {
    const menu = document.getElementById('user-action-menu');
    if (menu) menu.style.display = 'none';
}

function openChat(targetId) {
    chatTarget = targetId;
    showPage('chat');
    fetchMessages();
}

function closeModal() {
    const modal = document.getElementById('result-modal');
    if (modal) modal.style.display = 'none';
}
