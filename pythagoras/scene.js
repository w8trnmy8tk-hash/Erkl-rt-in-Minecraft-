// „Satz des Pythagoras, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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


// ---------- Figuren ----------
const PYTH = { skin: 0xe0a882, hair: 0xe6e6e6, beard: 'full', beardCol: 0xf2f2f2, top: 0xf4f0e6, bottom: 0xf4f0e6, coat: true, shoe: 0x8a5a2a, eye: '#3a2a1a', smile: true, seed: 51 };
const STUD = { skin: 0xd8a07a, hair: 0x3a2414, hairVol: true, top: 0x3a7ac8, bottom: 0x3a7ac8, coat: true, belt: 0xc8a040, shoe: 0x6a4a2a, eye: '#3a2a1a', smile: true, seed: 52 };
const BAU = { skin: 0xb07a52, hair: 0x1a1410, beard: 'full', beardCol: 0x1a1410, top: 0xc8902a, bottom: 0x8a5a2a, coat: true, belt: 0x6a3a1a, hat: 'cap', hatCol: 0x7a2a2a, eye: '#2a1a10', seed: 53 };
const SCHR = { skin: 0xa87048, hair: 0x1a1410, bald: true, beard: 'short', beardCol: 0x1a1410, top: 0xe8dcc0, bottom: 0xe8dcc0, coat: true, belt: 0x3a6a8a, eye: '#2a1a10', smile: true, seed: 54 };
const HIST = { skin: 0xf0c4a2, hair: 0x9a9a9a, hairVol: true, top: 0x6a4a3a, bottom: 0x3a3a42, tie: 0x8a2a2a, shoe: 0x2a1a10, eye: '#3a4a6a', seed: 55 };
const EUK = { skin: 0xe8b894, hair: 0x5a4a3a, beard: 'full', beardCol: 0x5a4a3a, top: 0x2a5a9a, bottom: 0x2a5a9a, coat: true, belt: 0xe0c060, shoe: 0x6a4a2a, eye: '#2a1a10', seed: 56 };
const HAND = { skin: 0xe8b894, hair: 0x6a4422, top: 0xe87a20, bottom: 0x2a3a6a, shoe: 0x3a2a1a, eye: '#3a5a8a', smile: true, seed: 57 };
const PLAYER = { skin: 0xe8b894, hair: 0x5a3820, hairVol: true, top: 0x3ab8b8, bottom: 0x3a3aa8, shoe: 0x4a4a4a, eye: '#3a5a9a', seed: 58 };
const ENEMY = { skin: 0x5a9a4a, hair: 0x3a6a2a, bald: true, top: 0x3a8aa8, bottom: 0x3a3a8a, shoe: 0x2a2a3a, eye: '#101010', angry: true, seed: 59 };
function sash(ch, col) { const s = box(0.1, 0.86, 0.3, C(col), 0, 1.08, 0, { cast: false }); s.rotation.z = 0.75; ch.userData.body.add(s); }
function glasses(ch) { const m = C(0x1a1a1a); ch.userData.head.add(box(0.44, 0.06, 0.03, m, 0, 0.27, 0.26, { cast: false })); }
function hardhat(ch) { const hc = C(0xf0c020); ch.userData.head.add(box(0.58, 0.16, 0.58, hc, 0, 0.56, 0)); ch.userData.head.add(box(0.5, 0.04, 0.2, hc, 0, 0.5, 0.33)); ch.userData.hatExtra = 0.12; }
const scrollMesh = () => { const g = new THREE.Group(); g.add(box(0.1, 0.1, 0.42, C(0xe8dcb0), 0, 0, 0.12)); g.add(box(0.12, 0.12, 0.06, C(0x8a5a2a), 0, 0, -0.08)); g.add(box(0.12, 0.12, 0.06, C(0x8a5a2a), 0, 0, 0.32)); return g; };
const tabletMesh = () => { const g = new THREE.Group(); g.add(box(0.34, 0.42, 0.07, C(0xb08a5a), 0, 0.05, 0.12)); return g; };
const swordMesh = () => { const g = new THREE.Group(); g.add(box(0.06, 0.06, 0.2, C(0x5a3a1a), 0, 0, 0.05)); g.add(box(0.24, 0.05, 0.05, C(0x8a8a8a), 0, 0, 0.15)); g.add(box(0.08, 0.03, 0.75, C(0xd8e4ec, { metal: 0.6, rough: 0.3 }), 0, 0, 0.55)); return g; };
const tapeMesh = () => { const g = new THREE.Group(); g.add(box(0.18, 0.18, 0.1, C(0xf0c020), 0, 0, 0.1)); return g; };
function ox(scene, x, z, ry, seed) { const g = new THREE.Group(), r = rng(seed); const col = [0x7a4a2a, 0x5a3a22, 0x9a6a3a, 0xe8e0d0][Math.floor(r() * 4)]; const m = C(col), dark = C(shade(col, 0.6));
  g.add(box(0.9, 0.9, 1.7, m, 0, 1.05, 0)); for (const [lx, lz] of [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]]) g.add(box(0.24, 0.6, 0.24, dark, lx, 0.3, lz));
  const h = new THREE.Group(); h.position.set(0, 1.35, 1.0); h.add(box(0.62, 0.6, 0.6, m, 0, 0, 0.1)); h.add(box(0.4, 0.26, 0.12, C(0xd8a8a0), 0, -0.14, 0.42)); h.add(box(0.9, 0.1, 0.1, C(0xf0ead8), 0, 0.3, 0)); h.add(box(0.1, 0.24, 0.1, C(0xf0ead8), -0.45, 0.42, 0)); h.add(box(0.1, 0.24, 0.1, C(0xf0ead8), 0.45, 0.42, 0));
  h.add(box(0.1, 0.1, 0.02, C(0x111111), -0.18, 0.08, 0.41, { cast: false })); h.add(box(0.1, 0.1, 0.02, C(0x111111), 0.18, 0.08, 0.41, { cast: false })); g.add(h);
  g.position.set(x, 0, z); g.rotation.y = ry; g.userData.head = h; scene.add(g); return g; }
function olive(scene, x, z, s = 1) { scene.add(box(0.5 * s, 2.2 * s, 0.5 * s, C(0x6a5a44), x, 1.1 * s, z)); const lm = C(0x7a8a5a), lm2 = C(0x5f7448);
  scene.add(box(3.0 * s, 1.4 * s, 3.0 * s, lm, x, 2.8 * s, z)); scene.add(box(2.0 * s, 1.0 * s, 2.0 * s, lm2, x + 0.4 * s, 3.7 * s, z - 0.3 * s)); }
function cypress(scene, x, z, h = 7) { scene.add(box(0.4, 1.2, 0.4, C(0x5a4630), x, 0.6, z)); scene.add(box(1.3, h * 0.6, 1.3, C(0x2f5a32), x, 1.0 + h * 0.3, z)); scene.add(box(0.9, h * 0.3, 0.9, C(0x2a5030), x, 1.0 + h * 0.6 + h * 0.12, z)); }
function palmTree(scene, x, z, h = 6) { for (let i = 0; i < h; i++) scene.add(box(0.45, 1, 0.45, C(0x7a5a3a), x + Math.sin(i * 0.4) * 0.15 * i / h, i + 0.5, z)); const lm = C(0x3a8a32);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; scene.add(box(Math.abs(Math.cos(a)) * 2.6 + 0.5, 0.25, Math.abs(Math.sin(a)) * 2.6 + 0.5, lm, x + Math.cos(a) * 1.3, h + 0.1, z + Math.sin(a) * 1.3)); } scene.add(box(1.0, 0.5, 1.0, C(0x4a9a3a), x, h + 0.3, z)); }
const fire = (scene, x, y, z, seed) => { const g = new THREE.Group(); g.position.set(x, y, z); const r = rng(seed); const ms = [0xffd040, 0xff9a20, 0xff5a10].map(c => new THREE.MeshBasicMaterial({ color: c }));
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), ms[i % 3]); b.userData = { ox: (r() - 0.5) * 0.5, oz: (r() - 0.5) * 0.5, p: r() }; g.add(b); }
  g.userData.update = t => g.children.forEach(b => { if (!b.userData.p && b.userData.p !== 0) return; const u = (t * 1.3 + b.userData.p) % 1; b.position.set(b.userData.ox * (1 - u), u * 0.9, b.userData.oz * (1 - u)); b.scale.setScalar(1.2 - u); });
  scene.add(g); return g; };

