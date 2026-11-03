// Worlds for WHAT IF YOU WERE BORN AS A GOBLIN? — bright dark-fantasy: sunlit forests, meadows, overgrown ruins,
// the tribe's settlement, seasons, the human kingdom at sunset.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky, terrain, ruinsField, archGeo } from '/the-last-ember/render/src/world.js';
import { T2 } from '/the-silent-kingdom/render/src/kingdom.js';
import { fortress } from '/the-forgotten-armory/render/src/fortress.js';
import { TG } from './goblin.js';

const cache = {};
export function TW(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  grass: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1001, [32, 16, 8, 4]), r = rng(1001); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.35; if (r() < 0.06) v += 0.12; if (r() < 0.04) v -= 0.12; if (r() < 0.006) return [230, 220, 140]; return [C(v * 122), C(v * 150), C(v * 74)]; }); }, { mip: true }),
  dirt: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1003, [32, 16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.48 + (n(i, j) - 0.5) * 0.35; return [C(v * 175), C(v * 140), C(v * 100)]; }); }, { mip: true }),
  leaves: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1005, [8, 4, 2]), r = rng(1005); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.45; if (r() < 0.08) v += 0.2; if ((i + j * 3) % 7 === 0) v -= 0.12; return [C(v * 128), C(v * 162), C(v * 84)]; }); }, { mip: true }),
  barkW: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1007, [8, 4, 2]); pixels(x, w, h, (i, j) => { let v = 0.4 + (n(i, j) - 0.5) * 0.3; if (i % 4 === 0) v -= 0.1; return [C(v * 190), C(v * 150), C(v * 110)]; }); }),
  hide: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1009, [16, 8, 4]); pixels(x, w, h, (i, j) => { let v = 0.55 + (n(i, j) - 0.5) * 0.3; if (i % 16 === 0 || j % 12 === 0) v -= 0.18; if ((i % 16 === 1 || i % 16 === 15) && j % 3 === 0) v -= 0.25; return [C(v * 210), C(v * 170), C(v * 120)]; }); }),
  moss: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1011, [16, 8, 4]), m = fbm(w, h, 1013, [32, 16, 8]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 16), off = row % 2 ? 16 : 0, bx = (i + off) % 32, by = j % 16; let v = 0.5 + (n(i, j) - 0.5) * 0.3; if (bx < 1 || by < 1) v = 0.25; if (m(i, j) > 0.55 - (j / h) * 0.15) return [C(v * 110), C(v * 160), C(v * 70)]; return [C(v * 185), C(v * 180), C(v * 170)]; }); }, { mip: true }),
  gbanner: () => mk(48, 96, (x, w, h) => { // the goblin king's banner: a crown above a notched ear
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff';
    const cx = 24; g.beginPath(); g.moveTo(cx - 13, 30); g.lineTo(cx - 13, 18); g.lineTo(cx - 7, 24); g.lineTo(cx, 12); g.lineTo(cx + 7, 24); g.lineTo(cx + 13, 18); g.lineTo(cx + 13, 30); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - 6, 64); g.lineTo(cx + 16, 40); g.lineTo(cx + 9, 44); g.lineTo(cx + 6, 49); g.lineTo(cx + 4, 46); g.lineTo(cx - 6, 52); g.closePath(); g.fill();
    const m = g.getImageData(0, 0, w, h).data, n = fbm(w, h, 1015, [16, 8]), r = rng(1017); const tear = Array.from({ length: w }, () => h - 1 - Math.floor(r() * 12));
    pixels(x, w, h, (i, j) => { if (j > tear[i]) return [0, 0, 0, 0]; const v = 0.7 + (n(i, j) - 0.5) * 0.3; if (m[(j * w + i) * 4] > 128) return [C(30), C(26), C(20), 255]; if (i < 3 || i > w - 4) return [C(v * 220), C(v * 175), C(v * 70), 255]; return [C(v * 175), C(v * 30), C(v * 30), 255]; });
  }),
};

