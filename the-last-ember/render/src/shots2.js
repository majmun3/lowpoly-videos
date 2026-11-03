// THE LAST EMBER — shots S06–S18.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, xf, merge, flat } from './engine.js';
import { T } from './textures.js';
import { buildKnight, updateKnight, applyPose, mixPose, walkPose, buildAshwight, ashMaterials, shamblePose, buildWyrm, poseWyrm, knightGlow } from './characters.js';
import { sky, emberHeart, setHeart, chain, burnChain, cathedral, terrain, hnoise, ruinsField, deadTrees, keeperSeat, summitPlatform, muralWall } from './world.js';
import { cam, aim, shake, lanternLight, ash, embers, fire, shatter, burst, heavens, vista, setDawn, bridgeEnv, BRIDGE_ENV, PAL } from './shots.js';

// ---------------------------------------------------------------- helpers
function keyed(keys, t) { // keys: [[time, pose], ...] eased blend
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); }
  return keys[keys.length - 1][1];
}
function slowmo(lt, a, b, f) { if (lt < a) return lt; if (lt < b) return a + (lt - a) * f; return a + (b - a) * f + (lt - b); }
function curveSpine(pts) { const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); const L = c.getLength(); return (s) => { if (s <= L) return c.getPointAt(clamp(s / L)); const e = c.getPointAt(1), d = c.getTangentAt(1); return e.clone().addScaledVector(d, s - L); }; }
function orientWorld(obj, q) { obj.parent.updateMatrixWorld(true); const pq = new THREE.Quaternion(); obj.parent.getWorldQuaternion(pq); obj.quaternion.copy(pq.invert().multiply(q)); }
const qDir = (dir) => new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize());

const GUARD = { hipY: 0.95, spine: [0.12, 0, 0], chest: [0, -0.25, 0], neck: [-0.05, 0.1, 0], armR: [-1.05, -0.25, 0.25], foreR: [-0.85, 0, 0], armL: [-0.95, 0.45, -0.25], foreL: [-1.15, 0, 0], thighL: [-0.45, 0, 0.06], shinL: [0.55, 0, 0], footL: [-0.1, 0, 0], thighR: [0.3, 0, -0.06], shinR: [0.35, 0, 0], footR: [-0.2, 0, 0] };
const SEATED = { hipY: 0.1, spine: [0.08, 0, 0], neck: [0.35, 0, 0], head: [0.15, 0, 0], thighL: [-1.5, 0, -0.12], shinL: [1.45, 0, 0], thighR: [-1.5, 0, 0.12], shinR: [1.45, 0, 0], armR: [-0.95, 0.35, 0.12], foreR: [-0.5, 0, 0], armL: [-0.95, -0.35, -0.12], foreL: [-0.5, 0, 0] };
const SEATED_UP = { ...SEATED, spine: [-0.02, 0, 0], neck: [-0.1, 0, 0], head: [-0.15, 0, 0] };

// ---------------------------------------------------------------- ash forest builder
function forestEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 48, 0.1);
  scene.add(sky({ ...PAL.ash, horizon: 0x3e3a3c, top: 0x121012, cover: 0.5 }));
  const hn = hnoise(31), gfn = (x, z) => hn(x * 2, z * 2) * 0.5;
  scene.add(terrain(240, 60, gfn));
  scene.add(deadTrees({ seed: 7, count: 170, area: [-45, 45, -70, 20], ground: gfn, avoid: (x, z) => Math.abs(x) < 6 && z > -26 && z < 8 }));
  scene.add(ash({ box: v3(24, 14, 24), count: 600, size: 0.03, vel: v3(0.25, -0.5, 0.1), origin: v3(0, 5, -6) }));
  return { scene, camera, gfn };
}
const FOREST_ENV = { fog: [2, 34], fogCol: 0x3c383a, hfog: [0.8, 3, 0.6, 0.08], lightDir: v3(0.3, -0.6, 0.7), lightCol: 0x5a5258, ambient: 0x2e2c30, rim: 0x8a5a4c, fillDir: v3(-0.2, -0.3, -1), fillCol: 0x4a4448 };

