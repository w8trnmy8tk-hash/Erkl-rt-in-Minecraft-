// „Looksmaxxing, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
    c.fillStyle = hex(shade(o.beardCol ?? o.hair, 0.85)); if (o.sad) { c.fillRect(2, 3, 1, 1); c.fillRect(1, 2, 1, 1); c.fillRect(5, 3, 1, 1); c.fillRect(6, 2, 1, 1); } else { c.fillRect(1, 3, 2, 1); c.fillRect(5, 3, 2, 1); }
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

// =====================================================================
// SET 1: Stadt & Schulhof (Tag)
// =====================================================================
const town = new THREE.Scene();
{
  skyDome(town, 0x4a7ac8, 0x8ab4e0, 0xcfe2f0, V(-0.5, 0.4, 0.3)); town.fog = new THREE.Fog(0xcfe2f0, 80, 380);
  clouds(town, 3, 0xffffff, 60, 30, 200, 0.95);
  town.add(box(800, 1, 800, M(T.grass), 0, -0.5, 0, { cast: false }));
  town.add(box(46, 0.06, 30, M(T.concrete), 0, 0.03, -4, { cast: false }));
  town.add(box(400, 0.06, 8, C(0x3a3a3e), 0, 0.03, 22, { cast: false }));
  for (let x = -200; x < 200; x += 6) town.add(box(3, 0.02, 0.25, C(0xe8e8e8), x, 0.07, 22, { cast: false }));
  town.add(box(400, 0.15, 2, C(0xa8a49c), 0, 0.08, 17, { cast: false })); town.add(box(400, 0.15, 2, C(0xa8a49c), 0, 0.08, 27, { cast: false }));
  // Schule
  const sch = new THREE.Group(); sch.position.set(0, 0, -24); town.add(sch);
  const wallM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd9c49a, 0.05), 501));
  sch.add(box(46, 12, 14, wallM, 0, 6, 0)); sch.add(box(46.6, 0.6, 14.6, C(0x6a6a6a), 0, 12.3, 0));
  for (let x = -21; x <= 21; x += 3) for (const y of [2.4, 6.2, 9.8]) if (!(Math.abs(x) < 2 && y < 4)) sch.add(box(2.0, 2.2, 0.1, M(T.windowDark), x, y, 7.03, { cast: false }));
  sch.add(box(4, 3.4, 0.2, C(0x3a4a5a), 0, 1.7, 7.05));
  const sTex = tex(128, 20, (c) => { c.fillStyle = '#2a4a7a'; c.fillRect(0, 0, 128, 20); c.fillStyle = '#ffffff'; c.font = '600 14px Pix, monospace'; c.textAlign = 'center'; c.fillText('GYMNASIUM', 64, 15); }, 502);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.1), new THREE.MeshStandardMaterial({ map: sTex })); sg.position.set(0, 4.2, 7.12); sch.add(sg);
  // Bäume, Bänke, Fahrradständer
  const tr = rng(503);
  const tree = (x, z) => { town.add(box(0.7, 4, 0.7, C(0x5a3a22), x, 2, z)); town.add(box(3.6, 3.0, 3.6, C(0x3f7a32), x, 5.2, z)); town.add(box(2.4, 1.6, 2.4, C(0x4a8a3a), x, 7.2, z)); };
  for (const [x, z] of [[-18, 6], [-12, 9], [14, 7], [19, 2], [-20, -6], [21, -10], [-26, 14], [27, 14]]) tree(x, z);
  for (const [x, z] of [[-9, 8], [10, 9]]) { town.add(box(2.6, 0.12, 0.6, M(T.planks), x, 0.6, z)); town.add(box(0.12, 0.6, 0.5, C(0x3a3a3a), x - 1.1, 0.3, z)); town.add(box(0.12, 0.6, 0.5, C(0x3a3a3a), x + 1.1, 0.3, z)); }
  // Häuser an der Straße
  for (let i = 0; i < 26; i++) { const x = -120 + i * 9.5, h = 6 + tr() * 5; const hc = [0xe2d6c2, 0xc9b49a, 0xb8c4cc, 0xd8c0b0][i % 4];
    town.add(box(8, h, 9, C(hc), x, h / 2, 36)); for (let s = 0; s < 3; s++) town.add(box(8.4, 1, 9.4 - s * 3, M(T.roofRed), x, h + 0.5 + s, 36));
    for (const wx of [-2, 2]) town.add(box(1.4, 1.4, 0.1, M(T.windowDark), x + wx, h * 0.6, 31.45, { cast: false })); }
  sunLight(town, 0xfff0d8, 3.4, V(-45, 60, 45), V(0, 0, 0), 55);
  town.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  // Figuren
  const leon = humanoid(LEON_B), mia = humanoid(MIA); leon.userData.setFace({ smile: true }); town.add(leon, mia);
  const students = []; for (let i = 0; i < 7; i++) { const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a][i % 4], hair: [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a][i % 4], top: [0x3a6aa8, 0xa83a3a, 0x3a8a5a, 0xe8e8e8, 0x8a5aa8][i % 5], bottom: 0x2a3448, longHair: i % 2 === 0, seed: 520 + i }); town.add(p); students.push(p); }
  [[-7, 0, -8, 0.6], [-6, 0, -9, 2.4], [9, 0, -10, -0.5], [10, 0, -11, 2.6], [-14, 0, 2, 1.5], [12, 0, 3, -1.3], [-3, 0, -12, 3]].forEach(([x, y, z, r], i) => { students[i].position.set(x, y, z); students[i].rotation.y = r; });
  const passer = humanoid({ skin: 0xc89a72, hair: 0x1a1a1a, top: 0xa83a3a, bottom: 0x2a3448, seed: 530 }); town.add(passer);
  const hearts = particlesBurst(town, 22, [0xff4a6a, 0xff8aa0, 0xe8202a], 540, 0.11); hearts.children.forEach(m => { m.userData.v.y = Math.abs(m.userData.v.y) + 0.6; m.userData.v.multiplyScalar(0.5); });
  town.userData = { leon, mia, students, passer, hearts };
}

