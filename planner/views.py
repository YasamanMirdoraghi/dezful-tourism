from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.text import Truncator
from datetime import timedelta
import json
import jdatetime

from .models import Trip, Plan, PlanAttraction, Route, RouteStop
from places.models import Place, Category
from places.utils import get_place_image
from core.utils import gregorian_to_jalali


# ==========================================================
# صفحه برنامه‌ریز
# ==========================================================
def plan_page(request):
    places = Place.objects.filter(
        is_active=True
    ).select_related('category').annotate(
        reviews_count=Count('reviews', filter=Q(reviews__is_approved=True))
    )
    categories = Category.objects.filter(
        type='attraction', parent__isnull=True
    ).order_by('display_order', 'name')

    places_json = []
    for place in places:
        desc = place.short_description or place.description or ''
        desc = Truncator(desc).chars(150)

        places_json.append({
            'id': place.id,
            'name': place.name,
            'slug': place.slug,
            'category': place.category.name if place.category else '',
            'category_id': place.category.id if place.category else None,
            'cost': place.cost_toman,
            'duration': place.duration_minutes,
            'lat': float(place.latitude) if place.latitude else 32.38,
            'lng': float(place.longitude) if place.longitude else 48.42,
            'is_child_friendly': place.is_child_friendly,
            'image': get_place_image(place),
            'rating': float(place.rating_avg) if place.rating_avg else 3.5,
            'views': place.reviews_count or 0,
            'desc': desc,
            'short_description': desc,
        })

    categories_json = [
        {
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'icon': cat.icon or 'fa-map-marker-alt',
            'color': cat.color or '#118b71',
        }
        for cat in categories
    ]

    today = timezone.now().date()

    if request.user.is_authenticated:
        all_trips = list(Trip.objects.filter(user=request.user))

        current_trips = []
        upcoming_trips = []
        past_trips = []

        for trip in all_trips:
            if trip.start_date <= today <= trip.end_date:
                current_trips.append(trip)
            elif trip.start_date > today:
                upcoming_trips.append(trip)
            else:
                past_trips.append(trip)

        current_trips.sort(key=lambda t: (t.end_date - today).days)
        upcoming_trips.sort(key=lambda t: (t.start_date - today).days)
        past_trips.sort(key=lambda t: t.end_date, reverse=True)

        sorted_trips = current_trips + upcoming_trips + past_trips
    else:
        sorted_trips = []

    user_trips = []
    for trip in sorted_trips:
        start_j = gregorian_to_jalali(trip.start_date)
        end_j = gregorian_to_jalali(trip.end_date)

        if trip.start_date <= today <= trip.end_date:
            status = 'current'
        elif trip.start_date > today:
            status = 'upcoming'
        else:
            status = 'past'

        trip_image = '/static/img/asiyab-haye-abi.jpg'
        if trip.suggested_places:
            first_place_id = trip.suggested_places[0].get('id')
            if first_place_id:
                first_place = Place.objects.filter(id=first_place_id).first()
                if first_place:
                    trip_image = get_place_image(first_place)

        user_trips.append({
            'id': trip.id,
            'start_jalali': f"{start_j.year}/{start_j.month:02d}/{start_j.day:02d}" if start_j else '-',
            'end_jalali': f"{end_j.year}/{end_j.month:02d}/{end_j.day:02d}" if end_j else '-',
            'duration_days': trip.duration_days,
            'companions': trip.companions,
            'interests': trip.interests or [],
            'created_at': trip.created_at,
            'status': status,
            'image': trip_image,
        })

    return render(request, 'planner/plan.html', {
        'places': places,
        'categories': categories,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'categories_json': json.dumps(categories_json, ensure_ascii=False),
        'user_trips': user_trips,
    })


