// Procedural low-resolution pixel textures (all original, generated at runtime).
import { THREE, rng } from './engine.js';

const cache = {};
function mk(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.magFilter = opts.linear ? THREE.LinearFilter : THREE.NearestFilter; t.minFilter = opts.mip ? (opts.linear ? THREE.LinearMipmapLinearFilter : THREE.NearestMipmapNearestFilter) : THREE.NearestFilter;
  t.generateMipmaps = !!opts.mip;
  t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.userData.canvas = c;
  return t;
}
// tileable value noise
function noiseField(w, h, cell, seed) {
  const r = rng(seed), gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
  const grid = Array.from({ length: gw * gh }, () => r());
  return (x, y) => {
    const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    const g = (i, j) => grid[((j % gh + gh) % gh) * gw + ((i % gw + gw) % gw)];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (g(x0, y0) * (1 - sx) + g(x0 + 1, y0) * sx) * (1 - sy) + (g(x0, y0 + 1) * (1 - sx) + g(x0 + 1, y0 + 1) * sx) * sy;
  };
}
function fbm(w, h, seed, cells = [16, 8, 4, 2]) {
  const fs = cells.map((c, i) => noiseField(w, h, c, seed + i * 17));
  return (x, y) => { let v = 0, a = 0.5, s = 0; for (const f of fs) { v += f(x, y) * a; s += a; a *= 0.5; } return v / s; };
}
function pixels(x, w, h, fn) {
  const img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const [r, g, b, a = 255] = fn(i, j); const k = (j * w + i) * 4;
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = a;
  }
  x.putImageData(img, 0, 0);
}
const C = (v) => Math.max(0, Math.min(255, v | 0));

export function T(name) { if (!cache[name]) cache[name] = MAKERS[name](); return cache[name]; }

