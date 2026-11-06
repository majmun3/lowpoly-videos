"""Scenes 1-4: birth, childhood, training, knighting."""
from cast import *
from sets import *
from actors import _GU, _GF

FPS = 24


def idle(f, ph=0.0, amt=1.0):
    t = f / FPS + ph
    p = base_pose()
    p['torso'] = (1.5 * math.sin(t * 2.0) * amt, 0, 1.0 * math.sin(t * 0.7) * amt)
    p['head'] = (2 * math.sin(t * 0.9) * amt, 0, 4 * math.sin(t * 0.43) * amt)
    p['upper_arm_L'] = arm('L', 2 * math.sin(t * 2.0), 8)
    p['upper_arm_R'] = arm('R', 2 * math.sin(t * 2.0), 8)
    return p


def village(mats, rnd_seed=1, rows=((-9, -6), (9, 6)), n=5, street_y=(-25, 45)):
    """Two rows of houses along the Y street."""
    rnd = random.Random(rnd_seed)
    out = []
    for side, (x, rot_sign) in enumerate(rows):
        y = street_y[0]
        while y < street_y[1]:
            w, d = rnd.uniform(4.5, 6.5), rnd.uniform(4, 5)
            out.append(house(f'house_{side}_{int(y)}', (x + rnd.uniform(-1, 1), y, 0), 90 if x < 0 else -90, mats, w=w, d=d, h=rnd.uniform(2.6, 3.4), seed=int(y) + side * 100,
                             lit=rnd.random() < 0.6))
            y += w + rnd.uniform(1.5, 4)
    return out


