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
POOLT = mat('tile_pool', (0.1, 0.6, 0.75), 0.3, node=lambda m, p: tiles(m, p, srgb('#3fd2e8'), srgb('#2fbfda'), 8.0, srgb('#bfefff')))
COPING = mat('coping', (0.95, 0.95, 0.97), 0.3)
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

# ---------- двор: газон, патио, бассейн ----------
# газон с вырезом под бассейн
for c, sz in [((0, -0.15, -52.6), (200, 0.3, 94.8)), ((0, -0.15, 52.6), (200, 0.3, 94.8)), ((-55.6, -0.15, 0), (88.8, 0.3, 10.4)), ((55.6, -0.15, 0), (88.8, 0.3, 10.4))]:
    box(c, sz, GRASS, 'ground')
T = 0.3
for w, d, x, z in [[40, 8, 0, -9], [40, 9, 0, 9.5], [9, 10, -15.5, 0], [9, 10, 15.5, 0]]:
    box((x, T / 2, z), (w, T, d), WHITE, 'near')
for w, d, x, z in [[22.6, 0.4, 0, -5.2], [22.6, 0.4, 0, 5.2], [0.4, 10.8, -11.2, 0], [0.4, 10.8, 11.2, 0]]:
    box((x, T + 0.06, z), (w, 0.12, d), COPING, 'near', bevel=0.04)
box((0, -1.8, 0), (22, 0.2, 10), POOLT, 'near')
for w, d, x, z in [[22, 0.2, 0, -5.05], [22, 0.2, 0, 5.05], [0.2, 10, -11.05, 0], [0.2, 10, 11.05, 0]]:
    box((x, -0.8, z), (w, 2, d), POOLT, 'near')
# лестница в бассейн
for zz in [3.2, 4.0]:
    tube([(10.2, 1.3, zz), (10.7, 1.3, zz), (10.95, 0.9, zz), (10.95, -0.6, zz)], 0.045, METAL, 'near')
# подводные фонари
for x in range(-9, 10, 3):
    for z in (-4.92, 4.92):
        sph((x, -0.55, z), 0.18, N_POOLL, 'neon', s=(1, 1, 0.3))

# ---------- дом ----------
box((0, 4, -24), (32, 8, 10), STUCCO, 'far')
box((-3, 10, -24.5), (22, 4, 9), STUCCO, 'far')
box((0, 8.1, -24), (33, 0.4, 11), ROOF, 'far'); box((-3, 12.1, -24.5), (23, 0.4, 10), ROOF, 'far')
box((0, 0.25, -17), (26, 0.5, 4), WOOD, 'far')
for i, x in enumerate([-11, -5.2, 5.2, 11]):
    box((x, 2.1, -18.97), (4.4, 3.2, 0.06), N_WARM if i % 2 else N_PINK, 'neon')
    box((x, 2.1, -18.92), (0.15, 3.2, 0.12), ROOF, 'far')
for i in range(5): box((-12 + i * 6, 6, -18.97), (3.4, 2, 0.06), N_VIO if i == 2 else N_WARM, 'neon')
for i in range(3): box((-10 + i * 7, 10, -19.97), (4.5, 2.2, 0.06), N_WARM, 'neon')
for sx in (-1, 1):
    box((sx * 0.8, 2.4, -18.9), (1.55, 3.8, 0.16), DOOR, 'far', bevel=0.03)
    box((sx * 0.15, 2.4, -18.78), (0.05, 0.6, 0.08), METAL, 'far')
box((0, 4.42, -18.9), (3.6, 0.25, 0.3), ROOF, 'far')
for sx in (-1, 1): sph((sx * 2.2, 3.6, -18.7), 0.16, N_BULB, 'neon')

