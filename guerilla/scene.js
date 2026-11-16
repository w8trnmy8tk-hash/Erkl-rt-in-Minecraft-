// „Guerillakriegsführung, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
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
// Guerilla – eigene Zubehöre
// =====================================================================
function brimHat(ch, col = 0x2e2218) { const g = new THREE.Group(), m = C(col); g.add(box(0.7, 0.05, 0.7, m, 0, 0.53, 0)); g.add(box(0.5, 0.24, 0.5, m, 0, 0.66, 0)); g.add(box(0.52, 0.06, 0.52, C(0xb82a22), 0, 0.58, 0)); ch.userData.head.add(g); ch.userData.hatExtra = 0.22; return g; }
function shako(ch) { const g = new THREE.Group(), m = C(0x15151a); g.add(box(0.52, 0.42, 0.52, m, 0, 0.72, 0)); g.add(box(0.54, 0.05, 0.54, C(0xd8b030, { metal: 0.5, rough: 0.4 }), 0, 0.92, 0)); g.add(box(0.48, 0.04, 0.2, m, 0, 0.52, 0.32));
  g.add(box(0.1, 0.26, 0.1, C(0xd02018), 0, 1.06, 0.16)); g.add(box(0.13, 0.13, 0.03, C(0xd8b030, { metal: 0.5, rough: 0.4 }), 0, 0.72, 0.27, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.55; return g; }
function coneHat(ch) { const g = new THREE.Group(), m = C(0xd8c088); [[0.9, 0.05, 0.5], [0.66, 0.08, 0.56], [0.42, 0.08, 0.63], [0.2, 0.08, 0.7]].forEach(([s, h, y]) => g.add(box(s, h, s, m, 0, y, 0))); ch.userData.head.add(g); ch.userData.hatExtra = 0.25; return g; }
function beret(ch, col = 0x3a3a2a) { const g = new THREE.Group(); g.add(box(0.56, 0.1, 0.56, C(col), 0.03, 0.54, 0)); g.add(box(0.36, 0.06, 0.36, C(col), 0.08, 0.61, 0)); ch.userData.head.add(g); ch.userData.hatExtra = 0.1; return g; }
function crossbelts(ch) { const m = C(0xf2f2f2); for (const s of [-1, 1]) { const b = box(0.07, 0.78, 0.02, m, 0, 1.08, 0.142, { cast: false }); b.rotation.z = s * 0.55; ch.userData.body.add(b); } ch.userData.body.add(box(0.5, 0.12, 0.27, C(0xd02018), 0, 1.4, 0, { cast: false })); }
function sling(ch) { const g = new THREE.Group(); g.add(box(0.07, 1.15, 0.07, C(0x5a3a1e), 0, 0, 0)); g.add(box(0.05, 0.5, 0.05, C(0x55595f, { metal: 0.6, rough: 0.4 }), 0, 0.75, 0)); g.position.set(0, 1.1, -0.18); g.rotation.z = 0.55; ch.userData.body.add(g); ch.userData.gunBack = g; return g; }
function gunHand(ch) { const g = new THREE.Group(); g.position.set(0, -0.68, 0.06); g.add(box(0.08, 0.36, 0.1, C(0x5a3a1e), 0, 0.02, 0)); g.add(box(0.05, 0.75, 0.05, C(0x55595f, { metal: 0.6, rough: 0.4 }), 0, -0.5, 0)); ch.userData.armR.add(g); ch.userData.gunHand = g; g.visible = false; return g; }
function arm(ch, hand) { if (ch.userData.gunBack) ch.userData.gunBack.visible = !hand; if (ch.userData.gunHand) ch.userData.gunHand.visible = !!hand; }
const toolHand = (ch, col = 0x6a4a2a, head = 0x7a7e84) => { const g = new THREE.Group(); g.position.set(0, -0.68, 0.06); g.add(box(0.06, 1.3, 0.06, C(col), 0, 0.1, 0)); g.add(box(0.06, 0.06, 0.34, C(head, { metal: 0.5 }), 0, 0.72, 0.12)); ch.userData.armR.add(g); return g; };
const bowlMesh = () => { const g = new THREE.Group(); g.add(box(0.26, 0.12, 0.26, C(0x8a5a3a), 0, 0, 0.18)); g.add(box(0.2, 0.06, 0.2, C(0xf4f0e6), 0, 0.07, 0.18, { cast: false })); return g; };
const lanternMesh = () => { const g = new THREE.Group(); g.add(box(0.16, 0.22, 0.16, new THREE.MeshBasicMaterial({ color: 0xffc060 }), 0, -0.1, 0.12, { cast: false })); return g; };
function pose4(ch, kind, t, ph = 0) {
  const P = ch.userData;
  if (['fist', 'cheer', 'work', 'write', 'hammer'].includes(kind)) return pose(ch, kind, t, ph);
  if (['handsup', 'aim', 'raiseGun', 'yawn', 'crouch', 'hold', 'lookout'].includes(kind)) pose2(ch, 'idle', t, ph); else return pose3(ch, kind, t, ph);
  if (kind === 'handsup') { P.armL.rotation.x = P.armR.rotation.x = -2.9; P.armL.rotation.z = -0.25; P.armR.rotation.z = 0.25; P.head.rotation.x = -0.05; }
  if (kind === 'aim') { P.armR.rotation.x = -1.45; P.armL.rotation.x = -1.35; P.armL.rotation.z = -0.35; P.head.rotation.x = 0.05; }
  if (kind === 'raiseGun') { const j = Math.abs(Math.sin(t * 6 + ph)); P.armR.rotation.x = -2.5 - j * 0.25; P.armL.rotation.x = -1.0; P.head.rotation.x = -0.1; }
  if (kind === 'yawn') { P.armR.rotation.x = -2.2; P.armR.rotation.z = 0.5; P.head.rotation.x = -0.25 + Math.sin(t * 2) * 0.05; P.armL.rotation.x = 0.05; }
  if (kind === 'crouch') { P.legL.rotation.x = -0.9; P.legR.rotation.x = -0.9; ch.position.y = (P.baseY ?? 0) - 0.18; P.armR.rotation.x = -1.0; P.armL.rotation.x = -0.8; }
  if (kind === 'hold') { P.armR.rotation.x = -1.2; P.armL.rotation.x = -1.2; P.armL.rotation.z = -0.2; P.armR.rotation.z = 0.2; }
  if (kind === 'lookout') { P.armR.rotation.x = -2.3; P.armR.rotation.z = 0.35; P.head.rotation.x = -0.1; }
}
const flagTri = tex(24, 16, (c) => { c.fillStyle = '#1f3d99'; c.fillRect(0, 0, 8, 16); c.fillStyle = '#f4f4f4'; c.fillRect(8, 0, 8, 16); c.fillStyle = '#d0201a'; c.fillRect(16, 0, 8, 16); }, 60);
const rockM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x8a8074, 0.12); for (let i = 0; i < 14; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x5e564e); }, 61));
const rockD = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x6e645a, 0.14); for (let i = 0; i < 14; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x4a423a); }, 62));
const canvasM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xe8e2d0, 0.05); for (let x = 0; x < 16; x += 4) for (let y = 0; y < 16; y++) px(c, x, y, 0xcfc8b4); }, 63));
const strawM = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xc8a85a, 0.14); for (let y = 0; y < 16; y += 3) for (let x = 0; x < 16; x++) if (r() < 0.6) px(c, x, y, 0x9a7a3a); }, 64));
const jungleM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3e7a2e, 0.16), 65)), jungleM2 = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x2e6a2a, 0.16), 66));
const waterM = new THREE.MeshStandardMaterial({ color: 0x3a7a8a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });

function rock(scene, x, y, z, w, h, d, seed = 1) { const r = rng(seed); const g = new THREE.Group(); g.position.set(x, y, z); g.add(box(w, h, d, r() < 0.5 ? rockM : rockD, 0, h / 2, 0)); g.add(box(w * 0.5, h * 0.6, d * 0.6, rockM, w * 0.5, h * 0.3, (r() - 0.5) * d * 0.3)); scene.add(g); return g; }
function wagon(scene) { const g = new THREE.Group(); const wood = M(T.planks); g.add(box(2.6, 0.18, 1.4, wood, 0, 0.75, 0)); g.add(box(2.6, 0.45, 0.1, wood, 0, 1.05, 0.66)); g.add(box(2.6, 0.45, 0.1, wood, 0, 1.05, -0.66));
  for (const x of [-0.9, 0.9]) for (const z of [-0.78, 0.78]) g.add(box(0.8, 0.8, 0.12, C(0x3a2a1a), x, 0.42, z));
  const load = new THREE.Group(); g.add(load); for (const [x, z, c] of [[-0.6, -0.3, 0x8a6a3a], [0.1, 0.25, 0x7a5a32], [0.7, -0.25, 0x8a6a3a], [-0.2, -0.2, 0xd8d0b8]]) load.add(box(0.6, 0.55, 0.6, c === 0xd8d0b8 ? canvasM : M(T.planks), x, 1.15, z));
  g.add(box(1.4, 0.06, 0.06, C(0x5a3a1e), 2.0, 0.7, 0.3)); g.add(box(1.4, 0.06, 0.06, C(0x5a3a1e), 2.0, 0.7, -0.3)); g.userData.load = load; scene.add(g); return g; }
function mule(scene) { const g = new THREE.Group(); const m = C(0x6a5040); g.add(box(1.3, 0.6, 0.55, m, 0, 1.1, 0)); for (const x of [-0.5, 0.5]) for (const z of [-0.18, 0.18]) g.add(box(0.16, 0.8, 0.16, m, x, 0.4, z));
  g.add(box(0.5, 0.5, 0.36, m, 0.8, 1.55, 0)); g.add(box(0.4, 0.3, 0.3, C(0x5a4030), 1.08, 1.45, 0)); g.add(box(0.08, 0.3, 0.08, m, 0.72, 1.92, 0.12)); g.add(box(0.08, 0.3, 0.08, m, 0.72, 1.92, -0.12)); g.add(box(0.06, 0.06, 0.06, C(0x111111), 1.0, 1.65, 0.19, { cast: false })); scene.add(g); return g; }
