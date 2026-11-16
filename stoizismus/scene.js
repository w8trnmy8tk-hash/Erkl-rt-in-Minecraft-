// „Stoizismus, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
// Stoizismus – Posen, Requisiten, Figuren
// =====================================================================
function act(ch, kind, t, ph = 0) {
  const P = ch.userData;
  if (['idle', 'walk', 'work', 'fist', 'cheer', 'write', 'sad', 'count', 'shake', 'hammer'].includes(kind)) return pose(ch, kind, t, ph);
  if (['curl', 'type', 'jog', 'raise', 'laugh', 'snip', 'sadidle', 'cream'].includes(kind)) return pose2(ch, kind, t, ph);
  if (['cross', 'clap', 'selfie', 'phone', 'pose', 'kneel', 'give', 'angry', 'turned', 'lookdown', 'point'].includes(kind)) return pose3(ch, kind, t, ph);
  pose(ch, 'idle', t, ph); const sw = Math.sin(t * 1.7 + ph) * 0.05;
  if (kind === 'read') { P.armR.rotation.x = P.armL.rotation.x = -1.15; P.armR.rotation.z = 0.12; P.armL.rotation.z = -0.12; P.head.rotation.x = 0.35; }
  if (kind === 'think') { P.armR.rotation.x = -1.15; P.armL.rotation.x = -0.15; P.head.rotation.x = -0.18; P.head.rotation.y = 0.15 + sw; }
  if (kind === 'teach') { P.armR.rotation.x = -1.45 + Math.sin(t * 2.2 + ph) * 0.22; P.armR.rotation.z = 0.2; P.armL.rotation.x = -0.3; }
  if (kind === 'finger') { P.armR.rotation.x = -2.55; P.armR.rotation.z = 0.12; P.armL.rotation.x = sw; }
  if (kind === 'hold') { P.armR.rotation.x = -1.3; P.armL.rotation.x = sw; P.head.rotation.x = 0.12; }
  if (kind === 'calm') { P.armL.rotation.x = P.armR.rotation.x = 0.3; P.head.rotation.x = -0.05; }
  if (kind === 'cane') { P.armL.rotation.x = -0.55; P.armR.rotation.x = -1.3 + Math.sin(t * 2 + ph) * 0.2; P.armR.rotation.z = 0.15; }
  if (kind === 'cling') { P.armL.rotation.x = P.armR.rotation.x = -1.6; P.armL.rotation.z = -0.2; P.armR.rotation.z = 0.2; P.head.rotation.x = -0.25; }
  if (kind === 'grab') { P.armL.rotation.x = P.armR.rotation.x = -0.95; P.head.rotation.x = 0.45; }
  if (kind === 'shock') { P.armL.rotation.x = P.armR.rotation.x = -0.6; P.armL.rotation.z = -0.4; P.armR.rotation.z = 0.4; P.head.rotation.x = -0.1; }
  if (kind === 'fistshake') { P.armR.rotation.x = -2.6 + Math.sin(t * 14) * 0.25; P.armL.rotation.x = -0.6 + Math.sin(t * 14 + 1) * 0.2; P.armL.rotation.z = -0.3; }
}
const attach = (ch, arm, mesh, y = -0.7) => { const g = new THREE.Group(); g.position.set(0, y, 0.05); g.add(mesh); ch.userData[arm].add(g); return g; };
const paperM = C(0xeee4c8), rodM = C(0x7a5233);
const scrollMesh = () => { const g = new THREE.Group(); g.add(box(0.44, 0.09, 0.09, paperM, 0, 0, 0.08)); g.add(box(0.06, 0.13, 0.13, rodM, -0.25, 0, 0.08)); g.add(box(0.06, 0.13, 0.13, rodM, 0.25, 0, 0.08)); return g; };
const blockMesh = () => box(0.22, 0.22, 0.22, C(0x8a8a86), 0, -0.05, 0.12);
const caneMesh = () => box(0.06, 1.0, 0.06, C(0x5a3a22), 0, -0.3, 0.12);
const shieldMesh = () => box(0.08, 0.8, 0.55, C(0xa82a1e), -0.14, 0.15, 0.0);
const notesMesh = () => box(0.28, 0.02, 0.36, C(0xf4f4f0), 0, -0.02, 0.12);
const T2 = {
  water: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x3a7aa8, 0.08); for (let i = 0; i < 10; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x8ac0e0); }, 2001),
  pave: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const e = x % 8 === 0 || y % 8 === 0; px(c, x, y, shade(e ? 0xa89c84 : 0xd6cab0, 0.9 + r() * 0.18)); } }, 2002),
  marble: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xeeeae0, 0.04); for (let i = 0; i < 6; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0xc8c4ba); }, 2003),
  mural: tex(32, 32, (c, r) => { noiseFill(c, r, 32, 32, 0xc8a070, 0.06); c.fillStyle = '#2a5a8a'; c.fillRect(0, 0, 32, 5); c.fillStyle = '#e8d8a0'; for (let x = 0; x < 32; x += 4) c.fillRect(x, 1, 2, 2);
    c.fillStyle = '#8a2a1e'; c.fillRect(0, 26, 32, 6); c.fillStyle = '#2a1a10'; c.fillRect(0, 25, 32, 1);
    const fig = (x, col, sh) => { c.fillStyle = '#d89a6a'; c.fillRect(x + 1, 9, 3, 3); c.fillStyle = col; c.fillRect(x, 12, 5, 6); c.fillStyle = '#5a3a22'; c.fillRect(x + 1, 18, 1, 6); c.fillRect(x + 3, 18, 1, 6); if (sh) { c.fillStyle = '#d8b030'; c.fillRect(x + 5, 12, 3, 4); } };
    fig(2, '#2a6a4a', 1); fig(12, '#a83a2a', 0); fig(22, '#3a4a9a', 1); c.fillStyle = '#6a4a2a'; c.fillRect(9, 15, 1, 9); c.fillRect(19, 13, 1, 11); }, 2004),
  wallRed: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x9a2a1e, 0.05); for (let x = 0; x < 16; x++) { px(c, x, 11, 0xd8a838); px(c, x, 12, 0x1a1a1a); } for (let y = 13; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(0x2a2420, 0.9 + r() * 0.2)); }, 2005),
  mosaic: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const b = (x === 0 || y === 0) ? 0x3a3a3a : ((x + y) % 6 === 0 ? 0x9a3a2a : 0xe8dcc0); px(c, x, y, shade(b, 0.92 + r() * 0.14)); } }, 2006),
  ochre: solidTex(0xd8a868, 0.08, 2007), tent: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x8a2a22, 0.08); for (let y = 0; y < 16; y += 5) for (let x = 0; x < 16; x++) px(c, x, y, 0x6a1e18); }, 2008),
  tentPlain: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xa89a78, 0.08); for (let y = 0; y < 16; y += 5) for (let x = 0; x < 16; x++) px(c, x, y, 0x7a6a50); }, 2009),
  gravel: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x6a645c, 0.25), 2010), asphalt: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x38383c, 0.12), 2011),
  tiles: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(x % 8 === 0 || y % 8 === 0 ? 0x9a9a94 : 0xc8c6be, 0.94 + r() * 0.1)); }, 2012),
  purple: solidTex(0x5a1a6a, 0.08, 2013),
};
const ZENON = { skin: 0xc89a72, hair: 0x2a1a14, beard: 'full', top: 0x7a3a8a, bottom: 0x6a2e78, belt: 0xd8b040, shoe: 0x6a4a2a, eye: '#3a2a1a', seed: 31 };
const KRATES = { skin: 0xd8a882, hair: 0xb8b4ac, bald: true, beard: 'full', beardCol: 0xc8c4bc, top: 0x7a6a50, bottom: 0x6a5a44, shoe: 0x4a3a2a, eye: '#3a2a1a', smile: true, seed: 32 };
const EPIKTET = { skin: 0xd8a882, hair: 0x3a2a1a, beard: 'short', top: 0x8a7a5e, bottom: 0x7a6a50, belt: 0x4a3a2a, shoe: 0x4a3420, eye: '#3a2a1a', seed: 33 };
const MASTER = { skin: 0xf0c8a4, hair: 0x5a4a3a, top: 0xeeeae0, bottom: 0xeeeae0, belt: 0x6a1a6a, shoe: 0x8a5a2a, eye: '#3a2a1a', angry: true, seed: 34 };
const MARK = { skin: 0xf0c8a4, hair: 0x8a6a3a, hairVol: true, beard: 'full', top: 0x5a1a6a, bottom: 0xeeeae0, belt: 0xd8b040, shoe: 0x8a5a2a, eye: '#4a5a6a', seed: 35 };
const TOM = { skin: 0xf0c4a2, hair: 0x6a4422, hairVol: true, top: 0x3a6aa8, bottom: 0x2a3448, shoe: 0xe8e8e8, eye: '#3a5a7a', seed: 36 };
const GREEKS = [0, 1, 2, 3, 4, 5].map(i => ({ skin: [0xd8a882, 0xc89a72, 0xf0c4a2, 0xb88a62, 0xe0b090, 0xd0a07a][i], hair: [0x2a1a14, 0x5a3a22, 0x1a1a1a, 0x8a6a4a, 0x3a2a1a, 0x6a4a2a][i], beard: i % 2 ? 'short' : undefined,
  top: [0xe8e2d2, 0x9ab8d0, 0xd8c8a0, 0xb8d0a8, 0xe8d0c0, 0xc8c0d8][i], bottom: [0xd8d2c2, 0x8aa8c0, 0xc8b890, 0xa8c098, 0xd8c0b0, 0xb8b0c8][i], longHair: i === 2 || i === 5, shoe: 0x6a4a2a, seed: 40 + i }));
