// „Kapitalismus, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
  eng.userData.r = r;
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

// =====================================================================
// Zusätzliche Texturen / Requisiten
// =====================================================================
const T2 = {
  emerald: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x2ac46a, 0.1); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x8af0b0); px(c, 0, i, 0x8af0b0); px(c, i, 15, 0x14703a); px(c, 15, i, 0x14703a); } for (const [x, y] of [[4, 4], [11, 5], [6, 10], [10, 11]]) px(c, x, y, 0xc8ffd8); }, 2601),
  coal: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x3a3836, 0.12); for (let i = 0; i < 9; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); c.fillStyle = '#121010'; c.fillRect(x, y, 2, 1); } }, 2602),
  stoneHouse: tileTex(0x8e8984, 0x5e5a56, 2603), slate: tileTex(0x3e4248, 0x2a2c30, 2604, false),
  glass: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const f = x % 8 === 0 || y % 8 === 0; px(c, x, y, f ? 0x5a6470 : shade(0x7aa8d0, 0.85 + r() * 0.25)); } }, 2605),
  marble: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe4e0d6, 0.04), 2606),
  sandstone: tileTex(0xd8c8a0, 0xb0a07c, 2607),
  officeWin: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const f = x % 4 === 0 || y % 4 === 0; px(c, x, y, f ? 0x3a3a3e : (r() < 0.25 ? 0xe8d8a0 : 0x4a5868)); } }, 2608),
  de: tex(15, 9, (c) => { c.fillStyle = '#111'; c.fillRect(0, 0, 15, 3); c.fillStyle = '#d0201a'; c.fillRect(0, 3, 15, 3); c.fillStyle = '#ffce00'; c.fillRect(0, 6, 15, 3); }, 2609),
  banner: tex(12, 16, (c) => { c.fillStyle = '#ece4d0'; c.fillRect(0, 0, 12, 16); c.fillStyle = '#2a4a8a'; c.fillRect(0, 0, 12, 3); c.fillRect(0, 13, 12, 3); c.fillStyle = '#3a3a3a'; c.fillRect(3, 6, 6, 1); c.fillRect(2, 8, 8, 1); c.fillRect(4, 10, 4, 1); }, 2610),
};
const goldM = M(T.gold, { metal: 0.55, rough: 0.35 });
const goldGlow = M(T.gold, { metal: 0.5, rough: 0.3, emissive: 0x6a4400, ei: 0.35 });
const emeraldM = M(T2.emerald, { rough: 0.3, metal: 0.1, emissive: 0x0a3a1a, ei: 0.4 });
const breadMesh = () => { const g = new THREE.Group(); g.add(box(0.34, 0.14, 0.18, C(0xc8823a), 0, 0, 0.12)); g.add(box(0.28, 0.04, 0.14, C(0xe0a050), 0, 0.08, 0.12, { cast: false })); return g; };
const ingotMesh = () => { const g = new THREE.Group(); g.add(box(0.3, 0.12, 0.16, goldGlow, 0, 0, 0.14)); return g; };
const pickMesh = () => { const g = new THREE.Group(); g.add(box(0.06, 0.06, 0.8, C(0x6a4a2a), 0, 0, 0.25)); const hm = C(0x8a9098, { metal: 0.6, rough: 0.4 }); g.add(box(0.07, 0.12, 0.12, hm, 0, 0, 0.62)); g.add(box(0.07, 0.1, 0.1, hm, 0, 0.12, 0.6)); g.add(box(0.07, 0.1, 0.1, hm, 0, -0.12, 0.6)); g.add(box(0.07, 0.1, 0.1, hm, 0, 0.22, 0.54)); g.add(box(0.07, 0.1, 0.1, hm, 0, -0.22, 0.54)); return g; };
const bagMesh = (col) => { const g = new THREE.Group(); g.add(box(0.3, 0.34, 0.12, C(col), 0, -0.2, 0.05)); return g; };
const backpack = (ch, col) => ch.userData.body.add(box(0.4, 0.46, 0.18, C(col), 0, 1.1, -0.22));
function chefHat(ch) { const m = C(0xf6f4ee); ch.userData.head.add(box(0.54, 0.1, 0.54, m, 0, 0.55, 0)); ch.userData.head.add(box(0.46, 0.3, 0.46, m, 0, 0.75, 0)); ch.userData.hatExtra = 0.4; }
function fedora(ch, col) { const m = C(col); ch.userData.head.add(box(0.66, 0.04, 0.66, m, 0, 0.52, 0)); ch.userData.head.add(box(0.48, 0.2, 0.48, m, 0, 0.62, 0)); ch.userData.head.add(box(0.49, 0.05, 0.49, C(0x1a1a1a), 0, 0.56, 0)); ch.userData.hatExtra = 0.22; }
function goldStack(parent, x, z, w, d, h, mat = goldM, s = 0.9) { const g = new THREE.Group(); g.position.set(x, 0, z); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w - yy; xx++) for (let zz = 0; zz < d - yy; zz++) g.add(box(s, s, s, mat, (xx - (w - yy - 1) / 2) * s, s / 2 + yy * s, (zz - (d - yy - 1) / 2) * s)); parent.add(g); return g; }
function stall(parent, x, z, awn, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(2.4, 0.9, 0.9, M(T.planks), 0, 0.45, 0.35)); for (const xx of [-1.15, 1.15]) for (const zz of [0.75, -0.7]) g.add(box(0.12, 2.6, 0.12, C(0x6a4a2a), xx, 1.3, zz));
  for (let i = 0; i < 5; i++) g.add(box(0.5, 0.1, 1.8, C(i % 2 ? awn : 0xf2ede0), -1.0 + i * 0.5, 2.62, 0.05)); parent.add(g); return g; }
const KAP = { skin: 0xf0c0a0, hair: 0x2a2a2a, beard: 'mustache', top: 0x141418, bottom: 0x1a1a1e, coat: true, hat: 'top', tie: 0xf0c030, smile: true, eye: '#3a5a7a', seed: 130 };
const ARB = { skin: 0xd8a882, hair: 0x5a3a20, top: 0x3a5a8a, bottom: 0x2e3a52, belt: 0x5a3a20, hat: 'cap', hatCol: 0x6a4a2a, eye: '#3a2a1a', seed: 131 };
const SMITH = { skin: 0xf0c8a8, hair: 0xe8e4dc, hairVol: true, top: 0x5a3a2a, bottom: 0x3a2a20, coat: true, tie: 0xf4f0e8, eye: '#4a5a7a', smile: true, seed: 132 };
const BAKER = { skin: 0xf0c4a2, hair: 0x8a5a2a, beard: 'short', top: 0xf4f0e8, bottom: 0x6a5a48, belt: 0xd8d0c0, smile: true, eye: '#3a2a1a', seed: 133 };
const skins = [0xe8b894, 0xf0c4a2, 0xd8a882, 0xc89a72, 0x8a5a3a, 0xe0a882], hairs = [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a, 0x8a5a2a, 0xa8a8a8];
const folk = (i, o = {}) => humanoid({ skin: skins[i % 6], hair: hairs[(i * 5) % 6], top: [0x6a4a3a, 0x3a5a6a, 0x7a6a4a, 0x4a5a3a, 0x8a3a3a, 0x5a4a6a][(i * 7) % 6], bottom: [0x3a3a3a, 0x4a3e32, 0x2e3446][i % 3], longHair: i % 3 === 1, skirt: i % 3 === 1, seed: 2700 + i, ...o });