# ---------- надувной осьминог ----------
OC = (5, 21, -42)
sph(OC, 10, INF_OCTO, 'gloss', s=(1, 1.2, 0.95), seg=48)
for sx in (-1, 1):
    sph((OC[0] + sx * 3.8, OC[1] - 1.5, OC[2] + 8.6), 2.6, INF_EYE, 'gloss')
    sph((OC[0] + sx * 3.6 - 0.3, OC[1] - 1.6, OC[2] + 10.7), 1.35, INF_PUPIL, 'gloss')
    sph((OC[0] + sx * 3.6 - 0.7, OC[1] - 1.1, OC[2] + 11.75), 0.4, INF_EYE, 'gloss')
    sph((OC[0] + sx * 6.4, OC[1] - 4.6, OC[2] + 7.4), 1.1, INF_FLAM, 'gloss', s=(1.2, 0.6, 0.4))
TENT = [
    [(-1, 12, -36), (-7, 13, -30), (-12, 12.5, -26), (-16, 9, -22), (-18, 4, -19), (-19, 1.4, -15), (-17.5, 1.3, -12), (-15.5, 2.6, -10.5)],
    [(0, 11, -34), (-3, 13.6, -28), (-5, 12.8, -22), (-6.5, 10, -18.6), (-7, 7.2, -18.2), (-7.4, 5.8, -17.6), (-6.6, 5.6, -16.6)],
    [(10, 11, -34), (14, 12.5, -28), (18, 9, -24), (21, 4, -20), (22, 1.4, -14), (20.5, 1.3, -9), (18.6, 2.6, -7.4)],
    [(13, 13, -38), (20, 16, -36), (27, 13, -32), (31, 6, -28), (32, 1.5, -22), (30, 1.6, -18)],
    [(-1, 13, -39), (-8, 17, -38), (-16, 15, -35), (-22, 8, -31), (-25, 2, -27), (-28, 1.6, -23)],
    [(12, 15, -38), (17, 21, -36), (19, 28, -35), (17, 32, -34), (14, 31, -33)],
    [(4, 13, -44), (1, 19, -48), (2, 25, -48), (5, 28, -46)],
    [(9, 12, -46), (15, 8, -52), (19, 3, -55), (22, 1.6, -54)],
]
for pts in TENT:
    tube(pts, 1.0, INF_OCTO, 'gloss', taper=(1.9, 0.35), res=10)

# ---------- сцена сбоку: ферма, пульт с логотипом, колонки ----------
SX = 16
def truss(a, b, w=0.5):
    a, b = Vector(a), Vector(b); d = b - a; L = d.length; n = max(2, round(L / w))
    up = Vector((1, 0, 0)) if abs(d.normalized().y) > 0.9 else Vector((0, 1, 0))
    s1 = d.cross(up).normalized() * w / 2; s2 = d.cross(s1).normalized() * w / 2
    cs = [s1 + s2, s1 - s2, -s1 - s2, -s1 + s2]
    for c in cs: cyl(tuple(a + c), tuple(b + c), 0.035, METAL, 'far', seg=8)
    for i in range(n):
        p0 = a + d * (i / n); p1 = a + d * ((i + 1) / n)
        for k in range(4): cyl(tuple(p0 + cs[k]), tuple(p1 + cs[(k + 1) % 4]), 0.018, METAL, 'far', seg=6)
for z in (-5, 5): truss((SX, T, z), (SX, 7.5, z))
truss((SX, 7.5, -5), (SX, 7.5, 5))
pars = ['pink', 'green', 'red', 'cyan', 'red']
for i, c in enumerate(pars):
    z = -4 + i * 2
    cyl((SX, 7.25, z), (SX - 0.35, 6.85, z), 0.22, DARK, 'far', seg=14, r2=0.26)
    sph((SX - 0.38, 6.82, z), 0.17, N_PAR[c], 'neon', s=(1, 1, 1))
