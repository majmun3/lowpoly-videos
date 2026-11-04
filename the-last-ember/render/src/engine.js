// PS1/PS2-style rendering core: shared uniforms, retro materials, post pass.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
THREE.ColorManagement.enabled = false; // author colours as plain display values (no sRGB->linear)

// internal resolution (upscaled to 1080x1920). A project may set window.LP_RES / LP_BITS / LP_AFFINE before loading (defaults: 360x640, 15-bit, 0.85).
const LP = globalThis.LP_RES || [360, 640];
export const W = LP[0], H = LP[1];
const LP_BITS = (globalThis.LP_BITS || 31).toFixed(1), LP_AFFINE = globalThis.LP_AFFINE ?? 0.85;
export const FPS = 30;

export const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // everything is authored display-referred
renderer.autoClear = true;
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------- RNG / math
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const col = (hex) => new THREE.Color(hex);
export function vlerp(a, b, t) { return new THREE.Vector3().lerpVectors(a, b, t); }
// Catmull-Rom over an array of Vector3 with t in [0,1]
export function path(points, t) { const c = new THREE.CatmullRomCurve3(points, false, 'centripetal'); return c.getPoint(clamp(t)); }

// ---------------------------------------------------------------- shared uniforms
const NPL = 6;
export const G = {
  uTime: { value: 0 },
  uRes: { value: new THREE.Vector2(W, H) },
  uSnap: { value: 1.0 },
  uLightDir: { value: v3(-0.4, -0.8, -0.3).normalize() },
  uLightCol: { value: col(0x9a8a80) },
  uAmbient: { value: col(0x2a2228) },
  uFogCol: { value: col(0x3a2c2c) },
  uRim: { value: col(0x000000) },
  uFillDir: { value: v3(0, -0.3, -1).normalize() },
  uFillCol: { value: col(0x000000) },
  uFog: { value: new THREE.Vector2(10, 160) },          // linear distance fog near/far
  uHFog: { value: new THREE.Vector4(2, 12, 0.0, 0.02) }, // height fog: baseY, falloff, strength, density
  uPL: { value: Array.from({ length: NPL }, () => new THREE.Vector4(0, -9999, 0, 1)) },
  uPC: { value: Array.from({ length: NPL }, () => new THREE.Vector3(0, 0, 0)) },
};
export function resetLights() { for (let i = 0; i < NPL; i++) { G.uPL.value[i].set(0, -9999, 0, 1); G.uPC.value[i].set(0, 0, 0); } }
export function setPL(i, pos, color, range, intensity = 1) {
  G.uPL.value[i].set(pos.x, pos.y, pos.z, range);
  const c = new THREE.Color(color); G.uPC.value[i].set(c.r * intensity, c.g * intensity, c.b * intensity);
}
export function setEnv(e) {
  if (e.lightDir) G.uLightDir.value.copy(e.lightDir).normalize();
  if (e.lightCol !== undefined) G.uLightCol.value.set(e.lightCol);
  if (e.ambient !== undefined) G.uAmbient.value.set(e.ambient);
  if (e.fogCol !== undefined) G.uFogCol.value.set(e.fogCol);
  G.uRim.value.set(e.rim ?? 0x000000);
  G.uFillCol.value.set(e.fillCol ?? 0x000000); if (e.fillDir) G.uFillDir.value.copy(e.fillDir).normalize();
  if (e.fog) G.uFog.value.set(e.fog[0], e.fog[1]);
  if (e.hfog) G.uHFog.value.set(...e.hfog);
}

