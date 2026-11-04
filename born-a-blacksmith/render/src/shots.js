// BEING BORN AS A BLACKSMITH IN MEDIEVAL TIMES WAS HORRIFYING — 26 shots, childhood to old age.
import { THREE, v3, setPL, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, flat } from '/the-last-ember/render/src/engine.js';
import { applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { buildHuman } from '/born-as-a-vampire/render/src/vampire.js';
import { buildKnightNPC, knightMaterials } from '/born-as-a-goblin/render/src/goblin.js';
import { buildSmith, buildHammer, strikePoses, standToStrike, hammering, strikePose, contactTimes, sparks, hotBar, setHeat, buildTongs, setTongs, setFace, setGrip, setJiggle, jigKick, jigWalk, buildBaby, crying, smithMaterials, TS } from './smith.js';
import { village, ENV, setFire, setBellows, bucket, horseshoe, homeInterior, HOME_ENV, materials } from './forge.js';

const cam = (fov, near = 0.03, far = 3000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
const PL = (i, p, c, r, k) => setPL(i, p, c, r, k * 0.5);
const wpos = (o, x, y, z) => { let top = o; while (top.parent) top = top.parent; top.updateMatrixWorld(true); return o.localToWorld(v3(x, y, z)); };
const faceTo = (j, p) => { j.root.rotation.y = Math.atan2(p.x - j.root.position.x, p.z - j.root.position.z); };
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }

// ---------------------------------------------------------------- cast
const HAIR = 0x6a4428, BEARD = 0x5a3a22;
const hero = (age, o = {}) => buildSmith({ age, hair: HAIR, beard: BEARD, seed: 2101, ...o });
const father = () => buildSmith({ age: 'adult', hair: 0x2e2218, beard: 0x241a12, bulk: 1.18, skin: 0xd09878, seed: 2201 });
const STAND = { hipY: 0.95, armL: [0.05, 0, -0.1], armR: [0.05, 0, 0.1], foreL: [-0.2, 0, 0], foreR: [-0.2, 0, 0], neck: [0.02, 0, 0] };
const st = (j) => ({ ...STAND, hipY: STAND.hipY * j.k });

// the smithy cast: the village (with the smithy at the origin), an anvil work point, a hot bar, tongs and sparks
function smithyCast(o = {}) {
  const V = village({ night: o.night }); const S = V.smithy.userData; const anv = S.anvil; anv.rotation.y = Math.PI;
  const top = S.anvil.position.clone().add(S.anvil.userData.top);
  const bar = hotBar(0.36); bar.position.copy(top).add(v3(0.04, 0.014, 0)); bar.rotation.y = Math.PI / 2; V.scene.add(bar);
  const target = top.clone().add(v3(-0.03, 0.03, 0)); const tongs = buildTongs(); V.scene.add(tongs);
  const sp = sparks({ origin: target.clone(), vel: o.sparkVel || v3(0, 1.8, 0.4) }); V.scene.add(sp);
  return { ...V, S, top, bar, target, tongs, sp };
}
// place a smith at the anvil and remember his poses
function atAnvil(E, j, o = {}) { const P = strikePoses({ k: j.k, lean: o.lean ?? 0.25 }); standToStrike(j, P, E.target, Math.PI + (o.yaw ?? 0)); j.P = P; E.scene.add(j.root); return P; }
function forgeWork(E, j, t, o = {}) {
  const r = hammering(j, j.P, t, o); E.sp.material.uniforms.uStart.value = r.last; j.root.updateMatrixWorld(true);
  setTongs(E.tongs, j.handL.localToWorld(v3(0.02 * j.k, -0.12 * j.k, 0.02)), E.bar.localToWorld(v3(0, 0, 0.17)));
  PL(2, E.target.clone().add(v3(0, 0.25, 0.2)), 0xffa040, 1.6, 0.6 + pulse(t - r.last, 0.03, 0.06) * 4);
  return r;
}
function forgeLights(E, t, k = 1, flare = 0) { const f = setFire(E.smithy, k, t, flare); PL(0, E.S.firePos.clone().add(v3(0.4, 0.6, 1.0)), 0xff8a38, 7, f * 1.3); PL(1, v3(1.0, 2.4, -1.0), 0xffc070, 4, 0.5 * k); }
const FORGE_G = { sat: 1.0, contrast: 1.06, bloom: 0.32, bloomT: 0.76 };

// ---------------------------------------------------------------- 1 — BORN INTO THE FIRE
function B01() { // the hook: a blow lands, sparks fly at the lens
  const E = smithyCast({ sparkVel: v3(0.2, 1.5, -1.7) }); const camera = cam(44); const f = father(); atAnvil(E, f);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 1); forgeWork(E, f, lt, { t0: -0.42, period: 1.0 }); setFace(f, { squint: 0.4, brow: -0.6 });
      aim(camera, E.target.clone().add(v3(0.42, 0.1, -0.95 + lt * 0.05)), E.target.clone().add(v3(-0.05, 0.38, 0.45))); } };
}
function B02() { // a medieval village on a cold morning; the smithy glows beside the family home
  const E = smithyCast(); const camera = cam(48); const f = father(); atAnvil(E, f);
  return { scene: E.scene, camera, grade: { sat: 0.95, contrast: 1.05, bloom: 0.3, bloomT: 0.78 }, env: ENV.morning,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 1); forgeWork(E, f, lt + 3, { t0: 0, period: 1.0 });
      const u = ease(range(lt, 0, 1.8)); aim(camera, v3(lerp(-12, -6.5, u), lerp(7.0, 3.4, u), lerp(11.5, 9.6, u)), v3(lerp(5.5, 3.5, u), lerp(2.8, 1.7, u), lerp(-2.5, -1.6, u))); } };
}
function B03() { // inside the house, the newborn cries
  const E = homeInterior(); const camera = cam(42); E.cradle.children.forEach(m => { if (m.position && Math.abs(m.position.z + 0.55) < 0.01) m.visible = false; }); const b = buildBaby(); b.root.position.set(0, 0.27, 0.02); b.root.rotation.y = Math.PI; E.cradle.add(b.root);
  const mom = buildHuman({ seed: 3, female: true, cloth: 0x5a3a4a }); mom.root.position.set(0.55, 0, -0.75); faceTo(mom, v3(0.2, 0, 0.2)); E.scene.add(mom.root);
  return { scene: E.scene, camera, grade: { sat: 1, contrast: 1.06, bloom: 0.32, bloomT: 0.76 }, env: HOME_ENV,
    update(lt) { crying(b, lt); E.cradle.rotation.z = Math.sin(lt * 2.4) * 0.06; applyPose(mom, { hipY: 0.95, spine: [0.4, 0, 0], neck: [0.3, 0, 0], armR: [-0.8, 0, 0.1], foreR: [-0.6, 0, 0], armL: [-0.5, 0, -0.1], foreL: [-0.9, 0, 0] });
      PL(0, E.fireOrigin.clone().add(v3(0, 0.6, 0.6)), 0xff9a40, 7, 1.4); PL(1, v3(2.6, 1.6, -0.8), 0xfff0d0, 6, 1.0);
      const fc = wpos(b.head, 0, 0, 0); aim(camera, fc.clone().add(v3(0.14, 0.2 - lt * 0.02, -0.4 + lt * 0.03)), fc.clone().add(v3(0, -0.01, 0.05))); } };
}
function B04() { // the father strikes glowing iron with an enormous hammer
  const E = smithyCast({ sparkVel: v3(0.6, 1.8, 1.0) }); const camera = cam(40); const f = father(); atAnvil(E, f);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 1); forgeWork(E, f, lt, { t0: -0.2, period: 0.95 }); setFace(f, { squint: 0.35, brow: -0.5 });
      const p = f.root.position; aim(camera, p.clone().add(v3(2.2 - lt * 0.12, 0.65, -0.75)), p.clone().add(v3(0, 1.0, -0.45))); } };
}