function tent(scene, x, z, rot = 0, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s); for (let i = 0; i < 4; i++) g.add(box(2.6 - i * 0.62, 0.55, 3.2, canvasM, 0, 0.275 + i * 0.55, 0)); g.add(box(0.6, 1.1, 0.05, C(0x3a2e22), 0, 0.55, 1.61, { cast: false })); scene.add(g); return g; }
function spHouse(scene, x, z, w, h, rot = 0, seed = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; const wall = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xf0e8d8, 0.05), 700 + seed));
  g.add(box(w, h, 5, wall, 0, h / 2, 0)); for (let s = 0; s < 3; s++) g.add(box(w + 0.4, 0.5, 5.4 - s * 1.6, M(T.roofRed), 0, h + 0.25 + s * 0.5, 0)); g.add(box(1.1, 2.0, 0.1, C(0x5a3a1e), -w / 4, 1.0, 2.52, { cast: false })); g.add(box(0.9, 0.9, 0.1, M(T.windowDark), w / 4, 2.0, 2.52, { cast: false })); scene.add(g); return g; }
function tower(scene, x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); const wood = C(0x5a3a22); for (const a of [-0.8, 0.8]) for (const b of [-0.8, 0.8]) g.add(box(0.2, 4.2, 0.2, wood, a, 2.1, b)); g.add(box(2.2, 0.2, 2.2, M(T.planks), 0, 4.2, 0)); g.add(box(2.2, 0.6, 0.1, M(T.planks), 0, 4.6, 1.05)); g.add(box(2.2, 0.6, 0.1, M(T.planks), 0, 4.6, -1.05)); g.add(box(0.1, 0.6, 2.2, M(T.planks), 1.05, 4.6, 0)); scene.add(g); return g; }
function campfire(scene, x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); for (const r of [0, 1.57]) { const l = box(0.9, 0.14, 0.14, C(0x4a2e1a), 0, 0.1, 0); l.rotation.y = r; g.add(l); } const fm = new THREE.MeshBasicMaterial({ color: 0xffa030 }), fm2 = new THREE.MeshBasicMaterial({ color: 0xffe080 }); const f1 = box(0.36, 0.5, 0.36, fm, 0, 0.42, 0, { cast: false }), f2 = box(0.2, 0.3, 0.2, fm2, 0, 0.6, 0, { cast: false }); g.add(f1, f2);
  const L = new THREE.PointLight(0xff9a40, 0, 14, 1.4); L.position.set(0, 1.0, 0); g.add(L); g.userData = { L, f1, f2 }; scene.add(g); return g; }
function setSky(S, p) { const u = S.userData.skyM.uniforms; u.top.value.set(p.top); u.mid.value.set(p.mid); u.hor.value.set(p.hor); u.sd.value.copy(p.dir.clone().normalize()); u.sc.value.set(...(p.sc ?? [1, 0.85, 0.6]));
  S.userData.sun.color.set(p.col); S.userData.sun.intensity = p.int; S.userData.hemi.color.set(p.hs); S.userData.hemi.groundColor.set(p.hg); S.userData.hemi.intensity = p.hi; S.fog.color.set(p.fog); S.fog.near = p.fn ?? 90; S.fog.far = p.ff ?? 480; S.userData.dir = p.dir.clone().normalize(); }
function aim(S, c, size = 30) { const s = S.userData.sun; s.target.position.copy(c); s.position.copy(c).addScaledVector(S.userData.dir, 110); Object.assign(s.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 240 }); s.shadow.camera.updateProjectionMatrix(); s.target.updateMatrixWorld(); }
function baseScene(S) { const skyM = skyDome(S, 0, 0, 0).material; S.fog = new THREE.Fog(0xffffff, 90, 480); const sun = sunLight(S, 0xffffff, 3, V(0, 60, 40), V(0, 0, 0), 30, 2048); const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2); S.add(hemi); S.userData = { skyM, sun, hemi }; }
const SKY = {
  gold: { top: 0x2a58a0, mid: 0x86a8d4, hor: 0xf4c088, dir: V(-0.32, 0.36, 0.88), col: 0xffc48a, int: 3.6, hs: 0xbcd0f0, hg: 0x8a6a4a, hi: 1.3, fog: 0xc4c8d4, fn: 60, ff: 420, sc: [1, 0.75, 0.45] },
  day: { top: 0x3a78c8, mid: 0x9ac2e8, hor: 0xeadcc0, dir: V(-0.45, 0.62, 0.55), col: 0xfff0d6, int: 3.3, hs: 0xd0e0ff, hg: 0x8a7a5a, hi: 1.4, fog: 0xe4dccb },
  night: { top: 0x04060e, mid: 0x0e1630, hor: 0x1e2a4a, dir: V(0.45, 0.6, 0.5), col: 0x8a9ad8, int: 0.7, hs: 0x3a4a7a, hg: 0x0a0a12, hi: 0.5, fog: 0x0e1628, fn: 40, ff: 260, sc: [0.6, 0.7, 1.0] },
  tropic: { top: 0x3a80d0, mid: 0x9ccbe6, hor: 0xdce8dc, dir: V(-0.4, 0.72, 0.45), col: 0xfff2d8, int: 3.4, hs: 0xd0e8ff, hg: 0x5a7a4a, hi: 1.45, fog: 0xc8dccc, fn: 60, ff: 340 },
  haze: { top: 0x6a7a8a, mid: 0xa8aca4, hor: 0xc8b8a0, dir: V(-0.4, 0.55, 0.5), col: 0xffe0c0, int: 2.6, hs: 0xc8ccc8, hg: 0x5a5a4a, hi: 1.4, fog: 0xb8b0a0, fn: 40, ff: 260 },
};

// ---------- Figuren ----------
const GUER = { skin: 0xd49a70, hair: 0x5a3a22, beard: 'goatee', beardCol: 0x4a2e1a, top: 0x6a4a2e, bottom: 0x2e2a26, belt: 0xb82a22, shoe: 0x3a2a1a, eye: '#2a1a10', smile: true, seed: 51 };
const FRENCH = { skin: 0xf0c8a8, hair: 0x5a3a20, beard: 'mustache', top: 0x1f3a8a, bottom: 0xeeeeee, shoe: 0x111111, eye: '#3a5a8a', angry: true, seed: 52 };
function mkGuer(S, o = {}) { const p = humanoid({ ...GUER, ...o }); brimHat(p, o.hat ?? 0x2e2218); sling(p); gunHand(p); S.add(p); return p; }
function mkFrench(S, o = {}) { const p = humanoid({ ...FRENCH, ...o }); shako(p); crossbelts(p); sling(p); gunHand(p); S.add(p); return p; }

