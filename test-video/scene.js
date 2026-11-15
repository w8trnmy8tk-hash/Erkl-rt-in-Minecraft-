import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920, FPS = 30;
const RES = 0.75; // interne 3D-Auflösung (810x1440)

// ---------- Hilfen ----------
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }
function shade(c, f) { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; const k = v => Math.max(0, Math.min(255, Math.round(v * f))); return (k(r) << 16) | (k(g) << 8) | k(b); }

function tex(w, h, draw, seed = 1) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); draw(ctx, rng(seed), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function px(ctx, x, y, c) { ctx.fillStyle = typeof c === 'number' ? hex(c) : c; ctx.fillRect(x, y, 1, 1); }
function noiseFill(ctx, r, w, h, base, amt = 0.12) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(ctx, x, y, shade(base, 1 - amt + r() * amt * 2)); }

// eigene Pixel-Texturen (16x16 = 1 Block)
const T = {
  planks: tex(16, 16, (c, r) => { const cols = [0x7a5233, 0x6e4a2e, 0x84593a, 0x734d30];
    for (let row = 0; row < 4; row++) { const b = cols[row]; for (let y = row * 4; y < row * 4 + 4; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(b, 0.9 + r() * 0.2));
      for (let x = 0; x < 16; x++) px(c, x, row * 4 + 3, shade(b, 0.62)); const s = (row * 7 + 3) % 16; for (let y = row * 4; y < row * 4 + 3; y++) px(c, s, y, shade(b, 0.7)); } }, 2),
  darkwood: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x4a3020, 0.15); for (let x = 0; x < 16; x++) { px(c, x, 0, 0x2e1d12); px(c, x, 15, 0x2e1d12); } }, 3),
  wallpaper: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x8f9a78, 0.06);
    const p = [[8, 2], [7, 3], [9, 3], [6, 4], [10, 4], [7, 5], [9, 5], [8, 6], [0, 10], [15, 10], [1, 9], [1, 11], [14, 9], [14, 11], [0, 8], [0, 12]];
    p.forEach(([x, y]) => px(c, x, y, 0x6d7a5c)); px(c, 8, 4, 0xa86b4e); px(c, 0, 10, 0xa86b4e); }, 4),
  plaster: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xd8c7a0, 0.07), 5),
  plaster2: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xc9a873, 0.07), 6),
  plaster3: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe2dccb, 0.06), 7),
  roof: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const edge = y % 4 === 3 || ((x + (Math.floor(y / 4) % 2) * 4) % 8 === 0); px(c, x, y, shade(edge ? 0x7b2a1a : 0xb5472a, 0.88 + r() * 0.22)); } }, 8),
  slate: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const edge = y % 4 === 3 || ((x + (Math.floor(y / 4) % 2) * 4) % 8 === 0); px(c, x, y, shade(edge ? 0x23262c : 0x3b4048, 0.85 + r() * 0.3)); } }, 9),
  stone: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x7b7570, 0.16); for (let i = 0; i < 22; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x5a5550); }, 10),
  cobble: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const e = (x % 8 === 0) || (y % 8 === 0 && (x + 4) % 16 > 0); px(c, x, y, shade(e ? 0x4f4a45 : 0x8b847b, 0.85 + r() * 0.3)); } }, 11),
  sheet: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xe8e1d0, 0.05), 12),
  blanket: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const ch = ((x >> 2) + (y >> 2)) % 2; px(c, x, y, shade(ch ? 0x8e2a26 : 0x7a221f, 0.9 + r() * 0.18)); } for (let x = 0; x < 16; x++) px(c, x, 1, 0xc9a24a); }, 13),
  shell: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x4a2a14, 0.18); for (let i = 0; i < 14; i++) px(c, Math.floor(r() * 16), Math.floor(r() * 16), 0x8a5a2a); }, 14),
  belly: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(c, x, y, shade(y % 4 === 0 ? 0x6a4420 : 0xb7823f, 0.88 + r() * 0.22)); }, 15),
  leg: tex(4, 4, (c, r) => noiseFill(c, r, 4, 4, 0x3a2414, 0.2), 16),
  grass: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0x5b7a3a, 0.16), 17),
  water: tex(16, 16, (c, r) => { noiseFill(c, r, 16, 16, 0x36507a, 0.1); for (let i = 0; i < 8; i++) { const y = Math.floor(r() * 16), x = Math.floor(r() * 12); for (let k = 0; k < 4; k++) px(c, x + k, y, 0x5a78a3); } }, 18),
  window: tex(16, 16, (c, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const f = x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || x === 8 || y === 7 || y === 8; px(c, x, y, f ? 0x3d2a1a : shade(0xffc06a, 0.9 + r() * 0.2)); } }, 19),
  pillow: tex(16, 16, (c, r) => noiseFill(c, r, 16, 16, 0xf3eee2, 0.04), 20),
};

