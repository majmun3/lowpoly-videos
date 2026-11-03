// WHAT IF YOU WERE BORN AS A GOBLIN? — characters: the goblin (runt → survivor → warlord → king), his tribe,
// the knights, the brute, the dire wolf and a hare. All original low-poly designs.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, loft, orientOut } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose } from '/the-last-ember/render/src/characters.js';

// ---------------------------------------------------------------- textures
const cache = {};
export function TG(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  gskin: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 901, [8, 4, 2]), m = fbm(w, h, 903, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.5 + (n(i, j) - 0.5) * 0.3; const spot = m(i, j) > 0.62 ? -0.1 : 0; return [C((v + spot) * 138), C((v + spot) * 168), C((v + spot) * 88)]; }); }),
  innerEar: () => mk(8, 8, (x, w, h) => { const r = rng(905); pixels(x, w, h, () => { const v = 0.5 + r() * 0.1; return [C(v * 190), C(v * 150), C(v * 100)]; }); }),
  leather: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 907, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.42 + (n(i, j) - 0.5) * 0.25; if ((i * 7 + j * 3) % 11 === 0) v -= 0.1; return [C(v * 200), C(v * 140), C(v * 90)]; }); }),
  fur: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 909, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.42 + (n(i, j) - 0.5) * 0.3 + ((i * 5 + j) % 4 === 0 ? -0.08 : 0); return [C(v * 175), C(v * 168), C(v * 160)]; }); }),
  bone: () => mk(8, 8, (x, w, h) => { const r = rng(911); pixels(x, w, h, () => { const v = 0.75 + r() * 0.1; return [C(v * 230), C(v * 220), C(v * 190)]; }); }),
  crimson: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 913, [16, 8, 4, 2]), r = rng(913); const tear = Array.from({ length: w }, (_, i) => h - 2 - Math.floor(r() * 9 + Math.sin(i * 1.9) * 2)); pixels(x, w, h, (i, j) => { if (j > tear[i]) return [0, 0, 0, 0]; const v = 0.6 + (n(i, j) - 0.5) * 0.35 - (j / h) * 0.12; return [C(v * 175), C(v * 30), C(v * 32), 255]; }); }),
  royal: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 915, [16, 8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.62 + (n(i, j) - 0.5) * 0.3 - (j / h) * 0.1; if (j > h - 5 || i < 2 || i > w - 3) { const g = 0.7 + n(i, j) * 0.3; return [C(g * 230), C(g * 180), C(g * 70), 255]; } return [C(v * 180), C(v * 28), C(v * 32), 255]; }); }),
  gold: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 917, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.75 + (n(i, j) - 0.5) * 0.3 - (j / h) * 0.15; return [C(v * 255), C(v * 200), C(v * 80)]; }); }),
  brute: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 919, [8, 4, 2]), m = fbm(w, h, 921, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.45 + (n(i, j) - 0.5) * 0.3 + (m(i, j) > 0.6 ? 0.06 : 0); return [C(v * 165), C(v * 160), C(v * 135)]; }); }),
  tabard: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 923, [16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.65 + (n(i, j) - 0.5) * 0.25; const cx = i - 15.5, cy = j - 22; if (cx * cx + cy * cy < 30) return [C(v * 245), C(v * 205), C(v * 90)]; if (i < 2 || i > w - 3) return [C(v * 230), C(v * 230), C(v * 220)]; return [C(v * 70), C(v * 105), C(v * 170)]; }); }),
  kite: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 925, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.65 + (n(i, j) - 0.5) * 0.25; const cx = i - 15.5, cy = j - 24; if (cx * cx + cy * cy < 40) return [C(v * 245), C(v * 205), C(v * 90)]; if (Math.abs(cx) < 2.5 || Math.abs(j - 24) < 2.5) return [C(v * 235), C(v * 235), C(v * 225)]; return [C(v * 70), C(v * 105), C(v * 170)]; }); }),
};

