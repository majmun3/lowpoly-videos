"""Extract sound-sync events from the rendered .blend (no scene changes, read-only).
Usage: python events.py <file.blend> <out.json>
Events: footsteps (foot contacts), sword whooshes (blade-tip speed peaks), impacts (spark flashes),
thunder (scene['flash'] rises), camera cuts. Each carries global frame, distance-based gain and stereo pan."""
import sys, json, math
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

blend, out = sys.argv[1], sys.argv[2]
ORDER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']
events, offset, scenes = [], 0, []
for pre in ORDER:
    bpy.ops.wm.open_mainfile(filepath=blend)
    sc = next(s for s in bpy.data.scenes if s.name.startswith(pre + '_'))
    for o in list(bpy.data.scenes):      # only the active scene re-evaluates per frame
        if o != sc:
            bpy.data.scenes.remove(o)
    n = sc.frame_end
    scenes.append({'name': sc.name, 'start': offset, 'frames': n, 'cuts': sorted(m.frame for m in sc.timeline_markers)})
    base = lambda o: o.name.split('.')[0]   # Blender suffixes duplicate names across scenes (.001, .002)
    feet = [o for o in sc.objects if base(o).endswith(('_foot_L', '_foot_R')) and o.type == 'MESH']
    blades = [o for o in sc.objects if base(o).endswith(('_sword', '_knife', '_stick')) and o.type == 'MESH']
    flashes = [o for o in sc.objects if base(o).endswith('_flash') and o.type == 'MESH']
    st = {o.name: {'low': None, 'lift': 0.0} for o in feet}
    prev_tip, prev_flash, prev_fl = {}, {}, 0.0
    speeds = {o.name: [] for o in blades}

    def place(p, cam):
        v = world_to_camera_view(sc, cam, p)
        d = (cam.matrix_world.translation - p).length
        vis = 0 <= v.x <= 1 and 0 <= v.y <= 1 and v.z > 0
        return d, (v.x - 0.5) * 2, vis

    for f in range(1, n + 1):
        sc.frame_set(f)
        cam = sc.camera
        for o in feet:
            if o.hide_render or o.parent is None:
                continue
            r = o
            while r.parent:
                r = r.parent
            if r.hide_render or r.scale[0] == 0:
                continue
            z = o.matrix_world.translation.z
            s = st[o.name]
            s['low'] = z if s['low'] is None else min(s['low'] + 0.002, z)   # slowly forgetting ground estimate
            h = z - s['low']
            lifted = h > 0.05 * r.scale[0]
            if s['lift'] and not lifted:
                d, pan, vis = place(o.matrix_world.translation, cam)
                events.append({'t': 'step', 'f': offset + f, 'd': d, 'pan': pan, 'vis': vis, 'size': r.scale[0], 'who': base(r), 'scene': pre})
            s['lift'] = lifted
        for o in blades:
            if o.scale[0] == 0:
                continue
            tip = o.matrix_world @ Vector((0, 0, 0.9))
            if o.name in prev_tip:
                speeds[o.name].append((f, (tip - prev_tip[o.name]).length * 24, tip.copy()))
            prev_tip[o.name] = tip
        for o in flashes:
            s = o.matrix_world.to_scale().x
            if s > 0.01 and prev_flash.get(o.name, 0) <= 0.01:
                d, pan, vis = place(o.matrix_world.translation, cam)
                kind = 'wood' if ('chips' in o.name or 'clash' in o.name) else 'clang'
                events.append({'t': kind, 'f': offset + f, 'd': d, 'pan': pan, 'vis': vis, 'scene': pre, 'who': o.name})
            prev_flash[o.name] = s
        fl = float(sc.get('flash', 0.0))
        recent = any(e['t'] == 'thunder' and offset + f - e['f'] < 8 for e in events[-5:])
        if fl > 0.3 and prev_fl <= 0.3 and not recent:
            events.append({'t': 'thunder', 'f': offset + f, 'amt': fl, 'scene': pre})
        prev_fl = fl
    # whoosh at local speed maxima above threshold
    for name, sp in speeds.items():
        for i in range(1, len(sp) - 1):
            f, v, p = sp[i]
            if v > 7 and v >= sp[i - 1][1] and v > sp[i + 1][1]:
                sc.frame_set(f)
                d, pan, vis = place(p, sc.camera)
                events.append({'t': 'whoosh', 'f': offset + f, 'speed': v, 'd': d, 'pan': pan, 'vis': vis, 'scene': pre, 'who': name})
    offset += n
    print(pre, 'done', len(events), flush=True)
json.dump({'fps': 24, 'frames': offset, 'scenes': scenes, 'events': events}, open(out, 'w'), indent=1)
print('wrote', out, len(events))