// Box mit Welt-UVs (1 Textur-Kachel = 1 Block)
function box(w, h, d, mat, x = 0, y = 0, z = 0, opts = {}) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const s = opts.uvScale ?? 1;
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * s, uv.getY(k) * dims[f][1] * s); }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; return m;
}
const M = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: o.rough ?? 0.92, metalness: 0, ...o });

// ---------- Renderer ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(RES); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;

// =====================================================================
// SET A: Gregors Zimmer (Morgendämmerung, kalt/blau draußen, warme Lampe)
// =====================================================================
const room = new THREE.Scene();
room.background = new THREE.Color(0x0d0f16);
room.fog = new THREE.Fog(0x1b2030, 12, 26);
{
  const floor = M(T.planks), wall = M(T.wallpaper), dw = M(T.darkwood);
  room.add(box(8, 0.2, 9, floor, 0, -0.1, 0));
  // Wände: hinten (z=-4.5) mit Fenster-Loch, links (x=-4) mit Bild, rechts (x=4)
  const WH = 4.2;
  // Rückwand mit Fenster (Loch x 0.4..2.2, y 1.2..3.2)
  room.add(box(4.4, WH, 0.3, wall, -1.8, WH / 2, -4.6));
  room.add(box(1.8, WH, 0.3, wall, 3.1, WH / 2, -4.6));
  room.add(box(1.8, 1.2, 0.3, wall, 1.3, 0.6, -4.6));
  room.add(box(1.8, 1.0, 0.3, wall, 1.3, 3.7, -4.6));
  room.add(box(0.3, WH, 9.4, wall, -4.15, WH / 2, 0));
  room.add(box(0.3, WH, 9.4, wall, 4.15, WH / 2, 0));
  room.add(box(8.6, 0.3, 9.4, dw, 0, WH + 0.15, 0)); // Decke
  // Holzleiste unten
  room.add(box(7.99, 0.5, 0.05, dw, 0, 0.25, -4.43)); room.add(box(0.05, 0.5, 8.9, dw, -3.98, 0.25, 0)); room.add(box(0.05, 0.5, 8.9, dw, 3.98, 0.25, 0));
  // Fensterkreuz + Glas
  const fr = M(T.darkwood);
  room.add(box(1.9, 0.12, 0.2, fr, 1.3, 1.2, -4.45)); room.add(box(1.9, 0.12, 0.2, fr, 1.3, 3.2, -4.45));
  room.add(box(0.12, 2.0, 0.2, fr, 0.4, 2.2, -4.45)); room.add(box(0.12, 2.0, 0.2, fr, 2.2, 2.2, -4.45));
  room.add(box(0.1, 2.0, 0.16, fr, 1.3, 2.2, -4.45)); room.add(box(1.8, 0.1, 0.16, fr, 1.3, 2.2, -4.45));
  // Himmel hinter dem Fenster (regnerischer Morgen)
  const skyM = new THREE.MeshBasicMaterial({ color: 0x7f97c4 });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), skyM); sky.position.set(1.3, 2.2, -6); room.add(sky);
  // Fensterbank
  room.add(box(2.2, 0.12, 0.5, dw, 1.3, 1.16, -4.3));
  // Kaltes Morgenlicht durchs Fenster
  const sun = new THREE.DirectionalLight(0xb4c8ff, 5.0); sun.position.set(2.6, 6.5, -11); sun.target.position.set(0.2, 0, 0.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); room.add(sun, sun.target);
  room.add(new THREE.HemisphereLight(0x8fa0cc, 0x3a2618, 1.1));
  const fill = new THREE.DirectionalLight(0xdfe4ff, 1.3); fill.position.set(3, 3.5, 4); fill.target.position.set(-1.6, 1, -2.8); room.add(fill, fill.target);
  const rim = new THREE.PointLight(0xffa860, 4, 4, 1.5); rim.position.set(-0.4, 1.9, -1.4); room.add(rim);
  // Bett (2 breit, 2.8 lang), Kopfende an der Rückwand, links vom Fenster
  const bx = -1.6, bz = -2.8;
  room.add(box(2.3, 1.3, 0.2, dw, bx, 0.65, bz - 1.45)); // Kopfteil
  room.add(box(2.3, 0.8, 0.2, dw, bx, 0.4, bz + 1.45));  // Fußteil
  room.add(box(0.15, 0.45, 2.8, dw, bx - 1.1, 0.42, bz)); room.add(box(0.15, 0.45, 2.8, dw, bx + 1.1, 0.42, bz));
  room.add(box(2.1, 0.3, 2.75, M(T.sheet), bx, 0.6, bz));
  room.add(box(1.5, 0.22, 0.6, M(T.pillow), bx, 0.85, bz - 1.0));
  // Nachttisch + Lampe + Wecker
  const nx = 0.05, nz = -3.9;
  room.add(box(0.8, 0.9, 0.7, dw, nx, 0.45, nz));
  room.add(box(0.12, 0.35, 0.12, M(T.darkwood), nx - 0.15, 1.08, nz));
  const shadeM = new THREE.MeshStandardMaterial({ color: 0xffd89a, emissive: 0xffa94d, emissiveIntensity: 2.2 });
  room.add(box(0.42, 0.3, 0.42, shadeM, nx - 0.15, 1.38, nz, { cast: false }));
  const lamp = new THREE.PointLight(0xff9c4a, 7, 7, 1.6); lamp.position.set(nx - 0.15, 1.3, nz + 0.25); room.add(lamp);
  // Wecker (eigene Uhr-Textur, Zeiger animiert)
  const clockFace = document.createElement('canvas'); clockFace.width = clockFace.height = 64;
  const clockTex = new THREE.CanvasTexture(clockFace); clockTex.magFilter = THREE.NearestFilter; clockTex.colorSpace = THREE.SRGBColorSpace;
  window.drawClock = (min, sec) => {
    const c = clockFace.getContext('2d'); c.imageSmoothingEnabled = false;
    c.fillStyle = '#2b1a10'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#b9ab8c'; c.fillRect(6, 6, 52, 52);
    c.fillStyle = '#3a2a20'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(Math.round(32 + Math.sin(a) * 21) - 1, Math.round(32 - Math.cos(a) * 21) - 1, 3, 3); }
    const hand = (a, len, w, col) => { c.fillStyle = col; for (let r = 0; r < len; r += 1) c.fillRect(Math.round(32 + Math.sin(a) * r) - (w >> 1), Math.round(32 - Math.cos(a) * r) - (w >> 1), w, w); };
    hand((6 + min / 60) / 12 * Math.PI * 2, 12, 4, '#1b120c'); hand(min / 60 * Math.PI * 2, 19, 3, '#1b120c'); hand(sec / 60 * Math.PI * 2, 20, 1, '#b2241c');
    c.fillStyle = '#b2241c'; c.fillRect(30, 30, 4, 4); clockTex.needsUpdate = true;
  };
  window.drawClock(30, 0);
  const clockBody = M(T.darkwood);
  room.add(box(0.36, 0.38, 0.16, clockBody, nx + 0.18, 1.09, nz + 0.05));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.5, emissive: 0xffffff, emissiveMap: clockTex, emissiveIntensity: 0.0 }));
  face.position.set(nx + 0.18, 1.09, nz + 0.135); room.add(face);
  room.add(box(0.08, 0.08, 0.08, M(T.darkwood), nx + 0.06, 0.88, nz + 0.05)); room.add(box(0.08, 0.08, 0.08, M(T.darkwood), nx + 0.3, 0.88, nz + 0.05));
  // Bild an der linken Wand: Dame mit Pelz (eigene Pixelkunst)
  const pic = tex(10, 12, (c) => { c.fillStyle = '#6b4a2a'; c.fillRect(0, 0, 10, 12); c.fillStyle = '#d9cfb8'; c.fillRect(1, 1, 8, 10);
    c.fillStyle = '#5a3a24'; c.fillRect(3, 2, 4, 2); c.fillStyle = '#e0b38f'; c.fillRect(3, 3, 4, 3); c.fillStyle = '#3a2a20'; c.fillRect(4, 4, 1, 1); c.fillRect(6, 4, 1, 1);
    c.fillStyle = '#7b5a3c'; c.fillRect(2, 6, 6, 2); c.fillStyle = '#2f3f5a'; c.fillRect(3, 8, 4, 3); c.fillStyle = '#7b5a3c'; c.fillRect(2, 8, 2, 2); c.fillRect(6, 8, 2, 2); }, 21);
  const picM = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.08), M(pic, { rough: 0.7 })); picM.rotation.y = Math.PI / 2; picM.position.set(-3.97, 2.5, -1.2); room.add(picM);
  // Schrank rechts
  room.add(box(1.6, 3.0, 0.8, dw, 3.0, 1.5, -1.5));
  room.add(box(0.06, 2.6, 0.02, M(T.leg), 3.0, 1.5, -1.09, { cast: false }));
  // Tür vorne rechts (Lichtspalt)
  room.add(box(1.2, 2.4, 0.15, dw, 2.5, 1.2, 4.5));
  room.add(box(0.06, 2.3, 0.06, new THREE.MeshBasicMaterial({ color: 0xffb066 }), 1.92, 1.2, 4.42, { cast: false }));
  // Staubpartikel im Fensterlicht
  const dust = new THREE.Group(); const dr = rng(77); const dm = new THREE.MeshBasicMaterial({ color: 0xc8d6ff, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 60; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), dm); d.userData = { x: -1 + dr() * 4, y: 0.3 + dr() * 3, z: -4.2 + dr() * 5, p: dr() * 6 }; dust.add(d); }
  room.add(dust); room.userData.dust = dust; room.userData.bed = { bx, bz }; room.userData.clock = { nx, nz };
}

