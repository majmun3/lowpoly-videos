// TODAY YOU WILL LEARN HOW TO CAST SPELLS — shot list.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, xf, merge, flat } from '/the-last-ember/render/src/engine.js';
import { applyPose, mixPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { buildBrute } from '/born-as-a-goblin/render/src/goblin.js';
import { smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { buildWizard, setSkirt, setRunes, setEyes, holdStaff, setCrystal, runeCircle, auraShell, manaMotes, fireEmit, fireball, setFireball, shockRing, boltPath, Bolt, shieldDome, setShield } from './wizard.js';
import { trainingGround, LESSON_ENV, kingdomHill, HILL_ENV } from './sworld.js';

const cam = (fov, near = 0.05, far = 7000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
function slowmo(lt, a, b, f) { if (lt < a) return lt; if (lt < b) return a + (lt - a) * f; return a + (b - a) * f + (lt - b); }
const faceTo = (j, p) => { j.root.rotation.y = Math.atan2(p.x - j.root.position.x, p.z - j.root.position.z); };
const fwd = (j, x, y, z) => v3(x, y, z).applyQuaternion(j.root.quaternion);   // wizard-local direction -> world
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
const PL = (i, p, c, r, k) => setPL(i, p, c, r, k * 0.5);

const STAND = { ...walkPose(0, { stride: 0, hunch: 0.04 }), armR: [-0.35, 0, 0.12], foreR: [-0.7, 0, 0], armL: [0.05, 0, -0.12], foreL: [-0.2, 0, 0], neck: [-0.05, 0, 0] };
const FOCUS = { ...STAND, armL: [-0.5, 0, -0.55], foreL: [-0.3, 0, 0], neck: [0.12, 0, 0], head: [0.1, 0, 0] };
const PALM = { ...STAND, armL: [-1.05, 0.35, -0.15], foreL: [-1.0, 0.2, 0], neck: [0.15, -0.2, 0], head: [0.1, -0.15, 0] };
const THRUST = { ...STAND, armL: [-1.55, -0.1, -0.05], foreL: [-0.05, 0, 0], chest: [0, -0.25, 0], spine: [0.08, 0, 0], thighL: [-0.35, 0, 0.05], thighR: [0.25, 0, 0], shinR: [0.2, 0, 0] };
const RAISE = { ...STAND, armR: [-2.75, 0, 0.2], foreR: [-0.25, 0, 0], armL: [-0.7, 0, -0.6], foreL: [-0.4, 0, 0], neck: [-0.25, 0, 0], head: [-0.15, 0, 0] };
const POINT = { ...STAND, armR: [-1.5, 0.1, 0.1], foreR: [-0.1, 0, 0], armL: [-0.6, 0, -0.5], foreL: [-0.4, 0, 0], chest: [0, 0.2, 0], thighL: [-0.3, 0, 0.05], thighR: [0.2, 0, 0] };
const SPARK = { ...STAND, armL: [-1.35, 0.6, -0.2], foreL: [-1.1, 0.3, 0], armR: [-0.9, -0.2, 0.15], foreR: [-0.9, 0, 0], neck: [0.05, -0.15, 0] };
const PLANT = { ...STAND, armR: [-1.1, 0, 0.15], foreR: [-0.6, 0, 0], armL: [-1.3, 0, -0.35], foreL: [-0.3, 0, 0], thighL: [-0.3, 0, 0.08], shinL: [0.25, 0, 0], thighR: [0.3, 0, -0.08], hipY: 0.96 };

// ---------------------------------------------------------------- the training ground (shared)
function lessonEnv(o = {}) {
  const E = trainingGround(o); const camera = cam(o.fov ?? 48);
  const w = buildWizard(); E.scene.add(w.root); E.scene.add(w.staff);
  const circle = runeCircle(2.4); E.scene.add(circle);
  const aura = auraShell(1.25); aura.position.set(0, 1.2, 0); E.scene.add(aura);
  const motes = manaMotes({ origin: v3(0, 0.1, 0), spread: v3(4.5, 0.2, 4.5) }); E.scene.add(motes);
  return { ...E, camera, w, circle, aura, motes };
}
function magic(E, k, t, o = {}) {   // the wizard's mana: runes, crystal, aura, circle, motes
  setRunes(E.w, k); setCrystal(E.w, o.crystal ?? k, o.col);
  E.circle.material.uniforms.uOpacity.value = (o.circle ?? k) * 0.9; E.circle.rotation.z = t * 0.4;
  E.aura.material.uniforms.uOpacity.value = (o.aura ?? 0) * (0.07 + 0.02 * Math.sin(t * 3));
  E.motes.material.uniforms.uOpacity.value = o.motes ?? k * 0.8;
}
function pose(E, p, t, dir) { applyPose(E.w, p); setSkirt(E.w); return holdStaff(E.w, dir || fwd(E.w, 0, 1, 0.08), t); }

// W01  HOOK — the staff strikes the ground; a ring of light
function W01() {
  const E = lessonEnv({ fov: 40 });
  const ring = shockRing(0x80fff0); E.scene.add(ring);
  E.scene.add(particles({ mode: 'burst', count: 260, origin: v3(0.35, 0.2, -0.25), start: 0.5, spread: v3(3, 2.5, 3), vel: v3(0, -0.4, 0), life: 1.6, size: 0.05, c0: 0xe0fffc, c1: 0x60e0ff, c2: 0x2040a0, seed: 11, opacity: 1 }));
  E.w.root.rotation.y = Math.PI + 0.35;
  return {
    ...E, grade: { sat: 0.92, contrast: 1.1, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const lift = smooth(range(lt, 0, 0.35)) * (1 - easeIn(range(lt, 0.35, 0.5)));
      const tip = pose(E, { ...STAND, armR: [-0.35 - lift * 0.6, 0, 0.12], foreR: [-0.7 - lift * 0.4, 0, 0] }, lt);
      E.w.staff.position.y += lift * 0.25;
      const hit = range(lt, 0.5, 1.6), k = 0.3 + pulse(lt, 0.55, 0.25) * 1.4 + smooth(range(lt, 0.6, 2.5)) * 0.5;
      magic(E, Math.min(1.4, k), lt, { circle: smooth(range(lt, 0.5, 1.0)), motes: smooth(range(lt, 0.6, 1.6)) });
      ring.material.uniforms.uOpacity.value = (1 - hit) * (lt > 0.5 ? 0.9 : 0); const rs = 0.3 + hit * 9; ring.scale.set(rs, rs, rs);
      PL(0, tip, 0x80fff0, 4, 0.6 + pulse(lt, 0.55, 0.2) * 2.5);
      const u = ease(range(lt, 0, 3.0));
      aim(E.camera, v3(lerp(0.9, 1.5, u), lerp(1.5, 1.2, u), lerp(-2.6, -4.4, u)), v3(0.2, lerp(1.75, 1.5, u), 0));
      shake(E.camera, pulse(lt, 0.55, 0.12) * 0.04, lt);
    },
  };
}
// W02  the clearing, the tower, mana gathering
function W02() {
  const E = lessonEnv({ fov: 52 });
  const orbs = []; for (let k = 0; k < 8; k++) { const g = glow(0x80fff0, 0.5, 0.8); E.scene.add(g); orbs.push(g); }
  E.w.root.rotation.y = Math.PI - 0.2;
  return {
    ...E, grade: { sat: 0.92, contrast: 1.08, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const tip = pose(E, STAND, lt); magic(E, 0.6 + lt * 0.12, lt, { circle: 0.7 });
      orbs.forEach((g, k) => { const ph = ((lt * 0.35 + k / 8) % 1); const a = k * 0.8 + lt * 2.0; const r = 3.5 * (1 - ph); g.position.set(Math.cos(a) * r, 0.3 + ph * (tip.y - 0.3), Math.sin(a) * r).lerp(tip, ph * ph); g.material.opacity = Math.sin(ph * Math.PI); });
      PL(0, tip, 0x80fff0, 5, 0.8);
      const u = ease(range(lt, 0, 3.2));
      aim(E.camera, v3(lerp(-9, -7, u), lerp(3.2, 2.2, u), lerp(15, 12, u)), v3(13, lerp(7, 5, u), -27));
    },
  };
}
// W03  THE BASICS — mana: the hand on the staff
function W03() {
  const E = lessonEnv({ fov: 34 });
  E.w.root.rotation.y = Math.PI - 0.4;
  const rise = manaMotes({ origin: v3(0.4, 0.1, -0.4), spread: v3(2.2, 0.2, 2.2), vel: v3(0, 1.6, 0), life: 1.4, count: 260, size: 0.035, seed: 21 }); E.scene.add(rise);
  return {
    ...E, grade: { sat: 0.92, contrast: 1.1, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const tip = pose(E, { ...STAND, foreR: [-0.8 - Math.sin(lt * 1.4) * 0.03, 0, 0] }, lt); magic(E, 0.7, lt, { circle: 0.8, motes: 0.5 });
      rise.material.uniforms.uOpacity.value = 0.9;
      E.w.root.updateMatrixWorld(true);
      const h = E.w.handR.localToWorld(v3(0, -0.05, 0.03));
      PL(0, tip, 0x80fff0, 4, 1.0); PL(1, h.clone().add(v3(0, 0.2, 0.3)), 0x80e0ff, 2, 0.6);
      const a = -0.9 + lt * 0.18;
      aim(E.camera, h.clone().add(fwd(E.w, Math.sin(a) * 1.15, 0.2, Math.cos(a) * 1.15)), h.clone().add(v3(0, 0.12, 0)));
    },
  };
}
// W04  focus, breathe, channel — the aura rises, the stones answer
function W04() {
  const E = lessonEnv({ fov: 44 });
  E.w.root.rotation.y = Math.PI;
  return {
    ...E, grade: { sat: 0.92, contrast: 1.1, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const br = Math.sin(lt * 1.7) * 0.5 + 0.5;
      const tip = pose(E, { ...FOCUS, chest: [-0.04 * br, 0, 0], armL: [-0.5 - br * 0.1, 0, -0.55] }, lt);
      const k = smooth(range(lt, 0.2, 4.0));
      magic(E, 0.5 + k * 0.8, lt, { circle: 0.6 + k * 0.4, aura: k, motes: 0.5 + k * 0.5 });
      setEyes(E.w, k * 0.8);
      E.stoneM.uniforms.uEmissive.value.setRGB(0.5, 1, 0.9).multiplyScalar(smooth(range(lt, 1.5, 4.5)) * 1.2);
      PL(0, tip, 0x80fff0, 6, 0.8 + k); PL(1, v3(0, 1.2, -0.8), 0x60b0ff, 4, k * 0.8);
      const a = lerp(0.9, -0.5, ease(range(lt, 0, 5.3)));
      aim(E.camera, v3(Math.sin(a) * 4.2, 1.5 + k * 0.4, -Math.cos(a) * 4.2), v3(0, 1.45, 0));
    },
  };
}
// ---------------------------------------------------------------- LESSON I — FIREBALL
function fireEnv(o) {
  const E = lessonEnv(o);
  const fb = fireball(); fb.visible = false; E.scene.add(fb);
  const fe = fireEmit({ count: 200 }); E.scene.add(fe);
  const tgtP = E.tgt.position.clone().add(v3(0, 1.85, 0.5));
  return { ...E, fb, fe, tgtP };
}
function palmPos(w) { w.root.updateMatrixWorld(true); return w.handL.localToWorld(v3(0, -0.02, 0.06)).add(v3(0, 0.18, 0)); }
function W05() { // First, the Fireball. — face the target
  const E = fireEnv({ fov: 44 });
  return {
    ...E, grade: { sat: 0.92, contrast: 1.1, bloom: 0.55, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const turn = smooth(range(lt, 0.0, 1.0));
      E.w.root.rotation.y = lerp(Math.PI + 0.9, Math.atan2(E.tgtP.x, E.tgtP.z), turn);
      const tip = pose(E, mixPose(STAND, PALM, smooth(range(lt, 0.9, 1.8))), lt); magic(E, 0.5, lt, { circle: 0.5, motes: 0.3 });
      PL(0, tip, 0x80fff0, 4, 0.6);
      aim(E.camera, v3(0.75, 1.95, 2.3 - lt * 0.2), E.tgtP.clone().add(v3(0, -0.5, 0)));
    },
  };
}
function W06() { // gather heat, compress the flames
  const E = fireEnv({ fov: 38 });
  E.w.root.rotation.y = Math.atan2(E.tgtP.x, E.tgtP.z);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.12, bloom: 0.6, bloomT: 0.62 }, env: { ...LESSON_ENV, ambient: 0x4a5048 },
    update(lt) {
      const tip = pose(E, PALM, lt); magic(E, 0.35, lt, { circle: 0.3, motes: 0.1, crystal: 0.4 });
      const grow = smooth(range(lt, 0.2, 2.2)), comp = smooth(range(lt, 2.4, 3.3));
      const p = palmPos(E.w).add(v3(0, grow * 0.22 - comp * 0.08, 0));
      E.fb.visible = lt > 0.15; E.fb.position.copy(p); setFireball(E.fb, (0.15 + grow * 0.8) * (1 - comp * 0.4), comp, lt); E.fb.userData.glow.material.opacity = 0.42;
      const u = E.fe.material.uniforms; u.uOrigin.value.copy(p); u.uOpacity.value = smooth(range(lt, 0.1, 0.6)); u.uSpread.value.setScalar(0.12 + grow * 0.3 - comp * 0.18); u.uVel.value.set(0, 0.6 + grow, 0);
      PL(1, p, 0xff8a30, 5, 0.4 + grow * 1.1 + comp * 0.6);
      E.w.root.updateMatrixWorld(true);
      const h = E.w.head.getWorldPosition(v3());
      const side = fwd(E.w, -1.0, 0.0, 0.55).normalize();
      aim(E.camera, p.clone().lerp(h, 0.4).addScaledVector(side, lerp(3.0, 2.4, lt / 3.7)).add(v3(0, 0.1, 0)), p.clone().lerp(h, 0.35));
    },
  };
}
function W07() { // ...then release
  const E = fireEnv({ fov: 50 });
  E.w.root.rotation.y = Math.atan2(E.tgtP.x, E.tgtP.z);
  const trail = particles({ mode: 'line', count: 360, origin: v3(), lineB: v3(), spread: v3(0.35, 0.35, 0.35), vel: v3(0, 0.6, 0), life: 0.45, size: 0.3, c0: 0xffe8a0, c1: 0xff6a14, c2: 0x4a0a04, soft: true, seed: 31, front: 1, fogMix: 0.1, opacity: 0.9 }); E.scene.add(trail);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.1, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const tip = pose(E, keyed([[0, PALM], [0.18, { ...PALM, armL: [-0.9, 0.3, -0.3], foreL: [-1.4, 0, 0] }], [0.32, THRUST], [2.0, THRUST]], lt), lt); magic(E, 0.4, lt, { circle: 0.3, motes: 0.1 });
      const start = palmPos(E.w), fly = easeIn(range(lt, 0.3, 2.0));
      const p = start.clone().lerp(E.tgtP, fly); p.y += Math.sin(fly * Math.PI) * 0.6;
      E.fb.visible = true; E.fb.position.copy(p); setFireball(E.fb, 0.8 + fly * 0.3, 1, lt);
      const dir = E.tgtP.clone().sub(start).normalize();
      trail.material.uniforms.uOrigin.value.copy(p); trail.material.uniforms.uLineB.value.copy(p.clone().addScaledVector(dir, -Math.min(4, 1 + fly * 8)));
      trail.material.uniforms.uOpacity.value = lt > 0.32 ? 0.9 : 0;
      const u = E.fe.material.uniforms; u.uOrigin.value.copy(p); u.uOpacity.value = 0.8; u.uSpread.value.setScalar(0.2);
      PL(1, p, 0xff8a30, 8, 2.4);
      const chase = smooth(range(lt, 0.35, 0.9));
      const c0 = v3(0.7, 2.0, 3.0), c1 = p.clone().addScaledVector(dir, -3.2).add(v3(0.6, 0.6, 0));
      aim(E.camera, c0.lerp(c1, chase), start.clone().lerp(E.tgtP, 0.15).lerp(p.clone().addScaledVector(dir, 3), chase));
    },
  };
}
function W08() { // the target explodes (slow motion)
  const E = fireEnv({ fov: 46 });
  E.w.root.rotation.y = Math.atan2(E.tgtP.x, E.tgtP.z); E.w.root.position.set(0, 0, 0);
  const T0 = 0.35;
  const burst = particles({ mode: 'burst', count: 420, origin: E.tgtP.clone(), start: T0, spread: v3(5, 4, 5), vel: v3(0, 0.25, 0), life: 2.0, size: 0.42, c0: 0xfff0b0, c1: 0xff6a14, c2: 0x3a0804, seed: 41, soft: true, opacity: 1 }); E.scene.add(burst);
  const sparks = particles({ mode: 'burst', count: 300, origin: E.tgtP.clone(), start: T0, spread: v3(7, 6, 7), vel: v3(0, 1.4, 0), life: 1.6, size: 0.06, c0: 0xffffd0, c1: 0xffa040, c2: 0x802008, seed: 42, opacity: 1 }); E.scene.add(sparks);
  E.scene.add(smokeP({ origin: E.tgtP.clone().add(v3(0, 0.5, 0)), spread: v3(1.5, 0.5, 1.5), size: 3.5, count: 60, vel: v3(0.4, 2.0, 0), life: 3.5, opacity: 0.0, seed: 43 }));
  const smoke = E.scene.children[E.scene.children.length - 1];
  const ring = shockRing(0xffb060); ring.position.copy(E.tgt.position).add(v3(0, 0.1, 0)); E.scene.add(ring);
  // debris: the target pillar's blocks fly apart
  const R = rng(44); const debris = E.pieces.map(m => { E.scene.attach(m); return { m, p0: m.position.clone(), q0: m.quaternion.clone(), v: v3((R() - 0.5) * 5, 2 + R() * 4, (R() - 0.5) * 5 + 1.5), w: v3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(6) }; });
  return {
    ...E, grade: { sat: 0.95, contrast: 1.12, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const a = slowmo(lt, T0, 1.6, 0.3); G.uTime.value = a;
      pose(E, THRUST, a); magic(E, 0.3, a, { circle: 0.2, motes: 0 });
      const fly = range(a, 0, T0); const p = E.tgtP.clone().add(v3(0.3, 0.2, 5.5)).lerp(E.tgtP, fly);
      E.fb.visible = a < T0; E.fb.position.copy(p); setFireball(E.fb, 1.0, 1, a);
      const fu = E.fe.material.uniforms; fu.uOrigin.value.copy(p); fu.uOpacity.value = a < T0 ? 0.8 : 0;
      const dt = Math.max(0, a - T0);
      debris.forEach(D => { if (a < T0) return; D.m.position.set(D.p0.x + D.v.x * dt, Math.max(E.hf(D.p0.x, D.p0.z) + 0.2, D.p0.y + D.v.y * dt - 4.9 * dt * dt), D.p0.z + D.v.z * dt); D.m.quaternion.copy(D.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(D.w.x * dt, D.w.y * dt, D.w.z * dt))); });
      const rk = range(a, T0, T0 + 1.2); ring.material.uniforms.uOpacity.value = a > T0 ? (1 - rk) * 0.9 : 0; const rs = 0.5 + rk * 12; ring.scale.set(rs, rs, rs);
      smoke.material.uniforms.uOpacity.value = smooth(range(a, T0 + 0.1, T0 + 0.8)) * 0.5;
      const fl = a > T0 ? Math.exp(-(a - T0) * 2.2) : 0; PL(1, E.tgtP, 0xffa040, 22, 0.8 + fl * 4); PL(2, p, 0xff8a30, 6, a < T0 ? 2 : 0);
      aim(E.camera, v3(4.2 - lt * 0.15, 2.3, -13.0 - lt * 0.2), E.tgtP.clone().add(v3(0.3, 0.4, 0)));
      shake(E.camera, fl * 0.12, lt);
    },
  };
}
// ---------------------------------------------------------------- LESSON II — LIGHTNING BOLT
function stormSky(E, k) { const u = E.sk.userData.u; const L = (c, a, b) => c.set(a).lerp(new THREE.Color(b), k); L(u.uTop.value, 0x6a90a8, 0x2e3a58); L(u.uHorizon.value, 0xd8d8c0, 0x8a94a8); L(u.uCloudCol.value, 0xb0b8b0, 0x4a5262); L(u.uCloudLit.value, 0xfff0c8, 0xa8b8d8); u.uCover.value = lerp(0.48, 0.3, k); E.sk.userData.k = k; }
const STORM_ENV = (k) => ({ ...LESSON_ENV, lightCol: new THREE.Color(0xfff0d0).lerp(new THREE.Color(0xa8b8d8), k).getHex(), ambient: new THREE.Color(0x5a6458).lerp(new THREE.Color(0x48505e), k).getHex(), fogCol: new THREE.Color(0xc4c8b4).lerp(new THREE.Color(0x9aa2b0), k).getHex() });
function boltEnv(o) {
  const E = lessonEnv(o);
  const bolts = [new Bolt(900), new Bolt(400), new Bolt(400)]; bolts.forEach(b => E.scene.add(b.group));
  const strike = E.menhir.position.clone().add(v3(0, 4.3, 0));
  E.scene.add(particles({ mode: 'drift', count: 500, box: v3(30, 14, 30), vel: v3(3, -0.4, 1), size: 0.05, c0: 0x9aa890, origin: v3(0, 5, -8), additive: false, opacity: 0.6, swirl: 1.5, seed: 51, fogMix: 0.4 })); // blown leaves
  return { ...E, bolts, strike };
}
function W09() { // Next, Lightning Bolt — the sky darkens, sparks gather
  const E = boltEnv({ fov: 50 });
  E.w.root.rotation.y = Math.atan2(E.strike.x, E.strike.z);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.15, bloom: 0.55, bloomT: 0.62 }, env: STORM_ENV(0.55),
    update(lt) {
      const k = smooth(range(lt, 0, 2.4)); stormSky(E, k * 0.9); setEnv(STORM_ENV(k * 0.9));
      const tip = pose(E, mixPose(STAND, { ...STAND, armR: [-1.6, 0, 0.15], foreR: [-0.5, 0, 0], neck: [-0.35, 0, 0], head: [-0.2, 0, 0] }, smooth(range(lt, 0.6, 1.8))), lt);
      magic(E, 0.4 + k * 0.4, lt, { col: 0xa0d8ff, circle: 0.3, motes: 0.2 });
      const paths = []; const r = rng(Math.floor(lt * 18) + 1); for (let i = 0; i < 2 + Math.floor(k * 3); i++) { const e = tip.clone().add(v3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.7)); paths.push(...boltPath(tip, e, Math.floor(lt * 18) * 7 + i, { depth: 3, branches: 0, jag: 0.3 })); }
      E.bolts[1].set(paths, E.camera.position, 0.012, smooth(range(lt, 1.0, 1.6)));
      PL(0, tip, 0xa0d8ff, 5, 0.6 + k * 1.2);
      aim(E.camera, v3(-1.2, 0.9, 4.2 - lt * 0.2), v3(1.6, 4.0, -12));
    },
  };
}
function W10() { // draw electricity from the air, focus it into a single point
  const E = boltEnv({ fov: 38 });
  E.w.root.rotation.y = Math.atan2(E.strike.x, E.strike.z) + 0.3; stormSky(E, 0.9);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.15, bloom: 0.6, bloomT: 0.62 }, env: STORM_ENV(0.9),
    update(lt) {
      const tip = pose(E, SPARK, lt, fwd(E.w, 0.25, 1, 0.25));
      const k = smooth(range(lt, 0, 4.0));
      magic(E, 0.5 + k * 0.9, lt, { col: 0xc0e8ff, circle: 0.4, motes: 0.2 });
      setEyes(E.w, k * 0.9, [0.6, 0.85, 1.0]);
      E.w.root.updateMatrixWorld(true);
      const fingers = [-1, 0, 1].map(f => E.w.handL.localToWorld(v3(f * 0.024, -0.1, 0.03)));
      const seed = Math.floor(lt * 20);
      const paths = []; fingers.forEach((fp, i) => { if (k > i * 0.2) paths.push(...boltPath(fp, tip.clone().add(v3(0, -0.05 * i, 0)), seed * 13 + i, { depth: 4, branches: 1, jag: 0.25 })); });
      const r = rng(seed + 5); for (let i = 0; i < Math.floor(k * 4); i++) paths.push(...boltPath(tip, tip.clone().add(v3(r() - 0.5, r() * 0.6, r() - 0.5).multiplyScalar(1.4)), seed * 17 + i, { depth: 3, branches: 0, jag: 0.3 }));
      E.bolts[0].set(paths, E.camera.position, 0.008, 0.6 + k * 0.4 + (Math.sin(lt * 37) > 0.6 ? 0.3 : 0));
      PL(0, tip, 0xc0e8ff, 5, 0.8 + k * 2.2); PL(1, fingers[1], 0xa0d0ff, 3, k * 1.5);
      const h = fingers[1].clone().lerp(tip, 0.4);
      const a = 0.9 - lt * 0.15;
      aim(E.camera, h.clone().add(fwd(E.w, Math.sin(a) * 1.4, 0.1, Math.cos(a) * 1.4)), h);
    },
  };
}
function W11() { // ...and unleash it
  const E = boltEnv({ fov: 50 });
  E.w.root.rotation.y = Math.atan2(E.strike.x, E.strike.z); stormSky(E, 0.9);
  const T0 = 0.4;
  const sparks = particles({ mode: 'burst', count: 420, origin: E.strike.clone().add(v3(0, -3.6, 0)), start: T0, spread: v3(6, 5, 6), vel: v3(0, 1.2, 0), life: 1.6, size: 0.06, c0: 0xffffff, c1: 0x80c8ff, c2: 0x2040a0, seed: 61, opacity: 1 }); E.scene.add(sparks);
  const ring = shockRing(0x9ad8ff); ring.position.copy(E.menhir.position).add(v3(0, 0.12, 0)); E.scene.add(ring);
  const cloud = v3(9, 60, -30);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.15, bloom: 0.6, bloomT: 0.62 }, env: STORM_ENV(0.9),
    update(lt) {
      const a = slowmo(lt, T0, 1.7, 0.3); G.uTime.value = a;
      const dir = E.strike.clone().sub(E.w.root.position.clone().add(v3(0, 1.6, 0))).normalize();
      const tip = pose(E, keyed([[0, SPARK], [0.3, POINT], [3, POINT]], a), a, a > 0.25 ? fwd(E.w, 0.05, 0.55, 1).normalize() : fwd(E.w, 0.25, 1, 0.25));
      const on = a > T0 ? Math.exp(-(a - T0) * 0.9) : 0, flick = on * (0.7 + 0.3 * Math.sin(a * 60));
      magic(E, 0.6 + on, a, { col: 0xc0e8ff, circle: 0.5, motes: 0.2 });
      const seed = Math.floor(a * 14);
      E.bolts[0].set(on > 0.02 ? boltPath(cloud, E.strike, seed, { depth: 7, branches: 6, jag: 0.12 }) : [], E.camera.position, 0.16, flick);
      E.bolts[1].set(on > 0.02 ? boltPath(tip, E.strike, seed + 99, { depth: 6, branches: 2, jag: 0.15 }) : [], E.camera.position, 0.05, flick);
      E.stoneM.uniforms.uEmissive.value.setRGB(0.6, 0.85, 1).multiplyScalar(on * 2.5);
      const rk = range(a, T0, T0 + 1.0); ring.material.uniforms.uOpacity.value = a > T0 ? (1 - rk) : 0; const rs = 0.5 + rk * 10; ring.scale.set(rs, rs, rs);
      PL(1, E.strike.clone().add(v3(0, -2, 1)), 0xc0e0ff, 30, 0.5 + flick * 5);
      PL(0, tip, 0xc0e8ff, 5, 1.5 + flick * 2);
      aim(E.camera, v3(-1.8, 1.5, 5.2), v3(4.6, 5.5, -19));
      shake(E.camera, on * 0.1, lt);
    },
  };
}
function W12() { // aftermath: arcs crawl over the scorched stone
  const E = boltEnv({ fov: 40 }); stormSky(E, 0.85);
  E.w.root.rotation.y = Math.atan2(E.strike.x, E.strike.z);
  E.scene.add(smokeP({ origin: E.menhir.position.clone().add(v3(0, 1, 0)), spread: v3(1.5, 1, 1.5), size: 2.4, count: 40, vel: v3(0.5, 1.6, 0), life: 3, opacity: 0.4, seed: 71 }));
  const base = E.menhir.position.clone();
  return {
    ...E, grade: { sat: 0.95, contrast: 1.15, bloom: 0.55, bloomT: 0.62 }, env: STORM_ENV(0.85),
    update(lt) {
      pose(E, POINT, lt, fwd(E.w, 0.05, 0.55, 1).normalize()); magic(E, 0.5, lt, { col: 0xc0e8ff, circle: 0.3, motes: 0 });
      const seed = Math.floor(lt * 16), r = rng(seed); const paths = [];
      for (let i = 0; i < 5; i++) { const a0 = r() * 6.28, a1 = a0 + (r() - 0.5) * 1.6; const s = base.clone().add(v3(Math.cos(a0) * (0.8 + r()), 0.1 + r() * 2.5, Math.sin(a0) * (0.8 + r()))); const e = base.clone().add(v3(Math.cos(a1) * (1.5 + r() * 2), 0.05, Math.sin(a1) * (1.5 + r() * 2))); paths.push(...boltPath(s, e, seed * 5 + i, { depth: 4, branches: 1, jag: 0.25 })); }
      E.bolts[0].set(paths, E.camera.position, 0.035, 0.9 * (1 - lt / 2.2));
      E.stoneM.uniforms.uEmissive.value.setRGB(0.6, 0.85, 1).multiplyScalar(0.8 * (1 - lt / 2));
      PL(1, base.clone().add(v3(0, 1, 1)), 0xa0d0ff, 8, 1.5 * (1 - lt / 2.2));
      aim(E.camera, base.clone().add(v3(-3.6 + lt * 0.3, 2.1 - lt * 0.1, 6.2 - lt * 0.35)), base.clone().add(v3(0, 1.5, 0)));
    },
  };
}
// ---------------------------------------------------------------- LESSON III — MAGIC SHIELD
const BRUTE_RUN = (ph) => ({ ...walkPose(ph, { stride: 0.8, hunch: 0.3, hip: 0.92 }), armR: [-0.8 + Math.sin(ph * 6.28) * 0.4, 0, 0.35], foreR: [-0.8, 0, 0], armL: [Math.sin(ph * 6.28) * 0.5, 0, -0.35] });
const BRUTE_SWING = [[0, { hipY: 0.95, spine: [0.1, 0, 0], armR: [-2.9, 0, 0.2], foreR: [-0.8, 0, 0], chest: [-0.2, 0.4, 0], armL: [-0.8, 0, -0.4] }], [0.5, { hipY: 0.9, spine: [0.45, 0, 0], armR: [-1.0, 0, -0.2], foreR: [-0.1, 0, 0], chest: [0.4, -0.5, 0], armL: [-0.3, 0, -0.4] }]];
function shieldEnv(o) {
  const E = lessonEnv(o);
  const sh = shieldDome(2.3); E.scene.add(sh);
  const b = buildBrute(); E.scene.add(b.root);
  return { ...E, sh, b };
}
function W13() { // Finally, the Magic Shield — a brute charges from the trees
  const E = shieldEnv({ fov: 32 });
  E.w.root.rotation.y = Math.PI;
  return {
    ...E, grade: { sat: 0.92, contrast: 1.12, bloom: 0.55, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const tip = pose(E, mixPose(STAND, PLANT, smooth(range(lt, 1.2, 2.2))), lt); magic(E, 0.5, lt, { circle: 0.4, motes: 0.2 });
      const z = -34 + lt * 6.0; E.b.root.position.set(-0.6, E.hf(-0.6, z), z); E.b.root.rotation.y = 0;
      applyPose(E.b, lt < 0.6 ? { hipY: 0.95, spine: [-0.2, 0, 0], neck: [-0.5, 0, 0], armR: [-1.4, 0, 0.6], armL: [-1.2, 0, -0.6] } : BRUTE_RUN(lt * 1.4));
      PL(0, tip, 0x80fff0, 4, 0.8);
      aim(E.camera, v3(0.75, 1.35, 2.6), v3(-0.5, 2.0, -26 + lt * 4));
    },
  };
}
function W14() { // shape your mana into a barrier
  const E = shieldEnv({ fov: 44 });
  E.w.root.rotation.y = Math.PI; E.b.root.visible = false;
  return {
    ...E, grade: { sat: 0.92, contrast: 1.12, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const tip = pose(E, PLANT, lt, fwd(E.w, 0, 1, 0.02));
      const k = smooth(range(lt, 0.2, 1.8));
      magic(E, 0.6 + k * 0.6, lt, { col: 0x80c8ff, circle: 0.6 + k * 0.4, motes: 0.5, aura: k * 0.6 });
      setShield(E.sh, k, lt);
      PL(0, tip, 0x80c8ff, 6, 1 + k * 1.5); PL(1, v3(0, 2.2, -1.5), 0x60a8ff, 6, k);
      const a = lerp(-0.7, 0.4, ease(range(lt, 0, 3.0)));
      aim(E.camera, v3(Math.sin(a) * 6.5, 2.4 + lt * 0.3, -Math.cos(a) * 6.5), v3(0, 1.4, 0));
    },
  };
}
function W15() { // even the strongest attacks can be stopped (slow motion)
  const E = shieldEnv({ fov: 46 });
  E.w.root.rotation.y = Math.PI;
  const T0 = 0.95;
  const hitP = v3(0, 2.0, -2.0);
  const sparks = particles({ mode: 'burst', count: 360, origin: hitP, start: T0, spread: v3(3, 3, 3), vel: v3(0, 0.6, 0), life: 1.4, size: 0.05, c0: 0xffffff, c1: 0x80d0ff, c2: 0x2050c0, seed: 81, opacity: 1 }); E.scene.add(sparks);
  const dust = particles({ mode: 'burst', count: 200, origin: v3(-0.5, 0.3, -10), start: 2.1, spread: v3(4, 1.0, 4), vel: v3(0, 0.1, 0), life: 2.0, size: 0.07, c0: 0xc0b8a0, c1: 0x9a9078, c2: 0x6a6050, seed: 82, additive: false, opacity: 0.8 }); E.scene.add(dust);
  return {
    ...E, grade: { sat: 0.92, contrast: 1.15, bloom: 0.6, bloomT: 0.62 }, env: LESSON_ENV,
    update(lt) {
      const a = slowmo(lt, T0, 2.0, 0.3); G.uTime.value = a;
      const tip = pose(E, PLANT, a, fwd(E.w, 0, 1, 0.02));
      const hitK = a > T0 ? Math.exp(-(a - T0) * 2.0) : 0;
      magic(E, 1.0 + hitK, a, { col: 0x80c8ff, circle: 1, motes: 0.5, aura: 0.5 });
      setShield(E.sh, 1, a, hitK, hitP);
      // the brute's run, swing, and recoil
      const knock = easeOut(range(a, T0, T0 + 1.0)), fall = easeIn(range(a, T0 + 0.5, T0 + 1.3));
      const z = a < T0 - 0.5 ? -9 + a * 6.0 : -4.6 - knock * 6.5;
      E.b.root.position.set(-0.3, E.hf(-0.3, z) + Math.sin(knock * Math.PI) * 1.2 * (1 - fall * 0.3), z);
      E.b.root.rotation.set(-fall * 1.4, 0, knock * 0.2);
      applyPose(E.b, a < T0 - 0.5 ? BRUTE_RUN(a * 1.4) : a < T0 + 0.05 ? keyed(BRUTE_SWING, a - (T0 - 0.5)) : { hipY: 0.95, spine: [-0.4, 0, 0], neck: [-0.6, 0, 0], armR: [-2.2, 0, 0.9], foreR: [-0.2, 0, 0], armL: [-1.6, 0, -0.9], thighL: [-0.8, 0, 0.2], thighR: [-0.3, 0, -0.2] });
      PL(0, tip, 0x80c8ff, 6, 2); PL(1, hitP, 0xc0f0ff, 10, hitK * 5);
      aim(E.camera, v3(1.3, 2.3, 4.2), v3(-0.3, 2.0, -6.0));
      shake(E.camera, hitK * 0.15, lt);
    },
  };
}
// ---------------------------------------------------------------- MASTERY — the hill above the kingdom
function hillEnv(o = {}) {
  const K = kingdomHill(o); const camera = cam(o.fov ?? 50);
  const w = buildWizard(); w.root.position.set(0, K.top, 0); w.root.rotation.y = Math.PI; K.scene.add(w.root); K.scene.add(w.staff);
  const circle = runeCircle(2.6); circle.position.set(0, K.top + 0.05, 0); K.scene.add(circle);
  const aura = auraShell(1.25); aura.position.set(0, K.top + 1.2, 0); K.scene.add(aura);
  const motes = manaMotes({ origin: v3(0, K.top + 0.1, 0), spread: v3(4, 0.2, 4) }); K.scene.add(motes);
  const fire = fireEmit({ count: 220, size: 0.3, life: 0.5 }); K.scene.add(fire);
  const mana = manaMotes({ count: 220, spread: v3(0.25, 0.25, 0.25), vel: v3(0, 0.4, 0), life: 0.6, size: 0.08, seed: 9 }); K.scene.add(mana);
  const bolt = new Bolt(600); K.scene.add(bolt.group);
  const orbs = [glow(0xff8a30, 1.4, 0), glow(0xa0d8ff, 1.4, 0), glow(0x60fff0, 1.4, 0)]; orbs.forEach(g => K.scene.add(g));
  return { ...K, camera, w, circle, aura, motes, fire, mana, bolt, orbs };
}
function elements(E, k, t, rise = 0) { // fire, lightning and mana orbit the wizard
  const c = E.w.root.position.clone().add(v3(0, 1.3, 0)), pts = [];
  [0, 1, 2].forEach(i => { const a = t * 2.6 + i * 2.094; const r = 1.4 + 0.2 * Math.sin(t * 1.7 + i); const p = c.clone().add(v3(Math.cos(a) * r, Math.sin(t * 2.2 + i * 2) * 0.6 + rise, Math.sin(a) * r)); pts.push(p); E.orbs[i].position.copy(p); E.orbs[i].material.opacity = k * 0.7; const s = 0.6 + k * 0.45; E.orbs[i].scale.set(s, s, 1); });
  const fu = E.fire.material.uniforms; fu.uOrigin.value.copy(pts[0]); fu.uOpacity.value = k; fu.uSpread.value.setScalar(0.25);
  const mu = E.mana.material.uniforms; mu.uOrigin.value.copy(pts[2]); mu.uOpacity.value = k;
  const seed = Math.abs(Math.floor(t * 18)); const r = rng(seed); const paths = [];
  for (let i = 0; i < 3; i++) paths.push(...boltPath(pts[1], pts[1].clone().add(v3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.2)), seed * 3 + i, { depth: 3, branches: 0, jag: 0.3 }));
  paths.push(...boltPath(pts[1], pts[(seed % 2) * 2], seed + 50, { depth: 4, branches: 1, jag: 0.2 }));
  E.bolt.set(paths, E.camera.position, 0.02, k);
  return pts;
}
function hillMagic(E, k, t, o = {}) { setRunes(E.w, k); setCrystal(E.w, o.crystal ?? k, o.col); E.circle.material.uniforms.uOpacity.value = k * 0.9; E.circle.rotation.z = t * 0.5; E.aura.material.uniforms.uOpacity.value = (o.aura ?? 0) * 0.07; E.motes.material.uniforms.uOpacity.value = k * 0.8; }
function hpose(E, p, t, dir) { applyPose(E.w, p); setSkirt(E.w); return holdStaff(E.w, dir || fwd(E.w, 0, 1, 0.08), t); }
function W16() { // master these three spells — the hill and the kingdom
  const E = hillEnv({ fov: 50 });
  return {
    ...E, grade: { sat: 0.95, contrast: 1.1, bloom: 0.6, bloomT: 0.62 }, env: HILL_ENV,
    update(lt) {
      const tip = hpose(E, STAND, lt); hillMagic(E, 0.4, lt); elements(E, 0, lt);
      PL(0, tip, 0x80fff0, 4, 0.6);
      const u = ease(range(lt, 0, 4.0));
      aim(E.camera, v3(lerp(0.7, 5, u), E.top + lerp(1.5, 10, u), lerp(2.6, 16, u)), v3(0, lerp(E.top + 1.4, E.top - 18, u), lerp(-20, -420, u)));
    },
  };
}
function W17() { // ...no longer an ordinary traveler — the elements swirl
  const E = hillEnv({ fov: 42, swirl: 2 });
  return {
    ...E, grade: { sat: 0.95, contrast: 1.12, bloom: 0.6, bloomT: 0.62 }, env: HILL_ENV,
    update(lt) {
      const up = smooth(range(lt, 0.1, 1.0)), k = smooth(range(lt, 0.4, 1.6));
      const tip = hpose(E, mixPose(STAND, RAISE, up), lt, fwd(E.w, 0, 1, 0.1));
      hillMagic(E, 0.6 + k * 0.7, lt, { aura: k }); setEyes(E.w, k * 0.9);
      elements(E, k, lt, lt * 0.15);
      PL(0, tip, 0x80fff0, 6, 1 + k * 1.5); PL(1, E.orbs[0].position, 0xff8a30, 5, k * 1.6); PL(2, E.orbs[1].position, 0xa0d8ff, 5, k * 1.4);
      const a = lerp(-0.6, 0.5, ease(range(lt, 0, 4.4)));
      aim(E.camera, v3(Math.sin(a) * 3.8, E.top + 0.7, -Math.cos(a) * 3.8), v3(0, E.top + 1.7, 0));
    },
  };
}
function W18() { // you will be a wizard — the combined spell bursts over the kingdom
  const E = hillEnv({ fov: 54, swirl: 3 });
  const beam = mesh(flat(new THREE.CylinderGeometry(0.35, 0.6, 1, 8, 1, true)), mat({ color: 0xc0fff8, unlit: true, additive: true, opacity: 0, side: THREE.DoubleSide, fogScale: 0.1 })); E.scene.add(beam);
  const nova = [shockRing(0x80fff0), shockRing(0xffa040), shockRing(0xa0d8ff)]; nova.forEach(r => { r.rotation.set(0, 0, 0); E.scene.add(r); });
  const sky = v3(0, E.top + 120, -160);
  const burst = particles({ mode: 'burst', count: 420, origin: sky, start: 1.1, spread: v3(80, 40, 80), vel: v3(0, 0.6, 0), life: 3.0, size: 1.0, c0: 0xffffff, c1: 0x80fff0, c2: 0x2040a0, seed: 91, opacity: 0.6, fogMix: 0.0 }); E.scene.add(burst);
  const embers = particles({ mode: 'burst', count: 500, origin: sky, start: 1.15, spread: v3(70, 35, 70), vel: v3(0, 1.0, 0), life: 3.2, size: 0.9, c0: 0xffffd0, c1: 0xff8a30, c2: 0x6a1004, seed: 92, opacity: 0.7, fogMix: 0.0 }); E.scene.add(embers);
  const flare = glow(0xe0fff8, 110, 0); flare.position.copy(sky); E.scene.add(flare);
  return {
    ...E, grade: { sat: 0.95, contrast: 1.12, bloom: 0.6, bloomT: 0.62 }, env: HILL_ENV,
    update(lt) {
      const tip = hpose(E, RAISE, lt, fwd(E.w, 0, 1, 0.12));
      hillMagic(E, 1.3, lt, { aura: 0.8, crystal: 1.6 }); setEyes(E.w, 1);
      const pts = elements(E, 1 - smooth(range(lt, 0.6, 1.1)), lt, 0.3 + lt * 0.8);
      const shoot = smooth(range(lt, 0.55, 1.1)), fade = 1 - smooth(range(lt, 2.0, 3.2));
      const top = tip.clone().lerp(sky, shoot); const mid = tip.clone().lerp(top, 0.5); beam.position.copy(mid); beam.scale.set(1 + shoot, Math.max(0.01, tip.distanceTo(top)), 1 + shoot);
      beam.quaternion.setFromUnitVectors(v3(0, 1, 0), top.clone().sub(tip).normalize()); beam.material.uniforms.uOpacity.value = shoot * 0.45 * fade;
      const nk = range(lt, 1.1, 3.6);
      nova.forEach((r, i) => { const kk = clamp(nk * (1 - i * 0.12)); r.position.copy(sky); r.rotation.set(-Math.PI / 2 + 0.25 * (i - 1), 0, 0); const s = 2 + kk * (150 - i * 20); r.scale.set(s, s, s); r.material.uniforms.uOpacity.value = lt > 1.1 ? (1 - kk) * 0.6 : 0; });
      flare.material.opacity = lt > 1.1 ? Math.exp(-(lt - 1.1) * 1.6) * 0.55 : 0;
      PL(0, tip, 0x80fff0, 8, 2.5); PL(1, sky, 0xc0fff8, 600, lt > 1.1 ? Math.exp(-(lt - 1.1) * 1.2) * 1.2 : 0);
      const u = ease(range(lt, 0, 6.6));
      aim(E.camera, v3(lerp(1.4, 2.4, u), E.top + lerp(0.9, 2.2, u), lerp(5.5, 9.5, u)), v3(0, E.top + lerp(14, 30, u), -90));
    },
  };
}

export const SHOTS_SPELLS = { W01, W02, W03, W04, W05, W06, W07, W08, W09, W10, W11, W12, W13, W14, W15, W16, W17, W18 };