function addActors(scene, list) { scene.userData.actors = list; list.forEach(a => scene.add(a)); }
function resetActors(scene) { (scene.userData.actors || []).forEach(a => { a.visible = false; a.rotation.set(0, 0, 0); a.scale.setScalar(a.userData.s); a.userData.setFace({}); }); }
function put(ch, x, y, z, ry = 0) { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; return ch; }
function focusSun(scene, x, z) { const S = scene.userData.sun, o = scene.userData.sunOff; S.target.position.set(x, 0, z); S.position.set(x + o.x, o.y, z + o.z); S.target.updateMatrixWorld(); }
function rainGroup(scene) { const g = new THREE.Group(), r = rng(77), m = new THREE.MeshBasicMaterial({ color: 0xa8c0e0, transparent: true, opacity: 0.55, fog: false });
  for (let i = 0; i < 420; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.45, 0.025), m); b.userData = { x: (r() - 0.5) * 16, y: r() * 12, z: (r() - 0.5) * 16 }; g.add(b); }
  g.userData.update = t => g.children.forEach(b => { const u = b.userData; b.position.set(u.x, ((u.y - t * 14) % 12 + 12) % 12, u.z); }); scene.add(g); g.visible = false; return g; }

// =====================================================================
// SET 1: Athen – Agora, Stoa Poikile, Buchladen, Strand, Hafen
// =====================================================================
const athens = new THREE.Scene();
{
  const sky = skyDome(athens, 0x3a78d0, 0x86b8e8, 0xe8e0c8, V(-0.4, 0.5, 0.5)); athens.fog = new THREE.Fog(0xe2dcc8, 90, 420); clouds(athens, 5, 0xffffff, 70, 22, 220, 0.9);
  const grassM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x8a9a52, 0.14), 2101)); athens.add(box(800, 1, 800, grassM, 0, -0.5, 0, { cast: false }));
  athens.add(box(64, 0.04, 34, M(T2.pave), 0, 0, 1, { cast: false }));
  const marble = M(T2.marble), mural = M(T2.mural);
  // Stoa: Plattform (Oberkante 0.75), Säulen vorne bei z=-3.8, bemalte Rückwand bei z=-9
  for (let s = 0; s < 3; s++) athens.add(box(30.4 - s * 0.6, 0.25, 7.4 - s * 0.5, marble, 0, 0.125 + s * 0.25, -6.3 + s * 0.25));
  for (let x = -13; x <= 13.01; x += 2) { athens.add(box(0.55, 4.2, 0.55, marble, x, 2.85, -3.8)); athens.add(box(0.75, 0.2, 0.75, marble, x, 4.85, -3.8)); }
  athens.add(box(28.6, 0.7, 0.9, marble, 0, 5.3, -3.8)); athens.add(box(28.6, 0.25, 0.95, C(0x2a5a8a), 0, 5.0, -3.8, { cast: false }));
  athens.add(box(29.0, 0.4, 6.0, marble, 0, 5.75, -6.4)); athens.add(box(29.4, 0.5, 6.6, M(T.roofRed), 0, 6.15, -6.4)); athens.add(box(29.4, 0.5, 3.4, M(T.roofRed), 0, 6.65, -6.6));
  athens.add(box(28.6, 4.9, 0.4, mural, 0, 3.2, -9.0, { uvScale: 1 / 4.9 })); for (const x of [-14.2, 14.2]) athens.add(box(0.4, 4.9, 5.6, marble, x, 3.2, -6.4));
  for (const x of [-9, -3, 3, 9]) athens.add(box(1.6, 0.45, 0.6, marble, x, 0.97, -8.2)); // Steinbänke
  // Häuser
  const r = rng(2102); const house = (x, z, w, d, h) => { athens.add(box(w, h, d, C(0xe8e0cc), x, h / 2, z)); athens.add(box(w + 0.4, 0.5, d + 0.4, M(T.roofRed), x, h + 0.25, z)); athens.add(box(w * 0.7, 0.5, d * 0.6, M(T.roofRed), x, h + 0.75, z));
    athens.add(box(0.9, 1.6, 0.1, C(0x5a3a22), x, 0.8, z + d / 2 + 0.02, { cast: false })); };
  for (let i = 0; i < 90; i++) { const x = -90 + r() * 125, z = -80 + r() * 140; if (Math.abs(x) < 34 && z > -18 && z < 20) continue; if (x > 30 && z > -20) continue; house(x, z, 4 + r() * 4, 4 + r() * 4, 3 + r() * 2.5); }
  // Akropolis
  athens.add(box(46, 14, 30, C(0xa89c80), -34, 7, -110)); athens.add(box(36, 4, 22, C(0xb8ac90), -34, 16, -110));
  const tp = new THREE.Group(); tp.position.set(-34, 18, -110); athens.add(tp);
  for (let s = 0; s < 2; s++) tp.add(box(22 - s, 0.6, 11 - s, marble, 0, 0.3 + s * 0.6, 0)); for (let x = -9.5; x <= 9.5; x += 1.9) for (const z of [-4.3, 4.3]) tp.add(box(0.9, 7, 0.9, marble, x, 4.7, z));
  tp.add(box(21, 1, 10.4, marble, 0, 8.7, 0)); for (let s = 0; s < 3; s++) tp.add(box(21 - s * 5, 0.7, 10.6, marble, 0, 9.5 + s * 0.7, 0));
  for (let i = 0; i < 20; i++) { const x = -120 + r() * 200, z = -150 - r() * 60, h = 8 + r() * 18; athens.add(box(30 + r() * 20, h, 20, grassM, x, h / 2, z, { cast: false })); }
  // Strand + Meer (x > 40)
  athens.add(box(10, 0.1, 400, M(T.sand), 41, 0.03, 0, { cast: false })); const waterM = M(T2.water, { rough: 0.15 });
  athens.add(box(600, 0.2, 800, waterM, 346, 0.0, 0, { cast: false }));
  const boat = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(5, 0.9, 1.6, M(T.planks), 0, 0.2, 0)); g.add(box(0.15, 4, 0.15, C(0x5a3a22), 0, 2.4, 0)); g.add(box(0.06, 2.4, 2.4, C(0xe8e0cc), 0.15, 2.9, 0)); athens.add(g); };
  boat(70, -10, 0.3); boat(84, 14, -0.4); boat(96, -30, 0.1);
  const debris = []; for (let i = 0; i < 7; i++) { const d = i < 4 ? box(1.4, 0.12, 0.35, M(T.planks), 0, 0, 0) : box(0.6, 0.6, 0.6, C(0x6a2e78), 0, 0, 0); d.userData = { x: 47.5 + (i * 1.7) % 7, z: 4 + (i * 2.3) % 10, p: i }; athens.add(d); debris.push(d); }
  // Buchladen (x 22, z 4..7)
  const bx = 22, bz = 4.2; athens.add(box(4.2, 3.0, 0.2, M(T.planks), bx, 1.5, bz)); for (const x of [bx - 2.1, bx + 2.1]) athens.add(box(0.2, 3.0, 2.6, M(T.planks), x, 1.5, bz + 1.3));
  for (const y of [0.9, 1.6, 2.3]) { athens.add(box(3.8, 0.08, 0.5, M(T.darkwood), bx, y, bz + 0.35)); for (let i = 0; i < 9; i++) athens.add(box(0.14, 0.14, 0.42, i % 3 ? paperM : C(0xd8c8a0), bx - 1.7 + i * 0.42, y + 0.11, bz + 0.37, { cast: false })); }
  athens.add(box(4.6, 0.12, 3.2, M(T.redCloth), bx, 3.06, bz + 1.5)); athens.add(box(1.6, 0.9, 0.6, M(T.darkwood), bx + 1.1, 0.45, bz + 1.9));
  for (let i = 0; i < 4; i++) athens.add(box(0.12, 0.12, 0.44, paperM, bx + 0.6 + i * 0.3, 0.97, bz + 1.9, { cast: false }));
  // Licht
  const sun = sunLight(athens, 0xfff0d0, 3.4, V(-40, 60, 40), V(0, 0, 0), 26); const hemi = new THREE.HemisphereLight(0xd8e8ff, 0x8a7a5a, 1.4); athens.add(hemi);
  // Figuren
  const zenon = humanoid(ZENON), krates = humanoid(KRATES), keeper = humanoid({ ...GREEKS[3], seed: 50 }); const students = GREEKS.map(g => humanoid(g)); const gossip = [humanoid({ ...GREEKS[1], seed: 51 }), humanoid({ ...GREEKS[2], seed: 52 })];
  const zScroll = attach(zenon, 'armR', scrollMesh()), zBlock = attach(zenon, 'armR', blockMesh());
  addActors(athens, [zenon, krates, keeper, ...students, ...gossip]);
  const rain = rainGroup(athens);
  Object.assign(athens.userData, { sky, sun, hemi, sunOff: V(-40, 60, 40), zenon, krates, keeper, students, gossip, zScroll, zBlock, debris, rain });
}

