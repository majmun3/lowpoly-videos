// THE LAST EMBER — shot list. Times are seconds on the master timeline (see ../timeline.json).
import { THREE, v3, setPL, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, path, box, prism, xf, merge, flat, taper } from './engine.js';
import { T } from './textures.js';
import { buildKnight, updateKnight, applyPose, mixPose, addPose, walkPose, buildAshwight, ashMaterials, shamblePose, buildWyrm, poseWyrm, knightGlow } from './characters.js';
import { sky, emberHeart, setHeart, chain, burnChain, cathedral, terrain, hnoise, ruinsField, bridge, deadTrees, house, keeperSeat, summitPlatform, muralWall, archGeo } from './world.js';

// ---------------------------------------------------------------- helpers
const cam = (fov, near = 0.1, far = 7000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t, f = 1) {
  if (amt <= 0) return;
  c.position.x += (Math.sin(t * 31 * f) * 0.6 + Math.sin(t * 17.3 * f) * 0.4) * amt;
  c.position.y += (Math.sin(t * 27.1 * f + 1) * 0.6 + Math.sin(t * 13.7 * f) * 0.4) * amt;
  c.rotateZ(Math.sin(t * 19 * f) * amt * 0.05);
}
const lanternLight = (k, i = 0, power = 1.3, t = 0) => { const p = k.lantern.getWorldPosition(v3()); setPL(i, p, 0xff8a30, 4.5, power * (0.9 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23) * 0.04)); return p; };
function ash(o = {}) { return particles({ mode: 'drift', count: o.count ?? 500, box: o.box || v3(24, 16, 24), vel: o.vel || v3(0.35, -0.7, 0.15), size: o.size ?? 0.035, c0: o.c ?? 0xa09a98, origin: o.origin || v3(0, 6, 0), additive: false, opacity: o.opacity ?? 0.85, swirl: o.swirl ?? 0.6, seed: o.seed ?? 11, fogMix: 0.6 }); }
function embers(o = {}) { return particles({ mode: 'drift', count: o.count ?? 120, box: o.box || v3(16, 12, 16), vel: o.vel || v3(0.2, 0.6, 0.1), size: o.size ?? 0.03, c0: 0xffb050, origin: o.origin || v3(0, 4, 0), swirl: 1.2, seed: o.seed ?? 21, opacity: o.opacity ?? 1, fogMix: 0.3 }); }
function fire(origin, o = {}) { return particles({ mode: 'emit', count: o.count ?? 90, origin, spread: o.spread || v3(0.25, 0.08, 0.25), vel: o.vel || v3(0, 1.4, 0), life: o.life ?? 0.9, size: o.size ?? 0.16, c0: 0xffd890, c1: 0xff6a14, c2: 0x6a1004, soft: true, seed: o.seed ?? 31, swirl: 1.5, opacity: o.opacity ?? 0.9, fogMix: 0.2 }); }
function shatter(root, scene, seed, ground = 0) {
  root.updateMatrixWorld(true); const R = rng(seed), parts = [];
  root.traverse(o => { if (o.isMesh) parts.push(o); });
  const out = parts.map(m => { const p = v3(), q = new THREE.Quaternion(), s = v3(); m.matrixWorld.decompose(p, q, s); const mm = new THREE.Mesh(m.geometry, m.material); mm.position.copy(p); mm.quaternion.copy(q); mm.scale.copy(s); mm.visible = false; scene.add(mm); return { m: mm, p0: p, q0: q, s0: s, v: v3((R() - 0.5) * 1.6, R() * 1.4, (R() - 0.5) * 1.6), w: v3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(5), delay: R() * 0.25 }; });
  return { parts: out, root, ground, update(dt) { root.visible = dt < 0; for (const P of out) { P.m.visible = dt >= 0; if (dt < 0) continue; const tt = Math.max(0, dt - P.delay); P.m.position.set(P.p0.x + P.v.x * tt, Math.max(ground + 0.05, P.p0.y + P.v.y * tt - 4.9 * tt * tt), P.p0.z + P.v.z * tt); P.m.quaternion.copy(P.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(P.w.x * tt, P.w.y * tt, P.w.z * tt))); P.m.scale.copy(P.s0).multiplyScalar(Math.max(0.001, 1 - tt * 0.7)); } } };
}
function burst(origin, start, o = {}) { return particles({ mode: 'burst', count: o.count ?? 160, origin, start, spread: o.spread ?? v3(1.5, 1.5, 1.5), vel: v3(0, o.fall ?? 0.6, 0), life: o.life ?? 1.4, size: o.size ?? 0.06, c0: o.c0 ?? 0xb0aaa6, c1: o.c1 ?? 0x8a8480, c2: o.c2 ?? 0x5a5452, seed: o.seed ?? 41, additive: o.additive ?? false, opacity: o.opacity ?? 0.9, soft: o.soft ?? false }); }

