import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dezful_tourism.settings')
django.setup()

from places.models import Place
from django.conf import settings

# پوشه‌ی گالری
gallery_dir = os.path.join(settings.BASE_DIR, 'static', 'img', 'Gallery-img')
print("📁 Gallery dir:", gallery_dir)
print("📁 Exists:", os.path.exists(gallery_dir))
print()

if os.path.exists(gallery_dir):
    files = set(os.listdir(gallery_dir))
    print(f"📸 Files in gallery dir: {len(files)}")
    print()

# چک کن فایل‌های هر جاذبه وجود دارن
missing = []
total = 0

for place in Place.objects.all():
    if not place.gallery:
        continue
    
    for img in place.gallery:
        total += 1
        full_path = os.path.join(gallery_dir, img)
        if not os.path.exists(full_path):
            missing.append((place.name, img))

print(f"✅ Total images in DB: {total}")
print(f"❌ Missing images: {len(missing)}")
print()

if missing:
    print("Missing files (first 20):")
    for name, img in missing[:20]:
        print(f"  ❌ {name}: {img}")