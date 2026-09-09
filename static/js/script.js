// ==========================================================
// سیستم هوشمند پیشنهاددهنده گردشگری دزفول
// فایل: script.js
// دانشگاه صنعتی جندی شاپور دزفول - پروژه کارشناسی
// ==========================================================

// ----- مدیریت منوی همبرگری -----
const hamburger = document.getElementById('hamburgerBtn');
const navLinks = document.getElementById('navLinks');
const overlay = document.getElementById('menuOverlay');
const closeBtn = document.getElementById('closeMenuBtn');

function toggleMenu() {
	const isOpen = navLinks.classList.toggle('active');
	overlay.classList.toggle('active', isOpen);
	document.body.style.overflow = isOpen ? 'hidden' : '';
}

if (hamburger) hamburger.addEventListener('click', toggleMenu);
if (closeBtn) closeBtn.addEventListener('click', e => {
	e.stopPropagation();
	if (navLinks.classList.contains('active')) toggleMenu();
});
if (overlay) overlay.addEventListener('click', () => {
	if (navLinks.classList.contains('active')) toggleMenu();
});

// بستن خودکار منو هنگام کلیک روی لینک‌ها در موبایل
document.querySelectorAll('.nav-links a').forEach(link => {
	link.addEventListener('click', function (e) {
		if (window.innerWidth <= 768) {
			document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
			this.classList.add('active');
			if (navLinks.classList.contains('active')) toggleMenu();
		}
	});
});

// ----- اسکرول هدر -----
const navbar = document.getElementById('navbar');
if (navbar) {
	window.addEventListener('scroll', function () {
		navbar.style.background = window.scrollY > 50 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)';
		navbar.style.boxShadow = window.scrollY > 50 ? '0 4px 30px rgba(0, 0, 0, 0.08)' : '0 2px 20px rgba(0, 0, 0, 0.05)';
	});
}

// ==========================================================
// بخش اسلایدر اصلی هیرو
// ==========================================================
const slides = document.querySelectorAll('.slider-slide');
const dots = document.querySelectorAll('.dot-nav');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const sliderContainer = document.getElementById('sliderContainer');

if (slides.length > 0 && dots.length > 0 && prevBtn && nextBtn && sliderContainer) {
	let currentIndex = 0, slideInterval;

	function goToSlide(index) {
		slides.forEach(s => s.classList.remove('active'));
		dots.forEach(d => d.classList.remove('active'));
		slides[index].classList.add('active');
		dots[index].classList.add('active');
		currentIndex = index;
	}

	function nextSlide() { goToSlide((currentIndex + 1) % slides.length); }
	function prevSlide() { goToSlide((currentIndex - 1 + slides.length) % slides.length); }

	nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
	prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
	dots.forEach(dot => dot.addEventListener('click', function () {
		goToSlide(parseInt(this.dataset.index));
		resetInterval();
	}));

	function startInterval() { slideInterval = setInterval(nextSlide, 5000); }
	function resetInterval() { clearInterval(slideInterval); startInterval(); }

	startInterval();
	sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
	sliderContainer.addEventListener('mouseleave', startInterval);
}

// ==========================================================
// انیمیشن شمارنده آمار (Intersection Observer)
// ==========================================================
const statNumbers = document.querySelectorAll('.stat-number');
if (statNumbers.length > 0) {
	const counterObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const target = parseFloat(entry.target.dataset.target);
				const isDecimal = target % 1 !== 0;
				const step = isDecimal ? 0.1 : Math.max(1, target / 60);
				let current = 0;

				const updateCounter = () => {
					current += step;
					if (current >= target) {
						entry.target.textContent = isDecimal ? target.toFixed(1) : Math.floor(target);
						return;
					}
					entry.target.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
					requestAnimationFrame(updateCounter);
				};

				updateCounter();
				counterObserver.unobserve(entry.target);
			}
		});
	}, { threshold: 0.5 });

	statNumbers.forEach(num => counterObserver.observe(num));
}

// ==========================================================
// عملکرد اسلایدرهای کارتی (Responsive)
// ==========================================================
function initCardSlider(trackId, prevId, nextId) {
	const track = document.getElementById(trackId);
	const prevBtn = document.getElementById(prevId);
	const nextBtn = document.getElementById(nextId);

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

// راه‌اندازی اسلایدرهای کارتی
initCardSlider('plansTrack', 'plansPrev', 'plansNext');
initCardSlider('attractionsTrack', 'attractionsPrev', 'attractionsNext');

// ==========================================================
// اسلایدر مجله گردشگری (با پس‌زمینه متغیر)
// ==========================================================
(function () {
	const slidesTrack = document.getElementById('slidesTrackMag');
	const listContainer = document.getElementById('slideListHorizontalMag');
	const sliderContainer = document.getElementById('sliderContainerMag');
	const magazineSlider = document.getElementById('magazineSlider');

	if (!slidesTrack || !listContainer || !sliderContainer) return;

	const slides = slidesTrack.querySelectorAll('.slide-mag');
	const totalSlides = slides.length;
	if (totalSlides === 0) return;

	let currentIndex = 0;
	let autoSlideInterval, progressInterval;

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

	function resetAutoSlide() {
		if (autoSlideInterval) clearInterval(autoSlideInterval);
		autoSlideInterval = setInterval(() => {
			goToSlide((currentIndex + 1) % totalSlides);
		}, 6500);
	}

	listContainer.querySelectorAll('.list-item-h-mag').forEach((item, index) => {
		item.addEventListener('click', function () {
			const idx = parseInt(this.dataset.index, 10);
			if (idx !== currentIndex) {
				goToSlide(idx);
				resetAutoSlide();
			}
		});
	});

	goToSlide(0);
	resetAutoSlide();

	window.addEventListener('resize', function () {
		slidesTrack.style.transition = 'none';
		slidesTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
		requestAnimationFrame(() => {
			slidesTrack.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
		});
	});
})();

// ----- دکمه اسکرول به بالا -----
const scrollBtn = document.getElementById('scrollTop');
if (scrollBtn) {
	window.addEventListener('scroll', function () { scrollBtn.classList.toggle('visible', window.scrollY > 400); });
	scrollBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}
