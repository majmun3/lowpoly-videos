// VHALDREN — Episode 2: THE SILENT KINGDOM — shot list.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, xf, merge, flat, taper } from '/the-last-ember/render/src/engine.js';
import { T } from '/the-last-ember/render/src/textures.js';
import { buildKnight, updateKnight, applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { sky, terrain, hnoise } from '/the-last-ember/render/src/world.js';
import { T2, city, mountains, ridged, buildStilled, stilledMaterials, SEATED_STILL, STAND_STILL, setSkirt, streetHouse, streetMaterials, frozenFountain, lantern, table, bench, stillwork, animateStillwork, buildBell, lightPoints } from './kingdom.js';

// ---------------------------------------------------------------- helpers (same conventions as Episode 1)
const cam = (fov, near = 0.1, far = 7000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
const lanternLight = (k, i = 0, power = 1.3, t = 0) => { const p = k.lantern.getWorldPosition(v3()); setPL(i, p, 0xff8a30, 4.5, power * (0.9 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23) * 0.04)); return p; };
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
const snowfall = (o = {}) => particles({ mode: 'drift', count: o.count ?? 900, box: o.box || v3(26, 16, 26), vel: o.vel || v3(0.3, -1.1, 0.15), size: o.size ?? 0.035, c0: 0xe8eeff, origin: o.origin || v3(0, 6, 0), additive: false, opacity: o.opacity ?? 0.9, swirl: o.swirl ?? 0.5, seed: o.seed ?? 12, fogMix: 0.5 });
const motes = (o = {}) => particles({ mode: 'drift', count: o.count ?? 160, box: o.box || v3(20, 14, 20), vel: o.vel || v3(0, 0.5, 0), size: o.size ?? 0.04, c0: 0xffc060, origin: o.origin || v3(0, 4, 0), swirl: 1, seed: o.seed ?? 33, fogMix: 0.2 });
function burst(origin, start, o = {}) { return particles({ mode: 'burst', count: o.count ?? 160, origin, start, spread: o.spread ?? v3(1.5, 1.5, 1.5), vel: v3(0, o.fall ?? 0.6, 0), life: o.life ?? 1.4, size: o.size ?? 0.06, c0: o.c0 ?? 0xe8eeff, c1: o.c1 ?? 0xc8d0e0, c2: o.c2 ?? 0x8a94a8, seed: o.seed ?? 41, additive: o.additive ?? false, opacity: o.opacity ?? 0.9 }); }
const GUARD = { hipY: 0.95, spine: [0.12, 0, 0], chest: [0, -0.25, 0], neck: [-0.05, 0.1, 0], armR: [-1.05, -0.25, 0.25], foreR: [-0.85, 0, 0], armL: [-0.95, 0.45, -0.25], foreL: [-1.15, 0, 0], thighL: [-0.45, 0, 0.06], shinL: [0.55, 0, 0], footL: [-0.1, 0, 0], thighR: [0.3, 0, -0.06], shinR: [0.35, 0, 0], footR: [-0.2, 0, 0] };
const OVERHEAD = { ...GUARD, spine: [-0.15, 0, 0], chest: [-0.1, 0, 0], neck: [-0.15, 0, 0], armR: [-3.0, 0.1, 0.15], foreR: [-0.6, 0, 0], armL: [-2.9, -0.1, -0.15], foreL: [-0.8, 0, 0], thighL: [-0.5, 0, 0.08], shinL: [0.45, 0, 0], thighR: [0.35, 0, -0.08], shinR: [0.3, 0, 0] };
const holdLow = (p) => { p.armR = [-0.2, 0, 0.15]; p.foreR = [-0.15, 0, 0]; return p; };

// palettes: cold night blues against muted gold
const NIGHT = { horizon: 0x2c3850, top: 0x060912, bottom: 0x1a2232, cloud: 0x161e2c, cloudLit: 0x4e5e7e, sunCol: 0x141e34 };
const CITY_ENV = { fog: [4, 80], fogCol: 0x2a3448, hfog: [0.5, 4, 0.4, 0.04], lightDir: v3(0.3, -0.7, -0.6), lightCol: 0x8494b8, ambient: 0x343c4e, rim: 0x9a8a62, fillDir: v3(-0.3, -0.3, 0.9), fillCol: 0x2a3244 };

// ---------------------------------------------------------------- the street of Aurelmoor (shared by most city shots)
function streetEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50, 0.1);
  const sk = sky({ ...NIGHT, sunDir: v3(0.2, 0.3, -1), cover: 0.45 }); scene.add(sk);
  const M = streetMaterials(), SM = stilledMaterials();
  scene.add(terrain(400, 40, () => 0, { map: T2('snow'), color: 0xd8e0f0 }));
  // paved street and plaza
  mesh(merge([xf(box(9, 0.06, 64, 'bottom'), { p: [0, 0, -4] }), xf(prism(12, 13, 13, 0.06), { p: [0, 0, -44] })]), M.stone, scene);
  // houses on both sides
  const walls = [], roofs = [], wins = [], beams = [], doors = [];
  let k = 0;
  for (const side of [-1, 1]) for (let z = 18; z > -30; z -= 8.5) {
    const hs = streetHouse(200 + k++); const p = [side * (6.5 + hs.w / 2), 0, z], r = [0, side < 0 ? 0 : Math.PI, 0];
    walls.push(xf(hs.walls, { p, r })); roofs.push(xf(hs.roof, { p, r })); wins.push(xf(hs.wins, { p, r })); beams.push(xf(hs.beams, { p, r })); doors.push(xf(hs.door, { p, r }));
  }
  // plaza buildings (ring) and the city wall/gate behind the street
  for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2; if (Math.abs(Math.sin(ang)) > 0.93 && Math.cos(ang) * 0 === 0 && Math.sin(ang) > 0) continue; const hs = streetHouse(300 + a); const R = 22; const p = [Math.cos(ang) * R, 0, -44 + Math.sin(ang) * R]; walls.push(xf(hs.walls, { p, r: [0, -ang + Math.PI, 0] })); roofs.push(xf(hs.roof, { p, r: [0, -ang + Math.PI, 0] })); wins.push(xf(hs.wins, { p, r: [0, -ang + Math.PI, 0] })); }
  mesh(merge(walls), M.wall, scene); mesh(merge(roofs), M.roof, scene); mesh(merge(wins), M.win, scene); mesh(merge(beams), M.beam, scene); mesh(merge(doors), M.door, scene);
  // gate at the street's mouth
  const gate = [xf(box(10, 16, 5, 'bottom'), { p: [-11, 0, 24] }), xf(box(10, 16, 5, 'bottom'), { p: [11, 0, 24] }), xf(box(32, 5, 5, 'bottom'), { p: [0, 11, 24] }), xf(prism(4, 6, 0.2, 9), { p: [-11, 16, 24], r: [0, Math.PI / 4, 0] }), xf(prism(4, 6, 0.2, 9), { p: [11, 16, 24], r: [0, Math.PI / 4, 0] })];
  mesh(merge(gate), M.stone, scene);
  // frozen fountain in the plaza
  const fountain = frozenFountain(M); fountain.position.set(0, 0, -44); scene.add(fountain);
  // the great bell tower beyond the plaza, with golden windows
  const bt = city({ towers: 30, houses: 60, wallR: 120, fogScale: 0.7, lightSize: 0.7, seed: 21, walls: false }); bt.position.set(0, 0, -215); bt.scale.setScalar(0.85); scene.add(bt);
  // lanterns
  const lamps = [];
  for (const side of [-1, 1]) for (let z = 14; z > -30; z -= 9) { const L = lantern(M); L.position.set(side * 4.4, 0, z + (side > 0 ? 4 : 0)); L.rotation.y = side > 0 ? Math.PI : 0; scene.add(L); lamps.push(L); }
  // tables with seated figures, and figures standing at doors
  const people = [];
  const R = rng(o.seed || 3);
  const tables = [[-2.2, 10], [2.4, 4], [-2.0, -3], [2.2, -10], [-2.3, -17], [2.0, -24]];
  for (const [tx, tz] of tables) {
    const tb = table(M); tb.position.set(tx, 0, tz); tb.rotation.y = Math.PI / 2; scene.add(tb);
    for (const [dx, dz, ry] of [[-0.85, -0.5, Math.PI / 2], [0.85, 0.4, -Math.PI / 2], [-0.85, 0.5, Math.PI / 2]]) {
      if (R() < 0.15) continue;
      const bn = bench(M, 0.7); bn.position.set(tx + dx * 1.05, 0, tz + dz); bn.rotation.y = ry; scene.add(bn);
      const s = buildStilled({ M: SM, snow: true, seed: people.length + 10 }); s.root.position.set(tx + dx * 1.05, 0, tz + dz); s.root.rotation.y = ry;
      applyPose(s, SEATED_STILL); setSkirt(s); scene.add(s.root); people.push({ s, base: SEATED_STILL, ry, seated: true });
      mesh(prism(6, 0.05, 0.06, 0.12), M.brass, scene, [tx + dx * 0.5, 0.84, tz + dz]);
    }
  }
  for (const side of [-1, 1]) for (let z = 16; z > -30; z -= 8.5) {
    if (R() < 0.25) continue;
    const s = buildStilled({ M: SM, snow: true, seed: people.length + 50 }); const ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    s.root.position.set(side * 5.6, 0, z + (R() - 0.5) * 2); s.root.rotation.y = ry + (R() - 0.5) * 0.5;
    applyPose(s, STAND_STILL); setSkirt(s); scene.add(s.root); people.push({ s, base: STAND_STILL, ry: s.root.rotation.y, seated: false });
  }
  for (let a = 0; a < 10; a++) { // in the plaza
    const ang = a / 10 * Math.PI * 2 + 0.3, rr = 9 + R() * 6; const s = buildStilled({ M: SM, snow: true, seed: 90 + a });
    s.root.position.set(Math.cos(ang) * rr, 0, -44 + Math.sin(ang) * rr); s.root.rotation.y = R() * 6; applyPose(s, STAND_STILL); setSkirt(s); scene.add(s.root); people.push({ s, base: STAND_STILL, ry: s.root.rotation.y, seated: false });
  }
  const snowP = snowfall({ count: 900, origin: v3(0, 6, 0) }); scene.add(snowP);
  return { scene, camera, sk, M, SM, people, lamps, fountain, bt };
}
// light the nearest street lanterns around a point
function lampLights(E, p, first = 1, n = 4, power = 1.1) {
  const ls = E.lamps.map(L => L.localToWorld(L.userData.light.clone())).sort((a, b) => a.distanceTo(p) - b.distanceTo(p)).slice(0, n);
  ls.forEach((q, i) => setPL(first + i, q, 0xffb050, 12, power * 1.3));
}
// turn a figure's head (and later its body) toward a world point
function turnToward(P, target, head, body) {
  const s = P.s; const pos = s.root.position; const yaw = Math.atan2(target.x - pos.x, target.z - pos.z);
  let d = yaw - P.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  s.root.rotation.y = P.ry + d * body;
  const rem = d * (1 - body) * head;
  const pose = { ...P.base, neck: [(P.base.neck || [0, 0, 0])[0], clamp(rem * 0.45, -0.9, 0.9), 0], head: [0, clamp(rem * 0.55, -1.0, 1.0), 0] };
  applyPose(s, pose); setSkirt(s);
}

