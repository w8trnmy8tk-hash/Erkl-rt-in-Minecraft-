// „Geldwäsche, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
// Look nach freigegebenem Preset: kein Bloom, keine Tiefenunschärfe, keine Vignette, kein Motion Blur.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920, FPS = 30, RES = 0.75;

// ---------- Hilfen ----------
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = x => Math.max(0, Math.min(1, x));
const smoother = m => { m = clamp01(m); return m * m * m * (m * (m * 6 - 15) + 10); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hex = c => '#' + c.toString(16).padStart(6, '0');
function shade(c, f) { const k = v => Math.max(0, Math.min(255, Math.round(v * f))); return (k((c >> 16) & 255) << 16) | (k((c >> 8) & 255) << 8) | k(c & 255); }
function tex(w, h, draw, seed = 1) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), rng(seed), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function px(c, x, y, col) { c.fillStyle = typeof col === 'number' ? hex(col) : col; c.fillRect(x, y, 1, 1); }
function noiseFill(c, r, w, h, base, amt = 0.1) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(c, x, y, shade(base, 1 - amt + r() * amt * 2)); }
const solidTex = (col, amt = 0.08, seed = 1) => tex(8, 8, (c, r) => noiseFill(c, r, 8, 8, col, amt), seed);
const tileTex = (base, line, seed, brick = true) => tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  const row = y >> 2, off = brick && row % 2 ? 4 : 0; const e = y % 4 === 3 || (x + off) % 8 === 7; px(c, x, y, shade(e ? line : base, 0.88 + r() * 0.22)); } }, seed);

const T = {
  cobble: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const e = x % 8 === 0 || (y % 8 === 0); px(c, x, y, shade(e ? 0x4a4540 : 0x86807a, 0.85 + r() * 0.3)); } }, 1),
  brick: tileTex(0x9a4a32, 0x5e3a2e, 2), brickDark: tileTex(0x6a3828, 0x3e2a22, 3), brickGrey: tileTex(0x7a7470, 0x55504c, 4),
  planks: tex(16, 16, (c, r) => { const cols = [0x7a5233, 0x6e4a2e, 0x84593a, 0x734d30]; for (let row = 0; row < 4; row++) { const b = cols[row]; for (let y = row * 4; y < row * 4 + 4; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(b, 0.9 + r() * 0.2)); for (let x = 0; x < 16; x++) px(c, x, row * 4 + 3, shade(b, 0.62)); const s = (row * 7 + 3) % 16; for (let y = row * 4; y < row * 4 + 3; y++) px(c, s, y, shade(b, 0.7)); } }, 5),
  darkwood: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x4a3020, 0.14); for (let x = 0; x < 16; x++) { px(c, x, 0, 0x2e1d12); px(c, x, 15, 0x2e1d12); } }, 6),
  roof: tileTex(0x4a4a52, 0x2c2c33, 7), roofRed: tileTex(0xa8452c, 0x6a2a1a, 8),
  dirt: solidTex(0x6b5038, 0.14, 9), grass: solidTex(0x5f7d3c, 0.14, 10), snow: solidTex(0xe8eef5, 0.04, 11),
  metal: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x3c3f44, 0.1); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x26282c); px(c, 0, i, 0x26282c); } px(c, 3, 3, 0x6a6e74); px(c, 12, 3, 0x6a6e74); px(c, 3, 12, 0x6a6e74); px(c, 12, 12, 0x6a6e74); }, 12),
  concrete: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xb8b4aa, 0.06); for (let i = 0; i < 16; i++) px(c, 0, i, 0x8c887f); for (let i = 0; i < 5; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x9a968c); }, 13),
  sand: solidTex(0xcdbb92, 0.08, 14),
  palace: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x8db89a, 0.05), 15),
  white: solidTex(0xe9e4d8, 0.04, 16), redCloth: solidTex(0xb3201c, 0.08, 17), gold: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xf0c02a, 0.08); for (let i = 0; i < 16; i++) { px(c, i, 0, 0xfff07a); px(c, 0, i, 0xfff07a); px(c, i, 15, 0xb8860b); px(c, 15, i, 0xb8860b); } }, 18),
  books: tex(16, 16, (c, r) => { const cols = [0x7a2a22, 0x2a4a6a, 0x3a5a2a, 0x6a4a1a, 0x4a2a4a, 0x8a6a2a]; for (let s = 0; s < 2; s++) { let x = 0; while (x < 16) { const w = 1 + Math.floor(r() * 2), col = cols[Math.floor(r() * cols.length)], top = s * 8 + 1 + Math.floor(r() * 2); for (let xx = x; xx < Math.min(16, x + w); xx++) for (let y = s * 8; y < s * 8 + 8; y++) px(c, xx, y, y < top ? 0x3a2416 : y === s * 8 + 7 ? 0x2a1a0e : shade(col, 0.9 + r() * 0.2)); x += w; } } }, 19),
  wallpaperRed: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x7a1e1a, 0.05); [[8, 3], [7, 4], [9, 4], [8, 5], [0, 11], [15, 11]].forEach(([x, y]) => px(c, x, y, 0xa8862e)); }, 20),
  wallpaperBeige: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xb7a685, 0.05); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 * 4; x < 16; x += 8) px(c, x, y, 0x9a8a6a); }, 21),
  shopWall: solidTex(0xc9d3c6, 0.04, 22), lino: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0x8a8f7a : 0x6f7462, 0.95 + r() * 0.1)); }, 23),
  wheat: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xc9a54a, 0.12); for (let x = 0; x < 16; x += 3) for (let y = 0; y < 16; y++) if (r() < 0.5) px(c, x, y, 0x8a6a2a); }, 24),
  window: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const f = x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || x === 8 || y === 7 || y === 8; px(c, x, y, f ? 0x3d2a1a : shade(0xffc06a, 0.9 + r() * 0.2)); } }, 25),
  windowDark: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const f = x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || x === 8 || y === 7 || y === 8; px(c, x, y, f ? 0x2e2a26 : shade(0x3a4658, 0.9 + r() * 0.2)); } }, 26),
  graffiti: tex(32, 32, (c, r) => { noiseFill(c, r, 32, 32, 0xb8b4aa, 0.05); const cols = ['#e8452c', '#2c8ae8', '#f0d02a', '#3ac24a', '#d84ac8', '#ffffff', '#202020']; for (let i = 0; i < 26; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; const x = Math.floor(r() * 30), y = 8 + Math.floor(r() * 22), w = 2 + Math.floor(r() * 7), h = 1 + Math.floor(r() * 4); c.fillRect(x, y, w, h); } }, 27),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0, opts = {}) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; const s = opts.uvScale ?? 1;
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * s, uv.getY(k) * dims[f][1] * s); }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; return m;
}
const matCache = new Map();
const M = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: o.rough ?? 0.92, metalness: o.metal ?? 0, ...(o.emissive ? { emissive: o.emissive, emissiveMap: map, emissiveIntensity: o.ei ?? 1 } : {}) });
const C = (col, o = {}) => { const k = col + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, M(solidTex(col, o.amt ?? 0.07, col % 97), o)); return matCache.get(k); };

// ---------- Renderer (Preset: nur RenderPass + OutputPass) ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(RES); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 1500);
const composer = new EffectComposer(renderer); const rp = new RenderPass(new THREE.Scene(), camera); composer.addPass(rp); composer.addPass(new OutputPass());
composer.setPixelRatio(RES); composer.setSize(W, H);

