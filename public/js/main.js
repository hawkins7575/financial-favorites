import { state, defaultCategories } from './state.js';
import { syncData } from './api.js';
import { updateAuthUI, setupAuthEvents } from './auth.js';
import { 
    setupUIEvents, 
    initEditors, 
    renderCategoryFilters, 
    renderFormCategories, 
    renderNews, 
    renderCards,
    renderShortcuts,
    openNewsModal,
    openBoardModal,
    closeAllModals
} from './ui.js';

function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const id = params.get('id');

    if (!view || !id) {
        closeAllModals(false);
        return;
    }

    if (view === 'news') {
        const news = state.newsData.find(n => n.id === parseInt(id));
        if (news) openNewsModal(news);
    } else if (view === 'board') {
        const post = state.boardData.find(b => b.id === parseInt(id));
        if (post) openBoardModal(post);
    }
}

async function initApp() {
    let apiData = null;
    console.log('App initialization started...');
    
    try {
        const resp = await fetch('/api/data');
        if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
            apiData = await resp.json();
            console.log('API data loaded successfully:', apiData);
        } else {
            console.warn('API returned non-JSON response or error. Falling back to local/static data.');
        }
    } catch(e) {
        console.warn('Backend API connection failed. Falling back to local/static data.', e);
    }

    // Initialize state from API data if available, or stay empty for fallback logic
    state.usersDB = apiData?.usersDB || [];
    state.categories = apiData?.categories || [];
    state.items = apiData?.items || [];
    state.newsData = apiData?.newsData || [];
    state.boardData = apiData?.boardData || [];
    state.shortcuts = apiData?.shortcuts || [];
    
    let needsSync = false;

    // 1. Categories Fallback (Critical: if sidebar is empty)
    if (!state.categories || state.categories.length === 0) {
        const lsCat = localStorage.getItem('financialCategoriesData');
        if (lsCat) {
            state.categories = JSON.parse(lsCat);
            console.log('Loaded categories from LocalStorage');
        } else {
            state.categories = JSON.parse(JSON.stringify(defaultCategories));
            console.log('Loaded categories from hardcoded defaultCategories');
        }
        needsSync = true;
    }
    
    // 2. Items Fallback (Critical: if dashboard is empty)
    if (!state.items || state.items.length === 0) {
        const lsItems = localStorage.getItem('financialFavorites');
        if (lsItems) {
            state.items = JSON.parse(lsItems);
            console.log('Loaded items from LocalStorage');
        } else if (window.financialData && window.financialData.length > 0) {
            state.items = [...window.financialData].map(i => {
                const newItem = { ...i };
                if (!newItem.userId) newItem.userId = 'admin';
                if (!newItem.subCategory) newItem.subCategory = 'general';
                return newItem;
            });
            console.log('Loaded items from window.financialData (data.js)');
        }
        needsSync = true;
    }

    // 3. User Session
    const sessionUser = localStorage.getItem('fin_currentUser');
    if (sessionUser) {
        state.currentUser = JSON.parse(sessionUser);
    }

    // Sync if we have local fallback data but API was empty
    if (needsSync && apiData) {
        try {
            console.log('Synchronizing local fallback data to server...');
            await syncData();
        } catch (syncErr) {
            console.error('Failed to sync initial state to backend:', syncErr);
        }
    }

    // Initial Renders
    updateAuthUI();
    renderCategoryFilters();
    renderFormCategories();
    renderNews();
    renderCards();
    renderShortcuts();
    
    console.log('App initialization complete. Ready.');

    // Handle initial routing
    handleRouting();
}

document.addEventListener('DOMContentLoaded', () => {
    initEditors();
    setupAuthEvents();
    setupUIEvents();
    initApp();

    window.addEventListener('popstate', (event) => {
        handleRouting();
    });
});
