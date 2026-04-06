export const state = {
    items: [],
    categories: [],
    usersDB: [],
    newsData: [],
    boardData: [],
    shortcuts: [],
    currentUser: null,
    isLoginMode: true,
    currentCategory: 'all',
    currentSubCategory: ['all'],
    currentType: 'all',
    currentSearchQuery: ''
};

export const defaultCategories = [
    { id: 'stock', name: '주식', subCategories: [{id: 'general', name: '종합'}, {id: 'tech', name: '기술적분석'}, {id: 'fundamental', name: '기본적분석'}] },
    { id: 'coin', name: '코인', subCategories: [{id: 'exchange', name: '거래소'}, {id: 'market', name: '시황/정보'}] },
    { id: 'bond', name: '채권', subCategories: [{id: 'data', name: '금리/데이터'}, {id: 'news', name: '시황/정보'}] },
    { id: 'insurance', name: '보험', subCategories: [{id: 'compare', name: '비교/공시'}] },
    { id: 'finance', name: '금융', subCategories: [{id: 'macro', name: '거시경제'}, {id: 'media', name: '종합미디어'}] }
];

export const editors = {
    quill: null,
    boardQuill: null
};
