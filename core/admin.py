from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from .models import (
    Category, Tag, Place, PlaceTag, Route, RouteStop,
    Article, ArticleBlock, ArticleRelated, Plan, PlanAttraction,
    Review, Trip, UserFavorite, User
)

# ==========================================================
# Resources برای هر مدل
# ==========================================================

class CategoryResource(resources.ModelResource):
    class Meta:
        model = Category
        import_id_fields = ('id',)
        fields = ('id', 'name', 'slug', 'type', 'parent', 'icon', 'color', 'description', 'display_order')

class TagResource(resources.ModelResource):
    class Meta:
        model = Tag
        import_id_fields = ('id',)
        fields = ('id', 'name', 'slug', 'icon', 'color', 'weight', 'type')

class PlaceResource(resources.ModelResource):
    class Meta:
        model = Place
        import_id_fields = ('id',)
        fields = ('id', 'name', 'slug', 'category', 'short_description', 'description', 
                 'address', 'latitude', 'longitude', 'cost_toman', 'is_child_friendly',
                 'duration_minutes', 'opening_hours', 'best_visit_time', 'main_image',
                 'phone', 'rating_avg', 'visit_count', 'is_active', 'is_featured')

class PlaceTagResource(resources.ModelResource):
    class Meta:
        model = PlaceTag
        import_id_fields = ('id',)
        fields = ('id', 'place', 'tag')

class RouteResource(resources.ModelResource):
    class Meta:
        model = Route
        import_id_fields = ('id',)
        fields = ('id', 'name', 'slug', 'category', 'origin', 'destination',
                 'route_path', 'route_type', 'duration_minutes', 'distance_km',
                 'is_scenic', 'description', 'historical_significance', 'access_info',
                 'main_image', 'rating_avg', 'visit_count', 'is_active')

class RouteStopResource(resources.ModelResource):
    class Meta:
        model = RouteStop
        import_id_fields = ('id',)
        fields = ('id', 'route', 'place', 'stop_name', 'stop_order', 'latitude', 'longitude', 'note')

class ArticleResource(resources.ModelResource):
    class Meta:
        model = Article
        import_id_fields = ('id',)
        fields = ('id', 'title', 'slug', 'excerpt', 'category', 'author', 'author_avatar',
                 'published_date', 'published_date_jalali', 'duration', 'views',
                 'main_image', 'featured', 'date_range', 'tags', 'is_published')

class ArticleBlockResource(resources.ModelResource):
    class Meta:
        model = ArticleBlock
        import_id_fields = ('id',)
        fields = ('id', 'article', 'block_type', 'block_order', 'text', 'src', 'alt', 'caption', 'block_id')

class ArticleRelatedResource(resources.ModelResource):
    class Meta:
        model = ArticleRelated
        import_id_fields = ('id',)
        fields = ('id', 'article', 'related')  # ← relationship_type حذف شد

class PlanResource(resources.ModelResource):
    class Meta:
        model = Plan
        import_id_fields = ('id',)
        fields = ('id', 'name', 'slug', 'description', 'duration', 'badge',
                 'estimated_cost', 'main_image', 'color', 'icon', 'is_featured',
                 'display_order', 'is_active')

# ==========================================================
# ثبت در ادمین
# ==========================================================

@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    resource_class = CategoryResource
    list_display = ('name', 'slug', 'type', 'display_order')
    list_filter = ('type',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Tag)
class TagAdmin(ImportExportModelAdmin):
    resource_class = TagResource
    list_display = ('name', 'slug', 'type', 'weight')
    list_filter = ('type',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Place)
class PlaceAdmin(ImportExportModelAdmin):
    resource_class = PlaceResource
    list_display = ('name', 'slug', 'category', 'is_active', 'is_featured', 'cost_toman')
    list_filter = ('category', 'is_active', 'is_featured')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')

@admin.register(PlaceTag)
class PlaceTagAdmin(ImportExportModelAdmin):
    resource_class = PlaceTagResource
    list_display = ('place', 'tag')

@admin.register(Route)
class RouteAdmin(ImportExportModelAdmin):
    resource_class = RouteResource
    list_display = ('name', 'route_type', 'is_scenic', 'is_active')
    list_filter = ('route_type', 'is_active')

@admin.register(RouteStop)
class RouteStopAdmin(ImportExportModelAdmin):
    resource_class = RouteStopResource
    list_display = ('route', 'stop_name', 'stop_order')
    list_filter = ('route',)

@admin.register(Article)
class ArticleAdmin(ImportExportModelAdmin):
    resource_class = ArticleResource
    list_display = ('title', 'author', 'published_date', 'is_published')
    list_filter = ('is_published', 'category', 'featured')
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title', 'author')

@admin.register(ArticleBlock)
class ArticleBlockAdmin(ImportExportModelAdmin):
    resource_class = ArticleBlockResource
    list_display = ('article', 'block_type', 'block_order')

@admin.register(ArticleRelated)
class ArticleRelatedAdmin(ImportExportModelAdmin):
    resource_class = ArticleRelatedResource
    list_display = ('article', 'related')  # ← اصلاح شد

@admin.register(Plan)
class PlanAdmin(ImportExportModelAdmin):
    resource_class = PlanResource
    list_display = ('name', 'duration', 'is_featured', 'is_active')
    prepopulated_fields = {'slug': ('name',)}

# ==========================================================
# ثبت ساده برای بقیه مدل‌ها
# ==========================================================

@admin.register(Review)
class ReviewAdmin(ImportExportModelAdmin):
    list_display = ('user', 'rating', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'rating')

@admin.register(Trip)
class TripAdmin(ImportExportModelAdmin):
    list_display = ('user', 'status', 'duration_days', 'created_at')

@admin.register(UserFavorite)
class UserFavoriteAdmin(ImportExportModelAdmin):
    list_display = ('user', 'place', 'created_at')

admin.site.register(User)
admin.site.register(PlanAttraction)

from .models import Contact

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('name', 'email', 'subject')