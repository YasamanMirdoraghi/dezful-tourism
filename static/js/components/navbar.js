// ═══════════════════════════════════════════════════════════
// components/navbar.js — منوی همبرگری + اسکرول هدر
// ═══════════════════════════════════════════════════════════

import { $ } from '../utils/index.js';

/**
 * راه‌اندازی نوبار
 * - منوی همبرگری موبایل
 * - تغییر استایل هدر در اسکرول
 */
export function initNavbar() {
    const hamburger = $('#hamburgerBtn');
    const navLinks = $('#navLinks');
    const overlay = $('#menuOverlay');
    const closeBtn = $('#closeMenuBtn');

    // ═══ منوی همبرگری موبایل ═══
    if (hamburger && navLinks && overlay) {
        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('active');
            overlay.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        hamburger.addEventListener('click', toggleMenu);

        // دکمه‌ی بستن منو
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navLinks.classList.contains('active')) toggleMenu();
            });
        }

        // کلیک روی overlay
        overlay.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) toggleMenu();
        });

        // بستن خودکار وقتی کاربر روی یه لینک کلیک کرد (در موبایل)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    navLinks.querySelectorAll('a').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    if (navLinks.classList.contains('active')) toggleMenu();
                }
            });
        });

        // بستن با دکمه‌ی Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // ═══ تغییر استایل هدر در اسکرول ═══
    const navbar = $('#navbar');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.08)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // اجرای اولیه
    }
}