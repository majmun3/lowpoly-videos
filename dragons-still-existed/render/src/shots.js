// WHAT IF DRAGONS STILL EXISTED? — 25 shots: an alternate-history documentary of a modern Earth that never lost its dragons.
import { THREE, v3, setPL, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, flat, taper } from '/the-last-ember/render/src/engine.js';
import { T } from '/the-last-ember/render/src/textures.js';
import { applyPose, mixPose } from '/the-last-ember/render/src/characters.js';
import { posePart, fireBreath, mouthWorld } from '/born-as-a-dragon/render/src/dragon.js';
import { buildPerson, pWalk, pStand, LOOKUP, Crowd, Traffic, vehicle, flashLights, airliner, fighterJet, helicopter, signPost, buildModernDragon, saddle, regTag, armor, dragonShadow, jigWalk, setJiggle, TM } from './modern.js';
import { city, setLights, setSignal, SKY, ENV, airport, sanctuary, airbase, smokeP, fireP, TC } from './city.js';
import { sky } from '/the-last-ember/render/src/world.js';

const cam = (fov, near = 0.1, far = 9000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
const PL = (i, p, c, r, k) => setPL(i, p, c, r, k * 0.5);
const faceTo = (j, p) => { j.root.rotation.y = Math.atan2(p.x - j.root.position.x, p.z - j.root.position.z); };

// ---------------------------------------------------------------- dragon motion
const fly = (t, rate = 1.5, amp = 0.6) => ({ t, wingFold: 0, wingUp: 0.12, wingSweep: 0.05, flap: Math.sin(t * rate) * amp, legs: { FL: [0.9, -0.9], FR: [0.9, -0.9], HL: [-1.1, 0.9], HR: [-1.1, 0.9] }, neckPitch: -0.05, headPitch: -0.1, tailPitch: -0.05, tailWave: 0.05 });
const glide = (t) => ({ ...fly(t, 0.8, 0.12), wingUp: 0.05 });
const REST = (t) => ({ t, wingFold: 0.85, wingUp: 0.35, wingSweep: 0.25, neckPitch: 0.1, headPitch: 0.05, tailWave: 0.03, tailRate: 0.6 });
const LIE = (t) => ({ ...REST(t), bodyY: 0.3, legs: { FL: [1.1, -1.9], FR: [1.1, -1.9], HL: [-1.0, 1.9], HR: [-1.0, 1.9] }, neckPitch: -0.3, headPitch: 0.35 });
const LAND = (t) => ({ t, wingFold: 0, wingUp: 0.5, wingSweep: -0.1, flap: Math.sin(t * 2.6) * 0.8, legs: { FL: [0.3, -0.4], FR: [0.3, -0.4], HL: [0.1, 0.2], HR: [0.1, 0.2] }, neckPitch: 0.1, headPitch: -0.2, bodyPitch: -0.25 });
const SPREAD = (t, k) => ({ t, wingFold: 0.85 * (1 - k), wingUp: lerp(0.35, 0.75, k), wingSweep: lerp(0.25, -0.15, k), flap: Math.sin(t * 2) * 0.1 * k, neckPitch: lerp(0.1, -0.3, k), headPitch: lerp(0.05, -0.25, k), jaw: k * 0.35 * pulse(t, 1.4, 0.4) });
// put a flying dragon on a path a→b (u 0..1), facing along it, with a ground shadow
function flyAt(d, a, b, u, t, o = {}) { const p = a.clone().lerp(b, u); p.y += Math.sin(t * 1.5) * 0.6; d.root.position.copy(p); const dir = b.clone().sub(a); d.root.rotation.set(0, Math.atan2(dir.x, dir.z), 0); posePart(d, { ...(o.pose ? o.pose(t) : fly(t)), bodyRoll: o.roll ?? 0, bodyPitch: o.pitch ?? 0 }); if (o.shadow) { o.shadow.position.set(p.x, 0.08, p.z); o.shadow.rotation.set(-Math.PI / 2, 0, -d.root.rotation.y); const s = 30 * (1 + p.y / 200); o.shadow.scale.set(s, s, 1); o.shadow.material.uniforms.uOpacity.value = clamp(0.5 - p.y / 300, 0.1, 0.45); } }

// ---------------------------------------------------------------- common city setup
function cityCast(o = {}) {
  const E = city({ tod: o.tod ?? 'day', z1: o.z1, z0: o.z0 });
  const traffic = new Traffic([{ x: -9, dir: -1, z0: -900, z1: 300, speed: 13 }, { x: -3, dir: -1, z0: -900, z1: 300, speed: 15 }, { x: 3, dir: 1, z0: -900, z1: 300, speed: 14 }, { x: 9, dir: 1, z0: -900, z1: 300, speed: 12 }], o.cars ?? 22, { seed: 5 }); E.scene.add(traffic.group);
  const walkers = new Crowd(o.walkers ?? 160, { seed: 9 }); E.scene.add(walkers.group); const R = rng(4); const wl = [...Array(walkers.n)].map(() => [R() < 0.5 ? -1 : 1, 13.8 + R() * 3.2, R() * 1200 - 900, R() < 0.5 ? 1 : -1, 1.2 + R() * 0.5]);
  const walk = (t) => walkers.set(t, (i) => { const [s, x, z0, dir, sp] = wl[i]; let z = z0 + dir * sp * t; z = ((z + 900) % 1200 + 1200) % 1200 - 900; return { p: v3(s * x, 0.2, z), yaw: dir > 0 ? 0 : Math.PI, walk: 1 }; });
  return { ...E, traffic, walkers, walk };
}
const DAY_G = { sat: 1.02, contrast: 1.08, bloom: 0.42, bloomT: 0.7 };
function cityUpdate(E, t, k = 0) { E.traffic.update(t); E.walk(t); setLights(E, k); }
function dog(color = 0x8a6a4a) { const g = new THREE.Group(); const m = mat({ map: TM('fabric'), color, rim: 0.8 }); mesh(box(0.22, 0.2, 0.55, 'bottom'), m, g, [0, 0.28, 0]); mesh(box(0.16, 0.16, 0.2, 'bottom'), m, g, [0, 0.42, 0.33]); for (const [x, z] of [[-0.08, 0.2], [0.08, 0.2], [-0.08, -0.2], [0.08, -0.2]]) mesh(box(0.06, 0.28, 0.06, 'bottom'), m, g, [x, 0, z]); mesh(box(0.04, 0.04, 0.2), m, g, [0, 0.45, -0.32], [0.6, 0, 0]); return g; }

// ---------------------------------------------------------------- 1 — THE HOOK
function D01() { // a massive dragon flies between skyscrapers above the traffic
  const E = cityCast(); const camera = cam(52); const d = buildModernDragon('slate', { scale: 10 }); E.scene.add(d.root); const sh = dragonShadow(); E.scene.add(sh);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 3); flyAt(d, v3(4, 46, -150), v3(-2, 40, 30), lt / 6, lt, { shadow: sh, roll: Math.sin(lt * 0.8) * 0.08 });
      aim(camera, v3(lerp(10, 6, lt / 2.2), lerp(58, 52, lt / 2.2), lerp(70, 60, lt / 2.2)), d.root.position.clone().add(v3(0, -6, -10))); } };
}
function D02() { // the shadow passes over the street — people look up
  const E = cityCast(); const camera = cam(56); const d = buildModernDragon('slate', { scale: 10 }); E.scene.add(d.root); const sh = dragonShadow(); E.scene.add(sh);
  const people = []; [[14.5, 6, 'office'], [15.6, 7.2, 'casual'], [14.2, 8.8, 'casual'], [16.0, 5.2, 'casual'], [15.0, 9.8, 'office']].forEach(([x, z, o], i) => { const p = buildPerson({ outfit: o, seed: 10 + i }); p.root.position.set(x, 0.2, z); p.root.rotation.y = Math.PI + (i - 2) * 0.3; E.scene.add(p.root); people.push(p); });
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 5); const u = (lt + 2.2) / 6; flyAt(d, v3(4, 46, -150), v3(-2, 40, 30), u, lt + 2.2, { shadow: sh });
      people.forEach((p, i) => { const k = smooth(range(lt, 0.2 + i * 0.12, 0.8 + i * 0.12)); applyPose(p, mixPose(pStand(), LOOKUP, k)); setJiggle(p, {}); p.root.rotation.y = lerp(Math.PI + (i - 2) * 0.3, Math.PI + 0.2, k); });
      aim(camera, v3(10.8, 1.3, 18.0 - lt * 0.3), v3(14.6, 4 + lt * 5.5, -4)); } };
}
function D03() { // wide aerial chase above the avenue
  const E = cityCast(); const camera = cam(50); const d = buildModernDragon('slate', { scale: 10 }); E.scene.add(d.root); const sh = dragonShadow(); E.scene.add(sh);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 8); const a = v3(0, 42, 40), b = v3(0, 60, -400); flyAt(d, a, b, lt / 8, lt + 4, { shadow: sh, pose: (t) => fly(t, 1.4, 0.7) });
      const p = d.root.position; aim(camera, p.clone().add(v3(14, 12, 48 - lt * 3)), p.clone().add(v3(0, 2, -30))); } };
}

