// WHAT IF YOU WERE BORN AS A DWARF? — characters. One protagonist on one rig (baby → child → warrior → king):
// a massive ginger beard with two side braids and a central braid, long braided ginger hair, thick brows, a serious face,
// riveted steel-and-leather armour over grey-green wool, a huge leather belt (hammer, pouch, a lens on a chain),
// heavy boots, a rune-engraved battle axe — and an absurdly oversized backside with spring physics.
// Plus the other dwarves, the orc king, and instanced crowds (orc horde, dwarf warriors, kneeling dwarves).
import { THREE, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { rig, applyPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { spikedPauldron, cleaver } from '/born-as-a-goblin/render/src/goblin.js';

// ---------------------------------------------------------------- textures
const cache = {};
export function TD(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const RUNES = (i, j, seed) => { const gi = Math.floor(i / 5), g = ((gi + seed) * 2654435761) >>> 0; const b = (g ^ (g >>> 13)) & 0x3f; const x = i % 5, y = j; if (x === 0) return false; return (x === 2 && y > 0 && y < 6) || (y === 1 && b & 1 && x > 1) || (y === 5 && b & 2) || (x === 1 && b & 4 && y < 4) || (x === 4 && b & 8 && y > 2) || (x + y === 5 && b & 16) || (x === y && b & 32); };
const MK = {
  dskin: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1401, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.62 + (n(i, j) - 0.5) * 0.14; return [C(v * 238), C(v * 168), C(v * 138)]; }); }),
  ginger: () => mk(16, 32, (x, w, h) => { const n = fbm(w, h, 1403, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.62 + (n(i, j) - 0.5) * 0.25 + (i % 3 === 0 ? -0.1 : 0) + (i % 5 === 2 ? 0.06 : 0); return [C(v * 235), C(v * 120), C(v * 58)]; }); }),
  braid: () => mk(16, 16, (x, w, h) => { pixels(x, w, h, (i, j) => { const k = (j + Math.abs(i - 7.5) * 0.9) % 6; const v = 0.55 + (k < 3 ? 0.12 : -0.08) + (k < 0.8 ? -0.14 : 0); return [C(v * 235), C(v * 118), C(v * 55)]; }); }),
  leather: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1405, [16, 8, 4]), m = fbm(w, h, 1407, [8, 4]); pixels(x, w, h, (i, j) => { let v = 0.4 + (n(i, j) - 0.5) * 0.25 + (m(i, j) > 0.62 ? 0.08 : 0); if ((i === 2 || i === w - 3) && j % 3 === 0) v -= 0.15; if (j === 1 || j === h - 2) v -= 0.06; return [C(v * 190), C(v * 128), C(v * 82)]; }); }),
  wool: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1409, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.48 + (n(i, j) - 0.5) * 0.15 + ((i + (j % 2)) % 2 ? 0.05 : -0.04); return [C(v * 150), C(v * 152), C(v * 122)]; }); }),
  trousers: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1411, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.45 + (n(i, j) - 0.5) * 0.16 + ((i + j) % 3 === 0 ? -0.04 : 0.02); return [C(v * 138), C(v * 140), C(v * 104)]; }); }),
  boot: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1413, [8, 4, 2]); pixels(x, w, h, (i, j) => { const v = 0.32 + (n(i, j) - 0.5) * 0.25; return [C(v * 175), C(v * 118), C(v * 78)]; }); }),
  plate: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1415, [16, 8, 4]); pixels(x, w, h, (i, j) => { let v = 0.6 + (n(i, j) - 0.5) * 0.22 - (j / h) * 0.08; const ri = (i === 3 || i === w - 4) && (j === 3 || j === h - 4 || j === 16); if (ri) v = 0.9; if (i === 0 || j === 0 || i === w - 1 || j === h - 1) v -= 0.18; return [C(v * 185), C(v * 188), C(v * 192)]; }); }),
  blade: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1417, [16, 8, 4]); pixels(x, w, h, (i, j) => { let v = 0.66 + (n(i, j) - 0.5) * 0.2; if (j > 20 && j < 28 && i > 8 && i < 56 && RUNES(i - 8, j - 21, 3)) v = 0.5; if (j > 32 && j < 40 && i > 14 && i < 50 && RUNES(i - 14, j - 33, 9)) v = 0.5; if (i > 56) v += 0.2; return [C(v * 200), C(v * 204), C(v * 210)]; }); }),
  diaper: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1419, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.66 + (n(i, j) - 0.5) * 0.1 + ((i + j) % 6 === 0 ? -0.06 : 0); return [C(v * 240), C(v * 228), C(v * 200)]; }); }),
  tunic: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1421, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.55 + (n(i, j) - 0.5) * 0.18; if (j > h - 3) return [C(200), C(160), C(80)]; return [C(v * 255), C(v * 255), C(v * 255)]; }); }),
  royal: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1423, [16, 8, 4]); pixels(x, w, h, (i, j) => { const v = 0.6 + (n(i, j) - 0.5) * 0.25; if (j > h - 5) { const g = 0.75 + n(i, j) * 0.25; return [C(g * 235), C(g * 185), C(g * 72)]; } return [C(v * 150), C(v * 30), C(v * 34)]; }); }),
  ermine: () => mk(16, 16, (x, w, h) => { pixels(x, w, h, (i, j) => { const spot = (i % 6 === 2 && j % 6 === 3); const v = spot ? 0.1 : 0.88; return [C(v * 245), C(v * 240), C(v * 232)]; }); }),
  gold: () => mk(16, 16, (x, w, h) => { const n = fbm(w, h, 1425, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.78 + (n(i, j) - 0.5) * 0.3 - (j / h) * 0.12; return [C(v * 255), C(v * 200), C(v * 82)]; }); }),
  oskin: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1427, [8, 4, 2]), m = fbm(w, h, 1429, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.46 + (n(i, j) - 0.5) * 0.28 + (m(i, j) > 0.6 ? -0.06 : 0); return [C(v * 140), C(v * 165), C(v * 100)]; }); }),
};

