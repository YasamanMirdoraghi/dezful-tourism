# ==========================================================
# core/utils.py — توابع کمکی مشترک بین اپ‌ها
# ==========================================================
import jdatetime
from django.utils import timezone


def jalali_to_gregorian(jy, jm, jd):
    """تبدیل تاریخ شمسی به میلادی"""
    try:
        return jdatetime.date(jy, jm, jd).togregorian()
    except Exception:
        return timezone.now().date()


def gregorian_to_jalali(date_obj):
    """تبدیل تاریخ میلادی به شمسی"""
    try:
        return jdatetime.date.fromgregorian(date=date_obj)
    except Exception:
        return None