"""Compress all item images: resize to 256x256 RGBA with optimize=True"""
import os
from PIL import Image

ROOT = r"D:\Aporiyan\EldenRing_wiki\public\images"
CATEGORIES = ["armor", "talismans", "spells", "ashes-of-war", "spirit-ashes", "weapons"]

total_orig = 0
total_new = 0
count = 0

for cat in CATEGORIES:
    folder = os.path.join(ROOT, cat)
    if not os.path.isdir(folder):
        continue
    for fname in os.listdir(folder):
        if not fname.lower().endswith(".png"):
            continue
        path = os.path.join(folder, fname)
        orig_size = os.path.getsize(path)
        total_orig += orig_size

        try:
            img = Image.open(path)
            # Skip if already <= 256 on both dimensions
            if img.width <= 256 and img.height <= 256:
                img.close()
                total_new += orig_size
                count += 1
                continue

            r = img.resize((256, 256), Image.LANCZOS)
            r.save(path, optimize=True)
            new_size = os.path.getsize(path)
            total_new += new_size
            r.close()
            img.close()
            count += 1

            if count % 200 == 0:
                print(f"  ... processed {count} images")
        except Exception as e:
            print(f"  ERROR: {path}: {e}")

saved_mb = (total_orig - total_new) / (1024 * 1024)
print(f"\nDone: {count} images processed")
print(f"Before: {total_orig / (1024*1024):.0f} MB")
print(f"After:  {total_new / (1024*1024):.0f} MB")
print(f"Saved:  {saved_mb:.0f} MB ({total_new/total_orig*100:.0f}% of original)")
