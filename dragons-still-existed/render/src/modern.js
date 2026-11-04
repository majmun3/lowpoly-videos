// WHAT IF DRAGONS STILL EXISTED? — modern Earth: people (every human shares the same exaggerated proportions, as a plain
// fact of this world), crowds, traffic, vehicles, aircraft, signs, and the gear humans make for dragons.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose, walkPose } from '/the-last-ember/render/src/characters.js';
export { jigWalk, jigKick, setJiggle } from '/born-as-a-dwarf/render/src/dwarf.js';
import { buildDragon, posePart } from '/born-as-a-dragon/render/src/dragon.js';

const cache = {};
export function TM(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const canvasTex = (w, h, draw) => mk(w, h, (x, W, H) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); draw(g, W, H); const m = g.getImageData(0, 0, W, H).data; pixels(x, W, H, (i, j) => { const k = (j * W + i) * 4; return [m[k], m[k + 1], m[k + 2], m[k + 3]]; }); }, { clamp: true });
const MK = {
  fabric: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1801, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.72 + (n(i, j) - 0.5) * 0.16; return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  denim: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1803, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.5 + (n(i, j) - 0.5) * 0.15 + ((i + j) % 3 === 0 ? 0.04 : 0); return [C(v * 120), C(v * 150), C(v * 200)]; }); }),
  hivis: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1805, [8, 4]); pixels(x, w, h, (i, j) => { if (j % 16 > 11 && j % 16 < 14) return [225, 225, 225]; const v = 0.82 + (n(i, j) - 0.5) * 0.1; return [C(v * 255), C(v * 150), C(v * 30)]; }); }),
  camo: () => mk(32, 32, (x, w, h) => { const a = fbm(w, h, 1807, [8, 4]), b = fbm(w, h, 1809, [8, 4]); pixels(x, w, h, (i, j) => { const u = a(i, j), v = b(i, j); if (u > 0.6) return [62, 56, 40]; if (v > 0.58) return [120, 112, 80]; return [86, 96, 62]; }); }),
  skin: () => mk(8, 8, (x, w, h) => { const r = rng(1811); pixels(x, w, h, () => { const v = 0.85 + r() * 0.06; return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  paint: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1813, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.82 + (n(i, j) - 0.5) * 0.08 + (j < 3 ? 0.08 : 0); return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  glass: () => mk(16, 16, (x, w, h) => { pixels(x, w, h, (i, j) => { const v = 0.25 + (j / h) * 0.3 + ((i + j) % 7 === 0 ? 0.15 : 0); return [C(v * 120), C(v * 150), C(v * 190)]; }); }),
  // signs
  noDragon: () => canvasTex(64, 64, (g, W, H) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d81818'; g.lineWidth = 6; g.beginPath(); g.arc(32, 30, 24, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#181818'; dragonGlyph(g, 32, 30, 0.8); g.beginPath(); g.moveTo(15, 13); g.lineTo(49, 47); g.stroke(); g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('NO FLY ZONE', 32, 62); }),
  dragonLane: () => canvasTex(64, 64, (g, W, H) => { g.fillStyle = '#1a5a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(3, 3, W - 6, H - 6); g.fillStyle = '#ffffff'; dragonGlyph(g, 32, 24, 0.7); g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText('DRAGON', 32, 46); g.fillText('AIR LANE', 32, 57); }),
  register: () => canvasTex(64, 64, (g, W, H) => { g.fillStyle = '#ffcc20'; g.fillRect(0, 0, W, H); g.fillStyle = '#181818'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('REGISTERED', 32, 14); g.font = 'bold 14px monospace'; g.fillText('DR-4471', 32, 34); g.fillRect(8, 42, 48, 3); g.fillRect(8, 49, 30, 3); }),
  pad: () => canvasTex(128, 128, (g, W, H) => { g.fillStyle = '#3a3c40'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f0d020'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(64, 64, 44, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#f0d020'; dragonGlyph(g, 64, 60, 1.6); g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('DRAGON LANDING ZONE', 64, 102); }),
  stop: () => canvasTex(32, 32, (g) => { g.fillStyle = '#204a9a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('BUS', 16, 14); g.fillText('STOP', 16, 25); }),
  inspection: () => canvasTex(128, 32, (g) => { g.fillStyle = '#183a6a'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('DRAGON INSPECTION & REGISTRATION', 64, 20); }),
  sanctuary: () => canvasTex(128, 32, (g) => { g.fillStyle = '#2a4a2a'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#f0e8c0'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('NORTHFIELD DRAGON SANCTUARY', 64, 20); }),
  meat: () => canvasTex(64, 32, (g) => { g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#c02020'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('DRAGON FEED CO.', 32, 13); g.fillStyle = '#333'; g.font = '7px sans-serif'; g.fillText('FRESH · 40 TONNES', 32, 24); }),
  police: () => mk(32, 16, (x, w, h) => { pixels(x, w, h, (i, j) => (j > 6 && j < 10) ? [30, 60, 170] : [240, 240, 244]); }),
  shadow: () => canvasTex(64, 64, (g) => { g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#000'; g.beginPath(); g.moveTo(32, 6); g.lineTo(36, 22); g.lineTo(62, 18); g.lineTo(46, 30); g.lineTo(36, 30); g.lineTo(34, 58); g.lineTo(30, 58); g.lineTo(28, 30); g.lineTo(18, 30); g.lineTo(2, 18); g.lineTo(28, 22); g.closePath(); g.fill(); }),
};
function dragonGlyph(g, cx, cy, s) { g.save(); g.translate(cx, cy); g.scale(s, s); g.beginPath(); g.moveTo(0, -12); g.lineTo(3, -4); g.lineTo(18, -9); g.lineTo(9, 1); g.lineTo(3, 1); g.lineTo(2, 12); g.lineTo(-2, 12); g.lineTo(-3, 1); g.lineTo(-9, 1); g.lineTo(-18, -9); g.lineTo(-3, -4); g.closePath(); g.fill(); g.restore(); }

// ---------------------------------------------------------------- people
const SKIN = [0xf0c8a8, 0xd8a080, 0xa87050, 0x6a4430, 0xe8b898];
const HAIR = [0x2a1e18, 0x5a3a24, 0xc8a060, 0x8a4a28, 0x1a1a1a, 0xb0aaa8];
const OUTFIT = {
  casual: (r) => ({ top: [0xc84a3a, 0x3a6aa8, 0xe8e0d0, 0x4a8a5a, 0x2a2a30, 0xd8b040][Math.floor(r() * 6)], bottom: 'denim', shoes: 0xe8e8e8 }),
  office: (r) => ({ top: [0x2a2e3a, 0x3a3a42, 0x4a4038][Math.floor(r() * 3)], bottom: 0x2a2c34, shirt: 0xf0f0f4, tie: [0x8a2020, 0x204a8a][Math.floor(r() * 2)], shoes: 0x1a1414 }),
  police: () => ({ top: 0x1e2a48, bottom: 0x1a2238, cap: 0x141c30, vest: true, shoes: 0x101010 }),
  fire: () => ({ top: 0xa88a50, bottom: 0xa88a50, helmet: 0xd02020, stripes: true, shoes: 0x101010 }),
  pilot: () => ({ top: 0xf0f0f4, bottom: 0x1a1e2a, cap: 0x1a1e2a, shoes: 0x101010 }),
  worker: () => ({ top: 'hivis', bottom: 'denim', helmet: 0xf0d020, shoes: 0x5a4030 }),
  vet: () => ({ top: 0x3a8a7a, bottom: 0x3a8a7a, shoes: 0xf0f0f0 }),
  soldier: () => ({ top: 'camo', bottom: 'camo', helmet: 0x5a6040, shoes: 0x3a3020 }),
};
function clothMat(c) { if (c === 'denim') return mat({ map: TM('denim'), rim: 0.8, wrap: 0.5 }); if (c === 'hivis') return mat({ map: TM('hivis'), rim: 0.8 }); if (c === 'camo') return mat({ map: TM('camo'), rim: 0.8, wrap: 0.5 }); return mat({ map: TM('fabric'), color: c, rim: 0.8, wrap: 0.5 }); }
export function buildPerson(o = {}) {
  const r = rng(o.seed ?? 1); const kind = o.outfit ?? 'casual'; const F = { ...OUTFIT[kind](r), ...(o.colors || {}) };
  const fem = o.female ?? r() < 0.5;
  const M = { skin: mat({ map: TM('skin'), color: o.skin ?? SKIN[Math.floor(r() * SKIN.length)], rim: 0.6, wrap: 0.5 }), hair: mat({ map: TM('fabric'), color: o.hair ?? HAIR[Math.floor(r() * HAIR.length)], rim: 0.8 }),
    top: clothMat(F.top), bottom: clothMat(F.bottom), shoes: mat({ color: F.shoes, rim: 0.6 }), eye: mat({ color: 0x1a1410, unlit: true }), white: mat({ map: TM('fabric'), color: F.shirt ?? 0xf0f0f0 }), tie: mat({ color: F.tie ?? 0x8a2020 }),
    hat: mat({ map: TM('fabric'), color: F.cap ?? F.helmet ?? 0x222222, rim: 1 }), vest: mat({ map: TM('hivis'), rim: 0.8 }), stripe: mat({ color: 0xe8e8c8, emissive: 0x404030, rim: 1 }) };
  const s = o.height ?? (0.94 + r() * 0.12) * (fem ? 0.95 : 1);
  const d = { hip: 0.95, spineOff: 0.06, abd: 0.17, chestH: 0.27, neckH: 0.07, shW: fem ? 0.17 : 0.19, upper: 0.29, fore: 0.26, thigh: 0.45, shin: 0.44, hipW: 0.09 };
  const j = rig(d); j.M = M; j.hipH = d.hip; j.kind = kind;
  mesh(taper(fem ? 0.32 : 0.3, 0.21, 0.31, 0.21, 0.16, { anchor: 'center' }), M.bottom, j.pelvis);
  j.butt = group(j.pelvis, [0, -0.02, -0.07]); const cr = 0.2;
  for (const [sx, nm] of [[-1, 'cheekL'], [1, 'cheekR']]) { const c = mesh(flat(new THREE.IcosahedronGeometry(cr, 1)), M.bottom, j.butt, [sx * cr * 0.56, 0, -cr * 0.5], [0, 0, 0], [1, 0.95, 0.9]); c.userData.y = 0; c.userData.s = [1, 0.95, 0.9]; j[nm] = c; }
  j.jigK = cr / 0.25;
  mesh(taper(fem ? 0.26 : 0.28, 0.19, fem ? 0.3 : 0.32, 0.2, 0.17), M.top, j.spine); mesh(taper(fem ? 0.3 : 0.32, 0.2, fem ? 0.34 : 0.38, 0.22, 0.27), M.top, j.chest);
  if (kind === 'office') { mesh(box(0.1, 0.24, 0.02), M.white, j.chest, [0, 0.12, 0.11]); mesh(box(0.035, 0.2, 0.02), M.tie, j.chest, [0, 0.1, 0.12]); }
  if (kind === 'police') { mesh(taper(0.31, 0.22, 0.4, 0.24, 0.3), M.vest, j.chest, [0, -0.02, 0]); mesh(box(0.08, 0.05, 0.02), mat({ color: 0xe0c050, rim: 1 }), j.chest, [-0.08, 0.2, 0.125]); }
  if (kind === 'fire') { for (const y of [0.05, 0.2]) mesh(box(0.39, 0.03, 0.235), M.stripe, j.chest, [0, y, 0]); }
  if (kind === 'pilot') { mesh(box(0.04, 0.18, 0.02), mat({ color: 0x1a1e2a }), j.chest, [0, 0.1, 0.115]); for (const sx of [-1, 1]) mesh(box(0.06, 0.015, 0.1), mat({ color: 0xe0c050 }), j.chest, [sx * 0.16, 0.27, 0]); }
  if (kind === 'vet') mesh(box(0.06, 0.06, 0.02), M.white, j.chest, [0.07, 0.17, 0.115]);
  mesh(prism(6, 0.05, 0.045, 0.08), M.skin, j.neck);
  const H = group(j.head); j.face = H;
  mesh(box(0.15, 0.2, 0.17, 'bottom'), M.skin, H, [0, 0, 0.01]); mesh(prism(4, 0.018, 0.005, 0.04), M.skin, H, [0, 0.1, 0.098], [1.2, Math.PI / 4, 0]);
  for (const sx of [-1, 1]) mesh(box(0.024, 0.012, 0.01), M.eye, H, [sx * 0.035, 0.122, 0.096]);
  mesh(taper(0.165, 0.185, 0.15, 0.17, 0.06), M.hair, H, [0, 0.185, 0]);
  if (fem) mesh(taper(0.17, 0.08, 0.16, 0.07, 0.22 + r() * 0.12, { anchor: 'top' }), M.hair, H, [0, 0.22, -0.07]); else mesh(taper(0.16, 0.06, 0.155, 0.06, 0.09, { anchor: 'top' }), M.hair, H, [0, 0.21, -0.07]);
  if (F.cap) { mesh(taper(0.18, 0.2, 0.17, 0.19, 0.05), M.hat, H, [0, 0.2, 0]); mesh(box(0.16, 0.012, 0.08), M.hat, H, [0, 0.2, 0.12]); }
  if (F.helmet) { const hm = flat(new THREE.SphereGeometry(0.11, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)); mesh(hm, M.hat, H, [0, 0.17, 0], [0, 0, 0], [1, 0.9, 1.15]); }
  for (const sd of ['L', 'R']) {
    mesh(taper(0.085, 0.085, 0.095, 0.095, 0.29, { anchor: 'top' }), kind === 'casual' ? M.skin : M.top, j['arm' + sd]); if (kind === 'casual') mesh(taper(0.1, 0.1, 0.105, 0.105, 0.12, { anchor: 'top' }), M.top, j['arm' + sd]);
    mesh(taper(0.07, 0.07, 0.08, 0.08, 0.26, { anchor: 'top' }), kind === 'casual' ? M.skin : M.top, j['fore' + sd]); mesh(box(0.055, 0.08, 0.065, 'top'), M.skin, j['hand' + sd]);
    mesh(taper(0.11, 0.12, 0.135, 0.145, 0.45, { anchor: 'top' }), M.bottom, j['thigh' + sd]); mesh(taper(0.085, 0.095, 0.105, 0.115, 0.44, { anchor: 'top' }), M.bottom, j['shin' + sd]);
    mesh(taper(0.09, 0.22, 0.09, 0.17, 0.07, { anchor: 'top', oz: 0.03 }), M.shoes, j['foot' + sd], [0, 0.01, 0.04]);
  }
  j.root.scale.setScalar(s); applyPose(j, { hipY: d.hip });
  return j;
}
export function pWalk(ph, o = {}) { const p = walkPose(ph, { stride: o.stride ?? 0.42, hunch: 0.03, hip: 0.95 }); p.armL = [Math.sin(ph * 6.28) * 0.3, 0, -0.08]; p.armR = [-Math.sin(ph * 6.28) * 0.3, 0, 0.08]; p.foreL = [-0.2, 0, 0]; p.foreR = [-0.2, 0, 0]; return p; }
export function pStand(o = {}) { return { hipY: 0.95, armL: [0.03, 0, -0.08], armR: [0.03, 0, 0.08], foreL: [-0.12, 0, 0], foreR: [-0.12, 0, 0], neck: [o.look ?? 0, 0, 0], head: [o.look ?? 0, 0, 0] }; }
export const LOOKUP = { hipY: 0.95, armL: [0.05, 0, -0.1], armR: [-0.4, 0, 0.1], foreR: [-1.6, 0, 0], neck: [-0.45, 0, 0], head: [-0.35, 0, 0], spine: [-0.08, 0, 0] };

// crowds: three instanced meshes (top, bottom with the backside, skin) sharing one layout
function personParts() {
  const top = merge([xf(taper(0.29, 0.2, 0.32, 0.2, 0.17), { p: [0, 1.0, 0] }), xf(taper(0.32, 0.2, 0.36, 0.22, 0.27), { p: [0, 1.17, 0] }), xf(taper(0.08, 0.08, 0.09, 0.09, 0.55, { anchor: 'top' }), { p: [-0.2, 1.4, 0] }), xf(taper(0.08, 0.08, 0.09, 0.09, 0.55, { anchor: 'top' }), { p: [0.2, 1.4, 0] })]);
  const bot = merge([xf(taper(0.3, 0.21, 0.31, 0.21, 0.16, { anchor: 'center' }), { p: [0, 0.95, 0] }), xf(flat(new THREE.IcosahedronGeometry(0.2, 1)), { p: [-0.112, 0.93, -0.17], s: [1, 0.95, 0.9] }), xf(flat(new THREE.IcosahedronGeometry(0.2, 1)), { p: [0.112, 0.93, -0.17], s: [1, 0.95, 0.9] }),
    xf(taper(0.11, 0.12, 0.135, 0.145, 0.9, { anchor: 'top' }), { p: [-0.09, 0.93, 0] }), xf(taper(0.11, 0.12, 0.135, 0.145, 0.9, { anchor: 'top' }), { p: [0.09, 0.93, 0] })]);
  const skin = merge([xf(box(0.15, 0.2, 0.17, 'bottom'), { p: [0, 1.5, 0.01] }), xf(box(0.055, 0.08, 0.065, 'top'), { p: [-0.2, 0.86, 0] }), xf(box(0.055, 0.08, 0.065, 'top'), { p: [0.2, 0.86, 0] })]);
  return { top, bot, skin };
}
export class Crowd {
  constructor(n, o = {}) {
    const P = personParts(); this.n = n; this.R = rng(o.seed ?? 3);
    this.top = new THREE.InstancedMesh(P.top, mat({ map: TM('fabric'), rim: 0.8, wrap: 0.5 }), n); this.bot = new THREE.InstancedMesh(P.bot, mat({ map: TM('fabric'), rim: 0.8, wrap: 0.5 }), n); this.skin = new THREE.InstancedMesh(P.skin, mat({ map: TM('skin'), rim: 0.5 }), n);
    this.group = new THREE.Group(); for (const m of [this.top, this.bot, this.skin]) { m.frustumCulled = false; this.group.add(m); }
    const tops = [0xc84a3a, 0x3a6aa8, 0xe8e0d0, 0x4a8a5a, 0x2a2a30, 0xd8b040, 0x8a3a6a, 0x2a2e3a], bots = [0x3a5a8a, 0x2a2c34, 0x5a4a3a, 0x8a8a8a, 0x1a1a1a];
    for (let i = 0; i < n; i++) { this.top.setColorAt(i, new THREE.Color(o.tops ? o.tops[i % o.tops.length] : tops[Math.floor(this.R() * tops.length)])); this.bot.setColorAt(i, new THREE.Color(o.bots ? o.bots[i % o.bots.length] : bots[Math.floor(this.R() * bots.length)])); this.skin.setColorAt(i, new THREE.Color(SKIN[Math.floor(this.R() * SKIN.length)])); }
    for (const m of [this.top, this.bot, this.skin]) m.instanceColor.needsUpdate = true;
    this.M4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.sc = Array.from({ length: n }, () => 0.92 + this.R() * 0.14); this.ph = Array.from({ length: n }, () => this.R());
  }
  // fn(i) -> { p, yaw, walk (0/1) }
  set(t, fn) { for (let i = 0; i < this.n; i++) { const s = fn(i); const bob = s.walk ? Math.abs(Math.sin((t * 1.9 + this.ph[i]) * Math.PI * 2)) * 0.04 : 0; this.q.setFromEuler(new THREE.Euler(0, s.yaw ?? 0, s.walk ? Math.sin((t * 1.9 + this.ph[i]) * Math.PI * 2) * 0.04 : 0)); this.M4.compose(s.p.clone().add(v3(0, bob, 0)), this.q, v3(this.sc[i], this.sc[i], this.sc[i])); for (const m of [this.top, this.bot, this.skin]) m.setMatrixAt(i, this.M4); } for (const m of [this.top, this.bot, this.skin]) m.instanceMatrix.needsUpdate = true; }
}

// ---------------------------------------------------------------- vehicles
const PAINT = [0xe8e8ec, 0x1a1a1e, 0x8a1a1a, 0x2a4a8a, 0x8a8a90, 0x3a5a3a, 0xc0b8a8, 0x5a5a60];
function carParts(kind = 'car') {
  if (kind === 'bus') return { body: merge([box(2.5, 2.8, 11.5, 'bottom')].map(g => xf(g, { p: [0, 0.35, 0] }))), glass: merge([xf(box(2.52, 1.0, 10.6), { p: [0, 2.2, 0.2] }), xf(box(2.3, 1.2, 0.05), { p: [0, 2.0, 5.78] })]), dark: wheels(1.1, 4.2, 0.5) };
  if (kind === 'truck') return { body: merge([xf(box(2.4, 1.9, 2.4, 'bottom'), { p: [0, 0.4, 3.4] }), xf(box(2.5, 3.0, 6.8, 'bottom'), { p: [0, 0.5, -1.2] })]), glass: xf(box(2.3, 0.8, 0.05), { p: [0, 1.75, 4.62] }), dark: wheels(1.1, 3.4, 0.5) };
  return { body: merge([xf(box(1.8, 0.7, 4.4, 'bottom'), { p: [0, 0.3, 0] }), xf(taper(1.7, 2.4, 1.5, 1.7, 0.55), { p: [0, 1.0, -0.15] })]), glass: merge([xf(taper(1.72, 2.2, 1.52, 1.6, 0.46), { p: [0, 1.04, -0.15] })]), dark: wheels(0.82, 1.45, 0.33) };
}
function wheels(x, z, r) { const ps = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) ps.push(xf(prism(8, r, r, 0.26, 'center'), { p: [sx * x, r, sz * z], r: [0, 0, Math.PI / 2] })); return merge(ps); }
export class Traffic {
  // lanes: [{x, dir(+1/-1), z0, z1, speed}]
  constructor(lanes, perLane, o = {}) {
    const R = rng(o.seed ?? 7); this.lanes = lanes; this.cars = []; const kinds = o.kinds ?? ['car', 'car', 'car', 'taxi', 'car', 'bus', 'car', 'taxi'];
    const byKind = {}; lanes.forEach((L, li) => { for (let k = 0; k < perLane; k++) { const kind = kinds[Math.floor(R() * kinds.length)]; const ck = kind === 'taxi' ? 'car' : kind; (byKind[ck] ||= []).push({ L, off: (k + R() * 0.5) / perLane, color: kind === 'taxi' ? 0xf0c020 : kind === 'bus' ? 0x2a5aa8 : PAINT[Math.floor(R() * PAINT.length)], kind: ck }); } });
    this.group = new THREE.Group(); this.sets = [];
    for (const [kind, list] of Object.entries(byKind)) { const P = carParts(kind); const n = list.length; const body = new THREE.InstancedMesh(P.body, mat({ map: TM('paint'), rim: 1 }), n), glass = new THREE.InstancedMesh(P.glass, mat({ map: TM('glass'), rim: 1, pierce: 0.5 }), n), dark = new THREE.InstancedMesh(P.dark, mat({ color: 0x141414 }), n); list.forEach((c, i) => body.setColorAt(i, new THREE.Color(c.color))); body.instanceColor.needsUpdate = true; for (const m of [body, glass, dark]) { m.frustumCulled = false; this.group.add(m); } this.sets.push({ list, body, glass, dark, len: kind === 'bus' ? 13 : kind === 'truck' ? 10 : 6 }); }
    this.M4 = new THREE.Matrix4(); this.q = new THREE.Quaternion();
  }
  update(t, o = {}) { const stop = o.stopAt; for (const S of this.sets) { S.list.forEach((c, i) => { const L = c.L; const span = L.z1 - L.z0; let u = (c.off + t * L.speed / Math.abs(span)) % 1; if (L.dir < 0) u = 1 - u; const z = L.z0 + u * span; this.q.setFromEuler(new THREE.Euler(0, L.dir > 0 ? 0 : Math.PI, 0)); this.M4.compose(v3(L.x, L.y ?? 0, z), this.q, v3(1, 1, 1)); for (const m of [S.body, S.glass, S.dark]) m.setMatrixAt(i, this.M4); }); for (const m of [S.body, S.glass, S.dark]) m.instanceMatrix.needsUpdate = true; } }
}
export function vehicle(kind, o = {}) {
  const g = new THREE.Group(); const P = carParts(kind === 'police' || kind === 'taxi' ? 'car' : kind === 'fire' || kind === 'ambulance' || kind === 'meat' ? 'truck' : kind);
  const col = { police: 0xf0f0f4, taxi: 0xf0c020, fire: 0xc81818, ambulance: 0xf0f0f0, meat: 0xf0f0f0, bus: 0x2a5aa8 }[kind] ?? o.color ?? 0x8a8a90;
  mesh(P.body, kind === 'police' ? mat({ map: TM('police'), rim: 1 }) : mat({ map: TM('paint'), color: col, rim: 1 }), g); mesh(P.glass, mat({ map: TM('glass'), rim: 1 }), g); mesh(P.dark, mat({ color: 0x141414 }), g);
  g.userData.lights = [];
  if (kind === 'police' || kind === 'fire' || kind === 'ambulance') { const y = kind === 'police' ? 1.6 : 2.45, z = kind === 'police' ? -0.2 : 3.4; for (const [sx, c] of [[-0.35, 0xff2020], [0.35, 0x2040ff]]) { mesh(box(0.5, 0.14, 0.25), mat({ color: c, emissive: c, unlit: true }), g, [sx, y, z]); const gl = glow(c, 3.0, 0.8); gl.position.set(sx, y + 0.1, z); g.add(gl); g.userData.lights.push(gl); } }
  if (kind === 'fire') { mesh(box(0.3, 0.25, 7.0), mat({ map: T('iron'), color: 0xd8d8dc, rim: 1 }), g, [0, 3.6, -1.0], [0.05, 0, 0]); for (const sx of [-1, 1]) mesh(box(0.05, 0.3, 6.0), mat({ color: 0xe0e0c8, emissive: 0x606040 }), g, [sx * 1.26, 1.2, -1.2]); }
  if (kind === 'ambulance') mesh(box(2.52, 0.25, 6.82), mat({ color: 0xd81818 }), g, [0, 1.8, -1.2]);
  if (kind === 'meat') { const s = mesh(new THREE.PlaneGeometry(6, 2.4), mat({ map: TM('meat'), rim: 0.6 }), g, [1.26, 2.0, -1.2], [0, Math.PI / 2, 0]); mesh(new THREE.PlaneGeometry(6, 2.4), mat({ map: TM('meat'), rim: 0.6 }), g, [-1.26, 2.0, -1.2], [0, -Math.PI / 2, 0]); }
  return g;
}
export function flashLights(v, t) { (v.userData.lights || []).forEach((g, i) => { g.material.opacity = ((Math.floor(t * 6) + i) % 2) ? 0.9 : 0.1; }); }

// ---------------------------------------------------------------- aircraft
export function airliner(o = {}) {
  const g = new THREE.Group(); const M = mat({ map: TM('paint'), color: o.color ?? 0xf0f0f4, rim: 1 }), A = mat({ map: TM('paint'), color: o.accent ?? 0x2a4a9a, rim: 1 }), D = mat({ color: 0x2a2c34, rim: 1 });
  const fus = new THREE.CylinderGeometry(2.0, 2.0, 38, 10, 1); fus.rotateX(Math.PI / 2); mesh(flat(fus), M, g, [0, 3, 0]);
  const nose = new THREE.SphereGeometry(2.0, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); nose.rotateX(Math.PI / 2); mesh(flat(nose), M, g, [0, 3, 19]); mesh(prism(10, 2.0, 0.4, 6), M, g, [0, 3, -19], [-Math.PI / 2, 0, 0]);
  mesh(box(36, 0.35, 5.5), M, g, [0, 2.4, 1], [0, 0, 0]); mesh(box(12, 0.25, 3), M, g, [0, 3.5, -21]); mesh(box(0.3, 7, 4.5), A, g, [0, 6.5, -21], [-0.35, 0, 0]);
  for (const sx of [-1, 1]) { const e = new THREE.CylinderGeometry(1.0, 1.0, 4.2, 10, 1); e.rotateX(Math.PI / 2); mesh(flat(e), D, g, [sx * 8, 1.4, 3]); }
  mesh(box(4.1, 0.6, 38.1), A, g, [0, 3.2, 0]); for (const sx of [-1, 1]) mesh(box(0.05, 0.35, 30), mat({ color: 0x1a2a4a, unlit: true }), g, [sx * 2.0, 3.6, 0]);
  return g;
}
export function fighterJet(o = {}) {
  const g = new THREE.Group(); const M = mat({ map: TM('paint'), color: o.color ?? 0x7a8088, rim: 1 }), D = mat({ map: TM('glass'), rim: 1 });
  const fus = new THREE.CylinderGeometry(0.8, 1.0, 15, 8, 1); fus.rotateX(Math.PI / 2); mesh(flat(fus), M, g, [0, 1.6, 0]); mesh(prism(8, 0.8, 0.0, 4), M, g, [0, 1.6, 9.5], [Math.PI / 2, 0, 0]);
  const wing = new THREE.Shape(); wing.moveTo(0, 3); wing.lineTo(6.5, -3); wing.lineTo(6.5, -4.5); wing.lineTo(0, -4.5); wing.closePath();
  for (const s of [-1, 1]) { const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.15, bevelEnabled: false }); wg.rotateX(Math.PI / 2); const m = mesh(flat(wg), M, g, [0, 1.5, 0]); m.scale.set(s, 1, 1); }
  for (const s of [-1, 1]) mesh(box(0.15, 3.0, 2.8), M, g, [s * 1.2, 3.0, -6.0], [0, 0, s * 0.35]);
  mesh(flat(new THREE.SphereGeometry(0.75, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2)), D, g, [0, 2.3, 4.0], [0, 0, 0], [0.8, 0.9, 2.6]);
  const ab = glow(0xffa050, 2.4, 0); ab.position.set(0, 1.6, -8.2); g.add(ab); g.userData.burner = ab;
  return g;
}
export function helicopter(o = {}) {
  const g = new THREE.Group(); const M = mat({ map: TM('police'), rim: 1 }), D = mat({ map: TM('glass'), rim: 1 }), K = mat({ color: 0x1a1a1a });
  mesh(flat(new THREE.SphereGeometry(1.6, 10, 7)), M, g, [0, 0, 0], [0, 0, 0], [1, 0.9, 1.6]); mesh(flat(new THREE.SphereGeometry(1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)), D, g, [0, 0.0, 1.4], [Math.PI / 2.2, 0, 0], [1, 1, 0.9]);
  mesh(prism(6, 0.4, 0.2, 6), M, g, [0, 0.2, -1.8], [-Math.PI / 2, 0, 0]); mesh(box(0.1, 1.4, 0.8), M, g, [0, 0.8, -7.6]);
  for (const sx of [-1, 1]) mesh(box(0.1, 0.1, 3.2), K, g, [sx * 0.9, -1.55, 0]);
  const rotor = group(g, [0, 1.6, 0]); for (let k = 0; k < 4; k++) mesh(box(0.35, 0.05, 11), K, rotor, [0, 0, 0], [0, k * Math.PI / 4 * 2, 0]); g.userData.rotor = rotor;
  const spot = glow(0xffffff, 3, 0.8); spot.position.set(0, -1.4, 1.8); g.add(spot);
  return g;
}

// ---------------------------------------------------------------- signs and dragon gear
export function signPost(tex, o = {}) { const g = new THREE.Group(); mesh(prism(6, 0.06, 0.06, o.h ?? 3.2), mat({ map: T('iron'), color: 0x9a9aa0 }), g); mesh(new THREE.PlaneGeometry(o.w ?? 1.0, o.hh ?? 1.0), mat({ map: TM(tex), rim: 0.3 }), g, [0, (o.h ?? 3.2) - (o.hh ?? 1.0) / 2, 0.08]); return g; }
// species palettes for the dragon rig (from the dragon project)
export const SPECIES = { slate: [0x7a90b8, 0xd8784a, 0.05], rust: [0xd0884a, 0xa04a2a, 0.08], moss: [0x7aa070, 0x5a6a3a, 0.05], ash: [0xa0a0a8, 0x6a3a3a, 0.12], cobalt: [0x5a7ad0, 0x3a5aa0, 0.06] };
export function buildModernDragon(species = 'slate', o = {}) {
  const d = buildDragon('adult', { scale: o.scale ?? 9 }); const [sc, mem, glowK] = SPECIES[species];
  d.M.scale.uniforms.uColor.value.set(sc).multiplyScalar(2.5); d.M.belly.uniforms.uColor.value.set(new THREE.Color(sc).lerp(new THREE.Color(0xe8d8c0), 0.5)).multiplyScalar(2.6); d.M.membrane.uniforms.uColor.value.set(mem).multiplyScalar(2.2);
  d.M.scale.uniforms.uEmissive.value.setRGB(1, 0.3, 0.1).multiplyScalar(glowK);
  return d;
}
export function saddle(d) { const g = group(d.body, [0, 0.27, 0.12]); const L = mat({ map: T('leather'), color: 0x8a5a3a, rim: 1 }), S = mat({ map: T('iron'), color: 0xc8c8cc, rim: 1 }); mesh(box(0.16, 0.05, 0.22), L, g); mesh(box(0.14, 0.08, 0.03), L, g, [0, 0.05, 0.1]); for (const s of [-1, 1]) { mesh(box(0.015, 0.28, 0.03), L, g, [s * 0.09, -0.13, 0], [0, 0, s * 0.15]); mesh(box(0.03, 0.012, 0.03), S, g, [s * 0.11, -0.27, 0]); } mesh(prism(8, 0.255, 0.255, 0.025, 'center', true), L, d.body, [0, 0, 0.2], [Math.PI / 2, 0, 0]); return g; }
export function regTag(d) { const leg = d.legs.FL?.knee || d.body; const g = mesh(new THREE.PlaneGeometry(0.1, 0.1), mat({ map: TM('register'), side: THREE.DoubleSide }), leg, [0.05, -0.06, 0.03], [0, Math.PI / 2, 0]); return g; }
export function armor(d) { const P = mat({ map: T('iron'), color: 0x5a6050, rim: 1 }); const g = group(d.body); for (let k = 0; k < 4; k++) mesh(box(0.42, 0.04, 0.12), P, g, [0, 0.24 - k * 0.005, 0.3 - k * 0.15], [0.1, 0, 0]); mesh(box(0.2, 0.15, 0.08), P, d.neckBase, [0, 0.1, 0.05]); mesh(box(0.1, 0.06, 0.06), mat({ color: 0x2a2c24 }), g, [0, 0.3, 0.1]); return g; }
export function dragonShadow() { return mesh(new THREE.PlaneGeometry(1, 1), mat({ map: TM('shadow'), color: 0x000000, transparent: true, opacity: 0.4, unlit: true, alphaTest: 0.05, fogScale: 0.5 }), null, [0, 0.05, 0], [-Math.PI / 2, 0, 0]); }