// ---------------------------------------------------------------- 2 — CHILDHOOD
function B05() { // age seven: hauling a heavy coal bucket
  const E = smithyCast(); const camera = cam(44); const c = hero('child', { hammer: false }); E.scene.add(c.root); const bk = bucket(E.S.M); E.scene.add(bk);
  const f = father(); atAnvil(E, f);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 0.8); forgeWork(E, f, lt + 7, { t0: 0, period: 1.1 });
      const a = v3(-3.6, 0, -1.4), b = v3(-2.2, 0, -3.7); const u = clamp(lt / 2.6) * 0.95; const p = a.clone().lerp(b, u); c.root.position.copy(p); faceTo(c, b); const ph = lt * 1.2;
      const w = walkPose(ph, { stride: 0.22, hunch: -0.15, hip: c.hipH }); applyPose(c, { ...w, spine: [-0.16, Math.sin(ph * 6.28) * 0.08, Math.sin(ph * 6.28) * 0.1], armL: [-0.35, 0, -0.32], armR: [-0.35, 0, 0.32], foreL: [-0.55, 0, 0], foreR: [-0.55, 0, 0], neck: [0.2, 0, 0], head: [0.1, 0, Math.sin(ph * 3.14) * 0.1] });
      setGrip(c, 'L', 1); setGrip(c, 'R', 1); setFace(c, { squint: 0.6, brow: -0.8, open: 0.3 }); setJiggle(c, jigWalk(ph, 1.1));
      c.root.updateMatrixWorld(true); const hl = c.handL.localToWorld(v3(0, -0.1, 0)), hr = c.handR.localToWorld(v3(0, -0.1, 0)); bk.position.copy(hl.clone().lerp(hr, 0.5)).add(v3(0, -0.34, 0)); bk.rotation.y = c.root.rotation.y + Math.PI / 2; bk.rotation.z = Math.sin(ph * 6.28) * 0.08;
      aim(camera, p.clone().add(v3(1.8, 1.1, 1.6)), p.clone().add(v3(0, 0.55, 0))); } };
}
function B06() { // his father points to the furnace
  const E = smithyCast(); const camera = cam(42); const f = father(); f.root.position.set(-0.6, 0, -1.6); faceTo(f, v3(-2.5, 0, -5.1)); E.scene.add(f.root);
  const c = hero('child', { hammer: false }); c.root.position.set(-1.4, 0, -1.0); faceTo(c, v3(-0.6, 0, -1.6)); E.scene.add(c.root);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt, 0.7); setHeat(E.bar, 0.6); const k = smooth(range(lt, 0.2, 0.6)); f.root.rotation.y = lerp(Math.atan2(-0.8, 0.6), Math.atan2(-1.9, -3.5), k);
      applyPose(f, { ...st(f), armR: [-1.5 * k, 0, 0.15 + 0.2 * k], foreR: [-0.1, 0, 0], neck: [0.05, 0.2 * k, 0] }); setGrip(f, 'R', 0.3); setJiggle(f, {}); setFace(f, { brow: -0.7 });
      const look = smooth(range(lt, 0.7, 1.2)); applyPose(c, { ...st(c), neck: [-0.25, -0.5 * look, 0], head: [-0.1, -0.2 * look, 0] }); setJiggle(c, {}); setFace(c, { brow: 0.4 });
      aim(camera, v3(-0.4, 1.3, 1.2), v3(-1.6, 1.1, -2.6)); } };
}
function B07() { // he works the bellows; the fire roars; sweat runs down his face
  const E = smithyCast(); const camera = cam(40); const c = hero('child', { hammer: false }); E.scene.add(c.root); const bl = E.S.bellows;
  const sweat = particles({ mode: 'emit', count: 40, origin: v3(), spread: v3(0.04, 0.02, 0.01), vel: v3(0, -0.25, 0), life: 1.0, size: 0.008, c0: 0xe8f4ff, c1: 0xb8d0e0, seed: 77, opacity: 0.9, fogMix: 0 }); E.scene.add(sweat);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { const pump = 0.5 + 0.5 * Math.sin(lt * 4.2); setBellows(bl, pump); const flare = Math.max(0, -Math.cos(lt * 4.2)) * 0.8; forgeLights(E, lt, 1, flare);
      bl.updateMatrixWorld(true); const lever = bl.userData.hinge.localToWorld(v3(-bl.userData.L - 0.9, 0.03, 0)); c.root.position.set(lever.x - 0.35, 0, lever.z + 0.1); c.root.rotation.y = Math.PI / 2;
      const down = 1 - pump; applyPose(c, { ...st(c), armL: [-1.9 + down * 0.8, 0.1, -0.15], armR: [-1.9 + down * 0.8, -0.1, 0.15], foreL: [-0.4, 0, 0], foreR: [-0.4, 0, 0], spine: [0.15 + down * 0.25, 0, 0], neck: [-0.1, 0.3, 0], thighL: [-0.3 - down * 0.2, 0, 0], shinL: [0.3 + down * 0.3, 0, 0], thighR: [0.2, 0, 0], shinR: [0.1 + down * 0.2, 0, 0], hipY: c.hipH * (0.98 - down * 0.04) });
      setGrip(c, 'L', 1); setGrip(c, 'R', 1); setFace(c, { squint: 0.7, brow: -0.6, open: 0.25 }); setJiggle(c, { bounce: Math.sin(lt * 4.2 + 1) * 0.6, sway: Math.sin(lt * 4.2 + 2) * 0.2 });
      c.root.updateMatrixWorld(true); const fh = c.face.localToWorld(v3(0.06, 0.16, 0.08)); sweat.material.uniforms.uOrigin.value.copy(fh);
      const hd = c.face.localToWorld(v3(0, 0.1, 0)); aim(camera, hd.clone().add(v3(0.85, 0.12, 0.95 - lt * 0.1)), hd.clone().add(v3(-0.35, -0.12, -0.25))); } };
}

