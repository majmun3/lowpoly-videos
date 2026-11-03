// Cael Vorn character reference sheet: the unchanged Episode 1 model on a neutral backdrop.
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { buildKnight, updateKnight, applyPose, walkPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
const VIEWS = [['front', 0, 4.9, 1.0, 30], ['three-quarter', 0.75, 4.9, 1.0, 30], ['side', Math.PI / 2, 4.9, 1.0, 30], ['back', Math.PI, 4.9, 1.0, 30], ['three-quarter back', Math.PI + 0.75, 4.9, 1.0, 30], ['helm', 0.45, 1.7, 1.8, 26], ['helm side', -Math.PI / 2 - 0.05, 1.7, 1.8, 26], ['lantern & sigil', -0.5, 1.6, 0.92, 30]];
function view(i) {
  return () => {
    const [name, a, dist, ty, fov] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.05, 200);
    scene.add(terrain(60, 8, () => 0, { color: 0x6a6a70 }));
    const k = buildKnight(); scene.add(k.root);
    return { scene, camera, grade: { sat: 0.95, contrast: 1.05, bloom: 0.4, bloomT: 0.7 },
      env: { fog: [30, 90], fogCol: 0x3a3c44, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xb8b0a8, ambient: 0x4a4a52, rim: 0x6a6070, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x3a3a44, hfog: [0, 1, 0, 0] },
      update(lt) {
        const p = walkPose(0, { stride: 0 }); p.armR = [-0.2, 0, 0.15]; p.foreR = [-0.15, 0, 0]; applyPose(k, p); k.sword.rotation.set(Math.PI / 2 + 1.25, 0, 0);
        updateKnight(k, 0.7, { wind: 0.25, swing: 0.0 });
        const lp = k.lantern.getWorldPosition(v3()); setPL(0, lp, 0xff8a30, 3, 1.0);
        camera.position.set(Math.sin(a) * dist, ty + (dist > 2 ? 0.15 : 0.04), Math.cos(a) * dist); camera.lookAt(i === 7 ? -0.08 : 0, ty, 0);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
export const NAMES = VIEWS.map(v => v[0]);
