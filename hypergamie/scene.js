// „Hypergamie, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
const PRIYA = { skin: 0xc68a62, hair: 0x141010, longHair: true, top: 0xd8306a, bottom: 0xd8306a, skirt: true, shoe: 0x8a5a2a, eye: '#2a1a10', smile: true, seed: 31 };
const VATER = { skin: 0xb07a52, hair: 0x1a1614, beard: 'short', top: 0xe0b830, bottom: 0xeae2d0, shoe: 0x6a4a2a, eye: '#2a1a10', seed: 32 };
const MUTTER = { skin: 0xbe845a, hair: 0x1a1410, longHair: true, top: 0x2a8a6a, bottom: 0x2a8a6a, skirt: true, shoe: 0x6a4a2a, eye: '#2a1a10', seed: 33 };
const GROOM = { skin: 0xb27a54, hair: 0x161210, beard: 'mustache', top: 0xa82a24, bottom: 0xeae2d0, belt: 0xe0b030, shoe: 0x5a3a20, eye: '#2a1a10', smile: true, seed: 34 };
const PRIEST = { skin: 0xb88058, hair: 0xe8e8e8, bald: true, beard: 'full', beardCol: 0xeeeeee, top: 0xf2ede0, bottom: 0xe8902a, shoe: 0x8a6a3a, eye: '#2a1a10', seed: 35 };
const SARA = { skin: 0xf0c4a2, hair: 0x8a4a22, longHair: true, top: 0xf4f4f4, bottom: 0x3a5a8a, coat: true, shoe: 0xf0f0f0, eye: '#3a6a3a', smile: true, seed: 41 };
const JONAS = { skin: 0xe8b894, hair: 0xc8a05a, hairVol: true, beard: 'short', beardCol: 0xb08a48, top: 0x4a6a3a, bottom: 0x6a5a3a, shoe: 0x3a2a1a, eye: '#3a5a8a', smile: true, seed: 42 };
const indianSkins = [0xb07a52, 0xc68a62, 0x9a6a46, 0xbe845a], darkHair = [0x141010, 0x1e1814, 0x2a1e16];

// =====================================================================
// SET 1: Indien – Kasten-Pyramide, Dorf, Markt, Hochzeit
// =====================================================================
const PX = 1.5, PZ = -18, S = [26, 20, 14, 8], TH = 1.6, SPREV = [32, 26, 20, 14];
const TIER_COL = [0x8a6a4a, 0xd8b040, 0xb83a2a, 0xeee6d6], TIER_NAME = ['Diener', 'Händler', 'Krieger', 'Priester'];
function stairY(z) { if (z > PZ + 16) return 0; for (let i = 0; i < 4; i++) { const z0 = PZ + SPREV[i] / 2, z1 = PZ + S[i] / 2; if (z <= z0 && z >= z1) return TH * i + (z0 - z) / (z0 - z1) * TH; } return TH * 4; }
const india = new THREE.Scene();
{
  const sky = skyDome(india, 0x3a80d0, 0x9ac4e8, 0xf0dcb8, V(-0.4, 0.5, 0.5)); india.fog = new THREE.Fog(0xf0dcb8, 90, 420); clouds(india, 9, 0xffffff, 70, 18, 220, 0.85);
  const earth = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xc8a470, 0.12), 2001)); india.add(box(500, 1, 500, earth, 0, -0.5, 0, { cast: false }));
  const grassM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x7a9a4a, 0.14), 2002));
  for (const [x, z, w, d] of [[-30, 20, 30, 20], [34, 22, 30, 20], [-40, -20, 30, 40], [44, -24, 30, 40]]) india.add(box(w, 0.1, d, grassM, x, 0.05, z, { cast: false }));
  // Pyramide der Kasten
  for (let i = 0; i < 4; i++) { const m = M(tileTex(TIER_COL[i], shade(TIER_COL[i], 0.72), 2010 + i)); india.add(box(S[i], TH, S[i], m, PX, TH * i + TH / 2, PZ)); }
  const stepM = M(tileTex(0xb8a68a, 0x8a7a62, 2020));
  for (let i = 0; i < 4; i++) { const z0 = PZ + SPREV[i] / 2, run = (SPREV[i] - S[i]) / 2; for (let k = 0; k < 8; k++) { const top = TH * i + (k + 1) * TH / 8; india.add(box(2.4, top, run / 8, stepM, PX, top / 2, z0 - (k + 0.5) * run / 8)); } }
  const white = M(tileTex(0xf2eee4, 0xc8c0b0, 2021)), gold = C(0xf0c030, { metal: 0.5, rough: 0.4 });
  const y4 = TH * 4; india.add(box(3.4, 2.2, 3.4, white, PX, y4 + 1.1, PZ - 1)); india.add(box(2.6, 1.4, 2.6, white, PX, y4 + 2.9, PZ - 1)); india.add(box(1.8, 1.2, 1.8, white, PX, y4 + 4.2, PZ - 1)); india.add(box(0.5, 0.8, 0.5, gold, PX, y4 + 5.2, PZ - 1));
  india.add(box(1.0, 1.6, 0.1, C(0x3a2416), PX, y4 + 0.8, PZ + 0.72, { cast: false }));
  // Dorf: Lehmhäuser, Palmen
  const mud = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xc8946a, 0.08), 2030)), mud2 = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8b08a, 0.08), 2031));
  const house = (x, z, w, h, rot = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; g.add(box(w, h, 4, (x * 7 | 0) % 2 ? mud : mud2, 0, h / 2, 0)); g.add(box(w + 0.3, 0.3, 4.3, C(0x9a6a46), 0, h + 0.15, 0)); g.add(box(1.0, 1.9, 0.1, C(0x4a2e1a), 0, 0.95, 2.02, { cast: false })); g.add(box(0.8, 0.6, 0.1, C(0x2a1e16), w / 2 - 0.8, 1.9, 2.02, { cast: false })); india.add(g); };
  for (const [x, z, w, h, r] of [[-12, 3, 4, 3, 0], [-17, 1, 5, 3.4, 0.2], [-22, 6, 4, 3, 0.4], [16, 5, 5, 3.2, -0.2], [21, 2, 4, 3, -0.3], [-14, 12, 4, 3, 0.1], [18, 13, 4.5, 3, -0.1], [-26, -4, 5, 3.6, 0.6], [26, -6, 5, 3.4, -0.6], [-8, 16, 4, 3, 0], [9, 17, 4, 3.2, 0]]) house(x, z, w, h, r);
  const palm = (x, z, h = 6) => { for (let i = 0; i < h; i++) india.add(box(0.45, 1, 0.45, C(0x7a5a3a), x + Math.sin(i * 0.4) * 0.15 * i / h, i + 0.5, z)); const lm = C(0x3a8a32); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; india.add(box(Math.abs(Math.cos(a)) * 2.6 + 0.5, 0.25, Math.abs(Math.sin(a)) * 2.6 + 0.5, lm, x + Math.cos(a) * 1.3, h + 0.1, z + Math.sin(a) * 1.3)); } india.add(box(1.0, 0.5, 1.0, C(0x4a9a3a), x, h + 0.3, z)); };
  for (const [x, z, h] of [[-6, -3, 6], [8, -4, 7], [-20, 14, 6], [24, 12, 7], [-30, 2, 8], [30, 0, 6], [-4, 22, 6], [13, 24, 7], [-36, -12, 7], [38, -14, 7]]) palm(x, z, h);
  // Markt
  const st = new THREE.Group(); st.position.set(-7, 0, 6); india.add(st);
  st.add(box(2.6, 0.9, 1.0, M(T.planks), 0, 0.45, 0)); for (const x of [-1.25, 1.25]) for (const z of [-0.45, -1.3]) st.add(box(0.12, 2.6, 0.12, C(0x6a4a2a), x, 1.3, z));
  for (let i = 0; i < 6; i++) st.add(box(0.48, 0.12, 1.2, C(i % 2 ? 0xf0a020 : 0xe8e2d0), -1.2 + i * 0.48, 2.6, -0.85));
  for (const [x, c] of [[-0.8, 0xc03a20], [0, 0xe0b020], [0.8, 0xd87020]]) { st.add(box(0.6, 0.3, 0.6, C(0x8a6a4a), x, 1.05, 0)); st.add(box(0.5, 0.12, 0.5, C(c), x, 1.25, 0, { cast: false })); }
  // Mandap (Hochzeit)
  const md = new THREE.Group(); md.position.set(10, 0, -1); india.add(md); md.add(box(4, 0.3, 4, white, 0, 0.15, 0));
  for (const x of [-1.8, 1.8]) for (const z of [-1.8, 1.8]) md.add(box(0.2, 3, 0.2, C(0xd8a030, { metal: 0.3, rough: 0.5 }), x, 1.8, z));
  md.add(box(4.2, 0.2, 4.2, C(0xc8202a), 0, 3.35, 0)); md.add(box(3.0, 0.4, 3.0, C(0xe86a20), 0, 3.6, 0));
  for (let i = 0; i < 9; i++) md.add(box(0.14, 0.14, 0.14, C([0xf08a20, 0xffd040][i % 2]), -1.6 + i * 0.4, 3.05 - Math.sin(i / 8 * Math.PI) * 0.35, 1.8, { cast: false }));
  // Lesepult + Buch (oben)
  const lect = new THREE.Group(); lect.position.set(PX + 1.8, y4, PZ + 3.4); india.add(lect); lect.add(box(0.5, 1.0, 0.4, C(0x6a4a2a), 0, 0.5, 0)); lect.add(box(0.7, 0.06, 0.5, C(0xe8dcc0), 0, 1.06, 0)); lect.add(box(0.02, 0.07, 0.5, C(0x6a2a1a), 0, 1.08, 0));
  const sun = sunLight(india, 0xfff0d0, 3.4, V(-40, 60, 40), V(0, 0, -6), 45); india.add(new THREE.HemisphereLight(0xd8e8ff, 0x9a7a5a, 1.4));
  // Figuren
  const priya = humanoid(PRIYA), groom = humanoid(GROOM), father = humanoid(VATER), mother = humanoid(MUTTER), priest = humanoid(PRIEST);
  turban(groom, 0xe0b030); turban(father, 0xeae2d0); const gPri = garland(priya), gGr = garland(groom);
  india.add(priya, groom, father, mother, priest);
  const r = rng(2040); const tiers = [];
  for (let i = 0; i < 4; i++) { const arr = []; for (let k = 0; k < 4; k++) { const tops = [0x7a5a3a, 0xe0b830, 0xa82a24, 0xf2ede0], bots = [0x6a4a30, 0xeae2d0, 0xeae2d0, 0xe8902a];
      const p = humanoid({ skin: indianSkins[(i + k) % 4], hair: darkHair[k % 3], top: tops[i], bottom: bots[i], longHair: k === 2, skirt: k === 2, beard: k === 1 ? 'short' : undefined, bald: i === 3 && k === 0, seed: 2050 + i * 4 + k });
      if (i === 2 && k !== 2) turban(p, 0xc8302a); if (i === 1 && k === 3) turban(p, 0xeae2d0);
      const side = k < 2 ? -1 : 1, off = k % 2 ? 4.2 : 2.4; p.position.set(PX + side * (off + (3 - i) * 0.9), TH * (i + 1), PZ + S[i] / 2 - 0.9); p.rotation.y = -side * 0.25; india.add(p); arr.push(p); } tiers.push(arr); }
  const candB = humanoid({ skin: 0x9a6a46, hair: 0x1e1814, top: 0x7a5a3a, bottom: 0x6a4a30, seed: 2070 }), candY = humanoid({ skin: 0xbe845a, hair: 0x141010, top: 0xe0b830, bottom: 0xeae2d0, beard: 'goatee', seed: 2071 }); india.add(candB, candY);
  const pDau = humanoid({ skin: 0xc68a62, hair: 0x141010, longHair: true, top: 0xf2ede0, bottom: 0xe8902a, skirt: true, seed: 2072 }), serv = humanoid({ skin: 0x9a6a46, hair: 0x1e1814, top: 0x7a5a3a, bottom: 0x6a4a30, seed: 2073 }); india.add(pDau, serv);
  const vill = [0, 1, 2].map(i => { const p = humanoid({ skin: indianSkins[i], hair: darkHair[i], top: [0xe0b830, 0xa82a24, 0x2a6a8a][i], bottom: 0xeae2d0, longHair: i === 2, skirt: i === 2, seed: 2080 + i }); india.add(p); return p; });
  india.userData = { sky, sun, priya, groom, father, mother, priest, tiers, candB, candY, pDau, serv, vill, gPri, gGr };
}

