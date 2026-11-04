// TODAY YOU WILL LEARN HOW TO CAST SPELLS — the wizard (original design) and the spell effects.
// The wizard: tall bent-tip hat with a brass band; midnight-blue robe with wide bell sleeves and glowing teal rune trim;
// a burgundy shoulder mantle with gold edging; long grey beard; leather belt with three potion bottles and a satchel;
// a gnarled wooden staff whose three prongs hold a floating teal crystal.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles, G } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose } from '/the-last-ember/render/src/characters.js';

const cache = {};
export function TZ(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const RUNE = (r, i, j) => { const gi = Math.floor(i / 6), g = (gi * 2654435761) >>> 0; const bits = (g ^ (g >>> 13)) & 0x3f; const x = i % 6, y = j; return (x === 0 || x === 5) ? false : (y === 1 && bits & 1) || (y === 4 && bits & 2) || (x === 1 && bits & 4 && y > 0 && y < 5) || (x === 4 && bits & 8 && y > 0 && y < 5) || (x === y && bits & 16) || (x + y === 5 && bits & 32); };
const MK = {
  robe: () => mk(48, 64, (x, w, h) => { const n = fbm(w, h, 1101, [16, 8, 4, 2]); pixels(x, w, h, (i, j) => { let v = 0.55 + (n(i, j) - 0.5) * 0.3 - (j / h) * 0.08; if (i % 8 === 0) v -= 0.06;
      if (j > h - 8) { if (j === h - 8 || j === h - 1) return [C(200), C(160), C(70)]; return RUNE(0, i, j - (h - 7)) ? [90, 220, 210] : [C(v * 60), C(v * 70), C(v * 140)]; }
      if (i >= 22 && i <= 25) return [C(190), C(150), C(70)];
      return [C(v * 62), C(v * 72), C(v * 150)]; }); }),
  robeE: () => mk(48, 64, (x, w, h) => { pixels(x, w, h, (i, j) => { if (j > h - 8 && j !== h - 8 && j !== h - 1 && RUNE(0, i, j - (h - 7))) return [80, 255, 230]; return [0, 0, 0]; }); }),
  sleeve: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1103, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.55 + (n(i, j) - 0.5) * 0.3; if (j < 6) { if (j === 0 || j === 5) return [200, 160, 70]; return RUNE(0, i, j - 1) ? [90, 220, 210] : [C(v * 60), C(v * 70), C(v * 140)]; } return [C(v * 62), C(v * 72), C(v * 150)]; }); }),
  sleeveE: () => mk(32, 32, (x, w, h) => { pixels(x, w, h, (i, j) => (j > 0 && j < 5 && RUNE(0, i, j - 1)) ? [80, 255, 230] : [0, 0, 0]); }),
  mantle: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1105, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.3; if (j > h - 4) return [C(215), C(170), C(75)]; return [C(v * 140), C(v * 34), C(v * 40)]; }); }),
  beard: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1107, [4, 2]); pixels(x, w, h, (i, j) => { const v = 0.78 + (n(i, j) - 0.5) * 0.25 + (i % 3 === 0 ? -0.08 : 0); return [C(v * 215), C(v * 212), C(v * 205)]; }); }),
  skin: () => mk(8, 8, (x, w, h) => { const r = rng(1109); pixels(x, w, h, () => { const v = 0.6 + r() * 0.06; return [C(v * 230), C(v * 180), C(v * 150)]; }); }),
  hat: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1111, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.5 + (n(i, j) - 0.5) * 0.3; return [C(v * 58), C(v * 68), C(v * 148)]; }); }),
  wood: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1113, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.42 + Math.sin(i * 1.4 + n(i, j) * 5) * 0.06 + (n(i, j) - 0.5) * 0.2; return [C(v * 200), C(v * 145), C(v * 95)]; }); }),
  runeCircle: () => mk(128, 128, (x, w, h) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    g.lineWidth = 2; for (const r of [60, 52, 36, 30]) { g.beginPath(); g.arc(64, 64, r, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, b = a + Math.PI * 2 / 3; g.beginPath(); g.moveTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30); g.lineTo(64 + Math.cos(b) * 30, 64 + Math.sin(b) * 30); g.stroke(); }
    const r = rng(1115); for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; g.save(); g.translate(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); g.rotate(a + Math.PI / 2); for (let s = 0; s < 3; s++) if (r() < 0.7) g.fillRect(-2 + s * 1.5, -3 + (r() * 3), 1.2, 2 + r() * 3); g.restore(); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.arc(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44, 2.2, 0, Math.PI * 2); g.fill(); }
    const m = g.getImageData(0, 0, w, h).data; pixels(x, w, h, (i, j) => { const a = m[(j * w + i) * 4 + 3]; return a > 80 ? [255, 255, 255, 255] : [0, 0, 0, 0]; });
  }, { clamp: true }),
  shield: () => mk(64, 32, (x, w, h) => { pixels(x, w, h, (i, j) => { const edge = (i % 16 === 0) || (j % 16 === 0); const rune = RUNE(0, i % 24, (j % 16) - 5) && (j % 16) > 4 && (j % 16) < 11; const v = edge ? 1.0 : rune ? 0.85 : 0.22 + 0.08 * Math.sin(i * 0.4) * Math.sin(j * 0.5); return [C(v * 150), C(v * 210), C(v * 255)]; }); }),
};

