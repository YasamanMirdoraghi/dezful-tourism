// ═══════════════════════════════════════════════════════════
// pages/plan.js — ویزارد برنامه‌ریز + تقویم + ارسال
// ═══════════════════════════════════════════════════════════

import { faNum, pad2 } from '../utils/index.js';
import {
    TODAY, MAXJ,
    MONTHS, WDAYS,
    jWeekday, jalMonthLen, j2d, d2j,
    fmtFull, fmtShort
} from '../utils/jalali-calendar.js';
import { getRecommendations } from './plan-algorithm.js';

// ⭐ تابع کمکی برای گرفتن عنصر با id
const $id = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

// ═══════════════════════════════════════════════════════════
// state
// ═══════════════════════════════════════════════════════════
let viewY, viewM;
let tripStart = null, tripEnd = null;
let dailyDurations = {};
const DEFAULT_DURATION = 8;
const MAX_DURATION = 12;   // 🆕 حداکثر ساعت گردش روزانه
const MAX_TRIP_DAYS = 7;
let wizStep = 1;

let interestBtns = [];

// ═══════════════════════════════════════════════════════════
// راه‌اندازی
// ═══════════════════════════════════════════════════════════
export function initPlan() {
    const wizard = $id('planWizard');
    if (!wizard) return;

    viewY = TODAY.jy;
    viewM = TODAY.jm;

    initCalendar();
    initInterests();
    initWizard();
    initDurationPresets();
    initTripsSlider();
}

// ═══════════════════════════════════════════════════════════
// تقویم
// ═══════════════════════════════════════════════════════════
function initCalendar() {
    const calGrid = $id('calGrid');
    if (!calGrid) return;

    renderCalendar();

    const calPrev = $id('calPrev');
    const calNext = $id('calNext');

    calPrev?.addEventListener('click', () => {
        safeView();
        viewM--;
        if (viewM < 1) { viewM = 12; viewY--; }
        renderCalendar();
    });

    calNext?.addEventListener('click', () => {
        safeView();
        viewM++;
        if (viewM > 12) { viewM = 1; viewY++; }
        renderCalendar();
    });
}

function safeView() {
    if (!Number.isFinite(viewY) || !Number.isFinite(viewM) || viewM < 1 || viewM > 12 || viewY < 1300) {
        viewY = TODAY.jy;
        viewM = TODAY.jm;
    }
}

function cellEmpty() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-day empty';
    b.disabled = true;
    return b;
}

function renderCalendar() {
    const calGrid = $id('calGrid');
    const calTitle = $id('calTitle');
    const calPrev = $id('calPrev');
    const calNext = $id('calNext');
    if (!calGrid) return;

    safeView();
    if (calTitle) calTitle.textContent = `${MONTHS[viewM - 1]} ${faNum(viewY)}`;
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

    if (calPrev) calPrev.disabled = (viewY * 12 + viewM) <= (TODAY.jy * 12 + TODAY.jm);
    if (calNext) calNext.disabled = (viewY * 12 + viewM) >= (MAXJ.jy * 12 + MAXJ.jm);
}

function onDayClick(d) {
    const dateHint = $id('dateHint');
    if (dateHint) dateHint.textContent = '';

    if (!tripStart || (tripStart && tripEnd)) {
        tripStart = d;
        tripEnd = null;
    } else if (d.jdn < tripStart.jdn) {
        tripStart = d;
        tripEnd = null;
    } else {
        if (d.jdn - tripStart.jdn + 1 > MAX_TRIP_DAYS) {
            if (dateHint) dateHint.textContent = `برنامه سفر حداکثر ${faNum(MAX_TRIP_DAYS)} روز پشتیبانی می‌شود.`;
            return;
        }
        tripEnd = d;
    }

    dailyDurations = {};
    renderCalendar();
    updateDateBoxes();
}

function updateDateBoxes() {
    const dbStart = $id('dbStart');
    const dbEnd = $id('dbEnd');
    if (dbStart) dbStart.textContent = tripStart ? fmtFull(tripStart) : 'هنوز انتخاب نشده';
    if (dbEnd) dbEnd.textContent = tripEnd ? fmtFull(tripEnd) : 'هنوز انتخاب نشده';
}