// =====================================================================
// Das Dreieck (3-4-5) mit Quadraten – Herzstück, steht im Hof in Griechenland
// =====================================================================
const OX = -0.5, OZ = -6, QH = 0.5; // rechter Winkel bei O; a = 3 (nach +x), b = 4 (nach −z)
const A2 = [OX + 3, OZ], B2 = [OX, OZ - 4];
const HU = [(B2[0] - A2[0]) / 5, (B2[1] - A2[1]) / 5], HV = [HU[1] * -1, HU[0]]; // u entlang AB, v nach außen
{ const mx = (A2[0] + B2[0]) / 2 - OX, mz = (A2[1] + B2[1]) / 2 - OZ; if (HV[0] * mx + HV[1] * mz < 0) { HV[0] *= -1; HV[1] *= -1; } }
const HROT = Math.atan2(-HU[1], HU[0]);
const cellA = (i, j) => V(OX + i + 0.5, 0, OZ + j + 0.5);           // 3×3, z von −6 bis −3
const cellB = (i, j) => V(OX - 4 + i + 0.5, 0, OZ - 4 + j + 0.5);   // 4×4
const cellC = (i, j) => V(A2[0] + (i + 0.5) * HU[0] + (j + 0.5) * HV[0], 0, A2[1] + (i + 0.5) * HU[1] + (j + 0.5) * HV[1]);
const centerA = V(OX + 1.5, 0, OZ + 1.5), centerB = V(OX - 2, 0, OZ - 2), centerC = cellC(2, 2);
function woolTex(col, seed) { return tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, col, 0.07); for (let i = 0; i < 16; i++) { px(c, i, 0, shade(col, 0.7)); px(c, 0, i, shade(col, 0.7)); px(c, i, 15, shade(col, 0.78)); px(c, 15, i, shade(col, 0.78)); } }, seed); }
const QCOL = { a: 0xd8402e, b: 0x2e7ad8, c: 0xf0c02a };
function mkQuadMat(col, seed) { return new THREE.MeshStandardMaterial({ map: woolTex(col, seed), roughness: 0.85, emissive: col, emissiveMap: woolTex(col, seed + 1), emissiveIntensity: 0 }); }

const greece = new THREE.Scene();
{
  const sky = skyDome(greece, 0x3a6ec0, 0x8ab8e8, 0xffd8a8, V(-0.6, 0.32, 0.6), [1, 0.8, 0.55]); greece.fog = new THREE.Fog(0xf2d4b0, 80, 420); clouds(greece, 5, 0xfff4e8, 70, 16, 220, 0.85);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x2a78b8, roughness: 0.35, metalness: 0.1 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -2.0; greece.add(sea);
  greece.add(box(140, 3, 90, M(T.grass), 0, -1.5, -5, { cast: false })); greece.add(box(140, 2.2, 90, M(T.sand), 0, -1.9, -6.5, { cast: false }));
  const marble = M(tileTex(0xece6d8, 0xc8c0ae, 3001)), marble2 = M(tileTex(0xf4f0e6, 0xd4ccbc, 3002));
  greece.add(box(34, 0.1, 34, marble, 1, 0.05, -6, { cast: false, uvScale: 0.5 }));
  // Tempel
  const tp = new THREE.Group(); tp.position.set(1, 0, -26); greece.add(tp);
  for (let s = 0; s < 3; s++) tp.add(box(20 - s * 1.2, 0.5, 12 - s * 1.2, marble2, 0, 0.25 + s * 0.5, 0));
  for (let x = -8; x <= 8; x += 2.3) for (const z of [-4.4, 4.4]) { tp.add(box(0.9, 6, 0.9, marble2, x, 4.5, z)); tp.add(box(1.2, 0.3, 1.2, marble, x, 1.6, z)); tp.add(box(1.2, 0.3, 1.2, marble, x, 7.4, z)); }
  tp.add(box(19, 0.9, 10.6, marble2, 0, 8.0, 0)); for (let s = 0; s < 4; s++) tp.add(box(19 - s * 4.6, 0.7, 10.8, M(T.roofRed), 0, 8.8 + s * 0.7, 0));
  tp.add(box(8, 5.4, 6, marble, 0, 4.2, 0));
  // Häuser, Bäume
  const house = (x, z, w, h, d = 5) => { const g = new THREE.Group(); g.position.set(x, 0, z); greece.add(g); g.add(box(w, h, d, M(T.white), 0, h / 2, 0)); for (let s = 0; s < 3; s++) g.add(box(w + 0.4 - s * w / 3, 0.5, d + 0.4, M(T.roofRed), 0, h + 0.25 + s * 0.5, 0)); g.add(box(1, 1.9, 0.1, C(0x3a6ab8), 0, 0.95, d / 2 + 0.02, { cast: false })); g.add(box(0.8, 0.8, 0.1, C(0x2a4a8a), w / 2 - 1, 2.2, d / 2 + 0.02, { cast: false })); };
  for (const [x, z, w, h] of [[-22, -8, 6, 4], [-26, -18, 7, 5], [24, -6, 6, 4], [28, -17, 7, 4.5], [-20, 8, 5, 3.6], [22, 9, 6, 4]]) house(x, z, w, h);
  for (const [x, z, s] of [[-9, -14, 1], [12, -15, 1.1], [-15, 4, 0.9], [15, 9, 1], [-6, 10, 1], [8, 12, 0.9], [-30, 0, 1.2], [32, 0, 1.1]]) olive(greece, x, z, s);
  for (const [x, z, h] of [[-8, -22, 8], [10, -22, 8], [-12, -20, 7], [14, -20, 7], [-34, -30, 9], [36, -30, 9]]) cypress(greece, x, z, h);
  // Dreieck-Boden + Kanten
  const triG = new THREE.BufferGeometry(); triG.setAttribute('position', new THREE.Float32BufferAttribute([OX, 0.12, OZ, B2[0], 0.12, B2[1], A2[0], 0.12, A2[1]], 3)); triG.computeVertexNormals();
  const tri = new THREE.Mesh(triG, new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: 0.9, side: THREE.DoubleSide })); tri.receiveShadow = true; greece.add(tri);
  const edge = (x0, z0, x1, z1, col) => { const L = Math.hypot(x1 - x0, z1 - z0); const e = box(L + 0.12, 0.16, 0.12, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, emissive: col, emissiveIntensity: 0.15 }), (x0 + x1) / 2, 0.14, (z0 + z1) / 2, { cast: false }); e.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); greece.add(e); return e; };
  const eA = edge(OX, OZ, A2[0], A2[1], 0x8a2a1a), eB = edge(OX, OZ, B2[0], B2[1], 0x1a4a8a), eC = edge(A2[0], A2[1], B2[0], B2[1], 0x9a7a10);
  const rmk = new THREE.Group(); rmk.add(box(0.5, 0.05, 0.06, C(0x202020), OX + 0.25, 0.15, OZ - 0.5, { cast: false })); rmk.add(box(0.06, 0.05, 0.5, C(0x202020), OX + 0.5, 0.15, OZ - 0.25, { cast: false })); greece.add(rmk);
  // Quadrate
  const mats = { a: mkQuadMat(QCOL.a, 3010), b: mkQuadMat(QCOL.b, 3012), c: mkQuadMat(QCOL.c, 3014) };
  const mkCube = (mat, p, rot = 0) => { const m = box(0.94, QH, 0.94, mat, p.x, QH / 2, p.z); m.rotation.y = rot; m.userData.home = p.clone(); greece.add(m); return m; };
  const qa = [], qb = [], qc = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) qa.push(mkCube(mats.a, cellA(i, j)));
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) qb.push(mkCube(mats.b, cellB(i, j)));
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) qc.push(mkCube(mats.c, cellC(i, j), HROT));
  // Flug-Würfel: 9 rote + 16 blaue füllen das große Quadrat
  const flyMatA = mkQuadMat(QCOL.a, 3020), flyMatB = mkQuadMat(QCOL.b, 3022); const fly = [];
  let ka = 0, kb = 0; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const red = i < 3 && j < 3; const src = red ? qa[ka++] : qb[kb++];
    const m = box(0.94, QH, 0.94, red ? flyMatA : flyMatB, 0, 0, 0); m.visible = false; greece.add(m); fly.push({ m, src, dst: cellC(i, j), red, k: fly.length }); }
  // goldener Rahmen (leeres großes Quadrat)
  const frame = new THREE.Group(); const fm = new THREE.MeshBasicMaterial({ color: 0xffd23f });
  const corners = [cellC(-0.5, -0.5), cellC(4.5, -0.5), cellC(4.5, 4.5), cellC(-0.5, 4.5)];
  for (let k = 0; k < 4; k++) { const p0 = corners[k], p1 = corners[(k + 1) % 4]; const L = p0.distanceTo(p1); const e = box(L, 0.08, 0.1, fm, (p0.x + p1.x) / 2, 0.2, (p0.z + p1.z) / 2, { cast: false }); e.rotation.y = Math.atan2(-(p1.z - p0.z), p1.x - p0.x); frame.add(e); }
  frame.visible = false; greece.add(frame);
  // Schule: Bänke, Tetraktys
  const benchM = M(tileTex(0xd8d0bc, 0xb0a890, 3030));
  for (const [x, z, r] of [[-13.5, 0.0, 0.6], [-10.5, 0.0, -0.6]]) { const b = box(2.6, 0.5, 0.8, benchM, x, 0.25, z); b.rotation.y = r; greece.add(b); }
  const peb = C(0xf4f4f0); for (let row = 0; row < 4; row++) for (let k = 0; k <= row; k++) greece.add(box(0.2, 0.14, 0.2, peb, -12 + (k - row / 2) * 0.42, 0.17, 0.2 + row * 0.38, { cast: false }));
  // Altar + Ochsen
  const alt = M(tileTex(0xd8d0bc, 0x9a9078, 3040)); greece.add(box(1.6, 1.1, 1.2, alt, 15, 0.55, -2)); const fireA = fire(greece, 15, 1.1, -2, 3041);
  const altLight = new THREE.PointLight(0xff9a40, 6, 7, 1.6); altLight.position.set(15, 2.0, -1.6); greece.add(altLight);
  const oxen = []; for (const [x, z, r] of [[18.6, -3.2, -1.2], [19.4, -0.6, -1.5], [20.6, -4.8, -1.0], [21.6, -1.8, -1.4], [18.2, 1.8, -1.9], [22.8, 0.8, -1.6], [23.4, -3.6, -1.2], [20.2, 3.2, -2.0]]) oxen.push(ox(greece, x, z, r, Math.round(x * 13 + z * 7)));
  const sun = sunLight(greece, 0xffdcae, 3.4, V(-34, 26, 34), V(0, 0, -6), 40); greece.add(new THREE.HemisphereLight(0xd8e4ff, 0x9a8a6a, 1.35));
  const pyth = humanoid(PYTH), stud = humanoid(STUD); laurel(pyth); sash(pyth, 0x7a2a8a); const pScroll = inHand(pyth, scrollMesh());
  const studs = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xe0a882, 0xc89a72, 0xf0c4a2, 0xd8a07a][i], hair: [0x2a1a14, 0x6a4422, 0x1a1a1a, 0x8a5a2a][i], top: [0xc8463a, 0x5a9a4a, 0xe8b830, 0x8a5ab8][i], bottom: [0xc8463a, 0x5a9a4a, 0xe8b830, 0x8a5ab8][i], coat: true, belt: 0x6a4a2a, longHair: i === 2, beard: i === 1 ? 'short' : undefined, smile: true, seed: 3050 + i }); greece.add(p); return p; });
  greece.add(pyth, stud);
  greece.userData = { sky, sun, pyth, stud, studs, qa, qb, qc, fly, frame, mats, flyMatA, flyMatB, eA, eB, eC, fireA, oxen, pScroll };
}

