// ═══════════════════════════════════════════════════════════
// pages/place-detail.js — صفحه‌ی جزئیات جاذبه
// ═══════════════════════════════════════════════════════════

import { getCookie, showToast, $ } from '../utils/index.js';

export function initPlaceDetail() {
    const mapEl = document.getElementById('placeMap');
    if (!mapEl) return;

    initPlaceMap();
    initFavoriteButton();
    initShareButton();
    initLightbox();
}

// ═══════════════════════════════════════════════════════════
// نقشه
// ═══════════════════════════════════════════════════════════
function initPlaceMap() {
    // ⭐ این خط رو عوض کن: از # استفاده کن
    const mapEl = $('#placeMap');
    if (!mapEl) return;
    if (typeof L === 'undefined') return;

    const lat = parseFloat(mapEl.dataset.lat) || 32.38;
    const lng = parseFloat(mapEl.dataset.lng) || 48.42;
    const name = mapEl.dataset.name || 'جاذبه';

    const map = L.map('placeMap').setView([lat, lng], 15);

    const MAPTILER_API_KEY = 'HJ7dofOgoJi2TfcV7XkF';

    const layers = {
        street: L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }),
        sat: L.tileLayer(`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`, {
            attribution: '&copy; MapTiler',
            maxZoom: 19
        }),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenTopoMap',
            maxZoom: 17
        }),
        dark: L.tileLayer(`https://api.maptiler.com/maps/dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`, {
            attribution: '&copy; MapTiler',
            maxZoom: 19
        })
    };

    layers.street.addTo(map);

    const icon = L.divIcon({
        className: 'custom-pin',
        html: '<div class="pin-icon"><i class="fas fa-map-marker-alt"></i></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 38]
    });

    L.marker([lat, lng], { icon: icon })
        .addTo(map)
        .bindPopup(`<b>${name}</b>`);

    // ⭐ این خط رو اضافه کن (خیلی مهم!)
    setTimeout(() => map.invalidateSize(), 300);
}

// ═══════════════════════════════════════════════════════════
// دکمه‌ی علاقه‌مندی
// ═══════════════════════════════════════════════════════════
function initFavoriteButton() {
    const favBtn = $('#favoriteBtn');
    if (!favBtn) return;

    favBtn.addEventListener('click', async function () {
        const slug = this.dataset.slug;
        this.disabled = true;
        this.style.opacity = '0.6';

        try {
            const response = await fetch(`/places/favorite/${slug}/toggle/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await response.json();

            if (data.status === 'added') {
                this.classList.add('favorited');
                this.querySelector('i').className = 'fas fa-heart';
                this.querySelector('span').textContent = 'ذخیره شد';
                showToast('به علاقه‌مندی‌ها اضافه شد', 'success');
            } else if (data.status === 'removed') {
                this.classList.remove('favorited');
                this.querySelector('i').className = 'far fa-heart';
                this.querySelector('span').textContent = 'ذخیره جاذبه';
                showToast('از علاقه‌مندی‌ها حذف شد', 'success');
            } else if (data.status === 'auth_required') {
                if (typeof window.showLoginModal === 'function') {
                    window.showLoginModal({
                        title: 'برای ذخیره اول وارد شو!',
                        message: 'برای ذخیره این جاذبه، لطفاً ابتدا وارد حساب کاربری خودت شو.'
                    });
                }
            }
        } catch (err) {
            console.error(err);
            showToast('خطا در ارتباط با سرور', 'error');
        } finally {
            this.disabled = false;
            this.style.opacity = '1';
        }
    });
}

// ═══════════════════════════════════════════════════════════
// اشتراک‌گذاری و چاپ
// ═══════════════════════════════════════════════════════════
function initShareButton() {
    const shareBtn = document.querySelector('[data-share]');
    if (!shareBtn) return;

    shareBtn.addEventListener('click', function () {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => showToast('لینک با موفقیت کپی شد!', 'success'))
                .catch(() => showToast('کپی لینک ناموفق بود', 'error'));
        }
    });

    const printBtn = document.querySelector('[onclick*="print"]');
    if (printBtn) {
        printBtn.removeAttribute('onclick');
        printBtn.addEventListener('click', function () {
            showToast('در حال آماده‌سازی برای چاپ...', 'info');
            setTimeout(() => window.print(), 600);
        });
    }
}

// ═══════════════════════════════════════════════════════════
// لایت‌باکس گالری
// ═══════════════════════════════════════════════════════════
function initLightbox() {
    window.openLightbox = function (src) {
        const lightbox = document.createElement('div');
        lightbox.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; cursor:pointer;';
        lightbox.innerHTML = '<img src="' + src + '" style="max-width:90%; max-height:90%; border-radius:15px;">';
        lightbox.onclick = function () { document.body.removeChild(lightbox); };
        document.body.appendChild(lightbox);
    };
}