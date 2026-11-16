// „Narzissmus, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
// SET 1: Antikes Griechenland – Teich mit Spiegelbild, Tempel, Olivenbäume
// =====================================================================
const greece = new THREE.Scene();
{
  const sky = skyDome(greece, 0x3a78d0, 0x86b8e8, 0xe8e0c8, V(-0.4, 0.5, 0.5)); greece.userData.sky = sky;
  greece.fog = new THREE.Fog(0xe2dcc8, 90, 420); clouds(greece, 5, 0xffffff, 70, 22, 220, 0.9);
  const grassM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x7a9a4a, 0.14), 1101));
  // Boden mit Loch für den Teich (x -2..0.5, z 0.35..2.55)
  const PX0 = -2.0, PX1 = 0.5, PZ0 = 0.35, PZ1 = 2.55;
  greece.add(box(400, 1, 200, grassM, 0, -0.5, PZ0 - 100, { cast: false })); greece.add(box(400, 1, 200, grassM, 0, -0.5, PZ1 + 100, { cast: false }));
  greece.add(box(200, 1, PZ1 - PZ0, grassM, PX0 - 100, -0.5, (PZ0 + PZ1) / 2, { cast: false })); greece.add(box(200, 1, PZ1 - PZ0, grassM, PX1 + 100, -0.5, (PZ0 + PZ1) / 2, { cast: false }));
  const marble = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xeeeae0, 0.04); for (let i = 0; i < 6; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0xc8c4ba); }, 1102));
  // Teich: Wände, Boden, Rand, Wasser
  greece.add(box(PX1 - PX0, 0.2, PZ1 - PZ0, C(0x2a4a4a), (PX0 + PX1) / 2, -3.0, (PZ0 + PZ1) / 2, { cast: false }));
  for (const [w, d, x, z] of [[PX1 - PX0, 0.1, (PX0 + PX1) / 2, PZ0], [PX1 - PX0, 0.1, (PX0 + PX1) / 2, PZ1], [0.1, PZ1 - PZ0, PX0, (PZ0 + PZ1) / 2], [0.1, PZ1 - PZ0, PX1, (PZ0 + PZ1) / 2]]) greece.add(box(w, 3, d, C(0x3a5a58), x, -1.5, z, { cast: false }));
  for (const [w, d, x, z] of [[PX1 - PX0 + 0.8, 0.4, (PX0 + PX1) / 2, PZ0 - 0.2], [PX1 - PX0 + 0.8, 0.4, (PX0 + PX1) / 2, PZ1 + 0.2], [0.4, PZ1 - PZ0, PX0 - 0.2, (PZ0 + PZ1) / 2], [0.4, PZ1 - PZ0, PX1 + 0.2, (PZ0 + PZ1) / 2]]) greece.add(box(w, 0.4, d, marble, x, 0.2, z));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(PX1 - PX0, PZ1 - PZ0), new THREE.MeshStandardMaterial({ color: 0x5aa0c0, transparent: true, opacity: 0.42, roughness: 0.05, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set((PX0 + PX1) / 2, 0.1, (PZ0 + PZ1) / 2); greece.add(water);
  // Tempel
  const tp = new THREE.Group(); tp.position.set(2, 0, -16); greece.add(tp);
  for (let s = 0; s < 3; s++) tp.add(box(18 - s * 0.8, 0.5, 10 - s * 0.8, marble, 0, 0.25 + s * 0.5, 0));
  for (let x = -7.6; x <= 7.6; x += 1.9) for (const z of [-3.8, 3.8]) tp.add(box(0.8, 6, 0.8, marble, x, 4.5, z));
  tp.add(box(17, 0.8, 9.2, marble, 0, 7.9, 0)); for (let s = 0; s < 4; s++) tp.add(box(17 - s * 4, 0.6, 9.4, marble, 0, 8.6 + s * 0.6, 0));
  // Olivenbäume, Steine, Hügel, Meer
  const r = rng(1103); const oliveTree = (x, z, s = 1) => { greece.add(box(0.5 * s, 2.6 * s, 0.5 * s, C(0x6a5a46), x, 1.3 * s, z)); greece.add(box(2.6 * s, 1.4 * s, 2.6 * s, C(0x7a8a5a), x, 3.0 * s, z)); greece.add(box(1.8 * s, 0.9 * s, 1.8 * s, C(0x8a9a6a), x + 0.3, 4.0 * s, z - 0.2)); };
  for (const [x, z, s] of [[3.6, -1.5, 1], [-4.5, -2.5, 1.1], [-7, 3, 0.9], [7, 2, 1.2], [-12, -8, 1.3], [12, -9, 1.1], [16, 4, 1], [-16, 6, 1.2]]) oliveTree(x, z, s);
  for (let i = 0; i < 26; i++) { const x = -60 + r() * 120, z = -40 - r() * 60, h = 3 + r() * 10; greece.add(box(14 + r() * 10, h, 12, grassM, x, h / 2, z, { cast: false })); }
  greece.add(box(600, 0.2, 200, M(T.water, { rough: 0.15 }), 0, 0.05, -230, { cast: false }));
  for (let i = 0; i < 30; i++) greece.add(box(0.12, 0.12, 0.12, C([0xffffff, 0xf0d040, 0xe86a8a][i % 3]), -10 + r() * 20, 0.06, -4 + r() * 12, { cast: false }));
  const sun = sunLight(greece, 0xfff0d0, 3.4, V(-40, 60, 40), V(0, 0, 0), 40); greece.userData.sun = sun;
  const hemi = new THREE.HemisphereLight(0xd8e8ff, 0x8a7a5a, 1.4); greece.add(hemi); greece.userData.hemi = hemi;
  // Figuren
  const nar = humanoid(NARZISS), refl = humanoid(NARZISS), echo = humanoid(ECHO); laurel(nar); laurel(refl);
  greece.add(nar, refl, echo);
  const admirers = [0, 1].map(i => { const a = humanoid({ skin: [0xd8a882, 0xf0c4a2][i], hair: [0x2a1a14, 0x8a5a2a][i], top: 0xe8e2d2, bottom: 0xe0d8c4, longHair: i === 1, skirt: i === 1, seed: 1110 + i }); greece.add(a); return a; });
  const flower = new THREE.Group(); flower.add(box(0.06, 0.6, 0.06, C(0x3a8a2a), 0, 0.3, 0)); flower.add(box(0.2, 0.05, 0.08, C(0x4a9a3a), 0.12, 0.25, 0));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; flower.add(box(0.13, 0.13, 0.04, C(0xfaf6e8), Math.cos(a) * 0.13, 0.68 + Math.sin(a) * 0.13, 0.02)); } flower.add(box(0.12, 0.12, 0.12, C(0xf0c020), 0, 0.68, 0.06));
  greece.add(flower);
  const hearts = particlesBurst(greece, 18, [0xff4a6a, 0xff8aa0], 1120, 0.09); hearts.children.forEach(m => { m.userData.v.y = Math.abs(m.userData.v.y) + 0.8; m.userData.v.multiplyScalar(0.4); });
  const poofE = particlesBurst(greece, 30, [0xffffff, 0xcfe6ff], 1121, 0.12);
  greece.userData = { ...greece.userData, nar, refl, echo, admirers, flower, hearts, poofE, water, POOL: { PX0, PX1, PZ0, PZ1 } };
}
const LEAN = 0.62;
function narAtPool(N, Rf, t, kind = 'lookdown') { // kniet am hinteren Rand, beugt sich übers Wasser – Spiegelbild exakt an der Wasserfläche (y=0.1) gespiegelt
  N.position.set(-0.75, 0, -0.2); N.rotation.set(LEAN, 0, 0); pose3(N, kind, t); sitPose(N, 0.42); N.userData.head.rotation.x = 0.35; N.userData.armL.rotation.x = N.userData.armR.rotation.x = -1.0;
  Rf.position.set(-0.75, 0, -0.2); Rf.rotation.set(-LEAN, 0, 0); pose3(Rf, kind, t); sitPose(Rf, 0.42); Rf.userData.head.rotation.x = 0.35; Rf.userData.armL.rotation.x = Rf.userData.armR.rotation.x = -1.0;
  Rf.position.y = 0.2 - N.position.y; Rf.scale.set(0.95, -0.95, 0.95); Rf.visible = true;
}

