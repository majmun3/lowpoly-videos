"""Original procedural score + sound design for VHALDREN — EPISODE 2: THE SILENT KINGDOM.
Reuses Episode 1's synthesis toolkit (the-last-ember/audio/synth.py); every sound is generated from scratch.
Usage: python synth.py VO_DIR OUT_DIR
"""
import os, sys, math, subprocess, importlib.util
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
EP1 = os.path.join(HERE, '..', '..', 'the-last-ember', 'audio')
spec = importlib.util.spec_from_file_location('ep1synth', os.path.join(EP1, 'synth.py'))
syn = importlib.util.module_from_spec(spec); spec.loader.exec_module(syn)
from importlib.machinery import SourceFileLoader
TL = SourceFileLoader('timeline_ep2', os.path.join(HERE, 'timeline.py')).load_module()

SR = syn.SR
syn.DURATION = TL.DURATION; syn.N = int(TL.DURATION * SR); N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, footstep, chain_rattle, crackle_track = (
    syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.footstep, syn.chain_rattle, syn.crackle_track)
rs = np.random.RandomState(2)
C = TL.CUES

# ---------------------------------------------------------------- new instruments
def music_box_note(f, dur=2.2, detune=0.0):
    n = int(dur * SR); t = tt(n); f = f * 2 ** (detune / 1200)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.35 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 5) + 0.15 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t * 9)
    s += np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 60) * 0.3  # tine click
    return (s * np.minimum(t / 0.002, 1)).astype(np.float32)

MOTIF = ['E5', 'G#5', 'C#6', 'B5', 'G#5', 'E5', 'F#5', 'D#5']   # an out-of-tune lullaby in C# minor / E major
def music_box(t0, t1, gain_fn, beat=0.46, transpose=0, seed=0):
    out = buf(); r = np.random.RandomState(seed); t = t0; k = 0
    while t < t1:
        nm = MOTIF[k % len(MOTIF)]; f = hz(nm) * 2 ** (transpose / 12)
        # the box is running down: slight drag and detune grow over time
        place(out, music_box_note(f, 2.4, detune=r.randn() * 9 + 6 * math.sin(k * 0.7)), t, gain_fn(t) * (0.85 + r.rand() * 0.3), math.sin(k * 1.3) * 0.5)
        t += beat * (1 + 0.04 * math.sin(k * 0.9) + (0.25 if k % 8 == 7 else 0)); k += 1
    return out

def whispers(dur, voices=10, seed=0):
    """Dozens of breathy, wordless whispers: formant-filtered noise with syllabic envelopes."""
    n = int(dur * SR); out = np.zeros((n, 2), np.float32); r = np.random.RandomState(seed); t = tt(n)
    for v in range(voices):
        x = r.randn(n)
        f1, f2 = 500 + r.rand() * 500, 1400 + r.rand() * 1200
        a = fft_filter(x, f1 * 0.7, f1 * 1.3, 1.5) + fft_filter(x, f2 * 0.8, f2 * 1.25, 1.5) * 0.8 + fft_filter(x, 3000, 7000) * 0.5
        rate = 3.5 + r.rand() * 3
        syl = np.clip(np.sin(2 * np.pi * rate * t + r.rand() * 6) * 0.5 + 0.5 + r.randn() * 0.0, 0, 1) ** 2
        phrase = np.clip(np.sin(2 * np.pi * (0.25 + r.rand() * 0.3) * t + r.rand() * 6) * 1.4, 0, 1)
        s = a * syl * phrase
        p = (r.rand() - 0.5) * 1.8; ang = (p + 1) * np.pi / 4
        out[:, 0] += s * np.cos(ang); out[:, 1] += s * np.sin(ang)
    e = np.minimum(t / 0.8, 1) * np.clip((dur - t) / 0.8, 0, 1)
    return (out * e[:, None] / voices ** 0.5).astype(np.float32)

