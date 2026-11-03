// VHALDREN — Episode 3: the forgotten fortress on its crag and the armory inside.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, quadsGeo, particles } from '/the-last-ember/render/src/engine.js';
import { T } from '/the-last-ember/render/src/textures.js';
import { archGeo, sky } from '/the-last-ember/render/src/world.js';
import { T2, mountains, ridged } from '/the-silent-kingdom/render/src/kingdom.js';

// ---------------------------------------------------------------- the fortress (exterior)
export function fortress(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 31);
  const S = mat({ map: T('darkstone'), color: 0xb0b4bc, fogScale: o.fogScale ?? 1 });
  const roof = mat({ map: T('roof'), color: 0x7a7a84, fogScale: o.fogScale ?? 1 });
  const parts = [], roofs = [];
  const jag = (geo, h, amt) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > h - 0.01) p.setY(i, h - R() * amt); geo.computeVertexNormals(); return geo; };
  // curtain walls around a rectangle, gate on +z
  const W = 70, D = 90, H = 26;
  const wall = (x, z, len, ry) => { parts.push(xf(jag(box(len, H, 6, 'bottom'), H, 3), { p: [x, 0, z], r: [0, ry, 0] })); for (let c = -len / 2 + 2; c < len / 2; c += 4) parts.push(xf(box(2, 2.4, 6.4, 'bottom'), { p: [x + Math.cos(ry) * c, H, z - Math.sin(ry) * c], r: [0, ry, 0] })); };
  wall(-W / 2 - 12, D / 2, W / 2 - 6, 0); wall(W / 2 + 12, D / 2, W / 2 - 6, 0); wall(0, -D / 2, W, 0); wall(-W / 2, 0, D, Math.PI / 2); wall(W / 2, 0, D, Math.PI / 2);
  // corner towers (some broken)
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) { const h = 40 + R() * 14; parts.push(xf(jag(prism(10, 8, 9, h), h, R() < 0.5 ? 8 : 0.5), { p: [x, 0, z] })); if (R() < 0.6) roofs.push(xf(prism(10, 9.5, 0.3, 16), { p: [x, h - 0.5, z] })); }
  // gatehouse with twin towers and the great doors
  for (const sx of [-1, 1]) { parts.push(xf(box(12, 38, 14, 'bottom'), { p: [sx * 10, 0, D / 2 + 2] })); roofs.push(xf(prism(4, 9.5, 0.3, 14), { p: [sx * 10, 38, D / 2 + 2], r: [0, Math.PI / 4, 0] })); }
  parts.push(xf(box(9, 10, 12, 'bottom'), { p: [0, 18, D / 2 + 2] }));
  parts.push(xf(archGeo(8, 1.2, 12, 8), { p: [0, 12, D / 2 + 2] }));
  // the keep (where the armory lies)
  parts.push(xf(jag(box(34, 62, 34, 'bottom'), 62, 4), { p: [0, 0, -8] }));
  for (let c = 0; c < 8; c++) { const a = c / 8 * Math.PI * 2; parts.push(xf(prism(6, 3, 3, 72), { p: [Math.cos(a) * 19, 0, -8 + Math.sin(a) * 19] })); }
  roofs.push(xf(prism(4, 26, 0.5, 30), { p: [0, 62, -8], r: [0, Math.PI / 4, 0] }));
  mesh(merge(parts), S, g); mesh(merge(roofs), roof, g);
  // glowing arrow-slit windows (a last ember of light inside)
  const wins = []; for (let i = 0; i < 26; i++) { const side = i % 4; const x = side < 2 ? (R() - 0.5) * 30 : (side === 2 ? -17.2 : 17.2), z = side < 2 ? (side === 0 ? 9.2 : -25.2) : -8 + (R() - 0.5) * 30; wins.push(xf(box(side < 2 ? 1 : 0.2, 2.6, side < 2 ? 0.2 : 1, 'bottom'), { p: [x, 12 + R() * 40, z] })); }
  mesh(merge(wins), mat({ color: 0x8a6a3a, unlit: true, fogScale: (o.fogScale ?? 1) * 0.7 }), g);
  // the great gate doors (two leaves that swing inward)
  const doorM = mat({ map: T('wood'), color: 0x5a4e48, fogScale: o.fogScale ?? 1 }), ironM = mat({ map: T('iron'), fogScale: o.fogScale ?? 1 });
  const doors = [];
  for (const sx of [-1, 1]) { const piv = group(g, [sx * 4, 0, D / 2 + 3.5]); const leaf = group(piv); mesh(box(4, 12, 0.6, 'bottom'), doorM, leaf, [-sx * 2, 0, 0]); for (const yy of [2, 6, 10]) mesh(box(4, 0.3, 0.7, 'bottom'), ironM, leaf, [-sx * 2, yy, 0]); doors.push({ piv, sx }); }
  // causeway leading to the gate over a ravine
  const cw = [];
  for (let z = D / 2 + 8; z < D / 2 + 150; z += 6) { cw.push(xf(box(8, 1.5, 6, 'top'), { p: [0, 0, z + 3] })); for (const sx of [-1, 1]) cw.push(xf(box(0.8, R() < 0.2 ? 0.4 : 1.0, 6, 'bottom'), { p: [sx * 3.7, 0, z + 3] })); }
  for (let z = D / 2 + 20; z < D / 2 + 150; z += 30) cw.push(xf(taper(9, 9, 7, 7, 120, {}), { p: [0, -121.5, z] }));
  mesh(merge(cw), mat({ map: T('stone'), color: 0xa0a4ac }), g);
  g.userData = { doors, gateZ: D / 2 + 3.5 };
  return g;
}

