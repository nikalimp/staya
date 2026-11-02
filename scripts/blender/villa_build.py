# STAYA PHUKET — вилла на утёсе над морем, рассвет. Сцена для запекания света (Cycles).
# Координаты как в three.js (Y вверх, море на −Z), P() переводит в Blender.
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'common.py')).read())
import json

# ---------- палитра: травертин, тёплый дуб, бронза, светлый текстиль ----------
TRAV = mat('travertine', srgb('#d8c8ad'), 0.55, node=lambda m, p: tiles(m, p, srgb('#dccdb3'), srgb('#d1c0a3'), 1.2, srgb('#cdbb9f')))
STONE = mat('stone_wall', srgb('#cbb79a'), 0.75, node=lambda m, p: noise(m, p, srgb('#bba586'), srgb('#d6c4a6'), 2.5))
PLASTER = mat('plaster', srgb('#e9e1d3'), 0.85)
OAK = mat('oak', srgb('#8a5a36'), 0.5, node=lambda m, p: stripes(m, p, srgb('#7a4c2c'), srgb('#93623c'), 18))
OAKF = mat('oak_floor', srgb('#b08a62'), 0.45, node=lambda m, p: stripes(m, p, srgb('#a77f57'), srgb('#b8936b'), 9))
BRONZE = mat('bronze', srgb('#2a2420'), 0.4, metal=0.6)
FABRIC = mat('fabric', srgb('#ece4d6'), 0.9)
FABRIC2 = mat('fabric_sand', srgb('#c9b496'), 0.9)
CHAR = mat('charcoal', srgb('#24211f'), 0.6)
MARBLE = mat('marble', srgb('#efebe4'), 0.25)
RUG = mat('rug', srgb('#d9cdb8'), 0.95)
POOLT = mat('pool_tile', srgb('#1f6f78'), 0.3, node=lambda m, p: tiles(m, p, srgb('#21767f'), srgb('#1c6870'), 6, srgb('#5aa7ad')))
DARKW = mat('dark_water_bed', srgb('#1a2a2c'), 0.4)
GRASS = mat('grass', srgb('#3b5a2a'), 0.9, node=lambda m, p: noise(m, p, srgb('#2f4a22'), srgb('#4e6a32'), 0.8))
ROCK = mat('rock', srgb('#7d6a55'), 0.9, node=lambda m, p: noise(m, p, srgb('#5d4d3e'), srgb('#9a8670'), 1.5))
HILL = mat('hill', srgb('#3c4a2c'), 0.95, node=lambda m, p: noise(m, p, srgb('#2c3a22'), srgb('#56603a'), 0.3))
OLIVE = mat('olive_leaf', srgb('#6f7a4c'), 0.8)
BUSH = mat('bush', srgb('#4b5e34'), 0.85)
PALMLEAF = mat('palm_leaf', srgb('#3f6a2e'), 0.6)
TRUNK = mat('trunk', srgb('#6b5440'), 0.85, node=lambda m, p: noise(m, p, srgb('#4f3d2e'), srgb('#8a7158'), 9))
STEEL = mat('steel', (0.7, 0.7, 0.72), 0.25, metal=1)
GOLD = mat('gold', srgb('#d9a441'), 0.25, metal=1)
CASE = mat('case', srgb('#1a1a1e'), 0.3, coat=1)
CASEIN = mat('case_in', srgb('#2a2a30'), 0.7)
CASH = mat('cash', srgb('#7fa86a'), 0.7, node=lambda m, p: stripes(m, p, srgb('#6f9a5c'), srgb('#e6ead8'), 40))
CURT = mat('curtain', srgb('#f2ede4'), 0.9)
GLASSM = mat('glass_clear', srgb('#a8b8bc'), 0.05)
INF_GOLD = mat('inf_gold', srgb('#ffc94a'), 0.15, coat=1)
INF_PINKV = mat('inf_pink', srgb('#ff6fb8'), 0.16, coat=1)
INF_WHITE = mat('inf_white', (0.95, 0.95, 0.97), 0.18, coat=1)
def neon(name, hexc, k=6): return mat('neon_' + name, srgb(hexc), 0.5, emit=srgb(hexc), emit_k=k)
N_WARM = neon('warm', '#ffc37a', 8); N_LAMP = neon('lamp', '#ffd9a0', 12); N_POOLL = neon('pool_light', '#bff6ff', 10)
N_FIRE = neon('fire', '#ff8a2a', 14); N_VIP = neon('vip', '#ff3fb4', 10); N_CYAN = neon('cyan', '#2fe6ff', 10)

