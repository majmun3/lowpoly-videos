// WHAT IF YOU WERE BORN AS A GOBLIN? — shot list.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, xf, merge, flat, taper } from '/the-last-ember/render/src/engine.js';
import { T } from '/the-last-ember/render/src/textures.js';
import { applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { buildGoblin, gWalk, gStand, updateCape, goblinMaterials, buildKnightNPC, knightMaterials, buildBrute, buildWolf, poseWolf, buildHare, horde, boneSpear, TG } from './goblin.js';
import { SKY, ENV, rolling, ground, terrainAt, forestTrees, grassTufts, bushes, sunShafts, settlement, fireP, smokeP, overgrownRuins, goblinBanner, waveFlag, sky, terrain, fortress, TW, T2 } from './gworld.js';

const cam = (fov, near = 0.05, far = 6000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
const gw = (j, ph, o = {}) => gWalk(ph, { ...o, hip: j.hipH });
const gs = (j, o = {}) => gStand({ ...o, hip: j.hipH });
const headOf = (j, off = v3(0, 0.12, 0.04)) => { j.root.updateMatrixWorld(true); return j.hs.localToWorld(off.clone()); };
const SUN_DAY = v3(-0.4, 0.75, -0.5).normalize();

// ---------------------------------------------------------------- the forest and the tribe's home
function forestEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50);
  const sk = sky({ ...(o.sky || SKY.forest), sunDir: o.sunDir || SUN_DAY, cloudScale: 0.35 }); scene.add(sk);
  const hf = (x, z) => { const r = Math.hypot(x, z); return rolling(0.8, 0.04, 1)(x, z) * clamp((r - 12) / 20) + (o.dip ? -0.2 : 0); };
  ground(scene, hf, { size: 140, seg: 70, map: o.snow ? T2('snow') : TW('grass'), color: o.groundColor ?? 0xffffff });
  const clear = o.clear ?? 15;
  const trees = forestTrees({ seed: o.seed ?? 3, count: o.trees ?? 170, area: [-90, 90, -110, 70], ground: hf, avoid: (x, z) => Math.hypot(x, z) < clear || (o.path && Math.abs(x) < 3 && z > 0), leafColor: o.leafColor, height: [18, 32], trunkR: [0.7, 1.6] });
  scene.add(trees);
  if (!o.snow) { scene.add(grassTufts({ count: 2500, area: [-40, 40, -45, 35], ground: hf, avoid: (x, z) => o.settle && Math.hypot(x, z) < 9, color: o.grassColor })); scene.add(bushes({ seed: 6, count: 40, area: [-35, 35, -40, 30], ground: hf, avoid: (x, z) => Math.hypot(x, z) < (o.settle ? 12 : 6), color: o.leafColor })); }
  if (o.shafts !== false) scene.add(sunShafts({ count: o.shaftCount ?? 18, area: [-18, 18, -18, 14], height: 30, opacity: o.shaftOpacity ?? 0.085 }));
  let S = null; if (o.settle) { S = settlement(); scene.add(S); }
  return { scene, camera, sk, hf, trees, S };
}
function tribeMembers(scene, n, o = {}) {
  const R = rng(o.seed || 7), out = [];
  const skins = [0xffffff, 0xd8e8b8, 0xc0d0a0, 0xe8e0b0, 0xb8c898];
  for (let i = 0; i < n; i++) { const j = buildGoblin('tribe', { skin: skins[i % skins.length], thin: 1.0 + R() * 0.2, scale: 0.84 + R() * 0.1 }); scene.add(j.root); out.push(j); }
  return out;
}
const campLight = (k = 1, t = 0) => setPL(0, v3(0, 0.8, 0), 0xffa040, 9, 1.1 * k * (0.9 + Math.sin(t * 9) * 0.08));

