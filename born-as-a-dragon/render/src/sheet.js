// Dragon design reference: the same creature at every life stage.
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildDragon, posePart, buildEgg } from './dragon.js';
export const VIEWS = [
  ['EGG', 'egg', 0.4, 1.6, 0.22, 30], ['HATCHLING', 'hatchling', 0.9, 1.6, 0.15, 34], ['JUVENILE', 'juvenile', 0.8, 4.0, 0.4, 34], ['YOUNG', 'young', 0.75, 9.0, 1.0, 34],
  ['ADULT — WINGS SPREAD', 'adult', 0.3, 30, 3.2, 34], ['ANCIENT', 'ancient', 0.6, 70, 7.0, 34], ['HEAD (ADULT)', 'adult', 0.5, 4.2, 4.6, 30], ['THE BONES', 'skeleton', 0.8, 70, 6.0, 34],
];
function view(i) {
  return () => {
    const [name, stage, a, dist, ty, fov] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 3000);
    scene.add(terrain(800, 8, () => 0, { color: 0x5a5a60 }));
    let d = null, egg = null;
    if (stage === 'egg') { egg = buildEgg(); egg.position.set(0, 0.16, 0); scene.add(egg); }
    else { d = buildDragon(stage === 'skeleton' ? 'ancient' : stage, stage === 'skeleton' ? { skeleton: true } : {}); scene.add(d.root); }
    return { scene, camera, grade: { sat: 0.95, contrast: 1.1, bloom: 0.6, bloomT: 0.6 },
      env: { fog: [40, 900], fogCol: 0x3a3c44, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xb8b0a8, ambient: 0x4a4a52, rim: 0x8a6a60, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x3a3a46, hfog: [0, 1, 0, 0] },
      update(lt) {
        if (d) {
          const spread = name.startsWith('ADULT');
          posePart(d, { t: 1, wingUp: spread ? 0.55 : 0.3, wingFold: spread ? 0 : 0.75, wingSweep: spread ? 0.0 : 0.2, neckPitch: 0.3, jaw: name.startsWith('HEAD') ? 0.35 : 0.08, tailWave: 0.1 });
        }
        if (egg) egg.userData.m.uniforms.uEmissive.value.setRGB(1.2, 0.8, 0.5);
        const target = name.startsWith('HEAD') ? d.headScale.localToWorld(v3(0, 0, 0.15)) : v3(0, ty, 0);
        camera.position.set(target.x + Math.sin(a) * dist, target.y + dist * 0.12, target.z + Math.cos(a) * dist); camera.lookAt(target);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