// =====================================================================
// Babylon – Zikkurat, Feld, Seil, Tontafel
// =====================================================================
const RB = [-4.5, -7], RU = 1.2; // Seil-Dreieck: rechter Winkel bei RB, Einheit 1,2 m
const babylon = new THREE.Scene();
{
  skyDome(babylon, 0x3a7ac8, 0x9ac4e8, 0xf2dcb4, V(-0.4, 0.55, 0.5)); babylon.fog = new THREE.Fog(0xf0dcb8, 90, 420); clouds(babylon, 11, 0xffffff, 70, 12, 220, 0.8);
  babylon.add(box(500, 1, 500, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xc8a470, 0.12), 4001)), 0, -0.5, 0, { cast: false }));
  const brick = M(tileTex(0xc89a62, 0x8a6a42, 4002)), brick2 = M(tileTex(0xb08454, 0x7a5a3a, 4003));
  const zg = new THREE.Group(); zg.position.set(4, 0, -55); babylon.add(zg); const ZS = [[34, 8], [24, 7], [15, 6], [8, 4]]; let zy = 0;
  ZS.forEach(([s, h], i) => { zg.add(box(s, h, s, i % 2 ? brick2 : brick, 0, zy + h / 2, 0)); zy += h; }); zg.add(box(5, 3, 5, M(tileTex(0x3a6ab8, 0x2a4a8a, 4004)), 0, zy + 1.5, 0));
  zg.add(box(4, zy, 18, brick2, 0, zy / 2 - 3, 20)); // Treppe
  // Fluss + Palmen
  const water = new THREE.Mesh(new THREE.PlaneGeometry(14, 600), new THREE.MeshStandardMaterial({ color: 0x3a8ab0, roughness: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.set(34, 0.03, 0); babylon.add(water);
  for (const [x, z, h] of [[24, 4, 6], [26, -8, 7], [25, -20, 6], [43, 2, 7], [44, -14, 6], [-20, -14, 6], [-26, 2, 7], [-16, 10, 6], [12, 12, 6]]) palmTree(babylon, x, z, h);
  // Feld (Weizen) mit Pflöcken
  const wheat = M(T.wheat); babylon.add(box(20, 0.35, 12, wheat, 8, 0.17, -20, { cast: false, uvScale: 1 })); babylon.add(box(16, 0.35, 10, M(T.grass), -16, 0.17, -24, { cast: false }));
  // Hütten (eine schief)
  const hut = (x, z, w, h, lean = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); babylon.add(g); const b = box(w, h, 4, brick, 0, h / 2, 0); g.add(b); g.add(box(w + 0.3, 0.3, 4.3, C(0x9a7a52), 0, h + 0.15, 0)); g.add(box(1, 1.8, 0.1, C(0x4a2e1a), 0, 0.9, 2.02, { cast: false })); g.rotation.z = lean; return g; };
  hut(-14, -6, 4, 3); hut(-19, -1, 5, 3.4); hut(14, -4, 4, 3);
  const crooked = new THREE.Group(); crooked.position.set(4, 0, -0.5); babylon.add(crooked);
  const w1 = box(4.2, 2.6, 0.5, brick, 0, 1.3, -1.6); w1.rotation.z = 0.14; w1.position.x = 0.2; const w2 = box(0.5, 2.6, 3.6, brick, -1.9, 1.3, 0.1); w2.rotation.y = 0.32; w2.rotation.x = -0.1;
  const w3 = box(0.5, 2.0, 3.2, brick2, 2.0, 1.0, 0.0); w3.rotation.y = -0.22; w3.rotation.z = -0.12; crooked.add(w1, w2, w3); const roofX = box(4.8, 0.25, 4.0, C(0x9a7a52), 0.2, 2.75, -0.1); roofX.rotation.z = 0.2; roofX.rotation.x = 0.06; crooked.add(roofX);
  for (let i = 0; i < 6; i++) crooked.add(box(0.5, 0.3, 0.3, brick, 2.8 + (i % 3) * 0.55, 0.15 + Math.floor(i / 3) * 0.3, 1.6));
  // Seil-Dreieck
  const stake = (x, z) => { babylon.add(box(0.14, 0.7, 0.14, C(0x6a4a2a), x, 0.35, z)); };
  const P0 = V(RB[0], 0, RB[1]), P1 = V(RB[0] + 4 * RU, 0, RB[1]), P2 = V(RB[0], 0, RB[1] - 3 * RU);
  [P0, P1, P2].forEach(p => stake(p.x, p.z));
  const ropeSeg = (pa, pb, n, col) => { const g = new THREE.Group(); const L = pa.distanceTo(pb); const r = box(L, 0.09, 0.09, C(0xc8a86a), (pa.x + pb.x) / 2, 0.55, (pa.z + pb.z) / 2, { cast: false }); r.rotation.y = Math.atan2(-(pb.z - pa.z), pb.x - pa.x); g.add(r);
    for (let k = 1; k < n; k++) { const p = pa.clone().lerp(pb, k / n); g.add(box(0.24, 0.24, 0.24, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 }), p.x, 0.55, p.z, { cast: false })); } g.visible = false; babylon.add(g); return g; };
  const rope3 = ropeSeg(P0, P2, 3, QCOL.a), rope4 = ropeSeg(P0, P1, 4, QCOL.b), rope5 = ropeSeg(P1, P2, 5, QCOL.c);
  const angleMk = new THREE.Group(); angleMk.add(box(0.6, 0.04, 0.08, new THREE.MeshBasicMaterial({ color: 0x55ff55 }), RB[0] + 0.3, 0.58, RB[1] - 0.6, { cast: false })); angleMk.add(box(0.08, 0.04, 0.6, new THREE.MeshBasicMaterial({ color: 0x55ff55 }), RB[0] + 0.6, 0.58, RB[1] - 0.3, { cast: false })); angleMk.visible = false; babylon.add(angleMk);
  // Schreiber-Tisch + Tontafel
  const tbl = new THREE.Group(); tbl.position.set(-13, 0, 4); babylon.add(tbl); tbl.add(box(2.0, 0.1, 1.1, M(T.planks), 0, 0.85, 0)); for (const x of [-0.85, 0.85]) tbl.add(box(0.12, 0.85, 0.9, C(0x6a4a2a), x, 0.42, 0));
  const ctex = tex(48, 64, (c, r) => { noiseFill(c, r, 48, 64, 0xb08a5a, 0.08); for (let row = 0; row < 15; row++) for (let col = 0; col < 4; col++) { const y = 3 + row * 4, x0 = 3 + col * 11; c.fillStyle = '#6a4a2a'; c.fillRect(x0, y, 1, 2); if (r() > 0.3) { c.fillRect(x0 + 2, y, 2, 1); c.fillRect(x0 + 3, y + 1, 1, 1); } if (r() > 0.4) c.fillRect(x0 + 5, y, 1, 2); if (r() > 0.5) { c.fillRect(x0 + 7, y, 2, 1); c.fillRect(x0 + 7, y + 1, 1, 1); } }
    c.fillStyle = '#7a5a3a'; for (let col = 1; col < 4; col++) c.fillRect(col * 11 + 1, 2, 1, 60); }, 4010);
  const tabM = [C(0x9a7a4a), C(0x9a7a4a), M(ctex), C(0x9a7a4a), C(0x9a7a4a), C(0x9a7a4a)];
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.8), tabM); tablet.position.set(-13.1, 0.94, 4.05); tablet.rotation.y = 0.15; tablet.castShadow = true; babylon.add(tablet);
  babylon.add(box(0.5, 0.06, 0.6, C(0xa08050), -12.3, 0.93, 3.9)); babylon.add(box(0.4, 0.3, 0.4, C(0x9a6a3a), -14.1, 0.99, 3.8));
  sunLight(babylon, 0xfff0d0, 3.4, V(-40, 60, 40), V(0, 0, -6), 45); babylon.add(new THREE.HemisphereLight(0xd8e8ff, 0x9a7a5a, 1.4));
  const bau = humanoid(BAU), schr = humanoid(SCHR); const sTab = inHand(schr, tabletMesh()); babylon.add(bau, schr);
  babylon.userData = { bau, schr, sTab, rope3, rope4, rope5, angleMk, P0, P1, P2 };
}