function sunLight(scene, col, int, pos, target, size, mapSize = 2048) {
  const s = new THREE.DirectionalLight(col, int); s.position.copy(pos); s.target.position.copy(target); s.castShadow = true;
  s.shadow.mapSize.set(mapSize, mapSize); s.shadow.radius = 4; s.shadow.bias = -0.0005; s.shadow.normalBias = 0.02;
  Object.assign(s.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: pos.distanceTo(target) + size * 2 });
  scene.add(s, s.target); return s;
}
function skyDome(scene, top, mid, hor, sunDir = null, sunCol = [1, 0.85, 0.6]) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, hor: { value: new THREE.Color(hor) }, sd: { value: sunDir ? sunDir.clone().normalize() : V(0, -1, 0) }, sc: { value: new THREE.Vector3(...sunCol) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, hor, sd, sc; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(hor, mid, smoothstep(-0.02,0.15,h)); c = mix(c, top, smoothstep(0.15,0.6,h));
      float s = max(dot(normalize(vP), sd), 0.); c += sc*pow(s,400.)*1.2 + sc*pow(s,8.)*0.12; gl_FragColor = vec4(c,1.); }` });
  const d = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m); scene.add(d); return d;
}
function clouds(scene, seed, col, y, n, spread, opacity = 0.9) {
  const r = rng(seed), m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity, fog: false });
  for (let i = 0; i < n; i++) scene.add(box(8 + r() * 18, 1.5, 5 + r() * 10, m, -spread + r() * spread * 2, y + r() * 8, -spread + r() * spread * 1.6, { cast: false }));
}

// ---------- Figuren (Minecraft-Proportionen) ----------
function faceTex(o) {
  return tex(8, 8, (c) => {
    const sk = hex(o.skin), hr = hex(o.hair), bd = hex(o.beardCol ?? o.hair);
    c.fillStyle = sk; c.fillRect(0, 0, 8, 8);
    if (!o.bald) { c.fillStyle = hr; c.fillRect(0, 0, 8, 2); c.fillRect(0, 2, 1, 2); c.fillRect(7, 2, 1, 2); if (o.longHair) { c.fillRect(0, 2, 1, 5); c.fillRect(7, 2, 1, 5); } }
    else { c.fillStyle = hr; c.fillRect(0, 2, 1, 3); c.fillRect(7, 2, 1, 3); }
    c.fillStyle = hex(shade(o.beardCol ?? o.hair, 0.85)); if (o.sad) { c.fillRect(2, 3, 1, 1); c.fillRect(1, 2, 1, 1); c.fillRect(5, 3, 1, 1); c.fillRect(6, 2, 1, 1); } else if (o.angry) { c.fillRect(1, 2, 1, 1); c.fillRect(2, 3, 1, 1); c.fillRect(6, 2, 1, 1); c.fillRect(5, 3, 1, 1); c.fillStyle = '#d06050'; c.fillRect(0, 5, 1, 1); c.fillRect(7, 5, 1, 1); } else { c.fillRect(1, 3, 2, 1); c.fillRect(5, 3, 2, 1); }
    c.fillStyle = '#ffffff'; c.fillRect(1, 4, 2, 1); c.fillRect(5, 4, 2, 1); c.fillStyle = o.eye ?? '#3a2a1a'; c.fillRect(2, 4, 1, 1); c.fillRect(5, 4, 1, 1);
    c.fillStyle = hex(shade(o.skin, 0.84)); c.fillRect(3, 5, 2, 1);
    c.fillStyle = o.smile ? '#7a3a30' : '#8a4a40'; if (o.sad) { c.fillRect(3, 6, 2, 1); c.fillRect(2, 7, 1, 1); c.fillRect(5, 7, 1, 1); } else { c.fillRect(3, 6, 2, 1); if (o.smile) { c.fillRect(2, 5, 1, 1); c.fillRect(5, 5, 1, 1); } }
    c.fillStyle = bd;
    if (o.beard === 'full') { c.fillRect(0, 5, 3, 3); c.fillRect(5, 5, 3, 3); c.fillRect(1, 7, 6, 1); c.fillRect(2, 5, 4, 1); c.fillStyle = '#5a3a30'; c.fillRect(3, 6, 2, 1); }
    if (o.beard === 'short') { c.fillRect(0, 5, 1, 3); c.fillRect(7, 5, 1, 3); c.fillRect(1, 7, 6, 1); c.fillRect(2, 5, 4, 1); }
    if (o.beard === 'goatee') { c.fillRect(2, 5, 4, 1); c.fillRect(3, 7, 2, 1); }
    if (o.beard === 'mustache') { c.fillRect(1, 5, 6, 1); c.fillRect(2, 6, 1, 1); c.fillRect(5, 6, 1, 1); }
  }, 300 + (o.seed ?? 0));
}
function humanoid(o) {
  const g = new THREE.Group(), s = o.scale ?? 0.95;
  const skin = C(o.skin), hair = C(o.hair), top = C(o.top), bot = C(o.bottom ?? o.top), shoe = C(o.shoe ?? 0x2a1c14);
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.125, 0.72, 0); legR.position.set(0.125, 0.72, 0);
  for (const L of [legL, legR]) { L.add(box(0.24, 0.6, 0.24, bot, 0, -0.3, 0)); L.add(box(0.25, 0.14, 0.26, shoe, 0, -0.65, 0.01)); }
  const body = new THREE.Group(); body.add(box(0.5, 0.74, 0.26, top, 0, 1.08, 0));
  if (o.coat) body.add(box(0.54, 0.5, 0.3, top, 0, 0.62, 0)); if (o.skirt) body.add(box(0.58, 0.42, 0.34, bot, 0, 0.6, 0));
  if (o.tie) body.add(box(0.08, 0.4, 0.02, C(o.tie), 0, 1.18, 0.14, { cast: false }));
  if (o.belt) body.add(box(0.52, 0.07, 0.28, C(o.belt), 0, 0.76, 0, { cast: false }));
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.37, 1.42, 0); armR.position.set(0.37, 1.42, 0);
  for (const A of [armL, armR]) { A.add(box(0.22, 0.6, 0.22, top, 0, -0.26, 0)); A.add(box(0.21, 0.16, 0.21, skin, 0, -0.63, 0)); }
  const head = new THREE.Group(); head.position.set(0, 1.45, 0);
  const topMat = o.bald ? skin : hair, backMat = o.bald ? skin : hair;
  const hm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), [skin, skin, topMat, skin, M(faceTex(o)), backMat]); hm.position.y = 0.25; hm.castShadow = true; head.add(hm);
  const fcache = {}; g.userData_face = (opts) => { const k = JSON.stringify(opts); if (!fcache[k]) fcache[k] = M(faceTex({ ...o, ...opts, seed: (o.seed ?? 0) + 500 + Object.keys(fcache).length })); hm.material[4] = fcache[k]; };
  if (!o.bald && o.hairVol) head.add(box(0.56, 0.16, 0.56, hair, 0, 0.47, -0.01));
  if (o.longHair) head.add(box(0.54, 0.6, 0.12, hair, 0, 0.15, -0.22));
  const bc = C(o.beardCol ?? o.hair);
  if (o.beard === 'full') { head.add(box(0.52, 0.3, 0.16, bc, 0, 0.0, 0.2)); head.add(box(0.36, 0.14, 0.12, bc, 0, -0.18, 0.2)); }
  if (o.beard === 'short') head.add(box(0.5, 0.14, 0.08, bc, 0, 0.04, 0.24));
  if (o.beard === 'goatee') head.add(box(0.14, 0.14, 0.08, bc, 0, -0.02, 0.25));
  if (o.hat === 'top') { const hm2 = C(0x1a1a1e); head.add(box(0.66, 0.04, 0.66, hm2, 0, 0.52, 0)); head.add(box(0.46, 0.44, 0.46, hm2, 0, 0.75, 0)); head.add(box(0.47, 0.06, 0.47, C(0x5a1a1a), 0, 0.57, 0)); }
  if (o.hat === 'cap') { const hc = C(o.hatCol ?? 0x4a443c); head.add(box(0.54, 0.12, 0.54, hc, 0, 0.53, 0)); head.add(box(0.44, 0.04, 0.18, hc, 0, 0.5, 0.33)); }
  if (o.hat === 'ushanka') { const hc = C(0x5a4632); head.add(box(0.6, 0.22, 0.6, hc, 0, 0.58, 0)); head.add(box(0.1, 0.3, 0.4, hc, -0.3, 0.32, 0)); head.add(box(0.1, 0.3, 0.4, hc, 0.3, 0.32, 0)); }
  if (o.hat === 'helmet') { const hc = C(0x4a5440); head.add(box(0.6, 0.18, 0.6, hc, 0, 0.55, 0)); head.add(box(0.5, 0.1, 0.5, hc, 0, 0.67, 0)); }
  if (o.hat === 'military') { const hc = C(0x5a5a3a); head.add(box(0.56, 0.14, 0.56, hc, 0, 0.55, 0)); head.add(box(0.62, 0.06, 0.62, hc, 0, 0.62, 0.02)); head.add(box(0.06, 0.06, 0.02, C(0xc02020), 0, 0.56, 0.29)); }
  g.add(legL, legR, body, armL, armR, head); g.scale.setScalar(s);
  g.userData = { legL, legR, armL, armR, head, body, s, setFace: g.userData_face, faces: {} }; return g;
}
function pose(ch, kind, t, ph = 0) {
  const P = ch.userData; [P.legL, P.legR, P.armL, P.armR, P.head, P.body].forEach(p => p.rotation.set(0, 0, 0)); P.body.position.y = 0; P.head.position.y = 1.45;
  const sway = Math.sin(t * 1.7 + ph) * 0.05;
  if (kind === 'idle') { P.armL.rotation.x = sway; P.armR.rotation.x = -sway; P.head.rotation.y = Math.sin(t * 0.9 + ph) * 0.08; }
  if (kind === 'walk' || kind === 'carry') { const w = Math.sin(t * 9 + ph) * 0.6; P.legL.rotation.x = w; P.legR.rotation.x = -w;
    if (kind === 'walk') { P.armL.rotation.x = -w * 0.8; P.armR.rotation.x = w * 0.8; } else { P.armL.rotation.x = P.armR.rotation.x = -1.35; } }
  if (kind === 'work') { P.armR.rotation.x = -1.2 + Math.sin(t * 8 + ph) * 0.5; P.armL.rotation.x = -1.0 + Math.sin(t * 8 + ph + 1.2) * 0.3; P.head.rotation.x = 0.25; }
  if (kind === 'fist') { P.armR.rotation.x = -2.9 + Math.sin(t * 3 + ph) * 0.12; P.armL.rotation.x = sway; }
  if (kind === 'cheer') { const j = Math.abs(Math.sin(t * 5 + ph)); P.armR.rotation.x = -2.8 - j * 0.2; P.armL.rotation.x = -2.6 + j * 0.3; P.armL.rotation.z = -0.2; P.armR.rotation.z = 0.2; ch.position.y = (ch.userData.baseY ?? 0) + j * 0.18; }
  if (kind === 'write') { P.armR.rotation.x = -1.25 + Math.sin(t * 13) * 0.06; P.armR.rotation.z = 0.15; P.armL.rotation.x = -1.1; P.head.rotation.x = 0.35; }
  if (kind === 'sad') { P.head.rotation.x = 0.4; P.armL.rotation.x = -0.9; P.armR.rotation.x = -0.9; }
  if (kind === 'count') { P.armR.rotation.x = -1.3 + Math.abs(Math.sin(t * 6)) * 0.3; P.armL.rotation.x = -1.2; P.head.rotation.x = 0.15; }
  if (kind === 'point') { P.armR.rotation.x = -1.55; P.armL.rotation.x = sway; }
  if (kind === 'shake') { P.armR.rotation.x = -1.3 + Math.sin(t * 7 + ph) * 0.15; P.armL.rotation.x = sway; }
  if (kind === 'hammer') { P.armR.rotation.x = -2.6 + Math.abs(Math.sin(t * 7 + ph)) * 1.4; P.armL.rotation.x = -1.2; }
}
function sitPose(ch, seatY) { const P = ch.userData; P.legL.rotation.x = P.legR.rotation.x = -1.5; ch.position.y = seatY - 0.72 * P.s + 0.06; }
const tagPos = (ch, extra = 0) => ch.localToWorld(V(0, 2.05 + extra + (ch.userData.hatExtra ?? 0), 0));

// Rauch, Schnee, Partikel, Fahnen
function smoke(scene, x, y, z, n = 14, seed = 1, col = 0x6b6660) {
  const g = new THREE.Group(), r = rng(seed); const mats = [0, 1, 2].map(i => new THREE.MeshStandardMaterial({ color: shade(col, 0.85 + i * 0.12), transparent: true, depthWrite: false, roughness: 1 }));
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats[i % 3].clone()); m.userData = { p: i / n, ox: (r() - 0.5) * 0.6, oz: (r() - 0.5) * 0.6, rs: r() * 2 }; m.castShadow = false; g.add(m); }
  g.position.set(x, y, z); scene.add(g);
  g.userData.update = t => g.children.forEach(m => { const u = (t * 0.12 + m.userData.p) % 1; const sz = 0.9 + u * 3.2; m.scale.setScalar(sz); m.position.set(m.userData.ox + u * 5, u * 11, m.userData.oz + u * 1.5); m.rotation.set(u * m.userData.rs, u * 2, 0); m.material.opacity = 0.75 * (1 - u) * Math.min(1, u * 8); });
  return g;
}
function snowfall(scene, center, n = 500, size = 30, seed = 3) {
  const g = new THREE.Group(), r = rng(seed), m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), m); b.userData = { x: (r() - 0.5) * size, y: r() * 20, z: (r() - 0.5) * size, p: r() * 6 }; g.add(b); }
  g.position.copy(center); scene.add(g);
  g.userData.update = t => g.children.forEach(b => { const u = b.userData; b.position.set(u.x + Math.sin(t + u.p) * 0.4, ((u.y - t * 1.6) % 20 + 20) % 20, u.z); });
  return g;
}
function flag(texture, w, h, poleH, scene, pos, rotY = 0, phase = 0) {
  const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = rotY;
  g.add(box(0.12, poleH, 0.12, C(0x6a6a6a, { metal: 0.3, rough: 0.5 }), 0, poleH / 2, 0));
  const geo = new THREE.PlaneGeometry(w, h, 16, 8); const orig = geo.attributes.position.array.slice();
  const fm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.9 })); fm.castShadow = true;
  const holder = new THREE.Group(); holder.position.set(w / 2 + 0.06, poleH - h / 2 - 0.1, 0); holder.add(fm); g.add(holder);
  g.userData.holder = holder; g.userData.poleH = poleH; g.userData.h = h;
  g.userData.update = t => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = orig[i * 3], y = orig[i * 3 + 1]; const u = (x + w / 2) / w; p.setZ(i, Math.sin(u * 5 - t * 5 + phase + y * 0.4) * 0.16 * u * w * 0.5); p.setY(i, y - u * u * 0.06); } p.needsUpdate = true; geo.computeVertexNormals(); };
  scene.add(g); return g;
}
const flagTex = {
  red: tex(24, 16, (c) => { c.fillStyle = '#c8201a'; c.fillRect(0, 0, 24, 16); }, 40),
  soviet: tex(24, 16, (c) => { c.fillStyle = '#c8201a'; c.fillRect(0, 0, 24, 16); c.fillStyle = '#f2c230'; [[3, 2], [4, 2], [5, 3], [2, 3], [3, 4], [4, 4], [5, 5], [6, 6], [2, 6], [3, 5], [7, 5], [6, 4]].forEach(([x, y]) => c.fillRect(x, y, 1, 1)); c.fillRect(4, 0, 1, 1); }, 41),
  china: tex(24, 16, (c) => { c.fillStyle = '#d0201a'; c.fillRect(0, 0, 24, 16); c.fillStyle = '#ffd820'; c.fillRect(3, 2, 3, 3); c.fillRect(4, 1, 1, 5); c.fillRect(2, 3, 5, 1); [[8, 1], [9, 3], [9, 5], [8, 7]].forEach(([x, y]) => c.fillRect(x, y, 1, 1)); }, 42),
  cuba: tex(24, 16, (c) => { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#1f3d99'; c.fillRect(0, Math.round(i * 3.2), 24, 4); } c.fillStyle = '#d0201a'; for (let x = 0; x < 11; x++) { const hh = Math.round(8 - x * 8 / 11); c.fillRect(x, 8 - hh, 1, hh * 2); } c.fillStyle = '#fff'; c.fillRect(3, 7, 2, 2); }, 43),
  ddr: tex(24, 15, (c) => { c.fillStyle = '#111'; c.fillRect(0, 0, 24, 5); c.fillStyle = '#d0201a'; c.fillRect(0, 5, 24, 5); c.fillStyle = '#ffce00'; c.fillRect(0, 10, 24, 5); c.fillStyle = '#ffce00'; c.fillRect(10, 4, 4, 1); c.fillRect(9, 5, 1, 5); c.fillRect(14, 5, 1, 5); c.fillRect(10, 10, 4, 1); c.fillStyle = '#e8b800'; c.fillRect(11, 6, 2, 3); }, 44),
};
function particlesBurst(scene, n, cols, seed, size = 0.12) {
  const g = new THREE.Group(), r = rng(seed); const mats = cols.map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true }));
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mats[i % mats.length]); const a = r() * Math.PI * 2, e = (r() - 0.3) * Math.PI; m.userData.v = V(Math.cos(a) * Math.cos(e), Math.sin(e) + 0.3, Math.sin(a) * Math.cos(e)).multiplyScalar(0.6 + r() * 0.8); g.add(m); }
  scene.add(g); g.visible = false; return g;
}
function updateBurst(g, dt, speed = 6, life = 1.2) { if (dt < 0 || dt > life) { g.visible = false; return; } g.visible = true;
  g.children.forEach(m => { const v = m.userData.v; m.position.set(v.x * dt * speed, v.y * dt * speed - dt * dt * 2.5, v.z * dt * speed); m.material.opacity = 1 - dt / life; m.scale.setScalar(1 - dt / life * 0.5); }); }


// ---------- zusätzliche Posen ----------
function pose2(ch, kind, t, ph = 0) {
  const P = ch.userData; pose(ch, 'idle', t, ph);
  if (kind === 'curl') { const c = Math.abs(Math.sin(t * 3 + ph)); P.armR.rotation.x = -0.2 - c * 1.7; P.armL.rotation.x = -0.2 - Math.abs(Math.sin(t * 3 + ph + 1.5)) * 1.7; }
  if (kind === 'cream') { P.armR.rotation.x = -2.3 + Math.sin(t * 7) * 0.12; P.armR.rotation.z = 0.55; P.head.rotation.x = -0.1; }
  if (kind === 'type') { P.armR.rotation.x = -1.35 + Math.sin(t * 14) * 0.05; P.armL.rotation.x = -1.35 + Math.sin(t * 14 + 2) * 0.05; P.head.rotation.x = 0.05; }
  if (kind === 'jog') { const w = Math.sin(t * 11 + ph); P.legL.rotation.x = w * 0.9; P.legR.rotation.x = -w * 0.9; P.armL.rotation.x = -0.5 - w * 0.7; P.armR.rotation.x = -0.5 + w * 0.7; }
  if (kind === 'raise') { const k = smoother((t - ph) / 2.6); P.armR.rotation.x = lerp(-0.3, -2.75, k); P.armR.rotation.z = lerp(0, 0.35, k); P.head.rotation.x = 0.1; }
  if (kind === 'laugh') { P.head.rotation.x = -0.15 + Math.abs(Math.sin(t * 9)) * 0.12; P.armL.rotation.x = -0.4; }
  if (kind === 'snip') { P.armR.rotation.x = -1.6 + Math.sin(t * 14) * 0.12; P.armL.rotation.x = -1.2; P.head.rotation.x = 0.3; }
  if (kind === 'point') { P.armR.rotation.x = -1.6; P.armR.rotation.y = 0.3; }
  if (kind === 'sadidle') { P.head.rotation.x = 0.28; P.armL.rotation.x = 0.05; P.armR.rotation.x = 0.05; }
  if (kind === 'walk') pose(ch, 'walk', t, ph);
}
const LEON = { skin: 0xe8b894, hair: 0x6a4422, hairVol: true, top: 0x6a6e78, bottom: 0x2a3448, shoe: 0xe8e8e8, eye: '#4a6a8a', sad: true, seed: 11 };
const LEON_B = { ...LEON, hair: 0x3e2614, hairVol: false, sad: false, seed: 12 };
const MIA = { skin: 0xf0c4a2, hair: 0x2a1a14, longHair: true, top: 0xe8b830, bottom: 0x2a3448, shoe: 0xf0f0f0, eye: '#3a2a1a', smile: true, seed: 13 };
function hammerInHand(ch) { const h = new THREE.Group(); h.position.set(0, -0.68, 0.05); h.add(box(0.06, 0.06, 0.55, C(0x6a4a2a), 0, 0, 0.2)); h.add(box(0.14, 0.14, 0.3, C(0x6a6e74, { metal: 0.6, rough: 0.4 }), 0, 0, 0.48)); ch.userData.armR.add(h); }
function dumbbell(ch, arm) { const d = new THREE.Group(); (ch.userData.dbs ||= []).push(d); d.position.set(0, -0.7, 0); d.add(box(0.06, 0.06, 0.4, C(0x2a2a2a), 0, 0, 0)); d.add(box(0.16, 0.16, 0.08, C(0x3a3a3a), 0, 0, -0.18)); d.add(box(0.16, 0.16, 0.08, C(0x3a3a3a), 0, 0, 0.18)); ch.userData[arm].add(d); }

const crownOn = (ch) => { const g = new THREE.Group(); const gm = C(0xf0c030, { metal: 0.6, rough: 0.35 }); g.add(box(0.56, 0.12, 0.56, gm, 0, 0.56, 0)); for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22], [0, 0.22]]) g.add(box(0.1, 0.16, 0.1, gm, x, 0.68, z)); ch.userData.head.add(g); return g; };
const laurel = (ch) => { const g = new THREE.Group(); const lm = C(0x6a9a3a); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(box(0.12, 0.06, 0.08, lm, Math.sin(a) * 0.28, 0.5, Math.cos(a) * 0.28)); } ch.userData.head.add(g); };
const inHand = (ch, mesh) => { const g = new THREE.Group(); g.position.set(0, -0.7, 0.05); g.add(mesh); ch.userData.armR.add(g); return g; };
const phoneMesh = () => { const g = new THREE.Group(); g.add(box(0.12, 0.2, 0.03, C(0x1a1a1a), 0, 0, 0.1)); g.add(box(0.1, 0.17, 0.01, new THREE.MeshBasicMaterial({ color: 0x9ad0ff }), 0, 0, 0.12, { cast: false })); return g; };
const bouquet = () => { const g = new THREE.Group(); g.add(box(0.06, 0.4, 0.06, C(0x3a7a2a), 0, 0.1, 0.1)); for (const [x, y, c] of [[-0.07, 0.34, 0xe8304a], [0.07, 0.36, 0xf06a8a], [0, 0.42, 0xe8304a], [0, 0.3, 0xffffff]]) g.add(box(0.1, 0.1, 0.1, C(c), x, y, 0.1)); return g; };
function pose3(ch, kind, t, ph = 0) {
  pose2(ch, 'idle', t, ph); const P = ch.userData;
  if (kind === 'cross') { P.armL.rotation.x = P.armR.rotation.x = -1.2; P.armL.rotation.z = -0.6; P.armR.rotation.z = 0.6; P.head.rotation.x = -0.15; }
  else if (kind === 'clap') { const c = Math.abs(Math.sin(t * 10 + ph)); P.armL.rotation.x = P.armR.rotation.x = -1.3; P.armL.rotation.z = -0.35 * c; P.armR.rotation.z = 0.35 * c; }
  else if (kind === 'selfie') { P.armR.rotation.x = -1.9; P.armR.rotation.z = 0.25; P.head.rotation.x = -0.1; }
  else if (kind === 'phone') { P.armR.rotation.x = -1.5; P.armR.rotation.z = 0.35; P.head.rotation.x = 0.35; }
  else if (kind === 'pose') { P.armR.rotation.x = -0.4; P.armR.rotation.z = 0.9; P.armL.rotation.z = -0.25; P.head.rotation.x = -0.25; }
  else if (kind === 'kneel') { P.legL.rotation.x = -1.5; P.legR.rotation.x = 0.0; P.armR.rotation.x = -1.4; ch.position.y = (ch.userData.baseY ?? 0) - 0.3; }
  else if (kind === 'give') { P.armR.rotation.x = -1.4; P.armL.rotation.x = -1.1; }
  else if (kind === 'angry') { P.armL.rotation.x = -0.6 + Math.sin(t * 12) * 0.2; P.armR.rotation.x = -2.2 + Math.sin(t * 12 + 1) * 0.3; P.head.rotation.x = 0.1; }
  else if (kind === 'turned') { P.armL.rotation.x = P.armR.rotation.x = -1.2; P.armL.rotation.z = -0.6; P.armR.rotation.z = 0.6; }
  else if (kind === 'lookdown') { P.head.rotation.x = 0.55; P.armL.rotation.x = -0.5; P.armR.rotation.x = -0.5; }
  else if (kind === 'walk' || kind === 'laugh' || kind === 'sadidle' || kind === 'point' || kind === 'jog') pose2(ch, kind, t, ph);
}

// ---------- Zubehör ----------
const addTo = (ch, part, mesh) => { ch.userData[part].add(mesh); return mesh; };
function turban(ch, col) { const g = new THREE.Group(); const m = C(col); g.add(box(0.58, 0.2, 0.58, m, 0, 0.55, 0)); g.add(box(0.46, 0.12, 0.46, m, 0, 0.7, -0.02)); g.add(box(0.1, 0.1, 0.04, C(0xe0b030, { metal: 0.5, rough: 0.4 }), 0, 0.6, 0.3, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.22; return g; }
function mortar(ch) { const g = new THREE.Group(); const m = C(0x18181c); g.add(box(0.54, 0.1, 0.54, m, 0, 0.55, 0)); g.add(box(0.82, 0.04, 0.82, m, 0, 0.62, 0)); g.add(box(0.04, 0.26, 0.04, C(0xf0c030), 0.36, 0.5, 0.36, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.15; return g; }
function veil(ch) { const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.9 }); ch.userData.head.add(box(0.56, 0.75, 0.1, m, 0, 0.12, -0.27)); ch.userData.head.add(box(0.56, 0.06, 0.56, C(0xffffff), 0, 0.53, 0)); }
function garland(ch) { const g = new THREE.Group(); const cols = [0xf08a20, 0xffd040, 0xf06a20]; for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; g.add(box(0.09, 0.09, 0.09, C(cols[i % 3]), Math.sin(a) * 0.24, 1.38 - Math.cos(a) * 0.22 + 0.22, 0.15 + Math.cos(a) * 0.02, { cast: false })); } ch.userData.body.add(g); return g; }
function stetho(ch) { const m = C(0x2a2a2e); ch.userData.body.add(box(0.04, 0.34, 0.03, m, -0.12, 1.2, 0.145, { cast: false })); ch.userData.body.add(box(0.04, 0.34, 0.03, m, 0.12, 1.2, 0.145, { cast: false })); ch.userData.body.add(box(0.1, 0.1, 0.04, C(0xa8acb4, { metal: 0.6, rough: 0.3 }), 0.12, 1.0, 0.15, { cast: false })); }
function hoodie(ch, col) { ch.userData.head.add(box(0.56, 0.3, 0.2, C(col), 0, 0.3, -0.22)); }
const bookMesh = (col = 0x6a2a1a) => { const g = new THREE.Group(); g.add(box(0.3, 0.38, 0.08, C(col), 0, 0, 0.12)); return g; };
const paperMesh = () => { const g = new THREE.Group(); g.add(box(0.5, 0.36, 0.02, C(0xe8e4d8), -0.18, 0.05, 0.25)); return g; };
const ringMesh = () => { const g = new THREE.Group(); g.add(box(0.08, 0.08, 0.04, C(0xf0c030, { metal: 0.7, rough: 0.3 }), 0, 0, 0.1)); g.add(box(0.05, 0.05, 0.05, new THREE.MeshBasicMaterial({ color: 0xcff4ff }), 0, 0.06, 0.1, { cast: false })); return g; };
const plankMesh = () => { const g = new THREE.Group(); g.add(box(0.12, 0.1, 0.9, M(T.planks), 0, 0, 0.35)); return g; };
function room3(scene, w, d, h, wallM, floorM, ceil = true) { // offene Front (+z)
  scene.add(box(w, 0.2, d, floorM, 0, -0.1, 0, { cast: false })); scene.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2)); scene.add(box(0.3, h, d, wallM, -w / 2, h / 2, 0)); scene.add(box(0.3, h, d, wallM, w / 2, h / 2, 0));
  if (ceil) scene.add(box(w, 0.2, d, wallM, 0, h + 0.1, 0, { cast: false }));
}


// ---------- Zubehör Geldwäsche ----------
function fedora(ch, col = 0x2a2a30, band = 0x111114) { const g = new THREE.Group(); const m = C(col); g.add(box(0.72, 0.04, 0.72, m, 0, 0.52, 0)); g.add(box(0.52, 0.24, 0.5, m, 0, 0.66, 0)); g.add(box(0.53, 0.07, 0.51, C(band), 0, 0.58, 0)); g.add(box(0.2, 0.04, 0.5, C(shade(col, 0.8)), 0, 0.79, 0, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.32; return g; }
function glasses(ch) { const m = C(0x1a1a1a); ch.userData.head.add(box(0.44, 0.04, 0.02, m, 0, 0.27, 0.262, { cast: false })); for (const x of [-0.12, 0.12]) ch.userData.head.add(box(0.14, 0.12, 0.02, new THREE.MeshStandardMaterial({ color: 0x9ab8c8, transparent: true, opacity: 0.45 }), x, 0.24, 0.263, { cast: false })); }
function chain(ch) { const m = C(0xf0c030, { metal: 0.7, rough: 0.3 }); for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; ch.userData.body.add(box(0.06, 0.06, 0.04, m, Math.sin(a) * 0.17, 1.36 - Math.cos(a) * 0.15 + 0.15 - (i === 3 ? 0.02 : 0), 0.14, { cast: false })); } }
function cigar(ch) { const g = new THREE.Group(); g.add(box(0.05, 0.05, 0.2, C(0x6a3a1a), 0.08, 0.1, 0.32, { cast: false })); g.add(box(0.052, 0.052, 0.03, new THREE.MeshBasicMaterial({ color: 0xff7a2a }), 0.08, 0.1, 0.43, { cast: false })); ch.userData.head.add(g); return g; }
const billTex = (base, dirty) => tex(16, 8, (c, r) => { noiseFill(c, r, 16, 8, base, 0.06); for (let x = 0; x < 16; x++) { px(c, x, 0, shade(base, 1.25)); px(c, x, 7, shade(base, 1.25)); } for (let y = 0; y < 8; y++) { px(c, 0, y, shade(base, 1.25)); px(c, 15, y, shade(base, 1.25)); }
  c.fillStyle = hex(shade(base, 1.4)); c.fillRect(6, 2, 4, 4); c.fillStyle = hex(shade(base, 0.7)); c.fillRect(7, 3, 2, 2); c.fillRect(2, 2, 2, 1); c.fillRect(12, 5, 2, 1);
  if (dirty) for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(60,40,20,${0.5 + r() * 0.4})`; c.fillRect(Math.floor(r() * 15), Math.floor(r() * 7), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2)); } }, dirty ? 4101 : 4100);
