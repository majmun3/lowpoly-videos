// BEING BORN AS A BLACKSMITH IN MEDIEVAL TIMES WAS HORRIFYING — characters, tools and the hammer-strike system.
// The blacksmith (one design from newborn to old age): strong and broad, thick bare forearms, short messy brown hair,
// a thick beard, a soot-smudged face, an off-white linen shirt with rolled sleeves, a scorched leather apron (front only),
// brown wool trousers, heavy boots — and, as a permanent part of his silhouette, a strongly exaggerated backside that
// reacts to every hammer blow with delayed, damped secondary motion.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, smooth, ease, easeIn, easeOut, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { setJiggle, jigKick, jigWalk } from '/born-as-a-dwarf/render/src/dwarf.js';
export { setJiggle, jigKick, jigWalk };

const cache = {};
export function TS(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  skin: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2001, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.84 + (n(i, j) - 0.5) * 0.1; return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  sooty: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2003, [8, 4, 2]), s = fbm(w, h, 2005, [16, 8]); pixels(x, w, h, (i, j) => { let v = 0.84 + (n(i, j) - 0.5) * 0.1; const d = s(i, j); if (d > 0.6) v -= (d - 0.6) * 0.5; return [C(v * 255), C(v * 250), C(v * 246)]; }); }),
  linen: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2007, [8, 4]), s = fbm(w, h, 2009, [16, 8]); pixels(x, w, h, (i, j) => { let v = 0.76 + (n(i, j) - 0.5) * 0.08 + ((i + j) % 2 ? 0.02 : -0.02) + (j % 8 === 0 ? -0.04 : 0) - (s(i, j) > 0.66 ? 0.04 : 0); return [C(v * 236), C(v * 222), C(v * 196)]; }); }),
  apron: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2011, [16, 8, 4]), b = fbm(w, h, 2013, [32, 16]); pixels(x, w, h, (i, j) => { let v = 0.42 + (n(i, j) - 0.5) * 0.18; if (i < 3 || i > w - 4 || j > h - 4) v += 0.08; if ((i === 4 || i === w - 5) && j % 4 < 2) v -= 0.14; if (b(i, j) > 0.64) v -= (b(i, j) - 0.64) * 2.0; return [C(v * 165), C(v * 108), C(v * 66)]; }); }),
  wool: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2015, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.44 + (n(i, j) - 0.5) * 0.14 + ((i * 3 + j) % 5 === 0 ? -0.05 : 0); return [C(v * 150), C(v * 116), C(v * 84)]; }); }),
  boot: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2017, [8, 4, 2]); pixels(x, w, h, (i, j) => { let v = 0.24 + (n(i, j) - 0.5) * 0.12; if (j < 4) v += 0.06; if (j % 8 === 0) v -= 0.05; return [C(v * 175), C(v * 130), C(v * 96)]; }); }),
  hair: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2019, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.72 + (n(i, j) - 0.5) * 0.25 + (i % 3 === 0 ? -0.12 : 0) + (i % 7 === 3 ? 0.08 : 0); return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  iron: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 2021, [16, 8, 4]), d = fbm(w, h, 2023, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.36 + (n(i, j) - 0.5) * 0.14; if (d(i, j) > 0.6) v -= 0.06; if (((i * 7 + j * 13) % 29) === 0) v += 0.08; return [C(v * 200), C(v * 202), C(v * 210)]; }); }, { mip: true }),
  steel: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2025, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.7 + (n(i, j) - 0.5) * 0.12 + Math.sin(i * 0.7) * 0.03; return [C(v * 222), C(v * 226), C(v * 232)]; }); }),
  handle: () => mk(16, 64, (x, w, h) => { const n = fbm(w, h, 2027, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.52 + Math.sin(i * 1.6 + n(i, j) * 6) * 0.07 + (n(i, j) - 0.5) * 0.14; return [C(v * 205), C(v * 150), C(v * 100)]; }); }),
  glove: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2029, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.5 + (n(i, j) - 0.5) * 0.16; if (j % 10 === 0) v -= 0.1; return [C(v * 175), C(v * 135), C(v * 92)]; }); }),
  bandage: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 2031, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.84 + (n(i, j) - 0.5) * 0.08 + (j % 4 === 0 ? -0.08 : 0); return [C(v * 240), C(v * 232), C(v * 214)]; }); }),
  swaddle: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 2033, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.8 + (n(i, j) - 0.5) * 0.1 + ((i + j) % 6 < 1 ? -0.06 : 0); return [C(v * 236), C(v * 226), C(v * 206)]; }); }),
};
const tinted = (name, color, o = {}) => mat({ map: TS(name), color, rim: o.rim ?? 0.6, wrap: o.wrap ?? 0.55, side: o.side });
export function smithMaterials(o = {}) {
  const skinCol = o.skin ?? 0xe0a888;
  return {
    skin: tinted(o.sooty === false ? 'skin' : 'sooty', skinCol), hands: tinted('sooty', new THREE.Color(skinCol).multiplyScalar(0.86).getHex()),
    hair: tinted('hair', o.hair ?? 0x6a4428, { rim: 1 }), beard: tinted('hair', o.beard ?? o.hair ?? 0x5a3a22, { rim: 1, side: THREE.DoubleSide }),
    shirt: tinted('linen', o.shirt ?? 0xffffff), apron: tinted('apron', 0xffffff, { rim: 0.8, side: THREE.DoubleSide }), strap: tinted('apron', 0xb08868, { rim: 0.8 }),
    wool: tinted('wool', o.wool ?? 0xffffff), boot: tinted('boot', 0xffffff, { rim: 0.8 }), glove: tinted('glove', 0xffffff, { rim: 0.6 }),
    eyeW: mat({ color: 0xe8e2d8, rim: 0.2 }), iris: mat({ color: 0x3a2a1e, unlit: true }), mouth: mat({ color: 0x3a1a14, unlit: true }), lip: tinted('skin', new THREE.Color(skinCol).multiplyScalar(0.78).getHex()),
    iron: mat({ map: TS('iron'), rim: 1 }), steel: mat({ map: TS('steel'), rim: 1 }), wood: mat({ map: TS('handle'), rim: 0.6 }), bandage: tinted('bandage', 0xffffff),
  };
}

