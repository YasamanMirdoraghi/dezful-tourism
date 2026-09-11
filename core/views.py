from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from django.db.models import Count, Avg
from django.utils import timezone
from django.utils.text import Truncator
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
# تابع کمکی: پیدا کردن عکس جاذبه با فرمت‌های مختلف
# ==========================================================
def get_place_image(place):
    """پیدا کردن عکس جاذبه با فرمت‌های مختلف"""
    slug = place.slug
    formats = ['.jpg', '.png', '.jpeg', '.webp']
    
    for fmt in formats:
        image_path = os.path.join(settings.BASE_DIR, 'static', 'img', f'{slug}{fmt}')
        if os.path.exists(image_path):
            return f'/static/img/{slug}{fmt}'
    
    return '/static/img/asiyab-haye-abi.jpg'

# ==========================================================
# صفحه اصلی (خانه)
# ==========================================================
def home(request):
    featured_places = Place.objects.filter(is_active=True)
    plans = Plan.objects.filter(is_active=True)
    featured_articles = Article.objects.filter(is_published=True).order_by('-created_at')
    
    # ===== محاسبه آمار داینامیک =====
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
        # محدود کردن توضیح کوتاه به ۱۵ کلمه
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
# صفحه تکی جاذبه (فقط یک نسخه - با گالری)
# ==========================================================
def place_detail_page(request, slug):
    place = get_object_or_404(Place, slug=slug, is_active=True)
    related_places = Place.objects.filter(category=place.category).exclude(id=place.id)[:6]
    reviews = Review.objects.filter(place=place, is_approved=True).select_related('user')
    avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or place.rating_avg
    
    # گالری تصاویر
    gallery = place.gallery if place.gallery else []
    
    return render(request, 'place_detail.html', {
        'place': place,
        'related_places': related_places,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
        'gallery': gallery,
    })

# ==========================================================
# صفحه مقالات (لیست)
# ==========================================================
def articles_page(request):
    articles = Article.objects.filter(is_published=True).order_by('-created_at')
    categories = Category.objects.filter(type='article')
    
    # ===== محاسبه تعداد هر نویسنده =====
    author_counts = {}
    authors = articles.values('author').annotate(count=Count('id')).order_by('author')
    for author in authors:
        if author['author']:
            author_counts[author['author']] = author['count']
    
    # ===== محاسبه تعداد زمان مطالعه =====
    short_count = articles.filter(duration__lt=5).count()
    medium_count = articles.filter(duration__gte=5, duration__lte=10).count()
    long_count = articles.filter(duration__gt=10).count()
    
    # ===== محاسبه تعداد تاریخ انتشار بر اساس published_date =====
    now = datetime.now()
    month_ago = now - timedelta(days=30)
    three_months_ago = now - timedelta(days=90)
    six_months_ago = now - timedelta(days=180)
    year_ago = now - timedelta(days=365)
    
    month_count = articles.filter(published_date__gte=month_ago.date()).count()
    three_months_count = articles.filter(published_date__gte=three_months_ago.date()).count()
    six_months_count = articles.filter(published_date__gte=six_months_ago.date()).count()
    year_count = articles.filter(published_date__gte=year_ago.date()).count()
    
    # ===== محاسبه تعداد محبوبیت =====
    popular_count = articles.filter(featured='popular').count()
    featured_count = articles.filter(featured='featured').count()
    new_count = articles.filter(featured='new').count()
    
    # ساخت لیست JSON برای جاوااسکریپت
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
# ثبت نظر جدید
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
# صفحه تماس با ما
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
# ثبت‌نام کاربر
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
                messages.success(request, 'حساب کاربری شما با موفقیت ساخته شد!')
                return redirect('home')
            else:
                messages.error(request, 'نام کاربری قبلاً ثبت شده است!')
        else:
            messages.error(request, 'رمز عبورها مطابقت ندارند!')
    
    return render(request, 'register.html')

# ==========================================================
# خروج از حساب
# ==========================================================
def logout_view(request):
    auth_logout(request)
    return redirect('home')

# ==========================================================
# صفحه برنامه‌ریز سفر
# ==========================================================
# ==========================================================
# صفحه برنامه‌ریز سفر
# ==========================================================
def plan_page(request):
    places = Place.objects.filter(is_active=True).select_related('category')
    categories = Category.objects.filter(type='attraction')
    
    places_json = []
    for place in places:
        # توضیح کوتاه برای popup نقشه و کارت‌ها
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
            # ✅ فیلدهای جدید که برای الگوریتم‌ها نیاز داریم:
            'rating': float(place.rating_avg) if place.rating_avg else 3.5,
            'views': place.visit_count or 0,
            'desc': desc,
            'short_description': desc,
        })
    
    # دسته‌بندی‌ها به صورت JSON برای استفاده در الگوریتم‌ها
    categories_json = [
        {
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'icon': cat.icon or 'fa-map-marker-alt',
        }
        for cat in categories
    ]
    
    # سفرهای اخیر کاربر
    user_trips = Trip.objects.filter(user=request.user).order_by('-created_at')[:5] if request.user.is_authenticated else []
    
    return render(request, 'plan.html', {
        'places': places,
        'categories': categories,
        'places_json': json.dumps(places_json, ensure_ascii=False),
        'categories_json': json.dumps(categories_json, ensure_ascii=False),  # ✅ جدید
        'user_trips': user_trips,
    })