// ---------------------------------------------------------------- 3 — THE APPRENTICE
function B08() { // age twelve: his father demonstrates the blow
  const E = smithyCast(); const camera = cam(44); const f = father(); atAnvil(E, f); const y = hero('youth', { hammer: true }); E.scene.add(y.root);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 1); forgeWork(E, f, lt, { t0: 0.1, period: 1.1 }); setFace(f, { squint: 0.3, brow: -0.4 });
      const p = f.root.position; y.root.position.set(p.x + 0.95, 0, p.z - 0.35); faceTo(y, E.target); applyPose(y, { ...st(y), armR: [-0.2, 0, 0.12], foreR: [-0.5, 0, 0], neck: [0.25, 0, 0] }); setGrip(y, 'R', 1); setJiggle(y, {}); setFace(y, { brow: 0.2 });
      aim(camera, p.clone().add(v3(2.3, 1.05, -1.5 + lt * 0.1)), p.clone().add(v3(0.4, 0.95, 0.0))); } };
}
function B09() { // he tries the same movement
  const E = smithyCast(); const camera = cam(44); const y = hero('youth', { hammer: true }); atAnvil(E, y, { lean: 0.3 }); const f = father(); E.scene.add(f.root);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 0.95); forgeWork(E, y, lt, { t0: 0.05, period: 1.25, n: 1, jig: 1.1 }); setFace(y, { squint: 0.5, brow: -0.7, open: 0.15 });
      const p = y.root.position; f.root.position.set(p.x + 1.1, 0, p.z + 0.7); faceTo(f, E.target); applyPose(f, { ...st(f), armL: [-0.25, 0, -0.5], foreL: [-1.6, 0, 0], armR: [-0.25, 0, 0.5], foreR: [-1.6, 0, 0], neck: [0.25, 0, 0] }); setJiggle(f, {}); setFace(f, { brow: -0.6 });
      aim(camera, p.clone().add(v3(2.0, 0.85, -0.95)), p.clone().add(v3(-0.05, 0.75, -0.35))); } };
}
function B10() { // ...and misses: the hammer strikes the anvil, the bar jumps
  const E = smithyCast({ sparkVel: v3(0.8, 2.2, 0.6) }); const camera = cam(36); const y = hero('youth', { hammer: true }); const P = strikePoses({ k: y.k, lean: 0.3 });
  standToStrike(y, P, E.target.clone().add(v3(0, 0, 0.11)), Math.PI); y.P = P; E.scene.add(y.root);   // aim 11 cm off the bar
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 0.9); const r = forgeWork(E, y, lt, { t0: -0.25, period: 1.2, n: 1, jig: 1.2 }); E.sp.material.uniforms.uOrigin.value.copy(E.target).add(v3(0, -0.02, 0.11));
      const j = Math.max(0, lt - r.last); E.bar.position.copy(E.top).add(v3(0.04, 0.014 + (lt > r.last ? Math.sin(Math.min(j, 0.3) / 0.3 * Math.PI) * 0.05 : 0), 0)); E.bar.rotation.set(0, Math.PI / 2 + (lt > r.last ? Math.sin(j * 30) * 0.2 * Math.exp(-j * 6) : 0), 0);
      const wince = smooth(range(lt, r.last + 0.05, r.last + 0.25)); setFace(y, { squint: 0.5 + wince * 0.5, brow: -0.8, open: wince * 0.6 }); if (lt > r.last + 0.6) { applyPose(y, { ...y.P.REST, armR: [-0.4, 0, 0.3], foreR: [-1.2 + Math.sin(lt * 18) * 0.3, 0, 0], handR: [Math.sin(lt * 18) * 0.4, 0, 0] }); }
      aim(camera, E.target.clone().add(v3(0.55, 0.26, -0.62)), E.target.clone().add(v3(0, 0.06, 0.08))); } };
}