// =====================================================================
// SET H: Hook – Platz vor der Fabrik, goldene Stunde
// =====================================================================
const hero = new THREE.Scene();
{
  skyDome(hero, 0x2a54a8, 0x86acdc, 0xffc48a, V(0.7, 0.16, 0.6), [1, 0.8, 0.55]); hero.fog = new THREE.Fog(0xf2c8a0, 90, 420); clouds(hero, 5, 0xfff0e0, 60, 22, 220, 0.85);
  hero.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  hero.add(box(16, 0.06, 44, M(T.cobble), 0, 0.03, -15, { cast: false, uvScale: 1 }));
  const r = rng(2620), bricks = [M(T.brick), M(T.brickDark)], winL = M(T.window, { emissive: 0xffa040, ei: 1.0 });
  // Fabrik
  const fx = new THREE.Group(); fx.position.set(1.5, 0, -40); hero.add(fx);
  fx.add(box(22, 9, 10, bricks[0], 0, 4.5, 0)); for (let s = 0; s < 5; s++) fx.add(box(4.4, 1.6, 10.4, M(T.roof), -8.8 + s * 4.4, 9.8, 0));
  for (let x = -9; x <= 9; x += 2.6) for (const y of [2.4, 6.0]) if (Math.abs(x) > 1.5 || y > 4) fx.add(box(1.4, 1.8, 0.1, winL, x, y, 5.03, { cast: false }));
  fx.add(box(3.0, 3.6, 0.12, C(0x3a2a1e), 0, 1.8, 5.05, { cast: false })); fx.add(box(3.6, 0.4, 0.3, C(0x2a2a2e), 0, 3.8, 5.1));
  const smokes = [];
  for (const [cx, h] of [[-7.5, 22], [6.5, 25]]) { fx.add(box(1.8, h, 1.8, bricks[1], cx, h / 2, -2)); fx.add(box(2.2, 0.6, 2.2, C(0x3a2a22), cx, h + 0.3, -2)); smokes.push(smoke(hero, 1.5 + cx, h + 0.6, -42, 14, 77 + h, 0x8a8078)); }
  // Dampfmaschine draußen
  const eng2 = new THREE.Group(); eng2.position.set(12, 0, -12); hero.add(eng2); const met = M(T.metal, { metal: 0.4, rough: 0.5 });
  eng2.add(box(3.2, 1.8, 1.8, met, 0, 0.9, 0)); eng2.add(box(1.0, 3.0, 1.0, met, -1.2, 1.5, 0)); eng2.add(box(1.4, 1.4, 0.2, C(0x5a3a22), 1.2, 1.6, 1.0));
  // Häuser rechts/links
  for (let i = 0; i < 6; i++) for (const side of [-1, 1]) { const h = 5 + r() * 3, x = side * (16 + (i % 2) * 2), z = 6 - i * 7; const g = new THREE.Group(); g.position.set(x, 0, z); hero.add(g);
    g.add(box(6, h, 6, [M(T.brick), M(T.brickGrey), C(0xd8c8a8)][i % 3], 0, h / 2, 0)); for (let s = 0; s < 3; s++) g.add(box(6.4 - s * 2, 0.9, 6.4, M(T.roofRed), 0, h + 0.45 + s * 0.9, 0));
    for (const wz of [-1.5, 1.5]) g.add(box(0.1, 1.2, 1.0, r() < 0.5 ? winL : M(T.windowDark), -side * 3.02, h * 0.6, wz, { cast: false })); }
  // Feld links
  hero.add(box(14, 0.3, 12, M(T.wheat), -16, 0.15, -14, { cast: false }));
  // Gold (Kapital) links, Kohle (Arbeit) rechts
  const pile = goldStack(hero, -1.75, -2.0, 3, 2, 3, goldGlow); hero.add(box(0.9, 0.9, 0.9, emeraldM, -0.4, 0.45, -3.0));
  const pileR = new THREE.Group(); hero.add(pileR); for (const [x, y, z] of [[1.7, 0.45, -2.4], [2.6, 0.45, -2.4], [2.15, 1.35, -2.4], [2.6, 0.45, -3.3], [1.7, 0.45, -3.3]]) pileR.add(box(0.9, 0.9, 0.9, M(T2.coal), x, y, z));
  { const cr = rng(2625); for (let i = 0; i < 9; i++) hero.add(box(0.16, 0.04, 0.16, goldGlow, -1.9 + cr() * 1.6, 0.08, 0.7 + cr() * 1.6, { cast: false })); }
  // Investition: Kiste mit Goldbarren
  const crate = new THREE.Group(); crate.position.set(-3.2, 0, -9.0); hero.add(crate); crate.add(box(0.9, 0.7, 0.7, M(T.planks), 0, 0.35, 0)); const ingC = []; for (let i = 0; i < 6; i++) { const m = box(0.3, 0.12, 0.16, goldGlow, -0.25 + (i % 3) * 0.25, 0.76 + Math.floor(i / 3) * 0.12, 0); crate.add(m); ingC.push(m); }
  const riskPile = goldStack(hero, -6.0, -10.4, 3, 2, 2, goldGlow);
  sunLight(hero, 0xffcf96, 3.6, V(22, 26, 55), V(0, 0, -8), 50, 2048); hero.add(new THREE.HemisphereLight(0xbcd2ff, 0x7a6248, 1.35));
  const kap = humanoid(KAP), arb = humanoid(ARB); kap.userData.hatExtra = 0.45; arb.userData.hatExtra = 0.12;
  const ingot = inHand(kap, ingotMesh()), pick = inHand(arb, pickMesh()); pick.rotation.x = 0.0;
  const kap2 = humanoid(KAP); kap2.userData.hatExtra = 0.45; const ing2 = inHand(kap2, ingotMesh());
  const arb2 = humanoid({ ...ARB, seed: 134 }); const ing3 = inHand(arb2, ingotMesh());
  hero.add(kap, arb, kap2, arb2);
  const poof = particlesBurst(hero, 30, [0xffffff, 0xd8d8d8, 0xb8b8b8], 2630, 0.16); poof.position.set(-6.0, 1.0, -10.4);
  hero.userData = { smokes, kap, arb, kap2, arb2, ingot, pick, ing2, ing3, pile, riskPile, crate, ingC, poof };
}

