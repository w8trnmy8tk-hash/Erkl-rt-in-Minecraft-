// „Koscher, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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

// ---------- Zubehör Koscher ----------
function kippa(ch, col = 0x1a2a5a) { ch.userData.head.add(box(0.3, 0.06, 0.3, C(col), 0, 0.52, -0.04, { cast: false })); }
function blackHat(ch) { const m = C(0x141418); ch.userData.head.add(box(0.7, 0.04, 0.7, m, 0, 0.52, 0)); ch.userData.head.add(box(0.48, 0.3, 0.48, m, 0, 0.68, 0)); ch.userData.hatExtra = 0.3; }
function headCloth(ch, col, stripe = null) { const m = C(col); const h = ch.userData.head; h.add(box(0.58, 0.14, 0.58, m, 0, 0.55, 0)); h.add(box(0.1, 0.62, 0.56, m, -0.3, 0.22, -0.02)); h.add(box(0.1, 0.62, 0.56, m, 0.3, 0.22, -0.02)); h.add(box(0.58, 0.66, 0.1, m, 0, 0.2, -0.3));
  if (stripe) { h.add(box(0.6, 0.05, 0.6, C(stripe), 0, 0.5, 0, { cast: false })); } ch.userData.hatExtra = 0.12; }
function tallit(ch) { const b = ch.userData.body; const w = C(0xf2efe6), s = C(0x2a4a8a); b.add(box(0.56, 0.3, 0.32, w, 0, 1.32, 0, { cast: false })); b.add(box(0.14, 0.62, 0.04, w, -0.17, 1.08, 0.15, { cast: false })); b.add(box(0.14, 0.62, 0.04, w, 0.17, 1.08, 0.15, { cast: false }));
  for (const y of [0.86, 0.92]) for (const x of [-0.17, 0.17]) b.add(box(0.145, 0.025, 0.045, s, x, y, 0.15, { cast: false })); }
function apron(ch, col = 0xf4f4f4) { ch.userData.body.add(box(0.44, 0.62, 0.02, C(col), 0, 0.9, 0.145, { cast: false })); }
const challah = () => { const g = new THREE.Group(); const m = C(0xd8963a), d = C(0xb8742a); for (let i = 0; i < 4; i++) g.add(box(0.2, 0.15, 0.17, i % 2 ? d : m, 0, 0.02, -0.02 + i * 0.13)); g.add(box(0.12, 0.1, 0.1, d, 0, 0.1, 0.18)); g.position.z = 0.04; return g; };
const burger = () => { const g = new THREE.Group(); g.add(box(0.3, 0.07, 0.3, C(0xd8963a), 0, -0.08, 0.12)); g.add(box(0.31, 0.06, 0.31, C(0x5a3020), 0, -0.02, 0.12)); g.add(box(0.34, 0.03, 0.34, C(0xf8c020), 0, 0.02, 0.12));
  g.add(box(0.33, 0.03, 0.33, C(0x4aa83a), 0, 0.045, 0.12)); g.add(box(0.3, 0.09, 0.3, C(0xe0a040), 0, 0.1, 0.12)); for (const [x, z] of [[-0.06, 0.05], [0.07, 0.15], [0, 0.22]]) g.add(box(0.03, 0.02, 0.03, C(0xf4ecd0), x, 0.155, z, { cast: false })); return g; };
const knifeMesh = () => { const g = new THREE.Group(); g.add(box(0.06, 0.06, 0.2, C(0x4a2e1a), 0, 0, 0.06)); g.add(box(0.025, 0.09, 0.62, C(0xd8dce4, { metal: 0.85, rough: 0.18 }), 0, 0.01, 0.47)); return g; };
const scrollMesh = (open = 0.5) => { const g = new THREE.Group(); const wood = C(0x5a3a22), parch = M(tex(32, 16, (c, r) => { noiseFill(c, r, 32, 16, 0xeadcb8, 0.05); c.fillStyle = '#3a2a1e'; for (let y = 3; y < 14; y += 2) for (let x = 3; x < 29; x++) if (x % 9 !== 0 && r() < 0.8) c.fillRect(x, y, 1, 1); }, 777));
  const w = 0.2 + open; g.add(box(w, 0.42, 0.02, parch, 0, 0, 0)); for (const s of [-1, 1]) { g.add(box(0.1, 0.48, 0.1, C(0xe8dcbc), s * w / 2, 0, 0)); g.add(box(0.05, 0.66, 0.05, wood, s * w / 2, 0, 0)); } return g; };
const packMesh = (col, seal = true) => { const t = tex(32, 48, (c, r) => { c.fillStyle = hex(col); c.fillRect(0, 0, 32, 48); c.fillStyle = '#ffffff'; c.fillRect(3, 6, 26, 9); c.fillStyle = hex(shade(col, 0.6)); c.fillRect(5, 9, 22, 3);
    c.fillStyle = '#f0d070'; c.fillRect(6, 20, 20, 14); c.fillStyle = '#d0a040'; c.fillRect(8, 22, 16, 10);
    if (seal) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(24, 41, 6, 0, 7); c.fill(); c.fillStyle = '#1f6ad8'; c.beginPath(); c.arc(24, 41, 5, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(22, 38, 1, 6); c.fillRect(23, 40, 2, 1); c.fillRect(24, 39, 1, 1); c.fillRect(24, 41, 1, 1); c.fillRect(25, 38, 1, 1); c.fillRect(25, 42, 1, 2); } }, 900 + (col % 50));
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.NearestFilter;
  const side = C(shade(col, 0.85)); const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.12), [side, side, side, side, M(t), side])); g.children[0].castShadow = true; return g; };
const clipboard = () => { const g = new THREE.Group(); g.add(box(0.3, 0.4, 0.03, C(0x8a5a2a), 0, 0.05, 0.14)); g.add(box(0.26, 0.32, 0.01, C(0xf4f4f0), 0, 0.03, 0.16, { cast: false })); for (let i = 0; i < 4; i++) g.add(box(0.18, 0.02, 0.005, C(0x3a3a4a), 0, 0.14 - i * 0.07, 0.168, { cast: false })); return g; };

// ---------- Tiere ----------
function animal(o) {
  const g = new THREE.Group(), [bw, bh, bd] = o.body, lh = o.legH, lw = o.legW;
  const bm = o.bodyMap ? M(o.bodyMap) : C(o.col);
  const body = box(bw, bh, bd, bm, 0, lh + bh / 2, 0); g.add(body);
  const legs = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const L = new THREE.Group(); L.position.set(sx * (bw / 2 - lw / 2 - 0.02), lh, sz * (bd / 2 - lw / 2 - 0.06));
    L.add(box(lw, lh - 0.07, lw, C(o.legCol), 0, -(lh - 0.07) / 2, 0)); const hm = C(o.hoofCol ?? 0x2a2420);
    for (const hx of [-1, 1]) L.add(box(lw * 0.44, 0.07, lw, hm, hx * lw * 0.28, -lh + 0.035, 0)); g.add(L); legs.push(L); }
  const [hw, hh, hd] = o.head; const head = new THREE.Group(); head.position.set(0, lh + bh * (o.headY ?? 0.75), bd / 2 + hd / 2 - (o.headIn ?? 0.05));
  const hs = C(o.headCol ?? o.col); const hmesh = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), [hs, hs, hs, hs, M(o.face), hs]); hmesh.castShadow = true; head.add(hmesh); g.add(head);
  if (o.extra) o.extra(head, g); g.scale.setScalar(o.s ?? 1);
  g.userData = { legs, head, animal: true }; return g;
}
function apose(a, kind, t, ph = 0) { const U = a.userData; U.legs.forEach((L, i) => L.rotation.x = kind === 'walk' ? Math.sin(t * 7 + ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45 : 0);
  U.head.rotation.x = kind === 'graze' ? 0.6 + Math.sin(t * 2 + ph) * 0.05 : Math.sin(t * 1.3 + ph) * 0.06; U.head.rotation.y = kind === 'graze' ? 0 : Math.sin(t * 0.7 + ph) * 0.15; }
const faceA = (base, draw, seed) => tex(8, 8, (c, r) => { noiseFill(c, r, 8, 8, base, 0.04); draw(c); }, seed);
const eyes = (c, y = 3, w = '#ffffff', p = '#1a1a1a') => { c.fillStyle = w; c.fillRect(1, y, 2, 1); c.fillRect(5, y, 2, 1); c.fillStyle = p; c.fillRect(2, y, 1, 1); c.fillRect(5, y, 1, 1); };
const cowTex = tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x5a3a26, 0.06); c.fillStyle = '#efe8dc'; c.fillRect(2, 3, 5, 4); c.fillRect(9, 9, 6, 4); c.fillRect(11, 1, 3, 2); c.fillRect(1, 12, 3, 3); }, 601);
const COW = { body: [1.1, 1.0, 1.75], legH: 0.75, legW: 0.3, bodyMap: cowTex, col: 0x5a3a26, legCol: 0x5a3a26, head: [0.72, 0.72, 0.6], headY: 0.85, headIn: 0.1,
  face: faceA(0x5a3a26, c => { c.fillStyle = '#efe8dc'; c.fillRect(3, 0, 2, 4); eyes(c, 3); c.fillStyle = '#d8b8a0'; c.fillRect(1, 5, 6, 3); c.fillStyle = '#5a3a30'; c.fillRect(2, 6, 1, 1); c.fillRect(5, 6, 1, 1); }, 602),
  extra: (h) => { const hm = C(0xe8dcc0); h.add(box(0.12, 0.12, 0.12, hm, -0.42, 0.3, 0)); h.add(box(0.12, 0.12, 0.12, hm, 0.42, 0.3, 0)); h.add(box(0.1, 0.2, 0.1, hm, -0.46, 0.42, 0)); h.add(box(0.1, 0.2, 0.1, hm, 0.46, 0.42, 0)); } };
const SHEEP = { body: [0.95, 0.85, 1.25], legH: 0.6, legW: 0.22, col: 0xece6da, legCol: 0x3a302a, head: [0.48, 0.5, 0.5], headY: 0.8, headCol: 0xece6da,
  bodyMap: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xece6da, 0.08); for (let i = 0; i < 20; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0xd0c8b8); }, 603),
  face: faceA(0x4a3a30, c => { c.fillStyle = '#ece6da'; c.fillRect(0, 0, 8, 2); eyes(c, 3, '#ffffff', '#2a1a10'); c.fillStyle = '#d8a0a0'; c.fillRect(3, 6, 2, 1); }, 604) };
