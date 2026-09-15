from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django.utils.text import Truncator
from django.http import JsonResponse, Http404
from datetime import datetime, timedelta
import json
import os
import jdatetime

from django.conf import settings

from .models import (
    Place, Category, Article, Plan, Route, Review, User,
    ArticleBlock, ArticleRelated, Contact, Trip, PlanAttraction, UserFavorite 
)


# ==========================================================
# تابع کمکی: پیدا کردن عکس جاذبه
# ==========================================================
def get_place_image(place):
    slug = place.slug
    formats = ['.jpg', '.png', '.jpeg', '.webp']
    for fmt in formats:
        image_path = os.path.join(
            settings.BASE_DIR, 'static', 'img', f'{slug}{fmt}')
        if os.path.exists(image_path):
            return f'/static/img/{slug}{fmt}'
    return '/static/img/asiyab-haye-abi.jpg'


# ==========================================================
# صفحه اصلی
# ==========================================================
def home(request):
    featured_places = Place.objects.filter(is_active=True)
    plans = Plan.objects.filter(is_active=True)
    featured_articles = Article.objects.filter(
        is_published=True).order_by('-created_at')

    places_count = Place.objects.filter(is_active=True).count()
    users_count = User.objects.filter(is_active=True).count()
    plans_count = Plan.objects.filter(is_active=True).count()
    reviews_count = Review.objects.filter(is_approved=True).count()
    avg_rating = Review.objects.filter(is_approved=True, rating__gt=0).aggregate(
        avg=Avg('rating'))['avg'] or 4.8

    return render(request, 'index.html', {
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
# صفحه جاذبه‌ها
# ==========================================================
def attraction_page(request):
    places = Place.objects.filter(
        is_active=True).select_related('category__parent')
    categories = Category.objects.filter(
        type='attraction', parent__isnull=True).prefetch_related('children')

    places_json = []
    for place in places:
        short_desc = Truncator(
            place.short_description or '').words(15, truncate=' …')
        places_json.append({
            'id': place.id,
            'name': place.name,
            'slug': place.slug,
            'category': place.category.name if place.category else '',
            'sub': short_desc,
            'cost': place.cost_toman,
            'duration': place.duration_minutes,
            'rating': place.rating_avg,
            'child': place.is_child_friendly,
            'lat': float(place.latitude) if place.latitude else 32.38,
            'lng': float(place.longitude) if place.longitude else 48.42,
            'image': get_place_image(place),
            'desc': short_desc,
            'short_description': short_desc,
            'parent_category': place.category.parent.name if place.category and place.category.parent else (place.category.name if place.category else ''),
        })

    return render(request, 'attraction.html', {
        'places': places,
        'categories': categories,
        'places_json': json.dumps(places_json, ensure_ascii=False),
    })


# ==========================================================
# صفحه تکی جاذبه
# ==========================================================
def place_detail_page(request, slug):
    place = get_object_or_404(Place, slug=slug, is_active=True)
    related_places = Place.objects.filter(
        category=place.category).exclude(id=place.id)[:6]
    reviews = Review.objects.filter(
        place=place, is_approved=True).select_related('user')
    avg_rating = reviews.aggregate(avg=Avg('rating'))[
        'avg'] or place.rating_avg
    gallery = place.gallery if place.gallery else []
    
    # ✅ چک کن آیا کاربر این جاذبه رو ذخیره کرده یا نه
    is_favorited = False
    if request.user.is_authenticated:
        is_favorited = UserFavorite.objects.filter(
            user=request.user, 
            place=place
        ).exists()

    return render(request, 'place_detail.html', {
        'place': place,
        'related_places': related_places,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
        'gallery': gallery,
        'is_favorited': is_favorited,  # ✅ جدید
    })
# ==========================================================
# صفحه مقالات
# ==========================================================
def articles_page(request):
    articles = Article.objects.filter(
        is_published=True).order_by('-created_at')
    categories = Category.objects.filter(type='article')

    author_counts = {}
    authors = articles.values('author').annotate(
        count=Count('id')).order_by('author')
    for author in authors:
        if author['author']:
            author_counts[author['author']] = author['count']

    short_count = articles.filter(duration__lt=5).count()
    medium_count = articles.filter(duration__gte=5, duration__lte=10).count()
    long_count = articles.filter(duration__gt=10).count()

    now = datetime.now()
    month_ago = now - timedelta(days=30)
    three_months_ago = now - timedelta(days=90)
    six_months_ago = now - timedelta(days=180)
    year_ago = now - timedelta(days=365)

    month_count = articles.filter(published_date__gte=month_ago.date()).count()
    three_months_count = articles.filter(
        published_date__gte=three_months_ago.date()).count()
    six_months_count = articles.filter(
        published_date__gte=six_months_ago.date()).count()
    year_count = articles.filter(published_date__gte=year_ago.date()).count()

    popular_count = articles.filter(featured='popular').count()
    featured_count = articles.filter(featured='featured').count()
    new_count = articles.filter(featured='new').count()

    articles_json = []
    for article in articles:
        articles_json.append({
            'id': article.id,
            'slug': article.slug,
            'title': article.title,
            'desc': article.excerpt or '',
            'image': f'/static/img/{article.slug}.jpg',
            'category': article.category.name if article.category else 'عمومی',
            'author': article.author or 'نویسنده',
            'date': article.published_date_jalali or '',
            'duration': article.duration,
            'views': article.views,
            'featured': article.featured,
            'dateRange': article.date_range or '',
            'published_date': article.published_date.isoformat() if article.published_date else '',
        })

    return render(request, 'articles.html', {
        'articles': articles,
        'categories': categories,
        'articles_json': json.dumps(articles_json, ensure_ascii=False),
        'author_counts': author_counts,
        'short_count': short_count,
        'medium_count': medium_count,
        'long_count': long_count,
        'month_count': month_count,
        'three_months_count': three_months_count,
        'six_months_count': six_months_count,
        'year_count': year_count,
        'popular_count': popular_count,
        'featured_count': featured_count,
        'new_count': new_count,
    })


# ==========================================================
# صفحه جزئیات مقاله
# ==========================================================
def article_detail_page(request, slug):
    article = get_object_or_404(Article, slug=slug, is_published=True)
    article_blocks = ArticleBlock.objects.filter(
        article=article).order_by('block_order')
    headings = [
        block for block in article_blocks if block.block_type == 'heading']

    for i, block in enumerate(headings, 1):
        block.toc_number = i

    related = Article.objects.filter(
        category=article.category).exclude(id=article.id)[:6]
    reviews = Review.objects.filter(
        article=article, is_approved=True).select_related('user')
    avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 4.8

    return render(request, 'article.html', {
        'article': article,
        'article_blocks': article_blocks,
        'headings': headings,
        'related': related,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
    })


# ==========================================================
# ثبت نظر
# ==========================================================
def submit_review(request, slug):
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug, is_published=True)
        comment = request.POST.get('comment')
        rating = request.POST.get('rating', 5)

        if request.user.is_authenticated:
            Review.objects.create(
                user=request.user,
                article=article,
                rating=int(rating),
                comment=comment,
            )
            messages.success(request, 'نظر شما با موفقیت ثبت شد!')
        else:
            messages.error(request, 'برای ثبت نظر ابتدا وارد شوید.')

        return redirect('article_detail', slug=slug)

    return redirect('article_detail', slug=slug)


# ==========================================================
# صفحه تماس
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

    return render(request, 'contact.html')


# ==========================================================
# ثبت‌نام
# ==========================================================
def register_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        email = request.POST.get('email', '')
        phone = request.POST.get('phone', '')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')

        if password == password2:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                )
                login(request, user)
                messages.success(
                    request, 'حساب کاربری شما با موفقیت ساخته شد!')
                return redirect('home')
            else:
                messages.error(request, 'نام کاربری قبلاً ثبت شده است!')
        else:
            messages.error(request, 'رمز عبورها مطابقت ندارند!')

    return render(request, 'register.html')


