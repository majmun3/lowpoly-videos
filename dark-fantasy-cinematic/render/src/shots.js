// DARK FANTASY CINEMATIC — 8 shots, ~30 s, no text, no audio.
import { THREE, v3, setPL, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, flat } from '/the-last-ember/render/src/engine.js';
import { applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { strikePoses, standToStrike, hammering } from '/born-a-blacksmith/render/src/smith.js';
import { village, setFire } from '/born-a-blacksmith/render/src/forge.js';
import { buildWizard, setSkirt, holdStaff, setCrystal, setRunes, setEyes } from '/cast-spells/render/src/wizard.js';
import { buildKnight, kStand, setGrip, updateCape, buildSword, tankard, reach } from './knight.js';
import { portalWorld, PURPLE_ENV, knightsHall, waveBanners, purpleCastle, Rain, abandonedVillage, cathedral, armoryHall } from './worlds.js';
import { ENVS } from '/born-as-a-vampire/render/src/vworld.js';

const cam = (fov, near = 0.03, far = 6000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
const PL = (i, p, c, r, k) => setPL(i, p, c, r, k * 0.5);
const wp = (o, x, y, z) => { let top = o; while (top.parent) top = top.parent; top.updateMatrixWorld(true); return o.localToWorld(v3(x, y, z)); };
const G_PURPLE = { sat: 1.05, contrast: 1.1, bloom: 0.42, bloomT: 0.66 };

// ---------------------------------------------------------------- 1 — THE BLACKSMITH
const FORGE_ENV = { fog: [8, 80], fogCol: 0x1a1428, hfog: [0, 2, 0.3, 0.03], lightDir: v3(-0.3, -0.6, -0.7), lightCol: 0x8a78c8, ambient: 0x3e3654, rim: 0xb080ff, fillDir: v3(0.3, -0.2, 0.9), fillCol: 0x2a2440 };
function F01() {
  const V = village({ night: true }); const S = V.smithy.userData; S.anvil.rotation.y = Math.PI; const camera = cam(40);
  V.scene.traverse(o => { if (o.isPoints && o.material.uniforms.uSize && o.material.uniforms.uSize.value > 1) o.visible = false; });
  V.M.win.uniforms.uColor.value.set(0x4a3060); if (S.lantern.parent) S.lantern.parent.visible = false;
  const top = S.anvil.position.clone().add(S.anvil.userData.top); const target = top.clone().add(v3(-0.03, 0.012, 0));
  const bladeM = mat({ color: 0xd8b8ff, emissive: 0x7030d0, unlit: true }); const sword = buildSword({ len: 0.9, blade: bladeM }); V.scene.add(sword);
  const hilt = v3();   // placed below, once the smith stands at the anvil (within reach of his left hand)
  const bg = glow(0xa050ff, 0.7, 0.4); bg.position.copy(top).add(v3(-0.15, 0.03, 0)); V.scene.add(bg);
  const k = buildKnight('smith', { hammer: true }); V.scene.add(k.root); const P = strikePoses({ k: 1, lean: 0.28, leftArm: { armL: [-0.9, 0.35, -0.1], foreL: [-0.7, 0.2, 0] } }); standToStrike(k, P, target, Math.PI); k.P = P;
  { applyPose(k, P.REST); V.scene.updateMatrixWorld(true); const sh = k.armL.getWorldPosition(v3()); const dir = v3(sh.x - target.x, 0, sh.z - target.z).normalize(); let best = null;
    for (let r = 0.18; r < 0.8; r += 0.01) { const h = target.clone().addScaledVector(dir, r); h.y = top.y + 0.02 + Math.max(0, r - 0.3) * 0.35; if (sh.distanceTo(h) < 0.6) { best = h; break; } }
    hilt.copy(best || target.clone().addScaledVector(dir, 0.5)); sword.position.copy(hilt); sword.lookAt(target.clone().add(v3(0, 0.016, 0)).addScaledVector(dir, -0.02)); }
  const sp = particles({ mode: 'burst', count: 170, origin: target.clone(), spread: v3(0.05, 0.02, 0.05), vel: v3(0.3, 1.9, 0.6), life: 0.6, size: 0.035, c0: 0xffffff, c1: 0xd090ff, c2: 0x6020c0, seed: 3201, opacity: 1, start: -9, swirl: 0.3, fogMix: 0.05 }); V.scene.add(sp);
  const sp2 = particles({ mode: 'burst', count: 90, origin: target.clone(), spread: v3(0.04, 0.02, 0.04), vel: v3(-0.2, 1.5, 0.4), life: 0.45, size: 0.025, c0: 0xffe8a0, c1: 0xff9030, c2: 0x801000, seed: 3202, opacity: 1, start: -9, swirl: 0.3, fogMix: 0.05 }); V.scene.add(sp2);
  return { scene: V.scene, camera, grade: G_PURPLE, env: FORGE_ENV,
    update(lt) { const f = setFire(V.smithy, 1, lt); PL(0, S.firePos.clone().add(v3(0.4, 0.6, 1.0)), 0xff8a38, 7, f * 1.3); PL(1, v3(1.0, 2.6, -1.0), 0x9060ff, 6, 0.9);
      const r = hammering(k, P, lt, { t0: -0.35, period: 1.0 }); sp.material.uniforms.uStart.value = r.last; sp2.material.uniforms.uStart.value = r.last;
      const er = reach(k, 'L', hilt, { off: v3(0.0, -0.1, 0.02) }); if (globalThis.DBG) console.error('reach err', er.toFixed(3)); setGrip(k, 'L', 1.0); const bp = bg.position;
      const hit = pulse(lt - r.last, 0.03, 0.07); bladeM.uniforms.uColor.value.setRGB(0.72 + hit * 0.28, 0.55 + hit * 0.4, 0.95 + hit * 0.05); bg.material.opacity = 0.35 + hit * 0.4; PL(2, bp.clone().add(v3(0, 0.25, 0.2)), 0xc080ff, 2.2, 0.8 + hit * 3);
      const u = ease(range(lt, 0, 4)); const c = target.clone(); if (globalThis.DBG) { aim(camera, hilt.clone().add(v3(0.5, 0.5, -0.9)), hilt.clone().add(v3(-0.1, 0.1, 0))); return; } aim(camera, c.clone().add(v3(lerp(-1.6, -1.05, u), lerp(-0.25, -0.12, u), lerp(-2.7, -1.75, u))), c.clone().add(v3(0.1, lerp(0.6, 0.52, u), 0.4))); } };
}

// ---------------------------------------------------------------- 2 & 8 — THE WIZARD AND THE PORTAL
function portalCast() {
  const E = portalWorld(); const w = buildWizard(); w.root.position.set(0, 0, E.Z + 10); w.root.rotation.y = Math.PI; E.scene.add(w.root); E.scene.add(w.staff);
  w.M.mantle.uniforms.uColor.value.set(0x6878ff);
  const tipGlow = glow(0xb060ff, 0.5, 0); E.scene.add(tipGlow);
  const gather = particles({ mode: 'emit', count: 140, origin: v3(), spread: v3(0.35, 0.35, 0.35), vel: v3(0, 0.3, 0), life: 0.8, size: 0.05, c0: 0xf0d8ff, c1: 0xa050ff, c2: 0x4010a0, seed: 3210, swirl: 2.6, opacity: 0, fogMix: 0.1 }); E.scene.add(gather);
  return { ...E, w, tipGlow, gather };
}
const W_STAND = { hipY: 1.0, armR: [-0.35, 0, 0.12], foreR: [-0.7, 0, 0], armL: [0.05, 0, -0.12], foreL: [-0.2, 0, 0], neck: [-0.12, 0, 0] };
const W_RAISE = { hipY: 1.0, armR: [-2.55, 0, 0.22], foreR: [-0.15, 0, 0], armL: [-0.25, 0, -0.35], foreL: [-0.4, 0, 0], neck: [-0.3, 0, 0], head: [-0.1, 0, 0], spine: [-0.05, 0, 0] };
function wizardAt(E, lt, raise, power) {
  const w = E.w; applyPose(w, mixPose(W_STAND, W_RAISE, raise)); setSkirt(w); w.skirt.rotation.z = Math.sin(lt * 1.3) * 0.04; w.skirt.rotation.x += Math.sin(lt * 1.7) * 0.03; w.hat.rotation.z = Math.sin(lt * 1.1) * 0.03;
  const tip = holdStaff(w, v3(0, 1, -0.05 - raise * 0.35).normalize(), lt); setCrystal(w, 0.4 + power * 0.6, new THREE.Color(0x60ff90).lerp(new THREE.Color(0xc070ff), power).getHex()); setRunes(w, 0.1 + power * 0.5);
  E.tipGlow.position.copy(tip); E.tipGlow.material.opacity = power * 0.9; const s = 0.4 + power * 1.6; E.tipGlow.scale.set(s, s, 1);
  const gu = E.gather.material.uniforms; gu.uOrigin.value.copy(tip); gu.uOpacity.value = power; gu.uSpread.value.setScalar(0.25 + (1 - power) * 0.5);
  return tip;
}
function portalLights(E, lt, k) { const c = v3(0, E.GH / 2, E.Z + 3); PL(0, c, 0xa050ff, 40, 1.4 * k); PL(1, v3(0, 3, E.Z + 8), 0xc080ff, 14, 0.9 * k); E.braziers.forEach((p, i) => PL(2 + i, p.clone().add(v3(0, 0.8, 0)), 0xb060ff, 6, 1.1 + Math.sin(lt * 11 + i) * 0.15)); }
function P02() {
  const E = portalCast(); const camera = cam(46);
  return { scene: E.scene, camera, grade: G_PURPLE, env: PURPLE_ENV,
    update(lt) { const raise = smooth(range(lt, 0.4, 1.8)), power = smooth(range(lt, 1.2, 3.4)); const tip = wizardAt(E, lt, raise, power);
      const k = 0.55 + power * 0.45 + Math.sin(lt * 5) * 0.04 * power; E.pm.uniforms.uK.value = k; const sc = 1 + power * 0.06 + Math.sin(lt * 4) * 0.008 * power; E.portal.scale.set(sc, sc, 1); E.halo.material.opacity = 0.1 + power * 0.12; E.rim.material.uniforms.uOpacity.value = 0.12 + power * 0.18;
      portalLights(E, lt, 0.7 + power * 0.5); PL(4, tip, 0xc080ff, 3, power * 2.5);
      const u = ease(range(lt, 0, 4)); const w = E.w.root.position; aim(camera, w.clone().add(v3(lerp(1.1, 0.55, u), lerp(0.9, 1.1, u), lerp(5.4, 3.4, u))), w.clone().add(v3(0, lerp(2.4, 2.8, u), -8))); } };
}
function P08() {
  const E = portalCast(); const camera = cam(48);
  return { scene: E.scene, camera, grade: { ...G_PURPLE, bloom: 0.42, bloomT: 0.66 }, env: PURPLE_ENV,
    update(lt) { const tip = wizardAt(E, 3 + lt, 1, 1); const k = 1.0 + smooth(range(lt, 0, 2.2)) * 0.4; E.pm.uniforms.uK.value = k; E.portal.scale.set(1.06, 1.06, 1); E.halo.material.opacity = 0.22 + smooth(range(lt, 0, 2)) * 0.12; E.rim.material.uniforms.uOpacity.value = 0.34;
      portalLights(E, lt, 1.25); PL(4, tip, 0xc080ff, 3, 2.5); const rv = smooth(range(lt, 0.6, 2.6)); PL(5, v3(0, 20, E.Z + 24), 0x9070e0, 60, rv * 1.6);
      const u = ease(range(lt, 0, 3.4)); const w = E.w.root.position; aim(camera, w.clone().add(v3(lerp(0.4, 0, u), lerp(1.6, 7, u), lerp(3.0, 44, u))), v3(0, lerp(8, 13, u), E.Z)); } };
}

// ---------------------------------------------------------------- 3 — THE KNIGHTS' FEAST
const SIT = { hipY: 0.52, thighL: [-1.5, 0, -0.06], shinL: [1.45, 0, 0], thighR: [-1.5, 0, 0.06], shinR: [1.45, 0, 0], spine: [0.08, 0, 0], neck: [0.05, 0, 0] };
const ARMS_REST = { armL: [-0.55, 0.2, -0.12], foreL: [-1.05, 0.1, 0], armR: [-0.55, -0.2, 0.12], foreR: [-1.05, -0.1, 0], handR: [0.45, 0, 0] };
const DRINK = { armR: [-1.5, -0.3, 0.2], foreR: [-1.8, -0.1, 0], handR: [0.1, 0, 0], neck: [-0.25, 0, 0], head: [-0.15, 0, 0], spine: [-0.06, 0, 0] };
function K03() {
  const E = knightsHall(); const camera = cam(42); const ks = []; const tks = [];
  [-1.15, 0, 1.15].forEach((x, i) => { const k = buildKnight('crusader'); k.root.position.set(x, 0, -1.05); k.root.rotation.y = i === 0 ? 0.12 : i === 2 ? -0.12 : 0; E.scene.add(k.root); ks.push(k); const t = tankard({ wood: i === 1 }); k.handR.add(t); t.position.set(0.0, -0.16, 0.06); t.rotation.set(-Math.PI / 2 + 0.0, 0, 0); tks.push(t); });
  return { scene: E.scene, camera, grade: { sat: 1.05, contrast: 1.1, bloom: 0.38, bloomT: 0.7 }, env: { fog: [8, 60], fogCol: 0x141634, hfog: [0, 2, 0.2, 0.03], lightDir: v3(0.3, -0.6, -0.7), lightCol: 0x7080e0, ambient: 0x3e4478, rim: 0x8090ff, fillDir: v3(-0.3, -0.2, 0.9), fillCol: 0x2a2c50 },
    update(lt) { waveBanners(E, lt); const fl = 0.9 + Math.sin(lt * 17) * 0.06 + Math.sin(lt * 9.3) * 0.05; E.flame.material.opacity = 0.9 * fl; PL(0, E.candle.clone().add(v3(0, 0.2, 0.2)), 0xffb060, 3.5, 2.2 * fl); E.sconces.forEach((p, i) => PL(1 + i, p, 0xff9040, 5, 1.1 + Math.sin(lt * 11 + i) * 0.12)); PL(3, v3(0, 4, 2), 0x6070ff, 9, 0.6);
      // left: lifts his tankard and drinks; centre: sets his down; right: turns his helm to the others and gestures
      const d = smooth(range(lt, 0.4, 1.3)) * (1 - smooth(range(lt, 2.4, 3.3))); applyPose(ks[0], mixPose({ ...SIT, ...ARMS_REST }, { ...SIT, ...ARMS_REST, ...DRINK }, d));
      const down = smooth(range(lt, 0.6, 1.5)); applyPose(ks[1], mixPose({ ...SIT, ...ARMS_REST, armR: [-1.0, -0.2, 0.12], foreR: [-1.3, -0.1, 0], handR: [0.3, 0, 0] }, { ...SIT, ...ARMS_REST }, down));
      const turn = smooth(range(lt, 0.9, 1.7)), ges = smooth(range(lt, 2.0, 2.5)) * (1 - smooth(range(lt, 3.2, 3.7))); applyPose(ks[2], { ...SIT, ...ARMS_REST, neck: [0.05, 0.55 * turn, 0], head: [0, 0.25 * turn, 0], armL: [-0.55 - ges * 0.55, 0.2 + ges * 0.3, -0.12 - ges * 0.25], foreL: [-1.05 - ges * 0.35, 0.1, 0], handL: [-ges * 0.6, 0, -ges * 0.4] });
      ks.forEach((k, i) => { setGrip(k, 'R', 0.95); setGrip(k, 'L', i === 2 ? 0.4 - ges * 0.35 : 0.5); });
      const u = ease(range(lt, 0, 4)); aim(camera, v3(lerp(-1.9, 1.7, u), lerp(1.3, 1.2, u), 2.55), v3(lerp(-0.6, 0.5, u), 1.05, -0.8)); } };
}

// ---------------------------------------------------------------- 4 — THE FORGOTTEN CASTLE
function C04() {
  const E = purpleCastle(); const camera = cam(46); const c = E.castle.position;
  return { scene: E.scene, camera, grade: { sat: 1.08, contrast: 1.12, bloom: 0.45, bloomT: 0.64, gain: [1.2, 1.12, 1.25], lift: [0.03, 0.02, 0.05] }, env: ENVS.purple,
    update(lt) { const fl = pulse(lt, 2.6, 0.06) + pulse(lt, 2.78, 0.04) * 0.6; PL(0, c.clone().add(v3(80, 160, -40)), 0xd0a0ff, 400, fl * 3);
      const u = ease(range(lt, 0, 4)); aim(camera, v3(lerp(-70, -40, u), lerp(115, 92, u), lerp(170, 40, u)), c.clone().add(v3(lerp(0, 4, u), lerp(46, 50, u), 0))); } };
}

// ---------------------------------------------------------------- 5 — THE LONE KNIGHT
function L05() {
  const E = abandonedVillage(); const camera = cam(46); const k = buildKnight('dark', { capeLen: 1.3 }); E.scene.add(k.root); const rain = new Rain(1800, { box: v3(14, 10, 14) }); E.scene.add(rain.m);
  const sword = buildSword({ len: 0.85 }); k.pelvis.add(sword); sword.position.set(-0.2, 0.05, -0.02); sword.rotation.set(Math.PI * 0.62, 0, 0.12);
  const CYC = 1.38, SPD = 0.9;
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.1, bloom: 0.38, bloomT: 0.7 }, env: { fog: [6, 120], fogCol: 0x1c1e2e, hfog: [0, 2, 0.4, 0.03], lightDir: v3(-0.3, -0.6, -0.7), lightCol: 0x8a90c8, ambient: 0x56587a, rim: 0xb0a0f0, fillDir: v3(0.3, -0.2, 0.9), fillCol: 0x2a2a40 },
    update(lt) { const x = -45 + lt * SPD, ph = lt * SPD / CYC; k.root.position.set(x, 0, 6.3); k.root.rotation.y = Math.PI / 2; const wk = walkPose(ph, { stride: 0.42, hunch: 0.06, hip: 0.98 }); applyPose(k, { ...wk, armL: [Math.sin(ph * 6.28) * 0.22, 0, -0.14], armR: [-Math.sin(ph * 6.28) * 0.22, 0, 0.14], foreL: [-0.25, 0, 0], foreR: [-0.25, 0, 0] }); setGrip(k, 'L', 0.7); setGrip(k, 'R', 0.7); updateCape(k, lt, { wind: 0.5, walk: 1, stepRate: SPD / CYC });
      E.torches.forEach((p, i) => PL(i, p, 0xff9040, 11, 1.8 + Math.sin(lt * 12 + i) * 0.15)); PL(5, k.root.position.clone().add(v3(-1.5, 4, 2)), 0x8a90d0, 12, 0.9); rain.update(lt, camera.position.clone().add(v3(3, 0, 0)));
      const p = k.root.position; aim(camera, p.clone().add(v3(-4.4 + lt * 0.15, 0.75, 0.9)), p.clone().add(v3(3.5, 1.35, -0.3))); } };
}

