"""Shared character looks so the hero stays identical across scenes."""
from actors import *


def M():
    return dict(
        armor=mat('armor', 'metal', (0.95, 0.95, 1.0), scale=1.6),
        armor_old=mat('armor_old', 'metal_dark', (1.35, 1.3, 1.25), scale=1.6, seed=3),
        armor_sold=mat('armor_sold', 'metal', (0.6, 0.62, 0.68), scale=1.6, seed=5),
        rust=mat('rust', 'metal_dark', (0.75, 0.6, 0.5), scale=1.6, seed=9),
        red=mat('red', 'cloth_red', scale=2.0),
        red_old=mat('red_old', 'cloth_red', (0.7, 0.6, 0.6), scale=2.0, seed=4),
        blue=mat('blue', 'cloth_blue', scale=2.0),
        brown=mat('brown', 'cloth_brown', scale=2.0),
        grey=mat('grey', 'cloth_grey', scale=2.0),
        black=mat('black', 'cloth_black', scale=2.0),
        purple=mat('purple', 'cloth_purple', scale=2.0),
        leather=mat('leather', 'cloth_brown', (0.45, 0.35, 0.3), scale=3.0, seed=2),
        skin=mat('skin', 'skin', scale=3.0),
        skin_old=mat('skin_old', 'skin_old', scale=3.0),
        hair=mat('hair', 'hair', scale=4.0),
        hair_grey=mat('hair_grey', 'hair_grey', scale=4.0),
        gold=mat('gold', 'gold', scale=3.0),
        bone=mat('bone', 'bone', scale=1.5),
        goblin=mat('goblin', 'goblin', scale=2.5),
        demon=mat('demon', 'demon', scale=0.8, emit=None),
        horn=mat('horn', 'bone', (0.35, 0.3, 0.27), scale=2.0, seed=6),
        eye_red=mat('eye_red', None, (0, 0, 0), emit=(1.0, 0.15, 0.02), emit_strength=6, fog=0.2),
        eye_green=mat('eye_green', None, (0, 0, 0), emit=(0.3, 1.0, 0.4), emit_strength=5, fog=0.2),
        eye_yellow=mat('eye_yellow', None, (0, 0, 0), emit=(1.0, 0.8, 0.1), emit_strength=5, fog=0.2),
        eye_none=mat('eye_none', None, (0.02, 0.02, 0.02)),
        steel=mat('steel', 'metal', (1.1, 1.1, 1.15), scale=4.0, seed=8),
        wood=mat('wood', 'wood', scale=2.0),
        emblem=mat('emblem', 'emblem', flat=('XZ', 0.56, 0.74)),
        scales=mat('scales', 'scales', scale=1.2),
        belly=mat('belly', 'bone', (0.55, 0.42, 0.3), scale=1.0, seed=11),
        wing=mat('wing', 'scales', (0.55, 0.4, 0.4), scale=0.6, seed=12),
        cloak=mat('cloak', 'cloth_black', (0.5, 0.45, 0.6), scale=1.5, emit=(0.05, 0.015, 0.09), emit_strength=1.0, fog=0.5),
        dark=mat('dark', None, (0.015, 0.015, 0.02)),
    )


def knight(name, m, age='adult', scale=1.0, **kw):
    """age: 'child' | 'teen' | 'adult' | 'old'. Same silhouette: red crest/cape, exaggerated BBL."""
    if age == 'child':
        look = dict(body=m['skin'], cloth=m['brown'], dark=m['leather'], eyes=m['eye_none'], skin=m['skin'], hair=m['hair'], gold=m['gold'],
                    head='child', head_scale=1.3, bbl=0.2, sleeve=C, sleeve_lo=S, legs=C, boots=D, belt=True, cape=m['red'], cape_segs=1)
        return humanoid(name, look, scale=0.56 * scale, **kw)
    if age == 'teen':
        look = dict(body=m['skin'], cloth=m['brown'], dark=m['leather'], eyes=m['eye_none'], skin=m['skin'], hair=m['hair'], gold=m['gold'],
                    head='human', head_scale=1.1, bbl=0.2, sleeve=C, sleeve_lo=S, legs=C, boots=D, belt=True, cape=m['red'], cape_segs=2)
        return humanoid(name, look, scale=0.8 * scale, **kw)
    old = age == 'old'
    look = dict(body=m['leather'], armor=m['armor_old' if old else 'armor'], cloth=m['red_old' if old else 'red'], dark=m['leather'],
                eyes=m['eye_none'], skin=m['skin'], hair=m['hair'], gold=m['gold'], head='great', bbl=0.22, plume=True,
                cape=m['red_old' if old else 'red'], cape_segs=2, tabard=True, chainmail=True, torn=old, cracks=old, bulk=1.05)
    return humanoid(name, look, scale=1.0 * scale, **kw)


