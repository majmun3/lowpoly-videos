// Cael Vorn — PERMANENT reference sheet for the Vigil Plate (Episode 3 onward).
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { applyPose, walkPose, updateKnight } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildCaelVigil, placeShield, updateScarf } from './vigil.js';
// [label, yaw, distance, targetY, fov, pose]
export const VIEWS = [
  ['FRONT', 0, 5.0, 1.0, 30, 'stand'], ['BACK', Math.PI, 5.0, 1.0, 30, 'stand'], ['SIDE', Math.PI / 2, 5.0, 1.0, 30, 'stand'], ['THREE-QUARTER', 0.7, 5.0, 1.0, 30, 'stand'],
  ['HELM', 0.55, 1.5, 1.82, 26, 'stand'], ['HELM FRONT', 0.0, 1.5, 1.8, 26, 'stand'], ['CHEST & PAULDRONS', 0.35, 2.2, 1.45, 30, 'stand'], ['SHIELD', 0.15, 2.4, 1.15, 30, 'guard'],
  ['WITH VOWBRAND & SHIELD', 0.45, 5.4, 1.05, 30, 'guard'],
];
const GUARD = { hipY: 0.95, spine: [0.1, 0, 0], chest: [0, 0.15, 0], armR: [-0.6, -0.1, 0.25], foreR: [-0.9, 0, 0], armL: [-0.7, 0.55, -0.25], foreL: [-1.45, 0, 0], thighL: [-0.35, 0, 0.06], shinL: [0.45, 0, 0], thighR: [0.25, 0, -0.06], shinR: [0.3, 0, 0], footR: [-0.15, 0, 0] };
function view(i) {
  return () => {
    const [name, a, dist, ty, fov, pose] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.05, 200);
    scene.add(terrain(60, 8, () => 0, { color: 0x6a6a70 }));
    const k = buildCaelVigil(); scene.add(k.root); scene.add(k.shield);
    return { scene, camera, grade: { sat: 0.95, contrast: 1.05, bloom: 0.4, bloomT: 0.7 },
      env: { fog: [30, 90], fogCol: 0x3a3c44, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xc0bab4, ambient: 0x4e4e58, rim: 0x6a6a7a, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x3a3a46, hfog: [0, 1, 0, 0] },
      update(lt) {
        if (pose === 'guard') { applyPose(k, GUARD); k.sword.rotation.set(Math.PI / 2 + 0.35, 0, 0); }
        else { const p = walkPose(0, { stride: 0 }); p.armR = [-0.2, 0, 0.15]; p.foreR = [-0.15, 0, 0]; applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0); }
        updateKnight(k, 0.7, { wind: 0.25, swing: 0.0 }); updateScarf(k, 0.7, { wind: 0.3 });
        if (name === 'SHIELD') { k.shield.position.set(0.0, 0.6, 1.35); k.shield.rotation.set(-0.08, 0.12, 0); camera.position.set(0.25, 0.75, 3.05); camera.lookAt(0, 0.62, 1.35); return; }
        placeShield(k, k.shield, pose === 'guard' ? 'arm' : 'back');
        const lp = k.lantern.getWorldPosition(v3()); setPL(0, lp, 0xff8a30, 3, 1.0);
        camera.position.set(Math.sin(a) * dist, ty + (dist > 2.5 ? 0.15 : 0.04), Math.cos(a) * dist); camera.lookAt(0, ty, 0);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
