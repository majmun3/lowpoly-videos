// Worlds for WHAT IF YOU WERE BORN AS A DRAGON? — cavern, volcano, peaks, hunters, castle, battlefield, burning past.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose } from '/the-last-ember/render/src/characters.js';
import { sky, terrain, ruinsField } from '/the-last-ember/render/src/world.js';
import { T2, mountains, ridged, streetHouse } from '/the-silent-kingdom/render/src/kingdom.js';
import { fortress } from '/the-forgotten-armory/render/src/fortress.js';

const cache = {};
export function TE(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  lava: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 801, [16, 8, 4]), cr = fbm(w, h, 803, [8, 4]); pixels(x, w, h, (i, j) => { const v = n(i, j); const crust = Math.abs(cr(i, j) - 0.5) < 0.06; if (crust) return [40, 18, 12]; return [C(200 + v * 55), C(60 + v * 120), C(10 + v * 40)]; }); }, { mip: true }),
  basalt: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 805, [32, 16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.18 + (n(i, j) - 0.5) * 0.2; return [C(v * 200), C(v * 185), C(v * 180)]; }); }, { mip: true }),
  banner: () => mk(48, 96, (x, w, h) => { // a war banner: the horned dragon of the burned world
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const cx = 24, cy = 40;
    g.beginPath(); g.moveTo(cx, cy + 16); g.lineTo(cx + 7, cy + 2); g.lineTo(cx + 9, cy - 8); g.lineTo(cx + 4, cy - 12); g.lineTo(cx - 4, cy - 12); g.lineTo(cx - 9, cy - 8); g.lineTo(cx - 7, cy + 2); g.closePath(); g.fill(); // head
    g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 5, cy - 11); g.quadraticCurveTo(cx + s * 19, cy - 18, cx + s * 15, cy - 32); g.stroke(); } // lyre horns
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx + s * 8, cy - 2 + k * 4); g.lineTo(cx + s * (15 + k), cy + 1 + k * 5); g.lineTo(cx + s * 8, cy + 2 + k * 4); g.fill(); }
    const m = g.getImageData(0, 0, w, h).data, n = fbm(w, h, 807, [16, 8]), r = rng(809);
    const tear = Array.from({ length: w }, () => h - 1 - Math.floor(r() * 10));
    pixels(x, w, h, (i, j) => { if (j > tear[i]) return [0, 0, 0, 0]; const v = 0.75 + (n(i, j) - 0.5) * 0.25; if (i < 3 || i > w - 4 || j < 3) return [C(120 * v), C(20 * v), C(18 * v), 255]; if (m[(j * w + i) * 4] > 128) return [C(20), C(16), C(16), 255]; return [C(200 * v), C(186 * v), C(160 * v), 255]; });
  }),
  cloth: () => mk(16, 16, (x, w, h) => { const r = rng(811); pixels(x, w, h, () => { const v = 0.4 + r() * 0.1; return [C(v * 200), C(v * 170), C(v * 140)]; }); }),
};