// =====================================================================
// SET 1: Spanien 1808 – Hochebene, Lager, Dorf, Schlucht, Felswand
// =====================================================================
const spain = new THREE.Scene(); baseScene(spain);
{
  const S = spain; clouds(S, 5, 0xfff4e8, 75, 16, 260, 0.85);
  const ground = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x8a9a52, 0.04); for (let i = 0; i < 8; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x92985a); }, 101));
  S.add(box(900, 1, 900, ground, 0, -0.5, 0, { cast: false, uvScale: 0.5 }));
  const dirtM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xb89a6a, 0.1), 102));
  S.add(box(220, 0.06, 3.6, dirtM, 0, 0.03, -20, { cast: false })); // Straße
  S.add(box(3, 0.06, 26, dirtM, 30, 0.03, -33, { cast: false }));
  // Sierra im Hintergrund
  const r = rng(110);
  for (let i = 0; i < 16; i++) { const x = -330 + i * 44 + r() * 14, z = -250 - r() * 50, w = 70 + r() * 40, h = 50 + r() * 45; for (let s = 0; s < 5; s++) S.add(box(w * (1 - s * 0.18), h / 5, w * 0.6 * (1 - s * 0.18), s % 2 ? rockM : rockD, x, h / 10 + s * h / 5, z, { cast: false })); S.add(box(w * 0.14, h / 9, w * 0.1, C(0xf4f4f6), x, h + h / 18, z, { cast: false })); }
  for (let i = 0; i < 12; i++) { const x = -220 + i * 40 + r() * 15, z = -115 - r() * 25, w = 34 + r() * 25, h = 5 + r() * 7; for (let s = 0; s < 3; s++) S.add(box(w * (1 - s * 0.25), h / 3, w * 0.7 * (1 - s * 0.25), C(s === 2 ? 0x6a8a3a : 0x7a8a46), x, h / 6 + s * h / 3, z, { cast: false })); }
  // Felswand mit Pfad (West)
  for (let i = 0; i < 6; i++) S.add(box(28 - i * 3, 3, 12 - i * 0.6, i % 2 ? rockM : rockD, -72, 1.5 + i * 3, 3 - i * 0.6));
  S.add(box(26, 0.5, 1.8, dirtM, -72, 6.25, 9.6)); S.add(box(26, 6, 0.8, rockD, -72, 3, 10.9)); // Pfad-Sims
  // Lager der Franzosen
  const tents = []; for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) tents.push(tent(S, -26 + i * 5.2, -32 - k * 6, 0, 1));
  const fl0 = flag(flagTri, 2.2, 1.5, 6.5, S, V(1.2, 0, -9), 0, 0.6), fl1 = flag(flagTri, 2.4, 1.6, 7, S, V(-16, 0, -27.5), 0, 0), fl2 = flag(flagTri, 2.0, 1.3, 6, S, V(36.5, 0, -38), 0, 1.3);
  // Dorf
  const houses = [[20, -40, 6, 4, 0.1], [23, -49, 7, 4.5, 0], [37, -47, 6, 4, -0.1], [42, -38, 6, 3.6, -0.3], [13, -51, 5, 4, 0.2], [45, -54, 6, 4.2, -0.2], [22, -58, 6, 4.4, 0.1], [33, -60, 6, 4, 0]];
  houses.forEach(([x, z, w, h, ro], i) => spHouse(S, x, z, w, h, ro, i));
  const ch = new THREE.Group(); ch.position.set(36, 0, -38); S.add(ch); const cw = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe8dcc0, 0.06), 120));
  ch.add(box(4, 13, 4, cw, 0, 6.5, -4)); for (let s = 0; s < 3; s++) ch.add(box(4.4 - s * 1.3, 1, 4.4 - s * 1.3, M(T.roofRed), 0, 13.5 + s, -4)); ch.add(box(1.4, 1.8, 0.1, C(0x2a1e16), 0, 10, -1.95, { cast: false }));
  // Weizenfeld
  S.add(box(14, 0.5, 9, M(T.wheat), 52, 0.25, -28, { cast: false }));
  // Schlucht
  [[-50, -24.5, 7, 1.4, 3], [-42.5, -24.6, 6, 1.7, 3], [-36, -24.4, 5, 1.5, 3]].forEach(([x, z, w, h, d], i) => rock(S, x, 0, z, w, h, d, 130 + i)); S.add(box(22, 1.0, 2.2, rockD, -44, 0.5, -27.2)); for (let i = 0; i < 5; i++) rock(S, -54 + i * 5, 0, -31, 5, 4 + (i % 2) * 1.5, 4, 136 + i);
  S.add(box(4.2, 0.4, 0.5, C(0x5a3a22), 17.6, 0.2, -25.0)); S.add(box(1.2, 0.4, 0.5, C(0x5a3a22), 57.4, 0.2, -13.0)); S.add(box(1.2, 0.4, 0.5, C(0x5a3a22), 60.2, 0.2, -13.6));
  // Felsen an der Hochebene (Hook)
  [[-4.8, -2.6, 2.6, 1.6, 2], [4.4, -3.4, 3.2, 2.2, 2.4], [-7, 2.5, 2, 1.0, 1.6], [6.8, 1.8, 1.8, 0.9, 1.4], [-2.4, -6.2, 3.6, 2.6, 2.6]].forEach(([x, z, w, h, d], i) => rock(S, x, 0, z, w, h, d, 140 + i));
  for (const [x, z] of [[-9, -8], [9, -9], [12, 4], [-12, 6], [-14, -14], [14, -14]]) { S.add(box(0.5, 2.2, 0.5, C(0x5a4030), x, 1.1, z)); S.add(box(2.6, 1.6, 2.6, C(0x5a7a34), x, 2.8, z)); S.add(box(1.6, 0.8, 1.6, C(0x6a8a3a), x, 3.9, z)); }
  // Ebene der Schlacht (Ost)
  [[48, 26, 4, 1.6, 3], [52, 28, 3, 1.1, 2.4]].forEach(([x, z, w, h, d], i) => rock(S, x, 0, z, w, h, d, 150 + i));
  // Wachtürme an der Straße
  const towers = [44, 56, 68, 80].map(x => tower(S, x, -16.6)); const fire = campfire(S, 58.6, -14.2);
  // Wagen + Maultier
  const wag = wagon(S), mul = mule(S);
  // Kanone (zerstört)
  const can = new THREE.Group(); can.add(box(0.5, 0.5, 2.4, C(0x3a3c40, { metal: 0.6, rough: 0.4 }), 0, 0.7, 0)); can.add(box(0.12, 1.0, 1.0, C(0x4a3020), 0.5, 0.5, -0.3)); can.add(box(0.9, 0.12, 0.9, C(0x4a3020), -0.6, 0.06, -0.4)); can.rotation.set(0.12, 0.6, 0.18); can.position.set(18, 0, -27); S.add(can);
  // Figuren
  const guer = mkGuer(S), fr = mkFrench(S);
  const guers = [0, 1, 2, 3].map(i => mkGuer(S, { skin: [0xc8906a, 0xd8a47a, 0xb88058, 0xd0986e][i], top: [0x8a5a2e, 0x4a5a3a, 0x7a3a2a, 0x5a4a3a][i], beard: ['short', undefined, 'mustache', 'goatee'][i], belt: [0x2a4a8a, 0xb82a22, 0x3a7a3a, 0xb82a22][i], seed: 160 + i, smile: false, hat: [0x3a2a1a, 0x4a3a2a, 0x2a2a2a, 0x5a4030][i] }));
  const frs = []; for (let i = 0; i < 30; i++) { const p = mkFrench(S, { skin: [0xf0c8a8, 0xe8b894, 0xf2cdb0, 0xe0a882][i % 4], hair: [0x5a3a20, 0x2a1a14, 0x8a5a2a][i % 3], beard: i % 3 ? 'mustache' : undefined, angry: i % 2 === 0, seed: 170 + (i % 8) }); frs.push(p); }
  const spSold = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xd8a47a, 0xc8906a, 0xe0b08a][i], hair: 0x1e1712, top: 0xf0ece0, bottom: 0xf0ece0, belt: 0xc8201a, beard: i === 1 ? 'mustache' : undefined, sad: true, seed: 190 + i }); beret(p, 0x1a1a3a); S.add(p); return p; });
  const farmer = humanoid({ skin: 0xc8906a, hair: 0x2a1e16, beard: 'short', top: 0xe8e0c8, bottom: 0x6a5a3a, belt: 0x2a4a8a, angry: true, seed: 195 }); brimHat(farmer, 0xc8a85a); const fork = toolHand(farmer, 0x6a4a2a, 0x8a8e94); S.add(farmer);
  const villagers = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xd8a47a, 0xc8906a, 0xe0b08a][i], hair: [0x1e1712, 0x2a1e16, 0x4a3a2a][i], top: [0x8a2a2a, 0x2a4a6a, 0x5a6a3a][i], bottom: 0x3a2e22, longHair: i !== 1, skirt: i !== 1, sad: true, seed: 196 + i }); S.add(p); return p; });
  setSky(S, SKY.gold);
  S.userData = { ...S.userData, guer, fr, guers, frs, spSold, farmer, fork, villagers, wag, mul, fire, fl0, fl1, fl2, towers };
}

