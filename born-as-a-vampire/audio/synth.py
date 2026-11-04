"""Original procedural score + sound design for WHAT IF YOU WERE BORN AS A VAMPIRE?
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
TL = SourceFileLoader('timeline_vampire', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, dr, gb, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, footstep = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.footstep
horn_note, heavy_step, thunder = ep3.horn_note, ep3.heavy_step, ep3.thunder
melody, leaves_wind, thud, clang = gb.melody, gb.leaves_wind, gb.thud, gb.clang
heartbeat, chirp, wingbeat, crowd = dr.heartbeat, dr.chirp, dr.wingbeat, dr.crowd
brass_swell = dr.syn.brass_swell
C = TL.CUES

def boom(seed=0, f=34, dur=3.0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    s = np.sin(2 * np.pi * f * t * (1 + 1.5 * np.exp(-t * 9))) * np.exp(-t * 1.6) + fft_filter(r.randn(n), 30, 300) * np.exp(-t * 4) * 0.6
    return (s * np.minimum(t / 0.003, 1)).astype(np.float32)
def flutter(dur, seed=0, density=1.0):
    """A sea of wings: noise beating at ~20 Hz, plus squeaks."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * (18 + 4 * np.sin(t * 1.3)) * t) ** 2
    s = fft_filter(r.randn(n), 150, 2200) * am * 0.8 + fft_filter(r.randn(n), 60, 400) * 0.5
    sq = np.zeros(n)
    for _ in range(int(dur * 14 * density)):
        i = r.randint(0, max(1, n - 4000)); ln = int(SR * (0.03 + r.rand() * 0.05)); tc = np.arange(ln) / SR; f = 5200 + r.rand() * 3000
        sq[i:i + ln] += np.sin(2 * np.pi * f * (1 - tc * 6) * tc) * np.sin(np.pi * tc / tc[-1]) * 0.25
    e = np.minimum(t / 0.6, 1) * np.clip((dur - t) / 0.8, 0, 1)
    return ((s + sq) * e).astype(np.float32)
def snuff(seed=0):
    n = int(0.35 * SR); t = tt(n); r = np.random.RandomState(seed)
    return (fft_filter(r.randn(n), 300, 3000) * np.exp(-t * 14) * 0.6).astype(np.float32)
def zip_(seed=0, dur=0.35):
    return whoosh(dur, 3200, 400, seed, q=0.7)

