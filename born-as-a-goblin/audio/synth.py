"""Original procedural score + sound design for WHAT IF YOU WERE BORN AS A GOBLIN?
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
dr = load('dragonsynth', os.path.join(ROOT, 'born-as-a-dragon', 'audio', 'synth.py'))
syn, ep2, ep3 = dr.syn, dr.ep2, dr.ep3
TL = SourceFileLoader('timeline_goblin', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, dr, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, crackle_track = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.crackle_track
horn_note, heavy_step, footstep = ep3.horn_note, ep3.heavy_step, syn.footstep
dragon_roar, flame, crowd, arrow, heartbeat = dr.dragon_roar, dr.flame, dr.crowd, dr.arrow, dr.heartbeat
rs = np.random.RandomState(11)
C = TL.CUES

# ---------------------------------------------------------------- instruments
def flute(f, dur, att=0.06, seed=0, vib=0.006):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    ph = np.cumsum(f * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.3, 0, 1)) / SR)
    s = np.sin(2 * np.pi * ph) + 0.18 * np.sin(4 * np.pi * ph) + 0.06 * np.sin(6 * np.pi * ph)
    breath = fft_filter(r.randn(n), f * 0.8, f * 3) * 0.08
    return ((s + breath) * adsr(n, att, 0.1, 0.85, min(0.25, dur * 0.4))).astype(np.float32)
def melody(notes, t0, beat, inst, gain=1.0, seed=0, transpose=0):
    out = buf(); t = t0
    for i, (nm, b) in enumerate(notes):
        if nm: place(out, inst(hz(nm) * 2 ** (transpose / 12), b * beat + 0.12, seed=seed + i), t, gain, 0.15)
        t += b * beat
    return out
FOREST = [('D5', 1), ('E5', 0.5), ('F5', 0.5), ('A5', 1.5), ('G5', 0.5), ('F5', 1), ('E5', 1), ('D5', 2)]
SAD = [('A4', 1), ('F4', 1), ('E4', 1), ('D4', 3)]
THEME = [('D4', 1), ('F4', 0.5), ('G4', 0.5), ('A4', 1.5), ('C5', 0.5), ('A4', 1), ('G4', 0.5), ('F4', 0.5), ('D4', 2)]
TRIUMPH = [('D4', 1), ('F#4', 0.5), ('G4', 0.5), ('A4', 1.5), ('B4', 0.5), ('D5', 1), ('C#5', 0.5), ('A4', 0.5), ('D5', 2)]

# ---------------------------------------------------------------- sound effects
def birds(t0, t1, seed=0, density=2.5):
    n = int((t1 - t0) * SR); out = np.zeros((n, 2), np.float32); r = np.random.RandomState(seed)
    for _ in range(int((t1 - t0) * density)):
        i = r.randint(0, max(1, n - SR)); k = r.randint(2, 6); f0 = 2400 + r.rand() * 2600; pan = r.rand() * 2 - 1
        for c in range(k):
            ln = int(SR * (0.05 + r.rand() * 0.08)); tc = np.arange(ln) / SR
            f = f0 * (1 + 0.25 * np.sin(np.pi * tc / tc[-1]) * (1 if c % 2 else -1)) * (1 + 0.03 * np.sin(2 * np.pi * 40 * tc))
            s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tc / tc[-1]) * 0.25
            j = i + c * int(SR * 0.11)
            if j + ln < n: a = (pan + 1) * np.pi / 4; out[j:j + ln, 0] += s * np.cos(a); out[j:j + ln, 1] += s * np.sin(a)
    e = np.minimum(tt(n) / 0.5, 1) * np.clip((t1 - t0 - tt(n)) / 0.5, 0, 1)
    return out * e[:, None]
def leaves_wind(t0, t1, seed=0, k=1.0):
    n = int((t1 - t0) * SR); r = np.random.RandomState(seed); t = tt(n)
    g = np.interp(t, np.linspace(0, t1 - t0, max(2, int((t1 - t0) * 1.5))), 0.5 + 0.5 * r.rand(max(2, int((t1 - t0) * 1.5))))
    L = fft_filter(r.randn(n), 900, 6000) * g * 0.35 + fft_filter(r.randn(n), 120, 700) * 0.3; R = fft_filter(r.randn(n), 900, 6000) * g[::-1] * 0.35 + fft_filter(r.randn(n), 120, 700) * 0.3
    e = np.minimum(t / 0.4, 1) * np.clip((t1 - t0 - t) / 0.4, 0, 1)
    return (np.stack([L, R], 1) * e[:, None] * k).astype(np.float32)
def goblin_voice(seed=0, dur=0.5, f0=420, kind='chatter'):
    """Raspy goblin squeaks and cackles: a pitched buzz through jumping formants."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    syl = 7 + r.rand() * 5 if kind == 'chatter' else 11
    f = f0 * (1 + 0.35 * np.sin(2 * np.pi * (1.5 + r.rand()) * t + r.rand() * 6)) * (1 + 0.1 * np.sign(np.sin(2 * np.pi * syl * t)))
    ph = np.cumsum(f / SR); buzz = 2 * (ph % 1) - 1
    s = fft_filter(buzz, 600, 1400) * 1.2 + fft_filter(buzz, 1800, 3200) * 0.8 + fft_filter(r.randn(n), 2000, 6000) * 0.25
    env = np.clip(np.sin(2 * np.pi * syl * t) * 0.7 + 0.5, 0, 1) * np.sin(np.pi * t / dur) ** 0.5
    return (np.tanh(s * env * 2.0) * 0.4).astype(np.float32)