// =====================================================================
// SET 2: Europa – Platz mit Kirche, Universität, Bürgerhaus
// =====================================================================
const europe = new THREE.Scene();
{
  skyDome(europe, 0x5a80b8, 0x9ab4d0, 0xd8dce0, V(-0.4, 0.5, 0.4)); europe.fog = new THREE.Fog(0xd0d4d8, 70, 300); clouds(europe, 4, 0xf4f4f4, 60, 26, 200, 0.9);
  europe.add(box(400, 1, 400, M(T.cobble), 0, -0.5, 0, { cast: false, uvScale: 0.5 }));
  const stone = M(tileTex(0x9a948a, 0x6a645c, 2101)), stoneD = M(tileTex(0x7a746a, 0x55504a, 2102));
  // Kirche
  const ch = new THREE.Group(); ch.position.set(0, 0, -20); europe.add(ch);
  ch.add(box(14, 12, 12, stone, 0, 6, 0)); for (let s = 0; s < 4; s++) ch.add(box(14.4, 1, 12.4 - s * 3.2, M(T.roof), 0, 12.5 + s, 0));
  ch.add(box(4.5, 24, 4.5, stoneD, 0, 12, 7.5)); for (let s = 0; s < 4; s++) ch.add(box(4.6 - s * 1.1, 1.4, 4.6 - s * 1.1, M(T.roof), 0, 24.7 + s * 1.4, 7.5)); ch.add(box(0.2, 1.6, 0.2, C(0xd8b030, { metal: 0.6 }), 0, 31.2, 7.5));
  ch.add(box(2.0, 3.4, 0.1, C(0x3a2416), 0, 1.7, 9.78, { cast: false })); ch.add(box(1.4, 2.2, 0.1, C(0x3a4a6a), 0, 15, 9.78, { cast: false }));
  for (const x of [-5, 5]) ch.add(box(1.4, 3.6, 0.1, C(0x3a4a6a), x, 6, 6.02, { cast: false }));
  // Häuser rundum
  const cols = [0xe2d6c2, 0xc9b49a, 0xd8c0b0, 0xe8e0c8, 0xc8b8a0]; const r = rng(2110);
  for (let i = 0; i < 8; i++) for (const side of [-1, 1]) { const z = -16 + i * 6.2, h = 8 + r() * 4, x = side * 19; const g = new THREE.Group(); g.position.set(x, 0, z); europe.add(g);
    g.add(box(8, h, 6, C(cols[(i + (side > 0 ? 2 : 0)) % 5]), 0, h / 2, 0)); for (let s = 0; s < 4; s++) g.add(box(8.4 - s * 2, 1, 6.4, M(T.roofRed), 0, h + 0.5 + s, 0));
    for (const wz of [-1.6, 1.6]) for (const wy of [2.4, 5.4]) g.add(box(0.1, 1.4, 1.0, M(T.windowDark), -side * 4.02, wy, wz, { cast: false })); }
  // Universität mit Gittertor (rechts hinten)
  const un = new THREE.Group(); un.position.set(36, 0, -16); europe.add(un);
  un.add(box(16, 10, 8, stone, 0, 5, -2)); un.add(box(16.6, 1.2, 8.6, stoneD, 0, 10.6, -2)); for (let x = -6; x <= 6; x += 2.4) un.add(box(0.8, 8, 0.8, M(T.white), x, 4, 2.6)); un.add(box(15, 1, 2, M(T.white), 0, 8.5, 2.6));
  for (let x = -7; x <= 7; x += 0.5) { if (Math.abs(x) < 0.01) continue; europe.add(box(0.08, 2.6, 0.08, C(0x1a1a1e, { metal: 0.6, rough: 0.4 }), 36 + x, 1.3, -8)); }
  europe.add(box(14.2, 0.1, 0.1, C(0x1a1a1e, { metal: 0.6 }), 36, 2.5, -8)); europe.add(box(14.2, 0.1, 0.1, C(0x1a1a1e, { metal: 0.6 }), 36, 0.4, -8));
  for (const x of [-7.3, 7.3]) europe.add(box(0.6, 3.2, 0.6, stoneD, 36 + x, 1.6, -8));
  // Bürgerhaus mit Gold
  const bh = new THREE.Group(); bh.position.set(-34, 0, -12); europe.add(bh); bh.add(box(10, 10, 8, C(0xe8dcc8), 0, 5, -2)); bh.add(box(10.6, 1, 8.6, M(T.roof), 0, 10.5, -2)); bh.add(box(1.6, 2.8, 0.1, C(0x2a1a10), 0, 1.4, 2.02, { cast: false }));
  for (const wx of [-3, 3]) for (const wy of [2.2, 6]) bh.add(box(1.4, 1.8, 0.1, M(T.window), wx, wy, 2.02, { cast: false }));
  const goldM = M(T.gold, { metal: 0.6, rough: 0.35 }); const pile = new THREE.Group(); for (let i = 0; i < 14; i++) pile.add(box(0.3, 0.16, 0.3, goldM, (i % 4) * 0.32 - 0.48, 0.08 + Math.floor(i / 8) * 0.17, Math.floor((i % 8) / 4) * 0.32)); pile.position.set(-35.4, 0, -6.6); europe.add(pile);
  const sun = sunLight(europe, 0xfff0d8, 3.0, V(-45, 60, 45), V(0, 0, -6), 60); europe.add(new THREE.HemisphereLight(0xcfdcf0, 0x6a6458, 1.5));
  const bride = humanoid({ skin: 0xf2cdb0, hair: 0x8a5a2a, longHair: true, top: 0xf6f4ee, bottom: 0xf6f4ee, skirt: true, shoe: 0xf0f0f0, smile: true, seed: 2120 }); veil(bride);
  const gentle = { skin: 0xe8b894, hair: 0x3a2a1a, hairVol: false, hat: 'top', beard: 'mustache', top: 0x1a1a22, bottom: 0x1a1a22, tie: 0xeeeeee, coat: true, shoe: 0x111111, seed: 2121 };
  const groomE = humanoid(gentle); groomE.userData.hatExtra = 0.45;
  const anna = humanoid({ skin: 0xf2cdb0, hair: 0xb0784a, longHair: true, top: 0x3a5a9a, bottom: 0x3a5a9a, skirt: true, shoe: 0x2a1a10, eye: '#3a5a8a', seed: 2122 });
  const suitor = humanoid({ ...gentle, beard: 'full', beardCol: 0x6a6a6a, hair: 0x7a7a7a, seed: 2123 }); suitor.userData.hatExtra = 0.45;
  const papa = humanoid({ skin: 0xe8b894, hair: 0xa8a8a8, beard: 'mustache', beardCol: 0xa8a8a8, top: 0x4a3a2a, bottom: 0x3a2e22, seed: 2124 });
  const ring = inHand(suitor, ringMesh()); const books = inHand(anna, bookMesh());
  const rich = humanoid({ ...gentle, seed: 2125 }); rich.userData.hatExtra = 0.45; const wife = humanoid({ skin: 0xf2cdb0, hair: 0x4a2a1a, longHair: true, top: 0x8a2a4a, bottom: 0x8a2a4a, skirt: true, seed: 2126 });
  const guests = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2, 0xe0a882, 0xf2cdb0][i], hair: [0x3a2a1a, 0x8a5a2a, 0x2a1a14, 0xb8925a][i], top: [0x4a3a5a, 0x6a2a2a, 0x2a4a3a, 0x5a4a3a][i], bottom: 0x2a2a30, longHair: i % 2 === 1, skirt: i % 2 === 1, hat: i === 0 ? 'top' : undefined, seed: 2130 + i }); europe.add(p); return p; });
  const students = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xe8b894, 0xf0c4a2, 0xe0a882][i], hair: [0x3a2a1a, 0x8a5a2a, 0x2a1a14][i], top: 0x2a2a3a, bottom: 0x2a2a30, seed: 2140 + i }); inHand(p, bookMesh(0x2a3a6a)); europe.add(p); return p; });
  europe.add(bride, groomE, anna, suitor, papa, rich, wife);
  europe.userData = { sun, bride, groomE, anna, suitor, papa, ring, books, rich, wife, guests, students };
}

