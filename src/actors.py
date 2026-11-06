"""Rigid segmented PS1-style characters & creatures, procedural poses and a baker with grounding,
foot-locked locomotion and secondary motion (BBL spring jiggle, cape, plume)."""
import math, random
import bpy
from mathutils import Vector, Matrix, Euler
from ps1 import *

B, A, C, D, E, S, H, G = range(8)   # material slots: body, armor, cloth, dark, eyes, skin, hair, gold
SEG = dict(hip_off=0.08, thigh=0.45, shin=0.45, foot=0.07, torso=0.57, ua=0.3, fa=0.27, sh_x=0.24, sh_z=0.47, leg_x=0.1)


class Rig:
    def __init__(self, name, root, parts, scale, seg, kind='humanoid'):
        self.name, self.root, self.p, self.scale, self.seg, self.kind = name, root, parts, scale, seg, kind
        self.track = []        # baked world root positions per frame
        self.extra = []        # objects to hide/show with the rig

    def set(self, pose, f):
        for pn, o in self.p.items():
            r = pose.get(pn)
            if r is None:
                continue
            o.rotation_euler = (R(r[0]), R(r[1]), R(r[2]))
            o.keyframe_insert('rotation_euler', frame=f)

    def world(self, pn):
        return self.p[pn].matrix_world.translation.copy()


# ---------------------------------------------------------------- humanoid geometry
def _head(kind, look):
    P = []
    hm = look.get('head_scale', 1.0)

    def hs(parts):
        return [(xf(v, scale=(hm,) * 3), f, *m) for (v, f, *m) in parts]

    skin = S
    human = loft([(0.0, 0.055, 0.055), (0.06, 0.085, 0.095), (0.15, 0.095, 0.11), (0.23, 0.085, 0.1), (0.28, 0.04, 0.05)], 8)
    eyes = [(*box(0.03, 0.01, 0.018, (x, -0.1, 0.15)), D) for x in (-0.035, 0.035)]
    if kind in ('human', 'kettle', 'crown', 'bald', 'child'):
        P += [(*human, skin), *eyes]
        P.append((xf(cone(0.018, 0.045, 4)[0], loc=(0, -0.095, 0.12), rot=(R(90), 0, 0)), cone(0.018, 0.045, 4)[1], skin))
        if kind in ('human', 'child'):
            P.append((*loft([(0.13, 0.1, 0.115, 0, 0.01), (0.22, 0.095, 0.11, 0, 0.01), (0.3, 0.05, 0.06, 0, 0.01)], 8), H))
            P.append((*box(0.17, 0.05, 0.12, (0, 0.085, 0.13)), H))
        if look.get('beard'):
            P.append((*loft([(0.13, 0.08, 0.06, 0, -0.06), (0.05, 0.07, 0.05, 0, -0.08), (-0.06, 0.03, 0.03, 0, -0.07)], 6), H))
        if kind == 'kettle':
            P.append((*loft([(0.19, 0.17, 0.17), (0.2, 0.17, 0.17), (0.22, 0.1, 0.11), (0.31, 0.09, 0.1), (0.33, 0.03, 0.03)], 8), A))
        if kind == 'crown':
            P.append((*loft([(0.2, 0.1, 0.11), (0.27, 0.1, 0.11)], 8, cap=(False, False)), G))
            for i in range(6):
                a = 2 * math.pi * i / 6
                P.append((*cone(0.025, 0.07, 4, (0.1 * math.cos(a), 0.11 * math.sin(a), 0.27)), G))
            P.append((*loft([(0.13, 0.1, 0.115), (0.29, 0.06, 0.07)], 8), H))
    elif kind == 'great':   # the hero's bucket helm (ref image 1) with crimson crest
        P.append((*loft([(-0.02, 0.12, 0.13), (0.1, 0.135, 0.145), (0.24, 0.13, 0.14), (0.31, 0.11, 0.12), (0.33, 0.03, 0.04)], 8, phase=0), A))
        P.append((*box(0.2, 0.03, 0.025, (0, -0.135, 0.17)), D))                 # eye slit
        P.append((*box(0.03, 0.03, 0.2, (0, -0.145, 0.1)), G))                   # nasal strip
        for x in (-0.06, -0.03, 0.03, 0.06):
            P.append((*box(0.012, 0.03, 0.012, (x, -0.135, 0.07)), D))          # breaths
        P.append((*loft([(0.15, 0.137, 0.147), (0.18, 0.137, 0.147)], 8, cap=(False, False), phase=0), G))
    elif kind in ('skull', 'giant_skull'):
        P.append((*loft([(0.03, 0.06, 0.07, 0, -0.02), (0.1, 0.09, 0.1), (0.2, 0.1, 0.115), (0.27, 0.07, 0.08), (0.3, 0.02, 0.02)], 7), B))
        P += [(*box(0.045, 0.02, 0.04, (x, -0.1, 0.14)), D) for x in (-0.04, 0.04)]
        P += [(*box(0.02, 0.02, 0.02, (x, -0.108, 0.14)), E) for x in (-0.04, 0.04)]
        P.append((*box(0.1, 0.06, 0.03, (0, -0.07, 0.04)), B))   # teeth row
        if look.get('helm'):
            P.append((*loft([(0.14, 0.125, 0.135), (0.25, 0.12, 0.13), (0.32, 0.03, 0.03)], 6), A))
    elif kind == 'goblin':
        P.append((*loft([(0.0, 0.07, 0.07), (0.08, 0.13, 0.12, 0, -0.03), (0.17, 0.13, 0.12, 0, -0.01), (0.25, 0.09, 0.09), (0.28, 0.03, 0.03)], 7), S))
        P.append((*tube([(0, -0.1, 0.13), (0, -0.2, 0.1), (0, -0.25, 0.05)], [0.035, 0.025, 0.006], 4), S))       # nose
        for sx in (-1, 1):
            P.append((*tube([(sx * 0.11, 0, 0.17), (sx * 0.24, 0.04, 0.22), (sx * 0.36, 0.08, 0.3)], [0.04, 0.025, 0.003], 3), S))  # ears
            P.append((*box(0.035, 0.02, 0.025, (sx * 0.05, -0.14, 0.17)), E))
        P.append((*box(0.12, 0.03, 0.025, (0, -0.15, 0.05)), G))   # teeth
    elif kind == 'demon':
        P.append((*loft([(0.0, 0.07, 0.07), (0.07, 0.1, 0.12, 0, -0.04), (0.17, 0.11, 0.12), (0.26, 0.08, 0.09), (0.3, 0.02, 0.03)], 7), S))
        P.append((*loft([(0.0, 0.07, 0.04, 0, -0.12), (0.06, 0.08, 0.05, 0, -0.12)], 5), S))      # jaw jut
        for sx in (-1, 1):
            P.append((*box(0.04, 0.02, 0.02, (sx * 0.045, -0.13, 0.16)), E))
            P.append((*tube([(sx * 0.08, 0, 0.22), (sx * 0.22, 0.05, 0.33), (sx * 0.3, 0.15, 0.48), (sx * 0.26, 0.27, 0.62), (sx * 0.18, 0.3, 0.7)],
                            [0.05, 0.042, 0.032, 0.02, 0.004], 5), H))
    return hs(P)