export function goblinMaterials(o = {}) {
  const tint = new THREE.Color(o.skin ?? 0xffffff);
  return {
    skin: mat({ map: TG('gskin'), color: tint, rim: 1, wrap: 0.6 }), skinD: mat({ map: TG('gskin'), color: tint, rim: 1, wrap: 0.7, side: THREE.DoubleSide }),
    inner: mat({ map: TG('innerEar'), color: tint, side: THREE.DoubleSide, wrap: 0.8 }),
    eye: mat({ color: 0xffb030, emissive: 0xff9a20, unlit: true, pierce: 4 }), dark: mat({ color: 0x1a0a06, unlit: true }),
    leather: mat({ map: TG('leather'), rim: 1 }), leatherD: mat({ map: TG('leather'), rim: 1, side: THREE.DoubleSide }), fur: mat({ map: TG('fur'), rim: 1, side: THREE.DoubleSide }),
    bone: mat({ map: TG('bone'), rim: 1 }), iron: mat({ map: T('iron'), rim: 1, color: 0xc8c8cc }), stone: mat({ map: T('stone'), color: 0xb0aca4 }), wood: mat({ map: T('wood'), color: 0xa08868 }),
    crimson: mat({ map: TG('crimson'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }), royal: mat({ map: TG('royal'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }),
    gold: mat({ map: TG('gold'), rim: 1 }), gem: mat({ color: 0xc01818, emissive: 0x500404, unlit: true }), darkIron: mat({ map: T('iron'), rim: 1, color: 0x8a8a90 }),
  };
}

// ---------------------------------------------------------------- props shared by the brute and the warlord
export function spikedPauldron(M, s = 1, side = -1) {
  const g = new THREE.Group();
  const cap = new THREE.SphereGeometry(0.15 * s, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.5); cap.scale(1.1, 0.85, 1.15);
  mesh(flat(cap), M.iron, g, [0, 0, 0], [0, 0, -side * 0.35]);
  const rim = new THREE.CylinderGeometry(0.17 * s, 0.18 * s, 0.05 * s, 7, 1, true); mesh(flat(rim), M.darkIron, g, [side * 0.01 * s, -0.02 * s, 0], [0, 0, -side * 0.35]);
  for (let k = 0; k < 3; k++) { const a = -0.6 + k * 0.6; mesh(prism(4, 0.03 * s, 0.0, 0.16 * s), M.bone, g, [side * (0.05 + Math.abs(a) * 0.02) * s, 0.1 * s, a * 0.1 * s], [a * 0.4, 0, -side * (0.7 + k * 0.05)]); }
  return g;
}
export function cleaver(M, len = 0.9, gold = false) {
  const g = new THREE.Group();
  const sh = new THREE.Shape(); sh.moveTo(-0.07 * len, 0); sh.lineTo(0.05 * len, 0); sh.lineTo(0.12 * len, 0.72 * len); sh.lineTo(0.05 * len, 0.86 * len); sh.lineTo(-0.1 * len, 0.8 * len); sh.lineTo(-0.07 * len, 0.45 * len); sh.lineTo(-0.11 * len, 0.38 * len); sh.lineTo(-0.07 * len, 0.3 * len);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.02 * len, bevelEnabled: false }); bg.translate(0, 0, -0.01 * len);
  mesh(flat(bg), M.iron, g, [0, 0.06 * len, 0]);
  if (gold) mesh(box(0.018 * len, 0.7 * len, 0.024 * len), M.gold, g, [0.1 * len, 0.45 * len, 0], [0, 0, 0.1]);
  mesh(box(0.2 * len, 0.03 * len, 0.05 * len), gold ? M.gold : M.darkIron, g, [0, 0.06 * len, 0]);
  mesh(prism(6, 0.022 * len, 0.025 * len, 0.26 * len, 'top'), M.leather, g, [0, 0.06 * len, 0]);
  mesh(flat(new THREE.OctahedronGeometry(0.035 * len, 0)), gold ? M.gold : M.bone, g, [0, -0.21 * len, 0]);
  return g;
}
export function boneSpear(M, len = 1.0) {
  const g = new THREE.Group();
  mesh(prism(5, 0.012, 0.014, len, 'center'), M.wood, g, [0, len * 0.2, 0]);
  mesh(taper(0.05, 0.012, 0.0, 0.008, 0.16), M.stone, g, [0, len * 0.7, 0]);
  mesh(box(0.03, 0.05, 0.03), M.leather, g, [0, len * 0.69, 0]);
  return g;
}

