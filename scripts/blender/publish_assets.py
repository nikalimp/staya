# Копирует результат запекания в сайт: GLB + WebP (десктоп) и -m.webp (телефон, вдвое меньше)
import sys, os, shutil
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
shutil.copy(os.path.join(src, 'pool-pack.glb'), os.path.join(dst, 'pool.glb'))
for f in sorted(os.listdir(os.path.join(src, 'tex'))):
    im = Image.open(os.path.join(src, 'tex', f)); name = f[:-5]
    im.save(os.path.join(dst, name + '.webp'), 'WEBP', quality=86, method=6)
    w, h = im.size; k = 2 if w > 1024 else 1
    im.resize((w // k, h // k), Image.LANCZOS).save(os.path.join(dst, name + '-m.webp'), 'WEBP', quality=82, method=6)
tot = sum(os.path.getsize(os.path.join(dst, f)) for f in os.listdir(dst))
print('assets', tot // 1024, 'KB', sorted(os.listdir(dst)))
