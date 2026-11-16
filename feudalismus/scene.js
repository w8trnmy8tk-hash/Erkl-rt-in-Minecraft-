// „Feudalismus, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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


// =====================================================================
// Figuren & Requisiten
// =====================================================================
const HANS = { skin: 0xe2ac84, hair: 0x7a4a22, beard: 'short', beardCol: 0x6a3e1c, top: 0x8a6a42, bottom: 0x5a4a32, belt: 0xc8b080, shoe: 0x3a2a1a, eye: '#3a5a2a', seed: 51 };
const KOENIG = { skin: 0xe8b894, hair: 0xd0a060, beard: 'full', beardCol: 0xc08a40, top: 0xa81c1c, bottom: 0x3a1a3a, belt: 0xf0c030, shoe: 0x2a1a14, eye: '#2a4a7a', seed: 52 };
const FUERST = { skin: 0xe0b08a, hair: 0x3a2414, beard: 'goatee', top: 0x34408a, bottom: 0x2a2a3a, belt: 0xc0c0c8, shoe: 0x2a1a14, eye: '#3a2a1a', seed: 53 };
const GRAF = { skin: 0xd8a882, hair: 0x2a1a10, beard: 'mustache', top: 0x2a6a3a, bottom: 0x3a2a1a, belt: 0xc8a030, shoe: 0x2a1a14, eye: '#3a2a1a', seed: 54 };
const RITTER = { skin: 0xe0b08a, hair: 0x5a3a1a, beard: 'short', top: 0x9aa0a8, bottom: 0x80868e, shoe: 0x4a4e54, eye: '#3a4a6a', seed: 55 };
const BISCHOF = { skin: 0xe2b292, hair: 0xe8e8e8, beard: 'full', beardCol: 0xeeeeee, top: 0xf2ede0, bottom: 0xf2ede0, belt: 0xd0a030, shoe: 0x8a6a3a, eye: '#3a3a3a', seed: 56 };
const MOENCH = { skin: 0xd8a880, hair: 0x5a3a1a, bald: true, top: 0x5a4030, bottom: 0x5a4030, belt: 0xc8b080, shoe: 0x3a2a1a, eye: '#3a2a1a', seed: 57 };
const ADEL = { skin: 0xf0d0b4, hair: 0xeeeeee, hairVol: true, top: 0x2a3a8a, bottom: 0xe8e0c8, coat: true, shoe: 0x1a1a1a, eye: '#3a4a6a', seed: 58 };
const ADEL2 = { ...ADEL, top: 0x7a1a3a, seed: 59 };
const MODGRAF = { skin: 0xe8b894, hair: 0x9a9a9a, hairVol: true, top: 0x3a5a3a, bottom: 0x6a6050, shoe: 0x3a2a1a, eye: '#3a5a6a', hat: 'cap', hatCol: 0x4a5a3a, smile: true, seed: 60 };
const peasantTops = [0x7a6a4a, 0x6a5a3a, 0x8a7a5a, 0x5a6a4a, 0x7a5a4a, 0x9a8a6a, 0x6a4a3a];
const peasant = (i) => ({ skin: [0xe2ac84, 0xd8a07a, 0xeab894, 0xc89070][i % 4], hair: [0x5a3a1a, 0x2a1a10, 0x8a5a2a, 0x3a2a1a, 0xb08a4a][i % 5], beard: i % 3 === 0 ? 'short' : undefined, longHair: i % 4 === 1, top: peasantTops[i % 7], bottom: [0x4a3a2a, 0x5a4a3a, 0x3a3a2a][i % 3], belt: 0xa89060, shoe: 0x3a2a1a, seed: 70 + i });

function strawHat(ch) { const g = new THREE.Group(), m = C(0xd8b860); g.add(box(0.74, 0.05, 0.74, m, 0, 0.52, 0)); g.add(box(0.5, 0.16, 0.5, m, 0, 0.6, 0)); g.add(box(0.51, 0.04, 0.51, C(0x8a5a2a), 0, 0.55, 0, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.12; return g; }
function cape(ch, col, trim = 0xf4f0e8) { const b = ch.userData.body; b.add(box(0.6, 1.1, 0.06, C(col), 0, 0.95, -0.17)); b.add(box(0.62, 0.12, 0.34, C(trim), 0, 1.47, 0)); for (const x of [-0.2, 0, 0.2]) b.add(box(0.04, 0.04, 0.01, C(0x1a1a1a), x, 1.47, 0.172, { cast: false })); }
function knightGear(ch, tabard = 0xa81c1c) { const h = ch.userData.head, m = C(0x8a9098, { metal: 0.55, rough: 0.45 });
  h.add(box(0.56, 0.12, 0.56, m, 0, 0.55, 0)); h.add(box(0.06, 0.4, 0.56, m, -0.28, 0.3, 0)); h.add(box(0.06, 0.4, 0.56, m, 0.28, 0.3, 0)); h.add(box(0.56, 0.4, 0.06, m, 0, 0.3, -0.28)); h.add(box(0.08, 0.2, 0.04, m, 0, 0.38, 0.27, { cast: false }));
  const b = ch.userData.body; b.add(box(0.52, 0.66, 0.02, C(tabard), 0, 1.0, 0.14, { cast: false })); b.add(box(0.1, 0.3, 0.01, C(0xf0c030), 0, 1.08, 0.152, { cast: false })); b.add(box(0.26, 0.08, 0.01, C(0xf0c030), 0, 1.14, 0.152, { cast: false }));
  for (const A of [ch.userData.armL, ch.userData.armR]) A.add(box(0.26, 0.16, 0.26, m, 0, -0.02, 0)); ch.userData.hatExtra = 0.1; }
function mitre(ch) { const g = new THREE.Group(), w = C(0xf4f0e4), gd = C(0xe0b030, { metal: 0.4, rough: 0.5 }); g.add(box(0.5, 0.3, 0.5, w, 0, 0.62, 0)); g.add(box(0.4, 0.22, 0.42, w, 0, 0.86, 0)); g.add(box(0.24, 0.14, 0.34, w, 0, 1.03, 0)); g.add(box(0.08, 0.6, 0.02, gd, 0, 0.78, 0.26, { cast: false })); g.add(box(0.52, 0.06, 0.52, gd, 0, 0.5, 0)); ch.userData.head.add(g); ch.userData.hatExtra = 0.55; }
function phrygian(ch) { const m = C(0xc8201a); ch.userData.head.add(box(0.54, 0.16, 0.54, m, 0, 0.56, 0)); ch.userData.head.add(box(0.36, 0.2, 0.4, m, 0, 0.7, -0.04)); ch.userData.head.add(box(0.2, 0.14, 0.24, m, 0, 0.78, 0.16)); ch.userData.hatExtra = 0.25; }
function cockade(ch) { ch.userData.body.add(box(0.12, 0.12, 0.02, C(0x2a3aa0), -0.12, 1.3, 0.14, { cast: false })); ch.userData.body.add(box(0.06, 0.06, 0.03, C(0xf4f4f4), -0.12, 1.3, 0.15, { cast: false })); }
const toolY = (parts) => { const g = new THREE.Group(); g.position.set(0, -0.68, 0.02); parts.forEach(p => g.add(p)); return g; };
const hoeMesh = () => toolY([box(0.06, 1.5, 0.06, C(0x7a5a3a), 0, -0.25, 0), box(0.07, 0.07, 0.34, C(0x6a6e74, { metal: 0.5, rough: 0.5 }), 0, -0.98, 0.14)]);
const forkMesh = () => toolY([box(0.06, 1.7, 0.06, C(0x7a5a3a), 0, -0.4, 0), box(0.34, 0.05, 0.05, C(0x5a5e64), 0, -1.22, 0), ...[-0.14, 0, 0.14].map(x => box(0.04, 0.3, 0.04, C(0x6a6e74, { metal: 0.5 }), x, -1.4, 0))]);
const swordMesh = () => toolY([box(0.07, 0.2, 0.07, C(0x4a2a1a), 0, 0.02, 0), box(0.3, 0.05, 0.08, C(0xc0a040, { metal: 0.6, rough: 0.4 }), 0, -0.1, 0), box(0.09, 0.78, 0.03, C(0xd8dce4, { metal: 0.8, rough: 0.25 }), 0, -0.52, 0)]);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb040 }), flameMat2 = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
const torchMesh = () => toolY([box(0.07, 0.8, 0.07, C(0x5a3a1a), 0, -0.2, 0), box(0.15, 0.18, 0.15, flameMat, 0, -0.68, 0, { cast: false }), box(0.08, 0.12, 0.08, flameMat2, 0, -0.8, 0, { cast: false })]);
const scrollMesh = () => { const g = new THREE.Group(); g.add(box(0.06, 0.06, 0.5, C(0xe8dcb8), 0, 0, 0.12)); g.add(box(0.03, 0.26, 0.42, C(0xf2e8cc), 0, -0.14, 0.12)); g.add(box(0.05, 0.05, 0.05, C(0xb01818), 0.03, -0.18, 0.12, { cast: false })); return g; };
const sackMesh = () => { const g = new THREE.Group(); g.add(box(0.42, 0.46, 0.34, C(0xc8b080), 0, -0.05, 0.28)); g.add(box(0.16, 0.1, 0.16, C(0xa89060), 0, 0.22, 0.28)); return g; };
const chickenMesh = () => { const g = new THREE.Group(); g.add(box(0.26, 0.24, 0.34, C(0xf4f4f0), 0, 0, 0.2)); g.add(box(0.16, 0.2, 0.14, C(0xf4f4f0), 0, 0.16, 0.38)); g.add(box(0.06, 0.06, 0.08, C(0xe0a020), 0, 0.15, 0.48, { cast: false })); g.add(box(0.06, 0.08, 0.06, C(0xd02020), 0, 0.3, 0.38, { cast: false })); return g; };
const heldBy = (ch, mesh, arm = 'armR') => { ch.userData[arm].add(mesh); return mesh; };