// ---------------------------------------------------------------- 4 — THE DANGERS (now a grown man)
function burnCast() {
  const E = smithyCast(); const h = hero('adult', { gloveL: true }); E.scene.add(h.root); h.root.position.set(-1.7, 0, -3.7); h.root.rotation.y = Math.PI + 0.55;
  const piece = hotBar(0.3); piece.position.set(-1.6, 0.93, -4.45); piece.rotation.y = 0.4; E.scene.add(piece);
  const smk = particles({ mode: 'emit', count: 50, origin: v3(), spread: v3(0.03, 0.02, 0.03), vel: v3(0, 0.5, 0), life: 1.6, size: 0.06, c0: 0x8a8580, c1: 0x5a5550, soft: true, additive: false, opacity: 0, seed: 81 }); E.scene.add(smk);
  const scorch = mesh(new THREE.CircleGeometry(0.03, 8), mat({ color: 0x1a0e08, emissive: 0x300800 }), h.handL, [0.024, -0.06, 0.0], [0, Math.PI / 2, 0]); scorch.visible = false;
  const ember = glow(0xff5010, 0.06, 0); h.handL.add(ember); ember.position.set(0.03, -0.06, 0);
  return { ...E, h, piece, smk, scorch, ember };
}
function B11() { // one careless touch — he jerks his hand back
  const E = burnCast(); const camera = cam(40); const T0 = 1.05;
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.piece, 1); const reach = smooth(range(lt, 0.2, T0)), jerk = easeOut(range(lt, T0, T0 + 0.18));
      applyPose(E.h, { ...st(E.h), spine: [0.35 * reach, 0.1, 0], armL: [lerp(0, -1.1, reach) + jerk * 0.9, 0.1, -0.15 - jerk * 0.4], foreL: [-0.3 - jerk * 1.6, 0, 0], armR: [-0.2, 0, 0.12], neck: [0.3 * reach, 0, 0], thighR: [-0.2 * reach, 0, 0] }); setGrip(E.h, 'L', 0.15 + jerk * 0.6); setGrip(E.h, 'R', 1);
      setFace(E.h, { squint: 0.2 + jerk * 0.8, brow: -0.3 - jerk * 0.7, open: jerk * 0.7 }); setJiggle(E.h, { bounce: jigKick(lt, T0 + 0.05, 1.2, 3.6, 3), sway: jigKick(lt, T0 + 0.08, 0.6, 2.6, 2.6) });
      E.smk.material.uniforms.uOpacity.value = lt > T0 ? 0.7 : 0; E.h.root.updateMatrixWorld(true); E.smk.material.uniforms.uOrigin.value.copy(E.h.handL.localToWorld(v3(0.03, -0.06, 0))); E.scorch.visible = lt > T0;
      const p = E.h.root.position; aim(camera, p.clone().add(v3(1.3, 1.3, 0.25)), p.clone().add(v3(0.05, 0.95, -0.55))); } };
}
function B12() { // close-up: the scorched leather glove, the glowing iron
  const E = burnCast(); const camera = cam(34);
  return { scene: E.scene, camera, grade: { ...FORGE_G, bloom: 0.38 }, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.piece, 1); applyPose(E.h, { ...st(E.h), armL: [-0.95, 0.4, -0.2], foreL: [-1.5, 0, 0], handL: [0, 0, 0.4 + Math.sin(lt * 2) * 0.1], neck: [0.5, 0, 0] }); setGrip(E.h, 'L', 0.35 + Math.sin(lt * 9) * 0.05); setJiggle(E.h, {});
      E.scorch.visible = true; E.ember.material.opacity = 0.7 + Math.sin(lt * 20) * 0.2; E.smk.material.uniforms.uOpacity.value = 0.7; E.h.root.updateMatrixWorld(true); const hp = E.h.handL.localToWorld(v3(0.0, -0.06, 0)); E.smk.material.uniforms.uOrigin.value.copy(hp);
      aim(camera, E.h.root.localToWorld(v3(-0.25, 1.55, 1.0)), hp.clone().add(v3(0, 0, 0))); PL(3, hp.clone().add(v3(0.1, 0.1, 0.1)), 0xffa060, 1.2, 0.8); } };
}
function B13() { // he wraps the injured hand in linen
  const E = burnCast(); const camera = cam(38); const h = E.h; h.root.position.set(-0.9, 0, -0.9); h.root.rotation.y = 0.9;
  const stool = group(E.scene, [-0.9, 0, -0.9]); for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [0, 0.18]]) mesh(box(0.05, 0.45, 0.05, 'bottom'), E.S.M.beam, stool, [x, 0, z]); mesh(prism(10, 0.24, 0.24, 0.06), E.S.M.wood, stool, [0, 0.45, 0]);
  const M = smithMaterials(); const wraps = []; for (let i = 0; i < 6; i++) { const r = mesh(prism(8, 0.055, 0.055, 0.022, 'center', true), M.bandage, h.handL, [0, -0.02 - i * 0.017, 0], [0, 0, 0.12 * (i % 2 ? 1 : -1)]); r.scale.set(0.8, 1, 1.15); r.visible = false; wraps.push(r); }
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt, 0.85); setHeat(E.piece, 0.7); E.scorch.visible = true; const SIT = { hipY: 0.5, thighL: [-1.45, 0, -0.12], shinL: [1.4, 0, 0], thighR: [-1.45, 0, 0.12], shinR: [1.4, 0, 0], spine: [0.38, 0, 0], neck: [0.35, 0, 0] };
      const wr = lt * 3.2; applyPose(h, { ...SIT, armL: [-0.75, 0.35, -0.05], foreL: [-1.25, 0.2, 0], armR: [-0.85 + Math.sin(wr) * 0.12, -0.4, 0.15], foreR: [-1.3 + Math.cos(wr) * 0.2, 0, 0], handR: [Math.sin(wr) * 0.4, 0, Math.cos(wr) * 0.3] }); setGrip(h, 'L', 0.3); setGrip(h, 'R', 0.7);
      const n = Math.floor(range(lt, 0.2, 2.8) * 6.99); wraps.forEach((w, i) => w.visible = i < n); setFace(h, { squint: 0.55, brow: -0.6, open: 0.08 + Math.max(0, Math.sin(lt * 5)) * 0.1 }); setJiggle(h, { bounce: -0.2 });
      const hp = wpos(h.handL, 0, -0.05, 0); aim(camera, hp.clone().add(v3(0.95, 0.45, 0.65 - lt * 0.08)), hp.clone().add(v3(-0.1, 0.12, -0.1))); } };
}