// ---------------------------------------------------------------- the goblin
export const STAGES = {
  runt: { scale: 0.62, head: 1.45, thin: 0.8, limbs: 0.62, clothes: 'runt' },
  tribe: { scale: 0.86, head: 1.05, thin: 1.0, clothes: 'tribe' },
  survivor: { scale: 0.86, head: 1.05, thin: 0.98, clothes: 'survivor' },
  warlord: { scale: 1.0, head: 1.0, thin: 1.18, clothes: 'warlord' },
  king: { scale: 1.08, head: 1.0, thin: 1.28, clothes: 'king' },
};
function earShape(notch) {
  const s = new THREE.Shape(); s.moveTo(0, -0.04);
  s.lineTo(0.2, -0.005); s.lineTo(0.34, 0.07);              // lower edge to the tip
  if (notch) { s.lineTo(0.24, 0.058); s.lineTo(0.205, 0.025); s.lineTo(0.18, 0.056); } // the torn notch (left ear only)
  s.lineTo(0.1, 0.06); s.lineTo(0, 0.055); s.lineTo(0, -0.04);
  return s;
}
export function buildGoblin(stageName = 'survivor', o = {}) {
  const st = { ...STAGES[stageName], ...o };
  const M = o.M || goblinMaterials({ skin: o.skin });
  const t = st.thin;
  const L = st.limbs ?? 1;
  const d = { hip: 0.56 * L, spineOff: 0.05, abd: 0.14 * (0.5 + L * 0.5), chestH: 0.22 * (0.6 + L * 0.4), neckH: 0.05, shW: 0.17 * Math.min(1.15, t), upper: 0.27 * L, fore: 0.27 * L, thigh: 0.27 * L, shin: 0.27 * L, hipW: 0.085 };
  const j = rig(d);
  // body
  mesh(taper(0.22 * t, 0.15, 0.2 * t, 0.14, 0.12, { anchor: 'center' }), M.skin, j.pelvis);
  mesh(taper(0.17 * t, 0.13 * t, 0.21 * t, 0.15 * t, 0.15), M.skin, j.spine);
  mesh(taper(0.24 * t, 0.15 * t, 0.31 * t, 0.17 * t, 0.22), M.skin, j.chest);
  mesh(prism(5, 0.05 * Math.sqrt(t), 0.045, 0.08), M.skin, j.neck);
  // head
  const hs = group(j.head); hs.scale.setScalar(st.head); j.hs = hs;
  const cr = new THREE.SphereGeometry(0.12, 7, 5); cr.scale(1.08, 0.92, 1.0); mesh(flat(cr), M.skin, hs, [0, 0.12, -0.01]);
  mesh(taper(0.19, 0.12, 0.15, 0.09, 0.08), M.skin, hs, [0, 0.0, 0.05]);                        // jaw
  mesh(box(0.22, 0.035, 0.07), M.skin, hs, [0, 0.145, 0.085], [0.25, 0, 0]);                     // heavy brow
  const nose = group(hs, [0, 0.12, 0.115], [1.2, 0, 0]); mesh(prism(4, 0.028, 0.006, 0.11), M.skin, nose);   // long hooked nose
  mesh(box(0.13, 0.008, 0.012), M.dark, hs, [0, 0.045, 0.125]);                                 // mouth
  for (const s of [-1, 1]) {
    mesh(prism(3, 0.011, 0.0, 0.05), M.bone, hs, [s * 0.05, 0.04, 0.125], [0.15, 0, s * 0.1]);   // lower fangs
    mesh(flat(new THREE.OctahedronGeometry(0.018, 0)), M.eye, hs, [s * 0.048, 0.118, 0.112], [0, 0, s * 0.35], [1.2, 0.55, 0.6]); // small amber eyes
    const ear = group(hs, [s * 0.115, 0.12, -0.02], [0.25, s * 0.45, s * 0.18]);
    const eg = new THREE.ExtrudeGeometry(earShape(s < 0), { depth: 0.012, bevelEnabled: false }); eg.translate(0, 0, -0.006);
    const ig = new THREE.ShapeGeometry(earShape(s < 0)); ig.scale(0.8, 0.62, 1); ig.translate(0.02, 0.006, 0.0075);
    const em = mesh(flat(eg), M.skinD, ear); const im = mesh(ig, M.inner, ear);
    if (s < 0) { em.scale.x = -1; im.scale.x = -1; }
    j['ear' + (s < 0 ? 'L' : 'R')] = ear;
  }
  // limbs: long thin arms with big hands, short bowed legs with big flat feet
  for (const s of ['L', 'R']) {
    mesh(taper(0.06 * t, 0.06 * t, 0.075 * t, 0.075 * t, d.upper, { anchor: 'top' }), M.skin, j['arm' + s]);
    mesh(taper(0.05 * t, 0.05 * t, 0.065 * t, 0.065 * t, d.fore, { anchor: 'top' }), M.skin, j['fore' + s]);
    mesh(box(0.075, 0.065, 0.085, 'top'), M.skin, j['hand' + s]);
    for (let f = -1; f <= 1; f++) mesh(prism(3, 0.014, 0.004, 0.06, 'top'), M.skin, j['hand' + s], [f * 0.024, -0.06, 0.02]);
    mesh(taper(0.07 * t, 0.075 * t, 0.085 * t, 0.09 * t, d.thigh, { anchor: 'top' }), M.skin, j['thigh' + s]);
    mesh(taper(0.055 * t, 0.06 * t, 0.07 * t, 0.075 * t, d.shin, { anchor: 'top' }), M.skin, j['shin' + s]);
    mesh(taper(0.075, 0.18, 0.085, 0.16, 0.045, { anchor: 'top', oz: 0.03 }), M.skin, j['foot' + s], [0, 0.01, 0.05]);
    for (let f = -1; f <= 1; f++) mesh(prism(3, 0.012, 0.003, 0.04), M.bone, j['foot' + s], [f * 0.025, -0.03, 0.15], [Math.PI / 2, 0, 0]);
  }
  // clothing by stage
  const c = st.clothes;
  const loinF = group(j.pelvis, [0, 0.03, 0.075]); mesh(taper(0.15 * t, 0.01, 0.11, 0.01, c === 'runt' ? 0.16 : 0.24, { anchor: 'top' }), M.leatherD, loinF); j.loinF = loinF;
  const loinB = group(j.pelvis, [0, 0.03, -0.07]); mesh(taper(0.17 * t, 0.01, 0.14, 0.01, c === 'runt' ? 0.14 : 0.24, { anchor: 'top' }), M.leatherD, loinB);
  mesh(box(0.24 * t, 0.035, 0.16 * t), M.leather, j.pelvis, [0, 0.05, 0]);
  if (c !== 'runt') {
    mesh(box(0.035, 0.32 * t, 0.012), M.leather, j.chest, [0.0, 0.12, 0.085 * t], [0, 0, 0.62]);        // chest strap
  }
  if (c === 'survivor' || c === 'warlord' || c === 'king') {
    for (let k = 0; k < 7; k++) { const a = -1.1 + k * 0.37; mesh(prism(3, 0.009, 0.0, 0.045), M.bone, j.chest, [Math.sin(a) * 0.1 * t, 0.2 - Math.cos(a) * 0.02, 0.075 * t + Math.cos(a) * 0.01], [Math.PI, 0, 0]); } // tooth necklace
    for (const s of ['L', 'R']) mesh(box(0.07 * t, 0.1, 0.075 * t, 'top'), M.leather, j['fore' + s], [0, -0.12, 0]);
  }
  if (c === 'survivor') {
    mesh(taper(0.34 * t, 0.2 * t, 0.26 * t, 0.16 * t, 0.12, { anchor: 'top' }), M.fur, j.chest, [0, 0.25, -0.01]); // wolf pelt mantle
  }
  if (c === 'warlord' || c === 'king') {
    const pl = spikedPauldron(M, 1.15, -1); j.armL.add(pl); pl.position.set(-0.02, 0.0, 0);
    mesh(prism(7, 0.055 * t, 0.06 * t, 0.12, 'top'), M.iron, j.foreR, [0, -0.06, 0]);
    mesh(box(0.27 * t, 0.06, 0.18 * t), M.leather, j.pelvis, [0, 0.06, 0]); mesh(flat(new THREE.OctahedronGeometry(0.04, 0)), M.bone, j.pelvis, [0, 0.06, 0.09 * t], [0, 0, 0], [1, 1, 0.5]);
    j.cleaver = cleaver(M, 0.95, c === 'king'); j.handR.add(j.cleaver); j.cleaver.position.set(0, -0.06, 0.02); j.cleaver.rotation.set(Math.PI / 2 + 0.9, 0, 0);
    // cape: crimson rag (warlord) or royal crimson with gold hem (king)
    const COLS = 6, ROWS = 8; const cg = new THREE.PlaneGeometry(1, 1, COLS - 1, ROWS - 1);
    const cape = mesh(cg, c === 'king' ? M.royal : M.crimson, j.chest); cape.frustumCulled = false;
    j.capeData = { COLS, ROWS, geo: cg, len: c === 'king' ? 0.95 : 0.7, top: Array.from({ length: COLS }, (_, i) => { const a = (i / (COLS - 1) - 0.5) * 2.4; return [Math.sin(a) * 0.17 * t, 0.2, -0.08 * t - Math.cos(a) * 0.03]; }) };
  }
  if (c === 'king') {
    const pr = spikedPauldron(M, 0.95, 1); j.armR.add(pr); pr.position.set(0.02, 0.0, 0);
    // breastplate of dark iron with gold trim
    mesh(taper(0.27 * t, 0.17 * t, 0.33 * t, 0.19 * t, 0.2), M.darkIron, j.chest, [0, 0.01, 0.006]);
    mesh(box(0.33 * t, 0.025, 0.2 * t), M.gold, j.chest, [0, 0.2, 0.004]);
    mesh(box(0.025, 0.18, 0.2 * t), M.gold, j.chest, [0, 0.1, 0.006]);
    // the crown: a jagged gold ring with a blood-red stone, worn between the ears
    const crown = group(hs, [0, 0.215, -0.01]); j.crown = crown;
    mesh(prism(8, 0.1, 0.105, 0.045, 'bottom', true), M.gold, crown);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const hgt = [0.09, 0.05, 0.07, 0.05, 0.09, 0.05, 0.07, 0.05][k]; mesh(prism(3, 0.025, 0.0, hgt), M.gold, crown, [Math.sin(a) * 0.1, 0.04, Math.cos(a) * 0.1]); }
    mesh(flat(new THREE.OctahedronGeometry(0.018, 0)), M.gem, crown, [0, 0.025, 0.105], [0, 0, 0], [1, 1.3, 0.6]);
  }
  if (c === 'survivor') { j.spear = boneSpear(M, 1.05); j.handR.add(j.spear); j.spear.position.set(0, -0.05, 0.02); j.spear.rotation.set(Math.PI / 2 + 1.0, 0, 0); }
  j.root.scale.setScalar(st.scale);
  j.M = M; j.stage = stageName; j.st = st;
  j.hipH = d.hip;
  applyPose(j, { hipY: d.hip });
  if (j.capeData) updateCape(j, 0, {});
  return j;
}
export function updateCape(j, tm, o = {}) {
  if (!j.capeData) return;
  const { COLS, ROWS, geo, top, len } = j.capeData, p = geo.attributes.position;
  const wind = o.wind ?? 0.4, back = o.back ?? 0.18;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, f = r / (ROWS - 1), tp = top[c];
    const fl = Math.sin(tm * 4.7 + c * 0.9 - r * 0.7) * wind * f * 0.25;
    p.setXYZ(i, tp[0] * (1 + f * 0.35) + fl * 0.3, tp[1] - f * len * (o.len ?? 1), tp[2] - back * f * f - Math.abs(fl) * 0.5 - wind * f * f * 0.3);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}
