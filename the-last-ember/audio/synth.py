"""Original procedural score + sound design for THE LAST EMBER.
Everything here is synthesized from scratch with numpy (no samples, no external music).
Usage: python synth.py VO_DIR OUT_DIR
Writes music.wav, sfx.wav, vo.wav and mix.wav (48 kHz stereo float).
"""
import os, sys, json, subprocess, math
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from timeline import DURATION, NARRATION, CUES

SR = 48000
N = int(DURATION * SR)
rs = np.random.RandomState(1234)

def buf(): return np.zeros((N, 2), np.float32)
def tt(n): return np.arange(n) / SR
def place(b, sig, t0, gain=1.0, pan=0.0):
    """Add mono or stereo sig into stereo buffer b at time t0 with equal-power pan (-1..1)."""
    i0 = int(t0 * SR)
    if i0 >= N: return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    n = min(len(sig), N - i0)
    b[i0:i0 + n] += sig[:n] * gain

def fft_filter(x, lo=None, hi=None, slope=1.0):
    """Zero-phase FFT band filter with smooth (butterworth-like magnitude) edges."""
    n = len(x); X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(n, 1 / SR)
    H = np.ones_like(f)
    if hi: H *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    if lo: H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    if X.ndim == 2: H = H[:, None]
    return np.fft.irfft(X * H, n, axis=0).astype(np.float32)

def fft_conv(x, ir):
    n = len(x) + len(ir) - 1; m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:len(x)].astype(np.float32)

def reverb_ir(seconds, damp=3000, seed=0, pre=0.012):
    r = np.random.RandomState(seed); n = int(seconds * SR)
    t = tt(n); env = np.exp(-6.9 * t / seconds)
    L = r.randn(n) * env; R = r.randn(n) * env
    L = fft_filter(L, 80, damp); R = fft_filter(R, 80, damp)
    p = int(pre * SR); L = np.concatenate([np.zeros(p), L]); R = np.concatenate([np.zeros(p), R])
    s = np.sqrt((L ** 2).sum()); return (L / s).astype(np.float32), (R / s).astype(np.float32)

def reverb(b, seconds, wet, damp=3000, seed=0):
    L, R = reverb_ir(seconds, damp, seed)
    m = b.mean(1)
    out = b * (1 - wet * 0.5)
    out[:, 0] += fft_conv(m, L) * wet * 6
    out[:, 1] += fft_conv(m, R) * wet * 6
    return out

def adsr(n, a, d, s, r, sus_t=None):
    t = tt(n); e = np.ones(n) * s
    A = int(a * SR); D = int(d * SR); R = int(r * SR)
    e[:A] = np.linspace(0, 1, max(A, 1))[:len(e[:A])]
    e[A:A + D] = np.linspace(1, s, max(D, 1))[:len(e[A:A + D])]
    if R > 0: e[-R:] *= np.linspace(1, 0, R)
    return e.astype(np.float32)

# ---------------------------------------------------------------- wavetables
TW = 4096
def table_from_harmonics(amps):
    ph = np.arange(TW) / TW; w = np.zeros(TW)
    for h, a in enumerate(amps, 1):
        if a: w += a * np.sin(2 * np.pi * h * ph)
    return (w / (np.abs(w).max() + 1e-9)).astype(np.float32)

