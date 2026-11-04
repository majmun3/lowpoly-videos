// WHAT IF YOU WERE BORN AS A VAMPIRE? — 25 shots: a legendary vampire origin story in one minute.
import { THREE, v3, setPL, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, flat } from '/the-last-ember/render/src/engine.js';
import { applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { fireP, smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { buildKnightNPC, knightMaterials } from '/born-as-a-goblin/render/src/goblin.js';
import { army, bannerPole, waveFlag } from '/born-as-a-dragon/render/src/env.js';
import { buildVampire, buildElder, buildHuman, ageHuman, vStand, vWalk, updateCape, setEyes, Swarm, crimsonSmoke, crimsonAura, jigWalk, jigKick, setJiggle } from './vampire.js';
import { castleWorld, SKIES, ENVS, gothicHall, setDecay, flameSet, courtyard, throneRoom } from './vworld.js';

const cam = (fov, near = 0.05, far = 9000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
const faceTo = (j, p) => { j.root.rotation.y = Math.atan2(p.x - j.root.position.x, p.z - j.root.position.z); };
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
const PL = (i, p, c, r, k) => setPL(i, p, c, r, k * 0.5);
const wpos = (j, x, y, z) => { let top = j.root; while (top.parent) top = top.parent; top.updateMatrixWorld(true); return j.root.localToWorld(v3(x, y, z)); };
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// ---------------------------------------------------------------- poses
const STAND = vStand();
const REGAL = { ...STAND, spine: [-0.06, 0, 0], neck: [-0.06, 0, 0], armL: [0.1, 0, -0.12], foreL: [-0.5, 0, 0], armR: [0.15, 0, 0.1], foreR: [-0.9, 0, 0] };   // one hand behind, one at the waist
const RAISE = { ...STAND, armR: [-2.4, 0, 0.35], foreR: [-0.3, 0, 0], armL: [-0.2, 0, -0.25], neck: [-0.2, 0, 0], head: [-0.1, 0, 0] };
const SIT = { hipY: 0.66, thighL: [-1.5, 0, -0.1], shinL: [1.45, 0, 0], thighR: [-1.5, 0, 0.12], shinR: [1.45, 0, 0], spine: [-0.08, 0, 0], armL: [-0.55, 0, -0.32], foreL: [-0.75, 0, 0], armR: [-0.55, 0, 0.32], foreR: [-0.75, 0, 0], neck: [0.05, 0, 0] };
const KNEEL = { hipY: 0.55, thighL: [-1.5, 0, -0.1], shinL: [1.55, 0, 0], thighR: [0.15, 0, 0.1], shinR: [1.5, 0, 0], spine: [0.4, 0, 0], neck: [0.35, 0, 0], armL: [0.1, 0, -0.1], armR: [-0.9, 0, 0.1], foreR: [-0.9, 0, 0] };
const DISBELIEF = { ...STAND, spine: [-0.12, 0, 0], neck: [-0.12, 0, 0], armL: [-0.7, 0.3, -0.3], foreL: [-0.9, 0, 0], armR: [-0.3, 0, 0.2] };
const LEANIN = { ...STAND, spine: [0.3, 0, 0], chest: [0.15, 0, 0], neck: [0.3, 0, 0] };
const KN_READY = { hipY: 0.94, armR: [-1.2, 0, 0.2], foreR: [-0.6, 0, 0], armL: [-0.8, 0.3, -0.3], foreL: [-1.0, 0, 0], thighL: [-0.3, 0, 0], thighR: [0.3, 0, 0], shinR: [0.3, 0, 0] };
const KN_STRIKE = { hipY: 0.9, armR: [-2.6, 0, 0.2], foreR: [-0.3, 0, 0], armL: [-0.8, 0.3, -0.3], foreL: [-1.0, 0, 0], spine: [0.2, 0, 0], thighL: [-0.6, 0, 0], shinL: [0.4, 0, 0], thighR: [0.4, 0, 0] };
function pose(j, p, t = 0, o = {}) { applyPose(j, p); if (j.cape) updateCape(j, t, o); if (j.butt) setJiggle(j, o.jig || {}); }

// ---------------------------------------------------------------- S1 — BORN DIFFERENT
function V01() { // a gigantic gothic castle beneath a vast crimson moon
  const E = castleWorld({ sky: 'moon' }); const camera = cam(48);
  const bats = new Swarm(60, { seed: 2, scale: 2.4 }); E.scene.add(bats.group); const R = rng(3); const off = [...Array(60)].map(() => [R() * 6.28, 20 + R() * 40, R() * 30, 0.2 + R() * 0.4]);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.12, bloom: 0.55, bloomT: 0.62 }, env: ENVS.moon,
    update(lt) { const c = E.castle.position; bats.set(lt, (i) => { const [a, r, h, w] = off[i]; const aa = a + lt * w; return { on: true, p: v3(c.x + Math.cos(aa) * r, c.y + 60 + h, c.z + Math.sin(aa) * r), d: v3(-Math.sin(aa), 0, Math.cos(aa)) }; });
      const u = ease(range(lt, 0, 1.7)); aim(camera, v3(lerp(-24, -10, u), lerp(52, 70, u), lerp(110, 10, u)), v3(c.x + 4, c.y + lerp(70, 58, u), c.z)); } };
}
function nurseryCast() {
  const cand = []; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; cand.push([Math.cos(a) * 4.2, -6 + Math.sin(a) * 4.2]); }
  const E = gothicHall({ W: 13, L: 20, H: 13, step: 6.5, candelabras: cand, shaft: 0.05 });
  const crib = group(E.scene, [0, 0, -6]); const M = E.M;
  mesh(box(1.1, 0.5, 0.7, 'bottom'), M.black, crib, [0, 0.35, 0]); mesh(box(1.0, 0.08, 0.62), mat({ map: M.curtain.uniforms.map.value, color: 0xd06060 }), crib, [0, 0.82, 0]);
  for (const [x, z] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) { mesh(prism(6, 0.04, 0.04, 1.4), M.black, crib, [x, 0, z]); mesh(prism(4, 0.06, 0, 0.18), M.black, crib, [x, 1.4, z]); }
  const baby = buildVampire('baby'); baby.root.position.set(0, 0.86, 0); baby.root.rotation.y = Math.PI / 2; crib.add(baby.root); baby.head.rotation.x = -1.35;
  const elders = []; [[-1.6, -7.6, 0.6, 1], [1.5, -7.8, -0.5, 2], [-1.9, -4.6, 2.2, 3], [1.7, -4.4, -2.3, 4], [0.1, -8.4, 0, 5]].forEach(([x, z, ry, s]) => { const e = buildElder({ seed: s, bald: s === 2, robe: [0xffffff, 0xc8a8d0, 0xa0a0c0, 0xd0b8b8, 0xffffff][s - 1] }); e.root.position.set(x, 0, z); faceTo(e, v3(0, 0, -6)); E.scene.add(e.root); elders.push(e); });
  const wisp = particles({ mode: 'burst', count: 90, origin: v3(0, 2.6, -6), spread: v3(4.2, 0.1, 4.2), vel: v3(0, 0.5, 0), life: 2.2, size: 0.18, c0: 0x8a8a98, c1: 0x4a4a58, soft: true, additive: false, opacity: 0.5, seed: 61, start: -9 }); E.scene.add(wisp);
  return { ...E, crib, baby, elders, wisp };
}
// candles go out in a wave, from the crib outward (t0 = when the wave starts)
function candles(E, lt, t0) { E.flames.forEach((f, i) => { const k = Math.floor(i / 3); const tk = t0 + k * 0.07 + (i % 3) * 0.02; flameSet(E, i, lt < tk ? 1 + Math.sin(lt * 17 + i) * 0.08 : 0); }); const lit = clamp(1 - (lt - t0) / 0.8); E.flames.forEach((f, i) => { if (i % 6 === 0) PL(1 + (i / 6) % 4, f.p, 0xffa050, 6, 1.2 * lit); }); return lit; }
function elderPose(E, k, lt) { E.elders.forEach((e, i) => { applyPose(e, mixPose({ ...STAND, hipY: 0.98, armL: [-0.1, 0, -0.1], armR: [-0.1, 0, 0.1] }, DISBELIEF, k)); setEyes(e, 0.5); }); }
const NURSE_G = { sat: 1.0, contrast: 1.12, bloom: 0.55, bloomT: 0.6 };
function V02() { // the newborn opens his eyes
  const E = nurseryCast(); const camera = cam(36);
  return { scene: E.scene, camera, grade: NURSE_G, env: ENVS.hall,
    update(lt) { candles(E, lt, 99); elderPose(E, 0, lt); const k = smooth(range(lt, 0.35, 0.75)); setEyes(E.baby, k); PL(0, v3(0, 1.6, -6), 0xff2020, 2.0, k * 0.5);
      const f = wpos(E.baby, 0, 0.12, 0.17); aim(camera, f.clone().add(v3(-0.4, 0.9 - lt * 0.15, 0.0)), f); } };
}
function V03() { // every candle in the room goes out
  const E = nurseryCast(); const camera = cam(52);
  return { scene: E.scene, camera, grade: NURSE_G, env: ENVS.hall,
    update(lt) { const lit = candles(E, lt, 0.25); E.wisp.material.uniforms.uStart.value = 0.3; elderPose(E, 0, lt); setEyes(E.baby, 1); PL(0, v3(0, 1.4, -6), 0xff2020, 3.5, 1.2);
      aim(camera, v3(lerp(5.2, 4.4, lt), 6.2, lerp(1.0, 0.0, lt)), v3(0, 1.0, -6.2)); } };
}
function V04() { // the ancient elders stare at the child in disbelief
  const E = nurseryCast(); const camera = cam(42);
  return { scene: E.scene, camera, grade: NURSE_G, env: ENVS.hall,
    update(lt) { candles(E, lt, -5); elderPose(E, smooth(range(lt, 0.1, 0.6)), lt); setEyes(E.baby, 1); PL(0, v3(0, 1.3, -6), 0xff2020, 4, 1.8);
      aim(camera, v3(0.35, 0.95, -6.1 + lt * 0.1), v3(-0.2, 1.75, -8.3)); } };
}