// goblin poses (hips are low!)
export const G_HIP = 0.56;
export function gWalk(ph, o = {}) {
  const a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), st = o.stride ?? 0.5, hunch = o.hunch ?? 0.3;
  return {
    hipY: (o.hip ?? G_HIP) - Math.abs(c) * 0.025 * st * 2 - (o.crouch ?? 0),
    pelvis: [0, s * 0.1, 0], spine: [hunch, -s * 0.06, 0], chest: [0.08, -s * 0.08, s * 0.03], neck: [-0.25, 0, 0], head: [-hunch * 0.6, s * 0.05, 0],
    thighL: [-s * st - 0.1, 0, 0.12], shinL: [Math.max(0, -c) * st * 1.4 + 0.2, 0, 0], footL: [s * 0.2 - 0.1, 0, -0.1],
    thighR: [s * st - 0.1, 0, -0.12], shinR: [Math.max(0, c) * st * 1.4 + 0.2, 0, 0], footR: [-s * 0.2 - 0.1, 0, 0.1],
    armL: [s * 0.5 * (o.armL ?? 1), 0, -0.2], foreL: [-0.4, 0, 0], armR: [-s * 0.5 * (o.armR ?? 1), 0, 0.2], foreR: [-0.45, 0, 0],
  };
}
export function gStand(o = {}) { const p = gWalk(0, { stride: 0, hunch: o.hunch ?? 0.25, hip: o.hip }); p.armL = [0.05, 0, -0.18]; p.armR = [0.05, 0, 0.18]; return p; }

