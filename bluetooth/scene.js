// „Bluetooth, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
    if (o.beard === 'viking') { c.fillRect(1, 5, 2, 1); c.fillRect(5, 5, 2, 1); c.fillRect(0, 4, 1, 4); c.fillRect(7, 4, 1, 4); c.fillRect(1, 7, 2, 1); c.fillRect(5, 7, 2, 1); c.fillRect(3, 7, 2, 1); }
    if (o.tooth) { c.fillStyle = '#5a2a24'; c.fillRect(2, 6, 4, 1); c.fillStyle = '#f4f0e4'; c.fillRect(3, 6, 1, 1); c.fillStyle = '#2a3c9a'; c.fillRect(4, 6, 1, 1); }
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
  if (o.beard === 'viking') { head.add(box(0.4, 0.2, 0.12, bc, 0, -0.08, 0.2)); head.add(box(0.12, 0.16, 0.1, bc, -0.1, -0.24, 0.21)); head.add(box(0.12, 0.16, 0.1, bc, 0.1, -0.24, 0.21)); }
  if (o.glasses) { const gm = C(0x18181c); head.add(box(0.46, 0.035, 0.02, gm, 0, 0.265, 0.262, { cast: false })); for (const x of [-0.12, 0.12]) { head.add(box(0.16, 0.025, 0.02, gm, x, 0.165, 0.262, { cast: false })); head.add(box(0.025, 0.1, 0.02, gm, x - 0.08, 0.215, 0.262, { cast: false })); head.add(box(0.025, 0.1, 0.02, gm, x + 0.08, 0.215, 0.262, { cast: false })); } }
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


