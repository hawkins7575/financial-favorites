import { state, editors } from './state.js';
import { DOM } from './dom.js';
import { syncData, fetchMeta } from './api.js';
import { updateAuthUI } from './auth.js';

export function initEditors() {
    const quillOptions = {
        theme: 'snow',
        placeholder: '여기에 내용을 작성하거나 사진을 붙여넣으세요...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image'],
                ['clean']
            ]
        }
    };

    if (document.getElementById('editor-container')) {
        editors.quill = new Quill('#editor-container', quillOptions);
    }
    if (document.getElementById('boardEditor')) {
        editors.boardQuill = new Quill('#boardEditor', quillOptions);
    }
}

export function closeAllModals(pushState = true) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    if (pushState) history.pushState({ type: 'home' }, '', '/');
}
const closeModal = () => closeAllModals();

// Custom Confirmation Modal Logic
let currentConfirmCallback = null;
function confirmAction(title, desc, onConfirm) {
    if (DOM.confirmTitle) DOM.confirmTitle.textContent = title;
    if (DOM.confirmDesc) DOM.confirmDesc.textContent = desc;
    currentConfirmCallback = onConfirm;
    DOM.confirmModal.classList.add('active');
}

// ================= CRUD (window hooks for inline events) ================= //
window.addItem = async (item) => { 
    if (!state.currentUser) return alert('로그인이 필요합니다.');
    if (!item.title || !item.url) return alert('제목과 URL은 필수입니다.');
    
    item.id = Date.now(); 
    item.userId = state.currentUser.username; 
    state.items.unshift(item); 
    
    const success = await syncData(); 
    if (success) {
        closeModal(); 
        renderCards(); 
        alert('새 항목이 성공적으로 저장되었습니다!');
    }
};