// ---------------------------------------------------------------- hands: palm + four two-segment fingers + thumb (curl 0..1)
function buildHand(parent, M, side, k, glove) {
  const s = side === 'R' ? -1 : 1;           // curl direction (towards the body's midline)
  const m = glove ? M.glove : M.hands; const H = { fingers: [], s };
  mesh(box(0.042 * k, 0.1 * k, 0.092 * k, 'top'), m, parent, [0, 0, 0]);
  for (let f = 0; f < 4; f++) {
    const z = (-0.034 + f * 0.023) * k, len = (f === 0 || f === 3 ? 0.04 : 0.047) * k;
    const a = group(parent, [0, -0.1 * k, z]); mesh(box(0.024 * k, len, 0.02 * k, 'top'), m, a);
    const b = group(a, [0, -len, 0]); mesh(box(0.022 * k, len * 0.85, 0.019 * k, 'top'), m, b);
    H.fingers.push([a, b]);
  }
  const th = group(parent, [s * 0.012 * k, -0.035 * k, 0.05 * k], [0, 0, 0]); mesh(box(0.024 * k, 0.05 * k, 0.022 * k, 'top'), m, th);
  const th2 = group(th, [0, -0.05 * k, 0]); mesh(box(0.021 * k, 0.04 * k, 0.02 * k, 'top'), m, th2); H.thumb = [th, th2];
  if (glove) mesh(taper(0.075 * k, 0.11 * k, 0.065 * k, 0.1 * k, 0.07 * k, { anchor: 'top' }), M.glove, parent, [0, 0.07 * k, 0]);
  return H;
}
export function setGrip(j, side, c, o = {}) {
  const H = j['grip' + side]; if (!H) return; const s = H.s; const tr = o.tremble ?? 0;
  H.fingers.forEach(([a, b], i) => { const w = tr ? Math.sin((o.t ?? 0) * 31 + i * 1.7) * tr : 0; a.rotation.set(0, 0, s * (0.15 + c * 1.35 + w)); b.rotation.set(0, 0, s * (0.1 + c * 1.45 + w)); });
  H.thumb[0].rotation.set(0.3 * c, 0, s * (0.2 + c * 0.6)); H.thumb[1].rotation.set(0, 0, s * c * 0.9);
}