// ---------------------------------------------------------------- S2 — THE FIRST HUNGER
function hallCast(o = {}) {
  const cand = []; for (let z = -4; z > -52; z -= 8) { cand.push([-4.2, z]); cand.push([4.2, z]); }
  const E = gothicHall({ W: 18, L: 60, H: 22, step: 8, candelabras: o.cand === false ? [] : cand, shaft: 0.08 });
  return E;
}
function V05() { // a five-year-old walks an enormous gothic hall
  const E = hallCast(); const camera = cam(50); const ch = buildVampire('child'); E.scene.add(ch.root);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.12, bloom: 0.5, bloomT: 0.62 }, env: ENVS.hall,
    update(lt) { const z = -40 + lt * 0.9; const ph = (lt * 0.9) / 0.5; ch.root.position.set(0.4, 0, z); ch.root.rotation.y = 0; pose(ch, vWalk(ph, { hip: ch.hipH, stride: 0.45 }), lt, { wind: 0.15, jig: jigWalk(ph, 0.6) }); setEyes(ch, 0.45);
      E.flames.forEach((f, i) => { if (i % 4 === 0) PL(1 + (i / 4) % 4, f.p, 0xffa050, 7, 1.0); });
      aim(camera, v3(lerp(-2.6, -1.6, lt / 2.8), lerp(3.6, 2.4, lt / 2.8), z + 5.2 - lt * 0.4), v3(0.4, 0.8, z - 1)); } };
}
function V06() { // a heartbeat in another room — his eyes turn bright crimson
  const E = hallCast(); const camera = cam(34); const ch = buildVampire('child'); E.scene.add(ch.root); ch.root.position.set(0.4, 0, -37.5);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.14, bloom: 0.55, bloomT: 0.6 }, env: ENVS.hall,
    update(lt) { const turn = smooth(range(lt, 0.4, 1.0)); pose(ch, { ...vStand(ch.k), neck: [0.0, turn * 0.7, 0], head: [0, turn * 0.25, 0] }, lt, { wind: 0.1 }); const k = 0.45 + smooth(range(lt, 0.7, 1.1)) * 0.55 + pulse(lt, 0.9, 0.08) * 0.3; setEyes(ch, k);
      PL(0, wpos(ch, 0, 1.0, 0.25), 0xff2020, 1.0, k * 0.45); E.flames.forEach((f, i) => { if (i % 4 === 0) PL(1 + (i / 4) % 4, f.p, 0xffa050, 7, 1.0); });
      const f = wpos(ch, 0, 0.98, 0.0); aim(camera, f.clone().add(v3(-0.35 + lt * 0.1, 0.02, 1.15 - lt * 0.15)), f); } };
}
function V07() { // he vanishes in crimson smoke
  const E = hallCast(); const camera = cam(42); const ch = buildVampire('child'); E.scene.add(ch.root); ch.root.position.set(0.4, 0, -37.5);
  const sm = crimsonSmoke({ origin: v3(0.4, 0.6, -37.5), spread: v3(1.0, 0.9, 1.0), size: 0.3, count: 320, vel: v3(0, 1.4, 0) }); E.scene.add(sm);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.12, bloom: 0.55, bloomT: 0.6 }, env: ENVS.hall,
    update(lt) { const T0 = 0.25; sm.material.uniforms.uStart.value = T0; ch.root.visible = lt < T0 + 0.05; pose(ch, { ...vStand(ch.k), neck: [0, 0.7, 0] }, lt); setEyes(ch, 1); ch.root.scale.setScalar(1 - smooth(range(lt, T0 - 0.05, T0 + 0.05)) * 0.6);
      PL(0, v3(0.4, 0.8, -36.0), 0xff2030, 4, pulse(lt, T0 + 0.05, 0.12) * 0.6); aim(camera, v3(-1.6, 1.1, -34.4), v3(0.4, 0.75, -37.5)); } };
}
function V08() { // ...and appears beside the heartbeat
  const E = gothicHall({ W: 10, L: 14, H: 9, step: 6, candelabras: [[-3, -6], [3, -6]], shaft: 0.04 }); const camera = cam(40);
  const maid = buildHuman({ seed: 4, female: true, apron: true, bonnet: true, cloth: 0x4a3a5a }); maid.root.position.set(0, 0, -3.0); maid.root.rotation.y = 0; E.scene.add(maid.root);
  const cnd = group(maid.handR, [0, -0.06, 0.08]); mesh(prism(6, 0.03, 0.03, 0.16), E.M.candle, cnd); const cf = glow(0xffb060, 0.5, 0.9); cf.position.set(0, 0.24, 0); cnd.add(cf);
  const ch = buildVampire('child'); ch.root.position.set(0.62, 0, -3.6); ch.root.rotation.y = 0.2; E.scene.add(ch.root);
  const sm = crimsonSmoke({ origin: v3(0.62, 0.5, -3.6), spread: v3(0.3, 0.5, 0.3), size: 0.5, count: 140, life: 1.0 }); E.scene.add(sm);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.12, bloom: 0.55, bloomT: 0.6 }, env: ENVS.hall,
    update(lt) { const T0 = 0.3; sm.material.uniforms.uStart.value = T0 - 0.15; ch.root.visible = lt > T0; pose(ch, vStand(ch.k), lt, { wind: 0.1 }); setEyes(ch, 1);
      const turn = smooth(range(lt, 0.9, 1.6)); applyPose(maid, { hipY: 0.95, armR: [-1.0, 0, 0.1], foreR: [-0.9, 0, 0], neck: [0, turn * 0.9, 0], head: [0, turn * 0.4, 0], spine: [0, turn * 0.4, 0] });
      cf.material.opacity = 0.9 - pulse(lt, T0 + 0.1, 0.15) * 0.6; const fp = wpos(maid, 0.15, 1.3, 0.3); PL(0, fp, 0xffb060, 4, 1.4 - pulse(lt, T0 + 0.1, 0.15)); PL(1, v3(0.3, 1.0, -3.7), 0xff2020, 1.5, ch.root.visible ? 0.8 : 0);
      aim(camera, v3(-0.55, 1.45, -0.2 - lt * 0.15), v3(0.15, 1.3, -3.4)); } };
}

