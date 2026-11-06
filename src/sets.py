"""Low-poly environment kit + animated effects (fire, rain, lightning, fog, smoke)."""
import math, random
import bpy
from mathutils import Vector
from ps1 import *


def sm():
    return dict(
        stone=mat('stone', 'stone', (0.85, 0.85, 0.95), scale=0.5),
        stone_dark=mat('stone_dark', 'stone', (0.45, 0.45, 0.55), scale=0.35, seed=2),
        roof=mat('roof', 'rock', (0.35, 0.35, 0.45), scale=0.4, seed=3),
        rock=mat('rock', 'rock', (0.8, 0.8, 0.85), scale=0.15),
        mud=mat('mud', 'mud', scale=0.4),
        grass=mat('grass', 'grass', scale=0.3),
        wood=mat('wood_set', 'wood', scale=1.0),
        thatch=mat('thatch', 'thatch', scale=0.7),
        bark=mat('bark', 'bark', scale=1.2),
        tile=mat('tile', 'tile', scale=0.4),
        win_warm=mat('win_warm', None, (0, 0, 0), emit=(1.0, 0.55, 0.15), emit_strength=3, fog=0.6),
        win_red=mat('win_red', None, (0, 0, 0), emit=(1.0, 0.15, 0.05), emit_strength=4, fog=0.5),
        glass=mat('glass', 'glass', (1, 1, 1), scale=1.2, emit=(0.0, 0.0, 0.0)),
        dark=mat('void', None, (0, 0, 0), fog=0.3),
        moon=mat('moon', None, (0, 0, 0), emit=(0.95, 0.95, 0.85), emit_strength=2.5, fog=0.0),
        red_cloth=mat('banner_red', 'cloth_red', scale=1.0),
        candle=mat('candle', None, (0.8, 0.75, 0.6)),
    )


# ---------------------------------------------------------------- terrain & rocks
def hfield(seed=0, amp=1.0, freq=0.08):
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(8)]

    def h(x, y):
        return amp * (math.sin(x * freq + ph[0]) * math.sin(y * freq * 1.3 + ph[1]) * 0.6 +
                      math.sin(x * freq * 2.7 + ph[2] + y * freq * 0.7) * 0.25 +
                      math.sin(y * freq * 3.9 + ph[3] - x * freq * 1.1) * 0.15)
    return h


def terrain(name, size, res, m, h=None, center=(0, 0), extra=None):
    """Flat-shaded grid. h(x,y)->z. extra(x,y,z)->z post-modifier (e.g. carve a path)."""
    h = h or (lambda x, y: 0.0)
    sx, sy = size if isinstance(size, tuple) else (size, size)
    nx, ny = res if isinstance(res, tuple) else (res, res)
    V, F = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = center[0] - sx / 2 + sx * i / nx; y = center[1] - sy / 2 + sy * j / ny
            z = h(x, y)
            if extra:
                z = extra(x, y, z)
            V.append((x, y, z))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            F.append((a, a + 1, a + nx + 2, a + nx + 1))
    return obj(name, [(V, F)], m)


def mountain(name, loc, r, h, m, seed=0, sides=9, snow=None):
    rnd = random.Random(seed)
    rings = [(0, r, r), (h * 0.35, r * 0.7, r * 0.72), (h * 0.7, r * 0.35, r * 0.33), (h * 0.92, r * 0.1, r * 0.12)]
    V, F = loft(rings, sides, cap=(False, False))
    V = [(x + rnd.uniform(-1, 1) * r * 0.12, y + rnd.uniform(-1, 1) * r * 0.12, z + (rnd.uniform(-1, 1) * h * 0.06 if z > 0 else 0)) for x, y, z in V]
    V.append((rnd.uniform(-1, 1) * r * 0.05, 0, h))
    top = len(V) - 1; k = 3 * sides
    F += [(k + i, k + (i + 1) % sides, top) for i in range(sides)]
    return obj(name, [(V, F)], m, loc=loc)


def rock(name, loc, s, m, seed=0):
    V, F = sphere(1.0, 6, 4)
    rnd = random.Random(seed)
    V = [(x * rnd.uniform(0.7, 1.2) * s, y * rnd.uniform(0.7, 1.2) * s, z * rnd.uniform(0.5, 0.9) * s) for x, y, z in V]
    return obj(name, [(V, F)], m, loc=loc, rot=(0, 0, rnd.uniform(0, 6)))


