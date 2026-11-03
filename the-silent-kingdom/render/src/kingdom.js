// VHALDREN — Episode 2: THE SILENT KINGDOM. New textures, the city of Aurelmoor, the Stilled, the Stillwork.
// Built on Episode 1's engine; Cael Vorn is imported unchanged from Episode 1.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, quadsGeo, orientOut, loft } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose } from '/the-last-ember/render/src/characters.js';
import { archGeo } from '/the-last-ember/render/src/world.js';

// ---------------------------------------------------------------- textures
const cache = {};
export function T2(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  snow: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 301, [32, 16, 8, 4]), r = rng(301); pixels(x, w, h, (i, j) => { let v = 0.78 + (n(i, j) - 0.5) * 0.25; if (r() < 0.02) v += 0.15; if (r() < 0.03) v -= 0.1; return [C(v * 218), C(v * 228), C(v * 245)]; }); }, { mip: true }),
  rock: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 311, [32, 16, 8, 4]), s = fbm(w, h, 313, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.3 + (n(i, j) - 0.5) * 0.4; if (s(i, j) > 0.6) return [C(200 + v * 40), C(208 + v * 40), C(225 + v * 30)]; return [C(v * 190), C(v * 198), C(v * 215)]; }); }, { mip: true }),
  citystone: () => mk(64, 64, (x, w, h) => {
    const n = fbm(w, h, 321), r = rng(321); const tint = Array.from({ length: 64 }, () => r() * 0.2 - 0.1);
    pixels(x, w, h, (i, j) => { const row = Math.floor(j / 16), off = row % 2 ? 16 : 0, bx = (i + off) % 32, by = j % 16; let v = 0.36 + (n(i, j) - 0.5) * 0.35 + tint[row * 2 + Math.floor(((i + off) % 64) / 32)]; if (bx < 1 || by < 1) v = 0.12; if (by < 2) v += 0.05; return [C(v * 200), C(v * 210), C(v * 232)]; });
  }, { mip: true }),
  // tower facade: cold stone with a grid of narrow windows, most glowing gold
  goldwin: () => mk(32, 64, (x, w, h) => {
    const n = fbm(w, h, 331, [16, 8, 4]), r = rng(331); const lit = Array.from({ length: 64 }, () => r());
    pixels(x, w, h, (i, j) => { const cx = i % 8, cy = j % 16, id = Math.floor(i / 8) + Math.floor(j / 16) * 4; const v = 0.28 + (n(i, j) - 0.5) * 0.3;
      if (cx >= 3 && cx <= 5 && cy >= 4 && cy <= 12) { if (lit[id] < 0.72) { const g = 0.75 + lit[id] * 0.35; return [C(255 * g), C(185 * g), C(80 * g)]; } return [14, 16, 24]; }
      return [C(v * 170), C(v * 182), C(v * 210)]; });
  }),
  // emission companion: only the lit windows glow
  goldwinE: () => mk(32, 64, (x, w, h) => {
    const r = rng(331); const lit = Array.from({ length: 64 }, () => r());
    pixels(x, w, h, (i, j) => { const cx = i % 8, cy = j % 16, id = Math.floor(i / 8) + Math.floor(j / 16) * 4; if (cx >= 3 && cx <= 5 && cy >= 4 && cy <= 12 && lit[id] < 0.72) { const g = 0.8 + lit[id] * 0.3; return [C(255 * g), C(170 * g), C(60 * g)]; } return [0, 0, 0]; });
  }),
  snowroof: () => mk(32, 32, (x, w, h) => { const r = rng(341); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 4), cx = (i + (row % 2) * 4) % 8; let v = 0.7 + r() * 0.12; if (cx === 0 && r() < 0.5) v -= 0.25; if (j % 4 === 3 && r() < 0.4) v -= 0.2; return [C(v * 210), C(v * 220), C(v * 238)]; }); }),
  robe: () => mk(32, 64, (x, w, h) => {
    const n = fbm(w, h, 351, [16, 8, 4, 2]);
    pixels(x, w, h, (i, j) => { let v = 0.45 + (n(i, j) - 0.5) * 0.35 - (j / h) * 0.12; if (i % 6 === 0) v -= 0.07;
      if (j > h - 5) { const g = 0.55 + n(i, j) * 0.3; return [C(g * 200), C(g * 158), C(g * 72)]; } // tarnished gold hem
      return [C(v * 82), C(v * 100), C(v * 140)]; });
  }),
  porcelain: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 361, [16, 8]), cr = fbm(w, h, 363, [16, 8]); pixels(x, w, h, (i, j) => { let v = 0.86 + (n(i, j) - 0.5) * 0.08; if (Math.abs(cr(i, j) - 0.5) < 0.012) v -= 0.22; return [C(v * 240), C(v * 232), C(v * 215)]; }); }),
  brassE: () => mk(64, 16, (x, w, h) => {
    const n = fbm(w, h, 371, [16, 8, 4]), r = rng(371); const glyph = Array.from({ length: 16 }, () => Array.from({ length: 6 }, () => r() < 0.45));
    pixels(x, w, h, (i, j) => { let v = 0.55 + (n(i, j) - 0.5) * 0.3; if (j < 2 || j > 13) v -= 0.18; const gi = Math.floor(i / 4), gx = i % 4; if (j >= 4 && j <= 11 && gx > 0 && glyph[gi][Math.floor((j - 4) / 1.5) % 6] && (gx === 1 || j % 3 === 0)) v -= 0.28; return [C(v * 245), C(v * 182), C(v * 82)]; });
  }),
  darkbrass: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 381, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.32 + (n(i, j) - 0.5) * 0.3; return n(i, j) > 0.66 ? [C(60 + v * 60), C(90 + v * 50), C(80 + v * 40)] : [C(v * 230), C(v * 175), C(v * 90)]; }); }),
  ice: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 391, [16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.65 + (n(i, j) - 0.5) * 0.4 + (Math.sin(i * 0.7 + j * 0.2) > 0.9 ? 0.2 : 0); return [C(v * 175), C(v * 215), C(v * 245)]; }); }),
};

