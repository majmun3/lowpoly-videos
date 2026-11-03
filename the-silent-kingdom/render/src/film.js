// Master timeline for VHALDREN — EPISODE 2: THE SILENT KINGDOM (63 s). [id, start, end, dissolveSeconds]
import { SHOTS_EP2 as S } from './shots.js';
export const TIMELINE = [
  ['S01', 0.0, 5.5], ['S02', 5.5, 9.6, 0.5], ['S03', 9.6, 13.4], ['S04', 13.4, 15.6, 0.5], ['S05', 15.6, 17.9], ['S06', 17.9, 21.9],
  ['S07', 21.9, 25.8], ['S08', 25.8, 29.4], ['S09', 29.4, 30.5], ['S10', 30.5, 32.5], ['S11', 32.5, 35.6], ['S12', 35.6, 37.9],
  ['S13', 37.9, 41.1], ['S14', 41.1, 46.0, 0.6], ['S15', 46.0, 48.5], ['S16a', 48.5, 51.0], ['S16b', 51.0, 54.8, 0.4], ['S17', 54.8, 63.0],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 63.0;
export const CUT_TO_BLACK = 57.4;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  let fade = Math.max(1 - t / 0.7, 0);
  if (t >= CUT_TO_BLACK) fade = 1;                     // hard cut to black right before the blow
  let flash = pulse(t, 30.62, 0.06) * 0.55;            // the Wakebell's first strike
  flash = Math.max(flash, pulse(t, 46.9, 0.12) * 0.35); // the iris opens
  return { fade, flash, flashCol: 0xffe8c0 };
}