// ---------------------------------------------------------------- tools
export function buildHammer(M, o = {}) {
  const g = new THREE.Group(); const L = o.len ?? 0.42, hs = o.head ?? 1;
  mesh(prism(6, 0.017, 0.02, L + 0.08), M.wood, g, [0, 0, -0.06], [Math.PI / 2, 0, 0]);   // handle along +Z, grip at the origin
  const hd = group(g, [0, 0, L]); g.userData.head = hd;
  mesh(box(0.06 * hs, 0.16 * hs, 0.06 * hs), M.iron, hd);                                  // head across the handle (local Y)
  mesh(box(0.066 * hs, 0.02 * hs, 0.066 * hs), M.steel, hd, [0, -0.085 * hs, 0]);          // polished striking face (-Y)
  mesh(taper(0.06 * hs, 0.06 * hs, 0.012 * hs, 0.06 * hs, 0.05 * hs), M.iron, hd, [0, 0.08 * hs, 0]); // cross-peen (+Y)
  mesh(box(0.03, 0.02, 0.07), M.iron, hd, [0, 0, 0]);
  g.userData.face = v3(0, -0.095 * hs, L);
  return g;
}
export function hammerFace(j) { const h = j.hammer; h.parent.updateWorldMatrix(true, true); return h.localToWorld(h.userData.face.clone()); }
// tongs drawn between two world points (re-posed every frame so they stay connected to hand and work piece)
export function buildTongs() {
  const g = new THREE.Group(); const m = mat({ map: TS('iron'), color: 0x8a8a90, rim: 1 });
  g.userData.jaws = [mesh(box(0.012, 0.012, 1), m, g), mesh(box(0.012, 0.012, 1), m, g)];
  return g;
}
export function setTongs(g, a, b) {
  const d = b.clone().sub(a); const L = d.length(); g.position.copy(a); g.lookAt(b); g.userData.jaws.forEach((jw, i) => { jw.scale.set(1, 1, L); jw.position.set((i ? 1 : -1) * 0.008, 0, L / 2); jw.rotation.y = (i ? -1 : 1) * 0.012; });
}
export function hotBar(len = 0.34) { const m = mat({ color: 0xffb040, emissive: 0xff6010, unlit: true }); const b = mesh(box(0.05, 0.028, len), m); const g = glow(0xff9030, 0.5, 0.55); b.add(g); b.userData.glow = g; b.userData.m = m; return b; }
export function setHeat(bar, k) { bar.userData.m.uniforms.uColor.value.setRGB(0.25 + k * 0.75, 0.12 + k * 0.6, 0.08 + k * 0.2); bar.userData.glow.material.opacity = k * 0.6; }
export function sparks(o = {}) { return particles({ mode: 'burst', count: o.count ?? 150, origin: o.origin || v3(), spread: v3(0.06, 0.02, 0.06), vel: o.vel || v3(0, 1.8, 0), life: o.life ?? 0.6, size: o.size ?? 0.034, c0: 0xffffe0, c1: 0xffb030, c2: 0xa02000, seed: o.seed ?? 31, opacity: 1, start: -9, swirl: 0.3, fogMix: 0.05 }); }