// ---------------------------------------------------------------- static golden lights (thousands of windows)
export function lightPoints(positions, o = {}) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const seeds = new Float32Array(positions.length / 3); const r = rng(o.seed || 5); for (let i = 0; i < seeds.length; i++) seeds[i] = r();
  g.setAttribute('sd', new THREE.BufferAttribute(seeds, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: G.uTime, uRes: G.uRes, uSize: { value: o.size ?? 0.8 }, uCol: { value: new THREE.Color(o.color ?? 0xffb84a) }, uFog: G.uFog, uFogCol: G.uFogCol, uOpacity: { value: o.opacity ?? 1 }, uFlicker: { value: o.flicker ?? 0.15 } },
    vertexShader: `attribute float sd; uniform float uTime, uSize, uFlicker; uniform vec2 uRes, uFog; varying float vF, vA;
      void main(){ vec4 vp = viewMatrix * modelMatrix * vec4(position,1.0); gl_Position = projectionMatrix * vp;
        gl_PointSize = clamp(uSize * uRes.y / max(-vp.z, 0.1), 1.0, 24.0);
        vF = clamp((length(vp.xyz) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.7; vA = 1.0 - uFlicker + uFlicker * sin(uTime * (1.0 + sd * 3.0) + sd * 40.0); }`,
    fragmentShader: `uniform vec3 uCol, uFogCol; uniform float uOpacity; varying float vF, vA; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; if (r > 1.0) discard; float a = (1.0 - r * r) * uOpacity * vA * (1.0 - vF); gl_FragColor = vec4(uCol * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}

// ---------------------------------------------------------------- mountains
export function ridged(seed) {
  const r = rng(seed), P = Array.from({ length: 7 }, (_, k) => [r() * 6.28, (0.004 + r() * 0.006) * (1 + k * 0.6), r() * 6.28, (0.004 + r() * 0.006) * (1 + k * 0.6), 1 / (1 + k * 0.9)]);
  return (x, z) => P.reduce((s, [a, fa, b, fb, w]) => s + (1 - Math.abs(Math.sin(x * fa + a) * Math.cos(z * fb + b))) * w, 0);
}
export function mountains(size, seg, hfn, o = {}) {
  // grid warped quadratically so resolution concentrates around (o.cx, o.cz) — fine at the pass, coarse far away
  const g = new THREE.PlaneGeometry(2, 2, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, half = size / 2, cx = o.cx ?? 0, cz = o.cz ?? 0, tile = o.tile ?? 40;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), w = p.getZ(i); const x = cx + Math.sign(u) * u * u * half, z = cz + Math.sign(w) * w * w * half;
    p.setXYZ(i, x, hfn(x, z), z); uv.setXY(i, x / tile, z / tile);
  }
  const f = flat(g);
  // colour by slope: snow on gentle faces, dark rock on steep ones
  const n = f.attributes.normal, cols = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) { const s = clamp((n.getY(i) - 0.55) / 0.3); const c = new THREE.Color(0x4a5060).lerp(new THREE.Color(0xdde6f4), s); cols.set([c.r, c.g, c.b], i * 3); }
  f.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return mesh(f, mat({ map: T2('snow'), vertexColors: true, affine: 0.5, color: o.color ?? 0xffffff, fogScale: o.fogScale ?? 1 }));
}

// ---------------------------------------------------------------- the Stilled (inhabitants of Aurelmoor)
// Tall slender figures in long slate-blue hooded mantles with tarnished-gold hems and a gold clasp;
// beneath the hood a smooth, featureless ivory face.
export function stilledMaterials() {
  return {
    robe: mat({ map: T2('robe'), rim: 1, wrap: 0.6 }),
    robeD: mat({ map: T2('robe'), color: 0x9aa0b0, rim: 1, side: THREE.DoubleSide, wrap: 0.6 }),
    face: mat({ map: T2('porcelain'), color: 0xc8c0b4, rim: 0.6, wrap: 0.8 }),
    hand: mat({ map: T2('porcelain'), color: 0xd8d0c4, rim: 1 }),
    gold: mat({ map: T('brass'), color: 0xd8b070 }),
    snow: mat({ map: T2('snow'), color: 0xf0f4ff }),
    thread: mat({ color: 0xffc060, emissive: 0xffb040, unlit: true }),
  };
}
export function buildStilled(o = {}) {
  const M = o.M || stilledMaterials(); const R = rng(o.seed || 1);
  const sc = o.scale ?? (0.96 + R() * 0.1);
  const d = { hip: 1.0, spineOff: 0.06, abd: 0.18, chestH: 0.28, neckH: 0.09, shW: 0.2, upper: 0.31, fore: 0.29, thigh: 0.47, shin: 0.46, hipW: 0.09 };
  const j = rig(d);
  // long mantle hangs from the pelvis to the ground (skirt) + torso
  j.skirt = group(j.pelvis, [0, 0.06, 0]); mesh(taper(0.36, 0.3, 0.62, 0.5, 1.02, { anchor: 'top' }), M.robe, j.skirt);
  mesh(taper(0.3, 0.2, 0.36, 0.22, 0.2), M.robe, j.spine);
  mesh(taper(0.36, 0.22, 0.44, 0.26, 0.28), M.robe, j.chest);
  mesh(taper(0.5, 0.34, 0.24, 0.2, 0.2, { anchor: 'bottom' }), M.robe, j.chest, [0, 0.16, -0.01]); // shoulder cape
  mesh(flat(new THREE.OctahedronGeometry(0.035, 0)), M.gold, j.chest, [0, 0.24, 0.14], [0, 0, 0], [1, 1.2, 0.5]); // clasp
  mesh(box(0.035, 0.95, 0.01, 'top'), M.gold, j.skirt, [0, 0, 0.17], [-0.2, 0, 0]); // gold placket
  mesh(prism(5, 0.05, 0.045, 0.1), M.face, j.neck);
  // the blank face (no eyes, no mouth) inside a deep hood
  const fg = new THREE.SphereGeometry(0.1, 8, 6); fg.scale(0.9, 1.25, 0.7);
  j.face = mesh(flat(fg), M.face, j.head, [0, 0.12, 0.075]);
  mesh(prism(6, 0.17, 0.1, 0.38), M.robeD, j.head, [0, -0.04, -0.05], [0, Math.PI / 6, 0], [1, 1, 1.05]); // hood
  for (const sx of [-1, 1]) mesh(taper(0.05, 0.16, 0.035, 0.12, 0.32), M.robeD, j.head, [sx * 0.13, -0.03, 0.06], [0, 0, -sx * 0.08]); // hood sides framing the face
  mesh(taper(0.28, 0.1, 0.24, 0.1, 0.06), M.robeD, j.head, [0, 0.27, 0.06], [0.35, 0, 0]); // hood brim
  for (const s of ['L', 'R']) {
    mesh(taper(0.1, 0.1, 0.13, 0.13, d.upper, { anchor: 'top' }), M.robe, j['arm' + s]);
    mesh(taper(0.13, 0.13, 0.1, 0.1, d.fore, { anchor: 'top' }), M.robe, j['fore' + s]); // wide sleeve
    mesh(taper(0.05, 0.03, 0.07, 0.07, 0.15, { anchor: 'top' }), M.hand, j['hand' + s]);
    mesh(taper(0.09, 0.1, 0.11, 0.11, d.thigh, { anchor: 'top' }), M.robe, j['thigh' + s]);
    mesh(taper(0.08, 0.09, 0.09, 0.1, d.shin, { anchor: 'top' }), M.robe, j['shin' + s]);
    mesh(taper(0.08, 0.2, 0.09, 0.18, 0.06, { anchor: 'top', oz: 0.03 }), M.hand, j['foot' + s], [0, 0.01, 0.04]);
  }
  if (o.snow) { // centuries of snow on hood and shoulders
    for (const sx of [-1, 1]) mesh(taper(0.16, 0.2, 0.12, 0.15, 0.03, { anchor: 'bottom' }), M.snow, j.chest, [sx * 0.15, 0.345, -0.01]);
    mesh(taper(0.22, 0.24, 0.16, 0.18, 0.025, { anchor: 'bottom' }), M.snow, j.head, [0, 0.33, -0.05]);
  }
  j.root.scale.setScalar(sc);
  j.M = M; j.dims = d; applyPose(j, {});
  return j;
}
export const SEATED_STILL = { hipY: 0.52, spine: [0.05, 0, 0], neck: [0.12, 0, 0], thighL: [-1.45, 0, -0.08], shinL: [1.45, 0, 0], thighR: [-1.45, 0, 0.08], shinR: [1.45, 0, 0], armL: [-0.75, 0.2, -0.1], foreL: [-0.7, 0, 0], armR: [-0.75, -0.2, 0.1], foreR: [-0.7, 0, 0] };
export const STAND_STILL = { neck: [0.1, 0, 0], armL: [0.05, 0, -0.06], armR: [0.05, 0, 0.06], foreL: [-0.1, 0, 0], foreR: [-0.1, 0, 0] };
export function setSkirt(j) { const th = (j.thighL.rotation.x + j.thighR.rotation.x) * 0.5; j.skirt.rotation.x = Math.min(0, th) * 0.75; }

// ---------------------------------------------------------------- the city of Aurelmoor (far view)
export function city(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 9);
  const facade = mat({ map: T2('goldwin'), emap: T2('goldwinE'), emissive: 0xffffff, color: 0xb8c0d4, fogScale: o.fogScale ?? 0.8, pierce: 2.5, repeat: [1, 1] });
  const stone = mat({ map: T2('citystone'), color: 0xa8b0c4, fogScale: o.fogScale ?? 0.8 });
  const roof = mat({ map: T2('snowroof'), fogScale: o.fogScale ?? 0.8 });
  const towers = [], roofs = [], walls = [], lights = [];
  const addLights = (x, y0, y1, z, r, n) => { for (let k = 0; k < n; k++) { const a = R() * Math.PI * 2; lights.push(x + Math.cos(a) * r, y0 + R() * (y1 - y0), z + Math.sin(a) * r); } };
  const WR = o.wallR ?? 170;
  // towers
  for (let i = 0; i < (o.towers ?? 90); i++) {
    const a = R() * Math.PI * 2, d = 30 + Math.sqrt(R()) * (WR - 40); const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x) < 12 && z > 0) continue; // the great avenue
    const h = 22 + Math.pow(R(), 1.6) * 70 * (1 - d / WR * 0.5), r = 4 + R() * 4, sides = R() < 0.5 ? 4 : 8;
    const tg = prism(sides, r, r * 0.94, h); const uv = tg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * sides * 0.5, uv.getY(k) * h / 14);
    towers.push(xf(tg, { p: [x, 0, z], r: [0, sides === 4 ? Math.PI / 4 : Math.PI / 8, 0] }));
    roofs.push(xf(prism(sides, r * 1.12, 0.1, h * (0.35 + R() * 0.4)), { p: [x, h, z], r: [0, sides === 4 ? Math.PI / 4 : Math.PI / 8, 0] }));
    addLights(x, 6, h, z, r + 0.4, Math.floor(h / 4));
  }
  // houses
  for (let i = 0; i < (o.houses ?? 320); i++) {
    const a = R() * Math.PI * 2, d = 20 + Math.sqrt(R()) * (WR - 20); const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x) < 10 && z > 0) continue;
    const w = 6 + R() * 6, dp = 6 + R() * 6, h = 6 + R() * 8;
    const hg = box(w, h, dp, 'bottom'); const uv = hg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 8, uv.getY(k) * h / 14);
    const ry = Math.round(a / (Math.PI / 2)) * Math.PI / 2 + (R() - 0.5) * 0.3;
    towers.push(xf(hg, { p: [x, 0, z], r: [0, ry, 0] }));
    roofs.push(xf(prism(4, Math.max(w, dp) * 0.75, 0.2, 4 + R() * 3), { p: [x, h, z], r: [0, ry + Math.PI / 4, 0] }));
    addLights(x, 2, h, z, Math.min(w, dp) * 0.55, 2);
  }
  // city wall with towers and the great gate on +z
  if (o.walls !== false) for (let k = 0; k < 48; k++) {
    const a0 = k / 48 * Math.PI * 2, a1 = (k + 1) / 48 * Math.PI * 2, am = (a0 + a1) / 2; if (Math.abs(am - Math.PI / 2) < 0.07) continue;
    const len = 2 * WR * Math.sin(Math.PI / 48) + 0.5; const wg = box(len, 16, 4, 'bottom'); const uv = wg.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * len / 8, uv.getY(q) * 2);
    walls.push(xf(wg, { p: [Math.cos(am) * WR, 0, Math.sin(am) * WR], r: [0, -am + Math.PI / 2, 0] }));
    if (k % 4 === 0) { walls.push(xf(prism(8, 5, 5, 26), { p: [Math.cos(a0) * WR, 0, Math.sin(a0) * WR] })); roofs.push(xf(prism(8, 5.6, 0.1, 10), { p: [Math.cos(a0) * WR, 26, Math.sin(a0) * WR] })); }
  }
  if (o.walls !== false) for (const sx of [-1, 1]) { walls.push(xf(box(12, 34, 12, 'bottom'), { p: [sx * 12, 0, WR] })); roofs.push(xf(prism(4, 9, 0.2, 18), { p: [sx * 12, 34, WR], r: [0, Math.PI / 4, 0] })); addLights(sx * 12, 8, 32, WR, 6.5, 10); }
  if (o.walls !== false) walls.push(xf(archGeo(12, 3, 6, 8), { p: [0, 14, WR] }));
  // the great bell tower (the Wakebell) in the centre
  const BT = v3(0, 0, -10);
  towers.push(xf(box(22, 100, 22, 'bottom'), { p: [BT.x, 0, BT.z] }));
  for (const [cx, cz] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) walls.push(xf(box(4, 28, 4, 'bottom'), { p: [BT.x + cx, 100, BT.z + cz] }));
  walls.push(xf(box(24, 4, 24, 'bottom'), { p: [BT.x, 128, BT.z] }));
  roofs.push(xf(prism(8, 13, 0.4, 70), { p: [BT.x, 132, BT.z], r: [0, Math.PI / 8, 0] }));
  for (const [cx, cz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) roofs.push(xf(prism(4, 2, 0, 16), { p: [BT.x + cx, 132, BT.z + cz] }));
  addLights(BT.x, 10, 96, BT.z, 12.5, 60);
  mesh(merge(towers), facade, g); mesh(merge(roofs), roof, g); mesh(merge(walls), stone, g);
  const bell = buildBell(7.5, { fogScale: o.fogScale ?? 0.8 }); bell.position.set(BT.x, 125, BT.z); g.add(bell);
  const lp = lightPoints(lights, { size: o.lightSize ?? 0.9, seed: 7 }); g.add(lp);
  g.userData = { bell, bellPos: v3(BT.x, 112, BT.z), lights: lp, wallR: WR };
  return g;
}

// ---------------------------------------------------------------- the Wakebell
export function buildBell(r, o = {}) {
  const g = new THREE.Group(); const pivot = group(g);
  const prof = [[0.05, 0], [0.42, -0.04], [0.5, -0.12], [0.52, -0.5], [0.6, -0.92], [0.86, -1.22], [0.98, -1.34], [1.0, -1.42], [0.92, -1.42]].map(([x, y]) => new THREE.Vector2(x * r, y * r));
  mesh(flat(new THREE.LatheGeometry(prof, 12)), mat({ map: T2('darkbrass'), color: 0xc0a080, rim: 1, fogScale: o.fogScale ?? 1, side: THREE.DoubleSide }), pivot);
  for (const yy of [-0.3, -1.1]) mesh(flat(new THREE.TorusGeometry(r * (yy < -1 ? 0.86 : 0.53), r * 0.04, 3, 12)), mat({ map: T2('brassE'), fogScale: o.fogScale ?? 1 }), pivot, [0, yy * r, 0], [Math.PI / 2, 0, 0]);
  mesh(box(r * 0.5, r * 0.25, r * 0.5), mat({ map: T('iron'), fogScale: o.fogScale ?? 1 }), pivot, [0, r * 0.1, 0]);
  const clap = group(pivot, [0, -0.1 * r, 0]); mesh(prism(6, r * 0.04, r * 0.04, r * 1.15, 'top'), mat({ map: T('iron') }), clap); mesh(flat(new THREE.OctahedronGeometry(r * 0.12, 0)), mat({ map: T('iron') }), clap, [0, -1.2 * r, 0]);
  g.userData = { pivot, clap };
  return g;
}

// ---------------------------------------------------------------- street-level pieces
export function streetHouse(seed, o = {}) {
  const R = rng(seed), w = 5 + R() * 2.5, d = 6 + R() * 2, h = 5 + R() * 3.5, stories = h > 7 ? 2 : 1;
  const walls = [box(w, h, d, 'bottom')], roofs = [], wins = [], beams = [];
  const rp = new THREE.CylinderGeometry(0.05, w * 0.78, 3.2 + R() * 1.5, 4, 1); rp.rotateY(Math.PI / 4); rp.scale(1, 1, d / w); rp.translate(0, h + 1.8, 0);
  roofs.push(flat(rp));
  for (let s = 0; s < stories; s++) for (const zz of [-d * 0.25, d * 0.25]) wins.push(xf(box(0.08, 1.1, 0.75, 'bottom'), { p: [w / 2 + 0.02, 1.4 + s * 3.2, zz] }));
  beams.push(xf(box(0.25, h, 0.25, 'bottom'), { p: [w / 2, 0, d / 2] }), xf(box(0.25, h, 0.25, 'bottom'), { p: [w / 2, 0, -d / 2] }), xf(box(0.3, 0.25, d + 0.3, 'bottom'), { p: [w / 2, 2.9, 0] }));
  const door = xf(box(0.1, 2.1, 1.1, 'bottom'), { p: [w / 2 + 0.03, 0, 0] });
  return { walls: merge(walls), roof: merge(roofs), wins: merge(wins), beams: merge(beams), door, w, d, h };
}
export function streetMaterials() {
  return {
    wall: mat({ map: T('plaster'), color: 0x9aa2b8 }), roof: mat({ map: T2('snowroof') }), beam: mat({ map: T('wood'), color: 0x6a6070 }),
    win: mat({ color: 0xffb048, emissive: 0x6a3a10, unlit: true, pierce: 3 }), door: mat({ map: T('wood'), color: 0x5a4a44 }),
    stone: mat({ map: T2('citystone') }), snow: mat({ map: T2('snow'), affine: 0.5 }), ice: mat({ map: T2('ice'), color: 0xd0e8ff, emissive: 0x1a2a3a, wrap: 0.9 }),
    wood: mat({ map: T('wood'), color: 0x8a7a70 }), brass: mat({ map: T('brass'), color: 0xe0b070 }), lamp: mat({ color: 0xffc060, emissive: 0xffb040, unlit: true }),
  };
}
export function frozenFountain(M) {
  const g = new THREE.Group(); const parts = [], ice = [];
  parts.push(prism(8, 4.2, 4.2, 0.9)); ice.push(xf(prism(8, 3.8, 3.8, 0.12), { p: [0, 0.82, 0] }));
  parts.push(xf(prism(8, 0.6, 0.45, 3.2), { p: [0, 0.9, 0] })); parts.push(xf(prism(8, 1.8, 0.7, 0.5), { p: [0, 3.6, 0] }));
  parts.push(xf(prism(6, 0.3, 0.25, 1.2), { p: [0, 4.1, 0] }));
  const R = rng(41);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; ice.push(xf(prism(4, 0.09 + R() * 0.06, 0.0, 0.5 + R() * 1.0, 'top'), { p: [Math.cos(a) * 1.7, 3.6, Math.sin(a) * 1.7] })); }
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; ice.push(xf(prism(4, 0.08 + R() * 0.05, 0.0, 0.3 + R() * 0.5, 'top'), { p: [Math.cos(a) * 4.15, 0.9, Math.sin(a) * 4.15] })); }
  ice.push(xf(prism(6, 0.35, 0.08, 2.6), { p: [0, 1.0, 0] })); // frozen jet
  mesh(merge(parts), M.stone, g); mesh(merge(ice), M.ice, g);
  return g;
}
export function lantern(M, h = 3.2) {
  const g = new THREE.Group();
  mesh(merge([prism(4, 0.07, 0.06, h), xf(box(0.7, 0.06, 0.06), { p: [0.3, h - 0.1, 0] })]), M.wood, g);
  mesh(prism(6, 0.16, 0.13, 0.36, 'top'), M.lamp, g, [0.6, h - 0.15, 0]);
  const gl = glow(0xffb050, 1.8, 0.6); gl.position.set(0.6, h - 0.35, 0); g.add(gl);
  g.userData.light = v3(0.6, h - 0.35, 0);
  return g;
}
export function table(M) { return mesh(merge([xf(box(1.8, 0.08, 0.9, 'bottom'), { p: [0, 0.76, 0] }), ...[[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].map(([x, z]) => xf(box(0.08, 0.76, 0.08, 'bottom'), { p: [x, 0, z] }))]), M.wood); }
export function bench(M, len = 1.8) { return mesh(merge([xf(box(len, 0.07, 0.38, 'bottom'), { p: [0, 0.46, 0] }), xf(box(0.07, 0.46, 0.34, 'bottom'), { p: [-len / 2 + 0.1, 0, 0] }), xf(box(0.07, 0.46, 0.34, 'bottom'), { p: [len / 2 - 0.1, 0, 0] })]), M.wood); }

// ---------------------------------------------------------------- the Stillwork (the machine beneath the city)
export function gearGeo(r, teeth, th = 0.6, hole = 0.35) {
  const s = new THREE.Shape(); const n = teeth * 2;
  for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2; const rr = (Math.floor(i / 2) % 2 === 0) ? r : r * 0.86; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
  const hp = new THREE.Path(); for (let i = 0; i <= 8; i++) { const a = -i / 8 * Math.PI * 2; const x = Math.cos(a) * r * hole, y = Math.sin(a) * r * hole; if (i === 0) hp.moveTo(x, y); else hp.lineTo(x, y); }
  s.holes.push(hp);
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -th / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / r * 0.5, uv.getY(i) / r * 0.5);
  return flat(g);
}
export function stillwork(o = {}) {
  const g = new THREE.Group();
  const M = {
    stone: mat({ map: T2('citystone'), color: 0x8890a8 }), stoneD: mat({ map: T2('citystone'), color: 0x8890a8, side: THREE.BackSide }),
    brass: mat({ map: T2('brassE'), rim: 1, color: 0xe8c890 }), dark: mat({ map: T2('darkbrass'), rim: 1 }), iron: mat({ map: T('iron'), rim: 1 }),
    core: mat({ color: 0xffd080, emissive: 0xffc060, unlit: true }), petal: mat({ map: T2('darkbrass'), color: 0xd0b090, rim: 1, side: THREE.DoubleSide }),
  };
  // vault
  const vault = new THREE.CylinderGeometry(30, 30, 60, 16, 4, true); const uv = vault.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 24, uv.getY(i) * 8);
  mesh(flat(vault), M.stoneD, g, [0, 22, 0]);
  const floor = new THREE.CircleGeometry(30, 16); floor.rotateX(-Math.PI / 2); const fu = floor.attributes.uv; for (let i = 0; i < fu.count; i++) fu.setXY(i, fu.getX(i) * 8, fu.getY(i) * 8);
  mesh(floor, M.stone, g, [0, -8, 0]);
  // pillars ring
  const pil = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + Math.PI / 12; pil.push(xf(prism(6, 1.4, 1.2, 60), { p: [Math.cos(a) * 27, -8, Math.sin(a) * 27] })); }
  mesh(merge(pil), M.stone, g);
  // entrance balcony and stair (from the plaza above)
  mesh(merge([xf(box(8, 1, 10, 'top'), { p: [18, 6, 20] }), ...Array.from({ length: 14 }, (_, k) => xf(box(3.6, 0.5, 1.2, 'top'), { p: [20, 6 - k * 1.0, 14.6 - k * 1.1] }))]), M.stone, g);
  // the mechanism: gimbal rings around a golden core
  const mech = group(g, [0, 8, 0]);
  const rings = [];
  for (const [r, tube, axis] of [[13, 0.7, 'x'], [10, 0.6, 'z'], [7.4, 0.55, 'y']]) { const rg = group(mech); mesh(flat(new THREE.TorusGeometry(r, tube, 4, 28)), M.brass, rg); for (let s = 0; s < 4; s++) mesh(box(0.3, r * 2, 0.3), M.dark, rg, [0, 0, 0], [0, 0, s * Math.PI / 4]); rings.push({ g: rg, axis }); }
  // spokes removed from inner ring for the core view
  rings[2].g.children.splice(1);
  const core = mesh(flat(new THREE.IcosahedronGeometry(2.2, 1)), M.core, mech);
  const coreGlow = glow(0xffc060, 16, 0.85); mech.add(coreGlow); const coreGlow2 = glow(0xffe0a0, 7, 0.9); mech.add(coreGlow2);
  // iris of eight brass petals in front of the core (+z), the machine's 'eye'
  const iris = group(mech, [0, 0, 3.0]); const petals = [];
  for (let k = 0; k < 8; k++) { const pg = group(iris); pg.rotation.z = k / 8 * Math.PI * 2; const pl = group(pg, [0, 0, 0]); mesh(taper(0.2, 0.1, 2.6, 0.1, 3.4, { anchor: 'bottom' }), M.petal, pl, [0, 0.2, 0]); petals.push(pl); }
  mesh(flat(new THREE.TorusGeometry(3.6, 0.35, 4, 16)), M.dark, iris);
  // great gears and pistons around the walls
  const gears = [];
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.3, r = 3 + (k % 3) * 1.5; const gr = mesh(gearGeo(r, 10 + (k % 3) * 4, 0.8), M.dark, g, [Math.cos(a) * 24, 4 + (k % 2) * 14, Math.sin(a) * 24]); gr.lookAt(0, gr.position.y, 0); gears.push({ m: gr, speed: (k % 2 ? 1 : -1) * (0.3 + 0.2 * (k % 3)) }); }
  const pistons = [];
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; mesh(prism(6, 0.9, 0.9, 6), M.iron, g, [Math.cos(a) * 18, -8, Math.sin(a) * 18]); const rod = mesh(prism(6, 0.4, 0.4, 10), M.brass, g, [Math.cos(a) * 18, -4, Math.sin(a) * 18]); pistons.push(rod); }
  // golden threads: every soul in the city, bound to the core, rising through the vault ceiling
  const R = rng(55), tp = [];
  const threadEnds = [];
  for (let k = 0; k < 420; k++) { const a = R() * Math.PI * 2, rr = 3 + R() * 26; const end = v3(Math.cos(a) * rr, 52, Math.sin(a) * rr); const mid = v3(Math.cos(a) * rr * 0.5, 28 + R() * 8, Math.sin(a) * rr * 0.5); tp.push(0, 8, 0, mid.x, mid.y, mid.z, mid.x, mid.y, mid.z, end.x, end.y, end.z); threadEnds.push(end); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  const threadMat = new THREE.LineBasicMaterial({ color: 0xffb848, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  const threads = new THREE.LineSegments(tg, threadMat); g.add(threads);
  g.userData = { M, mech, rings, core, coreGlow, coreGlow2, iris, petals, gears, pistons, threads, threadMat, threadEnds };
  return g;
}
export function animateStillwork(S, t, o = {}) {
  const u = S.userData, sp = o.speed ?? 1;
  u.rings[0].g.rotation.x = t * 0.25 * sp; u.rings[1].g.rotation.z = -t * 0.32 * sp + 0.6; u.rings[2].g.rotation.y = t * 0.45 * sp;
  u.gears.forEach(G => { G.m.rotateZ(0); G.m.rotation.z = t * G.speed * sp; });
  u.pistons.forEach((p, k) => { p.position.y = -4 + Math.sin(t * 2.2 * sp + k) * 1.6; });
  const open = o.open ?? 0;
  u.petals.forEach(p => { p.position.y = open * 2.6; p.rotation.x = -open * 0.9; });
  const pulse = 0.85 + 0.15 * Math.sin(t * (o.pulseRate ?? 2.4));
  u.coreGlow.material.opacity = (0.55 + open * 0.35) * pulse; u.coreGlow2.material.opacity = 0.7 * pulse;
  const s1 = 16 * (1 + open * 0.6) * pulse; u.coreGlow.scale.set(s1, s1, 1);
  u.threadMat.opacity = (o.threads ?? 0.45) * (0.8 + 0.2 * Math.sin(t * 3.1));
}