// ---------------------------------------------------------------- 6 — THE ANCIENT TEMPLE
function T06() {
  const E = cathedral(); const camera = cam(48);
  return { scene: E.scene, camera, grade: { sat: 1.06, contrast: 1.1, bloom: 0.45, bloomT: 0.64 }, env: { ...ENVS.hall, fog: [10, 140], fogCol: 0x1c1430, lightCol: 0xa890ff, ambient: 0x403860, rim: 0xb090ff },
    update(lt) { const b = Math.sin(lt * 1.4) * 0.12; E.crystal.position.y = E.cp.y + b; E.inner.position.y = E.cp.y + b; E.crystal.rotation.y = lt * 0.9; E.inner.rotation.y = -lt * 0.6; E.cg.position.y = E.cp.y + b; E.cg.material.opacity = 0.5 + Math.sin(lt * 3) * 0.08;
      E.rings.forEach((r, k) => { r.position.y = E.cp.y + b; r.rotation.set(Math.PI / 2 + Math.sin(lt * 0.6 + k) * 0.5 + k * 0.4, lt * (0.4 + k * 0.25) * (k % 2 ? -1 : 1), lt * 0.3 * (k - 1)); });
      PL(0, E.cp.clone().add(v3(0, b, 1)), 0xa060ff, 16, 2.4); PL(1, v3(0, 10, -30), 0x8060d0, 30, 0.8);
      const u = ease(range(lt, 0, 4)); aim(camera, v3(lerp(1.0, 0.4, u), lerp(2.6, 3.8, u), lerp(-12, -35, u)), E.cp.clone().add(v3(0, lerp(1.0, 0.2, u), 0))); } };
}

