# STAYA POOL — сцена двора для запекания света.
# Координаты пишем как в three.js (Y вверх), helper P() переводит в Blender (Z вверх).
import bpy, bmesh, math, random, os, sys
from mathutils import Vector, Matrix

D = os.path.dirname(os.path.abspath(__file__))
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
C = bpy.data.collections

def P(x, y, z): return Vector((x, -z, y))
def coll(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); return c
G = {k: coll(k) for k in ['ground', 'near', 'far', 'gloss', 'neon', 'lights', 'helpers']}

def link(o, g):
    for c in o.users_collection: c.objects.unlink(o)
    G[g].objects.link(o); return o

# ---------- материалы ----------
MATS = {}
def mat(name, color, rough=0.6, metal=0.0, coat=0.0, emit=None, emit_k=1.0, node=None):
    key = name
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1); p.inputs['Emission Strength'].default_value = emit_k
    if node: node(m, p)
    MATS[key] = m; return m

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)

def tiles(m, p, a, b, scale, mortar):
    nt = m.node_tree; tc = nt.nodes.new('ShaderNodeTexCoord'); br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (*a, 1); br.inputs['Color2'].default_value = (*b, 1)
    br.inputs['Mortar'].default_value = (*mortar, 1); br.inputs['Scale'].default_value = scale
    br.inputs['Mortar Size'].default_value = 0.025; br.offset = 0; br.squash = 1
    br.inputs['Brick Width'].default_value = 1; br.inputs['Row Height'].default_value = 1
    nt.links.new(tc.outputs['Object'], br.inputs['Vector']); nt.links.new(br.outputs['Color'], p.inputs['Base Color'])

def noise(m, p, a, b, scale=4):
    nt = m.node_tree; tc = nt.nodes.new('ShaderNodeTexCoord'); n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].color = (*a, 1); r.color_ramp.elements[1].color = (*b, 1)
    nt.links.new(tc.outputs['Object'], n.inputs['Vector']); nt.links.new(n.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], p.inputs['Base Color'])

def stripes(m, p, a, b, scale=6):
    nt = m.node_tree; tc = nt.nodes.new('ShaderNodeTexCoord'); w = nt.nodes.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'X'
    w.inputs['Scale'].default_value = scale; w.inputs['Distortion'].default_value = 0
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'; r.color_ramp.elements[0].color = (*a, 1); r.color_ramp.elements[1].position = 0.5; r.color_ramp.elements[1].color = (*b, 1)
    nt.links.new(tc.outputs['Object'], w.inputs['Vector']); nt.links.new(w.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], p.inputs['Base Color'])

# ---------- примитивы ----------
def done(o, m, g, smooth=False):
    if m: o.data.materials.clear(); o.data.materials.append(m)
    if smooth:
        for f in o.data.polygons: f.use_smooth = True
    return link(o, g)

def box(c, size, m, g='far', rz=0, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=P(*c)); o = bpy.context.object
    o.scale = (size[0], size[2], size[1]); o.rotation_euler = (0, 0, rz)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 3; bpy.ops.object.modifier_apply(modifier='b')
    return done(o, m, g, smooth=bool(bevel))