window.editItem = (id) => {
    const item = state.items.find(i => i.id === Number(id));
    if (item) {
        document.getElementById('itemId').value = item.id;
        document.getElementById('title').value = item.title;
        document.getElementById('url').value = item.url;
        document.getElementById('description').value = item.description;
        DOM.formCategory.value = item.category || '';
        updateFormSubCategories();
        
        if (item.subCategory) {
            const subCats = Array.isArray(item.subCategory) ? item.subCategory : [item.subCategory];
            subCats.forEach(scId => {
                const cb = DOM.formSubCategoryCheckboxes.querySelector(`input[value="${scId}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (DOM.formType) DOM.formType.value = item.type || 'website';
        if (DOM.isPremiumInput) DOM.isPremiumInput.checked = !!item.isPremium;
        DOM.modalTitle.textContent = '항목 수정';
        DOM.modal.classList.add('active');
    }
};

window.updateItem = async (id, updatedItem) => {
    const index = state.items.findIndex(i => i.id === Number(id));
    if (index !== -1) { 
        updatedItem.userId = state.items[index].userId; 
        state.items[index] = { ...state.items[index], ...updatedItem }; 
        
        const success = await syncData(); 
        if (success) {
            closeModal(); 
            renderCards(); 
            alert('수정이 완료되었습니다!');
        }
    }
};

window.deleteItem = async (id) => {
    confirmAction('즐겨찾기 삭제', '이 즐겨찾기를 삭제하시겠습니까?', async () => {
        state.items = state.items.filter(i => i.id !== Number(id)); 
        await syncData(); 
        renderCards(); 
    });
};

window.deleteNews = async (id) => {
    confirmAction('뉴스 삭제', '이 뉴스를 삭제하시겠습니까?', async () => {
        state.newsData = state.newsData.filter(n => n.id !== Number(id));
        await syncData();
        renderNews();
    });
};

window.editNews = (id) => {
    const news = state.newsData.find(n => n.id === Number(id));
    if (news) {
        if (DOM.newsIdInput) DOM.newsIdInput.value = news.id;
        if (DOM.newsTitleInput) DOM.newsTitleInput.value = news.title;
        if (editors.quill) editors.quill.root.innerHTML = news.content || news.desc || '';
        DOM.newsModalTitle.textContent = '뉴스 수정';
        DOM.newsModal.classList.add('active');
    }
};

window.deleteBoard = async (id) => {
    confirmAction('게시글 삭제', '이 추천글을 삭제하시겠습니까?', async () => {
        state.boardData = state.boardData.filter(b => b.id !== Number(id));
        await syncData();
        renderBoard();
    });
};

window.deleteCategory = async (id) => {
    confirmAction('대분류 삭제', `[${id}] 대분류를 삭제하시겠습니까? (소속된 항목들은 미분류로 처리됩니다)`, async () => {
        state.categories = state.categories.filter(c => c.id !== id);
        state.items.forEach(i => { if (i.category === id) { i.category = 'etc'; i.subCategory = []; } });
        if (!state.categories.find(c => c.id === 'etc')) state.categories.push({id:'etc', name:'미분류', subCategories:[]});
        await syncData();
        if(state.currentCategory === id) state.currentCategory = 'all';
        renderCategoryManager(); renderCategoryFilters(); renderFormCategories(); renderCards();
    });
};

window.addSubCategory = async (catId) => {
    const idInput = document.getElementById(`addScId_${catId}`);
    const nameInput = document.getElementById(`addScName_${catId}`);
    if (!idInput.value.trim() || !nameInput.value.trim()) return alert('ID와 이름을 모두 입력해주세요.');
    const cat = state.categories.find(c => c.id === catId);
    if (cat.subCategories.find(s => s.id === idInput.value.trim())) return alert('이미 존재하는 소분류 ID입니다.');
    cat.subCategories.push({id: idInput.value.trim(), name: nameInput.value.trim()});
    await syncData(); 
    renderCategoryManager(); renderSubCategoryFilters(); renderFormCategories();
};

window.deleteSubCategory = async (catId, scId) => {
    confirmAction('소분류 삭제', `[${scId}] 소분류를 삭제하시겠습니까?`, async () => {
        const cat = state.categories.find(c => c.id === catId);
        if (cat) {
            cat.subCategories = cat.subCategories.filter(sc => sc.id !== scId);
            state.items.forEach(i => { 
                if (i.category === catId) {
                    if (Array.isArray(i.subCategory)) {
                        i.subCategory = i.subCategory.filter(s => s !== scId);
                    } else if (i.subCategory === scId) {
                        i.subCategory = [];
                    }
                }
            });
            await syncData();
            if(Array.isArray(state.currentSubCategory)) {
                state.currentSubCategory = state.currentSubCategory.filter(s => s !== scId);
                if (state.currentSubCategory.length === 0) state.currentSubCategory = ['all'];
            }
            renderCategoryManager(); renderSubCategoryFilters(); renderFormCategories(); renderCards();
        }
    });
};

function moveInArray(array, index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= array.length) return;
    const temp = array[index];
    array[index] = array[newIndex];
    array[newIndex] = temp;
}

window.moveCategory = async (index, direction) => {
    moveInArray(state.categories, index, direction);
    await syncData();
    renderCategoryManager(); renderCategoryFilters(); renderFormCategories();
};

window.moveSubCategory = async (catId, scIndex, direction) => {
    const cat = state.categories.find(c => c.id === catId);
    if (cat) {
        moveInArray(cat.subCategories, scIndex, direction);
        await syncData();
        renderCategoryManager(); renderSubCategoryFilters(); renderFormCategories();
    }
};

window.editShortcut = (id) => {
    const item = state.shortcuts.find(s => s.id === id);
    if (item) {
        document.getElementById('shortcutId').value = item.id;
        document.getElementById('shortcutTitle').value = item.title;
        document.getElementById('shortcutUrl').value = item.url;
        DOM.shortcutModalTitle.textContent = '바로가기 수정';
        DOM.shortcutModal.classList.add('active');
    }
};

window.deleteShortcut = async (id) => {
    confirmAction('바로가기 삭제', '이 바로가기를 삭제하시겠습니까?', async () => {
        state.shortcuts = state.shortcuts.filter(s => s.id !== Number(id));
        await syncData();
        renderShortcuts();
    });
};

// ================= RENDERERS ================= //
const categoryIcons = {
    'all': 'fa-solid fa-layer-group',
    'stock': 'fa-solid fa-chart-line',
    'coin': 'fa-brands fa-bitcoin',
    'bond': 'fa-solid fa-file-invoice-dollar',
    'insurance': 'fa-solid fa-shield-halved',
    'finance': 'fa-solid fa-building-columns',
    'economy': 'fa-solid fa-earth-asia'
};

export function renderCategoryFilters() {
    DOM.catContainer.innerHTML = `
        <button class="filter-btn ${state.currentCategory === 'all' ? 'active' : ''}" data-filter="all">
            <i class="${categoryIcons['all'] || 'fa-solid fa-folder'}"></i>
            <span>전체</span>
        </button>`;
        
    state.categories.forEach(c => {
        const iconClass = categoryIcons[c.id] || 'fa-solid fa-folder';
        DOM.catContainer.innerHTML += `
            <button class="filter-btn ${state.currentCategory === c.id ? 'active' : ''}" data-filter="${c.id}">
                <i class="${iconClass}"></i>
                <span>${c.name}</span>
            </button>`;
    });

    DOM.catContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentCategory = btn.dataset.filter;
            state.currentSubCategory = ['all'];
            renderCategoryFilters();
            renderSubCategoryFilters();
            renderCards();
        });
    });

    if (DOM.currentCategoryTitle) DOM.currentCategoryTitle.style.display = 'none';
    renderSubCategoryFilters();
}

export function renderSubCategoryFilters() {
    if (!DOM.subCatContainer) return;
    
    if (state.currentCategory === 'all') {
        DOM.subCatContainer.style.display = 'none';
        return;
    }
    const cat = state.categories.find(c => c.id === state.currentCategory);
    if (!cat || !cat.subCategories || cat.subCategories.length === 0) {
        DOM.subCatContainer.style.display = 'none';
        return;
    }

    DOM.subCatContainer.style.display = 'flex';
    DOM.subCatContainer.innerHTML = `<button class="sub-filter-btn ${state.currentSubCategory.includes('all') ? 'active' : ''}" data-subfilter="all">전체</button>`;
    cat.subCategories.forEach(sc => {
        DOM.subCatContainer.innerHTML += `<button class="sub-filter-btn ${state.currentSubCategory.includes(sc.id) ? 'active' : ''}" data-subfilter="${sc.id}">${sc.name}</button>`;
    });

    DOM.subCatContainer.querySelectorAll('.sub-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.subfilter;
            if (filter === 'all') {
                state.currentSubCategory = ['all'];
            } else {
                if (state.currentSubCategory.includes('all')) state.currentSubCategory = [];
                if (state.currentSubCategory.includes(filter)) {
                    state.currentSubCategory = state.currentSubCategory.filter(f => f !== filter);
                    if (state.currentSubCategory.length === 0) state.currentSubCategory = ['all'];
                } else {
                    state.currentSubCategory.push(filter);
                }
            }
            renderSubCategoryFilters();
            renderCards();
        });
    });
}

export function updateFormSubCategories() {
    const catId = DOM.formCategory.value;
    const cat = state.categories.find(c => c.id === catId);
    
    if (DOM.formSubCategoryCheckboxes) {
        DOM.formSubCategoryCheckboxes.innerHTML = '';
        if (cat && cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach(sc => {
                const item = document.createElement('label');
                item.className = 'checkbox-item';
                item.innerHTML = `
                    <input type="checkbox" name="subCategory" value="${sc.id}">
                    <span>${sc.name}</span>
                `;
                DOM.formSubCategoryCheckboxes.appendChild(item);
            });
        } else {
            DOM.formSubCategoryCheckboxes.innerHTML = '<div style="font-size:0.8rem; color:var(--on-surface-variant); opacity:0.5; padding:0.5rem;">하위 분류 없음</div>';
        }
    }
}

export function renderFormCategories() {
    DOM.formCategory.innerHTML = '';
    state.categories.forEach(c => {
        DOM.formCategory.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
    updateFormSubCategories();
}

export function renderCards() {
    DOM.grid.innerHTML = '';
    let filteredData = state.items;
    if (!state.currentUser) filteredData = filteredData.filter(i => i.userId === 'admin');
    else if (state.currentUser.role === 'user') filteredData = filteredData.filter(i => i.userId === 'admin' || i.userId === state.currentUser.username);

    filteredData = filteredData.filter(i => {
        const catMatch = state.currentCategory === 'all' || i.category === state.currentCategory;
        const subCatMatch = state.currentSubCategory.includes('all') || (Array.isArray(i.subCategory) ? i.subCategory : [i.subCategory]).some(sc => state.currentSubCategory.includes(sc));
        const typeMatch = state.currentType === 'all' || i.type === state.currentType;
        const searchMatch = !state.currentSearchQuery || i.title.toLowerCase().includes(state.currentSearchQuery) || (i.description && i.description.toLowerCase().includes(state.currentSearchQuery));
        return catMatch && subCatMatch && typeMatch && searchMatch;
    });

    if (DOM.itemsCountEl) DOM.itemsCountEl.textContent = filteredData.length;

    filteredData.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = `card ${item.category} ${item.isPremium ? 'premium' : ''}`;
        card.style.animationDelay = `${Math.min(index * 0.05, 0.3)}s`;

        const pCat = state.categories.find(c => c.id === item.category);
        const subCats = (Array.isArray(item.subCategory) ? item.subCategory : [item.subCategory]).filter(Boolean);
        const subCatLabel = (pCat && subCats.length > 0) ? ` > ${subCats.map(id => pCat.subCategories.find(sc => sc.id === id)?.name).filter(Boolean).join(', ')}` : '';
        const domain = new URL(item.url || 'http://example.com').hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        let actionsHtml = '';
        if (state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.username === item.userId)) {
            actionsHtml = `<div class="card-actions" onclick="event.preventDefault(); event.stopPropagation();">
                <button class="card-action-btn edit" onclick="window.editItem(${item.id});"><i class="fa-solid fa-pen"></i></button>
                <button class="card-action-btn delete" onclick="window.deleteItem(${item.id});"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        }

        const typeIcon = item.type === 'youtube' ? 'fa-brands fa-youtube" style="color:#ff0000' : 'fa-solid fa-globe';
        const typeLabel = item.type === 'youtube' ? 'YouTube' : 'Website';

        card.innerHTML = `
            ${item.isPremium ? '<div class="premium-badge"><i class="fa-solid fa-crown"></i></div>' : ''}
            ${actionsHtml}
            <a href="${item.url}" target="_blank" class="card-link">
                <div class="card-header">
                    <div class="card-icon"><img src="${faviconUrl}" alt="${item.title}" loading="lazy"></div>
                    <h3 class="card-title">${item.title}</h3>
                </div>
                <div class="card-desc">${item.description}</div>
                <div class="card-badges">
                    <span class="badge badge-category">${(pCat?.name || item.category).toUpperCase()}${subCatLabel}</span>
                    <span class="badge badge-type"><span><i class="${typeIcon}"></i></span> ${typeLabel}</span>
                    ${(item.userId && item.userId !== 'admin') ? '<span class="badge" style="background:#e3f2fd; color:#0d47a1;"><i class="fa-solid fa-user"></i> 나의 즐겨찾기</span>' : ''}
                </div>
            </a>`;
        DOM.grid.appendChild(card);
    });
}

function renderCategoryManager() {
    DOM.categoryManagerList.innerHTML = '';
    state.categories.forEach((cat, index) => {
        let scHtml = '';
        cat.subCategories.forEach((sc, scIndex) => {
            const upBtn = scIndex > 0 ? `<button onclick="window.moveSubCategory('${cat.id}', ${scIndex}, -1)" style="background:none; border:none; color:var(--primary); cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-up"></i></button>` : '';
            const downBtn = scIndex < cat.subCategories.length - 1 ? `<button onclick="window.moveSubCategory('${cat.id}', ${scIndex}, 1)" style="background:none; border:none; color:var(--primary); cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-down"></i></button>` : '';
            scHtml += `
                <div style="display:flex; justify-content:space-between; padding:0.5rem; background:var(--surface-container-low); border-radius:4px; margin-top:0.5rem; align-items:center;">
                    <span style="font-size:0.9rem; font-family:'Pretendard Variable', sans-serif;">- ${sc.name} <small style="color:var(--on-surface-variant);">(${sc.id})</small></span>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        ${upBtn}${downBtn}
                        <button onclick="window.deleteSubCategory('${cat.id}', '${sc.id}')" style="background:none; border:none; color:#D32F2F; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                    </div>
                </div>`;
        });

        const catUpBtn = index > 0 ? `<button onclick="window.moveCategory(${index}, -1)" class="action-btn" style="background:var(--surface-container-high); color:var(--primary); padding:0.4rem; font-size:0.8rem; border-radius:4px; margin-right:4px;"><i class="fa-solid fa-arrow-up"></i></button>` : '';
        const catDownBtn = index < state.categories.length - 1 ? `<button onclick="window.moveCategory(${index}, 1)" class="action-btn" style="background:var(--surface-container-high); color:var(--primary); padding:0.4rem; font-size:0.8rem; border-radius:4px; margin-right:4px;"><i class="fa-solid fa-arrow-down"></i></button>` : '';

        DOM.categoryManagerList.innerHTML += `
            <div style="border: 1px solid var(--surface-container-low); border-radius: 8px; padding: 1.5rem; background:var(--surface-container-lowest);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <div style="display:flex; align-items:center;">
                        <strong style="font-size:1.1rem; color:var(--primary); font-family:'Pretendard Variable', sans-serif; margin-right:1rem;">${cat.name} <small style="color:var(--on-surface-variant); font-weight:normal;">(${cat.id})</small></strong>
                        ${catUpBtn}${catDownBtn}
                    </div>
                    <button onclick="window.deleteCategory('${cat.id}')" class="action-btn" style="background:#D32F2F; padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:4px;">대분류 삭제</button>
                </div>
                <div>${scHtml}</div>
                <div style="display:flex; gap:0.5rem; margin-top:1rem; align-items:center;">
                    <input type="text" id="addScId_${cat.id}" placeholder="하위 ID" style="flex:1; border:none; border-bottom:var(--ghost-border); padding:0.5rem; font-family:'Pretendard Variable'; background:transparent; outline:none; font-size: 0.85rem;">
                    <input type="text" id="addScName_${cat.id}" placeholder="하위 이름" style="flex:1; border:none; border-bottom:var(--ghost-border); padding:0.5rem; font-family:'Pretendard Variable'; background:transparent; outline:none; font-size: 0.85rem;">
                    <button onclick="window.addSubCategory('${cat.id}')" class="action-btn" style="padding:0.5rem 1rem; font-size:0.85rem; border-radius:4px;">소분류 추가</button>
                </div>
            </div>
        `;
    });
}

export function updateJSONLD(type, item) {
    let script = document.getElementById('dynamic-json-ld');
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'dynamic-json-ld';
        document.head.appendChild(script);
    }
    
    const ld = {
        "@context": "https://schema.org",
        "@type": type === 'news' ? 'NewsArticle' : 'Article',
        "headline": item.title,
        "datePublished": new Date(item.timestamp).toISOString(),
        "author": {
            "@type": "Person",
            "name": item.author || "MY MONEY Team"
        }
    };
    script.textContent = JSON.stringify(ld);
}

export function openNewsModal(news) {
    const dateStr = new Date(news.timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const displayContent = news.content || news.desc || '내용이 없습니다.';
    DOM.readNewsTitle.textContent = news.title;
    DOM.readNewsDate.textContent = dateStr;
    DOM.readNewsContent.innerHTML = displayContent;
    DOM.newsReadModal.classList.add('active');
    
    history.pushState({ type: 'news', id: news.id }, '', `/?view=news&id=${news.id}`);
    updateJSONLD('news', news);
}

export function renderNews() {
    if (!DOM.newsFeedSection || !DOM.newsGrid) return;
    if (!state.newsData || state.newsData.length === 0) { DOM.newsFeedSection.style.display = 'none'; return; }
    DOM.newsFeedSection.style.display = 'block';
    DOM.newsGrid.innerHTML = '';
    
    [...state.newsData].reverse().slice(0, 3).forEach(news => {
        const dateStr = new Date(news.timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
        const firstImg = /<img.*?src=["'](.*?)["']/.exec(news.content || news.desc || '');
        const thumbHtml = firstImg ? `<div class="news-card-thumb"><img src="${firstImg[1]}" alt="news" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'thumb-placeholder\'><i class=\'fas fa-newspaper\'></i></div>'"></div>` : '';
        
        const card = document.createElement('article');
        card.className = 'news-card';
        card.onclick = () => (news.url && !news.content) ? window.open(news.url, '_blank') : openNewsModal(news);
        card.innerHTML = `
            <div class="news-date">${dateStr}</div>
            <h3 class="news-title">${news.title}</h3>
            ${thumbHtml}`;
        
        if (state.currentUser?.role === 'admin') {
            const actions = document.createElement('div');
            actions.className = 'news-card-actions'; 
            actions.innerHTML = `
                <button class="news-action-btn edit" onclick="window.editNews(${news.id}); event.stopPropagation();"><i class="fa-solid fa-pen"></i></button>
                <button class="news-action-btn delete" onclick="window.deleteNews(${news.id}); event.stopPropagation();"><i class="fa-solid fa-trash"></i></button>`;
            card.appendChild(actions);
        }
        DOM.newsGrid.appendChild(card);
    });
}

export function renderShortcuts() {
    if (!DOM.shortcutsGrid) return;
    DOM.shortcutsGrid.innerHTML = '';

    if (!state.shortcuts || state.shortcuts.length === 0) {
        DOM.shortcutsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--on-surface-variant);">등록된 바로가기가 없습니다.</div>';
        return;
    }

    state.shortcuts.forEach((item, index) => {
        let domain = '';
        try { domain = new URL(item.url).hostname; } 
        catch (e) { domain = '링크 바로가기'; }

        const card = document.createElement('div');
        card.className = 'shortcut-card-wrapper';
        card.style.animationDelay = `${index * 0.03}s`;

        let adminActions = '';
        if (state.currentUser && state.currentUser.role === 'admin') {
            adminActions = `
                <div class="card-actions">
                    <button class="shortcut-action-btn edit" onclick="window.editShortcut(${item.id}); event.preventDefault();">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="shortcut-action-btn delete" onclick="window.deleteShortcut(${item.id}); event.preventDefault();">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <a href="${item.url}" target="_blank" class="shortcut-card">
                ${adminActions}
                <div class="card-title">${item.title}</div>
                <div class="card-domain">${domain}</div>
            </a>
        `;
        DOM.shortcutsGrid.appendChild(card);
    });
}

export function openBoardModal(post) {
    const dateStr = new Date(post.timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    DOM.readBoardTitle.textContent = post.title;
    DOM.readBoardAuthor.textContent = post.author;
    DOM.readBoardDate.textContent = dateStr;
    DOM.readBoardContent.innerHTML = post.content;
    DOM.boardReadModal.classList.add('active');
    
    history.pushState({ type: 'board', id: post.id }, '', `/?view=board&id=${post.id}`);
    updateJSONLD('board', post);
}

function renderBoard() {
    DOM.boardGrid.innerHTML = '';
    if (!state.boardData || state.boardData.length === 0) {
        DOM.boardGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; opacity: 0.5;">아직 게시글이 없습니다.</div>';
        return;
    }

    [...state.boardData].reverse().forEach(post => {
        const dateStr = new Date(post.timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        const firstImg = /<img.*?src=["'](.*?)["']/.exec(post.content || '');
        const thumbHtml = firstImg ? `<div class="board-card-thumb"><img src="${firstImg[1]}" alt="board" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'thumb-placeholder\'><i class=\'fas fa-file-alt\'></i></div>'"></div>` : '';

        const card = document.createElement('article');
        card.className = 'board-card';
        card.onclick = () => openBoardModal(post);
        card.innerHTML = `
            ${thumbHtml}
            <div class="board-card-content">
                <h3 class="board-title">${post.title}</h3>
                <div class="board-meta">
                    <span class="board-author"><i class="fa-solid fa-user"></i> ${post.author}</span>
                    <span><i class="fa-solid fa-calendar-days"></i> ${dateStr}</span>
                </div>
            </div>`;

        if (state.currentUser && (state.currentUser.username === post.author || state.currentUser.role === 'admin')) {
            const actions = document.createElement('div');
            actions.className = 'board-card-actions';
            actions.onclick = (e) => e.stopPropagation(); 
            actions.innerHTML = `
                <button class="board-action-btn edit" onclick="window.editBoard(${post.id});"><i class="fa-solid fa-pen"></i></button>
                <button class="board-action-btn delete" onclick="window.deleteBoard(${post.id});"><i class="fa-solid fa-trash"></i></button>`;
            card.appendChild(actions);
        }
        DOM.boardGrid.appendChild(card);
    });
}

export function exportRenderShortcuts() { renderShortcuts(); }

export function setupUIEvents() {
    if (DOM.addBtn) {
        DOM.addBtn.addEventListener('click', () => {
            DOM.itemForm.reset(); document.getElementById('itemId').value = '';
            if (state.categories.length > 0) DOM.formCategory.value = state.categories[0].id;
            updateFormSubCategories();
            DOM.modalTitle.textContent = '새 항목 추가'; DOM.modal.classList.add('active');
        });
    }

    if (DOM.closeBtn) DOM.closeBtn.addEventListener('click', closeModal);

    if (DOM.itemForm) {
        DOM.itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('itemId').value;
            const itemData = {
                title: document.getElementById('title').value,
                url: document.getElementById('url').value,
                category: document.getElementById('category').value,
                subCategory: Array.from(DOM.formSubCategoryCheckboxes.querySelectorAll('input[name="subCategory"]:checked')).map(cb => cb.value),
                description: document.getElementById('description').value,
                isPremium: DOM.isPremiumInput ? DOM.isPremiumInput.checked : false
            };
            if (DOM.formType) itemData.type = DOM.formType.value;

            if (id) window.updateItem(parseInt(id), itemData);
            else window.addItem(itemData);
        });
    }

    DOM.formCategory.addEventListener('change', updateFormSubCategories);

    if(DOM.manageCategoryBtn) {
        DOM.manageCategoryBtn.addEventListener('click', () => { renderCategoryManager(); DOM.categoryModal.classList.add('active'); });
    }
    if (DOM.closeCategoryModal) DOM.closeCategoryModal.addEventListener('click', () => closeAllModals());

    DOM.addCategorySubmitBtn.addEventListener('click', async () => {
        const id = DOM.newCatId.value.trim();
        const name = DOM.newCatName.value.trim();
        if (!id || !name) return alert('ID와 이름을 입력하세요.');
        if (state.categories.find(c => c.id === id)) return alert('이미 존재하는 ID입니다.');
        state.categories.push({ id, name, subCategories: [] });
        DOM.newCatId.value = ''; DOM.newCatName.value = '';
        await syncData(); 
        renderCategoryManager(); renderCategoryFilters(); renderFormCategories();
    });

    [DOM.modal, DOM.categoryModal, DOM.authModal, DOM.newsModal, DOM.newsReadModal, DOM.boardModal, DOM.boardReadModal, DOM.shortcutModal].forEach(m => {
        if(m) m.addEventListener('click', (e) => { if (e.target === m) closeAllModals(); });
    });

    DOM.topMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleViewSwitch(item.getAttribute('data-view'), item);
        });
    });

    DOM.sidebarNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleViewSwitch(item.getAttribute('data-view'), item);
            if (window.innerWidth <= 1024) {
                DOM.sidebar.classList.remove('active');
                DOM.sidebarOverlay.classList.remove('active');
            }
        });
    });

    function handleViewSwitch(view, activeBtn) {
        // Sync active state for both top menu and sidebar nav
        const viewAttr = activeBtn.getAttribute('data-view');
        
        DOM.topMenuItems.forEach(i => {
            if (i.getAttribute('data-view') === view && i.textContent.trim() === activeBtn.textContent.trim()) {
                i.classList.add('active');
            } else if (i.getAttribute('data-view') !== view || i.textContent.trim() !== activeBtn.textContent.trim()) {
                // This logic is slightly complex because some buttons share the same data-view (bookmarks)
                // but differ in text ("홈", "자산 관리", "투자 도구").
                // Let's just match the exact button if possible or use text.
            }
        });

        // Simpler approach: update all buttons based on text/view
        const btnText = activeBtn.textContent.trim();
        [...DOM.topMenuItems, ...DOM.sidebarNavItems].forEach(btn => {
            if (btn.getAttribute('data-view') === view && btn.textContent.trim() === btnText) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (DOM.overviewSection) DOM.overviewSection.style.display = 'none';
        if (DOM.bookmarksSection) DOM.bookmarksSection.style.display = 'none';
        if (DOM.boardSection) DOM.boardSection.style.display = 'none';
        if (DOM.elfsightBoardSection) DOM.elfsightBoardSection.style.display = 'none';
        if (DOM.shortcutsSection) DOM.shortcutsSection.style.display = 'none';

        if (view === 'board') {
            if (DOM.boardSection) {
                DOM.boardSection.style.display = 'block';
                renderBoard();
            }
        } else if (view === 'elfsight-board') {
            if (DOM.elfsightBoardSection) DOM.elfsightBoardSection.style.display = 'block';
        } else if (view === 'shortcuts') {
            if (DOM.shortcutsSection) {
                DOM.shortcutsSection.style.display = 'block';
                renderShortcuts();
            }
        } else {
            if (DOM.overviewSection) DOM.overviewSection.style.display = 'block';
            if (DOM.bookmarksSection) DOM.bookmarksSection.style.display = 'block';
            renderNews();
            renderCards();
        }
        updateAuthUI();
    }

    let isFetchingMeta = false;
    let lastFetchedUrl = '';
    if (DOM.urlInput) {
        DOM.urlInput.addEventListener('blur', async () => {
            const url = DOM.urlInput.value.trim();
            if (!url || !url.startsWith('http')) return;
            if (url === lastFetchedUrl) return;
            if (isFetchingMeta) return;
            if (DOM.titleInput.value && DOM.descInput.value) return;

            isFetchingMeta = true;
            lastFetchedUrl = url;

            try {
                const label = DOM.urlInput.previousElementSibling;
                const originalText = label.innerHTML;
                label.innerHTML = `URL <span style="font-size:0.75rem; color:var(--primary); margin-left:0.5rem;"><i class="fa-solid fa-spinner fa-spin"></i> 정보를 가져오는 중...</span>`;
                
                const meta = await fetchMeta(url);
                
                if (meta.title && !DOM.titleInput.value) DOM.titleInput.value = meta.title;
                if (meta.description && !DOM.descInput.value) DOM.descInput.value = meta.description;
                
                label.innerHTML = originalText;
            } catch (e) {
                console.error("Metadata fetch error:", e);
                const label = DOM.urlInput.previousElementSibling;
                label.innerHTML = `URL <span style="font-size:0.75rem; color:#D32F2F; margin-left:0.5rem;">가져오기 실패</span>`;
                setTimeout(() => { label.innerHTML = "URL"; }, 2000);
            } finally {
                isFetchingMeta = false;
            }
        });
    }

    if (DOM.typeButtons) {
        DOM.typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentType = btn.dataset.filter;
                DOM.typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderCards();
            });
        });
    }

    if (DOM.addNewsBtn) {
        DOM.addNewsBtn.addEventListener('click', () => {
            if (DOM.newsIdInput) DOM.newsIdInput.value = '';
            if (DOM.newsModalTitle) DOM.newsModalTitle.textContent = '뉴스 작성';
            document.getElementById('newsTitle').value = '';
            if (editors.quill) editors.quill.setContents([]); 
            DOM.newsModal.classList.add('active');
        });
    }

    // Window hooks for news actions
    window.editNews = (id) => {
        const news = state.newsData.find(n => n.id === id);
        if (news) {
            if (DOM.newsIdInput) DOM.newsIdInput.value = news.id;
            if (DOM.newsModalTitle) DOM.newsModalTitle.textContent = '뉴스 수정';
            document.getElementById('newsTitle').value = news.title;
            if (editors.quill) {
                editors.quill.root.innerHTML = news.content || news.desc || '';
            }
            DOM.newsModal.classList.add('active');
        }
    };

    window.deleteNews = (id) => {
        confirmAction('뉴스 삭제', '이 뉴스를 정말 삭제하시겠습니까?', async () => {
            state.newsData = state.newsData.filter(n => n.id !== id);
            await syncData();
            renderNews();
        });
    };
    if (DOM.closeNewsModal) DOM.closeNewsModal.addEventListener('click', () => closeAllModals());
    if (DOM.cancelNewsBtn) DOM.cancelNewsBtn.addEventListener('click', () => closeAllModals());
    if (DOM.closeNewsReadModal) DOM.closeNewsReadModal.addEventListener('click', () => closeAllModals());

    if (DOM.newsForm) {
        DOM.newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = DOM.newsIdInput ? DOM.newsIdInput.value : '';
            const content = editors.quill ? editors.quill.root.innerHTML : '';
            const title = document.getElementById('newsTitle').value.trim();

            if (id) {
                const idx = state.newsData.findIndex(n => n.id === parseInt(id));
                if (idx !== -1) {
                    state.newsData[idx] = { ...state.newsData[idx], title, content, timestamp: Date.now() };
                }
            } else {
                state.newsData.push({ id: Date.now(), title, content, timestamp: Date.now() });
            }
            await syncData();
            renderNews();
            closeAllModals();
        });
    }

    if (DOM.mobileMenuBtn && DOM.sidebar && DOM.sidebarOverlay) {
        const toggleSidebar = () => {
            DOM.sidebar.classList.toggle('active');
            DOM.sidebarOverlay.classList.toggle('active');
        };
        DOM.mobileMenuBtn.addEventListener('click', toggleSidebar);
        DOM.sidebarOverlay.addEventListener('click', toggleSidebar);

        DOM.catContainer.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && e.target.closest('.filter-btn')) toggleSidebar();
        });
        const typeContainer = document.querySelector('.sidebar-type-list');
        if (typeContainer) {
            typeContainer.addEventListener('click', (e) => {
                if (window.innerWidth <= 1024 && e.target.closest('.filter-btn')) toggleSidebar();
            });
        }
    }

    if (DOM.addShortcutBtn) {
        DOM.addShortcutBtn.addEventListener('click', () => {
            DOM.shortcutForm.reset();
            document.getElementById('shortcutId').value = '';
            DOM.shortcutModalTitle.textContent = '바로가기 추가';
            DOM.shortcutModal.classList.add('active');
        });
    }
    if (DOM.closeShortcutModal) {
        DOM.closeShortcutModal.addEventListener('click', () => closeAllModals());
    }

    if (DOM.shortcutForm) {
        DOM.shortcutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('shortcutId').value;
            const title = document.getElementById('shortcutTitle').value.trim();
            const url = document.getElementById('shortcutUrl').value.trim();

            if (id) {
                const idx = state.shortcuts.findIndex(s => s.id === parseInt(id));
                if (idx !== -1) state.shortcuts[idx] = { ...state.shortcuts[idx], title, url };
            } else {
                state.shortcuts.push({ id: Date.now(), title, url });
            }
            await syncData();
            renderShortcuts();
            closeAllModals();
        });
    }

    if (DOM.addBoardBtn) {
        DOM.addBoardBtn.addEventListener('click', () => {
            if (!state.currentUser) {
                alert('로그인 후 이용해 주세요.');
                DOM.authModal.classList.add('active');
                return;
            }
            if (DOM.boardIdInput) DOM.boardIdInput.value = '';
            if (DOM.boardModalTitle) DOM.boardModalTitle.textContent = '인사이트 작성';
            document.getElementById('boardTitle').value = '';
            if (editors.boardQuill) editors.boardQuill.setContents([]);
            DOM.boardModal.classList.add('active');
        });
    }

    // Window hooks for board actions
    window.editBoard = (id) => {
        const post = state.boardData.find(b => b.id === id);
        if (post) {
            if (DOM.boardIdInput) DOM.boardIdInput.value = post.id;
            if (DOM.boardModalTitle) DOM.boardModalTitle.textContent = '인사이트 수정';
            document.getElementById('boardTitle').value = post.title;
            if (editors.boardQuill) {
                editors.boardQuill.root.innerHTML = post.content;
            }
            DOM.boardModal.classList.add('active');
        }
    };



    if (DOM.confirmOkBtn) {
        DOM.confirmOkBtn.addEventListener('click', async () => {
            if (currentConfirmCallback) await currentConfirmCallback();
            closeAllModals();
        });
    }
    if (DOM.confirmCancelBtn) {
        DOM.confirmCancelBtn.addEventListener('click', () => closeAllModals());
    }
    if (DOM.closeBoardModal) DOM.closeBoardModal.addEventListener('click', () => closeAllModals());
    if (DOM.closeBoardReadModal) DOM.closeBoardReadModal.addEventListener('click', () => closeAllModals());

    if (DOM.boardForm) {
        DOM.boardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = DOM.boardIdInput ? DOM.boardIdInput.value : '';
            const content = editors.boardQuill ? editors.boardQuill.root.innerHTML : '';
            const title = document.getElementById('boardTitle').value.trim();
            
            if (id) {
                // Update
                const idx = state.boardData.findIndex(b => b.id === parseInt(id));
                if (idx !== -1) {
                    state.boardData[idx] = {
                        ...state.boardData[idx],
                        title: title,
                        content: content,
                        timestamp: Date.now() // Optional: update timestamp on edit
                    };
                }
            } else {
                // Create
                const newPost = {
                    id: Date.now(),
                    title: title,
                    content: content,
                    author: state.currentUser ? state.currentUser.username : '익명',
                    timestamp: Date.now()
                };
                state.boardData.push(newPost);
            }
            
            await syncData();
            renderBoard();
            closeAllModals();
        });
    }
}
