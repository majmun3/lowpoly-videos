// WHAT IF YOU WERE BORN AS A VAMPIRE? — characters. One vampire on one rig (newborn → child → noble → king):
// pale skin, glowing crimson eyes, slicked black hair with a widow's peak, pointed ears, fangs; a black frock coat over a
// grey waistcoat and crimson cravat; a long black cape with a tall crimson-lined collar; and, as part of his normal
// silhouette, a strongly exaggerated backside (the cape drapes over it). Later: black-and-crimson royal armour and a crown.
// Plus the vampire elders, humans (servant, companions who age), and an instanced bat swarm.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { setJiggle } from '/born-as-a-dwarf/render/src/dwarf.js';
export { jigWalk, jigKick, jigAdd, setJiggle } from '/born-as-a-dwarf/render/src/dwarf.js';

const cache = {};
export function TP(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  pale: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1601, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.8 + (n(i, j) - 0.5) * 0.08; return [C(v * 222), C(v * 222), C(v * 228)]; }); }),
  hair: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1603, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.18 + (n(i, j) - 0.5) * 0.08 + (i % 3 === 0 ? 0.05 : 0); return [C(v * 210), C(v * 210), C(v * 240)]; }); }),
  coat: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1605, [16, 8, 4]); pixels(x, w, h, (i, j) => { let v = 0.2 + (n(i, j) - 0.5) * 0.07; if (i === 15 || i === 16) v -= 0.05; return [C(v * 220), C(v * 215), C(v * 240)]; }); }),
  vest: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1607, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.45 + (n(i, j) - 0.5) * 0.1; if ((i === 7 || i === 8) && j % 6 === 3) return [C(225), C(228), C(235)]; if (i === 8) v -= 0.08; return [C(v * 210), C(v * 210), C(v * 222)]; }); }),
  crimson: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1609, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.2; return [C(v * 205), C(v * 28), C(v * 36)]; }); }),
  trousers: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1611, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.22 + (n(i, j) - 0.5) * 0.07 + ((i + j) % 4 === 0 ? 0.02 : 0); return [C(v * 215), C(v * 212), C(v * 235)]; }); }),
  boot: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1613, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.16 + (n(i, j) - 0.5) * 0.08 + (j < 3 ? 0.1 : 0); return [C(v * 220), C(v * 210), C(v * 215)]; }); }),
  armor: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1615, [16, 8, 4]); pixels(x, w, h, (i, j) => { let v = 0.24 + (n(i, j) - 0.5) * 0.1 - (j / h) * 0.05; if (i < 2 || i > w - 3 || j < 2) return [C(190), C(30), C(38)]; if ((i + j) % 9 === 0) v += 0.08; return [C(v * 210), C(v * 205), C(v * 225)]; }); }),
  robe: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1617, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.3 + (n(i, j) - 0.5) * 0.1; if (j > h - 3) return [C(150), C(130), C(70)]; return [C(v * 150), C(v * 90), C(v * 170)]; }); }),
  cloth: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1619, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.15; return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  skin: () => mk(8, 8, (x, w, h) => { const r = rng(1621); pixels(x, w, h, () => { const v = 0.62 + r() * 0.05; return [C(v * 235), C(v * 182), C(v * 150)]; }); }),
};

export function vampMaterials(o = {}) {
  return {
    pale: mat({ map: TP('pale'), rim: 0.8, wrap: 0.5 }), hair: mat({ map: TP('hair'), color: o.hair ?? 0xffffff, rim: 1 }), hairD: mat({ map: TP('hair'), color: o.hair ?? 0xffffff, rim: 1, side: THREE.DoubleSide }),
    coat: mat({ map: TP('coat'), rim: 1, wrap: 0.5 }), coatD: mat({ map: TP('coat'), rim: 1, wrap: 0.5, side: THREE.DoubleSide }), vest: mat({ map: TP('vest'), rim: 0.6 }),
    crimson: mat({ map: TP('crimson'), rim: 0.8, side: THREE.DoubleSide, wrap: 0.6 }), trousers: mat({ map: TP('trousers'), rim: 1, wrap: 0.5 }), boot: mat({ map: TP('boot'), rim: 1 }),
    silver: mat({ map: T('iron'), color: 0xe0e4ec, rim: 1 }), white: mat({ map: TP('cloth'), color: 0xe8e8f0 }), fang: mat({ color: 0xf4f4f0, unlit: true }), mouth: mat({ color: 0x200608, unlit: true }),
    eye: mat({ color: 0xff2020, emissive: 0xff1010, unlit: true, pierce: 4 }), armor: mat({ map: TP('armor'), rim: 1 }), gem: mat({ color: 0xff1a1a, emissive: 0x900000, unlit: true }),
    robe: mat({ map: TP('robe'), color: o.robe ?? 0xffffff, rim: 1, side: THREE.DoubleSide, wrap: 0.6 }),
  };
}