export function wizardMaterials() {
  return {
    robe: mat({ map: TZ('robe'), emap: TZ('robeE'), emissive: 0x80ffe8, rim: 1, wrap: 0.6 }), robeD: mat({ map: TZ('robe'), emap: TZ('robeE'), emissive: 0x80ffe8, rim: 1, wrap: 0.6, side: THREE.DoubleSide }),
    sleeve: mat({ map: TZ('sleeve'), emap: TZ('sleeveE'), emissive: 0x80ffe8, rim: 1, side: THREE.DoubleSide, wrap: 0.6 }),
    mantle: mat({ map: TZ('mantle'), rim: 1, side: THREE.DoubleSide, wrap: 0.6 }), hat: mat({ map: TZ('hat'), rim: 1, side: THREE.DoubleSide, wrap: 0.5 }),
    beard: mat({ map: TZ('beard'), rim: 1, wrap: 0.8, side: THREE.DoubleSide }), skin: mat({ map: TZ('skin'), rim: 0.6, wrap: 0.6 }),
    leather: mat({ map: T('leather'), color: 0xc09a78, rim: 1 }), brass: mat({ map: T('brass'), color: 0xffd8a0 }), wood: mat({ map: TZ('wood'), rim: 1 }),
    eye: mat({ color: 0x101820, emissive: 0x000000, unlit: true }),
    crystal: mat({ color: 0x80fff0, emissive: 0x40c0b0, unlit: true, pierce: 3 }),
    potR: mat({ color: 0xff3020, emissive: 0x801008, unlit: true }), potG: mat({ color: 0x40ff60, emissive: 0x108020, unlit: true }), potB: mat({ color: 0x40a0ff, emissive: 0x102880, unlit: true }), glass: mat({ color: 0xd8e8f0, rim: 1 }),
  };
}
export const W_HIP = 1.0;
export function buildWizard(o = {}) {
  const M = wizardMaterials();
  const d = { hip: W_HIP, spineOff: 0.07, abd: 0.18, chestH: 0.3, neckH: 0.07, shW: 0.21, upper: 0.3, fore: 0.28, thigh: 0.46, shin: 0.46, hipW: 0.1 };
  const j = rig(d);
  // long robe: a flared skirt that reaches the ground, torso, belt with potions and a satchel
  j.skirt = group(j.pelvis, [0, 0.06, 0]); mesh(taper(0.86, 0.7, 0.42, 0.32, 1.0, { anchor: 'top' }), M.robeD, j.skirt);
  mesh(taper(0.36, 0.24, 0.38, 0.25, 0.2), M.robe, j.spine);
  mesh(taper(0.4, 0.26, 0.46, 0.28, 0.3), M.robe, j.chest);
  mesh(box(0.42, 0.07, 0.3), M.leather, j.pelvis, [0, 0.08, 0]); mesh(box(0.07, 0.07, 0.02), M.brass, j.pelvis, [0, 0.08, 0.155]);
  for (const [k, pm] of [[0, M.potR], [1, M.potG], [2, M.potB]]) { const pg = group(j.pelvis, [-0.09 - k * 0.068, 0.06, 0.215 - k * 0.018]); mesh(prism(6, 0.034, 0.037, 0.085, 'top'), pm, pg, [0, -0.02, 0]); mesh(prism(5, 0.012, 0.012, 0.03), M.glass, pg, [0, -0.02, 0]); mesh(box(0.014, 0.012, 0.014), M.leather, pg, [0, 0.012, 0]); }
  mesh(box(0.1, 0.12, 0.06, 'top'), M.leather, j.pelvis, [0.25, 0.07, 0.0]);
  // burgundy shoulder mantle with gold hem
  mesh(taper(0.6, 0.4, 0.28, 0.24, 0.22, { anchor: 'bottom' }), M.mantle, j.chest, [0, 0.12, -0.01]);
  mesh(prism(8, 0.08, 0.075, 0.07), M.skin, j.neck);
  // head: face, bushy brows, long grey beard
  mesh(box(0.17, 0.22, 0.19, 'bottom'), M.skin, j.head, [0, 0.0, 0.01]); mesh(prism(4, 0.022, 0.006, 0.07), M.skin, j.head, [0, 0.1, 0.105], [1.3, 0, 0]);
  j.eyes = []; for (const s of [-1, 1]) { j.eyes.push(mesh(box(0.03, 0.016, 0.01), M.eye, j.head, [s * 0.04, 0.13, 0.102])); mesh(box(0.06, 0.02, 0.03), M.beard, j.head, [s * 0.045, 0.155, 0.1], [0, 0, -s * 0.2]); }
  const beard = group(j.head, [0, 0.06, 0.085], [0.18, 0, 0]); mesh(taper(0.18, 0.08, 0.04, 0.03, 0.46, { anchor: 'top' }), M.beard, beard); j.beard = beard;
  mesh(taper(0.12, 0.03, 0.16, 0.03, 0.03), M.beard, j.head, [0, 0.07, 0.105]);
  mesh(taper(0.19, 0.06, 0.15, 0.05, 0.16, { anchor: 'top' }), M.beard, j.head, [0, 0.14, -0.08]); // hair at the back
  // the hat: wide brim, tall cone with a brass band, tip bent backwards
  const hat = group(j.head, [0, 0.2, -0.005], [-0.08, 0, 0]); j.hat = hat;
  mesh(prism(10, 0.34, 0.33, 0.02, 'bottom'), M.hat, hat);
  mesh(prism(9, 0.155, 0.08, 0.4), M.hat, hat, [0, 0.02, 0]);
  mesh(prism(9, 0.158, 0.15, 0.05, 'bottom', true), M.brass, hat, [0, 0.03, 0]);
  const tip = group(hat, [0, 0.42, 0], [-0.55, 0, 0.12]); mesh(prism(8, 0.08, 0.025, 0.2), M.hat, tip); const tip2 = group(tip, [0, 0.2, 0], [-0.5, 0, 0]); mesh(prism(6, 0.025, 0.0, 0.14), M.hat, tip2);
  // wide bell sleeves and hands
  for (const s of ['L', 'R']) {
    mesh(taper(0.13, 0.13, 0.16, 0.16, d.upper, { anchor: 'top' }), M.robe, j['arm' + s]);
    mesh(taper(0.3, 0.28, 0.15, 0.15, d.fore + 0.05, { anchor: 'top' }), M.sleeve, j['fore' + s]);
    mesh(box(0.08, 0.1, 0.09, 'top'), M.skin, j['hand' + s], [0, 0.02, 0]);
    for (let f = -1; f <= 1; f++) mesh(box(0.018, 0.05, 0.02, 'top'), M.skin, j['hand' + s], [f * 0.024, -0.07, 0.025]);
    mesh(taper(0.12, 0.13, 0.14, 0.15, d.thigh, { anchor: 'top' }), M.robe, j['thigh' + s]); mesh(taper(0.1, 0.11, 0.12, 0.13, d.shin, { anchor: 'top' }), M.robe, j['shin' + s]);
    mesh(taper(0.1, 0.24, 0.11, 0.21, 0.08, { anchor: 'top', oz: 0.03 }), M.leather, j['foot' + s], [0, 0.01, 0.05]);
  }
  j.M = M; j.hipH = d.hip;
  j.staff = buildStaff(M);
  applyPose(j, { hipY: d.hip });
  return j;
}
export function setSkirt(j) { const th = (j.thighL.rotation.x + j.thighR.rotation.x) * 0.5; j.skirt.rotation.x = Math.min(0, th) * 0.6; }
export function setRunes(j, k) { for (const m of [j.M.robe, j.M.robeD, j.M.sleeve]) m.uniforms.uEmissive.value.setRGB(0.5, 1, 0.9).multiplyScalar(0.25 + k * 1.2); }
export function setEyes(j, k, col = [0.5, 1.0, 0.95]) { j.M.eye.uniforms.uColor.value.setRGB(0.06 + col[0] * k, 0.09 + col[1] * k, 0.12 + col[2] * k); }