# ---------------------------------------------------------------- architecture
def crenels(cx, cy, z, rx, ry, n, size, mi, round_=False):
    out = []
    for i in range(n):
        if round_:
            a = 2 * math.pi * i / n
            out.append((*box(size, size, size * 1.2, (cx + rx * math.cos(a), cy + ry * math.sin(a), z + size * 0.6)), mi))
    return out


def tower(c, r, h, mi_wall, mi_roof, mi_win, spire=True, rnd=None, crenel=True, broken=0.0, windows=3):
    x, y, z = c
    rnd = rnd or random.Random(0)
    P = [(*loft([(z, r, r, x, y), (z + h * 0.85, r, r, x, y), (z + h * 0.88, r * 1.15, r * 1.15, x, y), (z + h, r * 1.15, r * 1.15, x, y)], 8), mi_wall)]
    if broken:
        P = [(*loft([(z, r, r, x, y), (z + h * (1 - broken), r, r, x, y)], 8), mi_wall)]
    elif crenel:
        P += crenels(x, y, z + h, r * 1.1, r * 1.1, 8, r * 0.35, mi_wall, round_=True)
    if spire and not broken:
        P.append((*cone(r * 1.2, h * 0.55, 8, (x, y, z + h)), mi_roof))
        P.append((*cone(0.08 * r, h * 0.12, 4, (x, y, z + h * 1.55)), mi_roof))
    for k in range(windows):
        a = rnd.uniform(0, 6.28); wz = z + h * rnd.uniform(0.3, 0.8) * (1 - broken)
        P.append((*box(r * 0.22, r * 0.22, r * 0.5, (x + math.cos(a) * r * 0.97, y + math.sin(a) * r * 0.97, wz)), mi_win))
    return P


def castle(name, loc, s, mats, ruined=False, seed=1, evil=False):
    """Gothic castle (refs 2 & 5): keep, round towers, needle spires, lit windows. One mesh."""
    rnd = random.Random(seed)
    W, RF, WN, DK = 0, 1, 2, 3
    P = []
    # keep
    kh = 26
    P.append((*box(11, 11, kh, (0, 0, kh / 2)), W))
    P += [(*box(1.2, 1.2, 1.5, (x, y, kh + 0.6)), W) for x in (-5, -2.5, 0, 2.5, 5) for y in (-5.2, 5.2)]
    if not ruined:
        P.append((*loft([(kh, 6.3, 6.3), (kh + 14, 0.3, 0.3)], 4, phase=math.pi / 4), RF))
        for dx, dy, hh in ((-4, -4, 12), (4, -4, 15), (-4, 4, 10), (4, 4, 13), (0, -5.5, 9)):
            P.append((*cone(0.9, hh, 6, (dx, dy, kh)), RF))
    for k in range(10):
        f = rnd.choice((-1, 1))
        P.append((*box(0.7, 0.3, 1.6, (rnd.uniform(-4, 4), -5.55, rnd.uniform(6, kh - 3))), WN))
        P.append((*box(0.3, 0.7, 1.6, (f * 5.55, rnd.uniform(-4, 4), rnd.uniform(6, kh - 3))), WN))
    # towers
    corners = [(-12, -12), (12, -12), (-12, 12), (12, 12), (0, -16)]
    for i, (tx, ty) in enumerate(corners):
        th = rnd.uniform(26, 34) if i < 4 else 20
        br = rnd.uniform(0.25, 0.5) if (ruined and rnd.random() < 0.6) else 0.0
        P += tower((tx, ty, 0), 3.2 if i < 4 else 2.4, th, W, RF, WN, spire=True, rnd=rnd, broken=br, windows=4)
    # curtain walls
    for (a, b) in ((0, 1), (0, 2), (1, 3), (2, 3)):
        (x0, y0), (x1, y1) = corners[a], corners[b]
        L = math.hypot(x1 - x0, y1 - y0)
        P.append((xf(box(L, 2.5, 13, (0, 0, 6.5))[0], loc=((x0 + x1) / 2, (y0 + y1) / 2, 0), rot=(0, 0, math.atan2(y1 - y0, x1 - x0))), box(1, 1, 1)[1], W))
        for k in range(int(L / 2.5)):
            if ruined and rnd.random() < 0.4:
                continue
            t = (k + 0.5) / int(L / 2.5)
            P.append((*box(1.1, 1.1, 1.3, (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 13.6)), W))
    # gate
    P.append((*box(4, 0.6, 7, (0, -13.4, 3.5)), DK))
    o = obj(name, P, [mats['stone'], mats['roof'], mats['win_red'] if evil else mats['win_warm'], mats['dark']], loc=loc, scale=(s, s, s))
    return o


