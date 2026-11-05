// DARK FANTASY CINEMATIC — worlds: the portal of the ancients, the knights' hall, the forgotten castle (purple storm),
// the abandoned village in the rain, the ancient cathedral with its floating crystal, and the armory.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, particles } from '/the-last-ember/render/src/engine.js';
import { T, mk, fbm, pixels, clampByte as C } from '/the-last-ember/render/src/textures.js';
import { sky } from '/the-last-ember/render/src/world.js';
import { TF, tbox, village, setFire } from '/born-a-blacksmith/render/src/forge.js';
import { fireP, smokeP } from '/born-as-a-goblin/render/src/gworld.js';
import { castleWorld, SKIES, ENVS, gothicHall } from '/born-as-a-vampire/render/src/vworld.js';
import { mountainMesh } from '/born-as-a-dwarf/render/src/dworld.js';
import { buildKnight, kStand, buildSword, buildAxe, buildSpear, buildShield, tankard, TK } from './knight.js';
import { applyPose } from '/the-last-ember/render/src/characters.js';

const cache = {};
export function TW(name) { if (!cache[name]) cache[name] = MK[name](); return cache[name]; }
const MK = {
  banner: () => mk(32, 64, (x, w, h) => { const n = fbm(w, h, 3101, [16, 8]); pixels(x, w, h, (i, j) => { if (j > h - 6 && (i % 8) < (j - (h - 6)) * 1.4) return [0, 0, 0, 0]; const v = 0.62 + (n(i, j) - 0.5) * 0.2; const cx = Math.abs(i - 15.5), cy = Math.abs(j - 26);
    const cross = (cx < 2.5 && j > 10 && j < 44) || (cy < 2.5 && cx < 11) || (Math.hypot(cx - 9, cy) < 3.2) || (Math.hypot(cx, Math.abs(j - 26) - 15) < 3.2 && cx < 4); if (cross) return [C(v * 240), C(v * 232), C(v * 220), 255];
    if (i < 2 || i > w - 3) return [C(v * 200), C(v * 160), C(v * 80), 255]; return [C(v * 190), C(v * 30), C(v * 36), 255]; }); }),
  parchment: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 3103, [16, 8, 4]), r = fbm(w, h, 3105, [32, 16]); pixels(x, w, h, (i, j) => { let v = 0.78 + (n(i, j) - 0.5) * 0.2; if (Math.abs(r(i, j) - 0.5) < 0.012) v -= 0.35; if ((i + j * 2) % 23 === 0 && n(i, j) > 0.5) v -= 0.25; if (i < 2 || j < 2 || i > w - 3 || j > h - 3) v -= 0.2; return [C(v * 235), C(v * 205), C(v * 150)]; }); }),
  rune: () => mk(64, 64, (x, w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 29, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.save(); g.translate(32 + Math.cos(a) * 25.5, 32 + Math.sin(a) * 25.5); g.rotate(a); g.fillStyle = '#fff'; g.fillRect(-1, -2.5, 2, 5); if (k % 2) g.fillRect(-2.5, -0.5, 5, 1); g.restore(); }
    const m = g.getImageData(0, 0, w, h).data; pixels(x, w, h, (i, j) => (m[(j * w + i) * 4 + 3] > 80 ? [255, 255, 255, 255] : [0, 0, 0, 0])); }, { clamp: true }),
  mossy: () => mk(64, 64, (x, w, h) => { const n = fbm(w, h, 3107, [16, 8, 4]), m = fbm(w, h, 3109, [32, 16]); pixels(x, w, h, (i, j) => { const row = Math.floor(j / 12), off = (row * 9) % 24, bx = (i + off) % 24, by = j % 12; let v = 0.48 + (n(i, j) - 0.5) * 0.22; if (bx < 1 || by < 1) v = 0.24; const moss = m(i, j) > 0.58 ? 1 : 0; return moss ? [C(v * 120), C(v * 160), C(v * 120)] : [C(v * 160), C(v * 170), C(v * 168)]; }); }, { mip: true }),
};
export const PURPLE_SKY = { horizon: 0x6a2a8a, top: 0x0e0618, bottom: 0x160c20, cloud: 0x2a1240, cloudLit: 0xc070ff, sunCol: 0xd060ff, cover: 0.34, swirl: 1.2, sunDir: v3(0.1, 0.12, -1) };
export const PURPLE_ENV = { fog: [20, 900], fogCol: 0x2a1840, hfog: [-4, 6, 0.5, 0.01], lightDir: v3(-0.1, -0.4, 1.0), lightCol: 0xb090e8, ambient: 0x3c3458, rim: 0xc080ff, fillDir: v3(0.4, -0.4, -0.8), fillCol: 0x2a2448 };
SKIES.purple = { ...PURPLE_SKY, sunDir: v3(0.25, 0.05, -1) }; ENVS.purple = { ...PURPLE_ENV, fog: [30, 1400], hfog: [2, 30, 0.55, 0.006] };

