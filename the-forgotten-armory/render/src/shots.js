// VHALDREN — Episode 3: THE ARMOR THAT WOULD LAST FOREVER — shot list.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range } from '/the-last-ember/render/src/engine.js';
import { T } from '/the-last-ember/render/src/textures.js';
import { updateKnight, applyPose, mixPose, walkPose, buildHelm, knightMaterials } from '/the-last-ember/render/src/characters.js';
import { sky } from '/the-last-ember/render/src/world.js';
import { T2, mountains, ridged } from '/the-silent-kingdom/render/src/kingdom.js';
import { buildCaelTransforming, buildCaelVigil, setArmor, buildShield, placeShield, updateScarf, buildArmorStand, sigilDecal, vigilMaterials } from './vigil.js';
import { fortress, armory } from './fortress.js';

const cam = (fov, near = 0.05, far = 6000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
const lanternLight = (k, i = 0, power = 1.3, t = 0) => { const p = k.lantern.getWorldPosition(v3()); setPL(i, p, 0xff8a30, 4.5, power * (0.9 + Math.sin(t * 11) * 0.06)); return p; };
const holdLow = (p) => { p.armR = [-0.2, 0, 0.15]; p.foreR = [-0.15, 0, 0]; return p; };
const STAND = () => holdLow(walkPose(0, { stride: 0 }));
const SHIELD_GUARD = { hipY: 0.95, spine: [0.1, 0, 0], chest: [0, 0.15, 0], armR: [-0.6, -0.1, 0.25], foreR: [-0.9, 0, 0], armL: [-0.7, 0.55, -0.25], foreL: [-1.45, 0, 0], thighL: [-0.35, 0, 0.06], shinL: [0.45, 0, 0], thighR: [0.25, 0, -0.06], shinR: [0.3, 0, 0], footR: [-0.15, 0, 0] };
const SHIELD_CARRY = { armL: [-0.45, 0.45, -0.2], foreL: [-1.35, 0, 0] };

// ---------------------------------------------------------------- environments
const STORM = { horizon: 0x4a5262, top: 0x0e1118, bottom: 0x2a2e36, cloud: 0x262a32, cloudLit: 0x6a7488, sunCol: 0x1a2030 };
const STORM_ENV = { fog: [15, 700], fogCol: 0x3e4654, hfog: [-40, 60, 0.7, 0.004], lightDir: v3(0.4, -0.6, -0.7), lightCol: 0x7a8498, ambient: 0x2a2e38, rim: 0x8a94a8, fillDir: v3(-0.3, -0.3, 0.9), fillCol: 0x1e222a };
function exteriorEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50, 0.2);
  const sk = sky({ ...STORM, sunDir: v3(0.3, 0.3, -1), cover: 0.3, cloudScale: 0.3, swirl: 0.6 }); scene.add(sk);
  const rd = ridged(29);
  const hf = (x, z) => { const dist = Math.sqrt(x * x + (z + 10) * (z + 10)); const plateau = clamp((150 - dist) / 35); const rv = Math.exp(-(x * x) / (34 * 34)) * clamp((z - 62) / 12) * clamp((235 - z) / 15); return lerp(rd(x, z) * 120 - 30, -1.6, plateau) - rv * 190; };
  scene.add(mountains(2600, 200, hf, { tile: 30, cx: 0, cz: 60 }));
  const F = fortress(); scene.add(F);
  scene.add(particles({ mode: 'drift', count: 900, box: v3(40, 24, 40), vel: v3(2.5, -6, 1), size: 0.03, c0: 0xa8b4c8, origin: v3(0, 10, 80), additive: false, opacity: 0.6, swirl: 0.6, seed: 13, fogMix: 0.6 })); // rain
  return { scene, camera, sk, F, hf };
}
const ARMORY_ENV = { fog: [4, 75], fogCol: 0x222630, hfog: [0, 1, 0, 0], lightDir: v3(0.6, -0.6, -0.25), lightCol: 0x9aa4ba, ambient: 0x3c404c, rim: 0x8a96b0, fillDir: v3(-0.3, -0.4, 0.85), fillCol: 0x34343c };
function armoryEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50, 0.05);
  const A = armory(); scene.add(A);
  const L = A.userData.L;
  const stand = buildArmorStand(); stand.root.position.set(0, 1.4, -L + 5.2); scene.add(stand.root);
  const sigil = sigilDecal(stand.chest, 0.2); sigil.position.set(0, 0.15, 0.19);
  const restShield = buildShield(stand.VM); restShield.position.set(0.95, 1.95, -L + 5.0); restShield.rotation.set(-0.12, -0.35, 0.05); scene.add(restShield);
  return { scene, camera, A, L, stand, sigil, restShield };
}
function standLight(E, k = 1) { setPL(5, v3(0, 5.5, -E.L + 6.5), 0xc8d8f0, 9, 1.4 * k); }