const GOAT = { body: [0.72, 0.7, 1.1], legH: 0.62, legW: 0.18, col: 0xb8885a, legCol: 0xb8885a, head: [0.42, 0.46, 0.52], headY: 0.95, headCol: 0xe8e0d0,
  bodyMap: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xb8885a, 0.08); c.fillStyle = '#e8e0d0'; c.fillRect(0, 10, 16, 6); }, 605),
  face: faceA(0xe8e0d0, c => { eyes(c, 3, '#f0c040', '#1a1a1a'); c.fillStyle = '#5a4a3a'; c.fillRect(3, 6, 2, 1); }, 606),
  extra: (h) => { const hm = C(0x8a7a6a); h.add(box(0.08, 0.3, 0.08, hm, -0.12, 0.35, -0.14)); h.add(box(0.08, 0.3, 0.08, hm, 0.12, 0.35, -0.14)); h.add(box(0.12, 0.18, 0.08, C(0xe8e0d0), 0, -0.3, 0.18)); h.add(box(0.1, 0.18, 0.06, C(0xc8b8a0), -0.25, 0.12, 0)); h.add(box(0.1, 0.18, 0.06, C(0xc8b8a0), 0.25, 0.12, 0)); } };
const PIG = { body: [0.85, 0.72, 1.25], legH: 0.42, legW: 0.24, col: 0xf0a8a8, legCol: 0xf0a8a8, hoofCol: 0xb87878, head: [0.58, 0.56, 0.5], headY: 0.62,
  face: faceA(0xf0a8a8, c => { eyes(c, 3, '#ffffff', '#1a1a1a'); }, 607),
  extra: (h) => { h.add(box(0.3, 0.2, 0.08, C(0xe68a98), 0, -0.08, 0.28)); h.add(box(0.06, 0.06, 0.02, C(0x8a3a4a), -0.07, -0.08, 0.32, { cast: false })); h.add(box(0.06, 0.06, 0.02, C(0x8a3a4a), 0.07, -0.08, 0.32, { cast: false }));
    h.add(box(0.14, 0.14, 0.05, C(0xe08a98), -0.22, 0.3, -0.05)); h.add(box(0.14, 0.14, 0.05, C(0xe08a98), 0.22, 0.3, -0.05)); } };
function fishMesh() { const g = new THREE.Group(); const sc = M(tex(16, 8, (c, r) => { noiseFill(c, r, 16, 8, 0xe8846a, 0.06); for (let y = 0; y < 8; y += 2) for (let x = (y / 2) % 2; x < 16; x += 2) px(c, x, y, 0xf4a890); c.fillStyle = '#d8dce0'; c.fillRect(0, 6, 16, 2); }, 610), { rough: 0.4, metal: 0.2 });
  g.add(box(0.9, 0.28, 0.16, sc, 0, 0.14, 0)); g.add(box(0.22, 0.2, 0.15, C(0xc86a54), 0.52, 0.14, 0)); g.add(box(0.1, 0.4, 0.05, C(0xc86a54), -0.52, 0.16, 0)); g.add(box(0.2, 0.08, 0.04, C(0xc86a54), 0, 0.33, 0));
  g.add(box(0.05, 0.05, 0.17, C(0x101010), 0.55, 0.19, 0, { cast: false })); return g; }
function shrimpMesh() { const g = new THREE.Group(); const m = C(0xf08a6a); for (let i = 0; i < 6; i++) { const a = i / 5 * 2.4; g.add(box(0.11, 0.1, 0.1, m, Math.cos(a) * 0.18, 0.06 + Math.sin(a) * 0.14, 0)); } g.add(box(0.12, 0.02, 0.02, C(0xf0a080), 0.28, 0.06, 0.04, { cast: false })); return g; }
function musselMesh() { const g = new THREE.Group(); const m = C(0x2a3450, { rough: 0.4 }); g.add(box(0.24, 0.06, 0.13, m, 0, 0.03, 0)); g.add(box(0.22, 0.05, 0.12, C(0x3a4a6a, { rough: 0.4 }), 0, 0.085, 0)); return g; }
function olive(scene, x, z, s = 1) { scene.add(box(0.4 * s, 2.2 * s, 0.4 * s, C(0x6a5a46), x, 1.1 * s, z)); const lm = C(0x7a8a5a), lm2 = C(0x8a9a6a); scene.add(box(2.6 * s, 1.2 * s, 2.6 * s, lm, x, 2.6 * s, z)); scene.add(box(1.8 * s, 0.8 * s, 1.8 * s, lm2, x + 0.3, 3.4 * s, z - 0.2)); }

// ---------- Figuren ----------
const LEA = { skin: 0xf2c8a6, hair: 0x3a1e12, longHair: true, hairVol: true, top: 0xe8a428, bottom: 0x2a3a5a, shoe: 0xf2f2f2, eye: '#4a3020', smile: true, seed: 51 };
const TOM = { skin: 0xe8b894, hair: 0xd8b060, hairVol: true, top: 0x2a8ac8, bottom: 0x3a3a44, shoe: 0xe8e8e8, eye: '#3a6a9a', smile: true, seed: 52 };
const ELDER = { skin: 0xc8946a, hair: 0xe0dcd4, beard: 'full', beardCol: 0xe8e4dc, top: 0xe8e0cc, bottom: 0x8a6a4a, shoe: 0x6a4a2a, eye: '#2a1a10', seed: 53 };
const SHEP = { skin: 0xc08a60, hair: 0x2a1a10, beard: 'short', top: 0x8a6a42, bottom: 0x6a5032, shoe: 0x5a3a20, eye: '#2a1a10', seed: 54 };
const SHOCH = { skin: 0xc8946a, hair: 0x2a1a12, beard: 'full', top: 0xe8e4d8, bottom: 0x7a6a5a, shoe: 0x5a3a20, eye: '#2a1a10', seed: 55 };
const FISHER = { skin: 0xb88050, hair: 0x1e1410, beard: 'short', top: 0x4a6a8a, bottom: 0x6a5a42, shoe: 0x5a3a20, eye: '#2a1a10', seed: 56 };
const RABBI = (i) => ({ skin: [0xe8b894, 0xd8a47a, 0xf0c4a2][i], hair: [0x2a1a14, 0x6a6a6a, 0x4a3020][i], beard: 'full', beardCol: [0x2a1a14, 0xb0b0b0, 0x4a3020][i], top: 0x1a1a20, bottom: 0x1a1a20, coat: true, shoe: 0x111111, eye: '#2a1a10', seed: 60 + i });