def music():
    M = buf()
    # the bloodline: a vast, dark choir and organ-like drone
    place(M, choir_chord(['D2', 'A2', 'D3', 'F3', 'A3'], 5.4, 'a', att=0.05, rel=1.2, seed=1, bright=1.4), 0.0, 0.7)
    place(M, drone(hz('D1'), 6.0, att=0.1, rel=1.2, seed=2, bright=500), 0.0, 0.35); place(M, taiko(38, 2.0, 1), 0.02, 1.1)
    place(M, choir_chord(['D3', 'F3', 'A3', 'C#4'], 2.2, 'o', att=0.05, rel=0.8, seed=3, bright=1.3), C['eyes'], 0.55)
    # the hunger: low tremolo strings and the heartbeat
    n = int(7.0 * SR); trem = osc(syn.saw_table(40), hz('D2'), n, drift=0.0004, seed=4) * (0.5 + 0.5 * np.sin(2 * np.pi * 10 * tt(n)))
    place(M, fft_filter(trem * adsr(n, 1.2, 0.1, 1, 0.4), 40, 1500), 5.6, 0.3)
    place(M, choir_chord(['D3', 'F3', 'Bb3'], 7.0, 'u', att=1.5, rel=0.4, seed=5), 5.6, 0.35)
    # the gift: driving strings and drums
    def g3(tm): return np.clip((tm - 12.6) / 0.6, 0, 1) * np.clip((19.8 - tm) / 0.6, 0, 1)
    place(M, syn.strings_ostinato(['D2', 'D2', 'Bb1', 'C2'], 12.6, 126, 4, g3), 12.6, 0.45)
    t = 12.6; k = 0
    while t < 19.6: place(M, taiko(52, 0.6, 20 + k), t, 0.55 if k % 2 == 0 else 0.3); k += 1; t += 60 / 126
    place(M, brass_swell(['D2', 'A2', 'D3', 'F3'], 2.4, att=0.05, seed=6), C['fall'], 0.4); place(M, taiko(40, 1.6, 7), C['fall'], 1.0)
    # immortality: a music box through the centuries, over sorrowful strings
    def mb(tm): return np.clip((tm - 19.8) / 0.8, 0, 1) * np.clip((27.9 - tm) / 0.8, 0, 1) * 0.5
    place(M, ep2.music_box(19.9, 27.6, mb, 0.5, -3, 8), 0, 1.0)
    place(M, choir_chord(['D3', 'F3', 'A3'], 4.2, 'u', att=1.5, rel=1.0, seed=9), 19.8, 0.45); place(M, choir_chord(['Bb2', 'D3', 'F3'], 4.4, 'u', att=1.2, rel=1.2, seed=10), 23.6, 0.45)
    # the hunt: war drums, minor brass
    t = 27.8; k = 0
    while t < 35.6: place(M, taiko(44, 1.0, 40 + k), t, 0.7 if k % 4 == 0 else 0.35); k += 1; t += 0.5
    place(M, brass_swell(['D2', 'A2', 'D3', 'F3'], 7.6, att=2.0, seed=11), 27.8, 0.4); place(M, choir_chord(['D3', 'A3', 'D4', 'F4'], 7.8, 'a', att=2.5, rel=0.2, seed=12), 27.8, 0.45)
    # the night awakens: full choir, brass, racing drums — the climax
    place(M, choir_chord(['D3', 'A3', 'D4', 'F4', 'A4'], 10.4, 'a', att=0.6, rel=0.6, seed=13, bright=1.6), 35.6, 0.65)
    place(M, brass_swell(['D2', 'A2', 'D3', 'F3'], 10.2, att=0.8, seed=14), 35.6, 0.5)
    def g6(tm): return np.clip((tm - 38.0) / 0.4, 0, 1) * np.clip((46.0 - tm) / 0.5, 0, 1)
    place(M, syn.strings_ostinato(['D2', 'Bb1', 'C2', 'A1'], 38.0, 150, 6, g6), 38.0, 0.5)
    t = 38.0; k = 0
    while t < 45.8: place(M, taiko(46, 0.6, 60 + k), t, 0.7 if k % 2 == 0 else 0.4); k += 1; t += 60 / 150
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 3.0, 'a', att=0.02, rel=1.2, seed=15, bright=1.7), C['transform'], 0.6)
    # evolution: a solemn major-tinged dawn
    place(M, choir_chord(['F2', 'C3', 'F3', 'A3', 'C4'], 7.8, 'a', att=1.0, rel=0.6, seed=16), 46.0, 0.55); place(M, drone(hz('F1'), 7.6, att=1.0, rel=1.0, seed=17, bright=600), 46.0, 0.25)
    place(M, melody([('A4', 1), ('C5', 0.5), ('D5', 0.5), ('F5', 1.5), ('E5', 0.5), ('D5', 2)], 47.0, 0.55, lambda f, d, seed=0: horn_note(f, d, att=0.15, seed=seed), 0.4, 18), 0, 1.0)
    # the Vampire King: a grand ending
    place(M, choir_chord(['D2', 'A2', 'D3', 'F3', 'A3', 'D4'], 8.6, 'a', att=1.2, rel=0.4, seed=19, bright=1.5), 53.6, 0.7)
    place(M, brass_swell(['D1', 'A1', 'D2', 'F2'], 8.0, att=1.5, seed=20), 53.6, 0.55); place(M, drone(hz('D1'), 8.4, att=1.0, rel=0.4, seed=21, bright=500), 53.6, 0.35)
    place(M, taiko(36, 2.4, 8), C['final'], 1.3); place(M, choir_chord(['D3', 'A3', 'D4', 'F4', 'A4'], 2.4, 'a', att=0.02, rel=1.6, seed=22, bright=1.8), C['final'], 0.7)
    M = reverb(M, 3.6, 0.36, damp=4500, seed=1)
    tm = tt(N); M *= np.clip((TL.DURATION - tm) / 0.7, 0, 1)[:, None]
    return M