// ---------------------------------------------------------------- the cape: a cloth grid hanging from the shoulders, draped over the backside
function buildCape(j, M, k, len) {
  const COLS = 9, ROWS = 9, geo = new THREE.BufferGeometry(); const pos = new Float32Array(COLS * ROWS * 3), uv = new Float32Array(COLS * ROWS * 2), idx = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { uv.set([c / (COLS - 1), 1 - r / (ROWS - 1)], (r * COLS + c) * 2); if (r < ROWS - 1 && c < COLS - 1) { const a = r * COLS + c; idx.push(a, a + 1, a + COLS, a + 1, a + COLS + 1, a + COLS); } }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const outer = mesh(geo, M.coatD, j.chest); const inner = mesh(geo, M.crimson, j.chest); inner.scale.set(0.985, 1, 0.985); inner.position.z = 0.012;
  outer.frustumCulled = inner.frustumCulled = false;
  j.cape = { geo, COLS, ROWS, k, len, outer, inner };
}
// wind 0..1, lift 0..1 (cape blown up and back), t seconds
export function updateCape(j, t, o = {}) {
  const c = j.cape; if (!c) return; const { geo, COLS, ROWS, k, len } = c; const p = geo.attributes.position;
  const wind = o.wind ?? 0.25, lift = o.lift ?? 0, sit = o.sit ?? 0;
  const buttY = -0.3 * k, bulge = (j.buttSize ?? 0.24) * 1.9 * k;
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
    const f = r / (ROWS - 1), u = cc / (COLS - 1) * 2 - 1; const a = u * 1.25;   // around the back
    const y = 0.26 * k - f * len * k * (1 - lift * 0.45) * (1 - sit * 0.35);
    const fl = Math.sin(t * 2.3 + u * 2.0 - f * 2.5) * wind * f * 0.12 * k + Math.sin(t * 5.1 + u * 4 + f * 3) * wind * f * 0.04 * k;
    const bh = Math.exp(-Math.pow((y - buttY) / (0.3 * k), 2)) * (1 - Math.abs(u) * 0.15);
    const rad = (0.2 + f * 0.17) * k + bh * bulge + Math.max(0, (y - buttY) < 0 ? (buttY - y) * 0.15 : 0) * f;
    let x = Math.sin(a) * rad * (1.05 + f * 0.35), z = -Math.cos(a) * rad * 0.9 - lift * f * f * 0.8 * k - wind * f * f * 0.12 * k + fl;
    if (sit) z -= sit * f * 0.3 * k;
    p.setXYZ(r * COLS + cc, x + fl * 0.4, y + lift * f * f * 0.35 * k, z);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}