// ---------------------------------------------------------------- the lava cavern beneath the volcano
export function cavern(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 3);
  const rock = mat({ map: TE('basalt'), color: 0xb0a8a4, side: THREE.BackSide });
  const dome = new THREE.SphereGeometry(40, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const dp = dome.attributes.position; for (let i = 0; i < dp.count; i++) { const k = 1 + (R() - 0.5) * 0.18; dp.setXYZ(i, dp.getX(i) * k, dp.getY(i) * k * 0.7, dp.getZ(i) * k); }
  const du = dome.attributes.uv; for (let i = 0; i < du.count; i++) du.setXY(i, du.getX(i) * 12, du.getY(i) * 5);
  mesh(flat(dome), rock, g);
  const hn = (x, z) => Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.6 + Math.sin(x * 0.11 + z * 0.17) * 1.2;
  const floor = terrain(90, 40, (x, z) => hn(x, z) - (Math.hypot(x - 8, z + 6) < 9 ? 1.5 : 0), { map: TE('basalt'), color: 0xc0b0a8 }); g.add(floor);
  // lava pools and rivers
  const lavaM = mat({ map: TE('lava'), color: 0xffffff, emissive: 0x8a3a10, unlit: true, repeat: [4, 4] });
  const pools = [[8, -6, 7.5], [-14, 10, 5], [16, 14, 4], [-6, -22, 6]];
  for (const [x, z, r] of pools) mesh(new THREE.CircleGeometry(r, 10), lavaM, g, [x, -0.6, z], [-Math.PI / 2, 0, 0]);
  mesh(new THREE.PlaneGeometry(3, 40, 1, 8), lavaM, g, [-3, -0.4, 4], [-Math.PI / 2, 0, 0.6]);
  // stalagmites, boulders and hanging spires
  const rocks = [];
  const clear = o.clear || 4;
  for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, d = 6 + R() * 30; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x, z) < clear) continue; const h = 1 + R() * 6; rocks.push(xf(prism(5, 0.4 + R() * 1.2, 0.05, h), { p: [x, hn(x, z) - 0.3, z], r: [(R() - 0.5) * 0.2, R() * 3, (R() - 0.5) * 0.2] })); }
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, d = Math.max(clear, 4 + R() * 30); rocks.push(xf(flat(new THREE.DodecahedronGeometry(0.6 + R() * 1.8, 0)), { p: [Math.cos(a) * d, hn(Math.cos(a) * d, Math.sin(a) * d), Math.sin(a) * d], r: [R() * 3, R() * 3, 0], s: [1, 0.6, 1] })); }
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, d = 4 + R() * 26; rocks.push(xf(prism(5, 0.3 + R() * 0.8, 0.02, 3 + R() * 6, 'top'), { p: [Math.cos(a) * d, 24 - d * 0.35, Math.sin(a) * d], r: [Math.PI, 0, 0] })); }
  mesh(merge(rocks), mat({ map: TE('basalt'), color: 0xa89c98 }), g);
  // the nest: a ring of black stones and ash
  const nest = []; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; nest.push(xf(flat(new THREE.DodecahedronGeometry(0.18 + R() * 0.12, 0)), { p: [Math.cos(a) * 0.55, hn(0, 0) + 0.05, Math.sin(a) * 0.55], s: [1, 0.6, 1] })); }
  mesh(merge(nest), mat({ map: TE('basalt'), color: 0x8a8080 }), g);
  g.add(particles({ mode: 'drift', count: 400, box: v3(50, 26, 50), vel: v3(0.1, 1.0, 0.05), size: 0.06, c0: 0xffa040, origin: v3(0, 10, 0), swirl: 1.2, seed: 811, opacity: 0.9, fogMix: 0.2 }));
  for (const [x, z, r] of pools) { const gl = glow(0xff6a20, r * 3, 0.35); gl.position.set(x, 1.2, z); g.add(gl); }
  g.userData = { pools, ground: hn, lavaM };
  return g;
}
export const CAVE_ENV = { fog: [4, 90], fogCol: 0x3a180c, hfog: [0, 1, 0, 0], lightDir: v3(0.2, 1, 0.3), lightCol: 0x9a4418, ambient: 0x4a2c20, rim: 0xff7a30, fillDir: v3(0.25, -0.9, 0.3), fillCol: 0x4a2a1c };

// ---------------------------------------------------------------- the volcano and the world outside
export function volcanoWorld(o = {}) {
  const g = new THREE.Group();
  const rd = ridged(o.seed || 41);
  const VC = o.volcano || v3(0, 0, -500);
  const hf = (x, z) => { const dv = Math.hypot(x - VC.x, z - VC.z); const cone = Math.max(0, 260 - dv * 0.95) * (dv < 40 ? 0.86 + 0.14 * dv / 40 : 1); const crater = dv < 40 ? -(40 - dv) * 1.2 : 0; const plain = clamp((Math.abs(x) - 160) / 140) * 0.9 + clamp((z - 320) / 120) + 0.1; return Math.max((rd(x, z) * 90 - 50) * Math.min(1, plain) - 12 * (1 - Math.min(1, plain)), cone + crater - 20); };
  g.add(mountains(3000, 200, hf, { tile: 30, cx: o.cx ?? 0, cz: o.cz ?? 0, color: o.groundColor ?? 0x8a7a74 }));
  const crater = mesh(new THREE.CircleGeometry(34, 12), mat({ map: TE('lava'), emissive: 0x9a4010, unlit: true, repeat: [3, 3], fogScale: 0.3 }), g, [VC.x, hf(VC.x, VC.z) + 4, VC.z], [-Math.PI / 2, 0, 0]);
  const cg = glow(0xff5a18, 260, 0.7); cg.position.set(VC.x, hf(VC.x, VC.z) + 40, VC.z); g.add(cg);
  // lava streams down the slopes
  const lav = []; const R = rng(43);
  for (let s = 0; s < 6; s++) { let a = R() * Math.PI * 2, d = 30; for (let k = 0; k < 26; k++) { const x = VC.x + Math.cos(a) * d, z = VC.z + Math.sin(a) * d; lav.push(xf(box(4 + k * 0.1, 0.6, 9, 'bottom'), { p: [x, hf(x, z) + 0.4, z], r: [0, -a + Math.PI / 2, 0] })); d += 8; a += (R() - 0.5) * 0.15; } }
  mesh(merge(lav), mat({ color: 0xff7a20, emissive: 0x8a2a08, unlit: true, fogScale: 0.4 }), g);
  const smoke = particles({ mode: 'drift', count: 260, box: v3(140, 300, 140), vel: v3(4, 9, 1), size: 9, c0: 0x4a3a38, origin: v3(VC.x, hf(VC.x, VC.z) + 160, VC.z), additive: false, opacity: 0.35, swirl: 6, seed: 45, fogMix: 0.4 });
  g.add(smoke);
  g.userData = { hf, VC, crater, craterGlow: cg, craterY: hf(VC.x, VC.z) + 4 };
  return g;
}