// =====================================================================
// SET 2: Vietnam / China – Dschungel, Dorf, Reisfelder, US-Basis
// =====================================================================
const viet = new THREE.Scene(); baseScene(viet);
{
  const S = viet; clouds(S, 8, 0xffffff, 70, 22, 260, 0.9);
  S.add(box(900, 1, 900, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x427a30, 0.05), 67)), 0, -0.5, 0, { cast: false, uvScale: 0.5 }));
  const river = new THREE.Mesh(new THREE.PlaneGeometry(400, 10), waterM); river.rotation.x = -Math.PI / 2; river.position.set(0, 0.04, -34); S.add(river);
  // Reisfelder
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) { const x = 8 + i * 7.4, z = 12 + k * 7.4; S.add(box(7.4, 0.3, 0.4, C(0x6a5a3a), x, 0.15, z - 3.7)); S.add(box(0.4, 0.3, 7.4, C(0x6a5a3a), x - 3.7, 0.15, z));
    const w = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ color: 0x7aa8a0, roughness: 0.2, metalness: 0.1 })); w.rotation.x = -Math.PI / 2; w.position.set(x, 0.08, z); S.add(w);
    const r = rng(200 + i * 3 + k); for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) if (r() < 0.8) S.add(box(0.18, 0.4, 0.18, C(0x7ac04a), x - 3 + a, 0.25, z - 3 + b, { cast: false })); }
  // Teich mit Fischen
  const pond = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), waterM); pond.rotation.x = -Math.PI / 2; pond.position.set(-7, 0.06, 7); S.add(pond); S.add(box(5.4, 0.25, 0.3, rockM, -7, 0.12, 5), box(5.4, 0.25, 0.3, rockM, -7, 0.12, 9), box(0.3, 0.25, 4, rockM, -9.6, 0.12, 7), box(0.3, 0.25, 4, rockM, -4.4, 0.12, 7));
  const fish = [0, 1, 2, 3].map(i => { const f = new THREE.Group(); f.add(box(0.36, 0.1, 0.16, C([0xf08a30, 0xe85a20, 0xf0f0f0, 0xf0a030][i]), 0, 0, 0, { cast: false })); f.add(box(0.1, 0.12, 0.16, C(0xd84a1a), -0.22, 0, 0, { cast: false })); S.add(f); return f; });
  // Hütten auf Stelzen
  const hut = (x, z, ro = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ro; for (const a of [-1.6, 1.6]) for (const b of [-1.3, 1.3]) g.add(box(0.2, 1.0, 0.2, C(0x5a4030), a, 0.5, b)); g.add(box(3.6, 0.2, 3.0, M(T.planks), 0, 1.0, 0)); g.add(box(3.4, 2.0, 2.8, M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xb8945a, 0.1); for (let x2 = 0; x2 < 16; x2 += 2) for (let y = 0; y < 16; y++) px(c, x2, y, 0x8a6a3a); }, 210)), 0, 2.1, 0));
    for (let s = 0; s < 4; s++) g.add(box(4.2 - s * 1.0, 0.45, 3.6, strawM, 0, 3.3 + s * 0.45, 0)); g.add(box(0.9, 1.5, 0.08, C(0x2a1e14), 0.6, 1.85, 1.42, { cast: false })); S.add(g); return g; };
  [[-2, -4, 0], [-13, -2, 0.3], [6, -8, -0.2], [-8, -12, 0.1], [3, 2.8, 0.15]].forEach(a => hut(...a));
  const burnt = new THREE.Group(); burnt.position.set(-14, 0, 12); S.add(burnt); for (const a of [-1.6, 1.6]) for (const b of [-1.3, 1.3]) burnt.add(box(0.22, 1.6 + Math.abs(a + b) * 0.3, 0.22, C(0x1a1612), a, 0.8, b)); burnt.add(box(3.4, 0.2, 2.8, C(0x2a221c), 0.2, 0.95, 0)); burnt.add(box(1.6, 0.6, 1.2, C(0x1a1612), -0.6, 0.3, 0.4));
  const smk = smoke(S, -14, 1.0, 12, 14, 7, 0x4a4642);
  // Dschungel
  const r = rng(220); const clear = [[0, 2, 18], [60, 0, 16], [-40, 20, 9], [16, 16, 10], [-14, 10, 5]];
  const jtree = (x, z, h) => { S.add(box(0.7, h, 0.7, C(0x4a3a26), x, h / 2, z)); S.add(box(4.2, 1.6, 4.2, r() < 0.5 ? jungleM : jungleM2, x, h + 0.4, z)); S.add(box(2.8, 1.2, 2.8, jungleM, x, h + 1.6, z)); if (r() < 0.5) S.add(box(1.8, 0.4, 1.8, jungleM2, x + 1.8, h - 0.8, z + 0.6)); };
  for (let i = 0; i < 420; i++) { const x = -120 + r() * 260, z = -80 + r() * 160; if (clear.some(([cx, cz, rr]) => Math.hypot(x - cx, z - cz) < rr)) continue; if (Math.abs(z + 34) < 6) continue; jtree(x, z, 4 + r() * 6); }
  for (let i = 0; i < 160; i++) { const x = -120 + r() * 260, z = -80 + r() * 160; if (clear.some(([cx, cz, rr]) => Math.hypot(x - cx, z - cz) < rr - 2)) continue; S.add(box(1.4, 0.9, 1.4, jungleM2, x, 0.45, z, { cast: false })); }
  // US-Basis
  const B = new THREE.Group(); B.position.set(60, 0, 0); S.add(B);
  B.add(box(30, 0.06, 26, M(tex(16, 16, (c, rr) => noiseFill(c, rr, 16, 16, 0x9a8a5a, 0.12), 230)), 0, 0.03, 0, { cast: false }));
  for (let i = 0; i < 8; i++) B.add(box(1.2, 0.5, 0.6, C(0xa8986a), -8 + i * 1.25, 0.25, 7.5));
  const olive = C(0x56603a); const tank = new THREE.Group(); tank.position.set(-5, 0, 2); tank.rotation.y = 0.4; B.add(tank);
  tank.add(box(3.4, 0.9, 2.2, olive, 0, 0.75, 0)); tank.add(box(3.6, 0.6, 0.5, C(0x2a2a26), 0, 0.35, 1.05)); tank.add(box(3.6, 0.6, 0.5, C(0x2a2a26), 0, 0.35, -1.05)); tank.add(box(1.7, 0.6, 1.5, olive, -0.2, 1.5, 0)); tank.add(box(2.4, 0.18, 0.18, C(0x4a5030), 1.6, 1.55, 0)); tank.add(box(0.5, 0.3, 0.5, C(0xe8e8e8), 0, 1.25, 1.1, { cast: false }));
  const heli = new THREE.Group(); heli.position.set(4, 0, -2); B.add(heli);
  heli.add(box(3.0, 1.6, 1.6, olive, 0, 1.3, 0)); heli.add(box(1.2, 1.2, 1.5, new THREE.MeshStandardMaterial({ color: 0x5a7a8a, roughness: 0.2, metalness: 0.3 }), 1.9, 1.2, 0)); heli.add(box(4.0, 0.4, 0.4, olive, -3.2, 1.6, 0)); heli.add(box(0.3, 1.1, 0.12, olive, -5.1, 2.0, 0)); heli.add(box(3.2, 0.1, 0.1, C(0x2a2a2a), 0, 0.12, 0.7)); heli.add(box(3.2, 0.1, 0.1, C(0x2a2a2a), 0, 0.12, -0.7)); heli.add(box(0.3, 0.4, 0.3, C(0x2a2a2a), 0, 2.25, 0));
  const rotor = new THREE.Group(); rotor.position.set(0, 2.5, 0); rotor.add(box(7.4, 0.06, 0.3, C(0x1e1e1e), 0, 0, 0)); rotor.add(box(0.3, 0.06, 7.4, C(0x1e1e1e), 0, 0, 0)); heli.add(rotor); heli.add(box(0.12, 0.6, 0.1, C(0xe8e8e8), 0.2, 1.3, 0.81, { cast: false }));
  for (const [x, z] of [[10, 8], [12.6, 8]]) { const g = new THREE.Group(); g.position.set(x, 0, z); for (let i = 0; i < 4; i++) g.add(box(2.4 - i * 0.58, 0.55, 3.0, olive, 0, 0.275 + i * 0.55, 0)); B.add(g); }
  // Flugzeuge
  const plane = () => { const g = new THREE.Group(); const m = C(0x6a6e64, { metal: 0.4, rough: 0.5 }); g.add(box(8, 1.0, 1.0, m, 0, 0, 0)); g.add(box(1.6, 0.18, 12, m, 0.4, 0, 0)); g.add(box(1.0, 1.6, 0.14, m, -3.6, 0.8, 0)); g.add(box(0.9, 0.14, 3.4, m, -3.6, 0.2, 0)); for (const z of [-3, 3]) g.add(box(1.2, 0.5, 0.5, m, 0.8, -0.3, z)); S.add(g); return g; };
  const planes = [plane(), plane(), plane()];
  const smokes = [smoke(S, -30, 0, -60, 16, 11, 0x5a5650), smoke(S, 10, 0, -70, 16, 12, 0x6a6660), smoke(S, -60, 0, -50, 16, 13, 0x5a5650)];
  // Figuren
  const vcO = (i, o = {}) => ({ skin: [0xd8a878, 0xc8986a, 0xe0b080, 0xcf9e70][i % 4], hair: 0x141010, top: 0x1c1c22, bottom: 0x1c1c22, shoe: 0x3a2a1a, eye: '#2a1a10', seed: 240 + i, ...o });
  const vcs = [0, 1, 2, 3].map(i => { const p = humanoid(vcO(i)); coneHat(p); sling(p); gunHand(p); S.add(p); return p; });
  const farmerV = humanoid(vcO(5, { smile: true })); coneHat(farmerV); sling(farmerV); gunHand(farmerV); const hoe = toolHand(farmerV, 0x6a4a2a, 0x6a6e74); S.add(farmerV);
  const usO = (i, o = {}) => ({ skin: [0xf0c8a8, 0x8a5a3a, 0xe8b894, 0xc89a72][i % 4], hair: [0x5a3a20, 0x1a1a1a, 0x8a5a2a, 0x2a1a14][i % 4], top: 0x56603a, bottom: 0x56603a, shoe: 0x2a2a22, hat: 'helmet', seed: 260 + i, ...o });
  const uss = [0, 1, 2, 3, 4, 5].map(i => { const p = humanoid(usO(i)); p.userData.hatExtra = 0.25; sling(p); gunHand(p); S.add(p); return p; });
  const mao = humanoid({ skin: 0xe8c098, hair: 0x141010, hairVol: true, top: 0x5a6070, bottom: 0x5a6070, shoe: 0x2a2a2a, eye: '#2a1a10', seed: 280 }); mao.userData.body.add(box(0.5, 0.1, 0.27, C(0x4a4e5c), 0, 1.4, 0, { cast: false })); S.add(mao);
  const chi = [0, 1, 2].map(i => { const p = humanoid({ skin: [0xe8c098, 0xd8b088, 0xe0b890][i], hair: 0x141010, top: [0x3a5a8a, 0x2a4a7a, 0x4a6a9a][i], bottom: 0x2a2a3a, longHair: i === 1, skirt: false, smile: true, seed: 282 + i }); S.add(p); return p; });
  const bowl = inHand(chi[0], bowlMesh());
  const fighters = [0, 1].map(i => { const p = humanoid({ skin: [0xe0b890, 0xd8b088][i], hair: 0x141010, top: 0x4a5a3a, bottom: 0x4a5a3a, smile: true, seed: 290 + i }); beret(p, 0x3a4a2a); sling(p); gunHand(p); S.add(p); return p; });
  const civ = [0, 1, 2].map(i => { const p = humanoid(vcO(10 + i, { top: [0x8a6a4a, 0x3a3a5a, 0xa89a7a][i], bottom: [0x2a2a2a, 0x3a3a3a, 0x2a2a2a][i], longHair: i === 0, hair: i === 2 ? 0xd8d8d8 : 0x141010, sad: true, scale: i === 1 ? 0.62 : 0.95 })); S.add(p); return p; });
  const army = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xc8906a, 0xd8a47a, 0xb88058, 0xc89a72][i], hair: 0x1a1a1a, top: 0x6a6a4a, bottom: 0x6a6a4a, shoe: 0x2a2a22, angry: true, seed: 300 + i }); beret(p, 0x8a2a2a); sling(p); gunHand(p); S.add(p); return p; });
  const che = [0, 1].map(i => { const p = humanoid({ skin: [0xe0b08a, 0xc8906a][i], hair: 0x2a1e16, beard: i ? 'short' : 'full', top: 0x4a5a3a, bottom: 0x4a5a3a, sad: true, seed: 310 + i }); beret(p, 0x1a1a1a); S.add(p); return p; });
  const nightL = [0, 1].map(() => { const L = new THREE.PointLight(0xffb060, 0, 10, 1.5); S.add(L); return L; });
  setSky(S, SKY.tropic);
  S.userData = { ...S.userData, vcs, farmerV, hoe, uss, mao, chi, bowl, fighters, civ, army, che, heli, rotor, tank, planes, smokes, smk, burnt, fish, nightL };
}

