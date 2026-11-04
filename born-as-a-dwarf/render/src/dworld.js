// Worlds for WHAT IF YOU WERE BORN AS A DWARF? — a serious, beautiful dark-fantasy world:
// a green mountain valley with a dwarf village, a hearth-lit house, the training courtyard, the great underground forge,
// the mountain fortress and the battlefield at dusk, and the golden throne hall.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, smooth, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky, terrain } from '/the-last-ember/render/src/world.js';
import { T2, ridged } from '/the-silent-kingdom/render/src/kingdom.js';
import { TW, terrainAt, ground, grassTufts, bushes, sunShafts, fireP, smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { buildDwarfNPC, buildDwarf, TD } from './dwarf.js';

const cache = {};
export function TV(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  block: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1501, [16, 8, 4]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 12), off = row % 2 ? 12 : 0, bx = (i + off) % 24, by = j % 12; let v = 0.52 + (n(i, j) - 0.5) * 0.25; if (bx < 1 || by < 1) v = 0.28; return [C(v * 172), C(v * 170), C(v * 164)]; }); }, { mip: true }),
  carved: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1503, [16, 8, 4]); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.22; const cx = Math.abs(i - 31.5), cy = j % 32; const ch = Math.abs(cy - 16 + cx * 0.5) < 1.2 || Math.abs(cy - 24 + cx * 0.5) < 1.2; if (ch) v -= 0.16; if (j % 32 < 2) v -= 0.12; if (cx > 29) v -= 0.1; return [C(v * 178), C(v * 172), C(v * 160)]; }); }, { mip: true }),
  turf: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1505, [8, 4, 2]), r = rng(1505); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.35; if (r() < 0.05) v += 0.15; return [C(v * 118), C(v * 152), C(v * 70)]; }); }),
  plank: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1507, [8, 4, 2]); pixels(x, w, h, (i, j) => { let v = 0.45 + (n(i, j) - 0.5) * 0.2 + Math.sin(j * 1.7 + n(i, j) * 4) * 0.04; if (i % 8 === 0) v -= 0.14; return [C(v * 190), C(v * 140), C(v * 96)]; }); }, { mip: true }),
  cobble: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1509, [16, 8, 4]); const r = rng(1509); const pts = Array.from({ length: 40 }, () => [r() * 64, r() * 64]); pixels(x, w, h, (i, j) => { let d1 = 99, d2 = 99; for (const [px, py] of pts) { const dx = Math.min(Math.abs(i - px), 64 - Math.abs(i - px)), dy = Math.min(Math.abs(j - py), 64 - Math.abs(j - py)); const d = Math.hypot(dx, dy); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } let v = 0.5 + (n(i, j) - 0.5) * 0.2; if (d2 - d1 < 1.4) v = 0.25; return [C(v * 165), C(v * 160), C(v * 150)]; }); }, { mip: true }),
  mud: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1511, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.36 + (n(i, j) - 0.5) * 0.3; return [C(v * 150), C(v * 105), C(v * 70)]; }); }),
  runeGlow: () => mk(128, 128, (x, w, h) => { // the forge door: concentric octagons and chevrons
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 3;
    const oct = (r) => { g.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.stroke(); };
    oct(60); oct(50); oct(22); oct(12); g.lineWidth = 2.5;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.save(); g.translate(64, 64); g.rotate(a); g.beginPath(); g.moveTo(-9, -46); g.lineTo(0, -28); g.lineTo(9, -46); g.stroke(); g.beginPath(); g.rect(-4, -42, 8, 8); g.stroke(); g.restore(); }
    const m = g.getImageData(0, 0, w, h).data; pixels(x, w, h, (i, j) => { const a = m[(j * w + i) * 4 + 3]; return a > 60 ? [255, 255, 255] : [0, 0, 0]; });
  }),
  doorStone: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1513, [16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.32 + (n(i, j) - 0.5) * 0.18; return [C(v * 150), C(v * 135), C(v * 120)]; }); }),
  molten: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1515, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = n(i, j); if (v < 0.36) return [C(90), C(30), C(10)]; return [C(255), C(120 + v * 120), C(30 + v * 60)]; }); }),
  banner: () => mk(32, 64, (x, w, h) => { // crimson with a gold axe above a mountain
    const n = fbm(w, h, 1517, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.62 + (n(i, j) - 0.5) * 0.25; const cx = i - 15.5; if (i < 2 || i > w - 3 || j < 2) return [C(v * 230), C(v * 180), C(v * 70)];
      const axe = (Math.abs(cx) < 1.2 && j > 12 && j < 44) || (j > 14 && j < 26 && cx > 0 && cx < 10 - Math.abs(j - 20) * 0.5) ; const mtn = j > 46 && j < 56 && Math.abs(cx) < (j - 46) * 1.2;
      if (axe || mtn) return [C(v * 240), C(v * 190), C(v * 70)]; if (j > h - 6) { const tri = (i % 8) < (j - (h - 6)) * 1.3 ? 0 : 1; if (!tri) return [0, 0, 0, 0]; } return [C(v * 150), C(v * 28), C(v * 30)]; }); }),
  carpet: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 1519, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.2; if (i < 3 || i > w - 4) return [C(v * 230), C(v * 180), C(v * 70)]; if ((j % 16 === 8) && Math.abs(i - 15.5) < 6) return [C(v * 220), C(v * 170), C(v * 70)]; return [C(v * 150), C(v * 28), C(v * 32)]; }); }),
  straw: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1521, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.62 + (n(i, j) - 0.5) * 0.3 + (i % 3 === 0 ? -0.08 : 0); return [C(v * 225), C(v * 190), C(v * 110)]; }); }),
  mtn: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1525, [32, 16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.86 + (n(i, j) - 0.5) * 0.22; return [C(v * 255), C(v * 255), C(v * 255)]; }); }, { mip: true }),
  window: () => mk(8, 8, (x, w, h) => { pixels(x, w, h, (i, j) => (i === 3 || i === 4 || j === 3 || j === 4) ? [60, 40, 20] : [255, 200, 120]); }),
  gilded: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1523, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.6 + (n(i, j) - 0.5) * 0.28; if (j % 16 < 2 || i % 16 < 1) v -= 0.25; return [C(v * 255), C(v * 196), C(v * 80)]; }); }, { mip: true }),
};
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- shared pieces
export function materials() {
  return {
    block: mat({ map: TV('block'), rim: 0.4, repeat: [1, 1] }), wall: mat({ map: TV('block'), rim: 0.4, repeat: [22, 4] }), tower: mat({ map: TV('carved'), rim: 0.4, repeat: [2, 4] }), carved: mat({ map: TV('carved'), rim: 0.4 }), turf: mat({ map: TV('turf'), wrap: 0.8 }), plank: mat({ map: TV('plank'), rim: 0.3 }),
    cobble: mat({ map: TV('cobble'), affine: 0.6, color: 0xfff0dc }), mud: mat({ map: TV('mud'), rim: 0.8, color: 0xe0d0c0 }), wood: mat({ map: T('wood'), color: 0xa88a68 }), iron: mat({ map: T('iron'), color: 0xb8b8bc, rim: 1 }), darkIron: mat({ map: T('iron'), color: 0x6a6a70, rim: 1 }),
    glowWin: mat({ map: TV('window'), unlit: true, fogScale: 0.4 }), gold: mat({ map: TV('gilded'), rim: 1 }), straw: mat({ map: TV('straw'), rim: 0.6, wrap: 0.7 }),
    banner: mat({ map: TV('banner'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }), carpet: mat({ map: TV('carpet') }), molten: mat({ map: TV('molten'), unlit: true, fogScale: 0.3 }),
    door: mat({ map: TV('doorStone'), emap: TV('runeGlow'), emissive: 0xff8a30, rim: 0.3 }), brick: mat({ map: T('stone'), color: 0x9a7a6a }),
    lava: mat({ color: 0xffa040, unlit: true, additive: true, opacity: 0.5, fogScale: 0.3, side: THREE.DoubleSide }),
  };
}
// mountain ground with vertex colours: green slopes, grey rock on steep faces, snow on high gentle faces
export function mountainMesh(hf, o = {}) {
  const seg = o.seg ?? 150, half = (o.size ?? 2400) / 2, cx = o.cx ?? 0, cz = o.cz ?? 0;
  const g = new THREE.PlaneGeometry(2, 2, seg, seg); g.rotateX(-Math.PI / 2); const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i), w = p.getZ(i); const x = cx + Math.sign(u) * Math.abs(u) ** 1.6 * half, z = cz + Math.sign(w) * Math.abs(w) ** 1.6 * half; p.setXYZ(i, x, hf(x, z) + (o.dy ?? 0), z); uv.setXY(i, x / 45, z / 45); }
  const f = flat(g); const n = f.attributes.normal, P = f.attributes.position, cols = new Float32Array(n.count * 3);
  const grass = new THREE.Color(o.grass ?? 0x6a8a44), rock = new THREE.Color(o.rock ?? 0x7a7872), snow = new THREE.Color(0xeef2f6), dark = new THREE.Color(0x4a5a34);
  for (let i = 0; i < n.count; i++) { const ny = n.getY(i), y = P.getY(i); const steep = sm(0.72, 0.45, ny); let c = grass.clone().lerp(dark, sm(10, 60, y) * 0.5).lerp(rock, steep); if (y > (o.snowLine ?? 115)) c.lerp(snow, sm(0.55, 0.8, ny) * sm(o.snowLine ?? 115, (o.snowLine ?? 115) + 25, y)); cols.set([c.r, c.g, c.b], i * 3); }
  f.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return mesh(f, mat({ map: TV('mtn'), vertexColors: true, affine: 0.5 }));
}
export function pines(o) {
  const R = rng(o.seed || 1), parts = [], trunks = [];
  for (let i = 0; i < o.count; i++) {
    const x = o.area[0] + R() * (o.area[1] - o.area[0]), z = o.area[2] + R() * (o.area[3] - o.area[2]); if (o.avoid && o.avoid(x, z)) continue;
    const y = o.ground ? o.ground(x, z) : 0, h = (o.h?.[0] ?? 7) + R() * ((o.h?.[1] ?? 14) - (o.h?.[0] ?? 7)), r = h * 0.28;
    trunks.push(xf(prism(5, r * 0.12, r * 0.08, h * 0.3), { p: [x, y - 0.2, z] }));
    for (let k = 0; k < 3; k++) parts.push(xf(prism(7, r * (1 - k * 0.25), 0, h * (0.5 - k * 0.08)), { p: [x, y + h * (0.2 + k * 0.22), z], r: [0, R() * 3, 0] }));
  }
  const g = new THREE.Group();
  mesh(merge(trunks), mat({ map: TW('barkW') }), g); mesh(merge(parts), mat({ map: TW('leaves'), color: o.color ?? 0x8aa878, wrap: 0.85 }), g);
  return g;
}
// a dwarf cottage: stone walls, turf gable roof, a round-topped door, warm windows, a chimney (returns parts by material)
function cottage(B, x, z, y, yaw, R) {
  const w = 3.2 + R() * 1.2, d = 3.8 + R() * 1.6, h = 1.9 + R() * 0.5, a = 0.58, M4 = (g) => { g.applyMatrix4(new THREE.Matrix4().makeRotationY(yaw)); g.translate(x, y, z); return g; };
  B.block.push(M4(box(w, h, d, 'bottom')));
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, Math.tan(a) * w / 2); tri.closePath();
  for (const s of [-1, 1]) { const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); tg.translate(0, h, s > 0 ? d / 2 - 0.3 : -d / 2); B.block.push(M4(tg));
    const sl = box(w / 2 / Math.cos(a) + 0.4, 0.28, d + 0.6); sl.applyMatrix4(new THREE.Matrix4().makeRotationZ(-s * a)); sl.translate(s * w / 4, h + Math.tan(a) * w / 4 + 0.12, 0); B.turf.push(M4(sl)); }
  B.wood.push(M4(xf(box(0.95, 1.3, 0.12, 'bottom'), { p: [0, 0, d / 2 + 0.02] }))); B.wood.push(M4(xf(prism(8, 0.475, 0.475, 0.12), { p: [0, 1.3, d / 2 + 0.02], r: [Math.PI / 2, 0, 0] })));
  for (const s of [-1, 1]) B.glow.push(M4(xf(box(0.06, 0.45, 0.5), { p: [s * (w / 2 + 0.01), 0.9, 0.4] })));
  B.glow.push(M4(xf(box(0.5, 0.45, 0.06), { p: [w * 0.28, 1.0, d / 2 + 0.01] })));
  const chim = [w * 0.25, h + Math.tan(a) * w * 0.25, -d * 0.2]; B.block.push(M4(xf(box(0.55, 1.6, 0.55, 'bottom'), { p: chim })));
  const c = v3(chim[0], chim[1] + 1.6, chim[2]).applyAxisAngle(v3(0, 1, 0), yaw).add(v3(x, y, z));
  return c;
}
function bucketMeshes(B, M, parent) { for (const k in B) if (B[k].length) mesh(merge(B[k]), M[k], parent); }

