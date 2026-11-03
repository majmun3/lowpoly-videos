// THE VIGIL PLATE — Cael Vorn's permanent armour from Episode 3 onward (CANON; do not modify in later episodes).
// An original design: rounded close helm with a single narrow eye-slit, angled vertical breaths, low comb,
// aged-bronze brow band bearing Cael's diamond sigil; engraved silver-grey plate over dark mail and charcoal cloth;
// layered pauldrons on both shoulders; blue-grey accents; the Watchful Ember shield.
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, loft, orientOut, quadsGeo } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose, buildKnight, buildSword, knightMaterials } from '/the-last-ember/render/src/characters.js';

// ---------------------------------------------------------------- textures
const cache = {};
export function TV(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  steel: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 501, [16, 8, 4, 2]), g = fbm(w, h, 503, [8, 4]), r = rng(501); pixels(x, w, h, (i, j) => { let v = 0.44 + (n(i, j) - 0.5) * 0.24 - Math.max(0, g(i, j) - 0.64) * 0.3; if (r() < 0.04) v += 0.14; if (r() < 0.03) v -= 0.12; if ((i * 3 + j * 7) % 41 === 0) v += 0.16; return [C(v * 200), C(v * 206), C(v * 216)]; }); }),
  steelEng: () => mk(64, 32, (x, w, h) => {
    const n = fbm(w, h, 511, [16, 8, 4]), r = rng(511);
    pixels(x, w, h, (i, j) => { let v = 0.44 + (n(i, j) - 0.5) * 0.26; if (r() < 0.04) v += 0.13;
      const band = j >= 11 && j <= 20; const cx = i % 16, cy = j - 15.5;
      const chev = Math.abs(Math.abs(cx - 8) - Math.abs(cy) * 1.2) < 0.7; const dia = Math.abs(cx - 8) + Math.abs(cy) * 1.4 < 2.6;
      if (band && (j === 11 || j === 20)) { const g = 0.45 + n(i, j) * 0.3; return [C(g * 170), C(g * 128), C(g * 66)]; }
      if (band && (chev || dia)) v -= 0.13;
      return [C(v * 200), C(v * 206), C(v * 216)]; });
  }),
  bronzeV: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 521, [8, 4]); pixels(x, w, h, (i, j) => { const v = n(i, j); return v > 0.7 ? [C(60 + v * 30), C(88 + v * 30), C(76 + v * 24)] : [C(92 + v * 70), C(68 + v * 46), C(36 + v * 18)]; }); }),
  mail: () => mk(16, 16, (x, w, h) => { pixels(x, w, h, (i, j) => { const ring = ((i + (Math.floor(j / 2) % 2) * 2) % 4 === 0) || j % 2 === 0; return ring ? [22, 23, 28] : [C(62 + ((i * j) % 5) * 6), C(64 + ((i * j) % 5) * 6), 72]; }); }),
  charcoal: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 531, [16, 8, 4, 2]), r = rng(531); const tear = Array.from({ length: w }, () => h - 1 - Math.floor(r() * 9)); pixels(x, w, h, (i, j) => { if (j > tear[i]) return [0, 0, 0, 0]; let v = 0.3 + (n(i, j) - 0.5) * 0.25; if ((i + j) % 4 === 0) v -= 0.04; return [C(v * 150), C(v * 150), C(v * 160), 255]; }); }),
  bluegrey: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 541, [16, 8, 4, 2]), r = rng(541); const tear = Array.from({ length: w }, () => h - 1 - Math.floor(r() * 6)); pixels(x, w, h, (i, j) => { if (j > tear[i]) return [0, 0, 0, 0]; let v = 0.5 + (n(i, j) - 0.5) * 0.3; if (j > tear[i] - 5 || i < 2 || i > 29) { const g = 0.5 + n(i, j) * 0.35; return [C(g * 190), C(g * 142), C(g * 72), 255]; } return [C(v * 120), C(v * 140), C(v * 165), 255]; }); }),
  scarf: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 551, [16, 8, 4, 2]), r = rng(551); const tear = Array.from({ length: w }, (_, i) => h - 2 - Math.floor(r() * 10 + Math.sin(i * 1.3) * 3)); pixels(x, w, h, (i, j) => { if (j > tear[i]) return [0, 0, 0, 0]; const v = 0.48 + (n(i, j) - 0.5) * 0.4 - (j / h) * 0.15; return [C(v * 112), C(v * 132), C(v * 160), 255]; }); }),
  // visor: steel with two angled columns of narrow vertical breaths on the lower face
  visor: () => mk(64, 32, (x, w, h) => {
    const n = fbm(w, h, 561, [16, 8, 4]), r = rng(561);
    pixels(x, w, h, (i, j) => { let v = 0.46 + (n(i, j) - 0.5) * 0.24; if (r() < 0.04) v += 0.12;
      for (const [c0, dir] of [[14, 1], [50, -1]]) for (let s = 0; s < 4; s++) { const sx = c0 + s * 3 * dir; const top = 15 - s * 1.5; if (Math.abs(i - sx) < 0.8 && j > 4 + s * 0.5 && j < top) return [10, 10, 14]; }
      if (Math.abs(i - 32) < 1.2) v += 0.12; // centre keel highlight
      return [C(v * 200), C(v * 206), C(v * 218)]; });
  }),
  // shield face: blue-grey field, the Watchful Ember sigil in aged gold, battle scratches
  shield: () => mk(96, 160, (x, w, h) => {
    const n = fbm(w, h, 571, [32, 16, 8, 4]), sc = rng(571);
    const scratches = Array.from({ length: 26 }, () => [sc() * w, sc() * h, sc() * 6.28, 6 + sc() * 22]);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    const cx = 48, cy = 66;
    // inner border following the heater outline
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(8, 10); g.lineTo(88, 10); g.lineTo(87, 70); g.quadraticCurveTo(84, 120, 48, 152); g.quadraticCurveTo(12, 120, 9, 70); g.closePath(); g.stroke();
    // crown bar with three points (the vanished kingdom)
    g.fillRect(cx - 16, cy - 40, 32, 4); for (const dx of [-14, 0, 14]) { g.beginPath(); g.moveTo(cx + dx - 3, cy - 40); g.lineTo(cx + dx, cy - 49 - (dx === 0 ? 4 : 0)); g.lineTo(cx + dx + 3, cy - 40); g.fill(); }
    // the lozenge (Cael's ember) with an inner diamond
    g.lineWidth = 3.5; g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx + 14, cy); g.lineTo(cx, cy + 30); g.lineTo(cx - 14, cy); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 5, cy); g.lineTo(cx, cy + 9); g.lineTo(cx - 5, cy); g.closePath(); g.fill();
    // two open hands of the Vigil cradling it
    g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 30, cy - 22); g.quadraticCurveTo(cx + s * 34, cy + 22, cx + s * 6, cy + 38); g.stroke(); }
    // three falling lines (the ash-tears of the old sigil, now as a vow)
    g.lineWidth = 2.5; for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(cx + dx, cy + 44); g.lineTo(cx + dx, cy + 44 + (dx === 0 ? 22 : 14)); g.stroke(); }
    const m = g.getImageData(0, 0, w, h).data;
    pixels(x, w, h, (i, j) => {
      let v = 0.5 + (n(i, j) - 0.5) * 0.28;
      let col = [v * 92, v * 112, v * 140];
      for (const [sx, sy, a, l] of scratches) { const dx = i - sx, dy = j - sy; const along = dx * Math.cos(a) + dy * Math.sin(a), across = -dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(across) < 0.6 && along > 0 && along < l) col = [150, 156, 166]; }
      if (m[(j * w + i) * 4] > 128) { const gg = 0.62 + n(i, j) * 0.35; col = [gg * 220, gg * 170, gg * 82]; }
      return [C(col[0]), C(col[1]), C(col[2])];
    });
  }),
};

