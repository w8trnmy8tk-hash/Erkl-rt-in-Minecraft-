// „Quadratische Funktionen, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
// Quadratische Funktionen – eigene Sets
// =====================================================================
const ARCHER = { skin: 0xe8b894, hair: 0x7a4a22, hairVol: true, top: 0x3f7f3a, bottom: 0x5a4028, belt: 0x3a2414, shoe: 0x3a2414, eye: '#3a6a3a', smile: true, seed: 51 };
const GALILEO = { skin: 0xecc0a0, hair: 0xdedad2, bald: true, beard: 'full', beardCol: 0xe4e0d8, top: 0x23202a, bottom: 0x23202a, coat: true, belt: 0x8a6a3a, shoe: 0x111111, eye: '#4a3a2a', seed: 52 };
const SCRIBE = { skin: 0xb98a5e, hair: 0x1a1410, beard: 'short', beardCol: 0x1a1410, top: 0xe8dcc0, bottom: 0x2a4a8a, skirt: true, belt: 0xd8a830, shoe: 0x6a4a2a, eye: '#2a1a10', seed: 53 };
const HSL = (h, s, l) => new THREE.Color().setHSL(h, s, l).getHex();

function bowMesh() { const g = new THREE.Group(), wm = C(0x7a4a22), sm = C(0xeeeeee);
  for (let i = -5; i <= 5; i++) { const s = i / 5; g.add(box(0.07, 0.07, 0.12, wm, 0, s * s * 0.2, s * 0.55)); }
  g.add(box(0.015, 0.015, 1.1, sm, 0, 0.2, 0, { cast: false })); return g; }
function arrowMesh(len = 0.8) { const g = new THREE.Group();
  g.add(box(len, 0.045, 0.045, C(0x8a6a3a), 0, 0, 0)); g.add(box(0.14, 0.09, 0.09, C(0x9aa0a8, { metal: 0.6, rough: 0.4 }), len / 2 + 0.05, 0, 0));
  g.add(box(0.16, 0.12, 0.02, C(0xf0f0f0), -len / 2 + 0.06, 0, 0)); g.add(box(0.16, 0.02, 0.12, C(0xd83a2a), -len / 2 + 0.06, 0, 0)); return g; }
function oak(scene, x, z, s = 1, seed = 1) { const r = rng(seed); const h = 3 + Math.floor(r() * 2);
  scene.add(box(0.6 * s, h * s, 0.6 * s, C(0x6a4a2a), x, h * s / 2, z)); const lm = C(0x3f8a32), lm2 = C(0x4f9a3a);
  scene.add(box(3.4 * s, 1.6 * s, 3.4 * s, lm, x, (h + 0.4) * s, z)); scene.add(box(2.2 * s, 1.2 * s, 2.2 * s, lm2, x, (h + 1.6) * s, z)); }
function flowers(scene, seed, cx, cz, n, spread, avoid = () => false) { const r = rng(seed); const cols = [0xf04a4a, 0xffe040, 0xffffff, 0xb05ae8, 0xff8ad0, 0x4aa0ff];
  for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * spread, z = cz + (r() - 0.5) * spread; if (avoid(x, z)) continue; const c = cols[Math.floor(r() * cols.length)];
    scene.add(box(0.06, 0.32, 0.06, C(0x3a7a2a), x, 0.16, z, { cast: false })); scene.add(box(0.18, 0.16, 0.18, C(c), x, 0.36, z, { cast: false })); } }
function grassTufts(scene, seed, cx, cz, n, spread, avoid = () => false) { const r = rng(seed); const m = C(0x5f9a3a), m2 = C(0x6aa842);
  for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * spread, z = cz + (r() - 0.5) * spread; if (avoid(x, z)) continue; scene.add(box(0.08, 0.3 + r() * 0.25, 0.4, i % 2 ? m : m2, x, 0.2, z, { cast: false })); } }

// =====================================================================
// SET 1: Wiese mit Burg + Regenbogen-Parabel (Hook, Bogenschütze)
// =====================================================================
const AR = 12, AH = 7.5, AZ = -20; // Parabel y = AH·(1 − (x/AR)²) in Ebene z = AZ
const archY = x => AH * (1 - (x / AR) ** 2);
const plains = new THREE.Scene();
{
  const sky = skyDome(plains, 0x2f6cc8, 0x86b8ea, 0xffd2a0, V(-0.5, 0.32, 0.8), [1, 0.85, 0.6]); plains.fog = new THREE.Fog(0xf4d2b0, 70, 330); clouds(plains, 21, 0xfff4ea, 52, 22, 200, 0.92);
  const grassBig = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x6aa03e, 0.12), 3001)); plains.add(box(600, 1, 600, grassBig, 0, -0.5, 0, { cast: false, uvScale: 1 }));
  const pathM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xa8875a, 0.14), 3002));
  for (let z = 8; z > -60; z -= 1) plains.add(box(1.6, 0.04, 1.0, pathM, 2.6 + Math.sin(z * 0.15) * 1.2, 0.02, z, { cast: false }));
  // Hügel / Berge im Hintergrund
  const hillM = C(0x5a8e3a), hillM2 = C(0x4f7f34), rockM = C(0x8a8a8e), snowM = C(0xf2f4f8);
  for (const [x, z, w, h] of [[-70, -120, 60, 9], [-15, -140, 70, 12], [45, -125, 60, 8], [100, -105, 70, 11], [-120, -90, 60, 7]]) for (let i = 0; i < 4; i++) plains.add(box(w * (1 - i * 0.22), h * 0.28, 34 * (1 - i * 0.2), i % 2 ? hillM2 : hillM, x + i * 2, h * 0.14 + i * h * 0.28, z));
  for (const [x, z, s] of [[-40, -180, 1], [20, -200, 1.3], [80, -170, 0.9]]) for (let i = 0; i < 5; i++) { const w = (40 - i * 8) * s; plains.add(box(w, 8 * s, w * 0.7, i > 2 ? snowM : rockM, x, (4 + i * 8) * s, z)); }
  // Burg rechts (Ziel des Pfeils)
  const cob = M(T.cobble), cobD = M(tileTex(0x6e6a66, 0x4a4642, 3010)); const bx = AR + 7;
  plains.add(box(10, 7, 9, cob, bx + 3, 3.5, AZ - 1)); for (let i = 0; i < 6; i++) plains.add(box(1, 1, 9.2, cob, bx - 1.5 + i * 1.8, 7.5, AZ - 1));
  for (const [tx, tz] of [[bx - 2, AZ + 3.6], [bx - 2, AZ - 5.6], [bx + 8, AZ + 3.6], [bx + 8, AZ - 5.6]]) { plains.add(box(3, 11, 3, cobD, tx, 5.5, tz)); for (let k = 0; k < 4; k++) plains.add(box(0.9, 0.9, 0.9, cobD, tx + [-1.05, 1.05, -1.05, 1.05][k], 11.45, tz + [-1.05, -1.05, 1.05, 1.05][k]));
    plains.add(box(2.4, 2.2, 2.4, M(T.roofRed), tx, 12.6, tz)); plains.add(box(1.2, 1.2, 1.2, M(T.roofRed), tx, 14.2, tz)); }
  plains.add(box(0.1, 3.2, 2.2, C(0x3a2416), bx - 1.95, 1.6, AZ - 1, { cast: false })); // Tor
  for (const tz of [AZ + 1.8, AZ - 3.8]) { plains.add(box(0.1, 2.4, 1.0, C(0xc8302a), bx - 2.0, 4.6, tz, { cast: false })); plains.add(box(0.11, 0.4, 0.4, C(0xf0c030), bx - 2.0, 4.8, tz, { cast: false })); }
  // Bäume, Blumen, Gras
  const avoid = (x, z) => (Math.abs(x) < 2.2 && Math.abs(z) < 2.4) || (Math.abs(x + AR) < 6 && Math.abs(z - AZ) < 8) || (Math.abs(x) < 9 && Math.abs(z - AZ) < 3) || (Math.abs(x - 2.6) < 1.2 && z > -60 && z < 8);
  for (const [x, z, s, sd] of [[-17, -8, 1.1, 1], [-14, 2, 1, 2], [17, -7, 1.2, 3], [12, 4, 1, 4], [-22, -14, 1.3, 5], [-30, -2, 1.2, 6], [-6, -32, 1.2, 7], [30, -6, 1.1, 8], [-20, 8, 1, 9], [18, -34, 1.3, 10], [-38, -24, 1.4, 11], [40, -30, 1.4, 12]]) oak(plains, x, z, s, sd);
  flowers(plains, 3020, 0, -4, 260, 34, avoid); grassTufts(plains, 3021, 0, -4, 420, 40, avoid);
  // Parabel aus leuchtenden Blöcken (Flugbahn des Pfeils)
  const arch = []; const N = 41;
  for (let i = 0; i < N; i++) { const x = -AR + (2 * AR) * i / (N - 1); const col = HSL(clamp01((x + 8.5) / 17) * 0.8, 1.0, 0.5);
    const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.6, fog: false });
    const b = box(0.72, 0.72, 0.72, m, x, archY(x) + 0.0, AZ, { cast: false }); b.userData.x = x; plains.add(b); arch.push(b); }
  // Nullstellen-Markierungen
  const zeroM = new THREE.MeshStandardMaterial({ color: 0xff4a3a, emissive: 0xff4a3a, emissiveIntensity: 0.6 });
  const zeros = [-AR, AR].map(x => { const g = new THREE.Group(); g.add(box(1.1, 0.12, 1.1, zeroM, 0, 0.06, 0, { cast: false })); g.add(box(0.16, 1.6, 0.16, zeroM, 0, 0.8, 0)); g.position.set(x, 0, AZ); plains.add(g); return g; });
  // Scheitelpunkt-Marker
  const vtx = box(0.9, 0.9, 0.9, new THREE.MeshStandardMaterial({ color: 0xffe040, emissive: 0xffd020, emissiveIntensity: 0.8 }), 0, AH, AZ, { cast: false }); plains.add(vtx);
  const sun = sunLight(plains, 0xffdcae, 3.3, V(-38, 30, 48), V(0, 0, -8), 42); plains.add(new THREE.HemisphereLight(0xcfe0ff, 0x6a7a3a, 1.35));
  const archer = humanoid(ARCHER), gal = humanoid(GALILEO); archer.userData.body.add(box(0.5, 0.06, 0.28, C(0x3a2414), 0, 1.32, 0, { cast: false }));
  const bowHand = bowMesh(); bowHand.position.set(0, -0.7, 0); archer.userData.armL.add(bowHand);
  const bowBack = bowMesh(); bowBack.rotation.set(0, Math.PI / 2, 0.0); bowBack.rotation.x = 0; bowBack.position.set(0, 1.1, -0.2); bowBack.rotation.set(Math.PI / 2 - 0.5, 0, 0); archer.userData.body.add(bowBack);
  const quiver = box(0.18, 0.6, 0.18, C(0x6a3a1a), 0.15, 1.15, -0.2); archer.userData.body.add(quiver);
  const arrow = arrowMesh(); plains.add(arrow); const arrowHand = arrowMesh(0.7); arrowHand.rotation.set(0, Math.PI / 2, 0); arrowHand.position.set(0, -0.68, 0.0); archer.userData.armR.add(arrowHand);
  const ball = box(0.22, 0.22, 0.22, C(0xe0b040, { metal: 0.5, rough: 0.35 }), 0, 0, 0); gal.userData.armR.add(ball); ball.position.set(0, -0.76, 0.06);
  const villagers = [0, 1].map(i => { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2][i], hair: [0x3a2a1a, 0xb8925a][i], longHair: i === 1, top: [0xa83a3a, 0x3a6aa8][i], bottom: 0x4a3a2a, skirt: i === 1, smile: true, seed: 3050 + i }); plains.add(p); return p; });
  plains.add(archer, gal);
  plains.userData = { sky, sun, arch, zeros, vtx, archer, gal, bowHand, bowBack, arrow, arrowHand, ball, villagers };
}
function aimPose(ch, t, draw = 1) { const P = ch.userData; pose(ch, 'idle', t);
  P.armL.rotation.x = -1.57; P.armL.rotation.y = 0.0; P.armR.rotation.x = -1.57; P.armR.rotation.y = lerp(0.2, 0.75, draw); P.armR.rotation.z = 0; P.head.rotation.x = -0.05; }