// =====================================================================
// SET 2: Heute – Stadt, Bühne, 100 Menschen, Statue, Park, Haustür
// =====================================================================
const town = new THREE.Scene();
{
  skyDome(town, 0x4a7ac8, 0x8ab4e0, 0xcfe2f0, V(-0.5, 0.4, 0.3)); town.fog = new THREE.Fog(0xcfe2f0, 80, 380); clouds(town, 3, 0xffffff, 60, 30, 200, 0.95);
  town.add(box(800, 1, 800, M(T.grass), 0, -0.5, 0, { cast: false }));
  town.add(box(60, 0.06, 40, M(T.concrete), 0, 0.03, -6, { cast: false }));
  town.add(box(400, 0.06, 8, C(0x3a3a3e), 0, 0.03, 22, { cast: false })); for (let x = -200; x < 200; x += 6) town.add(box(3, 0.02, 0.25, C(0xe8e8e8), x, 0.07, 22, { cast: false }));
  town.add(box(400, 0.15, 2, C(0xa8a49c), 0, 0.08, 17, { cast: false })); town.add(box(400, 0.15, 2, C(0xa8a49c), 0, 0.08, 27, { cast: false }));
  const tr = rng(1201); const hcols = [0xe2d6c2, 0xc9b49a, 0xb8c4cc, 0xd8c0b0, 0xc8d8c0];
  for (let i = 0; i < 26; i++) { const x = -120 + i * 9.5, h = 7 + tr() * 6; town.add(box(8, h, 9, C(hcols[i % 5]), x, h / 2, 36)); for (let s = 0; s < 3; s++) town.add(box(8.4, 1, 9.4 - s * 3, M(T.roofRed), x, h + 0.5 + s, 36));
    for (const wx of [-2, 2]) for (const wy of [2.2, 5.2]) town.add(box(1.4, 1.4, 0.1, M(T.windowDark), x + wx, wy, 31.45, { cast: false })); }
  for (let i = 0; i < 12; i++) { const x = -40 + i * 7.5, h = 10 + tr() * 12; town.add(box(6.5, h, 7, C(hcols[(i + 2) % 5]), x, h / 2, -30)); for (let y = 2; y < h - 1; y += 3) for (const wx of [-1.6, 1.6]) town.add(box(1.4, 1.6, 0.1, M(T.windowDark), x + wx, y, -26.45, { cast: false })); }
  const tree = (x, z) => { town.add(box(0.7, 4, 0.7, C(0x5a3a22), x, 2, z)); town.add(box(3.6, 3.0, 3.6, C(0x3f7a32), x, 5.2, z)); town.add(box(2.4, 1.6, 2.4, C(0x4a8a3a), x, 7.2, z)); };
  for (const [x, z] of [[-18, 6], [-12, 9], [14, 7], [19, 2], [-24, -6], [24, -10], [-26, 14], [27, 14], [34, 4], [40, 8]]) tree(x, z);
  // Bühne mit Thron
  const stage = new THREE.Group(); stage.position.set(-14, 0, -14); town.add(stage);
  stage.add(box(7, 1, 4, M(T.planks), 0, 0.5, 0)); stage.add(box(7.2, 4, 0.3, M(T.redCloth), 0, 3, -2)); stage.add(box(1.4, 0.6, 1.0, C(0xd0a030, { metal: 0.5, rough: 0.4 }), 0, 1.3, -1.2)); stage.add(box(1.4, 1.6, 0.25, C(0xd0a030, { metal: 0.5, rough: 0.4 }), 0, 1.8, -1.65));
  const spot = new THREE.SpotLight(0xfff0c0, 40, 20, 0.35, 0.5, 1.2); spot.position.set(-14, 9, -6); spot.target.position.set(-14, 1, -14); town.add(spot, spot.target);
  // 100 Menschen (10x10) – nur im Hundert-Shot sichtbar
  const grid = new THREE.Group(); grid.position.set(40, 0, -60); town.add(grid); const gr = rng(1202);
  const gpeople = []; for (let i = 0; i < 100; i++) { const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a, 0xe0a882][i % 5], hair: [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a, 0x8a5a2a][(i * 7) % 5], top: [0x3a6aa8, 0xa83a3a, 0x3a8a5a, 0xe8e8e8, 0x8a5aa8, 0xd8a838][(i * 3) % 6], bottom: 0x2a3448, longHair: i % 3 === 0, seed: 1300 + (i % 12) });
    p.position.set((i % 10) * 1.3 - 5.85, 0, Math.floor(i / 10) * 1.3 - 5.85); p.rotation.y = (gr() - 0.5) * 0.6; grid.add(p); gpeople.push(p); }
  const ring = box(1.0, 0.04, 1.0, new THREE.MeshBasicMaterial({ color: 0xff3030 }), 0, 0.03, 0, { cast: false }); grid.add(ring);
  const special = gpeople[67]; ring.position.set(special.position.x, 0.03, special.position.z);
  // Statue (Fassade)
  const statue = humanoid({ skin: 0xe0b030, hair: 0xd8a828, top: 0xe8b830, bottom: 0xd8a828, shoe: 0xc89820, hairVol: true, eye: '#8a6a10', seed: 1400, scale: 3.4 });
  statue.position.set(60, 1.2, 0); town.add(statue); town.add(box(4, 1.2, 3, M(T.concrete), 60, 0.6, 0));
  const cracks = new THREE.Group(); const cm = C(0x2a1a0a); for (let i = 0; i < 14; i++) { const c = box(0.06, 0.6 + (i % 3) * 0.3, 0.02, cm, 59.2 + (i % 5) * 0.4, 2.6 + Math.floor(i / 5) * 1.6 + (i % 2) * 0.4, 0.46, { cast: false }); c.rotation.z = (i % 2 ? 0.6 : -0.5); cracks.add(c); } town.add(cracks);
  const chips = particlesBurst(town, 24, [0xe8b830, 0xc89820], 1401, 0.18); chips.position.set(60, 5, 0.6);
  // Haus mit Tür (Lena draußen)
  town.add(box(1.4, 2.4, 0.1, C(0x5a3a22), -5.2, 1.2, 31.42)); town.add(box(0.1, 0.1, 0.1, C(0xd8c040), -4.7, 1.2, 31.36, { cast: false }));
  // Park (Freunde) & Café (Kennenlernen)
  town.add(box(2.6, 0.12, 0.6, M(T.planks), 22, 0.6, -2)); for (const x of [20.9, 23.1]) town.add(box(0.12, 0.6, 0.5, C(0x3a3a3a), x, 0.3, -2));
  for (const x of [-30, -27]) { town.add(box(1.2, 0.08, 1.2, C(0xe8e8e8), x, 1.0, 8)); town.add(box(0.1, 1.0, 0.1, C(0x3a3a3a), x, 0.5, 8)); }
  town.add(box(8, 0.2, 3, C(0xb83a3a), -28.5, 3.6, 5.6)); // Markise
  sunLight(town, 0xfff0d8, 3.4, V(-45, 60, 45), V(0, 0, 0), 70);
  const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5); town.add(hemi);
  // Figuren
  const lena = humanoid(LENA), max = humanoid(MAX), crown = crownOn(max); town.add(lena, max);
  const extras = []; for (let i = 0; i < 8; i++) { const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a][i % 4], hair: [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a][i % 4], top: [0x3a6aa8, 0xa83a3a, 0x3a8a5a, 0xe8e8e8, 0x8a5aa8][i % 5], bottom: 0x2a3448, longHair: i % 2 === 0, seed: 1500 + i }); p.userData.phone = inHand(p, phoneMesh()); town.add(p); extras.push(p); }
  const gifts = new THREE.Group(); const gb = particlesBurst(town, 1, [0xffffff], 1, 0.01); gb.visible = false;
  for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.add(box(0.36, 0.3, 0.36, C([0xd83a4a, 0x3a7ad8, 0xe8b830][i % 3]), 0, 0, 0)); g.add(box(0.38, 0.06, 0.06, C(0xffffff), 0, 0, 0, { cast: false })); g.add(box(0.06, 0.32, 0.38, C(0xffffff), 0, 0, 0, { cast: false })); g.userData.d = i; gifts.add(g); } town.add(gifts);
  const hearts = particlesBurst(town, 40, [0xff4a6a, 0xff8aa0, 0xe8202a], 1600, 0.11);
  town.userData = { lena, max, crown, extras, grid, gpeople, special, statue, cracks, chips, gifts, hearts, stage };
}

