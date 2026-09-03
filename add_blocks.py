import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dezful_tourism.settings')
django.setup()

from core.models import Article, ArticleBlock

# ==========================================================
# حذف همه بلوک‌های مقالات موجود
# ==========================================================
print("🗑️ حذف همه بلوک‌های مقالات...")
ArticleBlock.objects.all().delete()
print("✅ همه بلوک‌ها حذف شدند!\n")

# ==========================================================
# تعریف بلوک‌های هر مقاله با slug های صحیح
# ==========================================================
all_blocks = {
    "complete-travel-guide-dezful": [
        ("lead", 1, "دزفول یکی از شهرهای تاریخی و زیبای ایران است که با جاذبه‌های فراوان، هر ساله گردشگران زیادی را به خود جذب می‌کند.", None, None, None),
        ("heading", 2, "چرا دزفول؟", "why-dezful", None, None),
        ("paragraph", 3, "دزفول با داشتن پل قدیم، آبشار شوی، بازار کهنه و ده‌ها جاذبه دیگر، مقصدی عالی برای سفر است.", None, None, None),
        ("image", 4, None, None, "slide1.webp", "نمای شهر دزفول"),
        ("heading", 5, "بهترین زمان سفر", "best-time", None, None),
        ("paragraph", 6, "بهترین زمان برای سفر به دزفول، فصل‌های بهار و پاییز است.", None, None, None),
        ("heading", 7, "چگونه به دزفول برویم؟", "transportation", None, None),
        ("paragraph", 8, "دزفول از طریق جاده، راه‌آهن و فرودگاه قابل دسترسی است.", None, None, None),
    ],
    "1500-years-history-dezful": [
        ("lead", 1, "دزفول شهری با قدمت بیش از ۱۵۰۰ سال است که تاریخچه‌ای غنی دارد.", None, None, None),
        ("heading", 2, "دوران ساسانی", "sassanid-era", None, None),
        ("paragraph", 3, "دزفول در دوران ساسانیان به عنوان یک شهر مهم شناخته می‌شد.", None, None, None),
        ("image", 4, None, None, "pl-e-ghadim.jpg", "پل قدیم دزفول - یادگار دوران ساسانی"),
        ("heading", 5, "دوران اسلامی", "islamic-era", None, None),
        ("paragraph", 6, "پس از ورود اسلام، دزفول به عنوان مرکز علمی و فرهنگی مهم شناخته شد.", None, None, None),
    ],
    "10-natural-attractions-dezful": [
        ("lead", 1, "دزفول علاوه بر جاذبه‌های تاریخی، دارای طبیعت بکر و زیبایی است.", None, None, None),
        ("heading", 2, "آبشار شوی", "abshar-shooy", None, None),
        ("paragraph", 3, "آبشار شوی با ارتفاع ۸۵ متر، بلندترین آبشار فصلی خوزستان است.", None, None, None),
        ("image", 4, None, None, "abshear-shooy.jpg", "آبشار شوی"),
        ("heading", 5, "رودخانه دز", "dez-river", None, None),
        ("paragraph", 6, "رودخانه دز با آب‌های خنک، مقصدی عالی برای تفریحات آبی است.", None, None, None),
    ],
    "traditional-foods-dezful": [
        ("lead", 1, "غذاهای محلی دزفول بخش جدایی‌ناپذیر فرهنگ این شهر است.", None, None, None),
        ("heading", 2, "شله دزفولی", "sholeh", None, None),
        ("paragraph", 3, "شله دزفولی یک غذای سنتی و محبوب است که با برنج، حبوبات و ادویه‌های مخصوص تهیه می‌شود.", None, None, None),
        ("image", 4, None, None, "sholeh.jpg", "شله دزفولی"),
        ("heading", 5, "کباب دزفولی", "kabab", None, None),
        ("paragraph", 6, "کباب دزفولی با گوشت تازه و نان محلی، یکی از لذیذترین کباب‌های ایران است.", None, None, None),
    ],
    "best-accommodations-dezful": [
        ("lead", 1, "برای اقامت در دزفول، گزینه‌های متنوعی از هتل‌های مدرن تا اقامتگاه‌های بوم‌گردی وجود دارد.", None, None, None),
        ("heading", 2, "هتل‌های دزفول", "hotels", None, None),
        ("paragraph", 3, "دزفول دارای هتل‌های مختلفی با امکانات متنوع است.", None, None, None),
        ("heading", 4, "اقامتگاه‌های بوم‌گردی", "ecotourism", None, None),
        ("paragraph", 5, "اقامتگاه‌های بوم‌گردی دزفول تجربه‌ای متفاوت از زندگی سنتی ارائه می‌دهند.", None, None, None),
    ],
    "adventure-sports-dezful": [
        ("lead", 1, "دزفول مقصدی عالی برای علاقه‌مندان به ماجراجویی است.", None, None, None),
        ("heading", 2, "ورزش‌های آبی", "water-sports", None, None),
        ("paragraph", 3, "رودخانه دز فرصت‌های عالی برای قایق‌سواری و کایاک فراهم می‌کند.", None, None, None),
        ("heading", 4, "کوهنوردی", "mountaineering", None, None),
        ("paragraph", 5, "کوه‌های زاگرس در اطراف دزفول، مقصدی عالی برای کوهنوردی هستند.", None, None, None),
    ],
    "old-bridge-dezful-architecture": [
        ("lead", 1, "پل قدیم دزفول یکی از مهم‌ترین آثار تاریخی ایران است.", None, None, None),
        ("heading", 2, "تاریخچه پل", "history", None, None),
        ("paragraph", 3, "این پل بیش از ۱۷۰۰ سال قدمت دارد و هنوز پابرجاست.", None, None, None),
        ("image", 4, None, None, "pl-e-ghadim.jpg", "پل قدیم دزفول"),
        ("heading", 5, "معماری و ساختار", "architecture", None, None),
        ("paragraph", 6, "پل قدیم دزفول با استفاده از سنگ و آجر ساخته شده است.", None, None, None),
    ],
    "old-bazaar-dezful-guide": [
        ("lead", 1, "بازار کهنه دزفول یکی از زنده‌ترین بازارهای سنتی ایران است.", None, None, None),
        ("heading", 2, "معماری بازار", "architecture", None, None),
        ("paragraph", 3, "بازار کهنه دزفول با معماری اصیل و طاق‌های آجری، فضایی بی‌نظیر ایجاد کرده است.", None, None, None),
        ("image", 4, None, None, "bazar-kohneh.jpg", "بازار کهنه دزفول"),
        ("heading", 5, "صنایع دستی و محصولات", "products", None, None),
        ("paragraph", 6, "در این بازار می‌توانید صنایع دستی محلی و محصولات سنتی را پیدا کنید.", None, None, None),
    ],
    "shavi-waterfall-dezful": [
        ("lead", 1, "آبشار شوی یکی از بلندترین آبشارهای فصلی ایران است.", None, None, None),
        ("heading", 2, "موقعیت جغرافیایی", "location", None, None),
        ("paragraph", 3, "آبشار شوی در فاصله حدود ۱۰۰ کیلومتری دزفول قرار دارد.", None, None, None),
        ("image", 4, None, None, "abshear-shooy.jpg", "آبشار شوی"),
        ("heading", 5, "بهترین زمان بازدید", "best-time", None, None),
        ("paragraph", 6, "بهترین زمان برای بازدید از آبشار شوی فصل بهار است.", None, None, None),
    ],
    "sarbetagh-dezful-qanats": [
        ("lead", 1, "سربطاق‌های دزفول یکی از شگفتی‌های مهندسی آب در ایران هستند.", None, None, None),
        ("heading", 2, "سربطاق چیست؟", "what-is-sarbatagh", None, None),
        ("paragraph", 3, "سربطاق‌ها سیستم‌های آبرسانی زیرزمینی هستند.", None, None, None),
        ("heading", 4, "تاریخچه", "history", None, None),
        ("paragraph", 5, "این سیستم‌ها در دوران ساسانیان ساخته شدند.", None, None, None),
    ],
    "historical-houses-dezful": [
        ("lead", 1, "خانه‌های تاریخی دزفول نمونه‌هایی از معماری اصیل ایرانی هستند.", None, None, None),
        ("heading", 2, "خانه تیزنو", "tizno-house", None, None),
        ("paragraph", 3, "خانه تیزنو یکی از زیباترین خانه‌های تاریخی دزفول است.", None, None, None),
        ("image", 4, None, None, "khaneh-tizno.jpg", "خانه تیزنو"),
        ("heading", 5, "بافت قدیم دزفول", "old-texture", None, None),
        ("paragraph", 6, "بافت قدیم دزفول با کوچه‌های آجری، فضایی بی‌نظیر ایجاد کرده است.", None, None, None),
    ],
    "sholeh-dezfuli-recipe": [
        ("lead", 1, "شله دزفولی یکی از محبوب‌ترین دسرهای سنتی ایران است.", None, None, None),
        ("heading", 2, "مواد اولیه", "ingredients", None, None),
        ("paragraph", 3, "شله دزفولی با برنج، شیر، شکر، هل و گلاب تهیه می‌شود.", None, None, None),
        ("image", 4, None, None, "sholeh.jpg", "شله دزفولی"),
        ("heading", 5, "روش تهیه", "recipe", None, None),
        ("paragraph", 6, "برنج را با شیر و شکر می‌پزند و در انتها هل و گلاب اضافه می‌کنند.", None, None, None),
    ],
    "tizno-house-dezful": [
        ("lead", 1, "قلعه تیزنو یکی از جاذبه‌های تاریخی دزفول است.", None, None, None),
        ("heading", 2, "تاریخچه قلعه", "history", None, None),
        ("paragraph", 3, "قلعه تیزنو در دوران قاجار ساخته شده است.", None, None, None),
        ("image", 4, None, None, "ghaleye-tizno.jpg", "قلعه تیزنو"),
        ("heading", 5, "تجربه بازدید", "experience", None, None),
        ("paragraph", 6, "در قلعه تیزنو می‌توانید از غذاهای سنتی دزفول نیز لذت ببرید.", None, None, None),
    ],
    "dez-river-guide": [
        ("lead", 1, "رودخانه دز شریان حیات شهر دزفول است.", None, None, None),
        ("heading", 2, "اهمیت رودخانه", "importance", None, None),
        ("paragraph", 3, "رودخانه دز از کوه‌های زاگرس سرچشمه می‌گیرد.", None, None, None),
        ("image", 4, None, None, "roodkhaneh-dez.jpg", "رودخانه دز"),
        ("heading", 5, "تفریحات آبی", "water-activities", None, None),
        ("paragraph", 6, "قایق‌سواری و ماهیگیری از تفریحات محبوب در حاشیه رودخانه دز است.", None, None, None),
    ],
    "handicrafts-dezful": [
        ("lead", 1, "صنایع دستی دزفول شامل هنرهای متنوعی است.", None, None, None),
        ("heading", 2, "حصیربافی", "hasir", None, None),
        ("paragraph", 3, "حصیربافی یکی از قدیمی‌ترین صنایع دستی دزفول است.", None, None, None),
        ("heading", 4, "خراطی", "kharati", None, None),
        ("paragraph", 5, "خراطی هنر ساخت اشیاء چوبی است.", None, None, None),
    ],
    "eco-lodges-dezful": [
        ("lead", 1, "اقامتگاه‌های بوم‌گردی دزفول تجربه‌ای متفاوت ارائه می‌دهند.", None, None, None),
        ("heading", 2, "چرا بوم‌گردی؟", "why-ecotourism", None, None),
        ("paragraph", 3, "اقامت در بوم‌گردی به شما امکان آشنایی با فرهنگ محلی را می‌دهد.", None, None, None),
        ("heading", 4, "بهترین بوم‌گردی‌ها", "best-ecotourism", None, None),
        ("paragraph", 5, "در دزفول بوم‌گردی‌های متعددی وجود دارد.", None, None, None),
    ],
    "one-day-tour-dezful": [
        ("lead", 1, "اگر فقط یک روز برای بازدید از دزفول دارید، این برنامه پیشنهادی کمک می‌کند.", None, None, None),
        ("heading", 2, "صبح: بازدید از بافت تاریخی", "morning", None, None),
        ("paragraph", 3, "صبح را با بازدید از پل قدیم و بافت تاریخی دزفول آغاز کنید.", None, None, None),
        ("heading", 4, "ظهر: ناهار در بازار", "noon", None, None),
        ("paragraph", 5, "ناهار را در بازار کهنه دزفول میل کنید.", None, None, None),
        ("heading", 6, "عصر: طبیعت‌گردی", "afternoon", None, None),
        ("paragraph", 7, "بعدازظهر را به رودخانه دز اختصاص دهید.", None, None, None),
    ],
    "best-time-visit-dezful": [
        ("lead", 1, "دزفول در جنوب غرب ایران قرار گرفته و اختلاف شرایط آب و هوایی فصل ها روی تجربه سفر تاثیر زیادی دارد.", None, None, None),
        ("heading", 2, "بهار؛ انتخاب محبوب", "spring", None, None),
        ("paragraph", 3, "بهار معمولا برای دیدن طبیعت اطراف دزفول انتخاب جذابی است.", None, None, None),
        ("image", 4, None, None, "slide1.webp", "چشم انداز سفر به دزفول در فصل مناسب"),
        ("heading", 5, "تابستان؛ سفر برای عاشقان رود و آب", "summer", None, None),
        ("paragraph", 6, "تابستان در دزفول گرم است، بنابراین برنامه را با ساعات خنک تر هماهنگ کنید.", None, None, None),
        ("heading", 7, "پاییز و زمستان؛ برای سفر آرام تر", "autumn-winter", None, None),
        ("paragraph", 8, "اگر هوای گرم برایتان آزاردهنده است، نیمه خنک سال انتخاب راحت تری است.", None, None, None),
    ],
}

# ==========================================================
# ایجاد بلوک‌ها برای هر مقاله
# ==========================================================
created_count = 0
for slug, blocks in all_blocks.items():
    try:
        article = Article.objects.get(slug=slug)
    except Article.DoesNotExist:
        print(f"❌ مقاله با slug «{slug}» پیدا نشد!")
        continue
    
    for block_type, order, text, block_id, src, caption in blocks:
        ArticleBlock.objects.create(
            article=article,
            block_type=block_type,
            block_order=order,
            text=text,
            block_id=block_id,
            src=src,
            caption=caption,
        )
    
    created_count += len(blocks)
    print(f"✅ مقاله «{article.title}»: {len(blocks)} بلوک ایجاد شد")

print(f"\n🎉 مجموع {created_count} بلوک برای مقالات ایجاد شد!")