def growl(dur, seed=0, f0=85):
    return syn.roar(dur, f0, seed, growl=1.6) * 0.7
def howl(dur=2.4, seed=0):
    n = int(dur * SR); t = tt(n); f = 330 + 160 * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7 - 40 * (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (fft_filter(s, 200, 2500) * np.sin(np.pi * t / dur) ** 1.2 * 0.5).astype(np.float32)
def clang(seed=0):
    m = metal_hit(900 + np.random.RandomState(seed).rand() * 500, 1.0, seed, noise=0.7); nb = noise_burst(0.25, 2000, 9000, 0.001, 25, seed + 1) * 0.6
    m[:len(nb)] += nb; return m.astype(np.float32)
def thud(seed=0, f=60):
    n = int(0.6 * SR); t = tt(n); r = np.random.RandomState(seed)
    return (np.sin(2 * np.pi * f * t * (1 + np.exp(-t * 30))) * np.exp(-t * 9) + fft_filter(r.randn(n), 80, 1200) * np.exp(-t * 14) * 0.5).astype(np.float32)
def march(t0, t1, B, rate=1.8, seed=0):
    t = t0; k = 0
    while t < t1: place(B, heavy_step(seed + k, 1.0), t, 0.35, -0.3 if k % 2 else 0.3); place(B, heavy_step(seed + 500 + k, 0.8), t + 0.07, 0.25, 0.1); k += 1; t += 1 / rate
def army_stomp(t0, t1, S, rate=2.2, seed=0, gain=0.6):
    t = t0; k = 0
    while t < t1: place(S, thud(seed + k, 50), t, gain); place(S, noise_burst(0.3, 100, 1500, 0.005, 10, seed + 300 + k), t, gain * 0.4); k += 1; t += 1 / rate

# ---------------------------------------------------------------- MUSIC (D dorian → D minor → D major)
def music():
    M = buf()
    # hook: a brass-and-choir stab under the king
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4', 'A4'], 2.2, 'a', att=0.05, rel=0.8, seed=1, bright=1.5), 0.05, 0.8)
    place(M, dr.syn.brass_swell(['D2', 'A2', 'D3', 'F#3'], 2.1, att=0.1, seed=2), 0.05, 0.4)
    place(M, taiko(44, 1.6, 1), 0.05, 1.0)
    # the forest: a gentle wooden flute over strings, mysterious but beautiful
    place(M, drone(hz('D2'), 12.0, att=1.5, rel=2.0, seed=3, bright=700), 2.2, 0.22)
    place(M, choir_chord(['D3', 'A3', 'F4'], 6.0, 'u', att=1.5, rel=1.5, seed=4), 2.4, 0.3)
    place(M, melody(FOREST, 2.6, 0.42, flute, 0.32, 10), 0, 1.0)
    place(M, choir_chord(['Bb2', 'F3', 'D4'], 5.4, 'u', att=1.0, rel=1.2, seed=5), 8.6, 0.32)
    place(M, melody(SAD, 9.6, 0.55, flute, 0.28, 20), 0, 1.0)
    # weakness is a death sentence: everything drops to a low drone and a distant howl
    place(M, drone(hz('D1'), 3.2, att=0.4, rel=0.6, seed=6, bright=350), 14.0, 0.45)
    # the knights: war drums, low brass, a minor choir; the burning
    t = 16.8; k = 0
    while t < 21.6: place(M, taiko(54, 0.9, 100 + k), t, 0.55 + (t - 16.8) * 0.06); place(M, taiko(70, 0.5, 200 + k), t + 0.25, 0.3); k += 1; t += 0.5
    place(M, choir_chord(['D3', 'F3', 'A3', 'D4'], 4.9, 'a', att=0.4, rel=0.6, seed=7, bright=1.2), 16.8, 0.55)
    place(M, dr.syn.brass_swell(['D2', 'A2', 'D3'], 4.8, att=0.5, seed=8), 16.8, 0.35)
    # you ran: a fast string ostinato
    def g_run(tm): return np.clip((tm - 21.6) / 0.2, 0, 1) * np.clip((23.5 - tm) / 0.3, 0, 1)
    place(M, syn.strings_ostinato(['D2', 'F2', 'D2', 'C2'], 21.6, 140, 2, g_run), 21.6, 0.5)
    # survival and the seasons: the hero theme grows, horn over strings
    def g_surv(tm): return np.clip((tm - 23.4) / 1.0, 0, 1) * np.clip((32.8 - tm) / 0.4, 0, 1)
    place(M, syn.strings_ostinato(['D2', 'D2', 'Bb1', 'C2'], 23.4, 100, 4, g_surv), 23.4, 0.35)
    place(M, melody(THEME, 23.6, 0.38, flute, 0.26, 30), 0, 1.0)
    place(M, melody(THEME, 29.4, 0.38, lambda f, d, seed=0: horn_note(f, d, att=0.12, seed=seed), 0.32, 40), 0, 1.0)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F4'], 3.6, 'a', att=1.0, rel=0.6, seed=9), 29.3, 0.45)
    # the brute: heavy drums and a dark choir; the blow; silence; the warlord rises on the theme
    for t0, g in [(32.8, 0.9), (33.2, 1.2), (34.0, 0.7), (34.6, 0.8), (35.1, 1.1), (35.5, 0.8), (36.2, 1.4), (37.0, 1.3)]: place(M, taiko(40 + rs.rand() * 8, 1.6, int(t0 * 10)), t0, g)
    place(M, choir_chord(['D3', 'Eb3', 'A3', 'C4'], 3.6, 'o', att=0.3, rel=0.4, seed=11, bright=1.2), 32.8, 0.6)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4'], 3.0, 'a', att=0.2, rel=0.8, seed=12, bright=1.4), 37.3, 0.65)
    place(M, melody(THEME[:5], 37.5, 0.4, lambda f, d, seed=0: horn_note(f, d, att=0.1, seed=seed), 0.4, 50), 0, 1.0)
    # followers: the theme in full with a marching pulse
    def g_fol(tm): return np.clip((tm - 39.8) / 0.6, 0, 1) * np.clip((59.55 - tm) / 0.05, 0, 1) * (0.6 + 0.4 * np.clip((tm - 43.2) / 4, 0, 1))
    place(M, syn.strings_ostinato(['D2', 'D2', 'C2', 'Bb1'], 39.8, 110, 9, g_fol), 39.8, 0.45)
    place(M, choir_chord(['G2', 'D3', 'G3', 'Bb3'], 3.5, 'a', att=0.8, rel=0.6, seed=13), 39.8, 0.45)
    # the return: a war march — drums, brass, full choir
    t = 43.2; k = 0
    while t < 53.2: g = 0.6 + 0.4 * (t - 43.2) / 10; place(M, taiko(48, 1.0, 300 + k), t, g); place(M, taiko(66, 0.5, 400 + k), t + 0.27, g * 0.5); k += 1; t += 60 / 110
    place(M, choir_chord(['D3', 'A3', 'D4', 'F4', 'A4'], 4.6, 'a', att=0.5, rel=0.4, seed=14, bright=1.4), 43.2, 0.65)
    place(M, dr.syn.brass_swell(['D2', 'A2', 'D3', 'F3'], 4.4, att=0.6, seed=15), 43.2, 0.45)
    place(M, melody(THEME, 43.6, 0.46, lambda f, d, seed=0: horn_note(f, d, att=0.1, seed=seed), 0.45, 60), 0, 1.0)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4'], 2.4, 'a', att=0.3, rel=0.3, seed=16, bright=1.4), 47.6, 0.6)
    place(M, choir_chord(['C3', 'G3', 'C4', 'E4'], 3.6, 'a', att=0.2, rel=0.4, seed=17, bright=1.5), 49.8, 0.7)
    # the king: D MAJOR — triumphant choir, brass, the theme in major; hard cut to silence at the eyes
    place(M, choir_chord(['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'], 6.6, 'a', att=0.4, rel=0.1, seed=18, bright=1.6), 53.1, 0.85)
    place(M, dr.syn.brass_swell(['D2', 'A2', 'D3', 'F#3'], 6.5, att=0.6, seed=19), 53.1, 0.5)
    place(M, melody(TRIUMPH, 53.4, 0.5, lambda f, d, seed=0: horn_note(f, d, att=0.1, seed=seed), 0.5, 70), 0, 1.0)
    for t0, g in [(53.2, 1.3), (55.2, 0.9), (57.0, 1.1), (58.4, 1.4)]: place(M, taiko(40, 1.8, int(t0 * 10)), t0, g)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4'], 2.8, 'o', att=0.6, rel=1.6, seed=20), 59.75, 0.4)
    M = reverb(M, 3.0, 0.3, damp=5000, seed=1)
    tl = tt(N); M[(tl >= C['cut']) & (tl < 59.75)] = 0.0
    return M

def sfx():
    S = buf(); B = buf()
    # hook: the army roars, the cleaver rises
    place(S, crowd(2.2, 1, 30) * 1.4, 0.0, 0.9); place(S, dragon_roar(1.4, 150, 2, 0.6) * 0.6, C['hook_roar'], 0.5); place(S, whoosh(0.5, 400, 2500, 3, q=1.2), C['cleaver_up'], 0.5)
    # the forest: birds, leaves in the wind, a crackling fire, tribe chatter
    place(S, birds(2.2, 14.0, 4, 3.0), 2.2, 0.8); place(S, leaves_wind(2.2, 16.8, 5), 2.2, 0.6)
    place(S, crackle_track(2.2, 14.0, 22, 0.25, 6), 2.2, 1.0, 0.2)
    for i in range(10): place(S, goblin_voice(10 + i, 0.4 + rs.rand() * 0.4, 380 + rs.rand() * 200), 3.0 + i * 1.05 + rs.rand() * 0.3, 0.22, rs.rand() * 1.6 - 0.8)
    place(S, goblin_voice(30, 0.35, 760, 'squeak'), C['wake'], 0.35)
    place(S, goblin_voice(31, 0.6, 330), C['snatch'] - 0.1, 0.45); place(S, goblin_voice(32, 0.3, 820, 'squeak'), C['fall'], 0.4); place(S, thud(33, 90), C['fall'] + 0.1, 0.3)
    for i in range(4): place(S, goblin_voice(34 + i, 0.5, 360 + i * 30), 12.4 + i * 0.25, 0.3, i * 0.4 - 0.6)   # laughter as they leave
    # the wolf
    place(S, growl(1.6, 40, 70), C['wolf_growl'], 0.7); place(B, howl(2.6, 41), 15.6, 0.25, -0.6)
    # the knights: marching plate, a war horn, the burning
    march(C['march'][0], C['march'][1], S, 2.0, 50)
    place(B, horn_note(hz('A2'), 1.4, att=0.15, seed=51), C['horn_knights'], 0.6); place(B, horn_note(hz('D3'), 1.2, att=0.15, seed=52), C['horn_knights'] + 1.0, 0.5)
    place(S, flame(C['burn'][1] - C['burn'][0], 53, 1.6), C['burn'][0], 0.8); place(S, crackle_track(C['burn'][0], C['burn'][1], 150, 0.6, 54, 0.2), C['burn'][0], 1.0)
    for i, t0 in enumerate(C['clash']): place(S, clang(60 + i), t0, 0.6, (i % 2) * 0.8 - 0.4)
    for i in range(6): place(S, goblin_voice(70 + i, 0.4, 600 + rs.rand() * 300, 'squeak'), 19.0 + i * 0.4, 0.3, rs.rand() * 1.6 - 0.8)
    # running: panting footsteps in grass
    t = C['run'][0] + 0.05
    while t < C['run'][1]: place(S, noise_burst(0.12, 400, 5000, 0.004, 30, int(t * 100)), t, 0.4); t += 0.19
    # survival foley
    place(S, birds(23.4, 25.0, 80, 2.0), 23.4, 0.5)
    place(S, whoosh(0.35, 500, 3000, 81, q=1.4), C['throw'] - 0.05, 0.6); place(S, thud(82, 140), C['hit_hare'], 0.35)
    t = C['knap'][0] + 0.1; k = 0
    while t < C['knap'][1]: place(S, metal_hit(2400 + rs.rand() * 800, 0.15, 90 + k, noise=0.8) * 0.5, t, 0.35); k += 1; t += 0.33
    place(S, crackle_track(C['knap'][0], C['knap'][1], 30, 0.3, 95), C['knap'][0], 1.0)
    place(S, ep2.cold_wind()[int(26.6 * SR):int(29.4 * SR)] * 2.5, 26.6, 1.0)
    place(S, growl(0.9, 100, 95), C['wolf_leap'] - 0.3, 0.8); place(S, whoosh(0.6, 200, 1500, 101, q=1.0), C['wolf_leap'], 0.4)
    place(S, thud(102, 70), C['wolf_hit'], 0.8); place(S, goblin_voice(103, 0.45, 300, 'squeak'), C['wolf_hit'] + 0.05, 0.4); place(S, growl(0.5, 104, 160) * 0.6, C['wolf_hit'] + 0.1, 0.5)
    place(S, leaves_wind(C['seasons'][0], C['seasons'][1], 110, 1.2), C['seasons'][0], 0.6); place(S, birds(29.4, 31.0, 111, 2.0), 29.4, 0.4)
    # the brute
    place(S, dragon_roar(1.6, 70, 120, 1.2), C['brute_roar'], 1.1); place(S, rumble(1.5, 121, 20, 120), C['brute_roar'], 0.5)
    place(S, whoosh(0.5, 150, 1200, 122, q=1.0), C['brute_swing'], 0.8); place(S, thud(123, 50), C['brute_swing'] + 0.45, 0.9)
    place(S, goblin_voice(124, 0.5, 520, 'squeak'), C['leap'], 0.4); place(S, whoosh(0.4, 600, 3000, 125, q=1.3), C['leap'] + 0.1, 0.4)
    place(S, noise_burst(0.3, 300, 4000, 0.002, 18, 126), C['stab'], 0.8); place(S, dragon_roar(1.2, 55, 127, 1.0), C['stab'] + 0.05, 0.7)
    place(S, rumble(2.5, 128, 18, 140), C['brute_fall'], 1.4); place(S, noise_burst(1.8, 100, 3000, 0.01, 2.2, 129), C['brute_fall'], 0.7)
    place(S, metal_hit(500, 1.2, 130, noise=0.5), C['rise'] + 0.4, 0.4)
    # followers: many feet in grass, chatter
    army_stomp(C['march2'][0], C['march2'][1], S, 1.8, 140, 0.35)
    for i in range(14): place(S, goblin_voice(150 + i, 0.5, 350 + rs.rand() * 250), 40.0 + i * 0.22, 0.15, rs.rand() * 1.6 - 0.8)
    # the army: a sea of voices and stomping
    place(S, crowd(4.4, 160, 40) * 1.6, C['army'][0], 0.8); army_stomp(C['army'][0], C['army'][1], S, 2.2, 170, 0.7)
    place(B, horn_note(hz('D2'), 2.6, att=0.25, seed=180), C['war_horn'], 0.8); place(B, horn_note(hz('A2'), 2.0, att=0.25, seed=181), C['war_horn'] + 0.3, 0.5)
    # the charge: roar of the horde, fleeing armour, dropped shields
    place(S, crowd(3.4, 190, 46) * 2.0, C['charge'][0], 1.0); army_stomp(C['charge'][0], C['charge'][1], S, 3.4, 200, 0.9)
    march(C['charge'][0], C['charge'][1], S, 3.2, 210)
    for i in range(4): place(S, clang(220 + i), 50.4 + i * 0.6, 0.45, (i % 2) * 0.8 - 0.4)
    # the king: the army falls to its knees as one; wind; silence; his eyes
    place(S, noise_burst(1.2, 150, 2500, 0.05, 2.5, 230), C['kneel'], 0.9); place(S, thud(231, 45), C['kneel'] + 0.1, 0.9)
    place(S, leaves_wind(53.2, 59.6, 232, 0.8), 53.2, 0.6)
    place(S, heartbeat(233, 44), C['eyes'], 0.9)
    S = reverb(S, 1.6, 0.18, 5500, 2) + reverb(B, 3.2, 0.45, 4500, 3)
    tl = tt(N); S[(tl >= C['cut']) & (tl < 62.5)] = 0.0
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
    Mu_d = norm(Mu_d, 0.6); Sx_d = norm(Sx_d, 0.82); Vn = norm(V, 0.9)
    mix = Vn + Mu_d * 0.66 + Sx_d * 0.72
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
