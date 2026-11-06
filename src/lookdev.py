"""Turntable contact sheet of the cast in key poses (for inspection)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from cast import *

out = sys.argv[-1]
sc = new_scene('LOOKDEV', 1, fog=(0.12, 0.12, 0.15), near=30, far=200, ambient=(0.25, 0.25, 0.3), sky_top=(0.05, 0.05, 0.07))
sc.render.resolution_x, sc.render.resolution_y = 640, 640
m = M()
obj('floor', box(40, 40, 0.1, (0, 0, -0.05)), mat('fl', 'stone', scale=0.5))
light('key', 'SUN', rot=(R(55), 0, R(-35)), energy=3.0)
light('rim', 'SUN', rot=(R(60), 0, R(160)), energy=1.5, shadow=False)
poses = {'idle': base_pose(), 'guard': GUARD, 'windup': WINDUP, 'strike': STRIKE, 'block': BLOCK, 'kneel': KNEEL, 'walk': walk(0.25), 'run': run(0.25)}
which = os.environ.get('POSES', 'idle,guard,windup,strike,block,kneel,walk,run').split(',')
for i, pn in enumerate(which):
    k = knight(f'K{i}', m)
    arm_knight(k, m)
    bake(k, 1, 1, lambda f, p=poses[pn]: p, start=(i * 1.8, 0))
extra = os.environ.get('EXTRA', '')
x = len(which) * 1.8 + 1
for j, kind in enumerate(filter(None, extra.split(','))):
    if kind == 'dragon':
        d = dragon('D', m['scales'], m['belly'], m['wing'], m['horn'], m['eye_red'], scale=0.5, loc=(x + 3, 2, 1.0))
        d.set(dragon_pose(1, flap=0.0, fold=float(os.environ.get('FOLD', '1'))), 1); x += 7; continue
    if kind == 'beast':
        b = beast('B', mat('beastskin', 'goblin', (0.6, 0.5, 0.5), scale=1.0), m['horn'], m['eye_red'], m['dark'], scale=0.8, loc=(x + 1.5, 0, 1.15)); x += 4; continue
    if kind == 'wraith':
        wraith('W', m['cloak'], m['bone'], m['eye_green'], loc=(x, 0, 0.4)); x += 2; continue
    fn = dict(child=lambda n: knight(n, m, 'child'), teen=lambda n: knight(n, m, 'teen'), old=lambda n: knight(n, m, 'old'),
              soldier=lambda n: soldier(n, m), undead=lambda n: undead(n, m), goblin=lambda n: goblin(n, m),
              demon=lambda n: demon(n, m, scale=1.4), skeleton=lambda n: giant_skeleton(n, m, scale=1.2), trainer=lambda n: trainer(n, m),
              king=lambda n: king(n, m), villager=lambda n: villager(n, m))[kind]
    r = fn(f'X{j}')
    bake(r, 1, 1, lambda f: base_pose(), start=(x, 0))
    x += 1.6 if kind not in ('demon', 'skeleton') else 2.5
sc.render.resolution_x, sc.render.resolution_y = 240, 360
targets = [o for o in sc.objects if o.parent is None and o.type == 'EMPTY' and o.name not in ('LOOKDEV',)]
c, t = camera('cam', 50); sc.camera = c
tiles = []
for o in targets:
    h = o.scale[0] * 2.0 if o.name[0] not in 'DB' else 3.5
    for view, (dx, dy) in {'front': (0, -1), 'side': (1, 0), 'back': (0.3, 1)}.items():
        if view not in os.environ.get('VIEWS', 'front,side,back'):
            continue
        d = h * 2.6
        cen = o.location
        c.location = (cen.x + dx * d, cen.y + dy * d, h * 0.5 + 0.4); t.location = (cen.x, cen.y, h * 0.48)
        fp = f'{out}_{o.name}_{view}.png'; sc.render.filepath = fp
        # hide others for clean silhouettes
        for o2 in targets:
            for ch in [o2] + list(o2.children_recursive):
                ch.hide_render = o2 is not o
        bpy.ops.render.render(write_still=True, scene=sc.name)
        tiles.append(fp)
open(out + '_list.txt', 'w').write('\n'.join(tiles))
