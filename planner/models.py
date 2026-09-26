from django.db import models
from django.conf import settings


# ==========================================================
# ۱. سفر
# ==========================================================
class Trip(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trips',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.IntegerField()
    companions = models.IntegerField(default=1)
    has_children = models.BooleanField(default=False)
    budget_toman = models.BigIntegerField()
    interests = models.JSONField(default=list, blank=True)
    suggested_places = models.JSONField(default=list, blank=True)
    daily_durations = models.JSONField(default=list, blank=True)
    suggested_routes = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'سفر'
        verbose_name_plural = 'سفرها'

    def __str__(self):
        user = self.user.username if self.user else 'Guest'
        return f"{user} - {self.start_date} to {self.end_date}"


# ==========================================================
# ۲. پلن
# ==========================================================
class Plan(models.Model):
    DURATION_CHOICES = [
        ('1_day', '1 Day'),
        ('2_days', '2 Days'),
        ('3_days', '3 Days'),
        ('5_days', '5 Days'),
        ('7_days', '7 Days'),
    ]

    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=220, unique=True)
    description = models.TextField(null=True, blank=True)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES)
    duration_days = models.IntegerField(default=1)
    badge = models.CharField(max_length=50, null=True, blank=True)
    estimated_cost = models.BigIntegerField(default=0)
    budget_toman = models.BigIntegerField(default=0)
    companions = models.IntegerField(default=2)
    has_children = models.BooleanField(default=False)
    interests = models.JSONField(default=list, blank=True)
    main_image = models.ImageField(upload_to='plans/', null=True, blank=True)
    color = models.CharField(max_length=20, default='#118b71')
    icon = models.CharField(max_length=50, null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    attractions = models.ManyToManyField(
        'places.Place',
        through='PlanAttraction',
        related_name='plans'
    )

    class Meta:
        verbose_name = 'پلن'
        verbose_name_plural = 'پلن‌ها'

    def __str__(self):
        return self.name


# ==========================================================
# ۳. ارتباط پلن و جاذبه
# ==========================================================
class PlanAttraction(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    place = models.ForeignKey('places.Place', on_delete=models.CASCADE)
    day_number = models.IntegerField(default=1)
    visit_order = models.IntegerField(default=0)

    class Meta:
        unique_together = ('plan', 'place')
        ordering = ['day_number', 'visit_order']
        verbose_name = 'جاذبه پلن'
        verbose_name_plural = 'جاذبه‌های پلن'

    def __str__(self):
        return f"{self.plan.name} - Day {self.day_number}: {self.place.name}"


# ==========================================================
# ۴. مسیر
# ==========================================================
class Route(models.Model):
    ROUTE_TYPES = [('walk', 'Walking'), ('car', 'Car'), ('bike', 'Bike')]

    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=220, unique=True)
    category = models.ForeignKey(
        'places.Category',
        on_delete=models.SET_NULL,
        null=True
    )
    origin = models.ForeignKey(
        'places.Place',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='routes_as_origin'
    )
    destination = models.ForeignKey(
        'places.Place',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='routes_as_destination'
    )
    route_type = models.CharField(max_length=10, choices=ROUTE_TYPES, default='walk')
    duration_minutes = models.IntegerField(default=20)
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    is_scenic = models.BooleanField(default=True)
    description = models.TextField(null=True, blank=True)
    historical_significance = models.TextField(null=True, blank=True)
    access_info = models.TextField(null=True, blank=True)
    main_image = models.ImageField(upload_to='routes/', null=True, blank=True)
    rating_avg = models.FloatField(default=0)
    visit_count = models.BigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'مسیر'
        verbose_name_plural = 'مسیرها'

    def __str__(self):
        return self.name


# ==========================================================
# ۵. ایستگاه‌های مسیر
# ==========================================================
class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    place = models.ForeignKey(
        'places.Place',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    stop_name = models.CharField(max_length=150)
    stop_order = models.IntegerField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('route', 'stop_order')
        verbose_name = 'ایستگاه'
        verbose_name_plural = 'ایستگاه‌ها'

    def __str__(self):
        return f"{self.route.name} - {self.stop_name}"