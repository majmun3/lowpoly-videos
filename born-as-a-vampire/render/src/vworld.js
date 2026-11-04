// Worlds for WHAT IF YOU WERE BORN AS A VAMPIRE? — a gothic castle on a crag beneath a vast crimson moon, dark pine
// forests, rock spires and a black sea; candlelit halls with moonlight through pointed windows (which can decay through
// the centuries); a moonlit courtyard; a battlefield at a crimson sunset; and the throne room of the Vampire King.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky, terrain, archGeo } from '/the-last-ember/render/src/world.js';
import { T2, ridged } from '/the-silent-kingdom/render/src/kingdom.js';
import { TW, terrainAt, grassTufts, sunShafts, fireP, smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { pines, mountainMesh, TV } from '/born-as-a-dwarf/render/src/dworld.js';

const cache = {};
export function TX(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  moon: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1701, [16, 8, 4]); const r = rng(1701); const cr = Array.from({ length: 14 }, () => [r() * 64, r() * 64, 2 + r() * 6]); pixels(x, w, h, (i, j) => { const d = Math.hypot(i - 31.5, j - 31.5); if (d > 31) return [0, 0, 0, 0]; let v = 0.75 + (n(i, j) - 0.5) * 0.4; for (const [cx, cy, rr] of cr) if (Math.hypot(i - cx, j - cy) < rr) v -= 0.18; v *= 1 - Math.pow(d / 31, 4) * 0.4; return [C(v * 255), C(v * 70), C(v * 60), 255]; }); }, { clamp: true }),
  tiles: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1703, [16, 8, 4]); pixels(x, w, h, (i, j) => { const cx = Math.floor(i / 16), cy = Math.floor(j / 16); let v = ((cx + cy) % 2 ? 0.36 : 0.24) + (n(i, j) - 0.5) * 0.12; if (i % 16 === 0 || j % 16 === 0) v = 0.12; return [C(v * 200), C(v * 190), C(v * 205)]; }); }, { mip: true }),
  gstone: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 1705, [16, 8, 4]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 10), off = row % 2 ? 10 : 0, bx = (i + off) % 20, by = j % 10; let v = 0.4 + (n(i, j) - 0.5) * 0.2; if (bx < 1 || by < 1) v = 0.2; return [C(v * 175), C(v * 165), C(v * 182)]; }); }, { mip: true }),
  carpet: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 1707, [16, 8]); pixels(x, w, h, (i, j) => { const v = 0.55 + (n(i, j) - 0.5) * 0.2; if (i < 3 || i > w - 4) return [C(v * 190), C(v * 160), C(v * 90)]; return [C(v * 140), C(v * 14), C(v * 26)]; }); }),
  curtain: () => mk(32, 32, (x, w, h) => { const n = fbm(w, h, 1709, [8, 4]); pixels(x, w, h, (i, j) => { const v = 0.5 + Math.sin(i * 0.8) * 0.12 + (n(i, j) - 0.5) * 0.12; return [C(v * 170), C(v * 22), C(v * 34)]; }); }),
  gwin: () => mk(16, 32, (x, w, h) => { pixels(x, w, h, (i, j) => { if (i === 0 || i === w - 1 || j === h - 1 || i === 8 || j % 8 === 0) return [40, 40, 52]; const v = 0.75 + ((i * 7 + j * 3) % 5) * 0.05; return [C(v * 200), C(v * 210), C(v * 255)]; }); }),
  wings: () => mk(128, 64, (x, w, h) => { // bat-wing shadow (alpha) for the throne
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64, 30); g.lineTo(64 + s * 22, 6); g.lineTo(64 + s * 44, 2); g.lineTo(64 + s * 62, 12); g.lineTo(64 + s * 56, 22); g.lineTo(64 + s * 50, 40); g.lineTo(64 + s * 40, 32); g.lineTo(64 + s * 34, 50); g.lineTo(64 + s * 24, 40); g.lineTo(64 + s * 16, 58); g.lineTo(64 + s * 8, 44); g.lineTo(64, 52); g.closePath(); g.fill(); }
    const m = g.getImageData(0, 0, w, h).data; pixels(x, w, h, (i, j) => { const a = m[(j * w + i) * 4 + 3]; return a > 100 ? [255, 255, 255, 255] : [0, 0, 0, 0]; });
  }, { clamp: true }),
  ivy: () => mk(32, 32, (x, w, h) => { const r = rng(1711); const n = fbm(w, h, 1711, [8, 4]); pixels(x, w, h, (i, j) => { if (n(i, j) < 0.5) return [0, 0, 0, 0]; const v = 0.4 + r() * 0.3; return [C(v * 90), C(v * 140), C(v * 70), 255]; }); }),
  web: () => mk(32, 32, (x, w, h) => { pixels(x, w, h, (i, j) => { const a = Math.atan2(j, i), r = Math.hypot(i, j); const on = (Math.abs(Math.sin(a * 6)) < 0.08) || (Math.abs((r % 6) - 3) < 0.35); return on && r < 31 ? [230, 230, 235, 255] : [0, 0, 0, 0]; }); }),
};
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function materials() {
  return {
    stone: mat({ map: TX('gstone'), color: 0xb0a8b8, rim: 0.4, repeat: [3, 3] }), stoneBig: mat({ map: TX('gstone'), color: 0xa09aaa, rim: 0.3, repeat: [10, 6] }), dark: mat({ map: T('darkstone'), color: 0x8a8494, rim: 0.4 }),
    roof: mat({ map: T('roof'), color: 0x5a4a5a, rim: 0.5 }), win: mat({ color: 0xff7040, emissive: 0xff5020, unlit: true, fogScale: 0.5 }), gwin: mat({ map: TX('gwin'), unlit: true, color: 0xa8b0d8, fogScale: 0.5 }),
    tiles: mat({ map: TX('tiles'), affine: 0.6 }), carpet: mat({ map: TX('carpet') }), curtain: mat({ map: TX('curtain'), side: THREE.DoubleSide, wrap: 0.7, rim: 0.4 }), gold: mat({ map: T('brass'), color: 0xe8c890, rim: 1 }),
    wood: mat({ map: T('wood'), color: 0x6a4a40 }), candle: mat({ color: 0xe8e0cc, rim: 0.5 }), black: mat({ map: T('iron'), color: 0x3a3440, rim: 1 }), silver: mat({ map: T('iron'), color: 0xd8dce8, rim: 1 }),
    ivy: mat({ map: TX('ivy'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }), web: mat({ map: TX('web'), unlit: true, transparent: true, opacity: 0, alphaTest: 0.3, side: THREE.DoubleSide, color: 0xc8c8d0 }),
  };
}
function bucket(B, M, parent) { for (const k in B) if (B[k].length) mesh(merge(B[k]), M[k], parent); }

// ---------------------------------------------------------------- skies and light
export const SKIES = {
  moon: { horizon: 0x5a1e26, top: 0x120a18, bottom: 0x1a1018, cloud: 0x2a141c, cloudLit: 0xa03030, sunCol: 0xc02020, cover: 0.5, sunDir: v3(0.08, 0.3, -1) },
  sunset: { horizon: 0xf07040, top: 0x3a2448, bottom: 0x3a2228, cloud: 0x5a2a38, cloudLit: 0xffa060, sunCol: 0xff6030, cover: 0.46, sunDir: v3(0.0, 0.08, -1) },
  storm: { horizon: 0x8a1420, top: 0x1a0610, bottom: 0x200810, cloud: 0x3a0a14, cloudLit: 0xe02838, sunCol: 0xff2030, cover: 0.32, sunDir: v3(0.0, 0.3, -1), swirl: 1.2 },
  dawn: { horizon: 0xf0b8a0, top: 0x4a5a8a, bottom: 0x4a4048, cloud: 0x8a7080, cloudLit: 0xffd8b8, sunCol: 0xffc090, cover: 0.5, sunDir: v3(0.3, 0.12, -1) },
};
export const ENVS = {
  moon: { fog: [30, 1400], fogCol: 0x3a2028, hfog: [2, 26, 0.5, 0.006], lightDir: v3(-0.1, -0.35, 1.0), lightCol: 0xe89090, ambient: 0x463c56, rim: 0xff7070, fillDir: v3(0.4, -0.4, -0.8), fillCol: 0x2a2a44 },
  sunset: { fog: [40, 1600], fogCol: 0x8a4a40, hfog: [2, 20, 0.45, 0.005], lightDir: v3(0.0, -0.25, 1.0), lightCol: 0xffb080, ambient: 0x4a3a4a, rim: 0xff9060, fillDir: v3(0.4, -0.4, -0.8), fillCol: 0x3a3048 },
  storm: { fog: [30, 1200], fogCol: 0x4a1018, hfog: [2, 26, 0.5, 0.006], lightDir: v3(0.0, -0.4, 1.0), lightCol: 0xff8080, ambient: 0x5a3644, rim: 0xff5050, fillDir: v3(0.4, -0.4, -0.8), fillCol: 0x301828 },
  dawn: { fog: [40, 1600], fogCol: 0xb89a9a, hfog: [2, 16, 0.5, 0.008], lightDir: v3(-0.3, -0.3, 1.0), lightCol: 0xffd8b8, ambient: 0x5a5060, rim: 0xffc8a0, fillDir: v3(0.4, -0.4, -0.8), fillCol: 0x404058 },
  moonlit: { fog: [20, 900], fogCol: 0x2a2838, hfog: [1, 10, 0.4, 0.01], lightDir: v3(0.3, -0.7, 0.5), lightCol: 0xb8c0f0, ambient: 0x545670, rim: 0xa8b4ff, fillDir: v3(-0.4, -0.3, -0.8), fillCol: 0x34304a },
  hall: { fog: [10, 120], fogCol: 0x1a1828, hfog: [0, 3, 0.4, 0.03], lightDir: v3(0.6, -0.6, -0.3), lightCol: 0xc0c8f8, ambient: 0x4e4a66, rim: 0x9aa0d8, fillDir: v3(-0.4, -0.2, 0.8), fillCol: 0x2a2230 },
  throne: { fog: [10, 140], fogCol: 0x1a0c12, hfog: [0, 3, 0.4, 0.03], lightDir: v3(0.3, -0.7, 0.5), lightCol: 0xffc8a0, ambient: 0x52404c, rim: 0xff8060, fillDir: v3(-0.4, -0.2, -0.8), fillCol: 0x3a2a30 },
};

// ---------------------------------------------------------------- the castle
export function castle(o = {}) {
  const g = new THREE.Group(), M = materials(); const B = { dark: [], roof: [], win: [], stone: [] }; const R = rng(o.seed || 5);
  B.dark.push(xf(box(18, 46, 16, 'bottom'), { p: [0, 0, -8] })); B.roof.push(xf(prism(4, 13.5, 0, 16), { p: [0, 46, -8], r: [0, Math.PI / 4, 0] })); B.dark.push(xf(prism(8, 2.4, 0, 34), { p: [0, 52, -8] }));
  const towers = [[-14, 8, 3.4, 38], [14, 8, 3.4, 40], [-25, -6, 4.2, 50], [25, -6, 4.2, 47], [-11, -24, 3.2, 58], [11, -24, 3.2, 54], [0, 16, 4.6, 30], [-34, 12, 3, 28], [34, 12, 3, 30], [-6, -16, 2.4, 64]];
  const tops = [];
  for (const [x, z, r, h] of towers) {
    B.dark.push(xf(prism(8, r, r * 0.9, h), { p: [x, 0, z] })); B.dark.push(xf(prism(8, r * 1.18, r * 1.18, 1.2), { p: [x, h - 0.4, z] }));
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; B.dark.push(xf(box(0.8, 1.4, 0.8, 'bottom'), { p: [x + Math.cos(a) * r * 1.1, h + 0.6, z + Math.sin(a) * r * 1.1] })); }
    B.roof.push(xf(prism(8, r * 1.08, 0, r * 3.8), { p: [x, h + 0.6, z] })); tops.push(v3(x, h + 0.6 + r * 3.8, z));
    for (let y = h * 0.3; y < h - 4; y += 7 + R() * 3) if (R() < 0.75) B.win.push(xf(box(0.7, 1.6, 0.3), { p: [x + (R() - 0.5) * r * 0.6, y, z + r * 0.95] }));
  }
  for (let y = 12; y < 42; y += 6) for (let x = -6; x <= 6; x += 3) if (R() < 0.6) B.win.push(xf(box(0.8, 2.0, 0.3), { p: [x, y, 0.1] }));
  // curtain walls with crenellations
  for (const [x0, z0, x1, z1, h] of [[-34, 12, 34, 12, 16], [-34, 12, -25, -6, 18], [34, 12, 25, -6, 18], [-25, -6, -11, -24, 20], [25, -6, 11, -24, 20]]) {
    const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); B.dark.push(xf(box(3, h, L, 'bottom'), { p: [(x0 + x1) / 2, 0, (z0 + z1) / 2], r: [0, a, 0] }));
    for (let s = -L / 2 + 1; s < L / 2; s += 2.2) B.dark.push(xf(box(3.4, 1.4, 1.1, 'bottom'), { p: [(x0 + x1) / 2 + Math.sin(a) * s, h, (z0 + z1) / 2 + Math.cos(a) * s], r: [0, a, 0] }));
  }
  B.dark.push(xf(box(70, 4, 40, 'bottom'), { p: [0, -3.5, -6] }));
  // the balcony on the front tower (facing the battlefield)
  const balc = v3(0, 24, 16 + 4.6 + 1.6);
  B.stone.push(xf(box(6, 0.5, 3.4), { p: [balc.x, balc.y - 0.25, balc.z - 0.4] }));
  for (let k = -5; k <= 5; k++) B.stone.push(xf(box(0.18, 1.0, 0.18, 'bottom'), { p: [balc.x + k * 0.52, balc.y, balc.z + 1.15] })); B.stone.push(xf(box(6, 0.18, 0.4), { p: [balc.x, balc.y + 1.05, balc.z + 1.15] }));
  for (const s of [-1, 1]) B.stone.push(xf(box(0.18, 1.0, 3.4, 'bottom'), { p: [balc.x + s * 2.9, balc.y, balc.z - 0.4] }));
  B.win.push(xf(box(1.6, 3.0, 0.3, 'bottom'), { p: [0, balc.y, 16 + 4.4] }));
  bucket(B, M, g);
  g.userData = { tops, balc, towers };
  return g;
}
export function moon(scene, p, size = 340) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX('moon'), color: 0xffffff, fog: false, depthWrite: false, transparent: true })); m.scale.set(size, size, 1); m.position.copy(p); m.renderOrder = -5; scene.add(m); const h = glow(0xff2a20, size * 2.0, 0.2); h.position.copy(p); h.renderOrder = -5; scene.add(h); return { m, h }; }
export function castleHF() {
  const rg = ridged(55);
  return (x, z) => { const hill = 40 * Math.exp(-(x * x / (85 * 85) + (z + 150) * (z + 150) / (70 * 70))) + 8 * Math.exp(-(x * x / 600 + (z + 150) * (z + 150) / 500)); const far = Math.pow(sm(260, 700, Math.hypot(x * 0.8, z + 120)), 1.3) * (rg(x, z) * 90 + 140); const coast = -10 * sm(-160, -320, x) * sm(-200, 100, z);
    return 0.6 * Math.sin(x * 0.03) * Math.cos(z * 0.025) + hill + far + coast + (rg(x * 3, z * 3) - 1.2) * 1.6 * sm(30, 120, Math.hypot(x, z + 150)); };
}
// the castle world (o.sky: 'moon' | 'sunset' | 'storm' | 'dawn')
export function castleWorld(o = {}) {
  const scene = new THREE.Scene(), M = materials(), hf = castleHF(); const sk = o.sky ?? 'moon';
  const s = sky(SKIES[sk]); scene.add(s);
  const mm = mountainMesh(hf, { size: 4200, seg: 180, cz: -40, grass: sk === 'dawn' ? 0x5a6a48 : 0x4a4a48, rock: 0x4a4650, snowLine: 9999 }); scene.add(mm);
  if (o.ground !== false) scene.add(terrainAt(0, 30, 260, 90, hf, { map: TW('grass'), color: sk === 'dawn' ? 0x9aa080 : 0x6a6a68 }));
  const c = castle(); c.position.set(0, hf(0, -150) - 1, -150); scene.add(c);
  const sea = mesh(new THREE.PlaneGeometry(3000, 3000), mat({ color: 0x18141e, rim: 0.6 }), scene, [-1800, -2.6, -300], [-Math.PI / 2, 0, 0]);
  let mo = null; if (sk === 'moon' || sk === 'storm') mo = moon(scene, v3(70, 300, -1100), sk === 'storm' ? 420 : 360);
  const avoid = (x, z) => Math.hypot(x, z + 150) < 55 || (Math.abs(x) < 90 && z > -90 && z < 260);
  scene.add(pines({ count: 700, area: [-420, 420, -460, 320], ground: hf, avoid, seed: 31, h: [9, 22], color: sk === 'dawn' ? 0x6a7a68 : 0x3a4048 }));
  // jagged rock spires
  const sp = []; const R = rng(33); for (let i = 0; i < 70; i++) { const x = (R() - 0.5) * 500, z = -60 - R() * 300; if (Math.hypot(x, z + 150) < 48 || Math.abs(x) < 25) continue; const h = 8 + R() * 30; sp.push(xf(prism(4 + Math.floor(R() * 2), 1.5 + R() * 3, 0, h), { p: [x, hf(x, z) - 1, z], r: [(R() - 0.5) * 0.3, R() * 3, (R() - 0.5) * 0.3] })); }
  mesh(merge(sp), M.dark, scene);
  return { scene, sky: s, hf, M, castle: c, moon: mo, skyName: sk };
}