// ---------------------------------------------------------------- 5 — THE WORK NEVER ENDS
function busyCast() {
  const E = smithyCast({ sparkVel: v3(0.5, 1.8, 0.8) }); const h = hero('adult', { gloveL: true }); atAnvil(E, h);
  const farmer = buildHuman({ seed: 12, cloth: 0x6a5a3a, beard: true }); farmer.root.position.set(-1.0, 0, 2.9); farmer.root.rotation.y = Math.PI + 0.2; E.scene.add(farmer.root);
  const hat = mesh(prism(10, 0.2, 0.17, 0.03), mat({ color: 0xd8c080, rim: 0.6 }), farmer.head, [0, 0.21, 0]); mesh(prism(10, 0.1, 0.09, 0.07), mat({ color: 0xd8c080, rim: 0.6 }), farmer.head, [0, 0.23, 0]);
  const shoe = horseshoe(E.S.M, 0.6); farmer.handR.add(shoe); shoe.position.set(0, -0.1, 0.05); shoe.scale.setScalar(1.3);
  const KM = knightMaterials(); const sol = buildKnightNPC(KM, {}); sol.root.position.set(0.4, 0, 3.2); sol.root.rotation.y = Math.PI - 0.15; E.scene.add(sol.root); if (sol.sword) sol.sword.scale.set(1, 1, 0.45);
  const wom = buildHuman({ seed: 14, female: true, cloth: 0x3a4a6a }); wom.root.position.set(1.7, 0, 3.0); wom.root.rotation.y = Math.PI - 0.4; E.scene.add(wom.root);
  const sick = group(wom.handR, [0, -0.08, 0.04]); mesh(box(0.02, 0.02, 0.25), E.S.M.wood, sick); const bl = new THREE.TorusGeometry(0.1, 0.008, 3, 10, Math.PI * 1.1); mesh(bl, E.S.M.iron, sick, [0, 0.08, 0.14], [0, Math.PI / 2, 0]);
  return { ...E, h, farmer, sol, wom };
}
function waiting(E, lt) { applyPose(E.farmer, { hipY: 0.95, armR: [-0.7, 0, 0.1], foreR: [-0.9, 0, 0], armL: [0.1, 0, -0.1], neck: [0.1, 0, 0] }); applyPose(E.wom, { hipY: 0.95, armR: [-0.3, 0, 0.1], foreR: [-0.6, 0, 0], armL: [-0.6, 0, -0.2], foreL: [-1.3, 0, 0] }); applyPose(E.sol, { hipY: 0.98, armL: [-0.2, 0, -0.15], armR: [-0.3 + Math.sin(lt * 2) * 0.05, 0, 0.15], foreR: [-0.4, 0, 0] }); }
function B14() { // the busy forge: customers queue at the open front
  const E = busyCast(); const camera = cam(48);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 1); forgeWork(E, E.h, lt, { t0: 0.0, period: 0.9 }); setFace(E.h, { squint: 0.4, brow: -0.5 }); waiting(E, lt);
      const u = ease(range(lt, 0, 2.4)); aim(camera, v3(lerp(2.8, 2.2, u), 2.3, lerp(6.4, 5.4, u)), v3(0.0, 1.0, -1.2)); } };
}
function B15() { // blow after blow — sparks on every contact, the body reacting each time
  const E = busyCast(); const camera = cam(40);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 1 - lt * 0.08); forgeWork(E, E.h, lt, { t0: -0.3, period: 0.82 }); setFace(E.h, { squint: 0.45, brow: -0.6, open: 0.05 }); waiting(E, lt);
      const p = E.h.root.position; aim(camera, p.clone().add(v3(2.0, 0.9, 0.55)), p.clone().add(v3(-0.1, 0.82, -0.3))); } };
}
function B16() { // "and they wanted them yesterday"
  const E = busyCast(); const camera = cam(44);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); setHeat(E.bar, 0.9); forgeWork(E, E.h, lt + 2, { t0: 0, period: 0.85 });
      waiting(E, lt); applyPose(E.sol, { hipY: 0.98, armR: [-1.4, 0, 0.1], foreR: [-0.2, 0, 0], armL: [-0.1, 0, -0.2], neck: [0.05, 0, 0] });
      const tap = Math.max(0, Math.sin(lt * 9)); applyPose(E.farmer, { hipY: 0.95, armR: [-0.9, 0, 0.1], foreR: [-1.0, 0, 0], armL: [-0.3, 0, -0.5], foreL: [-1.5, 0, 0], footR: [-tap * 0.4, 0, 0], neck: [-0.1, 0.3, 0] });
      aim(camera, v3(1.4, 1.55, 0.4), v3(-0.2, 1.35, 3.0)); } };
}
function B17() { // quenching: hot iron hisses into the tub
  const E = busyCast(); const camera = cam(36); const piece = hotBar(0.32); E.scene.add(piece); const tub = E.S.tub.position;
  const steam = particles({ mode: 'emit', count: 120, origin: tub.clone().add(v3(0, 0.6, 0)), spread: v3(0.2, 0.05, 0.2), vel: v3(0, 1.0, 0), life: 1.4, size: 0.12, c0: 0xf0f0f0, c1: 0xc8c8c8, soft: true, additive: false, opacity: 0, seed: 91 }); E.scene.add(steam);
  const tg = buildTongs(); E.scene.add(tg);
  return { scene: E.scene, camera, grade: FORGE_G, env: ENV.forge,
    update(lt) { forgeLights(E, lt); E.h.root.visible = false; const dip = smooth(range(lt, 0.3, 0.8)); const p = tub.clone().add(v3(0, 0.95 - dip * 0.5, 0)); piece.position.copy(p); piece.rotation.set(0.8, 0, 0); setHeat(piece, 1 - smooth(range(lt, 0.8, 1.6)));
      steam.material.uniforms.uOpacity.value = smooth(range(lt, 0.75, 0.95)) * (1 - smooth(range(lt, 1.6, 2.0))) * 0.85; setTongs(tg, p.clone().add(v3(0.35, 0.45, 0.1)), p.clone().add(v3(0, 0.1, 0)));
      aim(camera, tub.clone().add(v3(0.95, 1.05, 0.85)), tub.clone().add(v3(0, 0.6, 0))); PL(3, p, 0xff8030, 1.2, (1 - smooth(range(lt, 0.8, 1.4))) * 2); } };
}