// ---------- Bau-Helfer ----------
function oak(sc, x, z, h = 4, seed = 1, y0 = 0) { const r = rng(seed), tr = M(T.darkwood), lf = C([0x3f7a2c, 0x4a8a34, 0x356a26][seed % 3]);
  for (let i = 0; i < h; i++) sc.add(box(0.7, 1, 0.7, tr, x, y0 + i + 0.5, z));
  sc.add(box(4.2, 2, 4.2, lf, x, y0 + h + 0.4, z)); sc.add(box(2.8, 1.4, 2.8, lf, x + (r() - 0.5) * 0.6, y0 + h + 2.0, z + (r() - 0.5) * 0.6)); }
function spruce(sc, x, z, h = 7, y0 = 0) { const tr = M(T.darkwood), lf = C(0x2a5a32); for (let i = 0; i < h; i++) sc.add(box(0.6, 1, 0.6, tr, x, y0 + i + 0.5, z));
  [3.6, 3.0, 2.2, 1.4, 0.7].forEach((w, k) => sc.add(box(w, 1.2, w, lf, x, y0 + 2.4 + k * 1.2, z))); }
const plasterM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xe2d6bc, 0.05); }, 3001)), beamM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x4a3220, 0.12), 3002));
function medHouse(sc, x, z, w = 5, d = 4.4, h = 3.2, rot = 0, roofM = M(T.roofRed), lit = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; sc.add(g);
  g.add(box(w + 0.2, 0.6, d + 0.2, M(T.cobble), 0, 0.3, 0)); g.add(box(w, h, d, plasterM, 0, 0.6 + h / 2, 0));
  for (const xx of [-w / 2, 0, w / 2]) g.add(box(0.24, h, 0.24, beamM, xx, 0.6 + h / 2, d / 2 + 0.02)); g.add(box(w + 0.1, 0.24, 0.24, beamM, 0, 0.6 + h, d / 2 + 0.02)); g.add(box(w + 0.1, 0.24, 0.24, beamM, 0, 0.6 + h / 2, d / 2 + 0.03));
  for (let k = 0; k < 4; k++) g.add(box(w + 0.6 - k * (w / 4), 0.6, d + 0.6, roofM, 0, 0.6 + h + 0.3 + k * 0.6, 0));
  g.add(box(0.9, 1.8, 0.1, C(0x4a2e1a), -w / 4, 1.5, d / 2 + 0.06, { cast: false }));
  g.add(box(0.8, 0.7, 0.1, lit ? M(T.window, { emissive: 0xffffff, ei: 0.9 }) : M(T.windowDark), w / 4, 2.4, d / 2 + 0.06, { cast: false }));
  return g; }
function makeClouds(sc, seed, y, n, spread) { const r = rng(seed), m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  for (let i = 0; i < n; i++) sc.add(box(8 + r() * 18, 1.5, 5 + r() * 10, m, -spread + r() * spread * 2, y + r() * 8, -spread + r() * spread * 1.6, { cast: false })); return m; }
const FLAG = {
  royal: tex(24, 16, (c) => { c.fillStyle = '#b01c1c'; c.fillRect(0, 0, 24, 16); c.fillStyle = '#f0c030'; c.fillRect(10, 3, 4, 10); c.fillRect(7, 6, 10, 3); c.fillRect(0, 0, 24, 1); c.fillRect(0, 15, 24, 1); }, 61),
  blue: tex(24, 16, (c) => { c.fillStyle = '#2a3a8a'; c.fillRect(0, 0, 24, 16); c.fillStyle = '#e8e8e8'; c.fillRect(9, 4, 6, 8); }, 62),
  france: tex(24, 16, (c) => { c.fillStyle = '#1f3d99'; c.fillRect(0, 0, 8, 16); c.fillStyle = '#f4f4f4'; c.fillRect(8, 0, 8, 16); c.fillStyle = '#d0201a'; c.fillRect(16, 0, 8, 16); }, 63),
  peasant: tex(24, 16, (c) => { c.fillStyle = '#e8e2d0'; c.fillRect(0, 0, 24, 16); c.fillStyle = '#5a3a1a'; c.fillRect(6, 9, 12, 3); c.fillRect(12, 5, 4, 5); c.fillStyle = '#2a6a3a'; c.fillRect(0, 0, 24, 2); c.fillRect(0, 14, 24, 2); }, 64),
};

