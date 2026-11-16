// „Kommunismus, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
    c.fillStyle = hex(shade(o.beardCol ?? o.hair, 0.85)); c.fillRect(1, 3, 2, 1); c.fillRect(5, 3, 2, 1);
    c.fillStyle = '#ffffff'; c.fillRect(1, 4, 2, 1); c.fillRect(5, 4, 2, 1); c.fillStyle = o.eye ?? '#3a2a1a'; c.fillRect(2, 4, 1, 1); c.fillRect(5, 4, 1, 1);
    c.fillStyle = hex(shade(o.skin, 0.84)); c.fillRect(3, 5, 2, 1);
    c.fillStyle = o.smile ? '#7a3a30' : '#8a4a40'; c.fillRect(3, 6, 2, 1); if (o.smile) { c.fillRect(2, 5, 1, 1); c.fillRect(5, 5, 1, 1); }
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
  g.userData = { legL, legR, armL, armR, head, body, s }; return g;
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

// =====================================================================
// SET 1: England 1848 – Fabrikstraße & Industriestadt (warmer Smog)
// =====================================================================
const eng = new THREE.Scene(); eng.userData.upd = [];
{
  skyDome(eng, 0x6e88a8, 0xc9b08a, 0xe2c08e, V(-0.5, 0.18, -1));
  eng.fog = new THREE.Fog(0xcdb48c, 70, 360);
  eng.add(box(600, 1, 600, M(T.dirt), 0, -0.5, 0, { cast: false }));
  eng.add(box(9, 0.06, 360, M(T.cobble), 0, 0.03, -100, { cast: false }));
  eng.add(box(2, 0.18, 360, C(0x8a847c), -5.5, 0.09, -100, { cast: false })); eng.add(box(2, 0.18, 360, C(0x8a847c), 5.5, 0.09, -100, { cast: false }));
  const r = rng(11), win = M(T.window, { emissive: 0xffa040, ei: 1.1 }), wd = M(T.windowDark);
  const bricks = [M(T.brick), M(T.brickDark), M(T.brickGrey)];
  const smokes = [];
  function factory(x, z, w, d, h, side, chim) {
    const g = new THREE.Group(); g.position.set(x, 0, z); const bm = bricks[Math.floor(r() * 3)];
    g.add(box(w, h, d, bm, 0, h / 2, 0));
    for (let s = 0; s < 3; s++) g.add(box(w + 0.4 - s * 1.6, 0.9, d + 0.4, M(T.roof), 0, h + 0.45 + s * 0.9, 0)); // Sägedach-Andeutung
    const face = -side * (w / 2 + 0.03);
    for (let fy = 1.6; fy < h - 1; fy += 2.4) for (let fz = -d / 2 + 1.5; fz <= d / 2 - 1.5; fz += 2.2) { const m = box(0.1, 1.3, 1.1, r() < 0.4 ? win : wd, face, fy, fz, { cast: false }); g.add(m); }
    if (chim) { const chH = h + 12 + r() * 6, cx = side * (w / 2 - 1.2), cz = d / 2 - 1.5; g.add(box(1.6, chH, 1.6, bm, cx, chH / 2, cz)); g.add(box(2.0, 0.6, 2.0, C(0x3a2a22), cx, chH + 0.3, cz)); smokes.push(smoke(eng, x + cx, chH + 0.6, z + cz, 14, Math.floor(r() * 999))); }
    eng.add(g); return g;
  }
  for (let i = 0; i < 18; i++) { const z = 14 - i * 15; factory(-10.5, z, 11, 13, 8 + Math.floor(r() * 4), -1, i % 2 === 0); factory(10.5, z - 4, 11, 13, 8 + Math.floor(r() * 4), 1, i % 2 === 1); }
  // Skyline weiter hinten
  for (let i = 0; i < 70; i++) { const x = (r() < 0.5 ? -1 : 1) * (28 + r() * 120), z = 40 - r() * 260; const h = 6 + r() * 10;
    const g = box(8 + r() * 8, h, 8 + r() * 8, bricks[i % 3], x, h / 2, z); eng.add(g);
    if (r() < 0.45) { const chh = h + 14 + r() * 10; eng.add(box(1.8, chh, 1.8, bricks[(i + 1) % 3], x + 2, chh / 2, z)); smokes.push(smoke(eng, x + 2, chh, z, 10, i + 50)); } }
  eng.userData.smokes = smokes;
  eng.userData.sun = sunLight(eng, 0xffd29a, 3.2, V(-60, 55, -40), V(0, 0, -10), 60);
  eng.add(new THREE.HemisphereLight(0xc8d0e0, 0x6a5240, 1.4));
  // Laternen, Kisten, Fässer als Details
  for (let z = 10; z > -90; z -= 12) { eng.add(box(0.15, 3.2, 0.15, C(0x2a2a2a), -4.6, 1.6, z)); eng.add(box(0.4, 0.5, 0.4, M(T.window, { emissive: 0xffa040, ei: 0.8 }), -4.6, 3.35, z)); }
  for (let i = 0; i < 10; i++) eng.add(box(0.8, 0.8, 0.8, M(T.planks), 4.4 - r() * 0.3, 0.4 + (i % 3 === 2 ? 0.8 : 0), -3 - i * 9 + (i % 3) * 0.9));
  // Figuren Hook
  const marx = humanoid({ skin: 0xe0b090, hair: 0xd8d4cc, beardCol: 0xcfcac0, beard: 'full', hairVol: true, top: 0x23252b, bottom: 0x2c2e34, coat: true, eye: '#4a3a2a', seed: 1 });
  const engels = humanoid({ skin: 0xe6b896, hair: 0x7a4a24, beard: 'short', top: 0x3a3226, bottom: 0x2e2a24, coat: true, tie: 0x7a1a1a, eye: '#3a5a7a', seed: 2 });
  marx.position.set(-0.75, 0, 0); marx.rotation.y = 0.12; engels.position.set(0.75, 0, 0.1); engels.rotation.y = -0.3;
  eng.add(marx, engels); eng.userData.marx = marx; eng.userData.engels = engels;
  const passer = humanoid({ skin: 0xd8a882, hair: 0x3a2a1a, top: 0x5a4a3a, bottom: 0x3a3a3a, hat: 'cap', seed: 3 }); eng.add(passer); eng.userData.passer = passer;
  // Platz für „Idee“: Marx auf Kiste, Arbeiter drumherum, rote Fahne
  const sq = new THREE.Group(); sq.position.set(0, 0, -62); eng.add(sq);
  sq.add(box(1.2, 0.7, 1.2, M(T.planks), 0, 0.35, 0));
  const marx2 = humanoid({ skin: 0xe0b090, hair: 0xd8d4cc, beardCol: 0xcfcac0, beard: 'full', hairVol: true, top: 0x23252b, bottom: 0x2c2e34, coat: true, eye: '#4a3a2a', seed: 1 });
  marx2.position.set(0, 0.7, 0); marx2.userData.baseY = 0.7; marx2.rotation.y = 0.2; sq.add(marx2);
  const workers = []; const wc = [0x5a4a3a, 0x4a5a6a, 0x6a5a4a, 0x3a4a3a, 0x5a3a3a, 0x4a4a5a, 0x6a6a5a];
  for (let i = 0; i < 9; i++) { const a = -0.3 + i * 0.32 + (i > 4 ? 0.9 : 0), rad = 2.6 + (i % 2) * 1.0; const w = humanoid({ skin: [0xd8a882, 0xe6b896, 0xc89a72][i % 3], hair: [0x3a2a1a, 0x6a4a2a, 0x1a1a1a][i % 3], top: wc[i % wc.length], bottom: 0x3a3a3a, hat: i % 2 ? 'cap' : undefined, seed: 10 + i });
    w.position.set(Math.sin(a) * rad, 0, Math.cos(a) * rad); w.lookAt(sq.position.clone().add(V(0, 0, 0))); w.rotation.y = Math.atan2(-w.position.x, -w.position.z); sq.add(w); workers.push(w); }
  eng.userData.sq = { sq, marx2, workers };
  eng.userData.sqFlag = flag(flagTex.red, 2.2, 1.4, 4.5, eng, V(1.6, 0, -62 + 2.0), 0.4, 0.5);
  // Gleichheit: Besitzer + Arbeiter nebeneinander (für „Keine Reichen, keine Armen“)
  const owner2 = humanoid({ skin: 0xf0c0a0, hair: 0x2a2a2a, beard: 'mustache', top: 0x111114, bottom: 0x1a1a1e, coat: true, hat: 'top', tie: 0xffffff, seed: 30 }); owner2.userData.hatExtra = 0.45;
  const worker2 = humanoid({ skin: 0xd8a882, hair: 0x3a2a1a, top: 0x5a4a3a, bottom: 0x3a3a3a, hat: 'cap', seed: 31 });
  owner2.position.set(-0.7, 0, -80); worker2.position.set(0.7, 0, -80); owner2.rotation.y = 0.5; worker2.rotation.y = -0.5; eng.add(owner2, worker2); eng.userData.eq = { owner2, worker2 };
}