// ---------------------------------------------------------------- 6 — THE PRICE OF THE JOB
function B18() { // late at night, alone, still hammering
  const E = smithyCast({ night: true }); const camera = cam(46); const h = hero('adult', { gloveL: true }); atAnvil(E, h);
  return { scene: E.scene, camera, grade: { sat: 1, contrast: 1.08, bloom: 0.36, bloomT: 0.72 }, env: ENV.night,
    update(lt) { forgeLights(E, lt, 1); setHeat(E.bar, 1); forgeWork(E, h, lt, { t0: 0.1, period: 1.15 }); setFace(h, { squint: 0.6, brow: -0.4 });
      const u = ease(range(lt, 0, 2.8)); aim(camera, v3(lerp(5.5, 3.8, u), 1.8, lerp(9.5, 6.8, u)), v3(-0.4, 1.1, -1.8)); } };
}
function B19() { // he wipes the sweat from his forehead — soot, exhaustion
  const E = smithyCast({ night: true }); const camera = cam(36); const h = hero('adult', { gloveL: true }); atAnvil(E, h);
  return { scene: E.scene, camera, grade: { sat: 0.98, contrast: 1.08, bloom: 0.34, bloomT: 0.74 }, env: ENV.night,
    update(lt) { forgeLights(E, lt, 0.9); setHeat(E.bar, 0.6); const w = smooth(range(lt, 0.5, 1.1)) * (1 - smooth(range(lt, 1.9, 2.5)));
      const breath = Math.sin(lt * 2.4) * 0.03; applyPose(h, { ...h.P.REST, spine: [0.12 + breath, 0, 0], chest: [breath, 0, 0], neck: [0.05 - w * 0.25, 0.2, 0], armL: [-1.0 - w * 1.35, 0.4 * w, -0.2 - w * 0.4], foreL: [-0.6 - w * 1.4, 0.3 * w, 0], armR: [-0.25, 0, 0.15], foreR: [-0.4, 0, 0], handR: [0, 0, 0] }); setGrip(h, 'R', 1); setGrip(h, 'L', 0.4);
      setFace(h, { squint: 0.75 - w * 0.2, brow: -0.2, open: 0.12 + Math.max(0, Math.sin(lt * 2.4)) * 0.12 }); setJiggle(h, { bounce: Math.sin(lt * 2.4 + 0.5) * 0.08 });
      const hd = wpos(h.face, 0, 0.11, 0); aim(camera, hd.clone().add(v3(0.55 + lt * 0.0, 0.05, -0.95 + lt * 0.12)).add(v3(0, 0, 0)), hd.clone().add(v3(0.02, -0.04, 0))); } };
}
function B20() { // the hands of decades at the anvil
  const E = smithyCast({ night: true }); const camera = cam(36); const h = hero('adult', { gloveL: false, hammer: false }); E.scene.add(h.root); h.root.position.set(-0.8, 0, -3.0); h.root.rotation.y = -2.6;
  const M = h.M; for (const sd of ['L', 'R']) for (let i = 0; i < 4; i++) mesh(box(0.003, 0.03, 0.005), mat({ color: 0x8a3a2a }), h['hand' + sd], [0.022, -0.03 - i * 0.015, -0.03 + i * 0.02], [0, 0, 0.3]);  // scars
  return { scene: E.scene, camera, grade: { sat: 0.98, contrast: 1.1, bloom: 0.34, bloomT: 0.74 }, env: ENV.night,
    update(lt) { forgeLights(E, lt, 0.85); const rot = Math.sin(lt * 0.9) * 0.3; applyPose(h, { ...st(h), spine: [0.25, 0, 0], neck: [0.5, 0, 0], armL: [-0.45, 0, -0.1], foreL: [-1.25, 0, 0], handL: [0, 0, -1.3 - rot], armR: [-0.45, 0, 0.1], foreR: [-1.25, 0, 0], handR: [0, 0, 1.3 + rot] });
      setGrip(h, 'L', 0.35 + Math.sin(lt * 1.3) * 0.15); setGrip(h, 'R', 0.35 + Math.sin(lt * 1.3 + 1) * 0.15); setJiggle(h, {});
      const a = wpos(h.handL, 0, -0.08, 0), b = wpos(h.handR, 0, -0.08, 0); const m = a.clone().lerp(b, 0.5); const off = h.root.localToWorld(v3(0.34, 0.42, 0.66)).sub(h.root.position); aim(camera, b.clone().add(off), b.clone().add(v3(0, 0.0, 0))); PL(3, m.clone().add(v3(0.3, 0.4, 0.4)), 0xffc890, 1.5, 0.3); } };
}

