"""Synthesize narration lines with Kokoro-82M (Apache-2.0) via kokoro-onnx.
Usage: python tts.py MODEL_DIR OUT_DIR [voice_spec] [speed]
voice_spec: e.g. "bm_george:0.7,am_fenrir:0.3"
"""
import sys, os, json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from narration_lines import LINES, tts_text

model_dir, out_dir = sys.argv[1], sys.argv[2]
spec = sys.argv[3] if len(sys.argv) > 3 else "bm_george:0.7,am_fenrir:0.3"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 0.88
only = sys.argv[5].split(",") if len(sys.argv) > 5 else None
os.makedirs(out_dir, exist_ok=True)
k = Kokoro(os.path.join(model_dir, "kokoro-v1.0.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))
style = None
for part in spec.split(","):
    name, w = part.split(":")
    v = k.get_voice_style(name) * float(w)
    style = v if style is None else style + v
info = {}
for lid, text in LINES:
    if only and lid not in only:
        continue
    samples, sr = k.create(tts_text(text), voice=style, speed=speed, lang="en-gb" if "b" == spec[0] else "en-us")
    # trim leading/trailing near-silence
    a = np.abs(samples)
    idx = np.where(a > 0.01)[0]
    if len(idx):
        samples = samples[max(0, idx[0] - 600): idx[-1] + 2400]
    sf.write(os.path.join(out_dir, f"{lid}.wav"), samples, sr)
    info[lid] = round(len(samples) / sr, 3)
    print(lid, info[lid], text)
print("TOTAL", round(sum(info.values()), 2))
json.dump(info, open(os.path.join(out_dir, "durations.json"), "w"), indent=1)
