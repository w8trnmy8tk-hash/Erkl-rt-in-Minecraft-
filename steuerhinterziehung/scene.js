// „Steuerhinterziehung, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
// Zubehör (Steuerhinterziehung)
// =====================================================================
function fedora(ch, col = 0x3a3a40, band = 0x111111) { const g = new THREE.Group(), m = C(col); g.add(box(0.72, 0.04, 0.72, m, 0, 0.52, 0)); g.add(box(0.5, 0.24, 0.5, m, 0, 0.66, 0)); g.add(box(0.51, 0.07, 0.51, C(band), 0, 0.57, 0)); g.add(box(0.14, 0.04, 0.4, C(shade(col, 0.8)), 0, 0.79, 0, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.3; return g; }
function glasses(ch) { const m = C(0x18181a), g = new THREE.Group(); for (const x of [-0.125, 0.125]) { g.add(box(0.18, 0.025, 0.02, m, x, 0.275, 0.26, { cast: false })); g.add(box(0.18, 0.025, 0.02, m, x, 0.165, 0.26, { cast: false })); g.add(box(0.025, 0.12, 0.02, m, x - 0.08, 0.22, 0.26, { cast: false })); g.add(box(0.025, 0.12, 0.02, m, x + 0.08, 0.22, 0.26, { cast: false })); } g.add(box(0.08, 0.02, 0.02, m, 0, 0.25, 0.26, { cast: false })); ch.userData.head.add(g); }
function badge(ch) { ch.userData.body.add(box(0.1, 0.1, 0.02, C(0xe8c040, { metal: 0.6, rough: 0.35 }), -0.13, 1.28, 0.14, { cast: false })); ch.userData.head.add(box(0.1, 0.08, 0.03, C(0xe8c040, { metal: 0.6, rough: 0.35 }), 0, 0.55, 0.29, { cast: false })); }
const moneyMat = C(0x5a8a4a), bandMat = C(0xe8e0c0);
const moneyMesh = () => { const g = new THREE.Group(); g.add(box(0.28, 0.07, 0.14, moneyMat, 0, 0, 0)); g.add(box(0.06, 0.075, 0.145, bandMat, 0, 0, 0, { cast: false })); return g; };
const cashInHand = () => { const g = new THREE.Group(); const m = moneyMesh(); m.rotation.set(0, Math.PI / 2, Math.PI / 2); m.position.set(0, -0.05, 0.12); g.add(m); return g; };
const ledgerMesh = (col = 0x1e3a2a) => { const g = new THREE.Group(); g.add(box(0.36, 0.44, 0.08, C(col), 0, 0, 0.12)); g.add(box(0.3, 0.4, 0.07, C(0xe8e0c8), 0.035, 0, 0.12, { cast: false })); g.add(box(0.06, 0.1, 0.085, C(0xd8b030, { metal: 0.5, rough: 0.4 }), -0.1, 0.1, 0.12, { cast: false })); return g; };
const goldMat = M(T.gold, { metal: 0.6, rough: 0.35 });
function barrel(x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(box(0.62, 0.86, 0.62, M(T.planks), 0, 0.43, 0)); for (const yy of [0.15, 0.71]) g.add(box(0.65, 0.07, 0.65, C(0x2a2a2a, { metal: 0.4 }), 0, yy, 0, { cast: false })); return g; }
function crate(x, y, z, s = 0.6) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(box(s, s * 0.7, s, M(T.planks), 0, s * 0.35, 0)); for (let i = 0; i < 4; i++) g.add(box(0.08, 0.14, 0.08, C(0x3a6a3a, { rough: 0.3 }), -s * 0.3 + i * s * 0.2, s * 0.75, 0, { cast: false })); return g; }
function oldCar(col = 0x111114) {
  const g = new THREE.Group(), body = C(col, { rough: 0.3, metal: 0.5, amt: 0.03 }), chrome = C(0xd8d8dc, { metal: 0.9, rough: 0.25, amt: 0.02 }), tire = C(0x111111), glass = new THREE.MeshStandardMaterial({ color: 0x1a2438, roughness: 0.1, metalness: 0.6 });
  g.add(box(4.2, 0.45, 1.6, body, 0, 0.78, 0)); g.add(box(1.5, 0.66, 1.2, body, 1.25, 1.3, 0)); g.add(box(2.2, 1.0, 1.56, body, -0.55, 1.5, 0)); g.add(box(2.4, 0.1, 1.7, body, -0.55, 2.05, 0));
  g.add(box(1.7, 0.48, 1.6, glass, -0.5, 1.7, 0)); g.add(box(0.06, 0.48, 1.2, glass, 0.56, 1.7, 0));
  g.add(box(0.08, 0.66, 1.0, chrome, 2.02, 1.3, 0)); g.add(box(0.14, 0.14, 1.9, chrome, 2.2, 0.6, 0)); g.add(box(0.14, 0.14, 1.9, chrome, -2.2, 0.6, 0));
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff0c0 }); for (const z of [-0.6, 0.6]) { g.add(box(0.2, 0.3, 0.3, chrome, 2.08, 1.3, z)); g.add(box(0.04, 0.22, 0.22, hl, 2.19, 1.3, z, { cast: false })); }
  for (const x of [-1.4, 1.4]) for (const z of [-0.82, 0.82]) { g.add(box(0.82, 0.82, 0.24, tire, x, 0.41, z)); g.add(box(0.44, 0.44, 0.26, C(0xeeeeee), x, 0.41, z, { cast: false })); g.add(box(0.2, 0.2, 0.28, chrome, x, 0.41, z, { cast: false })); g.add(box(1.0, 0.16, 0.32, body, x, 0.86, z)); }
  for (const z of [-0.9, 0.9]) g.add(box(1.8, 0.07, 0.26, C(0x2a2a2a), 0, 0.56, z)); g.add(box(0.5, 0.6, 1.3, body, -2.05, 1.1, 0));
  return g;
}
function modernCar(col, sporty = false) {
  const g = new THREE.Group(), body = C(col, { rough: 0.25, metal: 0.5, amt: 0.03 }), glass = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.1, metalness: 0.6 }), tire = C(0x151515), rim = C(0xc8c8cc, { metal: 0.8, rough: 0.3 });
  if (sporty) { g.add(box(4.2, 0.55, 1.9, body, 0, 0.55, 0)); g.add(box(1.9, 0.45, 1.6, glass, -0.3, 1.02, 0)); g.add(box(1.4, 0.06, 1.5, body, -0.4, 1.26, 0)); g.add(box(0.5, 0.08, 1.8, body, -2.0, 0.98, 0)); for (const z of [-0.62, 0.62]) g.add(box(0.04, 0.12, 0.4, new THREE.MeshBasicMaterial({ color: 0xfff6dd }), 2.11, 0.62, z, { cast: false })); }
  else { g.add(box(4.8, 1.9, 1.9, body, 0, 1.25, 0)); g.add(box(1.0, 0.8, 1.86, glass, 1.95, 1.55, 0)); g.add(box(3.0, 0.5, 1.92, glass, -0.6, 1.75, 0)); g.add(box(4.82, 0.28, 1.92, C(0x2a5a9a), 0, 0.95, 0, { cast: false })); }
  for (const x of [-1.4, 1.4]) for (const z of [-0.88, 0.88]) { g.add(box(0.7, 0.7, 0.24, tire, x, 0.35, z)); g.add(box(0.4, 0.4, 0.26, rim, x, 0.35, z, { cast: false })); }
  return g;
}
function closedRoom(s, w, d, h, wallM, floorM, frontM = wallM) { room3(s, w, d, h, wallM, floorM, true); s.add(box(w, h, 0.3, frontM, 0, h / 2, d / 2, { cast: false })); }
function interior(o) { const s = new THREE.Scene(); s.background = new THREE.Color(o.bg ?? 0x0a0806); room3(s, o.w, o.d, o.h, o.wall, o.floor, true);
  if (o.sunI !== 0) sunLight(s, o.sunCol ?? 0xffe8c8, o.sunI ?? 1.6, o.sunPos ?? V(5, 7, 9), V(0, 0, -1), Math.max(o.w, o.d) * 0.7, 1024);
  s.add(new THREE.HemisphereLight(o.hemiTop ?? 0xffe8d0, o.hemiBot ?? 0x4a3a2a, o.hemiI ?? 1.0)); return s; }
function chair(s, x, z, ry = 0, col = 0x5a3a1a) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(0.55, 0.08, 0.55, C(col), 0, 0.48, 0)); g.add(box(0.55, 0.7, 0.08, C(col), 0, 0.85, -0.26)); for (const [a, b] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) g.add(box(0.06, 0.48, 0.06, C(shade(col, 0.8)), a, 0.24, b)); s.add(g); return g; }
function table(s, x, z, w, d, col = 0x6a4a2a, h = 0.8) { s.add(box(w, 0.08, d, C(col), x, h, z)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) s.add(box(0.08, h, 0.08, C(shade(col, 0.8)), x + a * (w / 2 - 0.1), h / 2, z + b * (d / 2 - 0.1))); }
function paperStack(s, x, y, z, n, seed = 1) { const r = rng(seed); for (let i = 0; i < n; i++) s.add(box(0.36, 0.05, 0.46, C(i % 3 ? 0xe8e2d0 : 0xd8cca8), x + (r() - 0.5) * 0.05, y + 0.025 + i * 0.05, z + (r() - 0.5) * 0.05, { cast: i === n - 1 })); }
const canvasTex = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { cv, t }; };

