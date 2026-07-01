async function loadFriendNotebooks() {
    if (!notebookTarget) {
        document.getElementById('notebook-friend-label').innerText = '請從好友列表打開記事本';
        document.getElementById('notebook-list').innerHTML = '<div style="color:#777;">尚未選擇好友記事本。</div>';
        document.getElementById('notebook-editor').style.display = 'none';
        return;
    }

    const { data: friend, error: friendError } = await supabaseClient.from('profiles').select('username').eq('id', notebookTarget).single();
    if (friendError) return console.error('loadFriendNotebooks friend error:', friendError);
    document.getElementById('notebook-friend-label').innerText = `好友：${friend.username || '匿名'} 的記事本`;

    const { data: notebooks, error } = await supabaseClient.from('notebooks')
        .select('*')
        .or(`and(owner_id.eq.${currentUser.id},friend_id.eq.${notebookTarget}),and(owner_id.eq.${notebookTarget},friend_id.eq.${currentUser.id})`)
        .order('updated_at', { ascending: false });
    if (error) return console.error('loadFriendNotebooks error:', error);

    const listHtml = (notebooks || []).map(nb => `
        <div class="post-card" style="border-color:#ccc;">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
                <div>
                    <div style="font-weight:bold;">${escapeHTML(nb.title || '未命名記事')}</div>
                    <div style="font-size:12px; color:#666;">${nb.type === 'table' ? '表格記事' : '文字記事'} · 最近編輯 ${new Date(nb.updated_at).toLocaleString()}</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-primary" style="width:auto; padding:8px 12px;" onclick="openNotebook('${nb.id}')">打開</button>
                    <button class="btn-primary" style="width:auto; padding:8px 12px; background:#8e8e8e;" onclick="deleteNotebook('${nb.id}')">刪除</button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('notebook-list').innerHTML = listHtml || '<div style="color:#777;">目前還沒有記事本，請按上方按鈕新增。</div>';
    if (currentNotebookId) {
        openNotebook(currentNotebookId);
    } else {
        document.getElementById('notebook-editor').style.display = 'none';
    }
}

async function openFriendNotebook(friendId) {
    notebookTarget = friendId;
    currentNotebookId = null;
    showPage('notebook');
}

function createNewNotebook(type) {
    if (!notebookTarget) return alert('請先從好友列表打開好友記事本。');
    currentNotebookId = null;
    document.getElementById('notebook-title').value = '';
    document.getElementById('notebook-content').value = '';
    document.getElementById('notebook-type-controls').innerText = type === 'table' ? '表格大小：' : '文字內容';
    document.getElementById('notebook-text-area').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('notebook-table-area').style.display = type === 'table' ? 'block' : 'none';
    document.getElementById('notebook-table-editor').innerHTML = '';
    document.getElementById('notebook-editor').style.display = 'block';
    document.getElementById('notebook-editor').dataset.type = type;
}

function closeNotebookEditor() {
    currentNotebookId = null;
    document.getElementById('notebook-editor').style.display = 'none';
}

function buildNotebookTable() {
    const rows = Number(document.getElementById('notebook-table-rows').value) || 1;
    const cols = Number(document.getElementById('notebook-table-cols').value) || 1;
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            const td = document.createElement('td');
            td.contentEditable = 'true';
            td.style.border = '1px solid #ddd';
            td.style.padding = '8px';
            td.style.minWidth = '60px';
            td.innerText = '';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    const editor = document.getElementById('notebook-table-editor');
    editor.innerHTML = '';
    editor.appendChild(table);
}

async function saveNotebook() {
    const title = document.getElementById('notebook-title').value.trim();
    const type = document.getElementById('notebook-editor').dataset.type;
    const content = type === 'text' ? document.getElementById('notebook-content').value : '';
    let table = null;
    if (type === 'table') {
        const rows = Array.from(document.querySelectorAll('#notebook-table-editor tr')).map(tr =>
            Array.from(tr.children).map(td => td.innerText)
        );
        table = rows;
    }
    if (!notebookTarget) return alert('沒有選擇好友記事本。');
    if (!title) return alert('請輸入記事本標題。');

    const payload = {
        owner_id: currentUser.id,
        friend_id: notebookTarget,
        title,
        type,
        content,
        table_data: table,
        updated_at: new Date().toISOString()
    };

    if (currentNotebookId) {
        await supabaseClient.from('notebooks').update(payload).eq('id', currentNotebookId);
    } else {
        payload.created_at = new Date().toISOString();
        const { error } = await supabaseClient.from('notebooks').insert([payload]);
        if (error) return console.error('saveNotebook error:', error);
    }
    closeNotebookEditor();
    loadFriendNotebooks();
}

async function openNotebook(id) {
    currentNotebookId = id;
    const { data: note, error } = await supabaseClient.from('notebooks').select('*').eq('id', id).single();
    if (error || !note) return console.error('openNotebook error:', error);
    document.getElementById('notebook-title').value = note.title || '';
    document.getElementById('notebook-editor').style.display = 'block';
    document.getElementById('notebook-editor').dataset.type = note.type;
    document.getElementById('notebook-type-controls').innerText = note.type === 'table' ? '表格大小：' : '文字內容';
    document.getElementById('notebook-text-area').style.display = note.type === 'text' ? 'block' : 'none';
    document.getElementById('notebook-table-area').style.display = note.type === 'table' ? 'block' : 'none';
    document.getElementById('notebook-content').value = note.content || '';
    if (note.type === 'table') {
        const editor = document.getElementById('notebook-table-editor');
        editor.innerHTML = '';
        const rows = note.table_data || [[]];
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.contentEditable = 'true';
                td.style.border = '1px solid #ddd';
                td.style.padding = '8px';
                td.style.minWidth = '60px';
                td.innerText = cell;
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        editor.appendChild(table);
    }
}

async function deleteNotebook(id) {
    if (!confirm('確定刪除這則記事嗎？')) return;
    await supabaseClient.from('notebooks').delete().eq('id', id);
    if (currentNotebookId === id) {
        currentNotebookId = null;
        document.getElementById('notebook-editor').style.display = 'none';
    }
    loadFriendNotebooks();
}