def arm_knight(rig, m, wooden=False, shield_on=True, sheathed=False):
    sw = sword(rig.name + '_sword', m['wood'] if wooden else m['steel'], m['wood'] if wooden else m['gold'], m['leather'],
               length=0.6 if wooden else 0.9, wooden=wooden)
    hold_sword(rig, sw)
    sh = None
    if shield_on:
        sh = shield(rig.name + '_shield', m['emblem'], m['armor'])
        hold_shield(rig, sh)
    return sw, sh


def soldier(name, m, seed=0, weapon='spear', **kw):
    look = dict(body=m['leather'], armor=m['armor_sold'], cloth=m['blue'], dark=m['leather'], eyes=m['eye_none'], skin=m['skin'],
                hair=m['hair'], gold=m['armor_sold'], head='kettle', tabard=True, chainmail=True, bbl=0.11)
    r = humanoid(name, look, **kw)
    if weapon == 'spear':
        attach(spear(name + '_spear', m['wood'], m['steel']), r.p['hand_R'], (0, -0.01, -0.06), (0, 0, 0))
    else:
        hold_sword(r, sword(name + '_sword', m['steel'], m['armor_sold'], m['leather'], length=0.8))
    return r


def undead(name, m, broken=True, **kw):
    look = dict(body=m['bone'], cloth=m['rust'], dark=m['dark'], eyes=m['eye_green'], skin=m['bone'], hair=m['black'], gold=m['rust'],
                armor=None, head='skull', helm=True, thin=0.6, sleeve=B, sleeve_lo=B, legs=B, boots=G, bbl=0.08, cape=m['black'], torn=True, cape_segs=2)
    r = humanoid(name, look, **kw)
    sw = sword(name + '_sword', m['rust'], m['rust'], m['dark'], length=0.85, broken=broken)
    hold_sword(r, sw)
    return r


def goblin(name, m, **kw):
    look = dict(body=m['goblin'], cloth=m['brown'], dark=m['leather'], eyes=m['eye_yellow'], skin=m['goblin'], hair=m['horn'], gold=m['bone'],
                head='goblin', head_scale=1.35, thin=0.8, sleeve=S, sleeve_lo=S, legs=S, boots=S, claws=True, bbl=0.08)
    r = humanoid(name, look, scale=0.62, **kw)
    d = sword(name + '_knife', m['rust'], m['bone'], m['leather'], length=0.3)
    hold_sword(r, d)
    return r


def demon(name, m, scale=3.2, **kw):
    look = dict(body=m['demon'], cloth=m['demon'], dark=m['dark'], eyes=m['eye_red'], skin=m['demon'], hair=m['horn'], gold=m['horn'],
                head='demon', bulk=1.35, sleeve=B, sleeve_lo=B, legs=B, boots=H, hooves=True, claws=True, bbl=0.1)
    return humanoid(name, look, scale=scale, **kw)


def giant_skeleton(name, m, scale=5.0, **kw):
    look = dict(body=m['bone'], cloth=m['bone'], dark=m['dark'], eyes=m['eye_green'], skin=m['bone'], hair=m['bone'], gold=m['bone'],
                head='giant_skull', skeleton=True, thin=0.55, claws=True)
    return humanoid(name, look, scale=scale, **kw)


def trainer(name, m, **kw):
    look = dict(body=m['leather'], armor=m['armor_old'], cloth=m['grey'], dark=m['leather'], eyes=m['eye_none'], skin=m['skin_old'],
                hair=m['hair_grey'], gold=m['armor_old'], head='bald', beard=True, bulk=1.12, chainmail=True, bbl=0.11, tabard=True,
                cape=m['grey'], cape_segs=2, torn=True)
    return humanoid(name, look, **kw)


def king(name, m, **kw):
    look = dict(body=m['purple'], cloth=m['purple'], dark=m['leather'], eyes=m['eye_none'], skin=m['skin_old'], hair=m['hair_grey'], gold=m['gold'],
                head='crown', beard=True, robe=True, sleeve=C, sleeve_lo=C, legs=C, boots=C, cape=m['purple'], cape_segs=3, bbl=0.11)
    return humanoid(name, look, **kw)


def villager(name, m, robe=True, cloth='grey', **kw):
    look = dict(body=m['skin'], cloth=m[cloth], dark=m['leather'], eyes=m['eye_none'], skin=m['skin'], hair=m['hair'], gold=m['gold'],
                head='human', robe=robe, sleeve=C, sleeve_lo=S, legs=C, boots=D, bbl=0.11)
    return humanoid(name, look, **kw)