// =====================================================================
// SET 1: Die Welt (Burg, Felder, Dorf, Kirche, Pyramide, Privatwald)
// =====================================================================
const world = new THREE.Scene();
const WD = {};
{
  WD.sky = skyDome(world, 0x3a80d0, 0x9ac4e8, 0xf0dcb8); world.fog = new THREE.Fog(0xf0dcb8, 90, 400); WD.cloudM = makeClouds(world, 9, 70, 26, 280);
  const grassM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x6a8f3e, 0.12); for (let i = 0; i < 14; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x5a7a32); }, 3010));
  world.add(box(800, 1, 800, grassM, 0, -0.5, 0, { cast: false }));
  const pathM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x9a7a52, 0.14), 3011));
  world.add(box(4.4, 0.06, 32, pathM, 0, 0.03, -8, { cast: false })); world.add(box(40, 0.06, 3.6, pathM, 20, 0.031, 6, { cast: false }));
  // Weizenfelder
  const wheatM = M(T.wheat), wheatM2 = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xd8b85a, 0.12); for (let x = 0; x < 16; x += 3) for (let y = 0; y < 16; y++) if (r() < 0.5) px(c, x, y, 0x9a7a32); }, 3012)), farm = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x5a3e26, 0.1); for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) px(c, x, y, 0x3e2a18); }, 3013));
  const field = (x0, x1, z0, z1, seed, empty = false) => { const r = rng(seed); world.add(box(x1 - x0, 0.08, z1 - z0, farm, (x0 + x1) / 2, 0.04, (z0 + z1) / 2, { cast: false }));
    if (!empty) for (let x = x0 + 0.5; x < x1; x += 1) world.add(box(0.86, 0.75 + r() * 0.25, z1 - z0 - 0.4, r() < 0.5 ? wheatM : wheatM2, x, 0.45, (z0 + z1) / 2)); };
  field(2.6, 16, -22, -2, 1); field(-16, -2.6, -22, -2, 2); field(2.6, 14, 9, 20, 3); field(-14, -2.6, 2, 14, 4);
  field(60, 76, -30, -14, 5, true); // leeres Feld (Pest)
  // Mohn + Gras am Weg (Hook)
  const r0 = rng(3020), poppy = C(0xd8241c), tall = C(0x5a8a32);
  for (let i = 0; i < 70; i++) { const x = (r0() < 0.5 ? -1 : 1) * (2.3 + r0() * 0.5), z = -20 + r0() * 26; world.add(box(0.14, 0.4 + r0() * 0.3, 0.14, r0() < 0.35 ? poppy : tall, x, 0.25, z, { cast: false })); }
  // Hügel + Burg
  const BZ = -44, stoneM = M(T.cobble), wallM = M(tileTex(0x9a948a, 0x6a645c, 3030)), roofB = M(tileTex(0x3a4a7a, 0x22304e, 3031));
  world.add(box(48, 2, 40, grassM, 0, 1, BZ)); world.add(box(40, 2, 32, grassM, 0, 3, BZ - 2));
  for (let k = 0; k < 8; k++) world.add(box(4.4, (k + 1) * 0.5, 1, pathM, 0, (k + 1) * 0.25, -24 + 0.5 - k * 1 - 0.5)); // Rampe
  const CY = 4, cz = BZ - 4, hw = 12, hd = 10, WH = 7;
  for (const [x, z, w, d] of [[0, cz + hd, hw * 2, 1.4], [0, cz - hd, hw * 2, 1.4], [-hw, cz, 1.4, hd * 2], [hw, cz, 1.4, hd * 2]]) { world.add(box(w, WH, d, wallM, x, CY + WH / 2, z));
    const n = Math.round(Math.max(w, d) / 1.2); for (let i = 0; i < n; i += 2) world.add(box(w > d ? 0.8 : 1.5, 0.8, w > d ? 1.5 : 0.8, wallM, x + (w > d ? -w / 2 + 0.6 + i * 1.2 : 0), CY + WH + 0.4, z + (w > d ? 0 : -d / 2 + 0.6 + i * 1.2))); }
  world.add(box(3.2, 4.2, 0.3, C(0x3a2416), 0, CY + 2.1, cz + hd + 0.72, { cast: false })); world.add(box(3.8, 0.5, 0.4, stoneM, 0, CY + 4.4, cz + hd + 0.75));
  WD.flags = [];
  for (const [x, z] of [[-hw, cz + hd], [hw, cz + hd], [-hw, cz - hd], [hw, cz - hd]]) { world.add(box(4, 11, 4, wallM, x, CY + 5.5, z)); for (let k = 0; k < 3; k++) world.add(box(4.8 - k * 1.4, 1.2, 4.8 - k * 1.4, roofB, x, CY + 11.6 + k * 1.2, z));
    world.add(box(0.8, 1.4, 0.1, C(0x1a1410), x, CY + 8, z + 2.03, { cast: false })); WD.flags.push(flag(FLAG.royal, 2.6, 1.6, 4, world, V(x, CY + 15, z), 0.3, x + z)); }
  world.add(box(9, 16, 9, wallM, 0, CY + 8, cz - 2)); for (let k = 0; k < 4; k++) world.add(box(10 - k * 2.2, 1.4, 10 - k * 2.2, roofB, 0, CY + 16.7 + k * 1.4, cz - 2));
  for (const x of [-2.4, 0, 2.4]) world.add(box(1, 1.8, 0.1, M(T.window, { emissive: 0xffffff, ei: 0.5 }), x, CY + 11, cz + 2.53, { cast: false }));
  WD.flags.push(flag(FLAG.royal, 3.4, 2.1, 5, world, V(0, CY + 22, cz - 2), 0.2, 3));
  // Dorf
  const roofDark = M(T.roof);
  for (const [x, z, w, rot, rf] of [[26, -1, 5, 0, 0], [33, -1.5, 4.4, 0, 1], [40, -1, 5, 0, 0], [24, 13, 5, Math.PI, 1], [31, 13.5, 4.6, Math.PI, 0], [38, 13, 5, Math.PI, 1], [46, 4, 4.6, -Math.PI / 2, 0], [19, 21, 4.4, Math.PI, 1]]) medHouse(world, x, z, w, 4.4, 3.2, rot, rf ? roofDark : M(T.roofRed), true);
  // Brunnen am Dorfplatz
  world.add(box(2.4, 0.9, 2.4, stoneM, 33, 0.45, 6)); world.add(box(1.8, 0.1, 1.8, new THREE.MeshStandardMaterial({ color: 0x2a5a8a, roughness: 0.3 }), 33, 0.86, 6, { cast: false }));
  for (const x of [-1, 1]) world.add(box(0.2, 2.2, 0.2, M(T.darkwood), 33 + x, 1.1, 6)); world.add(box(2.6, 0.5, 1.2, roofDark, 33, 2.4, 6));
  // Marktstand
  const st = new THREE.Group(); st.position.set(28.5, 0, 8.3); st.rotation.y = 0.0; world.add(st); st.add(box(2.6, 0.9, 1.0, M(T.planks), 0, 0.45, 0)); for (const x of [-1.25, 1.25]) for (const z of [-0.45, 0.45]) st.add(box(0.12, 2.5, 0.12, C(0x6a4a2a), x, 1.25, z));
  for (let i = 0; i < 6; i++) st.add(box(0.48, 0.12, 1.3, C(i % 2 ? 0xc03a2a : 0xe8e2d0), -1.2 + i * 0.48, 2.5, 0));
  for (const [x, c] of [[-0.8, 0xc8b080], [0, 0xe07030], [0.8, 0x6a9a3a]]) st.add(box(0.6, 0.3, 0.6, C(c), x, 1.05, 0));
  // Hütte von Hans
  const hut = new THREE.Group(); hut.position.set(9, 0, 25); world.add(hut); hut.add(box(4, 2.6, 3.6, M(T.planks), 0, 1.3, 0)); for (let k = 0; k < 3; k++) hut.add(box(4.6 - k * 1.4, 0.5, 4.2, M(T.wheat), 0, 2.85 + k * 0.5, 0));
  hut.add(box(0.9, 1.7, 0.1, C(0x3a2416), -0.8, 0.85, 1.82, { cast: false }));
  // Zäune
  const fenceM = M(T.planks);
  const fence = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.2); for (let i = 0; i <= n; i++) world.add(box(0.2, 1.1, 0.2, fenceM, lerp(x0, x1, i / n), 0.55, lerp(z0, z1, i / n)));
    const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); for (const y of [0.5, 0.9]) { const b = box(0.08, 0.12, len, fenceM, (x0 + x1) / 2, y, (z0 + z1) / 2); b.rotation.y = a; world.add(b); } };
  fence(2.4, 21, 2.4, 30); fence(2.4, 30, 15, 30);
  // Dorftor (Hans darf nicht weg)
  for (const x of [48.5, 53.5]) world.add(box(1.2, 4.2, 1.2, M(T.planks), x, 2.1, 6)); world.add(box(6.4, 0.8, 1.4, M(T.planks), 51, 4.4, 6));
  fence(53.5, 6.0, 53.5, 18); fence(48.5, 6.0, 48.5, 18);
  world.add(box(14, 0.06, 3.6, pathM, 58, 0.031, 6, { cast: false }));
  // Herrenhaus (Ritter)
  const mh = new THREE.Group(); mh.position.set(24, 0, -16); world.add(mh); mh.add(box(10, 6, 7, wallM, 0, 3, 0)); for (let k = 0; k < 4; k++) mh.add(box(10.6 - k * 2.4, 0.8, 7.6, roofDark, 0, 6.4 + k * 0.8, 0));
  mh.add(box(2, 3, 0.2, C(0x3a2416), 0, 1.5, 3.55, { cast: false })); for (const x of [-3, 3]) mh.add(box(1.1, 1.4, 0.1, M(T.window, { emissive: 0xffffff, ei: 0.5 }), x, 3.8, 3.55, { cast: false }));
  mh.add(box(5, 0.3, 2, stoneM, 0, 0.15, 4.4)); WD.flags.push(flag(FLAG.blue, 1.8, 1.1, 3.4, world, V(27.6, 0, -12.2), 0.4, 5));
  // Kirche
  const ch = new THREE.Group(); ch.position.set(44, 0, -14); world.add(ch); const chM = M(tileTex(0xd8d0c0, 0xa8a090, 3040));
  ch.add(box(8, 7, 14, chM, 0, 3.5, -2)); for (let k = 0; k < 5; k++) ch.add(box(9 - k * 1.8, 0.9, 15, roofDark, 0, 7.45 + k * 0.9, -2));
  ch.add(box(4, 14, 4, chM, 0, 7, 6)); for (let k = 0; k < 4; k++) ch.add(box(4.6 - k * 1.2, 1.2, 4.6 - k * 1.2, roofDark, 0, 14.6 + k * 1.2, 6));
  ch.add(box(0.3, 2.4, 0.3, C(0xf0c030, { metal: 0.5, rough: 0.4 }), 0, 20.6, 6)); ch.add(box(1.2, 0.3, 0.3, C(0xf0c030, { metal: 0.5, rough: 0.4 }), 0, 21.0, 6));
  ch.add(box(2, 3.4, 0.2, C(0x3a2416), 0, 1.7, 8.05, { cast: false })); ch.add(box(1.4, 2.0, 0.1, M(T.window, { emissive: 0xffffff, ei: 0.6 }), 0, 10, 8.05, { cast: false }));
  // Lesepult vor der Kirche
  const lect = new THREE.Group(); lect.position.set(45.6, 0, -4.2); world.add(lect); lect.add(box(0.5, 1.0, 0.4, C(0x6a4a2a), 0, 0.5, 0)); lect.add(box(0.7, 0.06, 0.5, C(0xe8dcc0), 0, 1.06, 0)); lect.add(box(0.02, 0.07, 0.5, C(0x6a2a1a), 0, 1.08, 0));
  // Friedhof
  const crossM = M(T.darkwood); WD.crosses = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { const g = new THREE.Group(); g.position.set(56 + i * 2.2, 0, -4 + k * 2.6); g.add(box(0.18, 1.4, 0.18, crossM, 0, 0.7, 0)); g.add(box(0.8, 0.16, 0.16, crossM, 0, 1.05, 0)); g.add(box(0.9, 0.12, 1.8, M(T.dirt), 0, 0.06, 1.0, { cast: false })); world.add(g); }
  // Wiese Bauernkrieg: gefallene Mistgabeln, Kreuze
  WD.fallen = new THREE.Group(); world.add(WD.fallen); const rf = rng(3050);
  for (let i = 0; i < 9; i++) { const f = forkMesh(); f.position.set(86 + rf() * 10 - 5, 0.08, 34 + rf() * 6 - 3); f.rotation.set(Math.PI / 2, 0, rf() * 6); WD.fallen.add(f); }
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.position.set(83 + i * 1.8, 0, 29 + (i % 2) * 0.8); g.add(box(0.16, 1.3, 0.16, crossM, 0, 0.65, 0)); g.add(box(0.7, 0.14, 0.14, crossM, 0, 1.0, 0)); WD.fallen.add(g); }
  // Pyramide der Stände
  const PYX = -90, PYZ = 40; const tierCol = [0x7a6a4a, 0x9a9aa2, 0x34408a, 0xa81c1c];
  for (let i = 0; i < 4; i++) world.add(box(14 - i * 3.2, 1.6, 14 - i * 3.2, M(tileTex(tierCol[i], shade(tierCol[i], 0.72), 3060 + i)), PYX, 0.8 + i * 1.6, PYZ));
  WD.PY = { x: PYX, z: PYZ };
  // Bäume verstreut
  const rt = rng(3070); for (let i = 0; i < 70; i++) { const a = rt() * Math.PI * 2, d = 28 + rt() * 90; const x = Math.cos(a) * d + 10, z = Math.sin(a) * d - 10; if (Math.abs(x) < 26 && z < -18 && z > -70) continue; if (x > 16 && x < 62 && z > -26 && z < 26) continue; if (x > 76 && x < 96 && z > 22 && z < 44) continue; if (x < -70) continue; oak(world, x, z, 4 + Math.floor(rt() * 2), i); }
  for (const [x, z] of [[-8, 22], [18, -26], [-20, -4], [6, 34], [56, 22], [64, 14]]) oak(world, x, z, 4, x + 100);
  // Privatwald (heute)
  const FX = -160, FZ = -20; const rfw = rng(3080);
  world.add(box(60, 0.06, 5, C(0x3a3a3e, { amt: 0.04 }), FX, 0.04, FZ + 6, { cast: false })); world.add(box(60, 0.07, 0.2, C(0xe8e8e8), FX, 0.045, FZ + 6, { cast: false }));
  for (let i = 0; i < 90; i++) { const x = FX - 28 + rfw() * 56, z = FZ - 30 + rfw() * 32; if (Math.abs(x - FX) < 3 && z > FZ - 4) continue; spruce(world, x, z, 6 + Math.floor(rfw() * 4)); }
  for (let i = 0; i < 20; i++) { const x = FX - 28 + rfw() * 56, z = FZ + 12 + rfw() * 10; spruce(world, x, z, 6 + Math.floor(rfw() * 3)); }
  const scv = document.createElement('canvas'); scv.width = 512; scv.height = 256; const stx = new THREE.CanvasTexture(scv); stx.colorSpace = THREE.SRGBColorSpace;
  const ps = new THREE.Group(); ps.position.set(FX + 2.2, 0, FZ + 1.6); ps.rotation.y = -0.35; world.add(ps); ps.add(box(0.16, 2.2, 0.16, C(0x6a6a6a, { metal: 0.4 }), -1.1, 1.1, 0)); ps.add(box(0.16, 2.2, 0.16, C(0x6a6a6a, { metal: 0.4 }), 1.1, 1.1, 0));
  ps.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.08), [C(0xe8e8e8), C(0xe8e8e8), C(0xe8e8e8), C(0xe8e8e8), new THREE.MeshStandardMaterial({ map: stx, roughness: 0.6 }), C(0xe8e8e8)])); ps.children[2].position.y = 2.0; ps.children[2].castShadow = true;
  WD.signTex = { scv, stx };
  // Fackeln (für Nacht/Dämmerung)
  WD.torches = [];
  for (const [x, z] of [[30, 3.8], [36, 3.8], [44.5, -5.2], [52, 4.8], [86, 30], [80, 36]]) { world.add(box(0.14, 2.0, 0.14, C(0x5a3a1a), x, 1.0, z)); world.add(box(0.26, 0.3, 0.26, flameMat, x, 2.1, z, { cast: false }));
    const l = new THREE.PointLight(0xff9a40, 0, 14, 1.6); l.position.set(x, 2.5, z); world.add(l); WD.torches.push(l); }
  // Licht
  WD.sun = sunLight(world, 0xfff0d0, 3.3, V(-40, 60, 40), V(0, 0, 0), 34); WD.hemi = new THREE.HemisphereLight(0xd8e8ff, 0x8a7a5a, 1.3); world.add(WD.hemi);
  // Figuren
  const mk = (o, ...fx) => { const c = humanoid(o); world.add(c); c.visible = false; fx.forEach(f => f(c)); return c; };
  WD.hans = mk(HANS, strawHat); WD.hansHoe = heldBy(WD.hans, hoeMesh()); WD.hansSack = heldBy(WD.hans, sackMesh(), 'armL');
  WD.koenig = mk(KOENIG, crownOn, c => cape(c, 0xa81c1c));
  WD.fuerst = mk(FUERST, c => cape(c, 0x2a3270)); WD.fSword = heldBy(WD.fuerst, swordMesh());
  WD.graf = mk(GRAF, c => cape(c, 0x1e4a2a));
  WD.ritter = mk(RITTER, c => knightGear(c, 0x34408a)); WD.rSword = heldBy(WD.ritter, swordMesh());
  WD.knights = [0, 1, 2, 3, 4].map(i => { const k = mk({ ...RITTER, seed: 90 + i, beard: i % 2 ? 'mustache' : 'short' }, c => knightGear(c, 0xa81c1c)); heldBy(k, swordMesh()); return k; });
  WD.bischof = mk(BISCHOF, mitre); WD.moench = mk(MOENCH); WD.mSack = null;
  WD.vill = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => mk(peasant(i), i % 3 === 0 ? strawHat : () => {}));
  WD.forks = WD.vill.map((v, i) => heldBy(v, i % 3 === 2 ? torchMesh() : forkMesh())); WD.vSacks = WD.vill.slice(0, 3).map(v => heldBy(v, sackMesh(), 'armL'));
  WD.chicken = heldBy(WD.vill[0], chickenMesh());
  WD.modgraf = mk(MODGRAF); WD.freeman = mk({ ...HANS, top: 0x4a5a7a, bottom: 0x3a3a3a, belt: 0x2a2a2a, beard: 'mustache', seed: 99 }, c => c.userData.head.add(box(0.56, 0.14, 0.56, C(0x2a2a2a), 0, 0.55, 0)));
  WD.peasantFlag = flag(FLAG.peasant, 1.6, 1.0, 3.4, world, V(88, 0, 36), 0.4, 2);
}
const MOODS = {
  gold: { sky: [0x4a6ab0, 0xf0a878, 0xffd29a], fog: 0xf2c69a, sun: 0xffbc80, si: 3.7, dir: V(-0.62, 0.34, 0.7), hemi: [0xffe0c0, 0x7a6048, 1.25], cloud: 0xffe0cc, torch: 0, exp: 1.28 },
  day: { sky: [0x3a80d0, 0x9ac4e8, 0xf0dcb8], fog: 0xe8dcc0, sun: 0xfff0d0, si: 3.3, dir: V(-0.5, 0.75, 0.45), hemi: [0xd8e8ff, 0x8a7a5a, 1.3], cloud: 0xffffff, torch: 0, exp: 1.3 },
  night: { sky: [0x04060e, 0x0e1830, 0x1c2848], fog: 0x0e1424, sun: 0x8aa8e8, si: 1.0, dir: V(0.4, 0.8, 0.35), hemi: [0x4a5a90, 0x101018, 0.75], cloud: 0x283048, torch: 1, exp: 1.55 },
  dusk: { sky: [0x2a2a5a, 0xc0604a, 0xff9a5a], fog: 0xb06048, sun: 0xff8a50, si: 2.8, dir: V(-0.6, 0.22, 0.75), hemi: [0xc08a8a, 0x3a2a2a, 0.9], cloud: 0xffb090, torch: 1, exp: 1.35 },
};
function setMood(name, center) { const m = MOODS[name];
  WD.sky.material.uniforms.top.value.set(m.sky[0]); WD.sky.material.uniforms.mid.value.set(m.sky[1]); WD.sky.material.uniforms.hor.value.set(m.sky[2]); WD.sky.material.uniforms.sd.value.copy(m.dir).normalize();
  world.fog.color.set(m.fog); WD.sun.color.set(m.sun); WD.sun.intensity = m.si; WD.sun.target.position.copy(center); WD.sun.position.copy(center).addScaledVector(m.dir.clone().normalize(), 80);
  WD.hemi.color.set(m.hemi[0]); WD.hemi.groundColor.set(m.hemi[1]); WD.hemi.intensity = m.hemi[2]; WD.cloudM.color.set(m.cloud); WD.torches.forEach(l => l.intensity = m.torch * 9); return m.exp; }