// =====================================================================
// SET 2: Fabrikhalle (Licht durch hohe Fenster)
// =====================================================================
const fac = new THREE.Scene(); fac.background = new THREE.Color(0x1a1612);
{
  const br = M(T.brickDark), fl = M(T.planks);
  fac.add(box(22, 0.2, 44, M(T.cobble), 0, -0.1, 0));
  fac.add(box(0.4, 10, 44, br, 11.2, 5, 0)); fac.add(box(22, 10, 0.4, br, 0, 5, -22)); fac.add(box(22, 10, 0.4, br, 0, 5, 22.2));
  // linke Wand mit hohen Fenstern
  for (let z = -21; z <= 21; z += 6) { fac.add(box(0.4, 10, 3, br, -11.2, 5, z)); fac.add(box(0.4, 4.5, 3.2, br, -11.2, 2.25, z + 3)); fac.add(box(0.4, 1.4, 3.2, br, -11.2, 9.3, z + 3)); }
  for (let z = -18; z <= 22; z += 6) { const g = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.1), new THREE.MeshBasicMaterial({ color: 0xf2e2bc })); g.rotation.y = Math.PI / 2; g.position.set(-11.6, 6.6, z); fac.add(g); }
  fac.add(box(23, 0.4, 45, C(0x2a2420), 0, 10.2, 0));
  for (let z = -20; z <= 20; z += 4) fac.add(box(22, 0.4, 0.4, M(T.darkwood), 0, 9.6, z));
  sunLight(fac, 0xffe0b0, 5.5, V(-30, 22, -6), V(0, 0, 0), 26);
  fac.add(new THREE.HemisphereLight(0xb0bccc, 0x5a4a3a, 2.0));
  for (const [lx, lz] of [[3, 8], [-3, 0], [3, -8]]) { const lamp = new THREE.PointLight(0xffa860, 30, 22, 1.4); lamp.position.set(lx, 7, lz); fac.add(lamp); }
  // Maschinen mit drehenden Rädern + Transmissionswelle
  const metal = M(T.metal, { rough: 0.55, metal: 0.4 }), wheelM = C(0x5a3a22), beltM = C(0x2a1c14);
  const wheels = [], workers = [];
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = 12 - i * 5.2, x = side * 4.2;
    fac.add(box(2.4, 1.6, 2.6, metal, x, 0.8, z)); fac.add(box(2.6, 0.2, 2.8, C(0x26282c), x, 1.7, z));
    const wh = new THREE.Group(); wh.position.set(x + side * 1.3, 1.6, z); const sp = box(0.12, 1.8, 0.12, wheelM, 0, 0, 0); const sp2 = sp.clone(); sp2.rotation.x = Math.PI / 2; wh.add(sp, sp2, box(0.14, 0.4, 0.4, metal, 0, 0, 0));
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const sg = box(0.16, 0.7, 0.18, wheelM, 0, Math.cos(a) * 0.85, Math.sin(a) * 0.85); sg.rotation.x = -a; wh.add(sg); }
    fac.add(wh); wheels.push(wh); wh.rotation.order = 'YXZ';
    fac.add(box(0.1, 7.6, 0.18, beltM, x + side * 1.3, 5.4, z + 0.8));
    const w = humanoid({ skin: [0xd8a882, 0xe6b896, 0xc89a72][i % 3], hair: [0x3a2a1a, 0x6a4a2a, 0x1a1a1a][i % 3], top: [0x5a4a3a, 0x4a5a6a, 0x6a5a4a][i % 3], bottom: 0x3a3a3a, hat: i % 2 ? 'cap' : undefined, seed: 50 + i + side * 7 });
    w.position.set(x - side * 1.75, 0, z); w.rotation.y = side * Math.PI / 2; fac.add(w); workers.push(w);
  }
  const shaft = new THREE.Group(); for (const sx of [-1, 1]) { const s = box(0.3, 0.3, 40, metal, sx * 5.5, 9.0, 0); shaft.add(s); } fac.add(shaft);
  const child = humanoid({ skin: 0xe6b896, hair: 0x8a5a2a, top: 0x6a5a48, bottom: 0x4a3e32, hat: 'cap', hatCol: 0x5a4a3a, seed: 70, scale: 0.62 });
  const crate = box(0.55, 0.45, 0.4, M(T.planks), 0, 1.15, 0.42); child.add(crate); fac.add(child);
  fac.userData = { wheels, workers, child };
}

