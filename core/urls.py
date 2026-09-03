from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('attraction/', views.attraction_page, name='attraction'),
    path('articles/', views.articles_page, name='articles'),
    path('articles/<slug:slug>/', views.article_detail_page, name='article_detail'),
    path('plan/', views.plan_page, name='plan'),
    path('map/', views.map_page, name='map'),
    path('articles/<slug:slug>/review/', views.submit_review, name='submit_review'),
]