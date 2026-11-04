// Master timeline for WHAT IF YOU WERE BORN AS A VAMPIRE? (62 s)
import { SHOTS_VAMPIRE as S } from './shots.js';
export const TIMELINE = [
  ['V01', 0.0, 1.7], ['V02', 1.7, 3.0], ['V03', 3.0, 4.2], ['V04', 4.2, 5.6],
  ['V05', 5.6, 8.4, 0.4], ['V06', 8.4, 10.0], ['V07', 10.0, 10.9], ['V08', 10.9, 12.6],
  ['V09', 12.6, 14.8, 0.4], ['V10', 14.8, 16.0], ['V11', 16.0, 17.4], ['V12', 17.4, 19.8],
  ['V13', 19.8, 23.8, 0.6], ['V14', 23.8, 27.8, 0.8],
  ['V15', 27.8, 31.6, 0.6], ['V16', 31.6, 33.8], ['V17', 33.8, 35.6],
  ['V18', 35.6, 38.0], ['V19', 38.0, 40.0], ['V20', 40.0, 41.8], ['V21', 41.8, 46.0],
  ['V22', 46.0, 49.8, 0.8], ['V23', 49.8, 53.6],
  ['V24', 53.6, 57.4, 0.7], ['V25', 57.4, 62.0],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 62.0;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  const fade = Math.max(1 - t / 0.12, 0, Math.min(1, (t - 61.3) / 0.7));
  let flash = pulse(t, 3.25, 0.05) * 0.15, col = 0xff3040;                          // the candles die
  flash = Math.max(flash, pulse(t, 15.35, 0.06) * 0.35);                             // he vanishes
  flash = Math.max(flash, pulse(t, 37.2, 0.05) * 0.7, pulse(t, 38.25, 0.05) * 0.5);  // crimson lightning
  flash = Math.max(flash, pulse(t, 40.55, 0.08) * 0.4);                              // the transformation
  flash = Math.max(flash, pulse(t, 59.8, 0.1) * 0.25);                               // the final glare
  return { fade, flash: Math.min(1, flash), flashCol: col, vign: 0.5 };
}