// The heavens: the chained Ember Heart over the cathedral summit
function heavens(scene, summit, sun, R, link, o = {}) {
  const heart = emberHeart(R, { fogScale: o.fogScale ?? 0.1 }); heart.position.copy(sun); scene.add(heart);
  const chains = [];
  const fan = o.fan || [-0.92, -0.38, 0.38, 0.92];
  for (const f of fan) { const ch = chain(summit.clone().add(v3(f * (o.base ?? 3), 0, 0)), sun.clone().add(v3(f * R * 0.95, -R * (0.35 + (1 - Math.abs(f)) * 0.45), R * 0.2)), link, { sag: o.sag ?? 0.025, fogScale: o.chainFog ?? 0.3 }); scene.add(ch); chains.push(ch); }
  return { heart, chains };
}
const PAL = {
  ash: { horizon: 0x4e4648, top: 0x141012, bottom: 0x2a2426, cloud: 0x2a2426, cloudLit: 0x6a2a1c, sunCol: 0x4a160a },
};

// ---------------------------------------------------------------- S01  HOOK — the helm in darkness
function S01() {
  const scene = new THREE.Scene(), camera = cam(27);
  const k = buildKnight(); scene.add(k.root);
  scene.add(embers({ origin: v3(0, 1.6, 0.4), box: v3(2.4, 2, 2), vel: v3(0.05, 0.25, 0.02), size: 0.012, count: 70 }));
  return {
    scene, camera, grade: { sat: 0.85, contrast: 1.25, bloom: 0.9, bloomT: 0.45 },
    env: { fog: [2.5, 12], fogCol: 0x0c0a0a, lightDir: v3(0.3, -0.3, 1), lightCol: 0x4a1a14, ambient: 0x1a1618, rim: 0x8a3020, hfog: [0, 1, 0, 0] },
    update(lt) {
      const p = walkPose(0, { stride: 0 }); p.neck = [0.22 - smooth(range(lt, 1.6, 2.8)) * 0.3, 0, 0]; p.head = [0.1 - smooth(range(lt, 1.6, 2.8)) * 0.15, 0.05, 0];
      p.armR = [-0.15, 0, 0.12]; p.armL = [0.05, 0, -0.1];
      applyPose(k, p); updateKnight(k, lt, { wind: 0.25, swing: 0.05 });
      const pulse = 0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(lt * 2.6)), 6);
      setPL(0, v3(-0.35, 1.2, 0.6), 0xff7a28, 2.6, 2.4 * pulse);
      k.M.slit.uniforms.uEmissive.value.setRGB(1, 0.42, 0.12).multiplyScalar(0.6 + smooth(range(lt, 1.8, 2.4)) * 0.6);
      aim(camera, v3(0.42 - lt * 0.08, 1.8 - lt * 0.01, 1.95 - lt * 0.2), v3(0, 1.68, 0));
    },
  };
}

// ---------------------------------------------------------------- vista builder (S02, S03, S17)
function vista(o) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 55, 0.5);
  const k = o.dawn ?? 0;
  const sk = sky({ ...PAL.ash, sunDir: o.sun.clone().sub(o.camRef || v3(0, 0, 0)).normalize(), cover: 0.4, cloudScale: 0.3, swirl: o.swirl ?? 0 });
  scene.add(sk);
  const hn = hnoise(5), gfn = (x, z) => hn(x, z) * 5 - 3;
  scene.add(terrain(2400, 70, gfn));
  const cat = cathedral({ fogScale: 0.8 }); cat.position.copy(o.cat); scene.add(cat);
  const summit = cat.userData.summit.clone().add(o.cat);
  const H = heavens(scene, summit, o.sun, o.R, o.link ?? 17, { base: 3 });
  scene.add(ruinsField({ seed: 3, count: 260, center: [0, 0, o.cat.z + 300], rMin: 30, rMax: 900, ground: gfn, hScale: 1.3, avoid: (x, z) => (Math.abs(x) < 26 && z > o.cat.z - 120 && z < o.cat.z + 420) || (o.avoid && o.avoid(x, z)) }));
  if (o.near) scene.add(ruinsField({ seed: 9, count: 60, center: o.near.center, rMin: 14, rMax: 140, ground: gfn, hScale: 2.2, avoid: o.near.avoid }));
  const ashP = ash({ box: v3(60, 40, 60), size: 0.09, count: 600, vel: v3(1.2, -1.6, 0.4) });
  scene.add(ashP);
  return { scene, camera, sk, H, cat, ashP, summit, gfn };
}
function setDawn(V, k, lt) {
  const u = V.sk.userData.u, lerpC = (c, a, b) => c.set(a).lerp(new THREE.Color(b), k);
  lerpC(u.uHorizon.value, 0x4e4648, 0xa87452); lerpC(u.uTop.value, 0x141012, 0x3a3850); lerpC(u.uBottom.value, 0x2a2426, 0x6a5044);
  lerpC(u.uCloudCol.value, 0x2a2426, 0x6a5048); lerpC(u.uCloudLit.value, 0x6a2a1c, 0xe0a060); lerpC(u.uSunCol.value, 0x4a160a, 0xb06a30);
  setHeart(V.H.heart, k, lt);
}

