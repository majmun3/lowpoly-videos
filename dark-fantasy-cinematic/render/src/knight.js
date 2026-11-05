// DARK FANTASY CINEMATIC — armoured knights (three kits on one rig), weapons and props.
//  'smith'    : the Violet Smith — mottled purple-blue plate, great rounded pauldrons, a pointed hood-helm with a dark face
//               and two faint violet eyes, a purple tabard skirt. Works the anvil.
//  'crusader' : silver plate, flat-topped great helm with an eye slit and breaths, white surcoat with a red cross.
//  'dark'     : blackened steel, rounded armet with a pointed visor and crest, a long dark wool cape. The wanderer.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose } from '/the-last-ember/render/src/characters.js';
import { buildHand, setGrip, buildHammer, smithMaterials } from '/born-a-blacksmith/render/src/smith.js';
export { setGrip };

const cache = {};
export function TK(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const plateTex = (seed, c0, c1, c2, o = {}) => mk(64, 64, (x, w, h) => {
  const n = fbm(w, h, seed, [16, 8, 4]), m = fbm(w, h, seed + 7, [32, 16, 8]);
  pixels(x, w, h, (i, j) => {
    const a = n(i, j), b = m(i, j); const t = clamp((a - 0.3) / 0.5); let col = t < 0.5 ? lerp3(c0, c1, t * 2) : lerp3(c1, c2, (t - 0.5) * 2);
    let v = 1 + (b - 0.5) * (o.mottle ?? 0.25); if (i % 32 < 1 || j % 32 < 1) v *= 0.7; if ((i % 32 === 3 || i % 32 === 28) && (j % 32 === 4 || j % 32 === 27)) v *= 1.35;   // plate seams and rivets
    if (o.scratch && ((i * 7 + j * 3) % 41 === 0)) v *= 1.25;
    return [C(col[0] * v), C(col[1] * v), C(col[2] * v)];
  });
}, { mip: true });
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const MK = {
  violet: () => plateTex(3001, [40, 22, 90], [96, 60, 200], [170, 140, 255], { mottle: 0.4 }),
  silver: () => plateTex(3003, [118, 122, 132], [170, 176, 186], [222, 226, 232], { mottle: 0.18, scratch: true }),
  black: () => plateTex(3005, [26, 26, 32], [52, 54, 64], [96, 98, 112], { mottle: 0.22, scratch: true }),
  mail: () => mk(32, 32, (x, w, h) => { pixels(x, w, h, (i, j) => { const ring = ((i + (j % 4 < 2 ? 0 : 2)) % 4 < 2) ? 1 : 0.55; const v = 0.5 * ring + 0.1; return [C(v * 200), C(v * 202), C(v * 212)]; }); }, { mip: true }),
  surcoat: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 3007, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.82 + (n(i, j) - 0.5) * 0.12; const cx = Math.abs(i - 31.5), cy = Math.abs(j - 26); const cross = (cx < 4 && j > 8 && j < 50) || (cy < 4 && cx < 16) || (cx < 7 && (j < 13 || j > 45) && j > 6 && j < 52) || (cy < 7 && cx > 12 && cx < 17); if (cross) return [C(v * 210), C(v * 30), C(v * 36)]; return [C(v * 236), C(v * 232), C(v * 222)]; }); }),
  vtabard: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 3009, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.25 + (i % 4 === 0 ? -0.06 : 0); return [C(v * 110), C(v * 60), C(v * 190)]; }); }),
  wool: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 3011, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.24 + (n(i, j) - 0.5) * 0.1 + ((i * 3 + j) % 6 === 0 ? -0.03 : 0); return [C(v * 200), C(v * 190), C(v * 215)]; }); }),
  leather: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 3013, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.34 + (n(i, j) - 0.5) * 0.15; return [C(v * 180), C(v * 120), C(v * 84)]; }); }),
  steel: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 3015, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.72 + (n(i, j) - 0.5) * 0.12 + Math.sin(j * 0.9) * 0.03; return [C(v * 220), C(v * 226), C(v * 236)]; }); }),
  kite: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 3017, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.2; if (i < 2 || i > w - 3 || j < 2) return [C(v * 200), C(v * 200), C(v * 210)]; const cx = Math.abs(i - 15.5); if (cx < 2.5 || Math.abs(j - 22) < 2.5) return [C(v * 230), C(v * 225), C(v * 210)]; return [C(v * (j % 2 ? 60 : 70)), C(v * 50), C(v * 150)]; }); }),
};
export function knightMaterials(kit) {
  const plateName = { smith: 'violet', crusader: 'silver', dark: 'black' }[kit];
  const plate = mat({ map: TK(plateName), rim: 1, wrap: 0.4 }); const plateD = mat({ map: TK(plateName), rim: 1, wrap: 0.4, side: THREE.DoubleSide });
  if (kit === 'smith') { plate.uniforms.uEmissive.value.setRGB(0.06, 0.02, 0.14); plateD.uniforms.uEmissive.value.setRGB(0.06, 0.02, 0.14); }
  return {
    plate, plateD, mail: mat({ map: TK('mail'), color: kit === 'dark' ? 0x7a7a88 : 0xc0c0cc, rim: 0.8 }), leather: mat({ map: TK('leather'), rim: 0.6 }),
    surcoat: mat({ map: TK('surcoat'), rim: 0.5, side: THREE.DoubleSide, wrap: 0.6 }), tabard: mat({ map: TK('vtabard'), rim: 0.8, side: THREE.DoubleSide, wrap: 0.6 }),
    wool: mat({ map: TK('wool'), rim: 0.8, side: THREE.DoubleSide, wrap: 0.7 }), void: mat({ color: 0x06040a, unlit: true }), slit: mat({ color: 0x050508, unlit: true }),
    eyes: mat({ color: 0xc080ff, emissive: 0x8040ff, unlit: true }), brass: mat({ map: TK('silver'), color: 0xe0c080, rim: 1 }),
  };
}