// ---------------------------------------------------------------- retro material
const VERT = /* glsl */`
uniform vec2 uRes; uniform float uSnap;
uniform vec3 uLightDir; uniform vec3 uLightCol; uniform vec3 uAmbient;
uniform vec4 uPL[${NPL}]; uniform vec3 uPC[${NPL}];
uniform vec2 uFog; uniform vec4 uHFog; uniform float uFogScale; uniform float uUnlit; uniform float uWrap;
uniform vec3 uColor; uniform float uWind; uniform float uTime; uniform vec3 uRim; uniform float uRimK; uniform vec3 uFillDir; uniform vec3 uFillCol;
varying vec3 vAff; varying vec2 vUv; varying vec3 vLight; varying float vFog; varying vec3 vCol; varying vec3 vInst;
void main(){
  vInst = vec3(1.0);
#ifdef USE_INSTANCING_COLOR
  vInst = instanceColor;
#endif
  vec4 lp = vec4(position, 1.0);
  vec3 n = normal;
#ifdef USE_INSTANCING
  lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
#endif
  vec4 wp = modelMatrix * lp;
  if (uWind > 0.0) { float h = max(position.y, 0.0); wp.x += sin(uTime*1.7 + wp.z*0.3) * uWind * h * h; wp.z += cos(uTime*1.3 + wp.x*0.3) * uWind * 0.6 * h * h; }
  vec3 N = normalize(mat3(modelMatrix) * n);
  vec3 L = uAmbient;
  float ndl = dot(N, -uLightDir);
  L += uLightCol * max(mix(ndl, ndl*0.5+0.5, uWrap), 0.0);
  L += uFillCol * max(dot(N, -uFillDir) * 0.7 + 0.3, 0.0);
  for (int i = 0; i < ${NPL}; i++) {
    vec3 d = uPL[i].xyz - wp.xyz; float dist = length(d);
    float att = clamp(1.0 - dist / uPL[i].w, 0.0, 1.0); att *= att;
    float nd = dot(N, d / max(dist, 1e-4));
    L += uPC[i] * att * max(nd * 0.6 + 0.4, 0.0);
  }
  vec3 V = normalize(cameraPosition - wp.xyz);
  L += uRim * uRimK * pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.5);
  vLight = mix(L, vec3(1.0), uUnlit);
  vCol = uColor;
#ifdef USE_COLOR
  vCol *= color;
#endif
  vec4 vp = viewMatrix * wp;
  vec4 cp = projectionMatrix * vp;
  if (uSnap > 0.0 && cp.w > 0.0) {
    vec2 g = uRes * 0.5 * uSnap;
    cp.xy = floor(cp.xy / cp.w * g + 0.5) / g * cp.w;
  }
  gl_Position = cp;
  vAff = vec3(uv * cp.w, cp.w);
  vUv = uv;
  float dist = length(vp.xyz);
  float f = clamp((dist - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  float hf = clamp((uHFog.x - wp.y) / uHFog.y, 0.0, 1.0) * uHFog.z * (1.0 - exp(-dist * uHFog.w));
  vFog = clamp(max(f, hf) * uFogScale, 0.0, 1.0);
}`;
const FRAG = /* glsl */`
uniform sampler2D map; uniform float uHasMap; uniform vec2 uRepeat; uniform float uAffine;
uniform sampler2D emap; uniform float uHasEmap; uniform vec3 uEmissive; uniform vec3 uFogCol;
uniform float uAlphaTest; uniform float uOpacity; uniform float uEmitFogPierce; uniform float uInstEmit;
varying vec3 vAff; varying vec2 vUv; varying vec3 vLight; varying float vFog; varying vec3 vCol; varying vec3 vInst;
void main(){
  vec2 uv = mix(vUv, vAff.xy / vAff.z, uAffine) * uRepeat;
  vec4 t = uHasMap > 0.5 ? texture2D(map, uv) : vec4(1.0);
  if (t.a < uAlphaTest) discard;
  vec3 base = t.rgb * vCol * (uInstEmit > 0.5 ? vec3(1.0) : vInst);
  vec3 c = base * vLight;
  vec3 e = uEmissive * base;
  if (uHasEmap > 0.5) e = texture2D(emap, uv).rgb * uEmissive;
  if (uInstEmit > 0.5) e = (e + base * 1.5) * vInst;
  c += e;
  float pierce = clamp(dot(e, vec3(0.33)) * uEmitFogPierce, 0.0, 0.85);
  c = mix(c, uFogCol, vFog * (1.0 - pierce));
  gl_FragColor = vec4(c, t.a * uOpacity);
}`;

