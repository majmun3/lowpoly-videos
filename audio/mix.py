"""Narration (Kokoro neural TTS) + procedurally synthesized, frame-synced SFX + mix. No music.
Usage: python mix.py <events.json> <kokoro.onnx> <voices.bin> <out_dir>
Writes: voiceover.wav, sfx.wav (effects + ambience), mix.wav, narration/line_*.wav, sfx_library/*.wav"""
import sys, os, json, math
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
ev_path, onnx, voices, OUT = sys.argv[1:5]
E = json.load(open(ev_path))
FPS, NF = E['fps'], E['frames']
DUR = NF / FPS
N = int(DUR * SR)
rng = np.random.default_rng(7)
os.makedirs(f'{OUT}/narration', exist_ok=True)
os.makedirs(f'{OUT}/sfx_library', exist_ok=True)
SC = {s['name'][:2]: s for s in E['scenes']}


def T(scene, local_frame):
    """Scene-local frame (1-based) -> seconds in the final video."""
    return (SC[scene]['start'] + local_frame - 1) / FPS


# ------------------------------------------------------------------ dsp helpers
def filt(x, kind, f, order=2):
    sos = signal.butter(order, f, btype=kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def env(sec, attack=0.005, decay=0.2):
    t = np.arange(int(sec * SR)) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def tone(freqs, sec, decays, amps=None, jitter=0.0):
    t = np.arange(int(sec * SR)) / SR
    out = np.zeros_like(t)
    amps = amps or [1.0] * len(freqs)
    for f, d, a in zip(freqs, decays, amps):
        out += a * np.sin(2 * np.pi * f * (1 + jitter * rng.uniform(-1, 1)) * t + rng.uniform(0, 6.28)) * np.exp(-t / d)
    return out


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def ir(sec, decay, bright=4000):
    n = noise(sec) * np.exp(-np.arange(int(sec * SR)) / SR / decay)
    return norm(filt(n, 'low', bright))


def reverb(x, sec=2.0, decay=0.5, wet=0.3, bright=4000):
    r = signal.fftconvolve(x, ir(sec, decay, bright))[:len(x)]
    return x * (1 - wet) + norm(r, np.abs(x).max() + 1e-9) * wet


class Bus:
    def __init__(self):
        self.b = np.zeros((N, 2))

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N or gain <= 0:
            return
        if i < 0:
            sig, i = sig[-i:], 0
        sig = sig[:N - i]
        a = (max(-1, min(1, pan)) + 1) * math.pi / 4
        self.b[i:i + len(sig), 0] += sig * gain * math.cos(a)
        self.b[i:i + len(sig), 1] += sig * gain * math.sin(a)

    def bed(self, t0, t1, sig, gain=1.0, fade=0.3, pan=0.0):
        """Continuous layer between t0..t1 with fades (sig is looped/cropped)."""
        n = int((t1 - t0) * SR)
        if n <= 0:
            return
        s = np.resize(sig, n).astype(float)
        fl = int(fade * SR)
        ramp = np.linspace(0, 1, max(1, min(fl, n // 2)))
        s[:len(ramp)] *= ramp; s[n - len(ramp):] *= ramp[::-1]
        self.add(t0, s, gain, pan)


# ------------------------------------------------------------------ SFX designs
def sfx_step(surface='mud', armored=False, size=1.0):
    thump = filt(noise(0.12), 'low', 300 / size) * env(0.12, 0.002, 0.03) * 1.2
    thump += np.sin(2 * np.pi * 70 / size * np.arange(len(thump)) / SR) * env(0.12, 0.002, 0.04) * 0.8
    out = thump
    if surface == 'mud':
        sq = filt(noise(0.18), 'band', [250, 1100]) * env(0.18, 0.02, 0.06) * 0.5
        out = np.pad(out, (0, len(sq) - len(out))) + sq
    elif surface == 'stone':
        cl = filt(noise(0.05), 'high', 2500) * env(0.05, 0.001, 0.008) * 0.6
        out[:len(cl)] += cl
    if armored:
        jl = tone(list(rng.uniform(2200, 6500, 5)), 0.25, [0.04, 0.05, 0.03, 0.06, 0.04], [0.15] * 5)
        d = int(rng.uniform(0.01, 0.04) * SR)
        out = np.pad(out, (0, max(0, len(jl) + d - len(out))))
        out[d:d + len(jl)] += jl
    return out


def sfx_whoosh(speed=10):
    L = 0.32
    n = noise(L)
    t = np.linspace(0, 1, len(n))
    out = np.zeros_like(n)
    for k, fc in enumerate(np.linspace(500, 1800, 8)):
        seg = slice(int(k * len(n) / 8), int((k + 1) * len(n) / 8))
        out[seg] = filt(n, 'band', [fc * 0.6, fc * 1.4])[seg]
    return out * np.sin(np.pi * t) ** 2 * min(1.0, speed / 14)


def sfx_clang(base=None):
    f0 = base or rng.uniform(420, 620)
    ring = tone([f0, f0 * 2.76, f0 * 5.4, f0 * 8.93, f0 * 1.51], 1.6, [0.6, 0.35, 0.18, 0.08, 0.3], [1, 0.6, 0.4, 0.25, 0.5], jitter=0.01)
    hit = filt(noise(0.04), 'high', 1500) * env(0.04, 0.0005, 0.008) * 3
    ring[:len(hit)] += hit
    return np.tanh(ring * 0.8)


def sfx_wood():
    f = rng.uniform(380, 520)
    out = tone([f, f * 2.3, f * 3.9], 0.25, [0.04, 0.025, 0.015], [1, 0.6, 0.3])
    out[:int(0.01 * SR)] += filt(noise(0.01), 'high', 1500) * 2
    return out


def sfx_thunder(close=1.0, muffled=False):
    L = 5.0
    rumble = filt(noise(L), 'low', 160) * (1 - np.exp(-np.arange(int(L * SR)) / SR / 0.15)) * np.exp(-np.arange(int(L * SR)) / SR / 1.6)
    lfo = 0.6 + 0.4 * np.abs(np.sin(np.cumsum(rng.uniform(2, 9, int(L * SR))) / SR))
    out = norm(rumble * lfo) * 0.9
    crack = filt(noise(0.4), 'high', 600) * env(0.4, 0.002, 0.08) * close
    out[:len(crack)] += crack * 0.8
    if muffled:
        out = filt(out, 'low', 450)
    return out


def sfx_roar(f0=70, sec=2.6, screech=False):
    t = np.arange(int(sec * SR)) / SR
    pitch = f0 * (1 + 0.25 * np.sin(np.pi * t / sec)) * (1 + 0.03 * np.sin(2 * np.pi * 7 * t)) * (1 + 0.02 * rng.standard_normal(len(t)).cumsum() / np.sqrt(len(t)))
    ph = 2 * np.pi * np.cumsum(pitch) / SR
    saw = sum(np.sin(ph * k) / k for k in range(1, 30))
    src = saw + noise(sec) * 0.8
    vox = sum(filt(src, 'band', [fc * 0.75, fc * 1.3]) * g for fc, g in ((380, 1.0), (900, 0.7), (2100, 0.35)))
    if screech:
        vox += filt(src, 'band', [2500, 5000]) * 0.5
    e = np.minimum(1, t / 0.25) * np.minimum(1, (sec - t) / 0.6)
    return np.tanh(norm(vox) * 2.2 * e) * 0.9


def sfx_flap():
    return filt(noise(0.35), 'low', 260) * np.sin(np.linspace(0, np.pi, int(0.35 * SR))) ** 3 * 1.4


def sfx_moan(sec=2.2, f0=95):
    t = np.arange(int(sec * SR)) / SR
    ph = 2 * np.pi * np.cumsum(f0 * (1 - 0.15 * t / sec) * (1 + 0.02 * np.sin(2 * np.pi * 5 * t))) / SR
    src = sum(np.sin(ph * k) / k for k in range(1, 20)) + noise(sec) * 0.3
    vox = filt(src, 'band', [280, 700]) + 0.5 * filt(src, 'band', [900, 1300])
    return norm(vox) * np.sin(np.pi * t / sec) ** 1.5


def sfx_chain():
    out = np.zeros(int(0.6 * SR))
    for k in range(int(rng.integers(6, 12))):
        d = int(rng.uniform(0, 0.45) * SR)
        c = tone(list(rng.uniform(1800, 5200, 3)), 0.12, [0.02, 0.015, 0.03], [0.5, 0.4, 0.3])
        out[d:d + len(c)] += c
    return out


def sfx_creak(sec=4.0):
    t = np.arange(int(sec * SR)) / SR
    f = 70 + 35 * np.sin(2 * np.pi * 0.35 * t) + 10 * np.sin(2 * np.pi * 1.7 * t)
    stick = (np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR) > 0.6) * 1.0
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = sum(np.sin(ph * k) / k for k in range(1, 25)) * (0.4 + 0.6 * filt(stick, 'low', 40))
    out = filt(src, 'band', [150, 1600]) + filt(noise(sec), 'low', 120) * 0.6
    return norm(out) * np.minimum(1, t / 0.3) * np.minimum(1, (sec - t) / 0.4)


def sfx_boom(sec=3.0):
    t = np.arange(int(sec * SR)) / SR
    return norm(np.sin(2 * np.pi * (45 - 12 * t / sec) * t) * np.exp(-t / 0.9) + filt(noise(sec), 'low', 90) * np.exp(-t / 0.5) * 0.7)


def sfx_breath(sec=1.3, inhale=True):
    t = np.arange(int(sec * SR)) / SR
    b = filt(noise(sec), 'band', [180, 900] if inhale else [120, 600])
    return b * np.sin(np.pi * t / sec) ** 2


def sfx_scrape(sec=0.7):
    t = np.arange(int(sec * SR)) / SR
    out = np.zeros_like(t)
    for fc in (2400, 3700, 5100):
        out += filt(noise(sec), 'band', [fc * 0.97, fc * 1.03]) * (1 + t / sec)
    return norm(out) * np.minimum(1, t / 0.05) * np.minimum(1, (sec - t) / 0.08)


def sfx_crackle(sec):
    out = filt(noise(sec), 'low', 500) * 0.25
    for k in range(int(sec * 14)):
        d = int(rng.uniform(0, sec - 0.03) * SR)
        out[d:d + int(0.02 * SR)] += filt(noise(0.02), 'high', 1500) * env(0.02, 0.0005, 0.004) * rng.uniform(0.3, 1.5)
    return out


def sfx_rain(sec, inside=False):
    r = filt(noise(sec), 'band', [900, 9000]) * 0.5
    for k in range(int(sec * 60)):
        d = int(rng.uniform(0, sec - 0.01) * SR)
        r[d:d + int(0.006 * SR)] += filt(noise(0.006), 'high', 3000) * rng.uniform(0.2, 1)
    return filt(r, 'low', 1400) * 1.6 if inside else r


def sfx_wind(sec, howl=0.0):
    t = np.arange(int(sec * SR)) / SR
    lfo = 0.55 + 0.45 * np.sin(2 * np.pi * 0.13 * t + 1) * np.sin(2 * np.pi * 0.07 * t)
    w = filt(noise(sec), 'band', [180, 900]) * lfo
    if howl:
        w += filt(noise(sec), 'band', [700, 760]) * howl * lfo ** 2 * 3
    return w


def sfx_whisper(sec):
    t = np.arange(int(sec * SR)) / SR
    wail = np.sin(2 * np.pi * np.cumsum(650 + 120 * np.sin(2 * np.pi * 0.4 * t) + 15 * np.sin(2 * np.pi * 6 * t)) / SR) * 0.4
    hiss = filt(noise(sec), 'band', [2500, 7000]) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * t) ** 2)
    return (wail + hiss * 0.6) * np.sin(np.pi * t / sec)


def sfx_chitter():
    out = np.zeros(int(0.5 * SR))
    for k in range(5):
        d = int(k * 0.08 * SR); L = 0.06
        tt = np.arange(int(L * SR)) / SR
        out[d:d + len(tt)] += np.sin(2 * np.pi * (1300 + 900 * np.sin(2 * np.pi * 40 * tt)) * tt) * np.sin(np.pi * tt / L)
    return out


def sfx_clatter():
    out = np.zeros(int(0.9 * SR))
    for k in range(9):
        d = int(rng.uniform(0, 0.5) * SR)
        c = sfx_clang(rng.uniform(700, 1400))[:int(0.25 * SR)] * env(0.25, 0.001, 0.05) * rng.uniform(0.2, 0.6)
        out[d:d + len(c)] += c
    th = sfx_step('mud', size=1.6)
    out[:len(th)] += th * 1.5
    return out


# ------------------------------------------------------------------ narration
NARR = [  # (start s, end s, text)
    (0.4, 5.6, "In an age of storms and silence... a child was born beneath a cursed sky."),
    (6.2, 11.2, "He grew up in the castle's shadow, where soldiers marched... and the dead did not rest."),
    (11.3, 13.35, "But the boy dreamed only of the sword."),
    (13.4, 19.6, "An old knight taught him the only lesson that mattered. Fall... and rise again."),
    (20.3, 27.6, "Years later, he knelt before the King... and rose a knight."),
    (28.3, 37.4, "His first battle came with the storm. Steel against bone... and beneath the mud, something ancient awoke."),
    (38.2, 45.7, "Beyond the kingdom, the world grew stranger. Wraiths in the mist. Demons among the trees. Dragons on the ruins of kings."),
    (46.3, 54.6, "Now, scarred and weary, he climbs to the last fortress... where the darkness itself is waiting."),
    (55.3, 57.9, "He was born... for this."),
]
VOICE = 'bm_lewis'


def narration():
    from kokoro_onnx import Kokoro
    k = Kokoro(onnx, voices)
    vo = np.zeros(N)
    spans = []
    for i, (t0, t1, text) in enumerate(NARR):
        speed = 0.88
        for _ in range(6):
            a, sr = k.create(text, voice=VOICE, speed=speed, lang='en-gb')
            if len(a) / sr <= (t1 - t0) or speed >= 1.15:
                break
            speed = min(1.15, speed * (len(a) / sr) / (t1 - t0) * 1.02)
        a = signal.resample_poly(a, SR, sr)
        a = np.trim_zeros(np.where(np.abs(a) < 1e-4, 0, a), 'fb') if np.abs(a).max() > 0 else a
        a = filt(a, 'high', 70)
        a = a + 0.25 * filt(a, 'low', 220)                      # warmth
        a = a / (np.sqrt(np.mean(a ** 2)) + 1e-9) * 0.1        # equal loudness per line
        sf.write(f'{OUT}/narration/line_{i + 1:02d}.wav', a, SR, subtype='PCM_24')
        d = len(a) / SR
        print(f'line {i + 1}: {d:.2f}s window {t1 - t0:.2f}s speed {speed:.2f}', flush=True)
        i0 = int(t0 * SR); vo[i0:i0 + len(a)] += a[:N - i0]
        spans.append((t0, t0 + d))
    vo = reverb(vo, 1.2, 0.25, 0.1, 3500)                      # small dark-room tail
    return vo, spans


# ------------------------------------------------------------------ build the effects bus
def build_sfx(spans):
    fx, amb = Bus(), Bus()
    surface = {'S1': 'wood', 'S2': 'mud', 'S3': 'mud', 'S4': 'stone', 'S5': 'mud', 'S6': 'mud', 'S7': 'stone', 'S8': 'stone'}
    armored = ('hero', 'sold', 'und', 'soldier', 'foe', 'trainer')
    lib = {}

    def g(d, ref=4.0, vis=True):
        return (1.0 / (1 + d / ref)) * (1.0 if vis else 0.55)

    last_swing = {}
    events = []
    for e in sorted(E['events'], key=lambda e: e['f']):   # one whoosh per swing: a blade's speed peaks cluster within ~10 frames
        if e['t'] == 'whoosh':
            if e['f'] - last_swing.get(e['who'], -99) < 12:
                continue
            last_swing[e['who']] = e['f']
        events.append(e)
    for e in events:
        t = (e['f'] - 1) / FPS
        if e['t'] == 'step':
            s = sfx_step(surface[e['scene']], e['who'].startswith(armored), e['size'] if e['size'] > 1.5 else 1.0)
            fx.add(t, s, 0.5 * g(e['d']), e['pan'] * 0.7); lib.setdefault('footstep_armored_mud', s)
        elif e['t'] == 'whoosh':
            if e['d'] > 25:
                continue
            s = sfx_whoosh(e['speed'])
            fx.add(t - 0.12, s, 0.55 * g(e['d']), e['pan'] * 0.7); lib.setdefault('sword_whoosh', s)
            if e['scene'] == 'S5' and not e['who'].startswith(('hero', 'foe')) and rng.random() < 0.6:   # distant duels clash
                c = sfx_clang()
                fx.add(t + 0.05, c, 0.35 * g(e['d']), e['pan'] * 0.7)
        elif e['t'] == 'clang':
            s = sfx_clang()
            lib.setdefault('sword_clash', s)
            if any(a - 0.3 <= t <= b for a, b in spans):          # keep the hit, shorten the ring under narration
                s = s * env(len(s) / SR, 0.0005, 0.18) * 0.55
            fx.add(t, s, 0.9 * g(e['d'], 6), e['pan'] * 0.6)
        elif e['t'] == 'wood':
            s = sfx_wood()
            fx.add(t, s, 0.9 * g(e['d'], 6), e['pan'] * 0.6); lib.setdefault('wooden_sword_hit', s)
        elif e['t'] == 'thunder':
            muffled = e['scene'] == 'S1' and e['f'] < 65
            s = sfx_thunder(close=e['amt'], muffled=muffled)
            under_voice = any(a - 0.3 <= t <= b for a, b in spans)
            fx.add(t + 0.15, s, 0.6 * e['amt'] * (0.45 if under_voice else 1.0), rng.uniform(-0.4, 0.4)); lib.setdefault('thunder', s)

    # ---- scene-specific, synced to animation keys in scenes_a.py / scenes_b.py
    # S1 birth: rain on the roof, candle, thunder (events), exterior rain + wind, dragon cry crossing the moon
    amb.bed(0, T('S1', 65), sfx_rain(8, inside=True), 0.25, 0.4)
    amb.bed(0, T('S1', 65), sfx_crackle(8) * 0.3, 0.15)
    amb.bed(T('S1', 65), T('S2', 1), sfx_rain(8), 0.32, 0.05)
    amb.bed(T('S1', 65), T('S2', 1), sfx_wind(8, 0.3), 0.3)
    for k in range(5):
        fx.add(T('S1', 92 + k * 22), filt(sfx_flap(), 'low', 200), 0.18)
    fx.add(T('S1', 108), filt(sfx_roar(260, 2.2, screech=True), 'low', 3000), 0.22, 0.2)
    # S2 village: wind, brazier fire, undead moans, goblin chitter, armour of marching column (steps carry it)
    amb.bed(T('S2', 1), T('S3', 1), sfx_wind(8, 0.15), 0.3)
    amb.bed(T('S2', 1), T('S2', 65), sfx_crackle(4), 0.2, pan=0.4)
    for lf, p in ((66, -0.5), (84, 0.3), (100, -0.2)):
        fx.add(T('S2', lf), sfx_moan(2.0, rng.uniform(80, 110)), 0.22, p)
    fx.add(T('S2', 82), sfx_chitter(), 0.35, -0.3); lib['goblin_chitter'] = sfx_chitter()
    # S3 training: torches, beast chains (pull cycle peaks), beast breathing + roar, teen falls, gets up
    amb.bed(T('S3', 1), T('S4', 1), sfx_crackle(8), 0.18)
    amb.bed(T('S3', 1), T('S4', 1), sfx_wind(8), 0.12)
    for lf in range(1, 169):
        ph = (lf / FPS) * 1.7
        if math.sin(ph - 0.05) < 1 <= math.sin(ph) + 1e-3 or (math.cos(ph - 1.7 / FPS) > 0 >= math.cos(ph)):
            fx.add(T('S3', lf), sfx_chain(), 0.3, 0.2)
    lib['chains'] = sfx_chain()
    for lf in (20, 70, 110):
        fx.add(T('S3', lf), filt(sfx_breath(1.4), 'low', 500), 0.35, 0.1)
    roar_beast = sfx_roar(85, 1.9)
    fx.add(T('S3', 128), roar_beast, 0.55, 0.15); lib['beast_roar'] = roar_beast
    fx.add(T('S3', 58), sfx_clatter(), 0.6, -0.2)                     # teen hits the ground
    lib['armor_fall'] = sfx_clatter()
    fx.add(T('S3', 92), filt(sfx_breath(0.8), 'band', [200, 1500]), 0.25)
    # S4 cathedral: room tone, candles, king's sword taps, armour as the knight rises, salute ring
    amb.bed(T('S4', 1), T('S5', 1), reverb(filt(noise(8), 'low', 250) * 0.3, 3, 1.2, 0.6), 0.25)
    amb.bed(T('S4', 1), T('S5', 1), sfx_crackle(8) * 0.4, 0.12)
    for lf in (82, 96):
        tap = reverb(np.pad(sfx_clang(1100)[:int(0.8 * SR)] * env(0.8, 0.001, 0.25), (0, SR * 2)), 3, 1.4, 0.5)
        fx.add(T('S4', lf), tap, 0.35, 0.1)
    lib['sword_tap'] = tap
    for k, lf in enumerate((128, 135, 141, 147, 152)):
        fx.add(T('S4', lf), reverb(np.pad(sfx_step('stone', True), (0, SR)), 2.5, 1.0, 0.5), 0.35, -0.1 + 0.05 * k)
    fx.add(T('S4', 176), reverb(np.pad(sfx_clang(880) * env(1.6, 0.002, 0.6), (0, SR * 2)), 3, 1.4, 0.45), 0.25)
    # S5 battle: heavy rain, wind, fires, distant din, giant skeleton rumble + roar, foe collapse
    amb.bed(T('S5', 1), T('S6', 1), sfx_rain(8), 0.4)
    amb.bed(T('S5', 1), T('S6', 1), sfx_wind(8, 0.35), 0.3)
    amb.bed(T('S5', 1), T('S6', 1), sfx_crackle(6), 0.15, pan=-0.3)
    din = np.zeros(int(10 * SR))
    for k in range(40):
        c = filt(sfx_clang(), 'low', 2500) * env(1.6, 0.001, 0.2)
        d = int(rng.uniform(0, 9.5) * SR); din[d:d + len(c)] += c[:len(din) - d] * rng.uniform(0.05, 0.25)
    amb.bed(T('S5', 1), T('S6', 1), din + filt(noise(10), 'band', [150, 500]) * 0.2, 0.35)
    rumble = filt(noise(10), 'low', 70) * np.linspace(0.3, 1.0, 10 * SR)
    amb.bed(T('S5', 1), T('S6', 1), rumble, 0.5, fade=1.0)
    giant = filt(sfx_roar(48, 3.0), 'low', 2500)
    giant = reverb(np.pad(giant, (0, SR * 2)), 3, 1.0, 0.4)
    fx.add(T('S5', 196), giant, 0.75); lib['giant_skeleton_roar'] = giant
    fx.add(T('S5', 166), sfx_clatter(), 0.7, 0.1)                      # undead knight collapses
    for lf in (112, 132, 152):                                          # armour rattles in the duel
        fx.add(T('S5', lf), sfx_step('mud', True) * 0.6, 0.4)
    # S6 cursed forest: eerie wind, wraith wail, demon breathing (chest cycle 2.4 rad/s) + growl, dragon unfurl + roar
    amb.bed(T('S6', 1), T('S7', 1), sfx_wind(8, 0.6), 0.32)
    wr = reverb(sfx_whisper(2.7), 2.5, 0.8, 0.5)
    fx.add(T('S6', 1), wr, 0.4, 0.5); lib['wraith_wail'] = wr
    for k in range(3):                                                  # inhale at chest maxima of sin(t*2.4)
        t_in = (math.pi / 2 + 2 * math.pi * k) / 2.4
        lf0 = 65 + int(((t_in - 65 / FPS) % (2 * math.pi / 2.4)) * FPS)
        fx.add(T('S6', lf0 - 12), filt(sfx_breath(1.0), 'low', 600), 0.45)
        fx.add(T('S6', lf0 + 14), filt(sfx_breath(1.2, False), 'low', 400), 0.5)
    growl = filt(sfx_roar(55, 2.0), 'low', 1800)
    fx.add(T('S6', 100), growl, 0.55); lib['demon_growl'] = growl
    for lf in range(146, 170, 8):
        fx.add(T('S6', lf), sfx_flap(), 0.45)
    dragon = sfx_roar(68, 2.6)
    fx.add(T('S6', 166), reverb(np.pad(dragon, (0, SR * 2)), 3, 1.2, 0.35), 0.8); lib['dragon_roar'] = dragon
    # S7 final journey: howling wind, cape flapping, giant thuds behind the gate, sword draw
    amb.bed(T('S7', 1), T('S8', 1), sfx_wind(9, 0.9), 0.45)
    flaps = np.zeros(int(9 * SR))
    for k in range(60):
        d = int(rng.uniform(0, 8.7) * SR); s = filt(noise(0.08), 'band', [300, 2000]) * env(0.08, 0.004, 0.02)
        flaps[d:d + len(s)] += s * rng.uniform(0.2, 0.6)
    amb.bed(T('S7', 81), T('S7', 141), flaps, 0.4)
    for lf in (152, 168, 184, 200):
        fx.add(T('S7', lf), filt(sfx_boom(1.5), 'low', 120), 0.5)
    fx.add(T('S7', 170), filt(sfx_roar(45, 2.4), 'low', 600), 0.35)
    draw = sfx_scrape(0.55)
    fx.add(T('S7', 186), draw, 0.45, -0.1); lib['sword_draw'] = draw
    fx.add(T('S7', 194), sfx_clang(1500) * env(1.6, 0.001, 0.4), 0.2)
    # S8 revelation: gate creak + boom, dragon steps, breath, final roar, hard cut to black with a low boom
    cut = T('S8', 109)
    amb.bed(T('S8', 1), cut, sfx_wind(6, 0.8), 0.4, fade=0.05)
    creak = sfx_creak(2.4)
    fx.add(T('S8', 4), creak, 0.55); lib['gate_creak'] = creak
    fx.add(T('S8', 60), sfx_boom(2.0), 0.5)
    for lf in (28, 46, 64, 80):
        fx.add(T('S8', lf), filt(sfx_boom(1.2), 'low', 140), 0.4)
    fx.add(T('S8', 72), sfx_step('stone', True), 0.6, 0.05)            # knight raises his shield
    final = sfx_roar(58, 1.5)
    fx.add(T('S8', 82), reverb(np.pad(final, (0, SR)), 2.5, 1.0, 0.3), 0.95)
    # everything stops on the cut to black; only a deep impact rings out
    i = int(cut * SR)
    for b in (fx, amb):
        fade = np.linspace(1, 0, int(0.03 * SR))
        b.b[i:i + len(fade)] *= fade[:, None]; b.b[i + len(fade):] = 0
    fx.add(cut, sfx_boom(2.5), 0.7)
    for k, v in lib.items():
        sf.write(f'{OUT}/sfx_library/{k}.wav', norm(v, 0.8), SR, subtype='PCM_24')
    return fx.b, amb.b


vo, spans = narration()
fx, amb = build_sfx(spans)
sfx = fx + amb
# duck effects/ambience under the narrator (smoothed envelope, -7 dB)
mask = np.zeros(N)
for a, b in spans:
    mask[int((a - 0.15) * SR):int((b + 0.25) * SR)] = 1
mask = filt(mask, 'low', 3)
duck = 1 - 0.68 * np.clip(mask, 0, 1)   # ~-10 dB under the narrator
sfx *= duck[:, None]
vo2 = np.stack([vo, vo], 1)
sfx = sfx / (np.sqrt(np.mean(sfx ** 2)) + 1e-9) * 0.035            # RMS-normalise effects bus (~-29 dBFS)
sfx = np.tanh(sfx / 0.45) * 0.45                                     # tame thunder/boom peaks
mix = vo2 * 2.2 + sfx
mix = np.tanh(mix / 0.95) * 0.95 * 0.89                               # soft limiter, never clips
sf.write(f'{OUT}/voiceover.wav', vo2 * 2.2 / max(1, np.abs(vo2 * 2.2).max() / 0.9), SR, subtype='PCM_24')
sf.write(f'{OUT}/sfx.wav', sfx, SR, subtype='PCM_24')
sf.write(f'{OUT}/mix.wav', mix, SR, subtype='PCM_24')
print('peak mix', np.abs(mix).max(), 'duration', N / SR)