// ---------------------------------------------------------------- S02  the dying Ember Heart
function S02() {
  const V = vista({ cat: v3(0, 0, -420), sun: v3(0, 1250, -1000), R: 175, fov: 62, swirl: 1 });
  return {
    ...V, grade: { sat: 0.9, contrast: 1.15, bloom: 0.9, bloomT: 0.42 },
    env: { fog: [40, 900], fogCol: 0x4e4648, hfog: [12, 40, 0.7, 0.003], lightDir: v3(0, -0.6, 0.8), lightCol: 0x5a3a32, ambient: 0x221c20 },
    update(lt) {
      setDawn(V, 0, lt);
      const crack = Math.exp(-Math.pow((lt - 0.9) * 4, 2)); // a flare, then it dims further
      V.H.heart.userData.m.uniforms.uEmissive.value.multiplyScalar(1 + crack * 0.9 - smooth(range(lt, 1.2, 2.2)) * 0.25);
      V.H.heart.userData.h2.material.opacity *= 1 + crack;
      aim(V.camera, v3(40 - lt * 4, 60 + lt * 2, 160 - lt * 10), v3(0, 700 - lt * 40, -720));
    },
  };
}
// ---------------------------------------------------------------- S03  the dying kingdom (glide over ruins)
function S03() {
  const V = vista({ cat: v3(0, 0, -520), sun: v3(0, 1000, -1500), R: 170, fov: 58, near: { center: [0, 0, 120], avoid: (x, z) => Math.abs(x) < 14 } });
  return {
    ...V, grade: { sat: 0.85, contrast: 1.15, bloom: 0.8, bloomT: 0.45 },
    env: { fog: [20, 1000], fogCol: 0x524a4c, hfog: [10, 30, 0.75, 0.004], lightDir: v3(0, -0.5, 1), lightCol: 0x6a4a40, ambient: 0x262024 },
    update(lt) {
      setDawn(V, 0, lt);
      const f = lt / 4.3;
      aim(V.camera, v3(6 - f * 10, 30 - f * 6, 260 - f * 120), v3(0, 170 - f * 20, -520));
      V.camera.rotateZ(-0.03 + f * 0.05);
    },
  };
}

