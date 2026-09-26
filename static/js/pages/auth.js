// ═══════════════════════════════════════════════════════════
// pages/auth.js — صفحه‌های ورود و ثبت‌نام
// ═══════════════════════════════════════════════════════════

import { $ } from '../utils/index.js';

/**
 * toggle نمایش/مخفی کردن رمز عبور
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-icon');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ⭐ در window ذخیره می‌شه چون در HTML با onclick استفاده می‌شه
window.togglePassword = togglePassword;

/**
 * راه‌اندازی صفحه‌ی ورود/ثبت‌نام
 */
export function initAuth() {
    // چک کن در کدوم صفحه هستیم
    const isLoginPage = document.body.classList.contains('login-page');
    const isRegisterPage = document.body.classList.contains('register-page');

    if (!isLoginPage && !isRegisterPage) return;

    // تنظیم دکمه‌های toggle رمز عبور (اگه با onclick مستقیم نبودن)
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(btn => {
        // اگه قبلاً onclick داره، دست نزن
        if (btn.hasAttribute('onclick')) return;

        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                togglePassword(input.id);
            }
        });
    });
}