export function dwarfMaterials(o = {}) {
  return {
    skin: mat({ map: TD('dskin'), rim: 0.8, wrap: 0.6 }), hair: mat({ map: TD('ginger'), color: o.hair ?? 0xffffff, rim: 1, wrap: 0.7 }), hairD: mat({ map: TD('ginger'), color: o.hair ?? 0xffffff, rim: 1, wrap: 0.7, side: THREE.DoubleSide }),
    braid: mat({ map: TD('braid'), color: o.hair ?? 0xffffff, rim: 1, wrap: 0.7 }), leather: mat({ map: TD('leather'), color: o.leather ?? 0xffffff, rim: 1, wrap: 0.5 }), leatherD: mat({ map: TD('leather'), rim: 1, wrap: 0.5, side: THREE.DoubleSide }),
    wool: mat({ map: TD('wool'), color: o.wool ?? 0xffffff, rim: 0.8, wrap: 0.6 }), trousers: mat({ map: TD('trousers'), color: o.trousers ?? 0xffffff, rim: 1, wrap: 0.6 }),
    boot: mat({ map: TD('boot'), rim: 1 }), plate: mat({ map: TD('plate'), color: o.plate ?? 0xffffff, rim: 1 }), steel: mat({ map: T('iron'), color: 0xd0d0d4, rim: 1 }), dark: mat({ map: T('iron'), color: 0x707074, rim: 1 }),
    blade: mat({ map: TD('blade'), color: 0x9a9ea6, rim: 0.6 }), wood: mat({ map: T('wood'), color: 0xa88a68 }), brass: mat({ map: T('brass'), color: 0xffe0b0 }), eye: mat({ color: 0x1a1410, unlit: true }), glass: mat({ color: 0xc8e0e8, emissive: 0x304048, rim: 1 }),
    diaper: mat({ map: TD('diaper'), rim: 1, wrap: 0.7 }), tunic: mat({ map: TD('tunic'), color: o.tunic ?? 0x4a7a40, rim: 1, wrap: 0.6 }), tunicD: mat({ map: TD('tunic'), color: o.tunic ?? 0x4a7a40, rim: 1, wrap: 0.6, side: THREE.DoubleSide }),
    gold: mat({ map: TD('gold'), rim: 1 }), gem: mat({ color: 0xd02020, emissive: 0x600808, unlit: true }), gemB: mat({ color: 0x3080ff, emissive: 0x081860, unlit: true }), royal: mat({ map: TD('royal'), rim: 1, side: THREE.DoubleSide, wrap: 0.8 }), ermine: mat({ map: TD('ermine'), rim: 1, side: THREE.DoubleSide }),
  };
}

// ---------------------------------------------------------------- the rune axe and hammers
export function buildAxe(M, s = 1) {
  const g = new THREE.Group();
  mesh(prism(6, 0.024 * s, 0.026 * s, 1.18 * s), M.wood, g, [0, -0.1 * s, 0]);                      // haft (grip at origin)
  for (const y of [-0.06, 0.06, 0.18]) mesh(prism(6, 0.03 * s, 0.03 * s, 0.05 * s), M.leather, g, [0, y * s, 0]);
  mesh(flat(new THREE.OctahedronGeometry(0.045 * s, 0)), M.steel, g, [0, -0.12 * s, 0], [0, 0, 0], [1, 1.4, 1]);
  const top = 1.08 * s; mesh(box(0.08 * s, 0.16 * s, 0.07 * s), M.dark, g, [0, top, 0]);
  const sh = new THREE.Shape(); // a broad bearded blade
  sh.moveTo(0, 0.07); sh.lineTo(0.16, 0.12); sh.quadraticCurveTo(0.31, 0.2, 0.36, 0.3); sh.quadraticCurveTo(0.42, 0.0, 0.36, -0.3); sh.quadraticCurveTo(0.28, -0.2, 0.18, -0.24); sh.lineTo(0.12, -0.12); sh.lineTo(0, -0.07); sh.closePath();
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: false, curveSegments: 3 }); bg.translate(0, 0, -0.011); bg.scale(s, s, s);
  const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.4 + 0.1, uv.getY(i) * 1.6 + 0.5);
  g.userData.blade = mesh(flat(bg), M.blade, g, [0.03 * s, top, 0]);
  mesh(prism(4, 0.04 * s, 0.0, 0.16 * s), M.dark, g, [-0.04 * s, top, 0], [0, 0, Math.PI / 2]);   // back spike
  mesh(prism(4, 0.025 * s, 0.0, 0.1 * s), M.dark, g, [0, top + 0.08 * s, 0]);
  g.userData.head = v3(0.25 * s, top, 0);
  return g;
}
export function buildHammer(M, s = 1, big = false) {
  const g = new THREE.Group();
  mesh(prism(6, 0.018 * s, 0.02 * s, 0.42 * s), M.wood, g, [0, -0.06 * s, 0]);
  mesh(box((big ? 0.2 : 0.15) * s, 0.08 * s, 0.08 * s), M.dark, g, [0, 0.38 * s, 0]);
  mesh(box(0.03 * s, 0.07 * s, 0.07 * s), M.steel, g, [(big ? 0.1 : 0.075) * s, 0.38 * s, 0]);
  return g;
}

