"""Scenes 5-8: first battle, monsters of the world, final journey, final revelation."""
from scenes_a import *


def fight_loop(f, attack_frames, guard=GUARD, block_frames=(), hit=None):
    """Guard stance; swings start at attack_frames, blocks around block_frames."""
    p = guard
    for a in attack_frames:
        if a <= f < a + 28:
            p = swing(f, a, guard)
    for b in block_frames:
        if b - 6 <= f < b + 10:
            w = smooth((f - (b - 6)) / 5) * (1 - smooth((f - (b + 4)) / 6))
            p = blend(p, BLOCK, w)
    t = f / FPS
    return add(p, {'torso': (1.5 * math.sin(t * 3), 0, 0), 'head': (0, 0, 3 * math.sin(t * 1.3))})


def stagger(f, f0, p):
    w = smooth((f - f0) / 4) * (1 - smooth((f - f0 - 10) / 8))
    return add(p, {'torso': (-25 * w, 0, -15 * w), 'head': (-20 * w, 0, 0), 'upper_arm_R': arm('R', -20 * w, 30 * w, 0)})


def collapse(f, f0, p):
    w = smooth((f - f0) / 14)
    down = P(_ground=0.0, _lift=-0.85, _pitch=-80, torso=(-10, 0, 20), head=(-30, 0, 30), thigh_L=(-30, 0, 0), shin_L=(40, 0, 0),
             upper_arm_L=arm('L', 0, 60), upper_arm_R=arm('R', 40, 60))
    kneel = P(_ground=1.0, torso=(40, 0, 10), head=(30, 0, 0), thigh_L=(-60, 0, 0), shin_L=(110, 0, 0), thigh_R=(10, 0, 0), shin_R=(110, 0, 0),
              upper_arm_R=arm('R', 10, 30), upper_arm_L=arm('L', 10, 30))
    if w < 0.5:
        return blend(p, kneel, w * 2)
    return blend(kneel, down, (w - 0.5) * 2)


def follow_cam(cam, tgt, rig, f0, f1, offset, look=(0, 0, 1.2), smooth_n=6, shake=0.0):
    tr = {f: v for f, v in rig.track}
    rnd = random.Random(5)
    for f in range(f0, f1 + 1):
        acc = Vector()
        n = 0
        for k in range(-smooth_n, smooth_n + 1):
            v = tr.get(min(max(f + k, f0), f1))
            if v is not None:
                acc += v; n += 1
        c = acc / n
        p = c + Vector(offset(f) if callable(offset) else offset)
        if shake:
            p += Vector((math.sin(f * 0.9), math.sin(f * 1.3 + 1), math.sin(f * 1.7 + 2))) * shake
        key(cam, 'location', f, p)
        key(tgt, 'location', f, Vector((c.x, c.y, 0)) + Vector(look(f) if callable(look) else look))


