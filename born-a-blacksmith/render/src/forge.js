// Environments for BEING BORN AS A BLACKSMITH...: a medieval village on a cold morning, the family's smithy (open to the
// street, stone hearth and chimney, bellows, anvil, quench tub, workbench, racks, grindstone), and the family home.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky } from '/the-last-ember/render/src/world.js';
import { TW, terrainAt, fireP, smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { mountainMesh, pines, homeInterior, HOME_ENV } from '/born-as-a-dwarf/render/src/dworld.js';
import { TS, buildHammer, smithMaterials } from './smith.js';
export { homeInterior, HOME_ENV };

const cache = {};
export function TF(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  flags: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2201, [16, 8, 4]); const r = rng(2201); const pts = Array.from({ length: 18 }, () => [r() * 64, r() * 64, 0.8 + r() * 0.3]); pixels(x, w, h, (i, j) => { let d1 = 99, d2 = 99, id = 0; pts.forEach(([px, py], k) => { const dx = Math.min(Math.abs(i - px), 64 - Math.abs(i - px)), dy = Math.min(Math.abs(j - py), 64 - Math.abs(j - py)); const dd = Math.hypot(dx, dy); if (dd < d1) { d2 = d1; d1 = dd; id = k; } else if (dd < d2) d2 = dd; }); let v = (0.48 + (n(i, j) - 0.5) * 0.18) * pts[id][2]; if (d2 - d1 < 1.6) v = 0.22; return [C(v * 175), C(v * 165), C(v * 150)]; }); }, { mip: true }),
  stoneW: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2203, [16, 8, 4]); const r = rng(2203); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 11), off = (row * 13) % 22, bx = (i + off) % 22, by = j % 11; let v = 0.5 + (n(i, j) - 0.5) * 0.22 + ((row * 7 + Math.floor((i + off) / 22)) % 5) * 0.025; if (bx < 1 || by < 1) v = 0.26; return [C(v * 182), C(v * 174), C(v * 160)]; }); }, { mip: true }),
  soot: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2205, [16, 8, 4]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 11), off = (row * 13) % 22, bx = (i + off) % 22, by = j % 11; let v = 0.34 + (n(i, j) - 0.5) * 0.18 - (j / h) * 0.12; if (bx < 1 || by < 1) v = 0.16; return [C(v * 175), C(v * 162), C(v * 150)]; }); }, { mip: true }),
  plank: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 2207, [8, 4, 2]); pixels(x, w, h, (i, j) => { let v = 0.46 + Math.sin(i * 1.3 + n(i, j) * 7) * 0.06 + (n(i, j) - 0.5) * 0.14; if (i % 16 === 0) v -= 0.16; if ((j * 3 + i) % 37 === 0) v -= 0.12; return [C(v * 200), C(v * 146), C(v * 98)]; }); }, { mip: true }),
  beam: () => mk(16, 64, (x, w, h) => { const n = fbm(w, h, 2209, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.32 + Math.sin(i * 1.9 + n(i, j) * 5) * 0.05 + (n(i, j) - 0.5) * 0.12; return [C(v * 190), C(v * 140), C(v * 100)]; }); }),
  daub: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2211, [16, 8, 4]); pixels(x, w, h, (i, j) => { const beam = i < 5 || i > 58 || j < 5 || j > 58 || Math.abs(i - j) < 3 || (j > 28 && j < 34); if (beam) { const v = 0.3 + (n(i, j) - 0.5) * 0.12; return [C(v * 190), C(v * 140), C(v * 96)]; } const v = 0.78 + (n(i, j) - 0.5) * 0.12; return [C(v * 236), C(v * 224), C(v * 196)]; }); }, { mip: true }),
  thatch: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 2213, [8, 4, 2]); const r = rng(2213); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.25 + (r() - 0.5) * 0.12 + (j % 12 < 1 ? -0.12 : 0); return [C(v * 205), C(v * 172), C(v * 112)]; }); }, { mip: true }),
  shingle: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2215, [8, 4]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 6), off = row % 2 ? 4 : 0; let v = 0.36 + (n(i, j) - 0.5) * 0.14; if ((i + off) % 8 === 0 || j % 6 === 5) v -= 0.12; return [C(v * 180), C(v * 150), C(v * 130)]; }); }, { mip: true }),
  coal: () => mk(32, 32, (x, w, h) => { const r = rng(2217); pixels(x, w, h, () => { const v = 0.1 + r() * 0.12; return [C(v * 200), C(v * 195), C(v * 200)]; }); }),
  embers: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2219, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = n(i, j); if (v < 0.42) return [C(40), C(14), C(10)]; return [C(255), C(100 + v * 140), C(20 + v * 70)]; }); }),
  water: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 2221, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.3 + (n(i, j) - 0.5) * 0.15; return [C(v * 120), C(v * 150), C(v * 160)]; }); }),
  frost: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2223, [32, 16, 8, 4]); const r = rng(2223); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.3; if (r() < 0.05) v += 0.2; return [C(v * 170), C(v * 180), C(v * 160)]; }); }, { mip: true }),
  sign: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2225, [8, 4]); pixels(x, w, h, (i, j) => { const d = Math.hypot(i - 15.5, j - 14); const shoe = d > 7 && d < 11 && j < 22; if (shoe) return [40, 36, 34]; const v = 0.5 + (n(i, j) - 0.5) * 0.15; return [C(v * 200), C(v * 150), C(v * 100)]; }); }),
};
export function materials() {
  return {
    flags: mat({ map: TF('flags'), repeat: [4, 4], affine: 0.2 }), stone: mat({ map: TF('stoneW'), rim: 0.3 }), soot: mat({ map: TF('soot'), rim: 0.3 }), plank: mat({ map: TF('plank'), rim: 0.3 }), beam: mat({ map: TF('beam'), rim: 0.4 }),
    daub: mat({ map: TF('daub'), rim: 0.3 }), thatch: mat({ map: TF('thatch'), rim: 0.6, wrap: 0.6 }), shingle: mat({ map: TF('shingle'), rim: 0.4 }), coal: mat({ map: TF('coal'), rim: 0.8 }), embers: mat({ map: TF('embers'), unlit: true }),
    water: mat({ map: TF('water'), rim: 1 }), iron: mat({ map: TS('iron'), rim: 1 }), steel: mat({ map: TS('steel'), rim: 1 }), wood: mat({ map: T('wood'), color: 0xb89878 }), rope: mat({ color: 0xb09870, rim: 0.6 }),
    leather: mat({ map: TS('apron'), color: 0xb08060, rim: 0.6, side: THREE.DoubleSide }), sign: mat({ map: TF('sign'), side: THREE.DoubleSide }), frost: mat({ map: TF('frost'), repeat: [40, 40], color: 0x7c8478 }),
  };
}
function bucketMesh(B, M, parent) { const out = {}; for (const k in B) if (B[k].length) out[k] = mesh(merge(B[k]), M[k], parent); return out; }
// box with UVs repeating every `tile` metres (keeps texture scale readable on big surfaces)
export function tbox(w, h, d, tile = 2, anchor = 'bottom') { const g = box(w, h, d, anchor); const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); const a = nx > 0.5 ? p.getZ(i) : p.getX(i), b = ny > 0.5 ? p.getZ(i) : p.getY(i); uv.setXY(i, a / tile, b / tile); } return g; }

