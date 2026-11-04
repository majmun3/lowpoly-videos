"""Original procedural score + sound design for TODAY YOU WILL LEARN HOW TO CAST SPELLS.
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
TL = SourceFileLoader('timeline_spells', os.path.join(HERE, 'timeline.py')).load_module()
SR = syn.SR
for m in (syn, ep2, ep3, dr, gb, ep2.syn, ep3.syn): m.N = int(TL.DURATION * SR)
syn.DURATION = TL.DURATION; N = syn.N
buf, place, tt, fft_filter, reverb, adsr, osc, hz = syn.buf, syn.place, syn.tt, syn.fft_filter, syn.reverb, syn.adsr, syn.osc, syn.hz
choir_chord, drone, taiko, bell, metal_hit, noise_burst, whoosh, rumble, crackle_track = syn.choir_chord, syn.drone, syn.taiko, syn.bell, syn.metal_hit, syn.noise_burst, syn.whoosh, syn.rumble, syn.crackle_track
horn_note, thunder = ep3.horn_note, ep3.thunder
flute, melody, birds, leaves_wind, thud = gb.flute, gb.melody, gb.birds, gb.leaves_wind, gb.thud
dragon_roar, flame, heartbeat = dr.dragon_roar, dr.flame, dr.heartbeat
rs = np.random.RandomState(21)
C = TL.CUES

# ---------------------------------------------------------------- magic instruments
def hum(dur, f0=220, seed=0, bright=1.0):
    """Magical humming: a slowly beating cluster of pure tones with a glassy overtone shimmer."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed); s = np.zeros(n)
    for k, m in enumerate([1, 1.5, 2, 3, 4.01]):
        for d in (-1, 1): s += np.sin(2 * np.pi * f0 * m * (1 + d * 0.0025) * t + r.rand() * 6) * (0.5 / (k + 1)) * (bright if k > 2 else 1)
    s *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t)
    return (s * adsr(n, min(0.6, dur * 0.3), 0.1, 1, min(0.8, dur * 0.3)) * 0.25).astype(np.float32)
def charge(dur, f0=180, f1=1400, seed=0):
    """Staff charging: a rising whine with sparkle."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    f = f0 * (f1 / f0) ** (t / dur) ** 1.6
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    sp = np.zeros(n); idx = r.randint(0, n, int(dur * 120)); sp[idx] = r.rand(len(idx)); sp = fft_filter(sp, 4000, 12000) * 2
    e = (t / dur) ** 1.2
    return ((s * 0.25 + sp * 0.5) * e).astype(np.float32)
def chime(seed=0, f=1800):
    n = int(1.5 * SR); t = tt(n); r = np.random.RandomState(seed)
    s = sum(np.sin(2 * np.pi * f * m * (1 + r.randn() * 0.002) * t) * np.exp(-t * (2 + m)) * (1 / m) for m in (1, 2.76, 5.4))
    return (s * 0.3).astype(np.float32)
def buzz(dur, seed=0, k=1.0):
    """Electrical buzzing: a mains-like hum with crackling discharge."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    h = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.15 + np.sin(2 * np.pi * 220 * t) * 0.1
    cr = np.zeros(n); idx = r.randint(0, n, int(dur * 260 * k)); cr[idx] = r.randn(len(idx)) * 2.5
    cr = fft_filter(cr, 1500, 11000) + fft_filter(r.randn(n), 2000, 8000) * 0.1 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t) ** 2)
    e = np.minimum(t / 0.2, 1) * np.clip((dur - t) / 0.3, 0, 1)
    return ((fft_filter(h, 60, 2000) + cr) * e).astype(np.float32)
def zap(seed=0, dur=0.9):
    """The lightning strike: a white crack, a sizzle and a deep tail."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    crack = r.randn(n) * np.exp(-t * 30) * 1.6
    sizzle = fft_filter(r.randn(n), 3000, 12000) * np.exp(-t * 4) * (0.6 + 0.4 * (r.rand(n) > 0.7))
    return (fft_filter(crack, 200, 12000) + sizzle * 0.6).astype(np.float32)
def whoomp(seed=0):
    """Fire ignition: a pressure thump plus a roar of flame."""
    n = int(1.2 * SR); t = tt(n); r = np.random.RandomState(seed)
    th = np.sin(2 * np.pi * 55 * t * (1 + np.exp(-t * 20))) * np.exp(-t * 6)
    return (th + fft_filter(r.randn(n), 150, 3000) * np.exp(-t * 3) * 0.5).astype(np.float32)
def shield_ring(dur=2.5, seed=0):
    """The barrier's impact: a deep, bell-like, slightly detuned glass thrum."""
    n = int(dur * SR); t = tt(n); r = np.random.RandomState(seed)
    s = sum(np.sin(2 * np.pi * f * t + r.rand() * 6) * np.exp(-t * d) * a for f, d, a in [(130, 1.2, 1.0), (196, 1.6, 0.6), (262, 2.0, 0.5), (523, 2.8, 0.35), (1047, 4.0, 0.2), (1570, 5.0, 0.12)])
    s *= 1 + 0.25 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 2)
    return (s * 0.5 + noise_burst(dur, 1500, 9000, 0.001, 18, seed + 1)[:n] * 0.4).astype(np.float32)

