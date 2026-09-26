from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(ImportExportModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('is_read',)