// ═══════════════════════════════════════════════════════════
// مدت زمان گردش روزانه
// ═══════════════════════════════════════════════════════════
function renderDurations() {
    const container = $id('durationGrid');
    if (!container || !tripStart || !tripEnd) return;

    const totalDays = tripEnd.jdn - tripStart.jdn + 1;

    const existingCards = container.querySelectorAll('.duration-card');
    for (let i = totalDays; i < existingCards.length; i++) {
        existingCards[i].remove();
    }

    for (let d = 0; d < totalDays; d++) {
        // 🆕 مقدار اولیه و محدودسازی
        if (dailyDurations[d] === undefined || dailyDurations[d] > MAX_DURATION) {
            dailyDurations[d] = Math.min(DEFAULT_DURATION, MAX_DURATION);
        }

        let card = container.querySelector(`.duration-card[data-day="${d}"]`);

        if (!card) {
            card = document.createElement('div');
            card.className = 'duration-card';
            card.dataset.day = d;

            card.innerHTML = `
                <div class="duration-card-header">
                    <div class="duration-day-info">
                        <div class="duration-day-text">
                            <strong>روز ${faNum(d + 1)}</strong>
                        </div>
                    </div>
                    <div class="duration-value" id="durVal-${d}">
                        <strong>${faNum(dailyDurations[d])}</strong>
                        <small>ساعت</small>
                    </div>
                </div>
                <div class="duration-slider-wrap">
                    <input type="range" class="duration-slider" min="0.5" max="12" step="0.5"
                        value="${dailyDurations[d]}" data-day="${d}" id="durSlider-${d}">
                    <div class="duration-marks">
                        <span>۰.۵</span><span>۳</span><span>۶</span><span>۹</span><span>۱۲</span>
                    </div>
                </div>
            `;

            container.appendChild(card);

            const slider = card.querySelector('.duration-slider');
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const percent = ((dailyDurations[d] - min) / (max - min)) * 100;
            slider.style.setProperty('--fill-percent', percent + '%');
            slider.addEventListener('input', handleDurationChange);
        } else {
            const slider = card.querySelector('.duration-slider');
            const valEl = card.querySelector('.duration-value');
            if (slider) slider.value = dailyDurations[d];
            if (valEl) valEl.querySelector('strong').textContent = faNum(dailyDurations[d]);

            if (slider) {
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                const percent = ((dailyDurations[d] - min) / (max - min)) * 100;
                slider.style.setProperty('--fill-percent', percent + '%');
            }
        }
    }

    updateDurationSummary();
}

function handleDurationChange(e) {
    const day = parseInt(e.target.dataset.day);
    const value = parseFloat(e.target.value);
    dailyDurations[day] = value;

    const slider = e.target;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const percent = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--fill-percent', percent + '%');

    const valEl = document.getElementById(`durVal-${day}`);
    if (valEl) valEl.querySelector('strong').textContent = faNum(value);

    document.querySelectorAll('.duration-preset-btn').forEach(b => b.classList.remove('active'));
    updateDurationSummary();
}

function updateDurationSummary() {
    const summary = $id('durationSummary');
    if (!summary) return;

    const values = Object.values(dailyDurations);
    const total = values.reduce((s, v) => s + v, 0);
    const avg = values.length > 0 ? Math.round(total / values.length * 10) / 10 : 0;

    summary.innerHTML = `
        <div class="duration-summary-text">
            <i class="fas fa-clock"></i>
            <span>مجموع گردش: <strong>${faNum(total)}</strong> ساعت در <strong>${faNum(values.length)}</strong> روز</span>
        </div>
        <div class="duration-summary-total">
            <i class="fas fa-chart-line"></i>
            میانگین: ${faNum(avg)} ساعت/روز
        </div>
    `;
}

function initDurationPresets() {
    document.querySelectorAll('.duration-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const hours = parseFloat(btn.dataset.hours);
            const safeHours = Math.min(hours, MAX_DURATION);   // 🆕 محدودسازی
            Object.keys(dailyDurations).forEach(d => { dailyDurations[d] = safeHours; });
            document.querySelectorAll('.duration-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderDurations();
        });
    });

    const resetBtn = $id('durationResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Object.keys(dailyDurations).forEach(d => { dailyDurations[d] = DEFAULT_DURATION; });
            document.querySelectorAll('.duration-preset-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.duration-preset-btn[data-hours="8"]')?.classList.add('active');
            renderDurations();
        });
    }
}