// ---------------------------------------------------------------- the portal shader
export function portalMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uTime: G.uTime, uK: { value: 1 }, uAspect: { value: 12 / 22 } }, transparent: false, depthWrite: true,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`uniform float uTime, uK, uAspect; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = vUv * 2.0 - 1.0; p.x *= uAspect; float r = length(p * vec2(1.0, 0.8)); float a = atan(p.y, p.x);
        float sw = a + r * 3.2 - uTime * 0.9; vec2 q = vec2(cos(sw), sin(sw)) * r * 3.0;
        float v = n2(q * 1.7 + uTime * 0.3) * 0.6 + n2(q * 4.3 - uTime * 0.5) * 0.4;
        float band = 0.5 + 0.5 * sin(r * 16.0 - uTime * 3.0 + v * 4.0);
        vec3 deep = vec3(0.10, 0.02, 0.22), mid = vec3(0.50, 0.14, 0.92), hot = vec3(0.98, 0.78, 1.0);
        vec3 c = mix(deep, mid, clamp(v * 0.9 + band * 0.35, 0.0, 1.0));
        float core = smoothstep(0.45, 0.0, r); c = mix(c, hot, core * core * (0.18 + 0.3 * uK) + smoothstep(0.85, 1.0, band * v) * 0.18 * uK);
        float edge = max(abs(vUv.x - 0.5) * 2.0, abs(vUv.y - 0.5) * 2.0); c += vec3(0.8, 0.5, 1.0) * smoothstep(0.86, 1.0, edge) * 0.5 * uK;
        gl_FragColor = vec4(c * (0.5 + 0.3 * uK), 1.0); }` });
}
// ---------------------------------------------------------------- the portal of the ancients
export function portalWorld(o = {}) {
  const scene = new THREE.Scene(); scene.add(sky(PURPLE_SKY));
  const stone = mat({ map: TW('mossy'), color: 0xb8c4bc, rim: 0.4 }), dark = mat({ map: TW('mossy'), color: 0x7a8480, rim: 0.3 }), flags = mat({ map: TF('flags'), repeat: [2, 12], color: 0xa8b0b8, affine: 0.2 });
  const GW = 12, GH = 22, Z = -36;
  const B = []; const D = [];
  B.push(xf(tbox(15, 46, 12, 3), { p: [-(GW / 2 + 7.5), -2, Z - 6] })); B.push(xf(tbox(15, 46, 12, 3), { p: [GW / 2 + 7.5, -2, Z - 6] })); B.push(xf(tbox(GW + 0.2, 46 - GH - 2, 12, 3), { p: [0, GH, Z - 6] }));
  for (const s of [-1, 1]) { D.push(xf(tbox(4, 52, 5, 3), { p: [s * (GW / 2 + 15.5), -2, Z - 1.5] })); D.push(xf(tbox(5, 2, 6, 3), { p: [s * (GW / 2 + 15.5), 50, Z - 1.5] })); D.push(xf(tbox(1.6, GH + 1, 1.6, 2), { p: [s * (GW / 2 + 0.6), 0, Z + 0.4] })); }
  D.push(xf(tbox(GW + 3.4, 1.6, 2.0, 2), { p: [0, GH, Z + 0.4] })); for (let k = 0; k < 6; k++) D.push(xf(tbox(GW + 8 - k * 2.4, 2.0, 3, 2), { p: [0, GH + 4 + k * 2, Z - 1] }));
  for (let x = -GW / 2 - 14; x <= GW / 2 + 14; x += 2.6) if (Math.abs(x) > GW / 2 + 1) D.push(xf(tbox(1.2, 1.6, 12, 2), { p: [x, 44, Z - 6] }));
  mesh(merge(B), stone, scene); mesh(merge(D), dark, scene);
  // the causeway with low parapets and steps up to the gate
  mesh(new THREE.PlaneGeometry(8, 80), flags, scene, [0, 0.01, Z + 40], [-Math.PI / 2, 0, 0]);
  const P = [xf(tbox(8, 6, 80, 3), { p: [0, -6, Z + 40] })]; for (const s of [-1, 1]) { P.push(xf(tbox(0.6, 0.9, 80, 2), { p: [s * 4.3, 0, Z + 40] })); for (let z = Z + 4; z < Z + 80; z += 6) P.push(xf(tbox(0.9, 1.4, 0.9, 1), { p: [s * 4.3, 0, z] })); }
  for (let k = 0; k < 3; k++) P.push(xf(tbox(GW + 2 - k, 0.3, 1.2, 1), { p: [0, k * 0.3, Z + 2.5 - k * 0.9] }));
  mesh(merge(P), dark, scene);
  // the abyss below: far rock spires in fog
  scene.add(mountainMesh((x, z) => -70 + Math.pow(clamp((Math.hypot(x, z + 40) - 120) / 400), 1.2) * 180, { size: 3000, seg: 120, grass: 0x3a3448, rock: 0x4a4458, snowLine: 9999 }));
  const sp = []; const R = rng(7); for (let i = 0; i < 40; i++) { const x = (R() - 0.5) * 260, z = Z - 30 + (R() - 0.3) * 240; if (Math.abs(x) < 26 && z > Z - 20) continue; const hgt = 30 + R() * 70; sp.push(xf(prism(5, 3 + R() * 5, 0.5, hgt), { p: [x, -72, z], r: [(R() - 0.5) * 0.2, R() * 3, (R() - 0.5) * 0.2] })); } mesh(merge(sp), dark, scene);
  // the portal itself
  const pm = portalMaterial(); const portal = mesh(new THREE.PlaneGeometry(GW, GH), pm, scene, [0, GH / 2, Z + 0.05]);
  const halo = glow(0x9040ff, 34, 0.18); halo.position.set(0, GH / 2, Z + 1.5); scene.add(halo);
  const rim = mesh(new THREE.PlaneGeometry(GW + 3, GH + 2.5), mat({ color: 0x9040ff, unlit: true, additive: true, opacity: 0.18, fogScale: 0.3 }), scene, [0, GH / 2, Z + 0.6]);
  const motes = particles({ mode: 'drift', count: 500, box: v3(14, 16, 40), origin: v3(0, 6, Z + 18), vel: v3(0, 0.25, -1.2), size: 0.06, c0: 0xe0b0ff, c1: 0x9040ff, seed: 3111, swirl: 1.4, opacity: 0.9, fogMix: 0.2 }); scene.add(motes);
  const braziers = []; for (const s of [-1, 1]) { const p = v3(s * 5.4, 1.5, Z + 5); mesh(prism(6, 0.5, 0.8, 1.4), dark, scene, [p.x, 0, p.z]); const f = particles({ mode: 'emit', count: 60, origin: p.clone().add(v3(0, 0.1, 0)), spread: v3(0.35, 0.1, 0.35), vel: v3(0, 1.8, 0), life: 0.7, size: 0.45, c0: 0xf0d0ff, c1: 0xa040ff, c2: 0x300860, soft: true, seed: 3120 + s, opacity: 1, fogMix: 0.1 }); scene.add(f); const gl = glow(0xb060ff, 4, 0.55); gl.position.copy(p).add(v3(0, 0.6, 0)); scene.add(gl); braziers.push(p); }
  return { scene, portal, pm, halo, rim, Z, GW, GH, braziers };
}

