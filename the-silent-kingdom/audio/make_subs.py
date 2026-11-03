"""Build styled ASS subtitles (1080x1920) for THE LAST EMBER from the narration timeline.
Usage: python make_subs.py DURATIONS_JSON OUT_ASS
"""
import sys, json, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from narration_lines import LINES, SUB_CHUNKS
from timeline import NARRATION

GOLD = r"{\c&H4CC0F0&}"   # muted gold (BGR)
WHITE = r"{\c&HF2F4F6&}"
KEYWORDS = ["Vhaldren", "Aurelmoor", "golden lights", "no face", "a machine", "switch it off", "nobody", "Nobody", "toward me", "Down", "fear death", "after it"]

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def chunks(text):
    """Split a line into short on-screen phrases (<= ~4 words) at punctuation first."""
    parts = [p.strip() for p in re.split(r"(?<=[,.?!…])\s+|(?<=\.\.\.)\s*", text) if p and p.strip()]
    out = []
    for p in parts:
        w = p.split()
        while len(w) > 5:
            cut = 4 if len(w) > 6 else (len(w) + 1) // 2
            out.append(" ".join(w[:cut])); w = w[cut:]
        if w: out.append(" ".join(w))
    return out

def colorize(s):
    for k in KEYWORDS:
        s = re.sub(re.escape(k), lambda m: GOLD + m.group(0) + WHITE, s, flags=re.I)
    return s

def main():
    dur = json.load(open(sys.argv[1])); out = sys.argv[2]
    ev = []
    for lid, text in LINES:
        t0 = NARRATION[lid]; d = dur[lid]; cs = SUB_CHUNKS.get(lid) or chunks(text)
        weights = [len(c) + 6 for c in cs]; tot = sum(weights); t = t0
        for ci, (c, w) in enumerate(zip(cs, weights)):
            dt = d * w / tot
            ev.append((t, t + dt + (0.08 if ci == len(cs) - 1 else 0.0), "Sub", colorize(c.upper())))  # no overlap inside a line
            t += dt
    # hook caption (top) and end card
    ev.append((0.25, 5.3, "Hook", r"{\fad(250,300)}VHALDREN · EPISODE II"))
    ev.append((60.0, 63.0, "Title", r"{\fad(500,0)}THE SILENT KINGDOM"))
    ev.append((60.6, 63.0, "Ask", r"{\fad(400,0)}WOULD YOU HAVE\NDESTROYED THE MACHINE?\N{\fs40}" + GOLD + "TELL ME IN THE COMMENTS"))
    head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Cinzel,74,&H00F6F4F2,&H000000FF,&H00100808,&H96000000,-1,0,0,0,100,100,1,0,1,5,3,2,70,70,600,1
Style: Hook,Cinzel,50,&H00F6F4F2,&H000000FF,&H00100808,&H96000000,-1,0,0,0,100,100,1,0,1,3.5,2,8,80,80,250,1
Style: Title,Cinzel,96,&H00E8F2FA,&H000000FF,&H00081020,&H00000000,-1,0,0,0,100,100,4,0,1,3,0,5,60,60,0,1
Style: Ask,Cinzel,52,&H00F6F4F2,&H000000FF,&H00100808,&H96000000,-1,0,0,0,100,100,1,0,1,3,0,2,80,80,700,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    with open(out, "w") as f:
        f.write(head)
        for t0, t1, st, tx in sorted(ev):
            f.write(f"Dialogue: 0,{ts(t0)},{ts(t1)},{st},,0,0,0,,{WHITE if st == 'Sub' else ''}{tx}\n")
    print(len(ev), "events ->", out)

if __name__ == "__main__":
    main()
