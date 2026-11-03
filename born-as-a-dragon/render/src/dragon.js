// THE ASHBORN — an original low-poly dragon, one rig for every life stage (hatchling → ancient).
// Charcoal-black scales with deep-red seams, glowing amber eyes, a lyre-shaped horn crown (sweeps back then up),
// three cheek spikes per side, a nasal horn, dorsal spikes, a spade-blade tail, bat-like wings with three fingers.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, loft, orientOut, particles, G } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';

// ---------------------------------------------------------------- textures
const cache = {};
export function TD(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  scales: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 701, [8, 4, 2]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 4), cx = (i + (row % 2) * 2) % 4, cy = j % 4; let v = 0.3 + (n(i, j) - 0.5) * 0.14 - cy * 0.014; if (cx === 0 || cy === 3) v = 0.12; if (cy === 0 && cx === 2) v += 0.07; return [C(v * 200), C(v * 192), C(v * 198)]; }); }),
  seams: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 703, [8, 4]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 4), cx = (i + (row % 2) * 2) % 4, cy = j % 4; const s = (cx === 0 || cy === 3) && n(i, j) > 0.6; return s ? [C(140 + n(i, j) * 90), 14, 6] : [0, 0, 0]; }); }),
  belly: () => mk(16, 16, (x, w, h) => { const r = rng(705); pixels(x, w, h, (i, j) => { let v = 0.26 + r() * 0.05; if (j % 4 === 0) v = 0.12; return [C(v * 190), C(v * 160), C(v * 150)]; }); }),
  horn: () => mk(8, 32, (x, w, h) => { const r = rng(707); pixels(x, w, h, (i, j) => { const v = 0.12 + Math.pow(j / h, 2) * 0.32 + r() * 0.04; return [C(v * 220), C(v * 205), C(v * 190)]; }); }),
  membrane: () => mk(64, 64, (x, w, h) => {
    const n = fbm(w, h, 709, [16, 8, 4]);
    pixels(x, w, h, (i, j) => { let v = 0.2 + (n(i, j) - 0.5) * 0.1; const vein = Math.abs(((i + j * 0.3) % 16) - 8) < 0.8 || Math.abs(((j * 1.1 - i * 0.2) % 21) - 10) < 0.7; if (vein) v -= 0.08; return [C(v * 260 + 12), C(v * 80), C(v * 80)]; });
  }),
  membraneT: () => mk(64, 64, (x, w, h) => { // tattered (ancient): holes and torn edges
    const n = fbm(w, h, 709, [16, 8, 4]), hl = fbm(w, h, 711, [16, 8]);
    pixels(x, w, h, (i, j) => { if (hl(i, j) > 0.66 || (i > 56 && hl(i, j) > 0.5)) return [0, 0, 0, 0]; let v = 0.18 + (n(i, j) - 0.5) * 0.1; const vein = Math.abs(((i + j * 0.3) % 16) - 8) < 0.8; if (vein) v -= 0.07; return [C(v * 250 + 10), C(v * 70), C(v * 70), 255]; });
  }),
  bone: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 713, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.55 + (n(i, j) - 0.5) * 0.3; return [C(v * 220), C(v * 205), C(v * 180)]; }); }),
  // eggshell: charcoal with glowing veins (emissive companion)
  shell: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 721, [16, 8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.16 + (n(i, j) - 0.5) * 0.14; return [C(v * 210), C(v * 190), C(v * 180)]; }); }, { mip: true }),
  shellE: () => mk(64, 64, (x, w, h) => { const cr = fbm(w, h, 723, [32, 16, 8]); pixels(x, w, h, (i, j) => { const k = Math.abs(cr(i, j) - 0.5); return k < 0.016 ? [255, 190, 70] : k < 0.028 ? [190, 60, 8] : [0, 0, 0]; }); }, { mip: true }),
};
export function dragonMaterials(o = {}) {
  const sk = o.skeleton;
  return {
    scale: sk ? mat({ map: TD('bone'), rim: 1, color: 0xb8ac98 }) : mat({ map: TD('scales'), emap: TD('seams'), emissive: 0xff3a10, rim: 1, wrap: 0.5, pierce: 0.5 }),
    belly: sk ? mat({ map: TD('bone'), rim: 1, color: 0xa89c88 }) : mat({ map: TD('belly'), rim: 1 }),
    horn: mat({ map: TD('horn'), rim: 1, color: sk ? 0xd8ccb8 : 0xffffff }),
    claw: mat({ color: sk ? 0xc8bca8 : 0x8a8070, rim: 1 }),
    eye: mat({ color: 0xffa020, emissive: 0xff8a10, unlit: true, pierce: 4 }),
    socket: mat({ color: 0x000000, unlit: true }),
    maw: mat({ color: 0x4a0c04, emissive: 0x000000, unlit: true }),
    membrane: mat({ map: TD(o.tatter ? 'membraneT' : 'membrane'), side: THREE.DoubleSide, wrap: 0.9, rim: 0.5, alphaTest: 0.5, emissive: 0x200402 }),
    scar: mat({ color: 0x6a5a58, rim: 1 }),
  };
}