// ---------------------------------------------------------------- the valley and the village
export const VALLEY_SKY = { horizon: 0xe8dcc0, top: 0x5a88b8, bottom: 0x6a7a5a, cloud: 0xb8bcc0, cloudLit: 0xfff2d8, sunCol: 0xffe0a0, cover: 0.52, sunDir: v3(-0.5, 0.35, -0.6) };
export const VALLEY_ENV = { fog: [60, 2200], fogCol: 0xd4dcd8, hfog: [2, 20, 0.25, 0.003], lightDir: v3(0.5, -0.55, 0.6), lightCol: 0xfff0d0, ambient: 0x5a6656, rim: 0xffe8c0, fillDir: v3(-0.4, -0.3, -0.8), fillCol: 0x3a4640 };
export function valleyHF() {
  const rg = ridged(77);
  return (x, z) => { const ax = Math.abs(x - Math.sin(z * 0.004) * 20); const side = Math.pow(sm(65, 520, ax), 1.25) * (rg(x, z) * 75 + 120), end = Math.pow(sm(-185, -640, z), 1.2) * (rg(x * 1.2, z) * 80 + 150), back = sm(110, 520, z) * (rg(x, z * 1.3) * 50 + 90);
    return 0.35 * Math.sin(x * 0.07) * Math.cos(z * 0.05) * sm(12, 40, Math.hypot(x, z)) + side + end + back; };
}
export function valleyWorld(o = {}) {
  const scene = new THREE.Scene(), M = materials(), hf = valleyHF();
  const sk = sky(VALLEY_SKY); scene.add(sk);
  scene.add(mountainMesh(hf, { size: 4400, seg: 190, snowLine: 175, grass: 0x6a9044 }));
  scene.add(terrainAt(0, -10, 120, 70, hf, { map: TW('grass') }));
  // the village square
  scene.add(mesh(new THREE.CircleGeometry(9, 18), M.cobble, null, [0, hf(0, 0) + 0.05, 0], [-Math.PI / 2, 0, 0]));
  const road = new THREE.PlaneGeometry(4, 90, 1, 30); road.rotateX(-Math.PI / 2); const rp = road.attributes.position; for (let i = 0; i < rp.count; i++) { const x = rp.getX(i) + Math.sin(rp.getZ(i) * 0.05) * 3, z = rp.getZ(i) - 50; rp.setXYZ(i, x, hf(x, z) + 0.06, z); }
  scene.add(mesh(flat(road), M.cobble));
  // cottages around the square and along the road to the mountain
  const B = { block: [], turf: [], wood: [], glow: [] }, R = rng(o.seed || 11), chimneys = [], spots = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.3; if (Math.abs(Math.sin(a)) < 0.25 && Math.cos(a) < 0) continue; const r = 15 + R() * 3; spots.push([Math.sin(a) * r, Math.cos(a) * r, Math.atan2(-Math.sin(a), -Math.cos(a))]); }
  for (let k = 0; k < 8; k++) for (const s of [-1, 1]) { const z = -18 - k * 10 - R() * 3, x = s * (7 + R() * 3) + Math.sin(z * 0.05) * 3; spots.push([x, z, s > 0 ? -Math.PI / 2 : Math.PI / 2]); }
  for (const [x, z, yaw] of spots) chimneys.push(cottage(B, x, z, hf(x, z) - 0.1, yaw, R));
  const vg = new THREE.Group(); bucketMeshes(B, M, vg); scene.add(vg);
  chimneys.slice(0, 12).forEach((c, i) => scene.add(smokeP({ origin: c, spread: v3(0.2, 0.2, 0.2), vel: v3(0.4, 1.4, 0.1), size: 1.2, count: 24, life: 4, seed: 300 + i, opacity: 0.35 })));
  // the well, barrels, crates, fences
  const P = { block: [], wood: [], turf: [] };
  const WX = 6.5, WZ = -4.5; P.block.push(xf(prism(10, 1.0, 1.0, 0.8, 'bottom', false), { p: [WX, 0, WZ] }));
  for (const s of [-1, 1]) P.wood.push(xf(box(0.15, 2.0, 0.15, 'bottom'), { p: [WX + s * 0.9, 0, WZ] })); P.wood.push(xf(box(2.2, 0.15, 0.15), { p: [WX, 2.0, WZ] }));
  P.turf.push(xf(prism(4, 1.5, 0.05, 0.8), { p: [WX, 2.05, WZ], r: [0, Math.PI / 4, 0] }));
  for (let i = 0; i < 18; i++) { const a = R() * 6.28, r = 7 + R() * 2.5, x = Math.sin(a) * r, z = Math.cos(a) * r; if ((Math.abs(x) < 3 && z < 0) || z > 1.5) continue; P.wood.push(xf(prism(8, 0.32, 0.36, 0.8, 'bottom'), { p: [x, hf(x, z), z] })); }
  bucketMeshes(P, M, scene);
  // pines on the lower slopes, grass, bushes
  const avoid = (x, z) => Math.hypot(x, z) < 26 || (Math.abs(x) < 16 && z < 0 && z > -110);
  scene.add(pines({ count: 420, area: [-170, 170, -260, 120], ground: hf, avoid, seed: 12, h: [8, 16] }));
  scene.add(grassTufts({ count: 1400, area: [-50, 50, -60, 40], ground: hf, avoid: (x, z) => Math.hypot(x, z) < 10, seed: 13, color: 0x6a8a3e }));
  // the fortress gate carved into the mountain at the head of the valley
  const gate = dwarfGate({ statues: true, glowInside: true }); gate.position.set(0, hf(0, -182) - 2, -182); scene.add(gate);
  scene.add(sunShafts({ count: 6, area: [-30, 30, -30, 20], height: 40, opacity: 0.05, motes: 200 }));
  return { scene, sk, hf, M, gate };
}

