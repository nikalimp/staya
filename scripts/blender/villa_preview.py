import bpy, sys, math, os
from mathutils import Vector
D = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'villa.blend'))
sc = bpy.context.scene
for o in bpy.data.collections['glass'].objects: o.hide_render = True
bpy.ops.mesh.primitive_plane_add(size=4000, location=(0, 0, -30)); sea = bpy.context.object
sm = bpy.data.materials.new('sea'); sm.use_nodes = True; sm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.05, 0.15, 0.25, 1); sm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.1; sea.data.materials.append(sm)
def P(x, y, z): return Vector((x, -z, y))
shots = {'arrive': ((0, 2.2, 44), (0, 3.5, 10)), 'living': ((1, 1.9, 9), (-7, 1.4, 4)), 'out': ((0, 1.8, 1), (0, 1.2, -15)),
         'vip': ((9.2, 2.6, -10), (15, 1.4, -11)), 'sunrise': ((0, 2.8, -22), (30, 10, -100)), 'wide': ((-30, 22, 40), (0, 0, -6)), 'final': ((0, 2.6, -21.5), (29, 3, -117)), 'fromsea': ((20, 10, -140), (0, -5, -20)), 'living': ((-1, 1.8, 9.6), (-8, 1.3, 5.5))}
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.sensor_fit = 'VERTICAL'; cam.data.angle_y = math.radians(70); cam.data.clip_end = 2000
sc.render.resolution_x = 540; sc.render.resolution_y = 960
sc.cycles.samples = 16; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 4
for name in sys.argv[sys.argv.index('--') + 1:]:
    p, l = shots[name]; cam.location = P(*p); cam.rotation_euler = (P(*l) - P(*p)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(D, f'vprev_{name}.png'); bpy.ops.render.render(write_still=True)