// ---------------------------------------------------------------- the vampire
// stage: 'baby' | 'child' | 'noble' | 'king'
export function buildVampire(stage = 'noble', o = {}) {
  if (stage === 'baby') return buildBaby(o);
  const M = vampMaterials(o); const child = stage === 'child', king = stage === 'king';
  const k = child ? 0.62 : 1;
  const d = { hip: 1.0 * k, spineOff: 0.07 * k, abd: 0.19 * k, chestH: 0.3 * k, neckH: 0.08 * k, shW: 0.2 * k, upper: 0.3 * k, fore: 0.28 * k, thigh: 0.48 * k, shin: 0.46 * k, hipW: 0.1 * k };
  const j = rig(d); j.stage = stage; j.M = M; j.k = k; j.hipH = d.hip;
  // hips and the (permanent) exaggerated backside
  mesh(taper(0.34 * k, 0.24 * k, 0.36 * k, 0.26 * k, 0.2 * k, { anchor: 'center' }), M.trousers, j.pelvis);
  j.butt = group(j.pelvis, [0, -0.02 * k, -0.08 * k]); const cr = 0.24 * k; j.buttSize = 0.24;
  for (const [s, nm] of [[-1, 'cheekL'], [1, 'cheekR']]) { const c = mesh(flat(new THREE.IcosahedronGeometry(cr, 1)), M.trousers, j.butt, [s * cr * 0.56, 0, -cr * 0.5], [0, 0, 0], [1, 0.95, 0.9]); c.userData.y = 0; c.userData.s = [1, 0.95, 0.9]; j[nm] = c; }
  j.jigK = cr / 0.25;
  // torso: frock coat over a grey waistcoat with silver buttons, white collar, crimson cravat
  mesh(taper(0.32 * k, 0.24 * k, 0.34 * k, 0.24 * k, 0.19 * k), M.coat, j.spine);
  mesh(taper(0.36 * k, 0.24 * k, 0.44 * k, 0.26 * k, 0.3 * k), king ? M.armor : M.coat, j.chest);
  mesh(box(0.16 * k, 0.42 * k, 0.03 * k), king ? M.armor : M.vest, j.chest, [0, -0.02 * k, 0.125 * k]);
  mesh(box(0.1 * k, 0.07 * k, 0.04 * k), M.white, j.chest, [0, 0.27 * k, 0.12 * k]); mesh(flat(new THREE.OctahedronGeometry(0.04 * k, 0)), M.crimson, j.chest, [0, 0.23 * k, 0.14 * k], [0, 0, Math.PI / 4], [1.6, 0.8, 0.5]);
  for (const sx of [-1, 1]) mesh(box(0.06 * k, 0.32 * k, 0.03 * k), king ? M.armor : M.coat, j.chest, [sx * 0.09 * k, 0.1 * k, 0.13 * k], [0, 0, -sx * 0.12]);       // lapels
  // coat skirts: front panels only (split at the back)
  for (const sx of [-1, 1]) { const f = group(j.pelvis, [sx * 0.11 * k, 0.07 * k, 0.07 * k], [0, sx * 0.5, sx * 0.08]); mesh(box(0.16 * k, 0.48 * k, 0.02 * k, 'top'), M.coatD, f); }
  mesh(box(0.36 * k, 0.05 * k, 0.27 * k), king ? M.armor : M.trousers, j.pelvis, [0, 0.09 * k, 0]);
  if (king) {
    for (const sx of [-1, 1]) { const pl = group(j['arm' + (sx < 0 ? 'L' : 'R')], [sx * 0.02, 0.05, 0]); mesh(taper(0.22, 0.2, 0.15, 0.15, 0.1, { anchor: 'top' }), M.armor, pl); for (let s = 0; s < 3; s++) mesh(prism(4, 0.025, 0, 0.13), M.armor, pl, [sx * 0.05 + sx * s * 0.03, 0.03, -0.05 + s * 0.05], [0, 0, -sx * 0.6]); }
    mesh(box(0.36, 0.14, 0.27), M.armor, j.pelvis, [0, 0.0, 0.0]);
    const cr2 = group(j.head, [0, 0.235, 0.005]); j.crown = cr2; mesh(prism(9, 0.12, 0.115, 0.05, 'bottom', true), M.armor, cr2);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; mesh(prism(3, 0.018, 0, 0.1 + (i % 2) * 0.05), M.armor, cr2, [Math.sin(a) * 0.115, 0.045, Math.cos(a) * 0.115]); }
    mesh(flat(new THREE.OctahedronGeometry(0.02, 0)), M.gem, cr2, [0, 0.03, 0.12]);
  }
  // neck and head: pale, sharp, pointed ears, stern brows, glowing eyes, fangs, slicked hair with a widow's peak
  mesh(prism(6, 0.055 * k, 0.05 * k, 0.09 * k), M.pale, j.neck);
  const hk = child ? 0.92 / k * 0.68 : 1; const H = group(j.head); H.scale.setScalar(hk * (child ? 1 : 1)); j.face = H;
  mesh(taper(0.15, 0.17, 0.17, 0.19, 0.12), M.pale, H, [0, 0.0, 0.0]); mesh(taper(0.17, 0.19, 0.16, 0.18, 0.1), M.pale, H, [0, 0.12, 0]);
  mesh(taper(0.09, 0.06, 0.15, 0.15, 0.05), M.pale, H, [0, -0.03, 0.02]);                                           // sharp jaw and chin
  mesh(prism(4, 0.018, 0.006, 0.06), M.pale, H, [0, 0.105, 0.098], [1.2, Math.PI / 4, 0]);                        // nose
  j.eyes = []; for (const sx of [-1, 1]) {
    j.eyes.push(mesh(box(0.032, 0.013, 0.01), M.eye, H, [sx * 0.037, 0.128, 0.093]));
    mesh(box(0.05, 0.012, 0.02), M.hair, H, [sx * 0.04, 0.146, 0.092], [0, 0, -sx * 0.28]);                       // stern brows
    const ear = mesh(prism(3, 0.03, 0.0, 0.1), M.pale, H, [sx * 0.088, 0.13, -0.005], [-0.3, 0, -sx * 1.05]); ear.scale.set(1, 1, 0.45);
    mesh(prism(3, 0.006, 0, 0.022, 'top'), M.fang, H, [sx * 0.018, 0.048, 0.092]);                                 // fangs
  }
  mesh(box(0.07, 0.008, 0.01), M.mouth, H, [0, 0.055, 0.092]);
  mesh(taper(0.18, 0.2, 0.14, 0.15, 0.06), M.hair, H, [0, 0.2, -0.01]); mesh(taper(0.17, 0.1, 0.16, 0.08, 0.15, { anchor: 'top' }), M.hairD, H, [0, 0.24, -0.06]);
  mesh(prism(3, 0.035, 0.0, 0.03, 'top'), M.hair, H, [0, 0.212, 0.085], [-0.15, Math.PI / 6, 0], [1, 1, 0.35]);   // widow's peak
  for (const sx of [-1, 1]) mesh(box(0.02, 0.08, 0.13), M.hair, H, [sx * 0.085, 0.19, -0.02]);
  // arms: coat sleeves with crimson cuffs; long pale hands
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? -1 : 1;
    mesh(taper(0.1 * k, 0.1 * k, 0.12 * k, 0.12 * k, d.upper, { anchor: 'top' }), king ? M.armor : M.coat, j['arm' + s]);
    mesh(taper(0.085 * k, 0.085 * k, 0.1 * k, 0.1 * k, d.fore, { anchor: 'top' }), king ? M.armor : M.coat, j['fore' + s]);
    mesh(box(0.11 * k, 0.05 * k, 0.11 * k), king ? M.armor : M.crimson, j['fore' + s], [0, -d.fore + 0.03 * k, 0]);
    mesh(box(0.06 * k, 0.09 * k, 0.07 * k, 'top'), M.pale, j['hand' + s], [0, 0.01, 0]);
    for (let f = -1; f <= 1; f++) mesh(box(0.014 * k, 0.07 * k, 0.016 * k, 'top'), M.pale, j['hand' + s], [f * 0.018 * k, -0.07 * k, 0.015 * k]);
    mesh(taper(0.13 * k, 0.15 * k, 0.15 * k, 0.17 * k, d.thigh, { anchor: 'top' }), M.trousers, j['thigh' + s]);
    mesh(taper(0.1 * k, 0.11 * k, 0.12 * k, 0.13 * k, d.shin, { anchor: 'top' }), M.boot, j['shin' + s]);
    mesh(taper(0.1 * k, 0.22 * k, 0.1 * k, 0.17 * k, 0.07 * k, { anchor: 'top', oz: 0.03 * k }), M.boot, j['foot' + s], [0, 0.01 * k, 0.04 * k]);
  }
  // the tall cape collar (black outside, crimson inside) and the cape
  for (const sx of [-1, 1]) { const cl = group(j.chest, [sx * 0.12 * k, 0.29 * k, -0.04 * k], [0.25, sx * 0.55, -sx * 0.35]); mesh(taper(0.16 * k, 0.012, 0.22 * k, 0.012, 0.2 * k), M.coatD, cl); mesh(taper(0.15 * k, 0.012, 0.21 * k, 0.012, 0.19 * k), M.crimson, cl, [0, 0.005, 0.008]); }
  mesh(taper(0.2 * k, 0.012, 0.3 * k, 0.012, 0.2 * k), M.coatD, j.chest, [0, 0.29 * k, -0.13 * k], [-0.25, 0, 0]);
  buildCape(j, M, k, child ? 0.95 : 1.12);
  updateCape(j, 0, {});
  applyPose(j, { hipY: d.hip });
  return j;
}
function buildBaby(o = {}) {
  const M = vampMaterials(o); const root = new THREE.Group(); const j = { root, stage: 'baby', M };
  const body = group(root, [0, 0.08, 0]); j.body = body;
  mesh(flat(new THREE.IcosahedronGeometry(0.1, 1)), M.coat, body, [0, 0, 0.0], [0, 0, 0], [1.0, 0.75, 1.35]);              // a black silk swaddle
  mesh(box(0.2, 0.03, 0.05), M.crimson, body, [0, 0.05, 0.09]);
  j.butt = group(body, [0, 0.0, -0.11]);
  for (const [s, nm] of [[-1, 'cheekL'], [1, 'cheekR']]) { const c = mesh(flat(new THREE.IcosahedronGeometry(0.1, 1)), M.coat, j.butt, [s * 0.056, 0.0, -0.05], [0, 0, 0], [1, 0.9, 0.9]); c.userData.y = 0; c.userData.s = [1, 0.9, 0.9]; j[nm] = c; }
  j.jigK = 0.4;
  const head = group(body, [0, 0.04, 0.17]); j.head = head;
  mesh(flat(new THREE.IcosahedronGeometry(0.075, 1)), M.pale, head);
  j.eyes = []; for (const sx of [-1, 1]) { j.eyes.push(mesh(box(0.024, 0.009, 0.01), M.eye, head, [sx * 0.026, 0.012, 0.07])); mesh(prism(3, 0.016, 0, 0.04), M.pale, head, [sx * 0.07, 0.02, -0.01], [-0.3, 0, -sx * 1.1]); }
  mesh(taper(0.1, 0.11, 0.08, 0.09, 0.04), M.hair, head, [0, 0.045, -0.01]); mesh(prism(3, 0.025, 0, 0.03, 'top'), M.hair, head, [0, 0.07, 0.06]);
  return j;
}
// glowing eyes: k 0..1 (0 = closed/dark)
export function setEyes(j, k) { for (const e of j.eyes) { e.visible = k > 0.02; e.scale.y = Math.max(0.05, Math.min(1, k * 1.2)); e.material.uniforms.uColor.value.setRGB(0.4 + k * 0.6, 0.05 + k * 0.08, 0.06 + k * 0.08); } }
export function vStand(k = 1) { return { hipY: 1.0 * k, armL: [0.05, 0, -0.08], armR: [0.05, 0, 0.08], foreL: [-0.15, 0, 0], foreR: [-0.15, 0, 0], spine: [-0.03, 0, 0], neck: [-0.03, 0, 0] }; }
export function vWalk(ph, o = {}) { const p = walkPose(ph, { stride: o.stride ?? 0.4, hunch: o.hunch ?? -0.02, hip: o.hip ?? 1.0 }); p.armL = [Math.sin(ph * 6.28) * 0.15, 0, -0.08]; p.armR = [-Math.sin(ph * 6.28) * 0.15, 0, 0.08]; return p; }