// ---------------------------------------------------------------- the family home
export const HOME_ENV = { fog: [6, 60], fogCol: 0x3a2a20, hfog: [0, 1, 0, 0], lightDir: v3(0.6, -0.5, -0.4), lightCol: 0xffd8a0, ambient: 0x4a3a32, rim: 0xffb070, fillDir: v3(-0.4, -0.2, 0.8), fillCol: 0x2a2228 };
export function homeInterior(o = {}) {
  const scene = new THREE.Scene(), M = materials();
  const W = 8, D = 7, H = 3.2;
  scene.add(mesh(new THREE.PlaneGeometry(W, D), M.plank, null, [0, 0, 0], [-Math.PI / 2, 0, 0]));
  for (const [p, r, w] of [[[0, H / 2, -D / 2], [0, 0, 0], W], [[-W / 2, H / 2, 0], [0, Math.PI / 2, 0], D], [[W / 2, H / 2, 0], [0, -Math.PI / 2, 0], D], [[0, H / 2, D / 2], [0, Math.PI, 0], W]]) { const g = new THREE.PlaneGeometry(w, H); mesh(g, M.block, scene, p, r); }
  mesh(new THREE.PlaneGeometry(W, D), M.plank, scene, [0, H, 0], [Math.PI / 2, 0, 0]);
  for (let i = -1; i <= 1; i++) mesh(box(0.25, 0.3, D), M.wood, scene, [i * 2.4, H - 0.15, 0]);
  // hearth on the back wall with a fire
  mesh(box(2.4, 1.6, 0.8, 'bottom'), M.block, scene, [-1.6, 0, -D / 2 + 0.4]); mesh(box(1.4, 0.9, 0.82, 'bottom'), mat({ color: 0x140a06, unlit: true }), scene, [-1.6, 0.1, -D / 2 + 0.42]);
  mesh(box(2.8, 0.2, 1.0), M.block, scene, [-1.6, 1.6, -D / 2 + 0.5]); mesh(box(1.4, 1.6, 0.6, 'bottom'), M.block, scene, [-1.6, 1.7, -D / 2 + 0.3]);
  const fireOrigin = v3(-1.6, 0.25, -D / 2 + 0.55); scene.add(fireP({ origin: fireOrigin, spread: v3(0.35, 0.05, 0.12), vel: v3(0, 0.9, 0), size: 0.32, count: 60, life: 0.6, seed: 401 }));
  const fg = glow(0xff9a40, 2.4, 0.5); fg.position.copy(fireOrigin).add(v3(0, 0.3, 0.2)); scene.add(fg);
  // a window with a shaft of morning sun
  mesh(box(0.08, 0.9, 1.0), M.glowWin, scene, [W / 2 - 0.02, 1.7, -0.8]);
  const shaft = mesh(new THREE.PlaneGeometry(1.0, 5), mat({ color: 0xfff0c8, unlit: true, additive: true, opacity: 0.12, side: THREE.DoubleSide, fogScale: 0.2 }), scene, [W / 2 - 1.4, 1.4, -0.8], [0, Math.PI / 2, 0.9]);
  // table, mugs, shelves, a sack of flour, hanging herbs
  mesh(box(1.6, 0.08, 0.9), M.wood, scene, [2.2, 0.72, 1.4]); for (const [x, z] of [[1.5, 1.05], [2.9, 1.05], [1.5, 1.75], [2.9, 1.75]]) mesh(box(0.08, 0.72, 0.08, 'bottom'), M.wood, scene, [x, 0, z]);
  for (let i = 0; i < 3; i++) mesh(prism(7, 0.05, 0.055, 0.12, 'bottom'), M.iron, scene, [1.9 + i * 0.3, 0.76, 1.3 + (i % 2) * 0.2]);
  for (const y of [1.2, 1.8]) mesh(box(1.8, 0.06, 0.35), M.wood, scene, [2.2, y, -D / 2 + 0.2]);
  for (let i = 0; i < 6; i++) mesh(prism(6, 0.08, 0.07, 0.22, 'bottom'), [M.iron, M.wood, M.straw][i % 3], scene, [1.5 + i * 0.28, 1.86, -D / 2 + 0.2]);
  // the cradle on rockers
  const cradle = group(scene, [0.2, 0, 0.2]);
  for (const s of [-1, 1]) { mesh(box(0.06, 0.4, 1.1, 'bottom'), M.wood, cradle, [s * 0.36, 0.16, 0]); const rk = new THREE.TorusGeometry(0.9, 0.035, 3, 12, 1.2); rk.rotateZ(-Math.PI / 2 - 0.6); rk.rotateY(Math.PI / 2); mesh(rk, M.wood, cradle, [s * 0.32, 1.02, 0]); }
  for (const s of [-1, 1]) mesh(box(0.78, 0.48, 0.06, 'bottom'), M.wood, cradle, [0, 0.16, s * 0.55]);
  mesh(box(0.72, 0.05, 1.08), M.wood, cradle, [0, 0.2, 0]); mesh(box(0.66, 0.06, 1.0), mat({ map: TD('diaper'), color: 0xe8d8c0 }), cradle, [0, 0.25, 0]);
  return { scene, M, cradle, fireOrigin, D, W };
}