def creak(dur, f0=180, seed=0):
    """Stone-and-porcelain grind of a head turning after centuries."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    stick = np.cumsum(r.randn(n)) ; stick = (stick - stick.mean()) / (np.abs(stick).max() + 1e-9)
    f = f0 * (1 + 0.3 * np.sin(2 * np.pi * 1.3 * t) + 0.1 * stick)
    pulses = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.92).astype(np.float32)
    s = fft_filter(pulses * r.randn(n), 200, 2500) * 2 + fft_filter(r.randn(n), 60, 600) * 0.3
    return (s * np.sin(np.pi * t / dur) ** 0.7).astype(np.float32)

def snow_step(seed):
    n = int(0.3 * SR); t = tt(n); r = np.random.RandomState(seed)
    crunch = fft_filter(r.randn(n) * (r.rand(n) > 0.6), 900, 6000) * np.exp(-t * 14)
    thud = np.sin(2 * np.pi * 60 * t) * np.exp(-t * 30) * 0.5
    jingle = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 45) * 0.08 for f in (2900 + r.rand() * 400, 4100 + r.rand() * 500))
    return (crunch * 0.9 + thud + jingle).astype(np.float32)

def tick(seed, f=3200):
    n = int(0.12 * SR); t = tt(n); r = np.random.RandomState(seed)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * 0.6 + fft_filter(r.randn(n) * np.exp(-t * 120), 2000, 9000) * 0.6 + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 40) * 0.5).astype(np.float32)

def grind(dur, seed=0, f=24):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    s = fft_filter(r.randn(n), 80, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * f * t) ** 2) + fft_filter(r.randn(n), 40, 160) * 0.8
    return (s * np.minimum(t / 0.4, 1) * np.clip((dur - t) / 0.6, 0, 1)).astype(np.float32)

def breath(dur=2.4, seed=0):
    """The machine 'breathing': a slow sub-bass swell with a hiss, like a vast bellows."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    env = np.sin(np.pi * t / dur) ** 2
    s = np.sin(2 * np.pi * (34 + 6 * env) * t) * env + fft_filter(r.randn(n), 300, 2500) * env * 0.25
    return s.astype(np.float32)

def scrape(dur=0.6, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    s = fft_filter(r.randn(n), 2500, 9000) * np.exp(-((t - dur * 0.4) / (dur * 0.35)) ** 2) + np.sin(2 * np.pi * (2400 + 1800 * t / dur) * t) * np.exp(-((t - dur * 0.5) / (dur * 0.3)) ** 2) * 0.25
    return s.astype(np.float32)

def great_bell(f0=hz('D1'), dur=14):
    b = bell(f0, dur, 0.8, 99) * 1.0 + bell(f0 * 2.003, dur, 0.6, 98) * 0.4
    return b

def cold_wind():
    r = np.random.RandomState(9); t = tt(N)
    g = np.interp(t, np.linspace(0, TL.DURATION, 50), 0.45 + 0.55 * r.rand(50))
    L = fft_filter(r.randn(N), 200, 1600, 0.8) * g; R = fft_filter(r.randn(N), 200, 1600, 0.8) * g[::-1]
    howl = np.zeros(N)
    for k in range(3):
        f = 500 + k * 230 + 120 * np.sin(2 * np.pi * (0.05 + k * 0.03) * t + k)
        howl += np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.interp(t, np.linspace(0, TL.DURATION, 30), r.rand(30)) ** 3)
    howl = fft_filter(howl * (1 + 0.3 * r.randn(N)), 300, 1500) * 0.15
    W = np.stack([L + howl, R + howl * 0.8], 1)
    lv = np.interp(t, [0, 5.4, 5.6, 9.5, 13.4, 21.9, 30.5, 41.1, 57.4, 57.45, 63], [0.25, 0.25, 1.4, 1.3, 0.55, 0.45, 0.4, 0.12, 0.12, 0.0, 0.0])
    return (W * lv[:, None] * 0.35).astype(np.float32)