// =====================================================================
// Bibliothek (Historiker, Euklid)
// =====================================================================
const lib = new THREE.Scene(); lib.background = new THREE.Color(0x0a0806);
{
  const wall = M(tileTex(0xd8c8a4, 0xb0a07c, 5001)), floor = M(tileTex(0x9a7a5a, 0x6a5038, 5002, false)); room3(lib, 10, 8, 4.2, wall, floor);
  const shelfM = M(T.darkwood);
  const scrollTex = tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x3a2416, 0.05); for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x += 4) { c.fillStyle = hex(shade(0xe8d8b0, 0.85 + r() * 0.2)); c.fillRect(x, y, 3, 3); c.fillStyle = '#8a6a3a'; c.fillRect(x + 1, y + 1, 1, 1); } }, 5003);
  for (const x of [-3.2, 0, 3.2]) { lib.add(box(2.8, 3.6, 0.6, shelfM, x, 1.8, -3.6)); lib.add(box(2.6, 3.3, 0.1, M(x === 0 ? T.books : scrollTex), x, 1.85, -3.28, { cast: false })); }
  lib.add(box(0.6, 3.6, 2.6, shelfM, -4.6, 1.8, -1.2)); lib.add(box(0.1, 3.3, 2.4, M(scrollTex), -4.28, 1.85, -1.2, { cast: false }));
  lib.add(box(2.2, 0.1, 1.1, M(T.planks), 0.6, 0.85, -0.8)); for (const x of [-0.35, 1.55]) lib.add(box(0.12, 0.85, 0.9, C(0x5a3a1a), x, 0.42, -0.8));
  const btex = tex(32, 24, (c) => { c.fillStyle = '#efe4c8'; c.fillRect(0, 0, 32, 24); c.fillStyle = '#c8b890'; c.fillRect(15, 0, 2, 24);
    c.fillStyle = '#d8402e'; c.fillRect(4, 13, 4, 4); c.fillStyle = '#2e7ad8'; c.fillRect(8, 8, 5, 5); c.fillStyle = '#f0c02a'; c.fillRect(8, 13, 6, 6); c.fillStyle = '#3a2a1a'; for (let i = 0; i < 6; i++) c.fillRect(19, 4 + i * 3, 9 - (i % 2) * 3, 1); }, 5004);
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.6), [C(0x6a2a1a), C(0x6a2a1a), M(btex), C(0x6a2a1a), C(0x6a2a1a), C(0x6a2a1a)]); book.position.set(0.6, 0.93, -0.75); lib.add(book);
  lib.add(box(0.5, 0.08, 0.5, C(0x6a4a2a), 0.6, 0.48, -1.75)); // Hocker
  const lamp = new THREE.PointLight(0xffb060, 10, 9, 1.3); lamp.position.set(1.6, 1.4, -0.6); lib.add(lamp); lib.add(box(0.16, 0.24, 0.16, new THREE.MeshBasicMaterial({ color: 0xffc860 }), 1.55, 1.02, -0.9, { cast: false }));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ color: 0xbfe0ff })); win.position.set(4.83, 2.4, -1.4); win.rotation.y = -Math.PI / 2; lib.add(win);
  sunLight(lib, 0xffe8c8, 1.8, V(7, 8, 9), V(0, 0, -1), 7, 1024); lib.add(new THREE.HemisphereLight(0xffe8d0, 0x5a3a1a, 1.1));
  const hist = humanoid(HIST), euk = humanoid(EUK); glasses(hist); const hBook = inHand(hist, bookMesh(0x2a4a6a)); lib.add(hist, euk);
  lib.userData = { hist, euk };
}