// ---------------------------------------------------------------- people
export function humanMaterials() {
  return { leather: mat({ map: T('leather'), color: 0x9a8070, rim: 1 }), mail: mat({ map: T('iron'), color: 0x9a9aa4, rim: 1 }), skin: mat({ color: 0xc09080, rim: 1 }),
    wood: mat({ map: T('wood'), color: 0x8a7060 }), iron: mat({ map: T('iron'), rim: 1 }), cloth: mat({ map: TE('cloth'), rim: 1 }), torch: mat({ color: 0xffb040, emissive: 0xff8020, unlit: true }) };
}
export function buildHunter(M, o = {}) {
  const d = { hip: 0.95, spineOff: 0.06, abd: 0.17, chestH: 0.27, neckH: 0.07, shW: 0.2, upper: 0.3, fore: 0.27, thigh: 0.45, shin: 0.44, hipW: 0.09 };
  const j = rig(d);
  mesh(taper(0.3, 0.2, 0.28, 0.19, 0.16, { anchor: 'center' }), M.leather, j.pelvis);
  mesh(taper(0.36, 0.22, 0.32, 0.2, 0.42, { anchor: 'top' }), M.cloth, j.pelvis, [0, 0.05, 0]);
  mesh(taper(0.3, 0.2, 0.36, 0.22, 0.18), M.mail, j.spine); mesh(taper(0.36, 0.22, 0.42, 0.24, 0.27), M.leather, j.chest);
  mesh(box(0.15, 0.18, 0.17, 'bottom'), M.skin, j.head, [0, 0, 0.01]);
  mesh(prism(8, 0.21, 0.19, 0.02), M.iron, j.head, [0, 0.15, 0]); mesh(prism(8, 0.1, 0.06, 0.08), M.iron, j.head, [0, 0.16, 0]);
  for (const s of ['L', 'R']) {
    mesh(taper(0.09, 0.09, 0.1, 0.1, d.upper, { anchor: 'top' }), M.leather, j['arm' + s]); mesh(taper(0.07, 0.07, 0.09, 0.09, d.fore, { anchor: 'top' }), M.leather, j['fore' + s]);
    mesh(box(0.07, 0.09, 0.08, 'top'), M.skin, j['hand' + s]);
    mesh(taper(0.1, 0.11, 0.12, 0.12, d.thigh, { anchor: 'top' }), M.cloth, j['thigh' + s]); mesh(taper(0.08, 0.09, 0.1, 0.11, d.shin, { anchor: 'top' }), M.leather, j['shin' + s]);
    mesh(box(0.09, 0.06, 0.2, 'top'), M.leather, j['foot' + s], [0, 0, 0.04]);
  }
  const sp = group(j.handR, [0, -0.06, 0], [Math.PI / 2, 0, 0]);
  if (o.torch) { mesh(prism(5, 0.025, 0.03, 0.6, 'center'), M.wood, sp, [0, 0.1, 0]); mesh(prism(6, 0.05, 0.04, 0.1), M.torch, sp, [0, 0.4, 0]); j.torchTip = group(sp, [0, 0.5, 0]); }
  else { mesh(prism(4, 0.02, 0.02, 2.2, 'center'), M.wood, sp, [0, 0.4, 0]); mesh(taper(0.06, 0.01, 0.0, 0.01, 0.25), M.iron, sp, [0, 1.5, 0]); }
  j.M = M; applyPose(j, {}); return j;
}
// a merged, instanced soldier for whole armies
export function armyGeo() {
  return merge([taper(0.34, 0.24, 0.3, 0.22, 0.7, {}), xf(taper(0.3, 0.2, 0.36, 0.22, 0.55, {}), { p: [0, 0.7, 0] }), xf(box(0.16, 0.2, 0.17, 'bottom'), { p: [0, 1.25, 0] }), xf(prism(8, 0.13, 0.09, 0.12), { p: [0, 1.42, 0] }), xf(box(0.04, 3.0, 0.04, 'bottom'), { p: [0.24, 0.2, 0.1] }), xf(taper(0.08, 0.01, 0.0, 0.01, 0.3), { p: [0.24, 3.2, 0.1] })]);
}
export function army(positions, colors, o = {}) {
  const geo = armyGeo(); const m = mat({ map: T('iron'), color: 0xffffff, rim: 1 });
  const im = new THREE.InstancedMesh(geo, m, positions.length);
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), R = rng(o.seed || 5);
  positions.forEach((p, i) => { q.setFromEuler(new THREE.Euler(0, (o.yaw ?? 0) + (R() - 0.5) * 0.3, 0)); M4.compose(p, q, v3(1, 0.9 + R() * 0.2, 1)); im.setMatrixAt(i, M4); im.setColorAt(i, new THREE.Color(colors[i])); });
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false;
  return im;
}
export function bannerPole(color, o = {}) {
  const g = new THREE.Group(); const wood = mat({ map: T('wood') });
  mesh(prism(5, 0.06, 0.05, o.h ?? 6), wood, g);
  const flag = mesh(new THREE.PlaneGeometry(1.4, 2.4, 4, 6), mat({ map: TE('banner'), color, alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }), g, [0.75, (o.h ?? 6) - 1.3, 0]);
  g.userData.flag = flag; g.userData.p0 = Float32Array.from(flag.geometry.attributes.position.array);
  return g;
}
export function waveFlag(b, t, amp = 0.25) {
  const f = b.userData.flag, p = f.geometry.attributes.position, p0 = b.userData.p0;
  for (let i = 0; i < p.count; i++) { const x = p0[i * 3] + 0.7; p.setZ(i, Math.sin(t * 4 + x * 3 + p0[i * 3 + 1]) * amp * x); }
  p.needsUpdate = true; f.geometry.computeVertexNormals();
}
export function palisadeCamp(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 61); const parts = [], tents = [];
  for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.12) continue; parts.push(xf(prism(5, 0.25, 0.12, 3.2 + R() * 0.8), { p: [Math.cos(a) * 18, -0.2, Math.sin(a) * 18] })); }
  for (const [x, z] of [[-14, -10], [14, -10], [11, 13]]) { parts.push(xf(box(0.3, 7, 0.3, 'bottom'), { p: [x - 1.4, 0, z - 1.4] }), xf(box(0.3, 7, 0.3, 'bottom'), { p: [x + 1.4, 0, z - 1.4] }), xf(box(0.3, 7, 0.3, 'bottom'), { p: [x - 1.4, 0, z + 1.4] }), xf(box(0.3, 7, 0.3, 'bottom'), { p: [x + 1.4, 0, z + 1.4] }), xf(box(3.6, 0.3, 3.6, 'bottom'), { p: [x, 6, z] }), xf(prism(4, 2.8, 0.1, 2.2), { p: [x, 7.5, z], r: [0, Math.PI / 4, 0] })); }
  for (let k = 0; k < 9; k++) { const a = R() * Math.PI * 2, d = 4 + R() * 10; tents.push(xf(prism(4, 1.6, 0.05, 2.4), { p: [Math.cos(a) * d, 0, Math.sin(a) * d], r: [0, R() * 3, 0] })); }
  mesh(merge(parts), mat({ map: T('wood'), color: 0x8a7464 }), g); mesh(merge(tents), mat({ map: TE('cloth'), color: 0xa89878 }), g);
  return g;
}
export { fortress, sky, terrain, ruinsField, mountains, ridged, streetHouse, T2 };