// ---------------------------------------------------------------- the knights' hall
export function knightsHall() {
  const scene = new THREE.Scene(); const st = mat({ map: TF('stoneW'), color: 0x8a90c8, rim: 0.3 }), beam = mat({ map: TF('beam'), rim: 0.4 }), plank = mat({ map: TF('plank'), rim: 0.3 });
  const W = 9, L = 8, H = 6.5;
  mesh(new THREE.PlaneGeometry(W, L), mat({ map: TF('flags'), repeat: [3, 3], color: 0x9a98b0 }), scene, [0, 0, -L / 2 + 2], [-Math.PI / 2, 0, 0]);
  const B = [xf(tbox(W, H, 0.5, 2), { p: [0, 0, -L + 2] }), xf(tbox(0.5, H, L, 2), { p: [-W / 2, 0, -L / 2 + 2] }), xf(tbox(0.5, H, L, 2), { p: [W / 2, 0, -L / 2 + 2] })]; mesh(merge(B), st, scene);
  const bm = []; for (const x of [-3, 0, 3]) bm.push(xf(box(0.3, 0.35, L), { p: [x, H - 0.2, -L / 2 + 2] })); for (const x of [-W / 2 + 0.3, W / 2 - 0.3]) for (const z of [-5.5, -1.5]) bm.push(xf(box(0.35, H, 0.35, 'bottom'), { p: [x, 0, z] })); mesh(merge(bm), beam, scene);
  mesh(new THREE.PlaneGeometry(W, L), beam, scene, [0, H, -L / 2 + 2], [Math.PI / 2, 0, 0]);
  // banners on the back wall
  const banM = mat({ map: TW('banner'), alphaTest: 0.5, side: THREE.DoubleSide, wrap: 0.8 }); const banners = [];
  for (const x of [-3.0, -1.0, 1.0, 3.0]) { const g = new THREE.PlaneGeometry(1.1, 2.4, 2, 6); const b = mesh(g, banM, scene, [x, H - 1.75, -L + 2.3]); b.userData.p0 = Float32Array.from(g.attributes.position.array); banners.push(b); mesh(box(1.3, 0.06, 0.06), beam, scene, [x, H - 0.52, -L + 2.3]); }
  // the long table, benches, the map, a candle, tankards, a few props
  const tbl = group(scene, [0, 0, 0]); mesh(tbox(3.6, 0.1, 1.3, 1, 'center'), plank, tbl, [0, 0.78, 0]); for (const [x, z] of [[-1.6, -0.5], [1.6, -0.5], [-1.6, 0.5], [1.6, 0.5]]) mesh(box(0.12, 0.78, 0.12, 'bottom'), beam, tbl, [x, 0, z]);
  mesh(tbox(3.4, 0.08, 0.42, 1, 'bottom'), plank, scene, [0, 0.42, -1.05]); for (const x of [-1.5, 0, 1.5]) mesh(box(0.1, 0.42, 0.35, 'bottom'), beam, scene, [x, 0, -1.05]);
  mesh(new THREE.PlaneGeometry(1.1, 0.8), mat({ map: TW('parchment'), rim: 0.3, side: THREE.DoubleSide }), scene, [0.15, 0.835, 0.12], [-Math.PI / 2, 0, 0.12]);
  mesh(new THREE.PlaneGeometry(0.5, 0.36), mat({ map: TW('parchment'), color: 0xd8c8b0, side: THREE.DoubleSide }), scene, [-0.8, 0.838, 0.25], [-Math.PI / 2, 0, -0.3]);
  const cand = group(scene, [0.45, 0.83, 0.38]); mesh(prism(8, 0.07, 0.09, 0.05), mat({ map: TK('black'), rim: 1 }), cand); mesh(prism(8, 0.035, 0.035, 0.16), mat({ color: 0xe8e0c8, rim: 0.4 }), cand, [0, 0.05, 0]);
  const flame = glow(0xffc070, 0.32, 0.95); flame.position.set(0.45, 1.09, 0.38); scene.add(flame); const core = glow(0xfff0c0, 0.09, 1); core.position.copy(flame.position); scene.add(core);
  for (const [x, z] of [[1.2, 0.2], [-1.4, 0.3]]) { const t = tankard({ wood: true }); t.position.set(x, 0.83, z); scene.add(t); }
  const dag = buildSword({ len: 0.3 }); dag.position.set(-0.3, 0.86, 0.4); dag.rotation.set(-Math.PI / 2, 0, 0); dag.rotation.z = 0.6; scene.add(dag);
  // wall sconces
  const sconces = []; for (const x of [-W / 2 + 0.35, W / 2 - 0.35]) for (const z of [-3.5]) { const p = v3(x, 3.0, z); sconces.push(p); scene.add(fireP({ origin: p, spread: v3(0.08, 0.04, 0.08), size: 0.28, count: 30, vel: v3(0, 1.2, 0), life: 0.5, seed: 3130 + (x > 0 ? 1 : 0) })); const g = glow(0xff9a40, 2.0, 0.5); g.position.copy(p); scene.add(g); }
  scene.add(particles({ mode: 'drift', count: 200, box: v3(W, H, L), origin: v3(0, H / 2, -L / 2 + 2), vel: v3(0.03, 0.06, 0.02), size: 0.02, c0: 0xd0c8ff, seed: 3140, swirl: 0.5, opacity: 0.6, fogMix: 0.2 }));
  return { scene, flame, core, banners, sconces, candle: flame.position.clone() };
}
export function waveBanners(E, t) { E.banners.forEach((b, k) => { const p = b.geometry.attributes.position, p0 = b.userData.p0; for (let i = 0; i < p.count; i++) { const y = p0[i * 3 + 1]; const f = (1.2 - y) / 2.4; p.setZ(i, Math.sin(t * 1.3 + k + y * 2) * 0.04 * f); } p.needsUpdate = true; b.geometry.computeVertexNormals(); }); }

