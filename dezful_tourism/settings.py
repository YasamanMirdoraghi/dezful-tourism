"""
Django settings for dezful_tourism project.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================================================
# امنیت (برای توسعه)
# ==========================================================
SECRET_KEY = 'django-insecure-0hktv1i384g5-xb=d)_pq+3=js3-2$_-b0-i*7zxik0(0+f-n4'
DEBUG = True
ALLOWED_HOSTS = []

# ==========================================================
# اپ‌های نصب‌شده
# ==========================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',  # اپ خودت
    'import_export',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'dezful_tourism.urls'

# ==========================================================
# تمپلیت‌ها (قالب‌های HTML)
# ==========================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dezful_tourism.wsgi.application'

# ==========================================================
# دیتابیس (SQLite - برای توسعه)
# ==========================================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # ← تغییر به PostgreSQL
        'NAME': 'dezful_tourism_db',      # ← اسم دیتابیسی که توی pgAdmin ساختی
        'USER': 'postgres',               # ← کاربر پیش‌فرض
        'PASSWORD': 'Yasaman123',             # ← پسورد خودت رو بذار (همونی که موقع نصب PostgreSQL دادی)
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# ==========================================================
# اعتبارسنجی رمز عبور
# ==========================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ==========================================================
# بین‌المللی‌سازی (زبان و زمان)
# ==========================================================
LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

# ==========================================================
# فایل‌های استاتیک (CSS, JS, Images)
# ==========================================================
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ==========================================================
# فایل‌های مدیا (عکس‌های آپلودی)
# ==========================================================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ==========================================================
# تنظیمات ایمیل (برای تست در کنسول)
# ==========================================================
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ==========================================================
# مدل کاربر سفارشی
# ==========================================================
AUTH_USER_MODEL = 'core.User'