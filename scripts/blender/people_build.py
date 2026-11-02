# STAYA — люди из Quaternius Universal Base Characters (CC0) + позы из Universal Animation Library (CC0).
# Для каждого пола и позы: тело в позе → цвета вершин из текстуры + маска областей → GLB со статичными мешами.
# Режимы: preview — картинки поз; build — world/people/people.glb для сайта.
import bpy, bmesh, os, sys, math, json
from mathutils import Vector, Matrix, Quaternion, Euler

Q = os.path.dirname(os.path.abspath(__file__))
UBC = os.path.join(Q, 'ubc', 'Universal Base Characters[Standard]')
BASE = os.path.join(UBC, 'Base Characters', 'Godot - UE')
HAIR = os.path.join(UBC, 'Hairstyles', 'Origin at 0', 'glTF (Godot)')
UAL = os.path.join(Q, 'ual', 'Universal Animation Library[Standard]', 'Unreal-Godot', 'UAL1_Standard.glb')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = args[0] if args else 'preview'
OUT = args[1] if len(args) > 1 else os.path.join(Q, 'out')
os.makedirs(OUT, exist_ok=True)

# Позы: имя → (действие UAL, доля кадра, поправки костей в градусах {кость: (x, y, z)})
# Направления костей рук в мире (персонаж смотрит на −Y, его левая сторона +X, вверх +Z); для правой руки X зеркалится.
def arms(ua, la, ua_r=None, la_r=None):
    mir = lambda v: (-v[0], v[1], v[2])
    return {'upperarm_l': ua, 'lowerarm_l': la, 'upperarm_r': ua_r or mir(ua), 'lowerarm_r': la_r or mir(la)}
DOWN = ((0.15, 0.05, -1), (0.12, -0.15, -1))
POSES = {
    'idle':     ('Idle_Loop', 0.0, {}),
    'talk':     ('Idle_Talking_Loop', 0.45, {}),
    'dance_a':  ('Dance_Loop', 0.0, {}),
    'dance_b':  ('Dance_Loop', 0.33, {}),
    'dance_c':  ('Dance_Loop', 0.66, {}),
    'up':       ('Dance_Loop', 0.0, arms((0.45, -0.1, 1), (0.1, -0.2, 1))),
    'wave':     ('Idle_Loop', 0.0, arms((0.5, -0.1, 1), (0.15, -0.2, 1), *DOWN)),
    'dj':       ('Idle_Loop', 0.0, arms((0.2, -0.45, -0.85), (-0.15, -1, -0.1))),
    'count':    ('Idle_Loop', 0.0, arms((0.15, -0.35, -0.9), (-0.35, -1, -0.35))),
    'phone':    ('Idle_Loop', 0.0, arms(DOWN[0], DOWN[1], (-0.25, -0.45, -0.85), (0.35, -0.55, 0.75))),
    'hug':      ('Idle_Loop', 0.0, arms((0.35, -0.9, -0.3), (-0.95, -0.35, 0.05))),
    'hips':     ('Idle_Loop', 0.0, arms((0.7, 0.15, -0.7), (-0.75, -0.2, -0.3))),
    'sit':      ('Sitting_Idle_Loop', 0.0, {}),
    'sit_talk': ('Sitting_Talking_Loop', 0.4, {}),
    'swim':     ('Swim_Idle_Loop', 0.2, {}),
    'drive':    ('Driving_Loop', 0.0, {}),
}

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def load_char(sex):
    bpy.ops.import_scene.gltf(filepath=os.path.join(BASE, f'Superhero_{sex}_FullBody.gltf'))
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.name != 'Icosphere' and o.find_armature() == arm]
    for o in [o for o in bpy.data.objects if o.type == 'MESH' and o not in meshes]: bpy.data.objects.remove(o, do_unlink=True)
    return arm, meshes

def load_actions():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=UAL)
    for o in [o for o in bpy.data.objects if o not in before]: bpy.data.objects.remove(o, do_unlink=True)
    return {a.name: a for a in bpy.data.actions}

def set_pose(arm, acts, spec):
    an, frac, fix = spec
    act = acts[an]; ad = arm.animation_data or arm.animation_data_create()
    ad.action = act
    if hasattr(ad, 'action_slot') and act.slots: ad.action_slot = act.slots[0]
    f0, f1 = act.frame_range
    bpy.context.scene.frame_set(int(round(f0 + (f1 - f0) * frac)))
    bpy.context.view_layer.update()
    # фиксируем позу и снимаем действие, чтобы добавить поправки
    for pb in arm.pose.bones: pb.matrix_basis = pb.matrix_basis.copy()
    saved = {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones}
    ad.action = None
    for pb in arm.pose.bones: pb.matrix_basis = saved[pb.name]
    # поправки: направить кость (по порядку: плечо, потом предплечье) в заданном мировом направлении
    inv = arm.matrix_world.inverted().to_3x3()
    for bn, d in fix.items():
        bpy.context.view_layer.update()
        pb = arm.pose.bones[bn]
        cur = (pb.tail - pb.head).normalized(); want = (inv @ Vector(d)).normalized()
        q = cur.rotation_difference(want)
        m = pb.matrix.copy(); t = m.to_translation()
        pb.matrix = Matrix.Translation(t) @ q.to_matrix().to_4x4() @ Matrix.Translation(-t) @ m
    bpy.context.view_layer.update()