// =====================================================================
// SET 2: Babylon – Zikkurat, Fluss, quadratisches Feld
// =====================================================================
const babylon = new THREE.Scene();
{
  skyDome(babylon, 0x3a7ccc, 0x9cc6ea, 0xf4dcae, V(-0.4, 0.5, 0.5)); babylon.fog = new THREE.Fog(0xf0d8b0, 90, 420); clouds(babylon, 31, 0xffffff, 70, 10, 220, 0.8);
  const sandM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8bf88, 0.1), 3101)); babylon.add(box(600, 1, 600, sandM, 0, -0.5, 0, { cast: false }));
  const water = new THREE.MeshStandardMaterial({ color: 0x3a7aa8, roughness: 0.25, metalness: 0.1 }); babylon.add(box(600, 0.1, 14, water, 0, 0.02, 26, { cast: false }));
  for (const [x, w] of [[-60, 40], [10, 60]]) babylon.add(box(w, 0.08, 6, C(0x6a9a3a), x, 0.03, 16, { cast: false }));
  const brick = M(tileTex(0xc89a62, 0x9a7448, 3110)), brickD = M(tileTex(0xa87a4a, 0x7a5636, 3111)), blue = M(tileTex(0x2a5aa8, 0x1a3a78, 3112));
  // Zikkurat
  const ZX = -6, ZZ = -42; for (let i = 0; i < 5; i++) { const s = 30 - i * 6; babylon.add(box(s, 4, s, i % 2 ? brickD : brick, ZX, 2 + i * 4, ZZ)); }
  babylon.add(box(5, 4, 5, blue, ZX, 22, ZZ)); babylon.add(box(1, 1, 1, C(0xf0c030, { metal: 0.5, rough: 0.4 }), ZX, 24.5, ZZ));
  for (let k = 0; k < 20; k++) babylon.add(box(3, (k + 1), 1, brickD, ZX, (k + 1) / 2, ZZ + 15 + 5 - k * 1 + 0.5 - 5 + 5));
  // Häuser
  const house = (x, z, w, h) => { babylon.add(box(w, h, 4, (Math.abs(x) | 0) % 2 ? brick : brickD, x, h / 2, z)); babylon.add(box(w + 0.2, 0.3, 4.2, C(0x9a7a52), x, h + 0.15, z)); babylon.add(box(1, 1.9, 0.1, C(0x3a2416), x, 0.95, z + 2.02, { cast: false })); };
  for (const [x, z, w, h] of [[-26, -18, 5, 3.4], [-32, -10, 4, 3], [-20, -26, 4, 3.6], [18, -20, 5, 3.2], [24, -12, 4, 3], [30, -24, 6, 4], [-36, -28, 5, 3.4], [36, -8, 4, 3]]) house(x, z, w, h);
  const palm = (x, z, h = 6) => { for (let i = 0; i < h; i++) babylon.add(box(0.45, 1, 0.45, C(0x7a5a3a), x + Math.sin(i * 0.4) * 0.15 * i / h, i + 0.5, z)); const lm = C(0x3a8a32); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; babylon.add(box(Math.abs(Math.cos(a)) * 2.6 + 0.5, 0.25, Math.abs(Math.sin(a)) * 2.6 + 0.5, lm, x + Math.cos(a) * 1.3, h + 0.1, z + Math.sin(a) * 1.3)); } babylon.add(box(1.0, 0.5, 1.0, C(0x4a9a3a), x, h + 0.3, z)); };
  for (const [x, z, h] of [[-12, 14, 6], [12, 13, 7], [-20, 6, 6], [22, 4, 7], [-34, 12, 8], [32, 14, 6], [6, -12, 6], [-14, -8, 7]]) palm(x, z, h);
  // Feld 3×3 Kacheln (je 2 m) + Zusatzstreifen
  const FX = 0, FZ = 2; const wheat = M(T.wheat), soil = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x5a3a22, 0.12); for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) px(c, x, y, 0x3e2816); }, 3120));
  const tiles = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.position.set(FX - 2 + i * 2, 0, FZ - 2 + j * 2); g.add(box(1.96, 0.16, 1.96, soil, 0, 0.08, 0, { cast: false }));
    const wm = new THREE.MeshStandardMaterial({ map: T.wheat, roughness: 0.9, emissive: 0x000000 }); const w = box(1.8, 0.5, 1.8, wm, 0, 0.4, 0, { cast: false }); g.add(w); g.userData.wm = wm; babylon.add(g); tiles.push(g); }
  const extra = []; for (let j = 0; j < 3; j++) { const g = new THREE.Group(); g.position.set(FX + 4, 0, FZ - 2 + j * 2); const wm = new THREE.MeshStandardMaterial({ color: 0xffffff, map: T.wheat, roughness: 0.9, emissive: 0xe06a10, emissiveIntensity: 0.35 });
    g.add(box(1.96, 0.16, 1.96, soil, 0, 0.08, 0, { cast: false })); g.add(box(1.8, 0.5, 1.8, wm, 0, 0.4, 0, { cast: false })); babylon.add(g); extra.push(g); }
  const fenceM = C(0x8a6a3a); for (let k = -3; k <= 3; k += 0.5) { babylon.add(box(0.12, 0.8, 0.12, fenceM, FX + k, 0.4, FZ - 3.2)); babylon.add(box(0.12, 0.8, 0.12, fenceM, FX - 3.2, 0.4, FZ + k)); }
  babylon.add(box(6.4, 0.08, 0.08, fenceM, FX, 0.65, FZ - 3.2)); babylon.add(box(0.08, 0.08, 6.4, fenceM, FX - 3.2, 0.65, FZ));
  babylon.add(box(0.8, 0.5, 0.8, brickD, FX - 4.6, 0.25, FZ + 3.6)); // Sitzblock
  const sun = sunLight(babylon, 0xfff0d0, 3.4, V(-40, 60, 40), V(0, 0, 0), 40); babylon.add(new THREE.HemisphereLight(0xd8e8ff, 0x9a7a5a, 1.4));
  const scribe = humanoid(SCRIBE); babylon.add(scribe);
  const tabTex = tex(12, 14, (c, r) => { noiseFill(c, r, 12, 14, 0xb08860, 0.06); for (let y = 2; y < 13; y += 2) for (let x = 1; x < 11; x++) if (r() < 0.55) px(c, x, y, 0x6a4a2a); }, 3130);
  const tablet = new THREE.Group(); tablet.add(box(0.34, 0.4, 0.06, [C(0xa88058), C(0xa88058), C(0xa88058), C(0xa88058), M(tabTex), C(0xa88058)], 0, 0, 0.14)); scribe.userData.armL.add(tablet); tablet.position.set(0, -0.7, 0.05);
  const farmers = [0, 1].map(i => { const p = humanoid({ skin: [0xa8784e, 0xc08a5a][i], hair: 0x1a1410, top: [0xd8c8a0, 0x9a3a2a][i], bottom: [0xd8c8a0, 0x9a3a2a][i], skirt: true, beard: i === 0 ? 'short' : undefined, seed: 3140 + i }); babylon.add(p); return p; });
  babylon.userData = { scribe, tablet, tiles, extra, farmers, FX, FZ };
}

