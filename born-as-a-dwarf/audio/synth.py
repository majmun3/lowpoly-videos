"""Original procedural score + sound design for WHAT IF YOU WERE BORN AS A DWARF?
Serious, epic medieval orchestra; the comedy lives in the sound design (and the silences).
Built on the project's synthesis toolkits; every sound is generated from scratch.
Usage: python synth.py VO_DIR OUT_DIR
"""
import os, sys, math, importlib.util
import numpy as np, soundfile as sf
from importlib.machinery import SourceFileLoader
HERE = os.path.dirname(os.path.abspath(__file__))
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
ROOT = os.path.join(HERE, '..', '..')
gb = load('goblinsynth', os.path.join(ROOT, 'born-as-a-goblin', 'audio', 'synth.py'))
dr, syn, ep2, ep3 = gb.dr, gb.syn, gb.ep2, gb.ep3
TL = SourceFileLoader('timeline_dwarf', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, dr, gb, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, crackle_track, footstep = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.crackle_track, syn.footstep
horn_note, heavy_step, thunder = ep3.horn_note, ep3.heavy_step, ep3.thunder
flute, melody, birds, leaves_wind, thud, growl, clang = gb.flute, gb.melody, gb.birds, gb.leaves_wind, gb.thud, gb.growl, gb.clang
dragon_roar, flame, crowd = dr.dragon_roar, dr.flame, dr.crowd
creak = ep2.creak
brass_swell = dr.syn.brass_swell
C = TL.CUES

# ---------------------------------------------------------------- the comedy, done seriously
def wub(seed=0, f=78, dur=0.32, k=1.0):
    """The wobble: a soft, rubbery low 'flub' — felt more than heard."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    fr = f * (1 + 0.6 * np.exp(-t * 18)) * (1 + 0.08 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 6))
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 9) + fft_filter(r.randn(n), 60, 400) * np.exp(-t * 22) * 0.25
    return (s * k * 0.55).astype(np.float32)
def wobble(B, t0, seed=0, n=4, gain=0.5, f=78, period=0.16):
    for i in range(n): place(B, wub(seed + i, f * (1 - i * 0.04), 0.3), t0 + i * period, gain * (0.82 ** i), (-0.2, 0.2)[i % 2])
def quake_step(B, t0, seed=0, gain=1.0):
    place(B, thud(seed, 46), t0, 0.9 * gain); place(B, rumble(0.9, seed + 1, 18, 120), t0, 0.7 * gain)
    place(B, noise_burst(0.25, 2500, 8000, 0.002, 16, seed + 2), t0 + 0.04, 0.12 * gain, 0.4)     # pebbles and pots rattle
    place(B, wub(seed + 3, 70, 0.32), t0 + 0.06, 0.32 * gain)
def splat(seed=0, size=1.0):
    n = int(1.2 * SR); t = tt(n); r = np.random.RandomState(seed)
    body = np.sin(2 * np.pi * 55 * t * (1 + np.exp(-t * 25))) * np.exp(-t * 7)
    sq = fft_filter(r.randn(n), 200, 1800) * np.exp(-t * 6) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t))
    drip = sum(np.sin(2 * np.pi * (700 + r.rand() * 500) * (t - d)) * np.exp(-np.maximum(t - d, 0) * 40) * (t > d) * 0.08 for d in r.rand(6) * 0.8 + 0.15)
    return ((body + sq * 0.7 + drip) * size).astype(np.float32)
def anvil(seed=0, f=1180, dur=2.4, slow=1.0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    s = sum(np.sin(2 * np.pi * f * m / slow * t + r.rand() * 6) * np.exp(-t * d * slow) * a for m, d, a in [(1, 2.2, 1.0), (2.41, 3.1, 0.5), (3.9, 4.0, 0.35), (5.3, 6.0, 0.2)])
    hit = fft_filter(r.randn(n), 1500, 9000) * np.exp(-t * 60 * slow) * 0.8
    return ((s * 0.5 + hit) * np.minimum(t / 0.001, 1)).astype(np.float32)
def laugh(t0, B, seed=0, n=8, f0=96, gain=1.0):
    """The orc king's laugh: heavy, rhythmic 'HAH' bursts, each lower than the last."""
    r = np.random.RandomState(seed); t = t0
    for i in range(n):
        d = 0.2 + r.rand() * 0.05; s = syn.roar(d, f0 * (1.15 - i * 0.03), seed + i, growl=1.3)
        e = np.sin(np.pi * np.arange(len(s)) / len(s)) ** 0.6; place(B, s * e, t, gain * (1 - i * 0.05)); t += d + 0.07 + r.rand() * 0.03
def whistle_fall(dur=1.75, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    wind = fft_filter(r.randn(n), 300, 2200) * (0.4 + 0.6 * np.sin(np.pi * t / dur))
    return (wind * 0.6).astype(np.float32)

# ---------------------------------------------------------------- MUSIC (A minor → A major)
VILLAGE = [('A4', 1), ('C5', 0.5), ('D5', 0.5), ('E5', 1.5), ('D5', 0.5), ('C5', 1), ('B4', 0.5), ('G4', 0.5), ('A4', 2)]
HERO = [('A3', 1), ('E4', 1), ('D4', 0.5), ('C4', 0.5), ('D4', 1), ('E4', 2)]
KING = [('A3', 1), ('C#4', 0.5), ('D4', 0.5), ('E4', 1.5), ('F#4', 0.5), ('A4', 1), ('G#4', 0.5), ('E4', 0.5), ('A4', 2)]
H = lambda f, d, seed=0: horn_note(f, d, att=0.1, seed=seed)
def roll(M, t0, t1, f=70, g0=0.2, g1=0.8, seed=0):
    t = t0; k = 0
    while t < t1: u = (t - t0) / (t1 - t0); place(M, taiko(f, 0.4, seed + k), t, g0 + (g1 - g0) * u); k += 1; t += max(0.06, 0.28 * (1 - u))
def music():
    M = buf()
    # the valley: a vast, serious opening — choir, brass and drums
    place(M, choir_chord(['A2', 'E3', 'A3', 'C4', 'E4'], 4.2, 'a', att=0.4, rel=0.4, seed=1, bright=1.3), 0.0, 0.6)
    place(M, brass_swell(['A1', 'E2', 'A2', 'C3'], 4.0, att=0.6, seed=2), 0.0, 0.45); place(M, taiko(44, 1.8, 1), 0.05, 1.0); place(M, taiko(44, 1.8, 2), 1.9, 0.8)
    place(M, melody(HERO[:4], 0.6, 0.55, H, 0.42, 5), 0, 1.0)
    # ...one problem. (silence) The reveal: one low drum and a held, deadly serious drone
    place(M, taiko(38, 2.2, 3), C['reveal'], 1.1); place(M, drone(hz('A1'), 3.2, att=0.05, rel=1.0, seed=4, bright=500), C['reveal'], 0.35)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C4'], 1.6, 'o', att=0.15, rel=0.9, seed=5), C['sting'], 0.55)
    # childhood: a gentle village theme on flute over light strings
    def gv(tm): return np.clip((tm - 7.4) / 0.6, 0, 1) * np.clip((15.3 - tm) / 0.3, 0, 1) * 0.6
    place(M, syn.strings_ostinato(['A2', 'F2', 'C2', 'G2'], 7.4, 96, 4, gv), 7.4, 0.3)
    place(M, melody(VILLAGE, 7.7, 0.42, flute, 0.3, 10), 0, 1.0); place(M, melody(VILLAGE[:5], 11.6, 0.42, flute, 0.26, 20), 0, 1.0)
    # warrior training: heroic, rising... and cut dead by the fall
    def gt(tm): return np.clip((tm - 15.3) / 0.8, 0, 1) * np.clip((20.45 - tm) / 0.05, 0, 1)
    place(M, syn.strings_ostinato(['A2', 'A2', 'F2', 'G2'], 15.3, 112, 3, gt), 15.3, 0.45)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C4', 'E4'], 5.1, 'a', att=1.5, rel=0.05, seed=12), 15.4, 0.55)
    place(M, melody(HERO, 15.9, 0.5, H, 0.45, 30), 0, 1.0); roll(M, 18.9, 20.4, 74, 0.2, 0.7, 40)
    tm = tt(N); M *= np.where((tm > 20.45) & (tm < 21.9), 0.0, 1.0)[:, None]
    # the comedic pause — then a single, solemn low string note
    place(M, drone(hz('E2'), 3.0, att=0.6, rel=1.2, seed=13, bright=420), 21.9, 0.25)
    # the forge: anvil rhythm, low choir, warmth
    t = 24.7; k = 0
    while t < 32.2: place(M, taiko(58, 0.7, 60 + k), t, 0.55 if k % 4 == 0 else 0.3); k += 1; t += 60 / 100 / 2 * (2 if k % 2 else 1)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F4'], 7.6, 'u', att=1.2, rel=0.8, seed=14), 24.7, 0.45); place(M, drone(hz('D2'), 7.6, att=1.0, rel=1.0, seed=15, bright=700), 24.7, 0.25)
    place(M, brass_swell(['D2', 'A2', 'D3', 'F3'], 2.4, att=0.05, seed=16), C['strike'], 0.4)
    # the invasion: war drums, minor choir, brass — building to the charge
    def gi(tm): return np.clip((tm - 32.3) / 1.0, 0, 1) * np.clip((46.0 - tm) / 0.08, 0, 1)
    place(M, syn.strings_ostinato(['A2', 'A2', 'G2', 'F2'], 32.3, 120, 7, gi), 32.3, 0.45)
    t = 32.3; k = 0
    while t < 46.0: place(M, taiko(46, 1.0, 100 + k), t, 0.7 if k % 2 == 0 else 0.4); k += 1; t += 0.5
    place(M, choir_chord(['A2', 'E3', 'A3', 'C4'], 5.6, 'a', att=1.5, rel=0.2, seed=17), 32.3, 0.5)
    place(M, choir_chord(['F2', 'C3', 'F3', 'A3'], 3.6, 'a', att=0.6, rel=0.2, seed=18), 36.0, 0.5)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C4', 'E4'], 6.6, 'a', att=0.1, rel=0.08, seed=19, bright=1.5), 39.4, 0.7)
    place(M, brass_swell(['A1', 'E2', 'A2', 'C3'], 6.5, att=0.3, seed=20), 39.4, 0.5); place(M, melody(HERO, 39.6, 0.6, H, 0.5, 50), 0, 1.0)
    # silence for the turn... then the hit: a colossal orchestral blow, and triumph
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 4.0, 'a', att=0.01, rel=2.0, seed=21, bright=1.7), C['hit'], 0.85)
    place(M, brass_swell(['A1', 'E2', 'A2', 'C#3'], 3.6, att=0.02, seed=22), C['hit'], 0.55); place(M, taiko(36, 2.4, 4), C['hit'], 1.4)
    place(M, melody(KING[:5], 50.6, 0.42, H, 0.45, 60), 0, 1.0)
    # the legend: a majestic finale in A major
    def gk(tm): return np.clip((tm - 53.0) / 1.2, 0, 1) * np.clip((63.8 - tm) / 0.8, 0, 1)
    place(M, syn.strings_ostinato(['A2', 'F#2', 'D2', 'E2'], 53.0, 92, 6, gk), 53.0, 0.4)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 5.0, 'a', att=1.2, rel=0.4, seed=23, bright=1.3), 53.0, 0.55)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4'], 3.4, 'a', att=0.5, rel=0.3, seed=24), 57.6, 0.55)
    place(M, melody(KING, 53.4, 0.5, H, 0.48, 70), 0, 1.0)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4', 'A4'], 3.4, 'a', att=0.3, rel=1.0, seed=25, bright=1.6), 60.6, 0.8)
    place(M, brass_swell(['A1', 'E2', 'A2', 'C#3'], 3.2, att=0.4, seed=26), 60.6, 0.5); place(M, taiko(40, 2.0, 5), 60.6, 1.1); place(M, taiko(36, 2.4, 6), 62.5, 1.0)
    M = reverb(M, 3.2, 0.32, damp=5000, seed=1)
    tm = tt(N); M *= np.where((tm > 3.95) & (tm < C['reveal']), 0.0, 1.0)[:, None]                      # the pause before the punchline
    M *= np.where((tm > 46.0) & (tm < C['hit'] - 0.01), 0.0, 1.0)[:, None]                                 # dramatic silence
    M *= np.clip((TL.DURATION - tm) / 0.8, 0, 1)[:, None]
    return M