// =====================================================================
// SET 3: Küche der 70er (BRD)
// =====================================================================
const kitchen = new THREE.Scene(); kitchen.background = new THREE.Color(0x0a0806);
{
  const wp = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xc8782a, 0.04); for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) { c.fillStyle = '#8a4a1a'; c.fillRect(x + 2, y + 2, 4, 4); c.fillStyle = '#e8b040'; c.fillRect(x + 3, y + 3, 2, 2); } }, 2201));
  const lino = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 2) + (y >> 2)) % 2 ? 0xe8dcc0 : 0x6a4a2a, 0.95 + r() * 0.1)); }, 2202));
  room3(kitchen, 9, 8, 3.4, wp, lino);
  const cab = C(0x7a8a3a), top = C(0xe8e0c8);
  kitchen.add(box(4, 0.9, 0.7, cab, -2.2, 0.45, -3.5)); kitchen.add(box(4, 0.06, 0.74, top, -2.2, 0.93, -3.48)); kitchen.add(box(4, 0.8, 0.4, cab, -2.2, 2.4, -3.65));
  kitchen.add(box(0.9, 0.92, 0.72, C(0xf0ece0), -1.0, 0.46, -3.5)); for (const x of [-1.2, -0.8]) kitchen.add(box(0.26, 0.03, 0.26, C(0x2a2a2a), x, 0.95, -3.4, { cast: false }));
  kitchen.add(box(0.36, 0.26, 0.36, C(0xd84a2a, { metal: 0.3, rough: 0.5 }), -1.2, 1.1, -3.4));
  kitchen.add(box(0.9, 2.0, 0.8, C(0xe8e0b0), -3.9, 1.0, -3.4)); kitchen.add(box(0.04, 0.5, 0.04, C(0x8a8a8a), -3.5, 1.4, -2.98, { cast: false }));
  const winM = new THREE.MeshBasicMaterial({ color: 0x9ac0e8 }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), winM); win.position.set(2.4, 2.0, -3.84); kitchen.add(win);
  kitchen.add(box(1.7, 0.08, 0.1, C(0xf0f0f0), 2.4, 2.0, -3.8, { cast: false })); kitchen.add(box(0.08, 1.3, 0.1, C(0xf0f0f0), 2.4, 2.0, -3.8, { cast: false }));
  // Esstisch + Stühle
  kitchen.add(box(1.6, 0.08, 1.0, C(0x8a5a2a), 1.4, 0.8, 0.6)); for (const [x, z] of [[0.7, 0.2], [2.1, 0.2], [0.7, 1.0], [2.1, 1.0]]) kitchen.add(box(0.08, 0.8, 0.08, C(0x5a3a1a), x, 0.4, z));
  kitchen.add(box(0.5, 0.08, 0.5, C(0xc86a2a), 2.4, 0.46, -0.1)); kitchen.add(box(0.5, 0.6, 0.08, C(0xc86a2a), 2.4, 0.8, -0.38));
  // Schreibtisch + Schreibmaschine
  kitchen.add(box(1.6, 0.08, 0.8, C(0x6a4a2a), 2.6, 0.78, -2.2)); for (const x of [1.9, 3.3]) kitchen.add(box(0.08, 0.78, 0.7, C(0x5a3a1a), x, 0.39, -2.2));
  kitchen.add(box(0.6, 0.18, 0.4, C(0x3a4a3a, { metal: 0.3, rough: 0.5 }), 2.6, 0.91, -2.0)); kitchen.add(box(0.5, 0.3, 0.02, C(0xf4f0e8), 2.6, 1.12, -2.18)); kitchen.add(box(0.5, 0.08, 0.5, C(0xc86a2a), 2.6, 0.46, -2.85));
  const lamp = new THREE.PointLight(0xffb060, 9, 10, 1.4); lamp.position.set(1, 3.0, 0); kitchen.add(lamp); kitchen.add(box(0.8, 0.3, 0.8, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 1, 3.2, 0, { cast: false }));
  sunLight(kitchen, 0xffe8c8, 1.6, V(6, 7, 9), V(0, 0, -1), 7, 1024); kitchen.add(new THREE.HemisphereLight(0xffe8d0, 0x5a3a1a, 1.1));
  const frau = humanoid({ skin: 0xf2cdb0, hair: 0x6a3a1a, hairVol: true, top: 0xe8a030, bottom: 0x8a4a2a, skirt: true, shoe: 0x4a2a1a, eye: '#3a5a2a', seed: 2210 });
  frau.userData.body.add(box(0.44, 0.5, 0.02, C(0xf0f0f0), 0, 0.85, 0.15, { cast: false }));
  const mann = humanoid({ skin: 0xe8b894, hair: 0x4a3020, hairVol: true, beard: 'mustache', top: 0x8a6a3a, bottom: 0x5a4a2a, tie: 0x6a2a1a, shoe: 0x2a1a10, seed: 2211 });
  const paper = inHand(mann, paperMesh()); kitchen.add(frau, mann);
  kitchen.userData = { frau, mann, paper };
}