// =====================================================================
// SET 2: Meer im Sturm (Schiffbruch)
// =====================================================================
const sea = new THREE.Scene();
{
  sea.userData.sky = skyDome(sea, 0x1a2230, 0x2e3846, 0x46505c); sea.fog = new THREE.Fog(0x3a4450, 15, 120);
  const N = 56, S = 2.2; const wm = new THREE.MeshStandardMaterial({ map: T2.water, color: 0x7a98a8, roughness: 0.35 });
  const waves = new THREE.InstancedMesh(new THREE.BoxGeometry(S, 2, S), wm, N * N); waves.receiveShadow = true; sea.add(waves);
  const ship = new THREE.Group(); sea.add(ship); const pl = M(T.planks), dw = M(T.darkwood);
  ship.add(box(8, 1.4, 3, pl, 0, 0.4, 0)); ship.add(box(1.6, 1.1, 2.0, pl, 4.6, 0.6, 0)); ship.add(box(1.8, 0.8, 3, dw, -3.2, 1.5, 0)); ship.add(box(8.2, 0.2, 3.2, dw, 0, 1.15, 0));
  for (const z of [-1.55, 1.55]) ship.add(box(8, 0.35, 0.12, dw, 0, 1.4, z));
  const mast = new THREE.Group(); mast.position.set(0.3, 1.1, -0.4); ship.add(mast); mast.add(box(0.25, 7, 0.25, dw, 0, 3.5, 0)); mast.add(box(0.15, 0.15, 4, dw, 0, 5.6, 0));
  const sail = box(0.08, 3.0, 3.8, C(0xd8d0bc), 0.12, 4.0, 0); mast.add(sail);
  const crates = []; for (let i = 0; i < 4; i++) { const c = box(0.6, 0.6, 0.6, C(0x6a2e78), -2.4 + (i % 2) * 0.7, 1.55 + Math.floor(i / 2) * 0.6, 0.6 - (i % 2) * 0.3); ship.add(c); crates.push(c); }
  const floaters = []; for (let i = 0; i < 6; i++) { const f = i < 3 ? box(0.6, 0.6, 0.6, C(0x6a2e78), 0, 0, 0) : box(1.6, 0.12, 0.35, pl, 0, 0, 0); f.userData = { x: -3 + i * 1.9, z: 2 + (i * 1.3) % 4, p: i * 1.1 }; sea.add(f); floaters.push(f); }
  const plank = box(2.2, 0.15, 0.55, pl, 0, 0, 0); sea.add(plank);
  const sun = sunLight(sea, 0xb8c8e0, 1.6, V(-30, 50, 30), V(0, 0, 0), 18); const hemi = new THREE.HemisphereLight(0x8a9ab0, 0x1a2a3a, 1.1); sea.add(hemi);
  const zenon = humanoid(ZENON); addActors(sea, [zenon]);
  Object.assign(sea.userData, { waves, N, S, ship, mast, crates, floaters, plank, sun, hemi, sunOff: V(-30, 50, 30), zenon });
}
const _m4 = new THREE.Matrix4();
function updateWaves(t, amp) { const { waves, N, S } = sea.userData; let k = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = (i - N / 2) * S, z = (j - N / 2) * S; const h = (Math.sin(x * 0.35 + t * 2.1) * 0.55 + Math.cos(z * 0.28 + t * 1.6) * 0.45 + Math.sin((x + z) * 0.6 + t * 3) * 0.15) * amp;
    _m4.makeTranslation(x, Math.round(h * 4) / 4 - 1, z); waves.setMatrixAt(k++, _m4); } waves.instanceMatrix.needsUpdate = true; }
const waveH = (x, z, t, amp) => (Math.sin(x * 0.35 + t * 2.1) * 0.55 + Math.cos(z * 0.28 + t * 1.6) * 0.45) * amp;

// =====================================================================
// SET 3: Rom – Villa mit Innenhof, Kaiserpalast, Legion, Stadt
// =====================================================================
const rome = new THREE.Scene();
{
  skyDome(rome, 0x4a80c8, 0x9ac0e0, 0xf0e0c0, V(-0.5, 0.45, 0.4)); rome.fog = new THREE.Fog(0xe8dcc0, 90, 420); clouds(rome, 9, 0xffffff, 65, 20, 220, 0.9);
  rome.add(box(800, 1, 800, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x8a8a4a, 0.14), 2201)), 0, -0.5, 0, { cast: false }));
  const marble = M(T2.marble), wallR = M(T2.wallRed);
  // Innenhof (Peristyl) um den Ursprung
  rome.add(box(19, 0.04, 19, M(T2.mosaic), 0, 0, 0, { cast: false }));
  for (let x = -7; x <= 7; x += 2) for (const z of [-7, 7]) rome.add(box(0.5, 3.6, 0.5, marble, x, 1.8, z));
  for (let z = -5; z <= 5; z += 2) for (const x of [-7, 7]) rome.add(box(0.5, 3.6, 0.5, marble, x, 1.8, z));
  for (const z of [-8.3, 8.3]) { rome.add(box(19.4, 0.4, 3.2, M(T.roofRed), 0, 3.9, z)); } for (const x of [-8.3, 8.3]) rome.add(box(3.2, 0.4, 13.4, M(T.roofRed), x, 3.9, 0));
  rome.add(box(19, 4, 0.3, wallR, 0, 2, -9.6)); for (const x of [-9.6, 9.6]) rome.add(box(0.3, 4, 19, wallR, x, 2, 0)); rome.add(box(19, 4, 0.3, wallR, 0, 2, 9.6));
  rome.add(box(3.4, 0.2, 2.4, marble, 0, 0.1, -2)); const pool = box(3.0, 0.05, 2.0, M(T2.water, { rough: 0.1 }), 0, 0.2, -2, { cast: false }); rome.add(pool);
  rome.add(box(0.5, 0.45, 0.5, M(T.darkwood), -2.6, 0.225, 2.4)); // Hocker Epiktet
  for (const [x, z, ry] of [[1.6, -3.4, 0.5], [6.0, -3.2, -0.5], [1.9, -5.4, 0.8], [5.7, -5.4, -0.8]]) { const b = box(1.6, 0.45, 0.5, marble, x, 0.225, z); b.rotation.y = ry; rome.add(b); }
  for (let i = 0; i < 5; i++) { const p = box(0.5, 0.8, 0.5, C(0xa8603a), -6 + i * 3, 0.4, 8.6); rome.add(p); rome.add(box(0.8, 0.8, 0.8, C(0x4a8a3a), -6 + i * 3, 1.2, 8.6)); }
  // Kaiserpalast mit Podium (x -30)
  const PX = -30; rome.add(box(14, 7, 1, marble, PX, 3.5, -3.5)); for (let x = -6; x <= 6; x += 2) rome.add(box(0.7, 7, 0.7, marble, PX + x, 3.5, -2.6));
  rome.add(box(14.6, 1.2, 2, marble, PX, 7.6, -3)); for (const x of [-4, 4]) rome.add(box(1.4, 4.4, 0.1, M(T2.purple), PX + x, 4.0, -2.2, { cast: false }));
  rome.add(box(5, 1.2, 4, marble, PX, 0.6, 4.5)); rome.add(box(5.4, 0.4, 4.4, marble, PX, 0.2, 4.5)); rome.add(box(1.2, 1.6, 0.4, C(0xd0a030, { metal: 0.5, rough: 0.4 }), PX, 2.0, 2.9));
  rome.add(box(60, 0.04, 40, M(T.dirt), PX, 0, 20, { cast: false }));
  // Stadt
  const r = rng(2202); for (let i = 0; i < 110; i++) { const x = -110 + r() * 220, z = -120 + r() * 100; if (Math.abs(x) < 14 && z > -14) continue; if (Math.abs(x - PX) < 12 && z > -10) continue; const w = 5 + r() * 5, d = 5 + r() * 5, h = 4 + r() * 8;
    rome.add(box(w, h, d, M(r() < 0.5 ? T2.ochre : T.white), x, h / 2, z)); rome.add(box(w + 0.4, 0.6, d + 0.4, M(T.roofRed), x, h + 0.3, z)); }
  const colo = new THREE.Group(); colo.position.set(50, 0, -70); rome.add(colo); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; const b = box(3.0, 16, 2, M(T.brickGrey), Math.cos(a) * 20, 8, Math.sin(a) * 14); b.rotation.y = -a; colo.add(b);
    for (const y of [3, 8, 13]) { const w = box(1.4, 2.6, 0.1, C(0x2a2420), Math.cos(a) * 21.05, y, Math.sin(a) * 14.75, { cast: false }); w.rotation.y = -a + Math.PI / 2; colo.add(w); } }
  const sun = sunLight(rome, 0xfff0d8, 3.4, V(-40, 55, 40), V(0, 0, 0), 22); rome.add(new THREE.HemisphereLight(0xd8e4ff, 0x8a6a4a, 1.4));
  const epi = humanoid(EPIKTET), master = humanoid(MASTER), mark = humanoid(MARK); laurel(mark); const students = GREEKS.slice(0, 4).map((g, i) => humanoid({ ...g, seed: 60 + i }));
  const cane = attach(epi, 'armL', caneMesh(), -0.62); const mScroll = attach(mark, 'armR', scrollMesh());
  const legion = []; for (let i = 0; i < 48; i++) { const s = humanoid({ skin: [0xe8b894, 0xc89a72, 0xd8a882][i % 3], hair: 0x2a1a14, top: 0xa82a1e, bottom: 0x8a2418, belt: 0x6a5a3a, shoe: 0x4a3420, hat: 'helmet', seed: 70 + (i % 6) }); attach(s, 'armL', shieldMesh(), -0.4); legion.push(s); }
  addActors(rome, [epi, master, mark, ...students, ...legion]);
  Object.assign(rome.userData, { sun, sunOff: V(-40, 55, 40), epi, master, mark, students, legion, cane, mScroll, PX });
}