// ---------- Figuren ----------
const HARALD = { skin: 0xeab896, hair: 0xd08a3a, hairVol: true, beard: 'viking', beardCol: 0xc0702a, top: 0x9a2a22, bottom: 0x5a4632, belt: 0x3a2616, shoe: 0x3a2616, eye: '#3a6a9a', smile: true, tooth: true, seed: 51 };
const KARDACH = { skin: 0xe2aa84, hair: 0x5a3a22, hairVol: true, glasses: true, top: 0x2a72c8, bottom: 0xb8a478, shoe: 0x3a2a1a, eye: '#3a5a2a', smile: true, seed: 52 };
const ENG1 = { skin: 0xf2c8a8, hair: 0xe0c070, hairVol: true, beard: 'short', beardCol: 0xc8a050, top: 0x3e4c5c, bottom: 0x2a3448, shoe: 0x2a2a2a, eye: '#4a6a9a', seed: 53 };
const ENG2 = { skin: 0xe8b894, hair: 0x6a4422, longHair: true, glasses: true, top: 0x8a3a4a, bottom: 0x2a3448, shoe: 0x2a2a2a, eye: '#3a2a1a', seed: 54 };
const NOKIA = { skin: 0xf0c8a6, hair: 0x2a1e16, top: 0x1c2e78, bottom: 0x2a2a30, tie: 0x8a9ab8, shoe: 0x1a1a1a, eye: '#3a5a8a', seed: 55 };
const LENA = { skin: 0xd8a07a, hair: 0x2a1a14, longHair: true, top: 0x6a3ab8, bottom: 0x2a3448, shoe: 0xf0f0f0, eye: '#3a2a1a', smile: true, seed: 56 };
function cape(ch, col) { ch.userData.body.add(box(0.56, 1.05, 0.06, C(col), 0, 0.92, -0.17)); ch.userData.body.add(box(0.6, 0.1, 0.32, C(0xe8e0d0), 0, 1.42, 0, { cast: false })); }
function vikHelmet(ch) { const g = new THREE.Group(), m = C(0x8a8e94, { metal: 0.5, rough: 0.45 }); g.add(box(0.56, 0.2, 0.56, m, 0, 0.52, 0)); g.add(box(0.42, 0.1, 0.42, m, 0, 0.66, 0)); g.add(box(0.06, 0.2, 0.04, m, 0, 0.36, 0.27, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.12; }
function shield(ch, c1, c2) { const g = new THREE.Group(); g.position.set(-0.13, -0.35, 0.05); const a = C(c1), b = C(c2);
  g.add(box(0.08, 0.62, 0.42, a, 0, 0, 0)); g.add(box(0.08, 0.42, 0.62, a, 0, 0, 0)); g.add(box(0.09, 0.62, 0.12, b, 0, 0, 0)); g.add(box(0.1, 0.14, 0.14, C(0x9a9ea4, { metal: 0.6, rough: 0.4 }), -0.01, 0, 0)); g.rotation.y = 0; ch.userData.armL.add(g); return g; }
const axeMesh = () => { const g = new THREE.Group(); g.add(box(0.06, 0.06, 0.8, C(0x6a4a2a), 0, 0, 0.3)); g.add(box(0.04, 0.26, 0.18, C(0xa8acb4, { metal: 0.6, rough: 0.35 }), 0, 0.08, 0.64)); return g; };
const chiselMesh = () => { const g = new THREE.Group(); g.add(box(0.06, 0.06, 0.3, C(0x9a9ea4, { metal: 0.6, rough: 0.4 }), 0, 0, 0.16)); return g; };
const bookOpen = () => { const g = new THREE.Group(); g.add(box(0.5, 0.04, 0.34, C(0x5a2a1a), 0, 0, 0)); g.add(box(0.46, 0.03, 0.3, C(0xeee6d2), 0, 0.03, 0)); return g; };

// Runen-Pixel (eigene Zeichnung): Hagall (H) und Bjarkan (B); übereinander = Binderune
const RUNE_H = ['...X...', '...X...', 'X..X..X', '.X.X.X.', '..XXX..', '...X...', '..XXX..', '.X.X.X.', 'X..X..X', '...X...', '...X...'];
const RUNE_B = ['X....', 'XX...', 'X.X..', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X.X..', 'XX...', 'X....'];
function runeTex(seed, bg, fg, both = true) { return tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, bg, 0.06); for (let i = 0; i < 16; i++) { px(c, i, 0, shade(bg, 0.7)); px(c, 0, i, shade(bg, 0.7)); px(c, i, 15, shade(bg, 0.7)); px(c, 15, i, shade(bg, 0.7)); }
  const put2 = (rows, ox) => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') px(c, ox + x, 2 + y, fg); })); put2(RUNE_H, 4); if (both) put2(RUNE_B, 7); }, seed); }
function runeGlyph(rows, mat, s = 0.12) { const g = new THREE.Group(); const h = rows.length; rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') g.add(box(s, s, s, mat, (x - (row.length - 1) / 2) * s, (h - 1 - y) * s, 0, { cast: false })); })); return g; }
const BLUE_GLOW = new THREE.MeshStandardMaterial({ color: 0x3a8aff, emissive: 0x2a6aff, emissiveIntensity: 0.7, roughness: 0.6 });

// =====================================================================
// SET 1: Dänemark – Wikingerdorf am Fjord
// =====================================================================
const vik = new THREE.Scene();
{
  const sky = skyDome(vik, 0x3a64b0, 0xe8a46a, 0xffcf8a, V(0.75, 0.16, -0.65), [1, 0.82, 0.55]); vik.fog = new THREE.Fog(0xd8b8a8, 90, 480); clouds(vik, 4, 0xffe0c0, 60, 22, 220, 0.8);
  const grassM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x6a8a3a, 0.14); for (let i = 0; i < 10; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x8aa84a); }, 3001));
  vik.add(box(700, 1, 320, grassM, 0, -0.5, 144, { cast: false }));
  vik.add(box(700, 0.9, 5, M(T.sand), 0, -0.45, -17.5, { cast: false }));
  const water = new THREE.Mesh(new THREE.BoxGeometry(800, 0.6, 400), new THREE.MeshStandardMaterial({ color: 0x2c5c80, roughness: 0.22, metalness: 0.25 })); water.position.set(0, -0.62, -220); water.receiveShadow = true; vik.add(water);
  // Berge auf der anderen Seite des Fjords
  const rock = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3e5a3a, 0.12), 3002)), stoneM = M(T.cobble), snowM = M(T.snow);
  const r0 = rng(3003);
  for (let i = 0; i < 16; i++) { if (i >= 6 && i <= 9) continue; const x = -300 + i * 40 + r0() * 10, w = 46 + r0() * 30, h = 16 + r0() * 26, z = -175 - r0() * 40;
    vik.add(box(w, h, 30, rock, x, h / 2 - 1, z, { cast: false })); vik.add(box(w * 0.6, h * 0.3, 22, stoneM, x + 4, h + h * 0.15 - 1, z, { cast: false })); if (h > 30) vik.add(box(w * 0.34, 4, 16, snowM, x + 4, h * 1.3 + 1, z, { cast: false })); }
  // Langhäuser
  const wallM = M(T.planks), roofM = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(y % 4 === 3 ? 0x5a4a22 : 0x9a7a3a, 0.85 + r() * 0.3)); }, 3004)), darkM = M(T.darkwood);
  const shieldCols = [[0xb8302a, 0xf0e8d8], [0x2a4a9a, 0xf0c030], [0x3a7a3a, 0xf0e8d8], [0xf0c030, 0x9a2a22]];
  function longhouse(x, z, w, d, h, rot, seed) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
    g.add(box(w, h, d, wallM, 0, h / 2, 0)); for (const sx of [-1, 1]) { const rf = box(w / 2 + 1.0, 0.3, d + 0.8, roofM, sx * (w / 4 + 0.15), h + w * 0.28, 0); rf.rotation.z = -sx * 0.62; g.add(rf); }
    for (let k = 0; k < 5; k++) { const ww = w * 0.95 * (1 - k / 5); g.add(box(ww, w * 0.085, 0.2, wallM, 0, h + w * 0.0425 + k * w * 0.085, d / 2 - 0.1)); g.add(box(ww, w * 0.085, 0.2, wallM, 0, h + w * 0.0425 + k * w * 0.085, -d / 2 + 0.1)); }
    g.add(box(0.3, 0.3, d + 1.0, darkM, 0, h + w * 0.47, 0)); g.add(box(1.3, 2.1, 0.12, darkM, 0, 1.05, d / 2 + 0.04, { cast: false }));
    for (const sx of [-1, 1]) for (let k = 0; k < Math.floor(d / 2.2); k++) { const [a, b] = shieldCols[(k + seed + (sx > 0 ? 1 : 0)) % 4]; const sg = new THREE.Group(); sg.position.set(sx * (w / 2 + 0.05), 1.5, -d / 2 + 1.3 + k * 2.2); sg.add(box(0.08, 0.7, 0.5, C(a), 0, 0, 0, { cast: false })); sg.add(box(0.08, 0.5, 0.7, C(a), 0, 0, 0, { cast: false })); sg.add(box(0.1, 0.7, 0.14, C(b), 0, 0, 0, { cast: false })); g.add(sg); }
    vik.add(g); return g; }
  longhouse(14, -15, 7, 11, 2.6, 0, 0);            // Haralds Halle (Tür zeigt nach +z, bei z=-9.5)
  longhouse(-11, -9, 5, 9, 2.2, 0.35, 1); longhouse(-22, 2, 5, 9, 2.2, 1.25, 2); longhouse(25, 3, 5, 8, 2.2, -1.1, 3); longhouse(-8, 14, 5, 8, 2.2, 0.1, 1); longhouse(6, 18, 5, 8, 2.2, -0.2, 2);
  // Langschiff im Fjord
  const ship = new THREE.Group(); ship.position.set(3, -0.35, -27); vik.add(ship); const hull = M(T.darkwood);
  ship.add(box(11, 0.7, 2.4, hull, 0, 0.35, 0)); ship.add(box(9, 0.4, 1.6, hull, 0, -0.1, 0)); for (const sx of [-1, 1]) { ship.add(box(1.2, 1.0, 1.4, hull, sx * 6, 0.8, 0)); ship.add(box(0.6, 1.4, 0.6, hull, sx * 6.7, 1.5, 0)); ship.add(box(0.5, 0.5, 0.5, C(0xc8a03a), sx * 6.9, 2.3, 0)); }
  for (let k = 0; k < 8; k++) for (const sz of [-1, 1]) { const [a, b] = shieldCols[(k + (sz > 0 ? 2 : 0)) % 4]; ship.add(box(0.7, 0.7, 0.08, C(a), -4.2 + k * 1.2, 0.85, sz * 1.24, { cast: false })); ship.add(box(0.16, 0.7, 0.09, C(b), -4.2 + k * 1.2, 0.85, sz * 1.25, { cast: false })); }
  ship.add(box(0.22, 6.5, 0.22, hull, 0, 3.6, 0)); const sail = tex(8, 8, (c) => { for (let x = 0; x < 8; x++) { c.fillStyle = x % 2 ? '#f0e6d2' : '#b8302a'; c.fillRect(x, 0, 1, 8); } }, 3005);
  ship.add(box(4.4, 3.6, 0.1, M(sail), 0, 4.4, 0.18)); ship.add(box(5, 0.16, 0.16, hull, 0, 6.25, 0.18));
  // Fackeln (Hook)
  const torchM = new THREE.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff8a20, emissiveIntensity: 2.2 });
  const torches = [];
  for (const [x, z] of [[-2.7, -1.6], [2.9, -2.2], [12.2, -8.8], [15.8, -8.8]]) { vik.add(box(0.14, 1.7, 0.14, darkM, x, 0.85, z)); vik.add(box(0.24, 0.24, 0.24, torchM, x, 1.8, z, { cast: false })); const L = new THREE.PointLight(0xff9a40, 5, 7, 1.6); L.position.set(x, 2.1, z); vik.add(L); torches.push(L); }
  // Lagerfeuer, Fässer, Zaun
  for (const [x, z] of [[-4.2, -4.5], [-3.6, -5.1], [5.2, -5.6]]) { vik.add(box(0.7, 0.9, 0.7, M(T.planks), x, 0.45, z)); vik.add(box(0.74, 0.08, 0.74, C(0x5a5e64), x, 0.7, z, { cast: false })); }
  for (let k = 0; k < 10; k++) vik.add(box(0.14, 1.0, 0.14, darkM, -7 + k * 0.9, 0.5, 6.5)), vik.add(box(0.9, 0.1, 0.08, darkM, -6.55 + k * 0.9, 0.75, 6.5));
  // Blumen im Vordergrund (Hook)
  { const rf = rng(3020); const fc = [0xe8304a, 0xf0d030, 0x6a8aff, 0xffffff, 0xf08a20]; for (let i = 0; i < 46; i++) { const x = -4.5 + rf() * 9, z = 0.9 + rf() * 4.2; if (Math.abs(x) < 1.4 && z < 1.4) continue; vik.add(box(0.03, 0.22, 0.03, C(0x3a7a2a), x, 0.11, z, { cast: false })); vik.add(box(0.1, 0.1, 0.1, C(fc[i % 5]), x, 0.25, z, { cast: false })); } }
  // Runenstein (Haralds Schnitzplatz)
  const runeStoneTex = tex(16, 24, (c, r) => { noiseFill(c, r, 16, 24, 0x8a8a84, 0.12); const red = 0xb8302a; for (let y = 2; y < 22; y++) { px(c, 2, y, red); px(c, 13, y, red); } for (let x = 2; x < 14; x++) { px(c, x, 2, red); px(c, x, 21, red); }
    for (let y = 4; y < 20; y += 2) for (let x = 4; x < 12; x++) if (r() < 0.55) px(c, x, y, red); }, 3006);
  const rsM = M(runeStoneTex);
  const stoneAt = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(1.6, 2.4, 0.7, rsM, 0, 1.2, 0)); g.add(box(1.2, 0.4, 0.6, rsM, 0, 2.6, 0)); g.add(box(1.9, 0.3, 0.9, stoneM, 0, 0.15, 0)); vik.add(g); return g; };
  stoneAt(-24, 6, 0.3);
  // Jelling heute: Kirche + Stein in Glasvitrine
  const JX = -70, JZ = 40; const whiteM = M(tileTex(0xf2eee6, 0xc8c2b6, 3007)), roofR = M(T.roofRed);
  vik.add(box(9, 5, 5, whiteM, JX, 2.5, JZ - 8)); vik.add(box(4, 9, 4, whiteM, JX - 6, 4.5, JZ - 8)); vik.add(box(4.4, 2.6, 4.4, roofR, JX - 6, 10.3, JZ - 8));
  for (const sx of [-1, 1]) { const rf = box(5.4, 0.3, 9.6, roofR, JX + sx * 1.3, 5.9, JZ - 8); rf.rotation.set(0, Math.PI / 2, 0); rf.rotation.x = sx * 0.55; vik.add(rf); }
  vik.add(box(9.6, 0.4, 5.6, roofR, JX, 6.1, JZ - 8)); vik.add(box(1.4, 2.4, 0.12, darkM, JX, 1.2, JZ - 5.45, { cast: false }));
  stoneAt(JX, JZ, 0); const glass = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 }); vik.add(box(2.6, 3.4, 1.6, glass, JX, 1.7, JZ, { cast: false }));
  for (const [x, z] of [[-1.3, -0.8], [1.3, -0.8], [-1.3, 0.8], [1.3, 0.8]]) vik.add(box(0.06, 3.4, 0.06, C(0x3a3e44, { metal: 0.5 }), JX + x, 1.7, JZ + z));
  vik.add(box(14, 0.06, 10, M(T.concrete), JX, 0.03, JZ + 1, { cast: false }));
  // Hügel/Fels für Harald
  vik.add(box(3, 1.0, 2.6, stoneM, 37, 0.5, -2)); vik.add(box(2.2, 0.5, 1.8, stoneM, 37, 1.25, -2.1));
  const sun = sunLight(vik, 0xffc890, 3.0, V(60, 26, -30), V(10, 0, 0), 60, 4096); vik.add(new THREE.HemisphereLight(0x9ab8f0, 0x7a5a3a, 1.35));
  const fill = new THREE.DirectionalLight(0xffe0c0, 0.5); fill.position.set(-20, 15, 40); vik.add(fill);
  // Figuren
  const harald = humanoid(HARALD); crownOn(harald); cape(harald, 0x5a1a16); harald.userData.hatExtra = 0.2;
  const kard = humanoid(KARDACH); const kPhone = inHand(kard, phoneMesh());
  // schwebender Runen-Block (Hook)
  const rb = new THREE.Group(); const rbm = new THREE.MeshStandardMaterial({ map: runeTex(3010, 0x1e4ac8, 0xffffff), emissive: 0xffffff, emissiveMap: runeTex(3011, 0x1a3aa8, 0xffffff), emissiveIntensity: 0.9, roughness: 0.6 });
  rb.add(box(0.42, 0.42, 0.42, rbm, 0, 0, 0, { cast: false, uvScale: 1 / 0.42 })); const rbL = new THREE.PointLight(0x4a8aff, 0.6, 2.0, 2); rb.add(rbL); vik.add(rb);
  const red = [0, 1, 2, 3, 4].map(i => { const p = humanoid({ skin: [0xeab896, 0xf0c4a2, 0xe0b08a, 0xeab896, 0xf2c8a8][i], hair: [0xc87a3a, 0x8a5a2a, 0xe0c070, 0x5a3a22, 0xd8a040][i], hairVol: true, beard: i % 2 ? 'short' : 'full', beardCol: [0xb8702a, 0x7a4a22, 0xc8a050, 0x4a2e18, 0xc89030][i], top: [0xa8342a, 0x8a2a22, 0xb84a2a, 0x9a3a2a, 0xa8342a][i], bottom: 0x5a4632, belt: 0x3a2616, seed: 3100 + i }); vikHelmet(p); shield(p, 0xb8302a, 0xf0e8d8); inHand(p, axeMesh()); vik.add(p); return p; });
  const blue = [0, 1, 2, 3, 4].map(i => { const p = humanoid({ skin: [0xf0c4a2, 0xeab896, 0xf2c8a8, 0xe0b08a, 0xf0c4a2][i], hair: [0xe0c070, 0x5a3a22, 0xc87a3a, 0x2a1e16, 0x8a5a2a][i], hairVol: true, beard: i % 2 ? 'full' : 'short', beardCol: [0xc8a050, 0x4a2e18, 0xb8702a, 0x2a1e16, 0x7a4a22][i], top: [0x2a4a8a, 0x3a5a9a, 0x24407a, 0x2a4a8a, 0x34548e][i], bottom: 0x4a4038, belt: 0x3a2616, seed: 3200 + i }); vikHelmet(p); shield(p, 0x2a4a9a, 0xf0c030); inHand(p, axeMesh()); vik.add(p); return p; });
  const chis = inHand(harald, chiselMesh()); chis.visible = false;
  // Runen zum Zusammenschieben (Logo-Shot) vor dem Stein
  const rH = runeGlyph(RUNE_H, BLUE_GLOW, 0.1), rB = runeGlyph(RUNE_B, BLUE_GLOW, 0.1); vik.add(rH, rB);
  const rL = new THREE.PointLight(0x4a8aff, 4, 6, 1.5); vik.add(rL);
  vik.add(harald, kard);
  vik.userData = { sky, harald, kard, kPhone, rb, rbL, red, blue, chis, rH, rB, rL, torches };
}