export function sigilTexture() {
  if (cache.sigil) return cache.sigil;
  cache.sigil = mk(64, 96, (x, w, h) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    const cx = 32, cy = 44;
    g.fillRect(cx - 11, cy - 27, 22, 3); for (const dx of [-9, 0, 9]) { g.beginPath(); g.moveTo(cx + dx - 2, cy - 27); g.lineTo(cx + dx, cy - 33 - (dx === 0 ? 3 : 0)); g.lineTo(cx + dx + 2, cy - 27); g.fill(); }
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, cy - 20); g.lineTo(cx + 9, cy); g.lineTo(cx, cy + 20); g.lineTo(cx - 9, cy); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx, cy - 6); g.lineTo(cx + 3.5, cy); g.lineTo(cx, cy + 6); g.lineTo(cx - 3.5, cy); g.closePath(); g.fill();
    g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 20, cy - 15); g.quadraticCurveTo(cx + s * 23, cy + 15, cx + s * 4, cy + 26); g.stroke(); }
    g.lineWidth = 2; for (const dx of [-5, 0, 5]) { g.beginPath(); g.moveTo(cx + dx, cy + 30); g.lineTo(cx + dx, cy + 30 + (dx === 0 ? 15 : 10)); g.stroke(); }
    const m = g.getImageData(0, 0, w, h).data;
    pixels(x, w, h, (i, j) => { const a = m[(j * w + i) * 4 + 3]; return [255, 255, 255, a > 100 ? 255 : 0]; });
  }, { clamp: true });
  return cache.sigil;
}
export function sigilDecal(parent, size = 0.22) {
  const m = mat({ map: sigilTexture(), color: 0xc89040, unlit: true, additive: true, alphaTest: 0.5, opacity: 0, side: THREE.DoubleSide });
  const d = mesh(new THREE.PlaneGeometry(size * 0.667, size), m, parent);
  return d;
}
export function vigilMaterials() {
  return {
    steel: mat({ map: TV('steel'), rim: 1 }), steelD: mat({ map: TV('steel'), rim: 1, side: THREE.DoubleSide }),
    eng: mat({ map: TV('steelEng'), rim: 1 }), engD: mat({ map: TV('steelEng'), rim: 1, side: THREE.DoubleSide }),
    visor: mat({ map: TV('visor'), rim: 1, side: THREE.DoubleSide, affine: 0.5 }),
    bronze: mat({ map: TV('bronzeV'), rim: 1, color: 0xb8a088 }), bronzeD: mat({ map: TV('bronzeV'), rim: 1, side: THREE.DoubleSide, color: 0xb8a088 }),
    mail: mat({ map: TV('mail'), color: 0xb8bcc8, repeat: [3, 3], rim: 1 }),
    charcoal: mat({ map: TV('charcoal'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.7 }),
    bluegrey: mat({ map: TV('bluegrey'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.7 }),
    scarf: mat({ map: TV('scarf'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }),
    leather: mat({ map: T('leather'), color: 0x9a8a78, rim: 1 }),
    dark: mat({ color: 0x0c0c10, unlit: true }),
    slit: mat({ color: 0x180804, emissive: 0x5a2008, unlit: true, pierce: 2 }),
    brass: mat({ map: T('brass') }),
    shield: mat({ map: TV('shield'), rim: 0.6, affine: 0.4 }),
    sigil: mat({ color: 0xffd090, emissive: 0x000000, unlit: true }),
  };
}

// ---------------------------------------------------------------- the helm
export function buildVigilHelm(parent, M) {
  const h = group(parent);
  // rounded, slightly elongated skull (deeper than wide), tall dome
  const ring = (y, a, bf, bb) => ({ y, pts: Array.from({ length: 12 }, (_, i) => { const t = i / 12 * Math.PI * 2; const c = Math.cos(t); return [a * Math.sin(t), (c > 0 ? bf : bb) * c]; }) });
  mesh(loft([ring(0.0, 0.112, 0.11, 0.142), ring(0.15, 0.126, 0.134, 0.154), ring(0.25, 0.122, 0.13, 0.15), ring(0.31, 0.104, 0.112, 0.134), ring(0.345, 0.07, 0.076, 0.097), ring(0.366, 0.028, 0.03, 0.044)]), M.steel, h);
  // visor shell: from cheek to cheek, a shallow V-keel down the centre, chin pointed slightly forward
  const angs = [-1.75, -1.15, -0.6, -0.22, 0, 0.22, 0.6, 1.15, 1.75];
  const rings = [[-0.06, 0.112, 0.07], [0.02, 0.138, 0.1], [0.1, 0.146, 0.09], [0.158, 0.145, 0.06]];
  const quads = [], uvs = [];
  const P = (ri, k) => { const [y, R, keel] = rings[ri]; const a = angs[k]; const r = R * (1 + keel * Math.max(0, 1 - Math.abs(a) / 0.6)); return [r * Math.sin(a), y, r * Math.cos(a)]; };
  for (let ri = 0; ri < rings.length - 1; ri++) for (let k = 0; k < angs.length - 1; k++) quads.push([P(ri, k), P(ri, k + 1), P(ri + 1, k + 1), P(ri + 1, k)]);
  const vg = quadsGeo(quads);
  const uv = vg.attributes.uv; let q = 0;
  for (let ri = 0; ri < rings.length - 1; ri++) for (let k = 0; k < angs.length - 1; k++) {
    const u0 = k / (angs.length - 1), u1 = (k + 1) / (angs.length - 1), v0 = ri / (rings.length - 1), v1 = (ri + 1) / (rings.length - 1);
    const L = [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]]; for (const [uu, vv] of L) uv.setXY(q++, uu, vv);
  }
  orientOut(vg, v3(0, 0.05, -0.05));
  mesh(vg, M.visor, h);
  // the eye-slit: a dark (faintly ember-lit) liner behind the gap between visor and brow band, with a centre bar
  const sl = new THREE.CylinderGeometry(0.139, 0.139, 0.024, 10, 1, true, -1.2, 2.4); mesh(flat(sl), M.slit, h, [0, 0.17, 0]);
  mesh(box(0.012, 0.026, 0.012), M.steel, h, [0, 0.17, 0.154]);
  // aged-bronze brow band with Cael's diamond sigil
  const bb = new THREE.CylinderGeometry(0.134, 0.136, 0.032, 12, 1, true, -1.9, 3.8); mesh(flat(bb), M.bronzeD, h, [0, 0.203, 0]);
  mesh(flat(new THREE.OctahedronGeometry(0.022, 0)), M.brass, h, [0, 0.205, 0.142], [0, 0, 0], [1, 1.35, 0.5]);
  // visor pivot rivets
  for (const sx of [-1, 1]) mesh(flat(new THREE.OctahedronGeometry(0.017, 0)), M.bronze, h, [sx * 0.135, 0.16, 0.0], [0, 0, 0], [0.5, 1, 1]);
  // low rounded comb from brow to nape
  for (let s = 0; s < 7; s++) { const a = -1.25 + s * 0.42; const yy = 0.245 + Math.cos(a) * 0.122, zz = Math.sin(a) * 0.14; mesh(box(0.013, 0.022, 0.065), M.steel, h, [0, yy, -zz], [-a, 0, 0]); }
  h.userData.slit = M.slit;
  return h;
}
export function buildGorget(parent, M) {
  const g = group(parent);
  for (let i = 0; i < 3; i++) mesh(prism(12, 0.14 + i * 0.022, 0.118 + i * 0.022, 0.05, 'top'), i === 2 ? M.eng : M.steel, g, [0, 0.07 - i * 0.04, 0.005]);
  return g;
}

// ---------------------------------------------------------------- the shield (the Watchful Ember)
export function buildShield(M) {
  const g = new THREE.Group();
  const outline = (s) => { const sh = new THREE.Shape(); sh.moveTo(-0.29 * s, 0.5 * s); sh.quadraticCurveTo(0, 0.55 * s, 0.29 * s, 0.5 * s); sh.lineTo(0.285 * s, 0.06 * s); sh.quadraticCurveTo(0.26 * s, -0.32 * s, 0, -0.55 * s); sh.quadraticCurveTo(-0.26 * s, -0.32 * s, -0.285 * s, 0.06 * s); sh.lineTo(-0.29 * s, 0.5 * s); return sh; };
  const bend = (geo, k = 0.55) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - k * p.getX(i) * p.getX(i)); geo.computeVertexNormals(); return geo; };
  const body = new THREE.ExtrudeGeometry(outline(1), { depth: 0.035, bevelEnabled: false, curveSegments: 4 }); body.translate(0, 0, -0.035);
  mesh(flat(bend(body)), M.steel, g);
  const face = new THREE.ShapeGeometry(outline(0.93), 4); face.translate(0, 0, 0.004);
  const uv = face.attributes.uv, p = face.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 0.29) / 0.58, (p.getY(i) + 0.55) / 1.1);
  mesh(flat(bend(face)), M.shield, g);
  // rivets around the rim
  const pts = outline(0.965).getSpacedPoints(26);
  for (const q of pts.slice(0, 26)) mesh(flat(new THREE.OctahedronGeometry(0.011, 0)), M.bronze, g, [q.x, q.y, 0.006 - 0.55 * q.x * q.x], [0, 0, 0], [1, 1, 0.6]);
  // boss-less back with leather enarmes
  mesh(box(0.34, 0.04, 0.02), M.leather, g, [0, 0.08, -0.05]); mesh(box(0.3, 0.04, 0.02), M.leather, g, [0, -0.12, -0.05]);
  g.userData = { M };
  return g;
}