// =====================================================================
// SET 3: Innenräume (je eigene Szene, eigenes Licht)
// =====================================================================
function roomShell(scene, w, d, h, wallTex, floorTex, openFront = true) {
  scene.add(box(w, 0.2, d, M(floorTex), 0, -0.1, 0));
  scene.add(box(w, h, 0.3, M(wallTex), 0, h / 2, -d / 2)); scene.add(box(0.3, h, d, M(wallTex), -w / 2, h / 2, 0)); scene.add(box(0.3, h, d, M(wallTex), w / 2, h / 2, 0));
  if (!openFront) scene.add(box(w, h, 0.3, M(wallTex), 0, h / 2, d / 2));
}
// Büro des Fabrikbesitzers
const office = new THREE.Scene(); office.background = new THREE.Color(0x120c08);
{
  roomShell(office, 9, 9, 5, T.darkwood, T.planks);
  // großes Fenster mit Smog-Himmel
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), new THREE.MeshBasicMaterial({ color: 0xe8c890 })); sky.position.set(0, 2.6, -4.3); office.add(sky);
  office.add(box(4.3, 0.15, 0.2, M(T.darkwood), 0, 1.25, -4.25)); office.add(box(0.15, 2.8, 0.2, M(T.darkwood), 0, 2.6, -4.25)); office.add(box(4.3, 0.15, 0.2, M(T.darkwood), 0, 3.95, -4.25));
  // Schornsteine draußen (Silhouette)
  for (const x of [-1.2, 0.9]) office.add(box(0.35, 2.2, 0.1, C(0x7a5a48), x, 2.3, -4.35, { cast: false }));
  office.add(box(3.2, 0.12, 1.4, M(T.darkwood), 0, 1.0, -1.2)); for (const x of [-1.45, 1.45]) office.add(box(0.2, 1.0, 1.3, M(T.darkwood), x, 0.5, -1.2));
  const goldM = M(T.gold, { rough: 0.35, metal: 0.6 }); const gr = rng(81);
  const pile = new THREE.Group(); office.add(pile);
  for (let i = 0; i < 26; i++) { const s = 0.28; pile.add(box(s, s * 0.6, s, goldM, -1.2 + gr() * 1.0 + (i > 13 ? 1.6 : 0), 1.1 + (i % 4) * 0.17, -1.5 + gr() * 0.6)); }
  for (let i = 0; i < 18; i++) office.add(box(0.5, 0.5, 0.5, goldM, -3.5 + (i % 3) * 0.52, 0.25 + Math.floor(i / 9) * 0.5, -3.6 + Math.floor((i % 9) / 3) * 0.52));
  const owner = humanoid({ skin: 0xf0c0a0, hair: 0x2a2a2a, beard: 'mustache', top: 0x111114, bottom: 0x1a1a1e, coat: true, hat: 'top', tie: 0xffffff, smile: true, seed: 30 }); owner.userData.hatExtra = 0.45;
  owner.position.set(0, 0, -2.4); office.add(owner);
  sunLight(office, 0xffe2b0, 3.0, V(1, 8, -12), V(0, 0, 0), 8, 1024);
  office.add(new THREE.HemisphereLight(0xc8b898, 0x2a1a10, 1.2));
  const lampL = new THREE.PointLight(0xffb070, 6, 7, 1.5); lampL.position.set(1.3, 1.9, -0.8); office.add(lampL);
  office.add(box(0.3, 0.35, 0.3, M(T.window, { emissive: 0xffa040, ei: 1.2 }), 1.3, 1.25, -1.0));
  const coins = particlesBurst(office, 24, [0xffd84a, 0xf0b020], 82, 0.09); coins.position.set(0, 2.2, -1.3);
  office.userData = { owner, coins };
}
// Arme Arbeiterwohnung
const home = new THREE.Scene(); home.background = new THREE.Color(0x0a0a0c);
{
  roomShell(home, 6, 6, 3.4, T.planks, T.planks);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: 0x8ea0c0 })); win.position.set(-1.6, 2.1, -2.84); home.add(win);
  home.add(box(1.0, 0.08, 0.1, M(T.darkwood), -1.6, 2.1, -2.82)); home.add(box(0.08, 1.0, 0.1, M(T.darkwood), -1.6, 2.1, -2.82));
  home.add(box(1.8, 0.1, 1.0, M(T.darkwood), 0, 0.82, -0.8)); for (const x of [-0.8, 0.8]) for (const z of [-1.2, -0.4]) home.add(box(0.1, 0.8, 0.1, M(T.darkwood), x, 0.4, z));
  const bowl = new THREE.Group(); bowl.add(box(0.36, 0.06, 0.36, C(0x8a6a4a), 0, 0, 0)); bowl.add(box(0.36, 0.1, 0.04, C(0x8a6a4a), 0, 0.07, 0.16)); bowl.add(box(0.36, 0.1, 0.04, C(0x8a6a4a), 0, 0.07, -0.16)); bowl.add(box(0.04, 0.1, 0.36, C(0x8a6a4a), 0.16, 0.07, 0)); bowl.add(box(0.04, 0.1, 0.36, C(0x8a6a4a), -0.16, 0.07, 0));
  bowl.position.set(-0.3, 0.9, -0.6); home.add(bowl);
  home.add(box(0.08, 0.2, 0.08, C(0xe8e0c8), 0.5, 0.97, -0.9)); home.add(box(0.05, 0.08, 0.05, new THREE.MeshBasicMaterial({ color: 0xffc860 }), 0.5, 1.11, -0.9, { cast: false }));
  const candle = new THREE.PointLight(0xffa850, 4.5, 6, 1.6); candle.position.set(0.5, 1.25, -0.8); candle.castShadow = true; candle.shadow.mapSize.set(512, 512); home.add(candle);
  home.add(new THREE.HemisphereLight(0x6a7a9a, 0x1a120a, 0.55));
  sunLight(home, 0x9fb4d8, 1.2, V(-3, 6, -8), V(0, 0, 0), 5, 1024);
  for (const x of [-0.45, 0.55]) home.add(box(0.5, 0.5, 0.5, M(T.planks), x, 0.25, 0.1));
  const father = humanoid({ skin: 0xd8a882, hair: 0x3a2a1a, top: 0x5a4a3a, bottom: 0x3a3a3a, hat: 'cap', seed: 90 });
  const kid = humanoid({ skin: 0xe6b896, hair: 0x8a5a2a, top: 0x6a5a48, bottom: 0x4a3e32, seed: 91, scale: 0.62 });
  father.position.set(-0.45, 0, 0.12); kid.position.set(0.55, 0, 0.12); father.rotation.y = kid.rotation.y = Math.PI; home.add(father, kid);
  home.userData = { father, kid };
}
// Marx' Arbeitszimmer
const study = new THREE.Scene(); study.background = new THREE.Color(0x0a0806);
{
  roomShell(study, 8, 8, 4.2, T.wallpaperBeige, T.planks);
  for (let i = 0; i < 3; i++) { study.add(box(2.2, 3.6, 0.6, M(T.books), -2.6 + i * 2.25, 1.8, -3.6, { uvScale: 1 })); }
  study.add(box(0.6, 3.6, 3.0, M(T.books), -3.6, 1.8, -1.5));
  study.add(box(2.4, 0.12, 1.2, M(T.darkwood), 0.6, 0.95, -0.9)); for (const x of [-0.5, 1.7]) study.add(box(0.15, 0.95, 1.1, M(T.darkwood), x, 0.47, -0.9));
  const paper = C(0xe8e0c8); for (let i = 0; i < 6; i++) study.add(box(0.42, 0.02 + i * 0.012, 0.56, paper, 1.35, 1.02 + i * 0.012, -1.0 + (i % 2) * 0.03, { cast: false }));
  const ms = tex(16, 20, (c) => { c.fillStyle = '#e8e0c8'; c.fillRect(0, 0, 16, 20); c.fillStyle = '#7a1a1a'; c.fillRect(2, 2, 12, 1); c.fillRect(3, 4, 10, 1); c.fillStyle = '#4a3a2a'; for (let y = 7; y < 18; y += 2) c.fillRect(2, y, 8 + (y % 4), 1); }, 95);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.58), M(ms, { rough: 0.8 })); sheet.rotation.x = -Math.PI / 2; sheet.position.set(0.55, 1.015, -0.8); study.add(sheet);
  study.add(box(0.1, 0.22, 0.1, C(0xe8e0c8), -0.3, 1.12, -1.2)); study.add(box(0.06, 0.08, 0.06, new THREE.MeshBasicMaterial({ color: 0xffd070 }), -0.3, 1.27, -1.2, { cast: false }));
  const cl = new THREE.PointLight(0xffa850, 7, 8, 1.5); cl.position.set(-0.3, 1.5, -1.0); cl.castShadow = true; cl.shadow.mapSize.set(1024, 1024); study.add(cl);
  study.add(new THREE.HemisphereLight(0x8a8aa8, 0x2a1a10, 0.7));
  sunLight(study, 0x9fb0d0, 0.9, V(6, 8, 6), V(0, 0, -1), 6, 1024);
  study.add(box(0.5, 0.5, 0.5, M(T.darkwood), 0.55, 0.25, 0.0));
  const marx = humanoid({ skin: 0xe0b090, hair: 0x5a4a3a, beardCol: 0x4a3c30, beard: 'full', hairVol: true, top: 0x23252b, bottom: 0x2c2e34, coat: true, eye: '#4a3a2a', seed: 1 });
  marx.position.set(0.55, 0, 0.0); marx.rotation.y = Math.PI; study.add(marx);
  const engels = humanoid({ skin: 0xe6b896, hair: 0x7a4a24, beard: 'short', top: 0x3a3226, bottom: 0x2e2a24, coat: true, tie: 0x7a1a1a, eye: '#3a5a7a', seed: 2 });
  engels.position.set(-0.9, 0, 0.1); engels.rotation.y = Math.PI - 0.6; study.add(engels);
  study.userData = { marx, engels, sheet };
}
// Stalins Büro
const kreml = new THREE.Scene(); kreml.background = new THREE.Color(0x0a0505);
{
  roomShell(kreml, 9, 9, 5, T.wallpaperRed, T.planks);
  kreml.add(box(3.4, 0.12, 1.4, M(T.darkwood), 0, 1.0, -1.6)); for (const x of [-1.5, 1.5]) kreml.add(box(0.25, 1.0, 1.3, M(T.darkwood), x, 0.5, -1.6));
  kreml.add(box(1.6, 0.06, 0.2, C(0x2a6a2a), -0.6, 1.08, -1.4));
  const stalin = humanoid({ skin: 0xd8a882, hair: 0x2a2420, beard: 'mustache', beardCol: 0x1a1612, hairVol: true, top: 0x8a8462, bottom: 0x6a644a, belt: 0x3a2a1a, eye: '#3a2a1a', seed: 120 });
  stalin.position.set(0, 0, -2.7); kreml.add(stalin);
  flag(flagTex.soviet, 1.9, 1.2, 3.6, kreml, V(-3.2, 0, -3.6), 0, 0); flag(flagTex.soviet, 1.9, 1.2, 3.6, kreml, V(2.2, 0, -3.6), 0, 2);
  kreml.userData.flags = kreml.children.filter(c => c.userData.update);
  sunLight(kreml, 0xffe0c0, 2.4, V(4, 9, 6), V(0, 0, -2), 8, 1024);
  kreml.add(new THREE.HemisphereLight(0xb0a090, 0x2a1010, 1.0));
  const l = new THREE.PointLight(0xffb070, 8, 8, 1.6); l.position.set(-1.0, 1.6, -1.2); kreml.add(l);
  kreml.add(box(0.3, 0.35, 0.3, M(T.window, { emissive: 0x6aff6a, ei: 0.4 }), -1.0, 1.25, -1.5));
  kreml.userData.stalin = stalin;
}
// DDR-Laden (leere Regale)
const shop = new THREE.Scene(); shop.background = new THREE.Color(0x101210);
{
  roomShell(shop, 10, 12, 3.6, T.shopWall, T.lino);
  const shelf = M(T.darkwood);
  for (const x of [-3.5, -1.0, 1.5]) { for (let y = 0; y < 4; y++) shop.add(box(0.8, 0.06, 6, C(0xd0ccbc), x, 0.3 + y * 0.6, -2.0)); shop.add(box(0.8, 2.3, 0.06, C(0xb0ac9c), x, 1.15, -5.0)); shop.add(box(0.8, 2.3, 0.06, C(0xb0ac9c), x, 1.15, 1.0)); }
  // ein paar einsame Dosen
  for (const [x, y, z] of [[-3.5, 0.95, -3.1], [1.5, 1.55, -0.4], [1.5, 1.55, -0.2]]) shop.add(box(0.16, 0.22, 0.16, C(0x8a9a5a), x, y, z));
  for (let i = 0; i < 4; i++) { const l = box(1.6, 0.06, 0.25, new THREE.MeshBasicMaterial({ color: 0xf0f6ff }), -1 + (i % 2) * 2.5, 3.5, -4 + Math.floor(i / 2) * 4, { cast: false }); shop.add(l); }
  const rect = new THREE.PointLight(0xe8f0ff, 10, 14, 1.2); rect.position.set(0, 3.2, -2); shop.add(rect);
  shop.add(new THREE.HemisphereLight(0xdde6ee, 0x6a6a5a, 1.4));
  sunLight(shop, 0xeef4ff, 1.4, V(3, 10, 6), V(0, 0, -2), 9, 1024);
  shop.add(box(3, 1.0, 0.8, C(0x8a7a5a), 3.4, 0.5, 2.5)); // Kasse
  const queue = []; const cl = [0x6a7a9a, 0x9a5a4a, 0x5a7a5a, 0xa08a5a, 0x7a5a8a];
  for (let i = 0; i < 5; i++) { const p = humanoid({ skin: [0xe6b896, 0xd8a882, 0xf0c0a0][i % 3], hair: [0x6a4a2a, 0x2a2a2a, 0xb8925a, 0x5a3a2a, 0x8a8a8a][i], top: cl[i], bottom: 0x3a3a4a, longHair: i % 2 === 0, skirt: i % 2 === 0, seed: 140 + i });
    p.position.set(3.4 - 0.2 * (i % 2), 0, 3.5 + i * 0.85); p.rotation.y = Math.PI; shop.add(p); queue.push(p); }
  shop.userData = { queue };
}