// ---------------------------------------------------------------- skies and light (brighter dark fantasy)
export const SKY = {
  day: { horizon: 0xc8d4c8, top: 0x4a7aa8, bottom: 0x6a7a5a, cloud: 0xa8b0b8, cloudLit: 0xfff4dc, sunCol: 0xffe8b0, cover: 0.5 },
  forest: { horizon: 0xc0d0a8, top: 0x6a90a8, bottom: 0x5a6a40, cloud: 0xb0b8b0, cloudLit: 0xfff0c8, sunCol: 0xffe0a0, cover: 0.45 },
  sunset: { horizon: 0xffb070, top: 0x4a5a8a, bottom: 0x6a4a3a, cloud: 0x8a5a58, cloudLit: 0xffd090, sunCol: 0xffb060, cover: 0.48 },
  dusk: { horizon: 0xd88a60, top: 0x2e3858, bottom: 0x3a2a28, cloud: 0x5a3a40, cloudLit: 0xff9a60, sunCol: 0xff8040, cover: 0.45 },
  dawn: { horizon: 0xd8d0c0, top: 0x6a7a98, bottom: 0x7a7a6a, cloud: 0x9aa0a8, cloudLit: 0xffe8d0, sunCol: 0xffe0c0, cover: 0.55 },
  winter: { horizon: 0xdce4ec, top: 0x7a90b0, bottom: 0xb0b8c0, cloud: 0xc8ccd4, cloudLit: 0xffffff, sunCol: 0xfff0e0, cover: 0.6 },
};
export const ENV = {
  forest: { fog: [8, 200], fogCol: 0xbcc0ac, hfog: [1, 6, 0.35, 0.02], lightDir: v3(-0.35, -0.8, -0.45), lightCol: 0xfff0c8, ambient: 0x5a6a50, rim: 0xfff0c0, fillDir: v3(0.4, -0.3, 0.8), fillCol: 0x3a4a3a },
  meadow: { fog: [20, 420], fogCol: 0xc8ccbc, hfog: [2, 10, 0.5, 0.01], lightDir: v3(-0.4, -0.7, -0.5), lightCol: 0xfff0d0, ambient: 0x60705a, rim: 0xfff0d0, fillDir: v3(0.4, -0.3, 0.8), fillCol: 0x404a40 },
  sunset: { fog: [30, 700], fogCol: 0xd8a080, hfog: [2, 10, 0.4, 0.006], lightDir: v3(0.0, -0.32, 1.0), lightCol: 0xffc888, ambient: 0x5a4a50, rim: 0xffb070, fillDir: v3(0.3, -0.4, -0.9), fillCol: 0x3a3048 },
  dusk: { fog: [20, 500], fogCol: 0x8a6050, hfog: [1, 6, 0.4, 0.01], lightDir: v3(0.2, -0.3, 1.0), lightCol: 0xd88a60, ambient: 0x3e3238, rim: 0xff9060, fillDir: v3(0.3, -0.4, -0.9), fillCol: 0x2a2234 },
  winter: { fog: [10, 220], fogCol: 0xd8dee6, hfog: [1, 6, 0.4, 0.02], lightDir: v3(-0.4, -0.6, -0.6), lightCol: 0xf0f0ff, ambient: 0x6a7080, rim: 0xffffff, fillDir: v3(0.4, -0.3, 0.8), fillCol: 0x4a5060 },
  ruins: { fog: [10, 280], fogCol: 0xc0c4b0, hfog: [1, 8, 0.45, 0.015], lightDir: v3(-0.5, -0.7, -0.3), lightCol: 0xfff0c8, ambient: 0x56604c, rim: 0xffe8b0, fillDir: v3(0.4, -0.3, 0.8), fillCol: 0x3a4436 },
};
// fine terrain where characters stand (so placement matches the rendered surface) over a coarse far ground
export function terrainAt(cx, cz, size, seg, hf, o = {}) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setXYZ(i, x, hf(x, z) + (o.dy ?? 0), z); uv.setXY(i, x / 8, z / 8); }
  return mesh(flat(g), mat({ map: o.map || TW('grass'), color: o.color ?? 0xffffff, affine: 0.6 }));
}
export function ground(scene, hf, o = {}) {
  scene.add(terrainAt(o.cx ?? 0, o.cz ?? 0, o.size ?? 240, o.seg ?? 90, hf, o));
  scene.add(terrainAt(o.cx ?? 0, o.cz ?? 0, 3200, 64, hf, { ...o, dy: -0.8 }));
}
export const rolling = (amp = 1.2, f = 0.03, seed = 0) => (x, z) => Math.sin(x * f + seed) * Math.cos(z * f * 0.8 + seed * 1.3) * amp * 2 + Math.sin(x * f * 2.3 + z * f * 1.7) * amp * 0.6;

