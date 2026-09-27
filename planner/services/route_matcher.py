# ═══════════════════════════════════════════════════════════
# planner/services/route_matcher.py
# تطبیق مسیرهای تاریخی با برنامه‌ی سفر کاربر
# ═══════════════════════════════════════════════════════════

import math
import re

# ═══ تنظیمات ═══
MAX_DISTANCE_METERS = 500         # حداکثر فاصله برای تطبیق مکانی (متر)
CLOSE_DISTANCE_METERS = 150       # فاصله‌ی خیلی نزدیک
MIN_MATCHED_STOPS = 2             # حداقل ایستگاه‌های باکیفیت
NAME_SIMILARITY_THRESHOLD = 0.65  # آستانه‌ی شباهت اسمی (۶۵٪)
MIN_NAME_SIM_FOR_CLOSE = 0.25     # حداقل شباهت اسمی اگه فاصله خیلی نزدیک باشه
MIN_NAME_SIM_FOR_MID = 0.50       # حداقل شباهت اسمی اگه فاصله متوسط باشه


# ═══════════════════════════════════════════════════════════
# توابع کمکی
# ═══════════════════════════════════════════════════════════

def haversine_meters(lat1, lng1, lat2, lng2):
    """فاصله‌ی بین دو نقطه به متر (Haversine)"""
    if None in (lat1, lng1, lat2, lng2):
        return float('inf')

    R = 6371000  # شعاع زمین به متر
    lat1, lng1, lat2, lng2 = map(float, (lat1, lng1, lat2, lng2))

    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def normalize_name(name):
    """
    نرمال‌سازی اسم برای مقایسه‌ی بهتر:
    - یکسان‌سازی ی و ک عربی/فارسی
    - حذف نیم‌فاصله و علائم
    - حذف کلمات بی‌ارزش
    """
    if not name:
        return ''

    # یکسان‌سازی حروف عربی/فارسی
    name = name.replace('ي', 'ی').replace('ك', 'ک')
    name = name.replace('ۀ', 'ه').replace('ة', 'ه')
    name = name.replace('\u200c', ' ')  # نیم‌فاصله

    # حذف علائم
    name = re.sub(r'[()،,.\-_/\\]', ' ', name)

    # کلمات بی‌ارزش
    stopwords = {
        'دزفول', 'تاریخی', 'خانه', 'بقعه', 'متبرکه', 'امامزاده',
        'و', 'رستوران', 'سنتی', 'محله', 'کوی', 'خیابان',
        'کوچه', 'گذر', 'میدان', 'فلکه'
    }

    tokens = [
        t for t in name.split()
        if t and t not in stopwords and len(t) > 1
    ]

    return ' '.join(tokens).strip()


def similarity_ratio(s1, s2):
    """
    محاسبه‌ی شباهت دو رشته (۰ تا ۱).
    ترکیب Jaccard (کلمه‌ای) و Levenshtein (کاراکتری).
    """
    if not s1 or not s2:
        return 0.0

    n1 = normalize_name(s1)
    n2 = normalize_name(s2)

    if not n1 or not n2:
        return 0.0

    if n1 == n2:
        return 1.0

    # ═══ Jaccard روی کلمات ═══
    w1 = set(n1.split())
    w2 = set(n2.split())
    if w1 and w2:
        jaccard = len(w1 & w2) / len(w1 | w2)
    else:
        jaccard = 0.0

    # ═══ Levenshtein ═══
    longer = n1 if len(n1) >= len(n2) else n2
    shorter = n2 if len(n1) >= len(n2) else n1

    if len(longer) == 0:
        lev_ratio = 1.0
    else:
        prev = list(range(len(shorter) + 1))
        for i, c1 in enumerate(longer, 1):
            curr = [i]
            for j, c2 in enumerate(shorter, 1):
                curr.append(min(
                    prev[j] + 1,
                    curr[j - 1] + 1,
                    prev[j - 1] + (c1 != c2)
                ))
            prev = curr
        lev_dist = prev[-1]
        lev_ratio = 1 - (lev_dist / len(longer))

    # ═══ ترکیب: ۶۰٪ Jaccard + ۴۰٪ Levenshtein ═══
    return 0.6 * jaccard + 0.4 * lev_ratio


# ═══════════════════════════════════════════════════════════
# تابع اصلی
# ═══════════════════════════════════════════════════════════

