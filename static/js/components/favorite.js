// ═══════════════════════════════════════════════════════════
// components/favorite.js — دکمه‌های حذف از ذخیره‌شده‌ها (داشبورد)
// ═══════════════════════════════════════════════════════════

import { getCookie, showToast } from '../utils/index.js';

/**
 * راه‌اندازی دکمه‌های حذف از ذخیره‌شده‌ها
 * (فقط در داشبورد استفاده می‌شه)
 */
export function initFavorite() {
    document.querySelectorAll('.dash-fav-remove').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!confirm('این جاذبه از ذخیره‌شده‌ها حذف بشه؟')) return;

            const slug = this.dataset.slug;
            const card = this.closest('.dash-fav-card');

            try {
                const response = await fetch(`/places/favorite/${slug}/toggle/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();

                if (data.status === 'removed') {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.remove();
                        showToast('از ذخیره‌شده‌ها حذف شد', 'success');
                        if (document.querySelectorAll('.dash-fav-card').length === 0) {
                            setTimeout(() => location.reload(), 800);
                        }
                    }, 300);
                }
            } catch (err) {
                console.error(err);
                showToast('خطا در ارتباط با سرور', 'error');
            }
        });
    });
}