// =====================================================================
// SET 3: Tunnel-Querschnitt
// =====================================================================
const tunnel = new THREE.Scene(); baseScene(tunnel);
{
  const S = tunnel; const soil = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x7a5232, 0.14); for (let i = 0; i < 8; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x5a3a22); }, 320)), soilD = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x3e2a1a, 0.12), 321));
  const holes = [[-9.05, 9.05, -2.65, -0.45], [-2.05, -0.75, -0.45, 0.05], [4.95, 6.25, -5.45, -0.45], [-7.05, 7.05, -5.45, -3.05], [-1.05, -0.15, -3.05, -2.55]]; // [x0,x1,y0,y1]
  const isHole = (x, y) => holes.some(([a, b, c, d]) => x >= a && x < b && y >= c && y < d);
  for (let x = -16; x < 16; x += 0.8) for (let y = -9; y < 0; y += 0.8) { const cx = x + 0.4, cy = y + 0.4; if (isHole(cx, cy)) continue; S.add(box(0.8, 0.8, 2, Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5) % 1 < 0.12 ? soilD : soil, cx, cy, 0, { cast: false })); }
  S.add(box(32, 10, 1, soilD, 0, -4.5, -1.4, { cast: false }));
  S.add(box(32, 0.3, 2.4, jungleM, 0, 0.15, 0, { cast: false })); S.add(box(200, 0.3, 120, jungleM, 0, 0.15, -61.3, { cast: false }));
  const r = rng(330); for (let i = 0; i < 60; i++) { const x = -60 + r() * 120, z = -4 - r() * 50, h = 4 + r() * 5; S.add(box(0.6, h, 0.6, C(0x4a3a26), x, h / 2, z)); S.add(box(3.6, 1.4, 3.6, r() < 0.5 ? jungleM : jungleM2, x, h + 0.4, z)); }
  for (const x of [-12, 9]) { S.add(box(0.6, 6, 0.6, C(0x4a3a26), x, 3.3, -0.4)); S.add(box(3.6, 1.6, 3.6, jungleM, x, 6.6, -0.4)); }
  const lamps = [[-5, -1.0], [3.5, -3.6], [-3, -3.6]].map(([x, y]) => { S.add(box(0.2, 0.25, 0.2, new THREE.MeshBasicMaterial({ color: 0xffc060 }), x, y + 0.2, -0.6, { cast: false })); const L = new THREE.PointLight(0xffa850, 4, 6, 1.4); L.position.set(x, y, 0.2); S.add(L); return L; });
  const vcO = (i) => ({ skin: [0xd8a878, 0xc8986a, 0xe0b080][i], hair: 0x141010, top: 0x1c1c22, bottom: 0x1c1c22, shoe: 0x3a2a1a, eye: '#2a1a10', seed: 340 + i });
  const tv = [0, 1, 2].map(i => { const p = humanoid({ ...vcO(i), scale: 0.78 }); S.add(p); return p; });
  const us = humanoid({ skin: 0xf0c8a8, hair: 0x5a3a20, top: 0x56603a, bottom: 0x56603a, shoe: 0x2a2a22, hat: 'helmet', seed: 350 }); us.userData.hatExtra = 0.25; sling(us); S.add(us);
  setSky(S, SKY.tropic); S.userData.dir = V(-0.3, 0.8, 0.5);
  S.userData = { ...S.userData, tv, us };
}

// =====================================================================
// SET 4: USA – Protest in der Stadt
// =====================================================================
const usa = new THREE.Scene(); baseScene(usa);
{
  const S = usa; S.add(box(400, 1, 400, M(T.concrete), 0, -0.5, 0, { cast: false })); S.add(box(12, 0.04, 200, C(0x3a3a3e), 0, 0.02, 0, { cast: false }));
  const r = rng(400); for (let i = 0; i < 9; i++) for (const side of [-1, 1]) { const h = 10 + r() * 14, z = -40 + i * 9; const m = r() < 0.5 ? M(T.brick) : M(T.brickGrey); S.add(box(8.6, h, 8.6, m, side * 11, h / 2, z)); for (let y = 2.5; y < h - 1; y += 3) for (const dz of [-2.4, 0, 2.4]) S.add(box(0.1, 1.5, 1.2, M(T.windowDark), side * 6.68, y, z + dz, { cast: false })); }
  const signTex = (txt, bg) => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const c = cv.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 256, 160); c.fillStyle = '#1a1a1a'; c.textAlign = 'center'; c.textBaseline = 'middle'; let s = 64; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 230) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillText(txt, 128, 84); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const TXT = [['PEACE', '#f4f0e0'], ['STOP THE WAR', '#f0d040'], ['BRING THEM HOME', '#f4f0e0'], ['PEACE NOW', '#9ad0f0'], ['NO WAR', '#f4f0e0'], ['PEACE', '#f0a0b0'], ['END THE WAR', '#f4f0e0']];
  const prot = []; const signs = [];
  for (let i = 0; i < 14; i++) { const p = humanoid({ skin: [0xf0c8a8, 0x8a5a3a, 0xe8b894, 0xc89a72, 0xf2cdb0][i % 5], hair: [0x8a5a2a, 0x1a1a1a, 0xc8a05a, 0x3a2a1a, 0x5a3820][i % 5], longHair: i % 2 === 0, hairVol: i % 2 === 1, top: [0xd85a3a, 0x3a8ab8, 0xe8b830, 0x8a3ab8, 0x3ab87a, 0xf0f0f0, 0xb85a8a][i % 7], bottom: [0x3a5a9a, 0x2a2a3a, 0x6a4a2a][i % 3], smile: false, seed: 410 + (i % 9) }); S.add(p); prot.push(p);
    if (i < 9) { const [txt, bg] = TXT[i % TXT.length]; const g = new THREE.Group(); g.position.set(0, -0.68, 0.05); g.add(box(0.06, 1.3, 0.06, C(0x8a6a4a), 0, 0.6, 0)); const sm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.05), [C(0xddd), C(0xddd), C(0xddd), C(0xddd), new THREE.MeshStandardMaterial({ map: signTex(txt, bg), roughness: 0.9 }), C(0xddd)]); sm.position.set(0, 1.5, 0.05); g.add(sm); p.userData.armR.add(g); signs.push(g); } }
  setSky(S, SKY.day);
  S.userData = { ...S.userData, prot };
}

