import os
import django
import pandas as pd
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dezful_tourism.settings')
django.setup()

from core.models import Category, Tag, Place, PlaceTag, Route, RouteStop

def clean_slug(text):
    if not text or pd.isna(text):
        return None
    return str(text).lower().strip().replace(' ', '-').replace('آ', 'a').replace('ی', 'y').replace('(', '').replace(')', '').replace('«', '').replace('»', '').replace('،', '')

def get_value(row, *keys):
    """تلاش برای پیدا کردن مقدار از ستون‌های مختلف"""
    for key in keys:
        try:
            val = row.get(key)
            if pd.notna(val):
                return val
        except:
            continue
    return None

def import_categories():
    print("📂 وارد کردن Categories...")
    df = pd.read_excel('data/categories.xlsx', sheet_name=0)
    
    # پیدا کردن ستون‌ها
    col_name = None
    col_slug = None
    col_type = None
    col_parent = None
    col_icon = None
    col_color = None
    col_description = None
    col_order = None
    
    for col in df.columns:
        col_lower = str(col).strip().lower()
        if 'نام' in col_lower or col_lower == 'name':
            col_name = col
        if 'slug' in col_lower or 'نامک' in col_lower:
            col_slug = col
        if 'type' in col_lower or 'نوع' in col_lower:
            col_type = col
        if 'parent' in col_lower or 'والد' in col_lower:
            col_parent = col
        if 'icon' in col_lower or 'آیکون' in col_lower:
            col_icon = col
        if 'color' in col_lower or 'رنگ' in col_lower:
            col_color = col
        if 'description' in col_lower or 'توضیح' in col_lower:
            col_description = col
        if 'order' in col_lower or 'ترتیب' in col_lower:
            col_order = col
    
    print(f"  ستون نام: {col_name}")
    print(f"  ستون slug: {col_slug}")
    
    category_map = {}
    
    # شروع از ردیف ۱ (ردیف ۰ ممکنه هدر باشه)
    start_row = 0
    for idx, row in df.iterrows():
        name = get_value(row, col_name, 'name', 'نام')
        if not name or pd.isna(name) or str(name).strip() == '':
            continue
        
        name = str(name).strip()
        slug = clean_slug(name) if not col_slug else clean_slug(get_value(row, col_slug))
        
        parent_val = get_value(row, col_parent)
        parent_slug = clean_slug(parent_val) if parent_val and 'NULL' not in str(parent_val) and 'خودکار' not in str(parent_val) else None
        
        parent = None
        if parent_slug and parent_slug in category_map:
            parent = Category.objects.get(id=category_map[parent_slug])
        
        category, created = Category.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'type': get_value(row, col_type) or 'attraction',
                'parent': parent,
                'icon': get_value(row, col_icon),
                'color': get_value(row, col_color) or '#118b71',
                'description': get_value(row, col_description),
                'display_order': int(get_value(row, col_order)) if get_value(row, col_order) else 0,
            }
        )
        category_map[slug] = category.id
        print(f"  ✅ {name} ({'ایجاد' if created else 'وجود داشت'})")
    
    return category_map

def import_tags():
    print("🏷️ وارد کردن Tags...")
    df = pd.read_excel('data/tags.xlsx', sheet_name=0)
    
    # پیدا کردن ستون‌ها
    col_name = None
    col_slug = None
    col_icon = None
    col_color = None
    col_weight = None
    col_type = None
    
    for col in df.columns:
        col_lower = str(col).strip().lower()
        if 'نام' in col_lower or col_lower == 'name':
            col_name = col
        if 'slug' in col_lower or 'نامک' in col_lower:
            col_slug = col
        if 'icon' in col_lower or 'آیکون' in col_lower:
            col_icon = col
        if 'color' in col_lower or 'رنگ' in col_lower:
            col_color = col
        if 'weight' in col_lower or 'وزن' in col_lower:
            col_weight = col
        if 'type' in col_lower or 'نوع' in col_lower:
            col_type = col
    
    for idx, row in df.iterrows():
        name = get_value(row, col_name, 'name', 'نام')
        if not name or pd.isna(name):
            continue
        
        name = str(name).strip()
        slug = clean_slug(name) if not col_slug else clean_slug(get_value(row, col_slug))
        
        tag, created = Tag.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'icon': get_value(row, col_icon),
                'color': get_value(row, col_color) or '#118b71',
                'weight': float(get_value(row, col_weight)) if get_value(row, col_weight) else 1.0,
                'type': get_value(row, col_type) or 'both',
            }
        )
        print(f"  ✅ {name} ({'ایجاد' if created else 'وجود داشت'})")