# ====================================================================== SCENE 1
def scene1():
    sc = new_scene('S1_BornIntoDarkness', 144, fog=(0.05, 0.06, 0.09), near=25, far=420, ambient=(0.05, 0.05, 0.08),
                   sky_top=(0.005, 0.006, 0.012), sky_hor=(0.06, 0.07, 0.1), clouds=0.6)
    m, s = M(), sm()
    # ---------------- interior (offset far away from exterior)
    O = Vector((500, 0, 0))
    rm = [s['wood'], mat('plank_floor', 'wood', (0.7, 0.6, 0.5), scale=1.2, seed=4)]
    W, Dp, Hh = 6.0, 5.0, 3.0
    P = [(*box(W, Dp, 0.1, (0, 0, -0.05)), 1), (*box(W, 0.2, Hh, (0, -Dp / 2, Hh / 2)), 0),
         (*box(0.2, Dp, Hh, (-W / 2, 0, Hh / 2)), 0), (*box(0.2, Dp, Hh, (W / 2, 0, Hh / 2)), 0), (*box(W, Dp, 0.1, (0, 0, Hh)), 0)]
    # back wall with window hole x[-0.5,0.5] z[1.3,2.1]
    P += [(*box(W / 2 - 0.5, 0.2, Hh, (-(W / 2 + 0.5) / 2, Dp / 2, Hh / 2)), 0), (*box(W / 2 - 0.5, 0.2, Hh, ((W / 2 + 0.5) / 2, Dp / 2, Hh / 2)), 0),
          (*box(1.0, 0.2, 1.3, (0, Dp / 2, 0.65)), 0), (*box(1.0, 0.2, 0.9, (0, Dp / 2, 2.55)), 0),
          (*box(0.08, 0.25, 0.8, (0, Dp / 2, 1.7)), 1), (*box(1.0, 0.25, 0.08, (0, Dp / 2, 1.7)), 1)]
    for x in (-2, 0, 2):
        P.append((*box(0.25, Dp, 0.25, (x, 0, Hh - 0.15)), 0))
    obj('room', P, rm, loc=O)
    # bed, table, candle
    obj('bed', [(*box(2.1, 1.3, 0.45, (1.6, 1.4, 0.22)), 0), (*box(2.0, 1.2, 0.18, (1.6, 1.4, 0.52)), 1), (*box(0.5, 0.9, 0.15, (2.35, 1.4, 0.68)), 1),
                (*box(0.12, 1.3, 1.0, (2.65, 1.4, 0.5)), 0)], [s['wood'], m['grey']], loc=O)
    obj('table', [(*box(0.7, 0.7, 0.06, (-0.6, 1.7, 0.75)), 0)] + [(*box(0.06, 0.06, 0.75, (-0.6 + dx, 1.7 + dy, 0.37)), 0) for dx in (-0.3, 0.3) for dy in (-0.3, 0.3)] +
        [(*loft([(0.78, 0.04, 0.04, -0.55, 1.65), (0.98, 0.035, 0.035, -0.55, 1.65)], 6), 1)], [s['wood'], s['candle']], loc=O)
    fl = obj('candle_flame', [(*cone(0.025, 0.09, 4, (0, 0, 0)), 0)], [glow_mat('flame_y', (1.0, 0.75, 0.25), 4.0)], loc=O + Vector((-0.55, 1.65, 0.99)))
    billboard_glow('candle_glow', O + Vector((-0.55, 1.65, 1.03)), 0.12, (1.0, 0.5, 0.15), 0.6)
    cl = light('candle_light', 'POINT', O + Vector((-0.5, 1.5, 1.15)), (1.0, 0.55, 0.22), 60, size=0.05, shadow=True)
    for f in range(1, 66, 2):
        k = 0.8 + 0.2 * math.sin(f * 1.7) * math.sin(f * 0.53)
        cl.data.energy = 60 * k; cl.data.keyframe_insert('energy', frame=f)
        fl.scale = (1, 1, 0.8 + 0.4 * k); fl.keyframe_insert('scale', frame=f)
    light('room_fill', 'POINT', O + Vector((1.5, -1.5, 2.6)), (0.4, 0.45, 0.7), 8, shadow=False)
    win_l = light('window_flash', 'SPOT', O + Vector((0, Dp / 2 + 1.5, 2.3)), (0.7, 0.75, 1.0), 0, rot=(R(-65), 0, R(180)), size=0.2)
    win_l.data.spot_size = R(70)
    # mother cradling the newborn
    mom = villager('mother', m, cloth='brown')
    cu, cf = aim_arm((0.15, -0.8, -0.55), (-0.85, -0.45, 0.25), (0, -0.2, 1))
    cu2, cf2 = aim_arm((-0.15, -0.8, -0.55), (0.85, -0.45, 0.25), (0, -0.2, 1))

    def mom_pose(f):
        t = f / FPS
        p = base_pose()
        p.update({'thigh_L': (-88, 0, -4), 'thigh_R': (-88, 0, 4), 'shin_L': (85, 0, 0), 'shin_R': (85, 0, 0),
                  'upper_arm_L': cu, 'forearm_L': cf, 'upper_arm_R': cu2, 'forearm_R': cf2,
                  'torso': (12 + 2 * math.sin(t * 1.6), 0, 5 * math.sin(t * 1.6)), 'head': (28 + 3 * math.sin(t * 0.8), 0, -6 * math.sin(t * 1.6)),
                  '_ground': 0.0, '_lift': -0.42})
        return p
    bake(mom, 1, 64, mom_pose, start=(O.x + 1.1, O.y + 1.05), heading=20)
    baby = obj('baby', [(*sphere(0.13, 7, 5, (0, 0, 0), sy=0.75, sz=1.6), 0), (*sphere(0.07, 6, 4, (0, -0.03, 0.2)), 1)],
               [mat('swaddle', 'cloth_grey', (1.6, 1.5, 1.35), scale=4), m['skin']], parent=mom.p['torso'], loc=(0.02, -0.3, 0.2), rot=(R(-60), R(80), 0), scale=(1.2, 1.2, 1.2))
    # ---------------- exterior: village in the storm, castle on the mountain
    h = hfield(3, 0.8, 0.05)
    terrain('ground', (300, 300), 60, s['mud'], h=lambda x, y: h(x, y) * min(1, (abs(x) + abs(y)) / 30) - 0.05, center=(0, 60))
    obj('ground_grass', [(*box(600, 500, 0.1, (0, 330, -2.0)), 0)], [s['grass']])
    hs = house('birth_house', (0, 0, 0), 0, s, w=6, d=5, h=3, seed=3)
    village(s, rows=((-12, 0), (12, 0)), street_y=(-30, 60))
    for i, (x, y) in enumerate(((-30, 40), (35, 70), (-45, 110), (40, 130))):
        house(f'far_house{i}', (x, y, 0), random.Random(i).uniform(0, 90), s, seed=i + 40)
    for i in range(8):
        dead_tree(f'tree{i}', (random.Random(i).uniform(-60, 60), random.Random(i + 9).uniform(20, 160), 0), random.Random(i).uniform(6, 10), s['bark'], seed=i)
    fence('fence1', (-4, -4, 0), (4, -4, 0), s['wood'])
    mtn = [(0, 260, 85, 70), (-120, 330, 110, 120), (130, 340, 120, 140), (-60, 420, 140, 160), (80, 450, 150, 180), (-200, 260, 90, 80), (210, 250, 90, 90)]
    for i, (x, y, r, hh) in enumerate(mtn):
        mountain(f'mtn{i}', (x, y, -2), r, hh, s['rock'], seed=i)
    castle('castle', (0, 262, 64), 1.15, s, evil=True)
    moon((45, 495, 330), 26, s)
    rain('rain', (0, -8, 0), (30, 30, 16), 3000, 65, 144, speed=16)
    # moonlight + lightning flashes
    light('moonlight', 'SUN', rot=(R(70), 0, R(170)), color=(0.55, 0.6, 0.9), energy=0.6)
    fl_sun = light('flash_sun', 'SUN', rot=(R(40), 0, R(200)), color=(0.75, 0.8, 1.0), energy=0, shadow=False)
    flashes(sc, [(18, 1.0), (46, 0.7), (96, 1.0), (126, 0.8)], 144, lights=[(fl_sun, 4.0), (win_l, 2500)])
    bolt('bolt1', (-30, 300, 230), (-15, 280, 60), [18, 96], seed=1, width=1.2)
    bolt('bolt2', (60, 330, 240), (30, 300, 80), [46, 126], seed=2, width=1.2)
    # the dragon crossing the moon
    dr = dragon('dragon', m['scales'], m['belly'], m['wing'], m['horn'], m['eye_red'], scale=4.0)
    for f in range(85, 145):
        t = (f - 85) / 60          # crosses the moon disc around frame 115
        dr.root.location = (lerp(-60, 130, t), 395, 258 + 8 * math.sin(t * 3.0))
        dr.root.rotation_euler = (R(8), R(-10 + 6 * math.sin(f * 0.25)), R(-95))
        dr.root.keyframe_insert('location', frame=f); dr.root.keyframe_insert('rotation_euler', frame=f)
        dr.set(dragon_pose(f, flap=1.0, flap_speed=1.1, legs='tuck', breath=0.3), f)
    hide_between(all_objs(dr), 85)
    # ---------------- cameras
    ca, ta = camera('S1_cam_interior', 24)
    shoot(ca, ta, 1, 64, [(1, O + Vector((-1.3, -1.6, 1.5))), (64, O + Vector((-0.4, -0.9, 1.35)))],
          [(1, O + Vector((0.0, 2.5, 1.75))), (26, O + Vector((0.4, 2.0, 1.4))), (64, O + Vector((1.05, 0.8, 1.0)))])
    cb, tb = camera('S1_cam_exterior', 26)
    shoot(cb, tb, 65, 144, [(65, (2.0, -9.0, 1.6)), (90, (1.2, -12, 6)), (144, (0.0, -16, 13))],
          [(65, (0.5, -2.5, 1.9)), (92, (0.3, 60, 30)), (144, (4, 262, 105))], lens_keys=[(65, 26), (100, 28), (144, 38)])
    cut(sc, 1, ca); cut(sc, 65, cb)
    # interior vs exterior atmosphere
    for f, fog, near, far, amb in ((1, (0.02, 0.02, 0.03), 8, 40, (0.06, 0.05, 0.05)), (64, (0.02, 0.02, 0.03), 8, 40, (0.06, 0.05, 0.05)),
                                   (65, (0.05, 0.06, 0.09), 40, 700, (0.05, 0.05, 0.08))):
        keyprop(sc, 'fog_color', f, list(fog)); keyprop(sc, 'fog_near', f, float(near)); keyprop(sc, 'fog_far', f, float(far)); keyprop(sc, 'ambient', f, list(amb))
    return sc


