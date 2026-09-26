from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('contact/', views.contact_page, name='contact'),
    path('map/', views.map_page, name='map'),
]