// ---------------------------------------------------------------- the forgotten castle under a purple storm
export function purpleCastle() {
  const E = castleWorld({ sky: 'purple' }); const sun = glow(0xff6090, 160, 0.55); sun.position.set(260, 40, -1300); E.scene.add(sun); const sun2 = glow(0xffa0c0, 50, 0.9); sun2.position.copy(sun.position); E.scene.add(sun2);
  const R = rng(3150); const fogs = []; for (let i = 0; i < 5; i++) { const f = particles({ mode: 'drift', count: 60, box: v3(180, 16, 120), origin: v3(0, E.castle.position.y + 18 + i * 10, E.castle.position.z), vel: v3(4 + R() * 3, 0, 0.5), size: 22, c0: 0x8a70b0, c1: 0x5a4878, soft: true, additive: false, opacity: 0.18, seed: 3151 + i, swirl: 0.3, fogMix: 0.4 }); E.scene.add(f); fogs.push(f); }
  return { ...E, sun };
}

// ---------------------------------------------------------------- rain (thin instanced streaks that follow the camera)
export class Rain {
  constructor(n = 1600, o = {}) {
    this.n = n; this.box = o.box ?? v3(16, 12, 16); const g = box(0.008, o.len ?? 0.35, 0.008); this.m = new THREE.InstancedMesh(g, mat({ color: o.color ?? 0xa8b4d8, unlit: true, additive: true, opacity: o.opacity ?? 0.55, fogScale: 0.4 }), n); this.m.frustumCulled = false;
    const R = rng(o.seed ?? 3160); this.s = Array.from({ length: n }, () => [R(), R(), R(), 0.8 + R() * 0.4]); this.M4 = new THREE.Matrix4(); this.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, 0, 0.05)); this.speed = o.speed ?? 11;
  }
  update(t, center) { const b = this.box; for (let i = 0; i < this.n; i++) { const [a, c, d, sp] = this.s[i]; const y = ((c * b.y - t * this.speed * sp) % b.y + b.y) % b.y; this.M4.compose(v3(center.x + (a - 0.5) * b.x + y * 0.04, center.y - b.y / 2 + y, center.z + (d - 0.5) * b.z), this.q, v3(1, 1, 1)); this.m.setMatrixAt(i, this.M4); } this.m.instanceMatrix.needsUpdate = true; }
}
// ---------------------------------------------------------------- the abandoned village in the rain
export function abandonedVillage() {
  const V = village({ night: true }); const scene = V.scene;
  scene.traverse(o => { if (o.isPoints) o.visible = false; }); setFire(V.smithy, 0, 0); V.smithy.userData.fglow.visible = false; V.smithy.userData.lantern.visible = false;
  V.M.win.uniforms.uColor.value.set(0x141218);   // dark, empty windows
  const torches = []; const tm = mat({ map: TK('black'), rim: 1 });
  for (const [x, z, ry] of [[-30.5, 1.7, 0], [-38.5, 1.9, 0], [-46.5, 1.7, 0], [-34.5, 12.4, Math.PI], [-42.5, 12.6, Math.PI], [-50.5, 12.4, Math.PI]]) { const p = v3(x, 2.3, z); mesh(box(0.06, 0.5, 0.06), tm, scene, [x, 2.0, z], [ry ? -0.4 : 0.4, 0, 0]); scene.add(fireP({ origin: p, spread: v3(0.08, 0.04, 0.08), size: 0.3, count: 30, vel: v3(0.2, 1.3, 0), life: 0.5, seed: 3170 + torches.length })); const g = glow(0xff9040, 3, 0.55); g.position.copy(p); scene.add(g); torches.push(p); }
  const wet = mesh(new THREE.PlaneGeometry(120, 8), mat({ color: 0x5a6080, unlit: true, additive: true, opacity: 0.05, fogScale: 0.3 }), scene, [0, 0.03, 6.5], [-Math.PI / 2, 0, 0]);
  return { ...V, torches };
}