// =====================================================================
// SET 2: Leons Zimmer (Abend/Nacht) mit PC, Spiegel, Bett, Waschbecken
// =====================================================================
const room = new THREE.Scene(); room.background = new THREE.Color(0x0a0b10);
const scv = document.createElement('canvas'); scv.width = 640; scv.height = 400; const screenTex = new THREE.CanvasTexture(scv); screenTex.colorSpace = THREE.SRGBColorSpace;
{
  const wall = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x7f8aa0, 0.04); }, 601)), fl = M(T.planks), dw = M(T.darkwood);
  room.add(box(8, 0.2, 9, fl, 0, -0.1, 0.5)); room.add(box(0.3, 4, 9, wall, -4.15, 2, 0.5)); room.add(box(0.3, 4, 9, wall, 4.15, 2, 0.5));
  // Rückwand mit Spiegel-Loch (x 1.5..2.5, y 0.45..2.45)
  room.add(box(5.5, 4, 0.3, wall, -1.25, 2, -4.15)); room.add(box(1.5, 4, 0.3, wall, 3.25, 2, -4.15));
  room.add(box(1.0, 0.45, 0.3, wall, 2.0, 0.225, -4.15)); room.add(box(1.0, 1.55, 0.3, wall, 2.0, 3.225, -4.15));
  // Spiegel: Rahmen, Glas, gespiegelter Raum dahinter
  for (const [w, h, x, y] of [[1.16, 0.08, 2.0, 2.49], [1.16, 0.08, 2.0, 0.41], [0.08, 2.1, 1.46, 1.45], [0.08, 2.1, 2.54, 1.45]]) room.add(box(w, h, 0.12, C(0xd8d8d8, { metal: 0.6, rough: 0.3 }), x, y, -3.98));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshStandardMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2 })); glass.position.set(2.0, 1.45, -4.0); room.add(glass);
  room.add(box(3, 0.2, 3, fl, 2.0, -0.1, -5.6)); room.add(box(3, 4, 0.2, wall, 2.0, 2, -7.1)); room.add(box(0.2, 4, 3, wall, 0.5, 2, -5.6)); room.add(box(0.2, 4, 3, wall, 3.5, 2, -5.6)); room.add(box(3, 0.2, 3, wall, 2.0, 4, -5.6));
  // Schreibtisch, PC, Stuhl
  room.add(box(2.2, 0.08, 1.0, dw, -2.2, 0.95, -3.4)); for (const x of [-3.2, -1.2]) room.add(box(0.08, 0.95, 0.9, dw, x, 0.475, -3.4));
  room.add(box(0.12, 0.35, 0.12, C(0x1a1a1a), -2.2, 1.15, -3.62)); room.add(box(1.28, 0.8, 0.07, C(0x111114), -2.2, 1.6, -3.66));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })); scr.position.set(-2.2, 1.6, -3.62); room.add(scr);
  room.add(box(0.8, 0.04, 0.3, C(0x2a2a2a), -2.2, 1.01, -3.1)); room.add(box(0.14, 0.04, 0.2, C(0x2a2a2a), -1.55, 1.01, -3.1));
  room.add(box(0.7, 0.1, 0.7, C(0x2a2a30), -2.2, 0.5, -2.45)); room.add(box(0.7, 0.8, 0.1, C(0x2a2a30), -2.2, 0.95, -2.12));
  const scrL = new THREE.PointLight(0x9ac0ff, 3.5, 4, 1.4); scrL.position.set(-2.2, 1.6, -3.2); room.add(scrL);
  // Wanduhr
  const ccv = document.createElement('canvas'); ccv.width = ccv.height = 64; const ctex = new THREE.CanvasTexture(ccv); ctex.magFilter = THREE.NearestFilter; ctex.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshStandardMaterial({ map: ctex })); clock.position.set(0.6, 2.95, -3.98); room.add(clock);
  room.userData.drawClock = (min) => { const c = ccv.getContext('2d'); c.fillStyle = '#2a2a2a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#f0ece0'; c.fillRect(5, 5, 54, 54);
    c.fillStyle = '#333'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(Math.round(32 + Math.sin(a) * 22) - 1, Math.round(32 - Math.cos(a) * 22) - 1, 3, 3); }
    const hand = (a, len, w, col) => { c.fillStyle = col; for (let r = 0; r < len; r++) c.fillRect(Math.round(32 + Math.sin(a) * r) - (w >> 1), Math.round(32 - Math.cos(a) * r) - (w >> 1), w, w); };
    hand((7 + min / 60) / 12 * Math.PI * 2, 12, 4, '#111'); hand(min / 60 * Math.PI * 2, 19, 3, '#111'); c.fillStyle = '#c02020'; c.fillRect(30, 30, 4, 4); ctex.needsUpdate = true; };
  // Bett
  room.add(box(1.8, 0.45, 2.8, dw, 2.85, 0.225, 1.5)); room.add(box(1.7, 0.2, 2.7, M(T.white), 2.85, 0.55, 1.5)); room.add(box(1.2, 0.18, 0.5, M(T.white), 2.85, 0.73, 0.4)); room.add(box(1.8, 0.9, 0.12, dw, 2.85, 0.45, 0.06));
  const blanket = box(1.74, 0.1, 1.6, C(0x3a5a8a), 2.85, 0.92, 2.0); room.add(blanket);
  // Waschbecken links
  room.add(box(0.6, 0.85, 0.8, M(T.white), -3.65, 0.425, 0.6)); room.add(box(0.5, 0.08, 0.7, C(0xd8dde2, { rough: 0.3 }), -3.6, 0.88, 0.6)); room.add(box(0.06, 0.25, 0.06, C(0xb0b0b0, { metal: 0.7, rough: 0.3 }), -3.85, 1.0, 0.6));
  room.add(box(0.12, 0.16, 0.12, C(0xf0f0f0), -3.7, 0.98, 0.95));
  // Fenster links
  const winM = new THREE.MeshBasicMaterial({ color: 0x4a6aa0 }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), winM); win.rotation.y = Math.PI / 2; win.position.set(-3.98, 2.2, -1.5); room.add(win);
  room.add(box(0.1, 0.08, 1.7, dw, -3.97, 2.2, -1.5)); room.add(box(0.1, 1.4, 0.08, dw, -3.97, 2.2, -1.5));
  // Poster
  const pTex = tex(12, 16, (c, r) => { c.fillStyle = '#1a1a2a'; c.fillRect(0, 0, 12, 16); c.fillStyle = '#e84a4a'; c.fillRect(2, 2, 8, 2); c.fillStyle = '#f0d02a'; c.fillRect(3, 6, 6, 6); c.fillStyle = '#ffffff'; c.fillRect(2, 13, 8, 1); }, 602);
  const post = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), M(pTex)); post.position.set(-0.8, 2.3, -3.98); room.add(post);
  room.add(box(1.2, 0.08, 1.6, C(0x8a3a3a), 0.2, 0.04, 0.4, { cast: false })); // Teppich
  // Licht
  const sun = sunLight(room, 0xb8c8ff, 1.6, V(-10, 6, -1.5), V(0, 0, -1), 7, 1024);
  const hemi = new THREE.HemisphereLight(0x9aa8d0, 0x3a2a20, 1.1); room.add(hemi);
  const lamp = new THREE.PointLight(0xffb070, 6, 9, 1.5); lamp.position.set(0.5, 3.6, 0.5); room.add(lamp);
  room.add(box(0.5, 0.15, 0.5, new THREE.MeshBasicMaterial({ color: 0xffe0b0 }), 0.5, 3.92, 0.5, { cast: false }));
  // Figuren: Leon A (vorher), Leon B (nachher) + Spiegelbilder
  const A = humanoid(LEON), B = humanoid(LEON_B), rA = humanoid(LEON), rB = humanoid(LEON_B);
  room.add(A, B, rA, rB); dumbbell(A, 'armR'); dumbbell(A, 'armL');
  Object.assign(room.userData, { A, B, rA, rB, sun, hemi, lamp, winM, scrL, blanket });
}
function drawScreen(mode, t) {
  const c = scv.getContext('2d'); c.textAlign = 'center';
  c.fillStyle = '#121418'; c.fillRect(0, 0, 640, 400);
  c.fillStyle = '#b3201c'; c.fillRect(0, 0, 640, 44); c.fillStyle = '#ffffff'; c.font = '600 26px Pix'; c.fillText('looksmaxxing.forum', 320, 30);
  if (mode === 'forum' || mode === 'internet') {
    const titleK = mode === 'forum' ? clamp01((t - wt(28)) / 0.15) : 1;
    c.globalAlpha = titleK; c.fillStyle = '#ffd23f'; c.font = '600 46px Pix'; c.fillText('LOOKSMAXXING', 320, 105); c.globalAlpha = 1;
    const posts = ['Mewing Guide v3', 'Rate me 1-10', 'Jawline Check', 'Softmaxxing Routine', 'Canthal Tilt?', 'Mog oder gemoggt?'];
    posts.forEach((p, i) => { c.fillStyle = i % 2 ? '#1c2028' : '#20252e'; c.fillRect(170, 130 + i * 42, 300, 36); c.fillStyle = '#c8d0dc'; c.font = '400 20px Pix'; c.fillText(p, 320, 155 + i * 42); });
  }
  if (mode === 'more') { const f = Math.floor(t * 6) % 2; const lines = ['NOCH MEHR!', 'MEWING 24/7', 'HARDMAXXING', 'NIE GENUG']; lines.forEach((l, i) => { c.fillStyle = (i + f) % 2 ? '#ff4040' : '#ff8a8a'; c.font = '600 38px Pix'; c.fillText(l, 320, 110 + i * 70 - ((t * 40) % 70)); }); }
  if (mode === 'rate') { const sc = ['3/10', '5/10', '7/10', '4/10', '6/10', '2/10'], skins = ['#e8b894', '#c89a72', '#f0c4a2', '#8a5a3a', '#e0a882', '#d8b090'], hairs = ['#2a1a14', '#6a4422', '#b8925a', '#1a1a1a', '#5a3a2a', '#8a5a2a'];
    for (let i = 0; i < 6; i++) { const x = 230 + (i % 2) * 110, y = 70 + Math.floor(i / 2) * 105; c.fillStyle = skins[i]; c.fillRect(x, y, 70, 70); c.fillStyle = hairs[i]; c.fillRect(x, y, 70, 18); c.fillStyle = '#fff'; c.fillRect(x + 10, y + 34, 16, 8); c.fillRect(x + 44, y + 34, 16, 8); c.fillStyle = '#222'; c.fillRect(x + 18, y + 34, 8, 8); c.fillRect(x + 44, y + 34, 8, 8); c.fillStyle = '#8a4a40'; c.fillRect(x + 26, y + 54, 18, 6);
      if (t > wt(81) + 0.3 + i * 0.3) { c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x, y + 72, 70, 24); c.fillStyle = parseInt(sc[i]) < 5 ? '#ff5555' : '#55ff55'; c.font = '600 22px Pix'; c.fillText(sc[i], x + 35, y + 91); } } }
  if (mode === 'canthal') { c.fillStyle = '#e8b894'; c.fillRect(220, 70, 200, 200); c.fillStyle = '#6a4422'; c.fillRect(220, 70, 200, 45); c.fillStyle = '#fff'; c.fillRect(245, 150, 50, 20); c.fillRect(345, 150, 50, 20); c.fillStyle = '#2a3a5a'; c.fillRect(265, 150, 20, 20); c.fillRect(350, 150, 20, 20);
    c.strokeStyle = '#ff4040'; c.lineWidth = 4; c.beginPath(); c.moveTo(232, 168); c.lineTo(305, 148); c.moveTo(335, 148); c.lineTo(408, 168); c.stroke(); c.fillStyle = '#ffd23f'; c.font = '600 26px Pix'; c.fillText('Canthal Tilt: -3°', 320, 320); c.fillStyle = '#ff5555'; c.font = '400 22px Pix'; c.fillText('„negativ“', 320, 355); }
  if (mode === 'scale') { for (let i = 1; i <= 10; i++) { const k = clamp01((t - wt(89) - i * 0.12) / 0.15); c.globalAlpha = k; const x = 150 + (i - 1) * 38; c.fillStyle = `hsl(${(i - 1) * 12},75%,50%)`; c.fillRect(x, 230 - i * 12, 30, 40 + i * 12); c.fillStyle = '#fff'; c.font = '600 20px Pix'; c.fillText(String(i), x + 15, 300); } c.globalAlpha = 1; c.fillStyle = '#ffd23f'; c.font = '600 30px Pix'; c.fillText('DEINE BEWERTUNG', 320, 95); }
  if (mode === 'mog') { const face = (x, sk, hr, jaw) => { c.fillStyle = sk; c.fillRect(x, 110, 130, 130 + jaw); c.fillStyle = hr; c.fillRect(x, 110, 130, 30); c.fillStyle = '#fff'; c.fillRect(x + 18, 170, 30, 14); c.fillRect(x + 82, 170, 30, 14); c.fillStyle = '#222'; c.fillRect(x + 30, 170, 14, 14); c.fillRect(x + 86, 170, 14, 14); c.fillStyle = '#8a4a40'; c.fillRect(x + 45, 215 + jaw * 0.5, 40, 8); };
    face(160, '#e8b894', '#3e2614', 0); face(350, '#e0a882', '#1a1a1a', 22); c.fillStyle = '#fff'; c.font = '600 24px Pix'; c.fillText('4/10', 225, 300); c.fillText('9/10', 415, 300);
    if (t >= wt(106)) { c.fillStyle = '#ff3030'; c.font = '600 54px Pix'; c.save(); c.translate(320, 200); c.rotate(-0.15); c.fillText('MOGGED', 0, 0); c.restore(); } }
  if (mode === 'delete') { const done = t >= wt(178); c.fillStyle = '#20252e'; c.fillRect(170, 120, 300, 170); c.fillStyle = '#ffffff'; c.font = '600 26px Pix';
    c.fillText(done ? 'Account gelöscht' : 'Account löschen?', 320, 175); c.fillStyle = done ? '#55ff55' : '#b3201c'; c.fillRect(250, 210, 140, 48); c.fillStyle = '#fff'; c.font = '600 24px Pix'; c.fillText(done ? '✓' : 'Löschen', 320, 242); }
  screenTex.needsUpdate = true;
}

