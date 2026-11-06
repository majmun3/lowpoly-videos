#!/bin/bash
# Build the Blender project, render all 8 scenes (360x640 EEVEE), upscale x3 nearest-neighbour to 1080x1920 MP4.
# Usage: ./make_video.sh [blender_python]   (default /opt/bvenv/bin/python, a venv with `pip install bpy`)
set -euo pipefail
PY=${1:-/opt/bvenv/bin/python}
cd "$(dirname "$0")"
[ -n "${RESUME:-}" ] || rm -rf build/frames   # never reuse frames from an older build
mkdir -p build/frames out
"$PY" src/build.py out/knight_dark_fantasy.blend
for n in 1 2 3 4 5 6 7 8; do
  SKIP_EXISTING=1 "$PY" src/render.py out/knight_dark_fantasy.blend "S$n" build/frames
done
ffmpeg -y -loglevel error -framerate 24 -pattern_type glob -i 'build/frames/S*_*.png' \
  -vf "scale=1080:1920:flags=neighbor" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -an \
  out/what_if_you_were_born_a_knight.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -show_entries format=duration -of compact out/what_if_you_were_born_a_knight.mp4