// =====================================================================
// SET 4: Russland (Schnee): Palast, Lenin, Verstaatlichung, Gulag, Kreml-Turm
// =====================================================================
const rus = new THREE.Scene(); rus.userData.upd = [];
{
  skyDome(rus, 0x8a96a8, 0xb8c0cc, 0xd4d8de); rus.fog = new THREE.Fog(0xc8ced6, 30, 220);
  rus.add(box(900, 1, 900, M(T.snow), 0, -0.5, 0, { cast: false }));
  const pal = M(T.palace), wht = M(T.white), roofM = C(0x6a7a78);
  // Winterpalast-artiger Bau (eigene Interpretation)
  const P = new THREE.Group(); P.position.set(0, 0, -30); rus.add(P);
  P.add(box(80, 16, 14, pal, 0, 8, 0)); P.add(box(80.6, 1.2, 14.6, roofM, 0, 16.6, 0));
  for (let x = -39; x <= 39; x += 2.6) { P.add(box(0.6, 14, 0.6, wht, x, 7.5, 7.3)); }
  for (let x = -38; x <= 38; x += 2.6) for (const y of [3.2, 8.2, 12.8]) P.add(box(1.3, 2.2, 0.1, M(T.windowDark), x + 1.3, y, 7.06, { cast: false }));
  for (let x = -38; x <= 38; x += 5.2) P.add(box(0.8, 1.4, 0.8, wht, x, 17.9, 6.5));
  // Platz mit Säule
  rus.add(box(2.6, 1.2, 2.6, C(0x9a8a7a), 0, 0.6, 18)); rus.add(box(1.4, 22, 1.4, C(0xa8988a), 0, 12, 18)); rus.add(box(1.2, 2.2, 1.2, C(0x5a5a5a), 0, 24, 18));
  // Podium, Lenin, Menge, Fahnen
  const pod = new THREE.Group(); pod.position.set(0, 0, 0); rus.add(pod);
  pod.add(box(3.2, 1.4, 2.2, M(T.redCloth), 0, 0.7, 0)); pod.add(box(3.4, 0.12, 2.4, M(T.darkwood), 0, 1.46, 0));
  const lenin = humanoid({ skin: 0xe6b896, hair: 0x8a4a2a, bald: true, beard: 'goatee', beardCol: 0x8a4a2a, top: 0x2a2a2e, bottom: 0x2a2a2e, coat: true, tie: 0x7a1a1a, hat: 'cap', hatCol: 0x2a2a2e, eye: '#3a2a1a', seed: 110 });
  lenin.position.set(0, 1.52, 0); lenin.userData.baseY = 1.52; pod.add(lenin);
  const crowd = []; const cr = rng(111);
  for (let i = 0; i < 34; i++) { const x = -9 + cr() * 18, z = 3.5 + cr() * 9; const p = humanoid({ skin: [0xd8a882, 0xe6b896, 0xc89a72][i % 3], hair: [0x3a2a1a, 0x6a4a2a, 0x1a1a1a][i % 3], top: [0x4a4a3a, 0x3a3a44, 0x5a4a3a, 0x6a6a5a, 0x4a3a3a][i % 5], bottom: 0x2a2a2a, hat: ['ushanka', 'cap', undefined][i % 3], coat: true, seed: 200 + i });
    p.position.set(x, 0, z); p.rotation.y = Math.atan2(-x, -z) + Math.PI; p.rotation.y = Math.atan2(0 - x, 0 - z); rus.add(p); crowd.push({ p, ph: cr() * 6 }); }
  const fl = []; for (let i = 0; i < 6; i++) fl.push(flag(flagTex.red, 1.8, 1.1, 4.2, rus, V(-7 + i * 2.8, 0, 6 + (i % 2) * 3), -0.2, i));
  // Verstaatlichung: Fabrik, Hof, Laden mit Fahnen
  const nat = new THREE.Group(); nat.position.set(120, 0, 0); rus.add(nat);
  nat.add(box(16, 9, 12, M(T.brick), 0, 4.5, 0)); nat.add(box(16.4, 0.8, 12.4, M(T.roof), 0, 9.4, 0)); nat.add(box(1.6, 22, 1.6, M(T.brick), 6, 11, -3));
  for (let x = -6; x <= 6; x += 2.4) nat.add(box(1.2, 1.6, 0.1, M(T.window, { emissive: 0xffa040, ei: 0.8 }), x, 3, 6.05, { cast: false }));
  const natFlag = flag(flagTex.soviet, 2.6, 1.6, 6.5, rus, V(118, 9.8, 4), 0, 0);
  const farm = new THREE.Group(); farm.position.set(200, 0, 0); rus.add(farm);
  farm.add(box(8, 5, 6, C(0x8a2a1a), 0, 2.5, -6)); for (let s = 0; s < 3; s++) farm.add(box(8.4 - s * 2.6, 1.0, 6.4, C(0x4a3a2a), 0, 5.5 + s, -6));
  for (let i = 0; i < 6; i++) farm.add(box(14, 0.5, 1.4, M(T.wheat), 0, 0.25, 1 + i * 2.2));
  for (let i = 0; i < 4; i++) farm.add(box(1.2, 1.2, 1.2, M(T.wheat), -5 + i * 1.6, 0.6, -2));
  const farmFlag = flag(flagTex.soviet, 2.2, 1.4, 5.5, rus, V(204.5, 0, -2.5), 0, 1);
  const shopB = new THREE.Group(); shopB.position.set(280, 0, 0); rus.add(shopB);
  shopB.add(box(10, 6, 8, M(T.plaster3 ?? T.white), 0, 3, 0)); shopB.add(box(10.4, 0.6, 8.4, M(T.roof), 0, 6.3, 0));
  const signTex = tex(64, 12, (c) => { c.fillStyle = '#b3201c'; c.fillRect(0, 0, 64, 12); c.fillStyle = '#ffffff'; c.font = 'bold 9px monospace'; c.fillText('ГОСМАГ', 14, 10); }, 130);
  const signB = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshStandardMaterial({ map: signTex })); signB.position.set(0, 4.6, 4.03); shopB.add(signB);
  shopB.add(box(1.6, 2.6, 0.1, M(T.darkwood), 0, 1.3, 4.03)); shopB.add(box(2.2, 1.6, 0.1, M(T.window, { emissive: 0xffa040, ei: 0.8 }), -3, 2.2, 4.03)); shopB.add(box(2.2, 1.6, 0.1, M(T.window, { emissive: 0xffa040, ei: 0.8 }), 3, 2.2, 4.03));
  const shopFlag = flag(flagTex.soviet, 1.8, 1.1, 3.2, rus, V(285.2, 6.6, 0), 0, 2);
  // Gulag
  const gl = new THREE.Group(); gl.position.set(-150, 0, 0); rus.add(gl);
  const post = C(0x4a3a2a), wire = C(0x2a2a2a);
  for (let x = -20; x <= 20; x += 2.5) { gl.add(box(0.2, 3, 0.2, post, x, 1.5, 6)); for (const y of [0.8, 1.5, 2.2, 2.9]) gl.add(box(2.5, 0.03, 0.03, wire, x + 1.25, y, 6, { cast: false })); }
  for (let z = -14; z <= 6; z += 2.5) { gl.add(box(0.2, 3, 0.2, post, -20, 1.5, z)); for (const y of [0.8, 1.5, 2.2, 2.9]) gl.add(box(0.03, 0.03, 2.5, wire, -20, y, z + 1.25, { cast: false })); }
  for (const x of [-20, 20]) { gl.add(box(0.3, 7, 0.3, post, x - 1, 3.5, 6)); gl.add(box(0.3, 7, 0.3, post, x + 1, 3.5, 6)); gl.add(box(0.3, 7, 0.3, post, x - 1, 3.5, 8)); gl.add(box(0.3, 7, 0.3, post, x + 1, 3.5, 8)); gl.add(box(2.8, 0.2, 2.8, M(T.planks), x, 7, 7)); gl.add(box(2.6, 1.6, 0.15, M(T.planks), x, 7.9, 8.3)); gl.add(box(3.0, 0.4, 3.0, M(T.darkwood), x, 9.2, 7)); }
  for (let i = 0; i < 4; i++) { gl.add(box(12, 3.4, 5, M(T.planks), -12 + (i % 2) * 15, 1.7, -4 - Math.floor(i / 2) * 8)); gl.add(box(12.4, 0.5, 5.4, M(T.snow), -12 + (i % 2) * 15, 3.6, -4 - Math.floor(i / 2) * 8)); }
  const prisoners = []; for (let i = 0; i < 9; i++) { const p = humanoid({ skin: [0xd8a882, 0xe6b896][i % 2], hair: 0x3a2a1a, top: 0x4a4a48, bottom: 0x3a3a38, hat: 'ushanka', coat: true, seed: 250 + i }); gl.add(p); prisoners.push(p); }
  const guard = humanoid({ skin: 0xd8a882, hair: 0x2a2a2a, top: 0x5a5a3a, bottom: 0x4a4a32, hat: 'military', coat: true, belt: 0x2a1a0a, seed: 260 }); guard.position.set(6, 0, 3); guard.rotation.y = -Math.PI / 2; gl.add(guard);
  // Kreml-artiger Turm mit Fahnenmast
  const kt = new THREE.Group(); kt.position.set(-300, 0, 0); rus.add(kt);
  kt.add(box(16, 10, 16, M(T.brick), 0, 5, 0)); kt.add(box(12, 10, 12, M(T.brick), 0, 15, 0)); kt.add(box(9, 8, 9, M(T.brick), 0, 24, 0)); kt.add(box(10, 0.8, 10, wht, 0, 28.4, 0));
  for (let s = 0; s < 8; s++) kt.add(box(7 - s * 0.85, 1.6, 7 - s * 0.85, C(0x3a6a4a), 0, 29.6 + s * 1.6, 0));
  kt.add(box(1.4, 1.4, 0.4, new THREE.MeshBasicMaterial({ color: 0xd02020 }), 0, 43.3, 0, { cast: false }));
  for (let x = -20; x <= 20; x += 40) kt.add(box(24, 7, 3, M(T.brick), x, 3.5, 0));
  for (let x = -31; x <= 31; x += 2) kt.add(box(1, 1.4, 3, M(T.brick), x, 7.7, 0));
  kt.add(box(5, 6, 0.2, C(0x1a1a1a), 0, 3, 8.05));
  const ktFlag = flag(flagTex.soviet, 3.6, 2.2, 9, rus, V(-300 + 10, 10, 4), 0, 0);
  rus.userData.sun = sunLight(rus, 0xe8eef8, 1.6, V(30, 60, 50), V(0, 0, 0), 60);
  rus.add(new THREE.HemisphereLight(0xdfe6f0, 0x8a8a90, 1.6));
  const snowA = snowfall(rus, V(0, 0, 12), 600, 34, 5);
  rus.userData = { ...rus.userData, lenin, crowd, fl, natFlag, farmFlag, shopFlag, gl, prisoners, guard, ktFlag, snowA };
}