def humanoid(name, look, scale=1.0, seg=None, loc=(0, 0, 0), heading=0.0):
    """look: dict of materials & flags. Builds rigid parts parented in a hierarchy."""
    Sg = dict(SEG); Sg.update(seg or {})
    th = look.get('thin', 1.0); bulk = look.get('bulk', 1.0)
    armored = look.get('armor') is not None
    mats = [look.get(k) or look['body'] for k in ('body', 'armor', 'cloth', 'dark', 'eyes', 'skin', 'hair', 'gold')]
    root = empty(name, loc); root.scale = (scale,) * 3; root.rotation_euler = (0, 0, R(heading))
    P = {}

    def part(pn, parts, parent, l, sm=False):
        o = obj(f"{name}_{pn}", parts, mats, parent=parent, loc=l, smooth=sm)
        P[pn] = o
        return o

    bbl = look.get('bbl', 0.11)
    ex = max(0.0, bbl - 0.11)
    skel = look.get('skeleton', False)
    hip_main = A if armored else C
    # hips / pelvis
    hp = [(*loft([(-0.12, 0.15 + ex * 0.45, 0.1), (0.0, 0.17 + ex * 0.45, 0.12), (0.1, 0.155, 0.105)], 8), B if skel else hip_main)]
    if skel:
        hp = [(*loft([(-0.1, 0.16, 0.07), (0.05, 0.12, 0.06)], 6), B), (*tube([(0, 0.02, 0.0), (0, 0.03, 0.12)], 0.035, 4), B)]
    if look.get('belt', armored):
        hp.append((*loft([(0.03, 0.172 + ex * 0.45, 0.124), (0.09, 0.16, 0.11)], 8, cap=(False, False)), D))
    if look.get('tabard'):
        hp.append((xf(quad(0.26, 0.5, (0, 0, -0.5))[0], loc=(0, -0.13, 0.0)), [(0, 1, 2, 3)], C))
    if look.get('robe'):
        hp.append((*loft([(0.08, 0.17, 0.13), (-0.4, 0.26, 0.24), (-0.98, 0.34, 0.32)], 10, cap=(False, True)), C))
    hips = part('hips', hp, root, (0, 0, 0))
    # glutes (the knight's signature silhouette: armored culet over an exaggerated BBL)
    for sx, sd in ((1, 'L'), (-1, 'R')):
        if skel:
            continue
        gm = A if (armored and look.get('culet', True)) else (C if look.get('cloth') else B)
        gp = [(*sphere(bbl, 8, 6, (0, 0, 0), sy=1.12, sz=0.95), gm)]
        if armored and look.get('culet', True):
            gp.append((*loft([(0.02, bbl * 1.03, bbl * 1.15), (0.05, bbl * 1.02, bbl * 1.14)], 8, cap=(False, False)), G))
        part('glute_' + sd, gp, hips, (sx * (0.075 + ex * 0.25), 0.05 + bbl * 0.42, -0.07), sm=True)
    # torso
    tr = [(0.0, 0.15, 0.1), (0.12, 0.155, 0.105), (0.3, 0.205, 0.13), (0.45, 0.225, 0.13), (0.53, 0.16, 0.1), (0.57, 0.07, 0.06)]
    tr = [(z, rx * bulk, ry * bulk) for z, rx, ry in tr]
    if skel:
        tp = [(*tube([(0, 0.04, 0), (0, 0.05, 0.25), (0, 0.04, 0.57)], 0.035, 4), B)]
        for i, z in enumerate((0.22, 0.29, 0.36, 0.43, 0.5)):
            w = 0.13 + 0.05 * math.sin(i / 4 * math.pi)
            for sx in (-1, 1):
                tp.append((*tube([(0, 0.05, z), (sx * w, 0.02, z - 0.02), (sx * w * 0.9, -0.08, z - 0.05), (sx * 0.02, -0.1, z - 0.07)], 0.014, 3), B))
        tp.append((*box(0.03, 0.03, 0.25, (0, -0.1, 0.38)), B))
    else:
        tp = [(*loft(tr, 8, phase=0), A if armored else C)]
        if look.get('tabard'):
            tp.append((*loft([(-0.01, 0.158, 0.108), (0.26, 0.21, 0.135)], 8, cap=(False, False), phase=0), C))
        if look.get('chainmail'):
            tp.append((*loft([(0.47, 0.2, 0.12), (0.58, 0.1, 0.08)], 8), D))
        if look.get('cracks'):
            tp.append((*box(0.12, 0.02, 0.03, (0.05, -0.135, 0.35)), D))
    torso = part('torso', tp, hips, (0, 0, 0.1))
    # head
    hk = look.get('head', 'human')
    neck = [(*loft([(0.0, 0.05 * th, 0.05 * th), (0.08, 0.05 * th, 0.05 * th)], 6), B if skel else S)]
    head = part('head', neck + [(xf(v, loc=(0, 0, 0.06)), f, *m) for v, f, *m in _head(hk, look)], torso, (0, 0, Sg['torso']), sm=False)
    if look.get('plume'):
        pl = tube([(0, 0.0, 0.0), (0, 0.08, 0.06), (0, 0.2, 0.05), (0, 0.32, -0.04), (0, 0.4, -0.15)], [0.035, 0.045, 0.04, 0.03, 0.01], 4)
        part('plume', [(*pl, C)], head, (0, -0.06, 0.38))
    # arms
    for sx, sd in ((1, 'L'), (-1, 'R')):
        ua = [(*loft([(0.0, 0.075 * th * bulk, 0.075 * th), (-0.15, 0.068 * th * bulk, 0.068 * th), (-Sg['ua'], 0.058 * th, 0.058 * th)], 6), B if skel else (A if armored else look.get('sleeve', C)))]
        if armored:
            ua.append((*sphere(0.13 * bulk, 6, 4, (sx * 0.025, 0, -0.03), sz=0.75), A))
            ua.append((*loft([(-0.04, 0.135 * bulk, 0.135), (-0.1, 0.12 * bulk, 0.12)], 6, cap=(False, False)), G))
        up = part('upper_arm_' + sd, ua, torso, (sx * Sg['sh_x'] * bulk, 0, Sg['sh_z']))
        fa = [(*loft([(0.0, 0.058 * th, 0.058 * th), (-Sg['fa'] * 0.6, 0.06 * th, 0.06 * th), (-Sg['fa'], 0.045 * th, 0.045 * th)], 6), B if skel else (A if armored else look.get('sleeve_lo', S)))]
        if armored:
            fa.append((*loft([(-0.13, 0.065, 0.065), (-Sg['fa'], 0.08, 0.075)], 6, cap=(False, False)), A))
            fa.append((*sphere(0.07, 6, 4, (0, 0.03, 0)), A))
        lo = part('forearm_' + sd, fa, up, (0, 0, -Sg['ua']))
        hand = [(*box(0.075 * th + 0.01, 0.1, 0.11, (0, -0.01, -0.055)), A if armored and not skel else (B if skel else S))]
        if look.get('claws'):
            for k in range(3):
                hand.append((*tube([(-0.025 + k * 0.025, -0.04, -0.1), (-0.025 + k * 0.025, -0.08, -0.17)], [0.012, 0.002], 3), H))
        part('hand_' + sd, hand, lo, (0, 0, -Sg['fa']))
    # legs
    rt = 0.085 * bulk + ex * 0.35
    for sx, sd in ((1, 'L'), (-1, 'R')):
        tm = B if skel else (A if armored else look.get('legs', C))
        tg = [(*loft([(0.0, rt * th, rt * th), (-0.25, 0.075 * th * bulk, 0.08 * th), (-Sg['thigh'], 0.06 * th, 0.065 * th)], 6), tm)]
        if armored:
            tg.append((*sphere(0.075, 6, 4, (0, -0.05, -Sg['thigh'])), A))
            tv, tf = loft([(0, 0.1, 0.025), (-0.2, 0.11, 0.025)], 4)
            tg.append((xf(tv, loc=(sx * 0.02, -0.095, 0.0), rot=(R(8), 0, 0)), tf, A))   # tasset
        th_o = part('thigh_' + sd, tg, hips, (sx * Sg['leg_x'] * (1 + ex * 1.2), 0, -Sg['hip_off']))
        sm = B if skel else (A if armored else look.get('legs', C))
        sh = [(*loft([(0.0, 0.058 * th, 0.062 * th), (-0.18, 0.065 * th, 0.07 * th), (-Sg['shin'], 0.045 * th, 0.05 * th)], 6), sm)]
        sh_o = part('shin_' + sd, sh, th_o, (0, 0, -Sg['thigh']))
        fm = B if skel else (A if armored else look.get('boots', D))
        ft = [(*box(0.1 * th + 0.02, 0.24, Sg['foot'], (0, -0.06, -Sg['foot'] / 2)), fm)]
        if look.get('hooves'):
            ft = [(*box(0.12, 0.16, Sg['foot'], (0, -0.04, -Sg['foot'] / 2)), H)]
        part('foot_' + sd, ft, sh_o, (0, 0, -Sg['shin']))
    # cape
    if look.get('cape'):
        cm = look['cape']
        par, ln = torso, (0, 0.11 * bulk, 0.52)
        w0 = 0.42 * bulk
        nseg = look.get('cape_segs', 3)
        tattered = look.get('torn', False)
        for i in range(nseg):
            w1 = w0 + 0.09
            L = look.get('cape_len', 0.34)
            V = [(-w0 / 2, 0, 0), (w0 / 2, 0, 0), (w1 / 2, 0, -L), (-w1 / 2, 0, -L)]
            if tattered and i == nseg - 1:
                V = [(-w0 / 2, 0, 0), (w0 / 2, 0, 0), (w1 / 2, 0, -L * 0.7), (w1 / 4, 0, -L), (0, 0, -L * 0.6), (-w1 / 4, 0, -L * 0.95), (-w1 / 2, 0, -L * 0.75)]
                F = [tuple(range(len(V)))]
            else:
                F = [(0, 1, 2, 3)]
            par = part(f'cape{i}', [(V, F, 0)], par, ln)
            par.data.materials[0] = cm
            ln = (0, 0, -L)
            w0 = w1
    rig = Rig(name, root, P, scale, Sg)
    for o in P.values():
        if look.get('wobble', True):
            wobble(o, 0.012)
    return rig


