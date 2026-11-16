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
  if (o.hat === 'straw') { const hc = C(0xd8c07a); head.add(box(0.9, 0.06, 0.9, hc, 0, 0.53, 0)); head.add(box(0.6, 0.1, 0.6, hc, 0, 0.6, 0)); head.add(box(0.3, 0.1, 0.3, hc, 0, 0.68, 0)); }
  if (o.hat === 'fedora') { const hc = C(o.hatCol ?? 0x3a3a3a); head.add(box(0.7, 0.04, 0.7, hc, 0, 0.52, 0)); head.add(box(0.5, 0.24, 0.5, hc, 0, 0.64, 0)); head.add(box(0.51, 0.06, 0.51, C(0x1a1a1a), 0, 0.56, 0)); }
  if (o.hat === 'hard') { const hc = C(o.hatCol ?? 0xf0c020); head.add(box(0.58, 0.18, 0.58, hc, 0, 0.58, 0)); head.add(box(0.5, 0.04, 0.2, hc, 0, 0.5, 0.34)); }
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


// ---------- weitere Hilfen ----------
function sunAt(s, c, off) { s.target.position.copy(c); s.position.copy(c).add(off); s.target.updateMatrixWorld(); }
const glowM = (col, ei = 1) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: ei, roughness: 0.8 });
const winLit = M(T.window, { emissive: 0xffa040, ei: 0.85 });
const candleMesh = () => { const g = new THREE.Group(); g.add(box(0.07, 0.22, 0.07, C(0xf0ead8), 0, 0.05, 0.12, { cast: false })); g.add(box(0.05, 0.08, 0.05, glowM(0xffb040, 3), 0, 0.2, 0.12, { cast: false })); return g; };
const goldBlock = () => box(0.3, 0.3, 0.3, M(T.gold, { metal: 0.6, rough: 0.35 }), 0, 0, 0);
function people(scene, n, seed, opt = {}) { const r = rng(seed), arr = [];
  for (let i = 0; i < n; i++) { const p = humanoid({ skin: (opt.skins ?? [0xe8b894, 0xf0c4a2, 0xe0a882, 0xf2cdb0])[i % (opt.skins?.length ?? 4)], hair: [0x3a2a1a, 0x6a4422, 0x2a1a14, 0x8a5a2a, 0x1a1a1a][Math.floor(r() * 5)],
      top: (opt.tops ?? [0x5a4a3a, 0x4a4a52, 0x6a5a3a, 0x3a4a5a])[Math.floor(r() * (opt.tops?.length ?? 4))], bottom: opt.bottom ?? 0x3a3430, longHair: opt.women ? i % 2 === 1 : false, skirt: opt.women ? i % 2 === 1 : false,
      hat: opt.hats ? opt.hats[i % opt.hats.length] : undefined, hatCol: opt.hatCol, beard: i % 3 === 0 ? 'short' : undefined, seed: seed + i }); scene.add(p); arr.push(p); } return arr; }
function fence(scene, x0, z0, x1, z1, h = 3, seed = 1) { // Pfosten + Stacheldraht
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.5)), post = C(0x4a4038), wire = C(0x8a8a8a, { metal: 0.5, rough: 0.5 });
  const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
  for (let i = 0; i <= n; i++) scene.add(box(0.16, h, 0.16, post, lerp(x0, x1, i / n), h / 2, lerp(z0, z1, i / n)));
  for (let k = 0; k < 5; k++) { const w = box(len, 0.03, 0.03, wire, (x0 + x1) / 2, 0.5 + k * (h - 0.6) / 4, (z0 + z1) / 2, { cast: false }); w.rotation.y = -ang; scene.add(w); }
}

// ---------- Figuren ----------
const WORKER = { skin: 0xe8b894, hair: 0x5a3a20, hat: 'cap', hatCol: 0x4a443c, top: 0x7a5a3a, bottom: 0x3a3430, shoe: 0x2a1c14, beard: 'short', beardCol: 0x5a3a20, eye: '#3a5a8a', seed: 51 };
const OWNER = { skin: 0xf0c8a8, hair: 0x2a2a2a, hat: 'top', beard: 'mustache', top: 0x1a1a22, bottom: 0x1a1a22, tie: 0xb02020, coat: true, shoe: 0x111111, smile: true, eye: '#2a2a2a', seed: 52 };
const MARX = { skin: 0xecc2a2, hair: 0x2a2624, hairVol: true, beard: 'full', beardCol: 0x3a3634, top: 0x1e1e24, bottom: 0x2a2a30, coat: true, shoe: 0x111111, eye: '#2a2018', seed: 53 };
const ENGELS = { skin: 0xf0c8a8, hair: 0x8a5a2a, beard: 'full', beardCol: 0x9a6a3a, top: 0x4a3a2a, bottom: 0x3a3028, coat: true, tie: 0xe8e0d0, shoe: 0x1a1410, eye: '#3a5a7a', seed: 54 };
const LENIN = { skin: 0xecc2a2, hair: 0x8a4a2a, bald: true, beard: 'goatee', beardCol: 0x8a4a2a, hat: 'cap', hatCol: 0x22222a, top: 0x2a2a30, bottom: 0x2a2a30, coat: true, tie: 0x8a1a1a, shoe: 0x111111, eye: '#2a2018', seed: 55 };
const STALIN = { skin: 0xe0b090, hair: 0x2a2420, hairVol: true, beard: 'mustache', beardCol: 0x2a2420, top: 0x9a8a5a, bottom: 0x7a6a42, belt: 0x3a2a1a, coat: true, shoe: 0x1a1410, eye: '#3a2a1a', seed: 56 };