// =====================================================================
// SET S: Schottland 1776 – Steinstadt, Burg, Nadelwerkstatt, Markt
// =====================================================================
const scot = new THREE.Scene();
{
  skyDome(scot, 0x3e6cb0, 0x92b2d6, 0xdfe6ea, V(-0.5, 0.45, 0.5)); scot.fog = new THREE.Fog(0xd6dee6, 80, 380); clouds(scot, 12, 0xffffff, 55, 30, 220, 0.9);
  scot.add(box(800, 1, 800, M(T.grass), 0, -0.5, 0, { cast: false }));
  scot.add(box(140, 0.06, 7, M(T.cobble), 0, 0.03, 4, { cast: false })); scot.add(box(22, 0.06, 18, M(T.cobble), -22, 0.03, 0, { cast: false }));
  const sh = M(T2.stoneHouse), sl = M(T2.slate), r = rng(2640), wd = M(T.windowDark), wl = M(T.window, { emissive: 0xffa040, ei: 0.6 });
  const house = (x, z, w, h, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scot.add(g); g.add(box(w, h, 5, sh, 0, h / 2, 0)); for (let s = 0; s < 3; s++) g.add(box(w + 0.3, 0.9, 5.4 - s * 1.8, sl, 0, h + 0.45 + s * 0.9, 0));
    g.add(box(1.0, 3, 1.0, sh, w / 2 - 0.8, h + 1.5, 0)); for (let wx = -w / 2 + 1.2; wx < w / 2 - 0.6; wx += 1.8) for (const wy of [1.6, 4.2]) if (wy < h - 0.6) g.add(box(0.9, 1.2, 0.1, r() < 0.3 ? wl : wd, wx, wy, 2.52, { cast: false })); g.add(box(1.0, 2.0, 0.1, C(0x3a2416), -w / 2 + 1.0, 1.0, 2.53, { cast: false })); };
  for (let i = 0; i < 12; i++) { const x = -60 + i * 10 + r() * 2; if (Math.abs(x - 18) < 7 || Math.abs(x + 22) < 11) continue; house(x, -4, 7 + r() * 2, 6 + r() * 3, 0); }
  for (let i = 0; i < 12; i++) { const x = -60 + i * 10 + r() * 2; if (Math.abs(x + 22) < 11) continue; house(x, 12, 7 + r() * 2, 6 + r() * 3, Math.PI); }
  // Burg auf dem Felsen
  const rock = C(0x6a6a62), rockD = C(0x56564e); const cs = new THREE.Group(); cs.position.set(8, 0, -90); scot.add(cs);
  for (let i = 0; i < 6; i++) cs.add(box(60 - i * 8, 5, 30 - i * 3.5, i % 2 ? rock : rockD, (i % 3 - 1) * 2, 2.5 + i * 5, 0));
  const ct = M(T2.stoneHouse); cs.add(box(26, 9, 12, ct, 0, 34.5, 0)); for (const x of [-12, 12]) { cs.add(box(5, 16, 5, ct, x, 38, 2)); for (let k = -2; k <= 2; k += 2) cs.add(box(1, 1, 1, ct, x + k, 46.5, 4.5)); }
  for (let k = -12; k <= 12; k += 2) cs.add(box(1, 1, 1, ct, k, 39.5, 6)); cs.add(box(0.2, 5, 0.2, C(0x6a6a6a), 12, 48.5, 2));
  // Hügel
  for (const [x, z, w, h] of [[-90, -80, 60, 14], [90, -70, 70, 18], [-40, -120, 80, 22], [60, -130, 90, 26]]) scot.add(box(w, h, 30, C(0x5f7d3c), x, h / 2, z, { cast: false }));
  // Nadelwerkstatt (offene Front zur Straße, +z)
  const ws = new THREE.Group(); ws.position.set(18, 0, -2); scot.add(ws);
  ws.add(box(11, 0.2, 5, M(T.planks), 0, 0.1, 0, { cast: false })); ws.add(box(11, 3.4, 0.3, sh, 0, 1.7, -2.5)); ws.add(box(0.3, 3.4, 5, sh, -5.5, 1.7, 0)); ws.add(box(0.3, 3.4, 5, sh, 5.5, 1.7, 0));
  for (let s = 0; s < 3; s++) ws.add(box(11.4, 0.9, 5.4 - s * 1.8, sl, 0, 3.85 + s * 0.9, 0)); ws.add(box(11.4, 0.3, 5.6, C(0x4a3a2a), 0, 3.5, 0.1, { cast: false }));
  ws.add(box(9.6, 0.1, 0.9, M(T.darkwood), 0, 0.9, 0.0)); for (const x of [-4.6, 0, 4.6]) ws.add(box(0.15, 0.85, 0.8, M(T.darkwood), x, 0.45, 0));
  const pinM = C(0xc8ccd4, { metal: 0.7, rough: 0.3 }), wireM = C(0xb08a50, { metal: 0.6, rough: 0.4 });
  const workers = [], pins = [];
  for (let i = 0; i < 10; i++) { const x = -4.05 + i * 0.9; const w = humanoid({ skin: skins[i % 6], hair: hairs[(i * 5) % 6], top: [0x6a4a3a, 0x4a5a6a, 0x7a6a4a, 0x5a4a3a][i % 4], bottom: 0x3a3a3a, hat: i % 3 === 0 ? 'cap' : undefined, seed: 2650 + i });
    w.position.set(x, 0.2, -0.75); ws.add(w); workers.push(w);
    if (i === 0) ws.add(box(0.4, 0.2, 0.4, wireM, x, 1.05, 0.05)); else for (let k = 0; k < 4; k++) { const p = box(0.24, 0.025, 0.025, pinM, x - 0.15 + (k % 2) * 0.12, 0.97, -0.1 + k * 0.1, { cast: false }); ws.add(p); pins.push(p); } }
  const binG = new THREE.Group(); binG.position.set(4.8, 0.95, 0.1); ws.add(binG); binG.add(box(0.7, 0.4, 0.6, M(T.planks), 0, 0.2, 0)); const binFill = box(0.6, 0.05, 0.5, pinM, 0, 0.05, 0, { cast: false }); binG.add(binFill);
  // Einzelner Handwerker (eigene kleine Werkbank)
  const solo = humanoid({ skin: 0xe8b894, hair: 0x6a4422, top: 0x6a5a48, bottom: 0x3a3a3a, beard: 'short', seed: 2670 }); scot.add(solo);
  const sb = new THREE.Group(); sb.position.set(31, 0, 2.5); scot.add(sb); sb.add(box(1.6, 0.1, 0.8, M(T.darkwood), 0, 0.9, 0)); for (const x of [-0.7, 0.7]) sb.add(box(0.12, 0.88, 0.7, M(T.darkwood), x, 0.44, 0)); sb.add(box(0.36, 0.18, 0.36, wireM, -0.45, 1.04, 0)); sb.add(box(0.24, 0.025, 0.025, pinM, 0.25, 0.97, 0.1, { cast: false }));
  sb.add(box(0.5, 0.5, 0.5, M(T.planks), 0.5, 0.25, 1.3)); scot.add(box(2.6, 3.0, 0.3, sh, 31, 1.5, 1.6));
  // Markt
  const mk = new THREE.Group(); mk.position.set(-22, 0, 0); scot.add(mk);
  const stB = stall(mk, 0, -3, 0xc8822a); const stM = stall(mk, -4.5, -2.4, 0xb8302a, 0.25), stR = stall(mk, 4.5, -2.4, 0x3a6a2a, -0.25); const brewBarrels = [];
  const breads = []; for (let i = 0; i < 8; i++) { const b = breadMesh(); b.position.set(-0.9 + (i % 4) * 0.42, 0.97, -2.75 + Math.floor(i / 4) * 0.28); mk.add(b); breads.push(b); }
  for (let i = 0; i < 4; i++) mk.add(box(0.36, 0.2, 0.36, C(0xb04a40), -5.4 + i * 0.5, 1.0, -2.2));
  for (let i = 0; i < 3; i++) { const b = box(0.5, 0.7, 0.5, M(T.darkwood), 3.8 + i * 0.6, 1.25, -2.0); mk.add(b); brewBarrels.push(b); }
  const extra = []; for (const [x, z, ry, col] of [[-6.5, 5.5, Math.PI - 0.3, 0xc8822a], [0, 7.2, Math.PI, 0xd89a3a], [6.5, 5.5, Math.PI + 0.3, 0xb8742a]]) { const s = stall(mk, x, z, col, ry); for (let i = 0; i < 4; i++) { const b = breadMesh(); b.position.set(-0.6 + i * 0.4, 0.97, 0.3); s.add(b); } extra.push(s); }
  const baker = humanoid(BAKER); chefHat(baker); const bread = inHand(baker, breadMesh());
  const baker2 = humanoid({ ...BAKER, beard: undefined, hair: 0x2a1a14, seed: 135 }); chefHat(baker2);
  const xb = [0, 1, 2].map(i => { const p = humanoid({ ...BAKER, hair: hairs[i + 1], beard: i === 1 ? 'mustache' : undefined, seed: 136 + i }); chefHat(p); scot.add(p); return p; });
  const butcher = humanoid({ skin: 0xe8b894, hair: 0x3a2a1a, beard: 'full', top: 0xe8e2d8, bottom: 0x5a3a2a, belt: 0x9a2a2a, seed: 140 }), brewer = humanoid({ skin: 0xf0c4a2, hair: 0xb8925a, top: 0x5a6a3a, bottom: 0x4a3a2a, hat: 'cap', seed: 141 });
  const smith = humanoid(SMITH); const cust = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const p = folk(i, { smile: true }); mk.add(p); p.userData.bread = inHand(p, breadMesh()); return p; });
  cust.forEach(p => { mk.remove(p); scot.add(p); }); scot.add(baker, baker2, butcher, brewer); scot.add(smith);
  sunLight(scot, 0xfff0d8, 3.2, V(-40, 55, 50), V(0, 0, 0), 60); scot.add(new THREE.HemisphereLight(0xcfdcf0, 0x6a7a4a, 1.5));
  scot.userData = { stR, brewBarrels, ws, workers, pins, binFill, solo, sb, mk, breads, extra, baker, bread, baker2, xb, butcher, brewer, smith, cust };
}