// --- Gregor als Mensch (Minecraft-Proportionen), liegend im Bett ---
function faceTex(kind) {
  return tex(8, 8, (c) => {
    const skin = '#d9a37e', hair = '#4a2f1d';
    c.fillStyle = skin; c.fillRect(0, 0, 8, 8); c.fillStyle = hair; c.fillRect(0, 0, 8, 2); c.fillRect(0, 2, 1, 2); c.fillRect(7, 2, 1, 2);
    c.fillStyle = '#3a2416'; c.fillRect(1, 3, 2, 1); c.fillRect(5, 3, 2, 1); // Augenbrauen hoch = erschrocken
    c.fillStyle = '#ffffff'; c.fillRect(1, 4, 2, 1); c.fillRect(5, 4, 2, 1);
    c.fillStyle = '#2a4a7a'; c.fillRect(2, 4, 1, 1); c.fillRect(5, 4, 1, 1);
    c.fillStyle = '#b07a5a'; c.fillRect(3, 5, 2, 1);
    c.fillStyle = '#5a2a20'; c.fillRect(3, 6, 2, 1);
  }, 31);
}
const gregorHuman = new THREE.Group();
{
  const skin = M(tex(4, 4, (c, r) => noiseFill(c, r, 4, 4, 0xd9a37e, 0.05), 32));
  const hair = M(tex(4, 4, (c, r) => noiseFill(c, r, 4, 4, 0x4a2f1d, 0.12), 33));
  const head = new THREE.Group();
  const mats = [skin, skin, hair, skin, M(faceTex()), hair]; // +x,-x,+y,-y,+z(Gesicht),-z
  const hg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mats); hg.castShadow = true; head.add(hg);
  head.add(box(0.52, 0.12, 0.52, hair, 0, 0.2, 0));
  gregorHuman.add(head); gregorHuman.userData.head = head;
  const { bx, bz } = room.userData.bed;
  head.position.set(bx, 1.22, bz - 0.95); head.rotation.x = -Math.PI / 2 + 0.25; // Gesicht nach oben/vorn
  // Körper unter der Decke (Wölbung)
  gregorHuman.add(box(0.9, 0.35, 1.9, M(T.blanket), bx, 0.92, bz + 0.15));
  gregorHuman.add(box(2.1, 0.1, 2.05, M(T.blanket), bx, 0.78, bz + 0.35));
  room.add(gregorHuman);
}