// ---------------------------------------------------------------- the cape (a cloth grid hung from the shoulders)
function buildCape(j, M, len = 1.2) {
  const COLS = 9, ROWS = 10, geo = new THREE.BufferGeometry(); const pos = new Float32Array(COLS * ROWS * 3), uv = new Float32Array(COLS * ROWS * 2), idx = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { uv.set([c / (COLS - 1) * 2, 1 - r / (ROWS - 1) * 3], (r * COLS + c) * 2); if (r < ROWS - 1 && c < COLS - 1) { const a = r * COLS + c; idx.push(a, a + COLS, a + 1, a + 1, a + COLS, a + COLS + 1); } }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const m = mesh(geo, M.wool, j.chest); m.frustumCulled = false; j.cape = { geo, COLS, ROWS, len };
}
export function updateCape(j, t, o = {}) {
  const c = j.cape; if (!c) return; const { geo, COLS, ROWS, len } = c; const p = geo.attributes.position; const wind = o.wind ?? 0.3, walk = o.walk ?? 0;
  const pitch = j.spine.rotation.x + j.chest.rotation.x;   // keep the hem hanging toward the ground while the torso leans
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
    const f = r / (ROWS - 1), u = cc / (COLS - 1) * 2 - 1, a = u * 1.3;
    const fl = Math.sin(t * 2.1 + u * 2.2 - f * 3.0) * wind * f * 0.1 + Math.sin(t * 4.3 + u * 5 + f * 4) * wind * f * 0.03 + Math.sin(t * 6.28 * (o.stepRate ?? 0.7) * 2 + u) * walk * f * 0.04;
    const rad = 0.19 + f * 0.14 + Math.max(0, -Math.cos(a)) * 0;
    const y = 0.27 - f * len; let z = -Math.cos(a) * rad * 0.75 - 0.05 - f * f * (0.1 + wind * 0.25 + walk * 0.15) + fl; const x = Math.sin(a) * rad * (1 + f * 0.25) + fl * 0.3;
    const yy = y * Math.cos(pitch) - (z) * Math.sin(pitch) * 0; const zz = z - Math.sin(pitch) * (-y) * 1.0;
    p.setXYZ(r * COLS + cc, x, yy, zz);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}