// ---------------------------------------------------------------- the armory (interior)
export function armory(o = {}) {
  const g = new THREE.Group(); const R = rng(o.seed || 41);
  const S = mat({ map: T('darkstone'), color: 0xa8acb4 }), Sd = mat({ map: T('darkstone'), color: 0xa8acb4, side: THREE.BackSide });
  const floorM = mat({ map: T('stone'), color: 0x8a8e96, affine: 0.5 });
  const L = 54, Wd = 16, Hh = 15;
  // hall shell
  const fl = new THREE.PlaneGeometry(Wd, L, 8, 24); fl.rotateX(-Math.PI / 2); const fu = fl.attributes.uv; for (let i = 0; i < fu.count; i++) fu.setXY(i, fu.getX(i) * 4, fu.getY(i) * 14);
  mesh(fl, floorM, g, [0, 0, -L / 2]);
  const walls = [];
  for (const sx of [-1, 1]) walls.push(xf(box(1, Hh, L, 'bottom'), { p: [sx * (Wd / 2 + 0.5), 0, -L / 2] }));
  walls.push(xf(box(Wd + 2, Hh, 1, 'bottom'), { p: [0, 0, -L - 0.5] }));
  // entrance wall with a doorway (3.2 m either side of centre, 7.5 m tall)
  const side = (Wd + 2) / 2 - 3.2; for (const sx of [-1, 1]) walls.push(xf(box(side, Hh, 1, 'bottom'), { p: [sx * (3.2 + side / 2), 0, 0.5] }));
  walls.push(xf(box(6.4, Hh - 7.5, 1, 'bottom'), { p: [0, 7.5, 0.5] }));
  // vaulted ceiling
  const vault = new THREE.CylinderGeometry(Wd / 2, Wd / 2, L, 8, 1, true, -Math.PI / 2, Math.PI); vault.rotateX(Math.PI / 2); vault.rotateZ(0);
  const vu = vault.attributes.uv; for (let i = 0; i < vu.count; i++) vu.setXY(i, vu.getX(i) * 6, vu.getY(i) * 14);
  mesh(flat(vault), Sd, g, [0, Hh - 2, -L / 2]);
  // pillars + pointed arches along both sides
  const pil = [];
  for (let z = -4; z > -L + 2; z -= 6) for (const sx of [-1, 1]) { pil.push(xf(prism(6, 0.8, 0.7, Hh - 3), { p: [sx * (Wd / 2 - 1.2), 0, z] })); pil.push(xf(box(2, 0.8, 2, 'bottom'), { p: [sx * (Wd / 2 - 1.2), 0, z] })); }
  for (let z = -4; z > -L + 8; z -= 6) for (const sx of [-1, 1]) pil.push(xf(archGeo(5.2, 0.7, 1.4, 6), { p: [sx * (Wd / 2 - 1.2), Hh - 6.5, z - 3], r: [0, Math.PI / 2, 0] }));
  mesh(merge([...walls, ...pil]), S, g);
  // the entrance: great stone doors at z = 0
  const doorM = mat({ map: T('darkstone'), color: 0x8a8e98 });
  const doors = [];
  for (const sx of [-1, 1]) { const piv = group(g, [sx * 3.2, 0, -0.1]); const leaf = group(piv); mesh(box(3.2, 7.5, 0.6, 'bottom'), doorM, leaf, [-sx * 1.6, 0, 0]); mesh(box(2.4, 0.3, 0.7, 'bottom'), mat({ map: T('iron') }), leaf, [-sx * 1.6, 3.5, 0]); doors.push({ piv, sx }); }
  const doorLight = mesh(new THREE.PlaneGeometry(9, 11), mat({ color: 0x9aa8c0, unlit: true }), g, [0, 4.5, 6.0], [0, Math.PI, 0]);
  // high windows with shafts of pale light (left wall), and the great window behind the dais
  const shafts = [];
  const shaftM = mat({ color: 0xa8b8d0, unlit: true, additive: true, opacity: 0.17, side: THREE.DoubleSide });
  for (let z = -8; z > -L + 8; z -= 12) { mesh(box(0.3, 3.2, 1.4, 'bottom'), mat({ color: 0xb0c0d8, unlit: true }), g, [-Wd / 2 + 0.05, 10, z]); const sh = mesh(new THREE.PlaneGeometry(1.6, 16), shaftM, g, [-2.5, 5.5, z], [0, Math.PI / 2, -0.62]); shafts.push(sh); }
  mesh(merge([xf(box(3.2, 6, 0.3, 'bottom'), { p: [0, 7, -L + 0.05] })]), mat({ color: 0xc8d4e8, unlit: true }), g);
  const beamM = mat({ color: 0xc0d0e8, unlit: true, additive: true, opacity: 0.16, side: THREE.DoubleSide });
  const beam = mesh(new THREE.PlaneGeometry(3.4, 12), beamM, g, [0, 5.0, -L + 4], [-0.55, 0, 0]);
  const beam2 = mesh(new THREE.PlaneGeometry(3.4, 12), beamM, g, [0, 5.0, -L + 4], [-0.55, Math.PI / 2, 0]);
  // the dais at the end
  const dais = []; for (let k = 0; k < 4; k++) dais.push(xf(box(8 - k * 1.4, 0.35, 6 - k * 1.0, 'bottom'), { p: [0, k * 0.35, -L + 5.5] }));
  mesh(merge(dais), S, g);
  // debris of a fallen order: broken swords, dented shields, scattered helms and plates, toppled racks
  const rust = mat({ map: T('rust'), color: 0xb0a8a0 }), iron = mat({ map: T('iron'), color: 0xb8b8c0 }), wood = mat({ map: T('wood'), color: 0x6a5a50 });
  const dRust = [], dIron = [], dWood = [];
  for (let i = 0; i < 180; i++) {
    const x = (R() - 0.5) * (Wd - 3), z = -3 - R() * (L - 12); if (Math.abs(x) < 1.6 && R() < 0.85) continue; // keep a walking path
    const k = R(), ry = R() * 6.28;
    if (k < 0.35) dIron.push(xf(box(0.06, 0.02, 0.5 + R() * 0.5, 'bottom'), { p: [x, 0, z], r: [0, ry, 0] }));                                   // broken blades
    else if (k < 0.55) dRust.push(xf(flat(new THREE.CylinderGeometry(0.28, 0.32, 0.05, 6)), { p: [x, 0.03, z], r: [R() - 0.5, ry, R() - 0.5] })); // round shields
    else if (k < 0.72) { const hg = new THREE.SphereGeometry(0.13, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6); dIron.push(xf(flat(hg), { p: [x, 0.0, z], r: [R() * 2.5, ry, 0] })); } // helms
    else if (k < 0.86) dRust.push(xf(taper(0.38, 0.22, 0.44, 0.24, 0.3), { p: [x, 0.0, z], r: [1.5, ry, 0] }));                                // breastplates on their backs
    else dIron.push(xf(box(0.04, 0.9, 0.12, 'bottom'), { p: [x, 0, z], r: [0.8 + R() * 0.6, ry, 0] }));                                           // spears/poles
  }
  // weapon racks with broken swords and shields hung on the walls
  for (let z = -7; z > -L + 10; z -= 6) for (const sx of [-1, 1]) {
    if (R() < 0.3) continue;
    const x = sx * (Wd / 2 - 2.6);
    dWood.push(xf(box(0.12, 1.6, 2.4, 'bottom'), { p: [x, 0, z] }), xf(box(0.2, 0.1, 2.6, 'bottom'), { p: [x, 1.5, z] }), xf(box(0.2, 0.1, 2.6, 'bottom'), { p: [x, 0.6, z] }));
    for (let s = 0; s < 4; s++) if (R() < 0.75) dIron.push(xf(box(0.04, 0.6 + R() * 0.7, 0.06, 'bottom'), { p: [x + sx * 0.1, 0.3, z - 0.9 + s * 0.6], r: [R() * 0.2 - 0.1, 0, sx * (0.05 + R() * 0.2)] }));
    dRust.push(xf(taper(0.6, 0.06, 0.7, 0.06, 0.9, { anchor: 'center' }), { p: [sx * (Wd / 2 - 0.1), 3.2 + R(), z + 3], r: [0, Math.PI / 2, (R() - 0.5) * 0.4] }));
  }
  mesh(merge(dRust), rust, g); mesh(merge(dIron), iron, g); mesh(merge(dWood), wood, g);
  // tattered banners of the order hanging between arches
  const banM = mat({ map: T('rags'), color: 0x7a8aa0, alphaTest: 0.5, side: THREE.DoubleSide });
  for (let z = -10; z > -L + 8; z -= 12) for (const sx of [-1, 1]) mesh(taper(1.6, 0.02, 1.8, 0.02, 4.5, { anchor: 'top' }), banM, g, [sx * (Wd / 2 - 0.6), Hh - 3, z], [0, Math.PI / 2, 0]);
  // braziers (cold) near the dais
  for (const sx of [-1, 1]) mesh(prism(6, 0.4, 0.6, 1.1), iron, g, [sx * 3.4, 0, -L + 9]);
  g.add(particles({ mode: 'drift', count: 500, box: v3(Wd, Hh, L), vel: v3(0.05, -0.05, 0.02), size: 0.025, c0: 0xc8ccd4, origin: v3(0, Hh / 2, -L / 2), additive: true, opacity: 0.55, swirl: 0.4, seed: 91, fogMix: 0.5 }));
  g.userData = { doors, doorLight, beam, beam2, L, daisTop: v3(0, 1.4, -L + 5.5) };
  return g;
}