# ---------------------------------------------------------------- MUSIC
def music():
    M = buf()
    def mb_gain(t):
        return np.interp(t, [0, 5.5, 9.6, 13.4, 21.9, 24.0, 24.3, 26, 30.4, 60, 63], [0.55, 0.45, 0.2, 0.45, 0.4, 0.0, 0.0, 0.25, 0.0, 0.0, 0.0])
    place(M, music_box(0.2, 30.4, mb_gain, 0.46, 0, 1), 0, 0.5)
    # drones
    place(M, drone(hz('C#1'), 30, att=2.0, rel=2.0, seed=3, bright=500), 0.0, 0.4)
    place(M, drone(hz('C#1'), 26.0, att=1.5, rel=1.0, seed=4, bright=700), 31.0, 0.55)
    # the reveal: a beautiful, almost peaceful choir (E major -> C#m)
    place(M, choir_chord(['E3', 'B3', 'E4', 'G#4'], 4.6, 'u', att=1.6, rel=1.2, seed=11), 9.4, 0.5)
    place(M, choir_chord(['E3', 'G#3', 'B3', 'E4'], 4.6, 'a', att=1.0, rel=1.0, seed=12), 13.2, 0.45)
    place(M, choir_chord(['C#3', 'G#3', 'C#4', 'E4'], 4.6, 'o', att=1.0, rel=1.0, seed=13), 17.6, 0.45)
    # unease: a slow dissonant cluster rising under the head-turn; silence right before 'It had no face'
    n = int(3.0 * SR); cl = sum(osc(syn.saw_table(40), hz(nm), n, vib=0.003, drift=0.0006, seed=20 + i) for i, nm in enumerate(['C#3', 'D3', 'G3', 'G#3']))
    place(M, fft_filter(cl * adsr(n, 2.6, 0.1, 1, 0.05) / 4, 80, 1500), 21.0, 0.4)
    place(M, choir_chord(['C#3', 'G3', 'C4', 'E4'], 2.2, 'a', att=0.02, rel=1.8, seed=21, bright=1.3), C['no_face'], 0.75)     # stinger
    place(M, choir_chord(['C#3', 'G#3', 'C#4', 'D4'], 4.0, 'o', att=0.8, rel=1.0, seed=22), 25.8, 0.5)
    # the turn of the city -> sword -> the bell: hits
    for t0, g in [(C['no_face'], 1.0), (25.8, 0.5), (29.45, 0.6), (30.62, 1.3), (32.5, 0.6), (37.9, 0.9), (41.1, 0.8), (46.45, 1.2), (48.5, 0.6), (51.0, 0.6), (54.8, 0.9), (55.6, 0.7), (56.3, 0.8), (56.9, 1.0)]:
        place(M, taiko(46 + rs.rand() * 8, 1.6, int(t0 * 10)), t0, 0.9 * g)
    # the warning: pulsing low ostinato (90 bpm) with whispers above
    def g_ost(t): return np.clip((t - 32.5) / 2, 0, 1) * np.clip((57.35 - t) / 0.05, 0, 1) * (0.6 + 0.4 * np.clip((t - 41) / 10, 0, 1))
    place(M, syn.strings_ostinato(['C#2', 'C#2', 'A1', 'G#1'], 32.5, 90, 9, g_ost), 32.5, 0.5)
    place(M, choir_chord(['C#3', 'E3', 'G#3', 'C#4'], 6.0, 'u', att=2.0, rel=1.0, seed=31), 32.4, 0.45)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4'], 4.0, 'a', att=1.5, rel=0.8, seed=32), 38.0, 0.5)
    # the Stillwork: organ-like choir, then the iris opens (a vast golden chord), recognition
    place(M, choir_chord(['C#2', 'G#2', 'C#3', 'E3', 'G#3'], 5.2, 'o', att=1.4, rel=0.8, seed=41), 41.0, 0.6)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 2.4, 'a', att=0.15, rel=1.0, seed=42, bright=1.5), 46.4, 0.75)
    place(M, syn.brass_swell(['A1', 'E2', 'A2', 'C#3'], 2.5, att=0.3, seed=43), 46.4, 0.35)
    place(M, choir_chord(['F#2', 'C#3', 'F#3', 'A3'], 3.6, 'u', att=0.6, rel=0.8, seed=44), 48.4, 0.5)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4'], 3.9, 'a', att=0.8, rel=0.4, seed=45, bright=1.3), 51.0, 0.55)
    # climax: rising roll and full choir — then the hard cut
    t = 54.8; k = 0
    while t < 57.35:
        place(M, taiko(72, 0.4, 700 + k), t, 0.25 + 0.6 * (t - 54.8) / 2.6); k += 1; t += max(0.06, 0.28 * (1 - (t - 54.8) / 2.6))
    place(M, choir_chord(['C#3', 'G#3', 'C#4', 'E4', 'G#4'], 2.8, 'a', att=0.6, rel=0.05, seed=51, bright=1.6), 54.7, 0.85)
    place(M, syn.brass_swell(['C#2', 'G#2', 'C#3', 'E3'], 2.8, att=1.0, seed=52), 54.7, 0.45)
    # after the cut: one low breath under the last line, then the music box's last notes for the title
    place(M, drone(hz('C#1'), 5.5, att=1.2, rel=2.0, seed=61, bright=300), 57.6, 0.3)
    end = buf()
    for i, nm in enumerate(['E5', 'G#5', 'C#6']): place(end, music_box_note(hz(nm), 3.0, detune=8 * i), 60.2 + i * 0.55, 0.6, (i - 1) * 0.4)
    M = M + end
    M = reverb(M, 3.8, 0.35, damp=4200, seed=1)
    tline = tt(N); M[(tline >= C['cut']) & (tline < 57.6)] = 0.0   # the hard cut to black is a hard cut to silence
    fadein = np.clip((tline - 57.6) / 0.4, 0, 1); M[tline >= 57.6] *= fadein[tline >= 57.6][:, None]
    return M