def find_matching_historical_routes(
    trip_places,
    max_distance=MAX_DISTANCE_METERS,
    min_matches=MIN_MATCHED_STOPS,
    name_threshold=NAME_SIMILARITY_THRESHOLD,
):
    """
    پیدا کردن مسیرهای تاریخی که با جاذبه‌های سفر کاربر همپوشانی دارن.

    استراتژی سخت‌گیرانه:
      - اسم خیلی شبیه (sim >= name_threshold) → قبول
      - یا فاصله خیلی نزدیک (< CLOSE_DISTANCE) و sim >= MIN_NAME_SIM_FOR_CLOSE
      - یا فاصله متوسط (< max_distance) و sim >= MIN_NAME_SIM_FOR_MID
      - حداقل min_matches تطبیقِ باکیفیت لازمه

    Args:
        trip_places: لیست دیکشنری جاذبه‌ها (با کلیدهای id, name, lat, lng)
        max_distance: حداکثر فاصله‌ی مجاز مکانی (متر)
        min_matches: حداقل تعداد ایستگاه همپوشان باکیفیت
        name_threshold: آستانه‌ی شباهت اسمی (۰ تا ۱)

    Returns:
        لیست دیکشنری مسیرهای منطبق با اطلاعات کامل
    """
    from planner.models import Route

    if not trip_places:
        return []

    # ═══ آماده‌سازی جاذبه‌های سفر ═══
    trip_points = []
    for p in trip_places:
        lat = p.get('lat') or p.get('latitude')
        lng = p.get('lng') or p.get('longitude')
        if lat is None or lng is None:
            continue
        trip_points.append({
            'id': p.get('id'),
            'name': p.get('name', ''),
            'lat': float(lat),
            'lng': float(lng),
        })

    if not trip_points:
        return []

    # ═══ گرفتن مسیرهای فعال ═══
    routes = Route.objects.filter(is_active=True).prefetch_related('stops')

    matched = []

    for route in routes:
        stops = list(route.stops.all())
        if len(stops) < min_matches:
            continue

        matched_stops = []
        matched_place_ids = set()

        for stop in stops:
            best_match = None

            for tp in trip_points:
                # ═══ شباهت اسمی ═══
                name_sim = similarity_ratio(stop.stop_name, tp['name'])

                # ═══ فاصله‌ی مکانی ═══
                distance = None
                if stop.latitude and stop.longitude:
                    distance = haversine_meters(
                        stop.latitude, stop.longitude,
                        tp['lat'], tp['lng']
                    )

                # ═══ شرط سخت‌گیرانه ═══
                name_ok = name_sim >= name_threshold
                dist_close = distance is not None and distance <= CLOSE_DISTANCE_METERS
                dist_mid = distance is not None and distance <= max_distance

                accept = (
                    name_ok or
                    (dist_close and name_sim >= MIN_NAME_SIM_FOR_CLOSE) or
                    (dist_mid and name_sim >= MIN_NAME_SIM_FOR_MID)
                )

                if not accept:
                    continue

                # ═══ امتیاز ═══
                score = name_sim * 100
                if distance is not None:
                    score += max(0, (1 - distance / max_distance)) * 80
                if name_ok and dist_close:
                    score += 50

                match_info = {
                    'matched_place_id': tp['id'],
                    'matched_place_name': tp['name'],
                    'name_similarity': round(name_sim, 2),
                    'distance_meters': round(distance) if distance is not None else None,
                    'match_type': (
                        'both' if (name_ok and dist_close) else
                        'name' if name_ok else
                        'distance'
                    ),
                    'score': score,
                }

                if best_match is None or score > best_match['score']:
                    best_match = match_info

            if best_match:
                matched_stops.append({
                    'stop_id': stop.id,
                    'stop_name': stop.stop_name,
                    'stop_order': stop.stop_order,
                    'latitude': float(stop.latitude) if stop.latitude else None,
                    'longitude': float(stop.longitude) if stop.longitude else None,
                    'note': stop.note or '',
                    **best_match,
                })
                matched_place_ids.add(best_match['matched_place_id'])

        # ═══ فیلتر تطبیق‌های باکیفیت ═══
        quality_matches = [
            s for s in matched_stops
            if s['match_type'] == 'both' or s['name_similarity'] >= 0.5
        ]

        if len(quality_matches) < min_matches:
            continue

        match_ratio = len(matched_stops) / len(stops)
        quality_ratio = len(quality_matches) / len(stops)

        matched.append({
            'id': route.id,
            'name': route.name,
            'slug': route.slug,
            'description': route.description or '',
            'historical_significance': route.historical_significance or '',
            'access_info': route.access_info or '',
            'duration_minutes': route.duration_minutes,
            'distance_km': float(route.distance_km) if route.distance_km else 0,
            'is_scenic': route.is_scenic,
            'main_image': route.main_image.url if route.main_image else None,
            'total_stops': len(stops),
            'matched_stops_count': len(matched_stops),
            'quality_matches_count': len(quality_matches),
            'match_ratio': round(match_ratio, 2),
            'quality_ratio': round(quality_ratio, 2),
            'matched_place_ids': list(matched_place_ids),
            'matched_stops': matched_stops,
            'quality_matches': quality_matches,
            'all_stops': [
                {
                    'id': s.id,
                    'name': s.stop_name,
                    'order': s.stop_order,
                    'lat': float(s.latitude) if s.latitude else None,
                    'lng': float(s.longitude) if s.longitude else None,
                    'note': s.note or '',
                }
                for s in sorted(stops, key=lambda x: x.stop_order)
                if s.latitude and s.longitude
            ],
        })

    # ═══ مرتب‌سازی: اول بر اساس تعداد تطبیق‌های باکیفیت ═══
    matched.sort(
        key=lambda r: (r['quality_matches_count'], r['match_ratio']),
        reverse=True
    )
    return matched