// =====================================================================
// SET 1: England 1848 – Fabrikstadt bei Sonnenuntergang
// =====================================================================
const eng = new THREE.Scene();
{
  const sky = skyDome(eng, 0x2c3c78, 0xd8786a, 0xffb070, V(-0.5, 0.18, 0.85), [1, 0.75, 0.45]); eng.fog = new THREE.Fog(0xe89a70, 70, 330);
  clouds(eng, 12, 0xffb898, 70, 22, 220, 0.75);
  eng.add(box(600, 1, 600, M(T.cobble), 0, -0.5, 0, { cast: false, uvScale: 0.5 }));
  const brick = M(T.brick), brickD = M(T.brickDark);
  // Fabrik
  const f = new THREE.Group(); f.position.set(2, 0, -26); eng.add(f);
  f.add(box(28, 9, 8, brick, 0, 4.5, 0));
  for (let i = 0; i < 7; i++) { const sx = -12 + i * 4; const r1 = box(4, 0.4, 4.6, M(T.roof), sx, 10.2, 0); r1.rotation.z = 0.5; f.add(r1); f.add(box(0.3, 2.0, 8, M(T.roof), sx + 1.8, 9.9, 0)); }
  f.add(box(28.4, 0.6, 8.4, brickD, 0, 9.1, 0));
  for (const y of [2.6, 6.2]) for (let x = -12; x <= 12; x += 2.6) { if (Math.abs(x) < 2.2 && y < 4) continue; f.add(box(1.5, 2.0, 0.12, winLit, x, y, 4.02, { cast: false })); }
  f.add(box(4, 5, 0.2, M(T.darkwood), 0, 2.5, 4.05)); f.add(box(4.6, 0.5, 0.3, brickD, 0, 5.2, 4.1));
  const smokes = [];
  for (const [x, z, h] of [[-9, -31, 24], [3, -34, 28], [15, -30, 22]]) { eng.add(box(2.2, h, 2.2, brickD, x, h / 2, z)); eng.add(box(2.8, 0.6, 2.8, brickD, x, h + 0.3, z)); smokes.push(smoke(eng, x, h + 0.6, z, 14, x * 7 + 3, 0x4a4440)); }
  // Arbeiterhäuser
  const r = rng(3001), houseCols = [T.brick, T.brickDark, T.brickGrey];
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -8 + i * 6, x = side * (side < 0 ? 12 : 16), h = 6 + r() * 2.5; const g = new THREE.Group(); g.position.set(x, 0, z); eng.add(g);
    g.add(box(6, h, 5.8, M(houseCols[i % 3]), 0, h / 2, 0)); for (let s = 0; s < 3; s++) g.add(box(6.3 - s * 2, 0.8, 6, M(T.roof), 0, h + 0.4 + s * 0.8, 0));
    g.add(box(0.1, 2.0, 1.0, M(T.darkwood), -side * 3.02, 1.0, 1.2, { cast: false }));
    for (const wy of [2.6, 5.0]) for (const wz of [-1.4, 1.6]) { if (wy < 3 && wz > 1) continue; const w = box(0.1, 1.1, 0.9, r() < 0.45 ? winLit : M(T.windowDark), -side * 3.02, wy, wz, { cast: false }); g.add(w); }
    g.add(box(0.8, 2.2, 0.8, brickD, 1.5, h + 1.1, -1.5)); }
  // Laternen
  for (const z of [-4, 4, 12]) for (const x of [-7.5, 11]) { eng.add(box(0.14, 3.4, 0.14, C(0x1a1a1a), x, 1.7, z)); eng.add(box(0.36, 0.44, 0.36, glowM(0xffc060, 1.6), x, 3.5, z, { cast: false })); }
  // Villa des Besitzers
  const v = new THREE.Group(); v.position.set(50, 0, -12); eng.add(v);
  v.add(box(16, 9, 9, M(T.white), 0, 4.5, 0)); v.add(box(16.8, 0.8, 9.8, M(T.roof), 0, 9.4, 0)); for (let x = -6; x <= 6; x += 2.4) v.add(box(0.7, 7, 0.7, M(T.white), x, 3.5, 5.2)); v.add(box(15, 0.8, 1.8, M(T.white), 0, 7.4, 5.2));
  for (const wx of [-5, 5]) for (const wy of [2.4, 6]) v.add(box(1.4, 1.8, 0.1, winLit, wx, wy, 4.52, { cast: false })); v.add(box(2, 3, 0.1, C(0x3a2416), 0, 1.5, 4.52, { cast: false }));
  v.add(box(16, 0.4, 3, M(T.white), 0, 0.2, 6)); 
  const pile = new THREE.Group(); pile.position.set(50, 0, -3.6); eng.add(pile); const gm = M(T.gold, { metal: 0.6, rough: 0.35 });
  for (let i = 0; i < 40; i++) { const lv = i < 16 ? 0 : i < 28 ? 1 : i < 36 ? 2 : 3, k = lv === 0 ? i : lv === 1 ? i - 16 : lv === 2 ? i - 28 : i - 36, n = [4, 3, 2, 2][lv]; const b = box(0.3, 0.3, 0.3, gm, (k % n) * 0.32 - (n - 1) * 0.16, 0.15 + lv * 0.3, Math.floor(k / n) * 0.32 - (n - 1) * 0.16); b.userData.k = i; pile.add(b); }
  // Hütte der Armen
  const sh = new THREE.Group(); sh.position.set(-46, 0, -8); eng.add(sh); const dw = M(T.darkwood);
  sh.add(box(7, 3.2, 5, dw, 0, 1.6, 0)); const rf = box(7.6, 0.3, 5.8, M(T.roof), 0, 3.6, 0); rf.rotation.x = 0.18; sh.add(rf); sh.add(box(1.0, 2.0, 0.1, C(0x1a120c), -1.6, 1.0, 2.52, { cast: false })); sh.add(box(0.9, 0.7, 0.1, winLit, 1.6, 1.8, 2.52, { cast: false }));
  for (let i = 0; i < 5; i++) eng.add(box(1, 0.04, 1, M(T.dirt), -48 + i * 1.3, 0.02, -3 + (i % 2) * 0.8, { cast: false }));
  // Wiese (Idee)
  eng.add(box(90, 0.1, 70, M(T.grass), 0, 0.05, 75, { cast: false }));
  const tbl = new THREE.Group(); tbl.position.set(0, 0, 68); eng.add(tbl); tbl.add(box(6, 0.12, 1.2, M(T.planks), 0, 0.85, 0)); for (const x of [-2.7, 2.7]) for (const z of [-0.45, 0.45]) tbl.add(box(0.12, 0.85, 0.12, C(0x5a3a22), x, 0.42, z));
  const loaves = []; for (let i = 0; i < 9; i++) { const l = box(0.34, 0.18, 0.22, C(i % 3 === 2 ? 0xd84a2a : 0xc8883a), -2.4 + i * 0.6, 1.0, (i % 2) * 0.2 - 0.1); tbl.add(l); loaves.push(l); }
  const rflag = flag(flagTex.red, 2.6, 1.6, 6, eng, V(3.0, 0.1, 53), 0, 0.3);
  const sun = sunLight(eng, 0xffc890, 3.6, V(-30, 22, 50), V(0, 0, -6), 40, 2048); eng.add(new THREE.HemisphereLight(0xffd8b8, 0x8a6048, 1.15));
  const rim = new THREE.DirectionalLight(0x8aa0ff, 0.9); rim.position.set(10, 12, -30); eng.add(rim);
  // Figuren
  const worker = humanoid(WORKER), owner = humanoid(OWNER); owner.userData.hatExtra = 0.45; hammerInHand(worker);
  owner.userData.body.add(box(0.14, 0.04, 0.02, C(0xf0c030, { metal: 0.7, rough: 0.3 }), 0.12, 1.0, 0.16, { cast: false }));
  const ownerGold = inHand(owner, goldBlock()); ownerGold.children[0].position.z = 0.15;
  const foreman = humanoid({ skin: 0xe0a882, hair: 0x2a1a14, beard: 'full', beardCol: 0x2a1a14, hat: 'fedora', hatCol: 0x2a2a2a, top: 0x2e2e36, bottom: 0x2a2a30, angry: true, seed: 61 }); foreman.userData.hatExtra = 0.2;
  const sick = humanoid({ ...WORKER, beard: undefined, hat: 'cap', top: 0x6a6252, sad: true, seed: 62 });
  const wife = humanoid({ skin: 0xf0c4a2, hair: 0x6a3a1a, longHair: true, top: 0x5a4a5a, bottom: 0x4a3e3e, skirt: true, sad: true, seed: 63 });
  const kid = humanoid({ skin: 0xf0c4a2, hair: 0x8a5a2a, top: 0x6a5a4a, bottom: 0x3a3430, sad: true, scale: 0.62, seed: 64 });
  const crowd = people(eng, 8, 3100, { tops: [0x7a5a3a, 0x5a5a62, 0x6a4a2a, 0x4a5a4a], hats: ['cap', undefined, 'cap', undefined], hatCol: 0x3a3630, women: true });
  const equal = []; for (let i = 0; i < 7; i++) { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2, 0xe0a882, 0xf2cdb0, 0xc89a72][i % 5], hair: [0x3a2a1a, 0x6a4422, 0x2a1a14, 0x8a5a2a][i % 4], top: 0x5a6a8a, bottom: 0x3a4458, longHair: i % 2 === 1, smile: true, seed: 3200 + i }); eng.add(p); equal.push(p); }
  eng.add(worker, owner, foreman, sick, wife, kid);
  eng.userData = { sky, sun, smokes, worker, owner, foreman, sick, wife, kid, crowd, equal, pile, loaves, rflag, ownerGold };
}

// =====================================================================
// SET 2: Fabrikhalle (innen)
// =====================================================================
const fac = new THREE.Scene(); fac.background = new THREE.Color(0x1a1410); fac.fog = new THREE.Fog(0x3a2e24, 18, 60);
{
  room3(fac, 26, 18, 8, M(T.brick), M(T.planks), false);
  for (let x = -10; x <= 10; x += 5) fac.add(box(0.5, 0.5, 18, C(0x3a2a1e), x, 8.2, 0));
  for (let z = -8; z <= 8; z += 4) fac.add(box(26, 0.3, 0.3, C(0x2a2a2e, { metal: 0.5 }), 0, 6.8, z));
  for (const z of [-6, 0]) for (const y of [3, 5.6]) for (const x of [-12.8]) fac.add(box(0.1, 1.6, 2.2, winLit, x + 0.1, y, z, { cast: false }));
  const looms = [], metal = M(T.metal, { metal: 0.4, rough: 0.6 });
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.set(-8 + i * 5, 0, -5 + row * 4.5); fac.add(g);
    g.add(box(2.6, 1.0, 1.4, metal, 0, 0.5, 0)); g.add(box(2.4, 0.08, 1.2, C(0xe8e0d0), 0, 1.04, 0, { cast: false })); for (const x of [-1.2, 1.2]) g.add(box(0.16, 2.2, 0.16, metal, x, 1.1, -0.6));
    g.add(box(2.6, 0.16, 0.16, metal, 0, 2.1, -0.6)); const sh = box(0.4, 0.14, 0.2, C(0x8a5a2a), 0, 1.15, 0); g.add(sh); const belt = box(0.08, 4.6, 0.08, C(0x2a1a10), 0.9, 4.4, -0.6, { cast: false }); g.add(belt); looms.push(sh); }
  // Förderband (heute)
  const conv = new THREE.Group(); conv.position.set(0, 0, 6.5); fac.add(conv); conv.add(box(16, 0.9, 1.4, metal, 0, 0.45, 0)); conv.add(box(16, 0.06, 1.2, C(0x1a1a1a), 0, 0.93, 0, { cast: false }));
  const golds = []; for (let i = 0; i < 9; i++) { const b = goldBlock(); fac.add(b); golds.push(b); }
  const sun = sunLight(fac, 0xffd8a0, 2.4, V(-14, 16, 12), V(0, 0, 0), 16, 2048); fac.add(new THREE.HemisphereLight(0xffe0b8, 0x4a3020, 1.2));
  const lamp = new THREE.PointLight(0xffb060, 8, 16, 1.2); lamp.position.set(0, 5, 3); fac.add(lamp);
  const ws = people(fac, 8, 3300, { tops: [0x7a5a3a, 0x5a5a62, 0x6a4a2a, 0x4a5a4a], women: true, hats: ['cap', undefined], hatCol: 0x3a3630 });
  const kid = humanoid({ skin: 0xf0c4a2, hair: 0x8a5a2a, top: 0x6a5a4a, bottom: 0x3a3430, sad: true, scale: 0.62, seed: 64 });
  const kid2 = humanoid({ skin: 0xf2cdb0, hair: 0xc8a05a, longHair: true, top: 0x5a4a5a, bottom: 0x4a3e3e, skirt: true, sad: true, scale: 0.6, seed: 65 });
  const foreman = humanoid({ skin: 0xe0a882, hair: 0x2a1a14, beard: 'full', beardCol: 0x2a1a14, hat: 'fedora', hatCol: 0x2a2a2a, top: 0x2e2e36, bottom: 0x2a2a30, angry: true, seed: 61 }); foreman.userData.hatExtra = 0.2;
  const sick = humanoid({ ...WORKER, beard: undefined, top: 0x6a6252, sad: true, seed: 62 });
  const modern = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2][i], hair: [0x2a1a14, 0x1a1a1a, 0x8a4a22][i], longHair: i === 2, top: 0xf07a20, bottom: 0x2a3448, hat: 'hard', seed: 3400 + i }); fac.add(p); return p; });
  const boss = humanoid({ skin: 0xf0c8a8, hair: 0x3a2a1a, top: 0x1a1a22, bottom: 0x1a1a22, tie: 0xb02020, coat: true, smile: true, seed: 3410 });
  fac.add(kid, kid2, foreman, sick, boss);
  fac.userData = { conv, looms, ws, kid, kid2, foreman, sick, modern, boss, golds };
}

