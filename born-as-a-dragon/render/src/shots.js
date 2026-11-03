// WHAT IF YOU WERE BORN AS A DRAGON? — shot list.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, xf, merge, flat } from '/the-last-ember/render/src/engine.js';
import { T } from '/the-last-ember/render/src/textures.js';
import { applyPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { buildDragon, posePart, buildEgg, fireBreath, mouthWorld, eyeWorld, STAGES } from './dragon.js';
import { cavern, CAVE_ENV, volcanoWorld, humanMaterials, buildHunter, army, bannerPole, waveFlag, palisadeCamp, fortress, sky, terrain, ruinsField, streetHouse, T2, TE } from './env.js';

const cam = (fov, near = 0.05, far = 9000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
const fireP = (o = {}) => particles({ mode: 'emit', count: o.count ?? 80, origin: o.origin || v3(), spread: o.spread || v3(0.6, 0.2, 0.6), vel: o.vel || v3(0, 2.4, 0), life: o.life ?? 1.0, size: o.size ?? 0.5, c0: 0xffe0a0, c1: 0xff6a14, c2: 0x5a0e04, soft: true, seed: o.seed ?? 31, swirl: 1.5, opacity: o.opacity ?? 0.85, fogMix: 0.2 });
const embersP = (o) => particles({ mode: 'drift', count: o.count ?? 200, box: o.box, vel: o.vel || v3(0.3, 1.2, 0.2), size: o.size ?? 0.05, c0: 0xffa040, origin: o.origin, swirl: 1.4, seed: o.seed ?? 17, opacity: 1, fogMix: 0.2 });
const ashP = (o) => particles({ mode: 'drift', count: o.count ?? 400, box: o.box, vel: o.vel || v3(0.6, -1.0, 0.2), size: o.size ?? 0.06, c0: 0x6a6060, origin: o.origin, additive: false, opacity: 0.7, swirl: 0.8, seed: o.seed ?? 19, fogMix: 0.5 });
const FOLDED = { wingFold: 0.85, wingUp: 0.35, wingSweep: 0.25 };
const fly = (t, rate = 2.2, amp = 0.65) => ({ wingFold: 0, wingUp: 0.12, wingSweep: 0.05, flap: Math.sin(t * rate) * amp, legs: { FL: [0.9, -0.9], FR: [0.9, -0.9], HL: [-1.1, 0.9], HR: [-1.1, 0.9] }, neckPitch: -0.05, headPitch: -0.1, tailPitch: -0.05, tailWave: 0.05 });
const NIGHT = { horizon: 0x3a1c1a, top: 0x0a0608, bottom: 0x1a0e0c, cloud: 0x1e1012, cloudLit: 0x8a2a14, sunCol: 0x4a1408 };

// ---------------------------------------------------------------- cavern shots
function caveEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 40);
  const C = cavern({ clear: o.clear }); scene.add(C);
  const g0 = C.userData.ground(0, 0) + 0.05;
  const lava = (k = 1, t = 0) => { C.userData.pools.slice(0, 3).forEach(([x, z, r], i) => setPL(i + 2, v3(x, 1.5, z), 0xff6a20, r * 6, 1.8 * k * (0.9 + Math.sin(t * 3 + i) * 0.1))); };
  return { scene, camera, C, g0, lava };
}
function D01() { // the egg: heartbeat glow, a crack, an amber eye
  const E = caveEnv({ fov: 34 });
  const egg = buildEgg(); egg.position.set(0, E.g0 + 0.21, 0); E.scene.add(egg);
  const eye = mesh(box(0.05, 0.022, 0.02), mat({ color: 0xffa020, emissive: 0xff8a10, unlit: true }), egg, [0.02, 0.06, 0.165]); eye.visible = false;
  return {
    ...E, grade: { sat: 0.9, contrast: 1.25, bloom: 1.0, bloomT: 0.5 }, env: CAVE_ENV,
    update(lt) {
      const beat = Math.pow(Math.max(0, Math.sin(lt * 4.2)), 8);
      const k = 0.25 + beat * 0.5 + smooth(range(lt, 1.2, 2.8)) * 0.8;
      egg.userData.m.uniforms.uEmissive.value.setRGB(1, 0.65, 0.4).multiplyScalar(k);
      eye.visible = lt > 2.2; eye.scale.y = smooth(range(lt, 2.2, 2.5));
      egg.rotation.z = Math.sin(lt * 23) * 0.02 * smooth(range(lt, 1.5, 2.6));
      E.lava(0.8, lt); setPL(0, v3(0.3, E.g0 + 0.5, 0.6), 0xff9030, 2, 0.6 + beat * 0.8);
      aim(E.camera, v3(0.3, E.g0 + 0.34, lerp(1.7, 1.05, ease(range(lt, 0, 3.0)))), v3(0, E.g0 + 0.24, 0));
    },
  };
}
function D02() { // the hatching
  const E = caveEnv({ fov: 38 });
  const egg = buildEgg(); egg.position.set(0, E.g0 + 0.21, 0); E.scene.add(egg);
  egg.userData.m.uniforms.uEmissive.value.setRGB(1, 0.65, 0.4).multiplyScalar(1.1);
  const d = buildDragon('hatchling'); d.root.position.set(0, E.g0, 0); E.scene.add(d.root);
  E.scene.add(particles({ mode: 'burst', count: 160, origin: v3(0, E.g0 + 0.35, 0), start: 0.35, spread: v3(0.7, 0.6, 0.7), vel: v3(0, 0.7, 0), life: 1.2, size: 0.02, c0: 0xffd080, c1: 0x6a5a50, c2: 0x2a2220, seed: 5, additive: false, opacity: 0.9 }));
  return {
    ...E, grade: { sat: 0.9, contrast: 1.2, bloom: 0.9, bloomT: 0.5 }, env: CAVE_ENV,
    update(lt) {
      const pop = smooth(range(lt, 0.3, 0.8));
      egg.userData.top.position.set(pop * 0.25, pop * 0.25 - easeIn(range(lt, 0.8, 1.5)) * 0.35, pop * 0.1); egg.userData.top.rotation.set(pop * 1.4, 0, pop * 0.8);
      egg.userData.m.uniforms.uEmissive.value.setRGB(1, 0.65, 0.4).multiplyScalar(1.1 * (1 - smooth(range(lt, 0.8, 2.5)) * 0.8));
      const rise = smooth(range(lt, 0.5, 2.0));
      d.root.position.y = E.g0 - 0.12 + rise * 0.12; d.root.scale.setScalar(STAGES.hatchling.scale * (0.75 + rise * 0.25));
      posePart(d, { t: lt, bodyY: 0.4, neckPitch: lerp(-0.6, 0.55, rise), headPitch: lerp(0.6, -0.35, smooth(range(lt, 1.5, 3.0))), jaw: lt > 2.7 ? 0.45 : 0.05, wingFold: lerp(1, 0.25, smooth(range(lt, 1.6, 2.8))), wingUp: lerp(0.3, 0.75, smooth(range(lt, 1.6, 2.8))), tailWave: 0.12, legs: { FL: [0.3, -0.6], FR: [0.3, -0.6], HL: [-0.5, 0.9], HR: [-0.5, 0.9] } });
      E.lava(0.9, lt); setPL(0, v3(0.4, E.g0 + 0.6, 0.8), 0xff9030, 3, 1.4);
      aim(E.camera, v3(0.65, E.g0 + 0.32, 1.15), v3(0, E.g0 + 0.24, 0));
    },
  };
}
function D03() { // small, weak, alone
  const E = caveEnv({ fov: 50 });
  const d = buildDragon('hatchling'); d.root.position.set(0, E.g0, 0); d.root.rotation.y = 0.6; E.scene.add(d.root);
  const shell = buildEgg(); shell.position.set(0.25, E.g0 + 0.15, -0.1); shell.userData.top.visible = false; shell.rotation.z = 0.5; E.scene.add(shell);
  shell.userData.m.uniforms.uEmissive.value.setRGB(0.3, 0.15, 0.08);
  return {
    ...E, grade: { sat: 0.88, contrast: 1.2, bloom: 0.9 }, env: CAVE_ENV,
    update(lt) {
      posePart(d, { t: lt, bodyY: 0.45, ...FOLDED, wingFold: 0.5, neckPitch: 0.5, headPitch: -0.2 + Math.sin(lt * 1.5) * 0.15, tailWave: 0.1 });
      E.lava(1, lt);
      const u = ease(range(lt, 0, 1.9));
      setPL(0, v3(0.5, E.g0 + 1.2, 1.2), 0xff8030, 4, 1.4);
      aim(E.camera, v3(lerp(-2.2, -5.5, u), E.g0 + lerp(1.2, 3.6, u), lerp(3.2, 8.5, u)), v3(0.6, E.g0 + 0.3, -0.8));
    },
  };
}
function D04() { // the first fire
  const E = caveEnv({ fov: 40 });
  const d = buildDragon('juvenile'); d.root.position.set(0, E.g0, 0); d.root.rotation.y = -0.4; E.scene.add(d.root);
  const fb = fireBreath({ size: 0.45, count: 300 }); E.scene.add(fb);
  const puff = particles({ mode: 'burst', count: 60, origin: v3(), start: 1.0, spread: v3(0.4, 0.3, 0.4), vel: v3(0, -0.3, 0), life: 1.0, size: 0.08, c0: 0x8a8080, c1: 0x5a5050, c2: 0x2a2424, seed: 9, additive: false, opacity: 0.7 }); E.scene.add(puff);
  return {
    ...E, grade: { sat: 0.92, contrast: 1.2, bloom: 1.05, bloomT: 0.45 }, env: CAVE_ENV,
    update(lt) {
      const breath = smooth(range(lt, 2.2, 2.4)) * (1 - smooth(range(lt, 3.4, 3.8)));
      const rear = smooth(range(lt, 1.7, 2.2)) * (1 - smooth(range(lt, 3.3, 3.8)));
      posePart(d, { t: lt, bodyPitch: -rear * 0.25, ...FOLDED, wingFold: 0.85 - rear * 0.6, wingUp: 0.35 + rear * 0.4, neckPitch: 0.25 - rear * 0.15, headPitch: lerp(0.0, -0.25, rear) + (lt > 0.9 && lt < 1.3 ? 0.2 : 0), jaw: lt > 0.9 && lt < 1.3 ? 0.3 : 0.05 + breath * 0.6, tailWave: 0.1 });
      const m = fb.userData.aim(d, breath, 5.5, 0.18);
      puff.material.uniforms.uOrigin.value.copy(mouthWorld(d).p);
      E.lava(0.9, lt); setPL(0, m.p.clone().addScaledVector(m.f, 1.5), 0xffa040, 9, breath * 2.6);
      aim(E.camera, v3(-2.4, E.g0 + 0.9, 2.6), v3(0.3, E.g0 + 0.55, -0.4));
      shake(E.camera, breath * 0.015, lt);
    },
  };
}