def preview(sex):
    reset(); arm, meshes = load_char(sex); acts = load_actions()
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x = 300; sc.render.resolution_y = 420
    sc.display.shading.color_type = 'TEXTURE'
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0.0, -5.0, 1.0); cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 75
    for name, spec in POSES.items():
        set_pose(arm, acts, spec)
        sc.render.filepath = os.path.join(OUT, f'pose_{sex}_{name}.png'); bpy.ops.render.render(write_still=True)

TEX = os.path.join(UBC, 'Base Characters', 'Textures')
SKIN_TEX = {'Male': 'T_Superhero_Male_Ligh.png', 'Female': 'T_Superhero_Female_Light_BaseColor.png'}
HAIRS = {'Male': ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Beard'], 'Female': ['Hair_Buns', 'Hair_Long', 'Hair_BuzzedFemale']}
import glob, numpy as np
R_SKIN, R_CLOTH, R_EYE, R_HAIR, R_TOP, R_SHORTS = 0, 1, 2, 3, 4, 5

def img_np(path_or_img):
    im = path_or_img if not isinstance(path_or_img, str) else bpy.data.images.load(path_or_img, check_existing=True)
    w, h = im.size; a = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(a)
    return a.reshape(h, w, 4), w, h

def tex_of(o):
    for n in o.data.materials[0].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and 'Normal' not in n.image.name and 'Rough' not in n.image.name: return n.image
    return None

def paint(o, img, region_fn):
    # цвет вершин-углов из текстуры (по UV) + область вершины
    px, w, h = img_np(img); me = o.data; uv = me.uv_layers[0].data
    for ca in list(me.color_attributes): me.color_attributes.remove(ca)
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    me.color_attributes.active_color = col; me.color_attributes.render_color_index = 0
    reg = me.attributes.new('_REGION', 'FLOAT', 'POINT') if '_REGION' not in me.attributes else me.attributes['_REGION']
    vr = np.zeros(len(me.vertices), np.float32)
    for li, l in enumerate(me.loops):
        u, v = uv[li].uv; x = min(w - 1, max(0, int((u % 1) * w))); y = min(h - 1, max(0, int((v % 1) * h)))
        c = px[y, x]; col.data[li].color = (c[0], c[1], c[2], 1)
        vr[l.vertex_index] = max(vr[l.vertex_index], region_fn(c))
    reg.data.foreach_set('value', vr)
    print('  paint', o.name, w, h, 'regions', np.unique(vr), flush=True)
    # область — в альфу цвета (gltfpack не сохраняет свои атрибуты): alpha = область / 10
    for li, l in enumerate(me.loops):
        c = col.data[li].color; col.data[li].color = (c[0], c[1], c[2], vr[l.vertex_index] / 10)

def lum(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def posed_copy(o, name):
    dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    n = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(n); n.matrix_world = o.matrix_world.copy()
    return n

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = name; return o

def bone_sets(body, arm):
    # какие вершины уходят в майку и в шорты (по весам костей в позе покоя)
    gi = {g.index: g.name for g in body.vertex_groups}
    kz = (arm.matrix_world @ arm.data.bones['calf_l'].head_local).z
    pz = (arm.matrix_world @ arm.data.bones['pelvis'].head_local).z
    s3 = (arm.matrix_world @ arm.data.bones['neck_01'].head_local).z
    top, shorts = set(), set()
    for v in body.data.vertices:
        if not v.groups: continue
        g = max(v.groups, key=lambda g: g.weight); b = gi[g.group]; z = (body.matrix_world @ v.co).z
        if b in ('spine_01', 'spine_02', 'spine_03') or (b == 'pelvis' and z > pz + 0.02) or (b.startswith('clavicle') and z < s3 - 0.02): top.add(v.index)
        if (b in ('pelvis', 'thigh_l', 'thigh_r') and kz + 0.06 < z < pz + 0.1): shorts.add(v.index)
    return top, shorts

def shell(src, keep, off, region, name):
    o = src.copy(); o.data = src.data.copy(); o.name = name; bpy.context.scene.collection.objects.link(o)
    bm = bmesh.new(); bm.from_mesh(o.data)
    dele = [v for v in bm.verts if v.index not in keep]; bmesh.ops.delete(bm, geom=dele, context='VERTS')
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * off
    bm.to_mesh(o.data); bm.free()
    o.data.attributes['_REGION'].data.foreach_set('value', np.full(len(o.data.vertices), region, np.float32))
    col = o.data.color_attributes['Col']; col.data.foreach_set('color', np.tile([1, 1, 1, region / 10], len(col.data)).astype(np.float32))
    return o

def decimate(o, ratio, name):
    c = o.copy(); c.data = o.data.copy(); c.name = name; bpy.context.scene.collection.objects.link(c)
    d = c.modifiers.new('d', 'DECIMATE'); d.ratio = ratio
    bpy.context.view_layer.objects.active = c; bpy.ops.object.select_all(action='DESELECT'); c.select_set(True)
    bpy.ops.object.modifier_apply(modifier='d'); return c

def build(sex, out_objs, info):
    reset(); arm, meshes = load_char(sex); acts = load_actions()
    S = sex[0]
    body = [o for o in meshes if o.name.lower().startswith('superhero')][0]
    eyes = [o for o in meshes if o.name.startswith('Eyes')][0]; brows = [o for o in meshes if o.name.startswith('Eyebrows')][0]
    paint(body, os.path.join(TEX, SKIN_TEX[sex]), lambda c: R_CLOTH if (max(c[:3]) - min(c[:3])) < 0.07 else R_SKIN)
    paint(eyes, tex_of(eyes), lambda c: R_EYE)
    paint(brows, tex_of(brows), lambda c: R_HAIR)
    top, shorts = bone_sets(body, arm)
    rest = {b: arm.matrix_world @ arm.pose.bones[b].matrix for b in ('Head', 'spine_03', 'hand_r', 'hand_l')}
    # причёски этого пола — в позе покоя; на сайте их ведёт якорь головы
    for hn in HAIRS[sex]:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=glob.glob(os.path.join(glob.escape(HAIR), hn + '.gltf'))[0])
        hs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
        for o in [o for o in bpy.data.objects if o not in before and o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
        h = hs[0]; paint(h, tex_of(h), lambda c: R_HAIR); h.name = f'{S}_hair_{hn[5:]}'; out_objs += [h, decimate(h, 0.25, h.name + '_lo')]
    for pname, spec in POSES.items():
        set_pose(arm, acts, spec)
        parts = [posed_copy(o, f'{S}_{pname}_{o.name}') for o in (body, eyes, brows)]
        bcopy = parts[0]
        t = shell(bcopy, top, 0.012, R_TOP, f'{S}_{pname}_top'); sh = shell(bcopy, shorts, 0.016, R_SHORTS, f'{S}_{pname}_shorts')
        full = join(parts, f'{S}_{pname}')
        lo = decimate(full, 0.14, f'{S}_{pname}_lo')
        out_objs.append(decimate(full, 0.4, f'{S}_{pname}_mid'))
        out_objs += [full, lo, t, sh, decimate(t, 0.2, t.name + '_lo'), decimate(sh, 0.2, sh.name + '_lo')]
        # якоря: поворот/сдвиг кости относительно позы покоя (на сайте ими ведём волосы, очки, кепки, цепи, предметы в руках)
        info[f'{S}_{pname}'] = {}
        for b, r in rest.items():
            m = (arm.matrix_world @ arm.pose.bones[b].matrix) @ r.inverted()
            e = bpy.data.objects.new(f'{S}_{pname}_@{b}', None); bpy.context.scene.collection.objects.link(e); e.matrix_world = m; out_objs.append(e)
    return arm

if MODE == 'build':
    allobjs = []; info = {}
    for sex in ('Male', 'Female'):
        objs = []; build(sex, objs, info)
        for o in list(bpy.data.objects):
            if o not in objs: bpy.data.objects.remove(o, do_unlink=True)
        for o in objs:
            if o.type == 'MESH':
                o.data.materials.clear(); o.data.materials.append(bpy.data.materials.get('people') or bpy.data.materials.new('people'))
                for l in list(o.data.uv_layers): o.data.uv_layers.remove(l)
                for vg in list(o.vertex_groups): o.vertex_groups.remove(vg)
                o.modifiers.clear(); o.parent = None
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f'people_{sex[0]}.glb'), export_format='GLB', export_materials='EXPORT', export_attributes=True,
                                  export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_skins=False, export_animations=False, export_morph=False, export_apply=False, export_yup=True)
        print('exported', sex, len(objs), flush=True)

if MODE == 'preview':
    for sex in (args[2:] or ['Male', 'Female']): preview(sex)