// =====================================================================
// SET 3: Arbeitszimmer (Kerzenlicht)
// =====================================================================
const study = new THREE.Scene(); study.background = new THREE.Color(0x0a0806);
{
  room3(study, 8, 7, 3.4, M(T.wallpaperRed), M(T.planks));
  for (const x of [-2.6, -0.8]) study.add(box(1.7, 3.0, 0.5, M(T.books), x, 1.5, -3.2));
  study.add(box(0.5, 3.0, 2.4, M(T.books), -3.6, 1.5, -1.0));
  const winM = new THREE.MeshBasicMaterial({ color: 0x1a2a52 }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), winM); win.position.set(1.8, 1.9, -3.33); study.add(win);
  study.add(box(1.5, 0.1, 0.12, C(0x3a2416), 1.8, 1.9, -3.3, { cast: false })); study.add(box(0.1, 1.7, 0.12, C(0x3a2416), 1.8, 1.9, -3.3, { cast: false }));
  // Tisch
  study.add(box(2.6, 0.1, 1.3, M(T.darkwood), 0.4, 0.82, -0.6)); for (const [x, z] of [[-0.8, -1.15], [1.6, -1.15], [-0.8, -0.05], [1.6, -0.05]]) study.add(box(0.1, 0.82, 0.1, C(0x3a2416), x, 0.41, z));
  for (const [x, z] of [[-0.3, -0.9], [1.3, -0.95]]) { study.add(box(0.08, 0.22, 0.08, C(0xf0ead8), x, 0.98, z, { cast: false })); study.add(box(0.05, 0.08, 0.05, glowM(0xffb040, 4), x, 1.13, z, { cast: false })); }
  const manifest = box(0.42, 0.04, 0.3, C(0xb82020), 0.5, 0.89, -0.45, { cast: false }); study.add(manifest);
  for (let i = 0; i < 5; i++) study.add(box(0.3, 0.01, 0.4, C(0xe8e2d0), -0.2 + i * 0.12, 0.88 + i * 0.004, -0.7 + (i % 2) * 0.1, { cast: false }));
  study.add(box(0.55, 0.08, 0.55, C(0x5a2a1a), -0.2, 0.5, -1.75)); study.add(box(0.55, 0.7, 0.08, C(0x5a2a1a), -0.2, 0.85, -2.05));
  const c1 = new THREE.PointLight(0xffa850, 7, 7, 1.3); c1.position.set(0.5, 1.5, -0.6); study.add(c1);
  sunLight(study, 0x6a7ab8, 0.5, V(3, 5, 8), V(0, 0, -1), 6, 1024); study.add(new THREE.HemisphereLight(0xffc890, 0x2a1a10, 0.65));
  const marx = humanoid(MARX), engels = humanoid(ENGELS); const quill = inHand(marx, box(0.03, 0.03, 0.3, C(0xf0f0f0), 0, 0, 0.18));
  const hist = humanoid({ skin: 0xf0c4a2, hair: 0x6a6a6a, hairVol: true, top: 0x5a6a5a, bottom: 0x3a3a42, tie: 0x7a2a2a, eye: '#3a5a7a', seed: 71 }); const hbook = inHand(hist, bookMesh(0x2a3a6a));
  study.add(marx, engels, hist);
  study.userData = { marx, engels, hist, quill, hbook, manifest };
}

// =====================================================================
// SET 4: Russland – Winter, kühles Licht
// =====================================================================
const rus = new THREE.Scene();
{
  skyDome(rus, 0x6a7a90, 0xa8b4c4, 0xd8dde4, V(-0.4, 0.3, 0.5), [0.8, 0.8, 0.85]); rus.fog = new THREE.Fog(0xc8d0d8, 50, 240);
  rus.add(box(600, 1, 600, M(T.snow), 0, -0.5, 0, { cast: false }));
  // Palast mit Zwiebeltürmen
  const pal = new THREE.Group(); pal.position.set(0, 0, -34); rus.add(pal); const rb = M(tileTex(0xa83a2a, 0x6a2a1e, 4001)), wt2 = M(T.white);
  pal.add(box(36, 10, 10, rb, 0, 5, 0)); pal.add(box(36.6, 0.8, 10.6, wt2, 0, 10.4, 0));
  for (let x = -16; x <= 16; x += 2.4) pal.add(box(1.2, 1.2, 0.6, rb, x, 11.4, 5));
  for (const x of [-12, -6, 0, 6, 12]) for (const y of [3, 7]) pal.add(box(1.4, 2.0, 0.1, M(T.windowDark), x, y, 5.02, { cast: false }));
  const dome = (x, z, h, col) => { pal.add(box(3, h, 3, wt2, x, h / 2, z)); const dm = C(col, { metal: 0.3, rough: 0.5 }); for (const [s, y] of [[3.6, 0.6], [4.0, 1.4], [3.4, 2.2], [2.4, 2.9], [1.2, 3.5], [0.4, 4.1]]) pal.add(box(s, 0.8, s, dm, x, h + y, z)); pal.add(box(0.15, 1.2, 0.15, C(0xf0c030, { metal: 0.7 }), x, h + 5, z)); };
  dome(-14, 3, 14, 0x2a8a5a); dome(0, 2, 18, 0xf0c030); dome(14, 3, 14, 0x2a5aa8); dome(-7, 1, 12, 0xd84a2a); dome(7, 1, 12, 0x2a8a5a);
  const sflag = flag(flagTex.soviet, 3.6, 2.4, 6, rus, V(0, 23.8, -32), 0, 0.5);
  // Rednertribüne
  rus.add(box(4, 1.6, 2.4, C(0xa82020), 0, 0.8, -8)); rus.add(box(4.2, 0.12, 2.6, M(T.darkwood), 0, 1.66, -8)); rus.add(box(1.0, 1.0, 0.6, C(0x8a1a1a), 0, 2.2, -7.2));
  const flags = []; for (const [x, z, ph] of [[-6, -5, 0], [5.5, -4.5, 1.3], [-9, 2, 2.1], [8, 1.5, 3]]) flags.push(flag(flagTex.red, 2.2, 1.4, 4.4, rus, V(x, 0, z), 0, ph));
  // Bauernhof + Laden
  const barn = new THREE.Group(); barn.position.set(44, 0, -8); rus.add(barn); barn.add(box(8, 4, 6, M(T.planks), 0, 2, 0)); const br = box(8.6, 0.3, 4, M(T.roofRed), 0, 4.8, -1.4); br.rotation.x = 0.55; barn.add(br); const br2 = br.clone(); br2.position.z = 1.4; br2.rotation.x = -0.55; barn.add(br2);
  barn.add(box(2.4, 2.8, 0.1, C(0x5a2a1a), 0, 1.4, 3.02, { cast: false }));
  const shop = new THREE.Group(); shop.position.set(54, 0, -8); rus.add(shop); shop.add(box(5, 4, 5, M(T.brickGrey), 0, 2, 0)); shop.add(box(5.4, 0.4, 5.4, M(T.roof), 0, 4.2, 0)); shop.add(box(2.2, 1.6, 0.1, winLit, -0.8, 1.6, 2.52, { cast: false })); shop.add(box(0.9, 2.0, 0.1, C(0x3a2416), 1.6, 1.0, 2.52, { cast: false }));
  const stateFlag = flag(flagTex.red, 1.6, 1.0, 3.6, rus, V(48.8, 0, -3.6), 0, 0.8);
  for (let i = 0; i < 6; i++) rus.add(box(1.2, 0.5, 0.5, C(0xc8a54a), 40 + i * 1.3, 0.25, -2.8));
  // Gulag
  fence(rus, -70, -14, -46, -14, 3.2); fence(rus, -70, -14, -70, 6, 3.2); fence(rus, -46, -14, -46, 6, 3.2);
  for (const x of [-64, -55]) { const g = new THREE.Group(); g.position.set(x, 0, -9); rus.add(g); g.add(box(7, 2.8, 4, M(T.darkwood), 0, 1.4, 0)); g.add(box(7.4, 0.3, 4.4, M(T.roof), 0, 2.95, 0)); g.add(box(1.0, 2.0, 0.1, C(0x1a120c), 0, 1.0, 2.02, { cast: false })); }
  const tw = new THREE.Group(); tw.position.set(-46, 0, 6); rus.add(tw); for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) tw.add(box(0.2, 6, 0.2, M(T.darkwood), x, 3, z)); tw.add(box(2.4, 0.2, 2.4, M(T.planks), 0, 6, 0)); tw.add(box(2.4, 1, 0.1, M(T.planks), 0, 6.6, 1.15)); tw.add(box(2.8, 0.3, 2.8, M(T.roof), 0, 8.2, 0));
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) tw.add(box(0.12, 1.8, 0.12, M(T.darkwood), x, 7.2, z));
  const rocks = []; for (let i = 0; i < 10; i++) { rocks.push(box(0.7, 0.5, 0.6, C(0x6a6a70), -60 + (i % 5) * 1.4, 0.25, -2 + Math.floor(i / 5) * 1.6)); rus.add(rocks[i]); }
  // Hungerfeld
  rus.add(box(30, 0.08, 20, M(T.dirt), 20, 0.04, 40, { cast: false })); for (let i = 0; i < 30; i++) rus.add(box(0.1, 0.4, 0.1, C(0x6a5a3a), 10 + (i % 10) * 2, 0.2, 34 + Math.floor(i / 10) * 3));
  const hut = new THREE.Group(); hut.position.set(26, 0, 32); rus.add(hut); hut.add(box(6, 3, 4.5, M(T.darkwood), 0, 1.5, 0)); hut.add(box(6.6, 0.3, 5, M(T.snow), 0, 3.15, 0)); hut.add(box(1, 2, 0.1, C(0x1a120c), -1.2, 1, 2.27, { cast: false }));
  const sun = sunLight(rus, 0xdfe6f4, 2.4, V(-30, 40, 40), V(0, 0, -8), 40, 2048); rus.add(new THREE.HemisphereLight(0xc8d4ec, 0x7a7a88, 1.6));
  // Figuren
  const lenin = humanoid(LENIN), stalin = humanoid(STALIN); stalin.userData.hatExtra = 0.0;
  const crowd = people(rus, 14, 4100, { tops: [0x4a4a52, 0x5a4a3a, 0x3a4a3a, 0x6a5a4a], hats: ['ushanka', 'cap', 'ushanka', undefined], hatCol: 0x3a3a3a, bottom: 0x2a2a30 });
  const soldiers = [0, 1, 2, 3, 4, 5].map(i => { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2, 0xe0a882][i % 3], hair: 0x2a1a14, top: 0x6a6a42, bottom: 0x5a5a3a, belt: 0x3a2a1a, hat: 'military', seed: 4200 + i }); p.userData.hatExtra = 0.12; rus.add(p); return p; });
  const farmer = humanoid({ skin: 0xe8b894, hair: 0x8a6a3a, beard: 'full', beardCol: 0x8a6a3a, top: 0x8a6a4a, bottom: 0x4a3a2a, hat: 'ushanka', sad: true, seed: 4300 });
  const prisoners = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2, 0xe0a882, 0xd8a882][i], hair: 0x3a2a1a, top: 0x5a5a5a, bottom: 0x4a4a4a, hat: 'ushanka', sad: true, seed: 4400 + i }); hammerInHand(p); rus.add(p); return p; });
  const famine = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2, 0xf2cdb0][i], hair: [0x8a6a3a, 0x6a3a1a, 0xc8a05a][i], top: [0x6a5a4a, 0x5a4a5a, 0x7a5a3a][i], bottom: 0x3a3430, longHair: i === 1, skirt: i === 1, sad: true, scale: i === 2 ? 0.64 : 0.95, seed: 4500 + i }); rus.add(p); return p; });
  rus.add(lenin, stalin, farmer);
  rus.userData = { sun, sflag, lenin, stalin, crowd, soldiers, farmer, prisoners, famine, flags, stateFlag };
}