// ---------------------------------------------------------------- geometry helpers
function segZ(r0, r1, len, sides = 6) { const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1); g.translate(0, len / 2, 0); g.rotateX(Math.PI / 2); return flat(g); }
function cone(r, len, sides = 4) { return segZ(r, 0.0001, len, sides); }
function bone(len, r0, r1, s) { const g = new THREE.CylinderGeometry(r1, r0, len, 5, 1); g.translate(0, len / 2, 0); g.rotateZ(-s * Math.PI / 2); return flat(g); }

export const STAGES = {
  hatchling: { scale: 0.17, head: 1.65, horn: 0.22, wing: 0.55, spikes: 0.35, glow: 0.25, eyes: 1.35 },
  juvenile: { scale: 0.48, head: 1.35, horn: 0.5, wing: 0.82, spikes: 0.6, glow: 0.45, eyes: 1.15 },
  young: { scale: 1.25, head: 1.15, horn: 0.78, wing: 1.0, spikes: 0.8, glow: 0.6, eyes: 1.0 },
  adult: { scale: 3.6, head: 1.0, horn: 1.0, wing: 1.15, spikes: 1.0, glow: 0.8, eyes: 1.0 },
  ancient: { scale: 9.5, head: 1.0, horn: 1.1, wing: 1.28, spikes: 1.2, glow: 1.15, eyes: 1.0, broken: true, scars: true, tatter: true },
};
const NN = 6, NT = 10;

