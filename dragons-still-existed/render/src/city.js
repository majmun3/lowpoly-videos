// WHAT IF DRAGONS STILL EXISTED? — modern Earth environments: a big city (day / sunset / dusk, with windows lighting up),
// an airport with a dragon landing zone, a dragon sanctuary in the countryside, an inspection station and a military airbase.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky } from '/the-last-ember/render/src/world.js';
import { TW, terrainAt, grassTufts, smokeP, fireP } from '/born-as-a-goblin/render/src/gworld.js';
import { mountainMesh } from '/born-as-a-dwarf/render/src/dworld.js';
import { TM, signPost, airliner, fighterJet } from './modern.js';

const cache = {};
export function TC(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  asphalt: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1901, [16, 8, 4]); const r = rng(1901); pixels(x, w, h, (i, j) => { let v = 0.3 + (n(i, j) - 0.5) * 0.1 + (r() < 0.05 ? 0.05 : 0); return [C(v * 200), C(v * 200), C(v * 205)]; }); }, { mip: true }),
  concrete: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1903, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.62 + (n(i, j) - 0.5) * 0.12; if (i % 16 === 0 || j % 16 === 0) v -= 0.12; return [C(v * 220), C(v * 215), C(v * 205)]; }); }, { mip: true }),
  glassT: () => mk(32, 32, (x, w, h) => { const r = rng(1905); pixels(x, w, h, (i, j) => { if (i % 8 === 0 || j % 8 === 0) return [90, 100, 112]; const v = 0.4 + (j % 8) * 0.04 + r() * 0.03; return [C(v * 150), C(v * 185), C(v * 220)]; }); }, { mip: true }),
  officeT: () => mk(32, 32, (x, w, h) => { pixels(x, w, h, (i, j) => { const wi = i % 8 > 1 && i % 8 < 7 && j % 8 > 2 && j % 8 < 7; return wi ? [70, 86, 104] : [196, 190, 180]; }); }, { mip: true }),
  brickT: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1907, [8, 4]); pixels(x, w, h, (i, j) => { const wi = i % 8 > 1 && i % 8 < 6 && j % 8 > 1 && j % 8 < 6; if (wi) return [60, 66, 80]; const v = 0.55 + (n(i, j) - 0.5) * 0.15 - (j % 2 ? 0.05 : 0); return [C(v * 200), C(v * 110), C(v * 80)]; }); }, { mip: true }),
  winE: () => mk(32, 32, (x, w, h) => { const r = rng(1909); const lit = Array.from({ length: 16 }, () => r() < 0.55); pixels(x, w, h, (i, j) => { const k = Math.floor(i / 8) + Math.floor(j / 8) * 4; const wi = i % 8 > 1 && i % 8 < 7 && j % 8 > 2 && j % 8 < 7; return wi && lit[k] ? [255, 205, 130] : [0, 0, 0]; }); }, { mip: true }),
  lane: () => mk(8, 32, (x, w, h) => { pixels(x, w, h, (i, j) => (j < 18 ? [240, 240, 235, 255] : [0, 0, 0, 0])); }),
  zebra: () => mk(32, 8, (x, w, h) => { pixels(x, w, h, (i, j) => ((i % 8) < 4 ? [240, 240, 235, 255] : [0, 0, 0, 0])); }),
  runway: () => mk(16, 64, (x, w, h) => { pixels(x, w, h, (i, j) => ((i === 7 || i === 8) && j % 16 < 8) ? [240, 240, 235] : [70, 72, 76]); }, { mip: true }),
  hangar: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1911, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.55 + (n(i, j) - 0.5) * 0.1 + (i % 4 === 0 ? -0.08 : 0); return [C(v * 200), C(v * 205), C(v * 200)]; }); }, { mip: true }),
};