def osc(table, freq, n, vib=0.0, vib_rate=5.0, drift=0.0, seed=0):
    """Wavetable oscillator. freq: scalar or array; vibrato/drift as fractional depth."""
    r = np.random.RandomState(seed); t = tt(n)
    f = np.full(n, freq, np.float64) if np.isscalar(freq) else freq.astype(np.float64)
    if vib: f = f * (1 + vib * np.sin(2 * np.pi * vib_rate * t + r.rand() * 6.28))
    if drift:
        k = np.cumsum(r.randn(n // 4800 + 2)) * drift; f = f * (1 + np.interp(t, np.arange(len(k)) * 0.1, k))
    ph = (np.cumsum(f / SR) + r.rand()) % 1.0
    idx = ph * TW; i0 = idx.astype(np.int64) % TW; fr = idx - np.floor(idx)
    return (table[i0] * (1 - fr) + table[(i0 + 1) % TW] * fr).astype(np.float32)

def saw_table(nh=60, roll=1.0): return table_from_harmonics([1.0 / (h ** roll) for h in range(1, nh + 1)])

FORMANTS = {'a': [(700, 110, 1.0), (1220, 120, 0.5), (2600, 160, 0.25)], 'o': [(500, 90, 1.0), (850, 100, 0.45), (2500, 150, 0.15)],
            'u': [(350, 80, 1.0), (700, 90, 0.25), (2400, 140, 0.08)]}
def choir_table(f0, vowel='a'):
    amps = []
    for h in range(1, int(5000 / f0) + 1):
        fh = h * f0; g = 0.0
        for F, B, A in FORMANTS[vowel]: g += A / (1 + ((fh - F) / B) ** 2)
        amps.append(g * (1.0 / h ** 0.3))
    return table_from_harmonics(amps)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def hz(name):
    n, o = name[:-1], int(name[-1]); return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)

# ---------------------------------------------------------------- MUSIC
def choir_chord(notes, dur, vowel='a', att=1.2, rel=1.5, voices=3, seed=0, bright=1.0):
    n = int(dur * SR); out = np.zeros((n, 2), np.float32)
    for k, nm in enumerate(notes):
        f0 = hz(nm); tab = choir_table(f0, vowel)
        for v in range(voices):
            det = 2 ** ((rs.randn() * 7) / 1200)
            s = osc(tab, f0 * det, n, vib=0.004, vib_rate=4.6 + rs.rand(), drift=0.0006, seed=seed * 100 + k * 10 + v)
            am = 1 + 0.15 * np.sin(2 * np.pi * (0.2 + rs.rand() * 0.3) * tt(n) + rs.rand() * 6)
            pan = (rs.rand() - 0.5) * 1.4
            a = (pan + 1) * np.pi / 4
            out[:, 0] += s * am * np.cos(a); out[:, 1] += s * am * np.sin(a)
    out *= adsr(n, att, 0.1, 1.0, rel)[:, None] / (len(notes) * voices) ** 0.5
    return fft_filter(out, 90, 3200 * bright)

def drone(f0, dur, att=2.0, rel=2.0, seed=0, bright=600):
    n = int(dur * SR); tab = saw_table(40, 1.1)
    s = sum(osc(tab, f0 * m * 2 ** (d / 1200), n, drift=0.0004, seed=seed + i) for i, (m, d) in enumerate([(1, -6), (1, 6), (1.5, 2), (2, -3)]))
    s = s * adsr(n, att, 0.1, 1.0, rel) * (1 + 0.2 * np.sin(2 * np.pi * 0.08 * tt(n)))
    return fft_filter(s / 4, 25, bright)

def strings_ostinato(notes_by_bar, t0, bpm, bars, gain_curve):
    """Low string ostinato in eighth notes. notes_by_bar: list of note names (one per bar, cycles)."""
    beat = 60 / bpm; eighth = beat / 2; tab = saw_table(50, 1.0)
    n = int((bars * 4 * beat + 1) * SR); out = np.zeros((n, 2), np.float32)
    for bar in range(bars):
        nm = notes_by_bar[bar % len(notes_by_bar)]
        for e in range(8):
            ts = bar * 4 * beat + e * eighth; nn = int(eighth * 0.95 * SR)
            acc = 1.0 if e in (0, 3, 6) else 0.6
            for o, g in ((1, 1.0), (2, 0.45)):
                s = osc(tab, hz(nm) * o, nn, drift=0.0003, seed=bar * 16 + e * 2 + o) * adsr(nn, 0.008, 0.12, 0.55, 0.05) * acc * g
                i = int(ts * SR); out[i:i + nn, 0] += s * 0.9; out[i:i + nn, 1] += s * 1.0
    out = fft_filter(out, 40, 1400)
    g = gain_curve(t0 + tt(n))
    return out * g[:, None]

def brass_swell(notes, dur, att=1.5, seed=0):
    n = int(dur * SR); tab = saw_table(30, 0.9); s = np.zeros(n, np.float32)
    for k, nm in enumerate(notes): s += osc(tab, hz(nm), n, vib=0.003, vib_rate=5, drift=0.0004, seed=seed + k)
    s = s * adsr(n, att, 0.2, 0.9, 1.2) / len(notes)
    # brightness grows with the envelope (crude filter sweep by mixing two filtered copies)
    dark, bright = fft_filter(s, 60, 500), fft_filter(s, 60, 1800)
    e = adsr(n, att, 0.2, 0.9, 1.2)
    return dark * (1 - e) + bright * e

def taiko(f=55, dur=1.2, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    pitch = f * (1 + 1.2 * np.exp(-t * 18)); ph = np.cumsum(pitch / SR)
    body = np.sin(2 * np.pi * ph) * np.exp(-t * 4.5)
    skin = fft_filter(r.randn(n) * np.exp(-t * 30), 100, 1800) * 0.4
    return (body + skin).astype(np.float32)

def music():
    M = buf()
    # --- D minor drone bed through the whole piece (dips in the silence)
    place(M, drone(hz('D1'), 64, att=1.5, rel=3), 0.0, 0.5, 0)
    place(M, drone(hz('A1'), 30, att=4, rel=3, seed=5), 5.2, 0.25, -0.3)
    # --- choir: setup progression
    prog = [(3.0, ['D3', 'F3', 'A3'], 'u', 2.4), (5.2, ['D3', 'F3', 'A3', 'D4'], 'a', 4.5), (9.5, ['Bb2', 'D3', 'F3', 'Bb3'], 'a', 3.0),
            (12.4, ['G2', 'D3', 'G3', 'Bb3'], 'o', 4.6), (16.9, ['A2', 'E3', 'A3', 'C#4'], 'a', 4.5)]
    for i, (t0, ch, v, d) in enumerate(prog): place(M, choir_chord(ch, d + 1.2, v, att=1.0, rel=1.4, seed=i), t0 - 0.3, 0.55)
    # --- escalation: string ostinato 16.9 -> 34.3 (100 bpm), D-D-Bb-A pattern
    def g_ost(t): return np.clip((t - 16.9) / 3, 0, 1) * (0.5 + 0.5 * np.clip((t - 24.2) / 4, 0, 1)) * np.clip((34.0 - t) / 0.6, 0, 1) * (1 - 0.7 * ((t > 31.85) & (t < 32.3)))
    place(M, strings_ostinato(['D2', 'D2', 'Bb1', 'A1'], 16.9, 100, 12, g_ost), 16.9, 0.55)
    # high tremolo strings over the wyrm
    n = int(10 * SR); tr = osc(saw_table(40), hz('A4'), n, vib=0.004, drift=0.0005, seed=3) * (0.6 + 0.4 * np.sin(2 * np.pi * 12 * tt(n)))
    tr += osc(saw_table(40), hz('D5'), n, vib=0.004, drift=0.0005, seed=4) * (0.6 + 0.4 * np.sin(2 * np.pi * 12.5 * tt(n)))
    place(M, fft_filter(tr * adsr(n, 2.5, 0.1, 1.0, 1.5), 300, 3500), 24.2, 0.07, 0.3)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F4'], 7.0, 'a', att=2.0, rel=1.2, seed=11, bright=1.2), 24.0, 0.5)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4'], 3.6, 'a', att=0.3, rel=1.5, seed=12, bright=1.2), 30.7, 0.55)
    # drums
    for t0, g in [(0.05, 1.0), (3.0, 0.5), (16.9, 0.5), (24.2, 1.0), (25.4, 0.5), (26.6, 0.7), (27.7, 0.9), (28.5, 1.0), (29.4, 0.6), (30.6, 0.8), (31.8, 1.2), (32.35, 1.1),
                  (48.4, 1.0), (50.0, 0.8), (51.1, 0.6), (51.6, 0.6), (52.05, 1.3), (53.2, 0.7), (54.6, 1.0), (62.0, 0.8)]:
        place(M, taiko(48 + rs.rand() * 8, 1.6, int(t0 * 10)), t0, 0.9 * g, (rs.rand() - 0.5) * 0.4)
    # build-up rolls into the wyrm and the ignition
    for t0, t1 in [(22.9, 24.2), (50.6, 52.05)]:
        k = 0; t = t0
        while t < t1:
            place(M, taiko(70, 0.4, 900 + k), t, 0.25 + 0.5 * (t - t0) / (t1 - t0)); k += 1; t += max(0.07, 0.3 * (1 - (t - t0) / (t1 - t0)))
    # --- revelation: cathedral organ-choir
    place(M, choir_chord(['D2', 'A2', 'D3', 'F3', 'A3'], 6.8, 'o', att=1.5, rel=1.0, seed=21), 34.2, 0.6)
    place(M, drone(hz('D2'), 6.8, att=1.0, rel=1.2, seed=31, bright=900), 34.2, 0.35, 0.2)
    # silence 40.8-43.3 except one low breath; "It needed a keeper."
    place(M, choir_chord(['D3'], 2.0, 'u', att=0.8, rel=1.0, seed=41), 41.2, 0.18)
    # mural: low tremolo + minor choir building
    place(M, choir_chord(['D3', 'F3', 'A3'], 5.4, 'u', att=2.0, rel=0.8, seed=51), 43.2, 0.5)
    place(M, choir_chord(['G2', 'Bb2', 'D3', 'G3'], 3.0, 'a', att=1.5, rel=0.5, seed=52), 45.8, 0.45)
    n = int(5.2 * SR); trem = osc(saw_table(40), hz('D2'), n, drift=0.0004, seed=61) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * tt(n)))
    place(M, fft_filter(trem * adsr(n, 1.5, 0.1, 1.0, 0.4), 40, 1000), 43.3, 0.3)
    # flashback stabs
    place(M, choir_chord(['C#3', 'G3', 'Bb3', 'E4'], 1.6, 'a', att=0.02, rel=1.4, seed=71, bright=1.3), 48.4, 0.6)
    place(M, choir_chord(['C#3', 'G3', 'Bb3', 'E4'], 1.2, 'a', att=0.02, rel=1.0, seed=72, bright=1.3), 50.0, 0.5)
    # --- climax: Dm -> Bb, ignition, then D major dawn (picardy) and a bittersweet Bb -> D ending
    place(M, choir_chord(['D3', 'F3', 'A3', 'D4'], 1.4, 'a', att=0.4, rel=0.4, seed=81), 51.1, 0.55)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4', 'F4'], 3.0, 'a', att=0.2, rel=0.8, seed=82, bright=1.3), 52.0, 0.75)
    place(M, brass_swell(['Bb1', 'F2', 'Bb2', 'D3'], 2.8, att=0.4, seed=90), 52.0, 0.35)
    place(M, choir_chord(['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'], 3.2, 'a', att=0.6, rel=1.0, seed=83, bright=1.5), 54.5, 0.8)
    place(M, brass_swell(['D2', 'A2', 'D3', 'F#3'], 3.2, att=0.8, seed=91), 54.5, 0.35)
    place(M, choir_chord(['Bb2', 'D3', 'F3', 'Bb3', 'D4'], 2.6, 'o', att=0.6, rel=1.0, seed=84), 57.4, 0.6)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4'], 4.8, 'o', att=0.8, rel=3.0, seed=85), 59.8, 0.55)
    place(M, choir_chord(['D3', 'A3', 'D4'], 2.6, 'u', att=0.3, rel=2.2, seed=86), 62.0, 0.35)
    # overall dynamics: duck in the silence before the revelation
    t = tt(N); g = np.ones(N, np.float32)
    g *= 1 - 0.85 * np.clip((t - 40.6) / 0.3, 0, 1) * np.clip((43.2 - t) / 0.3, 0, 1)
    M *= g[:, None]
    return reverb(M, 3.8, 0.35, damp=4200, seed=1)

