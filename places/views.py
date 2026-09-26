import os
from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Avg, Q
from django.http import JsonResponse
from django.utils.text import Truncator
import json

from .models import Place, Category, Review
from .utils import get_place_image
from accounts.models import UserFavorite


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

    return render(request, 'places/attraction.html', {
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
        category=place.category
    ).exclude(id=place.id)[:6]

    reviews = Review.objects.filter(
        place=place, is_approved=True
    ).select_related('user')

    avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or place.rating_avg

    # ⭐ گالری: اول از فیلد مدل، اگه خالی بود از پوشه
    gallery_images = []

    if place.gallery:
        # ─── حالت ۱: از فیلد JSONField مدل ───
        gallery_images = list(place.gallery)
    else:
        # ─── حالت ۲: اسکن پوشه ───
        gallery_dir = os.path.join(settings.BASE_DIR, 'static', 'img', 'Gallery-img')

        if os.path.exists(gallery_dir):
            all_files = os.listdir(gallery_dir)
            valid_ext = ('.jpg', '.jpeg', '.png', '.webp')

            for f in all_files:
                name, ext = os.path.splitext(f)
                if ext.lower() in valid_ext:
                    if name.startswith(slug):
                        gallery_images.append(f)

            # مرتب‌سازی: اول slug.x، بعد slug-1.x، slug-2.x، ...
            def sort_key(filename):
                name = os.path.splitext(filename)[0]
                if name == slug:
                    return (0, '')
                suffix = name[len(slug):].lstrip('-')
                try:
                    return (1, int(suffix))
                except ValueError:
                    return (2, suffix)

            gallery_images.sort(key=sort_key)

    is_favorited = False
    if request.user.is_authenticated:
        is_favorited = UserFavorite.objects.filter(
            user=request.user,
            place=place
        ).exists()

    return render(request, 'places/place_detail.html', {
        'place': place,
        'related_places': related_places,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
        'gallery': gallery_images,
        'is_favorited': is_favorited,
    })


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
# ذخیره/حذف جاذبه از علاقه‌مندی‌ها (AJAX)
# ==========================================================
def toggle_favorite(request, slug):
    if request.method != 'POST':
        return JsonResponse(
            {'status': 'error', 'message': 'Method not allowed'},
            status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({
            'status': 'auth_required',
            'message': 'برای ذخیره باید وارد شوید'
        }, status=401)

    place = get_object_or_404(Place, slug=slug, is_active=True)

    favorite = UserFavorite.objects.filter(
        user=request.user, place=place).first()

    if favorite:
        favorite.delete()
        return JsonResponse({
            'status': 'removed',
            'message': 'از ذخیره‌شده‌ها حذف شد',
            'is_favorite': False
        })
    else:
        UserFavorite.objects.create(user=request.user, place=place)
        return JsonResponse({
            'status': 'added',
            'message': 'به ذخیره‌شده‌ها اضافه شد',
            'is_favorite': True
        })


# ==========================================================
# حذف نظر
# ==========================================================
@login_required(login_url='login')
def delete_review(request, review_id):
    if request.method != 'POST':
        return JsonResponse(
            {'status': 'error', 'message': 'Method not allowed'},
            status=405
        )

    review = get_object_or_404(Review, id=review_id, user=request.user)
    review.delete()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'deleted',
            'message': 'نظر با موفقیت حذف شد'
        })

    messages.success(request, 'نظر با موفقیت حذف شد.')
    return redirect('dashboard')