def sfx():
    S = buf()
    place(S, ep2.cold_wind()[:int(12.6 * SR)] * 2.2, 0, 0.6); place(S, thunder(1, 4.0), 0.1, 0.8)
    for i in range(6): place(S, chirp(10 + i) * 0.4, 0.2 + i * 0.25, 0.25, (i % 3 - 1) * 0.6)
    place(S, boom(2, 32, 2.5), C['eyes'], 0.9); place(S, heartbeat(3, 44), C['eyes'] + 0.05, 0.7)
    for i in range(30): place(S, snuff(20 + i), C['candles'] + (i // 3) * 0.07 + (i % 3) * 0.02, 0.35, (i % 5 - 2) * 0.3)
    place(S, whoosh(1.4, 2000, 200, 21, q=0.6), C['candles'], 0.5); place(S, noise_burst(2.0, 60, 400, 0.4, 1.0, 22), C['elders'], 0.4)
    for i, ts in enumerate(C['child_steps']): place(S, footstep(30 + i, 0.4), ts, 0.25, (-0.2, 0.2)[i % 2])
    t, k = C['heart'][0], 0
    while t < C['heart'][1]: place(S, heartbeat(40 + k, 46), t, 0.6 + k * 0.08); k += 1; t += 0.62 - k * 0.04
    place(S, boom(41, 40, 1.6), C['flare'], 0.6)
    place(S, whoosh(0.6, 400, 3200, 42, q=0.8), C['vanish'] - 0.1, 0.6); place(S, boom(43, 46, 1.0), C['vanish'], 0.4)
    place(S, whoosh(0.5, 3000, 300, 44, q=0.8), C['appear'] - 0.05, 0.5); place(S, heartbeat(45, 50), C['appear'] + 0.2, 0.6)
    # the courtyard
    place(S, leaves_wind(12.6, 19.8, 50, 0.6), 12.6, 0.45)
    for i in range(6): place(S, noise_burst(0.45, 2500, 9000, 0.05, 6, 51 + i), C['draw'] + i * 0.12, 0.25, (i % 3 - 1) * 0.6); place(S, metal_hit(1500 + i * 80, 0.6, 60 + i, noise=0.4), C['draw'] + i * 0.12 + 0.3, 0.12)
    for i in range(10): place(S, heavy_step(70 + i, 1.0), C['charge'] + i * 0.06, 0.3, (i % 3 - 1) * 0.5)
    place(S, boom(80, 38, 2.0), C['gone'], 0.9); place(S, whoosh(0.7, 300, 3500, 81, q=0.8), C['gone'] - 0.15, 0.6)
    for i, ts in enumerate(C['hits']): place(S, clang(90 + i), ts, 0.55, (i % 3 - 1) * 0.6); place(S, zip_(100 + i), ts - 0.08, 0.45, -(i % 3 - 1) * 0.6)
    for i in range(6): place(S, heavy_step(110 + i, 1.6), C['fall'] + i * 0.06 + 0.2, 0.5, (i % 3 - 1) * 0.5); place(S, metal_hit(700 + i * 90, 1.0, 116 + i, noise=0.7), C['fall'] + i * 0.06 + 0.25, 0.22)
    # the centuries
    place(S, leaves_wind(19.8, 27.8, 120, 0.7), 19.8, 0.5)
    for ts in C['bells']: place(S, bell(hz('D3'), 5.0, 0.8, 121), ts, 0.35)
    place(S, whoosh(3.5, 200, 1400, 122, q=0.5), 20.0, 0.25); place(S, whoosh(3.5, 1400, 200, 123, q=0.5), 24.0, 0.25)
    # the hunt
    place(S, crowd(8.0, 130, 40) * 0.8, 27.8, 0.4); gb.army_stomp(27.8, 35.6, S, 1.8, 131, 0.25); place(S, ep2.cold_wind()[int(27.8 * SR):int(46 * SR)] * 2.4, 27.8, 0.55)
    place(S, horn_note(hz('D3'), 2.2, att=0.3, seed=132), 28.6, 0.5); place(S, horn_note(hz('A2'), 2.4, att=0.3, seed=133), 30.2, 0.45)
    place(S, heartbeat(134, 42), 34.2, 0.6); place(S, heartbeat(135, 42), 34.85, 0.7)
    # the night awakens
    place(S, rumble(3.0, 140, 16, 120), C['raise'], 0.8)
    for i, ts in enumerate(C['thunder']): place(S, thunder(141 + i, 4.0), ts, 1.3); place(S, boom(143 + i, 30, 2.4), ts, 0.8)
    place(S, flutter(8.0, 150, 1.0), C['bats'], 0.9); place(S, flutter(5.5, 151, 1.4), C['sweep'] - 2.0, 1.0)
    place(S, boom(152, 36, 2.6), C['transform'], 1.1); place(S, whoosh(1.4, 200, 4000, 153, q=0.7), C['transform'] - 0.4, 0.7)
    for i in range(12): place(S, wingbeat(160 + i, 1.4), C['transform'] + i * 0.11, 0.35, (i % 3 - 1) * 0.6)
    place(S, crowd(3.4, 170, 50) * 1.0, C['sweep'], 0.5)
    for i in range(10): place(S, clang(180 + i), C['sweep'] + i * 0.3 + 0.2, 0.25, (i % 5 - 2) * 0.4); place(S, thud(190 + i, 70), C['sweep'] + i * 0.3 + 0.3, 0.3, (i % 3 - 1) * 0.5)
    # dawn, the kneeling, the throne
    place(S, leaves_wind(46.0, 53.6, 200, 0.5), 46.0, 0.45); place(S, drone(hz('D4'), 7.0, att=0.8, rel=1.5, seed=201, bright=2500), 46.3, 0.06)
    for i in range(10): place(S, noise_burst(0.5, 300, 3000, 0.08, 7, 210 + i), C['kneel'] + (i % 4) * 0.15, 0.2, (i % 5 - 2) * 0.4)
    place(S, crackle_ := syn.crackle_track(53.6, 62.0, 40, 0.3, 220, 0.1), 53.6, 0.6)
    place(S, whoosh(2.4, 150, 900, 221, q=0.5), C['wings'], 0.5); place(S, flutter(2.0, 222, 0.3) * 0.5, C['wings'] + 0.3, 0.4)
    place(S, boom(223, 30, 3.0), C['final'], 1.2); place(S, heartbeat(224, 40), C['final'] - 0.9, 0.7)
    S = reverb(S, 1.8, 0.2, 6000, 2)
    tm = tt(N); S *= np.clip((TL.DURATION - tm) / 0.7, 0, 1)[:, None]
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); print('vo done'); Mu = music(); print('music done'); Sx = sfx(); print('sfx done')
    env = np.abs(V).max(1); win = int(0.2 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.5 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.3 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.6); Sx_d = norm(Sx_d, 0.8); Vn = norm(V, 0.92)
    mix = Vn + Mu_d * 0.6 + Sx_d * 0.68
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
