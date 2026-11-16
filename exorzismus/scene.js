// „Exorzismus, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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

// ---------- Figuren ----------
const NARZISS = { skin: 0xf0c8a4, hair: 0xe8c860, hairVol: true, top: 0xf2efe6, bottom: 0xe8e2d2, shoe: 0x8a6a3a, eye: '#3a6aa8', seed: 21 };
const ECHO = { skin: 0xf2cdb0, hair: 0xa8542a, longHair: true, top: 0x9ac8e8, bottom: 0x9ac8e8, skirt: true, shoe: 0xd8c8a0, eye: '#3a5a3a', seed: 22 };
const LENA = { skin: 0xf0c4a2, hair: 0x5a3820, longHair: true, top: 0x3a8a6a, bottom: 0x2a3448, shoe: 0xf0f0f0, eye: '#3a5a2a', smile: true, seed: 23 };
const MAX = { skin: 0xe8b894, hair: 0x1e1a18, hairVol: true, top: 0x1c1c22, bottom: 0x2a2e3a, tie: 0xffffff, shoe: 0x1a1a1a, eye: '#3a2a1a', smile: true, seed: 24 };
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

// =====================================================================
// Figuren & Requisiten
// =====================================================================
const ANNE = { skin: 0xf2cdb0, hair: 0x4a2c18, longHair: true, top: 0xc87a3a, bottom: 0x5a4632, skirt: true, shoe: 0x4a3020, eye: '#4a3a2a', seed: 31 };
const ANNE_N = { ...ANNE, skin: 0xe8cdbc, top: 0xe8e2d6, bottom: 0xe8e2d6, shoe: 0xd8d0c0, seed: 32 };
const EXO = { skin: 0xe8b894, hair: 0x9a9a9a, top: 0x18181c, bottom: 0x18181c, skirt: true, shoe: 0x111111, eye: '#3a3a3a', seed: 33 };
const PRI2 = { skin: 0xe0b08a, hair: 0x2a2018, hairVol: true, top: 0x18181c, bottom: 0x18181c, skirt: true, shoe: 0x111111, eye: '#3a2a1a', seed: 34 };
const MUTTER = { skin: 0xecc4a4, hair: 0x6a5240, longHair: true, top: 0x4a6a5a, bottom: 0x3a3a4a, skirt: true, eye: '#3a4a3a', seed: 35 };
const VATER = { skin: 0xe2b490, hair: 0x5a5a5a, top: 0x6a5a48, bottom: 0x3a3a3a, eye: '#3a2a1a', beard: 'mustache', beardCol: 0x5a5a5a, seed: 36 };
const BISCHOF = { skin: 0xecc0a0, hair: 0xd8d8d8, top: 0x6a2a6a, bottom: 0x6a2a6a, skirt: true, shoe: 0x2a1a2a, eye: '#3a3a4a', seed: 37 };
const RICHTER = { skin: 0xe6ba98, hair: 0x7a7a7a, top: 0x141416, bottom: 0x141416, skirt: true, tie: 0xffffff, eye: '#3a3a3a', seed: 38 };
const ARZT = { skin: 0xe8b894, hair: 0x3a2a1e, hairVol: true, top: 0xf2f2f2, bottom: 0x3a4a6a, coat: true, eye: '#3a4a6a', beard: 'short', seed: 39 };
const AERZTIN = { skin: 0xc89a72, hair: 0x1e1612, longHair: true, top: 0xf2f2f2, bottom: 0x3a4a6a, coat: true, eye: '#2a1a12', seed: 40 };
const JUNGE = { skin: 0xf0c4a2, hair: 0x8a5a2a, hairVol: true, top: 0x3a5a8a, bottom: 0x2a2e3a, shoe: 0xe8e8e8, eye: '#3a5a7a', seed: 41 };
function priestify(ch, stole = true) { const B = ch.userData.body;
  B.add(box(0.3, 0.06, 0.02, C(0xffffff), 0, 1.4, 0.14, { cast: false }));
  if (stole) for (const x of [-0.12, 0.12]) B.add(box(0.08, 0.72, 0.03, C(0x6a2a8a), x, 1.06, 0.145, { cast: false })); }
function crossMesh(s = 1, col = 0xc8a040) { const g = new THREE.Group(); const m = C(col, { metal: 0.5, rough: 0.4 }); g.add(box(0.05 * s, 0.34 * s, 0.05 * s, m, 0, 0, 0)); g.add(box(0.2 * s, 0.05 * s, 0.05 * s, m, 0, 0.06 * s, 0)); return g; }
function mitre(ch) { const h = ch.userData.head; const w = C(0xf2eee2), gd = C(0xd8a830, { metal: 0.5, rough: 0.4 }); h.add(box(0.46, 0.5, 0.36, w, 0, 0.75, 0)); h.add(box(0.3, 0.16, 0.3, w, 0, 1.06, 0)); h.add(box(0.08, 0.6, 0.37, gd, 0, 0.8, 0)); h.add(box(0.47, 0.06, 0.37, gd, 0, 0.53, 0)); ch.userData.hatExtra = 0.6; }
function stetho(ch) { const B = ch.userData.body; const m = C(0x2a2a2a); B.add(box(0.04, 0.4, 0.03, m, -0.1, 1.2, 0.15, { cast: false })); B.add(box(0.04, 0.4, 0.03, m, 0.1, 1.2, 0.15, { cast: false })); B.add(box(0.1, 0.06, 0.04, C(0xb8b8b8, { metal: 0.6 }), 0.1, 0.98, 0.16, { cast: false })); }
function pose4(ch, kind, t, ph = 0) {
  pose3(ch, 'idle', t, ph); const P = ch.userData;
  if (kind === 'bless') { P.armR.rotation.x = -1.75 + Math.sin(t * 2.2 + ph) * 0.12; P.armL.rotation.x = -0.9; P.head.rotation.x = 0.12; }
  else if (kind === 'sprinkle') { P.armR.rotation.x = -1.2 + Math.sin(t * 6 + ph) * 0.45; P.armL.rotation.x = -1.0; }
  else if (kind === 'pray') { P.armL.rotation.x = P.armR.rotation.x = -1.15; P.armL.rotation.z = -0.38; P.armR.rotation.z = 0.38; P.head.rotation.x = 0.3; }
  else if (kind === 'kneelpray') { P.legL.rotation.x = P.legR.rotation.x = 0; P.armL.rotation.x = P.armR.rotation.x = -1.15; P.armL.rotation.z = -0.38; P.armR.rotation.z = 0.38; P.head.rotation.x = 0.25; }
  else if (kind === 'scream') { const j = Math.sin(t * 17 + ph); P.head.rotation.x = -0.35 + j * 0.06; P.armL.rotation.z = -0.9 - j * 0.15; P.armR.rotation.z = 0.9 + j * 0.15; P.armL.rotation.x = P.armR.rotation.x = -0.4; }
  else if (kind === 'flinch') { P.armL.rotation.x = P.armR.rotation.x = -1.5; P.armL.rotation.z = -0.25; P.armR.rotation.z = 0.25; P.head.rotation.x = -0.1; }
  else if (kind === 'write') pose(ch, 'write', t, ph);
  else if (kind === 'talk') { P.armR.rotation.x = -0.9 + Math.sin(t * 4 + ph) * 0.25; P.armL.rotation.x = -0.5; P.head.rotation.y = Math.sin(t * 1.3 + ph) * 0.12; }
  else if (kind === 'shake') { P.armR.rotation.x = -1.35 + Math.sin(t * 7 + ph) * 0.12; }
  else if (kind === 'carry') { P.armL.rotation.x = -0.9; P.armR.rotation.x = Math.sin(t * 9 + ph) * 0.4; const w = Math.sin(t * 9 + ph) * 0.6; P.legL.rotation.x = w; P.legR.rotation.x = -w; }
  else pose3(ch, kind, t, ph);
}
function lieOn(ch, x, y, z) { pose(ch, 'idle', 0); ch.rotation.set(-Math.PI / 2, 0, 0); ch.position.set(x, y, z); const P = ch.userData; P.armL.rotation.x = P.armR.rotation.x = 0; P.head.rotation.set(0, 0, 0); }
function kneelAt(ch, baseY = 0) { const P = ch.userData; P.legL.rotation.x = P.legR.rotation.x = 1.45; ch.position.y = baseY - 0.54 * P.s; }

