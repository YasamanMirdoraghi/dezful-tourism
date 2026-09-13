# ═══════════════════════════════════════════════════════════
# setup_plans.py - پر کردن پلن‌های پیشنهادی
# ═══════════════════════════════════════════════════════════
from core.models import Plan, Place, PlanAttraction


def get_place(slug):
    try:
        return Place.objects.get(slug=slug)
    except Place.DoesNotExist:
        print(f"   ⚠️ جاذبه پیدا نشد: {slug}")
        return None


def add_places(plan_slug, places_list):
    try:
        plan = Plan.objects.get(slug=plan_slug)
    except Plan.DoesNotExist:
        print(f"❌ پلن پیدا نشد: {plan_slug}")
        return
    
    count = 0
    for slug, day, order in places_list:
        place = get_place(slug)
        if not place:
            continue
        if PlanAttraction.objects.filter(plan=plan, place=place).exists():
            continue
        PlanAttraction.objects.create(
            plan=plan, place=place,
            day_number=day, visit_order=order
        )
        count += 1
    
    print(f"✅ {plan.name}: {count} جاذبه اضافه شد")


# ═══════════════════════════════════════════════════════════
# 1️⃣ پلن تاریخی (historical-plan) - 1 روزه
# ═══════════════════════════════════════════════════════════
add_places('historical-plan', [
    ('water-mills-dezful', 1, 1),                # آسیاب‌های آبی
    ('old-bridge-dezful', 1, 2),                 # پل قدیم
    ('jameh-mosque-dezful', 1, 3),               # مسجد جامع
    ('karnasion-historical-bath-dezful', 1, 4),  # حمام کرناسیون
    ('old-bazaar-dezful', 1, 5),                 # بازار قدیم
])


# ═══════════════════════════════════════════════════════════
# 2️⃣ پلن خانوادگی (family-plan) - 1 روزه
# ═══════════════════════════════════════════════════════════
add_places('family-plan', [
    ('family-park-dezful', 1, 1),                # پارک خانواده
    ('dez-zoo-dezful', 1, 2),                    # باغ وحش دز
    ('madar-mall-dezful', 1, 3),                 # مجتمع مادر (ناهار)
    ('shahrdokht-park-dezful', 1, 4),            # بوستان شهردخت
    ('ali-kaleh-park-dezful', 1, 5),             # بوستان علی‌کله
    ('qolqolchi-traditional-house-dezful', 1, 6),# رستوران قلقلچی (شام)
])


# ═══════════════════════════════════════════════════════════
# 3️⃣ پلن مذهبی (religious-plan) - 1 روزه
# ═══════════════════════════════════════════════════════════
add_places('religious-plan', [
    ('yaghub-leyth-saffari-tomb', 1, 1),         # آرامگاه یعقوب لیث
    ('jameh-mosque-dezful', 1, 2),               # مسجد جامع
    ('rudband-shrine-dezful', 1, 3),             # آرامگاه رودبند
    ('sabz-qaba-shrine-dezful', 1, 4),           # بقعه سبزقبا
    ('boghe-seyed-mahmoud', 1, 5),               # بقعه سید محمود
    ('pir-nazar-hosseiniyeh-dezful', 1, 6),      # حسینیه پیرنظر
])


# ═══════════════════════════════════════════════════════════
# 4️⃣ پلن بازارگردی (bazaar-plan) - 1 روزه
# ═══════════════════════════════════════════════════════════
add_places('bazaar-plan', [
    ('old-bazaar-dezful', 1, 1),                 # بازار قدیم
    ('shariati-bazaar-row', 1, 2),               # بازار شریعتی
    ('kharatan-bazaar-dezful', 1, 3),            # بازار خراطان
    ('afzal-traditional-ardeh-workshop', 1, 4),  # ارده‌سازی افضل
    ('madar-mall-dezful', 1, 5),                 # مجتمع مادر
])


# ═══════════════════════════════════════════════════════════
# 5️⃣ پلن پیاده‌روی (walking-plan) - 1 روزه
# ═══════════════════════════════════════════════════════════
add_places('walking-plan', [
    ('moazi-gozar-dezful', 1, 1),                # گذر معزی
    ('gozar-baba-hazagil', 1, 2),                # گذر بابا حزقیل
    ('old-bazaar-dezful', 1, 3),                 # بازار قدیم
    ('qotb-razi-historical-house', 1, 4),        # خانه قطب راضی
    ('tizno-historical-house-dezful', 1, 5),     # خانه تیزنو
    ('suzangar-historical-house-dezful', 1, 6),  # خانه سوزنگر
])


# ═══════════════════════════════════════════════════════════
# 6️⃣ پلن کامل سه‌روزه (three-day-plan) - 3 روزه
# ═══════════════════════════════════════════════════════════
add_places('three-day-plan', [
    # روز ۱: بافت تاریخی
    ('old-bridge-dezful', 1, 1),
    ('water-mills-dezful', 1, 2),
    ('jameh-mosque-dezful', 1, 3),
    ('old-bazaar-dezful', 1, 4),
    ('karnasion-historical-bath-dezful', 1, 5),
    
    # روز ۲: طبیعت و رودخانه
    ('dez-dam-dezful', 2, 1),
    ('shahyoun-region-dezful', 2, 2),
    ('shavi-waterfall', 2, 3),
    
    # روز ۳: بازار و صنایع دستی
    ('kharatan-bazaar-dezful', 3, 1),
    ('afzal-traditional-ardeh-workshop', 3, 2),
    ('madar-mall-dezful', 3, 3),
    ('qolqolchi-traditional-house-dezful', 3, 4),
])


# ═══════════════════════════════════════════════════════════
# 7️⃣ پلن سربطاق‌ها (sarbetagh-plan) - 1 روزه
# ═══════════════════════════════════════════════════════════
add_places('sarbetagh-plan', [
    ('sarbetagh-aghamir', 1, 1),                 # سربطاق آقامیر
    ('sarbetagh-choghabafun', 1, 2),             # سربطاق چوقابفون
    ('boghe-seyed-mahmoud', 1, 3),               # بقعه سید محمود
])


# ═══════════════════════════════════════════════════════════
# 8️⃣ پلن طبیعت گردی (ln-tbaat-rd) - 2 روزه
# ═══════════════════════════════════════════════════════════
add_places('ln-tbaat-rd', [
    # روز ۱: شمال دزفول
    ('dez-dam-dezful', 1, 1),                    # سد دز
    ('shahyoun-region-dezful', 1, 2),            # شهیون
    ('shavi-waterfall', 1, 3),                   # آبشار شاوی
    
    # روز ۲: دره‌ها
    ('towbiroun-valley-dezful', 2, 1),           # دره توبیرون
    ('chal-kandi-valley-dezful', 2, 2),          # چال کندی
    ('sardasht-region-dezful', 2, 3),            # سردشت
    ('pamenar-region-dezful', 2, 4),             # پامنار
])


# ═══════════════════════════════════════════════════════════
# 📊 خلاصه
# ═══════════════════════════════════════════════════════════
print("\n" + "="*50)
print("📊 خلاصه نهایی:")
for plan in Plan.objects.filter(is_active=True):
    count = PlanAttraction.objects.filter(plan=plan).count()
    print(f"  • {plan.name}: {count} جاذبه")
print("="*50)
print("✅ تمام!")