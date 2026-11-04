// Wizard design reference: one wizard (front / three-quarter / side / back, face, staff, belt), his mana, his three spells, and the brute.
import { THREE, v3, setPL, particles } from '/the-last-ember/render/src/engine.js';
import { applyPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildBrute } from '/born-as-a-goblin/render/src/goblin.js';
import { buildWizard, setSkirt, setRunes, setEyes, holdStaff, setCrystal, runeCircle, auraShell, manaMotes, fireEmit, fireball, setFireball, boltPath, Bolt, shieldDome, setShield } from './wizard.js';

const STAND = { ...walkPose(0, { stride: 0, hunch: 0.04 }), armR: [-0.35, 0, 0.12], foreR: [-0.7, 0, 0], armL: [0.05, 0, -0.12], foreL: [-0.2, 0, 0], neck: [-0.05, 0, 0] };
const PALM = { ...STAND, armL: [-1.05, 0.35, -0.15], foreL: [-1.0, 0.2, 0], neck: [0.15, -0.2, 0], head: [0.1, -0.15, 0] };
const SPARK = { ...STAND, armR: [-1.6, 0, 0.15], foreR: [-0.5, 0, 0], armL: [-1.35, 0.6, -0.2], foreL: [-1.1, 0.3, 0], neck: [-0.2, 0, 0] };
const PLANT = { ...STAND, armR: [-1.1, 0, 0.15], foreR: [-0.6, 0, 0], armL: [-1.3, 0, -0.35], foreL: [-0.3, 0, 0], thighL: [-0.3, 0, 0.08], shinL: [0.25, 0, 0], thighR: [0.3, 0, -0.08], hipY: 0.96 };

