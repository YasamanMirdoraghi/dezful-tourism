from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.db.models import Count, Avg
from datetime import datetime, timedelta
import json

from .models import Article, ArticleBlock
from places.models import Category, Review


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

    return render(request, 'articles/articles.html', {
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

    return render(request, 'articles/article.html', {
        'article': article,
        'article_blocks': article_blocks,
        'headings': headings,
        'related': related,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
    })


# ==========================================================
# ثبت نظر مقاله
# ==========================================================
def submit_review(request, slug):
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug, is_published=True)
        comment = request.POST.get('comment', '').strip()
        rating = request.POST.get('rating', 5)

        if not comment:
            messages.error(request, 'لطفاً متن نظر را وارد کنید.')
            return redirect('articles:article_detail', slug=slug)

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

        return redirect('articles:article_detail', slug=slug)

    return redirect('articles:article_detail', slug=slug)