// ---------------------------------------------------------------- S3 — THE GIFT
function yardCast() {
  const E = courtyard(); const cz = E.cz; const v = buildVampire('noble'); v.root.position.set(0, 0, cz); E.scene.add(v.root);
  const KM = knightMaterials(); const knights = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; const k = buildKnightNPC(KM, {}); k.root.position.set(Math.sin(a) * 3.6, 0, cz + Math.cos(a) * 3.6); faceTo(k, v3(0, 0, cz)); E.scene.add(k.root); knights.push({ k, a }); }
  const sm = crimsonSmoke({ origin: v3(0, 0.9, cz), spread: v3(0.5, 0.8, 0.5), size: 0.7, count: 220 }); E.scene.add(sm);
  const trail = particles({ mode: 'line', count: 300, origin: v3(), lineB: v3(), spread: v3(0.25, 0.4, 0.25), vel: v3(0, 0.3, 0), life: 0.35, size: 0.07, c0: 0xff4050, c1: 0xa01020, c2: 0x200008, seed: 71, soft: false, opacity: 0, fogMix: 0.2 }); E.scene.add(trail);
  return { ...E, v, knights, sm, trail };
}
function torchLights(E, lt) { E.torches.slice(0, 4).forEach((p, i) => PL(1 + i, p, 0xff9040, 9, 1.2 + Math.sin(lt * 13 + i) * 0.15)); }
const YARD_G = { sat: 1.0, contrast: 1.12, bloom: 0.5, bloomT: 0.62 };
function V09() { // by twenty — knights surround him
  const E = yardCast(); const camera = cam(46);
  return { scene: E.scene, camera, grade: YARD_G, env: ENVS.moonlit,
    update(lt) { torchLights(E, lt); pose(E.v, REGAL, lt, { wind: 0.3 }); setEyes(E.v, 0.6); E.knights.forEach(({ k }, i) => applyPose(k, mixPose({ hipY: 0.98 }, KN_READY, smooth(range(lt, 0.2 + i * 0.1, 0.8 + i * 0.1)))));
      const a = 0.4 + lt * 0.35; aim(camera, v3(Math.sin(a) * 5.2, 2.2 - lt * 0.3, E.cz + Math.cos(a) * 5.2), v3(0, 1.2, E.cz)); } };
}
function V10() { // they attack at once — he is gone in a burst of crimson smoke
  const E = yardCast(); const camera = cam(48); const T0 = 0.55;
  return { scene: E.scene, camera, grade: YARD_G, env: ENVS.moonlit,
    update(lt) { torchLights(E, lt); E.v.root.visible = lt < T0; pose(E.v, REGAL, lt, { wind: 0.3 }); setEyes(E.v, 1); E.sm.material.uniforms.uStart.value = T0 - 0.05;
      E.knights.forEach(({ k, a }, i) => { const u = easeIn(range(lt, 0, T0 + 0.1)); const r = 3.6 - u * 2.3; k.root.position.set(Math.sin(a) * r, 0, E.cz + Math.cos(a) * r); applyPose(k, mixPose(KN_READY, KN_STRIKE, smooth(range(lt, 0.15, T0 + 0.05)))); });
      PL(0, v3(0, 1.2, E.cz), 0xff2030, 6, pulse(lt, T0, 0.1) * 1.2); aim(camera, v3(2.4, 1.4, E.cz + 5.4), v3(0, 1.1, E.cz)); shake(camera, pulse(lt, T0 + 0.05, 0.08) * 0.05, lt); } };
}
function V11() { // faster than the human eye could follow
  const E = yardCast(); const camera = cam(50); E.v.root.visible = false;
  const R = rng(5); const hops = [...Array(7)].map((_, i) => { const k = E.knights[i % 6]; return k; });
  return { scene: E.scene, camera, grade: { ...YARD_G, contrast: 1.16 }, env: ENVS.moonlit,
    update(lt) { torchLights(E, lt); const seg = Math.floor(lt / 0.2), u = (lt % 0.2) / 0.2;
      E.knights.forEach(({ k, a }, i) => { const r = 1.3; k.root.position.set(Math.sin(a) * r, 0, E.cz + Math.cos(a) * r); const hit = lt > i * 0.2 + 0.1; applyPose(k, hit ? { hipY: 0.96, spine: [-0.3, 0.3, 0], armR: [-0.4, 0, 0.6], foreR: [-0.2, 0, 0], neck: [-0.3, 0, 0] } : KN_STRIKE); if (k.sword) k.sword.visible = !hit; });
      const A = E.knights[seg % 6].k.root.position, B = E.knights[(seg + 1) % 6].k.root.position; const tu = E.trail.material.uniforms; tu.uOrigin.value.copy(A).add(v3(0, 1.1, 0)).lerp(B.clone().add(v3(0, 1.1, 0)), u); tu.uLineB.value.copy(A).add(v3(0, 1.1, 0)); tu.uOpacity.value = 0.6;
      const cA = 0.2 + seg * 1.05; aim(camera, v3(Math.sin(cA) * 4.2, 1.3 + (seg % 2) * 0.6, E.cz + Math.cos(cA) * 4.2), v3(0, 1.0, E.cz)); shake(camera, 0.03, lt); } };
}
function V12() { // he stands calmly — behind him, every knight falls
  const E = yardCast(); const camera = cam(40); const T0 = 0.55;
  E.knights.forEach(({ k, a }, i) => { const r = 2.0 + (i % 2) * 0.8; k.root.position.set(Math.sin(a * 0.5 + 2.6) * r * 1.1, 0, E.cz - 1.2 - Math.abs(Math.cos(a)) * 1.6 - (i % 3) * 0.6); k.root.rotation.y = a; });
  return { scene: E.scene, camera, grade: YARD_G, env: ENVS.moonlit,
    update(lt) { torchLights(E, lt); E.v.root.position.set(0, 0, E.cz + 1.2); E.v.root.rotation.y = 0; pose(E.v, { ...REGAL, armL: [-0.4, 0.3, -0.1], foreL: [-1.4, 0, 0], armR: [-0.5, -0.3, 0.1], foreR: [-1.3, 0, 0] }, lt, { wind: 0.35 }); setEyes(E.v, 0.85);
      E.knights.forEach(({ k }, i) => { const f = easeIn(range(lt, T0 + i * 0.06, T0 + 0.45 + i * 0.06)); k.root.rotation.order = 'YXZ'; k.root.rotation.x = f * (i % 2 ? 1.45 : -1.45); k.root.position.y = f * 0.15; applyPose(k, { hipY: 0.98, armR: [-0.3 - f, 0, 0.4], armL: [-0.3 - f, 0, -0.4] }); if (k.sword) k.sword.visible = false; });
      aim(camera, v3(0.5, 1.3, E.cz + 5.4 - lt * 0.25), v3(0, 1.35, E.cz + 0.4)); shake(camera, pulse(lt, T0 + 0.5, 0.15) * 0.03, lt); } };
}