def rock(c, r, s=(1, 1, 1), m=ROCK, g='far', seed=0, k=0.35, sub=4):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=P(*c)); o = bpy.context.object
    o.scale = (s[0], s[2], s[1]); bpy.ops.object.transform_apply(scale=True)
    tx = bpy.data.textures.new('n%d' % seed, 'CLOUDS'); tx.noise_scale = 0.6 * r / 3 + 0.4
    md = o.modifiers.new('d', 'DISPLACE'); md.texture = tx; md.strength = r * k; md.texture_coords = 'GLOBAL'
    bpy.ops.object.modifier_apply(modifier='d')
    return done(o, m, g, smooth=True)

def bush(x, y, z, r, m=BUSH, g='near'):
    return rock((x, y + r * 0.6, z), r, s=(1, 0.75, 1), m=m, g=g, seed=int(abs(x * 7 + z * 13)) % 97, k=0.4, sub=2)

def palm(x, z, h, lean, seed, y0=0.0):
    rnd = random.Random(seed)
    pts = [(x + lean[0] * h * 0.25 * t * t, y0 + h * t, z + lean[1] * h * 0.25 * t * t) for t in [i / 6 for i in range(7)]]
    tube(pts, 1.0, TRUNK, 'far', taper=(0.26, 0.15), res=4)
    top = Vector(pts[-1])
    for i in range(11):
        a = i / 11 * math.tau + rnd.random() * 0.3; L = 3.4 + rnd.random(); dx, dz = math.cos(a), math.sin(a)
        tube([(top.x, top.y, top.z), (top.x + dx * L * 0.45, top.y + 0.6, top.z + dz * L * 0.45), (top.x + dx * L, top.y - 1.3, top.z + dz * L)], 1.0, PALMLEAF, 'far', taper=(0.13, 0.02), res=6)

def olive(x, z, h, seed):
    rnd = random.Random(seed)
    tube([(x, 0, z), (x + 0.3, h * 0.4, z + 0.2), (x - 0.2, h * 0.7, z - 0.1)], 1.0, TRUNK, 'near', taper=(0.22, 0.1), res=4)
    for i in range(6):
        a = rnd.random() * math.tau; rr = rnd.random() * 1.6
        rock((x + math.cos(a) * rr, h * 0.75 + rnd.random() * 1.2, z + math.sin(a) * rr), 1.1 + rnd.random() * 0.5, s=(1.2, 0.7, 1.2), m=OLIVE, g='far', seed=seed * 10 + i, k=0.5, sub=2)