export function mat(o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      ...G,
      map: { value: o.map || null }, uHasMap: { value: o.map ? 1 : 0 },
      emap: { value: o.emap || null }, uHasEmap: { value: o.emap ? 1 : 0 },
      uRepeat: { value: new THREE.Vector2(...(o.repeat || [1, 1])) },
      uAffine: { value: o.affine ?? LP_AFFINE },
      uColor: { value: new THREE.Color(o.color ?? 0xffffff) },
      uEmissive: { value: new THREE.Color(o.emissive ?? 0x000000) },
      uEmitFogPierce: { value: o.pierce ?? 2.0 },
      uFogScale: { value: o.fogScale ?? 1 },
      uUnlit: { value: o.unlit ? 1 : 0 },
      uWrap: { value: o.wrap ?? 0.35 },
      uAlphaTest: { value: o.alphaTest ?? 0.0 },
      uOpacity: { value: o.opacity ?? 1 },
      uWind: { value: o.wind ?? 0 },
      uInstEmit: { value: o.instEmit ? 1 : 0 },
      uRimK: { value: o.rim ?? 0 },
    },
    vertexShader: VERT, fragmentShader: FRAG,
    vertexColors: !!o.vertexColors,
    side: o.side ?? THREE.FrontSide,
    transparent: !!(o.transparent || o.additive),
    depthWrite: o.depthWrite ?? !(o.additive),
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  m.uniforms.uTime = G.uTime;
  return m;
}

// ---------------------------------------------------------------- particles (deterministic, GPU-driven)
const PVERT = /* glsl */`
attribute vec4 seed;
uniform float uTime; uniform float uMode; uniform vec3 uBox; uniform vec3 uOrigin; uniform vec3 uVel;
uniform float uSize; uniform float uLife; uniform float uRate; uniform vec3 uSpread; uniform vec2 uRes; uniform float uStart;
uniform vec2 uFog; uniform vec3 uFogCol; uniform float uSwirl; uniform vec3 uLineB; uniform float uFront;
varying float vLife; varying float vFog; varying float vSeed;
void main(){
  vec3 p;
  if (uMode < 0.5) {               // ambient drift (ash/snow) wrapped in a box around uOrigin
    vec3 q = seed.xyz * uBox + uVel * uTime + vec3(sin(uTime*0.7+seed.w*40.0), 0.0, cos(uTime*0.5+seed.w*31.0)) * uSwirl;
    p = uOrigin + mod(q, uBox) - uBox * 0.5;
    vLife = 0.5;
  } else if (uMode < 1.5) {         // emitter (fire/embers): looping lifetime
    float life = fract(uTime / uLife + seed.w);
    vLife = life;
    vec3 off = (seed.xyz - 0.5) * uSpread;
    p = uOrigin + off * (1.0 + life*0.6) + uVel * life * uLife;
    p.x += sin(uTime*3.0 + seed.w*50.0) * 0.08 * life * uSwirl;
    p.z += cos(uTime*2.6 + seed.w*70.0) * 0.08 * life * uSwirl;
  } else if (uMode > 2.5) {         // line fire along a segment, revealed up to uFront
    float life = fract(uTime / uLife + seed.w);
    vLife = seed.x > uFront ? 2.0 : life;
    vec3 o = mix(uOrigin, uLineB, seed.x);
    p = o + (vec3(seed.y, seed.z, fract(seed.w * 7.0)) - 0.5) * uSpread + uVel * life * uLife;
  } else {                          // burst: starts at uStart, particles fly outward and fall
    float age = uTime - uStart;
    float life = clamp(age / (uLife * (0.6 + seed.w * 0.8)), 0.0, 1.0);
    vLife = age < 0.0 ? 2.0 : life;
    vec3 dir = normalize(seed.xyz - 0.5 + 1e-3);
    float sp = (0.5 + seed.w) ;
    p = uOrigin + dir * uSpread * sp * (1.0 - pow(1.0 - life, 2.0)) + vec3(0.0, -2.0, 0.0) * life * life * uVel.y;
  }
  vSeed = seed.w;
  vec4 vp = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * vp;
  float sz = uSize * (uMode > 0.5 && uMode != 2.0 ? (1.0 - min(vLife,1.0) * 0.7) : 1.0) * (0.6 + seed.w * 0.8);
  gl_PointSize = clamp(sz * uRes.y / max(-vp.z, 0.1), 1.0, 64.0);
  if (vLife > 1.5) gl_PointSize = 0.0;
  vFog = clamp((length(vp.xyz) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
}`;
const PFRAG = /* glsl */`
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform float uOpacity; uniform float uSoft; uniform float uMode; uniform vec3 uFogCol; uniform float uFogMix;
varying float vLife; varying float vFog; varying float vSeed;
void main(){
  vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0;
  if (uSoft > 0.5) { if (r > 1.0) discard; }
  vec3 c = vLife < 0.5 ? mix(uC0, uC1, vLife * 2.0) : mix(uC1, uC2, (vLife - 0.5) * 2.0);
  float a = uOpacity * (uMode > 0.5 ? (1.0 - smoothstep(0.6, 1.0, vLife)) * smoothstep(0.0, 0.08, vLife) : 1.0);
  if (uSoft > 0.5) a *= 1.0 - r * r;
  c = mix(c, uFogCol, vFog * uFogMix);
  gl_FragColor = vec4(c * a, a);
}`;
export function particles(o) {
  const n = o.count || 200, r = rng(o.seed || 7);
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { seed[i * 4] = r(); seed[i * 4 + 1] = r(); seed[i * 4 + 2] = r(); seed[i * 4 + 3] = r(); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 4));
  const c0 = new THREE.Color(o.c0 ?? 0xffffff), c1 = new THREE.Color(o.c1 ?? o.c0 ?? 0xffffff), c2 = new THREE.Color(o.c2 ?? o.c1 ?? o.c0 ?? 0xffffff);
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uMode: { value: { drift: 0, emit: 1, burst: 2, line: 3 }[o.mode || 'drift'] }, uLineB: { value: o.lineB || v3(0, 1, 0) }, uFront: { value: o.front ?? 1 },
      uBox: { value: o.box || v3(40, 30, 40) }, uOrigin: { value: o.origin || v3(0, 0, 0) }, uVel: { value: o.vel || v3(0, -1, 0) },
      uSize: { value: o.size ?? 0.05 }, uLife: { value: o.life ?? 1 }, uSpread: { value: o.spread || v3(0.3, 0.1, 0.3) },
      uRes: G.uRes, uStart: { value: o.start ?? 0 }, uFog: G.uFog, uFogCol: G.uFogCol, uFogMix: { value: o.fogMix ?? 0.8 },
      uSwirl: { value: o.swirl ?? 1 }, uC0: { value: c0 }, uC1: { value: c1 }, uC2: { value: c2 },
      uOpacity: { value: o.opacity ?? 1 }, uSoft: { value: o.soft ? 1 : 0 },
    },
    vertexShader: PVERT, fragmentShader: PFRAG, transparent: true, depthWrite: false,
    blending: o.additive === false ? THREE.CustomBlending : THREE.AdditiveBlending,
  });
  if (o.additive === false) { m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; }
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  p.userData.tOffset = o.tOffset || 0;
  p.onBeforeRender = () => { m.uniforms.uTime.value = G.uTime.value * (o.timeScale ?? 1) + p.userData.tOffset; };
  return p;
}