// =====================================================================
// SET 5: Berliner Mauer (1961 Tag / 1989 Nacht)
// =====================================================================
const ber = new THREE.Scene();
{
  ber.userData.sky = skyDome(ber, 0x9aa6b4, 0xbcc4cc, 0xd0d4d8);
  ber.fog = new THREE.Fog(0xc0c6cc, 40, 220);
  ber.add(box(600, 1, 600, M(T.cobble), 0, -0.5, 0, { cast: false }));
  ber.add(box(400, 0.05, 12, M(T.sand), 0, 0.03, -8, { cast: false }));
  const wall = new THREE.Group(); ber.add(wall); const segs = [];
  const conc = M(T.concrete), graf = M(T.graffiti, { rough: 0.9 });
  for (let i = -30; i <= 30; i++) { const g = new THREE.Group(); g.position.set(i * 1.3, 0, 0); const front = new THREE.Mesh(new THREE.BoxGeometry(1.26, 3.6, 0.4), [conc, conc, conc, conc, graf, conc]); front.userData.isFront = true; front.position.y = 1.8; front.castShadow = front.receiveShadow = true; g.add(front);
    g.add(box(1.3, 0.4, 0.6, conc, 0, 3.75, 0)); wall.add(g); segs.push(g); }
  for (let x = -100; x <= 100; x += 40) { const t = new THREE.Group(); t.position.set(x + 8, 0, -12); t.add(box(1.4, 9, 1.4, conc, 0, 4.5, 0)); t.add(box(3.2, 2.2, 3.2, conc, 0, 10, 0)); t.add(box(3.0, 0.8, 3.0, M(T.windowDark), 0, 10.2, 0)); t.add(box(3.4, 0.3, 3.4, conc, 0, 11.25, 0)); ber.add(t); }
  for (let x = -60; x <= 60; x += 3) ber.add(box(0.1, 1.6, 0.1, C(0x3a3a3a), x, 0.8, -15));
  const hr = rng(150); for (let i = 0; i < 30; i++) { const x = -90 + i * 6.2, z = 22 + hr() * 30, h = 10 + hr() * 14; ber.add(box(5.6, h, 9, M([T.brickGrey, T.concrete, T.brick][i % 3]), x, h / 2, z)); }
  for (let i = 0; i < 26; i++) { const x = -80 + i * 6.5, h = 12 + hr() * 10; ber.add(box(5.8, h, 8, M(T.concrete), x, h / 2, -40)); }
  const soldiers = []; for (let i = 0; i < 4; i++) { const s = humanoid({ skin: 0xe6b896, hair: 0x5a4a3a, top: 0x5a6a52, bottom: 0x4a5a44, hat: 'helmet', belt: 0x2a1a0a, seed: 160 + i }); s.position.set(-6 + i * 4, 0, -5); s.rotation.y = Math.PI * 0.05; ber.add(s); soldiers.push(s); }
  const crowd = []; for (let i = 0; i < 26; i++) { const top = i < 9; const p = humanoid({ skin: [0xe6b896, 0xd8a882, 0xf0c0a0][i % 3], hair: [0x6a4a2a, 0x2a2a2a, 0xb8925a, 0x5a3a2a][i % 4], top: [0x2a4a8a, 0x9a3a3a, 0x3a7a5a, 0xa08a3a, 0x6a3a8a, 0xe0e0e0][i % 6], bottom: [0x2a3a6a, 0x3a3a3a][i % 2], longHair: i % 3 === 0, seed: 170 + i });
    if (top) { let x = -6 + i * 1.4; if (Math.abs(x) < 2.2) x += 4.6; p.position.set(x, 4.0, 0); p.userData.baseY = 4.0; } else { p.position.set(-9 + (i - 9) * 1.1 + hr() * 0.4, 0, 2.2 + hr() * 3); p.userData.baseY = 0; }
    p.rotation.y = 0; ber.add(p); crowd.push({ p, ph: hr() * 6, top }); }
  const sun = sunLight(ber, 0xf0f2f4, 1.8, V(30, 50, 40), V(0, 0, 0), 40);
  const hemi = new THREE.HemisphereLight(0xdde2ea, 0x7a7a7a, 1.5); ber.add(hemi);
  const night = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight([0xffd8a0, 0xffffff][i % 2], 30, 25, 1.4); l.position.set(-12 + i * 8, 7, 7); night.push(l); ber.add(l); }
  const fw = [0xff4a4a, 0x4aa8ff, 0xffe04a, 0x7aff7a, 0xff7aff].map((c, i) => { const b = particlesBurst(ber, 60, [c, 0xffffff], 180 + i, 0.25); b.position.set(-14 + i * 7, 10 + (i % 2) * 3, -16); return b; });
  const chunks = particlesBurst(ber, 26, [0xb8b4aa, 0x9a968c, 0xd0ccc2], 190, 0.35); chunks.position.set(0, 2, 0.4);
  ber.userData = { ...ber.userData, graf, conc, segs, soldiers, crowd, sun, hemi, night, fw, chunks };
}

