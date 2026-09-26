// ═══════════════════════════════════════════════════════════
// components/counters.js — شمارنده آمار
// ═══════════════════════════════════════════════════════════

import { $$ } from '../utils/index.js';

/**
 * راه‌اندازی شمارنده‌های آمار
 * با IntersectionObserver (وقتی به دید کاربر رسید، شمارش شروع می‌شه)
 */
export function initCounters() {
    const statNumbers = $$('.stat-number');
    if (statNumbers.length === 0) return;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const target = parseFloat(entry.target.dataset.target);
            if (isNaN(target)) return;

            const isDecimal = target % 1 !== 0;
            const step = isDecimal ? 0.1 : Math.max(1, target / 60);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current >= target) {
                    entry.target.textContent = isDecimal ? target.toFixed(1) : Math.floor(target);
                    return;
                }
                entry.target.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
                requestAnimationFrame(updateCounter);
            };

            updateCounter();
            counterObserver.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => counterObserver.observe(num));
}