// Dwarf design reference: the protagonist at every stage, his axe, and the people and orcs of his world.
import { THREE, v3, setPL } from '/the-last-ember/render/src/engine.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { buildDwarf, buildDwarfNPC, buildOrcKing, dStand, holdAxe, axeOnBack, setJiggle } from './dwarf.js';

// [label, kind, camera angle, distance, look height, fov]
export const VIEWS = [
  ['FRONT', 'warrior', 0.0, 3.6, 0.72, 30], ['THREE-QUARTER', 'warrior', 0.7, 3.6, 0.72, 30], ['SIDE — THE LEGEND', 'warrior', -Math.PI / 2, 3.6, 0.72, 30], ['BACK', 'warrior', Math.PI, 3.6, 0.72, 30],
  ['FACE & BEARD', 'face', 0.3, 1.3, 1.1, 30], ['THE RUNE AXE', 'axe', 0.9, 3.4, 0.9, 30], ['NEWBORN', 'baby', -1.2, 1.4, 0.15, 30], ['CHILD', 'child', -0.9, 2.8, 0.5, 30],
  ['THE DWARF KING', 'king', 0.6, 3.8, 0.8, 30], ['HIS PEOPLE', 'npcs', 0.25, 5.2, 0.7, 30], ['THE ORC KING', 'orc', 0.5, 9.0, 2.1, 32], ['SCALE', 'scale', 0.35, 9.5, 1.9, 32],
];
function view(i) {
  return () => {
    const [, kind, a, dist, ty, fov] = VIEWS[i];
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.02, 500);
    scene.add(terrain(200, 8, () => 0, { color: 0x8a8070 }));
    const chars = [];
    const add = (c, p = [0, 0, 0], ry = 0) => { c.root.position.set(...p); c.root.rotation.y = ry; scene.add(c.root); if (c.axe && !c.axe.parent) scene.add(c.axe); chars.push(c); return c; };
    let hero = null;
    if (kind === 'warrior' || kind === 'face') hero = add(buildDwarf('warrior'));
    if (kind === 'axe') { hero = add(buildDwarf('warrior')); }
    if (kind === 'baby') hero = add(buildDwarf('baby'));
    if (kind === 'child') hero = add(buildDwarf('child'));
    if (kind === 'king') hero = add(buildDwarf('king'));
    if (kind === 'npcs') { add(buildDwarfNPC({ seed: 3, beard: 0x8a5a34, apron: true }), [-0.9, 0, -0.3], 0.3); add(buildDwarfNPC({ seed: 4, female: true, beard: 0x6a4028, tunic: 0x8a3a30 }), [0.0, 0, 0.1]); add(buildDwarfNPC({ seed: 5, armor: true, helmet: true, beard: 0xc8c0b4 }), [0.9, 0, -0.3], -0.3); add(buildDwarfNPC({ seed: 6, child: true, beard: 0xd8b070, tunic: 0x4a6a8a }), [0.45, 0, 0.6], -0.2); }
    let orc = null;
    if (kind === 'orc' || kind === 'scale') { orc = buildOrcKing(); orc.root.position.set(0, 0, kind === 'scale' ? -0.6 : 0); scene.add(orc.root); }
    if (kind === 'scale') { hero = add(buildDwarf('warrior'), [0.9, 0, 0.9], -0.4); }
    return { scene, camera, grade: { sat: 1.0, contrast: 1.06, bloom: 0.4, bloomT: 0.7 },
      env: { fog: [40, 200], fogCol: 0xb0a898, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xfff0d8, ambient: 0x60585a, rim: 0x9a9080, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x403a38, hfog: [0, 1, 0, 0] },
      update(lt) {
        for (const c of chars) { if (c.stage === 'baby') { setJiggle(c, { bounce: Math.sin(lt * 9) * 0.5 }); continue; } applyPose(c, dStand({ hip: c.hipH })); if (c.butt) setJiggle(c, {}); if (c.axe) { if (kind === 'axe' || kind === 'scale' || kind === 'king') { applyPose(c, { ...dStand({ hip: c.hipH }), armR: [-0.35, 0, 0.3], foreR: [-0.9, 0, 0] }); holdAxe(c, { rx: 0.25 }); } else axeOnBack(c); } }
        if (orc) applyPose(orc, { hipY: 0.95, armR: [-0.3, 0, 0.15], foreR: [-0.3, 0, 0], armL: [0, 0, -0.2] });
        camera.position.set(Math.sin(a) * dist, ty + (dist > 2 ? 0.2 : 0.02), Math.cos(a) * dist); camera.lookAt(0, ty, 0);
      } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
