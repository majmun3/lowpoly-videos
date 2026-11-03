"""Original procedural score + sound design for VHALDREN — EPISODE 3: THE ARMOR THAT WOULD LAST FOREVER.
Built on Episode 1's synthesis toolkit and Episode 2's extra instruments; every sound is generated from scratch.
Usage: python synth.py VO_DIR OUT_DIR
"""
import os, sys, math, importlib.util
import numpy as np, soundfile as sf
from importlib.machinery import SourceFileLoader
HERE = os.path.dirname(os.path.abspath(__file__))
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
syn = load('ep1synth', os.path.join(HERE, '..', '..', 'the-last-ember', 'audio', 'synth.py'))
ep2 = load('ep2synth', os.path.join(HERE, '..', '..', 'the-silent-kingdom', 'audio', 'synth.py'))
TL = SourceFileLoader('timeline_ep3', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, footstep, chain_rattle, crackle_track = (
    syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.footstep, syn.chain_rattle, syn.crackle_track)
grind, scrape, tick = ep2.grind, ep2.scrape, ep2.tick
rs = np.random.RandomState(3)
C = TL.CUES

# ---------------------------------------------------------------- instruments
def horn_note(f, dur, att=0.18, seed=0):
    """A distant brass horn: sawtooth through a moving low-pass, slight vibrato."""
    n = int(dur * SR); s = osc(syn.saw_table(30, 0.9), f, n, vib=0.004, vib_rate=4.8, drift=0.0003, seed=seed)
    e = adsr(n, att, 0.25, 0.8, min(0.6, dur * 0.4))
    dark, bright = fft_filter(s, 60, 700), fft_filter(s, 60, 2000)
    return ((dark * (1 - e) + bright * e) * e).astype(np.float32)

THEME = [('D3', 1.0), ('F3', 0.5), ('G3', 0.5), ('A3', 1.5), ('G3', 0.5), ('F3', 0.5), ('E3', 0.5), ('D3', 2.0)]   # D dorian
def theme(t0, beat, transpose=0, gain=1.0, seed=0, notes=THEME):
    out = buf(); t = t0
    for i, (nm, b) in enumerate(notes):
        place(out, horn_note(hz(nm) * 2 ** (transpose / 12), b * beat + 0.35, seed=seed + i), t, gain, 0.1); t += b * beat
    return out

def gurdy(f0, dur, seed=0):
    """Hurdy-gurdy-like drone: a nasal sawtooth fifth with a slow buzzing pulse."""
    n = int(dur * SR); t = tt(n)
    s = sum(osc(ep1_choir(f0 * m), f0 * m, n, drift=0.0004, seed=seed + i) for i, m in enumerate((1, 1.5, 2)))
    s = s * (0.85 + 0.15 * (np.sin(2 * np.pi * 5.5 * t) > 0.6)) * adsr(n, 1.5, 0.1, 1.0, 1.5)
    return fft_filter(s / 3, 60, 2400)
def ep1_choir(f): return syn.choir_table(f, 'a')

# ---------------------------------------------------------------- sound effects
def thunder(seed=0, dur=5.0):
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    crack = fft_filter(r.randn(n), 800, 7000) * np.exp(-t * 9) * 0.6
    roll = fft_filter(r.randn(n), 25, 260) * (np.minimum(t / 0.15, 1) * np.exp(-t * 0.9)) * (0.7 + 0.3 * np.sin(2 * np.pi * 1.7 * t + r.rand() * 6))
    return ((crack + roll * 2.4)).astype(np.float32)
def rain(t0, t1, seed=0):
    n = int((t1 - t0) * SR); r = np.random.RandomState(seed)
    s = fft_filter(r.randn(n), 1200, 9000) * 0.35 + fft_filter(r.randn(n), 200, 900) * 0.25
    drops = np.zeros(n); idx = r.randint(0, n, int((t1 - t0) * 120)); drops[idx] = r.rand(len(idx)) * 2
    s += fft_filter(drops, 2500, 9000) * 0.6
    e = np.minimum(tt(n) / 0.4, 1) * np.clip((t1 - t0 - tt(n)) / 0.4, 0, 1)
    return (s * e).astype(np.float32)
def heavy_step(seed, plate=1.0):
    s = footstep(seed, 1.3)
    n = len(s); t = tt(n); r = np.random.RandomState(seed)
    clank = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(620 + r.rand() * 80, 22, 0.14), (1460 + r.rand() * 120, 30, 0.1), (2350 + r.rand() * 200, 40, 0.07)])
    return (s + clank * plate).astype(np.float32)