// ---------------------------------------------------------------- knights of the kingdom
export function knightMaterials() {
  return { iron: mat({ map: T('iron'), color: 0xd0d0d6, rim: 1 }), mail: mat({ map: T('lamellar'), color: 0xb0b0b8, rim: 1 }), tabard: mat({ map: TG('tabard'), side: THREE.DoubleSide, rim: 0.6, wrap: 0.6 }),
    kite: mat({ map: TG('kite'), rim: 0.6 }), leather: mat({ map: TG('leather'), rim: 1 }), slit: mat({ color: 0x080808, unlit: true }), wood: mat({ map: T('wood'), color: 0xa08868 }), torch: mat({ color: 0xffb040, emissive: 0xff8020, unlit: true }) };
}
export function buildKnightNPC(M, o = {}) {
  const d = { hip: 0.98, spineOff: 0.07, abd: 0.18, chestH: 0.3, neckH: 0.07, shW: 0.22, upper: 0.3, fore: 0.28, thigh: 0.47, shin: 0.46, hipW: 0.1 };
  const j = rig(d);
  mesh(taper(0.34, 0.22, 0.32, 0.21, 0.17, { anchor: 'center' }), M.mail, j.pelvis);
  const tf = group(j.pelvis, [0, 0.05, 0.125]); mesh(taper(0.28, 0.012, 0.26, 0.012, 0.55, { anchor: 'top' }), M.tabard, tf);
  const tb = group(j.pelvis, [0, 0.05, -0.12]); mesh(taper(0.3, 0.012, 0.28, 0.012, 0.55, { anchor: 'top' }), M.tabard, tb);
  mesh(taper(0.3, 0.2, 0.36, 0.24, 0.19), M.mail, j.spine);
  mesh(taper(0.4, 0.25, 0.46, 0.27, 0.3), M.tabard, j.chest);
  mesh(box(0.36, 0.05, 0.25), M.leather, j.pelvis, [0, 0.07, 0]);
  // great helm: flat-topped cylinder with a cross slit
  mesh(prism(8, 0.13, 0.125, 0.29), M.iron, j.head, [0, -0.03, 0], [0, Math.PI / 8, 0]);
  mesh(box(0.16, 0.018, 0.02), M.slit, j.head, [0, 0.17, 0.122]); mesh(box(0.018, 0.12, 0.02), M.slit, j.head, [0, 0.12, 0.123]);
  for (const s of ['L', 'R']) {
    mesh(flat(new THREE.SphereGeometry(0.11, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2)), M.iron, j['arm' + s], [0, 0.03, 0]);
    mesh(taper(0.1, 0.1, 0.11, 0.11, d.upper, { anchor: 'top' }), M.mail, j['arm' + s]);
    mesh(taper(0.09, 0.09, 0.11, 0.11, d.fore, { anchor: 'top' }), M.iron, j['fore' + s]);
    mesh(box(0.085, 0.11, 0.1, 'top'), M.iron, j['hand' + s]);
    mesh(taper(0.13, 0.14, 0.16, 0.17, d.thigh, { anchor: 'top' }), M.mail, j['thigh' + s]);
    mesh(taper(0.11, 0.12, 0.13, 0.14, d.shin, { anchor: 'top' }), M.iron, j['shin' + s]);
    mesh(taper(0.1, 0.24, 0.11, 0.21, 0.08, { anchor: 'top', oz: 0.03 }), M.iron, j['foot' + s], [0, 0.01, 0.05]);
  }
  if (o.torch) { const tg = group(j.handR, [0, -0.06, 0], [Math.PI / 2, 0, 0]); mesh(prism(5, 0.025, 0.03, 0.6, 'center'), M.wood, tg, [0, 0.1, 0]); mesh(prism(6, 0.05, 0.04, 0.1), M.torch, tg, [0, 0.4, 0]); j.torchTip = group(tg, [0, 0.5, 0]); }
  else {
    const sw = group(j.handR, [0, -0.06, 0.02], [Math.PI / 2 + 0.6, 0, 0]); j.sword = sw;
    mesh(box(0.05, 0.9, 0.012, 'bottom'), M.iron, sw, [0, 0.05, 0]); mesh(box(0.2, 0.03, 0.03), M.iron, sw, [0, 0.04, 0]); mesh(prism(5, 0.018, 0.02, 0.16, 'top'), M.leather, sw, [0, 0.03, 0]);
  }
  if (o.shield !== false) {
    const ks = new THREE.Shape(); ks.moveTo(-0.2, 0.3); ks.quadraticCurveTo(0, 0.36, 0.2, 0.3); ks.lineTo(0.17, -0.05); ks.quadraticCurveTo(0.1, -0.35, 0, -0.5); ks.quadraticCurveTo(-0.1, -0.35, -0.17, -0.05); ks.lineTo(-0.2, 0.3);
    const kg = new THREE.ShapeGeometry(ks, 3); const uv = kg.attributes.uv, p = kg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 0.2) / 0.4, (p.getY(i) + 0.5) / 0.86);
    const sg = group(j.foreL, [-0.08, -0.15, 0.03], [0, -Math.PI / 2, 0]); mesh(kg, M.kite, sg); mesh(new THREE.ExtrudeGeometry(ks, { depth: 0.02, bevelEnabled: false }), M.iron, sg, [0, 0, -0.025]);
    j.shieldG = sg;
  }
  j.M = M; applyPose(j, { hipY: d.hip });
  return j;
}