// =====================================================================
// SET 3: Mathe-Welt – Koordinaten-Boden, Säulen, Tafel
// =====================================================================
const math = new THREE.Scene();
const BX = 60, BY = 9.5, BZ = -2; // Tafel-Mittelpunkt (= Ursprung der Tafel)
{
  skyDome(math, 0x3468c0, 0x8cb6ea, 0xdfeaf6, V(-0.4, 0.5, 0.5)); math.fog = new THREE.Fog(0xdfeaf6, 90, 360); clouds(math, 41, 0xffffff, 40, 26, 220, 0.9);
  const quartz = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xeeeae2, 0.03); for (let i = 0; i < 16; i++) { px(c, i, 0, 0xbab4a8); px(c, 0, i, 0xbab4a8); } }, 3201));
  math.add(box(40, 1, 22, quartz, 0, -0.5, 0, { cast: false })); math.add(box(40, 1, 30, quartz, BX, -0.5, 4, { cast: false }));
  math.add(box(200, 0.5, 200, C(0x6aa03e), 30, -1.4, 0, { cast: false }));
  // Achsen auf dem Boden: x-Achse rot
  math.add(box(16, 0.04, 0.16, C(0xe03a2a), 0, 0.02, 0.85, { cast: false })); for (let x = -7; x <= 7; x++) math.add(box(0.06, 0.05, 0.4, C(0xe03a2a), x, 0.025, 0.85, { cast: false }));
  // Rückwand mit Raster
  const gridW = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xf6f4ee, 0.02); for (let i = 0; i < 16; i++) { px(c, i, 0, 0xc8d4e4); px(c, 0, i, 0xc8d4e4); } }, 3202));
  math.add(box(16, 11, 0.4, gridW, 0, 5.5, -0.75)); math.add(box(0.12, 11, 0.06, C(0x2a9a3a), 0, 5.5, -0.53, { cast: false })); // y-Achse grün
  // Säulen x = −3..3, Höhe x²
  const COLS = [0xd83a3a, 0xe8902a, 0xe8d030, 0xffffff, 0x4ac04a, 0x3a8ae8, 0x9a4ae8];
  const columns = {}; for (let x = -3; x <= 3; x++) { if (x === 0) continue; const g = new THREE.Group(); g.position.set(x, 0, 0); const n = x * x; const m = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, COLS[x + 3], 0.06); for (let i = 0; i < 16; i++) { px(c, i, 0, shade(COLS[x + 3], 0.7)); px(c, 0, i, shade(COLS[x + 3], 0.7)); px(c, i, 15, shade(COLS[x + 3], 0.7)); px(c, 15, i, shade(COLS[x + 3], 0.7)); } }, 3210 + x + 3));
    for (let k = 0; k < n; k++) g.add(box(0.98, 0.98, 0.98, m, 0, k + 0.5, 0)); math.add(g); columns[x] = g; }
  const zeroBlock = box(0.98, 0.12, 0.98, C(0xeeeeee), 0, 0.06, 0, { cast: false }); math.add(zeroBlock);
  // glatte Kurve y = x² vor den Säulen
  const curveM = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb000, emissiveIntensity: 0.9 });
  const curve = []; for (let i = 0; i <= 120; i++) { const x = -3.3 + 6.6 * i / 120; const b = box(0.16, 0.16, 0.16, curveM, x, x * x, 0.62, { cast: false }); b.userData.x = x; math.add(b); curve.push(b); }
  // Tafel
  const slate = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x1e3a32, 0.05); for (let i = 0; i < 16; i++) { px(c, i, 0, 0x3a6a5a); px(c, 0, i, 0x3a6a5a); } }, 3220));
  math.add(box(18, 19, 0.4, slate, BX, BY, BZ - 0.25)); const frameM = M(T.planks); math.add(box(18.8, 0.5, 0.6, frameM, BX, BY + 9.6, BZ - 0.2)); math.add(box(18.8, 0.5, 0.6, frameM, BX, BY - 9.6, BZ - 0.2));
  for (const s of [-1, 1]) { math.add(box(0.5, 19.7, 0.6, frameM, BX + s * 9.15, BY, BZ - 0.2)); math.add(box(0.5, BY - 9.6 + 0.2, 0.5, frameM, BX + s * 8, (BY - 9.6) / 2, BZ - 0.2)); }
  math.add(box(17, 0.1, 0.08, C(0xe8e8e8), BX, BY, BZ - 0.02, { cast: false })); math.add(box(0.1, 18, 0.08, C(0xe8e8e8), BX, BY, BZ - 0.02, { cast: false }));
  for (let k = -8; k <= 8; k++) { math.add(box(0.05, 0.3, 0.06, C(0xe8e8e8), BX + k, BY, BZ, { cast: false })); if (Math.abs(k) <= 8) math.add(box(0.3, 0.05, 0.06, C(0xe8e8e8), BX, BY + k, BZ, { cast: false })); }
  const boardCurve = []; const bcm = []; for (let i = 0; i <= 160; i++) { const col = HSL(0.02 + i / 160 * 0.75, 0.9, 0.58); const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8 });
    const b = box(0.24, 0.24, 0.24, m, 0, 0, BZ + 0.2, { cast: false }); math.add(b); boardCurve.push(b); }
  const ghost = []; const gm = new THREE.MeshStandardMaterial({ color: 0x6a8a80, emissive: 0x4a6a60, emissiveIntensity: 0.4, transparent: true, opacity: 0.6 });
  for (let i = 0; i <= 80; i++) { const b = box(0.14, 0.14, 0.14, gm, 0, 0, BZ + 0.12, { cast: false }); math.add(b); ghost.push(b); }
  const sun = sunLight(math, 0xfff2dc, 3.0, V(-30, 50, 45), V(20, 0, 0), 60); math.add(new THREE.HemisphereLight(0xd8e8ff, 0x8a8a7a, 1.5));
  const gal = humanoid(GALILEO); math.add(gal); const pupil = humanoid(ARCHER); math.add(pupil);
  math.userData = { columns, zeroBlock, curve, boardCurve, ghost, gal, pupil };
}
function plotBoard(a, c, ghostA = null, ghostC = 0) { const U = math.userData;
  U.boardCurve.forEach((b, i) => { const x = -6.5 + 13 * i / 160, y = a * x * x + c; b.visible = Math.abs(y) <= 9.1; b.position.set(BX + x, BY + y, BZ + 0.2); });
  U.ghost.forEach((b, i) => { const x = -6.5 + 13 * i / 80, y = (ghostA ?? 0) * x * x + ghostC; b.visible = ghostA !== null && Math.abs(y) <= 9.1; b.position.set(BX + x, BY + y, BZ + 0.12); }); }