// =====================================================================
// Baustelle (heute)
// =====================================================================
const site = new THREE.Scene();
{
  skyDome(site, 0x4a7ac8, 0x8ab4e0, 0xcfe2f0, V(-0.5, 0.45, 0.4)); site.fog = new THREE.Fog(0xcfe2f0, 80, 380); clouds(site, 3, 0xffffff, 60, 20, 200, 0.95);
  site.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false })); site.add(box(26, 0.06, 22, M(T.dirt), 0, 0.03, -4, { cast: false }));
  site.add(box(9, 0.3, 7, M(T.concrete), 1.5, 0.15, -6.5)); // Fundament, Ecke bei (-3, -3)
  const SC = V(-3, 0.32, -3);
  const sl = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0); const s = box(L, 0.03, 0.03, C(0xff5a8a), (x0 + x1) / 2, 0.34, (z0 + z1) / 2, { cast: false }); s.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); site.add(s); return s; };
  sl(-3, -3, 6, -3); sl(-3, -3, -3, -10);
  for (const [x, z] of [[6.2, -3], [-3, -10.2], [-3.2, -2.8]]) site.add(box(0.12, 0.8, 0.12, C(0x8a6a3a), x, 0.4, z));
  const tape = (x0, z0, x1, z1, col) => { const L = Math.hypot(x1 - x0, z1 - z0); const g = new THREE.Group(); const s = box(L, 0.02, 0.14, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25 }), (x0 + x1) / 2, 0.36, (z0 + z1) / 2, { cast: false }); s.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); g.add(s); g.visible = false; site.add(g); return g; };
  const tA = tape(-3, -3, -3, -6, QCOL.a), tB = tape(-3, -3, 1, -3, QCOL.b), tC = tape(1, -3, -3, -6, QCOL.c);
  // Rohbau-Wände
  const bw = M(T.brickGrey); site.add(box(9, 1.2, 0.4, bw, 1.5, 0.9, -9.8)); site.add(box(0.4, 1.2, 6.4, bw, 5.8, 0.9, -6.6));
  for (let i = 0; i < 8; i++) site.add(box(0.8, 0.3, 0.4, bw, 8 + (i % 4) * 0.82, 0.15 + Math.floor(i / 4) * 0.3, -1.5));
  // Kran
  const crane = new THREE.Group(); crane.position.set(10, 0, -16); site.add(crane); const ym = C(0xf0b820, { metal: 0.3, rough: 0.6 });
  crane.add(box(1.2, 24, 1.2, ym, 0, 12, 0)); crane.add(box(20, 0.9, 0.9, ym, -6, 24.4, 0)); crane.add(box(2, 2, 2, C(0x3a3a3a), 3, 23, 0)); crane.add(box(0.05, 8, 0.05, C(0x222222), -12, 20, 0)); crane.add(box(1.4, 0.6, 1.4, C(0x8a8a8a), -12, 15.8, 0));
  // Container
  site.add(box(6, 2.6, 2.4, C(0x2a6ab8), -10, 1.3, -10)); site.add(box(0.1, 1.6, 1.4, C(0x1a4a8a), -6.95, 1.2, -10, { cast: false }));
  for (const [x, z] of [[-22, -20], [24, -24], [-30, 10], [30, 12]]) { site.add(box(0.7, 4, 0.7, C(0x5a3a22), x, 2, z)); site.add(box(3.6, 3.0, 3.6, C(0x3f7a32), x, 5.2, z)); }
  for (let x = -40; x <= 40; x += 12) site.add(box(8, 10 + (Math.abs(x) % 7), 8, C([0xd8d0c0, 0xb8c0c8, 0xc8b8a0][Math.round(Math.abs(x) / 12) % 3]), x, 5, -45));
  sunLight(site, 0xfff0d8, 3.4, V(-40, 55, 40), V(0, 0, -4), 30); site.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const hand = humanoid(HAND); hardhat(hand); const hTape = inHand(hand, tapeMesh()); site.add(hand);
  const hand2 = humanoid({ ...HAND, top: 0x3a8a3a, hair: 0x2a1a14, beard: 'short', seed: 60 }); hardhat(hand2); site.add(hand2);
  site.userData = { hand, hand2, tA, tB, tC };
}

// =====================================================================
// Videospiel-Arena (Nacht)
// =====================================================================
const arena = new THREE.Scene(); arena.background = new THREE.Color(0x070a16);
{
  skyDome(arena, 0x050816, 0x0e1630, 0x1c2848, null); arena.fog = new THREE.Fog(0x0e1630, 25, 120);
  const stars = new THREE.Group(); const r = rng(6001), sm = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, e = 0.15 + r() * 1.2; const s = box(1.2, 1.2, 1.2, sm, Math.cos(a) * Math.cos(e) * 600, Math.sin(e) * 600, Math.sin(a) * Math.cos(e) * 600, { cast: false }); stars.add(s); } arena.add(stars);
  arena.add(box(300, 1, 300, M(solidTex(0x3a5a2e, 0.16, 6002)), 0, -0.5, 0, { cast: false }));
  const gridM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x6a6a6e, 0.1); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x4a4a4e); px(c, 0, i, 0x4a4a4e); } }, 6003));
  arena.add(box(20, 0.1, 18, gridM, 0, 0.05, -2, { cast: false, uvScale: 1 }));
  const torch = (x, z) => { arena.add(box(0.14, 1.4, 0.14, C(0x5a3a1a), x, 0.7, z)); arena.add(box(0.22, 0.22, 0.22, new THREE.MeshBasicMaterial({ color: 0xffc040 }), x, 1.5, z, { cast: false })); const l = new THREE.PointLight(0xffa040, 7, 9, 1.5); l.position.set(x, 1.8, z); arena.add(l); };
  for (const [x, z] of [[-8, 5], [8, 5], [-8, -9], [8, -9], [0, -10]]) torch(x, z);
  for (const [x, z] of [[-11, -4], [11, -2], [-10, -12], [12, -12]]) { arena.add(box(1, 3, 1, C(0x2a1e14), x, 1.5, z)); arena.add(box(3, 2.6, 3, C(0x1e3a1e), x, 4, z)); }
  arena.add(new THREE.HemisphereLight(0x5a6aaa, 0x1a1e2a, 1.8)); sunLight(arena, 0x9aaae8, 1.8, V(-10, 20, 14), V(0, 0, -2), 14, 1024);
  const line = (x0, z0, x1, z1, col) => { const L = Math.hypot(x1 - x0, z1 - z0); const s = box(L, 0.06, 0.18, new THREE.MeshBasicMaterial({ color: col }), (x0 + x1) / 2, 0.14, (z0 + z1) / 2, { cast: false }); s.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); s.visible = false; s.userData = { x0, z0, x1, z1, L }; arena.add(s); return s; };
  const GP = [-1.5, 1.5], GE = [1.5, -2.5];
  const la = line(GP[0], GP[1], GE[0], GP[1], QCOL.a), lb = line(GE[0], GP[1], GE[0], GE[1], QCOL.b), lc = line(GP[0], GP[1], GE[0], GE[1], QCOL.c);
  const player = humanoid(PLAYER), enemy = humanoid(ENEMY); inHand(player, swordMesh()); arena.add(player, enemy);
  arena.userData = { player, enemy, la, lb, lc, GP, GE };
}