// ---------------------------------------------------------------- vampire elders
export function buildElder(o = {}) {
  const M = vampMaterials({ hair: o.hair ?? 0xb8b8c8, robe: o.robe ?? 0xffffff }); const r = rng(o.seed ?? 1);
  const d = { hip: 0.98, spineOff: 0.07, abd: 0.19, chestH: 0.3, neckH: 0.08, shW: 0.2, upper: 0.3, fore: 0.28, thigh: 0.47, shin: 0.45, hipW: 0.1 };
  const j = rig(d); j.M = M; j.hipH = d.hip;
  mesh(taper(0.6, 0.5, 0.34, 0.26, 1.0, { anchor: 'top' }), M.robe, j.pelvis, [0, 0.1, 0]);
  mesh(taper(0.34, 0.24, 0.36, 0.25, 0.19), M.robe, j.spine); mesh(taper(0.36, 0.25, 0.44, 0.26, 0.3), M.robe, j.chest);
  for (const sx of [-1, 1]) { const cl = group(j.chest, [sx * 0.12, 0.29, -0.04], [0.25, sx * 0.55, -sx * 0.35]); mesh(taper(0.16, 0.012, 0.22, 0.012, 0.22), M.coatD, cl); mesh(taper(0.15, 0.012, 0.21, 0.012, 0.21), M.crimson, cl, [0, 0.005, 0.008]); }
  mesh(prism(6, 0.055, 0.05, 0.09), M.pale, j.neck);
  const H = group(j.head); j.face = H;
  mesh(taper(0.15, 0.17, 0.17, 0.19, 0.12), M.pale, H); mesh(taper(0.17, 0.19, 0.15, 0.17, 0.11), M.pale, H, [0, 0.12, 0]);
  mesh(prism(4, 0.02, 0.006, 0.065), M.pale, H, [0, 0.105, 0.098], [1.2, Math.PI / 4, 0]);
  j.eyes = []; for (const sx of [-1, 1]) { j.eyes.push(mesh(box(0.03, 0.012, 0.01), M.eye, H, [sx * 0.037, 0.128, 0.093])); mesh(box(0.05, 0.014, 0.02), M.hair, H, [sx * 0.04, 0.147, 0.092], [0, 0, -sx * 0.15]); const ear = mesh(prism(3, 0.03, 0, 0.11), M.pale, H, [sx * 0.088, 0.13, -0.005], [-0.3, 0, -sx * 1.05]); ear.scale.set(1, 1, 0.45); }
  if (o.bald) mesh(taper(0.15, 0.12, 0.16, 0.14, 0.08), M.hairD, H, [0, 0.1, -0.06]); else { mesh(taper(0.18, 0.2, 0.15, 0.17, 0.08), M.hair, H, [0, 0.19, -0.005]); mesh(taper(0.18, 0.1, 0.17, 0.08, 0.32, { anchor: 'top' }), M.hairD, H, [0, 0.24, -0.07]); }
  for (const s of ['L', 'R']) { mesh(taper(0.12, 0.12, 0.2, 0.18, 0.3, { anchor: 'top' }), M.robe, j['arm' + s]); mesh(taper(0.14, 0.14, 0.24, 0.22, 0.3, { anchor: 'top' }), M.robe, j['fore' + s]); mesh(box(0.06, 0.09, 0.07, 'top'), M.pale, j['hand' + s]); mesh(taper(0.1, 0.22, 0.1, 0.17, 0.07, { anchor: 'top', oz: 0.03 }), M.boot, j['foot' + s], [0, 0.01, 0.04]); }
  applyPose(j, { hipY: d.hip });
  return j;
}