// ---------- Figuren ----------
const CAPONE = { skin: 0xe0a882, hair: 0x1a1410, top: 0x4a4a58, bottom: 0x4a4a58, coat: true, tie: 0xb02020, shoe: 0x1a1a1a, eye: '#2a1a10', smile: true, seed: 51 };
const WILSON = { skin: 0xf0c4a2, hair: 0x5a3a22, top: 0x6a5038, bottom: 0x6a5038, coat: true, tie: 0x24345a, shoe: 0x3a2a1a, eye: '#3a5a7a', seed: 52 };
const GANG = i => ({ skin: [0xe8b894, 0xd8a07a, 0xf0c4a2, 0xe0a882][i % 4], hair: [0x1a1410, 0x3a2a1a, 0x2a1a14, 0x111111][i % 4], top: [0x22222a, 0x2a2a34, 0x1e1e24, 0x30303a][i % 4], bottom: 0x22222a, coat: true, tie: [0x6a1a1a, 0x1a1a1a, 0x5a4a1a, 0x1a2a4a][i % 4], shoe: 0x111111, beard: i === 1 ? 'mustache' : undefined, seed: 70 + i });
const COP = { skin: 0xf0c4a2, hair: 0x8a5a2a, beard: 'mustache', beardCol: 0x6a4020, top: 0x1e2a50, bottom: 0x1e2a50, belt: 0x111111, hat: 'cap', hatCol: 0x1e2a50, shoe: 0x111111, seed: 80 };
const JUDGE = i => ({ skin: [0xe8b894, 0xf0c4a2, 0xe0a882][i], hair: [0xe8e8e8, 0xb8b8b8, 0x9a9a9a][i], bald: i === 0, top: 0x111114, bottom: 0x111114, coat: true, shoe: 0x111111, beard: i === 2 ? 'short' : undefined, beardCol: 0x9a9a9a, seed: 85 + i });
const TOM = { skin: 0xe8b894, hair: 0x8a5a2a, hairVol: true, beard: 'short', beardCol: 0x7a4a22, top: 0x2a5a9a, bottom: 0x3a3a42, belt: 0x6a4a2a, shoe: 0x4a3020, eye: '#3a5a8a', seed: 61 };
const KUNDIN = { skin: 0xf0c4a2, hair: 0xb8925a, longHair: true, top: 0xc8506a, bottom: 0x2a3448, shoe: 0xf0f0f0, eye: '#3a6a3a', smile: true, seed: 62 };
const PRUEF = { skin: 0xc89a72, hair: 0x2a1a14, longHair: true, top: 0x3a3a4a, bottom: 0x3a3a4a, coat: true, shoe: 0x1a1a1a, eye: '#2a1a10', seed: 63 };
const LENA = { skin: 0xe8b894, hair: 0x4a2a1a, longHair: true, top: 0x3a8a5a, bottom: 0x2a3448, shoe: 0xf0f0f0, eye: '#3a2a1a', smile: true, seed: 64 };
const mkCapone = () => { const c = humanoid(CAPONE); fedora(c, 0xd8d0c0, 0x1a1a1a); return c; };
const mkWilson = () => { const c = humanoid(WILSON); fedora(c, 0x5a4632, 0x2a1e14); glasses(c); return c; };
const mkGang = i => { const c = humanoid(GANG(i)); fedora(c, [0x1a1a1e, 0x3a3a40, 0x2a2420, 0x1a1a1e][i % 4]); return c; };
const mkCop = () => { const c = humanoid(COP); badge(c); c.userData.hatExtra = 0.12; return c; };

// =====================================================================
// SET 1: Chicago bei Nacht (Hook, Straße, Lieferung, Polizei, Villa)
// =====================================================================
const chi = new THREE.Scene();
{
  skyDome(chi, 0x060a1e, 0x16204a, 0x4a3050, V(0.35, 0.3, -1), [0.75, 0.8, 1.0]); chi.fog = new THREE.Fog(0x1e1a34, 40, 170);
  const asphalt = new THREE.MeshStandardMaterial({ map: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x2c2c32, 0.14), 3001), roughness: 0.3, metalness: 0.3 });
  chi.add(box(500, 1, 500, C(0x1a1a1e), 0, -0.5, 0, { cast: false }));
  chi.add(box(500, 0.06, 9.5, asphalt, 0, 0.03, 6.25, { cast: false, uvScale: 0.6 }));
  const walk = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x6a6660, 0.06); for (let i = 0; i < 16; i++) { px(c, 0, i, 0x4a4640); px(c, i, 0, 0x4a4640); } }, 3002));
  chi.add(box(500, 0.15, 5.5, walk, 0, 0.075, -1.25, { cast: false })); chi.add(box(500, 0.15, 4, walk, 0, 0.075, 13, { cast: false }));
  for (let x = -60; x < 60; x += 3) chi.add(box(1.4, 0.065, 0.18, C(0xd8c890), x, 0.04, 6.25, { cast: false }));
  const r = rng(3003); const brickMs = [M(T.brick), M(T.brickDark), M(T.brickGrey), M(tileTex(0x8a6a4a, 0x5a4430, 3004))];
  const winLit = M(T.window, { emissive: 0xffffff, ei: 0.85 }), winDark = M(T.windowDark), iron = C(0x1a1a1c, { metal: 0.5, rough: 0.5 });
  const building = (cx, w, h, front, dir, mi, skipDoor = false) => { const g = new THREE.Group(); chi.add(g); const cz = front - dir * 4;
    g.add(box(w, h, 8, brickMs[mi % 4], cx, h / 2, cz)); g.add(box(w + 0.3, 0.5, 8.3, C(0x3a3430), cx, h + 0.25, cz));
    for (let y = 4.2; y < h - 1.5; y += 3) for (let x = cx - w / 2 + 1.4; x <= cx + w / 2 - 1.2; x += 2.2) g.add(box(1.2, 1.6, 0.1, r() < 0.4 ? winLit : winDark, x, y, front + dir * 0.05, { cast: false }));
    if (!skipDoor) { g.add(box(w - 1.6, 2.2, 0.1, r() < 0.5 ? winLit : winDark, cx, 1.5, front + dir * 0.05, { cast: false })); g.add(box(w - 1.2, 0.5, 0.3, C([0x6a1a1a, 0x1a3a2a, 0x2a2a4a][mi % 3]), cx, 2.9, front + dir * 0.2)); }
    if (mi % 3 === 1) for (let y = 3.6; y < h - 2; y += 3) { g.add(box(3.2, 0.08, 1.1, iron, cx + 1, y, front + dir * 0.6)); g.add(box(3.2, 0.06, 0.06, iron, cx + 1, y + 0.9, front + dir * 1.12)); for (let k = 0; k < 5; k++) g.add(box(0.05, 0.9, 0.05, iron, cx - 0.5 + k * 0.75, y + 0.45, front + dir * 1.12)); }
  };
  // Reihe A (Front z=-4): Speakeasy in der Mitte
  building(0, 10, 14, -4, 1, 0, true);
  [[-10, 10, 12, 1], [-20, 10, 16, 2], [-30, 10, 11, 3], [-40, 10, 13, 1], [10, 10, 11, 2], [20, 10, 15, 1], [30, 10, 12, 3], [40, 10, 14, 0]].forEach(([x, w, h, m]) => building(x, w, h, -4, 1, m));
  [[-35, 10, 12, 2], [-25, 10, 15, 0], [-15, 10, 11, 1], [-5, 10, 13, 3], [5, 10, 16, 2], [15, 10, 12, 1], [25, 10, 14, 0], [35, 10, 11, 3]].forEach(([x, w, h, m]) => building(x, w, h, 15, -1, m));
  // Speakeasy-Tür
  const glow = new THREE.MeshBasicMaterial({ color: 0xffa64a }); chi.add(box(1.6, 2.6, 0.05, glow, 0, 1.45, -3.99, { cast: false }));
  const dw = M(T.darkwood); for (const x of [-0.92, 0.92]) chi.add(box(0.22, 2.95, 0.3, dw, x, 1.47, -3.85)); chi.add(box(2.06, 0.26, 0.3, dw, 0, 3.0, -3.85));
  const leaf = box(0.8, 2.6, 0.08, dw, 0, 0, 0); leaf.position.set(-1.0, 1.45, -3.55); leaf.rotation.y = 1.1; chi.add(leaf);
  chi.add(box(2.4, 0.12, 0.7, C(0x5a5650), 0, 0.21, -3.6));
  const awn = box(3.8, 0.12, 1.9, M(tex(16, 16, (c) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) px(c, x, y, (x >> 2) % 2 ? 0xe8e0d0 : 0xa81e24); }, 3005)), 0, 3.45, -3.1); awn.rotation.x = 0.28; chi.add(awn);
  const neonR = new THREE.MeshBasicMaterial({ color: 0xff3a5a }), neonC = new THREE.MeshBasicMaterial({ color: 0x5af0ff });
  chi.add(box(4.2, 0.09, 0.09, neonC, 0, 4.15, -3.88, { cast: false }));
  const ns = new THREE.Group(); ns.position.set(2.35, 5.4, -3.2); chi.add(ns); ns.add(box(0.24, 3.4, 1.3, C(0x14141a), 0, 0, 0));
  for (const sx of [-0.13, 0.13]) { ns.add(box(0.03, 3.3, 0.07, neonR, sx, 0, -0.6, { cast: false })); ns.add(box(0.03, 3.3, 0.07, neonR, sx, 0, 0.6, { cast: false })); ns.add(box(0.03, 0.07, 1.25, neonR, sx, 1.62, 0, { cast: false })); ns.add(box(0.03, 0.07, 1.25, neonR, sx, -1.62, 0, { cast: false }));
    const gl = tex(8, 12, (c) => { c.clearRect(0, 0, 8, 12); c.fillStyle = '#7aff8a'; c.fillRect(0, 1, 8, 1); c.fillRect(1, 2, 6, 1); c.fillRect(2, 3, 4, 1); c.fillRect(3, 4, 2, 1); c.fillRect(3, 5, 2, 4); c.fillRect(1, 9, 6, 1); c.fillStyle = '#ffd040'; c.fillRect(5, 0, 1, 1); }, 3006);
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.35), new THREE.MeshBasicMaterial({ map: gl, transparent: true })); gm.position.set(sx * 1.05, 0.55, 0); gm.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2; ns.add(gm);
    for (let k = 0; k < 3; k++) { const st = box(0.03, 0.18, 0.18, k % 2 ? neonC : neonR, sx * 1.05, -0.6 - k * 0.32, 0, { cast: false }); ns.add(st); } }
  const nl = new THREE.PointLight(0xff3a5a, 5, 7, 1.5); nl.position.set(2.35, 5.2, -2.4); chi.add(nl);
  const dl = new THREE.PointLight(0xff9a40, 9, 8, 1.4); dl.position.set(0, 1.8, -3.0); chi.add(dl);
  for (const x of [-1.5, 1.5]) { chi.add(box(0.22, 0.3, 0.22, new THREE.MeshBasicMaterial({ color: 0xffd890 }), x, 2.75, -3.85, { cast: false })); }
  const lamp = (x, z, int = 18) => { chi.add(box(0.16, 4.4, 0.16, iron, x, 2.2, z)); chi.add(box(0.5, 0.12, 0.5, iron, x, 4.45, z)); chi.add(box(0.36, 0.42, 0.36, new THREE.MeshBasicMaterial({ color: 0xffd890 }), x, 4.2, z, { cast: false }));
    const l = new THREE.PointLight(0xffb868, int, 16, 1.3); l.position.set(x, 3.9, z); chi.add(l); };
  lamp(-2.7, 0.9); lamp(9, 0.9); lamp(-14, 0.9); lamp(-24, 0.9); lamp(22, 0.9); lamp(30, 0.9); lamp(-2, 11.6, 26); lamp(14, 11.6); lamp(-18, 11.6);
  const fill = new THREE.PointLight(0xffc890, 7, 9, 1.4); fill.position.set(-1.8, 2.6, 4.2); chi.add(fill);
  chi.add(barrel(-1.9, 0.15, -3.3), barrel(-2.6, 0.15, -3.5), crate(1.75, 0.15, -3.4), crate(1.75, 0.57, -3.4, 0.5));
  const car = oldCar(0x121216); car.position.set(4.6, 0.06, 3.3); car.rotation.y = Math.PI; chi.add(car);
  // Lieferwagen mit Alkohol (x≈-22)
  const truck = new THREE.Group(); truck.position.set(-22, 0.06, 4.0); chi.add(truck); const tg = C(0x2a3a2a, { rough: 0.5, metal: 0.3 });
  truck.add(box(5.2, 0.4, 2.0, C(0x1a1a1a), 0, 0.75, 0)); truck.add(box(1.6, 1.4, 1.9, tg, 2.0, 1.65, 0)); truck.add(box(1.0, 0.8, 1.6, tg, 3.2, 1.3, 0)); truck.add(box(3.4, 0.12, 2.1, M(T.planks), -0.8, 1.0, 0));
  for (const z of [-1.0, 1.0]) truck.add(box(3.4, 0.6, 0.08, M(T.planks), -0.8, 1.35, z)); for (const x of [-1.8, 2.2]) for (const z of [-0.95, 0.95]) truck.add(box(0.8, 0.8, 0.25, C(0x111111), x, 0.4, z));
  for (let i = 0; i < 5; i++) truck.add(barrel(-2.0 + (i % 3) * 0.7, 1.06, (i < 3 ? -0.4 : 0.4)));
  chi.add(crate(-19.6, 0.15, 0.2), crate(-19.0, 0.15, -0.4), crate(-19.3, 0.57, -0.1, 0.5));
  const tl = new THREE.PointLight(0xffb060, 10, 10, 1.3); tl.position.set(-20.5, 2.6, -2.6); chi.add(tl); chi.add(box(1.4, 2.4, 0.06, glow, -20.5, 1.35, -3.99, { cast: false }));
  // Villa (x≈80)
  const lawn = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x2e4a2a, 0.12), 3010)); chi.add(box(60, 0.12, 30, lawn, 82, 0.06, -10, { cast: false }));
  chi.add(box(6, 0.13, 10, C(0x8a8478), 82, 0.07, -2, { cast: false }));
  const vw = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xece4d2, 0.04), 3011)); chi.add(box(22, 8, 10, vw, 82, 4, -14)); chi.add(box(22.6, 0.6, 10.6, C(0x3a3a40), 82, 8.3, -14));
  for (let s = 0; s < 3; s++) chi.add(box(22 - s * 3, 0.8, 10 - s * 3, M(T.roof), 82, 8.9 + s * 0.8, -14));
  for (let x = 74; x <= 90; x += 3.2) { chi.add(box(0.7, 7.6, 0.7, M(T.white), x, 3.8, -8.4)); }
  chi.add(box(19, 0.6, 2.4, M(T.white), 82, 7.6, -8.4));
  for (const y of [1.8, 5.2]) for (let x = 73.4; x <= 90.6; x += 2.4) if (Math.abs(x - 82) > 1.2 || y > 3) chi.add(box(1.2, 1.8, 0.1, y > 3 && x % 2 > 1 ? winDark : winLit, x, y, -8.95, { cast: false }));
  chi.add(box(1.8, 2.8, 0.1, glow, 82, 1.4, -8.95, { cast: false }));
  const vl = new THREE.PointLight(0xffc070, 14, 14, 1.3); vl.position.set(82, 3.5, -5); chi.add(vl);
  const vl2 = new THREE.PointLight(0xffc890, 8, 12, 1.3); vl2.position.set(79, 2.6, 4); chi.add(vl2);
  const car2 = oldCar(0x5a1418); car2.position.set(78, 0.13, -1.5); car2.rotation.y = -Math.PI / 2 - 0.25; chi.add(car2);
  const car3 = oldCar(0x14141a); car3.position.set(86.5, 0.13, -1.0); car3.rotation.y = -Math.PI / 2 + 0.3; chi.add(car3);
  for (let x = 66; x <= 98; x += 1.0) if (Math.abs(x - 82) > 3) chi.add(box(0.12, 1.2, 0.12, iron, x, 0.6, 4));
  chi.add(box(32, 0.08, 0.08, iron, 82, 1.15, 4));
  const moon = sunLight(chi, 0xa8baff, 1.15, V(-30, 42, 48), V(0, 0, 0), 40);
  chi.add(new THREE.HemisphereLight(0x3a4a7a, 0x1a1410, 0.9));
  const capone = mkCapone(), wilson = mkWilson(), gang = [0, 1, 2, 3].map(mkGang), cop = mkCop();
  const witness = humanoid({ skin: 0xf0c4a2, hair: 0x6a4422, top: 0x6a5a3a, bottom: 0x3a3428, hat: 'cap', hatCol: 0x4a443c, shoe: 0x2a1a10, seed: 90 });
  const cCash = inHand(capone, cashInHand()), wLedger = inHand(wilson, ledgerMesh()), gEnv = inHand(gang[1], (() => { const g = new THREE.Group(); g.add(box(0.26, 0.04, 0.16, C(0xd8c8a0), 0, 0, 0.12)); return g; })());
  chi.add(capone, wilson, ...gang, cop, witness);
  chi.userData = { capone, wilson, gang, cop, witness, cCash, wLedger, gEnv, moon };
}