// ---------------------------------------------------------------- 2 — EVERYDAY LIFE
function D04() { // a dragon rests on an apartment roof; below, people walk their dogs and go shopping
  const E = cityCast(); const camera = cam(48); const roof = E.roofs.filter(r => r.near && r.x > 0 && r.z < -40 && r.z > -160).sort((a, b) => a.h - b.h)[0] || { x: 30, z: -80, h: 30, w: 20, d: 20 };
  const d = buildModernDragon('rust', { scale: 9 }); d.root.position.set(roof.x - roof.w * 0.2, roof.h, roof.z); d.root.rotation.y = -Math.PI / 2 + 0.3; E.scene.add(d.root);
  const walkers = []; [['casual', 1], ['casual', 2], ['office', 3]].forEach(([o, s], i) => { const p = buildPerson({ outfit: o, seed: 30 + i }); E.scene.add(p.root); walkers.push(p); });
  const dg = dog(); E.scene.add(dg); const bag = mesh(box(0.25, 0.32, 0.12, 'top'), mat({ color: 0xd8c8a0, rim: 0.6 }), walkers[1].handR, [0, -0.06, 0]);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 11); posePart(d, { ...REST(lt), neckYaw: Math.sin(lt * 0.4) * 0.3 });
      walkers.forEach((p, i) => { const z = roof.z + 30 - lt * 1.3 - i * 2.2; p.root.position.set(14.3 + i * 0.9, 0.2, z); p.root.rotation.y = Math.PI; const ph = lt * 1.6 + i * 0.3; applyPose(p, pWalk(ph)); setJiggle(p, jigWalk(ph, 0.9)); });
      const w0 = walkers[0].root.position; dg.position.set(w0.x - 0.8, 0.2, w0.z - 1.4); dg.rotation.y = Math.PI; dg.position.y = 0.2 + Math.abs(Math.sin(lt * 9)) * 0.04;
      aim(camera, v3(-8, 3, roof.z + 34 - lt * 0.6), v3(roof.x * 0.55, roof.h * 0.62, roof.z + 4)); } };
}
function busStop(E, z) { const g = group(E.scene, [15.8, 0.2, z]); const Mt = mat({ map: T('iron'), color: 0x8a8a90, rim: 1 }); for (const x of [-2, 2]) mesh(box(0.1, 2.6, 0.1, 'bottom'), Mt, g, [x, 0, -0.6]); mesh(box(4.4, 0.12, 1.6), Mt, g, [0, 2.6, 0]); mesh(box(4.2, 2.2, 0.05), mat({ map: TM('glass'), rim: 1, pierce: 0.4 }), g, [0, 1.3, -0.6]); mesh(box(3, 0.08, 0.45), Mt, g, [0, 0.5, -0.3]); const sp = signPost('stop', { w: 0.6, hh: 0.6, h: 2.8 }); sp.position.set(-2.6, 0, 0.4); g.add(sp); return g; }
function D05() { // the bus stop: an ordinary morning
  const E = cityCast(); const camera = cam(42); const z0 = -40; busStop(E, z0);
  const ppl = []; [['office', 0], ['casual', 1], ['casual', 2], ['worker', 3], ['office', 4]].forEach(([o, s], i) => { const p = buildPerson({ outfit: o, seed: 50 + i }); p.root.position.set(14.6 + (i % 2) * 0.5, 0.2, z0 - 1.6 + i * 0.85); p.root.rotation.y = Math.PI + (i - 2) * 0.12; E.scene.add(p.root); ppl.push(p); });
  const phone = mesh(box(0.07, 0.13, 0.01), mat({ color: 0x101820, emissive: 0x304060, unlit: true }), ppl[1].handR, [0, -0.08, 0.04]);
  const bus = vehicle('bus'); E.scene.add(bus); const d = buildModernDragon('moss', { scale: 9 }); E.scene.add(d.root);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 14); ppl.forEach((p, i) => { applyPose(p, i === 1 ? { ...pStand(), armR: [-0.6, 0, 0.1], foreR: [-1.4, 0, 0], neck: [0.35, 0, 0] } : pStand({ look: i === 3 ? -0.3 * smooth(range(lt, 1.0, 1.6)) : 0 })); setJiggle(p, {}); });
      bus.position.set(9, 0, -110 + lt * 16); flyAt(d, v3(-80, 55, -140), v3(120, 60, -200), lt / 5, lt);
      aim(camera, v3(9.5, 1.5, z0 + 3.2), v3(15.4, 1.6, z0 - 2.0)); } };
}
function D06() { // a dragon flies past a traffic light
  const E = cityCast(); const camera = cam(36); const d = buildModernDragon('slate', { scale: 9 }); E.scene.add(d.root);
  const tl = E.tlights.find(t => t.sx > 0 && t.z < 0) || E.tlights[0]; const hb = tl.L[0].m.parent; hb.updateMatrixWorld(true); const hp = hb.getWorldPosition(v3());
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 18); setSignal(tl, lt < 1.1 ? 0 : 2); flyAt(d, hp.clone().add(v3(-120, 12, -70)), hp.clone().add(v3(140, 16, -80)), lt / 2.8, lt);
      aim(camera, hp.clone().add(v3(1.5, -1.2, 5.5)), hp.clone().add(v3(-0.8, 2.2, -20))); } };
}