// ---------------------------------------------------------------- humans: the servant and the companions (who age)
export function buildHuman(o = {}) {
  const r = rng(o.seed ?? 1); const M = { skin: mat({ map: TP('skin'), rim: 0.6 }), hair: mat({ map: TP('hair'), color: o.hair ?? [0xd8a060, 0xa06030, 0x6a4028, 0xe8d0a0][Math.floor(r() * 4)], rim: 1 }),
    cloth: mat({ map: TP('cloth'), color: o.cloth ?? [0x6a2a3a, 0x3a4a6a, 0x5a4a2a, 0x4a3a5a][Math.floor(r() * 4)], rim: 1, side: THREE.DoubleSide, wrap: 0.6 }), white: mat({ map: TP('cloth'), color: 0xe0dcd0 }), boot: mat({ map: TP('boot') }), eye: mat({ color: 0x201810, unlit: true }) };
  const fem = !!o.female; const d = { hip: 0.95, spineOff: 0.06, abd: 0.17, chestH: 0.27, neckH: 0.07, shW: 0.19, upper: 0.29, fore: 0.26, thigh: 0.45, shin: 0.44, hipW: 0.09 };
  const j = rig(d); j.M = M; j.hipH = d.hip;
  mesh(taper(0.3, 0.2, 0.3, 0.2, 0.16, { anchor: 'center' }), M.cloth, j.pelvis);
  if (fem) mesh(taper(0.6, 0.5, 0.3, 0.22, 0.92, { anchor: 'top' }), M.cloth, j.pelvis, [0, 0.07, 0]); else mesh(taper(0.36, 0.24, 0.32, 0.22, 0.4, { anchor: 'top' }), M.cloth, j.pelvis, [0, 0.06, 0]);
  if (o.apron) mesh(box(0.3, 0.7, 0.02, 'top'), M.white, j.pelvis, [0, 0.06, 0.16]);
  mesh(taper(0.28, 0.2, 0.3, 0.2, 0.17), M.cloth, j.spine); mesh(taper(0.3, 0.2, 0.36, 0.22, 0.27), M.cloth, j.chest);
  mesh(prism(6, 0.05, 0.045, 0.08), M.skin, j.neck); const H = group(j.head); j.face = H;
  mesh(box(0.15, 0.2, 0.17, 'bottom'), M.skin, H, [0, 0, 0.01]); for (const sx of [-1, 1]) mesh(box(0.025, 0.012, 0.01), M.eye, H, [sx * 0.035, 0.12, 0.096]);
  mesh(taper(0.17, 0.19, 0.15, 0.17, 0.07), M.hair, H, [0, 0.18, 0]); mesh(taper(0.16, 0.08, 0.15, 0.07, fem ? 0.3 : 0.14, { anchor: 'top' }), M.hair, H, [0, 0.22, -0.06]);
  if (o.bonnet) mesh(taper(0.19, 0.21, 0.17, 0.19, 0.07), M.white, H, [0, 0.19, -0.005]);
  if (!fem && o.beard) mesh(taper(0.1, 0.06, 0.15, 0.1, 0.12, { anchor: 'top' }), M.hair, H, [0, 0.08, 0.07]);
  for (const s of ['L', 'R']) { mesh(taper(0.09, 0.09, 0.1, 0.1, 0.29, { anchor: 'top' }), M.cloth, j['arm' + s]); mesh(taper(0.075, 0.075, 0.085, 0.085, 0.26, { anchor: 'top' }), M.cloth, j['fore' + s]); mesh(box(0.06, 0.08, 0.07, 'top'), M.skin, j['hand' + s]);
    mesh(taper(0.11, 0.12, 0.13, 0.14, 0.45, { anchor: 'top' }), M.cloth, j['thigh' + s]); mesh(taper(0.09, 0.1, 0.11, 0.12, 0.44, { anchor: 'top' }), M.boot, j['shin' + s]); mesh(taper(0.09, 0.2, 0.09, 0.16, 0.06, { anchor: 'top', oz: 0.03 }), M.boot, j['foot' + s], [0, 0.01, 0.04]); }
  j.baseHair = M.hair.uniforms.uColor.value.clone();
  applyPose(j, { hipY: d.hip });
  return j;
}
// aging 0..1: hair turns white, the back bends
export function ageHuman(j, a) { j.M.hair.uniforms.uColor.value.copy(j.baseHair).lerp(new THREE.Color(0xe8e8e8), a); return { hipY: 0.95 - a * 0.06, spine: [a * 0.35, 0, 0], chest: [a * 0.2, 0, 0], neck: [-a * 0.25, 0, 0], thighL: [-a * 0.15, 0, 0], thighR: [-a * 0.15, 0, 0], shinL: [a * 0.25, 0, 0], shinR: [a * 0.25, 0, 0] }; }

