async function onUserLoginSuccess(session) {
    currentUser = session.user;
    document.getElementById('main-nav').style.display = 'flex';
    showPage('home');
    await loadUserInfo();
    setupPresence();
    setupRealtime();
    if (typeof loadLocalHighScore === 'function') loadLocalHighScore();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth Event:', event);
    if (session) {
        onUserLoginSuccess(session);
        if ('Notification' in window) updateNotifBtn(Notification.permission);
    } else {
        currentUser = null;
        document.getElementById('main-nav').style.display = 'none';
        showPage('login');
    }
});

window.addEventListener('load', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        onUserLoginSuccess(session);
    }
    if ('Notification' in window) updateNotifBtn(Notification.permission);
});

async function handleLogin() {
    await supabaseClient.auth.signInWithPassword({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    });
}

async function handleSignUp() {
    await supabaseClient.auth.signUp({
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    });
    alert('請收信！');
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
}