const BILL = M(billTex(0x5aa04a)), BILLD = M(billTex(0x6a7a3a, true)), BAND = C(0xf2eee0), BANDD = C(0x9a8a6a);
function bundle(x = 0, y = 0, z = 0, dirty = false, s = 1) { const g = new THREE.Group(); g.position.set(x, y, z); const m = dirty ? BILLD : BILL;
  g.add(box(0.34 * s, 0.09 * s, 0.17 * s, [C(dirty ? 0x5a6a3a : 0x5a9a4a), C(dirty ? 0x5a6a3a : 0x5a9a4a), m, m, C(dirty ? 0x5a6a3a : 0x5a9a4a), C(dirty ? 0x5a6a3a : 0x5a9a4a)].length ? m : m, 0, 0.045 * s, 0)); g.add(box(0.07 * s, 0.095 * s, 0.175 * s, dirty ? BANDD : BAND, 0, 0.045 * s, 0, { cast: false })); return g; }
function cashPile(n, w, d, seed, dirty = false) { const g = new THREE.Group(), r = rng(seed); let k = 0; for (let layer = 0; k < n; layer++) { const cw = Math.max(1, w - layer), cd = Math.max(1, d - layer); for (let i = 0; i < cw && k < n; i++) for (let j = 0; j < cd && k < n; j++) { const b = bundle((i - (cw - 1) / 2) * 0.36 + (r() - 0.5) * 0.04, layer * 0.09, (j - (cd - 1) / 2) * 0.19, dirty); b.rotation.y = (r() - 0.5) * 0.15; g.add(b); k++; } } return g; }
function suitcase(open = true, dirty = false) { const g = new THREE.Group(); const lm = C(0x4a2a1a), mm = C(0xc8a040, { metal: 0.6, rough: 0.4 });
  g.add(box(0.95, 0.06, 0.62, lm, 0, 0.03, 0)); g.add(box(0.95, 0.2, 0.05, lm, 0, 0.12, 0.29)); g.add(box(0.95, 0.2, 0.05, lm, 0, 0.12, -0.29)); g.add(box(0.05, 0.2, 0.62, lm, -0.45, 0.12, 0)); g.add(box(0.05, 0.2, 0.62, lm, 0.45, 0.12, 0));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) for (let l = 0; l < 2; l++) { const b = bundle(-0.22 + i * 0.44 - 0.0, 0.06 + l * 0.09, -0.19 + j * 0.19, dirty, 1.12); g.add(b); }
  const lid = new THREE.Group(); lid.position.set(0, 0.2, -0.31); g.add(lid); lid.add(box(0.95, 0.62, 0.05, lm, 0, 0.31, -0.0)); lid.add(box(0.85, 0.52, 0.02, C(0x7a1a1a), 0, 0.31, 0.035, { cast: false }));
  lid.rotation.x = open ? -0.35 : Math.PI / 2; g.add(box(0.2, 0.05, 0.05, mm, 0, 0.22, 0.32, { cast: false })); g.userData.lid = lid; return g; }
function moneyBag(ch) { const g = new THREE.Group(); g.position.set(0, -0.72, 0.05); g.add(box(0.36, 0.42, 0.3, C(0xb89a6a), 0, -0.2, 0)); g.add(box(0.14, 0.1, 0.12, C(0x8a6a3a), 0, 0.04, 0)); ch.userData.armR.add(g); return g; }
function fanCash(ch) { const g = new THREE.Group(); g.position.set(0, -0.72, 0.1); for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshStandardMaterial({ map: billTex(0x5aa04a), side: THREE.DoubleSide, roughness: 0.9 })); b.position.set(0, 0.08, 0.06 + i * 0.004); b.rotation.set(-1.2, 0, (i - 2) * 0.28); b.translateY(0.06); g.add(b); } ch.userData.armR.add(g); return g; }
const ledger = () => { const g = new THREE.Group(); g.add(box(0.34, 0.06, 0.42, C(0x2a3a5a), 0, 0, 0.14)); g.add(box(0.32, 0.065, 0.4, C(0xeee8d8), 0.01, 0, 0.14, { cast: false })); g.rotation.x = -1.1; return g; };
function barrel(scene, x, y, z, s = 1) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(box(0.62 * s, 0.86 * s, 0.62 * s, M(T.planks), 0, 0.43 * s, 0)); for (const yy of [0.14, 0.72]) g.add(box(0.64 * s, 0.06 * s, 0.64 * s, C(0x3a3a3e, { metal: 0.5 }), 0, yy * s, 0, { cast: false })); scene.add(g); return g; }
function lamp(scene, x, z, light = true, col = 0xffc070) { scene.add(box(0.14, 4.2, 0.14, C(0x1e1e22, { metal: 0.4 }), x, 2.1, z)); scene.add(box(0.8, 0.08, 0.08, C(0x1e1e22), x + 0.35, 4.15, z)); scene.add(box(0.34, 0.4, 0.34, new THREE.MeshBasicMaterial({ color: col }), x + 0.7, 3.95, z, { cast: false }));
  if (light) { const l = new THREE.PointLight(col, 7, 11, 1.3); l.position.set(x + 0.7, 3.6, z); scene.add(l); } }
function oldCar(scene, x, z, ry = 0, col = 0x16161a) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const m = C(col, { metal: 0.4, rough: 0.35 });
  g.add(box(3.6, 0.6, 1.6, m, 0, 0.75, 0)); g.add(box(1.9, 0.9, 1.5, m, -0.35, 1.45, 0)); g.add(box(1.7, 0.6, 1.52, new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.15, metalness: 0.3 }), -0.35, 1.5, 0, { cast: false }));
  g.add(box(1.2, 0.5, 1.3, m, 1.25, 1.1, 0)); for (const [wx, wz] of [[-1.15, 0.8], [1.15, 0.8], [-1.15, -0.8], [1.15, -0.8]]) { g.add(box(0.74, 0.74, 0.26, C(0x111111), wx, 0.37, wz)); g.add(box(0.3, 0.3, 0.28, C(0xb8b8b8, { metal: 0.6 }), wx, 0.37, wz, { cast: false })); }
  for (const wz of [-0.5, 0.5]) g.add(box(0.1, 0.24, 0.24, new THREE.MeshBasicMaterial({ color: 0xfff0b0 }), 1.86, 1.0, wz, { cast: false })); g.add(box(0.1, 0.4, 1.0, C(0xb8b8b8, { metal: 0.7, rough: 0.3 }), 1.84, 1.1, 0, { cast: false }));
  scene.add(g); return g; }
