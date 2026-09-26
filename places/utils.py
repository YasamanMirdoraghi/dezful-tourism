# ==========================================================
# places/utils.py — توابع کمکی مخصوص جاذبه‌ها
# ==========================================================
import os
from django.conf import settings


def get_place_image(place):
    """پیدا کردن عکس جاذبه بر اساس slug"""
    slug = place.slug
    formats = ['.jpg', '.png', '.jpeg', '.webp']
    for fmt in formats:
        image_path = os.path.join(
            settings.BASE_DIR, 'static', 'img', f'{slug}{fmt}')
        if os.path.exists(image_path):
            return f'/static/img/{slug}{fmt}'
    return '/static/img/asiyab-haye-abi.jpg'