// ---------------------------------------------------------------- 3 — TRANSPORTATION
function airCast() { const E = airport(); return E; }
function D07() { // a designated dragon landing zone at the airport
  const E = airCast(); const camera = cam(50); const d = buildModernDragon('cobalt', { scale: 8 }); E.scene.add(d.root);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { E.taxi.position.set(60, 0, -300 + lt * 9); const u = clamp(lt / 2.0); const p = E.pad.clone().add(v3(0, lerp(40, 0, easeOut(u)), lerp(-60, 0, easeOut(u)))); d.root.position.copy(p); d.root.rotation.y = 0; posePart(d, u < 1 ? LAND(lt) : { ...REST(lt), wingFold: lerp(0, 0.85, smooth(range(lt, 2.0, 2.6))) });
      aim(camera, E.pad.clone().add(v3(36, 9, 52)), E.pad.clone().add(v3(0, 8 + (1 - u) * 14, -6))); } };
}
function D08() { // a commuter in a suit climbs aboard a domesticated dragon
  const E = airCast(); const camera = cam(44); const d = buildModernDragon('cobalt', { scale: 8 }); d.root.position.copy(E.pad); d.root.rotation.y = 0.6; E.scene.add(d.root); saddle(d);
  const steps = group(E.scene, E.pad.clone().add(v3(1.8, 0, 1.6)).toArray(), [0, 0.6, 0]); const sm = mat({ map: T('iron'), color: 0xd0d0d4, rim: 1 }); for (let k = 0; k < 5; k++) mesh(box(1.4, 0.15, 0.5), sm, steps, [0, 0.5 + k * 0.6, -k * 0.5]); for (const s of [-1, 1]) mesh(box(0.08, 3.4, 0.08, 'bottom'), sm, steps, [s * 0.7, 0, -1.0], [0.45, 0, 0]);
  const c = buildPerson({ outfit: 'office', seed: 70, female: false }); E.scene.add(c.root); const bag = mesh(box(0.38, 0.28, 0.1, 'top'), mat({ color: 0x3a2a20, rim: 0.8 }), c.handL, [0, -0.06, 0]);
  const queue = []; for (let i = 0; i < 3; i++) { const p = buildPerson({ outfit: i === 1 ? 'casual' : 'office', seed: 71 + i }); p.root.position.copy(E.pad).add(v3(4.2 + i * 0.9, 0, 4.8 + i * 0.7)); p.root.rotation.y = -2.4; E.scene.add(p.root); queue.push(p); }
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { posePart(d, { ...LIE(lt), neckYaw: -0.3 }); const k = clamp(lt / 2.0); const base = steps.position.clone(); const yaw = steps.rotation.y; const fwd = v3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const p = base.clone().addScaledVector(fwd, -0.8 + k * 2.4); p.y = 0.15 + k * 2.8; c.root.position.copy(p); c.root.rotation.y = yaw + Math.PI; const ph = lt * 1.6; applyPose(c, { ...pWalk(ph, { stride: 0.5 }), thighL: [-0.7 + Math.sin(ph * 6.28) * 0.4, 0, 0], thighR: [-0.7 - Math.sin(ph * 6.28) * 0.4, 0, 0], shinL: [0.6, 0, 0], shinR: [0.6, 0, 0] }); setJiggle(c, jigWalk(ph, 0.9));
      queue.forEach(q => { applyPose(q, pStand()); setJiggle(q, {}); }); PL(0, E.pad.clone().add(v3(4, 6, 6)), 0xfff0e0, 20, 0.6);
      aim(camera, E.pad.clone().add(v3(13.5, 4.0, 12.5 - lt * 0.3)), E.pad.clone().add(v3(1.6, 2.4, 0.8))); } };
}
function D09() { // above the clouds, dragons fly alongside a passenger airliner
  const scene = new THREE.Scene(); scene.add(sky({ ...SKY.day, top: 0x2a64b8, horizon: 0x9ab8dc, cover: 0.62 })); const camera = cam(48);
  const cl = mesh(new THREE.PlaneGeometry(9000, 9000), mat({ map: T('clouds'), repeat: [5, 5], color: 0xdce4f0, fogScale: 0.6 }), scene, [0, -70, 0], [-Math.PI / 2, 0, 0]);
  const a = airliner({ accent: 0x2a4a9a }); scene.add(a); const ds = [buildModernDragon('slate', { scale: 7 }), buildModernDragon('rust', { scale: 6 })]; ds.forEach(d => scene.add(d.root));
  return { scene, camera, grade: { ...DAY_G, bloom: 0.3, bloomT: 0.8 }, env: { ...ENV.day, fog: [300, 9000], fogCol: 0x9ab8dc },
    update(lt) { const z = lt * 70; a.position.set(0, 0, z); a.rotation.z = Math.sin(lt * 0.5) * 0.02; ds.forEach((d, i) => { d.root.position.set(i ? -18 : 14, (i ? 0 : 9) + Math.sin(lt * 1.3 + i) * 1.5, z + (i ? 30 : -2)); d.root.rotation.y = 0; posePart(d, fly(lt + i, 1.7, 0.6)); });
      aim(camera, v3(44, 10, z - 26 + lt * 2), v3(0, 3, z + 12)); } };
}

