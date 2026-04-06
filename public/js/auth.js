import { state } from './state.js';
import { DOM } from './dom.js';
import { syncData } from './api.js';
import { renderCards, renderShortcuts } from './ui.js';

export function updateAuthUI() {
    if (state.currentUser) {
        if (state.currentUser.role === 'admin') document.body.classList.add('admin-mode');
        else document.body.classList.remove('admin-mode');
        
        // Header Auth UI
        if (DOM.userProfile) DOM.userProfile.style.display = 'flex';
        if (DOM.userNameDisplay) DOM.userNameDisplay.textContent = state.currentUser.username;
        if (DOM.loginBtnTrigger) DOM.loginBtnTrigger.style.display = 'none';
        
        // Sidebar Auth UI (for Mobile)
        if (DOM.authContainerSidebar) {
            DOM.authContainerSidebar.innerHTML = `
                <div class="sidebar-user-info" style="display: flex; align-items: center; gap: 0.8rem; padding: 1rem; background: var(--surface-container-low); border-radius: 12px; margin-bottom: 0.5rem;">
                    <i class="fa-solid fa-user-circle" style="font-size: 1.5rem; color: var(--primary);"></i>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: var(--on-surface);">${state.currentUser.username}</div>
                        <div style="font-size: 0.65rem; color: var(--on-surface-variant); opacity: 0.7;">로그인 중</div>
                    </div>
                    <button class="logout-link-btn" id="sidebarLogoutBtn" style="background: none; border: none; color: #D32F2F; font-size: 0.8rem; font-weight: 600; cursor: pointer;">로그아웃</button>
                </div>
            `;
            const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
            if (sidebarLogoutBtn) {
                sidebarLogoutBtn.onclick = () => {
                   state.currentUser = null;
                   localStorage.removeItem('fin_currentUser');
                   document.body.classList.remove('admin-mode');
                   updateAuthUI();
                   renderCards();
                   renderShortcuts();
                };
            }
        }

        if (state.currentUser.role === 'admin') {
            if (DOM.addBtn) DOM.addBtn.style.display = 'inline-flex';
            if (DOM.manageCategoryBtn) DOM.manageCategoryBtn.style.display = 'flex';
            if (DOM.addNewsBtn) DOM.addNewsBtn.style.display = 'flex';
            
            const activeMenu = document.querySelector('.top-menu a.active') || document.querySelector('.nav-btn.active');
            const isBoardView = activeMenu && activeMenu.getAttribute('data-view') === 'board';
            if (DOM.addBoardBtn) DOM.addBoardBtn.style.display = isBoardView ? 'flex' : 'none';
        } else {
            if (DOM.addBtn) DOM.addBtn.style.display = 'none';
            if (DOM.manageCategoryBtn) DOM.manageCategoryBtn.style.display = 'none';
            if (DOM.addNewsBtn) DOM.addNewsBtn.style.display = 'none';
            if (DOM.addBoardBtn) DOM.addBoardBtn.style.display = 'none';
        }
    } else {
        if (DOM.userProfile) DOM.userProfile.style.display = 'none';
        if (DOM.loginBtnTrigger) DOM.loginBtnTrigger.style.display = 'flex';
        if (DOM.logoutBtn) DOM.logoutBtn.style.display = 'none';
        
        if (DOM.authContainerSidebar) {
            DOM.authContainerSidebar.innerHTML = `
                <button id="sidebarLoginBtn" style="width: 100%; padding: 0.85rem; border-radius: 12px; background: var(--primary); color: white; border: none; font-weight: 700; cursor: pointer;">로그인</button>
            `;
            const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');
            if (sidebarLoginBtn) {
                sidebarLoginBtn.onclick = () => {
                    state.isLoginMode = true;
                    if (DOM.authModalTitle) DOM.authModalTitle.textContent = '로그인';
                    if (DOM.authSubmitBtn) DOM.authSubmitBtn.textContent = '로그인';
                    if (DOM.authModeToggleBtn) DOM.authModeToggleBtn.textContent = '회원가입 하기';
                    if (DOM.authForm) DOM.authForm.reset();
                    if (DOM.authModal) DOM.authModal.classList.add('active');
                };
            }
        }

        if (DOM.addBtn) DOM.addBtn.style.display = 'none';
        if (DOM.addBoardBtn) DOM.addBoardBtn.style.display = 'none';
        if (DOM.manageCategoryBtn) DOM.manageCategoryBtn.style.display = 'none';
        if (DOM.addNewsBtn) DOM.addNewsBtn.style.display = 'none';
    }
}