// ---------------------------------------------------------------- skies and light
export const SKY = {
  morning: { horizon: 0xc8ccd0, top: 0x5a78a0, bottom: 0x8a8a88, cloud: 0xa0a4ac, cloudLit: 0xe8e4e0, sunCol: 0xffe8c8, cover: 0.62, sunDir: v3(0.6, 0.18, -0.6) },
  night: { horizon: 0x2a3448, top: 0x0a0e1a, bottom: 0x14161c, cloud: 0x1a2030, cloudLit: 0x4a5878, sunCol: 0x8aa0c8, cover: 0.55, sunDir: v3(-0.3, 0.5, -0.8) },
};
export const ENV = {
  morning: { fog: [12, 260], fogCol: 0xb4bcc4, hfog: [1, 6, 0.45, 0.02], lightDir: v3(-0.6, -0.4, 0.6), lightCol: 0xf0ece4, ambient: 0x6a7280, rim: 0xd8e0e8, fillDir: v3(0.4, -0.3, -0.8), fillCol: 0x4a5058 },
  forge: { fog: [8, 120], fogCol: 0x3a3230, hfog: [0, 2, 0.25, 0.03], lightDir: v3(-0.3, -0.5, -0.8), lightCol: 0xd8d0c8, ambient: 0x5a5250, rim: 0xffb070, fillDir: v3(0.3, -0.2, 0.9), fillCol: 0x483e3a },
  night: { fog: [8, 90], fogCol: 0x141418, hfog: [0, 2, 0.3, 0.03], lightDir: v3(-0.3, -0.6, -0.7), lightCol: 0x5a6680, ambient: 0x3a3438, rim: 0xff9050, fillDir: v3(0.3, -0.2, 0.9), fillCol: 0x2a2224 },
  cold: { fog: [8, 120], fogCol: 0x8a9098, hfog: [0, 2, 0.3, 0.03], lightDir: v3(-0.4, -0.5, -0.8), lightCol: 0xd8e0e8, ambient: 0x5e646e, rim: 0xb8c4d0, fillDir: v3(0.3, -0.2, 0.9), fillCol: 0x42484e },
};

