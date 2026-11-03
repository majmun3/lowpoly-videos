// Goblin design reference: one goblin, every stage of his life, plus the creatures of his world.
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildGoblin, gStand, updateCape, buildKnightNPC, knightMaterials, buildBrute, buildWolf, poseWolf } from './goblin.js';
export const VIEWS = [
  ['RUNT', 'runt', 0.35, 1.7, 0.36, 30], ['SURVIVOR', 'survivor', 0.35, 3.3, 0.68, 30], ['WARLORD', 'warlord', 0.4, 3.6, 0.75, 30], ['GOBLIN KING', 'king', 0.4, 3.8, 0.8, 30],
  ['HEAD — NOTCHED LEFT EAR', 'survivor', -0.5, 1.35, 0.98, 28], ['KING — BACK', 'king', Math.PI - 0.3, 3.8, 0.8, 30], ['KNIGHT OF THE KINGDOM', 'knight', 0.4, 5.2, 1.0, 30], ['THE BRUTE & THE DIRE WOLF', 'brute', 0.5, 8.5, 1.7, 32],
];
function view(i) {
  return () => {
    const [name, kind, a, dist, ty, fov] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 500);
    scene.add(terrain(200, 8, () => 0, { color: 0x7a8a6a }));
    let ch = null, wolf = null;
    if (kind === 'knight') ch = buildKnightNPC(knightMaterials());
    else if (kind === 'brute') { ch = buildBrute(); wolf = buildWolf(); wolf.root.position.set(1.3, 0, 2.4); wolf.root.rotation.y = -0.9; scene.add(wolf.root); }
    else ch = buildGoblin(kind);
    scene.add(ch.root);
    return { scene, camera, grade: { sat: 1.0, contrast: 1.05, bloom: 0.4, bloomT: 0.7 },
      env: { fog: [40, 200], fogCol: 0x9aa890, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xfff0d8, ambient: 0x5a6058, rim: 0x8a8a7a, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x3a4038, hfog: [0, 1, 0, 0] },
      update(lt) {
        if (ch.stage || kind === 'knight') applyPose(ch, gStand({ hip: ch.hipH }));
        if (kind === 'knight' || kind === 'brute') applyPose(ch, { hipY: kind === 'brute' ? 0.95 : 0.98, armR: [-0.3, 0, 0.15], foreR: [-0.3, 0, 0] });
        if (ch.cleaver && ch.stage) { applyPose(ch, { ...gStand({ hip: ch.hipH }), armR: [-0.35, 0, 0.2], foreR: [-0.5, 0, 0] }); }
        updateCape(ch, 0.6, { wind: 0.2 });
        if (wolf) poseWolf(wolf, { phase: 0, run: 0 });
        camera.position.set(Math.sin(a) * dist, ty + (dist > 3 ? 0.25 : 0.03), Math.cos(a) * dist); camera.lookAt(0, ty, 0);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