// ---------------------------------------------------------------- S01  HOOK — the forgotten fortress in the storm
function S01() {
  const E = exteriorEnv({ fov: 54 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.7, contrast: 1.2, bloom: 0.7 }, env: STORM_ENV,
    update(lt) {
      const z = 150 - lt * 1.0; k.root.position.set(0.4, 0, z); k.root.rotation.y = Math.PI;
      applyPose(k, holdLow(walkPose(lt * 0.8, { stride: 0.4, hunch: 0.15 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 1.1, swing: 0.3, back: 0.4 });
      lanternLight(k, 0, 1.3, lt);
      const fl = Math.exp(-Math.pow((lt - 1.1) * 7, 2)) + Math.exp(-Math.pow((lt - 1.35) * 9, 2)) * 0.6;
      setEnv({ lightCol: new THREE.Color(0x7a8498).lerp(new THREE.Color(0xd8e4ff), fl).getHex(), ambient: new THREE.Color(0x2a2e38).lerp(new THREE.Color(0x8a96b0), fl * 0.7).getHex() });
      const u = ease(range(lt, 0, 4.8));
      aim(E.camera, v3(lerp(1.2, 0.9, u), lerp(2.2, 2.6, u), z + lerp(6.5, 5.0, u)), v3(0, lerp(22, 28, u), -10));
    },
  };
}
// ---------------------------------------------------------------- S02  to the gate
function S02() {
  const E = exteriorEnv({ fov: 50 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  const gz = E.F.userData.gateZ;
  return {
    ...E, grade: { sat: 0.7, contrast: 1.2, bloom: 0.7 }, env: STORM_ENV,
    update(lt) {
      const z = gz + 9 - lt * 1.05; k.root.position.set(0.2, 0, z); k.root.rotation.y = Math.PI;
      applyPose(k, holdLow(walkPose(lt * 0.8, { stride: 0.42, hunch: 0.12 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.9, swing: 0.3, back: 0.3 });
      lanternLight(k, 0, 1.3, lt);
      aim(E.camera, v3(1.3, 0.55, z + 4.2), v3(0, 9.5, gz - 6));
    },
  };
}
// ---------------------------------------------------------------- S03  the stone doors open (from inside)
function S03() {
  const E = armoryEnv({ fov: 50 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  E.scene.add(particles({ mode: 'burst', count: 300, origin: v3(0, 2.5, -0.6), start: 0.3, spread: v3(4, 3, 3), vel: v3(0, 0.1, 0), life: 3.0, size: 0.04, c0: 0xb8bcc4, c1: 0x8a8e96, c2: 0x5a5e66, seed: 7, additive: false, opacity: 0.7 }));
  return {
    ...E, grade: { sat: 0.7, contrast: 1.25, bloom: 0.9, bloomT: 0.5 }, env: ARMORY_ENV,
    update(lt) {
      const o = smooth(range(lt, 0.2, 2.4));
      E.A.userData.doors.forEach(d => { d.piv.rotation.y = -d.sx * o * 1.25; });
      E.A.userData.doorLight.material.uniforms.uColor.value.setRGB(0.42 * o + 0.03, 0.47 * o + 0.03, 0.56 * o + 0.04);
      const z = 2.6 - smooth(range(lt, 1.6, 3.4)) * 3.2; k.root.position.set(0, 0, z); k.root.rotation.y = Math.PI;
      applyPose(k, holdLow(walkPose(lt > 1.6 ? (lt - 1.6) * 0.8 : 0, { stride: lt > 1.6 ? 0.4 : 0, hunch: 0.1 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.6, swing: 0.2 });
      lanternLight(k, 0, 1.3, lt);
      setPL(1, v3(0, 3, 1.5), 0x9aa8c0, 12, o * 1.2);
      aim(E.camera, v3(-0.8, 1.2, -8.5), v3(0, 3.0, 0));
      shake(E.camera, 0.012 * o * (1 - o) * 4, lt);
    },
  };
}
// ---------------------------------------------------------------- S04  through the hall of a fallen order (old armour)
function S04() {
  const E = armoryEnv({ fov: 48 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.72, contrast: 1.2, bloom: 0.8 }, env: ARMORY_ENV,
    update(lt) {
      const z = -3 - lt * 1.15; k.root.position.set(0.1, 0, z); k.root.rotation.y = Math.PI;
      applyPose(k, holdLow(walkPose(lt * 0.8, { stride: 0.4, hunch: 0.1 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.25, swing: 0.25 });
      lanternLight(k, 0, 1.5, lt); standLight(E, 0.6);
      aim(E.camera, v3(1.7 - lt * 0.15, 1.9, z + 3.6), v3(-0.6, 1.2, z - 8));
    },
  };
}
// ---------------------------------------------------------------- S05  broken swords, broken shields
function S05() {
  const E = armoryEnv({ fov: 44 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  const sh = buildShield(vigilMaterials()); sh.scale.setScalar(0.85); sh.position.set(-1.05, 0.06, -15.8); sh.rotation.set(-1.45, 0.4, 0.2);
  sh.traverse(o => { if (o.isMesh) o.material = mat({ map: T('rust'), color: 0x9a8a80 }); }); E.scene.add(sh);
  const blade = mesh(new THREE.BoxGeometry(0.07, 0.02, 0.55), mat({ map: T('iron'), color: 0xc0c0c8 }), E.scene, [-0.55, 0.02, -15.0], [0, 0.7, 0]);
  mesh(new THREE.BoxGeometry(0.22, 0.03, 0.04), mat({ map: T('rust') }), E.scene, [-0.68, 0.03, -14.78], [0, 0.7, 0]);
  return {
    ...E, grade: { sat: 0.7, contrast: 1.25, bloom: 0.8 }, env: ARMORY_ENV,
    update(lt) {
      const z = -13.0 - lt * 1.1; k.root.position.set(0.45, 0, z); k.root.rotation.y = Math.PI;
      applyPose(k, holdLow(walkPose(lt * 0.8 + 0.3, { stride: 0.4, hunch: 0.1 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.2, swing: 0.25 });
      lanternLight(k, 0, 1.6, lt);
      aim(E.camera, v3(-1.9 + lt * 0.15, 0.75, -13.4 - lt * 0.25), v3(-0.6, 0.05, -15.6 - lt * 0.2)); setPL(2, v3(-0.8, 2.0, -15.2), 0x9aa8c0, 6, 1.0);
    },
  };
}
// ---------------------------------------------------------------- S06  untouched by time: the armour on its stand
function S06() {
  const E = armoryEnv({ fov: 46 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  return {
    ...E, grade: { sat: 0.75, contrast: 1.2, bloom: 0.95, bloomT: 0.5 }, env: ARMORY_ENV,
    update(lt) {
      const z = -L0(E) + 13 - lt * 0.5; k.root.position.set(-0.4, 0, z); k.root.rotation.y = Math.PI;
      applyPose(k, holdLow(walkPose(lt * 0.5, { stride: 0.25, hunch: 0.05 }))); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.2, swing: 0.15 });
      lanternLight(k, 0, 1.2, lt); standLight(E, 1.2);
      const u = ease(range(lt, 0, 3.1));
      aim(E.camera, v3(1.0, lerp(1.4, 1.8, u), z + lerp(4.5, 3.4, u)), v3(0, lerp(2.0, 2.6, u), -E.L + 5.2));
    },
  };
}
const L0 = (E) => E.L;
// ---------------------------------------------------------------- S07–S09  close-ups of the set
function closeUp(target, from, fov, orbit, lk = 0.75, envOver = {}) {
  return () => {
    const E = armoryEnv({ fov });
    return {
      ...E, grade: { sat: 0.78, contrast: 1.2, bloom: 0.8, bloomT: 0.55 }, env: { ...ARMORY_ENV, lightDir: v3(0.3, -0.7, -0.6), rim: 0xa0b0c8, ...envOver },
      update(lt) {
        standLight(E, lk);
        E.stand.root.updateMatrixWorld(true);
        const t = target(E), a = orbit[0] + lt * orbit[1];
        const d = from.dist, h = from.h;
        aim(E.camera, t.clone().add(v3(Math.sin(a) * d, h, Math.cos(a) * d)), t);
        setPL(4, t.clone().add(v3(0.6, 0.8, 1.2)), 0xb8c8e0, 4, 0.35);
      },
    };
  };
}
const S07 = closeUp((E) => E.stand.vhelm.localToWorld(v3(0, 0.17, 0.0)), { dist: 0.85, h: 0.05 }, 30, [0.55, -0.18]);
const S08 = closeUp((E) => E.stand.chest.localToWorld(v3(0.05, 0.18, 0.05)), { dist: 1.25, h: 0.12 }, 34, [-0.55, 0.2], 0.3, { lightCol: 0x6a7488, ambient: 0x262a34, rim: 0x5a6478, fillCol: 0x1e2028 });
const S09 = closeUp((E) => E.restShield.localToWorld(v3(0, 0.05, 0)), { dist: 1.35, h: 0.1 }, 36, [-0.2, 0.12], 0.5);

// ---------------------------------------------------------------- S10  the touch — the sigil wakes
function S10() {
  const E = armoryEnv({ fov: 36 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  const z = -E.L + 6.05;
  const REACH = { ...STAND(), spine: [0.08, 0, 0], armR: [-1.25, -0.15, 0.12], foreR: [-0.35, 0, 0], neck: [0.15, 0, 0] };
  return {
    ...E, grade: { sat: 0.8, contrast: 1.2, bloom: 0.7, bloomT: 0.6 }, env: ARMORY_ENV,
    update(lt) {
      k.root.position.set(0.12, 1.4, z); k.root.rotation.y = Math.PI;
      applyPose(k, mixPose(STAND(), REACH, smooth(range(lt, 0.2, 1.3)))); k.sword.visible = false;
      updateKnight(k, lt, { wind: 0.15, swing: 0.05 });
      const g = smooth(range(lt, 1.2, 2.2));
      E.sigil.material.uniforms.uOpacity.value = g * (0.55 + 0.1 * Math.sin(lt * 6));
      standLight(E, 1.0); lanternLight(k, 0, 1.0, lt);
      E.stand.root.updateMatrixWorld(true);
      const sp = E.sigil.getWorldPosition(v3());
      setPL(1, sp.clone().add(v3(0, 0, 0.3)), 0xffc060, 3, g * 1.1);
      aim(E.camera, sp.clone().add(v3(-1.05, 0.28, 1.05)), sp.clone().add(v3(0.05, -0.02, 0.1)));
    },
  };
}
// ---------------------------------------------------------------- S11  the same sign he had carried all his life
function S11() {
  const E = armoryEnv({ fov: 30 });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  const z = -E.L + 6.05;
  return {
    ...E, grade: { sat: 0.8, contrast: 1.25, bloom: 1.1, bloomT: 0.45 }, env: ARMORY_ENV,
    update(lt) {
      k.root.position.set(0.12, 1.4, z); k.root.rotation.y = Math.PI;
      const p = STAND(); p.neck = [0.3, 0, 0]; p.head = [0.15, 0, 0]; p.armR = [-1.1, -0.15, 0.12]; p.foreR = [-0.4, 0, 0]; applyPose(k, p); k.sword.visible = false;
      updateKnight(k, lt, { wind: 0.1, swing: 0.03 });
      E.sigil.material.uniforms.uOpacity.value = 0.9;
      k.root.updateMatrixWorld(true);
      const brow = k.helm.localToWorld(v3(0, 0.25, 0.17));
      setPL(1, brow.clone().add(v3(0, -0.1, -0.35)), 0xffc060, 2.5, 1.6 + 0.4 * Math.sin(lt * 5)); standLight(E, 0.8);
      aim(E.camera, brow.clone().add(v3(0.32, 0.05, -0.42)), brow);
    },
  };
}
// ---------------------------------------------------------------- transformation montage (S12–S16)
const UNBUCKLE = { ...STAND(), armL: [-0.95, 0.5, -0.15], foreL: [-1.6, 0, 0], armR: [-0.95, -0.5, 0.15], foreR: [-1.6, 0, 0], neck: [0.25, 0, 0] };
const BUCKLE = { ...STAND(), armR: [-0.35, 0.2, 0.5], foreR: [-1.5, 0.3, 0], armL: [-0.7, 0.9, 0.0], foreL: [-1.5, 0, 0], chest: [0, -0.2, 0], neck: [0.2, -0.2, 0] };
const GAUNT = { ...STAND(), armR: [-0.75, 0.1, 0.15], foreR: [-1.0, 0, 0], armL: [-0.85, 0.55, 0.0], foreL: [-1.15, 0, 0], neck: [0.3, 0, 0] };
const HELMUP = { ...STAND(), armL: [-2.65, 0.25, -0.4], foreL: [-1.15, 0, 0], armR: [-2.65, -0.25, 0.4], foreR: [-1.15, 0, 0] };
function montageEnv(o) {
  const E = armoryEnv({ fov: o.fov });
  const k = buildCaelTransforming(); E.scene.add(k.root);
  k.root.position.set(0.0, 1.4, -E.L + 7.3); k.root.rotation.y = 0.35;
  E.stand.root.visible = o.standVisible ?? false;
  // the old pieces left behind on the dais
  if (o.oldOnFloor) { const oh = new THREE.Group(); buildHelm(oh, knightMaterials()); oh.position.set(1.3, 1.42, -E.L + 7.8); oh.rotation.set(1.45, 0.4, 0.3); E.scene.add(oh); }
  return { E, k };
}
function S12() { // the old cloak and tabard fall away
  const { E, k } = montageEnv({ fov: 42 });
  let fallen = null;
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 0.9 }, env: ARMORY_ENV,
    update(lt) {
      applyPose(k, mixPose(STAND(), UNBUCKLE, smooth(range(lt, 0, 0.8)))); k.sword.visible = false;
      updateKnight(k, Math.min(lt, 1.0), { wind: 0.2, swing: 0.05 });
      if (lt > 1.0 && !fallen) { fallen = k.OLD.cloak.concat(k.OLD.tabard); k.root.updateMatrixWorld(true); fallen.forEach(o => { E.scene.attach(o); o.userData.y0 = o.position.y; o.userData.r0 = o.rotation.x; }); }
      if (fallen) { const f = easeIn(range(lt, 1.0, 1.7)); fallen.forEach((o, i) => { o.position.y = o.userData.y0 - f * (o.userData.y0 - 1.45) * (i === 0 ? 0.85 : 1); o.rotation.x = o.userData.r0 + f * (i === 0 ? 1.2 : 1.5); o.scale.y = 1 - f * 0.55; }); }
      standLight(E, 0.9); lanternLight(k, 0, 1.0, lt);
      aim(E.camera, v3(-1.3, 2.6, -E.L + 10.2), v3(0, 2.4, -E.L + 7.3));
    },
  };
}
function S13() { // breastplate and pauldrons fastened
  const { E, k } = montageEnv({ fov: 34 });
  return {
    ...E, grade: { sat: 0.78, contrast: 1.25, bloom: 0.9 }, env: { ...ARMORY_ENV, rim: 0xa8b8d0 },
    update(lt) {
      setArmor(k, { cloak: false, tabard: false, chest: 'new', shoulders: lt > 1.1 ? 'new' : 'old' });
      applyPose(k, keyed([[0, BUCKLE], [0.6, { ...BUCKLE, foreR: [-1.3, 0.3, 0] }], [1.1, { ...BUCKLE, armL: [-0.4, 0.2, -0.6], foreL: [-0.9, 0, 0] }], [2.4, { ...BUCKLE, armL: [-0.2, 0, -0.2], foreL: [-0.4, 0, 0] }]], lt));
      k.sword.visible = false;
      updateKnight(k, lt, { wind: 0.1, swing: 0.05 }); updateScarf(k, lt, { wind: 0.15 });
      k.NEW.shoulders.forEach(g => { g.position.y = lt < 1.4 ? (1 - smooth(range(lt, 1.1, 1.4))) * 0.12 : 0; });
      standLight(E, 0.9);
      k.root.updateMatrixWorld(true);
      const c = k.chest.localToWorld(v3(0.05, 0.2, 0.05));
      aim(E.camera, c.clone().add(v3(0.75, 0.1, 1.35)), c.clone().add(v3(0, 0.05, 0)));
    },
  };
}
function S14() { // gauntlets and vambraces
  const { E, k } = montageEnv({ fov: 32 });
  return {
    ...E, grade: { sat: 0.78, contrast: 1.25, bloom: 0.9 }, env: ARMORY_ENV,
    update(lt) {
      setArmor(k, { cloak: false, tabard: false, chest: 'new', shoulders: 'new', arms: 'new', legs: 'new' });
      applyPose(k, keyed([[0, GAUNT], [1.4, { ...GAUNT, foreR: [-1.15, 0, 0], armL: [-0.75, 0.5, 0.05] }], [2.2, { ...GAUNT, armR: [-0.85, 0.1, 0.15], foreR: [-1.3, 0, 0] }]], lt));
      k.sword.visible = false;
      updateKnight(k, lt, { wind: 0.1, swing: 0.05 }); updateScarf(k, lt, { wind: 0.15 });
      const slide = 1 - smooth(range(lt, 0.2, 1.2));
      k.NEW.arms.filter(g => g.parent === k.handR || g.parent === k.foreR).forEach(g => { g.position.y = -slide * 0.18; });
      standLight(E, 0.9);
      k.root.updateMatrixWorld(true);
      const h = k.handR.getWorldPosition(v3());
      aim(E.camera, h.clone().add(v3(0.35, 0.3, 0.8)), h.clone().add(v3(-0.05, 0.1, 0)));
    },
  };
}
function S15() { // the old helm is lifted away (from behind — his face is never shown)
  const { E, k } = montageEnv({ fov: 40, oldOnFloor: false });
  return {
    ...E, grade: { sat: 0.75, contrast: 1.25, bloom: 0.9 }, env: ARMORY_ENV,
    update(lt) {
      setArmor(k, { cloak: false, tabard: false, chest: 'new', shoulders: 'new', arms: 'new', legs: 'new', helm: 'old' });
      k.NEW.helm.forEach(o => { if (o !== k.NEW.helm[0]) o.visible = true; }); // gorget + scarf already on
      k.coif.visible = true;
      applyPose(k, keyed([[0, STAND()], [0.6, HELMUP], [2.2, { ...HELMUP, armL: [-2.95, 0.2, -0.45], armR: [-2.95, -0.2, 0.45] }]], lt));
      k.sword.visible = false;
      const lift = smooth(range(lt, 0.7, 2.0)); k.helm.position.y = lift * 0.32; k.helm.rotation.x = -lift * 0.2;
      updateKnight(k, lt, { wind: 0.1, swing: 0.05 }); updateScarf(k, lt, { wind: 0.15 });
      standLight(E, 1.0);
      k.root.updateMatrixWorld(true);
      const hd = k.head.getWorldPosition(v3());
      aim(E.camera, hd.clone().add(v3(-0.9, 0.05, -1.3)), hd.clone().add(v3(0, 0.15, 0)));
    },
  };
}
function S16() { // the new helm is lowered on — the eye-slit takes his ember
  const { E, k } = montageEnv({ fov: 36, oldOnFloor: true });
  return {
    ...E, grade: { sat: 0.8, contrast: 1.25, bloom: 1.0, bloomT: 0.5 }, env: { ...ARMORY_ENV, rim: 0xb0c0d8 },
    update(lt) {
      setArmor(k, { cloak: false, tabard: false, chest: 'new', shoulders: 'new', arms: 'new', legs: 'new', helm: 'new' });
      k.coif.visible = lt < 2.0;
      applyPose(k, keyed([[0, { ...HELMUP, armL: [-2.95, 0.2, -0.45], armR: [-2.95, -0.2, 0.45] }], [2.0, HELMUP], [2.9, STAND()]], lt));
      k.sword.visible = false;
      const down = smooth(range(lt, 0.2, 2.0)); k.vhelm.position.y = (1 - down) * 0.34; k.vhelm.rotation.x = -(1 - down) * 0.15;
      const glowK = smooth(range(lt, 2.0, 2.6));
      k.VM.slit.uniforms.uColor.value.setRGB(0.09 + glowK * 0.5, 0.03 + glowK * 0.18, 0.015 + glowK * 0.04);
      updateKnight(k, lt, { wind: 0.15, swing: 0.05 }); updateScarf(k, lt, { wind: 0.2 });
      standLight(E, 1.1);
      k.root.updateMatrixWorld(true);
      const hd = k.head.getWorldPosition(v3());
      const a = lerp(0.9, 0.35, ease(range(lt, 0, 3.0)));
      aim(E.camera, hd.clone().add(v3(Math.sin(a) * 1.05, 0.12, Math.cos(a) * 1.05)), hd.clone().add(v3(0, 0.18, 0)));
    },
  };
}
// ---------------------------------------------------------------- S17  the reveal — the Vigil Plate
function vigilEnv(o = {}) {
  const E = armoryEnv({ fov: o.fov });
  const k = buildCaelVigil({ sheathed: true }); E.scene.add(k.root); E.scene.add(k.shield);
  k.VM.slit.uniforms.uColor.value.setRGB(0.59, 0.21, 0.055);
  E.stand.root.visible = false;
  const oh = new THREE.Group(); buildHelm(oh, knightMaterials()); oh.position.set(1.3, 1.42, -E.L + 7.8); oh.rotation.set(1.45, 0.4, 0.3); E.scene.add(oh);
  return { E, k };
}
function S17() {
  const { E, k } = vigilEnv({ fov: 44 });
  E.restShield.visible = true; k.shield.visible = false;
  return {
    ...E, grade: { sat: 0.8, contrast: 1.2, bloom: 0.95, bloomT: 0.55 }, env: { ...ARMORY_ENV, rim: 0xb0c0dc },
    update(lt) {
      k.root.position.set(0, 1.4, -E.L + 7.3); k.root.rotation.y = 0.15;
      const p = STAND(); p.armR = [-0.1, 0, 0.12]; p.foreR = [-0.15, 0, 0]; p.neck = [-0.05, 0, 0]; applyPose(k, p);
      updateKnight(k, lt, { wind: 0.2, swing: 0.05 }); updateScarf(k, lt, { wind: 0.3 });
      standLight(E, 1.3); lanternLight(k, 0, 1.0, lt);
      const a = lerp(-0.9, 0.5, ease(range(lt, 0, 4.2)));
      aim(E.camera, v3(Math.sin(a) * 3.0, 1.75 + lt * 0.12, -E.L + 7.3 + Math.cos(a) * 3.0), v3(0, 2.45, -E.L + 7.3));
    },
  };
}
// S18  he takes up the shield
function S18() {
  const { E, k } = vigilEnv({ fov: 42 });
  const tmp = new THREE.Object3D(); const rest = { p: E.restShield.position.clone(), q: E.restShield.quaternion.clone() }; E.restShield.visible = false;
  return {
    ...E, grade: { sat: 0.8, contrast: 1.2, bloom: 0.95 }, env: ARMORY_ENV,
    update(lt) {
      k.root.position.set(0, 1.4, -E.L + 7.3); k.root.rotation.y = 0.35 - smooth(range(lt, 0.6, 1.6)) * 0.3;
      applyPose(k, keyed([[0, { ...STAND(), armL: [-0.6, 0.0, -0.45], foreL: [-0.5, 0, 0], spine: [0.25, 0, 0], neck: [0.2, 0, 0] }], [1.0, { ...STAND(), ...SHIELD_CARRY }], [2.2, { ...STAND(), ...SHIELD_CARRY }]], lt));
      updateKnight(k, lt, { wind: 0.2, swing: 0.05 }); updateScarf(k, lt, { wind: 0.3 });
      placeShield(k, tmp, 'arm');
      const u = smooth(range(lt, 0.15, 1.0));
      k.shield.position.lerpVectors(rest.p, tmp.position, u); k.shield.quaternion.copy(rest.q).slerp(tmp.quaternion, u);
      standLight(E, 1.1); lanternLight(k, 0, 1.0, lt);
      aim(E.camera, v3(-1.9, 2.1, -E.L + 9.9), v3(0.2, 2.3, -E.L + 7.2));
    },
  };
}
// S19  he draws Vowbrand
function S19() {
  const { E, k } = vigilEnv({ fov: 38 });
  E.restShield.visible = false;
  const DRAW0 = { ...STAND(), ...SHIELD_CARRY, armR: [-0.5, 0.85, -0.15], foreR: [-1.0, 0.2, 0], chest: [0, 0.35, 0] };
  const DRAW1 = { ...SHIELD_GUARD };
  return {
    ...E, grade: { sat: 0.82, contrast: 1.25, bloom: 1.05, bloomT: 0.5 }, env: ARMORY_ENV,
    update(lt) {
      k.root.position.set(0, 1.4, -E.L + 7.3); k.root.rotation.y = 0.05;
      const drawn = lt > 0.75;
      setArmor(k, { sheathed: !drawn });
      applyPose(k, keyed([[0, { ...STAND(), ...SHIELD_CARRY }], [0.7, DRAW0], [1.4, DRAW1]], lt));
      k.sword.rotation.set(Math.PI / 2 + 0.35, 0, 0);
      updateKnight(k, lt, { wind: 0.25, swing: 0.05 }); updateScarf(k, lt, { wind: 0.35 });
      placeShield(k, k.shield, 'arm');
      const fl = smooth(range(lt, 0.9, 1.4));
      k.M.vein.uniforms.uEmissive.value.setRGB(1, 0.45, 0.15).multiplyScalar(1 + fl * 1.8);
      standLight(E, 1.1); lanternLight(k, 0, 1.0, lt);
      aim(E.camera, v3(1.25, 2.25, -E.L + 9.4), v3(-0.05, 2.35, -E.L + 7.2));
    },
  };
}
// S20  the successor: hero framing
function S20() {
  const { E, k } = vigilEnv({ fov: 46 });
  E.restShield.visible = false; setArmor(k, { sheathed: false });
  return {
    ...E, grade: { sat: 0.82, contrast: 1.2, bloom: 1.0, bloomT: 0.55 }, env: { ...ARMORY_ENV, rim: 0xb8c8e8 },
    update(lt) {
      k.root.position.set(0, 1.4, -E.L + 7.3); k.root.rotation.y = 0.05;
      applyPose(k, SHIELD_GUARD); k.sword.rotation.set(Math.PI / 2 + 0.35, 0, 0);
      updateKnight(k, lt, { wind: 0.3, swing: 0.05 }); updateScarf(k, lt, { wind: 0.4 });
      placeShield(k, k.shield, 'arm');
      standLight(E, 1.3); lanternLight(k, 0, 1.1, lt);
      const u = ease(range(lt, 0, 2.4));
      aim(E.camera, v3(lerp(0.6, -0.4, u), lerp(1.75, 1.6, u), -E.L + 7.3 + lerp(3.4, 2.6, u)), v3(0, lerp(2.2, 2.55, u), -E.L + 7.3));
    },
  };
}
// S21  he walks out of the fortress, protected
function S21() {
  const E = exteriorEnv({ fov: 48 });
  const k = buildCaelVigil({ sheathed: true }); E.scene.add(k.root); E.scene.add(k.shield);
  k.VM.slit.uniforms.uColor.value.setRGB(0.59, 0.21, 0.055);
  const gz = E.F.userData.gateZ;
  E.F.userData.doors.forEach(d => { d.piv.rotation.y = -d.sx * 1.3; });
  return {
    ...E, grade: { sat: 0.75, contrast: 1.2, bloom: 0.9, bloomT: 0.55 }, env: { ...STORM_ENV, fogCol: 0x5a6476, lightCol: 0x9aa6bc, ambient: 0x343a46 },
    update(lt) {
      const z = gz - 2 + lt * 1.15; k.root.position.set(0, 0, z); k.root.rotation.y = 0;
      const p = walkPose(lt * 0.82, { stride: 0.42, hunch: 0.05 }); Object.assign(p, SHIELD_CARRY); applyPose(k, p);
      updateKnight(k, lt, { wind: 0.8, swing: 0.3 }); updateScarf(k, lt, { wind: 0.9 });
      placeShield(k, k.shield, 'arm');
      lanternLight(k, 0, 1.2, lt);
      aim(E.camera, v3(-0.7, 1.6, z - 3.8), v3(0.2, 1.8, z + 12));
    },
  };
}

export const SHOTS_EP3 = { S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21 };
export { armoryEnv, exteriorEnv, ARMORY_ENV, STORM_ENV, SHIELD_GUARD, SHIELD_CARRY };