// ---------------------------------------------------------------- the brute (a tusked ogre-like giant of the ruins)
export function buildBrute() {
  const M = { skin: mat({ map: TG('brute'), rim: 1, wrap: 0.5 }), iron: mat({ map: T('iron'), rim: 1, color: 0xc8c8cc }), darkIron: mat({ map: T('iron'), rim: 1, color: 0x8a8a90 }), bone: mat({ map: TG('bone'), rim: 1 }),
    leather: mat({ map: TG('leather'), rim: 1 }), leatherD: mat({ map: TG('leather'), side: THREE.DoubleSide }), eye: mat({ color: 0xff3010, emissive: 0xff2008, unlit: true }), dark: mat({ color: 0x100604, unlit: true }), wood: mat({ map: T('wood') }), gold: mat({ map: TG('gold') }) };
  const d = { hip: 0.95, spineOff: 0.1, abd: 0.3, chestH: 0.42, neckH: 0.06, shW: 0.4, upper: 0.48, fore: 0.46, thigh: 0.45, shin: 0.45, hipW: 0.19 };
  const j = rig(d);
  mesh(taper(0.62, 0.46, 0.58, 0.44, 0.26, { anchor: 'center' }), M.skin, j.pelvis);
  mesh(taper(0.66, 0.6, 0.74, 0.54, 0.32), M.skin, j.spine);          // gut
  mesh(taper(0.82, 0.5, 0.92, 0.5, 0.42), M.skin, j.chest);
  mesh(prism(6, 0.14, 0.12, 0.1), M.skin, j.neck);
  mesh(taper(0.24, 0.24, 0.2, 0.2, 0.24), M.skin, j.head, [0, -0.02, 0.06]);
  mesh(taper(0.28, 0.16, 0.24, 0.12, 0.1), M.skin, j.head, [0, -0.02, 0.16]);       // underbite jaw
  for (const s of [-1, 1]) { mesh(prism(3, 0.025, 0.0, 0.12), M.bone, j.head, [s * 0.09, 0.06, 0.22]); mesh(box(0.04, 0.02, 0.02), M.eye, j.head, [s * 0.06, 0.15, 0.17]); }
  mesh(prism(8, 0.16, 0.15, 0.12), M.darkIron, j.head, [0, 0.17, 0.04]);           // iron cap with horns
  for (const s of [-1, 1]) mesh(prism(4, 0.04, 0.0, 0.22), M.bone, j.head, [s * 0.14, 0.24, 0.04], [0, 0, -s * 0.9]);
  for (const s of ['L', 'R']) {
    mesh(taper(0.22, 0.22, 0.26, 0.26, d.upper, { anchor: 'top' }), M.skin, j['arm' + s]); mesh(taper(0.18, 0.18, 0.24, 0.24, d.fore, { anchor: 'top' }), M.skin, j['fore' + s]);
    mesh(box(0.22, 0.2, 0.22, 'top'), M.skin, j['hand' + s]);
    mesh(taper(0.26, 0.28, 0.3, 0.3, d.thigh, { anchor: 'top' }), M.skin, j['thigh' + s]); mesh(taper(0.2, 0.22, 0.25, 0.26, d.shin, { anchor: 'top' }), M.skin, j['shin' + s]);
    mesh(box(0.24, 0.1, 0.34, 'top'), M.skin, j['foot' + s], [0, 0, 0.07]);
  }
  const pl = spikedPauldron(M, 1.4, -1); j.armL.add(pl); pl.position.set(-0.06, 0.06, 0); j.pauldron = pl;
  mesh(box(0.66, 0.1, 0.5), M.leather, j.pelvis, [0, 0.12, 0]); mesh(taper(0.4, 0.02, 0.34, 0.02, 0.5, { anchor: 'top' }), M.leatherD, j.pelvis, [0, 0.08, 0.24]);
  // same world size as the warlord's cleaver (brute scale 1.5)
  j.cleaver = cleaver(M, 0.95 / 1.5, false); j.handR.add(j.cleaver); j.cleaver.position.set(0, -0.1, 0.04); j.cleaver.rotation.set(Math.PI / 2 + 0.7, 0, 0);
  j.root.scale.setScalar(1.5); j.M = M; applyPose(j, { hipY: d.hip });
  return j;
}