// ---------------------------------------------------------------- the ancient cathedral and its crystal
export function cathedral() {
  const E = gothicHall({ W: 20, L: 64, H: 30, step: 8, candelabras: [], shaft: 0.1, shaftCol: 0xb890ff, carpet: false, decayable: true });
  E.M.gwin.uniforms.uColor.value.set(0xb898ff); setTimeout(() => {}, 0);
  const stone = mat({ map: TW('mossy'), color: 0xb0b4c8, rim: 0.4 }); const az = -50;
  const alt = [xf(tbox(9, 0.5, 7, 2), { p: [0, 0, az] }), xf(tbox(7, 0.5, 5.4, 2), { p: [0, 0.5, az] }), xf(tbox(5, 0.5, 3.8, 2), { p: [0, 1.0, az] }), xf(tbox(2.6, 1.3, 1.6, 1), { p: [0, 1.5, az] })];
  for (const s of [-1, 1]) alt.push(xf(prism(8, 0.5, 0.45, 5.5), { p: [s * 3.4, 1.5, az - 0.6] }));
  mesh(merge(alt), stone, E.scene);
  const cp = v3(0, 4.9, az); const crystal = mesh(flat(new THREE.OctahedronGeometry(0.6, 0)), mat({ color: 0xd8a8ff, emissive: 0x8040ff, unlit: true }), E.scene, cp.toArray(), [0, 0, 0], [1, 1.7, 1]);
  const inner = mesh(flat(new THREE.OctahedronGeometry(0.75, 0)), mat({ color: 0xa060ff, unlit: true, additive: true, opacity: 0.35, side: THREE.DoubleSide }), E.scene, cp.toArray(), [0, 0, 0], [1, 1.7, 1]);
  const cg = glow(0xa050ff, 7, 0.55); cg.position.copy(cp); E.scene.add(cg);
  const ringM = mat({ map: TW('rune'), color: 0xc890ff, unlit: true, additive: true, alphaTest: 0.4, side: THREE.DoubleSide, fogScale: 0.3 }); const rings = [0, 1, 2].map(k => mesh(new THREE.PlaneGeometry(2.6 + k * 0.9, 2.6 + k * 0.9), ringM, E.scene, cp.toArray()));
  const swirl = particles({ mode: 'emit', count: 260, origin: cp, spread: v3(1.6, 0.6, 1.6), vel: v3(0, 0.5, 0), life: 2.4, size: 0.07, c0: 0xf0d8ff, c1: 0xa060ff, c2: 0x3010a0, seed: 3180, swirl: 3.0, opacity: 1, fogMix: 0.1 }); E.scene.add(swirl);
  const dust = particles({ mode: 'drift', count: 700, box: v3(18, 26, 60), origin: v3(0, 12, -26), vel: v3(0.04, 0.08, 0.02), size: 0.035, c0: 0xe8dcff, seed: 3181, swirl: 0.6, opacity: 0.7, fogMix: 0.3 }); E.scene.add(dust);
  return { ...E, crystal, inner, cg, rings, cp, az };
}