// ---------------------------------------------------------------- the world outside
const VOLC = v3(0, 0, -500);
function worldEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50, 0.2);
  const sk = sky({ ...NIGHT, ...(o.sky || {}), sunDir: v3(0.2, 0.25, -1), cover: 0.35, cloudScale: 0.3, swirl: 0.4 }); scene.add(sk);
  const W = volcanoWorld({ volcano: VOLC, cx: o.cx ?? 0, cz: o.cz ?? 0 }); scene.add(W);
  return { scene, camera, sk, W };
}
const NIGHT_ENV = { fog: [20, 1400], fogCol: 0x2a1614, hfog: [-20, 60, 0.5, 0.003], lightDir: v3(0.2, -0.5, 1), lightCol: 0x6a3a2a, ambient: 0x22161a, rim: 0x9a4a2a, fillDir: v3(-0.3, -0.3, -1), fillCol: 0x1a1218 };
function D05() { // fire can be seen from very far away
  const E = worldEnv({ fov: 46, cx: 0, cz: 200 });
  const hf = E.W.userData.hf; const vz = 220;
  // a frontier village with a watchtower beacon
  const SM = { wall: mat({ map: T('plaster'), color: 0x9a8a80 }), roof: mat({ map: T('roof'), color: 0x7a6a64 }), beam: mat({ map: T('wood'), color: 0x6a5a50 }), win: mat({ color: 0xffb048, emissive: 0x6a3a10, unlit: true, pierce: 3 }) };
  const W = [], Rf = [], Wi = [], Bm = [];
  for (let i = 0; i < 10; i++) { const h = streetHouse(500 + i); const x = (i % 2 ? 1 : -1) * (8 + (i % 3) * 4), z = vz - Math.floor(i / 2) * 9; const y = hf(x, z) - 0.3; const r = [0, i % 2 ? Math.PI : 0, 0]; W.push(xf(h.walls, { p: [x, y, z], r })); Rf.push(xf(h.roof, { p: [x, y, z], r })); Wi.push(xf(h.wins, { p: [x, y, z], r })); Bm.push(xf(h.beams, { p: [x, y, z], r })); }
  mesh(merge(W), SM.wall, E.scene); mesh(merge(Rf), SM.roof, E.scene); mesh(merge(Wi), SM.win, E.scene); mesh(merge(Bm), SM.beam, E.scene);
  const ty = hf(3, vz - 6);
  mesh(merge([xf(prism(6, 2.4, 2.0, 14), {}), xf(box(5.6, 0.4, 5.6, 'bottom'), { p: [0, 14, 0] }), xf(prism(4, 3.8, 0.1, 3), { p: [0, 17.5, 0], r: [0, Math.PI / 4, 0] })]), mat({ map: T('stone'), color: 0x9a9090 }), E.scene, [3, ty, vz - 6]);
  E.scene.add(fireP({ origin: v3(3, ty + 15.2, vz - 6), spread: v3(1.0, 0.3, 1.0), size: 0.9, count: 70 }));
  const H = humanMaterials();
  const watchers = [0, 1, 2].map(i => { const h = buildHunter(H, { torch: i === 0 }); h.root.position.set(1.8 + i * 1.2, ty + 14.4, vz - 7.5); h.root.rotation.y = Math.PI; E.scene.add(h.root); return h; });
  // the volcano lights the night: a jet of fire from the crater
  const jet = particles({ mode: 'emit', count: 500, origin: v3(VOLC.x, E.W.userData.craterY + 4, VOLC.z), spread: v3(14, 6, 14), vel: v3(0, 160, 0), life: 1.0, size: 14, c0: 0xfff0b0, c1: 0xff6a18, c2: 0x4a0a04, soft: true, seed: 7, opacity: 0, fogMix: 0.1 });
  E.scene.add(jet);
  return {
    ...E, grade: { sat: 0.85, contrast: 1.2, bloom: 1.0, bloomT: 0.48 }, env: NIGHT_ENV,
    update(lt) {
      const j = smooth(range(lt, 0.2, 0.8)) * (1 - smooth(range(lt, 2.2, 2.9)));
      jet.material.uniforms.uOpacity.value = j;
      E.W.userData.craterGlow.material.opacity = 0.6 + j * 0.4;
      watchers.forEach((h, i) => { const p = walkPose(0, { stride: 0 }); p.neck = [-0.2, 0, 0]; if (i === 1) { p.armR = [-1.9, 0, 0.2]; p.foreR = [-0.1, 0, 0]; } applyPose(h, p); });
      setPL(0, v3(3, ty + 15.5, vz - 6), 0xffa040, 14, 1.3);
      aim(E.camera, v3(6, ty + 16.5, vz + 4), v3(0, 110, VOLC.z));
    },
  };
}
function D06() { // the humans sent hunters
  const E = worldEnv({ fov: 48, cx: 0, cz: 200 });
  const hf = E.W.userData.hf; const H = humanMaterials();
  const party = []; for (let i = 0; i < 7; i++) { const h = buildHunter(H, { torch: i % 2 === 0 }); E.scene.add(h.root); const f = i % 2 === 0 ? fireP({ origin: v3(), spread: v3(0.12, 0.05, 0.12), size: 0.22, count: 40, vel: v3(0, 1.5, 0), life: 0.5, seed: 40 + i }) : null; if (f) E.scene.add(f); party.push({ h, f, off: v3((i % 3 - 1) * 1.3, 0, -i * 2.0) }); }
  return {
    ...E, grade: { sat: 0.82, contrast: 1.25, bloom: 0.95 }, env: { ...NIGHT_ENV, ambient: 0x2a1c1e },
    update(lt) {
      party.forEach((P, i) => {
        const z = 150 - lt * 1.1 + P.off.z, x = P.off.x; P.h.root.position.set(x, hf(x, z), z); P.h.root.rotation.y = Math.PI;
        const p = walkPose(lt * 0.9 + i * 0.3, { stride: 0.45, hunch: 0.15 }); if (P.f) { p.armR = [-1.3, 0, 0.15]; p.foreR = [-0.6, 0, 0]; } applyPose(P.h, p);
        if (P.f) { P.h.root.updateMatrixWorld(true); const tp = P.h.torchTip.getWorldPosition(v3()); P.f.material.uniforms.uOrigin.value.copy(tp); if (i < 6) setPL(i % 6, tp, 0xff9030, 7, 1.0); }
      });
      const z0 = 150 - lt * 1.1;
      aim(E.camera, v3(2.0, hf(2, z0 - 9) + 0.6, z0 - 9), v3(0, hf(0, z0) + 2.2, z0 - 1));
    },
  };
}
function D07() { // you ran, you hid, you grew — gliding through misty peaks
  const E = worldEnv({ fov: 52, cx: 0, cz: -120, sky: { horizon: 0x5a4a50, top: 0x1a1620, cloud: 0x3a3238, cloudLit: 0x9a6a5a } });
  const d = buildDragon('young'); E.scene.add(d.root);
  const hf = E.W.userData.hf;
  return {
    ...E, grade: { sat: 0.75, contrast: 1.15, bloom: 0.8 }, env: { fog: [10, 420], fogCol: 0x5a4c50, hfog: [40, 80, 0.9, 0.008], lightDir: v3(0.5, -0.4, -0.7), lightCol: 0x9a8a88, ambient: 0x3a3238, rim: 0xb08070 },
    update(lt) {
      const z = -80 - lt * 22, x = Math.sin(lt * 0.8) * 8, y = Math.max(hf(x, z) + 30, 90) + Math.sin(lt * 2.2) * 1.2;
      d.root.position.set(x, y, z); d.root.rotation.set(0, Math.PI + Math.cos(lt * 0.8) * 0.25, 0);
      posePart(d, { t: lt, ...fly(lt, 3.2, 0.7), bodyRoll: Math.cos(lt * 0.8) * 0.25 });
      aim(E.camera, v3(x + 5, y + 1.6, z + 7), v3(x, y + 0.3, z - 1));
    },
  };
}
function campEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 46, 0.1);
  scene.add(sky({ horizon: 0x6a3a2a, top: 0x1a1218, bottom: 0x2a1a16, cloud: 0x2a1c1c, cloudLit: 0xb05a2a, sunCol: 0x8a3a14, sunDir: v3(-0.5, 0.15, -1), cover: 0.4 }));
  scene.add(terrain(600, 40, (x, z) => Math.sin(x * 0.02) * 2 + Math.cos(z * 0.03) * 2, { map: T('ash'), color: 0x8a7a6a }));
  const camp = palisadeCamp(); scene.add(camp);
  const H = humanMaterials(); const men = [];
  for (let i = 0; i < 12; i++) { const h = buildHunter(H, { torch: i % 4 === 0 }); const a = i / 12 * Math.PI * 1.2 - 0.3; h.root.position.set(Math.cos(a) * 9, 0, Math.sin(a) * 9 - 4); h.root.rotation.y = Math.atan2(-h.root.position.x, 22 - h.root.position.z); scene.add(h.root); men.push(h); }
  return { scene, camera, camp, men };
}
const CAMP_ENV = { fog: [10, 500], fogCol: 0x6a3a2a, hfog: [0, 1, 0, 0], lightDir: v3(0.5, -0.4, 0.75), lightCol: 0xc08060, ambient: 0x3e3034, rim: 0xff9a60, fillDir: v3(-0.4, -0.3, -0.8), fillCol: 0x4a2a2a };
function D08a() { // at twenty, you fought back — the young dragon rears on the palisade, arrows fly
  const E = campEnv({ fov: 50 });
  const d = buildDragon('young'); d.root.position.set(0, 0, 21); d.root.rotation.y = Math.PI; E.scene.add(d.root);
  const arrows = particles({ mode: 'line', count: 60, origin: v3(0, 1.5, 4), lineB: v3(0, 3.5, 19), spread: v3(1.2, 0.6, 0.2), vel: v3(0, 0.5, 9), life: 0.35, size: 0.06, c0: 0xd8d0c0, c1: 0xb8b0a0, c2: 0x8a8070, seed: 8, front: 1, fogMix: 0.2, additive: false, opacity: 0.9 });
  E.scene.add(arrows);
  E.scene.add(particles({ mode: 'emit', count: 80, origin: v3(0, 3.0, 19.3), spread: v3(1.4, 1.0, 0.6), vel: v3(0, 1.5, -1), life: 0.25, size: 0.04, c0: 0xffffe0, c1: 0xffb040, c2: 0x8a3010, seed: 9, opacity: 0.9 }));
  return {
    ...E, grade: { sat: 0.88, contrast: 1.25, bloom: 0.9 }, env: CAMP_ENV,
    update(lt) {
      const rear = smooth(range(lt, 0.0, 0.7));
      posePart(d, { t: lt, bodyPitch: -rear * 0.5, bodyY: 0.52 + rear * 0.15, wingFold: 0.2, wingUp: 0.6 + Math.sin(lt * 3) * 0.1, wingSweep: 0.1, neckPitch: 0.6, headPitch: -0.55, jaw: 0.75, tailWave: 0.15, legs: { FL: [-0.6 * rear, -0.4], FR: [-0.5 * rear, -0.5], HL: [-0.1, 0.3], HR: [-0.1, 0.3] } });
      E.men.forEach((h, i) => { const p = walkPose(0, { stride: 0 }); p.armR = [-1.6, 0, 0.1]; p.armL = [-1.5, 0.4, -0.1]; p.foreL = [-0.3, 0, 0]; p.neck = [-0.3, 0, 0]; applyPose(h, p); });
      aim(E.camera, v3(-3.5, 1.4, 4.5), v3(0, 4.5, 19));
      shake(E.camera, 0.02, lt);
    },
  };
}
function D08b() { // the fire sweep over the palisade
  const E = campEnv({ fov: 46 });
  const d = buildDragon('young'); d.root.position.set(0, 3.0, 18); d.root.rotation.y = Math.PI; E.scene.add(d.root);
  const fb = fireBreath({ size: 1.6, count: 520, life: 0.8 }); E.scene.add(fb);
  const blaze = []; for (let i = 0; i < 6; i++) { const a = -0.6 + i * 0.24; const f = fireP({ origin: v3(Math.sin(a) * 14, 0.5, 18 - Math.cos(a) * 14 - 4), spread: v3(2.5, 0.8, 2.5), size: 1.3, count: 60, life: 1.1, vel: v3(0, 4, 0), seed: 60 + i, opacity: 0 }); E.scene.add(f); blaze.push({ f, a }); }
  return {
    ...E, grade: { sat: 0.92, contrast: 1.2, bloom: 1.05, bloomT: 0.45 }, env: CAMP_ENV,
    update(lt) {
      const sweep = lerp(-0.6, 0.6, ease(range(lt, 0.1, 1.9)));
      posePart(d, { t: lt, bodyPitch: -0.2, wingFold: 0.1, wingUp: 0.55, neckPitch: 0.7, neckYaw: sweep * 1.2, headPitch: 0.05, jaw: 0.7, tailWave: 0.2, legs: { FL: [-0.3, -0.4], FR: [-0.3, -0.4] } });
      fb.userData.aim(d, smooth(range(lt, 0.05, 0.2)), 26, 0.6);
      blaze.forEach(B => { B.f.material.uniforms.uOpacity.value = smooth(range(sweep, B.a - 0.1, B.a + 0.15)) * 0.9; });
      const m = mouthWorld(d); setPL(0, m.p.clone().addScaledVector(m.f, 8), 0xffa040, 30, 2.2);
      E.men.forEach((h, i) => { const p = walkPose(lt * 2 + i, { stride: 0.7, hunch: 0.3 }); applyPose(h, p); h.root.rotation.y = 0.2; h.root.position.z -= 0.03; });
      aim(E.camera, v3(9.5, 4.2, 31), v3(0.5, 4.5, 12));
      shake(E.camera, 0.05, lt);
    },
  };
}
function D09() { // at one hundred, you blotted out the sun
  const scene = new THREE.Scene(), camera = cam(54, 0.3);
  const sun = v3(-0.1, 0.55, -1).normalize();
  const sk = sky({ horizon: 0xc08a60, top: 0x3a3a58, bottom: 0x5a4a44, cloud: 0x6a5048, cloudLit: 0xffd8a0, sunCol: 0x9a7048, sunDir: sun, cover: 0.45 }); scene.add(sk);
  scene.add(terrain(2000, 50, (x, z) => Math.sin(x * 0.01) * 8 + Math.cos(z * 0.013) * 6 - 10, { map: T('ash'), color: 0x9a9080 }));
  const F = fortress({ fogScale: 0.9 }); F.position.set(0, -2, -60); scene.add(F);
  const sunDisk = glow(0xfff0c0, 70, 0.8); sunDisk.position.copy(sun.clone().multiplyScalar(1600)); scene.add(sunDisk);
  const d = buildDragon('adult'); scene.add(d.root);
  return {
    scene, camera, grade: { sat: 0.85, contrast: 1.2, bloom: 0.55, bloomT: 0.65 },
    env: { fog: [30, 1200], fogCol: 0x8a7468, hfog: [0, 1, 0, 0], lightDir: sun.clone().negate(), lightCol: 0xd0a080, ambient: 0x3a3238, rim: 0xffc080 },
    update(lt) {
      const u = range(lt, 0, 2.8);
      const p = v3(lerp(-50, 40, u), 112 + Math.sin(lt * 2.0) * 2, lerp(-92, -112, u));
      d.root.position.copy(p); d.root.rotation.set(0, Math.PI / 2 + 0.35, 0);
      posePart(d, { t: lt, ...fly(lt, 1.6, 0.6) });
      // as it crosses the sun the world dims
      const camP = v3(6, 28, 60); const toSun = sun.clone(); const toD = p.clone().sub(camP).normalize();
      const cover = Math.pow(clamp((toD.dot(toSun) - 0.97) / 0.03), 2);
      sunDisk.material.opacity = 0.85 - cover * 0.65;
      setEnv({ lightCol: new THREE.Color(0xd0a080).lerp(new THREE.Color(0x3a2a2a), cover).getHex(), ambient: new THREE.Color(0x3a3238).lerp(new THREE.Color(0x1a1418), cover).getHex() });
      aim(camera, camP, v3(lerp(-25, 20, u) * 0.6, 112, -110));
    },
  };
}
function D10() { // the kingdoms stopped fighting each other... to fight you
  const scene = new THREE.Scene(), camera = cam(40, 0.3);
  scene.add(sky({ horizon: 0xd08050, top: 0x2a1e24, bottom: 0x3a2a24, cloud: 0x3a2826, cloudLit: 0xffa060, sunCol: 0xd06a30, sunDir: v3(0, 0.12, -1), cover: 0.42 }));
  const hf = (x, z) => (z < -60 ? Math.min(28, (-60 - z) * 0.5) : 0) + Math.sin(x * 0.03) * 1.5;
  scene.add(terrain(1600, 60, hf, { map: T('ash'), color: 0x8a7a68 }));
  const pos = [], cols = []; const R = rng(3);
  for (const [cx, col] of [[-55, 0x9a3030], [0, 0xb09040], [55, 0x5a6a8a]]) for (let r = 0; r < 9; r++) for (let c = 0; c < 18; c++) { const x = cx * 0.6 + (c - 9) * 2.2 + (R() - 0.5) * 0.4, z = -42 + r * 2.4; pos.push(v3(x, hf(x, z), z)); cols.push(col); }
  scene.add(army(pos, cols, { yaw: Math.PI }));
  const banners = [];
  for (const [cx, col] of [[-55, 0xb04040], [0, 0xd0b060], [55, 0x7a8aaa]]) for (let k = 0; k < 4; k++) { const b = bannerPole(col, { h: 7 }); b.position.set(cx * 0.6 + (k - 1.5) * 8, 0, -44); scene.add(b); banners.push(b); }
  const ballista = []; for (let k = 0; k < 6; k++) ballista.push(xf(merge([box(2.6, 0.8, 4, 'bottom'), xf(box(4.6, 0.25, 0.3, 'bottom'), { p: [0, 1.3, 1.2] }), xf(box(0.25, 0.25, 4.6, 'bottom'), { p: [0, 1.0, 0.4], r: [-0.3, 0, 0] })]), { p: [-45 + k * 18, 0, -48] }));
  mesh(merge(ballista), mat({ map: T('wood'), color: 0x8a7060 }), scene);
  const d = buildDragon('adult'); d.root.position.set(0, hf(0, -120), -120); scene.add(d.root);
  return {
    scene, camera, grade: { sat: 0.85, contrast: 1.25, bloom: 0.9 },
    env: { fog: [20, 900], fogCol: 0x8a5a40, hfog: [0, 1, 0, 0], lightDir: v3(0.3, -0.5, -0.8), lightCol: 0xb08060, ambient: 0x3a2e30, rim: 0xffa060 },
    update(lt) {
      const land = easeOut(range(lt, 0, 1.6));
      d.root.position.y = hf(0, -120) + (1 - land) * 40; d.root.rotation.y = 0;
      const roar = smooth(range(lt, 2.7, 3.1)) * (1 - smooth(range(lt, 4.0, 4.3)));
      posePart(d, { t: lt, ...(land < 1 ? fly(lt, 2.0, 0.7 * (1 - land)) : {}), wingFold: land > 0.95 ? 0.0 : 0, wingUp: lerp(0.12, 0.7, land) + roar * 0.2, wingSweep: 0.0, neckPitch: 0.3 + roar * 0.5, headPitch: -roar * 0.6, jaw: 0.08 + roar * 0.8, tailWave: 0.15, legs: land > 0.9 ? undefined : fly(lt).legs });
      banners.forEach((b, i) => waveFlag(b, lt + i * 0.3));
      aim(camera, v3(5, 2.2 + lt * 0.25, -14), v3(0, 33, -120));
      shake(camera, roar * 0.25, lt);
    },
  };
}
function D11() { // but they weren't afraid of your fire — the war banner of the burned world
  const scene = new THREE.Scene(), camera = cam(36, 0.1);
  scene.add(sky({ horizon: 0x6a3a2a, top: 0x1a1218, cloud: 0x2a1c1c, cloudLit: 0xb05a2a, sunCol: 0x8a3a14, sunDir: v3(0, 0.2, -1), cover: 0.4 }));
  const b = bannerPole(0xe8dcc8, { h: 6 }); b.scale.setScalar(1.6); scene.add(b);
  scene.add(embersP({ origin: v3(1, 6, 0), box: v3(12, 10, 12), count: 220, size: 0.05, vel: v3(1.2, 1.0, 0.4) }));
  return {
    scene, camera, grade: { sat: 0.85, contrast: 1.25, bloom: 0.9 },
    env: { fog: [10, 400], fogCol: 0x4a2a22, lightDir: v3(0.3, -0.4, -0.85), lightCol: 0x9a6a50, ambient: 0x2a2020, rim: 0xb07050, fillDir: v3(0, 0, -1), fillCol: 0x2a1a18 },
    update(lt) {
      waveFlag(b, lt, 0.22);
      setPL(0, v3(1.4, 7.5, 3), 0xff9040, 8, 0.6 + Math.sin(lt * 9) * 0.1);
      aim(camera, v3(1.0 - lt * 0.12, 7.3, 4.2 - lt * 0.25), v3(1.2, 7.6, 0));
    },
  };
}
function D12() { // a thousand years ago, one dragon burned the whole world
  const scene = new THREE.Scene(), camera = cam(56, 0.3);
  scene.add(sky({ horizon: 0xb04a20, top: 0x2a0806, bottom: 0x4a1408, cloud: 0x3a0e08, cloudLit: 0xff8a30, sunCol: 0xa03010, sunDir: v3(0, 0.25, -1), cover: 0.35, swirl: 1.5 }));
  scene.add(terrain(2400, 50, (x, z) => Math.sin(x * 0.01) * 6 - 6, { map: T('ash'), color: 0x6a4a3a }));
  scene.add(ruinsField({ seed: 7, count: 220, center: [0, -6, -300], rMin: 20, rMax: 700, ground: () => -6, hScale: 1.6, color: 0x8a6a5a }));
  const R = rng(5); for (let k = 0; k < 14; k++) { const x = (R() - 0.5) * 500, z = -80 - R() * 500; scene.add(fireP({ origin: v3(x, 4, z), spread: v3(18, 4, 18), size: 9, count: 60, life: 1.4, vel: v3(0, 22, 0), seed: 90 + k })); }
  scene.add(ashP({ origin: v3(0, 30, -60), box: v3(160, 80, 160), count: 700, size: 0.5, vel: v3(3, -2, 1) }));
  const d = buildDragon('ancient'); scene.add(d.root);
  d.M.scale.uniforms.uColor.value.setRGB(0.55, 0.5, 0.5);
  const fb = fireBreath({ size: 16, count: 600, life: 0.9 }); scene.add(fb);
  return {
    scene, camera, grade: { sat: 0.55, contrast: 1.35, bloom: 1.1, bloomT: 0.45, gain: [1.18, 0.9, 0.72], lift: [0.06, 0.02, 0] },
    env: { fog: [40, 1100], fogCol: 0x7a3a1e, hfog: [0, 1, 0, 0], lightDir: v3(0.2, -0.4, 0.9), lightCol: 0xc06a3a, ambient: 0x3a1e16, rim: 0xff8a40 },
    update(lt) {
      const p = v3(lerp(-80, 60, range(lt, 0, 3.9)), 140, -260); d.root.position.copy(p); d.root.rotation.set(0, Math.PI / 2, 0);
      posePart(d, { t: lt, ...fly(lt, 1.2, 0.55), neckPitch: 0.6, headPitch: 0.55, jaw: 0.75 });
      fb.userData.aim(d, smooth(range(lt, 0.4, 0.7)), 120, 0.7);
      setPL(0, v3(p.x, 10, p.z), 0xff8030, 200, 1.6);
      aim(camera, v3(-20, 6, 60), v3(0, 110, -260));
    },
  };
}
function D13() { // its bones were never found — the ancient eye
  const scene = new THREE.Scene(), camera = cam(30, 0.05, 3000);
  scene.add(sky({ ...NIGHT, sunDir: v3(0, 0.2, -1), cover: 0.35 }));
  const d = buildDragon('ancient'); scene.add(d.root); d.M.scale.uniforms.uEmissive.value.multiplyScalar(0.35);
  scene.add(embersP({ origin: v3(0, 8, 6), box: v3(14, 10, 14), count: 160, size: 0.06 }));
  return {
    scene, camera, grade: { sat: 0.9, contrast: 1.3, bloom: 1.1, bloomT: 0.5 },
    env: { fog: [10, 600], fogCol: 0x2a1410, lightDir: v3(0.6, -0.3, -0.6), lightCol: 0x8a4a2a, ambient: 0x221418, rim: 0xc05020 },
    update(lt) {
      posePart(d, { t: lt, ...FOLDED, neckPitch: 0.25, headPitch: 0.1, jaw: 0.05, tailWave: 0.05 });
      const e = eyeWorld(d); const hq = new THREE.Quaternion(); d.headScale.getWorldQuaternion(hq);
      const side = v3(1, 0.15, 0.35).applyQuaternion(hq).normalize();
      aim(camera, e.clone().addScaledVector(side, lerp(11, 8, ease(range(lt, 0, 2.1)))), e.clone().add(v3(0, -0.2, 0)));
      setPL(0, e.clone().addScaledVector(side, 2.0).add(v3(0, 1, 0)), 0xff7030, 8, 0.8);
    },
  };
}
function D14() { // until you flew home
  const E = worldEnv({ fov: 54, cx: 0, cz: -500 });
  const d = buildDragon('ancient'); E.scene.add(d.root);
  const cy = E.W.userData.craterY;
  return {
    ...E, grade: { sat: 0.88, contrast: 1.25, bloom: 1.0, bloomT: 0.5 }, env: NIGHT_ENV,
    update(lt) {
      const u = ease(range(lt, 0, 2.0));
      d.root.position.set(VOLC.x + lerp(30, 0, u), cy + lerp(120, 25, u), VOLC.z + lerp(60, 0, u)); d.root.rotation.set(0, Math.PI, 0);
      posePart(d, { t: lt, ...fly(lt, 1.4, 0.45), wingUp: 0.35, bodyPitch: 0.25, neckPitch: 0.2, headPitch: 0.4 });
      setPL(0, v3(VOLC.x, cy + 8, VOLC.z), 0xff6020, 200, 1.8);
      aim(E.camera, v3(VOLC.x + 70, cy + 140, VOLC.z + 120), v3(VOLC.x + 10, cy + 40, VOLC.z));
    },
  };
}
function bonesEnv() {
  const E = caveEnv({ fov: 38, clear: 26 });
  const bones = buildDragon('ancient', { skeleton: true }); bones.root.position.set(-14, E.g0 - 4.2, -14); bones.root.rotation.y = 0.5; E.scene.add(bones.root);
  posePart(bones, { t: 0, bodyY: 0.52, ...FOLDED, wingFold: 1.0, neckPitch: -0.5, neckYaw: 1.2, tailYaw: -2.6, tailWave: 0, legs: { FL: [1.2, -1.6], FR: [1.2, -1.6], HL: [-1.4, 1.8], HR: [-1.4, 1.8] } });
  bones.root.updateMatrixWorld(true);
  const skull = bones.head; E.scene.attach(skull);
  const S = v3(0.5, E.g0 + 0.9, 3.0); skull.position.copy(S); skull.rotation.set(-0.05, 0.35, 0.12);
  const d = buildDragon('ancient'); d.root.rotation.y = 0.35; E.scene.add(d.root);
  d.M.scale.uniforms.uEmissive.value.multiplyScalar(0.5);
  return { E, bones, skull, S, d, boneHead: bones.headScale };
}
// identical framing on any head: offsets in head-local units
function headCam(cam, hs, k = 1) { hs.updateMatrixWorld(true); aim(cam, hs.localToWorld(v3(0.34 * k, 0.1 + 0.04 * k, 0.36 * k)), hs.localToWorld(v3(0, 0.1, 0.0))); }
function D15a() { // the skull: same horns (the left tip broken), same claw-scars
  const B = bonesEnv(); B.d.root.visible = false;
  return { ...B.E, grade: { sat: 0.85, contrast: 1.3, bloom: 0.8 }, env: { ...CAVE_ENV, ambient: 0x3a2218 },
    update(lt) { B.E.lava(1.1, lt); headCam(B.E.camera, B.boneHead, 2.5 - lt * 0.15); const p = B.boneHead.localToWorld(v3(0.5, 0.5, 0.6)); setPL(0, p, 0xffa060, 20, 1.6); } };
}
function D15b() { // ...and yours, in the very same framing
  const B = bonesEnv(); B.skull.visible = false; B.bones.root.visible = false;
  B.d.root.position.set(-2, B.E.g0 - 0.5, -4);
  return { ...B.E, grade: { sat: 0.88, contrast: 1.3, bloom: 0.9, bloomT: 0.5 }, env: { ...CAVE_ENV, ambient: 0x3a2218 },
    update(lt) { posePart(B.d, { t: lt, ...FOLDED, wingFold: 0.95, neckPitch: 0.1, headPitch: 0.15, jaw: 0.05 }); B.E.lava(1.1, lt); headCam(B.E.camera, B.d.headScale, 2.5 - lt * 0.15); const p = B.d.headScale.localToWorld(v3(0.5, 0.5, 0.6)); setPL(0, p, 0xffa060, 20, 1.6); } };
}
function D15c() { // the living dragon over the bones of the last one
  const B = bonesEnv();
  const pose = (low, lt) => ({ t: lt, ...FOLDED, wingFold: 0.9, wingUp: 0.45, neckPitch: lerp(0.2, -0.5, low), headPitch: lerp(0.1, 0.8, low), jaw: 0.05, tailWave: 0.05 });
  return { ...B.E, grade: { sat: 0.88, contrast: 1.3, bloom: 0.85, bloomT: 0.55 }, env: { ...CAVE_ENV, ambient: 0x3a2218 },
    update(lt) {
      const low = smooth(range(lt, 0, 1.2));
      B.d.root.position.set(0, 0, 0); posePart(B.d, pose(low, lt)); B.d.root.updateMatrixWorld(true);
      const hp = B.d.headScale.localToWorld(v3(0, 0, 0.15));
      const want = B.S.clone().add(v3(-2.5, lerp(7, 3.0, low), -3.5)); B.d.root.position.copy(want.sub(hp)); posePart(B.d, pose(low, lt));
      B.E.lava(1.1, lt);
      const mid = B.S.clone().add(v3(-1.2, 1.5, -1.5));
      setPL(0, mid.clone().add(v3(4, 6, 8)), 0xffb070, 30, 1.6);
      aim(B.E.camera, mid.clone().add(v3(9, 3.5, 21 - lt * 1.0)), mid.clone().add(v3(0, 1, 0)));
    } };
}
function D16a() { // the last line: the ancient on the erupting volcano
  const E = worldEnv({ fov: 60, cx: 0, cz: -460 });
  const hf = E.W.userData.hf, cy = E.W.userData.craterY;
  const d = buildDragon('ancient'); E.scene.add(d.root);
  const rimZ = VOLC.z + 44; const ry = hf(VOLC.x, rimZ);
  d.root.position.set(VOLC.x, ry - 1, rimZ);
  const erupt = particles({ mode: 'emit', count: 420, origin: v3(VOLC.x, cy + 6, VOLC.z - 10), spread: v3(34, 8, 34), vel: v3(0, 150, 0), life: 1.3, size: 10, c0: 0xffa850, c1: 0xff4a10, c2: 0x2a0602, soft: true, seed: 71, opacity: 0.42, fogMix: 0.1 }); E.scene.add(erupt);
  const fb = fireBreath({ size: 14, count: 600, life: 0.9 }); E.scene.add(fb);
  E.scene.add(ashP({ origin: v3(VOLC.x, ry + 30, rimZ + 40), box: v3(160, 100, 160), count: 800, size: 0.5, vel: v3(2, -3, 1) }));
  return {
    ...E, grade: { sat: 0.92, contrast: 1.25, bloom: 1.05, bloomT: 0.5 }, env: { ...NIGHT_ENV, lightCol: 0xa04a2a, rim: 0xff7a40 },
    update(lt) {
      const spread = smooth(range(lt, 0.2, 1.6)), roar = smooth(range(lt, 2.0, 2.5));
      posePart(d, { t: lt, wingFold: lerp(0.8, 0.0, spread), wingUp: lerp(0.35, 0.75, spread) + Math.sin(lt * 1.5) * 0.05, wingSweep: 0.0, bodyPitch: -0.25 * spread, neckPitch: 0.4 + roar * 0.5, headPitch: -0.3 - roar * 0.55, jaw: 0.05 + roar * 0.8, tailWave: 0.1 });
      fb.userData.aim(d, smooth(range(lt, 2.4, 2.8)) * (1 - smooth(range(lt, 4.8, 5.4))), 130, 0.6);
      setPL(0, v3(VOLC.x, cy + 30, VOLC.z), 0xff6020, 300, 2.0);
      const u = ease(range(lt, 0, 5.8));
      aim(E.camera, v3(VOLC.x + lerp(10, 6, u), ry + lerp(0, 3, u), rimZ + lerp(52, 44, u)), v3(VOLC.x, ry + 12, rimZ));
      shake(E.camera, roar * 0.2 * (1 - smooth(range(lt, 5.0, 5.8))), lt);
    },
  };
}
function D16b() { // the eye ignites — cut
  const scene = new THREE.Scene(), camera = cam(26, 0.05, 3000);
  scene.add(sky({ ...NIGHT, cloudLit: 0xff6a20, sunCol: 0x8a2a10, sunDir: v3(0, 0.2, -1), cover: 0.35 }));
  const d = buildDragon('ancient'); scene.add(d.root);
  scene.add(embersP({ origin: v3(0, 8, 6), box: v3(14, 10, 14), count: 260, size: 0.07, vel: v3(1.5, 2, 0.5) }));
  return {
    scene, camera, grade: { sat: 0.92, contrast: 1.3, bloom: 1.25, bloomT: 0.45 },
    env: { fog: [10, 600], fogCol: 0x3a140c, lightDir: v3(0.6, -0.3, -0.6), lightCol: 0xa04a2a, ambient: 0x2a1410, rim: 0xff6a30 },
    update(lt) {
      posePart(d, { t: lt, ...FOLDED, neckPitch: 0.25, headPitch: 0.1 });
      const ig = smooth(range(lt, 0.4, 2.0));
      d.M.eye.uniforms.uColor.value.setRGB(1, 0.63 + ig * 0.35, 0.12 + ig * 0.6);
      d.M.eye.uniforms.uEmissive.value.setRGB(1, 0.55, 0.06).multiplyScalar(1 + ig * 1.5);
      d.M.scale.uniforms.uEmissive.value.setRGB(1, 0.22, 0.05).multiplyScalar(0.08 + ig * 0.28);
      const e = eyeWorld(d); const hq = new THREE.Quaternion(); d.headScale.getWorldQuaternion(hq);
      const side = v3(1, 0.1, 0.25).applyQuaternion(hq).normalize();
      aim(camera, e.clone().addScaledVector(side, lerp(8.5, 5.0, ease(range(lt, 0, 2.8)))), e.clone().add(v3(0, -0.15, 0)));
      setPL(0, e.clone().addScaledVector(side, 1.5), 0xff8030, 6, 0.7 + ig);
    },
  };
}
function D00() { // flash-forward hook: the ancient roars over a burning world
  const s = D16a(); const up = s.update;
  return { ...s, update(lt) { up(2.3 + lt * 0.7); } };
}

export const SHOTS_DRAGON = { D00, D01, D02, D03, D04, D05, D06, D07, D08a, D08b, D09, D10, D11, D12, D13, D14, D15a, D15b, D15c, D16a, D16b };