// ═══════════════════════════════════════════════════════════
// علاقه‌مندی‌ها
// ═══════════════════════════════════════════════════════════
function initInterests() {
    interestBtns = [...document.querySelectorAll('.interest-card')];

    interestBtns.forEach(b => b.addEventListener('click', () => {
        b.classList.toggle('selected');
        updateIntCount();
        const wzHint = $id('wzHint');
        if (wzHint) wzHint.textContent = '';
    }));

    updateIntCount();

    const clearBtn = $id('clearInterests');
    if (clearBtn) {
        clearBtn.addEventListener('click', e => {
            e.preventDefault();
            interestBtns.forEach(b => b.classList.remove('selected'));
            updateIntCount();
        });
    }
}

function updateIntCount() {
    const el = $id('interestCount');
    if (el) {
        el.textContent = `${faNum(interestBtns.filter(b => b.classList.contains('selected')).length)} از ${faNum(interestBtns.length)}`;
    }
}

// ═══════════════════════════════════════════════════════════
// ویزارد
// ═══════════════════════════════════════════════════════════
const TITLES = {
    1: 'تاریخ سفرت رو مشخص کن',
    2: 'مدت زمان گردش هر روز',
    3: 'علایقت رو مشخص کن',
    4: 'جزئیات سفر رو وارد کن',
    5: 'مرور برنامه سفر'
};

function initWizard() {
    const prevBtn = $id('wizPrev');
    const nextBtn = $id('wizNext');

    prevBtn?.addEventListener('click', () => goWiz(Math.max(1, wizStep - 1)));

    nextBtn?.addEventListener('click', () => {
        if (wizStep === 5 && !window.isUserAuthenticated()) {
            if (typeof window.showLoginModal === 'function') {
                window.showLoginModal({
                    title: 'برای ساخت برنامه اول وارد شو!',
                    message: 'برای ساختن برنامه سفر شخصی، لازمه اول وارد حساب کاربری خودت بشی.',
                    nextUrl: window.location.pathname
                });
            }
            return;
        }

        if (wizStep === 1 && (!tripStart || !tripEnd)) {
            const dateHint = $id('dateHint');
            if (dateHint) dateHint.textContent = 'لطفاً روز شروع و پایان سفر را انتخاب کنید.';
            return;
        }

        if (wizStep === 2) {
            const totalDays = tripEnd.jdn - tripStart.jdn + 1;
            const allSet = Object.keys(dailyDurations).length === totalDays &&
                Object.values(dailyDurations).every(v => v >= 0.5);
            if (!allSet) {
                const durationHint = $id('durationHint');
                if (durationHint) durationHint.textContent = 'لطفاً مدت زمان گردش هر روز را مشخص کنید.';
                return;
            }
        }

        if (wizStep === 3 && !interestBtns.some(b => b.classList.contains('selected'))) {
            const wzHint = $id('wzHint');
            if (wzHint) wzHint.textContent = 'لطفاً حداقل یک دسته‌بندی انتخاب کنید.';
            return;
        }

        if (wizStep < 5) goWiz(wizStep + 1);
        else submitPlan();
    });
}

