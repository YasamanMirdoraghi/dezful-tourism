// ═══════════════════════════════════════════════════════════
// utils/numbers.js — توابع کار با اعداد و متن فارسی
// ═══════════════════════════════════════════════════════════

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const EN_DIGITS = '0123456789';

/**
 * تبدیل اعداد انگلیسی به فارسی
 * faNum(123) → "۱۲۳"
 */
export const faNum = (s) => String(s).replace(/\d/g, d => FA_DIGITS[d]);

/**
 * تبدیل اعداد فارسی به انگلیسی
 * enNum('۱۲۳') → "123"
 */
export const enNum = (s) => String(s).replace(/[۰-۹]/g, d => EN_DIGITS[FA_DIGITS.indexOf(d)]);

/**
 * صفر اضافه کردن به ابتدای عدد (اگر تک‌رقمی باشد)
 * pad2(5) → "05"
 */
export const pad2 = (n) => String(n).padStart(2, '0');

/**
 * فرمت عدد با جداکننده هزارگان
 * formatNumber(1234567) → "۱,۲۳۴,۵۶۷"
 */
export const formatNumber = (n) => faNum(Number(n).toLocaleString('en-US'));

/**
 * تبدیل دقیقه به فرمت ساعت:دقیقه
 * faTime(90) → "۱:۳۰"
 */
export const faTime = (m) => {
    const hours = Math.floor(m / 60);
    const minutes = m % 60;
    return `${faNum(hours)}:${faNum(pad2(minutes))}`;
};