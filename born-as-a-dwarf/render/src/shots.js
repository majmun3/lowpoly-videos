// WHAT IF YOU WERE BORN AS A DWARF? — 25 shots. A serious fantasy documentary about a ridiculous dwarf.
import { THREE, v3, setPL, setEnv, G, particles, mesh, mat, group, glow, rng, clamp, lerp, smooth, ease, easeOut, easeIn, range, box, prism, flat } from '/the-last-ember/render/src/engine.js';
import { applyPose, mixPose } from '/the-last-ember/render/src/characters.js';
import { fireP, smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { buildDwarf, buildDwarfNPC, buildOrcKing, orcHorde, dwarfCrowd, dWalk, dStand, jigWalk, jigKick, jigAdd, setJiggle, holdAxe, axeOnBack, buildHammer, TD } from './dwarf.js';
import { valleyWorld, VALLEY_ENV, homeInterior, HOME_ENV, courtyard, YARD_ENV, forgeHall, FORGE_ENV, fortressWorld, DUSK_ENV, setGate, throneHall, HALL_ENV, materials } from './dworld.js';

const cam = (fov, near = 0.05, far = 7000) => new THREE.PerspectiveCamera(fov, 9 / 16, near, far);
function aim(c, p, t) { c.position.copy(p); c.up.set(0, 1, 0); c.lookAt(t); }
function shake(c, amt, t) { if (amt <= 0) return; c.position.x += (Math.sin(t * 31) * 0.6 + Math.sin(t * 17.3) * 0.4) * amt; c.position.y += (Math.sin(t * 27.1 + 1) * 0.6 + Math.sin(t * 13.7) * 0.4) * amt; c.rotateZ(Math.sin(t * 19) * amt * 0.05); }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) return mixPose(a, b, ease((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
function slowmo(lt, a, b, f) { if (lt < a) return lt; if (lt < b) return a + (lt - a) * f; return a + (b - a) * f + (lt - b); }
const faceTo = (j, p) => { j.root.rotation.y = Math.atan2(p.x - j.root.position.x, p.z - j.root.position.z); };
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
const PL = (i, p, c, r, k) => setPL(i, p, c, r, k * 0.5);
const wpos = (j, x, y, z) => { let top = j.root; while (top.parent) top = top.parent; top.updateMatrixWorld(true); return j.root.localToWorld(v3(x, y, z)); };
// the shot-time at which a slowmo(lt, a, b, f) clock reaches st (for constant particle-burst start times)
function slowInv(st, a, b, f) { if (st < a) return st; const m = a + (b - a) * f; if (st < m) return a + (st - a) / f; return b + (st - m); }
// step quake: decaying shakes after each footfall time
function quake(t, steps, a = 0.06) { let s = 0; for (const ts of steps) if (t > ts) s += a * Math.exp(-(t - ts) * 7); return s; }

// ---------------------------------------------------------------- poses (adult proportions; the child scales the hip)
const STAND = dStand();
const LEAN = { ...STAND, spine: [0.35, 0, 0], chest: [0.2, 0, 0], neck: [0.25, 0, 0], head: [0.2, 0, 0], armL: [-0.4, 0, -0.2], foreL: [-0.6, 0, 0], armR: [-0.4, 0, 0.2], foreR: [-0.6, 0, 0] };
const SHOCK = { ...STAND, spine: [-0.08, 0, 0], neck: [-0.15, 0, 0], armL: [-1.5, 0.4, -0.1], foreL: [-1.8, 0, 0], armR: [-1.5, -0.4, 0.1], foreR: [-1.8, 0, 0] };   // hands to the face
const AXE_UP = { ...STAND, armR: [-2.6, 0, 0.25], foreR: [-0.35, 0, 0], armL: [-2.5, 0, -0.1], foreL: [-0.5, 0, 0], spine: [-0.1, 0, 0], chest: [-0.12, 0, 0], neck: [-0.15, 0, 0], thighL: [-0.25, 0, -0.1], shinL: [0.3, 0, 0], thighR: [0.15, 0, 0.1], hipY: 0.5 };
const AXE_SIDE = { ...STAND, armR: [-1.5, 0.0, 0.9], foreR: [-0.15, 0, 0], armL: [-1.3, 0, 0.5], foreL: [-0.5, 0, 0], spine: [0.1, -0.5, 0], chest: [0, -0.6, 0], thighL: [-0.3, 0, -0.15], shinL: [0.3, 0, 0], thighR: [0.2, 0, 0.15], hipY: 0.49 };
const PRONE = { hipY: 0.52, thighL: [0.15, 0, -0.25], shinL: [1.7, 0, 0], thighR: [0.1, 0, 0.25], shinR: [1.5, 0, 0], armL: [-2.9, 0, -0.4], foreL: [-0.2, 0, 0], armR: [-2.9, 0, 0.4], foreR: [-0.2, 0, 0], neck: [-0.6, 0, 0], head: [-0.3, 0.5, 0] };
const HAMMER_UP = { ...STAND, armR: [-2.7, 0, 0.3], foreR: [-0.6, 0, 0], armL: [-0.8, 0.3, -0.3], foreL: [-0.8, 0, 0], spine: [-0.05, 0, 0], chest: [-0.05, 0.2, 0], thighL: [-0.2, 0, -0.1], thighR: [0.1, 0, 0.1] };
const HAMMER_DOWN = { ...STAND, armR: [-1.0, 0, 0.15], foreR: [-0.5, 0, 0], armL: [-0.8, 0.3, -0.3], foreL: [-0.8, 0, 0], spine: [0.3, 0, 0], chest: [0.15, -0.1, 0], neck: [0.2, 0, 0], thighL: [-0.2, 0, -0.1], thighR: [0.1, 0, 0.1] };
const GRIP = { ...STAND, armR: [-1.0, 0, 0.2], foreR: [-0.9, 0, 0], armL: [-1.1, 0, -0.1], foreL: [-0.9, 0, 0], spine: [0.08, 0, 0], neck: [-0.05, 0, 0] };
const BUMP_LOAD = { ...STAND, spine: [0.55, 0, 0], chest: [0.25, 0, 0], neck: [-0.6, 0, 0], head: [-0.3, 0, 0], thighL: [-0.6, 0, -0.15], shinL: [0.8, 0, 0], thighR: [-0.6, 0, 0.15], shinR: [0.8, 0, 0], armL: [-0.3, 0, -0.6], armR: [-0.3, 0, 0.6], hipY: 0.42 };
const BUMP_HIT = { ...STAND, spine: [0.7, 0, 0], chest: [0.3, 0, 0], neck: [-0.7, 0, 0], head: [-0.3, 0, 0], thighL: [0.35, 0, -0.1], shinL: [0.15, 0, 0], thighR: [0.35, 0, 0.1], shinR: [0.15, 0, 0], armL: [0.6, 0, -0.9], armR: [0.6, 0, 0.9], hipY: 0.5 };
const SIT = { hipY: 0.88, thighL: [-1.5, 0, -0.12], shinL: [1.25, 0, 0], thighR: [-1.5, 0, 0.12], shinR: [1.25, 0, 0], spine: [-0.05, 0, 0], armL: [-0.5, 0, -0.35], foreL: [-0.9, 0, 0], armR: [-0.5, 0, 0.35], foreR: [-0.9, 0, 0] };
const KID_SPAR_A = { ...STAND, hipY: 0.364, armR: [-1.9, 0, 0.3], foreR: [-0.5, 0, 0], armL: [-0.9, 0.3, -0.2], foreL: [-1.0, 0, 0], thighL: [-0.3, 0, 0], thighR: [0.3, 0, 0], shinR: [0.3, 0, 0] };
const KID_SPAR_B = { ...STAND, hipY: 0.364, armR: [-0.6, 0, 0.2], foreR: [-0.4, 0, 0], armL: [-1.2, 0.4, -0.2], foreL: [-1.1, 0, 0], thighL: [-0.3, 0, 0], thighR: [0.3, 0, 0], shinR: [0.3, 0, 0], spine: [0.15, 0, 0] };
const LAUGH = { hipY: 0.95, spine: [0.12, 0, 0], chest: [0.05, 0.15, 0], neck: [0.15, 0, 0], head: [0.15, 0, 0], armL: [-0.35, 0, -0.2], foreL: [-1.2, 0.7, 0], armR: [-0.75, -0.2, 0.15], foreR: [-0.2, 0, 0] };
const LOOM = { hipY: 0.95, spine: [0.15, 0, 0], chest: [0.1, 0, 0], neck: [0.4, 0, 0], head: [0.2, 0, 0], armL: [-0.2, 0, -0.3], foreL: [-0.4, 0, 0], armR: [-0.5, 0, 0.3], foreR: [-0.6, 0, 0] };

function pose(j, p, extra = {}) { applyPose(j, { ...p, ...extra }); }
function kid(p) { return { ...p, hipY: 0.364 }; }

// ---------------------------------------------------------------- S1 — THE BIRTH
function D01() { // the valley: enormous green mountains, the village, the fortress at the head of the valley
  const V = valleyWorld(); const camera = cam(50);
  return { scene: V.scene, camera, grade: { sat: 1.0, contrast: 1.08, bloom: 0.45, bloomT: 0.7 }, env: VALLEY_ENV,
    update(lt) { const u = ease(range(lt, 0, 2.3)); aim(camera, v3(lerp(24, 10, u), lerp(58, 11, u), lerp(105, 34, u)), v3(lerp(-10, 0, u), lerp(80, 3, u), lerp(-600, -4, u))); } };
}
function homeCast() {
  const E = homeInterior();
  const dad = buildDwarfNPC({ seed: 31, beard: 0x8a5a34, tunic: 0x6a7a3a }); dad.root.position.set(-0.18, 0, -0.78); faceTo(dad, v3(0.15, 0, 0.3)); E.scene.add(dad.root);
  const mom = buildDwarfNPC({ seed: 32, female: true, beard: 0xb05a2a, tunic: 0x8a3a30 }); mom.root.position.set(0.62, 0, -0.72); faceTo(mom, v3(0.25, 0, 0.3)); E.scene.add(mom.root);
  const baby = buildDwarf('baby'); baby.root.position.set(0, 0.27, 0.02); baby.root.rotation.y = Math.PI; E.cradle.add(baby.root);
  return { ...E, dad, mom, baby };
}
function babyLive(E, lt) {
  const b = E.baby; const kick = Math.sin(lt * 7.5);
  b.legs[0].rotation.x = -0.4 + kick * 0.5; b.legs[1].rotation.x = -0.4 - kick * 0.5; b.arms[0].rotation.z = -0.4 + Math.sin(lt * 5) * 0.2; b.arms[1].rotation.z = 0.4 - Math.sin(lt * 5.3) * 0.2;
  setJiggle(b, { bL: kick * 0.9, bR: -kick * 0.9, bounce: Math.sin(lt * 15) * 0.5, sway: Math.sin(lt * 7.5 + 0.8) * 0.7 });
  E.cradle.rotation.z = Math.sin(lt * 2.2) * 0.05;
  if (E.lookCam) { E.scene.updateMatrixWorld(true); b.head.lookAt(E.lookCam.position); }
}
function homeLights(E, lt) { PL(0, E.fireOrigin.clone().add(v3(0, 0.6, 0.6)), 0xff9a40, 7, 1.6 + Math.sin(lt * 13) * 0.2 + Math.sin(lt * 7.3) * 0.15); PL(1, v3(2.6, 1.6, -0.8), 0xfff0d0, 6, 0.9); }
const HOME_G = { sat: 1.0, contrast: 1.08, bloom: 0.42, bloomT: 0.74 };
function D02() { // the family around the cradle
  const E = homeCast(); const camera = cam(46);
  return { scene: E.scene, camera, grade: HOME_G, env: HOME_ENV,
    update(lt) { homeLights(E, lt); pose(E.dad, LEAN); pose(E.mom, LEAN); babyLive(E, lt); const u = ease(range(lt, 0, 2.1)); aim(camera, v3(lerp(0.3, 0.25, u), lerp(1.5, 1.3, u), lerp(3.3, 2.4, u)), v3(0.22, lerp(0.85, 0.7, u), lerp(-0.3, -0.1, u))); } };
}
function D03() { // the reveal: a newborn dwarf — tiny ginger beard, serious frown — and a colossal diapered rump
  const E = homeCast(); const camera = cam(44); E.lookCam = camera;
  return { scene: E.scene, camera, grade: HOME_G, env: HOME_ENV,
    update(lt) { homeLights(E, lt); pose(E.dad, LEAN); pose(E.mom, LEAN); babyLive(E, lt);
      const u = ease(range(lt, 0.2, 1.3)); const face = wpos(E.baby, 0, 0.12, 0.22), rump = wpos(E.baby, 0, 0.26, -0.2);
      aim(camera, v3(0.22, lerp(0.5, 0.8, u), lerp(-0.36, -0.4, u)), face.clone().lerp(rump, u)); } };
}
function D04() { // the parents' reaction
  const E = homeCast(); const camera = cam(40);
  return { scene: E.scene, camera, grade: HOME_G, env: HOME_ENV,
    update(lt) { homeLights(E, lt); const k = smooth(range(lt, 0.05, 0.35)); pose(E.dad, mixPose(LEAN, { ...STAND, spine: [-0.15, 0, 0], neck: [-0.1, 0, 0], armL: [-0.3, 0, -0.5], armR: [-0.3, 0, 0.5] }, k)); pose(E.mom, mixPose(LEAN, SHOCK, k)); babyLive(E, lt);
      for (const p of [E.dad, E.mom]) for (const [i, b] of p.brows.entries()) { b.position.y = 0.152 + k * 0.03; b.rotation.z = (i ? -1 : 1) * 0.12 * (1 - k); }
      aim(camera, v3(0.22, 0.95, 1.6 - lt * 0.12), v3(0.22, 1.12, -0.7)); } };
}

// ---------------------------------------------------------------- S2 — CHILDHOOD
function villageCast(o = {}) {
  const V = valleyWorld(); const hf = V.hf;
  const kids = []; const spots = [[-1.4, 3.4, 1.2], [-0.5, 4.3, -1.9], [0.9, 3.0, 1.0], [1.8, 3.9, -2.1]];
  spots.forEach(([x, z, ry], i) => { const k = buildDwarfNPC({ child: true, seed: 40 + i, tunic: [0x4a6a8a, 0x8a3a30, 0x7a6a3a, 0x3a6a5a][i] }); k.root.position.set(x, hf(x, z), z); k.root.rotation.y = ry; V.scene.add(k.root);
    const sw = new THREE.Group(); mesh(box(0.035, 0.42, 0.02, 'bottom'), V.M.wood, sw); mesh(box(0.12, 0.025, 0.03), V.M.wood, sw, [0, 0.02, 0]); k.handR.add(sw); sw.position.set(0, -0.06, 0.02); sw.rotation.x = Math.PI / 2; k.sword = sw;
    const sh = mesh(prism(8, 0.13, 0.13, 0.03), V.M.wood, k.handL, [0, -0.06, 0.05], [Math.PI / 2, 0, 0]); kids.push(k); });
  const master = buildDwarfNPC({ seed: 45, beard: 0xc8c0b4, armor: true }); master.root.position.set(0.1, hf(0.1, 1.4), 1.4); master.root.rotation.y = 0.15; V.scene.add(master.root);
  const hero = buildDwarf('child'); V.scene.add(hero.root); V.scene.add(hero.axe); hero.axe.visible = false;
  const dust = particles({ mode: 'burst', count: 60, origin: v3(), spread: v3(0.5, 0.1, 0.5), vel: v3(0, 0.6, 0), life: 0.9, size: 0.25, c0: 0xb8a888, c1: 0x9a8a70, soft: true, additive: false, opacity: 0.6, seed: 51, start: -9 }); V.scene.add(dust);
  return { ...V, kids, master, hero, dust };
}
function spar(E, lt, stare = 0) {
  E.kids.forEach((k, i) => { const ph = lt * 3.2 + i * 1.3; const sw = (Math.sin(ph) + 1) / 2; pose(k, mixPose(i % 2 ? KID_SPAR_B : KID_SPAR_A, i % 2 ? KID_SPAR_A : KID_SPAR_B, sw * (1 - stare)));
    if (stare > 0) { k.head.rotation.y = lerp(0, k.look ?? 0, stare); k.neck.rotation.x = 0.1 * stare; } });
  pose(E.master, { ...STAND, armL: [-0.1, 0, -0.1], armR: [-0.4, 0, 0.1], foreR: [-1.4, 0, 0] });
}
function childWalk(E, lt, a, b, speed = 0.75, t0 = 0) {
  const h = E.hero, dir = b.clone().sub(a).normalize(), dist = Math.max(0, (lt - t0) * speed), ph = dist / 0.62;
  const p = a.clone().addScaledVector(dir, dist); h.root.position.set(p.x, E.hf(p.x, p.z), p.z); h.root.rotation.y = Math.atan2(dir.x, dir.z);
  pose(h, dWalk(ph, { k: 0.7, hip: 0.364, stride: 0.6 })); h.neck.rotation.x = -0.05;
  setJiggle(h, jigWalk(ph, 1.25));
  const steps = []; for (let s = 0.25; s <= ph; s += 0.5) steps.push(t0 + s * 0.62 / speed);
  return { ph, steps, p };
}
function D05() { // the village square: young dwarves learning to fight
  const E = villageCast(); const camera = cam(44);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.08, bloom: 0.45, bloomT: 0.7 }, env: VALLEY_ENV,
    update(lt) { spar(E, lt); E.hero.root.visible = false; aim(camera, v3(lerp(-1.2, 1.2, lt / 3.3), 1.3, 9.2 - lt * 0.25), v3(0.1, 0.55, 3.4)); } };
}
function D06() { // you walk past — the ground shakes with every step; everyone stares
  const E = villageCast(); const camera = cam(42);
  E.kids.forEach((k, i) => k.look = [1.0, 1.2, -1.0, -1.3][i]);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.08, bloom: 0.45, bloomT: 0.7 }, env: VALLEY_ENV,
    update(lt) { const W = childWalk(E, lt, v3(-4.6, 0, 6.0), v3(4.5, 0, 6.0), 0.8); spar(E, lt, smooth(range(lt, 0.3, 0.9)));
      E.kids.forEach((k, i) => { k.head.rotation.y = Math.atan2(W.p.x - k.root.position.x, W.p.z - k.root.position.z) - k.root.rotation.y; });
      const last = W.steps[W.steps.length - 1] ?? -9; E.dust.material.uniforms.uStart.value = last; E.dust.material.uniforms.uOrigin.value.set(W.p.x, E.hf(W.p.x, W.p.z) + 0.05, W.p.z);
      aim(camera, v3(W.p.x - 0.6, 0.75, 9.6), v3(W.p.x - 0.1, 0.55, 4.2)); shake(camera, quake(lt, W.steps, 0.05), lt); } };
}
function D07() { // ...without causing an earthquake
  const E = villageCast(); const camera = cam(46);
  E.kids.forEach((k, i) => k.look = 0);
  const barrel = group(E.scene, [4.4, E.hf(4.4, -1.8), -1.8]); mesh(prism(8, 0.32, 0.36, 0.8, 'bottom'), E.M.wood, barrel);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.08, bloom: 0.45, bloomT: 0.7 }, env: VALLEY_ENV,
    update(lt) { const W = childWalk(E, lt, v3(2.7, 0, 6.2), v3(3.3, 0, -5.0), 0.7); spar(E, lt, 1);
      E.kids.forEach((k) => { k.head.rotation.y = Math.atan2(W.p.x - k.root.position.x, W.p.z - k.root.position.z) - k.root.rotation.y; });
      const drop = smooth(range(lt, 1.3, 1.6)); const k0 = E.kids[2]; k0.sword.rotation.x = Math.PI / 2 + drop * 1.4; k0.armR.rotation.x = lerp(k0.armR.rotation.x, 0.1, drop);
      barrel.rotation.z = -easeIn(range(lt, 1.35, 1.75)) * 1.5;
      const last = W.steps[W.steps.length - 1] ?? -9; E.dust.material.uniforms.uStart.value = last; E.dust.material.uniforms.uOrigin.value.set(W.p.x, E.hf(W.p.x, W.p.z) + 0.05, W.p.z);
      aim(camera, v3(W.p.x + 0.5, 0.35, W.p.z + 2.0), v3(W.p.x, 0.45, W.p.z - 2.5)); shake(camera, quake(lt, W.steps, 0.06) + pulse(lt, 1.4, 0.12) * 0.12, lt); } };
}