# ==========================================================
# ذخیره سفر
# ==========================================================
def save_trip(request):
    if request.method == 'POST':
        try:
            start_date_str = request.POST.get('start_date', '')
            end_date_str = request.POST.get('end_date', '')
            duration_days = int(request.POST.get('duration_days', 1))
            companions_str = request.POST.get('companions', '1')
            has_children = request.POST.get('has_children', 'false') == 'true'
            budget_str = request.POST.get('budget_toman', '')
            interests_json = request.POST.get('interests', '[]')
            suggested_places_json = request.POST.get('suggested_places', '[]')
            daily_durations_json = request.POST.get('daily_durations', '[]')

            def parse_jalali_date(date_str):
                try:
                    parts = date_str.split('/')
                    if len(parts) == 3:
                        jy, jm, jd = int(parts[0]), int(parts[1]), int(parts[2])
                        return jdatetime.date(jy, jm, jd).togregorian()
                    return None
                except Exception:
                    return None

            start_date = parse_jalali_date(start_date_str) or timezone.now().date()
            end_date = parse_jalali_date(end_date_str) or (
                start_date + timedelta(days=duration_days - 1))

            interests = json.loads(interests_json) if interests_json else []
            suggested_places = json.loads(suggested_places_json) if suggested_places_json else []
            daily_durations = json.loads(daily_durations_json) if daily_durations_json else []

            budget_toman = 0
            if '-' in budget_str:
                parts = budget_str.split('-')
                budget_toman = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0

            companions = 1
            if companions_str.isdigit():
                companions = int(companions_str)
            elif companions_str == '5+':
                companions = 5

            trip = Trip.objects.create(
                user=request.user if request.user.is_authenticated else None,
                start_date=start_date,
                end_date=end_date,
                duration_days=duration_days,
                companions=companions,
                has_children=has_children,
                budget_toman=budget_toman,
                interests=interests,
                suggested_places=suggested_places,
                daily_durations=daily_durations,
                status='planned',
            )

            redirect_url = f'/planner/result/{trip.id}/'

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'trip_id': trip.id,
                    'redirect_url': redirect_url
                })

            return redirect(redirect_url)

        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': str(e)
                }, status=400)

            messages.error(request, f'خطا در ذخیره سفر: {str(e)}')
            return redirect('plan')

    return redirect('plan')


# ==========================================================
# صفحه نتیجه سفر شخصی
# ==========================================================
def trip_result_page(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id)

    places_in_trip = []
    for item in (trip.suggested_places or []):
        place = Place.objects.filter(id=item.get('id')).first()
        if place:
            places_in_trip.append({
                'id': place.id,
                'name': place.name,
                'slug': place.slug,
                'category': place.category.name if place.category else '',
                'cost': place.cost_toman,
                'duration': place.duration_minutes,
                'lat': float(place.latitude) if place.latitude else 32.38,
                'lng': float(place.longitude) if place.longitude else 48.42,
                'image': get_place_image(place),
                'rating': float(place.rating_avg) if place.rating_avg else 3.5,
                'desc': place.short_description or place.description or '',
                'day': item.get('day', 1),
                'score': item.get('score', 0),
            })

    interests = trip.interests or []
    empty_categories = []
    low_categories = []

    for cat_name in interests:
        count = Place.objects.filter(
            category__name=cat_name, is_active=True).count()
        if count == 0:
            empty_categories.append(cat_name)
        elif count < 3:
            low_categories.append({'name': cat_name, 'count': count})

    start_jalali = gregorian_to_jalali(trip.start_date)
    end_jalali = gregorian_to_jalali(trip.end_date)

    daily_durations = trip.daily_durations or []

    return render(request, 'planner/trip_result.html', {
        'trip': trip,
        'places_in_trip': places_in_trip,
        'places_json': json.dumps(places_in_trip, ensure_ascii=False),
        'daily_durations_json': json.dumps(daily_durations),
        'empty_categories': empty_categories,
        'low_categories': low_categories,
        'start_jalali': start_jalali,
        'end_jalali': end_jalali,
        'is_plan_mode': False,
    })


