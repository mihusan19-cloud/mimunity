async function initAvatarFx() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient.from('profiles').select('avatar_url, avatar_fx').eq('id', currentUser.id).single();
    if (!data || error) return;
    const avatar = document.getElementById('fx-preview-avatar');
    if (avatar) {
        avatar.src = getImageUrl(data.avatar_url) || 'https://via.placeholder.com/80';
    }
    selectedFx = data.avatar_fx || '';
    document.querySelectorAll('.fx-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.fx === selectedFx);
    });
    updateFxPreview();
}

document.addEventListener('click', (e) => {
    const item = e.target.closest('.fx-item');
    if (!item) return;
    document.querySelectorAll('.fx-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
    selectedFx = item.dataset.fx;
    updateFxPreview();
});

function updateFxPreview() {
    const fx = document.getElementById('fx-preview-effect');
    if (!fx) return;
    if (!selectedFx) {
        fx.style.display = 'none';
        fx.classList.remove('avatar-decoration-image');
        fx.src = '';
        return;
    }
    fx.className = 'avatar-decoration avatar-decoration-image';
    fx.src = selectedFx;
    fx.style.display = 'block';
}

async function saveAvatarFx() {
    await supabaseClient.from('profiles').update({ avatar_fx: selectedFx || null }).eq('id', currentUser.id);
    alert('特效已套用！');
}
