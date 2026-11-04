// Worlds for the spell lesson: a sunlit training ground among ruins with a wizard tower, and a hill above a kingdom.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky, ruinsField, archGeo } from '/the-last-ember/render/src/world.js';
import { SKY, ENV, rolling, ground, forestTrees, grassTufts, bushes, sunShafts, overgrownRuins, TW } from '/born-as-a-goblin/render/src/gworld.js';
import { city } from '/the-silent-kingdom/render/src/kingdom.js';

const cache = {};
function TS(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  target: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1301, [8, 4]); pixels(x, w, h, (i, j) => { const r = Math.hypot(i - 15.5, j - 15.5); const v = 0.55 + (n(i, j) - 0.5) * 0.3; const ring = Math.floor(r / 3.2); if (r < 15) return ring % 2 ? [C(v * 200), C(v * 190), C(v * 170)] : [C(v * 175), C(v * 45), C(v * 35)]; return [C(v * 170), C(v * 165), C(v * 155)]; }); }),
  standing: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 1303, [16, 8, 4]), m = fbm(w, h, 1305, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.5 + (n(i, j) - 0.5) * 0.3; if (m(i, j) > 0.6 - (j / h) * 0.2) return [C(v * 110), C(v * 160), C(v * 72)]; return [C(v * 180), C(v * 176), C(v * 166)]; }); }),
  standingE: () => mk(32, 64, (x, w, h) => { pixels(x, w, h, (i, j) => { const cx = i - 15.5; if (j > 14 && j < 50 && Math.abs(cx) < 6) { const gy = Math.floor((j - 15) / 7), gx = (j - 15) % 7; const on = (gx === 0 && Math.abs(cx) < 4) || (Math.abs(cx) < 0.8 && gy % 2 === 0) || (Math.abs(Math.abs(cx) - (gx * 0.6)) < 0.6 && gy % 2 === 1); if (on) return [80, 255, 230]; } return [0, 0, 0]; }); }),
};
export const SUN = v3(-0.45, 0.6, -0.65).normalize();
// the training ground: wizard at the origin facing -z; a fireball target, a lightning stone, the forest edge
export function trainingGround(o = {}) {
  const scene = new THREE.Scene();
  const sk = sky({ ...SKY.forest, horizon: 0xd8d8c0, sunDir: o.sunDir || SUN, cloudScale: 0.35, cover: 0.48 }); scene.add(sk);
  const hf = (x, z) => rolling(0.9, 0.03, 2)(x, z) * clamp((Math.hypot(x, z * 0.7) - 14) / 22);
  ground(scene, hf, { size: 170, seg: 110 });
  const open = (x, z) => (Math.abs(x) < 16 && z > -48 && z < 14) || Math.hypot(x, z) < 16;
  const trees = forestTrees({ seed: 9, count: 190, area: [-110, 110, -140, 80], ground: hf, avoid: open, height: [18, 30], trunkR: [0.7, 1.5] }); scene.add(trees);
  scene.add(grassTufts({ count: 2600, area: [-30, 30, -50, 20], ground: hf, avoid: (x, z) => Math.hypot(x, z) < 3.2 }));
  scene.add(bushes({ seed: 4, count: 30, area: [-30, 30, -55, 20], ground: hf, avoid: open }));
  scene.add(sunShafts({ count: o.shafts ?? 14, area: [-16, 16, -40, 10], height: 30, opacity: o.shaftOpacity ?? 0.07 }));
  const moss = mat({ map: TW('moss') });
  scene.add(ruinsField({ seed: 33, count: 26, center: [0, 0, -15], rMin: 18, rMax: 70, ground: hf, avoid: (x, z) => Math.abs(x) < 14 && z > -50 && z < 14, hScale: 0.7, mat: moss }));
  mesh(merge([xf(archGeo(9, 1.6, 2.2, 8), { p: [-13, 7, -34], r: [0, 0.5, 0] }), xf(box(1.6, 7, 2.2, 'bottom'), { p: [-7.6, 0, -36.9], r: [0, 0.5, 0] }), xf(box(1.6, 7, 2.2, 'bottom'), { p: [-18.4, 0, -31.1], r: [0, 0.5, 0] })]), moss, scene);
  // a ring of rune-carved standing stones around the wizard
  const stoneM = mat({ map: TS('standing'), emap: TS('standingE'), emissive: 0x000000, rim: 1 });
  const stones = []; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + 0.17; if (Math.abs(Math.sin(a)) > 0.9 && Math.sin(a) < 0) continue; const h = 2.6 + (k % 3) * 0.6; stones.push(xf(taper(0.9, 0.5, 0.65, 0.4, h), { p: [Math.cos(a) * 7.5, -0.2, Math.sin(a) * 7.5], r: [0, -a + Math.PI / 2, (k % 2 ? 0.05 : -0.04)] })); }
  mesh(merge(stones), stoneM, scene);
  // the fireball target: a carved stone pillar with a painted target
  const tgt = new THREE.Group(); tgt.position.set(-2.5, hf(-2.5, -26), -26); scene.add(tgt);
  const tm = mat({ map: TS('standing'), rim: 1 }), tf = mat({ map: TS('target'), rim: 0.5 });
  const pieces = [];
  for (let k = 0; k < 4; k++) pieces.push(mesh(box(1.4 - k * 0.08, 0.7, 1.0, 'bottom'), tm, tgt, [0, k * 0.7, 0], [0, k * 0.15, 0]));
  const face = mesh(new THREE.CircleGeometry(0.62, 10), tf, tgt, [0, 1.85, 0.52]); pieces.push(face);
  mesh(box(2.0, 0.3, 1.6, 'bottom'), tm, tgt, [0, -0.1, 0]);
  // the lightning stone: a lone tall menhir
  const menhir = mesh(taper(1.3, 0.9, 0.7, 0.5, 4.2), stoneM, scene, [5.5, hf(5.5, -19) - 0.2, -19], [0, 0.4, 0.06]);
  // the wizard tower beyond the ruins, glowing windows
  const tw = new THREE.Group(); tw.position.set(24, hf(24, -58), -58); scene.add(tw);
  const twm = mat({ map: T('stone'), color: 0xc8c0b8 });
  mesh(merge([prism(10, 4.2, 3.6, 30), xf(prism(10, 5.0, 5.0, 1.2), { p: [0, 30, 0] }), xf(prism(10, 3.4, 3.2, 8), { p: [0, 31.2, 0] }), xf(prism(12, 2.2, 2.0, 6), { p: [-3.5, 0, 2.5] })]), twm, tw);
  mesh(merge([xf(prism(10, 4.4, 0.2, 14), { p: [0, 39.2, 0] }), xf(prism(12, 2.6, 0.1, 5), { p: [-3.5, 6, 2.5] })]), mat({ map: T('roof'), color: 0x6a70b0 }), tw);
  const wins = []; for (let k = 0; k < 7; k++) { const a = k * 0.9; wins.push(xf(box(0.7, 1.6, 0.2, 'bottom'), { p: [Math.cos(a) * 3.9, 6 + k * 3.6, Math.sin(a) * 3.9], r: [0, -a + Math.PI / 2, 0] })); }
  mesh(merge(wins), mat({ color: 0x80fff0, emissive: 0x206060, unlit: true, fogScale: 0.5 }), tw);
  scene.add(particles({ mode: 'drift', count: 160, box: v3(10, 12, 10), vel: v3(0, 0.6, 0), size: 0.18, c0: 0x80fff0, origin: v3(24, 42, -58), swirl: 1.4, seed: 1309, opacity: 0.9, fogMix: 0.3 }));
  return { scene, sk, hf, tgt, pieces, menhir, stoneM, trees };
}
export const LESSON_ENV = { ...ENV.forest, fog: [10, 260], fogCol: 0xc4c8b4, ambient: 0x5a6458, lightCol: 0xfff0d0 };