// =====================================================================
// SET N: New York 1929 – Börse, Schlange vor der Suppenküche
// =====================================================================
const ny = new THREE.Scene();
{
  skyDome(ny, 0x4a5262, 0x7a8290, 0xa8acb2); ny.fog = new THREE.Fog(0x9a9ea6, 40, 260);
  ny.add(box(600, 1, 600, M(T.concrete), 0, -0.5, 0, { cast: false, uvScale: 0.5 })); ny.add(box(400, 0.05, 10, C(0x3a3a3e), 0, 0.03, 8, { cast: false }));
  const mar = M(T2.marble); const ex = new THREE.Group(); ex.position.set(0, 0, -12); ny.add(ex);
  ex.add(box(24, 14, 10, mar, 0, 7, -2)); for (let s = 0; s < 4; s++) ex.add(box(26 - s, 0.4, 3.0, mar, 0, 0.2 + s * 0.4, 4.5 + s * -0.4));
  for (let x = -9; x <= 9; x += 3.6) ex.add(box(1.2, 9, 1.2, mar, x, 6.1, 4.0)); ex.add(box(22, 1.2, 2.4, mar, 0, 11.2, 4.0)); for (let s = 0; s < 4; s++) ex.add(box(20 - s * 5, 0.8, 2.2, mar, 0, 12.2 + s * 0.8, 4.0));
  ex.add(box(4, 5, 0.1, C(0x2a2a2a), 0, 4.1, 3.05, { cast: false }));
  const r = rng(2690), ow = M(T2.officeWin);
  for (let i = 0; i < 40; i++) { const side = i % 2 ? 1 : -1, x = side * (18 + r() * 60), z = -10 - r() * 120, h = 20 + r() * 60, w = 8 + r() * 8; ny.add(box(w, h, w, i % 3 ? ow : M(T.brickGrey), x, h / 2, z)); }
  for (let i = 0; i < 6; i++) ny.add(box(14, 30 + i * 6, 12, ow, -28 + i * 11, 15 + i * 3, -40 - (i % 2) * 8));
  // Brotschlange
  const sk = new THREE.Group(); sk.position.set(60, 0, -3); ny.add(sk); sk.add(box(16, 7, 0.4, M(T.brickDark), 0, 3.5, -1.2)); sk.add(box(2, 2.4, 0.1, C(0x2a1a10), 6, 1.2, -0.98, { cast: false }));
  sk.add(box(5, 0.9, 0.1, C(0xe8e0c8), 6, 3.0, -0.95, { cast: false }));
  sunLight(ny, 0xd8e0f0, 2.0, V(-30, 50, 40), V(0, 0, -6), 60); ny.add(new THREE.HemisphereLight(0xb8c4d8, 0x4a4a4a, 1.6));
  const traders = []; for (let i = 0; i < 14; i++) { const p = humanoid({ skin: skins[i % 4], hair: hairs[i % 5], top: [0x2a2a30, 0x3a3428, 0x2a3040, 0x4a4a4a][i % 4], bottom: 0x22222a, coat: true, tie: [0x8a2a2a, 0x2a4a8a, 0xdddddd][i % 3], seed: 2700 + i }); fedora(p, [0x3a3a3a, 0x5a4a3a, 0x2a2a2a][i % 3]); ny.add(p); traders.push(p); }
  const line = []; for (let i = 0; i < 9; i++) { const p = humanoid({ skin: skins[(i + 2) % 6], hair: hairs[i % 5], top: [0x4a4a42, 0x5a4a3a, 0x3a3e4a][i % 3], bottom: 0x2e2e2e, coat: true, hat: 'cap', hatCol: 0x3a3a3a, seed: 2720 + i }); ny.add(p); line.push(p); }
  ny.userData = { traders, line };
}

// =====================================================================
// SET D: Deutschland heute – Parlament, Einkaufsstraße, Park, Goldtürme
// =====================================================================
const de = new THREE.Scene();
{
  skyDome(de, 0x3a74c8, 0x88b4e2, 0xd2e4f2, V(-0.5, 0.45, 0.4)); de.fog = new THREE.Fog(0xd2e4f2, 90, 420); clouds(de, 21, 0xffffff, 60, 28, 220, 0.95);
  de.add(box(900, 1, 900, M(T.grass), 0, -0.5, 0, { cast: false })); de.add(box(500, 0.06, 7, C(0x3a3a3e), 0, 0.03, 10, { cast: false })); for (let x = -250; x < 250; x += 6) de.add(box(3, 0.02, 0.2, C(0xe8e8e8), x, 0.07, 10, { cast: false }));
  de.add(box(40, 0.06, 14, M(T.concrete), 0, 0.04, -2, { cast: false }));
  // Parlament (eigene Interpretation): Sandstein, Ecktürme, Glaskuppel
  const ss = M(T2.sandstone), gl = new THREE.MeshStandardMaterial({ color: 0xbfe0f4, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.75 });
  const pa = new THREE.Group(); pa.position.set(0, 0, -20); de.add(pa); pa.add(box(34, 11, 14, ss, 0, 5.5, 0)); for (const x of [-15.5, 15.5]) pa.add(box(5, 14, 6, ss, x, 7, 4.5));
  for (let x = -6; x <= 6; x += 2.4) pa.add(box(1.0, 8, 1.0, ss, x, 5.5, 7.4)); pa.add(box(15, 1.6, 2, ss, 0, 10.2, 7.4)); for (let s = 0; s < 3; s++) pa.add(box(13 - s * 4, 0.8, 2, ss, 0, 11.4 + s * 0.8, 7.4));
  for (let x = -12; x <= 12; x += 2.4) for (const y of [3, 7.5]) if (Math.abs(x) > 7) pa.add(box(1.2, 2, 0.1, M(T.windowDark), x, y, 7.03, { cast: false }));
  for (let s = 0; s < 4; s++) pa.add(box(9 - s * 2, 1.4, 9 - s * 2, gl, 0, 11.7 + s * 1.4, 0));
  for (const x of [-9, -6.5, 6.5, 9]) flag(T2.de, 2.0, 1.2, 9, de, V(x, 0, -9.5), 0, x);
  // Einkaufsstraße
  const shops = new THREE.Group(); shops.position.set(70, 0, 0); de.add(shops); const cols = [0xe8e0d0, 0xc8d4dc, 0xe0c8b0, 0xd8dcc8];
  for (let i = 0; i < 6; i++) { const x = -15 + i * 6; shops.add(box(5.8, 10 + (i % 3) * 2, 6, C(cols[i % 4]), x, 5 + (i % 3), -4)); shops.add(box(5.2, 2.6, 0.1, new THREE.MeshStandardMaterial({ color: 0x9ad0e8, roughness: 0.1, metalness: 0.3 }), x, 1.4, -0.95, { cast: false })); shops.add(box(5.6, 0.5, 0.8, C([0xd83a3a, 0x3a7ad8, 0x3aa85a, 0xe8b830][i % 4]), x, 3.0, -0.6)); }
  // Park
  const tree = (x, z) => { de.add(box(0.7, 4, 0.7, C(0x5a3a22), x, 2, z)); de.add(box(3.6, 3.0, 3.6, C(0x3f7a32), x, 5.2, z)); de.add(box(2.4, 1.6, 2.4, C(0x4a8a3a), x, 7.2, z)); };
  for (const [x, z] of [[-44, -6], [-52, -2], [-60, -8], [-38, -12], [-66, 2], [-48, -16], [30, -10], [44, -12], [110, -8], [128, -6]]) tree(x, z);
  // Goldtürme (Vermögen) – 9 kleine Stapel + 1 großer Turm
  const gx = 120; const towers = []; for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.position.set(gx - 8 + i * 1.6, 0, 0); g.add(box(0.8, 0.8, 0.8, goldM, 0, 0.4, 0)); de.add(g); towers.push(g); }
  const big = new THREE.Group(); big.position.set(gx + 7.4, 0, 0); de.add(big); for (let y = 0; y < 5; y++) for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) big.add(box(0.9, 0.9, 0.9, goldGlow, dx, 0.45 + y * 0.9, dz));
  sunLight(de, 0xfff0d8, 3.4, V(-45, 60, 45), V(0, 0, 0), 70, 2048); de.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const people = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const p = humanoid({ skin: skins[i % 6], hair: hairs[(i * 5) % 6], top: [0x3a6aa8, 0xa83a6a, 0x3a8a5a, 0xe8b830, 0x6a4aa8, 0xe86a3a][i % 6], bottom: [0x2a3448, 0x3a3a3a, 0x5a4a3a][i % 3], longHair: i % 2 === 1, skirt: i % 4 === 1, smile: true, shoe: 0xe8e8e8, seed: 2750 + i }); de.add(p); return p; });
  people.forEach((p, i) => { p.userData.bag = inHand(p, bagMesh([0xd83a3a, 0x3a7ad8, 0xe8b830, 0x3aa85a][i % 4])); });
  const kids = [0, 1, 2].map(i => { const p = humanoid({ skin: skins[(i + 3) % 6], hair: hairs[i], top: [0xe8b830, 0x3aa8d8, 0xd84a8a][i], bottom: 0x2a3448, longHair: i === 1, smile: true, scale: 0.62, seed: 2770 + i }); backpack(p, [0xd83a3a, 0x3a7ad8, 0x3aa85a][i]); de.add(p); return p; });
  const rich = humanoid({ ...KAP, top: 0x23232a, bottom: 0x23232a, hat: undefined, hair: 0x6a4a2a, tie: 0x8a1a2a, beard: undefined, seed: 2780 }); de.add(rich);
  const row = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const p = humanoid({ skin: skins[i % 6], hair: hairs[(i * 5) % 6], top: [0x3a6aa8, 0xa83a6a, 0x3a8a5a, 0xe8b830, 0x6a4aa8, 0xe86a3a][(i * 5) % 6], bottom: 0x2a3448, longHair: i % 2 === 0, seed: 2790 + i }); de.add(p); return p; });
  de.userData = { flags: de.children.filter(c => c.userData.update), people, kids, rich, row, towers, big, gx };
}