// ---------------------------------------------------------------- full armour set on a rig
const OLD_REGION = { head: 'helm', neck: 'helm', chest: 'chest', spine: 'chest', pelvis: 'chest', armL: 'shoulders', armR: 'shoulders', foreL: 'arms', foreR: 'arms', handL: 'arms', handR: 'arms', thighL: 'legs', thighR: 'legs', shinL: 'legs', shinR: 'legs', footL: 'legs', footR: 'legs' };
const JOINTS = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shL', 'armL', 'foreL', 'handL', 'shR', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR'];

// Attach the Vigil Plate to an existing rig `j` (dims as Episode 1's knight). Returns { region -> [objects] } for the new set.
export function attachVigil(j, M, o = {}) {
  const R = {}; const add = (region, obj) => { (R[region] = R[region] || []).push(obj); return obj; };
  const at = (joint, region) => add(region, group(j[joint]));
  // helm + gorget + blue-grey cowl
  const hg = at('head', 'helm'); j.vhelm = buildVigilHelm(hg, M);
  const gg = at('neck', 'helm'); buildGorget(gg, M);
  // chest: engraved breastplate with a keel, bronze trims, diagonal strap
  const cg = at('chest', 'chest');
  const bring = (y, w, f, b) => ({ y, pts: [[0, f], [w * 0.55, f * 0.82], [w, f * 0.1], [w * 0.92, -b * 0.7], [0, -b], [-w * 0.92, -b * 0.7], [-w, f * 0.1], [-w * 0.55, f * 0.82]] });
  mesh(loft([bring(0.0, 0.2, 0.14, 0.12), bring(0.14, 0.235, 0.18, 0.135), bring(0.3, 0.24, 0.15, 0.14)]), M.steel, cg);
  mesh(taper(0.3, 0.012, 0.36, 0.012, 0.09), M.eng, cg, [0, 0.17, 0.155], [-0.18, 0, 0]);
  mesh(box(0.012, 0.28, 0.012), M.bronze, cg, [0, 0.15, 0.178], [0.1, 0, 0]);
  mesh(box(0.36, 0.025, 0.2), M.bronze, cg, [0, 0.3, 0.0]);
  mesh(box(0.05, 0.42, 0.012), M.leather, cg, [0.02, 0.16, 0.17], [0.15, 0, 0.62]);
  // abdomen: plackart over mail
  const sg = at('spine', 'chest');
  mesh(taper(0.3, 0.21, 0.36, 0.25, 0.2), M.mail, sg);
  mesh(taper(0.27, 0.05, 0.34, 0.05, 0.19, { oz: 0.0 }), M.steel, sg, [0, 0.0, 0.11]);
  mesh(box(0.3, 0.02, 0.05), M.bronze, sg, [0, 0.19, 0.12]);
  // waist: belt, faulds, mail skirt, charcoal cloth and the blue-grey front panel
  const pg = at('pelvis', 'chest');
  mesh(taper(0.35, 0.24, 0.33, 0.23, 0.16, { anchor: 'center' }), M.mail, pg);
  mesh(box(0.38, 0.055, 0.27), M.leather, pg, [0, 0.06, 0]); mesh(box(0.07, 0.06, 0.02), M.bronze, pg, [0, 0.06, 0.14]);
  for (let i = 0; i < 3; i++) mesh(taper(0.38 + i * 0.03, 0.27 + i * 0.02, 0.36 + i * 0.03, 0.26 + i * 0.02, 0.07, { anchor: 'top' }), i === 2 ? M.eng : M.steel, pg, [0, 0.03 - i * 0.055, 0]);
  const skirtF = group(pg, [0, -0.1, 0.12]); mesh(taper(0.2, 0.012, 0.18, 0.012, 0.52, { anchor: 'top' }), M.bluegrey, skirtF); j.vSkirtF = skirtF;
  const skirtB = group(pg, [0, -0.06, -0.12]); mesh(taper(0.36, 0.012, 0.3, 0.012, 0.58, { anchor: 'top' }), M.charcoal, skirtB); j.vSkirtB = skirtB;
  for (const sx of [-1, 1]) { const sk = group(pg, [sx * 0.17, -0.06, 0]); mesh(taper(0.012, 0.24, 0.012, 0.2, 0.5, { anchor: 'top' }), M.charcoal, sk); }
  // sword belt slung low with the scabbard on the left hip
  mesh(box(0.42, 0.04, 0.3), M.leather, pg, [0, -0.03, 0], [0, 0, 0.12]);
  const scab = group(pg, [-0.2, -0.05, -0.02], [0.35, 0, 0.25]); add('chest', scab);
  mesh(box(0.06, 0.95, 0.03, 'top'), M.leather, scab); mesh(box(0.065, 0.08, 0.035, 'top'), M.bronze, scab, [0, -0.88, 0]); mesh(box(0.07, 0.06, 0.04, 'top'), M.bronze, scab);
  j.vScabbard = scab;
  // shoulders: layered rounded pauldrons on BOTH sides
  for (const [s, sx] of [['L', -1], ['R', 1]]) {
    const ag = at('arm' + s, 'shoulders');
    const cap = new THREE.SphereGeometry(0.15, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.46); cap.scale(1.05, 0.8, 1.12);
    mesh(flat(cap), M.engD, ag, [sx * 0.035, 0.035, 0], [0, 0, -sx * 0.38]);
    for (let i = 0; i < 3; i++) {
      const r = 0.135 - i * 0.01, th = Math.PI * 1.15;
      const lame = new THREE.CylinderGeometry(r, r + 0.012, 0.07, 7, 1, true, (sx > 0 ? Math.PI / 2 : -Math.PI / 2) - th / 2, th);
      mesh(flat(lame), M.steelD, ag, [sx * 0.012, -0.03 - i * 0.055, 0], [0, 0, -sx * 0.14]);
      const edge = new THREE.CylinderGeometry(r + 0.013, r + 0.014, 0.012, 7, 1, true, (sx > 0 ? Math.PI / 2 : -Math.PI / 2) - th / 2, th);
      mesh(flat(edge), M.bronzeD, ag, [sx * 0.012, -0.068 - i * 0.055, 0], [0, 0, -sx * 0.14]);
    }
    mesh(taper(0.11, 0.11, 0.125, 0.125, 0.29, { anchor: 'top' }), M.mail, ag);
    mesh(taper(0.112, 0.115, 0.122, 0.124, 0.14, { anchor: 'top' }), M.steel, ag, [0, -0.15, 0]);
    // arms: couter, vambrace, gauntlet
    const fg = at('fore' + s, 'arms');
    mesh(flat(new THREE.OctahedronGeometry(0.07, 0)), M.steel, fg, [0, 0, -0.01], [0, 0, 0], [1, 0.9, 1.1]);
    mesh(taper(0.01, 0.12, 0.01, 0.06, 0.1, { anchor: 'center' }), M.steelD, fg, [sx * 0.07, 0.0, -0.01], [0, 0, sx * 0.3]);
    mesh(taper(0.095, 0.1, 0.118, 0.12, 0.26, { anchor: 'top' }), M.eng, fg);
    mesh(prism(8, 0.07, 0.07, 0.02, 'top'), M.bronze, fg, [0, -0.24, 0]);
    const hgp = at('hand' + s, 'arms');
    mesh(prism(6, 0.068, 0.058, 0.08, 'bottom'), M.steel, hgp, [0, -0.06, 0]);
    mesh(box(0.085, 0.11, 0.1, 'top'), M.steel, hgp, [0, -0.02, 0.005]);
    mesh(box(0.08, 0.05, 0.09, 'top'), M.mail, hgp, [0, -0.11, 0.01]);
  }
  // legs: cuisses, poleyns, greaves, laminated sabatons
  for (const [s, sx] of [['L', -1], ['R', 1]]) {
    const tg = at('thigh' + s, 'legs'); mesh(taper(0.14, 0.15, 0.17, 0.18, 0.46, { anchor: 'top' }), M.mail, tg); mesh(taper(0.145, 0.09, 0.175, 0.1, 0.4, { anchor: 'top', oz: 0.04 }), M.eng, tg, [0, -0.02, 0.04]);
    const kg = at('shin' + s, 'legs');
    const kc = new THREE.SphereGeometry(0.075, 6, 4); kc.scale(1, 0.85, 0.8); mesh(flat(kc), M.steel, kg, [0, 0, 0.05]);
    mesh(taper(0.012, 0.14, 0.012, 0.08, 0.12, { anchor: 'center' }), M.steelD, kg, [sx * 0.07, 0, 0.02], [0, 0, sx * 0.25]);
    mesh(taper(0.112, 0.125, 0.135, 0.145, 0.46, { anchor: 'top' }), M.steel, kg);
    mesh(prism(8, 0.075, 0.075, 0.02, 'top'), M.bronze, kg, [0, -0.4, 0]);
    const fo = at('foot' + s, 'legs');
    for (let i = 0; i < 3; i++) mesh(taper(0.115, 0.08, 0.12, 0.08, 0.075, { anchor: 'top' }), M.steel, fo, [0, 0.01, 0.0 + i * 0.07]);
    mesh(taper(0.11, 0.07, 0.08, 0.05, 0.06, { anchor: 'top' }), M.steel, fo, [0, 0.0, 0.2]);
  }
  // blue-grey scarf around the gorget, its tail over the LEFT shoulder (echoing the old half-cloak)
  const COLS = 5, ROWS = 7;
  const sgeo = new THREE.PlaneGeometry(1, 1, COLS - 1, ROWS - 1);
  const scarf = mesh(sgeo, M.scarf, j.chest); scarf.frustumCulled = false; add('helm', scarf);
  j.vScarf = { COLS, ROWS, geo: sgeo, top: [[-0.02, 0.33, 0.13], [-0.12, 0.33, 0.1], [-0.2, 0.32, 0.02], [-0.17, 0.31, -0.1], [-0.04, 0.3, -0.14]] };
  updateScarf(j, 0, {});
  j.vRegions = R;
  return R;
}
export function updateScarf(j, t, o = {}) {
  const { COLS, ROWS, top, geo } = j.vScarf, p = geo.attributes.position;
  const len = o.len ?? 0.62, wind = o.wind ?? 0.4, back = o.back ?? 0.12;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, f = r / (ROWS - 1), tp = top[c]; const out = v3(tp[0], 0, tp[2]).normalize();
    const fl = Math.sin(t * 5.1 + c * 0.9 - r * 0.8) * wind * f * 0.22;
    p.setXYZ(i, tp[0] + out.x * f * 0.1 + fl * 0.4, tp[1] - f * len, tp[2] + out.z * f * 0.08 - back * f * f - Math.abs(fl) * 0.5 - wind * f * f * 0.3);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}