# ====================================================================== SCENE 5
def scene5():
    sc = new_scene('S5_TheFirstBattle', 240, fog=(0.07, 0.08, 0.09), near=8, far=140, ambient=(0.07, 0.07, 0.08),
                   sky_top=(0.02, 0.02, 0.03), sky_hor=(0.1, 0.11, 0.12), clouds=0.7)
    m, s = M(), sm()
    h = hfield(8, 0.7, 0.09)
    flat = lambda x, y: h(x, y) * min(1.0, abs(x) / 6 + 0.15)
    terrain('mud', (160, 200), (60, 70), mat('battle_mud', 'mud', (0.9, 0.85, 0.8), scale=0.5), h=flat, center=(0, 40))
    for i, (x, y, r, hh) in enumerate([(-70, 120, 60, 45), (60, 140, 70, 55), (0, 170, 80, 60)]):
        mountain(f'mtn{i}', (x, y, -2), r, hh, s['rock'], seed=i + 20)
    castle('ruin', (-55, 95, 0), 0.7, s, ruined=True, seed=4)
    # crypt where the giant skeleton emerges
    obj('crypt', [(*box(16, 10, 1.2, (0, 0, 0.4)), 0)] + [(*box(1.6, 1.6, 6, (x, y, 3)), 0) for x in (-7, 7) for y in (-4, 4)] +
        [(*box(3, 2, 1.2, (rx, ry, 0.6)), 0) for rx, ry in ((-10, -6), (9, -7), (-4, -8))], [s['stone_dark']], loc=(0, 62, flat(0, 62) - 0.5))
    rnd = random.Random(3)
    for i in range(10):
        x, y = rnd.uniform(-30, 30), rnd.uniform(18, 55)
        obj(f'spear_g{i}', [(*loft([(0, 0.03, 0.03), (2.4, 0.02, 0.02)], 4), 0)], [s['wood']], loc=(x, y, flat(x, y) - 0.2), rot=(rnd.uniform(-0.6, 0.6), rnd.uniform(-0.6, 0.6), 0))
    for i, (x, y) in enumerate(((-9, 30), (12, 26), (-18, 46), (20, 50), (5, 40))):
        fire(f'fire{i}', (x, y, flat(x, y)), 1.0, 1, 240, seed=i, light_energy=400)
        rock(f'debris{i}', (x + 1, y + 0.5, flat(x, y)), 0.7, s['wood'], seed=i)
    for i, (x, y) in enumerate(((-6, 22), (8, 34), (-14, 38))):
        obj(f'pole{i}', [(*box(0.12, 0.12, 5, (0, 0, 2.5)), 0)], [s['wood']], loc=(x, y, flat(x, y)))
        bn = obj(f'banner{i}', [(xf(quad(1.2, 2.4, (0, 0, -2.4))[0], loc=(0.65, 0, 4.9)), [(0, 1, 2, 3)], 0)], [s['red_cloth']], loc=(x, y, flat(x, y)))
        me = bn.data
        bn.modifiers.new('sub', 'SUBSURF').levels = 2
        bn.modifiers['sub'].subdivision_type = 'SIMPLE'
        wv = bn.modifiers.new('wave', 'WAVE'); wv.height = 0.15; wv.width = 0.8; wv.speed = 0.3; wv.use_y = False
    rain('rain', (0, 18, 0), (40, 50, 18), 5000, 1, 240, speed=18)
    light('sun', 'SUN', rot=(R(60), 0, R(150)), color=(0.6, 0.65, 0.8), energy=1.0)
    fsun = light('flash_sun', 'SUN', rot=(R(35), 0, R(190)), color=(0.8, 0.85, 1.0), energy=0, shadow=False)
    flashes(sc, [(28, 1.0), (92, 0.7), (150, 0.8), (200, 1.0), (228, 0.6)], 240, lights=[(fsun, 4.0)])
    bolt('bolt1', (-20, 110, 70), (-10, 75, 0), [28, 150], seed=4, width=0.6)
    bolt('bolt2', (25, 120, 70), (12, 80, 0), [92, 200, 228], seed=5, width=0.6)
    # giant skeleton clawing out of the crypt
    gs = giant_skeleton('giant', m, scale=6.0)

    def giant_pose(f):
        t = f / FPS
        rise = smooth(f / 230)
        roar = smooth((f - 196) / 10) * (1 - smooth((f - 232) / 8))
        p = P(_ground=0.0, _lift=lerp(-1.75, -0.62, rise),
              torso=(lerp(55, 15, rise) - 25 * roar, 0, 8 * math.sin(t * 0.9)), head=(-30 * roar - 10 + 8 * math.sin(t * 1.3), 0, 15 * math.sin(t * 0.7) * (1 - roar)),
              upper_arm_L=arm('L', 95 + 20 * math.sin(t * 1.5), 25 + 40 * roar), forearm_L=(-40 - 30 * math.sin(t * 1.5), 0, 0),
              upper_arm_R=arm('R', 80 + 25 * math.sin(t * 1.5 + 2), 25 + 40 * roar), forearm_R=(-50 - 30 * math.sin(t * 1.5 + 2), 0, 0),
              hand_L=(-30, 0, 0), hand_R=(-30, 0, 0))
        return p
    bake(gs, 1, 240, giant_pose, start=(0, 62), heading=0, ground=flat(0, 62))
    glow_eye = glow_mat('ghost_green', (0.3, 1.0, 0.4), 1.5)
    obj('giant_eyeglow', [(*sphere(0.35, 6, 4), 0)], [glow_eye], parent=gs.p['head'], loc=(0, -0.11, 0.2))
    # background battle: soldier vs undead pairs
    pairs = [(-7, 20), (6, 24), (-3, 32), (10, 36), (-12, 28), (3, 44), (-8, 48)]
    for i, (x, y) in enumerate(pairs):
        so = soldier(f'sold{i}', m, weapon='sword')
        un = undead(f'und{i}', m)
        off = i * 7
        a1 = [off + 10 + k * 56 for k in range(5)]
        a2 = [off + 38 + k * 56 for k in range(5)]
        ang = rnd.uniform(-60, 60)
        dx, dy = -math.sin(R(ang)) * 0.75, -math.cos(R(ang)) * 0.75
        bake(so, 1, 240, lambda f, a1=a1, a2=a2: fight_loop(f, a1, block_frames=[a + 12 for a in a2]), start=(x - dx, y - dy), heading=ang + 180, ground=flat)
        bake(un, 1, 240, lambda f, a1=a1, a2=a2: fight_loop(f, a2, block_frames=[a + 12 for a in a1]), start=(x + dx, y + dy), heading=ang, ground=flat)
    # soldiers running across (shot B background)
    for i in range(4):
        rr = soldier(f'runner{i}', m)
        bake(rr, 50, 120, lambda f, i=i: run(f / 14 + i * 0.3), start=(-14 + i * 1.5, 14 + i * 2.5), heading=-90, locomote=True, ground=flat)
        for f in range(50, 121):
            rr.p['upper_arm_R'].rotation_euler = (R(-50), 0, 0); rr.p['upper_arm_R'].keyframe_insert('rotation_euler', frame=f)
            rr.p['forearm_R'].rotation_euler = (R(-60), 0, 0); rr.p['forearm_R'].keyframe_insert('rotation_euler', frame=f)
        hide_between(all_objs(rr), 50, 121)
    # ---------------- the knight
    kn = knight('hero', m)
    hsw, hsh = arm_knight(kn, m)
    foe = undead('foe', m, broken=False)
    foe2 = undead('foe2', m)
    # shot B: run toward camera
    bake(kn, 57, 110, lambda f: run((f - 57) / 14), start=(0.5, 24), heading=0, locomote=True, ground=flat)
    end_b = kn.track[-1][1]
    # shot C: duel (knight faces -Y, foe faces +Y)
    KX, KY = 0.0, 12.0

    def knight_duel(f):
        if f <= 176:
            p = fight_loop(f, [130, 150], block_frames=[124])
            return p
        turn = add(BLOCK, {'head': (-25, 0, 0), 'torso': (-6, 0, 0)})
        return ptrack([(177, GUARD), (200, GUARD), (208, turn)], f)
    bake(kn, 111, 240, knight_duel, start=(KX, KY), heading=lambda f: track([(178, 0.0), (194, 180.0)], f), ground=flat)

    def foe_pose(f):
        p = fight_loop(f, [112], block_frames=[])
        p = stagger(f, 142, p)
        if f >= 158:
            p = collapse(f, 160, p)
        return p
    bake(foe, 111, 176, foe_pose, path=lambda f: (KX + 0.15, KY - 1.35 - 0.5 * smooth((f - 142) / 10)), heading=180, ground=flat)
    bake(foe2, 111, 176, lambda f: add(walk(f / 30, 0.6, lean=14, drag=0.4), {}), start=(KX - 3.5, KY - 3.0), heading=-130, locomote=True, ground=flat)
    hide_between(all_objs(foe) + all_objs(foe2), 111, 177)
    hide_between(all_objs(kn) + [hsw, hsh], 57)
    spk = glow_mat('spark', (1.0, 0.8, 0.4), 6)
    sparks('blockspk', 124, (KX + 0.2, KY - 0.55, flat(KX, KY) + 1.3), spk, n=16, seed=7, spread=3.0)
    sparks('hitspk', 142, (KX + 0.1, KY - 1.1, flat(KX, KY) + 1.2), spk, n=12, seed=8, spread=2.5)
    sparks('hitspk2', 162, (KX + 0.1, KY - 1.2, flat(KX, KY) + 1.0), spk, n=12, seed=9, spread=2.5)
    # cameras
    ca, ta = camera('S5_cam_wide', 24)
    shoot(ca, ta, 1, 56, [(1, (14, -6, 7)), (56, (10, -2, 5.5))], [(1, (-2, 40, 4)), (56, (0, 55, 8))])
    cb, tb = camera('S5_cam_run', 22)
    follow_cam(cb, tb, kn, 57, 110, lambda f: (0.9 - (f - 57) * 0.01, -3.6 + (f - 57) * 0.012, 0.45), look=(0, 0, 0.0), shake=0.02)
    cc, tcc = camera('S5_cam_duel', 26)
    shoot(cc, tcc, 111, 176, [(111, (3.4, 10.0, 1.4)), (140, (3.0, 8.6, 1.1)), (176, (1.6, 8.2, 0.8))],
          [(111, (0.1, 11.4, 1.3)), (176, (0.1, 11.0, 0.9))], shake=0.025)
    cd, td = camera('S5_cam_giant', 20)
    shoot(cd, td, 177, 240, [(177, (1.4, 8.6, 0.6)), (240, (0.9, 7.8, 0.45))], [(177, (0.2, 14, 1.6)), (210, (0, 40, 9)), (240, (0, 62, 13))], shake=0.015)
    cut(sc, 1, ca); cut(sc, 57, cb); cut(sc, 111, cc); cut(sc, 177, cd)
    return sc


