// Design reference: the Violet Smith, the crusaders, the wanderer, the wizard, and the weapons of this world.
import { THREE, v3, mat } from '/the-last-ember/render/src/engine.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildKnight, kStand, setGrip, updateCape, buildSword, buildAxe, buildShield, buildSpear, tankard } from './knight.js';
import { buildWizard, setSkirt, holdStaff, setCrystal } from '/cast-spells/render/src/wizard.js';
export const VIEWS = [
  ['THE VIOLET SMITH', 'smith', 0.35, 3.8, 1.0, 30], ['SMITH — BACK', 'smith', Math.PI - 0.4, 3.8, 1.0, 30], ['THE CRUSADER', 'crusader', 0.35, 3.8, 1.0, 30], ['CRUSADER — SIDE', 'crusader', -Math.PI / 2 + 0.3, 3.8, 1.0, 30],
  ['THE WANDERER', 'dark', 0.4, 3.8, 1.0, 30], ['WANDERER — BACK', 'dark', Math.PI - 0.3, 3.8, 1.0, 30], ['THE WIZARD', 'wizard', 0.4, 4.0, 1.1, 30], ['WIZARD — BACK', 'wizard', Math.PI, 4.0, 1.2, 30],
  ['HELMS', 'helms', 0.0, 3.2, 1.45, 46], ['WEAPONS', 'weapons', 0.0, 4.6, 0.95, 36], ['SHIELDS', 'shields', 0.0, 3.9, 0.9, 34], ['THE FORGED BLADE', 'blade', 0.35, 2.4, 0.62, 34],
];
function view(i) {
  return () => {
    const [, kind, a, dist, ty, fov] = VIEWS[i]; const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 200);
    scene.add(terrain(60, 4, () => 0, { color: 0x5a5868 })); const ks = []; let w = null;
    if (['smith', 'crusader', 'dark'].includes(kind)) { const k = buildKnight(kind, { hammer: kind === 'smith' }); scene.add(k.root); ks.push(k); }
    if (kind === 'helms') ['smith', 'crusader', 'dark'].forEach((kt, n) => { const k = buildKnight(kt); k.root.position.set((n - 1) * 0.5, 0, (n === 1 ? -0.4 : 0)); scene.add(k.root); ks.push(k); });
    if (kind === 'wizard') { w = buildWizard(); scene.add(w.root); scene.add(w.staff); }
    if (kind === 'weapons') { const s = buildSword(); s.rotation.set(-Math.PI / 2, 0, 0); s.position.set(-0.6, 0.12, 0); scene.add(s); const ax = buildAxe(); ax.position.set(0, 0, 0); scene.add(ax); const sp = buildSpear(); sp.position.set(0.55, 0, 0); scene.add(sp); const t = tankard(); t.position.set(-0.3, 0, 0.5); scene.add(t); }
    if (kind === 'shields') { const a1 = buildShield('kite'); a1.position.set(-0.4, 0.9, 0); scene.add(a1); const a2 = buildShield('round'); a2.position.set(0.45, 0.9, 0); scene.add(a2); }
    if (kind === 'blade') { const s = buildSword({ len: 0.9, blade: mat({ color: 0xd8b8ff, emissive: 0x7030d0, unlit: true }) }); s.rotation.set(-Math.PI / 2, 0, 0.0); s.position.set(0, 0.12, 0); scene.add(s); }
    return { scene, camera, grade: { sat: 1.0, contrast: 1.05, bloom: 0.3, bloomT: 0.8 },
      env: { fog: [40, 200], fogCol: 0x6a6478, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xf0e8ff, ambient: 0x56546a, rim: 0xa090c8, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x3a3848, hfog: [0, 1, 0, 0] },
      update(lt) { ks.forEach(k => { applyPose(k, { ...kStand(), armR: [-0.25, 0, 0.14], foreR: [-0.5, 0, 0] }); setGrip(k, 'R', 1); setGrip(k, 'L', 0.4); updateCape(k, lt, { wind: 0.3 }); });
        if (w) { applyPose(w, { hipY: 1.0, armR: [-0.35, 0, 0.12], foreR: [-0.7, 0, 0], armL: [0.05, 0, -0.12] }); setSkirt(w); holdStaff(w, v3(0, 1, 0.05), lt); setCrystal(w, 0.6, 0x60ff90); }
        camera.position.set(Math.sin(a) * dist, ty + 0.15, Math.cos(a) * dist); camera.lookAt(0, ty, 0); } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
