// Vampire design reference: the vampire at every stage, and the people of his world.
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildVampire, buildElder, buildHuman, vStand, updateCape, setJiggle, setEyes, Swarm } from './vampire.js';
import { buildKnightNPC, knightMaterials } from '/born-as-a-goblin/render/src/goblin.js';
export const VIEWS = [
  ['FRONT', 'noble', 0.0, 4.6, 1.0, 32], ['THREE-QUARTER', 'noble', 0.75, 4.6, 1.0, 32], ['SIDE', 'noble', -Math.PI / 2, 4.6, 1.0, 32], ['BACK', 'noble', Math.PI, 4.6, 1.0, 32],
  ['FACE', 'face', 0.35, 1.2, 1.68, 30], ['NEWBORN', 'baby', 0.9, 1.1, 0.12, 32], ['CHILD (FIVE)', 'child', -0.8, 3.2, 0.62, 32], ['THE VAMPIRE KING', 'king', 0.6, 4.6, 1.0, 32],
  ['KING — SIDE', 'king', -1.3, 4.6, 1.0, 32], ['THE ELDERS', 'elders', 0.2, 5.6, 1.0, 34], ['HUMANS & KNIGHTS', 'humans', 0.2, 6.0, 1.0, 34], ['THE SWARM', 'bats', 0.3, 5.0, 1.4, 40],
];
function view(i) {
  return () => {
    const [, kind, a, dist, ty, fov] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 500);
    scene.add(terrain(200, 8, () => 0, { color: 0x6a6670 }));
    const chars = []; const add = (c, p = [0, 0, 0], ry = 0) => { c.root.position.set(...p); c.root.rotation.y = ry; scene.add(c.root); chars.push(c); return c; };
    if (['noble', 'face'].includes(kind)) add(buildVampire('noble')); if (kind === 'baby') add(buildVampire('baby')); if (kind === 'child') add(buildVampire('child')); if (kind === 'king') add(buildVampire('king'));
    if (kind === 'elders') { add(buildElder({ seed: 1 }), [-0.8, 0, -0.3], 0.3); add(buildElder({ seed: 2, bald: true, robe: 0xc0a0c0 }), [0.1, 0, 0.1]); add(buildElder({ seed: 3, hair: 0xe8e8f0 }), [0.9, 0, -0.3], -0.3); }
    if (kind === 'humans') { add(buildHuman({ seed: 1, female: true, apron: true, bonnet: true }), [-0.9, 0, 0.2], 0.2); add(buildHuman({ seed: 2, beard: true }), [0.1, 0, 0.3]); const kn = buildKnightNPC(knightMaterials()); kn.root.position.set(1.1, 0, -0.2); kn.root.rotation.y = -0.3; scene.add(kn.root); }
    let sw = null; if (kind === 'bats') { sw = new Swarm(120, { seed: 4, scale: 1.4 }); scene.add(sw.group); }
    return { scene, camera, grade: { sat: 1.0, contrast: 1.06, bloom: 0.4, bloomT: 0.7 },
      env: { fog: [40, 200], fogCol: 0xa8a0a8, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xfff0e8, ambient: 0x5a5868, rim: 0x9a90a8, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x403a48, hfog: [0, 1, 0, 0] },
      update(lt) {
        for (const c of chars) { if (c.stage === 'baby') { setEyes(c, 1); continue; } applyPose(c, c.stage ? vStand(c.k) : { hipY: c.hipH }); if (c.cape) updateCape(c, lt, { wind: 0.2 }); if (c.butt) setJiggle(c, {}); if (c.eyes && c.stage) setEyes(c, 1); }
        if (sw) { const R = (i) => Math.sin(i * 12.9898) * 43758.5453 % 1; sw.set(lt, (i) => ({ on: true, p: v3(Math.sin(i * 2.4) * 1.6 * Math.abs(R(i)), 0.6 + Math.abs(R(i + 7)) * 1.8, Math.cos(i * 1.7) * 1.2), d: v3(Math.cos(i), 0.1, Math.sin(i)) })); }
        camera.position.set(Math.sin(a) * dist, ty + (dist > 2 ? 0.2 : 0.02), Math.cos(a) * dist); camera.lookAt(0, ty, 0);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