// ---------------------------------------------------------------- the blacksmith
// o.age: 'child' (7) | 'youth' (12) | 'adult' | 'old'; o.normal: plain proportions (other characters)
export function buildSmith(o = {}) {
  const age = o.age ?? 'adult'; const k = { child: 0.66, youth: 0.82, adult: 1, old: 0.98 }[age]; const kid = age === 'child' || age === 'youth';
  const old = age === 'old'; const M = smithMaterials({ hair: old ? 0xb8b2aa : o.hair, beard: old ? 0xc8c4bc : o.beard, skin: o.skin, sooty: o.sooty, shirt: o.shirt, wool: o.wool });
  const bulk = kid ? 0.8 : (o.bulk ?? 1);
  const d = { hip: 0.95 * k, spineOff: 0.06 * k, abd: 0.18 * k, chestH: 0.3 * k, neckH: 0.07 * k, shW: (0.2 + 0.05 * bulk) * k, upper: 0.3 * k, fore: 0.27 * k, thigh: 0.46 * k, shin: 0.44 * k, hipW: 0.1 * k };
  const j = rig(d); j.M = M; j.k = k; j.age = age; j.hipH = d.hip;
  // pelvis, belt and the backside
  mesh(taper(0.36 * k, 0.24 * k, 0.37 * k, 0.25 * k, 0.2 * k, { anchor: 'center' }), M.wool, j.pelvis);
  mesh(box(0.38 * k, 0.05 * k, 0.27 * k), M.strap, j.pelvis, [0, 0.09 * k, 0]);
  if (!o.normal) { j.butt = group(j.pelvis, [0, -0.02 * k, -0.08 * k]); const cr = 0.24 * k; for (const [sx, nm] of [[-1, 'cheekL'], [1, 'cheekR']]) { const c = mesh(flat(new THREE.IcosahedronGeometry(cr, 2)), M.wool, j.butt, [sx * cr * 0.56, 0, -cr * 0.5], [0, 0, 0], [1, 0.95, 0.9]); c.userData.y = 0; c.userData.s = [1, 0.95, 0.9]; j[nm] = c; } j.jigK = cr / 0.25; }
  else for (const sx of [-1, 1]) mesh(flat(new THREE.IcosahedronGeometry(0.1 * k, 1)), M.wool, j.pelvis, [sx * 0.07 * k, -0.02 * k, -0.08 * k]);
  // torso: barrel chest and broad shoulders in a linen shirt with an open collar
  mesh(taper((0.33 + 0.04 * bulk) * k, 0.24 * k, (0.36 + 0.05 * bulk) * k, 0.25 * k, 0.18 * k), M.shirt, j.spine);
  mesh(taper((0.38 + 0.06 * bulk) * k, 0.26 * k, (0.46 + 0.1 * bulk) * k, 0.29 * k, 0.3 * k), M.shirt, j.chest);
  mesh(prism(3, 0.06 * k, 0.0, 0.1 * k, 'top'), M.skin, j.chest, [0, 0.3 * k, 0.13 * k], [0.3, 0, Math.PI]);           // open collar
  for (const sx of [-1, 1]) mesh(flat(new THREE.IcosahedronGeometry(0.085 * k * bulk, 1)), M.shirt, j.chest, [sx * (0.2 + 0.04 * bulk) * k, 0.26 * k, 0]);   // shoulders
  // leather apron: bib + skirt (front and sides only), neck strap, waist ties across the back
  if (!kid || o.apron) {
    mesh(taper(0.3 * k, 0.03, 0.34 * k, 0.03, 0.3 * k), M.apron, j.chest, [0, 0.0, 0.14 * k + 0.06 * bulk * k]);
    j.apronSkirt = group(j.pelvis, [0, 0.1 * k, 0.15 * k]); mesh(taper(0.44 * k, 0.03, 0.4 * k, 0.03, 0.62 * k, { anchor: 'top' }), M.apron, j.apronSkirt);
    for (const sx of [-1, 1]) { mesh(box(0.025 * k, 0.24 * k, 0.02 * k), M.strap, j.chest, [sx * 0.1 * k, 0.33 * k, 0.05 * k], [-0.5, 0, sx * 0.25]); mesh(box(0.02 * k, 0.03 * k, 0.29 * k), M.strap, j.pelvis, [sx * 0.19 * k, 0.09 * k, -0.01 * k]); }
  }
  // neck and head
  mesh(prism(8, 0.065 * k, 0.06 * k, 0.08 * k), M.skin, j.neck);
  const hk = kid ? (age === 'child' ? 1.2 : 1.08) : 1; const H = group(j.head); H.scale.setScalar(hk); j.face = H; const hs = k;
  mesh(taper(0.15 * hs, 0.17 * hs, 0.165 * hs, 0.185 * hs, 0.12 * hs), M.skin, H, [0, 0, 0.005]);          // jaw → cheeks
  mesh(taper(0.165 * hs, 0.185 * hs, 0.15 * hs, 0.17 * hs, 0.11 * hs), M.skin, H, [0, 0.12 * hs, 0]);       // cranium
  mesh(box(0.15 * hs, 0.025 * hs, 0.03 * hs), M.skin, H, [0, 0.145 * hs, 0.085 * hs]);                       // brow ridge
  mesh(taper(0.03 * hs, 0.035 * hs, 0.018 * hs, 0.02 * hs, 0.06 * hs, { anchor: 'top', oz: 0.018 * hs }), M.skin, H, [0, 0.135 * hs, 0.098 * hs]);   // nose
  for (const sx of [-1, 1]) mesh(box(0.025 * hs, 0.045 * hs, 0.035 * hs), M.skin, H, [sx * 0.088 * hs, 0.11 * hs, -0.005]);                    // ears
  j.eyes = []; j.brows = [];
  for (const sx of [-1, 1]) {
    const e = group(H, [sx * 0.036 * hs, 0.123 * hs, 0.088 * hs]); mesh(box(0.03 * hs, 0.016 * hs, 0.006), M.eyeW, e); mesh(box(0.013 * hs, 0.013 * hs, 0.004), M.iris, e, [0, 0, 0.004]); j.eyes.push(e);
    const b = mesh(box(0.042 * hs, 0.013 * hs, 0.02 * hs), M.hair, H, [sx * 0.037 * hs, 0.142 * hs, 0.096 * hs], [0, 0, -sx * 0.12]); j.brows.push(b);
  }
  j.mouth = group(H, [0, 0.062 * hs, 0.093 * hs]); mesh(box(0.04 * hs, 0.012 * hs, 0.006), M.mouth, j.mouth); mesh(box(0.046 * hs, 0.006 * hs, 0.008), M.lip, j.mouth, [0, -0.008 * hs, 0.001]);
  // short messy hair: cap + tufts
  mesh(taper(0.172 * hs, 0.192 * hs, 0.15 * hs, 0.17 * hs, 0.06 * hs), M.hair, H, [0, 0.19 * hs, -0.006]);
  mesh(taper(0.17 * hs, 0.06 * hs, 0.165 * hs, 0.05 * hs, 0.1 * hs, { anchor: 'top' }), M.hair, H, [0, 0.215 * hs, -0.07 * hs]);
  const R = rng(o.seed ?? 2101); for (let t = 0; t < 9; t++) { const a = (t / 9) * Math.PI * 2; mesh(prism(3, 0.024 * hs, 0, 0.05 * hs), M.hair, H, [Math.sin(a) * 0.06 * hs, 0.235 * hs, Math.cos(a) * 0.05 * hs], [(R() - 0.5) * 0.9 + Math.cos(a) * 0.5, R() * 3, (R() - 0.5) * 0.9 - Math.sin(a) * 0.5]); }
  for (const sx of [-1, 1]) mesh(box(0.012 * hs, 0.06 * hs, 0.1 * hs), M.hair, H, [sx * 0.085 * hs, 0.17 * hs, -0.02]);
  // the thick beard (adults)
  if (!kid) {
    const bd = group(H, [0, 0.07 * hs, 0.06 * hs]); j.beard = bd;
    mesh(taper(0.155 * hs, 0.1 * hs, 0.11 * hs, 0.07 * hs, 0.11 * hs, { anchor: 'top', oz: 0.01 }), M.beard, bd, [0, 0.02 * hs, 0.012 * hs]);
    for (const sx of [-1, 1]) mesh(box(0.028 * hs, 0.08 * hs, 0.11 * hs), M.beard, bd, [sx * 0.074 * hs, 0.025 * hs, -0.03 * hs]);
    for (const sx of [-1, 1]) mesh(box(0.032 * hs, 0.014 * hs, 0.02 * hs), M.beard, H, [sx * 0.02 * hs, 0.078 * hs, 0.1 * hs], [0, 0, sx * 0.25]);   // moustache
  }
  // arms: rolled sleeves over thick bare forearms; big hands
  for (const sd of ['L', 'R']) {
    const sx = sd === 'L' ? -1 : 1;
    mesh(taper((0.12 + 0.04 * bulk) * k, (0.12 + 0.04 * bulk) * k, (0.13 + 0.035 * bulk) * k, (0.13 + 0.035 * bulk) * k, d.upper * 0.75, { anchor: 'top' }), M.shirt, j['arm' + sd]);
    mesh(prism(8, (0.072 + 0.018 * bulk) * k, (0.072 + 0.018 * bulk) * k, 0.05 * k, 'center'), M.shirt, j['arm' + sd], [0, -d.upper * 0.72, 0]);   // the roll
    mesh(taper((0.1 + 0.03 * bulk) * k, (0.1 + 0.03 * bulk) * k, (0.12 + 0.03 * bulk) * k, (0.12 + 0.03 * bulk) * k, d.upper * 0.3, { anchor: 'top' }), M.skin, j['arm' + sd], [0, -d.upper * 0.7, 0]);
    mesh(taper((0.115 + 0.03 * bulk) * k, (0.11 + 0.03 * bulk) * k, (0.08 + 0.015 * bulk) * k, (0.075 + 0.015 * bulk) * k, d.fore, { anchor: 'top' }), M.skin, j['fore' + sd]);
    j['grip' + sd] = buildHand(j['hand' + sd], M, sd, k * (kid ? 1 : 1.08), sd === 'L' && o.gloveL);
    mesh(taper(0.12 * k, 0.13 * k, 0.135 * k, 0.15 * k, d.thigh, { anchor: 'top' }), M.wool, j['thigh' + sd]);
    mesh(taper(0.1 * k, 0.11 * k, 0.13 * k, 0.14 * k, d.shin * 0.55, { anchor: 'top' }), M.wool, j['shin' + sd]);
    mesh(taper(0.13 * k, 0.15 * k, 0.12 * k, 0.14 * k, d.shin * 0.48, { anchor: 'top' }), M.boot, j['shin' + sd], [0, -d.shin * 0.52, 0]);
    mesh(box(0.14 * k, 0.03 * k, 0.16 * k), M.boot, j['shin' + sd], [0, -d.shin * 0.52, 0]);
    mesh(taper(0.12 * k, 0.24 * k, 0.11 * k, 0.2 * k, 0.08 * k, { anchor: 'top', oz: 0.035 * k }), M.boot, j['foot' + sd], [0, 0.01 * k, 0.045 * k]);
  }
  if (o.hammer !== false && !kid || o.hammer === true) { j.hammer = buildHammer(M, { len: kid ? 0.32 : 0.42, head: kid ? 0.8 : 1.15 }); j.handR.add(j.hammer); placeHammer(j); }
  setGrip(j, 'L', 0.3); setGrip(j, 'R', 0.3);
  applyPose(j, { hipY: d.hip });
  return j;
}
export function placeHammer(j) { const hk = j.k * (j.age === 'child' || j.age === 'youth' ? 1 : 1.08); const h = j.hammer; h.position.set(-0.03 * hk, -0.125 * hk, 0); h.rotation.set(0, 0, 0); }
export function setFace(j, o = {}) {   // squint 0..1, open (mouth) 0..1, brow (−1 frown .. +1 raised)
  const sq = o.squint ?? 0; j.eyes.forEach(e => e.scale.y = Math.max(0.12, 1 - sq * 0.85)); j.mouth.scale.set(1 + (o.open ?? 0) * 0.15, 1 + (o.open ?? 0) * 3.5, 1);
  j.brows.forEach((b, i) => { const sx = i ? 1 : -1; b.rotation.z = -sx * (0.12 + (o.brow ?? 0) * -0.35); b.position.y = (0.142 + (o.brow ?? 0) * 0.008) * j.k; });
}

