// Original characters of Vhaldren: Cael Vorn, Ashwights, ash statues, the Knellwyrm.
import { THREE, mat, taper, box, prism, loft, mesh, group, glow, particles, merge, xf, flat, v3, rng, clamp, lerp, orientOut } from './engine.js';
import { T } from './textures.js';

// ---------------------------------------------------------------- humanoid rig (segmented, PS1 style)
const JOINTS = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shL', 'armL', 'foreL', 'handL', 'shR', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR'];
export function rig(d) {
  const root = new THREE.Group(); const j = { root };
  j.pelvis = group(root, [0, d.hip, 0]);
  j.spine = group(j.pelvis, [0, d.spineOff, 0]);
  j.chest = group(j.spine, [0, d.abd, 0]);
  j.neck = group(j.chest, [0, d.chestH, 0]);
  j.head = group(j.neck, [0, d.neckH, 0]);
  for (const [s, sx] of [['L', -1], ['R', 1]]) {
    j['sh' + s] = group(j.chest, [sx * d.shW, d.chestH - 0.05, 0]);
    j['arm' + s] = group(j['sh' + s], [0, 0, 0]);
    j['fore' + s] = group(j['arm' + s], [0, -d.upper, 0]);
    j['hand' + s] = group(j['fore' + s], [0, -d.fore, 0]);
    j['thigh' + s] = group(j.pelvis, [sx * d.hipW, -0.02, 0]);
    j['shin' + s] = group(j['thigh' + s], [0, -d.thigh, 0]);
    j['foot' + s] = group(j['shin' + s], [0, -d.shin, 0]);
  }
  return j;
}
// pose: { joint: [rx, ry, rz], rootY, root:[x,y,z] }
export function applyPose(j, pose) {
  for (const k of JOINTS) { const r = pose[k]; if (r) j[k].rotation.set(r[0], r[1], r[2]); else j[k].rotation.set(0, 0, 0); }
  if (pose.hipY !== undefined) j.pelvis.position.y = pose.hipY;
}
export function mixPose(a, b, t) {
  const o = {};
  for (const k of JOINTS) { const ra = a[k] || [0, 0, 0], rb = b[k] || [0, 0, 0]; o[k] = [lerp(ra[0], rb[0], t), lerp(ra[1], rb[1], t), lerp(ra[2], rb[2], t)]; }
  if (a.hipY !== undefined || b.hipY !== undefined) o.hipY = lerp(a.hipY ?? b.hipY, b.hipY ?? a.hipY, t);
  return o;
}
export function addPose(a, b) { const o = { ...a }; for (const k of JOINTS) { const ra = a[k] || [0, 0, 0], rb = b[k] || [0, 0, 0]; o[k] = [ra[0] + rb[0], ra[1] + rb[1], ra[2] + rb[2]]; } return o; }

// Walk cycle (phase in cycles). heavy: 0..1 weariness
export function walkPose(ph, o = {}) {
  const a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), st = o.stride ?? 0.5, hunch = o.hunch ?? 0.08;
  return {
    hipY: (o.hip ?? 1.0) - Math.abs(c) * 0.03 * st * 2,
    pelvis: [0, s * 0.08, 0],
    spine: [hunch, -s * 0.05, 0], chest: [0.02, -s * 0.06, s * 0.02], neck: [-0.04, 0, 0], head: [-hunch * 0.5, s * 0.04, 0],
    thighL: [-s * st, 0, 0.02], shinL: [Math.max(0, -c) * st * 1.4 + 0.08, 0, 0], footL: [s * 0.2 - 0.05, 0, 0],
    thighR: [s * st, 0, -0.02], shinR: [Math.max(0, c) * st * 1.4 + 0.08, 0, 0], footR: [-s * 0.2 - 0.05, 0, 0],
    armL: [s * 0.35 * (o.armL ?? 1), 0, -0.12], foreL: [-0.25, 0, 0],
    armR: [-s * 0.25 * (o.armR ?? 1), 0, 0.14], foreR: [-0.3, 0, 0],
  };
}