// ---------------------------------------------------------------- S4 — IMMORTALITY
function feastCast() {
  const E = gothicHall({ W: 16, L: 34, H: 18, step: 8, candelabras: [[-5, -8], [5, -8], [-5, -20], [5, -20]], decayable: true, shaft: 0.08 });
  const M = E.M; const tz = -14; const table = group(E.scene, [0, 0, tz]); mesh(box(1.8, 0.1, 7, 'bottom'), M.wood, table, [0, 0.76, 0]); for (const [x, z] of [[-0.7, -3.2], [0.7, -3.2], [-0.7, 3.2], [0.7, 3.2]]) mesh(box(0.12, 0.76, 0.12, 'bottom'), M.wood, table, [x, 0, z]);
  const cands = []; for (const z of [-2.4, 0, 2.4]) { mesh(prism(6, 0.05, 0.05, 0.3), M.candle, table, [0, 0.86, z]); const g = glow(0xffb060, 0.6, 0.85); g.position.set(0, tz ? 1.2 : 1.2, tz + z); E.scene.add(g); cands.push(g); }
  for (let i = 0; i < 6; i++) { const z = -2.6 + Math.floor(i / 2) * 2.6, s = i % 2 ? 1 : -1; mesh(box(0.5, 0.05, 0.5, 'bottom'), M.wood, table, [s * 1.3, 0.46, z]); mesh(box(0.5, 0.9, 0.06, 'bottom'), M.wood, table, [s * 1.55, 0.46, z], [0, Math.PI / 2, 0]); }
  const comps = []; for (let i = 0; i < 6; i++) { const z = -2.6 + Math.floor(i / 2) * 2.6, s = i % 2 ? 1 : -1; const h = buildHuman({ seed: 20 + i, female: i % 3 === 1, beard: i % 3 === 2 }); h.root.position.set(s * 1.3, 0, tz + z); h.root.rotation.y = -s * Math.PI / 2; E.scene.add(h.root); comps.push(h); }
  const v = buildVampire('noble'); v.root.position.set(0, 0, tz - 4.3); v.root.rotation.y = 0; E.scene.add(v.root);
  const snow = particles({ mode: 'drift', count: 500, box: v3(14, 16, 30), origin: v3(0, 8, tz), vel: v3(0.2, -0.8, 0), size: 0.05, c0: 0xffffff, seed: 81, swirl: 1.0, opacity: 0, fogMix: 0.3 }); E.scene.add(snow);
  const leaves = particles({ mode: 'drift', count: 300, box: v3(14, 14, 30), origin: v3(0, 7, tz), vel: v3(0.4, -0.6, 0), size: 0.07, c0: 0xc07030, c1: 0x8a4020, seed: 82, swirl: 1.4, opacity: 0, additive: false, fogMix: 0.3 }); E.scene.add(leaves);
  const dust = particles({ mode: 'drift', count: 400, box: v3(14, 14, 30), origin: v3(0, 6, tz), vel: v3(0.05, 0.1, 0), size: 0.04, c0: 0xd8d0c0, seed: 83, swirl: 0.6, opacity: 0, fogMix: 0.3 }); E.scene.add(dust);
  return { ...E, tz, comps, v, cands, snow, leaves, dust, table };
}
// the passage of time: age 0..1 drives seasons through the windows, aging, deaths, decay
function timeLapse(E, age, lt) {
  const season = (age * 6) % 1, day = Math.sin(age * 60) * 0.5 + 0.5;
  const winCol = lerpC(0x3a4a8a, 0xffe8c0, day); E.M.gwin.uniforms.uColor.value.copy(winCol).lerp(new THREE.Color(season > 0.75 ? 0xffffff : season > 0.5 ? 0xffa060 : 0x90c070), 0.25);
  E.comps.forEach((h, i) => { const die = 0.42 + i * 0.075; const a = clamp(age / die); h.root.visible = age < die; applyPose(h, { ...ageHuman(h, a), armR: [-0.7, 0, 0.1], foreR: [-0.6, 0, 0], neck: [0, 0, 0], thighL: [-1.5, 0, 0], thighR: [-1.5, 0, 0], shinL: [1.5, 0, 0], shinR: [1.5, 0, 0], hipY: 0.5 }); });
  const lit = clamp(1 - (age - 0.55) * 4); E.cands.forEach(c => c.material.opacity = 0.85 * lit); E.flames.forEach((f, i) => flameSet(E, i, clamp(1 - (age - 0.6) * 5)));
  setDecay(E, clamp((age - 0.5) * 2)); E.snow.material.uniforms.uOpacity.value = season > 0.75 && age > 0.5 ? 0.9 : 0; E.leaves.material.uniforms.uOpacity.value = season > 0.5 && season < 0.75 && age > 0.4 ? 0.9 : 0; E.dust.material.uniforms.uOpacity.value = clamp((age - 0.5) * 2) * 0.8;
  pose(E.v, REGAL, lt, { wind: 0.05 }); setEyes(E.v, 0.55);
  PL(0, v3(0, 1.4, E.tz), 0xffb060, 6, 1.4 * lit + 0.2); PL(1, v3(6, 8, E.tz), winCol.getHex(), 18, 0.6 + day * 0.9);
}
function V13() { // immortality had a price — the companions grow old
  const E = feastCast(); const camera = cam(46);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.1, bloom: 0.5, bloomT: 0.64 }, env: ENVS.hall,
    update(lt) { const age = lt / 4.0 * 0.62; timeLapse(E, age, lt); aim(camera, v3(lerp(2.6, 2.0, lt / 4), 2.6, E.tz + 5.2 - lt * 0.3), v3(0, 1.2, E.tz - 2.2)); } };
}
function V14() { // ...while you remained
  const E = feastCast(); const camera = cam(50);
  return { scene: E.scene, camera, grade: { sat: 0.95, contrast: 1.1, bloom: 0.5, bloomT: 0.64 }, env: ENVS.hall,
    update(lt) { const age = 0.62 + lt / 4.0 * 0.38; timeLapse(E, age, lt); const u = ease(range(lt, 0, 4)); aim(camera, v3(lerp(-5.5, -1.2, u), lerp(7.5, 2.0, u), E.tz + lerp(9, 0.8, u)), v3(0, lerp(1.0, 1.55, u), E.tz - 4.3)); } };
}