// =====================================================================
// SET 5: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901); for (let i = 0; i < 10; i++) { const x = -120 + i * 26, w = 24 + r() * 20, h = 12 + r() * 18; for (let s = 0; s < 3; s++) dusk.add(box(w * (1 - s * 0.25), h / 3, w * 0.6, rockD, x, h / 6 + s * h / 3, -110 - r() * 20, { cast: false })); }
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
  fit('KISSINGER, 1969', 72, 150, '#a3241c'); fit('DIE GUERILLA GEWINNT,', 60, 290, '#3a2a1e'); fit('WENN SIE NICHT VERLIERT', 60, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 73.355; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'spain'], [9, 'occupy'], [15, 'defeated'], [20, 'farmers'], [26, 'paths'], [33, 'battle'], [42, 'ambush'], [47, 'vanish'], [51, 'more'], [65, 'term'],
  [72, 'strong'], [85, 'weak'], [91, 'retreat'], [96, 'tired'], [111, 'fish'], [126, 'support'], [137, 'vietnam'], [142, 'usbase'], [149, 'bombs'], [158, 'tunnels'], [166, 'day'], [172, 'night'],
  [174, 'win'], [180, 'withdraw'], [185, 'home'], [193, 'asym'], [198, 'heroic'], [203, 'civil'], [213, 'lose'], [226, 'end'], [241, 'sign'], [246, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json
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
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const hideAll = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); arm(p, false); p.rotation.set(0, 0, 0); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const face = (ch, x, z) => Math.atan2(x - ch.position.x, z - ch.position.z); // Blickrichtung zu Punkt

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = spain, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Spanien ----------
  const SP = ['hero', 'loop', 'spain', 'occupy', 'defeated', 'farmers', 'paths', 'battle', 'ambush', 'vanish', 'more', 'term', 'strong', 'weak', 'retreat', 'tired', 'heroic', 'end'];
  if (SP.includes(sh.id)) {
    scene = spain; const Sd = spain.userData; const ta = sh.id === 'loop' ? t - DUR : t;
    const { guer, fr, guers, frs, spSold, farmer, villagers, wag, mul, fire } = Sd;
    hideAll([guer, fr, ...guers, ...frs, ...spSold, farmer, ...villagers]); wag.visible = mul.visible = false; wag.userData.load.visible = true; fire.userData.L.intensity = 0; fire.visible = false;
    Sd.fl0.userData.update(ta); Sd.fl1.userData.update(ta); Sd.fl2.userData.update(ta);
    const night = sh.id === 'tired'; setSky(spain, night ? SKY.night : ['hero', 'loop', 'spain', 'heroic', 'end', 'term'].includes(sh.id) ? SKY.gold : SKY.day); if (night) exp = 1.5;
    const camp = (n, x0, z0, cols = 6, walk = false, dir = 0) => { for (let i = 0; i < n; i++) { const p = frs[i]; put(p, x0 + (i % cols) * 1.3, 0, z0 + Math.floor(i / cols) * 1.4, dir); pose4(p, walk ? 'walk' : 'idle', t, i * 0.7); } };
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'spain') {
      put(guer, HX, 0, HZ, 0.5); put(fr, HX2, 0, HZ, -0.5); pose4(guer, 'idle', ta, 0); pose4(fr, 'cross', ta, 1); guer.userData.head.rotation.y = 0.3; fr.userData.head.rotation.y = -0.25;
      for (let i = 0; i < 6; i++) { const p = frs[i]; put(p, -21 + i * 1.6, 0, -24, 0); pose4(p, 'idle', ta, i); }
      put(guers[0], -3.9, 1.6, -2.4, 0.4); pose4(guers[0], 'idle', ta, 2); put(guers[1], 4.0, 2.2, -3.2, -0.4); pose4(guers[1], 'idle', ta, 3);
      heroCam(ta); aim(spain, V(0, 0, -6), 34);
      if (sh.id !== 'spain') { tag(guer, 'Guerillero', HERO); tag(fr, 'Soldat Napoleons', BAD); }
      if (sh.id === 'spain') { mv(u, V(-30, 22, 28), V(-27, 20.5, 24), V(28, 2, -44), V(30, 2, -45), 44); aim(spain, V(10, 0, -30), 50); info(wt(4), 'Spanien, 1808'); }
    }
    if (sh.id === 'occupy') { for (let i = 0; i < 12; i++) { const p = frs[i]; const z = -52 + (t - sh.a) * 1.4 + Math.floor(i / 3) * 1.6; put(p, 29 + (i % 3) * 1.1 - 1.1, 0, z, 0); pose4(p, 'walk', t, i); }
      villagers.forEach((p, i) => { put(p, [24.6, 32.8, 33.6][i], 0, [-43.0, -41.6, -42.4][i], [1.2, -1.0, -1.3][i]); pose4(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      mv(u, V(31.0, 2.0, -35.5), V(30.8, 1.95, -36.4), V(29.3, 1.3, -48), V(29.3, 1.3, -48), 46); aim(spain, V(30, 0, -48), 26); tag(frs[1], 'Franzosen', BAD); tag(villagers[0], 'Dorf', ALLY); }
    if (sh.id === 'defeated') { spSold.forEach((p, i) => { put(p, [16.2, 17.6, 19.0][i], 0, [-24.6, -24.2, -24.8][i], [0.4, 0.05, -0.3][i]); pose4(p, 'sadidle', t, i); sitPose(p, 0.42); p.userData.setFace({ sad: true }); });
      put(frs[0], 21.4, 0, -26.2, -0.7); pose4(frs[0], 'cross', t);
      mv(u, V(18.4, 2.2, -15.6), V(18.3, 2.15, -16.4), V(18, 0.5, -25), V(18, 0.5, -25), 46); aim(spain, V(18, 0, -25), 15); tag(spSold[1], 'Spanier', GREY); tag(frs[0], 'Franzose', BAD); chat(wt(17), red('Spanische Armee wurde besiegt')); }
    if (sh.id === 'farmers') { put(farmer, 48.4, 0, -22.6, 0.25); pose4(farmer, 'fist', t); farmer.userData.armR.rotation.x = -2.6;
      villagers.forEach((p, i) => { if (i === 2) return; put(p, [46.6, 50.2][i], 0, [-23.8, -23.9][i], [0.45, -0.4][i]); pose4(p, 'cross', t, i); p.userData.setFace({ angry: true }); });
      mv(u, V(49.0, 1.9, -16.0), V(48.9, 1.85, -16.8), V(48.4, 0.8, -23), V(48.4, 0.8, -23), 46); aim(spain, V(48, 0, -24), 15); tag(farmer, 'Bauer', HERO); }
    if (sh.id === 'paths') { [guer, guers[0], guers[1]].forEach((p, i) => { const x = -77 + (t - sh.a) * 1.5 + i * 1.5; put(p, x, 6.5, 9.6, Math.PI / 2 + 0.35); pose4(p, 'walk', t, i); });
      mv(u, V(-68.0, 7.9, 19.0), V(-67.6, 8.0, 18.2), V(-73.0, 7.4, 9.6), V(-72.0, 7.4, 9.6), 44); aim(spain, V(-72, 4, 6), 18); tag(guer, 'Guerillero', HERO); }
    if (sh.id === 'battle') { camp(30, 58, 10, 6, false, -0.9);
      [guer, guers[0], guers[1]].forEach((p, i) => { put(p, [47.4, 48.6, 51.6][i], [1.6, 1.6, 1.1][i], [25.6, 26.6, 27.4][i], 0.3); pose4(p, 'crouch', t, i); });
      mv(u, V(42, 7, 36), V(42.5, 6.6, 34.6), V(56, 1.2, 17), V(56, 1.2, 17), 46); aim(spain, V(56, 0, 20), 24);
      if (t >= wt(35)) tag(frs[14], 'Große Armee', BAD, 0.4); if (t >= wt(39)) tag(guer, 'Kleine Gruppe', HERO); }
    if (sh.id === 'ambush' || sh.id === 'weak' || sh.id === 'vanish') {
      const go = sh.id === 'vanish' ? 1 : clamp01((t - sh.a) / 0.8); wag.visible = mul.visible = true; wag.position.set(-46 + (sh.id === 'vanish' ? 0 : smoother(go) * 1.2 - 1.2), 0, -20); mul.position.set(wag.position.x + 3.3, 0, -20);
      if (sh.id === 'vanish') wag.userData.load.visible = false;
      put(fr, -45.2, 0, -18.3, 0.5); pose4(fr, sh.id === 'vanish' ? 'idle' : t > sh.a + 0.35 ? 'handsup' : 'walk', t); if (sh.id === 'vanish') fr.userData.head.rotation.y = Math.sin(t * 3.5) * 0.7;
      const up = clamp01((t - sh.a - 0.15) / 0.25);
      if (sh.id !== 'vanish') [guer, guers[0], guers[1]].forEach((p, i) => { put(p, [-48.6, -44.0, -40.6][i], lerp(0, 1.0, smoother(up)), -26.9, [0.3, 0.0, -0.3][i]); pose4(p, 'raiseGun', t, i); arm(p, true); });
      if (sh.id === 'weak') { put(guers[2], -50.4, 0, -16.4, 0.9 + Math.PI / 2); pose4(guers[2], 'aim', t); arm(guers[2], true); }
      if (sh.id === 'vanish') { mv(u, V(-41, 2.4, -12.5), V(-41.4, 2.3, -13.2), V(-45.6, 1.3, -19.5), V(-45.6, 1.3, -19.5), 46); chat(wt(48), gray('Die Guerilla ist verschwunden')); }
      else mv(u, V(-44.5, 2.2, -11.2), V(-44.6, 2.15, -12.0), V(-45.5, 2.0, -21), V(-45.5, 2.2, -21), 50);
      aim(spain, V(-45, 0, -20), 16);
      if (sh.id !== 'vanish') { tag(guer, 'Guerilla', HERO); tag(fr, 'Bote', BAD); } else tag(fr, 'Bote', BAD);
      if (sh.id === 'ambush') toast(wt(44), 'Hinterhalt!', 'Nachschub erbeutet', 'crate');
      if (sh.id === 'weak') tip(wt(88), 'check', 'Regel 2', '#55ff55', [green('Angreifen, wo er schwach ist')]); }
    if (sh.id === 'more') { for (let i = 0; i < 30; i++) { const p = frs[i]; const x = 30 - (t - sh.a) * 1.4 + (i % 15) * 1.6 * 1.0 - (i % 15) * 0.0; put(p, -8 + (i % 15) * 1.7 - (t - sh.a) * 1.3, 0, -20.5 + Math.floor(i / 15) * 1.2, -Math.PI / 2 + 0.4); pose4(p, 'walk', t, i); }
      mv(u, V(-10.5, 2.4, -11), V(-13.5, 5.6, -6.5), V(0, 1.4, -21), V(-2, 1.2, -24), 48); aim(spain, V(0, 0, -22), 26); tag(frs[2], 'Nachschub', BAD);
      tip(wt(60), 'helmet', 'Gebundene Truppen', '#ff5555', [gray('Fast 300.000 Soldaten'), gray('stecken in Spanien fest')]); }
    if (sh.id === 'term') { put(guer, 3.0, 0, 5.2, 0.15); pose4(guer, 'idle', t); arm(guer, false);
      mv(u, V(3.4, 1.62, 8.2), V(3.35, 1.6, 7.6), V(3.0, 1.55, 5.2), V(3.0, 1.6, 5.2), 46); aim(spain, V(3, 0, 5), 12); tag(guer, 'Guerillero', HERO);
      tip(wt(69), 'sword', 'Guerilla', '#ffff55', [gray('span. guerra = Krieg'), gray('guerrilla = kleiner Krieg')]); }
    if (sh.id === 'strong') { for (let i = 0; i < 24; i++) { const p = frs[i]; put(p, -20 + (i % 12) * 1.5 + (t - sh.a) * 1.0, 0, -20.6 + Math.floor(i / 12) * 1.2, Math.PI / 2 - 0.35); pose4(p, 'walk', t, i); }
      [guer, guers[0]].forEach((p, i) => { put(p, [-5.0, -2.8][i], [1.6, 2.6][i], [-2.6, -6.0][i], [-0.3, 0.2][i]); pose4(p, 'crouch', t, i); });
      mv(u, V(-1.5, 4.6, 3.2), V(-2.1, 4.5, 2.3), V(-8, 0.8, -14), V(-8, 0.8, -14), 50); aim(spain, V(-6, 0, -12), 22); tag(guer, 'Guerilla', HERO); tag(frs[5], 'Armee', BAD, 0.4);
      tip(wt(76), 'x', 'Regel 1', '#ff5555', [red('Nie angreifen, wo er stark ist')]); }
    if (sh.id === 'retreat') { [guer, guers[0], guers[1]].forEach((p, i) => { const k = (t - sh.a) * 2.6; put(p, -74 + k * 0.9 + i * 1.3, 6.5, 9.6, Math.PI / 2 + 0.55); pose4(p, 'jog', t, i); });
      mv(u, V(-66.0, 8.1, 18.4), V(-65.6, 8.2, 17.8), V(-71.0, 7.4, 9.6), V(-70.0, 7.4, 9.6), 46); aim(spain, V(-70, 4, 6), 18); tag(guer, 'Guerilla', HERO); chat(wt(92), gray('Rückzug in die Berge')); }
    if (sh.id === 'tired') { fire.visible = true; fire.userData.L.intensity = 14 + Math.sin(t * 13) * 2; fire.userData.f1.scale.y = 1 + Math.sin(t * 11) * 0.15;
      Sd.towers.forEach((tw, i) => { const p = frs[i]; put(p, 44 + i * 12, 4.3, -16.6, 0.3); pose4(p, 'idle', t, i); });
      put(frs[5], 57.4, 0, -12.8, 0.6); pose4(frs[5], t >= wt(103) ? 'yawn' : 'sadidle', t); sitPose(frs[5], 0.42); frs[5].userData.setFace({ sad: true });
      put(frs[6], 60.2, 0, -13.4, -0.7); pose4(frs[6], 'sadidle', t, 2); frs[6].userData.setFace({ sad: true });
      const k = smoother(clamp01((t - sh.a) / (wt(102) - sh.a)));
      cam(V(lerp(36, 58.8, k), lerp(9, 2.5, k), lerp(-2, -4.6, k)), V(lerp(62, 58.6, k), lerp(3, 1.0, k), lerp(-17, -13.5, k)), 48); aim(spain, V(58, 0, -15), 30);
      if (t < wt(102)) { Sd.towers.forEach((tw, i) => tag(frs[i], 'Wache', BAD)); } else { tag(frs[5], 'Soldat', BAD); tag(frs[6], 'Soldat', BAD); eff(wt(104), 'Erschöpfung', 'II', '#8a8aff'); chat(wt(108), red('Kosten des Krieges steigen')); } }
    if (sh.id === 'heroic') { put(guer, 3.0, 0, 5.2, 0.15); pose4(guer, 'idle', t); guer.userData.setFace({ smile: false, sad: true });
      mv(u, V(2.6, 1.7, 8.6), V(2.65, 1.66, 8.0), V(3.0, 1.5, 5.2), V(3.0, 1.55, 5.2), 46); aim(spain, V(3, 0, 5), 12); tag(guer, 'Guerillero', HERO);
      tip(wt(201), 'x', 'Kein Heldenmärchen', '#ff5555', [gray('Gewalt, Angst und Opfer'), gray('auf allen Seiten')]); }
    if (sh.id === 'end') { put(guer, -2.4, 2.6, -6.0, -0.35); pose4(guer, 'idle', t); guer.userData.setFace({ smile: true });
      for (let i = 0; i < 18; i++) { const p = frs[i]; put(p, 6 + (i % 9) * 1.6 + (t - sh.a) * 1.4, 0, -20.4 + Math.floor(i / 9) * 1.2, Math.PI / 2); pose4(p, 'walk', t, i); }
      mv(u, V(-5.0, 4.6, -1.2), V(-5.6, 4.9, -0.2), V(2, 2.2, -14), V(4, 2.0, -16), 48); aim(spain, V(2, 0, -12), 26); tag(guer, 'Guerillero', HERO); tag(frs[4], 'Franzosen ziehen ab', BAD, 0.4);
      eff(wt(237), 'Ausdauer', '∞', HERO); }
  }
  // ---------- Vietnam / China ----------
  const VI = ['fish', 'support', 'vietnam', 'usbase', 'bombs', 'day', 'night', 'win', 'withdraw', 'asym', 'civil', 'lose'];
  if (VI.includes(sh.id)) {
    scene = viet; const Vd = viet.userData; const { vcs, farmerV, uss, mao, chi, fighters, civ, army, che, heli, rotor, tank, planes } = Vd;
    hideAll([...vcs, farmerV, ...uss, mao, ...chi, ...fighters, ...civ, ...army, ...che]); Vd.bowl.visible = false; Vd.hoe.visible = false; planes.forEach(p => p.visible = false); Vd.smokes.forEach(s => s.visible = false); Vd.smk.visible = false; Vd.burnt.visible = false; Vd.nightL.forEach(L => L.intensity = 0);
    heli.position.y = 0; rotor.rotation.y = t * 9; exp = 1.3;
    setSky(viet, sh.id === 'night' ? SKY.night : sh.id === 'bombs' ? SKY.haze : SKY.tropic); if (sh.id === 'night') exp = 1.5;
    Vd.fish.forEach((f, i) => { const a = t * (0.6 + i * 0.15) + i * 1.6; f.position.set(-7 + Math.cos(a) * (1.4 - i * 0.2), 0.1, 7 + Math.sin(a) * (1.0 - i * 0.12)); f.rotation.y = -a - Math.PI / 2; });
    if (sh.id === 'fish') { put(mao, -6.8, 0, 10.4, Math.PI + 0.1); pose4(mao, 'point', t); fighters.forEach((p, i) => { put(p, [-9.0, -4.8][i], 0, [10.0, 10.2][i], Math.PI + [-0.4, 0.4][i]); pose4(p, 'idle', t, i); });
      { const k = smoother(u); cam(V(-6.8, lerp(2.3, 2.2, k), lerp(4.4, 5.0, k)), V(-6.9, 0.95, 10), 50); }
      aim(viet, V(-7, 0, 5), 12); tag(mao, 'Mao Zedong', WHITE); info(wt(111), 'China, 1937');
      tip(wt(121), 'fish', 'Wie ein Fisch im Wasser', '#55ffff', [gray('Volk = Wasser'), gray('Kämpfer = Fisch')]); }
    if (sh.id === 'support') { put(chi[0], 2.6, 0, 6.6, -0.5); pose4(chi[0], 'give', t); Vd.bowl.visible = true; put(fighters[0], 1.1, 0, 7.2, 0.8); pose4(fighters[0], 'idle', t, 1);
      put(chi[1], 3.4, 0, 8.2, -1.2); pose4(chi[1], 'point', t, 2); put(chi[2], 0.6, 0, 5.2, 0.9); pose4(chi[2], 'idle', t, 3);
      mv(u, V(3.6, 1.9, 12.0), V(3.4, 1.85, 11.2), V(2.0, 1.2, 6.8), V(2.0, 1.2, 6.8), 48); aim(viet, V(2, 0, 6), 12); tag(fighters[0], 'Kämpfer', HERO); tag(chi[0], 'Bäuerin', ALLY); tag(chi[1], 'Bauer', ALLY);
      chat(wt(132), green('+ Essen')); chat(wt(134), green('+ Verstecke')); chat(wt(136), green('+ Informationen')); }
    if (sh.id === 'vietnam') { mv(u, V(-24, 26, 40), V(-21, 24, 36), V(14, 0, -10), V(16, 0, -12), 46); aim(viet, V(10, 0, 0), 60); info(wt(138), 'Vietnam, 1960er'); }
    if (sh.id === 'usbase') { uss.forEach((p, i) => { put(p, 58 + i * 1.3, 0, 6.4 - (i % 2) * 0.8, -0.1 + i * 0.02); pose4(p, 'idle', t, i); }); planes[0].visible = true; planes[0].position.set(30 + (t - sh.a) * 28, 22, -14); planes[0].rotation.set(0, 0, 0);
      mv(u, V(61, 2.6, 16), V(61, 2.5, 14.8), V(61, 2.4, 0), V(61, 2.5, 0), 52); aim(viet, V(60, 0, 2), 18); tag(uss[2], 'US-Armee', BAD); }
    if (sh.id === 'bombs') { planes.forEach((p, i) => { p.visible = true; p.position.set(-40 + (t - sh.a) * 22 + i * 7, 26 + i * 3, -30 - i * 9); p.rotation.set(0, 0, 0); }); Vd.smokes.forEach(s => { s.visible = true; s.userData.update(t + 2); s.scale.setScalar(3); });
      mv(u, V(-10, 14, 20), V(-9, 13, 17.5), V(-14, 14, -40), V(-12, 14, -40), 52); aim(viet, V(-10, 0, -20), 50);
      tip(wt(152), 'bomb', 'Bombenkrieg', '#ff5555', [gray('Mehr Bomben als im'), gray('ganzen 2. Weltkrieg')]); }
    if (sh.id === 'day' || sh.id === 'night') { const n = sh.id === 'night'; put(farmerV, 15.4, 0.05, 15.6, 0.25);
      if (!n) { pose(farmerV, 'work', t); Vd.hoe.visible = true; arm(farmerV, false); farmerV.userData.gunBack.visible = false; mv(u, V(16.4, 2.0, 20.4), V(16.3, 1.95, 19.6), V(15.4, 1.2, 15.6), V(15.4, 1.2, 15.6), 46); tag(farmerV, 'Bauer', ALLY); }
      else { pose4(farmerV, 'idle', t); arm(farmerV, false); vcs.forEach((p, i) => { if (i > 1) return; put(p, [13.6, 17.2][i], 0.05, [14.8, 14.6][i], [0.5, -0.4][i]); pose4(p, 'idle', t, i); }); Vd.nightL[0].intensity = 5; Vd.nightL[0].position.set(15.5, 2.6, 17.6);
        mv(u, V(16.2, 2.0, 20.6), V(16.1, 1.95, 20.0), V(15.4, 1.2, 15.4), V(15.4, 1.2, 15.4), 50); tag(farmerV, 'Kämpfer', HERO); }
      aim(viet, V(15, 0, 15), 14); }
    if (sh.id === 'win' || sh.id === 'withdraw') { const W = sh.id === 'withdraw';
      uss.forEach((p, i) => { if (!W) { put(p, 56.5 + i * 1.3, 0, 5.8 - (i % 2) * 0.6, 0); pose4(p, i % 2 ? 'cheer' : 'fist', t, i); } else { const k = (t - sh.a) * 1.2; put(p, 57 + i * 0.9 + k * 0.4, 0, 6 - k - (i % 2) * 0.8, Math.PI - 0.25); pose4(p, 'walk', t, i); } });
      if (W) { heli.position.y = Math.max(0, (t - wt(183)) * 1.6); }
      if (!W) { mv(u, V(60, 2.0, 13), V(60, 1.95, 12.2), V(59.8, 1.5, 5.4), V(59.8, 1.5, 5.4), 48); tag(uss[2], 'US-Armee', BAD); toast(wt(176), 'Gefecht gewonnen!', 'Fast jedes Mal', 'flagB'); }
      else { mv(u, V(57, 2.4, -8.5), V(57.4, 2.5, -9.2), V(61, 2.0, 3), V(61.5, 2.4, 3), 52); info(wt(183), '1973: Abzug der US-Truppen'); }
      aim(viet, V(60, 0, 2), 18); }
    if (sh.id === 'asym') { put(vcs[0], 52.4, 0, 9.8, -0.3); pose4(vcs[0], 'crouch', t); arm(vcs[0], false); tank.rotation.y = 0.4;
      mv(u, V(48.6, 1.5, 15.2), V(49.0, 1.5, 14.4), V(54, 1.3, 4.6), V(54, 1.3, 4.6), 50); aim(viet, V(54, 0, 6), 16); tag(vcs[0], 'Vietcong', HERO);
      tip(wt(195), 'scale', 'Asymmetrischer Krieg', '#ffff55', [gray('Starke Armee gegen'), gray('kleine Gruppen')]); }
    if (sh.id === 'civil') { Vd.burnt.visible = true; Vd.smk.visible = true; Vd.smk.userData.update(t);
      civ.forEach((p, i) => { put(p, [-12.0, -11.3, -10.2][i], 0, [15.4, 15.7, 15.0][i], [0.35, 0.2, -0.3][i]); pose4(p, 'sadidle', t, i); p.userData.setFace({ sad: true }); });
      mv(u, V(-10.6, 1.9, 20.6), V(-10.8, 1.85, 19.8), V(-12, 1.4, 13.4), V(-12, 1.5, 13.4), 46); aim(viet, V(-12, 0, 14), 14); tag(civ[0], 'Zivilisten', ALLY);
      chat(wt(209), gray('Die meisten Opfer: Zivilisten')); }
    if (sh.id === 'lose') { che.forEach((p, i) => { put(p, [-40.6, -39.4][i], 0, [20.0, 20.2][i], [0.2, -0.2][i]); pose4(p, 'handsup', t, i); p.userData.setFace({ sad: true }); });
      army.forEach((p, i) => { const a = [-1.1, -0.4, 0.6, 1.3][i] + Math.PI; put(p, -40 + Math.sin(a) * 3.2, 0, 20 + Math.cos(a) * 3.2, a + Math.PI); pose4(p, 'aim', t, i); arm(p, true); });
      mv(u, V(-38.4, 2.2, 26.4), V(-38.6, 2.1, 25.4), V(-40, 1.3, 19.4), V(-40, 1.3, 19.4), 48); aim(viet, V(-40, 0, 20), 14); tag(che[0], 'Guerilla', HERO); tag(army[1], 'Armee', BAD);
      info(wt(213), 'Bolivien, 1967'); say(wt(218), 'Dorf', GREY, 'Wir helfen euch nicht.'); chat(wt(225), red('Die Guerilla wurde zerschlagen')); }
  }
  if (sh.id === 'tunnels') { scene = tunnel; exp = 1.35; const Td = tunnel.userData; aim(tunnel, V(0, -2, 0), 20);
    Td.tv.forEach((p, i) => { const y = [-2.6, -5.4, -5.4][i], x = [-4.2 + (t - sh.a) * 0.9, -3.4 + (t - sh.a) * 0.7, 1.6 - (t - sh.a) * 0.6][i]; put(p, x, y, 0.1, i === 2 ? -Math.PI / 2 + 0.55 : Math.PI / 2 - 0.55); pose4(p, 'walk', t, i); p.userData.head.rotation.x = 0.2; });
    put(Td.us, 0.6 + (t - sh.a) * 0.5, 0.3, 0.2, 0.9); pose4(Td.us, 'walk', t);
    mv(u, V(-0.4, -1.6, 11.6), V(-0.4, -1.7, 10.8), V(-0.4, -2.2, 0), V(-0.4, -2.3, 0), 54); tag(Td.tv[0], 'Vietcong', HERO); tag(Td.us, 'US-Soldat', BAD);
    tip(wt(163), 'tunnel', 'Tunnel von Cu Chi', '#ffaa00', [gray('rund 250 km lang'), gray('Verstecke, Lager, Lazarett')]); }
  if (sh.id === 'home') { scene = usa; exp = 1.3; const Ud = usa.userData; aim(usa, V(0, 0, 0), 22);
    Ud.prot.forEach((p, i) => { put(p, -4.2 + (i % 7) * 1.4, 0, -2 - Math.floor(i / 7) * 1.8 + (t - sh.a) * 0.8, 0); pose4(p, i < 9 ? 'hold' : 'walk', t, i); if (i < 9) { const P = p.userData; const w = Math.sin(t * 9 + i) * 0.6; P.legL.rotation.x = w; P.legR.rotation.x = -w; P.armR.rotation.x = -0.5; } });
    mv(u, V(1.2, 2.6, 9.5), V(1.0, 2.5, 8.8), V(0, 1.9, -2), V(0, 1.9, -2), 52); info(wt(186), 'USA: Proteste gegen den Krieg'); }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  x: '<rect x="1" y="1" width="2" height="2" fill="#ff5555"/><rect x="5" y="1" width="2" height="2" fill="#ff5555"/><rect x="3" y="3" width="2" height="2" fill="#ff5555"/><rect x="1" y="5" width="2" height="2" fill="#ff5555"/><rect x="5" y="5" width="2" height="2" fill="#ff5555"/>',
  check: '<rect x="1" y="4" width="2" height="2" fill="#55ff55"/><rect x="2" y="5" width="2" height="2" fill="#55ff55"/><rect x="4" y="3" width="2" height="2" fill="#55ff55"/><rect x="5" y="1" width="2" height="2" fill="#55ff55"/>',
  sword: '<rect x="5" y="1" width="2" height="1" fill="#d8d8e0"/><rect x="4" y="2" width="2" height="1" fill="#d8d8e0"/><rect x="3" y="3" width="2" height="1" fill="#d8d8e0"/><rect x="2" y="4" width="2" height="1" fill="#a8a8b0"/><rect x="1" y="5" width="3" height="1" fill="#8a5a2a"/><rect x="1" y="6" width="1" height="1" fill="#6a4a2a"/><rect x="3" y="6" width="1" height="1" fill="#8a5a2a"/>',
  crate: '<rect x="1" y="2" width="6" height="5" fill="#8a6a3a"/><rect x="1" y="2" width="6" height="1" fill="#6a4a22"/><rect x="1" y="4" width="6" height="1" fill="#6a4a22"/><rect x="3" y="2" width="2" height="5" fill="#a8844a"/>',
  helmet: '<rect x="2" y="1" width="4" height="4" fill="#15151a"/><rect x="2" y="1" width="4" height="1" fill="#d8b030"/><rect x="3" y="0" width="1" height="1" fill="#d02018"/><rect x="1" y="5" width="6" height="1" fill="#1f3a8a"/><rect x="2" y="6" width="4" height="2" fill="#1f3a8a"/>',
  fish: '<rect x="1" y="3" width="5" height="2" fill="#f08a30"/><rect x="2" y="2" width="3" height="4" fill="#f08a30"/><rect x="6" y="2" width="1" height="4" fill="#d84a1a"/><rect x="2" y="3" width="1" height="1" fill="#111"/><rect x="0" y="6" width="8" height="2" fill="#3a7a8a"/>',
  bomb: '<rect x="2" y="3" width="4" height="4" fill="#2a2a2a"/><rect x="3" y="2" width="2" height="1" fill="#555"/><rect x="5" y="1" width="1" height="1" fill="#ffaa00"/><rect x="6" y="0" width="1" height="1" fill="#ff5555"/>',
  tunnel: '<rect x="0" y="0" width="8" height="8" fill="#7a5232"/><rect x="0" y="0" width="8" height="1" fill="#3e7a2e"/><rect x="1" y="3" width="6" height="2" fill="#2a1a10"/><rect x="5" y="5" width="2" height="2" fill="#2a1a10"/><rect x="2" y="3" width="1" height="1" fill="#ffc060"/>',
  scale: '<rect x="3" y="1" width="2" height="6" fill="#d8b030"/><rect x="0" y="2" width="8" height="1" fill="#d8b030"/><rect x="0" y="3" width="3" height="2" fill="#ff5555"/><rect x="6" y="3" width="2" height="1" fill="#55ffff"/><rect x="2" y="7" width="4" height="1" fill="#d8b030"/>',
  flagB: '<rect x="1" y="0" width="1" height="8" fill="#8a8a8a"/><rect x="2" y="1" width="5" height="3" fill="#ffd23f"/>',
};
const NUM = { 'zweihundert': '200', 'dreihunderttausend': '300.000', 'Sechzigern.': '60ern.', 'neunzehnhundertdreiundsiebzig': '1973', 'Zweiten': '2.' };
const mctx = document.createElement('canvas').getContext('2d');
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (t < 0.02) cur = words[0]; // Titelwort steht schon im ersten Frame
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; if (NUM[txt]) txt = NUM[txt]; if (txt === 'Zweiten') txt = '2.';
    mctx.font = '800 72px Mont'; const wdt = mctx.measureText(txt).width; capEl.style.fontSize = Math.min(72, Math.floor(72 * 980 / wdt)) + 'px';
    const f = cur === words[0] ? 1 : clamp01((t - cur[1] + 0.02) / 0.07), g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = txt; }
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