// =====================================================================
// SET 4: Zimmer am PC (nachts) + Raster mit 100 Männern
// =====================================================================
const net = new THREE.Scene(); net.background = new THREE.Color(0x05060a);
{
  const wall = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x5a6070, 0.05), 2301)); room3(net, 7, 6, 3, wall, M(T.planks));
  net.add(box(1.8, 0.08, 0.8, C(0x2a2a2e), 0.4, 0.78, -1.75)); for (const x of [-0.4, 1.2]) net.add(box(0.08, 0.78, 0.7, C(0x1a1a1e), x, 0.39, -1.75));
  const scrM = new THREE.MeshBasicMaterial({ color: 0x6aa8ff }); net.add(box(0.9, 0.55, 0.06, C(0x111114), 0.6, 1.2, -1.6)); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.47), scrM); scr.position.set(0.6, 1.2, -1.64); scr.rotation.y = Math.PI; net.add(scr);
  net.add(box(0.1, 0.25, 0.1, C(0x111114), 0.6, 0.92, -1.6)); net.add(box(0.5, 0.03, 0.18, C(0x1a1a1e), 0.3, 0.83, -1.95, { cast: false }));
  net.add(box(1.4, 0.45, 2.4, C(0x3a2a1a), -2.6, 0.225, -0.9)); net.add(box(1.3, 0.16, 2.3, C(0x4a5a8a), -2.6, 0.53, -0.9)); net.add(box(1.0, 0.15, 0.45, C(0xd8d8e0), -2.6, 0.66, -1.85));
  net.add(box(0.55, 0.08, 0.55, C(0x1a1a1e), 0, 0.5, -2.6)); net.add(box(0.55, 0.8, 0.08, C(0x1a1a1e), 0, 0.95, -2.92));
  const winM = new THREE.MeshBasicMaterial({ color: 0x10183a }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), winM); win.position.set(-1.8, 1.9, -2.84); net.add(win);
  const glow = new THREE.PointLight(0x6aa8ff, 6, 5, 1.4); glow.position.set(0.5, 1.4, -2.0); net.add(glow);
  net.add(new THREE.HemisphereLight(0x3a4a7a, 0x10101a, 0.6)); const moon = sunLight(net, 0x6a7ab8, 0.7, V(-6, 6, 8), V(0, 0, -1), 6, 1024);
  const phoneG = new THREE.PointLight(0x9ad0ff, 0, 2.5, 1.5); net.add(phoneG);
  const user = humanoid({ skin: 0xe8b894, hair: 0x3a2a1a, hairVol: true, top: 0x3a3a44, bottom: 0x2a2e3a, shoe: 0xe8e8e8, eye: '#3a2a1a', seed: 2310 }); hoodie(user, 0x3a3a44);
  const uphone = inHand(user, phoneMesh()); net.add(user);
  // Profilbilder (Swipe)
  const cards = []; for (let i = 0; i < 5; i++) { const tx = tex(10, 12, (c, r) => { c.fillStyle = hex([0xf0a0a0, 0xa0c8f0, 0xf0d890, 0xb8e0a8, 0xd8b0f0][i]); c.fillRect(0, 0, 10, 12); c.fillStyle = '#fff'; c.fillRect(0, 10, 10, 2);
      const sk = hex([0xf0c4a2, 0xc89a72, 0xe8b894, 0x8a5a3a, 0xf2cdb0][i]), hr = hex([0x2a1a14, 0x8a5a2a, 0xb8925a, 0x1a1a1a, 0x6a3a1a][i]); c.fillStyle = hr; c.fillRect(2, 1, 6, 7); c.fillStyle = sk; c.fillRect(3, 3, 4, 4); c.fillStyle = '#222'; c.fillRect(3, 4, 1, 1); c.fillRect(6, 4, 1, 1); c.fillStyle = hex([0xd83a4a, 0x3a7ad8, 0xe8b830, 0x3a8a5a, 0x8a5aa8][i]); c.fillRect(2, 8, 6, 2); }, 2320 + i);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.41), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide, transparent: true })); net.add(m); cards.push(m); }
  net.userData = { user, uphone, scrM, glow, phoneG, cards };
}
const grid = new THREE.Scene();
{
  skyDome(grid, 0x6a90c8, 0xa8c4e0, 0xdce6ee, V(-0.4, 0.5, 0.4)); grid.fog = new THREE.Fog(0xdce6ee, 60, 260);
  grid.add(box(400, 1, 400, M(T.grass), 0, -0.5, 0, { cast: false, uvScale: 1 }));
  sunLight(grid, 0xfff0d8, 3.0, V(-30, 50, 40), V(0, 0, 0), 20); grid.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const men = [], women = [], crowns = [];
  for (let i = 0; i < 100; i++) { const row = Math.floor(i / 10), col = i % 10;
    const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a, 0xe0a882][i % 5], hair: [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a, 0x8a5a2a][(i * 7) % 5], top: [0x3a6aa8, 0x3a8a5a, 0x6a6e78, 0x8a5a3a, 0x4a4a6a][(i * 3) % 5], bottom: 0x2a3448, beard: i % 4 === 0 ? 'short' : undefined, seed: 2400 + (i % 12) });
    p.position.set(col * 1.6 - 7.2, 0, row * 1.6 - 7.2); grid.add(p); men.push(p); if (row >= 8) { const c = crownOn(p); crowns.push(c); p.userData.hatExtra = 0.25; }
    if (row < 8 && (i * 37) % 10 < 8) { const w = humanoid({ skin: [0xf0c4a2, 0xe0a882, 0xc89a72, 0xf2cdb0, 0x8a5a3a][(i * 3) % 5], hair: [0x8a4a22, 0x2a1a14, 0xb8925a, 0x5a3820, 0x1a1a1a][(i * 11) % 5], longHair: true, top: [0xd83a6a, 0xe8b830, 0xa83ad8, 0x3ab8a8, 0xe86a3a][(i * 7) % 5], bottom: 0x2a3448, skirt: i % 2 === 0, smile: true, seed: 2420 + (i % 9) });
      w.position.set(col * 1.6 - 7.2 + 0.62, 0, row * 1.6 - 7.2 + 0.1); w.rotation.y = -0.35; w.userData.d = ((i * 53) % 100) / 100; grid.add(w); women.push(w); } }
  grid.userData = { men, women, crowns };
}