// the final hill above a kingdom at golden hour
export function kingdomHill(o = {}) {
  const scene = new THREE.Scene();
  const sunDir = v3(0.25, 0.22, -1).normalize();
  const sk = sky({ ...SKY.sunset, horizon: 0xffc080, top: 0x5a6aa0, sunDir, cover: 0.42, swirl: o.swirl ?? 0 }); scene.add(sk);
  const sunG = glow(0xffe0a0, 70, 0.7); sunG.position.copy(sunDir.clone().multiplyScalar(2600)); scene.add(sunG);
  const hf = (x, z) => 26 * Math.exp(-(x * x + z * z) / 1400) - 48 * clamp((-50 - z) / 160) + rolling(1.5, 0.012, 4)(x, z) * clamp((Math.hypot(x, z) - 10) / 30);
  ground(scene, hf, { size: 320, seg: 140, color: 0xe8e0b8 });
  scene.add(grassTufts({ count: 1400, area: [-14, 14, -16, 12], ground: hf, tints: [0xffffff, 0xf0e0a0] }));
  scene.add(forestTrees({ seed: 71, count: 220, area: [-700, 700, -700, 300], ground: hf, avoid: (x, z) => Math.hypot(x, z) < 30 || (Math.abs(x) < 300 && z < -220 && z > -620), height: [16, 26] }));
  const ct = city({ towers: 70, houses: 260, wallR: 150, fogScale: 0.7, lightSize: 1.1, seed: 41 }); ct.position.set(0, hf(0, -420) - 2, -420); scene.add(ct);
  return { scene, sk, hf, city: ct, top: hf(0, 0), sunDir };
}
export const HILL_ENV = { ...ENV.sunset, fog: [30, 1100], fogCol: 0xd8a888, lightDir: v3(-0.25, -0.35, 1.0), lightCol: 0xffd0a0, ambient: 0x5a5058, rim: 0xffc080 };
