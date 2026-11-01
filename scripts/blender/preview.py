import bpy, sys, math, os
from mathutils import Vector
D = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'pool.blend'))
sc = bpy.context.scene
def P(x, y, z): return Vector((x, -z, y))
shots = {'pool': ((0, 4.2, 13), (0, 1.8, -10)), 'high': ((0, 24, 76), (0, 4, 0)), 'stage': ((-2, 3.5, 6), (14, 3, 0))}
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.sensor_fit = 'VERTICAL'; cam.data.angle_y = math.radians(72)
sc.render.resolution_x = 540; sc.render.resolution_y = 960
sc.cycles.samples = int(sys.argv[-1]) if sys.argv[-1].isdigit() else 24; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
for name in sys.argv[sys.argv.index('--') + 1:]:
    if name.isdigit() or name not in shots: continue
    p, l = shots[name]; cam.location = P(*p); cam.rotation_euler = (P(*l) - P(*p)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(D, f'prev_{name}.png'); bpy.ops.render.render(write_still=True)