# ====================================================================== SCENE 2
def scene2():
    sc = new_scene('S2_ChildInACursedWorld', 168, fog=(0.08, 0.09, 0.1), near=12, far=230, ambient=(0.08, 0.08, 0.09),
                   sky_top=(0.03, 0.035, 0.045), sky_hor=(0.12, 0.12, 0.13), clouds=0.4)
    m, s = M(), sm()
    h = hfield(5, 0.4, 0.07)
    terrain('street', (140, 260), (40, 70), s['mud'], h=h, center=(0, 60))
    village(s, rows=((-9, 0), (9, 0)), street_y=(-20, 70))
    for i, (x, y, r, hh) in enumerate([(0, 240, 70, 60), (-90, 280, 90, 100), (100, 300, 100, 120), (0, 340, 120, 140)]):
        mountain(f'mtn{i}', (x, y, -2), r, hh, s['rock'], seed=i + 10)
    castle('castle', (0, 242, 55), 0.9, s, evil=True)
    # cemetery + forest edge to the west (x<-14)
    for i in range(16):
        rr = random.Random(i)
        grave(f'grave{i}', (rr.uniform(-38, -20), rr.uniform(8, 34), h(-30, 20)), s['stone'], seed=i, kind='cross' if i % 3 == 0 else 'stone')
    for i in range(14):
        rr = random.Random(i + 50)
        dead_tree(f'tree{i}', (rr.uniform(-60, -18), rr.uniform(-10, 60), 0), rr.uniform(5, 9), s['bark'], seed=i + 20)
    fence('cem_fence', (-17, 4, 0), (-17, 38, 0), s['wood'])
    fence('fence_child', (-6, -6, 0), (-6, 6, 0), s['wood'])
    light('sun', 'SUN', rot=(R(62), 0, R(140)), color=(0.65, 0.7, 0.85), energy=1.3)
    fire('brazier', (6.5, 6, 0.9), 0.6, 1, 168, light_energy=120)
    obj('brazier_bowl', [(*loft([(0, 0.1, 0.1), (0.8, 0.08, 0.08), (0.95, 0.4, 0.4)], 6), 0)], [m['rust']], loc=(6.5, 6, 0))
    # the child (hero), red cloak
    kid = knight('kid', m, 'child')
    stick = sword('kid_stick', s['wood'], s['wood'], s['wood'], length=0.55, wooden=True)
    hold_sword(kid, stick)
    raise_u, raise_f = aim_arm((-0.2, -0.5, 0.85), (-0.05, -0.3, 0.95), (0, -1, 0))

    def kid_pose(f):
        if f <= 64:   # watch the soldiers pass (head follows them)
            p = idle(f, 0.0)
            p['head'] = (-5, 0, track([(1, -40), (64, 45)], f))
            p['torso'] = (0, 0, track([(1, -15), (64, 15)], f))
            return p
        if f <= 112:
            p = idle(f, 1.0); p['head'] = (0, 0, 30); return p
        p = idle(f, 2.0)
        w = smooth((f - 140) / 12)
        p['upper_arm_R'] = lerp(arm('R', 0, 8), raise_u, w)
        p['forearm_R'] = lerp((-12, 0, 0), raise_f, w)
        p['head'] = (-12 * w - 4, 0, 0)
        return p
    bake(kid, 1, 112, kid_pose, start=(-5.0, 0.0), heading=-90)
    bake(kid, 113, 168, kid_pose, start=(0.5, 20.0), heading=180)
    # marching soldiers (column crossing the street, moving -X ... toward the castle road)
    for i in range(5):
        sd = soldier(f'soldier{i}', m)
        bake(sd, 1, 64, lambda f, i=i: walk(f / 26 + i * 0.5, amp=0.95, arms=False), start=(2.0 + (i % 2) * 0.9, -3 - 1.9 * i), heading=180,
             locomote=True, ground=h)
        # spear arm fixed upright
        for f in range(1, 65):
            sd.p['upper_arm_R'].rotation_euler = (R(-15), R(-5), 0); sd.p['upper_arm_R'].keyframe_insert('rotation_euler', frame=f)
            sd.p['forearm_R'].rotation_euler = (R(-75), 0, 0); sd.p['forearm_R'].keyframe_insert('rotation_euler', frame=f)
        hide_between(all_objs(sd), 1, 65)
    # undead shambling in the cemetery
    for i, (x, y, hd) in enumerate(((-28, 22, 30), (-33, 14, -60), (-24, 30, 120))):
        u = undead(f'undead{i}', m)
        bake(u, 60, 112, lambda f, i=i: add(walk(f / 40 + i * 0.3, amp=0.6, lean=14, drag=0.5), {'head': (10, 15, 10 * math.sin(f * 0.1))}),
             start=(x, y), heading=hd, locomote=True, ground=h(x, y))
        hide_between(all_objs(u), 60, 113)
    # goblin peeking from behind a tree, then fleeing into the forest
    gb = goblin('goblin', m)
    dead_tree('goblin_tree', (-19, 4, 0), 7, s['bark'], seed=77)
    gh = lambda f: track([(91, -60.0), (95, 120.0)], f)

    def gob_pose(f):
        if f < 92:
            p = idle(f, 0.5, 1.5)
            p['torso'] = (25, 0, -20); p['head'] = (-15, 0, track([(70, -30), (82, 25), (91, 25)], f))
            p['thigh_L'] = (-30, 0, 0); p['shin_L'] = (50, 0, 0); p['thigh_R'] = (-10, 0, 0); p['shin_R'] = (40, 0, 0)
            return p
        return add(run((f - 92) / 12), {'torso': (20, 0, 0)})
    bake(gb, 66, 112, gob_pose, start=(-19.9, 4.9), heading=gh, locomote=True, ground=h)
    hide_between(all_objs(gb), 66, 113)
    # cameras
    ca, ta = camera('S2_cam_soldiers', 30)
    shoot(ca, ta, 1, 64, [(1, (-7.6, -0.6, 0.85)), (64, (-7.3, 0.4, 0.9))], [(1, (4, -4, 1.2)), (64, (4, 3, 1.3))])
    cb, tb = camera('S2_cam_cemetery', 32)
    shoot(cb, tb, 65, 112, [(65, (-8, -4, 1.6)), (112, (-9, -2, 1.8))], [(65, (-28, 20, 1.5)), (84, (-24, 12, 1.4)), (112, (-24, 5, 1.2))])
    cc, tcc = camera('S2_cam_castle', 26)
    shoot(cc, tcc, 113, 168, [(113, (1.0, 17.0, 0.55)), (168, (0.7, 18.2, 0.5))], [(113, (0.3, 25, 1.4)), (168, (0, 120, 30))])
    cut(sc, 1, ca); cut(sc, 65, cb); cut(sc, 113, cc)
    return sc


