from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import Trip, Plan, PlanAttraction, Route, RouteStop


@admin.register(Trip)
class TripAdmin(ImportExportModelAdmin):
    list_display = ('user', 'title', 'start_date', 'end_date', 'duration_days', 'status', 'created_at')
    list_filter = ('status', 'has_children', 'created_at')
    search_fields = ('user__username', 'title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Plan)
class PlanAdmin(ImportExportModelAdmin):
    list_display = ('name', 'slug', 'duration', 'duration_days', 'estimated_cost', 'is_featured', 'is_active')
    list_filter = ('duration', 'is_featured', 'is_active')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(PlanAttraction)
class PlanAttractionAdmin(ImportExportModelAdmin):
    list_display = ('plan', 'place', 'day_number', 'visit_order')
    list_filter = ('day_number',)
    search_fields = ('plan__name', 'place__name')


@admin.register(Route)
class RouteAdmin(ImportExportModelAdmin):
    list_display = ('name', 'slug', 'route_type', 'duration_minutes', 'distance_km', 'is_active')
    list_filter = ('route_type', 'is_active', 'is_scenic')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(RouteStop)
class RouteStopAdmin(ImportExportModelAdmin):
    list_display = ('route', 'stop_name', 'stop_order', 'place')
    list_filter = ('route',)
    search_fields = ('stop_name', 'route__name')