def house(name, loc, rot, mats, w=5, d=4, h=3, seed=0, lit=True, roofmat='thatch'):
    rnd = random.Random(seed)
    P = [(*box(w, d, h, (0, 0, h / 2)), 0)]
    rh = h * 0.7
    V = [(-w / 2 - 0.4, -d / 2 - 0.4, h), (w / 2 + 0.4, -d / 2 - 0.4, h), (w / 2 + 0.4, d / 2 + 0.4, h), (-w / 2 - 0.4, d / 2 + 0.4, h),
         (-w / 2 - 0.4, 0, h + rh), (w / 2 + 0.4, 0, h + rh)]
    F = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5)]
    P.append((V, F, 1))
    P.append((*box(0.9, 0.1, 1.8, (rnd.uniform(-1, 1), -d / 2 - 0.02, 0.9)), 3))
    if lit:
        P.append((*box(0.7, 0.1, 0.6, (w / 2 - 1.0, -d / 2 - 0.03, h * 0.6)), 2))
    P.append((*box(0.5, 0.5, rh + 1.2, (w / 3, d / 4, h + rh / 2)), 4))   # chimney
    for x in (-w / 2, w / 2):
        P.append((*box(0.25, 0.25, h, (x, -d / 2 - 0.05, h / 2)), 3))         # timber frame
    return obj(name, P, [mats['wood'], mats[roofmat], mats['win_warm'], mats['dark'], mats['stone']], loc=loc, rot=(0, 0, R(rot)))


def dead_tree(name, loc, h, m, seed=0, lean=0.0):
    rnd = random.Random(seed)
    P = []

    def branch(p0, d, L, r, depth):
        pts = [Vector(p0)]
        dd = Vector(d).normalized()
        for k in range(3):
            dd = (dd + Vector((rnd.uniform(-0.35, 0.35), rnd.uniform(-0.35, 0.35), rnd.uniform(-0.1, 0.2)))).normalized()
            pts.append(pts[-1] + dd * L / 3)
        P.append((*tube([tuple(p) for p in pts], [r, r * 0.8, r * 0.55, r * 0.15], 5), 0))
        if depth > 0:
            for k in range(rnd.randint(2, 3)):
                i = rnd.randint(1, 2)
                nd = dd + Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(0.0, 0.6)))
                branch(tuple(pts[i]), nd, L * rnd.uniform(0.45, 0.65), r * 0.45, depth - 1)
    branch((0, 0, -0.3), (lean, 0, 1), h * 0.6, h * 0.045, 2)
    for k in range(4):   # roots
        a = k * 1.57 + rnd.uniform(-0.4, 0.4)
        P.append((*tube([(0, 0, 0.4), (math.cos(a) * h * 0.08, math.sin(a) * h * 0.08, 0.05), (math.cos(a) * h * 0.15, math.sin(a) * h * 0.15, -0.15)],
                        [h * 0.035, h * 0.02, h * 0.005], 4), 0))
    return obj(name, P, [m], loc=loc, rot=(0, 0, rnd.uniform(0, 6)))


def grave(name, loc, m, seed=0, kind='stone'):
    rnd = random.Random(seed)
    if kind == 'cross':
        P = [(*box(0.15, 0.15, 1.3, (0, 0, 0.55)), 0), (*box(0.7, 0.15, 0.15, (0, 0, 0.9)), 0)]
    else:
        P = [(*loft([(-0.2, 0.32, 0.1), (0.75, 0.32, 0.1), (0.95, 0.15, 0.1)], 4, phase=math.pi / 4), 0)]
    return obj(name, P, [m], loc=loc, rot=(rnd.uniform(-0.15, 0.15), rnd.uniform(-0.15, 0.15), rnd.uniform(-0.3, 0.3)))