# ==========================================================
# صفحه نتیجه پلن پیشنهادی
# ==========================================================
def plan_detail_page(request, slug):
    plan = get_object_or_404(Plan, slug=slug, is_active=True)

    plan_attractions = PlanAttraction.objects.filter(
        plan=plan
    ).select_related('place', 'place__category').order_by('day_number', 'visit_order')

    places_in_trip = []
    for pa in plan_attractions:
        place = pa.place
        places_in_trip.append({
            'id': place.id,
            'name': place.name,
            'slug': place.slug,
            'category': place.category.name if place.category else '',
            'cost': place.cost_toman,
            'duration': place.duration_minutes,
            'lat': float(place.latitude) if place.latitude else 32.38,
            'lng': float(place.longitude) if place.longitude else 48.42,
            'image': get_place_image(place),
            'rating': float(place.rating_avg) if place.rating_avg else 3.5,
            'desc': place.short_description or place.description or '',
            'day': pa.day_number,
            'score': 0,
        })

    duration_map = {
        '1_day': 1, '2_days': 2, '3_days': 3, '5_days': 5, '7_days': 7
    }
    duration_days = plan.duration_days or duration_map.get(plan.duration, 1)

    class FakeTrip:
        def __init__(self, plan, duration_days):
            self.id = None
            self.title = plan.name
            self.duration_days = duration_days
            self.companions = plan.companions
            self.has_children = plan.has_children
            self.budget_toman = plan.budget_toman or plan.estimated_cost
            self.interests = plan.interests or []
            self.start_date = None
            self.end_date = None
            self.daily_durations = [8] * duration_days

    fake_trip = FakeTrip(plan, duration_days)

    return render(request, 'planner/trip_result.html', {
        'trip': fake_trip,
        'plan': plan,
        'places_in_trip': places_in_trip,
        'places_json': json.dumps(places_in_trip, ensure_ascii=False),
        'daily_durations_json': json.dumps(fake_trip.daily_durations),
        'empty_categories': [],
        'low_categories': [],
        'start_jalali': None,
        'end_jalali': None,
        'is_plan_mode': True,
    })


# ==========================================================
# بارگذاری سفر
# ==========================================================
def load_trip(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
        return redirect(f'/planner/result/{trip.id}/')
    except Trip.DoesNotExist:
        messages.error(request, 'سفر یافت نشد.')
        return redirect('plan')


# ==========================================================
# حذف سفر
# ==========================================================
@login_required(login_url='login')
def delete_trip(request, trip_id):
    if request.method != 'POST':
        return JsonResponse(
            {'status': 'error', 'message': 'Method not allowed'},
            status=405
        )

    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    trip.delete()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'deleted',
            'message': 'سفر با موفقیت حذف شد'
        })

    messages.success(request, 'سفر با موفقیت حذف شد.')
    return redirect('dashboard')


# ==========================================================
# صفحه تست الگوریتم
# ==========================================================
def test_algorithm_page(request):
    places = Place.objects.filter(is_active=True).select_related('category')
    categories = Category.objects.filter(
        type='attraction', parent__isnull=True)

    places_json = []
    for place in places:
        lat = float(place.latitude) if place.latitude else 32.38
        lng = float(place.longitude) if place.longitude else 48.42
        rating = float(place.rating_avg) if place.rating_avg else 3.5
        cost = int(place.cost_toman) if place.cost_toman else 0
        duration = int(place.duration_minutes) if place.duration_minutes else 60
        views = int(place.visit_count) if place.visit_count else 0

        places_json.append({
            'id': place.id,
            'name': place.name,
            'slug': place.slug,
            'category': place.category.name if place.category else '',
            'cost': cost,
            'duration': duration,
            'rating': rating,
            'views': views,
            'is_child_friendly': bool(place.is_child_friendly),
            'lat': lat,
            'lng': lng,
            'image': get_place_image(place),
            'desc': (place.short_description or place.description or '')[:200],
        })

    categories_json = [
        {
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'icon': cat.icon or 'fa-map-marker-alt',
            'color': cat.color or '#118b71',
        }
        for cat in categories
    ]

    return render(request, 'planner/test_algorithm.html', {
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'categories_json': json.dumps(categories_json, ensure_ascii=False),
    })