// ---------------------------------------------------------------- the armory
export function armoryHall() {
  const scene = new THREE.Scene(); const st = mat({ map: TF('stoneW'), color: 0x9a94b8, rim: 0.3 }), beam = mat({ map: TF('beam'), rim: 0.4 }), wood = beam;
  const W = 10, L = 32, H = 7, wallX = W / 2 - 0.3;
  mesh(new THREE.PlaneGeometry(W, L), mat({ map: TF('flags'), repeat: [3, 9], color: 0x9a96aa, affine: 0.2 }), scene, [0, 0, -L / 2 + 2], [-Math.PI / 2, 0, 0]);
  mesh(merge([xf(tbox(0.5, H, L, 2), { p: [-W / 2, 0, -L / 2 + 2] }), xf(tbox(0.5, H, L, 2), { p: [W / 2, 0, -L / 2 + 2] }), xf(tbox(W, H, 0.5, 2), { p: [0, 0, -L + 2] }), xf(tbox(W, H, 0.5, 2), { p: [0, 0, 2.2] })]), st, scene);
  const bm = []; for (let z = 1; z > -L + 2; z -= 3.2) bm.push(xf(box(W, 0.3, 0.3), { p: [0, H - 0.2, z] })); bm.push(xf(box(0.3, 0.3, L), { p: [0, H - 0.2, -L / 2 + 2] })); mesh(merge(bm), beam, scene); mesh(new THREE.PlaneGeometry(W, L), beam, scene, [0, H, -L / 2 + 2], [Math.PI / 2, 0, 0]);
  // high window slits on the left wall with violet light falling across the floor
  const slitM = mat({ color: 0xb098ff, unlit: true, fogScale: 0.4 }), shaftM = mat({ color: 0xa080ff, unlit: true, additive: true, opacity: 0.07, side: THREE.DoubleSide, fogScale: 0.3 });
  for (let z = -1; z > -L + 3; z -= 4) { mesh(box(0.05, 1.6, 0.5), slitM, scene, [-W / 2 + 0.26, 5.0, z]); mesh(new THREE.PlaneGeometry(0.8, 9), shaftM, scene, [-1.6, 3.2, z], [0, Math.PI / 2, 0.75]); }
  const stands = []; const S = scene;
  for (let k = 0; k < 6; k++) {
    const z = -1.0 - k * 4.6;
    const a = buildKnight(k % 2 ? 'crusader' : 'dark'); a.root.position.set(wallX - 0.55, 0.12, z); a.root.rotation.y = -Math.PI / 2; applyPose(a, { ...kStand(), armL: [-0.1, 0, -0.2], armR: [-0.1, 0, 0.2] }); S.add(a.root); stands.push(a); mesh(tbox(0.9, 0.12, 0.9, 1), wood, S, [wallX - 0.55, 0, z]);
    const rz = z - 2.3; mesh(box(0.15, 0.1, 1.9), wood, S, [wallX - 0.18, 1.55, rz]); mesh(box(0.15, 0.1, 1.9), wood, S, [wallX - 0.18, 0.25, rz]); for (const dz of [-0.9, 0.9]) mesh(box(0.12, 1.65, 0.12, 'bottom'), wood, S, [wallX - 0.18, 0, rz + dz]);
    for (let s = 0; s < 3; s++) { const sw = buildSword({ len: 0.85 }); sw.position.set(wallX - 0.28, 0.33, rz - 0.6 + s * 0.42); sw.rotation.set(-Math.PI / 2, 0, 0); S.add(sw); }
    const ax = buildAxe(); ax.position.set(wallX - 0.32, 0.05, rz + 0.7); ax.rotation.set(0, Math.PI / 2, 0.05); S.add(ax);
    const sh = buildShield(k % 2 ? 'round' : 'kite', { color: [0x8a2a2a, 0x2a3a7a][k % 2] }); sh.position.set(wallX - 0.02, 3.3, z); sh.rotation.y = -Math.PI / 2; S.add(sh);
    for (const r of [0.75, -0.75]) { const sw = buildSword({ len: 0.8 }); sw.position.set(wallX - 0.06, 3.2, rz); sw.rotation.set(r, -Math.PI / 2, 0); S.add(sw); }
  }
  for (let k = 0; k < 9; k++) { const sp = buildSpear(); sp.position.set(-W / 2 + 0.5, 0, -1 - k * 3.2); sp.rotation.z = -0.07; S.add(sp); }
  const torches = []; for (let k = 0; k < 5; k++) { const p = v3(wallX - 0.1, 2.6, -3.3 - k * 4.6); torches.push(p); mesh(box(0.06, 0.45, 0.06), mat({ map: TK('black'), rim: 1 }), S, [p.x, p.y - 0.3, p.z], [0, 0, -0.4]); S.add(fireP({ origin: p, spread: v3(0.07, 0.04, 0.07), size: 0.26, count: 28, vel: v3(0, 1.2, 0), life: 0.5, seed: 3190 + k })); const g = glow(0xff9040, 2.0, 0.5); g.position.copy(p); S.add(g); }
  S.add(particles({ mode: 'drift', count: 400, box: v3(W, H, L), origin: v3(0, H / 2, -L / 2 + 2), vel: v3(0.03, 0.07, 0.02), size: 0.022, c0: 0xd8ccff, seed: 3199, swirl: 0.5, opacity: 0.6, fogMix: 0.3 }));
  return { scene, stands, torches, wallX };
}
export { setFire };
