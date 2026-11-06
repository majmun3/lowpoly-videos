"""Core PS1/PS2-style helpers: scenes, pixel textures, fog-shaded materials, low-poly meshes, keying."""
import bpy, math, random
import numpy as np
from mathutils import Vector, Matrix, Euler

R = math.radians
RES = (360, 640)          # rendered low-res, upscaled x3 (nearest) to 1080x1920 in post
CUR = None                # scene new objects are linked into


# ---------------------------------------------------------------- scene
def new_scene(name, frames, fog=(0.1, 0.11, 0.14), near=15, far=120, ambient=(0.08, 0.08, 0.1),
              sky_top=(0.01, 0.01, 0.02), sky_hor=None, flash_color=(0.7, 0.75, 1.0), clouds=0.0):
    global CUR
    sc = bpy.data.scenes.new(name)
    CUR = sc
    r = sc.render
    r.engine = 'BLENDER_EEVEE'
    r.resolution_x, r.resolution_y = RES
    r.resolution_percentage = 100
    r.fps = 24
    r.filter_size = 0.6
    r.image_settings.file_format = 'PNG'
    sc.frame_start, sc.frame_end = 1, frames
    sc.view_settings.view_transform = 'Standard'
    sc.eevee.taa_render_samples = 2
    sc["fog_color"] = list(fog)
    sc["fog_near"] = float(near)
    sc["fog_far"] = float(far)
    sc["ambient"] = list(ambient)
    sc["flash"] = 0.0
    sc["flash_color"] = list(flash_color)
    sc.world = make_world(name, sky_top, sky_hor or fog, clouds)
    return sc


def attr(nt, name):
    a = nt.nodes.new('ShaderNodeAttribute')
    a.attribute_type = 'VIEW_LAYER'
    a.attribute_name = name
    return a


