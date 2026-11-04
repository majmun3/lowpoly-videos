// Master timeline for WHAT IF DRAGONS STILL EXISTED? (62 s)
import { SHOTS_DRAGONS as S } from './shots.js';
export const TIMELINE = [
  ['D01', 0.0, 2.2], ['D02', 2.2, 4.2], ['D03', 4.2, 6.0],
  ['D04', 6.0, 8.6, 0.4], ['D05', 8.6, 10.8], ['D06', 10.8, 13.0],
  ['D07', 13.0, 15.6, 0.4], ['D08', 15.6, 17.8], ['D09', 17.8, 20.2],
  ['D10', 20.2, 22.6, 0.4], ['D11', 22.6, 24.8], ['D12', 24.8, 27.0],
  ['D13', 27.0, 29.2, 0.4], ['D14', 29.2, 31.4], ['D15', 31.4, 33.4], ['D16', 33.4, 35.2],
  ['D17', 35.2, 37.6, 0.4], ['D18', 37.6, 40.0], ['D19', 40.0, 43.2],
  ['D20', 43.2, 46.0, 0.4], ['D21', 46.0, 48.8], ['D22', 48.8, 52.0],
  ['D23', 52.0, 55.6, 0.6], ['D24', 55.6, 58.2], ['D25', 58.2, 62.0, 0.6],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 62.0;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  const fade = Math.max(1 - t / 0.1, 0, Math.min(1, (t - 61.3) / 0.7));
  const flash = pulse(t, 29.85, 0.06) * 0.35;   // the rooftop impact
  return { fade, flash, flashCol: 0xffe8d0, vign: 0.35 };
}
