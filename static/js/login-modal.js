// ═══════════════════════════════════════════════════════════
// Modal هشدار لاگین (مشترک همه صفحات)
// ═══════════════════════════════════════════════════════════
(function () {
    'use strict';

    window.showLoginModal = function (options) {
        options = options || {};
        
        const title = options.title || 'اول وارد شو!';
        const message = options.message || 'برای استفاده از این بخش، لطفاً ابتدا وارد حساب کاربری خودت شو یا ثبت‌نام کن.';
        const nextUrl = options.nextUrl || window.location.pathname;
        
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
                    <a href="/login/?next=${encodeURIComponent(nextUrl)}" class="login-modal-btn primary">
                        <i class="fas fa-sign-in-alt"></i> ورود
                    </a>
                    <a href="/register/" class="login-modal-btn secondary">
                        <i class="fas fa-user-plus"></i> ثبت‌نام
                    </a>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
        
        document.body.style.overflow = 'hidden';
        
        function closeModal() {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            setTimeout(() => overlay.remove(), 300);
        }
        
        overlay.querySelector('.login-modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    };

    window.isUserAuthenticated = function () {
        return document.body.dataset.userAuthenticated === 'true';
    };

})();