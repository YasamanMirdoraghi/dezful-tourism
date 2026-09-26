from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone

from .models import User, UserFavorite
from places.models import Place, Review
from planner.models import Trip
from places.utils import get_place_image
from core.utils import gregorian_to_jalali


# ==========================================================
# ثبت‌نام
# ==========================================================
def register_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        email = request.POST.get('email', '')
        phone = request.POST.get('phone', '') or None
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
                return redirect('core:home')   # ✅ درست
            else:
                messages.error(request, 'نام کاربری قبلاً ثبت شده است!')
        else:
            messages.error(request, 'رمز عبورها مطابقت ندارند!')

    return render(request, 'accounts/register.html')


# ==========================================================
# خروج
# ==========================================================
def logout_view(request):
    auth_logout(request)
    return redirect('core:home')


# ==========================================================
# داشبورد کاربر
# ==========================================================
@login_required(login_url='login')
def dashboard_page(request):
    user = request.user

    active_tab = request.GET.get('tab', 'trips')
    if active_tab not in ['trips', 'favorites', 'reviews', 'profile']:
        active_tab = 'trips'

    today = timezone.now().date()

    all_trips = list(Trip.objects.filter(user=user))
    total_trips = len(all_trips)

    current_trip = None
    for trip in all_trips:
        if trip.start_date <= today <= trip.end_date:
            current_trip = trip
            break

    favorites_qs = UserFavorite.objects.filter(user=user).select_related(
        'place', 'place__category').order_by('-created_at')
    favorites = list(favorites_qs)
    total_favorites = len(favorites)

    reviews_qs = Review.objects.filter(user=user).select_related(
        'place', 'article').order_by('-created_at')
    reviews = list(reviews_qs)
    total_reviews = len(reviews)

    # لیست سفرها
    trips_list = []
    for trip in all_trips:
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

    trips_list.sort(key=lambda t: (
        0 if t['status'] == 'current' else (
            1 if t['status'] == 'upcoming' else 2),
        t['start_date'] if t['status'] != 'past' else -t['start_date'].toordinal()
    ))

    trips_filter = request.GET.get('filter', 'all')
    if trips_filter == 'current':
        trips_list = [t for t in trips_list if t['status'] == 'current']
    elif trips_filter == 'upcoming':
        trips_list = [t for t in trips_list if t['status'] == 'upcoming']
    elif trips_filter == 'past':
        trips_list = [t for t in trips_list if t['status'] == 'past']

    # لیست نظرات
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

    # لیست علاقه‌مندی‌ها
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

    join_date_jalali = gregorian_to_jalali(
        user.date_joined.date()) if user.date_joined else None
    join_date_str = f"{join_date_jalali.year}/{join_date_jalali.month:02d}/{join_date_jalali.day:02d}" if join_date_jalali else '-'

    favorite_categories = {}
    for fav in favorites_list:
        cat = fav['category']
        if cat:
            favorite_categories[cat] = favorite_categories.get(cat, 0) + 1

    top_category = None
    if favorite_categories:
        top_category = max(favorite_categories.items(), key=lambda x: x[1])[0]

    user_initial = (
        user.first_name[0] if user.first_name else user.username[0]).upper()

    context = {
        'active_tab': active_tab,
        'trips_filter': trips_filter,
        'total_trips': total_trips,
        'total_favorites': total_favorites,
        'total_reviews': total_reviews,
        'current_trip': current_trip,
        'top_category': top_category,
        'trips': trips_list,
        'favorites': favorites_list,
        'reviews': reviews_list,
        'user_initial': user_initial,
        'join_date': join_date_str,
    }

    return render(request, 'accounts/dashboard.html', context)


# ==========================================================
# ویرایش پروفایل
# ==========================================================
@login_required(login_url='login')
def update_profile(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    user = request.user

    first_name = request.POST.get('first_name', '').strip()
    last_name = request.POST.get('last_name', '').strip()
    email = request.POST.get('email', '').strip()
    phone = request.POST.get('phone', '').strip()

    if email and email != user.email:
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'این ایمیل قبلاً استفاده شده است'
            }, status=400)

    if phone and phone != user.phone:
        if User.objects.filter(phone=phone).exclude(id=user.id).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'این شماره تلفن قبلاً استفاده شده است'
            }, status=400)

    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.phone = phone if phone else None

    if 'avatar' in request.FILES:
        avatar_file = request.FILES['avatar']
        if avatar_file.size > 2 * 1024 * 1024:
            return JsonResponse({
                'status': 'error',
                'message': 'حجم عکس نباید بیشتر از ۲ مگابایت باشد'
            }, status=400)
        if not avatar_file.content_type.startswith('image/'):
            return JsonResponse({
                'status': 'error',
                'message': 'فایل باید عکس باشد'
            }, status=400)
        user.avatar = avatar_file

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