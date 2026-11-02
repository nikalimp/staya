# Запекание света для сцен, собранных в коде (AQUA, клуб): геометрия выгружена с сайта (dev/export.html),
# цвета — в вершинах, свет — точечные источники сцены + неон как светящиеся поверхности.
# Результат: <id>.glb (геометрия с UV для карты света, без неона) и <id>_light.webp.
import bpy, os, sys, json, math, time
import numpy as np
from PIL import Image, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index('--') + 1:]
ID = args[0]; SIZE = int(args[1]) if len(args) > 1 else 2048; SPP = int(args[2]) if len(args) > 2 else 64
OUT = os.path.join(D, ID); os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=os.path.join(D, f'{ID}_src.glb'))
L = json.load(open(os.path.join(D, f'{ID}_lights.json')))

def srgb_hex(h):  # three отдаёт цвет света в sRGB-hex; Blender ждёт линейный
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)

# материалы: базовый цвет из цвета вершин
def mat(kind):
    m = bpy.data.materials.new(kind); m.use_nodes = True; nt = m.node_tree; p = nt.nodes['Principled BSDF']
    ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Color'
    nt.links.new(ca.outputs['Color'], p.inputs['Base Color'])
    rough = {'gloss': 0.2, 'plastic': 0.45, 'matte': 0.9, 'metal': 0.3, 'chrome': 0.08, 'neon': 0.5}[kind]
    p.inputs['Roughness'].default_value = rough
    if kind in ('metal', 'chrome'): p.inputs['Metallic'].default_value = 1.0
    if kind == 'neon':
        nt.links.new(ca.outputs['Color'], p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value = 2.5
    return m

objs = [o for o in bpy.data.objects if o.type == 'MESH']
for o in objs:
    kind = o.data.materials[0].name if o.data.materials else o.name
    kind = kind.split('.')[0]
    o.data.materials.clear(); o.data.materials.append(mat(kind)); o['kind'] = kind
    if 'Color' not in o.data.color_attributes and len(o.data.color_attributes): o.data.color_attributes[0].name = 'Color'

# свет: точечные источники (кроме «бегущих» в трубе горки), полусфера → мир
for l in L['lights']:
    if l['t'] == 'point' and l['p'] == [0, 0, 0]: continue
    if l['t'] == 'point':
        bpy.ops.object.light_add(type='POINT', location=(l['p'][0], -l['p'][2], l['p'][1])); lo = bpy.context.object
        lo.data.energy = 4 * math.pi * l['i']; lo.data.color = srgb_hex(l['c']); lo.data.shadow_soft_size = 0.6
    elif l['t'] == 'hemi':
        w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
        a, b = srgb_hex(l['c']), srgb_hex(l['g'])
        bg.inputs[0].default_value = (*[(x + y) / 2 for x, y in zip(a, b)], 1); bg.inputs[1].default_value = l['i'] / math.pi
if not sc.world:
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 0.05

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 3
sc.render.bake.margin = 8; sc.render.bake.margin_type = 'EXTEND'

# всё, кроме неона, — в один объект с общей разверткой под карту света
bake = [o for o in objs if o['kind'] != 'neon']
bpy.ops.object.select_all(action='DESELECT')
for o in bake: o.select_set(True)
bpy.context.view_layer.objects.active = bake[0]; bpy.ops.object.join(); B = bpy.context.view_layer.objects.active; B.name = 'baked'
me = B.data
for l in list(me.uv_layers): me.uv_layers.remove(l)
me.uv_layers.new(name='bake')
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0005, use_sharp_edge_from_normals=True)   # треугольники из сайта — в связную сетку, иначе развертка рассыпается
bpy.ops.mesh.select_all(action='SELECT')
t0 = time.time(); bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002, area_weight=0.0, scale_to_bounds=True)
bpy.ops.object.mode_set(mode='OBJECT'); print('uv', round(time.time() - t0), 's', len(me.polygons), 'faces', flush=True)
img = bpy.data.images.new('lm', SIZE, SIZE, alpha=False, float_buffer=True)
for m in me.materials:
    n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n
bpy.ops.object.select_all(action='DESELECT'); B.select_set(True); bpy.context.view_layer.objects.active = B
t0 = time.time(); bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, use_clear=True, margin=8)
print('bake', round(time.time() - t0), 's', flush=True)
w, h = img.size; a = np.empty(w * h * 4, np.float32); img.pixels.foreach_get(a); a = a.reshape(h, w, 4)[::-1, :, :3] * 0.125   # яркие локальные источники: шкала 1/8, на сайте k ≈ 8
a = np.clip(a, 0, 1); a = np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(a, 1 / 2.4) - 0.055)
Image.fromarray((a * 255 + 0.5).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(OUT, f'{ID}_light.webp'), 'WEBP', quality=88, method=6)
# экспорт: только запечённый объект (неон остаётся на сайте как есть); имена материалов = виды
for o in list(bpy.data.objects):
    if o != B: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f'{ID}.glb'), export_format='GLB', export_materials='EXPORT', export_image_format='NONE',
                          export_texcoords=True, export_normals=True, export_vertex_color='ACTIVE', export_yup=True)
print('done', os.path.getsize(os.path.join(OUT, f'{ID}.glb')) // 1024, 'KB', flush=True)