// ---------------------------------------------------------------- CAEL VORN
// Helm: original "keel-prow" helm — a forward-pointed faceted prow face, a raised keel crest,
// a chevron (V) eye-slit, a sallet-like back flare, a single swept spur on the LEFT temple,
// and a small faded-brass diamond sigil on the brow.
export function helmGeometry() {
  const ring = (y, f, s, b) => ({ y, pts: [[0, f], [s * 0.75, f * 0.55], [s, 0], [s * 0.92, -b * 0.6], [0, -b], [-s * 0.92, -b * 0.6], [-s, 0], [-s * 0.75, f * 0.55]] });
  return loft([ring(-0.04, 0.16, 0.128, 0.175), ring(0.06, 0.215, 0.118, 0.14), ring(0.19, 0.205, 0.124, 0.135), ring(0.28, 0.12, 0.1, 0.12), ring(0.345, 0.03, 0.04, 0.05)]);
}
export function buildHelm(parent, M, o = {}) {
  const h = group(parent);
  mesh(helmGeometry(), M.iron, h);
  mesh(taper(0.028, 0.46, 0.012, 0.3, 0.11, { oz: -0.06 }), M.iron, h, [0, 0.29, -0.01], [-0.05, 0, 0]);       // keel fin
  mesh(taper(0.22, 0.025, 0.25, 0.025, 0.13, { anchor: 'top', oz: -0.05 }), M.iron, h, [0, 0.02, -0.12], [-0.55, 0, 0]); // back flare
  const spur = mesh(prism(4, 0.025, 0.002, 0.2), M.iron, h, [-0.115, 0.22, -0.02], [-2.0, 0, 0.55]);               // left temple spur
  // chevron eye-slit
  // front faces run from the prow point (0, 0.195) to (0.092, 0.107): angle about y
  const th = Math.atan2(0.21 - 0.116, 0.091);
  for (const sx of [1, -1]) mesh(box(0.09, 0.017, 0.014), M.slit, h, [sx * 0.042, 0.175, 0.166], [0, sx * th, sx * 0.42]);
  // brow sigil: brass diamond
  mesh(flat(new THREE.OctahedronGeometry(0.024, 0)), M.brass, h, [0, 0.25, 0.165], [0, 0, 0], [1, 1.3, 0.5]);
  h.userData.spur = spur;
  return h;
}

// Sword "Vowbrand": long single-edged blade with a hooked back-spur near the tip,
// an open octagonal ring-guard, ember vein along the blade.
export function buildSword(M) {
  const s = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-0.032, 0); sh.lineTo(0.034, 0); sh.lineTo(0.03, 0.75); sh.quadraticCurveTo(0.025, 0.98, -0.032, 1.1); // edge to tip
  sh.lineTo(-0.034, 0.93); sh.lineTo(-0.075, 0.9); sh.lineTo(-0.034, 0.86); // hooked back-spur
  sh.lineTo(-0.032, 0);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: false, curveSegments: 3 }); bg.translate(0, 0, -0.007);
  mesh(flat(bg), M.blade, s, [0, 0.03, 0]);
  mesh(box(0.008, 0.8, 0.018), M.vein, s, [0.0, 0.45, 0]);
  const ring = new THREE.TorusGeometry(0.075, 0.013, 3, 8); mesh(flat(ring), M.brass, s, [0, 0.0, 0], [0, 0, Math.PI / 8]);
  mesh(box(0.16, 0.02, 0.03), M.iron, s, [0, 0.0, 0]);
  mesh(prism(6, 0.017, 0.019, 0.22, 'top'), M.leather, s, [0, -0.0, 0]);
  mesh(flat(new THREE.OctahedronGeometry(0.035, 0)), M.brass, s, [0, -0.25, 0], [0, 0, 0], [1, 1.4, 1]);
  return s;
}