def fence(name, p0, p1, m, n=None):
    p0, p1 = Vector(p0), Vector(p1)
    L = (p1 - p0).length; n = n or int(L / 1.2)
    P = [(*box(0.15, 0.15, 1.2, tuple(p0.lerp(p1, i / n) + Vector((0, 0, 0.5)))), 0) for i in range(n + 1)]
    ang = math.atan2(p1.y - p0.y, p1.x - p0.x)
    for z in (0.5, 0.95):
        P.append((xf(box(L, 0.08, 0.12)[0], loc=tuple((p0 + p1) / 2 + Vector((0, 0, z))), rot=(0, 0, ang)), box(1, 1, 1)[1], 0))
    return obj(name, P, [m])


# ---------------------------------------------------------------- effects
_FIRE = None


def fire(name, loc, size, f0, f1, seed=0, light_energy=200, smoke=True, shadow=False):
    rnd = random.Random(seed)
    m1 = glow_mat('flame_o', (1.0, 0.35, 0.05), 3.0)
    m2 = glow_mat('flame_y', (1.0, 0.75, 0.25), 4.0)
    out = []
    for i in range(5):
        r = size * rnd.uniform(0.25, 0.4)
        o = obj(f'{name}_fl{i}', [(*cone(r, size * rnd.uniform(0.8, 1.4), 4), 0)], [m1 if i % 2 else m2],
                loc=(loc[0] + rnd.uniform(-1, 1) * size * 0.25, loc[1] + rnd.uniform(-1, 1) * size * 0.25, loc[2]))
        ph = rnd.uniform(0, 9)
        for f in range(f0, f1 + 1, 2):
            k = 0.65 + 0.35 * math.sin(f * 0.9 + ph) * math.sin(f * 0.37 + ph * 2) + rnd.uniform(-0.1, 0.1)
            o.scale = (1 + 0.2 * math.sin(f * 0.5 + ph), 1 + 0.2 * math.cos(f * 0.6 + ph), k * 1.2)
            o.rotation_euler = (0, 0, f * 0.15 + ph)
            o.keyframe_insert('scale', frame=f); o.keyframe_insert('rotation_euler', frame=f)
        out.append(o)
    L = light(name + '_light', 'POINT', (loc[0], loc[1], loc[2] + size * 0.8), (1.0, 0.5, 0.18), light_energy, shadow=shadow, size=0.3)
    for f in range(f0, f1 + 1, 2):
        L.data.energy = light_energy * (0.75 + 0.25 * math.sin(f * 1.3) * math.sin(f * 0.47 + 1))
        L.data.keyframe_insert('energy', frame=f)
    out.append(L)
    if smoke:
        sm_m = dark_mat('smoke', (0.05, 0.05, 0.06), 0.35)
        for i in range(5):
            o = obj(f'{name}_sm{i}', [(*sphere(size * 0.5, 6, 4), 0)], [sm_m])
            ph = i / 5
            for f in range(f0, f1 + 1, 2):
                t = ((f - f0) / 48 + ph) % 1.0
                o.location = (loc[0] + t * size * 1.5, loc[1] + math.sin(t * 6 + i) * size * 0.4, loc[2] + size + t * size * 5)
                s = 0.5 + t * 2.0 if t < 0.85 else (1 - t) * 15
                o.scale = (s, s, s)
                o.keyframe_insert('location', frame=f); o.keyframe_insert('scale', frame=f)
            out.append(o)
    return out