// ---------------------------------------------------------------- 7 — OLD AGE
function oldCast() {
  const E = smithyCast(); const o = hero('old', { gloveL: false }); E.scene.add(o.root); o.root.position.set(-1.35, 0, -3.55); o.root.rotation.y = -2.25;
  const stool = group(E.scene, [-1.35, 0, -3.55]); for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [0, 0.18]]) mesh(box(0.05, 0.45, 0.05, 'bottom'), E.S.M.beam, stool, [x, 0, z]); mesh(prism(10, 0.24, 0.24, 0.06), E.S.M.wood, stool, [0, 0.45, 0]);
  return { ...E, o };
}
const OLD_SIT = (tr, t) => ({ hipY: 0.5, thighL: [-1.4, 0, -0.14], shinL: [1.35, 0, 0], thighR: [-1.4, 0, 0.14], shinR: [1.3, 0, 0], spine: [0.42, 0, 0], chest: [0.18, 0, 0], neck: [0.1, 0, 0], head: [0.1, 0, 0], armL: [-0.75 + Math.sin(t * 23) * tr, 0, -0.1], foreL: [-1.0, 0, 0], armR: [-0.75 + Math.sin(t * 19 + 1) * tr, 0, 0.1], foreR: [-1.0, 0, 0] });
const OLD_G = { sat: 0.92, contrast: 1.06, bloom: 0.3, bloomT: 0.78 };
function B21() { // an old man beside a dying fire
  const E = oldCast(); const camera = cam(44);
  return { scene: E.scene, camera, grade: OLD_G, env: { ...ENV.forge, ambient: 0x4e4848 },
    update(lt) { forgeLights(E, lt, 0.3); applyPose(E.o, OLD_SIT(0.015, lt)); setGrip(E.o, 'L', 0.5, { tremble: 0.08, t: lt }); setGrip(E.o, 'R', 0.9, { tremble: 0.08, t: lt }); setFace(E.o, { squint: 0.6, brow: 0.1 }); setJiggle(E.o, { bounce: -0.25 });
      const u = ease(range(lt, 0, 3)); E.o.root.updateMatrixWorld(true); aim(camera, E.o.root.localToWorld(v3(lerp(1.1, 0.8, u), lerp(1.2, 1.05, u), lerp(2.4, 1.8, u))), E.o.root.localToWorld(v3(0, 0.78, 0.1))); } };
}
function B22() { // trembling hands try to lift the hammer — and fail
  const E = oldCast(); const camera = cam(38);
  return { scene: E.scene, camera, grade: OLD_G, env: { ...ENV.forge, ambient: 0x4e4848 },
    update(lt) { forgeLights(E, lt, 0.25); const lift = smooth(range(lt, 0.3, 1.4)) * (1 - smooth(range(lt, 1.7, 2.6))); const tr = 0.02 + lift * 0.05;
      applyPose(E.o, { ...OLD_SIT(tr, lt), armR: [-0.75 - lift * 0.55 + Math.sin(lt * 19) * tr, 0, 0.1], foreR: [-1.0 - lift * 0.5, 0, 0], handR: [0.4 - lift * 0.3 + Math.sin(lt * 27) * tr * 2, 0, 0], spine: [0.42 - lift * 0.1, 0, 0] }); setGrip(E.o, 'R', 0.85, { tremble: 0.1, t: lt }); setGrip(E.o, 'L', 0.5, { tremble: 0.08, t: lt });
      setFace(E.o, { squint: 0.5 + lift * 0.4, brow: -0.6 * lift, open: lift * 0.25 }); setJiggle(E.o, { bounce: -0.25 });
      const hp = wpos(E.o.handR, 0, -0.08, 0); aim(camera, E.o.root.localToWorld(v3(0.75, 1.05, 1.25)), hp.clone().add(v3(0, 0.18, 0))); } };
}
function B23() { // the man he used to be
  const E = smithyCast({ sparkVel: v3(0.5, 1.8, 0.8) }); const camera = cam(40); const h = hero('adult', { gloveL: true }); atAnvil(E, h);
  return { scene: E.scene, camera, grade: { sat: 1.1, contrast: 1.08, bloom: 0.42, bloomT: 0.7, gain: [1.08, 1.0, 0.9] }, env: ENV.forge,
    update(lt) { forgeLights(E, lt, 1.1); setHeat(E.bar, 1); forgeWork(E, h, lt, { t0: -0.35, period: 0.85 }); setFace(h, { squint: 0.35, brow: -0.5 });
      const p = h.root.position; aim(camera, p.clone().add(v3(1.9, 0.9, 1.0)), p.clone().add(v3(-0.1, 1.0, -0.3))); } };
}