function sportsCar(scene, x, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const m = C(0xd8201a, { metal: 0.5, rough: 0.25 });
  g.add(box(4.2, 0.55, 1.9, m, 0, 0.6, 0)); g.add(box(2.0, 0.5, 1.6, new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.1, metalness: 0.4 }), -0.3, 1.1, 0)); g.add(box(0.9, 0.12, 1.92, m, -1.8, 0.95, 0));
  for (const [wx, wz] of [[-1.35, 0.9], [1.35, 0.9], [-1.35, -0.9], [1.35, -0.9]]) { g.add(box(0.7, 0.7, 0.28, C(0x111111), wx, 0.35, wz)); g.add(box(0.36, 0.36, 0.3, C(0xc8c8c8, { metal: 0.7 }), wx, 0.35, wz, { cast: false })); }
  for (const wz of [-0.65, 0.65]) g.add(box(0.06, 0.14, 0.4, new THREE.MeshBasicMaterial({ color: 0xffffff }), 2.11, 0.72, wz, { cast: false })); scene.add(g); return g; }
function washer(x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(box(0.86, 0.96, 0.8, C(0xe8e8e2), 0, 0.48, 0)); g.add(box(0.86, 0.12, 0.8, C(0xc8c8c4), 0, 0.9, 0, { cast: false }));
  g.add(box(0.56, 0.56, 0.04, C(0x3a3a40, { metal: 0.5, rough: 0.4 }), 0, 0.46, 0.41, { cast: false })); const drum = new THREE.Group(); drum.position.set(0, 0.46, 0.425); g.add(drum);
  drum.add(box(0.44, 0.44, 0.01, new THREE.MeshStandardMaterial({ color: 0x9ac8d8, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.35 }), 0, 0, 0.012, { cast: false }));
  const inner = new THREE.Group(); drum.add(inner); for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), BILL); b.position.set(Math.cos(i) * 0.1, Math.sin(i * 2.3) * 0.11, 0); b.rotation.z = i; inner.add(b); }
  g.userData.inner = inner; return g; }
const lazy = []; let lazyDone = false;
function textPlane(w, h, pxW, draw, basic = true) { const cv = document.createElement('canvas'); cv.width = pxW; cv.height = Math.round(pxW * h / w); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  lazy.push(() => { draw(cv.getContext('2d'), cv.width, cv.height); t.needsUpdate = true; });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic ? new THREE.MeshBasicMaterial({ map: t, transparent: true }) : new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); }
function buildingTex(base, lit, seed, cols = 4, rows = 6) { return tex(32, 48, (c, r) => { noiseFill(c, r, 32, 48, base, 0.06); for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const on = r() < lit; c.fillStyle = on ? hex(shade(0xffc56a, 0.85 + r() * 0.3)) : '#1c2232'; c.fillRect(2 + i * 8, 2 + j * 8, 4, 5); } }, seed); }

// ---------- Figuren ----------
const CAPONE = { skin: 0xf0c4a2, hair: 0x1a1410, top: 0x34343e, bottom: 0x34343e, tie: 0xb8201a, coat: true, shoe: 0x111111, eye: '#2a1a10', smile: true, seed: 51 };
const BOOK = { skin: 0xe8b894, hair: 0x8a8a8a, top: 0x5a4a32, bottom: 0x3a3226, tie: 0x2a3a5a, shoe: 0x2a1a10, eye: '#3a3a3a', seed: 52 };
const MAX = { skin: 0xe0a882, hair: 0x1e1612, hairVol: true, beard: 'short', beardCol: 0x2a1e16, top: 0x1e1e24, bottom: 0x2a3a5a, shoe: 0xf0f0f0, eye: '#3a2a1a', seed: 53 };
const CLERK = { skin: 0xf2cdb0, hair: 0xb8925a, longHair: true, top: 0x2a4a7a, bottom: 0x2a2a34, tie: 0xf0f0f0, shoe: 0x111111, eye: '#3a5a8a', seed: 54 };
const INV = { skin: 0xc89a72, hair: 0x1a1a1a, longHair: true, top: 0x3a3a42, bottom: 0x2a2a30, coat: true, shoe: 0x111111, eye: '#2a1a10', seed: 55 };
const INV2 = { skin: 0xe8b894, hair: 0x7a4a22, hairVol: true, beard: 'short', beardCol: 0x6a4020, top: 0x6a5a48, bottom: 0x2a2e3a, shoe: 0x2a1a10, eye: '#3a5a8a', seed: 56 };
const COPOLD = { skin: 0xe8b894, hair: 0x4a3020, beard: 'mustache', top: 0x1e2a4a, bottom: 0x1e2a4a, belt: 0x111111, shoe: 0x111111, hat: 'cap', hatCol: 0x1a2440, seed: 57 };
const COP = { skin: 0xd8a882, hair: 0x2a1a14, top: 0x1e2a4a, bottom: 0x1e2a4a, belt: 0x111111, shoe: 0x111111, hat: 'cap', hatCol: 0x1a2440, seed: 58 };
const STROH = { skin: 0xf0c4a2, hair: 0xc8a05a, hairVol: true, top: 0x3a8a5a, bottom: 0x2a3a5a, shoe: 0xf0f0f0, eye: '#3a5a8a', seed: 59 };

// =====================================================================
// SET 1: Chicago 1920er – Straße zur blauen Stunde, Waschsalon
// =====================================================================
const chicago = new THREE.Scene();
{
  skyDome(chicago, 0x1c2a5c, 0x6a5a9a, 0xf2a46a, V(-0.9, 0.06, -0.4), [1, 0.6, 0.35]); chicago.fog = new THREE.Fog(0x8a6a8a, 70, 300);
  chicago.add(box(600, 1, 600, C(0x3a3836), 0, -0.5, 0, { cast: false }));
  const asph = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x2e2e32, 0.1), 4201)); chicago.add(box(200, 0.04, 9, asph, 0, 0.02, 5.5, { cast: false, uvScale: 0.5 }));
  const walk = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x8a8680, 0.06); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x5e5a56); px(c, 0, i, 0x5e5a56); } }, 4202)); chicago.add(box(200, 0.16, 4, walk, 0, 0.08, -1, { cast: false }));
  chicago.add(box(200, 0.16, 3, walk, 0, 0.08, 11.5, { cast: false }));
  const brickCols = [0x8a3e2a, 0x6a4a3a, 0x9a5a3a, 0x5a4a44, 0x7a3a2e];
  for (let i = -6; i <= 6; i++) { if (i === 0) continue; const x = i * 8, h = 9 + ((i * 37 + 70) % 7), col = brickCols[(i + 13) % 5]; const g = new THREE.Group(); g.position.set(x, 0, -7); chicago.add(g);
    g.add(box(7.9, h, 8, M(tileTex(col, shade(col, 0.6), 4210 + i + 6)), 0, h / 2, 0)); g.add(box(8.1, 0.5, 8.2, C(shade(col, 0.55)), 0, h + 0.25, 0));
    for (let f = 1; f * 3 + 1 < h; f++) for (const wx of [-2.2, 0, 2.2]) g.add(box(1.0, 1.5, 0.1, ((i * 5 + f * 3 + wx * 7) & 3) ? M(T.window) : M(T.windowDark), wx, f * 3 + 0.4, 4.02, { cast: false }));
    g.add(box(6.6, 2.2, 0.1, ((i + 20) % 3) ? M(T.window) : M(T.windowDark), 0, 1.4, 4.02, { cast: false })); g.add(box(7.0, 0.3, 0.4, C(0x2a2420), 0, 2.7, 4.1)); }
  // Skyline
  const r = rng(4220); for (let i = 0; i < 26; i++) { const x = -110 + i * 9 + r() * 4, z = -26 - r() * 30, h = 22 + r() * 34, w = 7 + r() * 5, col = [0x6a5a50, 0x5a5a62, 0x7a6a5a, 0x4a4a52][i % 4];
    const bm = M(buildingTex(col, 0.35, 4230 + i)); bm.map.repeat.set(w / 8, h / 12); chicago.add(box(w, h, w, bm, x, h / 2, z)); if (i % 5 === 2) { chicago.add(box(w * 0.6, 6, w * 0.6, C(col), x, h + 3, z)); chicago.add(box(0.6, 5, 0.6, C(0x3a3a3a), x, h + 8.5, z)); } }
  for (let i = -6; i <= 6; i++) { const x = i * 8 + 4, h = 8 + ((i * 13 + 50) % 5); chicago.add(box(7.9, h, 8, M(tileTex(brickCols[(i + 15) % 5], 0x3a2a24, 4250 + i + 6)), x, h / 2, 17)); }
  // Waschsalon (Mitte)
  const ls = new THREE.Group(); ls.position.set(0, 0, -7); chicago.add(ls);
  ls.add(box(7.9, 10, 8, M(tileTex(0x7a4a3a, 0x4a2e24, 4260)), 0, 5, 0)); ls.add(box(8.1, 0.5, 8.2, C(0x3a2a24), 0, 10.25, 0));
  for (let f = 1; f < 3; f++) for (const wx of [-2.2, 0, 2.2]) ls.add(box(1.0, 1.5, 0.1, f === 1 && wx === 0 ? M(T.windowDark) : M(T.window), wx, f * 3 + 2.0, 4.02, { cast: false }));
  const winT = tex(64, 28, (c, r) => { noiseFill(c, r, 64, 28, 0xf2e2b0, 0.04); c.fillStyle = '#d8c89a'; c.fillRect(0, 20, 64, 8);
    for (let i = 0; i < 5; i++) { const x = 3 + i * 12; c.fillStyle = '#f4f4ee'; c.fillRect(x, 10, 10, 12); c.fillStyle = '#c8c8c0'; c.fillRect(x, 10, 10, 2); c.fillStyle = '#4a4a50'; c.fillRect(x + 2, 13, 6, 6); c.fillStyle = i % 2 ? '#5aa04a' : '#6ab85a'; c.fillRect(x + 3, 14, 4, 4); c.fillStyle = '#9ad08a'; c.fillRect(x + 3, 14 + (i % 3), 2, 1); }
    c.fillStyle = '#c8b480'; c.fillRect(0, 0, 64, 3); }, 4261);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.0), new THREE.MeshBasicMaterial({ map: winT, color: 0xe8d8b0 })); win.position.set(0, 1.45, 4.03); ls.add(win);
  const fr = C(0x2a3a2a); ls.add(box(4.9, 0.14, 0.14, fr, 0, 2.48, 4.06)); ls.add(box(4.9, 0.14, 0.14, fr, 0, 0.42, 4.06)); for (const x of [-2.38, 0, 2.38]) ls.add(box(0.14, 2.2, 0.14, fr, x, 1.45, 4.06));
  ls.add(box(5.0, 0.3, 0.3, fr, 0, 0.2, 4.1));
  ls.add(box(1.1, 2.2, 0.1, C(0x3a2416), 3.1, 1.1, 4.03, { cast: false })); ls.add(box(0.6, 0.8, 0.02, new THREE.MeshBasicMaterial({ color: 0xf0d090 }), 3.1, 1.65, 4.09, { cast: false }));
  for (let i = 0; i < 9; i++) { const aw = box(0.6, 0.08, 1.2, C(i % 2 ? 0xf2eee4 : 0x2a7a4a), -2.4 + i * 0.6, 2.95, 4.6); aw.rotation.x = 0.35; ls.add(aw); }
  const neon = textPlane(5.2, 1.1, 1024, (c, w, h) => { c.fillStyle = '#1a0e14'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff3a5a'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 128px Mont';
    c.fillStyle = '#ff4a6a'; c.fillText('WASCHSALON', w / 2, h / 2 + 6); c.fillStyle = '#ffd0d8'; c.font = '800 118px Mont'; c.fillText('WASCHSALON', w / 2, h / 2 + 6); });
  neon.position.set(0, 4.0, 4.12); ls.add(neon); ls.add(box(5.4, 1.3, 0.12, C(0x1a1a1e), 0, 4.0, 4.04));
  lamp(chicago, -3.9, 0.4); lamp(chicago, 5.0, 0.4, false); lamp(chicago, -12, 0.4, false); lamp(chicago, 12, 0.4, false); lamp(chicago, 22, 0.4, false); lamp(chicago, -22, 0.4, false);
  const car = oldCar(chicago, 4.6, 3.4, Math.PI); const car2 = oldCar(chicago, -18, 7.5, 0, 0x2a2a3a);
  const key = new THREE.PointLight(0xffd0a0, 10, 14, 1.2); key.position.set(0.4, 2.8, 4.5); chicago.add(key);
  const neonL = new THREE.PointLight(0xff5a7a, 4, 6, 1.5); neonL.position.set(0, 4.0, -1.6); chicago.add(neonL);
  const sun = sunLight(chicago, 0xffb070, 1.8, V(-60, 22, 30), V(0, 0, -2), 40); chicago.add(new THREE.HemisphereLight(0x8a9ad8, 0x4a3a3a, 1.25));
  // Prohibition (links): Fässer
  const bar = []; for (const [x, z] of [[-15.6, -2.2], [-14.9, -2.3], [-15.3, -1.5], [-15.25, -1.9]]) bar.push(barrel(chicago, x, x === -15.25 ? 0.86 : 0.16, z));
  const broken = barrel(chicago, -13.6, 0.16, -1.2); broken.rotation.z = Math.PI / 2; broken.position.y = 0.48; chicago.add(box(1.8, 0.02, 1.4, new THREE.MeshStandardMaterial({ color: 0x6a3a1a, roughness: 0.15, metalness: 0.1 }), -12.6, 0.17, -0.9, { cast: false }));
  // Schmuggel (rechts): Laster + Fässer
  const truck = new THREE.Group(); truck.position.set(19.5, 0, 4.2); chicago.add(truck); const tm = C(0x3a4a3a, { metal: 0.3, rough: 0.5 });
  truck.add(box(4.0, 0.3, 2.2, C(0x2a2a2a), 0, 0.9, 0)); truck.add(box(4.0, 0.9, 0.1, M(T.planks), 0, 1.5, 1.05)); truck.add(box(4.0, 0.9, 0.1, M(T.planks), 0, 1.5, -1.05)); truck.add(box(1.8, 1.8, 2.1, tm, 2.9, 1.5, 0)); truck.add(box(1.0, 0.6, 2.12, new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.15 }), 2.9, 1.9, 0, { cast: false }));
  for (const [wx, wz] of [[-1.3, 1.1], [1.0, 1.1], [3.0, 1.1], [-1.3, -1.1], [1.0, -1.1], [3.0, -1.1]]) truck.add(box(0.8, 0.8, 0.3, C(0x111111), wx, 0.4, wz));
  for (let i = 0; i < 5; i++) { const b = barrel(chicago, 0, 0, 0, 0.9); truck.add(b); b.position.set(-1.4 + (i % 3) * 0.75, 1.05, (i < 3 ? 0.4 : -0.4)); }
  const carryB = [0, 1].map(() => barrel(chicago, 0, 0, 0, 0.8));
  const capone = humanoid(CAPONE), book = humanoid(BOOK), cop = humanoid(COPOLD), gang = humanoid({ ...CAPONE, top: 0x4a3a2a, bottom: 0x4a3a2a, tie: 0x2a2a2a, smile: false, seed: 60 }), h1 = humanoid({ ...BOOK, top: 0x6a6a5a, bottom: 0x3a3a34, hair: 0x2a1a14, tie: undefined, seed: 61 }), h2 = humanoid({ ...BOOK, top: 0x5a4a3a, bottom: 0x3a3a34, hair: 0x6a4422, tie: undefined, hat: 'cap', seed: 62 });
  fedora(capone, 0x5a5a62, 0x1a1a1e); fedora(gang, 0x3a3226); glasses(book); const cig = cigar(capone); const fan = fanCash(capone); const led = inHand(book, ledger()); const bag = moneyBag(gang);
  const case1 = suitcase(true); case1.position.set(0.05, 0.16, 1.15); case1.rotation.y = 0.12; chicago.add(case1);
  chicago.add(capone, book, cop, gang, h1, h2);
  chicago.userData = { capone, book, cop, gang, h1, h2, carryB, fan, led, bag, case1, cig };
}