// =====================================================================
// SET 6: Sonnenuntergang – Fahnen, Marx auf dem Hügel, Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260);
  clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(201); for (let i = 0; i < 90; i++) dusk.add(box(1, 0.08, 1, M(T.dirt), -20 + r() * 40, 0.02, -10 + r() * 30, { cast: false }));
  // Stadt-Silhouette mit Schloten in der Ferne
  for (let i = 0; i < 40; i++) { const x = -120 + i * 6.3, h = 6 + r() * 12; dusk.add(box(5.5, h, 6, M(T.brickDark), x, h / 2, -110 - r() * 20)); if (i % 3 === 0) dusk.add(box(1.4, h + 14, 1.4, M(T.brickDark), x + 1, (h + 14) / 2, -112)); }
  const fl = [flag(flagTex.china, 3.0, 2.0, 8, dusk, V(-5.2, 0, -2), 0, 0), flag(flagTex.cuba, 3.0, 2.0, 8, dusk, V(-1.6, 0, -2), 0, 1.5), flag(flagTex.ddr, 3.0, 1.9, 8, dusk, V(2.0, 0, -2), 0, 3)];
  fl.forEach(f => { const m = f.userData.holder.children[0].material; m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0.35; });
  const hill = new THREE.Group(); hill.position.set(60, 0, 0); dusk.add(hill);
  for (let s = 0; s < 4; s++) hill.add(box(16 - s * 3.5, 1, 16 - s * 3.5, M(T.grass), 0, 0.5 + s, 0));
  const marx = humanoid({ skin: 0xe0b090, hair: 0xd8d4cc, beardCol: 0xcfcac0, beard: 'full', hairVol: true, top: 0x23252b, bottom: 0x2c2e34, coat: true, eye: '#4a3a2a', seed: 1 });
  marx.position.set(0, 4, 0); marx.rotation.y = Math.PI + 0.15; hill.add(marx);
  // Schild (Text wird nach dem Font-Laden gezeichnet)
  const sign = new THREE.Group(); sign.position.set(-60, 0, 0); dusk.add(sign);
  for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const scv = document.createElement('canvas'); scv.width = 1024; scv.height = 512; const stex = new THREE.CanvasTexture(scv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  dusk.userData = { fl, marx, sign, scv, stex };
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 80);
  dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
}
function drawSign() {
  const { scv, stex } = dusk.userData, c = scv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512);
  const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498);
  c.textAlign = 'center'; c.fillStyle = '#a3241c'; c.font = '800 70px Mont'; c.fillText('KOMMUNISMUS, 1848–1991', 512, 150);
  c.fillStyle = '#3a2a1e'; c.font = '800 56px Mont'; c.fillText('OHNE FREIHEIT WIRD', 512, 290); c.fillText('GLEICHHEIT ZUM GEFÄNGNIS', 512, 380);
  stex.needsUpdate = true;
}

// =====================================================================
// Timeline
// =====================================================================
const words = await (await fetch('words.json')).json();
const DUR = 68.0;
const WHIP0 = 0.89, WHIP1 = 1.46; // Kranfahrt-Preset: startet auf „erklärt“, Dauer 0,57 s
const S = (a, b, id) => ({ a, b, id });
const SHOTS = [
  S(0.00, 2.50, 'hero'), S(2.50, 5.85, 'city'), S(5.85, 9.15, 'fac'), S(9.15, 10.95, 'child'), S(10.95, 12.95, 'owner'), S(12.95, 15.00, 'home'),
  S(15.00, 17.85, 'study'), S(17.85, 20.20, 'manifest'), S(20.20, 23.85, 'square'), S(23.85, 25.75, 'equal'),
  S(25.75, 28.65, 'palace'), S(28.65, 31.65, 'lenin'), S(31.65, 33.90, 'natfac'), S(33.90, 34.85, 'natfarm'), S(34.85, 35.90, 'natshop'),
  S(35.90, 38.00, 'stalin'), S(38.00, 41.80, 'gulag'), S(41.80, 45.10, 'flags'), S(45.10, 47.40, 'shop'), S(47.40, 51.85, 'wall61'),
  S(51.85, 56.45, 'wall89'), S(56.45, 59.20, 'ussr'), S(59.20, 63.20, 'marxhill'), S(63.20, 66.50, 'sign'), S(66.50, 68.00, 'loop'),
];
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);