# ==========================================================
# خروج
# ==========================================================
def logout_view(request):
    auth_logout(request)
    return redirect('home')



# ==========================================================
# توابع تبدیل تاریخ
# ==========================================================


def jalali_to_gregorian(jy, jm, jd):
    try:
        return jdatetime.date(jy, jm, jd).togregorian()
    except Exception:
        return timezone.now().date()


def gregorian_to_jalali(date_obj):
    try:
        return jdatetime.date.fromgregorian(date=date_obj)
    except:
        return None
# ==========================================================
# صفحه برنامه‌ریز
# ==========================================================
def plan_page(request):
    places = Place.objects.filter(is_active=True).select_related('category').annotate(
        reviews_count=Count('reviews', filter=Q(reviews__is_approved=True))
    )
    categories = Category.objects.filter(type='attraction', parent__isnull=True).order_by('display_order', 'name')

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

    # ✅ سفرهای اخیر کاربر با مرتب‌سازی هوشمند
    today = timezone.now().date()

    if request.user.is_authenticated:
        # گرفتن همه‌ی سفرها
        all_trips = list(Trip.objects.filter(user=request.user))

        # ✅ دسته‌بندی بر اساس وضعیت
        current_trips = []   # سفرهای جاری
        upcoming_trips = []  # سفرهای آینده
        past_trips = []      # سفرهای گذشته

        for trip in all_trips:
            if trip.start_date <= today <= trip.end_date:
                current_trips.append(trip)
            elif trip.start_date > today:
                upcoming_trips.append(trip)
            else:
                past_trips.append(trip)

        # ✅ مرتب‌سازی هر گروه
        # جاری: نزدیک‌ترین به پایان (کمترین فاصله از today)
        current_trips.sort(key=lambda t: (t.end_date - today).days)

        # آینده: نزدیک‌ترین به امروز (کمترین فاصله از today)
        upcoming_trips.sort(key=lambda t: (t.start_date - today).days)

        # گذشته: جدیدترین‌ها اول (بزرگ‌ترین end_date)
        past_trips.sort(key=lambda t: t.end_date, reverse=True)

        # ✅ ترتیب نهایی: جاری → آینده → گذشته
        sorted_trips = current_trips + upcoming_trips + past_trips
    else:
        sorted_trips = []

    # ساخت user_trips با عکس و وضعیت
    user_trips = []
    for trip in sorted_trips:
        start_j = gregorian_to_jalali(trip.start_date)
        end_j = gregorian_to_jalali(trip.end_date)

        # تعیین وضعیت
        if trip.start_date <= today <= trip.end_date:
            status = 'current'
        elif trip.start_date > today:
            status = 'upcoming'
        else:
            status = 'past'

        # گرفتن عکس اولین جاذبه
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

    return render(request, 'plan.html', {
        'places': places,
        'categories': categories,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'categories_json': json.dumps(categories_json, ensure_ascii=False),
        'user_trips': user_trips,
    })