// ---------------------------------------------------------------- 4 — THE ECONOMY
function sanctCast() {
  const E = sanctuary(); const ds = []; [['rust', v3(-10, 0, 20), 0.5], ['moss', v3(25, 0, 10), -2.0], ['ash', v3(-45, 0, 0), 1.2]].forEach(([s, p, ry]) => { const d = buildModernDragon(s, { scale: 8 }); d.root.position.copy(p).setY(E.hf(p.x, p.z)); d.root.rotation.y = ry; E.scene.add(d.root); ds.push(d); });
  const workers = []; for (let i = 0; i < 5; i++) { const w = buildPerson({ outfit: 'worker', seed: 90 + i }); E.scene.add(w.root); workers.push(w); }
  const truck = vehicle('meat'); E.scene.add(truck); const fork = group(E.scene, [44, 0, 52]); const fm = mat({ map: TM('paint'), color: 0xe0b020, rim: 1 }); mesh(box(1.4, 1.2, 2.4, 'bottom'), fm, fork, [0, 0.4, 0]); mesh(box(1.2, 2.6, 0.1, 'bottom'), mat({ color: 0x2a2a2a }), fork, [0, 0.3, 1.3]); mesh(box(1.2, 0.08, 1.4), mat({ color: 0x2a2a2a }), fork, [0, 0.5, 1.9]);
  const cr = E.crates[0]; return { ...E, ds, workers, truck, fork };
}
function D10() { // feeding the dragons: meat trucks, forklifts, crates
  const E = sanctCast(); const camera = cam(46);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { E.ds.forEach((d, i) => posePart(d, { ...REST(lt + i), neckPitch: i === 0 ? -0.4 : 0.1, headPitch: i === 0 ? 0.6 : 0.05, jaw: i === 0 ? 0.25 + Math.sin(lt * 4) * 0.2 : 0.05 }));
      E.truck.position.set(70, 0.15, 120 - Math.min(lt, 1.6) * 22); E.truck.rotation.y = Math.PI; E.fork.position.set(44 - lt * 2.2, 0, 52 - lt * 3); E.fork.rotation.y = -2.5;
      E.workers.forEach((w, i) => { w.root.position.set(38 + i * 2.2, 0, 58 - (i % 2) * 2); w.root.rotation.y = -2.6 + i * 0.3; applyPose(w, i % 2 ? { ...pStand(), armL: [-1.1, 0, -0.2], armR: [-1.1, 0, 0.2], foreL: [-0.6, 0, 0], foreR: [-0.6, 0, 0] } : pStand()); setJiggle(w, {}); });
      aim(camera, v3(58, 6, 80 - lt * 0.8), v3(36, 3.5, 52)); } };
}
function D11() { // veterinarians examine a dragon
  const E = sanctCast(); const camera = cam(42); const d = E.ds[0]; const vets = []; for (let i = 0; i < 3; i++) { const v = buildPerson({ outfit: 'vet', seed: 110 + i }); E.scene.add(v.root); vets.push(v); }
  const scaff = group(E.scene, [0, 0, 0]); const sm = mat({ map: T('iron'), color: 0xc8c8cc, rim: 1 }); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(box(0.08, 2.6, 0.08, 'bottom'), sm, scaff, [x, 0, z]); mesh(box(2.2, 0.1, 2.2), sm, scaff, [0, 2.6, 0]);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { posePart(d, { ...LIE(lt), bodyY: 0.3 + Math.sin(lt * 1.4) * 0.008 }); d.root.updateMatrixWorld(true); const chest = d.body.localToWorld(v3(0.32, 0.0, 0.25)), back = d.body.localToWorld(v3(0, 0.3, 0.0));
      scaff.position.set(back.x + 3.2, E.hf(back.x, back.z), back.z);
      vets.forEach((v, i) => { const p = [chest.clone().add(v3(0.9, 0, 0.4)), scaff.position.clone().add(v3(0, 2.7, 0)), chest.clone().add(v3(2.4, 0, 2.2))][i]; v.root.position.set(p.x, i === 1 ? p.y : E.hf(p.x, p.z), p.z); faceTo(v, chest); applyPose(v, i === 0 ? { ...pStand(), armR: [-1.4, 0, 0.1], foreR: [-0.4, 0, 0], spine: [0.15, 0, 0] } : i === 2 ? { ...pStand(), armL: [-0.9, 0, -0.1], foreL: [-1.3, 0, 0], neck: [0.3, 0, 0] } : { ...pStand(), armR: [-1.8, 0, 0.1], foreR: [-0.5, 0, 0] }); setJiggle(v, {}); });
      const c = chest.clone(); aim(camera, c.clone().add(v3(7, 2.8, 7.5 - lt * 0.4)), c.clone().add(v3(0.5, 1.4, 0.5))); } };
}
function D12() { // the scale of it: barns, paddocks, convoys of feed trucks
  const E = sanctCast(); const camera = cam(50); const trucks = [0, 1, 2].map(() => { const t = vehicle('meat'); E.scene.add(t); return t; });
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { E.ds.forEach((d, i) => posePart(d, REST(lt + i))); trucks.forEach((t, i) => { t.position.set(70, 0.15, 200 - i * 22 - lt * 16); t.rotation.y = Math.PI; });
      const u = ease(range(lt, 0, 2.2)); aim(camera, v3(lerp(150, 170, u), lerp(60, 90, u), lerp(170, 150, u)), v3(0, 0, -20)); } };
}