// ---------------------------------------------------------------- skies and light
export const SKY = {
  day: { horizon: 0xd8e4ee, top: 0x4a84c8, bottom: 0x7a8088, cloud: 0xc8ccd4, cloudLit: 0xffffff, sunCol: 0xfff0d0, cover: 0.55, sunDir: v3(0.4, 0.55, -0.6) },
  sunset: { horizon: 0xffa868, top: 0x4a5a8a, bottom: 0x5a4a48, cloud: 0x9a6a68, cloudLit: 0xffc890, sunCol: 0xffa050, cover: 0.5, sunDir: v3(0.2, 0.1, -1) },
  dusk: { horizon: 0xe08a68, top: 0x2a3060, bottom: 0x3a3038, cloud: 0x5a4058, cloudLit: 0xff9a70, sunCol: 0xff7a40, cover: 0.48, sunDir: v3(0.25, 0.04, -1) },
};
export const ENV = {
  day: { fog: [80, 2400], fogCol: 0xc8d4dc, hfog: [2, 40, 0.3, 0.002], lightDir: v3(-0.4, -0.7, 0.5), lightCol: 0xfff4e4, ambient: 0x6a7078, rim: 0xfff0e0, fillDir: v3(0.4, -0.3, -0.8), fillCol: 0x404850 },
  sunset: { fog: [80, 2400], fogCol: 0xd8a888, hfog: [2, 40, 0.35, 0.002], lightDir: v3(-0.2, -0.3, 1.0), lightCol: 0xffc898, ambient: 0x5a5260, rim: 0xffb080, fillDir: v3(0.4, -0.3, -0.8), fillCol: 0x3a3850 },
  dusk: { fog: [60, 2200], fogCol: 0x8a6a70, hfog: [2, 40, 0.35, 0.003], lightDir: v3(-0.25, -0.2, 1.0), lightCol: 0xffa078, ambient: 0x46425a, rim: 0xff9070, fillDir: v3(0.4, -0.3, -0.8), fillCol: 0x30304a },
};
export function materials() {
  return { asphalt: mat({ map: TC('asphalt'), repeat: [40, 120], affine: 0.6 }), concrete: mat({ map: TC('concrete'), rim: 0.3 }), glass: mat({ map: TC('glassT'), emap: TC('winE'), emissive: 0x000000, rim: 1 }), office: mat({ map: TC('officeT'), emap: TC('winE'), emissive: 0x000000, rim: 0.5 }),
    brick: mat({ map: TC('brickT'), emap: TC('winE'), emissive: 0x000000, rim: 0.5 }), roof: mat({ map: TC('concrete'), color: 0x8a8a8c }), metal: mat({ map: T('iron'), color: 0x9a9aa0, rim: 1 }), lane: mat({ map: TC('lane'), alphaTest: 0.5, unlit: true, color: 0xd8d8d0 }),
    zebra: mat({ map: TC('zebra'), alphaTest: 0.5, unlit: true, color: 0xe0e0d8 }), yellow: mat({ color: 0xd8b020, unlit: true }), tree: mat({ map: TW('leaves'), color: 0xb8d0a0, wrap: 0.85 }), bark: mat({ map: TW('barkW') }), hangar: mat({ map: TC('hangar'), rim: 0.6 }) };
}
// a box whose UVs repeat with its size (so windows keep their scale)
function bbox(w, h, d, tile = 4) { const g = box(w, h, d, 'bottom'); const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); const a = nx > 0.5 ? p.getZ(i) : p.getX(i), b = ny > 0.5 ? p.getZ(i) : p.getY(i); uv.setXY(i, a / tile, b / tile); } return g; }
function bucket(B, M, parent) { const out = {}; for (const k in B) if (B[k].length) out[k] = mesh(merge(B[k]), M[k], parent); return out; }