export function setupAuthEvents() {
    if (DOM.loginBtnTrigger) {
        DOM.loginBtnTrigger.addEventListener('click', () => {
            state.isLoginMode = true;
            if (DOM.authModalTitle) DOM.authModalTitle.textContent = '로그인';
            if (DOM.authSubmitBtn) DOM.authSubmitBtn.textContent = '로그인';
            if (DOM.authModeToggleBtn) DOM.authModeToggleBtn.textContent = '회원가입 하기';
            if (DOM.authForm) DOM.authForm.reset();
            if (DOM.authModal) DOM.authModal.classList.add('active');
        });
    }

    if (DOM.closeAuthModal) {
        DOM.closeAuthModal.addEventListener('click', () => {
            if (DOM.authModal) DOM.authModal.classList.remove('active');
        });
    }

    if (DOM.authModeToggleBtn) {
        DOM.authModeToggleBtn.addEventListener('click', () => {
            state.isLoginMode = !state.isLoginMode;
            if (state.isLoginMode) {
                if (DOM.authModalTitle) DOM.authModalTitle.textContent = '로그인';
                if (DOM.authSubmitBtn) DOM.authSubmitBtn.textContent = '로그인';
                if (DOM.authModeToggleBtn) DOM.authModeToggleBtn.textContent = '회원가입 하기';
            } else {
                if (DOM.authModalTitle) DOM.authModalTitle.textContent = '회원가입';
                if (DOM.authSubmitBtn) DOM.authSubmitBtn.textContent = '가입하기';
                if (DOM.authModeToggleBtn) DOM.authModeToggleBtn.textContent = '기존 계정으로 로그인';
            }
        });
    }

    if(DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', () => {
            state.currentUser = null;
            localStorage.removeItem('fin_currentUser');
            document.body.classList.remove('admin-mode');
            updateAuthUI();
            renderCards();
            renderShortcuts();
        });
    }

    if (DOM.authForm) {
        DOM.authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const un = DOM.usernameInput ? DOM.usernameInput.value.trim() : '';
            const pw = DOM.passwordInput ? DOM.passwordInput.value.trim() : '';
            
            if (!un || !pw) return alert('아이디와 비밀번호를 입력하세요.');

            if (state.isLoginMode) {
                const user = state.usersDB.find(u => u.username === un && u.password === pw);
                if (user) {
                    state.currentUser = { username: user.username, role: user.role };
                    localStorage.setItem('fin_currentUser', JSON.stringify(state.currentUser));
                    updateAuthUI();
                    if (DOM.authModal) DOM.authModal.classList.remove('active');
                    renderCards();
                } else {
                    alert('아이디 또는 비밀번호가 틀렸습니다.');
                }
            } else {
                if (state.usersDB.find(u => u.username === un)) return alert('이미 존재하는 아이디입니다.');
                const newUser = { username: un, password: pw, role: 'user' };
                state.usersDB.push(newUser);
                syncData();
                
                state.currentUser = { username: newUser.username, role: newUser.role };
                localStorage.setItem('fin_currentUser', JSON.stringify(state.currentUser));
                updateAuthUI();
                if (DOM.authModal) DOM.authModal.classList.remove('active');
                renderCards();
                alert('회원가입이 완료되었습니다!');
            }
        });
    }
}
