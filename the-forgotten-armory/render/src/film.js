// Master timeline for VHALDREN — EPISODE 3: THE ARMOR THAT WOULD LAST FOREVER (63 s).
import { SHOTS_EP3 as S } from './shots.js';
export const TIMELINE = [
  ['S01', 0.0, 4.8], ['S02', 4.8, 7.6], ['S03', 7.6, 11.0], ['S04', 11.0, 14.6, 0.5], ['S05', 14.6, 16.8], ['S06', 16.8, 20.0],
  ['S07', 20.0, 21.8], ['S08', 21.8, 23.4], ['S09', 23.4, 25.0], ['S10', 25.0, 29.0], ['S11', 29.0, 31.8],
  ['S12', 31.8, 34.2], ['S13', 34.2, 36.6], ['S14', 36.6, 38.8], ['S15', 38.8, 41.0], ['S16', 41.0, 44.0],
  ['S17', 44.0, 48.2], ['S18', 48.2, 50.4], ['S19', 50.4, 52.6], ['S20', 52.6, 55.0], ['S21', 55.0, 63.0, 0.5],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 63.0;
export const CUT_TO_BLACK = 59.6;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  let fade = Math.max(1 - t / 0.6, 0);
  if (t >= CUT_TO_BLACK) fade = 1;
  let flash = pulse(t, 1.1, 0.05) * 0.5 + pulse(t, 1.35, 0.05) * 0.3;       // lightning over the fortress
  flash = Math.max(flash, pulse(t, 27.0, 0.12) * 0.25);                       // the sigil wakes
  flash = Math.max(flash, pulse(t, 43.2, 0.1) * 0.45);                        // the helm is set: the ember takes
  return { fade, flash, flashCol: t < 5 ? 0xdde6ff : 0xffe2b0 };
}
