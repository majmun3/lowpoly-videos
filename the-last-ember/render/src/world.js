// Environments of Vhaldren: sky, the chained Ember Heart, the Ashen Cathedral, the bridge of Odran,
// ruins, ash forest, the abandoned village, the Keeper's Seat and its carved wall.
import { THREE, G, mat, taper, box, prism, mesh, group, glow, merge, xf, flat, v3, rng, clamp, lerp, quadsGeo } from './engine.js';
import { T } from './textures.js';

// ---------------------------------------------------------------- sky dome
export function sky(o = {}) {
  const u = {
    uTop: { value: new THREE.Color(o.top ?? 0x120a0c) }, uHorizon: { value: new THREE.Color(o.horizon ?? 0x4a2a26) }, uBottom: { value: new THREE.Color(o.bottom ?? 0x2a1c1c) },
    uSunDir: { value: (o.sunDir || v3(0, 0.5, -1)).clone().normalize() }, uSunCol: { value: new THREE.Color(o.sunCol ?? 0x8a2a10) },
    uClouds: { value: T('clouds') }, uCloudCol: { value: new THREE.Color(o.cloud ?? 0x2a1a1c) }, uCloudLit: { value: new THREE.Color(o.cloudLit ?? 0x9a3a1c) },
    uCover: { value: o.cover ?? 0.42 }, uCloudScale: { value: o.cloudScale ?? 0.35 }, uTime: G.uTime, uFogCol: G.uFogCol, uHorizonFog: { value: o.horizonFog ?? 0.85 },
    uScroll: { value: o.scroll ?? 1 }, uSwirl: { value: o.swirl ?? 0 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
uniform vec3 uTop, uHorizon, uBottom, uSunDir, uSunCol, uCloudCol, uCloudLit, uFogCol; uniform sampler2D uClouds;
uniform float uCover, uCloudScale, uTime, uHorizonFog, uScroll, uSwirl; varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHorizon, uBottom, clamp(-h * 4.0, 0.0, 1.0));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  c += uSunCol * (pow(sd, 6.0) * 0.55 + pow(sd, 40.0) * 0.5);
  if (h > -0.08) {
    vec2 uv = d.xz / (h + 0.16) * uCloudScale;
    float ang = uSwirl * uTime * 0.01; mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    uv = R * uv + uTime * vec2(0.006, 0.0025) * uScroll;
    float n = texture2D(uClouds, uv).r * 0.62 + texture2D(uClouds, uv * 2.7 + 0.37).r * 0.38;
    float cl = smoothstep(uCover, uCover + 0.22, n);
    vec3 cc = mix(uCloudCol, uCloudLit, clamp(pow(sd, 2.5) * 1.3 + (n - 0.5) * 0.4, 0.0, 1.0));
    c = mix(c, cc * (0.75 + n * 0.45), cl * smoothstep(-0.06, 0.12, h) * 0.92);
  }
  c = mix(c, uFogCol, (1.0 - smoothstep(0.0, 0.22, abs(h + 0.02))) * uHorizonFog);
  gl_FragColor = vec4(c, 1.0);
}`,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(4000, 24, 12), m);
  s.renderOrder = -10; s.frustumCulled = false;
  s.onBeforeRender = (r, sc, cam) => { s.position.copy(cam.position); };
  s.userData.u = u;
  return s;
}

// ---------------------------------------------------------------- the Ember Heart (chained celestial fire)
export function emberHeart(radius, o = {}) {
  const g = new THREE.Group();
  const m = mat({ map: T('sun'), emap: T('sunE'), unlit: true, color: 0x000000, emissive: 0xffffff, fogScale: o.fogScale ?? 0.12, affine: 0.3, repeat: [2, 1] });
  const core = mesh(flat(new THREE.IcosahedronGeometry(radius, 1)), m, g);
  const h1 = glow(o.glow ?? 0xb0381a, radius * 4.5, 0.35), h2 = glow(o.glow2 ?? 0xff7a2a, radius * 2.4, 0.5);
  g.add(h1, h2);
  g.userData = { core, m, h1, h2, radius };
  return g;
}
export function setHeart(h, k, t) { // k: 0 = dying, 1 = reborn
  const d = h.userData, flick = 0.9 + Math.sin(t * 7.1) * 0.04 + Math.sin(t * 13.7) * 0.03;
  d.m.uniforms.uEmissive.value.setRGB(0.85 + k * 0.35, 0.55 + k * 0.55, 0.45 + k * 0.35).multiplyScalar(flick);
  d.m.uniforms.uColor.value.setRGB(k * 2.2, k * 1.6, k * 0.8); // crust melts to light
  d.h1.material.color.set(0x8a2a18).lerp(new THREE.Color(0xe08a40), k); d.h1.material.opacity = 0.32 + k * 0.25;
  d.h2.material.color.set(0xff6a2a).lerp(new THREE.Color(0xffd890), k); d.h2.material.opacity = (0.45 + k * 0.3) * flick;
  const s = d.radius * (4.5 + k * 1.5); d.h1.scale.set(s, s, 1); const s2 = d.radius * (2.4 + k * 0.6); d.h2.scale.set(s2, s2, 1);
  d.core.rotation.y = t * 0.03; d.core.rotation.x = t * 0.017;
}

// ---------------------------------------------------------------- chains
let _linkGeo = null;
function linkGeo() { if (!_linkGeo) { _linkGeo = flat(new THREE.TorusGeometry(1, 0.32, 3, 6)); _linkGeo.scale(0.62, 1, 1); } return _linkGeo; }
// chain from a to b with sag; link = link length. Returns InstancedMesh with userData.params for burning.
export function chain(a, b, link, o = {}) {
  const dist = a.distanceTo(b), n = Math.max(2, Math.floor(dist / (link * 0.78)));
  const m = mat({ map: T('chain'), fogScale: o.fogScale ?? 0.5, instEmit: true, emissive: 0x000000 });
  const im = new THREE.InstancedMesh(linkGeo(), m, n);
  const sag = o.sag ?? 0.06, up = v3(0, 1, 0), M = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const pts = [];
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    const p = new THREE.Vector3().lerpVectors(a, b, f); p.y -= Math.sin(f * Math.PI) * dist * sag;
    const f2 = Math.min(1, f + 0.01), p2 = new THREE.Vector3().lerpVectors(a, b, f2); p2.y -= Math.sin(f2 * Math.PI) * dist * sag;
    const dir = p2.sub(p).normalize();
    q.setFromUnitVectors(up, dir); q2.setFromAxisAngle(up, i % 2 ? Math.PI / 2 : 0); q.multiply(q2);
    const s = link * 0.5; M.compose(p, q, v3(s, s, s)); im.setMatrixAt(i, M); pts.push(p.clone());
    im.setColorAt(i, new THREE.Color(o.base ?? 0x000000));
  }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  im.frustumCulled = false;
  im.userData = { n, pts, a: a.clone(), b: b.clone() };
  return im;
}
// burn front 0..1 along chain: links behind the front glow molten
export function burnChain(im, front, t, intensity = 1) {
  const n = im.userData.n, c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const f = i / n, k = clamp((front - f) * 8);
    const fl = 0.8 + 0.2 * Math.sin(t * 9 + i * 1.7);
    c.setRGB(1.6 * k * fl * intensity, 0.7 * k * fl * intensity, 0.18 * k * intensity);
    if (front - f > 0 && front - f < 0.04) c.setRGB(2.5 * intensity, 1.8 * intensity, 0.9 * intensity);
    im.setColorAt(i, c);
  }
  im.instanceColor.needsUpdate = true;
}

// ---------------------------------------------------------------- terrain
export function terrain(size, seg, hfn, o = {}) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hfn(p.getX(i), p.getZ(i)));
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size / 8, uv.getY(i) * size / 8);
  const f = flat(g);
  return mesh(f, mat({ map: o.map || T('ash'), color: o.color ?? 0xffffff, affine: 0.6 }));
}
export function hnoise(seed) {
  const r = rng(seed), P = Array.from({ length: 8 }, () => [r() * 6.28, r() * 0.05 + 0.01, r() * 6.28, r() * 0.05 + 0.01, r()]);
  return (x, z) => P.reduce((s, [a, fa, b, fb, w]) => s + Math.sin(x * fa + a) * Math.cos(z * fb + b) * w, 0);
}

// ---------------------------------------------------------------- ruins
export function ruinTower(r, h, seed, M) {
  const R = rng(seed), sides = 6 + Math.floor(R() * 3) * 2;
  const g = new THREE.CylinderGeometry(r * 0.92, r, h, sides, 4, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > h / 2 - 0.01) p.setY(i, y - R() * h * 0.35); }
  g.translate(0, h / 2, 0);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r * 1.5, uv.getY(i) * h / 4);
  const parts = [flat(g)];
  // inner wall (double sided feel)
  const gi = g.clone(); gi.scale(0.85, 1, 0.85); const idx = gi.toNonIndexed(); const pp = idx.attributes.position;
  for (let i = 0; i < pp.count; i += 3) { for (let k = 0; k < 3; k++) { const t = pp.getComponent(i + 1, k); pp.setComponent(i + 1, k, pp.getComponent(i + 2, k)); pp.setComponent(i + 2, k, t); } }
  idx.computeVertexNormals(); parts.push(idx);
  // windows: dark slits (boxes)
  return merge(parts);
}
export function archGeo(span, thick, depth, sides = 7, pointed = true) {
  // pointed gothic arch ring made of quads
  const quads = [], r0 = span / 2, r1 = r0 + thick;
  const pt = (a, r) => { // pointed arch: two arcs centred off-axis
    if (!pointed) return [Math.cos(a) * r, Math.sin(a) * r];
    const off = r0 * 0.3, side = a < Math.PI / 2 ? 1 : -1; const rr = r + off;
    const ang = Math.PI / 2 - (Math.PI / 2 - Math.abs(a - Math.PI / 2)) * 1.0;
    const aa = a < Math.PI / 2 ? a : Math.PI - a;
    const x = Math.cos(aa) * rr - off, y = Math.sin(aa) * rr * 1.0;
    return [side * Math.max(x, 0.0), y];
  };
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI, a1 = ((i + 1) / sides) * Math.PI;
    const [x00, y00] = pt(a0, r0), [x01, y01] = pt(a1, r0), [x10, y10] = pt(a0, r1), [x11, y11] = pt(a1, r1);
    const zf = depth / 2, zb = -depth / 2;
    quads.push([[x10, y10, zf], [x00, y00, zf], [x01, y01, zf], [x11, y11, zf]]);
    quads.push([[x00, y00, zb], [x10, y10, zb], [x11, y11, zb], [x01, y01, zb]]);
    quads.push([[x00, y00, zf], [x00, y00, zb], [x01, y01, zb], [x01, y01, zf]]);
    quads.push([[x10, y10, zb], [x10, y10, zf], [x11, y11, zf], [x11, y11, zb]]);
  }
  return quadsGeo(quads, 2);
}
export function ruinsField(o) {
  const R = rng(o.seed || 1), M = o.mat || mat({ map: T('stone'), color: o.color ?? 0xb8b0aa, repeat: [1, 1] });
  const geos = [];
  for (let i = 0; i < o.count; i++) {
    const a = R() * Math.PI * 2, d = o.rMin + R() * (o.rMax - o.rMin);
    const x = o.center[0] + Math.cos(a) * d, z = o.center[2] + Math.sin(a) * d;
    if (o.avoid && o.avoid(x, z)) continue;
    const y = o.ground ? o.ground(x, z) : 0;
    const kind = R();
    if (kind < 0.45) { const r = 2 + R() * 4, h = 8 + R() * 30 * (o.hScale ?? 1); geos.push(xf(ruinTower(r, h, i * 7 + 3), { p: [x, y - 1, z], r: [0, R() * 3, 0] })); }
    else if (kind < 0.75) { const w = 6 + R() * 14, h = 4 + R() * 14 * (o.hScale ?? 1); const g = box(w, h, 1.6 + R(), 'bottom'); const p = g.attributes.position; for (let k = 0; k < p.count; k++) if (p.getY(k) > h - 0.01) p.setY(k, h - R() * h * 0.5); g.computeVertexNormals(); geos.push(xf(g, { p: [x, y - 0.5, z], r: [0, R() * 3, 0] })); }
    else { const span = 5 + R() * 8, th = 1.4 + R(); const g = merge([archGeo(span, th, 2.2), xf(box(th, span * 0.6, 2.2, 'bottom'), { p: [span / 2 + th / 2, -span * 0.6, 0] }), xf(box(th, span * 0.6, 2.2, 'bottom'), { p: [-span / 2 - th / 2, -span * 0.6, 0] })]); geos.push(xf(g, { p: [x, y + span * 0.6 - 0.5, z], r: [0, R() * 3, 0] })); }
  }
  return mesh(merge(geos), M);
}

// ---------------------------------------------------------------- the Ashen Cathedral (original gothic design)
export function cathedral(o = {}) {
  const g = new THREE.Group();
  const S = mat({ map: T('darkstone'), color: o.color ?? 0xa8a0a0, fogScale: o.fogScale ?? 1 });
  const roofM = mat({ map: T('roof'), color: 0x8a7a78, fogScale: o.fogScale ?? 1 });
  const win = mat({ map: T('window'), unlit: true, color: 0xffffff, emissive: 0x401004, fogScale: (o.fogScale ?? 1) * 0.6, pierce: 3 });
  const rose = mat({ map: T('rose'), unlit: true, color: 0xffffff, emissive: 0x401004, fogScale: (o.fogScale ?? 1) * 0.6, pierce: 3 });
  const stone = [], roofs = [], wins = [];
  const L = 120, Wd = 34, Hh = 42;
  // nave
  stone.push(xf(box(Wd, Hh, L, 'bottom'), { p: [0, 0, -L / 2] }));
  roofs.push(xf(roofPrism(Wd + 2, 22, L), { p: [0, Hh, -L / 2] }));
  // side aisles (lower)
  for (const sx of [-1, 1]) {
    stone.push(xf(box(12, 24, L - 20, 'bottom'), { p: [sx * (Wd / 2 + 6), 0, -L / 2 - 4] }));
    // buttresses with pinnacles
    for (let k = 0; k < 7; k++) {
      const z = -14 - k * 14;
      stone.push(xf(taper(3, 5, 2, 4, 36, {}), { p: [sx * (Wd / 2 + 14), 0, z] }));
      stone.push(xf(prism(4, 1.4, 0, 9), { p: [sx * (Wd / 2 + 14), 36, z], r: [0, Math.PI / 4, 0] }));
      stone.push(xf(box(13, 1.6, 1.6), { p: [sx * (Wd / 2 + 7.5), 33, z], r: [0, 0, sx * 0.45] })); // flying buttress
      wins.push(xf(box(0.4, 12, 4.5, 'bottom'), { p: [sx * (Wd / 2 + 0.3), 24, z + 7] }));
    }
  }
  // twin front towers with tall spires
  for (const sx of [-1, 1]) {
    stone.push(xf(box(16, 78, 16, 'bottom'), { p: [sx * 22, 0, -6] }));
    stone.push(xf(box(13, 12, 13, 'bottom'), { p: [sx * 22, 78, -6] }));
    stone.push(xf(prism(8, 7.5, 0.2, 52), { p: [sx * 22, 90, -6], r: [0, Math.PI / 8, 0] }));
    for (const [cx, cz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) stone.push(xf(prism(4, 1.2, 0, 14), { p: [sx * 22 + cx, 90, -6 + cz] }));
    for (let k = 0; k < 3; k++) wins.push(xf(box(4, 12, 0.4, 'bottom'), { p: [sx * 22, 30 + k * 16, 2.3] }));
  }
  // facade gable + rose window + great doors
  stone.push(xf(roofPrism(Wd, 26, 3), { p: [0, Hh, 1] }));
  wins.push(xf(new THREE.CircleGeometry(9, 12), { p: [0, 46, 2.6] }));
  // crossing tower + needle spire to the summit
  stone.push(xf(box(22, 40, 22, 'bottom'), { p: [0, Hh, -72] }));
  stone.push(xf(prism(8, 12, 9, 30), { p: [0, Hh + 40, -72], r: [0, Math.PI / 8, 0] }));
  stone.push(xf(prism(8, 9, 0.6, 150), { p: [0, Hh + 70, -72], r: [0, Math.PI / 8, 0] }));
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; stone.push(xf(prism(4, 1.5, 0, 22), { p: [Math.cos(a) * 11, Hh + 70, -72 + Math.sin(a) * 11] })); }
  // summit crown where the chains meet
  stone.push(xf(prism(8, 3.5, 5, 6), { p: [0, Hh + 214, -72] }));
  // apse
  stone.push(xf(prism(8, 18, 16, Hh), { p: [0, 0, -L], r: [0, Math.PI / 8, 0] }));
  roofs.push(xf(prism(8, 18, 0, 20), { p: [0, Hh, -L], r: [0, Math.PI / 8, 0] }));
  // steps
  for (let k = 0; k < 10; k++) stone.push(xf(box(34 + k * 3, 0.6, 2.2, 'bottom'), { p: [0, -k * 0.6 - 0.6, 3 + k * 2.2] }));
  mesh(merge(stone), S, g); mesh(merge(roofs), roofM, g);
  const winMesh = mesh(merge(wins.slice(0, wins.length)), win, g);
  const roseM = mesh(new THREE.CircleGeometry(9, 12), rose, g, [0, 46, 2.7]);
  // great doors (glowing interior)
  const door = mesh(archDoorGeo(12, 18), mat({ color: o.doorGlow ?? 0x6a1c08, emissive: 0x100400, unlit: true, fogScale: (o.fogScale ?? 1) * 0.7, pierce: 3 }), g, [0, 0, 2.4]);
  g.userData = { summit: v3(0, Hh + 220, -72), door, win, rose, S };
  return g;
}
function roofPrism(w, h, len) {
  const q = [];
  const a = [-w / 2, 0, len / 2], b = [w / 2, 0, len / 2], c = [0, h, len / 2], a2 = [-w / 2, 0, -len / 2], b2 = [w / 2, 0, -len / 2], c2 = [0, h, -len / 2];
  q.push([b, b2, c2, c]); q.push([a2, a, c, c2]);
  q.push([a, b, c, c]); q.push([b2, a2, c2, c2]);
  return quadsGeo(q, 4);
}
function archDoorGeo(w, h) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h * 0.6); s.quadraticCurveTo(w / 2, h * 0.9, 0, h); s.quadraticCurveTo(-w / 2, h * 0.9, -w / 2, h * 0.6); s.lineTo(-w / 2, 0);
  return new THREE.ShapeGeometry(s, 3);
}

// ---------------------------------------------------------------- bridge of Odran
export function bridge(o = {}) {
  const g = new THREE.Group();
  const S = mat({ map: T('stone'), color: 0xb4aca6, repeat: [1, 1] });
  const len = o.len ?? 260, w = o.w ?? 9, z0 = o.z0 ?? 130;
  const deck = [], parts = [];
  // deck in tiles for good affine behaviour
  for (let z = -len / 2; z < len / 2; z += 6) deck.push(xf(box(w, 1.2, 6, 'top'), { p: [0, 0, z + 3] }));
  for (const sx of [-1, 1]) {
    for (let z = -len / 2; z < len / 2; z += 3) { const tall = (Math.floor(z / 3) % 3 === 0); parts.push(xf(box(0.7, tall ? 1.6 : 1.1, 3, 'bottom'), { p: [sx * (w / 2 - 0.35), 0, z + 1.5] })); }
    parts.push(xf(box(0.9, 1.0, len, 'top'), { p: [sx * (w / 2 + 0.2), -1.0, 0] })); // cornice
  }
  const deckMesh = mesh(merge(deck), mat({ map: T('stone'), color: 0xa49c96, repeat: [1, 1] }), g);
  mesh(merge(parts), S, g);
  // piers + arches into the abyss
  const pier = [];
  for (let z = -len / 2; z <= len / 2; z += 30) {
    pier.push(xf(taper(w + 6, 10, w + 1, 7, 170, {}), { p: [0, -172, z] }));
    pier.push(xf(box(w + 7, 3, 11, 'bottom'), { p: [0, -40, z] }));
    if (z < len / 2) pier.push(xf(archGeo(20, 3, w + 0.5, 8), { p: [0, -17.4, z + 15], r: [0, Math.PI / 2, 0] }));
    if (z < len / 2) pier.push(xf(archGeo(20, 2.5, w, 8), { p: [0, -60, z + 15], r: [0, Math.PI / 2, 0] }));
  }
  mesh(merge(pier), S, g);
  // spandrel walls above arches
  const sp = [];
  for (let z = -len / 2; z < len / 2; z += 30) sp.push(xf(box(w, 6, 30, 'top'), { p: [0, -1.2, z + 15] }));
  mesh(merge(sp), S, g);
  g.userData = { deckMesh, S };
  return g;
}

// ---------------------------------------------------------------- dead trees (ash forest)
export function deadTrees(o) {
  const R = rng(o.seed || 5), geos = [];
  for (let i = 0; i < o.count; i++) {
    const x = o.area[0] + R() * (o.area[1] - o.area[0]), z = o.area[2] + R() * (o.area[3] - o.area[2]);
    if (o.avoid && o.avoid(x, z)) continue;
    const y = o.ground ? o.ground(x, z) : 0, h = 7 + R() * 9, r = 0.25 + R() * 0.35;
    const parts = [prism(5, r, r * 0.35, h)];
    const nb = 3 + Math.floor(R() * 4);
    for (let b = 0; b < nb; b++) {
      const by = h * (0.45 + R() * 0.45), bl = 1.5 + R() * 3.5, a = R() * Math.PI * 2, tilt = 0.5 + R() * 0.7;
      parts.push(xf(prism(4, r * 0.4, 0.02, bl), { p: [0, by, 0], r: [Math.sin(a) * tilt, 0, Math.cos(a) * tilt] }));
      if (R() < 0.6) parts.push(xf(prism(3, r * 0.2, 0.01, bl * 0.6), { p: [Math.cos(a) * tilt * bl * -0.5, by + bl * 0.6, Math.sin(a) * tilt * bl * 0.5], r: [Math.sin(a + 1) * 0.9, 0, Math.cos(a + 1) * 0.9] }));
    }
    geos.push(xf(merge(parts), { p: [x, y - 0.3, z], r: [(R() - 0.5) * 0.15, R() * 6, (R() - 0.5) * 0.15] }));
  }
  return mesh(merge(geos), mat({ map: T('bark'), color: o.color ?? 0x9a9290, repeat: [1, 2] }));
}

// ---------------------------------------------------------------- village houses
export function house(seed, M) {
  const R = rng(seed), w = 5 + R() * 3, d = 5 + R() * 3, h = 3.5 + R() * 2.5;
  const walls = [box(w, h, d, 'bottom')];
  const roofs = [];
  const broken = R() < 0.5;
  const rg = roofPrism(w + 1.2, 3 + R() * 2, d + 1.2); const rp = rg.attributes.position;
  if (broken) for (let k = 0; k < rp.count; k++) if (rp.getZ(k) < 0 && rp.getY(k) > 1) rp.setY(k, rp.getY(k) - 2.2);
  rg.computeVertexNormals();
  roofs.push(xf(rg, { p: [0, h, 0] }));
  // timber beams
  const beams = [xf(box(w + 0.2, 0.3, d + 0.2, 'bottom'), { p: [0, h - 0.3, 0] }), xf(box(0.3, h, 0.3, 'bottom'), { p: [w / 2, 0, d / 2] }), xf(box(0.3, h, 0.3, 'bottom'), { p: [-w / 2, 0, d / 2] })];
  return { walls: merge(walls), roof: merge(roofs), beams: merge(beams), w, d, h };
}

// ---------------------------------------------------------------- the Keeper's Seat (summit throne)
export function keeperSeat(o = {}) {
  const g = new THREE.Group();
  const S = mat({ map: T('darkstone'), color: 0x9a9090, repeat: [1, 1] });
  const B = mat({ map: T('brass'), color: 0x9a8060 });
  const parts = [];
  parts.push(box(4.6, 1.4, 3.6, 'bottom'));                         // dais
  parts.push(xf(box(3.0, 0.9, 2.4, 'bottom'), { p: [0, 1.4, 0.2] })); // seat
  parts.push(xf(taper(3.2, 0.8, 2.2, 0.6, 5.2, {}), { p: [0, 1.4, -1.1] })); // high back
  parts.push(xf(prism(4, 1.2, 0, 2.6), { p: [0, 6.6, -1.1], r: [0, Math.PI / 4, 0], s: [1, 1, 0.5] }));
  for (const sx of [-1, 1]) {
    parts.push(xf(box(0.6, 1.5, 2.4, 'bottom'), { p: [sx * 1.6, 1.4, 0.2] }));     // arms
    parts.push(xf(prism(4, 0.5, 0.05, 3.5), { p: [sx * 1.7, 5.0, -1.1] }));        // finials
  }
  for (let k = 0; k < 4; k++) parts.push(xf(box(6.4 - k * 0.6, 0.45, 1.4, 'bottom'), { p: [0, -0.45 * (k + 1) + 0.0, 2.4 + k * 1.2 - 0.4] })); // steps
  mesh(merge(parts), S, g);
  // chain anchor rings on the four corners
  const anchors = [];
  for (const [x, z] of [[-2.4, -1.8], [2.4, -1.8], [-2.4, 1.6], [2.4, 1.6]]) {
    mesh(flat(new THREE.TorusGeometry(0.45, 0.12, 3, 6)), B, g, [x, 1.5, z], [0, 0, Math.PI / 2]);
    mesh(box(0.7, 0.4, 0.7, 'bottom'), S, g, [x, 1.0, z]);
    anchors.push(v3(x, 1.6, z));
  }
  g.userData = { anchors, S };
  return g;
}
// circular summit platform with broken parapet and carved wall segments
export function summitPlatform(o = {}) {
  const g = new THREE.Group();
  const S = mat({ map: T('stone'), color: 0x9e9690 });
  const parts = [xf(prism(10, o.r ?? 13, (o.r ?? 13) - 1, 2.4, 'top'), {})];
  const R = rng(77);
  for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; if (R() < 0.25) continue; const r = (o.r ?? 13) - 0.6; parts.push(xf(box(3.6, 0.8 + R() * 1.0, 0.8, 'bottom'), { p: [Math.cos(a) * r, 0, Math.sin(a) * r], r: [0, -a + Math.PI / 2, 0] })); }
  mesh(merge(parts), S, g);
  return g;
}
export function muralWall(w = 16, h = 8) {
  const g = new THREE.Group();
  const frame = mat({ map: T('darkstone'), color: 0x8a8282 });
  const m = mat({ map: T('mural'), color: 0xd0c8c0, affine: 0.4 });
  const pg = new THREE.PlaneGeometry(w, h, 8, 4);
  mesh(pg, m, g, [0, h / 2, 0.01]);
  mesh(merge([xf(box(w + 1.6, 1.0, 1.2, 'bottom'), { p: [0, -1, -0.4] }), xf(box(w + 1.6, 1.0, 1.2, 'bottom'), { p: [0, h, -0.4] }), xf(box(0.8, h, 1.2, 'bottom'), { p: [-w / 2 - 0.4, 0, -0.4] }), xf(box(0.8, h, 1.2, 'bottom'), { p: [w / 2 + 0.4, 0, -0.4] }), xf(box(w + 1.6, h + 2, 0.6, 'bottom'), { p: [0, -1, -0.7] })]), frame, g);
  return g;
}
export function statue(M, pose) { return null; }