// ---------------------------------------------------------------- the strike cycle
// Keyed poses for a right-handed overhand blow; the left hand holds tongs at the anvil.
export function strikePoses(o = {}) {
  const lean = o.lean ?? 0.25, k = o.k ?? 1;
  const legs = { thighL: [-0.28, 0, -0.12], shinL: [0.22, 0, 0], thighR: [0.22, 0, 0.12], shinR: [0.15, 0, 0], footL: [0.06, 0, 0], footR: [-0.3, 0, 0] };
  const L = o.leftArm ?? { armL: [-0.95, 0.25, -0.1], foreL: [-0.55, 0, 0] };
  const base = { ...legs, ...L, hipY: 0.94 * k, neck: [0.2, 0, 0], head: [0.15, 0, 0] };
  return {
    REST: { ...base, spine: [lean, 0, 0], chest: [0.05, 0, 0], armR: [-0.85, 0, 0.12], foreR: [-0.7, 0, 0], handR: [0.55, 0, 0] },
    UP: { ...base, hipY: 0.955 * k, spine: [lean * 0.2, 0.12, 0], chest: [-0.12, 0.15, 0], neck: [0.32, -0.1, 0], armR: [-2.75, 0, 0.22], foreR: [-1.55, 0, 0], handR: [-0.7, 0, 0] },
    CONTACT: { ...base, hipY: 0.925 * k, spine: [lean + 0.12, -0.05, 0], chest: [0.12, -0.08, 0], armR: [-0.8, 0, 0.12], foreR: [-0.55, 0, 0], handR: [0.25, 0, 0] },
    REBOUND: { ...base, hipY: 0.935 * k, spine: [lean + 0.06, 0, 0], chest: [0.06, 0, 0], armR: [-1.0, 0, 0.12], foreR: [-0.75, 0, 0], handR: [0.4, 0, 0] },
  };
}
// world position (in the character's local frame) where the hammer face lands at CONTACT
export function contactOffset(j, P) {
  const p0 = j.root.position.clone(), r0 = j.root.rotation.y; j.root.position.set(0, 0, 0); j.root.rotation.set(0, 0, 0); applyPose(j, P.CONTACT); j.root.updateMatrixWorld(true);
  const f = j.hammer.localToWorld(j.hammer.userData.face.clone()); j.root.position.copy(p0); j.root.rotation.y = r0; return f;
}
// place a character so that its CONTACT hammer face lands on the world point `target`, facing `yaw`
export function standToStrike(j, P, target, yaw) { const off = contactOffset(j, P); const r = off.clone().applyAxisAngle(v3(0, 1, 0), yaw); j.root.position.set(target.x - r.x, target.y - off.y, target.z - r.z); j.root.rotation.y = yaw; }
// one hammer cycle: u in [0,1); contact at u = 0.6
export function strikePose(P, u) {
  if (u < 0.15) return mixPose(P.REST, P.REST, 0);
  if (u < 0.5) return mixPose(P.REST, P.UP, ease((u - 0.15) / 0.35));
  if (u < 0.6) return mixPose(P.UP, P.CONTACT, easeIn((u - 0.5) / 0.1));
  if (u < 0.7) return mixPose(P.CONTACT, P.REBOUND, easeOut((u - 0.6) / 0.1));
  return mixPose(P.REBOUND, P.REST, ease((u - 0.7) / 0.3));
}
export const CONTACT_U = 0.6;
// contact times of a hammering run (t0 = first cycle start, period, n cycles)
export function contactTimes(t0, period, n) { return Array.from({ length: n }, (_, i) => t0 + (i + CONTACT_U) * period); }
// animate a hammering character at shot-time t; returns {last contact time, contacts so far}
export function hammering(j, P, t, o = {}) {
  const t0 = o.t0 ?? 0, per = o.period ?? 1.0, n = o.n ?? 99;
  const c = Math.floor((t - t0) / per); let pose;
  if (t < t0 || c >= n) pose = P.REST; else pose = strikePose(P, ((t - t0) / per) - c);
  applyPose(j, pose); setGrip(j, 'R', 1.0, o); setGrip(j, 'L', o.leftGrip ?? 0.85, o);
  const hits = contactTimes(t0, per, n).filter(x => x <= t); const last = hits.length ? hits[hits.length - 1] : -9;
  // secondary motion: the backside reacts a beat after each blow and settles (summed so overlapping blows carry through)
  if (j.butt) { let bo = 0, sw = 0, bl = 0, br = 0; hits.slice(-3).forEach((h, i) => { const a = o.jig ?? 1; bo += jigKick(t, h + 0.035, 1.7 * a, 3.6, 2.8); sw += jigKick(t, h + 0.06, 0.9 * a, 2.5, 2.4) * ((hits.length + i) % 2 ? 1 : -1); bl += jigKick(t, h + 0.04, 1.0 * a, 4.0, 3.0); br -= jigKick(t, h + 0.07, 1.0 * a, 4.0, 3.0); });
    const u = c >= 0 && c < n ? ((t - t0) / per) - c : 0; const lift = u > 0.15 && u < 0.5 ? Math.sin((u - 0.15) / 0.35 * Math.PI) * 0.18 : 0;
    setJiggle(j, { bounce: bo + lift, sway: sw, bL: bl, bR: br, pitch: 0.1 }); }
  return { last, hits };
}