// =====================================================================
// SET 4: Feldlager bei Nacht (Mark Aurel)
// =====================================================================
const camp = new THREE.Scene();
{
  skyDome(camp, 0x060a18, 0x0e1630, 0x1e2440); camp.fog = new THREE.Fog(0x0e1426, 18, 120);
  camp.add(box(400, 1, 400, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3a4a2a, 0.16), 2301)), 0, -0.5, 0, { cast: false }));
  const tentM = M(T2.tent), plain = M(T2.tentPlain), dw = M(T.darkwood);
  // Kaiserzelt, vorne offen (+z)
  camp.add(box(4.2, 2.8, 0.1, tentM, 0, 1.4, -1.7)); for (const x of [-2.1, 2.1]) camp.add(box(0.1, 2.8, 3.4, tentM, x, 1.4, 0)); camp.add(box(4.6, 0.14, 3.8, tentM, 0, 2.85, 0)); camp.add(box(3.2, 0.5, 3.0, tentM, 0, 3.15, 0));
  camp.add(box(4.0, 0.03, 3.2, C(0x6a3a2a), 0, 0.02, 0, { cast: false }));
  camp.add(box(1.5, 0.08, 0.8, dw, 0, 0.78, -0.35)); for (const [x, z] of [[-0.65, -0.7], [0.65, -0.7], [-0.65, 0.0], [0.65, 0.0]]) camp.add(box(0.08, 0.76, 0.08, dw, x, 0.38, z));
  camp.add(box(0.5, 0.45, 0.5, dw, 0, 0.225, -1.05));
  const sheet = box(0.5, 0.012, 0.34, paperM, -0.05, 0.825, -0.3, { cast: false }); sheet.rotation.y = 0.12; camp.add(sheet);
  for (let i = 0; i < 4; i++) { const l = box(0.34, 0.004, 0.012, C(0x8a7a60), -0.05, 0.833, -0.42 + i * 0.07, { cast: false }); l.rotation.y = 0.12; camp.add(l); }
  camp.add(box(0.08, 0.04, 0.42, paperM, 0.33, 0.84, -0.25)); camp.add(box(0.1, 0.1, 0.1, C(0x2a2a2a), 0.5, 0.87, -0.55));
  camp.add(box(0.07, 0.18, 0.07, C(0xf0e8d0), -0.55, 0.91, -0.55)); camp.add(box(0.04, 0.06, 0.04, new THREE.MeshBasicMaterial({ color: 0xffd070 }), -0.55, 1.03, -0.55, { cast: false }));
  const candle = new THREE.PointLight(0xffb060, 3.2, 7, 1.6); candle.position.set(-0.55, 1.2, -0.4); camp.add(candle);
  // weitere Zelte + Feuer
  const r = rng(2302); const fires = [];
  for (let i = 0; i < 22; i++) { const x = -30 + (i % 6) * 10 + r() * 3, z = -26 + Math.floor(i / 6) * 9 + r() * 2; if (Math.abs(x) < 6 && Math.abs(z) < 6) continue; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r() * 0.4 - 0.2;
    for (const s of [-1, 1]) { const p = box(0.1, 2.3, 3.2, plain, s * 0.75, 1.0, 0); p.rotation.z = s * 0.6; g.add(p); } g.add(box(1.6, 1.0, 0.1, plain, 0, 0.5, -1.55)); camp.add(g); }
  for (const [x, z] of [[5.5, 4.5], [-6, 6], [9, -4], [-10, -3], [2, 11]]) { const f = new THREE.Group(); f.position.set(x, 0, z); camp.add(f);
    for (let i = 0; i < 4; i++) { const l = box(0.9, 0.16, 0.16, dw, 0, 0.1, 0); l.rotation.y = i * 0.8; f.add(l); }
    const fm = [0xff8a2a, 0xffc04a, 0xff5a1a].map(c => new THREE.MeshBasicMaterial({ color: c })); const flames = []; for (let i = 0; i < 6; i++) { const b = box(0.22, 0.22, 0.22, fm[i % 3], (i % 3 - 1) * 0.18, 0.3, (Math.floor(i / 3) - 0.5) * 0.2, { cast: false }); f.add(b); flames.push(b); }
    const L = new THREE.PointLight(0xff8a3a, 6, 12, 1.5); L.position.set(0, 1.0, 0); f.add(L); fires.push({ f, L, flames }); }
  const sun = sunLight(camp, 0x8090c0, 0.55, V(-20, 40, 25), V(0, 0, 0), 22); const hemi = new THREE.HemisphereLight(0x4a5a8a, 0x1a1a2a, 0.5); camp.add(hemi);
  const mark = humanoid(MARK); laurel(mark); const soldiers = [0, 1, 2, 3, 4, 5].map(i => humanoid({ skin: [0xe8b894, 0xc89a72, 0xd8a882][i % 3], hair: 0x2a1a14, top: 0xa82a1e, bottom: 0x8a2418, belt: 0x6a5a3a, shoe: 0x4a3420, hat: i < 3 ? 'helmet' : undefined, sad: true, seed: 80 + i }));
  addActors(camp, [mark, ...soldiers]);
  Object.assign(camp.userData, { candle, fires, sun, sunOff: V(-20, 40, 25), mark, soldiers });
}

// =====================================================================
// SET 5: Heute – Bahnhof, Vorplatz mit Taxi
// =====================================================================
const city = new THREE.Scene();
{
  skyDome(city, 0x5a84c0, 0x9ab8d8, 0xd8e2ea, V(-0.5, 0.4, 0.4)); city.fog = new THREE.Fog(0xd8e2ea, 70, 360); clouds(city, 4, 0xffffff, 60, 24, 200, 0.9);
  city.add(box(800, 1, 800, M(T.concrete), 0, -0.5, 0, { cast: false }));
  const conc = M(T.concrete), metal = M(T.metal);
  city.add(box(60, 0.8, 5, conc, 0, 0.4, 2)); city.add(box(60, 0.02, 0.14, C(0xf0d020), 0, 0.81, 0.15, { cast: false })); city.add(box(60, 0.02, 0.5, C(0xe8e8e8), 0, 0.81, -0.28, { cast: false }));
  city.add(box(60, 0.2, 4.4, M(T2.gravel), 0, 0.1, -2.7, { cast: false })); for (const z of [-2.05, -3.35]) city.add(box(60, 0.14, 0.1, C(0x8a8a90, { metal: 0.6, rough: 0.4 }), 0, 0.27, z));
  for (let x = -30; x < 30; x += 0.8) city.add(box(0.25, 0.08, 2.0, M(T.darkwood), x, 0.22, -2.7, { cast: false }));
  for (let x = -9; x <= 9; x += 6) city.add(box(0.2, 3.6, 0.2, metal, x, 2.6, 3.8)); city.add(box(30, 0.25, 4.6, metal, 0, 4.5, 2.1));
  for (let x = -24; x <= 24; x += 8) city.add(box(1.6, 0.45, 0.5, C(0x3a6a8a), x + 3, 1.02, 4.1));
  // Anzeigetafel
  const bcv = document.createElement('canvas'); bcv.width = 512; bcv.height = 160; const btex = new THREE.CanvasTexture(bcv); btex.colorSpace = THREE.SRGBColorSpace; btex.magFilter = THREE.NearestFilter;
  city.add(box(2.9, 1.0, 0.16, C(0x1a1a1e), 1.5, 3.55, 2.0)); city.add(box(0.06, 0.8, 0.06, metal, 0.6, 4.2, 2.0)); city.add(box(0.06, 0.8, 0.06, metal, 2.4, 4.2, 2.0));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 0.85), new THREE.MeshBasicMaterial({ map: btex, toneMapped: false })); board.position.set(1.5, 3.55, 2.09); city.add(board);
  // Gegenüber: Gebäude, Vorplatz + Straße (x 34..56)
  city.add(box(70, 10, 4, M(T.brickGrey), 0, 5, -9)); for (let x = -30; x < 30; x += 4) city.add(box(1.6, 2.2, 0.1, M(T.windowDark), x, 6, -6.95, { cast: false }));
  city.add(box(22, 0.15, 5, M(T2.tiles), 45, 0.075, 7)); city.add(box(22, 0.04, 6, M(T2.asphalt), 45, 0.02, 1.6, { cast: false })); for (let x = 35; x < 56; x += 4) city.add(box(2, 0.02, 0.18, C(0xe8e8e8), x, 0.05, 1.6, { cast: false }));
  city.add(box(22, 9, 4, M(T.brick), 45, 4.5, 20)); for (let x = 36; x < 55; x += 3.5) for (const y of [2, 5.5]) city.add(box(1.6, 1.8, 0.1, M(T.windowDark), x, y, 17.95, { cast: false }));
  const tr = rng(2401); for (let i = 0; i < 24; i++) { const x = -100 + i * 9 + tr() * 3, h = 10 + tr() * 20; city.add(box(8, h, 8, C([0xc8c0b0, 0xa8b0b8, 0xd8c8b0, 0x9aa0a8][i % 4]), x, h / 2, -26)); }
  // Taxi
  const taxi = new THREE.Group(); city.add(taxi); const yel = C(0xe8c020, { rough: 0.5 }), glass = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.1, metalness: 0.3 });
  taxi.add(box(4.2, 0.8, 1.8, yel, 0, 0.65, 0)); taxi.add(box(2.3, 0.7, 1.7, glass, -0.2, 1.4, 0)); taxi.add(box(2.3, 0.1, 1.72, yel, -0.2, 1.78, 0)); taxi.add(box(0.6, 0.2, 0.3, C(0xf4f4f0), -0.2, 1.93, 0));
  for (const [x, z] of [[-1.3, -0.85], [1.3, -0.85], [-1.3, 0.85], [1.3, 0.85]]) taxi.add(box(0.7, 0.7, 0.3, C(0x1a1a1a), x, 0.35, z));
  for (const z of [-0.6, 0.6]) taxi.add(box(0.06, 0.18, 0.3, new THREE.MeshBasicMaterial({ color: 0xfff4d0 }), 2.11, 0.8, z, { cast: false }));
  const sun = sunLight(city, 0xfff4e0, 3.0, V(-40, 55, 45), V(0, 0, 0), 20); city.add(new THREE.HemisphereLight(0xd0e0ff, 0x6a6a6a, 1.5));
  const tom = humanoid(TOM); tom.userData.body.add(box(0.44, 0.56, 0.2, C(0x2a2a2e), 0, 1.1, -0.23)); const tPhone = inHand(tom, phoneMesh()); const tNotes = attach(tom, 'armL', notesMesh());
  const pass = [0, 1, 2, 3].map(i => humanoid({ skin: [0xe8b894, 0x8a5a3a, 0xf0c4a2, 0xc89a72][i], hair: [0x2a1a14, 0x1a1a1a, 0xb8925a, 0x6a4422][i], top: [0x8a3a3a, 0x3a5a3a, 0xd8d8d8, 0x5a4a7a][i], bottom: 0x2a3448, longHair: i % 2 === 1, seed: 90 + i }));
  addActors(city, [tom, ...pass]);
  Object.assign(city.userData, { sun, sunOff: V(-40, 55, 45), bcv, btex, taxi, tom, tPhone, tNotes, pass });
}
function drawBoard(cancel) { const { bcv, btex } = city.userData, c = bcv.getContext('2d');
  c.fillStyle = '#0c1424'; c.fillRect(0, 0, 512, 160); c.font = '600 44px Pix'; c.textBaseline = 'middle';
  c.fillStyle = '#ffffff'; c.fillText('08:12', 22, 50); c.fillText('Zug 7', 170, 50); c.fillStyle = '#cfd8e8'; c.fillText('Stadtmitte', 300, 50);
  if (cancel) { c.fillStyle = '#ff4a3a'; c.fillRect(22, 92, 468, 52); c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.fillText('FÄLLT AUS', 256, 119); c.textAlign = 'left'; }
  else { c.fillStyle = '#7aff7a'; c.fillText('pünktlich', 22, 118); }
  btex.needsUpdate = true; }