function drawPrivSign() { const { scv, stx } = WD.signTex, c = scv.getContext('2d'); c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, 512, 256); c.strokeStyle = '#2a6a3a'; c.lineWidth = 16; c.strokeRect(8, 8, 496, 240);
  c.fillStyle = '#2a6a3a'; c.textAlign = 'center'; c.font = '800 84px Mont'; c.fillText('PRIVATWALD', 256, 128); c.font = '800 38px Mont'; c.fillStyle = '#3a3a3a'; c.fillText('Betreten verboten', 256, 196); stx.needsUpdate = true; }

// =====================================================================
// SET 2: Thronsaal
// =====================================================================
const hall = new THREE.Scene(); hall.background = new THREE.Color(0x0c0a08);
const HL = {};
{
  const stone = M(tileTex(0x8a847a, 0x5e5a52, 4001)), floor = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0x8a8478 : 0x6a655c, 0.92 + r() * 0.14)); }, 4002));
  room3(hall, 16, 26, 9, stone, floor); hall.add(box(3, 0.04, 22, C(0xa01c1c), 0, 0.02, 1, { cast: false })); hall.add(box(3.4, 0.03, 22, C(0xe0b030), 0, 0.012, 1, { cast: false }));
  hall.add(box(6, 0.4, 3.6, stone, 0, 0.2, -10.6)); hall.add(box(6.2, 0.06, 3.8, C(0xa01c1c), 0, 0.42, -10.6, { cast: false }));
  const gold = C(0xe8b830, { metal: 0.55, rough: 0.35 }); const th = new THREE.Group(); th.position.set(0, 0.4, -11.2); hall.add(th);
  th.add(box(1.3, 0.5, 1.1, gold, 0, 0.25, 0)); th.add(box(1.3, 2.4, 0.2, gold, 0, 1.2, -0.5)); th.add(box(1.0, 1.9, 0.06, C(0xa01c1c), 0, 1.25, -0.38, { cast: false })); th.add(box(0.2, 0.9, 1.1, gold, -0.65, 0.5, 0)); th.add(box(0.2, 0.9, 1.1, gold, 0.65, 0.5, 0));
  for (const x of [-0.5, 0, 0.5]) th.add(box(0.16, 0.3, 0.16, gold, x, 2.55, -0.5));
  for (const x of [-5.5, 5.5]) for (const z of [-7, -1, 5]) hall.add(box(1, 9, 1, stone, x, 4.5, z));
  const banner = (x) => { const g = new THREE.Group(); g.position.set(x, 4.8, -12.8); g.add(box(2.0, 4.6, 0.06, C(0xa81c1c), 0, 0, 0)); g.add(box(0.5, 2.4, 0.07, C(0xf0c030), 0, 0.3, 0.01)); g.add(box(1.4, 0.5, 0.07, C(0xf0c030), 0, 0.8, 0.01)); hall.add(g); };
  banner(-3.6); banner(3.6);
  for (const z of [-6, 0, 6]) { hall.add(box(0.1, 2.6, 1.4, M(T.window, { emissive: 0xffffff, ei: 1.1 }), -7.84, 4.5, z, { cast: false })); }
  HL.torch = [];
  for (const [x, z] of [[-7.6, -9], [7.6, -9], [-7.6, -3], [7.6, -3], [-2.6, -12.6], [2.6, -12.6]]) { hall.add(box(0.14, 0.7, 0.14, C(0x5a3a1a), x, 3.0, z)); hall.add(box(0.24, 0.28, 0.24, flameMat, x, 3.45, z, { cast: false }));
    const l = new THREE.PointLight(0xff9a50, 10, 16, 1.5); l.position.set(x + Math.sign(-x) * 0.4, 3.6, z + 0.4); hall.add(l); }
  const s = sunLight(hall, 0xffd8a8, 2.2, V(-16, 12, 6), V(0, 0, -6), 16, 1024); hall.add(new THREE.HemisphereLight(0xffe0c0, 0x2a2018, 0.9));
  HL.koenig = humanoid(KOENIG); crownOn(HL.koenig); cape(HL.koenig, 0xa81c1c); HL.scroll = heldBy(HL.koenig, scrollMesh());
  HL.fuerst = humanoid(FUERST); cape(HL.fuerst, 0x2a3270); HL.graf = humanoid(GRAF); cape(HL.graf, 0x1e4a2a);
  HL.guards = [0, 1].map(i => { const k = humanoid({ ...RITTER, seed: 120 + i }); knightGear(k, 0xa81c1c); heldBy(k, swordMesh()); return k; });
  hall.add(HL.koenig, HL.fuerst, HL.graf, ...HL.guards);
}