# готовые модели Poly Haven (CC0): импорт glTF, упрощение, масштаб, установка низом (или верхом) в точку
PH = os.path.join(D, '..', 'ph')
def asset(name, pos, ry=0.0, s=1.0, g='far', tris=None, top=False):
    import glob
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glob.glob(os.path.join(PH, name, '*.gltf'))[0])
    objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    for o in [o for o in bpy.data.objects if o not in before and o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = name
    n = len(o.data.polygons)
    if tris and n > tris:
        dm = o.modifiers.new('d', 'DECIMATE'); dm.ratio = tris / n; bpy.ops.object.modifier_apply(modifier='d')
    o.rotation_mode = 'XYZ'; o.scale = (s, s, s); o.rotation_euler = (0, 0, ry); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bb = [o.matrix_world @ Vector(v) for v in o.bound_box]
    cx = sum(v.x for v in bb) / 8; cy = sum(v.y for v in bb) / 8; zmin = min(v.z for v in bb); zmax = max(v.z for v in bb)
    t = P(*pos); o.location.x += t.x - cx; o.location.y += t.y - cy; o.location.z += t.z - (zmax if top else zmin)
    print('  asset', name, n, '->', len(o.data.polygons), flush=True)
    return link(o, g)

def sofa(c, w, d, ry=0.0, m=FABRIC):
    parts = [box((0, 0.22, 0), (w, 0.44, d), m, 'inner', bevel=0.05), box((0, 0.62, -d / 2 + 0.12), (w, 0.5, 0.24), m, 'inner', bevel=0.06)]
    for sx in (-1, 1): parts.append(box((sx * (w / 2 - 0.1), 0.5, 0), (0.2, 0.3, d), m, 'inner', bevel=0.05))
    for i in range(int(w // 0.9)): parts.append(box((-w / 2 + 0.55 + i * 0.9, 0.5, 0.05), (0.82, 0.16, d - 0.35), m, 'inner', bevel=0.06))
    M_ = Matrix.Translation(P(*c)) @ Matrix.Rotation(ry, 4, 'Z')
    for o in parts: o.matrix_world = M_ @ o.matrix_world

def lounger(c, ry, m=FABRIC):
    parts = [box((0, 0.3, 0.25), (0.75, 0.16, 1.5), m, 'inner', bevel=0.04), box((0, 0.55, -0.75), (0.75, 0.14, 0.8), m, 'inner', bevel=0.04),
             box((0, 0.11, 0), (0.7, 0.22, 2.0), OAK, 'inner')]
    parts[1].rotation_euler = (math.radians(-38), 0, 0)
    M_ = Matrix.Translation(P(*c)) @ Matrix.Rotation(ry, 4, 'Z')
    for o in parts: o.matrix_world = M_ @ o.matrix_world

# ---------- рельеф: терраса на утёсе, склоны, холмы над морем ----------
SEA = -30.0
box((0, -0.2, 10.25), (64, 0.4, 33.5), TRAV, 'ground')              # терраса z −6.5…27
for sx in (-1, 1): box((sx * 20.5, -0.2, -12.95), (23, 0.4, 12.9), TRAV, 'ground')   # по бокам бассейна до утёса
box((0, -0.2, 45), (90, 0.4, 36), GRASS, 'ground')                 # газон перед въездом
for sx in (-1, 1): box((sx * 52, -0.2, 4), (40, 0.4, 46), GRASS, 'ground')
box((0, -15, -19.2), (64, 30, 0.6), STONE, 'far')                  # подпорная стена утёса
# утёс под террасой и мысы над морем — сканы скал Poly Haven
asset('coastal_cliff_02', (-90, -12, -50), ry=0.5, s=2.4, tris=50000, top=True)
asset('coastal_cliff_02', (95, -12, -50), ry=-0.6, s=2.4, tris=50000, top=True)
asset('coast_rocks_01', (-30, SEA - 1.2, -36), ry=0.3, s=1.2, tris=25000)
asset('coast_rocks_01', (30, SEA - 1.2, -38), ry=2.4, s=1.1, tris=25000)
for (x, z, ry, s) in [(-250, -210, 0.9, 3.0), (-230, -470, 0.35, 3.5), (290, -230, -0.9, 3.0), (430, -520, -0.45, 3.5)]:
    asset('coastal_cliff_04', (x, SEA - 4, z), ry=ry, s=s, tris=60000)

# ---------- вилла: два объёма, консоли, стекло ----------
VZ0, VZ1, VX = 0.0, 14.0, 14.0     # фасад к морю z=0, вход z=14
H1 = 4.6
box((0, 0.02, 7), (2 * VX, 0.04, 14), OAKF, 'near')                # пол гостиной
# боковые каменные стены
for sx in (-1, 1): box((sx * VX, H1 / 2, 7), (0.5, H1, 14.6), STONE, 'near')
# фасад входа: камень с проёмом 3.2 м и поворотной дверью
for x0, x1 in [(-VX, -1.6), (1.6, VX)]: box(((x0 + x1) / 2, H1 / 2, VZ1), (x1 - x0, H1, 0.5), STONE, 'near')
box((0, H1 - 0.4, VZ1), (3.2, 0.8, 0.5), STONE, 'near')
for i in range(14):
    for sx in (-1, 1): box((sx * (2.2 + i * 0.32), H1 / 2, VZ1 + 0.3), (0.12, H1, 0.12), OAK, 'near')
for sx in (-1, 1): sph((sx * 2.0, 0.1, VZ1 + 0.6), 0.07, N_LAMP, 'neon'); 
box((1.55, 1.9, VZ1 + 1.4), (0.12, 3.8, 2.6), OAK, 'near', rz=0)  # открытая дверь-слэб
# потолок: тёплый дуб снизу, консоль над террасой (−4) и козырёк над входом (+18)
box((0, H1 + 0.15, 7), (2 * VX + 1.2, 0.3, 22), OAK, 'near')
box((0, H1 + 0.45, 7), (2 * VX + 1.4, 0.3, 22.2), PLASTER, 'far')
# стекло к морю: стойки + стекло (стекло не запекаем), центральный проём открыт
for x in [-VX + 0.3 + i * 3.4 for i in range(9)]:
    if -4.5 < x < 4.5: continue
    box((x, H1 / 2, VZ0), (0.08, H1, 0.12), BRONZE, 'near')
box((0, H1 - 0.05, VZ0), (2 * VX, 0.1, 0.14), BRONZE, 'near')
for x0, x1 in [(-VX, -4.2), (4.2, VX)]: box(((x0 + x1) / 2, H1 / 2, VZ0), (x1 - x0, H1, 0.03), GLASSM, 'glass')
# раздвинутые створки сложены у края проёма
for sx in (-1, 1):
    for k in range(2): box((sx * (4.5 + k * 0.12), H1 / 2, VZ0 - 0.2 - k * 0.1), (0.06, H1 - 0.1, 0.06), BRONZE, 'near')
# второй этаж: спальни со стеклянной лентой
box((-3, H1 + 0.6 + 1.8, 6), (18, 3.6, 10), STONE, 'far')
box((-3, H1 + 0.6 + 1.8, 0.95), (16.4, 3.2, 0.06), GLASSM, 'glass')
box((-3, H1 + 0.6 + 1.8, 1.0), (16.6, 3.0, 0.08), mat('bedroom_glow', srgb('#3a2a1e'), 0.6), 'far')
box((-3, H1 + 0.6 + 3.75, 5.5), (21, 0.35, 13.5), PLASTER, 'far')
box((-3, H1 + 0.6 + 3.52, 5.5), (20.8, 0.12, 13.3), OAK, 'far')
for x in (-10, -6, -2, 2): box((x, H1 + 0.62, 0.7), (1.6, 0.04, 0.06), N_WARM, 'neon')

# ---------- интерьер: гостиная, камин, кухня ----------
box((-5, 0.05, 6.5), (7, 0.02, 5), RUG, 'inner')
sofa((-5, 0, 8.6), 4.6, 1.1, 0); sofa((-8.2, 0, 6.2), 3.2, 1.0, math.radians(-90))
box((-5, 0.2, 6.3), (2.2, 0.4, 1.2), mat('travertine_block', srgb('#d2c2a6'), 0.5), 'inner', bevel=0.03)
for x, z, ry in [(-3, 4.4, 2.6), (-6.6, 4.2, 3.6)]: asset('modern_arm_chair_01', (x, 0.04, z), ry=ry, s=1.0, g='inner')
asset('mid_century_lounge_chair', (-11.6, 0.04, 2.2), ry=0.7, s=1.0, g='inner')
# камин в левой стене
box((-VX + 0.45, 1.6, 7), (0.5, 3.2, 3.2), CHAR, 'near')
box((-VX + 0.72, 0.75, 7), (0.06, 0.5, 2.2), N_FIRE, 'neon')
box((-VX + 0.3, 3.6, 7), (0.06, 1.6, 2.6), mat('art', srgb('#b98a5a'), 0.8, node=lambda m, p: noise(m, p, srgb('#6a4a32'), srgb('#e2c9a2'), 1.2)), 'inner')
# кухня справа: остров, шкафы, подвесы
box((7.5, 0.47, 7), (4.8, 0.94, 1.3), OAK, 'inner')
box((7.5, 0.97, 7), (5.0, 0.06, 1.45), MARBLE, 'inner')
box((VX - 0.6, 1.3, 7), (0.7, 2.6, 8), OAK, 'inner')
box((VX - 0.55, 1.0, 7), (0.75, 0.05, 8), MARBLE, 'inner')
for z in (5.6, 7, 8.4):
    cyl((7.5, H1, z), (7.5, 2.4, z), 0.008, BRONZE, 'inner', seg=6)
    cyl((7.5, 2.45, z), (7.5, 2.25, z), 0.32, BRONZE, 'inner', seg=24, r2=0.05)
    sph((7.5, 2.22, z), 0.08, N_LAMP, 'neon')
for x in (6.3, 7.5, 8.7): cyl((x, 0, 8.3), (x, 0.75, 8.3), 0.2, OAK, 'inner', seg=12)
# обеденный стол у стекла
box((7.5, 0.74, 2.6), (3.2, 0.06, 1.1), OAK, 'inner'); box((7.5, 0.36, 2.6), (2.4, 0.72, 0.3), BRONZE, 'inner')
# линии света в потолке
for x in (-9, -3, 3, 9): box((x, H1 - 0.02, 7), (0.08, 0.03, 12), N_WARM, 'neon')
# растения в кадках
for x, z in [(-12.5, 1.2), (12.5, 12.6), (-12.5, 12.6), (3.2, 12.8)]:
    cyl((x, 0, z), (x, 0.7, z), 0.38, STONE, 'inner', seg=20, r2=0.32); bush(x, 0.6, z, 0.65, OLIVE, 'inner')

# ---------- въезд: дорожка, водный канал, кусты с подсветкой, оливы ----------
box((0, 0.03, 30), (3.6, 0.06, 32), TRAV, 'near')
box((4.6, 0.03, 27), (1.6, 0.06, 22), DARKW, 'near')   # дно канала, вода — на сайте (y 0.16)
for sx in (-1, 1): box((4.6 + sx * 0.9, 0.12, 27), (0.2, 0.24, 22.4), STONE, 'near')
for i in range(10):
    z = 17 + i * 2.3
    bush(-2.8, 0, z, 0.7 + (i % 3) * 0.15); bush(6.6, 0, z + 0.8, 0.6 + (i % 2) * 0.2)
    if i % 2 == 0: sph((-2.3, 0.08, z + 0.4), 0.07, N_LAMP, 'neon'); sph((5.9, 0.08, z + 1.2), 0.07, N_LAMP, 'neon')
olive(-7, 22, 4.5, 1); olive(10, 32, 4, 2); olive(-9, 34, 4.2, 3)
for i in range(18):
    a = i / 18; bush(-14 + random.random() * 4 - 2, 0, 16 + a * 24, 0.9 + random.random() * 0.6)
    bush(14 + random.random() * 4, 0, 16 + a * 24, 0.9 + random.random() * 0.6)

# ---------- терраса у моря: инфинити-бассейн, джакузи, барбекю ----------
PZ0, PZ1, PX = -6.5, -17.5, 9.0
box((0, -1.55, (PZ0 + PZ1) / 2), (2 * PX, 0.1, PZ0 - PZ1), POOLT, 'near')
for z in (PZ0,): box((0, -0.8, z), (2 * PX, 1.5, 0.1), POOLT, 'near')
for sx in (-1, 1): box((sx * PX, -0.8, (PZ0 + PZ1) / 2), (0.1, 1.5, PZ0 - PZ1), POOLT, 'near')
box((0, -0.85, PZ1), (2 * PX, 1.5, 0.1), POOLT, 'near')        # кромка перелива (вода вровень)
box((0, -0.6, PZ1 - 0.7), (2 * PX + 0.4, 0.1, 1.2), POOLT, 'near')   # жёлоб ниже
for x in range(-8, 9, 4): sph((x, -0.9, PZ0 - 0.08), 0.12, N_POOLL, 'neon', s=(1, 1, 0.3))
# джакузи слева
JX, JZ = -14.5, -9.0
cyl((JX, 0, JZ), (JX, 0.5, JZ), 2.1, STONE, 'near', seg=40)
cyl((JX, 0.1, JZ), (JX, 0.52, JZ), 1.75, POOLT, 'near', seg=40)
sph((JX, 0.15, JZ), 0.18, N_CYAN, 'neon', s=(1, 0.3, 1))
# барбекю-зона: остров с грилем, стол и стулья под перголой
BX, BZ = -19.5, -2.0
box((BX, 0.46, BZ), (1.2, 0.92, 5), STONE, 'near'); box((BX, 0.95, BZ), (1.3, 0.06, 5.2), CHAR, 'near')
box((BX, 1.1, BZ - 0.8), (0.9, 0.3, 1.6), STEEL, 'near'); box((BX + 0.2, 1.45, BZ - 0.8), (0.5, 0.5, 1.6), STEEL, 'near')
box((BX, 1.6, BZ + 1.4), (0.3, 0.02, 0.4), mat('food', srgb('#a0552a'), 0.6), 'near')
asset('outdoor_table_chair_set_01', (-15.5, 0.0, -2), ry=math.pi / 2, s=1.3, g='near')
for x, z in [(-10.6, -5.4), (10.4, -5.4), (-12.6, -16.8), (12.4, -16.8), (-2.6, 13.2), (2.6, 13.2)]: asset('potted_plant_04', (x, 0.0, z), ry=x, s=3.0, g='near')
for x in (-21, -14): cyl((x, 0, -6), (x, 3.2, -6), 0.08, BRONZE, 'near', seg=8); cyl((x, 0, 2), (x, 3.2, 2), 0.08, BRONZE, 'near', seg=8)
for z in [i * 0.4 - 6 for i in range(21)]: box((-17.5, 3.25, z), (7.4, 0.1, 0.08), OAK, 'near')
# шезлонги вдоль бассейна (камера идёт по центру)
for i in range(4): lounger((-7.5 + i * 2.2, 0, -4.6), math.pi)
for i in range(2): lounger((5.2 + i * 2.2, 0, -4.6), math.pi)
# зонты
for x in (-5.4, 7.6):
    cyl((x, 0, -3.3), (x, 2.6, -3.3), 0.04, BRONZE, 'near', seg=8)
    cyl((x, 2.5, -3.3), (x, 2.9, -3.3), 1.6, FABRIC, 'near', seg=24, r2=0.05)

# ---------- VIP-беседка справа над бассейном ----------
GX, GZ = 15.0, -11.0
box((GX, 0.25, GZ), (8, 0.5, 7), OAK, 'near')
for sx in (-1, 1):
    for sz in (-1, 1): box((GX + sx * 3.7, 2.15, GZ + sz * 3.2), (0.25, 3.3, 0.25), mat('white_post', srgb('#f1ece2'), 0.5), 'near')
box((GX, 3.95, GZ), (8.4, 0.35, 7.4), mat('white_post', srgb('#f1ece2'), 0.5), 'near')
for i in range(16): box((GX - 3.6 + i * 0.48, 3.7, GZ), (0.1, 0.18, 6.6), OAK, 'near')
# шторы, подхваченные у стоек
for sx in (-1, 1):
    for sz in (-1, 1):
        cyl((GX + sx * 3.55, 0.5, GZ + sz * 2.95), (GX + sx * 3.55, 3.75, GZ + sz * 2.95), 0.32, CURT, 'near', seg=14, r2=0.22)
box((GX + 3.9, 2.1, GZ), (0.04, 3.2, 6), CURT, 'near')
# неоновая надпись VIP над краем к бассейну
for i, ch in enumerate('VIP'):
    bpy.ops.object.text_add(location=(0, 0, 0)); t = bpy.context.object
    t.data.body = 'VIP'; t.data.align_x = 'CENTER'; t.data.size = 0.8; t.data.extrude = 0.03
    break
t.rotation_euler = (math.radians(90), 0, math.radians(-90)); t.location = P(GX - 4.25, 4.0, GZ)
bpy.ops.object.convert(target='MESH'); done(bpy.context.object, N_VIP, 'neon')
# диджейская стойка лицом к бассейну (−X)
box((GX - 2.4, 1.05, GZ), (0.9, 1.1, 2.8), mat('booth', srgb('#f4efe6'), 0.35), 'near', bevel=0.03)
box((GX - 2.4, 1.63, GZ), (0.7, 0.06, 2.4), CHAR, 'near')
box((GX - 2.86, 1.05, GZ), (0.02, 0.06, 2.6), N_VIP, 'neon')
for sz in (-0.7, 0.7): cyl((GX - 2.4, 1.66, GZ + sz), (GX - 2.4, 1.7, GZ + sz), 0.22, STEEL, 'near', seg=24)
for sz in (-1, 1): box((GX - 2.6, 0.5 + 0.9, GZ + sz * 2.6), (0.6, 1.8, 0.6), CHAR, 'near', bevel=0.03)
# шезлонг для отдыхающего
lounger((GX + 1.8, 0.5, GZ - 2.0), math.radians(-90), FABRIC2)
# стол, кейсы и пачки денег
box((GX + 1.4, 0.5 + 0.72, GZ + 1.8), (1.8, 0.06, 1.0), MARBLE, 'near'); box((GX + 1.4, 0.5 + 0.36, GZ + 1.8), (0.3, 0.72, 0.6), BRONZE, 'near')
for k, dz in enumerate((-0.45, 0.45)):
    cx, cy, cz = GX + 1.4, 0.5 + 0.75, GZ + 1.8 + dz
    box((cx, cy + 0.06, cz), (0.5, 0.12, 0.38), CASE, 'gloss'); box((cx, cy + 0.08, cz), (0.44, 0.1, 0.32), CASEIN, 'near')
    lid = box((cx + 0.27, cy + 0.3, cz), (0.06, 0.5, 0.38), CASE, 'gloss')
    for i in range(3):
        for j in range(2): box((cx - 0.12 + i * 0.12, cy + 0.14, cz - 0.07 + j * 0.14), (0.1, 0.05, 0.12), CASH, 'near')
for i in range(4): box((GX + 0.7, 0.5 + 0.78 + i * 0.03, GZ + 1.8 + (i % 2) * 0.05), (0.15, 0.03, 0.08), CASH, 'near')
# гирлянда по периметру крыши
for i in range(26):
    a = i / 26
    for zz in (GZ - 3.4, GZ + 3.4): sph((GX - 4 + a * 8, 3.72, zz), 0.05, N_LAMP, 'neon', seg=8)

# надувное STAYA в бассейне и круги
def inflated(word, m, center, size, ry=0.0, pressure=16):
    bpy.ops.object.text_add(location=(0, 0, 0)); t = bpy.context.object
    t.data.font = bpy.data.fonts.load(os.path.join(D, 'fonts', 'unbounded-latin-900.ttf')); t.data.body = word; t.data.align_x = 'CENTER'; t.data.size = 1; t.data.space_character = 0.92
    t.data.extrude = 0.1; t.data.bevel_depth = 0.04; t.data.bevel_resolution = 3; t.data.resolution_u = 8
    t.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    rm = o.modifiers.new('r', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.03; bpy.ops.object.modifier_apply(modifier='r')
    cl = o.modifiers.new('cloth', 'CLOTH'); s = cl.settings
    s.quality = 6; s.mass = 0.3; s.use_pressure = True; s.uniform_pressure_force = pressure
    s.tension_stiffness = 6; s.compression_stiffness = 6; s.shear_stiffness = 4; s.bending_stiffness = 0.3; s.effector_weights.gravity = 0
    cl.point_cache.frame_start = 1; cl.point_cache.frame_end = 30
    for f in range(1, 31): sc.frame_set(f)
    bpy.ops.object.modifier_apply(modifier='cloth'); sc.frame_set(1)
    dc = o.modifiers.new('d', 'DECIMATE'); dc.ratio = 0.4; bpy.ops.object.modifier_apply(modifier='d')
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bb = o.dimensions
    o.scale = (size, size, size); o.rotation_euler = (0, 0, ry)
    o.location = P(center[0], center[1] + bb.z * size / 2 - 0.05, center[2])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.name = 'letters_' + word
    return done(o, m, 'gloss', smooth=True)
inflated('STAYA', INF_GOLD, (-4.5, -0.25, -13.5), 1.2, ry=math.radians(8))
for (x, z), mm in zip([(3.5, -9.5), (6.5, -14), (-7.5, -9.2)], [INF_PINKV, INF_WHITE, INF_PINKV]):
    torus((x, 0.0, z), 0.6, 0.22, mm, rot=(math.radians(90), 0, 0))

# ---------- пальмы ----------
for i, (x, z) in enumerate([(-24, -12), (-23, 6), (-25, -18), (22, -3), (23, -17), (20, 20), (-19, 22), (26, 8), (-30, -4)]):
    palm(x, z, 8 + (i % 3) * 1.8, (0.7 if i % 2 else -0.7, -0.4), i)

# ---------- свет: рассвет над морем ----------
SUN_DIR = Vector((0.3, 0.07, -1.0)).normalized()   # в координатах three: откуда светит солнце
w = bpy.data.worlds.new('dawn'); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes['Background']
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
ramp.color_ramp.elements[0].position = 0.45; ramp.color_ramp.elements[0].color = (*srgb('#ffb27a'), 1)
ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (*srgb('#7a8fc0'), 1)
nt.links.new(ramp.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.75
def light(kind, loc, color, energy, size=1.0, target=None, spot=None):
    bpy.ops.object.light_add(type=kind, location=P(*loc)); L = bpy.context.object
    L.data.energy = energy; L.data.color = color
    if kind == 'AREA': L.data.size = size
    if kind in ('POINT', 'SPOT'): L.data.shadow_soft_size = size
    if spot: L.data.spot_size = spot; L.data.spot_blend = 0.5
    if target is not None:
        e = bpy.data.objects.new('t', None); e.location = P(*target); G['helpers'].objects.link(e)
        c = L.constraints.new('TRACK_TO'); c.target = e; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    return link(L, 'lights')
sun = light('SUN', (SUN_DIR.x * 100, SUN_DIR.y * 100, SUN_DIR.z * 100), srgb('#ffa35a'), 7, target=(0, 0, 0)); sun.data.angle = math.radians(1.5)
# тёплый интерьер и сад
for x in (-9, -3, 3, 9): light('AREA', (x, H1 - 0.1, 7), srgb('#ffc890'), 260, size=1.2, target=(x, 0, 7))
light('POINT', (-VX + 1.2, 0.9, 7), srgb('#ff8a3a'), 300, size=0.5)
for z in (5.6, 7, 8.4): light('POINT', (7.5, 2.1, z), srgb('#ffd6a0'), 60, size=0.1)
for i in range(5): light('POINT', (-2.3, 0.3, 17.4 + i * 4.6), srgb('#ffc37a'), 90, size=0.2); light('POINT', (5.9, 0.3, 18.2 + i * 4.6), srgb('#ffc37a'), 90, size=0.2)
light('AREA', (0, 6, 22), srgb('#ffc890'), 1600, size=10, target=(0, 2, VZ1))
for x in range(-8, 9, 4): light('POINT', (x, -1.0, PZ0 - 0.3), srgb('#9fe8ff'), 220, size=0.3)
light('POINT', (JX, 0.2, JZ), srgb('#2fe6ff'), 160, size=0.3)
light('AREA', (GX, 3.4, GZ), srgb('#ffd6a0'), 500, size=5, target=(GX, 0, GZ))
light('POINT', (GX - 3.4, 1.2, GZ), srgb('#ff3fb4'), 35, size=0.3)

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'villa.blend'))
json.dump({'sun': list((SUN_DIR.x, SUN_DIR.y, SUN_DIR.z))}, open(os.path.join(D, 'villa_points.json'), 'w'))
print('built', len(bpy.data.objects), 'objects', {k: len(v.objects) for k, v in G.items()})