// ---------------------------------------------------------------- the protagonist
// stage: 'baby' | 'child' | 'warrior' | 'king'
export function buildDwarf(stage = 'warrior', o = {}) {
  if (stage === 'baby') return buildBaby(o);
  const M = dwarfMaterials(o); const child = stage === 'child', king = stage === 'king';
  const k = child ? 0.7 : 1;  // body scale (the child also gets a bigger head)
  const d = { hip: 0.52 * k, spineOff: 0.05 * k, abd: 0.18 * k, chestH: 0.3 * k, neckH: 0.05 * k, shW: 0.25 * k, upper: 0.27 * k, fore: 0.25 * k, thigh: 0.24 * k, shin: 0.22 * k, hipW: 0.11 * k };
  const j = rig(d); j.stage = stage; j.M = M; j.hipH = d.hip; j.k = k;
  // hips and the legendary backside
  mesh(taper(0.4 * k, 0.3 * k, 0.44 * k, 0.32 * k, 0.2 * k, { anchor: 'center' }), M.trousers, j.pelvis, [0, 0.0, 0]);
  j.butt = group(j.pelvis, [0, -0.01 * k, -0.1 * k]);
  const cr = (child ? 0.2 : 0.25) * (o.butt ?? 1);
  for (const [s, nm] of [[-1, 'cheekL'], [1, 'cheekR']]) {
    const geo = flat(new THREE.IcosahedronGeometry(cr, 1));
    const c = mesh(geo, M.trousers, j.butt, [s * cr * 0.56, 0, -cr * 0.52], [0, 0, 0], [1, 0.95, 0.92]);
    c.userData.y = 0; c.userData.s = [1, 0.95, 0.92]; j[nm] = c;
  }
  j.jigK = cr / 0.25;
  // belly and chest: leather jerkin over wool, riveted steel plates
  mesh(taper(0.46 * k, 0.36 * k, 0.5 * k, 0.37 * k, 0.18 * k), child ? M.tunic : M.leather, j.spine);
  mesh(taper(0.52 * k, 0.37 * k, 0.6 * k, 0.38 * k, 0.3 * k), child ? M.tunic : M.leather, j.chest);
  if (!child) {
    mesh(box(0.3, 0.2, 0.03), king ? M.gold : M.plate, j.chest, [0, 0.13, 0.19]);              // chest plate
    mesh(box(0.34, 0.12, 0.03), king ? M.gold : M.plate, j.spine, [0, 0.09, 0.185]);            // belly plate
    for (const sx of [-1, 1]) mesh(box(0.06, 0.28, 0.035), M.leather, j.chest, [sx * 0.2, 0.14, 0.185], [0, 0, sx * 0.25]);  // straps
    mesh(box(0.56, 0.05, 0.36), M.leather, j.chest, [0, 0.29, 0]);                                // collar
  }
  // the huge belt: steel buckle, cross strap, hammer, pouch, a lens on a chain
  mesh(box(0.5 * k, 0.1 * k, 0.4 * k), M.leather, j.pelvis, [0, 0.1 * k, 0]);
  mesh(box(0.11 * k, 0.09 * k, 0.03 * k), M.steel, j.pelvis, [-0.03 * k, 0.1 * k, 0.205 * k]); mesh(box(0.06 * k, 0.05 * k, 0.035 * k), M.leather, j.pelvis, [-0.03 * k, 0.1 * k, 0.21 * k]);
  mesh(box(0.07 * k, 0.26 * k, 0.03 * k), M.leather, j.pelvis, [0.05 * k, -0.02 * k, 0.205 * k], [0, 0, -0.25]);       // hanging strap
  if (!child) {
    const hm = buildHammer(M, 0.8); hm.position.set(-0.24, 0.02, 0.1); hm.rotation.set(0, 0, 0.12); j.pelvis.add(hm);
    mesh(box(0.1, 0.12, 0.07, 'top'), M.leather, j.pelvis, [0.25, 0.1, 0.08]);                       // pouch
    const lens = group(j.pelvis, [0.12, -0.02, 0.215]); mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10), M.brass, lens); mesh(new THREE.CircleGeometry(0.03, 10), M.glass, lens, [0, 0, 0.002]); mesh(box(0.006, 0.08, 0.006, 'bottom'), M.brass, lens, [0, 0.035, 0]);
    // front tassets: leather flaps with steel plates (front and sides only — the back stays gloriously uncovered)
    for (const [x, ry] of [[-0.12, 0.15], [0.12, -0.15], [-0.23, 1.0], [0.23, -1.0]]) { const f = group(j.pelvis, [x, 0.06, 0.14], [0, ry, 0]); mesh(box(0.15, 0.24, 0.02, 'top'), M.leather, f); mesh(box(0.11, 0.12, 0.025, 'top'), king ? M.gold : M.plate, f, [0, -0.08, 0.005]); }
  } else {
    mesh(taper(0.5 * k, 0.4 * k, 0.48 * k, 0.38 * k, 0.12 * k, { anchor: 'top' }), M.tunicD, j.pelvis, [0, 0.07 * k, 0.03 * k]); // tunic skirt (front)
  }
  // neck and head: big nose, thick ginger brows, serious face, ears
  mesh(prism(8, 0.08 * k, 0.075 * k, 0.07 * k), M.skin, j.neck);
  const hk = child ? 0.85 : 1;
  const H = group(j.head, [0, 0, 0], [0, 0, 0]); H.scale.setScalar(hk); j.face = H;
  mesh(box(0.2, 0.22, 0.21, 'bottom'), M.skin, H, [0, 0, 0.01]);
  mesh(flat(new THREE.IcosahedronGeometry(0.045, 0)), M.skin, H, [0, 0.085, 0.125], [0, 0, 0], [0.9, 1.0, 0.85]);  // bulbous nose
  mesh(prism(4, 0.03, 0.02, 0.06), M.skin, H, [0, 0.1, 0.115], [0.4, Math.PI / 4, 0]);
  j.eyes = []; for (const sx of [-1, 1]) {
    j.eyes.push(mesh(box(0.034, 0.016, 0.01), M.eye, H, [sx * 0.048, 0.128, 0.115]));
    const brow = mesh(box(0.07, 0.03, 0.04), M.hair, H, [sx * 0.05, 0.152, 0.112], [0.15, 0, -sx * 0.22]); (j.brows ||= []).push(brow);  // thick, stern
    mesh(box(0.03, 0.06, 0.04), M.skin, H, [sx * 0.105, 0.11, 0.0]);                                   // ears
  }
  // ginger hair: cap, sides, long braid down the back
  mesh(taper(0.22, 0.23, 0.18, 0.19, 0.06), M.hair, H, [0, 0.2, 0]);
  mesh(taper(0.23, 0.12, 0.22, 0.1, 0.24, { anchor: 'top' }), M.hairD, H, [0, 0.24, -0.08]);
  for (const sx of [-1, 1]) mesh(box(0.03, 0.14, 0.16), M.hair, H, [sx * 0.11, 0.17, -0.02]);
  const braidB = group(H, [0, 0.04, -0.12], [0.25, 0, 0]); j.backBraid = braidB;
  for (let i = 0; i < 6; i++) mesh(prism(6, 0.034 - i * 0.003, 0.03 - i * 0.003, 0.07, 'top'), M.braid, braidB, [0, -i * 0.065, -i * 0.012]);
  mesh(prism(6, 0.022, 0.022, 0.03, 'top'), M.steel, braidB, [0, -0.39, -0.07]);
  // the massive braided beard
  const beard = group(H, [0, 0.045, 0.125], [-0.3, 0, 0]); j.beard = beard;
  const bs = child ? 0.55 : 1;
  mesh(taper(0.16 * bs + 0.12, 0.13, 0.23, 0.12, 0.16 * bs + 0.04, { anchor: 'top' }), M.hairD, beard, [0, 0.015, -0.005]);     // cheeks and chin mass
  mesh(taper(0.1 * bs + 0.1, 0.06, 0.2, 0.06, 0.12 * bs + 0.02, { anchor: 'top' }), M.hair, beard, [0, -0.02, 0.06]);
  for (const sx of [-1, 1]) mesh(taper(0.02, 0.03, 0.06, 0.04, 0.11, { anchor: 'top', ox: sx * 0.05 }), M.hair, beard, [sx * 0.035, 0.02, 0.08], [0, 0, sx * 0.4]); // moustache
  if (!child) {
    const mainB = group(beard, [0, -0.2, 0.02]); j.mainBraid = mainB;            // central braid to the belly
    for (let i = 0; i < 6; i++) mesh(prism(6, 0.05 - i * 0.004, 0.046 - i * 0.004, 0.065, 'top'), M.braid, mainB, [0, -i * 0.06, 0.01 * i]);
    mesh(prism(6, 0.034, 0.034, 0.035, 'top'), M.steel, mainB, [0, -0.11, 0.012]); mesh(prism(6, 0.024, 0.02, 0.05, 'top'), M.hair, mainB, [0, -0.36, 0.06]);
    j.sideBraids = [];
    for (const sx of [-1, 1]) { const sb = group(beard, [sx * 0.105, -0.13, 0.01], [0, 0, sx * 0.08]); j.sideBraids.push(sb); for (let i = 0; i < 5; i++) mesh(prism(6, 0.028 - i * 0.002, 0.026 - i * 0.002, 0.055, 'top'), M.braid, sb, [0, -i * 0.05, 0.004 * i]); mesh(prism(6, 0.02, 0.02, 0.025, 'top'), M.steel, sb, [0, -0.1, 0.006]); }
  } else {
    for (const sx of [-1, 1]) { const sb = group(H, [sx * 0.105, 0.14, -0.02]); for (let i = 0; i < 3; i++) mesh(prism(6, 0.022, 0.02, 0.05, 'top'), M.braid, sb, [0, -i * 0.045, 0]); }
  }
  // arms: wool sleeves, layered steel-and-leather pauldrons, leather bracers, big hands
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? -1 : 1;
    mesh(taper(0.14 * k, 0.14 * k, 0.16 * k, 0.16 * k, d.upper, { anchor: 'top' }), child ? M.tunic : M.wool, j['arm' + s]);
    mesh(taper(0.12 * k, 0.12 * k, 0.15 * k, 0.15 * k, d.fore, { anchor: 'top' }), child ? M.wool : M.wool, j['fore' + s]);
    if (!child) {
      const pg = group(j['arm' + s], [sx * 0.02, 0.04, 0]); mesh(taper(0.24, 0.22, 0.2, 0.2, 0.08, { anchor: 'top' }), M.leather, pg); mesh(taper(0.22, 0.21, 0.17, 0.17, 0.06, { anchor: 'top' }), king ? M.gold : M.plate, pg, [sx * 0.01, 0.04, 0]);
      mesh(taper(0.2, 0.2, 0.18, 0.19, 0.08, { anchor: 'top' }), M.leather, pg, [sx * 0.02, -0.06, 0]);
      mesh(taper(0.15, 0.15, 0.17, 0.17, 0.15, { anchor: 'top' }), M.leather, j['fore' + s], [0, -0.07, 0]);                  // bracer
      mesh(box(0.175, 0.025, 0.175), M.steel, j['fore' + s], [0, -0.1, 0]);
    }
    mesh(box(0.1 * k, 0.1 * k, 0.1 * k, 'top'), M.skin, j['hand' + s], [0, 0.01, 0]);
    for (let f = -1; f <= 1; f++) mesh(box(0.024 * k, 0.05 * k, 0.026 * k, 'top'), M.skin, j['hand' + s], [f * 0.028 * k, -0.08 * k, 0.025 * k]);
    mesh(box(0.025 * k, 0.045 * k, 0.025 * k, 'top'), M.skin, j['hand' + s], [-sx * 0.05 * k, -0.04 * k, 0.04 * k], [0.3, 0, 0]);
    // legs: wide wool trousers, tall heavy boots
    mesh(taper(0.15 * k, 0.17 * k, 0.2 * k, 0.21 * k, d.thigh, { anchor: 'top' }), M.trousers, j['thigh' + s]);
    mesh(taper(0.15 * k, 0.17 * k, 0.17 * k, 0.19 * k, d.shin, { anchor: 'top' }), M.boot, j['shin' + s]);
    mesh(box(0.19 * k, 0.04 * k, 0.21 * k), M.boot, j['shin' + s], [0, -0.03 * k, 0]);                                          // boot cuff
    mesh(taper(0.16 * k, 0.24 * k, 0.15 * k, 0.2 * k, 0.07 * k, { anchor: 'top', oz: 0.03 * k }), M.boot, j['foot' + s], [0, 0.01 * k, 0.05 * k]);
  }
  // the axe (a separate object so it can be carried, worn on the back or swung)
  j.axe = buildAxe(M, child ? 0.6 : 1);
  if (king) {
    const cr2 = group(H, [0, 0.255, 0]); j.crown = cr2;
    mesh(prism(10, 0.13, 0.125, 0.06, 'bottom', true), M.gold, cr2);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mesh(prism(4, 0.024, 0.0, 0.08), M.gold, cr2, [Math.sin(a) * 0.125, 0.05, Math.cos(a) * 0.125]); }
    mesh(flat(new THREE.OctahedronGeometry(0.024, 0)), M.gem, cr2, [0, 0.035, 0.13]); for (const sx of [-1, 1]) mesh(flat(new THREE.OctahedronGeometry(0.016, 0)), M.gemB, cr2, [sx * 0.09, 0.035, 0.095]);
    // a short royal mantle with an ermine collar (it stops at the shoulder blades — nothing hides the legend)
    mesh(new THREE.TorusGeometry(0.25, 0.055, 4, 12), M.ermine, j.chest, [0, 0.3, 0], [Math.PI / 2, 0, 0], [1.15, 0.8, 1]);
    mesh(taper(0.58, 0.06, 0.66, 0.06, 0.34, { anchor: 'top' }), M.royal, j.chest, [0, 0.31, -0.2], [0.12, 0, 0]);
  }
  applyPose(j, { hipY: d.hip });
  return j;
}
function buildBaby(o = {}) {
  const M = dwarfMaterials(o); const root = new THREE.Group(); const j = { root, stage: 'baby', M };
  // lying on its tummy: swaddled body, big head turned to the side, a tiny ginger beard — and a colossal diapered rump
  const body = group(root, [0, 0.09, 0]); j.body = body;
  mesh(flat(new THREE.IcosahedronGeometry(0.1, 1)), M.tunic, body, [0, 0, 0.06], [0, 0, 0], [1, 0.8, 1.3]);
  const head = group(body, [0, 0.03, 0.2], [0, 0.6, 0]); j.head = head;
  mesh(flat(new THREE.IcosahedronGeometry(0.085, 1)), M.skin, head, [0, 0.0, 0], [0, 0, 0], [1, 0.95, 1]);
  mesh(flat(new THREE.IcosahedronGeometry(0.02, 0)), M.skin, head, [0, -0.005, 0.085]);
  for (const sx of [-1, 1]) { mesh(box(0.022, 0.01, 0.008), M.eye, head, [sx * 0.03, 0.02, 0.078]); mesh(box(0.035, 0.014, 0.02), M.hair, head, [sx * 0.03, 0.038, 0.075], [0, 0, -sx * 0.25]); }
  mesh(taper(0.07, 0.04, 0.035, 0.025, 0.06, { anchor: 'top' }), M.hairD, head, [0, -0.03, 0.07], [0.5, 0, 0]);    // tiny beard
  mesh(taper(0.04, 0.04, 0.01, 0.01, 0.05), M.hair, head, [0, 0.075, 0.0], [0.3, 0, 0]);                          // a single ginger curl
  for (const sx of [-1, 1]) { const a = group(body, [sx * 0.09, 0.0, 0.12], [0.9, 0, sx * 0.4]); mesh(taper(0.05, 0.05, 0.045, 0.045, 0.09, { anchor: 'top' }), M.tunic, a); mesh(flat(new THREE.IcosahedronGeometry(0.028, 0)), M.skin, a, [0, -0.1, 0]); (j.arms ||= []).push(a); }
  j.butt = group(body, [0, 0.02, -0.1]);
  for (const [s, nm] of [[-1, 'cheekL'], [1, 'cheekR']]) { const c = mesh(flat(new THREE.IcosahedronGeometry(0.15, 1)), M.diaper, j.butt, [s * 0.085, 0.05, -0.06], [0, 0, 0], [1, 0.95, 0.92]); c.userData.y = 0.05; c.userData.s = [1, 0.95, 0.92]; j[nm] = c; }
  j.jigK = 0.6;
  j.legs = []; for (const sx of [-1, 1]) { const l = group(j.butt, [sx * 0.07, -0.02, -0.18], [-0.4, 0, 0]); mesh(taper(0.05, 0.05, 0.055, 0.055, 0.09, { anchor: 'top' }), M.skin, l); mesh(box(0.055, 0.035, 0.07), M.skin, l, [0, -0.1, 0.02]); j.legs.push(l); }
  return j;
}