// =====================================================================
// SET 1: Berlin – Markt (Hook + Loop), Höfe mit Tischen
// =====================================================================
const market = new THREE.Scene(); const TBL = [[38.4, 1.8], [40.2, -1.4], [42.0, -4.6]];
{
  skyDome(market, 0x3a62b0, 0x8ab0e0, 0xffc890, V(-0.6, 0.18, 0.75), [1, 0.75, 0.45]); market.fog = new THREE.Fog(0xf0c8a0, 70, 330); clouds(market, 12, 0xffe2c8, 70, 22, 220, 0.85);
  market.add(box(600, 1, 600, M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const e = x % 8 === 0 || (y % 8 === 0); px(c, x, y, shade(e ? 0x9a7656 : ((x >> 3) + (y >> 3)) % 2 ? 0xc8a07a : 0xb8906a, 0.88 + r() * 0.22)); } }, 3100)), 0, -0.5, 0, { cast: false, uvScale: 1 }));
  for (const [x, z, c] of [[-1.7, -0.9, 0xe83a5a], [1.8, -1.0, 0xf0c020], [-2.2, 1.6, 0xf06aa0], [2.3, 1.5, 0xe86a20]]) { market.add(box(0.6, 0.5, 0.6, M(T.planks), x, 0.25, z)); for (let i = 0; i < 5; i++) market.add(box(0.16, 0.16, 0.16, C(i % 2 ? c : 0x4a9a3a), x - 0.2 + (i % 3) * 0.2, 0.58 + (i > 2 ? 0.1 : 0), z - 0.12 + (i > 2 ? 0.2 : 0), { cast: false })); }
  const stall = (x, z, ry, aw, goods) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; market.add(g);
    g.add(box(2.8, 0.9, 1.1, M(T.planks), 0, 0.45, 0)); for (const sx of [-1.35, 1.35]) for (const sz of [-0.5, 0.5]) g.add(box(0.1, 2.5, 0.1, C(0x5a3a22), sx, 1.25, sz));
    for (let i = 0; i < 7; i++) g.add(box(0.42, 0.1, 1.5, C(aw[i % 2]), -1.26 + i * 0.42, 2.55 - 0.0, 0.2)); g.add(box(2.94, 0.3, 0.06, C(aw[0]), 0, 2.4, 0.95, { cast: false }));
    goods.forEach(([gx, col, n = 6], k) => { g.add(box(0.7, 0.18, 0.7, M(T.planks), gx, 0.99, 0.05)); for (let i = 0; i < n; i++) g.add(box(0.16, 0.16, 0.16, C(col), gx - 0.24 + (i % 3) * 0.24, 1.16 + Math.floor(i / 3) * 0.1, -0.12 + Math.floor(i / 3) * 0.24 + (i % 2) * 0.04, { cast: false })); }); return g; };
  stall(-2.9, -3.2, 0.25, [0xd83a2a, 0xf4ece0], [[-0.8, 0xf08a1a], [0, 0xd8202a], [0.8, 0x5ab83a]]);
  stall(3.0, -3.4, -0.25, [0xf0c020, 0xf4ece0], [[-0.8, 0xd8963a, 4], [0, 0xc8782a, 4], [0.8, 0xe8b860, 4]]);
  stall(-7.2, 0.6, 0.9, [0x2a8a5a, 0xf4ece0], [[-0.8, 0x8a3ab8], [0, 0x3ab84a], [0.8, 0xf0d020]]);
  stall(7.4, 0.2, -0.9, [0x2a6ad8, 0xf4ece0], [[-0.8, 0xf4f0e0, 4], [0, 0xf0d070, 4], [0.8, 0xe86a4a]]);
  stall(0.2, -9.5, 0, [0xd84a8a, 0xf4ece0], [[-0.8, 0xf0a020], [0, 0xa8d040], [0.8, 0xd83030]]);
  stall(-6.0, -8.0, 0.4, [0xe86a20, 0xf4ece0], [[-0.8, 0x6a3a1a], [0, 0xf0f0e0], [0.8, 0xc8a050]]);
  stall(6.4, -8.4, -0.4, [0x7a3ab8, 0xf4ece0], [[-0.8, 0xe8302a], [0, 0xf8d040], [0.8, 0x3a9a3a]]);
  { const fc = new THREE.Group(); fc.position.set(0.05, 0, 2.55); fc.rotation.y = 0.08; market.add(fc); fc.add(box(1.0, 0.36, 0.6, M(T.planks), 0, 0.18, 0));
    const fr = rng(3120), fcol = [0xe8302a, 0xf08a1a, 0xf8d040, 0x5ab83a, 0xd8202a, 0xf06a20];
    for (let i = 0; i < 15; i++) fc.add(box(0.17, 0.17, 0.17, C(fcol[Math.floor(fr() * 6)]), -0.4 + (i % 5) * 0.2, 0.42 + (fr() * 0.05), -0.2 + Math.floor(i / 5) * 0.2, { cast: false }));
    for (const [x, z, c] of [[-1.25, 1.7, 0xf0508a], [1.3, 1.75, 0xffd040]]) { market.add(box(0.36, 0.34, 0.36, C(0xb8603a), x, 0.17, z)); market.add(box(0.3, 0.2, 0.3, C(0x3a8a32), x, 0.44, z)); for (const [dx, dz] of [[-0.1, -0.08], [0.1, 0.06], [0, 0.1], [0.08, -0.1]]) market.add(box(0.1, 0.1, 0.1, C(c), x + dx, 0.58, z + dz, { cast: false })); } }
  // Lichterketten
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffd890 }), wireM = C(0x2a2420);
  const chain = (a, b, n, sag) => { for (let i = 0; i <= n; i++) { const u = i / n; const p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * sag; market.add(box(0.14, 0.18, 0.14, bulbM, p.x, p.y - 0.1, p.z, { cast: false })); if (i < n) { const q = a.clone().lerp(b, (i + 1) / n); q.y -= Math.sin((i + 1) / n * Math.PI) * sag; const m = p.clone().add(q).multiplyScalar(0.5); const w = box(0.03, 0.03, p.distanceTo(q), wireM, m.x, m.y, m.z, { cast: false }); w.lookAt(q); market.add(w); } } };
  for (const [x, z] of [[-5.5, -1.6], [5.5, -1.8], [-4.5, -6.5], [4.6, -6.6]]) { market.add(box(0.14, 3.8, 0.14, C(0x2a2a2e), x, 1.9, z)); }
  chain(V(-5.5, 3.7, -1.6), V(5.5, 3.7, -1.8), 16, 0.7); chain(V(-4.5, 3.7, -6.5), V(4.6, 3.7, -6.6), 14, 0.6); chain(V(-5.5, 3.7, -1.6), V(-4.5, 3.7, -6.5), 8, 0.4); chain(V(5.5, 3.7, -1.8), V(4.6, 3.7, -6.6), 8, 0.4);
  const warm = new THREE.PointLight(0xffc070, 5, 9, 1.6); warm.position.set(0, 3.0, -2.6); market.add(warm);
  // Altbau-Fassaden
  const fac = [0xf0d8b0, 0xe8c0a0, 0xd8e0e8, 0xf4e8c8, 0xe0b8a8, 0xc8d8c0]; const r = rng(3101);
  for (let i = 0; i < 10; i++) { const x = -27 + i * 6, h = 13 + r() * 4, z = -19; const g = new THREE.Group(); g.position.set(x, 0, z); market.add(g);
    g.add(box(6, h, 6, C(fac[i % 6]), 0, h / 2, 0)); g.add(box(6.2, 0.6, 6.2, C(shade(fac[i % 6], 0.8)), 0, h, 0)); for (let s = 0; s < 3; s++) g.add(box(6.2 - s * 1.8, 0.9, 6.3, M(T.roofRed), 0, h + 0.75 + s * 0.9, 0));
    for (const wx of [-1.8, 0, 1.8]) for (let wy = 2.4; wy < h - 1; wy += 3) g.add(box(1.0, 1.6, 0.1, M(r() < 0.35 ? T.window : T.windowDark), wx, wy, 3.02, { cast: false })); }
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) { const z = -14 + i * 6, h = 12 + r() * 4, x = side * 24; const g = new THREE.Group(); g.position.set(x, 0, z); market.add(g); g.add(box(6, h, 6, C(fac[(i + 3) % 6]), 0, h / 2, 0)); for (let s = 0; s < 3; s++) g.add(box(6.3, 0.9, 6.2 - s * 1.8, M(T.roofRed), 0, h + 0.45 + s * 0.9, 0));
    for (const wz of [-1.8, 0, 1.8]) for (let wy = 2.4; wy < h - 1; wy += 3) g.add(box(0.1, 1.6, 1.0, M(r() < 0.35 ? T.window : T.windowDark), -side * 3.02, wy, wz, { cast: false })); }
  // Fernsehturm (fern)
  const tw = C(0xd8dce0), tb = C(0x8a98a8, { metal: 0.4, rough: 0.4 }); market.add(box(3, 60, 3, tw, 30, 30, -110, { cast: false })); market.add(box(9, 9, 9, tb, 30, 62, -110, { cast: false })); market.add(box(1, 22, 1, C(0xd83a2a), 30, 76, -110, { cast: false }));
  const tree = (x, z) => { market.add(box(0.5, 3.2, 0.5, C(0x5a3a22), x, 1.6, z)); market.add(box(3.0, 2.6, 3.0, C(0x4a8a32), x, 4.2, z)); market.add(box(2.0, 1.4, 2.0, C(0x5a9a3a), x, 5.8, z)); };
  for (const [x, z] of [[-12, -4], [12, -5], [-14, 6], [14, 7], [-11, -13], [11, -13]]) tree(x, z);
  sunLight(market, 0xffc48a, 3.6, V(-40, 20, 52), V(0, 0, -3), 32); market.add(new THREE.HemisphereLight(0xb8c8f0, 0x8a6a4a, 1.25));
  const fill = new THREE.DirectionalLight(0xffe0c0, 0.7); fill.position.set(10, 6, 20); market.add(fill);
  // Höfe mit drei Tischen (x = 40)
  for (const [tx, tz] of TBL) { market.add(box(2.2, 0.08, 1.2, M(T.planks), tx, 0.8, tz)); for (const [dx, dz] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) market.add(box(0.08, 0.8, 0.08, C(0x5a3a1a), tx + dx, 0.4, tz + dz));
    market.add(box(2.2, 0.08, 0.4, M(T.planks), tx, 0.48, tz + 0.95)); market.add(box(2.2, 0.08, 0.4, M(T.planks), tx, 0.48, tz - 0.95)); }
  const plates = ([tx, tz], cols) => cols.forEach((c, i) => { market.add(box(0.36, 0.04, 0.36, C(0xf4f4f4), tx - 0.6 + i * 0.6, 0.86, tz + 0.2, { cast: false })); market.add(box(0.2, 0.08, 0.2, C(c), tx - 0.6 + i * 0.6, 0.9, tz + 0.2, { cast: false })); });
  plates(TBL[0], [0xd8963a, 0x5ab83a, 0xc85a3a]); plates(TBL[1], [0xe8b860, 0xf0d070, 0x5ab83a]); plates(TBL[2], [0xe0a040, 0xd83030, 0xf0d070]);
  const lea = humanoid(LEA), tom = humanoid(TOM); const hCh = inHand(lea, challah()), hBu = inHand(tom, burger());
  const fam = [
    humanoid({ skin: 0xe8b894, hair: 0x2a1a14, beard: 'full', top: 0xf4f4f4, bottom: 0x1a1a20, seed: 70 }), humanoid({ skin: 0xf0c4a2, hair: 0x5a3820, longHair: true, top: 0x2a3a6a, bottom: 0x2a3a6a, skirt: true, seed: 71 }),
    humanoid({ skin: 0xe0a882, hair: 0x2a1a14, top: 0x8a3a3a, bottom: 0x2a3448, seed: 72 }), humanoid({ skin: 0xf2cdb0, hair: 0xb8925a, longHair: true, top: 0x3ab8a8, bottom: 0x2a3448, seed: 73 }),
    humanoid({ skin: 0xc89a72, hair: 0x1a1a1a, top: 0xe8b830, bottom: 0x3a3a44, seed: 74 }), humanoid({ skin: 0xf0c4a2, hair: 0x8a4a22, longHair: true, top: 0xa83ad8, bottom: 0x2a3448, seed: 75 })];
  kippa(fam[0], 0x1a1a20); tallit(fam[0]); kippa(fam[2], 0x2a4a8a);
  const shoppers = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a][i], hair: [0x2a1a14, 0x6a4422, 0xb8925a, 0x1a1a1a][i], top: [0x6a3a8a, 0xd84a3a, 0x3a8a5a, 0xe8d0a0][i], bottom: 0x2a3448, longHair: i % 2 === 1, skirt: i === 3, seed: 80 + i }); return p; });
  market.add(lea, tom, ...fam, ...shoppers);
  market.userData = { lea, tom, hCh, hBu, fam, shoppers };
}