// ---------------------------------------------------------------- the city
// main avenue along z at x = 0 (x from -12 to 12), cross streets every 90 m
export function city(o = {}) {
  const scene = new THREE.Scene(), M = materials(); const tod = o.tod ?? 'day'; const R = rng(o.seed || 3);
  const s = sky(SKY[tod]); scene.add(s);
  const far = mountainMesh((x, z) => Math.pow(clamp((Math.hypot(x, z) - 900) / 900), 1.4) * 260 - 0.5, { size: 7000, seg: 120, grass: 0x6a7a5a, rock: 0x7a7a80, snowLine: 9999 }); scene.add(far);
  scene.add(mesh(new THREE.PlaneGeometry(1600, 1600), M.asphalt, null, [0, 0, -200], [-Math.PI / 2, 0, 0]));
  const B = { glass: [], office: [], brick: [], roof: [], concrete: [], metal: [] }; const roofs = [];
  const zMin = o.z0 ?? -900, zMax = o.z1 ?? 300;
  for (let bz = zMax; bz > zMin; bz -= 90) for (let bx = -1; bx <= 1; bx += 2) for (let col = 0; col < 5; col++) {
    const x0 = bx * (18 + col * 78), zc = bz - 45; // block: 60 x 70, sidewalk 3
    B.concrete.push(xf(box(66, 0.2, 76, 'bottom'), { p: [x0 + bx * 33, 0, zc] }));
    const nB = 2 + Math.floor(R() * 3);
    for (let k = 0; k < nB; k++) {
      const w = 18 + R() * 14, d = 18 + R() * 14, x = x0 + bx * (3 + w / 2 + (k % 2) * 30), z = zc + (k < 2 ? -18 : 18) + (R() - 0.5) * 8;
      const near = col === 0; const kind = R() < 0.4 ? 'glass' : R() < 0.6 ? 'office' : 'brick'; const h = kind === 'brick' ? 18 + R() * 30 : (near ? 50 : 40) + R() * (near ? 150 : 200) * (Math.abs(bz) < 500 ? 1 : 0.6);
      B[kind].push(xf(bbox(w, h, d, kind === 'glass' ? 4 : 3.2), { p: [x, 0.2, z] }));
      B.roof.push(xf(box(w * 0.96, 0.6, d * 0.96, 'bottom'), { p: [x, h + 0.2, z] }));
      if (R() < 0.7) B.metal.push(xf(box(3 + R() * 3, 2 + R() * 2, 3 + R() * 3, 'bottom'), { p: [x + (R() - 0.5) * w * 0.5, h + 0.8, z + (R() - 0.5) * d * 0.5] }));
      if (kind === 'glass' && R() < 0.4) { B.glass.push(xf(bbox(w * 0.6, h * 0.25, d * 0.6, 4), { p: [x, h + 0.8, z] })); if (R() < 0.5) B.metal.push(xf(prism(4, 0.4, 0.1, 18), { p: [x, h * 1.25 + 0.8, z] })); }
      roofs.push({ x, z, h: h + 0.8, w, d, near, kind });
    }
  }
  const meshes = bucket(B, M, scene);
  // lane markings, centre line, crosswalks
  const lanes = []; for (const x of [-6, 6]) lanes.push(xf(new THREE.PlaneGeometry(0.25, zMax - zMin), { p: [x, 0.03, (zMax + zMin) / 2], r: [-Math.PI / 2, 0, 0] }));
  const lm = new THREE.PlaneGeometry(0.25, zMax - zMin); const luv = lm.attributes.uv; for (let i = 0; i < luv.count; i++) luv.setY(i, luv.getY(i) * (zMax - zMin) / 8);
  for (const x of [-6, 6]) mesh(lm.clone(), M.lane, scene, [x, 0.03, (zMax + zMin) / 2], [-Math.PI / 2, 0, 0]);
  for (const x of [-0.2, 0.2]) mesh(new THREE.PlaneGeometry(0.18, zMax - zMin), M.yellow, scene, [x, 0.03, (zMax + zMin) / 2], [-Math.PI / 2, 0, 0]);
  for (let bz = zMax; bz > zMin; bz -= 90) { const zb = new THREE.PlaneGeometry(24, 4); const u = zb.attributes.uv; for (let i = 0; i < u.count; i++) u.setX(i, u.getX(i) * 6); mesh(zb, M.zebra, scene, [0, 0.035, bz - 3], [-Math.PI / 2, 0, 0]); }
  // street lamps and trees along the avenue
  const lamps = []; const T2 = []; const lampM = mat({ map: T('iron'), color: 0x5a5a60, rim: 1 });
  for (let z = zMax - 10; z > zMin; z -= 30) for (const sx of [-1, 1]) { const g = group(scene, [sx * 13.5, 0, z]); mesh(prism(6, 0.12, 0.1, 9), lampM, g); mesh(box(1.8, 0.12, 0.2), lampM, g, [-sx * 0.9, 9, 0]); const gl = glow(0xffd8a0, 4.5, 0); gl.position.set(sx * 13.5 - sx * 1.6, 8.8, z); scene.add(gl); lamps.push(gl);
    if ((z / 30 | 0) % 2 === 0) { T2.push(xf(prism(6, 0.25, 0.2, 3.5), { p: [sx * 15.5, 0.2, z + 15] })); }
  }
  mesh(merge(T2), M.bark, scene); const can = []; for (let z = zMax - 10; z > zMin; z -= 30) for (const sx of [-1, 1]) if ((z / 30 | 0) % 2 === 0) can.push(xf(flat(new THREE.IcosahedronGeometry(2.4, 0)), { p: [sx * 15.5, 5.2, z + 15], s: [1, 0.9, 1] })); mesh(merge(can), M.tree, scene);
  // traffic lights at each crossing
  const tlights = []; for (let bz = zMax; bz > zMin; bz -= 90) for (const sx of [-1, 1]) { const g = group(scene, [sx * 12.8, 0, bz - 6 * sx]); g.rotation.y = sx > 0 ? 0 : Math.PI; mesh(prism(6, 0.14, 0.12, 6.5), lampM, g); mesh(box(5, 0.15, 0.15), lampM, g, [-2.5, 6.4, 0]); const hb = group(g, [-4.6, 6.0, 0.1]); mesh(box(0.5, 1.4, 0.4), mat({ color: 0x1a1a1a }), hb); const L = [0xff2020, 0xffb020, 0x20ff60].map((c, i) => { const m = mesh(box(0.3, 0.3, 0.05), mat({ color: c, emissive: c, unlit: true }), hb, [0, 0.42 - i * 0.42, 0.22]); const gl = glow(c, 1.2, 0); gl.position.set(0, 0.42 - i * 0.42, 0.3); hb.add(gl); return { m, gl, c }; }); tlights.push({ g, L, z: bz - 6 * sx, sx }); }
  return { scene, sky: s, M, meshes, roofs, lamps, tlights, tod };
}
export function setLights(E, k) { for (const key of ['glass', 'office', 'brick']) if (E.meshes[key]) E.meshes[key].material.uniforms.uEmissive.value.setRGB(1, 0.85, 0.6).multiplyScalar(k * 1.1); E.lamps.forEach(l => l.material.opacity = k * 0.8); }
export function setSignal(tl, state) { tl.L.forEach((l, i) => { const on = i === state; l.m.material.uniforms.uColor.value.set(on ? l.c : 0x202020); l.gl.material.opacity = on ? 0.9 : 0; }); }