export function buildDragon(stageName = 'adult', o = {}) {
  const st = { ...STAGES[stageName], ...o };
  const M = dragonMaterials({ tatter: st.tatter, skeleton: st.skeleton });
  M.scale.uniforms.uEmissive.value.setRGB(1, 0.2, 0.05).multiplyScalar(st.skeleton ? 0 : 0.22 * st.glow);
  const root = new THREE.Group();
  const body = group(root, [0, 0.52, 0]);
  const d = { root, body, M, st, neck: [], tail: [], legs: {}, wings: {}, stage: stageName };
  const sk = !!st.skeleton;
  // torso: chest, belly, hips (+ ribs for the skeleton)
  const torso = [[0.3, 0.25, 0.24, 0.38], [-0.06, 0.245, 0.22, 0.38], [-0.4, 0.2, 0.15, 0.32]];
  for (const [z, r0, r1, len] of torso) { const g = segZ(r0 * (sk ? 0.35 : 1), r1 * (sk ? 0.35 : 1), len, 8); g.scale(1, sk ? 1 : 0.92, 1); mesh(g, M.scale, body, [0, 0, z - len / 2]); }
  if (!sk) mesh(segZ(0.2, 0.17, 0.72, 6), M.belly, body, [0, -0.07, -0.35], [0, 0, 0], [0.9, 0.75, 1]);
  else for (let k = 0; k < 7; k++) for (const s of [-1, 1]) { const rib = new THREE.TorusGeometry(0.2, 0.012, 3, 8, Math.PI * 0.9); mesh(flat(rib), M.scale, body, [0, -0.02, 0.32 - k * 0.1], [0, s * Math.PI / 2, -Math.PI * 0.45]); }
  // dorsal spikes along the back
  for (let k = 0; k < 6; k++) mesh(cone(0.03 * st.spikes + 0.01, 0.09 * st.spikes + 0.02), M.horn, body, [0, sk ? 0.06 : 0.215, 0.32 - k * 0.14], [-1.9, 0, 0]);
  // neck chain
  let parent = group(body, [0, 0.1, 0.46]); parent.rotation.x = -0.5; d.neckBase = parent;
  for (let i = 0; i < NN; i++) {
    const f = i / NN, r = lerp(0.16, 0.09, f), len = 0.13;
    const g = group(parent, i === 0 ? [0, 0, 0] : [0, 0, len]);
    mesh(segZ(r * (sk ? 0.4 : 1), (r - 0.008) * (sk ? 0.4 : 1), len + 0.01, 6), M.scale, g, [0, 0, 0], [0, 0, 0], [1, 0.9, 1]);
    mesh(cone(0.02 * st.spikes + 0.006, 0.06 * st.spikes + 0.01), M.horn, g, [0, r * 0.85, len * 0.5], [-1.95, 0, 0]);
    d.neck.push(g); parent = g;
  }
  // head
  const head = group(parent, [0, 0, 0.13]); d.head = head;
  const hs = group(head); hs.scale.setScalar(st.head); d.headScale = hs;
  const ring = (z, w, hh, yo) => ({ y: z, pts: [[0, hh + yo], [w * 0.75, hh * 0.7 + yo], [w, yo], [w * 0.8, -hh * 0.6 + yo], [0, -hh * 0.75 + yo], [-w * 0.8, -hh * 0.6 + yo], [-w, yo], [-w * 0.75, hh * 0.7 + yo]] });
  const skull = loft([ring(-0.05, 0.1, 0.085, 0.02), ring(0.06, 0.105, 0.08, 0.03), ring(0.16, 0.08, 0.062, 0.005), ring(0.27, 0.058, 0.046, -0.015), ring(0.35, 0.034, 0.03, -0.03), ring(0.39, 0.012, 0.014, -0.035)]);
  skull.rotateX(Math.PI / 2); skull.scale(1, -1, 1); orientOut(skull);
  mesh(skull, M.scale, hs);
  const jaw = group(hs, [0, -0.04, 0.0]); d.jaw = jaw;
  mesh(segZ(0.075, 0.018, 0.36, 5), M.belly, jaw, [0, -0.02, 0.0], [0, 0, 0], [1.0, 0.45, 1]);
  mesh(box(0.08, 0.006, 0.26), M.maw, jaw, [0, 0.005, 0.12]); d.maw = M.maw;
  for (let k = 0; k < 5; k++) for (const s of [-1, 1]) {
    mesh(cone(0.005, 0.02, 3), M.claw, jaw, [s * (0.05 - k * 0.007), 0.0, 0.08 + k * 0.055], [-Math.PI / 2, 0, 0]);
    mesh(cone(0.005, 0.022, 3), M.claw, hs, [s * (0.055 - k * 0.007), -0.045, 0.08 + k * 0.055], [Math.PI / 2, 0, 0]);
  }
  // eyes (glowing amber) under heavy brow ridges
  d.eyes = [];
  for (const s of [-1, 1]) {
    const e = mesh(flat(new THREE.OctahedronGeometry(0.022 * st.eyes, 0)), sk ? M.socket : M.eye, hs, [s * 0.08, 0.04, 0.15], [0, s * 0.35, s * 0.15], [0.7, 0.55, 1.4]); d.eyes.push(e);
    mesh(box(0.05, 0.018, 0.1), M.scale, hs, [s * 0.075, 0.068, 0.15], [0.15, s * 0.3, s * 0.35]);
  }
  // nasal horn and cheek spikes (three per side)
  mesh(cone(0.018, 0.07), M.horn, hs, [0, 0.03, 0.31], [-1.1, 0, 0]);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) mesh(cone(0.014 - k * 0.003, 0.08 - k * 0.015), M.horn, hs, [s * (0.095 - k * 0.012), -0.03 + k * 0.02, 0.02 - k * 0.045], [Math.PI * 0.95, s * (0.7 + k * 0.15), 0]);
  // the lyre horn crown: two great horns sweep back, then curve UP at the tips
  d.horns = [];
  for (const s of [-1, 1]) {
    const hb = group(hs, [s * 0.06, 0.07, -0.03], [-3.08, s * 0.45, 0]); hb.scale.setScalar(st.horn);
    mesh(segZ(0.034, 0.025, 0.17), M.horn, hb);
    const h2 = group(hb, [0, 0, 0.17], [0.22, -s * 0.15, 0]); mesh(segZ(0.025, 0.016, 0.15), M.horn, h2);
    const h3 = group(h2, [0, 0, 0.15], [0.85, 0, 0]); mesh(segZ(0.016, 0.001, 0.14), M.horn, h3);
    if (st.broken && s < 0) h3.visible = false;   // the LEFT horn's tip is broken off (ancient and the bones alike)
    d.horns.push({ hb, h2, h3 });
    mesh(cone(0.012, 0.06), M.horn, hs, [s * 0.04, 0.085, -0.05], [-2.4, s * 0.15, 0]); // small crown spurs
  }
  if (st.scars) { for (let k = 0; k < 3; k++) mesh(box(0.008, 0.006, 0.12), M.scar, hs, [-0.05 - k * 0.018, 0.076 + k * 0.004, 0.13], [0.2, -0.5, 0.0]); }
  // tail chain ending in a spade blade
  parent = group(body, [0, 0.02, -0.53]); parent.rotation.y = Math.PI; d.tailBase = parent;
  for (let i = 0; i < NT; i++) {
    const f = i / NT, r = lerp(0.12, 0.025, f), len = 0.17;
    const g = group(parent, i === 0 ? [0, 0, 0] : [0, 0, len]);
    mesh(segZ(r * (sk ? 0.4 : 1), (r * 0.9) * (sk ? 0.4 : 1), len + 0.01, 6), M.scale, g, [0, 0, 0], [0, 0, 0], [1, 0.85, 1]);
    if (i % 2 === 0) mesh(cone(0.018 * st.spikes + 0.005, 0.05 * st.spikes + 0.01), M.horn, g, [0, r * 0.8, len * 0.5], [-1.9, 0, 0]);
    d.tail.push(g); parent = g;
  }
  const tip = group(parent, [0, 0, 0.17]);
  mesh(taper(0.16, 0.012, 0.0, 0.012, 0.22), M.horn, tip, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) mesh(cone(0.012, 0.09), M.horn, tip, [s * 0.06, 0, 0.04], [0, s * 0.9 + Math.PI, 0]);
  // legs
  for (const [name, x, z] of [['FL', 0.2, 0.3], ['FR', -0.2, 0.3], ['HL', 0.19, -0.36], ['HR', -0.19, -0.36]]) {
    const hip = group(body, [x, -0.06, z]); const front = name[0] === 'F';
    mesh(taper(0.12 * (sk ? 0.35 : 1), 0.13 * (sk ? 0.35 : 1), 0.16 * (sk ? 0.35 : 1), 0.17 * (sk ? 0.35 : 1), 0.26, { anchor: 'top' }), M.scale, hip);
    const knee = group(hip, [0, -0.26, 0]); mesh(taper(0.075 * (sk ? 0.45 : 1), 0.085 * (sk ? 0.45 : 1), 0.1 * (sk ? 0.45 : 1), 0.11 * (sk ? 0.45 : 1), 0.24, { anchor: 'top' }), M.scale, knee);
    const foot = group(knee, [0, -0.24, 0]); mesh(box(0.08, 0.035, 0.12), M.scale, foot, [0, -0.015, 0.04]);
    for (let c = -1; c <= 1; c++) mesh(cone(0.01, 0.06, 3), M.claw, foot, [c * 0.028, -0.025, 0.1], [0.35, 0, 0]);
    d.legs[name] = { hip, knee, foot, front };
  }
  // wings: humerus, forearm, three long fingers and a thumb claw; membranes rebuilt each frame
  for (const [name, s] of [['L', 1], ['R', -1]]) {
    const W = st.wing;
    const sh = group(body, [s * 0.17, 0.18, 0.27]);
    mesh(bone(0.42 * W, 0.06, 0.04, s), M.scale, sh);
    const el = group(sh, [s * 0.42 * W, 0, 0]); mesh(bone(0.52 * W, 0.03, 0.02, s), M.scale, el);
    const wr = group(el, [s * 0.52 * W, 0, 0]);
    const fingers = [];
    for (const [len, ang] of [[0.95, -0.12], [0.8, 0.45], [0.66, 1.0]]) { const fg = group(wr); fg.userData.ang = ang; mesh(bone(len * W, 0.016, 0.004, s), M.scale, fg); const tipP = group(fg, [s * len * W, 0, 0]); fingers.push({ fg, tipP, ang }); }
    mesh(cone(0.012, 0.06, 3), M.claw, wr, [0, 0.01, 0.02], [0, 0, 0]);
    const memG = new THREE.BufferGeometry(); memG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(10 * 9), 3));
    const uvs = new Float32Array(10 * 6); memG.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const mem = mesh(memG, M.membrane, body); mem.frustumCulled = false;
    const hipAnchor = group(body, [s * 0.14, 0.12, -0.32]);
    d.wings[name] = { sh, el, wr, fingers, mem, hipAnchor, s };
  }
  root.scale.setScalar(st.scale);
  posePart(d, {});
  return d;
}