// ---------------------------------------------------------------- props
export function anvil(M) {
  const g = new THREE.Group();
  mesh(taper(0.5, 0.5, 0.42, 0.42, 0.62, {}), M.wood, g);                                        // the stump
  for (const y of [0.12, 0.5]) mesh(prism(10, 0.29, 0.29, 0.03, 'center', true), M.iron, g, [0, y, 0]);
  const a = group(g, [0, 0.62, 0]); g.userData.body = a;
  mesh(taper(0.3, 0.26, 0.2, 0.15, 0.08), M.iron, a); mesh(taper(0.16, 0.12, 0.13, 0.1, 0.06), M.iron, a, [0, 0.08, 0]);
  mesh(box(0.42, 0.06, 0.15), M.iron, a, [0, 0.17, 0]); mesh(box(0.42, 0.012, 0.15), M.steel, a, [0, 0.206, 0]);
  const horn = new THREE.ConeGeometry(0.07, 0.26, 8); horn.rotateZ(Math.PI / 2); mesh(flat(horn), M.iron, a, [-0.33, 0.17, 0], [0, 0, 0], [1, 0.85, 1]);
  mesh(box(0.08, 0.05, 0.13), M.iron, a, [0.24, 0.165, 0]);
  g.userData.top = v3(0, 0.62 + 0.212, 0);
  return g;
}
export function bellows(M) {
  const g = new THREE.Group(); const L = 1.4;
  const bot = mesh(box(L, 0.05, 0.62, 'bottom'), M.wood, g, [0, 0.55, 0]); for (const [x, z] of [[-0.6, -0.25], [-0.6, 0.25], [0.6, -0.25], [0.6, 0.25]]) mesh(box(0.08, 0.55, 0.08, 'bottom'), M.beam, g, [x, 0, z]);
  mesh(prism(6, 0.06, 0.04, 0.5), M.iron, g, [L / 2 + 0.15, 0.62, 0], [0, 0, -Math.PI / 2]);   // nozzle
  const hinge = group(g, [L / 2, 0.6, 0]); const top = group(hinge); mesh(box(L, 0.05, 0.62, 'bottom'), M.wood, top, [-L / 2, 0, 0]); mesh(prism(6, 0.035, 0.035, 1.4), M.wood, top, [-L - 0.2, 0.03, 0], [0, 0, Math.PI / 2]);   // lever handle out the back
  const skin = mesh(box(L * 0.98, 1, 0.6), M.leather, g, [0, 0.6, 0]);
  g.userData = { hinge, skin, L };
  return g;
}
export function setBellows(b, k) { const a = 0.04 + k * 0.3; const { hinge, skin, L } = b.userData; hinge.rotation.z = -a; skin.scale.set(1, Math.max(0.02, Math.tan(a) * L * 0.5), 1); skin.position.set(-0.05, 0.6 + Math.tan(a) * L * 0.25, 0); }
export function bucket(M, coal = true) { const g = new THREE.Group(); mesh(prism(10, 0.16, 0.19, 0.32, 'bottom', true), M.wood, g); mesh(new THREE.CircleGeometry(0.16, 10), M.wood, g, [0, 0.01, 0], [-Math.PI / 2, 0, 0]); for (const y of [0.06, 0.26]) mesh(prism(10, 0.19 - y * 0.08, 0.19 - y * 0.08, 0.02, 'center', true), M.iron, g, [0, y, 0]); if (coal) mesh(flat(new THREE.IcosahedronGeometry(0.17, 1)), M.coal, g, [0, 0.27, 0], [0, 0, 0], [1, 0.45, 1]); const h = new THREE.TorusGeometry(0.19, 0.01, 4, 12, Math.PI); mesh(h, M.iron, g, [0, 0.32, 0], [0, Math.PI / 2, 0]); return g; }
export function horseshoe(M, bent = 0) { const g = new THREE.TorusGeometry(0.06, 0.012, 4, 10, Math.PI * 1.3); g.rotateZ(-Math.PI * 0.15); const m = mesh(flat(g), M.iron); m.rotation.x = bent; return m; }