// ---------------------------------------------------------------- glow sprite
let _glowTex = null;
export function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c); _glowTex.colorSpace = THREE.NoColorSpace; return _glowTex;
}
export function glow(color, size, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
}

// ---------------------------------------------------------------- geometry helpers
export function flat(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; }
// Tapered box: bottom (w0,d0) to top (w1,d1), height h, top offset (ox,oz). anchor: 'bottom'|'top'|'center'
export function taper(w0, d0, w1, d1, h, o = {}) {
  const ox = o.ox || 0, oz = o.oz || 0;
  let y0 = 0, y1 = h;
  if (o.anchor === 'top') { y0 = -h; y1 = 0; } else if (o.anchor === 'center') { y0 = -h / 2; y1 = h / 2; }
  const b = [[-w0 / 2, y0, -d0 / 2], [w0 / 2, y0, -d0 / 2], [w0 / 2, y0, d0 / 2], [-w0 / 2, y0, d0 / 2]];
  const t = [[-w1 / 2 + ox, y1, -d1 / 2 + oz], [w1 / 2 + ox, y1, -d1 / 2 + oz], [w1 / 2 + ox, y1, d1 / 2 + oz], [-w1 / 2 + ox, y1, d1 / 2 + oz]];
  if (o.anchor === 'top') { // bottom gets the offset instead for hanging limbs
    for (const p of b) { p[0] += ox; p[2] += oz; } for (const p of t) { p[0] -= ox; p[2] -= oz; }
  }
  const quads = [[b[3], b[2], t[2], t[3]], [b[1], b[0], t[0], t[1]], [b[2], b[1], t[1], t[2]], [b[0], b[3], t[3], t[0]], [t[3], t[2], t[1], t[0]], [b[0], b[1], b[2], b[3]]];
  return quadsGeo(quads);
}
export function quadsGeo(quads, uvScale = 1) {
  const pos = [], uv = [];
  for (const q of quads) {
    const [a, b, c, d] = q;
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    uv.push(0, 0, uvScale, 0, uvScale, uvScale, 0, 0, uvScale, uvScale, 0, uvScale);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
export function box(w, h, d, anchor) { return taper(w, d, w, d, h, { anchor: anchor || 'center' }); }
export function prism(sides, r0, r1, h, anchor = 'bottom', open = false) {
  const g = new THREE.CylinderGeometry(r1, r0, h, sides, 1, open);
  if (anchor === 'bottom') g.translate(0, h / 2, 0); else if (anchor === 'top') g.translate(0, -h / 2, 0);
  return flat(g);
}
// Loft rings of [x,z] points at given heights into a closed surface (faceted).
export function loft(rings, capTop = true, capBottom = true) {
  const quads = [];
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r], B = rings[r + 1], n = A.pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      quads.push([[A.pts[i][0], A.y, A.pts[i][1]], [A.pts[j][0], A.y, A.pts[j][1]], [B.pts[j][0], B.y, B.pts[j][1]], [B.pts[i][0], B.y, B.pts[i][1]]]);
    }
  }
  const g = quadsGeo(quads);
  const parts = [g];
  const fan = (ring, up) => {
    const n = ring.pts.length, cx = ring.pts.reduce((s, p) => s + p[0], 0) / n, cz = ring.pts.reduce((s, p) => s + p[1], 0) / n;
    const pos = [], uv = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n; const a = ring.pts[i], b = ring.pts[j];
      if (up) pos.push(cx, ring.y, cz, b[0], ring.y, b[1], a[0], ring.y, a[1]); else pos.push(cx, ring.y, cz, a[0], ring.y, a[1], b[0], ring.y, b[1]);
      uv.push(0.5, 0.5, 1, 0, 0, 0);
    }
    const f = new THREE.BufferGeometry(); f.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); f.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); f.computeVertexNormals(); return f;
  };
  if (capTop) parts.push(fan(rings[rings.length - 1], true));
  if (capBottom) parts.push(fan(rings[0], false));
  const m = mergeGeometries(parts);
  return orientOut(m);
}
// Flip any triangle whose normal points toward the centroid (for convex-ish shapes).
export function orientOut(g, center) {
  const p = g.attributes.position, uv = g.attributes.uv;
  if (!center) { center = new THREE.Vector3(); for (let i = 0; i < p.count; i++) center.add(v3(p.getX(i), p.getY(i), p.getZ(i))); center.divideScalar(p.count); }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(m.subVectors(c, a));
    const cen = a.clone().add(b).add(c).divideScalar(3).sub(center);
    if (n.dot(cen) < 0) {
      for (let k = 0; k < 3; k++) { const t = p.getComponent(i + 1, k); p.setComponent(i + 1, k, p.getComponent(i + 2, k)); p.setComponent(i + 2, k, t); }
      if (uv) for (let k = 0; k < 2; k++) { const t = uv.getComponent(i + 1, k); uv.setComponent(i + 1, k, uv.getComponent(i + 2, k)); uv.setComponent(i + 2, k, t); }
    }
  }
  g.computeVertexNormals();
  return g;
}
export function merge(geos) { return mergeGeometries(geos.map(g => { const n = g.index ? g.toNonIndexed() : g; if (!n.attributes.uv) { n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); } for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) n.deleteAttribute(k); return n; })); }
export function xf(g, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const m = new THREE.Matrix4().compose(v3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), v3(...(Array.isArray(s) ? s : [s, s, s])));
  g = g.clone(); g.applyMatrix4(m); return g;
}
export function mesh(g, m, parent, p, r, s) {
  const o = new THREE.Mesh(g, m);
  if (p) o.position.set(...p); if (r) o.rotation.set(...r); if (s !== undefined) { if (Array.isArray(s)) o.scale.set(...s); else o.scale.setScalar(s); }
  if (parent) parent.add(o);
  return o;
}
export function group(parent, p, r) { const o = new THREE.Group(); if (p) o.position.set(...p); if (r) o.rotation.set(...r); if (parent) parent.add(o); return o; }

