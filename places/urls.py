from django.urls import path
from . import views

app_name = 'places'

urlpatterns = [
    # لیست جاذبه‌ها
    path('attractions/', views.attraction_page, name='attraction'),

    # جزئیات جاذبه
    path('place/<slug:slug>/', views.place_detail_page, name='place_detail'),

    # ثبت نظر روی جاذبه
    path('place/<slug:slug>/review/', views.submit_place_review, name='submit_place_review'),

    # ذخیره/حذف از علاقه‌مندی‌ها
    path('favorite/<slug:slug>/toggle/', views.toggle_favorite, name='toggle_favorite'),

    # حذف نظر
    path('review/<int:review_id>/delete/', views.delete_review, name='delete_review'),
]