// =====================================================================
// SET 3: Lenas Wohnung (Spiegel, Bett, Tür) – Licht kann „kippen“
// =====================================================================
const room = new THREE.Scene(); room.background = new THREE.Color(0x0a0b10);
{
  const wall = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8c8b8, 0.04), 1701)), fl = M(T.planks), dw = M(T.darkwood);
  room.add(box(8, 0.2, 9, fl, 0, -0.1, 0.5)); room.add(box(0.3, 4, 9, wall, -4.15, 2, 0.5));
  room.add(box(0.3, 4, 2.4, wall, 4.15, 2, -2.9)); room.add(box(0.3, 4, 4.4, wall, 4.15, 2, 2.8)); room.add(box(0.3, 1.5, 1.4, wall, 4.15, 3.25, -0.1)); // rechte Wand mit Türloch (z -0.8..0.6)
  const door = new THREE.Group(); door.position.set(4.05, 0, -0.8); door.add(box(0.08, 2.5, 1.4, C(0x8a5a3a), 0, 1.25, 0.7)); door.add(box(0.06, 0.06, 0.12, C(0xd8c040), -0.08, 1.2, 1.25)); room.add(door);
  room.add(box(5.5, 4, 0.3, wall, -1.25, 2, -4.15)); room.add(box(1.5, 4, 0.3, wall, 3.25, 2, -4.15)); room.add(box(1.0, 0.45, 0.3, wall, 2.0, 0.225, -4.15)); room.add(box(1.0, 1.55, 0.3, wall, 2.0, 3.225, -4.15));
  for (const [w, h, x, y] of [[1.16, 0.08, 2.0, 2.49], [1.16, 0.08, 2.0, 0.41], [0.08, 2.1, 1.46, 1.45], [0.08, 2.1, 2.54, 1.45]]) room.add(box(w, h, 0.12, C(0xd8d8d8, { metal: 0.6, rough: 0.3 }), x, y, -3.98));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshStandardMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.16, roughness: 0.05 })); glass.position.set(2.0, 1.45, -4.0); room.add(glass);
  room.add(box(3, 0.2, 3, fl, 2.0, -0.1, -5.6)); room.add(box(3, 4, 0.2, wall, 2.0, 2, -7.1)); room.add(box(0.2, 4, 3, wall, 0.5, 2, -5.6)); room.add(box(0.2, 4, 3, wall, 3.5, 2, -5.6)); room.add(box(3, 0.2, 3, wall, 2.0, 4, -5.6));
  room.add(box(1.8, 0.45, 2.8, dw, -2.7, 0.225, 1.6)); room.add(box(1.7, 0.2, 2.7, M(T.white), -2.7, 0.55, 1.6)); room.add(box(1.2, 0.18, 0.5, M(T.white), -2.7, 0.73, 0.5)); room.add(box(1.8, 0.9, 0.12, dw, -2.7, 0.45, 0.16));
  const blanket = box(1.74, 0.1, 1.6, C(0x8a5aa8), -2.7, 0.92, 2.1); room.add(blanket);
  room.add(box(2.4, 0.9, 1.0, C(0x6a7a8a), -1.2, 0.45, -3.4)); room.add(box(2.4, 0.5, 0.3, C(0x6a7a8a), -1.2, 1.1, -3.85)); // Sofa
  room.add(box(1.2, 0.08, 1.6, C(0x3a6a8a), 0.2, 0.04, 0.4, { cast: false }));
  const ccv = document.createElement('canvas'); ccv.width = ccv.height = 64; const ctex = new THREE.CanvasTexture(ccv); ctex.magFilter = THREE.NearestFilter; ctex.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshStandardMaterial({ map: ctex })); clock.position.set(0.6, 2.95, -3.98); room.add(clock);
  room.userData.drawClock = (h, min) => { const c = ccv.getContext('2d'); c.fillStyle = '#2a2a2a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#f0ece0'; c.fillRect(5, 5, 54, 54);
    c.fillStyle = '#333'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(Math.round(32 + Math.sin(a) * 22) - 1, Math.round(32 - Math.cos(a) * 22) - 1, 3, 3); }
    const hand = (a, len, w, col) => { c.fillStyle = col; for (let r = 0; r < len; r++) c.fillRect(Math.round(32 + Math.sin(a) * r) - (w >> 1), Math.round(32 - Math.cos(a) * r) - (w >> 1), w, w); };
    hand((h + min / 60) / 12 * Math.PI * 2, 12, 4, '#111'); hand(min / 60 * Math.PI * 2, 19, 3, '#111'); ctex.needsUpdate = true; };
  const winM = new THREE.MeshBasicMaterial({ color: 0x8ab0e0 }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), winM); win.rotation.y = Math.PI / 2; win.position.set(-3.98, 2.2, -1.5); room.add(win);
  room.add(box(0.1, 0.08, 1.7, dw, -3.97, 2.2, -1.5)); room.add(box(0.1, 1.4, 0.08, dw, -3.97, 2.2, -1.5));
  const sun = sunLight(room, 0xffe8c8, 2.0, V(-10, 6, -1.5), V(0, 0, -1), 7, 1024);
  const hemi = new THREE.HemisphereLight(0xe8e0d0, 0x4a3a2a, 1.2); room.add(hemi);
  const lamp = new THREE.PointLight(0xffb070, 7, 9, 1.5); lamp.position.set(0.5, 3.6, 0.5); room.add(lamp);
  room.add(box(0.5, 0.15, 0.5, new THREE.MeshBasicMaterial({ color: 0xffe0b0 }), 0.5, 3.92, 0.5, { cast: false }));
  const lena = humanoid(LENA), rLena = humanoid(LENA), max = humanoid(MAX); room.add(lena, rLena, max);
  const phone = inHand(lena, phoneMesh()); const flowers = inHand(max, bouquet()); const bag = box(0.4, 0.35, 0.2, C(0x8a5a3a), 0, -0.9, 0); lena.userData.armL.add(bag);
  const phoneL = new THREE.PointLight(0x9ad0ff, 0, 3, 1.5); room.add(phoneL);
  const suck = particlesBurst(room, 40, [0xff4a6a, 0xff8aa0, 0xffffff], 1702, 0.1);
  Object.assign(room.userData, { sun, hemi, lamp, winM, blanket, lena, rLena, max, phone, flowers, bag, door, suck, phoneL });
}
function roomMood(mode, t) { const R = room.userData;
  const m = { warm: [2.0, 1.2, 7, 0x8ab0e0, 0xffe8c8, 0xe8e0d0], cold: [1.0, 0.75, 2.5, 0x4a5a80, 0xa8b8ff, 0x9aa8d0], night: [0.2, 0.25, 0, 0x0e1630, 0x8090c0, 0x6a78a0] }[mode];
  R.sun.intensity = m[0]; R.hemi.intensity = m[1]; R.lamp.intensity = m[2]; R.winM.color.set(m[3]); R.sun.color.set(m[4]); R.hemi.color.set(m[5]); }