// =====================================================================
// SET 5: Flaggen-Hügel + China-Feld
// =====================================================================
const asia = new THREE.Scene();
{
  skyDome(asia, 0x4a7ac8, 0x9ac0e8, 0xe8e0c8, V(-0.4, 0.5, 0.5)); asia.fog = new THREE.Fog(0xe8e0c8, 80, 360); clouds(asia, 21, 0xffffff, 60, 20, 200, 0.9);
  asia.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  for (let i = 0; i < 4; i++) asia.add(box(30 - i * 6, 1, 20 - i * 4, M(T.grass), 0, 0.5 + i, -6, { cast: false }));
  const fl = [flagTex.china, flagTex.cuba, flagTex.ddr].map((tx, i) => flag(tx, 3.0, 2.0, 6.5, asia, V(-4.5 + i * 4.5, 4, -6), 0, i * 1.7));
  // China-Feld (trocken)
  asia.add(box(40, 0.1, 30, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x9a7a52, 0.14), 5001)), 60, 0.05, 0, { cast: false }));
  for (let i = 0; i < 40; i++) asia.add(box(0.12, 0.3 + (i % 3) * 0.1, 0.12, C(0x8a7a42), 46 + (i % 10) * 2.6, 0.18, -10 + Math.floor(i / 10) * 3, { cast: false }));
  const hut = new THREE.Group(); hut.position.set(66, 0, -8); asia.add(hut); hut.add(box(6, 3, 4, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xb89a72, 0.08), 5002)), 0, 1.5, 0)); for (let s = 0; s < 3; s++) hut.add(box(6.8 - s * 2, 0.6, 4.8, C(0x5a4a3a), 0, 3.3 + s * 0.6, 0)); hut.add(box(1, 2, 0.1, C(0x2a1a10), 0, 1, 2.02, { cast: false }));
  const sun = sunLight(asia, 0xfff0d0, 3.0, V(-40, 50, 40), V(0, 0, -4), 40); asia.add(new THREE.HemisphereLight(0xcfe2ff, 0x7a6a4a, 1.5));
  const farmers = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xe0b088, 0xd8a47c, 0xe8bc94][i], hair: 0x141010, top: [0x3a4a6a, 0x4a5a6a, 0x5a5a5a][i], bottom: 0x2a2a30, longHair: i === 1, hat: i !== 1 ? 'straw' : undefined, sad: true, scale: i === 2 ? 0.64 : 0.95, seed: 5100 + i }); asia.add(p); return p; });
  const bowl = new THREE.Group(); bowl.add(box(0.26, 0.1, 0.26, C(0xe8e4d8), 0, 0, 0.18)); inHand(farmers[0], bowl);
  asia.userData = { fl, farmers };
}

// =====================================================================
// SET 6: DDR – Plattenbau-Straße + Grenze
// =====================================================================
const ddr = new THREE.Scene();
{
  skyDome(ddr, 0x7a8aa0, 0xb0bac8, 0xd8dce0, V(-0.4, 0.4, 0.5), [0.9, 0.9, 0.85]); ddr.fog = new THREE.Fog(0xd0d4d8, 60, 280); clouds(ddr, 31, 0xe8e8ec, 50, 30, 200, 0.95);
  ddr.add(box(600, 1, 600, M(T.concrete), 0, -0.5, 0, { cast: false, uvScale: 0.6 }));
  ddr.add(box(300, 0.06, 7, C(0x4a4a4e), 0, 0.03, 6, { cast: false }));
  const panel = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xbab4a6, 0.05); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x8a857a); px(c, 0, i, 0x8a857a); } }, 6001));
  for (const [x, z, w] of [[-14, -10, 26], [18, -10, 26], [-6, -34, 40]]) { const g = new THREE.Group(); g.position.set(x, 0, z); ddr.add(g); g.add(box(w, 15, 8, panel, 0, 7.5, 0, { uvScale: 0.33 }));
    for (let fx = -w / 2 + 1.6; fx < w / 2 - 1; fx += 2.6) for (let fy = 1.6; fy < 14; fy += 2.8) { const lit = ((fx * 13 + fy * 7) | 0) % 5 === 0; g.add(box(1.4, 1.3, 0.1, lit ? winLit : M(T.windowDark), fx, fy, 4.02, { cast: false })); if (fy > 3) g.add(box(1.8, 0.1, 0.6, C(0x9a958a), fx, fy - 0.85, 4.3, { cast: false })); } }
  const car = (x, z, col, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; ddr.add(g); g.add(box(3.4, 0.7, 1.5, C(col), 0, 0.6, 0)); g.add(box(1.8, 0.6, 1.4, C(col), -0.2, 1.25, 0)); g.add(box(1.7, 0.5, 1.42, new THREE.MeshStandardMaterial({ color: 0x9ab0c0, roughness: 0.2, metalness: 0.3 }), -0.2, 1.25, 0, { cast: false }));
    for (const [wx, wz] of [[-1.1, -0.75], [1.1, -0.75], [-1.1, 0.75], [1.1, 0.75]]) g.add(box(0.5, 0.5, 0.2, C(0x1a1a1a), wx, 0.25, wz)); return g; };
  car(-15, 4.5, 0x8ab0a8); car(3, 4.5, 0xd8c890); car(10, 7.5, 0x6a8ab8, Math.PI);
  for (const x of [-20, -10, 0, 12, 22]) { ddr.add(box(0.16, 5, 0.16, C(0x6a6a6a), x, 2.5, 1.6)); ddr.add(box(1.2, 0.2, 0.3, C(0x6a6a6a), x - 0.5, 5, 1.6)); }
  // Bank + Baum für Stasi-Szene
  const bench = new THREE.Group(); bench.position.set(30, 0, 0); ddr.add(bench); bench.add(box(2.4, 0.1, 0.55, M(T.planks), 0, 0.5, 0)); bench.add(box(2.4, 0.5, 0.08, M(T.planks), 0, 0.85, -0.26)); for (const xx of [-1, 1]) bench.add(box(0.1, 0.5, 0.5, C(0x3a3a3a), xx, 0.25, 0));
  for (const [x, z] of [[36, -3], [24, -4], [40, 2], [32.9, -2.9]]) { ddr.add(box(0.7, 4, 0.7, C(0x5a3a22), x, 2, z)); ddr.add(box(3.6, 3, 3.6, C(0x4a7a3a), x, 5.2, z)); }
  // Grenze
  fence(ddr, 56, -14, 56, 14, 3.6); ddr.add(box(0.3, 1.0, 0.3, C(0xd02020), 52, 0.5, 2)); const bar = box(6, 0.18, 0.18, C(0xe8e8e8), 52 + 3, 0.95, 2); ddr.add(bar); for (let i = 0; i < 3; i++) ddr.add(box(0.8, 0.2, 0.2, C(0xd02020), 53 + i * 2, 0.95, 2.02));
  ddr.add(box(1.4, 1.0, 0.1, C(0xf0f0f0), 50.5, 2.2, 3.5)); 
  const sun = sunLight(ddr, 0xf0ece0, 2.6, V(-35, 45, 40), V(0, 0, -6), 40); ddr.add(new THREE.HemisphereLight(0xd0d8e8, 0x6a6a6a, 1.6));
  const worker = humanoid({ skin: 0xe8b894, hair: 0x6a4422, top: 0x3a5a8a, bottom: 0x2a3448, shoe: 0x2a2a2a, eye: '#3a5a8a', seed: 6100 }); const brief = new THREE.Group(); brief.add(box(0.12, 0.3, 0.4, C(0x5a3a1a), 0, -0.1, 0)); worker.userData.armL.add(brief); brief.position.set(0, -0.7, 0);
  const stasi = humanoid({ skin: 0xe8c0a0, hair: 0x3a3a3a, hat: 'fedora', hatCol: 0x5a5448, top: 0x7a7262, bottom: 0x5a5448, coat: true, shoe: 0x1a1a1a, seed: 6101 }); stasi.userData.hatExtra = 0.2; const note = inHand(stasi, box(0.2, 0.26, 0.04, C(0xe8e4d8), 0, 0, 0.14));
  const fam = [0, 1].map(i => { const p = humanoid({ skin: [0xf0c4a2, 0xe8b894][i], hair: [0x8a4a22, 0x3a2a1a][i], longHair: i === 0, top: [0xc85a4a, 0x4a6a4a][i], bottom: 0x2a3448, smile: true, seed: 6110 + i }); ddr.add(p); return p; });
  const guard = humanoid({ skin: 0xe8b894, hair: 0x2a1a14, top: 0x5a6a52, bottom: 0x4a5a42, belt: 0x2a2a2a, hat: 'helmet', angry: true, seed: 6120 }); guard.userData.hatExtra = 0.15;
  const youth = humanoid({ skin: 0xf0c4a2, hair: 0xb8925a, hairVol: true, top: 0x3a6a9a, bottom: 0x2a3448, sad: true, seed: 6121 });
  ddr.add(worker, stasi, guard, youth);
  ddr.userData = { sun, worker, stasi, fam, guard, youth };
}

