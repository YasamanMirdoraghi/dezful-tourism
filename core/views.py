from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Count, Avg
from datetime import datetime, timedelta
import json
import os

from django.utils.text import Truncator   # 👈 این خط رو اضافه کن

from places.models import Place, Category, Review
from planner.models import Plan
from articles.models import Article
from places.utils import get_place_image
from .models import Contact


# ==========================================================
# صفحه اصلی
# ==========================================================
def home(request):
    from accounts.models import User

    # ═══════════════════════════════════════════════════════════
    # جاذبه‌های ویژه — متن‌ها کوتاه شده
    # ═══════════════════════════════════════════════════════════
    featured_places_qs = Place.objects.filter(is_active=True).select_related('category')[:12]

    featured_places = []
    for place in featured_places_qs:
        desc = place.short_description or place.description or ''
        # حداکثر 20 کلمه
        desc = Truncator(desc).words(20, truncate=' …')

        featured_places.append({
            'id': place.id,
            'name': place.name,
            'slug': place.slug,
            'short_description': desc,
            'description': place.description or '',
            'category': place.category,
            'cost_toman': place.cost_toman,
            'duration_minutes': place.duration_minutes,
            'is_child_friendly': place.is_child_friendly,
            'rating_avg': place.rating_avg,
        })

    # ═══════════════════════════════════════════════════════════
    # پلن‌ها — متن‌ها کوتاه شده
    # ═══════════════════════════════════════════════════════════
    plans_qs = Plan.objects.filter(is_active=True)[:8]

    plans = []
    for plan in plans_qs:
        desc = plan.description or ''
        # حداکثر 15 کلمه
        desc = Truncator(desc).words(15, truncate=' …')

        plans.append({
            'id': plan.id,
            'name': plan.name,
            'slug': plan.slug,
            'description': desc,
            'badge': plan.badge,
            'color': plan.color,
            'estimated_cost': plan.estimated_cost,
        })

    # ═══════════════════════════════════════════════════════════
    # مقالات — متن‌ها کوتاه شده
    # ═══════════════════════════════════════════════════════════
    featured_articles_qs = Article.objects.filter(
        is_published=True
    ).order_by('-created_at')[:6]

    featured_articles = []
    for article in featured_articles_qs:
        excerpt = article.excerpt or ''
        # حداکثر 15 کلمه
        excerpt = Truncator(excerpt).words(15, truncate=' …')

        featured_articles.append({
            'id': article.id,
            'title': article.title,
            'slug': article.slug,
            'excerpt': excerpt,
            'category': article.category,
            'duration': article.duration,
            'views': article.views,
        })

    # ═══════════════════════════════════════════════════════════
    # آمار
    # ═══════════════════════════════════════════════════════════
    places_count = Place.objects.filter(is_active=True).count()
    users_count = User.objects.filter(is_active=True).count()
    plans_count = Plan.objects.filter(is_active=True).count()
    reviews_count = Review.objects.filter(is_approved=True).count()
    avg_rating = Review.objects.filter(
        is_approved=True, rating__gt=0
    ).aggregate(avg=Avg('rating'))['avg'] or 4.8

    return render(request, 'core/index.html', {
        'featured_places': featured_places,
        'plans': plans,
        'featured_articles': featured_articles,
        'places_count': places_count,
        'users_count': users_count,
        'plans_count': plans_count,
        'reviews_count': reviews_count,
        'avg_rating': round(avg_rating, 1),
    })


