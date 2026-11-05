// Master timeline for the DARK FANTASY CINEMATIC (30 s, silent, no text).
import { SHOTS_DFC as S } from './shots.js';
export const TIMELINE = [
  ['F01', 0.0, 4.0], ['P02', 4.0, 8.0, 0.5], ['K03', 8.0, 12.0, 0.5], ['C04', 12.0, 16.0, 0.6],
  ['L05', 16.0, 20.0, 0.5], ['T06', 20.0, 24.0, 0.6], ['A07', 24.0, 27.0, 0.5], ['P08', 27.0, 30.0, 0.6],
];
export const SHOTS = TIMELINE.filter(([id]) => S[id]).map(([id, start, end, dissolve]) => ({ id, start, end, dissolve, build: S[id] }));
export const DURATION = 30.0;
export function FX(t) { return { fade: 0, flash: 0, flashCol: 0xffffff, vign: 0.42 }; }
