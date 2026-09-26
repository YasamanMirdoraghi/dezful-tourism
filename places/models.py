from django.db import models
from django.conf import settings


# ==========================================================
# ۱. دسته‌بندی
# ==========================================================
class Category(models.Model):
    TYPE_CHOICES = [('attraction', 'Attraction'), ('article', 'Article')]

    name = models.CharField(max_length=100, unique=True)
    slug = models.CharField(max_length=120, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='attraction')
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    icon = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=20, default='#118b71')
    description = models.TextField(null=True, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'دسته‌بندی'
        verbose_name_plural = 'دسته‌بندی‌ها'

    def __str__(self):
        return self.name


# ==========================================================
# ۲. تگ
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

    class Meta:
        verbose_name = 'تگ'
        verbose_name_plural = 'تگ‌ها'

    def __str__(self):
        return self.name


# ==========================================================
# ۳. جاذبه
# ==========================================================
class Place(models.Model):
    name = models.CharField(max_length=200)
    slug = models.CharField(max_length=220, unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='places'
    )
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
    contact_info = models.CharField(max_length=300, null=True, blank=True)
    rating_avg = models.FloatField(default=0)
    visit_count = models.BigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tags = models.ManyToManyField(Tag, through='PlaceTag', related_name='places')

    class Meta:
        verbose_name = 'جاذبه'
        verbose_name_plural = 'جاذبه‌ها'

    def __str__(self):
        return self.name


# ==========================================================
# ۴. ارتباط جاذبه و تگ
# ==========================================================
class PlaceTag(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('place', 'tag')
        verbose_name = 'تگ جاذبه'
        verbose_name_plural = 'تگ‌های جاذبه'


# ==========================================================
# ۵. نظرات
# ==========================================================
class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reviews'
    )
    article = models.ForeignKey(
        'articles.Article',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reviews'
    )
    rating = models.SmallIntegerField()
    comment = models.TextField()
    likes_count = models.IntegerField(default=0)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'نظر'
        verbose_name_plural = 'نظرات'

    def __str__(self):
        target = self.place.name if self.place else self.article.title if self.article else 'Unknown'
        return f"{self.user.username} - {target}: {self.rating}⭐"