// =====================================================================
// SET 3: Friseur, dunkles Zimmer, Arztpraxis
// =====================================================================
const barber = new THREE.Scene(); barber.background = new THREE.Color(0x101010);
{
  const tile = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(x % 8 === 0 || y % 8 === 0 ? 0xb8bcbe : 0xeef0f0, 0.97 + r() * 0.06)); }, 701));
  barber.add(box(8, 0.2, 8, M(T.lino), 0, -0.1, 0)); barber.add(box(8, 4, 0.3, tile, 0, 2, -3.5)); barber.add(box(0.3, 4, 8, tile, -4, 2, 0)); barber.add(box(0.3, 4, 8, tile, 4, 2, 0));
  barber.add(box(0.8, 0.5, 0.8, C(0x8a1a1a), 0, 0.75, 0)); barber.add(box(0.8, 0.9, 0.15, C(0x8a1a1a), 0, 1.3, -0.4)); barber.add(box(0.2, 0.5, 0.2, C(0xb0b0b0, { metal: 0.6 }), 0, 0.25, 0));
  for (const x of [-2.4, 2.4]) { barber.add(box(1.4, 2.0, 0.06, C(0xcfe0ff, { metal: 0.3, rough: 0.1 }), x, 2.1, -3.32)); barber.add(box(1.4, 0.06, 0.4, C(0xe8e8e8), x, 1.0, -3.2)); }
  const before = humanoid(LEON), after = humanoid(LEON_B); after.userData.setFace({ smile: true }); barber.add(before, after);
  for (const ch of [before, after]) { ch.position.set(0, 0, 0.1); }
  const cape = box(0.9, 0.8, 0.5, C(0xe8e8e8), 0, 0.95, 0.12); barber.add(cape);
  const bb = humanoid({ skin: 0xc89a72, hair: 0x1a1a1a, beard: 'short', top: 0x2a2a2a, bottom: 0x2a2a2a, seed: 710 }); bb.position.set(0.85, 0, -0.5); bb.rotation.y = -0.9; barber.add(bb);
  bb.userData.armR.add(box(0.05, 0.05, 0.18, C(0xc0c0c0, { metal: 0.8 }), 0, -0.7, 0.1));
  const hairBits = particlesBurst(barber, 30, [0x6a4422, 0x5a3a1c], 720, 0.07); hairBits.position.set(0, 2.1, 0.1);
  sunLight(barber, 0xfff4e8, 2.0, V(3, 8, 6), V(0, 0, 0), 5, 1024); barber.add(new THREE.HemisphereLight(0xf0f4ff, 0x8a8a8a, 1.6));
  barber.userData = { before, after, bb, hairBits, cape };
}
const dark = new THREE.Scene(); dark.background = new THREE.Color(0x050505);
{
  const cw = M(T.concrete); dark.add(box(5, 0.2, 5, M(T.cobble), 0, -0.1, 0)); dark.add(box(5, 3.2, 0.3, cw, 0, 1.6, -2.5)); dark.add(box(0.3, 3.2, 5, cw, -2.5, 1.6, 0)); dark.add(box(0.3, 3.2, 5, cw, 2.5, 1.6, 0));
  dark.add(box(0.05, 0.6, 0.05, C(0x111111), 0, 2.9, -0.4)); dark.add(box(0.14, 0.18, 0.14, new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), 0, 2.55, -0.4, { cast: false }));
  const bulb = new THREE.PointLight(0xffd090, 6, 7, 1.4); bulb.position.set(0, 2.4, -0.4); bulb.castShadow = true; bulb.shadow.mapSize.set(1024, 1024); dark.add(bulb);
  dark.add(new THREE.HemisphereLight(0x3a3a4a, 0x0a0a0a, 0.4));
  const guy = humanoid({ skin: 0xd8a882, hair: 0x1a1a1a, top: 0x1c1c22, bottom: 0x22222a, hat: 'cap', hatCol: 0x1c1c22, seed: 750 }); guy.position.set(0, 0, -0.9); dark.add(guy); hammerInHand(guy);
  dark.userData = { guy, bulb };
}
const clinic = new THREE.Scene(); clinic.background = new THREE.Color(0x101418);
{
  clinic.add(box(8, 0.2, 8, M(T.lino), 0, -0.1, 0)); clinic.add(box(8, 4, 0.3, M(T.shopWall), 0, 2, -3.5)); clinic.add(box(0.3, 4, 8, M(T.shopWall), -4, 2, 0)); clinic.add(box(0.3, 4, 8, M(T.shopWall), 4, 2, 0));
  const xr = tex(24, 30, (c) => { c.fillStyle = '#0a0e14'; c.fillRect(0, 0, 24, 30); c.fillStyle = '#d8e4ee'; c.fillRect(6, 3, 12, 11); c.fillRect(5, 6, 1, 6); c.fillRect(18, 6, 1, 6); c.fillStyle = '#0a0e14'; c.fillRect(8, 8, 3, 3); c.fillRect(13, 8, 3, 3); c.fillRect(11, 11, 2, 2);
    c.fillStyle = '#d8e4ee'; c.fillRect(7, 15, 10, 4); c.fillStyle = '#0a0e14'; for (let x = 8; x < 17; x += 2) c.fillRect(x, 16, 1, 2); c.fillStyle = '#ff4040'; c.fillRect(15, 13, 1, 1); c.fillRect(16, 14, 1, 1); c.fillRect(17, 15, 1, 1); c.fillStyle = '#9aaebe'; c.fillRect(11, 19, 2, 9); for (let y = 21; y < 28; y += 3) c.fillRect(8, y, 8, 1); }, 801);
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({ map: xr, toneMapped: false })); lb.position.set(-1.0, 2.0, -3.33); clinic.add(lb);
  clinic.add(box(1.45, 1.75, 0.08, C(0xe8e8e8), -1.0, 2.0, -3.36));
  clinic.add(box(1.8, 0.1, 0.9, C(0xe8e8e8), 1.8, 0.9, -2.6)); clinic.add(box(1.8, 0.85, 0.1, C(0xcccccc), 1.8, 0.45, -2.2));
  const doc = humanoid({ skin: 0xf0c4a2, hair: 0x8a8a8a, beard: 'short', beardCol: 0x9a9a9a, top: 0xf2f2f2, bottom: 0x3a4a6a, coat: true, tie: 0x2a5a9a, seed: 810 }); doc.position.set(0.6, 0, -1.9); doc.rotation.y = -0.35; clinic.add(doc);
  sunLight(clinic, 0xf4f8ff, 2.2, V(3, 9, 7), V(0, 0, -1), 5, 1024); clinic.add(new THREE.HemisphereLight(0xf0f6ff, 0x8a9098, 1.6));
  clinic.userData = { doc };
}

