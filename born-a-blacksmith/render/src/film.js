// Master timeline for BEING BORN AS A BLACKSMITH IN MEDIEVAL TIMES WAS HORRIFYING (62 s)
import { SHOTS_SMITH as S } from './shots.js';
export const TIMELINE = [
  ['B01', 0.0, 1.4], ['B02', 1.4, 3.2], ['B03', 3.2, 4.8], ['B04', 4.8, 6.6],
  ['B05', 6.6, 9.2, 0.3], ['B06', 9.2, 10.8], ['B07', 10.8, 13.6],
  ['B08', 13.6, 16.0, 0.3], ['B09', 16.0, 18.4], ['B10', 18.4, 20.8],
  ['B11', 20.8, 23.2, 0.4], ['B12', 23.2, 25.4], ['B13', 25.4, 28.8],
  ['B14', 28.8, 31.2, 0.3], ['B15', 31.2, 33.6], ['B16', 33.6, 35.6], ['B17', 35.6, 37.6],
  ['B18', 37.6, 40.4, 0.5], ['B19', 40.4, 43.6], ['B20', 43.6, 45.6],
  ['B21', 45.6, 48.6, 0.6], ['B22', 48.6, 51.6], ['B23', 51.6, 52.9, 0.3],
  ['B24', 52.9, 56.6, 0.5], ['B25', 56.6, 59.0, 0.8], ['B26', 59.0, 62.0],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 62.0;
export function FX(t) {
  const fade = Math.max(1 - t / 0.08, 0, Math.min(1, (t - 61.3) / 0.7));
  return { fade, flash: 0, flashCol: 0xffffff, vign: 0.32 };
}