// Texturen
const TX = {
  fach: (base, beam, seed) => tex(32, 32, (c, r) => { noiseFill(c, r, 32, 32, base, 0.05);
    const b = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(c, xx, yy, shade(beam, 0.85 + r() * 0.25)); };
    b(0, 0, 32, 2); b(0, 15, 32, 2); b(0, 30, 32, 2); b(0, 0, 2, 32); b(15, 0, 2, 32); b(30, 0, 2, 32);
    for (let i = 0; i < 13; i++) { b(2 + i, 2 + i, 1, 1); b(2 + i, 16 - i - 2, 1, 1); } }, seed),
  sandstone: tileTex(0xa8604a, 0x7a4234, 3101),
  vines: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x7a5a3a, 0.12); for (let x = 1; x < 16; x += 4) for (let y = 0; y < 16; y++) px(c, x + (r() < 0.3 ? 1 : 0), y, shade(0x4a7a2a, 0.8 + r() * 0.4)), px(c, x + 1, y, shade(0x5a8a32, 0.8 + r() * 0.4)); }, 3102),
  stoneFloor: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const e = x % 8 === 0 || y % 8 === 0; px(c, x, y, shade(e ? 0x6a6258 : ((x >> 3) + (y >> 3)) % 2 ? 0xb8ae9c : 0xa8a08e, 0.9 + r() * 0.15)); } }, 3103),
  tiles: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, x % 4 === 0 || y % 4 === 0 ? 0xc8ccc8 : shade(0xeef0ee, 0.97 + r() * 0.05)); }, 3104),
  panel: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x6a4428, 0.1); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x3e2614); px(c, 0, i, 0x3e2614); px(c, i, 15, 0x8a5a36); px(c, 15, i, 0x8a5a36); } }, 3105),
  stained: tex(8, 16, (c, r) => { const cols = [0xd83a3a, 0x3a6ad8, 0xe8c030, 0x3aa85a, 0x8a3ad8]; for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) px(c, x, y, x === 0 || x === 7 || y === 0 || y % 5 === 0 ? 0x2a2a2a : cols[Math.floor(r() * 5)]); }, 3106),
  floral: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xcab890, 0.04); for (let y = 2; y < 16; y += 8) for (let x = 2; x < 16; x += 8) { px(c, x, y, 0x9a6a5a); px(c, x + 1, y, 0x9a6a5a); px(c, x, y + 1, 0x9a6a5a); px(c, x + 1, y + 1, 0x7a8a5a); px(c, x + 4, y + 4, 0x8a9a6a); } }, 3107),
};

// =====================================================================
// SET 1: Klingenberg am Main – Fachwerk, Sandsteinkirche, Fluss, Weinberge
// =====================================================================
const town = new THREE.Scene();
{
  const sky = skyDome(town, 0x4a7ac8, 0x8ab4e0, 0xe8dcc8, V(-0.5, 0.4, 0.3)); town.fog = new THREE.Fog(0xdcdcd8, 110, 460); clouds(town, 3, 0xffffff, 70, 30, 240, 0.95);
  const grassM = M(T.grass);
  town.add(box(900, 1, 420, grassM, 0, -0.5, 188, { cast: false })); town.add(box(900, 1, 420, grassM, 0, -0.5, -254, { cast: false }));
  town.add(box(900, 1, 22, C(0x3a3428), 0, -2.6, -33, { cast: false }));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 22), new THREE.MeshStandardMaterial({ color: 0x4a7a8a, roughness: 0.12, metalness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.55, -33); town.add(water);
  town.add(box(900, 1.2, 0.8, M(T.sandstone), 0, -0.5, -22.4, { cast: false })); town.add(box(900, 1.2, 0.8, M(T.sandstone), 0, -0.5, -43.6, { cast: false }));
  // Weinberge am anderen Ufer
  const vin = M(TX.vines); for (let s = 0; s < 7; s++) { town.add(box(500, 2.2, 11, vin, 0, 1.1 + s * 2.2, -50 - s * 11, { cast: false, uvScale: 0.5 })); town.add(box(500, 0.5, 0.6, M(T.sandstone), 0, 2.4 + s * 2.2, -44.8 - s * 11, { cast: false })); }
  town.add(box(500, 4, 60, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3a6a2a, 0.15), 3110)), 0, 17, -160, { cast: false }));
  // Straße
  town.add(box(900, 0.06, 6, M(T.cobble), 0, 0.03, 7, { cast: false, uvScale: 0.6 })); town.add(box(900, 0.14, 1.6, C(0xa8a49c), 0, 0.07, 3.2, { cast: false })); town.add(box(900, 0.14, 1.6, C(0xa8a49c), 0, 0.07, 10.8, { cast: false }));
  // Häuserreihen
  const plaster = [0xf0ece2, 0xece2c8, 0xf0dcc0, 0xe8d0c8, 0xe2e6dc], beams = [0x4a2e1c, 0x5a2a1a, 0x3a2a20];
  const fachM = plaster.map((p, i) => M(TX.fach(p, beams[i % 3], 3120 + i)));
  const winOn = new THREE.MeshStandardMaterial({ map: T.window, emissive: 0xffb060, emissiveMap: T.window, emissiveIntensity: 0 });
  const winOff = M(T.windowDark); const tr = rng(3130); const lit = [];
  const house = (x, zFront, dir, i, w = 7.6) => { const h = 5.6 + tr() * 2.6, d = 8, zc = zFront - dir * d / 2; const g = new THREE.Group(); town.add(g);
    g.add(box(w, h, d, fachM[i % 5], x, h / 2, zc, { uvScale: 0.42 })); g.add(box(w + 0.2, 0.5, d + 0.2, M(T.sandstone), x, 0.25, zc));
    for (let s = 0; s < 4; s++) g.add(box(w + 0.5, 0.75, d + 0.6 - s * 2.3, M(T.roofRed), x, h + 0.37 + s * 0.75, zc));
    for (const wx of [-2.1, 2.1]) for (const wy of [1.9, 4.4]) { const lightIt = tr() < 0.45; const wm = box(1.2, 1.3, 0.1, lightIt ? winOn : winOff, x + wx, wy, zFront + dir * 0.03, { cast: false }); g.add(wm); }
    return g; };
  for (let i = -8; i <= 8; i++) { if (i * 8.6 > -56 && i * 8.6 < -20) continue; house(i * 8.6, -2, 1, i + 8); }
  for (let i = -8; i <= 8; i++) house(i * 8.6 + 3.5, 16, -1, i + 11);
  // Annelieses Haus (x=0): Tür + erleuchtetes Fenster oben
  town.add(box(1.3, 2.3, 0.12, C(0x5a3420), 0, 1.15, -1.94, { cast: false })); town.add(box(0.08, 0.08, 0.08, C(0xd8c040), 0.45, 1.15, -1.86, { cast: false }));
  const aWin = box(1.2, 1.3, 0.12, winOn, -2.1, 4.4, -1.9, { cast: false }); town.add(aWin);
  // Sandsteinkirche (x=-30) mit Turm
  const sst = M(T.sandstone); const ch = new THREE.Group(); ch.position.set(-30, 0, 0); town.add(ch);
  ch.add(box(10, 9, 16, sst, 0, 4.5, -11)); for (let s = 0; s < 5; s++) ch.add(box(10.6 - s * 2.1, 0.9, 16.6, M(T.roof), 0, 9.45 + s * 0.9, -11));
  ch.add(box(4.6, 20, 4.6, sst, 0, 10, -1.4)); ch.add(box(5.0, 0.6, 5.0, sst, 0, 20.3, -1.4)); for (let s = 0; s < 6; s++) ch.add(box(4.0 - s * 0.66, 1.4, 4.0 - s * 0.66, M(T.roof), 0, 21.3 + s * 1.4, -1.4));
  ch.add(box(0.12, 1.6, 0.12, C(0xd8a830, { metal: 0.6 }), 0, 30.2, -1.4)); ch.add(box(0.8, 0.12, 0.12, C(0xd8a830, { metal: 0.6 }), 0, 30.5, -1.4));
  ch.add(box(1.8, 3, 0.12, C(0x4a2c1a), 0, 1.5, 0.92, { cast: false })); for (const y of [8, 14]) ch.add(box(1.0, 2.0, 0.1, M(TX.stained), 0, y, 0.92, { cast: false }));
  // Friedhof neben der Kirche
  const gy = new THREE.Group(); gy.position.set(-44, 0, -4); town.add(gy); const grs = rng(3140);
  gy.add(box(12, 0.8, 0.4, sst, 0, 0.4, 5)); gy.add(box(0.4, 0.8, 10, sst, -6, 0.4, 0)); gy.add(box(0.4, 0.8, 10, sst, 6, 0.4, 0));
  for (let gx = -4; gx <= 4; gx += 2.6) for (let gz = -3; gz <= 2; gz += 2.5) { if (gx > 0 && gx < 2 && gz > 1) continue; gy.add(box(0.7, 0.9 + grs() * 0.4, 0.18, C(0x8a8478), gx, 0.5, gz)); gy.add(box(0.9, 0.12, 1.6, C(0x4a6a2a), gx, 0.06, gz + 0.9, { cast: false })); }
  const grave = new THREE.Group(); grave.position.set(1.3, 0, 2.2); gy.add(grave);
  grave.add(box(0.1, 1.4, 0.1, C(0x5a3a22), 0, 0.7, 0)); grave.add(box(0.7, 0.1, 0.1, C(0x5a3a22), 0, 1.1, 0));
  grave.add(box(1.1, 0.16, 1.8, C(0x3a5a22), 0, 0.08, 1.0, { cast: false }));
  for (let i = 0; i < 14; i++) grave.add(box(0.14, 0.14, 0.14, C([0xe8304a, 0xffffff, 0xf0d040, 0xe86a8a][i % 4]), -0.4 + (i % 5) * 0.2, 0.22, 0.4 + Math.floor(i / 5) * 0.45, { cast: false }));
  grave.add(box(0.16, 0.24, 0.16, C(0xc0201a), 0.35, 0.12, 0.15)); const gFlame = box(0.06, 0.08, 0.06, new THREE.MeshBasicMaterial({ color: 0xffd070 }), 0.35, 0.3, 0.15, { cast: false }); grave.add(gFlame);
  // Bäume & Laternen
  const tree = (x, z, s = 1) => { town.add(box(0.6 * s, 3.6 * s, 0.6 * s, C(0x5a3a22), x, 1.8 * s, z)); town.add(box(3.4 * s, 2.8 * s, 3.4 * s, C(0x3f7a32), x, 4.6 * s, z)); town.add(box(2.2 * s, 1.4 * s, 2.2 * s, C(0x4a8a3a), x, 6.5 * s, z)); };
  for (const [x, z, s] of [[-52, 8, 1.1], [-38, 10.5, 0.9], [38, -14, 1.2], [-60, -10, 1.3], [62, -12, 1]]) tree(x, z, s);
  const lamps = []; for (const x of [-12, 6, 22]) { town.add(box(0.14, 3.6, 0.14, C(0x2a2a2a, { metal: 0.4 }), x, 1.8, 2.6)); town.add(box(0.4, 0.4, 0.4, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc070, emissiveIntensity: 0 }), x, 3.7, 2.6, { cast: false }));
    const pl = new THREE.PointLight(0xffb060, 0, 14, 1.6); pl.position.set(x, 3.4, 2.9); town.add(pl); lamps.push(pl); }
  const sun = sunLight(town, 0xfff0d8, 3.2, V(-45, 60, 45), V(0, 0, 0), 60, 2048);
  const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5); town.add(hemi);
  const anne = humanoid(ANNE), exo = humanoid(EXO), pri2 = humanoid(PRI2); priestify(exo); priestify(pri2, false); town.add(anne, exo, pri2);
  const cross = inHand(exo, crossMesh(1.2)); const books = new THREE.Group(); books.add(box(0.3, 0.08, 0.4, C(0x2a4a7a), 0, 0, 0)); books.add(box(0.28, 0.08, 0.38, C(0x7a2a22), 0, 0.08, 0)); books.position.set(0, -0.55, 0.25); anne.userData.armL.add(books);
  const bag = box(0.3, 0.36, 0.14, C(0x3a2a1a), 0, -0.72, 0.06); pri2.userData.armL.add(bag);
  town.userData = { sky, sun, hemi, lamps, winOn, anne, exo, pri2, cross, books, bag, grave, gFlame, gy, lit };
}
function townMood(mode) { const U = town.userData, s = U.sky.material.uniforms;
  const m = { day: [3.2, 1.5, 0xfff0d8, [-45, 60, 45], 0x4a7ac8, 0x8ab4e0, 0xe8dcc8, 0xdcdcd8, 0, 0],
    night: [0.35, 0.35, 0x8aa0e0, [-30, 50, 40], 0x050a1a, 0x0c1630, 0x1a2848, 0x101a30, 1.6, 30],
    dusk: [2.4, 0.9, 0xffa060, [60, 12, -40], 0x2a3a6a, 0xc87a6a, 0xffb070, 0xd8a080, 0.9, 12] }[mode];
  U.sun.intensity = m[0]; U.hemi.intensity = m[1]; U.sun.color.set(m[2]); U.sun.position.set(...m[3]); s.top.value.set(m[4]); s.mid.value.set(m[5]); s.hor.value.set(m[6]); town.fog.color.set(m[7]);
  U.winOn.emissiveIntensity = m[8]; U.lamps.forEach(l => l.intensity = m[9]); U.lamps.forEach(l => l.parent && 0); }