// ---------------------------------------------------------------- 7 — THE ARMORY
function A07() {
  const E = armoryHall(); const camera = cam(46); const k = buildKnight('dark', { capeLen: 1.3 }); E.scene.add(k.root); const CYC = 1.38, SPD = 0.75;
  return { scene: E.scene, camera, grade: { sat: 1.04, contrast: 1.1, bloom: 0.4, bloomT: 0.68 }, env: { ...ENVS.hall, fog: [8, 80], fogCol: 0x161228, lightCol: 0x9a88e8, ambient: 0x403a5c, rim: 0xb090ff },
    update(lt) { E.torches.forEach((p, i) => PL(i, p, 0xff9040, 7, 1.2 + Math.sin(lt * 12 + i) * 0.12)); PL(4, v3(E.wallX - 1.6, 3.2, -6 - lt * 2.2), 0xa070ff, 7, 1.4); PL(5, v3(0, 5, -8), 0x8070c0, 14, 0.8);
      const z = -13.5 + lt * SPD; const ph = lt * SPD / CYC; k.root.position.set(1.9, 0, z); k.root.rotation.y = 0; applyPose(k, { ...walkPose(ph, { stride: 0.42, hunch: 0.05, hip: 0.98 }), armL: [Math.sin(ph * 6.28) * 0.2, 0, -0.14], armR: [-Math.sin(ph * 6.28) * 0.2, 0, 0.14] }); updateCape(k, lt, { wind: 0.15, walk: 1, stepRate: SPD / CYC });
      const u = ease(range(lt, 0, 3)); const cz = lerp(-3.0, -9.5, u); aim(camera, v3(-0.9, 1.55, cz), v3(E.wallX, 1.6, cz - 2.8)); } };
}

export const SHOTS_DFC = { F01, P02, K03, C04, L05, T06, A07, P08 };