# ---------------------------------------------------------------- SFX
def bell(f0, dur=6.0, bright=1.0, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); s = np.zeros(n)
    for ratio, amp, dec in [(0.5, 0.6, 0.35), (1.0, 1.0, 0.6), (1.183, 0.6, 0.9), (1.5, 0.45, 1.1), (2.0, 0.55, 1.4), (2.51, 0.3, 2.0), (2.66, 0.25, 2.2), (3.0, 0.2, 2.6), (4.07, 0.15 * bright, 3.5), (5.43, 0.1 * bright, 4.5)]:
        f = f0 * ratio * (1 + r.randn() * 0.002)
        s += amp * np.sin(2 * np.pi * f * t + r.rand() * 6) * np.exp(-t * dec) * (1 + 0.1 * np.sin(2 * np.pi * (0.7 + r.rand()) * t))
    s += fft_filter(r.randn(n) * np.exp(-t * 60), 800, 6000) * 0.3 * bright
    return (s / 3).astype(np.float32)

def metal_hit(f0=700, dur=1.5, seed=0, noise=0.6):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); s = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 3.5), (2.76, 0.7, 5), (5.4, 0.5, 8), (8.93, 0.35, 12), (13.3, 0.2, 16)]:
        s += amp * np.sin(2 * np.pi * f0 * ratio * (1 + r.randn() * 0.003) * t) * np.exp(-t * dec)
    s += fft_filter(r.randn(n) * np.exp(-t * 45), 1500, 9000) * noise
    return (s / 2.5).astype(np.float32)

