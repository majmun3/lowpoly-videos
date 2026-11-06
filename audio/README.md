# Audio for "What If You Were Born As A Knight"

No music. Narration + synchronized sound effects only.

- `events.py` (run with Blender's Python) reads `out/knight_dark_fantasy.blend` and extracts the sync points
  from the actual animation: foot contacts, sword-tip speed peaks, spark/impact flashes, lightning flashes, camera cuts → `events.json`.
- `mix.py` generates the narration with Kokoro TTS (open neural model, voice `bm_lewis`), synthesizes every effect
  procedurally (numpy/scipy), places them on those frames with distance gain + stereo pan, ducks effects under the voice and mixes.

Outputs in `out/`: `voiceover.wav` (full-length synced narration), `sfx.wav` (effects + ambience),
`mix_master.wav` (final, -14 LUFS, -1.5 dBTP), `narration/line_XX.wav`, `sfx_library/*.wav`.

Rebuild:
```
blender_python audio/events.py out/knight_dark_fantasy.blend audio/events.json
tts_python audio/mix.py audio/events.json kokoro-v1.0.onnx voices-v1.0.bin audio/out
```