// ---------------------------------------------------------------- backside physics (analytic, so every frame renders independently)
// walk phase ph in cycles (one cycle = two steps); amp ~1 walk, ~1.8 run
export function jigWalk(ph, amp = 1) {
  const a = ph * Math.PI * 2;
  return { sway: Math.sin(a - 0.8) * amp, bL: Math.sin(a - 1.2) * amp, bR: Math.sin(a + Math.PI - 1.2) * amp, bounce: (Math.sin(2 * a - 1.5) * 0.8 + 0.3 * Math.sin(3 * a + 0.4)) * amp };
}
// a damped spring kick at t0 (landing, impact, sitting down)
export function jigKick(t, t0, amp = 1, f = 4.2, d = 3.0) { if (t < t0) return 0; const u = t - t0; return amp * Math.exp(-d * u) * Math.sin(2 * Math.PI * f * u); }
export function jigAdd(...ss) { const o = { sway: 0, bL: 0, bR: 0, bounce: 0, pitch: 0 }; for (const s of ss) for (const k in s) o[k] = (o[k] ?? 0) + s[k]; return o; }
export function setJiggle(j, s = {}) {
  const b = j.butt, k = j.jigK ?? 1; if (!b) return;
  const sway = s.sway ?? 0, bo = s.bounce ?? 0;
  b.rotation.set((s.pitch ?? 0) * 0.25, (s.twist ?? 0) * 0.2, sway * 0.2);
  b.position.x = sway * 0.035 * k;
  for (const [c, v] of [[j.cheekL, s.bL ?? 0], [j.cheekR, s.bR ?? 0]]) {
    c.position.y = c.userData.y + (v * 0.04 + bo * 0.028) * k; c.rotation.set(v * 0.2, 0, 0);
    const sq = clamp(bo * 0.13 + v * 0.05, -0.3, 0.3); const sc = c.userData.s;
    c.scale.set(sc[0] * (1 + sq * 0.55), sc[1] * (1 - sq), sc[2] * (1 + sq * 0.45));
  }
}
// waddling dwarf walk (low hips, rolling pelvis); runs with o.run
export function dWalk(ph, o = {}) {
  const a = ph * Math.PI * 2, s = Math.sin(a), run = o.run ?? 0, k = o.k ?? 1;
  const p = walkPose(ph, { stride: (o.stride ?? 0.55) + run * 0.25, hunch: (o.hunch ?? 0.05) + run * 0.2, hip: o.hip ?? 0.52 * k });
  p.pelvis = [run * 0.1, s * 0.12, Math.sin(a) * (0.09 + run * 0.05)];
  p.chest = [0.02 + run * 0.1, -s * 0.1, -Math.sin(a) * 0.05];
  p.hipY -= Math.abs(Math.cos(a)) * 0.02 * (1 + run);
  p.armL = [s * (0.4 + run * 0.6), 0, -0.25]; p.armR = [-s * (0.4 + run * 0.6), 0, 0.25]; p.foreL = [-0.3 - run * 0.8, 0, 0]; p.foreR = [-0.3 - run * 0.8, 0, 0];
  return p;
}
export function dStand(o = {}) { return { hipY: o.hip ?? 0.52, armL: [0.05, 0, -0.22], armR: [0.05, 0, 0.22], foreL: [-0.2, 0, 0], foreR: [-0.2, 0, 0], spine: [0.02, 0, 0], neck: [-0.04, 0, 0], thighL: [0, 0, -0.06], thighR: [0, 0, 0.06] }; }
// hold the axe in the right hand (dir: blade-up axis in world space, optional)
export function holdAxe(j, o = {}) {
  const a = j.axe; if (a.parent !== j.handR) { j.handR.add(a); }
  a.position.set(0, -0.06, 0.02); a.rotation.set(o.rx ?? (Math.PI / 2), o.ry ?? 0, o.rz ?? 0); a.scale.setScalar(1 / (j.k ?? 1));
}
export function axeOnBack(j) { const a = j.axe; if (a.parent !== j.chest) j.chest.add(a); a.position.set(-0.08, -0.32, -0.25); a.rotation.set(0, 0, -0.55); a.scale.setScalar(1 / (j.k ?? 1)); }