// ---------------------------------------------------------------- the airport and its dragon landing zone
export function airport(o = {}) {
  const scene = new THREE.Scene(), M = materials(); scene.add(sky(SKY.day));
  scene.add(mountainMesh((x, z) => Math.pow(clamp((Math.hypot(x, z) - 1100) / 900), 1.4) * 240 - 0.5, { size: 7000, seg: 120, grass: 0x7a9a5a, rock: 0x7a7a80, snowLine: 9999 }));
  scene.add(mesh(new THREE.PlaneGeometry(3000, 3000), mat({ map: TW('grass'), repeat: [300, 300], color: 0xa8b088 }), null, [0, -0.02, 0], [-Math.PI / 2, 0, 0]));
  const rw = new THREE.PlaneGeometry(60, 1400); const u = rw.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i), u.getY(i) * 22); mesh(rw, mat({ map: TC('runway') }), scene, [120, 0.02, -200], [-Math.PI / 2, 0, 0]);
  mesh(new THREE.PlaneGeometry(30, 900), mat({ map: TC('asphalt'), repeat: [3, 80] }), scene, [60, 0.02, -150], [-Math.PI / 2, 0, 0]);
  mesh(new THREE.PlaneGeometry(220, 160), mat({ map: TC('asphalt'), repeat: [20, 16], color: 0xc0c0c4 }), scene, [-40, 0.015, -60], [-Math.PI / 2, 0, 0]);
  // terminal and tower
  const B = { glass: [], concrete: [], metal: [] };
  B.glass.push(xf(bbox(200, 18, 30, 4), { p: [-60, 0, -170] })); B.concrete.push(xf(box(204, 2, 34, 'bottom'), { p: [-60, 18, -170] }));
  B.concrete.push(xf(prism(8, 3, 2.6, 46), { p: [30, 0, -230] })); B.glass.push(xf(prism(8, 6, 5, 6), { p: [30, 46, -230] })); B.concrete.push(xf(prism(8, 6.5, 6.5, 1.0), { p: [30, 52, -230] }));
  for (let k = 0; k < 4; k++) B.metal.push(xf(box(3, 4, 22), { p: [-130 + k * 40, 5, -144] }));
  bucket(B, M, scene);
  const planes = []; for (let k = 0; k < 3; k++) { const a = airliner({ accent: [0x2a4a9a, 0xb02a2a, 0x2a7a5a][k] }); a.position.set(-130 + k * 40, 0, -122); a.rotation.y = Math.PI; scene.add(a); planes.push(a); }
  const taxi = airliner({ accent: 0xc08a2a }); scene.add(taxi);
  // the dragon landing zone: a marked pad, wind socks, a big open hangar
  const pad = v3(-60, 0, 40); mesh(new THREE.PlaneGeometry(70, 70), mat({ map: TM('pad') }), scene, [pad.x, 0.04, pad.z], [-Math.PI / 2, 0, 0]);
  for (const [x, z] of [[-100, 10], [-20, 75]]) { const g = group(scene, [x, 0, z]); mesh(prism(6, 0.2, 0.15, 10), M.metal, g); const sock = mesh(prism(8, 0.9, 0.4, 4), mat({ color: 0xff7020, rim: 1 }), g, [0, 9.4, 0], [Math.PI / 2 + 0.3, 0, 0]); }
  const hg = new THREE.CylinderGeometry(30, 30, 70, 12, 1, true, 0, Math.PI); hg.rotateZ(Math.PI / 2); hg.rotateY(Math.PI / 2); mesh(flat(hg), mat({ map: TC('hangar'), side: THREE.DoubleSide, rim: 0.5 }), scene, [-60, 0, -30], [0, Math.PI / 2, 0]);
  scene.add(signPost('dragonLane', { w: 3, hh: 3, h: 7 }).translateX(-20).translateZ(10));
  return { scene, M, pad, planes, taxi };
}