# пульт
box((SX - 0.6, T + 0.55, 0), (0.9, 1.1, 3.2), DARK, 'far', bevel=0.03)
box((SX - 0.6, T + 1.15, 0), (0.6, 0.08, 2.9), SPEAK, 'far')
# колонки
for sz in (-1, 1):
    for k, hgt in enumerate([1.8, 1.3]):
        y0 = T + (0 if k == 0 else 1.8)
        box((SX - 0.2, y0 + hgt / 2, sz * 3.6), (1.2, hgt, 1.3), SPEAK, 'far', bevel=0.04)
        cyl((SX - 0.81, y0 + hgt * 0.35, sz * 3.6), (SX - 0.86, y0 + hgt * 0.35, sz * 3.6), 0.42, CONE, 'far', seg=24)
        cyl((SX - 0.81, y0 + hgt * 0.78, sz * 3.6), (SX - 0.86, y0 + hgt * 0.78, sz * 3.6), 0.22, CONE, 'far', seg=20)
# логотип СТАЯ на пульте (SVG)
before = set(bpy.data.objects)
bpy.ops.preferences.addon_enable(module='io_curve_svg')
bpy.ops.import_curve.svg(filepath=os.path.join(D, 'Logo.svg'))
logo = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
for o in logo: o.select_set(True)
bpy.context.view_layer.objects.active = logo[0]
bpy.ops.object.join(); lg = bpy.context.object
lg.data.extrude = 0.0006
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
bpy.ops.object.convert(target='MESH'); lg = bpy.context.object
w = lg.dimensions.x; k = 2.2 / w
lg.scale = (k, k, k); lg.rotation_euler = (math.radians(90), 0, math.radians(-90))
lg.location = P(SX - 1.07, T + 0.6, 0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
done(lg, N_LOGO, 'neon')

# ---------- надувные буквы STAYA / POOL ----------
FONT = bpy.data.fonts.load(os.path.join(D, 'fonts', 'unbounded-latin-900.ttf'))
def inflated(word, m, center, size, ry=0.0, pressure=16):
    bpy.ops.object.text_add(location=(0, 0, 0)); t = bpy.context.object
    t.data.font = FONT; t.data.body = word; t.data.align_x = 'CENTER'; t.data.size = 1; t.data.space_character = 0.92
    t.data.extrude = 0.1; t.data.bevel_depth = 0.04; t.data.bevel_resolution = 3; t.data.resolution_u = 8
    t.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    rm = o.modifiers.new('r', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.028; bpy.ops.object.modifier_apply(modifier='r')
    cl = o.modifiers.new('cloth', 'CLOTH'); s = cl.settings
    s.quality = 6; s.mass = 0.3; s.use_pressure = True; s.uniform_pressure_force = pressure
    s.tension_stiffness = 6; s.compression_stiffness = 6; s.shear_stiffness = 4; s.bending_stiffness = 0.3; s.effector_weights.gravity = 0
    cl.point_cache.frame_start = 1; cl.point_cache.frame_end = 30
    for f in range(1, 31): sc.frame_set(f)
    bpy.ops.object.modifier_apply(modifier='cloth'); sc.frame_set(1)
    dc = o.modifiers.new('d', 'DECIMATE'); dc.ratio = 0.55; bpy.ops.object.modifier_apply(modifier='d')
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bb = o.dimensions
    o.scale = (size, size, size); o.rotation_euler = (0, 0, ry)
    o.location = P(center[0], center[1] + bb.z * size / 2 - 0.05, center[2])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.name = 'letters_' + word
    return done(o, m, 'gloss', smooth=True)
inflated('STAYA', INF_PINK, (-7.2, T, -9.4), 3.0, ry=0.16)
inflated('POOL', INF_CYAN, (6.8, T, -9.4), 3.2, ry=-0.16)
# спасательный круг на букве L и мяч у буквы S
torus((11.2, 2.6, -8.9), 0.6, 0.22, INF_WHITE, rot=(math.radians(70), 0, math.radians(-20)))
sph((-11.6, T + 0.45, -7.6), 0.45, BALL, 'gloss')

# ---------- реквизит у бассейна ----------
def lounger(x, z, ry):
    m = Matrix.Translation(P(x, 0, z)) @ Matrix.Rotation(ry, 4, 'Z')
    parts = []
    parts.append(box((0, 0.42, 0.2), (0.72, 0.1, 1.5), STRIPE, 'near', bevel=0.02))
    parts.append(box((0, 0.7, -0.8), (0.72, 0.1, 0.85), STRIPE, 'near', bevel=0.02))
    parts[-1].rotation_euler = (math.radians(-35), 0, 0)
    for sxx in (-1, 1):
        for zz in (-0.6, 0.85): parts.append(box((sxx * 0.32, 0.2, zz), (0.04, 0.4, 0.04), METAL, 'near'))
    for o in parts:
        o.matrix_world = m @ o.matrix_world
for i in range(6): lounger(-9 + i * 3.6, 7.4, math.pi)
for i in range(3): lounger(-14.2, -3 + i * 2.6, math.pi / 2)
# красные стаканы, шлёпанцы
for i in range(36):
    a = random.random() * math.tau; rr = 13 + random.random() * 5
    x, z = math.cos(a) * rr, math.sin(a) * rr * 0.55 + 1
    if random.random() < 0.25:
        o = cyl((x, T + 0.05, z - 0.065), (x, T + 0.05, z + 0.065), 0.05, RED, 'near', seg=12, r2=0.04)
    else:
        cyl((x, T, z), (x, T + 0.13, z), 0.04, RED, 'near', seg=12, r2=0.055)
for x, z, c in [(3, 6.4, '#2fe6ff'), (3.4, 6.5, '#2fe6ff'), (-4.5, -6.6, '#ff3fb4'), (-4.1, -6.4, '#ff3fb4')]:
    box((x, T + 0.02, z), (0.12, 0.03, 0.3), mat('flip' + c, srgb(c), 0.4), 'near', bevel=0.01)
# надувной фламинго и круги на воде (вода на уровне 0.1)
def flamingo(x, z, s, ry, mm):
    objs = [torus((0, 0.2, 0), 0.75, 0.32, mm, rot=(math.radians(90), 0, 0)), sph((0, 0.55, -0.55), 0.55, mm, 'gloss', s=(0.8, 0.7, 1.2)),
            tube([(0, 0.7, 0.55), (0, 1.4, 0.75), (0, 2.0, 0.45), (0, 2.2, 0.1)], 0.16, mm, 'gloss'), sph((0, 2.25, 0.15), 0.25, mm, 'gloss')]
    m = Matrix.Translation(P(x, 0.0, z)) @ Matrix.Rotation(ry, 4, 'Z') @ Matrix.Scale(s, 4)
    for o in objs: o.matrix_world = m @ o.matrix_world
flamingo(-7, 1, 1.1, 0.5, INF_FLAM)
torus((7.5, 0.15, 2.5), 0.75, 0.3, INF_YEL, rot=(math.radians(90), 0, 0))
for (x, z), mm in zip([(-3.5, 3), (3.5, -1), (8, -3.5), (-8.5, -3)], [INF_PINK, INF_WHITE, INF_CYAN, INF_YEL]):
    torus((x, 0.15, z), 0.6, 0.22, mm, rot=(math.radians(90), 0, 0))

# ---------- пальмы, деревья, забор, гирлянды ----------
def palm(x, z, h, lean, seed):
    rnd = random.Random(seed)
    pts = [(x + lean[0] * h * 0.25 * t * t, h * t, z + lean[1] * h * 0.25 * t * t) for t in [i / 6 for i in range(7)]]
    tube(pts, 1.0, TRUNK, 'far', taper=(0.24, 0.14), res=4)
    top = Vector(pts[-1])
    for i in range(10):
        a = i / 10 * math.tau + rnd.random() * 0.3; L = 3.2 + rnd.random()
        dx, dz = math.cos(a), math.sin(a)
        fr = [(top.x, top.y, top.z), (top.x + dx * L * 0.45, top.y + 0.5, top.z + dz * L * 0.45), (top.x + dx * L, top.y - 1.2, top.z + dz * L)]
        o = tube(fr, 1.0, LEAF, 'far', taper=(0.12, 0.02), res=6)
        o.scale = (1, 1, 1)
for i, (x, z) in enumerate([(-24, -6), (-30, 6), (-26, 16), (24, -8), (30, 4), (27, 15), (-20, -14), (22, -15)]):
    palm(x, z, 9 + (i % 3) * 1.6, (0.6 if i % 2 else -0.6, 0.3), i)
for i in range(18):
    sx = 1 if i % 2 else -1; x = sx * (34 + random.random() * 8); z = -30 + random.random() * 54; h = 6 + random.random() * 6
    cyl((x, 0, z), (x, h * 0.4, z), 0.3, TRUNK, 'far', seg=8)
    sph((x, h * 0.75, z), 2.4 + random.random(), TREE, 'far', s=(1, 1.3, 1), seg=12)
for x in range(-40, 41, 2): box((x, 1.2, 24), (1.85, 2.4, 0.12), FENCE, 'far')
for sx in (-1, 1):
    for z in range(-30, 25, 2): box((sx * 40, 1.2, z), (0.12, 2.4, 1.85), FENCE, 'far')
for x, z in [(-18, 12), (-4, 15), (18, 12)]: cyl((x, 0, z), (x, 6.5, z), 0.08, METAL, 'far', seg=8)
strings = [((-16, 7.5, -19), (-18, 6.5, 12)), ((-6, 7.5, -19), (-4, 6.5, 15)), ((6, 7.5, -19), (-4, 6.5, 15)), ((16, 7.5, -19), (18, 6.5, 12)), ((-18, 6.5, 12), (-4, 6.5, 15)), ((-4, 6.5, 15), (18, 6.5, 12))]
BULBS = []
for a, c in strings:
    n = 22; pts = []
    for i in range(n + 1):
        t = i / n; sag = math.sin(t * math.pi) * 2.2
        q = (a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag, a[2] + (c[2] - a[2]) * t); pts.append(q)
        if 0 < i < n: BULBS.append(q); sph((q[0], q[1] - 0.12, q[2]), 0.09, N_BULB if i % 3 else N_PAR['pink'], 'neon', seg=10)
    tube(pts, 0.012, DARK, 'far', res=2)

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
# луна — со стороны +Z (луна в сцене висит над въездом)
sun = light('SUN', (0, 58, 95), srgb('#a9b8ff'), 2.6, target=(0, 0, 0)); sun.data.angle = math.radians(2)
for x in range(-8, 9, 4): light('POINT', (x, -0.9, 0), srgb('#2fe6ff'), 700, size=0.4)
light('AREA', (0, 9, -10), srgb('#ff4fb8'), 2600, size=6, target=(0, 1, -9))
for i, c in enumerate(pars):
    col = {'pink': '#ff3fb4', 'green': '#39ff6a', 'red': '#ff2a2a', 'cyan': '#2fe6ff'}[c]
    light('SPOT', (SX - 0.45, 6.75, -4 + i * 2), srgb(col), 2200, size=0.2, target=(6 - i, 0.3, (-4 + i * 2) * 1.6), spot=math.radians(32))
light('AREA', (6, 22, -26), srgb('#b04dff'), 26000, size=14, target=OC)
light('AREA', (0, 4, -16), srgb('#ffb36b'), 1400, size=8, target=(0, 2, -19))
for i, q in enumerate(BULBS[::6]): light('POINT', (q[0], q[1] - 0.3, q[2]), srgb('#ffd28a'), 60, size=0.2)

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'pool.blend'))
print('built', len(bpy.data.objects), 'objects')