// =====================================================================
// SET 4: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901); const marble = C(0xe8e0d0);
  const tp = new THREE.Group(); tp.position.set(18, 0, -70); dusk.add(tp); for (let s = 0; s < 3; s++) tp.add(box(26 - s, 0.6, 12 - s, marble, 0, 0.3 + s * 0.6, 0)); for (let x = -11; x <= 11; x += 2.2) tp.add(box(1.1, 8, 1.1, marble, x, 5.8, 4.6)); tp.add(box(25, 1.2, 11, marble, 0, 10.4, 0));
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
  fit('OVID, 8 N. CHR.', 72, 150, '#a3241c'); fit('WER NUR SICH SELBST SIEHT,', 56, 290, '#3a2a1e'); fit('VERLIERT ALLES UM SICH HERUM', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 73.75; // hörbares Ende der Sprache (gemessen)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30; // Loop-Pause ≈ Satzpause
const WHIP0 = wt(1), WHIP1 = wt(1) + 0.57;
const CUTS = [[0, 'hero'], [4, 'greece'], [8, 'reject'], [17, 'echo'], [21, 'punish'], [32, 'waste'], [41, 'flower'], [49, 'echovoice'], [56, 'today'], [61, 'everyone'],
  [66, 'hundred'], [76, 'crown'], [82, 'admire'], [89, 'outside'], [96, 'hurt'], [106, 'meet'], [110, 'perfect'], [117, 'msgs'], [122, 'lovebomb'], [127, 'critic'],
  [139, 'gaslight1'], [151, 'gaslight2'], [155, 'doubt'], [163, 'sorry'], [173, 'facade'], [183, 'attack'], [194, 'rage'], [201, 'charm'], [214, 'hoover'], [225, 'outside2'],
  [229, 'friends'], [238, 'sign'], [248, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
function heroCam(t) { // Preset hook-kranfahrt.json, auf den Teich übertragen
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(-0.05, 0.85, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-9.0 + drift * 2, 15.0 + drift * 1.2, 16.0 + drift * 2), t1 = V(1.0 + drift, 0.5, -8.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const NAME = { lena: '#55ffff', max: '#ffffff', maxBad: '#ff5555', nar: '#ffd23f', echo: '#55ffff' };

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = greece, exp = 1.4; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null, hp: null, flash: 0 };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const maxCol = t >= wt(129) ? NAME.maxBad : NAME.max;

  // ---------- Griechenland ----------
  if (['hero', 'loop', 'greece', 'reject', 'echo', 'punish', 'waste', 'flower', 'echovoice'].includes(sh.id)) {
    scene = greece; exp = 1.35; const G = greece.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    G.flower.visible = false; G.refl.visible = false; G.nar.visible = true; G.echo.visible = true; G.admirers.forEach(a => a.visible = false); updateBurst(G.hearts, -1); updateBurst(G.poofE, -1);
    G.sun.position.set(-40, 60, 40); G.sun.intensity = 3.4; G.sun.color.set(0xfff0d0); G.hemi.intensity = 1.4; G.sky.material.uniforms.top.value.set(0x3a78d0); G.sky.material.uniforms.mid.value.set(0x86b8e8); G.sky.material.uniforms.hor.value.set(0xe8e0c8);
    const echoAt = () => { G.echo.position.set(0.95, 0, 0.55); G.echo.rotation.set(0, -0.55, 0); pose3(G.echo, 'idle', ta, 2); G.echo.userData.head.rotation.y = 0.3; };
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'greece') { narAtPool(G.nar, G.refl, ta); echoAt(); heroCam(ta); if (sh.id !== 'greece') { tag(G.nar, 'Narziss', NAME.nar); tag(G.echo, 'Echo', NAME.echo); } }
    if (sh.id === 'greece') { mv(u, V(-40, 22, 46), V(-34, 20, 40), V(4, 5, -14), V(6, 5, -16), 46); info(wt(5), 'Griechenland, vor 2000 Jahren'); }
    if (sh.id === 'reject') { const N = G.nar; N.position.set(14, 0, 2); N.rotation.set(0, 0.3, 0); pose3(N, 'cross', t); G.echo.visible = false;
      G.admirers.forEach((a, i) => { a.visible = true; a.position.set(15.6 + i * 0.9, 0, 3.4 + i * 0.4); a.rotation.y = -2.2; pose3(a, 'give', t, i); });
      if (t > wt(11)) N.rotation.y = 0.3 + Math.PI * smoother((t - wt(11)) / 0.4) * 0.8;
      mv(u, V(11.6, 2.0, 8.6), V(11.9, 1.95, 7.9), V(15.0, 1.2, 2.8), V(15.0, 1.2, 2.8), 48); tag(N, 'Narziss', NAME.nar); G.admirers.forEach(a => tag(a, 'Verehrer', '#aaaaaa')); }
    if (sh.id === 'echo') { G.nar.position.set(12.9, 0, -1.0 - (t - sh.a) * 1.2); G.nar.rotation.set(0, Math.PI, 0); pose3(G.nar, 'walk', t); G.echo.position.set(15.2, 0, 4.2); G.echo.rotation.set(0, 0.15, 0); pose2(G.echo, 'sadidle', t); G.echo.userData.setFace({ sad: true });
      mv(u, V(15.7, 1.75, 7.2), V(15.6, 1.72, 6.6), V(15.0, 1.45, 2.5), V(15.0, 1.45, 2.5), 46); tag(G.nar, 'Narziss', NAME.nar); tag(G.echo, 'Echo', NAME.echo); say(wt(19), 'Narziss', NAME.nar, 'Lass mich in Ruhe.'); }
    else G.echo.userData.setFace({});
    if (sh.id === 'punish') { narAtPool(G.nar, G.refl, t); G.echo.visible = false; mv(u, V(-0.75, 3.4, 3.4), V(-0.75, 3.1, 3.0), V(-0.75, -0.6, 1.0), V(-0.75, -0.6, 1.0), 44);
      G.hearts.position.set(-0.75, 0.6, 1.0); updateBurst(G.hearts, t - wt(23), 1.4, 2.4); say(wt(22), 'Nemesis', '#ff5555', 'Das ist deine Strafe.'); ui.tags.push([V(-0.75, 0.25, 1.75), 'Spiegelbild', '#ffd23f']); }
    if (sh.id === 'waste') { G.echo.visible = false; const k = clamp01((t - sh.a) / (sh.b - sh.a));
      G.sun.position.set(lerp(-40, 60, k), lerp(60, 8, k), 40); G.sun.color.setHSL(lerp(0.12, 0.05, k), 0.7, lerp(0.85, 0.6, k)); G.hemi.intensity = lerp(1.4, 0.7, k);
      G.sky.material.uniforms.top.value.lerpColors(new THREE.Color(0x3a78d0), new THREE.Color(0x2a2a5a), k); G.sky.material.uniforms.hor.value.lerpColors(new THREE.Color(0xe8e0c8), new THREE.Color(0xff9a60), k);
      if (t < wt(38)) narAtPool(G.nar, G.refl, t); else { const N = G.nar; pose(N, 'idle', 0); N.rotation.set(0, 0, Math.PI / 2); N.position.set(0.3, 0.14, -0.55); N.scale.set(0.95, 0.95, 0.95); }
      mv(u, V(2.4, 2.4, 4.6), V(2.1, 2.3, 4.2), V(-0.8, 0.4, 0.0), V(-0.9, 0.4, 0.0), 48); tag(G.nar, 'Narziss', NAME.nar); chat(wt(38), '<span style="color:#ff5555">Narziss starb am Ufer</span>'); }
    else { G.nar.scale.set(0.95, 0.95, 0.95); }
    if (sh.id === 'flower') { G.nar.visible = false; G.echo.visible = false; G.flower.visible = true; const g = smoother((t - wt(44)) / 0.8); G.flower.scale.setScalar(Math.max(0.001, g * 1.6)); G.flower.position.set(-0.75, 0.4, 0.05);
      mv(u, V(-0.2, 1.3, 2.0), V(-0.35, 1.2, 1.6), V(-0.75, 0.9, 0.05), V(-0.75, 0.95, 0.05), 44);
      tip(wt(48), 'flower', 'Narzisse', '#ffff55', ['<span style="color:#aaaaaa">Benannt nach Narziss</span>']); }
    if (sh.id === 'echovoice') { G.nar.visible = false; G.flower.visible = true; G.flower.scale.setScalar(1.6); G.flower.position.set(-0.75, 0.4, 0.05); G.echo.position.set(0.95, 0, 0.55); G.echo.rotation.set(0, -0.55, 0); pose2(G.echo, 'sadidle', t);
      const gone = t >= wt(52); G.echo.visible = !gone; G.poofE.position.set(0.95, 1.2, 0.55); updateBurst(G.poofE, t - wt(52), 2.2, 1.0);
      mv(u, V(1.8, 1.9, 4.4), V(1.6, 1.85, 3.9), V(0.4, 1.0, 0.4), V(0.4, 1.0, 0.4), 46); if (!gone) tag(G.echo, 'Echo', NAME.echo);
      chat(wt(52), '<span style="color:#ffff55">Echo hat das Spiel verlassen</span>'); say(wt(54), 'Echo', NAME.echo, '<span style="opacity:.7">…Stimme …Stimme …Stimme</span>'); }
  }
  // ---------- Heute / Stadt ----------
  const townShots = ['today', 'everyone', 'hundred', 'crown', 'admire', 'outside', 'hurt', 'meet', 'perfect', 'lovebomb', 'facade', 'outside2', 'friends'];
  if (townShots.includes(sh.id)) {
    scene = town; exp = 1.35; const Tn = town.userData; const { lena, max, crown, extras, grid, statue, cracks, chips, gifts, hearts } = Tn;
    grid.visible = sh.id === 'hundred'; crown.visible = sh.id === 'crown' || sh.id === 'admire'; cracks.visible = sh.id === 'facade' && t >= wt(181); gifts.visible = sh.id === 'perfect'; updateBurst(hearts, -1); updateBurst(chips, -1);
    extras.forEach(p => { p.visible = false; p.userData.phone.visible = false; }); lena.visible = max.visible = true; lena.userData.setFace({ smile: true }); max.userData.setFace({ smile: true });
    const park = (arr) => arr.forEach((p, i) => p.position.set(-80 - i * 2, 0, 0));
    if (sh.id === 'today') { lena.visible = max.visible = false; extras.forEach((p, i) => { p.visible = true; p.position.set(-6 + i * 1.8, 0, 12 + (i % 2) * 1.5); p.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2; pose3(p, 'walk', t, i); p.position.x += ((t - sh.a) * (i % 2 ? 1.6 : -1.6)); });
      mv(u, V(22, 14, 40), V(18, 12.5, 36), V(-2, 3, 6), V(-2, 3, 4), 46); info(wt(56), 'Heute'); }
    if (sh.id === 'everyone') { lena.visible = max.visible = false; extras.forEach((p, i) => { p.visible = true; p.userData.phone.visible = true; p.position.set(-4 + (i % 4) * 2.4, 0, 2 + Math.floor(i / 4) * 2.2); p.rotation.y = 0.3 - (i % 4) * 0.2; pose3(p, 'selfie', t, i); });
      mv(u, V(0, 2.4, 10), V(0, 2.3, 9), V(-0.2, 1.5, 2.5), V(-0.2, 1.5, 2.5), 48); }
    if (sh.id === 'hundred') { lena.visible = max.visible = false; Tn.gpeople.forEach((p, i) => pose2(p, 'idle', t, i)); const g = grid.position;
      mv(u, V(g.x + 0.1, 17, g.z + 9), V(g.x + 0.1, 15.5, g.z + 8), V(g.x, 0, g.z + 0.3), V(g.x, 0, g.z + 0.3), 46);
      if (t >= wt(68)) ui.tags.push([Tn.special.localToWorld(V(0, 2.3, 0)), '1 von 100', '#ff5555']); }
    if (sh.id === 'crown' || sh.id === 'admire') { const st = Tn.stage.position; max.position.set(st.x, 1.0, st.z + 0.2); max.rotation.set(0, 0, 0); pose3(max, 'pose', t); lena.visible = false;
      extras.forEach((p, i) => { p.visible = sh.id === 'admire'; p.position.set(st.x - 4.5 + i * 1.3, 0, st.z + 4 + (i % 2) * 1.2); p.rotation.y = Math.PI + (i - 3.5) * 0.08; pose3(p, 'clap', t, i); });
      if (sh.id === 'crown') mv(u, V(st.x + 0.6, 2.6, st.z + 3.6), V(st.x + 0.5, 2.6, st.z + 3.0), V(st.x, 2.4, st.z), V(st.x, 2.45, st.z), 44);
      else mv(u, V(st.x + 2, 3.2, st.z + 9.5), V(st.x + 1.6, 3.1, st.z + 8.8), V(st.x, 1.8, st.z + 1), V(st.x, 1.8, st.z + 1), 48);
      tag(max, 'Max', maxCol, 0.25);
      if (t >= wt(81)) ui.tip = { o: clamp01((t - wt(81)) / 0.1), icon: 'mask', title: 'Narzisstische Persönlichkeitsstörung', titleCol: '#ffaa00', lines: [
        '<span style="color:#aaaaaa">· hält sich für etwas Besonderes</span>', t >= wt(84) ? '<span style="color:#aaaaaa">· braucht ständig Bewunderung</span>' : '', t >= wt(87) ? '<span style="color:#ff5555">· kaum Mitgefühl</span>' : ''].filter(Boolean) }; }
    if (sh.id === 'outside') { lena.visible = false; const lx = -10 + (t - sh.a) * 1.7; max.position.set(lx, 0, 19.5); max.rotation.set(0, Math.PI / 2, 0); pose3(max, 'walk', t); max.userData.head.rotation.x = -0.15;
      cam(V(lx + 3.4, 1.7, 24.2), V(lx + 0.4, 1.35, 19.5), 46); tag(max, 'Max', maxCol); if (t >= wt(95)) ui.eff = { o: clamp01((t - wt(95)) / 0.15), name: 'Selbstbewusstsein?', time: '∞', col: '#ffd23f' }; }
    if (sh.id === 'hurt') { lena.visible = false; max.position.set(20, 0, -3.6); max.rotation.set(0, 0, 0); pose3(max, 'point', t);
      extras.slice(0, 3).forEach((p, i) => { p.visible = true; p.position.set(18.6 + i * 1.4, 0, -1.2); p.rotation.y = Math.PI + (i - 1) * 0.3; p.userData.setFace({ sad: true }); pose2(p, 'sadidle', t, i); });
      mv(u, V(21.4, 1.9, 2.4), V(21.2, 1.85, 1.8), V(19.8, 1.3, -2.2), V(19.8, 1.3, -2.2), 50); tag(max, 'Max', maxCol); }
    else extras.forEach(p => p.userData.setFace({}));
    if (sh.id === 'meet' || sh.id === 'perfect' || sh.id === 'lovebomb') { lena.position.set(-29.3, 0, 9.4); lena.rotation.set(0, 0.6, 0); max.position.set(-27.9, 0, 9.4); max.rotation.set(0, -0.6, 0);
      pose3(lena, sh.id === 'meet' ? 'idle' : 'laugh', t); pose3(max, sh.id === 'perfect' ? 'give' : 'idle', t, 1);
      if (sh.id === 'meet') mv(u, V(-28.6, 1.65, 14.2), V(-28.6, 1.6, 13.4), V(-28.6, 1.3, 9.4), V(-28.6, 1.3, 9.4), 46);
      if (sh.id === 'perfect') { mv(u, V(-28.6, 1.75, 13.6), V(-28.6, 1.7, 13.0), V(-28.6, 1.2, 9.4), V(-28.6, 1.2, 9.4), 46);
        gifts.children.forEach((g, i) => { const t0 = wt(115) + i * 0.12; const k = clamp01((t - t0) / 0.5); g.visible = t >= t0; g.position.set(-29.6 + (i % 3) * 0.55, lerp(4, 0.15 + Math.floor(i / 3) * 0.31, smoother(k)), 10.3 + (i % 2) * 0.2); g.rotation.y = i; });
        say(wt(116), 'Max', maxCol, 'Du bist perfekt ❤'); say(wt(116) + 0.35, 'Max', maxCol, 'So eine wie dich gibt es nur einmal ❤'); }
      if (sh.id === 'lovebomb') { mv(u, V(-27.6, 2.2, 13.8), V(-27.9, 2.1, 12.8), V(-28.6, 1.4, 9.4), V(-28.6, 1.4, 9.4), 48); hearts.position.set(-28.6, 3.4, 9.4); updateBurst(hearts, ((t - sh.a) % 1.4), 1.6, 1.4);
        tip(wt(125), 'heart', 'Love Bombing', '#ff55aa', ['<span style="color:#aaaaaa">Übertriebene Zuneigung,</span>', '<span style="color:#aaaaaa">um dich schnell an sich zu binden</span>']); }
      tag(lena, 'Lena', NAME.lena); tag(max, 'Max', maxCol); }
    if (sh.id === 'facade') { lena.visible = max.visible = false; const s = statue.position;
      mv(u, V(s.x + 5.5, 3.2, s.z + 13), V(s.x + 4.2, 3.6, s.z + 11.5), V(s.x, 4.8, s.z), V(s.x, 4.8, s.z), 48); updateBurst(chips, t - wt(181), 2.2, 1.2);
      ui.tags.push([V(s.x, 8.6, s.z), 'Max (Fassade)', '#ffd23f']);
      tip(wt(176), 'mask', 'Fassade', '#ffd23f', [t >= wt(181) ? '<span style="color:#ff5555">Haltbarkeit: 3 / 100</span>' : '<span style="color:#aaaaaa">Haltbarkeit: 100 / 100</span>', '<span style="color:#aaaaaa">Innen: zerbrechliches Selbstwertgefühl</span>']); }
    if (sh.id === 'outside2') { max.visible = false; lena.position.set(-5.2, 0, 29.2); lena.rotation.set(0, 0, 0); pose3(lena, 'idle', t); lena.userData.setFace({});
      mv(u, V(-3.6, 1.7, 23.4), V(-3.8, 1.68, 24.2), V(-5.2, 1.4, 29.6), V(-5.2, 1.4, 29.6), 46); tag(lena, 'Lena', NAME.lena); chat(wt(227), '<span style="color:#aaaaaa">Lena hat die Nachricht ignoriert</span>'); }
    if (sh.id === 'friends') { max.visible = false; lena.position.set(22, 0, -1.2); lena.rotation.set(0, 0, 0); pose3(lena, 'laugh', t);
      extras.slice(0, 3).forEach((p, i) => { p.visible = true; p.position.set(20.6 + i * 1.4 + (i > 0 ? 0.9 : 0), 0, -0.6 + (i === 1 ? -0.8 : 0)); p.rotation.y = i === 0 ? 0.7 : i === 1 ? 0 : -0.7; pose3(p, 'laugh', t, i); });
      mv(u, V(22.6, 1.8, 5.4), V(22.4, 1.75, 4.6), V(22.2, 1.3, -1), V(22.2, 1.3, -1), 48); tag(lena, 'Lena', NAME.lena);
      if (t >= wt(234)) ui.eff = { o: clamp01((t - wt(234)) / 0.15), name: 'Selbstwert', time: '+∞', col: '#55ff55' }; }
  }
  // ---------- Lenas Wohnung ----------
  const roomShots = ['msgs', 'critic', 'gaslight1', 'gaslight2', 'doubt', 'sorry', 'attack', 'rage', 'charm', 'hoover'];
  if (roomShots.includes(sh.id)) {
    scene = room; exp = 1.4; const R = room.userData; const { lena, rLena, max } = R;
    R.blanket.visible = sh.id === 'msgs'; R.phone.visible = sh.id === 'msgs'; R.flowers.visible = sh.id === 'charm' || sh.id === 'hoover'; R.bag.visible = sh.id === 'charm' || sh.id === 'hoover'; rLena.visible = false; max.visible = true; lena.visible = true;
    updateBurst(R.suck, -1); R.door.rotation.y = 0; lena.userData.setFace({}); max.userData.setFace({ smile: true }); rLena.userData.setFace({});
    R.phoneL.intensity = sh.id === 'msgs' ? 4 : 0; R.phoneL.position.set(-2.7, 1.5, 1.3);
    const mood = sh.id === 'msgs' ? 'night' : (t >= wt(129) ? 'cold' : 'warm'); roomMood(mood, t); R.drawClock(sh.id === 'msgs' ? 3 : 7, sh.id === 'msgs' ? 5 + (t - sh.a) * 8 : 30);
    const duo = () => { lena.position.set(-0.6, 0, -1.0); lena.rotation.set(0, 0.55, 0); max.position.set(1.0, 0, -1.2); max.rotation.set(0, -0.65, 0); };
    if (sh.id === 'msgs') { max.visible = false; exp = 2.2; R.hemi.intensity = 0.55; R.lamp.intensity = 1.2; const L = lena; pose(L, 'idle', 0); L.rotation.set(-Math.PI / 2, 0, 0); L.position.set(-2.7, 0.7, 2.35); pose3(L, 'phone', t); L.userData.armR.rotation.x = -2.6; L.userData.armL.rotation.x = 0;
      mv(u, V(-1.2, 2.6, 3.2), V(-1.4, 2.5, 3.0), V(-2.7, 0.9, 1.0), V(-2.7, 0.9, 1.0), 50);
      const msgs = ['[23:41] Gute Nacht, Prinzessin ❤', '[01:12] Ich vermisse dich jetzt schon', '[02:30] Bist du noch wach?', '[03:05] Du bist mein Ein und Alles ❤'];
      msgs.forEach((m, i) => say(wt(117) + i * 0.35, 'Max', maxCol, m)); }
    if (['critic', 'gaslight1', 'gaslight2', 'sorry', 'attack', 'rage'].includes(sh.id)) { duo(); tag(lena, 'Lena', NAME.lena); tag(max, 'Max', maxCol);
      pose3(lena, sh.id === 'sorry' || sh.id === 'gaslight2' ? 'sadidle' : 'idle', t); if (['sorry', 'gaslight2', 'rage'].includes(sh.id)) lena.userData.setFace({ sad: true });
      pose3(max, { critic: 'point', gaslight1: 'cross', gaslight2: 'cross', sorry: 'cross', attack: 'idle', rage: t >= wt(198) ? 'turned' : 'angry' }[sh.id], t);
      if (sh.id === 'critic' || sh.id === 'gaslight1') max.userData.setFace({});
      if (sh.id === 'rage') { max.userData.setFace(t < wt(198) ? { angry: true } : {}); if (t >= wt(198)) max.rotation.y = -0.65 + Math.PI; }
      if (sh.id === 'critic') { mv(u, V(0.3, 1.8, 3.6), V(0.25, 1.75, 3.0), V(0.2, 1.3, -1.1), V(0.2, 1.3, -1.1), 48);
        say(wt(134), 'Max', maxCol, 'Deine Freunde sind peinlich.'); say(wt(136), 'Max', maxCol, 'So gehst du nicht raus.'); say(wt(138), 'Max', maxCol, 'Was für eine dumme Idee.'); }
      if (sh.id === 'gaslight1') { mv(u, V(-1.6, 1.75, 2.0), V(-1.4, 1.72, 1.6), V(0.4, 1.5, -1.2), V(0.4, 1.5, -1.2), 46); say(wt(142), 'Lena', NAME.lena, 'Das war gemein!'); say(wt(145), 'Max', maxCol, 'Das bildest du dir nur ein.'); }
      if (sh.id === 'gaslight2') { R.lamp.intensity = 2.5 + Math.abs(Math.sin(t * 13)) * 2 * (Math.sin(t * 3) > 0 ? 1 : 0.3); mv(u, V(1.8, 2.0, 2.8), V(1.6, 1.95, 2.3), V(0.0, 1.3, -1.1), V(0.0, 1.3, -1.1), 48);
        tip(wt(154), 'lamp', 'Gaslighting', '#ff5555', ['<span style="color:#aaaaaa">Dir wird eingeredet,</span>', '<span style="color:#aaaaaa">deine Wahrnehmung sei falsch</span>']); }
      if (sh.id === 'sorry') { mv(u, V(0.5, 1.75, 2.0), V(0.4, 1.72, 1.6), V(-0.3, 1.4, -1.1), V(-0.3, 1.4, -1.1), 46); say(wt(164), 'Lena', NAME.lena, 'Sorry.'); say(wt(166), 'Lena', NAME.lena, 'Tut mir leid.'); say(wt(170), 'Lena', NAME.lena, 'Sorry, mein Fehler…'); }
      if (sh.id === 'attack') { mv(u, V(2.4, 1.8, 2.2), V(2.2, 1.78, 1.8), V(0.8, 1.55, -1.2), V(0.8, 1.55, -1.2), 44); say(wt(184), 'Lena', NAME.lena, 'Das war nicht so gut.');
        const hit = t >= wt(193); if (hit) { ui.flash = clamp01(1 - (t - wt(193)) / 0.35); max.userData.setFace({ angry: true }); } ui.hp = hit ? 3 : 10; }
      if (sh.id === 'rage') { mv(u, V(1.9, 1.85, 2.0), V(1.7, 1.82, 1.6), V(0.9, 1.55, -1.2), V(0.9, 1.55, -1.2), 44); if (t >= wt(199)) info(wt(199), 'Max schweigt seit 3 Tagen'); } }
    if (sh.id === 'doubt') { max.visible = false; lena.visible = true; rLena.visible = true; lena.userData.setFace({ sad: true }); rLena.userData.setFace({ sad: true });
      lena.position.set(2.0, 0, -2.75); lena.rotation.set(0, Math.PI, 0); rLena.position.set(2.0, 0, -5.25); rLena.rotation.set(0, 0, 0); pose2(lena, 'sadidle', t); pose2(rLena, 'sadidle', t);
      mv(u, V(2.95, 1.78, -1.15), V(2.85, 1.75, -1.55), V(2.05, 1.5, -4.6), V(2.05, 1.5, -4.6), 46); tag(rLena, 'Lena', NAME.lena);
      if (t >= wt(162)) ui.eff = { o: clamp01((t - wt(162)) / 0.15), name: 'Selbstzweifel', time: '∞', col: '#ff5555' }; }
    if (sh.id === 'charm' || sh.id === 'hoover') { const k = smoother((t - wt(201)) / 1.2); lena.position.set(lerp(1.4, 3.2, k), 0, lerp(-0.6, -0.1, k)); lena.rotation.set(0, Math.PI / 2, 0); pose3(lena, k < 1 && sh.id === 'charm' ? 'walk' : 'idle', t);
      R.door.rotation.y = -1.2 * smoother((t - wt(201) - 0.6) / 0.6);
      max.position.set(0.4, 0, -0.4); max.rotation.set(0, Math.PI / 2, 0); max.userData.baseY = 0; pose3(max, t >= wt(206) ? 'kneel' : 'idle', t);
      if (sh.id === 'charm') { mv(u, V(1.4, 1.8, 4.6), V(1.5, 1.75, 4.1), V(1.5, 1.0, -0.3), V(1.5, 1.0, -0.3), 50); say(wt(210), 'Max', NAME.max, 'Ich ändere mich, versprochen! ❤'); }
      if (sh.id === 'hoover') { mv(u, V(1.2, 2.2, 4.4), V(1.3, 2.1, 3.9), V(1.4, 0.9, -0.3), V(1.4, 0.9, -0.3), 50); R.suck.position.set(0.6, 1.0, -0.4);
        R.suck.visible = true; R.suck.children.forEach((m, i) => { const ph = ((t * 0.9 + i / 40) % 1); const v = m.userData.v; m.position.set(v.x * 3 * (1 - ph) + (1 - ph) * 2.4, v.y * 1.5 * (1 - ph), v.z * 2 * (1 - ph)); m.material.opacity = Math.min(1, ph * 3) * (1 - ph * 0.3); m.scale.setScalar(1); });
        tip(wt(217), 'vacuum', 'Hoovering', '#ff5555', ['<span style="color:#aaaaaa">Wie ein Staubsauger:</span>', '<span style="color:#aaaaaa">er will dich zurückziehen</span>']); }
      tag(lena, 'Lena', NAME.lena); tag(max, 'Max', sh.id === 'charm' ? NAME.max : maxCol, -0.3); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 2.5, 0), V(0, 2.55, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  flower: '<rect x="3" y="4" width="1" height="4" fill="#3a8a2a"/><rect x="2" y="1" width="3" height="3" fill="#faf6e8"/><rect x="3" y="2" width="1" height="1" fill="#f0c020"/>',
  mask: '<rect x="1" y="2" width="6" height="4" fill="#f0c030"/><rect x="2" y="3" width="1" height="1" fill="#222"/><rect x="5" y="3" width="1" height="1" fill="#222"/><rect x="3" y="5" width="2" height="1" fill="#a07010"/>',
  heart: '<rect x="1" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="5" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="1" y="3" width="6" height="2" fill="#ff4a6a"/><rect x="2" y="5" width="4" height="1" fill="#ff4a6a"/><rect x="3" y="6" width="2" height="1" fill="#ff4a6a"/>',
  lamp: '<rect x="3" y="0" width="2" height="1" fill="#555"/><rect x="2" y="1" width="4" height="4" fill="#ffd070"/><rect x="3" y="5" width="2" height="2" fill="#777"/>',
  vacuum: '<rect x="1" y="4" width="4" height="3" fill="#c03030"/><rect x="5" y="1" width="1" height="5" fill="#555"/><rect x="5" y="1" width="2" height="1" fill="#555"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const NUM = { 'zweitausend': '2000', 'hundert': '100' }; if (NUM[txt]) txt = NUM[txt];
    const f = clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.slice(-5).join('<br>');
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#2a2a2a"/><rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/></svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div><div style="color:#aaaaaa">${ui.eff.time}</div></div></div>`;
  if (ui.hp != null) { let h = ''; for (let i = 0; i < 10; i++) h += `<svg width="44" height="44" viewBox="0 0 8 8" shape-rendering="crispEdges">${i < ui.hp ? ICONS.heart : ICONS.heart.replaceAll('#ff4a6a', '#3a1a1a')}</svg>`; ex += `<div class="hp">${h}</div>`; }
  if (ui.flash > 0) ex += `<div class="flash" style="opacity:${ui.flash}"></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