// ---------------------------------------------------------------- the other dwarves (parents, children, smiths, warriors, the drill master)
const BEARDS = [0x8a5a34, 0x3a2a22, 0xc8c0b4, 0xd8b070, 0x6a4028, 0x9a9088];
export function buildDwarfNPC(o = {}) {
  const r = rng(o.seed ?? 1); const beardC = o.beard ?? BEARDS[Math.floor(r() * BEARDS.length)];
  const M = dwarfMaterials({ hair: beardC, tunic: o.tunic ?? [0x4a6a8a, 0x8a3a30, 0x6a7a3a, 0x7a5a3a][Math.floor(r() * 4)], leather: o.leather, trousers: o.trousers ?? 0xc8c0b0 });
  const k = o.child ? 0.7 : 1, fem = !!o.female;
  const d = { hip: 0.52 * k, spineOff: 0.05 * k, abd: 0.18 * k, chestH: 0.3 * k, neckH: 0.05 * k, shW: 0.25 * k, upper: 0.27 * k, fore: 0.25 * k, thigh: 0.24 * k, shin: 0.22 * k, hipW: 0.11 * k };
  const j = rig(d); j.M = M; j.k = k; j.hipH = d.hip;
  const top = o.armor ? M.leather : M.tunic;
  mesh(taper(0.4 * k, 0.3 * k, 0.44 * k, 0.32 * k, 0.2 * k, { anchor: 'center' }), fem ? M.tunic : M.trousers, j.pelvis);
  mesh(taper(0.44 * k, 0.34 * k, 0.48 * k, 0.36 * k, 0.18 * k), top, j.spine); mesh(taper(0.5 * k, 0.35 * k, 0.56 * k, 0.36 * k, 0.3 * k), top, j.chest);
  if (o.armor) { mesh(box(0.3, 0.2, 0.03), M.plate, j.chest, [0, 0.13, 0.185]); mesh(box(0.56, 0.05, 0.36), M.leather, j.chest, [0, 0.29, 0]); }
  if (o.apron) mesh(box(0.36 * k, 0.5 * k, 0.03), M.leather, j.chest, [0, -0.08 * k, 0.19 * k]);
  if (fem) mesh(taper(0.62 * k, 0.5 * k, 0.44 * k, 0.34 * k, 0.48 * k, { anchor: 'top' }), M.tunicD, j.pelvis, [0, 0.08 * k, 0]);
  mesh(box(0.48 * k, 0.08 * k, 0.38 * k), M.leather, j.pelvis, [0, 0.1 * k, 0]); mesh(box(0.08 * k, 0.07 * k, 0.03 * k), M.brass, j.pelvis, [0, 0.1 * k, 0.195 * k]);
  mesh(prism(8, 0.08 * k, 0.075 * k, 0.07 * k), M.skin, j.neck);
  const H = group(j.head); H.scale.setScalar(o.child ? 0.85 : 1); j.face = H;
  mesh(box(0.2, 0.22, 0.21, 'bottom'), M.skin, H, [0, 0, 0.01]);
  mesh(flat(new THREE.IcosahedronGeometry(fem ? 0.03 : 0.042, 0)), M.skin, H, [0, 0.085, 0.122]);
  j.eyes = []; j.brows = [];
  for (const sx of [-1, 1]) { j.eyes.push(mesh(box(0.032, 0.016, 0.01), M.eye, H, [sx * 0.048, 0.128, 0.115])); j.brows.push(mesh(box(0.065, 0.024, 0.035), M.hair, H, [sx * 0.05, 0.152, 0.11], [0.1, 0, -sx * 0.12])); mesh(box(0.03, 0.06, 0.04), M.skin, H, [sx * 0.105, 0.11, 0]); }
  mesh(taper(0.22, 0.23, 0.18, 0.19, 0.06), M.hair, H, [0, 0.2, 0]); mesh(taper(0.23, 0.12, 0.22, 0.1, 0.22, { anchor: 'top' }), M.hairD, H, [0, 0.24, -0.08]);
  if (fem) { for (const sx of [-1, 1]) { const b = group(H, [sx * 0.11, 0.16, -0.02]); for (let i = 0; i < 5; i++) mesh(prism(6, 0.026, 0.024, 0.06, 'top'), M.braid, b, [0, -i * 0.055, 0.01 * i]); } }
  else if (!o.child || r() < 2) {
    const beard = group(H, [0, 0.045, 0.125], [-0.22, 0, 0]); j.beard = beard; const bl = o.child ? 0.06 : 0.16 + r() * 0.16;
    mesh(taper(0.12, 0.08, 0.22, 0.12, bl + 0.05, { anchor: 'top' }), M.hairD, beard, [0, 0.02, 0]);
    for (const sx of [-1, 1]) mesh(taper(0.02, 0.03, 0.06, 0.04, 0.1, { anchor: 'top', ox: sx * 0.05 }), M.hair, beard, [sx * 0.035, 0.055, 0.04], [0, 0, sx * 0.4]);
  }
  if (o.helmet) { const hg = group(H, [0, 0.2, 0]); mesh(prism(8, 0.135, 0.06, 0.14), M.steel, hg); mesh(prism(8, 0.14, 0.14, 0.03), M.dark, hg); mesh(box(0.03, 0.1, 0.03, 'top'), M.steel, hg, [0, 0.0, 0.135]); if (o.horns) for (const sx of [-1, 1]) mesh(prism(5, 0.03, 0.005, 0.16), M.diaper, hg, [sx * 0.13, 0.05, 0], [0, 0, -sx * 0.8]); }
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? -1 : 1;
    mesh(taper(0.14 * k, 0.14 * k, 0.16 * k, 0.16 * k, d.upper, { anchor: 'top' }), o.armor ? M.wool : M.tunic, j['arm' + s]); mesh(taper(0.12 * k, 0.12 * k, 0.14 * k, 0.14 * k, d.fore, { anchor: 'top' }), M.wool, j['fore' + s]);
    if (o.armor) mesh(taper(0.22, 0.21, 0.17, 0.17, 0.07, { anchor: 'top' }), M.plate, j['arm' + s], [sx * 0.01, 0.06, 0]);
    mesh(box(0.095 * k, 0.1 * k, 0.1 * k, 'top'), M.skin, j['hand' + s], [0, 0.01, 0]);
    mesh(taper(0.15 * k, 0.16 * k, 0.18 * k, 0.19 * k, d.thigh, { anchor: 'top' }), fem ? M.tunic : M.trousers, j['thigh' + s]);
    mesh(taper(0.14 * k, 0.16 * k, 0.16 * k, 0.18 * k, d.shin, { anchor: 'top' }), M.boot, j['shin' + s]);
    mesh(taper(0.15 * k, 0.22 * k, 0.14 * k, 0.18 * k, 0.07 * k, { anchor: 'top', oz: 0.03 * k }), M.boot, j['foot' + s], [0, 0.01 * k, 0.05 * k]);
  }
  applyPose(j, { hipY: d.hip });
  return j;
}