// ---------------------------------------------------------------- S5 — THE HUNT
function battleCast(sky = 'sunset') {
  const E = castleWorld({ sky }); const R = rng(9);
  const pos = [], cols = []; for (let i = 0; i < 2400; i++) { const x = (R() - 0.5) * 150, z = 40 + R() * 170 + Math.abs(x) * 0.25; pos.push(v3(x, E.hf(x, z), z)); cols.push([0xd8d8e0, 0xc0c4cc, 0xa8a8b0, 0x8a6a5a][Math.floor(R() * 4)]); }
  const host = army(pos, cols, { yaw: Math.PI, seed: 11 }); const ag = new THREE.Group(); ag.add(host); E.scene.add(ag);
  const torches = []; for (let i = 0; i < 220; i++) { const p = pos[Math.floor(R() * pos.length)]; const g = glow(0xffa040, 1.8, 0.85); g.position.set(p.x + 0.35, p.y + 2.3, p.z); ag.add(g); torches.push(g); }
  const banners = []; for (let i = 0; i < 14; i++) { const p = pos[Math.floor(R() * pos.length)]; const b = bannerPole(0xe8e8f0, { h: 6 }); b.position.copy(p); b.rotation.y = Math.PI / 2; ag.add(b); banners.push(b); }
  return { ...E, host, ag, pos, torches, banners };
}
function V15() { // humanity gathered an army
  const E = battleCast('sunset'); const camera = cam(50);
  return { scene: E.scene, camera, grade: { sat: 1.02, contrast: 1.12, bloom: 0.5, bloomT: 0.62 }, env: ENVS.sunset,
    update(lt) { E.ag.position.z = -lt * 1.6; E.banners.forEach(b => waveFlag(b, lt, 0.3)); const u = ease(range(lt, 0, 3.8)); aim(camera, v3(lerp(55, 30, u), lerp(14, 40, u), lerp(250, 270, u)), v3(lerp(0, 0, u), lerp(20, 30, u), lerp(-40, -110, u))); } };
}
function balconyCast(sky) { const E = battleCast(sky); const v = buildVampire(sky === 'dawn' ? 'king' : 'noble'); const b = E.castle.position.clone().add(E.castle.userData.balc); v.root.position.set(b.x, b.y, b.z + 0.2); v.root.rotation.y = 0; E.scene.add(v.root); return { ...E, v, b }; }
function V16() { // alone on his balcony, he watches them
  const E = balconyCast('sunset'); const camera = cam(46);
  return { scene: E.scene, camera, grade: { sat: 1.02, contrast: 1.12, bloom: 0.5, bloomT: 0.62 }, env: ENVS.sunset,
    update(lt) { E.ag.position.z = -(3.8 + lt) * 1.6; E.banners.forEach(b => waveFlag(b, lt, 0.3)); pose(E.v, REGAL, lt, { wind: 0.65 }); setEyes(E.v, 0.5);
      const b = E.v.root.position; aim(camera, v3(b.x + 1.8 - lt * 0.2, b.y - 0.9, b.z + 6.5), v3(b.x, b.y + 1.5, b.z)); } };
}
function V17() { // his eyes begin to glow
  const E = balconyCast('sunset'); const camera = cam(30);
  return { scene: E.scene, camera, grade: { sat: 1.02, contrast: 1.14, bloom: 0.6, bloomT: 0.58 }, env: ENVS.sunset,
    update(lt) { pose(E.v, REGAL, lt, { wind: 0.6 }); const k = 0.4 + smooth(range(lt, 0.4, 1.4)) * 0.6; setEyes(E.v, k); const f = wpos(E.v, 0, 1.75, 0.05); PL(0, f.clone().add(v3(0, 0, 0.3)), 0xff2020, 1.5, k * 1.4);
      aim(camera, f.clone().add(v3(0.15, 0.02, 1.4 - lt * 0.35)), f); } };
}

