// Master timeline for THE LAST EMBER (64 s). [id, start, end, dissolveSeconds]
import { SHOTS_A } from './shots.js';
import { SHOTS_B } from './shots2.js';
const S = { ...SHOTS_A, ...SHOTS_B };
export const TIMELINE = [
  ['S01', 0.0, 3.0], ['S02', 3.0, 5.2], ['S03', 5.2, 9.5], ['S04', 9.5, 12.4, 0.6], ['S05', 12.4, 15.0], ['S05b', 15.0, 16.9],
  ['S06', 16.9, 21.1, 0.4], ['S07', 21.1, 24.2], ['S08', 24.2, 27.7], ['S09', 27.7, 30.6], ['S10', 30.6, 34.3],
  ['S11', 34.3, 38.6, 0.8], ['S12', 38.6, 40.8], ['S13', 40.8, 43.3], ['S14', 43.3, 48.4, 0.5], ['S15a', 48.4, 50.0], ['S15b', 50.0, 51.1],
  ['S16', 51.1, 54.6], ['S17', 54.6, 57.2], ['S18', 57.2, 64.0],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 64.0;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  let fade = Math.max(1 - t / 0.6, 0);                       // fade in
  fade = Math.max(fade, Math.min(1, Math.max(0, (t - 61.3) / 0.8)));  // fade out to the title
  // hard dip to black on the bell-toll before the cathedral
  let flash = 0, flashCol = 0xfff2dc;
  flash = Math.max(flash, pulse(t, 31.8, 0.05) * 0.85); // sword strike
  if (t > 48.3 && t < 48.8) { flash = Math.max(flash, 1 - (t - 48.4) / 0.4); flashCol = 0xff3010; } // flashback cut
  if (t > 49.95 && t < 50.35) { flash = Math.max(flash, 1 - (t - 50.0) / 0.35); flashCol = 0xff3010; }
  flash = Math.max(flash, pulse(t, 52.05, 0.1) * 0.85);       // ignition
  return { fade, flash: Math.min(1, Math.max(0, flash)), flashCol };
}