// =====================================================================
// SET 4: Italien – Villa mit Terrasse, Zypressen
// =====================================================================
const italy = new THREE.Scene();
const TY = 4.0; // Terrassenhöhe, Kante bei x = 0
{
  skyDome(italy, 0x3a78cc, 0x96c0ea, 0xf6e0b8, V(-0.5, 0.45, 0.6)); italy.fog = new THREE.Fog(0xf0dcc0, 90, 380); clouds(italy, 51, 0xffffff, 60, 14, 220, 0.85);
  italy.add(box(600, 1, 600, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x7a9a42, 0.12), 3301)), 0, -0.5, 0, { cast: false }));
  const plaster = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xeed8b0, 0.05), 3302)), stoneW = M(tileTex(0xc8b490, 0x9a8a6a, 3303)), terra = M(tileTex(0xc0602e, 0x8a3e1e, 3304));
  // Terrasse (x < 0)
  italy.add(box(20, TY, 16, stoneW, -10, TY / 2, -2)); italy.add(box(20, 0.1, 16, M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0xb85a32 : 0xc87a4a, 0.92 + r() * 0.14)); }, 3305)), -10, TY + 0.05, -2, { cast: false }));
  for (let z = -9.5; z <= 5.5; z += 1) if (Math.abs(z - 0.5) > 1.2) italy.add(box(0.3, 0.8, 0.3, C(0xeadcc0), -0.2, TY + 0.4, z));
  // Villa
  const vg = new THREE.Group(); vg.position.set(-13, TY, -6); italy.add(vg); vg.add(box(12, 7, 7, plaster, 0, 3.5, 0)); for (let s = 0; s < 3; s++) vg.add(box(12.8 - s * 3.2, 0.8, 7.8, terra, 0, 7.4 + s * 0.8, 0));
  vg.add(box(3, 4, 3, plaster, 4, 9, 0)); vg.add(box(3.6, 0.8, 3.6, terra, 4, 11.4, 0));
  for (const x of [-4, -1, 2]) { vg.add(box(1.2, 2, 0.1, M(T.windowDark), x, 4.6, 3.52, { cast: false })); vg.add(box(0.3, 2, 0.12, C(0x3a6a3a), x - 0.75, 4.6, 3.54, { cast: false })); vg.add(box(0.3, 2, 0.12, C(0x3a6a3a), x + 0.75, 4.6, 3.54, { cast: false })); }
  vg.add(box(1.6, 2.8, 0.1, C(0x5a3a22), 4.6, 1.4, 3.52, { cast: false }));
  // Tisch an der Kante mit Rampe
  const tbl = new THREE.Group(); tbl.position.set(-1.0, TY, 0.5); italy.add(tbl); tbl.add(box(2.0, 0.1, 1.0, M(T.planks), 0, 0.95, 0)); for (const x of [-0.9, 0.9]) for (const z of [-0.4, 0.4]) tbl.add(box(0.1, 0.95, 0.1, C(0x5a3a22), x, 0.475, z));
  const ramp = box(1.4, 0.06, 0.24, M(T.planks), -0.45, 1.25, 0); ramp.rotation.z = -0.38; tbl.add(ramp); tbl.add(box(0.12, 0.55, 0.12, C(0x5a3a22), -1.0, 1.05 - 0.05, 0));
  // Zypressen, Hügel, Weinreben
  const cyp = (x, z, h) => { italy.add(box(0.4, 1, 0.4, C(0x5a3a22), x, 0.5, z)); for (let i = 0; i < h; i++) { const w = 1.4 * (1 - i / (h + 1)); italy.add(box(w, 1.05, w, C(i % 2 ? 0x2e5a2a : 0x34622e), x, 1 + i + 0.5, z)); } };
  for (const [x, z, h] of [[6, -10, 8], [9, -8, 7], [12, -11, 9], [-24, 8, 8], [-26, -14, 9], [16, 6, 8], [20, -16, 7], [5, 10, 7], [26, 2, 8]]) cyp(x, z, h);
  for (let r = 0; r < 6; r++) for (let k = 0; k < 14; k++) italy.add(box(0.6, 0.9, 0.6, C(k % 3 ? 0x4a7a2a : 0x5a8a32), 12 + k * 1.4, 0.45, 14 + r * 2.4));
  for (const [x, z, w, h, c] of [[40, -70, 80, 12, 0x6a8a3a], [-50, -90, 90, 16, 0x5e7e36], [80, -110, 90, 20, 0x7a9a4a], [-10, -140, 120, 26, 0x8aa0b0]]) italy.add(box(w, h, 30, C(c), x, h / 2, z));
  const sun = sunLight(italy, 0xfff0d0, 3.3, V(-35, 55, 45), V(-2, 2, 0), 34); italy.add(new THREE.HemisphereLight(0xd8e8ff, 0x8a7a5a, 1.4));
  const gal = humanoid(GALILEO); italy.add(gal);
  const ballM = C(0xb08a50, { metal: 0.4, rough: 0.4 }); const ball = box(0.24, 0.24, 0.24, ballM, 0, 0, 0); italy.add(ball);
  const trail = []; const tm = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb000, emissiveIntensity: 0.7 }); for (let i = 0; i < 12; i++) { const b = box(0.3, 0.3, 0.3, tm, 0, 0, 0.5, { cast: false }); italy.add(b); trail.push(b); }
  const line = []; const lm = new THREE.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff6a00, emissiveIntensity: 0.8 }); for (let i = 0; i <= 80; i++) { const b = box(0.09, 0.09, 0.09, lm, 0, 0, 0.5, { cast: false }); italy.add(b); line.push(b); }
  const guides = []; const gm2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }); for (let i = 0; i < 12; i++) { const b = box(0.04, 1, 0.04, gm2, 0, 0, 0.5, { cast: false }); italy.add(b); guides.push(b); }
  italy.userData = { gal, ball, trail, line, guides };
}
// Wurf von der Tischkante: Start (0, Y0), x = VX·τ, y = Y0 − G/2·τ²
const Y0 = TY + 1.12, VX = 1.6, G = 2.0, TAU_END = Math.sqrt(2 * Y0 / G);
const throwPos = tau => V(VX * tau, Y0 - 0.5 * G * tau * tau, 0.5);