// =====================================================================
// SET 2: Innenräume (je Raum eigene Lichtposition)
// =====================================================================
const inside = new THREE.Scene(); inside.background = new THREE.Color(0x08070a);
const RX = { office: 0, court: 30, cell: 60, wash: 90, bank: 120, ermit: 150, notar: 180, vault: 210 };
{
  const wood = M(tex(16, 16, (c, r) => { for (let x = 0; x < 16; x++) { const b = x < 8 ? 0x5a3a22 : 0x4e321e; for (let y = 0; y < 16; y++) px(c, x, y, shade(b, 0.9 + r() * 0.2)); } for (let y = 0; y < 16; y++) { px(c, 7, y, 0x2e1d12); px(c, 15, y, 0x2e1d12); } }, 4301));
  const parquet = M(T.planks), tiles = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0xe8e4dc : 0xb8b4ac, 0.96 + r() * 0.08)); }, 4302));
  const greenWall = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x3a5a4a, 0.05); for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) if ((x + y) % 8 === 0) px(c, x, y, 0x5a7a5a); }, 4303));
  const modernWall = M(solidTex(0xe4e6ea, 0.03, 4304)), modFloor = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x8a8e94, 0.05), 4305)), concrete = M(T.concrete);
  const g = (k) => { const gr = new THREE.Group(); gr.position.x = RX[k]; inside.add(gr); return gr; };
  const room = (gr, w, d, h, wallM, floorM) => { gr.add(box(w, 0.2, d, floorM, 0, -0.1, 0, { cast: false })); gr.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2)); gr.add(box(0.3, h, d, wallM, -w / 2, h / 2, 0)); gr.add(box(0.3, h, d, wallM, w / 2, h / 2, 0)); gr.add(box(w, 0.2, d, wallM, 0, h + 0.1, 0, { cast: false })); };
  // Büro Capone
  const of = g('office'); room(of, 9, 8, 3.6, greenWall, parquet); of.add(box(9, 1.1, 0.12, wood, 0, 0.55, -3.8));
  of.add(box(2.6, 0.12, 1.2, C(0x4a2a1a), 0, 0.85, -1.2)); of.add(box(2.4, 0.8, 1.0, C(0x3a2214), 0, 0.4, -1.2)); of.add(box(0.7, 1.4, 0.7, C(0x6a1a1a), 0, 0.7, -2.7)); of.add(box(0.7, 0.2, 0.7, C(0x6a1a1a), 0, 0.5, -2.4));
  const pileO = cashPile(46, 4, 3, 4310, true); pileO.position.set(-0.55, 0.91, -1.2); of.add(pileO); const pileO2 = cashPile(24, 3, 2, 4311, true); pileO2.position.set(0.65, 0.91, -1.05); of.add(pileO2);
  of.add(box(0.2, 0.5, 0.2, C(0x2a5a3a), 1.05, 1.15, -1.55)); of.add(box(0.4, 0.2, 0.4, new THREE.MeshBasicMaterial({ color: 0xa8e8a0 }), 1.05, 1.45, -1.55, { cast: false }));
  of.add(box(1.6, 1.2, 0.1, M(T.windowDark), -2.6, 2.1, -3.82, { cast: false })); of.add(box(1.6, 1.2, 0.1, M(T.windowDark), 2.6, 2.1, -3.82, { cast: false }));
  of.add(box(1.2, 2.2, 0.6, wood, -3.8, 1.1, -3.2)); const safe = box(0.9, 1.0, 0.8, C(0x3a3a40, { metal: 0.6, rough: 0.4 }), 3.6, 0.5, -3.1); of.add(safe);
  of.add(box(0.6, 0.06, 0.6, C(0x3a2214), -1.7, 0.5, 0.2)); const chairO = box(0.6, 0.8, 0.08, C(0x3a2214), -1.7, 0.9, 0.48); of.add(chairO);
  // Gericht
  const co = g('court'); room(co, 10, 9, 4.6, wood, parquet); co.add(box(4.2, 1.6, 1.2, wood, 0, 0.8 + 0.3, -3.0)); co.add(box(4.4, 0.6, 2.0, C(0x3a2214), 0, 0.3, -3.2)); co.add(box(4.4, 0.1, 1.3, C(0x2a180e), 0, 1.95, -3.0));
  co.add(box(1.4, 2.6, 0.1, C(0x1a2a5a), -3.2, 2.8, -4.3)); for (let i = 0; i < 7; i++) co.add(box(0.8, 0.12, 0.11, C(i % 2 ? 0xf0f0f0 : 0xb8201a), 3.4, 3.8 - i * 0.24, -4.3, { cast: false })); co.add(box(0.6, 0.8, 0.12, C(0x1a2a5a), 3.0, 3.5, -4.28, { cast: false }));
  co.add(box(1.6, 0.9, 0.6, wood, -0.2, 0.45, 0.6)); co.add(box(3, 0.9, 0.12, wood, 0, 0.45, 2.3));
  // Zelle
  const ce = g('cell'); room(ce, 5, 4, 3.2, concrete, concrete); ce.add(box(1.8, 0.4, 0.8, C(0x5a5a5a), -1.3, 0.3, -1.4)); ce.add(box(1.7, 0.12, 0.7, C(0x8a8a7a), -1.3, 0.55, -1.4)); ce.add(box(0.5, 0.5, 0.1, C(0x2a3040), 1.2, 2.5, -1.92, { cast: false }));
  const barsM = C(0x2a2a2e, { metal: 0.7, rough: 0.35 }); for (let x = -2.3; x <= 2.3; x += 0.42) ce.add(box(0.08, 3.2, 0.08, barsM, x, 1.6, 1.9)); ce.add(box(5, 0.12, 0.12, barsM, 0, 2.9, 1.9)); ce.add(box(5, 0.12, 0.12, barsM, 0, 0.3, 1.9));
  // Waschsalon innen
  const wa = g('wash'); room(wa, 8, 6, 3.4, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe8dcc0, 0.04), 4320)), tiles); const washers = []; for (let i = 0; i < 6; i++) { const w = washer(-2.75 + i * 1.1, 0, -2.4); wa.add(w); washers.push(w); }
  wa.add(box(8, 0.06, 0.6, C(0x8a6a4a), 0, 1.05, -2.5));
  // Bank (modern)
  const ba = g('bank'); room(ba, 9, 8, 3.6, modernWall, modFloor); ba.add(box(5, 1.1, 0.8, C(0xd8dce2), 0, 0.55, -1.0)); ba.add(box(5.2, 0.08, 1.0, C(0x2a3a5a), 0, 1.14, -1.0)); ba.add(box(5, 0.9, 0.04, new THREE.MeshStandardMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.25, roughness: 0.05 }), 0, 1.63, -0.7, { cast: false }));
  const bscr = box(0.6, 0.4, 0.05, C(0x111114), 0.6, 1.45, -1.25); ba.add(bscr); const bscrM = new THREE.MeshBasicMaterial({ color: 0x9ad0ff }); const bs = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), bscrM); bs.position.set(0.6, 1.45, -1.222); bs.rotation.y = Math.PI; ba.add(bs);
  const logo = textPlane(3.4, 0.7, 512, (c, w, h) => { c.fillStyle = '#2a3a5a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.font = '800 64px Mont'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STADTSPARKASSE', w / 2, h / 2 + 3); }, false); logo.position.set(0, 2.7, -3.83); ba.add(logo);
  for (const x of [-3.6, 3.6]) { ba.add(box(0.5, 0.5, 0.5, C(0x7a5a3a), x, 0.25, -3.4)); ba.add(box(0.9, 1.4, 0.9, C(0x3a8a3a), x, 1.2, -3.4)); }
  // Ermittler-Büro
  const er = g('ermit'); room(er, 9, 8, 3.4, M(solidTex(0xc8ccd0, 0.03, 4330)), modFloor); er.add(box(4.2, 2.2, 0.08, C(0xb8905a), 0, 1.9, -3.8));
  const pins = [[-1.6, 2.6], [-0.5, 2.3], [0.7, 2.7], [1.6, 1.9], [-1.2, 1.3], [0.3, 1.4], [1.3, 2.9]]; pins.forEach(([x, y], i) => { er.add(box(0.5, 0.36, 0.02, C([0xf0f0e8, 0xf0e070, 0xf0f0e8, 0x9ad0ff][i % 4]), x, y, -3.74, { cast: false })); er.add(box(0.06, 0.06, 0.03, C(0xd02020), x, y + 0.14, -3.72, { cast: false })); });
  const lineM = C(0xd02020); [[0, 1], [1, 2], [2, 3], [3, 5], [5, 4], [4, 0], [1, 5], [2, 6], [6, 3]].forEach(([a, b]) => { const [x1, y1] = pins[a], [x2, y2] = pins[b]; const L = Math.hypot(x2 - x1, y2 - y1); const m = box(L, 0.025, 0.01, lineM, (x1 + x2) / 2, (y1 + y2) / 2 + 0.14, -3.71, { cast: false }); m.rotation.z = Math.atan2(y2 - y1, x2 - x1); er.add(m); });
  er.add(box(2.4, 0.08, 1.1, C(0x3a3a40), 2.2, 0.78, -1.0)); for (const x of [1.1, 3.3]) er.add(box(0.08, 0.78, 1.0, C(0x2a2a2e), x, 0.39, -1.0)); er.add(box(0.8, 0.5, 0.05, C(0x111114), 2.2, 1.15, -1.3)); const es = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.44), new THREE.MeshBasicMaterial({ color: 0x8ab8e8 })); es.position.set(2.2, 1.15, -1.27); er.add(es);
  // Notar
  const no = g('notar'); room(no, 9, 8, 3.4, M(T.wallpaperBeige), parquet); no.add(box(2.4, 0.1, 1.2, C(0x4a2e1a), 0, 0.8, -0.6)); no.add(box(2.2, 0.75, 1.0, C(0x3a2214), 0, 0.38, -0.6)); [-0.75, 0, 0.75].forEach(x => no.add(box(0.36, 0.02, 0.46, C(0xf4f0e8), x, 0.86, -0.4, { cast: false }))); no.add(box(0.1, 0.4, 0.6, C(0x6a4a2a), 0.0, 0.0, 0)); no.add(box(3, 2.2, 0.5, M(T.books), 0, 1.4, -3.6));
  const keys = new THREE.Group(); keys.add(box(0.06, 0.12, 0.02, C(0xd8b030, { metal: 0.7 }), 0, 0, 0)); keys.add(box(0.14, 0.04, 0.02, C(0xd8b030, { metal: 0.7 }), 0.08, -0.04, 0));
  // Tresor (Bruchteil)
  const vt = g('vault'); room(vt, 14, 10, 6, M(T.metal), concrete); const vpile = new THREE.Group(); vt.add(vpile); const r = rng(4340);
  const geo = new THREE.BoxGeometry(0.34, 0.09, 0.17); const inst = new THREE.InstancedMesh(geo, BILL, 2600); let k = 0; const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
  for (let layer = 0; layer < 26 && k < 2600; layer++) { const rad = 5.2 - layer * 0.2; for (let i = 0; i < 140 && k < 2600; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad; const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.7 - 1; q.setFromAxisAngle(V(0, 1, 0), r() * 3); mtx.compose(V(x, 0.05 + layer * 0.09 * (1 - d / rad * 0.6) * 1.0 + (1 - d / rad) * 0.0, z), q, sc); inst.setMatrixAt(k++, mtx); } }
  inst.count = k; inst.castShadow = inst.receiveShadow = true; vpile.add(inst);
  const found = cashPile(4, 2, 2, 4341); found.position.set(2.6, 0, 2.0); vt.add(found); const foundGlow = box(0.9, 0.02, 0.6, new THREE.MeshBasicMaterial({ color: 0xff3a3a }), 2.6, 0.01, 2.0, { cast: false }); vt.add(foundGlow);
  const sun = sunLight(inside, 0xffe8c8, 1.6, V(6, 8, 10), V(0, 0, -1), 9, 1024); inside.add(new THREE.HemisphereLight(0xfff0e0, 0x4a3a2a, 1.0));
  const pl = new THREE.PointLight(0xffd090, 7, 10, 1.3); inside.add(pl);
  const capone = humanoid(CAPONE), tax = humanoid({ skin: 0xe8b894, hair: 0x6a4a2a, top: 0x6a5a3a, bottom: 0x4a3a2a, tie: 0x2a2a2a, shoe: 0x2a1a10, eye: '#3a5a8a', seed: 70 }), judge = humanoid({ skin: 0xf0c8a8, hair: 0xe0e0e0, top: 0x141418, bottom: 0x141418, coat: true, shoe: 0x111111, seed: 71 }), guard = humanoid(COPOLD);
  fedora(capone, 0x5a5a62, 0x1a1a1e); fedora(tax, 0x5a4a32); glasses(tax); const capoC = humanoid({ ...CAPONE, top: 0x9a9a8a, bottom: 0x9a9a8a, tie: undefined, smile: false, coat: false, seed: 72 }); capoC.userData.setFace({ sad: true });
  const taxPaper = inHand(tax, paperMesh()); const gavel = new THREE.Group(); gavel.position.set(0, -0.68, 0.05); gavel.add(box(0.05, 0.05, 0.4, C(0x4a2a1a), 0, 0, 0.15)); gavel.add(box(0.12, 0.12, 0.24, C(0x3a2214), 0, 0, 0.36)); judge.userData.armR.add(gavel);
  const gangW = humanoid({ ...CAPONE, top: 0x4a3a2a, bottom: 0x4a3a2a, tie: 0x2a2a2a, smile: true, seed: 73 }); fedora(gangW, 0x3a3226);
  const max = humanoid(MAX), clerk = humanoid(CLERK), inv = humanoid(INV), inv2 = humanoid(INV2), notar = humanoid({ skin: 0xe8b894, hair: 0xb8b8b8, top: 0x4a4a52, bottom: 0x3a3a42, tie: 0x6a1a2a, shoe: 0x111111, seed: 74 }); chain(max); glasses(notar);
  const caseB = suitcase(true); inside.add(caseB); const maxPen = inHand(max, box(0.03, 0.03, 0.2, C(0x111111), 0, 0, 0.12)); const mag = new THREE.Group(); mag.position.set(0, -0.7, 0.08); mag.add(box(0.04, 0.04, 0.22, C(0x2a2a2a), 0, 0, 0.1)); mag.add(box(0.2, 0.2, 0.03, new THREE.MeshStandardMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.5, metalness: 0.4, roughness: 0.05 }), 0, 0, 0.28)); inv2.userData.armR.add(mag);
  inside.add(capone, tax, judge, guard, capoC, gangW, max, clerk, inv, inv2, notar);
  inside.userData = { sun, pl, capone, tax, judge, guard, capoC, gangW, max, clerk, inv, inv2, notar, taxPaper, gavel, washers, caseB, maxPen, bscrM, found, foundGlow, pileO, pileO2, chairO };
}

