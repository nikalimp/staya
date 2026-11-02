# Готовит ассет Poly Haven для сайта: текстуры до N px → gltfpack (геометрия с упрощением) → GLB в world/assets
import os, sys, shutil, subprocess, tempfile, glob
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); GP = os.path.join(D, '..', 'gp', 'node_modules', '.bin', 'gltfpack')
out = sys.argv[1]; size = int(sys.argv[2])
for spec in sys.argv[3:]:
    i, _, si = spec.partition(':')
    t = tempfile.mkdtemp(); shutil.copytree(os.path.join(D, i), os.path.join(t, i))
    for p in glob.glob(os.path.join(t, i, 'textures', '*')):
        im = Image.open(p); w, h = im.size
        if max(w, h) > size: im.resize((w * size // max(w, h), h * size // max(w, h)), Image.LANCZOS).save(p, quality=85)
    src = glob.glob(os.path.join(t, i, '*.gltf'))[0]
    cmd = [GP, '-i', src, '-o', os.path.join(out, i + '.glb'), '-cc', '-kn', '-noq'] + (['-si', si] if si else [])
    r = subprocess.run(cmd, capture_output=True, text=True); shutil.rmtree(t)
    print(i, os.path.getsize(os.path.join(out, i + '.glb')) // 1024, 'KB', r.stderr.strip()[-120:] if r.returncode else '')
