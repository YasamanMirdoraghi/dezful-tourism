from django.shortcuts import render, get_object_or_404
from .models import Place, Category, Article, Plan, Route, ArticleBlock
import json
from django.db.models import Count
from django.db.models import Avg
from datetime import datetime, timedelta

# ==========================================================
# صفحه اصلی (خانه)
# ==========================================================
from django.shortcuts import render
from .models import Place, Category, Article, Plan, Route, Review, User
from django.db.models import Avg, Count

def home(request):
    featured_places = Place.objects.filter(is_active=True)
    plans = Plan.objects.filter(is_active=True)
    featured_articles = Article.objects.filter(is_published=True).order_by('-created_at')
    
    # ===== محاسبه آمار داینامیک =====
    places_count = Place.objects.filter(is_active=True).count()  # تعداد جاذبه‌ها
    
    users_count = User.objects.filter(is_active=True).count()  # تعداد کاربران (مسافران)
    
    plans_count = Plan.objects.filter(is_active=True).count()  # تعداد پلن‌ها
    
    reviews_count = Review.objects.filter(is_approved=True).count()  # تعداد نظرات
    
    # میانگین امتیاز از نظرات
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
    
    # فقط دسته‌های اصلی (بدون parent) - با prefetch برای زیرمجموعه‌ها
    parent_categories = Category.objects.filter(type='attraction', parent__isnull=True).prefetch_related('children')
    
    # ساخت لیست JSON برای جاوااسکریپت
    places_json = []
    for place in places:
        places_json.append({
            'id': place.id,
            'name': place.name,
            'category': place.category.name if place.category else '',
            'parent_category': place.category.parent.name if place.category and place.category.parent else (place.category.name if place.category else ''),
            'cost': place.cost_toman,
            'short_description': place.short_description or '',
            'image': place.main_image.url if place.main_image else '',
        })
    
    return render(request, 'attraction.html', {
        'places': places,
        'categories': parent_categories,
        'places_json': json.dumps(places_json, ensure_ascii=False),
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
            'image': article.main_image.url if article.main_image else '',
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
    related = Article.objects.filter(category=article.category).exclude(id=article.id)[:4]
    
    return render(request, 'article.html', {
        'article': article,
        'related': related,
    })

# ==========================================================
# صفحه برنامه‌ریز سفر
# ==========================================================
def plan_page(request):
    categories = Category.objects.filter(type='attraction')
    
    return render(request, 'plan.html', {
        'categories': categories,
    })

# ==========================================================
# صفحه نقشه
# ==========================================================
def map_page(request):
    places = Place.objects.filter(is_active=True)
    
    return render(request, 'map.html', {
        'places': places,
    })