// ---------------------------------------------------------------- the knight
export function buildKnight(kit = 'crusader', o = {}) {
  const M = knightMaterials(kit); const big = kit === 'smith' ? 1.25 : 1;
  const d = { hip: 0.98, spineOff: 0.07, abd: 0.18, chestH: 0.3, neckH: 0.07, shW: 0.23 * (kit === 'smith' ? 1.06 : 1), upper: 0.3, fore: 0.28, thigh: 0.47, shin: 0.46, hipW: 0.1 };
  const j = rig(d); j.M = M; j.k = 1; j.kit = kit; j.hipH = d.hip;
  // pelvis: mail, faulds, tassets (or the smith's tabard skirt / the crusader's surcoat skirt)
  mesh(taper(0.34, 0.24, 0.33, 0.23, 0.18, { anchor: 'center' }), M.mail, j.pelvis);
  mesh(taper(0.4, 0.29, 0.38, 0.27, 0.16, { anchor: 'top' }), M.plate, j.pelvis, [0, 0.08, 0]);
  if (kit === 'smith') { for (const s of [-1, 1]) { const f = group(j.pelvis, [0, 0.0, s * 0.13]); mesh(taper(0.36, 0.015, 0.4, 0.015, 0.55, { anchor: 'top' }), M.tabard, f, [0, 0, 0], [s * -0.08, 0, 0]); } }
  else if (kit === 'crusader') { for (const s of [-1, 1]) { const f = group(j.pelvis, [0, 0.02, s * 0.14]); mesh(taper(0.33, 0.015, 0.36, 0.015, 0.5, { anchor: 'top' }), M.surcoat, f, [0, 0, 0], [s * -0.06, 0, 0]); } }
  else for (const s of [-1, 1]) mesh(box(0.16, 0.2, 0.025, 'top'), M.plate, j.pelvis, [s * 0.09, -0.04, 0.15], [-0.1, 0, s * 0.08]);   // tassets
  mesh(box(0.39, 0.05, 0.28), M.leather, j.pelvis, [0, 0.085, 0]);
  // torso: plackart + breastplate with a centre ridge, backplate, gorget
  mesh(taper(0.33, 0.23, 0.37, 0.25, 0.19), M.plate, j.spine);
  mesh(taper(0.39 * big, 0.26, 0.47 * big, 0.29, 0.31), M.plate, j.chest);
  mesh(taper(0.03, 0.03, 0.02, 0.02, 0.3), M.plate, j.chest, [0, 0, 0.14], [-0.08, 0, 0]);
  if (kit === 'crusader') mesh(box(0.34, 0.42, 0.02), M.surcoat, j.chest, [0, 0.12, 0.148], [-0.05, 0, 0]);
  mesh(prism(8, 0.1, 0.085, 0.09), M.plate, j.neck, [0, -0.02, 0]);
  // head
  const H = group(j.head); j.helm = H;
  if (kit === 'crusader') {
    mesh(prism(8, 0.13, 0.13, 0.3), M.plate, H, [0, -0.04, 0], [0, Math.PI / 8, 0]); mesh(prism(8, 0.135, 0.12, 0.03), M.plate, H, [0, 0.26, 0], [0, Math.PI / 8, 0]);
    for (const s of [-1, 1]) mesh(box(0.08, 0.016, 0.02), M.slit, H, [s * 0.05, 0.14, 0.125]);
    mesh(box(0.025, 0.24, 0.02), M.brass, H, [0, 0.1, 0.128]); for (let i = 0; i < 6; i++) mesh(box(0.008, 0.008, 0.02), M.slit, H, [0.04 + (i % 3) * 0.022, 0.04 + Math.floor(i / 3) * 0.025, 0.124]);
  } else if (kit === 'smith') {
    mesh(flat(new THREE.SphereGeometry(0.135, 8, 6)), M.plate, H, [0, 0.1, 0], [0, 0, 0], [1, 1.12, 1.05]);
    const hood = taper(0.32, 0.34, 0.02, 0.02, 0.36, { oz: -0.09 }); mesh(hood, M.plateD, H, [0, 0.07, -0.025]);                        // the pointed hood-helm
    mesh(taper(0.15, 0.04, 0.12, 0.04, 0.17), M.void, H, [0, 0.02, 0.135]);                                                              // dark face
    for (const s of [-1, 1]) mesh(box(0.028, 0.01, 0.01), M.eyes, H, [s * 0.032, 0.12, 0.162]);
    mesh(taper(0.34, 0.33, 0.3, 0.3, 0.05, {}), M.plateD, H, [0, 0.02, -0.02]);                                                          // hood rim
  } else {
    mesh(flat(new THREE.SphereGeometry(0.13, 8, 6)), M.plate, H, [0, 0.12, -0.005], [0, 0, 0], [1, 1.1, 1.12]);
    mesh(taper(0.22, 0.2, 0.04, 0.05, 0.12, { anchor: 'center', oz: 0.11 }), M.plate, H, [0, 0.07, 0.07], [Math.PI / 2, 0, 0]);         // pointed visor
    for (const s of [-1, 1]) mesh(box(0.07, 0.012, 0.03), M.slit, H, [s * 0.045, 0.13, 0.13], [0, s * 0.35, 0]);
    mesh(box(0.02, 0.06, 0.24), M.plate, H, [0, 0.26, -0.02]);                                                                          // crest
    mesh(taper(0.24, 0.22, 0.2, 0.18, 0.08, { anchor: 'top' }), M.plate, H, [0, 0.06, -0.03]);
  }
  // arms
  for (const sd of ['L', 'R']) {
    const sx = sd === 'L' ? -1 : 1;
    const pa = group(j['arm' + sd], [sx * 0.02, 0.05, 0]); const ps = big * (kit === 'smith' ? 1.25 : 1);
    mesh(flat(new THREE.SphereGeometry(0.13 * ps, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55)), M.plate, pa, [0, 0, 0], [0, 0, sx * 0.25], [1.05, 0.9, 1.1]);
    for (let k = 0; k < 2; k++) mesh(prism(8, 0.135 * ps - k * 0.012, 0.125 * ps - k * 0.012, 0.05, 'top', true), M.plateD, pa, [sx * 0.01, -0.03 - k * 0.045, 0]);
    mesh(taper(0.1, 0.1, 0.105, 0.105, d.upper, { anchor: 'top' }), M.mail, j['arm' + sd]); mesh(taper(0.11, 0.11, 0.1, 0.1, d.upper * 0.7, { anchor: 'top' }), M.plate, j['arm' + sd], [0, -0.08, 0]);
    mesh(flat(new THREE.IcosahedronGeometry(0.06, 0)), M.plate, j['fore' + sd], [0, 0.0, -0.01]);                                       // couter
    mesh(taper(0.1, 0.1, 0.085, 0.085, d.fore, { anchor: 'top' }), M.plate, j['fore' + sd]);
    mesh(taper(0.1, 0.12, 0.085, 0.1, 0.07, { anchor: 'top' }), M.plate, j['fore' + sd], [0, -d.fore + 0.06, 0]);                       // gauntlet cuff
    j['grip' + sd] = buildHand(j['hand' + sd], { hands: M.plate, glove: M.plate }, sd, 1.08, false);
    mesh(taper(0.13, 0.15, 0.15, 0.17, d.thigh, { anchor: 'top' }), M.plate, j['thigh' + sd]);
    mesh(flat(new THREE.IcosahedronGeometry(0.075, 0)), M.plate, j['shin' + sd], [0, 0.0, 0.03]); mesh(box(0.06, 0.08, 0.02), M.plate, j['shin' + sd], [sx * 0.06, -0.01, 0.02]);  // poleyn + wing
    mesh(taper(0.12, 0.13, 0.1, 0.11, d.shin, { anchor: 'top' }), M.plate, j['shin' + sd]);
    mesh(taper(0.11, 0.24, 0.1, 0.2, 0.08, { anchor: 'top', oz: 0.04 }), M.plate, j['foot' + sd], [0, 0.01, 0.045]);
  }
  if (kit === 'dark' || o.cape) buildCape(j, M, o.capeLen ?? 1.25);
  if (o.hammer) { j.hammer = buildHammer(smithMaterials(), { len: 0.46, head: 1.2 }); j.handR.add(j.hammer); j.hammer.position.set(-0.03 * 1.08, -0.125 * 1.08, 0); }
  setGrip(j, 'L', 0.35); setGrip(j, 'R', 0.35);
  applyPose(j, { hipY: d.hip });
  return j;
}
export function kStand(o = {}) { return { hipY: 0.98, armL: [0.04, 0, -0.14], armR: [0.04, 0, 0.14], foreL: [-0.18, 0, 0], foreR: [-0.18, 0, 0], neck: [o.look ?? 0, o.turn ?? 0, 0] }; }