// ---------------------------------------------------------------- post-processing
const mkRT = () => new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.NearestFilter, generateMipmaps: true, depthBuffer: true, type: THREE.UnsignedByteType });
export const rtA = mkRT(), rtB = mkRT();
export const post = {
  uniforms: {
    tA: { value: rtA.texture }, tB: { value: rtB.texture }, uMix: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 },
    uSat: { value: 0.75 }, uGain: { value: v3(1, 1, 1) }, uLift: { value: v3(0, 0, 0) }, uBloom: { value: 0.6 }, uBloomT: { value: 0.5 },
    uVign: { value: 0.55 }, uContrast: { value: 1.1 }, uRes: G.uRes, uFlashCol: { value: col(0xfff2dc) }, uTime: G.uTime,
    uSatB: { value: 0.75 }, uGainB: { value: v3(1, 1, 1) }, uLiftB: { value: v3(0, 0, 0) }, uContrastB: { value: 1.1 }, uBloomB: { value: 0.6 },
  },
};
const postMat = new THREE.ShaderMaterial({
  uniforms: post.uniforms,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */`
uniform sampler2D tA; uniform sampler2D tB; uniform float uMix; uniform float uFade; uniform float uFlash; uniform vec3 uFlashCol;
uniform float uSat; uniform vec3 uGain; uniform vec3 uLift; uniform float uBloom; uniform float uBloomT; uniform float uVign; uniform float uContrast;
uniform float uSatB; uniform vec3 uGainB; uniform vec3 uLiftB; uniform float uContrastB; uniform float uBloomB;
uniform vec2 uRes; uniform float uTime;
varying vec2 vUv;
float bayer4(ivec2 p){ int x = p.x & 3, y = p.y & 3; int m[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return float(m[y*4+x]) / 16.0; }
vec3 grade(vec3 c, float sat, vec3 gain, vec3 lift, float con){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, sat);
  c = (c - 0.5) * con + 0.5;
  c = c * gain + lift * (1.0 - c);
  return c;
}
vec3 shade(sampler2D t, float sat, vec3 gain, vec3 lift, float con, float bloomAmt){
  ivec2 px = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(t, px, 0).rgb;
  vec3 b1 = textureLod(t, vUv, 2.5).rgb, b2 = textureLod(t, vUv, 4.0).rgb, b3 = textureLod(t, vUv, 5.5).rgb;
  vec3 bl = max(b1 - uBloomT, 0.0) * 0.6 + max(b2 - uBloomT * 0.8, 0.0) * 0.8 + max(b3 - uBloomT * 0.6, 0.0) * 1.0;
  c += bl * bloomAmt;
  return grade(c, sat, gain, lift, con);
}
void main(){
  vec3 c = shade(tA, uSat, uGain, uLift, uContrast, uBloom);
  if (uMix > 0.001) c = mix(c, shade(tB, uSatB, uGainB, uLiftB, uContrastB, uBloomB), uMix);
  vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y * 1.3;
  c *= 1.0 - uVign * smoothstep(0.15, 0.75, length(q));
  c = mix(c, uFlashCol, uFlash);
  c *= 1.0 - uFade;
  ivec2 px = ivec2(gl_FragCoord.xy);
  c += (bayer4(px) - 0.5) / ${LP_BITS};
  c = floor(clamp(c, 0.0, 1.0) * ${LP_BITS} + 0.5) / ${LP_BITS};  // 15-bit colour (default)
  gl_FragColor = vec4(c, 1.0);
}`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

export function renderScene(scene, camera, rt) {
  renderer.setRenderTarget(rt);
  renderer.setClearColor(G.uFogCol.value, 1);
  renderer.clear();
  renderer.render(scene, camera);
}
export function renderPost() { renderer.setRenderTarget(null); renderer.render(postScene, postCam); }
export function setGrade(g = {}, B = false) {
  const u = post.uniforms, s = B ? 'B' : '';
  u['uSat' + s].value = g.sat ?? 0.75;
  u['uGain' + s].value.set(...(g.gain || [1, 1, 1]));
  u['uLift' + s].value.set(...(g.lift || [0, 0, 0]));
  u['uContrast' + s].value = g.contrast ?? 1.1;
  u['uBloom' + s].value = g.bloom ?? 0.6;
}

export function readPixels() {
  const gl = renderer.getContext();
  const buf = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return buf;
}
export function toB64(buf) {
  let s = ''; const CH = 0x8000;
  for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
  return btoa(s);
}
export { THREE };