// ---------------------------------------------------------------- the dire wolf and a hare
export function buildWolf(o = {}) {
  const M = { fur: mat({ map: TG('fur'), color: o.color ?? 0x9a9696, rim: 1, wrap: 0.5 }), dark: mat({ color: 0x1a1414, unlit: true }), eye: mat({ color: 0xfff0c0, emissive: 0xffe0a0, unlit: true }), bone: mat({ map: TG('bone') }) };
  const root = new THREE.Group(); const body = group(root, [0, 0.62, 0]);
  mesh(taper(0.34, 0.5, 0.3, 0.42, 0.34, { anchor: 'center' }), M.fur, body, [0, 0.02, 0.18], [Math.PI / 2, 0, 0]);
  mesh(taper(0.26, 0.36, 0.22, 0.3, 0.32, { anchor: 'center' }), M.fur, body, [0, 0.0, -0.18], [Math.PI / 2, 0, 0]);
  const neck = group(body, [0, 0.08, 0.38], [-0.5, 0, 0]); mesh(taper(0.2, 0.22, 0.16, 0.18, 0.22), M.fur, neck);
  const head = group(neck, [0, 0.22, 0.02], [0.9, 0, 0]);
  mesh(box(0.2, 0.17, 0.2), M.fur, head, [0, 0.0, 0.0]);
  mesh(taper(0.14, 0.12, 0.08, 0.08, 0.2, { anchor: 'bottom' }), M.fur, head, [0, -0.03, 0.09], [Math.PI / 2, 0, 0]);
  const jaw = group(head, [0, -0.07, 0.08]); mesh(taper(0.11, 0.06, 0.06, 0.04, 0.18, { anchor: 'bottom' }), M.fur, jaw, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) { mesh(prism(3, 0.045, 0.0, 0.12), M.fur, head, [s * 0.06, 0.1, -0.03], [-0.2, 0, -s * 0.2]); mesh(box(0.03, 0.014, 0.01), M.eye, head, [s * 0.05, 0.03, 0.1]); mesh(prism(3, 0.01, 0.0, 0.04), M.bone, jaw, [s * 0.03, 0.02, 0.15]); }
  const legs = {};
  for (const [n, x, z] of [['FL', 0.12, 0.3], ['FR', -0.12, 0.3], ['HL', 0.11, -0.28], ['HR', -0.11, -0.28]]) {
    const hip = group(body, [x, -0.05, z]); mesh(taper(0.09, 0.12, 0.07, 0.09, 0.3, { anchor: 'top' }), M.fur, hip);
    const knee = group(hip, [0, -0.3, 0]); mesh(taper(0.05, 0.05, 0.06, 0.06, 0.28, { anchor: 'top' }), M.fur, knee);
    const paw = group(knee, [0, -0.28, 0]); mesh(box(0.08, 0.04, 0.12), M.fur, paw, [0, -0.01, 0.03]);
    legs[n] = { hip, knee, paw, front: n[0] === 'F' };
  }
  const tail = group(body, [0, 0.06, -0.35], [2.4, 0, 0]); mesh(taper(0.08, 0.08, 0.02, 0.02, 0.4), M.fur, tail);
  root.scale.setScalar(o.scale ?? 1.6);
  return { root, body, neck, head, jaw, legs, tail, M };
}
export function poseWolf(w, o = {}) {
  const ph = (o.phase ?? 0) * Math.PI * 2, run = o.run ?? 0;
  w.body.position.y = 0.62 + Math.abs(Math.sin(ph)) * 0.06 * run + (o.lift ?? 0);
  w.body.rotation.x = (o.pitch ?? 0) + Math.sin(ph) * 0.08 * run;
  w.neck.rotation.x = -0.5 + (o.neck ?? 0); w.jaw.rotation.x = o.jaw ?? 0.1; w.tail.rotation.x = 2.4 + Math.sin(ph * 2) * 0.1;
  for (const [n, L] of Object.entries(w.legs)) { const off = L.front ? 0 : Math.PI; const s = Math.sin(ph + off + (n[1] === 'L' ? 0.3 : 0)); L.hip.rotation.x = (o.legs ?? s * 0.7 * run) + (o.reach && L.front ? -1.0 : 0) + (o.reach && !L.front ? 0.8 : 0); L.knee.rotation.x = (L.front ? -1 : 1) * Math.max(0, -s) * 0.9 * run + (o.tuck ?? 0) * (L.front ? -1 : 1); }
}
export function buildHare() {
  const m = mat({ map: TG('fur'), color: 0xb09070, rim: 1 }), e = mat({ color: 0x100804, unlit: true });
  const root = new THREE.Group(); const b = group(root, [0, 0.1, 0]);
  mesh(taper(0.12, 0.2, 0.1, 0.16, 0.12, { anchor: 'center' }), m, b);
  const h = group(b, [0, 0.07, 0.1]); mesh(box(0.08, 0.08, 0.1), m, h);
  for (const s of [-1, 1]) { mesh(taper(0.025, 0.01, 0.015, 0.008, 0.14), m, h, [s * 0.02, 0.03, -0.02], [-0.3, 0, s * 0.15]); mesh(box(0.012, 0.012, 0.012), e, h, [s * 0.035, 0.015, 0.03]); }
  return { root, body: b };
}

