"""Original procedural score + sound design for WHAT IF DRAGONS STILL EXISTED?
Documentary tone: subtle, mysterious music under a modern soundscape. Usage: python synth.py VO_DIR OUT_DIR
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
TL = SourceFileLoader('timeline_dragons', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, dr, gb, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble
dragon_roar, wingbeat, flame, crowd, thud, birds = dr.dragon_roar, dr.wingbeat, dr.flame, dr.crowd, gb.thud, gb.birds
C = TL.CUES

def city_bed(t0, t1, seed=0, k=1.0):
    """Distant traffic: a low road rumble, tyre hiss swells, the odd horn far away."""
    n = int((t1 - t0) * SR); t = tt(n); r = np.random.RandomState(seed)
    g = np.interp(t, np.linspace(0, t1 - t0, max(2, int((t1 - t0) * 0.8))), 0.6 + 0.4 * r.rand(max(2, int((t1 - t0) * 0.8))))
    L = fft_filter(r.randn(n), 40, 260) * 0.9 + fft_filter(r.randn(n), 500, 3500) * 0.18 * g; R_ = fft_filter(r.randn(n), 40, 260) * 0.9 + fft_filter(r.randn(n), 500, 3500) * 0.18 * g[::-1]
    out = np.stack([L, R_], 1)
    for _ in range(int((t1 - t0) / 5)):
        i = r.randint(0, max(1, n - SR)); ln = int(SR * (0.25 + r.rand() * 0.3)); tc = np.arange(ln) / SR; f = 380 + r.rand() * 120
        hn = (np.sign(np.sin(2 * np.pi * f * tc)) * 0.5 + np.sin(2 * np.pi * f * 1.26 * tc) * 0.5) * np.minimum(tc / 0.02, 1) * np.clip((tc[-1] - tc) / 0.05, 0, 1) * 0.08
        out[i:i + ln, 0] += fft_filter(hn, 300, 2500); out[i:i + ln, 1] += fft_filter(hn, 300, 2500) * 0.6
    e = np.minimum(t / 0.5, 1) * np.clip((t1 - t0 - t) / 0.5, 0, 1)
    return (out * e[:, None] * k).astype(np.float32)
def car_pass(seed=0, dur=2.0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); e = np.exp(-((t - dur / 2) / (dur * 0.22)) ** 2)
    return (fft_filter(r.randn(n), 120, 2400) * e * 0.8 + np.sin(2 * np.pi * np.cumsum(90 * (1 + 0.1 * np.tanh((dur / 2 - t) * 3))) / SR) * e * 0.2).astype(np.float32)
def big_wings(t0, t1, B, rate=0.75, size=2.4, gain=0.6, seed=0):
    t = t0; k = 0
    while t < t1: place(B, wingbeat(seed + k, size) * 1.4, t, gain, (-0.3, 0.3)[k % 2]); k += 1; t += 1 / rate
def siren(dur, seed=0, kind='wail'):
    n = int(dur * SR); t = tt(n); f = (700 + 350 * np.sin(2 * np.pi * 0.25 * t)) if kind == 'wail' else np.where((t * 1.6) % 1 < 0.5, 950, 760)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (fft_filter(s, 300, 4000) * np.minimum(t / 0.3, 1) * np.clip((dur - t) / 0.5, 0, 1) * 0.35).astype(np.float32)
def helicopter(dur, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); chop = (0.5 + 0.5 * np.sin(2 * np.pi * 17 * t)) ** 3
    s = fft_filter(r.randn(n), 60, 900) * chop * 1.4 + fft_filter(r.randn(n), 1500, 5000) * 0.12 + np.sin(2 * np.pi * 34 * t) * chop * 0.5
    return (s * np.minimum(t / 0.6, 1) * np.clip((dur - t) / 0.6, 0, 1)).astype(np.float32)
def jet(dur, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); e = np.minimum(t / 0.4, 1) ** 2 * np.clip((dur - t) / 1.2, 0, 1)
    s = fft_filter(r.randn(n), 40, 400) * 1.4 + fft_filter(r.randn(n), 800, 6000) * (0.4 + 0.6 * np.minimum(t / dur, 1)) + np.sin(2 * np.pi * np.cumsum(3000 + 800 * t / dur) / SR) * 0.05
    return (s * e).astype(np.float32)
def airliner_hum(dur, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    return ((fft_filter(r.randn(n), 60, 700) * 1.0 + np.sin(2 * np.pi * 88 * t) * 0.15) * np.minimum(t / 0.6, 1) * np.clip((dur - t) / 0.6, 0, 1)).astype(np.float32)
def stamp(seed=0):
    n = int(0.3 * SR); t = tt(n); r = np.random.RandomState(seed); return (fft_filter(r.randn(n), 200, 3000) * np.exp(-t * 40) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 30) * 0.5).astype(np.float32)
def beep(f=1200, dur=0.12): t = tt(int(dur * SR)); return (np.sin(2 * np.pi * f * t) * 0.3 * np.minimum(t / 0.005, 1) * np.clip((dur - t) / 0.01, 0, 1)).astype(np.float32)

def music():
    M = buf()
    # mysterious documentary pads: a slow, hovering D lydian colour with a soft pulse
    def pad(t0, notes, dur, seed, g=0.38, vowel='u'): place(M, choir_chord(notes, dur, vowel, att=dur * 0.3, rel=dur * 0.3, seed=seed), t0, g)
    pad(0.0, ['D3', 'A3', 'E4', 'G#4'], 6.6, 1, 0.42, 'a'); place(M, drone(hz('D2'), 13.2, att=0.4, rel=2.0, seed=2, bright=600), 0.0, 0.22); place(M, taiko(40, 2.2, 1), 0.05, 0.6)
    pad(6.0, ['B2', 'F#3', 'D4', 'A4'], 7.2, 3); pad(13.0, ['G2', 'D3', 'A3', 'E4'], 7.4, 4); pad(20.2, ['D3', 'A3', 'F#4', 'B4'], 7.0, 5)
    # a gentle plucked pulse through the everyday sections (a soft music-box/celesta colour)
    notes = ['D5', 'A4', 'E5', 'A4', 'F#5', 'A4', 'E5', 'A4']; t = 6.0; k = 0
    while t < 27.0: place(M, ep2.music_box_note(hz(notes[k % 8]) * 0.5, 1.6) * 0.5, t, 0.22 * min(1, (t - 6) / 2) * min(1, (27 - t) / 1.5), (-0.3, 0.3)[k % 2]); k += 1; t += 0.42
    # danger: low strings and a taut pulse
    n = int(8.2 * SR); trem = osc(syn.saw_table(40), hz('D2'), n, drift=0.0004, seed=6) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt(n)))
    place(M, fft_filter(trem * adsr(n, 0.6, 0.1, 1, 0.5), 40, 1300), 27.0, 0.32); pad(27.0, ['D3', 'F3', 'Bb3', 'D4'], 8.2, 7, 0.4, 'o')
    t = 27.0; k = 0
    while t < 35.0: place(M, taiko(56, 0.5, 30 + k), t, 0.3 + 0.15 * (k % 2 == 0)); k += 1; t += 0.48
    place(M, taiko(36, 2.0, 8), C['crash'], 1.0)
    # regulation: measured, neutral; military: firmer brass
    pad(35.2, ['G2', 'D3', 'A3', 'C4'], 8.0, 9); place(M, drone(hz('G1'), 8.0, att=1.0, rel=1.0, seed=10, bright=500), 35.2, 0.2)
    t = 35.4; k = 0
    while t < 43.0: place(M, ep2.music_box_note(hz(['G4', 'D5', 'A4', 'D5'][k % 4]) * 0.5, 1.4) * 0.5, t, 0.16, (-0.3, 0.3)[k % 2]); k += 1; t += 0.6
    place(M, dr.syn.brass_swell(['D2', 'A2', 'D3', 'F#3'], 8.6, att=2.0, seed=11), 43.2, 0.35); pad(43.2, ['D3', 'A3', 'D4', 'F#4'], 8.8, 12, 0.42, 'a')
    t = 43.2; k = 0
    while t < 51.8: place(M, taiko(50, 0.8, 40 + k), t, 0.35 if k % 2 == 0 else 0.2); k += 1; t += 0.6
    # the ending: warm, open, calm
    pad(52.0, ['D3', 'A3', 'E4', 'F#4', 'A4'], 10.0, 13, 0.5, 'a'); place(M, drone(hz('D2'), 10.0, att=2.0, rel=2.5, seed=14, bright=700), 52.0, 0.22)
    t = 52.4; k = 0
    while t < 61.0: place(M, ep2.music_box_note(hz(['A4', 'D5', 'E5', 'F#5', 'E5', 'D5'][k % 6]) * 0.5, 2.0) * 0.5, t, 0.2 * min(1, (61 - t) / 2), (-0.3, 0.3)[k % 2]); k += 1; t += 0.7
    M = reverb(M, 3.4, 0.38, damp=5000, seed=1)
    tm = tt(N); M *= np.clip((TL.DURATION - tm) / 0.8, 0, 1)[:, None]
    return M

def sfx():
    S = buf()
    for (a, b, sd, k) in [(0, 13.0, 1, 1.0), (27.0, 41.0, 2, 1.0), (52.0, 62.0, 3, 0.8)]: place(S, city_bed(a, b, sd, k), a, 0.55)
    place(S, ep2.cold_wind()[:int(62 * SR)] * 1.2, 0, 0.35)
    for i in range(8): place(S, car_pass(20 + i, 2.2), 0.3 + i * 1.5, 0.25, (i % 3 - 1) * 0.7)
    # the hook: wings, a roar, the shadow
    big_wings(0.2, 6.0, S, 0.7, 2.6, 0.7, 30); place(S, dragon_roar(2.4, 52, 31, 1.8), C['roar1'], 0.9); place(S, whoosh(1.6, 2000, 200, 32, q=0.6), C['shadow'], 0.45)
    place(S, crowd(3.0, 33, 18) * 0.4, 2.6, 0.25)
    # everyday life
    place(S, birds(6.0, 13.0, 34, 1.5), 6.0, 0.35); place(S, dragon_roar(1.2, 70, 35, 1.0) * 0.6, 7.4, 0.35)   # a lazy rumble from the roof
    place(S, car_pass(36, 3.0) * 1.2, C['bus'], 0.5); place(S, noise_burst(0.6, 500, 4000, 0.05, 6, 37), C['bus'] + 1.4, 0.2)   # bus brakes
    for i in range(6): place(S, beep(900, 0.06), 10.9 + i * 0.4, 0.1, 0.5)      # crossing signal
    big_wings(C['flypast'] - 0.4, 13.0, S, 1.2, 2.0, 0.7, 38); place(S, whoosh(1.2, 300, 2400, 39, q=0.8), C['flypast'], 0.6)
    # transportation
    place(S, jet(6.0, 40) * 0.35, 13.0, 0.35); big_wings(C['land'], C['touch'], S, 1.3, 2.4, 0.8, 41); place(S, thud(42, 40), C['touch'], 1.1); place(S, rumble(1.5, 43, 18, 120), C['touch'], 0.7)
    place(S, noise_burst(0.3, 1500, 5000, 0.01, 12, 44), 16.4, 0.2); place(S, noise_burst(0.3, 1500, 5000, 0.01, 12, 45), 17.0, 0.2)   # footsteps on metal steps
    place(S, airliner_hum(2.6, 46), C['plane'], 0.7); big_wings(C['plane'], 20.2, S, 1.1, 2.0, 0.55, 47)
    # the economy
    place(S, birds(20.2, 27.0, 50, 1.2), 20.2, 0.3); place(S, car_pass(51, 3.0), C['truck'], 0.5); place(S, noise_burst(0.8, 400, 2400, 0.05, 4, 52), C['truck'] + 1.6, 0.2)
    for i in range(10): place(S, beep(1400, 0.15), C['forklift'] + i * 0.5, 0.08, 0.4)
    for i in range(4): place(S, thud(53 + i, 90), 21.0 + i * 0.4, 0.25)
    place(S, dragon_roar(1.0, 90, 57, 0.8) * 0.5, 21.6, 0.3); place(S, dragon_roar(1.4, 60, 58, 1.2) * 0.4, 23.4, 0.25)   # contented rumbles
    # the danger
    big_wings(C['stumble'], C['crash'], S, 2.2, 2.4, 0.7, 60); place(S, dragon_roar(1.8, 66, 61, 1.6), C['roar_d'], 1.0); place(S, flame(1.0, 62, 1.6), C['fire'], 0.8)
    place(S, rumble(3.0, 63, 16, 140), C['crash'], 1.5); place(S, noise_burst(2.4, 80, 5000, 0.002, 2.0, 64), C['crash'], 1.0)
    for i in range(8): place(S, thud(65 + i, 110 + i * 15), C['crash'] + 0.3 + i * 0.2, 0.35, (i % 3 - 1) * 0.5)
    place(S, syn.crackle_track(C['crash'], 35.2, 120, 0.5, 66, 0.3), C['crash'], 0.7); place(S, crowd(4.0, 67, 30) * 0.8, 30.2, 0.4)
    a, b = C['sirens']; place(S, siren(b - a, 68, 'wail'), a, 0.6, -0.4); place(S, siren(b - a - 0.6, 69, 'hilo'), a + 0.6, 0.5, 0.4)
    # regulation
    a, b = C['heli']; place(S, helicopter(b - a + 0.8, 70), a - 0.3, 0.7); big_wings(37.8, 40.0, S, 0.9, 2.2, 0.45, 71)
    place(S, stamp(72), C['stamp'], 0.6); place(S, beep(1800, 0.08), C['stamp'] + 0.5, 0.2); place(S, dragon_roar(1.0, 80, 73, 0.8) * 0.4, 42.0, 0.25)
    # the military
    place(S, ep2.cold_wind()[int(43 * SR):int(52 * SR)] * 2.0, 43.2, 0.5); for_i = [place(S, gb.ep3.heavy_step(74 + i, 1.0), 43.6 + i * 0.5, 0.15) for i in range(8)]
    a, b = C['jets']; place(S, jet(b - a + 1.5, 75), a, 1.0, 0.3); place(S, jet(b - a, 76), a + 0.4, 0.8, -0.2)
    place(S, whoosh(1.4, 200, 1200, 77, q=0.6), C['spread'], 0.8); big_wings(C['spread'] + 0.4, 51.8, S, 0.6, 3.0, 0.6, 78); place(S, dragon_roar(2.2, 48, 79, 2.0), C['roar_m'], 0.9)
    # the ending
    place(S, birds(52.0, 58.0, 80, 0.8), 52.0, 0.25); big_wings(52.4, 56.0, S, 0.5, 2.6, 0.4, 81)
    for i in range(4): place(S, car_pass(82 + i, 2.4), 55.6 + i * 0.7, 0.25, (i % 2 - 0.5) * 1.2)
    place(S, dragon_roar(2.6, 46, 86, 2.0) * 0.5, C['far_roar'], 0.3)
    S = reverb(S, 1.6, 0.16, 6000, 2)
    tm = tt(N); S *= np.clip((TL.DURATION - tm) / 0.8, 0, 1)[:, None]
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); Mu = music(); Sx = sfx(); print('synth done')
    env = np.abs(V).max(1); win = int(0.2 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.5 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.4 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.55); Sx_d = norm(Sx_d, 0.8); Vn = norm(V, 0.92)
    mix = Vn + Mu_d * 0.55 + Sx_d * 0.62
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
