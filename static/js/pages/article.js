// ═══════════════════════════════════════════════════════════
// pages/article.js — صفحه‌ی جزئیات مقاله
// ═══════════════════════════════════════════════════════════

import { throttle, $, $$ } from '../utils/index.js';

/**
 * راه‌اندازی صفحه‌ی جزئیات مقاله
 */
export function initArticle() {
    const progressBar = $('.article-reading-progress span');
    const tocLinks = $$('.article-toc-card nav a');
    const headings = $$('.article-heading');

    // اگه در این صفحه نیستیم، برگرد
    if (!progressBar && !tocLinks.length) return;

    initReadingProgress(progressBar);
    initTOC(tocLinks, headings);
    initShareButtons();
    initRelatedSlider();
}

// ═══════════════════════════════════════════════════════════
// نوار پیشرفت مطالعه
// ═══════════════════════════════════════════════════════════
function initReadingProgress(progressBar) {
    if (!progressBar) return;

    function updateProgress() {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        const percent = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
        progressBar.style.width = percent + '%';
    }

    window.addEventListener('scroll', throttle(updateProgress, 16), { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
}

// ═══════════════════════════════════════════════════════════
// فهرست مطالب کناری
// ═══════════════════════════════════════════════════════════
function initTOC(tocLinks, headings) {
    if (!tocLinks.length || !headings.length) return;

    function updateActiveTOC() {
        let current = headings[0];
        for (let i = 0; i < headings.length; i++) {
            if (headings[i].getBoundingClientRect().top <= 150) current = headings[i];
        }
        tocLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current.id);
        });
    }

    // اسکرول نرم
    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    window.addEventListener('scroll', throttle(updateActiveTOC, 100), { passive: true });
    updateActiveTOC();
}

// ═══════════════════════════════════════════════════════════
// دکمه‌های اشتراک‌گذاری
// ═══════════════════════════════════════════════════════════
function initShareButtons() {
    const shareButtons = document.querySelectorAll('[data-share]');
    if (!shareButtons.length) return;

    shareButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.dataset.share;
            const url = window.location.href;
            const title = document.title;

            if (type === 'copy') {
                navigator.clipboard.writeText(url)
                    .then(() => {
                        // اگه Toast داریم
                        if (typeof window.showToast === 'function') {
                            window.showToast('لینک با موفقیت کپی شد!', 'success');
                        }
                        // تغییر آیکون موقت
                        this.classList.add('copied');
                        setTimeout(() => this.classList.remove('copied'), 1500);
                    })
                    .catch(() => {
                        if (typeof window.showToast === 'function') {
                            window.showToast('کپی لینک ناموفق بود', 'error');
                        }
                    });
            } else if (type === 'telegram') {
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
            } else if (type === 'whatsapp') {
                window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// اسلایدر مقالات مرتبط
// ═══════════════════════════════════════════════════════════
function initRelatedSlider() {
    const track = document.querySelector('[data-related-track]');
    const prevBtn = document.querySelector('[data-related-prev]');
    const nextBtn = document.querySelector('[data-related-next]');
    const dotsContainer = document.querySelector('[data-related-dots]');

    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll('.article-related-card');
    if (cards.length === 0) return;

    let currentIndex = 0;

    function getVisibleCount() {
        const w = window.innerWidth;
        if (w >= 1100) return 4;
        if (w >= 760) return 2;
        return 1;
    }

    function getMaxIndex() {
        return Math.max(0, cards.length - getVisibleCount());
    }

    function updateSlide() {
        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = 20;
        track.style.transform = `translateX(${currentIndex * (cardWidth + gap)}px)`;
        updateDots();
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= getMaxIndex();
    }

    function updateDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const maxIdx = getMaxIndex();
        if (maxIdx === 0) return;
        for (let i = 0; i <= maxIdx; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            if (i === currentIndex) btn.classList.add('active');
            btn.addEventListener('click', () => {
                currentIndex = i;
                updateSlide();
            });
            dotsContainer.appendChild(btn);
        }
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; updateSlide(); }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < getMaxIndex()) { currentIndex++; updateSlide(); }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            currentIndex = Math.min(currentIndex, getMaxIndex());
            updateSlide();
        }, 200);
    });

    setTimeout(updateSlide, 100);
}