// ---------------------------------------------------------------- S6 — THE NIGHT AWAKENS
function nightCast() {
  const E = balconyCast('storm'); E.ag.position.z = -8.6;
  const N = 900; const bats = new Swarm(N, { seed: 5, scale: 4.5 }); E.scene.add(bats.group); const R = rng(17);
  const seeds = [...Array(N)].map(() => [R(), R(), R(), R()]);
  const smoke = []; for (let i = 0; i < 6; i++) { const s = crimsonSmoke({ origin: v3((R() - 0.5) * 90, 3, 60 + R() * 100), spread: v3(14, 3, 14), size: 1, big: true, count: 120, life: 3.5, vel: v3(0, 2, 0), seed: 100 + i, opacity: 0.5 }); E.scene.add(s); smoke.push(s); }
  return { ...E, bats, seeds, smoke };
}
function stormSky(E, k) { const S = E.sky.material.uniforms; const a = SKIES.sunset, b = SKIES.storm; for (const [key, u] of [['horizon', 'uHorizon'], ['top', 'uTop'], ['cloud', 'uCloudCol'], ['cloudLit', 'uCloudLit'], ['sunCol', 'uSunCol']]) S[u].value.copy(lerpC(a[key], b[key], k)); }
function V18() { // he raises his hand — the sky turns crimson
  const E = balconyCast('sunset'); const camera = cam(44);
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.14, bloom: 0.55, bloomT: 0.6 }, env: ENVS.sunset,
    update(lt) { const k = smooth(range(lt, 0.4, 2.0)); stormSky(E, k); pose(E.v, mixPose(REGAL, RAISE, smooth(range(lt, 0.0, 0.7))), lt, { wind: 0.6 + k * 0.4, lift: k * 0.25 }); setEyes(E.v, 1);
      PL(0, E.v.root.position.clone().add(v3(0, 3, 2)), 0xff3030, 14, pulse(lt, 1.6, 0.06) * 5 + k);
      const b = E.v.root.position; aim(camera, v3(b.x + 2.4, b.y - 1.2, b.z + 7.5), v3(b.x, b.y + 2.6, b.z)); } };
}
function batFlow(E, lt, from, mode) { // mode: 'towers' | 'self' | 'charge'
  const tops = E.castle.userData.tops.map(t => t.clone().add(E.castle.position)); const tgt = v3(0, 4, 110);
  E.bats.set(lt, (i) => { const [a, b, c, d] = E.seeds[i]; const t = lt - from - a * 1.2; if (t < 0) return { on: false };
    if (mode === 'towers') { const s = tops[i % tops.length]; const ang = b * 6.28 + t * (0.6 + c); const r = 4 + t * (10 + d * 14); return { on: true, p: s.clone().add(v3(Math.cos(ang) * r, t * (3 + c * 4) + Math.sin(t * 3 + a * 9) * 2, Math.sin(ang) * r)), d: v3(-Math.sin(ang), 0.3, Math.cos(ang)) }; }
    const s = E.v.root.position.clone().add(v3(0, 1.1, 0)); const u = clamp(t / 2.6); const p = s.clone().lerp(tgt.clone().add(v3((b - 0.5) * 70, (c - 0.5) * 6, (d - 0.5) * 60)), easeIn(u)); p.y += Math.sin(u * Math.PI) * (8 + c * 14) + Math.sin(t * 4 + a * 20) * 1.5; p.x += Math.sin(t * 2.3 + b * 30) * (2 + u * 6);
    return { on: true, p, d: tgt.clone().sub(s), scale: 0.6 + u * 0.8 }; });
}
function V19() { // thousands of bats pour from the towers
  const E = nightCast(); const camera = cam(48);
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.14, bloom: 0.55, bloomT: 0.6 }, env: ENVS.storm,
    update(lt) { batFlow(E, lt, 0.0, 'towers'); pose(E.v, RAISE, lt, { wind: 1, lift: 0.3 }); setEyes(E.v, 1); const c = E.castle.position;
      PL(0, c.clone().add(v3(0, 60, 30)), 0xff2030, 80, pulse(lt % 1.3, 0.2, 0.05) * 5); aim(camera, v3(lerp(-26, -18, lt / 2), lerp(62, 70, lt / 2), lerp(-60, -80, lt / 2)), c.clone().add(v3(0, 66, 0))); } };
}
function V20() { // he becomes a swarm of bats
  const E = nightCast(); const camera = cam(42); const sm = crimsonSmoke({ origin: E.v.root.position.clone().add(v3(0, 1.0, 0)), spread: v3(0.6, 1.0, 0.6), size: 0.9, count: 220, life: 1.4 }); E.scene.add(sm);
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.14, bloom: 0.6, bloomT: 0.58 }, env: ENVS.storm,
    update(lt) { const T0 = 0.55; sm.material.uniforms.uStart.value = T0 - 0.1; const g = smooth(range(lt, T0 - 0.15, T0 + 0.25)); E.v.root.visible = g < 0.98; E.v.root.scale.setScalar(1 - g * 0.5); pose(E.v, RAISE, lt, { wind: 1, lift: 0.4 }); setEyes(E.v, 1);
      batFlow(E, lt, T0 - 0.2, 'charge'); PL(0, E.v.root.position.clone().add(v3(0, 1.2, 1)), 0xff2030, 8, pulse(lt, T0, 0.15) * 4 + 0.6);
      const b = E.v.root.position; aim(camera, v3(b.x + 1.3, b.y + 1.5, b.z + 4.4), v3(b.x, b.y + 1.25, b.z + 0.5)); } };
}
function V21() { // the swarm sweeps into the army
  const E = nightCast(); const camera = cam(50); E.v.root.visible = false;
  const im = E.host, base = E.pos; const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = v3(), pp = v3(); const mats = base.map((_, i) => { const m = new THREE.Matrix4(); im.getMatrixAt(i, m); return m; });
  const R = rng(21); const fall = base.map(() => [R(), R() < 0.5 ? 1 : -1, R()]);
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.14, bloom: 0.55, bloomT: 0.6 }, env: ENVS.storm,
    update(lt) { batFlow(E, lt + 1.2, 0, 'charge'); E.smoke.forEach((s, i) => s.material.uniforms.uStart.value = 1.0 + i * 0.35);
      const front = 40 + (lt - 0.9) * 55; for (let i = 0; i < base.length; i++) { const p = base[i]; const z = p.z + E.ag.position.z; const k = clamp((front - z) / 12) * (fall[i][0] < 0.7 ? 1 : 0); if (k <= 0) { im.setMatrixAt(i, mats[i]); continue; } mats[i].decompose(pp, q, sc); const qq = new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), fall[i][1] * k * 1.4).premultiply(q); M4.compose(pp, qq, sc); im.setMatrixAt(i, M4); }
      im.instanceMatrix.needsUpdate = true; E.torches.forEach((g, i) => { const z = g.position.z + E.ag.position.z; g.material.opacity = z < front - 6 ? 0.15 : 0.85; });
      PL(0, v3(0, 10, front), 0xff2030, 40, 2.2); const u = ease(range(lt, 0, 4.2)); aim(camera, v3(lerp(-20, -10, u), lerp(14, 6, u), lerp(40, 110, u)), v3(0, lerp(8, 3, u), lerp(70, 140, u))); shake(camera, 0.04, lt); } };
}