def cyl(a, b, r, m, g='far', seg=16, r2=None):
    a, b = P(*a), P(*b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object; o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return done(o, m, g, smooth=True)

def sph(c, r, m, g='far', s=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=P(*c)); o = bpy.context.object
    o.scale = (s[0], s[2], s[1]); bpy.ops.object.transform_apply(scale=True)
    return done(o, m, g, smooth=True)

def torus(c, R, r, m, g='gloss', rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=32, minor_segments=14, location=P(*c), rotation=rot)
    return done(bpy.context.object, m, g, smooth=True)

def tube(pts, r, m, g='far', taper=None, res=6):
    cu = bpy.data.curves.new('t', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.resolution_u = res; cu.use_fill_caps = True
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts): sp.points[i].co = (*P(*q), 1)
    sp.use_endpoint_u = True; sp.order_u = 3
    if taper:
        for i, q in enumerate(sp.points): q.radius = taper[0] + (taper[1] - taper[0]) * i / (len(pts) - 1)
    o = bpy.data.objects.new('tube', cu); sc.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object
    return done(o, m, g, smooth=True)

# ---------- палитра ----------
WHITE = mat('tile_white', (0.9, 0.9, 0.92), 0.35, node=lambda m, p: tiles(m, p, (0.92, 0.92, 0.95), (0.86, 0.87, 0.9), 4.0, (0.55, 0.56, 0.6)))
POOLT = mat('tile_pool', (0.1, 0.6, 0.75), 0.25, node=lambda m, p: tiles(m, p, srgb('#2fc4e0'), srgb('#1fa8cc'), 20.0, srgb('#d8f6ff')))
BAND = mat('tile_band', (0.05, 0.2, 0.4), 0.2, node=lambda m, p: tiles(m, p, srgb('#0d4a8a'), srgb('#1a6ab0'), 24.0, srgb('#c8e8ff')))
COPING = mat('coping', (0.95, 0.95, 0.97), 0.35, node=lambda m, p: noise(m, p, srgb('#e9e2d6'), srgb('#f7f3ec'), 6))
GRASS = mat('grass', (0.02, 0.08, 0.03), 0.9, node=lambda m, p: noise(m, p, srgb('#0d2a18'), srgb('#1f4a2a'), 0.6))
STUCCO = mat('stucco', srgb('#ece6f2'), 0.8)
ROOF = mat('roof', srgb('#2a2533'), 0.6)
WOOD = mat('wood', srgb('#7a4a32'), 0.55, node=lambda m, p: noise(m, p, srgb('#5a321f'), srgb('#9a6340'), 3))
DOOR = mat('door', srgb('#2a1408'), 0.35)
METAL = mat('metal', (0.75, 0.75, 0.78), 0.3, metal=1)
DARK = mat('dark', srgb('#121016'), 0.5)
SPEAK = mat('speaker', srgb('#1b1a20'), 0.45)
CONE = mat('cone', srgb('#2d2b33'), 0.35)
RED = mat('cup_red', srgb('#e8102a'), 0.25, coat=0.6)
CUPW = mat('cup_white', srgb('#f4f4f4'), 0.3)
STRIPE = mat('stripe', (1, 1, 1), 0.5, node=lambda m, p: stripes(m, p, srgb('#ff3fa4'), srgb('#fbf3f6'), 4.5))
TRUNK = mat('trunk', srgb('#5a3d2b'), 0.8, node=lambda m, p: noise(m, p, srgb('#3d2a1e'), srgb('#7a5638'), 9))
LEAF = mat('leaf', srgb('#2f7a3a'), 0.55)
TREE = mat('tree', srgb('#14352a'), 0.85)
FENCE = mat('fence', srgb('#4a362e'), 0.8)
BALL = mat('ball', srgb('#ffd23f'), 0.2, coat=1)
# глянцевые надувные
INF_PINK = mat('inf_pink', srgb('#ff4fb8'), 0.16, coat=1, node=lambda m, p: (p.inputs['Subsurface Weight'].__setattr__('default_value', 0.12)))
INF_CYAN = mat('inf_cyan', srgb('#2fe0f0'), 0.16, coat=1, node=lambda m, p: (p.inputs['Subsurface Weight'].__setattr__('default_value', 0.12)))
INF_OCTO = mat('inf_octo', srgb('#5a4dff'), 0.2, coat=1)
INF_CUPS = mat('inf_cups', srgb('#ff9ae0'), 0.2, coat=1)
INF_EYE = mat('inf_eye', (0.95, 0.95, 0.97), 0.15, coat=1)
INF_PUPIL = mat('inf_pupil', (0.01, 0.01, 0.015), 0.1, coat=1)
INF_YEL = mat('inf_yellow', srgb('#ffd23f'), 0.18, coat=1)
INF_WHITE = mat('inf_white', (0.95, 0.95, 0.97), 0.18, coat=1)
INF_FLAM = mat('inf_flamingo', srgb('#ff6fb4'), 0.18, coat=1)
# свечение (отдельно, на сайте рисуется без освещения)
def neon(name, hexc, k=6): return mat('neon_' + name, srgb(hexc), 0.5, emit=srgb(hexc), emit_k=k)
N_WARM = neon('warm', '#ffcf7a', 5); N_PINK = neon('pink', '#ff6fd0', 5); N_VIO = neon('violet', '#8a6bff', 5); N_BULB = neon('bulb', '#ffd28a', 14)
N_PAR = {c: neon('par_' + c, h, 18) for c, h in [('pink', '#ff3fb4'), ('cyan', '#2fe6ff'), ('green', '#39ff6a'), ('red', '#ff2a2a')]}
N_LOGO = neon('logo', '#ffffff', 8); N_POOLL = neon('pool_light', '#bff6ff', 12)


# ================= ПЛАНИРОВКА =================
# Бассейн в центре (x ±11, z ±5). Камера выныривает и смотрит на -Z:
#   главная сцена (хиты) за бассейном, z ≈ -12, на её крыше — надувной осьминог;
#   электро-сцена справа вдали, x ≈ 43, смотрит на бассейн (-X);
#   дом с дверями — позади камеры, фасад на z = 19 смотрит на -Z.
T = 0.3

# ---------- газон, патио, бассейн ----------
for c, sz in [((0, -0.15, -52.6), (200, 0.3, 94.8)), ((0, -0.15, 52.6), (200, 0.3, 94.8)), ((-55.6, -0.15, 0), (88.8, 0.3, 10.4)), ((55.6, -0.15, 0), (88.8, 0.3, 10.4))]:
    box(c, sz, GRASS, 'ground')
for w, d, x, z in [[44, 12, 0, -11], [44, 12, 0, 11], [11, 10, -16.5, 0], [11, 10, 16.5, 0], [44, 10, 0, -21.6]]:
    box((x, T / 2, z), (w, T, d), WHITE, 'near')
for w, d, x, z in [[22.6, 0.4, 0, -5.2], [22.6, 0.4, 0, 5.2], [0.4, 10.8, -11.2, 0], [0.4, 10.8, 11.2, 0]]:
    box((x, T + 0.06, z), (w, 0.12, d), COPING, 'near', bevel=0.04)
box((0, -1.8, 0), (22, 0.2, 10), POOLT, 'near')
for w, d, x, z in [[22, 0.2, 0, -5.05], [22, 0.2, 0, 5.05], [0.2, 10, -11.05, 0], [0.2, 10, 11.05, 0]]:
    box((x, -0.8, z), (w, 2, d), POOLT, 'near')
# полоса мозаики по линии воды и ступени в углу бассейна
for w, d, x, z in [[22, 0.04, 0, -4.94], [22, 0.04, 0, 4.94], [0.04, 10, -10.94, 0], [0.04, 10, 10.94, 0]]:
    box((x, -0.05, z), (w, 0.35, d), BAND, 'near')
for i in range(4):   # ступени у левого торца: каждая следующая ниже и длиннее
    box((-11 + 0.2 * (i + 1), -0.42 - i * 0.35, -3.4), (0.4 * (i + 1), 0.35, 2.2), POOLT, 'near')
RAIL = mat('rail', (0.88, 0.9, 0.94), 0.18, coat=1.0)   # поручни светлые: запечённый металл выходил чёрным
for zz in [-1.2, -2.0]:
    tube([(10.2, 1.3, zz), (10.7, 1.3, zz), (10.95, 0.9, zz), (10.95, -0.6, zz)], 0.05, RAIL, 'near')
for x in range(-9, 10, 3):
    for z in (-4.92, 4.92): sph((x, -0.55, z), 0.18, N_POOLL, 'neon', s=(1, 1, 0.3))

# ---------- ферма ----------
def truss(a, b, w=0.5, g='far'):
    a, b = Vector(a), Vector(b); d = b - a; L = d.length; n = max(2, round(L / w))
    up = Vector((1, 0, 0)) if abs(d.normalized().y) > 0.9 else Vector((0, 1, 0))
    s1 = d.cross(up).normalized() * w / 2; s2 = d.cross(s1).normalized() * w / 2
    cs = [s1 + s2, s1 - s2, -s1 - s2, -s1 + s2]
    for c in cs: cyl(tuple(a + c), tuple(b + c), 0.035, METAL, g, seg=6)
    for i in range(n):
        p0 = a + d * (i / n); p1 = a + d * ((i + 1) / n)
        for k in range(2): cyl(tuple(p0 + cs[k * 2]), tuple(p1 + cs[(k * 2 + 1) % 4]), 0.018, METAL, g, seg=4)

def logo(center, size, rz):
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=os.path.join(D, 'Logo.svg'))
    parts = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts: o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join(); lg = bpy.context.object; lg.data.extrude = 0.0006
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bpy.ops.object.convert(target='MESH'); lg = bpy.context.object
    k = size / lg.dimensions.x
    lg.scale = (k, k, k); lg.rotation_euler = (math.radians(90), 0, rz); lg.location = P(*center)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return done(lg, N_LOGO, 'neon')