// ---------------------------------------------------------------- S06  Ashwights emerge from the fog
function S06() {
  const F = forestEnv({ fov: 46 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; F.scene.add(k.root);
  const AM = ashMaterials(), W = [];
  for (const [x, z, hb, ph] of [[-1.4, -7.5, true, 0], [1.8, -10, false, 0.3], [-3.2, -12.5, true, 0.6], [0.4, -14.5, false, 0.15], [3.6, -16, true, 0.45]]) {
    const a = buildAshwight({ halberd: hb, M: AM }); a.root.position.set(x, F.gfn(x, z), z); F.scene.add(a.root); W.push({ a, x, z, ph });
  }
  return {
    ...F, grade: { sat: 0.7, contrast: 1.2, bloom: 0.8 }, env: FOREST_ENV,
    update(lt) {
      applyPose(k, mixPose(walkPose(0, { stride: 0 }), GUARD, smooth(range(lt, 0.2, 1.4))));
      k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0);
      updateKnight(k, lt, { wind: 0.35, swing: 0.1 });
      lanternLight(k, 0, 1.6, lt);
      for (const w of W) { const z = w.z + lt * 0.55; w.a.root.position.set(w.x, F.gfn(w.x, z), z); applyPose(w.a, shamblePose(lt * 0.55 + w.ph)); }
      aim(F.camera, v3(0.55 - lt * 0.03, 1.92, 2.05 - lt * 0.12), v3(-0.4, 1.2, -11));
    },
  };
}
// ---------------------------------------------------------------- S07  the first blow (parry, slash, ash)
function S07() {
  const F = forestEnv({ fov: 44 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; F.scene.add(k.root);
  const AM = ashMaterials();
  const foe = buildAshwight({ halberd: true, M: AM }); foe.root.position.set(0.1, 0, -1.75); F.scene.add(foe.root);
  const bg = buildAshwight({ M: AM }); bg.root.position.set(-1.8, 0, -6); F.scene.add(bg.root);
  const sh = shatter(foe.root, F.scene, 17, 0);
  const tHit = 1.62, tParry = 0.82;
  F.scene.add(burst(v3(0.05, 1.0, -1.7), tHit, { count: 380, spread: v3(1.3, 1.2, 1.3), life: 1.6, size: 0.022, fall: 0.25, c0: 0x8a8480, c1: 0x6a6462, c2: 0x4a4644 }));
  const sparks = burst(v3(0.0, 2.05, -0.95), tParry, { count: 90, spread: v3(1.2, 1.0, 1.2), life: 0.5, size: 0.02, fall: 1.5, c0: 0xffffd0, c1: 0xffa040, c2: 0xa03010, additive: true, opacity: 1 });
  F.scene.add(sparks);
  const sparks2 = burst(v3(0.05, 1.3, -1.6), tHit, { count: 70, spread: v3(1.0, 0.6, 1.0), life: 0.45, size: 0.02, fall: 1.2, c0: 0xffffd0, c1: 0xffa040, c2: 0xa03010, additive: true, opacity: 1 });
  F.scene.add(sparks2);
  const KK = [
    [0, GUARD],
    [0.7, { ...GUARD, armR: [-1.9, -0.1, 0.3], foreR: [-0.6, 0, 0], armL: [-1.8, 0.4, -0.3], foreL: [-0.8, 0, 0], spine: [-0.05, 0, 0] }], // parry high
    [0.95, { ...GUARD, armR: [-1.9, -0.1, 0.3], foreR: [-0.6, 0, 0], armL: [-1.8, 0.4, -0.3], foreL: [-0.8, 0, 0], spine: [-0.1, 0, 0], hipY: 0.9 }],
    [1.35, { ...GUARD, chest: [0, 0.75, 0], armR: [-1.4, 0.9, 1.2], foreR: [-0.5, 0, 0], armL: [-1.2, 0.9, 0.2], foreL: [-1.0, 0, 0] }], // wind up right
    [1.62, { ...GUARD, chest: [0.1, -0.9, 0], spine: [0.25, -0.2, 0], armR: [-1.4, -0.9, -0.3], foreR: [-0.2, 0, 0], armL: [-1.3, -0.6, -0.6], foreL: [-0.6, 0, 0], hipY: 0.88 }], // slash through
    [2.6, { ...GUARD, chest: [0.1, -0.7, 0], spine: [0.2, -0.1, 0], armR: [-0.9, -0.6, 0.1], foreR: [-0.3, 0, 0], armL: [-0.6, -0.3, -0.4], foreL: [-0.6, 0, 0], hipY: 0.9 }],
  ];
  const FK = [
    [0, { ...shamblePose(0), armR: [-1.6, 0, 0.2], foreR: [-0.5, 0, 0] }],
    [0.55, { ...shamblePose(0.1), spine: [-0.2, 0, 0], armR: [-3.0, 0, 0.1], foreR: [-0.3, 0, 0], armL: [-2.8, 0, -0.1], foreL: [-0.5, 0, 0] }],
    [0.85, { ...shamblePose(0.2), spine: [0.5, 0, 0], armR: [-1.5, 0, 0.1], foreR: [-0.3, 0, 0], armL: [-1.4, 0, -0.1], foreL: [-0.4, 0, 0] }],
    [1.4, { ...shamblePose(0.3), spine: [0.3, 0, 0], armR: [-1.2, 0, 0.2], foreR: [-0.5, 0, 0], armL: [-1.0, 0, -0.1], foreL: [-0.4, 0, 0] }],
  ];
  return {
    ...F, grade: { sat: 0.72, contrast: 1.2, bloom: 0.9 }, env: FOREST_ENV,
    update(lt) {
      const a = slowmo(lt, 1.25, 2.35, 0.33);
      applyPose(k, keyed(KK, a)); k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0);
      updateKnight(k, a, { wind: 0.5, swing: 0.2 });
      applyPose(foe, keyed(FK, a));
      applyPose(bg, shamblePose(a * 0.5 + 0.3)); bg.root.position.z = -6 + a * 0.4;
      sh.update(a - tHit);
      G.uTime.value = a; // particles follow action time (slow motion)
      lanternLight(k, 0, 1.5, a);
      const flare = Math.exp(-Math.pow((a - tParry) * 9, 2)) + Math.exp(-Math.pow((a - tHit) * 7, 2));
      setPL(1, v3(0, 1.8, -1.2), 0xffb060, 5, flare * 3);
      aim(F.camera, v3(1.75 - lt * 0.12, 1.6, 2.5 - lt * 0.12), v3(-0.15, 1.2, -1.2));
      shake(F.camera, flare * 0.03, lt);
    },
  };
}

// ---------------------------------------------------------------- S08  the Knellwyrm rises beside the bridge
function S08() {
  const B = bridgeEnv({ fov: 52 });
  const k = buildKnight(); k.root.position.set(0.5, 0, -2); k.root.rotation.y = Math.PI / 2 - 0.25; B.scene.add(k.root);
  const w = buildWyrm({ scale: 1.6 }); B.scene.add(w.root);
  return {
    ...B, grade: { sat: 0.8, contrast: 1.2, bloom: 0.9 }, env: { ...BRIDGE_ENV, lightDir: v3(0.6, -0.5, -0.3), fillDir: v3(0.5, -0.2, -0.5) },
    update(lt) {
      setHeart(B.H.heart, 0, lt);
      const rise = easeOut(range(lt, 0.0, 3.0));
      const H = v3(17, -38 + rise * 52, -12);
      const away = v3(1, 0, -0.25).normalize();
      const sp = (s) => { const n = Math.min(s, 9); const p = H.clone().addScaledVector(away, n * 0.75 + Math.max(0, s - 9) * 0.12); p.y += -n * 0.25 - Math.max(0, s - 9) * 0.97 + n * (1 - rise) * 0.9; p.z += Math.sin(s * 0.07 + lt * 0.8) * 3; return p; };
      poseWyrm(w, sp, lt, { jaw: 0.15 + smooth(range(lt, 2.4, 3.4)) * 0.5, bellSwing: 0.6, roll: 0.05 });
      applyPose(k, mixPose(walkPose(0, { stride: 0 }), GUARD, smooth(range(lt, 0.8, 1.8))));
      k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0);
      updateKnight(k, lt, { wind: 0.9, swing: 0.2, back: 0.3 });
      lanternLight(k, 0, 1.3, lt);
      setPL(1, H.clone().add(v3(0, -0.5, 3)), 0xff5a18, 14, 0.6);
      const tgt = v3(10, lerp(4, 13, smooth(range(lt, 0.3, 3.2))), -10);
      aim(B.camera, v3(-4.2 + lt * 0.2, 1.1, 5.5), tgt);
      shake(B.camera, 0.04 * smooth(range(lt, 0.3, 1.0)) * (1 - range(lt, 2.5, 3.5)), lt);
    },
  };
}
// ---------------------------------------------------------------- S09  it towers over him
function S09() {
  const B = bridgeEnv({ fov: 60 });
  const k = buildKnight(); k.root.position.set(0, 0, 0); k.root.rotation.y = Math.PI; B.scene.add(k.root);
  const w = buildWyrm({ scale: 1.6 }); B.scene.add(w.root);
  return {
    ...B, grade: { sat: 0.8, contrast: 1.25, bloom: 1.0 }, env: { ...BRIDGE_ENV, lightDir: v3(0.2, 0.5, -0.8), lightCol: 0x8a6a60, rim: 0xa04a30 },
    update(lt) {
      setHeart(B.H.heart, 0, lt);
      const dip = smooth(range(lt, 0.0, 1.0)), roar = smooth(range(lt, 0.7, 1.1)) * (1 - smooth(range(lt, 2.3, 2.9)) * 0.6);
      const H = v3(0.5, 13.5 - dip * 4.5, -7.5 + dip * 1.5);
      const sp = curveSpine([H, H.clone().add(v3(0.8, 4, -3.5)), v3(5, 19, -13), v3(14, 17, -15), v3(21, 4, -13), v3(25, -18, -10), v3(27, -50, -8), v3(28, -90, -6)]);
      poseWyrm(w, sp, lt, { jaw: 0.2 + roar * 0.75, bellSwing: 0.5 + roar * 0.4 });
      applyPose(k, { ...GUARD, spine: [-0.05, 0, 0], neck: [-0.45, 0, 0], head: [-0.2, 0, 0] });
      k.sword.rotation.set(Math.PI / 2 + 0.1, 0, 0);
      updateKnight(k, lt, { wind: 1.0 + roar, swing: 0.2, back: 0.5 });
      lanternLight(k, 0, 1.3, lt);
      setPL(1, H.clone().add(v3(0, -0.5, 3)), 0xff5a18, 14, 0.5 + roar * 0.6);
      aim(B.camera, v3(-0.75, 0.3, 2.6 + lt * 0.08), v3(0.3, 8.5 - dip * 1.5, -6));
      shake(B.camera, roar * 0.05, lt);
    },
  };
}
// ---------------------------------------------------------------- S10  the kill (slow-motion leap)
function S10(o = {}) {
  const B = bridgeEnv({ fov: 50, clear: 25 });
  const k = buildKnight(); k.root.rotation.y = Math.PI; B.scene.add(k.root);
  const w = buildWyrm({ scale: 1.6 }); B.scene.add(w.root);
  const tStrike = 1.2, tCrash = 1.75;
  B.scene.add(burst(v3(0.2, 4.4, -3.9), tStrike, { count: 220, spread: v3(3, 2.5, 3), life: 1.0, size: 0.04, fall: 0.6, c0: 0xffffc0, c1: 0xffa040, c2: 0x8a2008, additive: true, opacity: 1 }));
  B.scene.add(burst(v3(0.2, 0.5, -4.5), tCrash, { count: 420, spread: v3(7, 2.2, 7), life: 2.2, size: 0.05, fall: 0.1, c0: 0x8a8480, c1: 0x6a6462, c2: 0x4a4644 }));
  B.scene.add(embers({ origin: v3(0, 3, -3), box: v3(14, 8, 14), count: 160, size: 0.035 }));
  const UP = { ...GUARD, hipY: 0.8, thighL: [-1.0, 0, 0], shinL: [1.3, 0, 0], thighR: [-0.3, 0, 0], shinR: [1.0, 0, 0], armR: [-2.9, 0, 0.2], foreR: [-0.5, 0, 0], armL: [-2.8, 0, -0.2], foreL: [-0.7, 0, 0], spine: [-0.25, 0, 0] };
  const KK = [
    [0, { ...GUARD, hipY: 0.82, thighL: [-0.9, 0, 0], shinL: [1.2, 0, 0], thighR: [0.2, 0, 0], shinR: [1.1, 0, 0] }],
    [0.35, UP],
    [0.95, { ...UP, hipY: 1.0, thighL: [-1.3, 0, 0], shinL: [1.6, 0, 0], thighR: [0.3, 0, 0], shinR: [1.0, 0, 0], armR: [-3.3, 0, 0.15], foreR: [-0.8, 0, 0], armL: [-3.2, 0, -0.15], foreL: [-1.0, 0, 0], spine: [-0.4, 0, 0], chest: [-0.2, 0, 0] }],
    [tStrike, { ...GUARD, hipY: 1.0, thighL: [-1.3, 0, 0], shinL: [1.2, 0, 0], thighR: [-0.6, 0, 0], shinR: [1.4, 0, 0], armR: [-1.1, 0, 0.1], foreR: [-0.1, 0, 0], armL: [-1.0, 0, -0.1], foreL: [-0.2, 0, 0], spine: [0.55, 0, 0], chest: [0.2, 0, 0] }],
    [1.6, { hipY: 0.5, thighL: [-1.6, 0, -0.1], shinL: [1.8, 0, 0], thighR: [0.2, 0, 0.1], shinR: [2.2, 0, 0], footR: [-0.6, 0, 0], spine: [0.5, 0, 0], chest: [0.15, 0, 0], neck: [0.2, 0, 0], armR: [-0.8, 0, 0.2], foreR: [-0.4, 0, 0], armL: [-0.3, 0, -0.3], foreL: [-0.3, 0, 0] }],
    [3.7, { hipY: 0.55, thighL: [-1.5, 0, -0.1], shinL: [1.7, 0, 0], thighR: [0.15, 0, 0.1], shinR: [2.1, 0, 0], footR: [-0.6, 0, 0], spine: [0.35, 0, 0], chest: [0.1, 0, 0], neck: [-0.1, 0, 0], armR: [-0.7, 0, 0.2], foreR: [-0.4, 0, 0], armL: [-0.2, 0, -0.3], foreL: [-0.3, 0, 0] }],
  ];
  return {
    ...B, grade: { sat: 0.8, contrast: 1.2, bloom: 1.0 }, env: { ...BRIDGE_ENV, lightDir: v3(-0.6, -0.5, -0.4) },
    update(lt) {
      setHeart(B.H.heart, 0, lt);
      const a = lt;
      const z = lerp(3.2, -1.4, smooth(range(a, 0.35, 1.4)));
      const y = 2.5 * Math.sin(clamp((a - 0.35) / 1.15) * Math.PI);
      k.root.position.set(0, Math.max(0, y), z);
      applyPose(k, keyed(KK, a)); k.sword.rotation.set(Math.PI / 2 - 0.1, 0, 0);
      updateKnight(k, a, { wind: 0.9, swing: 0.3, back: 0.4 });
      lanternLight(k, 0, 1.3, a);
      // the head lunges in, is struck, and crashes onto the deck
      const lunge = smooth(range(a, 0, tStrike));
      const fall = easeIn(range(a, tStrike, tCrash));
      const H = v3(0.2, lerp(6.5, 3.0, lunge) - fall * 1.9, lerp(-17, -5.6, lunge) + fall * 0.3);
      const sp = curveSpine([H, H.clone().add(v3(0.3, 0.8 - fall * 0.8, -6)), v3(2.5, lerp(3, 1.0, fall), -15), v3(8, lerp(2, -1, fall), -22), v3(14, -14, -26), v3(16, -40, -28), v3(17, -80, -29)]);
      poseWyrm(w, sp, a, { jaw: lerp(0.8, 0.35, fall), bellSwing: 0.45 + fall * 0.5, headRoll: fall * 0.5, headPitch: fall * 0.25 });
      const flare = Math.exp(-Math.pow((a - tStrike) * 10, 2));
      setPL(1, v3(0.2, 4.4, -3.9), 0xffc070, 12, flare * 4);
      setPL(2, H.clone().add(v3(0, -1, 2)), 0xff5a18, 16, 1.2 * (1 - range(a, tCrash, 3.5) * 0.7));
      aim(B.camera, v3(-2.6 + lt * 0.15, 1.5, 12.5 - lt * 0.3), v3(0.1, lerp(3.0, 2.0, smooth(range(lt, 1.3, 2.2))), -3.0));
      shake(B.camera, Math.exp(-Math.pow((a - tCrash) * 4, 2)) * 0.12 + flare * 0.05, lt);
    },
  };
}

// ---------------------------------------------------------------- S11  the Ashen Cathedral
function S11() {
  const scene = new THREE.Scene(), camera = cam(56, 0.2);
  const sunPos = v3(0, 900, -520);
  scene.add(sky({ ...PAL.ash, sunDir: sunPos.clone().normalize(), cover: 0.4 }));
  const hn = hnoise(41), gfn = (x, z) => (z > 25 ? hn(x, z) * 2 - 7 : -7.5);
  scene.add(terrain(1400, 70, gfn));
  const cat = cathedral({ color: 0xe8e0e0 }); scene.add(cat);
  const H = heavens(scene, cat.userData.summit, sunPos, 160, 12, { fogScale: 0.1, chainFog: 0.2 });
  scene.add(ruinsField({ seed: 13, count: 70, center: [0, -7, 0], rMin: 70, rMax: 500, ground: gfn, hScale: 1.5 }));
  // braziers flanking the steps
  for (const sx of [-1, 1]) { mesh(prism(6, 0.6, 0.9, 1.6), mat({ map: T('iron') }), scene, [sx * 9, -6, 18]); scene.add(fire(v3(sx * 9, -4.3, 18), { spread: v3(0.8, 0.3, 0.8), size: 0.7, count: 70, life: 1.0, vel: v3(0, 2.2, 0) })); }
  const k = buildKnight(); k.root.rotation.y = Math.PI; scene.add(k.root);
  scene.add(ash({ box: v3(40, 30, 40), count: 700, size: 0.05, vel: v3(0.8, -1, 0.3), origin: v3(0, 5, 10) }));
  return {
    scene, camera, grade: { sat: 0.82, contrast: 1.2, bloom: 0.85 },
    env: { fog: [10, 520], fogCol: 0x4e4648, hfog: [-4, 12, 0.6, 0.01], lightDir: v3(0.3, -0.45, -0.85), lightCol: 0xb0a098, ambient: 0x3a3438, rim: 0x8a4a3a, fillDir: v3(0, -0.3, -1), fillCol: 0x2a2224 },
    update(lt) {
      setHeart(H.heart, 0, lt);
      const z = 22 - lt * 1.05, y = Math.max(-6.6, Math.min(-0.6, -0.6 - (z - 3) / 2.2 * 0.6));
      k.root.position.set(0.5, y, z);
      const p = walkPose(lt * 0.8, { stride: 0.45, hunch: 0.15 }); p.thighL[0] -= 0.2; p.thighR[0] -= 0.2; p.armR = [-0.2, 0, 0.15];
      applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.7, swing: 0.3 });
      lanternLight(k, 0, 1.3, lt);
      for (const sx of [-1, 1]) setPL(sx > 0 ? 1 : 2, v3(sx * 9, -3.8, 18), 0xff7a28, 14, 1.3);
      const u = ease(range(lt, 0.6, 4.2));
      const cp = v3(lerp(1.6, 6, u), lerp(y + 1.5, 10, u), lerp(z + 3.6, 118, u));
      const tgt = v3(lerp(0.3, 0, u), lerp(y + 1.5, 300, u), lerp(z - 3, -300, u));
      aim(camera, cp, tgt);
    },
  };
}

