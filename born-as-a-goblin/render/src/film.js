// Master timeline for WHAT IF YOU WERE BORN AS A GOBLIN? (62.5 s)
import { SHOTS_GOBLIN as S } from './shots.js';
export const TIMELINE = [
  ['G00', 0.0, 2.2], ['G01a', 2.2, 5.2], ['G01b', 5.2, 8.8], ['G02', 8.8, 11.2], ['G03', 11.2, 14.0], ['G04', 14.0, 16.8, 0.4],
  ['G05', 16.8, 18.9], ['G06', 18.9, 21.6], ['G07', 21.6, 23.4], ['G08a', 23.4, 25.0, 0.3], ['G08b', 25.0, 26.6], ['G09', 26.6, 29.4],
  ['G10', 29.4, 32.8, 0.4], ['G11a', 32.8, 35.4, 0.3], ['G11b', 35.4, 37.4], ['G12', 37.4, 39.8], ['G13', 39.8, 43.2, 0.4],
  ['G14', 43.2, 47.6, 0.4], ['G15', 47.6, 49.8], ['G16', 49.8, 53.2], ['G17', 53.2, 57.0, 0.4], ['G18', 57.0, 62.5],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 62.5;
export const CUT_TO_BLACK = 59.6;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  let fade = Math.max(1 - t / 0.25, 0);
  if (t >= CUT_TO_BLACK) fade = 1;
  let flash = pulse(t, 2.2, 0.07) * 0.7;          // smash cut from the future king to the forest
  flash = Math.max(flash, pulse(t, 36.2, 0.06) * 0.5); // the killing blow
  flash = Math.max(flash, pulse(t, 59.0, 0.12) * 0.25); // the eyes ignite
  return { fade, flash, flashCol: 0xfff4dc, vign: 0.45 };
}