# ====================================================================== SCENE 6
def scene6():
    sc = new_scene('S6_MonstersOfTheWorld', 192, fog=(0.12, 0.06, 0.16), near=4, far=75, ambient=(0.08, 0.05, 0.1),
                   sky_top=(0.02, 0.01, 0.04), sky_hor=(0.2, 0.08, 0.25), clouds=0.4)
    m, s = M(), sm()
    h = hfield(11, 0.5, 0.1)
    path = lambda x, y: h(x, y) * min(1, abs(x) / 4 + 0.1)
    terrain('forest_floor', (90, 160), (40, 70), mat('forest_ground', 'grass', (0.7, 0.6, 0.8), scale=0.35), h=path, center=(0, 50))
    rnd = random.Random(21)
    for i in range(46):
        x = rnd.choice((-1, 1)) * rnd.uniform(3, 30); y = rnd.uniform(-10, 70)
        dead_tree(f'tree{i}', (x, y, path(x, y)), rnd.uniform(6, 13), s['bark'], seed=i + 100, lean=rnd.uniform(-0.3, 0.3))
    for i in range(12):
        x = rnd.choice((-1, 1)) * rnd.uniform(2.5, 12); y = rnd.uniform(-5, 60)
        rock(f'rock{i}', (x, y, path(x, y)), rnd.uniform(0.4, 1.4), s['rock'], seed=i)
    for k, (y0, f0) in enumerate(((-5, 1), (8, 1), (30, 1))):
        fog_sheet(f'pfog{k}', (0, y0 + 10, 0.3), (60, 30), (0.5, 0.2, 0.7), 0.25, 1, 192, drift=(0.6, 0.2, 0), n=3, dz=0.7)
    # ruined castle on cliff with perched dragon
    mountain('cliff', (0, 92, -2), 22, 18, s['rock'], seed=7, sides=8)
    castle('ruins', (0, 92, 15), 0.55, s, ruined=True, seed=9)
    light('moon', 'SUN', rot=(R(55), 0, R(200)), color=(0.65, 0.55, 0.95), energy=1.4)
    fsun = light('flash_sun', 'SUN', rot=(R(30), 0, R(160)), color=(0.8, 0.5, 1.0), energy=0, shadow=False)
    flashes(sc, [(140, 0.8), (172, 1.0)], 192, lights=[(fsun, 3.0)])
    sc['flash_color'] = [0.75, 0.45, 1.0]
    bolt('pbolt', (20, 120, 70), (8, 100, 25), [140, 172], color=(0.75, 0.4, 1.0), seed=6, width=0.5)
    # knight walking the path
    kn = knight('hero', m)
    hsw, hsh = arm_knight(kn, m)
    lookup = lambda f: smooth((f - 82) / 20)

    def hero_pose(f):
        if f <= 64:
            return walk(f / 26, 0.9, lean=4)
        if f <= 128:
            w = lookup(f)
            p = blend(walk(f / 26, 0.9, lean=4), GUARD, smooth((f - 70) / 12))
            p['head'] = lerp(p['head'], (-35, 0, 10), w)
            return p
        return walk(f / 26, 0.9, lean=4)
    bake(kn, 1, 64, hero_pose, start=(0.3, 0), heading=180, locomote=True, ground=path)
    bake(kn, 65, 128, hero_pose, start=(0.3, 12.5), heading=180, locomote=True, ground=path)
    bake(kn, 129, 192, hero_pose, start=(0.3, 52), heading=180, locomote=True, ground=path)
    # wraith drifting through the fog behind
    wr = wraith('wraith', m['cloak'], m['bone'], m['eye_green'])
    for f in range(1, 65):
        t = f / 64
        wr.root.location = (lerp(10, -9, t), 9 + 2 * math.sin(t * 3), 0.9 + 0.25 * math.sin(f * 0.12))
        wr.root.rotation_euler = (R(8), R(6 * math.sin(f * 0.1)), R(-80 + 30 * t))
        wr.root.keyframe_insert('location', frame=f); wr.root.keyframe_insert('rotation_euler', frame=f)
        for sd, sx in (('L', 1), ('R', -1)):
            wr.p['arm_' + sd].rotation_euler = (R(-30 - 15 * math.sin(f * 0.15 + sx)), R(sx * -15), 0)
            wr.p['arm_' + sd].keyframe_insert('rotation_euler', frame=f)
    billboard_glow('wraith_glow', (0, 0, 1.2), 1.1, (0.4, 0.15, 0.6), 0.25, parent=wr.root)
    hide_between(all_objs(wr), 1, 65)
    # demon between the trees
    dm = demon('demon', m, scale=3.4)

    def demon_pose(f):
        t = f / FPS
        lean = smooth((f - 88) / 25)
        reach = smooth((f - 100) / 18)
        p = base_pose()
        p['torso'] = (8 + 18 * lean + 2 * math.sin(t * 2.4), 0, 5 * math.sin(t * 0.8))
        p['head'] = (25 * lean + 3 * math.sin(t * 1.7), 0, 10 * math.sin(t * 0.6) * (1 - lean))
        p['upper_arm_L'] = arm('L', 10 + 4 * math.sin(t * 2.4), 18)
        p['forearm_L'] = (-25, 0, 0)
        p['upper_arm_R'] = arm('R', lerp(10, 75, reach), lerp(18, 30, reach))
        p['forearm_R'] = (lerp(-25, -40, reach), 0, 0); p['hand_R'] = (-30 * reach, 0, 0)
        p['thigh_L'] = (-8, 0, -5); p['thigh_R'] = (8, 0, 5); p['shin_L'] = (10, 0, 0); p['shin_R'] = (14, 0, 0)
        return p
    bake(dm, 65, 128, demon_pose, start=(1.6, 21), heading=-8, ground=path)
    for f in range(65, 129, 2):   # breathing chest
        k = 1 + 0.04 * math.sin(f / FPS * 2.4)
        dm.p['torso'].scale = (k, k, 1); dm.p['torso'].keyframe_insert('scale', frame=f)
    obj('demon_tail', [(*tube([(0, 0.1, 0), (0, 0.5, -0.4), (0.3, 0.9, -0.8), (0.1, 1.3, -1.0)], [0.08, 0.06, 0.04, 0.005], 5), 0)], [m['demon']], parent=dm.p['hips'])
    billboard_glow('demon_glow', (0, -0.1, 0.2), 0.25, (1.0, 0.2, 0.05), 0.5, parent=dm.p['head'])
    hide_between(all_objs(dm), 65, 129)
    # dragon on the ruins
    dr = dragon('dragon', m['scales'], m['belly'], m['wing'], m['horn'], m['eye_red'], scale=1.7, loc=(0, 92, 15 + 0.2 + 1.75 * 1.7), heading=-5)
    for f in range(120, 193):
        unf = smooth((f - 146) / 22)
        roar = smooth((f - 168) / 8)
        dr.set(dragon_pose(f, flap=0.25 * unf * (1 - roar * 0.5), flap_speed=0.6, fold=1 - unf, jaw=roar, head_lift=lerp(-10, 35, unf), legs='stand', neck=(5 - 25 * roar, 0)), f)
    hide_between(all_objs(dr), 120)
    # cameras
    ca, ta = camera('S6_cam_wraith', 26)
    follow_cam(ca, ta, kn, 1, 64, (-3.8, -1.2, 1.1), look=(2.0, 3.0, 1.4))
    cb, tb = camera('S6_cam_demon', 18)
    shoot(cb, tb, 65, 128, [(65, (-0.6, 9.5, 0.6)), (128, (-1.0, 10.8, 0.35))], [(65, (0.4, 14, 1.3)), (92, (1.0, 18, 5)), (128, (1.6, 21, 8.5))])
    cc, tcc = camera('S6_cam_dragon', 22)
    shoot(cc, tcc, 129, 192, [(129, (1.6, 47, 0.7)), (192, (1.0, 50, 0.5))], [(129, (0, 60, 6)), (192, (0, 92, 22))])
    cut(sc, 1, ca); cut(sc, 65, cb); cut(sc, 129, cc)
    return sc