// the staff: gnarled wood, three prongs holding a floating crystal (separate object; follows the right hand)
export function buildStaff(M) {
  const g = new THREE.Group(); const R = rng(1201);
  const segs = []; let p = v3(0, 0, 0);
  for (let k = 0; k < 6; k++) { const q = p.clone().add(v3((R() - 0.5) * 0.06, 0.3, (R() - 0.5) * 0.06)); const dir = q.clone().sub(p); const len = dir.length(); const sg = prism(5, 0.026 - k * 0.002, 0.024 - k * 0.002, len); sg.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir.normalize()))); sg.translate(p.x, p.y, p.z); segs.push(sg); p = q; }
  segs.push(xf(flat(new THREE.DodecahedronGeometry(0.04, 0)), { p: [p.x, p.y, p.z] }));
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const pr = prism(4, 0.018, 0.004, 0.24); pr.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45))); pr.translate(p.x, p.y, p.z); segs.push(pr); }
  for (let k = 0; k < 3; k++) segs.push(xf(box(0.06, 0.012, 0.06), { p: [0, 0.55 + k * 0.4, 0], r: [0, k, 0] }));
  mesh(merge(segs), M.wood, g);
  const top = p.clone().add(v3(0, 0.2, 0));
  const crystal = mesh(flat(new THREE.OctahedronGeometry(0.075, 0)), M.crystal, g, [top.x, top.y, top.z], [0, 0, 0], [1, 1.6, 1]);
  const cg = glow(0x60fff0, 0.5, 0.4); cg.position.copy(top); g.add(cg);
  g.userData = { crystal, glow: cg, top, grip: 1.05, M };
  return g;
}
// place the staff so its grip sits in the right hand, pointing along dir (default: straight up, slightly forward)
export function holdStaff(j, dir = v3(0, 1, 0.05), t = 0) {
  j.root.updateMatrixWorld(true);
  const h = j.handR.localToWorld(v3(0, -0.05, 0.02)), s = j.staff;
  const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize());
  s.quaternion.copy(q); s.position.copy(h).sub(v3(0, s.userData.grip, 0).applyQuaternion(q));
  const c = s.userData.crystal; c.rotation.y = t * 1.6; c.position.y = s.userData.top.y + Math.sin(t * 2.2) * 0.015;
  s.updateMatrixWorld(true);
  return s.localToWorld(s.userData.top.clone());
}
export function setCrystal(j, k, col = 0x60fff0) { const s = j.staff.userData; const c = new THREE.Color(col); s.M.crystal.uniforms.uEmissive.value.copy(c).multiplyScalar(0.6 + k * 1.4); s.glow.material.color.copy(c); s.glow.material.opacity = 0.3 + k * 0.3; const sz = 0.45 + k * 0.8; s.glow.scale.set(sz, sz, 1); }