// ---------------------------------------------------------------- 5 — THE DANGER
function dangerCast() {
  const E = cityCast(); const roof = E.roofs.filter(r => r.near && r.x < 0 && r.z < -100 && r.z > -260 && r.h > 30 && r.h < 80).sort((a, b) => a.h - b.h)[0] || { x: -30, z: -160, h: 40, w: 20, d: 20 };
  const d = buildModernDragon('ash', { scale: 9 }); E.scene.add(d.root); const fb = fireBreath({ count: 300 }); E.scene.add(fb);
  const fire = fireP({ origin: v3(roof.x + 2, roof.h + 0.5, roof.z + 3), spread: v3(5, 0.4, 4), size: 2.4, count: 90, vel: v3(0, 4, 0), life: 0.9, seed: 300 }); fire.material.uniforms.uOpacity.value = 0; E.scene.add(fire);
  const smoke = smokeP({ origin: v3(roof.x + 2, roof.h + 2, roof.z + 3), spread: v3(5, 1, 4), size: 9, count: 60, vel: v3(1.5, 6, 0.5), life: 5, opacity: 0, seed: 301 }); E.scene.add(smoke);
  const debris = particles({ mode: 'burst', count: 160, origin: v3(roof.x, roof.h + 1, roof.z), spread: v3(6, 1, 6), vel: v3(0, 8, 0), life: 2.2, size: 0.4, c0: 0x8a8580, c1: 0x5a5550, soft: false, additive: false, opacity: 0.95, seed: 302, start: -9 }); E.scene.add(debris);
  return { ...E, roof, d, fb, fire, smoke, debris };
}
function burning(E, k) { E.fire.material.uniforms.uOpacity.value = k; E.smoke.material.uniforms.uOpacity.value = k * 0.6; }
function D13() { // a dragon loses control in flight
  const E = dangerCast(); const camera = cam(48); const r = E.roof;
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 22); const a = v3(r.x + 120, r.h + 70, r.z - 60), b = v3(r.x + 10, r.h + 22, r.z); const u = lt / 2.2;
      flyAt(E.d, a, b, u, lt, { pose: (t) => ({ ...fly(t, 3.2, 0.9), neckYaw: Math.sin(t * 3) * 0.5, tailWave: 0.25 }), roll: Math.sin(lt * 2.6) * 0.7 * u, pitch: 0.25 * u });
      E.fb.userData.aim(E.d, pulse(lt, 1.3, 0.25), 40, 2.0);
      aim(camera, v3(r.x + 34, r.h + 26, r.z + 58), E.d.root.position.clone()); } };
}
function D14() { // it comes down hard on a rooftop
  const E = dangerCast(); const camera = cam(50); const r = E.roof; const T0 = 0.6;
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 24); const u = clamp(lt / T0); const p = v3(r.x + 10, r.h + 22, r.z).lerp(v3(r.x, r.h, r.z), easeIn(u)); E.d.root.position.copy(p); E.d.root.rotation.set(0, -2.2, 0);
      posePart(E.d, u < 1 ? { ...fly(lt, 3.5, 0.9), bodyRoll: 0.5 } : { ...REST(lt), wingFold: 0.4, wingUp: 0.6, bodyY: 0.45, bodyRoll: 0.18 * Math.exp(-(lt - T0) * 2), neckPitch: -0.3, headPitch: 0.4, jaw: 0.3 });
      E.debris.material.uniforms.uStart.value = T0; burning(E, smooth(range(lt, T0, T0 + 0.6)));
      PL(0, v3(r.x, r.h + 3, r.z), 0xff8030, 30, smooth(range(lt, T0, T0 + 0.5)) * 2.5);
      aim(camera, v3(r.x + 46, r.h + 6, r.z + 52), v3(r.x, r.h + 4, r.z)); shake(camera, pulse(lt, T0 + 0.05, 0.12) * 0.5, lt); } };
}
function emergencyCast() {
  const E = dangerCast(); burning(E, 1); E.d.root.position.set(E.roof.x, E.roof.h, E.roof.z); E.d.root.rotation.y = -2.2;
  const vs = []; [['fire', -9, -40], ['fire', -3, -55], ['police', 3, -30], ['police', -9, -70], ['ambulance', 9, -50]].forEach(([k, x, dz]) => { const v = vehicle(k); E.scene.add(v); vs.push({ v, x, z: E.roof.z + 40 + dz * 0.3 }); });
  const cops = []; for (let i = 0; i < 3; i++) { const c = buildPerson({ outfit: 'police', seed: 140 + i }); E.scene.add(c.root); cops.push(c); }
  const fleeing = []; for (let i = 0; i < 7; i++) { const p = buildPerson({ outfit: i % 3 === 0 ? 'office' : 'casual', seed: 150 + i }); E.scene.add(p.root); fleeing.push(p); }
  return { ...E, vs, cops, fleeing };
}
function D15() { // fire engines and police arrive
  const E = emergencyCast(); const camera = cam(48); const r = E.roof;
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { E.walk(lt); posePart(E.d, { ...REST(lt), wingFold: 0.4, wingUp: 0.6, bodyY: 0.45, neckPitch: -0.3, headPitch: 0.4 }); E.vs.forEach(({ v, x, z }, i) => { v.position.set(x, 0, z + 60 - Math.min(lt * 26, 60) + i * 2); v.rotation.y = Math.PI; flashLights(v, lt); });
      PL(0, v3(-6, 3, r.z + 40), 0xff2020, 16, (Math.floor(lt * 6) % 2) * 1.5); PL(1, v3(3, 3, r.z + 30), 0x2040ff, 16, ((Math.floor(lt * 6) + 1) % 2) * 1.5);
      aim(camera, v3(6, 3.5, r.z + 92), v3(-6, 12 + lt * 2, r.z + 6)); } };
}
function D16() { // officers evacuate the street; smoke rises from the roof
  const E = emergencyCast(); const camera = cam(46); const r = E.roof;
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { E.walk(lt); posePart(E.d, { ...REST(lt), wingFold: 0.4, wingUp: 0.6, bodyY: 0.45 }); E.vs.forEach(({ v, x, z }, i) => { v.position.set(x, 0, z + i * 2); v.rotation.y = Math.PI; flashLights(v, lt); });
      const base = v3(-14.5, 0.2, r.z + 24); E.cops.forEach((c, i) => { c.root.position.copy(base).add(v3(i * 1.6 - 0.5, 0, i * 1.2)); c.root.rotation.y = 0.4; const wave = Math.sin(lt * 7 + i); applyPose(c, { ...pStand(), armR: [-2.0 + wave * 0.4, 0, 0.6], foreR: [-0.3, 0, 0], armL: [-1.2, 0, -0.3] }); setJiggle(c, {}); });
      E.fleeing.forEach((p, i) => { const ph = lt * 2.6 + i; p.root.position.set(-15.5 + (i % 3) * 1.1, 0.2, r.z + 26 + lt * 3.4 + i * 1.6); p.root.rotation.y = 0; applyPose(p, { ...pWalk(ph, { stride: 0.6 }), spine: [0.25, 0, 0] }); setJiggle(p, jigWalk(ph, 1.4)); });
      PL(0, v3(-6, 3, r.z + 40), 0xff2020, 16, (Math.floor(lt * 6) % 2) * 1.5); PL(1, v3(3, 3, r.z + 30), 0x2040ff, 16, ((Math.floor(lt * 6) + 1) % 2) * 1.5);
      aim(camera, v3(-9, 2.0, r.z + 40), v3(-15, 4 + lt * 3, r.z + 20)); } };
}