// ---------------------------------------------------------------- bats: two instanced meshes (wings up / wings down)
export class Swarm {
  constructor(n, o = {}) {
    this.n = n; const m = mat({ color: o.color ?? 0x1a1018, rim: 0.6, side: THREE.DoubleSide, fogScale: 0.7 });
    const body = xf(flat(new THREE.OctahedronGeometry(0.08, 0)), { s: [0.8, 0.8, 1.6] });
    const wing = (up) => { const parts = [body]; for (const s of [-1, 1]) { const g = new THREE.BufferGeometry(); const y = up ? 0.12 : -0.1; const v = new Float32Array([0, 0, 0.06, s * 0.32, y, 0.0, 0, 0, -0.06, s * 0.32, y, 0.0, s * 0.2, y * 0.5, -0.12, 0, 0, -0.06]); g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(12), 2)); g.computeVertexNormals(); parts.push(g); } return merge(parts.map(p => p.index ? p.toNonIndexed() : p)); };
    this.A = new THREE.InstancedMesh(wing(true), m, n); this.B = new THREE.InstancedMesh(wing(false), m, n);
    this.group = new THREE.Group(); this.group.add(this.A, this.B); this.A.frustumCulled = this.B.frustumCulled = false;
    this.M4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.Z = new THREE.Matrix4().makeScale(0, 0, 0); this.R = rng(o.seed ?? 3); this.ph = Array.from({ length: n }, () => this.R()); this.sc = Array.from({ length: n }, () => (o.scale ?? 1) * (0.7 + this.R() * 0.6));
  }
  // fn(i) -> {p: Vector3, d: Vector3 (direction), on: bool}
  set(t, fn) {
    const up = v3(0, 1, 0);
    for (let i = 0; i < this.n; i++) {
      const s = fn(i); if (!s || !s.on) { this.A.setMatrixAt(i, this.Z); this.B.setMatrixAt(i, this.Z); continue; }
      const dir = s.d.clone().normalize(); const m = new THREE.Matrix4().lookAt(v3(0, 0, 0), dir, up); this.q.setFromRotationMatrix(m);
      const sc = this.sc[i] * (s.scale ?? 1); this.M4.compose(s.p, this.q, v3(sc, sc, sc)); const flap = (t * 9 + this.ph[i] * 4) % 1 < 0.5;
      this.A.setMatrixAt(i, flap ? this.M4 : this.Z); this.B.setMatrixAt(i, flap ? this.Z : this.M4);
    }
    this.A.instanceMatrix.needsUpdate = true; this.B.instanceMatrix.needsUpdate = true;
  }
}
// crimson smoke and the aura
export function crimsonSmoke(o = {}) { return particles({ mode: 'burst', count: o.count ?? 160, origin: o.origin || v3(), spread: (o.spread || v3(0.5, 0.8, 0.5)).clone().multiplyScalar(o.big ? 1 : 2.2), vel: (o.vel || v3(0, 0.8, 0)).clone().multiplyScalar(o.big ? 1 : 2.0), life: o.life ?? 1.2, size: o.big ? (o.size ?? 1) : 0.09, c0: 0xe02838, c1: 0x7a0a18, c2: 0x200408, soft: !!o.big, additive: false, opacity: o.opacity ?? 0.75, seed: o.seed ?? 11, start: -9, swirl: 2.2, fogMix: 0.3 }); }
export function crimsonAura(o = {}) { return particles({ mode: 'emit', count: o.count ?? 260, origin: o.origin || v3(), spread: o.spread || v3(0.6, 0.2, 0.6), vel: o.vel || v3(0, 1.6, 0), life: o.life ?? 1.4, size: o.size ?? 0.06, c0: 0xff6060, c1: 0xd01020, c2: 0x400010, seed: o.seed ?? 13, swirl: 2.5, opacity: 0, fogMix: 0.2 }); }