// =====================================================================
// SET 2: Innenräume 1930 (Büro Wilson, Capones Salon, Gericht, Zelle)
// =====================================================================
const panel = M(tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x5a3a24, 0.08); for (let y = 0; y < 16; y++) { px(c, 0, y, 0x3a2414); px(c, 8, y, 0x3a2414); } }, 3101));
const office = interior({ w: 8, d: 7, h: 3.4, wall: panel, floor: M(T.planks), sunCol: 0x8a9ad8, sunI: 0.9, sunPos: V(-5, 6, 9), hemiTop: 0xffd8b0, hemiBot: 0x2a1a10, hemiI: 0.7 });
{
  const s = office; table(s, 0, -1.5, 2.2, 1.1, 0x4a2e1a); chair(s, 0, -2.4, 0, 0x3a2414);
  s.add(box(0.3, 0.06, 0.3, C(0xb89030, { metal: 0.6 }), 0.75, 0.87, -1.75)); s.add(box(0.05, 0.36, 0.05, C(0xb89030, { metal: 0.6 }), 0.75, 1.05, -1.75)); s.add(box(0.5, 0.14, 0.24, new THREE.MeshStandardMaterial({ color: 0x1a7a3a, emissive: 0x0a4a1a, roughness: 0.4 }), 0.75, 1.26, -1.65));
  const ll = new THREE.PointLight(0xffc070, 7, 6, 1.4); ll.position.set(0.75, 1.15, -1.45); s.add(ll);
  paperStack(s, -0.75, 0.84, -1.6, 6, 1); paperStack(s, 0.2, 0.84, -1.75, 3, 2);
  for (const [x, z, n] of [[-2.4, -0.6, 14], [-2.0, 0.4, 9], [2.4, -0.3, 12], [2.0, 0.7, 7], [-1.6, -2.8, 18], [1.8, -2.9, 16]]) paperStack(s, x, 0, z, n, x * 10 + z);
  for (let i = 0; i < 3; i++) { s.add(box(0.9, 1.6, 0.7, C(0x5a5e58, { metal: 0.4, rough: 0.5 }), -3.2 + i * 0.95, 0.8, -3.1)); for (let k = 0; k < 3; k++) s.add(box(0.5, 0.06, 0.04, C(0xc8c8c8, { metal: 0.7 }), -3.2 + i * 0.95, 0.4 + k * 0.5, -2.74, { cast: false })); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshBasicMaterial({ color: 0x1a2a5a })); win.position.set(2.2, 2.1, -3.33); s.add(win);
  for (let k = 0; k < 7; k++) s.add(box(1.7, 0.04, 0.03, C(0xc8b890), 2.2, 1.45 + k * 0.2, -3.3, { cast: false }));
  // offenes Kassenbuch (Großaufnahme)
  const { cv, t } = canvasTex(512, 320); const book = new THREE.Group(); book.position.set(-0.3, 0.845, -1.25); s.add(book);
  book.add(box(0.9, 0.03, 0.6, C(0x1e3a2a), 0, 0, 0)); const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.55), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); pg.rotation.x = -Math.PI / 2; pg.position.y = 0.02; book.add(pg);
  const wilson = mkWilson(), ledger = inHand(wilson, ledgerMesh()); s.add(wilson);
  s.userData = { wilson, ledger, book, bookCv: cv, bookTex: t, drawn: false };
}
const lounge = interior({ w: 8, d: 7, h: 3.6, wall: M(T.wallpaperRed), floor: M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0x1a1a1a : 0xe8e0d0, 0.95 + r() * 0.1)); }, 3102)), sunCol: 0xffc890, sunI: 1.1, sunPos: V(4, 7, 9), hemiTop: 0xffd0a0, hemiBot: 0x3a1a10, hemiI: 0.8 });
{
  const s = lounge; table(s, 0, -0.9, 2.4, 1.2, 0x3a2010);
  for (let i = 0; i < 14; i++) { const m = moneyMesh(); m.position.set(-0.9 + (i % 5) * 0.3, 0.88 + Math.floor(i / 10) * 0.07, -1.25 + Math.floor((i % 10) / 5) * 0.2); s.add(m); }
  for (let i = 0; i < 6; i++) s.add(box(0.26, 0.1, 0.12, goldMat, 0.55 + (i % 3) * 0.28, 0.89 + Math.floor(i / 3) * 0.1, -0.8));
  const arm = new THREE.Group(); arm.position.set(0, 0, -2.1); s.add(arm); arm.add(box(1.2, 0.5, 0.9, C(0x6a1a1a), 0, 0.25, 0)); arm.add(box(1.2, 1.1, 0.25, C(0x6a1a1a), 0, 0.8, -0.35)); for (const x of [-0.55, 0.55]) arm.add(box(0.2, 0.75, 0.9, C(0x5a1414), x, 0.4, 0));
  s.add(box(2.2, 1.4, 0.5, M(T.brickDark), -2.6, 0.7, -3.2)); s.add(box(1.2, 0.7, 0.1, new THREE.MeshBasicMaterial({ color: 0xff8a2a }), -2.6, 0.5, -2.94, { cast: false })); const fl = new THREE.PointLight(0xff8a3a, 5, 5, 1.4); fl.position.set(-2.6, 0.7, -2.4); s.add(fl);
  s.add(box(1.2, 0.2, 1.2, goldMat, 0, 3.3, -0.6)); for (let k = 0; k < 4; k++) s.add(box(0.14, 0.2, 0.14, new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), -0.4 + (k % 2) * 0.8, 3.1, -1.0 + Math.floor(k / 2) * 0.8, { cast: false }));
  const cl = new THREE.PointLight(0xffd090, 10, 8, 1.3); cl.position.set(0, 2.8, -0.4); s.add(cl);
  for (const x of [-3.2, 3.2]) { s.add(box(0.9, 1.3, 0.1, M(T.gold, { metal: 0.6, rough: 0.35 }), x * 0.6, 2.1, -3.33)); s.add(box(0.7, 1.1, 0.12, C([0x3a5a8a, 0x8a4a2a][x > 0 ? 1 : 0]), x * 0.6, 2.1, -3.32, { cast: false })); }
  const capone = mkCapone(), g1 = mkGang(0), g2 = mkGang(2), cCash = inHand(capone, cashInHand()); s.add(capone, g1, g2);
  s.userData = { capone, g1, g2, cCash };
}
const court = interior({ w: 12, d: 10, h: 5, wall: panel, floor: M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(((x >> 3) + (y >> 3)) % 2 ? 0x6a5a48 : 0x8a7a64, 0.95 + r() * 0.1)); }, 3103)), sunCol: 0xffe2b8, sunI: 1.9, sunPos: V(8, 9, 7), hemiTop: 0xffe8d0, hemiBot: 0x3a2a1a, hemiI: 1.0 });
{
  const s = court, dw = M(T.darkwood);
  s.add(box(2.2, 0.5, 7.0, dw, -4.6, 0.25, -0.5)); s.add(box(0.5, 1.75, 7.0, dw, -3.5, 0.87, -0.5));
  for (const z of [-2.8, -0.5, 1.8]) { s.add(box(0.6, 1.4, 0.6, C(0x3a1a1a), -5.0, 1.2, z)); }
  s.add(box(0.1, 3.0, 2.0, C(0x8a1a1a), -5.84, 3.0, -0.5, { cast: false })); s.add(box(0.12, 1.0, 1.0, goldMat, -5.82, 3.3, -0.5, { cast: false }));
  for (const z of [-3.6, 2.6]) { const w2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ color: 0xffe8c0 })); w2.position.set(-5.84, 2.8, z); w2.rotation.y = Math.PI / 2; s.add(w2); }
  for (let k = 0; k < 4; k++) { s.add(box(3.6, 0.5, 0.5, dw, 3.0, 0.45, -3.6 + k * 1.6)); s.add(box(3.6, 0.8, 0.12, dw, 3.0, 0.9, -3.85 + k * 1.6)); }
  table(s, -0.4, 0.8, 1.6, 0.9, 0x4a2e1a); table(s, -0.4, -2.4, 1.6, 0.9, 0x4a2e1a); paperStack(s, -0.4, 0.84, -2.4, 4, 9);
  s.add(box(0.06, 0.06, 0.3, C(0x5a3a1a), -3.45, 1.82, -0.2, { cast: false }));
  const judges = [0, 1, 2].map(i => humanoid(JUDGE(i))), capone = mkCapone(), wilson = mkWilson(), tom = humanoid(TOM), cop = mkCop();
  const gavel = new THREE.Group(); gavel.add(box(0.05, 0.05, 0.4, C(0x5a3a1a), 0, 0, 0.2)); gavel.add(box(0.12, 0.12, 0.24, C(0x4a2a14), 0, 0, 0.42)); judges[0].userData.armR.add(gavel); gavel.position.set(0, -0.68, 0.05);
  s.add(...judges, capone, wilson, tom, cop); s.userData = { judges, capone, wilson, tom, cop };
}
const cell = interior({ w: 4.4, d: 4, h: 3.2, wall: M(T.concrete), floor: M(T.concrete), sunCol: 0xb8c8ff, sunI: 1.5, sunPos: V(2, 6, 9), hemiTop: 0x8a9ac8, hemiBot: 0x2a2a30, hemiI: 0.7, bg: 0x0a0a0e });
{
  const s = cell, iron = C(0x2a2a2e, { metal: 0.6, rough: 0.4 });
  for (let x = -2.1; x <= 2.11; x += 0.34) s.add(box(0.06, 3.2, 0.06, iron, x, 1.6, 2.0)); for (const y of [0.1, 2.35, 3.1]) s.add(box(4.4, 0.1, 0.1, iron, 0, y, 2.0));
  s.add(box(2.2, 0.45, 0.9, C(0x5a5a5a, { metal: 0.3 }), 0.4, 0.42, -1.4)); s.add(box(2.1, 0.12, 0.85, C(0x8a8470), 0.4, 0.7, -1.4)); s.add(box(0.6, 0.1, 0.4, C(0xe0dccc), -0.4, 0.8, -1.5));
  const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: 0x3a4a8a })); w.position.set(-0.6, 2.6, -1.98); s.add(w); for (let k = 0; k < 4; k++) s.add(box(0.04, 0.5, 0.06, iron, -0.9 + k * 0.2, 2.6, -1.94));
  const cl = new THREE.PointLight(0xffb060, 4, 6, 1.4); cl.position.set(1.4, 2.6, 3.0); s.add(cl);
  const capone = mkCapone(), tom = humanoid(TOM); s.add(capone, tom); s.userData = { capone, tom };
}