def buckle(seed):
    n = int(0.35 * SR); t = tt(n); r = np.random.RandomState(seed)
    creak = fft_filter(r.randn(n) * (r.rand(n) > 0.85), 400, 3000) * np.exp(-t * 7) * 0.6
    click = (np.sin(2 * np.pi * 3600 * t) * np.exp(-t * 120) + np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 90)) * 0.5
    return (creak + np.roll(click, int(0.12 * SR))).astype(np.float32)
def cloth_fall(seed=0):
    n = int(0.9 * SR); t = tt(n); r = np.random.RandomState(seed)
    sw = fft_filter(r.randn(n), 150, 1600) * np.sin(np.pi * np.clip(t / 0.7, 0, 1)) * 0.5
    thud = np.sin(2 * np.pi * 90 * t) * np.exp(-np.clip(t - 0.62, 0, None) * 25) * (t > 0.62) * 0.6
    return (sw + thud).astype(np.float32)
def helm_on(seed=0):
    """The helm settles: a heavy muffled metal thunk, a short ring, then the close breath inside the visor."""
    n = int(2.2 * SR); t = tt(n); r = np.random.RandomState(seed)
    thunk = np.sin(2 * np.pi * 140 * t * (1 + np.exp(-t * 30))) * np.exp(-t * 18) * 0.9
    ring = metal_hit(980, 2.2, seed + 1, noise=0.15)[:n] * 0.45
    breath = fft_filter(r.randn(n), 300, 1800) * np.exp(-((t - 0.9) / 0.35) ** 2) * 0.35
    return (fft_filter(thunk, 40, 1800) + ring + breath).astype(np.float32)
def shield_lift(seed=0):
    n = int(1.2 * SR); t = tt(n); r = np.random.RandomState(seed)
    scr = fft_filter(r.randn(n), 600, 4000) * np.exp(-((t - 0.25) / 0.18) ** 2) * 0.5
    thump = np.sin(2 * np.pi * 75 * t) * np.exp(-np.clip(t - 0.55, 0, None) * 20) * (t > 0.55) * 0.9
    b = buckle(seed + 3); strap = np.zeros(n, np.float32); i0 = int(0.75 * SR); k = min(len(b), n - i0); strap[i0:i0 + k] = b[:k] * 0.7
    return (scr + thump + strap).astype(np.float32)
def stone_doors(seed=0):
    g = grind(3.6, seed, 9) * 1.1
    n = len(g); t = tt(n)
    boom = np.sin(2 * np.pi * 42 * t) * np.exp(-np.clip(t - 3.0, 0, None) * 3) * (t > 3.0) * 1.2
    return (g + boom + rumble(3.6, seed + 1, 18, 120)[:n] * 0.6).astype(np.float32)

