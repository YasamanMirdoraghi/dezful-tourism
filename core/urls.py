from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('attraction/', views.attraction_page, name='attraction'),
    path('place/<slug:slug>/', views.place_detail_page, name='place_detail'),
    path('articles/', views.articles_page, name='articles'),
    path('articles/<slug:slug>/', views.article_detail_page, name='article_detail'),
    path('articles/<slug:slug>/review/', views.submit_review, name='submit_review'),
    path('plan/', views.plan_page, name='plan'),
    path('map/', views.map_page, name='map'),
    path('contact/', views.contact_page, name='contact'),
    
    # ===== مسیرهای احراز هویت =====
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('register/', views.register_page, name='register'),
]