// ---------------------------------------------------------------- 8 — THE END
function B24() { // he lays the hammer on the anvil; the fire fades
  const E = oldCast(); const camera = cam(42); const o = E.o; o.root.position.set(0.95, 0, -1.45); o.root.rotation.y = Math.PI + 0.75; const hm = buildHammer(smithMaterials(), { len: 0.42, head: 1.15 }); E.scene.add(hm); hm.visible = false;
  return { scene: E.scene, camera, grade: OLD_G, env: { ...ENV.forge, ambient: 0x4a4444 },
    update(lt) { const fire = 0.3 * (1 - smooth(range(lt, 1.0, 3.6))); forgeLights(E, lt, fire); E.bar.visible = false; E.tongs.visible = false;
      const place = smooth(range(lt, 0.0, 1.2)), rel = smooth(range(lt, 1.2, 1.6));
      applyPose(o, { hipY: 0.92, spine: [0.45 + place * 0.15, 0, 0], chest: [0.15, 0, 0], neck: [0.2, 0, 0], thighL: [-0.2, 0, 0], shinL: [0.25, 0, 0], thighR: [-0.1, 0, 0], shinR: [0.2, 0, 0], armR: [-0.4 - place * 0.55, 0, 0.12], foreR: [-0.6 - place * 0.2, 0, 0], handR: [0.6 * place, 0, 0], armL: [-0.2, 0, -0.2], foreL: [-0.6, 0, 0] });
      setGrip(o, 'R', 1 - rel * 0.8, { tremble: 0.08, t: lt }); setGrip(o, 'L', 0.5, { tremble: 0.06, t: lt }); setFace(o, { squint: 0.6, brow: 0.0 }); setJiggle(o, { bounce: -0.1 });
      o.hammer.visible = rel < 0.5; hm.visible = rel >= 0.5; hm.position.copy(E.top).add(v3(0.0, 0.035, 0)); hm.rotation.set(0, 0.9, Math.PI / 2);
      o.root.updateMatrixWorld(true); aim(camera, o.root.localToWorld(v3(-1.1, 1.35, 1.7 + lt * 0.08)), E.top.clone().lerp(o.root.localToWorld(v3(0, 1.3, 0)), 0.5)); } };
}
function B25() { // the next morning: the forge is cold; the hammer lies where he left it
  const E = smithyCast(); const camera = cam(46); E.bar.visible = false; E.tongs.visible = false; const hm = buildHammer(smithMaterials(), { len: 0.42, head: 1.15 }); hm.position.copy(E.top).add(v3(0.0, 0.035, 0)); hm.rotation.set(0, 0.9, Math.PI / 2); E.scene.add(hm);
  const dust = particles({ mode: 'drift', count: 260, box: v3(5, 3, 5), origin: v3(0.4, 1.5, -0.5), vel: v3(0.05, 0.06, 0.02), size: 0.012, c0: 0xf8f0e0, seed: 99, swirl: 0.5, opacity: 0.8, fogMix: 0.2 }); E.scene.add(dust);
  const shaft = mesh(new THREE.PlaneGeometry(2.6, 6), mat({ color: 0xfff4e0, unlit: true, additive: true, opacity: 0.08, side: THREE.DoubleSide, fogScale: 0.2 }), E.scene, [0.8, 1.6, 0.4], [0.5, 0.3, 0]);
  return { scene: E.scene, camera, grade: { sat: 0.9, contrast: 1.05, bloom: 0.3, bloomT: 0.78 }, env: ENV.cold,
    update(lt) { forgeLights(E, lt, 0.0); PL(0, v3(0.5, 2.4, 2.5), 0xfff0e0, 9, 1.0); const u = ease(range(lt, 0, 2.4)); aim(camera, E.top.clone().add(v3(lerp(0.9, 0.55, u), lerp(0.5, 0.35, u), lerp(1.2, 0.8, u))), E.top.clone().add(v3(-0.05, 0.04, 0))); } };
}
function B26() { // a young apprentice walks in and picks it up
  const E = smithyCast(); const camera = cam(48); E.bar.visible = false; E.tongs.visible = false; const hm = buildHammer(smithMaterials(), { len: 0.42, head: 1.15 }); E.scene.add(hm);
  const a = buildSmith({ age: 'youth', normal: true, hair: 0xc89a5a, skin: 0xe8b090, sooty: false, hammer: false, apron: true, seed: 2301 }); E.scene.add(a.root);
  const dust = particles({ mode: 'drift', count: 260, box: v3(5, 3, 5), origin: v3(0.4, 1.5, -0.5), vel: v3(0.05, 0.06, 0.02), size: 0.012, c0: 0xf8f0e0, seed: 99, swirl: 0.5, opacity: 0.8, fogMix: 0.2 }); E.scene.add(dust);
  return { scene: E.scene, camera, grade: { sat: 0.9, contrast: 1.05, bloom: 0.3, bloomT: 0.78 }, env: ENV.cold,
    update(lt) { forgeLights(E, lt, 0.0); PL(0, v3(0.5, 2.4, 2.5), 0xfff0e0, 9, 1.0);
      const walk = clamp(lt / 1.4); const pA = v3(1.6, 0, 3.4), pB = v3(0.75, 0, -1.55); a.root.position.copy(pA.clone().lerp(pB, ease(walk))); faceTo(a, walk < 1 ? pB : E.top); const ph = lt * 1.7;
      const grab = smooth(range(lt, 1.5, 2.0)), lift = smooth(range(lt, 2.05, 2.6));
      if (walk < 1) { applyPose(a, walkPose(ph, { stride: 0.4, hip: a.hipH })); } else applyPose(a, { ...st(a), spine: [0.4 * grab * (1 - lift), 0, 0], neck: [0.3 * grab, 0, 0], armR: [-0.9 * grab - lift * 0.4, 0, 0.12], foreR: [-0.6 * grab, 0, 0] });
      setGrip(a, 'R', 0.3 + grab * 0.7); setFace(a, { brow: 0.3 });
      if (lift > 0) { a.root.updateMatrixWorld(true); a.handR.add(hm); hm.position.set(-0.03 * 0.82, -0.125 * 0.82, 0); hm.rotation.set(0, 0, 0); } else { E.scene.add(hm); hm.position.copy(E.top).add(v3(0.0, 0.035, 0)); hm.rotation.set(0, 0.9, Math.PI / 2); }
      const u = ease(range(lt, 1.0, 3.0)); aim(camera, v3(lerp(2.8, 4.2, u), lerp(1.6, 2.6, u), lerp(3.2, 6.0, u)), v3(0.4, lerp(1.0, 1.4, u), lerp(-1.0, -2.2, u))); } };
}

export const SHOTS_SMITH = { B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23, B24, B25, B26 };