// ---------------------------------------------------------------- forest
export function forestTrees(o) {
  const R = rng(o.seed || 1), trunks = [], canopy = [], roots = [];
  const H = o.height ?? [16, 30], RR = o.trunkR ?? [0.6, 1.4];
  for (let i = 0; i < o.count; i++) {
    const x = o.area[0] + R() * (o.area[1] - o.area[0]), z = o.area[2] + R() * (o.area[3] - o.area[2]);
    if (o.avoid && o.avoid(x, z)) continue;
    const y = o.ground ? o.ground(x, z) : 0, h = H[0] + R() * (H[1] - H[0]), r = RR[0] + R() * (RR[1] - RR[0]);
    trunks.push(xf(prism(7, r, r * 0.55, h), { p: [x, y - 0.3, z], r: [(R() - 0.5) * 0.06, R() * 3, (R() - 0.5) * 0.06] }));
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + R(); roots.push(xf(prism(4, r * 0.45, 0.02, r * 2.4), { p: [x + Math.cos(a) * r * 0.6, y - 0.2, z + Math.sin(a) * r * 0.6], r: [Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25] })); }
    for (let b = 0; b < 2; b++) { const a = R() * 6.28, by = h * (0.55 + R() * 0.25); trunks.push(xf(prism(5, r * 0.3, r * 0.1, h * 0.35), { p: [x, y + by, z], r: [Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9] })); }
    const nb = 4 + Math.floor(R() * 3);
    for (let k = 0; k < nb; k++) { const a = R() * 6.28, d = R() * r * 4, cr = (3 + R() * 4) * (o.canopyScale ?? 1); const g = flat(new THREE.IcosahedronGeometry(cr, 0)); canopy.push(xf(g, { p: [x + Math.cos(a) * d, y + h - 1 + R() * 5, z + Math.sin(a) * d], r: [R() * 3, R() * 3, R() * 3], s: [1, 0.65 + R() * 0.25, 1] })); }
  }
  const g = new THREE.Group();
  const bark = mat({ map: TW('barkW'), color: o.barkColor ?? 0xffffff, repeat: [1, 3] });
  mesh(merge([...trunks, ...roots]), bark, g);
  const leafMat = mat({ map: TW('leaves'), color: o.leafColor ?? 0xffffff, wrap: 0.85, repeat: [1, 1] });
  const can = mesh(merge(canopy), leafMat, g);
  g.userData = { leafMat, bark, canopy: can };
  return g;
}
export function grassTufts(o) {
  const base = merge([0, 1, 2, 3, 4].map(k => xf(prism(3, 0.04, 0.0, 0.45 + (k % 3) * 0.12), { p: [Math.cos(k * 1.3) * 0.08, 0, Math.sin(k * 1.3) * 0.08], r: [Math.sin(k) * 0.25, 0, Math.cos(k * 2) * 0.25] })));
  const m = mat({ color: o.color ?? 0x62803c, wrap: 0.9, wind: o.wind ?? 0.25, rim: 0.25 });
  const im = new THREE.InstancedMesh(base, m, o.count); const R = rng(o.seed || 3); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  const tints = o.tints || [0xffffff, 0xd8d8a0, 0xb8c088, 0xe0d8a8];
  for (let i = 0; i < o.count; i++) {
    let x, z, tries = 0; do { x = o.area[0] + R() * (o.area[1] - o.area[0]); z = o.area[2] + R() * (o.area[3] - o.area[2]); tries++; } while (o.avoid && o.avoid(x, z) && tries < 8);
    const s = (o.scale ?? 1) * (0.6 + R() * 0.9); q.setFromEuler(new THREE.Euler(0, R() * 6.28, 0)); M4.compose(v3(x, o.ground ? o.ground(x, z) : 0, z), q, v3(s, s * (o.tall ?? 1), s)); im.setMatrixAt(i, M4); im.setColorAt(i, new THREE.Color(tints[Math.floor(R() * tints.length)]));
  }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false;
  return im;
}
export function bushes(o) {
  const R = rng(o.seed || 5), parts = [];
  for (let i = 0; i < o.count; i++) { const x = o.area[0] + R() * (o.area[1] - o.area[0]), z = o.area[2] + R() * (o.area[3] - o.area[2]); if (o.avoid && o.avoid(x, z)) continue; const s = 0.6 + R() * 1.4; for (let k = 0; k < 3; k++) parts.push(xf(flat(new THREE.IcosahedronGeometry(s * (0.6 + R() * 0.4), 0)), { p: [x + (R() - 0.5) * s, (o.ground ? o.ground(x, z) : 0) + s * 0.4, z + (R() - 0.5) * s], s: [1, 0.7, 1] })); }
  return mesh(merge(parts), mat({ map: TW('leaves'), color: o.color ?? 0xd8e8c0, wrap: 0.85 }));
}
export function sunShafts(o) {
  const g = new THREE.Group(); const R = rng(o.seed || 7);
  const m = mat({ color: o.color ?? 0xfff4d8, unlit: true, additive: true, opacity: o.opacity ?? 0.09, side: THREE.DoubleSide, fogScale: 0.3 });
  for (let i = 0; i < o.count; i++) {
    const x = o.area[0] + R() * (o.area[1] - o.area[0]), z = o.area[2] + R() * (o.area[3] - o.area[2]), w = 1 + R() * 3, h = o.height ?? 30;
    const p = mesh(new THREE.PlaneGeometry(w, h), m, g, [x, h / 2 - 1, z]); p.rotation.set(0, R() * 3, o.tilt ?? 0.35); p.rotateY(Math.PI / 2);
  }
  const motes = particles({ mode: 'drift', count: o.motes ?? 300, box: v3(o.area[1] - o.area[0], 10, o.area[3] - o.area[2]), vel: v3(0.05, 0.15, 0.03), size: 0.05, c0: 0xfff0b0, origin: v3((o.area[0] + o.area[1]) / 2, 4, (o.area[2] + o.area[3]) / 2), swirl: 0.8, seed: 9, opacity: 0.9, fogMix: 0.3 });
  g.add(motes); g.userData = { mat: m };
  return g;
}