// ---------------------------------------------------------------- the training courtyard (inside the fortress walls)
export const YARD_ENV = { fog: [30, 700], fogCol: 0xd4d0c0, hfog: [1, 12, 0.35, 0.006], lightDir: v3(0.6, -0.6, 0.5), lightCol: 0xffecc8, ambient: 0x5e605a, rim: 0xffe0b0, fillDir: v3(-0.4, -0.3, -0.8), fillCol: 0x3a4040 };
export function courtyard(o = {}) {
  const scene = new THREE.Scene(), M = materials(), hf = valleyHF();
  scene.add(sky(VALLEY_SKY));
  const mtn = mountainMesh(hf, { size: 3000, seg: 120 }); mtn.position.set(0, -10, 0); scene.add(mtn);
  scene.add(mesh(new THREE.PlaneGeometry(40, 40, 1, 1), mat({ map: TV('cobble'), color: 0xfff0dc, repeat: [9, 9] }), null, [0, 0, 0], [-Math.PI / 2, 0, 0]));
  // walls with crenellations and an arched gate
  const B = { block: [], carved: [], wood: [] };
  for (const [x, z, w, d] of [[0, -20, 40, 3], [0, 20, 40, 3], [-20, 0, 3, 40], [20, 0, 3, 40]]) { B.block.push(xf(box(w, 9, d, 'bottom'), { p: [x, 0, z] })); for (let k = -w / 2 + 1; k < w / 2; k += 2.2) if (w > d) B.block.push(xf(box(1.1, 1.2, d, 'bottom'), { p: [x + k, 9, z] })); for (let k = -d / 2 + 1; k < d / 2; k += 2.2) if (d > w) B.block.push(xf(box(w, 1.2, 1.1, 'bottom'), { p: [x, 9, z + k] })); }
  for (const [x, z] of [[-20, -20], [20, -20], [-20, 20], [20, 20]]) B.carved.push(xf(box(6, 14, 6, 'bottom'), { p: [x, 0, z] }));
  B.carved.push(xf(box(6, 9.6, 3.4, 'bottom'), { p: [0, 0, -20] })); B.wood.push(xf(box(4.2, 6.5, 0.4, 'bottom'), { p: [0, 0, -18.2] }));
  bucketMeshes(B, M, scene);
  // banners on the walls
  for (let k = -3; k <= 3; k += 2) mesh(new THREE.PlaneGeometry(2.2, 5), M.banner, scene, [k * 4.2, 6.2, -18.45]);
  // training dummies, a weapon rack, the mud pit
  const dummy = (x, z, ry) => { const d = group(scene, [x, 0, z], [0, ry, 0]); mesh(box(0.14, 1.9, 0.14, 'bottom'), M.wood, d); mesh(prism(7, 0.3, 0.26, 0.75), M.straw, d, [0, 0.75, 0]); mesh(box(1.1, 0.1, 0.1), M.wood, d, [0, 1.3, 0]); mesh(flat(new THREE.IcosahedronGeometry(0.2, 0)), M.straw, d, [0, 1.75, 0]); mesh(box(0.42, 0.05, 0.03), M.wood, d, [0, 0.9, 0.29], [0, 0, 0.6]); return d; };
  const dummies = [dummy(0, -3.5, 0), dummy(-6, -6, 0.4), dummy(6.5, -7, -0.3)];
  const rack = group(scene, [-12, 0, -8], [0, 0.6, 0]); mesh(box(3, 0.1, 0.1), M.wood, rack, [0, 1.4, 0]); mesh(box(3, 0.1, 0.1), M.wood, rack, [0, 0.3, 0]); for (const x of [-1.4, 1.4]) mesh(box(0.1, 1.6, 0.1, 'bottom'), M.wood, rack, [x, 0, 0]);
  for (let i = 0; i < 5; i++) mesh(box(0.04, 1.4, 0.04, 'bottom'), M.wood, rack, [-1 + i * 0.5, 0.05, 0.08], [0.15, 0, 0]);
  const mud = mesh(flat(new THREE.CircleGeometry(2.6, 14)), M.mud, scene, [0.0, 0.03, -0.6], [-Math.PI / 2, 0, 0], [1.3, 0.9, 1]);
  for (let i = 0; i < 4; i++) mesh(flat(new THREE.CircleGeometry(0.6 + i * 0.2, 9)), M.mud, scene, [-7 + i * 4.5, 0.025, 6 + (i % 2) * 3], [-Math.PI / 2, 0, i]);
  return { scene, M, dummies, mud, hf };
}