# ---------------------------------------------------------------- MUSIC (E dorian lesson → E major mastery)
LESSON = [('E5', 1), ('F#5', 0.5), ('G5', 0.5), ('B5', 1.5), ('A5', 0.5), ('G5', 1), ('F#5', 1), ('E5', 2)]
MAJOR = [('E4', 1), ('G#4', 0.5), ('A4', 0.5), ('B4', 1.5), ('C#5', 0.5), ('E5', 1), ('D#5', 0.5), ('B4', 0.5), ('E5', 2)]
def music():
    M = buf()
    # hook stab and a shimmering opening
    place(M, choir_chord(['E3', 'B3', 'E4', 'G4', 'B4'], 3.2, 'a', att=0.05, rel=1.5, seed=1, bright=1.4), 0.45, 0.6)
    place(M, taiko(46, 1.6, 1), 0.5, 0.9)
    place(M, drone(hz('E2'), 14.5, att=1.0, rel=1.5, seed=2, bright=700), 0.4, 0.25)
    place(M, melody(LESSON, 3.0, 0.4, flute, 0.3, 10), 0, 1.0)
    # the basics: soft choir, strings breathing with the narration
    place(M, choir_chord(['E3', 'B3', 'D4', 'G4'], 8.6, 'u', att=2.0, rel=1.5, seed=3), 6.2, 0.4)
    def g_b(tm): return np.clip((tm - 9.4) / 1.5, 0, 1) * np.clip((14.7 - tm) / 0.5, 0, 1) * 0.6
    place(M, syn.strings_ostinato(['E2', 'E2', 'D2', 'C2'], 9.4, 88, 3, g_b), 9.4, 0.3)
    # lesson I: warm, rising, with a fiery brass hit on the impact
    def g_f(tm): return np.clip((tm - 14.7) / 1.0, 0, 1) * np.clip((22.6 - tm) / 0.15, 0, 1)
    place(M, syn.strings_ostinato(['E2', 'G2', 'A2', 'B2'], 14.7, 100, 4, g_f), 14.7, 0.4)
    place(M, choir_chord(['C3', 'G3', 'C4', 'E4'], 3.8, 'a', att=1.2, rel=0.4, seed=4), 16.6, 0.4)
    place(M, choir_chord(['D3', 'A3', 'D4', 'F#4'], 2.4, 'a', att=0.6, rel=0.2, seed=5, bright=1.3), 20.3, 0.5)
    place(M, choir_chord(['C3', 'G3', 'C4', 'E4', 'G4'], 3.0, 'a', att=0.02, rel=1.8, seed=6, bright=1.5), C['impact'], 0.7)
    place(M, dr.syn.brass_swell(['C2', 'G2', 'C3', 'E3'], 2.8, att=0.05, seed=7), C['impact'], 0.45); place(M, taiko(40, 1.8, 2), C['impact'], 1.2)
    # lesson II: tension — low tremolo, then the strike
    n = int(7.0 * SR); trem = osc(syn.saw_table(40), hz('E2'), n, drift=0.0004, seed=8) * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * tt(n)))
    place(M, fft_filter(trem * adsr(n, 1.5, 0.1, 1, 0.1), 40, 1200), 25.6, 0.35)
    place(M, choir_chord(['E3', 'F3', 'B3', 'D4'], 7.0, 'o', att=1.5, rel=0.1, seed=9), 25.6, 0.45)
    t = 30.6; k = 0
    while t < 33.0: place(M, taiko(70, 0.4, 100 + k), t, 0.25 + 0.5 * (t - 30.6) / 2.4); k += 1; t += max(0.07, 0.3 * (1 - (t - 30.6) / 2.6))
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4', 'E4'], 3.4, 'a', att=0.02, rel=1.8, seed=10, bright=1.6), C['bolt'], 0.75)
    place(M, dr.syn.brass_swell(['A1', 'E2', 'A2', 'C#3'], 3.2, att=0.05, seed=11), C['bolt'], 0.45); place(M, taiko(38, 1.8, 3), C['bolt'], 1.3)
    # lesson III: a heavy, driving pulse for the charge; the shield answers in a bright major chord
    t = 37.0; k = 0
    while t < 43.5: place(M, taiko(52, 0.8, 200 + k), t, 0.6); place(M, taiko(66, 0.5, 300 + k), t + 0.26, 0.3); k += 1; t += 60 / 118
    place(M, choir_chord(['E3', 'G3', 'B3', 'E4'], 6.5, 'a', att=0.5, rel=0.2, seed=12), 37.0, 0.5)
    place(M, choir_chord(['B2', 'F#3', 'B3', 'D#4', 'F#4'], 3.5, 'a', att=0.02, rel=1.6, seed=13, bright=1.5), C['hit'], 0.7)
    place(M, taiko(40, 1.8, 4), C['hit'], 1.2)
    # mastery: E major — the lesson theme in full on horns, strings, choir, building to the burst
    def g_m(tm): return np.clip((tm - 47.0) / 1.0, 0, 1) * np.clip((61.8 - tm) / 0.8, 0, 1)
    place(M, syn.strings_ostinato(['E2', 'E2', 'C#2', 'B1'], 47.0, 104, 7, g_m), 47.0, 0.4)
    place(M, choir_chord(['E3', 'G#3', 'B3', 'E4', 'G#4'], 4.2, 'a', att=1.0, rel=0.4, seed=14, bright=1.3), 47.0, 0.55)
    place(M, melody(MAJOR, 47.4, 0.45, lambda f, d, seed=0: horn_note(f, d, att=0.1, seed=seed), 0.42, 20), 0, 1.0)
    place(M, choir_chord(['C#3', 'G#3', 'C#4', 'E4'], 2.4, 'a', att=0.4, rel=0.3, seed=15), 51.1, 0.55)
    place(M, choir_chord(['A2', 'E3', 'A3', 'C#4'], 2.4, 'a', att=0.4, rel=0.3, seed=16), 53.0, 0.6)
    place(M, choir_chord(['B2', 'F#3', 'B3', 'D#4'], 1.6, 'a', att=0.3, rel=0.2, seed=17, bright=1.4), 54.8, 0.65)
    t = 54.8; k = 0
    while t < C['burst']: place(M, taiko(72, 0.4, 400 + k), t, 0.3 + 0.6 * (t - 54.8) / 1.7); k += 1; t += max(0.06, 0.25 * (1 - (t - 54.8) / 1.8))
    place(M, choir_chord(['E3', 'B3', 'E4', 'G#4', 'B4', 'E5'], 5.5, 'a', att=0.05, rel=3.0, seed=18, bright=1.7), C['burst'], 0.9)
    place(M, dr.syn.brass_swell(['E2', 'B2', 'E3', 'G#3'], 5.3, att=0.1, seed=19), C['burst'], 0.5); place(M, taiko(36, 2.2, 5), C['burst'], 1.4)
    place(M, melody(MAJOR[-4:], 57.6, 0.5, lambda f, d, seed=0: horn_note(f, d, att=0.1, seed=seed), 0.38, 30), 0, 1.0)
    M = reverb(M, 3.0, 0.3, damp=5000, seed=1)
    tl = tt(N); M *= np.clip((TL.DURATION - tl) / 0.8, 0, 1)[:, None]
    return M