// =====================================================================
// SET 2: Schweden 1994 / Treffen 1996 – Labor + Konferenzraum
// =====================================================================
const lab = new THREE.Scene();
{
  const sky = skyDome(lab, 0x5a8ad0, 0xb0cce8, 0xe8eef2, V(-0.5, 0.45, 0.6)); lab.fog = new THREE.Fog(0xe0e8ee, 80, 380); clouds(lab, 11, 0xffffff, 60, 14, 200, 0.85);
  lab.add(box(600, 1, 600, M(T.grass), 0, -0.6, 0, { cast: false }));
  // Labor-Raum (offene Front +z)
  const wallM = M(T.shopWall), floorM = M(T.lino); room3(lab, 13, 10, 3.6, wallM, floorM);
  lab.add(box(13, 0.12, 0.05, C(0x8a9a8a), 0, 1.0, -4.84, { cast: false }));
  for (const x of [-4.4, 4.4]) lab.add(box(2.0, 1.3, 0.1, M(T.windowDark), x, 2.2, -4.82, { cast: false }));
  const beige = C(0xd8d0b8), dark = C(0x2a2a2e), deskM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xb89a72, 0.06), 4001));
  const desk = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.add(box(2.8, 0.08, 1.2, deskM, 0, 0.78, 0)); for (const sx of [-1.3, 1.3]) for (const sz of [-0.5, 0.5]) g.add(box(0.08, 0.78, 0.08, C(0x5a5a5e), sx, 0.39, sz)); lab.add(g); return g; };
  const scr = (col) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 });
  const crt = (g, x, z, ry = 0) => { const m = new THREE.Group(); m.position.set(x, 0.82, z); m.rotation.y = ry; m.add(box(0.62, 0.52, 0.55, beige, 0, 0.33, -0.05)); m.add(box(0.5, 0.38, 0.02, scr(0x2a8a5a), 0, 0.34, 0.235, { cast: false })); m.add(box(0.6, 0.06, 0.24, beige, 0, 0.03, 0.42)); g.add(m); };
  const d1 = desk(-3.0, -3.6), d2 = desk(2.6, -3.6); crt(d1, -0.6, -0.15); crt(d2, 0.7, -0.15);
  // Geräte (Handy, Headset, Computer) + Kabelsalat
  const deskPhone = new THREE.Group(); deskPhone.position.set(0.55, 0.82, 0.1); deskPhone.add(box(0.3, 0.1, 0.24, dark, 0, 0.05, 0)); deskPhone.add(box(0.32, 0.08, 0.08, dark, 0, 0.13, -0.05)); d1.add(deskPhone);
  const mob = new THREE.Group(); mob.position.set(1.0, 0.86, 0.25); mob.add(box(0.12, 0.05, 0.3, C(0x3a3a40), 0, 0, 0)); mob.add(box(0.02, 0.14, 0.02, dark, 0.03, 0.08, -0.12)); mob.add(box(0.08, 0.01, 0.1, scr(0x9ac870), 0, 0.03, -0.06, { cast: false })); d1.add(mob);
  const hs = new THREE.Group(); hs.position.set(-1.05, 0.84, 0.25); hs.add(box(0.36, 0.04, 0.06, dark, 0, 0.14, 0)); for (const sx of [-1, 1]) hs.add(box(0.06, 0.16, 0.14, dark, sx * 0.18, 0.06, 0)); hs.add(box(0.03, 0.03, 0.22, dark, 0.18, 0.02, 0.12)); d1.add(hs);
  const cabCols = [0x18181c, 0x4a4a50, 0x2a2a30, 0xd8d0b8, 0x3a3a3e]; const rc = rng(4002); const cables = new THREE.Group(); d1.add(cables);
  for (let i = 0; i < 26; i++) { const len = 0.4 + rc() * 1.2; const c = box(len, 0.03, 0.03, C(cabCols[i % 5]), -1.2 + rc() * 2.4, 0.84 + rc() * 0.02, -0.4 + rc() * 0.9, { cast: false }); c.rotation.y = rc() * Math.PI; cables.add(c); }
  for (let i = 0; i < 14; i++) { const c = box(0.03, 0.8, 0.03, C(cabCols[i % 5]), -1.3 + rc() * 2.6, 0.4, 0.62, { cast: false }); c.rotation.z = (rc() - 0.5) * 0.6; cables.add(c); }
  for (let i = 0; i < 30; i++) { const c = box(0.5 + rc() * 1.4, 0.03, 0.03, C(cabCols[i % 5]), -1.4 + rc() * 2.8, 0.02, 0.3 + rc() * 1.4, { cast: false }); c.rotation.y = rc() * Math.PI; cables.add(c); }
  // Steckerleiste mit vielen verschiedenen Steckern (Tisch 2)
  const strip = new THREE.Group(); strip.position.set(-0.6, 0.82, 0.25); d2.add(strip); strip.add(box(1.3, 0.08, 0.2, C(0xeeeeee), 0, 0.04, 0));
  const plugCols = [0x18181c, 0xeeeeee, 0x2a5ab8, 0x3a3a40, 0xd8b030, 0x18181c];
  [[0.16, 0.18, 0.16], [0.12, 0.24, 0.12], [0.22, 0.12, 0.14], [0.1, 0.2, 0.18], [0.18, 0.16, 0.1], [0.14, 0.14, 0.22]].forEach(([w, h, d], i) => { strip.add(box(w, h, d, C(plugCols[i]), -0.5 + i * 0.2, 0.08 + h / 2, 0)); strip.add(box(0.03, 0.03, 0.9, C(plugCols[i]), -0.5 + i * 0.2, 0.08 + h * 0.7, -0.5, { cast: false })); });
  const adapters = []; for (let i = 0; i < 4; i++) { const a = box(0.18, 0.1, 0.12, C([0x18181c, 0x2a5ab8, 0xeeeeee, 0x3a3a40][i]), 0.35 + i * 0.08, 0.87 + i * 0.03, 0.3 - i * 0.12); a.rotation.y = i * 0.7; d2.add(a); adapters.push(a); }
  // Platine mit Funkchip (Tisch 2)
  const pcbTex = tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x2a7a3a, 0.08); for (let i = 0; i < 6; i++) { const y = 2 + i * 2; for (let x = 1; x < 15; x++) if (r() < 0.7) px(c, x, y, 0xc8a040); } }, 4003);
  const pcb = new THREE.Group(); pcb.position.set(0.8, 0.82, 0.32); d2.add(pcb); pcb.add(box(0.5, 0.02, 0.36, M(pcbTex), 0, 0.01, 0)); pcb.add(box(0.16, 0.04, 0.16, C(0x1a1a1e), 0, 0.04, 0)); for (let k = 0; k < 5; k++) for (const sz of [-1, 1]) pcb.add(box(0.015, 0.01, 0.04, C(0xd0d4d8, { metal: 0.8, rough: 0.3 }), -0.06 + k * 0.03, 0.025, sz * 0.1, { cast: false }));
  pcb.add(box(0.03, 0.12, 0.03, C(0xd0d4d8, { metal: 0.7 }), 0.2, 0.07, -0.14));
  // Konferenztisch + Stühle + Whiteboard
  lab.add(box(3.4, 0.08, 1.6, deskM, 0, 0.78, 0.6)); for (const sx of [-1.55, 1.55]) for (const sz of [-0.1, 1.3]) lab.add(box(0.08, 0.78, 0.08, C(0x5a5a5e), sx, 0.39, sz));
  const chairs = []; for (const [x, z, ry] of [[-1.3, -0.6, 0], [0, -0.6, 0], [1.3, -0.6, 0]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(0.55, 0.08, 0.55, C(0x2a3a5a), 0, 0.48, 0)); g.add(box(0.55, 0.6, 0.08, C(0x2a3a5a), 0, 0.8, -0.26)); g.add(box(0.06, 0.48, 0.06, C(0x3a3a3e), 0, 0.24, 0)); lab.add(g); chairs.push(g); }
  const wbcv = document.createElement('canvas'); wbcv.width = 1024; wbcv.height = 512; const wbtex = new THREE.CanvasTexture(wbcv); wbtex.colorSpace = THREE.SRGBColorSpace;
  const wb = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.06), [C(0xaaaaaa), C(0xaaaaaa), C(0xaaaaaa), C(0xaaaaaa), new THREE.MeshStandardMaterial({ map: wbtex, roughness: 0.6 }), C(0xaaaaaa)]); wb.position.set(0, 2.5, -4.8); lab.add(wb);
  lab.add(box(3.7, 0.08, 0.14, C(0x9a9a9a), 0, 1.58, -4.76));
  // drei „Hauslösungen“: farbige Funkringe
  const ringMat = (col) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
  const ringSets = [0x3a8aff, 0xff5a4a, 0xf0c030].map(col => { const arr = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 40), ringMat(col)); m.visible = false; lab.add(m); return m; }); return arr; });
  // Gebäude außen (Schweden)
  const BX = 0, BZ = -60; const brickM = M(T.brick), winM = M(T.window);
  lab.add(box(26, 12, 12, brickM, BX, 6, BZ)); for (let fl = 0; fl < 3; fl++) for (let k = 0; k < 8; k++) lab.add(box(1.6, 1.8, 0.1, M(T.windowDark), BX - 10.5 + k * 3, 2.4 + fl * 3.6, BZ + 6.03, { cast: false }));
  lab.add(box(3.0, 2.6, 0.12, C(0x3a4a5a), BX, 1.3, BZ + 6.04, { cast: false })); lab.add(box(28, 0.5, 14, C(0x5a5a5e), BX, 12.2, BZ));
  lab.add(box(40, 0.06, 18, M(T.concrete), BX, 0.0, BZ + 14, { cast: false }));
  const se = tex(16, 10, (c) => { c.fillStyle = '#1f5aa8'; c.fillRect(0, 0, 16, 10); c.fillStyle = '#f2c230'; c.fillRect(5, 0, 2, 10); c.fillRect(0, 4, 16, 2); }, 4004);
  const fl1 = flag(se, 2.4, 1.5, 8, lab, V(BX - 9, 0, BZ + 12)), fl2 = flag(se, 2.4, 1.5, 8, lab, V(BX + 9, 0, BZ + 12), 0, 1.3);
  const birch = (x, z, h) => { for (let i = 0; i < h; i++) lab.add(box(0.35, 1, 0.35, M(tex(4, 8, (c, r) => { noiseFill(c, r, 4, 8, 0xeeeae0, 0.04); c.fillStyle = '#2a2a2a'; c.fillRect(Math.floor(r() * 4), Math.floor(r() * 8), 2, 1); }, 4010 + i)), x, i + 0.5, z)); lab.add(box(2.6, 2.4, 2.6, C(0x6a9a3a), x, h + 0.8, z)); lab.add(box(1.6, 1.4, 1.6, C(0x7aaa44), x, h + 2.4, z)); };
  for (const [x, z, h] of [[-16, -44, 5], [15, -45, 6], [-22, -52, 6], [22, -50, 5], [-11, -40, 4], [11, -40, 4]]) birch(BX + x, z, h);
  const sun = sunLight(lab, 0xfff0d8, 3.0, V(-30, 40, 40), V(0, 0, -20), 60); lab.add(new THREE.HemisphereLight(0xdde8ff, 0x8a8070, 1.3));
  const ceil = new THREE.PointLight(0xfff2dc, 7, 14, 1.4); ceil.position.set(0, 3.3, -0.5); lab.add(ceil); const ceil2 = new THREE.PointLight(0xfff2dc, 5, 12, 1.4); ceil2.position.set(0, 3.2, -3.4); lab.add(ceil2);
  const front = new THREE.DirectionalLight(0xfff4e8, 1.3); front.position.set(2, 6, 14); front.target.position.set(0, 1, -2); lab.add(front, front.target);
  // Figuren
  const kard = humanoid(KARDACH), eng1 = humanoid(ENG1), eng2 = humanoid(ENG2), nok = humanoid(NOKIA); lab.add(kard, eng1, eng2, nok);
  const kBook = inHand(kard, bookMesh(0x8a2a1a)); const e1Phone = inHand(eng1, phoneMesh()); const nPhone = inHand(nok, phoneMesh());
  const e1HS = new THREE.Group(); e1HS.add(box(0.56, 0.05, 0.1, dark, 0, 0.55, 0)); for (const sx of [-1, 1]) { e1HS.add(box(0.05, 0.3, 0.1, dark, sx * 0.28, 0.38, 0)); e1HS.add(box(0.08, 0.16, 0.16, dark, sx * 0.29, 0.22, 0)); } e1HS.add(box(0.03, 0.03, 0.22, dark, -0.29, 0.14, 0.12)); eng1.userData.head.add(e1HS);
  const openBook = bookOpen(); lab.add(openBook);
  // Buchseite mit Harald-Bild
  const pageTex = tex(32, 24, (c, r) => { noiseFill(c, r, 32, 24, 0xeee6d2, 0.03); c.fillStyle = '#3a2a1e'; for (let y = 3; y < 21; y += 2) c.fillRect(2, y, 11 - (y % 4 ? 2 : 0), 1);
    c.fillStyle = '#8a6a4a'; c.fillRect(17, 3, 12, 16); c.fillStyle = '#eab896'; c.fillRect(19, 6, 8, 7); c.fillStyle = '#f0c030'; c.fillRect(19, 4, 8, 2); c.fillRect(19, 3, 1, 1); c.fillRect(22, 3, 2, 1); c.fillRect(26, 3, 1, 1);
    c.fillStyle = '#c0702a'; c.fillRect(19, 11, 8, 3); c.fillStyle = '#2a3c9a'; c.fillRect(23, 11, 1, 1); c.fillStyle = '#ffffff'; c.fillRect(22, 11, 1, 1); c.fillStyle = '#3a6a9a'; c.fillRect(20, 8, 1, 1); c.fillRect(25, 8, 1, 1); c.fillStyle = '#9a2a22'; c.fillRect(18, 14, 10, 5); }, 4020);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.28), M(pageTex)); page.rotation.x = -Math.PI / 2; page.position.y = 0.052; openBook.add(page);
  lab.userData = { sky, kard, eng1, eng2, nok, kBook, e1Phone, nPhone, e1HS, wb, wbcv, wbtex, ringSets, cables, chairs, openBook, fl1, fl2, d1, d2, adapters };
}
function drawBoard(mode, xk = 0) {
  const { wbcv, wbtex } = lab.userData, c = wbcv.getContext('2d');
  c.fillStyle = '#f4f6f4'; c.fillRect(0, 0, 1024, 512); c.strokeStyle = '#c8ccc8'; c.lineWidth = 10; c.strokeRect(5, 5, 1014, 502); c.textAlign = 'center';
  const t = (txt, size, y, col) => { c.font = `800 ${size}px Mont`; c.fillStyle = col; c.fillText(txt, 512, y); };
  if (mode === 'name' || mode === 'stays') { t('Projekt:', 60, 150, '#5a5e64'); t('BLUETOOTH', 150, 330, '#1f4ab8'); if (mode === 'stays') { c.fillStyle = '#2a9a3a'; c.font = '800 90px Mont'; c.fillText('✓', 512, 455); } }
  if (mode === 'pan') { t('Geplanter Name:', 60, 150, '#5a5e64'); t('PAN', 170, 345, '#3a3e44');
    if (xk > 0) { c.strokeStyle = '#d0201a'; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(340, 170); c.lineTo(340 + 344 * Math.min(1, xk * 2), 170 + 230 * Math.min(1, xk * 2)); c.stroke(); if (xk > 0.5) { c.beginPath(); c.moveTo(684, 170); c.lineTo(684 - 344 * Math.min(1, (xk - 0.5) * 2), 170 + 230 * Math.min(1, (xk - 0.5) * 2)); c.stroke(); } } }
  if (mode === 'blank') { t('Funk statt Kabel?', 70, 280, '#5a5e64'); }
  wbtex.needsUpdate = true;
}