function goWiz(n) {
    wizStep = n;

    const wzHint = $id('wzHint');
    if (wzHint) wzHint.textContent = '';
    const durationHint = $id('durationHint');
    if (durationHint) durationHint.textContent = '';

    document.querySelectorAll('.wz-step').forEach(s => s.classList.toggle('active', +s.dataset.step === n));

    const wizTitle = $id('wizTitle');
    if (wizTitle) wizTitle.textContent = TITLES[n];

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

    const prevEl = $id('wizPrev');
    if (prevEl) prevEl.style.visibility = n === 1 ? 'hidden' : 'visible';

    const next = $id('wizNext');
    if (next) {
        next.innerHTML = n === 5 ? 'ساخت برنامه <i class="fas fa-magic"></i>' : 'مرحله بعد <i class="fas fa-arrow-left"></i>';
        next.classList.toggle('submit', n === 5);
    }

    if (n === 4 && tripStart && tripEnd) {
        const info = $id('tripDaysInfo');
        if (info) info.innerHTML = `<i class="fas fa-calendar-check"></i> مدت سفر شما: ${faNum(tripEnd.jdn - tripStart.jdn + 1)} روز`;
    }

    if (n === 2) {
        renderDurations();
    }

    if (n === 5) buildReview();

    const wizard = $id('planWizard');
    if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildReview() {
    const sel = interestBtns.filter(b => b.classList.contains('selected'));
    const rvStart = $id('rvStart');
    const rvEnd = $id('rvEnd');
    const rvDays = $id('rvDays');
    const rvIntCount = $id('rvIntCount');
    const rvChips = $id('rvChips');

    if (rvStart) rvStart.textContent = fmtShort(tripStart);
    if (rvEnd) rvEnd.textContent = fmtShort(tripEnd);
    if (rvDays) rvDays.textContent = `${faNum(tripEnd.jdn - tripStart.jdn + 1)} روز`;
    if (rvIntCount) rvIntCount.textContent = faNum(sel.length);
    if (rvChips) rvChips.innerHTML = sel.map(b => `<span class="rv-chip">${b.querySelector('.ic-emoji').textContent} ${b.querySelector('.ic-label').textContent}</span>`).join('');

    const trav = $id('travelersCount');
    const bud = $id('budgetRange');
    const childRadio = document.querySelector('input[name="hasChild"]:checked');
    const child = childRadio ? childRadio.value === 'true' : false;

    const rvDetails = $id('rvDetails');
    if (rvDetails && trav && bud) {
        rvDetails.textContent = `${trav.options[trav.selectedIndex].text} • بودجه: ${bud.options[bud.selectedIndex].text} • ${child ? 'کودک همراه' : 'بدون کودک'}`;
    }

    const totalHours = Object.values(dailyDurations).reduce((s, v) => s + v, 0);
    const reviewCard = document.querySelector('.review-card');
    if (!reviewCard) return;

    let durationRow = reviewCard.querySelector('.duration-summary-row');
    if (!durationRow) {
        durationRow = document.createElement('div');
        durationRow.className = 'duration-summary-row';
        reviewCard.appendChild(durationRow);
    }

    durationRow.innerHTML = `
        <div class="rv-row" style="border-top: 1px solid rgba(17,139,113,.08); padding-top: 14px; margin-top: 4px;">
            <div class="rv-icon" style="background: rgba(17,139,113,.1); color: var(--primary-green);">
                <i class="fas fa-clock"></i>
            </div>
            <div>
                <span class="rv-label">مدت گردش هر روز</span>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                    ${Object.entries(dailyDurations).map(([day, hours]) =>
                        `<span class="rv-chip" style="font-size: 12px;">روز ${faNum(+day + 1)}: ${faNum(hours)} ساعت</span>`
                    ).join('')}
                </div>
                <div style="margin-top: 10px; font-size: 13px; color: var(--primary-green); font-weight: 800;">
                    مجموع: ${faNum(totalHours)} ساعت گردش
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════
// ارسال برنامه
// ═══════════════════════════════════════════════════════════
function submitPlan() {
    if (!window.isUserAuthenticated()) {
        if (typeof window.showLoginModal === 'function') {
            window.showLoginModal({
                title: 'برای ساخت برنامه اول وارد شو!',
                message: 'برای ساختن برنامه سفر شخصی، لازمه اول وارد حساب کاربری خودت بشی.',
                nextUrl: window.location.pathname
            });
        }
        return;
    }

    const sel = interestBtns.filter(b => b.classList.contains('selected'));
    if (!sel.length) { alert('لطفاً حداقل یک علاقه‌مندی انتخاب کنید.'); return; }
    if (!tripStart || !tripEnd) { alert('لطفاً تاریخ سفر را انتخاب کنید.'); return; }

    const totalDays = tripEnd.jdn - tripStart.jdn + 1;
    const dailyDurationsArr = [];
    for (let d = 0; d < totalDays; d++) {
        dailyDurationsArr.push(dailyDurations[d] || DEFAULT_DURATION);
    }

    const cats = [...new Set(sel.map(b => b.dataset.value))];

    const nextBtn = $id('wizNext');
    const originalHTML = nextBtn ? nextBtn.innerHTML : '';
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ساخت...';
    }

    setTimeout(() => {
        try {
            const days = getRecommendations(cats, {
                budgetStr: $id('budgetRange').value,
                duration: totalDays,
                hasChild: document.querySelector('input[name="hasChild"]:checked').value === 'true',
                dailyDurations: dailyDurationsArr,
            }, msg => { if (window.dbg) window.dbg(msg); });

            if (!days.length) {
                alert('جاذبه‌ای پیدا نشد؛ انتخاب‌ها را تغییر دهید.');
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.innerHTML = originalHTML;
                }
                return;
            }

            const form = $id('saveTripForm');
            $id('saveStartDate').value = `${tripStart.jy}/${pad2(tripStart.jm)}/${pad2(tripStart.jd)}`;
            $id('saveEndDate').value = `${tripEnd.jy}/${pad2(tripEnd.jm)}/${pad2(tripEnd.jd)}`;
            $id('saveDurationDays').value = totalDays;
            $id('saveCompanions').value = $id('travelersCount').value;
            $id('saveHasChildren').value = document.querySelector('input[name="hasChild"]:checked').value;
            $id('saveBudgetToman').value = $id('budgetRange').value;
            $id('saveInterests').value = JSON.stringify(cats);
            $id('saveDailyDurations').value = JSON.stringify(dailyDurationsArr);

            const placesData = days.map((dayPlaces, dayIndex) =>
                dayPlaces.map(p => ({
                    id: p.id, name: p.name, lat: p.lat, lng: p.lng,
                    category: p.category, cost: p.cost, duration: p.duration,
                    score: p.score, day: dayIndex + 1
                }))
            ).flat();
            $id('saveSuggestedPlaces').value = JSON.stringify(placesData);

            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'ok' && data.redirect_url) {
                        window.location.href = data.redirect_url;
                    } else {
                        alert('خطا در ذخیره سفر');
                        if (nextBtn) {
                            nextBtn.disabled = false;
                            nextBtn.innerHTML = originalHTML;
                        }
                    }
                })
                .catch(err => {
                    console.error('❌ خطا:', err);
                    form.submit();
                });
        } catch (err) {
            console.error(err);
            alert('خطا در ساخت برنامه: ' + err.message);
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.innerHTML = originalHTML;
            }
        }
    }, 100);
}

// ═══════════════════════════════════════════════════════════
// اسلایدر سفرهای اخیر
// ═══════════════════════════════════════════════════════════
function initTripsSlider() {
    const track = $id('tripsTrack');
    const viewport = $id('tripsViewport');
    const prevBtn = $id('tripsPrev');
    const nextBtn = $id('tripsNext');
    const dotsContainer = $id('tripsDots');

    if (!track || !viewport || !prevBtn || !nextBtn || !dotsContainer) return;

    const slides = track.querySelectorAll('.trip-card');
    if (slides.length === 0) return;

    let currentIndex = 0;

    function getVisibleCount() {
        const w = window.innerWidth;
        if (w >= 1200) return 3;
        if (w >= 700) return 2;
        return 1;
    }

    function updateLayout() {
        const visible = getVisibleCount();
        const total = slides.length;
        const maxIdx = Math.max(0, total - visible);
        track.style.display = 'grid';
        track.style.gridTemplateColumns = `repeat(${total}, calc((100% - ${(visible - 1) * 12}px) / ${visible}))`;
        track.style.gap = '12px';
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        if (currentIndex > maxIdx) currentIndex = maxIdx;
        updateTransform();
        updateDots(maxIdx);
        updateButtons(maxIdx);
    }

    function updateTransform() {
        const cardWidth = slides[0].getBoundingClientRect().width;
        const gap = 12;
        const offset = currentIndex * (cardWidth + gap);
        track.style.transform = `translateX(${offset}px)`;
    }

    function updateDots(maxIdx) {
        dotsContainer.innerHTML = '';
        if (maxIdx === 0) return;
        for (let i = 0; i <= maxIdx; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            if (i === currentIndex) btn.classList.add('active');
            btn.addEventListener('click', () => {
                currentIndex = i;
                updateTransform();
                updateDots(maxIdx);
                updateButtons(maxIdx);
            });
            dotsContainer.appendChild(btn);
        }
    }

    function updateButtons(maxIdx) {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIdx;
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            const maxIdx = slides.length - getVisibleCount();
            updateTransform();
            updateDots(maxIdx);
            updateButtons(maxIdx);
        }
    });

    nextBtn.addEventListener('click', () => {
        const maxIdx = slides.length - getVisibleCount();
        if (currentIndex < maxIdx) {
            currentIndex++;
            updateTransform();
            updateDots(maxIdx);
            updateButtons(maxIdx);
        }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            currentIndex = 0;
            updateLayout();
        }, 200);
    });

    updateLayout();
}