// ---------------------------------------------------------------- spell effects
export function runeCircle(r = 2.2, color = 0x60fff0) {
  const m = mat({ map: TZ('runeCircle'), color, unlit: true, additive: true, alphaTest: 0.5, opacity: 0, side: THREE.DoubleSide, fogScale: 0.3 });
  const c = mesh(new THREE.PlaneGeometry(r * 2, r * 2), m, null, [0, 0.04, 0], [-Math.PI / 2, 0, 0]);
  return c;
}
export function auraShell(r = 1.3) {
  const m = mat({ color: 0x40a8ff, unlit: true, additive: true, opacity: 0, side: THREE.DoubleSide, fogScale: 0.3 });
  const g = new THREE.SphereGeometry(r, 10, 7); g.scale(0.7, 1.35, 0.7);
  return mesh(flat(g), m);
}
export function manaMotes(o = {}) { return particles({ mode: 'emit', count: o.count ?? 220, origin: o.origin || v3(), spread: o.spread || v3(3, 0.2, 3), vel: o.vel || v3(0, 1.3, 0), life: o.life ?? 2.2, size: o.size ?? 0.06, c0: 0xc8fff8, c1: 0x60e0ff, c2: 0x2050c0, seed: o.seed ?? 3, swirl: 1.6, opacity: o.opacity ?? 0, fogMix: 0.2 }); }
export function fireEmit(o = {}) { return particles({ mode: 'emit', count: o.count ?? 160, origin: o.origin || v3(), spread: o.spread || v3(0.25, 0.25, 0.25), vel: o.vel || v3(0, 0.9, 0), life: o.life ?? 0.5, size: o.size ?? 0.22, c0: 0xfff4c0, c1: 0xff7a18, c2: 0x6a1004, soft: true, seed: o.seed ?? 5, swirl: 2.0, opacity: o.opacity ?? 0, fogMix: 0.1 }); }
export function fireball() {
  const g = new THREE.Group();
  const core = mesh(flat(new THREE.IcosahedronGeometry(0.22, 1)), mat({ color: 0xffe8a0, emissive: 0xff9a30, unlit: true }), g);
  const shell = mesh(flat(new THREE.IcosahedronGeometry(0.34, 0)), mat({ color: 0xff6010, unlit: true, additive: true, opacity: 0.55 }), g);
  const gl = glow(0xffa040, 1.1, 0.65); g.add(gl);
  g.userData = { core, shell, glow: gl };
  return g;
}
export function setFireball(f, size, heat, t) {
  f.scale.setScalar(Math.max(0.001, size));
  f.userData.core.rotation.set(t * 3, t * 2.3, 0); f.userData.shell.rotation.set(-t * 2, t * 3.1, t);
  f.userData.core.material.uniforms.uColor.value.setRGB(1, 0.85 + heat * 0.15, 0.55 + heat * 0.45);
  f.userData.shell.material.uniforms.uOpacity.value = 0.55 - heat * 0.25;
  f.userData.glow.material.color.setRGB(1, 0.6 + heat * 0.35, 0.25 + heat * 0.5);
}
export function shockRing(color = 0xffb060) {
  const m = mat({ color, unlit: true, additive: true, opacity: 0, side: THREE.DoubleSide, fogScale: 0.3 });
  return mesh(new THREE.RingGeometry(0.85, 1.0, 24), m, null, [0, 0.06, 0], [-Math.PI / 2, 0, 0]);
}

