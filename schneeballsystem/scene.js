// „Schneeballsystem, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
const PONZI = { skin: 0xe8b894, hair: 0x141010, beard: 'mustache', top: 0xe8dcc0, bottom: 0xe8dcc0, coat: true, tie: 0xb3201c, shoe: 0x3a2416, eye: '#2a1a10', smile: true, seed: 51 };
const ROSA = { skin: 0xf0c4a2, hair: 0x6a3a1a, longHair: true, top: 0x2a6aa8, bottom: 0x2a6aa8, skirt: true, shoe: 0x3a2416, eye: '#3a5a2a', smile: true, seed: 52 };
const BARRON = { skin: 0xf0c8a8, hair: 0xe8e8e8, bald: true, beard: 'full', beardCol: 0xf0f0f0, top: 0x3a3a44, bottom: 0x3a3a44, coat: true, tie: 0x8a2a2a, shoe: 0x111111, eye: '#3a3a3a', smile: true, seed: 53 };
const MADOFF = { skin: 0xf0c8a8, hair: 0xc8c8c8, hairVol: true, top: 0x23262e, bottom: 0x23262e, coat: true, tie: 0x2a4a8a, shoe: 0x111111, eye: '#3a3a3a', smile: true, seed: 54 };
const goldM = M(T.gold, { metal: 0.25, rough: 0.45 });
function boater(ch) { const g = new THREE.Group(); const st = C(0xe8d08a); g.add(box(0.74, 0.04, 0.74, st, 0, 0.53, 0)); g.add(box(0.52, 0.18, 0.52, st, 0, 0.63, 0)); g.add(box(0.53, 0.07, 0.53, C(0x1a1a22), 0, 0.58, 0)); ch.userData.head.add(g); ch.userData.hatExtra = 0.2; return g; }
function cloche(ch, col) { const g = new THREE.Group(); const m = C(col); g.add(box(0.58, 0.2, 0.58, m, 0, 0.53, 0)); g.add(box(0.64, 0.05, 0.64, m, 0, 0.45, 0.02)); g.add(box(0.1, 0.1, 0.04, C(0xe8e0d0), 0.2, 0.55, 0.29, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.12; return g; }
const goldBar = () => { const g = new THREE.Group(); g.add(box(0.3, 0.16, 0.2, goldM, 0, 0, 0.12)); return g; };
const moneyBag = () => { const g = new THREE.Group(); const m = C(0xc8b07a); g.add(box(0.36, 0.34, 0.3, m, 0, -0.1, 0.12)); g.add(box(0.18, 0.1, 0.16, m, 0, 0.12, 0.12)); g.add(box(0.2, 0.04, 0.18, C(0x6a4a2a), 0, 0.08, 0.12, { cast: false })); g.add(box(0.12, 0.14, 0.02, C(0x3a8a3a), 0, -0.1, 0.28, { cast: false })); return g; };
const paperSlip = () => { const g = new THREE.Group(); g.add(box(0.26, 0.18, 0.02, C(0xe8e2c8), 0, 0, 0.14)); g.add(box(0.18, 0.03, 0.01, C(0x5a7aa8), 0, 0.03, 0.155, { cast: false })); return g; };
const newspaper = () => { const g = new THREE.Group(); g.add(box(0.5, 0.36, 0.03, C(0xe8e4d8), 0, 0.05, 0.2)); g.add(box(0.4, 0.06, 0.01, C(0x222222), 0, 0.15, 0.22, { cast: false })); g.add(box(0.18, 0.12, 0.01, C(0x6a6a6a), -0.1, -0.02, 0.22, { cast: false })); return g; };
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`, gold = s => `<span style="color:#ffd23f">${s}</span>`;
function person1920(i, seed) {
  const fem = i % 3 === 1; const o = { skin: [0xe8b894, 0xf0c4a2, 0xe0a882, 0xf2cdb0, 0xc89a72][i % 5], hair: [0x3a2a1a, 0x8a5a2a, 0x2a1a14, 0xb8925a, 0x1a1a1a][(i * 3) % 5],
    top: fem ? [0x8a2a4a, 0x3a6a5a, 0xa86a2a, 0x5a4a8a][i % 4] : [0x4a3a2a, 0x3a3a44, 0x5a4a3a, 0x2a3a4a, 0x6a5a4a][i % 5], bottom: fem ? undefined : [0x2a2a30, 0x3a3228, 0x2a2a3a][i % 3], longHair: fem, skirt: fem,
    beard: !fem && i % 4 === 0 ? 'mustache' : undefined, coat: !fem && i % 2 === 0, seed };
  if (fem) o.bottom = o.top;
  const p = humanoid(o); if (fem) cloche(p, [0x6a2a3a, 0x2a4a3a, 0x8a6a3a][i % 3]); else if (i % 5 === 2) { p.userData.hatExtra = 0.12; const h = C(0x2a2622); p.userData.head.add(box(0.62, 0.04, 0.62, h, 0, 0.52, 0)); p.userData.head.add(box(0.5, 0.2, 0.5, h, 0, 0.63, 0)); }
  else if (i % 5 !== 4) { p.userData.head.add(box(0.56, 0.12, 0.56, C(0x4a443c), 0, 0.53, 0)); p.userData.head.add(box(0.46, 0.04, 0.2, C(0x4a443c), 0, 0.5, 0.33)); p.userData.hatExtra = 0.06; }
  return p;
}
// Voxel-Kugel (Schneeball / Erde) als InstancedMesh
function voxelBall(R, s, colFn) {
  const pts = []; const n = Math.ceil(R / s);
  for (let x = -n; x <= n; x++) for (let y = -n; y <= n; y++) for (let z = -n; z <= n; z++) { const d = Math.hypot(x, y, z) * s; if (d <= R && d > R - s * 1.75) pts.push([x * s, y * s, z * s]); }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshStandardMaterial({ map: solidTex(0xffffff, 0.12, 77), roughness: 0.6, metalness: 0.1 }), pts.length);
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  pts.forEach((p, i) => { mtx.makeTranslation(p[0], p[1], p[2]); mesh.setMatrixAt(i, mtx); mesh.setColorAt(i, col.setHex(colFn(p[0] / R, p[1] / R, p[2] / R, i))); });
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
const snowGoldCol = (x, y, z, i) => { const h = Math.sin(x * 9.1 + y * 5.3) * Math.cos(z * 7.7 - y * 3.1) + Math.sin(i * 12.9898) * 0.4; return h > 0.55 ? 0xffc928 : h > 0.38 ? 0x4aa84a : h < -0.9 ? 0xd8e4f0 : 0xf4f8fc; };

// =====================================================================
// SET 1: Boston 1920 – Straße am späten Nachmittag
// =====================================================================
const boston = new THREE.Scene();
{
  const sky = skyDome(boston, 0x3a6ab8, 0xe8b88a, 0xffc890, V(-0.65, 0.22, 0.6), [1, 0.78, 0.5]); boston.fog = new THREE.Fog(0xf0c8a0, 70, 360); clouds(boston, 12, 0xffe2c8, 70, 18, 220, 0.85);
  boston.add(box(600, 1, 600, M(T.cobble), 0, -0.5, 0, { cast: false, uvScale: 0.5 }));
  const walk = M(tileTex(0xb8b0a0, 0x8a8478, 3101, false)); boston.add(box(300, 0.18, 4, walk, 0, 0.09, -10.2, { cast: false })); boston.add(box(300, 0.18, 4, walk, 0, 0.09, 20.2, { cast: false }));
  const r = rng(3102);
  const row = (z, dir, skip) => { for (let x = -90; x < 90; x += 9) { if (skip && Math.abs(x) < 7) continue; const h = 9 + r() * 8, w = 8.6, g = new THREE.Group(); g.position.set(x, 0, z); boston.add(g); const bm = M([T.brick, T.brickDark, T.brickGrey][Math.floor(r() * 3)]);
      g.add(box(w, h, 8, bm, 0, h / 2, 0)); g.add(box(w + 0.3, 0.5, 8.4, M(T.white), 0, h + 0.25, 0));
      for (let fy = 2.6; fy < h - 1.5; fy += 3) for (const fx of [-2.6, 0, 2.6]) g.add(box(1.2, 1.7, 0.1, M(r() < 0.3 ? T.window : T.windowDark), fx, fy + 0.6, dir * 4.02, { cast: false }));
      g.add(box(1.4, 2.4, 0.1, C(0x3a2416), -2.6, 1.2, dir * 4.02, { cast: false })); g.add(box(w, 0.4, 0.6, C(0x5a3a2a), 0, 2.8, dir * 4.2)); } };
  row(-16, 1, true); row(26, -1, false);
  // Ponzis Büro (Mitte)
  const of = new THREE.Group(); of.position.set(0, 0, -16); boston.add(of); const stone = M(tileTex(0xc8c0b0, 0x9a9488, 3103));
  of.add(box(12, 13, 8, stone, 0, 6.5, 0)); of.add(box(12.6, 0.8, 8.6, M(T.white), 0, 13.4, 0)); for (let x = -5; x <= 5; x += 2) of.add(box(0.7, 6.5, 0.7, M(T.white), x, 3.25, 4.4));
  of.add(box(11.4, 0.8, 1.2, M(T.white), 0, 6.9, 4.4)); of.add(box(7.4, 1.4, 0.2, goldM, 0, 8.4, 4.1));
  const signT = tex(37, 7, (c) => { c.fillStyle = '#2a1a10'; c.fillRect(0, 0, 37, 7); c.fillStyle = '#ffd23f'; const L = { S: ['111', '100', '111', '001', '111'], E: ['111', '100', '110', '100', '111'], C: ['111', '100', '100', '100', '111'], O: ['111', '101', '101', '101', '111'], '.': ['0', '0', '0', '0', '1'], ' ': ['0', '0', '0', '0', '0'] };
    let x = 1; for (const ch of 'SEC CO.') { const g = L[ch]; for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < g[0].length; xx++) if (g[yy][xx] === '1') c.fillRect(x + xx, yy + 1, 1, 1); x += g[0].length + 1; } }, 3104);
  { const pl = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.0), M(signT)); pl.position.set(0, 8.4, 4.23); of.add(pl); }
  of.add(box(2.0, 3.2, 0.1, C(0x3a2416), 2.6, 1.6, 4.02, { cast: false })); for (const x of [-3.2, -1.0]) for (const y of [2.2, 9.8]) of.add(box(1.4, 2.2, 0.1, M(T.window), x, y, 4.02, { cast: false }));
  // Custom-House-Turm am Ende der Straße
  const tw = new THREE.Group(); tw.position.set(-70, 0, 4); boston.add(tw); tw.add(box(14, 18, 14, stone, 0, 9, 0)); tw.add(box(8, 44, 8, stone, 0, 22, 0)); tw.add(box(9, 1.2, 9, M(T.white), 0, 44.6, 0));
  for (let s = 0; s < 4; s++) tw.add(box(7 - s * 1.7, 2.2, 7 - s * 1.7, C(0x4a8a7a), 0, 46.3 + s * 2.2, 0)); for (const [x, z, ry] of [[4.06, 0, Math.PI / 2], [0, 4.06, 0]]) { const cl = box(3.4, 3.4, 0.1, C(0xf0ead8), x, 38, z, { cast: false }); cl.rotation.y = ry; tw.add(cl); }
  // Laternen, Autos
  for (let x = -60; x <= 60; x += 9) { boston.add(box(0.16, 3.8, 0.16, C(0x1a1a1e), x + 4.5, 2.0, -8.7)); boston.add(box(0.4, 0.5, 0.4, new THREE.MeshBasicMaterial({ color: 0xffd890 }), x + 4.5, 4.0, -8.7, { cast: false })); }
  const car = (x, z, ry, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const b = C(col, { metal: 0.3, rough: 0.5 }); g.add(box(3.6, 0.7, 1.6, b, 0, 0.75, 0)); g.add(box(1.8, 0.9, 1.5, b, -0.4, 1.55, 0)); g.add(box(1.4, 0.55, 1.52, C(0x6a8aa8), -0.4, 1.6, 0, { cast: false }));
    for (const wx of [-1.2, 1.2]) for (const wz of [-0.8, 0.8]) g.add(box(0.75, 0.75, 0.25, C(0x141414), wx, 0.38, wz)); g.add(box(0.2, 0.3, 0.3, new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), 1.82, 0.95, 0.5, { cast: false })); boston.add(g); };
  car(9.5, 3.4, 0.1, 0x141414); car(-12, 5.2, Math.PI, 0x2a3a2a); car(24, 13, Math.PI, 0x3a1a1a); car(-30, 2.6, 0, 0x141414);
  const ball = voxelBall(2.1, 0.3, snowGoldCol); ball.position.set(0.05, 2.05, -5.6); boston.add(ball);
  { const gr = rng(3110); for (let i = 0; i < 46; i++) { const a = gr() * Math.PI * 2, d = 1.6 + gr() * 2.6, x = Math.sin(a) * d * 1.2, z = -5.6 + Math.cos(a) * d * 0.8; if (z > -1.2) continue; const b = box(0.32, 0.18, 0.22, goldM, x, 0.09 + (gr() < 0.3 ? 0.18 : 0), z); b.rotation.y = gr() * 3; boston.add(b); }
    for (const [x, z, ry] of [[-1.7, 0.9, 1.2], [1.8, 0.7, 0.3], [-2.2, -0.6, 0.5], [2.3, -0.9, -0.4]]) { const b = box(0.32, 0.18, 0.22, goldM, x, 0.09, z); b.rotation.y = ry; boston.add(b); } }
  const crate = new THREE.Group(); crate.add(box(1.0, 0.6, 1.0, M(T.planks), 0, 0.3, 0)); boston.add(crate);
  const sun = sunLight(boston, 0xffc890, 3.6, V(-60, 30, 55), V(0, 0, -4), 40); boston.add(new THREE.HemisphereLight(0xb8c8f0, 0x7a5a3a, 1.25));
  const ponzi = humanoid(PONZI); boater(ponzi); const pBar = inHand(ponzi, goldBar());
  const rosa = humanoid(ROSA); cloche(rosa, 0xd0506a); const rBag = inHand(rosa, moneyBag());
  const crowd = []; for (let i = 0; i < 30; i++) { const p = person1920(i, 3200 + i); boston.add(p); crowd.push(p); }
  const boy = humanoid({ skin: 0xf0c4a2, hair: 0xb8925a, top: 0x6a5a4a, bottom: 0x3a3228, scale: 0.75, seed: 3240 }); boy.userData.head.add(box(0.56, 0.12, 0.56, C(0x4a443c), 0, 0.53, 0)); const bPaper = inHand(boy, newspaper());
  const bulb = new THREE.Group(); bulb.add(box(0.26, 0.3, 0.26, new THREE.MeshBasicMaterial({ color: 0xfff27a }), 0, 0, 0, { cast: false })); bulb.add(box(0.16, 0.1, 0.16, C(0x8a8a8a), 0, -0.2, 0, { cast: false })); boston.add(bulb);
  boston.add(ponzi, rosa, boy);
  boston.userData = { sky, ball, crate, ponzi, pBar, rosa, rBag, crowd, boy, bPaper, bulb };
}

// =====================================================================
// Innenräume
// =====================================================================
function roomScene(w, d, h, wallM, floorM, bg = 0x0a0806) { const s = new THREE.Scene(); s.background = new THREE.Color(bg); room3(s, w, d, h, wallM, floorM); return s; }
function deskAt(s, x, z, col = 0x5a3a22) { s.add(box(2.4, 0.1, 1.1, C(col), x, 0.8, z)); for (const dx of [-1.1, 1.1]) s.add(box(0.12, 0.8, 1.0, C(shade(col, 0.8)), x + dx, 0.4, z)); }
// Ponzis Büro
const office = roomScene(9, 8, 3.4, M(T.wallpaperBeige), M(T.planks));
{
  const s = office; s.add(box(9, 1.0, 0.1, M(T.darkwood), 0, 0.5, -3.83, { cast: false }));
  deskAt(s, 0, -1.6); s.add(box(0.6, 0.08, 0.6, C(0x6a2a1a), 0, 0.5, -2.6)); s.add(box(0.6, 0.9, 0.08, C(0x6a2a1a), 0, 0.95, -2.92));
  const mapT = tex(64, 32, (c, r) => { c.fillStyle = '#3a6a9a'; c.fillRect(0, 0, 64, 32); c.fillStyle = '#d8c89a';
    [[4, 6, 14, 10], [8, 16, 8, 6], [12, 22, 4, 6], [40, 5, 14, 9], [44, 14, 5, 4], [50, 14, 3, 7], [52, 20, 2, 2]].forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
    c.fillStyle = '#e8402a'; c.fillRect(51, 17, 2, 2); c.fillStyle = '#2aa84a'; c.fillRect(16, 10, 2, 2); c.fillStyle = '#ffd23f'; for (let x = 19; x < 50; x += 3) c.fillRect(x, 13 + Math.round(Math.sin((x - 19) / 31 * Math.PI) * -4), 2, 1);
    c.fillStyle = '#5a3a1a'; for (let i = 0; i < 64; i++) { c.fillRect(i, 0, 1, 1); c.fillRect(i, 31, 1, 1); } for (let i = 0; i < 32; i++) { c.fillRect(0, i, 1, 1); c.fillRect(63, i, 1, 1); } }, 3301);
  { const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshStandardMaterial({ map: mapT, roughness: 0.9 })); pl.position.set(0, 2.15, -3.8); s.add(pl); }
  const crate = new THREE.Group(); crate.position.set(1.55, 0.85, -1.5); s.add(crate); const cw = M(T.planks);
  crate.add(box(0.7, 0.05, 0.5, cw, 0, 0.0, 0)); crate.add(box(0.7, 0.35, 0.05, cw, 0, 0.18, 0.23)); crate.add(box(0.7, 0.35, 0.05, cw, 0, 0.18, -0.23)); crate.add(box(0.05, 0.35, 0.5, cw, 0.33, 0.18, 0)); crate.add(box(0.05, 0.35, 0.5, cw, -0.33, 0.18, 0));
  crate.add(box(0.2, 0.01, 0.14, C(0xe8e2c8), 0.08, 0.04, 0.02, { cast: false }));
  const piles = []; const pr = rng(3302); for (const [px0, pz0] of [[-2.9, -2.6], [-3.2, -0.6], [3.0, -2.7], [2.9, -0.9]]) { const g = new THREE.Group(); g.position.set(px0, 0, pz0); s.add(g); const n = 20;
    for (let i = 0; i < n; i++) { const lvl = Math.floor(i / 8), k = i % 8; const b = box(0.3, 0.16, 0.2, goldM, (k % 4) * 0.32 - 0.48 + lvl * 0.1, 0.08 + lvl * 0.17, Math.floor(k / 4) * 0.24 - 0.12); b.userData.o = i / n; g.add(b); } piles.push(g); }
  for (let i = 0; i < 5; i++) { const b = box(0.3, 0.16, 0.2, goldM, -0.8 + i * 0.34, 0.93, -1.3); s.add(b); piles.push(b); }
  s.add(box(0.1, 1.6, 1.4, new THREE.MeshBasicMaterial({ color: 0xffe0a8 }), -4.33, 2.0, -1.0, { cast: false }));
  const lamp = new THREE.PointLight(0xffb060, 7, 9, 1.4); lamp.position.set(0, 3.0, 0); s.add(lamp); s.add(box(0.7, 0.25, 0.7, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0, 3.25, 0, { cast: false }));
  sunLight(s, 0xffd8a0, 1.8, V(5, 7, 9), V(0, 0, -1), 7, 1024); s.add(new THREE.HemisphereLight(0xffe8d0, 0x5a3a1a, 1.1));
  const ponzi = humanoid(PONZI); const pSlip = inHand(ponzi, paperSlip()); const nv = person1920(3, 3310), old = humanoid(ROSA); cloche(old, 0x8a2a3a);
  const coin = box(0.3, 0.16, 0.2, goldM, 0, 0, 0); s.add(coin); s.add(ponzi, nv, old);
  office.userData = { ponzi, pSlip, nv, old, coin, piles, crate };
}
// Barrons Schreibtisch (Zeitung)
const news = roomScene(8, 7, 3.4, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x6a7a6a, 0.05), 3401)), M(T.planks));
{
  const s = news; for (const x of [-2.6, 0, 2.6]) s.add(box(2.5, 3.2, 0.5, M(T.books), x, 1.6, -3.1));
  deskAt(s, 0, -1.2, 0x4a3020); s.add(box(0.6, 0.18, 0.4, C(0x2a2a2a, { metal: 0.3, rough: 0.5 }), 0.6, 0.94, -1.1)); s.add(box(0.5, 0.3, 0.02, C(0xf4f0e8), 0.6, 1.14, -1.28));
  for (let i = 0; i < 6; i++) s.add(box(0.5, 0.06, 0.36, C(0xe8e4d8), -0.7 + (i % 2) * 0.04, 0.88 + i * 0.06, -1.1));
  s.add(box(0.6, 0.08, 0.6, C(0x3a2416), 0, 0.5, -2.1)); s.add(box(0.6, 0.9, 0.08, C(0x3a2416), 0, 0.95, -2.42));
  const lamp = new THREE.PointLight(0x9affb0, 0, 1); s.add(lamp); s.add(box(0.12, 0.4, 0.12, C(0x2a2a2a), -0.9, 1.05, -1.5)); s.add(box(0.4, 0.14, 0.25, new THREE.MeshBasicMaterial({ color: 0x4aa86a }), -0.9, 1.3, -1.4, { cast: false }));
  const desk = new THREE.PointLight(0xffc880, 5, 6, 1.4); desk.position.set(-0.6, 1.9, -0.6); s.add(desk);
  sunLight(s, 0xffe8c8, 1.5, V(5, 7, 9), V(0, 0, -1), 7, 1024); s.add(new THREE.HemisphereLight(0xffe8d0, 0x3a3a2a, 1.0));
  const barron = humanoid(BARRON); const bp = inHand(barron, paperSlip()); s.add(barron); news.userData = { barron, bp };
}
// Familie zu Hause
const home = roomScene(8, 7, 3.2, M(T.wallpaperRed), M(T.planks));
{
  const s = home; s.add(box(1.8, 0.08, 1.1, C(0x6a4a2a), 0, 0.8, -0.8)); for (const [x, z] of [[-0.8, -1.25], [0.8, -1.25], [-0.8, -0.35], [0.8, -0.35]]) s.add(box(0.08, 0.8, 0.08, C(0x4a3020), x, 0.4, z));
  const jar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.45, roughness: 0.1 })); jar.position.set(0.2, 1.04, -0.8); s.add(jar); s.add(box(0.32, 0.05, 0.32, C(0x8a6a3a), 0.2, 1.26, -0.8));
  for (const x of [-0.5, 0.0]) { s.add(box(0.5, 0.08, 0.5, C(0x6a4a2a), x * 0 - 0.9 + (x ? 0 : 0), 0.46, -0.4)); }
  const winM = new THREE.MeshBasicMaterial({ color: 0x1a2a4a }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), winM); win.position.set(2.0, 1.9, -3.34); s.add(win);
  s.add(box(1.5, 0.08, 0.1, C(0x4a3020), 2.0, 1.9, -3.3, { cast: false })); s.add(box(0.08, 1.3, 0.1, C(0x4a3020), 2.0, 1.9, -3.3, { cast: false }));
  const lamp = new THREE.PointLight(0xffb060, 8, 8, 1.4); lamp.position.set(0, 2.6, -0.6); s.add(lamp); s.add(box(0.5, 0.25, 0.5, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0, 2.9, -0.8, { cast: false }));
  sunLight(s, 0x9ab0e8, 0.9, V(5, 7, 9), V(0, 0, -1), 6, 1024); s.add(new THREE.HemisphereLight(0x8a9ac8, 0x3a2a1a, 0.7));
  const rosa = humanoid({ ...ROSA, smile: false, seed: 61 }); const man = person1920(0, 3501); const kid = humanoid({ skin: 0xf0c4a2, hair: 0x6a3a1a, top: 0x8a6a4a, bottom: 0x3a3228, scale: 0.7, seed: 3502 });
  s.add(rosa, man, kid); home.userData = { rosa, man, kid };
}
// Zelle
const cell = roomScene(5, 4, 3, M(T.concrete), M(T.concrete), 0x050505);
{
  const s = cell; s.add(box(2.2, 0.4, 0.9, C(0x5a5a5a), -0.6, 0.35, -1.4)); s.add(box(2.0, 0.12, 0.8, C(0x8a8a7a), -0.6, 0.6, -1.4));
  const bars = C(0x2a2a2e, { metal: 0.7, rough: 0.4 }); for (let z = -1.8; z <= 1.9; z += 0.42) s.add(box(0.08, 3, 0.08, bars, -2.3, 1.5, z)); s.add(box(0.1, 0.1, 4, bars, -2.3, 1.2, 0));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0x9ab8e8 })); win.position.set(0.6, 2.3, -1.84); s.add(win); for (const x of [0.3, 0.6, 0.9]) s.add(box(0.06, 0.62, 0.06, bars, x, 2.3, -1.8));
  const sp = new THREE.SpotLight(0xb8c8ff, 30, 10, 0.5, 0.5); sp.position.set(0.6, 2.6, -1.6); sp.target.position.set(-0.4, 0.4, 0.6); sp.castShadow = true; s.add(sp, sp.target);
  s.add(new THREE.HemisphereLight(0x8a9ab8, 0x2a2a2a, 0.9)); const warm = new THREE.PointLight(0xffb070, 3, 6, 1.4); warm.position.set(1.8, 2.4, 1.6); s.add(warm);
  const pz = humanoid({ ...PONZI, top: 0x8a8a82, bottom: 0x8a8a82, coat: false, tie: undefined, smile: false, sad: true, seed: 71 });
  const md = humanoid({ ...MADOFF, top: 0xb8a878, bottom: 0xb8a878, coat: false, tie: undefined, smile: false, sad: true, seed: 72 }); s.add(pz, md); cell.userData = { pz, md };
}

// =====================================================================
// SET: Schnee-Pyramide (abstrakt)
// =====================================================================
const pyr = new THREE.Scene();
const TIERS = [{ h: 9, y0: 0 }, { h: 5, y0: 1 }, { h: 2, y0: 2 }]; // halbe Kantenlänge, Unterkante
{
  skyDome(pyr, 0x4a88d8, 0x9ac8f0, 0xe8f2fa, V(-0.4, 0.5, 0.5)); pyr.fog = new THREE.Fog(0xe8f2fa, 60, 300); clouds(pyr, 5, 0xffffff, 60, 20, 200, 0.9);
  pyr.add(box(600, 1, 600, M(T.snow), 0, -0.5, 0, { cast: false }));
  const r = rng(3601); for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * 160, z = -30 - r() * 80; const hgt = 3 + r() * 5; pyr.add(box(0.8, hgt, 0.8, C(0x5a3a22), x, hgt / 2, z)); pyr.add(box(3, 3, 3, C(0x2a5a3a), x, hgt + 1, z)); pyr.add(box(3.2, 0.6, 3.2, C(0xf4f8fc), x, hgt + 2.8, z)); }
  const cols = [0x9a948a, 0xc8ccd4, 0xffc928], blocks = [];
  TIERS.forEach((T0, k) => { for (let x = -T0.h; x < T0.h; x++) for (let z = -T0.h; z < T0.h; z++) { if (k < 2 && Math.abs(x + 0.5) < TIERS[k + 1].h && Math.abs(z + 0.5) < TIERS[k + 1].h) continue; blocks.push({ x: x + 0.5, y: T0.y0 + 0.5, z: z + 0.5, k }); } });
  // Unter höheren Stufen liegende Blöcke auffüllen
  TIERS.forEach((T0, k) => { if (k === 0) return; for (let x = -T0.h; x < T0.h; x++) for (let z = -T0.h; z < T0.h; z++) for (let y = 0; y < T0.y0; y++) blocks.push({ x: x + 0.5, y: y + 0.5, z: z + 0.5, k: y }); });
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: tileTex(0xffffff, 0xb8b8b8, 3602, false), roughness: 0.7, metalness: 0.05 }), blocks.length);
  const col = new THREE.Color(); blocks.forEach((b, i) => { im.setColorAt(i, col.setHex(cols[b.k])); const q = rng(3603 + i); b.d = q(); b.rx = q() - 0.5; b.rz = q() - 0.5; b.vx = (q() - 0.5) * 2; b.vz = (q() - 0.5) * 2; });
  im.castShadow = im.receiveShadow = true; pyr.add(im);
  sunLight(pyr, 0xfff2dc, 3.2, V(-30, 50, 40), V(0, 0, 0), 22); pyr.add(new THREE.HemisphereLight(0xd8e8ff, 0x9aa8b8, 1.3));
  const ponzi = humanoid(PONZI); boater(ponzi); pyr.add(ponzi);
  const sq = (half, n) => { const out = []; const per = half * 8; for (let i = 0; i < n; i++) { let d = (i + 0.5) / n * per; let x, z; if (d < half * 2) { x = -half + d; z = half; } else if ((d -= half * 2) < half * 2) { x = half; z = half - d; } else if ((d -= half * 2) < half * 2) { x = half - d; z = -half; } else { d -= half * 2; x = -half; z = -half + d; } out.push([x, z]); } return out; };
  const l1 = sq(3.4, 6).map(([x, z], i) => { const p = person1920(i * 2 + 1, 3610 + i); p.userData.pos = [x, 2, z]; pyr.add(p); return p; });
  const l2 = sq(7.1, 36).map(([x, z], i) => { const p = person1920(i + 7, 3620 + (i % 14)); p.userData.pos = [x, 1, z]; pyr.add(p); return p; });
  const newc = []; for (let i = 0; i < 26; i++) { const p = person1920(i + 3, 3660 + (i % 10)); const a = (i / 26) * Math.PI * 2; p.userData.a = a; p.userData.d = (i * 7 % 26) / 26; pyr.add(p); newc.push(p); }
  const coins = []; for (let i = 0; i < 16; i++) { const c = box(0.3, 0.16, 0.2, goldM, 0, 0, 0, { cast: false }); pyr.add(c); coins.push(c); }
  pyr.userData = { im, blocks, ponzi, l1, l2, newc, coins };
}
function pyrUpdate(t, tc) { // tc = Zeit seit Einsturz (oder <0)
  const P = pyr.userData, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V(1, 1, 1);
  P.blocks.forEach((b, i) => { let x = b.x, y = b.y, z = b.z, rx = 0, rz = 0; const tt = tc - (b.k === 0 ? 0 : 0.12) - b.d * 0.35 - (2 - b.k) * 0.0;
    if (tt > 0) { y = Math.max(0.5, b.y - 6 * tt * tt); x += b.vx * tt * 1.4; z += b.vz * tt * 1.4; rx = b.rx * tt * 4; rz = b.rz * tt * 4; }
    m.compose(V(x, y, z), q.setFromEuler(e.set(rx, 0, rz)), s); P.im.setMatrixAt(i, m); });
  P.im.instanceMatrix.needsUpdate = true;
}

// =====================================================================
// SET: Erde im All
// =====================================================================
const earth = new THREE.Scene(); earth.background = new THREE.Color(0x02030a);
{
  const st = new THREE.Group(), r = rng(3701), sm = new THREE.MeshBasicMaterial({ color: 0xffffff }); for (let i = 0; i < 500; i++) { const v = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(300); st.add(box(0.9, 0.9, 0.9, sm, v.x, v.y, v.z, { cast: false })); } earth.add(st);
  const land = (x, y, z) => Math.sin(x * 3.1 + 1.3) * Math.cos(z * 2.7 - 0.4) + Math.sin(y * 4.3 + x * 1.7) * 0.6 + Math.cos(z * 5.1 + y * 2.2) * 0.3;
  const ball = voxelBall(9, 0.45, (x, y, z, i) => { if (Math.abs(y) > 0.86) return 0xf4f8fc; const l = land(x, y, z); return l > 0.55 ? (Math.sin(i * 7.31) > 0.3 ? 0x8a7a4a : 0x4a8a3a) : l > 0.35 ? 0x5a9a42 : 0x2a5ab0; });
  ball.material.metalness = 0; ball.material.roughness = 0.8; earth.add(ball);
  const sun = new THREE.DirectionalLight(0xfff4e0, 3.2); sun.position.set(-30, 12, 25); earth.add(sun); earth.add(new THREE.AmbientLight(0x404a70, 0.9));
  earth.userData = { ball };
}

// =====================================================================
// SET: New York bei Nacht + Madoffs Büro
// =====================================================================
const winTex = (seed, lit) => tex(16, 32, (c, r) => { c.fillStyle = '#1a1e28'; c.fillRect(0, 0, 16, 32); for (let y = 1; y < 32; y += 3) for (let x = 1; x < 16; x += 3) { c.fillStyle = r() < lit ? hex(shade(0xffd890, 0.7 + r() * 0.4)) : '#2a3448'; c.fillRect(x, y, 2, 2); } }, seed);
const nyc = new THREE.Scene();
{
  skyDome(nyc, 0x060a1a, 0x1a2448, 0x3a3a5a); nyc.fog = new THREE.Fog(0x1a2040, 80, 420);
  nyc.add(box(800, 1, 800, C(0x1a1a20), 0, -0.5, 0, { cast: false }));
  const r = rng(3801), wt1 = [winTex(3802, 0.35), winTex(3803, 0.5), winTex(3804, 0.25)];
  for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * 220, z = -20 - r() * 160; if (Math.abs(x) < 14 && z > -40) continue; const w = 8 + r() * 10, h = 25 + r() * 90; const tx = wt1[i % 3];
    nyc.add(box(w, h, w, new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.9, roughness: 0.8 }), x, h / 2, z, { cast: false, uvScale: 0.25 })); }
  const roof = new THREE.Group(); nyc.add(roof); roof.add(box(14, 60, 14, new THREE.MeshStandardMaterial({ map: wt1[1], emissive: 0xffffff, emissiveMap: wt1[1], emissiveIntensity: 0.9 }), 0, 30, 0, { uvScale: 0.25 }));
  roof.add(box(14.4, 0.4, 14.4, C(0x5a5a62), 0, 60.2, 0)); for (const x of [-7, 7]) roof.add(box(0.12, 1.1, 14.4, C(0x8a8a92, { metal: 0.6 }), x, 60.9, 0)); roof.add(box(14.4, 1.1, 0.12, C(0x8a8a92, { metal: 0.6 }), 0, 60.9, 7));
  const moon = sunLight(nyc, 0x8a9ad8, 1.2, V(-20, 90, 30), V(0, 60, 0), 10, 1024); nyc.add(new THREE.HemisphereLight(0x4a5a9a, 0x1a1a22, 0.9));
  const warm = new THREE.PointLight(0xffb070, 14, 12, 1.4); warm.position.set(2, 63, 4); nyc.add(warm);
  const madoff = humanoid(MADOFF); nyc.add(madoff); nyc.userData = { madoff };
}
const modern = roomScene(10, 8, 3.4, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8d8dc, 0.03), 3901)), M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3a3a44, 0.05), 3902)));
{
  const s = modern; const sky = tex(64, 32, (c, r) => { c.fillStyle = '#7ab0e0'; c.fillRect(0, 0, 64, 32); for (let x = 0; x < 64; x += 4 + Math.floor(r() * 4)) { const h = 8 + Math.floor(r() * 20); c.fillStyle = hex(shade(0x6a7a90, 0.8 + r() * 0.3)); c.fillRect(x, 32 - h, 4, h); } }, 3903);
  { const pl = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.4), new THREE.MeshBasicMaterial({ map: sky })); pl.position.set(0, 1.8, -3.8); s.add(pl); } for (const x of [-4, -2, 0, 2, 4]) s.add(box(0.1, 2.5, 0.1, C(0x2a2a2e), x, 1.8, -3.78, { cast: false }));
  s.add(box(2.6, 0.08, 1.1, C(0x1a1a1e, { metal: 0.4, rough: 0.3 }), 0, 0.8, -1.6)); for (const x of [-1.2, 1.2]) s.add(box(0.08, 0.8, 1.0, C(0x8a8a92, { metal: 0.6 }), x, 0.4, -1.6));
  const chart = tex(32, 20, (c) => { c.fillStyle = '#0a1a10'; c.fillRect(0, 0, 32, 20); c.fillStyle = '#3aff6a'; let y = 16; for (let x = 1; x < 31; x++) { y -= (x % 5 === 0 ? -1 : 0.5); c.fillRect(x, Math.round(y), 1, 1); } }, 3904);
  for (const x of [-0.5, 0.5]) { s.add(box(0.8, 0.5, 0.05, C(0x111114), x, 1.2, -1.9)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.44), new THREE.MeshBasicMaterial({ map: chart })); sc.position.set(x, 1.2, -1.87); s.add(sc); }
  s.add(box(0.6, 0.08, 0.6, C(0x1a1a1e), 0, 0.5, -2.5)); s.add(box(0.6, 1.0, 0.08, C(0x1a1a1e), 0, 1.0, -2.82));
  sunLight(s, 0xfff4e8, 2.0, V(4, 8, 9), V(0, 0, -1), 7, 1024); s.add(new THREE.HemisphereLight(0xe8f0ff, 0x4a4a52, 1.3));
  const madoff = humanoid(MADOFF); const nv = humanoid({ skin: 0xe8b894, hair: 0x2a1a14, top: 0x3a6aa8, bottom: 0x2a3448, seed: 3910 }); const old = humanoid({ skin: 0xf0c4a2, hair: 0xd8d8d8, longHair: true, top: 0x8a2a4a, bottom: 0x2a2a30, skirt: true, smile: true, seed: 3911 });
  const agents = [0, 1].map(i => { const p = humanoid({ skin: [0xe8b894, 0x8a5a3a][i], hair: 0x1a1a1a, top: 0x1a2a4a, bottom: 0x1a1a22, hat: 'cap', hatCol: 0x1a2a4a, seed: 3912 + i }); p.userData.body.add(box(0.3, 0.1, 0.02, C(0xffd23f), 0, 1.25, 0.14, { cast: false })); s.add(p); return p; });
  const coin = box(0.3, 0.16, 0.2, goldM, 0, 0, 0); s.add(coin, madoff, nv, old); modern.userData = { madoff, nv, old, agents, coin };
}
// Zimmer nachts mit Handy (Krypto)
const room = roomScene(7, 6, 3, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x4a5068, 0.05), 4001)), M(T.planks), 0x05060a);
{
  const s = room; s.add(box(1.4, 0.45, 2.4, C(0x3a2a1a), -1.6, 0.225, -1.2)); s.add(box(1.3, 0.16, 2.3, C(0x6a3a8a), -1.6, 0.53, -1.2)); s.add(box(1.0, 0.15, 0.45, C(0xd8d8e0), -1.6, 0.66, -2.15));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ color: 0x10183a })); win.position.set(1.4, 1.9, -2.84); s.add(win);
  const poster = tex(12, 16, (c) => { c.fillStyle = '#1a1a2a'; c.fillRect(0, 0, 12, 16); c.fillStyle = '#f0b020'; c.fillRect(3, 3, 6, 6); c.fillStyle = '#1a1a2a'; c.fillRect(5, 4, 2, 4); c.fillStyle = '#3aff6a'; for (let x = 1; x < 11; x++) c.fillRect(x, 14 - Math.floor(x / 2), 1, 1); }, 4002);
  s.add(box(0.9, 1.2, 0.04, new THREE.MeshBasicMaterial({ map: poster }), -1.6, 1.9, -2.83, { cast: false }));
  s.add(new THREE.HemisphereLight(0x3a4a7a, 0x10101a, 0.7)); sunLight(s, 0x6a7ab8, 0.8, V(-6, 6, 8), V(0, 0, -1), 6, 1024);
  const lamp = new THREE.PointLight(0xff8ad8, 3, 6, 1.4); lamp.position.set(2.5, 2.4, -1.5); s.add(lamp);
  const phoneG = new THREE.PointLight(0x9ad0ff, 3, 2.5, 1.5); s.add(phoneG);
  const user = humanoid({ skin: 0xe0a882, hair: 0x2a1a14, hairVol: true, top: 0x3a6a5a, bottom: 0x2a2e3a, shoe: 0xe8e8e8, seed: 4010 }); hoodie(user, 0x3a6a5a); const uphone = inHand(user, phoneMesh()); s.add(user);
  room.userData = { user, uphone, phoneG };
}

// =====================================================================
// SET: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.snow), 0, -0.5, 0, { cast: false }));
  const r = rng(1901);
  for (let i = 0; i < 3; i++) dusk.add(box(18 - i * 7, 2.2, 18 - i * 7, C([0x9a948a, 0xc8ccd4, 0xffc928][i]), 26, 2.2 * (i + 0.5), -80));
  const ball = voxelBall(1.2, 0.3, snowGoldCol); ball.position.set(-4.6, 1.2, -2.5); dusk.add(ball);
  const sign = new THREE.Group(); dusk.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  for (let x = -12; x <= 12; x += 2) for (let z = 3; z < 20; z += 2) if (r() < 0.45) sign.add(box(1, 0.08, 1, M(T.dirt), x, 0.02, z, { cast: false }));
  sunLight(dusk, 0xffb27a, 3.2, V(40, 25, -110), V(0, 0, 0), 30); dusk.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a3a, 1.3));
  dusk.userData = { bcv, stex, ball };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('BARRON, 1920', 72, 150, '#a3241c'); fit('OHNE NEUE ANLEGER BRICHT', 56, 290, '#3a2a1e'); fit('JEDES SCHNEEBALLSYSTEM ZUSAMMEN', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 73.30; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'boston'], [8, 'ponzi'], [15, 'idea'], [19, 'coupon'], [28, 'arbitrage'], [41, 'promise'], [54, 'payout'], [69, 'queue'], [76, 'millions'], [84, 'empty'], [89, 'pay'],
  [100, 'term'], [105, 'growth'], [114, 'math'], [120, 'six'], [126, 'earth'], [138, 'barron'], [145, 'need'], [153, 'exist'], [159, 'paper'], [164, 'run'], [170, 'collapse'], [174, 'jail'], [178, 'loss'],
  [183, 'madoff'], [190, 'decades'], [200, 'bust'], [211, 'prison'], [216, 'crypto'], [226, 'warn'], [240, 'sign'], [246, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.72, HX2 = 0.74, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json (nahe Endposition)
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.12, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-5.2 + drift * 1.2, 8.2 + drift * 0.7, 10.0 + drift * 1.2), t1 = V(0.6 + drift * 0.6, 1.6, -6.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const reset = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const QUEUE = i => [3.9 + i * 0.95, 0.18, -9.7 + (i % 2) * 0.35];
const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = boston, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Boston ----------
  if (['hero', 'loop', 'boston', 'ponzi', 'idea', 'promise', 'payout', 'queue', 'paper', 'run'].includes(sh.id)) {
    scene = boston; const B = boston.userData; const ta = sh.id === 'loop' ? t - DUR : t; const { ponzi, rosa, crowd, boy } = B;
    reset([ponzi, rosa, boy, ...crowd]); B.pBar.visible = B.rBag.visible = false; B.bPaper.visible = true; B.crate.visible = false; B.bulb.visible = false; B.ball.visible = true;
    B.ball.rotation.set(ta * 0.08, ta * 0.15, 0);
    crowd.forEach((p, i) => { if (i >= 26) return; const [x, y, z] = QUEUE(i); put(p, x, y, z, -Math.PI / 2 + 0.55); pose3(p, 'idle', ta, i); });
    if (['hero', 'loop', 'boston'].includes(sh.id)) { put(rosa, HX, 0, HZ, 0.42); put(ponzi, HX2, 0, HZ, -0.42); pose3(rosa, 'idle', ta, 0); rosa.userData.armR.rotation.x = -0.7; B.rBag.visible = true;
      pose3(ponzi, 'pose', ta, 1); ponzi.userData.armR.rotation.x = -2.25 + Math.sin(ta * 2) * 0.05; ponzi.userData.armR.rotation.z = 0.3; B.pBar.visible = true; ponzi.userData.head.rotation.y = -0.15; rosa.userData.head.rotation.y = 0.25;
      if (sh.id !== 'boston') { heroCam(ta); tag(rosa, 'Anlegerin', HERO); tag(ponzi, 'Ponzi', BAD); } }
    if (sh.id === 'boston') { mv(u, V(40, 30, 8), V(37, 29, 7.5), V(-40, 14, 2), V(-42, 14, 2), 46); info(wt(4), 'Boston, vor 100 Jahren'); }
    if (sh.id === 'ponzi') { B.ball.visible = false; put(ponzi, -9.6, 0.18, -8.6, 0.35); pose3(ponzi, 'idle', t); ponzi.userData.setFace({ smile: false });
      mv(u, V(-8.4, 1.75, -4.4), V(-8.55, 1.72, -5.0), V(-9.6, 1.5, -8.6), V(-9.6, 1.5, -8.6), 46); tag(ponzi, 'Charles Ponzi', BAD); info(wt(12), 'Einwanderer aus Italien'); }
    if (sh.id === 'idea') { B.ball.visible = false; put(ponzi, -9.6, 0.18, -8.6, 0.35); const lit = t >= wt(17); pose3(ponzi, lit ? 'pose' : 'sadidle', t); ponzi.userData.setFace(lit ? {} : { sad: true, smile: false });
      if (lit) { B.bulb.visible = true; const k = smoother((t - wt(17)) / 0.25); B.bulb.position.set(-9.6, 0.18 + 2.75 + k * 0.1, -8.6); B.bulb.scale.setScalar(k); }
      mv(u, V(-8.7, 2.3, -4.2), V(-8.8, 2.28, -4.6), V(-9.6, 2.05, -8.6), V(-9.6, 2.05, -8.6), 48); tag(ponzi, 'Ponzi', BAD, 0.35); eff(wt(15), 'Kontostand', '0 $', BAD); }
    if (sh.id === 'promise') { B.crate.visible = true; B.crate.position.set(-6, 0.18, -5.2); put(ponzi, -6, 0.78, -5.2, 0.15); pose3(ponzi, t >= wt(47) ? 'fist' : 'point', t); if (t >= wt(47)) pose(ponzi, 'fist', t);
      crowd.slice(26).concat(crowd.slice(0, 4)).forEach((p, i) => { const a = -0.9 + i * 0.36, x = -6 + Math.sin(a) * 3.2, z = -5.2 + Math.cos(a) * 3.2; put(p, x, 0, z, facing(x, z, -6, -5.2)); pose3(p, i % 3 ? 'idle' : 'clap', t, i); });
      mv(u, V(-3.2, 2.2, 3.6), V(-3.5, 2.15, 2.9), V(-6, 1.8, -5.2), V(-6, 1.8, -5.2), 48); tag(ponzi, 'Ponzi', BAD);
      tip(wt(47), 'coin', 'Ponzis Angebot', '#ffd23f', [green('+50 % in 45 Tagen'), gray('„absolut sicher“')]); }
    if (sh.id === 'payout') { put(ponzi, 2.6, 0.18, -10.6, 0.1); pose3(ponzi, 'give', t); put(rosa, 3.2, 0.18, -7.6, Math.PI - 0.6); const got = t >= wt(57) + 0.2;
      pose3(rosa, got ? 'cheer' : 'idle', t); B.rBag.visible = got; rosa.rotation.y = got ? -0.5 : Math.PI - 0.6; crowd.forEach(p => p.visible = false);
      const fr = [crowd[27], crowd[28]]; fr.forEach((p, i) => { const k = smoother((t - wt(64) - i * 0.15) / 0.6); put(p, 5.2 + i * 0.9 - (1 - k) * 2, 0.18, -6.4 + i * 0.5, -1.4); pose3(p, k > 0 && k < 1 ? 'walk' : 'laugh', t, i); p.visible = t >= wt(64) - 0.6; });
      mv(u, V(1.4, 1.9, -2.6), V(1.6, 1.85, -3.2), V(3.4, 1.3, -7.8), V(3.4, 1.3, -7.8), 48); tag(rosa, 'Anlegerin', HERO); if (!got) tag(ponzi, 'Ponzi', BAD);
      toast(wt(62), 'Fortschritt erzielt!', 'Erster Gewinn: +50 %', 'coin'); if (t >= wt(64)) say(wt(65), 'Anlegerin', HERO, 'Leute, das funktioniert wirklich!'); }
    if (sh.id === 'queue') { crowd.forEach((p, i) => { const [x, y, z] = QUEUE(i); put(p, x, y, z, -Math.PI / 2 + 0.55); pose3(p, i % 4 === 0 ? 'cheer' : 'idle', t, i); });
      mv(u, V(9, 9.5, 3.5), V(11, 9.2, 3.0), V(16, 0.5, -10), V(18, 0.5, -10), 50); chat(wt(71), gold('Anleger in der Schlange: Tausende')); }
    if (sh.id === 'paper') { B.ball.visible = false; put(boy, 6.4, 0.18, -7.4, -0.35); pose3(boy, 'give', t); boy.userData.armR.rotation.x = -2.3 + Math.abs(Math.sin(t * 6)) * 0.4;
      mv(u, V(5.3, 1.35, -4.6), V(5.45, 1.32, -5.0), V(6.3, 1.25, -7.4), V(6.3, 1.25, -7.4), 48); tag(boy, 'Zeitungsjunge', WHITE); say(wt(160), 'Zeitungsjunge', WHITE, 'Extra! Ponzis Rechnung geht nicht auf!'); eff(wt(163), 'Panik', '!!!', BAD); }
    if (sh.id === 'run') { B.ball.visible = false; put(ponzi, 2.6, 0.18, -11.4, 0); pose3(ponzi, 'cross', t); ponzi.userData.setFace({ sad: true, smile: false });
      crowd.forEach((p, i) => { if (i >= 16) return; const x = 0.6 + (i % 6) * 0.8 + (i > 5 ? 0.4 : 0), z = -9.6 + Math.floor(i / 6) * 1.0; put(p, x, 0.18, z, Math.PI + (x - 2.6) * 0.08); pose3(p, i % 2 ? 'fist' : 'angry', t, i); if (i % 2) pose(p, 'fist', t, i); p.userData.setFace({ angry: true }); });
      mv(u, V(-1.6, 3.4, -4.8), V(-1.4, 3.3, -5.4), V(2.4, 1.4, -10.6), V(2.4, 1.4, -10.6), 48); tag(ponzi, 'Ponzi', BAD, 0.15); say(wt(165), 'Anleger', BAD, 'Wir wollen unser Geld zurück!'); }
  }
  // ---------- Ponzis Büro ----------
  if (['coupon', 'arbitrage', 'millions', 'empty', 'pay'].includes(sh.id)) {
    scene = office; exp = 1.35; const O = office.userData; reset([O.ponzi, O.nv, O.old]); O.pSlip.visible = false; O.coin.visible = false;
    O.piles.forEach((g, gi) => { if (g.isGroup) g.children.forEach(b => b.visible = sh.id === 'millions' ? b.userData.o < clamp01((t - sh.a) / 1.6) : sh.id === 'pay' || sh.id === 'empty'); else g.visible = sh.id === 'millions' || sh.id === 'pay'; });
    if (sh.id === 'coupon') { put(O.ponzi, 0, 0, -2.3, 0); sitPose(O.ponzi, 0.54); pose3(O.ponzi, 'idle', t); sitPose(O.ponzi, 0.54); O.ponzi.userData.armR.rotation.x = -1.5; O.ponzi.userData.armL.rotation.x = -1.1; O.pSlip.visible = true; O.ponzi.userData.head.rotation.x = 0.15;
      mv(u, V(0.7, 1.8, 1.4), V(0.6, 1.76, 0.9), V(0, 1.3, -2.1), V(0, 1.3, -2.1), 48); tag(O.ponzi, 'Ponzi', BAD);
      tip(wt(25), 'mail', 'Internationaler Antwortschein', '#55ffff', [gray('Gutschein für Briefporto,'), gray('in vielen Ländern einlösbar')]); }
    if (sh.id === 'arbitrage') { put(O.ponzi, -1.6, 0, -2.9, 0.5); pose3(O.ponzi, 'point', t); O.ponzi.userData.armR.rotation.y = -0.6; O.ponzi.rotation.y = 0.6;
      mv(u, V(0.6, 1.9, 3.2), V(0.5, 1.9, 2.7), V(-0.6, 1.7, -3.2), V(-0.5, 1.7, -3.2), 50); tag(O.ponzi, 'Ponzi', BAD);
      info(wt(28), `Italien: Antwortschein ${green('billig')}`); info(wt(33), `Amerika: ${gold('mehr Briefmarken')}`); }
    if (sh.id === 'millions') { put(O.ponzi, -0.3, 0, -0.6, 0.15); pose3(O.ponzi, 'cheer', t); mv(u, V(0.4, 1.9, 4.4), V(0.3, 1.85, 3.7), V(0, 1.2, -1.2), V(0, 1.2, -1.2), 52); tag(O.ponzi, 'Ponzi', BAD); eff(wt(81), 'Eingesammelt', 'Millionen $', HERO); }
    if (sh.id === 'empty') { put(O.ponzi, 0.5, 0, -2.4, 0.2); pose3(O.ponzi, 'lookdown', t); mv(u, V(2.2, 2.5, 1.6), V(2.1, 2.45, 1.2), V(1.0, 1.15, -1.8), V(1.0, 1.15, -1.8), 50); tag(O.ponzi, 'Ponzi', BAD); chat(wt(87), gray('Gekaufte Antwortscheine: fast keine')); }
    if (sh.id === 'pay') { put(O.ponzi, 0, 0, -0.2, 0); pose3(O.ponzi, 'give', t); put(O.nv, -1.05, 0, 0.9, 0.75); pose3(O.nv, 'give', t, 1); put(O.old, 1.05, 0, 0.9, -0.75); pose3(O.old, 'give', t, 2);
      const c = ((t - sh.a) / 1.25) % 1, P0 = V(-0.7, 1.05, 1.25), P1 = V(0, 1.15, 0.4), P2 = V(0.7, 1.05, 1.25); O.coin.visible = true; O.coin.position.copy(c < 0.5 ? P0.clone().lerp(P1, smoother(c * 2)) : P1.clone().lerp(P2, smoother(c * 2 - 1))); O.coin.position.y += Math.sin((c * 2 % 1) * Math.PI) * 0.25;
      mv(u, V(0, 2.1, 6.4), V(0, 2.05, 5.8), V(0, 1.2, 0.4), V(0, 1.2, 0.4), 48); tag(O.ponzi, 'Ponzi', BAD); tag(O.nv, 'Neuer Anleger', ALLY); tag(O.old, 'Alte Anlegerin', HERO); }
  }
  // ---------- Pyramide ----------
  if (['term', 'growth', 'math', 'six', 'collapse'].includes(sh.id)) {
    scene = pyr; exp = 1.15; const P = pyr.userData; const tc = sh.id === 'collapse' ? t - wt(172) : -1; pyrUpdate(t, tc);
    const fall = (p, base, i) => { const d = tc - 0.15 - (i % 7) * 0.05; if (d > 0) { p.position.y = Math.max(0, base - 6 * d * d); p.rotation.z = Math.min(1.4, d * 3) * (i % 2 ? 1 : -1); } };
    put(P.ponzi, 0, 3, 0, 0); pose3(P.ponzi, sh.id === 'collapse' ? 'angry' : 'cheer', t); if (sh.id === 'collapse') P.ponzi.userData.setFace({ sad: true, smile: false }); fall(P.ponzi, 3, 0);
    P.l1.forEach((p, i) => { const [x, y, z] = p.userData.pos; put(p, x, y, z, Math.atan2(x, z)); pose3(p, 'idle', t, i); fall(p, y, i + 1); });
    const l2n = sh.id === 'term' ? 36 : 36; P.l2.forEach((p, i) => { const [x, y, z] = p.userData.pos; put(p, x, y, z, Math.atan2(x, z)); pose3(p, 'idle', t, i); p.visible = i < l2n; fall(p, y, i + 3); });
    P.newc.forEach((p, i) => { p.visible = sh.id === 'growth' || sh.id === 'math'; if (!p.visible) return; const k = clamp01((t - wt(105) - p.userData.d * 1.2) / 2.2), a = p.userData.a, R = lerp(19, 11, smoother(k)); const x = Math.sin(a) * R, z = Math.cos(a) * R;
      put(p, x, 0, z, Math.atan2(-x, -z)); pose3(p, k > 0 && k < 1 ? 'walk' : 'idle', t, i); if (sh.id === 'math') { p.position.set(Math.sin(a) * 11, 0, Math.cos(a) * 11); p.rotation.y = Math.atan2(x, z); pose3(p, 'sadidle', t, i); } });
    P.coins.forEach((c, i) => { c.visible = sh.id !== 'collapse' && sh.id !== 'six'; const k = ((t * 0.55 + i / P.coins.length) % 1), a = i / P.coins.length * Math.PI * 2; const r0 = 7.1, r1 = 3.4;
      const p0 = V(Math.sin(a) * r0, 2.3, Math.cos(a) * r0), p1 = V(Math.sin(a) * r1, 3.3, Math.cos(a) * r1), p2 = V(0, 4.6, 0); c.position.copy(k < 0.5 ? p0.lerp(p1, k * 2) : p1.lerp(p2, k * 2 - 1)); c.position.y += Math.sin((k * 2 % 1) * Math.PI) * 0.5; c.rotation.y = t * 2 + i; });
    if (sh.id === 'term') { mv(u, V(0, 9, 20), V(0, 8.5, 18.4), V(0, 2.2, 0), V(0, 2.4, 0), 48); tag(P.ponzi, 'Ponzi', BAD);
      tip(wt(104), 'snow', 'Schneeballsystem', '#ffd23f', [gray('Alte Anleger werden mit dem'), gray('Geld neuer Anleger bezahlt')]); }
    if (sh.id === 'growth') { mv(u, V(-14, 13, 24), V(-12, 12, 21.5), V(0, 1.6, 0), V(0, 1.8, 0), 48); tag(P.ponzi, 'Ponzi', BAD); eff(wt(110), 'Alles läuft', 'perfekt', '#55ff55'); }
    if (sh.id === 'math') { mv(u, V(18, 22, 18), V(16, 23, 16), V(0, 0.5, 0), V(0, 0.8, 0), 50); chat(wt(116), red('Fehler: Es braucht immer mehr neue Anleger')); }
    if (sh.id === 'six') { mv(u, V(1.2, 5.6, 8.4), V(1.1, 5.4, 7.6), V(0, 3.2, 0), V(0, 3.2, 0), 50); tag(P.ponzi, 'Ponzi', BAD);
      tip(wt(122), 'people', 'Jeder wirbt 6 Neue', '#55ffff', [gray('Runde 1: 6'), t >= wt(124) ? gray('Runde 2: 36') : '', t >= wt(125) ? gray('Runde 3: 216 …') : ''].filter(Boolean)); }
    if (sh.id === 'collapse') { mv(u, V(-6, 7, 20), V(-5.4, 6.4, 18.6), V(0, 1.8, 0), V(0, 1.4, 0), 48); chat(wt(172) + 0.2, red('Ponzis System ist zusammengebrochen')); }
  }
  if (sh.id === 'earth') { scene = earth; exp = 1.2; earth.userData.ball.rotation.set(0.35, t * 0.12, 0); mv(u, V(0, 2, 52), V(0, 1.6, 48), V(0, -2.5, 0), V(0, -2.5, 0), 46);
    tip(wt(129), 'globe', 'Runde 13', '#ff5555', [gray('Nötig: 13 Mrd. Menschen'), t >= wt(133) ? red('Auf der Erde: ca. 8 Mrd.') : ''].filter(Boolean)); }
  // ---------- Barron ----------
  if (['barron', 'need', 'exist'].includes(sh.id)) {
    scene = news; exp = 1.35; const N = news.userData; put(N.barron, 0, 0, -2.0, 0); sitPose(N.barron, 0.54); pose(N.barron, 'write', t); sitPose(N.barron, 0.54); N.bp.visible = sh.id === 'exist'; N.barron.userData.setFace({ smile: sh.id !== 'need' });
    if (sh.id === 'barron') { mv(u, V(1.4, 2.0, 3.4), V(1.25, 1.96, 2.9), V(0, 1.35, -1.8), V(0, 1.35, -1.8), 46); tag(N.barron, 'Clarence Barron', ALLY); info(wt(141), 'Finanzjournalist'); }
    if (sh.id === 'need') { mv(u, V(-1.1, 1.9, 2.6), V(-1.0, 1.87, 2.2), V(0, 1.45, -2.0), V(0, 1.45, -2.0), 46); tag(N.barron, 'Barron', ALLY);
      tip(wt(150), 'mail', 'Barrons Rechnung', '#55ffff', [gray('Nötig: 160.000.000'), gray('Antwortscheine')]); }
    if (sh.id === 'exist') { N.barron.userData.armR.rotation.x = -1.7; mv(u, V(0.7, 1.85, 2.8), V(0.6, 1.82, 2.4), V(0, 1.5, -2.0), V(0, 1.5, -2.0), 46); tag(N.barron, 'Barron', ALLY);
      tip(sh.a, 'mail', 'Barrons Rechnung', '#55ffff', [gray('Nötig: 160.000.000'), t >= wt(156) ? red('Im Umlauf: ca. 27.000') : ''].filter(Boolean)); }
  }
  if (sh.id === 'jail' || sh.id === 'prison') { scene = cell; exp = 1.6; const Z = cell.userData; reset([Z.pz, Z.md]); const ch = sh.id === 'jail' ? Z.pz : Z.md; put(ch, -0.6, 0, -1.25, 0.15); pose3(ch, 'sadidle', t); sitPose(ch, 0.66); ch.userData.setFace({ sad: true, smile: false });
    if (sh.id === 'jail') { mv(u, V(0.9, 1.5, 1.4), V(0.8, 1.48, 1.1), V(-0.7, 1.2, -1.2), V(-0.7, 1.2, -1.2), 48); tag(ch, 'Ponzi', BAD, -0.1); chat(wt(176), red('Ponzi wurde verhaftet (1920)')); }
    else { mv(u, V(1.0, 1.5, 1.4), V(0.9, 1.48, 1.1), V(-0.7, 1.2, -1.2), V(-0.7, 1.2, -1.2), 48); tag(ch, 'Madoff', BAD, -0.1); eff(wt(213), 'Haft', '150 Jahre', BAD); } }
  if (sh.id === 'loss') { scene = home; exp = 1.4; const Hm = home.userData; put(Hm.rosa, -0.4, 0, -1.55, 0.1); pose3(Hm.rosa, 'sadidle', t); sitPose(Hm.rosa, 0.5); Hm.rosa.userData.armL.rotation.x = Hm.rosa.userData.armR.rotation.x = -1.3; Hm.rosa.userData.setFace({ sad: true });
    put(Hm.man, 1.3, 0, -1.6, -0.35); pose3(Hm.man, 'sadidle', t, 1); Hm.man.userData.setFace({ sad: true }); put(Hm.kid, -1.5, 0, -1.1, 0.4); pose3(Hm.kid, 'sadidle', t, 2); Hm.kid.userData.setFace({ sad: true });
    mv(u, V(0.2, 1.8, 2.8), V(0.15, 1.75, 2.3), V(0, 1.05, -1.2), V(0, 1.05, -1.2), 48); tag(Hm.rosa, 'Anlegerin', HERO); eff(wt(180), 'Ersparnisse', '0 $', BAD); }
  if (sh.id === 'madoff') { scene = nyc; exp = 1.3; const Ny = nyc.userData; put(Ny.madoff, 0.5, 60.4, 2.0, 0.3); pose3(Ny.madoff, 'cross', t); mv(u, V(2.6, 62.4, 7.2), V(2.3, 62.3, 6.4), V(0, 61.6, 0), V(0, 61.6, 0), 50); tag(Ny.madoff, 'Bernie Madoff', BAD); info(wt(183), 'New York, Jahrzehnte später'); }
  if (sh.id === 'decades' || sh.id === 'bust') { scene = modern; exp = 1.25; const Md = modern.userData; reset([Md.madoff, Md.nv, Md.old, ...Md.agents]); Md.coin.visible = false;
    if (sh.id === 'decades') { put(Md.madoff, 0, 0, -0.4, 0); pose3(Md.madoff, 'give', t); put(Md.nv, -1.05, 0, 0.7, 0.75); pose3(Md.nv, 'give', t, 1); put(Md.old, 1.05, 0, 0.7, -0.75); pose3(Md.old, 'give', t, 2);
      const c = ((t - sh.a) / 1.1) % 1, P0 = V(-0.7, 1.05, 1.05), P1 = V(0, 1.15, 0.2), P2 = V(0.7, 1.05, 1.05); Md.coin.visible = true; Md.coin.position.copy(c < 0.5 ? P0.clone().lerp(P1, smoother(c * 2)) : P1.clone().lerp(P2, smoother(c * 2 - 1))); Md.coin.position.y += Math.sin((c * 2 % 1) * Math.PI) * 0.25;
      mv(u, V(-1.6, 2.1, 6.4), V(-1.3, 2.05, 5.9), V(0, 1.2, 0.2), V(0, 1.2, 0.2), 48); tag(Md.madoff, 'Madoff', BAD); tag(Md.nv, 'Neuer Kunde', ALLY); tag(Md.old, 'Alte Kundin', HERO); }
    if (sh.id === 'bust') { put(Md.madoff, 0, 0, -1.0, 0.2); pose3(Md.madoff, t >= wt(203) ? 'raise' : 'idle', t); if (t >= wt(203)) { Md.madoff.userData.armR.rotation.x = Md.madoff.userData.armL.rotation.x = -2.9; Md.madoff.userData.setFace({ sad: true, smile: false }); }
      Md.agents.forEach((p, i) => { const k = smoother((t - wt(201) - i * 0.2) / 0.7); const x = i ? 2.4 : -2.2, z = lerp(3.4, 0.6, k); put(p, x, 0, z, facing(x, z, 0, -1.0)); pose3(p, k > 0 && k < 1 ? 'walk' : 'point', t, i); p.userData.setFace({ angry: true }); });
      mv(u, V(0.3, 2.0, 5.0), V(0.3, 1.95, 4.4), V(0, 1.2, -0.6), V(0, 1.2, -0.6), 50); tag(Md.madoff, 'Madoff', BAD); Md.agents.forEach(p => { if (p.position.z < 2.6) tag(p, 'FBI', ALLY); });
      tip(wt(205), 'coin', 'Madoffs Fonds, 2008', '#ff5555', [gray('Auf dem Papier: 65 Mrd. $'), red('Echtes Geld: nur ein Bruchteil')]); }
  }
  if (sh.id === 'crypto' || sh.id === 'warn') { scene = room; exp = 1.55; const R = room.userData; const { user } = R; R.uphone.visible = true; put(user, -1.4, 0.55, -1.0, 0.45); pose3(user, 'phone', t); sitPose(user, 0.6); R.phoneG.position.set(-1.1, 1.3, -0.6);
    user.userData.setFace(sh.id === 'warn' ? { angry: false, sad: false, smile: false } : { smile: true });
    if (sh.id === 'crypto') { mv(u, V(0.9, 2.0, 3.0), V(0.7, 1.95, 2.6), V(-1.3, 1.2, -1.0), V(-1.3, 1.2, -1.0), 46); tag(user, 'Du', HERO); info(wt(216), 'Heute');
      say(wt(223), 'KryptoKing', BAD, 'Garantiert 30 % pro Monat!'); say(wt(225), 'Lisa', BAD, 'Komm in unseren Schenkkreis!'); }
    else { if (t >= wt(231)) { user.userData.armR.rotation.x = -0.4; R.uphone.visible = true; pose3(user, 'cross', t); sitPose(user, 0.6); R.uphone.visible = false; }
      mv(u, V(-0.4, 1.75, 1.9), V(-0.5, 1.72, 1.6), V(-1.4, 1.3, -1.0), V(-1.4, 1.3, -1.0), 46); tag(user, 'Du', HERO);
      tip(wt(227), 'warn', 'Warnzeichen', '#ff5555', [t >= wt(231) ? red('· hohe, „sichere“ Gewinne') : gray('…'), t >= wt(235) ? red('· Prämien fürs Anwerben') : ''].filter(Boolean)); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } dusk.userData.ball.rotation.y = t * 0.2; mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  coin: '<rect x="2" y="1" width="4" height="6" fill="#f0c030"/><rect x="1" y="2" width="6" height="4" fill="#f0c030"/><rect x="3" y="2" width="2" height="4" fill="#b8860b"/><rect x="2" y="3" width="1" height="1" fill="#b8860b"/>',
  mail: '<rect x="0" y="2" width="8" height="5" fill="#e8e2c8"/><rect x="1" y="3" width="1" height="1" fill="#5a7aa8"/><rect x="2" y="4" width="1" height="1" fill="#5a7aa8"/><rect x="3" y="5" width="2" height="1" fill="#5a7aa8"/><rect x="5" y="4" width="1" height="1" fill="#5a7aa8"/><rect x="6" y="3" width="1" height="1" fill="#5a7aa8"/>',
  snow: '<rect x="2" y="1" width="4" height="6" fill="#f4f8fc"/><rect x="1" y="2" width="6" height="4" fill="#f4f8fc"/><rect x="3" y="3" width="1" height="1" fill="#f0c030"/><rect x="5" y="2" width="1" height="1" fill="#f0c030"/><rect x="2" y="5" width="1" height="1" fill="#4aa84a"/><rect x="5" y="5" width="1" height="1" fill="#b8c8d8"/>',
  people: '<rect x="3" y="0" width="2" height="2" fill="#ffd23f"/><rect x="0" y="5" width="2" height="2" fill="#55ffff"/><rect x="3" y="5" width="2" height="2" fill="#55ffff"/><rect x="6" y="5" width="2" height="2" fill="#55ffff"/><rect x="3" y="2" width="2" height="2" fill="#aaaaaa"/><rect x="1" y="4" width="6" height="1" fill="#aaaaaa"/>',
  globe: '<rect x="2" y="1" width="4" height="6" fill="#2a5ab0"/><rect x="1" y="2" width="6" height="4" fill="#2a5ab0"/><rect x="2" y="2" width="2" height="2" fill="#4a8a3a"/><rect x="5" y="4" width="1" height="2" fill="#4a8a3a"/><rect x="3" y="5" width="1" height="1" fill="#4a8a3a"/>',
  warn: '<rect x="3" y="0" width="2" height="1" fill="#ff5555"/><rect x="2" y="1" width="4" height="2" fill="#ff5555"/><rect x="1" y="3" width="6" height="2" fill="#ff5555"/><rect x="0" y="5" width="8" height="2" fill="#ff5555"/><rect x="3" y="2" width="2" height="3" fill="#fff"/><rect x="3" y="6" width="2" height="1" fill="#fff"/>',
};
const NUM = { 'hundert': '100', 'fünfundvierzig': '45', 'fünfzig': '50', 'sechs': '6', 'dreizehn': '13', 'hundertsechzig': '160', 'siebenundzwanzigtausend.': '27.000.', 'zweitausendacht': '2008', 'fünfundsechzig': '65', 'hundertfünfzig': '150' };
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
window.SHOTS = SHOTS;
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