def rain(name, center, size, count, f0, f1, speed=14.0, seed=0, color=(0.45, 0.5, 0.6), strength=0.5, slant=0.15):
    rnd = random.Random(seed)
    m = mat('rain', None, (0, 0, 0), emit=color, emit_strength=strength, fog=0.8)   # opaque: blended rain was 70% of render time
    sx, sy, sz = size
    objs = []
    for layer in range(2):
        V, F = [], []
        for i in range(count // 2):
            x, y, z = rnd.uniform(-sx / 2, sx / 2), rnd.uniform(-sy / 2, sy / 2), rnd.uniform(0, sz)
            L = rnd.uniform(0.5, 0.9)
            for (dx, dy) in ((0.012, 0), (0, 0.012)):
                k = len(V)
                V += [(x - dx, y - dy, z), (x + dx, y + dy, z), (x + dx + slant * L, y + dy, z + L), (x - dx + slant * L, y - dy, z + L)]
                F.append((k, k + 1, k + 2, k + 3))
        o = obj(f'{name}{layer}', [(V, F)], [m])
        for f in range(f0, f1 + 1):
            o.location = (center[0] - slant * ((f * speed / 24 + layer * sz / 2) % sz), center[1], center[2] - ((f * speed / 24 + layer * sz / 2) % sz))
            o.keyframe_insert('location', frame=f)
        objs.append(o)
    return objs


def bolt(name, p0, p1, frames, color=(0.85, 0.8, 1.0), seed=0, width=0.25, branches=2):
    """Jagged lightning strip; visible only on given frames (scale toggled)."""
    rnd = random.Random(seed)
    m = glow_mat('bolt_' + str(color), color, 6.0)
    P = []

    def strip(a, b, n, w):
        a, b = Vector(a), Vector(b)
        pts = [a.lerp(b, i / n) + (Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), 0)) * (b - a).length * 0.06 if 0 < i < n else Vector()) for i in range(n + 1)]
        for q0, q1 in zip(pts, pts[1:]):
            P.append(([tuple(q0 + Vector((-w, 0, 0))), tuple(q0 + Vector((w, 0, 0))), tuple(q1 + Vector((w * 0.8, 0, 0))), tuple(q1 + Vector((-w * 0.8, 0, 0)))], [(0, 1, 2, 3)], 0))
            P.append(([tuple(q0 + Vector((0, -w, 0))), tuple(q0 + Vector((0, w, 0))), tuple(q1 + Vector((0, w * 0.8, 0))), tuple(q1 + Vector((0, -w * 0.8, 0)))], [(0, 1, 2, 3)], 0))
        return pts
    pts = strip(p0, p1, 9, width)
    for k in range(branches):
        q = pts[rnd.randint(2, 6)]
        strip(q, q + Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), -1)) * (Vector(p1) - Vector(p0)).length * 0.3, 4, width * 0.6)
    o = obj(name, P, [m])
    vis = set()
    for f in frames:
        vis.update((f, f + 2, f + 3))
    lo, hi = min(vis) - 1, max(vis) + 1
    for f in range(max(1, lo), hi + 2):
        o.scale = (1, 1, 1) if f in vis else (0, 0, 0)
        o.keyframe_insert('scale', frame=f)
    if lo > 1:
        o.scale = (0, 0, 0); o.keyframe_insert('scale', frame=1)
    return o


def fog_sheet(name, loc, size, color, strength, f0, f1, drift=(0.5, 0, 0), seed=0, n=3, dz=0.6, scale=0.08):
    m = glow_mat(f'fog_{name}', color, strength, alpha_tex='fog', scale=scale)
    out = []
    for i in range(n):
        o = obj(f'{name}{i}', [quad(size[0], size[1], (0, 0, 0), axis='XY')], [m], loc=(loc[0], loc[1], loc[2] + i * dz))
        for f in (f0, f1):
            t = f - f0
            o.location = (loc[0] + drift[0] * t / 24 * (1 + i * 0.4), loc[1] + drift[1] * t / 24, loc[2] + i * dz)
            o.keyframe_insert('location', frame=f)
        out.append(o)
    return out


def linear(objs):
    """Make every keyed curve on these objects linear (constant-speed drift)."""
    for o in objs:
        ad = o.animation_data
        if not ad or not ad.action:
            continue
        for layer in ad.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'LINEAR'


def billboard_glow(name, loc, r, color, strength, parent=None):
    return obj(name, [(*sphere(r, 6, 4), 0)], [glow_mat(f'glow_{name}', color, strength)], loc=loc, parent=parent)


def moon(loc, r, mats, face=None):
    o = obj('moon', [(*sphere(r, 10, 6), 0)], [mats['moon']], loc=loc)
    billboard_glow('moon_halo', loc, r * 1.8, (0.5, 0.55, 0.7), 0.25)
    return o
