from django.urls import path
from . import views

app_name = 'articles'

urlpatterns = [
    # لیست مقالات
    path('', views.articles_page, name='articles'),

    # جزئیات مقاله
    path('<slug:slug>/', views.article_detail_page, name='article_detail'),

    # ثبت نظر روی مقاله
    path('<slug:slug>/review/', views.submit_review, name='submit_review'),
]