# ---------------------------------------------------------------- props
def sword(name, m_blade, m_hilt, m_grip, length=0.85, broken=False, wooden=False):
    bl = length * (0.45 if broken else 1.0)
    parts = [(*box(0.035, 0.035, 0.18, (0, 0, 0.0)), 2), (*sphere(0.035, 5, 3, (0, 0, -0.1)), 1),
             (*box(0.26 if not wooden else 0.16, 0.04, 0.04, (0, 0, 0.1)), 1)]
    if broken:
        parts.append((*loft([(0.12, 0.03, 0.008), (0.12 + bl, 0.026, 0.006)], 4, phase=0), 0))
    else:
        parts.append((*loft([(0.12, 0.032, 0.009), (0.12 + bl * 0.9, 0.024, 0.007), (0.12 + bl, 0.002, 0.002)], 4, phase=0), 0))
    return obj(name, parts, [m_blade, m_hilt, m_grip])


def shield(name, m_face, m_rim):
    pts = [(-0.27, 0.36), (0.27, 0.36), (0.26, 0.05), (0.18, -0.18), (0.0, -0.36), (-0.18, -0.18), (-0.26, 0.05)]
    n = len(pts)
    V = [(x, -0.02, z) for x, z in pts] + [(x, 0.03, z) for x, z in pts]
    rim = [tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return obj(name, [(V, [tuple(reversed(range(n)))], 0), (V, rim, 1), (*sphere(0.06, 6, 4, (0, -0.03, 0.05), sy=0.5), 1)], [m_face, m_rim])


def spear(name, m_wood, m_tip):
    return obj(name, [(*loft([(-1.0, 0.02, 0.02), (1.2, 0.02, 0.02)], 5), 0), (*loft([(1.2, 0.04, 0.012), (1.45, 0.002, 0.002)], 4, phase=0), 1)], [m_wood, m_tip])


def attach(o, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    o.parent = parent; o.location = loc; o.rotation_euler = tuple(R(a) for a in rot)
    return o


def hold_sword(rig, sw, side='R'):
    return attach(sw, rig.p['hand_' + side], (0, -0.01, -0.065), (90, 0, 0))


def hold_shield(rig, sh):
    return attach(sh, rig.p['forearm_L'], (0.0, -0.12, -0.14), (0, 0, 0))   # faces forearm front (-Y)


def _frame(minus_z, minus_y):
    z = -Vector(minus_z).normalized()
    y = -Vector(minus_y); y = (y - z * y.dot(z)).normalized()
    return Matrix((y.cross(z), y, z)).transposed()


def aim_arm(ua_dir, fa_dir, fa_front, ua_front=(0, -1, 0.6)):
    """Euler (deg) for upper arm & forearm so the limbs point along the given torso-space directions
    and the forearm's front (shield face) looks along fa_front."""
    Mu, Mf = _frame(ua_dir, ua_front), _frame(fa_dir, fa_front)
    eu, ef = Mu.to_euler('XYZ'), (Mu.inverted() @ Mf).to_euler('XYZ')
    return tuple(math.degrees(a) for a in eu), tuple(math.degrees(a) for a in ef)


_GU, _GF = aim_arm((0.35, -0.6, -0.72), (-0.75, -0.55, 0.35), (0.25, -1, 0.1))
_BU, _BF = aim_arm((0.25, -0.75, -0.42), (-0.9, -0.3, 0.3), (0.15, -1, 0.3))


# ---------------------------------------------------------------- pose helpers (degrees)
def arm(side, fwd=0, out=8, twist=0):
    s = 1 if side == 'L' else -1
    return (-fwd, -out * s, twist * s)


def mirror(pose):
    out = {}
    for k, v in pose.items():
        if k.endswith('_L'):
            k2 = k[:-1] + 'R'
        elif k.endswith('_R'):
            k2 = k[:-1] + 'L'
        else:
            k2 = k
        out[k2] = (v[0], -v[1], -v[2]) if isinstance(v, tuple) else v
    return out


def base_pose():
    return {'hips': (0, 0, 0), 'torso': (0, 0, 0), 'head': (0, 0, 0),
            'upper_arm_L': arm('L'), 'upper_arm_R': arm('R'), 'forearm_L': (-12, 0, 0), 'forearm_R': (-12, 0, 0),
            'hand_L': (0, 0, 0), 'hand_R': (0, 0, 0), 'thigh_L': (0, 0, 0), 'thigh_R': (0, 0, 0),
            'shin_L': (2, 0, 0), 'shin_R': (2, 0, 0), 'foot_L': (0, 0, 0), 'foot_R': (0, 0, 0),
            '_lift': 0.0, '_pitch': 0.0, '_ground': 1.0}


def P(**kw):
    p = base_pose()
    for k, v in kw.items():
        p[k] = v
    return p


def blend(a, b, w):
    out = {}
    for k in set(a) | set(b):
        va, vb = a.get(k), b.get(k)
        if va is None:
            out[k] = vb
        elif vb is None:
            out[k] = va
        else:
            out[k] = lerp(va, vb, w)
    return out


def add(a, b):
    out = dict(a)
    for k, v in b.items():
        out[k] = (tuple(x + y for x, y in zip(out[k], v)) if isinstance(v, tuple) else out[k] + v) if k in out else v
    return out


def ptrack(keys, f, ease=smooth):
    """keys: [(frame, pose)] -> eased interpolated pose."""
    if f <= keys[0][0]:
        return keys[0][1]
    for (f0, p0), (f1, p1) in zip(keys, keys[1:]):
        if f <= f1:
            return blend(p0, p1, ease((f - f0) / max(1e-6, f1 - f0)))
    return keys[-1][1]


def walk(ph, amp=1.0, arms=True, lean=3, drag=0.0):
    w = 2 * math.pi * ph
    s, c = math.sin(w), math.cos(w)
    p = base_pose()
    p['thigh_L'] = (-22 * amp * s * (1 - drag), 0, 0)
    p['thigh_R'] = (22 * amp * s, 0, 0)
    p['shin_L'] = (6 + 34 * amp * max(0, c) ** 2 * (1 - drag), 0, 0)
    p['shin_R'] = (6 + 34 * amp * max(0, -c) ** 2, 0, 0)
    p['foot_L'] = (-8 * amp * max(0, c), 0, 0)
    p['foot_R'] = (-8 * amp * max(0, -c), 0, 0)
    if arms:
        p['upper_arm_L'] = arm('L', -16 * amp * s, 8)
        p['upper_arm_R'] = arm('R', 16 * amp * s, 8)
        p['forearm_L'] = (-15 - 8 * max(0, -s), 0, 0)
        p['forearm_R'] = (-15 - 8 * max(0, s), 0, 0)
    p['torso'] = (lean, 0, 5 * amp * s)
    p['head'] = (0, 0, -4 * amp * s)
    p['hips'] = (0, 2 * amp * c, -5 * amp * s)
    return p


def run(ph, amp=1.0, arms=True):
    w = 2 * math.pi * ph
    s, c = math.sin(w), math.cos(w)
    p = base_pose()
    p['thigh_L'] = (-42 * amp * s - 12, 0, 0)
    p['thigh_R'] = (42 * amp * s - 12, 0, 0)
    p['shin_L'] = (20 + 80 * amp * max(0, c) ** 1.5, 0, 0)
    p['shin_R'] = (20 + 80 * amp * max(0, -c) ** 1.5, 0, 0)
    p['foot_L'] = (-15 * max(0, c), 0, 0); p['foot_R'] = (-15 * max(0, -c), 0, 0)
    if arms:
        p['upper_arm_L'] = arm('L', -35 * amp * s + 5, 12)
        p['upper_arm_R'] = arm('R', 35 * amp * s + 5, 12)
        p['forearm_L'] = (-75, 0, 0); p['forearm_R'] = (-75, 0, 0)
    p['torso'] = (14, 0, 9 * s)
    p['head'] = (-8, 0, -6 * s)
    p['hips'] = (0, 3 * c, -8 * s)
    p['_lift'] = 0.05 * abs(s)
    return p


# combat poses for the knight (sword right, shield left)
GUARD = P(torso=(8, 0, -12), head=(-6, 0, 10),
          upper_arm_R=arm('R', 35, 18, -10), forearm_R=(-65, 0, 0), hand_R=(-10, 0, 0),
          upper_arm_L=_GU, forearm_L=_GF,
          thigh_L=(-22, 0, -8), shin_L=(25, 0, 0), foot_L=(-5, 0, 0),
          thigh_R=(16, 0, 8), shin_R=(22, 0, 0), foot_R=(-30, 0, 0))
WINDUP = add(GUARD, {'torso': (-6, 0, -28), 'upper_arm_R': arm('R', 140, 30, -10), 'forearm_R': (-45, 0, 0), 'hand_R': (-30, 0, 0), 'head': (0, 0, 15)})
STRIKE = add(GUARD, {'torso': (22, 0, 38), 'upper_arm_R': arm('R', 30, -5, 30), 'forearm_R': (40, 0, 0), 'hand_R': (40, 0, 0), 'head': (8, 0, -25),
                     'thigh_L': (-15, 0, 0), 'shin_L': (15, 0, 0)})
FOLLOW = add(GUARD, {'torso': (26, 0, 48), 'upper_arm_R': arm('R', -10, -25, 30), 'forearm_R': (50, 0, 0), 'hand_R': (40, 0, 0), 'head': (8, 0, -30),
                     'thigh_L': (-15, 0, 0), 'shin_L': (15, 0, 0)})
BLOCK = add(GUARD, {'torso': (-4, 0, 6), 'head': (8, 0, -5), 'shin_L': (15, 0, 0), 'shin_R': (20, 0, 0)})
BLOCK['upper_arm_L'], BLOCK['forearm_L'] = _BU, _BF
KNEEL = P(torso=(10, 0, 0), head=(20, 0, 0), thigh_L=(-88, 0, 0), shin_L=(88, 0, 0), foot_L=(0, 0, 0),
          thigh_R=(5, 0, 0), shin_R=(95, 0, 0), foot_R=(-30, 0, 0),
          upper_arm_L=arm('L', 25, 5), forearm_L=(-60, 0, 0), upper_arm_R=arm('R', 10, 12), forearm_R=(-20, 0, 0))


def swing(f, f0, guard=GUARD, speed=1.0):
    """Overhead diagonal slash starting at f0 (~28 frames)."""
    k = [(0, guard), (8, WINDUP), (12, STRIKE), (16, FOLLOW), (28, guard)]
    return ptrack([(f0 + a / speed, p) for a, p in k], f)


# ---------------------------------------------------------------- baker
def _leg(p, sd, Sg):
    a1 = -p.get('thigh_' + sd, (0, 0, 0))[0]
    a2 = p.get('shin_' + sd, (0, 0, 0))[0]
    r1, r12 = math.radians(a1), math.radians(a1 - a2)
    fwd = Sg['thigh'] * math.sin(r1) + Sg['shin'] * math.sin(r12)
    down = Sg['thigh'] * math.cos(r1) + Sg['shin'] * math.cos(r12)
    return fwd, down + Sg['hip_off'] + Sg['foot']


def bake(rig, f0, f1, fn, start=(0, 0), heading=0.0, locomote=False, ground=0.0, path=None, jiggle=1.0, wind=0.3):
    """fn(f)->pose. heading: deg or fn(f). path: fn(f)->(x,y) world (overrides locomotion).
    ground: float or fn(x,y). Computes root height from legs (feet on ground), foot-locked forward travel,
    BBL spring jiggle, cape and plume secondary motion."""
    Sg, sc = rig.seg, rig.scale
    gfn = ground if callable(ground) else (lambda x, y, g=ground: g)
    hfn = heading if callable(heading) else (lambda f, h=heading: h)
    pos = Vector((start[0], start[1], 0))
    prev = None
    zs, jig = [], {'L': [0.0, 0.0], 'R': [0.0, 0.0]}
    capeang = []
    for f in range(f0, f1 + 1):
        p = dict(fn(f))
        h = hfn(f)
        legs = {sd: _leg(p, sd, Sg) for sd in 'LR'}
        st = max(legs, key=lambda k: legs[k][1])
        if path:
            x, y = path(f); delta = Vector((x, y, 0)) - Vector((pos.x, pos.y, 0)); pos.x, pos.y = x, y
        elif locomote and prev is not None:
            d = (prev[st][0] - legs[st][0]) * sc
            dirv = Vector((math.sin(R(h)), -math.cos(R(h)), 0))  # character forward = local -Y rotated by heading
            pos += dirv * d
        prev = legs
        hz = legs[st][1]
        gw = p.get('_ground', 1.0)
        base_h = Sg['hip_off'] + Sg['thigh'] + Sg['shin'] + Sg['foot']
        z = gfn(pos.x, pos.y) + (hz * gw + base_h * (1 - gw) + p.get('_lift', 0.0)) * sc
        rig.root.location = (pos.x, pos.y, z)
        rig.root.rotation_euler = (R(p.get('_pitch', 0.0)), 0, R(h))
        rig.root.keyframe_insert('location', frame=f)
        rig.root.keyframe_insert('rotation_euler', frame=f)
        rig.track.append((f, Vector(rig.root.location)))
        zs.append(z / sc)
        # secondary motion
        if 'glute_L' in rig.p and jiggle:
            acc = (zs[-1] - 2 * zs[-2] + zs[-3]) if len(zs) > 2 else 0.0
            for sd, k, c in (('L', 0.32, 0.18), ('R', 0.28, 0.16)):
                x, v = jig[sd]
                v += -k * x - c * v - acc * 6.0 * jiggle
                x += v
                jig[sd] = [x, v]
                th = p.get('thigh_' + sd, (0, 0, 0))[0]
                jz = max(-0.03, min(0.03, x * 0.6))
                p['glute_' + sd] = (th * 0.35 - jz * 250, 0, 0)
                rig.p['glute_' + sd].scale = (1 + jz * 0.6, 1 - jz * 0.8, 1 + jz * 1.6)
                rig.p['glute_' + sd].keyframe_insert('scale', frame=f)
        if 'cape0' in rig.p:
            spd = 0.0
            if len(rig.track) > 1:
                spd = (rig.track[-1][1] - rig.track[-2][1]).length * 24 / sc
            t = f / 24
            gust = wind * (math.sin(t * 2.1) * 0.6 + math.sin(t * 5.3 + 1) * 0.3 + math.sin(t * 11.7) * 0.1)
            lift = min(55, spd * 14) + gust * 25
            capeang.append(lift)
            tor = p.get('torso', (0, 0, 0))[0]
            for i in range(10):
                if f'cape{i}' not in rig.p:
                    break
                lag = capeang[max(0, len(capeang) - 1 - i * 3)]
                rest = (24 + tor * 0.6) if i == 0 else (-14 if i == 1 else -6)
                wav = math.sin(t * 6 - i * 1.3) * (4 + lag * 0.15)
                p[f'cape{i}'] = (rest + lag * (0.8 if i == 0 else 0.35) + wav, math.sin(t * 3.1 + i) * 3 * (1 + wind), math.sin(t * 2 + i) * 4 * wind)
        if 'plume' in rig.p:
            hd = p.get('head', (0, 0, 0))
            p['plume'] = (math.sin(f * 0.35) * 4 - zs[-1] * 0 + (zs[-2] - zs[-1] if len(zs) > 1 else 0) * 300, math.sin(f * 0.21) * 6 - hd[2] * 0.4, 0)
        rig.set(p, f)
    return rig


def hide_between(objs, f_show, f_hide=None):
    """Hide objects (render+viewport) outside [f_show, f_hide)."""
    for o in objs:
        for f, v in ((f_show - 1, True), (f_show, False)) + (((f_hide - 1, False), (f_hide, True)) if f_hide else ()):
            if f < 0:
                continue
            o.hide_render = v; o.keyframe_insert('hide_render', frame=f)
            o.hide_viewport = v; o.keyframe_insert('hide_viewport', frame=f)


def all_objs(rig):
    out = [rig.root]
    stack = [rig.root]
    while stack:
        o = stack.pop()
        for ch in o.children:
            out.append(ch); stack.append(ch)
    return out


# ---------------------------------------------------------------- creatures
def dragon(name, m_scale, m_belly, m_wing, m_horn, m_eye, scale=1.0, loc=(0, 0, 0), heading=0.0):
    """Ancient dragon: body + 6-seg neck + jawed head + 8-seg tail + 2-part wings + 4 legs. Faces -Y."""
    root = empty(name, loc); root.scale = (scale,) * 3; root.rotation_euler = (0, 0, R(heading))
    mats = [m_scale, m_belly, m_wing, m_horn, m_eye]
    Pp = {}

    def part(pn, parts, parent, l, sm=False):
        o = obj(f"{name}_{pn}", parts, mats, parent=parent, loc=l, smooth=sm); Pp[pn] = o; return o

    body = part('body', [(*loft([(-1.7, 0.45, 0.5), (-1.0, 0.9, 0.95), (0.2, 1.05, 1.0), (1.2, 0.8, 0.8), (1.9, 0.4, 0.42)], 8, axis='Y'), 0),
                         (*loft([(-1.2, 0.55, 0.3, 0, -0.55), (1.2, 0.5, 0.3, 0, -0.5)], 6, axis='Y'), 1)] +
                [(*cone(0.14, 0.5, 4, (0, y, 0.75)), 3) for y in (-1.0, -0.4, 0.2, 0.8, 1.4)], root, (0, 0, 0), sm=True)
    # neck chain forward (-Y) and up
    par, l = body, (0, -1.55, 0.2)
    for i in range(6):
        r = 0.42 - i * 0.04
        seg = [(*loft([(0, r, r), (0.75, r - 0.04, r - 0.04)], 7, axis='-Y'), 0), (*cone(0.08, 0.3, 4, (0, -0.35, r - 0.05)), 3)]
        par = part(f'neck{i}', seg, par, l, sm=True)
        l = (0, -0.72, 0)
    # head
    hd = [(*loft([(0, 0.26, 0.24), (0.35, 0.3, 0.26, 0, 0.04), (0.85, 0.2, 0.14, 0, -0.04), (1.25, 0.13, 0.09, 0, -0.06)], 7, axis='-Y'), 0)]
    for sx in (-1, 1):
        hd.append((*tube([(sx * 0.15, 0.05, 0.2), (sx * 0.3, 0.45, 0.45), (sx * 0.35, 0.95, 0.5), (sx * 0.3, 1.3, 0.35)], [0.09, 0.07, 0.04, 0.005], 5), 3))
        hd.append((*tube([(sx * 0.24, 0.1, 0.0), (sx * 0.5, 0.4, 0.05), (sx * 0.6, 0.7, 0.2)], [0.05, 0.03, 0.004], 4), 3))
        hd.append((*box(0.1, 0.06, 0.05, (sx * 0.2, -0.55, 0.14)), 4))
    head = part('head', hd, par, l)
    jaw = [(*loft([(0, 0.2, 0.08, 0, -0.05), (1.1, 0.1, 0.05, 0, -0.03)], 6, axis='-Y'), 1)]
    for k in range(5):
        for sx in (-1, 1):
            jaw.append((*cone(0.03, 0.12, 3, (sx * (0.15 - k * 0.012), -0.3 - k * 0.17, 0.0)), 3))
    part('jaw', jaw, head, (0, 0.1, -0.12))
    # tail chain backward (+Y)
    par, l = body, (0, 1.7, 0.0)
    for i in range(8):
        r = 0.36 * (1 - i / 9)
        seg = [(*loft([(0, r, r), (0.9, r * 0.88, r * 0.88)], 6, axis='Y'), 0), (*cone(0.06, 0.25, 4, (0, 0.4, r - 0.04)), 3)]
        if i == 7:
            seg.append((xf([(0, 0.9, 0), (0.35, 1.2, 0), (0, 1.7, 0), (-0.35, 1.2, 0)]), [(0, 1, 2, 3)], 3))
        par = part(f'tail{i}', seg, par, l, sm=True)
        l = (0, 0.86, 0)
    # wings: inner (arm + membrane), outer (fingers + membrane)
    for sx, sd in ((1, 'L'), (-1, 'R')):
        inner = [(*tube([(0, 0, 0), (sx * 1.4, -0.1, 0.25), (sx * 2.8, 0.0, 0.3)], [0.14, 0.11, 0.08], 5), 0)]
        mV = [(0, -0.2, 0), (sx * 2.8, 0.0, 0.3), (sx * 2.6, 1.6, 0.1), (sx * 1.6, 2.0, 0.05), (sx * 0.4, 2.2, 0)]
        mF = [(0, 1, 2), (0, 2, 3), (0, 3, 4)] if sx > 0 else [(2, 1, 0), (3, 2, 0), (4, 3, 0)]
        inner.append((mV, mF, 2))
        wi = part('wing_' + sd, inner, body, (sx * 0.6, -0.8, 0.6))
        outer = []
        tips = [(sx * 3.4, -0.3, 0.5), (sx * 3.6, 0.9, 0.3), (sx * 3.0, 1.9, 0.1), (sx * 2.0, 2.4, 0.0)]
        for t in tips:
            outer.append((*tube([(0, 0, 0), t], [0.06, 0.01], 4), 3))
        mV = [(0, 0, 0)] + tips + [(0, 1.6, -0.2)]
        mF = [(0, i, i + 1) for i in range(1, 4)] + [(0, 4, 5)]
        if sx < 0:
            mF = [tuple(reversed(f)) for f in mF]
        outer.append((mV, mF, 2))
        part('wingtip_' + sd, outer, wi, (sx * 2.8, 0.0, 0.3))
    # legs
    for (sx, sy, sd) in ((1, -0.9, 'FL'), (-1, -0.9, 'FR'), (1, 1.0, 'BL'), (-1, 1.0, 'BR')):
        th = part('thigh_' + sd, [(*loft([(0.2, 0.4, 0.45), (-0.7, 0.24, 0.26)], 6), 0)], body, (sx * 0.7, sy, -0.3), sm=True)
        sh = part('shin_' + sd, [(*loft([(0, 0.22, 0.24), (-0.6, 0.15, 0.16)], 6), 0)], th, (0, 0, -0.7), sm=True)
        ft = [(*box(0.3, 0.45, 0.12, (0, -0.15, -0.06)), 0)] + [(*cone(0.04, 0.25, 3, (k * 0.1, -0.38, -0.08)), 3) for k in (-1, 0, 1)]
        part('foot_' + sd, ft, sh, (0, 0, -0.6))
    rig = Rig(name, root, Pp, scale, {}, kind='dragon')
    for o in Pp.values():
        wobble(o, 0.04)
    return rig


def dragon_pose(f, flap=0.0, flap_speed=1.0, fold=0.0, neck=(0, 0), jaw=0.0, legs='stand', tail_amp=1.0, breath=1.0, head_lift=0.0, look=0.0):
    """flap 0..1 amplitude; fold 0..1 wings folded; neck=(pitch, yaw) offsets; jaw 0..1."""
    t = f / 24
    p = {}
    w = math.sin(t * 2 * math.pi * 0.9 * flap_speed)
    br = math.sin(t * 2.2) * breath
    p['body'] = (br * 1.5, 0, 0)
    for i in range(6):
        p[f'neck{i}'] = ((-14 if i < 2 else -3) + neck[0] / 6 + (-head_lift / 3 if i < 3 else 0) + math.sin(t * 1.3 - i * 0.5) * 3 * breath,
                         0, neck[1] / 6 + look / 6 + math.sin(t * 0.9 - i * 0.4) * 4 * breath)
    p['head'] = (32 + head_lift * 0.5 + neck[0] * 0.2 - jaw * 15, 0, math.sin(t * 1.1) * 4 * breath)
    p['jaw'] = (jaw * 38 + math.sin(t * 9) * 3 * jaw, 0, 0)
    for i in range(8):
        p[f'tail{i}'] = (2 + math.sin(t * 1.5 - i * 0.6) * 2 * tail_amp, 0, math.sin(t * 1.2 - i * 0.55) * 7 * tail_amp)
    for sx, sd in ((1, 'L'), (-1, 'R')):
        u = flap * (42 * w + 10) + fold * 25 - br * 2
        u2 = flap * 30 * math.sin(t * 2 * math.pi * 0.9 * flap_speed - 0.9)
        p['wing_' + sd] = (0, -sx * u, sx * fold * 70)
        p['wingtip_' + sd] = (0, -sx * u2, -sx * fold * 150)
    if legs == 'stand':
        for sd in ('FL', 'FR', 'BL', 'BR'):
            p['thigh_' + sd] = (-15 if sd[0] == 'F' else 20, 0, 0)
            p['shin_' + sd] = (25 if sd[0] == 'F' else -40, 0, 0)
            p['foot_' + sd] = (-10 if sd[0] == 'F' else 20, 0, 0)
    else:  # tucked in flight
        for sd in ('FL', 'FR', 'BL', 'BR'):
            p['thigh_' + sd] = (-60 if sd[0] == 'F' else 70, 0, 0)
            p['shin_' + sd] = (80 if sd[0] == 'F' else -40, 0, 0)
            p['foot_' + sd] = (20, 0, 0)
    return p


def beast(name, m_skin, m_horn, m_eye, m_dark, scale=1.0, loc=(0, 0, 0), heading=0.0):
    """Cursed quadruped: hunched body, spiked spine, horned head with jaw. Faces -Y."""
    root = empty(name, loc); root.scale = (scale,) * 3; root.rotation_euler = (0, 0, R(heading))
    mats = [m_skin, m_horn, m_eye, m_dark]
    Pp = {}

    def part(pn, parts, parent, l, sm=True):
        o = obj(f"{name}_{pn}", parts, mats, parent=parent, loc=l, smooth=sm); Pp[pn] = o; return o
    body = part('body', [(*loft([(-1.2, 0.45, 0.5, 0, 0.1), (-0.6, 0.75, 0.85, 0, 0.35), (0.3, 0.65, 0.7, 0, 0.15), (1.1, 0.45, 0.5)], 8, axis='Y'), 0)] +
                [(*cone(0.1, 0.45 - abs(y) * 0.12, 4, (0, y, 0.8 + 0.3 * math.cos(y))), 1) for y in (-0.9, -0.5, -0.1, 0.3, 0.7)], root, (0, 0, 0))
    head = [(*loft([(0, 0.32, 0.3), (0.5, 0.36, 0.3), (0.9, 0.24, 0.18, 0, -0.08)], 7, axis='-Y'), 0)]
    for sx in (-1, 1):
        head.append((*tube([(sx * 0.2, -0.1, 0.25), (sx * 0.55, 0.05, 0.45), (sx * 0.75, -0.25, 0.75), (sx * 0.6, -0.55, 0.95)], [0.1, 0.08, 0.05, 0.005], 5), 1))
        head.append((*box(0.1, 0.05, 0.06, (sx * 0.17, -0.55, 0.12)), 2))
    hd = part('head', head, body, (0, -1.25, 0.15))
    jaw = [(*loft([(0, 0.25, 0.1), (0.8, 0.18, 0.06)], 6, axis='-Y'), 0)] + [(*cone(0.035, 0.18, 3, (sx * 0.15, -0.6, 0.05)), 1) for sx in (-1, 1)]
    part('jaw', jaw, hd, (0, -0.05, -0.2))
    for (sx, sy, sd) in ((1, -0.8, 'FL'), (-1, -0.8, 'FR'), (1, 0.8, 'BL'), (-1, 0.8, 'BR')):
        th = part('thigh_' + sd, [(*loft([(0, 0.25, 0.28), (-0.7, 0.16, 0.18)], 6), 0)], body, (sx * 0.55, sy, -0.1))
        sh = part('shin_' + sd, [(*loft([(0, 0.15, 0.17), (-0.65, 0.11, 0.12)], 6), 0), (*box(0.28, 0.35, 0.12, (0, -0.1, -0.65)), 3)] +
                  [(*cone(0.03, 0.2, 3, (k * 0.09, -0.3, -0.68)), 1) for k in (-1, 0, 1)], th, (0, 0, -0.7))
    rig = Rig(name, root, Pp, scale, {}, kind='beast')
    for o in Pp.values():
        wobble(o, 0.03)
    return rig


def wraith(name, m_cloak, m_bone, m_eye, scale=1.0, loc=(0, 0, 0), heading=0.0):
    root = empty(name, loc); root.scale = (scale,) * 3; root.rotation_euler = (0, 0, R(heading))
    mats = [m_cloak, m_bone, m_eye, mat('void', None, (0, 0, 0), fog=0.3)]
    rnd = random.Random(7)
    V, F = loft([(1.65, 0.05, 0.05), (1.5, 0.22, 0.2), (1.2, 0.3, 0.26), (0.6, 0.38, 0.33), (-0.1, 0.5, 0.45)], 10, cap=(True, False))
    V = [(x, y, z - (rnd.uniform(0.1, 0.55) if z < 0 else 0)) for x, y, z in V]   # tattered hem
    cloak = obj(name + '_cloak', [(V, F, 0), (*loft([(1.35, 0.17, 0.17, 0, -0.04), (1.75, 0.11, 0.13, 0, -0.03), (1.82, 0.02, 0.02, 0, 0.05)], 8), 0),
                                  (*box(0.18, 0.02, 0.15, (0, -0.19, 1.5)), 3)] +
                [(*box(0.04, 0.02, 0.025, (sx * 0.045, -0.215, 1.52)), 2) for sx in (-1, 1)], mats, parent=root)
    wv = cloak.modifiers.new('wave', 'WAVE'); wv.height = 0.06; wv.width = 0.4; wv.speed = 0.15; wv.narrowness = 1.0
    wv.use_normal = False
    Pp = {'cloak': cloak}
    for sx, sd in ((1, 'L'), (-1, 'R')):
        a = obj(f'{name}_arm_{sd}', [(*loft([(0, 0.09, 0.09), (-0.6, 0.13, 0.12)], 6, cap=(True, False)), 0)] +
                [(*tube([(0, 0, -0.55), (k * 0.03, -0.05, -0.75), (k * 0.04, -0.08, -0.9)], [0.015, 0.012, 0.002], 3), 1) for k in (-1, 0, 1)],
                mats, parent=cloak, loc=(sx * 0.3, 0, 1.25))
        Pp['arm_' + sd] = a
    rig = Rig(name, root, Pp, scale, {}, kind='wraith')
    return rig


# ---------------------------------------------------------------- effects
def sparks(name, f0, pos, mat_, n=14, seed=1, spread=2.5, life=10, size=0.04):
    """Ballistic spark burst baked as tiny emissive shards."""
    rnd = random.Random(seed)
    out = []
    for i in range(n):
        o = obj(f'{name}{i}', [(*box(size, size * 3, size), 0)], [mat_], loc=pos)
        v = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(0.2, 1.5))).normalized() * rnd.uniform(0.5, 1) * spread
        L = int(life * rnd.uniform(0.6, 1.2))
        o.scale = (0, 0, 0); o.keyframe_insert('scale', frame=f0 - 1)
        for k in range(L + 1):
            t = k / 24
            o.location = Vector(pos) + v * t + Vector((0, 0, -4.9 * t * t))
            o.keyframe_insert('location', frame=f0 + k)
            s = 1 - k / L
            o.scale = (s, s, s); o.keyframe_insert('scale', frame=f0 + k)
            o.rotation_euler = (k, k * 0.7, 0); o.keyframe_insert('rotation_euler', frame=f0 + k)
        o.scale = (0, 0, 0); o.keyframe_insert('scale', frame=f0 + L + 1)
        out.append(o)
    fl = obj(name + '_flash', [(*sphere(size * 2.5, 6, 4), 0)], [mat_], loc=pos)
    for f, s in ((f0 - 1, 0), (f0, 1.3), (f0 + 1, 0.9), (f0 + 2, 0.3), (f0 + 3, 0)):
        fl.scale = (s,) * 3; fl.keyframe_insert('scale', frame=f)
    return out
