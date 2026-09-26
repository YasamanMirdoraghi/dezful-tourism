from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'accounts'

urlpatterns = [
    # ورود با LoginView جنگو
    path('login/', auth_views.LoginView.as_view(
        template_name='accounts/login.html',
        redirect_authenticated_user=True,
    ), name='login'),

    # خروج
    path('logout/', views.logout_view, name='logout'),

    # ثبت‌نام
    path('register/', views.register_page, name='register'),

    # داشبورد
    path('dashboard/', views.dashboard_page, name='dashboard'),

    # ویرایش پروفایل
    path('update-profile/', views.update_profile, name='update_profile'),
]