// =====================================================================
// SET 2: Israel – Hügel, Zelte, Herden, See, Schächter
// =====================================================================
const isr = new THREE.Scene();
{
  skyDome(isr, 0x3a7ad0, 0x9ac4ea, 0xf2e2c0, V(-0.4, 0.5, 0.5)); isr.fog = new THREE.Fog(0xf2e2c0, 90, 420); clouds(isr, 21, 0xffffff, 70, 16, 220, 0.85);
  const earth = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xc8b078, 0.12), 4001)), dry = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x9aa05a, 0.16); }, 4002));
  isr.add(box(600, 1, 600, earth, 0, -0.5, 0, { cast: false }));
  const r = rng(4003); for (let i = 0; i < 60; i++) { const w = 3 + r() * 7; isr.add(box(w, 0.08, w * (0.6 + r()), dry, -40 + r() * 70, 0.04, -30 + r() * 50, { cast: false })); }
  // Hügel
  const hillM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xb8a46a, 0.1), 4004)), hillG = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x8a9a5a, 0.12), 4005));
  for (const [x, z, w, h] of [[-60, -80, 70, 14], [10, -95, 90, 18], [80, -70, 60, 12], [-90, -20, 40, 10], [-20, -70, 40, 8]]) for (let s = 0; s < 4; s++) isr.add(box(w - s * w * 0.2, h / 4, w * 0.7 - s * w * 0.14, s % 2 ? hillG : hillM, x, h / 8 + s * h / 4, z, { cast: false }));
  // Zelte
  const tentM = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(Math.floor(x / 4) % 2 ? 0x3a2e26 : 0x6a5040, 0.9 + r() * 0.2)); }, 4006));
  const tent = (x, z, w, d, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; isr.add(g); g.add(box(w, 0.2, d, tentM, 0, 2.6, 0)); g.add(box(w, 2.4, 0.15, tentM, 0, 1.2, -d / 2));
    for (const sx of [-1, 1]) { g.add(box(0.15, 2.4, d, tentM, sx * w / 2, 1.2, 0)); g.add(box(0.12, 2.8, 0.12, C(0x6a4a2a), sx * (w / 2 - 0.3), 1.4, d / 2)); } g.add(box(0.12, 3.0, 0.12, C(0x6a4a2a), 0, 1.5, d / 2));
    g.add(box(w - 0.4, 0.06, d - 0.4, M(tex(8, 8, (c, r) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(c, x, y, shade((x + y) % 4 < 2 ? 0xa83a2a : 0xd8a040, 0.9 + r() * 0.2)); }, 4007)), 0, 0.03, 0, { cast: false })); };
  tent(-12, -14, 6, 4.5, 0.3); tent(-3, -18, 7, 5, 0.05); tent(7, -16, 6, 4.5, -0.2); tent(16, -21, 6, 4, -0.4); tent(-20, -8, 5, 4, 0.6);
  for (const [x, z, s] of [[-24, -18, 1.1], [22, -12, 1], [-9, 6, 0.9], [26, 14, 1], [-28, 10, 1.1], [11, -28, 1], [-17, 20, 0.9], [2, 22, 1]]) olive(isr, x, z, s);
  // Herde
  const herd = []; const addA = (o, x, z, ry, kind = 'idle') => { const a = animal(o); a.position.set(x, 0, z); a.rotation.y = ry; a.userData.kind = kind; a.userData.home = [x, z, ry]; isr.add(a); herd.push(a); return a; };
  for (const [x, z, ry, k] of [[4, 2, 0.6, 'graze'], [6.5, 3.5, -0.4, 'idle'], [3, 5, 1.2, 'graze'], [8, 1, 2.2, 'graze'], [5.5, 6.5, -1.0, 'idle'], [9.5, 4.5, 0.2, 'graze'], [2, 7.5, 0.9, 'idle']]) addA(SHEEP, x, z, ry, k);
  for (const [x, z, ry, k] of [[-3, -2, 0.8, 'graze'], [-6, 1, -0.3, 'idle'], [14, -2, -1.2, 'graze']]) addA(COW, x, z, ry, k);
  for (const [x, z, ry, k] of [[12, 6, -0.6, 'graze'], [13.5, 8, 0.5, 'idle'], [10.5, 9, 2.4, 'graze']]) addA(GOAT, x, z, ry, k);
  // Einzeltiere für Shots
  const cow = animal(COW), sheep = animal(SHEEP), goat = animal(GOAT), pig = animal(PIG), mom = animal(GOAT), kid = animal({ ...GOAT, s: 0.55 }); isr.add(cow, sheep, goat, pig, mom, kid);
  // See
  const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), new THREE.MeshStandardMaterial({ color: 0x2a78b0, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 })); water.rotation.x = -Math.PI / 2; water.position.set(92, 0.06, 0); isr.add(water);
  const sandM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe0cc98, 0.08), 4010)); isr.add(box(8, 0.12, 160, sandM, 30, 0.06, 0, { cast: false }));
  const boat = new THREE.Group(); boat.position.set(40, 0.05, 2); boat.rotation.y = 0.4; isr.add(boat); boat.add(box(1.6, 0.5, 4.2, M(T.planks), 0, 0.2, 0)); boat.add(box(0.1, 3.4, 0.1, C(0x5a3a22), 0, 1.9, 0.4)); boat.add(box(0.06, 2.2, 1.6, C(0xf0e8d8), 0, 2.3, -0.4, { cast: false }));
  // Fischkiste
  const crate = new THREE.Group(); crate.position.set(30.4, 0.12, 6); isr.add(crate); crate.add(box(2.2, 0.16, 1.2, M(T.planks), 0, 0.08, 0)); for (const [x, z, w, d] of [[0, -0.6, 2.2, 0.08], [0, 0.6, 2.2, 0.08], [-1.1, 0, 0.08, 1.2], [1.1, 0, 0.08, 1.2]]) crate.add(box(w, 0.26, d, M(T.planks), x, 0.21, z));
  const fishA = fishMesh(); fishA.position.set(-0.55, 0.16, -0.1); fishA.rotation.y = 0.2; crate.add(fishA); const fishB = fishMesh(); fishB.position.set(-0.45, 0.16, 0.3); fishB.rotation.y = -0.1; fishB.scale.setScalar(0.85); crate.add(fishB);
  const shr = []; for (let i = 0; i < 3; i++) { const s = shrimpMesh(); s.position.set(0.35 + (i % 2) * 0.22, 0.17, -0.3 + i * 0.28); s.rotation.y = i; crate.add(s); shr.push(s); }
  for (let i = 0; i < 5; i++) { const m = musselMesh(); m.position.set(0.85 - (i % 2) * 0.1, 0.17, -0.4 + i * 0.2); m.rotation.y = i * 0.7; crate.add(m); }
  // Schächter-Platz (x = -20, z = 6)
  const sp = new THREE.Group(); sp.position.set(-22, 0, 6); isr.add(sp); for (const [x, z] of [[-2, -1.5], [2, -1.5], [-2, 1.5], [2, 1.5]]) sp.add(box(0.14, 2.8, 0.14, C(0x6a4a2a), x, 1.4, z)); sp.add(box(4.4, 0.12, 3.4, M(tex(8, 8, (c, r) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(c, x, y, shade(x % 4 < 2 ? 0xe8dcc0 : 0xb89a6a, 0.92 + r() * 0.12)); }, 4011)), 0, 2.86, 0));
  sp.add(box(2.0, 0.1, 1.0, M(T.planks), 0, 0.9, -0.6)); for (const [x, z] of [[-0.9, -1.0], [0.9, -1.0], [-0.9, -0.2], [0.9, -0.2]]) sp.add(box(0.1, 0.9, 0.1, C(0x5a3a22), x, 0.45, z));
  sp.add(box(0.5, 0.12, 0.2, C(0x6a6a70), -0.6, 1.0, -0.8)); // Schleifstein
  // Fleisch + Salz + Wasser
  const meatM = C(0xc84a4a), fatM = C(0xf0d8c8), saltM = C(0xffffff); const meat = new THREE.Group(); meat.position.set(0.3, 0.95, -0.6); sp.add(meat);
  meat.add(box(1.2, 0.05, 0.7, M(T.planks), 0, 0.02, 0)); for (let i = 0; i < 3; i++) { meat.add(box(0.3, 0.12, 0.24, meatM, -0.35 + i * 0.35, 0.1, 0)); meat.add(box(0.3, 0.04, 0.05, fatM, -0.35 + i * 0.35, 0.12, 0.12, { cast: false })); }
  const salt = new THREE.Group(); meat.add(salt); const rs = rng(4012); for (let i = 0; i < 40; i++) salt.add(box(0.025, 0.025, 0.025, saltM, -0.5 + rs() * 1.0, 0.17, -0.12 + rs() * 0.24, { cast: false }));
  const basin = new THREE.Group(); basin.position.set(1.4, 0, 0.4); sp.add(basin); basin.add(box(0.9, 0.5, 0.9, C(0x9a7a5a), 0, 0.25, 0)); basin.add(box(0.75, 0.04, 0.75, new THREE.MeshStandardMaterial({ color: 0x5a9ac8, roughness: 0.1 }), 0, 0.5, 0, { cast: false }));
  // Tisch mit Essen (x = 6, z = -9)
  const ft = new THREE.Group(); ft.position.set(-6, 0, -9.5); isr.add(ft); ft.add(box(2.6, 0.1, 1.2, M(T.planks), 0, 0.75, 0)); for (const [x, z] of [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]]) ft.add(box(0.1, 0.75, 0.1, C(0x5a3a22), x, 0.375, z));
  for (const [x, c, w] of [[-0.9, 0xd8a050, 0.4], [-0.3, 0x6a2a6a, 0.3], [0.3, 0x5a6a2a, 0.3], [0.9, 0xc85a2a, 0.3]]) { ft.add(box(w + 0.1, 0.04, w + 0.1, C(0xb8865a), x, 0.82, 0)); ft.add(box(w, 0.12, w, C(c), x, 0.9, 0, { cast: false })); }
  ft.add(box(0.22, 0.4, 0.22, C(0xb86a3a), 0.2, 1.0, -0.4));
  const sun = sunLight(isr, 0xfff0d0, 3.4, V(-40, 60, 40), V(0, 0, -2), 50); isr.add(new THREE.HemisphereLight(0xd8e8ff, 0x9a7a5a, 1.4));
  const elder = humanoid(ELDER), shep = humanoid(SHEP), shoch = humanoid(SHOCH), fisher = humanoid(FISHER), shep2 = humanoid({ ...SHEP, top: 0x6a4a3a, beard: undefined, seed: 57 });
  headCloth(elder, 0xf2efe6, 0x2a4a8a); tallit(elder); headCloth(shep, 0xd8c8a8); headCloth(shoch, 0xf2efe6); headCloth(fisher, 0xd8c8a8); headCloth(shep2, 0xb89a6a); apron(shoch, 0xf4f0e8);
  const scroll = inHand(elder, scrollMesh(0.5)); scroll.position.set(-0.2, -0.65, 0.3); const knife = inHand(shoch, knifeMesh()); knife.rotation.x = 1.2;
  const staff = (ch) => { const s = inHand(ch, box(0.07, 2.0, 0.07, C(0x6a4a2a), 0, 0.4, 0.1)); return s; }; staff(shep); staff(shep2);
  const people = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xc08a60, 0xc8946a, 0xb88050, 0xc68a62][i], hair: [0x1e1410, 0x2a1a10, 0x1a1410, 0x2a1e16][i], top: [0x8a6a42, 0xa84a3a, 0x6a7a4a, 0x4a6a8a][i], bottom: 0x6a5032, longHair: i % 2 === 1, skirt: i % 2 === 1, beard: i === 0 ? 'short' : undefined, seed: 90 + i }); headCloth(p, [0xd8c8a8, 0xa84a3a, 0xe8e0cc, 0x4a6a8a][i]); isr.add(p); return p; });
  isr.add(elder, shep, shoch, fisher, shep2);
  isr.userData = { herd, cow, sheep, goat, pig, mom, kid, elder, shep, shep2, shoch, fisher, scroll, knife, salt, people, crate, shr };
}

// =====================================================================
// SET 3: Lehrhaus (Rabbiner)
// =====================================================================
const study = new THREE.Scene(); study.background = new THREE.Color(0x0a0806);
{
  const wall = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xc8b08a, 0.06); for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) if ((x + (y / 4) * 4) % 8 === 7) px(c, x, y, 0x9a845e); }, 4101));
  room3(study, 9, 7, 3.6, wall, M(T.planks));
  for (const x of [-3.2, -1.1, 1.1, 3.2]) study.add(box(2.0, 3.0, 0.5, M(T.books), x, 1.5, -3.2));
  study.add(box(3.2, 0.1, 1.4, M(T.darkwood), 0, 0.85, 0)); for (const [x, z] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) study.add(box(0.12, 0.85, 0.12, C(0x3a2416), x, 0.42, z));
  for (const [x, c] of [[-0.9, 0x6a2a1a], [0.1, 0x2a3a6a], [0.9, 0x3a5a2a]]) { study.add(box(0.5, 0.06, 0.36, C(0xe8dcc0), x, 0.93, 0.1, { cast: false })); study.add(box(0.02, 0.07, 0.36, C(c), x, 0.94, 0.1, { cast: false })); }
  const lampM = new THREE.MeshBasicMaterial({ color: 0xffc060 }); for (const x of [-1.3, 1.3]) { study.add(box(0.2, 0.1, 0.12, C(0x8a5a2a), x, 0.95, -0.4)); study.add(box(0.06, 0.12, 0.06, lampM, x + 0.08, 1.06, -0.4, { cast: false })); const l = new THREE.PointLight(0xffb060, 4, 6, 1.5); l.position.set(x, 1.4, -0.3); study.add(l); }
  sunLight(study, 0xffe0b8, 1.4, V(5, 7, 9), V(0, 0, -1), 7, 1024); study.add(new THREE.HemisphereLight(0xffe8d0, 0x4a3a2a, 0.9));
  const rab = [0, 1, 2].map(i => { const p = humanoid({ ...RABBI(i), top: [0xe8e0cc, 0x5a4a3a, 0x3a3a5a][i], bottom: [0x8a6a4a, 0x3a2e22, 0x2a2a3a][i], coat: false }); headCloth(p, [0xf2efe6, 0xd8c8a8, 0xf2efe6][i], i !== 1 ? 0x2a4a8a : null); study.add(p); return p; });
  study.userData = { rab };
}