def import_places():
    print("🏛️ وارد کردن Places...")
    df = pd.read_excel('data/places.xlsx', sheet_name=0)
    
    cat_map = {cat.slug: cat.id for cat in Category.objects.all()}
    
    # پیدا کردن ستون‌ها
    col_name = None
    col_slug = None
    col_category = None
    col_short_desc = None
    col_desc = None
    col_address = None
    col_lat = None
    col_lng = None
    col_cost = None
    col_child = None
    col_duration = None
    col_hours = None
    col_best_time = None
    col_image = None
    col_phone = None
    col_rating = None
    col_visit = None
    col_active = None
    col_featured = None
    
    for col in df.columns:
        col_lower = str(col).strip().lower()
        if 'نام' in col_lower or col_lower == 'name':
            col_name = col
        if 'slug' in col_lower or 'نامک' in col_lower:
            col_slug = col
        if 'category' in col_lower or 'دسته' in col_lower:
            col_category = col
        if 'short' in col_lower or 'کوتاه' in col_lower:
            col_short_desc = col
        if 'description' in col_lower or 'توضیح' in col_lower:
            col_desc = col
        if 'address' in col_lower or 'آدرس' in col_lower:
            col_address = col
        if 'latitude' in col_lower or 'عرض' in col_lower:
            col_lat = col
        if 'longitude' in col_lower or 'طول' in col_lower:
            col_lng = col
        if 'cost' in col_lower or 'هزینه' in col_lower:
            col_cost = col
        if 'child' in col_lower or 'کودک' in col_lower:
            col_child = col
        if 'duration' in col_lower or 'مدت' in col_lower:
            col_duration = col
        if 'hours' in col_lower or 'ساعت' in col_lower:
            col_hours = col
        if 'best' in col_lower or 'بهترین' in col_lower:
            col_best_time = col
        if 'image' in col_lower or 'تصویر' in col_lower:
            col_image = col
        if 'phone' in col_lower or 'تلفن' in col_lower:
            col_phone = col
        if 'rating' in col_lower or 'امتیاز' in col_lower:
            col_rating = col
        if 'visit' in col_lower or 'بازدید' in col_lower:
            col_visit = col
        if 'active' in col_lower or 'فعال' in col_lower:
            col_active = col
        if 'featured' in col_lower or 'ویژه' in col_lower:
            col_featured = col
    
    for idx, row in df.iterrows():
        name = get_value(row, col_name, 'name', 'نام')
        if not name or pd.isna(name):
            continue
        
        name = str(name).strip()
        slug = clean_slug(name) if not col_slug else clean_slug(get_value(row, col_slug))
        
        cat_val = get_value(row, col_category)
        cat_id = None
        if cat_val:
            cat_slug = clean_slug(str(cat_val))
            if cat_slug:
                for c_slug, c_id in cat_map.items():
                    if cat_slug in c_slug or c_slug in cat_slug:
                        cat_id = c_id
                        break
        
        place, created = Place.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'category_id': cat_id,
                'short_description': get_value(row, col_short_desc),
                'description': get_value(row, col_desc),
                'address': get_value(row, col_address),
                'latitude': float(get_value(row, col_lat)) if get_value(row, col_lat) else None,
                'longitude': float(get_value(row, col_lng)) if get_value(row, col_lng) else None,
                'cost_toman': int(float(get_value(row, col_cost))) if get_value(row, col_cost) else 0,
                'is_child_friendly': str(get_value(row, col_child)).strip().lower() == 'true' if get_value(row, col_child) else False,
                'duration_minutes': int(get_value(row, col_duration)) if get_value(row, col_duration) else 60,
                'opening_hours': get_value(row, col_hours),
                'best_visit_time': get_value(row, col_best_time),
                'main_image': get_value(row, col_image),
                'phone': get_value(row, col_phone),
                'rating_avg': float(get_value(row, col_rating)) if get_value(row, col_rating) else 0,
                'visit_count': int(get_value(row, col_visit)) if get_value(row, col_visit) else 0,
                'is_active': str(get_value(row, col_active)).strip().lower() == 'true' if get_value(row, col_active) else True,
                'is_featured': str(get_value(row, col_featured)).strip().lower() == 'true' if get_value(row, col_featured) else False,
            }
        )
        print(f"  ✅ {name} ({'ایجاد' if created else 'وجود داشت'})")