// =====================================================================
// SET 3: Paris 1789 (Straße + Saal bei Nacht)
// =====================================================================
const paris = new THREE.Scene();
const PA = {};
{
  skyDome(paris, 0x04060e, 0x0e1830, 0x1c2848); paris.fog = new THREE.Fog(0x101828, 30, 140);
  paris.add(box(400, 1, 400, M(T.cobble), 0, -0.5, 0, { cast: false }));
  const facade = [M(tileTex(0xd8ccb0, 0xb0a488, 5001, false)), M(tileTex(0xc8b898, 0xa09070, 5002, false))], roofP = M(tileTex(0x4a5260, 0x2a3038, 5003));
  PA.flags = [];
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { const x = side * 7.5, z = 6 - i * 7; const h = 11 + (i % 3);
    paris.add(box(5, h, 6.8, facade[(i + (side > 0)) % 2], x + side * 1, h / 2, z)); for (let k = 0; k < 3; k++) paris.add(box(5.4 - k * 1.6, 1, 7, roofP, x + side * 1, h + 0.5 + k, z));
    for (let f = 0; f < 3; f++) for (const dz of [-1.8, 0, 1.8]) paris.add(box(0.1, 1.5, 0.9, (f + i + dz) % 3 ? M(T.window, { emissive: 0xffffff, ei: 1.0 }) : M(T.windowDark), x - side * 1.53, 2.2 + f * 3.2, z + dz, { cast: false }));
    if (i < 5 && i % 2 === 0) PA.flags.push(flag(FLAG.france, 2.0, 1.3, 2.4, paris, V(x - side * 1.55, 5.6, z + 0.6), side > 0 ? Math.PI : 0, i)); }
  PA.torch = []; for (const [x, z] of [[-4.6, 2], [4.6, -4], [-4.6, -10], [4.6, -16]]) { paris.add(box(0.14, 2.6, 0.14, C(0x2a2a2a), x, 1.3, z)); paris.add(box(0.4, 0.5, 0.4, flameMat, x, 2.8, z, { cast: false })); const l = new THREE.PointLight(0xffa050, 14, 18, 1.5); l.position.set(x, 3.2, z); paris.add(l); }
  sunLight(paris, 0x8aa8e8, 0.9, V(20, 50, 30), V(0, 0, -6), 24, 1024); paris.add(new THREE.HemisphereLight(0x4a5a90, 0x141018, 0.8));
  PA.crowd = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const c = humanoid(peasant(i + 3)); if (i % 2) phrygian(c); cockade(c); if (i % 3 === 1) heldBy(c, torchMesh()); paris.add(c); return c; });
  PA.flagBearer = PA.crowd[4];
  // Saal (x = 100)
  const wood = M(T.darkwood), wall = M(T.wallpaperRed);
  const sg = new THREE.Group(); sg.position.set(100, 0, 0); paris.add(sg);
  sg.add(box(14, 0.2, 12, M(T.planks), 0, -0.1, 0, { cast: false })); sg.add(box(14, 7, 0.3, wall, 0, 3.5, -6)); sg.add(box(0.3, 7, 12, wall, -7, 3.5, 0)); sg.add(box(0.3, 7, 12, wall, 7, 3.5, 0)); sg.add(box(14, 0.2, 12, wood, 0, 7.1, 0, { cast: false }));
  sg.add(box(6, 0.9, 1.8, wood, 0, 0.45, -2)); sg.add(box(6.2, 0.06, 2.0, C(0x2a5a3a), 0, 0.92, -2, { cast: false }));
  PA.docs = []; for (const x of [-1.6, 0.2, 1.8]) { sg.add(box(0.6, 0.02, 0.8, C(0xf0e8d0), x, 0.96, -1.8, { cast: false })); }
  for (const x of [-2.6, -0.6, 2.4]) { sg.add(box(0.12, 0.4, 0.12, C(0xf4f0e0), x, 1.15, -2.4)); sg.add(box(0.07, 0.12, 0.07, flameMat2, x, 1.42, -2.4, { cast: false })); const l = new THREE.PointLight(0xffb060, 3.2, 7, 1.4); l.position.set(x, 1.7, -2.0); sg.add(l); }
  sg.add(box(3.4, 2.4, 0.1, C(0x1a1a2a), 0, 4.2, -5.8, { cast: false })); sg.add(box(3.6, 2.6, 0.08, C(0xc8a030, { metal: 0.5 }), 0, 4.2, -5.84, { cast: false }));
  sg.add(box(0.1, 2.8, 1.6, M(T.windowDark), -6.84, 3.6, -1, { cast: false }));
  PA.nobles = [ADEL, ADEL2, { ...ADEL, top: 0x1a4a3a, hair: 0xd8d8d8, seed: 140 }].map(o => { const c = humanoid(o); paris.add(c); return c; });
  PA.deputy = humanoid({ ...peasant(5), top: 0x2a2a2a, bottom: 0x2a2a2a, seed: 141 }); cockade(PA.deputy); paris.add(PA.deputy);
}