// ---------------------------------------------------------------- S7 — THE EVOLUTION
function dawnCast() {
  const E = castleWorld({ sky: 'dawn' }); const R = rng(41);
  const fallen = []; for (let i = 0; i < 500; i++) { const x = (R() - 0.5) * 90, z = 50 + R() * 120; fallen.push(v3(x, E.hf(x, z), z)); }
  const host = army(fallen, fallen.map(() => 0xa0a0a8), { yaw: 0, seed: 12 }); const M4 = new THREE.Matrix4(); for (let i = 0; i < fallen.length; i++) { M4.compose(fallen[i].clone().add(v3(0, 0.2, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 * (R() < 0.5 ? 1 : -1), R() * 6, 0)), v3(1, 1, 1)); host.setMatrixAt(i, M4); } host.instanceMatrix.needsUpdate = true; E.scene.add(host);
  for (let i = 0; i < 8; i++) { const x = (R() - 0.5) * 80, z = 60 + R() * 100; E.scene.add(smokeP({ origin: v3(x, E.hf(x, z), z), size: 5, count: 30, opacity: 0.4, seed: 500 + i, vel: v3(0.5, 3, 0) })); }
  const v = buildVampire('king'); const P = v3(0, E.hf(0, 100), 100); v.root.position.copy(P); E.scene.add(v.root);
  const aura = crimsonAura({ origin: P.clone().add(v3(0, 0.1, 0)), spread: v3(0.9, 0.1, 0.9), count: 300 }); E.scene.add(aura); const ag = glow(0xff2030, 6, 0); ag.position.copy(P).add(v3(0, 1.2, 0)); E.scene.add(ag);
  const kin = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const e = i % 3 === 0 ? buildElder({ seed: 60 + i, robe: 0xa898b8 }) : buildVampire('noble', { hair: [0x403040, 0x302a2a, 0x5a4a5a][i % 3] }); const r = 4.2; e.root.position.set(P.x + Math.sin(a) * r * 2.2, P.y, P.z + Math.cos(a) * r * 2.2); faceTo(e, P); E.scene.add(e.root); kin.push({ e, a, r }); }
  return { ...E, v, P, aura, ag, kin };
}
const DAWN_G = { sat: 1.02, contrast: 1.1, bloom: 0.5, bloomT: 0.64 };
function V22() { // by sunrise — royal armour, a crimson aura
  const E = dawnCast(); const camera = cam(42); E.kin.forEach(k => k.e.root.visible = false);
  return { scene: E.scene, camera, grade: DAWN_G, env: ENVS.dawn,
    update(lt) { pose(E.v, REGAL, lt, { wind: 0.5 }); setEyes(E.v, 1); const k = smooth(range(lt, 0.2, 1.4)); E.aura.material.uniforms.uOpacity.value = k; E.ag.material.opacity = k * 0.35;
      PL(0, E.P.clone().add(v3(0, 1.4, 0.8)), 0xff2030, 6, k * 2); const a = 0.6 - lt * 0.25; aim(camera, E.P.clone().add(v3(Math.sin(a) * 4.0, 0.55 + lt * 0.1, Math.cos(a) * 4.0)), E.P.clone().add(v3(0, 1.35, 0))); } };
}
function V23() { // even the oldest vampires kneel
  const E = dawnCast(); const camera = cam(48);
  return { scene: E.scene, camera, grade: DAWN_G, env: ENVS.dawn,
    update(lt) { pose(E.v, REGAL, lt, { wind: 0.5 }); setEyes(E.v, 1); E.aura.material.uniforms.uOpacity.value = 1; E.ag.material.opacity = 0.35;
      E.kin.forEach(({ e, a, r }, i) => { const u = smooth(range(lt, 0, 1.8 + i * 0.05)); const rr = lerp(r * 2.2, r, u); e.root.position.set(E.P.x + Math.sin(a) * rr, E.P.y, E.P.z + Math.cos(a) * rr); const kn = smooth(range(lt, 1.7 + (i % 4) * 0.15, 2.4 + (i % 4) * 0.15)); const wp = e.cape ? vWalk(lt * 1.6 + i, {}) : { hipY: 0.98 }; applyPose(e, mixPose(u < 1 ? wp : (e.cape ? STAND : { hipY: 0.98 }), KNEEL, kn)); if (e.cape) updateCape(e, lt, { wind: 0.3 }); if (e.butt) setJiggle(e, {}); setEyes(e, 0.5); });
      PL(0, E.P.clone().add(v3(0, 1.4, 0.8)), 0xff2030, 6, 2); const u = ease(range(lt, 0, 3.8)); aim(camera, E.P.clone().add(v3(lerp(-7, -9.5, u), lerp(4.5, 7.5, u), lerp(9, 6, u))), E.P.clone().add(v3(0, 0.9, 0))); } };
}

