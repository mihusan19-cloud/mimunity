function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(tag) {
        const chars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return chars[tag] || tag;
    });
}

function linkify(text) {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        let displayUrl = url;
        try { displayUrl = decodeURIComponent(url); } catch (e) { displayUrl = url; }
        return `<a href="${url}" target="_blank" class="auto-link">${displayUrl}</a>`;
    });
}

function getImageUrl(path, forceRefresh = false) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const url = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
    return forceRefresh ? `${url}?t=${Date.now()}` : url;
}

function scrollToBottom() {
    const box = document.getElementById('chat-box');
    if (box) {
        requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
    }
}