// Laden (innen)
const shop = new THREE.Scene(); shop.background = new THREE.Color(0x0e0c0a);
{
  room3(shop, 9, 7, 3.2, M(T.shopWall), M(T.lino));
  const shelfM = C(0x8a7a5a);
  for (const x of [-3, 0, 3]) { const g = new THREE.Group(); g.position.set(x, 0, -3.1); shop.add(g); g.add(box(2.6, 2.6, 0.12, shelfM, 0, 1.3, -0.2)); for (const y of [0.3, 0.9, 1.5, 2.1]) g.add(box(2.6, 0.06, 0.55, shelfM, 0, y, 0.05)); }
  for (const [x, y] of [[-3.8, 0.42], [0.6, 1.02], [2.4, 0.42]]) shop.add(box(0.2, 0.24, 0.2, C(0xc8a040), x, y, -3.0));
  shop.add(box(3.4, 1.0, 0.8, C(0x6a5a3a), 1.6, 0.5, -1.0)); shop.add(box(0.5, 0.4, 0.4, C(0x3a3a3a), 2.6, 1.2, -1.0));
  shop.add(box(1.2, 0.5, 0.06, C(0xf0f0f0), -0.4, 2.7, -3.25, { cast: false }));
  const lamp = new THREE.PointLight(0xe8f0ff, 7, 9, 1.2); lamp.position.set(0, 3.0, 0); shop.add(lamp); shop.add(box(2.4, 0.08, 0.3, glowM(0xe8f4ff, 2), 0, 3.15, 0, { cast: false }));
  sunLight(shop, 0xf0f0ff, 1.2, V(4, 7, 9), V(0, 0, -1), 7, 1024); shop.add(new THREE.HemisphereLight(0xe8eef8, 0x5a5048, 1.2));
  const clerk = humanoid({ skin: 0xf0c4a2, hair: 0x6a3a1a, longHair: true, hairVol: true, top: 0x5a7aa8, bottom: 0x3a4a6a, skirt: true, seed: 6201 });
  const queue = people(shop, 4, 6210, { tops: [0x6a5a4a, 0x4a5a6a, 0x8a4a3a, 0x5a6a4a], women: true, bottom: 0x2a3448 }); queue.forEach(p => p.userData.setFace({ sad: true }));
  const bag = new THREE.Group(); bag.add(box(0.3, 0.3, 0.12, C(0xd8c890), 0, -0.1, 0.12)); inHand(queue[0], bag);
  shop.add(clerk); shop.userData = { clerk, queue };
}

// =====================================================================
// SET 7: Die Mauer – Nacht
// =====================================================================
const wall = new THREE.Scene();
{
  skyDome(wall, 0x05081a, 0x0e1838, 0x1e2c50); wall.fog = new THREE.Fog(0x101a34, 30, 160);
  wall.add(box(600, 1, 600, M(T.concrete), 0, -0.5, 0, { cast: false, uvScale: 0.6 })); wall.add(box(200, 0.06, 10, M(T.sand), 0, 0.03, -6, { cast: false }));
  const segs = []; const wm = M(T.concrete);
  for (let i = -24; i <= 24; i++) { const g = new THREE.Group(); g.position.set(i * 1.25, 0, 0); wall.add(g); g.add(box(1.22, 3.6, 0.4, wm, 0, 1.8, 0)); g.add(box(1.25, 0.45, 0.6, C(0xc8c4ba), 0, 3.82, 0)); segs.push(g); }
  const bits = []; for (let i = 0; i < 12; i++) { const b = box(0.4, 0.4, 0.4, wm, 0, 0, 0); b.visible = false; wall.add(b); bits.push(b); }
  // Wachturm
  const tw = new THREE.Group(); tw.position.set(12, 0, -12); wall.add(tw); tw.add(box(2.4, 9, 2.4, wm, 0, 4.5, 0)); tw.add(box(3.6, 1.6, 3.6, new THREE.MeshStandardMaterial({ color: 0x8aa0b0, roughness: 0.2, metalness: 0.4 }), 0, 9.8, 0)); tw.add(box(3.8, 0.3, 3.8, wm, 0, 10.75, 0));
  const spot = new THREE.SpotLight(0xe8f0ff, 120, 60, 0.22, 0.5, 1.2); spot.position.set(12, 10.4, -10.4); spot.castShadow = false; wall.add(spot); wall.add(spot.target);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 2.2, 22, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xdde8ff, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide })); wall.add(beam);
  for (const x of [-20, -8, 4, 20]) { wall.add(box(0.14, 6, 0.14, C(0x3a3a3a), x, 3, 3)); wall.add(box(0.5, 0.3, 0.5, glowM(0xffc070, 2.2), x, 6, 3, { cast: false })); const pl = new THREE.PointLight(0xffb060, 10, 14, 1.4); pl.position.set(x, 5.6, 3.6); wall.add(pl); }
  sunLight(wall, 0x6a80c0, 0.8, V(-20, 30, 30), V(0, 0, 0), 30, 1024); wall.add(new THREE.HemisphereLight(0x3a4a80, 0x1a1a2a, 0.9));
  const guard = humanoid({ skin: 0xe8b894, hair: 0x2a1a14, top: 0x5a6a52, bottom: 0x4a5a42, belt: 0x2a2a2a, hat: 'helmet', angry: true, seed: 6120 }); guard.userData.hatExtra = 0.15;
  const demo = people(wall, 12, 7100, { tops: [0x6a5a4a, 0x3a4a6a, 0x8a4a3a, 0x5a6a4a, 0x4a4a4a], women: true, bottom: 0x2a2a34 });
  const candles = demo.map((p, i) => { const c = inHand(p, candleMesh()); return c; });
  const banners = [0, 1].map(i => { const g = new THREE.Group(); g.add(box(0.06, 2.2, 0.06, C(0x6a4a2a), -1.0, 1.1, 0)); g.add(box(0.06, 2.2, 0.06, C(0x6a4a2a), 1.0, 1.1, 0)); g.add(box(2.1, 0.7, 0.04, C(0xf0ece0), 0, 2.0, 0)); g.add(box(1.6, 0.12, 0.05, C(0x2a2a2a), 0, 2.05, 0.01, { cast: false })); wall.add(g); return g; });
  const candleL = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffa040, 6, 6, 1.5); wall.add(l); return l; });
  wall.add(guard);
  wall.userData = { segs, bits, spot, beam, guard, demo, candles, banners, candleL };
}

// Moderne (heute) nutzt die Fabrikhalle

