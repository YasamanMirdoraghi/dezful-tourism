// ═══════════════════════════════════════════════════════════
// utils/jalali-calendar.js — توابع تقویم جلالی
// ═══════════════════════════════════════════════════════════

import { faNum, pad2 } from './numbers.js';

const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

export function jalCal(jy) {
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

export function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
}

export function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 390844584;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    return {
        gy: div(j, 1461) - 100100 + div(8 - (mod(div(i, 153), 12) + 1), 6),
        gm: mod(div(i, 153), 12) + 1,
        gd: div(mod(i, 153), 5) + 1
    };
}

export function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function d2j(jdn) {
    let gy = d2g(jdn).gy, jy = gy - 621;
    const r = jalCal(jy);
    let k = jdn - g2d(gy, 3, r.march);
    if (k >= 0) {
        if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
        k -= 186;
    } else {
        jy -= 1;
        k += 179;
    }
    return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export const jalMonthLen = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy).leap === 0 ? 30 : 29);

export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
export const WDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export function jWeekday(jy, jm, jd) {
    const fmt = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const today = new Date();
    const todayParts = fmt.formatToParts(today);
    const todayJy = +todayParts.find(p => p.type === 'year').value;
    const todayJm = +todayParts.find(p => p.type === 'month').value;
    const todayJd = +todayParts.find(p => p.type === 'day').value;
    const daysDiff = Math.round((jy - todayJy) * 365.2425 + (jm - todayJm) * 30.44 + (jd - todayJd));
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysDiff);
    for (let offset = -5; offset <= 5; offset++) {
        const tryDate = new Date(targetDate);
        tryDate.setDate(targetDate.getDate() + offset);
        const parts = fmt.formatToParts(tryDate);
        const ty = +parts.find(p => p.type === 'year').value;
        const tm = +parts.find(p => p.type === 'month').value;
        const td = +parts.find(p => p.type === 'day').value;
        if (ty === jy && tm === jm && td === jd) {
            const day = tryDate.getDay();
            return (day + 1) % 7;
        }
    }
    const g = d2g(j2d(jy, jm, jd));
    return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
}

// ═══ امروز و یک سال بعد ═══
const now = new Date();
export const TODAY = d2j(g2d(now.getFullYear(), now.getMonth() + 1, now.getDate()));
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
export const MAXJ = d2j(g2d(maxG.getFullYear(), maxG.getMonth() + 1, maxG.getDate()));

export const fmtFull = j => `${WDAYS[jWeekday(j.jy, j.jm, j.jd)]} ${faNum(j.jy)}/${faNum(pad2(j.jm))}/${faNum(pad2(j.jd))}`;
export const fmtShort = j => `${faNum(j.jy)}/${faNum(pad2(j.jm))}/${faNum(pad2(j.jd))}`;