// =====================================================================
// SET 3: Heute – Zimmer am Abend + Kanal-Halle
// =====================================================================
const tech = new THREE.Scene();
{
  tech.background = new THREE.Color(0x0e1422);
  const wallM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x5a6a8a, 0.05), 5001)), floorM = M(T.planks); room3(tech, 10, 8, 3.4, wallM, floorM);
  const nightWin = tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const f = x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || y === 7; px(c, x, y, f ? 0xe8e8e8 : (r() < 0.08 ? 0xffd27a : shade(0x1a2a4a, 0.8 + r() * 0.3))); } }, 5002);
  tech.add(box(2.6, 1.6, 0.1, M(nightWin, { emissive: true, ei: 0.5 }), -2.2, 2.0, -3.84, { cast: false }));
  const deskM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xeae6de, 0.04), 5003)), dark = C(0x1e1e22);
  tech.add(box(3.6, 0.08, 1.3, deskM, 0.4, 0.78, -2.7)); for (const sx of [-1.65, 1.65]) for (const sz of [-0.55, 0.55]) tech.add(box(0.08, 0.78, 0.08, C(0x3a3a3e), 0.4 + sx, 0.39, -2.7 + sz));
  const chair = new THREE.Group(); chair.position.set(0.0, 0, -1.6); chair.add(box(0.6, 0.08, 0.6, C(0x3a2a5a), 0, 0.5, 0)); chair.add(box(0.6, 0.7, 0.08, C(0x3a2a5a), 0, 0.88, 0.28)); chair.add(box(0.06, 0.5, 0.06, dark, 0, 0.25, 0)); tech.add(chair);
  // Lampe (warm), Bett, Poster
  tech.add(box(0.1, 0.6, 0.1, dark, 1.9, 1.12, -3.0)); const lampM = new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffb04a, emissiveIntensity: 1.6 }); tech.add(box(0.36, 0.22, 0.36, lampM, 1.9, 1.5, -3.0, { cast: false }));
  const lamp = new THREE.PointLight(0xffb060, 6, 7, 1.5); lamp.position.set(1.9, 1.6, -2.7); tech.add(lamp);
  tech.add(box(2.2, 0.5, 3.4, C(0x3a4a8a), -3.6, 0.25, 0.4)); tech.add(box(2.2, 0.16, 0.8, C(0xeeeeee), -3.6, 0.58, -0.9));
  tech.add(box(1.0, 1.4, 0.04, M(tex(8, 12, (c, r) => { c.fillStyle = '#2a1a4a'; c.fillRect(0, 0, 8, 12); c.fillStyle = '#ff6a9a'; c.fillRect(1, 2, 6, 4); c.fillStyle = '#55ffff'; c.fillRect(2, 7, 4, 3); }, 5004)), 2.6, 2.1, -3.84, { cast: false }));
  // Geräte
  const scrM = (col, ei = 1.0) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: ei });
  const dev = {};
  dev.phone = new THREE.Group(); dev.phone.add(box(0.2, 0.03, 0.38, dark, 0, 0.015, 0)); dev.phone.add(box(0.17, 0.01, 0.33, scrM(0x4a8aff), 0, 0.034, 0, { cast: false }));
  dev.head = new THREE.Group(); dev.head.add(box(0.5, 0.06, 0.1, C(0xeeeeee), 0, 0.42, 0)); for (const sx of [-1, 1]) { dev.head.add(box(0.06, 0.3, 0.1, C(0xeeeeee), sx * 0.25, 0.26, 0)); dev.head.add(box(0.1, 0.2, 0.2, C(0x2a2a2e), sx * 0.25, 0.1, 0)); }
  dev.watch = new THREE.Group(); dev.watch.add(box(0.12, 0.04, 0.14, dark, 0, 0.02, 0)); dev.watch.add(box(0.1, 0.01, 0.12, scrM(0x55ff88), 0, 0.045, 0, { cast: false })); dev.watch.add(box(0.08, 0.02, 0.36, C(0xe86a4a), 0, 0.01, 0));
  dev.speaker = new THREE.Group(); dev.speaker.add(box(0.22, 0.4, 0.22, C(0x2a2a30), 0, 0.2, 0)); dev.speaker.add(box(0.16, 0.16, 0.01, C(0x4a4a52), 0, 0.22, 0.115, { cast: false }));
  dev.mouse = new THREE.Group(); dev.mouse.add(box(0.12, 0.05, 0.2, C(0xd8d8dc), 0, 0.025, 0));
  dev.keys = new THREE.Group(); dev.keys.add(box(0.8, 0.04, 0.28, C(0x2a2a30), 0, 0.02, 0)); for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) dev.keys.add(box(0.05, 0.02, 0.05, C(0x5a5a62), -0.34 + i * 0.062, 0.05, -0.08 + j * 0.08, { cast: false }));
  dev.pad = new THREE.Group(); dev.pad.add(box(0.32, 0.06, 0.16, C(0x2a2a30), 0, 0.03, 0)); for (const sx of [-1, 1]) dev.pad.add(box(0.1, 0.06, 0.12, C(0x2a2a30), sx * 0.16, 0.03, 0.05)); dev.pad.add(box(0.04, 0.02, 0.04, C(0xe84a4a), 0.1, 0.07, -0.02, { cast: false })); dev.pad.add(box(0.04, 0.02, 0.04, C(0x4a8ae8), 0.14, 0.07, 0.02, { cast: false }));
  dev.buds = new THREE.Group(); dev.buds.add(box(0.16, 0.08, 0.12, C(0xf4f4f4), 0, 0.04, 0));
  Object.values(dev).forEach(d => tech.add(d));
  const lineM = new THREE.MeshBasicMaterial({ color: 0x55aaff, transparent: true, opacity: 0.85 });
  const links = [0, 1, 2, 3, 4, 5, 6].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.018, 0.018), lineM.clone()); tech.add(m); return m; });
  const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 48), new THREE.MeshBasicMaterial({ color: 0x55aaff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; tech.add(m); return m; });
  const range = new THREE.Mesh(new THREE.RingGeometry(2.9, 3.0, 64), new THREE.MeshBasicMaterial({ color: 0x55ffaa, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })); range.rotation.x = -Math.PI / 2; tech.add(range);
  // goldener Schlüssel
  const key = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: 0xf0c030, emissive: 0x8a6a10, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.35 });
  key.add(box(0.14, 0.14, 0.04, gold, -0.12, 0, 0)); key.add(box(0.06, 0.06, 0.05, C(0x1a1a1a), -0.12, 0, 0, { cast: false })); key.add(box(0.24, 0.04, 0.04, gold, 0.06, 0, 0)); key.add(box(0.04, 0.07, 0.04, gold, 0.14, -0.05, 0)); key.add(box(0.04, 0.05, 0.04, gold, 0.08, -0.04, 0)); tech.add(key);
  // Kanal-Halle: 79 Kanäle (bei x = 60)
  const hall = new THREE.Group(); hall.position.set(60, 0, 0); tech.add(hall);
  hall.add(box(30, 0.2, 12, C(0x1a1e2a), 0, -0.1, 0, { cast: false }));
  const lanes = []; for (let i = 0; i < 79; i++) { const hue = i / 79; const col = new THREE.Color().setHSL(0.55 + hue * 0.35, 0.6, 0.5); const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, transparent: true, opacity: 0.55, roughness: 0.4 });
    const l = box(0.07, 2.6, 0.7, m, (i - 39) * 0.2, 1.3, 0, { cast: false }); hall.add(l); lanes.push(l); }
  const wlan = box(4.3, 3.0, 1.2, new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0.28, depthWrite: false }), (20 - 39) * 0.2, 1.5, 0, { cast: false }); hall.add(wlan);
  const sig = box(0.45, 0.45, 0.45, new THREE.MeshStandardMaterial({ color: 0x8ac0ff, emissive: 0x3a8aff, emissiveIntensity: 1.4 }), 0, 1.3, 0.6, { cast: false }); hall.add(sig); const sigL = new THREE.PointLight(0x4a8aff, 4, 3, 1.5); sig.add(sigL);
  for (let x = -14; x <= 14; x += 2) hall.add(box(0.04, 0.02, 12, C(0x2a3a5a), x, 0.01, 0, { cast: false }));
  // Lena
  const lena = humanoid(LENA); tech.add(lena); const lPhone = inHand(lena, phoneMesh());
  const lHS = new THREE.Group(); lHS.add(box(0.56, 0.06, 0.12, C(0xeeeeee), 0, 0.56, 0)); for (const sx of [-1, 1]) { lHS.add(box(0.06, 0.28, 0.12, C(0xeeeeee), sx * 0.29, 0.4, 0)); lHS.add(box(0.1, 0.22, 0.24, C(0x2a2a2e), sx * 0.3, 0.22, 0)); } lena.userData.head.add(lHS);
  tech.add(new THREE.HemisphereLight(0x6a7ab8, 0x3a2a2a, 1.2)); const moon = sunLight(tech, 0xa8c0ff, 1.4, V(-10, 14, 12), V(0, 0, -2), 12); 
  const front = new THREE.DirectionalLight(0xcfd8ff, 0.8); front.position.set(3, 5, 10); tech.add(front);
  const hallL = new THREE.PointLight(0x8aa8ff, 30, 30, 1.2); hallL.position.set(60, 7, 6); tech.add(hallL);
  tech.userData = { dev, links, rings, range, key, lanes, wlan, sig, lena, lPhone, lHS };
}