def sfx():
    S = buf(); B = buf()
    # the forest is alive under every lesson
    place(S, birds(0.0, 25.6, 1, 2.5), 0.0, 0.6); place(S, leaves_wind(0.0, 47.0, 2), 0.0, 0.45); place(S, birds(37.0, 47.0, 3, 1.5), 37.0, 0.4)
    # hook: the staff strikes; a ring of light
    place(S, thud(4, 70), C['slam'], 1.0); place(S, rumble(1.6, 5, 25, 160), C['slam'], 0.6); place(B, chime(6, 1600), C['slam'], 0.6); place(B, chime(7, 2400), C['slam'] + 0.05, 0.4)
    place(S, whoosh(0.9, 2500, 300, 8, q=1.0), C['slam'], 0.4)
    # mana: humming that grows; the stones answer
    place(S, hum(C['gather'][1] - C['gather'][0], 196, 9), C['gather'][0], 0.6)
    place(S, hum(C['mana'][1] - C['mana'][0], 220, 10, 1.2), C['mana'][0], 0.7)
    for i in range(5): place(B, chime(20 + i, 1400 + i * 260), C['stones'] + i * 0.55, 0.3, (i - 2) * 0.4)
    place(S, charge(3.0, 150, 700, 11), 11.6, 0.4)
    # fireball: ignition, the swelling flame, compression, release, flight, impact
    place(S, whoomp(12), C['flame'][0], 0.8); place(S, flame(C['flame'][1] - C['flame'][0], 13, 0.7), C['flame'][0], 0.7)
    place(S, crackle_track(C['flame'][0], C['flame'][1], 90, 0.5, 14), C['flame'][0], 1.0)
    place(S, charge(1.4, 300, 1800, 15), C['compress'], 0.45)
    place(S, whoosh(1.0, 200, 2200, 16, q=0.8), C['release'] - 0.1, 0.9); place(S, flame(2.0, 17, 0.9), C['fly'][0], 0.6)
    place(S, rumble(2.6, 18, 20, 160), C['impact'], 1.5); place(S, noise_burst(2.2, 80, 5000, 0.002, 2.0, 19), C['impact'], 1.1); place(S, crackle_track(C['impact'], C['impact'] + 2.8, 200, 0.6, 20, 0.2), C['impact'], 1.0)
    for i in range(6): place(S, thud(30 + i, 120 + i * 20), C['impact'] + 0.5 + i * 0.22, 0.35, (i % 3 - 1) * 0.6)   # falling stones
    # lightning: the storm, sparks, crackling arcs, the strike, thunder
    place(S, leaves_wind(C['storm'], 37.0, 40, 1.6), C['storm'], 0.7); place(S, thunder(41, 4.0) * 0.4, C['storm'] + 0.3, 0.5)
    place(S, buzz(C['sparks'][1] - C['sparks'][0], 42, 0.5), C['sparks'][0], 0.45)
    place(S, buzz(C['arcs'][1] - C['arcs'][0], 43, 1.3), C['arcs'][0], 0.7); place(S, charge(C['arcs'][1] - C['arcs'][0], 120, 2400, 44), C['arcs'][0], 0.5)
    place(S, zap(45, 1.2), C['bolt'], 1.3); place(S, thunder(46, 5.0), C['thunder'], 1.4); place(S, buzz(2.4, 47, 2.0), C['bolt'] + 0.1, 0.6)
    place(S, buzz(C['after'][1] - C['after'][0], 48, 0.8), C['after'][0], 0.4)
    # the shield: the brute's roar and charge, the barrier rising, the blow, the fall
    place(S, dragon_roar(1.6, 70, 50, 1.2), C['brute_roar'], 1.0)
    for (a, b) in (C['brute_run'], C['brute_run2']):
        t = a; k = 0
        while t < b: place(S, thud(60 + k, 48), t, 0.7); k += 1; t += 0.36
    place(S, charge(1.4, 200, 1200, 70), C['shield_up'] - 0.2, 0.5); place(B, chime(71, 1250), C['shield_up'] + 1.0, 0.5)
    place(S, hum(C['shield_hum'][1] - C['shield_hum'][0], 130, 72, 1.4), C['shield_hum'][0], 0.6)
    place(S, whoosh(0.5, 150, 1200, 73, q=1.0), C['swing'], 0.8); place(S, shield_ring(3.0, 74), C['hit'], 1.3); place(S, metal_hit(600, 1.6, 75, noise=0.6), C['hit'], 0.6)
    place(S, dragon_roar(1.0, 90, 76, 0.8), C['hit'] + 0.15, 0.6); place(S, rumble(2.0, 77, 20, 140), C['brute_fall'], 1.1); place(S, noise_burst(1.5, 100, 2500, 0.01, 2.6, 78), C['brute_fall'], 0.6)
    # mastery: wind on the hill, the elements swirling, the beam and the burst
    place(S, ep2.cold_wind()[int(47.0 * SR):int(62.0 * SR)] * 3.0, 47.0, 0.9); place(S, leaves_wind(47.0, 61.0, 87, 0.9), 47.0, 0.5)
    place(S, flame(C['swirl'][1] - C['swirl'][0], 80, 0.6), C['swirl'][0], 0.35); place(S, buzz(C['swirl'][1] - C['swirl'][0], 81, 0.7), C['swirl'][0], 0.3); place(S, hum(C['swirl'][1] - C['swirl'][0], 247, 82, 1.4), C['swirl'][0], 0.5)
    place(S, charge(1.5, 200, 3000, 83), C['beam'] - 1.0, 0.6)
    place(S, zap(84, 1.0) * 0.6, C['burst'], 0.8); place(S, rumble(3.5, 85, 18, 140), C['burst'], 1.3); place(S, whoosh(2.5, 3000, 200, 86, q=0.7), C['burst'], 0.6)
    for i in range(6): place(B, chime(90 + i, 1200 + i * 330), C['burst'] + 0.3 + i * 0.25, 0.35, (i % 3 - 1) * 0.6)
    S = reverb(S, 1.6, 0.16, 6000, 2) + reverb(B, 3.0, 0.45, 6000, 3)
    tl = tt(N); S *= np.clip((TL.DURATION - tl) / 0.8, 0, 1)[:, None]
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
    mix = Vn + Mu_d * 0.64 + Sx_d * 0.72
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    for name, x in [('vo', Vn), ('music', Mu_d), ('sfx', Sx_d), ('mix', mix)]: sf.write(os.path.join(out, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    print('written', out)

if __name__ == '__main__':
    main()
