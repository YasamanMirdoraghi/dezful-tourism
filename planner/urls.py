from django.urls import path
from . import views

app_name = 'planner'

urlpatterns = [
    # ویزارد برنامه‌ریز
    path('', views.plan_page, name='plan'),

    # ذخیره سفر
    path('save/', views.save_trip, name='save_trip'),

    # نتیجه سفر شخصی
    path('result/<int:trip_id>/', views.trip_result_page, name='trip_result'),

    # بارگذاری سفر
    path('load/<int:trip_id>/', views.load_trip, name='load_trip'),

    # حذف سفر
    path('trip/<int:trip_id>/delete/', views.delete_trip, name='delete_trip'),

    # نتیجه پلن پیشنهادی
    path('plan/<slug:slug>/', views.plan_detail_page, name='plan_detail'),

    # تست الگوریتم
    path('test-algorithm/', views.test_algorithm_page, name='test_algorithm'),
]