# ---------------------------------------------------------------- MUSIC
def music():
    M = buf()
    # hook / exterior: a low D-A drone and a single distant horn call
    place(M, drone(hz('D1'), 17.0, att=1.2, rel=2.5, seed=3, bright=500), 0.0, 0.45)
    place(M, horn_note(hz('A2'), 2.6, att=0.4, seed=5), 2.3, 0.35, -0.3); place(M, horn_note(hz('D3'), 2.8, att=0.4, seed=6), 3.6, 0.3, -0.3)
    # the armory: hurdy-gurdy drone and a solemn "oo" choir, sparse
    place(M, gurdy(hz('D2'), 18.0, 10), 8.0, 0.22, 0.2)
    place(M, choir_chord(['D3', 'A3', 'D4'], 6.0, 'u', att=2.5, rel=1.5, seed=11), 9.0, 0.4)
    # the reveal of the armour: a quiet, awed chord (F major over D)
    place(M, choir_chord(['D3', 'F3', 'A3', 'C4', 'F4'], 8.5, 'o', att=1.5, rel=1.5, seed=12, bright=1.2), 16.7, 0.55)
    place(M, theme(18.2, 0.62, 0, 0.35, 20), 0, 1.0)
    # the sigil wakes: a shimmer and a held breath of choir
    n = int(4.0 * SR); sh = sum(np.sin(2 * np.pi * f * tt(n) + rs.rand() * 6) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.4 + rs.rand()) * tt(n))) for f in (880, 1320, 1760, 2640))
    place(M, (sh * adsr(n, 0.8, 0.1, 1, 1.5) * 0.06).astype(np.float32), 26.6, 1.0)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 5.5, 'a', att=1.0, rel=1.2, seed=13), 26.4, 0.5)
    # transformation: a heartbeat drum (70 bpm) building under strings and choir, D dorian
    t = 31.8; k = 0
    while t < 43.0:
        g = 0.35 + 0.55 * (t - 31.8) / 11.2
        place(M, taiko(50, 1.0, 400 + k), t, g); place(M, taiko(46, 0.8, 600 + k), t + 0.28, g * 0.55); k += 1; t += 60 / (70 + (t - 31.8) * 2.2)
    def g_ost(tm): return np.clip((tm - 31.8) / 2, 0, 1) * np.clip((44.0 - tm) / 0.3, 0, 1)
    place(M, syn.strings_ostinato(['D2', 'D2', 'C2', 'A1'], 31.8, 84, 4, g_ost), 31.8, 0.4)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F4'], 5.0, 'u', att=1.2, rel=0.6, seed=21), 31.8, 0.45)
    place(M, choir_chord(['C3', 'G3', 'C4', 'E4'], 3.8, 'u', att=0.8, rel=0.6, seed=22), 36.6, 0.5)
    place(M, choir_chord(['Bb2', 'F3', 'Bb3', 'D4'], 4.2, 'a', att=1.5, rel=0.4, seed=23, bright=1.2), 38.8, 0.55)
    # silence of a breath as the helm comes down, then the ember takes: the reveal in D MAJOR
    place(M, choir_chord(['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'], 6.0, 'a', att=0.25, rel=1.6, seed=31, bright=1.5), 43.1, 0.8)
    place(M, syn.brass_swell(['D2', 'A2', 'D3', 'F#3'], 5.6, att=0.4, seed=32), 43.1, 0.4)
    for t0, g in [(43.15, 1.3), (44.0, 0.9), (48.6, 0.6), (51.15, 1.1), (52.6, 0.8)]: place(M, taiko(44, 1.8, int(t0 * 10)), t0, g)
    place(M, theme(45.0, 0.55, 0, 0.5, 40), 0, 1.0)
    place(M, choir_chord(['G2', 'D3', 'G3', 'B3', 'D4'], 3.0, 'a', att=0.5, rel=0.8, seed=33), 49.0, 0.6)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 2.6, 'a', att=0.3, rel=0.6, seed=34, bright=1.4), 51.1, 0.7)
    # walking out: the theme on horns over a full D major choir; the last chord rings into the title
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4', 'A4'], 8.0, 'o', att=0.8, rel=3.0, seed=41, bright=1.3), 54.8, 0.75)
    place(M, theme(55.0, 0.52, 12, 0.32, 50, [('D3', 1.0), ('F#3', 0.5), ('G3', 0.5), ('A3', 1.5), ('B3', 0.5), ('A3', 0.5), ('F#3', 0.5), ('D3', 2.5)]), 0, 1.0)
    place(M, drone(hz('D1'), 8.0, att=1.0, rel=3.0, seed=42, bright=600), 55.0, 0.4)
    M = reverb(M, 3.6, 0.32, damp=4500, seed=1)
    tline = tt(N); M *= np.where(tline > TL.DURATION - 0.6, np.clip((TL.DURATION - tline) / 0.6, 0, 1), 1.0)[:, None]
    return M