def noise_burst(dur, lo, hi, a=0.005, decay=8.0, seed=0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    e = np.minimum(t / a, 1) * np.exp(-t * decay)
    return fft_filter(r.randn(n) * e, lo, hi).astype(np.float32)

def whoosh(dur, f0=300, f1=2500, seed=0, q=1.5):
    """Noise through a swept resonant band-pass (time-varying biquad)."""
    n = int(dur * SR); r = np.random.RandomState(seed); x = r.randn(n); y = np.zeros(n)
    fc = (f0 * (f1 / f0) ** (np.linspace(0, 1, n) ** 0.8)).tolist(); x = x.tolist()
    x1 = x2 = y1 = y2 = 0.0
    for i in range(n):
        w = 2 * math.pi * fc[i] / SR; al = math.sin(w) / (2 * q); c = math.cos(w); a0 = 1 + al
        b0, b2, a1, a2 = al / a0, -al / a0, -2 * c / a0, (1 - al) / a0
        yi = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, x[i], y1, yi; y[i] = yi
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return (y * e).astype(np.float32)

def roar(dur, f0=62, seed=0, growl=1.0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    jit = np.interp(t, np.linspace(0, dur, int(dur * 30)), r.randn(int(dur * 30))) * 0.08
    f = f0 * (1 + 0.25 * np.sin(np.pi * t / dur)) * (1 + jit)
    ph = np.cumsum(f / SR); saw = 2 * (ph % 1) - 1
    s = saw * 0.6 + np.tanh(3 * saw) * 0.4
    nz = r.randn(n)
    s = fft_filter(s, 30, 900) + fft_filter(nz, 200, 1600) * 0.35 * growl
    am = 0.7 + 0.3 * np.abs(np.sin(2 * np.pi * 9 * t + np.cumsum(r.randn(n)) * 0.002))
    e = np.minimum(t / 0.25, 1) * np.clip((dur - t) / 0.6, 0, 1)
    return (np.tanh(s * am * e * 1.6) * 0.8).astype(np.float32)

def rumble(dur, seed=0, lo=20, hi=160):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    e = np.minimum(t / 0.02, 1) * np.exp(-t * 1.6)
    return fft_filter(r.randn(n), lo, hi) * e * 3

def wind_bed():
    r = np.random.RandomState(7); t = tt(N)
    g = np.interp(t, np.linspace(0, DURATION, 40), 0.55 + 0.45 * r.rand(40))
    L = fft_filter(r.randn(N), 120, 900, 0.8) * g; R = fft_filter(r.randn(N), 120, 900, 0.8) * g[::-1]
    whistle = fft_filter(r.randn(N), 700, 1100, 2.0) * np.interp(t, np.linspace(0, DURATION, 25), r.rand(25)) ** 2 * 0.6
    W = np.stack([L + whistle * 0.7, R + whistle], 1).astype(np.float32)
    # per-section level (louder outdoors/high places, softer in close-ups)
    lv = np.interp(t, [0, 3, 3.2, 9.5, 12.4, 16.9, 21, 24.2, 34.3, 38.6, 40.8, 43.3, 48.4, 51.1, 54.6, 57.2, 64],
                   [0.25, 0.25, 0.7, 0.8, 0.9, 0.6, 0.5, 0.8, 0.7, 0.95, 0.75, 0.6, 0.6, 0.6, 0.8, 0.5, 0.5])
    return W * lv[:, None] * 0.5

def crackle_track(t0, t1, rate, gain, seed, rumble_gain=0.0):
    r = np.random.RandomState(seed); n = int((t1 - t0) * SR); out = np.zeros(n, np.float32)
    k = int(rate * (t1 - t0))
    for _ in range(k):
        i = r.randint(0, n - 2000); ln = r.randint(60, 600)
        out[i:i + ln] += r.randn(ln) * np.exp(-np.arange(ln) / (ln / 4)) * (r.rand() ** 2)
    out = fft_filter(out, 1200, 9000) * gain
    if rumble_gain: out += fft_filter(r.randn(n), 40, 400) * rumble_gain
    e = np.minimum(tt(n) / 0.3, 1) * np.clip((t1 - t0 - tt(n)) / 0.4, 0, 1)
    return out * e

def footstep(seed, heavy=1.0):
    n = int(0.35 * SR); t = tt(n); r = np.random.RandomState(seed)
    thud = np.sin(2 * np.pi * 70 * t * (1 + np.exp(-t * 40))) * np.exp(-t * 28) * heavy
    grit = fft_filter(r.randn(n) * np.exp(-t * 30), 300, 3500) * 0.5
    jingle = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(2900 + r.rand() * 400, 40, 0.12), (4100 + r.rand() * 500, 55, 0.08), (1900 + r.rand() * 300, 30, 0.1)])
    return (thud + grit + jingle).astype(np.float32)