// =====================================================================
// SET 4: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260);
  clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(901); for (let i = 0; i < 40; i++) { const x = -120 + i * 6.3, h = 5 + r() * 6; dusk.add(box(5.5, h, 6, C([0xb89a8a, 0x9a8a7a, 0xa88a7a][i % 3]), x, h / 2, -110 - r() * 20)); for (let s = 0; s < 2; s++) dusk.add(box(5.9, 0.8, 6.4 - s * 2.4, M(T.roofRed), x, h + 0.4 + s * 0.8, -110)); }
  const sign = new THREE.Group(); dusk.add(sign);
  for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30);
  dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512);
  const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('LOOKSMAXXING, 2024', 72, 150, '#a3241c'); fit('WER NUR SEIN GESICHT OPTIMIERT,', 54, 290, '#3a2a1e'); fit('VERGISST DEN MENSCHEN DAHINTER', 54, 380, '#3a2a1e');
  stex.needsUpdate = true;
}

// =====================================================================
// Timeline – alles an Wörtern verankert (words.json mit referenzgleichem Timing)
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const DUR = 1804 / 30; // Ende so gesetzt, dass Pause am Loop-Übergang = Satzpause (~0,23 s)
const WHIP0 = wt(1), WHIP1 = wt(1) + 0.57; // Kranfahrt-Preset: startet auf „erklärt“, Dauer 0,57 s
const CUTS = [[0, 'hero'], [4, 'internet'], [7, 'sad'], [14, 'flaws'], [23, 'forum'], [29, 'idea'], [38, 'sport'], [42, 'skin'], [43, 'sleep'], [44, 'hair'],
  [47, 'works'], [50, 'happy'], [58, 'more'], [63, 'mew'], [73, 'jaw'], [77, 'measure'], [81, 'rate'], [89, 'scale'], [99, 'four'], [103, 'mog'],
  [111, 'smash'], [129, 'doctor'], [137, 'mirror'], [153, 'mia'], [163, 'mia2'], [170, 'mia3'], [175, 'delete'], [179, 'jog'], [184, 'morning'], [191, 'sign'], [199, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
function heroCam(t) { // Preset hook-kranfahrt.json
  const k = t / 1.4;
  const p0 = V(0.15, lerp(1.62, 1.58, k), lerp(4.6, 4.1, k)), t0 = V(0.05, 1.12, -0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-9.0 + drift * 2, 15.0 + drift * 1.2, 16.0 + drift * 2), t1 = V(2.0 + drift, 0.5, -10.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
function roomLight(mode) { const R = room.userData; const night = mode === 'night', morning = mode === 'morning';
  R.sun.intensity = night ? 0.35 : morning ? 3.2 : 1.6; R.sun.color.set(morning ? 0xffe2b0 : 0xb8c8ff); R.hemi.intensity = night ? 0.28 : morning ? 1.4 : 1.1; R.lamp.intensity = night || morning ? 0 : 6;
  R.winM.color.set(night ? 0x0e1630 : morning ? 0xffe6c0 : 0x4a6aa0); R.scrL.intensity = night ? 5 : morning ? 0 : 2.5; }
function showLeon(which) { const R = room.userData; [R.A, R.B, R.rA, R.rB].forEach(o => o.visible = false); if (which === 'A') { R.A.visible = R.rA.visible = true; } if (which === 'B') { R.B.visible = R.rB.visible = true; } }
function atMirror(L, rL, kind, t) { L.position.set(2.0, 0, -2.75); L.rotation.set(0, Math.PI, 0); rL.position.set(2.0, 0, -5.25); rL.rotation.set(0, 0, 0); pose2(L, kind, t); pose2(rL, kind, t); }
const MIRROR_CAM = u => mv(u, V(2.95, 1.78, -1.15), V(2.85, 1.75, -1.55), V(2.05, 1.5, -4.6), V(2.05, 1.5, -4.6), 46);
const MIRROR_CLOSE = u => mv(u, V(2.75, 1.78, -1.75), V(2.65, 1.76, -2.05), V(2.05, 1.55, -4.8), V(2.05, 1.55, -4.8), 42);

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = room, exp = 1.5; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const soft = () => { chat(wt(41), '<span style="color:#55ff55">[Softmaxxing]</span> Sport'); chat(wt(42), '<span style="color:#55ff55">[Softmaxxing]</span> Hautpflege'); chat(wt(43), '<span style="color:#55ff55">[Softmaxxing]</span> Schlaf'); chat(wt(46), '<span style="color:#55ff55">[Softmaxxing]</span> Haarschnitt'); };
  const R = room.userData; (R.A.userData.dbs || []).forEach(d => d.visible = sh.id === 'sport');

  // --- Schulhof / Stadt ---
  if (['hero', 'loop', 'mia', 'mia2', 'mia3', 'jog', 'happy'].includes(sh.id)) {
    scene = town; exp = 1.35; const { leon, mia, students, passer, hearts } = town.userData;
    const ta = sh.id === 'loop' ? t - DUR : t; // Loop: gleiche Animationszeit wie am Videoanfang
    students.forEach((s, i) => pose2(s, 'idle', ta, i)); updateBurst(hearts, -1); leon.userData.setFace({ smile: true });
    if (sh.id === 'hero' || sh.id === 'loop') {
      leon.position.set(-0.75, 0, 0); leon.rotation.y = 0.15; mia.position.set(0.75, 0, 0.1); mia.rotation.y = -0.3;
      pose2(leon, 'idle', ta); pose2(mia, 'idle', ta, 2); mia.userData.head.rotation.y = -0.45;
      const pw = sh.id === 'hero' ? Math.max(0, t - 1.0) : 0; passer.position.set(2.4, 0, -8 + pw * 2.2); passer.rotation.y = 0; pose2(passer, 'walk', sh.id === 'hero' ? t : 0);
      heroCam(sh.id === 'hero' ? t : t - DUR); tag(leon, 'Leon', '#ffd23f'); tag(mia, 'Mia', '#55ffff');
    } else {
      passer.position.set(-40, 0, 0);
      leon.position.set(8, 0, -4); leon.rotation.y = -Math.PI / 2;
      if (sh.id === 'happy') { const lx = -6 + (t - sh.a) * 1.8; leon.position.set(lx, 0, 4); leon.rotation.y = Math.PI / 2; pose2(leon, 'walk', t); mia.position.set(-60, 0, 0);
        cam(V(lx + 3.2, 1.6, 8.2), V(lx + 0.4, 1.3, 4), 48); tag(leon, 'Leon', '#ffd23f');
        if (t >= wt(57)) ui.eff = { o: clamp01((t - wt(57)) / 0.15), name: 'Selbstvertrauen', time: '0:30', col: '#55ff55' }; }
      if (sh.id === 'mia') { const k = smoother((t - sh.a) / 1.4); mia.position.set(lerp(3.2, 6.6, k), 0, -4); mia.rotation.y = Math.PI / 2; pose2(mia, k < 1 ? 'walk' : 'idle', t); leon.userData.setFace({ sad: true }); pose2(leon, 'sadidle', t); leon.userData.head.rotation.y = -0.4 * k;
        mv(u, V(5.6, 1.65, 1.6), V(5.9, 1.6, 1.0), V(6.2, 1.25, -4), V(6.6, 1.25, -4), 50); tag(leon, 'Leon', '#ffd23f'); tag(mia, 'Mia', '#55ffff');
        chat(wt(160), '<span style="color:#55ffff">&lt;Mia&gt;</span> Kommst du mit?'); }
      if (sh.id === 'mia2' || sh.id === 'mia3') { mia.position.set(6.6, 0, -4); mia.rotation.y = Math.PI / 2; pose2(mia, sh.id === 'mia3' ? 'laugh' : 'idle', t, 1); pose2(leon, sh.id === 'mia3' ? 'laugh' : 'idle', t); }
      if (sh.id === 'mia2') { mv(u, V(8.6, 1.72, -3.3), V(8.4, 1.72, -3.45), V(6.6, 1.62, -4.05), V(6.6, 1.62, -4.05), 44); tag(mia, 'Mia', '#55ffff'); chat(wt(160), '<span style="color:#55ffff">&lt;Mia&gt;</span> Kommst du mit?'); }
      if (sh.id === 'mia3') { mia.rotation.y = Math.PI / 2 - 0.7; leon.rotation.y = -Math.PI / 2 + 0.7; mv(u, V(7.3, 1.65, 1.4), V(7.3, 1.6, 0.8), V(7.3, 1.35, -4), V(7.3, 1.35, -4), 46); tag(leon, 'Leon', '#ffd23f'); tag(mia, 'Mia', '#55ffff');
        hearts.position.set(7.3, 2.2, -4); updateBurst(hearts, t - wt(173), 1.6, 1.6); }
      if (sh.id === 'jog') { const lx = -14 + (t - sh.a) * 4.2; leon.position.set(lx, 0, 19.5); leon.rotation.y = Math.PI / 2; pose2(leon, 'jog', t); mia.position.set(-60, 0, 0);
        cam(V(lx + 2.2, 1.6, 24.5), V(lx + 0.6, 1.1, 19.5), 50); tag(leon, 'Leon', '#ffd23f'); }
    }
  }
  // --- Zimmer ---
  const roomShots = ['internet', 'sad', 'flaws', 'forum', 'idea', 'sport', 'skin', 'sleep', 'works', 'more', 'mew', 'jaw', 'measure', 'rate', 'scale', 'four', 'mog', 'mirror', 'delete', 'morning'];
  if (roomShots.includes(sh.id)) {
    scene = room; exp = 1.45; R.drawClock(sh.id === 'mirror' ? (t - sh.a) * 14 : sh.id === 'morning' ? -60 : 15);
    const mode = ['internet', 'forum', 'idea', 'more', 'measure', 'rate', 'scale', 'mog', 'delete', 'sleep'].includes(sh.id) ? 'night' : sh.id === 'morning' ? 'morning' : 'eve'; roomLight(mode);
    R.blanket.visible = sh.id === 'sleep';
    const screenMode = { internet: 'internet', forum: 'forum', idea: 'forum', more: 'more', measure: 'canthal', rate: 'rate', scale: 'scale', mog: 'mog', delete: 'delete' }[sh.id] || 'forum'; drawScreen(screenMode, t);
    const atDesk = (L) => { L.position.set(-2.2, 0, -2.45); L.rotation.set(0, Math.PI, 0); pose2(L, 'type', t); sitPose(L, 0.55); };
    const SCREEN_CAM = () => mv(u, V(-2.2, 1.6, -2.15), V(-2.2, 1.6, -2.55), V(-2.2, 1.6, -3.62), V(-2.2, 1.6, -3.62), 46);
    if (sh.id === 'internet') { showLeon('A'); R.rA.visible = false; atDesk(R.A); mv(u, V(1.2, 2.4, 3.6), V(0.2, 2.1, 2.2), V(-2.2, 1.35, -3.5), V(-2.2, 1.4, -3.5), 50); info(wt(5), 'Das Internet, 2024'); }
    if (sh.id === 'sad' || sh.id === 'flaws' || sh.id === 'four') { showLeon(sh.id === 'four' ? 'B' : 'A'); const L = sh.id === 'four' ? R.B : R.A, rL = sh.id === 'four' ? R.rB : R.rA;
      L.userData.setFace({ sad: true }); rL.userData.setFace({ sad: true }); atMirror(L, rL, 'sadidle', t);
      if (sh.id === 'sad') { MIRROR_CAM(u); tag(rL, 'Leon', '#ffd23f'); if (t >= wt(13)) ui.eff = { o: clamp01((t - wt(13)) / 0.15), name: 'Unsicherheit', time: '∞', col: '#ff5555' }; }
      if (sh.id === 'flaws') { MIRROR_CLOSE(u); tag(rL, 'Leon', '#ffd23f'); ui.eff = { o: 1, name: 'Unsicherheit', time: '∞', col: '#ff5555' };
        chat(wt(15), '<span style="color:#ff5555">✗</span> Augen: zu klein'); chat(wt(18), '<span style="color:#ff5555">✗</span> Kinn: zu weich'); chat(wt(21), '<span style="color:#ff5555">✗</span> Haut: zu viele Pickel'); }
      if (sh.id === 'four') { MIRROR_CLOSE(u); const k = t >= wt(102); tag(rL, k ? 'Leon · 4/10' : 'Leon', k ? '#ff5555' : '#ffd23f'); } }
    if (['forum', 'more', 'measure', 'rate', 'scale', 'mog', 'delete'].includes(sh.id)) { showLeon('none'); atDesk(R.A); SCREEN_CAM();
      if (sh.id === 'rate') chat(wt(85), '<span style="color:#ffd23f">&lt;Leon&gt;</span> Und ich?');
      if (sh.id === 'mog') chat(wt(106), '<span style="color:#ff5555">&lt;Forum&gt;</span> Du wurdest gemoggt.');
      if (sh.id === 'delete') chat(wt(178), '<span style="color:#ffff55">Leon hat das Forum verlassen</span>'); }
    if (sh.id === 'idea') { showLeon('A'); R.rA.visible = false; atDesk(R.A); mv(u, V(-0.95, 1.65, -3.3), V(-1.1, 1.62, -3.2), V(-2.2, 1.5, -2.45), V(-2.2, 1.5, -2.45), 50); tag(R.A, 'Leon', '#ffd23f');
      chat(wt(31), '<span style="color:#ff5555">&lt;Forum&gt;</span> Hol das Maximum aus deinem Aussehen raus!'); }
    if (sh.id === 'sport') { showLeon('A'); R.rA.visible = false; R.A.position.set(0, 0, -1); R.A.rotation.set(0, 0.25, 0); pose2(R.A, 'curl', t); mv(u, V(0.7, 1.6, 2.5), V(0.55, 1.5, 1.8), V(0, 1.15, -1), V(0, 1.15, -1), 50); tag(R.A, 'Leon', '#ffd23f'); soft(); }
    if (sh.id === 'skin') { showLeon('A'); R.rA.visible = false; R.A.position.set(-2.7, 0, 0.9); R.A.rotation.set(0, 0.3, 0); pose2(R.A, 'cream', t); mv(u, V(-2.0, 1.85, 3.3), V(-2.1, 1.8, 3.0), V(-2.65, 1.45, 0.9), V(-2.65, 1.45, 0.9), 46); tag(R.A, 'Leon', '#ffd23f'); soft();
      ui.tip = { o: 1, icon: 'cream', title: 'Hautcreme', titleCol: '#55ffff', lines: ['<span style="color:#aaaaaa">Morgens &amp; abends</span>'] }; }
    if (sh.id === 'sleep') { showLeon('A'); R.rA.visible = false; const L = R.A; pose(L, 'idle', 0); L.rotation.set(-Math.PI / 2, 0, 0); L.position.set(2.85, 0.68, 2.25); L.userData.armL.rotation.x = L.userData.armR.rotation.x = 0;
      mv(u, V(1.4, 2.3, 3.6), V(1.5, 2.2, 3.4), V(2.85, 0.8, 0.9), V(2.85, 0.8, 0.9), 50); soft(); ui.tags.push([V(2.85, 1.3 + ((t * 0.8) % 0.4), 0.45), 'z Z z', '#ffffff']); }
    if (['works', 'jaw', 'mirror', 'morning'].includes(sh.id)) { showLeon('B');
      const happy = sh.id === 'works' || sh.id === 'morning'; R.B.userData.setFace({ smile: happy, sad: sh.id === 'mirror' }); R.rB.userData.setFace({ smile: happy, sad: sh.id === 'mirror' });
      atMirror(R.B, R.rB, sh.id === 'mirror' ? 'sadidle' : 'idle', t); tag(R.rB, 'Leon', '#ffd23f');
      if (sh.id === 'works') { MIRROR_CAM(u); if (t >= wt(49)) ui.toast = { x: lerp(640, 0, smoother((t - wt(49)) / 0.18)), t1: 'Fortschritt erzielt!', t2: 'Softmaxxing' }; }
      if (sh.id === 'jaw') { MIRROR_CLOSE(u);
        if (t >= wt(76)) ui.tip = { o: clamp01((t - wt(76)) / 0.1), icon: 'jaw', title: 'Kieferlinie', titleCol: '#ffffff', lines: ['<span style="color:#ffaa00">Bewertung: 6/10</span>', '<span style="color:#aaaaaa">Forum: „Nicht genug“</span>'] }; }
      if (sh.id === 'mirror') { mv(u, V(3.3, 2.1, 0.4), V(3.0, 1.85, -0.9), V(1.6, 1.6, -4.2), V(1.9, 1.5, -4.5), 50);
        info(wt(142), '60 Minuten vor dem Spiegel'); if (t >= wt(149)) ui.eff = { o: clamp01((t - wt(149)) / 0.15), name: 'Unsicherheit II', time: '∞', col: '#ff5555' }; }
      if (sh.id === 'morning') { MIRROR_CAM(u); info(wt(190), '7:00 Uhr – kurzer Blick, fertig'); }
    }
    if (sh.id === 'mew') { showLeon('B'); R.rB.visible = false; R.B.userData.setFace({ smile: false }); R.B.position.set(0, 0, -1); R.B.rotation.set(0, Math.PI / 2, 0); pose2(R.B, 'idle', t); R.B.userData.head.rotation.x = -0.12;
      mv(u, V(1.5, 1.8, 0.1), V(1.3, 1.78, -0.1), V(0.0, 1.6, -1), V(0.0, 1.6, -1), 44); tag(R.B, 'Leon', '#ffd23f');
      if (t >= wt(65)) ui.tip = { o: clamp01((t - wt(65)) / 0.1), icon: 'tongue', title: 'Mewing', titleCol: '#ffaa00', lines: ['<span style="color:#aaaaaa">Zunge dauerhaft an den Gaumen</span>', '<span style="color:#aaaaaa">Ziel: schärfere Kieferlinie</span>'] }; }
  }
  if (sh.id === 'hair') { scene = barber; exp = 1.3; const B = barber.userData; const cut = t >= wt(46); B.before.visible = !cut; B.after.visible = cut;
    for (const ch of [B.before, B.after]) { pose2(ch, 'idle', t); sitPose(ch, 1.0); ch.userData.armL.rotation.x = ch.userData.armR.rotation.x = -0.4; }
    pose2(B.bb, 'snip', t); updateBurst(B.hairBits, t - wt(46), 2.5, 0.8);
    mv(u, V(0.4, 1.95, 3.0), V(0.3, 1.9, 2.5), V(0, 1.75, 0), V(0, 1.75, 0), 46); tag(cut ? B.after : B.before, 'Leon', '#ffd23f'); soft(); }
  if (sh.id === 'smash') { scene = dark; exp = 1.3; const G = dark.userData.guy; pose2(G, 'raise', t, sh.a + 0.6); dark.userData.bulb.intensity = 6 + Math.sin(t * 23) * 0.6 + (Math.sin(t * 7.3) > 0.97 ? -3 : 0);
    mv(u, V(1.1, 1.7, 2.2), V(0.9, 1.68, 1.7), V(0, 1.45, -0.9), V(0, 1.5, -0.9), 50); tag(G, 'Forum-User', '#ff5555');
    if (t >= wt(127)) ui.tip = { o: clamp01((t - wt(127)) / 0.1), icon: 'hammer', title: 'Bone Smashing', titleCol: '#ff5555', lines: ['<span style="color:#ff5555">Gefährlich – nicht nachmachen!</span>'] }; }
  if (sh.id === 'doctor') { scene = clinic; exp = 1.25; const D = clinic.userData.doc; pose2(D, 'point', t); D.userData.armR.rotation.x = -1.6 + Math.sin(t * 2) * 0.05;
    mv(u, V(1.4, 1.7, 2.2), V(1.1, 1.7, 1.6), V(-0.2, 1.6, -2.6), V(-0.3, 1.6, -2.6), 50); tag(D, 'Ärztin/Arzt', '#ffffff');
    if (t >= wt(131)) ui.tip = { o: clamp01((t - wt(131)) / 0.1), icon: 'cross', title: 'Ärztliche Warnung', titleCol: '#ff5555', lines: ['<span style="color:#aaaaaa">Bone Smashing kann verursachen:</span>', '<span style="color:#ff5555">Knochenbrüche · Nervenschäden</span>'] }; }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 2.5, 0), V(0, 2.55, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  jaw: '<rect x="1" y="1" width="6" height="5" fill="#e8b894"/><rect x="2" y="6" width="4" height="1" fill="#e8b894"/><rect x="1" y="1" width="6" height="1" fill="#3e2614"/><rect x="2" y="3" width="1" height="1" fill="#222"/><rect x="5" y="3" width="1" height="1" fill="#222"/>',
  tongue: '<rect x="1" y="2" width="6" height="4" fill="#8a3a3a"/><rect x="2" y="4" width="4" height="2" fill="#e86a7a"/><rect x="1" y="1" width="6" height="1" fill="#f0f0f0"/>',
  hammer: '<rect x="3" y="3" width="1" height="5" fill="#6a4a2a"/><rect x="1" y="1" width="5" height="2" fill="#8a8e94"/>',
  cream: '<rect x="2" y="2" width="4" height="5" fill="#f0f0f0"/><rect x="2" y="1" width="4" height="1" fill="#55aaff"/><rect x="3" y="4" width="2" height="1" fill="#55aaff"/>',
  cross: '<rect x="3" y="1" width="2" height="6" fill="#ff4040"/><rect x="1" y="3" width="6" height="2" fill="#ff4040"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const NUM = { 'zweitausendvierundzwanzig.': '2024.', 'sechzehn': '16', 'eins': '1', 'zehn.': '10.', 'Vier.': '4.' }; if (NUM[txt]) txt = NUM[txt];
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.join('<br>');
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.toast) ex += `<div class="toast" style="transform:translateX(${ui.toast.x}px)"><svg width="72" height="72" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS.jaw}</svg><div><div class="t1">${ui.toast.t1}</div><div class="t2">${ui.toast.t2}</div></div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#5a1a1a"/><rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/><rect x="3" y="3" width="2" height="2" fill="#2a0a0a"/></svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div><div style="color:#aaaaaa">${ui.eff.time}</div></div></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