# ====================================================================== SCENE 7 & 8 shared set
def fortress(m, s, gap=0.0):
    """Ruined mountain fortress (ref 2): twin round towers, gate arch, two hinged doors. Gate at y=0."""
    rnd = random.Random(12)
    P = []
    for sx in (-1, 1):
        P.append((*box(30, 6, 22, (sx * 21, 6, 11)), 0))
        P += tower((sx * 9.5, 3, 0), 6.5, 30, 0, 1, 2, spire=False, rnd=rnd, windows=3)
        P += [(*box(1.6, 1.6, 2, (sx * (8 + k * 3.2), 3.2, 23)), 0) for k in range(7) if rnd.random() > 0.35]
    P.append((*box(10, 6, 8, (0, 6, 22)), 0))   # arch lintel
    P.append((*box(10, 30, 0.4, (0, 18, 0.0)), 3))
    P.append((*box(30, 1, 40, (0, 34, 20)), 3))    # darkness behind
    o = obj('fortress', P, [s['stone_dark'], s['roof'], s['win_red'], s['dark']])
    doors = []
    for sx in (-1, 1):
        D = [(*box(5.0, 0.6, 18, (-sx * 2.5, 0, 9)), 0)] + [(*box(5.1, 0.7, 0.4, (-sx * 2.5, 0, z)), 1) for z in (3, 8, 13, 16)]
        d = obj(f'door{sx}', D, [mat('door_wood', 'wood', (0.6, 0.5, 0.45), scale=0.7), m['rust']], loc=(sx * 5.0, 3.3, 0))
        doors.append(d)
    # mountain path terrain rising to the gate
    terrain('mountain_path', (140, 160), (50, 60), s['rock'], h=lambda x, y: (abs(x) ** 1.3) * 0.25 + max(0, -y) * 0.0 + hfield(4, 0.6, 0.15)(x, y) * min(1, abs(x) / 5),
            center=(0, -50))
    for i, (x, y, r, hh) in enumerate([(-80, 40, 60, 70), (85, 30, 60, 80), (0, 90, 90, 110), (-50, -40, 30, 25), (55, -60, 35, 30)]):
        mountain(f'mtn{i}', (x, y, -4), r, hh, s['rock'], seed=i + 30)
    for i in range(8):
        x = random.Random(i).choice((-1, 1)) * random.Random(i + 3).uniform(6, 20); y = random.Random(i + 7).uniform(-90, -10)
        dead_tree(f'tree{i}', (x, y, (abs(x) ** 1.3) * 0.25), random.Random(i).uniform(5, 8), s['bark'], seed=i + 200)
    return o, doors