# ==========================================================
# توابع تبدیل تاریخ
# ==========================================================
def jalali_to_gregorian(jy, jm, jd):
    """تبدیل تاریخ شمسی به میلادی"""
    try:
        gregorian_date = jdatetime.date(jy, jm, jd).togregorian()
        return gregorian_date
    except Exception:
        return timezone.now().date()

def gregorian_to_jalali(date_obj):
    """تبدیل تاریخ میلادی به شمسی"""
    try:
        return jdatetime.date.fromgregorian(date=date_obj)
    except:
        return None

# ==========================================================
# ذخیره سفر (فقط یک نسخه - کامل با jdatetime)
# ==========================================================
@login_required
def save_trip(request):
    if request.method == 'POST':
        try:
            # دریافت داده‌ها از فرم
            start_date_str = request.POST.get('start_date', '')
            end_date_str = request.POST.get('end_date', '')
            duration_days = int(request.POST.get('duration_days', 1))
            companions_str = request.POST.get('companions', '1')
            has_children = request.POST.get('has_children', 'false') == 'true'
            budget_str = request.POST.get('budget_toman', '')
            interests_json = request.POST.get('interests', '[]')
            suggested_places_json = request.POST.get('suggested_places', '[]')
            
            # تبدیل تاریخ شمسی به میلادی
            def parse_jalali_date(date_str):
                """تبدیل رشته تاریخ شمسی (1404/05/15) به تاریخ میلادی"""
                try:
                    parts = date_str.split('/')
                    if len(parts) == 3:
                        jy, jm, jd = int(parts[0]), int(parts[1]), int(parts[2])
                        gregorian = jdatetime.date(jy, jm, jd).togregorian()
                        return gregorian
                    return None
                except:
                    return None
            
            start_date = parse_jalali_date(start_date_str) or timezone.now().date()
            end_date = parse_jalali_date(end_date_str) or (start_date + timedelta(days=duration_days - 1))
            
            # تبدیل رشته‌ها به JSON
            interests = json.loads(interests_json) if interests_json else []
            suggested_places = json.loads(suggested_places_json) if suggested_places_json else []
            
            # بودجه - از رشته "3000000-5000000" عدد سقف رو بردارید
            budget_toman = 0
            if '-' in budget_str:
                parts = budget_str.split('-')
                budget_toman = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
            
            # تعداد همراهان
            companions = 1
            if companions_str.isdigit():
                companions = int(companions_str)
            elif companions_str == '5+':
                companions = 5
            
            # ساخت یا به‌روزرسانی سفر
            trip, created = Trip.objects.update_or_create(
                user=request.user,
                start_date=start_date,
                end_date=end_date,
                defaults={
                    'duration_days': duration_days,
                    'companions': companions,
                    'has_children': has_children,
                    'budget_toman': budget_toman,
                    'interests': interests,
                    'suggested_places': suggested_places,
                    'status': 'planned',
                }
            )
            
            # هدایت به نقشه گردشگری با شناسه سفر
            return redirect(f'/map/?trip={trip.id}')
            
        except Exception as e:
            messages.error(request, f'خطا در ذخیره سفر: {str(e)}')
            return redirect('plan')
    
    return redirect('plan')

# ==========================================================
# صفحه نقشه
# ==========================================================
def map_page(request):
    places = Place.objects.filter(is_active=True)
    
    # دریافت شناسه سفر از URL (اگر کاربر از صفحه برنامه‌ریز آمده باشد)
    trip_id = request.GET.get('trip')
    trip_data = None
    trip_days = {}
    
    if trip_id and request.user.is_authenticated:
        try:
            trip = Trip.objects.get(id=trip_id, user=request.user)
            trip_data = trip
            
            # ساخت دیکشنری روزها: {day_number: [place_ids]}
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
    
    # اگر trip_data وجود دارد، اطلاعات سفر را به جاوااسکریپت بفرست
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
# بارگذاری سفر (مشاهده روی نقشه)
# ==========================================================
def load_trip(request, trip_id):
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        trip = Trip.objects.get(id=trip_id, user=request.user)
        
        # هدایت به نقشه با شناسه سفر
        return redirect(f'/map/?trip={trip.id}')
        
    except Trip.DoesNotExist:
        messages.error(request, 'سفر یافت نشد.')
        return redirect('plan')