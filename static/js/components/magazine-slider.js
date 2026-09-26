// ═══════════════════════════════════════════════════════════
// components/magazine-slider.js — اسلایدر مجله
// ═══════════════════════════════════════════════════════════

import { $, $$ } from '../utils/index.js';

/**
 * راه‌اندازی اسلایدر مجله
 * (در home, attraction, articles, article استفاده می‌شه)
 */
export function initMagazineSlider() {
    const slidesTrack = $('#slidesTrackMag');
    const listContainer = $('#slideListHorizontalMag');
    const sliderContainer = $('#sliderContainerMag');
    const magazineSlider = $('#magazineSlider');

    if (!slidesTrack || !listContainer || !sliderContainer) return;

    const slides = slidesTrack.querySelectorAll('.slide-mag');
    const totalSlides = slides.length;
    if (totalSlides === 0) return;

    // ⭐ پر کردن خودکار slide-bg-blur اگه وجود نداشت
    slides.forEach(slide => {
        if (slide.querySelector('.slide-bg-blur')) return;
        const img = slide.querySelector('.slide-image-mag img');
        if (!img) return;

        const bgBlur = document.createElement('div');
        bgBlur.className = 'slide-bg-blur';
        bgBlur.style.backgroundImage = `url('${img.src}')`;
        slide.insertBefore(bgBlur, slide.firstChild);
    });

    let currentIndex = 0;
    let autoSlideInterval, progressInterval;

    // ═══ تغییر پس‌زمینه (blur) ═══
    function changeBackground(index) {
        if (magazineSlider && slides[index]) {
            const img = slides[index].querySelector('.slide-image-mag img');
            if (img) {
                if (img.complete) {
                    magazineSlider.style.backgroundImage = `url('${img.src}')`;
                } else {
                    img.onload = function () {
                        magazineSlider.style.backgroundImage = `url('${img.src}')`;
                    };
                }
            }
        }
    }

    // ═══ رفتن به اسلاید ═══
    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;

        slidesTrack.style.transform = `translateX(-${index * 100}%)`;

        slides.forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });

        listContainer.querySelectorAll('.list-item-h-mag').forEach((el, i) => {
            el.classList.toggle('active-item-h-mag', i === index);
        });

        changeBackground(index);

        resetProgress();
        startProgress();
    }

    // ═══ Progress bar ═══
    function resetProgress() {
        if (progressInterval) clearInterval(progressInterval);
        listContainer.querySelectorAll('.progress-fill-h-mag').forEach(el => {
            el.style.width = '0%';
        });
    }

    function startProgress() {
        let width = 0;
        const fill = document.getElementById(`progress-h-mag-${currentIndex}`);
        if (!fill) return;

        progressInterval = setInterval(() => {
            width += 0.6;
            if (width >= 100) {
                width = 100;
                fill.style.width = '100%';
                clearInterval(progressInterval);
                goToSlide((currentIndex + 1) % totalSlides);
            } else {
                fill.style.width = width + '%';
            }
        }, 40);
    }

    // ═══ Auto slide ═══
    function resetAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => {
            goToSlide((currentIndex + 1) % totalSlides);
        }, 6500);
    }

    // ═══ کلیک روی آیتم‌های لیست ═══
    listContainer.querySelectorAll('.list-item-h-mag').forEach((item, index) => {
        item.addEventListener('click', function () {
            const idx = parseInt(this.dataset.index, 10);
            if (idx !== currentIndex) {
                goToSlide(idx);
                resetAutoSlide();
            }
        });
    });

    // ═══ شروع ═══
    goToSlide(0);
    resetAutoSlide();

    // ═══ Resize ═══
    window.addEventListener('resize', function () {
        slidesTrack.style.transition = 'none';
        slidesTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        requestAnimationFrame(() => {
            slidesTrack.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    });
}