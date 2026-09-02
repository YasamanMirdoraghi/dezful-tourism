from django.db import models  
from django.contrib.auth.models import AbstractUser

# ==========================================================
# ۱. کاربر
# ==========================================================
class User(AbstractUser):
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    avatar = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('admin', 'Admin')], default='user')
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username

# ==========================================================
# ۲. دسته‌بندی
# ==========================================================

class Category(models.Model):
    TYPE_CHOICES = [('attraction', 'Attraction'), ('article', 'Article')]
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.CharField(max_length=120, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='attraction')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    icon = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=20, default='#118b71')
    description = models.TextField(null=True, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

# ==========================================================
# ۳. تگ
# ==========================================================

class Tag(models.Model):
    TYPE_CHOICES = [('attraction', 'Attraction'), ('article', 'Article'), ('both', 'Both')]
    
    name = models.CharField(max_length=50, unique=True)
    slug = models.CharField(max_length=60, unique=True)
    icon = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=20, default='#118b71')
    weight = models.FloatField(default=1.0)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='both')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# ==========================================================
# ۴. جاذبه (بدون PointField)
# ==========================================================

class Place(models.Model):
    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=220, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='places')
    short_description = models.CharField(max_length=300, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    cost_toman = models.BigIntegerField(default=0)
    is_child_friendly = models.BooleanField(default=False)
    duration_minutes = models.IntegerField(default=60)
    opening_hours = models.CharField(max_length=100, null=True, blank=True)
    best_visit_time = models.CharField(max_length=50, null=True, blank=True)
    main_image = models.ImageField(upload_to='attractions/', null=True, blank=True)
    gallery = models.JSONField(default=list, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    rating_avg = models.FloatField(default=0)
    visit_count = models.BigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    tags = models.ManyToManyField(Tag, through='PlaceTag', related_name='places')

    def __str__(self):
        return self.name

# ==========================================================
# ۵. ارتباط جاذبه و تگ
# ==========================================================

class PlaceTag(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('place', 'tag')

# ==========================================================
# ۶. مسیر (بدون LineStringField)
# ==========================================================
class Route(models.Model):
    ROUTE_TYPES = [('walk', 'Walking'), ('car', 'Car'), ('bike', 'Bike')]
    
    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=220, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    origin = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name='routes_as_origin')
    destination = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name='routes_as_destination')
    # route_path = models.LineStringField(...)  ← حذف شد
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

    def __str__(self):
        return self.name

# ==========================================================
# ۷. ایستگاه‌های مسیر
# ==========================================================
class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True)
    stop_name = models.CharField(max_length=150)
    stop_order = models.IntegerField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    class Meta:
        unique_together = ('route', 'stop_order')

    def __str__(self):
        return f"{self.route.name} - {self.stop_name}"

# ==========================================================
# ۸. مقاله
# ==========================================================
class Article(models.Model):
    FEATURED_CHOICES = [('popular', 'Popular'), ('featured', 'Featured'), ('new', 'New'), ('normal', 'Normal')]
    DATE_RANGE_CHOICES = [('month', 'This Month'), ('three-months', 'Last 3 Months'), ('six-months', 'Last 6 Months'), ('year', 'Last Year')]
    
    title = models.CharField(max_length=250)
    slug = models.CharField(max_length=270, unique=True)
    excerpt = models.TextField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='articles')
    author = models.CharField(max_length=150, null=True, blank=True)
    author_avatar = models.ImageField(upload_to='authors/', null=True, blank=True)
    published_date = models.DateField(null=True, blank=True)
    published_date_jalali = models.CharField(max_length=20, null=True, blank=True)
    duration = models.IntegerField(default=5)
    views = models.BigIntegerField(default=0)
    main_image = models.ImageField(upload_to='articles/', null=True, blank=True)
    featured = models.CharField(max_length=20, choices=FEATURED_CHOICES, default='normal')
    date_range = models.CharField(max_length=30, choices=DATE_RANGE_CHOICES, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    related_articles = models.ManyToManyField('self', blank=True, through='ArticleRelated', symmetrical=False)

    def __str__(self):
        return self.title

# ==========================================================
# ۹. مقالات مرتبط
# ==========================================================
class ArticleRelated(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='related_from')
    related = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='related_to')
    
    class Meta:
        unique_together = ('article', 'related')

# ==========================================================
# ۱۰. بلوک‌های محتوای مقاله
# ==========================================================
class ArticleBlock(models.Model):
    BLOCK_TYPES = [('heading', 'Heading'), ('paragraph', 'Paragraph'), ('image', 'Image'), ('quote', 'Quote'), ('lead', 'Lead')]
    
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='blocks')
    block_type = models.CharField(max_length=20, choices=BLOCK_TYPES)
    block_order = models.IntegerField()
    text = models.TextField(null=True, blank=True)
    src = models.CharField(max_length=255, null=True, blank=True)
    alt = models.CharField(max_length=255, null=True, blank=True)
    caption = models.CharField(max_length=255, null=True, blank=True)
    block_id = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        unique_together = ('article', 'block_order')
        ordering = ['block_order']

    def __str__(self):
        return f"{self.article.title} - {self.block_type} #{self.block_order}"

# ==========================================================
# ۱۱. نظرات
# ==========================================================
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    rating = models.SmallIntegerField()
    comment = models.TextField()
    likes_count = models.IntegerField(default=0)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.place.name if self.place else self.article.title if self.article else 'Unknown'
        return f"{self.user.username} - {target}: {self.rating}⭐"

# ==========================================================
# ۱۲. سفر
# ==========================================================
class Trip(models.Model):
    STATUS_CHOICES = [('draft', 'Draft'), ('planned', 'Planned'), ('in_progress', 'In Progress'), ('completed', 'Completed')]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    title = models.CharField(max_length=200, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.IntegerField()
    companions = models.IntegerField(default=1)
    has_children = models.BooleanField(default=False)
    budget_toman = models.BigIntegerField()
    interests = models.JSONField(default=list, blank=True)
    suggested_places = models.JSONField(default=list, blank=True)
    suggested_routes = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.start_date} to {self.end_date}"

# ==========================================================
# ۱۳. پلن
# ==========================================================
class Plan(models.Model):
    DURATION_CHOICES = [('1_day', '1 Day'), ('2_days', '2 Days'), ('3_days', '3 Days'), ('5_days', '5 Days'), ('7_days', '7 Days')]
    
    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=220, unique=True)
    description = models.TextField(null=True, blank=True)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES)
    badge = models.CharField(max_length=50, null=True, blank=True)
    estimated_cost = models.BigIntegerField(default=0)
    main_image = models.ImageField(upload_to='plans/', null=True, blank=True)
    color = models.CharField(max_length=20, default='#118b71')
    icon = models.CharField(max_length=50, null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    attractions = models.ManyToManyField(Place, through='PlanAttraction', related_name='plans')

    def __str__(self):
        return self.name

# ==========================================================
# ۱۴. ارتباط پلن و جاذبه
# ==========================================================
class PlanAttraction(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    day_number = models.IntegerField(default=1)
    visit_order = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('plan', 'place')

    def __str__(self):
        return f"{self.plan.name} - Day {self.day_number}: {self.place.name}"

# ==========================================================
# ۱۵. علاقه‌مندی‌های کاربر
# ==========================================================
class UserFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'place')

    def __str__(self):
        return f"{self.user.username} ❤️ {self.place.name}"