# ==========================================================
# صفحه تماس با ما — بدون تغییر
# ==========================================================
def contact_page(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone', '')
        subject = request.POST.get('subject')
        message = request.POST.get('message')

        Contact.objects.create(
            name=name,
            email=email,
            phone=phone,
            subject=subject,
            message=message,
        )

        messages.success(request, 'پیام شما با موفقیت ارسال شد!')
        return redirect('contact')

    return render(request, 'core/contact.html')


# ==========================================================
# صفحه نقشه گردشگری — بدون تغییر
# ==========================================================
def map_page(request):
    from planner.models import Trip, PlanAttraction
    from accounts.models import UserFavorite

    places = Place.objects.filter(is_active=True)

    trip_id = request.GET.get('trip')
    plan_id = request.GET.get('plan')

    trip_data = None
    trip_days = {}
    is_plan_mode = False
    plan_data = None

    if trip_id:
        try:
            trip = Trip.objects.get(id=trip_id)
            trip_data = trip

            if trip.suggested_places:
                for item in trip.suggested_places:
                    day = item.get('day', 1)
                    place_id = item.get('id')
                    if day not in trip_days:
                        trip_days[day] = []
                    trip_days[day].append(place_id)
        except Trip.DoesNotExist:
            pass

    elif plan_id:
        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
            plan_data = plan
            is_plan_mode = True

            plan_attractions = PlanAttraction.objects.filter(
                plan=plan
            ).select_related(
                'place', 'place__category'
            ).order_by('day_number', 'visit_order')

            suggested_places = []
            for pa in plan_attractions:
                place = pa.place
                suggested_places.append({
                    'id': place.id,
                    'day': pa.day_number,
                    'score': 0,
                })
                day = pa.day_number
                if day not in trip_days:
                    trip_days[day] = []
                trip_days[day].append(place.id)

            duration_map = {
                '1_day': 1, '2_days': 2, '3_days': 3,
                '5_days': 5, '7_days': 7
            }
            duration_days = plan.duration_days or duration_map.get(
                plan.duration, 1)

            trip_data = {
                'id': None,
                'start_date': None,
                'end_date': None,
                'duration_days': duration_days,
                'interests': plan.interests or [],
                'suggested_places': suggested_places,
                'days': trip_days,
            }
        except Plan.DoesNotExist:
            pass

    places_json = []
    for place in places:
        cat_name = ''
        cat_color = '#118b71'
        parent_cat_name = ''
        parent_color = '#118b71'

        try:
            cat = place.category
            if cat is not None:
                cat_name = cat.name or ''
                cat_color = cat.color or '#118b71'

                parent = cat.parent
                if parent is not None:
                    parent_cat_name = parent.name or ''
                    parent_color = parent.color or '#118b71'
                else:
                    parent_cat_name = cat_name
                    parent_color = cat_color
        except Exception as e:
            print(f'⚠️ خطا در جاذبه {place.id}: {e}')

        places_json.append({
            'id': place.id,
            'name': place.name or '',
            'slug': place.slug or '',
            'cat': cat_name,
            'parent_cat': parent_cat_name,
            'color': parent_color,
            'sub': place.short_description or '',
            'cost': place.cost_toman or 0,
            'duration': place.duration_minutes or 60,
            'rating': float(place.rating_avg) if place.rating_avg else 0,
            'child': bool(place.is_child_friendly),
            'lat': float(place.latitude) if place.latitude else 32.38,
            'lng': float(place.longitude) if place.longitude else 48.42,
            'image': get_place_image(place),
            'desc': place.description or place.short_description or '',
        })

    trip_json = None
    if trip_data:
        if is_plan_mode:
            trip_json = {
                'id': None,
                'start_date': '',
                'end_date': '',
                'duration_days': trip_data['duration_days'],
                'interests': trip_data['interests'],
                'suggested_places': trip_data['suggested_places'],
                'days': trip_days,
                'is_plan': True,
                'plan_name': plan_data.name if plan_data else '',
            }
        else:
            trip_json = {
                'id': trip_data.id,
                'start_date': trip_data.start_date.isoformat() if trip_data.start_date else '',
                'end_date': trip_data.end_date.isoformat() if trip_data.end_date else '',
                'duration_days': trip_data.duration_days,
                'interests': trip_data.interests,
                'suggested_places': trip_data.suggested_places,
                'days': trip_days,
                'is_plan': False,
            }

    favorite_ids = []
    if request.user.is_authenticated:
        favorite_ids = list(
            UserFavorite.objects.filter(
                user=request.user
            ).values_list('place_id', flat=True)
        )

    return render(request, 'core/map.html', {
        'places': places,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'trip_json': json.dumps(trip_json, ensure_ascii=False) if trip_json else None,
        'trip_mode': bool(trip_data),
        'is_plan_mode': is_plan_mode,
        'plan': plan_data,
        'favorite_ids': json.dumps(favorite_ids),
    })