// =====================================================================
// SET 5: Heute – Brücke, Satellitenschüssel, Brunnen
// =====================================================================
const today = new THREE.Scene();
{
  skyDome(today, 0x3a74c8, 0x8ab8e8, 0xd6e6f2, V(-0.5, 0.42, 0.4)); today.fog = new THREE.Fog(0xd6e6f2, 90, 400); clouds(today, 61, 0xffffff, 60, 24, 220, 0.9);
  today.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const water = new THREE.MeshStandardMaterial({ color: 0x3a7ab0, roughness: 0.2, metalness: 0.1 }); today.add(box(300, 0.1, 30, water, 0, -0.2, -30, { cast: false })); today.add(box(300, 1.2, 30, C(0x4a5a6a), 0, -1, -30, { cast: false }));
  // Bogenbrücke über den Fluss (Bogen = Parabel)
  const steel = C(0xc8402a, { metal: 0.4, rough: 0.5 }), deck = C(0x5a5a62); const R = 18, H = 10;
  for (let i = 0; i <= 60; i++) { const x = -R + 2 * R * i / 60, y = H * (1 - (x / R) ** 2); for (const z of [-26.5, -33.5]) today.add(box(0.9, 0.9, 0.9, steel, x, y + 0.4, z)); if (i % 4 === 0 && y > 1.4) for (const z of [-26.5, -33.5]) today.add(box(0.15, y - 1.2, 0.15, C(0xdddddd), x, 1.2 + (y - 1.2) / 2, z, { cast: false })); }
  today.add(box(2 * R + 10, 0.6, 8, deck, 0, 1.2, -30)); for (const z of [-26.2, -33.8]) today.add(box(2 * R + 10, 0.5, 0.2, C(0xe8e8e8), 0, 1.75, z, { cast: false }));
  for (const s of [-1, 1]) today.add(box(4, 1.6, 9, C(0x8a8a8a), s * (R + 1), 0.4, -30));
  // Häuser + Satellitenschüssel
  const conc = M(T.concrete); const hg = new THREE.Group(); hg.position.set(-40, 0, 10); today.add(hg); hg.add(box(10, 9, 8, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe8d8c0, 0.04), 3401)), 0, 4.5, 0)); hg.add(box(10.4, 0.5, 8.4, C(0x6a6a72), 0, 9.25, 0));
  for (const x of [-3, 0, 3]) for (const y of [2.5, 6]) hg.add(box(1.4, 1.6, 0.1, M(T.windowDark), x, y, 4.02, { cast: false }));
  const dish = new THREE.Group(); dish.position.set(-40, 9.5, 12); today.add(dish); dish.add(box(0.2, 1.6, 0.2, C(0x8a8a8a), 0, 0.8, 0));
  const dg = new THREE.Group(); dg.position.set(0, 2.0, 0); dg.rotation.x = 0.6; dish.add(dg); const dm = C(0xe8e8ec, { metal: 0.3, rough: 0.4 });
  for (let r = 0; r <= 6; r++) for (let a = 0; a < 6.28; a += 0.5 / Math.max(1, r)) { const rr = r * 0.22; dg.add(box(0.24, 0.08, 0.24, dm, Math.cos(a) * rr, 0.42 * (rr / 1.32) ** 2 * 1.4, Math.sin(a) * rr)); }
  dg.add(box(0.06, 1.0, 0.06, C(0x6a6a6a), 0, 0.6, 0)); dg.add(box(0.2, 0.2, 0.2, C(0x3a3a3a), 0, 1.1, 0));
  // Brunnen
  const plaza = M(tileTex(0xc8c0b0, 0x9a9488, 3402)); today.add(box(14, 0.1, 14, plaza, 30, 0.05, 12, { cast: false }));
  const fb = new THREE.Group(); fb.position.set(30, 0, 12); today.add(fb); for (const [x, z, w, d] of [[0, 3, 6.4, 0.4], [0, -3, 6.4, 0.4], [3, 0, 0.4, 6.4], [-3, 0, 0.4, 6.4]]) fb.add(box(w, 0.7, d, C(0xd8d0c0), x, 0.35, z));
  fb.add(box(5.8, 0.1, 5.8, new THREE.MeshStandardMaterial({ color: 0x5aa8d8, roughness: 0.15, metalness: 0.1 }), 0, 0.55, 0, { cast: false })); fb.add(box(0.7, 1.0, 0.7, C(0xd8d0c0), 0, 0.5, 0));
  const drops = []; const dropM = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x5aa8e8, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 });
  for (let j = 0; j < 8; j++) for (let k = 0; k < 14; k++) { const b = box(0.12, 0.12, 0.12, dropM, 0, 0, 0, { cast: false }); b.userData = { j, k }; fb.add(b); drops.push(b); }
  const sun = sunLight(today, 0xfff0d8, 3.2, V(-45, 60, 45), V(0, 0, -5), 70); today.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const kids = [0, 1].map(i => { const p = humanoid({ skin: [0xf0c4a2, 0xc89a72][i], hair: [0x8a4a22, 0x1a1a1a][i], longHair: i === 0, top: [0xe8b830, 0x3a8ae8][i], bottom: 0x2a3448, smile: true, scale: 0.78, seed: 3420 + i }); today.add(p); return p; });
  today.userData = { drops, kids };
}
function updateFountain(t) { today.userData.drops.forEach(b => { const { j, k } = b.userData; const a = j / 8 * Math.PI * 2, s = ((t * 0.55 + k / 14) % 1); const r = s * 2.4, y = 1.0 + 3.2 * s - 3.6 * s * s * 1.0 * 1.0 + 0;
  b.position.set(Math.cos(a) * r, Math.max(0.6, 1.0 + 4 * 2.2 * s * (1 - s) * 1.0 - 0.4 * s), Math.sin(a) * r); }); }

// =====================================================================
// SET 6: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901);
  for (let i = 0; i <= 40; i++) { const x = -30 + 60 * i / 40, y = 16 * (1 - (x / 30) ** 2); const col = HSL(i / 40 * 0.8, 0.8, 0.55); dusk.add(box(1.4, 1.4, 1.4, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 }), x, y, -70, { cast: false })); }
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
  fit('GALILEI, 1638', 72, 150, '#a3241c'); fit('ALLES, WAS MAN WIRFT,', 56, 290, '#3a2a1e'); fit('FLIEGT AUF EINER PARABEL', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 73.82; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(2) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(2) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix --word=2)