// =====================================================================
// SET 3: Heute – Stadt (Bank, Geldautomaten, Hinterhof, Villa)
// =====================================================================
const city = new THREE.Scene();
{
  skyDome(city, 0x3a72c8, 0x8ab8e8, 0xd8e8f2, V(-0.5, 0.45, 0.4)); city.fog = new THREE.Fog(0xd8e8f2, 90, 400); clouds(city, 5, 0xffffff, 60, 26, 220, 0.95);
  city.add(box(800, 1, 800, M(T.grass), 0, -0.5, 0, { cast: false }));
  city.add(box(240, 0.06, 8, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3a3a3e, 0.08), 4401)), 0, 0.03, 6, { cast: false, uvScale: 0.5 })); for (let x = -120; x < 120; x += 6) city.add(box(3, 0.02, 0.2, C(0xe8e8e8), x, 0.07, 6, { cast: false }));
  city.add(box(240, 0.14, 4, M(T.concrete), 0, 0.07, 0, { cast: false, uvScale: 0.5 }));
  // Bank mit Geldautomaten
  const bk = new THREE.Group(); bk.position.set(0, 0, -7); city.add(bk); const glass = new THREE.MeshStandardMaterial({ color: 0x5a7a9a, roughness: 0.1, metalness: 0.5 });
  bk.add(box(16, 12, 10, M(solidTex(0xe8e8ea, 0.03, 4410)), 0, 6, 0)); for (let f = 0; f < 3; f++) bk.add(box(15, 2.2, 0.1, glass, 0, 4.2 + f * 3, 5.02, { cast: false }));
  const bl = textPlane(6, 1.0, 768, (c, w, h) => { c.fillStyle = '#c8201a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '800 96px Mont'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STADTSPARKASSE', w / 2, h / 2 + 4); }, false); bl.position.set(0, 2.85, 5.08); bk.add(bl);
  const atms = []; for (let i = 0; i < 4; i++) { const x = -4.5 + i * 3; const a = new THREE.Group(); a.position.set(x, 0, 5.0); bk.add(a); a.add(box(1.2, 2.0, 0.3, C(0x5a5e66, { metal: 0.4, rough: 0.4 }), 0, 1.0, 0)); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ color: 0x6ab8ff })); s.position.set(0, 1.45, 0.16); a.add(s); a.add(box(0.7, 0.2, 0.1, C(0x2a2a2e), 0, 1.0, 0.18)); atms.push(a); }
  // Hochhäuser
  const r = rng(4420); for (let i = 0; i < 18; i++) { const x = -80 + i * 10 + r() * 3, z = -24 - r() * 30, h = 20 + r() * 40, w = 8 + r() * 4; const bm = M(buildingTex([0x8aa0b8, 0xb8c0c8, 0x6a7a8a][i % 3], 0.0, 4430 + i, 4, 6)); bm.map.repeat.set(w / 8, h / 10); if (Math.abs(x) > 10 || z < -30) city.add(box(w, h, w, bm, x, h / 2, z)); }
  // Hinterhof (Max) links
  const hw = M(T.graffiti); city.add(box(14, 6, 0.6, hw, -30, 3, -4, { uvScale: 0.25 })); city.add(box(0.6, 6, 8, M(T.brickGrey), -37, 3, 0)); city.add(box(1.4, 1.4, 1.4, C(0x2a5a3a), -33.5, 0.7, -3)); city.add(box(1.4, 1.4, 1.4, C(0x2a5a3a), -32, 0.7, -3)); city.add(box(1.6, 0.1, 1.6, C(0x1a3a2a), -32.8, 1.45, -3));
  const backTable = box(1.4, 0.08, 0.8, C(0x5a4a3a), -29.5, 0.9, -1.6); city.add(backTable); for (const [x, z] of [[-30.1, -1.9], [-28.9, -1.9], [-30.1, -1.3], [-28.9, -1.3]]) city.add(box(0.08, 0.9, 0.08, C(0x3a2a1a), x, 0.45, z));
  const caseC = suitcase(true); caseC.position.set(-29.5, 0.94, -1.6); caseC.rotation.y = 0.1; city.add(caseC);
  // Villa rechts
  const vi = new THREE.Group(); vi.position.set(42, 0, -9); city.add(vi); const white = M(solidTex(0xf4f2ee, 0.02, 4440));
  vi.add(box(14, 4, 9, white, 0, 2, 0)); vi.add(box(9, 3.6, 7, white, -2, 5.8, -0.5)); vi.add(box(14.4, 0.3, 9.4, C(0x3a3a3e), 0, 4.15, 0)); vi.add(box(9.4, 0.3, 7.4, C(0x3a3a3e), -2, 7.75, -0.5));
  vi.add(box(10, 3.0, 0.1, glass, -1, 1.7, 4.52, { cast: false })); vi.add(box(6, 2.6, 0.1, glass, -2, 5.8, 3.02, { cast: false })); vi.add(box(6, 0.1, 4, new THREE.MeshStandardMaterial({ color: 0x3ab8e8, roughness: 0.1 }), 3.5, 0.06, 7.0, { cast: false })); vi.add(box(6.6, 0.12, 4.6, C(0xe8e4dc), 3.5, 0.03, 7.0, { cast: false }));
  for (const [x, z] of [[-8, 5], [8.6, 3], [-9, -3]]) { vi.add(box(0.5, 3, 0.5, C(0x5a3a22), x, 1.5, z)); vi.add(box(2.4, 2.4, 2.4, C(0x3f7a32), x, 3.8, z)); }
  const sc = sportsCar(city, 38.5, 1.6, 0.15);
  const pcar = new THREE.Group(); pcar.position.set(47.5, 0, 5.2); pcar.rotation.y = Math.PI * 0.95; city.add(pcar); const pw = C(0xf0f0f0, { metal: 0.3, rough: 0.4 }), pb = C(0x1a3a8a, { metal: 0.3, rough: 0.4 });
  pcar.add(box(4.4, 0.7, 1.9, pw, 0, 0.75, 0)); pcar.add(box(4.42, 0.2, 1.92, pb, 0, 0.75, 0, { cast: false })); pcar.add(box(2.4, 0.7, 1.7, new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.1, metalness: 0.4 }), -0.2, 1.4, 0)); pcar.add(box(0.8, 0.14, 0.4, new THREE.MeshBasicMaterial({ color: 0x3a6aff }), -0.2, 1.83, 0, { cast: false }));
  for (const [wx, wz] of [[-1.4, 0.95], [1.4, 0.95], [-1.4, -0.95], [1.4, -0.95]]) pcar.add(box(0.7, 0.7, 0.26, C(0x111111), wx, 0.35, wz));
  sunLight(city, 0xfff0d8, 3.2, V(-45, 60, 50), V(10, 0, 0), 70); city.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const max = humanoid(MAX), maxC = humanoid({ ...MAX, top: 0xf4f4f4, bottom: 0x2a2e3a, hairVol: true, smile: true, seed: 80 }); chain(max); glasses(maxC); maxC.userData.head.children[maxC.userData.head.children.length - 1].visible = true; chain(maxC);
  const helpers = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xf0c4a2, 0xc89a72, 0xe8b894, 0x8a5a3a][i], hair: [0xc8a05a, 0x1a1a1a, 0x6a4422, 0x2a1a14][i], hairVol: i % 2 === 0, longHair: i === 3, top: [0x3a8a5a, 0xa83a3a, 0x3a5aa8, 0xe8b830][i], bottom: 0x2a3448, shoe: 0xf0f0f0, seed: 4450 + i }); city.add(p); return p; });
  const envs = helpers.map(h => inHand(h, box(0.24, 0.14, 0.03, C(0xe8e0c8), 0, 0, 0.12)));
  const cop1 = humanoid(COP), cop2 = humanoid({ ...COP, skin: 0xf0c4a2, hair: 0x8a5a2a, seed: 81 }), inv = humanoid(INV), stroh = humanoid(STROH); const card = inHand(stroh, box(0.2, 0.13, 0.02, C(0x2a6ad8), 0, 0, 0.12));
  city.add(max, maxC, cop1, cop2, inv, stroh);
  city.userData = { max, maxC, helpers, envs, cop1, cop2, inv, stroh, card, atms, caseC, sc };
}

// =====================================================================
// SET 4: Weltkarte aus Blöcken
// =====================================================================
const MAP = [
  '........................................',
  '......#####.......####..#########.......',
  '..##########.....##.##.############.....',
  '...##########...........##############..',
  '....#########....####..###############..',
  '.....#######.....#####.#############....',
  '......#####.....######..##########......',
  '.......###.......#######..#######.......',
  '........##......########...####.#.......',
  '.........##.....########....##...##.....',
  '.........####....######.......#..#......',
  '........######....#####..........#......',
  '........#######...####..................',
  '.........#####....###.........#####.....',
  '..........####....##.........#######....',
  '..........###.................#####.....',
  '..........##............................',
  '..........#.............................',
  '........................................',
  '........................................'];
const CS = 1.6, cell = (c, r, y = 0) => V((c - 19.5) * CS, y, (r - 9.5) * CS);
const world = new THREE.Scene();
const NODES = { de: [19.4, 3.4], cy: [22.6, 6.6], asia: [30, 5.5], isl: [13.6, 8.6], us: [9, 3.2], hk: [31.5, 8.2] };
{
  skyDome(world, 0x3a6ab8, 0x8ab0e0, 0xdce8f4, V(-0.4, 0.6, 0.4)); world.fog = new THREE.Fog(0xdce8f4, 120, 400);
  world.add(box(400, 1, 400, M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x2a6ab8, 0.06); for (let i = 0; i < 5; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x5a9ad8); }, 4501)), 0, -0.5, 0, { cast: false, uvScale: 0.6 }));
  const land = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x5f9a3c, 0.12); for (let x = 0; x < 16; x++) px(c, x, 0, 0x7ab84a); }, 4502)), sand = M(T.sand), rock = C(0x8a8a82), snow = C(0xf0f4f8);
  const r = rng(4503); const isLand = (c, rr) => MAP[rr] && MAP[rr][c] === '#';
  for (let rr = 0; rr < MAP.length; rr++) for (let c = 0; c < 40; c++) if (isLand(c, rr)) { const coast = !isLand(c + 1, rr) || !isLand(c - 1, rr) || !isLand(c, rr + 1) || !isLand(c, rr - 1); const h = coast ? 0.35 : 0.5 + r() * 0.5;
    const p = cell(c, rr); world.add(box(CS, h, CS, coast ? sand : (rr < 3 && r() < 0.5 ? snow : land), p.x, h / 2, p.z)); if (!coast && r() < 0.12) world.add(box(CS * 0.7, 1.0, CS * 0.7, rock, p.x, h + 0.5, p.z)); }
  // Insel mit Briefkasten
  const ip = cell(NODES.isl[0], NODES.isl[1]); world.add(box(3.2, 0.35, 2.6, sand, ip.x, 0.17, ip.z)); world.add(box(2.0, 0.45, 1.6, land, ip.x - 0.3, 0.22, ip.z - 0.2));
  for (let i = 0; i < 5; i++) world.add(box(0.22, 0.6, 0.22, C(0x7a5a3a), ip.x - 1.0 + Math.sin(i * 0.5) * 0.08, 0.5 + i * 0.55, ip.z - 0.6)); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; world.add(box(Math.abs(Math.cos(a)) * 1.4 + 0.3, 0.14, Math.abs(Math.sin(a)) * 1.4 + 0.3, C(0x3a8a32), ip.x - 1.0 + Math.cos(a) * 0.7, 3.2, ip.z - 0.6 + Math.sin(a) * 0.7)); }
  const mb = new THREE.Group(); mb.position.set(ip.x + 0.6, 0.35, ip.z + 0.2); world.add(mb); mb.add(box(0.1, 0.9, 0.1, C(0x5a5a5a), 0, 0.45, 0)); mb.add(box(0.5, 0.4, 0.7, C(0x2a5ad8, { metal: 0.3, rough: 0.5 }), 0, 1.1, 0)); mb.add(box(0.52, 0.06, 0.2, C(0x111111), 0, 1.18, 0.3, { cast: false })); mb.add(box(0.04, 0.3, 0.08, C(0xd82020), 0.27, 1.25, -0.1));
  // Firmen (Türmchen)
  const firms = {}; for (const [k, col] of [['cy', 0xe8e0d0], ['asia', 0xb8c8d8], ['hk', 0xd8d0e8], ['us', 0xc8d8c8], ['de', 0xe8d8c0]]) { const p = cell(...NODES[k]); const g = new THREE.Group(); g.position.set(p.x, 0.5, p.z); world.add(g); g.add(box(1.0, 2.2, 1.0, M(buildingTex(col, 0.0, 4510 + k.length, 2, 3)), 0, 1.1, 0)); g.add(box(1.1, 0.12, 1.1, C(0x5a5a62), 0, 2.26, 0)); firms[k] = g; }
  // Geldströme
  const flowM = new THREE.MeshBasicMaterial({ color: 0xffd23f }), traceM = new THREE.MeshBasicMaterial({ color: 0xff4a3a });
  const arc = (a, b, hgt) => t => { const p = cell(...a, 0).lerp(cell(...b, 0), t); p.y = 2.8 + Math.sin(t * Math.PI) * hgt; return p; };
  const ROUTE = [['de', 'cy'], ['cy', 'asia'], ['asia', 'hk'], ['hk', 'isl'], ['isl', 'us'], ['us', 'de']].map(([a, b]) => arc(NODES[a], NODES[b], 4 + Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]) * 0.35));
  const trail = []; ROUTE.forEach((f, k) => { const seg = []; for (let i = 0; i < 24; i++) { const p0 = f(i / 24), p1 = f((i + 1) / 24); const L = p0.distanceTo(p1); const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, L), flowM); m.position.copy(p0).lerp(p1, 0.5); m.lookAt(p1); m.castShadow = false; world.add(m); seg.push(m); } trail.push(seg); });
  const tangle = []; const rr2 = rng(4520); const keysN = Object.keys(NODES); for (let j = 0; j < 14; j++) { const a = NODES[keysN[Math.floor(rr2() * 6)]], b = [4 + rr2() * 30, 2 + rr2() * 13]; const f = arc(a, b, 2 + rr2() * 6); const seg = []; for (let i = 0; i < 16; i++) { const p0 = f(i / 16), p1 = f((i + 1) / 16); const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, p0.distanceTo(p1)), traceM); m.position.copy(p0).lerp(p1, 0.5); m.lookAt(p1); world.add(m); seg.push(m); } tangle.push(seg); }
  const coin = new THREE.Group(); for (let i = 0; i < 3; i++) coin.add(box(0.7, 0.18, 0.4, BILL, 0, i * 0.19, 0, { cast: false })); coin.add(box(0.16, 0.6, 0.42, BAND, 0, 0.2, 0, { cast: false })); world.add(coin);
  sunLight(world, 0xfff0d8, 3.0, V(-40, 60, 40), V(0, 0, 0), 40); world.add(new THREE.HemisphereLight(0xcfe2ff, 0x3a5a8a, 1.4));
  const inv = humanoid(INV2); inv.scale.setScalar(1.6); const mag = new THREE.Group(); mag.position.set(0, -0.7, 0.08); mag.add(box(0.04, 0.04, 0.22, C(0x2a2a2a), 0, 0, 0.1)); mag.add(box(0.22, 0.22, 0.03, new THREE.MeshStandardMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.5, metalness: 0.4, roughness: 0.05 }), 0, 0, 0.28)); inv.userData.armR.add(mag); world.add(inv);
  world.userData = { ROUTE, trail, tangle, coin, firms, mb, inv };
}

