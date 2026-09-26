// ═══════════════════════════════════════════════════════════
// utils/toast.js — نمایش Toast اطلاع‌رسانی
// ═══════════════════════════════════════════════════════════

let _toastTimeout = null;

/**
 * نمایش Toast
 * showToast('لینک کپی شد!', 'success')
 * type: 'success' | 'error' | 'info'
 */
export function showToast(message, type = 'success') {
    const toast = document.getElementById('customToast') || document.getElementById('dashToast');
    if (!toast) {
        console.warn('⚠️ Toast element not found');
        return;
    }

    const toastText = document.getElementById('customToastText') || document.getElementById('dashToastText');
    const toastIcon = toast.querySelector('.custom-toast-icon i') || toast.querySelector('.dash-toast-icon i');

    if (toastText) toastText.textContent = message;

    toast.classList.remove('success', 'error', 'info');
    toast.classList.add(type);

    if (toastIcon) {
        if (type === 'success') toastIcon.className = 'fas fa-check';
        else if (type === 'error') toastIcon.className = 'fas fa-exclamation-circle';
        else if (type === 'info') toastIcon.className = 'fas fa-info-circle';
    }

    toast.classList.add('show');

    clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

export function hideToast() {
    const toast = document.getElementById('customToast') || document.getElementById('dashToast');
    if (toast) toast.classList.remove('show');
    clearTimeout(_toastTimeout);
}