# ==========================================================
# ذخیره سفر (با پاسخ JSON برای AJAX)
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

            def parse_jalali_date(date_str):
                try:
                    parts = date_str.split('/')
                    if len(parts) == 3:
                        jy, jm, jd = int(parts[0]), int(
                            parts[1]), int(parts[2])
                        return jdatetime.date(jy, jm, jd).togregorian()
                    return None
                except:
                    return None

            start_date = parse_jalali_date(
                start_date_str) or timezone.now().date()
            end_date = parse_jalali_date(end_date_str) or (
                start_date + timedelta(days=duration_days - 1))

            interests = json.loads(interests_json) if interests_json else []
            suggested_places = json.loads(
                suggested_places_json) if suggested_places_json else []

            budget_toman = 0
            if '-' in budget_str:
                parts = budget_str.split('-')
                budget_toman = int(parts[1]) if len(
                    parts) > 1 and parts[1].isdigit() else 0

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
                status='planned',
            )

            redirect_url = f'/result/{trip.id}/'

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

    return render(request, 'trip_result.html', {
        'trip': trip,
        'places_in_trip': places_in_trip,
        'places_json': json.dumps(places_in_trip, ensure_ascii=False),
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

    fake_trip = FakeTrip(plan, duration_days)

    return render(request, 'trip_result.html', {
        'trip': fake_trip,
        'plan': plan,
        'places_in_trip': places_in_trip,
        'places_json': json.dumps(places_in_trip, ensure_ascii=False),
        'empty_categories': [],
        'low_categories': [],
        'start_jalali': None,
        'end_jalali': None,
        'is_plan_mode': True,
    })


# ==========================================================
# صفحه نقشه
# ==========================================================
def map_page(request):
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
            ).select_related('place', 'place__category').order_by('day_number', 'visit_order')

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
                '1_day': 1, '2_days': 2, '3_days': 3, '5_days': 5, '7_days': 7
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

    # ═══════════════════════════════════════════════════════
    # ✅ اینجا favorite_ids رو تعریف کن (قبل از return)
    # ═══════════════════════════════════════════════════════
    favorite_ids = []
    if request.user.is_authenticated:
        favorite_ids = list(
            UserFavorite.objects.filter(
                user=request.user
            ).values_list('place_id', flat=True)
        )
    print(f'❤️ User: {request.user} | Favorites: {favorite_ids}')  # ← برای دیباگ

    return render(request, 'map.html', {
        'places': places,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'trip_json': json.dumps(trip_json, ensure_ascii=False) if trip_json else None,
        'trip_mode': bool(trip_data),
        'is_plan_mode': is_plan_mode,
        'plan': plan_data,
        'favorite_ids': json.dumps(favorite_ids),  # ✅ حالا تعریف شده
    })

# ==========================================================
# بارگذاری سفر
# ==========================================================
def load_trip(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
        return redirect(f'/result/{trip.id}/')
    except Trip.DoesNotExist:
        messages.error(request, 'سفر یافت نشد.')
        return redirect('plan')


# ==========================================================
# ثبت نظر جاذبه
# ==========================================================
def submit_place_review(request, slug):
    if request.method == 'POST':
        place = get_object_or_404(Place, slug=slug, is_active=True)

        if not request.user.is_authenticated:
            messages.error(request, 'برای ثبت نظر ابتدا وارد شوید.')
            return redirect('place_detail', slug=slug)

        comment = request.POST.get('comment', '').strip()
        rating = int(request.POST.get('rating', 5))

        if comment:
            Review.objects.create(
                user=request.user,
                place=place,
                rating=rating,
                comment=comment,
                is_approved=True
            )
            messages.success(request, 'نظر شما با موفقیت ثبت شد!')
        else:
            messages.error(request, 'متن نظر نمی‌تونه خالی باشه.')

        return redirect('place_detail', slug=slug)

    return redirect('place_detail', slug=slug)

# ==========================================================
# ✅ ذخیره/حذف جاذبه از علاقه‌مندی‌ها (AJAX)
# ==========================================================
def toggle_favorite(request, slug):
    """ذخیره یا حذف جاذبه از علاقه‌مندی‌های کاربر"""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({
            'status': 'auth_required',
            'message': 'برای ذخیره باید وارد شوید'
        }, status=401)
    
    place = get_object_or_404(Place, slug=slug, is_active=True)
    
    favorite = UserFavorite.objects.filter(user=request.user, place=place).first()
    
    if favorite:
        # حذف از علاقه‌مندی‌ها
        favorite.delete()
        return JsonResponse({
            'status': 'removed',
            'message': 'از ذخیره‌شده‌ها حذف شد',
            'is_favorite': False
        })
    else:
        # اضافه به علاقه‌مندی‌ها
        UserFavorite.objects.create(user=request.user, place=place)
        return JsonResponse({
            'status': 'added',
            'message': 'به ذخیره‌شده‌ها اضافه شد',
            'is_favorite': True
        })


# ==========================================================
# ✅ داشبورد کاربر
# ==========================================================
@login_required(login_url='login')
def dashboard_page(request):
    """داشبورد کاربر با تب‌های مختلف"""
    user = request.user
    
    # ✅ تب فعال
    active_tab = request.GET.get('tab', 'trips')
    if active_tab not in ['trips', 'favorites', 'reviews', 'profile']:
        active_tab = 'trips'
    
    # ✅ آمار کاربر (به‌صورت لیست برای اطمینان)
    today = timezone.now().date()
    
    all_trips_qs = Trip.objects.filter(user=user)
    all_trips = list(all_trips_qs)
    total_trips = len(all_trips)
    
    # سفر جاری
    current_trip = None
    for trip in all_trips:
        if trip.start_date <= today <= trip.end_date:
            current_trip = trip
            break
    
    # علاقه‌مندی‌ها
    favorites_qs = UserFavorite.objects.filter(user=user).select_related('place', 'place__category').order_by('-created_at')
    favorites = list(favorites_qs)
    total_favorites = len(favorites)
    
    # نظرات کاربر
    reviews_qs = Review.objects.filter(user=user).select_related('place', 'article').order_by('-created_at')
    reviews = list(reviews_qs)
    total_reviews = len(reviews)
    
    # ✅ سفرها با مرتب‌سازی
    trips_list = []
    for trip in all_trips:
        start_j = gregorian_to_jalali(trip.start_date)
        end_j = gregorian_to_jalali(trip.end_date)
        
        # وضعیت
        if trip.start_date <= today <= trip.end_date:
            status = 'current'
        elif trip.start_date > today:
            status = 'upcoming'
        else:
            status = 'past'
        
        # عکس
        trip_image = '/static/img/asiyab-haye-abi.jpg'
        if trip.suggested_places:
            first_place_id = trip.suggested_places[0].get('id')
            if first_place_id:
                first_place = Place.objects.filter(id=first_place_id).first()
                if first_place:
                    trip_image = get_place_image(first_place)
        
        trips_list.append({
            'id': trip.id,
            'start_jalali': f"{start_j.year}/{start_j.month:02d}/{start_j.day:02d}" if start_j else '-',
            'end_jalali': f"{end_j.year}/{end_j.month:02d}/{end_j.day:02d}" if end_j else '-',
            'duration_days': trip.duration_days,
            'companions': trip.companions,
            'interests': trip.interests or [],
            'status': status,
            'image': trip_image,
            'start_date': trip.start_date,
            'end_date': trip.end_date,
        })
    
    # مرتب‌سازی: جاری → آینده → گذشته
    trips_list.sort(key=lambda t: (
        0 if t['status'] == 'current' else (1 if t['status'] == 'upcoming' else 2),
        t['start_date'] if t['status'] != 'past' else -t['start_date'].toordinal()
    ))
    
    # فیلتر سفرها
    trips_filter = request.GET.get('filter', 'all')
    if trips_filter == 'current':
        trips_list = [t for t in trips_list if t['status'] == 'current']
    elif trips_filter == 'upcoming':
        trips_list = [t for t in trips_list if t['status'] == 'upcoming']
    elif trips_filter == 'past':
        trips_list = [t for t in trips_list if t['status'] == 'past']
    
    # ✅ نظرات کاربر با جزئیات
    reviews_list = []
    for review in reviews:
        if review.place:
            target = {
                'type': 'place',
                'name': review.place.name,
                'slug': review.place.slug,
                'image': get_place_image(review.place),
                'url': f'/place/{review.place.slug}/'
            }
        elif review.article:
            target = {
                'type': 'article',
                'name': review.article.title,
                'slug': review.article.slug,
                'image': f'/static/img/{review.article.slug}.jpg',
                'url': f'/articles/{review.article.slug}/'
            }
        else:
            continue
        
        reviews_list.append({
            'id': review.id,
            'rating': review.rating,
            'comment': review.comment,
            'created_at': review.created_at,
            'target': target,
        })
    
    # ✅ علاقه‌مندی‌ها با جزئیات
    favorites_list = []
    for fav in favorites:
        place = fav.place
        favorites_list.append({
            'id': fav.id,
            'place_id': place.id,
            'name': place.name,
            'slug': place.slug,
            'category': place.category.name if place.category else '',
            'short_description': place.short_description or '',
            'image': get_place_image(place),
            'rating': place.rating_avg,
            'duration': place.duration_minutes,
            'cost': place.cost_toman,
            'added_at': fav.created_at,
        })
    
    # ✅ تبدیل تاریخ عضویت
    join_date_jalali = gregorian_to_jalali(user.date_joined.date()) if user.date_joined else None
    join_date_str = f"{join_date_jalali.year}/{join_date_jalali.month:02d}/{join_date_jalali.day:02d}" if join_date_jalali else '-'
    
    # ✅ محبوب‌ترین دسته‌بندی کاربر
    favorite_categories = {}
    for fav in favorites_list:
        cat = fav['category']
        if cat:
            favorite_categories[cat] = favorite_categories.get(cat, 0) + 1
    
    top_category = None
    if favorite_categories:
        top_category = max(favorite_categories.items(), key=lambda x: x[1])[0]
    
    # ✅ آواتار کاربر (حرف اول)
    user_initial = (user.first_name[0] if user.first_name else user.username[0]).upper()
    
    context = {
        'active_tab': active_tab,
        'trips_filter': trips_filter,
        
        # آمار
        'total_trips': total_trips,
        'total_favorites': total_favorites,
        'total_reviews': total_reviews,
        'current_trip': current_trip,
        'top_category': top_category,
        
        # داده‌ها
        'trips': trips_list,
        'favorites': favorites_list,
        'reviews': reviews_list,
        
        # اطلاعات کاربر
        'user_initial': user_initial,
        'join_date': join_date_str,
    }
    print("=" * 60)
    print("🔍 DEBUG DASHBOARD")
    print(f"USER: {user.username}")
    print(f"TOTAL_TRIPS: {total_trips} (type: {type(total_trips)})")
    print(f"TOTAL_FAVORITES: {total_favorites} (type: {type(total_favorites)})")
    print(f"TOTAL_REVIEWS: {total_reviews} (type: {type(total_reviews)})")
    print(f"JOIN_DATE: {join_date_str}")
    print("=" * 60)
    
    return render(request, 'dashboard.html', context)

# ==========================================================
# ✅ حذف سفر
# ==========================================================
@login_required(login_url='login')
def delete_trip(request, trip_id):
    """حذف سفر کاربر"""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    
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
# ✅ حذف نظر
# ==========================================================
@login_required(login_url='login')
def delete_review(request, review_id):
    """حذف نظر کاربر"""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    
    review = get_object_or_404(Review, id=review_id, user=request.user)
    review.delete()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'deleted',
            'message': 'نظر با موفقیت حذف شد'
        })
    
    messages.success(request, 'نظر با موفقیت حذف شد.')
    return redirect('dashboard')