def old_knight(m):
    kn = knight('hero_old', m, 'old')
    sw = sword('hero_old_sword', m['steel'], m['gold'], m['leather'], length=0.9)
    hold_sword(kn, sw)
    sh = shield('hero_old_shield', mat('emblem_old', 'emblem', (0.7, 0.65, 0.6), flat=('XZ', 0.56, 0.74)), m['armor_old'])
    hold_shield(kn, sh)
    return kn, sw, sh


# ====================================================================== SCENE 7
def scene7():
    sc = new_scene('S7_TheFinalJourney', 216, fog=(0.1, 0.07, 0.14), near=10, far=230, ambient=(0.08, 0.06, 0.1),
                   sky_top=(0.02, 0.01, 0.04), sky_hor=(0.18, 0.1, 0.24), clouds=0.8, flash_color=(0.75, 0.45, 1.0))
    m, s = M(), sm()
    fort, doors = fortress(m, s)
    for sx, d in zip((-1, 1), doors):
        d.rotation_euler = (0, 0, R(sx * -6))     # ajar: a sliver of darkness
    light('moon', 'SUN', rot=(R(50), 0, R(160)), color=(0.6, 0.5, 0.9), energy=1.2)
    fsun = light('flash_sun', 'SUN', rot=(R(30), 0, R(200)), color=(0.8, 0.5, 1.0), energy=0, shadow=False)
    flashes(sc, [(20, 1.0), (58, 0.8), (110, 0.9), (150, 1.0), (196, 0.8)], 216, lights=[(fsun, 4.0)])
    bolt('pb1', (-40, 60, 120), (-25, 40, 20), [20, 110], color=(0.75, 0.4, 1.0), seed=11, width=1.0)
    bolt('pb2', (45, 70, 120), (30, 45, 25), [58, 150, 196], color=(0.75, 0.4, 1.0), seed=12, width=1.0)
    ground = lambda x, y: (abs(x) ** 1.3) * 0.25
    kn, sw, sh = old_knight(m)
    # sheathed copy on the hip until the draw
    sheath = sword('sheathed_sword', m['steel'], m['gold'], m['leather'], length=0.9)
    attach(sheath, kn.p['hips'], (0.2, -0.05, -0.05), (-160, 0, 15))

    def hero(f):
        if f <= 140:
            p = walk(f / 30, 0.85, lean=7)
            p['upper_arm_R'] = arm('R', 5 + 10 * math.sin(f / 30 * 6.28), 12)
            return p
        stop = smooth((f - 160) / 10)
        p = blend(walk(f / 30, 0.85 * (1 - stop), lean=7), idle(f, 0.4), stop)
        p['head'] = lerp(p['head'], (-8, 0, 0), stop)
        reach_u, reach_f = aim_arm((0.25, -0.5, -0.8), (0.9, 0.1, -0.2), (0, -1, 0))
        reach = dict(p); reach['upper_arm_R'] = reach_u; reach['forearm_R'] = reach_f; reach['torso'] = (10, 0, 25)
        return ptrack([(141, p), (176, p), (188, reach), (192, reach), (204, add(GUARD, {'head': (-8, 0, 0)})), (216, add(GUARD, {'head': (-10, 0, 0)}))], f) if f > 176 else p
    bake(kn, 1, 80, hero, start=(0.0, -62), heading=180, locomote=True, ground=ground, wind=1.0)
    bake(kn, 81, 140, hero, start=(0.0, -40), heading=180, locomote=True, ground=ground, wind=1.0)
    bake(kn, 141, 216, hero, start=(0.0, -21), heading=180, locomote=True, ground=ground, wind=1.0)
    for f, v in ((1, 1), (191, 1), (192, 0)):
        sheath.scale = (v,) * 3; sheath.keyframe_insert('scale', frame=f)
        sw.scale = (1 - v,) * 3; sw.keyframe_insert('scale', frame=f)
    # a gigantic shadow crossing behind the gate gap
    dr = dragon('shadow_dragon', m['scales'], m['belly'], m['wing'], m['horn'], m['eye_red'], scale=3.0)
    for f in range(140, 217):
        t = smooth((f - 146) / 50)
        dr.root.location = (lerp(-34, 30, t), 15, 1.8 * 3.0)
        dr.root.rotation_euler = (0, 0, R(-95))
        dr.root.keyframe_insert('location', frame=f); dr.root.keyframe_insert('rotation_euler', frame=f)
        dr.set(dragon_pose(f, fold=1.0, neck=(10, -20), look=-40 * smooth((f - 170) / 15)), f)
    hide_between(all_objs(dr), 140)
    # cameras
    ca, ta = camera('S7_cam_wide', 30)
    shoot(ca, ta, 1, 80, [(1, (18, -95, 14)), (80, (12, -88, 12))], [(1, (0, -40, 8)), (80, (0, -10, 16))])
    cb, tb = camera('S7_cam_track', 28)
    follow_cam(cb, tb, kn, 81, 140, lambda f: (-2.4 + (f - 81) * 0.008, -1.4 + (f - 81) * 0.02, 1.4), look=(0, 0, 1.5))
    cc, tcc = camera('S7_cam_gate', 26)
    shoot(cc, tcc, 141, 216, [(141, (2.5, -26, 1.4)), (180, (1.2, -22, 0.9)), (216, (0.9, -17.2, 0.7))],
          [(141, (0, -15, 2.0)), (180, (0, 0, 5)), (216, (0, 0, 6))])
    cut(sc, 1, ca); cut(sc, 81, cb); cut(sc, 141, cc)
    return sc