// ---------------------------------------------------------------- the gothic hall (nursery, corridor, feast hall, throne room)
export function gothicHall(o = {}) {
  const scene = new THREE.Scene(), M = materials(); const W = o.W ?? 16, L = o.L ?? 40, H = o.H ?? 16, z0 = o.z0 ?? 6;
  mesh(new THREE.PlaneGeometry(W, L), mat({ map: TX('tiles'), repeat: [W / 4, L / 4] }), scene, [0, 0, z0 - L / 2], [-Math.PI / 2, 0, 0]);
  const B = { stoneBig: [], dark: [], gold: [] };
  for (const s of [-1, 1]) B.stoneBig.push(xf(box(1, H, L, 'bottom'), { p: [s * (W / 2 + 0.5), 0, z0 - L / 2] }));
  B.stoneBig.push(xf(box(W, H, 1, 'bottom'), { p: [0, 0, z0 - L - 0.5] })); B.stoneBig.push(xf(box(W, H, 1, 'bottom'), { p: [0, 0, z0 + 0.5] }));
  B.dark.push(xf(box(W, 1, L, 'bottom'), { p: [0, H, z0 - L / 2] }));
  const step = o.step ?? 8; const colX = W / 2 - 1.6; const windows = [];
  for (let z = z0 - 4; z > z0 - L + 2; z -= step) {
    for (const s of [-1, 1]) { B.dark.push(xf(prism(8, 0.85, 0.85, H * 0.7), { p: [s * colX, 0, z] })); B.dark.push(xf(box(2.2, 0.6, 2.2, 'bottom'), { p: [s * colX, 0, z] })); B.dark.push(xf(box(2.0, 0.5, 2.0), { p: [s * colX, H * 0.7, z] })); }
    const ag = archGeo(colX * 2, 0.8, 1.2, 9, true); B.dark.push(xf(ag, { p: [0, H * 0.7, z], s: [1, 0.55, 1] }));
    if (z > z0 - L + step) for (const s of [-1, 1]) windows.push([s * (W / 2 - 0.02), z - step / 2]);
  }
  bucket(B, M, scene);
  const winM = M.gwin; const shaftM = mat({ color: o.shaftCol ?? 0xb8c0ff, unlit: true, additive: true, opacity: o.shaft ?? 0.06, side: THREE.DoubleSide, fogScale: 0.3 });
  for (const [x, z] of windows) { mesh(new THREE.PlaneGeometry(2.2, H * 0.5), winM, scene, [x, H * 0.45, z], [0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]); const ag = archGeo(2.2, 0.2, 0.3, 7, true); mesh(ag, M.dark, scene, [x - Math.sign(x) * 0.1, H * 0.7, z], [0, Math.PI / 2, 0], [1, 0.6, 1]); if (o.shafts !== false) mesh(new THREE.PlaneGeometry(2.0, H * 1.2), shaftM, scene, [x * 0.55, H * 0.42, z], [0, Math.PI / 2, (x > 0 ? 1 : -1) * 0.75]); }
  // rose window at the far end
  const rose = mesh(new THREE.CircleGeometry(W * 0.22, 16), winM, scene, [0, H * 0.66, z0 - L + 0.02]);
  if (o.carpet !== false) mesh(new THREE.PlaneGeometry(3.2, L - 4), M.carpet, scene, [0, 0.02, z0 - L / 2], [-Math.PI / 2, 0, 0]);
  // candelabras
  const flames = []; const fG = new THREE.Group(); scene.add(fG);
  const candelabra = (x, z, h = 2.2) => { const c = group(scene, [x, 0, z]); mesh(prism(6, 0.05, 0.04, h), M.gold, c); mesh(prism(6, 0.28, 0.18, 0.12), M.gold, c); mesh(box(0.9, 0.05, 0.05), M.gold, c, [0, h, 0]);
    for (const dx of [-0.42, 0, 0.42]) { mesh(prism(6, 0.035, 0.035, 0.22), M.candle, c, [dx, h + (dx === 0 ? 0.12 : 0), 0]); const f = glow(0xffb060, 0.55, 0.85); f.position.set(x + dx, h + 0.32 + (dx === 0 ? 0.12 : 0), z); fG.add(f); const core = glow(0xfff0c0, 0.16, 1); core.position.copy(f.position); fG.add(core); flames.push({ f, core, p: f.position.clone() }); } };
  for (const [x, z] of (o.candelabras ?? [])) candelabra(x, z);
  // decay layers (0..1): ivy, cobwebs
  const ivy = [], webs = [];
  if (o.decayable) { const R = rng(7); for (let z = z0 - 4; z > z0 - L + 2; z -= step) for (const s of [-1, 1]) { const iv = mesh(new THREE.PlaneGeometry(2.4, H * 0.7), M.ivy, scene, [s * (colX - 0.86 * Math.sign(s) * 0), H * 0.35, z + 0.9], [0, 0, 0]); iv.visible = false; ivy.push([iv, R()]); const wb = mesh(new THREE.PlaneGeometry(1.8, 1.8), M.web, scene, [s * (colX - 0.6), H * 0.62, z - 1.0], [0, s * 0.8, 0]); webs.push(wb); } }
  return { scene, M, W, L, H, z0, flames, windows, rose, ivy, webs, candelabra, fG };
}
export function setDecay(E, k) { for (const [iv, th] of E.ivy) iv.visible = k > th * 0.8 + 0.15; for (const w of E.webs) w.material.uniforms.uOpacity.value = clamp((k - 0.3) * 2) * 0.7; }
export function flameSet(E, i, on) { const fl = E.flames[i]; fl.f.visible = on > 0.02; fl.core.visible = on > 0.02; fl.f.material.opacity = 0.85 * on; fl.core.material.opacity = on; }