// --- Gregor als Käfer (stehend auf dem Bett, klar lesbare Silhouette) ---
const beetle = new THREE.Group();
{
  const chit = (c, seed, r2 = 0.25, hi = 0) => new THREE.MeshStandardMaterial({ map: tex(16, 16, (cx, r) => { noiseFill(cx, r, 16, 16, c, 0.05); if (hi) { for (let i = 0; i < 16; i++) px(cx, i, 2, shade(c, 1.25)); for (let i = 0; i < 4; i++) px(cx, Math.floor(r() * 16), 5 + Math.floor(r() * 10), shade(c, 0.8)); } }, seed), roughness: r2, metalness: 0.15 });
  const ely = chit(0x6b3a1a, 61, 0.18, 1), pro = chit(0x55301a, 62, 0.2, 1), dark = chit(0x2a160a, 63, 0.3), legM = chit(0x3a2010, 64, 0.3), belly = chit(0x7a4a26, 65, 0.4);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05, metalness: 0.5 });
  const { bx, bz } = room.userData.bed;
  const root = new THREE.Group(); beetle.add(root); root.position.set(bx, 0.98, bz + 0.05); root.rotation.y = Math.PI + 0.5;
  const b = new THREE.Group(); root.add(b);
  // Hinterleib / Flügeldecken (gewölbt in 3 Stufen) + Mittelnaht
  b.add(box(1.3, 0.34, 1.25, belly, 0, 0.12, 0.3, { uvScale: 3 }));
  b.add(box(1.38, 0.3, 1.32, ely, 0, 0.36, 0.3, { uvScale: 3 }));
  b.add(box(1.12, 0.14, 1.18, ely, 0, 0.58, 0.32, { uvScale: 3 }));
  b.add(box(0.7, 0.07, 1.0, ely, 0, 0.68, 0.34, { uvScale: 3 }));
  b.add(box(0.05, 0.05, 1.3, dark, 0, 0.72, 0.32, { cast: false }));
  b.add(box(0.05, 0.3, 0.05, dark, 0, 0.55, 0.97, { cast: false }));
  // Halsschild
  b.add(box(1.0, 0.42, 0.5, pro, 0, 0.32, -0.55, { uvScale: 3 }));
  b.add(box(0.8, 0.1, 0.42, pro, 0, 0.56, -0.55, { uvScale: 3 }));
  // Kopf
  b.add(box(0.62, 0.34, 0.36, pro, 0, 0.24, -0.97, { uvScale: 3 }));
  for (const sx of [-1, 1]) {
    b.add(box(0.17, 0.17, 0.17, eyeM, sx * 0.3, 0.3, -1.05));
    b.add(box(0.05, 0.05, 0.05, new THREE.MeshBasicMaterial({ color: 0xffffff }), sx * 0.3 + 0.03, 0.35, -1.14, { cast: false }));
    const m = new THREE.Group(); m.position.set(sx * 0.14, 0.12, -1.16); m.add(box(0.08, 0.08, 0.2, dark, 0, 0, -0.08)); m.add(box(0.08, 0.08, 0.1, dark, -sx * 0.06, 0, -0.18)); b.add(m);
  }
  // Fühler
  const ants = [];
  for (const sx of [-1, 1]) { const a = new THREE.Group(); a.position.set(sx * 0.2, 0.38, -1.12);
    a.add(box(0.04, 0.04, 0.42, legM, 0, 0, -0.2)); const a2 = new THREE.Group(); a2.position.set(0, 0, -0.4); a2.add(box(0.035, 0.035, 0.42, legM, 0, 0, -0.2)); a2.add(box(0.07, 0.07, 0.1, legM, 0, 0, -0.42)); a2.rotation.set(0.5, -sx * 0.3, 0); a.add(a2);
    a.rotation.set(-0.7, sx * 0.6, 0); b.add(a); ants.push(a); }
  // 6 Beine seitlich, Knie hoch, Fuß auf der Decke
  const legs = [];
  for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.6, 0.12, -0.45 + i * 0.48); b.add(hip);
    const femur = new THREE.Group(); hip.add(femur); femur.rotation.z = -sx * 0.75; femur.add(box(0.08, 0.5, 0.08, legM, 0, 0.24, 0));
    const knee = new THREE.Group(); knee.position.set(0, 0.48, 0); femur.add(knee); knee.rotation.z = -sx * 2.2;
    knee.add(box(0.06, 0.62, 0.06, legM, 0, 0.3, 0));
    for (let k = 0; k < 3; k++) knee.add(box(0.1, 0.025, 0.025, legM, sx * 0.04, 0.15 + k * 0.14, 0, { cast: false }));
    legs.push({ hip, femur, knee, s: sx, i, ph: i * 1.9 + (sx > 0 ? 1.1 : 0) });
  }
  beetle.userData = { b, root, legs, ants };
  room.add(beetle);
}