def import_place_tags():
    print("🔗 وارد کردن Place Tags...")
    df = pd.read_excel('data/place-tags.xlsx', sheet_name=0)
    
    place_map = {place.slug: place.id for place in Place.objects.all()}
    tag_map = {tag.slug: tag.id for tag in Tag.objects.all()}
    
    # پیدا کردن ستون‌ها
    col_place = None
    col_tag = None
    for col in df.columns:
        col_lower = str(col).strip().lower()
        if 'place' in col_lower or 'جاذبه' in col_lower:
            col_place = col
        if 'tag' in col_lower or 'تگ' in col_lower:
            col_tag = col
    
    count = 0
    for idx, row in df.iterrows():
        place_val = get_value(row, col_place)
        tag_val = get_value(row, col_tag)
        
        if not place_val or not tag_val:
            continue
        
        place_slug = clean_slug(str(place_val))
        tag_slug = clean_slug(str(tag_val))
        
        place_id = None
        tag_id = None
        
        for p_slug, p_id in place_map.items():
            if place_slug and (place_slug in p_slug or p_slug in place_slug):
                place_id = p_id
                break
        
        if not place_id:
            for p in Place.objects.all():
                if place_slug and (place_slug in p.slug or p.slug in place_slug):
                    place_id = p.id
                    break
        
        for t_slug, t_id in tag_map.items():
            if tag_slug and (tag_slug in t_slug or t_slug in tag_slug):
                tag_id = t_id
                break
        
        if place_id and tag_id:
            PlaceTag.objects.get_or_create(place_id=place_id, tag_id=tag_id)
            count += 1
    
    print(f"  ✅ {count} ارتباط ایجاد شد")

def import_routes():
    print("🗺️ وارد کردن Routes...")
    df = pd.read_excel('data/route.xlsx', sheet_name=0)
    
    place_map = {place.slug: place.id for place in Place.objects.all()}
    cat_map = {cat.slug: cat.id for cat in Category.objects.all()}
    
    # پیدا کردن ستون‌ها
    col_name = None
    col_slug = None
    col_category = None
    col_origin = None
    col_dest = None
    col_type = None
    col_duration = None
    col_distance = None
    col_scenic = None
    col_desc = None
    col_historical = None
    col_access = None
    col_active = None
    
    for col in df.columns:
        col_lower = str(col).strip().lower()
        if 'نام' in col_lower or col_lower == 'name':
            col_name = col
        if 'slug' in col_lower or 'نامک' in col_lower:
            col_slug = col
        if 'category' in col_lower or 'دسته' in col_lower:
            col_category = col
        if 'origin' in col_lower or 'مبدأ' in col_lower:
            col_origin = col
        if 'destination' in col_lower or 'مقصد' in col_lower:
            col_dest = col
        if 'type' in col_lower or 'نوع' in col_lower:
            col_type = col
        if 'duration' in col_lower or 'مدت' in col_lower:
            col_duration = col
        if 'distance' in col_lower or 'فاصله' in col_lower:
            col_distance = col
        if 'scenic' in col_lower or 'چشم' in col_lower:
            col_scenic = col
        if 'description' in col_lower or 'توضیح' in col_lower:
            col_desc = col
        if 'historical' in col_lower or 'تاریخی' in col_lower:
            col_historical = col
        if 'access' in col_lower or 'دسترسی' in col_lower:
            col_access = col
        if 'active' in col_lower or 'فعال' in col_lower:
            col_active = col
    
    for idx, row in df.iterrows():
        name = get_value(row, col_name, 'name', 'نام')
        if not name or pd.isna(name):
            continue
        
        name = str(name).strip()
        slug = clean_slug(name) if not col_slug else clean_slug(get_value(row, col_slug))
        
        origin_val = get_value(row, col_origin)
        dest_val = get_value(row, col_dest)
        
        origin_id = None
        dest_id = None
        
        if origin_val:
            origin_slug = clean_slug(str(origin_val))
            for p_slug, p_id in place_map.items():
                if origin_slug and (origin_slug in p_slug or p_slug in origin_slug):
                    origin_id = p_id
                    break
        
        if dest_val:
            dest_slug = clean_slug(str(dest_val))
            for p_slug, p_id in place_map.items():
                if dest_slug and (dest_slug in p_slug or p_slug in dest_slug):
                    dest_id = p_id
                    break
        
        cat_val = get_value(row, col_category)
        cat_id = None
        if cat_val:
            cat_slug = clean_slug(str(cat_val))
            if cat_slug:
                for c_slug, c_id in cat_map.items():
                    if cat_slug in c_slug or c_slug in cat_slug:
                        cat_id = c_id
                        break
        
        route, created = Route.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'category_id': cat_id,
                'origin_id': origin_id,
                'destination_id': dest_id,
                'route_type': get_value(row, col_type) or 'walk',
                'duration_minutes': int(get_value(row, col_duration)) if get_value(row, col_duration) else 20,
                'distance_km': float(get_value(row, col_distance)) if get_value(row, col_distance) else None,
                'is_scenic': str(get_value(row, col_scenic)).strip().lower() == 'true' if get_value(row, col_scenic) else True,
                'description': get_value(row, col_desc),
                'historical_significance': get_value(row, col_historical),
                'access_info': get_value(row, col_access),
                'is_active': str(get_value(row, col_active)).strip().lower() == 'true' if get_value(row, col_active) else True,
            }
        )
        print(f"  ✅ {name} ({'ایجاد' if created else 'وجود داشت'})")

