// ═══════════════════════════════════════════════════════════
// utils/helpers.js — توابع کمکی عمومی
// ═══════════════════════════════════════════════════════════

/**
 * Debounce — تأخیر در اجرای تابع
 * برای search inputs، resize، scroll
 */
export function debounce(fn, delay = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle — محدود کردن تعداد اجرای تابع
 * برای scroll handlers
 */
export function throttle(fn, limit = 200) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * انتخاب یک المان (کوتاه‌شده)
 */
export const $ = (selector) => document.querySelector(selector);

/**
 * انتخاب همه‌ی المان‌ها (کوتاه‌شده)
 */
export const $$ = (selector) => document.querySelectorAll(selector);

/**
 * بررسی وجود یک عنصر
 */
export const exists = (selector) => document.querySelector(selector) !== null;

/**
 * یک درخواست AJAX ساده با CSRF
 */
export async function fetchJSON(url, options = {}) {
    const { getCookie } = await import('./cookies.js');

    const defaultHeaders = {
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (options.method && options.method !== 'GET') {
        defaultHeaders['X-CSRFToken'] = getCookie('csrftoken');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}