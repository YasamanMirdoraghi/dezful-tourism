from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import Category, Tag, Place, PlaceTag, Review


@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    list_display = ('name', 'slug', 'type', 'parent', 'color', 'display_order')
    list_filter = ('type', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(ImportExportModelAdmin):
    list_display = ('name', 'slug', 'type', 'color', 'weight')
    list_filter = ('type',)
    search_fields = ('name', 'slug')


@admin.register(Place)
class PlaceAdmin(ImportExportModelAdmin):
    list_display = ('name', 'category', 'cost_toman', 'duration_minutes', 'rating_avg', 'is_active', 'is_featured')
    list_filter = ('category', 'is_active', 'is_featured', 'is_child_friendly')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active', 'is_featured')


@admin.register(PlaceTag)
class PlaceTagAdmin(ImportExportModelAdmin):
    list_display = ('place', 'tag')
    search_fields = ('place__name', 'tag__name')


@admin.register(Review)
class ReviewAdmin(ImportExportModelAdmin):
    list_display = ('user', 'place', 'article', 'rating', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved', 'created_at')
    search_fields = ('user__username', 'comment', 'place__name', 'article__title')
    list_editable = ('is_approved',)