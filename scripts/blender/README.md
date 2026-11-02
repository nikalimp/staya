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

## Люди (Quaternius, CC0)

1. Скачать с itch.io «Universal Base Characters [Standard]» и «Universal Animation Library [Standard]», распаковать в `quat/ubc` и `quat/ual` рядом со скриптом.
2. `python people_build.py -- preview out` — картинки поз; `-- build out` — `out/people_M.glb`, `out/people_F.glb`.
3. `gltfpack -i out/people_M.glb -o ../../world/people/people_M.glb -cc -kn -km -kv` (то же для F).

В каждой позе: тело (полная, `_mid`, `_lo`), оболочки майки и шорт, якоря костей `_@Head`, `_@spine_03`, `_@hand_l|r`.
Цвет вершин — из текстуры, область — в альфе цвета (кожа 0, бельё 1, глаза 2, волосы 3, майка 4, шорты 5); перекраска — в js/people.js.

## Модели Poly Haven (CC0)

`scripts/assets/polyhaven_fetch.py 1k <id>…` — скачать glTF; `polyhaven_pack.py <out> 512 <id>[:simplify]…` — GLB для сайта (world/assets).
Скалы и мебель виллы импортируются в Blender (`asset()` в villa_build.py) и запекаются вместе со сценой.
Вилла упакована с `-vt 16 -vp 16` (16-битные UV не ломают атлас).

## Запечённый свет для AQUA и клуба (сцены собраны в коде)

1. Локальный сервер в корне сайта, затем `node scripts/export-scene.cjs aqua <dir>` — выгружает геометрию Builder (dev/export.html) в `<dir>/aqua_src.glb` и свет в `aqua_lights.json`.
2. `python bake_scene.py -- aqua 2048 64` (рядом с файлами из шага 1) — `aqua/aqua.glb` и `aqua/aqua_light.webp` (свет ×1/8).
3. `gltfpack -i aqua/aqua.glb -o world/aqua/aqua.glb -cc -kn -km -kv -vt 16 -vp 16`, карту света — в world/aqua.
4. В сцене: `kit.applyBake(scene, built, 'aqua', { k })` — k подбирается по яркости (сейчас 32 для AQUA, 26 для клуба).