# ====================================================================== SCENE 8
def scene8():
    sc = new_scene('S8_TheFinalRevelation', 120, fog=(0.1, 0.07, 0.14), near=10, far=230, ambient=(0.08, 0.06, 0.1),
                   sky_top=(0.02, 0.01, 0.04), sky_hor=(0.18, 0.1, 0.24), clouds=0.8, flash_color=(0.75, 0.45, 1.0))
    m, s = M(), sm()
    fort, doors = fortress(m, s)
    for f in range(1, 121):
        o = smooth((f - 4) / 56)
        for sx, d in zip((-1, 1), doors):
            d.rotation_euler = (0, 0, R(sx * lerp(-6, -105, o)))
            d.keyframe_insert('rotation_euler', frame=f)
    light('moon', 'SUN', rot=(R(50), 0, R(160)), color=(0.6, 0.5, 0.9), energy=1.2)
    fsun = light('flash_sun', 'SUN', rot=(R(30), 0, R(200)), color=(0.8, 0.5, 1.0), energy=0, shadow=False)
    flashes(sc, [(30, 0.8), (78, 1.0), (100, 0.9)], 120, lights=[(fsun, 4.0)])
    bolt('pb1', (-30, 60, 120), (-20, 40, 25), [30, 100], color=(0.75, 0.4, 1.0), seed=13, width=1.0)
    bolt('pb2', (35, 70, 120), (25, 45, 25), [78], color=(0.75, 0.4, 1.0), seed=14, width=1.0)
    eye_light = light('dragon_eye_light', 'POINT', (0, 6, 9), (1.0, 0.25, 0.05), 0, shadow=False)
    ground = lambda x, y: (abs(x) ** 1.3) * 0.25
    kn, sw, sh = old_knight(m)
    bake(kn, 1, 120, lambda f: add(ptrack([(1, GUARD), (70, GUARD), (82, BLOCK), (120, BLOCK)], f), {'head': (-15 * smooth((f - 40) / 30), 0, 0)}),
         start=(0, -12), heading=180, ground=ground, wind=1.2)
    # the ancient dragon
    dr = dragon('ancient', m['scales'], m['belly'], m['wing'], m['horn'], m['eye_red'], scale=3.4)
    for f in range(1, 121):
        come = smooth((f - 20) / 60)
        roar = smooth((f - 80) / 10)
        dr.root.location = (0, lerp(26, 12, come), 1.75 * 3.4)
        dr.root.keyframe_insert('location', frame=f)
        dr.set(dragon_pose(f, flap=0.2 * roar, flap_speed=0.7, fold=1 - 0.8 * smooth((f - 60) / 25), jaw=roar, head_lift=lerp(-20, 30, come),
                           neck=(lerp(10, -15, come), 0), legs='stand', breath=1.0), f)
        eye_light.data.energy = 3000 * come; eye_light.data.keyframe_insert('energy', frame=f)
    # cut to black
    ca, ta = camera('S8_cam', 22)
    shoot(ca, ta, 1, 120, [(1, (7, -16, 1.6)), (50, (4, -18, 1.0)), (108, (0.7, -17.6, 0.55)), (120, (0.7, -17.6, 0.55))],
          [(1, (0, 2, 6)), (60, (0, 3, 9)), (108, (0, 2, 13)), (120, (0, 2, 13))])
    card = obj('black_card', [quad(4, 4, (0, 0, -0.3), axis='XY')], [mat('black_card', None, (0, 0, 0), fog=0.0)], parent=ca)
    for f, v in ((1, 0), (108, 0), (109, 1)):
        card.scale = (v,) * 3; card.keyframe_insert('scale', frame=f)
    cut(sc, 1, ca)
    return sc
