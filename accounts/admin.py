from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from import_export.admin import ImportExportModelAdmin
from .models import User, UserFavorite


@admin.register(User)
class UserAdmin(BaseUserAdmin, ImportExportModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('اطلاعات اضافی', {
            'fields': ('phone', 'avatar', 'role')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('اطلاعات اضافی', {
            'fields': ('phone', 'role')
        }),
    )


@admin.register(UserFavorite)
class UserFavoriteAdmin(ImportExportModelAdmin):
    list_display = ('user', 'place', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'place__name')