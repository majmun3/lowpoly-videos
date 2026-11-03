// Timeline driver: renders any global time t of the film into the canvas.
import { THREE, G, W, H, renderScene, renderPost, rtA, rtB, post, setGrade, resetLights, setEnv, readPixels, toB64, smooth, clamp } from './engine.js';

let SHOTS = [], FX = () => ({}), cache = new Map();
function get(shot) { if (!cache.has(shot.id)) cache.set(shot.id, shot.build()); return cache.get(shot.id); }
function drawShot(shot, t, rt) {
  const s = get(shot); const lt = t - shot.start;
  resetLights(); setEnv(s.env || {}); G.uTime.value = lt;
  s.update(lt, t);
  s.camera.aspect = W / H; s.camera.updateProjectionMatrix();
  renderScene(s.scene, s.camera, rt);
  return s;
}
function renderAt(t) {
  let i = SHOTS.findIndex(s => t >= s.start && t < s.end); if (i < 0) i = SHOTS.length - 1;
  const cur = SHOTS[i], nxt = SHOTS[i + 1], prv = SHOTS[i - 1];
  let A = cur, B = null, mix = 0;
  // dissolves are centred on the cut, defined on the incoming shot
  if (nxt && nxt.dissolve && t > nxt.start - nxt.dissolve / 2) { A = cur; B = nxt; mix = smooth((t - (nxt.start - nxt.dissolve / 2)) / nxt.dissolve); }
  else if (cur.dissolve && prv && t < cur.start + cur.dissolve / 2) { A = prv; B = cur; mix = smooth((t - (cur.start - cur.dissolve / 2)) / cur.dissolve); }
  const sa = drawShot(A, t, rtA); setGrade(sa.grade || {}, false);
  if (B) { const sb = drawShot(B, t, rtB); setGrade(sb.grade || {}, true); }
  post.uniforms.uMix.value = B ? mix : 0;
  const fx = FX(t) || {};
  post.uniforms.uFade.value = fx.fade ?? 0; post.uniforms.uFlash.value = fx.flash ?? 0;
  if (fx.flashCol) post.uniforms.uFlashCol.value.set(fx.flashCol); else post.uniforms.uFlashCol.value.set(0xfff2dc);
  post.uniforms.uVign.value = fx.vign ?? 0.55;
  const g = (B && mix > 0.5 ? get(B) : get(A)).grade || {}; post.uniforms.uBloomT.value = g.bloomT ?? 0.5;
  renderPost();
}
window.load = async (name) => {
  const m = await import(name.startsWith('/') ? name : './' + name + '.js');
  SHOTS = m.SHOTS; FX = m.FX || FX; cache = new Map();
  return { duration: m.DURATION ?? SHOTS[SHOTS.length - 1].end, shots: SHOTS.map(s => [s.id, s.start, s.end]) };
};
window.frameRaw = (t) => { renderAt(t); return toB64(readPixels()); };
window.framePNG = (t) => { renderAt(t); return renderer_canvas().toDataURL('image/png'); };
function renderer_canvas() { return document.querySelector('canvas'); }

window.ready = true;
