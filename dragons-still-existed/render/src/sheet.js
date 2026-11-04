// Design reference: the people of this Earth (one shared body type), the dragon species, vehicles and signs.
import { THREE, v3 } from '/the-last-ember/render/src/engine.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';
import { terrain } from '/the-last-ember/render/src/world.js';
import { posePart } from '/born-as-a-dragon/render/src/dragon.js';
import { buildPerson, pStand, setJiggle, buildModernDragon, saddle, armor, vehicle, helicopter, fighterJet, signPost } from './modern.js';
const OUT = ['casual', 'office', 'police', 'fire', 'pilot', 'worker', 'vet', 'soldier'];
export const VIEWS = [
  ['PEOPLE — FRONT', 'people', 0.0, 6, 0.9, 32], ['PEOPLE — SIDE', 'people', -Math.PI / 2 + 0.35, 6, 0.9, 32], ['PEOPLE — BACK', 'people', Math.PI, 6, 0.9, 32], ['UNIFORMS', 'uniforms', 0.3, 8, 0.9, 32],
  ['SLATE COMMON DRAGON', 'slate', 0.9, 70, 6, 40], ['RUST & MOSS', 'two', 0.7, 95, 6, 40], ['DOMESTICATED (SADDLE)', 'saddle', 0.9, 60, 6, 40], ['MILITARY (ARMOUR)', 'army', 0.9, 60, 6, 40],
  ['SCALE', 'scale', 0.6, 75, 8, 40], ['EMERGENCY VEHICLES', 'vehicles', 0.6, 38, 1.5, 40], ['AIRCRAFT', 'air', 0.7, 45, 3, 40], ['SIGNS', 'signs', 0.0, 7, 2.4, 40],
];
function view(i) {
  return () => {
    const [, kind, a, dist, ty, fov] = VIEWS[i]; const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 9 / 16, 0.1, 2000);
    scene.add(terrain(800, 8, () => 0, { color: 0x8a8c90 })); const ppl = [], ds = [];
    if (kind === 'people' || kind === 'uniforms') { const list = kind === 'people' ? [['casual', true], ['office', false], ['casual', false], ['office', true]] : [['police'], ['fire'], ['pilot'], ['worker'], ['vet'], ['soldier']]; list.forEach(([o, f], k) => { const p = buildPerson({ outfit: o, seed: 300 + k + (kind === 'people' ? 0 : 10), female: f }); p.root.position.set((k - (list.length - 1) / 2) * 0.95, 0, 0); scene.add(p.root); ppl.push(p); }); }
    const addD = (s, x, z, ry, o = {}) => { const d = buildModernDragon(s, { scale: 9 }); d.root.position.set(x, 0, z); d.root.rotation.y = ry; scene.add(d.root); if (o.saddle) saddle(d); if (o.armor) armor(d); ds.push(d); return d; };
    if (kind === 'slate') addD('slate', 0, 0, 0.3); if (kind === 'two') { addD('rust', -12, 0, 0.5); addD('moss', 14, -6, -0.2); } if (kind === 'saddle') addD('cobalt', 0, 0, 0.3, { saddle: true }); if (kind === 'army') addD('ash', 0, 0, 0.3, { armor: true });
    if (kind === 'scale') { addD('slate', 0, 0, 0.6); const b = vehicle('bus'); b.position.set(14, 0, 8); scene.add(b); for (let k = 0; k < 4; k++) { const p = buildPerson({ seed: 400 + k }); p.root.position.set(8 + k * 1.2, 0, 12); scene.add(p.root); ppl.push(p); } }
    if (kind === 'vehicles') { [['police', -8], ['fire', -2], ['ambulance', 4.5], ['meat', 11]].forEach(([k, x]) => { const v = vehicle(k); v.position.set(x, 0, 0); scene.add(v); }); }
    if (kind === 'air') { const h = helicopter(); h.position.set(-10, 6, 0); scene.add(h); const j = fighterJet(); j.position.set(10, 0, 0); j.rotation.y = 0.6; scene.add(j); }
    if (kind === 'signs') { ['noDragon', 'dragonLane', 'register'].forEach((t, k) => { const s = signPost(t, { w: 1.3, hh: 1.3, h: 3.2 }); s.position.set((k - 1) * 1.7, 0, 0); scene.add(s); }); }
    return { scene, camera, grade: { sat: 1.0, contrast: 1.05, bloom: 0.35, bloomT: 0.75 }, env: { fog: [200, 2000], fogCol: 0xb8bcc4, lightDir: v3(-0.4, -0.6, -0.7), lightCol: 0xfff4e8, ambient: 0x6a6c74, rim: 0xa0a4b0, fillDir: v3(0.6, -0.2, 0.8), fillCol: 0x40444c, hfog: [0, 1, 0, 0] },
      update(lt) { ppl.forEach(p => { applyPose(p, pStand()); setJiggle(p, {}); }); ds.forEach(d => posePart(d, { t: lt, wingFold: 0.55, wingUp: 0.5, wingSweep: 0.1, neckPitch: 0.0, headPitch: 0.05 })); camera.position.set(Math.sin(a) * dist, ty + dist * 0.12, Math.cos(a) * dist); camera.lookAt(0, ty, 0); } };
  };
}
export const SHOTS = VIEWS.map((v, i) => ({ id: 'V' + i, start: i, end: i + 1, build: view(i) }));
export const DURATION = VIEWS.length;
export const FX = () => ({});