// ---------------------------------------------------------------- 6 — GOVERNMENT REGULATIONS
function D17() { // flight restriction signs; a dragon keeps to its air lane
  const E = cityCast(); const camera = cam(40); const s1 = signPost('noDragon', { w: 1.3, hh: 1.3, h: 3.4 }); s1.position.set(13.4, 0.2, -20); s1.rotation.y = 0.3; E.scene.add(s1); const s2 = signPost('dragonLane', { w: 1.4, hh: 1.4, h: 3.4 }); s2.position.set(13.4, 0.2, -32); s2.rotation.y = 0.3; E.scene.add(s2);
  const d = buildModernDragon('cobalt', { scale: 8 }); E.scene.add(d.root);
  const beacons = []; for (let k = 0; k < 8; k++) { const g = glow(0xff3020, 6, 0.9); g.position.set(-40 + k * 30, 90, -260); E.scene.add(g); beacons.push(g); }
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 30); beacons.forEach((b, i) => b.material.opacity = (Math.floor(lt * 2 + i * 0.5) % 2) ? 0.9 : 0.2); flyAt(d, v3(0, 34, -260), v3(0, 40, 80), lt / 6, lt);
      aim(camera, v3(11.2, 2.2, -12 - lt * 0.5), v3(13.6, 5 + lt * 2.6, -26)); } };
}
function D18() { // a police helicopter monitors the dragon corridor
  const E = cityCast(); const camera = cam(48); const h = helicopter(); E.scene.add(h); const ds = [buildModernDragon('slate', { scale: 8 }), buildModernDragon('moss', { scale: 7 }), buildModernDragon('rust', { scale: 7 })]; ds.forEach(d => E.scene.add(d.root));
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { cityUpdate(E, lt + 34); h.position.set(9, 72, -150 - lt * 8); h.rotation.set(0.1, Math.PI, 0.04); h.userData.rotor.rotation.y = lt * 40;
      ds.forEach((d, i) => flyAt(d, v3(-4 + i * 4, 62 + i * 7, -120 - i * 26), v3(-4 + i * 4, 64 + i * 7, -620 - i * 26), (lt + i * 0.4) / 9, lt + i));
      aim(camera, v3(14, 76, -126 - lt * 8), v3(-2, 64, -190 - lt * 8)); } };
}
function D19() { // registration and inspection by the authorities
  const E = airport(); const camera = cam(46); const P = E.pad.clone().add(v3(40, 0, 10)); const d = buildModernDragon('rust', { scale: 8 }); d.root.position.copy(P); d.root.rotation.y = -0.6; E.scene.add(d.root); regTag(d);
  const sg = mesh(new THREE.PlaneGeometry(10, 2.5), mat({ map: TM('inspection') }), E.scene, P.clone().add(v3(-6, 6, -14)).toArray(), [0, 0.3, 0]); const sgp = mesh(box(10.4, 0.3, 0.3), mat({ map: T('iron'), color: 0x8a8a90 }), E.scene, P.clone().add(v3(-6, 4.6, -14.1)).toArray(), [0, 0.3, 0]); for (const s of [-1, 1]) mesh(box(0.25, 6, 0.25, 'bottom'), mat({ map: T('iron'), color: 0x8a8a90 }), E.scene, P.clone().add(v3(-6 + s * 4.8, 0, -14.1)).toArray());
  const offs = []; for (let i = 0; i < 3; i++) { const o = buildPerson({ outfit: 'police', seed: 170 + i }); E.scene.add(o.root); offs.push(o); } const board = mesh(box(0.22, 0.3, 0.02), mat({ color: 0xe8e0c8 }), offs[0].handL, [0, -0.06, 0.06]);
  return { scene: E.scene, camera, grade: DAY_G, env: ENV.day,
    update(lt) { posePart(d, { ...REST(lt), neckPitch: 0.2, headPitch: 0.15, neckYaw: Math.sin(lt * 0.6) * 0.2 }); d.root.updateMatrixWorld(true); const leg = d.body.localToWorld(v3(0.2, -0.2, 0.3));
      offs.forEach((o, i) => { const p = leg.clone().add(v3(1.6 + i * 1.3, 0, 2.0 - i * 0.6)); o.root.position.set(p.x, 0, p.z); faceTo(o, leg); applyPose(o, i === 0 ? { ...pStand(), armL: [-1.0, 0, -0.1], foreL: [-1.0, 0, 0], neck: [0.3, 0, 0] } : i === 1 ? { ...pStand(), armR: [-1.4, -0.3, 0.1], foreR: [-0.1, 0, 0] } : pStand({ look: -0.4 })); setJiggle(o, {}); });
      aim(camera, leg.clone().add(v3(8, 2.8, 10 - lt * 0.6)), leg.clone().add(v3(0.5, 2.5, 0))); } };
}