// ---------------------------------------------------------------- summit builder (S12–S14, S15b, S16, S18)
function summitEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 52, 0.1);
  const sunPos = o.sunPos || v3(0, 330, -360);
  const sk = sky({ horizon: 0x5a3a36, top: 0x160c0e, bottom: 0x2a1a1a, cloud: 0x2a1c1e, cloudLit: 0x8a3a24, sunCol: 0x6a2a12, sunDir: sunPos.clone().normalize(), cover: 0.38, swirl: 1 });
  scene.add(sk);
  scene.add(summitPlatform({ r: 13 }));
  const seat = keeperSeat(); seat.position.set(0, 0, -4); scene.add(seat);
  const wall = muralWall(16, 8); wall.position.set(-11.5, 0, 0); wall.rotation.y = Math.PI / 2; scene.add(wall);
  // sea of cloud far below
  const cm = mat({ map: T('clouds'), color: 0x6a4040, unlit: true, repeat: [6, 6], affine: 0 });
  const sea = mesh(new THREE.PlaneGeometry(3000, 3000, 20, 20), cm, scene, [0, -60, 0], [-Math.PI / 2, 0, 0]);
  const heart = emberHeart(130, { fogScale: 0.05 }); heart.position.copy(sunPos); scene.add(heart);
  const chains = seat.userData.anchors.map((a, i) => { const A = a.clone().add(seat.position); const f = [-0.9, 0.9, -0.45, 0.45][i]; const ch = chain(A, sunPos.clone().add(v3(f * 120, -95, 30)), 1.3, { sag: 0.004, fogScale: 0.15 }); scene.add(ch); return ch; });
  const ashP = ash({ box: v3(30, 20, 30), count: 500, size: 0.035, vel: v3(1.0, -0.4, 0.3) }); scene.add(ashP);
  return { scene, camera, sk, seat, wall, heart, chains, sea, sunPos, ashP };
}
const SUMMIT_ENV = { fog: [8, 260], fogCol: 0x4a3434, hfog: [-8, 20, 0.9, 0.02], lightDir: v3(0, -0.7, 0.7), lightCol: 0xa05a3a, ambient: 0x363034, rim: 0xb05a3a, fillDir: v3(0.2, -0.3, -1), fillCol: 0x5a4446 };