// =====================================================================
// Innenräume – Grundgerüst
// =====================================================================
function interior(bg, wallM, floorM, w, d, h, opts = {}) {
  const s = new THREE.Scene(); s.background = new THREE.Color(bg);
  s.add(box(w, 0.2, d, floorM, 0, -0.1, 0, { cast: false, uvScale: opts.fuv ?? 1 }));
  s.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2 - 0.15, { cast: false, uvScale: opts.wuv ?? 1 }));
  s.add(box(0.3, h, d, wallM, -w / 2 - 0.15, h / 2, 0, { cast: false, uvScale: opts.wuv ?? 1 }));
  s.add(box(0.3, h, d, wallM, w / 2 + 0.15, h / 2, 0, { cast: false, uvScale: opts.wuv ?? 1 }));
  return s;
}

// =====================================================================
// SET 2: Annelieses Zimmer (Bett, Hausaltar, Kreuz, Tonband)
// =====================================================================
const bedr = interior(0x0a0b10, M(TX.floral), M(T.planks), 7, 7, 3.6);
{
  const S = bedr, dw = M(T.darkwood);
  // Fenster in der rechten Wand
  const winM = new THREE.MeshBasicMaterial({ color: 0x8ab0e0 }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.3), winM); win.rotation.y = -Math.PI / 2; win.position.set(3.48, 2.0, -0.9); S.add(win);
  S.add(box(0.1, 0.08, 1.5, dw, 3.46, 2.0, -0.9)); S.add(box(0.1, 1.4, 0.08, dw, 3.46, 2.0, -0.9)); S.add(box(0.12, 0.1, 1.6, dw, 3.45, 1.32, -0.9)); S.add(box(0.12, 0.1, 1.6, dw, 3.45, 2.68, -0.9));
  // Bett
  S.add(box(1.8, 0.45, 2.8, dw, -2.5, 0.225, -2.05)); S.add(box(1.7, 0.18, 2.7, M(T.white), -2.5, 0.54, -2.05)); S.add(box(1.2, 0.16, 0.5, M(T.white), -2.5, 0.71, -3.05)); S.add(box(1.8, 1.0, 0.12, dw, -2.5, 0.5, -3.42));
  const blanket = box(1.6, 0.12, 1.25, C(0x7a5a8a), -2.5, 0.86, -1.3); S.add(blanket);
  // Kreuz über dem Bett
  S.add(box(0.1, 0.9, 0.06, dw, -2.5, 2.3, -3.47, { cast: false })); S.add(box(0.5, 0.1, 0.06, dw, -2.5, 2.48, -3.47, { cast: false }));
  // Nachttisch: Kerze, Tabletten, Teller
  S.add(box(0.6, 0.6, 0.6, dw, -1.2, 0.3, -3.1));
  const candle = (x, y, z) => { S.add(box(0.08, 0.2, 0.08, C(0xf2eee0), x, y + 0.1, z)); const f = box(0.05, 0.08, 0.05, new THREE.MeshBasicMaterial({ color: 0xffd070 }), x, y + 0.25, z, { cast: false }); S.add(f); return f; };
  const flames = [candle(-1.35, 0.6, -3.2)];
  const pills = new THREE.Group(); pills.add(box(0.1, 0.16, 0.1, C(0xc86a2a), 0, 0.08, 0)); pills.add(box(0.11, 0.04, 0.11, C(0xf0f0f0), 0, 0.18, 0)); pills.position.set(-1.05, 0.6, -3.0); S.add(pills);
  const plate = new THREE.Group(); plate.add(box(0.36, 0.03, 0.36, C(0xf0f0f0), 0, 0.015, 0)); plate.add(box(0.16, 0.08, 0.1, C(0xb07a3a), -0.05, 0.07, 0)); plate.add(box(0.1, 0.06, 0.1, C(0xd83a2a), 0.09, 0.06, 0.05)); plate.position.set(-1.15, 0.6, -2.95); S.add(plate);
  // Hausaltar an der Rückwand
  S.add(box(1.2, 0.8, 0.5, dw, 1.2, 0.4, -3.2)); S.add(box(1.24, 0.04, 0.54, M(T.white), 1.2, 0.82, -3.2));
  const ac = crossMesh(1.8, 0x8a6a3a); ac.position.set(1.2, 1.15, -3.25); S.add(ac);
  S.add(box(0.14, 0.34, 0.12, C(0x3a6ac8), 0.82, 1.01, -3.2)); S.add(box(0.1, 0.1, 0.1, C(0xf0d0b0), 0.82, 1.22, -3.2));
  flames.push(candle(1.62, 0.84, -3.15), candle(0.95, 0.84, -3.05));
  S.add(box(1.4, 0.05, 0.9, C(0x8a3a2a), 1.2, 0.025, -2.3, { cast: false }));
  // Schreibtisch mit Büchern
  S.add(box(0.8, 0.75, 1.4, dw, 3.0, 0.375, 1.6)); for (let i = 0; i < 4; i++) S.add(box(0.3, 0.07, 0.4, C([0x2a4a7a, 0x7a2a22, 0x3a5a2a, 0x6a4a1a][i]), 3.0, 0.79 + i * 0.07, 1.2));
  S.add(box(0.5, 0.5, 0.5, dw, 2.3, 0.25, 1.6));
  // Tisch mit Tonband, Weihwasser, Gebetbuch
  S.add(box(0.8, 0.7, 0.7, dw, -0.9, 0.35, 0.6));
  const tape = new THREE.Group(); tape.position.set(-0.9, 0.7, 0.6); S.add(tape); tape.add(box(0.56, 0.12, 0.36, C(0x3a3a3c), 0, 0.06, 0)); tape.add(box(0.5, 0.01, 0.3, C(0x6a6a6c, { metal: 0.4 }), 0, 0.125, 0, { cast: false }));
  const reels = [-0.13, 0.13].map(x => { const r = new THREE.Group(); r.position.set(x, 0.14, -0.02); r.add(box(0.18, 0.02, 0.18, C(0x2a2a2a), 0, 0, 0)); r.add(box(0.2, 0.025, 0.04, C(0xb8b8b8, { metal: 0.6 }), 0, 0, 0)); r.add(box(0.04, 0.025, 0.2, C(0xb8b8b8, { metal: 0.6 }), 0, 0, 0)); tape.add(r); return r; });
  tape.add(box(0.03, 0.02, 0.03, new THREE.MeshBasicMaterial({ color: 0xc02010 }), 0.22, 0.135, 0.13, { cast: false }));
  const bowl = new THREE.Group(); bowl.position.set(-0.9, 0.7, 0.3); bowl.add(box(0.22, 0.08, 0.22, C(0xc8c8c8, { metal: 0.6, rough: 0.3 }), 0, 0.04, 0)); bowl.add(box(0.18, 0.01, 0.18, C(0x7ab0e0, { rough: 0.1 }), 0, 0.085, 0, { cast: false })); S.add(bowl);
  const pbook = box(0.2, 0.05, 0.26, C(0x7a1a1a), -0.6, 0.725, 0.75); S.add(pbook);
  // Fratzen (an der linken Wand)
  const fr = [0, 1, 2].map(i => { const tx = tex(8, 8, (c, r) => { c.clearRect(0, 0, 8, 8); c.fillStyle = 'rgba(20,10,10,0.85)'; c.fillRect(1, 1, 6, 6); c.fillRect(0, 2, 8, 3); c.fillStyle = '#ff2a1a'; c.fillRect(2, 3, 1, 1); c.fillRect(5, 3, 1, 1); c.fillStyle = '#000'; c.fillRect(2, 5, 4, 1); if (i !== 1) { c.fillRect(1, 0, 1, 1); c.fillRect(6, 0, 1, 1); } }, 3200 + i);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false })); m.rotation.y = Math.PI / 2; m.position.set(-3.47, [2.3, 2.9, 1.9][i], [-0.2, 1.0, 1.9][i]); S.add(m); return m; });
  const sun = sunLight(S, 0xffe8c8, 2.0, V(10, 7, -0.9), V(0, 0, -0.9), 7, 1024);
  const hemi = new THREE.HemisphereLight(0xe8e0d0, 0x4a3a2a, 1.2); S.add(hemi);
  const lamp = new THREE.PointLight(0xffb070, 6, 10, 1.5); lamp.position.set(0.2, 3.3, 0.3); S.add(lamp);
  const cand = new THREE.PointLight(0xff9a40, 0, 6, 1.6); cand.position.set(0.2, 1.3, -2.6); S.add(cand);
  const anne = humanoid(ANNE_N), exo = humanoid(EXO), pri2 = humanoid(PRI2), mutter = humanoid(MUTTER), vater = humanoid(VATER); priestify(exo); priestify(pri2);
  S.add(anne, exo, pri2, mutter, vater); const cross = inHand(exo, crossMesh(1.2));
  const sprinkler = new THREE.Group(); sprinkler.add(box(0.04, 0.04, 0.3, C(0xb8b8b8, { metal: 0.6 }), 0, 0, 0.12)); sprinkler.add(box(0.09, 0.09, 0.09, C(0xc8c8c8, { metal: 0.6 }), 0, 0, 0.3)); const spr = inHand(pri2, sprinkler);
  const drops = particlesBurst(S, 16, [0x9ad0ff, 0xd8f0ff], 3210, 0.05);
  Object.assign(S.userData, { winM, blanket, pills, plate, tape, reels, bowl, fr, sun, hemi, lamp, cand, flames, anne, exo, pri2, mutter, vater, cross, spr, drops });
}
function bedMood(mode) { const R = bedr.userData;
  const m = { day: [2.0, 1.2, 6, 0x8ab0e0, 0xffe8c8, 0xe8e0d0, 0], night: [0.3, 0.45, 0, 0x0e1630, 0x8090c0, 0x5a6890, 0], candle: [0.5, 0.45, 0.6, 0x2a3050, 0x9aa8d8, 0x8a90b0, 9], dim: [0.9, 0.6, 1.5, 0x5a6a8a, 0xb8c0e0, 0xa8acc0, 3], dusk: [1.6, 0.6, 0, 0xffa070, 0xffa060, 0xc0a090, 4] }[mode];
  R.sun.intensity = m[0]; R.hemi.intensity = m[1]; R.lamp.intensity = m[2]; R.winM.color.set(m[3]); R.sun.color.set(m[4]); R.hemi.color.set(m[5]); R.cand.intensity = m[6]; }