// ---------------------------------------------------------------- the smithy (interior coordinates: x −5..5, z −6..2; open front at z = 2)
export function smithy(o = {}) {
  const g = new THREE.Group(), M = materials(); const R = rng(41);
  const B = { stone: [], soot: [], plank: [], beam: [], daub: [], flags: [], shingle: [] };
  B.flags.push(xf(new THREE.PlaneGeometry(10, 8.6).rotateX(-Math.PI / 2), { p: [0, 0.01, -1.9] }));
  B.stone.push(xf(tbox(10.6, 3.4, 0.5, 2), { p: [0, 0, -6.25] }));
  for (const s of [-1, 1]) { B.stone.push(xf(tbox(0.5, 1.0, 8.6, 2), { p: [s * 5.25, 0, -1.9] })); B.daub.push(xf(tbox(0.4, 2.4, 8.6, 2.2), { p: [s * 5.25, 1.0, -1.9] })); }
  // roof: two slopes, ridge along x, with rafters and tie beams visible inside
  const ridgeY = 5.6, eave = 3.4, zf = 2.6, zb = -6.5, zr = -1.95;
  for (const [z0, z1] of [[zf, zr], [zb, zr]]) { const L = Math.hypot(z1 - z0, ridgeY - eave); const a = Math.atan2(ridgeY - eave, z1 - z0); const s = tbox(11.2, 0.14, L, 1.6, 'center'); s.rotateX(-a); s.translate(0, (eave + ridgeY) / 2 + 0.1, (z0 + z1) / 2); B.shingle.push(s);
    for (let x = -4.8; x <= 4.8; x += 1.2) { const r = box(0.12, 0.16, L, 'center'); r.rotateX(-a); r.translate(x, (eave + ridgeY) / 2 - 0.05, (z0 + z1) / 2); B.beam.push(r); } }
  for (const z of [-4.2, -0.4]) B.beam.push(xf(box(10.4, 0.22, 0.22), { p: [0, eave, z] }));
  B.beam.push(xf(box(10.8, 0.24, 0.24), { p: [0, eave, 2.1] })); for (const x of [-5.1, -1.7, 1.7, 5.1]) B.beam.push(xf(box(0.26, eave, 0.26, 'bottom'), { p: [x, 0, 2.1] }));
  for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(zb, eave); tri.lineTo(zf, eave); tri.lineTo(zr, ridgeY); tri.closePath(); const gb = new THREE.ShapeGeometry(tri); gb.rotateY(Math.PI / 2); gb.translate(s * 5.3, 0, 0); const uv = gb.attributes.uv, p = gb.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getZ(i) / 2.2, p.getY(i) / 2.2); B.daub.push(gb); }
  // the forge hearth, hood and chimney (back-left)
  const hx = -2.5, hz = -5.1; B.stone.push(xf(tbox(2.4, 0.86, 1.7, 1.2), { p: [hx, 0, hz] })); B.soot.push(xf(tbox(2.5, 0.12, 1.8, 1.2), { p: [hx, 0.86, hz] }));
  const hood = taper(2.5, 1.7, 1.0, 0.9, 1.5); hood.translate(hx, 2.1, hz - 0.1); B.soot.push(hood); B.soot.push(xf(tbox(1.0, 5.0, 0.9, 1.2), { p: [hx, 3.6, hz - 0.15] }));
  for (const s of [-1, 1]) B.soot.push(xf(tbox(0.3, 1.25, 1.6, 1.2), { p: [hx + s * 1.05, 0.98, hz - 0.05] }));
  const meshes = bucketMesh(B, M, g);
  const firePos = v3(hx, 1.02, hz + 0.1);
  const coals = mesh(flat(new THREE.CircleGeometry(0.62, 10)), M.embers, g, [hx, 0.99, hz + 0.05], [-Math.PI / 2, 0, 0], [1, 0.75, 1]);
  const lumps = []; for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = R() * 0.55; lumps.push(xf(flat(new THREE.IcosahedronGeometry(0.05 + R() * 0.05, 0)), { p: [hx + Math.cos(a) * r, 1.0, hz + 0.05 + Math.sin(a) * r * 0.7], r: [R() * 3, R() * 3, 0] })); }
  const lumpM = mat({ map: TF('embers'), unlit: true }); const lumpMesh = mesh(merge(lumps), lumpM, g);
  const fire = fireP({ origin: firePos, spread: v3(0.4, 0.05, 0.25), vel: v3(0, 1.2, 0), size: 0.32, count: 80, life: 0.55, seed: 301 }); g.add(fire);
  const fglow = glow(0xff8a30, 3.4, 0.55); fglow.position.copy(firePos).add(v3(0, 0.25, 0.3)); g.add(fglow);
  const embers = particles({ mode: 'emit', count: 70, origin: firePos, spread: v3(0.3, 0.05, 0.2), vel: v3(0, 1.6, 0.05), life: 2.2, size: 0.018, c0: 0xffd080, c1: 0xff6010, seed: 302, swirl: 1.2, opacity: 0.9, fogMix: 0.1 }); g.add(embers);
  const smoke = smokeP({ origin: v3(hx, 8.6, hz - 0.15), spread: v3(0.3, 0.2, 0.3), vel: v3(0.6, 1.6, 0.2), size: 1.6, count: 40, life: 5, opacity: 0.4, seed: 303 }); g.add(smoke);
  // bellows (left of the hearth, nozzle into its side)
  const bel = bellows(M); bel.position.set(-4.35, 0, -4.4); bel.rotation.y = 0.15; g.add(bel);
  // anvil, quench tub, coal pile, buckets
  const anv = anvil(M); anv.position.set(0.2, 0, -2.2); anv.rotation.y = 0.0; g.add(anv);
  const tub = group(g, [1.35, 0, -3.0]); mesh(prism(12, 0.36, 0.4, 0.62, 'bottom', true), M.wood, tub); mesh(new THREE.CircleGeometry(0.36, 12), M.water, tub, [0, 0.56, 0], [-Math.PI / 2, 0, 0]); for (const y of [0.1, 0.5]) mesh(prism(12, 0.4 - y * 0.06, 0.4 - y * 0.06, 0.03, 'center', true), M.iron, tub, [0, y, 0]);
  const pile = []; for (let i = 0; i < 50; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * 0.9; pile.push(xf(flat(new THREE.IcosahedronGeometry(0.08 + R() * 0.08, 0)), { p: [-4.1 + Math.cos(a) * r, Math.max(0, 0.5 - r * 0.5) * R() + 0.04, -2.6 + Math.sin(a) * r], r: [R() * 3, R() * 3, 0] })); } mesh(merge(pile), M.coal, g);
  const bk = bucket(M); bk.position.set(-3.3, 0, -1.8); g.add(bk);
  // workbench with tools, a tool rack and horseshoes on the wall
  const bench = group(g, [4.25, 0, -3.2], [0, -Math.PI / 2, 0]); mesh(tbox(2.6, 0.1, 0.9, 1.2, 'center'), M.plank, bench, [0, 0.86, 0]); for (const [x, z] of [[-1.2, -0.38], [1.2, -0.38], [-1.2, 0.38], [1.2, 0.38]]) mesh(box(0.1, 0.86, 0.1, 'bottom'), M.beam, bench, [x, 0, z]);
  const SM = smithMaterials(); for (let i = 0; i < 3; i++) { const hm = buildHammer(SM, { len: 0.32, head: 0.8 }); hm.position.set(-0.8 + i * 0.35, 0.95, 0.05); hm.rotation.set(-Math.PI / 2, 0, 0.3 * i); bench.add(hm); }
  for (let i = 0; i < 4; i++) mesh(box(0.02, 0.012, 0.32), M.iron, bench, [0.5 + i * 0.1, 0.92, -0.1 + (i % 2) * 0.1], [0, 0.2 * i, 0]);
  const vise = group(bench, [1.05, 0.92, -0.3]); mesh(box(0.14, 0.2, 0.1, 'bottom'), M.iron, vise); mesh(box(0.02, 0.02, 0.3), M.iron, vise, [0, 0.15, 0.1]);
  const rack = group(g, [2.6, 0, -5.9]); mesh(box(2.2, 0.08, 0.08), M.beam, rack, [0, 2.2, 0]); for (let i = 0; i < 6; i++) { mesh(box(0.014, 0.75, 0.014), M.iron, rack, [-0.9 + i * 0.36, 1.78, 0.06], [0, 0, (i % 2 ? 0.04 : -0.04)]); mesh(box(0.014, 0.75, 0.014), M.iron, rack, [-0.88 + i * 0.36, 1.78, 0.06], [0, 0, (i % 2 ? -0.03 : 0.05)]); }
  for (let i = 0; i < 7; i++) { const hs = horseshoe(M); hs.position.set(4.98, 1.4 + (i % 2) * 0.22, -4.6 + i * 0.42); hs.rotation.set(0, Math.PI / 2, Math.PI); g.add(hs); }
  // a finished-goods rack by the front: blades and a scythe
  const fin = group(g, [4.1, 0, 0.9]); mesh(box(0.08, 1.1, 1.2, 'bottom'), M.beam, fin, [0, 0, 0]); for (let i = 0; i < 4; i++) { mesh(box(0.012, 0.8, 0.05, 'bottom'), M.steel, fin, [-0.08, 0.3, -0.45 + i * 0.3], [0, 0, 0.12]); mesh(box(0.12, 0.025, 0.03), M.iron, fin, [-0.08, 0.32, -0.45 + i * 0.3]); }
  // grindstone (front right)
  const gs = group(g, [3.2, 0, 1.0], [0, -0.4, 0]); for (const s of [-1, 1]) mesh(box(0.08, 0.9, 0.08, 'bottom'), M.beam, gs, [s * 0.25, 0, 0]); const wheel = mesh(prism(16, 0.38, 0.38, 0.12, 'center'), mat({ map: TF('stoneW'), color: 0xd8d0c0 }), gs, [0, 0.85, 0], [0, 0, Math.PI / 2]); mesh(box(0.7, 0.08, 0.08), M.beam, gs, [0, 0.85, 0]);
  // hanging lantern
  const lan = group(g, [1.0, 2.6, -1.0]); mesh(box(0.012, 0.8, 0.012, 'bottom'), M.iron, lan, [0, 0, 0]); mesh(box(0.16, 0.22, 0.16), mat({ color: 0xffd8a0, emissive: 0xffa040, unlit: true }), lan); const lg = glow(0xffc070, 1.2, 0.35); lan.add(lg);
  g.userData = { M, meshes, firePos, fire, fglow, embers, smoke, coals, lumpM, bellows: bel, anvil: anv, tub, bucket: bk, bench, wheel, lantern: lg, hearth: v3(hx, 0, hz) };
  return g;
}
// the forge's fire state: k 0 (dead/cold) .. 1 (roaring); flare from the bellows
export function setFire(S, k, t, flare = 0) {
  const u = S.userData; const f = clamp(k + flare * 0.6, 0, 1.6);
  u.fire.material.uniforms.uOpacity.value = clamp(f, 0, 1); u.fire.material.uniforms.uSize.value = 0.24 + f * 0.16; u.fire.material.uniforms.uVel.value.set(0, 0.6 + f * 1.2, 0);
  u.fglow.material.opacity = clamp(f * 0.55, 0, 0.8); u.embers.material.uniforms.uOpacity.value = clamp(f, 0, 1); u.smoke.material.uniforms.uOpacity.value = 0.15 + k * 0.3;
  const ec = clamp(0.15 + k * 0.85 + flare * 0.2, 0, 1.2); u.coals.material.uniforms.uColor.value.setRGB(ec, ec * 0.85 + 0.1 * (1 - k), ec * 0.8 + 0.15 * (1 - k)); u.lumpM.uniforms.uColor.value.copy(u.coals.material.uniforms.uColor.value);
  return 2.2 * f * (0.92 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.04);
}

