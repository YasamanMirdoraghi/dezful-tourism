// ═══════════════════════════════════════════════════════════
// components/scroll-top.js — دکمه اسکرول به بالا
// ═══════════════════════════════════════════════════════════

import { $ } from '../utils/index.js';

/**
 * راه‌اندازی دکمه‌ی اسکرول به بالا
 */
export function initScrollTop() {
    const scrollBtn = $('#scrollTop');
    if (!scrollBtn) return;

    // نمایش/مخفی کردن در اسکرول
    const handleScroll = () => {
        scrollBtn.classList.toggle('visible', window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // اجرای اولیه

    // کلیک → اسکرول به بالا
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}