"""Build all 8 scenes into one .blend (plus FINAL_EDIT sequencer scene assembling them).
Usage: python build.py <out.blend> [scene numbers...]"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import scenes_a, scenes_b

BUILDERS = {1: scenes_a.scene1, 2: scenes_a.scene2, 3: scenes_a.scene3, 4: scenes_a.scene4,
            5: scenes_b.scene5, 6: scenes_b.scene6, 7: scenes_b.scene7, 8: scenes_b.scene8}

out = sys.argv[1]
which = [int(a) for a in sys.argv[2:]] or list(BUILDERS)
default = bpy.data.scenes[0]
built = []
for n in which:
    t = time.time()
    built.append(BUILDERS[n]())
    print(f'built scene {n} in {time.time() - t:.1f}s', flush=True)
# remove the startup scene/objects
for o in list(default.objects):
    bpy.data.objects.remove(o)
if len(which) == 8:
    edit = default
    edit.name = 'FINAL_EDIT'
    edit.render.resolution_x, edit.render.resolution_y = 1080, 1920
    edit.render.fps = 24
    se = edit.sequence_editor_create()
    f = 1
    for sc in built:
        st = se.strips.new_scene(sc.name, sc, 1, f)
        st.transform.filter = 'NEAREST'
        st.transform.scale_x = st.transform.scale_y = 3.0
        f += sc.frame_end
    edit.frame_start, edit.frame_end = 1, f - 1
    edit.render.image_settings.media_type = 'VIDEO'
else:
    bpy.data.scenes.remove(default)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(out), compress=True)
print('saved', out)
