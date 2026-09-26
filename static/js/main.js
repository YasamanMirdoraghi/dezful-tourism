// ═══════════════════════════════════════════════════════════
// main.js — نقطه ورود سراسری JavaScript
// ═══════════════════════════════════════════════════════════

import {
    initNavbar,
    initScrollTop,
    initMagazineSlider,
    initHeroSlider,
    initCardSliders,
    initCounters,
    initFavorite,
    // ⭐ import این ماژول، توابع رو در window ست می‌کنه
    showLoginModal,
    isUserAuthenticated,
} from './components/index.js';

import {
    initAuth,
    initDashboard,
    initAttraction,
    initArticles,
    initArticle,
    initPlaceDetail,
    initTripResult,
    initPlan,
    initMap,
} from './pages/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // ═══ سراسری ═══
    initNavbar();
    initScrollTop();
    initMagazineSlider();
    initHeroSlider();
    initCardSliders();
    initCounters();
    initFavorite();

    // ═══ صفحات خاص ═══
    initAuth();
    initDashboard();
    initAttraction();
    initArticles();
    initArticle();
    initPlaceDetail();
    initTripResult();
    initPlan();
    initMap();
});