// =====================================================================
// SET 3: Bischofsbüro
// =====================================================================
const bish = interior(0x0a0806, M(TX.panel), M(T.planks), 6, 6, 3.6);
{
  const S = bish; S.add(box(3, 2.6, 0.4, M(T.books), -1.2, 1.3, -2.85)); S.add(box(1.4, 3.2, 0.1, M(T.redCloth), 1.8, 1.8, -2.93, { cast: false }));
  S.add(box(2.2, 0.1, 1.1, M(T.darkwood), 0, 0.85, -0.6)); S.add(box(2.1, 0.8, 0.9, M(T.darkwood), 0, 0.4, -0.7)); S.add(box(0.9, 0.02, 0.6, C(0xf0e8d0), 0.1, 0.91, -0.5, { cast: false }));
  S.add(box(0.03, 0.03, 0.3, C(0x1a1a1a), 0.35, 0.94, -0.45, { cast: false })); S.add(box(0.1, 0.12, 0.1, C(0x1a1a1a), -0.7, 0.96, -0.7));
  const seal = box(0.12, 0.02, 0.12, C(0xb81a1a), -0.15, 0.925, -0.3, { cast: false }); S.add(seal);
  S.add(box(0.8, 1.3, 0.2, M(T.darkwood), 0, 0.65, -1.6)); const ac = crossMesh(2.4, 0xd8a830); ac.position.set(0, 2.5, -2.9); S.add(ac);
  sunLight(S, 0xffe0b8, 2.2, V(6, 7, 6), V(0, 0, -1), 6, 1024); S.add(new THREE.HemisphereLight(0xe8d8c0, 0x3a2a1a, 1.0));
  const l = new THREE.PointLight(0xffb070, 5, 8, 1.5); l.position.set(-0.8, 1.6, 0.2); S.add(l);
  const b = humanoid(BISCHOF); mitre(b); priestify(b, false); S.add(b);
  S.userData = { b, seal };
}

// =====================================================================
// SET 4: Kirche innen (Bänke, Altar, Ambo mit Bibel, Fenster)
// =====================================================================
const kirche = interior(0x0a0806, M(T.brickGrey), M(TX.stoneFloor), 10, 24, 9, { wuv: 0.5, fuv: 0.6 });
{
  const S = kirche; const st = M(T.brickGrey, {}), dw = M(T.darkwood);
  for (const x of [-3.2, 3.2]) for (let z = -9; z <= 9; z += 3) S.add(box(0.8, 9, 0.8, M(T.white), x, 4.5, z));
  for (let z = -6; z <= 9; z += 1.4) for (const x of [-1.9, 1.9]) { S.add(box(2.4, 0.45, 0.5, dw, x, 0.45, z)); S.add(box(2.4, 0.6, 0.1, dw, x, 0.75, z + 0.25)); }
  S.add(box(5, 0.5, 3, M(TX.stoneFloor), 0, 0.25, -10.4)); S.add(box(2.4, 1.1, 1.0, M(T.white), 0, 1.05, -10.6)); S.add(box(2.6, 0.06, 1.1, C(0xd8a830, { metal: 0.5 }), 0, 1.62, -10.6, { cast: false }));
  const ac = crossMesh(9, 0xd8a830); ac.position.set(0, 5.4, -11.8); S.add(ac);
  for (const x of [-0.9, 0.9]) { S.add(box(0.1, 0.5, 0.1, C(0xf2eee0), x, 1.9, -10.6)); S.add(box(0.06, 0.1, 0.06, new THREE.MeshBasicMaterial({ color: 0xffd070 }), x, 2.2, -10.6, { cast: false })); }
  for (let z = -8; z <= 8; z += 4) for (const x of [-4.98, 4.98]) { const w = box(0.06, 3.4, 1.4, new THREE.MeshStandardMaterial({ map: TX.stained, emissive: 0xffffff, emissiveMap: TX.stained, emissiveIntensity: 0.9 }), x, 5.2, z, { cast: false }); S.add(w); }
  // Ambo mit Bibel
  const ambo = new THREE.Group(); ambo.position.set(2.6, 0, -7.6); S.add(ambo); ambo.add(box(0.7, 1.2, 0.6, dw, 0, 0.6, 0)); const top = box(0.9, 0.08, 0.7, dw, 0, 1.28, 0.05); top.rotation.x = 0.35; ambo.add(top);
  const bible = new THREE.Group(); bible.position.set(0, 1.36, 0.06); bible.rotation.x = 0.35; ambo.add(bible); bible.add(box(0.72, 0.06, 0.5, C(0x5a1a1a), 0, 0, 0)); bible.add(box(0.33, 0.05, 0.46, C(0xf0e6c8), -0.175, 0.04, 0, { cast: false })); bible.add(box(0.33, 0.05, 0.46, C(0xf0e6c8), 0.175, 0.04, 0, { cast: false })); bible.add(box(0.03, 0.03, 0.52, C(0xd8a830), 0, 0.07, 0, { cast: false }));
  const cl = (x, z) => { ambo.add(box(0.1, 0.4, 0.1, C(0xf2eee0), x, 1.4, z)); ambo.add(box(0.06, 0.1, 0.06, new THREE.MeshBasicMaterial({ color: 0xffd070 }), x, 1.66, z, { cast: false })); }; cl(-0.38, -0.2); cl(0.38, -0.2);
  sunLight(S, 0xffe0b0, 2.6, V(-14, 18, 6), V(0, 0, -2), 14, 2048); S.add(new THREE.HemisphereLight(0xd8d0c8, 0x3a3028, 1.0));
  const l1 = new THREE.PointLight(0xffb070, 10, 10, 1.4); l1.position.set(0, 3.2, -9); S.add(l1); const l2 = new THREE.PointLight(0xffb070, 4, 5, 1.5); l2.position.set(2.4, 2.2, -6.8); S.add(l2);
  S.userData = { ambo, bible };
}