def sfx():
    S = buf(); B = buf()
    # the valley and the village
    place(S, birds(0.0, 2.4, 1, 3.0), 0.0, 0.5); place(S, leaves_wind(0.0, 2.4, 2, 0.7), 0.0, 0.6)
    place(S, crackle_track(2.3, 7.4, 70, 0.5, 3, 0.2), 2.3, 0.9)                                        # the hearth
    place(S, creak(1.6, 140, 4), 4.5, 0.25); place(S, creak(1.4, 120, 5), 5.6, 0.2)                     # the cradle
    wobble(S, 4.7, 10, 5, 0.35, 92, 0.13); wobble(S, 5.6, 20, 4, 0.3, 96, 0.13)
    place(S, birds(7.4, 15.3, 6, 2.0), 7.4, 0.45); place(S, leaves_wind(7.4, 15.3, 7, 0.6), 7.4, 0.5)
    t = 7.5; k = 0
    while t < 11.0: place(S, noise_burst(0.08, 600, 3000, 0.001, 40, 30 + k), t, 0.25, (-0.4, 0.4)[k % 2]); place(S, thud(300 + k, 220), t, 0.12); k += 1; t += 0.42 + (k % 3) * 0.08   # wooden swords
    for i, ts in enumerate(C['kid_steps']): quake_step(S, ts, 50 + i * 5, 0.75)
    place(S, noise_burst(0.3, 400, 2500, 0.002, 14, 90), C['sword'], 0.3); place(S, thud(91, 260), C['sword'] + 0.12, 0.2)
    place(S, rumble(1.6, 92, 18, 120), C['big_shake'], 1.0); place(S, thud(93, 90), C['barrel'], 0.6); place(S, noise_burst(0.6, 150, 1500, 0.003, 6, 94), C['barrel'], 0.4)
    # the training yard
    place(S, leaves_wind(15.3, 24.7, 8, 0.5), 15.3, 0.45)
    place(S, whoosh(1.0, 250, 1200, 95, q=1.0), C['lift'] + 0.2, 0.4); place(S, heavy_step(96, 1.0), C['lift'] + 0.3, 0.5); place(S, heavy_step(97, 1.0), C['raised'], 0.4); wobble(S, C['raised'] + 0.05, 98, 3, 0.25)
    a, b = C['swing']; t = a; k = 0
    while t < b: place(S, whoosh(0.35, 300 + k * 60, 1800, 110 + k, q=1.2), t, 0.5 + k * 0.06, (-0.5, 0.5)[k % 2]); k += 1; t += max(0.14, 0.32 - k * 0.04)
    wobble(S, 19.3, 120, 5, 0.3, 80, 0.12)
    place(S, splat(130, 1.2), C['splat'], 1.1); place(S, heavy_step(131, 1.6), C['splat'], 0.6); wobble(S, C['splat'] + 0.08, 132, 6, 0.55, 74, 0.17)
    place(S, splat(140, 0.6), C['slip'], 0.7); wobble(S, C['slip'] + 0.05, 141, 4, 0.4, 76, 0.16)
    # the forge
    place(S, flame(7.6, 150, 1.0), 24.7, 0.35); place(S, crackle_track(24.7, 32.3, 120, 0.4, 151, 0.4), 24.7, 0.8)
    t = 24.75; k = 0
    while t < 32.2: place(S, anvil(160 + k, 1000 + (k % 4) * 140, 1.2), t, 0.22, (-0.6, -0.2, 0.3, 0.6)[k % 4]); k += 1; t += 0.77 / (1 + (k % 2) * 0.5)
    place(S, anvil(170, 1180, 3.2, slow=0.55), C['strike'], 1.0); place(S, noise_burst(0.8, 2500, 9000, 0.001, 6, 171), C['strike'], 0.3)
    place(S, heavy_step(172, 1.0), C['turn'], 0.4); wobble(S, C['turn'] + 0.15, 173, 4, 0.4, 82, 0.15)
    for i, ts in enumerate(C['forge_steps']): place(S, heavy_step(180 + i, 0.9), ts, 0.4); place(S, wub(190 + i, 80, 0.3), ts + 0.05, 0.22)
    # the invasion
    place(S, ep2.cold_wind()[int(32.3 * SR):int(49.6 * SR)] * 2.5, 32.3, 0.6)
    place(S, crowd(13.0, 200, 30) * 0.6, 32.3, 0.35); gb.army_stomp(32.3, 46.0, S, 2.0, 210, 0.28)
    for k in range(4): place(S, growl(1.4, 220 + k, 70 + k * 8), 33.0 + k * 2.6, 0.35, (-0.5, 0.5)[k % 2])
    place(S, horn_note(hz('A2'), 2.2, att=0.25, seed=230), C['horn'], 0.8); place(S, horn_note(hz('E3'), 1.4, att=0.2, seed=231), C['horn'] + 1.0, 0.5)
    place(S, heavy_step(232, 1.2), C['grab'] - 0.2, 0.4); place(S, noise_burst(0.35, 2000, 7000, 0.003, 10, 233), C['grab'], 0.35); place(S, metal_hit(1400, 0.8, 234, noise=0.5), C['grab'] + 0.05, 0.3)
    for i, ts in enumerate(C['charge_steps']):                                                        # slow-motion: low, heavy
        s = heavy_step(240 + i, 1.0); s = np.interp(np.arange(0, len(s), 0.55), np.arange(len(s)), s).astype(np.float32); place(S, s, ts, 0.55); place(S, wub(260 + i, 60, 0.45), ts + 0.06, 0.38)
    place(S, crowd(3.6, 270, 40) * 0.8, 39.4, 0.5)                                                     # the dwarves roar behind him
    # the secret weapon
    laugh(43.5, S, 300, 9, 92, 1.0); place(S, crowd(2.4, 310, 30) * 0.6, 43.8, 0.35)
    place(S, leaves_wind(46.0, 49.0, 311, 0.5), 46.0, 0.5)                                            # only the wind
    place(S, heavy_step(312, 0.8), 47.6, 0.3)
    place(S, rumble(3.0, 320, 16, 140), C['hit'], 1.6); place(S, noise_burst(1.6, 60, 4000, 0.001, 3, 321), C['hit'], 1.0); place(S, thud(322, 40), C['hit'], 1.2)
    place(S, whoosh(1.2, 2800, 300, 323, q=0.8), C['hit'] + 0.05, 0.6); wobble(S, C['hit'] + 0.08, 324, 7, 0.6, 68, 0.16)
    place(S, dragon_roar(1.4, 120, 325, 0.8), C['hit'] + 0.1, 0.45)
    a, b = C['fly']; place(S, whistle_fall(b - a, 330), a, 0.6); place(S, dragon_roar(1.2, 150, 331, 0.6) * np.linspace(1, 0.2, int(1.2 * SR))[:int(1.2 * SR)], a + 0.1, 0.35)
    place(S, rumble(2.6, 340, 18, 160), C['crash'], 1.2); place(S, noise_burst(1.6, 100, 3000, 0.002, 2.5, 341), C['crash'], 0.7)
    for i in range(6): place(S, thud(350 + i, 70 + i * 10), C['crash'] + 0.1 + i * 0.12, 0.4, (i % 3 - 1) * 0.5)
    place(S, crowd(2.0, 360, 30) * 0.8, C['crash'] + 0.1, 0.4)
    a, b = C['cheer']; place(S, crowd(b - a + 0.6, 370, 44) * 1.2, a, 0.6)
    # the legend
    place(S, crowd(9.0, 380, 50) * 0.35, 53.0, 0.3)                                                    # a hall full of murmuring subjects
    for i, ts in enumerate(C['king_steps']): place(S, heavy_step(390 + i, 0.8), ts, 0.3); place(S, wub(400 + i, 84, 0.28), ts + 0.05, 0.16)
    place(S, creak(1.0, 90, 410), C['sit'] - 0.15, 0.35); place(S, thud(411, 38), C['sit'], 1.1); place(S, rumble(1.2, 412, 18, 100), C['sit'], 0.6)
    wobble(S, C['sit'] + 0.06, 413, 6, 0.55, 72, 0.16); place(S, creak(1.6, 70, 414), C['sit'] + 0.2, 0.35)
    place(S, leaves_wind(60.6, 64.0, 415, 0.4), 60.6, 0.3)
    S = reverb(S, 1.4, 0.15, 6000, 2) + reverb(B, 2.4, 0.4, 6000, 3)
    tm = tt(N); S *= np.clip((TL.DURATION - tm) / 0.8, 0, 1)[:, None]
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); print('vo done')
    Mu = music(); print('music done')
    Sx = sfx(); print('sfx done')
    env = np.abs(V).max(1); win = int(0.2 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.45 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.25 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.6); Sx_d = norm(Sx_d, 0.82); Vn = norm(V, 0.9)
    mix = Vn + Mu_d * 0.62 + Sx_d * 0.74
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