def make_world(name, top, hor, clouds):
    w = bpy.data.worlds.new(name + "_world")
    nt = w.node_tree
    nt.nodes.clear()
    L = nt.links.new
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L(tc.outputs['Generated'], sep.inputs[0])
    ramp = nt.nodes.new('ShaderNodeMapRange'); ramp.inputs['From Min'].default_value = -0.05; ramp.inputs['From Max'].default_value = 0.6
    L(sep.outputs['Z'], ramp.inputs['Value'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*hor, 1); mix.inputs['B'].default_value = (*top, 1)
    L(ramp.outputs[0], mix.inputs['Factor'])
    col = mix.outputs['Result']
    if clouds:   # chunky drifting cloud bands
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 3
        L(tc.outputs['Generated'], nz.inputs['Vector'])
        cr = nt.nodes.new('ShaderNodeMapRange'); cr.inputs['From Min'].default_value = 0.45; cr.inputs['From Max'].default_value = 0.75
        cr.inputs['To Max'].default_value = clouds
        L(nz.outputs['Fac'], cr.inputs['Value'])
        m2 = nt.nodes.new('ShaderNodeMix'); m2.data_type = 'RGBA'
        m2.inputs['B'].default_value = (*[c * 2.2 + 0.02 for c in hor], 1)
        L(cr.outputs[0], m2.inputs['Factor']); L(col, m2.inputs['A']); col = m2.outputs['Result']
    # lightning flash brightens sky
    fl = attr(nt, 'flash'); fc = attr(nt, 'flash_color')
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'ADD'
    sc = nt.nodes.new('ShaderNodeMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = 0.35
    L(fl.outputs['Fac'], sc.inputs[0]); L(sc.outputs[0], mul.inputs['Factor'])
    L(col, mul.inputs['A']); L(fc.outputs['Color'], mul.inputs['B'])
    bg = nt.nodes.new('ShaderNodeBackground'); L(mul.outputs['Result'], bg.inputs['Color'])
    out = nt.nodes.new('ShaderNodeOutputWorld'); L(bg.outputs[0], out.inputs[0])
    return w


# ---------------------------------------------------------------- pixel textures
def _q(a):  # quantize to 5 bits/channel like PS1 15-bit colour
    return np.round(a * 31) / 31


def _blocky(n, cells, rng):
    g = rng.random((cells, cells))
    return np.kron(g, np.ones((n // cells, n // cells)))


def _fbm(n, rng, octs=(4, 8, 16, 32), w=(0.4, 0.3, 0.2, 0.1)):
    return sum(_blocky(n, c, rng) * k for c, k in zip(octs, w))


def _pal(v, cols):
    cols = np.array(cols, float)
    v = np.clip(v, 0, 1) * (len(cols) - 1)
    i = np.minimum(v.astype(int), len(cols) - 2)
    f = (v - i)[..., None]
    return cols[i] * (1 - f) + cols[i + 1] * f


def _gen(kind, n, rng):
    y, x = np.mgrid[0:n, 0:n]
    nz = _fbm(n, rng)
    if kind == 'stone':
        row = y // 8
        bx = (x + (row % 2) * 8) // 16
        brick = rng.random((n, n))[row % n, bx % n] * 0.35
        mort = ((y % 8) == 0) | (((x + (row % 2) * 8) % 16) == 0)
        v = 0.35 + brick + nz * 0.35 - mort * 0.45
        return _pal(v, [(.12, .12, .14), (.28, .28, .31), (.45, .44, .45), (.6, .58, .56)])
    if kind == 'wood':
        plank = x // 11
        grain = np.sin(y * 0.35 + rng.random(16)[plank % 16] * 9 + nz * 4) * 0.12
        v = 0.45 + grain + rng.random(16)[plank % 16] * 0.2 + nz * 0.2 - ((x % 11) == 0) * 0.5
        return _pal(v, [(.1, .06, .03), (.27, .16, .08), (.42, .27, .14), (.55, .38, .2)])
    if kind == 'thatch':
        streak = rng.random(n)[x] * 0.5 + np.sin(y * 0.8 + x * 2.1) * 0.1
        v = 0.3 + streak + nz * 0.3 - ((y % 16) == 0) * 0.3
        return _pal(v, [(.12, .09, .04), (.3, .24, .1), (.48, .39, .18), (.6, .52, .27)])
    if kind in ('metal', 'metal_dark'):
        seam = ((y % 32) == 0) | ((x % 32) == 0)
        riv = ((y % 32) == 3) & ((x % 8) == 4)
        scratch = (rng.random((n, n)) > 0.97) * 0.25
        v = 0.5 + nz * 0.35 - seam * 0.35 + riv * 0.35 + scratch - ((y % 32) / 32) * 0.15
        if kind == 'metal':
            return _pal(v, [(.1, .1, .11), (.33, .34, .36), (.58, .58, .6), (.82, .82, .84)])
        rust = _fbm(n, rng) > 0.66
        c = _pal(v * 0.8, [(.06, .05, .05), (.22, .21, .21), (.4, .39, .39), (.6, .58, .56)])
        c[rust] = c[rust] * 0.5 + np.array([.33, .16, .07]) * 0.5
        return c
    if kind == 'chain':
        v = 0.4 + ((x + y) % 4 < 2) * 0.3 + ((x - y) % 4 < 1) * -0.2 + nz * 0.25
        return _pal(v, [(.05, .05, .06), (.25, .25, .27), (.5, .5, .52)])
    if kind.startswith('cloth'):
        base = {'cloth_red': [(.12, .01, .02), (.38, .04, .05), (.6, .1, .08)],
                'cloth_brown': [(.08, .05, .03), (.25, .16, .09), (.4, .28, .16)],
                'cloth_blue': [(.03, .04, .08), (.1, .14, .24), (.2, .26, .38)],
                'cloth_purple': [(.06, .02, .08), (.22, .06, .3), (.42, .16, .5)],
                'cloth_black': [(.02, .02, .03), (.07, .07, .09), (.14, .13, .16)],
                'cloth_grey': [(.12, .12, .12), (.3, .29, .27), (.5, .48, .44)]}[kind]
        v = 0.45 + ((x + y) % 2) * 0.08 + nz * 0.45
        return _pal(v, base)
    if kind == 'skin':
        return _pal(0.5 + nz * 0.3, [(.35, .22, .16), (.62, .45, .35), (.8, .64, .52)])
    if kind == 'skin_old':
        return _pal(0.4 + nz * 0.4, [(.3, .2, .16), (.55, .42, .36), (.72, .6, .52)])
    if kind == 'goblin':
        spots = _blocky(n, 16, rng) > 0.75
        return _pal(0.45 + nz * 0.4 - spots * 0.25, [(.05, .1, .03), (.2, .32, .1), (.4, .5, .2)])
    if kind == 'bone':
        crack = _blocky(n, 32, rng) > 0.92
        return _pal(0.6 + nz * 0.35 - crack * 0.4, [(.25, .22, .16), (.55, .5, .4), (.8, .76, .62), (.92, .9, .8)])
    if kind == 'scales':
        sy = y // 6; sx = (x + (sy % 2) * 4) % 8
        d = np.hypot(sx - 4, (y % 6) - 1) / 5
        v = 0.75 - d * 0.6 + nz * 0.25
        return _pal(v, [(.03, .01, .01), (.16, .03, .03), (.34, .08, .05), (.5, .18, .08)])
    if kind == 'demon':
        crack = np.abs(np.sin(nz * 14)) < 0.12
        c = _pal(0.4 + nz * 0.4, [(.03, .01, .01), (.12, .03, .03), (.25, .06, .05)])
        c[crack] = (.9, .25, .02)
        return c
    if kind == 'mud':
        return _pal(0.35 + nz * 0.55, [(.05, .04, .03), (.15, .11, .07), (.26, .2, .13), (.33, .27, .18)])
    if kind == 'grass':
        blade = (rng.random((n, n)) > 0.8) * 0.2
        return _pal(0.3 + nz * 0.5 + blade, [(.03, .05, .03), (.08, .13, .06), (.16, .22, .1), (.24, .3, .14)])
    if kind == 'rock':
        return _pal(0.3 + nz * 0.65, [(.05, .05, .06), (.14, .14, .16), (.26, .26, .28), (.4, .39, .38)])
    if kind == 'tile':
        chk = ((x // 16 + y // 16) % 2) * 0.25
        v = 0.35 + chk + nz * 0.3 - (((x % 16) == 0) | ((y % 16) == 0)) * 0.3
        return _pal(v, [(.05, .05, .06), (.18, .17, .17), (.36, .34, .33), (.5, .48, .45)])
    if kind == 'glass':
        cell = rng.integers(0, 5, (8, 8))[y // 8, x // 8]
        cols = np.array([(.8, .1, .1), (.1, .2, .8), (.9, .7, .1), (.2, .6, .2), (.6, .1, .7)])
        c = cols[cell] * (0.75 + nz[..., None] * 0.4)
        c[((x % 8) == 0) | ((y % 8) == 0)] = 0.02
        return c
    if kind == 'gold':
        return _pal(0.4 + nz * 0.6, [(.2, .12, .02), (.55, .38, .08), (.85, .66, .2), (1, .9, .5)])
    if kind == 'emblem':  # heater shield face: crimson field, pale sword-cross, gold border
        c = np.zeros((n, n, 3)) + np.array([.42, .04, .05]) * (0.8 + nz[..., None] * 0.4)
        cx = n // 2
        c[(np.abs(x - cx) < 3) & (y > 10) & (y < n - 8)] = (.85, .82, .72)
        c[(np.abs(y - 40) < 3) & (np.abs(x - cx) < 14)] = (.85, .82, .72)
        c[(x < 4) | (x > n - 5) | (y < 4) | (y > n - 5)] = (.75, .55, .15)
        return c
    if kind == 'hair':
        return _pal(0.3 + rng.random(n)[x] * 0.4 + nz * 0.3, [(.03, .02, .01), (.12, .07, .03), (.22, .14, .07)])
    if kind == 'hair_grey':
        return _pal(0.3 + rng.random(n)[x] * 0.4 + nz * 0.3, [(.3, .3, .3), (.55, .55, .55), (.8, .8, .78)])
    if kind == 'bark':
        v = 0.3 + rng.random(n)[x] * 0.35 + nz * 0.35
        return _pal(v, [(.03, .03, .03), (.1, .09, .08), (.2, .18, .16), (.3, .27, .23)])
    if kind == 'fog':  # alpha mask (greyscale)
        return np.repeat((_fbm(n, rng, (2, 4, 8, 16)) ** 1.5)[..., None], 3, 2)
    raise KeyError(kind)


_TEX = {}


def tex(kind, n=64, seed=1):
    key = f"{kind}_{seed}"
    if key in _TEX:
        return _TEX[key]
    c = _q(np.clip(_gen(kind, n, np.random.default_rng(seed)), 0, 1))
    rgba = np.concatenate([c, np.ones((n, n, 1))], 2)[::-1].astype(np.float32)  # blender rows bottom-up
    img = bpy.data.images.new("T_" + key, n, n)
    img.pixels.foreach_set(rgba.ravel())
    img.pack()
    _TEX[key] = img
    return img


# ---------------------------------------------------------------- materials
def ps1_group():
    """Diffuse lighting -> RGB, + ambient + lightning flash, then distance fog. Unlit-style output."""
    if 'PS1Shade' in bpy.data.node_groups:
        return bpy.data.node_groups['PS1Shade']
    g = bpy.data.node_groups.new('PS1Shade', 'ShaderNodeTree')
    g.interface.new_socket('Albedo', in_out='INPUT', socket_type='NodeSocketColor')
    g.interface.new_socket('Emission', in_out='INPUT', socket_type='NodeSocketColor')
    fm = g.interface.new_socket('FogMult', in_out='INPUT', socket_type='NodeSocketFloat'); fm.default_value = 1.0
    g.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')
    N, L = g.nodes.new, g.links.new
    gi = N('NodeGroupInput'); go = N('NodeGroupOutput')

    def mix(a, b, fac, mode='MIX'):
        m = N('ShaderNodeMix'); m.data_type = 'RGBA'; m.blend_type = mode; m.clamp_result = False
        for s, v in (('A', a), ('B', b), ('Factor', fac)):
            if isinstance(v, (int, float)):
                m.inputs[s if s != 'Factor' else 0].default_value = v
            else:
                L(v, m.inputs[s] if s != 'Factor' else m.inputs[0])
        return m.outputs['Result']

    def mul(a, b):
        return mix(a, b, 1.0, 'MULTIPLY')

    dif = N('ShaderNodeBsdfDiffuse'); L(gi.outputs['Albedo'], dif.inputs['Color'])
    s2r = N('ShaderNodeShaderToRGB'); L(dif.outputs[0], s2r.inputs[0])
    amb = mul(gi.outputs['Albedo'], attr(g, 'ambient').outputs['Color'])
    fl = attr(g, 'flash'); fc = attr(g, 'flash_color')
    flc = mul(gi.outputs['Albedo'], fc.outputs['Color'])
    lit = mix(s2r.outputs['Color'], amb, 1.0, 'ADD')
    lit = mix(lit, flc, fl.outputs['Fac'], 'ADD')
    lit = mix(lit, gi.outputs['Emission'], 1.0, 'ADD')
    cam = N('ShaderNodeCameraData')
    mr = N('ShaderNodeMapRange')
    L(cam.outputs['View Distance'], mr.inputs['Value'])
    L(attr(g, 'fog_near').outputs['Fac'], mr.inputs['From Min'])
    L(attr(g, 'fog_far').outputs['Fac'], mr.inputs['From Max'])
    fogf = N('ShaderNodeMath'); fogf.operation = 'MULTIPLY'
    L(mr.outputs[0], fogf.inputs[0]); L(gi.outputs['FogMult'], fogf.inputs[1])
    fl2 = N('ShaderNodeMath'); fl2.operation = 'MULTIPLY'; fl2.inputs[1].default_value = 0.25
    L(fl.outputs['Fac'], fl2.inputs[0])
    fogc = mix(attr(g, 'fog_color').outputs['Color'], fc.outputs['Color'], 0.0, 'ADD')
    m = fogc.node; L(fl2.outputs[0], m.inputs[0])
    out = mix(lit, fogc, fogf.outputs[0])
    em = N('ShaderNodeEmission'); L(out, em.inputs['Color'])
    L(em.outputs[0], go.inputs['Shader'])
    return g


_MAT = {}


def mat(name, kind=None, color=(1, 1, 1), scale=2.0, emit=None, emit_strength=1.0, seed=1, fog=1.0, flat=None):
    """kind: texture kind or None. flat: 'XZ'/'XY' planar 0..1 projection over given size (for emblems)."""
    if name in _MAT:
        return _MAT[name]
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    g = N('ShaderNodeGroup'); g.node_tree = ps1_group()
    g.inputs['FogMult'].default_value = fog
    out = N('ShaderNodeOutputMaterial'); L(g.outputs[0], out.inputs['Surface'])
    if kind:
        tc = N('ShaderNodeTexCoord')
        mp = N('ShaderNodeMapping')
        L(tc.outputs['Object'], mp.inputs['Vector'])
        it = N('ShaderNodeTexImage'); it.image = tex(kind, seed=seed); it.interpolation = 'Closest'
        if flat:
            sx, sz = flat[1], flat[2]
            mp.inputs['Scale'].default_value = (1 / sx, 1 / sz, 1)
            mp.inputs['Location'].default_value = (0.5, 0.5, 0)
            if flat[0] == 'XZ':
                mp.inputs['Rotation'].default_value = (R(-90), 0, 0)
                mp.inputs['Scale'].default_value = (1 / sx, 1, 1 / sz)
                mp.inputs['Location'].default_value = (0.5, 0.5, 0)
        else:
            mp.inputs['Scale'].default_value = (scale,) * 3
            it.projection = 'BOX'; it.projection_blend = 0.15
        L(mp.outputs[0], it.inputs[0])
        mx = N('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1
        L(it.outputs['Color'], mx.inputs['A']); mx.inputs['B'].default_value = (*color, 1)
        L(mx.outputs['Result'], g.inputs['Albedo'])
    else:
        g.inputs['Albedo'].default_value = (*color, 1)
    if emit:
        g.inputs['Emission'].default_value = (*[c * emit_strength for c in emit], 1)
    _MAT[name] = m
    return m


def glow_mat(name, color, strength=1.0, alpha_tex=None, alpha=1.0, scale=1.0):
    """Additive emissive material (fire, glows, rain, fog sheets, light shafts)."""
    if name in _MAT:
        return _MAT[name]
    m = bpy.data.materials.new(name)
    m.surface_render_method = 'BLENDED'
    m.use_backface_culling = False
    nt = m.node_tree; nt.nodes.clear(); N, L = nt.nodes.new, nt.links.new
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = (*color, 1)
    st = N('ShaderNodeMath'); st.operation = 'MULTIPLY'; st.inputs[1].default_value = strength * alpha
    st.inputs[0].default_value = 1.0
    if alpha_tex:
        tc = N('ShaderNodeTexCoord'); mp = N('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale,) * 3
        L(tc.outputs['Object'], mp.inputs[0])
        it = N('ShaderNodeTexImage'); it.image = tex(alpha_tex); it.interpolation = 'Closest'
        it.projection = 'BOX'
        L(mp.outputs[0], it.inputs[0]); L(it.outputs['Color'], st.inputs[0])
    L(st.outputs[0], em.inputs['Strength'])
    tr = N('ShaderNodeBsdfTransparent')
    add = N('ShaderNodeAddShader'); L(tr.outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1])
    out = N('ShaderNodeOutputMaterial'); L(add.outputs[0], out.inputs['Surface'])
    _MAT[name] = m
    return m


def dark_mat(name, color=(0, 0, 0), alpha=0.6):
    """Alpha-blended darkening sheet (smoke, shadows behind gates)."""
    if name in _MAT:
        return _MAT[name]
    m = bpy.data.materials.new(name); m.surface_render_method = 'BLENDED'; m.use_backface_culling = False
    nt = m.node_tree; nt.nodes.clear(); N, L = nt.nodes.new, nt.links.new
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = (*color, 1)
    tr = N('ShaderNodeBsdfTransparent')
    mx = N('ShaderNodeMixShader'); mx.inputs[0].default_value = alpha
    L(tr.outputs[0], mx.inputs[1]); L(em.outputs[0], mx.inputs[2])
    out = N('ShaderNodeOutputMaterial'); L(mx.outputs[0], out.inputs['Surface'])
    _MAT[name] = m
    return m


# ---------------------------------------------------------------- geometry
def loft(rings, sides=8, cap=(True, True), phase=None, axis='Z'):
    """rings: (z, rx, ry[, cx, cy]) ellipse sections along +Z. Returns (verts, faces)."""
    ph = math.pi / sides if phase is None else phase
    V, F = [], []
    for r in rings:
        z, rx, ry = r[:3]; cx, cy = (r[3], r[4]) if len(r) > 3 else (0, 0)
        for i in range(sides):
            a = ph + 2 * math.pi * i / sides
            V.append((cx + rx * math.cos(a), cy + ry * math.sin(a), z))
    for j in range(len(rings) - 1):
        for i in range(sides):
            a, b = j * sides + i, j * sides + (i + 1) % sides
            F.append((a, b, b + sides, a + sides))
    if cap[0]:
        F.append(tuple(reversed(range(sides))))
    if cap[1]:
        n = (len(rings) - 1) * sides
        F.append(tuple(range(n, n + sides)))
    if axis != 'Z':
        V = [(x, -z, y) for x, y, z in V] if axis == '-Y' else [(-x, z, y) for x, y, z in V]
    return V, F


def box(sx, sy, sz, c=(0, 0, 0)):
    x, y, z = sx / 2, sy / 2, sz / 2
    V = [(c[0] + a * x, c[1] + b * y, c[2] + d * z) for a in (-1, 1) for b in (-1, 1) for d in (-1, 1)]
    F = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return V, F


def cone(r, h, sides=6, c=(0, 0, 0), r2=0.0):
    if r2 > 0:
        return loft([(c[2], r, r, c[0], c[1]), (c[2] + h, r2, r2, c[0], c[1])], sides)
    V = [(c[0] + r * math.cos(2 * math.pi * i / sides), c[1] + r * math.sin(2 * math.pi * i / sides), c[2]) for i in range(sides)]
    V.append((c[0], c[1], c[2] + h))
    F = [(i, (i + 1) % sides, sides) for i in range(sides)] + [tuple(reversed(range(sides)))]
    return V, F


def sphere(r, seg=8, rings=5, c=(0, 0, 0), sy=1.0, sz=1.0):
    rs = []
    for j in range(1, rings):
        t = math.pi * j / rings
        rs.append((c[2] - r * sz * math.cos(t), r * math.sin(t), r * math.sin(t) * sy, c[0], c[1]))
    V, F = loft(rs, seg, cap=(False, False))
    nb, nt = len(V), len(V) + 1
    V += [(c[0], c[1], c[2] - r * sz), (c[0], c[1], c[2] + r * sz)]
    for i in range(seg):
        F.append(((i + 1) % seg, i, nb))
        k = (rings - 2) * seg
        F.append((k + i, k + (i + 1) % seg, nt))
    return V, F


def quad(w, h, c=(0, 0, 0), axis='XZ'):
    if axis == 'XZ':
        V = [(c[0] - w / 2, c[1], c[2]), (c[0] + w / 2, c[1], c[2]), (c[0] + w / 2, c[1], c[2] + h), (c[0] - w / 2, c[1], c[2] + h)]
    else:
        V = [(c[0] - w / 2, c[1] - h / 2, c[2]), (c[0] + w / 2, c[1] - h / 2, c[2]), (c[0] + w / 2, c[1] + h / 2, c[2]), (c[0] - w / 2, c[1] + h / 2, c[2])]
    return V, [(0, 1, 2, 3)]


def tube(path, radii, sides=5, cap=True):
    """Loft rings along a polyline (horns, tails, ribs, branches)."""
    V, F = [], []
    pts = [Vector(p) for p in path]
    n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        up = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        u = t.cross(up).normalized(); v = t.cross(u)
        r = radii[i] if isinstance(radii, (list, tuple)) else radii
        for k in range(sides):
            a = 2 * math.pi * k / sides
            V.append(tuple(p + (u * math.cos(a) + v * math.sin(a)) * r))
    for j in range(n - 1):
        for k in range(sides):
            a, b = j * sides + k, j * sides + (k + 1) % sides
            F.append((a, b, b + sides, a + sides))
    if cap:
        F.append(tuple(reversed(range(sides))))
        F.append(tuple(range((n - 1) * sides, n * sides)))
    return V, F


def arc(p0, p1, bulge, n=5, side=(0, 0, 1)):
    p0, p1, s = Vector(p0), Vector(p1), Vector(side)
    return [tuple(p0.lerp(p1, i / (n - 1)) + s * bulge * math.sin(math.pi * i / (n - 1))) for i in range(n)]


def xf(V, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    M = Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale))
    return [tuple(M @ Vector(v)) for v in V]


def jitter(V, amt, seed=0, axes=(1, 1, 1)):
    rnd = random.Random(seed)
    return [tuple(c + rnd.uniform(-amt, amt) * a for c, a in zip(v, axes)) for v in V]


def merge(parts):
    """parts: list of (V, F) or (V, F, mat_index). Returns V, F, mat_indices."""
    V, F, M = [], [], []
    for p in parts:
        off = len(V)
        V += list(p[0])
        F += [tuple(i + off for i in f) for f in p[1]]
        M += [p[2] if len(p) > 2 else 0] * len(p[1])
    return V, F, M


def obj(name, parts, mats, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), smooth=False, coll=None):
    if isinstance(parts, tuple):
        parts = [parts]
    V, F, M = merge(parts)
    me = bpy.data.meshes.new(name)
    me.from_pydata(V, [], F)
    me.validate()
    for m in (mats if isinstance(mats, (list, tuple)) else [mats]):
        me.materials.append(m)
    if len(me.polygons) == len(M):
        me.polygons.foreach_set('material_index', M)
    me.polygons.foreach_set('use_smooth', [smooth] * len(me.polygons))
    o = bpy.data.objects.new(name, me)
    (coll or CUR.collection).objects.link(o)
    o.parent = parent
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    return o


def empty(name, loc=(0, 0, 0), parent=None, rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    CUR.collection.objects.link(o)
    o.parent = parent; o.location = loc; o.rotation_euler = rot
    o.empty_display_size = 0.3
    return o


def light(name, kind='POINT', loc=(0, 0, 0), color=(1, 1, 1), energy=100, rot=(0, 0, 0), size=0.1, shadow=True, radius=None):
    ld = bpy.data.lights.new(name, kind)
    ld.color = color; ld.energy = energy; ld.use_shadow = shadow
    if kind == 'SUN':
        ld.angle = R(2)
    else:
        ld.shadow_soft_size = size
    if radius:
        ld.use_custom_distance = True; ld.cutoff_distance = radius
    o = bpy.data.objects.new(name, ld)
    CUR.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    return o


# ---------------------------------------------------------------- vertex wobble (PS1 snapping)
def wobble_group():
    if 'PS1Wobble' in bpy.data.node_groups:
        return bpy.data.node_groups['PS1Wobble']
    g = bpy.data.node_groups.new('PS1Wobble', 'GeometryNodeTree')
    g.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    st = g.interface.new_socket('Step', in_out='INPUT', socket_type='NodeSocketFloat'); st.default_value = 0.02
    g.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, L = g.nodes.new, g.links.new
    gi = N('NodeGroupInput'); go = N('NodeGroupOutput')
    so = N('GeometryNodeSelfObject')
    oi = N('GeometryNodeObjectInfo'); oi.transform_space = 'ORIGINAL'
    L(so.outputs[0], oi.inputs['Object'])
    pos = N('GeometryNodeInputPosition')
    tw = N('FunctionNodeTransformPoint'); L(pos.outputs[0], tw.inputs['Vector']); L(oi.outputs['Transform'], tw.inputs['Transform'])
    sn = N('ShaderNodeVectorMath'); sn.operation = 'SNAP'
    L(tw.outputs[0], sn.inputs[0])
    cv = N('ShaderNodeCombineXYZ')
    for k in 'XYZ':
        L(gi.outputs['Step'], cv.inputs[k])
    L(cv.outputs[0], sn.inputs[1])
    inv = N('FunctionNodeInvertMatrix'); L(oi.outputs['Transform'], inv.inputs[0])
    tb = N('FunctionNodeTransformPoint'); L(sn.outputs[0], tb.inputs['Vector']); L(inv.outputs[0], tb.inputs['Transform'])
    sp = N('GeometryNodeSetPosition'); L(gi.outputs['Geometry'], sp.inputs['Geometry']); L(tb.outputs[0], sp.inputs['Position'])
    L(sp.outputs[0], go.inputs['Geometry'])
    return g


def wobble(o, step=0.015):
    m = o.modifiers.new('PS1Wobble', 'NODES')
    m.node_group = wobble_group()
    m.properties.inputs.Socket_1.value = step
    return m


# ---------------------------------------------------------------- animation keying
def key(o, path, f, v=None, index=-1):
    if v is not None:
        setattr(o, path, v)
    o.keyframe_insert(path, frame=f, index=index)


def keyprop(idb, prop, f, v):
    idb[prop] = v
    idb.keyframe_insert(f'["{prop}"]', frame=f)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    if isinstance(a, (int, float)):
        return a + (b - a) * t
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def track(keys, f, ease=smooth):
    """keys: [(frame, value)], eased piecewise interpolation."""
    if f <= keys[0][0]:
        return keys[0][1]
    for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
        if f <= f1:
            return lerp(v0, v1, ease((f - f0) / (f1 - f0)))
    return keys[-1][1]


def spline(keys, f):
    """Camera paths: Catmull-Rom through keys (C1, no stop at inner keys), soft ease at both ends."""
    if len(keys) == 2:
        return track(keys, f)
    F0, F1 = keys[0][0], keys[-1][0]
    u = min(1.0, max(0.0, (f - F0) / (F1 - F0)))
    g = F0 + (0.5 * u + 0.5 * smooth(u)) * (F1 - F0)
    i = max(k for k in range(len(keys) - 1) if keys[k][0] <= g) if g > F0 else 0
    i = min(i, len(keys) - 2)
    t = (g - keys[i][0]) / (keys[i + 1][0] - keys[i][0])
    p1, p2 = Vector(keys[i][1]), Vector(keys[i + 1][1])
    p0 = Vector(keys[i - 1][1]) if i > 0 else 2 * p1 - p2
    p3 = Vector(keys[i + 2][1]) if i + 2 < len(keys) else 2 * p2 - p1
    v = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3)
    return tuple(v)


def camera(name, lens=28, clip=2500):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_end = clip; cd.clip_start = 0.05
    cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 36
    c = bpy.data.objects.new(name, cd); CUR.collection.objects.link(c)
    t = empty(name + "_target")
    con = c.constraints.new('TRACK_TO'); con.target = t; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    return c, t


def shoot(cam, tgt, f0, f1, pos_keys, tgt_keys, shake=0.0, lens_keys=None, roll_keys=None, seed=3):
    """Bake camera + target per frame from eased key lists (frames absolute)."""
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 9) for _ in range(6)]
    for f in range(f0, f1 + 1):
        p = Vector(spline(pos_keys, f)); t = Vector(spline(tgt_keys, f))
        if shake:
            s = shake
            p += Vector((math.sin(f * 0.9 + ph[0]) + math.sin(f * 2.3 + ph[1]) * 0.5,
                         math.sin(f * 1.1 + ph[2]) * 0.5, math.sin(f * 1.7 + ph[3]) + math.sin(f * 3.1 + ph[4]) * 0.4)) * s
        key(cam, 'location', f, p); key(tgt, 'location', f, t)
        if lens_keys:
            cam.data.lens = track(lens_keys, f); cam.data.keyframe_insert('lens', frame=f)


def cut(sc, f, cam):
    m = sc.timeline_markers.new(cam.name, frame=f)
    m.camera = cam
    if f == 1:
        sc.camera = cam


def flashes(sc, events, f_end, lights=()):
    """events: list of (frame, strength). Lightning: double-strobe decay. Keys scene['flash'] + given lights."""
    vals = [0.0] * (f_end + 2)
    for f0, s in events:
        for i, v in enumerate((1.0, 0.35, 0.9, 0.5, 0.25, 0.1)):
            if f0 + i <= f_end:
                vals[f0 + i] = max(vals[f0 + i], v * s)
    for f in range(1, f_end + 1):
        if f == 1 or vals[f] != vals[f - 1] or vals[f] != vals[f + 1]:
            keyprop(sc, 'flash', f, vals[f])
            for lo, e in lights:
                lo.data.energy = e * vals[f]; lo.data.keyframe_insert('energy', frame=f)
    return vals