// =====================================================================
// SET 4: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const water = new THREE.Mesh(new THREE.BoxGeometry(800, 0.6, 300), new THREE.MeshStandardMaterial({ color: 0x5a5a8a, roughness: 0.2, metalness: 0.3 })); water.position.set(0, -0.2, -190); dusk.add(water);
  const r = rng(1901);
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  // Langschiff-Silhouette + Runenstein
  const hull = C(0x3a2a20); const sh = new THREE.Group(); sh.position.set(-26, -0.1, -95); dusk.add(sh); sh.add(box(18, 1.2, 3.6, hull, 0, 0.5, 0)); sh.add(box(0.4, 10, 0.4, hull, 0, 5, 0)); sh.add(box(7, 6, 0.2, C(0x8a4a3a), 0, 6, 0.3));
  dusk.add(box(1.6, 2.6, 0.7, C(0x7a7a74), 9, 1.3, -6)); dusk.add(box(1.2, 0.4, 0.6, C(0x7a7a74), 9, 2.8, -6));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('KARDACH, 2008', 72, 150, '#a3241c'); fit('EIN WIKINGERKÖNIG VERBINDET', 56, 290, '#3a2a1e'); fit('HEUTE MILLIARDEN GERÄTE', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 72.14; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix); 1 Frame Vorlauf