// ---------------------------------------------------------------- S3 — WARRIOR TRAINING
function yardCast() {
  const E = courtyard();
  const hero = buildDwarf('warrior'); hero.root.position.set(0, 0, 2.7); hero.root.rotation.y = Math.PI; E.scene.add(hero.root); holdAxe(hero);
  const recruits = []; for (let i = 0; i < 5; i++) { const r = buildDwarfNPC({ seed: 60 + i, armor: true, helmet: i % 2 === 0 }); r.root.position.set(3.4 + (i % 2) * 0.9, 0, -0.6 + i * 0.75); faceTo(r, v3(0.1, 0, 1.8)); E.scene.add(r.root); recruits.push(r); }
  const master = buildDwarfNPC({ seed: 66, beard: 0xc8c0b4, armor: true, helmet: true, horns: true }); master.root.position.set(2.5, 0, 3.4); faceTo(master, v3(0.1, 0, 1.8)); E.scene.add(master.root);
  const splash = particles({ mode: 'burst', count: 140, origin: v3(0, 0.1, 1.0), spread: v3(1.2, 0.2, 1.0), vel: v3(0, 2.6, 0), life: 1.1, size: 0.18, c0: 0x6a4a30, c1: 0x4a3220, soft: true, additive: false, opacity: 0.95, seed: 71, start: -9 }); E.scene.add(splash);
  return { ...E, hero, recruits, master, splash };
}
function watchers(E, lt, palm = 0) { E.recruits.forEach((r, i) => pose(r, { ...STAND, armL: [-0.2, 0, -0.15], armR: [-0.2, 0, 0.15], neck: [0.05, 0, 0] })); pose(E.master, mixPose({ ...STAND, armL: [-0.3, 0, -0.3], foreL: [-1.6, 0, 0], armR: [-0.3, 0, 0.3], foreR: [-1.6, 0, 0] }, { ...STAND, armR: [-2.2, 0.4, 0.2], foreR: [-1.9, 0, 0], neck: [0.35, 0, 0], head: [0.2, 0, 0] }, palm)); }
const YARD_G = { sat: 1.0, contrast: 1.08, bloom: 0.4, bloomT: 0.72 };
function D08() { // at the age of thirty: the warrior raises the great axe
  const E = yardCast(); const camera = cam(40);
  return { scene: E.scene, camera, grade: YARD_G, env: YARD_ENV,
    update(lt) { watchers(E, lt); const k = smooth(range(lt, 0.5, 2.2)); pose(E.hero, mixPose(GRIP, AXE_UP, k)); holdAxe(E.hero); setJiggle(E.hero, { bounce: jigKick(lt, 2.0, 0.8), sway: jigKick(lt, 2.1, 0.4, 3) });
      const a = lerp(3.5, 5.0, ease(range(lt, 0, 3.6))); const c = v3(0, 0.9, 2.7);
      aim(camera, c.clone().add(v3(Math.sin(a) * 3.0, lerp(-0.45, -0.15, lt / 3.6), Math.cos(a) * 3.0)), c.clone().add(v3(0, lerp(0.25, 0.4, k), 0))); } };
}
function D09() { // the swing — the momentum takes over
  const E = yardCast(); const camera = cam(44);
  return { scene: E.scene, camera, grade: YARD_G, env: YARD_ENV,
    update(lt) { watchers(E, lt); const h = E.hero; const sp = easeIn(range(lt, 0.05, 1.0));
      pose(h, mixPose(AXE_UP, AXE_SIDE, smooth(range(lt, 0, 0.18)))); holdAxe(h, { rx: Math.PI / 2 + 0.3 });
      h.root.rotation.y = Math.PI + sp * Math.PI * 3.2; h.root.rotation.z = Math.sin(sp * 9) * 0.12 * sp; h.root.position.set(Math.sin(sp * 7) * 0.12, 0, 2.7 - sp * 0.4);
      setJiggle(h, { sway: Math.sin(sp * 14) * 2.2 * sp + 0.6, bounce: Math.sin(sp * 20) * 0.8, bL: Math.sin(sp * 14 + 1) * 1.2, bR: -Math.sin(sp * 14 + 1) * 1.2 });
      aim(camera, v3(-3.2, 1.05, 5.6), v3(0, 0.75, 2.4)); } };
}
function D10() { // ...gravity wins: face-first into the mud
  const E = yardCast(); const camera = cam(42);
  return { scene: E.scene, camera, grade: YARD_G, env: YARD_ENV,
    update(lt) { watchers(E, lt); const h = E.hero; const T0 = 0.15; const st = slowmo(lt, 0.0, 0.5, 0.45);
      const f = easeIn(range(st, 0, 0.36)); h.root.rotation.order = 'YXZ'; h.root.rotation.set(f * 1.47, Math.PI - 0.3, 0); h.root.position.set(0.1, f * 0.2, 2.3 - f * 0.1);
      pose(h, mixPose(AXE_SIDE, PRONE, smooth(range(st, 0.05, 0.4)))); holdAxe(h, { rx: Math.PI / 2 + 0.3 });
      const imp = 0.36; E.splash.material.uniforms.uStart.value = slowInv(imp, 0.0, 0.5, 0.45);
      setJiggle(h, { bounce: jigKick(st, imp, 1.6, 3.6, 2.2), sway: jigKick(st, imp + 0.03, 0.9, 2.6, 2.0), bL: jigKick(st, imp, 0.8, 4.2), bR: -jigKick(st, imp, 0.8, 4.2), pitch: -0.4 });
      h.shinL.rotation.x = 1.7 + Math.sin(lt * 9) * 0.35 * clamp(lt - 0.6, 0, 1); h.shinR.rotation.x = 1.5 - Math.sin(lt * 9) * 0.35 * clamp(lt - 0.6, 0, 1);
      aim(camera, v3(2.3, 0.45, 4.8), v3(0, 0.35, 1.3)); shake(camera, pulse(st, imp + 0.05, 0.08) * 0.08, lt); } };
}
function D11() { // the comedic pause: wide, deadpan; the drill master's palm meets his face
  const E = yardCast(); const camera = cam(36);
  const axe = E.hero.axe; E.scene.add(axe);
  return { scene: E.scene, camera, grade: YARD_G, env: YARD_ENV,
    update(lt) { watchers(E, lt, smooth(range(lt, 0.8, 1.4))); const h = E.hero;
      h.root.rotation.order = 'YXZ'; h.root.rotation.set(1.47, Math.PI - 0.3, 0); h.root.position.set(0.1, 0.2, 2.2); pose(h, PRONE);
      axe.position.set(-1.6, 0.85, 0.2); axe.rotation.set(0.1, 0.4, 2.6); axe.scale.setScalar(1);
      const slip = 1.9; const up = smooth(range(lt, 1.3, 1.85)) * (1 - smooth(range(lt, 1.85, 1.95)));
      h.armL.rotation.x = -2.9 + up * 1.8; h.armR.rotation.x = -2.9 + up * 1.8; h.root.rotation.x = 1.47 - up * 0.25;
      h.shinL.rotation.x = 1.7 + Math.sin(lt * 7) * 0.25; h.shinR.rotation.x = 1.5 - Math.sin(lt * 7) * 0.25;
      setJiggle(h, { bounce: jigKick(lt, slip + 0.05, 1.3, 3.8, 2.4) + Math.sin(lt * 2.1) * 0.05, sway: jigKick(lt, slip + 0.08, 0.7, 2.8, 2.0), pitch: -0.4 });
      aim(camera, v3(-4.6, 0.95, 1.8), v3(0.8, 0.5, 1.6)); shake(camera, pulse(lt, slip + 0.06, 0.08) * 0.04, lt); } };
}