// branching lightning as camera-facing ribbons
export function boltPath(a, b, seed, o = {}) {
  const r = rng(seed); let pts = [a.clone(), b.clone()]; const jag = o.jag ?? 0.18;
  for (let lvl = 0; lvl < (o.depth ?? 6); lvl++) { const np = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; const m = p.clone().lerp(q, 0.5); const L = p.distanceTo(q); m.add(v3(r() - 0.5, (r() - 0.5) * 0.4, r() - 0.5).multiplyScalar(L * jag * 2)); np.push(m, q); } pts = np; }
  const paths = [pts];
  for (let k = 0; k < (o.branches ?? 4); k++) { const i0 = Math.floor(pts.length * (0.15 + r() * 0.6)); const s = pts[i0]; const dir = b.clone().sub(a).normalize(); const e = s.clone().add(v3(r() - 0.5, 0, r() - 0.5).multiplyScalar(a.distanceTo(b) * 0.5)).addScaledVector(dir, a.distanceTo(b) * 0.25 * r()); const bp = boltPath(s, e, seed * 7 + k, { depth: 4, branches: 0, jag: 0.22 })[0]; paths.push(bp); }
  return paths;
}
export class Bolt {
  constructor(max = 900, color = 0xe8f6ff, glowCol = 0x4aa0ff) {
    this.max = max;
    const mk2 = (col, op) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 18), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(max * 12), 2)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(max * 18), 3)); const m = mesh(g, mat({ color: col, unlit: true, additive: true, opacity: op, side: THREE.DoubleSide, fogScale: 0.2 })); m.frustumCulled = false; return m; };
    this.core = mk2(color, 1.0); this.halo = mk2(glowCol, 0.3);
    this.group = new THREE.Group(); this.group.add(this.halo, this.core);
  }
  set(paths, camPos, w = 0.06, intensity = 1) {
    for (const [m, wid] of [[this.core, w], [this.halo, w * 5]]) {
      const p = m.geometry.attributes.position; let q = 0;
      for (let pi = 0; pi < paths.length; pi++) { const pts = paths[pi]; const ww = wid * (pi === 0 ? 1 : 0.5);
        for (let i = 0; i < pts.length - 1 && q < this.max; i++) { const a = pts[i], b = pts[i + 1]; const d = b.clone().sub(a); const view = camPos.clone().sub(a); const side = d.clone().cross(view).normalize().multiplyScalar(ww * (1 - i / pts.length * 0.5));
          const A = a.clone().add(side), B = a.clone().sub(side), Cc = b.clone().sub(side), D = b.clone().add(side);
          const base = q * 6; p.setXYZ(base, A.x, A.y, A.z); p.setXYZ(base + 1, B.x, B.y, B.z); p.setXYZ(base + 2, Cc.x, Cc.y, Cc.z); p.setXYZ(base + 3, A.x, A.y, A.z); p.setXYZ(base + 4, Cc.x, Cc.y, Cc.z); p.setXYZ(base + 5, D.x, D.y, D.z);
          q++; } }
      m.geometry.setDrawRange(0, q * 6); p.needsUpdate = true;
      m.material.uniforms.uOpacity.value = (m === this.core ? 0.95 : 0.28) * intensity;
    }
    this.group.visible = intensity > 0.01 && paths.length > 0;
  }
}