// ---------------------------------------------------------------- posing
// p: { neckPitch, neckYaw, headPitch, headYaw, jaw, tailYaw, tailPitch, tailWave, t, wingUp, wingSweep, wingFold, wingSpread, legs:{FL:[hip,knee],...}, bodyPitch, bodyRoll, bodyY }
export function posePart(d, p) {
  const t = p.t ?? 0;
  d.body.rotation.set(p.bodyPitch ?? 0, p.bodyYaw ?? 0, p.bodyRoll ?? 0);
  if (p.bodyY !== undefined) d.body.position.y = p.bodyY;
  d.neckBase.rotation.set(-0.5 - (p.neckBase ?? 0), 0, 0);
  d.neck.forEach((g, i) => { g.rotation.set(-(p.neckPitch ?? 0.15) / NN, (p.neckYaw ?? 0) / NN + Math.sin(t * 1.3 + i * 0.5) * (p.neckWave ?? 0.01), 0); });
  d.head.rotation.set(0.45 + (p.headPitch ?? 0), p.headYaw ?? 0, p.headRoll ?? 0);
  d.jaw.rotation.x = p.jaw ?? 0.05;
  d.tailBase.rotation.set(-(p.tailBase ?? 0.15), Math.PI, 0);
  d.tail.forEach((g, i) => { g.rotation.set(-(p.tailPitch ?? 0.05) / NT, (p.tailYaw ?? 0) / NT + Math.sin(t * (p.tailRate ?? 1.6) - i * 0.55) * (p.tailWave ?? 0.06), 0); });
  for (const [k, L] of Object.entries(d.legs)) { const lp = (p.legs && p.legs[k]) || (L.front ? [0.1, -0.25] : [-0.2, 0.35]); L.hip.rotation.set(lp[0], 0, 0); L.knee.rotation.set(lp[1], 0, 0); L.foot.rotation.set(-(lp[0] + lp[1]), 0, 0); }
  const up = p.wingUp ?? 0.25, sweep = p.wingSweep ?? 0.1, fold = p.wingFold ?? 0, spread = p.wingSpread ?? 1;
  for (const W of Object.values(d.wings)) {
    const s = W.s; const flap = (p.flap ?? 0);
    W.sh.rotation.set(0, s * (sweep + fold * 0.9), s * (up + flap));
    W.el.rotation.set(0, -s * fold * 2.3, s * (flap * 0.35 - fold * 0.15));
    W.wr.rotation.set(0, s * fold * 2.5, s * flap * 0.25);
    W.fingers.forEach(F => { F.fg.rotation.set(0, s * F.ang * spread * (1 - fold * 0.75), 0); });
  }
  updateMembranes(d);
}
export function updateMembranes(d) {
  d.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(d.body.matrixWorld).invert();
  const L = (o, off) => (off ? o.localToWorld(off.clone()) : o.getWorldPosition(v3())).applyMatrix4(inv);
  for (const W of Object.values(d.wings)) {
    const S = L(W.sh), E = L(W.el), Wr = L(W.wr), F = W.fingers.map(f => L(f.tipP)), H = L(W.hipAnchor);
    const mid = (a, b, k = 0.22) => a.clone().lerp(b, 0.5).lerp(Wr, k);
    const M12 = mid(F[0], F[1]), M23 = mid(F[1], F[2]), M3H = mid(F[2], H, 0.15);
    const tris = [[Wr, F[0], M12], [Wr, M12, F[1]], [Wr, F[1], M23], [Wr, M23, F[2]], [Wr, F[2], M3H], [Wr, M3H, H], [Wr, H, E], [E, H, S], [S, H, S.clone().lerp(H, 0.5).add(v3(0, -0.02, 0))], [Wr, E, E]];
    const uvP = new Map([[Wr, [0.05, 0.5]], [F[0], [1, 0.95]], [M12, [0.78, 0.78]], [F[1], [1, 0.6]], [M23, [0.72, 0.42]], [F[2], [0.95, 0.22]], [M3H, [0.6, 0.1]], [H, [0.15, 0.0]], [E, [0.2, 0.8]], [S, [0.0, 0.3]]]);
    const pos = W.mem.geometry.attributes.position, uv = W.mem.geometry.attributes.uv;
    tris.forEach((tr, ti) => tr.forEach((pt, k) => { pos.setXYZ(ti * 3 + k, pt.x, pt.y, pt.z); const u = uvP.get(pt) || [0.3, 0.2]; uv.setXY(ti * 3 + k, u[0], u[1]); }));
    pos.needsUpdate = true; uv.needsUpdate = true; W.mem.geometry.computeVertexNormals(); W.mem.geometry.computeBoundingSphere();
  }
}
export function mouthWorld(d) { d.root.updateMatrixWorld(true); return { p: d.headScale.localToWorld(v3(0, -0.02, 0.4)), f: v3(0, 0, 1).applyQuaternion(d.headScale.getWorldQuaternion(new THREE.Quaternion())).normalize() }; }
export function eyeWorld(d) { d.root.updateMatrixWorld(true); return d.headScale.localToWorld(v3(0.06, 0.04, 0.16)); }