// [label, kind, camera angle, distance, look height, fov]
export const VIEWS = [
  ['FRONT', 'front', 0.0, 5.4, 1.15, 30], ['THREE-QUARTER', 'front', 0.65, 5.4, 1.15, 30], ['SIDE', 'front', Math.PI / 2, 5.4, 1.15, 30], ['BACK', 'front', Math.PI, 5.4, 1.15, 30],
  ['FACE & HAT', 'face', -0.4, 2.0, 1.86, 30], ['THE STAFF', 'staff', 0.5, 2.3, 1.45, 30], ['BELT, POTIONS & SATCHEL', 'belt', -0.45, 1.7, 1.0, 30], ['MANA — RUNES & AURA', 'mana', 0.45, 5.6, 1.2, 32],
  ['FIREBALL', 'fire', -1.15, 3.6, 1.6, 32], ['LIGHTNING BOLT', 'bolt', -0.9, 6.4, 1.2, 34], ['MAGIC SHIELD', 'shield', 0.5, 7.6, 1.3, 34], ['THE BRUTE', 'brute', 0.5, 8.2, 1.5, 32],
];
function view(i) {
  return () => {
    const [, kind, a, dist, ty, fov] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 500);
    scene.add(terrain(200, 8, () => 0, { color: 0x7a8a6a }));
    let w = null, brute = null; const fx = {};
    if (kind === 'brute') { brute = buildBrute(); scene.add(brute.root); }
    else { w = buildWizard(); scene.add(w.root); scene.add(w.staff); }
    if (kind === 'mana' || kind === 'shield') {
      fx.circle = runeCircle(2.4); scene.add(fx.circle);
      fx.aura = auraShell(1.25); fx.aura.position.set(0, 1.2, 0); scene.add(fx.aura);
      fx.motes = manaMotes({ origin: v3(0, 0.1, 0), spread: v3(3, 0.2, 3) }); scene.add(fx.motes);
    }
    if (kind === 'fire') { fx.fb = fireball(); scene.add(fx.fb); fx.fe = fireEmit({ count: 160 }); scene.add(fx.fe); }
    if (kind === 'bolt') { fx.bolt = new Bolt(900); scene.add(fx.bolt.group); fx.spark = new Bolt(300); scene.add(fx.spark.group); }
    if (kind === 'shield') { fx.sh = shieldDome(2.3); fx.sh.position.set(0, 0.02, 0); scene.add(fx.sh); }
    return { scene, camera, grade: { sat: 1.0, contrast: 1.06, bloom: 0.45, bloomT: 0.66 },
      env: { fog: [40, 200], fogCol: 0x9aa8a0, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xfff0d8, ambient: 0x5a6060, rim: 0x8a8a8a, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x3a4044, hfog: [0, 1, 0, 0] },
      update(lt) {
        for (let k = 0; k < 6; k++) setPL(k, v3(0, -50, 0), 0x000000, 1, 0);
        const look = v3(0, ty, 0);
        if (brute) applyPose(brute, { hipY: 0.95, armR: [-0.3, 0, 0.15], foreR: [-0.3, 0, 0] });
        if (w) {
          const p = kind === 'fire' ? PALM : kind === 'bolt' ? SPARK : kind === 'shield' ? PLANT : kind === 'belt' ? { ...STAND, armL: [-1.55, 0, -0.1], foreL: [-0.5, 0, 0] } : STAND;
          applyPose(w, p); setSkirt(w);
          const tip = holdStaff(w, kind === 'bolt' ? v3(0.05, 1, 0.55) : v3(0, 1, 0.05), lt);
          const lit = { mana: 1, fire: 0.4, bolt: 0.8, shield: 0.9 }[kind] ?? 0.15;
          setRunes(w, lit); setCrystal(w, kind === 'staff' ? 0.7 : lit, kind === 'bolt' ? 0xc0e8ff : 0x60fff0); setEyes(w, lit * 0.6);
          if (fx.circle) { fx.circle.material.uniforms.uOpacity.value = 0.9; fx.circle.rotation.z = lt * 0.4; fx.aura.material.uniforms.uOpacity.value = kind === 'mana' ? 0.09 : 0.03; fx.motes.material.uniforms.uOpacity.value = 0.8; }
          if (kind === 'staff') { w.root.visible = false; w.staff.position.set(0, 0, 0); w.staff.quaternion.identity(); w.staff.userData.crystal.rotation.y = 0.6; w.staff.updateMatrixWorld(true); }
          if (kind === 'fire') {
            w.root.updateMatrixWorld(true); const pp = w.handL.localToWorld(v3(0, -0.02, 0.06)).add(v3(0, 0.24, 0));
            fx.fb.position.copy(pp); setFireball(fx.fb, 0.75, 0.3, lt); fx.fb.userData.glow.material.opacity = 0.42;
            const u = fx.fe.material.uniforms; u.uOrigin.value.copy(pp); u.uOpacity.value = 0.9; u.uSpread.value.setScalar(0.3); u.uVel.value.set(0, 1.2, 0);
            setPL(1, pp, 0xff8a30, 5, 0.9); const hd = w.head.getWorldPosition(v3()); look.copy(pp).lerp(hd, 0.5);
          }
          if (kind === 'bolt') {
            const hit = v3(0.4, 0.02, 3.4);
            w.root.updateMatrixWorld(true); const hl = w.handL.localToWorld(v3(0, -0.04, 0.05)); const sp = [];
            for (let k = 0; k < 3; k++) sp.push(...boltPath(hl, hl.clone().add(v3(Math.sin(k * 2.1) * 0.3, 0.2 + k * 0.1, Math.cos(k * 2.1) * 0.3)), 30 + k, { depth: 3, branches: 0, jag: 0.3 }));
            fx.later = () => { fx.bolt.set(boltPath(tip, hit, 7, { depth: 6, branches: 3, jag: 0.15 }), camera.position, 0.05, 1); fx.spark.set(sp, camera.position, 0.015, 1); };
            setPL(1, tip, 0xa0d8ff, 6, 1.2); setPL(2, hit.clone().add(v3(0, 0.5, 0)), 0xa0d8ff, 8, 1.5); look.set(0.2, ty, 1.6);
          }
          if (kind === 'shield') setShield(fx.sh, 1, lt, 0);
        }
        const far = dist > 3;
        camera.position.set(look.x + Math.sin(a) * dist, look.y + (far ? 0.25 : 0.03), look.z + Math.cos(a) * dist); camera.lookAt(look);
        if (fx.later) fx.later();   // lightning ribbons face the camera, so build them after it moves
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