// ---------------------------------------------------------------- S01  HOOK — a blank face in lamplight
function S01() {
  const E = streetEnv({ fov: 28 });
  const P = E.people[0]; const tgt = P.s.head.getWorldPosition(v3());
  return {
    ...E, grade: { sat: 0.8, contrast: 1.2, bloom: 0.9, bloomT: 0.5 }, env: { ...CITY_ENV, fog: [2, 40], ambient: 0x1c2230 },
    update(lt) {
      E.scene.updateMatrixWorld(true);
      const h = P.s.head.getWorldPosition(v3()).add(v3(0, 0.12, 0));
      setPL(0, h.clone().add(v3(0.7, 0.5, 0.9)), 0xffb050, 4, 0.9 * (0.92 + Math.sin(lt * 9) * 0.05));
      lampLights(E, h, 1, 3, 0.9);
      // face-on, slow push into the empty face
      const fwd = v3(Math.sin(P.ry), 0, Math.cos(P.ry));
      aim(E.camera, h.clone().addScaledVector(fwd, lerp(3.6, 2.1, ease(range(lt, 0, 5.5)))).add(v3(0.25, 0.1, 0)), h.clone().add(v3(0, -0.22, 0)));
    },
  };
}

// ---------------------------------------------------------------- mountain pass builder (S02, S03)
function mountainEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50, 0.2, 9000);
  scene.add(sky({ ...NIGHT, sunDir: v3(0.3, 0.2, -1), cover: 0.35, cloudScale: 0.25 }));
  const rd = ridged(17);
  const hf = (x, z) => {
    const dv = Math.sqrt(x * x + (z + 700) * (z + 700)), ring = clamp((dv - 330) / 250);
    const M = rd(x, z) * 125 * ring - 20 + ring * 30;
    const P = z > -62 ? 90 + (z + 62) * 0.12 : Math.max(-20, 90 - (-62 - z) * 0.41);
    const wdt = 22 + Math.max(0, -62 - z) * 0.6, pass = Math.exp(-(x * x) / (wdt * wdt)) * clamp((z + 380) / 40);
    return lerp(M, P + rd(x * 3, z * 3) * 1.5, pass);
  };
  scene.add(mountains(2400, 220, hf, { tile: 30, cx: 0, cz: -30 }));
  const ct = city({ fogScale: 0.55, lightSize: 1.6 }); ct.position.set(0, -20, -700); scene.add(ct);
  // rocks along the pass
  const R = rng(4), rocks = [];
  for (let i = 0; i < 70; i++) { const x = (R() - 0.5) * 60, z = 60 - R() * 140; if (Math.abs(x) < 3.5) continue; const s = 0.8 + R() * 3; rocks.push(xf(flat(new THREE.DodecahedronGeometry(s, 0)), { p: [x, hf(x, z) + s * 0.3, z], r: [R() * 3, R() * 3, R() * 3], s: [1, 0.6 + R() * 0.6, 1] })); }
  mesh(merge(rocks), mat({ map: T2('rock'), color: 0xb0b8c8 }), scene);
  return { scene, camera, hf, city: ct };
}
const MOUNTAIN_ENV = { fog: [10, 420], fogCol: 0x2c3648, hfog: [-30, 60, 0.6, 0.004], lightDir: v3(0.4, -0.6, -0.7), lightCol: 0x7080a0, ambient: 0x262c3a, rim: 0x8a9ab8, fillDir: v3(-0.3, -0.3, 1), fillCol: 0x1a2030 };