const CUTS = [[0, 'hero'], [4, 'denmark'], [9, 'tribes'], [20, 'harald'], [26, 'tooth'], [32, 'achieve'], [39, 'unite'], [47, 'carve'], [55, 'jelling'], [62, 'sweden'], [64, 'engineers'],
  [71, 'cables'], [76, 'plugs'], [82, 'wireless'], [88, 'chip'], [97, 'rivals'], [110, 'meeting'], [116, 'kardach'], [126, 'book'], [131, 'proposal'], [141, 'name'], [151, 'pan'], [160, 'stays'],
  [169, 'runes'], [179, 'radio'], [194, 'hop'], [206, 'term'], [210, 'pair'], [220, 'recognize'], [226, 'piconet'], [239, 'sign'], [245, 'loop']];
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
let boardMode = '', signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const MB = s => `<span style="font:800 32px Mont">${s}</span>`;
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const hide = arr => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const wpos = o => { const v = V(0, 0, 0); o.updateWorldMatrix(true, false); return o.getWorldPosition(v); };
const hsh = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = vik, exp = 1.25; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const tagAt = (p, text, color) => ui.tags.push([p, text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Dänemark ----------
  if (['hero', 'loop', 'denmark', 'tribes', 'harald', 'tooth', 'achieve', 'unite', 'carve', 'jelling', 'runes'].includes(sh.id)) {
    scene = vik; const Vk = vik.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    const { harald, kard, rb, red: R, blue: B } = Vk;
    hide([harald, kard, ...R, ...B]); rb.visible = false; Vk.rH.visible = Vk.rB.visible = false; Vk.rL.intensity = 0; Vk.chis.visible = false; harald.userData.setFace({});
    Vk.torches.forEach((L, i) => L.intensity = 5 + Math.sin(ta * 13 + i * 2) * 0.5 + Math.sin(ta * 7.3 + i) * 0.4);
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'denmark') {
      put(harald, HX, 0, HZ, 0.5); put(kard, HX2, 0, HZ, -0.5); pose3(harald, 'idle', ta, 0); pose3(kard, 'phone', ta, 1);
      harald.userData.head.rotation.y = 0.3; harald.userData.armR.rotation.x = -0.7; harald.userData.armR.rotation.z = 0.25; kard.userData.head.rotation.x = 0.0; kard.userData.head.rotation.y = -0.25;
      rb.visible = true; rb.position.set(0.03, 1.62 + Math.sin(ta * 2.2) * 0.04, 0.45); rb.rotation.set(0.35, 0.6 + ta * 0.9, 0.2);
      heroCam(ta); if (sh.id !== 'denmark') { tag(harald, 'Harald Blauzahn', HERO); tag(kard, 'Jim Kardach', ALLY); }
    }
    if (sh.id === 'denmark') { mv(u, V(-30, 15, 26), V(-27, 14, 23), V(4, 1.5, -12), V(5, 1.5, -13), 46); info(wt(4), 'Dänemark, vor über 1000 Jahren'); }
    if (sh.id === 'tribes') {
      R.forEach((p, i) => { put(p, 32.2 + (i % 2) * -0.9, 0, 1.6 + i * 1.15, Math.PI / 2 - 0.65); pose(p, 'hammer', t, i * 1.3); p.userData.setFace({ angry: true }); });
      B.forEach((p, i) => { put(p, 35.6 + (i % 2) * 0.9, 0, 1.9 + i * 1.15, -Math.PI / 2 + 0.65); pose(p, 'hammer', t, i * 1.7 + 0.5); p.userData.setFace({ angry: true }); });
      mv(u, V(33.9, 3.0, 15.0), V(33.9, 2.9, 14.0), V(33.9, 1.0, 4.0), V(33.9, 1.0, 4.0), 50); tag(R[2], 'Roter Stamm', BAD); tag(B[2], 'Blauer Stamm', ALLY);
    }
    if (sh.id === 'harald' || sh.id === 'tooth') {
      const w = sh.id === 'harald' ? smoother((t - sh.a) / 1.2) : 1; put(harald, 14, 0, lerp(-9.6, -8.0, w), 0); pose3(harald, w < 1 ? 'walk' : 'idle', t);
      if (sh.id === 'harald') { if (w >= 1) { harald.userData.armL.rotation.z = -0.15; } mv(u, V(15.0, 1.75, -3.6), V(14.85, 1.72, -4.3), V(14, 1.35, -8.4), V(14, 1.4, -8.2), 46); tag(harald, 'Harald', HERO);
        tip(wt(25), 'tooth', 'Harald Blauzahn', '#ffd23f', [gray('König der Dänen'), gray('ca. 958 bis 986')]); }
      else { harald.userData.head.rotation.y = 0.12; mv(u, V(14.4, 1.72, -5.9), V(14.35, 1.7, -6.3), V(14.0, 1.5, -8.0), V(14.0, 1.5, -8.0), 40); chat(wt(26), gray('Angeblich: ein toter, dunkler Zahn')); }
    }
    if (sh.id === 'achieve' || sh.id === 'unite') {
      if (sh.id === 'achieve') {
        put(harald, 37, 1.5, -2.1, 0); pose(harald, 'fist', t);
        R.forEach((p, i) => { put(p, 33.2 + i * 0.6, 0, 1.0 + (i % 2) * 1.1, 0.6 - i * 0.08); pose3(p, 'idle', t, i); p.userData.head.rotation.x = -0.25; });
        B.forEach((p, i) => { put(p, 38.4 + i * 0.6, 0, 1.0 + (i % 2) * 1.1, -0.3 - i * 0.08); pose3(p, 'idle', t, i + 3); p.userData.head.rotation.x = -0.25; });
        mv(u, V(37.6, 1.0, 5.6), V(37.5, 1.05, 5.0), V(37, 2.6, -2.0), V(37, 2.65, -2.0), 50); tag(harald, 'Harald', HERO);
      } else {
        put(harald, 37, 0, 1.2, 0); pose3(harald, 'cheer', t); harald.userData.baseY = 0;
        const all = [...R, ...B]; all.forEach((p, i) => { const row = Math.floor(i / 5), col = i % 5; const k = (col + row) % 2 ? R[Math.floor(i / 2) % 5] : B[Math.floor(i / 2) % 5]; });
        R.forEach((p, i) => { put(p, 33.8 + i * 1.6, 0, -0.4, 0.0); pose3(p, 'cheer', t, i * 1.3); });
        B.forEach((p, i) => { put(p, 34.6 + i * 1.6, 0, -1.6, 0.0); pose3(p, 'cheer', t, i * 1.7 + 0.4); });
        mv(u, V(37, 2.2, 8.6), V(37, 2.15, 7.8), V(37, 1.3, 0.0), V(37, 1.3, 0.0), 50); tag(harald, 'Harald', HERO);
        toast(wt(46), 'Fortschritt erzielt!', 'Ein Reich: Dänemark', 'crown');
      }
    }
    if (sh.id === 'carve') { put(harald, -22.75, 0, 7.15, -1.2); pose(harald, 'hammer', t); Vk.chis.visible = true;
      mv(u, V(-25.7, 1.8, 11.4), V(-25.4, 1.78, 10.8), V(-23.5, 1.35, 6.8), V(-23.5, 1.35, 6.8), 46); tag(harald, 'Harald', HERO); }
    if (sh.id === 'jelling') { mv(u, V(-65.2, 2.0, 49.5), V(-65.8, 1.95, 48.4), V(-70, 2.0, 39.0), V(-70, 2.0, 39.0), 48); info(wt(55), 'Jelling heute: Weltkulturerbe'); }
    if (sh.id === 'runes') {
      const ry = 0.3, dir = V(Math.sin(ry), 0, Math.cos(ry)), side = V(Math.cos(ry), 0, -Math.sin(ry)); const base = V(-24, 0, 6).add(dir.clone().multiplyScalar(1.1));
      const mg = smoother((t - wt(178)) / 0.5); const s = 0.1;
      const offH = lerp(-0.6, 0, mg), offB = lerp(0.75, 2 * s, mg);
      Vk.rH.visible = t >= wt(171) - 0.1; Vk.rB.visible = t >= wt(171) - 0.1;
      const yb = 2.34; Vk.rH.position.copy(base).add(side.clone().multiplyScalar(offH)); Vk.rH.position.y = yb; Vk.rB.position.copy(base).add(side.clone().multiplyScalar(offB)); Vk.rB.position.y = yb;
      Vk.rH.rotation.set(0, ry, 0); Vk.rB.rotation.set(0, ry, 0); Vk.rL.position.copy(base).add(V(0, 2.8, 0.6)); Vk.rL.intensity = Vk.rH.visible ? 4 : 0;
      put(harald, -25.6, 0, 7.3, 0.75); pose3(harald, 'point', t); harald.userData.armR.rotation.x = -2.3;
      mv(u, V(-22.0, 2.2, 12.6), V(-22.2, 2.2, 11.9), V(-24.0, 2.15, 6.4), V(-24.0, 2.15, 6.4), 46); tag(harald, 'Harald', HERO);
      if (t >= wt(175) && mg < 0.2) tagAt(Vk.rH.position.clone().add(V(0, 1.3, 0)), 'H', WHITE); if (t >= wt(177) && mg < 0.2) tagAt(Vk.rB.position.clone().add(V(0, 1.3, 0)), 'B', WHITE);
      tip(wt(172), 'rune', 'Haralds Initialen', '#55aaff', [gray('Rune Hagall = ' + MB('H')), gray('Rune Bjarkan = ' + MB('B'))]);
    }
  }
  // ---------- Schweden / Labor ----------
  if (['sweden', 'engineers', 'cables', 'plugs', 'wireless', 'chip', 'rivals', 'meeting', 'kardach', 'book', 'proposal', 'name', 'pan', 'stays'].includes(sh.id)) {
    scene = lab; exp = 1.3; const L = lab.userData; const { kard, eng1, eng2, nok } = L;
    hide([kard, eng1, eng2, nok]); L.e1HS.visible = false; L.kBook.visible = false; L.e1Phone.visible = false; L.nPhone.visible = false; L.openBook.visible = false; L.cables.visible = true;
    L.ringSets.flat().forEach(m => m.visible = false); L.fl1.userData.update(t); L.fl2.userData.update(t);
    const rings = (k, src, t0) => { if (t < t0) return; L.ringSets[k].forEach((m, j) => { const ph = ((t - t0) * 0.9 + j / 3) % 1; m.visible = true; m.position.copy(src); m.scale.setScalar(0.08 + ph * 0.55); m.lookAt(camera.position); m.material.opacity = 0.75 * (1 - ph); }); };
    let mode = 'blank';
    if (sh.id === 'sweden') { mv(u, V(15, 3.6, -28), V(13.6, 3.4, -29.4), V(0, 5.5, -58), V(0, 5.5, -58), 48); info(wt(62), 'Schweden, 1994'); }
    if (sh.id === 'engineers') { put(eng1, -3.75, 0, -2.25, 0.45); put(eng2, -2.2, 0, -2.15, -0.4); pose3(eng1, 'angry', t); pose3(eng2, 'cross', t, 1); eng1.userData.setFace({ angry: true }); eng2.userData.setFace({ sad: true });
      mv(u, V(-2.9, 1.85, 2.9), V(-2.9, 1.8, 2.3), V(-2.95, 1.2, -2.4), V(-2.95, 1.2, -2.4), 48); tag(eng1, 'Ingenieur', ALLY); tag(eng2, 'Ingenieurin', ALLY); }
    if (sh.id === 'cables') { mv(u, V(-2.75, 2.35, -1.45), V(-2.8, 2.25, -1.75), V(-3.0, 0.85, -3.4), V(-3.0, 0.85, -3.4), 50);
      if (t >= wt(73)) tagAt(V(-2.0, 1.02, -3.35), 'Handy', WHITE); if (t >= wt(74)) tagAt(V(-4.05, 1.12, -3.35), 'Headset', WHITE); if (t >= wt(75)) tagAt(V(-3.6, 1.55, -3.8), 'Computer', WHITE);
      eff(wt(72), 'Kabelsalat', 'Stufe: extrem', BAD); }
    if (sh.id === 'plugs') { mv(u, V(2.35, 1.38, -2.3), V(2.3, 1.33, -2.5), V(2.0, 0.92, -3.4), V(2.0, 0.92, -3.4), 44); chat(wt(77), gray('Jedes Gerät: eigener Stecker')); }
    if (sh.id === 'wireless') { L.cables.visible = false; put(eng1, -1.2, 0, -2.4, 0.3); pose3(eng1, 'phone', t); eng1.userData.head.rotation.x = 0.1; L.e1HS.visible = true; L.e1Phone.visible = true; eng1.userData.setFace({ smile: true });
      mv(u, V(-0.75, 1.75, 0.9), V(-0.85, 1.72, 0.4), V(-1.2, 1.35, -2.4), V(-1.2, 1.35, -2.4), 46); lab.updateMatrixWorld(); rings(0, wpos(L.e1Phone), sh.a); tag(eng1, 'Ingenieur', ALLY); }
    if (sh.id === 'chip') { mv(u, V(3.62, 1.3, -2.5), V(3.56, 1.24, -2.66), V(3.4, 0.86, -3.28), V(3.4, 0.86, -3.28), 40);
      tip(wt(91), 'chip', 'Funkchip', '#55ffff', [gray('billig herzustellen'), gray('braucht kaum Strom')]); }
    if (sh.id === 'rivals') { L.cables.visible = false; put(eng1, -2.7, 0, -1.6, 0.45); put(kard, 0, 0, -2.6, 0); put(nok, 2.7, 0, -1.6, -0.45); [eng1, kard, nok].forEach((p, i) => pose3(p, 'phone', t, i));
      L.e1Phone.visible = true; L.nPhone.visible = true; L.kBook.visible = false; kard.userData.head.rotation.x = 0.1; nok.userData.head.rotation.x = 0.1; eng1.userData.head.rotation.x = 0.1;
      mv(u, V(0, 1.9, 4.2), V(0, 1.85, 3.6), V(0, 1.15, -1.6), V(0, 1.15, -1.6), 50); lab.updateMatrixWorld();
      rings(0, wpos(L.e1Phone), sh.a); rings(1, wpos(kard.userData.armR).add(V(0, -0.6, 0.3)), wt(99)); rings(2, wpos(L.nPhone), wt(101));
      tag(eng1, 'Ericsson', ALLY); if (t >= wt(99)) tag(kard, 'Intel', HERO); if (t >= wt(101)) tag(nok, 'Nokia', WHITE);
      if (t >= wt(106)) { [eng1, kard, nok].forEach(p => p.userData.setFace({ angry: true })); }
      say(wt(106), 'Ericsson', ALLY, 'Unser Funk!'); say(wt(107) + 0.05, 'Intel', HERO, 'Nein, unserer!'); say(wt(108) + 0.1, 'Nokia', WHITE, 'Unserer!'); }
    if (sh.id === 'meeting' || sh.id === 'kardach' || sh.id === 'book' || sh.id === 'proposal') {
      L.cables.visible = false; const seat = (p, i, ph) => { put(p, [-1.3, 0, 1.3][i], 0, -0.55, 0); pose3(p, 'idle', t, ph); sitPose(p, 0.52); p.userData.armL.rotation.x = p.userData.armR.rotation.x = -1.3; };
      if (sh.id !== 'proposal') seat(kard, 0, 0); seat(eng1, 1, 1); seat(nok, 2, 2);
      if (sh.id === 'meeting') { mv(u, V(0.3, 1.75, 3.4), V(0.2, 1.72, 2.9), V(0, 1.05, -0.6), V(0, 1.05, -0.6), 48); tag(kard, 'Intel', HERO); tag(eng1, 'Ericsson', ALLY); tag(nok, 'Nokia', WHITE); info(wt(114), '1996: Die Firmen treffen sich'); }
      if (sh.id === 'kardach') { L.kBook.visible = true; kard.userData.armR.rotation.x = -1.45; kard.userData.head.rotation.x = 0.3; eng1.userData.head.rotation.y = 0.5; nok.userData.head.rotation.y = 0.3;
        mv(u, V(-0.6, 1.62, 2.3), V(-0.7, 1.6, 1.8), V(-1.3, 1.15, -0.5), V(-1.3, 1.15, -0.5), 46); tag(kard, 'Jim Kardach (Intel)', HERO); }
      if (sh.id === 'book') { L.openBook.visible = true; L.openBook.position.set(-1.3, 0.83, 0.15); L.openBook.rotation.set(0, 0, 0);
        mv(u, V(-1.18, 1.42, 0.72), V(-1.2, 1.36, 0.62), V(-1.3, 0.86, 0.1), V(-1.3, 0.86, 0.1), 42);
        tip(wt(126), 'book', 'Wikinger-Roman', '#ffaa00', [gray('„Röde Orm“ (1941)'), gray('mit König Harald Blauzahn')]); }
      if (sh.id === 'proposal') { put(kard, -2.3, 0, -1.4, 0.6); pose3(kard, 'point', t); kard.userData.armR.rotation.x = -1.9; eng1.userData.head.rotation.y = -0.6; nok.userData.head.rotation.y = -0.5;
        mv(u, V(-0.5, 1.85, 3.6), V(-0.6, 1.82, 3.0), V(-1.3, 1.3, -1.2), V(-1.3, 1.3, -1.2), 48); tag(kard, 'Jim Kardach', HERO);
        say(wt(134), 'Jim', HERO, 'Harald hat Stämme vereint ...'); say(wt(138), 'Jim', HERO, '... wir vereinen Geräte!'); }
    }
    if (sh.id === 'name' || sh.id === 'pan' || sh.id === 'stays') { L.cables.visible = false; mode = sh.id;
      if (sh.id === 'name') { put(kard, -2.25, 0, -3.9, 0.45); pose3(kard, 'point', t); kard.userData.armR.rotation.x = -2.0; kard.userData.armR.rotation.y = -0.4;
        mv(u, V(0.4, 2.5, 3.0), V(0.3, 2.48, 2.5), V(0, 1.45, -4.8), V(0, 1.48, -4.8), 50); tag(kard, 'Jim Kardach', HERO); eff(wt(147), 'Arbeitstitel', 'nur vorläufig', '#ffff55'); }
      if (sh.id === 'pan') { put(eng1, 2.2, 0, -3.8, -0.5); pose3(eng1, 'cross', t); eng1.userData.setFace({ sad: true });
        mv(u, V(-0.4, 2.5, 3.0), V(-0.3, 2.48, 2.5), V(0, 1.45, -4.8), V(0, 1.48, -4.8), 50); tag(eng1, 'Marketing', WHITE); eff(wt(157), 'Marke', 'nicht frei', BAD); }
      if (sh.id === 'stays') { [kard, eng1, nok].forEach((p, i) => { put(p, [-1.6, 0, 1.6][i], 0, -2.6, [0.25, 0, -0.25][i]); pose3(p, 'cheer', t, i * 1.4); });
        mv(u, V(0, 2.6, 3.4), V(0, 2.58, 2.9), V(0, 1.4, -4.8), V(0, 1.42, -4.8), 50); tag(kard, 'Intel', HERO); tag(eng1, 'Ericsson', ALLY); tag(nok, 'Nokia', WHITE); }
    }
    const key = mode === 'pan' ? 'pan' + Math.round(clamp01((t - wt(157)) / 0.5) * 12) : mode;
    if (boardMode !== key) { boardMode = key; drawBoard(mode, mode === 'pan' ? clamp01((t - wt(157)) / 0.5) : 0); }
  }
  // ---------- Heute / Technik ----------
  if (['radio', 'hop', 'term', 'pair', 'recognize', 'piconet'].includes(sh.id)) {
    scene = tech; exp = 1.45; const Tc = tech.userData; const { dev, lena } = Tc; hide([lena]); Tc.lPhone.visible = false;
    Object.values(dev).forEach(d => d.visible = false); Tc.links.forEach(l => l.visible = false); Tc.rings.forEach(r => r.visible = false); Tc.range.material.opacity = 0; Tc.key.visible = false;
    const D = (d, x, z, ry = 0) => { d.visible = true; d.position.set(x, 0.82, z); d.rotation.set(0, ry, 0); };
    if (sh.id === 'radio') { D(dev.phone, 0.5, -2.55, 0.2); D(dev.head, 1.55, -2.75, -0.3);
      Tc.rings.forEach((r, j) => { const ph = ((t - sh.a) * 0.7 + j / 3) % 1; r.visible = true; r.position.set(0.5, 0.86, -2.55); r.scale.setScalar(0.1 + ph * 2.6); r.material.opacity = 0.7 * (1 - ph); });
      Tc.range.position.set(0.5, 0.85, -2.55); Tc.range.material.opacity = 0.7 * clamp01((t - wt(190)) / 0.3);
      mv(u, V(1.7, 2.1, -0.4), V(1.6, 2.0, -0.7), V(0.7, 0.85, -2.6), V(0.7, 0.85, -2.6), 50);
      tip(wt(186), 'wave', '<span style="font:800 36px Mont">2,4</span> Gigahertz', '#55ffff', [gray('dasselbe Funkband wie WLAN'), gray('Reichweite: meist ca. 10 m')]); }
    if (sh.id === 'hop' || sh.id === 'term') { const H = 0.13; const step = Math.floor(t / H); let idx = Math.floor(hsh(step) * 79); if (idx >= 9 && idx <= 31) idx = (idx + 30) % 79;
      const frac = clamp01((t - step * H) / 0.04); let prev = Math.floor(hsh(step - 1) * 79); if (prev >= 9 && prev <= 31) prev = (prev + 30) % 79;
      Tc.lanes.forEach((l, i) => { l.material.emissiveIntensity = i === idx ? 2.2 * frac + 0.2 : 0.2; l.material.opacity = i === idx ? 0.95 : 0.5; }); Tc.sig.position.set(lerp((prev - 39) * 0.2, (idx - 39) * 0.2, frac), 1.3 + Math.sin(frac * Math.PI) * 0.3, 0.6);
      if (sh.id === 'hop') { mv(u, V(47.5, 4.2, 9.5), V(48.3, 4.0, 9.0), V(60.5, 1.2, 0), V(60.5, 1.2, 0), 50); tagAt(V(60 + (20 - 39) * 0.2, 3.3, 0), 'WLAN', BAD); eff(wt(200), 'Sprünge', '1600 pro Sekunde', '#55aaff'); }
      else { mv(u, V(64.5, 2.4, 7.0), V(64.2, 2.35, 6.5), V(57.0, 1.3, 0), V(57.0, 1.3, 0), 48); tip(wt(209), 'hop', 'Frequenzsprung', '#55aaff', [gray('79 Kanäle'), gray('1600 Wechsel pro Sekunde')]); } }
    if (sh.id === 'pair') { D(dev.phone, 0.4, -2.5, 0.2); D(dev.head, 1.05, -2.65, -0.3);
      const k = smoother((t - wt(213)) / (wt(218) - wt(213))); Tc.key.visible = t >= wt(212); Tc.key.position.set(lerp(0.4, 1.0, k), 0.95 + Math.sin(k * Math.PI) * 0.45, lerp(-2.5, -2.65, k)); Tc.key.rotation.set(0, t * 2.5, 0);
      mv(u, V(0.75, 1.75, -0.2), V(0.73, 1.7, -0.45), V(0.72, 1.05, -2.6), V(0.72, 1.05, -2.6), 46);
      tip(wt(212), 'key', 'Kopplung', '#ffd23f', [gray('einmal einen geheimen'), gray('Schlüssel austauschen')]); }
    if (sh.id === 'recognize') { put(lena, 0.45, 0, -1.4, 0.15); pose3(lena, 'phone', t); Tc.lPhone.visible = true; lena.userData.head.rotation.x = 0.05;
      mv(u, V(0.75, 1.72, 1.35), V(0.72, 1.7, 0.9), V(0.45, 1.45, -1.4), V(0.45, 1.45, -1.4), 46); tag(lena, 'Lena', WHITE); chat(wt(222), green('Verbunden: Kopfhörer')); }
    if (sh.id === 'piconet') { const cx = 0.4, cz = -2.65; D(dev.phone, cx, cz, 0);
      const ring = [dev.head, dev.watch, dev.speaker, dev.mouse, dev.keys, dev.pad, dev.buds];
      ring.forEach((d, i) => { const a = i / 7 * Math.PI * 2 + 0.3; const x = cx + Math.cos(a) * 0.62, z = cz + Math.sin(a) * 0.5; D(d, x, z, -a * 0.3);
        const on = t >= wt(233) + i * 0.12; const l = Tc.links[i]; l.visible = on; if (on) { const dx = x - cx, dz = z - cz, len = Math.hypot(dx, dz); l.scale.set(len, 1, 1); l.position.set((x + cx) / 2, 0.9, (z + cz) / 2); l.rotation.set(0, -Math.atan2(dz, dx), 0); l.material.opacity = 0.55 + 0.35 * Math.sin(t * 9 - i); } });
      mv(u, V(0.4, 2.35, -1.55), V(0.4, 2.28, -1.7), V(0.4, 0.82, -2.75), V(0.4, 0.82, -2.75), 50); if (t >= wt(228)) tagAt(V(cx, 1.05, cz), 'Taktgeber', HERO); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  book: '<rect x="1" y="1" width="6" height="6" fill="#7a2a1a"/><rect x="2" y="1" width="4" height="5" fill="#e8dcc0"/><rect x="3" y="2" width="2" height="1" fill="#7a5a3a"/><rect x="3" y="4" width="2" height="1" fill="#7a5a3a"/>',
  tooth: '<rect x="2" y="1" width="4" height="3" fill="#e8f0ff"/><rect x="1" y="2" width="1" height="2" fill="#e8f0ff"/><rect x="6" y="2" width="1" height="2" fill="#e8f0ff"/><rect x="2" y="4" width="1" height="3" fill="#e8f0ff"/><rect x="5" y="4" width="1" height="3" fill="#e8f0ff"/><rect x="3" y="2" width="2" height="2" fill="#3a5ad8"/>',
  chip: '<rect x="2" y="2" width="4" height="4" fill="#1a1a1e"/><rect x="1" y="2" width="1" height="1" fill="#d0d4d8"/><rect x="1" y="5" width="1" height="1" fill="#d0d4d8"/><rect x="6" y="2" width="1" height="1" fill="#d0d4d8"/><rect x="6" y="5" width="1" height="1" fill="#d0d4d8"/><rect x="3" y="3" width="2" height="2" fill="#55ffff"/>',
  wave: '<rect x="3" y="5" width="2" height="2" fill="#55ffff"/><rect x="2" y="3" width="1" height="2" fill="#55ffff"/><rect x="5" y="3" width="1" height="2" fill="#55ffff"/><rect x="1" y="1" width="1" height="3" fill="#55ffff"/><rect x="6" y="1" width="1" height="3" fill="#55ffff"/>',
  hop: '<rect x="1" y="5" width="1" height="2" fill="#55aaff"/><rect x="3" y="2" width="1" height="5" fill="#55aaff"/><rect x="5" y="4" width="1" height="3" fill="#55aaff"/><rect x="6" y="1" width="1" height="6" fill="#55aaff"/>',
  key: '<rect x="1" y="2" width="3" height="3" fill="#f0c030"/><rect x="2" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="3" width="3" height="1" fill="#f0c030"/><rect x="6" y="4" width="1" height="1" fill="#f0c030"/><rect x="5" y="4" width="1" height="2" fill="#f0c030"/>',
  crown: '<rect x="1" y="3" width="6" height="3" fill="#f0c030"/><rect x="1" y="1" width="1" height="2" fill="#f0c030"/><rect x="3" y="2" width="2" height="1" fill="#f0c030"/><rect x="6" y="1" width="1" height="2" fill="#f0c030"/><rect x="3" y="4" width="2" height="1" fill="#e84a4a"/>',
  rune: '<rect x="3" y="0" width="1" height="8" fill="#55aaff"/><rect x="1" y="2" width="1" height="1" fill="#55aaff"/><rect x="2" y="3" width="1" height="1" fill="#55aaff"/><rect x="2" y="5" width="1" height="1" fill="#55aaff"/><rect x="1" y="6" width="1" height="1" fill="#55aaff"/><rect x="4" y="1" width="1" height="1" fill="#55aaff"/><rect x="5" y="2" width="1" height="1" fill="#55aaff"/><rect x="4" y="3" width="1" height="1" fill="#55aaff"/><rect x="5" y="4" width="1" height="1" fill="#55aaff"/><rect x="4" y="5" width="1" height="1" fill="#55aaff"/>',
};
const FB = h => h.replace(/(^|>)([^<]+)/g, (m, a, b) => a + b.replace(/B/g, '<span style="font-family:Mont;font-weight:800;font-size:0.82em">B</span>'));
function drawUI(t, ui) {
  let cur = null, ci = -1; words.forEach((w, i) => { if (t >= w[1] - 0.02) { cur = w; ci = i; } });
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const m = txt.match(/^(.*?)([.,:!?]*)$/); const NUM = { 'tausend': '1000', 'neunzehnhundertvierundneunzig': '1994', 'neunzehnhundertsechsundneunzig': '1996', 'sechzehnhundertmal': '1600-mal', 'neunundsiebzig': '79', 'sieben': '7' };
    if (NUM[m[1]]) txt = NUM[m[1]] + m[2]; if (ci >= 186 && ci <= 188) txt = '2,4';
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = FB(ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join(''));
  chatEl.innerHTML = FB(ui.chat.slice(-5).join('<br>'));
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#2a2a2a"/><rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/></svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div><div style="color:#aaaaaa">${ui.eff.time}</div></div></div>`;
  if (ui.toast) ex += `<div class="toast" style="opacity:${ui.toast.o};transform:translateY(${ui.toast.y}px)"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.toast.icon]}</svg><div><div class="t1">${ui.toast.l1}</div><div class="t2">${ui.toast.l2}</div></div></div>`;
  extraEl.innerHTML = FB(ex);
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