# ---------------------------------------------------------------- SFX
def sfx():
    S = buf(); B = buf()
    # storm outside
    place(S, rain(0.0, 7.7, 1), 0.0, 0.8); place(S, rain(55.0, 59.7, 2), 55.0, 0.7)
    for i, t0 in enumerate(C['thunder']): place(S, thunder(10 + i, 5.0), t0, 1.0 if i == 0 else 0.6, (i - 0.5) * 0.6)
    # heavy armoured footsteps: outside (wet stone), inside (echoing hall)
    t0, t1, cyc = C['steps_ext']; t = t0 + 0.2; k = 0
    while t < t1: place(S, heavy_step(int(t * 100), 0.8), t, 0.45, -0.1 if k % 2 else 0.1); k += 1; t += 1 / (2 * cyc)
    for (a, b, cyc) in C['steps_in']:
        t = a; k = 0
        while t < b: place(B, heavy_step(int(t * 100) + 7, 1.0), t, 0.55, -0.1 if k % 2 else 0.1); k += 1; t += 1 / (2 * cyc)
    # the stone doors
    place(B, stone_doors(5), C['doors'], 1.0)
    # the reveal: a deep rumble, dust
    place(S, rumble(3.0, 6, 18, 90), C['reveal'], 0.6)
    # the touch and the sigil
    place(S, metal_hit(1300, 1.2, 8, noise=0.2), C['touch'], 0.35)
    place(S, whoosh(1.2, 400, 2400, 9, q=1.6), C['sigil'] - 0.5, 0.3)
    place(B, bell(hz('A3'), 4, 0.6, 12), C['sigil'], 0.25)
    place(S, metal_hit(2600, 0.8, 13, noise=0.1), C['brow'], 0.2)
    # transformation foley
    place(S, cloth_fall(14), C['cloak_fall'], 0.9)
    place(S, metal_hit(420, 0.9, 15, noise=0.5), C['cloak_fall'] + 0.55, 0.35)
    for i, t0 in enumerate(C['buckle']): place(S, buckle(20 + i), t0, 0.7, 0.2)
    place(S, metal_hit(560, 1.4, 16, noise=0.6), C['pauldron'], 0.8); place(S, metal_hit(760, 1.0, 17, noise=0.4), C['pauldron'] + 0.08, 0.4)
    for t0 in (C['gauntlet'], C['gauntlet2']): place(S, scrape(0.4, int(t0)) * 0.6, t0 - 0.2, 0.5); place(S, metal_hit(1700, 0.7, int(t0 * 3), noise=0.4), t0, 0.5)
    place(S, metal_hit(600, 1.0, 18, noise=0.5), C['helm_off'], 0.45); place(S, scrape(0.7, 19), C['helm_off'] - 0.3, 0.3)
    place(S, helm_on(21), C['helm_on'], 1.1)
    place(S, whoosh(1.4, 200, 2200, 22, q=1.0), C['ember'] - 0.4, 0.45); place(S, rumble(2.5, 23, 20, 120), C['ember'], 0.8)
    # shield, sword, guard
    place(S, shield_lift(24), C['shield'], 0.9); place(S, metal_hit(480, 1.2, 25, noise=0.5), C['shield_set'], 0.5)
    place(S, scrape(0.6, 26), C['draw'] - 0.3, 0.9); place(S, metal_hit(1900, 1.8, 27, noise=0.2), C['draw'] + 0.25, 0.45)
    place(S, metal_hit(700, 1.0, 28, noise=0.6), C['guard'], 0.4)
    # walking out: heavy plate steps
    t0, t1, cyc = C['steps_out']; t = t0 + 0.15; k = 0
    while t < t1: place(S, heavy_step(int(t * 100) + 9, 1.2), t, 0.5, -0.1 if k % 2 else 0.1); k += 1; t += 1 / (2 * cyc)
    # title: a single distant bell
    place(B, bell(hz('D2'), 6, 0.5, 30), C['title'] + 0.2, 0.35)
    S = reverb(S, 1.6, 0.18, 5000, 2) + reverb(B, 2.6, 0.45, 4200, 3)
    t = tt(N); S[(t >= C['cut']) & (t < C['title'] + 0.15)] *= 0.0
    return S

def main():
    vo_dir, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, 'tmp'); os.makedirs(tmp, exist_ok=True)
    syn.NARRATION = TL.NARRATION
    V = syn.vo(vo_dir, tmp); print('vo done')
    Mu = music(); print('music done')
    Sx = sfx(); print('sfx done')
    env = np.abs(V).max(1); win = int(0.25 * SR); env = np.convolve(env, np.ones(win) / win, mode='same'); env = env / (env.max() + 1e-9)
    Mu_d = Mu * (1 - 0.45 * np.clip(env * 4, 0, 1))[:, None]; Sx_d = Sx * (1 - 0.2 * np.clip(env * 4, 0, 1))[:, None]
    norm = lambda x, p: x / (np.abs(x).max() + 1e-9) * p
    Mu_d = norm(Mu_d, 0.6); Sx_d = norm(Sx_d, 0.8); Vn = norm(V, 0.9)
    mix = Vn + Mu_d * 0.66 + Sx_d * 0.72
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
