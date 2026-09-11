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
    ArticleBlock, ArticleRelated, Contact, Trip
)


# ==========================================================
# تابع کمکی: پیدا کردن عکس جاذبه
# ==========================================================
def get_place_image(place):
    slug = place.slug
    formats = ['.jpg', '.png', '.jpeg', '.webp']
    for fmt in formats:
        image_path = os.path.join(settings.BASE_DIR, 'static', 'img', f'{slug}{fmt}')
        if os.path.exists(image_path):
            return f'/static/img/{slug}{fmt}'
    return '/static/img/asiyab-haye-abi.jpg'


# ==========================================================
# صفحه اصلی
# ==========================================================
def home(request):
    featured_places = Place.objects.filter(is_active=True)
    plans = Plan.objects.filter(is_active=True)
    featured_articles = Article.objects.filter(is_published=True).order_by('-created_at')

    places_count = Place.objects.filter(is_active=True).count()
    users_count = User.objects.filter(is_active=True).count()
    plans_count = Plan.objects.filter(is_active=True).count()
    reviews_count = Review.objects.filter(is_approved=True).count()
    avg_rating = Review.objects.filter(is_approved=True, rating__gt=0).aggregate(avg=Avg('rating'))['avg'] or 4.8

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
    places = Place.objects.filter(is_active=True).select_related('category__parent')
    categories = Category.objects.filter(type='attraction', parent__isnull=True).prefetch_related('children')

    places_json = []
    for place in places:
        short_desc = Truncator(place.short_description or '').words(15, truncate=' …')
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
    related_places = Place.objects.filter(category=place.category).exclude(id=place.id)[:6]
    reviews = Review.objects.filter(place=place, is_approved=True).select_related('user')
    avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or place.rating_avg
    gallery = place.gallery if place.gallery else []

    return render(request, 'place_detail.html', {
        'place': place,
        'related_places': related_places,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
        'gallery': gallery,
    })


# ==========================================================
# صفحه مقالات
# ==========================================================
def articles_page(request):
    articles = Article.objects.filter(is_published=True).order_by('-created_at')
    categories = Category.objects.filter(type='article')

    author_counts = {}
    authors = articles.values('author').annotate(count=Count('id')).order_by('author')
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
    three_months_count = articles.filter(published_date__gte=three_months_ago.date()).count()
    six_months_count = articles.filter(published_date__gte=six_months_ago.date()).count()
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
    article_blocks = ArticleBlock.objects.filter(article=article).order_by('block_order')
    headings = [block for block in article_blocks if block.block_type == 'heading']

    for i, block in enumerate(headings, 1):
        block.toc_number = i

    related = Article.objects.filter(category=article.category).exclude(id=article.id)[:6]
    reviews = Review.objects.filter(article=article, is_approved=True).select_related('user')
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
            if not User.objects.exists(username=username):
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                )
                login(request, user)
                messages.success(request, 'حساب کاربری شما با موفقیت ساخته شد!')
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
# صفحه برنامه‌ریز
# ==========================================================
def plan_page(request):
    places = Place.objects.filter(is_active=True).select_related('category').annotate(
        reviews_count=Count('reviews', filter=Q(reviews__is_approved=True))
    )
    categories = Category.objects.filter(type='attraction')

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
        }
        for cat in categories
    ]

    user_trips = Trip.objects.filter(user=request.user).order_by('-created_at')[:5] if request.user.is_authenticated else []

    return render(request, 'plan.html', {
        'places': places,
        'categories': categories,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'categories_json': json.dumps(categories_json, ensure_ascii=False),
        'user_trips': user_trips,
    })


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
                        jy, jm, jd = int(parts[0]), int(parts[1]), int(parts[2])
                        return jdatetime.date(jy, jm, jd).togregorian()
                    return None
                except:
                    return None

            start_date = parse_jalali_date(start_date_str) or timezone.now().date()
            end_date = parse_jalali_date(end_date_str) or (start_date + timedelta(days=duration_days - 1))

            interests = json.loads(interests_json) if interests_json else []
            suggested_places = json.loads(suggested_places_json) if suggested_places_json else []

            budget_toman = 0
            if '-' in budget_str:
                parts = budget_str.split('-')
                budget_toman = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0

            companions = 1
            if companions_str.isdigit():
                companions = int(companions_str)
            elif companions_str == '5+':
                companions = 5

            # ذخیره سفر
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

            # ✅ اگه AJAX بود، JSON برگردون
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'trip_id': trip.id,
                    'redirect_url': redirect_url
                })

            # در غیر این صورت، redirect معمولی
            return redirect(redirect_url)

        except Exception as e:
            # ✅ خطا در AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': str(e)
                }, status=400)

            messages.error(request, f'خطا در ذخیره سفر: {str(e)}')
            return redirect('plan')

    return redirect('plan')