# ====================================================================== SCENE 3
def scene3():
    sc = new_scene('S3_TheTraining', 168, fog=(0.1, 0.08, 0.07), near=10, far=120, ambient=(0.1, 0.08, 0.07),
                   sky_top=(0.04, 0.035, 0.04), sky_hor=(0.2, 0.13, 0.1), clouds=0.5)
    m, s = M(), sm()
    obj('yard', [(*box(60, 60, 0.2, (0, 0, -0.1)), 0)], [mat('yard_dirt', 'mud', (1.4, 1.3, 1.2), scale=0.5)])
    # courtyard walls & towers
    WP = [(*box(40, 2, 10, (0, 16, 5)), 0), (*box(2, 34, 10, (-18, 0, 5)), 0), (*box(2, 34, 10, (18, 0, 5)), 0)]
    WP += [(*box(1, 1, 1.2, (x, 16.5, 10.6)), 0) for x in range(-18, 19, 2)]
    WP += tower((-18, 16, 0), 3, 18, 0, 1, 2, rnd=random.Random(3)) + tower((18, 16, 0), 3, 20, 0, 1, 2, rnd=random.Random(4))
    obj('fort_walls', WP, [s['stone'], s['roof'], s['win_warm']])
    # beast pen: alcove with bars
    obj('pen', [(*box(10, 0.6, 7, (0, 15, 3.5)), 0), (*box(10, 6, 0.6, (0, 12, 7)), 0)] +
        [(*box(0.15, 0.15, 6.4, (x, 9.2, 3.2)), 1) for x in [-4.5 + k * 0.75 for k in range(13)] if abs(x) > 0.5 or True],
        [s['stone_dark'], m['rust']])
    bst = beast('beast', mat('beast_hide', 'scales', (0.55, 0.55, 0.5), scale=0.8, seed=5), m['horn'], m['eye_red'], m['dark'], scale=1.6)
    chain_m = mat('chain', 'chain', scale=4)

    def beast_pose(f):
        t = f / FPS
        roar = smooth((f - 128) / 8) * (1 - smooth((f - 150) / 10))
        pull = math.sin(t * 1.7) * 0.5 + 0.5
        p = {'body': (2 * math.sin(t * 2.2) - 6 * roar, 0, 3 * math.sin(t * 0.8)), 'head': (-10 * pull - 25 * roar, 0, 12 * math.sin(t * 0.6)),
             'jaw': (8 + 30 * roar + 4 * math.sin(t * 7) * roar, 0, 0)}
        for sd in ('FL', 'FR', 'BL', 'BR'):
            p['thigh_' + sd] = ((-12 if sd[0] == 'F' else 10) - 6 * pull, 0, 0)
            p['shin_' + sd] = ((15 if sd[0] == 'F' else -15) + 4 * pull, 0, 0)
        return p
    for f in range(1, 169):
        pull = math.sin(f / FPS * 1.7) * 0.5 + 0.5
        bst.root.location = (0, 12.5 - 0.8 * pull, 2.5)
        bst.root.keyframe_insert('location', frame=f)
        bst.set(beast_pose(f), f)
    # chains from collar to wall rings (straight links, re-solved per frame would be heavy: links sag statically)
    for sx in (-1, 1):
        pts = arc((sx * 1.2, 11.0, 3.4), (sx * 4.5, 14.6, 5.5), -0.8, n=12)
        links = []
        for i, pnt in enumerate(pts[:-1]):
            q = Vector(pts[i + 1]) - Vector(pnt)
            links.append((xf(box(0.12, 0.05, 0.3)[0], loc=pnt, rot=(0, (math.pi / 2) * (i % 2), 0)), box(1, 1, 1)[1], 0))
        ch = obj(f'chain{sx}', links, [chain_m])
        for f in range(1, 169, 2):
            pull = math.sin(f / FPS * 1.7) * 0.5 + 0.5
            ch.location = (0, -0.8 * pull * 0.5, 0); ch.keyframe_insert('location', frame=f)
    # torches, rack, dummy
    for i, (x, y) in enumerate(((-8, 14.6), (8, 14.6), (-17, 2), (17, 2))):
        obj(f'torch_post{i}', [(*box(0.15, 0.15, 3, (0, 0, 1.5)), 0)], [s['wood']], loc=(x, y, 0))
        fire(f'torch{i}', (x, y, 3.0), 0.35, 1, 168, light_energy=90, smoke=False)
    dm = obj('dummy', [(*box(0.25, 0.25, 1.8, (0, 0, 0.9)), 0), (*box(1.2, 0.18, 0.18, (0, 0, 1.4)), 0), (*sphere(0.25, 6, 4, (0, 0, 1.95)), 1),
                       (*loft([(0.6, 0.3, 0.25), (1.3, 0.32, 0.27)], 6), 1)], [s['wood'], mat('sack', 'thatch', (0.9, 0.8, 0.6), scale=2)], loc=(3.0, 4.0, 0))
    obj('rack', [(*box(2.5, 0.2, 0.15, (0, 0, 1.2)), 0), (*box(0.15, 0.4, 1.4, (-1.2, 0, 0.7)), 0), (*box(0.15, 0.4, 1.4, (1.2, 0, 0.7)), 0)] +
        [(*box(0.04, 0.04, 1.2, (-0.9 + k * 0.45, 0.1, 0.9)), 1) for k in range(5)], [s['wood'], m['steel']], loc=(-6, 9, 0))
    light('sun', 'SUN', rot=(R(58), 0, R(-150)), color=(1.0, 0.75, 0.55), energy=1.8)
    # characters
    teen = knight('teen', m, 'teen')
    tsw, _ = arm_knight(teen, m, wooden=True, shield_on=False)
    old = trainer('trainer', m)
    osw = sword('trainer_sword', m['wood'], m['wood'], m['leather'], length=0.7, wooden=True)
    hold_sword(old, osw)
    TG = GUARD
    tblock = add(GUARD, {'upper_arm_R': arm('R', 70, 10, -40), 'forearm_R': (-80, 0, 0), 'hand_R': (0, 0, 70), 'torso': (-6, 0, 10)})
    fallen = P(_ground=0.0, _lift=-0.82, _pitch=-82, torso=(-10, 0, 0), head=(20, 0, 10), thigh_L=(-40, 0, 0), shin_L=(50, 0, 0),
               thigh_R=(-15, 0, 0), shin_R=(20, 0, 0), upper_arm_L=arm('L', 10, 40), upper_arm_R=arm('R', 30, 50), forearm_R=(-30, 0, 0))
    sitting = P(_ground=0.0, _lift=-0.78, _pitch=-25, torso=(30, 0, 0), head=(10, 0, 0), thigh_L=(-80, 0, 0), shin_L=(110, 0, 0),
                thigh_R=(-60, 0, 0), shin_R=(60, 0, 0), upper_arm_L=arm('L', -30, 10), forearm_L=(-10, 0, 0), upper_arm_R=arm('R', -20, 15))
    crouch = P(torso=(35, 0, 0), thigh_L=(-75, 0, 0), shin_L=(110, 0, 0), thigh_R=(-20, 0, 0), shin_R=(100, 0, 0), upper_arm_R=arm('R', 30, 10),
               forearm_R=(-40, 0, 0), upper_arm_L=arm('L', 20, 15), head=(-15, 0, 0))

    def teen_pose(f):
        if f <= 70:
            # block strike 1 (trainer hits at ~f20), strike 2 at ~f46 sends him down
            k = [(1, GUARD), (16, GUARD), (20, tblock), (30, GUARD), (42, GUARD), (46, tblock), (50, add(tblock, {'torso': (-25, 0, 0)})),
                 (58, sitting), (70, fallen)]
            return ptrack(k, f)
        if f <= 110:
            return ptrack([(71, fallen), (80, fallen), (90, sitting), (98, crouch), (110, GUARD)], f)
        # three strikes on the dummy
        return ptrack([(111, GUARD), (113, GUARD)], f) if f < 113 else (
            swing(f, 113) if f < 141 else swing(f, 141) if f < 169 else GUARD)
    bake(teen, 1, 168, teen_pose, path=lambda f: (0.0, 0.0) if f <= 110 else (2.25, 2.85), heading=lambda f: 90 if f <= 110 else -143)

    def old_pose(f):
        if f <= 70:
            return blend(swing(f, 8, TG), swing(f, 34, TG), 1.0 if f >= 34 else 0.0)
        return add(idle(f, 0.3), {'upper_arm_R': arm('R', 30, 10), 'forearm_R': (-60, 0, 0), 'head': (12, 0, 0)})
    bake(old, 1, 168, old_pose, start=(-1.35, 0.15), heading=-90)
    # dummy recoils on hits (frames ~125 and ~153)
    for f in range(111, 169):
        a = sum(math.exp(-(f - hf) / 5) * math.sin((f - hf) * 0.9) * 12 for hf in (125, 153) if f >= hf)
        dm.rotation_euler = (R(a), 0, R(a * 0.3)); dm.keyframe_insert('rotation_euler', frame=f)
    sp = mat('splinter', None, (0.6, 0.45, 0.25), emit=(0.2, 0.12, 0.04))
    sparks('chips1', 125, (3.0, 3.7, 1.4), sp, n=8, seed=3, spread=2.0, size=0.05)
    sparks('chips2', 153, (3.0, 3.7, 1.6), sp, n=8, seed=4, spread=2.0, size=0.05)
    spk = glow_mat('spark', (1.0, 0.8, 0.4), 6)
    sparks('clash1', 20, (-0.65, 0.0, 1.35), spk, n=8, seed=1, spread=2.0, size=0.025)
    sparks('clash2', 46, (-0.65, 0.0, 1.35), spk, n=10, seed=2, spread=2.5, size=0.025)
    # cameras
    ca, ta = camera('S3_cam_spar', 30)
    shoot(ca, ta, 1, 70, [(1, (-0.5, -5.2, 1.4)), (70, (0.3, -4.0, 1.0))], [(1, (-0.6, 0, 1.1)), (50, (-0.4, 0, 1.0)), (70, (0.2, 0, 0.5))], shake=0.01)
    cb, tb = camera('S3_cam_rise', 22)
    shoot(cb, tb, 71, 110, [(71, (2.6, -1.2, 0.35)), (110, (2.4, -1.6, 0.45))], [(71, (0.6, 0.0, 0.4)), (110, (0.0, 0.0, 1.6))])
    cc, tcc = camera('S3_cam_dummy', 30)
    shoot(cc, tcc, 111, 168, [(111, (0.4, 0.2, 1.5)), (168, (0.9, 0.9, 1.35))], [(111, (3.0, 6.0, 1.5)), (140, (2.6, 8.0, 2.2)), (168, (2.0, 10.0, 3.0))])
    cut(sc, 1, ca); cut(sc, 71, cb); cut(sc, 111, cc)
    return sc


