# Сцены из Blender

Сцена собирается скриптом, свет запекается Cycles в текстуры, сайт показывает их без расчёта света.

```
pool_build.py   → pool.blend   (геометрия, материалы, свет; координаты как в three.js)
pool_bake.py    → out/pool.glb + out/tex/*.webp (UV-атласы, альбедо + свет, глянец)
gltfpack        → out/pool-pack.glb (сжатие meshopt; без квантизации -noq — иначе ломаются UV атласов)
publish_assets.py out ../../world/pool   (WebP для десктопа и -m.webp для телефона)
```

Запуск без интерфейса Blender (Python 3.13):

```bash
python3 -m venv bvenv && bvenv/bin/pip install bpy pillow numpy
bvenv/bin/python pool_build.py
bvenv/bin/python pool_bake.py            # полное запекание, ~15–30 мин на 2 ядрах
bvenv/bin/python pool_bake.py -- fast    # черновик за 15 с
npx gltfpack@1.3.0 -i out/pool.glb -o out/pool-pack.glb -cc -kn -km -kv -noq
bvenv/bin/python publish_assets.py out ../../world/pool
```

Группы запекания: `ground`, `near` (патио, бассейн, реквизит), `far` (дом, деревья, сцена), `gloss` (надувные буквы, осьминог, круги), `neon` (окна, лампы, прожекторы — без запекания).
Материалы в GLB называются по группе; `js/scenes/pool.js` подменяет их на свои: `MeshBasicMaterial` + lightMap, глянец — emissiveMap + clearcoat.

Шрифт Unbounded — SIL Open Font License.

## Вилла PHUKET (рассвет)

1. `python villa_build.py` — сцена `villa.blend` (общие функции — `common.py`).
2. `python villa_preview.py -- arrive living out vip sunrise wide` — пробные кадры.
3. `python villa_bake.py` — запекание в `vout/` (группы ground, near, inner, far, gloss; стекло не запекается, на сайте — прозрачный материал `glass_clear`).
4. `gltfpack -i vout/villa.glb -o vout/villa-pack.glb -cc -kn -km -kv -noq`
5. `python publish_assets.py vout ../../world/villa villa` (для бассейна: `publish_assets.py out ../../world/pool pool`).

## Люди

Персонажи собираются в браузере: `js/people.js` — 5 резидентов и 20 гостей, общие для всех сцен.
Витрина для проверки: `cast.html?set=res` (резиденты), `?set=f`, `?set=m` (гости), `&lo` — упрощённая версия для толпы.