// ---------------------------------------------------------------- S4 — THE FORGE
function forgeCast() {
  const E = forgeHall();
  const hero = buildDwarf('warrior'); hero.root.position.set(-0.75, 0, 0.1); hero.root.rotation.y = Math.PI / 2; E.scene.add(hero.root); E.scene.add(hero.axe); axeOnBack(hero);
  const ham = buildHammer(hero.M, 1.35, true); hero.handR.add(ham); ham.position.set(0, -0.06, 0.02); ham.rotation.x = Math.PI / 2; hero.hammer = ham;
  const steel = mesh(box(0.7, 0.04, 0.09), mat({ color: 0xffb050, emissive: 0xff7010, unlit: true }), E.scene, [0.05, 0.77, 0]); const sg = glow(0xffa040, 0.9, 0.6); sg.position.set(0.05, 0.8, 0); E.scene.add(sg);
  const smiths = []; const spots = [[-6, -6, 0.5], [6, -7, -0.4], [-5, -15, 0.2], [5.5, -17, -0.2], [-1.9, -2.4, 1.4], [0.8, -3.0, -1.6], [-2.0, -4.6, 1.3], [1.1, -5.0, -1.5]];
  spots.forEach(([x, z, ry], i) => { const s = buildDwarfNPC({ seed: 80 + i, apron: true, leather: 0xc0a090 }); s.root.position.set(x - (i < 4 ? 0.75 : 0), 0, z + (i < 4 ? 0.1 : 0)); s.root.rotation.y = i < 4 ? ry + Math.PI / 2 : ry; E.scene.add(s.root); if (i < 4) { const h = buildHammer(s.M, 1.0); s.handR.add(h); h.position.set(0, -0.06, 0.02); h.rotation.x = Math.PI / 2; } smiths.push(s); });
  const sparks = particles({ mode: 'burst', count: 120, origin: v3(0.05, 0.8, 0), spread: v3(0.1, 0.05, 0.1), vel: v3(0, 2.2, 0), life: 0.7, size: 0.05, c0: 0xffffc0, c1: 0xffa030, c2: 0x801000, seed: 91, opacity: 1, start: -9 }); E.scene.add(sparks);
  return { ...E, hero, steel, smiths, sparks, sg };
}
function forgeLights(E, lt) { PL(0, v3(0.05, 1.4, 0.4), 0xffa040, 5, 1.6 + Math.sin(lt * 11) * 0.2); PL(1, v3(0, 3, -8), 0xff7020, 16, 2.0); PL(2, v3(0, 9, -45), 0xff7a20, 26, 2.4); E.furnaces.slice(0, 3).forEach((f, i) => PL(3 + i, f, 0xff8a30, 7, 1.2 + Math.sin(lt * 9 + i) * 0.2)); }
function hammering(s, lt, i, k = 1) { const ph = (lt * 1.3 + i * 0.37) % 1; const u = ph < 0.6 ? smooth(ph / 0.6) : 1 - easeIn((ph - 0.6) / 0.4); pose(s, mixPose(HAMMER_DOWN, HAMMER_UP, u * k)); }
function D12() { // the great underground forge
  const E = forgeCast(); const camera = cam(52);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.1, bloom: 0.5, bloomT: 0.64 }, env: FORGE_ENV,
    update(lt) { forgeLights(E, lt); E.smiths.forEach((s, i) => i < 4 ? hammering(s, lt, i) : pose(s, STAND)); hammering(E.hero, lt, 9);
      const ph = (lt * 1.3 + 9 * 0.37) % 1; E.sparks.material.uniforms.uStart.value = G.uTime.value - ph / 1.3 + 0.0;
      const u = ease(range(lt, 0, 2.1)); aim(camera, v3(lerp(4, 2.4, u), lerp(12, 2.6, u), lerp(10, 5.2, u)), v3(0, lerp(6, 1.0, u), lerp(-30, -1, u))); } };
}
function D13() { // your weapons were legendary — the strike, in slow motion; the smiths stop and admire
  const E = forgeCast(); const camera = cam(36);
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.12, bloom: 0.55, bloomT: 0.62 }, env: FORGE_ENV,
    update(lt) { forgeLights(E, lt); const st = slowmo(lt, 0.3, 1.2, 0.4);
      const u = st < 0.55 ? smooth(st / 0.55) : 1 - easeIn(range(st, 0.55, 0.75)); pose(E.hero, mixPose(HAMMER_DOWN, HAMMER_UP, u)); E.hero.face.rotation.x = 0.15;
      const hit = 0.75; E.sparks.material.uniforms.uStart.value = slowInv(hit, 0.3, 1.2, 0.4); E.sparks.material.uniforms.uSize.value = 0.06;
      E.smiths.forEach((s, i) => { if (i < 4) { pose(s, HAMMER_DOWN); s.head.rotation.y = 0.5; } else { pose(s, { ...STAND, armL: [-0.3, 0, -0.4], foreL: [-1.4, 0, 0], armR: [-0.3, 0, 0.4], foreR: [-1.4, 0, 0] }); s.neck.rotation.x = 0.15 * Math.max(0, Math.sin(lt * 3 + i)); } });
      E.sg.material.opacity = 0.6 + pulse(st, hit, 0.06) * 0.4; PL(4, v3(0.05, 1.0, 0.2), 0xffe0a0, 3, pulse(st, hit, 0.08) * 3);
      aim(camera, v3(0.95, 1.2, 2.0), v3(-0.4, 0.95, -0.1)); shake(camera, pulse(st, hit, 0.05) * 0.02, lt); } };
}
function D14() { // ...your proportions were questionable: he turns and walks away; every smith's head follows the wobble
  const E = forgeCast(); const camera = cam(40);
  E.steel.visible = false; E.sg.visible = false;
  return { scene: E.scene, camera, grade: { sat: 1.0, contrast: 1.1, bloom: 0.5, bloomT: 0.64 }, env: FORGE_ENV,
    update(lt) { forgeLights(E, lt); const h = E.hero; const tt0 = 0.2;
      const turn = smooth(range(lt, 0, 0.7)); const dist = Math.max(0, lt - 0.7) * 0.8; const ph = dist / 0.75;
      h.root.rotation.y = lerp(Math.PI / 2, Math.PI * 1.0, turn); h.root.position.set(-0.75, 0, 0.1 - dist);
      if (lt < 0.7) pose(h, mixPose(HAMMER_DOWN, STAND, turn)); else pose(h, dWalk(ph, { stride: 0.55 }));
      h.hammer.visible = true; const w = lt < 0.7 ? jigAdd({ sway: jigKick(lt, 0.25, 1.4, 2.4, 2.2), bounce: jigKick(lt, 0.3, 0.8) }) : jigWalk(ph, 1.25); setJiggle(h, w);
      E.smiths.forEach((s, i) => { pose(s, i < 4 ? HAMMER_DOWN : STAND); if (i >= 4) { s.root.rotation.y = Math.atan2(h.root.position.x - s.root.position.x, h.root.position.z - s.root.position.z); const sway = (w.sway ?? 0); s.head.rotation.z = -sway * 0.22; s.neck.rotation.z = -sway * 0.12; s.head.rotation.x = 0.25; } });
      aim(camera, v3(-0.55, 1.05, 3.3 - dist * 0.3), v3(-0.7, 0.7, -2.6 - dist * 0.4)); } };
}

