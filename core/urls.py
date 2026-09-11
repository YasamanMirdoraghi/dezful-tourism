from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from django.views.generic import RedirectView

urlpatterns = [
    path('', views.home, name='home'),
    path('attraction/', views.attraction_page, name='attraction'),
    path('place/<slug:slug>/', views.place_detail_page, name='place_detail'),
    path('articles/', views.articles_page, name='articles'),
    path('articles/<slug:slug>/', views.article_detail_page, name='article_detail'),
    path('articles/<slug:slug>/review/', views.submit_review, name='submit_review'),
    path('map/', views.map_page, name='map'),
    path('plan/', views.plan_page, name='plan'),
    path('plan/save/', views.save_trip, name='save_trip'),
    path('plan/<int:trip_id>/load/', views.load_trip, name='load_trip'),
    path('contact/', views.contact_page, name='contact'),

    # core/urls.py
    path('place/<slug:slug>/review/', views.submit_place_review, name='submit_place_review'), 
    # ===== مسیرهای احراز هویت =====
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_page, name='register'),
    # ✅ NEW: صفحه نتیجه سفر
    path('result/<int:trip_id>/', views.trip_result_page, name='trip_result'),
]