bpy.ops.preferences.addon_enable(module='io_curve_svg')

def speaker(x, y, z, h, ry):
    box((x, y + h / 2, z), (1.2, h, 1.3), SPEAK, 'far', bevel=0.04, rz=ry)
    dx, dz = math.sin(ry) * 0.62, math.cos(ry) * 0.62  # лицевая сторона
    for f, r in [(0.35, 0.42), (0.78, 0.22)]:
        cyl((x + dx, y + h * f, z + dz), (x + dx * 1.08, y + h * f, z + dz * 1.08), r, CONE, 'far', seg=20)

# ---------- главная сцена: хиты, осьминог на крыше ----------
SZ = -22.0; ST = T + 1.0   # сцена с осьминогом дальше от бассейна: камера смотрит на неё почти горизонтально
box((0, T + 0.5, SZ), (16, 1.0, 5.4), DARK, 'far', bevel=0.04)
box((0, ST + 0.02, SZ + 2.72), (16, 0.04, 0.06), N_PAR['pink'], 'neon')
for x in (-8, 8):
    for z in (SZ + 2.4, SZ - 2.4): truss((x, ST, z), (x, 9.2, z))
for z in (SZ + 2.4, SZ - 2.4): truss((-8, 9.2, z), (8, 9.2, z))
for x in (-8, 8): truss((x, 9.2, SZ + 2.4), (x, 9.2, SZ - 2.4))
box((0, 9.75, SZ), (17.2, 0.5, 5.6), ROOF, 'far', bevel=0.05)
box((0, ST + 3.4, SZ - 2.55), (15.6, 6.6, 0.2), DARK, 'far')  # задник
pars = ['pink', 'green', 'red', 'cyan', 'red', 'green', 'pink']
for i, c in enumerate(pars):
    x = -6 + i * 2
    cyl((x, 8.95, SZ + 2.4), (x, 8.55, SZ + 2.75), 0.22, DARK, 'far', seg=12, r2=0.26)
    sph((x, 8.5, SZ + 2.8), 0.17, N_PAR[c], 'neon')