// =====================================================================
// SET 4: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901); const wallM = C(0x6a6470);
  // Burg-Silhouette in der Ferne
  dusk.add(box(40, 4, 30, C(0x4a5a3a), -26, 2, -95)); dusk.add(box(26, 9, 1.5, wallM, -26, 8.5, -84)); for (const x of [-39, -13]) dusk.add(box(4.5, 14, 4.5, wallM, x, 11, -84)); dusk.add(box(8, 20, 8, wallM, -26, 14, -92));
  for (let i = 0; i < 6; i++) dusk.add(box(1, 0.9, 1, M(T.wheat), -6 + i * 2.6, 0.45, 6 + (i % 2) * 1.5));
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('MARC BLOCH, 1939', 72, 150, '#a3241c'); fit('WER LAND BESITZT,', 60, 290, '#3a2a1e'); fit('HERRSCHT ÜBER MENSCHEN', 58, 385, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 73.93; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'land'], [9, 'nomoney'], [19, 'landval'], [24, 'king'], [29, 'alone'], [37, 'grant'], [45, 'lehen'], [49, 'oath'], [61, 'same'], [72, 'pyramid'],
  [79, 'noland'], [89, 'serf'], [101, 'work'], [112, 'tithe'], [119, 'protect'], [125, 'bishop'], [129, 'orders'], [138, 'god'], [148, 'plague'], [153, 'third'], [162, 'fields'],
  [170, 'demand'], [177, 'revolt'], [183, 'crushed'], [191, 'dead'], [194, 'revolution'], [201, 'night'], [208, 'abolish'], [215, 'germany'], [224, 'forest'], [234, 'sign'], [242, 'loop']];
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
let signDrawn = false, privDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const reset = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const WORLD_SHOTS = ['hero', 'loop', 'land', 'nomoney', 'landval', 'alone', 'same', 'pyramid', 'noland', 'serf', 'work', 'tithe', 'protect', 'bishop', 'orders', 'god', 'plague', 'third', 'fields', 'demand', 'revolt', 'crushed', 'dead', 'germany', 'forest'];

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = world, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col, icon) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col, icon }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Welt ----------
  if (WORLD_SHOTS.includes(sh.id)) {
    scene = world; const D = WD; const ta = sh.id === 'loop' ? t - DUR : t;
    const all = [D.hans, D.koenig, D.fuerst, D.graf, D.ritter, D.bischof, D.moench, D.modgraf, D.freeman, ...D.knights, ...D.vill]; reset(all);
    D.hansHoe.visible = true; D.hansSack.visible = false; D.vSacks.forEach(s => s.visible = false); D.forks.forEach(f => f.visible = false); D.chicken.visible = false; D.fSword.visible = false;
    D.fallen.visible = sh.id === 'dead' || sh.id === 'crushed'; D.peasantFlag.visible = sh.id === 'revolt';
    D.flags.forEach((f, i) => f.userData.update(ta + i)); D.peasantFlag.userData.update(t);
    let mood = 'day', ctr = V(0, 0, 0);
    if (sh.id === 'hero' || sh.id === 'loop') { mood = 'gold';
      put(D.hans, HX, 0, HZ, 0.45); put(D.koenig, HX2, 0, HZ, -0.45); pose3(D.hans, 'idle', ta, 0); pose3(D.koenig, 'cross', ta, 1); D.hans.userData.armR.rotation.x = -0.35; D.hans.userData.head.rotation.y = 0.3; D.koenig.userData.head.rotation.y = -0.25; D.koenig.userData.head.rotation.x = -0.12;
      heroCam(ta); tag(D.hans, 'Hans (Bauer)', HERO); tag(D.koenig, 'König', BAD); ctr = V(0, 0, -8); }
    if (sh.id === 'land') { mood = 'gold'; ctr = V(10, 0, -12); put(D.hans, 0.0, 0, -6 + (t - sh.a) * 1.0, Math.PI); pose3(D.hans, 'walk', t);
      mv(u, V(46, 26, 34), V(42, 24.5, 30.5), V(6, 4, -22), V(5, 4, -23), 46); info(wt(4) - 0.03, 'Frankenreich, vor über 1000 Jahren'); }
    if (sh.id === 'nomoney') { ctr = V(29, 0, 6); put(D.hans, 28.0, 0, 5.4, 0.85); put(D.vill[0], 29.8, 0, 5.6, -0.85); pose3(D.hans, 'give', t); pose3(D.vill[0], 'give', t, 1); D.hansSack.visible = true; D.hansHoe.visible = false; D.chicken.visible = true;
      D.hans.userData.armL.rotation.x = -1.3; D.hans.userData.armR.rotation.x = -0.1;
      mv(u, V(28.9, 1.9, 9.6), V(28.9, 1.85, 9.0), V(28.9, 1.25, 5.5), V(28.9, 1.25, 5.5), 46); tag(D.hans, 'Hans', HERO); tag(D.vill[0], 'Nachbar', ALLY);
      chat(wt(11), gray('Geld: kaum')); chat(wt(13), gray('Polizei: keine')); chat(wt(16), gray('Festes Heer: keins')); }
    if (sh.id === 'landval') { mood = 'gold'; ctr = V(6, 0, -14); mv(u, V(9, 2.2, 1.0), V(9, 2.6, -2.2), V(4, 1.0, -30), V(3, 2.0, -34), 50);
      tip(wt(23) - 0.03, 'land', 'Land', '#55ff55', [gray('Das Wertvollste, was es gibt:'), gray('Nahrung · Macht · Ansehen')]); }
    if (sh.id === 'alone') { mood = 'gold'; ctr = V(0, 4, -26); put(D.koenig, -0.5, 4, -25.2, 0.9); pose3(D.koenig, 'idle', t); D.koenig.userData.setFace({ sad: true }); D.koenig.userData.head.rotation.y = 0.15;
      mv(u, V(3.2, 5.9, -20.6), V(2.8, 5.85, -21.2), V(-0.6, 5.2, -25.4), V(-0.6, 5.2, -25.4), 48); tag(D.koenig, 'König', BAD);
      chat(wt(34), gray('Reich: zu groß')); chat(wt(36), red('Feinde: überall')); }
    if (sh.id === 'same') { ctr = V(24, 0, -10); put(D.fuerst, 22.6, 0, -11.0, 0.95); pose3(D.fuerst, 'give', t); D.fSword.visible = true; D.fuerst.userData.armR.rotation.x = -1.5 + Math.sin(t * 2) * 0.05; D.fuerst.userData.armL.rotation.x = 0.05;
      put(D.ritter, 24.4, 0, -10.6, -0.35); pose3(D.ritter, 'kneel', t, 1); D.rSword.visible = false; D.ritter.userData.armR.rotation.x = -0.3;
      mv(u, V(24.2, 1.75, -6.4), V(24.1, 1.7, -7.1), V(23.5, 1.0, -10.8), V(23.5, 1.0, -10.8), 46); tag(D.fuerst, 'Fürst', WHITE); tag(D.ritter, 'Ritter', WHITE, -0.3); chat(wt(70), green('Ritter bekommt ein Lehen')); }
    if (sh.id === 'pyramid') { ctr = V(D.PY.x, 3, D.PY.z); const { x, z } = D.PY; const k = smoother(u);
      put(D.koenig, x, 6.4, z + 0.4, 0); pose3(D.koenig, 'cross', t); [[D.fuerst, -1.2], [D.graf, 1.2]].forEach(([p, dx]) => { put(p, x + dx, 4.8, z + 2.6, -dx * 0.2); pose3(p, 'idle', t, dx); });
      put(D.ritter, x - 1.5, 3.2, z + 4.2, 0.2); put(D.knights[0], x + 1.5, 3.2, z + 4.2, -0.2); [D.ritter, D.knights[0]].forEach((p, i) => pose3(p, 'idle', t, i)); D.rSword.visible = true;
      put(D.hans, x, 1.6, z + 5.8, 0); pose3(D.hans, 'sadidle', t); D.hans.userData.setFace({ sad: true }); [[D.vill[1], -1.6], [D.vill[3], 1.6], [D.vill[4], -3.2], [D.vill[5], 3.2]].forEach(([p, dx], i) => { put(p, x + dx, 1.6, z + 5.8, 0); pose3(p, 'work', t, i); });
      cam(V(x + 4.5, lerp(11.5, 4.4, k), z + lerp(14.5, 13.0, k)), V(x + 0.3, lerp(7.6, 2.6, k), z + lerp(1.0, 4.5, k)), 46);
      tag(D.koenig, 'König', BAD); if (t >= wt(73)) { tag(D.fuerst, 'Fürsten', WHITE); tag(D.ritter, 'Ritter', WHITE); } if (t >= wt(76)) tag(D.hans, 'Hans (Bauer)', HERO); }
    if (sh.id === 'noland') { ctr = V(6, 0, 20); put(D.hans, 6.0, 0, 18.4, 0.35); pose3(D.hans, 'sadidle', t); D.hans.userData.setFace({ sad: true }); D.hans.userData.armR.rotation.x = -0.4;
      mv(u, V(7.8, 1.85, 22.4), V(7.6, 1.82, 21.7), V(6.0, 1.45, 18.0), V(6.0, 1.45, 18.0), 46); tag(D.hans, 'Hans', HERO); chat(wt(80), gray('Eigenes Land: keins')); info(wt(84), 'Hans gehört zum Hof seines Herrn'); }
    if (sh.id === 'serf') { ctr = V(51, 0, 6); put(D.hans, 51.0, 0, 3.4, 0.0); pose3(D.hans, 'sadidle', t); D.hans.userData.setFace({ sad: true });
      put(D.ritter, 52.2, 0, 7.6, Math.PI + 0.9); pose3(D.ritter, 'cross', t, 1); D.rSword.visible = false; D.ritter.userData.setFace({ angry: true });
      mv(u, V(50.6, 1.95, -0.6), V(50.7, 1.9, -0.1), V(51.4, 1.4, 5.4), V(51.4, 1.4, 5.4), 50); D.hans.rotation.y = Math.PI - 0.35;
      tag(D.hans, 'Hans', HERO); tag(D.ritter, 'Ritter', WHITE);
      tip(wt(91) - 0.03, 'chain', 'Leibeigen', '#ff5555', [t >= wt(94) ? red('Wegziehen: verboten') : '', t >= wt(98) ? red('Heiraten: nur mit Erlaubnis') : ''].filter(Boolean)); }
    if (sh.id === 'work') { ctr = V(8, 0, 14); put(D.hans, 6.5, 0, 12.8, 0.55); pose(D.hans, 'work', t); D.hans.userData.setFace({ sad: true });
      [[D.vill[1], 9.2, 14.5, 0.3], [D.vill[2], 4.0, 15.6, 0.6]].forEach(([p, x, z, r], i) => { put(p, x, 0, z, r); pose(p, 'work', t, i + 1); });
      put(D.ritter, 3.2, 0, 10.6, 0.9); pose3(D.ritter, 'cross', t); D.rSword.visible = false;
      mv(u, V(9.2, 2.4, 19.6), V(8.8, 2.3, 18.8), V(6.0, 1.0, 12.4), V(6.0, 1.0, 12.4), 46); tag(D.hans, 'Hans', HERO); tag(D.ritter, 'Herr', WHITE);
      eff(wt(102), 'Abgaben + Frondienst', 'tagelang', BAD, 'hoe'); }
    if (sh.id === 'tithe') { ctr = V(44, 0, -6); put(D.hans, 43.2, 0, -4.4, 0.9); pose3(D.hans, 'give', t); D.hansSack.visible = false; D.hansHoe.visible = false; D.hans.userData.armL.rotation.x = -1.3; D.hansSack.visible = true;
      put(D.moench, 45.0, 0, -4.6, -0.9); pose3(D.moench, 'give', t, 1);
      mv(u, V(44.3, 1.85, -0.3), V(44.2, 1.8, -0.9), V(44.1, 1.3, -4.6), V(44.1, 1.3, -4.6), 46); tag(D.hans, 'Hans', HERO); tag(D.moench, 'Kirche', WHITE);
      chat(wt(113), red('−10 % der Ernte (der Zehnt)')); }
    if (sh.id === 'protect') { ctr = V(32, 0, 0); put(D.ritter, 32.6, 0, 2.6, -0.2); pose(D.ritter, 'fist', t); D.rSword.visible = true;
      put(D.hans, 30.8, 0, 0.8, 0.35); put(D.vill[3], 34.6, 0, 0.6, -0.45); pose3(D.hans, 'idle', t); pose3(D.vill[3], 'idle', t, 2);
      mv(u, V(32.0, 1.4, 7.6), V(32.0, 1.45, 6.9), V(32.3, 1.7, 1.6), V(32.3, 1.7, 1.6), 50); tag(D.ritter, 'Ritter', WHITE, 0.5); tag(D.hans, 'Hans', HERO); eff(wt(124), 'Schutz', 'vom Ritter', '#55ffff', 'shield'); }
    if (sh.id === 'bishop') { ctr = V(45, 0, -5); put(D.bischof, 45.6, 0, -5.0, 0); pose(D.bischof, 'write', t);
      mv(u, V(47.2, 2.3, -1.2), V(46.9, 2.25, -1.8), V(45.6, 1.6, -4.6), V(45.6, 1.6, -4.6), 46); tag(D.bischof, 'Bischof', WHITE); info(wt(126), 'Bischof Adalbero, um 1030'); }
    if (sh.id === 'orders') { ctr = V(44, 0, 0); put(D.moench, 42.2, 0, -1.0, 0.35); pose3(D.moench, 'kneel', t); D.moench.userData.armR.rotation.x = -1.6; D.moench.userData.armL.rotation.x = -1.6; D.moench.userData.head.rotation.x = 0.2;
      put(D.ritter, 44.0, 0, -1.4, 0); pose(D.ritter, 'fist', t, 1); D.rSword.visible = true; put(D.hans, 45.8, 0, -1.0, -0.35); pose(D.hans, 'work', t, 2);
      mv(u, V(44.0, 2.0, 4.6), V(44.0, 1.95, 3.9), V(44.0, 1.4, -1.2), V(44.0, 1.4, -1.2), 50);
      if (t >= wt(130)) tag(D.moench, 'Beten', WHITE, -0.3); if (t >= wt(133)) tag(D.ritter, 'Kämpfen', WHITE, 0.5); if (t >= wt(136)) tag(D.hans, 'Arbeiten', HERO); }
    if (sh.id === 'god') { mood = 'gold'; ctr = V(44, 0, -12); mv(u, V(38, 1.2, 10), V(37.5, 1.5, 8.8), V(44, 13, -8), V(44, 15, -8), 50); chat(wt(143), gray('Jahrhunderte vergehen …')); }
    if (sh.id === 'plague') { mood = 'night'; ctr = V(33, 0, 4); put(D.moench, 32.0, 0, 3.6, 0.5); pose3(D.moench, 'sadidle', t); D.moench.userData.setFace({ sad: true });
      put(D.vill[2], 34.6, 0, 2.6, -0.5); pose(D.vill[2], 'fist', t); D.forks[2].visible = true; D.vill[2].userData.armR.rotation.x = -2.4;
      mv(u, V(33.2, 2.0, 8.6), V(33.1, 1.95, 7.9), V(33.2, 1.5, 3.0), V(33.2, 1.5, 3.0), 48); info(wt(149), red('1347: Die Pest kommt')); }
    if (sh.id === 'third') { mood = 'night'; ctr = V(59, 0, 2); [[D.vill[1], 57.2], [D.vill[3], 59.2], [D.vill[4], 61.2]].forEach(([p, x], i) => { put(p, x, 0, 6.4, [0.25, 0, -0.25][i]); pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      if (t >= wt(157) + 0.1) D.vill[4].visible = false;
      mv(u, V(59.2, 2.0, 11.4), V(59.2, 1.95, 10.7), V(59.2, 1.3, 5.6), V(59.2, 1.3, 5.6), 48); if (D.vill[4].visible) tag(D.vill[4], 'Bauer', ALLY); tag(D.vill[1], 'Bauer', ALLY); tag(D.vill[3], 'Bauer', ALLY);
      chat(wt(157) + 0.1, red('Jeder Dritte stirbt an der Pest')); }
    if (sh.id === 'fields') { ctr = V(68, 0, -20); put(D.hans, 66.4, 0, -16.6, 0.4); pose3(D.hans, 'idle', t); D.hans.userData.head.rotation.y = Math.sin(t * 1.5) * 0.4;
      mv(u, V(69.6, 2.0, -11.4), V(69.2, 1.95, -12.2), V(66.6, 1.3, -17.2), V(66.6, 1.3, -17.2), 48); tag(D.hans, 'Hans', HERO);
      chat(wt(163), gray('Arbeiter gesucht!')); eff(wt(168), 'Bauern', 'wertvoll', '#55ff55', 'up'); }
    if (sh.id === 'demand') { ctr = V(24, 0, -11); put(D.hans, 22.8, 0, -9.2, 0.75); pose(D.hans, 'fist', t); D.hansHoe.visible = false;
      put(D.graf, 25.0, 0, -11.4, -0.6); pose3(D.graf, 'cross', t, 1); D.graf.userData.setFace({ angry: true });
      mv(u, V(24.4, 1.8, -5.4), V(24.3, 1.75, -6.0), V(23.9, 1.4, -10.4), V(23.9, 1.4, -10.4), 46); tag(D.hans, 'Hans', HERO); tag(D.graf, 'Grundherr', WHITE);
      say(wt(171), 'Hans', HERO, 'Mehr Lohn!'); say(wt(174), 'Hans', HERO, 'Mehr Freiheit!'); }
    if (sh.id === 'revolt') { mood = 'dusk'; ctr = V(86, 0, 32); D.vill.forEach((p, i) => { const c = i % 5, r = Math.floor(i / 5); put(p, 83 + c * 1.5 + r * 0.7, 0, 31.6 + r * 1.6 + (c % 2) * 0.4, (2 - c) * 0.08); pose(p, 'fist', t, i); D.forks[i].visible = true; });
      put(D.hans, 86.2, 0, 30.4, 0); pose(D.hans, 'fist', t, 3); D.hansHoe.visible = true; D.hans.userData.setFace({ angry: true }); D.vill.forEach(p => p.userData.setFace({ angry: true }));
      mv(u, V(86.4, 1.6, 26.0), V(86.3, 1.7, 26.8), V(86.4, 2.0, 32.0), V(86.4, 2.2, 32.0), 50); tag(D.hans, 'Hans', HERO); info(wt(177), '1525: Bauernkrieg'); }
    if (sh.id === 'crushed') { mood = 'dusk'; ctr = V(86, 0, 30); const adv = (t - sh.a) * 0.6;
      D.knights.forEach((k, i) => { put(k, 82.6 + i * 1.6, 0, 27.8 - adv, Math.PI + (2 - i) * 0.06); pose(k, 'fist', t, i); k.userData.setFace({ angry: true }); });
      mv(u, V(92.0, 2.4, 22.6), V(91.4, 2.3, 22.0), V(85.6, 1.6, 27.2), V(85.6, 1.6, 27.0), 46);
      const kk = D.knights[3]; kk.rotation.y = Math.PI + 0.6; tag(kk, 'Heer der Fürsten', BAD, 0.0); D.fallen.visible = false; }
    if (sh.id === 'dead') { mood = 'dusk'; ctr = V(86, 0, 32); mv(u, V(88.5, 2.8, 39.5), V(88.2, 2.6, 38.6), V(86.4, 0.6, 32.0), V(86.4, 0.6, 32.0), 46); chat(wt(191) + 0.1, gray('Zehntausende Bauern sterben')); }
    if (sh.id === 'germany') { ctr = V(56, 0, 6); const w = clamp01((t - sh.a) / (sh.b - sh.a)); put(D.freeman, lerp(51.6, 55.4, w), 0, 6.0, Math.PI / 2 - 0.55); pose3(D.freeman, 'walk', t);
      D.freeman.userData.setFace({ smile: true }); mv(u, V(58.6, 1.8, 10.6), V(58.2, 1.75, 10.0), V(53.6, 1.4, 6.0), V(54.4, 1.4, 6.0), 46);
      tag(D.freeman, 'Bauer', ALLY); info(wt(216), 'Deutschland, 19. Jahrhundert'); toast(wt(220), 'Fortschritt erzielt!', 'Leibeigenschaft beendet', 'key'); }
    if (sh.id === 'forest') { ctr = V(-158, 0, -18); if (!privDrawn) { drawPrivSign(); privDrawn = true; }
      put(D.modgraf, -159.2, 0, -17.6, 0.35); pose3(D.modgraf, 'cross', t);
      mv(u, V(-157.0, 1.9, -12.4), V(-157.3, 1.85, -13.1), V(-158.4, 1.6, -18.2), V(-158.4, 1.6, -18.2), 48); tag(D.modgraf, 'Adelsfamilie', WHITE); info(wt(227), 'Heute'); }
    exp = setMood(mood, ctr);
  }
  // ---------- Thronsaal ----------
  if (['king', 'grant', 'lehen', 'oath'].includes(sh.id)) {
    scene = hall; exp = 1.35; const H_ = HL; [H_.koenig, H_.fuerst, H_.graf, ...H_.guards].forEach(p => { p.visible = false; p.userData.setFace({}); }); H_.scroll.visible = false;
    H_.guards.forEach((g, i) => { put(g, i ? 2.6 : -2.6, 0.4, -10.0, 0); pose3(g, 'idle', t, i); });
    if (sh.id === 'king') { put(H_.koenig, 0, 0.4, -11.0, 0); pose3(H_.koenig, 'idle', t); sitPose(H_.koenig, 0.95); H_.koenig.userData.armL.rotation.x = H_.koenig.userData.armR.rotation.x = -1.0;
      mv(u, V(0, 2.2, -3.0), V(0, 2.1, -4.4), V(0, 1.6, -11), V(0, 1.6, -11), 50); tag(H_.koenig, 'König', BAD); info(wt(26), 'Alles Land gehört dem König'); }
    if (sh.id === 'grant') { put(H_.koenig, 0, 0.4, -9.6, 0); pose3(H_.koenig, 'give', t); H_.scroll.visible = true;
      put(H_.fuerst, -1.5, 0, -7.6, 0.5); put(H_.graf, 1.5, 0, -7.6, -0.5); pose3(H_.fuerst, 'kneel', t); pose3(H_.graf, 'kneel', t, 1); H_.fuerst.userData.armR.rotation.x = -0.2; H_.graf.userData.armR.rotation.x = -0.2;
      mv(u, V(0, 2.2, -2.6), V(0, 2.1, -3.4), V(0, 1.3, -8.6), V(0, 1.3, -8.6), 48); tag(H_.koenig, 'König', BAD); tag(H_.fuerst, 'Fürst', WHITE, -0.3); tag(H_.graf, 'Graf', WHITE, -0.3); }
    if (sh.id === 'lehen') { put(H_.koenig, 0.6, 0.4, -9.4, -0.6); pose3(H_.koenig, 'give', t); H_.scroll.visible = true; put(H_.fuerst, -0.5, 0, -8.0, 0.6); pose3(H_.fuerst, 'kneel', t); H_.fuerst.userData.armR.rotation.x = -1.5; H_.fuerst.userData.armL.rotation.x = -1.4;
      mv(u, V(0.6, 1.6, -5.2), V(0.55, 1.58, -5.7), V(0.05, 1.15, -8.8), V(0.05, 1.15, -8.8), 46); tag(H_.fuerst, 'Fürst', WHITE, -0.3);
      tip(wt(46) - 0.03, 'scroll', 'Lehen', '#ffaa00', [gray('lat. feudum'), gray('Land gegen Treue')]); }
    if (sh.id === 'oath') { put(H_.koenig, 0.75, 0.4, -9.2, -0.75); pose3(H_.koenig, 'idle', t); H_.koenig.userData.armR.rotation.x = -1.2; H_.koenig.userData.armL.rotation.x = -1.2;
      put(H_.fuerst, -0.4, 0, -8.0, 0.55); pose3(H_.fuerst, 'kneel', t); H_.fuerst.userData.armR.rotation.x = -1.35; H_.fuerst.userData.armL.rotation.x = -1.35; H_.fuerst.userData.head.rotation.x = -0.15;
      mv(u, V(-1.0, 1.5, -4.4), V(-0.9, 1.48, -5.0), V(0.1, 1.15, -8.6), V(0.1, 1.15, -8.6), 46); tag(H_.koenig, 'König', BAD); tag(H_.fuerst, 'Fürst', WHITE, -0.3);
      chat(wt(50), green('Fürst schwört dem König Treue')); chat(wt(55), gray('Pflicht: Kriegsdienst')); }
  }
  // ---------- Paris ----------
  if (['revolution', 'night', 'abolish'].includes(sh.id)) {
    scene = paris; exp = 1.5; const P_ = PA; PA.flags.forEach((f, i) => f.userData.update(t + i)); [...P_.crowd, ...P_.nobles, P_.deputy].forEach(p => { p.visible = false; p.userData.setFace({}); });
    if (sh.id === 'revolution') { P_.crowd.forEach((p, i) => { const c = i % 3, r = Math.floor(i / 3); put(p, -1.6 + c * 1.6 + r * 0.5, 0, -2 - r * 1.8, (1 - c) * 0.15); pose(p, i % 2 ? 'cheer' : 'fist', t, i); p.userData.setFace({ smile: true }); });
      mv(u, V(0.6, 2.0, 5.0), V(0.5, 2.1, 4.2), V(0, 2.0, -3), V(0, 2.4, -3), 52); info(wt(196), 'Frankreich, 1789'); tag(P_.crowd[1], 'Volk', ALLY, 0.25); }
    if (sh.id === 'night' || sh.id === 'abolish') { exp = 1.45;
      P_.nobles.forEach((p, i) => { put(p, 98.4 + i * 1.6, 0, -3.4, [0.3, 0, -0.3][i]); pose3(p, 'idle', t, i); });
      put(P_.deputy, 103.6, 0, -1.6, -0.9); pose3(P_.deputy, 'point', t);
      if (sh.id === 'night') { pose2(P_.nobles[1], 'raise', t, wt(203)); mv(u, V(100.8, 2.2, 3.4), V(100.6, 2.1, 2.6), V(100.0, 1.5, -2.8), V(100.0, 1.5, -2.8), 50);
        tag(P_.nobles[0], 'Adel', WHITE); tag(P_.nobles[1], 'Adel', WHITE); tag(P_.nobles[2], 'Adel', WHITE); info(wt(203), '4. August 1789, nachts'); }
      else { P_.nobles.forEach(p => p.userData.setFace({ sad: true })); P_.nobles.forEach((p, i) => pose3(p, 'lookdown', t, i));
        mv(u, V(100.6, 1.75, 0.6), V(100.5, 1.72, 0.1), V(100.1, 1.3, -3.2), V(100.1, 1.3, -3.2), 46); tag(P_.nobles[1], 'Adel', WHITE);
        tip(wt(210) - 0.03, 'scroll', 'Vorrechte des Adels', '#ffaa00', [red('Frondienst, Sonderrechte:'), green('abgeschafft')]); }
    }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  land: '<rect x="0" y="1" width="8" height="2" fill="#5fa03a"/><rect x="0" y="3" width="8" height="4" fill="#7a5233"/><rect x="1" y="4" width="1" height="1" fill="#5a3a20"/><rect x="5" y="5" width="1" height="1" fill="#5a3a20"/><rect x="2" y="1" width="1" height="1" fill="#7ac04a"/>',
  scroll: '<rect x="1" y="1" width="6" height="1" fill="#c8b080"/><rect x="2" y="2" width="4" height="4" fill="#f2e8cc"/><rect x="1" y="6" width="6" height="1" fill="#c8b080"/><rect x="3" y="3" width="2" height="1" fill="#8a6a4a"/><rect x="4" y="5" width="1" height="1" fill="#b01818"/>',
  chain: '<rect x="1" y="1" width="3" height="1" fill="#9a9ea6"/><rect x="1" y="1" width="1" height="3" fill="#9a9ea6"/><rect x="3" y="1" width="1" height="3" fill="#9a9ea6"/><rect x="1" y="3" width="3" height="1" fill="#9a9ea6"/><rect x="4" y="4" width="3" height="1" fill="#c8ccd4"/><rect x="4" y="4" width="1" height="3" fill="#c8ccd4"/><rect x="6" y="4" width="1" height="3" fill="#c8ccd4"/><rect x="4" y="6" width="3" height="1" fill="#c8ccd4"/>',
  shield: '<rect x="1" y="1" width="6" height="4" fill="#34408a"/><rect x="2" y="5" width="4" height="1" fill="#34408a"/><rect x="3" y="6" width="2" height="1" fill="#34408a"/><rect x="3" y="2" width="2" height="3" fill="#f0c030"/>',
  up: '<rect x="3" y="1" width="2" height="6" fill="#55ff55"/><rect x="2" y="2" width="4" height="1" fill="#55ff55"/><rect x="1" y="3" width="6" height="1" fill="#55ff55"/>',
  hoe: '<rect x="1" y="1" width="4" height="1" fill="#8a8e94"/><rect x="1" y="2" width="1" height="1" fill="#8a8e94"/><rect x="4" y="2" width="1" height="1" fill="#7a5a3a"/><rect x="5" y="3" width="1" height="1" fill="#7a5a3a"/><rect x="6" y="4" width="1" height="1" fill="#7a5a3a"/><rect x="7" y="5" width="1" height="2" fill="#7a5a3a"/>',
  key: '<rect x="1" y="1" width="3" height="3" fill="#f0c030"/><rect x="2" y="2" width="1" height="1" fill="#212121"/><rect x="3" y="3" width="1" height="1" fill="#f0c030"/><rect x="4" y="4" width="1" height="1" fill="#f0c030"/><rect x="5" y="5" width="2" height="1" fill="#f0c030"/><rect x="6" y="6" width="1" height="1" fill="#f0c030"/><rect x="5" y="4" width="1" height="1" fill="#f0c030"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const NUM = { 'tausend': '1000', 'dreizehnhundertsiebenundvierzig': '1347', 'Fünfzehnhundertfünfundzwanzig': '1525', 'siebzehnhundertneunundachtzig': '1789', 'neunzehnten': '19.' }; if (NUM[txt]) txt = NUM[txt];
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.slice(-5).join('<br>');
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="0" y="0" width="8" height="8" fill="#2a2a2a"/>${ICONS[ui.eff.icon] ?? `<rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/>`}</svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div><div style="color:#aaaaaa">${ui.eff.time}</div></div></div>`;
  if (ui.toast) ex += `<div class="toast" style="opacity:${ui.toast.o};transform:translateY(${ui.toast.y}px)"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.toast.icon]}</svg><div><div class="t1">${ui.toast.l1}</div><div class="t2">${ui.toast.l2}</div></div></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
