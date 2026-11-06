"""Render frames of one scene from the .blend.
Usage: python render.py <file.blend> <scene_prefix e.g. S1> <out_dir> [frames | start-end]"""
import sys, os, time
import bpy

blend, prefix, out = sys.argv[1], sys.argv[2], sys.argv[3]
bpy.ops.wm.open_mainfile(filepath=blend)
sc = next(s for s in bpy.data.scenes if s.name.startswith(prefix + '_'))
frames = []
for a in sys.argv[4:]:
    if '-' in a:
        lo, hi = map(int, a.split('-'))
        frames += range(lo, hi + 1)
    else:
        frames.append(int(a))
frames = frames or range(sc.frame_start, sc.frame_end + 1)
os.makedirs(out, exist_ok=True)
for f in frames:
    fp = os.path.join(out, f'{prefix}_{f:04d}.png')
    if os.path.exists(fp) and os.environ.get('SKIP_EXISTING'):
        continue
    t = time.time()
    sc.frame_set(f)
    sc.render.filepath = fp
    bpy.ops.render.render(write_still=True, scene=sc.name)
    print(f'{prefix} frame {f} {time.time() - t:.1f}s', flush=True)