// =====================================================================
// Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901); const marble = C(0xe8dcc8);
  const tp = new THREE.Group(); tp.position.set(-26, 0, -70); dusk.add(tp); tp.add(box(22, 1.2, 12, marble, 0, 0.6, 0)); for (let x = -9; x <= 9; x += 2.6) tp.add(box(1, 7, 1, marble, x, 4.7, 4.5)); tp.add(box(21, 1, 11, marble, 0, 8.7, 0)); for (let s = 0; s < 3; s++) tp.add(box(21 - s * 6, 0.9, 11.4, C(0xa8452c), 0, 9.6 + s * 0.9, 0));
  for (const [x, z, h] of [[18, -40, 9], [24, -46, 8], [-6, -50, 9]]) cypress(dusk, x, z, h);
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); { const fl = new THREE.DirectionalLight(0xffc8a0, 1.3); fl.position.set(-4, 8, 20); dusk.add(fl); } dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('EUKLID, UM 300 V. CHR.', 72, 150, '#a3241c'); fit('DER SATZ GILT IN JEDEM', 56, 290, '#3a2a1e'); fit('RECHTWINKLIGEN DREIECK', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const ERK = 3; // Wortindex von „erklärt“
const SPEECH_END = 73.25; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.26) * 30) / 30; // +0.26: „Satz“ setzt ohne Vorlauf ein, Pause am Loop-Übergang sonst zu kurz
const WHIP0 = wt(ERK) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(ERK) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --idx 3 --fix); 1 Frame Vorlauf
const CUTS = [[0, 'hero'], [6, 'babylon'], [11, 'builder'], [18, 'crooked'], [28, 'puzzle'], [36, 'scribe'], [42, 'rope'], [54, 'tabletW'], [59, 'tablet'],
  [65, 'greece'], [76, 'school'], [81, 'number'], [88, 'unknown'], [102, 'name'], [110, 'triangle'], [124, 'strange'], [127, 'compare'], [139, 'nine'], [144, 'sixteen'],
  [149, 'fill'], [151, 'five'], [157, 'terms'], [167, 'formula'], [177, 'oxen'], [186, 'myth'], [192, 'today'], [198, 'builders'], [209, 'game'], [222, 'proof'], [231, 'euclid'], [238, 'sign'], [245, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json (nahe Endposition)
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.05, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-5.2 + drift * 1.2, 8.2 + drift * 0.7, 10.0 + drift * 1.2), t1 = V(0.6 + drift * 0.6, 1.6, -6.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff', CA = '#ff6a55', CB = '#5aa8ff', CC = '#ffd23f';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const reset = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const shrug = (ch) => { const P = ch.userData; P.armL.rotation.x = P.armR.rotation.x = -0.7; P.armL.rotation.z = -0.7; P.armR.rotation.z = 0.7; };
const above = (p, y) => V(p.x, y, p.z);

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = greece, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const ptag = (p, text, color) => ui.tags.push([p, text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Griechenland ----------
  const GR = ['hero', 'loop', 'greece', 'school', 'number', 'unknown', 'name', 'triangle', 'strange', 'compare', 'nine', 'sixteen', 'fill', 'five', 'terms', 'formula', 'oxen'];
  if (GR.includes(sh.id)) {
    scene = greece; const G = greece.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    const { pyth, stud, studs, qa, qb, qc, fly, frame: fr, mats } = G;
    reset([pyth, stud, ...studs]); G.pScroll.visible = true;
    [...qa, ...qb, ...qc].forEach(m => { m.visible = true; m.position.copy(m.userData.home); m.position.y = QH / 2; });
    fly.forEach(f => f.m.visible = false); fr.visible = false;
    const glowBase = (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'greece') ? 0.12 : 0.04;
    mats.a.emissiveIntensity = mats.b.emissiveIntensity = mats.c.emissiveIntensity = glowBase;
    G.fireA.userData.update(ta); G.oxen.forEach((o, i) => { o.userData.head.rotation.x = Math.sin(ta * 1.3 + i) * 0.12; });
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'greece') {
      put(pyth, HX, 0, HZ, 0.5); put(stud, HX2, 0, HZ, -0.5); pose3(pyth, 'idle', ta, 0); pose3(stud, 'idle', ta, 1);
      pyth.userData.armR.rotation.x = -0.45; pyth.userData.head.rotation.y = 0.3; stud.userData.head.rotation.y = -0.25; stud.userData.armL.rotation.x = -0.4;
      studs.forEach((p, i) => { put(p, [-3.6, -4.4, 4.6, 5.4][i], 0, [-1.6, -0.4, -1.8, -0.6][i], [0.7, 0.9, -0.7, -0.9][i]); pose3(p, 'idle', ta, i + 2); });
      if (sh.id !== 'greece') { heroCam(ta); tag(pyth, 'Pythagoras', HERO); tag(stud, 'Schüler', ALLY); }
      else { mv(u, V(-30, 22, 34), V(-26, 20, 30), V(1, 2, -12), V(1, 2, -13), 46); info(wt(65), 'Griechenland, um 530 v. Chr.'); }
    }
    const seated = () => { [[-14.0, -0.35, 0.6], [-12.95, 0.3, 0.6], [-11.05, 0.3, -0.6], [-10.0, -0.35, -0.6]].forEach(([x, z, r], i) => { put(studs[i], x, 0, z, r); pose3(studs[i], 'idle', t, i); sitPose(studs[i], 0.5); }); };
    if (sh.id === 'school') { seated(); put(pyth, -12, 0, -1.8, 0); pose3(pyth, 'point', t); pyth.userData.armR.rotation.y = 0;
      mv(u, V(-12, 2.5, 7.4), V(-12, 2.4, 6.6), V(-12, 1.0, -0.4), V(-12, 1.1, -0.6), 46); tag(pyth, 'Pythagoras', HERO); }
    if (sh.id === 'number') { seated(); put(pyth, -12, 0, -1.8, 0); pose3(pyth, 'idle', t); studs.forEach(p => p.userData.head.rotation.x = 0.35);
      mv(u, V(-12, 2.0, 5.8), V(-12, 1.93, 5.2), V(-12, 0.9, 0.0), V(-12, 0.9, 0.0), 50); tag(studs[1], 'Schüler', ALLY); tag(studs[2], 'Schüler', ALLY); say(wt(85), 'Schüler', ALLY, 'Alles ist Zahl!'); }
    if (sh.id === 'unknown') { put(pyth, -12, 0, -1.8, 0); pose3(pyth, 'idle', t); shrug(pyth); G.pScroll.visible = false; seated();
      mv(u, V(-11.4, 1.8, 1.6), V(-11.5, 1.76, 1.0), V(-12, 1.5, -1.8), V(-12, 1.5, -1.8), 46); tag(pyth, 'Pythagoras', HERO); info(wt(97), 'Keine Schrift von Pythagoras erhalten'); }
    if (sh.id === 'name') { put(pyth, 0.2, 0, -1.2, 0.25); pose3(pyth, 'pose', t); put(stud, 1.6, 0, -0.6, -0.4); pose3(stud, 'clap', t, 1);
      mv(u, V(1.3, 1.3, 2.9), V(1.2, 1.35, 2.4), V(0.4, 1.8, -1.2), V(0.4, 1.85, -1.2), 48); tag(pyth, 'Pythagoras', HERO); toast(wt(103), 'Fortschritt erzielt!', 'Satz des Pythagoras', 'tri'); }
    if (sh.id === 'triangle') { const t0 = wt(123) - 0.05;
      [[qa, 0], [qb, 0.12], [qc, 0.24]].forEach(([arr, d]) => arr.forEach((m, k) => { const e = smoother((t - t0 - d - k * 0.008) / 0.35); m.position.y = lerp(-0.7, QH / 2, e); }));
      mv(u, V(1.8, 27, 1.6), V(1.8, 25, 1.0), V(1.8, 0, -8), V(1.8, 0, -8), 46); }
    if (sh.id === 'strange') { put(stud, -1.9, 0, -1.6, 0.55); pose3(stud, 'idle', t); const P = stud.userData; P.armL.rotation.x = P.armR.rotation.x = -2.2; P.armL.rotation.z = -0.4; P.armR.rotation.z = 0.4; P.head.rotation.x = -0.1;
      put(pyth, -3.6, 0, -2.8, 0.7); pose3(pyth, 'idle', t, 1);
      mv(u, V(-0.9, 1.75, 1.7), V(-1.0, 1.72, 1.2), V(-2.0, 1.45, -1.8), V(-2.0, 1.45, -1.8), 46); tag(stud, 'Schüler', ALLY); tag(pyth, 'Pythagoras', HERO); }
    if (sh.id === 'compare') { const pa = 0.5 * Math.max(0, Math.sin(clamp01((t - wt(129)) / 1.4) * Math.PI)), pc = 0.6 * Math.max(0, Math.sin(clamp01((t - wt(138)) / 0.9) * Math.PI));
      mats.a.emissiveIntensity = mats.b.emissiveIntensity = 0.04 + pa; mats.c.emissiveIntensity = 0.04 + pc;
      mv(u, V(-11.6, 15.4, 4.6), V(-10.8, 14.6, 3.8), V(1.4, 0, -8.2), V(1.5, 0, -8.2), 46); }
    if (sh.id === 'nine' || sh.id === 'sixteen') { const arr = sh.id === 'nine' ? qa : qb, st = sh.id === 'nine' ? 0.085 : 0.06, w0 = sh.id === 'nine' ? wt(139) : wt(144);
      arr.forEach((m, k) => { const lit = t >= w0 + k * st; m.position.y = QH / 2 + (lit ? 0.12 * Math.max(0, 1 - (t - w0 - k * st) / 0.2) : 0); });
      const mm = sh.id === 'nine' ? mats.a : mats.b; mm.emissiveIntensity = 0.04 + 0.35 * clamp01((t - w0) / 0.6);
      if (sh.id === 'nine') { mv(u, V(1.0, 4.4, 1.0), V(1.0, 4.1, 0.6), V(1.0, 0, -4.4), V(1.0, 0, -4.5), 46); if (t >= wt(143)) ptag(above(centerA, 1.3), '3 × 3 = 9', CA); }
      else { mv(u, V(-2.6, 5.2, -0.2), V(-2.6, 4.9, -0.7), V(-2.5, 0, -7.9), V(-2.5, 0, -8.0), 46); if (t >= wt(148)) ptag(above(centerB, 1.3), '4 × 4 = 16', CB); } }
    if (sh.id === 'fill' || sh.id === 'five') { qc.forEach(m => m.visible = false); fr.visible = true; const t0 = wt(149);
      fly.forEach(f => { const s = t0 + f.k * 0.035, e = smoother((t - s) / 0.75);
        if (t < s) return; f.src.visible = false; f.m.visible = true; const a = f.src.userData.home, b = f.dst;
        f.m.position.set(lerp(a.x, b.x, e), QH / 2 + Math.sin(e * Math.PI) * 2.4, lerp(a.z, b.z, e)); f.m.rotation.y = lerp(0, HROT, e); });
      if (sh.id === 'fill') { mv(u, V(-7.0, 14, 4.6), V(-6.4, 13.2, 3.8), V(1.6, 0, -8.6), V(1.7, 0, -8.6), 46); if (t >= wt(150)) ptag(above(centerC, 1.6), '9 + 16 = 25', CC); }
      else { mv(u, V(7.6, 7.2, -3.2), V(7.2, 6.8, -3.6), V(3.4, 0, -9.6), V(3.4, 0, -9.6), 46); if (t >= wt(156)) ptag(above(centerC, 1.4), '5 × 5 = 25', CC); } }
    if (sh.id === 'terms') { mv(u, V(1.4, 26, 1.4), V(1.4, 24.6, 0.9), V(1.3, 0, -8), V(1.3, 0, -8), 46);
      if (t >= wt(162)) { ptag(V(OX + 1.5, 0.9, OZ + 1.6), 'Kathete', ALLY); ptag(V(OX - 2, 0.9, OZ - 2), 'Kathete', ALLY); }
      if (t >= wt(166)) ptag(above(centerC, 0.9), 'Hypotenuse', HERO);
      tip(wt(162), 'tri', 'Katheten & Hypotenuse', '#55ffff', [gray('Katheten: die zwei kurzen Seiten'), gray('Hypotenuse: die lange Seite')]); }
    if (sh.id === 'formula') { put(pyth, -2.4, 0, -2.0, 0.55); pose3(pyth, 'point', t); put(stud, -3.6, 0, -1.2, 0.6); pose3(stud, 'idle', t, 1);
      mv(u, V(-4.6, 3.4, 3.8), V(-4.3, 3.2, 3.2), V(0.6, 0.4, -6.6), V(0.6, 0.4, -6.6), 46); tag(pyth, 'Pythagoras', HERO);
      if (t >= wt(169)) ptag(above(centerA, 1.2), 'a²', CA); if (t >= wt(172)) ptag(above(centerB, 1.2), 'b²', CB); if (t >= wt(175)) ptag(above(centerC, 1.2), 'c²', CC);
      tip(wt(169), 'tri', 'Satz des Pythagoras', '#ffff55', [`<span style="font-size:52px">${'a²' + (t >= wt(171) ? ' + b²' : '') + (t >= wt(174) ? ' = c²' : '')}</span>`]); }
    if (sh.id === 'oxen') { put(pyth, 13.0, 0, 2.6, 0.5); pose3(pyth, 'cheer', t); put(stud, 11.8, 0, 1.4, 0.7); pose3(stud, 'clap', t, 1);
      mv(u, V(10.6, 2.3, 7.4), V(11.0, 2.2, 6.6), V(15.2, 1.2, -0.8), V(15.4, 1.2, -1.0), 48); tag(pyth, 'Pythagoras', HERO); info(wt(178), 'Legende: 100 Ochsen als Dankopfer'); }
  }
  // ---------- Babylon ----------
  if (['babylon', 'builder', 'crooked', 'puzzle', 'scribe', 'rope', 'tabletW', 'tablet'].includes(sh.id)) {
    scene = babylon; exp = 1.3; const B = babylon.userData; const { bau, schr } = B; reset([bau, schr]); B.sTab.visible = true;
    [B.rope3, B.rope4, B.rope5, B.angleMk].forEach(r => r.visible = false);
    if (sh.id === 'babylon') { put(bau, -2, 0, -2, 0.3); pose3(bau, 'walk', t); mv(u, V(-52, 34, 46), V(-48, 31, 42), V(4, 8, -48), V(4, 8, -49), 46); info(wt(6), 'Babylon, um 1800 v. Chr.'); }
    if (sh.id === 'builder') { put(bau, -2, 0, -2, 0.35); pose3(bau, 'point', t); bau.userData.armR.rotation.y = -0.4;
      mv(u, V(-0.9, 1.8, 2.8), V(-1.0, 1.75, 2.2), V(-2.0, 1.4, -2.2), V(-2.0, 1.4, -2.2), 46); tag(bau, 'Baumeister', HERO); }
    if (sh.id === 'crooked') { put(bau, 2.4, 0, 2.6, 0.3); pose3(bau, 'idle', t); bau.userData.setFace({ sad: true }); bau.userData.head.rotation.y = -0.5;
      mv(u, V(0.2, 2.4, 8.4), V(0.5, 2.3, 7.6), V(2.5, 1.9, -0.4), V(2.5, 1.9, -0.4), 46); tag(bau, 'Baumeister', HERO); if (t >= wt(27)) eff(wt(27), 'Schief', '−20 %', BAD); }
    if (sh.id === 'puzzle') { put(bau, -2, 0, -2, 0.3); pose3(bau, 'idle', t); bau.userData.setFace({ sad: true }); const P = bau.userData; P.armR.rotation.x = -2.7; P.armR.rotation.z = 0.55; P.head.rotation.z = Math.sin(t * 3) * 0.08;
      mv(u, V(-1.3, 1.78, 1.2), V(-1.4, 1.76, 0.8), V(-2.0, 1.55, -2.0), V(-2.0, 1.55, -2.0), 46); tag(bau, 'Baumeister', HERO); say(wt(30), 'Baumeister', HERO, 'Wie prüfe ich einen Winkel?'); }
    if (sh.id === 'scribe') { put(schr, -13, 0, 3.0, 0); pose3(schr, 'idle', t); schr.userData.armR.rotation.x = -1.3; put(bau, -11.0, 0, 4.6, -0.9); pose3(bau, 'idle', t, 1);
      mv(u, V(-12.0, 1.95, 8.4), V(-12.1, 1.9, 7.6), V(-12.6, 1.3, 3.6), V(-12.6, 1.3, 3.6), 46); tag(schr, 'Schreiber', ALLY); tag(bau, 'Baumeister', HERO); say(wt(40), 'Schreiber', ALLY, 'Ich kenne einen Trick!'); }
    if (sh.id === 'rope') { B.rope3.visible = t >= wt(44); B.rope4.visible = t >= wt(45); B.rope5.visible = t >= wt(47); B.angleMk.visible = t >= wt(52);
      put(schr, -6.6, 0, -5.4, 0.6); pose3(schr, 'point', t); put(bau, 1.6, 0, -5.8, -0.6); pose3(bau, 'cross', t, 1);
      mv(u, V(-2.4, 6.2, -1.6), V(-2.5, 5.7, -2.2), V(-2.4, 0.3, -8.6), V(-2.4, 0.3, -8.6), 46);
      if (t >= wt(44)) ptag(V(RB[0] - 0.5, 1.0, RB[1] - 1.5 * RU), '3', CA); if (t >= wt(45)) ptag(V(RB[0] + 2 * RU, 1.0, RB[1] + 0.2), '4', CB); if (t >= wt(47)) ptag(V(RB[0] + 2 * RU + 0.5, 1.0, RB[1] - 1.5 * RU - 0.3), '5', CC);
      tip(wt(49), 'tri', 'Seil-Trick', '#ffaa00', [gray('Seiten 3 · 4 · 5'), green('= rechter Winkel')]); }
    if (sh.id === 'tabletW') { put(schr, -13, 0, 3.0, 0); pose(schr, 'write', t); B.sTab.visible = false;
      mv(u, V(-10.4, 1.95, 7.6), V(-10.7, 1.9, 7.0), V(-13, 1.1, 3.6), V(-13, 1.1, 3.6), 46); tag(schr, 'Schreiber', ALLY); }
    if (sh.id === 'tablet') { put(schr, -13, 0, 3.0, 0); pose(schr, 'write', t); B.sTab.visible = false;
      mv(u, V(-13.0, 1.9, 5.3), V(-13.05, 1.72, 4.95), V(-13.1, 0.94, 4.0), V(-13.1, 0.94, 4.0), 46);
      tip(wt(60), 'tablet', 'Tontafel „Plimpton 322“', '#ffaa00', [gray('um 1800 v. Chr.'), gray('z. B. 119² + 120² = 169²')]); }
  }
  // ---------- Bibliothek ----------
  if (['myth', 'proof', 'euclid'].includes(sh.id)) {
    scene = lib; exp = 1.4; const L = lib.userData; reset([L.hist, L.euk]);
    if (sh.id === 'myth') { put(L.hist, -2.2, 0, 0.4, 0.3); pose3(L.hist, 'idle', t); L.hist.userData.armR.rotation.x = -1.1; L.hist.userData.head.rotation.y = Math.sin(t * 8) * 0.3;
      mv(u, V(-1.3, 1.8, 3.9), V(-1.4, 1.76, 3.3), V(-2.1, 1.4, 0.2), V(-2.1, 1.4, 0.2), 46); tag(L.hist, 'Historiker', WHITE); eff(wt(191), 'Ochsen-Legende', 'erfunden', BAD); }
    if (sh.id === 'proof') { mv(u, V(0.95, 1.85, 0.5), V(0.85, 1.65, 0.15), V(0.6, 0.93, -0.75), V(0.6, 0.93, -0.75), 46); info(wt(224), 'Ältester erhaltener Beweis'); }
    if (sh.id === 'euclid') { put(L.euk, 0.6, 0, -1.75, 0); pose(L.euk, 'write', t); sitPose(L.euk, 0.52);
      mv(u, V(1.9, 1.95, 2.8), V(1.8, 1.9, 2.2), V(0.6, 1.25, -1.3), V(0.6, 1.25, -1.3), 46); tag(L.euk, 'Euklid', ALLY); info(wt(233), 'Alexandria, um 300 v. Chr.');
      tip(wt(234), 'book', 'Die „Elemente“', '#ffaa00', [gray('Buch 1, Satz 47:'), green('Beweis des Satzes')]); }
  }
  // ---------- Baustelle ----------
  if (sh.id === 'today' || sh.id === 'builders') {
    scene = site; exp = 1.3; const S = site.userData; const { hand, hand2 } = S;
    put(hand, -2.4, 0.3, -2.4, 0.5); put(hand2, 1.6, 0.3, -2.2, -0.4); pose3(hand2, 'idle', t, 1); hand2.userData.armR.rotation.x = -1.1;
    if (sh.id === 'today') { pose3(hand, 'walk', t); S.tA.visible = S.tB.visible = S.tC.visible = false; mv(u, V(-15, 9.5, 12), V(-13, 8.6, 10.4), V(1, 1.5, -6), V(1, 1.5, -6), 46); info(wt(192), 'Heute'); }
    else { hand.userData.baseY = 0.3; pose3(hand, 'kneel', t); S.tA.visible = t >= wt(199); S.tB.visible = t >= wt(201); S.tC.visible = t >= wt(205);
      mv(u, V(-0.9, 2.8, 3.4), V(-1.0, 2.65, 2.8), V(-1.6, 0.5, -4.2), V(-1.6, 0.5, -4.2), 46); tag(hand, 'Handwerker', HERO);
      if (S.tA.visible) ptag(V(-3.4, 0.8, -4.5), '3 m', CA); if (S.tB.visible) ptag(V(-1, 0.8, -2.7), '4 m', CB); if (S.tC.visible) ptag(V(-0.6, 0.8, -4.8), '5 m', CC);
      tip(wt(203), 'tri', '3-4-5-Regel', '#ffaa00', [gray('3 m und 4 m an der Ecke'), green('Diagonale 5 m = rechtwinklig')]); }
  }
  // ---------- Videospiel ----------
  if (sh.id === 'game') {
    scene = arena; exp = 1.7; const A = arena.userData; const { player, enemy, la, lb, lc, GP, GE } = A;
    put(player, GP[0], 0, GP[1], Math.atan2(GE[0] - GP[0], GE[1] - GP[1])); pose3(player, 'idle', t); player.userData.armR.rotation.x = -1.0;
    put(enemy, GE[0], 0, GE[1], Math.atan2(GP[0] - GE[0], GP[1] - GE[1])); pose3(enemy, 'idle', t, 1); enemy.userData.armL.rotation.x = enemy.userData.armR.rotation.x = -1.5; enemy.userData.setFace({ angry: true });
    [[la, wt(212)], [lb, wt(214)], [lc, wt(216)]].forEach(([l, t0]) => { const e = smoother((t - t0) / 0.3); l.visible = e > 0; const d = l.userData; l.scale.x = Math.max(0.001, e);
      l.position.set(lerp(d.x0, (d.x0 + d.x1) / 2, e), 0.14, lerp(d.z0, (d.z0 + d.z1) / 2, e)); });
    mv(u, V(8.4, 4.8, 6.6), V(7.9, 4.6, 6.2), V(0, 0.7, -0.5), V(0, 0.7, -0.5), 52); tag(player, 'Du', HERO); tag(enemy, 'Gegner', BAD);
    if (la.visible) ptag(V(0, 0.7, GP[1] + 0.3), 'a = 3', CA); if (lb.visible) ptag(V(GE[0] + 0.6, 0.7, -1), 'b = 4', CB);
    tip(wt(216), 'sword', 'Entfernung', '#55ffff', [gray('3² + 4² = 5²'), green('Abstand: 5 Blöcke')]);
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  tri: '<rect x="1" y="6" width="6" height="1" fill="#2e7ad8"/><rect x="1" y="1" width="1" height="6" fill="#d8402e"/><rect x="2" y="5" width="1" height="1" fill="#f0c02a"/><rect x="3" y="4" width="1" height="1" fill="#f0c02a"/><rect x="4" y="3" width="1" height="1" fill="#f0c02a"/><rect x="5" y="2" width="1" height="1" fill="#f0c02a"/><rect x="2" y="1" width="1" height="1" fill="#f0c02a"/><rect x="6" y="5" width="1" height="1" fill="#f0c02a"/>',
  tablet: '<rect x="2" y="0" width="4" height="8" fill="#b08a5a"/><rect x="3" y="1" width="1" height="1" fill="#5a3a1a"/><rect x="5" y="1" width="1" height="1" fill="#5a3a1a"/><rect x="3" y="3" width="2" height="1" fill="#5a3a1a"/><rect x="4" y="5" width="1" height="1" fill="#5a3a1a"/><rect x="3" y="6" width="2" height="1" fill="#5a3a1a"/>',
  sword: '<rect x="5" y="0" width="2" height="2" fill="#d8e4ec"/><rect x="4" y="2" width="2" height="1" fill="#d8e4ec"/><rect x="3" y="3" width="2" height="1" fill="#d8e4ec"/><rect x="1" y="4" width="4" height="1" fill="#8a8a8a"/><rect x="2" y="5" width="1" height="2" fill="#6a4a2a"/><rect x="1" y="7" width="1" height="1" fill="#6a4a2a"/>',
  book: '<rect x="1" y="1" width="6" height="6" fill="#7a2a1a"/><rect x="2" y="1" width="4" height="5" fill="#e8dcc0"/><rect x="3" y="2" width="2" height="1" fill="#7a5a3a"/><rect x="3" y="4" width="2" height="1" fill="#7a5a3a"/>',
  up: '<rect x="3" y="1" width="2" height="6" fill="#ffd23f"/><rect x="2" y="2" width="4" height="1" fill="#ffd23f"/><rect x="1" y="3" width="6" height="1" fill="#ffd23f"/>',
  down: '<rect x="3" y="1" width="2" height="6" fill="#55ffff"/><rect x="2" y="5" width="4" height="1" fill="#55ffff"/><rect x="1" y="4" width="6" height="1" fill="#55ffff"/>',
  heart: '<rect x="1" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="5" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="1" y="3" width="6" height="2" fill="#ff4a6a"/><rect x="2" y="5" width="4" height="1" fill="#ff4a6a"/><rect x="3" y="6" width="2" height="1" fill="#ff4a6a"/>',
  shield: '<rect x="1" y="1" width="6" height="4" fill="#f0c030"/><rect x="2" y="5" width="4" height="1" fill="#f0c030"/><rect x="3" y="6" width="2" height="1" fill="#f0c030"/><rect x="3" y="2" width="2" height="3" fill="#b8860b"/>',
  phone: '<rect x="2" y="0" width="4" height="8" fill="#1a1a1a"/><rect x="3" y="1" width="2" height="5" fill="#9ad0ff"/>',
  x: '<rect x="1" y="1" width="2" height="2" fill="#ff5555"/><rect x="5" y="1" width="2" height="2" fill="#ff5555"/><rect x="3" y="3" width="2" height="2" fill="#ff5555"/><rect x="1" y="5" width="2" height="2" fill="#ff5555"/><rect x="5" y="5" width="2" height="2" fill="#ff5555"/>',
  stairs: '<rect x="1" y="6" width="6" height="1" fill="#b8a68a"/><rect x="3" y="4" width="4" height="2" fill="#d8b040"/><rect x="5" y="2" width="2" height="2" fill="#b83a2a"/><rect x="6" y="1" width="1" height="1" fill="#eee6d6"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const NUM = { 'viertausend': '4000', 'drei,': '3,', 'vier': '4', 'fünf': '5', 'Drei': '3', 'drei': '3', 'neun.': '9.', 'Vier': '4', 'sechzehn.': '16.', 'fünfundzwanzig.': '25.', 'fünf?': '5?', 'tausend': '1000', 'hundert': '100', 'dreihundert': '300' }; if (NUM[txt]) txt = NUM[txt];
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