function heroCam(t) { // exakt nach Preset hook-kranfahrt.json (auf diese Straße übertragen)
  const k = t / 1.4;
  const p0 = V(0.15, lerp(1.62, 1.58, k), lerp(4.6, 4.1, k)), t0 = V(0.05, 1.12, -0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-9.0 + drift * 2, 15.0 + drift * 1.2, 16.0 + drift * 2), t1 = V(2.0 + drift, 0.5, -10.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}

const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = eng, exp = 1.5, ui = { tags: [], chat: [], tip: null, toast: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);

  // --- England ---
  if (['hero', 'loop', 'city', 'square', 'equal'].includes(sh.id)) {
    scene = eng; eng.userData.smokes.forEach(s => s.userData.update(t)); exp = 1.45;
    const { marx, engels, passer } = eng.userData;
    pose(marx, 'idle', t, 0); pose(engels, 'idle', t, 2); engels.userData.head.rotation.y = -0.45 + Math.sin(t) * 0.04; marx.userData.armR.rotation.x = -0.25;
    const pw = Math.max(0, t - 0.9); passer.position.set(2.3, 0, -9 + pw * 2.4); passer.rotation.y = 0; pose(passer, 'walk', t);
    if (sh.id === 'hero') { heroCam(t); tag(marx, 'Karl Marx', '#ffd23f'); tag(engels, 'Friedrich Engels', '#55ffff'); }
    if (sh.id === 'loop') { const tt = t - DUR; heroCam(tt); passer.position.set(2.3, 0, -9); tag(marx, 'Karl Marx', '#ffd23f'); tag(engels, 'Friedrich Engels', '#55ffff'); }
    if (sh.id === 'city') { mv(u, V(70, 52, 70), V(64, 49, 58), V(-10, 6, -70), V(-12, 6, -76), 44); info(2.61, 'Manchester, England'); }
    if (sh.id === 'square') { const { sq, marx2, workers } = eng.userData.sq; pose(marx2, t > 21.0 ? 'fist' : 'point', t);
      workers.forEach((w, i) => pose(w, t > 22.3 ? 'cheer' : 'idle', t, i)); eng.userData.sqFlag.userData.update(t);
      mv(u, V(3.4, 2.4, -53.5), V(2.6, 2.2, -55.2), V(0, 2.0, -62), V(0, 2.1, -62), 50);
      tag(marx2, 'Karl Marx', '#ffd23f'); chat(21.0, '<span style="color:#ffd23f">&lt;Karl Marx&gt;</span> Proletarier aller Länder, vereinigt euch!'); }
    if (sh.id === 'equal') { const { owner2, worker2 } = eng.userData.eq; pose(owner2, 'shake', t); pose(worker2, 'shake', t, 1);
      mv(u, V(0, 1.6, -76.0), V(0, 1.55, -76.6), V(0, 1.25, -80), V(0, 1.25, -80), 48);
      const g = t >= 23.92; tag(owner2, g ? 'Genosse' : 'Fabrikbesitzer', g ? '#ffffff' : '#ff5555'); tag(worker2, g ? 'Genosse' : 'Arbeiter', '#ffffff'); }
  }
  // --- Fabrik ---
  if (sh.id === 'fac' || sh.id === 'child') {
    scene = fac; exp = 1.9; const { wheels, workers, child } = fac.userData;
    wheels.forEach((w, i) => w.rotation.x = t * 3 + i); workers.forEach((w, i) => pose(w, 'work', t, i * 0.7));
    child.position.set(0.2, 0, 10 - (t - 5.85) * 1.05); child.rotation.y = Math.PI; pose(child, 'carry', t);
    if (sh.id === 'fac') { mv(u, V(1.4, 2.7, 15.5), V(1.0, 2.5, 13.2), V(-3.4, 1.3, 4), V(-3.6, 1.3, 2.5), 52); chat(7.56, '<span style="color:#ffd23f">[Info]</span> Arbeitszeit: <span style="color:#ff5555">16 Stunden</span> pro Tag'); }
    if (sh.id === 'child') { const cz = child.position.z; cam(V(1.6, 1.2, cz - 2.6), V(0.2, 0.75, cz), 46); tag(child, 'Kind, 9 Jahre', '#aaaaaa', -0.1); }
  }
  if (sh.id === 'owner') { scene = office; exp = 1.4; const { owner, coins } = office.userData; pose(owner, 'count', t);
    mv(u, V(0.4, 2.0, 3.8), V(0.3, 1.95, 3.0), V(0, 0.95, -2.4), V(0, 1.0, -2.4), 50); updateBurst(coins, t - 12.4, 2.2, 0.9);
    tag(owner, 'Fabrikbesitzer', '#ff5555'); }
  if (sh.id === 'home') { scene = home; exp = 1.5; const { father, kid } = home.userData; pose(father, 'sad', t); pose(kid, 'sad', t, 1); sitPose(father, 0.5); sitPose(kid, 0.5);
    mv(u, V(-0.2, 1.75, -2.4), V(-0.15, 1.65, -2.1), V(0.0, 0.95, 0.0), V(0.0, 0.95, 0.0), 54);
    tag(father, 'Arbeiter', '#ffffff');
    if (t >= 13.98) ui.tip = { o: clamp01((t - 13.98) / 0.1), icon: 'bowl', title: 'Schüssel', titleCol: '#ffffff', lines: ['<span style="color:#aaaaaa">Inhalt: leer</span>'] }; }
  if (sh.id === 'study' || sh.id === 'manifest') { scene = study; exp = 1.45; const { marx, engels } = study.userData; pose(marx, 'write', t); sitPose(marx, 0.5); pose(engels, 'idle', t, 1); engels.userData.armR.rotation.x = -0.5;
    if (sh.id === 'study') { mv(u, V(1.7, 1.85, -2.9), V(1.45, 1.75, -2.6), V(0.0, 1.1, -0.2), V(0.0, 1.1, -0.2), 52); tag(marx, 'Karl Marx', '#ffd23f'); tag(engels, 'Friedrich Engels', '#55ffff'); }
    else { mv(u, V(0.75, 1.75, -1.45), V(0.7, 1.6, -1.25), V(0.55, 1.0, -0.8), V(0.55, 1.0, -0.8), 48);
      if (t >= 18.17) ui.tip = { o: clamp01((t - 18.17) / 0.1), icon: 'book', title: 'Das Kommunistische Manifest', titleCol: '#ffaa00', lines: ['<span style="color:#aaaaaa">Karl Marx &amp; Friedrich Engels</span>', '<span style="color:#aaaaaa">London, 1848 · 23 Seiten</span>'] }; } }
  // --- Russland ---
  if (['palace', 'lenin', 'natfac', 'natfarm', 'natshop', 'gulag', 'ussr'].includes(sh.id)) {
    scene = rus; exp = 1.25; const R = rus.userData; R.snowA.userData.update(t);
    R.crowd.forEach(({ p, ph }) => pose(p, t > 29.18 && sh.id === 'lenin' ? 'cheer' : 'idle', t, ph)); R.fl.forEach(f => f.userData.update(t));
    pose(R.lenin, t > 29.0 ? 'fist' : 'point', t);
    if (sh.id === 'palace') { R.snowA.position.set(0, 0, 12); mv(u, V(-30, 26, 60), V(-24, 24, 52), V(0, 6, -10), V(2, 6, -12), 46); info(25.83, 'Petrograd, Russland'); }
    if (sh.id === 'lenin') { R.snowA.position.set(0, 0, 8); mv(u, V(1.2, 2.6, 6.4), V(1.0, 2.7, 5.4), V(0, 2.7, 0), V(0, 2.8, 0), 48); tag(R.lenin, 'Lenin', '#ffffff');
      chat(29.18, '<span style="color:#ffff55">Zar Nikolaus II. hat das Spiel verlassen</span>'); }
    const natChat = () => { chat(31.75, '<span style="color:#ff5555">[Staat]</span> Fabriken übernommen'); chat(33.98, '<span style="color:#ff5555">[Staat]</span> Bauernhöfe übernommen'); chat(34.92, '<span style="color:#ff5555">[Staat]</span> Läden übernommen'); };
    if (sh.id === 'natfac') { R.snowA.position.set(120, 0, 14); R.natFlag.userData.update(t); const rise = smoother((t - 32.2) / 1.2); R.natFlag.userData.holder.position.y = lerp(1.4, R.natFlag.userData.poleH - R.natFlag.userData.h / 2 - 0.1, rise);
      mv(u, V(108, 7, 30), V(110, 8, 26), V(120, 7, 0), V(120, 8, 0), 50); natChat(); }
    if (sh.id === 'natfarm') { R.snowA.position.set(200, 0, 14); R.farmFlag.userData.update(t); mv(u, V(194, 5, 22), V(195, 5.2, 20), V(201, 3.5, -3), V(201, 3.6, -3), 50); natChat(); }
    if (sh.id === 'natshop') { R.snowA.position.set(280, 0, 14); R.shopFlag.userData.update(t); mv(u, V(276, 3.2, 17), V(276.5, 3.3, 15.5), V(281, 4.2, 0), V(281, 4.3, 0), 50); natChat(); }
    if (sh.id === 'gulag') { R.snowA.position.set(-150, 0, 6); const g = R.gl.position;
      R.prisoners.forEach((p, i) => { p.position.set(-14 + ((t - 38) * 1.1 + i * 1.6) % 22, 0, 0.5); p.rotation.y = Math.PI / 2; pose(p, 'walk', t * 0.6, i); p.userData.head.rotation.x = 0.35; });
      pose(R.guard, 'idle', t);
      mv(u, V(g.x + 4, 6.5, 20), V(g.x + 2, 6.0, 17), V(g.x - 2, 1.5, 0), V(g.x - 3, 1.5, 0), 50);
      chat(39.23, '<span style="color:#ffd23f">[Info]</span> Gulag, Sibirien'); chat(41.0, '<span style="color:#ff5555">Millionen Menschen starben in den Lagern</span>'); }
    if (sh.id === 'ussr') { R.snowA.position.set(-290, 0, 14); R.ktFlag.userData.update(t); const low = smoother((t - 56.8) / 2.2); const ph = R.ktFlag.userData; ph.holder.position.y = lerp(ph.poleH - ph.h / 2 - 0.1, 1.2, low);
      mv(u, V(-272, 8, 52), V(-274, 9, 48), V(-294, 18, 0), V(-294, 17, 0), 46); chat(57.92, '<span style="color:#ffff55">Sowjetunion hat das Spiel verlassen</span>'); }
  }
  if (sh.id === 'stalin') { scene = kreml; exp = 1.35; const st = kreml.userData.stalin; pose(st, 'idle', t); st.userData.armR.rotation.x = -0.3; kreml.userData.flags.forEach(f => f.userData.update(t));
    mv(u, V(0.4, 0.9, 1.6), V(0.3, 0.95, 0.9), V(0, 2.0, -2.7), V(0, 2.0, -2.7), 50); tag(st, 'Josef Stalin', '#ff5555'); }
  if (sh.id === 'flags') { scene = dusk; exp = 1.35; dusk.userData.fl.forEach(f => f.userData.update(t));
    mv(u, V(-0.6, 6.0, 22), V(0.2, 6.2, 20.5), V(-0.3, 6.4, -2), V(0.0, 6.5, -2), 46);
    const lab = (x, txt, t0) => { if (t >= t0) ui.tags.push([V(x + 1.55, 5.2, -2), txt, '#ffffff']); };
    lab(-5.2, 'China, 1949', 42.09); lab(-1.6, 'Kuba, 1959', 42.49); lab(2.0, 'DDR, 1949', 43.11); }
  if (sh.id === 'shop') { scene = shop; exp = 1.25; shop.userData.queue.forEach((p, i) => { pose(p, 'idle', t, i); p.userData.head.rotation.x = 0.1; });
    mv(u, V(-2.25, 1.85, 5.4), V(-2.25, 1.8, 4.4), V(-2.25, 0.9, -4), V(-2.25, 0.9, -4), 54);
    if (t >= 46.73) ui.tip = { o: clamp01((t - 46.73) / 0.1), icon: 'shelf', title: 'Regal', titleCol: '#ffffff', lines: ['<span style="color:#ff5555">Inhalt: leer</span>', '<span style="color:#aaaaaa">Wartezeit: 2 Stunden</span>'] }; }
  if (sh.id === 'wall61' || sh.id === 'wall89') {
    scene = ber; const B = ber.userData; const is89 = sh.id === 'wall89';
    B.sun.intensity = is89 ? 0.15 : 1.8; B.hemi.intensity = is89 ? 0.35 : 1.5; B.hemi.color.set(is89 ? 0x3a4a7a : 0xdde2ea); B.night.forEach(l => l.visible = is89);
    B.sky.material.uniforms.top.value.set(is89 ? 0x05070f : 0x9aa6b4); B.sky.material.uniforms.mid.value.set(is89 ? 0x0c1224 : 0xbcc4cc); B.sky.material.uniforms.hor.value.set(is89 ? 0x1a2238 : 0xd0d4d8);
    ber.fog.color.set(is89 ? 0x0c1224 : 0xc0c6cc); exp = is89 ? 1.3 : 1.25;
    B.segs.forEach((g, i) => { const k = is89 ? 1 : smoother((t - 47.5 - i * 0.035) / 0.3); g.position.y = lerp(-4.2, 0, k); g.visible = true; });
    B.soldiers.forEach((s, i) => { s.visible = !is89; pose(s, 'idle', t, i); });
    B.segs.forEach(g => { g.children[0].material[4] = is89 ? B.graf : B.conc; });
    B.crowd.forEach(({ p, ph, top }) => { p.visible = is89; if (is89) pose(p, t > 55.52 || !top ? 'cheer' : 'hammer', t, ph); });
    if (!is89) { mv(u, V(-6, 3.6, 13), V(-3, 3.4, 11.5), V(2, 1.8, -1), V(3, 1.8, -1), 52); info(47.68, 'Berlin, 1961'); }
    else { B.fw.forEach((f, i) => updateBurst(f, ((t - 52 - i * 0.7) % 3.5 + 3.5) % 3.5, 5, 1.6));
      const brk = t - 55.5; const mid = B.segs[30]; mid.visible = brk < 0; [29, 31].forEach(i => B.segs[i].visible = brk < 0.1);
      updateBurst(B.chunks, brk, 3.2, 1.6);
      mv(u, V(3, 3.4, 12), V(2.4, 3.2, 10.4), V(0, 2.8, 0), V(0, 2.6, 0), 52);
      info(51.91, 'Berlin, 1989'); chat(55.52, '<span style="color:#ffff55">Die Berliner Mauer wurde zerstört</span>'); }
  }
  if (sh.id === 'marxhill' || sh.id === 'sign') { scene = dusk; exp = 1.35; dusk.userData.fl.forEach(f => f.userData.update(t));
    if (sh.id === 'marxhill') { const mh = dusk.userData.marx; pose(mh, 'idle', t); mv(u, V(61.3, 6.1, 3.6), V(61.0, 6.0, 3.0), V(59.0, 5.2, -9), V(59.0, 5.2, -9), 50); tag(mh, 'Karl Marx', '#ffd23f'); }
    else { if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(-60, 3.5, 13.5), V(-60, 3.6, 12.0), V(-60, 2.5, 0), V(-60, 2.55, 0), 46); } }

  camera.updateProjectionMatrix();
  renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  bowl: '<rect x="1" y="4" width="6" height="2" fill="#8a6a4a"/><rect x="2" y="6" width="4" height="1" fill="#6a4a2a"/><rect x="0" y="3" width="1" height="1" fill="#8a6a4a"/><rect x="7" y="3" width="1" height="1" fill="#8a6a4a"/>',
  book: '<rect x="1" y="1" width="6" height="6" fill="#a3241c"/><rect x="2" y="2" width="4" height="1" fill="#ffd23f"/><rect x="1" y="7" width="6" height="1" fill="#e8e0c8"/>',
  shelf: '<rect x="0" y="1" width="8" height="1" fill="#b0ac9c"/><rect x="0" y="4" width="8" height="1" fill="#b0ac9c"/><rect x="0" y="7" width="8" height="1" fill="#b0ac9c"/><rect x="0" y="1" width="1" height="7" fill="#8a8678"/><rect x="7" y="1" width="1" height="7" fill="#8a8678"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null; // nach langer Pause ausblenden
  if (cur) { let txt = cur[0]; if (txt.startsWith('achtzehnhundert')) txt = '1848.';
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.join('<br>');
  let ex = '';
  if (ui.tip) ex = `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
