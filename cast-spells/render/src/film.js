// Master timeline for TODAY YOU WILL LEARN HOW TO CAST SPELLS (62 s)
import { SHOTS_SPELLS as S } from './shots.js';
export const TIMELINE = [
  ['W01', 0.0, 3.0], ['W02', 3.0, 6.2], ['W03', 6.2, 9.4, 0.4], ['W04', 9.4, 14.7],
  ['W05', 14.7, 16.6, 0.4], ['W06', 16.6, 20.3], ['W07', 20.3, 22.3], ['W08', 22.3, 25.6],
  ['W09', 25.6, 28.0, 0.4], ['W10', 28.0, 32.6], ['W11', 32.6, 35.6], ['W12', 35.6, 37.0],
  ['W13', 37.0, 39.6, 0.3], ['W14', 39.6, 42.6], ['W15', 42.6, 47.0],
  ['W16', 47.0, 51.0, 0.6], ['W17', 51.0, 55.4], ['W18', 55.4, 62.0],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 62.0;
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function FX(t) {
  let fade = Math.max(1 - t / 0.2, 0, Math.min(1, (t - 61.2) / 0.8));
  let flash = pulse(t, 0.55, 0.08) * 0.35, col = 0xd8fff8;
  flash = Math.max(flash, pulse(t, 22.65, 0.07) * 0.6);                       // fireball impact
  if (t > 32.9 && t < 33.4) { flash = Math.max(flash, (1 - (t - 33.0) / 0.4) * 0.9); col = 0xe8f4ff; } // lightning
  flash = Math.max(flash, pulse(t, 43.55, 0.06) * 0.45);                      // shield impact
  flash = Math.max(flash, pulse(t, 56.5, 0.12) * 0.6);                        // the final burst
  return { fade, flash: Math.min(1, flash), flashCol: t > 22 && t < 23 ? 0xfff0d0 : col, vign: 0.45 };
}
