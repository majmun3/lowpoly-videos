// Master timeline for WHAT IF YOU WERE BORN AS A DRAGON? (58.5 s)
import { SHOTS_DRAGON as S } from './shots.js';
export const TIMELINE = [
  ['D00', 0.0, 1.6], ['D01', 1.6, 4.6], ['D02', 4.6, 8.3], ['D03', 8.3, 10.2], ['D04', 10.2, 14.0], ['D05', 14.0, 16.9], ['D06', 16.9, 19.1],
  ['D07', 19.1, 21.6], ['D08a', 21.6, 23.0], ['D08b', 23.0, 25.1], ['D09', 25.1, 27.9], ['D10', 27.9, 32.2], ['D11', 32.2, 34.4],
  ['D12', 34.4, 38.3], ['D13', 38.3, 40.4], ['D14', 40.4, 42.4], ['D15a', 42.4, 43.55], ['D15b', 43.55, 44.75], ['D15c', 44.75, 46.0], ['D16a', 46.0, 51.8], ['D16b', 51.8, 58.5],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 58.5;
export const CUT_TO_BLACK = 54.6;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  let fade = Math.max(1 - t / 0.25, 0);
  if (t >= CUT_TO_BLACK) fade = 1;
  let flash = 0, col = 0xfff0d0;
  flash = Math.max(flash, pulse(t, 1.6, 0.06) * 0.8);     // smash cut from the flash-forward to the egg
  flash = Math.max(flash, pulse(t, 12.45, 0.08) * 0.35);  // first fire
  if (t > 34.3 && t < 34.8) { flash = Math.max(flash, 1 - (t - 34.4) / 0.4); col = 0xff4a18; } // into the past
  if (t > 38.2 && t < 38.6) { flash = Math.max(flash, 1 - (t - 38.3) / 0.3); col = 0xff4a18; } // back
  flash = Math.max(flash, pulse(t, 54.35, 0.1) * 0.7);    // the eye ignites
  return { fade, flash: Math.min(1, flash), flashCol: col };
}