// ---------------------------------------------------------------- S02  the frozen pass (blizzard)
function S02() {
  const E = mountainEnv({ fov: 46 });
  const k = buildKnight(); E.scene.add(k.root);
  E.scene.add(particles({ mode: 'drift', count: 1600, box: v3(20, 12, 20), vel: v3(7, -2.0, 2.5), size: 0.03, c0: 0xe8eeff, origin: v3(0, 4, 0), additive: false, opacity: 0.85, swirl: 1.5, seed: 61, fogMix: 0.4 }));
  return {
    ...E, grade: { sat: 0.7, contrast: 1.15, bloom: 0.6 }, env: { ...MOUNTAIN_ENV, fog: [3, 70], fogCol: 0x4a5468 },
    update(lt) {
      const z = 26 - lt * 0.95, y = E.hf(0, z) - 0.25;
      k.root.position.set(0.2, y, z); k.root.rotation.y = 0.05;
      const p = holdLow(walkPose(lt * 0.7, { stride: 0.38, hunch: 0.32 })); p.armL = [-0.2, 0, -0.35]; applyPose(k, p);
      k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 1.5, swing: 0.4, back: 0.6, side: 0.5 });
      lanternLight(k, 0, 1.5, lt);
      aim(E.camera, v3(1.3, y + 1.0, z + 4.0 - lt * 0.1), v3(0.1, y + 1.5, z - 2));
    },
  };
}
// ---------------------------------------------------------------- S03  Aurelmoor appears beyond the peaks
function S03() {
  const E = mountainEnv({ fov: 50 });
  const k = buildKnight(); E.scene.add(k.root);
  E.scene.add(particles({ mode: 'drift', count: 700, box: v3(30, 16, 30), vel: v3(3, -1.2, 1), size: 0.035, c0: 0xe8eeff, origin: v3(0, 4, -60), additive: false, opacity: 0.8, swirl: 1.2, seed: 62, fogMix: 0.4 }));
  const z0 = -62, y0 = E.hf(0, z0) - 0.2;
  return {
    ...E, grade: { sat: 0.82, contrast: 1.15, bloom: 1.0, bloomT: 0.45 }, env: MOUNTAIN_ENV,
    update(lt) {
      k.root.position.set(0.8, y0, z0); k.root.rotation.y = Math.PI + 0.1;
      const p = holdLow(walkPose(0, { stride: 0 })); p.neck = [0.12, 0, 0]; applyPose(k, p);
      k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 1.0, swing: 0.1, back: 0.4 });
      lanternLight(k, 0, 1.4, lt);
      const u = ease(range(lt, 0, 3.8));
      aim(E.camera, v3(lerp(1.35, 1.15, u), y0 + lerp(1.9, 2.5, u), z0 + lerp(4.6, 3.8, u)), v3(-0.3, lerp(y0 - 12, y0 - 30, u), -700));
    },
  };
}