# ==========================================================
# ✅ NEW: صفحه نتیجه سفر
# ==========================================================
def trip_result_page(request, trip_id):
    """صفحه اختصاصی نمایش نتیجه سفر"""
    trip = get_object_or_404(Trip, id=trip_id)

    # اگه کاربر لاگین‌شده سفرش رو می‌خواد
    # اگه کاربر مهمون هست و سفر مهمون‌هاست، بازم می‌تونه ببینه (اشتراک‌گذاری)
    # فقط اگه سفر مال کاربر دیگه‌ای هست، اجازه نده
    if trip.user and request.user.is_authenticated and trip.user != request.user:
        # سفر مال کاربر دیگه‌ست
        # اینجا می‌تونی چک کنی آیا سفر عمومیه یا نه
        # فعلاً اجازه می‌دیم ببینه (چون URL رو داره)
        pass

    # ساخت لیست جاذبه‌های سفر
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

    # ✅ تحلیل هشدارها
    warnings = analyze_trip_warnings(trip)

    # جاذبه‌های مربوط به علاقه‌مندی‌ها (برای هشدار)
    interests = trip.interests or []
    empty_categories = []
    low_categories = []

    for cat_name in interests:
        count = Place.objects.filter(category__name=cat_name, is_active=True).count()
        if count == 0:
            empty_categories.append(cat_name)
        elif count < 3:
            low_categories.append({'name': cat_name, 'count': count})

    # تبدیل تاریخ به شمسی
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
    })


def analyze_trip_warnings(trip):
    """تحلیل هشدارهای سفر"""
    interests = trip.interests or []
    empty = []
    low = []

    for cat_name in interests:
        count = Place.objects.filter(category__name=cat_name, is_active=True).count()
        if count == 0:
            empty.append(cat_name)
        elif count < 3:
            low.append({'name': cat_name, 'count': count})

    return {
        'empty': empty,
        'low': low,
    }


# ==========================================================
# صفحه نقشه
# ==========================================================
def map_page(request):
    places = Place.objects.filter(is_active=True)

    trip_id = request.GET.get('trip')
    trip_data = None
    trip_days = {}

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

    places_json = []
    for place in places:
        places_json.append({
            'id': place.id,
            'name': place.name,
            'slug': place.slug,
            'cat': place.category.name if place.category else '',
            'sub': place.short_description or '',
            'cost': place.cost_toman,
            'duration': place.duration_minutes,
            'rating': place.rating_avg,
            'child': place.is_child_friendly,
            'lat': float(place.latitude) if place.latitude else 32.38,
            'lng': float(place.longitude) if place.longitude else 48.42,
            'image': get_place_image(place),
            'desc': place.description or place.short_description or '',
        })

    trip_json = None
    if trip_data:
        trip_json = {
            'id': trip_data.id,
            'start_date': trip_data.start_date.isoformat() if trip_data.start_date else '',
            'end_date': trip_data.end_date.isoformat() if trip_data.end_date else '',
            'duration_days': trip_data.duration_days,
            'interests': trip_data.interests,
            'suggested_places': trip_data.suggested_places,
            'days': trip_days,
        }

    return render(request, 'map.html', {
        'places': places,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'trip_json': json.dumps(trip_json, ensure_ascii=False) if trip_json else None,
        'trip_mode': bool(trip_data),
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
    
# core/views.py
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
                is_approved=True  # یا False برای تایید ادمین
            )
            messages.success(request, 'نظر شما با موفقیت ثبت شد!')
        else:
            messages.error(request, 'متن نظر نمی‌تونه خالی باشه.')
        
        return redirect('place_detail', slug=slug)
    
    return redirect('place_detail', slug=slug)