// Cael Vorn with BOTH armour sets on one rig; regions can be switched old -> new during the transformation.
export function buildCaelTransforming() {
  const j = buildKnight();
  // snapshot the old armour visuals per region (everything that is not a joint, the lantern or Vowbrand)
  const jointSet = new Set(JOINTS.map(n => j[n]));
  const OLD = { helm: [], chest: [], shoulders: [], arms: [], legs: [], cloak: [], tabard: [] };
  for (const [jn, region] of Object.entries(OLD_REGION)) for (const ch of j[jn].children) {
    if (jointSet.has(ch) || ch === j.lanternRoot || ch === j.sword) continue;
    if (ch.isMesh && ch.geometry === j.cloakData.geo) { OLD.cloak.push(ch); continue; }
    if (jn === 'pelvis' && ch.isGroup && ch !== j.lanternRoot && ch.position.y > 0.04 && Math.abs(ch.position.z) > 0.1) { OLD.tabard.push(ch); continue; }
    OLD[region].push(ch);
  }
  const M = vigilMaterials();
  const NEW = attachVigil(j, M);
  j.VM = M; j.OLD = OLD; j.NEW = NEW;
  // a sheathed twin of Vowbrand rides in the scabbard until it is drawn
  // dark mail coif worn under every helm (his face is never shown)
  const coifG = new THREE.SphereGeometry(0.115, 7, 5); coifG.scale(1, 1.3, 1.15); j.coif = mesh(flat(coifG), M.mail, j.head, [0, 0.13, -0.005]); j.coif.visible = false;
  j.sheathed = buildSword(j.M); j.vScabbard.add(j.sheathed); j.sheathed.position.set(0, -0.02, 0); j.sheathed.rotation.set(Math.PI, 0, 0);
  j.state = {};
  setArmor(j, { helm: 'old', chest: 'old', shoulders: 'old', arms: 'old', legs: 'old', cloak: true, tabard: true });
  return j;
}
export function setArmor(j, s) {
  for (const k of ['helm', 'chest', 'shoulders', 'arms', 'legs']) if (s[k]) { j.state[k] = s[k]; for (const o of j.OLD[k]) o.visible = s[k] === 'old'; for (const o of (j.NEW[k] || [])) o.visible = s[k] === 'new'; }
  if (s.cloak !== undefined) { j.state.cloak = s.cloak; for (const o of j.OLD.cloak) o.visible = s.cloak; }
  if (s.tabard !== undefined) { j.state.tabard = s.tabard; for (const o of j.OLD.tabard) o.visible = s.tabard; }
  if (s.sheathed !== undefined) { j.sheathed.visible = s.sheathed && j.state.chest === 'new'; j.sword.visible = !s.sheathed; }
}
// CANON from Episode 3 onward: Cael in the Vigil Plate, Vowbrand, lantern, and the Watchful Ember shield.
export function buildCaelVigil(o = {}) {
  const j = buildCaelTransforming();
  setArmor(j, { helm: 'new', chest: 'new', shoulders: 'new', arms: 'new', legs: 'new', cloak: false, tabard: false, sheathed: o.sheathed ?? false });
  j.shield = buildShield(j.VM);
  return j;
}
// Place the shield on the left forearm (or on the back), facing the knight's front.
export function placeShield(j, shield, mode = 'arm') {
  j.root.updateMatrixWorld(true);
  const q = new THREE.Quaternion(); j.chest.getWorldQuaternion(q);
  if (mode === 'arm') {
    const e = j.foreL.getWorldPosition(v3()), h = j.handL.getWorldPosition(v3());
    const mid = e.clone().lerp(h, 0.55);
    const fwd = v3(0, 0, 1).applyQuaternion(q), left = v3(-1, 0, 0).applyQuaternion(q);
    shield.position.copy(mid).addScaledVector(fwd, 0.07).addScaledVector(left, 0.05);
    const m = new THREE.Matrix4().lookAt(v3(0, 0, 0), fwd.clone().negate(), v3(0, 1, 0));
    shield.quaternion.setFromRotationMatrix(m).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12)));
  } else if (mode === 'back') {
    const c = j.chest.getWorldPosition(v3()); const back = v3(0, 0, -1).applyQuaternion(q);
    shield.position.copy(c).add(v3(0, 0.12, 0)).addScaledVector(back, 0.2);
    shield.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0.15)));
  }
}

// ---------------------------------------------------------------- the display: armour on an ancient stand
export function buildArmorStand(o = {}) {
  const d = { hip: 1.0, spineOff: 0.07, abd: 0.18, chestH: 0.3, neckH: 0.07, shW: 0.23, upper: 0.29, fore: 0.27, thigh: 0.46, shin: 0.46, hipW: 0.1 };
  const j = rig(d); const M = vigilMaterials();
  attachVigil(j, M);
  const wood = mat({ map: T('wood'), color: 0x6a5a50 });
  mesh(prism(6, 0.035, 0.035, 1.75), wood, j.root, [0, 0.0, -0.06]);
  mesh(box(0.5, 0.04, 0.04), wood, j.root, [0, 1.52, -0.06]);
  mesh(prism(8, 0.25, 0.3, 0.06), wood, j.root, [0, 0, -0.06]);
  applyPose(j, { armL: [0.05, 0, -0.18], armR: [0.05, 0, 0.18], foreL: [-0.15, 0, 0], foreR: [-0.15, 0, 0], neck: [0.05, 0, 0] });
  j.VM = M;
  return j;
}
