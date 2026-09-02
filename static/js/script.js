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
// اسلایدر مجله گردشگری (از دیتابیس)
// ==========================================================
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

	// تابع تغییر پس‌زمینه سکشن - از عکس خود اسلایدر استفاده می‌کنه
	function changeBackground(index) {
		if (magazineSlider && slides[index]) {
			// عکس پس‌زمینه رو از خود اسلایدر بگیر
			const bgBlur = slides[index].querySelector('.slide-bg-blur');
			const bgImage = bgBlur ? bgBlur.style.backgroundImage : '';

			if (bgImage) {
				magazineSlider.style.backgroundImage = bgImage;
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

		// تغییر پس‌زمینه سکشن - از عکس خود اسلایدر
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

	// کلیک روی آیتم‌های لیست
	listContainer.querySelectorAll('.list-item-h-mag').forEach((item, index) => {
		item.addEventListener('click', function () {
			const idx = parseInt(this.dataset.index, 10);
			if (idx !== currentIndex) {
				goToSlide(idx);
				resetAutoSlide();
			}
		});
	});

	// شروع
	goToSlide(0);
	resetAutoSlide();

	// ریسپانسیو
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

// ==========================================================
// سیستم برنامه‌ریز سفر هوشمند (Planner Wizard)
// ==========================================================
(function () {
	'use strict';
	if (!document.getElementById('planWizard')) return;

	// ----- الگوریتم محاسبه تقویم هجری شمسی (جلالی) -----
	const div = (a, b) => ~~(a / b);
	const mod = (a, b) => a - ~~(a / b) * b;

	function jalCal(jy) {
		const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
		let bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jump = 0, i;
		for (i = 1; i < bl; i += 1) {
			const jm = breaks[i];
			jump = jm - jp;
			if (jy < jm) break;
			leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
			jp = jm;
		}
		let n = jy - jp;
		leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
		if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
		const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
		const march = 20 + leapJ - leapG;
		if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
		let leap = mod(mod(n + 1, 33) - 1, 4);
		if (leap === -1) leap = 4;
		return { leap, gy, march };
	}

	function g2d(gy, gm, gd) {
		let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
		d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
		return d;
	}

	function d2g(jdn) {
		let j = 4 * jdn + 139361631;
		j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 390844584;
		const i = div(mod(j, 1461), 4) * 5 + 308;
		return {
			gy: div(j, 1461) - 100100 + div(8 - (mod(div(i, 153), 12) + 1), 6),
			gm: mod(div(i, 153), 12) + 1,
			gd: div(mod(i, 153), 5) + 1
		};
	}

	function j2d(jy, jm, jd) {
		const r = jalCal(jy);
		return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
	}

	function d2j(jdn) {
		let gy = d2g(jdn).gy, jy = gy - 621;
		const r = jalCal(jy);
		let k = jdn - g2d(gy, 3, r.march);
		if (k >= 0) {
			if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
			k -= 186;
		} else { jy -= 1; k += 179; }
		return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
	}

	const jalMonthLen = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy).leap === 0 ? 30 : 29);

	const FA = '۰۱۲۳۴۵۶۷۸۹';
	const faNum = s => String(s).replace(/\d/g, d => FA[d]);
	const pad2 = n => String(n).padStart(2, '0');
	const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
	const ORD = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم'];
	const WDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

	function jWeekday(jy, jm, jd) {
		const g = d2g(j2d(jy, jm, jd));
		return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
	}

	const now = new Date();
	const TODAY = d2j(g2d(now.getFullYear(), now.getMonth() + 1, now.getDate()));
	TODAY.jdn = j2d(TODAY.jy, TODAY.jm, TODAY.jd);

	try {
		const parts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
		const iy = +parts.find(p => p.type === 'year').value;
		const im = +parts.find(p => p.type === 'month').value;
		const idd = +parts.find(p => p.type === 'day').value;
		if (iy > 1300 && (iy !== TODAY.jy || im !== TODAY.jm || idd !== TODAY.jd)) {
			TODAY.jy = iy; TODAY.jm = im; TODAY.jd = idd;
			TODAY.jdn = j2d(iy, im, idd);
		}
	} catch (e) { }

	const maxG = new Date(now.getTime() + 365 * 86400000);
	const MAXJ = d2j(g2d(maxG.getFullYear(), maxG.getMonth() + 1, maxG.getDate()));

	const fmtFull = j => `${WDAYS[jWeekday(j.jy, j.jm, j.jd)]} ${faNum(j.jy)}/${faNum(pad2(j.jm))}/${faNum(pad2(j.jd))}`;
	const fmtShort = j => `${faNum(j.jy)}/${faNum(pad2(j.jm))}/${faNum(pad2(j.jd))}`;

	function calcDistance(lat1, lng1, lat2, lng2) {
		const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
		const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}

	const $ = id => document.getElementById(id);
	const calGrid = $('calGrid'), calTitle = $('calTitle'), calPrev = $('calPrev'), calNext = $('calNext');
	let viewY = TODAY.jy, viewM = TODAY.jm, tripStart = null, tripEnd = null;

	function safeView() {
		if (!Number.isFinite(viewY) || !Number.isFinite(viewM) || viewM < 1 || viewM > 12 || viewY < 1300) {
			viewY = TODAY.jy; viewM = TODAY.jm;
		}
	}

	function cellEmpty() {
		const b = document.createElement('button');
		b.type = 'button'; b.className = 'cal-day empty'; b.disabled = true;
		return b;
	}

	function renderCalendar() {
		safeView();
		calTitle.textContent = `${MONTHS[viewM - 1]} ${faNum(viewY)}`;
		calGrid.innerHTML = '';

		const firstWd = jWeekday(viewY, viewM, 1);
		const len = jalMonthLen(viewY, viewM);

		for (let i = 0; i < firstWd; i++) calGrid.appendChild(cellEmpty());

		for (let d = 1; d <= len; d++) {
			const jdn = j2d(viewY, viewM, d);
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'cal-day';
			btn.textContent = faNum(d);

			if (jWeekday(viewY, viewM, d) === 6) btn.classList.add('friday');
			if (jdn === TODAY.jdn) btn.classList.add('today');
			if (jdn < TODAY.jdn) btn.disabled = true;

			if (tripStart && jdn === tripStart.jdn) btn.classList.add('range-start');
			if (tripEnd && jdn === tripEnd.jdn) btn.classList.add('range-end');
			if (tripStart && tripEnd && jdn > tripStart.jdn && jdn < tripEnd.jdn) btn.classList.add('in-range');

			btn.addEventListener('click', () => onDayClick({ jy: viewY, jm: viewM, jd: d, jdn }));
			calGrid.appendChild(btn);
		}

		const trail = (7 - ((firstWd + len) % 7)) % 7;
		for (let i = 0; i < trail; i++) calGrid.appendChild(cellEmpty());

		calPrev.disabled = (viewY * 12 + viewM) <= (TODAY.jy * 12 + TODAY.jm);
		calNext.disabled = (viewY * 12 + viewM) >= (MAXJ.jy * 12 + MAXJ.jm);
	}

	function onDayClick(d) {
		$('dateHint').textContent = '';
		if (!tripStart || (tripStart && tripEnd)) {
			tripStart = d; tripEnd = null;
		} else if (d.jdn < tripStart.jdn) {
			tripStart = d; tripEnd = null;
		} else {
			if (d.jdn - tripStart.jdn + 1 > 7) {
				$('dateHint').textContent = 'برنامه سفر حداکثر ۷ روز پشتیبانی می‌شود؛ تاریخ نزدیک‌تری انتخاب کنید.';
				return;
			}
			tripEnd = d;
		}
		renderCalendar();
		updateDateBoxes();
	}

	function updateDateBoxes() {
		$('dbStart').textContent = tripStart ? fmtFull(tripStart) : 'هنوز انتخاب نشده';
		$('dbEnd').textContent = tripEnd ? fmtFull(tripEnd) : 'هنوز انتخاب نشده';
	}

	calPrev.addEventListener('click', () => { safeView(); viewM--; if (viewM < 1) { viewM = 12; viewY--; } renderCalendar(); });
	calNext.addEventListener('click', () => { safeView(); viewM++; if (viewM > 12) { viewM = 1; viewY++; } renderCalendar(); });
	renderCalendar();

	// ----- مدیریت علاقه‌مندی‌ها -----
	const interestBtns = [...document.querySelectorAll('.interest-card')];
	interestBtns.forEach(b => b.addEventListener('click', () => {
		b.classList.toggle('selected');
		updateIntCount();
		$('wzHint').textContent = '';
	}));

	function updateIntCount() {
		$('interestCount').textContent = `${faNum(interestBtns.filter(b => b.classList.contains('selected')).length)} از ${faNum(interestBtns.length)}`;
	}

	$('clearInterests').addEventListener('click', e => {
		e.preventDefault();
		interestBtns.forEach(b => b.classList.remove('selected'));
		updateIntCount();
	});
	updateIntCount();

	// ----- ناوبری بین مراحل ویزارد -----
	const TITLES = {
		1: 'تاریخ سفرت رو مشخص کن',
		2: 'علایقت رو مشخص کن',
		3: 'جزئیات سفر رو وارد کن',
		4: 'مرور برنامه سفر'
	};
	let wizStep = 1;

	function goWiz(n) {
		wizStep = n;
		$('wzHint').textContent = '';
		document.querySelectorAll('.wz-step').forEach(s => s.classList.toggle('active', +s.dataset.step === n));
		$('wizTitle').textContent = TITLES[n];

		const stepItems = document.querySelectorAll('.step-item');
		const stepLines = document.querySelectorAll('.step-line');
		stepItems.forEach(el => {
			const step = parseInt(el.dataset.step);
			el.classList.remove('active', 'done');
			if (step === n) el.classList.add('active');
			else if (step < n) el.classList.add('done');
		});
		stepLines.forEach((el, i) => {
			if (i + 1 < n) el.classList.add('done');
			else el.classList.remove('done');
		});

		$('wizPrev').style.visibility = n === 1 ? 'hidden' : 'visible';

		const next = $('wizNext');
		next.innerHTML = n === 4 ? 'ساخت برنامه <i class="fas fa-magic"></i>' : 'مرحله بعد <i class="fas fa-arrow-left"></i>';
		next.classList.toggle('submit', n === 4);

		if (n === 3 && tripStart && tripEnd) {
			$('tripDaysInfo').innerHTML = `<i class="fas fa-calendar-check"></i> مدت سفر شما: ${faNum(tripEnd.jdn - tripStart.jdn + 1)} روز`;
		}
		if (n === 4) buildReview();
		document.getElementById('planWizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	$('wizPrev').addEventListener('click', () => goWiz(Math.max(1, wizStep - 1)));
	$('wizNext').addEventListener('click', () => {
		if (wizStep === 1 && (!tripStart || !tripEnd)) {
			$('dateHint').textContent = 'لطفاً روز شروع و پایان سفر را روی تقویم انتخاب کنید.';
			return;
		}
		if (wizStep === 2 && !interestBtns.some(b => b.classList.contains('selected'))) {
			$('wzHint').textContent = 'لطفاً حداقل یک دسته‌بندی انتخاب کنید.';
			return;
		}
		if (wizStep < 4) goWiz(wizStep + 1);
		else submitPlan();
	});

	function buildReview() {
		const sel = interestBtns.filter(b => b.classList.contains('selected'));
		$('rvStart').textContent = fmtShort(tripStart);
		$('rvEnd').textContent = fmtShort(tripEnd);
		$('rvDays').textContent = `${faNum(tripEnd.jdn - tripStart.jdn + 1)} روز`;
		$('rvIntCount').textContent = faNum(sel.length);
		$('rvChips').innerHTML = sel.map(b => `<span class="rv-chip">${b.querySelector('.ic-emoji').textContent} ${b.querySelector('.ic-label').textContent}</span>`).join('');
		const trav = $('travelersCount'), bud = $('budgetRange');
		const child = document.querySelector('input[name="hasChild"]:checked').value === 'true';
		$('rvDetails').textContent = `${trav.options[trav.selectedIndex].text} • بودجه: ${bud.options[bud.selectedIndex].text} • ${child ? 'کودک همراه دارد' : 'بدون کودک'}`;
	}

	const REAL_PLACES = [
		{ id: 1, name: 'پل قدیم دزفول', category: 'تاریخی', cost: 0, duration: 90, lat: 32.3833, lng: 48.4000, is_child_friendly: true, image: './img/pl-e-ghadim.jpg' },
		{ id: 2, name: 'آبشار شوی', category: 'طبیعی', cost: 0, duration: 120, lat: 32.8833, lng: 48.5000, is_child_friendly: false, image: './img/abshear-shooy.jpg' },
		{ id: 3, name: 'بازار کهنه دزفول', category: 'تفریحی', cost: 50000, duration: 60, lat: 32.3733, lng: 48.4100, is_child_friendly: true, image: './img/bazar-kohneh.jpg' },
		{ id: 4, name: 'خانه تیزنو', category: 'تاریخی', cost: 0, duration: 45, lat: 32.3900, lng: 48.4150, is_child_friendly: true, image: './img/khaneh-tizno.jpg' },
		{ id: 5, name: 'دره کول خرسان', category: 'طبیعی', cost: 0, duration: 150, lat: 32.7833, lng: 48.6000, is_child_friendly: false, image: './img/darreh-kool.jpg' },
		{ id: 6, name: 'پارک ساحلی دولت', category: 'تفریحی', cost: 20000, duration: 90, lat: 32.3700, lng: 48.3900, is_child_friendly: true, image: './img/park-dolat.jpg' },
		{ id: 7, name: 'مسجد جامع دزفول', category: 'تاریخی', cost: 0, duration: 60, lat: 32.3850, lng: 48.4050, is_child_friendly: true, image: './img/masjed-jameh.jpg' },
		{ id: 8, name: 'دانشگاه جندی شاپور', category: 'تاریخی', cost: 0, duration: 45, lat: 32.3500, lng: 48.4200, is_child_friendly: true, image: './img/jondishapour.jpg' },
		{ id: 9, name: 'رودخانه دز', category: 'طبیعی', cost: 0, duration: 60, lat: 32.3600, lng: 48.3800, is_child_friendly: true, image: './img/roodkhaneh-dez.jpg' },
		{ id: 10, name: 'تفرجگاه علی‌کله', category: 'تفریحی', cost: 30000, duration: 90, lat: 32.3800, lng: 48.3700, is_child_friendly: true, image: './img/alikaleh.jpg' },
		{ id: 11, name: 'آسیاب‌های آبی دزفول', category: 'تاریخی', cost: 0, duration: 30, lat: 32.3880, lng: 48.4080, is_child_friendly: true, image: './img/asiyab-haye-abi.jpg' },
		{ id: 12, name: 'دژ محمدعلی‌خان', category: 'تاریخی', cost: 0, duration: 45, lat: 32.3950, lng: 48.4120, is_child_friendly: true, image: './img/dezh-mohammad.jpg' },
		{ id: 13, name: 'موزه دزفول', category: 'تاریخی', cost: 30000, duration: 60, lat: 32.3820, lng: 48.4020, is_child_friendly: true, image: './img/moze-dezfool.jpg' },
		{ id: 14, name: 'پارک جنگلی دزفول', category: 'تفریحی', cost: 10000, duration: 120, lat: 32.3500, lng: 48.4500, is_child_friendly: true, image: './img/park-jangali.jpg' }
	];

	const RATINGS = {
		'پل قدیم دزفول': 4.8, 'آبشار شوی': 4.7, 'بازار کهنه دزفول': 4.5,
		'خانه تیزنو': 4.2, 'دره کول خرسان': 4.3, 'پارک ساحلی دولت': 4.0,
		'مسجد جامع دزفول': 4.6, 'دانشگاه جندی شاپور': 4.4, 'رودخانه دز': 4.1,
		'تفرجگاه علی‌کله': 3.9, 'آسیاب‌های آبی دزفول': 4.3, 'دژ محمدعلی‌خان': 4.0,
		'موزه دزفول': 4.2, 'پارک جنگلی دزفول': 3.8
	};

	const FAMOUS = ['پل قدیم دزفول', 'آبشار شوی', 'بازار کهنه دزفول', 'مسجد جامع دزفول', 'دانشگاه جندی شاپور'];

	function getRecommendations(cats, opt) {
		const maxB = Number(opt.budgetStr.split('-')[1]) || 5000000;

		const scored = REAL_PLACES.map(p => {
			const catS = cats.includes(p.category) ? 100 : 30;
			const budS = p.cost === 0 ? 100 : (p.cost <= maxB * 0.2 ? 90 : p.cost <= maxB * 0.5 ? 70 : p.cost <= maxB ? 40 : 10);
			const childS = (opt.hasChild || opt.family) ? (p.is_child_friendly ? 100 : 0) : 70;
			const durS = p.duration <= 60 ? 100 : p.duration <= 90 ? 85 : p.duration <= 120 ? 65 : 45;
			const famS = FAMOUS.includes(p.name) ? 100 : 30;
			const ratS = ((RATINGS[p.name] || 3.5) / 5) * 100;
			return { ...p, score: Math.round(catS * .3 + budS * .25 + childS * .15 + durS * .1 + famS * .1 + ratS * .1) };
		});

		scored.sort((a, b) => b.score - a.score);

		const maxDays = Math.max(1, Math.min(opt.duration, 7));
		const perDay = Math.min(4, Math.max(2, Math.ceil(scored.length / maxDays)));
		const center = { lat: 32.3833, lng: 48.4000 };

		const prox = (la, ln) => {
			const d = calcDistance(la, ln, center.lat, center.lng);
			return d <= 2 ? 100 : d <= 5 ? 80 : d <= 10 ? 60 : d <= 20 ? 40 : 20;
		};

		const usedIds = new Set();
		const days = [];

		for (let day = 0; day < maxDays; day++) {
			const rem = scored.filter(p => !usedIds.has(p.id));
			if (!rem.length) break;

			let anchor = rem[0], best = -1;
			rem.forEach(p => {
				const s = p.score * 0.6 + prox(p.lat, p.lng) * 0.4;
				if (s > best) { best = s; anchor = p; }
			});

			const dayPlaces = [anchor];
			usedIds.add(anchor.id);

			while (dayPlaces.length < perDay) {
				let next = null, bestS = -Infinity;
				const last = dayPlaces[dayPlaces.length - 1];
				rem.forEach(p => {
					if (usedIds.has(p.id)) return;
					const d = calcDistance(last.lat, last.lng, p.lat, p.lng);
					let s = p.score * 0.5 + prox(p.lat, p.lng) * 0.2 - d * 0.8;
					if (d > 30) s -= 20;
					if (s > bestS) { bestS = s; next = p; }
				});
				if (!next) break;
				dayPlaces.push(next);
				usedIds.add(next.id);
			}

			dayPlaces.sort((a, b) => calcDistance(center.lat, center.lng, a.lat, a.lng) - calcDistance(center.lat, center.lng, b.lat, b.lng));
			days.push(dayPlaces);
		}
		return days;
	}

	let plannerMeta = null, activeTab = 'all';
	const faTime = m => `${faNum(Math.floor(m / 60))}:${faNum(pad2(m % 60))}`;

	function submitPlan() {
		const sel = interestBtns.filter(b => b.classList.contains('selected'));
		if (!sel.length) { alert('لطفاً حداقل یک علاقه‌مندی انتخاب کنید.'); return; }
		if (!tripStart || !tripEnd) { alert('لطفاً تاریخ سفر را انتخاب کنید.'); return; }

		const cats = [...new Set(sel.flatMap(b => (b.dataset.maps || '').split(',').filter(Boolean)))];
		const days = getRecommendations(cats, {
			family: sel.some(b => b.dataset.value === 'خانوادگی'),
			budgetStr: $('budgetRange').value,
			duration: tripEnd.jdn - tripStart.jdn + 1,
			hasChild: document.querySelector('input[name="hasChild"]:checked').value === 'true'
		});

		if (!days.length) { alert('جاذبه‌ای پیدا نشد؛ انتخاب‌ها را تغییر دهید.'); return; }

		plannerMeta = { days, startJdn: j2d(tripStart.jy, tripStart.jm, tripStart.jd) };
		activeTab = 'all';
		$('planWizard').style.display = 'none';
		$('resultSection').classList.add('visible');
		document.body.classList.add('result-open');
		document.body.style.overflow = 'hidden';
		renderAll();
		$('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	$('editPlanBtn').addEventListener('click', () => {
		$('resultSection').classList.remove('visible');
		document.body.classList.remove('result-open');
		$('planWizard').style.display = '';
		document.body.style.overflow = '';
		plannerMeta = null;
		activeTab = 'all';
		goWiz(1);
	});

	const dayDate = i => d2j(plannerMeta.startJdn + i);

	function schedule(dayPlaces) {
		let cur = 9 * 60;
		return dayPlaces.map((p, idx) => {
			const s = cur, e = cur + p.duration;
			cur = e + 30;
			if (cur > 23 * 60 + 30) cur = 9 * 60;
			const dist = idx ? calcDistance(dayPlaces[idx - 1].lat, dayPlaces[idx - 1].lng, p.lat, p.lng) : 0;
			return { p, s: s % 1440, e: e % 1440, dist };
		});
	}

	const distTxt = km => km < 1 ? `${faNum(Math.round(km * 1000))} متر` : `حدود ${faNum(Math.round(km))} کیلومتر`;

	function cardsHtml(dayPlaces, di) {
		return schedule(dayPlaces).map((it, idx) => `
    <div class="place-row">
        <span class="place-num">${faNum(idx + 1)}</span>
        <div class="place-card">
            <img class="pc-img" src="${it.p.image}" alt="${it.p.name}" onerror="this.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
            <div class="pc-info">
                <h4>${it.p.name}</h4>
                <div class="pc-time">🕒 ${faTime(it.s)} تا ${faTime(it.e)}</div>
                <div class="pc-meta">
                    <span>🏷️ ${it.p.category}</span>
                    <span>💰 ${it.p.cost === 0 ? 'رایگان' : faNum(it.p.cost.toLocaleString()) + ' تومان'}</span>
                </div>
            </div>
            <div class="pc-side">
                <span class="dist-chip">${idx === 0 ? '🚩 شروع روز' : '🚗 ' + distTxt(it.dist)}</span>
                <div class="pc-actions">
                    <span class="pc-score">⭐ ${faNum(it.p.score)}</span>
                    <button type="button" class="icon-btn pc-more" data-day="${di}" data-idx="${idx}" title="گزینه‌های بیشتر"><i class="fas fa-ellipsis-h"></i></button>
                </div>
            </div>
        </div>
    </div>`).join('');
	}

	function renderAll() {
		if (!plannerMeta || !plannerMeta.days.length) return;
		const days = plannerMeta.days;
		if (activeTab !== 'all' && (+activeTab >= days.length || +activeTab < 0)) activeTab = 'all';

		const st = d2j(plannerMeta.startJdn);
		const endD = d2j(plannerMeta.startJdn + days.length - 1);
		const mName = jm => MONTHS[(jm | 0) - 1] || '';

		const monthRange = st.jm === endD.jm
			? `${faNum(st.jd)} تا ${faNum(endD.jd)} ${mName(st.jm)}`
			: `${faNum(st.jd)} ${mName(st.jm)} تا ${faNum(endD.jd)} ${mName(endD.jm)}`;

		$('phSub').textContent = `${faNum(days.length)} روز - ${monthRange}`;

		$('plannerTabs').innerHTML = `<button class="ptab ${activeTab === 'all' ? 'active' : ''}" data-tab="all"><span class="t">نمای کلی</span><span class="s">همه روزها</span></button>` +
			days.map((_, i) => `<button class="ptab ${activeTab === i ? 'active' : ''}" data-tab="${i}"><span class="t">روز ${ORD[i] || faNum(i + 1)}</span><span class="s">${mName(dayDate(i).jm)} ${faNum(dayDate(i).jd)}</span></button>`).join('');

		$('plannerDays').innerHTML = activeTab === 'all'
			? days.map((d, i) => `<div class="day-block"><div class="day-block-title">روز ${faNum(i + 1)} <span>${mName(dayDate(i).jm)} ${faNum(dayDate(i).jd)}</span></div>${cardsHtml(d, i)}</div>`).join('')
			: cardsHtml(days[+activeTab], +activeTab);

		$('mapDayChips').innerHTML = `<button class="map-chip ${activeTab === 'all' ? 'active' : ''}" data-tab="all">همه</button>` +
			days.map((_, i) => `<button class="map-chip ${activeTab === i ? 'active' : ''}" data-tab="${i}">روز ${faNum(i + 1)}</button>`).join('');

		showOnMap();
	}

	document.getElementById('resultSection').addEventListener('click', e => {
		const t = e.target.closest('[data-tab]');
		if (t) {
			activeTab = t.dataset.tab === 'all' ? 'all' : parseInt(t.dataset.tab, 10);
			renderAll();
		}
	});

	function showOnMap() {
		if (typeof L === 'undefined' || !$('resultMap') || !plannerMeta || !plannerMeta.days) return;

		if (window.mapInstance) { window.mapInstance.remove(); window.mapInstance = null; }

		window.mapInstance = L.map('resultMap', { zoomControl: false });
		L.control.zoom({ position: 'bottomright' }).addTo(window.mapInstance);
		L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap &copy; CARTO',
			maxZoom: 19
		}).addTo(window.mapInstance);

		const all = [];
		const drawDay = places => {
			const pts = [];
			schedule(places).forEach((it, idx) => {
				const marker = L.marker([it.p.lat, it.p.lng], {
					icon: L.divIcon({
						className: 'pin-wrap',
						html: `<div class="pin"><span>${faNum(idx + 1)}</span></div><div class="pin-label">${it.p.name}</div>`,
						iconSize: [30, 44],
						iconAnchor: [15, 33],
						popupAnchor: [0, -34]
					})
				})
					.addTo(window.mapInstance)
					.bindPopup(`
                    <div class="map-pop">
                        <div class="map-pop-img">
                            <img src="${it.p.image}" alt="${it.p.name}" onerror="this.parentNode.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
                            <span class="map-pop-badge">${it.p.category}</span>
                        </div>
                        <div class="map-pop-body">
                            <h4>${it.p.name}</h4>
                            <div class="map-pop-loc"><i class="fas fa-map-marker-alt"></i> دزفول، خوزستان</div>
                            <p>${it.p.desc || ''}</p>
                        </div>
                    </div>`);

				marker.on('mouseover', () => marker.openPopup());
				marker.on('mouseout', () => marker.closePopup());

				pts.push([it.p.lat, it.p.lng]);
				all.push([it.p.lat, it.p.lng]);
			});
			if (pts.length > 1) L.polyline(pts, { color: '#2a9d8f', weight: 4, opacity: .85, dashArray: '8 8', lineCap: 'round' }).addTo(window.mapInstance);
		};

		if (activeTab === 'all') plannerMeta.days.forEach(d => drawDay(d));
		else if (plannerMeta.days[+activeTab]) drawDay(plannerMeta.days[+activeTab]);

		if (all.length) window.mapInstance.fitBounds(L.latLngBounds(all), { padding: [50, 50] });
		setTimeout(() => window.mapInstance && window.mapInstance.invalidateSize(), 400);
	}

	const moreMenu = $('moreMenu');
	let menuTarget = null;

	document.addEventListener('click', e => {
		const more = e.target.closest('.pc-more');
		if (more) {
			e.stopPropagation();
			menuTarget = { day: +more.dataset.day, idx: +more.dataset.idx };
			const r = more.getBoundingClientRect();
			moreMenu.style.top = Math.min(r.bottom + 6, innerHeight - 160) + 'px';
			moreMenu.style.left = Math.max(10, r.left - 180) + 'px';
			moreMenu.classList.add('open');
			return;
		}
		if (!e.target.closest('.more-menu')) moreMenu.classList.remove('open');
	});

	moreMenu.addEventListener('click', e => {
		const btn = e.target.closest('button');
		if (!btn || !menuTarget || !plannerMeta) { moreMenu.classList.remove('open'); return; }

		const { day, idx } = menuTarget;
		if (!plannerMeta.days[day] || !plannerMeta.days[day][idx]) {
			moreMenu.classList.remove('open'); menuTarget = null; return;
		}

		const cur = plannerMeta.days[day][idx];
		moreMenu.classList.remove('open');

		if (btn.dataset.act === 'route') { activeTab = day; renderAll(); }

		if (btn.dataset.act === 'remove') {
			plannerMeta.days[day].splice(idx, 1);
			plannerMeta.days = plannerMeta.days.filter(d => d && d.length);
			if (!plannerMeta.days.length) {
				alert('همه‌ی جاذبه‌ها حذف شدند. لطفاً دوباره برنامه‌ریزی کنید.');
				$('editPlanBtn').click();
				return;
			}
			menuTarget = null;
			renderAll();
		}

		if (btn.dataset.act === 'replace') {
			const usedIds = new Set(plannerMeta.days.flat().map(p => p.id));
			let cand = REAL_PLACES.filter(p => !usedIds.has(p.id) && p.category === cur.category);
			if (!cand.length) cand = REAL_PLACES.filter(p => !usedIds.has(p.id));
			if (!cand.length) { alert('جاذبه جایگزینی در دسترس نیست.'); menuTarget = null; return; }
			plannerMeta.days[day][idx] = cand[Math.floor(Math.random() * cand.length)];
			menuTarget = null;
			renderAll();
		}
	});

	document.addEventListener('keydown', e => { if (e.key === 'Escape') moreMenu.classList.remove('open'); });
})();

// ==========================================================
// Article Page — داده، رندر، TOC، related، progress و comments UI
// ==========================================================
(function () {
	'use strict';
	const root = document.getElementById('articlePage');
	if (!root || !window.TravelArticles) return;

	const articles = window.TravelArticles.articles;
	const params = new URLSearchParams(window.location.search);
	const slug = params.get('slug') || articles[0]?.slug;
	const article = window.TravelArticles.getBySlug(slug) || articles[0];
	if (!article) return;

	const $ = (sel, parent = document) => parent.querySelector(sel);
	const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
	const faNum = window.TravelArticles.faNum;
	const slugUrl = a => `./article.html?slug=${a.slug}`;

	const title = $('[data-article-title]');
	const excerpt = $('[data-article-excerpt]');
	const cover = $('[data-article-cover]');
	const body = $('[data-article-body]');
	const relatedTrack = $('[data-related-track]');
	const relatedDots = $('[data-related-dots]');
	const relatedPrev = $('[data-related-prev]');
	const relatedNext = $('[data-related-next]');
	const toc = $('[data-article-toc]');

	title.textContent = article.title;
	excerpt.textContent = article.excerpt || article.desc;
	$$('[data-article-category]').forEach(el => el.textContent = article.category);
	$$('[data-article-author]').forEach(el => el.textContent = article.author);
	$$('[data-article-date]').forEach(el => el.textContent = article.date);
	$$('[data-article-duration]').forEach(el => el.textContent = `${faNum(article.duration)} دقیقه`);
	$$('[data-article-views]').forEach(el => el.textContent = faNum(article.views.toLocaleString('en-US')));
	cover.src = article.image;
	cover.alt = article.title;
	document.title = article.seoTitle || `${article.title} | سفر به دزفول`;
	const metaDescription = document.querySelector('meta[name="description"]');
	if (metaDescription) metaDescription.setAttribute('content', article.seoDescription || article.desc);

	function renderBlocks() {
		body.innerHTML = '';
		let headingIndex = 0;
		const blocks = article.content || article.blocks || [];
		blocks.forEach(block => {
			let el;
			switch (block.type) {
				case 'lead':
					el = document.createElement('p'); el.className = 'article-lead'; el.textContent = block.text; break;
				case 'heading':
					headingIndex++; el = document.createElement('h2'); el.className = 'article-heading'; el.id = block.id || `article-heading-${headingIndex}`; el.textContent = block.text; break;
				case 'paragraph':
					el = document.createElement('p'); el.className = 'article-paragraph'; el.textContent = block.text; break;
				case 'quote':
					el = document.createElement('blockquote'); el.className = 'article-quote'; el.innerHTML = `<i class="fas fa-quote-right"></i><span>${block.text}</span>`; break;
				case 'image':
					el = document.createElement('figure'); el.className = 'article-figure'; el.innerHTML = `<img src="${block.src}" alt="${block.alt || article.title}"><figcaption>${block.caption || ''}</figcaption>`; break;
				default: return;
			}
			body.appendChild(el);
		});
	}

	function renderTOC() {
		toc.innerHTML = '';
		const headings = $$('.article-heading', body);
		if (!headings.length) { toc.closest('.article-toc-card')?.classList.add('is-empty'); return; }
		headings.forEach((h, i) => {
			const a = document.createElement('a');
			a.href = `#${h.id}`;
			a.innerHTML = `<span>${faNum(i + 1)}</span>${h.textContent}`;
			a.addEventListener('click', e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
			toc.appendChild(a);
		});
	}

	function renderRelated() {
		const items = window.TravelArticles.related(article, 8);
		relatedTrack.innerHTML = items.map((a, index) => `
			<a class="article-related-card" href="${slugUrl(a)}">
				<div class="article-related-image">
					<img src="${a.image}" alt="${a.title}" loading="lazy">
					<span>${a.category}</span>
					<em>${faNum(index + 1).padStart(2, '۰')}</em>
				</div>
				<div class="article-related-body">
					<h3>${a.title}</h3>
					<div class="article-related-meta"><span><i class="far fa-clock"></i> ${faNum(a.duration)} دقیقه</span><span><i class="far fa-eye"></i> ${faNum(a.views.toLocaleString('en-US'))}</span></div>
					<div class="article-related-read">خواندن مقاله <i class="fas fa-arrow-left"></i></div>
				</div>
			</a>`).join('');

		const originalCards = Array.from(relatedTrack.children);
		const cloneCount = Math.min(3, originalCards.length);
		originalCards.slice(0, cloneCount).forEach(card => {
			relatedTrack.appendChild(card.cloneNode(true));
		});

		const getPerView = () => window.innerWidth <= 760 ? 1 : (window.innerWidth <= 1100 ? 2 : 4);
		let position = 0;
		let autoplayTimer = null;
		let resumeTimer = null;

		function getMetrics() {
			const perView = getPerView();
			const viewport = relatedTrack.parentElement;
			const gap = parseFloat(getComputedStyle(relatedTrack).gap) || 18;
			const cardWidth = (viewport.clientWidth - gap * (perView - 1)) / perView;
			const maxPosition = Math.max(0, items.length - 1);
			return { perView, maxPosition, step: cardWidth + gap };
		}

		function setPosition(nextPosition, smooth = true) {
			const { maxPosition, step } = getMetrics();
			position = ((nextPosition % (maxPosition + 1)) + (maxPosition + 1)) % (maxPosition + 1);

			relatedTrack.style.transition = smooth ? 'transform .65s cubic-bezier(.22,.61,.36,1)' : 'none';
			relatedTrack.style.transform = `translate3d(${position * step}px,0,0)`;

			if (relatedPrev) relatedPrev.disabled = maxPosition <= 0;
			if (relatedNext) relatedNext.disabled = maxPosition <= 0;

			if (relatedDots) {
				relatedDots.querySelectorAll('button').forEach((dot, i) => {
					dot.classList.toggle('active', i === position);
					dot.setAttribute('aria-current', i === position ? 'true' : 'false');
				});
			}
		}

		function moveNext() { setPosition(position + 1, true); }
		function movePrev() { setPosition(position - 1, true); }

		function startAutoplay() {
			clearInterval(autoplayTimer);
			clearTimeout(resumeTimer);
			if (items.length > getPerView()) {
				autoplayTimer = setInterval(moveNext, 5000);
			}
		}

		function pauseAutoplay() {
			clearInterval(autoplayTimer);
			clearTimeout(resumeTimer);
			resumeTimer = setTimeout(startAutoplay, 7000);
		}

		function buildDots() {
			if (!relatedDots) return;
			const { maxPosition } = getMetrics();
			relatedDots.innerHTML = '';

			for (let i = 0; i <= maxPosition; i++) {
				const b = document.createElement('button');
				b.type = 'button';
				b.className = i === position ? 'active' : '';
				b.setAttribute('aria-label', `نمایش مقالات از ${i + 1}`);
				b.setAttribute('aria-current', i === position ? 'true' : 'false');

				b.addEventListener('click', () => {
					setPosition(i, true);
					startAutoplay();
				});

				relatedDots.appendChild(b);
			}
		}

		if (relatedPrev) relatedPrev.onclick = () => { movePrev(); startAutoplay(); };
		if (relatedNext) relatedNext.onclick = () => { moveNext(); startAutoplay(); };

		let resizeTimer;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				buildDots();
				setPosition(position, false);
				startAutoplay();
			}, 100);
		});

		buildDots();
		setPosition(0, false);
		startAutoplay();
	}

	function updateProgress() {
		const doc = document.documentElement;
		const scrollable = doc.scrollHeight - window.innerHeight;
		const percent = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
		const fill = $('.article-reading-progress span'); if (fill) fill.style.width = `${percent}%`;
	}

	function updateActiveTOC() {
		const headings = $$('.article-heading', body);
		let current = headings[0];
		for (const h of headings) if (h.getBoundingClientRect().top <= 150) current = h;
		$$('[data-article-toc] a').forEach(a => a.classList.toggle('active', current && a.getAttribute('href') === `#${current.id}`));
	}

	$$('[data-share]').forEach(btn => btn.addEventListener('click', async () => {
		const type = btn.dataset.share; const url = window.location.href;
		if (type === 'copy') {
			try { await navigator.clipboard.writeText(url); btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1600); } catch (e) { prompt('لینک مقاله:', url); }
		} else if (type === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`, '_blank');
		else if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + url)}`, '_blank');
	}));

	const form = $('[data-comment-form]');
	const commentsList = $('[data-comments-list]');
	form?.addEventListener('submit', e => {
		e.preventDefault();
		const input = $('[name="comment"]', form); const text = input.value.trim();
		if (!text) return;
		const item = document.createElement('article'); item.className = 'comment-item'; item.innerHTML = `<div class="comment-avatar">ش</div><div><div class="comment-head"><strong>شما</strong><span>همین حالا</span></div><p>${text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p></div>`;
		commentsList.prepend(item); input.value = '';
	});

	renderBlocks(); renderTOC(); renderRelated(); updateProgress(); updateActiveTOC();
	window.addEventListener('scroll', () => { updateProgress(); updateActiveTOC(); }, { passive: true });
	window.addEventListener('resize', updateProgress);
})();