// ---------------------------------------------------------------- the sanctuary (countryside)
export function sanctuary(o = {}) {
  const scene = new THREE.Scene(), M = materials(); scene.add(sky(SKY.day));
  const hf = (x, z) => 0.5 * Math.sin(x * 0.02) * Math.cos(z * 0.018) + Math.pow(clamp((Math.hypot(x, z) - 400) / 700), 1.4) * 180;
  scene.add(mountainMesh(hf, { size: 5000, seg: 150, grass: 0x7a9a50, rock: 0x7a7a74, snowLine: 9999 }));
  scene.add(terrainAt(0, 0, 500, 80, hf, { map: TW('grass'), color: 0xc8d0a0 }));
  mesh(new THREE.PlaneGeometry(14, 900), mat({ map: TC('asphalt'), repeat: [2, 100] }), scene, [70, 0.15, 0], [-Math.PI / 2, 0, 0]);
  const barns = []; const hgM = mat({ map: TC('hangar'), color: 0xc8b8a0, side: THREE.DoubleSide, rim: 0.5 });
  for (const [x, z, s] of [[-40, -80, 1], [40, -110, 1.2], [-80, 40, 0.9]]) { const hg = new THREE.CylinderGeometry(26 * s, 26 * s, 60 * s, 12, 1, true, 0, Math.PI); hg.rotateZ(Math.PI / 2); mesh(flat(hg), hgM, scene, [x, 0, z]); mesh(new THREE.CircleGeometry(26 * s, 12, 0, Math.PI), hgM, scene, [x - 30 * s, 0, z], [0, -Math.PI / 2, 0]); barns.push(v3(x, 0, z)); }
  // fences around paddocks
  const F = []; for (const [cx, cz, w, d] of [[0, 20, 120, 80], [-10, -180, 160, 60]]) { for (let k = -w / 2; k <= w / 2; k += 6) for (const s of [-1, 1]) F.push(xf(box(0.25, 2.4, 0.25, 'bottom'), { p: [cx + k, 0, cz + s * d / 2] })); for (let k = -d / 2; k <= d / 2; k += 6) for (const s of [-1, 1]) F.push(xf(box(0.25, 2.4, 0.25, 'bottom'), { p: [cx + s * w / 2, 0, cz + k] })); for (const s of [-1, 1]) { F.push(xf(box(w, 0.2, 0.2), { p: [cx, 1.6, cz + s * d / 2] })); F.push(xf(box(0.2, 0.2, d), { p: [cx + s * w / 2, 1.6, cz] })); } }
  mesh(merge(F), mat({ map: T('wood'), color: 0xc0a080 }), scene);
  // the feed warehouse with crates of meat
  const wh = group(scene, [52, 0, 40]); mesh(bbox(30, 12, 24, 4), M.office, wh); mesh(box(31, 0.6, 25, 'bottom'), M.roof, wh, [0, 12, 0]);
  const crates = []; const crM = mat({ map: T('wood'), color: 0xd0a878, rim: 0.6 }), meatM = mat({ color: 0xa83a3a, rim: 0.8, wrap: 0.6 });
  for (let k = 0; k < 10; k++) { const c = group(scene, [35 + (k % 5) * 3.2, 0, 60 + Math.floor(k / 5) * 3.2]); mesh(box(2.6, 1.4, 2.6, 'bottom'), crM, c); mesh(box(2.3, 0.5, 2.3, 'bottom'), meatM, c, [0, 1.4, 0]); crates.push(c); }
  scene.add(signPost('sanctuary', { w: 8, hh: 2, h: 5 }).translateX(76).translateZ(110));
  return { scene, M, hf, barns, crates, wh };
}