// ---------------------------------------------------------------- S04  through the gate, past the frozen fountain
function S04() {
  const E = streetEnv({ fov: 54 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.8, contrast: 1.15, bloom: 0.8 }, env: CITY_ENV,
    update(lt) {
      const z = 25 - lt * 1.25; k.root.position.set(0.4, 0, z);
      applyPose(k, holdLow(walkPose(lt * 0.82, { stride: 0.42, hunch: 0.14 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.6, swing: 0.3 });
      lanternLight(k, 0, 1.2, lt); lampLights(E, v3(0, 2, z - 4), 1, 4, 1.0);
      aim(E.camera, v3(-1.8, 0.6, z - 5.5 + lt * 0.4), v3(0.3, 2.6, z + 2));
    },
  };
}
// ---------------------------------------------------------------- S05  nobody spoke, nobody moved
function S05() {
  const E = streetEnv({ fov: 44 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.78, contrast: 1.15, bloom: 0.8 }, env: CITY_ENV,
    update(lt) {
      const z = 13 - lt * 1.1; k.root.position.set(0.2, 0, z);
      applyPose(k, holdLow(walkPose(lt * 0.8, { stride: 0.4, hunch: 0.12 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.5, swing: 0.3 });
      lanternLight(k, 0, 1.2, lt); lampLights(E, v3(0, 2, z), 1, 5, 1.0);
      aim(E.camera, v3(1.4 - lt * 0.1, 2.9, z + 5.2), v3(-0.4, 0.9, z - 12));
    },
  };
}
// ---------------------------------------------------------------- S06  snow on their shoulders
function S06() {
  const E = streetEnv({ fov: 36 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  const P = E.people.find(p => p.seated && Math.abs(p.s.root.position.z - 4.4) < 1.2) || E.people[2];
  return {
    ...E, grade: { sat: 0.78, contrast: 1.2, bloom: 0.8 }, env: CITY_ENV,
    update(lt) {
      const z = 7.2 - lt * 0.85; k.root.position.set(0.15, 0, z);
      applyPose(k, holdLow(walkPose(lt * 0.7, { stride: 0.34, hunch: 0.1 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.4, swing: 0.25 });
      lanternLight(k, 0, 1.3, lt); lampLights(E, v3(1.5, 2, 4), 1, 4, 1.1);
      E.scene.updateMatrixWorld(true);
      const sh = P.s.chest.getWorldPosition(v3()).add(v3(0, 0.3, 0));
      aim(E.camera, sh.clone().add(v3(1.25 - lt * 0.1, 0.35, -1.3 + lt * 0.15)), sh.clone().add(v3(-0.9, 0.15, 0.2)));
    },
  };
}
// ---------------------------------------------------------------- S07  then one of them turned its head
function S07() {
  const E = streetEnv({ fov: 34 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  const P = E.people.find(p => !p.seated && p.s.root.position.x > 0 && p.s.root.position.z < 0 && p.s.root.position.z > -14) || E.people.find(p => !p.seated);
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 0.8 }, env: { ...CITY_ENV, fog: [3, 50] },
    update(lt) {
      const z = 2 - lt * 0.6; k.root.position.set(-0.6, 0, z);
      applyPose(k, holdLow(walkPose(lt * 0.6, { stride: 0.3, hunch: 0.1 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.4, swing: 0.2 });
      lanternLight(k, 0, 1.2, lt);
      E.scene.updateMatrixWorld(true);
      const turn = smooth(range(lt, 0.9, 2.3));
      const tgtCam = E.camera.position.clone();
      turnToward(P, tgtCam, turn, 0);
      const h = P.s.head.getWorldPosition(v3()).add(v3(0, 0.12, 0));
      setPL(1, h.clone().add(v3(-1.5, 1.2, 1.0)), 0xffb050, 6, 1.2);
      const side = v3(-Math.cos(P.ry), 0, Math.sin(P.ry));
      const u = ease(range(lt, 0, 3.9));
      aim(E.camera, h.clone().addScaledVector(side, -lerp(3.2, 1.6, u)).add(v3(0, 0.05, 0)), h.clone().add(v3(0, -0.02, 0)));
    },
  };
}
// ---------------------------------------------------------------- S08  every soul turned toward me
function S08() {
  const E = streetEnv({ fov: 50 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 0.85 }, env: CITY_ENV,
    update(lt) {
      k.root.position.set(0, 0, -6);
      applyPose(k, holdLow(walkPose(0, { stride: 0 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.4, swing: 0.05 });
      lanternLight(k, 0, 1.4, lt); lampLights(E, v3(0, 2, -6), 1, 5, 1.0);
      const me = k.root.position.clone().add(v3(0, 1.6, 0));
      E.people.forEach((P, i) => { const d = P.s.root.position.distanceTo(k.root.position); const t0 = 0.3 + d * 0.06 + (i % 5) * 0.08; const w = smooth(range(lt, t0, t0 + 0.9)); turnToward(P, me, w, P.seated ? 0 : w * 0.6); });
      const u = ease(range(lt, 0, 3.6));
      aim(E.camera, v3(lerp(5, 3, u), lerp(11, 8, u), lerp(-16, -15, u)), v3(0, 0.8, -5));
    },
  };
}
// ---------------------------------------------------------------- S09  steel
function S09() {
  const E = streetEnv({ fov: 34 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; k.root.position.set(0, 0, -6); E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.8, contrast: 1.25, bloom: 1.0, bloomT: 0.45 }, env: { ...CITY_ENV, rim: 0xa08a5a },
    update(lt) {
      const u = easeOut(range(lt, 0.05, 0.45));
      applyPose(k, mixPose(holdLow(walkPose(0, { stride: 0 })), GUARD, u));
      k.sword.rotation.set(lerp(Math.PI / 2 + 1.25, Math.PI / 2 + 0.1, u), 0, 0);
      updateKnight(k, lt, { wind: 0.6, swing: 0.15 });
      k.M.slit.uniforms.uEmissive.value.setRGB(1, 0.42, 0.12).multiplyScalar(0.6 + u * 0.9);
      k.M.vein.uniforms.uEmissive.value.setRGB(1, 0.45, 0.15).multiplyScalar(1 + u * 1.2);
      lanternLight(k, 0, 1.5, lt); lampLights(E, v3(0, 2, -6), 1, 3, 1.0);
      aim(E.camera, v3(0.9, 0.95, -8.4), v3(0.1, 1.65, -5.9));
    },
  };
}
// ---------------------------------------------------------------- S10  the Wakebell rings
function S10() {
  const scene = new THREE.Scene(), camera = cam(58, 0.5);
  scene.add(sky({ ...NIGHT, sunDir: v3(0, 0.6, -1), cover: 0.4 }));
  const ct = city({ towers: 50, houses: 120, wallR: 140, fogScale: 0.75, lightSize: 0.8, seed: 23 }); ct.position.set(0, 0, 0); scene.add(ct);
  scene.add(terrain(800, 30, () => 0, { map: T2('snow'), color: 0xc8d0e4 }));
  const bell = ct.userData.bell, bp = ct.userData.bellPos;
  scene.add(burst(v3(0, 104, -10), 0.15, { count: 600, spread: v3(40, 10, 40), life: 2.2, size: 0.4, fall: 1.2 }));
  const ring = mesh(new THREE.RingGeometry(0.9, 1.0, 32), mat({ color: 0xffe0a0, emissive: 0xffd080, unlit: true, additive: true, side: THREE.DoubleSide, opacity: 0.6 }), scene, [0, 116, -10], [Math.PI / 2, 0, 0]);
  return {
    scene, camera, grade: { sat: 0.82, contrast: 1.2, bloom: 1.0, bloomT: 0.45 },
    env: { fog: [20, 600], fogCol: 0x222c3e, hfog: [5, 30, 0.5, 0.004], lightDir: v3(0.3, -0.5, -0.8), lightCol: 0x6a7a9c, ambient: 0x242a38, rim: 0xa08a5a },
    update(lt) {
      const sw = Math.sin(lt * 3.2) * 0.5 * Math.exp(-lt * 0.2) - 0.45 * Math.exp(-lt * 8);
      bell.userData.pivot.rotation.x = sw; bell.userData.clap.rotation.x = -sw * 0.6;
      const k = range(lt, 0.15, 1.8); const rs = 1 + k * 160; ring.scale.set(rs, rs, rs); ring.material.uniforms.uOpacity.value = 0.55 * (1 - k);
      setPL(0, v3(0, 118, -10), 0xffc070, 50, 1.0);
      aim(camera, v3(14, 6, 70), v3(0, 105, -10));
      shake(camera, 0.25 * Math.exp(-lt * 2.5) * (lt > 0.15 ? 1 : 0), lt);
    },
  };
}
// ---------------------------------------------------------------- S11  they came for me...
function S11() {
  const E = streetEnv({ fov: 54 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; k.root.position.set(0, 0, -6); E.scene.add(k.root);
  const close = E.people.filter(P => P.s.root.position.distanceTo(k.root.position) < 16).slice(0, 14);
  close.forEach((P, i) => { P.p0 = P.s.root.position.clone(); const a = i / close.length * Math.PI * 2; P.p1 = v3(Math.sin(a) * 2.6, 0, -6 + Math.cos(a) * 2.6); });
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 0.85 }, env: CITY_ENV,
    update(lt) {
      const look = Math.sin(lt * 1.6) * 0.6;
      const g = { ...GUARD, chest: [0, -0.25 + look * 0.5, 0], neck: [-0.05, look, 0] };
      applyPose(k, g); k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0); k.root.rotation.y = Math.PI + Math.sin(lt * 0.9) * 0.6;
      updateKnight(k, lt, { wind: 0.5, swing: 0.1 });
      lanternLight(k, 0, 1.5, lt); lampLights(E, v3(0, 2, -6), 1, 5, 1.0);
      const me = k.root.position.clone().add(v3(0, 1.6, 0));
      close.forEach((P, i) => {
        const u = smooth(range(lt, 0.1 + (i % 4) * 0.15, 3.0));
        P.s.root.position.lerpVectors(P.p0, P.p1, u);
        P.ry = Math.atan2(me.x - P.s.root.position.x, me.z - P.s.root.position.z); P.base = STAND_STILL;
        const wp = walkPose(lt * 0.55 + i * 0.37, { stride: 0.22 * (1 - u * 0.8), hunch: 0.05, hip: 1.0 });
        wp.armL = [-0.3, 0, -0.1]; wp.armR = [-0.3, 0, 0.1]; applyPose(P.s, wp); P.s.root.rotation.y = P.ry; setSkirt(P.s);
      });
      const u = ease(range(lt, 0, 3.1));
      aim(E.camera, v3(lerp(2.5, 1.2, u), lerp(6.5, 4.5, u), lerp(1.5, 0.0, u)), v3(0, 1.0, -6));
    },
  };
}
// ---------------------------------------------------------------- S12  ...but they did not attack. They pointed down.
function S12() {
  const E = streetEnv({ fov: 50 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; k.root.position.set(0, 0, -6); E.scene.add(k.root);
  const close = E.people.filter(P => P.s.root.position.distanceTo(k.root.position) < 16).slice(0, 14);
  const me = v3(0, 1.6, -6);
  close.forEach((P, i) => { const a = i / close.length * Math.PI * 2; P.s.root.position.set(Math.sin(a) * 2.6, 0, -6 + Math.cos(a) * 2.6); P.ry = Math.atan2(me.x - P.s.root.position.x, me.z - P.s.root.position.z); P.s.root.rotation.y = P.ry; });
  const KNEEL = { hipY: 0.55, thighL: [-1.4, 0, -0.1], shinL: [1.9, 0, 0], thighR: [-0.2, 0, 0.1], shinR: [1.9, 0, 0], footR: [-0.4, 0, 0], spine: [0.3, 0, 0], neck: [0.35, 0, 0], armR: [-0.35, 0, 0.15], foreR: [-0.4, 0, 0], armL: [0.05, 0, -0.1] };
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 0.85 }, env: CITY_ENV,
    update(lt) {
      applyPose(k, mixPose(GUARD, { ...GUARD, neck: [0.3, 0, 0], spine: [0.2, 0, 0] }, smooth(range(lt, 1.0, 2.0)))); k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0);
      updateKnight(k, lt, { wind: 0.4, swing: 0.1 });
      lanternLight(k, 0, 1.5, lt); lampLights(E, v3(0, 2, -6), 1, 5, 1.0);
      close.forEach((P, i) => { const u = smooth(range(lt, 0.1 + (i % 5) * 0.12, 1.1 + (i % 5) * 0.12)); applyPose(P.s, mixPose(STAND_STILL, KNEEL, u)); setSkirt(P.s); P.s.skirt.rotation.x = -u * 0.9; });
      // golden light seeps up through the cracks of the street
      setPL(4, v3(0, -0.4, -6), 0xffc060, 6, smooth(range(lt, 1.0, 2.3)) * 1.6);
      const a = lerp(0.6, 1.3, ease(range(lt, 0, 2.3)));
      aim(E.camera, v3(Math.sin(a) * 6.5, 1.1, -6 + Math.cos(a) * 6.5), v3(0, 0.6, -6));
    },
  };
}
// ---------------------------------------------------------------- S13  the plaza opens
function S13() {
  const E = streetEnv({ fov: 52 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  const pit = mesh(new THREE.CircleGeometry(7, 12), mat({ color: 0xc07a20, unlit: true }), E.scene, [0, -0.6, -44], [-Math.PI / 2, 0, 0]);
  const beam = glow(0xffb050, 16, 0); beam.position.set(0, 4, -44); E.scene.add(beam);
  const lids = []; const lm = mat({ map: T2('citystone') });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const piv = group(E.scene, [Math.cos(a + Math.PI / 8) * 7, 0.08, -44 + Math.sin(a + Math.PI / 8) * 7]); piv.rotation.y = -(a + Math.PI / 8) + Math.PI / 2; const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-7 * Math.sin(Math.PI / 8) * 1.02, 7 * Math.cos(Math.PI / 8) * 1.02); s.lineTo(7 * Math.sin(Math.PI / 8) * 1.02, 7 * Math.cos(Math.PI / 8) * 1.02); s.lineTo(0, 0); const lg = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }); lg.rotateX(Math.PI / 2); lg.translate(0, 0, -7 * Math.cos(Math.PI / 8)); const lid = group(piv); mesh(flat(lg), lm, lid, [0, 0, 7 * Math.cos(Math.PI / 8)], [0, Math.PI, 0]); lids.push(lid); }
  E.scene.add(motes({ origin: v3(0, 3, -44), box: v3(10, 10, 10), count: 220, vel: v3(0, 2.2, 0), size: 0.06 }));
  return {
    ...E, grade: { sat: 0.82, contrast: 1.2, bloom: 1.1, bloomT: 0.45 }, env: { ...CITY_ENV, rim: 0xb09050 },
    update(lt) {
      const o = smooth(range(lt, 0.3, 2.2));
      E.fountain.position.y = -o * 7.5;
      lids.forEach(l => { l.rotation.x = -o * 1.75; });
      beam.material.opacity = o * 0.45;
      k.root.position.set(0.5, 0, -33.5 - smooth(range(lt, 1.6, 3.2)) * 1.6);
      applyPose(k, mixPose(holdLow(walkPose(0, { stride: 0 })), { ...holdLow(walkPose(0, { stride: 0 })), neck: [0.5, 0, 0], spine: [0.15, 0, 0] }, smooth(range(lt, 0.6, 1.6))));
      k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.4, swing: 0.1 });
      lanternLight(k, 0, 1.2, lt);
      setPL(1, v3(0, -1, -44), 0xffb040, 20, o * 1.3);
      aim(E.camera, v3(3.5, lerp(5, 8.5, ease(range(lt, 0, 3.2))), -27.5), v3(0, -1.5, -42.5));
      shake(E.camera, 0.04 * o * (1 - o) * 4, lt);
    },
  };
}

// ---------------------------------------------------------------- the Stillwork chamber (S14–S17)
function machineEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 52, 0.1, 400);
  const S = stillwork(); scene.add(S);
  scene.add(motes({ origin: v3(0, 12, 0), box: v3(50, 40, 50), count: 400, vel: v3(0, 1.2, 0), size: 0.08 }));
  // dust drifting down
  scene.add(particles({ mode: 'drift', count: 300, box: v3(40, 30, 40), vel: v3(0.1, -0.4, 0.05), size: 0.05, c0: 0x8a7a60, origin: v3(0, 14, 0), additive: false, opacity: 0.6, seed: 71, fogMix: 0.5 }));
  return { scene, camera, S };
}
const MACHINE_ENV = { fog: [6, 120], fogCol: 0x181e2a, hfog: [-6, 6, 0.4, 0.05], lightDir: v3(0, -1, 0.2), lightCol: 0x4a4436, ambient: 0x2e2822, rim: 0xd0a060, fillDir: v3(0, 0.4, -0.9), fillCol: 0x7a5a30 };
function coreLights(E, k = 1) { setPL(0, v3(0, 8, 4), 0xffc060, 45, 1.6 * k); setPL(1, v3(0, -2, 12), 0xffb048, 22, 0.9 * k); }

// S14  beneath the city, something was still breathing
function S14() {
  const E = machineEnv({ fov: 58 });
  const k = buildKnight(); k.root.rotation.y = Math.PI + 0.75; k.root.position.set(17.5, 6, 20.5); E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.72, contrast: 1.2, bloom: 0.85, bloomT: 0.55 }, env: MACHINE_ENV,
    update(lt) {
      animateStillwork(E.S, lt, { open: 0, speed: 1 });
      const p = holdLow(walkPose(0, { stride: 0 })); p.neck = [0.25, 0, 0]; applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.2, swing: 0.05 });
      lanternLight(k, 2, 1.2, lt); coreLights(E);
      const u = ease(range(lt, 0, 4.9));
      aim(E.camera, v3(lerp(21.5, 16, u), lerp(8.6, 12, u), lerp(25.5, 34, u)), v3(lerp(16.5, 2, u), lerp(7.4, 11, u), lerp(18.5, 0, u)));
    },
  };
}
// S15  and when it saw me... it woke (the iris opens)
function S15() {
  const E = machineEnv({ fov: 50 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; k.root.position.set(0.5, -8, 21.5); E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.72, contrast: 1.2, bloom: 0.95, bloomT: 0.5 }, env: MACHINE_ENV,
    update(lt) {
      const open = smooth(range(lt, 0.4, 1.6));
      const stall = lt < 0.4 ? 1 : lt < 1.0 ? 0.1 : 1.6;   // the gears pause... then turn faster
      animateStillwork(E.S, lt * stall + (lt > 1.0 ? -0.9 : 0), { open, speed: 1, pulseRate: 4 });
      const p = holdLow(walkPose(0, { stride: 0 })); p.neck = [-0.35, 0, 0]; p.head = [-0.2, 0, 0]; applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.3 + open * 0.6, swing: 0.05, back: 0.3 });
      coreLights(E, 1 + open * 0.8); setPL(2, v3(0.5, -5, 19.5), 0xffd080, 8, open * 1.6);
      aim(E.camera, v3(-0.2, -5.9, 27.0), v3(0.4, 2.0, 0));
      shake(E.camera, open * (1 - open) * 0.12, lt);
    },
  };
}
// S16a  the threads — every soul, bound to the core
function S16a() {
  const E = machineEnv({ fov: 60 });
  return {
    ...E, grade: { sat: 0.72, contrast: 1.15, bloom: 0.9, bloomT: 0.55 }, env: MACHINE_ENV,
    update(lt) {
      animateStillwork(E.S, lt + 3, { open: 1, speed: 1.6, threads: 0.75 });
      coreLights(E, 1.6);
      const a = lt * 0.12;
      aim(E.camera, v3(Math.sin(a) * 9, 13 + lt * 0.8, Math.cos(a) * 9), v3(Math.sin(a + 0.3) * 4, 52, Math.cos(a + 0.3) * 4));
    },
  };
}
// S16b  he walks to the open core
function S16b() {
  const E = machineEnv({ fov: 50 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.72, contrast: 1.2, bloom: 0.9, bloomT: 0.55 }, env: MACHINE_ENV,
    update(lt) {
      animateStillwork(E.S, lt + 5, { open: 1, speed: 1.6, threads: 0.6 });
      const z = 25.5 - lt * 1.0; k.root.position.set(0.3, -8, z);
      applyPose(k, holdLow(walkPose(lt * 0.75, { stride: 0.4, hunch: 0.05 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.8, swing: 0.25, back: 0.4 });
      coreLights(E, 1.6); lanternLight(k, 2, 1.0, lt);
      aim(E.camera, v3(-0.3, -5.8, z + 5.0), v3(0.2, 1.0, 0));
    },
  };
}
// S17  he raises Vowbrand — the kingdom shakes — cut to black before the blow
function S17() {
  const E = machineEnv({ fov: 48 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; k.root.position.set(0.2, -8, 20.5); E.scene.add(k.root);
  E.scene.add(particles({ mode: 'drift', count: 500, box: v3(30, 24, 30), vel: v3(0.2, -6, 0.1), size: 0.06, c0: 0x9a8a70, origin: v3(0, 10, 6), additive: false, opacity: 0.7, seed: 81, fogMix: 0.4 }));
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 1.0, bloomT: 0.52 }, env: MACHINE_ENV,
    update(lt) {
      animateStillwork(E.S, lt * 2.2 + 8, { open: 1, speed: 1.4, pulseRate: 7, threads: 0.8 });
      const u = ease(range(lt, 0.2, 2.0));
      applyPose(k, mixPose(GUARD, OVERHEAD, u)); k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0);
      updateKnight(k, lt, { wind: 1.2, swing: 0.2, back: 0.5 });
      k.M.slit.uniforms.uEmissive.value.setRGB(1, 0.45, 0.14).multiplyScalar(0.7 + u * 1.0);
      k.M.vein.uniforms.uEmissive.value.setRGB(1, 0.5, 0.2).multiplyScalar(1 + u * 1.6);
      coreLights(E, 1.8);
      aim(E.camera, v3(0.6, -7.2, 24.8 - lt * 0.35), v3(0.1, 1.5, 0));
      shake(E.camera, 0.03 + u * 0.09, lt);
    },
  };
}

export const SHOTS_EP2 = { S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16a, S16b, S17 };
export { streetEnv, mountainEnv, machineEnv, MACHINE_ENV, CITY_ENV, MOUNTAIN_ENV, NIGHT, cam, aim };