// =====================================================================
// SET 5: Gericht (Richterbank, Anklagebank)
// =====================================================================
const court = interior(0x0a0806, M(TX.panel), M(T.planks), 9, 9, 4.2);
{
  const S = court, dw = M(T.darkwood);
  S.add(box(6.4, 0.5, 2, dw, 0, 0.25, -3.4)); S.add(box(6, 1.3, 0.6, dw, 0, 1.15, -2.7)); S.add(box(6.2, 0.08, 0.8, M(T.darkwood), 0, 1.84, -2.75));
  S.add(box(3.2, 1.6, 0.06, C(0xe8e2d0), 0, 3.0, -4.48, { cast: false }));
  for (let i = 0; i < 6; i++) S.add(box(0.06, 1.4, 0.04, C(0xb0a890), -1.4 + i * 0.56, 3.0, -4.44, { cast: false }));
  S.add(box(1.0, 0.5, 4.2, dw, -3.0, 0.25, 0.4)); S.add(box(0.12, 0.9, 4.2, dw, -2.4, 0.45, 0.4)); S.add(box(0.1, 1.0, 4.2, dw, -3.55, 0.95, 0.4));
  const gavel = new THREE.Group(); gavel.add(box(0.26, 0.12, 0.12, C(0x5a3420), 0, 0, 0)); gavel.add(box(0.04, 0.04, 0.3, C(0x6a4428), 0, 0, 0.18));
  sunLight(S, 0xfff0d8, 2.4, V(8, 9, 6), V(0, 0, -1), 8, 1024); S.add(new THREE.HemisphereLight(0xe8e0d0, 0x3a2a1a, 1.25));
  const j = humanoid(RICHTER); S.add(j); const jg = inHand(j, gavel);
  const def = [humanoid(MUTTER), humanoid(VATER), humanoid(EXO), humanoid(PRI2)]; priestify(def[2], false); priestify(def[3], false); def.forEach(d => S.add(d));
  S.userData = { j, def };
}

// =====================================================================
// SET 6: Klinik (EEG-Monitor, Liege, Schreibtisch)
// =====================================================================
const clinic = interior(0x0a0c10, M(TX.tiles), M(T.lino), 7, 7, 3.4, { wuv: 1.2 });
{
  const S = clinic;
  S.add(box(1.8, 0.08, 0.9, C(0xe8e8e8), -1.4, 0.76, -2.2)); S.add(box(1.7, 0.72, 0.8, C(0x9aa0a8), -1.4, 0.36, -2.25));
  const ecv = document.createElement('canvas'); ecv.width = 64; ecv.height = 40; const etex = new THREE.CanvasTexture(ecv); etex.magFilter = THREE.NearestFilter; etex.colorSpace = THREE.SRGBColorSpace;
  const mon = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.1), [C(0x2a2a2a), C(0x2a2a2a), C(0x2a2a2a), C(0x2a2a2a), new THREE.MeshBasicMaterial({ map: etex }), C(0x2a2a2a)]); mon.position.set(-1.4, 1.3, -2.45); S.add(mon);
  S.userData.drawEEG = (t, wild) => { const c = ecv.getContext('2d'); c.fillStyle = '#081208'; c.fillRect(0, 0, 64, 40);
    for (let ch = 0; ch < 4; ch++) { c.fillStyle = ['#3aff6a', '#3ad0ff', '#ffe03a', '#ff6a3a'][ch]; const y0 = 6 + ch * 9;
      for (let x = 0; x < 64; x++) { const ph = x * 0.6 + t * 12 + ch * 3; const a = wild && x > 26 ? (Math.sin(ph * 1.7) * 3.5 + Math.sin(ph * 4.3) * 1.5) : Math.sin(ph) * 1.2; c.fillRect(x, Math.round(y0 + a), 1, 1); } } etex.needsUpdate = true; };
  S.add(box(0.9, 0.55, 2.0, C(0x8aa0b8), 2.4, 0.5, -1.6)); S.add(box(0.9, 0.12, 2.0, C(0xf2f2f2), 2.4, 0.83, -1.6)); S.add(box(0.7, 0.12, 0.4, C(0xffffff), 2.4, 0.95, -2.35));
  S.add(box(0.5, 0.6, 0.5, C(0xc86a3a), 3.0, 0.3, 1.8)); S.add(box(0.8, 1.0, 0.8, C(0x3a8a3a), 3.0, 1.1, 1.8));
  S.add(box(1.0, 0.7, 0.04, C(0xffffff), 0.8, 2.2, -3.47, { cast: false })); S.add(box(0.4, 0.4, 0.05, C(0xd82a2a), 0.8, 2.2, -3.44, { cast: false })); S.add(box(0.12, 0.3, 0.06, C(0xffffff), 0.8, 2.2, -3.41, { cast: false })); S.add(box(0.3, 0.12, 0.06, C(0xffffff), 0.8, 2.2, -3.41, { cast: false }));
  sunLight(S, 0xffffff, 2.2, V(6, 8, 7), V(0, 0, -1), 6, 1024); S.add(new THREE.HemisphereLight(0xeef4ff, 0x6a7080, 1.5));
  const l = new THREE.PointLight(0xe8f0ff, 5, 9, 1.4); l.position.set(0, 3.1, 0); S.add(l);
  const doc = humanoid(ARZT), doc2 = humanoid(AERZTIN), anne = humanoid(ANNE), junge = humanoid(JUNGE), bis = humanoid(BISCHOF); stetho(doc); stetho(doc2); mitre(bis); priestify(bis, false); S.add(doc, doc2, anne, junge, bis);
  Object.assign(S.userData, { doc, doc2, anne, junge, bis });
}

