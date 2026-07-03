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

function showAuthMessage(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = message || '';
    el.style.display = message ? 'block' : 'none';
}

function getAuthErrorMessage(error) {
    const message = error?.message || '';
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials')) return '登入失敗：Email 或密碼不正確。';
    if (lower.includes('email not confirmed')) return '此帳號尚未完成 Email 驗證，請先到信箱完成驗證。';
    if (lower.includes('email rate limit')) return '嘗試太頻繁，請稍後再試。';
    if (lower.includes('password')) return '密碼格式或內容不正確，請重新確認。';
    return message || '登入失敗，請稍後再試。';
}

async function handleLogin() {
    showAuthMessage('login-error', '');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');

    if (!email || !password) {
        showAuthMessage('login-error', '請輸入 Email 和密碼。');
        return;
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerText = '登入中...';
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerText = '登入';
    }

    if (error) {
        console.error('Login error:', error);
        showAuthMessage('login-error', getAuthErrorMessage(error));
    }
}

async function handleSignUp() {
    showAuthMessage('register-error', '');
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!email || !password) {
        showAuthMessage('register-error', '請輸入 Email 和密碼。');
        return;
    }

    const { error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error('Sign up error:', error);
        showAuthMessage('register-error', getAuthErrorMessage(error));
        return;
    }

    alert('註冊完成，請確認是否需要到信箱完成驗證。');
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
}
