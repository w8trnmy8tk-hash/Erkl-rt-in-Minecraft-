// „Herr der Fliegen, erklärt in Minecraft“ – eigene Voxel-Welt (keine Mojang-Assets)
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
    if (o.paint) { c.fillStyle = '#c8201a'; c.fillRect(0, 5, 3, 1); c.fillRect(5, 5, 3, 1); c.fillRect(2, 2, 4, 1); c.fillStyle = '#f2f2f2'; c.fillRect(0, 6, 2, 1); c.fillRect(6, 6, 2, 1); }
    if (o.cry) { c.fillStyle = '#6ac0ff'; c.fillRect(1, 5, 1, 2); c.fillRect(6, 5, 1, 2); }
  }, 300 + (o.seed ?? 0));
}
function humanoid(o) {
  const g = new THREE.Group(), s = o.scale ?? 0.95;
  const skin = C(o.skin), hair = C(o.hair), top = C(o.top), bot = C(o.bottom ?? o.top), shoe = C(o.shoe ?? 0x2a1c14);
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.125, 0.72, 0); legR.position.set(0.125, 0.72, 0);
  for (const L of [legL, legR]) { L.add(box(0.24, 0.6, 0.24, bot, 0, -0.3, 0)); L.add(box(0.25, 0.14, 0.26, shoe, 0, -0.65, 0.01)); }
  const BW = o.wide ? 0.62 : 0.5, BD = o.wide ? 0.36 : 0.26;
  const body = new THREE.Group(); body.add(box(BW, 0.74, BD, top, 0, 1.08, 0));
  if (o.coat) body.add(box(0.54, 0.5, 0.3, top, 0, 0.62, 0)); if (o.skirt) body.add(box(0.58, 0.42, 0.34, bot, 0, 0.6, 0));
  if (o.tie) body.add(box(0.08, 0.4, 0.02, C(o.tie), 0, 1.18, 0.14, { cast: false }));
  if (o.belt) body.add(box(0.52, 0.07, 0.28, C(o.belt), 0, 0.76, 0, { cast: false }));
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-BW / 2 - 0.12, 1.42, 0); armR.position.set(BW / 2 + 0.12, 1.42, 0);
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
// Zubehör & Posen für „Herr der Fliegen“
// =====================================================================
const flameMats = [0xff5a10, 0xff8a1a, 0xffc02a, 0xffe07a].map(c => new THREE.MeshBasicMaterial({ color: c, fog: false }));
function fireAt(scene, x, y, z, s = 1, light = true, logs = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
  if (logs) { const lm = C(0x4a2e1a); g.add(box(0.9, 0.16, 0.18, lm, 0, 0.08, 0)); g.add(box(0.18, 0.16, 0.9, lm, 0, 0.12, 0)); g.add(box(0.8, 0.14, 0.16, C(0x2a1a10), 0, 0.2, 0.1)); }
  const fl = []; const r = rng(Math.floor(x * 13 + z * 7 + 999));
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), flameMats[i % 4]); m.castShadow = false; m.userData = { x: (r() - 0.5) * 0.5, z: (r() - 0.5) * 0.5, p: r() * 6, s: 0.18 + r() * 0.2 }; g.add(m); fl.push(m); }
  let pl = null; if (light) { pl = new THREE.PointLight(0xff9a40, 6, 12, 1.4); pl.position.set(0, 0.9, 0); g.add(pl); }
  g.userData.update = (t, k = 1) => { fl.forEach((m, i) => { const u = (t * 1.6 + m.userData.p) % 1; const sz = m.userData.s * (1 - u * 0.6) * k; m.scale.setScalar(Math.max(0.001, sz)); m.position.set(m.userData.x * (1 - u), 0.25 + u * 0.9 * k, m.userData.z * (1 - u)); });
    if (pl) pl.intensity = (5 + Math.sin(t * 17) * 0.8 + Math.sin(t * 29) * 0.5) * k; };
  return g;
}
function palm(scene, x, z, h = 6, lean = 0.2, rot = 0, y0 = 0) {
  const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = rot; scene.add(g); const tm = C(0x8a6a44), tm2 = C(0x7a5a3a);
  for (let i = 0; i < h; i++) g.add(box(0.45, 1.02, 0.45, i % 2 ? tm : tm2, Math.pow(i / h, 2) * lean * h, i + 0.5, 0));
  const tx = lean * h, lm = C(0x3a8a32), lm2 = C(0x2e7a2a);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; for (let j = 1; j <= 3; j++) g.add(box(0.7, 0.22, 0.7, j % 2 ? lm : lm2, tx + Math.cos(a) * j * 0.75, h + 0.1 - j * j * 0.12, Math.sin(a) * j * 0.75)); }
  g.add(box(1.0, 0.5, 1.0, C(0x4a9a3a), tx, h + 0.25, 0)); g.add(box(0.3, 0.3, 0.3, C(0x6a4a22), tx + 0.3, h - 0.2, 0.2)); return g;
}
const conchMesh = () => { const g = new THREE.Group(); g.add(box(0.34, 0.2, 0.2, C(0xf2dcc8), 0, 0, 0.1)); g.add(box(0.2, 0.14, 0.04, C(0xf08aa0), 0.02, 0, 0.21, { cast: false })); g.add(box(0.12, 0.12, 0.12, C(0xe8c8a8), -0.2, 0.04, 0.1)); g.add(box(0.08, 0.08, 0.08, C(0xd8b090), -0.28, 0.07, 0.1)); return g; };
const spearMesh = () => { const g = new THREE.Group(); const sm = C(0x8a6a3a); g.add(box(0.06, 2.1, 0.06, sm, 0, 0.35, 0.05)); g.add(box(0.07, 0.22, 0.07, C(0xd8c49a), 0, 1.5, 0.05)); return g; };
function glassesOn(ch) { const g = new THREE.Group(); const fm = C(0x1a1a1a), lm = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.3 });
  for (const x of [-0.125, 0.125]) { g.add(box(0.18, 0.025, 0.02, fm, x, 0.28, 0.26, { cast: false })); g.add(box(0.18, 0.025, 0.02, fm, x, 0.16, 0.26, { cast: false })); g.add(box(0.025, 0.12, 0.02, fm, x - 0.09, 0.22, 0.26, { cast: false })); g.add(box(0.025, 0.12, 0.02, fm, x + 0.09, 0.22, 0.26, { cast: false })); g.add(box(0.15, 0.1, 0.01, lm, x, 0.22, 0.262, { cast: false })); }
  g.add(box(0.07, 0.02, 0.02, fm, 0, 0.24, 0.26, { cast: false })); ch.userData.head.add(g); return g; }
function choirCap(ch) { const g = new THREE.Group(); const m = C(0x141418); g.add(box(0.54, 0.12, 0.54, m, 0, 0.55, 0)); g.add(box(0.12, 0.08, 0.02, C(0xc8c8d0, { metal: 0.6, rough: 0.3 }), 0, 0.56, 0.28, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.1; return g; }
function navyCap(ch) { const g = new THREE.Group(); g.add(box(0.58, 0.14, 0.58, C(0xf6f6f2), 0, 0.56, 0)); g.add(box(0.56, 0.06, 0.56, C(0x18182a), 0, 0.5, 0)); g.add(box(0.46, 0.04, 0.16, C(0x18182a), 0, 0.49, 0.33)); g.add(box(0.12, 0.1, 0.02, C(0xe0b030, { metal: 0.6, rough: 0.3 }), 0, 0.56, 0.3, { cast: false })); ch.userData.head.add(g); ch.userData.hatExtra = 0.15; return g; }
function pigHead() { const g = new THREE.Group(); const pk = C(0xe89a9a), pk2 = C(0xd88080);
  g.add(box(0.56, 0.5, 0.5, pk, 0, 0, 0)); g.add(box(0.26, 0.18, 0.1, pk2, 0, -0.06, 0.29)); g.add(box(0.05, 0.06, 0.02, C(0x6a2a2a), -0.06, -0.06, 0.345, { cast: false })); g.add(box(0.05, 0.06, 0.02, C(0x6a2a2a), 0.06, -0.06, 0.345, { cast: false }));
  for (const x of [-0.16, 0.16]) { g.add(box(0.1, 0.06, 0.02, C(0x1a1010), x, 0.08, 0.255, { cast: false })); g.add(box(0.14, 0.14, 0.06, pk2, x * 1.3, 0.28, 0.0)); }
  return g; }
function pigMesh() { const g = new THREE.Group(); const pk = C(0xe89a9a); g.add(box(0.7, 0.55, 1.1, pk, 0, 0.55, 0)); const h = pigHead(); h.scale.setScalar(0.8); h.position.set(0, 0.7, 0.65); g.add(h); for (const [x, z] of [[-0.22, -0.38], [0.22, -0.38], [-0.22, 0.38], [0.22, 0.38]]) g.add(box(0.18, 0.3, 0.18, C(0xd88080), x, 0.15, z)); return g; }
function fliesSwarm(n = 36, seed = 7) { const g = new THREE.Group(), r = rng(seed), m = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  for (let i = 0; i < n; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.045), m); f.userData = { r: 0.35 + r() * 0.5, sp: 2 + r() * 4, p: r() * 6.28, y: (r() - 0.3) * 0.7, w: r() * 3 }; g.add(f); }
  g.userData.update = t => g.children.forEach(f => { const u = f.userData, a = t * u.sp + u.p; f.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * u.w * 2 + u.p) * 0.15, Math.sin(a * 1.3) * u.r); }); return g; }
