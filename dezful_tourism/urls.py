from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # اپ‌های ماژولار
    path('', include('core.urls')),
    path('accounts/', include('accounts.urls')),
    path('places/', include('places.urls')),
    path('articles/', include('articles.urls')),
    path('planner/', include('planner.urls')),
]

# نمایش عکس‌ها در حالت توسعه
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)