export function knightMaterials() {
  return {
    iron: mat({ map: T('iron'), emap: T('ironCrack'), emissive: 0x000000 , rim: 1 }),
    lam: mat({ map: T('lamellar'), emap: T('ironCrack'), emissive: 0x000000 , rim: 1 }),
    brass: mat({ map: T('brass') , rim: 1 }),
    gamb: mat({ map: T('gambeson') , rim: 1 }),
    leather: mat({ map: T('leather') , rim: 1 }),
    cloak: mat({ map: T('cloak'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 , rim: 1 }),
    tabard: mat({ map: T('tabard'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.7 , rim: 1 }),
    slit: mat({ color: 0xff7a22, emissive: 0xff8a33, unlit: true, pierce: 3 }),
    blade: mat({ map: T('iron'), color: 0xb8b4b0, repeat: [0.4, 1] , rim: 1 }),
    vein: mat({ color: 0xff6a1a, emissive: 0xff7020, unlit: true }),
    ember: mat({ color: 0xffa040, emissive: 0xffa040, unlit: true }),
  };
}

export function buildKnight(o = {}) {
  const M = knightMaterials();
  const d = { hip: 1.0, spineOff: 0.07, abd: 0.18, chestH: 0.3, neckH: 0.07, shW: 0.23, upper: 0.29, fore: 0.27, thigh: 0.46, shin: 0.46, hipW: 0.1 };
  const j = rig(d);
  // pelvis / belt / tabard
  mesh(taper(0.34, 0.22, 0.32, 0.21, 0.17, { anchor: 'center' }), M.lam, j.pelvis, [0, 0, 0]);
  mesh(box(0.37, 0.05, 0.25), M.leather, j.pelvis, [0, 0.06, 0]);
  mesh(box(0.06, 0.06, 0.02), M.brass, j.pelvis, [0, 0.06, 0.13]);
  const tabF = group(j.pelvis, [0, 0.05, 0.125]); mesh(taper(0.24, 0.012, 0.2, 0.012, 0.6, { anchor: 'top' }), M.tabard, tabF);
  const tabB = group(j.pelvis, [0, 0.05, -0.12]); mesh(taper(0.26, 0.012, 0.22, 0.012, 0.62, { anchor: 'top' }), M.tabard, tabB);
  // torso
  mesh(taper(0.3, 0.2, 0.36, 0.24, 0.19), M.lam, j.spine);
  mesh(taper(0.4, 0.25, 0.47, 0.27, 0.3, { oz: 0.01 }), M.iron, j.chest);
  mesh(taper(0.08, 0.02, 0.1, 0.02, 0.22), M.iron, j.chest, [0, 0.04, 0.13], [0.05, 0, 0]); // central ridge
  mesh(box(0.47, 0.03, 0.28), M.brass, j.chest, [0, 0.29, 0.0]);
  mesh(prism(6, 0.1, 0.085, 0.09), M.lam, j.neck, [0, -0.02, 0]);
  // helm
  j.helm = buildHelm(j.head, M);
  // right pauldron: three layered plates
  for (let i = 0; i < 3; i++) mesh(taper(0.19 - i * 0.02, 0.24 - i * 0.02, 0.15 - i * 0.02, 0.2 - i * 0.02, 0.06, { anchor: 'center' }), i === 0 ? M.iron : M.lam, j.armR, [0.04 + i * 0.02, 0.05 - i * 0.06, 0], [0, 0, -0.45 - i * 0.12]);
  mesh(taper(0.14, 0.16, 0.1, 0.12, 0.08, { anchor: 'center' }), M.leather, j.armL, [-0.03, 0.04, 0], [0, 0, 0.4]);
  // arms
  for (const s of ['L', 'R']) {
    mesh(taper(0.11, 0.11, 0.12, 0.12, d.upper, { anchor: 'top' }), M.gamb, j['arm' + s]);
    mesh(box(0.13, 0.08, 0.14), M.iron, j['fore' + s], [0, 0.0, 0]);
    mesh(taper(0.095, 0.1, 0.12, 0.12, d.fore, { anchor: 'top' }), M.iron, j['fore' + s]);
    mesh(box(0.085, 0.11, 0.1, 'top'), M.leather, j['hand' + s]);
    mesh(box(0.09, 0.05, 0.105, 'top'), M.iron, j['hand' + s], [0, 0.0, 0.005]);
    // legs
    mesh(taper(0.14, 0.15, 0.17, 0.18, d.thigh, { anchor: 'top' }), M.lam, j['thigh' + s]);
    mesh(box(0.13, 0.1, 0.14), M.iron, j['shin' + s], [0, 0, 0.02]);
    mesh(taper(0.11, 0.12, 0.13, 0.14, d.shin, { anchor: 'top' }), M.iron, j['shin' + s]);
    mesh(taper(0.11, 0.25, 0.12, 0.22, 0.08, { anchor: 'top', oz: 0.03 }), M.iron, j['foot' + s], [0, 0.01, 0.05]);
  }
  // lantern (the Pilgrim's Spark) on left hip
  const lan = group(j.pelvis, [-0.21, 0.02, 0.06]);
  mesh(box(0.012, 0.1, 0.012, 'top'), M.iron, lan);
  const cage = group(lan, [0, -0.1, 0]);
  mesh(prism(6, 0.055, 0.045, 0.11, 'top', true), M.iron, cage);
  mesh(prism(6, 0.06, 0.02, 0.03, 'bottom'), M.iron, cage, [0, 0, 0]);
  mesh(flat(new THREE.OctahedronGeometry(0.03, 0)), M.ember, cage, [0, -0.055, 0]);
  const lg = glow(0xff8a30, 0.45, 0.7); cage.add(lg); lg.position.set(0, -0.055, 0);
  j.lantern = cage; j.lanternRoot = lan; j.lanternGlow = lg;
  // sword in right hand
  j.sword = buildSword(M); j.handR.add(j.sword); j.sword.position.set(0, -0.06, 0.02); j.sword.rotation.set(Math.PI / 2 + 0.9, 0, 0);
  // half-cloak over the left shoulder (grid mesh animated on CPU)
  const COLS = 6, ROWS = 9;
  const cg = new THREE.PlaneGeometry(1, 1, COLS - 1, ROWS - 1);
  const cloak = mesh(cg, M.cloak, j.chest);
  cloak.frustumCulled = false;
  const top = [[0.06, 0.3, 0.12], [-0.12, 0.31, 0.1], [-0.25, 0.3, 0.0], [-0.2, 0.29, -0.13], [-0.03, 0.27, -0.155], [0.14, 0.25, -0.15]];
  j.cloakData = { COLS, ROWS, top, geo: cg };
  j.M = M; j.dims = d;
  updateCloak(j, 0, {});
  applyPose(j, {});
  return j;
}
export function updateCloak(j, t, o) {
  const { COLS, ROWS, top, geo } = j.cloakData, p = geo.attributes.position;
  const len = o.len ?? 1.0, wind = o.wind ?? 0.4, back = o.back ?? 0.15, side = o.side ?? 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, f = r / (ROWS - 1), tp = top[c];
    const out = v3(tp[0] + 0.02, 0, tp[2]).normalize();
    const flutter = Math.sin(t * 5.3 + c * 0.9 - r * 0.7) * wind * f * 0.25 + Math.sin(t * 2.1 + c * 1.7) * wind * f * 0.12;
    p.setXYZ(i,
      tp[0] + out.x * f * 0.18 + side * f * f + flutter * 0.5,
      tp[1] - f * len * (1 - wind * 0.12 * f),
      tp[2] + out.z * f * 0.12 - back * f * f - Math.abs(flutter) * 0.6 - wind * f * f * 0.35);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}
export function updateKnight(j, t, o = {}) {
  updateCloak(j, t, o);
  // lantern swing (pendulum, counter to hips)
  const sw = o.swing ?? 0.25;
  j.lanternRoot.rotation.set(Math.sin(t * 4.2) * sw * 0.6, 0, Math.sin(t * 2.1 + 1) * sw * 0.4 - (j.pelvis.rotation.z));
  // tabard sway follows thighs
  const th = (j.thighL.rotation.x + j.thighR.rotation.x) * 0.5;
  j.pelvis.children.forEach(() => { });
}
export function knightGlow(j, k, col = [1.6, 0.75, 0.22]) { // molten cracks across armour (0..1)
  for (const m of [j.M.iron, j.M.lam]) m.uniforms.uEmissive.value.setRGB(col[0] * k, col[1] * k, col[2] * k);
}

// ---------------------------------------------------------------- ASHWIGHT
export function ashMaterials() {
  return {
    skin: mat({ map: T('ashskin'), color: 0xc8c4c0 , rim: 1 }),
    rust: mat({ map: T('rust') , rim: 1 }),
    rags: mat({ map: T('rags'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.7 , rim: 1 }),
    eye: mat({ color: 0xdfe8ff, emissive: 0xdfe8ff, unlit: true, pierce: 4 }),
    wood: mat({ map: T('wood') }),
  };
}
export function buildAshwight(o = {}) {
  const M = o.M || ashMaterials();
  const d = { hip: 0.95, spineOff: 0.06, abd: 0.17, chestH: 0.27, neckH: 0.08, shW: 0.19, upper: 0.32, fore: 0.31, thigh: 0.45, shin: 0.43, hipW: 0.09 };
  const j = rig(d);
  const sk = o.stone ? o.stoneMat : M.skin;
  mesh(taper(0.26, 0.17, 0.24, 0.16, 0.14, { anchor: 'center' }), sk, j.pelvis);
  mesh(taper(0.2, 0.14, 0.26, 0.17, 0.18), sk, j.spine);
  mesh(taper(0.3, 0.19, 0.36, 0.2, 0.27), sk, j.chest);
  mesh(prism(5, 0.05, 0.045, 0.1), sk, j.neck);
  // gaunt head
  mesh(taper(0.12, 0.15, 0.15, 0.19, 0.2, { oz: 0.01 }), sk, j.head, [0, 0, 0.01]);
  mesh(taper(0.09, 0.05, 0.11, 0.07, 0.06), sk, j.head, [0, -0.02, 0.07]); // jaw
  if (!o.stone) {
    for (const sx of [-1, 1]) mesh(box(0.02, 0.014, 0.01), M.eye, j.head, [sx * 0.035, 0.11, 0.1]);
    // kettle hat (rusted)
    mesh(prism(8, 0.22, 0.2, 0.02), M.rust, j.head, [0, 0.16, 0]);
    mesh(prism(8, 0.1, 0.06, 0.09), M.rust, j.head, [0, 0.17, 0]);
    // rags front/back
    const rf = group(j.pelvis, [0, 0.05, 0.09]); mesh(taper(0.22, 0.01, 0.2, 0.01, 0.55, { anchor: 'top' }), M.rags, rf);
    const rb = group(j.chest, [0, 0.27, -0.1]); mesh(taper(0.3, 0.01, 0.34, 0.01, 0.9, { anchor: 'top' }), M.rags, rb, [0, 0, 0], [0.12, 0, 0]);
    mesh(taper(0.3, 0.22, 0.36, 0.22, 0.12), M.rust, j.chest, [0, 0.14, 0]); // rusted breastplate remnant
  } else if (o.hood) {
    mesh(taper(0.24, 0.26, 0.12, 0.16, 0.26, { oz: -0.03 }), sk, j.head, [0, 0.02, -0.02]);
  }
  for (const s of ['L', 'R']) {
    mesh(taper(0.075, 0.08, 0.09, 0.09, d.upper, { anchor: 'top' }), sk, j['arm' + s]);
    mesh(taper(0.06, 0.065, 0.075, 0.08, d.fore, { anchor: 'top' }), sk, j['fore' + s]);
    mesh(taper(0.05, 0.03, 0.075, 0.08, 0.13, { anchor: 'top' }), sk, j['hand' + s]);
    mesh(taper(0.09, 0.1, 0.12, 0.12, d.thigh, { anchor: 'top' }), sk, j['thigh' + s]);
    mesh(taper(0.07, 0.08, 0.09, 0.1, d.shin, { anchor: 'top' }), sk, j['shin' + s]);
    mesh(taper(0.08, 0.2, 0.09, 0.18, 0.06, { anchor: 'top', oz: 0.03 }), sk, j['foot' + s], [0, 0.01, 0.04]);
  }
  if (o.halberd) {
    const hb = group(j.handR, [0, -0.08, 0], [Math.PI / 2, 0, 0]);
    mesh(prism(4, 0.018, 0.018, 2.0, 'center'), M.wood, hb, [0, 0.3, 0]);
    const head = new THREE.Shape(); head.moveTo(0, 0); head.lineTo(0.22, 0.05); head.lineTo(0.2, 0.22); head.lineTo(0.05, 0.16); head.lineTo(0, 0.25); head.lineTo(-0.06, 0.1);
    const hg = new THREE.ExtrudeGeometry(head, { depth: 0.012, bevelEnabled: false }); hg.translate(0, 0, -0.006);
    mesh(flat(hg), M.rust, hb, [0.0, 1.05, 0]);
  }
  j.M = M; j.dims = d; applyPose(j, {});
  return j;
}
export function shamblePose(ph, o = {}) {
  const p = walkPose(ph, { stride: 0.32, hunch: 0.45, hip: 0.9, armL: 0.3, armR: 0.3 });
  const a = ph * Math.PI * 2;
  p.neck = [0.25, 0, Math.sin(a * 0.5) * 0.15]; p.head = [-0.35, Math.sin(a * 0.5) * 0.2, 0.1];
  p.armL = [-0.6 + Math.sin(a) * 0.15, 0, -0.15]; p.foreL = [-0.5, 0, 0];
  p.armR = [-0.9 + Math.sin(a + 1) * 0.1, 0, 0.15]; p.foreR = [-0.6, 0, 0];
  p.chest = [0.15, Math.sin(a) * 0.1, Math.sin(a) * 0.06];
  return p;
}

// ---------------------------------------------------------------- THE KNELLWYRM
// A colossal serpentine beast of ash-stone plates and ember cracks, its dorsal spines
// hung with cracked funeral bells. Eyeless skull; a rusted keel-prow helm is fused into its brow.
export function buildWyrm(o = {}) {
  const M = {
    plate: mat({ map: T('wyrm'), emap: T('wyrmE'), emissive: 0x6a3214, color: 0xa8a29e, pierce: 0.5, rim: 1 }),
    bone: mat({ map: T('bone'), color: 0xb0a898, rim: 1 }),
    bronze: mat({ map: T('bronze'), color: 0xd0b090, rim: 1 }),
    rust: mat({ map: T('rust'), rim: 1 }),
    brass: mat({ map: T('brass'), color: 0xd0a060 }),
    maw: mat({ color: 0x5a1404, unlit: true }),
    socket: mat({ color: 0x000000, unlit: true }),
    slit: mat({ color: 0x401008, emissive: 0x200400, unlit: true }),
  };
  const N = o.segments || 22, S = o.scale || 1;
  const root = new THREE.Group();
  const segs = [], bells = [];
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    const r = S * (0.85 + Math.sin(Math.min(1, f * 1.7) * Math.PI * 0.85) * 0.95) * (1 - f * 0.6);
    const seg = new THREE.Group(); root.add(seg);
    const body = new THREE.CylinderGeometry(r * 0.92, r, 3.3 * S, 8, 1); body.rotateX(Math.PI / 2); body.scale(1, 0.82, 1);
    mesh(flat(body), M.plate, seg);
    mesh(taper(r * 0.9, 2.6 * S, r * 0.35, 1.6 * S, r * 0.55, { anchor: 'bottom' }), M.plate, seg, [0, r * 0.62, 0]); // dorsal ridge
    if (i > 1 && i < N - 3 && i % 2 === 0) { // bone hook + funeral bell
      mesh(prism(4, 0.22 * S, 0.03 * S, 2.3 * S), M.bone, seg, [0, r * 0.95, 0.2 * S], [-0.55, 0, 0]);
      const bellG = group(seg, [0, r * 0.95 + 1.85 * S, -1.05 * S]);
      const bs = S * 1.25 * (1 - f * 0.4);
      const prof = [[0.02, 0], [0.3, -0.06], [0.4, -0.45], [0.5, -0.95], [0.78, -1.32], [0.82, -1.42]].map(([x, y]) => new THREE.Vector2(x * bs, y * bs));
      mesh(flat(new THREE.LatheGeometry(prof, 8)), M.bronze, bellG);
      mesh(prism(4, 0.1 * bs, 0.1 * bs, 0.35 * bs, 'top'), M.bronze, bellG, [0, -1.25 * bs, 0]);
      bells.push(bellG);
    }
    if (i % 2 === 1 && i < N - 4) for (const sx of [-1, 1]) mesh(prism(4, 0.2 * S, 0.01, 1.3 * S), M.bone, seg, [sx * r * 0.8, r * 0.35, 0], [0.3, 0, -sx * 1.05]);
    segs.push({ g: seg, w: r * 2, h: r * 1.6 });
  }
  // --- head: long eyeless skull, swept horns, hinged toothed jaw
  const head = new THREE.Group(); root.add(head);
  const ring = (z, w, hh, yo = 0) => ({ y: z, pts: [[0, hh + yo], [w * 0.75, hh * 0.75 + yo], [w, yo], [w * 0.8, -hh * 0.7 + yo], [0, -hh * 0.85 + yo], [-w * 0.8, -hh * 0.7 + yo], [-w, yo], [-w * 0.75, hh * 0.75 + yo]] });
  const skull = loft([ring(-0.6 * S, 1.15 * S, 0.95 * S, 0.15 * S), ring(0.6 * S, 1.2 * S, 0.9 * S, 0.2 * S), ring(2.0 * S, 0.9 * S, 0.62 * S, 0.05 * S), ring(3.6 * S, 0.62 * S, 0.42 * S, -0.08 * S), ring(4.9 * S, 0.4 * S, 0.3 * S, -0.15 * S), ring(5.5 * S, 0.18 * S, 0.16 * S, -0.2 * S)]);
  skull.rotateX(Math.PI / 2); skull.scale(1, -1, 1); orientOut(skull);
  mesh(skull, M.plate, head, [0, 0.35 * S, 0]);
  for (const sx of [-1, 1]) {
    mesh(box(0.55 * S, 0.3 * S, 1.6 * S), M.bone, head, [sx * 0.7 * S, 1.05 * S, 1.6 * S], [0.12, sx * 0.15, sx * 0.25]); // brow ridge
    mesh(box(0.34 * S, 0.24 * S, 0.5 * S), M.socket, head, [sx * 0.78 * S, 0.68 * S, 2.0 * S], [0, sx * 0.3, 0]);         // hollow socket
    let hp = group(head, [sx * 0.9 * S, 1.0 * S, -0.3 * S], [-0.5, sx * 0.35, sx * 0.45]);                                 // swept horn
    for (let k = 0; k < 3; k++) { mesh(prism(5, (0.32 - k * 0.09) * S, (0.23 - k * 0.09) * S, 1.6 * S), M.bone, hp); hp = group(hp, [0, 1.55 * S, 0], [-0.45, 0, sx * 0.15]); }
    mesh(prism(4, 0.14 * S, 0.0, 1.2 * S), M.bone, hp);
  }
  const jaw = group(head, [0, -0.35 * S, -0.2 * S]);
  mesh(taper(1.7 * S, 0.5 * S, 0.45 * S, 0.3 * S, 5.0 * S, { anchor: 'bottom' }), M.bone, jaw, [0, 0, 0], [Math.PI / 2, 0, 0]);
  mesh(box(1.1 * S, 0.06 * S, 3.6 * S), M.maw, jaw, [0, 0.22 * S, 2.2 * S]);
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) {
    mesh(prism(3, 0.11 * S, 0.0, 0.55 * S), M.bone, jaw, [sx * (0.62 - k * 0.07) * S, 0.22 * S, (1.2 + k * 0.62) * S]);
    mesh(prism(3, 0.11 * S, 0.0, 0.5 * S), M.bone, head, [sx * (0.66 - k * 0.07) * S, -0.42 * S, (1.3 + k * 0.62) * S], [Math.PI, 0, 0]);
  }
  // fused rusted helm (same keel-prow design as Cael's) sunk into the brow, with the brass diamond sigil
  const hs = 3.4 * S;
  const fh = group(head, [0, 0.95 * S, 0.55 * S], [-0.22, 0, 0]);
  mesh(helmGeometry(), M.rust, fh, [0, 0, 0], [0, 0, 0], hs);
  mesh(taper(0.028, 0.46, 0.012, 0.3, 0.11, { oz: -0.06 }), M.rust, fh, [0, 0.29 * hs, -0.01 * hs], [-0.05, 0, 0], hs);
  for (const sx of [1, -1]) mesh(box(0.09, 0.017, 0.014), M.slit, fh, [sx * 0.042 * hs, 0.175 * hs, 0.166 * hs], [0, sx * Math.atan2(0.094, 0.091), sx * 0.42], hs);
  const sig = group(fh, [0, 0.25 * hs, 0.165 * hs]);
  mesh(flat(new THREE.OctahedronGeometry(0.024, 0)), M.brass, sig, [0, 0, 0], [0, 0, 0], [hs, hs * 1.3, hs * 0.5]);
  // legs (two front, two rear)
  const legs = [];
  for (const [si, sx] of [[2, -1], [2, 1], [9, -1], [9, 1]]) {
    const hip = group(root);
    const up = group(hip); mesh(taper(0.55 * S, 0.55 * S, 0.8 * S, 0.8 * S, 3.6 * S, { anchor: 'top' }), M.bone, up);
    const lo = group(up, [0, -3.6 * S, 0]); mesh(taper(0.35 * S, 0.35 * S, 0.5 * S, 0.5 * S, 3.8 * S, { anchor: 'top' }), M.bone, lo);
    for (let cl = -1; cl <= 1; cl++) mesh(prism(3, 0.16 * S, 0.0, 1.1 * S), M.bone, lo, [cl * 0.25 * S, -3.8 * S, 0.3 * S], [1.9, cl * 0.3, 0]);
    legs.push({ hip, up, lo, si, sx });
  }
  return { root, segs, head, jaw, bells, legs, M, N, S, fusedHelm: fh };
}
// spine(s) -> Vector3 position for arc-length s (0 = head). Updates the whole beast.
export function poseWyrm(w, spine, t, o = {}) {
  const sp = 2.5 * w.S;
  const pos = (s) => spine(s);
  const hp = pos(0), hn = pos(0.6);
  w.head.position.copy(hp);
  w.head.lookAt(hp.clone().multiplyScalar(2).sub(hn));
  if (o.headRoll) w.head.rotateZ(o.headRoll);
  if (o.headPitch) w.head.rotateX(o.headPitch);
  w.jaw.rotation.x = o.jaw ?? 0.1;
  for (let i = 0; i < w.N; i++) {
    const s = (i + 1) * sp, p = pos(s), q = pos(s + 0.5);
    const g = w.segs[i].g; g.position.copy(p); g.lookAt(p.clone().multiplyScalar(2).sub(q));
    if (o.roll) g.rotateZ(Math.sin(t * 1.2 + i * 0.4) * o.roll);
    g.updateMatrixWorld(true);
  }
  w.bells.forEach((b, k) => { b.rotation.x = Math.sin(t * (2.0 + k * 0.13) + k) * (o.bellSwing ?? 0.35); b.rotation.z = Math.cos(t * 1.7 + k * 1.3) * (o.bellSwing ?? 0.35) * 0.5; });
  w.legs.forEach((L, k) => {
    const seg = w.segs[L.si].g; const wd = w.segs[L.si].w;
    L.hip.position.copy(seg.localToWorld(v3(L.sx * wd * 0.42, -w.segs[L.si].h * 0.2, 0)).sub(w.root.position));
    L.hip.quaternion.copy(seg.quaternion);
    const ph = t * (o.legSpeed ?? 1.5) + k * 1.7;
    const lp = o.legPose ? o.legPose(L, k, t) : [Math.sin(ph) * 0.4 - 0.2, -L.sx * 0.5, 0.9 + Math.cos(ph) * 0.2];
    L.up.rotation.set(lp[0], 0, L.sx * 0.9 * (o.splay ?? 1));
    L.lo.rotation.set(-lp[2] * 0.6, 0, -L.sx * 1.1 * (o.splay ?? 1));
  });
}
