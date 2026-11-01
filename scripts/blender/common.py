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
G = {k: coll(k) for k in ['ground', 'near', 'inner', 'far', 'gloss', 'neon', 'glass', 'lights', 'helpers']}

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