def chain_rattle(dur, seed=0, density=40):
    r = np.random.RandomState(seed); n = int(dur * SR); out = np.zeros(n, np.float32)
    for _ in range(int(density * dur)):
        i = r.randint(0, n - SR // 4); h = metal_hit(1800 + r.rand() * 2200, 0.2, r.randint(1000000), noise=0.3)
        out[i:i + len(h)] += h * r.rand() * 0.5
    return out * np.clip(np.minimum(tt(n) / 0.2, (dur - tt(n)) / 0.5), 0, 1)

def sfx():
    S = buf(); B = buf()  # B = bell bus (long reverb)
    c = CUES
    # hook
    place(S, rumble(3.0, 1), c['hook_boom'], 0.8)
    place(B, bell(hz('D2'), 7, 0.6, 1), 0.08, 0.55, -0.2)
    for p in c['pulse']: place(S, taiko(40, 0.9, int(p * 7)), p, 0.35)
    place(S, crackle_track(0, 3.0, 25, 0.25, 3), 0.0, 1.0, -0.3)            # lantern
    # dying sun flare
    place(S, whoosh(1.4, 120, 900, 5, q=2), c['sun_flare'] - 0.7, 0.35)
    place(S, rumble(2.5, 2, 20, 90), c['sun_flare'], 0.5)
    # distant bells over the kingdom
    place(B, bell(hz('A1'), 6, 0.4, 2), 5.3, 0.3, 0.6)
    place(B, bell(hz('F2'), 6, 0.4, 3), 7.4, 0.18, -0.6)
    # crumble of the ash statue
    place(S, noise_burst(1.8, 150, 2500, 0.02, 2.2, 4), c['crumble'], 0.55)
    place(S, crackle_track(c['crumble'], c['crumble'] + 1.5, 90, 0.35, 5), c['crumble'], 1.0)
    place(S, crackle_track(9.5, 12.4, 15, 0.12, 6), 9.5, 1.0, -0.7)        # hearth
    # footsteps with armour on the bridge and the cathedral steps
    for (t0, t1, cyc, ph) in c['steps']:
        k = 0; t = t0 + 0.12
        while t < t1:
            place(S, footstep(int(t * 100), 0.9 + 0.2 * (k % 2)), t, 0.5, -0.15 if k % 2 else 0.15); k += 1; t += 1 / (2 * cyc)
    for t in np.arange(12.5, 16.9, 0.59): place(S, chain_rattle(0.3, int(t * 10), 25), t, 0.15, -0.4)  # lantern chain jingle
    # ashwights: groans
    for t0, f0, pn in [(17.4, 95, -0.5), (18.6, 110, 0.4), (19.9, 88, 0.1), (21.3, 120, 0.0)]: place(S, roar(1.4, f0, int(t0), growl=1.6) * 0.5, t0, 0.35, pn)
    # parry, slow-motion slash, ash burst
    place(S, metal_hit(820, 2.2, 7), c['parry'], 0.9); place(S, noise_burst(0.3, 2000, 10000, 0.001, 20, 8), c['parry'], 0.5)
    place(S, whoosh(c['slash'][1] - c['slash'][0], 180, 1600, 9, q=1.2), c['slash'][0], 0.8)
    place(S, noise_burst(2.2, 200, 4000, 0.003, 2.0, 10), c['ash_burst'], 0.7)
    place(S, crackle_track(c['ash_burst'], c['ash_burst'] + 1.2, 120, 0.4, 11), c['ash_burst'], 1.0)
    # the Knellwyrm rises: rumble, funeral bells tolling with every heave
    place(S, rumble(4.0, 12, 18, 120), c['wyrm_rise'], 1.0)
    place(S, roar(3.4, 46, 13, growl=0.6), c['wyrm_rise'] + 0.2, 0.55, 0.4)
    for i, (dt, note) in enumerate([(0.0, 'C#3'), (0.55, 'G2'), (1.15, 'A#2'), (1.6, 'E3'), (2.2, 'G2'), (2.75, 'C#3'), (3.3, 'D2'), (3.9, 'G#2'), (4.4, 'A#2'), (5.0, 'E2'), (5.5, 'C#3'), (6.0, 'G2')]):
        place(B, bell(hz(note), 4, 1.0, 20 + i), c['wyrm_rise'] + dt, 0.32, 0.5 - (i % 3) * 0.4)
    # the roar
    place(S, roar(2.2, 58, 14, growl=1.3), c['roar'], 1.0); place(S, roar(2.2, 87, 15, growl=1.0), c['roar'] + 0.05, 0.55)
    place(S, rumble(2.0, 16, 20, 100), c['roar'], 0.7)
    # the killing blow
    place(S, whoosh(c['strike_whoosh'][1] - c['strike_whoosh'][0], 250, 3000, 17, q=1.4), c['strike_whoosh'][0], 0.8)
    place(S, metal_hit(520, 3.0, 18, noise=1.0), c['strike'], 1.1); place(S, rumble(1.5, 19, 30, 200), c['strike'], 0.8)
    place(S, rumble(3.0, 20, 18, 140), c['crash'], 1.6); place(S, noise_burst(2.5, 80, 3000, 0.005, 1.6, 21), c['crash'], 0.9)
    for i in range(7): place(B, bell(hz(['D3', 'G#2', 'C#3', 'F2', 'A#2', 'E3', 'G2'][i]), 3.5, 1.0, 40 + i), c['crash'] + 0.05 + i * 0.09, 0.3, (i % 3 - 1) * 0.5)
    # cathedral: distant great bell; braziers
    place(B, bell(hz('D2'), 8, 0.5, 50), c['cathedral_bell'], 0.6)
    place(S, crackle_track(34.3, 38.6, 40, 0.3, 51, 0.05), 34.3, 1.0)
    # summit: chains groan
    place(S, chain_rattle(2.0, 52, 15), c['chains'], 0.35, 0.3)
    place(S, noise_burst(2.2, 60, 400, 0.4, 1.0, 53), c['chains'], 0.4)       # stone/chain grind
    # flashback hits
    for t0 in (c['flash1'], c['flash2']):
        place(S, whoosh(0.7, 3000, 300, int(t0), q=1.0)[::-1].copy(), t0 - 0.7, 0.5)
        place(S, rumble(2.0, int(t0) + 1, 25, 180), t0, 1.0)
        place(B, bell(hz('C#2'), 5, 0.8, int(t0) + 2), t0, 0.6)
    # ignition and the burning chains
    place(S, whoosh(1.2, 150, 1500, 60, q=0.8), c['ignite'] - 0.6, 0.8)
    place(S, rumble(3.5, 61, 20, 160), c['ignite'], 1.4)
    place(S, crackle_track(c['ignite'], 63.5, 160, 0.55, 62, 0.25), c['ignite'], 1.0)
    place(S, chain_rattle(2.5, 63, 30), c['ignite'], 0.3, -0.3)
    # title bell
    place(B, bell(hz('D2'), 9, 0.7, 70), c['title_bell'], 0.85)
    S += wind_bed()
    S = reverb(S, 1.8, 0.18, 5000, 2) + reverb(B, 5.0, 0.5, 3500, 3)
    return S

# ---------------------------------------------------------------- VOICE
def vo(vo_dir, tmp):
    V = buf()
    for lid, t0 in NARRATION.items():
        src = os.path.join(vo_dir, f"{lid}.wav"); dst = os.path.join(tmp, f"{lid}_p.wav")
        # deepen (pitch -2 semitones, tempo kept), warm EQ, gentle compression
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af",
                        "aresample=48000,rubberband=pitch=0.8909:formant=preserved,equalizer=f=120:t=q:w=1:g=3,equalizer=f=3500:t=q:w=1.5:g=2,highpass=f=60,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2",
                        "-ac", "1", dst], check=True)
        x, sr = sf.read(dst, dtype='float32'); assert sr == SR
        place(V, x, t0, 1.0, 0.0)
    return reverb(V, 1.2, 0.12, 6000, 4)

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, "tmp"); os.makedirs(tmp, exist_ok=True)
    V = vo(vo_dir, tmp); print("vo done")
    Mu = music(); print("music done")
    Sx = sfx(); print("sfx done")
    # sidechain ducking of music + sfx under narration
    env = np.abs(V).max(1); win = int(0.25 * SR)
    env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    duck = 1 - 0.45 * np.clip(env * 4, 0, 1)
    Mu_d = Mu * duck[:, None]; Sx_d = Sx * (1 - 0.25 * np.clip(env * 4, 0, 1))[:, None]
    def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak
    Mu_d = norm(Mu_d, 0.55); Sx_d = norm(Sx_d, 0.75); Vn = norm(V, 0.9)
    mix = Vn * 1.0 + Mu_d * 0.62 + Sx_d * 0.7
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [("vo", Vn), ("music", Mu_d), ("sfx", Sx_d), ("mix", mix)]:
        sf.write(os.path.join(out, f"{name}.wav"), x.astype(np.float32), SR, subtype='FLOAT')
    print("written", out)

if __name__ == "__main__":
    main()
