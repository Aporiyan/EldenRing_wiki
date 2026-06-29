"""Convert all 256x256 PNGs to WebP q90 and update manifests"""
import os, json
from PIL import Image

ROOT = r"D:\Aporiyan\EldenRing_wiki\public"
IMG_DIRS = ["armor", "talismans", "spells", "ashes-of-war", "spirit-ashes", "weapons"]
MANIFESTS = [
    "armor-images.json", "talismans-images.json", "spells-images.json",
    "ashes-of-war-images.json", "spirit-ashes-images.json", "weapon-images.json",
]

# Step 1: Convert PNGs to WebP
total = 0
errors = 0
converted = 0

for cat in IMG_DIRS:
    folder = os.path.join(ROOT, "images", cat)
    if not os.path.isdir(folder):
        continue
    for fname in os.listdir(folder):
        if not fname.lower().endswith(".png"):
            continue
        png_path = os.path.join(folder, fname)
        webp_name = fname[:-4] + ".webp"
        webp_path = os.path.join(folder, webp_name)
        total += 1
        try:
            if os.path.exists(webp_path):
                # Skip if webp already exists (idempotent)
                converted += 1
                continue
            img = Image.open(png_path)
            img.save(webp_path, "WEBP", quality=90)
            img.close()
            converted += 1
            if converted % 300 == 0:
                print(f"  ... {converted} webp files created")
        except Exception as e:
            errors += 1
            print(f"  ERROR {cat}/{fname}: {e}")

print(f"\nStep 1 done: {converted}/{total} files converted, {errors} errors")

# Step 2: Update manifests (change .png to .webp)
manifest_dir = os.path.join(ROOT, "data")
updated = 0
for mf_name in MANIFESTS:
    mf_path = os.path.join(manifest_dir, mf_name)
    if not os.path.exists(mf_path):
        continue
    with open(mf_path, encoding="utf-8") as f:
        data = json.load(f)
    changed = False
    for key, value in data.items():
        if isinstance(value, str) and value.endswith(".png"):
            data[key] = value[:-4] + ".webp"
            changed = True
    if changed:
        with open(mf_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        updated += 1
        print(f"  Updated {mf_name}")

print(f"Step 2 done: {updated} manifests updated")

# Step 3: Delete original PNGs
deleted = 0
for cat in IMG_DIRS:
    folder = os.path.join(ROOT, "images", cat)
    if not os.path.isdir(folder):
        continue
    for fname in os.listdir(folder):
        if fname.lower().endswith(".png"):
            os.remove(os.path.join(folder, fname))
            deleted += 1

print(f"Step 3 done: {deleted} PNGs deleted")
print("\nAll done!")