box((0, ST + 0.55, SZ + 1.0), (3.4, 1.1, 0.9), DARK, 'far', bevel=0.03)
logo((0, ST + 0.6, SZ + 1.47), 2.4, 0)
for sx in (-1, 1):
    speaker(sx * 6.6, ST, SZ + 0.6, 1.8, 0); speaker(sx * 6.6, ST + 1.8, SZ + 0.6, 1.3, 0)
# надувные буквы на краю крыши
FONT = bpy.data.fonts.load(os.path.join(D, 'fonts', 'unbounded-latin-900.ttf'))
def inflated(word, m, center, size, ry=0.0, pressure=16):
    bpy.ops.object.text_add(location=(0, 0, 0)); t = bpy.context.object
    t.data.font = FONT; t.data.body = word; t.data.align_x = 'CENTER'; t.data.size = 1; t.data.space_character = 0.92
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
inflated('STAYA', INF_PINK, (-3.9, 10.0, SZ + 2.2), 1.75, ry=0.05)
inflated('POOL', INF_CYAN, (4.4, 10.0, SZ + 2.2), 1.85, ry=-0.05)
# осьминог сидит на крыше, щупальца свисают по ферме
OC = (0, 15.2, SZ - 1.2)
sph(OC, 4.6, INF_OCTO, 'gloss', s=(1, 1.18, 0.95), seg=48)
for sx in (-1, 1):
    sph((sx * 1.75, OC[1] - 0.6, OC[2] + 3.9), 1.2, INF_EYE, 'gloss')
    sph((sx * 1.65 - 0.12, OC[1] - 0.65, OC[2] + 4.85), 0.62, INF_PUPIL, 'gloss')
    sph((sx * 1.65 - 0.3, OC[1] - 0.4, OC[2] + 5.35), 0.18, INF_EYE, 'gloss')
    sph((sx * 2.9, OC[1] - 2.1, OC[2] + 3.4), 0.5, INF_FLAM, 'gloss', s=(1.2, 0.6, 0.4))