// ---------------------------------------------------------------- the moonlit courtyard
export function courtyard(o = {}) {
  const W = castleWorld({ sky: 'moon', ground: false }); const scene = W.scene; const M = W.M;
  const cz = 60; const B = { stone: [], dark: [] };
  scene.add(mesh(new THREE.PlaneGeometry(44, 44), mat({ map: TX('tiles'), repeat: [11, 11], color: 0xc0b8c8 }), null, [0, 0, cz], [-Math.PI / 2, 0, 0]));
  for (const [x, z, w, d] of [[0, cz - 22, 44, 2], [-22, cz, 2, 44], [22, cz, 2, 44], [0, cz + 22, 44, 2]]) B.dark.push(xf(box(w, 12, d, 'bottom'), { p: [x, 0, z] }));
  for (const [x, z] of [[-22, cz - 22], [22, cz - 22], [-22, cz + 22], [22, cz + 22]]) { B.dark.push(xf(prism(8, 3.4, 3.2, 22), { p: [x, 0, z] })); }
  bucket(B, M, scene);
  for (const [x, z] of [[-22, cz - 22], [22, cz - 22], [-22, cz + 22], [22, cz + 22]]) mesh(prism(8, 3.8, 0, 12), M.roof, scene, [x, 22, z]);
  const torches = []; for (const x of [-14, -5, 5, 14]) for (const z of [cz - 20.8]) { const p = v3(x, 3.4, z); torches.push(p); scene.add(fireP({ origin: p, spread: v3(0.12, 0.05, 0.12), size: 0.35, count: 30, vel: v3(0, 1.4, 0), life: 0.6, seed: 900 + x })); const g = glow(0xff9040, 3, 0.5); g.position.copy(p); scene.add(g); }
  for (const z of [cz - 10, cz, cz + 10]) for (const s of [-1, 1]) { const p = v3(s * 20.8, 3.4, z); torches.push(p); scene.add(fireP({ origin: p, spread: v3(0.12, 0.05, 0.12), size: 0.35, count: 30, vel: v3(0, 1.4, 0), life: 0.6, seed: 950 + z + s })); const g = glow(0xff9040, 3, 0.5); g.position.copy(p); scene.add(g); }
  return { ...W, cz, torches };
}