// ---------------------------------------------------------------- the great underground forge
export const FORGE_ENV = { fog: [10, 120], fogCol: 0x3a2218, hfog: [0, 3, 0.4, 0.04], lightDir: v3(0.3, -0.7, 0.6), lightCol: 0xff9a50, ambient: 0x4a3028, rim: 0xff9040, fillDir: v3(-0.4, -0.2, -0.8), fillCol: 0x2a2028 };
export function forgeHall(o = {}) {
  const scene = new THREE.Scene(), M = materials();
  const W = 30, L = 60, H = 22;
  scene.add(mesh(new THREE.PlaneGeometry(W, L), M.block, null, [0, 0, -L / 2 + 10], [-Math.PI / 2, 0, 0]));
  const B = { carved: [], block: [], brick: [], darkIron: [], molten: [] };
  for (const s of [-1, 1]) B.carved.push(xf(box(2, H, L, 'bottom'), { p: [s * W / 2, 0, -L / 2 + 10] }));
  B.carved.push(xf(box(W, H, 2, 'bottom'), { p: [0, 0, -L + 10] })); B.block.push(xf(box(W, 2, L, 'bottom'), { p: [0, H, -L / 2 + 10] }));
  // massive columns and ribs
  for (let z = 4; z > -L + 12; z -= 9) for (const s of [-1, 1]) { B.carved.push(xf(box(2.6, H, 2.6, 'bottom'), { p: [s * (W / 2 - 3), 0, z] })); B.block.push(xf(box(W - 4, 1.2, 1.6), { p: [0, H - 1.5, z] })); }
  // furnaces along the walls with glowing mouths
  const furnaces = [];
  for (let z = 0; z > -L + 14; z -= 9) for (const s of [-1, 1]) { const x = s * (W / 2 - 5.5), zz = z - 4.5; B.brick.push(xf(box(3.4, 3.6, 3, 'bottom'), { p: [x, 0, zz] })); B.brick.push(xf(prism(6, 1.0, 0.8, 9, 'bottom'), { p: [x, 3.6, zz] })); B.molten.push(xf(box(0.1, 1.2, 1.6), { p: [x - s * 1.71, 0.9, zz] })); furnaces.push(v3(x - s * 1.9, 1.4, zz)); }
  // molten channels crossing the floor
  for (const z of [-8, -26, -40]) B.molten.push(xf(box(W - 6, 0.06, 1.0), { p: [0, 0.02, z] }));
  B.molten.push(xf(box(1.2, 0.06, L - 18), { p: [-6, 0.02, -L / 2 + 8] }));
  bucketMeshes(B, M, scene);
  // the giant round rune door
  const door = group(scene, [0, 0, -L + 11.2]);
  mesh(prism(8, 9, 9, 1.0), M.door, door, [0, 9.2, 0], [Math.PI / 2, Math.PI / 8, 0]);
  mesh(prism(8, 10.2, 10.2, 0.6), M.darkIron, door, [0, 9.2, -0.3], [Math.PI / 2, Math.PI / 8, 0]);
  const dg = glow(0xff7a20, 22, 0.25); dg.position.set(0, 9.2, 1.5); door.add(dg);
  // anvils (the hero's in front) and a crucible pouring molten metal
  const anvil = (x, z, ry) => { const a = group(scene, [x, 0, z], [0, ry, 0]); mesh(taper(0.5, 0.4, 0.34, 0.26, 0.5), M.darkIron, a); mesh(taper(0.3, 0.24, 0.28, 0.22, 0.12), M.darkIron, a, [0, 0.5, 0]); mesh(box(0.9, 0.14, 0.3), M.iron, a, [0.08, 0.68, 0]); mesh(prism(4, 0.1, 0.0, 0.34), M.iron, a, [0.62, 0.68, 0], [0, 0, -Math.PI / 2]); return a; };
  const anvils = [anvil(0, 0, 0), anvil(-6, -6, 0.5), anvil(6, -7, -0.4), anvil(-5, -15, 0.2), anvil(5.5, -17, -0.2)];
  const crucible = group(scene, [8, 7, -24], [0, 0, 0.9]); mesh(prism(8, 0.8, 1.1, 1.4), M.darkIron, crucible); for (const s of [-1, 1]) mesh(box(0.08, 7, 0.08, 'bottom'), M.darkIron, scene, [8 + s * 0.6, 7.6, -24]);
  scene.add(particles({ mode: 'line', count: 160, origin: v3(9.2, 7.8, -24), lineB: v3(9.4, 0.1, -24), spread: v3(0.12, 0.05, 0.12), vel: v3(0, 0, 0), life: 0.4, size: 0.22, c0: 0xffe8a0, c1: 0xff8a20, c2: 0x801804, seed: 403, soft: true, opacity: 0.9, fogMix: 0.1 }));
  // heat haze sparks, embers drifting up, lamps
  scene.add(particles({ mode: 'drift', count: 500, box: v3(W, 18, L), origin: v3(0, 6, -L / 2 + 10), vel: v3(0.1, 0.8, 0), size: 0.05, c0: 0xffc060, c1: 0xff6010, seed: 405, swirl: 1.2, opacity: 0.9, fogMix: 0.2 }));
  for (const f of furnaces) { const g = glow(0xff8a30, 5, 0.4); g.position.copy(f); scene.add(g); }
  for (const z of [-8, -26, -40]) { const g = glow(0xff9a30, 8, 0.18); g.position.set(0, 0.5, z); scene.add(g); }
  return { scene, M, anvils, furnaces, door, L, W };
}