// ---------------------------------------------------------------- S5 — THE ORC INVASION
function battleCast(o = {}) {
  const E = fortressWorld(); const R = rng(9);
  const pos = []; for (let i = 0; i < 2600; i++) { const x = (R() - 0.5) * 150, z = 70 + R() * 190 + Math.abs(x) * 0.3; pos.push(v3(x, E.hf(x, z), z)); }
  const horde = orcHorde(pos, { yaw: Math.PI, seed: 33, scale: 1.15 }); const hg = new THREE.Group(); hg.add(horde); E.scene.add(hg);
  const torches = new THREE.Group(); hg.add(torches); for (let i = 0; i < 160; i++) { const p = pos[Math.floor(R() * pos.length)]; const g = glow(0xffa040, 1.6, 0.8); g.position.set(p.x + 0.4, p.y + 2.6, p.z); torches.add(g); }
  for (let i = 0; i < 10; i++) { const x = (R() - 0.5) * 120, z = 90 + R() * 150; E.scene.add(fireP({ origin: v3(x, E.hf(x, z), z), spread: v3(1.5, 0.2, 1.5), size: 1.6, count: 40, seed: 600 + i, life: 1.0, vel: v3(0, 3.0, 0) })); E.scene.add(smokeP({ origin: v3(x, E.hf(x, z) + 2, z), size: 6, count: 30, seed: 620 + i, opacity: 0.4, vel: v3(1.5, 5, 0) })); }
  const warriors = dwarfCrowd(E.wpos, { yaw: 0, seed: 21 }); E.scene.add(warriors);
  return { ...E, horde, hg, pos, warriors };
}
const DUSK_G = { sat: 1.0, contrast: 1.1, bloom: 0.5, bloomT: 0.64 };
function D15() { // the orcs come for the kingdom
  const E = battleCast(); const camera = cam(50);
  return { scene: E.scene, camera, grade: DUSK_G, env: DUSK_ENV,
    update(lt) { E.hg.position.z = -lt * 2.2; const u = ease(range(lt, 0, 3.3)); aim(camera, v3(lerp(26, 14, u), lerp(40, 30, u), lerp(300, 250, u)), v3(lerp(0, 0, u), lerp(8, 12, u), lerp(-20, -34, u))); } };
}
function D16() { // on the ramparts: the warriors prepare; a horn
  const E = battleCast(); const camera = cam(44);
  const guards = []; for (let i = 0; i < 6; i++) { const g = buildDwarfNPC({ seed: 100 + i, armor: true, helmet: true, horns: i === 2 }); g.root.position.set(54.0 + i * 2.4, 14, -30.2); g.root.rotation.y = 0.05; E.scene.add(g.root); guards.push(g); }
  const horn = new THREE.Group(); mesh(prism(7, 0.03, 0.09, 0.5), mat({ map: TD('diaper'), color: 0xe0d0b0 }), horn, [0, 0, 0], [Math.PI / 2 + 0.4, 0, 0]); guards[2].handR.add(horn); horn.position.set(0, -0.08, 0.05);
  return { scene: E.scene, camera, grade: DUSK_G, env: DUSK_ENV,
    update(lt) { E.hg.position.z = -(3.3 + lt) * 2.2; guards.forEach((g, i) => pose(g, i === 2 ? { ...STAND, armR: [-2.1, 0.5, 0.3], foreR: [-1.6, 0, 0], neck: [-0.3, 0, 0], head: [-0.2, 0, 0] } : { ...STAND, armL: [-0.5, 0, -0.3], foreL: [-0.8, 0, 0], armR: [-0.4 - 0.1 * Math.sin(lt * 2 + i), 0, 0.2] }));
      const x = lerp(52, 58, ease(range(lt, 0, 2.2))); aim(camera, v3(x, 6.5, -6), v3(x + 4, 16.5, -30.2)); } };
}
function D17() { // your people needed you — you take up the axe
  const E = battleCast(); const camera = cam(38);
  const hero = buildDwarf('warrior'); hero.root.position.set(1.0, E.hf(1, -30), -31.0); hero.root.rotation.y = 0; E.scene.add(hero.root); E.scene.add(hero.axe);
  setGate(E.gate, 0.15);
  return { scene: E.scene, camera, grade: DUSK_G, env: DUSK_ENV,
    update(lt) { E.hg.position.z = -(5.5 + lt) * 2.2; const k = smooth(range(lt, 0.2, 0.9)); const h = hero;
      if (lt < 0.55) { pose(h, mixPose(STAND, { ...STAND, armR: [-2.9, 0.3, 0.4], foreR: [-1.4, 0, 0] }, smooth(range(lt, 0, 0.5)))); axeOnBack(h); }
      else { pose(h, mixPose({ ...STAND, armR: [-2.9, 0.3, 0.4], foreR: [-1.4, 0, 0] }, GRIP, smooth(range(lt, 0.55, 1.1)))); holdAxe(h); }
      setJiggle(h, { bounce: jigKick(lt, 1.0, 0.6) }); h.face.rotation.x = -0.05;
      PL(0, v3(1, E.hf(1, -30) + 2.5, -27.5), 0xffa060, 8, 0.5);
      aim(camera, v3(1.65, E.hf(1, -30) + 1.2, -29.6), v3(1.0, E.hf(1, -30) + 1.05, -31.0)); } };
}
function D18() { // the charge — slow motion
  const E = battleCast(); const camera = cam(42);
  const hero = buildDwarf('warrior'); E.scene.add(hero.root); E.scene.add(hero.axe); holdAxe(hero);
  setGate(E.gate, 1);
  const army = []; const R = rng(3); for (let i = 0; i < 70; i++) army.push(v3((R() - 0.5) * 14, 0, -30 - R() * 10)); const crowd = dwarfCrowd(army.map(p => v3(p.x, E.hf(p.x, p.z), p.z)), { yaw: 0, seed: 23 }); E.scene.add(crowd);
  const dust = particles({ mode: 'emit', count: 90, origin: v3(), spread: v3(0.4, 0.05, 0.4), vel: v3(0, 0.7, -0.6), life: 1.6, size: 0.4, c0: 0xa89078, c1: 0x7a6a5a, soft: true, additive: false, opacity: 0.6, seed: 77 }); E.scene.add(dust);
  return { scene: E.scene, camera, grade: DUSK_G, env: DUSK_ENV,
    update(lt) { E.hg.position.z = -(7.1 + lt * 0.5) * 2.2; const st = lt * 0.5; const dist = 1 + st * 4.6; const ph = dist / 1.1;
      const z = -29 + dist; hero.root.position.set(0.4, E.hf(0.4, z), z); hero.root.rotation.y = 0; pose(hero, { ...dWalk(ph, { run: 1, stride: 0.7 }), armR: [-1.0 + Math.sin(ph * 6.28) * 0.2, 0, 0.3], foreR: [-1.0, 0, 0] }); holdAxe(hero, { rx: 0.9 });
      setJiggle(hero, jigWalk(ph, 2.0)); crowd.position.z = st * 3.2;
      dust.material.uniforms.uOrigin.value.set(0.4, E.hf(0.4, z) + 0.05, z - 0.3);
      const c = hero.root.position; aim(camera, v3(c.x - 3.4, c.y + 0.8, c.z), v3(c.x, c.y + 0.6, c.z - 0.05)); } };
}