def import_route_stops():
    print("🚏 وارد کردن Route Stops...")
    df = pd.read_excel('data/route-stops.xlsx', sheet_name=0)
    
    route_map = {route.slug: route.id for route in Route.objects.all()}
    place_map = {place.slug: place.id for place in Place.objects.all()}
    
    # پیدا کردن ستون‌ها
    col_route = None
    col_place = None
    col_name = None
    col_order = None
    col_lat = None
    col_lng = None
    col_note = None
    
    for col in df.columns:
        col_lower = str(col).strip().lower()
        if 'route' in col_lower or 'مسیر' in col_lower:
            col_route = col
        if 'place' in col_lower or 'جاذبه' in col_lower:
            col_place = col
        if 'نام' in col_lower or 'name' in col_lower:
            col_name = col
        if 'order' in col_lower or 'ترتیب' in col_lower:
            col_order = col
        if 'latitude' in col_lower or 'عرض' in col_lower:
            col_lat = col
        if 'longitude' in col_lower or 'طول' in col_lower:
            col_lng = col
        if 'note' in col_lower or 'توضیح' in col_lower:
            col_note = col
    
    count = 0
    for idx, row in df.iterrows():
        route_val = get_value(row, col_route)
        stop_name = get_value(row, col_name, 'name', 'نام')
        
        if not route_val or not stop_name:
            continue
        
        route_slug = clean_slug(str(route_val))
        
        route_id = None
        for r_slug, r_id in route_map.items():
            if route_slug and (route_slug in r_slug or r_slug in route_slug):
                route_id = r_id
                break
        
        if not route_id:
            continue
        
        place_val = get_value(row, col_place)
        place_id = None
        if place_val:
            place_slug = clean_slug(str(place_val))
            for p_slug, p_id in place_map.items():
                if place_slug and (place_slug in p_slug or p_slug in place_slug):
                    place_id = p_id
                    break
        
        RouteStop.objects.get_or_create(
            route_id=route_id,
            stop_order=int(get_value(row, col_order)) if get_value(row, col_order) else count + 1,
            defaults={
                'place_id': place_id,
                'stop_name': str(stop_name).strip(),
                'latitude': float(get_value(row, col_lat)) if get_value(row, col_lat) else None,
                'longitude': float(get_value(row, col_lng)) if get_value(row, col_lng) else None,
                'note': get_value(row, col_note),
            }
        )
        count += 1
    
    print(f"  ✅ {count} ایستگاه ایجاد شد")

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 شروع وارد کردن داده‌ها")
    print("=" * 50)
    
    try:
        category_map = import_categories()
        import_tags()
        import_places()
        import_place_tags()
        import_routes()
        import_route_stops()
        
        print("=" * 50)
        print("✅ همه‌ی داده‌ها با موفقیت وارد شدند!")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ خطا: {e}")
        import traceback
        traceback.print_exc()