// ---------------------------------------------------------------- 7 — THE MILITARY
function baseCast() {
  const E = airbase(); const ds = []; for (let i = 0; i < 3; i++) { const d = buildModernDragon(['ash', 'slate', 'moss'][i], { scale: 8.5 }); d.root.position.set(-20 + i * 18, 0, -10); d.root.rotation.y = 0; armor(d); E.scene.add(d.root); ds.push(d); }
  const crew = []; for (let i = 0; i < 6; i++) { const c = buildPerson({ outfit: i % 3 === 0 ? 'pilot' : 'soldier', seed: 200 + i }); E.scene.add(c.root); crew.push(c); }
  return { ...E, ds, crew };
}
const BASE_G = { sat: 0.98, contrast: 1.1, bloom: 0.42, bloomT: 0.7 };
function D20() { // trained dragons beside fighter jets
  const E = baseCast(); const camera = cam(48);
  return { scene: E.scene, camera, grade: BASE_G, env: ENV.day,
    update(lt) { E.ds.forEach((d, i) => posePart(d, { ...REST(lt + i), neckPitch: 0.05, headPitch: 0.0 })); E.crew.forEach((c, i) => { c.root.position.set(-24 + i * 7, 0, 8 - (i % 2) * 3); c.root.rotation.y = Math.PI + 0.3; const ph = lt * 1.5 + i; applyPose(c, i % 2 ? pWalk(ph) : pStand()); setJiggle(c, i % 2 ? jigWalk(ph, 0.9) : {}); c.root.position.x += i % 2 ? lt * 1.2 : 0; });
      const u = ease(range(lt, 0, 3)); aim(camera, v3(lerp(34, 26, u), lerp(8, 13, u), lerp(46, 60, u)), v3(-2, 6, -16)); } };
}
function D21() { // inspecting the armoured harness
  const E = baseCast(); const camera = cam(40); const d = E.ds[1];
  return { scene: E.scene, camera, grade: BASE_G, env: ENV.day,
    update(lt) { E.ds.forEach((dd, i) => posePart(dd, REST(lt + i))); d.root.updateMatrixWorld(true); const flank = d.body.localToWorld(v3(0.28, 0.1, 0.1));
      E.crew.slice(0, 3).forEach((c, i) => { const p = flank.clone().add(v3(1.4 + i * 1.6, 0, 3.0 + i * 1.2)); c.root.position.set(p.x, 0, p.z); faceTo(c, flank); applyPose(c, i === 0 ? { ...pStand(), armR: [-1.7, 0, 0.1], foreR: [-0.3, 0, 0], neck: [-0.4, 0, 0] } : i === 1 ? { ...pStand(), armL: [-0.9, 0, -0.1], foreL: [-1.3, 0, 0], neck: [0.25, 0, 0] } : pStand({ look: -0.3 })); setJiggle(c, {}); });
      aim(camera, flank.clone().add(v3(14, 3.4, 22 - lt * 0.8)), flank.clone().add(v3(1.0, 2.6, 2.0))); } };
}
function D22() { // a dragon spreads its wings as the jets take off
  const E = baseCast(); const camera = cam(50); const d = E.ds[0]; const flying = [0, 1].map(() => { const j = fighterJet(); E.scene.add(j); return j; });
  return { scene: E.scene, camera, grade: { ...BASE_G, bloom: 0.35, bloomT: 0.76 }, env: ENV.day,
    update(lt) { E.ds.forEach((dd, i) => posePart(dd, i === 0 ? SPREAD(lt, smooth(range(lt, 0.3, 1.6))) : REST(lt + i))); 
      flying.forEach((j, i) => { const t = Math.max(0, lt - 0.2 - i * 0.35); const z = -170 + t * t * 18 + t * 30; j.position.set(90 + i * 8, Math.max(0, (z + 260) * 0.12), z); j.rotation.set(-Math.min(0.25, Math.max(0, (z + 260) * 0.002)), 0, 0); j.userData.burner.material.opacity = 0.9; });
      aim(camera, v3(-62, 4.5, -12 + lt * 0.8), v3(90, 14, -8)); } };
}

