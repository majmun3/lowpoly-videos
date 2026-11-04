#!/usr/bin/env bash
# Rebuilds WHAT IF DRAGONS STILL EXISTED? end to end.
# Reuses the series engine, synthesis toolkits and fonts (../the-last-ember).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; EP1="$ROOT/../the-last-ember"
WORK="${WORK:-$ROOT/build}"; MODELS="${MODELS:-$EP1/build/models}"
VOICE="${VOICE:-bm_george:0.6,am_fenrir:0.4}"   # deep, calm documentary narrator
mkdir -p "$WORK" "$MODELS" "$ROOT/output" "$ROOT/images"
REL=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f "$MODELS/kokoro-v1.0.onnx" ] || curl -sSL -o "$MODELS/kokoro-v1.0.onnx" "$REL/kokoro-v1.0.onnx"
[ -f "$MODELS/voices-v1.0.bin" ] || curl -sSL -o "$MODELS/voices-v1.0.bin" "$REL/voices-v1.0.bin"
( cd "$EP1/render" && [ -d node_modules/three ] || npm install --no-audit --no-fund )

echo "== narration";        python3 "$ROOT/audio/tts.py" "$MODELS" "$WORK/vo_raw" "$VOICE" 0.93
echo "== frames";           node "$ROOT/render/render.cjs" film video "$WORK/frames.mkv" 0 62
echo "== scene images";     node "$ROOT/render/render.cjs" film stills "$WORK/scenes" 1.0,3.2,5.0,7.3,9.7,12.0,14.3,16.7,19.0,21.4,23.7,26.0,28.2,30.3,32.4,34.3,36.4,38.8,41.6,44.6,47.4,50.6,53.8,57.0,60.0
echo "== design sheet";     node "$ROOT/render/render.cjs" sheet stills "$WORK/sheet" 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5
echo "== score + sound";    python3 "$ROOT/audio/synth.py" "$WORK/vo_raw" "$WORK/audio"
echo "== subtitles";        python3 "$ROOT/audio/make_subs.py" "$WORK/vo_raw/durations.json" "$WORK/subs.ass"
echo "== assemble"
ffmpeg -y -loglevel error -i "$WORK/frames.mkv" -i "$WORK/audio/mix.wav" -filter_complex \
  "[0:v]noise=alls=5:allf=t,scale=1080:1920:flags=neighbor,subtitles=$WORK/subs.ass:fontsdir=$EP1/assets/fonts,format=yuv420p[v];[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 22 -maxrate 5500k -bufsize 11M -profile:v high -r 30 -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$ROOT/output/what_if_dragons_still_existed.mp4"
python3 "$ROOT/render/export_images.py" "$WORK/scenes" "$WORK/sheet" "$ROOT/images" "$EP1/assets/fonts"
echo "done -> $ROOT/output/what_if_dragons_still_existed.mp4"
