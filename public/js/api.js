import { state } from './state.js';
import { DOM } from './dom.js';

export function updateSyncUI(status, message) {
    const syncStatusEl = DOM.syncStatusEl;
    if (!syncStatusEl) return;
    const icon = syncStatusEl.querySelector('i');
    const text = syncStatusEl.querySelector('span');
    
    syncStatusEl.className = 'sync-status ' + (status || '');
    text.textContent = (status === 'saving' || status === 'saved' || status === 'error') ? message : '저장됨';
    
    if (status === 'saving') {
        icon.className = 'fa-solid fa-cloud fa-spin';
    } else if (status === 'saved') {
        icon.className = 'fa-solid fa-check-circle';
    } else if (status === 'error') {
        icon.className = 'fa-solid fa-exclamation-circle';
    } else {
        icon.className = 'fa-solid fa-cloud';
    }
}

export async function syncData() {
    updateSyncUI('saving', '저장 중...');
    console.log("Syncing data to server...", { itemsCount: state.items.length });
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usersDB: state.usersDB, 
                categories: state.categories, 
                items: state.items, 
                newsData: state.newsData, 
                boardData: state.boardData, 
                shortcuts: state.shortcuts 
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`서버 저장 실패 (상태코드: ${response.status}): ${errText}`);
        }
        
        console.log("Data synced successfully.");
        updateSyncUI('saved', '저장 완료');
        setTimeout(() => {
            updateSyncUI('', '저장됨');
        }, 2000);
        return true;
    } catch (e) {
        console.error("데이터 동기화 실패:", e);
        updateSyncUI('error', '저장 실패');
        alert(`⚠️ 데이터 저장에 실패했습니다.\n\n사유: ${e.message}`);
        return false;
    }
}

export async function fetchMeta(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`, {
        signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error('Network response was not ok');
    return await resp.json();
}