// fire breath: a GPU particle stream re-aimed every frame
export function fireBreath(o = {}) {
  const p = particles({ mode: 'emit', count: o.count ?? 420, origin: v3(), spread: v3(0.2, 0.2, 0.2), vel: v3(0, 0, 1), life: o.life ?? 0.7, size: o.size ?? 0.5, c0: 0xfff2c0, c1: 0xff7a18, c2: 0x5a0e04, soft: true, seed: o.seed ?? 3, swirl: 2.0, opacity: 0, fogMix: 0.2 });
  p.userData.aim = (d, strength, speed, spread) => { const m = mouthWorld(d); const u = p.material.uniforms; u.uOrigin.value.copy(m.p); u.uVel.value.copy(m.f).multiplyScalar(speed); u.uSpread.value.setScalar(spread); u.uOpacity.value = strength; return m; };
  return p;
}

// ---------------------------------------------------------------- the egg
export function buildEgg() {
  const g = new THREE.Group();
  const m = mat({ map: TD('shell'), emap: TD('shellE'), emissive: 0xffffff, rim: 1, wrap: 0.5, pierce: 1.5 });
  const top = group(g), bottom = group(g);
  const eg = (th0, th1) => { const s = new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, th0, th1); s.scale(1, 1.35, 1); return flat(s); };
  mesh(eg(0, Math.PI * 0.42), m, top); mesh(eg(Math.PI * 0.42, Math.PI * 0.58), m, bottom);
  g.userData = { m, top, bottom };
  return g;
}