# ---------------------------------------------------------------- SFX
def sfx():
    S = buf(); B = buf()
    # hook: lamp flame, a far bell
    place(S, crackle_track(0, 5.4, 18, 0.18, 3), 0.0, 1.0, 0.3)
    place(B, bell(hz('E2'), 6, 0.5, 1), 0.4, 0.3, -0.4)
    # blizzard pass: crunching steps
    t = 5.65
    while t < 9.5: place(S, snow_step(int(t * 100)), t, 0.6, 0.1); t += 1 / (2 * 0.7)
    # reveal: distant city bells, soft
    for i, (dt, nm) in enumerate([(0.3, 'B2'), (1.4, 'E3'), (2.6, 'G#2')]): place(B, bell(hz(nm), 5, 0.6, 10 + i), 9.6 + dt, 0.18, (i - 1) * 0.6)
    # the city: footsteps on stone, lantern chain, frozen silence
    for (t0, t1, cyc) in C['steps']:
        t = t0 + 0.1; k = 0
        while t < t1: place(S, footstep(int(t * 100), 0.9), t, 0.45, -0.15 if k % 2 else 0.15); k += 1; t += 1 / (2 * cyc)
    for t in np.arange(13.6, 22.0, 0.62): place(S, chain_rattle(0.45, int(t * 10), 12), t, 0.08, -0.4)
    # the head turns (creak) — and every head in the city turns
    place(S, creak(1.5, 170, 1), C['turn'][0], 0.8, 0.3)
    for i in range(14): place(S, creak(1.0 + rs.rand() * 0.8, 120 + rs.rand() * 160, 10 + i), C['all_turn'][0] + rs.rand() * 2.2, 0.35, rs.rand() * 1.6 - 0.8)
    # steel
    place(S, scrape(0.55, 5), C['sword'], 0.8); place(S, metal_hit(1500, 1.2, 6, noise=0.2), C['sword'] + 0.42, 0.35)
    # THE WAKEBELL
    place(B, great_bell(hz('C#1'), 14), C['bell'], 1.2); place(S, rumble(4.0, 7, 18, 140), C['bell'], 1.2)
    place(S, noise_burst(3.0, 300, 6000, 0.05, 1.3, 8), C['bell'] + 0.1, 0.25)       # snow cascading off the roofs
    # the Stilled approach: shuffling robes, whispers
    for i in range(30): place(S, noise_burst(0.5, 300, 2500, 0.08, 4, 30 + i), 32.6 + rs.rand() * 3.2, 0.12, rs.rand() * 1.6 - 0.8)
    place(S, whispers(8.5, 14, 3), C['whisper'][0], 0.75)
    for i in range(14): place(S, noise_burst(0.4, 100, 1500, 0.02, 7, 70 + i), 35.7 + i * 0.09, 0.2, rs.rand() * 1.6 - 0.8)   # kneeling
    # something still breathing below: the plaza opens
    for t0 in (36.2, 38.9): place(S, breath(2.6, int(t0)), t0, 0.8)
    place(S, grind(3.0, 9), C['open'], 0.9); place(S, rumble(3.5, 10, 20, 120), C['open'] + 0.3, 0.8)
    # the Stillwork: ticking escapement, gears, pistons, steam
    for (t0, t1, period, f) in [(41.1, 57.35, 0.5, 3200), (41.1, 57.35, 0.25, 4800)]:
        t = t0; k = 0
        while t < t1: place(S, tick(int(t * 1000) + k, f), t, 0.22 if period > 0.3 else 0.08, 0.3 if period > 0.3 else -0.3); k += 1; t += period * (1 if t < 46.0 or t > 47.0 else 6)  # stalls as it 'sees' him
    place(S, grind(16.2, 11, 18), 41.1, 0.45, -0.2)
    for t0 in np.arange(41.6, 57.3, 2.2): place(S, noise_burst(0.9, 1500, 9000, 0.05, 3, int(t0)), t0, 0.15, rs.rand() - 0.5)  # steam
    for t0 in np.arange(42.0, 57.3, 1.43): place(S, metal_hit(260 + rs.rand() * 60, 0.8, int(t0 * 7), noise=0.4), t0, 0.2, rs.rand() * 1.4 - 0.7)  # pistons
    place(S, whoosh(1.6, 120, 1800, 12, q=0.9), C['iris'] - 0.3, 0.7); place(S, rumble(2.5, 13, 20, 120), C['iris'] + 0.4, 0.8)
    place(S, chain_rattle(1.2, 14, 35), C['iris'] + 0.2, 0.25)
    # threads: a high, glassy shimmer of souls
    n = int(6.0 * SR); sh = sum(np.sin(2 * np.pi * f * tt(n) + rs.rand() * 6) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.3 + rs.rand()) * tt(n))) for f in (1760, 2217, 2637, 3322))
    place(S, (sh * adsr(n, 1.5, 0.1, 1, 1.5) * 0.08).astype(np.float32), 48.4, 1.0)
    # the raise: the kingdom shakes
    place(S, rumble(2.7, 15, 18, 160) * 1.0, 54.8, 1.2); place(S, noise_burst(2.6, 80, 2500, 0.5, 0.2, 16), 54.8, 0.35)
    place(S, metal_hit(900, 1.0, 17, noise=0.3), 55.2, 0.25)
    # title: one distant toll
    place(B, bell(hz('C#2'), 6, 0.5, 18), 60.1, 0.35)
    S += cold_wind()
    S = reverb(S, 1.8, 0.2, 5000, 2) + reverb(B, 6.0, 0.55, 3500, 3)
    t = tt(N); S[(t >= C['cut']) & (t < 60.05)] *= 0.0
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); print('vo done')
    Mu = music(); print('music done')
    Sx = sfx(); print('sfx done')
    env = np.abs(V).max(1); win = int(0.25 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.45 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.25 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.55); Sx_d = norm(Sx_d, 0.8); Vn = norm(V, 0.9)
    mix = Vn + Mu_d * 0.62 + Sx_d * 0.72
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