function stakeGroup(scene) { const g = new THREE.Group(); g.add(box(0.1, 1.8, 0.1, C(0x6a4a2a), 0, 0.9, 0)); const h = pigHead(); h.position.set(0, 1.95, 0); g.add(h); const fl = fliesSwarm(); fl.position.set(0, 1.95, 0); g.add(fl); g.userData = { head: h, flies: fl }; scene.add(g); return g; }
function pose4(ch, kind, t, ph = 0) {
  const P = ch.userData; pose3(ch, 'idle', t, ph);
  if (kind === 'hold') { P.armR.rotation.x = -2.75 + Math.sin(t * 2 + ph) * 0.05; P.armR.rotation.z = 0.12; P.head.rotation.x = -0.1; }
  else if (kind === 'blow') { P.armR.rotation.x = -2.0; P.armR.rotation.z = 0.5; P.armL.rotation.x = -1.8; P.armL.rotation.z = -0.4; P.head.rotation.x = -0.12 - Math.abs(Math.sin(t * 1.5)) * 0.06; }
  else if (kind === 'look') { P.armR.rotation.x = -1.35; P.armR.rotation.z = 0.15; P.head.rotation.x = 0.25; }
  else if (kind === 'spear') { P.armR.rotation.x = -0.75 + Math.sin(t * 1.7 + ph) * 0.04; P.armL.rotation.x = Math.sin(t * 1.7 + ph) * 0.05; }
  else if (kind === 'raise') { P.armR.rotation.x = -2.85 + Math.sin(t * 6 + ph) * 0.18; P.armL.rotation.x = -0.3; P.head.rotation.x = -0.2; }
  else if (kind === 'dance') { const j = Math.abs(Math.sin(t * 5 + ph)); P.armR.rotation.x = -2.6 + j * 0.4; P.armL.rotation.x = -2.2 + Math.sin(t * 5 + ph) * 0.5; P.legL.rotation.x = Math.sin(t * 5 + ph) * 0.5; P.legR.rotation.x = -Math.sin(t * 5 + ph) * 0.5; ch.position.y = (P.baseY ?? 0) + j * 0.2; P.head.rotation.x = -0.15; }
  else if (kind === 'cower') { P.head.rotation.x = 0.35; P.armL.rotation.x = P.armR.rotation.x = -1.7; P.armL.rotation.z = 0.45; P.armR.rotation.z = -0.45; P.legL.rotation.x = P.legR.rotation.x = -0.9; ch.position.y = (P.baseY ?? 0) - 0.18 * P.s + Math.sin(t * 30 + ph) * 0.006; }
  else if (kind === 'cry') { P.head.rotation.x = 0.3; P.armL.rotation.x = P.armR.rotation.x = -0.35; P.body.rotation.x = Math.sin(t * 7) * 0.025; }
  else if (kind === 'lens') { P.armR.rotation.x = -1.45; P.armR.rotation.z = 0.2; P.head.rotation.x = 0.38; P.legL.rotation.x = -1.5; P.legR.rotation.x = 0; ch.position.y = (P.baseY ?? 0) - 0.3 * P.s; }
  else if (kind === 'kneel') { P.legL.rotation.x = P.legR.rotation.x = -1.5; ch.position.y = (P.baseY ?? 0) - 0.42 * P.s; P.armL.rotation.x = P.armR.rotation.x = -0.4; P.head.rotation.x = -0.25; }
  else if (kind === 'ram') { const k = Math.abs(Math.sin(t * 4)); P.armR.rotation.x = P.armL.rotation.x = -1.6 + k * 0.5; P.armL.rotation.z = -0.25; P.armR.rotation.z = 0.25; P.head.rotation.x = 0.25; }
  else if (kind === 'hips') { P.armL.rotation.z = -0.55; P.armR.rotation.z = 0.55; P.armL.rotation.x = P.armR.rotation.x = -0.25; P.head.rotation.x = -0.05; }
  else if (kind === 'run') { const w = Math.sin(t * 12 + ph); P.legL.rotation.x = w * 1.0; P.legR.rotation.x = -w * 1.0; P.armL.rotation.x = -0.5 - w * 0.8; P.armR.rotation.x = -0.5 + w * 0.8; P.body.rotation.x = 0.12; ch.position.y = (P.baseY ?? 0) + Math.abs(w) * 0.07; }
  else if (kind === 'carry') { pose(ch, 'carry', t, ph); }
  else pose3(ch, kind, t, ph);
}

// ---------- Figuren ----------
const RALPH = { skin: 0xf0c4a2, hair: 0xe8c460, hairVol: true, top: 0xd8d6cc, bottom: 0x5a5a62, shoe: 0x3a2a1a, eye: '#3a6a9a', smile: true, seed: 51 };
const PIGGY = { skin: 0xf2cdb0, hair: 0x6a4422, top: 0x9aa4ae, bottom: 0x4a4a52, shoe: 0x2a1a10, eye: '#3a2a1a', wide: true, seed: 52 };
const JACK = { skin: 0xf0c0a0, hair: 0xc8501a, hairVol: true, top: 0x16161a, bottom: 0x16161a, shoe: 0x1a1a1a, eye: '#3a8a3a', seed: 53 };
const SIMON = { skin: 0xe0a882, hair: 0x1a1410, top: 0xcfcfc6, bottom: 0x4a4a52, shoe: 0x2a1a10, eye: '#2a1a10', seed: 54 };