// ---------------------------------------------------------------- S04  the village of ash statues
function S04() {
  const scene = new THREE.Scene(), camera = cam(50);
  scene.add(sky({ ...PAL.ash, horizon: 0x4a4442, sunDir: v3(0, 0.4, -1), cover: 0.45 }));
  const hn = hnoise(12), gfn = (x, z) => hn(x * 3, z * 3) * 0.15;
  scene.add(terrain(300, 60, gfn));
  const wallM = mat({ map: T('plaster'), color: 0xa09890 }), roofM = mat({ map: T('roof'), color: 0x8a807a }), beamM = mat({ map: T('wood'), color: 0x6a5a50 });
  const R = rng(4), walls = [], roofs = [], beams = [];
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, z = 10 - Math.floor(i / 2) * 9 - R() * 2, x = side * (7 + R() * 2);
    const h = house(100 + i, null); const r = [0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0];
    walls.push(xf(h.walls, { p: [x, 0, z], r })); roofs.push(xf(h.roof, { p: [x, 0, z], r })); beams.push(xf(h.beams, { p: [x, 0, z], r }));
  }
  mesh(merge(walls), wallM, scene); mesh(merge(roofs), roofM, scene); mesh(merge(beams), beamM, scene);
  // a lit window (last embers of a hearth)
  mesh(box(0.05, 1.0, 0.8), mat({ color: 0x000000, emissive: 0xff6a20, unlit: true }), scene, [-4.45, 1.6, -7]);
  const stoneM = mat({ map: T('ashskin'), color: 0x9a9694, rim: 1 }), AM = ashMaterials();
  const mkStatue = (p, ry, pose, hood) => { const s = buildAshwight({ stone: true, stoneMat: stoneM, hood, M: AM }); s.root.position.set(...p); s.root.rotation.y = ry; applyPose(s, pose); scene.add(s.root); return s; };
  // the one who crumbles: kneeling, reaching to the dimming sky
  const kneel = { hipY: 0.52, thighL: [-1.4, 0, -0.1], shinL: [1.9, 0, 0], thighR: [-0.2, 0, 0.1], shinR: [1.9, 0, 0], footR: [-0.4, 0, 0], spine: [-0.15, 0, 0], chest: [-0.1, 0, 0], neck: [-0.4, 0, 0], head: [-0.3, 0, 0], armL: [-2.6, 0, -0.25], foreL: [-0.2, 0, 0], armR: [-2.4, 0, 0.3], foreR: [-0.3, 0, 0] };
  const kn = mkStatue([0.6, 0, -6], 0.3, kneel, true);
  // a parent shielding a child
  mkStatue([-3.2, 0, -10], 0.6, { spine: [0.35, 0, 0], chest: [0.2, 0, 0], neck: [0.4, 0, 0], armL: [-1.2, 0.3, -0.2], foreL: [-1.4, 0, 0], armR: [-1.1, -0.3, 0.2], foreR: [-1.4, 0, 0] }, true);
  const child = mkStatue([-2.9, 0, -9.4], 0.6 + Math.PI, { neck: [-0.3, 0, 0], armL: [-1.5, 0, -0.3], armR: [-1.5, 0, 0.3] }, false); child.root.scale.setScalar(0.55);
  mkStatue([3.6, 0, -13], -0.4, { hipY: 0.45, thighL: [-1.5, 0, -0.2], shinL: [1.4, 0, 0], thighR: [-1.5, 0, 0.2], shinR: [1.4, 0, 0], spine: [0.4, 0, 0], neck: [0.6, 0, 0], armL: [-0.6, 0, 0], foreL: [-1.5, 0, 0], armR: [-0.6, 0, 0], foreR: [-1.5, 0, 0] }, true);
  mkStatue([-1.5, 0, -18], 0.1, { armR: [-0.4, 0, 0.1], neck: [0.2, 0, 0] }, true);
  const sh = shatter(kn.root, scene, 9, 0);
  scene.add(burst(v3(0.6, 1.0, -6), 1.5, { count: 420, spread: v3(1.2, 1.5, 1.2), life: 1.8, size: 0.022, fall: 0.35, c0: 0x9a9490, c1: 0x7a7470, c2: 0x5a5452 }));
  scene.add(ash({ box: v3(30, 16, 30), count: 900, size: 0.035, vel: v3(0.4, -0.8, 0.2), origin: v3(0, 6, -6) }));
  return {
    scene, camera, grade: { sat: 0.7, contrast: 1.15, bloom: 0.6 },
    env: { fog: [3, 42], fogCol: 0x4a4442, hfog: [0.5, 3, 0.5, 0.05], lightDir: v3(0.3, -0.6, -0.6), lightCol: 0x6a605a, ambient: 0x2a2628, rim: 0x5a4a48 },
    update(lt) {
      sh.update(lt - 1.5);
      setPL(0, v3(-4.2, 1.6, -7), 0xff6a20, 5, 1.1);
      aim(camera, v3(0.2 - lt * 0.1, 1.4 - lt * 0.05, 1.5 - lt * 0.8), v3(0.4, 1.3, -7));
    },
  };
}