// ---------------------------------------------------------------- the dwarf fortress gate (in the valley and on the battlefield)
export function dwarfGate(o = {}) {
  const g = new THREE.Group(), M = materials();
  const B = { carved: [], block: [], darkIron: [], gold: [] };
  const GW = 16, GH = 26;
  B.carved.push(xf(box(28, 60, 10, 'bottom'), { p: [-(GW / 2 + 14), 0, 0] })); B.carved.push(xf(box(28, 60, 10, 'bottom'), { p: [GW / 2 + 14, 0, 0] }));
  B.carved.push(xf(box(GW + 2, 60 - GH, 10, 'bottom'), { p: [0, GH, 0] }));
  for (const s of [-1, 1]) for (const x of [GW / 2 + 2, GW / 2 + 22]) { B.block.push(xf(box(4, 48, 4, 'bottom'), { p: [s * x, 0, 5.5] })); B.gold.push(xf(box(5, 1.2, 5), { p: [s * x, 48, 5.5] })); }
  B.block.push(xf(box(GW + 8, 4, 6), { p: [0, GH + 2, 6] })); B.gold.push(xf(box(GW + 9, 0.8, 6.4), { p: [0, GH + 4.3, 6] }));
  // a stepped chevron crown over the gate
  for (let k = 0; k < 5; k++) B.block.push(xf(box(GW + 6 - k * 4, 3, 5), { p: [0, GH + 6 + k * 3, 5] }));
  B.block.push(xf(box(70, 4, 12, 'bottom'), { p: [0, -2, 2] }));
  bucketMeshes(B, M, g);
  // the doors (open with o.open 0..1)
  const doors = []; for (const s of [-1, 1]) { const dg = group(g, [s * GW / 2, 0, 3.5]); const dm = mesh(box(GW / 2, GH, 1.2, 'bottom'), M.darkIron, dg, [-s * GW / 4, 0, 0]); for (let k = 1; k < 5; k++) mesh(box(GW / 2 - 0.4, 0.5, 1.4), M.gold, dg, [-s * GW / 4, k * GH / 5, 0]); doors.push(dg); }
  mesh(box(GW + 0.4, GH + 0.4, 12, 'bottom'), mat({ color: 0x1a120e, side: THREE.BackSide, fogScale: 0.5 }), g, [0, -0.2, -2.6]);
  const tg = glow(0xff9040, 14, 0.35); tg.position.set(0, GH * 0.4, -7); g.add(tg);
  if (o.glowInside) { const gl = mesh(new THREE.PlaneGeometry(GW, GH), mat({ color: 0xff9a40, unlit: true, fogScale: 0.5 }), g, [0, GH / 2, 2.0]); const gg = glow(0xffa040, 40, 0.3); gg.position.set(0, GH / 2, 6); g.add(gg); }
  // colossal guardian statues
  if (o.statues) {
    const stone = mat({ map: TV('carved'), rim: 0.5, color: 0xd8d0c4 });
    for (const s of [-1, 1]) { const st = buildDwarfNPC({ seed: 20 + s, armor: true, helmet: true }); st.root.traverse(m => { if (m.isMesh) m.material = stone; }); applyStatuePose(st, s); st.root.scale.setScalar(19); st.root.position.set(s * (GW / 2 + 12), 0, 10); st.root.rotation.y = 0; g.add(st.root); }
  }
  g.userData = { doors, GW, GH };
  return g;
}
function applyStatuePose(st, s) { st.pelvis.position.y = st.hipH; st.armL.rotation.set(-0.9, 0, -0.2); st.foreL.rotation.set(-1.2, 0, 0); st.armR.rotation.set(-0.9, 0, 0.2); st.foreR.rotation.set(-1.2, 0, 0); const ax = new THREE.Group(); const hm = mat({ map: TV('carved'), rim: 0.5, color: 0xd8d0c4 }); mesh(box(0.06, 1.3, 0.06, 'bottom'), hm, ax, [0, -0.1, 0]); mesh(box(0.42, 0.34, 0.05), hm, ax, [0.16, 1.05, 0]); st.root.add(ax); ax.position.set(0, 0, 0.38); }
export function setGate(gate, open) { const [L, R] = gate.userData.doors; L.rotation.y = open * 1.3; R.rotation.y = -open * 1.3; }