// =====================================================================
// SET 6: Prüfungssaal
// =====================================================================
const hall = new THREE.Scene(); hall.background = new THREE.Color(0x0a0b10);
{
  const wall = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8d4c8, 0.04), 2501));
  hall.add(box(14, 0.2, 12, M(T.planks), 0, -0.1, -1)); hall.add(box(14, 4.5, 0.3, wall, 0, 2.25, -7)); hall.add(box(0.3, 4.5, 12, wall, -7, 2.25, -1)); hall.add(box(0.3, 4.5, 12, wall, 7, 2.25, -1)); hall.add(box(14, 0.2, 12, wall, 0, 4.6, -1));
  for (const z of [-5, -2]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.0), new THREE.MeshBasicMaterial({ color: 0xcfe4ff })); w.rotation.y = Math.PI / 2; w.position.set(-6.84, 2.4, z); hall.add(w); }
  const dw = M(T.darkwood); const desks = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) { const x = -4.2 + col * 2.6, z = 1.4 - row * 2.2; hall.add(box(1.2, 0.06, 0.7, dw, x, 0.74, z + 0.5)); for (const [dx, dz] of [[-0.55, 0.2], [0.55, 0.2], [-0.55, 0.8], [0.55, 0.8]]) hall.add(box(0.05, 0.72, 0.05, C(0x3a3a3a), x + dx, 0.36, z + dz));
    hall.add(box(0.5, 0.05, 0.5, dw, x, 0.45, z - 0.05)); hall.add(box(0.36, 0.012, 0.46, paperM, x, 0.78, z + 0.5, { cast: false })); desks.push([x, z]); }
  const sun = sunLight(hall, 0xfff0d8, 2.2, V(-14, 9, -2), V(0, 0, -1), 9, 1024); hall.add(new THREE.HemisphereLight(0xeef0ff, 0x6a5a4a, 1.3));
  const lamp = new THREE.PointLight(0xfff0d0, 5, 14, 1.4); lamp.position.set(0, 4.2, 0); hall.add(lamp);
  const tom = humanoid(TOM); tom.userData.setFace({}); const others = [0, 1, 2, 3, 4, 5, 6].map(i => humanoid({ skin: [0xe8b894, 0x8a5a3a, 0xf0c4a2, 0xc89a72][i % 4], hair: [0x2a1a14, 0x1a1a1a, 0xb8925a, 0x6a4422][i % 4], top: [0x8a3a3a, 0x3a5a3a, 0xd8d8d8, 0x5a4a7a, 0xa87a3a][i % 5], bottom: 0x2a3448, longHair: i % 2 === 1, seed: 100 + i }));
  addActors(hall, [tom, ...others]); Object.assign(hall.userData, { desks, tom, others });
}