// ---------------------------------------------------------------- instanced goblin hordes
export function hordeGeo(kneel = false) {
  const parts = kneel ? [
    taper(0.2, 0.18, 0.24, 0.18, 0.28, {}), xf(taper(0.24, 0.16, 0.3, 0.17, 0.24, {}), { p: [0, 0.22, 0.08], r: [0.6, 0, 0] }), xf(box(0.22, 0.2, 0.22, 'bottom'), { p: [0, 0.38, 0.24] }),
    xf(taper(0.04, 0.012, 0.0, 0.006, 0.32), { p: [0.13, 0.48, 0.22], r: [0, 0, -1.25] }), xf(taper(0.04, 0.012, 0.0, 0.006, 0.32), { p: [-0.13, 0.48, 0.22], r: [0, 0, 1.25] }),
  ] : [
    taper(0.2, 0.15, 0.22, 0.16, 0.5, {}), xf(taper(0.24, 0.16, 0.3, 0.17, 0.32, {}), { p: [0, 0.48, 0] }), xf(box(0.22, 0.2, 0.22, 'bottom'), { p: [0, 0.82, 0.04] }),
    xf(taper(0.04, 0.012, 0.0, 0.006, 0.34), { p: [0.13, 0.94, 0.0], r: [0, 0, -1.2] }), xf(taper(0.04, 0.012, 0.0, 0.006, 0.34), { p: [-0.13, 0.94, 0.0], r: [0, 0, 1.2] }),
    xf(box(0.025, 1.6, 0.025, 'bottom'), { p: [0.2, 0.1, 0.12] }), xf(taper(0.05, 0.01, 0.0, 0.01, 0.16), { p: [0.2, 1.7, 0.12] }),
  ];
  return merge(parts);
}
export function horde(positions, o = {}) {
  const geo = hordeGeo(o.kneel); const m = mat({ map: TG('gskin'), color: 0xffffff, rim: 1, wrap: 0.6 });
  const im = new THREE.InstancedMesh(geo, m, positions.length);
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), R = rng(o.seed || 5);
  const tints = [0xffffff, 0xe0f0c8, 0xc8d8b0, 0xf0e8c0, 0xb8c8a0];
  positions.forEach((p, i) => { const yaw = (o.yawFn ? o.yawFn(p) : (o.yaw ?? 0)) + (R() - 0.5) * 0.4; q.setFromEuler(new THREE.Euler(0, yaw, 0)); const s = (o.scale ?? 1) * (0.85 + R() * 0.3); M4.compose(p, q, v3(s, s, s)); im.setMatrixAt(i, M4); im.setColorAt(i, new THREE.Color(tints[Math.floor(R() * tints.length)])); });
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false;
  im.userData.base = positions.map(p => p.clone());
  return im;
}