// ---------------------------------------------------------------- the tribe's settlement
export function settlement(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 11);
  const hide = mat({ map: TW('hide'), color: 0xe0d0b8, wrap: 0.6 }), wood = mat({ map: T('wood'), color: 0xa08868 }), bone = mat({ map: TG('bone') }), stone = mat({ map: T('stone'), color: 0xb0aca4 });
  const huts = [], poles = [], huts3 = [];
  const spots = [];
  for (let i = 0; i < (o.huts ?? 7); i++) { const a = i / (o.huts ?? 7) * Math.PI * 2 + 0.3, d = 6 + R() * 2.5; const x = Math.cos(a) * d, z = Math.sin(a) * d; const r = 1.6 + R() * 0.8, h = 2.6 + R() * 1.0; spots.push([x, z, r, h]);
    huts.push(xf(prism(7, r, 0.15, h), { p: [x, 0, z], r: [0, R() * 3, 0] }));
    for (let k = 0; k < 4; k++) { const b = k / 4 * Math.PI * 2; poles.push(xf(prism(4, 0.05, 0.03, h + 0.9), { p: [x + Math.cos(b) * 0.1, 0, z + Math.sin(b) * 0.1], r: [Math.sin(b) * 0.12, 0, Math.cos(b) * 0.12] })); }
    huts3.push(xf(box(0.7, 1.1, 0.1, 'bottom'), { p: [x - Math.cos(a) * (r * 0.62), 0, z - Math.sin(a) * (r * 0.62)], r: [0, -a + Math.PI / 2, 0] }));
  }
  mesh(merge(huts), hide, g); mesh(merge(poles), wood, g); mesh(merge(huts3), mat({ color: 0x1a1208, unlit: true }), g);
  // fire pit, drying racks, a totem of skulls
  mesh(merge(Array.from({ length: 9 }, (_, k) => xf(flat(new THREE.DodecahedronGeometry(0.22, 0)), { p: [Math.cos(k / 9 * 6.28) * 0.75, 0.05, Math.sin(k / 9 * 6.28) * 0.75] }))), stone, g);
  const racks = []; for (const [x, z, ry] of [[3, -2.2, 0.4], [-2.6, 2.8, 1.2]]) { racks.push(xf(box(0.06, 1.4, 0.06, 'bottom'), { p: [x - 0.8, 0, z], r: [0, ry, 0] }), xf(box(0.06, 1.4, 0.06, 'bottom'), { p: [x + 0.8, 0, z], r: [0, ry, 0] }), xf(box(1.8, 0.05, 0.05, 'bottom'), { p: [x, 1.35, z], r: [0, ry, 0] })); }
  mesh(merge(racks), wood, g);
  mesh(merge([prism(6, 0.18, 0.15, 3.2), xf(box(0.5, 0.08, 0.08), { p: [0, 2.6, 0] })]), wood, g, [1.8, 0, 1.4]);
  for (let k = 0; k < 3; k++) mesh(flat(new THREE.DodecahedronGeometry(0.13, 0)), bone, g, [1.8, 3.25 - k * 0.32, 1.52], [0, 0, 0], [1, 0.85, 1]);
  // stick fence
  const fence = []; for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; if (Math.abs(Math.sin(a)) > 0.95 && Math.cos(a) * 0 === 0 && a > 4) continue; fence.push(xf(prism(4, 0.06, 0.02, 1.2 + R() * 0.5), { p: [Math.cos(a) * 11, 0, Math.sin(a) * 11], r: [(R() - 0.5) * 0.2, 0, (R() - 0.5) * 0.2] })); }
  mesh(merge(fence), wood, g);
  g.userData = { spots, hide };
  return g;
}
export function fireP(o = {}) { return particles({ mode: 'emit', count: o.count ?? 70, origin: o.origin || v3(), spread: o.spread || v3(0.5, 0.15, 0.5), vel: o.vel || v3(0, 2.2, 0), life: o.life ?? 0.9, size: o.size ?? 0.45, c0: 0xffe8a8, c1: 0xff7a18, c2: 0x5a1004, soft: true, seed: o.seed ?? 31, swirl: 1.4, opacity: o.opacity ?? 0.9, fogMix: 0.15 }); }
export function smokeP(o = {}) { return particles({ mode: 'emit', count: o.count ?? 60, origin: o.origin || v3(), spread: o.spread || v3(1, 0.3, 1), vel: o.vel || v3(0.6, 3.5, 0.2), life: o.life ?? 3.0, size: o.size ?? 2.4, c0: 0x3a3430, c1: 0x5a5450, c2: 0x8a8682, soft: true, seed: o.seed ?? 41, swirl: 2.0, opacity: o.opacity ?? 0.45, fogMix: 0.4, additive: false }); }