// =====================================================================
// SET 7: Sonnenuntergang mit Schild
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
  const fill = new THREE.DirectionalLight(0xffd8b0, 1.6); fill.position.set(4, 6, 20); dusk.add(fill);
  dusk.userData = { bcv, stex };
}
function drawSign() {
  const { bcv, stex } = dusk.userData, c = bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('EPIKTET, UM 125 N. CHR.', 72, 150, '#a3241c'); fit('NICHT DIE DINGE BEUNRUHIGEN UNS,', 56, 290, '#3a2a1e'); fit('SONDERN UNSER URTEIL ÜBER SIE', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 74.44; // hörbares Ende der Sprache (gemessen, -40 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1), WHIP1 = wt(1) + 0.57;
const CUTS = [[0, 'hero'], [4, 'athens'], [8, 'storm'], [16, 'wreck'], [22, 'beach'], [25, 'bookshop'], [32, 'question'], [45, 'krates'], [52, 'stoa'], [60, 'stoaword'],
  [67, 'idea'], [78, 'dicho'], [85, 'weather'], [95, 'control'], [104, 'rome'], [112, 'leg'], [121, 'calm'], [127, 'snap'], [129, 'told'], [138, 'teacher'],
  [148, 'emperor'], [155, 'mighty'], [160, 'crisis'], [167, 'writing'], [175, 'book'], [179, 'station'], [191, 'cancel'], [196, 'angry'], [199, 'think'], [215, 'taxi'],
  [225, 'hall'], [240, 'sign'], [248, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
function heroCam(t) { // Preset hook-kranfahrt.json: Two-Shot vor der Stoa, dann Kranfahrt nach hinten/oben/links
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(4.6, 4.15, k)), t0 = V(0.0, 1.32, 0.0);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-9.0 + drift * 2, 15.0 + drift * 1.2, 16.0 + drift * 2), t1 = V(1.0 + drift, 0.5, -8.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false, boardState = null;
const GOLD = '#ffd23f', CYAN = '#55ffff', RED = '#ff5555', GREY = '#aaaaaa', GREEN = '#55ff55';
const ATH = ['hero', 'loop', 'athens', 'beach', 'bookshop', 'question', 'krates', 'stoa', 'stoaword', 'idea', 'dicho', 'weather', 'control'];
const ROME = ['rome', 'leg', 'calm', 'snap', 'told', 'teacher', 'emperor', 'mighty'];

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = athens, exp = 1.35; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null, hp: null, flash: 0, flashW: 0 };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([() => tagPos(ch, extra), text, color]);
  const tagAt = (p, text, color) => ui.tags.push([p, text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:${GOLD}">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const minus = (t0, txt) => chat(t0, `<span style="color:${RED}">[−]</span> ${txt}`);
  const plus = (t0, txt) => chat(t0, `<span style="color:${GREEN}">[+]</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const toast = (t0, icon, l1, l2) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-40, 0, smoother((t - t0) / 0.25)), icon, l1, l2 }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const g = s => `<span style="color:${GREY}">${s}</span>`;

  // ---------- Athen ----------
  if (ATH.includes(sh.id)) {
    scene = athens; const A = athens.userData; const { zenon: Z, krates: K, students, gossip, keeper } = A; const ta = sh.id === 'loop' ? t - DUR : t;
    resetActors(athens); A.zScroll.visible = false; A.zBlock.visible = false; A.rain.visible = false; A.sun.intensity = 3.4; A.hemi.intensity = 1.4; A.hemi.color.set(0xd8e8ff); A.sun.color.set(0xfff0d0); exp = 1.35;
    A.debris.forEach(d => { const u2 = d.userData; d.position.set(u2.x, 0.12 + Math.sin(t * 1.5 + u2.p) * 0.05, u2.z); d.rotation.y = u2.p; }); focusSun(athens, 0, 0);
    if (sh.id === 'hero' || sh.id === 'loop') { put(Z, -0.72, 0, 0, 0.32); put(K, 0.72, 0, 0, -0.32); act(Z, 'teach', ta); act(K, 'idle', ta, 1.5); K.userData.setFace({ smile: true });
      students.slice(0, 3).forEach((s, i) => { put(s, -3 + i * 3, 0.75, -6.2 - (i % 2) * 0.8, 0.2 - i * 0.2); act(s, 'idle', ta, i); });
      heroCam(ta); tag(Z, 'Zenon', GOLD); tag(K, 'Krates', CYAN); }
    if (sh.id === 'athens') { put(Z, 6, 0, 6, -0.5); act(Z, 'walk', t); Z.position.x -= (t - sh.a) * 1.2; students.forEach((s, i) => { put(s, -10 + i * 4.5, 0, 6 + (i % 3) * 3, i % 2 ? 1.6 : -1.6); act(s, 'walk', t, i); s.position.x += (t - sh.a) * (i % 2 ? 1.2 : -1.2); });
      focusSun(athens, 0, -10); mv(u, V(34, 24, 44), V(30, 22.5, 40), V(-6, 4, -20), V(-8, 4, -22), 46); info(wt(5), 'Athen, vor 2300 Jahren'); }
    if (sh.id === 'beach') { focusSun(athens, 44, 8); put(Z, 46.2 - (t - sh.a) * 1.1, 0.05, 9.5, -Math.PI / 2 + 0.5); act(Z, 'walk', t); Z.userData.setFace({ sad: true }); Z.userData.head.rotation.x = 0.3;
      mv(u, V(42.2, 1.75, 13.6), V(42.4, 1.7, 13.0), V(45.4, 1.2, 9.4), V(45.2, 1.2, 9.4), 46); tag(Z, 'Zenon', GOLD); }
    if (sh.id === 'bookshop' || sh.id === 'question') { focusSun(athens, 22, 6); put(Z, 21.6, 0, 6.2, 0.35); put(keeper, 23.2, 0, 5.1, -0.4); act(keeper, 'idle', t, 2); A.zScroll.visible = true;
      if (sh.id === 'bookshop') { act(Z, 'read', t); mv(u, V(23.0, 1.85, 11.2), V(22.9, 1.8, 10.6), V(22.4, 1.3, 5.6), V(22.4, 1.3, 5.6), 46); tag(Z, 'Zenon', GOLD); tag(keeper, 'Händler', GREY);
        tip(wt(29), 'scroll', 'Erinnerungen an Sokrates', '#ffff55', [g('von Xenophon'), g('Über ein gutes Leben')]); }
      else { act(Z, 'think', t); Z.userData.setFace({ sad: true }); mv(u, V(22.5, 1.95, 8.6), V(22.4, 1.92, 8.1), V(21.6, 1.45, 6.2), V(21.6, 1.45, 6.2), 44); tag(Z, 'Zenon', GOLD);
        say(wt(36), 'Zenon', GOLD, 'Wie lebt man gut,'); say(wt(40), 'Zenon', GOLD, 'wenn man alles verlieren kann?'); } }
    if (sh.id === 'krates') { focusSun(athens, 6, 3); const k = smoother((t - sh.a) / 1.2); put(Z, lerp(8.4, 7.0, k), 0, 3.2, -0.55); act(Z, k < 1 ? 'walk' : 'idle', t); put(K, 5.2, 0, 3.0, 0.6); act(K, t > wt(49) ? 'teach' : 'idle', t, 1); K.userData.setFace({ smile: true });
      mv(u, V(6.1, 1.8, 9.4), V(6.0, 1.75, 8.8), V(6.1, 1.3, 3.1), V(6.1, 1.3, 3.1), 46); tag(Z, 'Zenon', GOLD); tag(K, 'Philosoph Krates', CYAN); }
    const inStoa = () => { put(Z, 0, 0.75, -7.8, 0); [[-2.6, -6.0], [2.6, -6.0], [-3.6, -7.0], [3.6, -7.0]].forEach(([x, z], i) => { put(students[i], x, 0.75, z, Math.atan2(0 - x, -7.8 - z)); act(students[i], 'idle', t, i); }); };
    if (sh.id === 'stoa') { inStoa(); act(Z, 'teach', t); focusSun(athens, 0, -6); mv(u, V(-1.0, 2.25, -4.25), V(-0.8, 2.2, -4.55), V(0.2, 1.8, -7.8), V(0.2, 1.8, -7.8), 50); tag(Z, 'Zenon', GOLD); }
    if (sh.id === 'stoaword') { inStoa(); act(Z, 'teach', t); focusSun(athens, 0, -6); mv(u, V(-5.2, 2.3, -4.3), V(-4.7, 2.25, -4.5), V(-6.8, 2.6, -9.0), V(-6.2, 2.6, -9.0), 50);
      tip(wt(62), 'column', 'Stoa Poikile', '#ffff55', [g('„Die bemalte Säulenhalle“'), g('Athen, um 300 v. Chr.')]); if (t >= wt(66)) { ui.tip = null; toast(wt(66), 'column', 'Neue Schule gegründet!', 'Stoizismus'); } }
    if (sh.id === 'idea' || sh.id === 'dicho') { inStoa(); focusSun(athens, 0, -6);
      if (sh.id === 'idea') { A.zBlock.visible = t >= wt(70); act(Z, t >= wt(70) ? 'hold' : 'finger', t); mv(u, V(-1.3, 2.25, -5.3), V(-1.2, 2.2, -5.55), V(0, 1.85, -7.8), V(0, 1.85, -7.8), 44); tag(Z, 'Zenon', GOLD); }
      else { act(Z, 'teach', t); mv(u, V(-2.0, 2.0, -4.5), V(-1.8, 1.95, -4.8), V(0.2, 1.7, -7.8), V(0.2, 1.7, -7.8), 48); tag(Z, 'Zenon', GOLD);
        tip(wt(82), 'hand', 'Dichotomie der Kontrolle', '#55ffff', [g('In deiner Hand: Urteil, Handeln'), g('Nicht in deiner Hand: der Rest')]); } }
    if (sh.id === 'weather' || sh.id === 'control') { focusSun(athens, -6, 4); put(Z, -6, 0, 4, 0.3);
      if (sh.id === 'weather') { A.rain.visible = true; A.rain.position.set(-6, 0, 5); A.rain.userData.update(t); A.sun.intensity = 0.9; A.hemi.intensity = 0.9; A.hemi.color.set(0x8a96a8); exp = 1.25; act(Z, 'idle', t); Z.userData.setFace({ sad: true });
        put(gossip[0], -4.0, 0, 3.4, -0.6); put(gossip[1], -3.4, 0, 4.2, -1.0); act(gossip[0], 'point', t); act(gossip[1], 'laugh', t, 1);
        mv(u, V(-3.9, 1.95, 10.2), V(-4.1, 1.9, 9.5), V(-4.8, 1.35, 4.0), V(-4.8, 1.35, 4.0), 48); tag(Z, 'Zenon', GOLD); tag(gossip[0], 'Bürger', GREY); tag(gossip[1], 'Bürger', GREY);
        minus(wt(86), 'Wetter'); minus(wt(88), 'andere Menschen'); minus(wt(90), 'dein Ruf'); if (t >= wt(91)) chat(wt(91), `<span style="color:${RED}">Nicht in deiner Hand</span>`); }
      else { act(Z, 'calm', t); Z.userData.setFace({ smile: true }); mv(u, V(-5.2, 1.8, 8.0), V(-5.35, 1.76, 7.4), V(-6.0, 1.5, 4.0), V(-6.0, 1.5, 4.0), 46); tag(Z, 'Zenon', GOLD);
        plus(wt(96), 'Gedanken'); plus(wt(98), 'Entscheidungen'); plus(wt(100), 'Handeln'); if (t >= wt(101)) chat(wt(101), `<span style="color:${GREEN}">In deiner Hand</span>`); } }
  }
  // ---------- Sturm ----------
  if (sh.id === 'storm' || sh.id === 'wreck') {
    scene = sea; const S = sea.userData; resetActors(sea); const Z = S.zenon; exp = 1.5; focusSun(sea, 0, 0);
    if (sh.id === 'storm') { updateWaves(t, 1.0); S.ship.position.set(0, Math.sin(t * 1.4) * 0.35, 0); S.ship.rotation.set(Math.sin(t * 1.1) * 0.06, 0, Math.sin(t * 1.6) * 0.13); S.mast.rotation.z = 0; S.mast.visible = true; S.plank.visible = false;
      S.crates.forEach(c => c.visible = true); S.floaters.forEach(f => f.visible = false); S.ship.add(Z); put(Z, 1.9, 1.25, 0.7, 0.35); act(Z, 'cling', t); Z.userData.setFace({ sad: true });
      const fl = t >= wt(14) && t < wt(14) + 0.18 ? 1 : 0; S.hemi.intensity = 1.1 + fl * 3; ui.flashW = fl * 0.35;
      mv(u, V(5.8, 3.6, 10.5), V(5.2, 3.4, 9.6), V(0.6, 2.2, 0), V(0.6, 2.2, 0), 50); tag(Z, 'Händler Zenon', GOLD); }
    else { updateWaves(t, 0.45); S.hemi.intensity = 1.3; S.ship.position.set(-2, -1.6, -3); S.ship.rotation.set(0.1, 0.3, 0.5); S.mast.rotation.z = 0.9; S.crates.forEach(c => c.visible = false);
      S.floaters.forEach(f => { f.visible = true; const d = f.userData; f.position.set(d.x, waveH(d.x, d.z, t, 0.45) + 0.05, d.z); f.rotation.set(Math.sin(t + d.p) * 0.2, d.p, 0); });
      const px0 = 3.4, pz0 = 4.2, hy = waveH(px0, pz0, t, 0.45); S.plank.visible = true; S.plank.position.set(px0, hy + 0.1, pz0 + 0.3); S.plank.rotation.set(0, 0.1, Math.sin(t * 1.3) * 0.08);
      sea.add(Z); put(Z, px0, hy - 1.05, pz0 - 0.1, 0.15); act(Z, 'cling', t); Z.userData.setFace({ sad: true });
      mv(u, V(5.6, 1.5, 9.2), V(5.3, 1.4, 8.6), V(3.0, 1.0, 3.8), V(3.0, 1.0, 3.8), 48); tag(Z, 'Zenon', GOLD, -0.4);
      minus(wt(17), 'Schiff'); minus(wt(19), '64× Purpur-Ware'); minus(wt(21), 'Geld'); }
  }
  // ---------- Rom ----------
  if (ROME.includes(sh.id)) {
    scene = rome; const R = rome.userData; const { epi: E, master: Ms, mark: Mk, students } = R; resetActors(rome); R.cane.visible = false; focusSun(rome, 0, 0); Ms.userData.setFace({ angry: true });
    if (sh.id === 'rome') { put(E, -1, 0, 3, 0.4); act(E, 'idle', t); mv(u, V(-34, 34, 62), V(-30, 32, 57), V(18, 2, -34), V(18, 2, -36), 46); info(wt(108), 'Rom, 1. Jahrhundert n. Chr.'); }
    const legScene = () => { put(E, -2.6, 0, 2.4, 0.35); act(E, 'idle', t); sitPose(E, 0.45); put(Ms, -3.6, 0, 3.0, 1.25); act(Ms, 'grab', t); };
    if (sh.id === 'leg' || sh.id === 'calm' || sh.id === 'snap' || sh.id === 'told') { legScene(); focusSun(rome, -2, 2);
      const twist = sh.id === 'leg' ? smoother((t - wt(115)) / 0.8) * 0.5 : 0.5; E.userData.legR.rotation.z = -twist * 0.6; E.userData.legR.rotation.y = twist * 0.5;
      E.userData.setFace({}); if (sh.id === 'told') Ms.userData.setFace({ sad: true }); if (sh.id === 'told') act(Ms, 'shock', t);
      tag(E, 'Epiktet', GOLD, -0.5); tag(Ms, 'Herr', RED);
      if (sh.id === 'leg') { mv(u, V(-1.2, 1.6, 6.6), V(-1.35, 1.55, 6.0), V(-2.9, 1.0, 2.6), V(-2.9, 1.0, 2.6), 46); info(wt(110), 'Epiktet ist ein Sklave'); }
      if (sh.id === 'calm') { mv(u, V(-2.0, 1.5, 4.4), V(-2.1, 1.48, 4.1), V(-2.55, 1.1, 2.4), V(-2.55, 1.1, 2.4), 42); say(wt(124), 'Epiktet', GOLD, 'Gleich bricht es.'); }
      if (sh.id === 'snap') { E.userData.legR.rotation.z = -0.55; mv(u, V(-0.6, 1.7, 6.8), V(-0.7, 1.68, 6.6), V(-3.0, 0.9, 2.6), V(-3.0, 0.9, 2.6), 48); ui.flash = clamp01(1 - (t - wt(128)) / 0.35); ui.hp = t >= wt(128) ? 6 : 10;
        chat(wt(128), `<span style="color:${RED}">Epiktets Bein ist gebrochen</span>`); }
      if (sh.id === 'told') { E.userData.legR.rotation.z = -0.55; mv(u, V(-1.5, 1.55, 5.4), V(-1.6, 1.52, 5.0), V(-3.0, 1.1, 2.7), V(-3.0, 1.1, 2.7), 44); say(wt(132), 'Epiktet', GOLD, 'Ich hab es dir doch gesagt.'); } }
    if (sh.id === 'teacher') { focusSun(rome, 4, -4); put(E, 3.9, 0, -4.4, 0.0); act(E, 'cane', t); R.cane.visible = true;
      [[1.6, -3.4, 0.5 + Math.PI / 2], [6.0, -3.2, -0.5 - Math.PI / 2], [1.9, -5.4, 0.8 + Math.PI / 2], [5.7, -5.4, -0.8 - Math.PI / 2]].forEach(([x, z, ry], i) => { put(students[i], x, 0, z, ry); act(students[i], 'idle', t, i); sitPose(students[i], 0.45); });
      mv(u, V(5.2, 1.95, 1.2), V(5.0, 1.9, 0.6), V(3.9, 1.2, -4.4), V(3.9, 1.2, -4.4), 46); tag(E, 'Lehrer Epiktet', GOLD); chat(wt(141), `<span style="color:${GOLD}">Epiktet ist jetzt frei</span>`); }
    if (sh.id === 'emperor' || sh.id === 'mighty') { const PX = R.PX; put(Mk, PX, 1.2, 4.5, 0); focusSun(rome, PX, 10);
      if (sh.id === 'emperor') { act(Mk, 'read', t); R.mScroll.visible = true; mv(u, V(PX + 1.3, 3.0, 8.2), V(PX + 1.15, 2.95, 7.7), V(PX, 2.3, 4.5), V(PX, 2.3, 4.5), 44); tag(Mk, 'Kaiser Mark Aurel', GOLD); }
      else { R.mScroll.visible = false; act(Mk, 'finger', t); R.legion.forEach((s, i) => { put(s, PX - 8.75 + (i % 8) * 2.5, 0, 10 + Math.floor(i / 8) * 2.4, Math.PI); act(s, 'idle', t, i); });
        mv(u, V(PX + 9, 7.5, 30), V(PX + 8, 7.0, 27.5), V(PX, 2.6, 6), V(PX, 2.6, 6), 46); tag(Mk, 'Mark Aurel', GOLD); } }
  }
  // ---------- Feldlager ----------
  if (sh.id === 'crisis' || sh.id === 'writing' || sh.id === 'book') {
    scene = camp; const Cp = camp.userData; resetActors(camp); exp = 1.5; const Mk = Cp.mark; focusSun(camp, 0, 0);
    Cp.fires.forEach(({ L, flames }, i) => { L.intensity = 6 + Math.sin(t * 13 + i) * 1.2 + Math.sin(t * 7.3 + i * 2) * 0.8; flames.forEach((b, j) => { const s = 0.7 + 0.4 * Math.abs(Math.sin(t * 6 + j * 1.7 + i)); b.scale.setScalar(s); b.position.y = 0.3 + ((t * 0.9 + j * 0.17) % 0.5); }); });
    Cp.candle.intensity = 3.2 + Math.sin(t * 17) * 0.25;
    put(Mk, 0, 0, -1.05, 0); act(Mk, 'write', t); sitPose(Mk, 0.45);
    if (sh.id === 'crisis') { const sol = Cp.soldiers; [[4.2, 5.4], [6.8, 3.8], [-5.0, 7.0]].forEach(([x, z], i) => { put(sol[i], x, 0.14, z, 0.4); pose(sol[i], 'idle', 0); sol[i].rotation.set(-Math.PI / 2, 0, 0.6 + i); });
      [[4.6, 3.4, -0.4], [-6.8, 5.2, 0.6], [8.4, -3.0, -0.8]].forEach(([x, z, ry], i) => { put(sol[3 + i], x, 0, z, ry); act(sol[3 + i], 'sadidle', t, i); sitPose(sol[3 + i], 0.45); });
      mv(u, V(12, 6.5, 17), V(11, 6.1, 15.6), V(0.5, 1.0, 1.5), V(0.5, 1.0, 1.5), 46);
      chat(wt(163), `<span style="color:${RED}">Die Pest wütet im Reich</span>`); chat(wt(164), `<span style="color:${RED}">Krieg an der Donau</span>`); chat(wt(166), `<span style="color:${RED}">General Cassius erhebt sich gegen den Kaiser</span>`); }
    if (sh.id === 'writing') { mv(u, V(1.35, 1.55, 2.4), V(1.15, 1.5, 2.0), V(0, 1.05, -0.7), V(0, 1.05, -0.7), 46); tag(Mk, 'Mark Aurel', GOLD); }
    if (sh.id === 'book') { mv(u, V(0.45, 1.75, 1.1), V(0.4, 1.7, 0.95), V(-0.05, 1.15, -0.6), V(-0.05, 1.15, -0.6), 46);
      tip(wt(177), 'book', 'Selbstbetrachtungen', '#ffaa00', [g('12 Bücher, auf Griechisch'), g('Nie zur Veröffentlichung gedacht')]); }
  }
  // ---------- Heute ----------
  if (['station', 'cancel', 'angry', 'think', 'taxi'].includes(sh.id)) {
    scene = city; const Cy = city.userData; resetActors(city); const Tm = Cy.tom; Cy.tPhone.visible = false; Cy.tNotes.visible = false; exp = 1.35; Cy.taxi.position.set(-200, 0, 0);
    const cancel = t >= wt(194); if (boardState !== cancel) { drawBoard(cancel); boardState = cancel; } focusSun(city, 0, 2);
    const passengers = () => Cy.pass.forEach((p, i) => { put(p, [-5, -2.6, 4.4, 6.8][i], 0.8, [2.6, 3.4, 2.4, 3.2][i], [0.4, -0.2, 0.3, -0.6][i]); act(p, cancel ? 'shock' : (i % 2 ? 'phone' : 'idle'), t, i); if (cancel) p.userData.setFace({ sad: true }); });
    if (sh.id !== 'taxi') { put(Tm, 0.2, 0.8, 2.6, 0.25); passengers(); }
    const left = Math.max(0, 3600 - (t - wt(185)) * 1); const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(Math.floor(left % 60)).padStart(2, '0');
    if (sh.id === 'station') { act(Tm, 'idle', t); Cy.tNotes.visible = true; Tm.userData.armL.rotation.x = -1.1; Tm.userData.head.rotation.x = 0.3; Tm.userData.setFace({});
      mv(u, V(3.6, 2.4, 9.4), V(3.2, 2.3, 8.7), V(0.6, 1.9, 2.4), V(0.6, 1.9, 2.4), 48); info(wt(179), 'Heute'); tag(Tm, 'Tom', GOLD); if (t >= wt(187)) eff(wt(187), 'Prüfung in', `${mm}:${ss}`, GOLD); }
    if (sh.id === 'cancel') { act(Tm, cancel ? 'shock' : 'idle', t); Tm.userData.head.rotation.x = -0.3; mv(u, V(1.5, 1.9, 8.8), V(1.55, 1.95, 8.3), V(1.4, 2.7, 2.0), V(1.4, 2.75, 2.0), 46); eff(sh.a, 'Prüfung in', `${mm}:${ss}`, GOLD); }
    if (sh.id === 'angry') { act(Tm, 'fistshake', t); Tm.userData.setFace({ angry: true }); mv(u, V(0.75, 2.45, 5.2), V(0.7, 2.43, 4.9), V(0.2, 2.25, 2.6), V(0.2, 2.25, 2.6), 44); tag(Tm, 'Tom', RED); eff(wt(198), 'Wut', '0:30', RED); ui.flash = 0.18 * clamp01(1 - (t - wt(198)) / 0.4); }
    if (sh.id === 'think') { act(Tm, 'think', t); Tm.rotation.y = -0.15; mv(u, V(1.6, 2.2, 6.6), V(1.45, 2.15, 6.1), V(0.0, 1.95, 2.4), V(0.0, 1.95, 2.4), 46); tag(Tm, 'Tom', GOLD);
      say(wt(204), 'Tom', GOLD, 'Liegt das in meiner Hand?'); minus(wt(210), 'Zug'); }
    if (sh.id === 'taxi') { focusSun(city, 44, 5); put(Tm, 44.2, 0.15, 6.4, 0.45); const k = smoother((t - wt(217)) / 1.6); Cy.taxi.position.set(lerp(62, 42.6, k), 0, 2.4); Cy.passengers;
      if (t < wt(219) + 0.6) { act(Tm, 'cream', t); Cy.tPhone.visible = true; } else { act(Tm, 'read', t); Cy.tNotes.visible = true; Tm.userData.armR.rotation.x = -0.3; }
      mv(u, V(46.8, 1.75, 11.4), V(46.5, 1.72, 10.8), V(44.0, 1.35, 5.6), V(44.0, 1.35, 5.6), 46); tag(Tm, 'Tom', GOLD);
      plus(wt(219), 'Taxi rufen'); plus(wt(221), 'weiterlernen'); plus(wt(223), 'ruhig bleiben'); eff(wt(223), 'Ruhe', '∞', GREEN); }
  }
  if (sh.id === 'hall') {
    scene = hall; const Hh = hall.userData; resetActors(hall); exp = 1.35; const [tx, tz] = Hh.desks[1];
    put(Hh.tom, tx, 0, tz - 0.05, 0); act(Hh.tom, 'write', t); sitPose(Hh.tom, 0.47); Hh.tom.userData.setFace({ smile: true });
    Hh.others.forEach((p, i) => { const [x, z] = Hh.desks[[0, 2, 3, 4, 6, 7, 9][i]]; put(p, x, 0, z - 0.05, 0); act(p, 'write', t + i * 0.3, i); sitPose(p, 0.47); });
    mv(u, V(-0.6, 1.75, 4.9), V(-0.75, 1.7, 4.4), V(-1.7, 1.0, 1.6), V(-1.7, 1.0, 1.6), 46); tag(Hh.tom, 'Tom', GOLD);
    tip(wt(229), 'heart', 'Stoische Ruhe', GREEN, [g('Gefühle haben: ja'), t >= wt(237) ? `<span style="color:${RED}">Von ihnen beherrscht: nein</span>` : '<span style="opacity:0">.</span>']);
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 2.0, 13.5), V(0, 2.1, 12.2), V(0, 0.8, 0), V(0, 0.85, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  scene.updateMatrixWorld(true); rp.scene = scene; composer.render();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  scroll: '<rect x="1" y="2" width="6" height="4" fill="#eee4c8"/><rect x="0" y="1" width="1" height="6" fill="#7a5233"/><rect x="7" y="1" width="1" height="6" fill="#7a5233"/><rect x="2" y="3" width="4" height="1" fill="#8a7a60"/><rect x="2" y="5" width="3" height="1" fill="#8a7a60"/>',
  column: '<rect x="1" y="0" width="6" height="1" fill="#eeeae0"/><rect x="2" y="1" width="1" height="6" fill="#eeeae0"/><rect x="5" y="1" width="1" height="6" fill="#eeeae0"/><rect x="1" y="7" width="6" height="1" fill="#c8c4ba"/>',
  hand: '<rect x="2" y="3" width="4" height="4" fill="#e8b894"/><rect x="2" y="0" width="1" height="3" fill="#e8b894"/><rect x="3" y="1" width="1" height="2" fill="#e8b894"/><rect x="4" y="0" width="1" height="3" fill="#e8b894"/><rect x="5" y="1" width="1" height="2" fill="#e8b894"/><rect x="6" y="3" width="1" height="2" fill="#e8b894"/>',
  book: '<rect x="1" y="1" width="6" height="6" fill="#6a2e78"/><rect x="2" y="2" width="4" height="4" fill="#eee4c8"/><rect x="1" y="1" width="1" height="6" fill="#d8b040"/>',
  heart: '<rect x="1" y="2" width="2" height="2" fill="#55ff55"/><rect x="5" y="2" width="2" height="2" fill="#55ff55"/><rect x="1" y="3" width="6" height="2" fill="#55ff55"/><rect x="2" y="5" width="4" height="1" fill="#55ff55"/><rect x="3" y="6" width="2" height="1" fill="#55ff55"/>',
  hp: '<rect x="1" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="5" y="2" width="2" height="2" fill="#ff4a6a"/><rect x="1" y="3" width="6" height="2" fill="#ff4a6a"/><rect x="2" y="5" width="4" height="1" fill="#ff4a6a"/><rect x="3" y="6" width="2" height="1" fill="#ff4a6a"/>',
};
const NUM = { 'zweitausenddreihundert': '2300' };
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; if (NUM[txt.toLowerCase()]) txt = NUM[txt.toLowerCase()];
    const f = clamp01((t - cur[1] + 0.02) / 0.07), gg = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${gg},${gg},${gg})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
  else capEl.textContent = '';
  tagsEl.innerHTML = ui.tags.map(([p, txt, col]) => { const s = project(typeof p === 'function' ? p() : p); return s.ok ? `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${col}">${txt}</div>` : ''; }).join('');
  chatEl.innerHTML = ui.chat.slice(-5).join('<br>');
  let ex = '';
  if (ui.tip) ex += `<div class="tip" style="opacity:${ui.tip.o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.tip.icon]}</svg><div><b style="color:${ui.tip.titleCol}">${ui.tip.title}</b>${ui.tip.lines.join('<br>')}</div></div>`;
  if (ui.toast) ex += `<div class="toast" style="opacity:${ui.toast.o};transform:translateY(${ui.toast.y}px)"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges">${ICONS[ui.toast.icon]}</svg><div><div class="t1">${ui.toast.l1}</div><div class="t2">${ui.toast.l2}</div></div></div>`;
  if (ui.eff) ex += `<div class="eff" style="opacity:${ui.eff.o}"><svg width="54" height="54" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#2a2a2a"/><rect x="2" y="2" width="4" height="4" fill="${ui.eff.col}"/></svg><div><div style="color:${ui.eff.col}">${ui.eff.name}</div><div style="color:#aaaaaa">${ui.eff.time}</div></div></div>`;
  if (ui.hp != null) { let h = ''; for (let i = 0; i < 10; i++) h += `<svg width="44" height="44" viewBox="0 0 8 8" shape-rendering="crispEdges">${i < ui.hp ? ICONS.hp : ICONS.hp.replaceAll('#ff4a6a', '#3a1a1a')}</svg>`; ex += `<div class="hp">${h}</div>`; }
  if (ui.flash > 0) ex += `<div class="flash" style="opacity:${ui.flash}"></div>`;
  if (ui.flashW > 0) ex += `<div class="flash" style="background:#fff;opacity:${ui.flashW}"></div>`;
  extraEl.innerHTML = ex;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 72px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix'); await document.fonts.load('600 44px Pix');
window.ready = true;