# ====================================================================== SCENE 4
def scene4():
    sc = new_scene('S4_BecomingAKnight', 192, fog=(0.03, 0.025, 0.035), near=8, far=70, ambient=(0.05, 0.04, 0.05),
                   sky_top=(0.0, 0.0, 0.0))
    m, s = M(), sm()
    L, Wd = 40.0, 12.0
    P = [(*box(Wd, L, 0.2, (0, 0, -0.1)), 0), (*box(3, L, 0.02, (0, 0, 0.01)), 3)]
    for side in (-1, 1):
        P.append((*box(0.6, L, 22, (side * Wd / 2, 0, 11)), 1))
        for k in range(7):
            y = -16 + k * 5
            P += [(*loft([(0, 0.55, 0.55, side * 3.6, y), (0.5, 0.45, 0.45, side * 3.6, y), (13, 0.45, 0.45, side * 3.6, y), (13.5, 0.6, 0.6, side * 3.6, y)], 8), 1)]
            P.append((*box(0.1, 1.6, 7.5, (side * (Wd / 2 - 0.32), y + 2.5, 9.5)), 4))
            P.append((*loft([(13.5, 0.4, 0.4, side * 3.6, y), (17, 0.05, 0.05, side * 2, y)], 4), 1))
    P.append((xf([(-Wd / 2, -L / 2, 22), (Wd / 2, -L / 2, 22), (Wd / 2, L / 2, 22), (-Wd / 2, L / 2, 22), (0, -L / 2, 30), (0, L / 2, 30)]),
              [(0, 1, 4), (1, 2, 5, 4), (2, 3, 5), (3, 0, 4, 5)], 1))
    P.append((*box(Wd, 0.6, 30, (0, 19, 15)), 1))
    P.append((*loft([(0, 2.0, 0.1, 0, 18.6), (7, 2.0, 0.1, 0, 18.6), (11, 0.2, 0.1, 0, 18.6)], 8, phase=0), 4))   # rose / lancet window
    for k in range(3):
        P.append((*box(8 - k * 2, 3 - k * 0.6, 0.35, (0, 14.5 - k * 0.5, 0.17 + k * 0.35)), 0))
    P.append((*box(1.8, 1.0, 0.8, (0, 15.2, 1.4)), 2))
    P.append((*box(1.8, 0.3, 3.8, (0, 15.6, 2.8)), 2))
    obj('cathedral', P, [s['tile'], s['stone_dark'], mat('throne', 'gold', (0.8, 0.7, 0.6), scale=2), m['red'],
                         mat('stained', 'glass', (1, 1, 1), scale=0.8, emit=(0.0, 0.0, 0.0), emit_strength=1, fog=0.3)])
    # stained-glass glow: make glass emissive by its own texture (bright)
    gm = bpy.data.materials['stained']
    nt = gm.node_tree; g = [n for n in nt.nodes if n.type == 'GROUP'][0]; mx = g.inputs['Albedo'].links[0].from_node
    nt.links.new(mx.outputs['Result'], g.inputs['Emission'])
    for i, (x, y) in enumerate([(sx * 3.0, y) for y in (-12, -6, 0, 6) for sx in (-1, 1)]):
        obj(f'candle_stand{i}', [(*loft([(0, 0.15, 0.15), (1.3, 0.05, 0.05), (1.4, 0.2, 0.2)], 6), 0), (*box(0.06, 0.06, 0.25, (0, 0, 1.55)), 1)],
            [s['stone_dark'], s['candle']], loc=(x, y, 0))
        obj(f'candle_fl{i}', [(*cone(0.04, 0.12, 4), 0)], [glow_mat('flame_y', (1.0, 0.75, 0.25), 4.0)], loc=(x, y, 1.7))
        billboard_glow(f'candle_glow{i}', (x, y, 1.75), 0.18, (1.0, 0.5, 0.15), 0.5)
        light(f'candle_l{i}', 'POINT', (x, y, 2.0), (1.0, 0.6, 0.3), 40, shadow=False, radius=8)
    # god rays through the windows
    ray = glow_mat('ray', (0.9, 0.8, 0.95), 0.07)
    for i, y in enumerate((-8.5, 1.5, 11.5)):
        obj(f'ray{i}', [(xf(box(1.4, 1.4, 16)[0], rot=(0, R(-38), 0)), box(1, 1, 1)[1], 0)], [ray], loc=(-1.0, y, 5.5))
    light('window_key', 'SUN', rot=(R(50), R(0), R(-60)), color=(0.65, 0.6, 0.9), energy=1.2)
    light('altar_light', 'SPOT', (0, 10, 9), (1.0, 0.8, 0.6), 1800, rot=(R(30), 0, R(180)), size=0.3).data.spot_size = R(50)
    # king & knight
    kg = king('king', m)
    ksw = sword('king_sword', m['steel'], m['gold'], m['purple'], length=0.95)
    hold_sword(kg, ksw)
    kn = knight('hero', m)
    hsw, hsh = arm_knight(kn, m)
    tap_u, tap_f = aim_arm((-0.3, -0.6, 0.6), (-0.1, -0.5, 0.85), (1, 0, 0))
    tapR_u, tapR_f = aim_arm((-0.4, -0.75, -0.2), (0.3, -0.75, -0.55), (1, 0, 0))
    tapL_u, tapL_f = aim_arm((-0.1, -0.8, -0.2), (-0.35, -0.75, -0.55), (1, 0, 0))
    hold = {'upper_arm_R': arm('R', 15, 10), 'forearm_R': (-40, 0, 0), 'hand_R': (90, 0, 0)}

    def king_pose(f):
        p = idle(f, 0.7, 0.6); p.update(hold); p['head'] = (18, 0, 0)
        if 66 <= f <= 118:
            k = [(66, dict(p)), (74, {**p, 'upper_arm_R': tap_u, 'forearm_R': tap_f, 'hand_R': (90, 0, 0)}),
                 (82, {**p, 'upper_arm_R': tapR_u, 'forearm_R': tapR_f, 'hand_R': (90, 0, 0)}), (88, {**p, 'upper_arm_R': tap_u, 'forearm_R': tap_f, 'hand_R': (90, 0, 0)}),
                 (96, {**p, 'upper_arm_R': tapL_u, 'forearm_R': tapL_f, 'hand_R': (90, 0, 0)}), (104, {**p, 'upper_arm_R': tap_u, 'forearm_R': tap_f, 'hand_R': (90, 0, 0)}),
                 (118, dict(p))]
            return ptrack(k, f)
        if f > 118:
            p['upper_arm_L'] = arm('L', 35 * smooth((f - 130) / 15), 30)
        return p
    bake(kg, 1, 192, king_pose, start=(0, 13.9), heading=0, ground=1.05)
    salute_u, salute_f = aim_arm((-0.35, -0.6, -0.7), (0.05, -0.3, 0.95), (0, -1, 0))

    def hero_pose(f):
        if f < 125:
            p = dict(KNEEL); p['head'] = (25 + 2 * math.sin(f * 0.08), 0, 0)
            p['torso'] = (12 + 1.5 * math.sin(f / FPS * 2), 0, 0)
            return p
        up = add(idle(f, 0.2), {'upper_arm_L': _GU, 'forearm_L': _GF})
        sal = dict(up); sal['upper_arm_R'] = salute_u; sal['forearm_R'] = salute_f; sal['hand_R'] = (90, 0, 0); sal['head'] = (-5, 0, 0)
        return ptrack([(125, KNEEL), (150, up), (162, up), (176, sal), (192, sal)], f)
    bake(kn, 1, 192, hero_pose, start=(0, 12.3), heading=180)
    # cameras
    ca, ta = camera('S4_cam_wide', 22)
    shoot(ca, ta, 1, 64, [(1, (0, -14, 2.0)), (64, (0, -6, 2.4))], [(1, (0, 14, 2.8)), (64, (0, 13, 2.2))])
    cb, tb = camera('S4_cam_side', 30)
    shoot(cb, tb, 65, 124, [(65, (4.8, 11.0, 1.5)), (124, (4.3, 11.6, 1.6))], [(65, (0, 13.0, 1.7)), (124, (0, 13.0, 1.6))])
    cc, tcc = camera('S4_cam_orbit', 26)
    orbit = []
    for k in range(9):
        a = math.radians(20 + k * 22.5)
        rr = 3.4 - k * 0.12
        orbit.append((125 + k * 8.4, (math.sin(a) * rr, 12.3 - math.cos(a) * rr, 1.3 - 0.75 * k / 8)))
    shoot(cc, tcc, 125, 192, orbit, [(125, (0, 12.3, 1.0)), (160, (0, 12.3, 1.5)), (192, (0, 12.3, 1.85))])
    cut(sc, 1, ca); cut(sc, 65, cb); cut(sc, 125, cc)
    return sc