// =====================================================================
// SET 5: Sonnenuntergang mit Schild (Skyline)
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901); for (let i = 0; i < 16; i++) { const h = 14 + r() * 30; dusk.add(box(7 + r() * 4, h, 8, C([0x4a3a4a, 0x5a4a52, 0x3a3242][i % 3]), -70 + i * 9 + r() * 3, h / 2, -90 - r() * 20)); }
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  const pile = cashPile(10, 3, 2, 1902); pile.position.set(3.2, 0, 1.2); pile.rotation.y = -0.3; dusk.add(pile);
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('IWF, 1998', 72, 150, '#a3241c'); fit('BIS ZU 5 % DER WELTWIRTSCHAFT', 56, 290, '#3a2a1e'); fit('WERDEN JEDES JAHR GEWASCHEN', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 72.30; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'chicago'], [8, 'prohib'], [11, 'capone'], [20, 'rich'], [28, 'dirty'], [37, 'nobody'], [48, 'court'], [53, 'cell'], [59, 'laundro'], [70, 'legend'],
  [80, 'today'], [87, 'case'], [96, 'bank'], [107, 'smurf'], [117, 'place'], [121, 'world'], [129, 'firms'], [137, 'mailbox'], [145, 'trace'], 
  [156, 'back'], [163, 'forms'], [169, 'villa'], [176, 'legal'], [186, 'report'], [192, 'follow'], [199, 'sudden'], [207, 'de'], [214, 'mule'], [227, 'fraction'], [233, 'sign'], [244, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.05, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-5.2 + drift * 1.2, 8.2 + drift * 0.7, 10.0 + drift * 1.2), t1 = V(0.6 + drift * 0.6, 1.6, -6.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const reset = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const cuffed = (ch) => { const P = ch.userData; P.armL.rotation.set(0.55, 0, 0.25); P.armR.rotation.set(0.55, 0, -0.25); };

function render(frame) {
  if (!lazyDone) { lazy.forEach(f => f()); lazyDone = true; }
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = chicago, exp = 1.35; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Chicago ----------
  if (['hero', 'loop', 'chicago', 'prohib', 'capone', 'laundro'].includes(sh.id)) {
    scene = chicago; const Q = chicago.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    const { capone, book, cop, gang, h1, h2 } = Q; reset([capone, book, cop, gang, h1, h2]); Q.carryB.forEach(b => b.visible = false); Q.fan.visible = Q.cig.visible = true;
    // Hook-Paar steht immer vor dem Waschsalon
    put(capone, HX, 0.16, HZ, 0.5); put(book, HX2, 0.16, HZ, -0.5); pose3(capone, 'idle', ta, 0); pose3(book, 'idle', ta, 1);
    capone.userData.armR.rotation.x = -1.05 + Math.sin(ta * 1.3) * 0.04; capone.userData.armR.rotation.z = 0.2; capone.userData.head.rotation.y = 0.25; book.userData.armR.rotation.x = -0.95; book.userData.armL.rotation.x = -0.7; book.userData.head.rotation.y = -0.25;
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'chicago') { heroCam(ta); if (sh.id !== 'chicago') { tag(capone, 'Al Capone', BAD); tag(book, 'Buchhalter', ALLY); } }
    if (sh.id === 'chicago') { mv(u, V(-34, 30, 44), V(-30, 27.5, 40), V(2, 6, -14), V(4, 6, -14), 46); info(wt(4), 'Chicago, 1920er'); }
    if (sh.id === 'prohib') { put(cop, -13.3, 0.16, -0.5, 0.55); pose3(cop, 'point', t); cop.userData.armR.rotation.y = -0.6; cop.userData.setFace({ angry: true });
      mv(u, V(-10.6, 1.95, 4.4), V(-11.0, 1.9, 3.7), V(-14.3, 1.05, -1.3), V(-14.3, 1.05, -1.3), 46); tag(cop, 'Polizei', ALLY); eff(wt(10), 'Alkoholverbot', '1920 – 1933', BAD); }
    if (sh.id === 'capone') { put(capone, 16.2, 0.16, -0.4, 0.7); pose3(capone, 'point', t); capone.userData.armR.rotation.y = 0.5; Q.fan.visible = false;
      [h1, h2].forEach((h, j) => { const k = ((t - sh.a) * 0.32 + j * 0.5) % 1; const a = V(14.4, 0.16, -2.2), b = V(18.0, 0.16, 2.6); const p = a.clone().lerp(b, k); put(h, p.x, p.y, p.z, Math.atan2(b.x - a.x, b.z - a.z)); pose(h, 'carry', t, j); const br = Q.carryB[j]; br.visible = true; br.position.copy(h.localToWorld(V(0, 0.95, 0.42))); br.rotation.y = h.rotation.y; });
      mv(u, V(12.6, 2.0, 7.0), V(13.0, 1.95, 6.2), V(16.6, 1.2, 0.4), V(16.6, 1.2, 0.4), 46); tag(capone, 'Al Capone', BAD); tag(h1, 'Schmuggler', GREY); }
    if (sh.id === 'laundro') { const k = smoother((t - sh.a) / (sh.b - sh.a) * 1.1); put(gang, lerp(6.6, 3.2, k), 0.16, lerp(0.6, -1.9, k), Math.atan2(-3.4, -2.5)); pose(gang, k < 0.99 ? 'walk' : 'idle', t);
      gang.userData.armR.rotation.x = -0.25; capone.visible = book.visible = false;
      mv(u, V(7.4, 1.9, 5.6), V(7.0, 1.85, 4.9), V(3.0, 1.6, -2.4), V(3.0, 1.6, -2.4), 48); tag(gang, 'Gangster', BAD); }
  }
  // ---------- Innenräume ----------
  if (['rich', 'dirty', 'nobody', 'fail', 'court', 'cell', 'legend', 'bank', 'forms', 'legal', 'report', 'follow', 'fraction'].includes(sh.id)) {
    scene = inside; const I = inside.userData; const { capone, tax, judge, guard, capoC, gangW, max, clerk, inv, inv2, notar } = I;
    reset([capone, tax, judge, guard, capoC, gangW, max, clerk, inv, inv2, notar]); I.caseB.visible = false; I.foundGlow.visible = false; I.bscrM.color.set(0x9ad0ff);
    const room = { rich: 'office', dirty: 'office', nobody: 'office', fail: 'office', court: 'court', cell: 'cell', legend: 'wash', bank: 'bank', report: 'bank', forms: 'notar', legal: 'notar', follow: 'ermit', fraction: 'vault' }[sh.id];
    const X = RX[room]; I.sun.position.set(X + 6, 8, 10); I.sun.target.position.set(X, 0, -1); I.sun.target.updateMatrixWorld(); I.pl.position.set(X + 0.5, 2.9, 0.8);
    I.washers.forEach((w, i) => w.userData.inner.rotation.z = t * 5 + i);
    if (sh.id === 'rich') { put(capone, 0, 0, -2.05, 0); pose(capone, 'count', t);
      mv(u, V(1.3, 1.95, 3.2), V(1.0, 1.85, 2.4), V(0, 1.25, -1.6), V(0, 1.25, -1.6), 46); tag(capone, 'Al Capone', BAD); toast(wt(24), 'Fortschritt erzielt!', 'Millionär', 'cash'); }
    if (sh.id === 'dirty') { put(capone, 0.1, 0, -2.05, 0); pose(capone, 'count', t); mv(u, V(-0.1, 1.55, 0.7), V(-0.25, 1.45, 0.15), V(-0.45, 0.95, -1.25), V(-0.45, 0.95, -1.25), 48);
      tip(wt(36), 'cash', 'Schmutziges Geld', '#ff5555', [gray('Herkunft: Alkoholschmuggel'), red('Woher? Nicht erklärbar')]); }
    if (sh.id === 'nobody' || sh.id === 'fail') { put(capone, -1.15, 0, 0.0, 0.75); put(tax, 1.3, 0, 0.45, -0.8); pose3(capone, sh.id === 'fail' ? 'idle' : 'cross', t); pose3(tax, 'idle', t, 1); tax.userData.armR.rotation.x = -1.2;
      if (sh.id === 'nobody') { if (t >= wt(43)) { capone.userData.setFace({ sad: true }); capone.userData.head.rotation.x = 0.15; } mv(u, V(0.25, 1.85, 4.6), V(0.15, 1.8, 3.9), V(0, 1.3, 0), V(0, 1.3, 0), 46); tag(capone, 'Al Capone', BAD); tag(tax, 'Steuerbehörde', ALLY); say(wt(38), 'Steuerbehörde', ALLY, 'Woher kommt Ihr Geld?'); }
      else { capone.userData.setFace({ sad: true }); capone.userData.head.rotation.x = 0.15; mv(u, V(-0.35, 1.8, 1.75), V(-0.45, 1.78, 1.45), V(-1.15, 1.62, 0), V(-1.15, 1.62, 0), 46); tag(capone, 'Al Capone', BAD); } }
    if (sh.id === 'court') { put(judge, X + 0.0, 0.6, -3.75, 0.25); pose(judge, 'hammer', t); put(capone, X - 0.6, 0, 0.3, 2.45); pose3(capone, 'idle', t); capone.userData.setFace({ sad: true });
      put(guard, X + 1.6, 0, 0.9, -2.6); pose3(guard, 'cross', t, 2);
      mv(u, V(X + 3.9, 1.95, 2.0), V(X + 3.5, 1.9, 1.5), V(X - 0.4, 1.7, -1.6), V(X - 0.4, 1.7, -1.6), 48); tag(judge, 'Richter', WHITE); tag(capone, 'Al Capone', BAD); info(wt(48), 'Urteil, Oktober 1931'); }
    if (sh.id === 'cell') { put(capoC, X + 0.25, 0, 0.7, -0.1); pose3(capoC, 'sadidle', t); capoC.userData.setFace({ sad: true });
      mv(u, V(X + 0.9, 1.72, 4.2), V(X + 0.7, 1.7, 3.5), V(X + 0.2, 1.45, 0.6), V(X + 0.2, 1.45, 0.6), 46); tag(capoC, 'Al Capone', BAD);
      tip(wt(58), 'x', 'Steuerhinterziehung', '#ff5555', [gray('Urteil: 11 Jahre Haft'), gray('Nicht für Mord, nicht für Alkohol')]); }
    if (sh.id === 'legend') { put(gangW, X + 1.6, 0, -1.2, -0.6); pose3(gangW, 'laugh', t); gangW.userData.armR.rotation.x = -1.1;
      mv(u, V(X - 0.3, 1.35, 1.1), V(X - 0.5, 1.28, 0.55), V(X - 0.9, 0.7, -2.0), V(X - 0.9, 0.7, -2.0), 48); tag(gangW, 'Gangster', BAD);
      chat(wt(73), `<span style="color:#ffaa00">[Mythos]</span> ${gray('Waschsalon-Geschichte: nicht belegt')}`);
      tip(wt(79), 'wash', 'Geldwäsche', '#55ff55', [gray('Illegales Geld wird so'), green('scheinbar legal')]); }
    if (sh.id === 'bank' || sh.id === 'report') { put(clerk, X + 0.45, 0, -1.8, -0.15); pose2(clerk, sh.id === 'report' ? 'type' : 'idle', t);
      if (sh.id === 'bank') { put(max, X - 0.7, 0, 0.35, 2.25); pose3(max, 'give', t); I.caseB.visible = true; I.caseB.position.set(X - 0.55, 1.18, -0.9); I.caseB.rotation.y = 0.2; if (t >= wt(102)) clerk.userData.setFace({ angry: true });
        mv(u, V(X + 2.9, 1.85, 2.9), V(X + 2.6, 1.8, 2.4), V(X - 0.1, 1.35, -0.8), V(X - 0.1, 1.35, -0.8), 48); tag(max, 'Max', BAD); tag(clerk, 'Bank', ALLY); say(wt(102), 'Bank', ALLY, 'Woher stammt das Geld?'); }
      else { if (t >= wt(189)) I.bscrM.color.set(Math.floor(t * 4) % 2 ? 0xff3a3a : 0xff8a8a);
        mv(u, V(X + 1.9, 1.75, 1.3), V(X + 1.7, 1.7, 0.8), V(X + 0.5, 1.35, -1.6), V(X + 0.5, 1.35, -1.6), 46); tag(clerk, 'Bank', ALLY); toast(wt(191), 'Verdachtsmeldung', 'an die Behörden', 'alert'); } }
    if (sh.id === 'forms') { put(max, X, 0, -1.75, 0); pose3(max, 'idle', t); max.userData.setFace({ smile: true }); max.userData.armR.rotation.x = -0.8; max.userData.armL.rotation.x = -0.8;
      mv(u, V(X + 0.4, 2.3, 2.6), V(X + 0.3, 2.2, 2.0), V(X, 0.95, -0.6), V(X, 0.95, -0.6), 46); tag(max, 'Max', BAD);
      [[164, 'Gehalt', -0.75], [166, 'Kredit', 0], [168, 'Gewinn', 0.75]].forEach(([w, s, x]) => { if (t >= wt(w)) ui.tags.push([V(X + x, 1.05, -0.4), s, '#55ff55']); }); }
    if (sh.id === 'legal') { put(notar, X - 0.1, 0, -1.75, 0.15); pose3(notar, 'idle', t, 1); put(max, X + 0.95, 0, 0.35, -1.95); pose3(max, 'write', t); max.userData.setFace({ smile: true });
      mv(u, V(X - 2.3, 1.85, 2.7), V(X - 2.0, 1.8, 2.2), V(X + 0.3, 1.2, -0.6), V(X + 0.3, 1.2, -0.6), 46); tag(max, 'Max', BAD); tag(notar, 'Notar', ALLY); eff(wt(180), 'Kaufvertrag', 'alles legal', '#55ff55');
      tip(wt(185), 'n3', 'Schritt 3: Integration', '#ffff55', [gray('Geld steckt in Haus und Auto'), green('und wirkt legal')]); }
    if (sh.id === 'follow') { put(inv, X - 1.3, 0, -2.3, 0.45); pose3(inv, 'point', t); inv.userData.armR.rotation.y = 0.9; put(inv2, X + 1.0, 0, -1.8, -0.5); pose3(inv2, 'idle', t, 1); inv2.userData.armR.rotation.x = -1.2;
      mv(u, V(X + 0.5, 1.85, 3.2), V(X + 0.4, 1.8, 2.5), V(X - 0.1, 1.65, -2.4), V(X - 0.1, 1.65, -2.4), 48); tag(inv, 'Ermittlerin', ALLY); tag(inv2, 'Ermittler', ALLY); }
    if (sh.id === 'fraction') { I.foundGlow.visible = t >= wt(231); mv(u, V(X - 1.0, 6.2, 9.6), V(X - 0.6, 5.6, 8.4), V(X, 1.0, -0.6), V(X + 0.4, 0.9, -0.4), 46);
      if (t >= wt(231)) ui.tags.push([V(X + 2.6, 0.7, 2.0), 'entdeckt', BAD]); info(wt(231), 'Sichergestellt: unter 1 %'); }
  }
  // ---------- Heute: Stadt ----------
  if (['today', 'max', 'case', 'smurf', 'place', 'back', 'villa', 'integ', 'sudden', 'de', 'mule'].includes(sh.id)) {
    scene = city; exp = 1.25; const Cy = city.userData; const { max, maxC, cop1, cop2, inv, stroh } = Cy; reset([max, maxC, cop1, cop2, inv, stroh, ...Cy.helpers]); Cy.envs.forEach(e => e.visible = true); Cy.card.visible = true;
    if (sh.id === 'today') { Cy.helpers.forEach((h, i) => { put(h, -6 + i * 3.5 + (t - sh.a) * 0.8 * (i % 2 ? 1 : -1), 0.14, 0.3 + (i % 2) * 0.8, i % 2 ? Math.PI / 2 : -Math.PI / 2); pose(h, 'walk', t, i); Cy.envs[i].visible = false; });
      mv(u, V(-14, 14, 30), V(-11, 12.5, 27), V(6, 4, -8), V(6, 4, -8), 46); info(wt(80), 'Heute'); }
    if (sh.id === 'max') { put(max, -31, 0, -1.6, 0.45); pose3(max, 'cross', t); mv(u, V(-29.0, 1.85, 2.6), V(-29.3, 1.8, 1.9), V(-30.8, 1.4, -1.6), V(-30.8, 1.4, -1.6), 46); tag(max, 'Max (Dealer)', BAD); }
    if (sh.id === 'case') { put(max, -29.55, 0, -2.6, 0.05); pose(max, 'count', t); mv(u, V(-28.9, 1.75, 0.7), V(-29.1, 1.6, 0.2), V(-29.55, 1.0, -1.7), V(-29.55, 1.0, -1.7), 46); tag(max, 'Max (Dealer)', BAD); }
    if (sh.id === 'smurf' || sh.id === 'place') { Cy.helpers.forEach((h, i) => { put(h, -4.5 + i * 3 + 0.45, 0.14, -1.25, 1.0); pose3(h, 'give', t, i); });
      if (sh.id === 'smurf') { mv(u, V(7.6, 1.95, 1.6), V(7.0, 1.9, 1.2), V(-1.8, 1.3, -1.6), V(-1.8, 1.3, -1.6), 46); Cy.helpers.forEach(h => tag(h, 'Helfer', GREY));
        [[111, '900 €', 'Konto 1'], [113, '850 €', 'Konto 2'], [115, '950 €', 'Konto 3']].forEach(([w, a, k]) => chat(wt(w), `${green('+ ' + a)} ${gray('→ ' + k)}`)); }
      else { mv(u, V(-2.2, 1.75, 1.4), V(-2.5, 1.7, 0.9), V(-4.1, 1.35, -1.4), V(-4.1, 1.35, -1.4), 46); tag(Cy.helpers[0], 'Helfer', GREY);
        tip(wt(120), 'n1', 'Schritt 1: Platzierung', '#ffff55', [gray('Bargeld kommt aufs Konto'), gray('in kleinen Beträgen')]); } }
    if (sh.id === 'back') { put(maxC, -0.4, 0.14, 1.0, 0.25); pose3(maxC, 'cheer', t); maxC.userData.setFace({ smile: true });
      mv(u, V(1.5, 1.85, 5.0), V(1.3, 1.8, 4.3), V(-0.4, 1.4, 1.0), V(-0.4, 1.4, 1.0), 46); tag(maxC, 'Max', BAD); eff(wt(162), 'Sauberes Geld', 'scheinbar legal', '#55ff55'); }
    if (sh.id === 'villa' || sh.id === 'integ') { put(maxC, 40.6, 0, 2.7, -0.75); pose3(maxC, 'pose', t); maxC.userData.setFace({ smile: true });
      if (sh.id === 'villa') { mv(u, V(34, 2.2, 9.2), V(34.6, 2.1, 8.3), V(40.2, 1.5, -0.8), V(40.2, 1.5, -0.8), 48); tag(maxC, 'Max', BAD); }
      else { mv(u, V(30, 11, 17), V(31, 10.2, 15.4), V(42, 1.5, -3), V(42, 1.5, -3), 46); tip(wt(185), 'n3', 'Schritt 3: Integration', '#ffff55', [gray('Geld steckt in Haus und Auto'), green('und wirkt legal')]); } }
    if (sh.id === 'sudden') { put(inv, 35.8, 0, 5.0, 0.2); pose3(inv, 'idle', t); inv.userData.armR.rotation.x = -1.2; inv.userData.head.rotation.y = 0.5; put(maxC, 42.8, 0, -3.2, -0.3); pose3(maxC, 'idle', t, 2);
      mv(u, V(31.6, 1.95, 8.6), V(31.9, 1.9, 7.8), V(38, 1.5, 1.2), V(38, 1.5, 1.2), 46); tag(inv, 'Ermittlerin', ALLY); tag(maxC, 'Max', BAD);
      say(wt(203), 'Ermittlerin', ALLY, 'Einkommen: 0 €. Villa?'); eff(wt(205), 'Verdächtig', 'fällt auf', BAD); }
    if (sh.id === 'de') { put(max, 44.4, 0, 4.4, 0.25); pose3(max, 'idle', t); cuffed(max); max.userData.setFace({ angry: true }); put(cop1, 43.3, 0, 4.2, 0.55); pose3(cop1, 'idle', t, 1); cop1.userData.armR.rotation.x = -0.9; put(cop2, 45.5, 0, 3.9, -0.35); pose3(cop2, 'cross', t, 2);
      mv(u, V(43.6, 1.9, 10.6), V(43.8, 1.85, 9.7), V(44.4, 1.3, 4.2), V(44.4, 1.3, 4.2), 46); tag(max, 'Max', BAD); tag(cop1, 'Polizei', ALLY); info(wt(208), 'Deutschland: strafbar seit 1992'); }
    if (sh.id === 'mule') { put(stroh, 1.6, 0.14, -0.9, 0.85); pose3(stroh, 'give', t); stroh.userData.setFace({ sad: t >= wt(223) }); put(max, 3.1, 0.14, -0.5, -1.15); pose3(max, 'idle', t, 1); max.userData.armR.rotation.x = -1.0;
      mv(u, V(0.9, 1.8, 3.5), V(1.1, 1.75, 2.9), V(2.3, 1.35, -0.8), V(2.3, 1.35, -0.8), 46); tag(stroh, 'Strohmann', GREY); tag(max, 'Max', BAD);
      tip(wt(219), 'card', 'Strohmann', '#aaaaaa', [gray('Leiht sein Konto für fremdes Geld'), red('Strafe: bis zu 5 Jahre Haft')]); }
  }
  // ---------- Weltkarte ----------
  if (['world', 'firms', 'mailbox', 'trace', 'layer'].includes(sh.id)) {
    scene = world; exp = 1.2; const Wd = world.userData; const P = clamp01((t - wt(124)) / (wt(150) - wt(124))) * 5; // Route 0..4 (de → … → us)
    Wd.trail.forEach((seg, k) => seg.forEach((m, i) => m.visible = k < 5 && (k + (i + 1) / seg.length) <= P + 0.001));
    const showT = sh.id === 'trace' || sh.id === 'layer'; Wd.tangle.forEach((seg, j) => seg.forEach((m, i) => m.visible = showT && (t - sh.a) * 6 > j + i / seg.length));
    const k = Math.min(4, Math.floor(P)), f = P - k; Wd.coin.visible = P > 0 && P < 5; if (Wd.coin.visible) { Wd.coin.position.copy(Wd.ROUTE[k](f)); Wd.coin.rotation.y = t * 3; }
    Wd.inv.visible = sh.id === 'trace'; if (Wd.inv.visible) { put(Wd.inv, -3.0, 0, 7.4, 0.2); pose3(Wd.inv, 'idle', t); Wd.inv.userData.armR.rotation.x = -1.3 + Math.sin(t * 3) * 0.1; Wd.inv.userData.head.rotation.y = Math.sin(t * 2.4) * 0.4; Wd.inv.userData.setFace({ sad: true }); }
    if (sh.id === 'world') mv(u, V(-8, 40, 42), V(-6, 36, 37), V(2, 0, -2), V(2, 0, -2), 46);
    if (sh.id === 'firms') { mv(u, V(4, 13, 12), V(5.5, 12, 10.5), V(11, 1, -5), V(12, 1, -5), 46);
      [['cy', 'Ltd.'], ['asia', 'Holding'], ['hk', 'Trust']].forEach(([n, s]) => ui.tags.push([Wd.firms[n].position.clone().add(V(0, 3.2, 0)), s, WHITE])); }
    if (sh.id === 'mailbox') { const m = Wd.mb.position; mv(u, V(m.x + 2.6, 2.7, m.z + 3.8), V(m.x + 2.1, 2.45, m.z + 3.0), V(m.x - 0.2, 1.2, m.z), V(m.x - 0.2, 1.2, m.z), 46); ui.tags.push([m.clone().add(V(0, 1.75, 0)), 'Firmensitz', WHITE]);
      tip(wt(141), 'mail', 'Briefkastenfirma', '#ffaa00', [gray('Kein Büro, keine Mitarbeiter'), gray('nur eine Adresse')]); }
    if (sh.id === 'trace') { mv(u, V(2.4, 6.4, 19), V(2.0, 6.1, 17.6), V(-3, 2.6, 3), V(-3, 2.6, 3), 48); tag(Wd.inv, 'Ermittler', ALLY, 1.2); chat(wt(150), red('Spur verloren')); tip(wt(155), 'n2', 'Schritt 2: Verschleierung', '#ffff55', [gray('Geld fließt durch viele'), gray('Firmen und Länder')]); }
    if (sh.id === 'layer') { mv(u, V(0, 31, 27), V(0, 29, 24), V(0, 0, -3), V(0, 0, -3), 46); tip(wt(155), 'n2', 'Schritt 2: Verschleierung', '#ffff55', [gray('Geld fließt durch viele'), gray('Firmen und Länder')]); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const num = (n, col) => { const D = { 1: ['01100', '00100', '00100', '00100', '01110'], 2: ['01110', '00010', '01110', '01000', '01110'], 3: ['01110', '00010', '00110', '00010', '01110'] }[n]; return D.map((row, y) => [...row].map((c, x) => c === '1' ? `<rect x="${x + 1.5}" y="${y + 1.5}" width="1" height="1" fill="${col}"/>` : '').join('')).join(''); };
const ICONS = {
  cash: '<rect x="0" y="2" width="8" height="4" fill="#5aa04a"/><rect x="1" y="3" width="6" height="2" fill="#7ac06a"/><rect x="3" y="3" width="2" height="2" fill="#3a7a2a"/><rect x="3" y="2" width="1" height="4" fill="#f2eee0"/>',
  wash: '<rect x="1" y="0" width="6" height="8" fill="#e8e8e2"/><rect x="1" y="0" width="6" height="2" fill="#b8b8b4"/><rect x="2" y="3" width="4" height="4" fill="#3a3a40"/><rect x="3" y="4" width="2" height="2" fill="#5aa04a"/>',
  x: '<rect x="1" y="1" width="2" height="2" fill="#ff5555"/><rect x="5" y="1" width="2" height="2" fill="#ff5555"/><rect x="3" y="3" width="2" height="2" fill="#ff5555"/><rect x="1" y="5" width="2" height="2" fill="#ff5555"/><rect x="5" y="5" width="2" height="2" fill="#ff5555"/>',
  mail: '<rect x="3" y="4" width="1" height="4" fill="#5a5a5a"/><rect x="1" y="1" width="6" height="3" fill="#2a5ad8"/><rect x="2" y="2" width="3" height="1" fill="#111"/><rect x="6" y="0" width="1" height="2" fill="#d82020"/>',
  alert: '<rect x="3" y="0" width="2" height="1" fill="#ffd23f"/><rect x="2" y="1" width="4" height="2" fill="#ffd23f"/><rect x="1" y="3" width="6" height="2" fill="#ffd23f"/><rect x="0" y="5" width="8" height="2" fill="#ffd23f"/><rect x="3.5" y="2" width="1" height="3" fill="#111"/><rect x="3.5" y="5.5" width="1" height="1" fill="#111"/>',
  card: '<rect x="0" y="2" width="8" height="5" fill="#2a6ad8"/><rect x="0" y="3" width="8" height="1" fill="#111"/><rect x="1" y="5" width="2" height="1" fill="#f0c030"/>',
  n1: '<rect x="0" y="0" width="8" height="8" fill="#3a3a10"/>' + num(1, '#ffff55'), n2: '<rect x="0" y="0" width="8" height="8" fill="#3a3a10"/>' + num(2, '#ffff55'), n3: '<rect x="0" y="0" width="8" height="8" fill="#3a3a10"/>' + num(3, '#ffff55'),
};
const NUM = { 'hundert': '100', 'Neunzehnhunderteinunddreißig': '1931', 'neunzehnhundertzweiundneunzig': '1992', 'fünf': '5', 'drei': '3' };
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; if (NUM[txt]) txt = NUM[txt];
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.slice(-5).join('<br>');
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#2a2a2a"/><rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/></svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div><div style="color:#aaaaaa">${ui.eff.time}</div></div></div>`;
  if (ui.toast) ex += `<div class="toast" style="opacity:${ui.toast.o};transform:translateY(${ui.toast.y}px)"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.toast.icon]}</svg><div><div class="t1">${ui.toast.l1}</div><div class="t2">${ui.toast.l2}</div></div></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
window.SHOTS = SHOTS;
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