// ---------------------------------------------------------------- other people of the village (plain proportions)
export function buildBaby() {
  const M = smithMaterials({ sooty: false, skin: 0xf0b898 }); const root = new THREE.Group(); const j = { root, M };
  const body = group(root, [0, 0.09, 0]); j.body = body; const sw = mat({ map: TS('swaddle'), rim: 0.6, wrap: 0.6 });
  mesh(flat(new THREE.IcosahedronGeometry(0.11, 2)), sw, body, [0, 0, 0], [0, 0, 0], [1, 0.8, 1.5]);
  mesh(flat(new THREE.IcosahedronGeometry(0.09, 2)), sw, body, [0, -0.005, -0.13], [0, 0, 0], [1.2, 0.85, 1.0]);
  const head = group(body, [0, 0.03, 0.17]); j.head = head;
  mesh(flat(new THREE.IcosahedronGeometry(0.075, 2)), M.skin, head, [0, 0, 0], [0, 0, 0], [1, 0.95, 1]);
  j.eyes = []; for (const sx of [-1, 1]) { const e = mesh(box(0.024, 0.005, 0.006), M.iris, head, [sx * 0.026, 0.012, 0.07], [0, 0, sx * 0.25]); j.eyes.push(e); }
  j.mouth = mesh(box(0.03, 0.02, 0.006), M.mouth, head, [0, -0.025, 0.071]);
  mesh(taper(0.1, 0.11, 0.08, 0.09, 0.04), M.hair, head, [0, 0.045, -0.015]);
  j.fists = []; for (const sx of [-1, 1]) { const f = group(body, [sx * 0.06, 0.06, 0.16]); mesh(flat(new THREE.IcosahedronGeometry(0.022, 1)), M.skin, f); j.fists.push(f); }
  return j;
}
export function crying(b, t) { const w = 0.5 + 0.5 * Math.sin(t * 6.5); b.mouth.scale.set(1 + w * 0.3, 0.6 + w * 1.6, 1); b.head.rotation.set(-0.1 + Math.sin(t * 6.5) * 0.08, Math.sin(t * 2.1) * 0.25, 0); b.fists.forEach((f, i) => f.position.y = 0.06 + Math.abs(Math.sin(t * 7 + i * 1.6)) * 0.035); }