// ---------------------------------------------------------------- the village
function house(B, x, z, yaw, w, d, h, R, roofKind = 'thatch') {
  const M4 = (gg) => { gg.applyMatrix4(new THREE.Matrix4().makeRotationY(yaw)); gg.translate(x, 0, z); return gg; };
  B.stone.push(M4(tbox(w + 0.1, 0.5, d + 0.1, 2))); B.daub.push(M4(xf(tbox(w, h - 0.5, d, w / 2 > 2 ? 2.4 : 2), { p: [0, 0.5, 0] })));
  const a = 0.75, rl = (w / 2) / Math.cos(a) + 0.5;
  for (const s of [-1, 1]) { const sl = tbox(rl, 0.3, d + 0.8, 1.8, 'center'); sl.rotateZ(-s * a); sl.translate(s * w / 4, h + Math.tan(a) * w / 4 + 0.15, 0); B[roofKind].push(M4(sl)); }
  for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, Math.tan(a) * w / 2); tri.closePath(); const tg = new THREE.ShapeGeometry(tri); tg.translate(0, h, s * d / 2 * 1.001); if (s < 0) tg.rotateY(Math.PI); const uv = tg.attributes.uv, p = tg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2.4, p.getY(i) / 2.4); B.daub.push(M4(tg)); }
  B.beam.push(M4(xf(box(1.0, 1.9, 0.12, 'bottom'), { p: [0, 0.3, d / 2 + 0.03] })));
  for (const sx of [-1, 1]) { B.win.push(M4(xf(box(0.6, 0.6, 0.06), { p: [sx * w * 0.3, 1.7, d / 2 + 0.02] }))); B.beam.push(M4(xf(box(0.3, 0.7, 0.05), { p: [sx * w * 0.3 + sx * 0.46, 1.7, d / 2 + 0.05] }))); }
  if (R() < 0.7) { B.stone.push(M4(xf(tbox(0.6, 2.4, 0.6, 1), { p: [w * 0.25, h + 0.4, -d * 0.2] }))); }
  return v3(w * 0.25, h + 2.8, -d * 0.2).applyAxisAngle(v3(0, 1, 0), yaw).add(v3(x, 0, z));
}
export function village(o = {}) {
  const scene = new THREE.Scene(), M = materials(); const R = rng(o.seed || 7); const night = o.night;
  const s = sky(night ? SKY.night : SKY.morning); scene.add(s);
  scene.add(mountainMesh((x, z) => Math.pow(clamp((Math.hypot(x, z) - 300) / 500), 1.4) * 120 - 0.4, { size: 3000, seg: 120, grass: night ? 0x3a4038 : 0x7a8a6a, rock: 0x6a6a6a, snowLine: 70 }));
  scene.add(mesh(new THREE.PlaneGeometry(600, 600), M.frost, null, [0, -0.02, 0], [-Math.PI / 2, 0, 0]));
  mesh(new THREE.PlaneGeometry(120, 8), mat({ map: TF('flags'), repeat: [30, 2], color: 0xd0ccc4 }), scene, [0, 0.0, 6.5], [-Math.PI / 2, 0, 0]);
  const sm = smithy(); scene.add(sm);
  const B = { stone: [], daub: [], thatch: [], shingle: [], beam: [], win: [] }; M.win = mat({ color: night ? 0xffb060 : 0x7a6a58, emissive: night ? 0xff9040 : 0x000000, unlit: !!night });
  const chim = [];
  chim.push(house(B, 10.5, -1.6, 0, 6.4, 7.0, 3.2, R));                         // the family home, next to the smithy
  for (let k = 0; k < 6; k++) { const x = -12 - k * 8 - R() * 2; chim.push(house(B, x, -1.8 - R(), 0, 5 + R() * 2, 6 + R() * 2, 3 + R() * 0.6, R, R() < 0.5 ? 'thatch' : 'shingle')); }
  for (let k = 0; k < 4; k++) { const x = 18 + k * 8 + R() * 2; chim.push(house(B, x, -1.8 - R(), 0, 5 + R() * 2, 6 + R() * 2, 3 + R() * 0.6, R, R() < 0.5 ? 'thatch' : 'shingle')); }
  for (let k = 0; k < 10; k++) { const x = -40 + k * 9 + R() * 2; chim.push(house(B, x, 15.5 + R(), Math.PI, 5 + R() * 2, 6 + R() * 2, 3 + R() * 0.6, R, R() < 0.5 ? 'thatch' : 'shingle')); }
  const vm = bucketMesh(B, M, scene);
  chim.forEach((c, i) => { if (i % 2 === 0 || i === 0) scene.add(smokeP({ origin: c, spread: v3(0.2, 0.1, 0.2), vel: v3(0.5, 1.2, 0.1), size: 1.2, count: 22, life: 5, opacity: 0.32, seed: 400 + i })); });
  // well, cart, fence, bare trees, a hanging smithy sign
  const W = group(scene, [-4, 0, 9.5]); mesh(prism(10, 0.8, 0.8, 0.8, 'bottom', true), mat({ map: TF('stoneW'), color: 0xd0c8c0, side: THREE.DoubleSide }), W); for (const s of [-1, 1]) mesh(box(0.12, 1.8, 0.12, 'bottom'), M.beam, W, [s * 0.75, 0, 0]); mesh(box(1.7, 0.12, 0.12), M.beam, W, [0, 1.8, 0]);
  const cart = group(scene, [7.0, 0, 5.2], [0, 0.4, 0]); mesh(tbox(1.4, 0.4, 2.4, 1), M.plank, cart, [0, 0.55, 0]); for (const s of [-1, 1]) mesh(prism(10, 0.5, 0.5, 0.08, 'center'), M.beam, cart, [s * 0.78, 0.5, 0], [0, 0, Math.PI / 2]);
  const tr = []; for (let i = 0; i < 18; i++) { const x = (R() - 0.5) * 120, z = 24 + R() * 40; tr.push(xf(prism(5, 0.2, 0.08, 6 + R() * 4), { p: [x, 0, z] })); for (let b = 0; b < 4; b++) tr.push(xf(prism(4, 0.06, 0.01, 2.5), { p: [x, 3 + b, z], r: [R() - 0.5, R() * 3, (R() - 0.5) * 1.4] })); }
  mesh(merge(tr), M.beam, scene); scene.add(pines({ count: 120, area: [-160, 160, 40, 160], seed: 9, h: [8, 16], color: night ? 0x34403a : 0x6a8070 }));
  const sg = group(scene, [5.4, 2.6, 2.6]); mesh(box(0.06, 0.06, 0.9), M.beam, sg, [0, 0.3, -0.3]); mesh(new THREE.PlaneGeometry(0.6, 0.6), M.sign, sg, [0, 0, 0.1], [0, Math.PI / 2, 0]);
  if (!night) scene.add(particles({ mode: 'drift', count: 300, box: v3(40, 8, 30), origin: v3(0, 3, 5), vel: v3(0.2, -0.05, 0.05), size: 0.06, c0: 0xe8eef4, seed: 410, swirl: 0.5, opacity: 0.5, fogMix: 0.4, additive: false }));   // frost motes
  return { scene, sky: s, M, smithy: sm, chim, home: v3(10.5, 0, -1.6) };
}