# ==========================================================
# ✅ ویرایش پروفایل
# ==========================================================
@login_required(login_url='login')
def update_profile(request):
    """ویرایش اطلاعات پروفایل کاربر"""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    
    user = request.user
    
    first_name = request.POST.get('first_name', '').strip()
    last_name = request.POST.get('last_name', '').strip()
    email = request.POST.get('email', '').strip()
    phone = request.POST.get('phone', '').strip()
    
    # ✅ بررسی ایمیل تکراری
    if email and email != user.email:
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'این ایمیل قبلاً استفاده شده است'
            }, status=400)
    
    # ✅ بررسی تلفن تکراری
    if phone and phone != user.phone:
        if User.objects.filter(phone=phone).exclude(id=user.id).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'این شماره تلفن قبلاً استفاده شده است'
            }, status=400)
    
    # ✅ ذخیره
    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.phone = phone if phone else None
    
    # ✅ آپلود عکس پروفایل
    if 'avatar' in request.FILES:
        avatar_file = request.FILES['avatar']
        # بررسی حجم فایل (حداکثر ۲ مگابایت)
        if avatar_file.size > 2 * 1024 * 1024:
            return JsonResponse({
                'status': 'error',
                'message': 'حجم عکس نباید بیشتر از ۲ مگابایت باشد'
            }, status=400)
        # بررسی نوع فایل
        if not avatar_file.content_type.startswith('image/'):
            return JsonResponse({
                'status': 'error',
                'message': 'فایل باید عکس باشد'
            }, status=400)
        user.avatar = avatar_file
    
    # ✅ تغییر رمز عبور
    new_password = request.POST.get('new_password', '').strip()
    if new_password:
        if len(new_password) < 6:
            return JsonResponse({
                'status': 'error',
                'message': 'رمز عبور باید حداقل ۶ کاراکتر باشد'
            }, status=400)
        user.set_password(new_password)
        from django.contrib.auth import update_session_auth_hash
        update_session_auth_hash(request, user)
    
    user.save()
    
    return JsonResponse({
        'status': 'updated',
        'message': 'اطلاعات پروفایل با موفقیت به‌روزرسانی شد'
    })
def test_algorithm_page(request):
    from decimal import Decimal
    
    places = Place.objects.filter(is_active=True).select_related('category')
    categories = Category.objects.filter(type='attraction', parent__isnull=True)
    
    places_json = []
    for place in places:
        # ✅ تبدیل Decimal به float
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
    
    return render(request, 'test_algorithm.html', {
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'categories_json': json.dumps(categories_json, ensure_ascii=False),
    })