// ---------------------------------------------------------------- 8 — THE REALISTIC ENDING
function D23() { // sunset: a dragon glides between the towers; the city lights come on
  const E = cityCast({ tod: 'sunset' }); const camera = cam(48); const d = buildModernDragon('slate', { scale: 10 }); E.scene.add(d.root);
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.1, bloom: 0.5, bloomT: 0.64 }, env: ENV.sunset,
    update(lt) { cityUpdate(E, lt + 40, smooth(range(lt, 0.8, 3.2)) * 0.7); flyAt(d, v3(-4, 52, -120), v3(4, 58, -360), lt / 6, lt, { pose: glide });
      const p = d.root.position; aim(camera, p.clone().add(v3(-16, 6, 34 - lt * 1.5)), p.clone().add(v3(4, 4, -40))); } };
}
function D24() { // traffic carries on; people walk home beneath the dragon
  const E = cityCast({ tod: 'dusk' }); const camera = cam(50); const d = buildModernDragon('rust', { scale: 9 }); E.scene.add(d.root);
  const ppl = []; for (let i = 0; i < 5; i++) { const p = buildPerson({ outfit: i % 2 ? 'casual' : 'office', seed: 230 + i }); E.scene.add(p.root); ppl.push(p); }
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.1, bloom: 0.55, bloomT: 0.6 }, env: ENV.dusk,
    update(lt) { cityUpdate(E, lt + 44, 0.9); flyAt(d, v3(-2, 44, -200), v3(4, 40, 60), lt / 5, lt, { pose: glide });
      ppl.forEach((p, i) => { const ph = lt * 1.5 + i * 0.4; p.root.position.set(14.2 + (i % 2) * 1.2, 0.2, -10 - lt * 1.25 - i * 2.4); p.root.rotation.y = Math.PI; applyPose(p, pWalk(ph)); setJiggle(p, jigWalk(ph, 0.9)); });
      aim(camera, v3(10.2, 1.8, -2 - lt * 1.1), v3(13.6, 9 + lt * 3.5, -36)); } };
}
function D25() { // a wide aerial view: dragons in the distance, the city lit for the night
  const E = cityCast({ tod: 'dusk', walkers: 60 }); const camera = cam(50); const ds = ['slate', 'rust', 'moss', 'cobalt', 'ash'].map((s, i) => { const d = buildModernDragon(s, { scale: 9 }); E.scene.add(d.root); return d; });
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.1, bloom: 0.55, bloomT: 0.6 }, env: ENV.dusk,
    update(lt) { cityUpdate(E, lt + 50, 1.0); ds.forEach((d, i) => { const a = v3(-300 + i * 120, 90 + i * 18, -300 - i * 100), b = v3(300 - i * 80, 100 + i * 10, -500 - i * 60); flyAt(d, a, b, ((lt / 14) + i * 0.17) % 1, lt + i, { pose: glide }); });
      const u = ease(range(lt, 0, 4)); aim(camera, v3(lerp(0, 4, u), lerp(150, 240, u), lerp(230, 330, u)), v3(0, lerp(80, 60, u), -320)); } };
}

export const SHOTS_DRAGONS = { D01, D02, D03, D04, D05, D06, D07, D08, D09, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D20, D21, D22, D23, D24, D25 };