TENT = [
    [(-3, 11, SZ), (-6.5, 10.6, SZ + 1.6), (-8.4, 8.6, SZ + 2.8), (-8.9, 5.5, SZ + 3.0), (-8.6, 3.2, SZ + 3.2), (-7.6, 2.6, SZ + 3.6)],
    [(3, 11, SZ), (6.5, 10.6, SZ + 1.6), (8.4, 8.6, SZ + 2.8), (8.9, 5.0, SZ + 3.0), (8.6, 2.8, SZ + 3.2), (9.6, 2.4, SZ + 3.9)],
    [(-3.5, 11, SZ - 2.4), (-8, 10.4, SZ - 3.4), (-10.5, 7, SZ - 3.6), (-11, 3, SZ - 3.2), (-10, 1.2, SZ - 2.2)],
    [(3.5, 11, SZ - 2.4), (8, 10.4, SZ - 3.4), (10.5, 7, SZ - 3.6), (11, 3, SZ - 3.2), (10, 1.2, SZ - 2.2)],
    [(-2, 11.5, SZ - 3), (-4, 14, SZ - 6.5), (-3, 18, SZ - 7.5), (-0.5, 20, SZ - 6.5)],
    [(2.5, 12, SZ - 2.8), (6, 15.5, SZ - 3.5), (7.2, 19.5, SZ - 3.2), (5.6, 21.5, SZ - 2.4), (4.4, 20.8, SZ - 2)],
]
for i, pts in enumerate(TENT):
    o = tube(pts, 1.0, INF_OCTO, 'gloss', taper=(1.05, 0.22), res=10)
    if i >= 4: o.name = 'letters_' + ('TENTL', 'TENTR')[i - 4]   # два поднятых щупальца — отдельные: на сайте они машут

# электро-сцены больше нет: за коридором экранов — танцпол с аркой и Луной (собирается на сайте)
EX, EZ = 36.0, -1.0

HZ = 19.0   # дома нет: за баром сад и забор

# ---------- реквизит у бассейна ----------
def lounger(x, z, ry):
    m = Matrix.Translation(P(x, 0, z)) @ Matrix.Rotation(ry, 4, 'Z')
    parts = [box((0, 0.42, 0.2), (0.72, 0.1, 1.5), STRIPE, 'near', bevel=0.02), box((0, 0.7, -0.8), (0.72, 0.1, 0.85), STRIPE, 'near', bevel=0.02)]
    parts[-1].rotation_euler = (math.radians(-35), 0, 0)
    for sxx in (-1, 1):
        for zz in (-0.6, 0.85): parts.append(box((sxx * 0.32, 0.2, zz), (0.04, 0.4, 0.04), METAL, 'near'))
    for o in parts: o.matrix_world = m @ o.matrix_world
for i in range(5): lounger(-9 + i * 3.4, 7.2, math.pi)
for i in range(4): lounger(-14.5, -3.6 + i * 2.4, math.pi / 2)

# ---------- пальмы, деревья, забор, гирлянды ----------
def palm(x, z, h, lean, seed):
    rnd = random.Random(seed)
    pts = [(x + lean[0] * h * 0.25 * t * t, h * t, z + lean[1] * h * 0.25 * t * t) for t in [i / 6 for i in range(7)]]
    tube(pts, 1.0, TRUNK, 'far', taper=(0.24, 0.14), res=4)
    top = Vector(pts[-1])
    for i in range(10):
        a = i / 10 * math.tau + rnd.random() * 0.3; L = 3.2 + rnd.random(); dx, dz = math.cos(a), math.sin(a)
        tube([(top.x, top.y, top.z), (top.x + dx * L * 0.45, top.y + 0.5, top.z + dz * L * 0.45), (top.x + dx * L, top.y - 1.2, top.z + dz * L)], 1.0, LEAF, 'far', taper=(0.12, 0.02), res=6)