// ---------------------------------------------------------------- the orc king
export function buildOrcKing() {
  const M = { skin: mat({ map: TD('oskin'), rim: 1, wrap: 0.5 }), iron: mat({ map: T('iron'), rim: 1, color: 0xb0b0b4 }), darkIron: mat({ map: T('iron'), rim: 1, color: 0x6a6a70 }), bone: mat({ map: T('bone'), rim: 1, color: 0xf0e8d0 }),
    leather: mat({ map: TD('leather'), rim: 1, color: 0x8a6a5a }), leatherD: mat({ map: TD('leather'), side: THREE.DoubleSide, color: 0x6a4a40 }), eye: mat({ color: 0xffd020, emissive: 0xffa010, unlit: true }), dark: mat({ color: 0x100604, unlit: true }), wood: mat({ map: T('wood') }), gold: mat({ map: TD('gold') }),
    fur: mat({ map: TD('trousers'), color: 0x6a5a4a, rim: 1, side: THREE.DoubleSide }), red: mat({ map: TD('royal'), color: 0xc0a0a0, side: THREE.DoubleSide, wrap: 0.8 }) };
  const d = { hip: 0.95, spineOff: 0.1, abd: 0.3, chestH: 0.44, neckH: 0.06, shW: 0.42, upper: 0.5, fore: 0.48, thigh: 0.45, shin: 0.45, hipW: 0.2 };
  const j = rig(d); j.M = M;
  mesh(taper(0.64, 0.48, 0.6, 0.46, 0.26, { anchor: 'center' }), M.skin, j.pelvis);
  mesh(taper(0.7, 0.62, 0.78, 0.56, 0.32), M.skin, j.spine);
  mesh(taper(0.88, 0.52, 0.98, 0.52, 0.44), M.skin, j.chest);
  mesh(box(0.7, 0.34, 0.06), M.darkIron, j.chest, [0, 0.2, 0.26]); for (let i = 0; i < 4; i++) mesh(prism(4, 0.025, 0, 0.09), M.iron, j.chest, [-0.24 + i * 0.16, 0.36, 0.29], [0.5, 0, 0]);
  mesh(prism(6, 0.15, 0.13, 0.1), M.skin, j.neck);
  const H = group(j.head); j.face = H;
  mesh(taper(0.26, 0.26, 0.22, 0.22, 0.26), M.skin, H, [0, -0.02, 0.06]);
  j.jaw = group(H, [0, 0.03, 0.12]); mesh(taper(0.3, 0.18, 0.26, 0.14, 0.11, { anchor: 'top' }), M.skin, j.jaw, [0, 0.0, 0.05]);
  mesh(box(0.24, 0.05, 0.1), M.dark, j.jaw, [0, -0.04, 0.06]);
  for (const sx of [-1, 1]) { mesh(prism(4, 0.03, 0.0, 0.14), M.bone, j.jaw, [sx * 0.1, 0.0, 0.12]); mesh(box(0.05, 0.022, 0.02), M.eye, H, [sx * 0.065, 0.16, 0.19]); mesh(box(0.08, 0.03, 0.05), M.skin, H, [sx * 0.065, 0.185, 0.18], [0, 0, sx * 0.3]); mesh(prism(4, 0.05, 0.0, 0.14), M.skin, H, [sx * 0.15, 0.14, 0.03], [0, 0, -sx * 1.3]); }
  // a crown of bones and black iron
  const cr = group(H, [0, 0.24, 0.05]); mesh(prism(8, 0.16, 0.16, 0.06, 'bottom', true), M.darkIron, cr);
  for (let i = 0; i < 7; i++) { const a = (i / 7 - 0.5) * Math.PI * 1.2; mesh(prism(4, 0.03, 0.0, 0.18 + (i === 3 ? 0.1 : 0)), M.bone, cr, [Math.sin(a) * 0.15, 0.04, Math.cos(a) * 0.15], [Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2]); }
  for (const s of ['L', 'R']) {
    mesh(taper(0.24, 0.24, 0.28, 0.28, d.upper, { anchor: 'top' }), M.skin, j['arm' + s]); mesh(taper(0.2, 0.2, 0.26, 0.26, d.fore, { anchor: 'top' }), M.skin, j['fore' + s]);
    mesh(taper(0.28, 0.28, 0.3, 0.3, 0.2, { anchor: 'top' }), M.leather, j['fore' + s], [0, -0.2, 0]);
    mesh(box(0.24, 0.22, 0.24, 'top'), M.skin, j['hand' + s]);
    mesh(taper(0.28, 0.3, 0.32, 0.32, d.thigh, { anchor: 'top' }), M.fur, j['thigh' + s]); mesh(taper(0.22, 0.24, 0.27, 0.28, d.shin, { anchor: 'top' }), M.skin, j['shin' + s]);
    mesh(box(0.26, 0.11, 0.36, 'top'), M.leather, j['foot' + s], [0, 0, 0.08]);
    const pl = spikedPauldron(M, 1.6, s === 'L' ? -1 : 1); j['arm' + s].add(pl); pl.position.set(s === 'L' ? -0.06 : 0.06, 0.06, 0);
  }
  mesh(box(0.7, 0.12, 0.52), M.leather, j.pelvis, [0, 0.12, 0]); mesh(box(0.14, 0.12, 0.04), M.gold, j.pelvis, [0, 0.12, 0.27]);
  mesh(taper(0.44, 0.02, 0.36, 0.02, 0.56, { anchor: 'top' }), M.red, j.pelvis, [0, 0.08, 0.27]);
  j.cleaver = cleaver(M, 1.25, false); j.handR.add(j.cleaver); j.cleaver.position.set(0, -0.12, 0.04); j.cleaver.rotation.set(Math.PI / 2 + 0.7, 0, 0);
  j.root.scale.setScalar(1.55); applyPose(j, { hipY: d.hip });
  return j;
}

