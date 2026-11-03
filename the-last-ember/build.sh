#!/usr/bin/env bash
# Rebuilds THE LAST EMBER end to end: narration -> frames -> score/SFX -> subtitles -> final MP4.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
WORK="${WORK:-$ROOT/build}"
MODELS="${MODELS:-$WORK/models}"
VOICE="${VOICE:-bm_george:0.7,am_fenrir:0.3}"
mkdir -p "$WORK" "$MODELS" "$ROOT/output"

echo "== 1/6 narration voice model (Kokoro-82M, Apache-2.0)"
REL=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f "$MODELS/kokoro-v1.0.onnx" ] || curl -sSL -o "$MODELS/kokoro-v1.0.onnx" "$REL/kokoro-v1.0.onnx"
[ -f "$MODELS/voices-v1.0.bin" ] || curl -sSL -o "$MODELS/voices-v1.0.bin" "$REL/voices-v1.0.bin"

echo "== 2/6 narration"
python3 "$ROOT/audio/tts.py" "$MODELS" "$WORK/vo_raw" "$VOICE" 0.94

echo "== 3/6 frames (three.js PS1/PS2-style renderer in headless Chromium, 360x640 @ 30 fps)"
( cd "$ROOT/render" && [ -d node_modules/three ] || npm install --no-audit --no-fund )
node "$ROOT/render/render.cjs" film video "$WORK/frames.mkv" 0 64

echo "== 4/6 original score + sound design"
python3 "$ROOT/audio/synth.py" "$WORK/vo_raw" "$WORK/audio"

echo "== 5/6 subtitles"
python3 "$ROOT/audio/make_subs.py" "$WORK/vo_raw/durations.json" "$WORK/subs.ass"

echo "== 6/6 assemble 1080x1920"
ffmpeg -y -loglevel error -i "$WORK/frames.mkv" -i "$WORK/audio/mix.wav" -filter_complex \
  "[0:v]noise=alls=5:allf=t,scale=1080:1920:flags=neighbor,subtitles=$WORK/subs.ass:fontsdir=$ROOT/assets/fonts,format=yuv420p[v];[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 22 -maxrate 5500k -bufsize 11M -profile:v high -r 30 -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$ROOT/output/the_last_ember.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$ROOT/output/the_last_ember.mp4"
echo "done -> $ROOT/output/the_last_ember.mp4"
