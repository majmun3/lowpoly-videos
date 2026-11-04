// Blacksmith design reference: one man from boyhood to old age, his father, the apprentice, the tools, and the blow.
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildSmith, setGrip, setFace, setJiggle, strikePoses, strikePose, hammering } from './smith.js';
import { anvil, materials, bucket, horseshoe } from './forge.js';
const HAIR = 0x6a4428, BEARD = 0x5a3a22;
export const VIEWS = [
  ['FRONT', 'adult', 0.0, 3.6, 1.0, 30], ['THREE-QUARTER', 'adult', 0.7, 3.6, 1.0, 30], ['SIDE', 'adult', -Math.PI / 2, 3.6, 1.0, 30], ['BACK', 'adult', Math.PI, 3.6, 1.0, 30],
  ['FACE', 'face', 0.3, 0.9, 1.68, 30], ['HANDS & HAMMER', 'hands', 0.6, 1.4, 1.05, 30], ['AGE SEVEN', 'child', 0.5, 3.0, 0.65, 30], ['AGE TWELVE', 'youth', 0.5, 3.2, 0.8, 30],
  ['OLD AGE', 'old', 0.5, 3.4, 0.95, 30], ['HIS FATHER', 'father', 0.5, 3.6, 1.0, 30], ['THE APPRENTICE', 'apprentice', 0.5, 3.2, 0.8, 30], ['ANVIL & TOOLS', 'tools', 0.7, 2.6, 0.6, 34],
];
function view(i) {
  return () => {
    const [, kind, a, dist, ty, fov] = VIEWS[i]; const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 200);
    scene.add(terrain(60, 4, () => 0, { color: 0x6a6460 })); let j = null;
    if (['adult', 'face', 'hands'].includes(kind)) j = buildSmith({ age: 'adult', hair: HAIR, beard: BEARD, seed: 2101, gloveL: kind !== 'hands' });
    if (kind === 'child') j = buildSmith({ age: 'child', hair: HAIR, seed: 2101, hammer: false }); if (kind === 'youth') j = buildSmith({ age: 'youth', hair: HAIR, seed: 2101, hammer: true });
    if (kind === 'old') j = buildSmith({ age: 'old', seed: 2101 }); if (kind === 'father') j = buildSmith({ age: 'adult', hair: 0x2e2218, beard: 0x241a12, bulk: 1.18, skin: 0xd09878, seed: 2201 });
    if (kind === 'apprentice') j = buildSmith({ age: 'youth', normal: true, hair: 0xc89a5a, skin: 0xe8b090, sooty: false, hammer: false, apron: true, seed: 2301 });
    if (j) scene.add(j.root);
    if (kind === 'tools') { const M = materials(); const an = anvil(M); scene.add(an); const bk = bucket(M); bk.position.set(0.7, 0, 0.3); scene.add(bk); for (let k = 0; k < 3; k++) { const h = horseshoe(M); h.position.set(-0.45 + k * 0.15, 0.06, 0.55); h.rotation.set(-Math.PI / 2, 0, 0); scene.add(h); } }
    return { scene, camera, grade: { sat: 1.0, contrast: 1.05, bloom: 0.3, bloomT: 0.8 },
      env: { fog: [40, 200], fogCol: 0x8a8480, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xfff0e0, ambient: 0x5c5856, rim: 0x9a9080, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x403a38, hfog: [0, 1, 0, 0] },
      update(lt) {
        if (j) { const P = strikePoses({ k: j.k }); if (kind === 'hands') { applyPose(j, { ...P.REST, armL: [-0.9, 0.3, -0.2], foreL: [-1.0, 0, 0], handL: [0, 0, -1.2], spine: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0] }); setGrip(j, 'R', 1); setGrip(j, 'L', 0.2); }
          else { applyPose(j, kind === 'old' ? { hipY: 0.9 * j.k, spine: [0.35, 0, 0], neck: [0.1, 0, 0], armR: [-0.3, 0, 0.12], foreR: [-0.6, 0, 0] } : { hipY: 0.95 * j.k, armL: [0.05, 0, -0.1], armR: [-0.25, 0, 0.12], foreR: [-0.5, 0, 0] }); setGrip(j, 'R', 1); setGrip(j, 'L', 0.4); }
          setFace(j, { brow: -0.2 }); setJiggle(j, {}); }
        const look = kind === 'hands' ? v3(0.15, ty, 0.35) : v3(0, ty, 0); camera.position.set(look.x + Math.sin(a) * dist, ty + 0.12, look.z + Math.cos(a) * dist); camera.lookAt(look);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
