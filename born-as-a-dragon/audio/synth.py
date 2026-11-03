"""Original procedural score + sound design for WHAT IF YOU WERE BORN AS A DRAGON?
Built on the series' synthesis toolkits (Episodes 1-3); every sound is generated from scratch.
Usage: python synth.py VO_DIR OUT_DIR
"""
import os, sys, math, importlib.util
import numpy as np, soundfile as sf
from importlib.machinery import SourceFileLoader
HERE = os.path.dirname(os.path.abspath(__file__))
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
ROOT = os.path.join(HERE, '..', '..')
syn = load('ep1synth', os.path.join(ROOT, 'the-last-ember', 'audio', 'synth.py'))
ep2 = load('ep2synth', os.path.join(ROOT, 'the-silent-kingdom', 'audio', 'synth.py'))
ep3 = load('ep3synth', os.path.join(ROOT, 'the-forgotten-armory', 'audio', 'synth.py'))
TL = SourceFileLoader('timeline_dragon', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, roar, crackle_track = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.roar, syn.crackle_track
horn_note, thunder, heavy_step = ep3.horn_note, ep3.thunder, ep3.heavy_step
rs = np.random.RandomState(7)
C = TL.CUES

# ---------------------------------------------------------------- creature + world sounds
def dragon_roar(dur, f0, seed, size=1.0):
    """Layered roar: a growling fundamental, a formant 'throat', breath noise and a sub-bass body."""
    n = int(dur * SR); t = tt(n)
    base = roar(dur, f0, seed, growl=1.2 + size * 0.3)
    hi = roar(dur * 0.95, f0 * 2.03, seed + 1, growl=1.5)[:n]
    hi = np.pad(hi, (0, n - len(hi)))
    breath = fft_filter(np.random.RandomState(seed + 2).randn(n), 300, 3500) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6 * 0.35
    sub = np.sin(2 * np.pi * (f0 * 0.5) * t) * np.sin(np.pi * np.clip(t / dur, 0, 1)) * 0.6 * size
    s = base + hi * 0.5 + breath + sub
    return (np.tanh(s * 1.4) * 0.9).astype(np.float32)
def chirp(seed=0):
    n = int(0.7 * SR); t = tt(n); r = np.random.RandomState(seed)
    f = 520 * (1 + 0.35 * np.sin(np.pi * t / 0.7)) * (1 + 0.04 * np.sin(2 * np.pi * 28 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR)
    s = s * np.sin(np.pi * t / 0.7) ** 1.5 + fft_filter(r.randn(n), 1500, 5000) * 0.1 * np.sin(np.pi * t / 0.7)
    return (s * 0.5).astype(np.float32)
def flame(dur, seed=0, size=1.0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    env = np.minimum(t / 0.08, 1) * np.clip((dur - t) / 0.3, 0, 1)
    roar_n = fft_filter(r.randn(n), 120 / size, 2600) * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * t))
    low = fft_filter(r.randn(n), 30, 200) * 1.4 * size
    cr = np.zeros(n); idx = r.randint(0, n, int(dur * 220)); cr[idx] = r.randn(len(idx)) * 3
    cr = fft_filter(cr, 1500, 9000)
    return ((roar_n + low + cr * 0.5) * env).astype(np.float32)
def wingbeat(seed=0, size=1.0):
    n = int(0.9 * SR); t = tt(n); r = np.random.RandomState(seed)
    w = fft_filter(r.randn(n), 40, 500 / size) * np.exp(-((t - 0.25) / 0.12) ** 2) * 2.2
    snap = fft_filter(r.randn(n), 200, 1600) * np.exp(-((t - 0.28) / 0.05) ** 2) * 0.6
    return ((w + snap) * size).astype(np.float32)
def heartbeat(seed=0, f=46):
    n = int(0.7 * SR); t = tt(n)
    k = lambda t0, a: np.sin(2 * np.pi * f * (t - t0) * (1 + np.exp(-(t - t0).clip(0) * 25))) * np.exp(-(t - t0).clip(0) * 14) * (t > t0) * a
    return fft_filter(k(0.0, 1.0) + k(0.22, 0.7), 20, 400).astype(np.float32)
def lava_bed(t0, t1, seed=0):
    n = int((t1 - t0) * SR); r = np.random.RandomState(seed); out = fft_filter(r.randn(n), 30, 180) * 0.6
    for _ in range(int((t1 - t0) * 6)):
        i = r.randint(0, max(1, n - SR // 3)); ln = int(SR * (0.05 + r.rand() * 0.15)); tt_ = np.arange(ln) / SR; f = 70 + r.rand() * 160
        out[i:i + ln] += np.sin(2 * np.pi * f * tt_ * (1 + tt_ * 3)) * np.exp(-tt_ * 18) * 0.8
    e = np.minimum(tt(n) / 0.3, 1) * np.clip((t1 - t0 - tt(n)) / 0.3, 0, 1)
    return (out * e).astype(np.float32)
def arrow(seed=0):
    n = int(0.45 * SR); t = tt(n); r = np.random.RandomState(seed)
    wh = fft_filter(r.randn(n), 2500, 8000) * np.exp(-((t - 0.15) / 0.07) ** 2) * 0.6
    thunk = np.sin(2 * np.pi * 180 * t) * np.exp(-(t - 0.3).clip(0) * 40) * (t > 0.3) * 0.5
    return (wh + thunk).astype(np.float32)
def crowd(dur, seed=0, voices=24):
    w = ep2.whispers(dur, voices, seed)
    return (fft_filter(w, 120, 1400) * 3.0).astype(np.float32)
def alarm_bell(t0, t1, B):
    t = t0; k = 0
    while t < t1: place(B, bell(hz('A3'), 1.6, 1.0, 300 + k), t, 0.28, 0.4); k += 1; t += 0.42

# ---------------------------------------------------------------- MUSIC (C minor)
def music():
    M = buf()
    # hook stab
    place(M, choir_chord(['C3', 'G3', 'C4', 'Eb4', 'G4'], 1.8, 'a', att=0.02, rel=1.0, seed=1, bright=1.5), 0.05, 0.8)
    place(M, syn.brass_swell(['C2', 'G2', 'C3', 'Eb3'], 1.7, att=0.05, seed=2), 0.05, 0.4)
    # birth: a low drone and a soft "oo" choir; childhood: a fragile high motif
    place(M, drone(hz('C1'), 21.0, att=1.0, rel=2.0, seed=3, bright=500), 1.6, 0.45)
    place(M, choir_chord(['C3', 'G3', 'Eb4'], 6.5, 'u', att=1.5, rel=1.2, seed=4), 1.8, 0.4)
    for i, (nm, t0) in enumerate([('G4', 8.4), ('Eb4', 8.9), ('C4', 9.4), ('D4', 10.4), ('Eb4', 11.0), ('G4', 11.6)]):
        place(M, horn_note(hz(nm), 0.9, att=0.08, seed=10 + i), t0, 0.18, 0.2)
    place(M, choir_chord(['Ab2', 'Eb3', 'C4'], 5.0, 'u', att=1.2, rel=1.0, seed=5), 8.3, 0.4)
    # the hunt begins: a pulsing string ostinato that grows with the dragon (96 -> 120 bpm)
    def g_ost(t): return np.clip((t - 14.0) / 2, 0, 1) * (0.5 + 0.5 * np.clip((t - 21.6) / 4, 0, 1)) * np.clip((32.1 - t) / 0.2, 0, 1)
    place(M, syn.strings_ostinato(['C2', 'C2', 'Ab1', 'G1'], 14.0, 104, 8, g_ost), 14.0, 0.55)
    place(M, choir_chord(['C3', 'G3', 'C4', 'Eb4'], 7.6, 'a', att=1.5, rel=0.6, seed=6), 14.0, 0.45)
    place(M, choir_chord(['Ab2', 'Eb3', 'Ab3', 'C4'], 4.0, 'a', att=0.4, rel=0.5, seed=7, bright=1.3), 21.6, 0.6)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4'], 3.4, 'a', att=0.3, rel=0.5, seed=8, bright=1.3), 25.1, 0.6)
    place(M, choir_chord(['C3', 'G3', 'C4', 'Eb4', 'G4'], 4.4, 'a', att=0.3, rel=0.8, seed=9, bright=1.5), 27.9, 0.7)
    place(M, syn.brass_swell(['C2', 'G2', 'C3', 'Eb3'], 4.2, att=0.8, seed=11), 27.9, 0.45)
    # battle drums
    t = 21.6; k = 0
    while t < 32.0:
        g = 0.5 + 0.4 * (t - 21.6) / 10.4
        place(M, taiko(52, 1.0, 500 + k), t, g); place(M, taiko(70, 0.5, 700 + k), t + 0.28, g * 0.45); k += 1; t += 60 / 104 * (2 if t < 27.9 else 1)
    for t0, g in [(21.7, 1.0), (23.05, 0.9), (25.1, 0.9), (29.5, 1.2), (30.7, 1.3)]: place(M, taiko(42, 1.8, int(t0 * 10)), t0, g)
    # the banner: everything drops to one held, uneasy note
    place(M, choir_chord(['B2', 'D3'], 2.4, 'u', att=0.1, rel=0.4, seed=12), 32.2, 0.4)
    # the past: a slow, dissonant, distant lament
    place(M, choir_chord(['C3', 'Db3', 'G3', 'Ab3'], 4.2, 'o', att=0.6, rel=1.0, seed=13), 34.4, 0.55)
    place(M, drone(hz('Db1'), 4.2, att=0.4, rel=1.0, seed=14, bright=400), 34.4, 0.4)
    # the eye, the flight home, the bones: drone + three hits
    place(M, drone(hz('C1'), 8.0, att=0.8, rel=0.8, seed=15, bright=450), 38.3, 0.35)
    for i, t0 in enumerate(C['bone_hits']):
        place(M, taiko(40, 1.8, 900 + i), t0, 1.0); place(M, choir_chord([['C3', 'G3', 'Eb4'], ['Ab2', 'Eb3', 'C4'], ['G2', 'D3', 'B3']][i], 1.4, 'a', att=0.02, rel=0.9, seed=30 + i, bright=1.4), t0, 0.55)
    # the climax: Cm -> Ab -> Eb -> G, full choir, brass, drums, to the final hit
    for i, (t0, ch, d) in enumerate([(46.0, ['C3', 'G3', 'C4', 'Eb4', 'G4'], 2.4), (48.0, ['Ab2', 'Eb3', 'Ab3', 'C4', 'Eb4'], 2.2), (50.1, ['Eb3', 'Bb3', 'Eb4', 'G4'], 2.0), (52.0, ['G2', 'D3', 'G3', 'B3', 'D4'], 2.7)]):
        place(M, choir_chord(ch, d + 0.3, 'a', att=0.25, rel=0.2, seed=40 + i, bright=1.6), t0, 0.8)
        place(M, syn.brass_swell([ch[0][:-1] + str(int(ch[0][-1]) - 1), ch[0], ch[1]], d + 0.2, att=0.3, seed=50 + i), t0, 0.45)
    t = 46.0; k = 0
    while t < 54.55:
        g = 0.55 + 0.45 * (t - 46.0) / 8.5
        place(M, taiko(50, 0.9, 1200 + k), t, g); k += 1; t += max(0.12, 0.5 * (1 - (t - 46.0) / 9.0))
    place(M, taiko(36, 2.2, 1999), C['final_hit'], 1.5)
    place(M, choir_chord(['C3', 'G3', 'C4', 'Eb4', 'G4', 'C5'], 0.4, 'a', att=0.01, rel=0.2, seed=60, bright=1.7), C['final_hit'], 0.9)
    M = reverb(M, 3.4, 0.3, damp=4500, seed=1)
    tl = tt(N); M[(tl >= C['cut']) & (tl < 55.9)] = 0.0
    M[tl >= 55.9] *= 0.0
    return M

def sfx():
    S = buf(); B = buf()
    # hook: eruption rumble, the roar and fire
    place(S, rumble(2.5, 1, 18, 140), 0.0, 1.4); place(S, dragon_roar(1.55, 52, 2, 2.0), C['hook_roar'], 1.2); place(S, flame(1.5, 3, 1.6), 0.1, 0.6)
    # cave: lava bed, heartbeats in the egg, the crack, the chirp
    place(S, lava_bed(1.6, 14.0, 4), 1.6, 0.5)
    for i, t0 in enumerate(C['heartbeats']): place(S, heartbeat(5 + i), t0, 0.9)
    place(S, crackle_track(C['crack'] - 0.4, C['crack'] + 1.2, 260, 0.8, 6), C['crack'] - 0.4, 1.0); place(S, metal_hit(1500, 0.4, 7, noise=0.6) * 0.5, C['crack'], 0.5)
    place(S, chirp(8), C['chirp'], 0.7)
    place(S, noise_burst(0.5, 200, 2500, 0.02, 6, 9), C['cough'], 0.45); place(S, chirp(10) * 0.5, C['cough'] - 0.1, 0.4)
    place(S, flame(C['first_fire'][1] - C['first_fire'][0], 11, 0.8), C['first_fire'][0], 0.9); place(S, dragon_roar(1.0, 120, 12, 0.5), C['first_fire'][0] - 0.1, 0.4)
    # the outside world: a distant jet of fire, the alarm bell, the hunters' horn, torches and boots
    place(S, rumble(3.0, 13, 18, 120), C['jet'], 0.9); place(S, flame(2.2, 14, 2.0), C['jet'], 0.45)
    alarm_bell(C['alarm'][0], C['alarm'][1], B)
    place(B, horn_note(hz('D3'), 1.6, att=0.1, seed=15), C['horn_hunt'], 0.6); place(B, horn_note(hz('A3'), 1.2, att=0.1, seed=16), C['horn_hunt'] + 1.0, 0.5)
    t0, t1 = C['steps']; t = t0 + 0.1; k = 0
    while t < t1: place(S, heavy_step(int(t * 100), 0.4), t, 0.3, -0.2 if k % 2 else 0.2); k += 1; t += 0.33
    place(S, crackle_track(t0, t1, 40, 0.35, 17), t0, 1.0)
    # the glide: rushing wind and wing beats
    g0, g1 = C['glide']; place(S, fft_filter(np.random.RandomState(18).randn(int((g1 - g0) * SR)), 200, 2000) * np.sin(np.pi * np.linspace(0, 1, int((g1 - g0) * SR))) * 0.8, g0, 0.6)
    for k, t in enumerate(np.arange(g0 + 0.3, g1, 0.98)): place(S, wingbeat(20 + k, 0.8), t, 0.7)
    # first battle: roar, arrows, the fire sweep, a shouting crowd
    place(S, dragon_roar(1.3, 82, 21, 1.0), C['young_roar'], 1.0)
    for k in range(9): place(S, arrow(30 + k), C['arrows'][0] + k * 0.14 + rs.rand() * 0.05, 0.5, rs.rand() * 1.4 - 0.7)
    place(S, flame(C['sweep'][1] - C['sweep'][0], 31, 1.4), C['sweep'][0], 1.1); place(S, crackle_track(C['sweep'][0], 27.0, 140, 0.6, 32, 0.3), C['sweep'][0], 1.0)
    place(S, crowd(3.2, 33, 20), 21.7, 0.5)
    # the sun: vast wing beats; the battlefield: army horns, drums, the landing, the ROAR
    for k, t in enumerate(C['wingbeats_sun']): place(S, wingbeat(40 + k, 2.0), t, 1.0)
    for k, nm in enumerate(['C3', 'G2', 'C3', 'Eb3']): place(B, horn_note(hz(nm), 1.3, att=0.1, seed=45 + k), 27.95 + k * 0.45, 0.45, (k - 1.5) * 0.4)
    place(S, crowd(2.6, 46, 28), 27.9, 0.6)
    place(S, rumble(2.5, 47, 18, 120), C['land'], 1.3); place(S, noise_burst(1.6, 80, 2000, 0.01, 2.5, 48), C['land'], 0.5)
    place(S, dragon_roar(2.2, 58, 49, 1.6), C['adult_roar'], 1.4); place(S, rumble(2.0, 50, 18, 100), C['adult_roar'], 0.8)
    # banner in the wind
    b0, b1 = C['banner']; place(S, fft_filter(np.random.RandomState(51).randn(int((b1 - b0) * SR)), 300, 2500) * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 18, int((b1 - b0) * SR))))) * 0.5, b0, 0.6)
    # the burning past: firestorm, distant lament, the ancient roar
    place(S, flame(3.8, 52, 2.5), C['flash_in'], 0.8); place(S, crowd(3.6, 53, 16) * 0.5, C['flash_in'], 0.4)
    place(S, dragon_roar(2.4, 40, 54, 2.2), C['ancient_roar_past'], 1.2)
    # the eye: a long inhale; the flight home; the bones
    place(S, fft_filter(np.random.RandomState(55).randn(int(1.6 * SR)), 100, 900) * np.sin(np.linspace(0, np.pi, int(1.6 * SR))) * 0.8, C['breath'], 0.8)
    for k, t in enumerate(C['descent_beats']): place(S, wingbeat(56 + k, 2.4), t, 1.1)
    place(S, rumble(2.0, 58, 18, 120), 41.0, 0.8); place(S, lava_bed(42.4, 46.0, 59), 42.4, 0.5)
    for i, t0 in enumerate(C['bone_hits']): place(B, bell(hz(['C2', 'Ab1', 'G1'][i]), 2.5, 0.4, 60 + i), t0, 0.45)
    # finale: the eruption, the roar, fire into the sky, the eye ignites
    place(S, rumble(8.6, 61, 18, 140), 46.0, 1.3); place(S, thunder(62, 4.0), 46.3, 0.7)
    place(S, dragon_roar(2.8, 46, 63, 2.4), C['climax_roar'], 1.5)
    place(S, flame(C['climax_fire'][1] - C['climax_fire'][0], 64, 2.4), C['climax_fire'][0], 1.1)
    i0, i1 = C['ignite']; t = i0; k = 0
    while t < i1: place(S, heartbeat(70 + k, 40), t, 1.0); k += 1; t += max(0.35, 0.9 - (t - i0) * 0.3)
    place(S, noise_burst(0.8, 60, 4000, 0.002, 4, 75), C['final_hit'], 0.8)
    # after the cut: silence, then one last heartbeat in the dark
    place(S, heartbeat(80, 38), C['last_heartbeat'], 1.0)
    S = reverb(S, 1.8, 0.2, 5000, 2) + reverb(B, 3.0, 0.4, 4200, 3)
    tl = tt(N); S[(tl >= C['cut']) & (tl < C['last_heartbeat'] - 0.02)] = 0.0
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); print('vo done')
    Mu = music(); print('music done')
    Sx = sfx(); print('sfx done')
    env = np.abs(V).max(1); win = int(0.2 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.45 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.3 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.6); Sx_d = norm(Sx_d, 0.85); Vn = norm(V, 0.9)
    mix = Vn + Mu_d * 0.66 + Sx_d * 0.74
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