// Partikel "Verwandlung" (Würfelwolke)
const poof = new THREE.Group();
{ const pr = rng(5); const pm = [0xf2f2f2, 0xd9d9d9, 0xbfbfbf].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true }));
  for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), pm[i % 3]);
    const a = pr() * Math.PI * 2, e = pr() * 1.2; m.userData = { v: V(Math.cos(a) * (0.5 + pr()), 0.6 + pr() * 1.4, Math.sin(a) * (0.5 + pr())), s: 0.6 + pr() * 0.9, r: pr() * 3 }; poof.add(m); }
  const { bx, bz } = room.userData.bed; poof.position.set(bx, 1.15, bz); room.add(poof); }

// =====================================================================
// SET B: Prag, 1912 – Morgendämmerung über den Dächern
// =====================================================================
const prague = new THREE.Scene();
{
  // Himmels-Kugel mit Verlauf
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vP; void main(){ float h = vP.y; vec3 top=vec3(0.16,0.20,0.42); vec3 mid=vec3(0.78,0.46,0.48); vec3 hor=vec3(1.0,0.66,0.38);
      vec3 c = mix(hor, mid, smoothstep(-0.02,0.12,h)); c = mix(c, top, smoothstep(0.12,0.55,h));
      float sun = pow(max(dot(normalize(vP), normalize(vec3(0.15,0.06,-1.))),0.),220.); c += vec3(1.,0.85,0.6)*sun*1.2;
      float glow = pow(max(dot(normalize(vP), normalize(vec3(0.15,0.06,-1.))),0.),6.); c += vec3(0.5,0.25,0.1)*glow*0.3;
      gl_FragColor = vec4(c,1.); }` });
  prague.add(new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat));
  prague.fog = new THREE.Fog(0xc4857a, 70, 260);
  // Blockige Wolken
  const cl = new THREE.MeshBasicMaterial({ color: 0xf7c9b8, transparent: true, opacity: 0.85, fog: false }); const cr = rng(44);
  for (let i = 0; i < 26; i++) { const c = box(6 + cr() * 14, 1.2, 4 + cr() * 8, cl, -80 + cr() * 160, 38 + cr() * 6, -150 + cr() * 140, { cast: false }); prague.add(c); }
  // Boden + Moldau
  prague.add(box(400, 1, 400, M(T.cobble), 0, -0.5, 0, { cast: false }));
  const water = box(400, 0.2, 14, M(T.water, { rough: 0.15, metalness: 0.2 }), 0, 0.05, -70, { cast: false }); prague.add(water);
  // Häuser
  const walls = [M(T.plaster), M(T.plaster2), M(T.plaster3)], roof = M(T.roof), win = new THREE.MeshStandardMaterial({ map: T.window, emissive: 0xffa040, emissiveMap: T.window, emissiveIntensity: 1.4 });
  const hr = rng(9);
  function house(x, z, w, d, h) {
    const g = new THREE.Group(); const wm = walls[Math.floor(hr() * 3)];
    g.add(box(w, h, d, wm, 0, h / 2, 0));
    // Treppendach (Minecraft-Stufen)
    const steps = Math.ceil(d / 2);
    for (let s = 0; s < steps; s++) g.add(box(w + 0.4, 1, d + 0.4 - s * 2, roof, 0, h + 0.5 + s, 0));
    // Fenster (einige leuchten)
    for (let fy = 1.5; fy < h - 0.5; fy += 2.2) for (let fx = -w / 2 + 1; fx <= w / 2 - 1; fx += 2) {
      if (hr() < 0.35) { const m = box(0.9, 1.1, 0.1, win, fx, fy, d / 2 + 0.03, { cast: false }); g.add(m); }
      else g.add(box(0.9, 1.1, 0.1, M(T.darkwood), fx, fy, d / 2 + 0.03, { cast: false })); }
    g.position.set(x, 0, z); return g;
  }
  for (let zi = 0; zi < 9; zi++) for (let xi = -6; xi <= 6; xi++) {
    if (Math.abs(xi) < 1 && zi < 2) continue; // Gasse vorn
    const w = 5 + Math.floor(hr() * 3), d = 6 + Math.floor(hr() * 3) * 2, h = 6 + Math.floor(hr() * 4) * 1.5;
    prague.add(house(xi * 7.2 + hr() * 0.6, -zi * 9 + 6, w, d, h));
  }
  // Teyn-artige Kirche mit zwei Türmen (eigene Interpretation)
  const sl = M(T.slate, { rough: 0.8 }), st = M(T.stone);
  const church = new THREE.Group(); church.position.set(4, 0, -44);
  church.add(box(14, 16, 20, st, 0, 8, 8));
  for (let s = 0; s < 6; s++) church.add(box(14.6 - s * 2.4, 2, 20.6, sl, 0, 17 + s * 2, 8));
  for (const tx of [-4.5, 4.5]) {
    church.add(box(5, 30, 5, st, tx, 15, 0));
    for (let s = 0; s < 9; s++) church.add(box(5.6 - s * 0.6, 2.2, 5.6 - s * 0.6, sl, tx, 31 + s * 2.2, 0));
    church.add(box(0.4, 4, 0.4, new THREE.MeshStandardMaterial({ color: 0xd4a83a, metalness: 0.8, roughness: 0.3 }), tx, 52, 0));
    for (const cx of [-2.4, 2.4]) for (const cz of [-2.4, 2.4]) { church.add(box(1, 6, 1, st, tx + cx, 32, cz)); church.add(box(1.2, 3, 1.2, sl, tx + cx, 36.5, cz)); }
    church.add(box(1.4, 3.2, 0.2, win, tx, 22, 2.6, { cast: false }));
  }
  prague.add(church);
  // Licht: tiefe, warme Morgensonne von hinten (Gegenlicht) + kühler Himmel
  const sun = new THREE.DirectionalLight(0xffb27a, 3.6); sun.position.set(60, 30, -90); sun.target.position.set(0, 0, -10);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4; sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 260 }); prague.add(sun, sun.target);
  prague.add(new THREE.HemisphereLight(0x9aabdd, 0x6a4a3a, 1.7));
  // Vögel
  const birds = new THREE.Group(); const bm = new THREE.MeshBasicMaterial({ color: 0x2a1c22 });
  for (let i = 0; i < 7; i++) { const g = new THREE.Group(); g.add(box(0.5, 0.08, 0.15, bm, -0.25, 0, 0, { cast: false })); g.add(box(0.5, 0.08, 0.15, bm, 0.25, 0, 0, { cast: false })); g.userData.p = i * 1.3; birds.add(g); }
  prague.add(birds); prague.userData.birds = birds;
}

// ---------- Post-Processing ----------
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
const composer = new EffectComposer(renderer);
const rp = new RenderPass(room, camera); composer.addPass(rp);
const bokeh = new BokehPass(room, camera, { focus: 3, aperture: 0.004, maxblur: 0.008 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W * RES, H * RES), 0.35, 0.6, 0.85); composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setPixelRatio(RES); composer.setSize(W, H);

// ---------- Timeline ----------
const words = await (await fetch('words.json')).json();
const DUR = 10.0;
// Shots: [start, end, id]
const SHOTS = [
  [0.00, 2.22, 'hero'],      // ikonisches Bild: Käfer im Bett (wird Loop-Ende)
  [2.22, 4.10, 'prag'],      // Establishing
  [4.10, 5.80, 'human'],     // Gregor wacht auf
  [5.80, 7.03, 'bug'],       // ... als riesiger Käfer (Close-up + Poof)
  [7.03, 8.62, 'clock'],     // größte Sorge? -> Wecker
  [8.62, 9.42, 'top'],       // Er kommt zu spät (Toast)
  [9.42, 10.0, 'loop'],      // "zur Arbeit." über Shot 1 -> nahtloser Loop
];
const HERO_LEN = 2.22, LOOP_LEN = 0.58;

function camSet(p, t) { camera.position.copy(p); camera.lookAt(t); }
function pathCam(a, b, ta, tb, u) { const k = ease(u) * 0.5 + u * 0.5; camSet(a.clone().lerp(b, k), ta.clone().lerp(tb, k)); }

function animateRoom(t) {
  const d = room.userData.dust; d.children.forEach((m, i) => { const u = m.userData; m.position.set(u.x + Math.sin(t * 0.4 + u.p) * 0.15, u.y + Math.sin(t * 0.3 + u.p * 2) * 0.2, u.z); });
  const { legs, ants, b } = beetle.userData;
  legs.forEach(L => { const w = Math.sin(t * 9 + L.ph); L.hip.rotation.set(w * 0.18, 0, 0); L.femur.rotation.z = -L.s * (0.75 + Math.sin(t * 6 + L.ph) * 0.1); });
  ants.forEach((a, i) => { a.rotation.x = -0.7 + Math.sin(t * 4 + i * 2) * 0.22; a.rotation.y = (i ? -1 : 1) * (0.55 + Math.sin(t * 3 + i) * 0.15); });
  b.position.y = Math.sin(t * 2.2) * 0.012; b.rotation.y = Math.sin(t * 1.3) * 0.03;
}

function render(frame) {
  const t = frame / FPS;
  const shot = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
  const u = (t - shot[0]) / (shot[1] - shot[0]); window.__shot = shot[2];
  let scene = room, focus = 3, ap = 0.0;
  beetle.visible = true; gregorHuman.visible = false; poof.visible = false;
  const { bx, bz } = room.userData.bed, { nx, nz } = room.userData.clock;
  window.drawClock(30 + t * 0.05, (Math.floor(t) * 6) % 60 + 12);
  animateRoom(t);

  if (shot[2] === 'hero' || shot[2] === 'loop') {
    // eine durchgehende Kamerafahrt: Loop-Teil (-0.58s..0) + Hero-Teil (0..2.22s)
    const tt = shot[2] === 'hero' ? t : -(DUR - t); // -0.58 .. 0
    const k = (tt + LOOP_LEN) / (HERO_LEN + LOOP_LEN); // 0..1
    camSet(V(lerp(1.5, 0.9, k), lerp(2.2, 1.95, k), lerp(2.6, 1.4, k)), V(lerp(-1.25, -1.4, k), 0.82, lerp(-2.6, -2.75, k)));
    camera.fov = 44; focus = 3.6; ap = 0.002;
  } else if (shot[2] === 'prag') {
    scene = prague; camera.fov = 45;
    pathCam(V(-6, 19, 30), V(-4.5, 18, 21), V(3, 17, -44), V(4, 18, -44), u);
    prague.userData.birds.children.forEach((g, i) => { g.position.set(-14 + i * 2.2 + t * 4, 34 + Math.sin(i * 2) * 2, -8 - i * 1.5); g.children[0].rotation.z = Math.sin(t * 14 + g.userData.p) * 0.5; g.children[1].rotation.z = -g.children[0].rotation.z; });
  } else if (shot[2] === 'human') {
    beetle.visible = false; gregorHuman.visible = true; camera.fov = 38;
    // Gregor öffnet die Augen: leichter Kopf-Ruck beim Wort "auf"
    const h = gregorHuman.userData.head; h.rotation.z = t > 5.16 ? Math.sin((t - 5.16) * 18) * 0.06 * Math.exp(-(t - 5.16) * 4) : 0;
    pathCam(V(bx + 1.0, 2.6, bz + 1.6), V(bx + 0.8, 2.35, bz + 1.05), V(bx, 1.0, bz - 0.7), V(bx, 1.05, bz - 0.8), u);
    focus = 2.4; ap = 0.004;
  } else if (shot[2] === 'bug') {
    camera.fov = 40; poof.visible = true;
    const pt = t - 5.80; poof.children.forEach(m => { const v = m.userData.v; m.position.set(v.x * pt * 1.6, v.y * pt * 1.2 - pt * pt * 0.8, v.z * pt * 1.6); m.rotation.set(m.userData.r + pt * 3, pt * 2, 0); const s = Math.max(0, m.userData.s * (1 - pt / 0.9)); m.scale.setScalar(s); m.material.opacity = Math.max(0, 1 - pt / 0.9); });
    pathCam(V(bx + 1.8, 1.75, bz + 3.0), V(bx + 1.5, 1.62, bz + 2.55), V(bx + 0.3, 0.98, bz + 0.6), V(bx + 0.32, 0.98, bz + 0.7), u);
    focus = 2.2; ap = 0.005;
  } else if (shot[2] === 'clock') {
    camera.fov = 34;
    pathCam(V(nx + 0.5, 1.28, nz + 1.25), V(nx + 0.35, 1.2, nz + 0.85), V(nx + 0.18, 1.08, nz), V(nx + 0.18, 1.09, nz), u);
    focus = 0.85; ap = 0.012;
  } else if (shot[2] === 'top') {
    camera.fov = 42;
    pathCam(V(bx + 1.6, 3.9, bz + 2.4), V(bx + 1.35, 3.6, bz + 2.0), V(bx, 1.0, bz - 0.1), V(bx, 1.0, bz - 0.15), u);
    focus = 3.0; ap = 0.0015;
  }
  camera.updateProjectionMatrix();
  rp.scene = scene; bokeh.scene = scene;
  bokeh.uniforms.focus.value = focus; bokeh.uniforms.aperture.value = ap; bokeh.enabled = ap > 0;
  renderer.toneMappingExposure = scene === prague ? 1.25 : (window.__shot === 'clock' ? 0.95 : 1.35);
  bloom.strength = scene === prague ? 0.2 : 0.3;
  composer.render();
  drawUI(t, shot[2]);
}

// ---------- UI-Layer ----------
const capEl = document.getElementById('cap'), tagsEl = document.getElementById('tags'), chatEl = document.getElementById('chat'), extraEl = document.getElementById('extra');
function project(p) { const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 }; }
function tag(p, text, color) { const s = project(p); if (!s.ok) return ''; return `<div class="tag" style="left:${s.x}px;top:${s.y}px;color:${color}">${text}</div>`; }
const fadeIn = (t, t0, d = 0.08) => Math.max(0, Math.min(1, (t - t0) / d));

function drawUI(t, id) {
  // Untertitel: ein Wort, 2-Frame-Fade grau -> weiß
  let cur = null; for (const w of words) if (t >= w[1] - 0.02) cur = w;
  if (cur && cur[0] === '…') cur = null;
  if (cur) { const f = fadeIn(t, cur[1] - 0.02, 0.07); const g = Math.round(lerp(140, 255, f)); capEl.style.color = `rgb(${g},${g},${g})`; capEl.style.opacity = lerp(0.6, 1, f); capEl.textContent = cur[0]; }
  else capEl.textContent = '';
  const { bx, bz } = room.userData.bed;
  let tags = '', chat = '', extra = '';
  if (id === 'hero' || id === 'loop') tags = tag(V(bx + 0.1, 2.05, bz + 0.05), 'Gregor Samsa', '#ffd23f');
  if (id === 'human') tags = tag(V(bx, 1.62, bz - 0.95), 'Gregor Samsa', '#ffd23f');
  if (id === 'top') tags = tag(V(bx + 0.1, 2.0, bz + 0.1), 'Gregor Samsa', '#ffd23f');
  if (id === 'prag' && t >= 2.30) chat = `<div style="opacity:${fadeIn(t, 2.30)}"><span style="color:#ffd23f">[Info]</span> Prag, 1912</div>`;
  if (id === 'bug' && t >= 6.05) chat = `<div style="opacity:${fadeIn(t, 6.05)}"><span style="color:#ff5555">Gregor Samsa</span> wurde in einen Käfer verwandelt</div>`;
  if (id === 'clock' && t >= 7.46) {
    const o = fadeIn(t, 7.46, 0.1);
    extra = `<div class="tip" style="opacity:${o}"><svg width="64" height="64" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#6b4524"/><rect x="2" y="2" width="4" height="4" fill="#efe6cf"/><rect x="4" y="2" width="1" height="2" fill="#222"/><rect x="4" y="4" width="1" height="1" fill="#b2241c"/><rect x="1" y="7" width="1" height="1" fill="#6b4524"/><rect x="6" y="7" width="1" height="1" fill="#6b4524"/></svg>
      <div><b style="color:#ffaa00">Wecker</b><span style="color:#aaaaaa">Gestellt: 4:00 Uhr</span><br><span style="color:#ff5555">Jetzt: 6:30 Uhr – Zug verpasst</span></div></div>`;
  }
  if (id === 'top') {
    const ts = 8.66; const k = ease(Math.min(1, (t - ts) / 0.18)); const x = lerp(640, 0, k);
    extra = `<div class="toast" style="transform:translateX(${x}px)"><svg width="72" height="72" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="2" width="6" height="5" fill="#7a4a24"/><rect x="2" y="3" width="4" height="3" fill="#3b2414"/><rect x="2" y="1" width="1" height="1" fill="#2a1a0f"/><rect x="5" y="1" width="1" height="1" fill="#2a1a0f"/><rect x="0" y="4" width="1" height="1" fill="#2a1a0f"/><rect x="7" y="4" width="1" height="1" fill="#2a1a0f"/></svg>
      <div><div class="t1">Fortschritt erzielt!</div><div class="t2">Zu spät zur Arbeit</div></div></div>`;
  }
  tagsEl.innerHTML = tags; chatEl.innerHTML = chat; extraEl.innerHTML = extra;
}

window.renderFrame = (f) => { render(f); return true; };
window.TOTAL = Math.round(DUR * FPS);
await document.fonts.load('800 84px Mont'); await document.fonts.load('600 40px Pix'); await document.fonts.load('400 34px Pix');
window.ready = true;