// =====================================================================
// Ergänzungen in übernommenen Sets (England, Studierzimmer)
// =====================================================================
{ // Streik + Schule in der Fabrikstraße
  const strikers = []; for (let i = 0; i < 9; i++) { const p = folk(i + 20, { hat: i % 2 ? 'cap' : undefined, longHair: false, skirt: false }); eng.add(p); strikers.push(p); }
  const banners = []; for (let i = 0; i < 2; i++) { const b = new THREE.Group(); b.add(box(0.08, 3.2, 0.08, C(0x6a4a2a), -0.8, 1.6, 0)); b.add(box(0.08, 3.2, 0.08, C(0x6a4a2a), 0.8, 1.6, 0)); const cl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: T2.banner, side: THREE.DoubleSide, roughness: 0.9 })); cl.position.set(0, 2.6, 0.02); b.add(cl); eng.add(b); banners.push(b); }
  const school = new THREE.Group(); school.position.set(-3.5, 0, -52); eng.add(school); school.add(box(8, 6, 0.4, M(T.brickGrey), 0, 3, -0.2));
  school.add(box(1.6, 2.4, 0.1, C(0x5a3a22), 0, 1.2, 0.02, { cast: false })); school.add(box(1.0, 1.0, 1.0, C(0xb08a40, { metal: 0.6, rough: 0.4 }), 0, 6.6, -0.4));
  for (const x of [-2.8, 2.8]) school.add(box(1.4, 1.6, 0.1, M(T.window), x, 3.2, 0.02, { cast: false }));
  const kids = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: skins[i % 4], hair: hairs[i], top: [0x6a5a48, 0x7a4a3a, 0x4a5a6a, 0x5a6a4a][i], bottom: 0x4a3e32, longHair: i % 2 === 1, skirt: i % 2 === 1, smile: true, scale: 0.62, seed: 2800 + i }); inHand(p, bookMesh([0x2a3a6a, 0x6a2a1a][i % 2])); eng.add(p); return p; });
  eng.userData.strike = { strikers, banners, kids, school };
  const { marx, engels } = study.userData; marx.visible = engels.visible = false;
  const sm = humanoid(SMITH); sm.position.set(0.55, 0, 0.0); sm.rotation.y = Math.PI; study.add(sm); study.userData.sm = sm;
}