// the shield: a faceted dome of rune light
export function shieldDome(r = 2.3) {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(r, 1); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) * 0.15);
  const outer = mesh(flat(geo), mat({ map: TZ('shield'), color: 0x60b0ff, unlit: true, additive: true, opacity: 0, side: THREE.DoubleSide, fogScale: 0.2, repeat: [3, 2] }), g);
  const inner = mesh(flat(new THREE.IcosahedronGeometry(r * 0.96, 0)), mat({ color: 0x2060c0, unlit: true, additive: true, opacity: 0, side: THREE.DoubleSide, fogScale: 0.2 }), g);
  const ring = shockRing(0x80d0ff); g.add(ring); ring.scale.setScalar(r);
  const hit = glow(0xc0f0ff, 2.5, 0); g.add(hit);
  g.userData = { outer, inner, ring, hit, r };
  return g;
}
export function setShield(s, k, t, hitK = 0, hitPos = null) {
  const u = s.userData;
  u.outer.material.uniforms.uOpacity.value = k * (0.24 + 0.04 * Math.sin(t * 6)) + hitK * 0.45;
  u.inner.material.uniforms.uOpacity.value = k * 0.08 + hitK * 0.2;
  u.outer.rotation.y = t * 0.25; u.outer.scale.set(1 + hitK * 0.04, k, 1 + hitK * 0.04);
  u.inner.scale.set(1, Math.max(0.01, k), 1);
  u.ring.material.uniforms.uOpacity.value = k * (1 - k) * 3 + hitK * 0.4;
  if (hitPos) { u.hit.position.copy(hitPos); } u.hit.material.opacity = hitK * 0.7; const hs = 1.2 + hitK * 2.4; u.hit.scale.set(hs, hs, 1);
}