// ---------------------------------------------------------------- S6 — THE SECRET WEAPON
function duelCast() {
  const E = battleCast(); E.hg.position.z = -10;
  const hero = buildDwarf('warrior'); hero.root.position.set(0, E.hf(0, 40), 40); hero.root.rotation.y = 0; E.scene.add(hero.root); E.scene.add(hero.axe);
  const orc = buildOrcKing(); orc.root.position.set(0, E.hf(0, 44.6), 44.6); orc.root.rotation.y = Math.PI; E.scene.add(orc.root);
  const ring = mesh(new THREE.RingGeometry(0.7, 1.0, 28), mat({ color: 0xd8c0a0, unlit: true, additive: true, opacity: 0, side: THREE.DoubleSide, fogScale: 0.3 }), E.scene, [0, E.hf(0, 44) + 0.8, 44.0]);
  const dust = particles({ mode: 'burst', count: 260, origin: v3(0, E.hf(0, 44) + 0.6, 44.0), spread: v3(1.5, 0.5, 1.5), vel: v3(0, 1.2, 0), life: 1.8, size: 0.45, c0: 0x9a8470, c1: 0x6a5a4a, soft: true, additive: false, opacity: 0.7, seed: 81, start: -9 }); E.scene.add(dust);
  return { ...E, hero, orc, ring, dust };
}
function orcLaugh(o, lt, k = 1) { const sh = Math.sin(lt * 22) * 0.07 * k; applyPose(o, mixPose(LOOM, { ...LAUGH, chest: [0.05 + sh, 0.15, 0], neck: [0.15 - sh * 1.5, 0, 0] }, k)); o.jaw.rotation.x = k * (0.45 + Math.abs(Math.sin(lt * 11)) * 0.3); }
function D19() { // the orc king laughs
  const E = duelCast(); const camera = cam(40);
  return { scene: E.scene, camera, grade: DUSK_G, env: DUSK_ENV,
    update(lt) { orcLaugh(E.orc, lt, smooth(range(lt, 0.3, 0.8))); pose(E.hero, { ...STAND, armR: [-0.25, 0, 0.25], foreR: [-0.3, 0, 0] }); holdAxe(E.hero, { rx: 0.35 }); setJiggle(E.hero, {});
      const c = E.hero.root.position; aim(camera, v3(c.x + 1.5 - lt * 0.08, c.y + 1.4, c.z - 0.4), v3(0, E.orc.root.position.y + 2.95, 44.4)); } };
}
function D20() { // you slowly turn around. silence.
  const E = duelCast(); const camera = cam(36);
  return { scene: E.scene, camera, grade: { ...DUSK_G, contrast: 1.14 }, env: DUSK_ENV,
    update(lt) { const stop = smooth(range(lt, 0.4, 0.9)); orcLaugh(E.orc, lt, 1 - stop); if (stop > 0.5) { E.orc.neck.rotation.z = 0.25 * stop; E.orc.jaw.rotation.x = 0.1; }
      const turn = smooth(range(lt, 0.2, 1.8)); const h = E.hero; h.root.rotation.y = lerp(0, Math.PI, turn); pose(h, GRIP); holdAxe(h); h.head.rotation.y = -turn * 0.6 * (1 - smooth(range(lt, 1.5, 2.0)));
      setJiggle(h, { sway: jigKick(lt, 1.8, 0.5, 2.5, 2.5) });
      const c = h.root.position; aim(camera, v3(c.x + 0.45, c.y + 1.1, c.z - 1.75 + lt * 0.12), v3(c.x - 0.05, c.y + 1.15, c.z + 1.5)); } };
}
function D21() { // the secret weapon
  const E = duelCast(); const camera = cam(56);
  return { scene: E.scene, camera, grade: { ...DUSK_G, bloom: 0.55 }, env: DUSK_ENV,
    update(lt) { const st = slowmo(lt, 0.35, 1.2, 0.3); const hit = 0.5; const h = E.hero; h.root.rotation.y = Math.PI;
      const load = smooth(range(st, 0, 0.3)), go = easeIn(range(st, 0.3, hit)); pose(h, mixPose(mixPose(GRIP, BUMP_LOAD, load), BUMP_HIT, go)); holdAxe(h);
      h.root.position.z = 40 + go * 3.3 + easeOut(range(st, hit, 0.9)) * 0.2; h.root.position.y = E.hf(0, 41) + Math.sin(go * Math.PI) * 0.35;
      setJiggle(h, jigAdd({ bounce: jigKick(st, hit, 2.4, 3.2, 1.6), sway: jigKick(st, hit + 0.02, 1.2, 2.2, 1.6), bL: jigKick(st, hit, 1.2, 3.8, 1.8), bR: -jigKick(st, hit + 0.03, 1.2, 3.8, 1.8) }, { pitch: -0.3 * go }));
      const o = E.orc; const fly = range(st, hit, 1.6); applyPose(o, mixPose(LOOM, { hipY: 0.95, spine: [-0.6, 0, 0], neck: [-0.9, 0, 0], armL: [-2.6, 0, -0.8], armR: [-2.6, 0, 0.8], thighL: [-1.0, 0, 0], thighR: [-0.6, 0, 0] }, smooth(fly * 3))); o.jaw.rotation.x = 0.6 * smooth(fly * 4);
      o.root.position.set(0, E.hf(0, 44.6) + fly * 2.4, 44.6 + fly * 5); o.root.rotation.x = -fly * 0.8;
      E.dust.material.uniforms.uStart.value = slowInv(hit, 0.35, 1.2, 0.3);
      const r = E.ring; r.material.uniforms.uOpacity.value = Math.max(0, 1 - (st - hit) * 2.5) * (st > hit ? 0.9 : 0); const rs = 1 + Math.max(0, st - hit) * 14; r.scale.setScalar(rs); r.lookAt(camera.position);
      PL(0, v3(0, E.hf(0, 44) + 1.2, 44.0), 0xffe0b0, 10, pulse(st, hit + 0.02, 0.06) * 6);
      aim(camera, v3(6.2, E.hf(0, 43.6) + 1.1, 43.4), v3(0, E.hf(0, 43.6) + 1.45, 43.6)); shake(camera, pulse(st, hit + 0.02, 0.1) * 0.12, lt); } };
}
function D22() { // the orc king flies across the battlefield into his own army
  const E = duelCast(); const camera = cam(48);
  const crashP = v3(-6, 0, 118); crashP.y = E.hf(crashP.x, crashP.z);
  const plume = particles({ mode: 'burst', count: 320, origin: crashP.clone().add(v3(0, 1, 0)), spread: v3(5, 1.5, 5), vel: v3(0, 5, 0), life: 2.6, size: 2.0, c0: 0x8a7058, c1: 0x5a4a40, soft: true, additive: false, opacity: 0.75, seed: 83, start: -9 }); E.scene.add(plume);
  const im = E.horde, mats = im.userData.mats, base = im.userData.base; const hit = []; base.forEach((p, i) => { const d = Math.hypot(p.x - crashP.x, p.z + E.hg.position.z - crashP.z); if (d < 22) hit.push([i, d]); });
  const cheer = dwarfCrowd([...Array(80)].map((_, i) => v3((i % 16 - 8) * 1.1, E.hf(0, 32), 30 + Math.floor(i / 16) * 1.2)), { yaw: Math.PI, seed: 25 }); E.scene.add(cheer);
  E.hero.root.rotation.y = Math.PI;
  return { scene: E.scene, camera, grade: DUSK_G, env: DUSK_ENV,
    update(lt) { const T = 1.75; const u = clamp(lt / T); const o = E.orc;
      const start = v3(0, E.hf(0, 46) + 2.4, 49.6); const p = start.clone().lerp(crashP, u); p.y = lerp(start.y, crashP.y + 1, u) + Math.sin(u * Math.PI) * 34;
      if (lt < T) { o.root.position.copy(p); o.root.rotation.set(-lt * 5.5, lt * 1.3, Math.sin(lt * 3) * 0.6); } else { o.root.position.copy(crashP).add(v3(0, 0.2, 2)); o.root.rotation.set(-Math.PI / 2, 0.4, 0.2); }
      applyPose(o, { hipY: 0.95, spine: [-0.4, 0, 0], neck: [-0.8, 0, 0], armL: [-2.6 + Math.sin(lt * 14) * 0.6, 0, -0.9], armR: [-2.6 - Math.sin(lt * 14) * 0.6, 0, 0.9], thighL: [-1.0 + Math.sin(lt * 12) * 0.5, 0, -0.3], thighR: [-0.4 - Math.sin(lt * 12) * 0.5, 0, 0.3] }); o.jaw.rotation.x = 0.6;
      plume.material.uniforms.uStart.value = T;
      const k = clamp((lt - T) * 2.5); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = v3(), pp = v3();
      for (const [i, d] of hit) { mats[i].decompose(pp, q, sc); const dir = v3(pp.x - crashP.x, 0, pp.z + E.hg.position.z - crashP.z).normalize(); const push = k * (22 - d) * 0.35; const tilt = k * Math.min(1.5, (22 - d) * 0.12); const qq = new THREE.Quaternion().setFromAxisAngle(v3(dir.z, 0, -dir.x).normalize(), tilt).multiply(q); M4.compose(pp.clone().addScaledVector(dir, push).add(v3(0, Math.sin(k * Math.PI) * (22 - d) * 0.15, 0)), qq, sc); im.setMatrixAt(i, M4); }
      im.instanceMatrix.needsUpdate = true;
      cheer.children.forEach(m => m.position.y = Math.abs(Math.sin(lt * 6)) * 0.15 * clamp(lt - 2));
      const cu = smooth(range(lt, 0, T + 0.4)); const cp = v3(lerp(16, 34, cu), lerp(4, 16, cu), lerp(44, 88, cu)); aim(camera, cp, p.clone().lerp(crashP, smooth(range(lt, T * 0.6, T + 0.5))).add(v3(0, 1, 0))); shake(camera, pulse(lt, T + 0.05, 0.15) * 0.25, lt); } };
}