// =====================================================================
// SET 3: Deutschland heute (Straße, Finanzamt, Goldhaufen, Schule)
// =====================================================================
const town = new THREE.Scene();
{
  skyDome(town, 0x3a7ad0, 0x8ab8e8, 0xdce8f0, V(-0.4, 0.5, 0.5)); town.fog = new THREE.Fog(0xdce8f0, 80, 320); clouds(town, 21, 0xffffff, 60, 22, 200, 0.85);
  town.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false, uvScale: 1 }));
  town.add(box(600, 0.06, 7, M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x5a5a60, 0.1), 3201)), 0, 0.03, 5.5, { cast: false }));
  for (let x = -120; x < 160; x += 3) town.add(box(1.5, 0.07, 0.15, C(0xf0f0f0), x, 0.04, 5.5, { cast: false }));
  town.add(box(600, 0.15, 2, M(T.concrete), 0, 0.075, 1.0, { cast: false }));
  const r = rng(3202); const cols = [0xf2ece0, 0xe8d8b8, 0xd8e0e8, 0xf0dcc8, 0xe0e8d0];
  const winM = M(T.windowDark);
  const house = (x, w, h, col) => { town.add(box(w, h, 7, C(col), x, h / 2, -4.5)); for (let s = 0; s < 4; s++) town.add(box(w + 0.4, 0.9, 7.4 - s * 1.9, M(T.roofRed), x, h + 0.45 + s * 0.9, -4.5));
    for (let y = 1.6; y < h - 0.8; y += 2.6) for (let xx = x - w / 2 + 1.2; xx <= x + w / 2 - 1; xx += 2) town.add(box(1.0, 1.3, 0.1, winM, xx, y, -0.98, { cast: false })); };
  for (const x of [-14, -6, 6, 14, 30, 38, 46, 72, 80]) house(x, 7, 6 + Math.floor(r() * 3), cols[Math.floor(r() * 5)]);
  const van = modernCar(0xf2f2f2); van.position.set(0.5, 0.06, 4.0); town.add(van);
  for (let i = 0; i < 3; i++) town.add(box(0.5, 0.4, 0.3, C([0xc83a2a, 0x3a5a9a, 0x2a2a2a][i], { rough: 0.5 }), -2.8 + i * 0.05, 0.35 + i * 0.4, 1.0)); // Werkzeugkisten
  const sport = modernCar(0xd81e1e, true); sport.position.set(22, 0.06, 4.2); sport.rotation.y = Math.PI; town.add(sport);
  // Finanzamt (x≈-32)
  const conc = M(tileTex(0xc8c4b8, 0xa8a49a, 3203, false)); town.add(box(18, 11, 10, conc, -32, 5.5, -6));
  for (let y = 1.5; y < 10; y += 2.6) for (let x = -40; x <= -24; x += 2) if (y > 2 || Math.abs(x + 32) > 2) town.add(box(1.4, 1.6, 0.1, M(T.windowDark), x, y, -0.98, { cast: false }));
  town.add(box(3.2, 2.6, 0.12, new THREE.MeshStandardMaterial({ color: 0x3a5a7a, roughness: 0.2, metalness: 0.5 }), -32, 1.3, -0.97, { cast: false }));
  const fa = canvasTex(1024, 192); const famesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), new THREE.MeshStandardMaterial({ map: fa.t, roughness: 0.8 })); famesh.position.set(-32, 4.0, -0.9); town.add(famesh);
  // Goldhaufen des Staates (x≈60)
  town.add(box(16, 0.12, 12, M(T.cobble), 60, 0.06, -3, { cast: false, uvScale: 0.6 }));
  const goldBlocks = []; for (let l = 0; l < 4; l++) { const n = 5 - l; for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const b = box(0.9, 0.9, 0.9, goldMat, 60 + (i - (n - 1) / 2) * 0.92, 0.57 + l * 0.92, -3 + (k - (n - 1) / 2) * 0.92); town.add(b); goldBlocks.push(b); } }
  goldBlocks.reverse(); const gr = rng(77); goldBlocks.forEach(b => b.userData.d = gr());
  const deFlag = tex(24, 15, (c) => { c.fillStyle = '#111'; c.fillRect(0, 0, 24, 5); c.fillStyle = '#d0201a'; c.fillRect(0, 5, 24, 5); c.fillStyle = '#ffce00'; c.fillRect(0, 10, 24, 5); }, 3204);
  const fl = flag(deFlag, 3.2, 2.0, 7.5, town, V(65, 0, -6), 0, 1);
  // Schule, Straße mit Löchern, Krankenhaus (x≈100–130)
  town.add(box(16, 8, 9, C(0xf0d070), 100, 4, -6)); town.add(box(16.4, 0.6, 9.4, C(0x8a5a3a), 100, 8.3, -6)); for (let y = 1.6; y < 7; y += 2.8) for (let x = 93.5; x <= 106.5; x += 2.2) town.add(box(1.4, 1.6, 0.1, M(T.windowDark), x, y, -1.48, { cast: false }));
  const sch = canvasTex(1024, 192); const schm = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshStandardMaterial({ map: sch.t, roughness: 0.8 })); schm.position.set(100, 6.6, -1.42); town.add(schm);
  for (let i = 0; i < 6; i++) town.add(box(1.5 + r() * 1.2, 0.03, 0.9 + r() * 0.8, C(0x2a2a2c), 104 + i * 3.4 + r(), 0.065, 3.6 + r() * 3, { cast: false }));
  for (let i = 0; i < 5; i++) { const bx = 110 + i * 2.2; town.add(box(1.6, 0.25, 0.12, M(tex(8, 2, (c) => { for (let x = 0; x < 8; x++) { c.fillStyle = (x >> 1) % 2 ? '#ffffff' : '#d82020'; c.fillRect(x, 0, 1, 2); } }, 3205 + i)), bx, 0.9, 2.3)); for (const dx of [-0.7, 0.7]) town.add(box(0.08, 0.9, 0.08, C(0xd8d8d8), bx + dx, 0.45, 2.3)); }
  town.add(box(14, 10, 9, C(0xf4f4f4), 124, 5, -6)); for (let y = 1.6; y < 9; y += 2.6) for (let x = 118.5; x <= 129.5; x += 2.2) town.add(box(1.4, 1.6, 0.1, M(T.windowDark), x, y, -1.48, { cast: false }));
  const rc = new THREE.MeshStandardMaterial({ color: 0xd82020, roughness: 0.6 }); town.add(box(0.6, 2.0, 0.12, rc, 124, 8.0, -1.42, { cast: false })); town.add(box(2.0, 0.6, 0.12, rc, 124, 8.0, -1.42, { cast: false }));
  sunLight(town, 0xfff0d8, 3.2, V(-40, 60, 45), V(0, 0, 0), 40); town.add(new THREE.HemisphereLight(0xcfe2ff, 0x6a7a4a, 1.5));
  const tom = humanoid(TOM), tCash = inHand(tom, cashInHand()); town.add(tom);
  town.userData = { tom, tCash, goldBlocks, fl, fa, sch, signsDrawn: false };
}
// moderne Innenräume (Tag)
const white = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xf0ece4, 0.03), 3301)), tiles = M(tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, (x % 8 === 0 || y % 8 === 0) ? 0x9a9a98 : shade(0xd8d4cc, 0.96 + r() * 0.08)); }, 3302));
const kitchenM = interior({ w: 7, d: 6, h: 3, wall: white, floor: tiles, sunCol: 0xfff0d8, sunI: 2.0, sunPos: V(5, 7, 9), hemiTop: 0xfff4e8, hemiBot: 0x8a8070, hemiI: 1.3, bg: 0xdce8f0 });
{
  const s = kitchenM; s.add(box(5, 0.9, 0.7, C(0x3a5a6a), 0, 0.45, -2.6)); s.add(box(5, 0.06, 0.74, C(0xe8e4dc), 0, 0.93, -2.58)); s.add(box(5, 0.8, 0.4, C(0x3a5a6a), 0, 2.2, -2.75));
  s.add(box(0.8, 0.1, 0.5, C(0xb8bcc0, { metal: 0.7, rough: 0.3 }), 0.4, 0.95, -2.55, { cast: false })); s.add(box(0.05, 0.4, 0.05, C(0xb8bcc0, { metal: 0.8 }), 0.4, 1.15, -2.82));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ color: 0xa8d0f0 })); win.position.set(-1.6, 1.7, -2.84); s.add(win);
  s.add(box(0.4, 0.3, 0.3, C(0xc83a2a, { rough: 0.5 }), -1.2, 0.15, -1.2));
  const tom = humanoid(TOM), kundin = humanoid(KUNDIN), kCash = inHand(kundin, cashInHand()); s.add(tom, kundin); s.userData = { tom, kundin, kCash };
}
const tomRoom = interior({ w: 6, d: 5, h: 2.8, wall: M(T.wallpaperBeige), floor: M(T.planks), sunCol: 0xfff0d8, sunI: 1.8, sunPos: V(-4, 7, 9), hemiTop: 0xfff0e0, hemiBot: 0x6a5a40, hemiI: 1.2 });
{
  const s = tomRoom; table(s, 0.2, -1.4, 1.8, 0.9, 0x8a6a4a);
  for (let i = 0; i < 9; i++) { const m = moneyMesh(); m.position.set(-0.35 + (i % 3) * 0.3, 0.88 + Math.floor(i / 3) * 0.07, -1.45); s.add(m); }
  const bx = new THREE.Group(); bx.position.set(0.75, 0.84, -1.4); s.add(bx); bx.add(box(0.5, 0.25, 0.34, C(0xd86a2a), 0, 0.125, 0)); const lid = box(0.52, 0.06, 0.36, C(0xc85a1a), 0, 0, 0); lid.position.set(0, 0.3, -0.22); lid.rotation.x = -1.2; bx.add(lid);
  s.add(box(0.3, 0.01, 0.42, C(0xf4f4f4), -0.5, 0.845, -1.1, { cast: false })); s.add(box(0.2, 0.012, 0.04, C(0x2a5a9a), -0.5, 0.85, -1.25, { cast: false }));
  s.add(box(1.4, 0.5, 2.2, C(0x5a3a1a), -2.2, 0.25, -1.2)); s.add(box(1.3, 0.16, 2.1, C(0x3a6a9a), -2.2, 0.56, -1.2));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: 0xa8d0f0 })); win.position.set(1.8, 1.7, -2.34); s.add(win);
  const tom = humanoid(TOM), tCash = inHand(tom, cashInHand()); s.add(tom); s.userData = { tom, tCash };
}
const amt = interior({ w: 8, d: 6, h: 3, wall: M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8dcd8, 0.03), 3303)), floor: M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x7a8a8a, 0.06), 3304)), sunCol: 0xfff4e0, sunI: 1.9, sunPos: V(5, 7, 9), hemiTop: 0xf4f8ff, hemiBot: 0x7a7a70, hemiI: 1.3, bg: 0xdce8f0 });
{
  const s = amt; table(s, 0, -0.6, 0.7, 1.6, 0xd8d0c0, 0.76); chair(s, 0.85, -0.6, -Math.PI / 2, 0x2a2a30); chair(s, -0.85, -0.6, Math.PI / 2, 0x2a2a30);
  s.add(box(0.06, 0.4, 0.6, C(0x1a1a1a), 0.3, 1.05, -0.8)); s.add(box(0.03, 0.34, 0.54, new THREE.MeshBasicMaterial({ color: 0x9ad0ff }), 0.26, 1.05, -0.8, { cast: false })); s.add(box(0.12, 0.2, 0.12, C(0x1a1a1a), 0.32, 0.86, -0.8));
  for (let k = 0; k < 4; k++) { s.add(box(3.4, 0.05, 0.4, C(0xb8b0a0), -1.6, 0.6 + k * 0.6, -2.75)); for (let i = 0; i < 9; i++) s.add(box(0.24, 0.5, 0.34, C([0x2a5aa8, 0xc83a2a, 0x3a8a4a, 0xe8b830][(i + k) % 4]), -3.1 + i * 0.36, 0.88 + k * 0.6, -2.75)); }
  paperStack(s, -0.15, 0.8, -0.2, 5, 4);
  const pruef = humanoid(PRUEF); glasses(pruef); const tom = humanoid(TOM), folder = inHand(tom, (() => { const g = new THREE.Group(); g.add(box(0.32, 0.42, 0.06, C(0x2a5aa8), 0, 0, 0.12)); return g; })()); s.add(pruef, tom);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshBasicMaterial({ color: 0xa8d0f0 })); win.position.set(2.2, 1.8, -2.84); s.add(win);
  s.userData = { pruef, tom, folder };
}
const lenaRoom = interior({ w: 6, d: 5, h: 2.8, wall: M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8e8e0, 0.03), 3305)), floor: M(T.planks), sunCol: 0xfff0d8, sunI: 1.9, sunPos: V(4, 7, 9), hemiTop: 0xfff4e8, hemiBot: 0x6a5a40, hemiI: 1.25 });
{
  const s = lenaRoom; table(s, 0, -0.9, 1.8, 1.0, 0xe8e0d0); chair(s, 0, -1.65, 0, 0x8a6a4a);
  const rr = rng(3306); for (let i = 0; i < 9; i++) s.add(box(0.16, 0.012, 0.26, C(0xf8f8f8), -0.75 + (i % 3) * 0.24 + rr() * 0.04, 0.85 + Math.floor(i / 3) * 0.012, -0.75 + Math.floor(i / 3) * 0.12 + rr() * 0.04, { cast: false }));
  s.add(box(0.5, 0.03, 0.36, C(0x2a2a2e), 0.5, 0.86, -0.8)); const lid = box(0.5, 0.34, 0.02, C(0x2a2a2e), 0.5, 1.03, -0.98); lid.rotation.x = -0.25; s.add(lid); s.add(box(0.44, 0.28, 0.01, new THREE.MeshBasicMaterial({ color: 0x8ad0a0 }), 0.5, 1.03, -0.965, { cast: false }));
  s.add(box(0.5, 1.6, 0.5, C(0x3a7a3a), 2.3, 0.8, -2.0)); s.add(box(0.5, 0.5, 0.5, C(0x8a5a3a), 2.3, 0.25, -2.0));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ color: 0xa8d0f0 })); win.position.set(-1.6, 1.7, -2.34); s.add(win);
  const lena = humanoid(LENA); s.add(lena); s.userData = { lena };
}

