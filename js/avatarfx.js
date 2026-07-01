async function initAvatarFx() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient.from('profiles').select('avatar_url, avatar_fx').eq('id', currentUser.id).single();
    if (!data || error) return;
    const avatar = document.getElementById('fx-preview-avatar');
    if (avatar) {
        avatar.src = getImageUrl(data.avatar_url) || 'https://via.placeholder.com/80';
    }
    selectedFx = data.avatar_fx || '';
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
    fx.src = selectedFx || '';
    fx.style.display = selectedFx ? 'block' : 'none';
}

async function saveAvatarFx() {
    await supabaseClient.from('profiles').update({ avatar_fx: selectedFx }).eq('id', currentUser.id);
    alert('特效已套用！');
}