// ---------------------------------------------------------------- S8 — THE VAMPIRE KING
function throneCast() {
  const E = throneRoom(); const v = buildVampire('king'); v.root.position.set(0, 1.8, E.tz - 0.4); v.root.rotation.y = 0; E.scene.add(v.root);
  const aura = crimsonAura({ origin: v3(0, 1.9, E.tz - 0.4), spread: v3(1.0, 0.2, 0.8), count: 200, vel: v3(0, 1.2, 0) }); E.scene.add(aura);
  return { ...E, v, aura };
}
function throneLights(E, lt) { E.flames.forEach((f, i) => { if (i % 3 === 0 && i < 12) PL(1 + (i / 3) % 4, f.p, 0xffa050, 10, 1.8 + Math.sin(lt * 11 + i) * 0.1); }); PL(5, v3(0, 6, E.tz + 6), 0xffb080, 14, 1.4); }
const THRONE_G = { sat: 1.03, contrast: 1.14, bloom: 0.55, bloomT: 0.6 };
function V24() { // the Vampire King on his black throne — the shadow of wings
  const E = throneCast(); const camera = cam(48);
  return { scene: E.scene, camera, grade: THRONE_G, env: ENVS.throne,
    update(lt) { throneLights(E, lt); pose(E.v, SIT, lt, { wind: 0.05, sit: 1 }); setEyes(E.v, 0.9); E.aura.material.uniforms.uOpacity.value = 0.6;
      const k = smooth(range(lt, 1.0, 3.2)); E.wings.material.uniforms.uOpacity.value = k * 0.85; E.rim.material.uniforms.uOpacity.value = k * 0.5; E.wings.scale.set(0.5 + k * 0.5, 0.6 + k * 0.4, 1); E.rim.scale.copy(E.wings.scale);
      PL(0, v3(0, 3.2, E.tz + 1.5), 0xff2030, 7, 1.2 + k); const u = ease(range(lt, 0, 3.8)); aim(camera, v3(lerp(0.9, 0.4, u), lerp(2.6, 3.0, u), E.tz + lerp(11, 6, u)), v3(0, lerp(4.4, 3.4, u), E.tz - 1.0)); } };
}
function V25() { // the one creature even the darkness feared
  const E = throneCast(); const camera = cam(40);
  return { scene: E.scene, camera, grade: { ...THRONE_G, bloom: 0.6 }, env: ENVS.throne,
    update(lt) { throneLights(E, lt); pose(E.v, SIT, lt, { wind: 0.05, sit: 1 }); const k = 0.9 + smooth(range(lt, 1.8, 2.6)) * 0.1 + pulse(lt, 2.4, 0.1) * 0.4; setEyes(E.v, Math.min(1, k)); E.aura.material.uniforms.uOpacity.value = 0.7;
      E.wings.material.uniforms.uOpacity.value = 0.85; E.rim.material.uniforms.uOpacity.value = 0.5 + pulse(lt, 2.4, 0.15) * 0.4; const f = wpos(E.v, 0, 1.73 - 0.34, 0.08);
      PL(0, f.clone().add(v3(0, 0, 0.6)), 0xff2030, 2.5, 1.0 + pulse(lt, 2.4, 0.12) * 2); const u = ease(range(lt, 0, 3.6)); aim(camera, f.clone().add(v3(0, lerp(0.6, 0.02, u), lerp(6.5, 0.62, u))), f.clone().add(v3(0, lerp(0.4, 0, u), 0))); } };
}

export const SHOTS_VAMPIRE = { V01, V02, V03, V04, V05, V06, V07, V08, V09, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19, V20, V21, V22, V23, V24, V25 };
