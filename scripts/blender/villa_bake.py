# Запекание света сцены PHUKET (вилла) и экспорт для сайта.
# Для каждой группы: общий UV-атлас → альбедо (1 сэмпл) + свет (direct+indirect, N сэмплов) → WebP.
# Глянцевая группа: альбедо × свет сразу (цвета плоские). Неон — без запекания, цвет в glTF.
import bpy, os, sys, math, time
import numpy as np
from PIL import Image, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, 'vout'); os.makedirs(os.path.join(OUT, 'tex'), exist_ok=True)
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
FAST = 'fast' in args
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'villa.blend'))
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 2
for o in bpy.data.collections['glass'].objects: o.hide_render = True
sc.render.bake.margin = 12; sc.render.bake.margin_type = 'EXTEND'

GROUPS = {  # имя: (размер альбедо, размер света, сэмплы света, режим)
    'ground': (2048, 1024, 48, 'combined'),
    'near':   (4096, 2048, 64, 'split'),
    'inner':  (2048, 1024, 64, 'split'),
    'far':    (4096, 1024, 64, 'split'),
    'gloss':  (2048, 1024, 64, 'combined'),
}
if FAST: GROUPS = {k: (v[0] // 4, v[1] // 4, 8, v[3]) for k, v in GROUPS.items()}

def objs_in(name): return [o for o in bpy.data.collections[name].objects if o.type == 'MESH']

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = name
    return o

def uv_project(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
        me = o.data
        while me.uv_layers: me.uv_layers.remove(me.uv_layers[0])
        me.uv_layers.new(name='bake'); me.uv_layers.active_index = 0
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode='OBJECT')

def target(objs, img):
    for o in objs:
        for slot in o.material_slots:
            m = slot.material; nt = m.node_tree
            n = nt.nodes.get('BAKE') or nt.nodes.new('ShaderNodeTexImage'); n.name = 'BAKE'; n.image = img
            nt.nodes.active = n

def bake(objs, img, passes, samples):
    target(objs, img); sc.cycles.samples = samples
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    t0 = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter=passes, use_clear=True, margin=12)
    print(f'  bake {img.name} {img.size[0]} {sorted(passes)} {samples}spp {time.time() - t0:.0f}s', flush=True)

def to_np(img):
    w, h = img.size; a = np.empty(w * h * 4, np.float32); img.pixels.foreach_get(a)
    return a.reshape(h, w, 4)[::-1, :, :3]  # верх-низ как у PNG

def lin2srgb(x):
    x = np.clip(x, 0, 1); return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)

def save(arr, path, blur=0, q=88):
    im = Image.fromarray((lin2srgb(arr) * 255 + 0.5).astype(np.uint8))
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    im.save(path, 'WEBP', quality=q, method=6); print('  saved', os.path.basename(path), os.path.getsize(path) // 1024, 'KB', flush=True)

def new_img(name, size, float_buf):
    return bpy.data.images.new(name, size, size, alpha=False, float_buffer=float_buf)

LIGHT_SCALE = 0.5  # свет кодируем как L*0.5 в sRGB; на сайте lightMapIntensity = 2

result = {}
for g, (asz, lsz, spp, mode) in GROUPS.items():
    print('group', g, flush=True)
    objs = objs_in(g)
    if g == 'gloss':
        keep = [o for o in objs if o.name.startswith('letters_')]
        rest = [o for o in objs if o not in keep]
        objs = keep + [join(rest, 'gloss_static')]
    else:
        objs = [join(objs, g)]
    uv_project(objs)
    if mode == 'combined':
        img = new_img(g + '_bake', asz, True)
        bake(objs, img, {'DIRECT', 'INDIRECT', 'COLOR'}, spp)
        save(to_np(img), os.path.join(OUT, 'tex', g + '.webp'), blur=0.6)
    else:
        alb = new_img(g + '_albedo', asz, False)
        bake(objs, alb, {'COLOR'}, 1)
        save(to_np(alb), os.path.join(OUT, 'tex', g + '_albedo.webp'))
        lit = new_img(g + '_light', lsz, True)
        bake(objs, lit, {'DIRECT', 'INDIRECT'}, spp)
        save(to_np(lit) * LIGHT_SCALE, os.path.join(OUT, 'tex', g + '_light.webp'), blur=1.2)
    # один материал на группу: имя говорит сайту, какие текстуры брать
    shared = bpy.data.materials.new('bake_' + g)
    for o in objs:
        m = bpy.data.materials.new(o.name) if o.name.startswith('letters_') else shared
        o.data.materials.clear(); o.data.materials.append(m)
        for p in o.data.polygons: p.material_index = 0
    result[g] = [o.name for o in objs]

# неон: имя материала neon_* + цвет в glTF (emissive)
neon = objs_in('neon')
by_mat = {}
for o in neon: by_mat.setdefault(o.material_slots[0].material.name, []).append(o)
for mname, os_ in by_mat.items():
    j = join(os_, mname)
    m = j.material_slots[0].material; p = m.node_tree.nodes['Principled BSDF']
    c = p.inputs['Emission Color'].default_value; p.inputs['Base Color'].default_value = c
    for uv in list(j.data.uv_layers): j.data.uv_layers.remove(uv)

# стекло: одним мешем, материал glass_clear
gl = objs_in('glass')
if gl:
    j = join(gl, 'glass'); j.hide_render = False
    for uv in list(j.data.uv_layers): j.data.uv_layers.remove(uv)
# убираем всё лишнее и экспортируем
for o in list(bpy.data.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'villa.glb'), export_format='GLB', export_materials='PLACEHOLDER' if False else 'EXPORT',
                          export_image_format='NONE', export_texcoords=True, export_normals=True, export_apply=True, export_yup=True,
                          export_draco_mesh_compression_enable=False)
print('glb', os.path.getsize(os.path.join(OUT, 'villa.glb')) // 1024, 'KB', result)
