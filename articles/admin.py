from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import Article, ArticleRelated, ArticleBlock


@admin.register(Article)
class ArticleAdmin(ImportExportModelAdmin):
    list_display = ('title', 'category', 'author', 'published_date_jalali', 'duration', 'views', 'featured', 'is_published')
    list_filter = ('featured', 'is_published', 'category', 'date_range')
    search_fields = ('title', 'slug', 'excerpt', 'author')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_published', 'featured')


@admin.register(ArticleRelated)
class ArticleRelatedAdmin(ImportExportModelAdmin):
    list_display = ('article', 'related')
    search_fields = ('article__title', 'related__title')


@admin.register(ArticleBlock)
class ArticleBlockAdmin(ImportExportModelAdmin):
    list_display = ('article', 'block_type', 'block_order')
    list_filter = ('block_type',)
    search_fields = ('article__title', 'text')
    ordering = ('article', 'block_order')