// ---------------------------------------------------------------- overgrown ruins
export function overgrownRuins(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 21);
  const moss = mat({ map: TW('moss'), color: 0xffffff });
  g.add(ruinsField({ seed: o.seed || 21, count: o.count ?? 40, center: o.center || [0, 0, 0], rMin: o.rMin ?? 12, rMax: o.rMax ?? 60, ground: o.ground, avoid: o.avoid, hScale: o.hScale ?? 0.8, mat: moss }));
  // a great broken arch and columns framing the arena
  const parts = [xf(archGeo(14, 2.2, 3, 9), { p: [0, 11, -14] }), xf(box(2.2, 11, 3, 'bottom'), { p: [-8.1, 0, -14] }), xf(box(2.2, 11, 3, 'bottom'), { p: [8.1, 0, -14] })];
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, h = 3 + R() * 7; parts.push(xf(prism(8, 0.9, 0.85, h), { p: [Math.cos(a) * 13, 0, Math.sin(a) * 13] })); if (R() < 0.5) parts.push(xf(prism(8, 0.9, 0.85, 1.6), { p: [Math.cos(a) * 13 + 1.5, 0.4, Math.sin(a) * 13 + 1], r: [Math.PI / 2, a, 0] })); }
  for (let k = 0; k < 30; k++) { const x = (R() - 0.5) * 24, z = (R() - 0.5) * 24; parts.push(xf(box(1.2 + R(), 0.3, 1.2 + R(), 'bottom'), { p: [x, -0.15, z], r: [0, R() * 3, (R() - 0.5) * 0.2] })); }
  mesh(merge(parts), moss, g);
  // hanging vines
  const vines = []; for (let k = 0; k < 26; k++) { const x = -8 + R() * 16; vines.push(xf(box(0.08, 1 + R() * 4, 0.08, 'top'), { p: [x, 11 + Math.sqrt(Math.max(0, 49 - x * x)) * 0.25, -12.4] })); }
  mesh(merge(vines), mat({ color: 0x5a8a3a, wind: 0.02, wrap: 0.9 }), g);
  return g;
}
export function goblinBanner(o = {}) {
  const g = new THREE.Group(); const wood = mat({ map: T('wood') });
  mesh(prism(5, 0.05, 0.04, o.h ?? 4), wood, g); mesh(box(1.2, 0.05, 0.05), wood, g, [0.4, (o.h ?? 4) - 0.1, 0]);
  for (const s of [-1, 1]) mesh(prism(3, 0.03, 0, 0.3), mat({ map: TG('bone') }), g, [0.4 + s * 0.6, (o.h ?? 4) - 0.1, 0], [0, 0, -s * Math.PI / 2]);
  const flag = mesh(new THREE.PlaneGeometry(1.1, 2.1, 4, 6), mat({ map: TW('gbanner'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }), g, [0.4, (o.h ?? 4) - 1.15, 0]);
  g.userData.flag = flag; g.userData.p0 = Float32Array.from(flag.geometry.attributes.position.array);
  return g;
}
export function waveFlag(b, t, amp = 0.2) { const f = b.userData.flag, p = f.geometry.attributes.position, p0 = b.userData.p0; for (let i = 0; i < p.count; i++) { const y = 1.05 - p0[i * 3 + 1]; p.setZ(i, Math.sin(t * 4 + p0[i * 3] * 3 + y * 2) * amp * y); } p.needsUpdate = true; f.geometry.computeVertexNormals(); }
export { sky, terrain, fortress };
export { T2 } from '/the-silent-kingdom/render/src/kingdom.js';
