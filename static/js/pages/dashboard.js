// ═══════════════════════════════════════════════════════════
// pages/dashboard.js — صفحه‌ی داشبورد
// ═══════════════════════════════════════════════════════════

import { getCookie, showToast, $ } from '../utils/index.js';

/**
 * راه‌اندازی صفحه‌ی داشبورد
 */
export function initDashboard() {
    // چک کن در صفحه‌ی داشبورد هستیم
    if (!document.querySelector('.dash-main')) return;

    initRemoveFavorite();
    initRemoveTrip();
    initRemoveReview();
    initProfileModal();
}

// ═══════════════════════════════════════════════════════════
// حذف از ذخیره‌شده‌ها
// ═══════════════════════════════════════════════════════════
function initRemoveFavorite() {
    document.querySelectorAll('.dash-fav-remove').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!confirm('این جاذبه از ذخیره‌شده‌ها حذف بشه؟')) return;

            const slug = this.dataset.slug;
            const card = this.closest('.dash-fav-card');

            try {
                const res = await fetch(`/places/favorite/${slug}/toggle/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await res.json();

                if (data.status === 'removed') {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.remove();
                        showToast('از ذخیره‌شده‌ها حذف شد');
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

// ═══════════════════════════════════════════════════════════
// حذف سفر
// ═══════════════════════════════════════════════════════════
function initRemoveTrip() {
    document.querySelectorAll('.dash-trip-delete').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!confirm('این سفر برای همیشه حذف بشه؟')) return;

            const tripId = this.dataset.tripId;
            const card = this.closest('.dash-trip-card');

            try {
                const res = await fetch(`/planner/trip/${tripId}/delete/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await res.json();

                if (data.status === 'deleted') {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.remove();
                        showToast('سفر با موفقیت حذف شد');
                        if (document.querySelectorAll('.dash-trip-card').length === 0) {
                            setTimeout(() => location.reload(), 800);
                        }
                    }, 300);
                }
            } catch (err) {
                console.error(err);
                showToast('خطا در حذف سفر', 'error');
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// حذف نظر
// ═══════════════════════════════════════════════════════════
function initRemoveReview() {
    document.querySelectorAll('.dash-review-delete').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!confirm('این نظر برای همیشه حذف بشه؟')) return;

            const reviewId = this.dataset.reviewId;
            const card = this.closest('.dash-review-card');

            try {
                const res = await fetch(`/places/review/${reviewId}/delete/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await res.json();

                if (data.status === 'deleted') {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.remove();
                        showToast('نظر با موفقیت حذف شد');
                        if (document.querySelectorAll('.dash-review-card').length === 0) {
                            setTimeout(() => location.reload(), 800);
                        }
                    }, 300);
                }
            } catch (err) {
                console.error(err);
                showToast('خطا در حذف نظر', 'error');
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// Modal ویرایش پروفایل
// ═══════════════════════════════════════════════════════════
function initProfileModal() {
    const editBtn = $('editProfileBtn');
    const modal = $('profileModal');
    const overlay = $('profileModalOverlay');
    const closeBtn = $('profileModalClose');
    const cancelBtn = $('profileModalCancel');
    const form = $('profileForm');
    const avatarInput = $('avatarInput');
    const avatarPreview = $('avatarPreview');

    if (!editBtn || !modal) return;

    function openModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    editBtn.addEventListener('click', openModal);
    overlay?.addEventListener('click', closeModal);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    // ═══ پیش‌نمایش عکس پروفایل ═══
    avatarInput?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('حجم عکس نباید بیشتر از ۲ مگابایت باشد', 'error');
            this.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('فایل باید عکس باشد', 'error');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const existingImg = avatarPreview.querySelector('img');
            const existingSpan = avatarPreview.querySelector('span');
            const overlayEl = avatarPreview.querySelector('.dash-avatar-overlay');

            if (existingImg) existingImg.remove();
            if (existingSpan) existingSpan.remove();

            const img = document.createElement('img');
            img.src = event.target.result;
            img.id = 'avatarImg';
            avatarPreview.insertBefore(img, overlayEl);
        };
        reader.readAsDataURL(file);
    });

    // ═══ ارسال فرم ═══
    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ذخیره...';

        try {
            const res = await fetch(form.dataset.updateUrl || '/accounts/update-profile/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await res.json();

            if (data.status === 'updated') {
                showToast(data.message);
                closeModal();
                setTimeout(() => location.reload(), 800);
            } else {
                showToast(data.message || 'خطا در ذخیره', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('خطا در ارتباط با سرور', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}