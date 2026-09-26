from django.db import models


# ==========================================================
# ۱. مقاله
# ==========================================================
class Article(models.Model):
    FEATURED_CHOICES = [
        ('popular', 'Popular'),
        ('featured', 'Featured'),
        ('new', 'New'),
        ('normal', 'Normal'),
    ]
    DATE_RANGE_CHOICES = [
        ('month', 'This Month'),
        ('three-months', 'Last 3 Months'),
        ('six-months', 'Last 6 Months'),
        ('year', 'Last Year'),
    ]

    title = models.CharField(max_length=250)
    slug = models.CharField(max_length=270, unique=True)
    excerpt = models.TextField(null=True, blank=True)
    category = models.ForeignKey(
        'places.Category',
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles'
    )
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

    related_articles = models.ManyToManyField(
        'self',
        blank=True,
        through='ArticleRelated',
        symmetrical=False
    )

    class Meta:
        verbose_name = 'مقاله'
        verbose_name_plural = 'مقالات'

    def __str__(self):
        return self.title


# ==========================================================
# ۲. مقالات مرتبط
# ==========================================================
class ArticleRelated(models.Model):
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='related_from'
    )
    related = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='related_to'
    )

    class Meta:
        unique_together = ('article', 'related')
        verbose_name = 'مقاله مرتبط'
        verbose_name_plural = 'مقالات مرتبط'


# ==========================================================
# ۳. بلوک‌های محتوای مقاله
# ==========================================================
class ArticleBlock(models.Model):
    BLOCK_TYPES = [
        ('heading', 'Heading'),
        ('paragraph', 'Paragraph'),
        ('image', 'Image'),
        ('quote', 'Quote'),
        ('lead', 'Lead'),
    ]

    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='blocks'
    )
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
        verbose_name = 'بلوک محتوا'
        verbose_name_plural = 'بلوک‌های محتوا'

    def __str__(self):
        return f"{self.article.title} - {self.block_type} #{self.block_order}"