// =====================================================================
// SET 5: Heute – Klinik, Werkstatt, Park, Uni-Feier, Hochzeit
// =====================================================================
const city = new THREE.Scene();
{
  skyDome(city, 0x4a7ac8, 0x8ab4e0, 0xcfe2f0, V(-0.5, 0.4, 0.3)); city.fog = new THREE.Fog(0xcfe2f0, 80, 380); clouds(city, 3, 0xffffff, 60, 30, 200, 0.95);
  city.add(box(800, 1, 800, M(T.grass), 0, -0.5, 0, { cast: false }));
  city.add(box(300, 0.06, 6, C(0x3a3a3e), 0, 0.03, 8, { cast: false })); for (let x = -150; x < 150; x += 6) city.add(box(3, 0.02, 0.2, C(0xe8e8e8), x, 0.07, 8, { cast: false }));
  // Klinik
  const kl = new THREE.Group(); kl.position.set(-30, 0, -12); city.add(kl); kl.add(box(16, 10, 8, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xeef0f2, 0.03), 2501)), 0, 5, 0));
  for (let x = -6; x <= 6; x += 2.4) for (const y of [3.2, 6.6]) kl.add(box(1.6, 1.6, 0.1, M(T.windowDark), x, y, 4.02, { cast: false }));
  kl.add(box(3.2, 2.6, 0.12, new THREE.MeshStandardMaterial({ color: 0x9ad0e8, roughness: 0.1, metalness: 0.2 }), 0, 1.3, 4.04, { cast: false })); kl.add(box(16.4, 0.6, 8.4, C(0xc8ccd0), 0, 10.3, 0));
  kl.add(box(1.6, 0.5, 0.2, C(0xd8202a), 0, 9.0, 4.1)); kl.add(box(0.5, 1.6, 0.2, C(0xd8202a), 0, 9.0, 4.1)); city.add(box(10, 0.1, 5, C(0xb8b8b0), -30, 0.05, -5.5, { cast: false }));
  // Werkstatt
  const ws = new THREE.Group(); ws.position.set(0, 0, -10); city.add(ws); ws.add(box(10, 0.15, 7, M(T.planks), 0, 0.075, 0, { cast: false }));
  for (const x of [-4.8, 4.8]) for (const z of [-3.3, 3.3]) ws.add(box(0.3, 3.6, 0.3, C(0x5a3a22), x, 1.8, z)); ws.add(box(10.6, 0.3, 7.6, M(T.planks), 0, 3.75, 0)); ws.add(box(10, 3.6, 0.2, M(T.planks), 0, 1.8, -3.4));
  ws.add(box(2.6, 0.12, 1.0, M(T.planks), 0, 0.95, 3.0)); for (const x of [-1.2, 1.2]) ws.add(box(0.12, 0.9, 0.9, C(0x5a3a22), x, 0.45, 3.0)); ws.add(box(1.8, 0.12, 0.3, C(0xd8b080), 0.2, 1.07, 3.0));
  for (let i = 0; i < 5; i++) ws.add(box(0.16, 2.6, 0.4, C(0xc89a62), -4 + i * 0.25, 1.4, -3.1));
  ws.add(box(0.7, 0.7, 0.7, M(T.planks), 3.6, 0.5, -2.6)); ws.add(box(0.6, 0.6, 0.6, M(T.planks), 3.0, 0.45, -2.8));
  // Park: Bänke, Picknicktisch, Bäume
  const tree = (x, z) => { city.add(box(0.7, 4, 0.7, C(0x5a3a22), x, 2, z)); city.add(box(3.6, 3.0, 3.6, C(0x3f7a32), x, 5.2, z)); city.add(box(2.4, 1.6, 2.4, C(0x4a8a3a), x, 7.2, z)); };
  for (const [x, z] of [[19, -4], [30, -8], [16, -12], [36, -2], [24, -14], [42, -10], [-44, 2], [-52, -6], [-68, -6], [-76, 3], [52, -4], [70, -4]]) tree(x, z);
  const bench = (x, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(2.4, 0.1, 0.55, M(T.planks), 0, 0.5, 0)); g.add(box(2.4, 0.5, 0.08, M(T.planks), 0, 0.85, -0.26)); for (const xx of [-1.0, 1.0]) g.add(box(0.1, 0.5, 0.5, C(0x3a3a3a), xx, 0.25, 0)); city.add(g); };
  bench(25, 0); bench(20, -6);
  city.add(box(2.4, 0.08, 1.0, M(T.planks), 32, 0.8, 2.8)); for (const x of [31, 33]) city.add(box(0.1, 0.8, 0.8, C(0x5a3a22), x, 0.4, 2.8)); city.add(box(2.4, 0.08, 0.4, M(T.planks), 32, 0.48, 2.0));
  for (const [x, c] of [[31.5, 0xd84a2a], [32.5, 0xf0f0f0]]) city.add(box(0.3, 0.06, 0.3, C(c), x, 0.87, 2.8, { cast: false })); city.add(box(0.12, 0.3, 0.12, C(0x3a7a3a), 32, 0.98, 3.0));
  // Uni + Bühne
  const un = new THREE.Group(); un.position.set(60, 0, -16); city.add(un); un.add(box(22, 12, 8, M(tileTex(0xa84a32, 0x6a3a2a, 2510)), 0, 6, 0)); for (let x = -9; x <= 9; x += 3) for (const y of [3.5, 8]) un.add(box(1.6, 2, 0.1, M(T.windowDark), x, y, 4.02, { cast: false }));
  un.add(box(22.6, 0.8, 8.6, C(0x5a5a62), 0, 12.4, 0)); city.add(box(14, 0.6, 3.4, M(T.planks), 60, 0.3, -9.2)); city.add(box(14.2, 0.1, 3.6, C(0x2a3a7a), 60, 0.62, -9.2, { cast: false }));
  // Hochzeitsbogen
  const ar = new THREE.Group(); ar.position.set(-60, 0, 0); city.add(ar); const fm = [0xffffff, 0xf0a0b8, 0xf8d8e0];
  for (const x of [-1.6, 1.6]) for (let y = 0; y < 13; y++) ar.add(box(0.3, 0.3, 0.3, C(y % 3 === 0 ? fm[(y / 3) % 3 | 0] : 0x4a8a3a), x, 0.15 + y * 0.25, 0));
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI; ar.add(box(0.3, 0.3, 0.3, C(i % 2 ? 0x4a8a3a : fm[i % 3]), -Math.cos(a) * 1.6, 3.2 + Math.sin(a) * 0.9, 0)); }
  city.add(box(1.2, 0.02, 8, C(0xe8e0e0), -60, 0.02, 4, { cast: false }));
  for (const side of [-1, 1]) for (let k = 0; k < 3; k++) city.add(box(0.5, 0.45, 0.5, C(0xf0f0f0), -60 + side * (1.6 + k * 0.8), 0.22, 5.2));
  sunLight(city, 0xfff0d8, 3.4, V(-45, 60, 45), V(0, 0, 0), 90); city.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const sara = humanoid(SARA), jonas = humanoid(JONAS); stetho(sara); const plank = inHand(jonas, plankMesh());
  const saraW = humanoid({ ...SARA, top: 0xf8f6f0, bottom: 0xf8f6f0, coat: false, skirt: true, seed: 43 }); veil(saraW); const jonasW = humanoid({ ...JONAS, top: 0x2a2e3a, bottom: 0x2a2e3a, tie: 0xf0f0f0, seed: 44 });
  const oma = humanoid({ skin: 0xf0c8a8, hair: 0xd8d8d8, longHair: false, hairVol: true, top: 0x8a5a7a, bottom: 0x5a4a5a, skirt: true, eye: '#3a3a3a', seed: 45 }), opa = humanoid({ skin: 0xe8b894, hair: 0xcfcfcf, bald: true, beard: 'mustache', beardCol: 0xdddddd, top: 0x5a6a4a, bottom: 0x4a4a42, hat: 'cap', hatCol: 0x6a5a4a, seed: 46 });
  const grads = []; for (let i = 0; i < 10; i++) { const fem = [0, 1, 3, 4, 6, 8].includes(i); const p = humanoid({ skin: [0xf0c4a2, 0xc89a72, 0xe8b894, 0x8a5a3a, 0xe0a882][i % 5], hair: [0x2a1a14, 0x8a4a22, 0xb8925a, 0x1a1a1a, 0x5a3820][(i * 3) % 5], longHair: fem, top: 0x18181c, bottom: 0x18181c, coat: true, shoe: 0x111111, smile: true, seed: 2530 + i }); mortar(p); grads.push(p); city.add(p); }
  const guests = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a][i], hair: [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a][i], top: [0x3a6aa8, 0xa83a6a, 0x3a8a5a, 0xe8b830][i], bottom: 0x2a3448, longHair: i % 2 === 1, smile: true, seed: 2550 + i }); city.add(p); return p; });
  city.add(sara, jonas, saraW, jonasW, oma, opa);
  city.userData = { sara, jonas, saraW, jonasW, oma, opa, grads, guests, plank };
}

// =====================================================================
// SET 6: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901);
  for (let i = 0; i < 4; i++) dusk.add(box(S[i] * 0.9, TH * 1.2, S[i] * 0.9, C(TIER_COL[i]), 22, TH * 1.2 * (i + 0.5), -80));
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
  fit('ESTEVE, 2012', 72, 150, '#a3241c'); fit('BILDUNG FÜR FRAUEN BEENDET', 56, 290, '#3a2a1e'); fit('DAS HEIRATEN NACH OBEN', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 72.88; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1), WHIP1 = wt(1) + 0.57;
