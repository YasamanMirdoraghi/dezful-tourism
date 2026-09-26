// ═══════════════════════════════════════════════════════════
// components/login-modal.js — Modal هشدار لاگین
// ═══════════════════════════════════════════════════════════

/**
 * نمایش Modal هشدار لاگین
 * showLoginModal({ title: '...', message: '...', nextUrl: '...' })
 */
export function showLoginModal(options = {}) {
    const title = options.title || 'اول وارد شو!';
    const message = options.message || 'برای استفاده از این بخش، لطفاً ابتدا وارد حساب کاربری خودت شو یا ثبت‌نام کن.';
    const nextUrl = options.nextUrl || window.location.pathname;

    // حذف modal قبلی اگه بود
    const oldModal = document.querySelector('.login-modal-overlay');
    if (oldModal) oldModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'login-modal-overlay';
    overlay.innerHTML = `
        <div class="login-modal">
            <button class="login-modal-close" aria-label="بستن">
                <i class="fas fa-times"></i>
            </button>

            <div class="login-modal-icon">
                <i class="fas fa-lock"></i>
            </div>

            <h3>${title}</h3>
            <p>${message}</p>

            <div class="login-modal-actions">
                <a href="/accounts/login/?next=${encodeURIComponent(nextUrl)}" class="login-modal-btn primary">
                    <i class="fas fa-sign-in-alt"></i> ورود
                </a>
                <a href="/accounts/register/" class="login-modal-btn secondary">
                    <i class="fas fa-user-plus"></i> ثبت‌نام
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // نمایش با انیمیشن
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });

    document.body.style.overflow = 'hidden';

    function closeModal() {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => overlay.remove(), 300);
    }

    // بستن با کلیک روی دکمه
    overlay.querySelector('.login-modal-close').addEventListener('click', closeModal);

    // بستن با کلیک روی overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // بستن با Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * بررسی اینکه کاربر لاگین هست یا نه
 */
export function isUserAuthenticated() {
    return document.body.dataset.userAuthenticated === 'true';
}

// ⭐ در window ذخیره می‌شه چون در inline HTML ازش استفاده می‌شه
window.showLoginModal = showLoginModal;
window.isUserAuthenticated = isUserAuthenticated;