// ---------------------------------------------------------------- instanced crowds
function crowdMesh(geo, m, positions, o) {
  const im = new THREE.InstancedMesh(geo, m, positions.length); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), R = rng(o.seed || 5);
  positions.forEach((p, i) => { const yaw = (o.yawFn ? o.yawFn(p) : (o.yaw ?? 0)) + (R() - 0.5) * (o.yawJitter ?? 0.4); q.setFromEuler(new THREE.Euler(0, yaw, 0)); const s = (o.scale ?? 1) * (0.88 + R() * 0.24); M4.compose(p, q, v3(s, s, s)); im.setMatrixAt(i, M4); im.setColorAt(i, new THREE.Color(o.tints[Math.floor(R() * o.tints.length)])); });
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.userData.base = positions.map(p => p.clone());
  im.userData.mats = positions.map((_, i) => { const m4 = new THREE.Matrix4(); im.getMatrixAt(i, m4); return m4; });
  return im;
}
export function orcHorde(positions, o = {}) {
  const parts = [taper(0.34, 0.26, 0.38, 0.28, 0.62), xf(taper(0.5, 0.32, 0.62, 0.34, 0.5), { p: [0, 0.6, 0] }), xf(box(0.3, 0.28, 0.3, 'bottom'), { p: [0, 1.1, 0.06] }),
    xf(prism(3, 0.03, 0, 0.1), { p: [0.08, 1.12, 0.22] }), xf(prism(3, 0.03, 0, 0.1), { p: [-0.08, 1.12, 0.22] }),
    xf(taper(0.12, 0.12, 0.14, 0.14, 0.62), { p: [0.34, 0.5, 0.05], r: [0, 0, 0.15] }), xf(taper(0.12, 0.12, 0.14, 0.14, 0.62), { p: [-0.34, 0.5, 0.05], r: [0, 0, -0.15] }),
    xf(box(0.04, 2.0, 0.04, 'bottom'), { p: [0.38, 0.2, 0.15] }), xf(taper(0.12, 0.02, 0.0, 0.01, 0.3), { p: [0.38, 2.1, 0.15] })];
  const im = crowdMesh(merge(parts), mat({ map: TD('oskin'), rim: 1, wrap: 0.6 }), positions, { ...o, tints: [0xffffff, 0xd8e0c0, 0xb8c0a0, 0xc8b8a0, 0xa0a890] });
  return im;
}
export function dwarfCrowd(positions, o = {}) {   // standing warriors (helmet, shield) or kneeling subjects
  const kneel = !!o.kneel; const g = new THREE.Group();
  const body = kneel ? [taper(0.42, 0.34, 0.46, 0.36, 0.28), xf(taper(0.46, 0.34, 0.52, 0.34, 0.26), { p: [0, 0.26, 0.04], r: [0.5, 0, 0] }), xf(box(0.2, 0.22, 0.21, 'bottom'), { p: [0, 0.5, 0.22], r: [0.5, 0, 0] }), xf(taper(0.42, 0.3, 0.36, 0.26, 0.12), { p: [0, 0.02, -0.18] })]
    : [taper(0.4, 0.3, 0.44, 0.32, 0.52), xf(taper(0.5, 0.36, 0.56, 0.37, 0.42), { p: [0, 0.52, 0] }), xf(box(0.2, 0.22, 0.21, 'bottom'), { p: [0, 0.96, 0.01] }), xf(box(0.3, 0.42, 0.06), { p: [-0.27, 0.62, 0.12], r: [0, 0.5, 0] })];
  const helm = kneel ? [] : [xf(prism(8, 0.135, 0.06, 0.14), { p: [0, 1.15, 0] }), xf(box(0.025, 1.4, 0.025, 'bottom'), { p: [0.27, 0.1, 0.12] }), xf(taper(0.06, 0.01, 0.0, 0.01, 0.2), { p: [0.27, 1.5, 0.12] })];
  g.add(crowdMesh(merge([...body, ...helm]), mat({ map: TD('leather'), rim: 1, wrap: 0.6 }), positions, { ...o, tints: kneel ? [0xffffff, 0xc0b0e0, 0xe0c0b0, 0xb0c8b0, 0xd0d0e8] : [0xd8d8e0, 0xc0c0c8, 0xe8e0d0] }));
  const beard = kneel ? xf(taper(0.12, 0.07, 0.2, 0.1, 0.24, { anchor: 'top' }), { p: [0, 0.6, 0.36], r: [0.9, 0, 0] }) : xf(taper(0.12, 0.08, 0.22, 0.11, 0.3, { anchor: 'top' }), { p: [0, 1.04, 0.12], r: [0.12, 0, 0] });
  g.add(crowdMesh(beard, mat({ map: TD('ginger'), rim: 1, wrap: 0.7 }), positions, { ...o, tints: [0x9a6040, 0x5a4034, 0xd0c8bc, 0xe0c080, 0x7a5038, 0xb0a898, 0xffffff] }));
  return g;
}