// ---------------------------------------------------------------- S12  the empty Keeper's Seat
function S12() {
  const Sm = summitEnv({ fov: 58 });
  const k = buildKnight(); k.root.position.set(0.4, 0, 6.5); k.root.rotation.y = Math.PI; Sm.scene.add(k.root);
  return {
    ...Sm, grade: { sat: 0.85, contrast: 1.2, bloom: 0.9 }, env: SUMMIT_ENV,
    update(lt) {
      setHeart(Sm.heart, 0, lt);
      const p = walkPose(0, { stride: 0 }); p.neck = [-0.3, 0, 0]; p.head = [-0.2, 0, 0]; p.armR = [-0.2, 0, 0.15];
      applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.9, swing: 0.1 });
      lanternLight(k, 0, 1.2, lt);
      aim(Sm.camera, v3(1.1, 1.3 + lt * 0.35, 10.6 - lt * 0.3), v3(0.1, 6.2 + lt * 1.2, -6));
    },
  };
}
// ---------------------------------------------------------------- S13  "It needed a keeper."
function S13() {
  const Sm = summitEnv({ fov: 30 });
  const k = buildKnight(); k.root.position.set(0.4, 0, 6.5); k.root.rotation.y = Math.PI; Sm.scene.add(k.root);
  return {
    ...Sm, grade: { sat: 0.85, contrast: 1.25, bloom: 1.0, bloomT: 0.45 }, env: { ...SUMMIT_ENV, lightDir: v3(0.1, -0.5, 0.85), rim: 0xb05030, fillDir: v3(0, -0.2, 1), fillCol: 0x3a2e30 },
    update(lt) {
      setHeart(Sm.heart, 0, lt);
      const look = smooth(range(lt, 0.2, 1.6));
      const p = walkPose(0, { stride: 0 }); p.neck = [-0.1 - look * 0.25, 0, 0]; p.head = [-look * 0.25, 0.05, 0]; p.armR = [-0.2, 0, 0.15];
      applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.6, swing: 0.05 });
      const pulse = 0.8 + 0.2 * Math.sin(lt * 2.2);
      setPL(0, v3(0.4, 4.5, 3.0), 0xff6a28, 6, 0.9 * pulse);
      k.M.slit.uniforms.uEmissive.value.setRGB(1, 0.42, 0.12).multiplyScalar(0.6 + look * 0.4);
      aim(Sm.camera, v3(0.75 - lt * 0.05, 1.25, 4.25 + lt * 0.06), v3(0.4, 1.8, 6.5));
    },
  };
}
// ---------------------------------------------------------------- S14  the carved truth
function S14() {
  const Sm = summitEnv({ fov: 50 });
  return {
    ...Sm, grade: { sat: 0.75, contrast: 1.25, bloom: 0.8 }, env: { ...SUMMIT_ENV, lightDir: v3(-0.8, -0.4, -0.2), lightCol: 0x8a5a40, ambient: 0x2a2224 },
    update(lt) {
      setHeart(Sm.heart, 0, lt);
      const u = ease(range(lt, 0.0, 4.9));
      const z = lerp(5.6, -5.4, u);
      const fl = 0.85 + Math.sin(lt * 9) * 0.08 + Math.sin(lt * 23) * 0.06;
      setPL(0, v3(-7.5, 3.5, z + 1.5), 0xff8030, 9, 1.4 * fl);
      aim(Sm.camera, v3(-3.0, 4.0, z + 0.6), v3(-11.5, 4.0, z));
    },
  };
}
// ---------------------------------------------------------------- S15a  the fallen beast wore the crest
function S15a() {
  const B = bridgeEnv({ fov: 40, clear: 25 });
  const w = buildWyrm({ scale: 1.6 }); B.scene.add(w.root);
  const H = v3(0.2, 1.1, -2.0);
  const sp = curveSpine([H, v3(0.4, 0.6, -8), v3(2.5, 1.0, -15), v3(8, -1, -22), v3(14, -14, -26), v3(16, -40, -28)]);
  return {
    ...B, grade: { sat: 0.45, contrast: 1.3, bloom: 0.9, gain: [1.2, 0.92, 0.88], lift: [0.04, 0, 0] }, env: { ...BRIDGE_ENV, lightDir: v3(-0.4, -0.5, -0.75), lightCol: 0xb0a090, fillDir: v3(0, -0.3, -1), fillCol: 0x4a4040 },
    update(lt) {
      setHeart(B.H.heart, 0, lt);
      poseWyrm(w, sp, 2, { jaw: 0.35, bellSwing: 0.02, headRoll: 0.5, headPitch: 0.25 });
      w.root.updateMatrixWorld(true);
      const sig = w.fusedHelm.localToWorld(v3(0, 0.25, 0.17));
      const u = ease(range(lt, 0, 1.6));
      const dir = v3(0.5, 0.35, 1).normalize();
      aim(B.camera, sig.clone().addScaledVector(dir, lerp(7.5, 2.3, u)), sig);
      setPL(0, sig.clone().addScaledVector(dir, 3), 0xffa060, 8, 1.2);
    },
  };
}
// ---------------------------------------------------------------- S15b  ...the same crest on his own brow
function S15b() {
  const Sm = summitEnv({ fov: 40 });
  const k = buildKnight(); k.root.position.set(0.4, 0, 6.5); k.root.rotation.y = Math.PI; Sm.scene.add(k.root);
  return {
    ...Sm, grade: { sat: 0.45, contrast: 1.3, bloom: 0.9, gain: [1.2, 0.92, 0.88], lift: [0.04, 0, 0] }, env: { ...SUMMIT_ENV, rim: 0xb05030, fillDir: v3(0, -0.3, 1), fillCol: 0x6a5a58 },
    update(lt) {
      setHeart(Sm.heart, 0, lt);
      const p = walkPose(0, { stride: 0 }); p.neck = [0.15, 0, 0]; p.head = [0.1, 0, 0];
      applyPose(k, p); updateKnight(k, lt, { wind: 0.5, swing: 0.05 });
      k.root.updateMatrixWorld(true);
      const sig = k.helm.localToWorld(v3(0, 0.25, 0.17));
      const u = ease(range(lt, 0, 1.0));
      const dir = v3(0.5, 0.35, -1).normalize();
      aim(Sm.camera, sig.clone().addScaledVector(dir, lerp(0.55, 0.33, u)), sig);
      setPL(0, sig.clone().addScaledVector(dir, 0.6), 0xffa060, 3, 1.2);
    },
  };
}
// ---------------------------------------------------------------- S16  he takes the seat — the fire takes him
function knightOnSeat(Sm) {
  const k = buildKnight(); k.root.position.set(0, 2.3, -3.85); Sm.scene.add(k.root);
  const flames = fire(v3(0, 2.8, -4.1), { count: 320, spread: v3(1.9, 2.2, 0.9), size: 0.1, life: 0.9, vel: v3(0, 2.8, 0), seed: 77, opacity: 0.6 });
  flames.visible = false; Sm.scene.add(flames);
  const chainFire = Sm.chains.map((ch, i) => { const p = particles({ mode: 'line', count: 260, origin: ch.userData.a, lineB: ch.userData.b, spread: v3(2, 2, 2), vel: v3(0, 3, 0), life: 0.8, size: 0.9, c0: 0xfff0b0, c1: 0xff8a20, c2: 0x8a1a08, soft: true, seed: 90 + i, front: 0, fogMix: 0.1 }); Sm.scene.add(p); return p; });
  const halo = glow(0xff9040, 9, 0); halo.position.set(0, 3.4, -3.6); Sm.scene.add(halo);
  return { k, flames, chainFire, halo };
}
function setBurn(Sm, K, burn, front, t) {
  K.flames.visible = burn > 0.01; K.flames.material.uniforms.uOpacity.value = burn;
  knightGlow(K.k, burn * 0.55);
  K.k.M.slit.uniforms.uEmissive.value.setRGB(1, 0.5 + burn * 0.45, 0.15 + burn * 0.7).multiplyScalar(0.7 + burn * 1.6);
  K.k.M.vein.uniforms.uEmissive.value.setRGB(1, 0.45 + burn * 0.4, 0.15 + burn * 0.5).multiplyScalar(1 + burn);
  Sm.chains.forEach((ch, i) => burnChain(ch, front, t));
  K.chainFire.forEach(p => { p.material.uniforms.uFront.value = front; });
  K.halo.material.opacity = burn * 0.6;
  setPL(1, v3(0, 3.6, -2.6), 0xff7a28, 10, burn * 1.1);
}
function S16() {
  const Sm = summitEnv({ fov: 40 });
  const K = knightOnSeat(Sm);
  K.k.sword.visible = true;
  return {
    ...Sm, grade: { sat: 0.88, contrast: 1.2, bloom: 0.9, bloomT: 0.55 }, env: { ...SUMMIT_ENV, lightDir: v3(0.3, -0.6, 0.75) },
    update(lt) {
      setHeart(Sm.heart, smooth(range(lt, 1.6, 3.5)) * 0.25, lt);
      const up = smooth(range(lt, 0.2, 0.9));
      applyPose(K.k, mixPose(SEATED, SEATED_UP, up));
      orientWorld(K.k.sword, qDir(v3(0, -1, 0.15)));
      K.k.sword.position.set(0, -0.06, 0.02);
      updateKnight(K.k, lt, { wind: 0.6 + up, swing: 0.05, len: 0.9, back: 0.4 });
      const burn = smooth(range(lt, 0.9, 2.2)), front = ease(range(lt, 0.95, 3.4));
      setBurn(Sm, K, burn, front, lt);
      const a = lerp(0.4, -0.3, ease(range(lt, 0, 3.5)));
      aim(Sm.camera, v3(Math.sin(a) * 5.0, 2.9, -3.8 + Math.cos(a) * 5.0), v3(0, 3.55, -4));
      shake(Sm.camera, Math.exp(-Math.pow((lt - 0.95) * 5, 2)) * 0.06, lt);
    },
  };
}
// ---------------------------------------------------------------- S17  dawn returns to Vhaldren
function S17() {
  const V = vista({ cat: v3(0, 0, -520), sun: v3(0, 1000, -1500), R: 170, fov: 58, near: { center: [0, 0, 120], avoid: (x, z) => Math.abs(x) < 14 } });
  const sg = glow(0xffb050, 40, 0.9); sg.position.copy(V.summit); V.scene.add(sg);
  const pf = V.H.chains.map((ch, i) => { const p = particles({ mode: 'line', count: 400, origin: ch.userData.a, lineB: ch.userData.b, spread: v3(16, 16, 16), vel: v3(0, 20, 0), life: 0.8, size: 9, c0: 0xfff0b0, c1: 0xff9a30, c2: 0x8a2a08, soft: true, seed: 50 + i, front: 1, fogMix: 0.0 }); V.scene.add(p); return p; });
  V.scene.add(embers({ origin: v3(0, 30, 120), box: v3(120, 60, 120), count: 300, size: 0.15, vel: v3(0.8, 1.5, 0.2) }));
  V.ashP.visible = false;
  return {
    ...V, grade: { sat: 0.9, contrast: 1.1, bloom: 0.7, bloomT: 0.6 },
    env: { fog: [20, 1000], fogCol: 0x524a4c, hfog: [10, 30, 0.75, 0.004], lightDir: v3(0, -0.5, 1), lightCol: 0x6a4a40, ambient: 0x262024 },
    update(lt) {
      const k = smooth(range(lt, 0.0, 2.2));
      setDawn(V, k, lt);
      V.H.chains.forEach(ch => burnChain(ch, 1, lt, 1));
      const fc = new THREE.Color(0x524a4c).lerp(new THREE.Color(0x8a6a58), k);
      setEnv({ fogCol: fc.getHex(), lightCol: new THREE.Color(0x6a4a40).lerp(new THREE.Color(0xd0a070), k).getHex(), ambient: new THREE.Color(0x262024).lerp(new THREE.Color(0x4a3e3e), k).getHex(), lightDir: v3(0, -0.45, 1) });
      setPL(0, V.summit, 0xffa040, 150, 1.5);
      const f = lt / 2.6;
      aim(V.camera, v3(-2 + f * 6, 26 + f * 10, 150 + f * 40), v3(0, 230 + f * 30, -520));
    },
  };
}
// ---------------------------------------------------------------- S18  the final keeper
function S18() {
  const Sm = summitEnv({ fov: 36 });
  const K = knightOnSeat(Sm);
  return {
    ...Sm, grade: { sat: 0.9, contrast: 1.2, bloom: 0.8, bloomT: 0.6 }, env: { ...SUMMIT_ENV, lightDir: v3(0.2, -0.6, 0.75), lightCol: 0x8a5a3a, ambient: 0x2a2224, rim: 0xb05a34, fillDir: v3(0, -0.3, -1), fillCol: 0x3a2a26 },
    update(lt) {
      const u = Sm.sk.userData.u;
      u.uHorizon.value.set(0x9a6a48); u.uTop.value.set(0x3a2e40); u.uCloudLit.value.set(0xd09060); u.uSunCol.value.set(0xa06030); u.uCloudCol.value.set(0x5a4040);
      setHeart(Sm.heart, 1, lt);
      setEnv({ fogCol: 0x7a5446 });
      applyPose(K.k, SEATED_UP);
      orientWorld(K.k.sword, qDir(v3(0, -1, 0.15))); K.k.sword.position.set(0, -0.06, 0.02);
      updateKnight(K.k, lt, { wind: 1.2, swing: 0.05, len: 0.9, back: 0.5 });
      setBurn(Sm, K, 1, 1, lt);
      K.k.root.updateMatrixWorld(true);
      const hp = K.k.helm.localToWorld(v3(0, 0.17, 0.1));
      const u2 = ease(range(lt, 0, 4.2));
      aim(Sm.camera, hp.clone().add(v3(0.35, -0.35, lerp(3.2, 1.25, u2))), hp.clone().add(v3(0, lerp(-0.3, 0, u2), 0)));
    },
  };
}

export const SHOTS_B = { S06, S07, S08, S09, S10, S11, S12, S13, S14, S15a, S15b, S16, S17, S18 };