const CUTS = [[0, 'hero'], [5, 'babylon'], [10, 'scribe'], [22, 'know'], [30, 'tablet'], [38, 'three'], [48, 'unknown'],
  [59, 'change'], [68, 'multiply'], [77, 'cols'], [86, 'minus'], [97, 'build'], [106, 'arch'], [112, 'parabel'],
  [122, 'italy'], [127, 'galileo'], [135, 'fly'], [146, 'bahn'],
  [151, 'formula'], [164, 'apos'], [173, 'aneg'], [178, 'steep'], [187, 'cshift'],
  [195, 'archer'], [201, 'arrow'], [211, 'vertex'], [216, 'fall'], [221, 'zeros'],
  [234, 'bridge'], [240, 'dish'], [242, 'fountain'], [243, 'sign'], [250, 'loop']];
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
// Pfeilflug (Zeitlupe, gleiche Bahn): s = 0 … 1 entlang x = −AR … AR
const L0 = wt(202) + 0.08; // Abschuss (auf „Pfeil“)
function arrowS(t) {
  const A1 = wt(210) + 0.15, A2 = wt(216) - 0.05, A3 = wt(221) - 0.25;
  if (t < L0) return -1;
  if (t < A1) return 0.5 * Math.sin(Math.PI / 2 * (t - L0) / (A1 - L0));
  if (t < A2) return 0.5 + 0.025 * (t - A1) / (A2 - A1);
  if (t < A3) { const p = (t - A2) / (A3 - A2); return 0.525 + 0.475 * (p * p * 0.6 + p * 0.4); }
  return 1;
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, gold = s => `<span style="color:#ffd23f">${s}</span>`, orange = s => `<span style="color:#ffaa33">${s}</span>`;
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const ease = (t, t0, d = 0.35) => smoother((t - t0) / d);

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = plains, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const ptag = (p, text, color) => ui.tags.push([p, text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Wiese / Bogenschütze ----------
  if (['hero', 'loop', 'archer', 'arrow', 'vertex', 'fall', 'zeros'].includes(sh.id)) {
    scene = plains; const P = plains.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    const { archer, gal, arrow } = P; P.villagers.forEach(v => v.visible = false); P.zeros.forEach(z => z.visible = false); P.vtx.visible = false;
    if (sh.id === 'hero' || sh.id === 'loop') {
      put(archer, HX, 0, HZ, 0.5); put(gal, HX2, 0, HZ, -0.5); pose3(archer, 'idle', ta, 0); pose3(gal, 'idle', ta, 1);
      archer.userData.head.rotation.y = 0.25; gal.userData.head.rotation.y = -0.25; gal.userData.armR.rotation.x = -0.9; gal.userData.armR.rotation.z = 0.15;
      P.bowHand.visible = false; P.bowBack.visible = true; P.arrowHand.visible = false; P.ball.visible = true;
      P.arch.forEach(b => b.visible = true); const ax = 1.2 + ta * 0.4; arrow.visible = true; arrow.position.set(ax, archY(ax) + 0.1, AZ); arrow.rotation.set(0, 0, Math.atan(-2 * AH * ax / (AR * AR)));
      heroCam(ta); tag(archer, 'Bogenschütze', HERO); tag(gal, 'Galilei', ALLY);
    } else {
      gal.visible = false; P.ball.visible = false; put(archer, -AR - 0.6, 0, AZ, Math.PI / 2 - 0.4); P.bowHand.visible = true; P.bowBack.visible = false;
      const s = arrowS(t); P.arrowHand.visible = s < 0; aimPose(archer, t, s < 0 ? smoother((t - sh.a) / 1.2) : 0.2);
      const ax = -AR + 2 * AR * Math.max(0, s); arrow.visible = s >= 0 && s < 1.0001; if (s >= 1) { arrow.position.set(AR + 0.3, 0.25, AZ); arrow.rotation.set(0, 0, -1.0); }
      else if (s >= 0) { arrow.position.set(ax, archY(ax) + 1.2 * (1 - Math.min(1, s / 0.04)) * 0, AZ); arrow.rotation.set(0, 0, Math.atan(-2 * AH * ax / (AR * AR))); }
      P.arch.forEach(b => b.visible = s >= 0 && b.userData.x <= ax);
      if (sh.id === 'archer') { mv(u, V(-AR + 3.6, 1.85, AZ + 3.4), V(-AR + 3.2, 1.8, AZ + 2.9), V(-AR - 0.5, 1.3, AZ), V(-AR - 0.5, 1.3, AZ), 46); tag(archer, 'Bogenschütze', HERO); ptag(V(AR + 8, 12.5, AZ + 3.6), 'Burg', BAD); }
      if (sh.id === 'arrow') { mv(u, V(-10, 3.0, AZ + 12), V(-8.4, 4.0, AZ + 12.6), V(-10, 2.8, AZ), V(-7.2, 4.6, AZ), 50); tag(archer, 'Bogenschütze', HERO);
        if (t >= wt(204)) eff(wt(204), 'Langsamkeit', 'Pfeil bremst', '#8a9ab8'); }
      if (sh.id === 'vertex') { P.vtx.visible = true; P.vtx.scale.setScalar(1 + 0.12 * Math.sin(t * 8)); mv(u, V(2.2, AH + 0.4, AZ + 13), V(1.9, AH + 0.3, AZ + 12), V(0, AH - 0.8, AZ), V(0, AH - 0.8, AZ), 46);
        tip(wt(215), 'peak', 'Scheitelpunkt', '#ffff55', [gray('höchster (oder tiefster)'), gray('Punkt der Parabel')]); }
      if (sh.id === 'fall') { P.vtx.visible = true; mv(u, V(3.2, 3.6, AZ + 13), V(3.8, 3.2, AZ + 12.4), V(6.5, 3.0, AZ), V(8, 2.0, AZ), 48); }
      if (sh.id === 'zeros') { P.vtx.visible = true; const zo = t >= wt(226); P.zeros.forEach((z, i) => { z.visible = zo; z.scale.setScalar(zo ? smoother((t - wt(226) - i * 0.15) / 0.25) || 0.001 : 1); });
        mv(u, V(0, 13, AZ + 46), V(0, 12.6, AZ + 44), V(0, 3.2, AZ), V(0, 3.2, AZ), 60);
        if (zo) { ptag(V(-AR, 2.0, AZ), 'Nullstelle', '#ff7a6a'); ptag(V(AR, 2.0, AZ), 'Nullstelle', '#ff7a6a'); } ptag(V(0, AH + 1.0, AZ), 'Scheitelpunkt', '#ffff55');
        tip(wt(226), 'zero', 'Nullstellen', '#ff7a6a', [gray('Hier gilt: f(x) = 0'), gray('Die Parabel trifft den Boden')]); }
    }
  }
  // ---------- Babylon ----------
  if (['babylon', 'scribe', 'know', 'tablet', 'three', 'unknown'].includes(sh.id)) {
    scene = babylon; const B = babylon.userData; const { scribe, FX, FZ } = B; scribe.userData.setFace({}); B.tablet.visible = true;
    B.tiles.forEach(g => { g.userData.wm.emissive.setHex(0x000000); g.position.y = 0; }); B.extra.forEach(g => g.visible = false); B.farmers.forEach(p => p.visible = false);
    if (sh.id === 'babylon') { put(scribe, FX - 3.9, 0, FZ + 3.0, 0.6); pose3(scribe, 'walk', t); scribe.position.x = FX - 6 + (t - sh.a) * 0.6;
      B.farmers.forEach((p, i) => { put(p, [16, 19][i], 0, [10, 11][i], [-2.4, 2.6][i]); pose(p, 'work', t, i); });
      mv(u, V(30, 16, 40), V(26, 15, 36), V(-4, 6, -18), V(-4, 6.5, -19), 46); info(wt(5) + 0.05, 'Babylon, vor fast 4000 Jahren'); }
    if (sh.id === 'scribe') { put(scribe, FX - 4.0, 0, FZ + 3.9, 0.05); pose3(scribe, 'idle', t); scribe.userData.head.rotation.y = 0.3;
      mv(u, V(FX - 5.6, 2.3, FZ + 10.0), V(FX - 5.5, 2.25, FZ + 9.2), V(FX - 3.0, 0.95, FZ + 2.8), V(FX - 3.0, 0.95, FZ + 2.8), 50); tag(scribe, 'Schreiber', HERO);
      if (t >= wt(17)) { ptag(V(FX, 1.0, FZ + 3.3), 'Seite = ?', '#ffff55'); ptag(V(FX - 3.3, 1.0, FZ), '?', '#ffff55'); } }
    if (sh.id === 'know') { put(scribe, FX - 4.0, 0, FZ + 3.9, 0.75); pose3(scribe, 'idle', t); scribe.userData.head.rotation.x = -0.15; scribe.userData.armR.rotation.x = -2.0; scribe.userData.armR.rotation.z = 0.5;
      mv(u, V(FX - 2.2, 1.95, FZ + 8.4), V(FX - 2.4, 1.9, FZ + 7.7), V(FX - 3.8, 1.35, FZ + 3.9), V(FX - 3.8, 1.5, FZ + 3.9), 46); tag(scribe, 'Schreiber', HERO);
      say(wt(25), 'Schreiber', HERO, `Fläche + Seite = ${t >= wt(29) ? '12' : '…'}`); }
    if (sh.id === 'tablet') { put(scribe, FX - 4.6, 0, FZ + 3.6, 0.55); pose(scribe, 'write', t); sitPose(scribe, 0.5); B.tablet.visible = false; const tb = B.tablet; scribe.userData.armL.rotation.x = -1.1;
      B.tablet.visible = true; mv(u, V(FX - 3.6, 1.45, FZ + 7.2), V(FX - 3.7, 1.42, FZ + 6.6), V(FX - 4.5, 1.0, FZ + 3.7), V(FX - 4.4, 0.95, FZ + 3.7), 46); tag(scribe, 'Schreiber', HERO);
      chat(wt(32), gray('2·2 + 2 = 6')); chat(wt(35), gray('3·3 + 3 = 12 ') + green('✔')); if (t >= wt(37)) eff(wt(37), 'Seite gefunden', '= 3', '#55ff55'); }
    if (sh.id === 'three') { const k9 = ease(t, wt(39) - 0.05, 0.5), k3 = ease(t, wt(44) - 0.05, 0.35);
      B.tiles.forEach((g, i) => { const on = t >= wt(39) + i * 0.06; g.userData.wm.emissive.setHex(on ? 0x7a5a00 : 0); g.position.y = on ? 0.12 * Math.max(0, 1 - (t - wt(39) - i * 0.06) / 0.2) : 0; });
      B.extra.forEach((g, i) => { g.visible = t >= wt(44) + i * 0.08; g.position.y = g.visible ? 0.4 * Math.max(0, 1 - (t - wt(44) - i * 0.08) / 0.2) : 0; });
      put(scribe, FX - 4.0, 0, FZ + 3.9, 0.75); pose3(scribe, 'point', t);
      mv(u, V(FX + 1.0, 11.5, FZ + 10.5), V(FX + 1.0, 11.0, FZ + 9.6), V(FX + 1.0, 0, FZ + 0.4), V(FX + 1.0, 0, FZ + 0.4), 46);
      if (t >= wt(39)) ptag(V(FX, 0.9, FZ + 3.3), '3', '#ffffff'); if (t >= wt(41)) ptag(V(FX - 3.4, 0.9, FZ + 0.2), '3', '#ffffff');
      if (t >= wt(43)) ptag(V(FX, 1.4, FZ), '9', '#ffd23f'); if (t >= wt(45)) ptag(V(FX + 4, 1.4, FZ), '+3', '#ffaa33'); if (t >= wt(47)) say(wt(47), 'Schreiber', HERO, `9 + 3 = 12 ${green('✔')}`); }
    if (sh.id === 'unknown') { B.extra.forEach(g => g.visible = true); B.tiles.forEach(g => g.userData.wm.emissive.setHex(0x3a2a00)); put(scribe, FX - 4.0, 0, FZ + 3.9, 0.75); pose3(scribe, 'cross', t); scribe.userData.setFace({ smile: true });
      mv(u, V(FX + 2.0, 3.4, FZ + 12.0), V(FX + 1.6, 3.2, FZ + 11.2), V(FX - 2.7, 0.9, FZ + 2.6), V(FX - 2.7, 0.9, FZ + 2.6), 48); tag(scribe, 'Schreiber', HERO);
      if (t >= wt(49)) { ptag(V(FX, 1.0, FZ + 3.3), 'x', '#ffff55'); ptag(V(FX - 3.4, 1.0, FZ), 'x', '#ffff55'); }
      tip(wt(57), 'eq', 'Quadratische Gleichung', '#ffff55', [gold('x² + x = 12'), gray('x = Seite des Feldes = ') + green('3')]); }
  }
  // ---------- Mathe-Welt ----------
  if (['change', 'multiply', 'cols', 'minus', 'build', 'arch', 'parabel', 'formula', 'apos', 'aneg', 'steep', 'cshift'].includes(sh.id)) {
    scene = math; exp = 1.25; const Mt = math.userData; const { gal, pupil } = Mt; gal.userData.setFace({}); pupil.visible = false;
    const rise = (x, t0) => { const g = Mt.columns[x]; const n = x * x; const k = clamp01((t - t0) / (0.12 + n * 0.04)); g.visible = k > 0; g.children.forEach((b, i) => b.visible = i < Math.ceil(k * n)); };
    Object.values(Mt.columns).forEach(g => { g.visible = false; }); Mt.curve.forEach(b => b.visible = false); Mt.zeroBlock.visible = true;
    const all = () => { for (const x of [-3, -2, -1, 1, 2, 3]) rise(x, -10); };
    const numTags = (xs) => xs.forEach(x => ptag(V(x, 0.0, 1.25), String(x).replace('-', '−'), '#ffffff'));
    plotBoard(1, 0); Mt.boardCurve.forEach(b => b.visible = false); Mt.ghost.forEach(b => b.visible = false);
    if (sh.id === 'change') { put(gal, -3.6, 0, 1.8, 1.0); pose3(gal, 'walk', t); gal.position.x = -3.8 + (t - sh.a) * 0.55; gal.rotation.y = 1.2; mv(u, V(-1.2, 2.6, 8.6), V(-1.1, 2.5, 7.8), V(-1.8, 1.8, 0.6), V(-1.8, 1.8, 0.6), 48); tag(gal, 'Galilei', ALLY); numTags([-3, -2, -1, 0, 1, 2, 3]); }
    if (sh.id === 'multiply') { put(gal, -3.4, 0, 1.8, 0.55); pose3(gal, 'point', t); mv(u, V(-1.4, 2.1, 6.9), V(-1.6, 2.05, 6.2), V(-2.9, 1.5, 1.2), V(-2.9, 1.5, 1.2), 46); tag(gal, 'Galilei', ALLY);
      tip(wt(72), 'fx', 'Die Funktion', '#55ffff', [gold('f(x) = x · x = x²'), gray('Zahl mal sich selbst')]); }
    if (sh.id === 'cols') { rise(1, wt(79)); rise(2, wt(82)); rise(3, wt(85)); put(gal, -4.6, 0, 1.6, 0.5); pose3(gal, 'point', t);
      mv(u, V(2.6, 3.2, 12.5), V(2.4, 3.4, 11.4), V(1.8, 3.4, 0), V(1.8, 3.6, 0), 46); numTags([1, 2, 3]);
      if (t >= wt(79)) ptag(V(1, 1.3, 0.5), '1', '#ffd23f'); if (t >= wt(82)) ptag(V(2, 4.3, 0.5), '4', '#ffd23f'); if (t >= wt(85)) ptag(V(3, 9.3, 0.5), '9', '#ffd23f'); }
    if (sh.id === 'minus') { for (const x of [1, 2, 3]) rise(x, -10); rise(-3, wt(90)); rise(-2, wt(92) + 0.1); rise(-1, wt(93) + 0.1); put(gal, -5.4, 0, 2.6, 0.5); pose3(gal, 'idle', t);
      mv(u, V(-3.0, 3.6, 12.0), V(-2.6, 3.8, 11.0), V(-1.4, 3.6, 0), V(-1.2, 3.8, 0), 46); numTags([-3, -2, -1, 1, 2, 3]);
      if (t >= wt(90)) ptag(V(-3, 9.3, 0.5), '9', '#ffd23f'); if (t >= wt(92) + 0.2) ptag(V(-2, 4.3, 0.5), '4', '#ffd23f'); if (t >= wt(93) + 0.2) ptag(V(-1, 1.3, 0.5), '1', '#ffd23f');
      chat(wt(91), gold('(−3) · (−3) = 9')); chat(wt(95), gray('minus · minus = ') + green('plus')); }
    if (sh.id === 'build' || sh.id === 'arch' || sh.id === 'parabel') { all(); put(gal, -5.4, 0, 2.6, 0.5); pose3(gal, sh.id === 'parabel' ? 'clap' : 'idle', t); numTags([-3, -2, -1, 0, 1, 2, 3]); }
    if (sh.id === 'build') { mv(u, V(7.5, 2.0, 9.5), V(6.8, 2.2, 8.6), V(0.5, 3.2, 0), V(0.3, 3.4, 0), 48); if (t >= wt(108)) ptag(V(0, 10.6, 0), 'Treppe?', GREY); }
    if (sh.id === 'arch') { const k = clamp01((t - wt(109)) / (wt(111) + 0.3 - wt(109))); Mt.curve.forEach((b, i) => b.visible = i / 120 <= k);
      mv(u, V(0, 4.6, 15.5), V(0, 4.8, 14.5), V(0, 4.0, 0), V(0, 4.2, 0), 48); if (t < wt(109)) ptag(V(0, 10.6, 0), 'Treppe?', GREY); else ptag(V(0, 10.6, 0), 'Bogen!', '#ffd23f'); }
    if (sh.id === 'parabel') { Mt.curve.forEach(b => b.visible = true); mv(u, V(3.6, 6.4, 11.5), V(2.8, 6.2, 10.6), V(0, 4.2, 0), V(0, 4.2, 0), 50); tag(gal, 'Galilei', ALLY);
      tip(wt(115), 'para', 'Parabel', '#ffd23f', [gray('Bild der Funktion'), gold('f(x) = x²')]); }
    // Tafel
    if (['formula', 'apos', 'aneg', 'steep', 'cshift'].includes(sh.id)) {
      put(gal, BX - 9.6 - 0.2, 0, 1.4, 0.7); pose3(gal, 'point', t); tag(gal, 'Galilei', ALLY);
      let a = 1, c = 0, ga = null, gc = 0;
      if (sh.id === 'aneg') { a = lerp(1, -1, ease(t, wt(175) - 0.05, 0.5)); ga = 1; }
      if (sh.id === 'steep') { const k1 = ease(t, wt(180), 0.35), k2 = ease(t, wt(185), 0.45); a = lerp(lerp(1, 3, k1), 0.25, k2); ga = 1; }
      if (sh.id === 'cshift') { const k1 = ease(t, wt(192) - 0.1, 0.35), k2 = ease(t, wt(194) - 0.1, 0.4); c = lerp(lerp(0, 4, k1), -4, k2); a = 0.6; ga = 0.6; }
      if (sh.id !== 'formula' || t >= wt(158)) plotBoard(a, c, ga, gc);
      const fa = a.toFixed(1).replace('-', '−').replace('.', ','), fc = c.toFixed(0).replace('-', '−');
      if (sh.id === 'formula') { mv(u, V(BX + 1.5, BY - 1.5, 26), V(BX + 1.2, BY - 1.2, 24), V(BX, BY + 1.6, BZ), V(BX, BY + 1.8, BZ), 50);
        const parts = [[156, 'a'], [157, '·x'], [158, '²'], [159, ' + '], [160, 'b'], [161, '·x'], [162, ' + '], [163, 'c']]; let f = 'f(x) = '; parts.forEach(([i, s]) => { if (t >= wt(i)) f += s; });
        tip(wt(155), 'fx', 'Die ganze Formel', '#55ffff', [gold(f), gray('a, b, c sind feste Zahlen')]); }
      if (sh.id === 'apos') { mv(u, V(BX - 3.0, BY - 1.0, 22), V(BX - 2.6, BY - 0.8, 20.5), V(BX, BY + 1.8, BZ), V(BX, BY + 2.0, BZ), 50); ptag(V(BX + 4.6, BY + 6.5, BZ + 0.4), 'a > 0', '#55ff55'); if (t >= wt(167)) ptag(V(BX - 4.6, BY + 6.5, BZ + 0.4), 'nach oben offen', '#ffffff'); eff(wt(165), `a = ${fa}`, 'positiv', '#55ff55'); }
      if (sh.id === 'aneg') { mv(u, V(BX + 2.4, BY + 1.0, 22), V(BX + 2.0, BY + 0.6, 20.5), V(BX, BY + 2.0, BZ), V(BX, BY + 2.0, BZ), 50); if (a < 0) ptag(V(BX + 4.6, BY - 5.4, BZ + 0.4), 'a < 0', BAD); eff(wt(174), `a = ${fa}`, a < 0 ? 'negativ' : 'positiv', a < 0 ? BAD : '#55ff55'); }
      if (sh.id === 'steep') { mv(u, V(BX - 1.2, BY, 23), V(BX - 0.8, BY + 0.2, 21.2), V(BX, BY + 2.0, BZ), V(BX, BY + 2.0, BZ), 50); eff(wt(179), `a = ${fa}`, a > 1.5 ? 'steil' : a < 0.6 ? 'flach' : '', '#ffd23f'); }
      if (sh.id === 'cshift') { mv(u, V(BX + 1.6, BY, 23), V(BX + 1.2, BY - 0.2, 21.2), V(BX, BY + 2.0, BZ), V(BX, BY + 1.8, BZ), 50); eff(wt(188), `c = ${fc}`, c > 0.5 ? 'nach oben' : c < -0.5 ? 'nach unten' : '', '#55ffff'); }
    }
  }
  // ---------- Italien ----------
  if (['italy', 'galileo', 'fly', 'bahn'].includes(sh.id)) {
    scene = italy; exp = 1.3; const It = italy.userData; const { gal, ball } = It; It.trail.forEach(b => b.visible = false); It.line.forEach(b => b.visible = false); It.guides.forEach(b => b.visible = false);
    put(gal, -2.4, TY, 1.5, 1.2); pose3(gal, 'point', t); gal.userData.armR.rotation.x = -1.3;
    const rollBall = (t0, rollDur, slow) => { // Kugel rollt über den Tisch und fällt (Zeitlupe slow)
      const dt = t - t0; if (dt < rollDur) { const k = smoother(dt / rollDur) * 0.6 + dt / rollDur * 0.4; ball.position.set(lerp(-1.6, 0, k), Y0, 0.5); ball.rotation.z = -k * 6; return -1; }
      const tau = Math.min(TAU_END, (dt - rollDur) * slow); ball.position.copy(throwPos(tau)); ball.rotation.z -= 0.1; return tau; };
    if (sh.id === 'italy') { ball.position.set(-1.9, Y0, 0.5); mv(u, V(26, 14, 30), V(23, 13, 27), V(-6, 5, -4), V(-6, 5.4, -4), 46); info(wt(122) + 0.05, 'Italien, vor knapp 400 Jahren'); }
    if (sh.id === 'galileo') { rollBall(wt(130), 3.0, 1); mv(u, V(-0.8, TY + 1.95, 5.6), V(-0.85, TY + 1.9, 5.0), V(-1.9, TY + 1.2, 1.1), V(-1.8, TY + 1.2, 1.1), 46); tag(gal, 'Galilei', ALLY); }
    if (sh.id === 'fly' || sh.id === 'bahn') {
      const tau = sh.id === 'fly' ? rollBall(sh.a, 0.45, 0.95) : TAU_END; if (sh.id === 'bahn') ball.position.copy(throwPos(TAU_END));
      const STEP = TAU_END / 8; It.trail.forEach((b, i) => { const ti = (i + 1) * STEP; b.visible = tau >= ti && i < 8; if (b.visible) b.position.copy(throwPos(ti)); });
      It.guides.forEach((g, i) => { const ti = (i + 1) * STEP; g.visible = sh.id === 'fly' && tau >= ti && i < 8 && t >= wt(140); if (g.visible) { const p = throwPos(ti); g.scale.y = Y0 - p.y + 0.001; g.position.set(p.x, (Y0 + p.y) / 2, 0.5); } });
      if (sh.id === 'fly') { mv(u, V(7.8, 3.0, 7.4), V(7.4, 2.9, 6.8), V(1.9, 2.7, 0.5), V(1.9, 2.6, 0.5), 50); if (t >= wt(135)) ptag(V(3.0, Y0 + 0.35, 0.5), '→ gleichmäßig', '#55ffff'); if (t >= wt(140)) ptag(V(5.2, 2.4, 0.5), '↓ immer schneller', '#ff7a6a'); }
      if (sh.id === 'bahn') { const k = clamp01((t - wt(148)) / 0.6); It.line.forEach((b, i) => { b.visible = i / 80 <= k; b.position.copy(throwPos(TAU_END * i / 80)); });
        mv(u, V(-1.0, 4.0, 11.5), V(-0.6, 4.2, 10.8), V(1.6, 3.0, 0), V(1.6, 3.0, 0), 48); tag(gal, 'Galilei', ALLY);
        tip(wt(149), 'ball', 'Wurfparabel', '#ffaa33', [gray('Flugbahn jedes Wurfs'), gray('(ohne Luftwiderstand exakt)')]); }
    }
  }
  // ---------- Heute ----------
  if (['bridge', 'dish', 'fountain'].includes(sh.id)) {
    scene = today; const Td = today.userData; updateFountain(t); Td.kids.forEach(k => k.visible = false);
    if (sh.id === 'bridge') { mv(u, V(-30, 6, 8), V(-27, 6.6, 6), V(0, 5, -30), V(2, 5, -30), 50); info(wt(234) + 0.05, 'Heute'); ptag(V(0, 12.2, -26.5), 'Parabel', '#ffd23f'); }
    if (sh.id === 'dish') { mv(u, V(-37.5, 14.2, 19.5), V(-38.0, 14.0, 18.6), V(-40, 11.3, 12), V(-40, 11.3, 12), 46); ptag(V(-40, 13.4, 12.8), 'Parabel', '#ffd23f'); }
    if (sh.id === 'fountain') { Td.kids.forEach((k, i) => { put(k, 30 + [-1.6, 1.8][i], 0, 12 + 4.0, [0.35, -0.35][i]); pose3(k, 'laugh', t, i); });
      mv(u, V(31.5, 2.5, 24.0), V(31.3, 2.4, 23.0), V(30, 1.7, 13), V(30, 1.7, 13), 48); ptag(V(32.4, 3.4, 12), 'Parabel', '#ffd23f'); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  eq: '<rect x="1" y="2" width="6" height="1" fill="#ffd23f"/><rect x="1" y="5" width="6" height="1" fill="#ffd23f"/><rect x="0" y="0" width="2" height="1" fill="#ffffff"/>',
  fx: '<rect x="1" y="1" width="1" height="6" fill="#55ffff"/><rect x="1" y="6" width="6" height="1" fill="#55ffff"/><rect x="2" y="5" width="1" height="1" fill="#ffd23f"/><rect x="3" y="4" width="1" height="1" fill="#ffd23f"/><rect x="4" y="2" width="1" height="2" fill="#ffd23f"/><rect x="5" y="1" width="1" height="1" fill="#ffd23f"/>',
  para: '<rect x="1" y="1" width="1" height="2" fill="#ff5555"/><rect x="2" y="3" width="1" height="2" fill="#ffaa33"/><rect x="3" y="5" width="2" height="1" fill="#ffd23f"/><rect x="5" y="3" width="1" height="2" fill="#55ff55"/><rect x="6" y="1" width="1" height="2" fill="#55aaff"/>',
  peak: '<rect x="3" y="1" width="2" height="2" fill="#ffff55"/><rect x="2" y="3" width="1" height="1" fill="#ffaa33"/><rect x="5" y="3" width="1" height="1" fill="#ffaa33"/><rect x="1" y="4" width="1" height="2" fill="#ff7a3a"/><rect x="6" y="4" width="1" height="2" fill="#ff7a3a"/><rect x="0" y="6" width="1" height="1" fill="#ff5a3a"/><rect x="7" y="6" width="1" height="1" fill="#ff5a3a"/>',
  zero: '<rect x="0" y="6" width="8" height="1" fill="#6aa03e"/><rect x="1" y="2" width="1" height="4" fill="#ff7a6a"/><rect x="6" y="2" width="1" height="4" fill="#ff7a6a"/><rect x="2" y="1" width="4" height="1" fill="#ffd23f"/>',
  ball: '<rect x="2" y="2" width="4" height="4" fill="#c8a060"/><rect x="3" y="2" width="2" height="1" fill="#f0d8a0"/><rect x="0" y="7" width="1" height="1" fill="#ffd23f"/><rect x="1" y="1" width="1" height="1" fill="#ffaa33"/>',
};
const NUM = { 'viertausend': '4000', 'zwölf.': '12.', 'zwölf': '12', 'drei.': '3.', 'drei': '3', 'neun,': '9,', 'neun.': '9.', 'Eins': '1', 'eins.': '1.', 'Zwei': '2', 'vier.': '4.', 'Drei': '3', 'iks': 'x', 'vierhundert': '400', 'c.': 'c.', 'minus': 'minus' };
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
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