// =====================================================================
// SET 4: Wohnung – Küche mit zwei Geschirr-Sätzen, Esstisch, Schabbat
// =====================================================================
const home = new THREE.Scene(); home.background = new THREE.Color(0x0a0806);
{
  const wp = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0xe8dcc4, 0.03); for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) { px(c, x + 3, y + 3, 0xc8b898); px(c, x + 4, y + 4, 0xc8b898); } }, 4201));
  const floor = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0xe8e4dc : 0x8a8a90, 0.95 + r() * 0.08)); }, 4202));
  room3(home, 11, 8, 3.2, wp, floor);
  // Zwei Geschirrschränke: rot = Fleisch, blau = Milch
  const cabinet = (x, col) => { const g = new THREE.Group(); g.position.set(x, 0, -3.5); home.add(g); g.add(box(2.4, 0.9, 0.7, C(col), 0, 0.45, 0)); g.add(box(2.44, 0.06, 0.74, C(0xf0ece4), 0, 0.93, 0.02)); g.add(box(2.4, 1.0, 0.36, C(col), 0, 2.2, -0.17));
    g.add(box(2.3, 0.04, 0.3, C(0xf0ece4), 0, 1.7, -0.15)); for (let i = 0; i < 5; i++) { g.add(box(0.36, 0.36, 0.04, C(0xf8f8f8), -0.85 + i * 0.42, 1.92, -0.1)); g.add(box(0.26, 0.26, 0.02, C(shade(col, 1.2)), -0.85 + i * 0.42, 1.92, -0.07, { cast: false })); }
    for (let i = 0; i < 3; i++) g.add(box(0.22, 0.18, 0.22, C(0xf8f8f8), -0.6 + i * 0.6, 1.05, 0.05)); for (const dx of [-0.6, 0.6]) g.add(box(0.5, 0.06, 0.03, C(0xd8d8d8, { metal: 0.6 }), dx, 0.7, 0.37, { cast: false })); return g; };
  cabinet(-1.5, 0xb83a32); cabinet(1.5, 0x2a62b8);
  home.add(box(0.06, 2.6, 0.5, C(0x8a8a8a), 0, 1.3, -3.6));
  // Uhr
  const clockFace = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 16; return cv; })()); home.add(box(0.7, 0.7, 0.08, C(0x3a2a1a), 4.4, 2.4, -3.85));
  const clockW = box(0.6, 0.6, 0.02, C(0xf8f4ec), 4.4, 2.4, -3.8, { cast: false }); home.add(clockW);
  const hH = new THREE.Group(), hM = new THREE.Group(); hH.position.set(4.4, 2.4, -3.78); hM.position.set(4.4, 2.4, -3.77); hH.add(box(0.04, 0.16, 0.01, C(0x1a1a1a), 0, 0.08, 0, { cast: false })); hM.add(box(0.03, 0.24, 0.01, C(0xc02020), 0, 0.12, 0, { cast: false })); home.add(hH, hM);
  // Esstisch
  home.add(box(2.4, 0.08, 1.2, C(0x8a5a2a), 0, 0.8, 0.6)); for (const [x, z] of [[-1.1, 0.1], [1.1, 0.1], [-1.1, 1.1], [1.1, 1.1]]) home.add(box(0.08, 0.8, 0.08, C(0x5a3a1a), x, 0.4, z));
  const cloth = box(2.5, 0.02, 1.3, C(0xf8f8f8), 0, 0.85, 0.6, { cast: false }); home.add(cloth);
  for (const [x, z] of [[-0.8, 0.0], [0.8, 0.0], [-1.6, 0.6], [1.6, 0.6]]) { home.add(box(0.5, 0.08, 0.5, C(0x6a4a2a), x, 0.46, z < 0.3 ? -0.15 : z)); }
  // Essen: parve (Fisch, Eier, Gemüse) und Schabbat-Sachen
  const parve = new THREE.Group(); home.add(parve); const f = fishMesh(); f.scale.setScalar(0.6); f.position.set(-0.55, 0.88, 0.55); parve.add(box(0.7, 0.03, 0.4, C(0xf4f4f4), -0.55, 0.875, 0.55, { cast: false })); parve.add(f);
  for (let i = 0; i < 3; i++) parve.add(box(0.1, 0.13, 0.1, C(0xf8f0e0), 0.05 + i * 0.13, 0.93, 0.5)); parve.add(box(0.5, 0.04, 0.5, C(0xf4f4f4), 0.1, 0.875, 0.5, { cast: false }));
  for (const [x, z, c] of [[0.6, 0.45, 0xe83a2a], [0.75, 0.6, 0x5ab83a], [0.62, 0.72, 0xf08a1a], [0.85, 0.42, 0x8a3ab8], [0.5, 0.6, 0x3a9a3a]]) parve.add(box(0.12, 0.12, 0.12, C(c), x, 0.94, z, { cast: false }));
  const shabbat = new THREE.Group(); home.add(shabbat); const ch2 = challah(); ch2.position.set(0, 0.95, 0.65); ch2.rotation.y = Math.PI / 2; shabbat.add(ch2);
  const flameM = new THREE.MeshBasicMaterial({ color: 0xffd070 }); for (const x of [-0.35, 0.35]) { shabbat.add(box(0.1, 0.12, 0.1, C(0xd8c070, { metal: 0.6, rough: 0.3 }), x, 0.91, 0.25)); shabbat.add(box(0.06, 0.32, 0.06, C(0xf8f4ec), x, 1.13, 0.25)); shabbat.add(box(0.04, 0.07, 0.04, flameM, x, 1.33, 0.25, { cast: false })); }
  const candle = new THREE.PointLight(0xffb050, 0, 5, 1.4); candle.position.set(0, 1.6, 0.4); home.add(candle);
  const meatPlate = new THREE.Group(); home.add(meatPlate); meatPlate.add(box(0.4, 0.03, 0.4, C(0xb83a32), -0.6, 0.875, 0.4, { cast: false })); meatPlate.add(box(0.26, 0.08, 0.2, C(0x8a4a2a), -0.6, 0.92, 0.4, { cast: false }));
  const cheese = new THREE.Group(); home.add(cheese); cheese.add(box(0.4, 0.03, 0.4, C(0x2a62b8), 0.6, 0.875, 0.4, { cast: false })); cheese.add(box(0.26, 0.16, 0.2, C(0xf8d040), 0.6, 0.96, 0.4, { cast: false }));
  const lamp = new THREE.PointLight(0xffc880, 6, 10, 1.4); lamp.position.set(0, 2.9, 0.5); home.add(lamp); home.add(box(0.7, 0.2, 0.7, new THREE.MeshBasicMaterial({ color: 0xffd090 }), 0, 3.0, 0.5, { cast: false }));
  const winM = new THREE.MeshBasicMaterial({ color: 0x9ac0e8 }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), winM); win.position.set(-4.6, 2.0, -3.84); home.add(win);
  sunLight(home, 0xffe8c8, 1.5, V(6, 7, 9), V(0, 0, -1), 8, 1024); const hemi = new THREE.HemisphereLight(0xffe8d0, 0x5a3a1a, 1.1); home.add(hemi);
  const dad = humanoid({ skin: 0xe8b894, hair: 0x2a1a14, beard: 'short', top: 0x3a5a7a, bottom: 0x2a2a30, seed: 101 }), mom = humanoid({ skin: 0xf0c4a2, hair: 0x5a3820, longHair: true, top: 0x8a3a5a, bottom: 0x2a2a30, skirt: true, seed: 102 }),
    kidH = humanoid({ skin: 0xf2cdb0, hair: 0x6a3a1a, hairVol: true, top: 0xe8b830, bottom: 0x3a5a8a, smile: true, scale: 0.72, seed: 103 }), lea = humanoid(LEA);
  kippa(dad); kippa(kidH, 0x2a62b8); home.add(dad, mom, kidH, lea);
  home.userData = { dad, mom, kidH, lea, parve, shabbat, candle, meatPlate, cheese, hH, hM, winM, lamp, hemi };
}