// ---------------------------------------------------------------- the fortress and the battlefield at dusk
export const DUSK_SKY = { horizon: 0xf0a060, top: 0x3a4068, bottom: 0x4a3430, cloud: 0x6a4a48, cloudLit: 0xffb070, sunCol: 0xffa050, cover: 0.46, sunDir: v3(0.2, 0.12, 1) };
export const DUSK_ENV = { fog: [30, 900], fogCol: 0xb88468, hfog: [1, 14, 0.45, 0.008], lightDir: v3(-0.2, -0.35, -1.0), lightCol: 0xffc080, ambient: 0x4a4048, rim: 0xffa060, fillDir: v3(0.3, -0.4, 0.9), fillCol: 0x30303e };
export function fortressHF() {
  const rg = ridged(91);
  return (x, z) => { const cliff = sm(-45, -62, z); const sides = sm(110, 260, Math.abs(x)); return 0.5 * Math.sin(x * 0.04) * Math.cos(z * 0.03) + cliff * (90 + rg(x, z) * 30) + sides * (rg(x * 1.3, z) * 40 + 50) * sm(-200, 100, z); };
}
export function fortressWorld(o = {}) {
  const scene = new THREE.Scene(), M = materials(), hf = fortressHF();
  const sk = sky(DUSK_SKY); scene.add(sk);
  scene.add(mountainMesh(hf, { size: 3000, seg: 170, cz: 40, grass: 0x6a7a48, rock: 0x6a6460, snowLine: 140 }));
  scene.add(terrainAt(0, 40, 160, 80, hf, { map: TW('dirt'), color: 0xc8b8a0 }));
  const gate = dwarfGate({ statues: true }); gate.position.set(0, hf(0, -34) - 1.5, -38); scene.add(gate);
  // ramparts across the valley mouth with towers and braziers
  const B = { wall: [], block: [], tower: [], gold: [] };
  for (const s of [-1, 1]) { B.wall.push(xf(box(90, 16, 7, 'bottom'), { p: [s * 78, -2, -32] })); for (let x = 36; x < 122; x += 2.4) B.block.push(xf(box(1.2, 1.6, 1.0, 'bottom'), { p: [s * x, 14, -29.0] })); for (const x of [44, 74, 104]) { B.tower.push(xf(box(9, 26, 9, 'bottom'), { p: [s * x, -2, -32] })); B.gold.push(xf(box(10, 1, 10), { p: [s * x, 24, -32] })); } }
  bucketMeshes(B, M, scene);
  const braziers = []; for (const s of [-1, 1]) for (const x of [30, 44, 59, 74, 89, 104]) { const p = v3(s * x, 15.2, -29); braziers.push(p); mesh(prism(6, 0.5, 0.8, 1.0), M.darkIron, scene, p.clone().add(v3(0, -0.8, 0)).toArray()); }
  braziers.forEach((p, i) => { scene.add(fireP({ origin: p, spread: v3(0.4, 0.1, 0.4), vel: v3(0, 2.4, 0), size: 0.7, count: 30, seed: 500 + i, life: 0.7 })); const gl = glow(0xff9040, 5, 0.45); gl.position.copy(p).add(v3(0, 0.6, 0)); scene.add(gl); });
  // dwarf warriors on the ramparts
  const wpos = []; const R = rng(7); for (const s of [-1, 1]) for (let x = 14; x < 120; x += 1.3) { if (R() < 0.15) continue; wpos.push(v3(s * x, 14, -31 + (R() - 0.5) * 2)); }
  const wall = new THREE.Group(); scene.add(wall);
  return { scene, sk, M, hf, gate, braziers, wpos, wall };
}

