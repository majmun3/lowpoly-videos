#!/usr/bin/env bash
# Rebuilds the DARK FANTASY CINEMATIC (30 s, vertical, silent, no text) end to end.
# Reuses the series engine (../the-last-ember) and assets from the other shorts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; EP1="$ROOT/../the-last-ember"
WORK="${WORK:-$ROOT/build}"; mkdir -p "$WORK" "$ROOT/output" "$ROOT/images"
( cd "$EP1/render" && [ -d node_modules/three ] || npm install --no-audit --no-fund )
echo "== frames";        node "$ROOT/render/render.cjs" film video "$WORK/frames.mkv" 0 30
echo "== keyframes";     node "$ROOT/render/render.cjs" film stills "$WORK/scenes" 1.25,6.5,10.0,14.5,18.0,23.0,26.0,29.9
echo "== design sheet";  node "$ROOT/render/render.cjs" sheet stills "$WORK/sheet" 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5
echo "== encode (no audio track, no text)"
ffmpeg -y -loglevel error -i "$WORK/frames.mkv" -vf "noise=alls=2:allf=t,scale=1080:1920:flags=neighbor,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -r 30 -an -movflags +faststart "$ROOT/output/dark_fantasy_cinematic_30s.mp4"
python3 "$ROOT/render/export_images.py" "$WORK/scenes" "$WORK/sheet" "$ROOT/images" "$EP1/assets/fonts"
echo "done -> $ROOT/output/dark_fantasy_cinematic_30s.mp4"