// =====================================================================
// SET 5: Supermarkt + Prüfküche
// =====================================================================
const shop = new THREE.Scene(); shop.background = new THREE.Color(0x0a0a0a);
{
  const wall = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe8ece8, 0.03), 4301)); room3(shop, 16, 14, 4.2, wall, M(T.lino));
  const packCols = [0xd83a2a, 0x2a8ad8, 0xf0c020, 0x3ab84a, 0xe86a20, 0x8a3ab8, 0xf4f4f4, 0x2a3a6a];
  const shelf = (x, z, ry, seed) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; shop.add(g); g.add(box(4.2, 2.2, 0.6, C(0xd8dce0), 0, 1.1, -0.1)); const r = rng(seed);
    for (let s = 0; s < 4; s++) { g.add(box(4.2, 0.05, 0.75, C(0xb8bcc0), 0, 0.25 + s * 0.52, 0.1)); for (let i = 0; i < 11; i++) { const c = packCols[Math.floor(r() * 8)]; const h = 0.22 + r() * 0.2; g.add(box(0.32, h, 0.36, C(c), -1.9 + i * 0.38, 0.28 + s * 0.52 + h / 2, 0.15, { cast: false })); } }
    g.add(box(4.2, 0.18, 0.02, C(0x2a8a4a), 0, 2.32, 0.2, { cast: false })); return g; };
  shelf(-2.8, -4.0, 0, 11); shelf(2.8, -4.0, 0, 12); shelf(-2.8, 0.2, 0, 13); shelf(2.8, 0.2, 0, 14); shelf(-6.6, -1.5, Math.PI / 2, 15);
  for (const z of [-3, 1, 5]) shop.add(box(5, 0.06, 0.6, new THREE.MeshBasicMaterial({ color: 0xf4f8ff }), 0, 4.05, z, { cast: false }));
  const ceil = new THREE.PointLight(0xf4f0ff, 8, 16, 1.2); ceil.position.set(0, 3.8, 1); shop.add(ceil);
  sunLight(shop, 0xf8f4ec, 1.6, V(4, 9, 10), V(0, 0, -1), 10, 1024); shop.add(new THREE.HemisphereLight(0xf0f4ff, 0x6a6a6a, 1.5));
  // Prüfküche (x = 20)
  shop.add(box(10, 0.2, 8, M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 2) + (y >> 2)) % 2 ? 0xf0f0f0 : 0xd8dce0, 0.96 + r() * 0.06)); }, 4302)), 20, -0.1, 0, { cast: false }));
  shop.add(box(10, 3.6, 0.3, M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(x % 4 === 3 || y % 4 === 3 ? 0xb8c0c8 : 0xf4f8fa, 0.97 + r() * 0.05)); }, 4303)), 20, 1.8, -3.6));
  const steel = C(0xb8c0c8, { metal: 0.7, rough: 0.3 }); shop.add(box(4, 0.9, 0.9, steel, 20, 0.45, -2.8)); shop.add(box(1.6, 0.9, 0.9, steel, 17.4, 0.45, -2.8));
  for (const [x, h] of [[18.8, 0.5], [19.8, 0.4], [21.4, 0.6]]) shop.add(box(0.5, h, 0.5, C(0x9aa0a8, { metal: 0.7, rough: 0.3 }), x, 0.9 + h / 2, -2.9));
  for (let i = 0; i < 4; i++) shop.add(box(0.3, 0.4, 0.3, C([0xf0d070, 0xe8e4d8, 0xd8963a, 0x8a5a2a][i]), 21.0 + i * 0.4, 1.1, -2.6));
  const kl = new THREE.PointLight(0xf0f4ff, 6, 10, 1.2); kl.position.set(20, 3.4, 0); shop.add(kl);
  const lea = humanoid(LEA), pack = inHand(lea, packMesh(0xd83a2a)); pack.position.set(-0.05, -0.68, 0.18);
  const rabbi = humanoid(RABBI(0)); blackHat(rabbi); const clip = inHand(rabbi, clipboard()); const worker = humanoid({ skin: 0xc89a72, hair: 0x1a1a1a, top: 0xf4f4f4, bottom: 0xf4f4f4, seed: 120 }); apron(worker); worker.userData.head.add(box(0.54, 0.16, 0.54, C(0xf8f8f8), 0, 0.56, 0));
  const big = packMesh(0xd83a2a); shop.add(big);
  shop.add(lea, rabbi, worker);
  shop.userData = { lea, pack, rabbi, worker, clip, big };
}

// =====================================================================
// SET 6: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901);
  const hillM = C(0x8a7a5a); for (const [x, z, w, h] of [[-40, -90, 60, 12], [30, -100, 80, 16]]) for (let s = 0; s < 4; s++) dusk.add(box(w - s * w * 0.2, h / 4, w * 0.6 - s * w * 0.12, hillM, x, h / 8 + s * h / 4, z, { cast: false }));
  olive(dusk, -9, -6, 1.1); olive(dusk, 10, -10, 1);
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
  fit('MAIMONIDES, UM 1190', 72, 150, '#a3241c'); fit('KOSCHER ESSEN LEHRT,', 56, 290, '#3a2a1e'); fit('DAS VERLANGEN ZU BEHERRSCHEN', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 72.83; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix)