// =====================================================================
// SET 8: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  for (const [x, z, h] of [[18, -70, 20], [26, -74, 26], [34, -69, 18]]) dusk.add(box(2.2, h, 2.2, C(0x4a2e26), x, h / 2, z));
  dusk.add(box(26, 8, 8, C(0x6a3a2a), 26, 4, -64));
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  const r = rng(1901); for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('POPPER, 1945', 72, 150, '#a3241c'); fit('WER DEN HIMMEL AUF ERDEN', 56, 290, '#3a2a1e'); fit('ERZWINGEN WILL, SCHAFFT DIE HÖLLE', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 72.26; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'england'], [8, 'factory'], [19, 'kids'], [30, 'owner'], [35, 'poor'], [39, 'study'], [52, 'idea'], [64, 'share'], [74, 'equal'],
  [84, 'russia'], [86, 'lenin'], [95, 'state'], [102, 'dictator'], [108, 'gulag'], [115, 'hunger'], [121, 'flags'], [131, 'china'], [138, 'ddr'], [145, 'shop'],
  [159, 'stasi'], [166, 'west'], [174, 'wall'], [184, 'demo'], [190, 'fall'], [193, 'ussr'], [200, 'hist'], [209, 'oppress'], [214, 'marx'], [221, 'today'], [229, 'sign'], [238, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.25, 1.22, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.72, 0.2); // leichte Untersicht: Himmel + Schlote im ersten Bild
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-5.2 + drift * 1.2, 8.2 + drift * 0.7, 10.0 + drift * 1.2), t1 = V(0.6 + drift * 0.6, 1.6, -6.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const hideAll = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const ENG_OFF = V(-12, 20, 50);

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = eng, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- England ----------
  if (['hero', 'loop', 'england', 'owner', 'poor', 'idea', 'share', 'equal'].includes(sh.id)) {
    scene = eng; const E = eng.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    E.smokes.forEach(s => s.userData.update(ta)); E.rflag.userData.update(ta);
    hideAll([E.worker, E.owner, E.foreman, E.sick, E.wife, E.kid, ...E.crowd, ...E.equal]); E.ownerGold.visible = true;
    sunAt(E.sun, V(0, 0, -6), ENG_OFF);
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'england') {
      put(E.worker, HX, 0, HZ, 0.45); put(E.owner, HX2, 0, HZ, -0.45); pose3(E.worker, 'idle', ta, 0); pose3(E.owner, 'idle', ta, 1);
      E.worker.userData.armR.rotation.x = -0.35; E.worker.userData.head.rotation.y = 0.25; E.owner.userData.armR.rotation.x = -1.0; E.owner.userData.armR.rotation.z = 0.15; E.owner.userData.head.rotation.y = -0.2; E.owner.userData.head.rotation.x = -0.08;
      E.crowd.slice(0, 4).forEach((p, i) => { const x = -3 + i * 1.6 + ((ta * 0.9 + i * 2) % 8) - 4; put(p, -6.5 + i * 0.3, 0, -9 + ((ta * 1.1 + i * 3.7) % 14), 0); pose3(p, 'walk', ta, i); });
      if (sh.id !== 'england') { heroCam(ta); tag(E.worker, 'Arbeiter', HERO); tag(E.owner, 'Fabrikbesitzer', BAD); }
      else { mv(u, V(-26, 24, 32), V(-24, 23, 29.5), V(2, 7, -26), V(2, 7, -27), 46); info(wt(4), 'England, um 1848'); }
    }
    if (sh.id === 'owner') { sunAt(E.sun, V(50, 0, -6), ENG_OFF); put(E.owner, 51.0, 0, -3.0, -0.35); pose(E.owner, 'count', t); E.ownerGold.visible = false;
      const n = Math.round(lerp(18, 40, smoother(u * 1.3))); E.pile.children.forEach(b => b.visible = b.userData.k < n);
      mv(u, V(52.4, 2.0, 2.6), V(52.1, 1.9, 1.9), V(50.4, 1.1, -3.4), V(50.4, 1.1, -3.4), 46); tag(E.owner, 'Fabrikbesitzer', BAD); }
    if (sh.id === 'poor') { sunAt(E.sun, V(-46, 0, -6), ENG_OFF); put(E.worker, -47.6, 0, -4.6, 0.25); put(E.wife, -46.3, 0, -4.4, -0.25); put(E.kid, -46.95, 0, -3.8, 0.05);
      [E.worker, E.wife, E.kid].forEach((p, i) => { pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      mv(u, V(-46.5, 1.75, 0.8), V(-46.6, 1.7, 0.1), V(-47, 1.15, -4.4), V(-47, 1.15, -4.4), 46); tag(E.worker, 'Arbeiter', HERO); chat(wt(36), gray('Lohn reicht kaum zum Leben')); }
    if (sh.id === 'idea') { put(E.worker, 1.0, 0, -16.6, 0.05); put(E.owner, 7.0, 0, -17.6, -0.6); pose3(E.owner, 'cross', t); E.owner.userData.setFace({ angry: true }); E.ownerGold.visible = false;
      const cheer = t >= wt(62);
      E.crowd.forEach((p, i) => { put(p, -3.2 + (i % 4) * 1.6 + (i > 3 ? 0.8 : 0), 0, i > 3 ? -18.8 : -17.6, 0.05 * (i % 3 - 1)); pose3(p, cheer ? 'clap' : 'idle', t, i); if (cheer) p.userData.setFace({ smile: true }); });
      pose(E.worker, cheer ? 'cheer' : 'fist', t); 
      mv(u, V(2.6, 2.3, -8.6), V(2.5, 2.25, -9.8), V(2.4, 1.7, -18), V(2.4, 1.7, -18), 52); tag(E.worker, 'Arbeiter', HERO); tag(E.owner, 'Fabrikbesitzer', BAD); }
    if (sh.id === 'share') { sunAt(E.sun, V(0, 0, 66), ENG_OFF);
      const ppl = [E.worker, E.wife, ...E.crowd.slice(0, 4)];
      ppl.forEach((p, i) => { put(p, -2.6 + i * 1.05, 0, 67.1, 0); pose3(p, i === 0 ? 'give' : (t >= wt(69) && i % 2 ? 'give' : 'idle'), t, i); p.userData.setFace({ smile: true }); });
      E.loaves.forEach((l, i) => l.visible = t < wt(69) ? i < 4 + Math.min(5, Math.floor((t - wt(64)) * 4)) : i >= Math.min(9, Math.floor((t - wt(69)) * 5)));
      mv(u, V(0.8, 2.3, 73.8), V(0.6, 2.2, 72.8), V(-0.2, 1.1, 67.6), V(-0.2, 1.1, 67.6), 46); tag(E.worker, 'Arbeiter', HERO); }
    if (sh.id === 'equal') { sunAt(E.sun, V(0, 0, 58), ENG_OFF); E.equal.forEach((p, i) => { put(p, -4.5 + i * 1.5, 0, 58, 0); pose3(p, 'idle', t, i); });
      mv(u, V(0.4, 2.0, 66.5), V(0.2, 1.95, 64.8), V(0, 1.5, 57), V(0, 1.5, 57), 46);
      tip(wt(80), 'flag', 'Kommunismus', '#ffff55', [gray('lat. communis = gemeinsam'), gray('Alles gehört allen')]); }
  }
  // ---------- Fabrikhalle ----------
  if (['factory', 'kids', 'today'].includes(sh.id)) {
    scene = fac; exp = 1.3; const F = fac.userData; hideAll([...F.ws, F.kid, F.kid2, F.foreman, F.sick, ...F.modern, F.boss]); F.golds.forEach(g => g.visible = false); F.conv.visible = sh.id === 'today';
    F.looms.forEach((l, i) => l.position.x = Math.sin(t * 7 + i) * 0.9);
    if (sh.id === 'factory' || sh.id === 'kids') {
      F.ws.forEach((p, i) => { const lx = -8 + (i % 4) * 5, lz = (i < 4 ? -5 : -0.5); put(p, lx - 0.4, 0, lz - 1.05, 0); pose(p, 'work', t, i); p.userData.setFace({ sad: true }); });
      put(F.kid, -3.0, 0, 5.15, 0.1); pose3(F.kid, 'sadidle', t, 1); F.kid.userData.armL.rotation.x = F.kid.userData.armR.rotation.x = -1.3 + Math.sin(t * 8) * 0.15; put(F.kid2, 2.2, 0, 5.15, -0.1); pose(F.kid2, 'work', t, 2);
    }
    if (sh.id === 'factory') { mv(u, V(7.5, 4.2, 13.5), V(6.5, 3.9, 12.0), V(-1, 1.0, -1.5), V(-1, 1.0, -1.5), 50); eff(wt(15), 'Arbeitszeit', '16 Std.', BAD); }
    if (sh.id === 'kids') { put(F.foreman, -1.7, 0, 1.6, -0.3); pose3(F.foreman, t >= wt(26) ? 'point' : 'cross', t); F.foreman.rotation.y = t >= wt(26) ? 0.55 : -0.3;
      const go = smoother((t - wt(28)) / 0.8); put(F.sick, lerp(-0.6, 2.4, go), 0, 1.9, go > 0.02 ? Math.PI / 2 - 0.4 : -0.5); pose3(F.sick, go > 0.02 && go < 1 ? 'walk' : 'sadidle', t); F.sick.userData.setFace({ sad: true });
      mv(u, V(-2.8, 1.3, 8.2), V(-2.9, 1.26, 7.5), V(-2.3, 1.05, 3.4), V(-2.3, 1.05, 3.4), 54); tag(F.kid, 'Kind', WHITE); tag(F.foreman, 'Aufseher', BAD); tag(F.sick, 'Arbeiter (krank)', GREY);
      chat(wt(28), red('Arbeiter wurde entlassen')); }
    if (sh.id === 'today') { F.modern.forEach((p, i) => { put(p, -5 + i * 3.2, 0, 5.3, 0); pose(p, 'work', t, i); p.userData.setFace({}); });
      put(F.boss, 9.2, 0, 7.6, -0.9); pose3(F.boss, 'cross', t); F.boss.userData.setFace({ smile: true });
      F.golds.forEach((g, i) => { const x = -8 + ((t * 2.2 + i * 2) % 18); g.visible = x < 8.2; g.position.set(x, 1.11, 6.5); });
      mv(u, V(-2.4, 2.4, 13.0), V(-1.8, 2.3, 11.8), V(1.5, 1.2, 6.2), V(1.5, 1.2, 6.2), 46); info(wt(221), 'Heute'); tag(F.modern[1], 'Arbeiterin', HERO); tag(F.boss, 'Eigentümer', BAD); }
  }
  // ---------- Arbeitszimmer ----------
  if (['study', 'hist', 'marx'].includes(sh.id)) {
    scene = study; exp = 1.45; const S = study.userData; hideAll([S.marx, S.engels, S.hist]);
    if (sh.id === 'study' || sh.id === 'marx') { put(S.marx, -0.2, 0, -1.75, 0); pose(S.marx, sh.id === 'study' ? 'write' : 'idle', t); sitPose(S.marx, 0.54); if (sh.id === 'marx') { S.marx.userData.armR.rotation.x = S.marx.userData.armL.rotation.x = -1.2; S.marx.userData.head.rotation.x = -0.05; } }
    if (sh.id === 'study') { put(S.engels, 1.45, 0, -1.65, -0.35); pose3(S.engels, 'idle', t, 1); S.engels.userData.head.rotation.x = 0.2;
      const k = smoother(u); cam(V(lerp(0.9, 0.7, k), lerp(1.8, 1.65, k), lerp(4.4, 3.4, k)), V(0.55, lerp(1.25, 1.1, k), -1.3), 50);
      tag(S.marx, 'Karl Marx', HERO); tag(S.engels, 'Friedrich Engels', ALLY); tip(wt(49), 'book', 'Das Kommunistische Manifest', '#ffaa00', [gray('London, 1848'), gray('nur rund 23 Seiten')]); }
    if (sh.id === 'marx') { mv(u, V(0.3, 1.62, 2.4), V(0.2, 1.6, 1.8), V(-0.2, 1.3, -1.75), V(-0.2, 1.3, -1.75), 46); tag(S.marx, 'Karl Marx', HERO); }
    if (sh.id === 'hist') { put(S.hist, -1.6, 0, -2.2, 0.25); pose3(S.hist, 'idle', t); S.hist.userData.armR.rotation.x = -1.0;
      mv(u, V(-0.9, 1.7, 1.4), V(-1.0, 1.66, 0.7), V(-1.6, 1.4, -2.2), V(-1.6, 1.4, -2.2), 46); tag(S.hist, 'Historiker', WHITE);
      tip(wt(204), 'heart', 'Die Idee', '#55ff55', [gray('Gleichheit für alle')]); }
  }
  // ---------- Russland ----------
  if (['russia', 'lenin', 'state', 'dictator', 'gulag', 'hunger', 'ussr', 'oppress'].includes(sh.id)) {
    scene = rus; exp = 1.05; const R = rus.userData; hideAll([R.lenin, R.stalin, R.farmer, ...R.crowd, ...R.soldiers, ...R.prisoners, ...R.famine]);
    R.flags.forEach(f => f.userData.update(t)); R.sflag.userData.update(t); R.stateFlag.userData.update(t);
    R.sflag.userData.holder.position.y = sh.id === 'ussr' ? lerp(3.6, 0.9, smoother((t - wt(196)) / 2.2)) : 3.6;
    R.stateFlag.userData.holder.position.y = sh.id === 'state' ? lerp(0.8, 3.0, smoother((t - wt(95)) / 1.4)) : 3.0;
    sunAt(R.sun, V(0, 0, -8), V(-30, 40, 40));
    if (sh.id === 'russia' || sh.id === 'lenin') { R.crowd.forEach((p, i) => { put(p, -6 + (i % 7) * 2 + (i > 6 ? 1 : 0), 0, i > 6 ? 0.8 : -2.4, Math.PI + (i % 3 - 1) * 0.2); pose(p, i % 3 === 0 ? 'fist' : 'idle', t, i); }); put(R.lenin, 0, 1.72, -8.2, 0); pose(R.lenin, 'fist', t); }
    if (sh.id === 'russia') { mv(u, V(-30, 18, 26), V(-27, 17, 23.5), V(0, 6, -20), V(0, 6, -21), 46); info(wt(84), 'Russland, 1917'); }
    if (sh.id === 'lenin') { [0, 1].forEach(i => { put(R.soldiers[i], i ? 2.6 : -2.6, 0, -7.6, i ? -0.3 : 0.3); pose3(R.soldiers[i], 'cross', t, i); });
      mv(u, V(3.0, 2.3, -2.6), V(2.7, 2.35, -3.2), V(0, 2.7, -8.2), V(0, 2.75, -8.2), 46); tag(R.lenin, 'Lenin', BAD);
      tip(wt(90), 'flag', 'Oktoberrevolution', '#ff5555', [gray('Lenins Partei, die Bolschewiki,'), gray('übernimmt mit Gewalt die Macht')]); }
    if (sh.id === 'state') { sunAt(R.sun, V(48, 0, -6), V(-30, 40, 40)); put(R.farmer, 45.2, 0, -2.6, 0.35); pose3(R.farmer, 'sadidle', t); R.farmer.userData.setFace({ sad: true });
      put(R.soldiers[0], 47.6, 0, -2.3, -0.2); put(R.soldiers[1], 51.0, 0, -2.6, -0.4); pose3(R.soldiers[0], 'point', t); pose3(R.soldiers[1], 'cross', t, 1);
      mv(u, V(48.6, 2.2, 6.4), V(48.4, 2.1, 5.4), V(48.4, 1.7, -4), V(48.4, 1.7, -4), 46); tag(R.farmer, 'Bauer', HERO); tag(R.soldiers[0], 'Partei', BAD); info(wt(97), 'Alles gehört jetzt dem Staat'); }
    if (sh.id === 'dictator') { put(R.stalin, 0, 1.72, -8.2, 0); pose3(R.stalin, 'cross', t); R.stalin.userData.setFace({ angry: true });
      R.soldiers.forEach((p, i) => { put(p, -3 + (i % 3) * 3 + (i > 2 ? 1.5 : 0), 0, i > 2 ? -2.8 : -4.6, Math.PI); pose3(p, 'idle', t, i); });
      mv(u, V(-3.0, 1.3, -2.8), V(-2.7, 1.25, -3.4), V(0, 2.9, -8.2), V(0, 2.95, -8.2), 46); tag(R.stalin, 'Stalin', BAD); eff(wt(104), 'Freiheit', '0', BAD); }
    if (sh.id === 'gulag') { sunAt(R.sun, V(-56, 0, -4), V(-30, 40, 40)); R.prisoners.forEach((p, i) => { put(p, -60 + i * 1.6, 0, -1.2 + (i % 2) * 0.6, (i - 1.5) * 0.15); pose(p, 'hammer', t, i * 1.3); p.userData.setFace({ sad: true }); });
      put(R.soldiers[2], -52.8, 0, 0.6, -0.9); pose3(R.soldiers[2], 'cross', t); R.soldiers[2].userData.setFace({ angry: true });
      mv(u, V(-56.2, 2.1, 6.4), V(-56.4, 2.0, 5.6), V(-57.2, 1.2, -1), V(-57.2, 1.2, -1), 46); tag(R.prisoners[1], 'Häftling', GREY); tag(R.soldiers[2], 'Wache', BAD); info(wt(110), 'Gulag: Millionen Häftlinge'); }
    if (sh.id === 'hunger') { sunAt(R.sun, V(25, 0, 34), V(-30, 40, 40)); R.famine.forEach((p, i) => { put(p, [24.3, 25.6, 24.95][i], 0, [35.3, 35.4, 36.1][i], [0.2, -0.2, 0][i]); pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      mv(u, V(25.6, 1.8, 40.6), V(25.5, 1.75, 39.8), V(25, 1.05, 35.4), V(25, 1.05, 35.4), 46); info(wt(115), 'Hungersnot 1932/33'); chat(wt(117), red('Millionen Menschen sterben')); }
    if (sh.id === 'ussr') { mv(u, V(-7, 7, -2), V(-6.4, 7.6, -3.6), V(0, 19, -32), V(0, 19.5, -32), 46); info(wt(194), 'Dezember 1991'); exp = 1.15; }
    if (sh.id === 'oppress') { sunAt(R.sun, V(-48, 0, -4), V(-30, 40, 40)); R.prisoners.forEach((p, i) => { put(p, -47.6, 0, -6.2 + i * 1.3, Math.PI / 2 + (i - 1.5) * 0.12); pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      mv(u, V(-42.4, 1.8, -3.4), V(-43.1, 1.76, -3.6), V(-47.6, 1.3, -4.3), V(-47.6, 1.3, -4.3), 46); tip(wt(213), 'x', 'Das Ergebnis', '#ff5555', [gray('oft Diktatur und Unterdrückung')]); }
  }
  // ---------- Flaggen / China ----------
  if (sh.id === 'flags' || sh.id === 'china') {
    scene = asia; const A = asia.userData; A.fl.forEach(f => f.userData.update(t)); A.farmers.forEach(p => p.visible = false);
    if (sh.id === 'flags') { const T0 = [wt(124), wt(125), wt(128)]; A.fl.forEach((f, i) => { const k = smoother((t - T0[i]) / 0.35); f.visible = t >= T0[i]; f.scale.setScalar(Math.max(0.01, k)); if (f.visible) ui.tags.push([V(-4.5 + i * 4.5 + 1.6, 4 + 6.5 * k + 0.5, -6), ['China', 'Kuba', 'DDR'][i], WHITE]); });
      mv(u, V(0.4, 7.0, 15.5), V(0.3, 6.8, 13.5), V(0.4, 7.0, -6), V(0.4, 7.0, -6), 46); }
    else { A.fl.forEach(f => f.visible = true); A.farmers.forEach((p, i) => { put(p, [59.4, 60.7, 60.05][i], 0, [-4.6, -4.5, -3.8][i], [0.25, -0.25, 0][i]); pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      A.farmers[0].userData.armR.rotation.x = -0.9;
      mv(u, V(60.6, 1.8, 1.0), V(60.5, 1.75, 0.3), V(60.1, 1.05, -4.4), V(60.1, 1.05, -4.4), 46); info(wt(131), 'China, 1959–1961'); chat(wt(133), red('Große Hungersnot')); }
  }
  // ---------- DDR ----------
  if (['ddr', 'stasi', 'west'].includes(sh.id)) {
    scene = ddr; exp = 1.25; const D = ddr.userData; hideAll([D.worker, D.stasi, D.guard, D.youth, ...D.fam]);
    if (sh.id === 'ddr') { put(D.worker, lerp(-9.5, -6.8, u), 0, 0.6, Math.PI / 2 - 0.5); pose(D.worker, 'walk', t); D.worker.userData.armL.rotation.x = 0;
      mv(u, V(-3.2, 2.0, 8.4), V(-3.6, 1.95, 7.6), V(-7.5, 2.4, -2), V(-7.5, 2.4, -2), 50); info(wt(138), 'DDR, 1949–1990'); tag(D.worker, 'Arbeiter', HERO); eff(wt(141), 'Arbeitsplatz', 'sicher', '#55ff55'); }
    if (sh.id === 'stasi') { sunAt(D.sun, V(30, 0, 0), V(-35, 45, 40)); D.fam.forEach((p, i) => { put(p, 29.4 + i * 1.1, 0, 0.05, 0.15 - i * 0.3); pose3(p, 'laugh', t, i); sitPose(p, 0.55); });
      put(D.stasi, 32.2, 0, -2.2, -0.45); pose(D.stasi, 'write', t); D.stasi.userData.head.rotation.x = -0.05; D.stasi.userData.head.rotation.y = -0.25;
      mv(u, V(30.7, 1.8, 6.0), V(30.8, 1.76, 5.2), V(31.0, 1.3, -1.0), V(31.0, 1.3, -1.0), 54); tag(D.stasi, 'Stasi', BAD); tag(D.fam[0], 'Familie', HERO);
      tip(wt(160), 'eye', 'Stasi', '#ff5555', [gray('Geheimpolizei der DDR'), gray('Spitzel überall')]); }
    if (sh.id === 'west') { sunAt(D.sun, V(53, 0, 2), V(-35, 45, 40)); put(D.youth, 51.6, 0, 4.4, 0.75); pose3(D.youth, 'sadidle', t); D.youth.userData.setFace({ sad: true });
      put(D.guard, 54.4, 0, 3.6, -0.6); pose3(D.guard, 'cross', t); D.guard.userData.setFace({ angry: true });
      mv(u, V(52.8, 1.85, 10.4), V(52.9, 1.8, 9.5), V(52.9, 1.35, 3.6), V(52.9, 1.35, 3.6), 50); tag(D.youth, 'Bürger', HERO); tag(D.guard, 'Grenzsoldat', BAD); chat(wt(171), red('Ausreise in den Westen: verboten')); }
  }
  if (sh.id === 'shop') { scene = shop; exp = 1.3; const P = shop.userData;
    put(P.clerk, 1.6, 0, -1.9, 0); pose3(P.clerk, 'cross', t);
    P.queue.forEach((p, i) => { put(p, -0.4 - i * 1.0, 0, -0.4 + i * 0.75, 0.65); pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
    mv(u, V(0.2, 1.9, 4.6), V(0.0, 1.85, 3.9), V(-0.6, 1.3, -1.6), V(-0.6, 1.3, -1.6), 48); tag(P.queue[0], 'Kundin', HERO); tag(P.clerk, 'Verkäuferin', WHITE);
    eff(wt(151), 'Wartezeit Auto', 'über 10 Jahre', '#ffaa00'); }
  // ---------- Mauer ----------
  if (['wall', 'demo', 'fall'].includes(sh.id)) {
    scene = wall; exp = 1.5; const Wl = wall.userData; hideAll([Wl.guard, ...Wl.demo]); Wl.candles.forEach(c => c.visible = false); Wl.banners.forEach(b => b.visible = false); Wl.candleL.forEach(l => l.intensity = 0); Wl.bits.forEach(b => b.visible = false);
    const sx = Math.sin(t * 0.7) * 9; Wl.spot.target.position.set(sx, 0, -4); Wl.spot.target.updateMatrixWorld();
    { const a = Wl.spot.position, b = Wl.spot.target.position, mid = a.clone().add(b).multiplyScalar(0.5), d = b.clone().sub(a); Wl.beam.position.copy(mid); Wl.beam.scale.set(1, d.length() / 22, 1); Wl.beam.quaternion.setFromUnitVectors(V(0, -1, 0), d.normalize()); }
    if (sh.id === 'wall') { mv(u, V(-9, 2.6, 12), V(-7.6, 2.8, 10.6), V(1, 2.6, -2), V(1.5, 2.6, -2), 46); info(wt(174), 'Berlin, 1961'); chat(wt(181), gray('Mind. 140 Tote an der Mauer')); }
    if (sh.id === 'demo') { Wl.demo.forEach((p, i) => { const row = Math.floor(i / 4); put(p, -2.6 + (i % 4) * 1.7 + (row % 2) * 0.8, 0, 12 - row * 1.6 + (t - sh.a) * 0.5, Math.PI * 0 + ((i % 4) - 1.5) * 0.08); pose(p, 'walk', t, i); p.userData.armR.rotation.x = -1.2; p.userData.setFace({}); Wl.candles[i].visible = true; });
      Wl.banners.forEach((b, i) => { b.visible = true; b.position.set(i ? 2.4 : -2.0, 0, 9.6 - 1.0 + (t - sh.a) * 0.5); });
      Wl.candleL.forEach((l, i) => { l.intensity = 6 + Math.sin(t * 17 + i) * 0.8; l.position.set(-1.6 + i * 2.6, 1.5, 13 + (t - sh.a) * 0.5); });
      mv(u, V(0.6, 2.0, 21.5), V(0.5, 1.95, 20.4), V(0, 1.7, 12), V(0, 1.7, 12.5), 46); info(wt(184), 'Herbst 1989'); }
    if (sh.id === 'fall') { Wl.demo.slice(0, 6).forEach((p, i) => { put(p, -3.4 + i * 1.3, 4.05, 0.05, (i - 2.5) * -0.08); pose(p, 'cheer', t, i); p.userData.setFace({ smile: true }); });
      Wl.demo.slice(6).forEach((p, i) => { put(p, -3 + i * 1.3, 0, 2.6 + (i % 2) * 0.8, Math.PI - 0.1 + (i % 3) * 0.1); pose(p, 'cheer', t, i + 3); });
      const dt = t - wt(191); Wl.bits.forEach((b, i) => { if (dt < 0) return; b.visible = true; const a = i * 2.4; b.position.set(4.0 + Math.cos(a) * 0.6 + Math.cos(a) * dt * 1.5, 2.2 + (i % 4) * 0.4 + dt * 2.5 - dt * dt * 6, 0.3 + dt * (1.2 + (i % 3) * 0.6)); b.rotation.set(dt * 3 + i, dt * 2, 0); });
      mv(u, V(1.0, 2.6, 9.6), V(0.9, 2.7, 8.8), V(0.4, 3.6, 0), V(0.4, 3.7, 0), 50); toast(wt(191), 'Fortschritt erzielt!', 'Die Mauer ist offen', 'up'); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  book: '<rect x="1" y="1" width="6" height="6" fill="#b82020"/><rect x="2" y="1" width="4" height="5" fill="#e8dcc0"/><rect x="3" y="2" width="2" height="1" fill="#7a5a3a"/><rect x="3" y="4" width="2" height="1" fill="#7a5a3a"/>',
  up: '<rect x="3" y="1" width="2" height="6" fill="#55ff55"/><rect x="2" y="2" width="4" height="1" fill="#55ff55"/><rect x="1" y="3" width="6" height="1" fill="#55ff55"/>',
  heart: '<rect x="1" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="5" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="1" y="3" width="6" height="2" fill="#ff4a6a"/><rect x="2" y="5" width="4" height="1" fill="#ff4a6a"/><rect x="3" y="6" width="2" height="1" fill="#ff4a6a"/>',
  x: '<rect x="1" y="1" width="2" height="2" fill="#ff5555"/><rect x="5" y="1" width="2" height="2" fill="#ff5555"/><rect x="3" y="3" width="2" height="2" fill="#ff5555"/><rect x="1" y="5" width="2" height="2" fill="#ff5555"/><rect x="5" y="5" width="2" height="2" fill="#ff5555"/>',
  flag: '<rect x="1" y="0" width="1" height="8" fill="#8a8a8a"/><rect x="2" y="1" width="5" height="4" fill="#d02020"/><rect x="3" y="2" width="1" height="1" fill="#f2c230"/>',
  eye: '<rect x="1" y="3" width="6" height="2" fill="#e8e8e8"/><rect x="2" y="2" width="4" height="4" fill="#e8e8e8"/><rect x="3" y="3" width="2" height="2" fill="#2a4a8a"/><rect x="0" y="4" width="1" height="1" fill="#e8e8e8"/><rect x="7" y="4" width="1" height="1" fill="#e8e8e8"/>',
};
const NUM = { 'hundertachtzig': '180', 'sechzehn': '16', 'neunzehnhundertsiebzehn.': '1917.', 'Neunzehnhunderteinundsechzig': '1961', 'Neunzehnhundertneunundachtzig': '1989', 'zehn': '10', 'Zwei': '2' };
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = NUM[cur[0]] ?? cur[0];
    let f = clamp01((t - cur[1] + 0.02) / 0.07); if (cur === words[0] && t < 0.1) f = 1; // erster Frame: Titelwort sofort voll sichtbar
    const g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
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