// ---------------------------------------------------------------- the throne room
export function throneRoom(o = {}) {
  const E = gothicHall({ W: 26, L: 56, H: 26, step: 9, candelabras: [[-4.5, -10], [4.5, -10], [-4.5, -22], [4.5, -22], [-4.5, -34], [4.5, -34], [-6.5, -40], [6.5, -40]], shaft: 0.05, shaftCol: 0xff9090 });
  const { scene, M } = E; const tz = -45;
  const B = { stone: [], black: [], gold: [] };
  for (let k = 0; k < 4; k++) B.stone.push(xf(box(12 - k * 2, 0.45, 9 - k * 1.5, 'bottom'), { p: [0, k * 0.45, tz + 1.5 - k * 0.6] }));
  bucket(B, M, scene);
  mesh(new THREE.PlaneGeometry(3.2, 4.4), M.carpet, scene, [0, 0.95, tz + 3.6], [-Math.PI / 2 + 0.42, 0, 0]);
  // the black throne with a bat-wing back
  const throne = group(scene, [0, 1.8, tz - 0.6]);
  mesh(box(1.5, 0.35, 1.3, 'bottom'), M.black, throne); mesh(box(1.55, 0.1, 1.35), mat({ map: TX('curtain'), color: 0xd06060 }), throne, [0, 0.38, 0.02]);
  mesh(box(1.4, 3.4, 0.25, 'bottom'), M.black, throne, [0, 0.6, -0.55]);
  const wingS = new THREE.Shape(); wingS.moveTo(0, 0); wingS.lineTo(0.6, 2.6); wingS.lineTo(1.3, 3.0); wingS.lineTo(1.9, 2.2); wingS.lineTo(1.5, 1.9); wingS.lineTo(1.6, 1.2); wingS.lineTo(1.1, 1.2); wingS.lineTo(1.0, 0.5); wingS.lineTo(0.6, 0.6); wingS.closePath();
  for (const s of [-1, 1]) { const wg = new THREE.ExtrudeGeometry(wingS, { depth: 0.12, bevelEnabled: false }); const m = mesh(flat(wg), M.black, throne, [s * 0.5, 1.4, -0.62]); m.scale.set(s, 1, 1); }
  for (const s of [-1, 1]) { mesh(box(0.22, 0.5, 1.2, 'bottom'), M.black, throne, [s * 0.75, 0.6, 0.0]); mesh(flat(new THREE.OctahedronGeometry(0.1, 0)), mat({ color: 0xff2020, emissive: 0x900000, unlit: true }), throne, [s * 0.75, 1.18, 0.5]); }
  mesh(flat(new THREE.OctahedronGeometry(0.16, 0)), mat({ color: 0xff2020, emissive: 0x900000, unlit: true }), throne, [0, 3.7, -0.4]);
  // crimson curtains behind the throne
  for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(7, 20, 14, 6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.2) * 0.35); g.computeVertexNormals(); mesh(g, M.curtain, scene, [s * 5.5, 12, tz - 6], [0, 0, 0]); }
  // the shadow of wings behind him
  const wings = mesh(new THREE.PlaneGeometry(22, 11), mat({ map: TX('wings'), color: 0x000000, transparent: true, opacity: 0, alphaTest: 0.3, fogScale: 0.2, unlit: true, side: THREE.DoubleSide }), scene, [0, 9.5, tz - 4.8]);
  const rim = mesh(new THREE.PlaneGeometry(22.8, 11.6), mat({ map: TX('wings'), color: 0xff1a2a, unlit: true, additive: true, opacity: 0, fogScale: 0.2, side: THREE.DoubleSide }), scene, [0, 9.5, tz - 4.9]);
  return { ...E, tz, throne, wings, rim };
}