// ---------------------------------------------------------------- the military airbase
export function airbase(o = {}) {
  const scene = new THREE.Scene(), M = materials(); scene.add(sky(o.sky ?? SKY.day));
  scene.add(mountainMesh((x, z) => Math.pow(clamp((Math.hypot(x, z) - 700) / 800), 1.3) * 260 - 0.5, { size: 6000, seg: 130, grass: 0x8a8a60, rock: 0x8a8070, snowLine: 9999 }));
  scene.add(mesh(new THREE.PlaneGeometry(3000, 3000), mat({ map: TW('grass'), repeat: [300, 300], color: 0xb0a880 }), null, [0, -0.02, 0], [-Math.PI / 2, 0, 0]));
  const rw = new THREE.PlaneGeometry(50, 1600); const u = rw.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i), u.getY(i) * 26); mesh(rw, mat({ map: TC('runway') }), scene, [90, 0.02, -300], [-Math.PI / 2, 0, 0]);
  mesh(new THREE.PlaneGeometry(160, 260), mat({ map: TC('asphalt'), repeat: [16, 26], color: 0xb8b8b0 }), scene, [-10, 0.015, -40], [-Math.PI / 2, 0, 0]);
  const hgM = mat({ map: TC('hangar'), color: 0x9aa090, side: THREE.DoubleSide, rim: 0.5 });
  for (let k = 0; k < 3; k++) { const hg = new THREE.CylinderGeometry(22, 22, 50, 12, 1, true, 0, Math.PI); hg.rotateZ(Math.PI / 2); hg.rotateY(Math.PI / 2); mesh(flat(hg), hgM, scene, [-70, 0, -120 + k * 60], [0, Math.PI / 2, 0]); }
  const jets = []; for (let k = 0; k < 6; k++) { const j = fighterJet(); j.position.set(-20 + (k % 3) * 18, 0, -80 + Math.floor(k / 3) * 34); j.rotation.y = Math.PI / 2; scene.add(j); jets.push(j); }
  const tw = group(scene, [40, 0, -200]); mesh(prism(6, 3, 3, 30), M.concrete, tw); mesh(prism(8, 5, 5, 5), M.glass, tw, [0, 30, 0]);
  return { scene, M, jets };
}
export { smokeP, fireP };
