// Master timeline for WHAT IF YOU WERE BORN AS A DWARF? (64 s)
import { SHOTS_DWARF as S } from './shots.js';
export const TIMELINE = [
  ['D01', 0.0, 2.3], ['D02', 2.3, 4.4], ['D03', 4.4, 6.4], ['D04', 6.4, 7.4],
  ['D05', 7.4, 10.7, 0.4], ['D06', 10.7, 13.0], ['D07', 13.0, 15.3],
  ['D08', 15.3, 18.9, 0.4], ['D09', 18.9, 19.9], ['D10', 19.9, 21.6], ['D11', 21.6, 24.7],
  ['D12', 24.7, 26.8, 0.4], ['D13', 26.8, 28.8], ['D14', 28.8, 32.3],
  ['D15', 32.3, 35.6, 0.5], ['D16', 35.6, 37.8], ['D17', 37.8, 39.4], ['D18', 39.4, 43.0],
  ['D19', 43.0, 46.0], ['D20', 46.0, 48.2], ['D21', 48.2, 49.6], ['D22', 49.6, 53.0],
  ['D23', 53.0, 57.4, 0.6], ['D24', 57.4, 60.6], ['D25', 60.6, 64.0],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 64.0;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  const fade = Math.max(1 - t / 0.15, 0, Math.min(1, (t - 63.2) / 0.8));
  let flash = pulse(t, 48.2 + 0.35 + (0.5 - 0.35) / 0.3 + 0.02, 0.07) * 0.65;   // the secret weapon lands
  flash = Math.max(flash, pulse(t, 49.6 + 1.8, 0.1) * 0.25);                        // the orc king lands in his army
  return { fade, flash: Math.min(1, flash), flashCol: 0xfff0d8, vign: 0.42 };
}
