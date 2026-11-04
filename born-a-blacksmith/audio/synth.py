"""Original procedural score + sound design for BEING BORN AS A BLACKSMITH IN MEDIEVAL TIMES WAS HORRIFYING.
Hammer blows are placed on the exact contact frames of the animation. Usage: python synth.py VO_DIR OUT_DIR
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
TL = SourceFileLoader('timeline_smith', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, dr, gb, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, footstep, crackle_track = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.footstep, syn.crackle_track
gurdy, horn_note = ep3.gurdy, ep3.horn_note
flute, melody, birds, leaves_wind, thud = gb.flute, gb.melody, gb.birds, gb.leaves_wind, gb.thud
crowd, flame = dr.crowd, dr.flame
C = TL.CUES

def anvil_hit(seed=0, w=1.0, miss=False):
    """A heavy hammer on hot iron over an anvil: a dull, weighty strike with a short bright ring (a clean miss rings longer and higher)."""
    n = int(1.6 * SR); t = tt(n); r = np.random.RandomState(seed)
    f = (1650 if miss else 1180) * (1 + (r.rand() - 0.5) * 0.04)
    ring = sum(np.sin(2 * np.pi * f * m * t + r.rand() * 6) * np.exp(-t * d) * a for m, d, a in [(1, 7 if not miss else 2.2, 1.0), (2.41, 10, 0.5), (3.9, 14, 0.3), (5.3, 20, 0.2)])
    body = np.sin(2 * np.pi * 140 * t * (1 + np.exp(-t * 40))) * np.exp(-t * 18) * (0.6 if miss else 1.3)
    crack = fft_filter(r.randn(n), 1800, 10000) * np.exp(-t * 70) * 1.0
    sizz = fft_filter(r.randn(n), 3000, 9000) * np.exp(-t * 9) * 0.12
    return ((ring * (0.7 if miss else 0.45) + body + crack + (0 if miss else sizz)) * np.minimum(t / 0.0008, 1) * w).astype(np.float32)
def baby_cry(dur, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); out = np.zeros(n); tc = 0.0
    while tc < dur - 0.3:
        L = 0.6 + r.rand() * 0.4; i0, i1 = int(tc * SR), int(min(dur, tc + L) * SR); tl = np.arange(i1 - i0) / SR
        f = 420 * (1 + 0.25 * np.sin(np.pi * tl / L)) * (1 + 0.03 * np.sin(2 * np.pi * 7 * tl)); ph = np.cumsum(f) / SR; src = 2 * (ph % 1) - 1
        v = fft_filter(src, 700, 1400) * 1.2 + fft_filter(src, 2200, 3600) * 0.9 + fft_filter(src, 300, 600) * 0.3
        out[i0:i1] += np.tanh(v * 2) * np.sin(np.pi * tl / L) ** 0.6 * 0.4; tc += L + 0.15 + r.rand() * 0.2
    return out.astype(np.float32)
def bellows_puff(seed=0, dur=0.75):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); e = np.sin(np.pi * t / dur) ** 1.5
    return (fft_filter(r.randn(n), 120, 1400) * e * 0.9 + fft_filter(r.randn(n), 40, 160) * e * 0.6).astype(np.float32)
def creak(seed=0, dur=0.5, f0=160): return ep2.creak(dur, f0, seed)
def hiss(dur, seed=0): n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); e = np.minimum(t / 0.03, 1) * np.exp(-t * 1.8); return (fft_filter(r.randn(n), 2500, 11000) * e * 1.1 + fft_filter(r.randn(n), 400, 2000) * e * 0.4).astype(np.float32)
def cloth(seed=0, dur=0.3): n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); return (fft_filter(r.randn(n), 1500, 6000) * np.sin(np.pi * t / dur) * 0.25).astype(np.float32)
def breath(dur, seed=0, rate=0.4):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); e = np.maximum(0, np.sin(2 * np.pi * rate * t)) ** 2
    return (fft_filter(r.randn(n), 300, 2400) * e * 0.35).astype(np.float32)
def crickets(t0, t1, seed=0):
    n = int((t1 - t0) * SR); t = tt(n); r = np.random.RandomState(seed); s = np.zeros(n)
    for k in range(3): f = 4200 + k * 700; s += np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * (2.2 + k * 0.4) * t) > 0.6) * (0.5 + 0.5 * np.sin(2 * np.pi * 40 * t)) * 0.05
    return (s * np.minimum(t / 0.5, 1) * np.clip((t1 - t0 - t) / 0.5, 0, 1)).astype(np.float32)

THEME = [('D4', 1.5), ('E4', 0.5), ('F4', 1), ('A4', 1), ('G4', 1.5), ('F4', 0.5), ('E4', 2)]
SAD = [('A3', 1.5), ('C4', 0.5), ('D4', 1), ('F4', 1), ('E4', 2), ('D4', 3)]
def music():
    M = buf()
    def gnote(nm, t0, dur, g, seed):
        f0 = hz(nm); n = int(dur * SR); t = tt(n); s = sum(osc(syn.choir_table(f0 * m, 'a'), f0 * m, n, drift=0.0004, seed=seed + i) for i, m in enumerate((1, 1.5, 2)))
        s = s * (0.85 + 0.15 * (np.sin(2 * np.pi * 5.5 * t) > 0.6)) * adsr(n, min(0.12, dur * 0.2), 0.05, 0.9, min(0.3, dur * 0.3))
        place(M, fft_filter(s / 3, 60, 2400), t0, g)
    # a cold, sober opening: low drone, hurdy-gurdy, a muted drum on the hook
    place(M, drone(hz('D2'), 14.0, att=0.2, rel=2.0, seed=1, bright=600), 0.0, 0.28); place(M, taiko(46, 1.4, 1), 0.18, 0.5)
    place(M, choir_chord(['D3', 'A3', 'D4'], 6.4, 'u', att=0.4, rel=1.5, seed=2), 0.0, 0.28)
    t = 1.2
    for i, (nm, b) in enumerate(THEME): gnote(nm, t, b * 0.6 + 0.2, 0.16, 10 + i); t += b * 0.6
    # childhood → apprentice: a slow ostinato of low strings; the theme on a wooden flute
    def g1(tm): return np.clip((tm - 6.6) / 1.0, 0, 1) * np.clip((21.0 - tm) / 0.8, 0, 1) * 0.5
    place(M, syn.strings_ostinato(['D2', 'D2', 'Bb1', 'C2'], 6.6, 76, 4, g1), 6.6, 0.32)
    place(M, melody(THEME, 8.0, 0.55, flute, 0.18, 20), 0, 1.0); place(M, melody(THEME, 14.4, 0.55, flute, 0.18, 30, transpose=2), 0, 1.0)
    # the dangers: a tense low pulse
    n = int(8.0 * SR); trem = osc(syn.saw_table(30), hz('D2'), n, drift=0.0004, seed=40) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * tt(n)))
    place(M, fft_filter(trem * adsr(n, 1.0, 0.1, 1, 1.0), 40, 900), 20.8, 0.22); place(M, choir_chord(['D3', 'F3', 'Bb3'], 8.0, 'o', att=1.5, rel=1.0, seed=41), 20.8, 0.3)
    # the work never ends: driving, tied to the hammer
    def g2(tm): return np.clip((tm - 28.8) / 0.6, 0, 1) * np.clip((37.6 - tm) / 0.6, 0, 1) * 0.55
    place(M, syn.strings_ostinato(['D2', 'F2', 'C2', 'A1'], 28.8, 104, 4, g2), 28.8, 0.36)
    t = 28.8; k = 0
    while t < 37.4: place(M, taiko(58, 0.5, 60 + k), t, 0.22 if k % 2 else 0.32); k += 1; t += 60 / 104
    # the price: slower, heavier, night
    place(M, drone(hz('A1'), 8.2, att=1.2, rel=1.5, seed=70, bright=450), 37.6, 0.28); place(M, choir_chord(['A2', 'E3', 'A3', 'C4'], 8.0, 'u', att=2.0, rel=1.5, seed=71), 37.6, 0.32)
    t = 38.2
    for i, (nm, b) in enumerate(SAD): gnote(nm, t, b * 0.75 + 0.3, 0.14, 80 + i); t += b * 0.75
    # old age: the emotional peak — the theme slowed, in minor, on gurdy and choir
    place(M, choir_chord(['D3', 'F3', 'A3', 'D4'], 7.4, 'a', att=2.0, rel=1.0, seed=90), 45.6, 0.42); place(M, drone(hz('D2'), 7.4, att=1.5, rel=1.0, seed=91, bright=500), 45.6, 0.28)
    place(M, melody(SAD, 46.2, 0.7, flute, 0.2, 100), 0, 1.0)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4'], 3.0, 'a', att=0.4, rel=1.2, seed=92, bright=1.2), 51.6, 0.4)
    # the end: a quiet resolution as the fire dies; a single bell; the hammer passed on
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4'], 9.0, 'u', att=2.5, rel=3.0, seed=110), 53.0, 0.36); place(M, drone(hz('D2'), 9.0, att=2.0, rel=2.5, seed=111, bright=400), 53.0, 0.22)
    place(M, bell(hz('D4'), 6.0, 0.7, 112), 57.0, 0.18)
    t = 59.2
    for i, (nm, b) in enumerate(THEME[:4]): gnote(nm, t, b * 0.7 + 0.3, 0.12, 120 + i); t += b * 0.7
    M = reverb(M, 3.0, 0.32, damp=4500, seed=1)
    tm = tt(N); M *= np.clip((TL.DURATION - tm) / 0.8, 0, 1)[:, None]
    return M

def sfx():
    S = buf(); B = buf()
    # the forge's constant bed: fire, crackle; outside: wind, village
    place(S, flame(53.0, 1, 0.5) * 0.25, 0.0, 0.5); place(S, crackle_track(0.0, 53.0, 40, 0.35, 2, 0.15), 0.0, 0.6); place(S, crackle_track(53.0, 56.6, 12, 0.2, 3, 0.05), 53.0, 0.5)
    place(S, ep2.cold_wind()[:int(62 * SR)] * 1.6, 0, 0.35)
    place(S, birds(1.4, 3.2, 4, 1.5), 1.4, 0.3); place(S, birds(56.6, 62.0, 5, 1.0), 56.6, 0.3)
    for i, (t, w) in enumerate(TL.HITS): place(S, anvil_hit(10 + i, w), t, 1.0, -0.1 + (i % 3) * 0.1); place(B, anvil_hit(10 + i, w * 0.5), t, 0.5)
    place(S, anvil_hit(60, 1.1, miss=True), C['miss'], 1.1); place(S, noise_burst(0.4, 600, 4000, 0.002, 12, 61), C['miss'] + 0.03, 0.4); place(S, thud(62, 300), C['miss'] + 0.12, 0.3)   # bar rattles
    a, b = C['cry']; place(S, baby_cry(b - a, 70), a, 0.55); place(S, creak(71, 1.4, 120), a + 0.1, 0.18)
    a, b = C['bucket']; t = a + 0.2; k = 0
    while t < b: place(S, footstep(80 + k, 0.5), t, 0.35, -0.2); place(S, noise_burst(0.15, 1500, 6000, 0.005, 20, 90 + k), t + 0.05, 0.18); k += 1; t += 0.42
    for i, t in enumerate(C['bellows']): place(S, bellows_puff(100 + i), t, 0.9); place(S, flame(0.9, 102 + i, 0.9) * 0.6, t + 0.2, 0.7); place(S, creak(104 + i, 0.4, 200), t - 0.3, 0.2)
    place(S, hiss(3.5, 110), C['touch'], 0.55); place(S, noise_burst(0.2, 300, 3000, 0.003, 18, 111), C['touch'] + 0.05, 0.4)   # the sizzle and the jerk
    a, b = C['wrap']; t = a
    while t < b: place(S, cloth(120 + int(t * 10), 0.28), t, 0.6); t += 0.32
    a, b = C['crowd']; place(S, crowd(b - a, 130, 10) * 0.35, a, 0.35)
    a, b = C['tap']; t = a + 0.3; k = 0
    while t < b: place(S, footstep(140 + k, 0.25), t, 0.2, 0.5); k += 1; t += 0.7
    place(S, hiss(2.2, 150), C['quench'], 1.0); place(S, noise_burst(0.5, 200, 1500, 0.01, 6, 151), C['quench'], 0.4)
    a, b = C['night']; place(S, crickets(a, b, 160), a, 0.4); a, b = C['breath']; place(S, breath(b - a, 161), a, 0.5)
    a, b = C['old']; place(S, breath(b - a, 170, 0.3) * 0.7, a, 0.35); place(S, thud(171, 220), C['knock'], 0.25)
    place(S, anvil_hit(180, 0.18), C['place'], 1.0); place(S, thud(181, 160), C['place'], 0.3)
    a, b = C['steps']; t = a + 0.15; k = 0
    while t < b: place(S, footstep(190 + k, 0.5), t, 0.3, (-0.2, 0.2)[k % 2]); k += 1; t += 0.29
    place(S, noise_burst(0.25, 800, 5000, 0.005, 14, 200), C['lift'], 0.3)
    S = reverb(S, 1.2, 0.12, 6000, 2) + reverb(B, 1.8, 0.4, 5000, 3)
    tm = tt(N); S *= np.clip((TL.DURATION - tm) / 0.8, 0, 1)[:, None]
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); Mu = music(); Sx = sfx(); print('synth done')
    env = np.abs(V).max(1); win = int(0.2 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.5 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.3 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.55); Sx_d = norm(Sx_d, 0.85); Vn = norm(V, 0.92)
    mix = Vn + Mu_d * 0.55 + Sx_d * 0.62
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