function G01a() { // canopy and sun shafts — crane down into the tribe's clearing
  const E = forestEnv({ fov: 54, settle: true, shaftCount: 24, shaftOpacity: 0.1 });
  E.scene.add(fireP({ origin: v3(0, 0.2, 0), spread: v3(0.4, 0.1, 0.4), size: 0.4, count: 60 }));
  const T = tribeMembers(E.scene, 7, { seed: 3 });
  T.forEach((j, i) => { const a = i / 7 * Math.PI * 2; j.root.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); j.root.rotation.y = -a - Math.PI / 2; });
  return {
    ...E, grade: { sat: 0.98, contrast: 1.08, bloom: 0.7, bloomT: 0.6 }, env: ENV.forest,
    update(lt) {
      T.forEach((j, i) => { applyPose(j, i % 2 ? gs(j) : gw(j, lt * 0.7 + i * 0.3, { stride: 0.25 })); if (i % 2 === 0) { const a = i / 7 * Math.PI * 2 + lt * 0.12; j.root.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); j.root.rotation.y = -a + Math.PI; } });
      campLight(1, lt);
      const u = ease(range(lt, 0, 3.0));
      aim(E.camera, v3(lerp(6, 4.5, u), lerp(26, 6.5, u), lerp(14, 11, u)), v3(0, lerp(14, 1.0, u), 0));
    },
  };
}
function G01b() { // you open your eyes, surrounded by your tribe
  const E = forestEnv({ fov: 58, settle: true, shaftCount: 20 });
  const nest = mesh(merge(Array.from({ length: 12 }, (_, k) => xf(flat(new THREE.DodecahedronGeometry(0.16, 0)), { p: [Math.cos(k / 12 * 6.28) * 0.42, 0.04, Math.sin(k / 12 * 6.28) * 0.42], s: [1, 0.5, 1] }))), mat({ map: TW('leaves'), color: 0xc8b070 }), E.scene, [4.0, 0, 2.0]);
  mesh(new THREE.CircleGeometry(0.42, 8), mat({ map: TW('hide') }), E.scene, [4.0, 0.03, 2.0], [-Math.PI / 2, 0, 0]);
  const runt = buildGoblin('runt'); runt.root.position.set(4.0, 0.02, 2.0); E.scene.add(runt.root);
  const T = tribeMembers(E.scene, 4, { seed: 9 });
  T.forEach((j, i) => { const a = -0.6 + i * 0.55; j.root.position.set(4.0 + Math.sin(a) * 1.15, 0, 2.0 - Math.cos(a) * 1.15); j.root.rotation.y = Math.atan2(4.0 - j.root.position.x, 2.0 - j.root.position.z); });
  return {
    ...E, grade: { sat: 0.98, contrast: 1.08, bloom: 0.75, bloomT: 0.6 }, env: ENV.forest,
    update(lt) {
      const wake = smooth(range(lt, 0.6, 1.4)), sit = smooth(range(lt, 1.6, 3.0));
      runt.M.eye.uniforms.uColor.value.setRGB(1, 0.69, 0.19).multiplyScalar(0.15 + wake * 0.85);
      applyPose(runt, { hipY: lerp(0.09, 0.14, sit), pelvis: [lerp(-1.45, -0.3, sit), 0, 0], spine: [lerp(0.1, 0.35, sit), 0, 0], neck: [lerp(0.0, -0.4, sit), 0, 0], head: [lerp(-0.2, -0.45, sit), lerp(0, 0.3, sit), 0], thighL: [lerp(0.2, -1.4, sit), 0, 0.3], shinL: [lerp(0.3, 1.6, sit), 0, 0], thighR: [lerp(0.2, -1.4, sit), 0, -0.3], shinR: [lerp(0.3, 1.6, sit), 0, 0], armL: [lerp(0.4, -0.5, sit), 0, -0.4], armR: [lerp(0.4, -0.5, sit), 0, 0.4], foreL: [-0.6, 0, 0], foreR: [-0.6, 0, 0] });
      runt.root.rotation.y = 0.4;
      T.forEach((j, i) => { const p = gs(j, { hunch: 0.55 }); p.neck = [0.35, 0, 0]; p.head = [0.25, Math.sin(lt * 0.8 + i) * 0.15, 0]; applyPose(j, p); });
      setPL(1, v3(4.3, 1.4, 3.0), 0xfff0c0, 4, 0.6);
      aim(E.camera, v3(4.7, 0.42, 2.95), v3(3.95, 0.5, 1.85));
    },
  };
}
function G02() { // smaller than all of them
  const E = forestEnv({ fov: 40, settle: true });
  const runt = buildGoblin('runt'); E.scene.add(runt.root);
  const T = tribeMembers(E.scene, 6, { seed: 11 });
  return {
    ...E, grade: { sat: 0.98, contrast: 1.08, bloom: 0.7, bloomT: 0.6 }, env: ENV.forest,
    update(lt) {
      const line = [0, 1, 2, 'runt', 3, 4, 5];
      line.forEach((id, k) => { const j = id === 'runt' ? runt : T[id]; j.root.position.set(-4.2 + k * 1.0 + lt * 0.55, 0, 1.6 + (k % 2) * 0.25); j.root.rotation.y = Math.PI * 0.5 + (id === 'runt' ? 0.15 : 0); applyPose(j, gw(j, lt * 0.8 + k * 0.4, { stride: id === 'runt' ? 0.55 : 0.32, hunch: 0.25 })); });
      runt.root.position.x += Math.sin(lt * 5) * 0.02;
      aim(E.camera, v3(-1.3 + lt * 0.55, 0.6, 5.6), v3(-1.1 + lt * 0.55, 0.7, 1.6));
    },
  };
}
function G03() { // they took your food — and left you behind
  const E = forestEnv({ fov: 46, settle: true, path: true });
  const runt = buildGoblin('runt'); runt.root.position.set(0.5, 0, 8.6); runt.root.rotation.y = Math.PI - 0.3; E.scene.add(runt.root);
  const meat = new THREE.Group(); mesh(prism(5, 0.02, 0.02, 0.24, 'center'), mat({ map: TG('bone') }), meat); mesh(flat(new THREE.DodecahedronGeometry(0.07, 0)), mat({ color: 0x8a3a28, rim: 1 }), meat, [0, 0.05, 0], [0, 0, 0], [1, 1.3, 1]); E.scene.add(meat);
  const big = buildGoblin('tribe', { thin: 1.2, scale: 0.95, skin: 0xd0d8a8 }); big.root.position.set(0.0, 0, 7.6); E.scene.add(big.root);
  const T = tribeMembers(E.scene, 4, { seed: 13 });
  return {
    ...E, grade: { sat: 0.98, contrast: 1.08, bloom: 0.7 }, env: ENV.forest,
    update(lt) {
      const grab = smooth(range(lt, 0.25, 0.7)), shove = smooth(range(lt, 0.7, 1.0)), fall = easeIn(range(lt, 0.75, 1.15));
      applyPose(runt, keyed([[0, { ...gs(runt), armR: [-1.2, 0, 0.1], foreR: [-0.9, 0, 0], neck: [-0.3, 0, 0] }], [0.7, { ...gs(runt), armR: [-1.6, 0, 0.1], foreR: [-0.3, 0, 0], neck: [-0.5, 0, 0] }], [1.15, { hipY: 0.1, pelvis: [-1.2, 0, 0], spine: [0.2, 0, 0], neck: [-0.6, 0, 0], thighL: [-1.2, 0, 0.3], shinL: [0.6, 0, 0], thighR: [-0.9, 0, -0.3], shinR: [0.4, 0, 0], armL: [0.6, 0, -0.6], armR: [0.6, 0, 0.6] }], [2.8, { hipY: 0.12, pelvis: [-0.9, 0, 0], spine: [0.4, 0, 0], neck: [-0.4, 0, 0], thighL: [-1.4, 0, 0.3], shinL: [1.0, 0, 0], thighR: [-1.2, 0, -0.3], shinR: [0.8, 0, 0], armL: [0.3, 0, -0.4], armR: [-0.4, 0, 0.4], foreR: [-0.8, 0, 0] }]], lt));
      runt.root.rotation.y = Math.PI - 0.3; runt.root.position.z = 8.6 + fall * 0.25;
      const walkOff = smooth(range(lt, 1.2, 2.8));
      big.root.rotation.y = lerp(0.3, Math.PI + 0.2, smooth(range(lt, 1.0, 1.4)));
      big.root.position.set(lerp(0.0, -0.6, walkOff), 0, 7.6 - walkOff * 4.0);
      applyPose(big, lt < 1.1 ? keyed([[0, gs(big)], [0.55, { ...gs(big), armR: [-1.4, 0, 0.1], foreR: [-0.2, 0, 0] }], [0.85, { ...gs(big), armR: [-0.6, 0, 0.1], foreR: [-1.2, 0, 0], armL: [-1.2, 0, -0.1], foreL: [-0.1, 0, 0] }]], lt) : { ...gw(big, lt * 0.8, { stride: 0.35 }), armR: [-0.7, 0, 0.1], foreR: [-1.3, 0, 0] });
      // the food passes from the runt's hand to the big goblin's
      E.scene.updateMatrixWorld(true);
      const ph = (grab < 0.98 ? runt : big).handR.localToWorld(v3(0, -0.08, 0.04)); meat.position.copy(ph);
      T.forEach((j, i) => { const z = 6.2 - walkOff * 4.5 - i * 0.6, x = -1.8 + i * 1.1; j.root.position.set(x, 0, z); j.root.rotation.y = Math.PI; applyPose(j, walkOff > 0.01 ? gw(j, lt * 0.8 + i * 0.3, { stride: 0.35 }) : gs(j)); });
      aim(E.camera, v3(1.8, 0.75, 10.2), v3(0.0, 0.55, 7.6 - walkOff * 1.5));
    },
  };
}
function G04() { // out here, weakness is a death sentence — the wolf watches from the trees
  const E = forestEnv({ fov: 44, shaftCount: 10, sunDir: v3(-0.6, 0.45, -0.5).normalize() });
  const runt = buildGoblin('runt'); runt.root.position.set(0, 0, 0); runt.root.rotation.y = 0.9; E.scene.add(runt.root);
  const w = buildWolf({ color: 0xb4aea8 }); w.root.position.set(-0.75, 0, -8.1); w.root.rotation.y = 0.12; E.scene.add(w.root);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.12, bloom: 0.7 }, env: { ...ENV.forest, fogCol: 0xa8b098, lightCol: 0xffe0b0, ambient: 0x4a5444 },
    update(lt) {
      applyPose(runt, { hipY: 0.13, pelvis: [-0.9, 0, 0], spine: [0.5, 0, 0], neck: [-0.2, 0, 0], head: [0.3, Math.sin(lt * 0.7) * 0.2, 0], thighL: [-1.5, 0, 0.3], shinL: [1.5, 0, 0], thighR: [-1.5, 0, -0.3], shinR: [1.5, 0, 0], armL: [-0.9, 0.4, -0.2], foreL: [-1.3, 0, 0], armR: [-0.9, -0.4, 0.2], foreR: [-1.3, 0, 0] });
      const crouch = smooth(range(lt, 0.6, 2.4));
      poseWolf(w, { phase: lt * 0.3, run: 0.15, lift: -crouch * 0.12, neck: -crouch * 0.4, jaw: 0.1 + crouch * 0.2, pitch: 0.05 });
      w.root.position.z = -8.1 + crouch * 0.5;
      aim(E.camera, v3(-0.35, 1.15, -9.6 + lt * 0.12), v3(0.05, 0.3, 0));
    },
  };
}
// ---------------------------------------------------------------- the invasion
function invasionEnv(o = {}) {
  const E = forestEnv({ fov: o.fov ?? 48, settle: true, sky: SKY.sunset, sunDir: v3(0.6, 0.18, 0.8).normalize(), shaftCount: 8, shaftOpacity: 0.06 });
  const KM = knightMaterials(); const K = [];
  for (let i = 0; i < 7; i++) { const k = buildKnightNPC(KM, { torch: i % 3 === 0 }); E.scene.add(k.root); K.push(k); }
  const fires = [], smokes = [];
  return { ...E, K, fires, smokes };
}
const INV_ENV = { ...ENV.sunset, fog: [10, 260], fogCol: 0xc09070 };
function G05() { // then the knights came
  const E = invasionEnv({ fov: 46 });
  const banner = new THREE.Group(); mesh(prism(5, 0.03, 0.03, 3.6), mat({ map: T('wood') }), banner); mesh(new THREE.PlaneGeometry(0.8, 1.2), mat({ map: TG('tabard'), side: THREE.DoubleSide }), banner, [0.42, 2.9, 0]); E.scene.add(banner);
  const torches = E.K.filter(k => k.torchTip).map((k, i) => { const f = fireP({ origin: v3(), spread: v3(0.08, 0.04, 0.08), size: 0.25, count: 40, vel: v3(0, 1.4, 0), life: 0.5, seed: 50 + i }); E.scene.add(f); return [k, f]; });
  return {
    ...E, grade: { sat: 1.0, contrast: 1.12, bloom: 0.8, bloomT: 0.55 }, env: INV_ENV,
    update(lt) {
      E.K.forEach((k, i) => { const z = -22 + lt * 1.6 + (i % 3) * -1.6, x = -3 + i * 1.0; k.root.position.set(x, E.hf(x, z), z); k.root.rotation.y = 0; const p = walkPose(lt * 0.9 + i * 0.25, { stride: 0.42, hunch: 0.05, hip: 0.98 }); if (k.torchTip) { p.armR = [-1.3, 0, 0.12]; p.foreR = [-0.6, 0, 0]; } else { p.armR = [-0.5, 0, 0.15]; p.foreR = [-0.6, 0, 0]; } applyPose(k, p); });
      banner.position.copy(E.K[3].root.position).add(v3(0.3, 0, -0.4));
      torches.forEach(([k, f], i) => { k.root.updateMatrixWorld(true); const p = k.torchTip.getWorldPosition(v3()); f.material.uniforms.uOrigin.value.copy(p); setPL(1 + i, p, 0xff9030, 6, 1.0); });
      aim(E.camera, v3(0.6, 0.25, -11.5 + lt * 0.6), v3(0, 2.0, -20 + lt * 1.6));
    },
  };
}
function G06() { // your home burned, your tribe fell
  const E = invasionEnv({ fov: 52 });
  E.S.userData.spots.forEach(([x, z, r, h], i) => { E.scene.add(fireP({ origin: v3(x, h * 0.4, z), spread: v3(r * 0.9, h * 0.35, r * 0.9), size: 1.0, count: 90, life: 1.0, vel: v3(0, 3, 0), seed: 60 + i })); E.scene.add(smokeP({ origin: v3(x, h + 0.5, z), seed: 70 + i })); });
  E.S.userData.hide.uniforms.uColor.value.setRGB(0.45, 0.32, 0.25);
  const runt = buildGoblin('runt'); runt.root.position.set(1.2, 0, 13.2); runt.root.rotation.y = Math.PI; E.scene.add(runt.root);
  const T = tribeMembers(E.scene, 5, { seed: 17 });
  return {
    ...E, grade: { sat: 1.0, contrast: 1.15, bloom: 0.9, bloomT: 0.5 }, env: { ...INV_ENV, ambient: 0x5a4040 },
    update(lt) {
      E.K.forEach((k, i) => { const a = i / 7 * Math.PI * 2 + lt * 0.15; const x = Math.cos(a) * 3.5, z = Math.sin(a) * 3.5; k.root.position.set(x, 0, z); k.root.rotation.y = -a - Math.PI / 2; const sw = Math.sin(lt * 4 + i * 1.3); applyPose(k, { ...walkPose(lt * 0.6 + i, { stride: 0.2, hip: 0.98 }), armR: [-1.5 - sw * 0.8, 0, 0.2], foreR: [-0.4, 0, 0], chest: [0, sw * 0.4, 0] }); });
      T.forEach((j, i) => { const f = smooth(range(lt, 0.3 + i * 0.35, 0.7 + i * 0.35)); const a = i * 1.3; j.root.position.set(Math.cos(a) * 5.5, 0, Math.sin(a) * 5.5 + 2); j.root.rotation.y = a; applyPose(j, f > 0.01 ? { hipY: lerp(j.hipH, 0.12, f), pelvis: [-f * 1.4, 0, 0], spine: [0.3, 0, 0], armL: [0.8 * f, 0, -0.8], armR: [0.8 * f, 0, 0.8], thighL: [-0.4, 0, 0.2], thighR: [-0.2, 0, -0.2] } : gw(j, lt * 1.6 + i, { stride: 0.7, hunch: 0.4 })); });
      applyPose(runt, { hipY: 0.24, pelvis: [-0.3, 0, 0], spine: [0.4, 0, 0], neck: [-0.3, 0, 0], thighL: [-1.4, 0, 0.3], shinL: [1.9, 0, 0], thighR: [-1.4, 0, -0.3], shinR: [1.9, 0, 0], armL: [-1.0, 0, -0.2], foreL: [-0.9, 0, 0], armR: [-1.0, 0, 0.2], foreR: [-0.9, 0, 0] });
      E.S.userData.spots.slice(0, 4).forEach(([x, z, r, h], i) => setPL(i, v3(x, h * 0.6, z), 0xff7a20, 12, 1.6 * (0.85 + Math.sin(lt * 8 + i) * 0.15)));
      aim(E.camera, v3(2.1, 0.95, 16.4), v3(0.6, 1.2, 2.0));
    },
  };
}
function G07() { // and you ran
  const scene = new THREE.Scene(), camera = cam(50);
  scene.add(sky({ ...SKY.sunset, sunDir: v3(0.7, 0.2, 0.6).normalize() }));
  const hf = rolling(1.6, 0.025, 2);
  ground(scene, hf, { size: 160, seg: 110, color: 0xe8e0b0 });
  scene.add(grassTufts({ count: 2600, area: [-30, 30, -30, 30], ground: hf, tall: 0.75, scale: 0.9, color: 0x8a9850, tints: [0xffffff, 0xf0d8a0, 0xd8c890], avoid: (x, z) => z > 2.6 && z < 5.5 }));
  scene.add(forestTrees({ seed: 31, count: 60, area: [-200, 200, -260, -80], ground: hf, height: [16, 26] }));
  scene.add(smokeP({ origin: v3(-40, 4, -150), spread: v3(14, 4, 14), size: 16, count: 90, vel: v3(2, 12, 0), life: 6, opacity: 0.4 }));
  const runt = buildGoblin('runt'); scene.add(runt.root);
  return {
    scene, camera, grade: { sat: 0.98, contrast: 1.1, bloom: 0.8, bloomT: 0.55 }, env: { ...ENV.sunset, fog: [20, 400] },
    update(lt) {
      const x = -6 + lt * 3.6, z = 2; runt.root.position.set(x, hf(x, z), z); runt.root.rotation.y = Math.PI / 2;
      applyPose(runt, gw(runt, lt * 2.6, { stride: 0.9, hunch: 0.5 }));
      aim(camera, v3(x + 0.8, hf(x + 0.8, z + 3.6) + 0.7, z + 3.6), v3(x + 0.3, hf(x, z) + 0.35, z - 2));
    },
  };
}
// ---------------------------------------------------------------- survival
function G08a() { // you learned to hunt
  const scene = new THREE.Scene(), camera = cam(40);
  scene.add(sky({ ...SKY.day, sunDir: SUN_DAY }));
  const hf = rolling(0.8, 0.03, 4);
  ground(scene, hf, { size: 120, seg: 80 });
  scene.add(grassTufts({ count: 3000, area: [-25, 25, -25, 25], ground: hf, tall: 1.4 }));
  scene.add(forestTrees({ seed: 41, count: 70, area: [-150, 150, -200, -40], ground: hf }));
  const g = buildGoblin('survivor'); g.root.position.set(0, hf(0, 4), 4); g.root.rotation.y = Math.PI; scene.add(g.root);
  const hare = buildHare(); hare.root.position.set(-0.4, hf(-0.4, -3), -3); hare.root.rotation.y = 0.8; scene.add(hare.root);
  const fly = boneSpear(goblinMaterials()); fly.visible = false; scene.add(fly);
  return {
    scene, camera, grade: { sat: 0.98, contrast: 1.08, bloom: 0.6 }, env: ENV.meadow,
    update(lt) {
      const thr = smooth(range(lt, 0.55, 0.85));
      applyPose(g, keyed([[0, { ...gs(g, { hunch: 0.6 }), hipY: g.hipH - 0.12, armR: [-2.6, 0, 0.3], foreR: [-1.0, 0, 0], armL: [-0.8, 0, -0.2] }], [0.55, { ...gs(g, { hunch: 0.5 }), hipY: g.hipH - 0.1, armR: [-2.9, 0, 0.3], foreR: [-1.3, 0, 0], chest: [0, 0.5, 0], armL: [-1.4, 0, -0.2] }], [0.85, { ...gs(g, { hunch: 0.6 }), hipY: g.hipH - 0.12, armR: [-1.0, 0, 0.2], foreR: [-0.1, 0, 0], chest: [0.2, -0.4, 0], armL: [-0.3, 0, -0.3] }], [1.6, { ...gs(g, { hunch: 0.5 }), hipY: g.hipH - 0.1, armR: [-0.8, 0, 0.2], foreR: [-0.2, 0, 0] }]], lt));
      g.spear.visible = lt < 0.8; fly.visible = lt >= 0.8;
      const fz = lerp(3.4, -2.9, easeOut(range(lt, 0.8, 1.05))); fly.position.set(lerp(-0.05, -0.4, range(lt, 0.8, 1.05)), hf(0, fz) + lerp(1.1, 0.15, range(lt, 0.8, 1.05)), fz); fly.rotation.set(-1.4, 0, 0);
      hare.body.rotation.z = lt > 1.0 ? -1.4 : 0; hare.body.position.y = lt > 1.0 ? 0.06 : 0.1 + Math.abs(Math.sin(lt * 9)) * 0.03 * (1 - thr);
      aim(camera, v3(0.55, hf(0, 4) + 0.95, 5.5), v3(-0.3, hf(0, -2) + 0.3, -2.5));
    },
  };
}
function G08b() { // to make weapons — autumn, a small fire under a ruined arch
  const E = forestEnv({ fov: 34, leafColor: 0xffb060, grassColor: 0xb0a050, shaftCount: 10, clear: 10 });
  E.scene.add(overgrownRuins({ count: 10, rMin: 6, rMax: 22 }));
  E.scene.add(particles({ mode: 'drift', count: 260, box: v3(14, 8, 14), vel: v3(0.5, -0.6, 0.2), size: 0.07, c0: 0xd87a28, origin: v3(0, 4, 0), additive: false, opacity: 1, swirl: 1.4, seed: 81, fogMix: 0.3 }));
  E.scene.add(fireP({ origin: v3(0.75, 0.1, 0.7), spread: v3(0.12, 0.04, 0.12), size: 0.12, count: 35, opacity: 0.7 }));
  const g = buildGoblin('survivor'); g.root.position.set(0, 0, 0); g.root.rotation.y = 0.8; E.scene.add(g.root);
  g.spear.visible = false;
  const tool = new THREE.Group(); mesh(prism(5, 0.012, 0.014, 0.6, 'center'), mat({ map: T('wood') }), tool); const head = mesh(taper(0.05, 0.012, 0.0, 0.008, 0.16), mat({ map: T('stone') }), tool, [0, 0.36, 0]); E.scene.add(tool);
  return {
    ...E, grade: { sat: 1.0, contrast: 1.1, bloom: 0.45, bloomT: 0.7 }, env: { ...ENV.forest, lightCol: 0xffd8a0 },
    update(lt) {
      const k = Math.sin(lt * 9) * 0.5 + 0.5;
      applyPose(g, { hipY: 0.15, pelvis: [-0.4, 0, 0], spine: [0.55, 0, 0], neck: [0.3, 0, 0], head: [0.2, 0, 0], thighL: [-1.6, 0, 0.5], shinL: [2.2, 0, 0], thighR: [-1.6, 0, -0.5], shinR: [2.2, 0, 0], armL: [-1.1, 0.4, -0.1], foreL: [-1.2, 0, 0], armR: [-1.0, -0.4, 0.1], foreR: [-1.1 - k * 0.3, 0.2, 0] });
      g.root.updateMatrixWorld(true);
      const hl = g.handL.localToWorld(v3(0, -0.06, 0.02)), hr = g.handR.localToWorld(v3(0, -0.06, 0.02));
      tool.position.copy(hl); tool.lookAt(hr); tool.rotateX(Math.PI / 2);
      setPL(0, v3(0.75, 0.4, 0.7), 0xffa040, 3, 0.6 * (0.9 + Math.sin(lt * 11) * 0.1));
      aim(E.camera, hl.clone().add(v3(-0.6, 0.45, 1.15)), hl.clone().add(v3(0.05, 0.0, 0)));
    },
  };
}
function G09() { // to kill things that wanted to eat you — winter, the dire wolf
  const E = forestEnv({ fov: 46, snow: true, leafColor: 0xe8eef4, shaftCount: 6, sky: SKY.winter, clear: 12 });
  E.scene.add(particles({ mode: 'drift', count: 1200, box: v3(26, 16, 26), vel: v3(0.4, -1.2, 0.15), size: 0.035, c0: 0xffffff, origin: v3(0, 6, 0), additive: false, opacity: 0.95, swirl: 0.6, seed: 91, fogMix: 0.4 }));
  const g = buildGoblin('survivor'); g.root.position.set(0, 0, 0); g.root.rotation.y = Math.PI; E.scene.add(g.root);
  const w = buildWolf({ color: 0xb0aaa4 }); E.scene.add(w.root);
  E.scene.add(particles({ mode: 'burst', count: 120, origin: v3(0, 0.6, -1.8), start: 1.55, spread: v3(1.6, 0.8, 1.6), vel: v3(0, 0.4, 0), life: 1.4, size: 0.04, c0: 0xffffff, c1: 0xe8eef4, c2: 0xc0c8d0, seed: 92, additive: false, opacity: 0.9 }));
  return {
    ...E, grade: { sat: 0.95, contrast: 1.1, bloom: 0.6 }, env: ENV.winter,
    update(lt) {
      const leap = range(lt, 0.4, 1.35), land = smooth(range(lt, 1.35, 1.6));
      const wz = lerp(-7, -1.2, leap), wy = Math.sin(leap * Math.PI) * 1.6 * (1 - land);
      w.root.position.set(lerp(-0.5, 0.6, leap), wy, wz); w.root.rotation.set(lt > 1.4 ? lerp(0, 0.2, land) : 0, 0, lt > 1.4 ? land * 1.4 : 0);
      poseWolf(w, lt < 0.4 ? { phase: lt * 2.2, run: 1 } : lt < 1.35 ? { phase: 0.25, run: 0, reach: true, jaw: 0.7, neck: 0.2 } : { phase: 0, run: 0, jaw: 0.3, legs: 0.6, lift: -0.3 * land });
      applyPose(g, keyed([[0, { ...gs(g, { hunch: 0.5 }), hipY: g.hipH - 0.08, armR: [-1.1, 0, 0.2], foreR: [-0.6, 0, 0], armL: [-0.9, 0.3, -0.2], foreL: [-0.8, 0, 0] }], [0.9, { ...gs(g, { hunch: 0.6 }), hipY: g.hipH - 0.18, armR: [-1.4, 0, 0.3], foreR: [-0.9, 0, 0], thighL: [-1.0, 0, 0.3], shinL: [1.4, 0, 0] }], [1.3, { ...gs(g, { hunch: 0.4 }), hipY: g.hipH - 0.1, chest: [0, -0.5, 0], armR: [-2.2, 0, 0.1], foreR: [-0.1, 0, 0], armL: [-1.6, 0, -0.1], foreL: [-0.6, 0, 0], thighL: [-0.8, 0, 0.3], shinL: [1.0, 0, 0], thighR: [0.4, 0, -0.2] }], [2.8, { ...gs(g, { hunch: 0.35 }), armR: [-0.9, 0, 0.2], foreR: [-0.4, 0, 0], neck: [0.1, 0, 0] }]], lt));
      g.spear.rotation.set(Math.PI / 2 + (lt > 1.0 ? 0.1 : 0.9), 0, 0);
      aim(E.camera, v3(5.0, 1.1, -0.3 - lt * 0.1), v3(0.2, 0.8, -0.6));
      shake(E.camera, Math.exp(-Math.pow((lt - 1.35) * 6, 2)) * 0.05, lt);
    },
  };
}
function G10() { // seasons passed, then years — a hilltop and a lone great tree
  const scene = new THREE.Scene(), camera = cam(52);
  const sk = sky({ ...SKY.day, sunDir: SUN_DAY }); scene.add(sk);
  const hf = (x, z) => 6 * Math.exp(-(x * x + z * z) / 400) + rolling(1.5, 0.02, 5)(x, z);
  const gl = terrainAt(0, 0, 160, 110, hf, {}); scene.add(gl); const gfar = terrainAt(0, 0, 3200, 64, hf, { dy: -0.8 }); scene.add(gfar);
  const gm = gl.material, gm2 = gfar.material;
  const tree = forestTrees({ seed: 51, count: 1, area: [3, 3.01, -3, -2.99], ground: hf, height: [12, 12], trunkR: [1.0, 1.0], canopyScale: 0.85 }); scene.add(tree);
  const far = forestTrees({ seed: 52, count: 120, area: [-300, 300, -320, -60], ground: hf, height: [14, 24] }); scene.add(far);
  const grass = grassTufts({ count: 1500, area: [-20, 20, -20, 20], ground: hf }); scene.add(grass);
  const snowP = particles({ mode: 'drift', count: 900, box: v3(30, 18, 30), vel: v3(0.4, -1.4, 0.2), size: 0.04, c0: 0xffffff, origin: v3(0, 12, 0), additive: false, opacity: 0, swirl: 0.6, seed: 101, fogMix: 0.4 }); scene.add(snowP);
  const leavesP = particles({ mode: 'drift', count: 300, box: v3(20, 14, 20), vel: v3(0.6, -0.7, 0.2), size: 0.08, c0: 0xd8781e, origin: v3(2, 10, -2), additive: false, opacity: 0, swirl: 1.4, seed: 102, fogMix: 0.3 }); scene.add(leavesP);
  const g = buildGoblin('survivor'); scene.add(g.root);
  const seasons = [
    { leaf: 0x8ad050, ground: 0xffffff, horizon: 0xc8d4c8, top: 0x4a7aa8, snow: 0, fall: 0, light: 0xfff0d0, fog: 0xc8d4c0 },
    { leaf: 0xe0b040, ground: 0xe8d8a0, horizon: 0xe8c898, top: 0x5a7aa0, snow: 0, fall: 1, light: 0xffd8a0, fog: 0xd8c8a8 },
    { leaf: 0xf0f4ff, ground: 0x0, horizon: 0xdce4ec, top: 0x7a90b0, snow: 1, fall: 0, light: 0xf0f0ff, fog: 0xdee4ea },
    { leaf: 0x9ad860, ground: 0xffffff, horizon: 0xd0dcc8, top: 0x4a80b0, snow: 0, fall: 0, light: 0xfff4d8, fog: 0xc8d8c4 },
  ];
  const snowTex = T2('snow'), grassTex = TW('grass');
  return {
    scene, camera, grade: { sat: 1.0, contrast: 1.08, bloom: 0.45, bloomT: 0.7 }, env: ENV.meadow,
    update(lt) {
      const s = clamp(lt / 3.4) * 3, i0 = Math.min(2, Math.floor(s)), f = smooth(s - i0), A = seasons[i0], B = seasons[i0 + 1];
      const L = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), f);
      tree.userData.leafMat.uniforms.uColor.value.copy(L(A.leaf, B.leaf)); far.userData.leafMat.uniforms.uColor.value.copy(L(A.leaf, B.leaf));
      const snowy = A.snow * (1 - f) + B.snow * f;
      gm.uniforms.map.value = gm2.uniforms.map.value = snowy > 0.5 ? snowTex : grassTex; grass.visible = snowy < 0.5;
      const u = sk.userData.u; u.uHorizon.value.copy(L(A.horizon, B.horizon)); u.uTop.value.copy(L(A.top, B.top));
      snowP.material.uniforms.uOpacity.value = snowy * 0.95; leavesP.material.uniforms.uOpacity.value = (A.fall * (1 - f) + B.fall * f);
      setEnv({ lightCol: L(A.light, B.light).getHex(), fogCol: L(A.fog, B.fog).getHex() });
      const grow = smooth(range(lt, 0.3, 3.3));
      g.root.scale.setScalar(lerp(0.8, 1.0, grow)); g.root.position.set(0, hf(0, 0), 0); g.root.rotation.y = Math.PI + 0.6;
      const p = gs(g, { hunch: lerp(0.35, 0.15, grow) }); p.armR = [-0.2, 0, 0.2]; p.neck = [-0.2, 0, 0]; applyPose(g, p);
      const a = 0.4 + lt * 0.18;
      const b = 0.15 + lt * 0.12;
      aim(camera, v3(-Math.sin(b) * 3.6, hf(0, 0) + 0.9, Math.cos(b) * 3.6), v3(0.7, hf(0, 0) + 1.6, -1.6));
    },
  };
}
// ---------------------------------------------------------------- the brute
function ruinsEnv(o = {}) {
  const shafts = o.shafts !== false;
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50);
  scene.add(sky({ ...SKY.day, sunDir: v3(-0.5, 0.6, -0.6).normalize() }));
  const hf = (x, z) => rolling(0.7, 0.04, 7)(x, z) * clamp((Math.hypot(x, z) - 10) / 15);
  ground(scene, hf, { size: 140, seg: 80, color: 0xd8e0b8 });
  scene.add(overgrownRuins({ count: 40, rMin: 18, rMax: 70, ground: hf }));
  scene.add(forestTrees({ seed: 61, count: 80, area: [-120, 120, -140, 80], ground: hf, avoid: (x, z) => Math.hypot(x, z) < 26 }));
  scene.add(grassTufts({ count: 1800, area: [-22, 22, -22, 22], ground: hf, avoid: (x, z) => Math.hypot(x, z) < 6 }));
  if (shafts) scene.add(sunShafts({ count: 6, area: [-12, 4, -18, -6], height: 26, opacity: 0.06 }));
  const b = buildBrute(); scene.add(b.root);
  return { scene, camera, hf, b };
}
const BRUTE_IDLE = { hipY: 0.95, spine: [0.15, 0, 0], chest: [0.1, 0, 0], neck: [-0.15, 0, 0], armR: [-0.4, 0, 0.3], foreR: [-0.6, 0, 0], armL: [-0.2, 0, -0.35], foreL: [-0.4, 0, 0], thighL: [-0.3, 0, 0.1], shinL: [0.4, 0, 0], thighR: [0.2, 0, -0.1], shinR: [0.3, 0, 0] };
function G11a() { // something far stronger than yourself
  const E = ruinsEnv({ fov: 56 });
  E.b.root.position.set(0, 0, -6); E.b.root.rotation.y = 0;
  const g = buildGoblin('survivor', { scale: 1.0 }); g.root.position.set(0.5, 0, -1.0); g.root.rotation.y = Math.PI; E.scene.add(g.root);
  return {
    ...E, grade: { sat: 0.98, contrast: 1.12, bloom: 0.6 }, env: ENV.ruins,
    update(lt) {
      const roar = smooth(range(lt, 0.3, 0.8)) * (1 - smooth(range(lt, 1.6, 2.0))), swing = range(lt, 2.0, 2.6);
      applyPose(E.b, keyed([[0, BRUTE_IDLE], [0.8, { ...BRUTE_IDLE, spine: [-0.15, 0, 0], neck: [-0.5, 0, 0], armR: [-1.2, 0, 0.6], armL: [-1.0, 0, -0.6] }], [1.9, { ...BRUTE_IDLE, armR: [-2.9, 0, 0.2], foreR: [-0.8, 0, 0], chest: [-0.2, 0.4, 0] }], [2.6, { ...BRUTE_IDLE, armR: [-0.6, 0, -0.2], foreR: [-0.1, 0, 0], chest: [0.4, -0.5, 0], spine: [0.4, 0, 0] }]], lt));
      E.b.root.position.z = -6 + smooth(range(lt, 1.0, 2.2)) * 2.0;
      applyPose(g, keyed([[0, { ...gs(g, { hunch: 0.45 }), armR: [-1.0, 0, 0.2], foreR: [-0.6, 0, 0] }], [2.1, { ...gs(g, { hunch: 0.5 }), hipY: g.hipH - 0.12, armR: [-1.2, 0, 0.3], foreR: [-0.8, 0, 0] }], [2.5, { ...gs(g, { hunch: 0.3 }), hipY: g.hipH - 0.2, thighL: [-1.2, 0, 0.6], shinL: [1.5, 0, 0], thighR: [0.3, 0, -0.4] }]], lt));
      g.root.position.x = 0.5 + smooth(range(lt, 2.2, 2.5)) * 1.2;
      aim(E.camera, v3(1.1, 0.35, 1.6), v3(-0.1, 2.6, -5.0));
      shake(E.camera, roar * 0.04 + Math.exp(-Math.pow((lt - 2.55) * 7, 2)) * 0.08, lt);
    },
  };
}
function G11b() { // you killed it
  const E = ruinsEnv({ fov: 50, shafts: false });
  E.b.root.position.set(0, 0, -4); E.b.root.rotation.y = 0.3;
  const g = buildGoblin('survivor', { scale: 1.0 }); E.scene.add(g.root);
  E.scene.add(particles({ mode: 'burst', count: 260, origin: v3(0.8, 0.3, -3.2), start: 1.6, spread: v3(4, 1.2, 4), vel: v3(0, 0.2, 0), life: 2.0, size: 0.07, c0: 0xc8b898, c1: 0xa89878, c2: 0x7a6a58, seed: 111, additive: false, opacity: 0.8 }));
  return {
    ...E, grade: { sat: 0.98, contrast: 1.12, bloom: 0.6 }, env: ENV.ruins,
    update(lt) {
      const fall = easeIn(range(lt, 1.0, 1.6));
      applyPose(E.b, keyed([[0, { ...BRUTE_IDLE, armR: [-0.6, 0, -0.2], chest: [0.3, -0.4, 0], spine: [0.3, 0, 0] }], [0.9, { ...BRUTE_IDLE, neck: [-0.7, 0, 0], spine: [-0.2, 0, 0], armL: [-1.8, 0, -0.5], armR: [-1.2, 0, 0.5] }], [1.6, { ...BRUTE_IDLE, neck: [0.3, 0, 0], armL: [-0.4, 0, -1.0], armR: [-0.4, 0, 1.0], thighL: [-1.2, 0, 0.3], shinL: [1.5, 0, 0], thighR: [-1.0, 0, -0.3], shinR: [1.4, 0, 0] }]], lt));
      E.b.root.rotation.set(-fall * 1.45, 0.3, 0); E.b.root.position.y = -fall * 0.3;
      // the leap onto its chest and the strike
      const lp = range(lt, 0.1, 0.75);
      g.root.position.set(lerp(1.8, 0.3, lp), Math.sin(lp * Math.PI) * 1.4 + lerp(0, 2.2, smooth(lp)) * (1 - fall), lerp(-0.5, -3.3, lp) - fall * 0.4);
      if (lt > 1.0) g.root.position.y = lerp(2.2, 0.0, easeIn(range(lt, 1.0, 1.6)));
      g.root.rotation.y = Math.PI + 0.3;
      applyPose(g, keyed([[0, { ...gs(g), hipY: g.hipH - 0.15, thighL: [-1.0, 0, 0.3], shinL: [1.3, 0, 0] }], [0.5, { ...gs(g, { hunch: -0.2 }), armR: [-3.0, 0, 0.1], foreR: [-0.3, 0, 0], armL: [-2.8, 0, -0.1], thighL: [-1.2, 0, 0.3], shinL: [1.5, 0, 0], thighR: [0.4, 0, 0] }], [0.8, { ...gs(g, { hunch: 0.6 }), armR: [-1.0, 0, 0.1], foreR: [-0.1, 0, 0], armL: [-1.0, 0, -0.1], foreL: [-0.1, 0, 0] }], [2.4, { ...gs(g, { hunch: 0.5 }), hipY: g.hipH - 0.1, armR: [-0.9, 0, 0.1], foreR: [-0.3, 0, 0] }]], lt));
      g.spear.rotation.set(Math.PI / 2 + 0.2, 0, 0);
      aim(E.camera, v3(5.8, 1.6, 2.4), v3(0.4, 1.4, -3.4));
      shake(E.camera, Math.exp(-Math.pow((lt - 1.6) * 5, 2)) * 0.12 + Math.exp(-Math.pow((lt - 0.8) * 9, 2)) * 0.05, lt);
    },
  };
}
function G12() { // and took its armor — the warlord rises
  const E = ruinsEnv({ fov: 40 });
  E.b.root.position.set(-1.4, -0.3, -3.6); E.b.root.rotation.set(-1.45, 0.3, 0);
  applyPose(E.b, { ...BRUTE_IDLE, neck: [0.3, 0, 0], armL: [-0.4, 0, -1.0], armR: [-0.4, 0, 1.0], thighL: [-1.2, 0, 0.3], shinL: [1.5, 0, 0], thighR: [-1.0, 0, -0.3], shinR: [1.4, 0, 0] });
  E.b.pauldron.visible = false; E.b.cleaver.visible = false;
  const g = buildGoblin('warlord'); g.root.position.set(0.6, 0, -1.2); g.root.rotation.y = 0.2; E.scene.add(g.root);
  return {
    ...E, grade: { sat: 1.0, contrast: 1.12, bloom: 0.75, bloomT: 0.55 }, env: { ...ENV.ruins, lightDir: v3(0.2, -0.5, 0.85), rim: 0xffe0a0, lightCol: 0xffe8c0 },
    update(lt) {
      const rise = smooth(range(lt, 0.0, 1.4));
      applyPose(g, mixPose({ hipY: 0.18, pelvis: [-0.2, 0, 0], spine: [0.7, 0, 0], neck: [0.3, 0, 0], thighL: [-1.6, 0, 0.4], shinL: [2.2, 0, 0], thighR: [-0.4, 0, -0.3], shinR: [1.8, 0, 0], armR: [-0.4, 0, 0.3], foreR: [-0.3, 0, 0], armL: [-0.8, 0, -0.3], foreL: [-0.6, 0, 0] }, { ...gs(g, { hunch: 0.1 }), armR: [-0.5, 0, 0.25], foreR: [-0.4, 0, 0], neck: [-0.15, 0, 0] }, rise));
      g.cleaver.rotation.set(Math.PI / 2 + 0.2, 0, 0);
      updateCape(g, lt, { wind: 0.7 + rise * 0.3, back: 0.25 });
      setPL(0, v3(1.2, 2.2, 0.6), 0xfff0c0, 5, 0.6);
      aim(E.camera, v3(1.2, 0.3, 0.85 - lt * 0.05), v3(0.55, lerp(0.55, 1.05, rise), -1.2));
    },
  };
}
function G13() { // goblins began to follow you
  const scene = new THREE.Scene(), camera = cam(50);
  scene.add(sky({ ...SKY.day, sunDir: v3(0.3, 0.45, -0.85).normalize(), horizon: 0xe0d8c0 }));
  const hf = rolling(1.8, 0.02, 9);
  ground(scene, hf, { size: 200, seg: 130 });
  scene.add(grassTufts({ count: 1800, area: [-35, 35, -40, 40], ground: hf, tall: 0.9 }));
  scene.add(forestTrees({ seed: 71, count: 120, area: [-200, 200, -240, 200], ground: hf, avoid: (x, z) => Math.abs(x) < 40 }));
  scene.add(overgrownRuins({ count: 14, rMin: 30, rMax: 90, ground: hf }));
  const g = buildGoblin('warlord'); scene.add(g.root);
  const F = []; const R = rng(9); const skins = [0xffffff, 0xd8e8b8, 0xc0d0a0, 0xe8e0b0];
  for (let i = 0; i < 18; i++) { const f = buildGoblin(i % 4 === 0 ? 'survivor' : 'tribe', { skin: skins[i % 4], scale: 0.82 + R() * 0.12 }); scene.add(f.root); F.push({ f, x: (R() - 0.5) * 3.5, z: 2.0 + i * 1.1 + R() * 0.6, ph: R() }); }
  const far = []; for (let i = 0; i < 260; i++) far.push(v3((R() - 0.5) * 8, 0, 22 + i * 0.25 + R() * 2));
  const H = horde(far, { yaw: Math.PI, scale: 0.85 }); scene.add(H);
  const bn = goblinBanner({ h: 3.4 }); scene.add(bn);
  return {
    scene, camera, grade: { sat: 0.98, contrast: 1.08, bloom: 0.6 }, env: { ...ENV.meadow, lightDir: v3(-0.3, -0.45, 0.85) },
    update(lt) {
      const z0 = -lt * 1.1;
      g.root.position.set(0, hf(0, z0), z0); g.root.rotation.y = Math.PI;
      applyPose(g, { ...gw(g, lt * 0.8, { stride: 0.45, hunch: 0.15 }), armR: [-0.4, 0, 0.25], foreR: [-0.4, 0, 0] }); g.cleaver.rotation.set(Math.PI / 2 + 0.6, 0, 0);
      updateCape(g, lt, { wind: 0.6 });
      F.forEach(({ f, x, z, ph }, i) => { const zz = z0 + z; f.root.position.set(x, hf(x, zz), zz); f.root.rotation.y = Math.PI; applyPose(f, gw(f, lt * 0.85 + ph, { stride: 0.42, hunch: 0.3 })); });
      const M4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
      H.userData.base.forEach((p, i) => { const zz = p.z + z0; M4.compose(v3(p.x, hf(p.x, zz) + Math.abs(Math.sin(lt * 5 + i)) * 0.05, zz), q, v3(0.85, 0.85, 0.85)); H.setMatrixAt(i, M4); }); H.instanceMatrix.needsUpdate = true;
      bn.position.set(1.0, hf(1, z0 + 3) , z0 + 3); waveFlag(bn, lt);
      const u = ease(range(lt, 0, 3.4));
      aim(camera, v3(lerp(-2.5, -9, u), hf(0, z0) + lerp(1.4, 9, u), z0 - lerp(3.5, 6, u)), v3(0, hf(0, z0) + lerp(1.0, 0.0, u), z0 + lerp(2, 14, u)));
    },
  };
}
// ---------------------------------------------------------------- the return to the kingdom (sunset)
function kingdomEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 52, 0.1, 9000);
  const sunDir = v3(0.05, 0.12, -1).normalize();
  const sk = sky({ ...SKY.sunset, sunDir }); scene.add(sk);
  const sunG = glow(0xffd090, 80, 0.75); sunG.position.copy(sunDir.clone().multiplyScalar(2600)); scene.add(sunG);
  const hf = (x, z) => (z < -200 ? Math.min(26, (-200 - z) * 0.65) : 0) + rolling(1.2, 0.015, 3)(x, z) * clamp((Math.hypot(x, z) - 6) / 10) + 6 * Math.exp(-(x * x + z * z) / 140);
  ground(scene, hf, { cx: 0, cz: -90, size: 520, seg: 170, color: 0xe8d8a8 });
  const F = fortress({ fogScale: 0.8 }); F.position.set(0, hf(0, -300) - 1, -300); F.rotation.y = 0; scene.add(F);
  scene.add(forestTrees({ seed: 81, count: 160, area: [-700, 700, -700, 300], ground: hf, avoid: (x, z) => Math.abs(x) < 220 && z > -380 && z < 120, height: [16, 26] }));
  scene.add(grassTufts({ count: 2000, area: [-20, 20, -20, 20], ground: hf, tall: 1.2, tints: [0xffffff, 0xf0d8a0] }));
  return { scene, camera, sk, hf, F, sunDir };
}
function armyPositions(n, x0, x1, z0, z1, seed, hf, jitter = 0.4) {
  const R = rng(seed), out = []; const cols = Math.max(1, Math.ceil(Math.sqrt(n * Math.abs(x1 - x0) / Math.abs(z1 - z0))));
  const rows = Math.ceil(n / cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (out.length >= n) break; const x = lerp(x0, x1, (c + 0.5) / cols) + (R() - 0.5) * jitter * 2, z = lerp(z0, z1, (r + 0.5) / rows) + (R() - 0.5) * jitter * 2; out.push(v3(x, hf(x, z), z)); }
  return out;
}
function G14() { // years later, you came back
  const E = kingdomEnv({ fov: 50 });
  const H = horde(armyPositions(4200, -42, 42, 12, 95, 3, E.hf, 0.35), { yaw: Math.PI, scale: 1.15 }); E.scene.add(H);
  const banners = []; for (let k = 0; k < 14; k++) { const b = goblinBanner({ h: 4.5 }); const x = -50 + k * 7.5, z = 16 + (k % 3) * 9; b.position.set(x, E.hf(x, z), z); E.scene.add(b); banners.push(b); }
  const g = buildGoblin('warlord'); g.root.position.set(0, E.hf(0, 8), 8); g.root.rotation.y = Math.PI; E.scene.add(g.root);
  return {
    ...E, grade: { sat: 0.98, contrast: 1.1, bloom: 0.8, bloomT: 0.55 }, env: ENV.sunset,
    update(lt) {
      applyPose(g, { ...gs(g, { hunch: 0.1 }), armR: [-0.5, 0, 0.25], foreR: [-0.4, 0, 0], neck: [-0.1, 0, 0] }); g.cleaver.rotation.set(Math.PI / 2 + 0.3, 0, 0);
      updateCape(g, lt, { wind: 0.9 });
      banners.forEach((b, i) => waveFlag(b, lt + i * 0.37));
      const u = ease(range(lt, 0, 4.4));
      const hp = g.root.position;
      aim(E.camera, v3(lerp(0.25, 5, u), hp.y + lerp(1.05, 14, u), hp.z - lerp(1.5, 26, u)), v3(0, hp.y + lerp(1.0, -1, u), hp.z + lerp(0, 34, u)));
    },
  };
}
function G15() { // the knights who once hunted you
  const E = kingdomEnv({ fov: 30 });
  E.scene.add(horde(armyPositions(4200, -60, 60, -226, -60, 4, E.hf, 0.5), { yaw: Math.PI, scale: 1.15 }));
  const KM = knightMaterials(); const K = [];
  const wallY = E.F.position.y + 28, gz = E.F.position.z + 52.5;
  for (let i = 0; i < 5; i++) { const k = buildKnightNPC(KM, { shield: i % 2 === 0 }); k.root.position.set(-3.6 + i * 1.8, wallY, gz); E.scene.add(k.root); K.push(k); }
  const horn = new THREE.Group(); mesh(taper(0.03, 0.03, 0.12, 0.12, 0.5, { anchor: 'bottom' }), mat({ map: TG('gold') }), horn, [0, 0, 0], [Math.PI / 2, 0, 0]); E.scene.add(horn);
  return {
    ...E, grade: { sat: 0.98, contrast: 1.12, bloom: 0.75 }, env: { ...ENV.sunset, lightDir: v3(0.2, -0.4, -0.9) },
    update(lt) {
      K.forEach((k, i) => { const back = smooth(range(lt, 0.8 + i * 0.1, 1.8 + i * 0.1)); k.root.position.z = gz - back * 0.6; k.root.rotation.y = 0; const p = walkPose(lt * 0.5 + i, { stride: back > 0 && back < 1 ? 0.3 : 0, hip: 0.98 }); p.neck = [0.1, 0, 0]; if (i === 2) { p.armL = [-2.0, 0.3, 0.3]; p.foreL = [-1.2, 0, 0]; } applyPose(k, p); });
      K[2].root.updateMatrixWorld(true); horn.position.copy(K[2].handL.localToWorld(v3(0, -0.05, 0.05))); horn.lookAt(K[2].head.getWorldPosition(v3())); horn.rotateY(Math.PI);
      const cz = gz + 30 - lt * 0.6, c = v3(13, E.hf(13, cz) + 1.6, cz);
      aim(E.camera, c, v3(-1, wallY + 0.4, gz));
    },
  };
}
function G16() { // ...ran.
  const E = kingdomEnv({ fov: 54 });
  const pos = armyPositions(1400, -40, 40, 4, 90, 5, E.hf, 0.8);
  const H = horde(pos, { yaw: Math.PI }); E.scene.add(H);
  const KM = knightMaterials(); const K = [];
  for (let i = 0; i < 9; i++) { const k = buildKnightNPC(KM, { shield: i % 3 !== 0 }); E.scene.add(k.root); K.push({ k, x: -6 + i * 1.6, z: -6 - (i % 3) * 2.2, ph: i * 0.37 }); }
  const dropped = []; for (let i = 0; i < 4; i++) { const s = new THREE.Group(); mesh(box(0.4, 0.02, 0.8), mat({ map: TG('kite') }), s); s.position.set(-4 + i * 2.5, E.hf(0, -2) + 0.03, -2 - i); s.rotation.y = i; E.scene.add(s); }
  E.scene.add(particles({ mode: 'drift', count: 400, box: v3(40, 6, 40), vel: v3(0, 0.4, -3), size: 0.12, c0: 0xc8a880, origin: v3(0, 1.5, 0), additive: false, opacity: 0.5, swirl: 1.2, seed: 121, fogMix: 0.5 }));
  return {
    ...E, grade: { sat: 0.98, contrast: 1.12, bloom: 0.8 }, env: ENV.sunset,
    update(lt) {
      K.forEach(({ k, x, z, ph }, i) => { const zz = z - lt * 4.6; k.root.position.set(x + Math.sin(lt * 2 + i) * 0.2, E.hf(x, zz), zz); k.root.rotation.y = Math.PI; applyPose(k, { ...walkPose(lt * 1.9 + ph, { stride: 0.85, hunch: 0.2, hip: 0.98 }), armR: [Math.sin((lt * 1.9 + ph) * 6.28) * 0.8, 0, 0.2], foreR: [-0.9, 0, 0] }); });
      const M4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
      H.userData.base.forEach((p, i) => { const zz = p.z - lt * 6.2; M4.compose(v3(p.x, E.hf(p.x, zz) + Math.abs(Math.sin(lt * 9 + i * 1.7)) * 0.18, zz), q, v3(1, 1, 1)); H.setMatrixAt(i, M4); }); H.instanceMatrix.needsUpdate = true;
      const cz = -2 - lt * 3.0, cy = E.hf(2.5, cz) + 0.9;
      aim(E.camera, v3(2.5, cy, cz), v3(0, E.hf(0, cz - 30) + 1.5, cz - 30));
      shake(E.camera, 0.03, lt);
    },
  };
}
function kingScene(o = {}) {
  const E = kingdomEnv({ fov: o.fov ?? 50 });
  const rock = mesh(merge([xf(flat(new THREE.DodecahedronGeometry(3.2, 0)), { s: [1.4, 0.8, 1.2] }), xf(flat(new THREE.DodecahedronGeometry(2.2, 0)), { p: [2.4, -0.6, 1], s: [1.2, 0.8, 1] })]), mat({ map: TW('moss') }), E.scene, [0, E.hf(0, 0) + 0.6, 0]);
  const top = E.hf(0, 0) + 0.6 + 2.45;
  E.F.traverse(m => { if (m.isMesh && m.material.uniforms && m.material.uniforms.uColor) m.material.uniforms.uColor.value.multiplyScalar(0.8); });
  for (const [x, y, z, s] of [[-30, 40, -290, 30], [25, 30, -305, 22], [0, 60, -320, 36]]) E.scene.add(smokeP({ origin: v3(x, E.F.position.y + y, z), spread: v3(8, 2, 8), size: s, count: 50, vel: v3(3, 16, 0), life: 6, opacity: 0.35, seed: 130 + x }));
  const king = buildGoblin('king'); king.root.position.set(0, top, 0); king.root.rotation.y = Math.PI; E.scene.add(king.root);
  const kneel = horde(armyPositions(3200, -90, 90, -14, -210, 6, E.hf, 0.5).filter(p => Math.hypot(p.x, p.z) > 8), { kneel: true, yaw: 0 }); E.scene.add(kneel);
  const banners = []; for (let k = 0; k < 18; k++) { const b = goblinBanner({ h: 5 }); const x = -80 + k * 9.4, z = -24 - (k % 4) * 30; b.position.set(x, E.hf(x, z), z); E.scene.add(b); banners.push(b); }
  return { ...E, king, top, banners, kneel };
}
const KING_POSE = (j) => ({ ...gStand({ hunch: 0.02, hip: j.hipH }), spine: [-0.05, 0, 0], chest: [-0.05, 0, 0], neck: [-0.05, 0, 0], armR: [-0.35, 0.1, 0.35], foreR: [-0.5, 0, 0], armL: [-0.2, 0, -0.3], foreL: [-0.4, 0, 0], thighL: [-0.25, 0, 0.18], thighR: [0.15, 0, -0.18], shinL: [0.2, 0, 0], shinR: [0.1, 0, 0] });
function G00() { // hook: a flash-forward — the Goblin King raises his cleaver over his army
  const K = kingScene({ fov: 52 });
  const H = horde(armyPositions(1600, -60, 60, -16, -110, 8, K.hf, 0.5).filter(p => Math.hypot(p.x, p.z) > 8), { yaw: 0 }); K.scene.add(H);
  K.kneel.visible = false;
  return {
    ...K, grade: { sat: 1.0, contrast: 1.12, bloom: 0.85, bloomT: 0.55 }, env: { ...ENV.sunset, lightDir: v3(0.0, -0.35, 1.0) },
    update(lt) {
      const up = smooth(range(lt, 0.2, 0.8));
      applyPose(K.king, { ...KING_POSE(K.king), armR: [lerp(-0.35, -3.0, up), 0.1, 0.25], foreR: [lerp(-0.5, -0.2, up), 0, 0], neck: [lerp(-0.05, -0.3, up), 0, 0] });
      K.king.cleaver.rotation.set(Math.PI / 2 + 0.1, 0, 0); updateCape(K.king, lt, { wind: 1.0 });
      K.banners.forEach((b, i) => waveFlag(b, lt + i * 0.3));
      const M4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      H.userData.base.forEach((p, i) => { q.setFromEuler(new THREE.Euler(0, 0, 0)); M4.compose(v3(p.x, p.y + Math.max(0, Math.sin(lt * 8 + i * 2.3)) * 0.25 * up, p.z), q, v3(1, 1, 1)); H.setMatrixAt(i, M4); }); H.instanceMatrix.needsUpdate = true;
      aim(K.camera, v3(1.4, K.top - 0.9, -7.2 + lt * 0.4), v3(0, K.top + 1.0, 0));
    },
  };
}
function G17() { // the Goblin King above the battlefield; thousands kneel
  const K = kingScene({ fov: 50 });
  return {
    ...K, grade: { sat: 1.0, contrast: 1.1, bloom: 0.85, bloomT: 0.55 }, env: { ...ENV.sunset, lightDir: v3(0.0, -0.35, 1.0) },
    update(lt) {
      applyPose(K.king, KING_POSE(K.king)); K.king.cleaver.rotation.set(Math.PI / 2 + 0.2, 0, 0); updateCape(K.king, lt, { wind: 1.0 });
      K.banners.forEach((b, i) => waveFlag(b, lt + i * 0.3));
      const u = ease(range(lt, 0, 3.8));
      aim(K.camera, v3(lerp(0.8, 0.45, u), K.top + lerp(0.5, 1.3, u), lerp(4.8, 3.0, u)), v3(lerp(0.1, 0.0, u), K.top + lerp(1.6, 0.6, u), -30));
    },
  };
}
function G18() { // the camera approaches your amber eyes
  const K = kingScene({ fov: 30 });
  return {
    ...K, grade: { sat: 1.0, contrast: 1.12, bloom: 0.9, bloomT: 0.5 }, env: { ...ENV.sunset, lightDir: v3(0.0, -0.3, 1.0), rim: 0xffc080 },
    update(lt) {
      applyPose(K.king, { ...KING_POSE(K.king), neck: [0.05, 0, 0], head: [0.05, 0, 0] }); updateCape(K.king, lt, { wind: 1.0 });
      const ig = smooth(range(lt, 1.2, 2.4));
      K.king.M.eye.uniforms.uColor.value.setRGB(1, 0.69 + ig * 0.25, 0.19 + ig * 0.3); K.king.M.eye.uniforms.uEmissive.value.setRGB(1, 0.6, 0.12).multiplyScalar(1 + ig * 1.8);
      const h = headOf(K.king, v3(0, 0.12, 0.08));
      const u = ease(range(lt, 0, 2.6));
      aim(K.camera, h.clone().add(v3(lerp(0.5, 0.08, u), lerp(0.05, 0.0, u), -lerp(2.6, 0.55, u))), h);
      setPL(0, h.clone().add(v3(0.3, 0.3, -1.2)), 0xffc080, 3, 0.8);
    },
  };
}

export const SHOTS_GOBLIN = { G00, G01a, G01b, G02, G03, G04, G05, G06, G07, G08a, G08b, G09, G10, G11a, G11b, G12, G13, G14, G15, G16, G17, G18 };