// =====================================================================
// SET: die Insel (ein Set, vier Lichtstimmungen)
// =====================================================================
const isl = new THREE.Scene();
const IS = {};
{
  IS.sky = skyDome(isl, 0x3a7ad0, 0x8ac0e8, 0xe0f0f8, V(-0.4, 0.5, 0.5)); isl.fog = new THREE.Fog(0xd8ecf6, 120, 600);
  IS.clouds = new THREE.Group(); isl.add(IS.clouds); clouds(IS.clouds, 5, 0xffffff, 70, 22, 260, 0.85);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x1f6aa8, roughness: 0.22, metalness: 0.15 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.16; sea.receiveShadow = true; isl.add(sea); IS.sea = sea;
  const shallowM = new THREE.MeshStandardMaterial({ color: 0x3ec4c4, roughness: 0.2, metalness: 0.1 });
  isl.add(box(180, 0.02, 140, shallowM, 0, -0.12, -40, { cast: false })); IS.shallowM = shallowM;
  const sand = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe6d29a, 0.07), 3001)), wet = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xc4ae78, 0.07), 3002));
  isl.add(box(150, 1, 100, sand, 0, -0.5, -46, { cast: false }));
  const r0 = rng(3003); for (let x = -75; x < 75; x += 6) { const d = r0() * 3; isl.add(box(6, 1, 2 + d, sand, x + 3, -0.5, 4 + d / 2, { cast: false })); isl.add(box(6, 0.04, 1.2, wet, x + 3, -0.02, 4.4 + d, { cast: false })); }
  for (const s of [-1, 1]) for (let z = -90; z < 5; z += 6) isl.add(box(2 + r0() * 3, 1, 6, sand, s * (75 + r0()), -0.5, z + 3, { cast: false }));
  const grassM = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x5f8a3a, 0.14), 3004));
  isl.add(box(140, 0.1, 80, grassM, 0, 0.05, -52, { cast: false }));
  for (let x = -70; x < 70; x += 3) isl.add(box(3, 0.1, 1 + r0() * 3, grassM, x + 1.5, 0.05, -11.5 + r0() * 1.5, { cast: false }));
  // Dschungel: Palmen, Büsche
  const bushM = [C(0x2e6a26), C(0x3a7a2e), C(0x2a5a22)];
  const r1 = rng(3010);
  for (const [x, z, h, l, ro] of [[-5.5, -7, 7, 0.25, 0.4], [6.5, -9, 8, 0.22, 2.6], [-11, -9, 6.5, 0.2, 0.2], [10, -6.5, 6, 0.3, 3.0], [-17, -7.5, 7.5, 0.2, 0.6], [16, -9, 7, 0.24, 2.8], [23, -7, 6, 0.3, 3.3], [-24, -8, 7, 0.22, 0.1], [30, -9, 7.5, 0.2, 2.5], [-31, -7, 6.5, 0.26, 0.5], [37, -7.5, 6, 0.3, 3.1], [-38, -9, 7, 0.2, 0.3], [2.5, -15, 8.5, 0.12, 1.3]]) palm(isl, x, z, h, l, ro);
  for (let i = 0; i < 70; i++) { const x = -68 + r1() * 136, z = -14 - r1() * 70; if (Math.hypot(x - 6, z + 22) < 4 || Math.hypot(x + 22, z + 30) < 6 || Math.hypot(x + 16.5, z + 24.5) < 5 || (x > -35 && x < -25 && z < -27 && z > -52)) continue; palm(isl, x, z, 6 + Math.floor(r1() * 4), 0.1 + r1() * 0.2, r1() * 6); }
  for (let i = 0; i < 170; i++) { const x = -70 + r1() * 140, z = -10 - r1() * 80; if (Math.hypot(x - 6, z + 22) < 3.2 || Math.hypot(x + 22, z + 30) < 5 || Math.hypot(x + 10, z + 13) < 3.4 || Math.hypot(x + 16.5, z + 24.5) < 4.5 || (x > -34 && x < -26 && z < -28 && z > -52)) continue; const s = 0.8 + r1() * 1.6; isl.add(box(s * 1.4, s, s * 1.2, bushM[i % 3], x, s / 2, z)); if (r1() < 0.4) isl.add(box(s, s * 0.6, s, bushM[(i + 1) % 3], x + 0.3, s + 0.2, z - 0.2)); }
  // Berg (Signalfeuer oben)
  IS.MX = 13; IS.MZ = -72; IS.MY = 20; const rock = M(tileTex(0x8a8478, 0x6a645a, 3020, false)), rockG = M(tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x6a7a44, 0.16), 3021));
  [[44, 0], [34, 4], [24, 8], [15, 12], [9, 16]].forEach(([s, y], i) => { isl.add(box(s, 4, s * 0.9, i < 4 ? rockG : rock, IS.MX + (i % 2) * 0.6, y + 2, IS.MZ)); if (i > 0 && i < 4) for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + i; const rr = [0, 19, 14, 9.5][i]; palm(isl, IS.MX + Math.cos(a) * rr, IS.MZ + Math.sin(a) * rr * 0.85, 4 + (k % 3), 0.15, a, y); } });
  for (let i = 0; i < 10; i++) isl.add(box(1 + r1() * 1.2, 0.6 + r1() * 0.6, 1 + r1(), rock, IS.MX - 3.6 + r1() * 7, IS.MY + 0.3, IS.MZ - 3.5 + r1() * 2.5));
  IS.ash = new THREE.Group(); IS.ash.position.set(IS.MX, IS.MY, IS.MZ + 1); isl.add(IS.ash); IS.ash.add(box(1.4, 0.12, 1.4, C(0x3a3632), 0, 0.06, 0, { cast: false })); IS.ash.add(box(0.9, 0.16, 0.2, C(0x1a1a1a), 0, 0.15, 0)); IS.ash.add(box(0.2, 0.16, 0.9, C(0x222020), 0.1, 0.18, 0));
  IS.sigFire = fireAt(isl, IS.MX, IS.MY, IS.MZ + 1, 2.2); IS.sigSmoke = smoke(isl, IS.MX, IS.MY + 1.5, IS.MZ + 1, 16, 31, 0xd8d4cc);
  // Burgfelsen (Castle Rock) links am Meer
  const pinkR = M(tileTex(0xb89a8a, 0x8a6a62, 3030, false));
  IS.CR = V(-52, 0, -2); [[12, 3, 10], [9, 3, 8], [7, 3, 6], [4, 2, 4]].reduce((y, [w, h, d]) => { isl.add(box(w, h, d, pinkR, IS.CR.x, y + h / 2, IS.CR.z)); return y + h; }, 0);
  isl.add(box(3, 1.2, 2.4, pinkR, IS.CR.x + 5.5, 6.6, IS.CR.z - 1)); // Felsbrocken oben
  for (let i = 0; i < 8; i++) isl.add(box(1.4, 0.8 + r1(), 1.2, pinkR, IS.CR.x - 6 + r1() * 12, 0.3, IS.CR.z + 5 + r1() * 2));
  // Wrack im Dschungel
  IS.WR = V(-22, 0, -30); const al = C(0x9aa0a6, { metal: 0.5, rough: 0.5 }), alD = C(0x5a5e62, { metal: 0.4, rough: 0.6 });
  const wr = new THREE.Group(); wr.position.copy(IS.WR); wr.rotation.y = 0.6; isl.add(wr);
  wr.add(box(9, 0.1, 3.2, C(0x4a3a2a), 0, 0.06, 0, { cast: false }));
  const fus = box(1.6, 1.6, 6, al, 0, 0.7, 0); fus.rotation.z = 0.12; fus.rotation.x = 0.05; wr.add(fus); const fus2 = box(1.5, 1.5, 2.6, alD, 0.4, 0.6, -4.6); fus2.rotation.y = 0.5; fus2.rotation.z = -0.3; wr.add(fus2);
  for (let k = -2; k <= 2; k++) wr.add(box(0.02, 0.28, 0.3, C(0x1a2a3a), 0.81, 1.0, k * 1.0, { cast: false }));
  const wing = box(5, 0.14, 1.6, al, 3.4, 0.3, 0.6); wing.rotation.z = -0.15; wr.add(wing); const tail = box(0.14, 1.6, 1.2, alD, -0.2, 1.8, 2.8); tail.rotation.z = 0.12; wr.add(tail);
  IS.wrSmoke = smoke(isl, IS.WR.x + 0.5, 1.2, IS.WR.z, 12, 41, 0x4a4642);
  // Versammlungsplatz (Stämme)
  IS.AS = V(18, 0, -1); for (const [x, z, ry] of [[20.4, -1, Math.PI / 2], [18, -3.8, 0], [15.4, -2.4, -0.5]]) { const l = box(3.2, 0.4, 0.45, M(T.darkwood), x, 0.22, z); l.rotation.y = ry; isl.add(l); }
  // Lagerfeuer (Nacht / Jacks Lager), Tanzfeuer am Strand
  IS.camp = fireAt(isl, IS.CR.x + 12, 0, IS.CR.z + 5, 1.2); IS.hookFire = fireAt(isl, 0.05, 0, -1.4, 1.0);
  { const fp = C(0xcdb27a), r = rng(3090); for (let k = 0; k < 9; k++) for (const sx of [-1, 1]) { const z = 4.6 - k * 0.55, x = -1.6 + k * 0.08 + sx * 0.14; isl.add(box(0.13, 0.015, 0.24, fp, x, 0.008, z + (sx > 0 ? 0.27 : 0), { cast: false })); }
    for (let k = 0; k < 14; k++) { const x = -3.5 + r() * 7, z = 0.6 + r() * 4; const sc = new THREE.Group(); sc.position.set(x, 0, z); sc.rotation.y = r() * 6; sc.add(box(0.16, 0.07, 0.11, C([0xf2dcc8, 0xf0b0b8, 0xe8d0a0][k % 3]), 0, 0.035, 0)); sc.add(box(0.07, 0.05, 0.07, C(0xf6eee0), 0.09, 0.03, 0)); isl.add(sc); } } IS.dance = fireAt(isl, -8, 0, 0.5, 1.3);
  const spit = new THREE.Group(); spit.position.set(IS.CR.x + 12, 0, IS.CR.z + 5); isl.add(spit); for (const x of [-0.9, 0.9]) spit.add(box(0.08, 1.4, 0.08, C(0x5a3a20), x, 0.7, 0)); spit.add(box(2.0, 0.06, 0.06, C(0x5a3a20), 0, 1.35, 0)); const roast = pigMesh(); roast.scale.setScalar(0.6); roast.rotation.z = Math.PI / 2; roast.rotation.y = Math.PI / 2; roast.position.set(0, 1.45, 0); spit.add(roast); IS.spit = spit;
  // Pfahl mit Schweinekopf
  IS.stake = stakeGroup(isl);
  // Flächenbrand
  IS.burn = new THREE.Group(); isl.add(IS.burn); IS.burnFires = []; const r2 = rng(3050);
  for (let i = 0; i < 70; i++) { const x = -60 + r2() * 120, z = -12 - r2() * 60; const f = fireAt(IS.burn, x, 0, z, 3 + r2() * 4, i % 10 === 0, false); IS.burnFires.push(f); }
  IS.burnSmoke = []; for (let i = 0; i < 9; i++) IS.burnSmoke.push(smoke(IS.burn, -50 + i * 12, 4, -20 - (i % 3) * 14, 16, 3060 + i, 0x3a3430));
  IS.burnSmoke.forEach(s => s.scale.setScalar(2.6));
  // Schiff am Horizont, Kriegsschiff, Flugzeug
  const grey = C(0x6a7078, { metal: 0.3, rough: 0.6 }), greyD = C(0x4a5058, { metal: 0.3, rough: 0.6 });
  const shipG = (s) => { const g = new THREE.Group(); g.add(box(26, 2.4, 4.4, grey, 0, 0.9, 0)); g.add(box(20, 0.3, 4.6, greyD, 0, 2.2, 0)); g.add(box(6, 3, 3.4, grey, -1, 3.8, 0)); g.add(box(3, 2, 2.6, greyD, -1.5, 6.2, 0)); g.add(box(1.4, 3.4, 1.4, C(0x3a3e44), 2.8, 5.4, 0)); g.add(box(0.2, 5, 0.2, greyD, -2, 8.6, 0));
    for (const x of [8, -9]) { g.add(box(2.2, 1.0, 2.2, greyD, x, 2.9, 0)); g.add(box(3.2, 0.3, 0.3, C(0x3a3e44), x + Math.sign(x) * 2.2, 3.0, 0)); } g.scale.setScalar(s); isl.add(g); return g; };
  IS.farShip = shipG(1.0); IS.warship = shipG(1.3); IS.boat = new THREE.Group(); IS.boat.add(box(1.8, 0.7, 4.4, C(0xe8e8e8), 0, 0.2, 0)); IS.boat.add(box(1.2, 0.6, 1.4, grey, 0, 0.8, -0.6)); isl.add(IS.boat);
  IS.plane = new THREE.Group(); { const g = IS.plane; g.add(box(1.5, 1.5, 9, al, 0, 0, 0)); g.add(box(1.1, 1.1, 1.0, alD, 0, 0, 5.0)); g.add(box(12, 0.18, 1.8, al, 0, -0.1, 0.8)); g.add(box(4.4, 0.14, 1.0, al, 0, 0.1, -4.0)); g.add(box(0.14, 1.6, 1.2, alD, 0, 1.0, -4.0)); for (let k = -3; k <= 3; k++) for (const x of [-0.76, 0.76]) g.add(box(0.02, 0.3, 0.34, C(0x1a2a3a), x, 0.25, k * 1.1, { cast: false })); g.add(box(0.9, 0.9, 1.6, alD, 3.4, -0.4, 1.0)); g.add(box(0.9, 0.9, 1.6, alD, -3.4, -0.4, 1.0)); isl.add(g); }
  IS.trail = []; const trM = [0x2a2826, 0x3a3634, 0x4a4644].map(c => new THREE.MeshStandardMaterial({ color: c, transparent: true, roughness: 1, depthWrite: false }));
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trM[i % 3].clone()); m.castShadow = false; isl.add(m); IS.trail.push(m); }
  IS.planeFire = fireAt(isl, 0, 0, 0, 1.4, false, false);
  // Schild bei Sonnenuntergang
  const sign = new THREE.Group(); sign.position.set(44, 0, -1); isl.add(sign); for (const x of [-2.2, 2.2]) sign.add(box(0.25, 2.6, 0.25, M(T.darkwood), x, 1.3, 0));
  const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 512; const stex = new THREE.CanvasTexture(bcv); stex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 0.18), [C(0x6a5040), C(0x6a5040), C(0x6a5040), C(0x6a5040), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.9 }), C(0x6a5040)]); board.position.y = 3.6; board.castShadow = true; sign.add(board);
  IS.bcv = bcv; IS.stex = stex; IS.sign = sign;
  // Licht
  IS.sun = sunLight(isl, 0xfff2dc, 3.4, V(-40, 70, 40), V(0, 0, 0), 26); IS.hemi = new THREE.HemisphereLight(0xd8e8ff, 0x8a7a5a, 1.4); isl.add(IS.hemi);
  IS.moonGlow = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 1), new THREE.MeshBasicMaterial({ color: 0xe8eeff, fog: false })); IS.moonGlow.position.set(-160, 190, -600); isl.add(IS.moonGlow);
  IS.nl = new THREE.PointLight(0x9ab4ff, 0, 9, 1.2); IS.nl.position.set(6.4, 2.6, -18.5); isl.add(IS.nl);
  IS.eyes = new THREE.Group(); for (const [x, y] of [[-0.12, 0], [0.12, 0]]) IS.eyes.add(box(0.1, 0.06, 0.02, new THREE.MeshBasicMaterial({ color: 0xff3a2a, fog: false }), x, y, 0, { cast: false })); isl.add(IS.eyes);
  // Figuren
  IS.ralph = humanoid(RALPH); IS.piggy = humanoid(PIGGY); IS.jack = humanoid(JACK); IS.simon = humanoid(SIMON); IS.glasses = glassesOn(IS.piggy);
  IS.conch = inHand(IS.ralph, conchMesh()); IS.conch.children[0].rotation.y = -0.3;
  IS.pConch = inHand(IS.piggy, conchMesh());
  IS.lensR = inHand(IS.ralph, (() => { const g = new THREE.Group(); const fm = C(0x1a1a1a); g.add(box(0.2, 0.03, 0.03, fm, 0, 0.06, 0.12, { cast: false })); g.add(box(0.2, 0.03, 0.03, fm, 0, -0.06, 0.12, { cast: false })); g.add(box(0.16, 0.1, 0.012, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0.12, { cast: false })); return g; })());
  IS.jSpear = inHand(IS.jack, spearMesh());
  IS.choir = [0, 1, 2, 3].map(i => { const p = humanoid({ skin: [0xf0c4a2, 0xe8b894, 0xf2cdb0, 0xe0a882][i], hair: [0x2a1a14, 0x8a5a2a, 0x1a1410, 0x6a4422][i], top: 0x16161a, bottom: 0x16161a, shoe: 0x1a1a1a, seed: 60 + i }); choirCap(p); p.userData.spear = inHand(p, spearMesh()); isl.add(p); return p; });
  IS.lit = [0, 1, 2, 3, 4].map(i => { const p = humanoid({ skin: [0xf2cdb0, 0xe8b894, 0xc89a72, 0xf0c4a2, 0x8a5a3a][i], hair: [0xb8925a, 0x3a2a1a, 0x1a1a1a, 0xd8b070, 0x1a1410][i], hairVol: i % 2 === 0, top: [0xe8e8e0, 0xb8c0c8, 0xd8d0c0, 0xc8d8e8, 0xe0e0d8][i], bottom: [0x5a5a62, 0x4a4a52, 0x6a5a4a, 0x5a5a62, 0x4a4a52][i], smile: true, scale: 0.72, seed: 70 + i }); isl.add(p); return p; });
  IS.officer = humanoid({ skin: 0xf0c4a2, hair: 0x6a4a2a, beard: 'mustache', beardCol: 0x6a4a2a, top: 0xf4f4f0, bottom: 0xf4f4f0, shoe: 0x1a1a1a, belt: 0x1a1a1a, eye: '#3a5a8a', seed: 80 }); navyCap(IS.officer);
  IS.officer.userData.body.add(box(0.06, 0.06, 0.02, C(0xe0b030, { metal: 0.6 }), 0, 1.25, 0.14, { cast: false })); IS.officer.userData.body.add(box(0.06, 0.06, 0.02, C(0xe0b030, { metal: 0.6 }), 0, 1.0, 0.14, { cast: false }));
  IS.pig = pigMesh(); isl.add(IS.pig);
  isl.add(IS.ralph, IS.piggy, IS.jack, IS.simon, IS.officer);
  IS.burstConch = particlesBurst(isl, 26, [0xf2dcc8, 0xf08aa0, 0xe8c8a8], 3070, 0.09);
  IS.all = [IS.ralph, IS.piggy, IS.jack, IS.simon, IS.officer, ...IS.choir, ...IS.lit];
}
const MODES = {
  golden: { sky: [0x2e4f9a, 0xe8a07a, 0xffd2a0], sun: [0xffc890, 3.3, V(0.55, 0.3, 0.78)], hemi: [0xffd8c0, 0x8a6a4a, 1.25], fog: [0xf4c8a8, 140, 650], exp: 1.3, sea: 0x2a6aa0, sh: 0x48b8b8, clouds: 0xffd0b0 },
  day: { sky: [0x3a7ad0, 0x8ac0e8, 0xe0f0f8], sun: [0xfff2dc, 3.4, V(-0.45, 0.8, 0.5)], hemi: [0xd8e8ff, 0x8a7a5a, 1.4], fog: [0xd8ecf6, 140, 650], exp: 1.3, sea: 0x1f6aa8, sh: 0x3ec4c4, clouds: 0xffffff },
  night: { sky: [0x04060e, 0x0c1630, 0x1a2848], sun: [0x8a9ae8, 1.5, V(-0.4, 0.7, 0.3)], hemi: [0x4a5a8a, 0x15151f, 1.1], fog: [0x0e1630, 40, 300], exp: 1.7, sea: 0x0a1a34, sh: 0x123a4a, clouds: 0x2a3450 },
  burn: { sky: [0x2a1610, 0x8a3a1a, 0xe8783a], sun: [0xff9a5a, 2.4, V(0.35, 0.45, 0.8)], hemi: [0xffa070, 0x3a1a10, 1.0], fog: [0x9a5a3a, 60, 420], exp: 1.32, sea: 0x2a3a4a, sh: 0x3a6a6a, clouds: 0x6a4a3a },
};
let curMode = null;
function setMode(m, focus = V(0, 0, 0)) {
  const D = MODES[m]; const u = IS.sky.material.uniforms;
  if (curMode !== m) { u.top.value.set(D.sky[0]); u.mid.value.set(D.sky[1]); u.hor.value.set(D.sky[2]); u.sd.value.copy(D.sun[2]).normalize(); u.sc.value.set(...(m === 'golden' ? [1, 0.7, 0.45] : m === 'night' ? [0.3, 0.35, 0.5] : [1, 0.85, 0.6]));
    IS.sun.color.set(D.sun[0]); IS.sun.intensity = D.sun[1]; IS.hemi.color.set(D.hemi[0]); IS.hemi.groundColor.set(D.hemi[1]); IS.hemi.intensity = D.hemi[2];
    isl.fog.color.set(D.fog[0]); isl.fog.near = D.fog[1]; isl.fog.far = D.fog[2]; IS.sea.material.color.set(D.sea); IS.shallowM.color.set(D.sh);
    IS.clouds.traverse(o => { if (o.material) o.material.color.set(D.clouds); }); IS.moonGlow.visible = m === 'night'; curMode = m; }
  IS.sun.target.position.copy(focus); IS.sun.position.copy(focus).addScaledVector(D.sun[2].clone().normalize(), 90); IS.sun.shadow.camera.far = 200; IS.sun.shadow.camera.updateProjectionMatrix();
  return D.exp;
}
function drawSign() {
  const c = IS.bcv.getContext('2d');
  c.fillStyle = '#a99474'; c.fillRect(0, 0, 1024, 512); const r = rng(9); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(60,40,20,${r() * 0.08})`; c.fillRect(r() * 1024, r() * 512, 3, 3); }
  c.strokeStyle = '#6a5440'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 498); c.textAlign = 'center';
  const fit = (txt, size, y, col) => { let s = size; c.font = `800 ${s}px Mont`; while (c.measureText(txt).width > 930) { s -= 2; c.font = `800 ${s}px Mont`; } c.fillStyle = col; c.fillText(txt, 512, y); };
  fit('GOLDING, 1954', 72, 150, '#a3241c'); fit('DAS BÖSE IN UNS ALLEN', 58, 290, '#3a2a1e'); fit('IST DER WAHRE HERR DER FLIEGEN', 58, 380, '#3a2a1e'); IS.stex.needsUpdate = true;
}

// =====================================================================
// Timeline – wortbasiert
// =====================================================================
const words = await (await fetch('words.json')).json();
const wt = i => words[i][1];
const SPEECH_END = words[words.length - 1][2]; // wird nach dem Ton durch den gemessenen Wert ersetzt
const DUR = Math.round((SPEECH_END + 0.16) * 30) / 30;
const WHIP0 = wt(3) - 1 / 30, WHIP1 = WHIP0 + 0.57; // wt(3) = hörbarer Einsatz „erklärt“ (erklaert-onset.py --fix --idx 3)
const CUTS = [[0, 'hero'], [6, 'island'], [13, 'plane'], [20, 'wreck'], [24, 'alone'], [29, 'fun'], [34, 'conch'], [40, 'blow'], [47, 'vote'], [52, 'rule'], [61, 'piggy'], [69, 'fire'],
  [79, 'jack'], [89, 'hunters'], [95, 'paint'], [103, 'ship'], [108, 'out'], [118, 'fear'], [125, 'camp'], [138, 'stake'], [148, 'flies'], [159, 'simon'], [171, 'storm'], [186, 'gone'],
  [188, 'rock'], [196, 'hunt'], [204, 'burn'], [216, 'officer'], [227, 'cry'], [234, 'sign'], [242, 'loop']];
const SHOTS = CUTS.map(([i, id], k) => ({ a: i === 0 ? 0 : wt(i) - 0.07, b: k + 1 < CUTS.length ? wt(CUTS[k + 1][0]) - 0.07 : DUR, id }));
let lastTarget = V(0, 0, 0);
function cam(p, t, fov) { camera.position.copy(p); camera.lookAt(t); camera.fov = fov; lastTarget = t.clone(); }
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
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
let signDrawn = false;
const HERO = '#ffd23f', ALLY = '#55ffff', BAD = '#ff5555', GREY = '#aaaaaa', WHITE = '#ffffff';
const gray = s => `<span style="color:#aaaaaa">${s}</span>`, green = s => `<span style="color:#55ff55">${s}</span>`, red = s => `<span style="color:#ff5555">${s}</span>`;
const put = (ch, x, y, z, ry = 0) => { ch.visible = true; ch.position.set(x, y, z); ch.rotation.set(0, ry, 0); ch.userData.baseY = y; };
const upright = (g, ch, tilt = 0) => { g.rotation.x = -ch.userData.armR.rotation.x + tilt; g.rotation.z = -ch.userData.armR.rotation.z; };
const PAINT = { paint: true, angry: true };

function render(frame) {
  const t = frame / FPS;
  const sh = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const u = (t - sh.a) / (sh.b - sh.a), id = sh.id;
  let mode = 'day'; const ui = { tags: [], chat: [], tip: null, toast: null, eff: null };
  const tag = (ch, text, color, extra = 0) => ui.tags.push([tagPos(ch, extra), text, color]);
  const chat = (t0, html) => { if (t >= t0) ui.chat.push(`<div style="opacity:${clamp01((t - t0) / 0.1)}">${html}</div>`); };
  const info = (t0, text) => chat(t0, `<span style="color:#ffd23f">[Info]</span> ${text}`);
  const say = (t0, who, col, txt) => chat(t0, `<span style="color:${col}">&lt;${who}&gt;</span> ${txt}`);
  const tip = (t0, icon, title, titleCol, lines) => { if (t >= t0) ui.tip = { o: clamp01((t - t0) / 0.1), icon, title, titleCol, lines }; };
  const eff = (t0, name, time, col) => { if (t >= t0) ui.eff = { o: clamp01((t - t0) / 0.15), name, time, col }; };
  const toast = (t0, l1, l2, icon) => { if (t >= t0) ui.toast = { o: clamp01((t - t0) / 0.12), y: lerp(-140, 0, smoother((t - t0) / 0.25)), l1, l2, icon }; };

  // alles zurücksetzen
  IS.all.forEach(p => { p.visible = false; p.userData.setFace({}); });
  [IS.conch, IS.pConch, IS.lensR, IS.jSpear, IS.stake, IS.sigFire, IS.sigSmoke, IS.wrSmoke, IS.camp, IS.dance, IS.spit, IS.burn, IS.farShip, IS.warship, IS.boat, IS.plane, IS.planeFire, IS.pig, IS.eyes, IS.sign, IS.burstConch, IS.ash, IS.hookFire].forEach(o => o.visible = false); IS.sigFire.scale.setScalar(2.2);
  IS.choir.forEach(p => p.userData.spear.visible = false); IS.nl.intensity = 0; IS.trail.forEach(m => m.visible = false); IS.glasses.visible = true;
  IS.ash.visible = true; IS.sigFire.visible = IS.sigSmoke.visible = true; let sigK = 1;
  const ta = id === 'loop' ? t - DUR : t;

  if (id === 'hero' || id === 'loop') { mode = 'golden';
    put(IS.ralph, HX, 0, HZ, 0.5); put(IS.jack, HX2, 0, HZ, -0.5); pose4(IS.ralph, 'look', ta, 0); IS.ralph.userData.armR.rotation.x = -0.45; IS.ralph.userData.armR.rotation.z = 0.12; pose4(IS.jack, 'spear', ta, 1); IS.hookFire.visible = true; IS.conch.visible = IS.jSpear.visible = true; upright(IS.jSpear, IS.jack, 0.08);
    IS.ralph.userData.setFace({ smile: false }); IS.jack.userData.setFace(PAINT); IS.ralph.userData.head.rotation.y = 0.3; IS.ralph.userData.head.rotation.x = 0.05; IS.jack.userData.head.rotation.y = -0.25;
    IS.stake.visible = true; IS.stake.position.set(0.05, 0, -3.0); IS.stake.rotation.y = 0;
    heroCam(ta); tag(IS.ralph, 'Ralph', HERO); tag(IS.jack, 'Jack', BAD); }
  if (id === 'island') { mv(u, V(-70, 42, 86), V(-63, 38.5, 78), V(5, 4, -38), V(6, 4, -38), 42); info(wt(6), 'Pazifik, mitten im Krieg'); IS.sigFire.visible = IS.sigSmoke.visible = false; }
  if (id === 'plane') { IS.sigFire.visible = IS.sigSmoke.visible = false; const A = V(-7, 19, -16), B = V(7, 6.5, -82), d = B.clone().sub(A).normalize();
    const pp = A.clone().lerp(B, u); IS.plane.visible = true; IS.plane.position.copy(pp); IS.plane.lookAt(pp.clone().add(d)); IS.plane.rotateZ(0.25 + u * 0.3);
    IS.trail.forEach((m, i) => { const q = pp.clone().addScaledVector(d, -1.5 - i * 0.9); m.visible = true; m.position.copy(q).add(V(Math.sin(i * 1.7) * 0.15 * i * 0.1, i * 0.02, 0)); m.scale.setScalar(0.6 + i * 0.07); m.rotation.set(i, i * 0.7, 0); m.material.opacity = 0.85 * (1 - i / 40); });
    IS.planeFire.visible = true; IS.planeFire.position.copy(pp).addScaledVector(d, -0.5).add(V(3.4, 0, 0)); IS.planeFire.userData.update(t, 1);
    mv(u, V(0, 1.7, 8), V(0.3, 1.66, 7.3), V(0, 9, -40), V(0.6, 8, -46), 50); }
  if (id === 'wreck') { IS.sigFire.visible = IS.sigSmoke.visible = false; IS.wrSmoke.visible = true; mv(u, V(-15.4, 3.2, -23), V(-16.1, 2.9, -23.7), V(-22, 1, -30), V(-22, 1, -30), 48); eff(wt(21), 'Erwachsene', '0', BAD); }
  if (id === 'alone') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    put(IS.ralph, 8, 0, 1, -0.2); put(IS.piggy, 9.6, 0, 0.3, -0.6); put(IS.simon, 6.1, 0, -0.4, 0.35); pose4(IS.ralph, 'idle', t); pose4(IS.piggy, 'idle', t, 1); pose4(IS.simon, 'idle', t, 2);
    IS.ralph.userData.head.rotation.y = Math.sin(t * 1.3) * 0.5; IS.piggy.userData.head.rotation.y = Math.sin(t * 1.1 + 2) * 0.4;
    [[4.9, 1.8, 0.4], [11.2, 2.0, -0.5], [7.1, 2.8, 0.1]].forEach(([x, z, r], i) => { put(IS.lit[i], x, 0, z, r); pose4(IS.lit[i], 'sadidle', t, i); });
    mv(u, V(8.3, 2.3, 9.0), V(8.2, 2.1, 8.0), V(8, 1.0, 0.4), V(8, 1.0, 0.4), 50); }
  if (id === 'fun') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    put(IS.ralph, 1.6, 0, 3.2, 0.3); pose(IS.ralph, 'cheer', t);
    IS.lit.forEach((p, i) => { const a = t * 1.4 + i * 1.25; put(p, 0.6 + Math.cos(a) * 2.2, 0, 3.0 + Math.sin(a) * 1.0, Math.atan2(-Math.sin(a), Math.cos(a)) + 0.3); pose4(p, 'run', t, i); p.userData.setFace({ smile: true }); });
    mv(u, V(-2.2, 1.5, 10.5), V(-1.7, 1.45, 9.6), V(1, 1.0, 2.6), V(1, 1.0, 2.6), 48); }
  if (id === 'conch') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    put(IS.ralph, 24, 0, 3.6, 0.25); pose4(IS.ralph, 'look', t); IS.conch.visible = true; put(IS.piggy, 25.2, 0, 3.1, -0.45); pose4(IS.piggy, 'point', t, 1); IS.piggy.userData.armR.rotation.y = 0.5;
    mv(u, V(25.0, 1.75, 8.6), V(24.9, 1.7, 7.8), V(24.7, 1.3, 3.4), V(24.7, 1.3, 3.4), 48); tag(IS.ralph, 'Ralph', HERO); tag(IS.piggy, 'Piggy', ALLY);
    tip(wt(39), 'conch', 'Muschel', '#ff55ff', [gray('Seltener Fund'), gray('Klingt laut wie ein Horn')]); }
  if (id === 'blow') { IS.sigFire.visible = IS.sigSmoke.visible = false; const k = smoother(u * 1.2);
    put(IS.ralph, 18, 0, -1.2, 0.1); pose4(IS.ralph, 'blow', t); IS.conch.visible = true;
    [[IS.lit[0], 11.5, 1.2, 15.2, 0.9, 1.3], [IS.lit[1], 24.5, 1.4, 21.0, 0.9, -1.3], [IS.simon, 12.6, -3.2, 15.4, -2.2, 1.2], [IS.lit[2], 25, -2.6, 21.4, -1.8, -1.2]].forEach(([p, x0, z0, x1, z1, r], i) => { put(p, lerp(x0, x1, k), 0, lerp(z0, z1, k), r); pose4(p, k < 0.98 ? 'walk' : 'idle', t, i); });
    put(IS.piggy, 19.6, 0, -0.5, -0.3); pose4(IS.piggy, 'idle', t, 3);
    mv(u, V(18.6, 1.9, 6.4), V(18.5, 1.85, 5.6), V(18, 1.3, -1.2), V(18, 1.3, -1.2), 52); tag(IS.ralph, 'Ralph', HERO); }
  if (id === 'vote') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    put(IS.ralph, 16.2, 0, -1.0, 0.95); pose4(IS.ralph, 'look', t); IS.conch.visible = true;
    [[IS.lit[0], -2.1], [IS.piggy, -1.0], [IS.lit[1], 0.1]].forEach(([p, z], i) => { put(p, 20.4, 0, z, -1.0); pose3(p, 'idle', t, i); sitPose(p, 0.44); const P = p.userData; if (t >= wt(48) + i * 0.12) { const k = smoother((t - wt(48) - i * 0.12) / 0.35); P.armR.rotation.x = lerp(0, -2.8, k); P.armR.rotation.z = 0.15; } });
    [[IS.simon, 14.4, -3.0, 0.7], [IS.lit[2], 15.6, -3.4, 0.4], [IS.lit[3], 18.4, -3.1, -0.1]].forEach(([p, x, z, r], i) => { put(p, x, 0, z, r); pose3(p, 'idle', t, i + 3); if (t >= wt(48) + 0.2 + i * 0.1) { p.userData.armR.rotation.x = -2.8 * smoother((t - wt(48) - 0.2 - i * 0.1) / 0.35); } });
    mv(u, V(18.4, 3.2, 7.4), V(18.3, 3.0, 6.6), V(18, 0.9, -1.2), V(18, 0.9, -1.2), 50); tag(IS.ralph, 'Ralph', HERO);
    toast(wt(51), 'Fortschritt erzielt!', 'Ralph wird Anführer', 'conch'); }
  if (id === 'rule') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    put(IS.ralph, 16, 0, -1, 0.45); pose4(IS.ralph, 'hold', t); IS.conch.visible = true; IS.ralph.userData.setFace({ smile: false });
    mv(u, V(17.3, 1.75, 2.8), V(17.2, 1.7, 2.2), V(16, 1.75, -1), V(16, 1.75, -1), 48); tag(IS.ralph, 'Ralph', HERO, 0.55);
    tip(wt(53), 'conch', 'Die Regel', '#ffd23f', [gray('Nur wer die Muschel hält,'), gray('darf sprechen')]); }
  if (id === 'piggy') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    put(IS.piggy, 23.4, 0, -1.6, -0.25); pose4(IS.piggy, 'sadidle', t); IS.piggy.userData.setFace({ sad: true });
    put(IS.jack, 21.7, 0, -0.6, 1.0); pose4(IS.jack, 'laugh', t, 1); IS.jack.userData.setFace({ smile: true }); put(IS.choir[0], 25.1, 0, -0.5, -1.1); pose4(IS.choir[0], 'laugh', t, 2); IS.choir[0].userData.setFace({ smile: true });
    put(IS.lit[3], 24.4, 0, -3.2, -0.5); pose4(IS.lit[3], 'laugh', t, 3);
    mv(u, V(23.2, 1.8, 3.4), V(23.2, 1.74, 2.7), V(23.3, 1.3, -1.3), V(23.3, 1.3, -1.3), 50); tag(IS.piggy, 'Piggy', ALLY); tag(IS.jack, 'Jack', BAD);
    say(wt(65), 'Jack', BAD, 'Halt die Klappe, Fatty!'); }
  if (id === 'fire') { const k = smoother((t - wt(73)) / 0.7); sigK = k; IS.sigFire.visible = k > 0.01; IS.sigSmoke.visible = k > 0.3;
    IS.sigFire.scale.setScalar(1.2); put(IS.ralph, 14.5, 20, -71.9, -0.6); pose4(IS.ralph, 'lens', t); IS.lensR.visible = true; IS.ralph.userData.setFace({ smile: false });
    put(IS.piggy, 15.7, 20, -72.9, -0.5); pose4(IS.piggy, 'idle', t, 1); IS.glasses.visible = false; IS.piggy.userData.head.rotation.x = 0.3;
    mv(u, V(12.6, 21.9, -66.2), V(12.8, 21.8, -66.9), V(14.2, 20.7, -71.6), V(14.2, 20.7, -71.6), 50); tag(IS.ralph, 'Ralph', HERO); tag(IS.piggy, 'Piggy', ALLY);
    tip(wt(71), 'glasses', 'Piggys Brille', '#55ffff', [gray('Bündelt Sonnenlicht'), green('= Feuer')]); }
  if (id === 'jack') { IS.sigFire.visible = false;
    put(IS.jack, 23.4, 0, -0.4, -0.55); pose4(IS.jack, 'cross', t); IS.jack.userData.setFace({ angry: true });
    [[24.5, -1.7], [25.5, -0.8], [24.8, -2.9]].forEach(([x, z], i) => { put(IS.choir[i], x, 0, z, -0.6); pose4(IS.choir[i], 'idle', t, i); });
    put(IS.ralph, 20.7, 0, -0.2, 0.6); pose4(IS.ralph, 'look', t); IS.conch.visible = true; IS.ralph.userData.setFace({ smile: false });
    mv(u, V(22.2, 1.85, 5.8), V(22.2, 1.8, 5.0), V(22.4, 1.25, -0.8), V(22.4, 1.25, -0.8), 50); tag(IS.jack, 'Jack', BAD); tag(IS.ralph, 'Ralph', HERO); tag(IS.choir[1], 'Chor', GREY);
    say(wt(85), 'Jack', BAD, 'Ich sollte Anführer sein!'); }
  if (id === 'hunters' || id === 'paint') { IS.sigFire.visible = false;
    const painted = id === 'paint'; put(IS.jack, -10, 0, -12.4, 0.2); IS.jSpear.visible = true; IS.jack.userData.setFace(painted ? PAINT : { angry: true });
    const dance = painted && t >= wt(99); pose4(IS.jack, id === 'hunters' ? 'raise' : dance ? 'dance' : 'spear', t); upright(IS.jSpear, IS.jack, id === 'hunters' || dance ? 0.4 : 0.08);
    [[-11.6, -13.4, 0.45], [-8.5, -13.3, -0.35], [-9.9, -14.8, 0.1]].forEach(([x, z, r], i) => { const p = IS.choir[i]; put(p, x, 0, z, r); p.userData.spear.visible = true; pose4(p, id === 'hunters' ? 'raise' : dance ? 'dance' : 'spear', t, i + 1); upright(p.userData.spear, p, 0.35); if (painted) p.userData.setFace(PAINT); });
    if (id === 'hunters') { mv(u, V(-9.6, 0.9, -8.0), V(-9.7, 1.0, -8.7), V(-10, 1.7, -12.8), V(-10, 1.7, -12.8), 50); tag(IS.jack, 'Jack', BAD); tag(IS.choir[0], 'Jäger', BAD); tag(IS.choir[1], 'Jäger', BAD); }
    else { mv(u, V(-9.5, 1.8, -9.2), V(-9.55, 1.76, -9.8), V(-10, 1.6, -12.4), V(-10, 1.65, -12.4), 46); tag(IS.jack, 'Jack', BAD);
      if (t >= wt(101) - 0.2) { IS.pig.visible = true; IS.pig.position.set(-13.5 + (t - wt(101) + 0.2) * 5, 0, -14.2); IS.pig.rotation.y = Math.PI / 2; IS.pig.position.y = Math.abs(Math.sin(t * 14)) * 0.08; } } }
  if (id === 'ship') { IS.sigFire.visible = false; IS.farShip.visible = true; IS.farShip.position.set(-16 + (t - sh.a) * 3, -0.2, 140); IS.farShip.rotation.y = 0;
    mv(u, V(13.6, 22.2, -74.6), V(13.4, 22.0, -74.0), V(6, 6, 40), V(4, 6, 40), 44); ui.tags.push([V(IS.farShip.position.x, 10, 140), 'Schiff', WHITE]); }
  if (id === 'out') { IS.sigFire.visible = false;
    put(IS.ralph, 14.2, 20, -72.2, -0.3); pose4(IS.ralph, 'point', t); IS.ralph.userData.armR.rotation.y = -0.4; IS.ralph.userData.setFace({ angry: true });
    put(IS.jack, 12.1, 20, -70.4, 0.6); pose4(IS.jack, 'spear', t, 1); IS.jSpear.visible = true; upright(IS.jSpear, IS.jack, 0.08); IS.jack.userData.setFace(PAINT);
    IS.pig.visible = true; IS.pig.position.set(12.7, 20.25, -69.3); IS.pig.rotation.set(0, 0.5, Math.PI / 2);
    mv(u, V(13.5, 22.0, -64.6), V(13.4, 21.9, -65.3), V(13.2, 20.9, -71.2), V(13.2, 20.9, -71.2), 52); tag(IS.ralph, 'Ralph', HERO); tag(IS.jack, 'Jack', BAD);
    chat(wt(110), red('Signalfeuer ist erloschen')); }
  if (id === 'fear') { mode = 'night'; IS.sigFire.visible = IS.sigSmoke.visible = false;
    [[5.3, -20.9, 0.3], [6.5, -21.3, -0.25], [5.9, -20.0, 0.05]].forEach(([x, z, r], i) => { put(IS.lit[i], x, 0, z, r); pose4(IS.lit[i], 'cower', t, i); IS.lit[i].userData.setFace({ sad: true }); });
    IS.nl.intensity = 5; IS.eyes.visible = true; IS.eyes.position.set(7.6, 1.35, -26.5); IS.eyes.lookAt(6, 1.3, -18); const bl = (t % 2.1) < 0.1; IS.eyes.scale.set(1, bl ? 0.1 : 1, 1);
    mv(u, V(6.6, 1.6, -15.2), V(6.5, 1.5, -15.9), V(6.3, 0.8, -21.6), V(6.3, 0.8, -21.6), 50); tag(IS.lit[0], 'Kleine', GREY);
    say(wt(121), 'Kleiner', GREY, 'Da ist ein Biest!'); }
  if (id === 'camp') { mode = 'night'; IS.sigFire.visible = IS.sigSmoke.visible = false; IS.camp.visible = IS.spit.visible = true;
    put(IS.jack, -40.4, 0, 1.4, 0.25); pose4(IS.jack, 'raise', t); IS.jSpear.visible = true; upright(IS.jSpear, IS.jack, 0.4); IS.jack.userData.setFace(PAINT);
    [[-42.4, 2.0, 0.6], [-38.3, 1.8, -0.5]].forEach(([x, z, r], i) => { const p = IS.choir[i]; put(p, x, 0, z, r); p.userData.spear.visible = true; pose4(p, 'dance', t, i + 1); upright(p.userData.spear, p, 0.35); p.userData.setFace(PAINT); });
    const k = smoother(u * 1.1); [[IS.lit[2], -33.5, 4.6, -37.0, 4.4], [IS.lit[3], -32.6, 6.0, -36.2, 5.8], [IS.lit[4], -31.5, 3.2, -35.6, 3.2]].forEach(([p, x0, z0, x1, z1], i) => { put(p, lerp(x0, x1, k), 0, lerp(z0, z1, k), -1.0); pose4(p, k < 0.98 ? 'walk' : 'idle', t, i); });
    mv(u, V(-38.4, 2.4, 11.4), V(-38.8, 2.3, 10.6), V(-39.4, 1.2, 3.0), V(-39.4, 1.2, 3.0), 52); tag(IS.jack, 'Jack', BAD);
    say(wt(126), 'Jack', BAD, 'Bei mir gibt es Fleisch!'); }
  if (id === 'stake' || id === 'flies' || id === 'simon') { IS.sigFire.visible = IS.sigSmoke.visible = false; IS.stake.visible = true; IS.stake.position.set(6, 0, -22); IS.stake.rotation.y = 0.3;
    if (id === 'stake') { const k = smoother((t - sh.a) / 0.9); IS.stake.position.y = lerp(0.5, 0, k);
      put(IS.jack, 7.0, 0, -21.5, -1.1); pose4(IS.jack, 'ram', t); IS.jack.userData.setFace(PAINT);
      put(IS.choir[0], 4.9, 0, -21.3, 0.9); IS.choir[0].userData.spear.visible = true; pose4(IS.choir[0], 'spear', t, 1); upright(IS.choir[0].userData.spear, IS.choir[0], 0.08); IS.choir[0].userData.setFace(PAINT);
      mv(u, V(6.4, 1.65, -17.2), V(6.3, 1.6, -17.9), V(6.1, 1.5, -22), V(6.1, 1.5, -22), 48); tag(IS.jack, 'Jack', BAD); chat(wt(140), gray('Ein Geschenk für das Biest')); }
    if (id === 'flies') { mv(u, V(6.75, 1.35, -19.9), V(6.6, 1.42, -20.35), V(6, 1.98, -22), V(6, 1.98, -22), 44);
      tip(wt(156), 'pig', 'Herr der Fliegen', BAD, [gray('Hebräisch: Beelzebub'), gray('ein Name für den Teufel')]); }
    if (id === 'simon') { put(IS.simon, 6.0, 0, -19.9, Math.PI + 0.1); pose4(IS.simon, 'kneel', t); IS.simon.userData.head.rotation.x = -0.3;
      mv(u, V(7.1, 1.75, -24.9), V(7.0, 1.7, -24.4), V(6.0, 1.1, -19.9), V(6.0, 1.1, -19.9), 48); tag(IS.simon, 'Simon', ALLY);
      say(wt(166), 'Simon', ALLY, 'Das Biest sind wir selbst.'); } }
  if (id === 'storm' || id === 'gone') { mode = 'night'; IS.sigFire.visible = IS.sigSmoke.visible = false; IS.dance.visible = true;
    if (id === 'storm') { const ring = [IS.jack, ...IS.choir, IS.lit[0], IS.lit[1]];
      ring.forEach((p, i) => { const a = i / ring.length * Math.PI * 2 + t * 0.7; put(p, -8 + Math.cos(a) * 2.6, 0, 0.5 + Math.sin(a) * 2.2, Math.atan2(Math.cos(a), -Math.sin(a)) * 0.0 + (Math.sin(a) > 0 ? 0.3 : Math.PI - 0.3) * 0 + 0.2 * Math.sin(a)); pose4(p, 'dance', t, i); if (i < 5) p.userData.setFace(PAINT); });
      IS.jSpear.visible = true; upright(IS.jSpear, IS.jack, 0.4); IS.choir.forEach(p => { p.userData.spear.visible = true; upright(p.userData.spear, p, 0.35); });
      const k = smoother(u); put(IS.simon, -11.4, 0, lerp(-8.5, -5.2, k), 0.3); pose4(IS.simon, k < 0.98 ? 'walk' : 'idle', t);
      mv(u, V(-6.2, 3.1, 9.0), V(-6.5, 2.9, 8.1), V(-8.4, 1.0, -1.8), V(-8.4, 1.0, -1.8), 50); tag(IS.simon, 'Simon', ALLY); }
    else { mv(u, V(-6.8, 0.7, 5.2), V(-6.9, 0.72, 4.7), V(-8.2, 0.6, -2), V(-8.2, 0.65, -2), 48); chat(wt(186) - 0.05, '<span style="color:#ffffff">Simon ist gestorben</span>'); } }
  if (id === 'rock') { IS.sigFire.visible = IS.sigSmoke.visible = false;
    if (t < wt(194)) { put(IS.piggy, -52, 6, 1.4, 0.1); pose4(IS.piggy, 'hold', t); IS.piggy.userData.setFace({ sad: false }); IS.pConch.visible = t < wt(189); tag(IS.piggy, 'Piggy', ALLY); }
    if (t >= wt(189) - 0.02 && t < wt(189) + 1.2) { IS.burstConch.position.set(-52.25, 7.85, 1.5); updateBurst(IS.burstConch, t - wt(189), 4, 1.2); }
    mv(u, V(-47.0, 7.9, 6.2), V(-47.3, 7.7, 5.6), V(-52, 7.0, 1.3), V(-52, 7.0, 1.3), 50);
    chat(wt(189), red('Die Muschel ist zerbrochen')); chat(wt(194) - 0.05, '<span style="color:#ffffff">Piggy wurde von einem Felsen getroffen</span>'); }
  if (id === 'hunt') { IS.sigFire.visible = IS.sigSmoke.visible = false; const zR = lerp(-46, -38, u);
    put(IS.ralph, -30, 0, zR, 0.05); pose4(IS.ralph, 'run', t); IS.ralph.userData.setFace({ sad: true });
    [[IS.jack, -30.8, -4.2], [IS.choir[0], -28.9, -5.4], [IS.choir[1], -31.4, -6.6]].forEach(([p, x, dz], i) => { put(p, x, 0, zR + dz, 0); pose4(p, 'run', t, i + 1); p.userData.setFace(PAINT); });
    IS.jSpear.visible = true; IS.jack.userData.armR.rotation.x = -2.6; upright(IS.jSpear, IS.jack, 0.6);
    mv(u, V(-29.3, 1.75, zR + 5.4), V(-29.3, 1.75, zR + 5.0), V(-30, 1.35, zR - 1.2), V(-30, 1.35, zR - 1.2), 50); tag(IS.ralph, 'Ralph', HERO); tag(IS.jack, 'Jack', BAD); }
  if (id === 'burn') { mode = 'burn'; IS.burn.visible = true; IS.sigFire.visible = false; IS.warship.visible = true;
    const k = smoother((t - wt(210) + 0.6) / 2.8); IS.warship.position.set(lerp(70, 30, k), -0.3, 30); IS.warship.rotation.y = 0;
    mv(u, V(26, 7.5, 66), V(24, 7.0, 61), V(0, 9, -25), V(1, 9, -25), 50); if (t >= wt(212)) ui.tags.push([V(IS.warship.position.x, 14, 30), 'Kriegsschiff', WHITE]); }
  if (id === 'officer' || id === 'cry') { mode = 'burn'; IS.burn.visible = true; IS.sigFire.visible = false;
    if (id === 'officer') { put(IS.officer, 3.3, 0, 0.6, -0.95); pose4(IS.officer, 'hips', t); IS.officer.userData.setFace({ smile: true });
      put(IS.ralph, 1.4, 0, 0.4, 0.65); pose4(IS.ralph, 'sadidle', t); IS.ralph.userData.setFace({ sad: true });
      put(IS.jack, 0.3, 0, -0.7, 0.6); pose4(IS.jack, 'spear', t, 1); IS.jSpear.visible = true; upright(IS.jSpear, IS.jack, 0.08); IS.jack.userData.setFace({ paint: true, sad: true });
      put(IS.lit[0], 2.0, 0, -0.9, 0.4); pose4(IS.lit[0], 'sadidle', t, 2); put(IS.choir[0], -0.9, 0, -1.4, 0.7); pose4(IS.choir[0], 'sadidle', t, 3); IS.choir[0].userData.setFace({ paint: true });
      IS.boat.visible = true; IS.boat.position.set(6.5, -0.15, 6.5); IS.boat.rotation.y = 0.4;
      mv(u, V(2.4, 1.85, 6.6), V(2.3, 1.8, 5.8), V(2.2, 1.3, -0.2), V(2.2, 1.3, -0.2), 50); tag(IS.officer, 'Offizier', WHITE); tag(IS.ralph, 'Ralph', HERO); tag(IS.jack, 'Jack', BAD);
      say(wt(222), 'Offizier', WHITE, 'Na, Jungs, Spaß gehabt?'); }
    else { put(IS.ralph, 1.4, 0, 0.4, 0.35); pose4(IS.ralph, 'cry', t); IS.ralph.userData.setFace({ sad: true, cry: true });
      mv(u, V(2.0, 1.75, 3.6), V(1.95, 1.7, 3.0), V(1.4, 1.45, 0.4), V(1.4, 1.45, 0.4), 46); tag(IS.ralph, 'Ralph', HERO); eff(wt(232), 'Unschuld', 'verloren', BAD); } }
  if (id === 'sign') { mode = 'golden'; IS.sign.visible = true; if (!signDrawn) { drawSign(); signDrawn = true; } mv(u, V(44, 3.5, 13.5), V(44, 3.6, 12.0), V(44, 0.5, -1), V(44, 0.6, -1), 46); }

  // Animationen
  IS.sigFire.userData.update(ta, sigK); if (IS.sigSmoke.visible) { IS.sigSmoke.userData.update(ta); IS.sigSmoke.scale.setScalar(Math.max(0.01, sigK)); }
  if (IS.wrSmoke.visible) IS.wrSmoke.userData.update(t); if (IS.camp.visible) IS.camp.userData.update(t); if (IS.hookFire.visible) IS.hookFire.userData.update(ta); if (IS.dance.visible) IS.dance.userData.update(t, id === 'gone' ? 0.3 : 1.2);
  if (IS.burn.visible) { IS.burnFires.forEach(f => f.userData.update(t)); IS.burnSmoke.forEach(s => s.userData.update(t)); }
  if (IS.stake.visible) IS.stake.userData.flies.userData.update(ta);
  const exp = setMode(mode, lastTarget);
  camera.updateProjectionMatrix(); renderer.toneMappingExposure = exp;
  rp.scene = isl; composer.render(); isl.updateMatrixWorld();
  drawUI(t, ui);
}

// ---------- UI ----------
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1 }; }
const ICONS = {
  conch: '<rect x="1" y="3" width="5" height="3" fill="#f2dcc8"/><rect x="2" y="4" width="3" height="1" fill="#f08aa0"/><rect x="6" y="2" width="1" height="2" fill="#e8c8a8"/><rect x="0" y="4" width="1" height="1" fill="#d8b090"/><rect x="2" y="6" width="3" height="1" fill="#d8b090"/>',
  glasses: '<rect x="0" y="3" width="3" height="3" fill="#1a1a1a"/><rect x="5" y="3" width="3" height="3" fill="#1a1a1a"/><rect x="1" y="4" width="1" height="1" fill="#cfe8ff"/><rect x="6" y="4" width="1" height="1" fill="#cfe8ff"/><rect x="3" y="3" width="2" height="1" fill="#1a1a1a"/><rect x="2" y="1" width="1" height="1" fill="#ffd23f"/><rect x="6" y="1" width="1" height="1" fill="#ff8a1a"/>',
  pig: '<rect x="1" y="1" width="6" height="6" fill="#e89a9a"/><rect x="2" y="3" width="1" height="1" fill="#1a1010"/><rect x="5" y="3" width="1" height="1" fill="#1a1010"/><rect x="3" y="4" width="2" height="2" fill="#d88080"/><rect x="0" y="0" width="1" height="1" fill="#111"/><rect x="7" y="1" width="1" height="1" fill="#111"/><rect x="6" y="7" width="1" height="1" fill="#111"/>',
};
function drawUI(t, ui) {
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && t > cur[2] + 1.2) cur = null;
  if (cur) { const txt = cur[0];
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