// ---------------------------------------------------------------- the throne hall
export const HALL_ENV = { fog: [20, 220], fogCol: 0x6a5040, hfog: [0, 3, 0.3, 0.02], lightDir: v3(0.4, -0.7, 0.5), lightCol: 0xffe0a8, ambient: 0x5a4a40, rim: 0xffd080, fillDir: v3(-0.4, -0.3, -0.8), fillCol: 0x3a3030 };
export function throneHall(o = {}) {
  const scene = new THREE.Scene(), M = materials();
  const W = 40, L = 110, H = 34, z0 = 10;
  scene.add(mesh(new THREE.PlaneGeometry(W, L), mat({ map: TV('block'), color: 0xc8beb0, repeat: [4, 10] }), null, [0, 0, z0 - L / 2], [-Math.PI / 2, 0, 0]));
  scene.add(mesh(new THREE.PlaneGeometry(5, L - 12), M.carpet, null, [0, 0.03, z0 - L / 2 + 6], [-Math.PI / 2, 0, 0]));
  const B = { carved: [], block: [], gold: [] };
  for (const s of [-1, 1]) B.carved.push(xf(box(2, H, L, 'bottom'), { p: [s * W / 2, 0, z0 - L / 2] }));
  B.carved.push(xf(box(W, H, 2, 'bottom'), { p: [0, 0, z0 - L] })); B.block.push(xf(box(W, 2, L, 'bottom'), { p: [0, H, z0 - L / 2] }));
  for (let z = 4; z > -L + 16; z -= 10) for (const s of [-1, 1]) { B.carved.push(xf(box(3.4, H, 3.4, 'bottom'), { p: [s * 13, 0, z] })); B.gold.push(xf(box(4.0, 1, 4.0), { p: [s * 13, 6, z] })); B.gold.push(xf(box(4.2, 1.2, 4.2), { p: [s * 13, H - 2, z] })); B.block.push(xf(box(26, 2, 2.2), { p: [0, H - 3, z] })); }
  // the dais and the golden throne (with an unusually wide seat)
  const tz = -L + 26; B.block.push(xf(box(16, 1.0, 12, 'bottom'), { p: [0, 0, tz] })); B.block.push(xf(box(11, 1.0, 8, 'bottom'), { p: [0, 1.0, tz - 1] })); B.gold.push(xf(box(16.4, 0.2, 12.4), { p: [0, 1.0, tz] }));
  bucketMeshes(B, M, scene);
  const throne = group(scene, [0, 2.0, tz - 1.5]);
  mesh(box(2.2, 0.75, 1.5, 'bottom'), M.gold, throne); mesh(box(2.3, 0.14, 1.6), M.carpet, throne, [0, 0.78, 0.05]);
  mesh(box(2.2, 3.4, 0.35, 'bottom'), M.gold, throne, [0, 0.75, -0.62]); mesh(prism(4, 0.9, 0.0, 1.3), M.gold, throne, [0, 4.1, -0.62], [0, Math.PI / 4, 0]);
  for (const s of [-1, 1]) { mesh(box(0.3, 0.28, 1.5, 'bottom'), M.gold, throne, [s * 1.15, 0.75, 0]); mesh(flat(new THREE.OctahedronGeometry(0.16, 0)), mat({ color: 0xd02020, emissive: 0x600808, unlit: true }), throne, [s * 1.15, 1.15, 0.6]); }
  mesh(box(0.14, 2.0, 0.08), M.darkIron, throne, [0, 2.2, -0.42]); mesh(box(0.9, 0.7, 0.06), M.iron, throne, [0.3, 2.9, -0.42]);
  // braziers along the carpet, banners between columns, sun shafts from high windows
  const fires = []; for (let z = 0; z > -L + 30; z -= 10) for (const s of [-1, 1]) { const p = v3(s * 6, 1.6, z - 5); fires.push(p); mesh(prism(6, 0.4, 0.7, 1.4, 'bottom'), M.darkIron, scene, [s * 6, 0, z - 5]); }
  fires.forEach((p, i) => { scene.add(fireP({ origin: p, spread: v3(0.3, 0.1, 0.3), vel: v3(0, 1.8, 0), size: 0.5, count: 24, seed: 700 + i, life: 0.6 })); const gl = glow(0xffa040, 4, 0.4); gl.position.copy(p).add(v3(0, 0.5, 0)); scene.add(gl); });
  for (let z = -1; z > -L + 16; z -= 10) for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(3.2, 12), M.banner, scene, [s * 13, H - 10, z - 5], [0, s * Math.PI / 2, 0]);
  for (const s of [-1, 1]) for (let z = 0; z > -L + 20; z -= 20) mesh(new THREE.PlaneGeometry(4, 40), mat({ color: 0xfff0c8, unlit: true, additive: true, opacity: 0.07, side: THREE.DoubleSide, fogScale: 0.2 }), scene, [s * 6, H / 2, z - 8], [0, 0, -s * 0.5]);
  scene.add(particles({ mode: 'drift', count: 400, box: v3(W, 20, L), origin: v3(0, 10, z0 - L / 2), vel: v3(0.05, 0.12, 0.02), size: 0.05, c0: 0xfff0c0, seed: 711, swirl: 0.8, opacity: 0.8, fogMix: 0.3 }));
  // the colossal statue of the king, behind the throne
  const statue = buildDwarf('king', { butt: 1 }); const sm2 = mat({ map: TV('gilded'), rim: 1, color: 0xf0e0c0 }); statue.root.traverse(m => { if (m.isMesh) m.material = sm2; }); statue.axe.traverse(m => { if (m.isMesh) m.material = sm2; });
  statue.root.scale.setScalar(11); statue.root.position.set(0, 2.0, -L + 13); statue.root.rotation.y = 1.2; scene.add(statue.root); scene.add(statue.axe);
  return { scene, M, throne, tz, statue, L, W, H, fires };
}