const MAKERS = {
  // Grey-brown cut stone blocks with dark mortar and ash streaks
  stone: () => mk(64, 64, (x, w, h) => {
    const n = fbm(w, h, 11), r = rng(3);
    const rows = 4, bh = h / rows; const offs = [0, 0.5, 0.25, 0.75].map(o => o * 32);
    const tint = Array.from({ length: 64 }, () => r() * 0.25 - 0.12);
    pixels(x, w, h, (i, j) => {
      const row = Math.floor(j / bh), bx = (i + offs[row]) % 32, by = j % bh;
      const mortar = bx < 1 || by < 1;
      const id = row * 4 + Math.floor(((i + offs[row]) % 64) / 32);
      let v = 0.42 + (n(i, j) - 0.5) * 0.45 + tint[id];
      if (by > bh - 3) v -= 0.06; if (bx > 29) v -= 0.05; if (by < 3) v += 0.04;
      if (mortar) v = 0.12;
      v -= Math.max(0, (j / h) - 0.7) * 0.15;
      return [C(v * 250 + 8), C(v * 232 + 4), C(v * 214)];
    });
  }, { mip: true }),
  // Darker gothic stone for the cathedral, tall blocks
  darkstone: () => mk(64, 64, (x, w, h) => {
    const n = fbm(w, h, 21), r = rng(5); const tint = Array.from({ length: 64 }, () => r() * 0.2 - 0.1);
    pixels(x, w, h, (i, j) => {
      const row = Math.floor(j / 21.33), off = row % 2 ? 16 : 0, bx = (i + off) % 32, by = j % 21.33;
      let v = 0.3 + (n(i, j) - 0.5) * 0.4 + tint[row * 2 + Math.floor(((i + off) % 64) / 32)];
      if (bx < 1 || by < 1) v = 0.08; if (by > 18) v -= 0.05;
      return [C(v * 240), C(v * 225), C(v * 222)];
    });
  }, { mip: true }),
  // Ash-covered ground
  ash: () => mk(64, 64, (x, w, h) => {
    const n = fbm(w, h, 31, [32, 16, 8, 4, 2]), r = rng(9);
    pixels(x, w, h, (i, j) => {
      let v = 0.36 + (n(i, j) - 0.5) * 0.5; if (r() < 0.05) v -= 0.12; if (r() < 0.03) v += 0.1;
      return [C(v * 235), C(v * 225), C(v * 220)];
    });
  }, { mip: true }),
  // Blackened iron plate with scratches, rivets and a faded-brass edge
  iron: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 41, [8, 4, 2]), r = rng(4);
    pixels(x, w, h, (i, j) => {
      let v = 0.27 + (n(i, j) - 0.5) * 0.25; if (r() < 0.04) v += 0.18;
      if ((i + j * 3) % 37 === 0) v += 0.12;
      if ((i === 4 || i === 27) && j % 8 === 4) v += 0.3; // rivets
      return [C(v * 215), C(v * 205), C(v * 205)];
    });
  }),
  brass: () => mk(16, 16, (x, w, h) => { const r = rng(6); pixels(x, w, h, (i, j) => { const v = 0.55 + r() * 0.2 - (j / h) * 0.15; return [C(v * 250), C(v * 190), C(v * 95)]; }); }),
  // Lamellar (rows of small iron scales laced with brass)
  lamellar: () => mk(32, 32, (x, w, h) => {
    const r = rng(14);
    pixels(x, w, h, (i, j) => {
      const row = Math.floor(j / 6), off = row % 2 ? 3 : 0, cx = (i + off) % 6, cy = j % 6;
      let v = 0.3 - cy * 0.025 + r() * 0.06; if (cx === 0) v = 0.1; if (cy === 5) v = 0.08;
      if (cy === 0 && cx === 3) return [150, 115, 55];
      return [C(v * 220), C(v * 210), C(v * 205)];
    });
  }),
  // Oxblood half-cloak cloth, tattered bottom edge (alpha)
  cloak: () => mk(32, 64, (x, w, h) => {
    const n = fbm(w, h, 51, [16, 8, 4, 2]), r = rng(8);
    const tear = Array.from({ length: w }, (_, i) => h - 2 - Math.floor(r() * 12 + Math.sin(i * 1.7) * 3));
    pixels(x, w, h, (i, j) => {
      if (j > tear[i]) return [0, 0, 0, 0];
      if (r() < 0.012 && j > h * 0.5) return [0, 0, 0, 0];
      let v = 0.55 + (n(i, j) - 0.5) * 0.5 - (j / h) * 0.2; if (i % 4 === 0) v -= 0.06;
      return [C(v * 150), C(v * 30), C(v * 28), 255];
    });
  }),
  gambeson: () => mk(32, 32, (x, w, h) => {
    const r = rng(19);
    pixels(x, w, h, (i, j) => { let v = 0.45 + r() * 0.1; if (j % 8 === 0 || (i + j) % 16 === 0) v -= 0.15; return [C(v * 175), C(v * 135), C(v * 95)]; });
  }),
  leather: () => mk(16, 16, (x, w, h) => { const r = rng(23); pixels(x, w, h, (i, j) => { let v = 0.35 + r() * 0.12; if ((i + j) % 4 === 0) v -= 0.08; return [C(v * 165), C(v * 115), C(v * 75)]; }); }),
  // Tabard: dark crimson with the Weeping Ember sigil (diamond, ember dot, three ash-tears)
  tabard: () => mk(32, 64, (x, w, h) => {
    const n = fbm(w, h, 61, [8, 4, 2]), r = rng(28);
    const tear = Array.from({ length: w }, () => h - 1 - Math.floor(r() * 7));
    pixels(x, w, h, (i, j) => {
      if (j > tear[i]) return [0, 0, 0, 0];
      let v = 0.5 + (n(i, j) - 0.5) * 0.4 - (j / h) * 0.15;
      let c = [C(v * 120), C(v * 26), C(v * 24), 255];
      const cx = 15.5, cy = 18, dx = Math.abs(i - cx), dy = Math.abs(j - cy);
      const d = dx + dy * 0.75;
      const gold = [C(170 + n(i, j) * 40), C(128 + n(i, j) * 30), 58, 255];
      if (d > 7 && d < 9.2) c = gold;                     // diamond outline
      if (dx * dx + dy * dy < 4.5) c = [235, 150, 60, 255]; // ember dot
      for (const tx of [11.5, 15.5, 19.5]) { const len = tx === 15.5 ? 12 : 8; if (Math.abs(i - tx) < 0.8 && j > cy + 9 && j < cy + 9 + len) c = gold; }
      if (i < 1 || i > 30) c = gold;
      return c;
    });
  }),
  // Ash-grey cracked skin of the Ashwights / ash statues
  ashskin: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 71, [8, 4, 2]), cr = fbm(w, h, 73, [16, 8]);
    pixels(x, w, h, (i, j) => {
      let v = 0.55 + (n(i, j) - 0.5) * 0.35; const k = Math.abs(cr(i, j) - 0.5); if (k < 0.03) v = 0.18;
      return [C(v * 200), C(v * 196), C(v * 192)];
    });
  }),
  rust: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 81, [8, 4, 2]), r = rng(31);
    pixels(x, w, h, (i, j) => { const v = n(i, j); const k = r() * 0.1; return v > 0.55 ? [C(120 + k * 300), C(62 + k * 100), C(34)] : [C((0.25 + k) * 200), C((0.24 + k) * 190), C((0.24 + k) * 185)]; });
  }),
  rags: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 91, [8, 4, 2]), r = rng(33);
    const tear = Array.from({ length: w }, () => h - 1 - Math.floor(r() * 10));
    pixels(x, w, h, (i, j) => { if (j > tear[i] || r() < 0.03) return [0, 0, 0, 0]; const v = 0.35 + (n(i, j) - 0.5) * 0.4; return [C(v * 165), C(v * 150), C(v * 130), 255]; });
  }),
  wood: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 101, [16, 4, 2]);
    pixels(x, w, h, (i, j) => { let v = 0.3 + Math.sin(i * 0.9 + n(i, j) * 6) * 0.06 + (n(i, j) - 0.5) * 0.2; if (i % 8 === 0) v -= 0.1; return [C(v * 190), C(v * 140), C(v * 100)]; });
  }),
  bark: () => mk(16, 32, (x, w, h) => {
    const n = fbm(w, h, 111, [8, 4, 2]);
    pixels(x, w, h, (i, j) => { let v = 0.22 + (n(i, j) - 0.5) * 0.3; if (i % 4 === 0) v -= 0.08; return [C(v * 200), C(v * 188), C(v * 180)]; });
  }),
  plaster: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 121, [16, 8, 4]);
    pixels(x, w, h, (i, j) => { let v = 0.42 + (n(i, j) - 0.5) * 0.35; if (i < 2 || i > 29 || j < 2) return [50, 38, 30]; if (Math.abs(i - j) < 1.5) return [55, 42, 33]; return [C(v * 210), C(v * 195), C(v * 180)]; });
  }),
  roof: () => mk(32, 32, (x, w, h) => {
    const r = rng(131);
    pixels(x, w, h, (i, j) => { const row = Math.floor(j / 4), cx = (i + (row % 2) * 4) % 8; let v = 0.25 + r() * 0.06 - (j % 4) * 0.02; if (cx === 0) v = 0.1; return [C(v * 200), C(v * 170), C(v * 160)]; });
  }),
  // Knellwyrm stone plates, with emission mask companion
  wyrm: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 141, [8, 4, 2]);
    pixels(x, w, h, (i, j) => { const cy = j % 16, cx = (i + (Math.floor(j / 16) % 2) * 8) % 16; let v = 0.32 + (n(i, j) - 0.5) * 0.3 - cy * 0.008; if (cy < 1 || cx < 1) v = 0.08; return [C(v * 210), C(v * 200), C(v * 195)]; });
  }),
  wyrmE: () => mk(32, 32, (x, w, h) => {
    const n = fbm(w, h, 141, [8, 4, 2]), cr = fbm(w, h, 147, [16, 8]);
    pixels(x, w, h, (i, j) => { const cy = j % 16, cx = (i + (Math.floor(j / 16) % 2) * 8) % 16; const k = Math.abs(cr(i, j) - 0.5); if (k < 0.018) return [255, 110, 20]; if (k < 0.03) return [90, 25, 4]; return [0, 0, 0]; });
  }),
  bone: () => mk(16, 16, (x, w, h) => { const r = rng(151); pixels(x, w, h, (i, j) => { const v = 0.62 + r() * 0.12 - (j / h) * 0.15; return [C(v * 220), C(v * 205), C(v * 180)]; }); }),
  bronze: () => mk(16, 16, (x, w, h) => {
    const n = fbm(w, h, 161, [8, 4]);
    pixels(x, w, h, (i, j) => { const v = n(i, j); return v > 0.6 ? [C(70 + v * 30), C(110 + v * 40), C(90 + v * 30)] : [C(130 + v * 60), C(88 + v * 40), C(45)]; });
  }),
  // Dying celestial fire: dark ash-crust plates drifting over a molten core
  sun: () => mk(128, 64, (x, w, h) => {
    const n = fbm(w, h, 171, [32, 16, 8, 4]), m = fbm(w, h, 175, [8, 4, 2]);
    pixels(x, w, h, (i, j) => { const v = n(i, j), k = m(i, j); if (v > 0.56) { const c = 50 + k * 40; return [C(c + 20), C(c * 0.7), C(c * 0.6)]; } if (v > 0.535) return [255, 170, 70]; return [C(200 + k * 55), C(70 + k * 70), C(20 + k * 20)]; });
  }, { mip: true }),
  sunE: () => mk(128, 64, (x, w, h) => {
    const n = fbm(w, h, 171, [32, 16, 8, 4]), m = fbm(w, h, 175, [8, 4, 2]);
    pixels(x, w, h, (i, j) => { const v = n(i, j), k = m(i, j); if (v > 0.56) return [C(60 + k * 30), C(14 + k * 8), 2]; if (v > 0.535) return [255, 190, 90]; return [C(210 + k * 45), C(80 + k * 80), C(22 + k * 25)]; });
  }, { mip: true }),
  // Chain iron
  chain: () => mk(8, 8, (x, w, h) => { const r = rng(181); pixels(x, w, h, () => { const v = 0.22 + r() * 0.12; return [C(v * 210), C(v * 195), C(v * 190)]; }); }),
  // Glowing window (pointed gothic tracery), alpha-less
  window: () => mk(16, 32, (x, w, h) => {
    pixels(x, w, h, (i, j) => {
      const cx = i - 7.5; const top = j < 8 ? (Math.abs(cx) < 8 - Math.sqrt(Math.max(0, 64 - (8 - j) * (8 - j))) * 0 && (cx * cx + (j - 8) * (j - 8) * 1.4 < 60)) : true;
      const inside = j >= 8 ? Math.abs(cx) < 6.5 : (cx * cx * 0.8 + (j - 8) * (j - 8) * 1.2 < 46);
      if (!inside) return [20, 16, 16];
      if (Math.abs(cx) < 0.8 || j % 10 === 0) return [40, 20, 15];
      return [255, C(110 + j * 2), 40];
    });
  }),
  rose: () => mk(32, 32, (x, w, h) => {
    pixels(x, w, h, (i, j) => {
      const dx = i - 15.5, dy = j - 15.5, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
      if (r > 15) return [20, 16, 16]; if (r > 13.5) return [45, 35, 32];
      const spoke = Math.abs(Math.sin(a * 6)) < 0.18 || Math.abs(r - 7) < 0.8;
      if (spoke) return [50, 25, 18]; return [255, C(80 + r * 6), C(30 + r * 2)];
    });
  }),
  // Mural: carved relief panels telling the keeper's fate (embossed in canvas)
  mural: () => mk(384, 192, (x, w, h) => {
    const hm = document.createElement('canvas'); hm.width = w; hm.height = h; const g = hm.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const PW = 128;
    g.lineWidth = 4; for (let p = 0; p < 3; p++) g.strokeRect(p * PW + 6, 6, PW - 12, h - 12);
    const helmKnight = (cx, by, s, seated) => {
      g.beginPath();
      g.moveTo(cx, by - 92 * s); g.lineTo(cx + 9 * s, by - 82 * s); g.lineTo(cx + 8 * s, by - 70 * s); // prow helm
      g.lineTo(cx + 22 * s, by - 64 * s); g.lineTo(cx + 20 * s, by - 36 * s);
      if (seated) { g.lineTo(cx + 30 * s, by - 34 * s); g.lineTo(cx + 30 * s, by); g.lineTo(cx + 20 * s, by); g.lineTo(cx + 18 * s, by - 22 * s); g.lineTo(cx - 18 * s, by - 22 * s); g.lineTo(cx - 20 * s, by); g.lineTo(cx - 30 * s, by); g.lineTo(cx - 30 * s, by - 34 * s); }
      else { g.lineTo(cx + 14 * s, by - 2 * s); g.lineTo(cx + 4 * s, by); g.lineTo(cx, by - 30 * s); g.lineTo(cx - 4 * s, by); g.lineTo(cx - 14 * s, by - 2 * s); }
      g.lineTo(cx - 20 * s, by - 36 * s); g.lineTo(cx - 22 * s, by - 64 * s); g.lineTo(cx - 8 * s, by - 70 * s); g.lineTo(cx - 9 * s, by - 82 * s); g.closePath(); g.fill();
      g.fillRect(cx - 1.5 * s, by - 104 * s, 3 * s, 14 * s); // keel crest
    };
    const sun = (cx, cy, r) => { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.fillRect(cx + Math.cos(a) * (r + 5) - 2, cy + Math.sin(a) * (r + 5) - 2, 4, 4); } };
    const chains = (cx, cy, pts) => { g.lineWidth = 3; g.setLineDash([5, 3]); for (const [ex, ey] of pts) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke(); } g.setLineDash([]); };
    // Panel I — the wanderer kneels before the chained heart
    sun(64, 40, 20); chains(64, 40, [[30, 120], [98, 120]]);
    helmKnight(64, 176, 0.62, false);
    g.fillRect(24, 176, 80, 6);
    // Panel II — the keeper burns upon the seat; fire climbs the chains
    sun(192, 34, 18); chains(192, 34, [[150, 96], [234, 96]]);
    g.fillRect(146, 92, 12, 84); g.fillRect(226, 92, 12, 84); g.fillRect(146, 170, 92, 10);
    helmKnight(192, 168, 0.58, true);
    for (let f = 0; f < 9; f++) { const fx = 152 + f * 10; g.beginPath(); g.moveTo(fx - 5, 120); g.lineTo(fx + (f % 2 ? 3 : -2), 58 + (f % 3) * 10); g.lineTo(fx + 5, 120); g.fill(); }
    // Panel III — ages later: the empty seat, and the bell-laden beast crawling away
    g.fillRect(274, 30, 10, 60); g.fillRect(340, 30, 10, 60); g.fillRect(274, 86, 76, 8);
    g.beginPath(); g.moveTo(268, 168); g.quadraticCurveTo(300, 104, 368, 136); g.lineTo(370, 150); g.quadraticCurveTo(310, 128, 282, 176); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(272, 160); g.lineTo(254, 172); g.lineTo(262, 156); g.lineTo(248, 158); g.lineTo(270, 148); g.fill(); // head with open jaw
    g.fillRect(266, 140, 6, 10);
    for (let b = 0; b < 6; b++) { const bx = 292 + b * 13, byy = 122 - Math.sin(b * 0.7 + 0.5) * 7 + b * 2; g.fillRect(bx, byy - 12, 3, 10); g.beginPath(); g.moveTo(bx - 5, byy + 7); g.lineTo(bx + 1, byy - 4); g.lineTo(bx + 7, byy + 7); g.fill(); }
    for (const lx of [286, 302, 338, 352]) g.fillRect(lx, 160, 5, 18);
    const hd = g.getImageData(0, 0, w, h).data, n = fbm(w, h, 191, [48, 24, 12, 6]);
    const H0 = (i, j) => hd[((Math.min(h - 1, Math.max(0, j))) * w + Math.min(w - 1, Math.max(0, i))) * 4] / 255;
    pixels(x, w, h, (i, j) => {
      const sh = H0(i, j) - H0(i - 2, j - 2); const base = 0.34 + (n(i, j) - 0.5) * 0.3 + H0(i, j) * 0.12;
      const v = base + sh * 0.38; return [C(v * 235), C(v * 212), C(v * 196)];
    });
  }),
  ironCrack: () => mk(32, 32, (x, w, h) => {
    const cr = fbm(w, h, 211, [16, 8, 4]);
    pixels(x, w, h, (i, j) => { const k = Math.abs(cr(i, j) - 0.5); return k < 0.025 ? [255, 150, 50] : k < 0.045 ? [110, 36, 6] : [0, 0, 0]; });
  }),
  black: () => mk(4, 4, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 4, 4); }),
  white: () => mk(4, 4, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); }),
  clouds: () => mk(128, 128, (x, w, h) => {
    const n = fbm(w, h, 201, [64, 32, 16, 8, 4]);
    pixels(x, w, h, (i, j) => { const v = n(i, j); return [C(v * 255), C(v * 255), C(v * 255)]; });
  }, { mip: true, linear: true }),
};
