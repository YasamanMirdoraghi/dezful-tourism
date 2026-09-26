// ═══════════════════════════════════════════════════════════
// components/card-slider.js — اسلایدر کارتی (plans + attractions)
// ═══════════════════════════════════════════════════════════

import { $ } from '../utils/index.js';

/**
 * راه‌اندازی اسلایدر کارتی
 */
function initOneCardSlider(trackId, prevId, nextId) {
    const track = $(`#${trackId}`);
    const prevBtn = $(`#${prevId}`);
    const nextBtn = $(`#${nextId}`);

    if (!track || !prevBtn || !nextBtn) return;

    const slides = track.querySelectorAll('.card-slide');
    const totalSlides = slides.length;
    if (totalSlides === 0) return;

    let currentIndex = 0;

    function getVisibleCount() {
        const width = window.innerWidth;
        if (width >= 1200) return 5;
        if (width >= 768) return 3;
        if (width >= 480) return 2;
        return 1;
    }

    let visibleCount = getVisibleCount();
    const maxIndex = Math.max(0, totalSlides - visibleCount);

    function updateSlide() {
        const slideWidth = slides[0]?.offsetWidth || 0;
        const gap = 24;
        track.style.transform = `translateX(${currentIndex * (slideWidth + gap)}px)`;
    }

    function nextSlide() {
        currentIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
        updateSlide();
    }

    function prevSlide() {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
        updateSlide();
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newVisibleCount = getVisibleCount();
            const newMaxIndex = Math.max(0, totalSlides - newVisibleCount);
            if (currentIndex > newMaxIndex) currentIndex = newMaxIndex;
            visibleCount = newVisibleCount;
            updateSlide();
        }, 200);
    });

    setTimeout(updateSlide, 100);
}

/**
 * راه‌اندازی همه‌ی اسلایدرهای کارتی صفحه
 */
export function initCardSliders() {
    initOneCardSlider('plansTrack', 'plansPrev', 'plansNext');
    initOneCardSlider('attractionsTrack', 'attractionsPrev', 'attractionsNext');
}