// =====================================================================
// SET 6: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901);
  for (const [x, h] of [[18, 14], [26, 18], [34, 12]]) { dusk.add(box(7, 7, 7, C(0x7a4a3a), x, 3.5, -80)); dusk.add(box(1.4, h, 1.4, C(0x6a3a2a), x + 2, h / 2, -80)); }
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  goldStack(dusk, -4.6, -1.5, 2, 2, 2, goldM, 0.7);
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('ADAM SMITH, 1776', 72, 150, '#a3241c'); fit('EIGENNUTZ KANN ALLEN DIENEN,', 56, 290, '#3a2a1e'); fit('WENN ES FAIRE REGELN GIBT', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 73.32; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'scot'], [6, 'smith'], [13, 'alone'], [22, 'ten'], [32, 'term'], [36, 'book'], [44, 'idea'], [52, 'baker'], [67, 'hand'],
  [73, 'sofunc'], [85, 'invest'], [95, 'risk'], [106, 'market'], [112, 'scarce'], [120, 'more'], [129, 'compete'], [137, 'brutal'], [142, 'factory'], [155, 'rich'], [159, 'poor'],
  [163, 'union'], [169, 'laws'], [175, 'crisis'], [185, 'jobless'], [190, 'state'], [200, 'smw'], [206, 'world'], [217, 'inequal'], [234, 'sign'], [242, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.18, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-5.2 + drift * 1.2, 8.2 + drift * 0.7, 10.0 + drift * 1.2), t1 = V(0.6 + drift * 0.6, 1.6, -6.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`, gold = s => `<span style="color:#ffd23f">${s}</span>`;
const hideAll = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = hero, exp = 1.35; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Hook-Platz ----------
  if (['hero', 'loop', 'sofunc', 'invest', 'risk'].includes(sh.id)) {
    scene = hero; exp = 1.3; const Hh = hero.userData; const ta = sh.id === 'loop' ? t - DUR : t; Hh.smokes.forEach(s => s.userData.update(ta + 20));
    const { kap, arb, kap2, arb2 } = Hh; hideAll([kap, arb, kap2, arb2]); Hh.poof.visible = false; Hh.riskPile.visible = true; Hh.riskPile.children.forEach(b => b.visible = true); Hh.ingC.forEach(m => m.visible = true);
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'sofunc') {
      put(kap, HX, 0, HZ, 0.45); put(arb, HX2, 0, HZ, -0.5); pose3(kap, 'give', ta, 0); kap.userData.armL.rotation.x = 0.05; kap.userData.armR.rotation.x = -1.25 + Math.sin(ta * 1.6) * 0.04;
      pose2(arb, 'idle', ta, 1); arb.userData.armR.rotation.x = -0.55; arb.userData.armR.rotation.z = 0.1; Hh.pick.rotation.x = -0.9; kap.userData.head.rotation.y = 0.15; arb.userData.head.rotation.y = -0.25;
      arb.userData.setFace({ angry: false }); }
    if (sh.id === 'hero' || sh.id === 'loop') { heroCam(ta); tag(kap, 'Kapitalist', HERO); tag(arb, 'Arbeiter', ALLY); }
    if (sh.id === 'sofunc') { mv(u, V(-14, 14, 18), V(-12, 13.2, 15.5), V(0, 4, -20), V(0.5, 4, -21), 50);
      if (t >= wt(76)) ui.tags.push([V(1.5, 13.0, -35), 'Fabrik: privat', HERO]); if (t >= wt(77)) ui.tags.push([V(12, 4.2, -12), 'Maschine: privat', HERO]); if (t >= wt(79)) ui.tags.push([V(-16, 1.4, -11), 'Land: privat', HERO]);
      if (t >= wt(82)) info(wt(82), `Eigentum: ${gold('privat')}, ${red('nicht staatlich')}`); }
    if (sh.id === 'invest') { put(kap2, -3.8, 0, -7.6, 0.75); put(arb2, -2.3, 0, -7.0, -0.95); pose3(kap2, 'give', t); pose3(arb2, t >= wt(87) + 0.3 ? 'give' : 'idle', t, 1);
      const handed = t >= wt(87) + 0.3; Hh.ing2.visible = !handed; Hh.ing3.visible = handed; if (handed) arb2.userData.setFace({ smile: true });
      mv(u, V(-1.2, 1.9, -2.8), V(-1.5, 1.85, -3.5), V(-3.1, 1.25, -7.6), V(-3.1, 1.25, -7.6), 46); tag(kap2, 'Kapitalist', HERO); tag(arb2, 'Arbeiter', ALLY);
      tip(wt(94), 'gold', 'Kapitalist', '#ffd23f', [gray('besitzt Kapital: Geld, Fabriken'), gray('investiert, um ') + green('Gewinn') + gray(' zu machen')]); }
    if (sh.id === 'risk') { put(kap2, -4.4, 0, -8.6, 0.5); pose3(kap2, t >= wt(99) ? 'sadidle' : 'idle', t); if (t >= wt(96)) kap2.userData.setFace({ sad: true }); Hh.ing2.visible = false;
      const bl = Hh.riskPile.children; const n = bl.length; const k = clamp01((t - wt(99)) / (wt(105) - wt(99)));
      bl.forEach((b, i) => b.visible = i < Math.round(n * (1 - k))); if (t >= wt(105)) Hh.riskPile.visible = false; Hh.poof.position.set(-6.0, 0.9, -10.4); updateBurst(Hh.poof, t - wt(105), 3, 0.8);
      mv(u, V(-3.0, 2.0, -4.0), V(-3.3, 1.95, -4.6), V(-5.2, 1.0, -9.6), V(-5.2, 1.0, -9.6), 48); tag(kap2, 'Kapitalist', HERO); eff(wt(98), 'Risiko', 'hoch', BAD); }
  }
  // ---------- Schottland ----------
  if (['scot', 'smith', 'alone', 'ten', 'term', 'idea', 'baker', 'hand', 'market', 'scarce', 'more', 'compete'].includes(sh.id)) {
    scene = scot; exp = 1.3; const S2 = scot.userData;
    hideAll([S2.solo, S2.baker, S2.baker2, ...S2.xb, S2.butcher, S2.brewer, S2.smith, ...S2.cust]); S2.workers.forEach((w, i) => { w.visible = sh.id !== 'alone'; pose(w, 'work', t, i * 0.9); });
    S2.extra.forEach(s => s.visible = false); S2.cust.forEach(c => c.userData.bread.visible = false); S2.bread.visible = false; S2.breads.forEach(b => b.visible = true);
    S2.stR.visible = sh.id !== 'compete'; S2.brewBarrels.forEach(b => b.visible = sh.id !== 'compete'); S2.extra[1].position.set(0, 0, 7.2); S2.extra[1].rotation.y = Math.PI;
    const pinsShown = sh.id === 'ten' ? clamp01((t - wt(22)) / 3.0) : 1; S2.binFill.position.y = 0.05 + 0.3 * (sh.id === 'ten' ? pinsShown : 1);
    const marketBase = () => { put(S2.baker, -22, 0, -4.2, 0); pose3(S2.baker, 'idle', t); put(S2.butcher, -26.6, 0, -3.5, 0.25); pose3(S2.butcher, 'idle', t, 1); put(S2.brewer, -17.4, 0, -3.5, -0.25); pose3(S2.brewer, 'idle', t, 2); };
    if (sh.id === 'scot') { mv(u, V(-24, 9, 28), V(-23, 9.3, 25), V(4, 12, -90), V(4, 12.5, -90), 46); info(wt(4), 'Schottland, 1776'); put(S2.smith, 6 + (t - sh.a) * 1.2, 0, 4.5, Math.PI / 2); pose2(S2.smith, 'walk', t); }
    if (sh.id === 'smith') { put(S2.smith, 22.2, 0, 2.4, 0.55); pose3(S2.smith, 'idle', t); S2.smith.userData.head.rotation.y = -0.5; S2.smith.userData.armR.rotation.x = -0.4;
      mv(u, V(24.6, 1.95, 6.6), V(24.2, 1.9, 5.9), V(20.6, 1.35, 0.6), V(20.6, 1.35, 0.6), 48); tag(S2.smith, 'Adam Smith', HERO); }
    if (sh.id === 'alone') { put(S2.solo, 31, 0, 1.75, 0); pose(S2.solo, 'work', t); S2.solo.userData.setFace({ sad: true });
      mv(u, V(32.2, 1.95, 6.2), V(32.0, 1.9, 5.5), V(31, 1.1, 2.0), V(31, 1.1, 2.0), 46); tag(S2.solo, 'Handwerker', WHITE); eff(wt(18), 'Nadeln pro Tag', 'max. 20', GREY); }
    if (sh.id === 'ten') { const k = smoother(u); cam(V(lerp(10.5, 13.0, k), lerp(2.4, 2.2, k), lerp(5.2, 4.4, k)), V(lerp(15.5, 18.5, k), 1.15, -1.5), 50);
      eff(wt(30), 'Nadeln pro Tag', '48.000', HERO); }
    if (sh.id === 'term') { mv(u, V(24.8, 1.9, 3.6), V(24.4, 1.85, 3.0), V(21.6, 1.15, -0.8), V(21.6, 1.15, -0.8), 46);
      tip(wt(35), 'gear', 'Arbeitsteilung', '#ffff55', [gray('Jeder macht nur einen Schritt'), green('Viel mehr in gleicher Zeit')]); }
    if (sh.id === 'idea') { marketBase(); S2.cust.forEach((c, i) => { if (i > 4) return; put(c, -25 + i * 1.5, 0, 0.6 + (i % 2) * 0.9, (i - 2) * 0.3); pose3(c, 'idle', t, i); c.userData.bread.visible = i % 2 === 0; });
      mv(u, V(-19.0, 2.6, 8.5), V(-19.6, 2.5, 7.6), V(-22, 1.4, -2.5), V(-22, 1.4, -2.5), 50); tag(S2.baker, 'Bäcker', HERO); tag(S2.butcher, 'Metzger', WHITE); tag(S2.brewer, 'Brauer', WHITE);
      chat(wt(46), gray('Jeder denkt an sich')); }
    if (sh.id === 'baker') { marketBase(); S2.baker.position.z = -3.9; pose3(S2.baker, 'give', t); S2.bread.visible = t < wt(61); const c = S2.cust[0]; put(c, -21.6, 0, -1.6, Math.PI - 0.5); pose3(c, t >= wt(61) ? 'idle' : 'give', t); c.userData.bread.visible = t >= wt(61); if (t >= wt(61)) c.rotation.y = 0.6;
      S2.cust.slice(1, 4).forEach((p, i) => { if (t < wt(61)) return; put(p, -24.5 + i * 2.3, 0, 1.6 + i * 0.4, 0.2 - i * 0.2); pose3(p, 'idle', t, i); p.userData.bread.visible = true; p.userData.armR.rotation.x = -0.9; });
      mv(u, V(-19.7, 2.0, 2.5), V(-20.0, 1.95, 1.9), V(-22.0, 1.35, -2.4), V(-22.0, 1.35, -2.4), 48); tag(S2.baker, 'Bäcker', HERO); if (t < wt(61)) tag(c, 'Kundin', WHITE);
      say(wt(58), 'Bäcker', HERO, `Brot gegen ${gold('Geld')}`); }
    if (sh.id === 'hand') { marketBase(); S2.cust.forEach((c, i) => { put(c, -27 + (i % 4) * 3.2, 0, 1.5 + Math.floor(i / 4) * 2.4, Math.PI / 2 * (i % 2 ? 1 : -1)); pose2(c, 'walk', t, i); c.position.x += Math.sin(t * 0.4 + i) * 0.6; c.userData.bread.visible = i % 2 === 0; });
      mv(u, V(-22, 15, 10), V(-22, 14, 8.6), V(-22, 0, -0.5), V(-22, 0, -0.6), 46);
      tip(wt(71), 'hand', 'Die unsichtbare Hand', '#55ff55', [gray('Jeder handelt für sich –'), green('am Ende profitieren alle')]); }
    if (['market', 'scarce', 'more', 'compete'].includes(sh.id)) marketBase();
    if (sh.id === 'market') { mv(u, V(-21.2, 1.85, 1.4), V(-21.4, 1.8, 0.8), V(-22, 1.2, -3.0), V(-22, 1.2, -3.0), 48); tag(S2.baker, 'Bäcker', HERO);
      tip(wt(109), 'scale', 'Angebot und Nachfrage', '#ffff55', [gray('Viel Ware, wenig Käufer: billig'), gray('Wenig Ware, viele Käufer: teuer')]); }
    if (sh.id === 'scarce') { S2.breads.forEach((b, i) => b.visible = i < 2); S2.cust.forEach((c, i) => { put(c, -22 + (i % 2 ? 0.3 : -0.3), 0, -1.8 + i * 0.85, Math.PI); pose3(c, 'idle', t, i); c.rotation.y = Math.PI; });
      S2.cust.forEach(c => c.rotation.y = Math.PI);
      mv(u, V(-17.6, 2.6, -1.0), V(-17.9, 2.55, -0.6), V(-22.2, 1.3, 1.6), V(-22.2, 1.3, 1.6), 50); tag(S2.baker, 'Bäcker', HERO);
      eff(wt(112), 'Brotpreis', t >= wt(117) ? '3 Gold ▲' : '1 Gold', t >= wt(117) ? BAD : GREY); }
    if (sh.id === 'more') { const ap = [0, 1, 2].map(i => smoother((t - wt(121) - i * 0.25) / 0.3)); S2.extra.forEach((s, i) => { s.visible = ap[i] > 0; s.scale.setScalar(Math.max(0.001, ap[i])); });
      S2.xb.forEach((p, i) => { if (ap[i] <= 0) return; const s = S2.extra[i]; put(p, -22 + s.position.x - Math.sin(s.rotation.y) * -0.6, 0, s.position.z + 1.1 * Math.cos(s.rotation.y) * -1, s.rotation.y); p.scale.setScalar(0.95 * ap[i]); pose3(p, 'idle', t, i); });
      mv(u, V(-30, 9.5, 14), V(-29, 9.0, 12.8), V(-22, 0.5, 1.5), V(-22, 0.5, 1.5), 46);
      eff(wt(112), 'Brotpreis', t >= wt(127) ? '1 Gold ▼' : '3 Gold', t >= wt(127) ? '#55ff55' : BAD); }
    if (sh.id !== 'more') S2.xb.forEach(p => p.scale.setScalar(0.95));
    if (sh.id === 'compete') { S2.extra[1].visible = true; S2.extra[1].scale.setScalar(1); S2.extra[1].position.set(3.2, 0, -3); S2.extra[1].rotation.y = 0; S2.brewer.visible = false; const p2 = S2.xb[1]; put(p2, -18.8, 0, -4.2, 0); pose3(p2, 'give', t, 1); p2.scale.setScalar(0.95);
      S2.cust.forEach((c, i) => { if (i > 3) return; const k = smoother((t - wt(130) - i * 0.2) / 1.2); put(c, lerp(-23.0 + i * 0.6, -19.8 + i * 0.5, k), 0, -1.6 + (i % 2) * 0.7, k > 0 && k < 1 ? Math.PI / 2 : Math.PI); pose2(c, k > 0 && k < 1 ? 'walk' : 'idle', t, i); });
      S2.baker.userData.setFace({ sad: t >= wt(134) }); p2.userData.setFace({ smile: true });
      mv(u, V(-20.4, 2.3, 4.6), V(-20.4, 2.25, 3.9), V(-20.4, 1.3, -2.4), V(-20.4, 1.3, -2.4), 50); tag(S2.baker, 'Bäcker A', HERO); tag(p2, 'Bäcker B', ALLY);
      say(wt(130), 'Kunde', WHITE, `Bei B ist es ${green('billiger')}!`); }
  }
  if (sh.id === 'book') { scene = study; exp = 1.45; const { sm } = study.userData; pose(sm, 'write', t); sitPose(sm, 0.5);
    mv(u, V(1.9, 1.95, -3.2), V(1.65, 1.85, -2.9), V(0.3, 1.1, -0.2), V(0.3, 1.1, -0.2), 52); tag(sm, 'Adam Smith', HERO);
    tip(wt(40), 'book', 'Der Wohlstand der Nationen', '#ffaa00', [gray('Adam Smith, 1776'), gray('fast 1000 Seiten')]); }
  // ---------- England ----------
  if (['brutal', 'union', 'laws'].includes(sh.id)) {
    scene = eng; exp = 1.45; eng.userData.smokes.forEach(s => s.userData.update(t)); const ST = eng.userData.strike;
    hideAll([...ST.strikers, ...ST.kids]); ST.banners.forEach(b => b.visible = false);
    if (sh.id === 'brutal') { mv(u, V(60, 46, 50), V(55, 43, 42), V(-8, 6, -60), V(-10, 6, -66), 44); info(wt(142), 'England, um 1830'); }
    if (sh.id === 'union') { const z0 = -26 + (t - sh.a) * 1.1; ST.strikers.forEach((p, i) => { put(p, -2.4 + (i % 3) * 1.4 + (Math.floor(i / 3) % 2) * 0.5, 0, z0 - Math.floor(i / 3) * 1.6, 0); pose(p, i === 1 ? 'fist' : 'walk', t, i); });
      ST.banners.forEach((b, i) => { b.visible = true; b.position.set(-1.7 + i * 2.6, 0, z0 - 1.0 - i * 1.6); });
      mv(u, V(1.6, 2.2, z0 + 6.5), V(1.4, 2.1, z0 + 5.8), V(-1.0, 1.5, z0 - 1.5), V(-1.0, 1.5, z0 - 1.5), 50); tag(ST.strikers[1], 'Gewerkschaft', ALLY); }
    if (sh.id === 'laws') { ST.kids.forEach((p, i) => { put(p, -4.7 + i * 0.85, 0, -50.2 + (i % 2) * 0.5, (i - 1.5) * 0.12); pose(p, 'cheer', t, i); });
      mv(u, V(-1.6, 1.6, -44.6), V(-1.9, 1.55, -45.4), V(-3.4, 1.4, -51.0), V(-3.4, 1.5, -51.2), 50); ST.kids.forEach((p, i) => i === 0 && tag(p, 'Kinder', WHITE, -0.2));
      toast(wt(172), 'Fortschritt erzielt!', 'Kinderarbeit verboten', 'book'); }
  }
  if (sh.id === 'factory') { scene = fac; exp = 1.9; const { wheels, workers, child } = fac.userData;
    wheels.forEach((w, i) => w.rotation.x = t * 3 + i); workers.forEach((w, i) => pose(w, 'work', t, i * 0.7));
    child.position.set(0.2, 0, 10 - (t - sh.a) * 1.05); child.rotation.y = Math.PI; pose(child, 'carry', t); child.visible = true;
    mv(u, V(1.4, 2.7, 15.5), V(1.0, 2.5, 13.2), V(-3.4, 1.3, 4), V(-3.6, 1.3, 2.5), 52); if (t >= wt(147)) tag(child, 'Kind, 9 Jahre', GREY, -0.1);
    eff(wt(151), 'Arbeitszeit', '16 Stunden', BAD); }
  if (sh.id === 'rich') { scene = office; exp = 1.4; const { owner, coins } = office.userData; pose(owner, 'count', t);
    mv(u, V(0.4, 2.0, 3.8), V(0.3, 1.95, 3.0), V(0, 0.95, -2.4), V(0, 1.0, -2.4), 50); updateBurst(coins, t - wt(158), 2.2, 0.9); tag(owner, 'Fabrikbesitzer', BAD); }
  if (sh.id === 'poor') { scene = home; exp = 1.5; const { father, kid } = home.userData; pose(father, 'sad', t); pose(kid, 'sad', t, 1); sitPose(father, 0.5); sitPose(kid, 0.5);
    mv(u, V(0.3, 1.9, -2.75), V(0.25, 1.85, -2.5), V(0.05, 0.95, 0.1), V(0.0, 0.95, 0.0), 54); tag(father, 'Arbeiter', ALLY); }
  // ---------- New York ----------
  if (sh.id === 'crisis' || sh.id === 'jobless') {
    scene = ny; exp = 1.4; const NY = ny.userData; hideAll([...NY.traders, ...NY.line]);
    if (sh.id === 'crisis') { const panic = t >= wt(181); NY.traders.forEach((p, i) => { const x = -6 + (i % 7) * 2 + (Math.floor(i / 7) % 2) * 0.8, z = -2.2 + Math.floor(i / 7) * 2.2 + Math.sin(i * 3) * 0.4; put(p, x, 0, z, (i % 3 - 1) * 0.35); pose3(p, panic ? (i % 3 === 0 ? 'angry' : 'cross') : 'idle', t, i);
        if (panic) { p.userData.setFace({ sad: i % 2 === 0, angry: i % 2 === 1 }); if (i % 3 === 1) { p.userData.armL.rotation.x = p.userData.armR.rotation.x = -2.9; p.userData.armL.rotation.z = 0.4; p.userData.armR.rotation.z = -0.4; } } });
      mv(u, V(3, 3.2, 13), V(2.4, 3.0, 11.2), V(0, 4.4, -6), V(0, 4.0, -6), 50); info(wt(180), 'New York, 1929');
      tip(wt(182), 'down', 'Börsenkrach', BAD, [gray('Aktien verlieren bis 1932'), red('fast 90 % ihres Werts')]); }
    if (sh.id === 'jobless') { NY.line.forEach((p, i) => { put(p, 64.5 - i * 1.0, 0, -0.2, Math.PI / 2 - 0.35); pose3(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      mv(u, V(67.5, 2.0, 5.6), V(67.0, 1.95, 4.8), V(61.5, 1.3, -0.4), V(61.5, 1.3, -0.4), 48); tag(NY.line[0], 'Arbeitslose', GREY); info(wt(186), `Millionen ${red('ohne Arbeit')}`); }
  }
  // ---------- Deutschland heute ----------
  if (['state', 'smw', 'world', 'inequal'].includes(sh.id)) {
    scene = de; exp = 1.3; const D = de.userData; D.flags.forEach(f => f.userData.update(t)); hideAll([...D.people, ...D.kids, D.rich, ...D.row]); D.people.forEach(p => p.userData.bag.visible = false);
    if (sh.id === 'state') { D.people.slice(0, 4).forEach((p, i) => { put(p, -5 + i * 3.2, 0, -2 + (i % 2) * 2, (i % 2 ? 1 : -1) * Math.PI / 2); pose2(p, 'walk', t, i); p.position.x += (i % 2 ? 1 : -1) * (t - sh.a) * 0.9; });
      mv(u, V(-8, 4.0, 22), V(-6.5, 4.2, 19.5), V(0, 9, -18), V(0, 9.5, -18), 48); info(wt(190), 'Deutschland, heute');
      const L = [t >= wt(196) ? green('· Mindestlohn') : '', t >= wt(197) ? green('· Rente') : '', t >= wt(199) ? green('· Arbeitslosengeld') : ''].filter(Boolean);
      tip(wt(195), 'shield', 'Der Staat sichert ab', '#55ffff', L.length ? L : [gray('…')]); }
    if (sh.id === 'smw') { D.people.forEach((p, i) => { if (i > 5) return; put(p, 66.4 + (i % 3) * 1.4 + (Math.floor(i / 3)) * 0.6, 0, 1.4 - Math.floor(i / 3) * 2.2 + (t - sh.a) * 0.9, (i % 3 - 1) * 0.15); pose2(p, 'walk', t, i); p.userData.bag.visible = true; p.userData.armR.rotation.x = 0.1; });
      mv(u, V(68.6, 2.0, 10.0), V(68.6, 1.95, 9.2), V(68.0, 1.3, 0.8), V(68.0, 1.3, 1.2), 50);
      tip(wt(204), 'scale', 'Soziale Marktwirtschaft', '#ffff55', [gray('Freier Markt'), green('+ sozialer Ausgleich')]); }
    if (sh.id === 'world') { D.kids.forEach((p, i) => { put(p, -50 + i * 1.1, 0, 3.5 + (i % 2) * 0.4, 0.3 - i * 0.2); pose2(p, 'jog', t, i); p.position.z += (t - sh.a) * 1.4; p.rotation.y = 0; });
      D.people.slice(4, 7).forEach((p, i) => { put(p, -53 + i * 3.5, 0, 0.5, 0.2); pose3(p, 'laugh', t, i); });
      mv(u, V(-47, 2.2, 13), V(-47.6, 2.1, 12), V(-50, 1.0, 3), V(-50, 1.0, 4), 50);
      tip(wt(209), 'down', 'Extreme Armut weltweit', '#55ff55', [gray('1820: rund 75 % der Menschen'), green('heute: rund 10 %')]); }
    if (sh.id === 'inequal') { const gx = D.gx; D.row.forEach((p, i) => { put(p, gx - 8 + i * 1.6, 0.8, 0, 0); pose3(p, 'idle', t, i); });
      put(D.rich, gx + 7.4, 4.5, 0, -0.2); pose3(D.rich, 'cross', t); D.rich.userData.setFace({ smile: true });
      const k = smoother(u); cam(V(gx + lerp(-2, 4.0, k), lerp(2.6, 5.0, k), lerp(14, 12.5, k)), V(gx + lerp(-1.5, 6.4, k), lerp(1.6, 4.4, k), 0), 50);
      if (t >= wt(219)) { tag(D.rich, 'Reichste 10 %', HERO); tag(D.row[4], 'Rest: 90 %', GREY); }
      eff(wt(228), 'Vermögen der Top 10 %', 'über 50 %', HERO); }
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
  down: '<rect x="3" y="1" width="2" height="6" fill="#ff5555"/><rect x="2" y="5" width="4" height="1" fill="#ff5555"/><rect x="1" y="4" width="6" height="1" fill="#ff5555"/>',
  shield: '<rect x="1" y="1" width="6" height="4" fill="#55ffff"/><rect x="2" y="5" width="4" height="1" fill="#55ffff"/><rect x="3" y="6" width="2" height="1" fill="#55ffff"/><rect x="3" y="2" width="2" height="3" fill="#2a8a9a"/>',
  gold: '<rect x="1" y="3" width="6" height="3" fill="#f0c030"/><rect x="2" y="2" width="4" height="1" fill="#fff07a"/><rect x="1" y="6" width="6" height="1" fill="#b8860b"/>',
  gear: '<rect x="2" y="2" width="4" height="4" fill="#a8acb4"/><rect x="3" y="0" width="2" height="8" fill="#a8acb4"/><rect x="0" y="3" width="8" height="2" fill="#a8acb4"/><rect x="3" y="3" width="2" height="2" fill="#3a3a3a"/>',
  hand: '<rect x="2" y="3" width="4" height="4" fill="#9ad0c0"/><rect x="2" y="1" width="1" height="2" fill="#9ad0c0"/><rect x="3" y="0" width="1" height="3" fill="#9ad0c0"/><rect x="4" y="0" width="1" height="3" fill="#9ad0c0"/><rect x="5" y="1" width="1" height="2" fill="#9ad0c0"/><rect x="6" y="3" width="1" height="2" fill="#9ad0c0"/>',
  scale: '<rect x="3" y="1" width="2" height="6" fill="#c8a040"/><rect x="0" y="2" width="8" height="1" fill="#c8a040"/><rect x="0" y="4" width="3" height="1" fill="#f0c030"/><rect x="5" y="4" width="3" height="1" fill="#f0c030"/><rect x="2" y="7" width="4" height="1" fill="#c8a040"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const NUM = { 'siebzehnhundertsechsundsiebzig.': '1776.', 'zwanzig': '20', 'zehn': '10', 'achtundvierzigtausend.': '48.000.', 'sechzehn': '16', 'Neunzehnhundertneunundzwanzig': '1929' }; if (NUM[txt]) txt = NUM[txt];
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
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