// ---------------------------------------------------------------- S7 — THE LEGEND
function hallCast() {
  const E = throneHall();
  const R = rng(13); const pos = []; for (let z = -2; z > -E.L + 34; z -= 1.15) for (let x = 3.2; x < 11.5; x += 1.0) for (const s of [-1, 1]) { if (R() < 0.05) continue; pos.push(v3(s * (x + (R() - 0.5) * 0.3), 0, z + (R() - 0.5) * 0.3)); }
  const crowd = dwarfCrowd(pos, { kneel: true, yaw: Math.PI, seed: 27, yawJitter: 0.15 }); E.scene.add(crowd);
  const king = buildDwarf('king'); E.scene.add(king.root); E.scene.add(king.axe);
  const st = E.statue; applyPose(st, { ...dStand(), armR: [-2.9, 0, 0.35], foreR: [-0.3, 0, 0], armL: [-0.6, 0, -0.6], foreL: [-1.0, 0, 0], spine: [-0.08, 0.3, 0], thighL: [-0.4, 0, -0.1], shinL: [0.3, 0, 0], thighR: [0.2, 0, 0.1] }); holdAxe(st, { rx: 0.4 }); st.axe.scale.setScalar(1); setJiggle(st, { sway: 0.4, bounce: -0.2 });
  const puff = particles({ mode: 'burst', count: 80, origin: v3(0, 2.9, E.tz - 1.4), spread: v3(1.0, 0.1, 0.6), vel: v3(0, 0.6, 0), life: 1.4, size: 0.4, c0: 0xd8c8b0, c1: 0xa89880, soft: true, additive: false, opacity: 0.6, seed: 85, start: -9 }); E.scene.add(puff);
  return { ...E, crowd, king, puff };
}
function hallLights(E, lt) { PL(0, v3(0, 6, E.tz + 4), 0xffd090, 16, 1.2); PL(1, v3(0, 3, -20), 0xffb060, 20, 1.0); PL(2, v3(0, 3, 0), 0xffb060, 18, 0.8); }
const HALL_G = { sat: 1.02, contrast: 1.1, bloom: 0.5, bloomT: 0.66 };
function D23() { // the greatest dwarf king in history — thousands kneel as he walks to the throne
  const E = hallCast(); const camera = cam(50);
  return { scene: E.scene, camera, grade: HALL_G, env: HALL_ENV,
    update(lt) { hallLights(E, lt); const k = E.king; const z = lerp(E.tz + 9, E.tz + 2.6, clamp(lt / 4.4)); const ph = (E.tz + 9 - z) / 0.75;
      const stepY = clamp((E.tz + 6 - z) / 1.2) * 1.0 + clamp((E.tz + 4 - z) / 1.0) * 1.0; k.root.position.set(0, stepY, z); k.root.rotation.y = Math.PI; pose(k, { ...dWalk(ph, { stride: 0.5 }), armR: [-0.6, 0, 0.3], foreR: [-0.8, 0, 0] }); holdAxe(k, { rx: 0.25 }); setJiggle(k, jigWalk(ph, 1.1));
      const u = ease(range(lt, 0, 4.4)); aim(camera, v3(lerp(2, 1.2, u), lerp(16, 4.5, u), lerp(E.tz + 46, E.tz + 13, u)), v3(0, lerp(2, 2.3, u), lerp(E.tz + 12, E.tz, u))); } };
}
function D24() { // he slowly sits down — one final wobble
  const E = hallCast(); const camera = cam(42);
  return { scene: E.scene, camera, grade: HALL_G, env: HALL_ENV,
    update(lt) { hallLights(E, lt); const k = E.king; const seatZ = E.tz - 1.25; const T = 1.2;
      const turn = smooth(range(lt, 0, 0.8)), sit = easeIn(range(lt, 0.6, T)); k.root.position.set(0, 2.0, lerp(E.tz + 1.4, seatZ, smooth(range(lt, 0, 0.9)))); k.root.rotation.y = lerp(Math.PI, 0, turn);
      pose(k, mixPose({ ...STAND, armR: [-0.6, 0, 0.3], foreR: [-0.8, 0, 0], hipY: 0.52 }, { ...SIT, hipY: 1.08 }, sit)); holdAxe(k, { rx: 0.25 });
      setJiggle(k, { bounce: jigKick(lt, T, -2.2, 3.4, 2.0), sway: jigKick(lt, T + 0.03, 0.9, 2.4, 1.8), bL: jigKick(lt, T, 0.7, 3.8, 2.2), bR: -jigKick(lt, T + 0.02, 0.7, 3.8, 2.2) });
      E.puff.material.uniforms.uStart.value = G.uTime.value - (lt - T);
      E.throne.position.y = 2.0 - pulse(lt, T + 0.03, 0.04) * 0.04; E.throne.rotation.z = Math.sin(Math.max(0, lt - T) * 30) * 0.01 * Math.exp(-Math.max(0, lt - T) * 4);
      aim(camera, v3(4.2, 4.1, E.tz - 0.3 - lt * 0.05), v3(0, 3.15, E.tz - 1.3)); shake(camera, pulse(lt, T + 0.04, 0.08) * 0.04, lt); } };
}
function D25() { // remembered... by everyone — the colossal statue
  const E = hallCast(); const camera = cam(50);
  return { scene: E.scene, camera, grade: HALL_G, env: HALL_ENV,
    update(lt) { hallLights(E, lt); PL(3, v3(6, 30, -E.L + 30), 0xffe0a8, 40, 2.4); const k = E.king; k.root.position.set(0, 2.0, E.tz - 1.25); k.root.rotation.y = 0; pose(k, { ...SIT, hipY: 1.08, armR: [-0.5, 0, 0.3], foreR: [-1.1, 0, 0] }); holdAxe(k, { rx: 0.25 }); setJiggle(k, { bounce: -0.2 });
      const u = ease(range(lt, 0, 3.4)); aim(camera, v3(lerp(2.5, -11, u), lerp(3.2, 12, u), lerp(E.tz + 6, E.tz + 30, u)), v3(lerp(0, -1.5, u), lerp(3.0, 9.5, u), lerp(E.tz - 1, E.tz - 12, u))); } };
}

export const SHOTS_DWARF = { D01, D02, D03, D04, D05, D06, D07, D08, D09, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D20, D21, D22, D23, D24, D25 };