const CUTS = [[0, 'hero'], [4, 'india'], [8, 'castes'], [16, 'tiers'], [27, 'priya'], [33, 'parents'], [43, 'higher'], [50, 'rise'], [57, 'nosay'], [63, 'laws'], [68, 'shame'], [74, 'term'],
  [82, 'europe'], [90, 'nochoice'], [100, 'univ'], [110, 'kitchen'], [117, 'office'], [125, 'status'], [133, 'internet'], [140, 'claim'], [151, 'broke'], [157, 'exag'], [164, 'apps'],
  [175, 'sara'], [178, 'jonas'], [181, 'before'], [188, 'together'], [201, 'grads'], [213, 'wedding'], [226, 'values'], [236, 'traits'], [240, 'sign'], [247, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.05, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-9.0 + drift * 2, 15.0 + drift * 1.2, 16.0 + drift * 2), t1 = V(1.0 + drift, 1.5, -9.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const reset = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = india, exp = 1.35; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Indien ----------
  if (['hero', 'loop', 'india', 'castes', 'tiers', 'priya', 'parents', 'higher', 'rise', 'nosay', 'laws', 'shame', 'term'].includes(sh.id)) {
    scene = india; const I = india.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    const { priya, groom, father, mother, priest, candB, candY, pDau, serv, vill } = I;
    reset([priya, groom, father, mother, priest, candB, candY, pDau, serv, ...vill]); I.gPri.visible = I.gGr.visible = false;
    I.tiers.forEach((arr, i) => arr.forEach((p, k) => { p.visible = true; pose2(p, 'idle', ta, i * 4 + k); }));
    const hookPair = () => { put(priya, HX, 0, HZ, 0.5); put(groom, HX2, 0, HZ, -0.5); pose3(priya, 'idle', ta, 0); pose3(groom, 'cross', ta, 1); priya.userData.head.rotation.y = 0.35; groom.userData.head.rotation.y = -0.2;
      put(father, -2.6, 0, -1.4, 0.4); put(mother, -3.4, 0, -1.0, 0.6); pose3(father, 'idle', ta, 2); pose3(mother, 'idle', ta, 3); };
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'india') { hookPair(); heroCam(ta); if (sh.id !== 'india') { tag(priya, 'Priya', HERO); tag(groom, 'Bräutigam', ALLY); } }
    if (sh.id === 'india') { mv(u, V(-44, 24, 40), V(-39, 22, 35), V(PX, 4, -16), V(PX + 2, 4, -17), 46); info(wt(4), 'Indien, vor 2000 Jahren'); }
    if (sh.id === 'castes') { mv(u, V(PX + 13, 11, 22), V(PX + 11, 10, 19), V(PX, 3.6, -16), V(PX, 3.8, -16), 46); }
    if (sh.id === 'tiers') { const k = smoother(u); cam(V(PX + 7, lerp(9.5, 4.6, k), lerp(4.5, 6.0, k)), V(PX + 1.5, lerp(7.2, 1.6, k), lerp(-14.5, -6, k)), 44);
      const W0 = [23, 21, 19, 16]; for (let i = 3; i >= 0; i--) if (t >= wt(W0[i])) { const p = I.tiers[i][2]; tag(p, TIER_NAME[i], [GREY, '#ffd23f', BAD, WHITE][i]); } }
    if (sh.id === 'priya') { put(father, -7, 0, 5.15, 0.15); pose3(father, 'give', t, 1); put(priya, -5.3, 0, 6.5, -0.55); pose3(priya, 'idle', t);
      mv(u, V(-5.5, 1.7, 10.6), V(-5.6, 1.66, 9.9), V(-6.3, 1.35, 5.8), V(-6.3, 1.35, 5.8), 46); tag(priya, 'Priya', HERO); tag(father, 'Vater (Händler)', WHITE); }
    if (sh.id === 'parents') { put(father, 8.2, 0, 4.0, -0.85); put(mother, 9.1, 0, 4.5, -0.85); pose3(father, 'cross', t); pose3(mother, 'idle', t, 2);
      put(candY, 5.4, 0, 3.0, 0.9); pose3(candY, 'idle', t, 1); const go = smoother((t - wt(41)) / 0.9); put(candB, lerp(4.4, 1.6, go), 0, 3.8, go > 0.01 ? -1.6 : 0.9); pose3(candB, go > 0.01 && go < 1 ? 'walk' : 'idle', t, 3);
      if (t >= wt(41)) father.userData.head.rotation.y = Math.sin(t * 9) * 0.35;
      mv(u, V(6.8, 2.0, 10.0), V(6.8, 1.95, 9.3), V(6.8, 1.15, 3.6), V(6.8, 1.15, 3.6), 48); tag(father, 'Vater', WHITE); tag(mother, 'Mutter', WHITE); if (go < 0.5) tag(candB, 'Diener', GREY); tag(candY, 'Händler', '#ffd23f'); }
    if (sh.id === 'higher') { I.tiers.forEach(arr => arr.forEach(p => p.visible = false)); put(priya, PX - 1.7, TH * 2, PZ + S[1] / 2 - 0.7, 0.45); pose3(priya, 'idle', t); priya.userData.head.rotation.x = -0.35; priya.userData.head.rotation.y = 0.4;
      put(groom, PX + 1.8, TH * 3, PZ + S[2] / 2 - 0.7, -0.4); pose3(groom, 'cross', t, 1);
      mv(u, V(PX - 0.2, 4.4, 2.0), V(PX - 0.1, 4.5, 1.0), V(PX, 4.6, -10.0), V(PX, 4.7, -10.0), 46); tag(priya, 'Priya', HERO); tag(groom, 'Krieger', ALLY); }
    if (sh.id === 'rise') { const k = (t - sh.a) / (sh.b - sh.a);
      [[father, 0, 0], [mother, 0.9, -0.45], [priya, 1.8, 0.45]].forEach(([p, dz, dx], j) => { const z = lerp(-0.6, -5.2, k) + dz; put(p, PX + dx, stairY(z), z, Math.PI); pose3(p, 'walk', t, j); p.rotation.y = Math.PI - 0.0; });
      // gehen nach -z, Kamera oben vor ihnen
      [father, mother, priya].forEach(p => p.rotation.y = Math.PI);
      mv(u, V(PX + 1.6, 5.6, -11.0), V(PX + 1.5, 5.4, -10.4), V(PX, 1.8, -3.0), V(PX, 2.2, -4.2), 46); tag(priya, 'Priya', HERO); toast(wt(52), 'Fortschritt erzielt!', 'Familie steigt auf', 'stairs'); }
    if (sh.id === 'nosay') { put(priya, -12, 0, 6.2, 0.15); pose3(priya, 'sadidle', t); priya.userData.setFace({ sad: true });
      put(father, -13.6, 0, 5.4, 0.5); put(mother, -10.6, 0, 5.2, -0.5); pose3(father, 'idle', t, 1); pose3(mother, 'idle', t, 2);
      mv(u, V(-11.6, 1.78, 9.4), V(-11.7, 1.74, 8.6), V(-12, 1.55, 6.0), V(-12, 1.6, 6.0), 46); tag(priya, 'Priya', HERO); chat(wt(60), gray('Priya wurde nicht gefragt')); }
    if (sh.id === 'laws') { put(priest, PX + 1.8, TH * 4, PZ + 2.6, 0); pose(priest, 'write', t);
      mv(u, V(PX + 3.4, 8.3, PZ + 7.6), V(PX + 3.1, 8.2, PZ + 7.0), V(PX + 1.8, 7.2, PZ + 2.8), V(PX + 1.8, 7.2, PZ + 2.8), 46); tag(priest, 'Priester', WHITE);
      tip(wt(64), 'book', 'Gesetzbuch des Manu', '#ffaa00', [gray('Frau heiratet nach oben:'), green('erlaubt')]); }
    if (sh.id === 'shame') { put(pDau, 13.6, 0, 8.4, 0.15); put(serv, 14.6, 0, 8.4, -0.15); pose3(pDau, 'sadidle', t); pose3(serv, 'sadidle', t, 1); pDau.userData.setFace({ sad: true }); serv.userData.setFace({ sad: true });
      pDau.userData.armR.rotation.z = 0.25; serv.userData.armL.rotation.z = -0.25;
      vill.forEach((p, i) => { put(p, [11.4, 16.9, 12.4][i], 0, [10.2, 10.0, 11.2][i], [1.0, -1.0, 0.9][i]); pose3(p, 'point', t, i); p.userData.setFace({ angry: true }); });
      mv(u, V(14.1, 2.0, 14.6), V(14.1, 1.95, 13.9), V(14.1, 1.2, 8.6), V(14.1, 1.2, 8.6), 48); tag(pDau, 'Priestertochter', WHITE); tag(serv, 'Diener', GREY); say(wt(72), 'Dorf', BAD, 'Schande!'); }
    if (sh.id === 'term') { put(priya, 9.35, 0.3, -1, 0.65); put(groom, 10.65, 0.3, -1, -0.65); pose3(priya, 'idle', t); pose3(groom, 'idle', t, 1); I.gPri.visible = I.gGr.visible = true;
      put(father, 7.0, 0, 1.4, 0.6); put(mother, 13.0, 0, 1.4, -0.6); pose3(father, 'clap', t); pose3(mother, 'clap', t, 2);
      mv(u, V(10, 2.0, 6.6), V(10, 1.95, 5.8), V(10, 1.45, -1), V(10, 1.45, -1), 46); tag(priya, 'Priya', HERO); tag(groom, 'Krieger', ALLY);
      tip(wt(78), 'up', 'Hypergamie', '#ffff55', [gray('griech. hyper = über, gamos = Ehe'), gray('Heiraten nach oben')]); }
  }
  // ---------- Europa ----------
  if (['europe', 'nochoice', 'univ', 'status'].includes(sh.id)) {
    scene = europe; const E = europe.userData; reset([E.bride, E.groomE, E.anna, E.suitor, E.papa, E.rich, E.wife, ...E.guests, ...E.students]); E.ring.visible = E.books.visible = false;
    if (sh.id === 'europe') { const z = -9.6 + (t - sh.a) * 0.9; put(E.bride, -0.45, 0, z, 0); put(E.groomE, 0.45, 0, z, 0); pose3(E.bride, 'walk', t); pose3(E.groomE, 'walk', t, 1);
      E.guests.forEach((p, i) => { put(p, [-3, -2.2, 2.4, 3.2][i], 0, [-5.5, -4.2, -4.6, -5.8][i], [0.9, 0.7, -0.7, -0.9][i]); pose3(p, 'clap', t, i); });
      mv(u, V(9, 6.5, 14), V(7.8, 6, 12.6), V(0, 2.6, -8), V(0, 2.6, -8), 46); info(wt(84), 'Europa, über Jahrhunderte'); }
    if (sh.id === 'nochoice') { put(E.anna, -4.0, 0, 0, 0.55); pose3(E.anna, 'sadidle', t); put(E.suitor, -2.7, 0, 0.6, -1.1); pose3(E.suitor, 'kneel', t); E.ring.visible = true; put(E.papa, -4.9, 0, -1.2, 0.5); pose3(E.papa, 'cross', t, 1); E.papa.userData.head.rotation.x = Math.max(0, Math.sin(t * 6)) * 0.25;
      mv(u, V(-2.6, 1.9, 5.2), V(-2.8, 1.85, 4.4), V(-3.5, 1.2, 0), V(-3.5, 1.2, 0), 46); tag(E.anna, 'Tochter', HERO); tag(E.suitor, 'Bewerber', WHITE, -0.3); tag(E.papa, 'Vater', WHITE); chat(wt(96), gray('Andere Möglichkeiten: keine')); }
    if (sh.id === 'univ') { put(E.anna, 36.4, 0, -4.4, Math.PI + 0.15); pose3(E.anna, 'sadidle', t); E.books.visible = true; E.anna.userData.armR.rotation.x = -0.9;
      E.students.forEach((p, i) => { put(p, [33.0, 34.0, 39.4][i], 0, [-11.0, -11.6, -10.8][i], [0.4, 0.2, -0.5][i]); pose3(p, 'laugh', t, i); });
      mv(u, V(35.4, 1.75, -10.6), V(35.6, 1.72, -10.1), V(36.4, 1.45, -4.4), V(36.4, 1.45, -4.4), 48); tag(E.anna, 'Anna', HERO); info(wt(101), 'Studium für Frauen: verboten'); eff(wt(107), 'Eigenes Geld', '0', BAD); }
    if (sh.id === 'status') { put(E.rich, -34.6, 0, -5.4, 0.25); put(E.wife, -33.6, 0, -5.2, -0.2); pose3(E.rich, 'cross', t); pose3(E.wife, 'idle', t, 1); E.wife.userData.armR.rotation.z = 0.0;
      mv(u, V(-33.6, 2.0, -0.4), V(-33.8, 1.95, -1.1), V(-34.4, 1.3, -5.6), V(-34.4, 1.3, -5.6), 46); tag(E.rich, 'Ehemann', WHITE, 0.0); tag(E.wife, 'Ehefrau', HERO);
      tip(wt(127), 'shield', 'Ehemann mit Status', '#ffd23f', [gray('Geld · Haus · Ansehen'), green('= ihre einzige Sicherheit')]); }
  }
  // ---------- 70er-Küche ----------
  if (sh.id === 'kitchen' || sh.id === 'office') {
    scene = kitchen; exp = 1.4; const K = kitchen.userData; const { frau, mann } = K;
    if (sh.id === 'kitchen') { put(frau, -0.3, 0, -2.5, -0.55); pose(frau, 'work', t); put(mann, 1.5, 0, 0.1, -0.25); pose3(mann, 'idle', t); sitPose(mann, 0.5); mann.position.z = -0.25; mann.userData.armR.rotation.x = -1.2; mann.userData.armL.rotation.x = -1.2; K.paper.visible = true;
      mann.position.set(1.9, mann.position.y, 0.0); mann.rotation.y = -0.35;
      mv(u, V(0.9, 2.1, 5.6), V(0.8, 2.05, 5.0), V(0.7, 1.05, -1.2), V(0.7, 1.05, -1.2), 52); tag(frau, 'Ehefrau', HERO); tag(mann, 'Ehemann', WHITE); info(wt(111), 'Deutschland, bis 1977'); }
    if (sh.id === 'office') { put(frau, 2.6, 0, -2.85, 0); pose2(frau, 'type', t); sitPose(frau, 0.5); K.paper.visible = false; put(mann, 1.0, 0, -1.3, 1.0); pose3(mann, 'point', t); mann.userData.setFace({ angry: true });
      mv(u, V(1.1, 1.85, 3.6), V(1.2, 1.8, 3.0), V(1.9, 1.2, -2.0), V(1.9, 1.2, -2.0), 50); tag(frau, 'Ehefrau', HERO); tag(mann, 'Ehemann', WHITE);
      tip(wt(119), 'book', 'Gesetz bis 1977', '#ffaa00', [gray('Arbeiten nur, soweit es mit'), gray('Ehe und Familie vereinbar ist')]); }
    else mann.userData.setFace({});
  }
  // ---------- Internet ----------
  if (['internet', 'broke', 'apps'].includes(sh.id)) {
    scene = net; exp = 1.6; const N = net.userData; const { user } = N; user.userData.setFace({}); N.uphone.visible = false; N.cards.forEach(c => c.visible = false); N.phoneG.intensity = 0;
    N.glow.intensity = 6 + Math.sin(t * 23) * 0.4;
    if (sh.id === 'internet' || sh.id === 'broke') { put(user, 0.0, 0, -2.55, 0.35); pose2(user, 'type', t); sitPose(user, 0.54); }
    if (sh.id === 'internet') { mv(u, V(2.6, 2.3, 2.6), V(2.3, 2.2, 2.1), V(0, 1.1, -2.2), V(0, 1.1, -2.2), 48); tag(user, 'Anonym', BAD); info(wt(133), 'Heute'); }
    if (sh.id === 'broke') { user.userData.setFace({ sad: true }); mv(u, V(-0.9, 1.65, -0.6), V(-0.8, 1.6, -1.0), V(0.05, 1.4, -2.55), V(0.05, 1.4, -2.55), 46); tag(user, 'Anonym', BAD);
      say(wt(141), 'Anonym', BAD, 'Frauen wollen nur die Top 20 %'); say(wt(151), 'Anonym', BAD, 'Ohne Geld bist du chancenlos'); eff(wt(156), 'Chancenlos', '∞', BAD); }
    if (sh.id === 'apps') { put(user, -2.4, 0.55, -1.0, 0.55); pose3(user, 'phone', t); sitPose(user, 0.6); N.uphone.visible = true; N.phoneG.intensity = 2.5; N.phoneG.position.set(-2.1, 1.3, -0.6);
      const sw = (t - sh.a) * 1.6; N.cards.forEach((c, i) => { const ph = sw - i; if (ph < 0 || ph > 1.2) return; c.visible = true; const dir = i % 2 ? 1 : -1; c.position.set(-1.25 + dir * smoother(ph / 1.2) * 1.2, 1.25 + ph * 0.08, -0.2); c.rotation.set(0, 0.5, dir * smoother(ph / 1.2) * 0.5); c.material.opacity = 1 - clamp01((ph - 0.8) / 0.4); });
      mv(u, V(-0.4, 1.9, 2.8), V(-0.6, 1.85, 2.2), V(-2.0, 1.4, -0.9), V(-2.0, 1.4, -0.9), 46); tag(user, 'Anonym', BAD);
      tip(wt(169), 'phone', 'Dating-Apps', '#55ffff', [gray('Gezählt: Fotos und Swipes'), red('Nicht gezählt: echte Beziehungen')]); }
  }
  if (sh.id === 'claim' || sh.id === 'exag') {
    scene = grid; const G = grid.userData; G.men.forEach((p, i) => { pose2(p, 'idle', t, i); p.userData.setFace(sh.id === 'claim' && i < 80 && t >= wt(146) ? { sad: true } : {}); });
    G.crowns.forEach(c => c.visible = sh.id === 'claim' ? t >= wt(146) : true);
    G.women.forEach((w, i) => { const t0 = wt(159) + w.userData.d * 0.9; w.visible = sh.id === 'exag' && t >= t0; if (w.visible) { pose3(w, 'idle', t, i); w.position.y = Math.max(0, 1 - (t - t0) / 0.25) * 0.4; } });
    if (sh.id === 'claim') { mv(u, V(0, 15, 17), V(0, 13.6, 15.2), V(0, 0, 0.6), V(0, 0, 1.0), 46); say(wt(141), 'Anonym', BAD, 'Frauen wollen nur die Top 20 %');
      if (t >= wt(146)) { ui.tags.push([V(0, 3.0, 8.0), 'Top 20 %', HERO]); ui.tags.push([V(0, 2.6, -2.4), 'Rest: 80 %', GREY]); } }
    if (sh.id === 'exag') { mv(u, V(-10, 6.5, 13), V(-9, 6.0, 11.6), V(0, 0.6, 0), V(0, 0.6, 0), 46); tip(wt(162), 'x', '„80/20-Regel“', BAD, [gray('Stark übertrieben:'), gray('Die meisten finden eine Beziehung')]); }
  }
  // ---------- Heute ----------
  if (['sara', 'jonas', 'before', 'together', 'grads', 'wedding', 'values', 'traits'].includes(sh.id)) {
    scene = city; const Cy = city.userData; reset([Cy.sara, Cy.jonas, Cy.saraW, Cy.jonasW, Cy.oma, Cy.opa, ...Cy.grads, ...Cy.guests]); Cy.plank.visible = false;
    if (sh.id === 'sara') { put(Cy.sara, -30, 0, -6.2, 0.1); pose3(Cy.sara, 'idle', t); mv(u, V(-29.3, 1.72, -1.6), V(-29.4, 1.7, -2.3), V(-30, 1.45, -6.2), V(-30, 1.45, -6.2), 46); tag(Cy.sara, 'Sara (Ärztin)', HERO); }
    if (sh.id === 'jonas') { put(Cy.jonas, 0.2, 0.15, -7.7, 0); pose(Cy.jonas, 'work', t); Cy.plank.visible = false; mv(u, V(1.0, 2.0, -3.4), V(0.85, 1.95, -3.9), V(0.1, 1.2, -7.3), V(0.1, 1.2, -7.3), 46); tag(Cy.jonas, 'Jonas (Tischler)', ALLY); }
    if (sh.id === 'before') { put(Cy.oma, 24.4, 0, 0.05, 0.1); put(Cy.opa, 25.6, 0, 0.05, -0.1); [Cy.oma, Cy.opa].forEach((p, i) => { pose3(p, 'cross', t, i); sitPose(p, 0.55); p.userData.head.rotation.y = Math.sin(t * 7 + i) * 0.3; p.userData.setFace({ angry: true }); });
      mv(u, V(25.2, 1.45, 4.0), V(25.15, 1.42, 3.4), V(25, 1.05, 0), V(25, 1.05, 0), 46); tag(Cy.oma, 'Oma', GREY); tag(Cy.opa, 'Opa', GREY); say(wt(185), 'Oma', GREY, 'Das passt doch nicht!'); }
    if (sh.id === 'together') { put(Cy.sara, 31.4, 0, 2.0, 0.15); put(Cy.jonas, 32.6, 0, 2.0, -0.15); [Cy.sara, Cy.jonas].forEach((p, i) => { pose3(p, 'laugh', t, i); sitPose(p, 0.52); p.userData.armL.rotation.x = p.userData.armR.rotation.x = -1.2; });
      mv(u, V(32.0, 1.7, 7.0), V(32.0, 1.65, 6.2), V(32, 1.05, 2.2), V(32, 1.05, 2.2), 46); tag(Cy.sara, 'Sara', HERO); tag(Cy.jonas, 'Jonas', ALLY); eff(wt(194), 'Sara verdient mehr', 'egal', HERO); }
    if (sh.id === 'grads') { Cy.grads.forEach((p, i) => { put(p, 55.5 + i * 1.0, 0.62, -9.2, (4.5 - i) * 0.04); pose3(p, t >= wt(211) ? 'clap' : 'idle', t, i); });
      mv(u, V(60, 3.0, 4.5), V(60, 2.9, 3.2), V(60, 2.1, -9.2), V(60, 2.1, -9.2), 46); info(wt(205), 'Mehr Frauen als Männer mit Uni-Abschluss'); }
    if (sh.id === 'wedding') { put(Cy.saraW, -60.55, 0, 0.3, 0.45); put(Cy.jonasW, -59.45, 0, 0.3, -0.45); pose3(Cy.saraW, 'laugh', t); pose3(Cy.jonasW, 'laugh', t, 1);
      Cy.guests.forEach((p, i) => { put(p, [-63.2, -62.4, -57.6, -56.8][i], 0, 4.4 + (i % 2) * 0.8, [0.4, 0.3, -0.3, -0.4][i] + Math.PI * 0); pose3(p, 'clap', t, i); p.rotation.y = Math.PI + [0.4, 0.3, -0.3, -0.4][i]; });
      Cy.guests.forEach(p => p.visible = false);
      mv(u, V(-60, 1.8, 5.2), V(-60, 1.75, 4.4), V(-60, 1.5, 0.3), V(-60, 1.5, 0.3), 46); tag(Cy.saraW, 'Sara', HERO); tag(Cy.jonasW, 'Jonas', ALLY);
      tip(wt(224), 'down', 'Hypogamie', '#55ffff', [gray('griech. hypo = unter'), gray('Sie heiratet z. B. weniger Bildung')]); }
    if (sh.id === 'values' || sh.id === 'traits') { put(Cy.sara, 19.45, 0, -5.95, 0.3); put(Cy.jonas, 20.55, 0, -5.95, -0.3); [Cy.sara, Cy.jonas].forEach((p, i) => { pose3(p, 'laugh', t, i); sitPose(p, 0.55); });
      Cy.sara.userData.armR.rotation.x = -0.6; Cy.sara.userData.armR.rotation.z = 0.5; Cy.jonas.userData.armL.rotation.x = -0.6; Cy.jonas.userData.armL.rotation.z = -0.5;
      if (sh.id === 'values') mv(u, V(22.6, 2.2, 0.4), V(22.0, 2.05, -0.6), V(20, 1.0, -6), V(20, 1.0, -6), 46);
      else { mv(u, V(20, 1.7, -1.4), V(20, 1.65, -2.0), V(20, 1.2, -6), V(20, 1.2, -6), 46);
        tip(wt(236), 'heart', 'Was wirklich zählt', '#55ff55', [gray('· Freundlichkeit'), t >= wt(237) ? gray('· Vertrauen') : '', t >= wt(238) ? gray('· gemeinsame Werte') : ''].filter(Boolean)); }
      tag(Cy.sara, 'Sara', HERO); tag(Cy.jonas, 'Jonas', ALLY); }
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
  if (cur) { let txt = cur[0]; const NUM = { 'zweitausend': '2000', 'zweitausend,': '2000,', 'neunzehnhundertsiebenundsiebzig': '1977', 'zwanzig': '20' }; if (NUM[txt]) txt = NUM[txt];
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