// =====================================================================
// SET 4: Sonnenuntergang mit Schild
// =====================================================================
const dusk = new THREE.Scene();
{
  skyDome(dusk, 0x2a3a6a, 0xc87a6a, 0xffb070, V(0.2, 0.05, -1), [1, 0.8, 0.5]); dusk.fog = new THREE.Fog(0xe0a080, 60, 260); clouds(dusk, 7, 0xffd0b8, 55, 30, 140, 0.85);
  dusk.add(box(600, 1, 600, M(T.grass), 0, -0.5, 0, { cast: false }));
  const r = rng(1901);
  for (let i = 0; i < 9; i++) dusk.add(box(5 + r() * 4, 10 + r() * 22, 6, C(0x5a4a5a), -40 + i * 9 + r() * 3, 8, -110 - r() * 20));
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
  fit('BUNDESGERICHTSHOF, 2012', 72, 150, '#a3241c'); fit('AB EINER MILLION EURO', 56, 290, '#3a2a1e'); fit('DROHT MEIST GEFÄNGNIS', 56, 380, '#3a2a1e'); stex.needsUpdate = true;
}
function drawTexts() {
  const { fa, sch } = town.userData;
  { const c = fa.cv.getContext('2d'); c.fillStyle = '#1e3a6a'; c.fillRect(0, 0, 1024, 192); c.fillStyle = '#ffffff'; c.font = '800 120px Mont'; c.textAlign = 'center'; c.fillText('FINANZAMT', 512, 140); fa.t.needsUpdate = true; }
  { const c = sch.cv.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, 1024, 192); c.fillStyle = '#2a3a6a'; c.font = '800 130px Mont'; c.textAlign = 'center'; c.fillText('SCHULE', 512, 145); sch.t.needsUpdate = true; }
  { const O = office.userData, c = O.bookCv.getContext('2d'); c.fillStyle = '#ece4cc'; c.fillRect(0, 0, 512, 320); c.fillStyle = '#5a4a3a'; c.fillRect(254, 0, 4, 320);
    c.strokeStyle = '#a8b8c8'; c.lineWidth = 2; for (let y = 40; y < 320; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
    c.strokeStyle = '#c86a6a'; for (const x of [40, 190, 296, 446]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 320); c.stroke(); }
    c.fillStyle = '#1a2a4a'; c.font = '400 22px Pix'; const r = rng(55); for (let y = 62; y < 320; y += 28) for (const x0 of [0, 256]) { c.textAlign = 'left'; c.fillText(String(1 + Math.floor(r() * 28)) + '.' + (1 + Math.floor(r() * 12)), x0 + 4, y); c.fillText(['Bier', 'Wein', 'Karten', 'Lohn', 'Ware', 'Miete'][Math.floor(r() * 6)], x0 + 46, y); c.textAlign = 'right'; c.fillText('$ ' + (100 + Math.floor(r() * 9000)), x0 + 244, y); }
    c.fillStyle = '#b01818'; c.font = '600 26px Pix'; c.textAlign = 'center'; c.fillText('EINNAHMEN', 128, 28); c.fillText('EINNAHMEN', 384, 28); O.bookTex.needsUpdate = true; }
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = 75.30; // hörbares Ende der Sprache (gemessen, −45 dB)
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(1) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(1) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix); 1 Frame Vorlauf
const CUTS = [[0, 'hero'], [4, 'chicago'], [9, 'capone'], [17, 'alcohol'], [25, 'nobody'], [33, 'witness'], [40, 'wilson'], [48, 'search'], [55, 'luxury'], [66, 'noreturn'], [73, 'believes'],
  [82, 'court27'], [94, 'papers'], [101, 'ledger'], [107, 'ledgerclose'], [114, 'verdict'], [118, 'prison'], [125, 'notmurder'], [131, 'today'], [136, 'cash'], [143, 'hide'], [149, 'car'],
  [156, 'define'], [166, 'legal'], [176, 'audit'], [188, 'likecapone'], [191, 'law'], [205, 'selfreport'], [216, 'term'], [220, 'billions'], [228, 'public'], [236, 'sign'], [243, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; }
const mv = (u, a, b, ta, tb, fov) => cam(a.clone().lerp(b, u), ta.clone().lerp(tb, u), fov);
const HX = -0.7, HX2 = 0.75, HZ = 0.2;
function heroCam(t) { // Preset hook-kranfahrt.json (nahe Endposition)
  const k = t / 1.4;
  const p0 = V(0.0, lerp(1.62, 1.58, k), lerp(5.0, 4.5, k)), t0 = V(0.0, 1.2, 0.2);
  const e = smoother((t - WHIP0) / (WHIP1 - WHIP0)); const drift = Math.max(0, t - WHIP1) * 0.12;
  const p1 = V(-5.2 + drift * 1.2, 8.2 + drift * 0.7, 10.0 + drift * 1.2), t1 = V(0.6 + drift * 0.6, 1.6, -6.0);
  const p = p0.clone().lerp(p1, e), tg = t0.clone().lerp(t1, e); p.y += Math.sin(e * Math.PI) * 0.6;
  cam(p, tg, lerp(56, 46, e));
}
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let textsDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`, gold = s => `<span style="color:#ffd23f">${s}</span>`;
const hideAll = (arr) => arr.forEach(p => { p.visible = false; p.userData.setFace({}); });
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };

function render(frame) {
  const t = frame / FPS;
  if (!textsDrawn) { drawSign(); drawTexts(); textsDrawn = true; }
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a);
  let scene = chi, exp = 1.35; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // ---------- Chicago ----------
  if (['hero', 'loop', 'chicago', 'capone', 'alcohol', 'nobody', 'witness', 'luxury'].includes(sh.id)) {
    scene = chi; exp = 1.45; const Q = chi.userData; const ta = sh.id === 'loop' ? t - DUR : t; const { capone, wilson, gang, cop, witness } = Q;
    hideAll([capone, wilson, ...gang, cop, witness]); Q.cCash.visible = Q.wLedger.visible = Q.gEnv.visible = false;
    const hookPair = () => { put(capone, HX, 0.15, HZ, 0.5); put(wilson, HX2, 0.15, HZ, -0.5); pose3(capone, 'idle', ta, 0); pose3(wilson, 'idle', ta, 1);
      capone.userData.armR.rotation.x = -1.05 + Math.sin(ta * 2) * 0.04; capone.userData.armR.rotation.z = 0.15; Q.cCash.visible = true; capone.userData.head.rotation.y = 0.3;
      wilson.userData.armL.rotation.x = -1.0; wilson.userData.armL.rotation.z = -0.1; wilson.userData.armR.rotation.x = -0.2; Q.wLedger.visible = false; wilson.userData.head.rotation.y = -0.25;
      put(gang[0], -2.4, 0.15, -2.2, 0.3); pose3(gang[0], 'cross', ta, 2); put(gang[1], 2.0, 0.15, -2.6, -0.3); pose3(gang[1], 'idle', ta, 3); };
    if (sh.id === 'hero' || sh.id === 'loop' || sh.id === 'chicago') { hookPair(); heroCam(ta); if (sh.id !== 'chicago') { tag(capone, 'Al Capone', BAD); tag(wilson, 'Steuerfahnder', HERO); } }
    if (sh.id === 'chicago') { const k = smoother(u); cam(V(lerp(-12, -10, k), lerp(13, 12, k), lerp(12.5, 11.5, k)), V(0, 2.2, -4), 48); info(wt(4), 'Chicago, um 1929'); }
    if (sh.id === 'capone') { put(capone, 0.3, 0.15, -1.6, 0.05); pose3(capone, 'laugh', t); capone.userData.armR.rotation.x = -0.9; Q.cCash.visible = true;
      [[-1.3, -2.4, 0.35], [1.8, -2.5, -0.3], [-2.4, -1.2, 0.6]].forEach(([x, z, ry], i) => { put(gang[i], x, 0.15, z, ry); pose3(gang[i], 'cross', t, i); });
      mv(u, V(0.4, 1.85, 3.4), V(0.35, 1.8, 2.7), V(0.2, 1.55, -1.6), V(0.2, 1.55, -1.6), 46); tag(capone, 'Al Capone', BAD); tag(gang[0], 'Bande', GREY); }
    if (sh.id === 'alcohol') { [[0, -19.6, 1.1, 1.3], [1, -21.0, 2.4, 0.9], [2, -18.4, 1.9, -1.2]].forEach(([i, x, z, ry]) => { put(gang[i], x + Math.sin(t * 1.3 + i) * 0.2, 0.15, z, ry); pose(gang[i], 'carry', t, i); });
      put(capone, -18.2, 0.15, -1.4, 0.9); pose3(capone, 'point', t);
      mv(u, V(-14.6, 2.2, 0.9), V(-15.1, 2.1, 0.6), V(-20.0, 1.2, 0.6), V(-20.0, 1.2, 0.6), 50); tag(capone, 'Al Capone', BAD);
      tip(wt(21), 'barrel', 'Alkohol – verboten', '#ff5555', [gray('Prohibition in den USA'), gray('1920 bis 1933')]); }
    if (sh.id === 'nobody') { put(cop, 13.0, 0.15, 0.2, 0.6); pose3(cop, 'cross', t); cop.userData.setFace({ sad: true }); cop.userData.head.rotation.y = Math.sin(t * 2.5) * 0.25;
      put(capone, 15.4, 0.15, -0.9, -0.45); pose3(capone, 'laugh', t); put(gang[0], 16.6, 0.15, -1.6, -0.6); pose3(gang[0], 'laugh', t, 1);
      mv(u, V(14.1, 2.0, 6.6), V(14.1, 1.95, 5.8), V(14.2, 1.3, -0.5), V(14.2, 1.3, -0.5), 50); tag(cop, 'Polizei', ALLY); tag(capone, 'Al Capone', BAD); chat(wt(29), gray('Beweise gegen Capone: keine')); }
    if (sh.id === 'witness') { put(witness, 25.6, 0.15, -0.4, 0.45); pose3(witness, 'sadidle', t); witness.userData.setFace({ sad: true }); put(gang[2], 24.4, 0.15, -1.2, 0.7); pose3(gang[2], 'point', t, 1); gang[2].userData.setFace({ angry: true });
      put(gang[1], 27.6, 0.15, -1.4, 0.4); pose3(gang[1], 'give', t); Q.gEnv.visible = true; put(cop, 28.7, 0.15, -0.7, -0.75); pose3(cop, 'give', t, 2); cop.userData.armR.rotation.x = -0.8;
      mv(u, V(26.6, 1.9, 5.2), V(26.7, 1.85, 4.5), V(26.6, 1.25, -0.8), V(26.4, 1.25, -0.8), 48); tag(witness, 'Zeuge', WHITE); if (t >= wt(37)) tag(cop, 'Polizist', ALLY); if (t >= wt(37)) eff(wt(38), 'Bestochen', '', BAD); }
    if (sh.id === 'luxury') { put(capone, 82.0, 0.13, -3.6, 0); pose3(capone, 'pose', t); put(gang[0], 80.2, 0.13, -4.6, 0.3); pose3(gang[0], 'cross', t, 1); put(gang[3], 83.8, 0.13, -4.8, -0.3); pose3(gang[3], 'cross', t, 2);
      mv(u, V(82, 3.6, 12.5), V(82, 3.2, 10.8), V(82, 3.4, -6), V(82, 2.9, -6), 46); tag(capone, 'Al Capone', BAD);
      if (t >= wt(61)) ui.tags.push([V(82, 9.8, -9), 'Villa', GREY]); if (t >= wt(62)) ui.tags.push([V(76.6, 2.6, -1.5), 'Auto', GREY]); }
  }
  // ---------- Büro Wilson ----------
  if (['wilson', 'search', 'papers', 'ledger', 'ledgerclose'].includes(sh.id)) {
    scene = office; exp = 1.5; const O = office.userData, w = O.wilson; w.userData.setFace({}); O.ledger.visible = false;
    if (sh.id !== 'ledger') { put(w, 0, 0, -2.4, 0); pose(w, 'write', t); sitPose(w, 0.52); }
    if (sh.id === 'wilson') { mv(u, V(1.2, 2.1, 3.4), V(1.0, 2.0, 2.7), V(0, 1.2, -2.0), V(0, 1.2, -2.0), 48); tag(w, 'Frank Wilson', HERO); info(wt(43), 'Steuerfahnder der US-Regierung'); }
    if (sh.id === 'search') { w.userData.head.rotation.x = 0.1; mv(u, V(-0.7, 1.65, 0.4), V(-0.6, 1.62, -0.05), V(0, 1.45, -2.4), V(0, 1.45, -2.4), 46); tag(w, 'Frank Wilson', HERO);
      say(wt(48), 'Wilson', HERO, 'Keine Leichen.'); say(wt(52), 'Wilson', HERO, 'Folge dem Geld.'); }
    if (sh.id === 'papers') { mv(u, V(-1.8, 2.6, 2.2), V(-1.5, 2.4, 1.6), V(0, 1.0, -1.8), V(0, 1.0, -1.8), 48); tag(w, 'Frank Wilson', HERO); eff(wt(96), 'Suche', 'Jahre', HERO); }
    if (sh.id === 'ledger') { put(w, -0.2, 0, -0.6, 0.15); pose3(w, 'idle', t); const k = smoother((t - wt(105)) / 0.35); w.userData.armR.rotation.x = lerp(-0.6, -2.5, k); w.userData.armR.rotation.z = lerp(0, 0.2, k); O.ledger.visible = true; w.userData.setFace({ smile: true });
      mv(u, V(0.4, 1.7, 2.8), V(0.3, 1.68, 2.3), V(-0.1, 1.5, -0.6), V(-0.1, 1.55, -0.6), 46); tag(w, 'Frank Wilson', HERO); toast(wt(105), 'Fortschritt erzielt!', 'Geheimes Kassenbuch', 'book'); }
    if (sh.id === 'ledgerclose') { w.visible = false; mv(u, V(-0.3, 1.75, -0.2), V(-0.3, 1.6, -0.45), V(-0.3, 0.3, -1.3), V(-0.3, 0.3, -1.3), 46); chat(wt(110), red('Gemeldet: $ 0')); }
  }
  // ---------- Capones Salon ----------
  if (sh.id === 'noreturn' || sh.id === 'believes') {
    scene = lounge; exp = 1.45; const L = lounge.userData; const { capone, g1, g2 } = L; L.cCash.visible = false;
    put(capone, 0, 0, -2.1, 0); sitPose(capone, 0.5); put(g1, -1.6, 0, -2.7, 0.25); put(g2, 1.6, 0, -2.7, -0.25); pose3(g1, 'cross', t, 1); pose3(g2, 'cross', t, 2);
    if (sh.id === 'noreturn') { pose3(capone, 'laugh', t); sitPose(capone, 0.5); capone.userData.armL.rotation.x = capone.userData.armR.rotation.x = -1.1;
      mv(u, V(1.6, 2.1, 3.2), V(1.35, 2.0, 2.6), V(0, 1.2, -1.6), V(0, 1.2, -1.6), 48); tag(capone, 'Al Capone', BAD);
      tip(wt(67), 'paper', 'Steuererklärung', '#ffffff', [gray('Abgegeben: ') + red('nie')]); }
    if (sh.id === 'believes') { pose(capone, 'count', t); sitPose(capone, 0.5); L.cCash.visible = true;
      mv(u, V(-0.6, 1.75, 1.3), V(-0.5, 1.7, 0.9), V(0, 1.3, -2.0), V(0, 1.3, -2.0), 46); tag(capone, 'Al Capone', BAD); say(wt(75), 'Capone', BAD, 'Illegales Geld = steuerfrei!'); }
  }
  // ---------- Gericht ----------
  if (['court27', 'verdict', 'law'].includes(sh.id)) {
    scene = court; exp = 1.4; const G = court.userData; hideAll([...G.judges, G.capone, G.wilson, G.tom, G.cop]);
    const seat = (j, z) => { put(j, -4.7, 0.5, z, Math.PI / 2 + 0.35); pose3(j, 'idle', t, z); sitPose(j, 1.0); j.userData.armL.rotation.x = j.userData.armR.rotation.x = -1.0; };
    if (sh.id === 'court27') { seat(G.judges[1], -2.0); seat(G.judges[0], -0.5); seat(G.judges[2], 1.0);
      mv(u, V(-1.0, 3.0, 3.2), V(-1.3, 2.95, 2.6), V(-4.6, 1.7, -0.5), V(-4.6, 1.7, -0.5), 48); tag(G.judges[0], 'Oberstes Gericht', WHITE);
      info(wt(84), 'Oberstes Gericht der USA, 1927'); tip(wt(88), 'scale', 'Urteil', '#ffff55', [gray('Auch illegale Einnahmen'), gray('sind steuerpflichtig')]); }
    else { seat(G.judges[0], -0.5); const k = Math.abs(Math.sin(t * 5)); if (t >= SHOTS.find(s => s.id === sh.id).a + 0.5) { G.judges[0].userData.armR.rotation.x = -1.2 - k * 1.0; } }
    if (sh.id === 'verdict') { put(G.capone, -2.2, 0, 1.8, 0.25); pose3(G.capone, 'sadidle', t); G.capone.userData.setFace({ sad: true }); put(G.wilson, -0.9, 0, 1.2, -0.5); pose3(G.wilson, 'cross', t, 1);
      mv(u, V(1.2, 2.2, 6.6), V(1.0, 2.15, 6.0), V(-3.0, 1.6, 0.6), V(-3.0, 1.6, 0.6), 50); tag(G.capone, 'Al Capone', BAD); tag(G.wilson, 'Wilson', HERO); info(wt(114), 'Chicago, 1931'); }
    if (sh.id === 'law') { put(G.tom, -2.2, 0, 1.8, 0.25); pose3(G.tom, 'sadidle', t); G.tom.userData.setFace({ sad: true });
      mv(u, V(1.2, 2.2, 6.6), V(1.0, 2.15, 6.0), V(-3.0, 1.6, 0.6), V(-3.0, 1.6, 0.6), 50); tag(G.tom, 'Tom', HERO);
      tip(wt(193), 'scale', 'Strafe in Deutschland', '#ffff55', [gray('bis zu ') + red('5 Jahre') + gray(' Haft'), t >= wt(199) ? gray('schwere Fälle: ') + red('bis zu 10') : ''].filter(Boolean)); }
  }
  // ---------- Zelle ----------
  if (['prison', 'notmurder', 'likecapone'].includes(sh.id)) {
    scene = cell; exp = 1.5; const Z = cell.userData; Z.tom.visible = false; const c = Z.capone; put(c, 0.3, 0, -1.25, 0); pose3(c, 'sadidle', t); sitPose(c, 0.76); c.userData.setFace({ sad: true });
    c.userData.armL.rotation.x = c.userData.armR.rotation.x = -0.9;
    if (sh.id === 'prison') { mv(u, V(0.6, 1.7, 4.4), V(0.55, 1.65, 3.7), V(0.3, 1.2, -1.2), V(0.3, 1.2, -1.2), 46); tag(c, 'Al Capone', BAD); eff(wt(118), 'Gefängnis', '11 Jahre', BAD); chat(wt(122), red('+ 50.000 Dollar Strafe')); }
    if (sh.id === 'notmurder') { mv(u, V(0.46, 1.5, 3.4), V(0.46, 1.48, 3.0), V(0.3, 1.35, -1.25), V(0.3, 1.35, -1.25), 40); tag(c, 'Al Capone', BAD);
      chat(wt(125), gray('Mord: ') + red('nicht bewiesen')); chat(wt(128), gray('Al Capone wurde erwischt wegen: ') + gold('Steuerhinterziehung')); }
    if (sh.id === 'likecapone') { mv(u, V(0.3, 1.6, 3.4), V(0.3, 1.58, 3.1), V(0.3, 1.4, -1.25), V(0.3, 1.4, -1.25), 46); tag(c, 'Al Capone', BAD); }
  }
  // ---------- Heute: Stadt ----------
  if (['today', 'car', 'define', 'billions', 'public'].includes(sh.id)) {
    scene = town; exp = 1.25; const Tn = town.userData, tom = Tn.tom; hideAll([tom]); Tn.tCash.visible = false; Tn.goldBlocks.forEach(b => b.visible = true); Tn.fl.userData.update(t);
    if (sh.id === 'today') { put(tom, -2.2, 0.15, 1.6, 0.5); pose3(tom, 'idle', t); tom.userData.setFace({ smile: true });
      mv(u, V(-5.6, 1.9, 6.2), V(-5.3, 1.85, 5.5), V(-2.2, 1.3, 1.4), V(-2.2, 1.3, 1.4), 48); tag(tom, 'Tom (Handwerker)', HERO); info(wt(131), 'Deutschland, heute'); }
    if (sh.id === 'car') { put(tom, 19.0, 0.06, 5.0, 0.7); pose3(tom, 'clap', t); tom.userData.setFace({ smile: true }); Tn.tCash.visible = false;
      mv(u, V(22.8, 1.6, 10.5), V(22.3, 1.55, 9.8), V(20.8, 1.0, 4.6), V(20.8, 1.0, 4.6), 48); tag(tom, 'Tom', HERO); eff(wt(154), 'Neues Auto', '', HERO); }
    if (sh.id === 'define') { const x = lerp(-28.5, -30.5, u); put(tom, x, 0.15, 1.3, -Math.PI / 2 + 0.6); pose3(tom, 'walk', t); tom.userData.head.rotation.y = 0.6;
      mv(u, V(-29.5, 1.6, 13.0), V(-29.8, 1.65, 12.2), V(-31, 3.2, -1), V(-31, 3.25, -1), 50); tag(tom, 'Tom', HERO);
      tip(wt(159), 'x', 'Steuerhinterziehung', '#ff5555', [t >= wt(160) ? gray('· Einnahmen verschweigen') : '', t >= wt(162) ? gray('· falsche Angaben machen') : '', t >= wt(163) ? red('= Straftat') : ''].filter(Boolean)); }
    if (sh.id === 'billions') { const k = (t - wt(222)) / 2.0; Tn.goldBlocks.forEach((b, i) => { b.visible = k < 0 || (i / Tn.goldBlocks.length + b.userData.d * 0.1) > k * 0.85; });
      mv(u, V(60, 4.2, 9.5), V(60, 3.9, 8.4), V(60, 1.6, -3), V(60, 1.6, -3), 48); ui.tags.push([V(60, 4.9, -3), 'Staat', WHITE]); info(wt(226), 'Schaden: Milliarden Euro pro Jahr'); }
    if (sh.id === 'public') { mv(u, V(98, 4.0, 19), V(116, 4.2, 19), V(100, 3.4, -2), V(120, 3.6, -2), 50);
      chat(wt(231), red('Fehlt: ') + gray('Schulen')); chat(wt(232), red('Fehlt: ') + gray('Straßen')); chat(wt(234), red('Fehlt: ') + gray('Krankenhäuser')); }
  }
  // ---------- Heute: Innenräume ----------
  if (sh.id === 'cash') { scene = kitchenM; exp = 1.2; const K = kitchenM.userData; put(K.tom, -0.7, 0, -0.9, 0.75); pose3(K.tom, 'give', t); K.tom.userData.armL.rotation.x = -0.3; K.tom.userData.setFace({ smile: true });
    put(K.kundin, 0.75, 0, -0.5, -0.8); pose3(K.kundin, 'give', t, 1); K.kundin.userData.armL.rotation.x = -0.2; K.kCash.visible = true;
    mv(u, V(0.3, 1.75, 3.0), V(0.25, 1.72, 2.5), V(0, 1.3, -0.7), V(0, 1.3, -0.7), 46); tag(K.tom, 'Tom', HERO); tag(K.kundin, 'Kundin', ALLY);
    say(wt(140), 'Kundin', ALLY, 'Ohne Rechnung? Passt!'); eff(wt(142), 'Bargeld', '+ 400 €', HERO); }
  if (sh.id === 'hide') { scene = tomRoom; exp = 1.25; const R = tomRoom.userData; R.tCash.visible = true;
    put(R.tom, 0.2, 0, -2.25, 0.25); pose3(R.tom, 'give', t); R.tom.userData.setFace({ smile: true });
    mv(u, V(0.9, 1.9, 1.6), V(0.8, 1.85, 1.1), V(0.3, 1.0, -1.6), V(0.3, 1.0, -1.6), 46); tag(R.tom, 'Tom', HERO); say(wt(147), 'Finanzamt', GREY, 'Einnahmen gemeldet: 0 €'); }
  if (sh.id === 'legal') { scene = lenaRoom; exp = 1.25; const Ln = lenaRoom.userData; put(Ln.lena, 0, 0, -1.65, 0); pose2(Ln.lena, 'type', t); sitPose(Ln.lena, 0.52);
    mv(u, V(0.9, 1.8, 2.4), V(0.75, 1.75, 1.9), V(0, 1.1, -1.4), V(0, 1.1, -1.4), 48); tag(Ln.lena, 'Lena', ALLY);
    tip(wt(172), 'check', 'Steuervermeidung', '#55ff55', [gray('Legal Steuern sparen,'), gray('z. B. mit Quittungen'), green('= erlaubt')]); }
  if (['audit', 'selfreport', 'term'].includes(sh.id)) { scene = amt; exp = 1.2; const A = amt.userData; A.folder.visible = sh.id !== 'audit';
    put(A.pruef, 0.85, 0, -0.6, -Math.PI / 2 + 0.55); pose2(A.pruef, sh.id === 'audit' ? 'type' : 'idle', t); sitPose(A.pruef, 0.52);
    put(A.tom, -0.85, 0, -0.6, Math.PI / 2 - 0.55); pose3(A.tom, sh.id === 'audit' ? 'sadidle' : 'give', t); sitPose(A.tom, 0.52); A.tom.userData.setFace(sh.id === 'audit' ? { sad: true } : {});
    if (sh.id === 'audit') { mv(u, V(0, 1.85, 4.6), V(0, 1.8, 4.0), V(0, 1.15, -0.6), V(0, 1.15, -0.6), 46); tag(A.pruef, 'Steuerprüferin', ALLY); tag(A.tom, 'Tom', HERO); info(wt(178), 'Steuerprüfung');
      tip(wt(182), 'paper', 'Toms Zahlen', '#ffffff', [gray('Ausgaben: ') + red('60.000 €'), gray('Einnahmen gemeldet: 25.000 €')]); }
    if (sh.id === 'selfreport') { mv(u, V(0.9, 1.7, 3.0), V(0.8, 1.68, 2.5), V(-0.6, 1.2, -0.6), V(-0.6, 1.2, -0.6), 46); tag(A.pruef, 'Finanzamt', ALLY); tag(A.tom, 'Tom', HERO);
      chat(wt(207), gray('Tom meldet sich selbst')); chat(wt(212), green('Steuern nachgezahlt')); }
    if (sh.id === 'term') { mv(u, V(0, 2.3, 3.6), V(0, 2.2, 3.1), V(0, 1.0, -0.6), V(0, 1.0, -0.6), 46); tag(A.tom, 'Tom', HERO);
      tip(wt(219), 'check', 'Selbstanzeige', '#55ff55', [gray('Alles offenlegen + nachzahlen,'), gray('bevor es entdeckt wird'), green('= oft straffrei')]); }
  }
  if (sh.id === 'sign') { scene = dusk; exp = 1.35; mv(u, V(0, 3.5, 13.5), V(0, 3.6, 12.0), V(0, 0.5, 0), V(0, 0.6, 0), 46); }

  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = scene; composer.render(); scene.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  barrel: '<rect x="2" y="1" width="4" height="6" fill="#8a5a32"/><rect x="1" y="2" width="6" height="4" fill="#8a5a32"/><rect x="1" y="2" width="6" height="1" fill="#3a3a3a"/><rect x="1" y="5" width="6" height="1" fill="#3a3a3a"/>',
  paper: '<rect x="1" y="0" width="6" height="8" fill="#f0ece0"/><rect x="2" y="2" width="4" height="1" fill="#7a7a7a"/><rect x="2" y="4" width="4" height="1" fill="#7a7a7a"/><rect x="2" y="6" width="3" height="1" fill="#7a7a7a"/>',
  scale: '<rect x="3" y="1" width="2" height="6" fill="#d8b030"/><rect x="0" y="2" width="8" height="1" fill="#d8b030"/><rect x="0" y="3" width="2" height="2" fill="#f0d060"/><rect x="6" y="3" width="2" height="2" fill="#f0d060"/><rect x="2" y="7" width="4" height="1" fill="#d8b030"/>',
  check: '<rect x="1" y="4" width="2" height="2" fill="#55ff55"/><rect x="2" y="5" width="2" height="2" fill="#55ff55"/><rect x="4" y="3" width="2" height="2" fill="#55ff55"/><rect x="5" y="1" width="2" height="3" fill="#55ff55"/>',
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
  if (cur) { let txt = cur[0]; const NUM = { 'hundert': '100', 'Neunzehnhunderteinunddreißig': '1931', 'Elf': '11', 'fünfzigtausend': '50.000', 'fünf': '5', 'zehn.': '10.' }; if (NUM[txt]) txt = NUM[txt];
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