// ---------------------------------------------------------------- weapons and props
const steelM = () => mat({ map: TK('steel'), rim: 1 });
export function buildSword(o = {}) {
  const g = new THREE.Group(); const L = o.len ?? 0.85; const S = o.blade || steelM(); const D = mat({ map: TK('black'), rim: 1 }), Lm = mat({ map: TK('leather'), rim: 0.6 });
  const bl = taper(0.055, 0.012, 0.012, 0.006, L, {}); bl.rotateX(Math.PI / 2); bl.translate(0, 0, 0.1); mesh(flat(bl), S, g);   // blade along +Z from the guard
  mesh(prism(3, 0.006, 0.0001, 0.05, 'bottom'), S, g, [0, 0, 0.1 + L], [Math.PI / 2, 0, 0], [5, 1, 1]);
  mesh(box(0.22, 0.03, 0.035), D, g, [0, 0, 0.09]); mesh(prism(6, 0.017, 0.017, 0.17, 'center'), Lm, g, [0, 0, 0.0], [Math.PI / 2, 0, 0]);
  mesh(flat(new THREE.OctahedronGeometry(0.03, 0)), D, g, [0, 0, -0.1]);
  g.userData.len = L; return g;
}
export function buildAxe() {
  const g = new THREE.Group(); const W = mat({ map: TK('leather'), color: 0xc0a080, rim: 0.6 }), S = steelM();
  mesh(prism(6, 0.02, 0.022, 1.0, 'bottom'), W, g); const sh = new THREE.Shape(); sh.moveTo(0, 0.06); sh.quadraticCurveTo(0.14, 0.12, 0.2, 0.2); sh.quadraticCurveTo(0.26, 0, 0.2, -0.2); sh.quadraticCurveTo(0.14, -0.12, 0, -0.06); sh.closePath();
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.015, bevelEnabled: false, curveSegments: 3 }); bg.translate(0.02, 0, -0.0075); mesh(flat(bg), S, g, [0, 0.9, 0]); mesh(box(0.05, 0.12, 0.05), mat({ map: TK('black'), rim: 1 }), g, [0, 0.9, 0]);
  return g;
}
export function buildSpear() { const g = new THREE.Group(); mesh(prism(6, 0.016, 0.018, 1.9, 'bottom'), mat({ map: TK('leather'), color: 0xc0a080 }), g); mesh(prism(4, 0.035, 0, 0.24), steelM(), g, [0, 1.9, 0]); return g; }
export function buildShield(kind = 'kite', o = {}) {
  const g = new THREE.Group(); const iron = mat({ map: TK('silver'), rim: 1 });
  if (kind === 'kite') { const ks = new THREE.Shape(); ks.moveTo(-0.24, 0.36); ks.quadraticCurveTo(0, 0.42, 0.24, 0.36); ks.lineTo(0.2, -0.06); ks.quadraticCurveTo(0.12, -0.42, 0, -0.6); ks.quadraticCurveTo(-0.12, -0.42, -0.2, -0.06); ks.lineTo(-0.24, 0.36);
    const kg = new THREE.ShapeGeometry(ks, 3); const uv = kg.attributes.uv, p = kg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 0.24) / 0.48, (p.getY(i) + 0.6) / 1.02);
    mesh(kg, mat({ map: TK(o.tex ?? 'kite'), rim: 0.6 }), g, [0, 0, 0.012]); mesh(new THREE.ExtrudeGeometry(ks, { depth: 0.02, bevelEnabled: false }), iron, g, [0, 0, -0.01]); }
  else { mesh(prism(12, 0.34, 0.34, 0.03, 'center'), mat({ map: TK('leather'), color: o.color ?? 0x8a3030, rim: 0.6 }), g, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(prism(12, 0.36, 0.36, 0.02, 'center', true), iron, g, [0, 0, 0], [Math.PI / 2, 0, 0]); mesh(flat(new THREE.SphereGeometry(0.07, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)), iron, g, [0, 0, 0.02], [Math.PI / 2, 0, 0]); }
  return g;
}
export function tankard(o = {}) {
  const g = new THREE.Group(); const pew = mat({ map: TK('silver'), color: o.wood ? 0xb08860 : 0xb8bcc4, rim: 1 });
  mesh(prism(10, 0.05, 0.056, 0.15, 'bottom'), pew, g); mesh(prism(10, 0.049, 0.049, 0.012, 'bottom'), mat({ color: 0xf0e8d0, rim: 0.3 }), g, [0, 0.142, 0]);
  const hd = new THREE.TorusGeometry(0.04, 0.009, 4, 8, Math.PI); mesh(hd, pew, g, [0.055, 0.075, 0], [0, 0, -Math.PI / 2]);
  for (const y of [0.025, 0.12]) mesh(prism(10, 0.058, 0.058, 0.012, 'center', true), pew, g, [0, y, 0]);
  return g;
}

// ---------------------------------------------------------------- reach: a small numeric IK that bends shoulder + elbow so the hand lands on a world point
export function reach(j, side, target, o = {}) {
  const arm = j['arm' + side], fore = j['fore' + side], hand = j['hand' + side]; const off = o.off || v3(0, -0.09, 0.0);
  let top = j.root; while (top.parent) top = top.parent;
  const err = () => { top.updateMatrixWorld(true); return hand.localToWorld(off.clone()).distanceTo(target); };
  const P = [[arm.rotation, 'x'], [arm.rotation, 'y'], [arm.rotation, 'z'], [fore.rotation, 'x']]; let best = err();
  for (let step = 0.25; step > 0.004; step *= 0.6) for (let it = 0; it < 3; it++) for (const [r, ax] of P) for (const d of [step, -step]) { const v0 = r[ax]; r[ax] = v0 + d; if (ax === 'x' && r === fore.rotation && r[ax] > 0) r[ax] = 0; const e = err(); if (e < best) best = e; else r[ax] = v0; }
  return best;
}