// =====================================================================
// SET 7: Gehirn (Epilepsie + Psychose)
// =====================================================================
const brainS = new THREE.Scene(); brainS.background = new THREE.Color(0x07060c);
{
  const S = brainS, g = new THREE.Group(); S.add(g); const r = rng(3300); const pk = [C(0xe89aa8), C(0xd88a9a), C(0xf0aab4)];
  for (let x = -7; x <= 7; x++) for (let y = -4; y <= 5; y++) for (let z = -9; z <= 9; z++) { const nx = x / 7.2, ny = (y - 0.5) / 5, nz = z / 9.2; const d = nx * nx + ny * ny + nz * nz; if (d > 1 || d < 0.7 || Math.abs(x) < 0.6 || r() < 0.08) continue; if (y < -2 && z > 2) continue;
    g.add(box(0.25, 0.25, 0.25, pk[(x + y + z + 30) % 3], x * 0.25 + (x > 0 ? 0.06 : -0.06), y * 0.25, z * 0.25)); }
  g.add(box(0.5, 1.2, 0.5, C(0xd88a9a), 0, -1.4, -0.6));
  const bolts = []; for (let i = 0; i < 9; i++) { const b = new THREE.Group(); const yl = new THREE.MeshBasicMaterial({ color: i % 3 === 2 ? 0x9a6aff : 0xffe84a }); let px0 = (r() - 0.5) * 2.6, py0 = 0.4 + r() * 0.9, pz0 = (r() - 0.5) * 3.6;
    for (let k = 0; k < 5; k++) { b.add(box(0.07, 0.07, 0.07, yl, px0, py0, pz0, { cast: false })); px0 += (r() - 0.5) * 0.4; py0 += 0.16; pz0 += (r() - 0.5) * 0.4; } g.add(b); bolts.push(b); }
  S.add(new THREE.HemisphereLight(0xffe8f0, 0x2a1a3a, 1.3)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(4, 6, 6); S.add(d);
  const pl = new THREE.PointLight(0xffe84a, 0, 8, 1.4); pl.position.set(0, 2.5, 1); S.add(pl);
  S.userData = { g, bolts, pl };
}

// =====================================================================
// SET 8: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901); const sst = M(T.sandstone);
  const tw = new THREE.Group(); tw.position.set(-22, 0, -70); dusk.add(tw); tw.add(box(5, 22, 5, sst, 0, 11, 0)); for (let s = 0; s < 6; s++) tw.add(box(4.4 - s * 0.72, 1.6, 4.4 - s * 0.72, M(T.roof), 0, 22.8 + s * 1.6, 0)); tw.add(box(12, 10, 16, sst, 0, 5, -10));
  for (let i = 0; i < 10; i++) { const x = -60 + i * 11 + r() * 4; dusk.add(box(8, 6 + r() * 3, 8, C(0xc8b8a0), x + 30, 3.5, -90 - r() * 10)); }
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  const cand = new THREE.Group(); cand.position.set(1.2, 0, 1.0); cand.add(box(0.2, 0.3, 0.2, C(0xc0201a), 0, 0.15, 0)); cand.add(box(0.07, 0.1, 0.07, new THREE.MeshBasicMaterial({ color: 0xffd070 }), 0, 0.36, 0, { cast: false })); sign.add(cand);
  for (let i = 0; i < 8; i++) sign.add(box(0.14, 0.14, 0.14, C([0xe8304a, 0xffffff, 0xf0d040][i % 3]), -1.6 + i * 0.22, 0.07, 1.1 + (i % 2) * 0.2, { cast: false }));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('ANNELIESE MICHEL, 1976', 72, 150, '#a3241c'); fit('GLAUBE DARF NIE', 60, 290, '#3a2a1e'); fit('DEN ARZT ERSETZEN', 60, 385, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 74.03; // hörbares Ende der Sprache (gemessen)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30; // Loop-Pause ≈ Satzpause
const WHIP0 = wt(1), WHIP1 = wt(1) + 0.57;
const CUTS = [[0, 'hero'], [4, 'klingen'], [6, 'student'], [13, 'seizure'], [20, 'visions'], [31, 'family'], [38, 'belief'], [48, 'bishop'], [53, 'church'],
  [60, 'bible'], [68, 'ritual'], [80, 'tools'], [86, 'grand'], [92, 'arrive'], [98, 'count'], [103, 'tape'], [108, 'screams'], [121, 'worse'], [127, 'knees'],
  [136, 'nofood'], [144, 'nodoctor'], [153, 'death'], [158, 'grave'], [169, 'court'], [180, 'verdict'], [186, 'experts'], [194, 'brain'], [203, 'treat'], [209, 'rule'],
  [221, 'world'], [231, 'help'], [240, 'sign'], [248, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
function heroCam(t) { // Preset hook-kranfahrt.json, auf Klingenberg übertragen
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(4.7, 4.2, k)), t0 = V(0.0, 1.25, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-9.0 + drift * 2, 15.0 + drift * 1.2, 16.0 + drift * 2), t1 = V(1.0 + drift, 0.5, -8.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const NAME = { anne: '#ffd23f', exo: '#ff5555', ally: '#55ffff', neutral: '#ffffff' };
const ALL = [town, bedr, bish, kirche, court, clinic, brainS];

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a), id = sh.id;
  let scene = town, exp = 1.35; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null, hunger: null, flash: 0 };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const grey = s => `<span style="color:#aaaaaa">${s}</span>`;

  // ---------- Klingenberg ----------
  if (['hero', 'loop', 'klingen', 'student', 'arrive', 'nodoctor', 'grave', 'world'].includes(id)) {
    scene = town; exp = 1.35; const U = town.userData; const ta = id === 'loop' ? t - DUR : t;
    townMood(id === 'nodoctor' ? 'night' : id === 'world' ? 'dusk' : 'day'); if (id === 'nodoctor') exp = 1.6;
    const { anne, exo, pri2 } = U; anne.visible = exo.visible = pri2.visible = false; U.books.visible = false; U.cross.visible = true; anne.userData.setFace({});
    if (id === 'hero' || id === 'loop' || id === 'klingen') { anne.visible = exo.visible = true;
      anne.position.set(-0.8, 0, 0.7); anne.rotation.set(0, 0.4, 0); pose4(anne, 'idle', ta, 0); anne.userData.setFace({ sad: true });
      exo.position.set(0.85, 0, 0.6); exo.rotation.set(0, -0.45, 0); pose4(exo, 'bless', ta, 1);
      if (id !== 'klingen') { heroCam(ta); tag(anne, 'Anneliese', NAME.anne); tag(exo, 'Exorzist', NAME.exo); } }
    if (id === 'klingen') { mv(u, V(34, 30, -88), V(30, 28, -83), V(-6, 4, -2), V(-8, 4, -2), 46); info(wt(5), 'Klingenberg am Main, 1975'); }
    if (id === 'student') { anne.visible = true; U.books.visible = true; const x = 6 - (t - sh.a) * 1.25; anne.position.set(x, 0.14, 3.0); anne.rotation.set(0, -Math.PI / 2, 0); pose4(anne, 'carry', t); anne.userData.setFace({ smile: true });
      anne.userData.armL.rotation.x = -0.9; cam(V(x - 3.6, 1.75, 6.6), V(x - 0.3, 1.35, 3.0), 46); tag(anne, 'Anneliese', NAME.anne); if (t >= wt(10)) eff(wt(10), 'Studentin', 'Pädagogik', '#ffd23f'); }
    if (id === 'arrive') { exo.visible = pri2.visible = true; const k = t - sh.a; exo.position.set(5.5 - k * 1.1, 0.14, 3.6); pri2.position.set(6.6 - k * 1.1, 0.14, 4.4); exo.rotation.set(0, -Math.PI / 2, 0); pri2.rotation.set(0, -Math.PI / 2, 0); U.cross.visible = false;
      pose4(exo, 'walk', t); pose4(pri2, 'carry', t, 1); pri2.userData.armL.rotation.x = 0; const px = exo.position.x + 0.5; cam(V(px - 3.0 + u * 0.4, 1.8, 8.6 - u * 0.5), V(px, 1.3, 4.0), 46); tag(exo, 'Exorzist', NAME.exo); tag(pri2, 'Priester', NAME.exo); }
    if (id === 'nodoctor') { mv(u, V(6.5, 2.4, 11.5), V(5.8, 2.6, 10.6), V(-0.6, 3.0, -2), V(-0.8, 3.1, -2), 48); chat(wt(148), '<span style="color:#aaaaaa">Kein Arzt wurde gerufen.</span>'); }
    if (id === 'grave') { const g = U.gy.position; mv(u, V(g.x + 3.0, 1.5, g.z + 6.6), V(g.x + 2.7, 1.4, g.z + 6.0), V(g.x + 1.3, 0.7, g.z + 2.6), V(g.x + 1.3, 0.7, g.z + 2.6), 46);
      U.gFlame.scale.y = 1 + Math.sin(t * 13) * 0.2; tip(wt(158), 'cross', 'Anneliese Michel', '#ffd23f', [grey('1952 – 1976'), t >= wt(163) ? '<span style="color:#ff5555">zuletzt nur 30 kg</span>' : grey('23 Jahre alt')]); }
    if (id === 'world') { mv(u, V(-60, 34, 60), V(-54, 31, 54), V(-20, 6, -10), V(-18, 6, -12), 46); info(wt(222), 'Exorzismen gibt es weltweit bis heute'); }
  }
  // ---------- Zimmer ----------
  const bedShots = ['seizure', 'visions', 'meds', 'family', 'belief', 'ritual', 'tools', 'grand', 'count', 'tape', 'screams', 'worse', 'knees', 'nofood', 'death'];
  if (bedShots.includes(id)) {
    scene = bedr; exp = 1.5; const R = bedr.userData; const { anne, exo, pri2, mutter, vater } = R;
    [anne, exo, pri2, mutter, vater].forEach(c => { c.visible = false; c.rotation.set(0, 0, 0); c.userData.setFace({}); }); R.blanket.visible = false; R.plate.visible = id === 'nofood'; R.pills.visible = id === 'meds' || id === 'seizure'; R.fr.forEach(f => f.material.opacity = 0); updateBurst(R.drops, -1); R.spr.visible = true;
    const ritual = ['ritual', 'tools', 'grand', 'count', 'tape', 'screams'].includes(id);
    bedMood(id === 'visions' ? 'night' : ritual ? 'candle' : id === 'worse' || id === 'nofood' || id === 'knees' ? 'dim' : id === 'death' ? 'dusk' : 'day');
    R.flames.forEach((f, i) => { f.visible = ritual || id === 'visions' || id === 'death' || id === 'family' || id === 'knees'; f.scale.y = 1 + Math.sin(t * 11 + i * 2) * 0.25; }); R.cand.intensity *= 1 + Math.sin(t * 9) * 0.06;
    if (id === 'visions' || id === 'family' || id === 'knees') R.cand.intensity = Math.max(R.cand.intensity, 3);
    R.reels.forEach((r, i) => r.rotation.y = -t * (i ? 3.2 : 2.6));
    const inBed = (face) => { anne.visible = true; R.blanket.visible = true; lieOn(anne, -2.5, 0.75, -0.85); anne.userData.setFace(face); };
    if (id === 'seizure') { inBed({ sad: true }); const j = Math.sin(t * 24) * 0.025 * (t > wt(18) ? 1 : 0.2); anne.position.x += j; anne.userData.head.rotation.z = Math.sin(t * 21) * 0.08 * (t > wt(18) ? 1 : 0);
      mv(u, V(-0.6, 2.4, 1.2), V(-0.8, 2.3, 0.9), V(-2.5, 0.8, -2.1), V(-2.5, 0.8, -2.2), 48); tag(anne, 'Anneliese', NAME.anne, -1.0); eff(wt(18), 'Epileptische Anfälle', 'seit 1968', '#ff5555'); }
    if (id === 'visions') { anne.visible = true; anne.position.set(-1.75, 0, -1.6); anne.rotation.set(0, -0.5, 0); pose4(anne, 'flinch', t); sitPose(anne, 0.63); anne.userData.setFace({ sad: true });
      R.fr.forEach((f, i) => f.material.opacity = 0.9 * smoother((t - wt(23) - i * 0.18) / 0.35) * (0.85 + Math.sin(t * 5 + i) * 0.15));
      mv(u, V(1.2, 1.65, 1.4), V(1.0, 1.62, 1.15), V(-1.9, 1.2, -0.9), V(-1.9, 1.2, -0.95), 58); tag(anne, 'Anneliese', NAME.anne);
      chat(wt(25), grey('<i>??? flüstert …</i>')); eff(wt(27), 'Medikamente', 'kaum Wirkung', '#aaaaaa'); }
    if (id === 'meds') { anne.visible = true; anne.position.set(-1.75, 0, -2.4); anne.rotation.set(0, 0.9, 0); pose4(anne, 'sadidle', t); sitPose(anne, 0.63); anne.userData.setFace({ sad: true });
      mv(u, V(0.4, 1.4, -0.9), V(0.2, 1.38, -1.1), V(-1.3, 0.9, -2.8), V(-1.3, 0.9, -2.8), 48); tag(anne, 'Anneliese', NAME.anne); eff(wt(28), 'Medikamente', 'kaum Wirkung', '#aaaaaa'); }
    if (id === 'family' || id === 'belief') { anne.visible = mutter.visible = vater.visible = true;
      anne.position.set(0.25, 0, -1.0); anne.rotation.set(0, 0, 0); pose4(anne, 'kneelpray', t); kneelAt(anne);
      mutter.position.set(-0.65, 0, -1.7); mutter.rotation.set(0, 0.15, 0); pose4(mutter, id === 'belief' ? 'talk' : 'pray', t, 1); vater.position.set(1.15, 0, -1.7); vater.rotation.set(0, -0.15, 0); pose4(vater, id === 'belief' && t >= wt(44) ? 'point' : 'pray', t, 2);
      if (id === 'family') { mv(u, V(0.4, 1.6, 2.9), V(0.4, 1.55, 2.4), V(0.25, 1.1, -1.3), V(0.25, 1.12, -1.3), 52); tag(anne, 'Anneliese', NAME.anne, -0.5); }
      else { mv(u, V(0.75, 2.1, 1.3), V(0.7, 2.05, 1.0), V(0.25, 1.6, -1.7), V(0.25, 1.6, -1.7), 52); say(wt(40), 'Vater', NAME.ally, 'Das ist keine Krankheit …'); say(wt(44), 'Vater', NAME.ally, '… das ist der Teufel.'); }
      tag(mutter, 'Mutter', NAME.ally); tag(vater, 'Vater', NAME.ally); }
    if (['ritual', 'grand', 'count', 'screams'].includes(id)) { inBed({ sad: true }); exo.visible = true; exo.position.set(-1.2, 0, -0.3); exo.rotation.set(0, -2.62, 0); pose4(exo, 'bless', t);
      if (id !== 'ritual') { pri2.visible = true; pri2.position.set(0.2, 0, -0.6); pri2.rotation.set(0, -2.3, 0); pose4(pri2, 'sprinkle', t, 1); }
      if (id === 'ritual') { mv(u, V(0.6, 1.8, -3.0), V(0.5, 1.75, -2.8), V(-1.5, 1.1, -0.8), V(-1.5, 1.1, -0.75), 58); say(wt(73), 'Exorzist', NAME.exo, 'Weiche, im Namen Gottes!'); }
      if (id === 'grand') { mv(u, V(1.2, 2.3, -3.1), V(1.1, 2.25, -2.9), V(-1.0, 1.0, -0.8), V(-1.0, 1.0, -0.8), 60); R.drops.position.set(-1.6, 1.4, -1.6); updateBurst(R.drops, (t - sh.a) % 0.9, 1.6, 0.9);
        tip(wt(90), 'cross', 'Großer Exorzismus', '#ffaa00', [grey('Rituale Romanum, 1614'), grey('nur mit Erlaubnis des Bischofs')]); }
      if (id === 'count') { mv(u, V(1.8, 2.8, -3.0), V(1.7, 2.75, -2.8), V(-1.2, 0.8, -0.9), V(-1.2, 0.8, -0.85), 60); const n = Math.max(1, Math.min(67, Math.round(1 + 66 * smoother((t - wt(101)) / 0.7)))); if (t >= wt(98)) eff(wt(98), 'Sitzungen', `${t >= wt(101) ? n : 1} / 67`, '#ff5555'); if (t >= wt(98)) info(wt(98), 'Sept. 1975 – Juni 1976'); }
      if (id === 'screams') { anne.userData.setFace({ angry: true }); anne.rotation.set(0, 0, 0); anne.position.set(-2.5, 0, -2.5); pose4(anne, 'scream', t); sitPose(anne, 0.63);
        exo.position.set(-0.9, 0, -2.2); exo.rotation.set(0, -1.0, 0); pri2.visible = false; pose4(exo, t >= wt(115) ? 'bless' : 'flinch', t); mv(u, V(-1.2, 1.7, 0.9), V(-1.3, 1.68, 0.6), V(-2.2, 1.2, -2.2), V(-2.2, 1.2, -2.2), 54);
        say(wt(110), 'Anneliese', NAME.anne, '<span style="color:#aa5555">*schreit mit fremder Stimme*</span>'); if (t >= wt(115)) say(wt(117), 'Exorzist', NAME.exo, 'Das ist der Beweis!'); }
      tag(exo, 'Exorzist', NAME.exo); if (pri2.visible) tag(pri2, 'Priester', NAME.exo); if (id !== 'screams') tag(anne, 'Anneliese', NAME.anne, -1.0); }
    if (id === 'tools') { mv(u, V(-0.1, 1.65, 1.7), V(-0.2, 1.58, 1.45), V(-0.85, 0.72, 0.5), V(-0.85, 0.72, 0.5), 46); R.bowl.position.y = 0.7; }
    if (id === 'tape') { mv(u, V(-0.2, 1.45, 1.75), V(-0.3, 1.4, 1.5), V(-0.95, 0.8, 0.4), V(-0.95, 0.8, 0.4), 46); exo.visible = true; exo.position.set(-1.6, 0, -0.6); exo.rotation.set(0, 0.6, 0); pose4(exo, 'bless', t); info(wt(106), 'rund 40 Tonbänder'); }
    if (id === 'worse' || id === 'nofood') { inBed({ sad: true });
      if (id === 'worse') { mv(u, V(-1.3, 2.7, 0.6), V(-1.5, 2.55, 0.3), V(-2.5, 0.8, -2.3), V(-2.5, 0.8, -2.4), 46); tag(anne, 'Anneliese', NAME.anne, -1.0); }
      else { mv(u, V(0.2, 1.5, -1.6), V(0.1, 1.45, -1.8), V(-1.7, 0.75, -2.75), V(-1.7, 0.75, -2.75), 56); eff(wt(136), 'Hunger', '∞', '#ff5555'); ui.hunger = t >= wt(140) ? 0 : 3; } }
    if (id === 'knees') { anne.visible = true; anne.position.set(0.6, 0, -1.6); anne.rotation.set(0, 2.78, 0); const dn = Math.abs(Math.sin((t - sh.a) * 3.2)); pose4(anne, 'pray', t); anne.userData.setFace({ sad: true });
      const P = anne.userData; P.legL.rotation.x = P.legR.rotation.x = 1.45 * dn; anne.position.y = -0.54 * P.s * dn;
      mv(u, V(3.1, 1.5, -3.1), V(3.0, 1.45, -2.9), V(0.6, 0.8, -1.6), V(0.6, 0.8, -1.6), 58); tag(anne, 'Anneliese', NAME.anne); eff(wt(133), 'Knie verletzt', '', '#ff5555'); }
    if (id === 'death') { mv(u, V(0.4, 1.8, 1.6), V(0.2, 1.75, 1.3), V(-2.5, 0.8, -2.2), V(-2.5, 0.8, -2.3), 46); R.cand.intensity = 2.2; info(wt(155), '1. Juli 1976'); }
  }
  // ---------- Bischof ----------
  if (id === 'bishop') { scene = bish; exp = 1.45; const B = bish.userData.b; B.position.set(0, 0, -1.45); B.rotation.set(0, 0, 0); pose4(B, 'write', t); sitPose(B, 0.62);
    mv(u, V(1.6, 1.75, 2.2), V(1.4, 1.7, 1.8), V(0, 1.3, -1.0), V(0, 1.3, -1.0), 48); tag(B, 'Bischof', NAME.neutral); if (t >= wt(50)) info(wt(50), 'Erlaubnis zum Exorzismus erteilt'); }
  // ---------- Kirche ----------
  if (id === 'church' || id === 'bible') { scene = kirche; exp = 1.5;
    if (id === 'church') { mv(u, V(0.8, 3.4, 9.5), V(0.6, 3.2, 7.0), V(0, 2.8, -10), V(0, 2.8, -10), 50);
      tip(wt(56), 'cross', 'Exorzismus', '#ffaa00', [grey('griechisch: „beschwören“'), grey('Austreibung böser Geister')]); }
    else { const a = kirche.userData.ambo.position; mv(u, V(a.x - 1.1, 2.2, a.z + 1.6), V(a.x - 0.9, 2.1, a.z + 1.25), V(a.x, 1.35, a.z), V(a.x, 1.38, a.z), 46); } }
  // ---------- Gericht ----------
  if (id === 'court' || id === 'verdict') { scene = court; exp = 1.45; const { j, def } = court.userData;
    j.position.set(0, 0.5, -3.5); j.rotation.set(0, 0, 0); pose4(j, id === 'verdict' && t >= wt(181) ? 'hammer' : 'idle', t); sitPose(j, 1.35);
    def.forEach((d, i) => { d.position.set(-3.0, 0.5, -1.0 + i * 1.0); d.rotation.set(0, Math.PI / 2, 0); pose4(d, 'sadidle', t, i); sitPose(d, 0.5); d.userData.setFace({ sad: true }); });
    if (id === 'court') { mv(u, V(3.6, 2.4, 4.2), V(3.3, 2.3, 3.8), V(-1.2, 1.3, -1.0), V(-1.2, 1.3, -1.0), 62); info(wt(170), 'Landgericht Aschaffenburg, 1978'); tag(def[0], 'Mutter', NAME.ally); tag(def[1], 'Vater', NAME.ally); tag(def[2], 'Exorzist', NAME.exo); tag(def[3], 'Priester', NAME.exo); }
    else { mv(u, V(0.9, 2.6, -0.4), V(0.8, 2.55, -0.8), V(0, 2.9, -3.4), V(0, 2.9, -3.4), 48); tag(j, 'Richter', NAME.neutral);
      chat(wt(180), '<span style="color:#ff5555">[Urteil]</span> Fahrlässige Tötung'); chat(wt(182), '<span style="color:#ff5555">[Urteil]</span> 6 Monate auf Bewährung'); } }
  // ---------- Klinik ----------
  if (['experts', 'treat', 'rule', 'help'].includes(id)) { scene = clinic; exp = 1.35; const K = clinic.userData; const { doc, doc2, anne, junge, bis } = K;
    [doc, doc2, anne, junge, bis].forEach(c => { c.visible = false; c.rotation.set(0, 0, 0); }); K.drawEEG(t, id === 'experts');
    if (id === 'experts') { doc.visible = true; doc.position.set(-0.3, 0, -1.6); doc.rotation.set(0, -0.35, 0); pose4(doc, t >= wt(188) ? 'talk' : 'point', t); doc.rotation.y = t >= wt(188) ? 0.35 : -0.9;
      mv(u, V(0.9, 1.8, 1.8), V(0.7, 1.75, 1.4), V(-0.9, 1.35, -1.9), V(-0.9, 1.35, -1.9), 48); tag(doc, 'Gutachter', NAME.ally); say(wt(190), 'Gutachter', NAME.ally, 'Krank – nicht besessen.'); }
    if (id === 'treat') { anne.visible = doc2.visible = true; anne.position.set(2.0, 0, -1.4); anne.rotation.set(0, -0.8, 0); pose4(anne, 'idle', t); anne.userData.setFace({ smile: true });
      doc2.position.set(0.4, 0, -0.9); doc2.rotation.set(0, 0.9, 0); pose4(doc2, 'talk', t, 1); mv(u, V(1.0, 1.75, 2.6), V(1.1, 1.7, 2.2), V(1.2, 1.3, -1.2), V(1.2, 1.3, -1.2), 48);
      tag(anne, 'Anneliese', NAME.anne); tag(doc2, 'Ärztin', NAME.ally); eff(wt(204), 'Behandlung', 'wirkt', '#55ff55'); chat(wt(206), grey('<i>So hätte es sein können.</i>')); }
    if (id === 'rule') { doc.visible = bis.visible = true; doc.position.set(0.85, 0, -1.2); doc.rotation.set(0, -1.0, 0); bis.position.set(-0.4, 0, -1.2); bis.rotation.set(0, 1.0, 0); pose4(doc, 'shake', t); pose4(bis, 'shake', t, 1);
      mv(u, V(0.3, 1.8, 2.4), V(0.25, 1.75, 2.0), V(0.2, 1.4, -1.2), V(0.2, 1.4, -1.2), 48); tag(doc, 'Arzt', NAME.ally); tag(bis, 'Kirche', NAME.neutral);
      tip(wt(212), 'cross', 'Regel seit 1999', '#55ffff', [grey('Zuerst Ärzte und Psychiater:'), grey('Ist der Mensch krank?')]); }
    if (id === 'help') { junge.visible = doc2.visible = true; junge.position.set(-0.6, 0, -0.6); junge.rotation.set(0, 0.9, 0); pose4(junge, 'talk', t); junge.userData.setFace({ sad: true });
      doc2.position.set(1.0, 0, -1.2); doc2.rotation.set(0, -0.9, 0); pose4(doc2, 'idle', t, 1); doc2.userData.setFace({ smile: true }); mv(u, V(0.3, 1.75, 2.6), V(0.3, 1.7, 2.1), V(0.2, 1.35, -1.0), V(0.2, 1.35, -1.0), 48);
      tag(doc2, 'Ärztin', NAME.ally); chat(wt(237), '<span style="color:#55ff55">[Hilfe]</span> Hausarzt · Psychiatrie · Notruf 112'); } }
  // ---------- Gehirn ----------
  if (id === 'brain') { scene = brainS; exp = 1.3; const Bn = brainS.userData; Bn.g.rotation.y = 0.5 + (t - sh.a) * 0.35;
    let on = 0; Bn.bolts.forEach((b, i) => { const v = Math.sin(t * 7 + i * 2.3) > 0.55; b.visible = v; on += v; }); Bn.pl.intensity = on * 1.5;
    mv(u, V(0, 1.6, 10.5), V(0, 1.5, 9.2), V(0, 0.3, 0), V(0, 0.3, 0), 46);
    tip(wt(194), 'brain', 'Epilepsie + Psychose', '#ff55ff', [grey('können Anfälle, Stimmen'), grey('und Fratzen auslösen')]); }
  if (id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 2.4, 13.5), V(0, 2.5, 12.0), V(0, 0.9, 0), V(0, 0.95, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  cross: '<rect x="3" y="0" width="2" height="8" fill="#d8a830"/><rect x="1" y="2" width="6" height="2" fill="#d8a830"/><rect x="3" y="0" width="1" height="8" fill="#f0d070"/>',
  brain: '<rect x="1" y="2" width="6" height="4" fill="#e89aa8"/><rect x="2" y="1" width="4" height="1" fill="#e89aa8"/><rect x="4" y="1" width="1" height="5" fill="#b86a7a"/><rect x="2" y="3" width="1" height="1" fill="#ffe84a"/><rect x="5" y="4" width="1" height="1" fill="#ffe84a"/><rect x="3" y="6" width="2" height="1" fill="#d88a9a"/>',
  heart: '<rect x="1" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="5" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="1" y="3" width="6" height="2" fill="#ff4a6a"/><rect x="2" y="5" width="4" height="1" fill="#ff4a6a"/><rect x="3" y="6" width="2" height="1" fill="#ff4a6a"/>',
};
const DRUM = c => `<rect x="4" y="1" width="3" height="3" fill="${c}"/><rect x="3" y="2" width="3" height="3" fill="${c}"/><rect x="2" y="4" width="2" height="2" fill="#e8e0d0"/><rect x="1" y="6" width="2" height="1" fill="#e8e0d0"/>`;
const NUM = { 'neunzehnhundertfünfundsiebzig': '1975', 'neunzehnhundertsechsundsiebzig': '1976', 'zweiundzwanzig': '22', 'dreiundzwanzig': '23', 'siebenundsechzig': '67', 'dreißig': '30', 'Zehn': '10', 'sechs': '6' };
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const m = txt.match(/^(.*?)([.,:;!?]*)$/); if (NUM[m[1]]) txt = NUM[m[1]] + m[2];
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.slice(-5).join('<br>');
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#2a2a2a"/><rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/></svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div>${ui.eff.time ? `<div style="color:#aaaaaa">${ui.eff.time}</div>` : ''}</div></div>`;
  if (ui.hunger != null) { let h = ''; for (let i = 0; i < 10; i++) h += `<svg width="44" height="44" viewBox="0 0 8 8" shape-rendering="crispEdges">${DRUM(i < ui.hunger ? '#c8702a' : '#3a2a1a')}</svg>`; ex += `<div class="hp">${h}</div>`; }
  if (ui.flash > 0) ex += `<div class="flash" style="opacity:${ui.flash}"></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
window.SHOTS = SHOTS;
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