for i in range(16):
    sx = -1 if i % 3 else 1; x = sx * (36 + random.random() * 10) if sx < 0 else 74 + random.random() * 10; z = -30 + random.random() * 60; h = 6 + random.random() * 6
    cyl((x, 0, z), (x, h * 0.4, z), 0.3, TRUNK, 'far', seg=8)
    sph((x, h * 0.75, z), 2.4 + random.random(), TREE, 'far', s=(1, 1.3, 1), seg=12)
for x in range(-40, 80, 2): box((x, 1.2, -32), (1.85, 2.4, 0.12), FENCE, 'far')
for x in range(-40, 80, 2): box((x, 1.2, 34), (1.85, 2.4, 0.12), FENCE, 'far')
for z in range(-30, 34, 2): box((-40, 1.2, z), (0.12, 2.4, 1.85), FENCE, 'far')
for x, z in [(-19, -6), (19, -7), (-16, HZ), (-6, HZ), (6, HZ), (16, HZ)]: cyl((x, 0, z), (x, 7.5, z), 0.08, METAL, 'far', seg=8)
strings = [((-16, 7.5, HZ), (-19, 6.5, -6)), ((-6, 7.5, HZ), (-8, 9.0, SZ + 2.4)), ((6, 7.5, HZ), (8, 9.0, SZ + 2.4)), ((16, 7.5, HZ), (19, 6.5, -7)),
           ((-19, 6.5, -6), (-8, 9.0, SZ + 2.4)), ((19, 6.5, -7), (8, 9.0, SZ + 2.4))]
BULBS = []
for a, c in strings:
    n = 22; pts = []
    for i in range(n + 1):
        t = i / n; sag = math.sin(t * math.pi) * 2.0
        q = (a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag, a[2] + (c[2] - a[2]) * t); pts.append(q)
        if 0 < i < n: BULBS.append(q); sph((q[0], q[1] - 0.12, q[2]), 0.09, N_BULB if i % 3 else N_PAR['pink'], 'neon', seg=10)
    tube(pts, 0.012, DARK, 'far', res=2)
import json
json.dump({'bulbs': BULBS}, open(os.path.join(D, 'pool_points.json'), 'w'))

# ---------- свет ----------
w = bpy.data.worlds.new('night'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (*srgb('#0c1030'), 1); bg.inputs[1].default_value = 2.2
def light(kind, loc, color, energy, size=1.0, target=None, spot=None):
    bpy.ops.object.light_add(type=kind, location=P(*loc)); L = bpy.context.object
    L.data.energy = energy; L.data.color = color
    if kind == 'AREA': L.data.size = size
    if kind in ('POINT', 'SPOT'): L.data.shadow_soft_size = size
    if spot: L.data.spot_size = spot; L.data.spot_blend = 0.4
    if target is not None:
        e = bpy.data.objects.new('t', None); e.location = P(*target); G['helpers'].objects.link(e)
        c = L.constraints.new('TRACK_TO'); c.target = e; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    return link(L, 'lights')
sun = light('SUN', (-25, 40, -110), srgb('#a9b8ff'), 2.4, target=(0, 0, 0)); sun.data.angle = math.radians(2)
for x in range(-8, 9, 4): light('POINT', (x, -0.9, 0), srgb('#2fe6ff'), 700, size=0.4)
cols = {'pink': '#ff3fb4', 'green': '#39ff6a', 'red': '#ff2a2a', 'cyan': '#2fe6ff'}
for i, c in enumerate(pars):
    x = -6 + i * 2
    light('SPOT', (x, 8.45, SZ + 2.85), srgb(cols[c]), 1800, size=0.2, target=(x * 1.4, 0.3, -1 + (i % 3) * 2), spot=math.radians(30))
light('AREA', (0, 6, SZ + 6), srgb('#ff4fb8'), 2200, size=8, target=(0, 4, SZ))
light('AREA', (0, 22, SZ + 10), srgb('#b04dff'), 9000, size=10, target=OC)
light('AREA', (12.6, 5, 8), srgb('#ffb36b'), 900, size=4, target=(12.6, 1, 13))   # свет над баром
for q in BULBS[::6]: light('POINT', (q[0], q[1] - 0.3, q[2]), srgb('#ffd28a'), 60, size=0.2)

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'pool.blend'))
print('built', len(bpy.data.objects), 'objects')