const CUTS = [[0, 'hero'], [4, 'israel'], [9, 'shepherds'], [17, 'tora'], [30, 'food'], [36, 'hooves'], [45, 'allowed'], [50, 'pig'], [65, 'water'], [74, 'fish'], [80, 'term'], [87, 'notenough'],
  [93, 'shochet'], [104, 'salt'], [114, 'rule'], [124, 'kid'], [132, 'rabbis'], [141, 'burger'], [144, 'dishes'], [151, 'wait'], [162, 'parve'], [172, 'berlin'], [179, 'search'], [187, 'hechscher'],
  [191, 'inspect'], [200, 'myth'], [209, 'wrong'], [218, 'families'], [225, 'three'], [232, 'identity'], [241, 'sign'], [246, 'loop']];
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
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff', OK = '#55ff55';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const hide = (arr) => arr.forEach(p => { p.visible = false; if (p.userData.setFace) p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = market, exp = 1.3; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const tagA = (a, text, color, h = 1.9) => ui.tags.push([a.localToWorld(V(0, h, 0)), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col, icon) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col, icon }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Markt (Hook, Loop, Burger, Familien) ----------
  if (['hero', 'loop', 'burger', 'families', 'three'].includes(sh.id)) {
    scene = market; exp = 1.3; const Mk = market.userData; const ta = sh.id === 'loop' ? t - DUR : t; const { lea, tom } = Mk;
    hide([lea, tom, ...Mk.fam, ...Mk.shoppers]);
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'burger') {
      put(lea, HX, 0, HZ, 0.45); put(tom, HX2, 0, HZ, -0.45); pose3(lea, 'idle', ta, 0); pose3(tom, 'idle', ta, 1);
      lea.userData.armR.rotation.x = -0.95; lea.userData.armR.rotation.z = 0.12; tom.userData.armR.rotation.x = -1.25 + Math.sin(ta * 2.2) * 0.05; tom.userData.armR.rotation.z = 0.2;
      lea.userData.head.rotation.y = 0.25; tom.userData.head.rotation.y = -0.2;
      Mk.shoppers.forEach((p, i) => { const z0 = [-5.6, -6.2, 2.6, 3.4][i]; const x = [-9 + ta * 0.9, 8 - ta * 0.8, -4.6, 4.2][i]; put(p, x, 0, z0, [Math.PI / 2, -Math.PI / 2, 0.6, -0.7][i]); pose3(p, i < 2 ? 'walk' : 'idle', ta, i); });
      if (sh.id !== 'burger') { heroCam(ta); tag(lea, 'Lea', HERO); tag(tom, 'Tom', ALLY); }
      else { lea.userData.head.rotation.y = Math.sin(t * 9) * 0.3; pose3(lea, 'cross', t); lea.userData.setFace({ smile: false });
        mv(u, V(0.6, 1.8, 3.6), V(0.5, 1.75, 3.1), V(0.1, 1.3, 0.2), V(0.1, 1.3, 0.2), 46); tag(tom, 'Tom', ALLY); tag(lea, 'Lea', HERO);
        tip(wt(142), 'burger', 'Cheeseburger', BAD, [gray('Fleisch + Käse'), red('nicht koscher')]); }
    }
    if (sh.id === 'families' || sh.id === 'three') {
      const seats = [[36, 0], [40, 0], [44, 0]]; const F = Mk.fam;
      [[F[0], TBL[0][0] - 0.6, TBL[0][1] - 0.95, 0], [F[1], TBL[0][0] + 0.6, TBL[0][1] - 0.95, 0], [F[2], TBL[1][0] - 0.6, TBL[1][1] - 0.95, 0], [F[3], TBL[1][0] + 0.6, TBL[1][1] - 0.95, 0], [F[4], TBL[2][0] - 0.6, TBL[2][1] - 0.95, 0], [F[5], TBL[2][0] + 0.6, TBL[2][1] - 0.95, 0]].forEach(([p, x, z, ry], i) => { put(p, x, 0, z, ry); pose3(p, 'laugh', t, i); sitPose(p, 0.52); p.userData.armL.rotation.x = p.userData.armR.rotation.x = -1.2; });
      if (sh.id === 'families') mv(u, V(37.2, 4.6, 9.6), V(37.4, 4.3, 8.8), V(40.2, 0.6, -1.4), V(40.2, 0.6, -1.4), 46);
      else { mv(u, V(38.6, 3.4, 8.4), V(38.7, 3.3, 7.8), V(40.2, 0.6, -1.6), V(40.2, 0.6, -1.6), 48);
        const T3 = TBL.map(([x, z]) => V(x, 2.2, z - 0.95)); if (t >= wt(226)) ui.tags.push([T3[0], 'streng', OK]); if (t >= wt(228)) ui.tags.push([T3[1], 'teilweise', HERO]); if (t >= wt(231)) ui.tags.push([T3[2], 'gar nicht', GREY]); }
      if (sh.id === 'families') info(wt(221), 'Jüdische Familien in Deutschland');
    }
  }
  // ---------- Israel ----------
  if (['israel', 'shepherds', 'tora', 'food', 'hooves', 'allowed', 'pig', 'water', 'fish', 'term', 'notenough', 'shochet', 'salt', 'rule', 'kid'].includes(sh.id)) {
    scene = isr; exp = 1.3; const I = isr.userData;
    hide([I.elder, I.shep, I.shep2, I.shoch, I.fisher, ...I.people]); [I.cow, I.sheep, I.goat, I.pig, I.mom, I.kid].forEach(a => a.visible = false);
    I.herd.forEach((a, i) => { const [x, z, ry] = a.userData.home; a.position.set(x, 0, z); a.rotation.y = ry; apose(a, a.userData.kind, t, i); });
    I.scroll.visible = I.knife.visible = false;
    if (sh.id === 'israel') { mv(u, V(-34, 20, 38), V(-30, 18.5, 34), V(2, 2, -8), V(3, 2, -9), 46); info(wt(4) + 0.05, 'Israel, vor rund 3000 Jahren');
      put(I.shep, 6, 0, 0.5, -0.8); pose3(I.shep, 'walk', t); put(I.shep2, -2, 0, -4, 0.4); pose3(I.shep2, 'idle', t, 1); }
    if (sh.id === 'shepherds') { const z = -1.2 - (t - sh.a) * 0.55; put(I.shep, 5.6, 0, z, Math.PI - 0.25); pose3(I.shep, 'walk', t); I.shep.userData.armR.rotation.x = -0.5;
      put(I.shep2, 3.6, 0, z + 1.1, Math.PI - 0.4); pose3(I.shep2, 'walk', t, 1); I.shep2.userData.armR.rotation.x = -0.5;
      cam(V(6.4, 1.95, z - 5.4), V(4.8, 1.2, z + 0.6), 46); tag(I.shep, 'Hirte', HERO); tag(I.shep2, 'Hirte', ALLY); }
    if (sh.id === 'tora' || sh.id === 'rule') { put(I.elder, -3.0, 0, -12.6, 0.15); pose3(I.elder, 'give', t); I.scroll.visible = true; I.elder.userData.armL.rotation.x = -1.3; I.elder.userData.head.rotation.x = 0.25;
      if (false) I.people.forEach((p, i) => { if (i > 2) return; put(p, [-4.8, -1.4, -3.4][i], 0, [-10.6, -10.4, -9.8][i], [Math.PI - 0.7, Math.PI + 0.7, Math.PI][i]); pose3(p, 'idle', t, i); p.visible = sh.id === 'tora'; });
      if (sh.id === 'tora') { mv(u, V(-1.2, 1.95, -8.4), V(-1.4, 1.9, -9.0), V(-3.0, 1.35, -12.6), V(-3.0, 1.35, -12.6), 46); tag(I.elder, 'Ältester', HERO);
        tip(wt(19), 'scroll', 'Tora', '#ffaa00', [gray('Heilige Schrift des Judentums'), gray('hebräisch: Weisung, Lehre')]); }
      else { I.elder.userData.head.rotation.x = 0.1; mv(u, V(-4.9, 1.85, -9.7), V(-4.7, 1.8, -10.1), V(-3.0, 1.3, -12.5), V(-3.0, 1.3, -12.5), 46); tag(I.elder, 'Ältester', HERO);
        if (t >= wt(119)) chat(wt(119), gray('Steht 3-mal in der Tora:')); } }
    if (sh.id === 'food') { put(I.people[1], -6.4, 0, -10.6, 0.3); put(I.people[0], -5.2, 0, -10.7, -0.4); put(I.people[2], -7.6, 0, -10.6, 0.5); [0, 1, 2].forEach(i => pose3(I.people[i], i === 0 ? 'give' : 'laugh', t, i));
      mv(u, V(-5.4, 2.6, -4.4), V(-5.6, 2.5, -5.0), V(-6.2, 0.95, -9.8), V(-6.2, 0.95, -9.8), 46); chat(wt(32), gray('Und: Was darf man essen?')); }
    if (sh.id === 'hooves') { put(I.cow, -14, 0, 14, 0.5); apose(I.cow, 'idle', t); I.cow.visible = true;
      const k = smoother(u); cam(V(lerp(-10.6, -10.9, k), lerp(0.9, 0.75, k), lerp(18.6, 18.0, k)), V(-13.7, lerp(0.7, 0.45, k), 14.6), 42); tagA(I.cow, 'Rind', OK, 2.1);
      tip(wt(38), 'hoof', 'Erlaubte Landtiere', '#55ff55', [green('+ käuen wieder'), t >= wt(42) ? green('+ gespaltene Hufe') : gray('...')]); }
    if (sh.id === 'allowed') { [[I.cow, -15.5, 14], [I.sheep, -13.2, 14.4], [I.goat, -11.4, 14.2]].forEach(([a, x, z], i) => { put(a, x, 0, z, 0.15 - i * 0.12); apose(a, 'idle', t, i); });
      mv(u, V(-13.3, 3.0, 24.6), V(-13.3, 2.9, 23.6), V(-13.3, 0.9, 14), V(-13.3, 0.9, 14), 46);
      if (t >= wt(46)) tagA(I.cow, 'Rind', OK, 2.2); if (t >= wt(47)) tagA(I.sheep, 'Schaf', OK, 1.8); if (t >= wt(49)) tagA(I.goat, 'Ziege', OK, 1.9); }
    if (sh.id === 'pig') { put(I.pig, -26, 0, 16, 0.55); apose(I.pig, t >= wt(61) ? 'idle' : 'graze', t);
      mv(u, V(-24.0, 1.4, 19.2), V(-24.4, 1.3, 18.6), V(-26, 0.7, 16), V(-26, 0.7, 16), 46); tagA(I.pig, 'Schwein', BAD, 1.5);
      tip(wt(53), 'pig', 'Schwein', BAD, [green('+ gespaltene Hufe'), t >= wt(56) ? red('- käut nicht wieder') : gray('...')]);
      if (t >= wt(61)) { ui.tip = null; chat(wt(61), red('Schwein: verboten')); } }
    if (sh.id === 'water') { put(I.fisher, 31.2, 0.12, 3.4, -0.9); pose3(I.fisher, 'give', t); I.fisher.userData.armL.rotation.x = -1.3;
      mv(u, V(27.2, 2.6, 8.6), V(27.6, 2.5, 7.8), V(32.4, 1.0, 3.6), V(32.6, 1.0, 3.6), 46); tag(I.fisher, 'Fischer', HERO);
      tip(wt(68), 'fish', 'Wassertiere', '#55ffff', [green('+ Flossen'), t >= wt(72) ? green('+ Schuppen') : gray('...')]); }
    if (sh.id === 'fish') { I.shr.forEach((s, i) => s.rotation.y = i + Math.sin(t * 3 + i) * 0.1);
      mv(u, V(30.4, 2.8, 9.2), V(30.4, 2.6, 8.7), V(30.4, 0.2, 6.0), V(30.4, 0.2, 6.0), 46);
      if (t >= wt(74)) ui.tags.push([V(29.9, 0.85, 6.0), 'Lachs', OK]); if (t >= wt(76)) ui.tags.push([V(30.9, 0.85, 5.8), 'Garnele', BAD]); if (t >= wt(78)) ui.tags.push([V(31.3, 0.62, 6.5), 'Muschel', BAD]); }
    if (sh.id === 'term') { put(I.shep, 7.0, 0, 6.6, 0.4); pose3(I.shep, 'cheer', t); I.shep.userData.setFace({ smile: true });
      mv(u, V(8.4, 2.2, 11.6), V(8.2, 2.1, 10.8), V(7.0, 1.3, 6.4), V(7.0, 1.3, 6.4), 46); tag(I.shep, 'Hirte', HERO);
      tip(wt(83), 'check', 'Koscher', '#ffff55', [gray('hebräisch: kascher'), green('= tauglich, erlaubt')]); }
    if (sh.id === 'notenough') { put(I.cow, -14, 0, 14, 0.5); apose(I.cow, 'idle', t); put(I.shep2, -12.4, 0, 14.6, -0.6); pose3(I.shep2, 'idle', t); I.shep2.userData.armL.rotation.x = -2.2; I.shep2.userData.armL.rotation.z = -0.3;
      mv(u, V(-11.0, 2.0, 19.2), V(-11.2, 1.95, 18.6), V(-13.2, 1.1, 14.2), V(-13.2, 1.1, 14.2), 46); tag(I.shep2, 'Hirte', ALLY); tagA(I.cow, 'Rind', OK, 2.2); }
    if (sh.id === 'shochet') { put(I.shoch, -22.3, 0, 6.6, 0.1); pose3(I.shoch, 'give', t); I.knife.visible = true; I.shoch.userData.armR.rotation.x = -1.55; I.shoch.userData.armR.rotation.z = 0.35; I.knife.rotation.set(0, 1.5, 0);
      I.shoch.userData.head.rotation.y = 0.35; I.shoch.userData.head.rotation.x = 0.15;
      const k = smoother(u); cam(V(lerp(-20.2, -20.6, k), lerp(2.0, 1.85, k), lerp(10.6, 9.6, k)), V(-22.1, 1.5, 6.6), lerp(46, 42, k)); tag(I.shoch, 'Schächter', HERO);
      tip(wt(100), 'knife', 'Schächtmesser', '#ffaa00', [gray('extrem scharf, ohne Kerbe'), gray('vor jedem Einsatz geprüft')]); }
    if (sh.id === 'salt') { const sp = 1 - clamp01((t - wt(110)) / 0.6); I.salt.visible = t >= wt(112);
      mv(u, V(-21.0, 2.5, 7.2), V(-21.1, 2.35, 6.9), V(-21.7, 0.95, 5.4), V(-21.7, 0.95, 5.4), 46);
      chat(wt(104), red('Blut: verboten')); if (t >= wt(110)) chat(wt(110), gray('1. Wässern  2. Salzen  3. Abspülen')); }
    if (sh.id === 'kid') { put(I.mom, 12.2, 0, 13.6, -0.35); apose(I.mom, 'idle', t); put(I.kid, 13.2, 0, 14.0, -0.6); apose(I.kid, 'idle', t, 2);
      mv(u, V(14.0, 1.5, 17.4), V(13.9, 1.4, 16.8), V(12.6, 0.7, 13.8), V(12.6, 0.7, 13.8), 46); tagA(I.mom, 'Mutterziege', WHITE, 2.0); tagA(I.kid, 'Zicklein', ALLY, 1.9);
      tip(wt(125), 'scroll', 'Exodus 23,19', '#ffaa00', [gray('Koche kein Zicklein in'), gray('der Milch seiner Mutter')]); }
  }
  // ---------- Lehrhaus ----------
  if (sh.id === 'rabbis') { scene = study; exp = 1.45; const R = study.userData.rab;
    [[R[0], -1.3, -0.95, 0.35], [R[1], 0.0, -1.05, 0], [R[2], 1.3, -0.95, -0.35]].forEach(([p, x, z, ry], i) => { put(p, x, 0, z, ry); pose3(p, i === 1 ? 'point' : 'idle', t, i); sitPose(p, 0.5); p.userData.armL.rotation.x = -1.1; });
    R[1].userData.armR.rotation.x = -1.7 + Math.sin(t * 5) * 0.1;
    mv(u, V(0.4, 2.0, 4.0), V(0.3, 1.95, 3.4), V(0, 1.0, -0.6), V(0, 1.0, -0.6), 48); tag(R[0], 'Rabbiner', WHITE); tag(R[1], 'Rabbiner', HERO); tag(R[2], 'Rabbiner', WHITE);
    tip(wt(136), 'x', 'Fleisch und Milch', BAD, [red('nie zusammen'), gray('nicht kochen, nicht essen')]); }
  // ---------- Wohnung ----------
  if (['dishes', 'wait', 'parve', 'identity'].includes(sh.id)) {
    scene = home; exp = 1.35; const Hm = home.userData; hide([Hm.dad, Hm.mom, Hm.kidH, Hm.lea]); Hm.parve.visible = Hm.shabbat.visible = Hm.meatPlate.visible = Hm.cheese.visible = false; Hm.candle.intensity = 0; Hm.winM.color.set(0x9ac0e8); Hm.lamp.intensity = 6;
    Hm.hH.rotation.z = -1.0; Hm.hM.rotation.z = -t * 0.3;
    if (sh.id === 'dishes') { put(Hm.mom, -1.5, 0, -2.4, 0.25); pose(Hm.mom, 'work', t); put(Hm.dad, 1.5, 0, -2.4, -0.25); pose3(Hm.dad, 'give', t, 1);
      mv(u, V(0, 2.3, 7.6), V(0, 2.2, 6.8), V(0, 1.4, -2.8), V(0, 1.4, -2.8), 46); ui.tags.push([V(-1.5, 3.0, -3.5), 'Fleisch', BAD]); ui.tags.push([V(1.5, 3.0, -3.5), 'Milch', '#5599ff']);
      toast(wt(148), 'Fortschritt erzielt!', '2 Sätze Geschirr', 'plates'); }
    if (sh.id === 'wait') { Hm.meatPlate.visible = true; Hm.cheese.visible = true; put(Hm.kidH, 0.6, 0, 1.6, Math.PI); pose3(Hm.kidH, 'sadidle', t); sitPose(Hm.kidH, 0.5); Hm.kidH.position.z = 1.45; Hm.kidH.userData.head.rotation.x = -0.1;
      Hm.kidH.rotation.y = Math.PI; put(Hm.dad, -0.8, 0, -0.15, 0); pose3(Hm.dad, 'idle', t); sitPose(Hm.dad, 0.5); Hm.dad.userData.armL.rotation.x = Hm.dad.userData.armR.rotation.x = -1.2;
      Hm.hM.rotation.z = -(t - sh.a) * 4.0;
      mv(u, V(1.6, 2.1, 4.2), V(1.4, 2.05, 3.6), V(0.0, 1.05, -0.2), V(0.0, 1.05, -0.2), 50); tag(Hm.dad, 'Vater', WHITE);
      eff(wt(154), 'Warten', '1 bis 6 Std.', '#ffaa00'); }
    if (sh.id === 'parve') { Hm.parve.visible = true; const k = smoother(u);
      cam(V(0.1, lerp(2.1, 2.0, k), lerp(3.7, 3.3, k)), V(0.1, 0.92, 0.5), 38); exp = 1.1;
      if (t >= wt(162)) ui.tags.push([V(-0.55, 1.2, 0.55), 'Fisch', WHITE]); if (t >= wt(163)) ui.tags.push([V(0.18, 1.2, 0.5), 'Eier', WHITE]); if (t >= wt(165)) ui.tags.push([V(0.68, 1.2, 0.58), 'Gemüse', WHITE]);
      tip(wt(171), 'egg', 'Parve', '#55ffff', [gray('neutral: weder Fleisch noch Milch'), green('passt zu beidem')]); }
    if (sh.id === 'identity') { Hm.shabbat.visible = true; Hm.candle.intensity = 4 + Math.sin(t * 13) * 0.25; Hm.winM.color.set(0x1a2448); Hm.lamp.intensity = 2;
      [[Hm.lea, -0.75, -0.15, 0.25], [Hm.mom, 0.75, -0.15, -0.25]].forEach(([p, x, z, ry], i) => { put(p, x, 0, z, ry); pose3(p, 'laugh', t, i); sitPose(p, 0.5); p.userData.armL.rotation.x = p.userData.armR.rotation.x = -1.2; });
      put(Hm.dad, -1.6, 0, 0.6, Math.PI / 2 - 0.3); pose3(Hm.dad, 'idle', t, 2); sitPose(Hm.dad, 0.5); Hm.dad.userData.armL.rotation.x = Hm.dad.userData.armR.rotation.x = -1.2;
      mv(u, V(0.3, 2.1, 5.0), V(0.2, 2.05, 4.4), V(-0.3, 1.1, 0.2), V(-0.1, 1.15, 0.2), 46); tag(Hm.lea, 'Lea', HERO); exp = 1.5; info(wt(234) , 'Schabbat-Abend'); }
  }
  // ---------- Supermarkt ----------
  if (['berlin', 'search', 'hechscher', 'inspect', 'myth', 'wrong'].includes(sh.id)) {
    scene = shop; exp = 1.3; const S = shop.userData; hide([S.lea, S.rabbi, S.worker]); S.big.visible = false; S.pack.visible = true;
    if (sh.id === 'berlin') { put(S.lea, 0.1, 0, -1.2, 0.2); pose3(S.lea, 'walk', t); S.lea.userData.armR.rotation.x = -0.5; S.lea.position.z = -2.4 + (t - sh.a) * 0.5; S.pack.visible = false;
      mv(u, V(1.4, 2.6, 4.6), V(1.2, 2.5, 4.0), V(0, 1.1, -1.8), V(0, 1.1, -1.6), 50); tag(S.lea, 'Lea', HERO); info(wt(176), 'Berlin, heute'); }
    if (sh.id === 'search') { put(S.lea, 0.0, 0, -1.6, 0.35); pose3(S.lea, 'phone', t); S.lea.userData.armR.rotation.x = -1.55; S.lea.userData.armR.rotation.z = 0.3; S.lea.userData.head.rotation.x = 0.3; S.pack.rotation.set(0, 0.5, 0);
      mv(u, V(0.8, 1.9, 1.3), V(0.7, 1.85, 0.9), V(0.0, 1.4, -1.6), V(0.0, 1.4, -1.6), 46); tag(S.lea, 'Lea', HERO); }
    if (sh.id === 'hechscher') { S.big.visible = true; S.big.position.set(0, 1.4, 0); S.big.rotation.set(0, Math.sin(t * 1.2) * 0.06, 0);
      const k = smoother(u); cam(V(lerp(0.12, 0.08, k), lerp(1.24, 1.26, k), lerp(0.85, 0.65, k)), V(0.06, 1.24, 0), 46);
      tip(wt(190), 'seal', 'Hechscher', '#55aaff', [gray('Koscher-Siegel auf Produkten'), green('geprüft von Rabbinern')]); }
    if (sh.id === 'inspect' || sh.id === 'myth' || sh.id === 'wrong') { put(S.rabbi, 19.4, 0, -1.4, 0.15); put(S.worker, 21.4, 0, -1.8, -0.35); pose3(S.worker, 'idle', t, 1);
      if (sh.id === 'inspect') { pose3(S.rabbi, 'phone', t); S.rabbi.userData.head.rotation.x = 0.3; S.clip.visible = true;
        mv(u, V(20.6, 2.1, 4.8), V(20.5, 2.05, 4.2), V(20.3, 1.3, -1.6), V(20.2, 1.3, -1.6), 46); tag(S.rabbi, 'Rabbiner (Prüfer)', HERO);
        chat(wt(195), green('[OK]') + ' Zutaten geprüft'); chat(wt(198), green('[OK]') + ' Küche geprüft'); }
      if (sh.id === 'myth') { S.clip.visible = false; pose3(S.rabbi, 'cheer', t); S.rabbi.position.y = 0; S.rabbi.userData.armR.rotation.x = -2.4; S.rabbi.userData.armL.rotation.x = -2.4;
        mv(u, V(20.0, 1.9, 3.4), V(19.9, 1.85, 2.8), V(19.6, 1.5, -1.6), V(19.6, 1.5, -1.6), 46); tag(S.rabbi, 'Rabbiner', HERO);
        tip(wt(203), 'x', 'Mythos', BAD, [gray('„Ein Rabbi segnet das Essen“')]); }
      if (sh.id === 'wrong') { S.clip.visible = true; pose3(S.rabbi, 'phone', t); S.rabbi.userData.head.rotation.x = 0.0; S.rabbi.userData.head.rotation.y = 0.3;
        mv(u, V(18.4, 1.9, 2.4), V(18.6, 1.85, 1.9), V(19.6, 1.4, -1.6), V(19.6, 1.4, -1.6), 46); tag(S.rabbi, 'Rabbiner', HERO);
        tip(wt(210), 'check', 'Stimmt nicht', '#55ff55', [green('Koscher = Regeln'), gray('kein Segen nötig')]); }
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
  scroll: '<rect x="1" y="1" width="1" height="6" fill="#6a4a2a"/><rect x="6" y="1" width="1" height="6" fill="#6a4a2a"/><rect x="2" y="2" width="4" height="4" fill="#eadcb8"/><rect x="3" y="3" width="2" height="1" fill="#3a2a1e"/><rect x="3" y="4" width="2" height="1" fill="#3a2a1e"/>',
  hoof: '<rect x="2" y="1" width="4" height="4" fill="#5a3a26"/><rect x="1" y="5" width="2" height="2" fill="#2a2420"/><rect x="5" y="5" width="2" height="2" fill="#2a2420"/>',
  pig: '<rect x="1" y="1" width="6" height="6" fill="#f0a8a8"/><rect x="2" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="2" height="2" fill="#e06a80"/>',
  fish: '<rect x="1" y="3" width="5" height="2" fill="#e8846a"/><rect x="2" y="2" width="3" height="4" fill="#e8846a"/><rect x="6" y="2" width="1" height="4" fill="#c86a54"/><rect x="2" y="3" width="1" height="1" fill="#101010"/>',
  check: '<rect x="1" y="4" width="1" height="1" fill="#55ff55"/><rect x="2" y="5" width="1" height="1" fill="#55ff55"/><rect x="3" y="6" width="1" height="1" fill="#55ff55"/><rect x="4" y="5" width="1" height="1" fill="#55ff55"/><rect x="5" y="4" width="1" height="1" fill="#55ff55"/><rect x="6" y="3" width="1" height="1" fill="#55ff55"/><rect x="7" y="2" width="1" height="1" fill="#55ff55"/>',
  knife: '<rect x="1" y="5" width="2" height="2" fill="#4a2e1a"/><rect x="3" y="4" width="1" height="1" fill="#d8dce4"/><rect x="4" y="3" width="1" height="1" fill="#d8dce4"/><rect x="5" y="2" width="1" height="1" fill="#d8dce4"/><rect x="6" y="1" width="1" height="1" fill="#ffffff"/>',
  burger: '<rect x="1" y="1" width="6" height="2" fill="#e0a040"/><rect x="1" y="3" width="6" height="1" fill="#4aa83a"/><rect x="1" y="4" width="6" height="1" fill="#f8c020"/><rect x="1" y="5" width="6" height="1" fill="#5a3020"/><rect x="1" y="6" width="6" height="1" fill="#d8963a"/>',
  x: '<rect x="1" y="1" width="2" height="2" fill="#ff5555"/><rect x="5" y="1" width="2" height="2" fill="#ff5555"/><rect x="3" y="3" width="2" height="2" fill="#ff5555"/><rect x="1" y="5" width="2" height="2" fill="#ff5555"/><rect x="5" y="5" width="2" height="2" fill="#ff5555"/>',
  plates: '<rect x="0" y="2" width="4" height="4" fill="#b83a32"/><rect x="1" y="3" width="2" height="2" fill="#f8f8f8"/><rect x="4" y="2" width="4" height="4" fill="#2a62b8"/><rect x="5" y="3" width="2" height="2" fill="#f8f8f8"/>',
  egg: '<rect x="3" y="1" width="2" height="1" fill="#f8f0e0"/><rect x="2" y="2" width="4" height="4" fill="#f8f0e0"/><rect x="3" y="6" width="2" height="1" fill="#f8f0e0"/><rect x="3" y="3" width="2" height="2" fill="#f0c030"/>',
  seal: '<rect x="2" y="1" width="4" height="6" fill="#1f6ad8"/><rect x="1" y="2" width="6" height="4" fill="#1f6ad8"/><rect x="3" y="2" width="1" height="4" fill="#ffffff"/><rect x="4" y="3" width="1" height="1" fill="#ffffff"/><rect x="5" y="2" width="1" height="1" fill="#ffffff"/><rect x="5" y="4" width="1" height="2" fill="#ffffff"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { let txt = cur[0]; const NUM = { 'dreitausend': '3000', 'zwei': '2' }; if (NUM[txt]) txt = NUM[txt];
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