// ---------------------------------------------------------------- bridge of Odran builder (S05, S05b, S08–S10, S15a)
function bridgeEnv(o = {}) {
  const scene = new THREE.Scene(), camera = cam(o.fov ?? 50, 0.1);
  const sk = sky({ ...PAL.ash, horizon: 0x4c4446, sunDir: v3(0, 0.45, -1), cover: 0.42 }); scene.add(sk);
  const br = bridge({ len: 280 }); scene.add(br);
  // Ember Warden statues along the parapets (remnants of a forgotten order)
  const stoneM = mat({ map: T('stone'), color: 0x8a8480, rim: 1 }), AM = ashMaterials();
  for (let z = -120; z <= 120; z += 20) for (const sx of [-1, 1]) {
    if (o.clear && Math.abs(z) <= o.clear) continue;
    const s = buildAshwight({ stone: true, stoneMat: stoneM, hood: true, M: AM });
    s.root.scale.setScalar(1.7); s.root.position.set(sx * 4.4, 1.0, z); s.root.rotation.y = -sx * Math.PI / 2;
    applyPose(s, { armL: [-2.9, 0, -0.2], foreL: [-0.5, 0, 0], armR: [-2.9, 0, 0.2], foreR: [-0.5, 0, 0], neck: [0.2, 0, 0] });
    mesh(prism(6, 0.25, 0.4, 0.2), stoneM, s.handL, [0.09, -0.12, 0]);
    mesh(box(1.4, 1.0, 1.4, 'bottom'), stoneM, scene, [sx * 4.4, 0, z]);
    scene.add(s.root);
  }
  // far shore: the cathedral and the chained heart along the bridge axis
  const cat = cathedral({ fogScale: 0.55 }); cat.position.set(0, -30, -900); cat.scale.setScalar(1.4); scene.add(cat);
  const summit = cat.userData.summit.clone().multiplyScalar(1.4).add(cat.position);
  const H = heavens(scene, summit, v3(0, 1150, -1900), 190, 20, { fogScale: 0.08, chainFog: 0.25 });
  const hn = hnoise(8);
  scene.add(ruinsField({ seed: 21, count: 80, center: [0, -40, -500], rMin: 150, rMax: 700, ground: () => -60, hScale: 3 }));
  scene.add(ash({ box: v3(30, 18, 30), count: 700, size: 0.035, vel: v3(1.6, -0.6, 0.3), swirl: 1.0 }));
  return { scene, camera, sk, br, H, cat };
}
const BRIDGE_ENV = { fog: [6, 170], fogCol: 0x4c4446, hfog: [-4, 30, 1.0, 0.02], lightDir: v3(0.35, -0.5, -0.75), lightCol: 0x9a8a80, ambient: 0x343034, rim: 0x8a4a3a, fillDir: v3(-0.3, -0.3, 0.9), fillCol: 0x2a2426 };

// ---------------------------------------------------------------- S05  the wanderer crosses the bridge
function S05() {
  const B = bridgeEnv({ fov: 46 });
  const k = buildKnight(); B.scene.add(k.root);
  return {
    ...B, grade: { sat: 0.8, contrast: 1.15, bloom: 0.7 }, env: BRIDGE_ENV,
    update(lt) {
      setHeart(B.H.heart, 0, lt);
      const z = -6 + lt * 1.25; k.root.position.set(0.3, 0, z);
      const p = walkPose(lt * 0.85, { stride: 0.42, hunch: 0.12 }); p.armR = [-0.2 + Math.sin(lt * 0.85 * 6.283) * 0.08, 0, 0.15]; p.foreR = [-0.15, 0, 0];
      applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.9, swing: 0.3, back: 0.3, side: 0.25 });
      lanternLight(k, 0, 1.2, lt);
      aim(B.camera, v3(1.6 - lt * 0.25, 0.55, z + 4.2 - lt * 0.15), v3(0.2, 1.45, z - 1.5));
    },
  };
}
// ---------------------------------------------------------------- S05b  lantern & sigil close-up
function S05b() {
  const B = bridgeEnv({ fov: 34 });
  const k = buildKnight(); B.scene.add(k.root);
  return {
    ...B, grade: { sat: 0.85, contrast: 1.2, bloom: 0.9, bloomT: 0.45 }, env: { ...BRIDGE_ENV, fog: [2, 120] },
    update(lt) {
      setHeart(B.H.heart, 0, lt);
      const z = 1 + lt * 1.2; k.root.position.set(0.3, 0, z);
      const p = walkPose(lt * 0.85 + 0.4, { stride: 0.42, hunch: 0.12 }); p.armR = [-0.2, 0, 0.15];
      applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
      updateKnight(k, lt, { wind: 0.9, swing: 0.45, back: 0.3, side: 0.25 });
      lanternLight(k, 0, 1.5, lt);
      const tgt = k.lantern.getWorldPosition(v3()).lerp(v3(0.3, 1.0, z + 0.1), 0.45);
      aim(B.camera, v3(-1.25 + lt * 0.05, 0.9 + lt * 0.06, z + 1.55), tgt);
    },
  };
}

export const SHOTS_A = { S01, S02, S03, S04, S05, S05b };
export { cam, aim, shake, lanternLight, ash, embers, fire, shatter, burst, heavens, vista, setDawn, bridgeEnv, BRIDGE_ENV, PAL };
