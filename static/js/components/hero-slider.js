// ═══════════════════════════════════════════════════════════
// components/hero-slider.js — اسلایدر هیرو (صفحه اصلی)
// ═══════════════════════════════════════════════════════════

import { $, $$ } from '../utils/index.js';

/**
 * راه‌اندازی اسلایدر هیرو
 */
export function initHeroSlider() {
    const slides = $$('.slider-slide');
    const dots = $$('.dot-nav');
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');
    const sliderContainer = $('#sliderContainer');

    if (slides.length === 0 || !prevBtn || !nextBtn || !sliderContainer) return;

    let currentIndex = 0;
    let slideInterval;

    function goToSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');

        currentIndex = index;
    }

    function nextSlide() {
        goToSlide((currentIndex + 1) % slides.length);
    }

    function prevSlide() {
        goToSlide((currentIndex - 1 + slides.length) % slides.length);
    }

    function startInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });

    dots.forEach(dot => dot.addEventListener('click', function () {
        goToSlide(parseInt(this.dataset.index));
        resetInterval();
    }));

    startInterval();
    sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
    sliderContainer.addEventListener('mouseleave', startInterval);
}