// STAYA — общий набор для сцен.
// Builder сливает всю статичную геометрию сцены в несколько мешей по типу материала.
// Так сцена из сотен объектов рисуется за 5–10 draw calls — это главное для телефонов.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };

/* ---------- матрицы ---------- */
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export function M(p = [0, 0, 0], r = [0, 0, 0], s = 1) {
  _e.set(r[0] || 0, r[1] || 0, r[2] || 0, 'YXZ');
  _q.setFromEuler(_e);
  if (typeof s === 'number') _s.set(s, s, s); else _s.set(s[0], s[1], s[2]);
  return new THREE.Matrix4().compose(_v.set(p[0], p[1], p[2]), _q, _s);
}
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const toV = (a) => (a.isVector3 ? a : V(a[0], a[1], a[2]));

/* ---------- примитивы ---------- */
export const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  rbox: (w, h, d, r = 0.08, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999),
  cyl: (rt, rb, h, s = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open),
  sph: (r, ws = 18, hs = 12) => new THREE.SphereGeometry(r, ws, hs),
  ico: (r, d = 2) => new THREE.IcosahedronGeometry(r, d),
  tor: (R, r, rs = 8, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc),
  cap: (r, l, cs = 4, rs = 10) => new THREE.CapsuleGeometry(r, Math.max(l, 0.001), cs, rs),
  cone: (r, h, s = 16, open = false) => new THREE.ConeGeometry(r, h, s, 1, open),
  plane: (w, h) => new THREE.PlaneGeometry(w, h),
  tube: (pts, r, seg = 64, rad = 10, closed = false) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(toV), closed, 'centripetal'), seg, r, rad, closed),
};

/* ---------- материалы по типам ---------- */
const MAT = {
  gloss: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
  plastic: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0 }),
  matte: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }),
  metal: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 1 }),
  chrome: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.04, metalness: 1, flatShading: true }),
  neon: () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  glass: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
  beam: () => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }),
};

const KEEP = new Set(['position', 'normal']);
const _c = new THREE.Color();

export class Builder {
  constructor() { this.b = {}; this.stack = [new THREE.Matrix4()]; this.count = 0; }
  push(m) { const mm = m.isMatrix4 ? m : M(m.p, m.r, m.s); this.stack.push(this.stack[this.stack.length - 1].clone().multiply(mm)); return this; }
  pop() { this.stack.pop(); return this; }
  // opts: { flat: true } — гранёные нормали; { fade: [k0,k1] } — яркость по локальной Y (для лучей)
  add(geo, color, kind = 'gloss', m = null, opts = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (!KEEP.has(k)) g.deleteAttribute(k);
    g.morphAttributes = {}; g.clearGroups();
    if (opts.flat || !g.attributes.normal) g.computeVertexNormals();
    const pos = g.attributes.position, n = pos.count;
    const col = new Float32Array(n * 3);
    _c.set(color);
    let y0 = 0, y1 = 1;
    if (opts.fade) { g.computeBoundingBox(); y0 = g.boundingBox.min.y; y1 = g.boundingBox.max.y; }
    for (let i = 0; i < n; i++) {
      let k = 1;
      if (opts.fade) { const t = (pos.getY(i) - y0) / (y1 - y0 || 1); k = opts.fade[0] + (opts.fade[1] - opts.fade[0]) * t; k = Math.max(0, k) ** 1.6; }
      col[i * 3] = _c.r * k; col[i * 3 + 1] = _c.g * k; col[i * 3 + 2] = _c.b * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    let mat = this.stack[this.stack.length - 1];
    if (m) mat = mat.clone().multiply(m.isMatrix4 ? m : M(m.p, m.r, m.s));
    g.applyMatrix4(mat);
    (this.b[kind] ||= []).push(g);
    this.count++;
    return this;
  }
  build() {
    const group = new THREE.Group();
    for (const [kind, list] of Object.entries(this.b)) {
      if (!list.length) continue;
      const geo = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, MAT[kind]());
      mesh.name = kind;
      mesh.matrixAutoUpdate = false;
      if (kind === 'glass' || kind === 'beam') mesh.renderOrder = 2;
      group.add(mesh);
    }
    this.b = {};
    return group;
  }
}

/* ---------- составные элементы ---------- */
// Стержень/цилиндр между двумя точками
export function rod(b, A, B, r, color, kind = 'metal', seg = 8, rB = null) {
  A = toV(A); B = toV(B);
  const d = B.clone().sub(A), len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, V(1, 1, 1));
  b.add(G.cyl(rB ?? r, r, len, seg), color, kind, m);
}
// Капсула между двумя точками (конечности)
export function limb(b, A, B, r, color, kind = 'gloss') {
  A = toV(A); B = toV(B);
  const d = B.clone().sub(A), len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, V(1, 1, 1));
  b.add(G.cap(r, len, _lo ? 1 : 3, _lo ? 6 : 8), color, kind, m);
}
// Луч прожектора: вершина в from, основание в to
export function beam(b, from, to, radius, color) {
  from = toV(from); to = toV(to);
  const d = from.clone().sub(to), len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(from.clone().add(to).multiplyScalar(0.5), q, V(1, 1, 1));
  b.add(G.cone(radius, len, 18, true), color, 'beam', m, { fade: [0, 1] });
}
// Тонкий лазер
export function laser(b, from, to, color, r = 0.025) { rod(b, from, to, r, color, 'neon', 5); }

const SKIN = ['#f1c7a8', '#e8b48f', '#d79b78', '#f6d4bd', '#c98a63'];
export const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
// Детерминированный random — сцена одна и та же при каждой загрузке
export function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Стилизованная «глянцевая» фигура человека (как игрушка в 3D motion STAYA).
// Лицо смотрит в +Z. Ноги на y=0.
let _lo = false;
const FS = (r, a, c) => G.sph(r, _lo ? 9 : a, _lo ? 6 : c);
export function figure(b, o = {}) {
  const s = o.s ?? 1, skin = o.skin ?? pick(SKIN, o.i ?? 0);
  const top = o.top ?? '#ff3fa4', bottom = o.bottom ?? top, hair = o.hair ?? '#2a1a14';
  const pose = o.pose ?? 'stand', legs = o.legs ?? (pose === 'feetUp' ? 'feetUp' : pose === 'sit' || pose === 'relax' || pose === 'behindHead' ? 'sit' : 'stand');
  const kind = o.kind ?? 'gloss';
  _lo = !!o.lo;
  b.push(M(o.p ?? [0, 0, 0], [0, o.ry ?? 0, 0], s));
  const hipY = legs === 'stand' ? 0.95 : 0.5;
  const H = hipY;
  // ноги
  const legC = o.legC ?? (o.swim ? skin : bottom);
  for (const sx of [-1, 1]) {
    let K, F;
    if (legs === 'sit') { K = [sx * 0.11, H + 0.02, 0.44]; F = [sx * 0.12, 0.07, 0.5]; }
    else if (legs === 'feetUp') { K = [sx * 0.11, H + 0.2, 0.42]; F = [sx * 0.12, H + 0.38, 0.85]; }
    else { const st = o.step ? sx * 0.06 : 0; K = [sx * 0.11, H * 0.52, 0.03 + st]; F = [sx * 0.13, 0.08, 0.02 + st * 1.5]; }
    limb(b, [sx * 0.09, H, 0], K, 0.075, legC, kind);
    limb(b, K, F, 0.065, legC, kind);
    if (!o.swim) b.add(G.rbox(0.13, 0.09, 0.26, 0.04), o.shoes ?? '#f4f4f4', 'plastic', M([F[0], F[1] - 0.03, F[2] + 0.06]));
  }
  // таз и торс
  b.add(FS(0.17, 14, 10), bottom, kind, M([0, H + 0.02, 0], [0, 0, 0], [1.08, 0.75, 0.8]));
  if (o.skirt) b.add(G.cone(0.5 * (o.skirtW ?? 1), 1.0, 18, true), o.skirt, kind, M([0, H - 0.38, 0], [0, 0, 0], [1, 1, 0.85]));
  const torsoC = o.swim ? skin : top;
  limb(b, [0, H + 0.12, 0], [0, H + 0.48, 0], 0.155, torsoC, kind);
  if (o.swim) { // купальник
    b.add(FS(0.17, 14, 10), top, kind, M([0, H + 0.4, 0.035], [0, 0, 0], [1.02, 0.42, 0.92]));
    b.add(FS(0.175, 14, 10), top, kind, M([0, H + 0.05, 0], [0, 0, 0], [1.05, 0.5, 0.82]));
  }
  if (o.hoodie) b.add(FS(0.21, 14, 10), top, kind, M([0, H + 0.36, 0], [0, 0, 0], [1.25, 1.1, 0.95]));
  // шея и голова
  limb(b, [0, H + 0.58, 0], [0, H + 0.68, 0], 0.05, skin, kind);
  const HY = H + 0.8;
  b.add(FS(0.115, 16, 12), skin, kind, M([0, HY, 0.01], [0, 0, 0], [0.95, 1.08, 1]));
  if (o.mask) b.add(FS(0.118, 16, 12), o.mask, kind, M([0, HY + 0.01, 0.025], [0, 0, 0], [0.96, 1.0, 0.95]));
  if (o.glasses) b.add(G.rbox(0.2, 0.05, 0.03, 0.015), '#05050a', 'gloss', M([0, HY + 0.02, 0.105]));
  if (hair !== 'none') {
    b.add(FS(0.125, 16, 12), hair, kind, M([0, HY + 0.035, -0.02], [0, 0, 0], [1.02, 0.95, 1.02]));
    if (o.longHair) limb(b, [0, HY - 0.02, -0.07], [0, HY - (o.longHair === 2 ? 0.55 : 0.38), -0.1], 0.1, hair, kind);
  }
  if (o.cap) {
    b.add(FS(0.13, 16, 8, ), o.cap, kind, M([0, HY + 0.04, -0.01], [0, 0, 0], [1.02, 0.85, 1.05]));
    b.add(G.rbox(0.2, 0.025, 0.16, 0.01), o.cap, kind, M([0, HY + 0.06, 0.15], [o.capBack ? 0 : -0.15, o.capBack ? Math.PI : 0, 0]));
  }
  if (o.hat === 'witch') b.add(G.cone(0.2, 0.45, 14), '#120d16', kind, M([0, HY + 0.3, 0])), b.add(G.cyl(0.3, 0.3, 0.02, 20), '#120d16', kind, M([0, HY + 0.1, 0]));
  if (o.horns) for (const sx of [-1, 1]) b.add(G.cone(0.03, 0.14, 8), o.horns, kind, M([sx * 0.07, HY + 0.13, 0.02], [0, 0, -sx * 0.4]));
  // руки
  const SY = H + 0.47;
  const arms = {
    up: (sx) => [[sx * 0.32, SY + 0.28, 0.02], [sx * 0.42, SY + 0.62, 0.06]],
    stand: (sx) => [[sx * 0.24, SY - 0.28, 0.0], [sx * 0.26, SY - 0.55, 0.06]],
    dj: (sx) => [[sx * 0.26, SY - 0.22, 0.14], [sx * 0.15, SY - 0.22, 0.42]],
    relax: (sx) => [[sx * 0.24, SY - 0.26, 0.08], [sx * 0.14, SY - 0.38, 0.3]],
    behindHead: (sx) => [[sx * 0.36, SY + 0.22, -0.02], [sx * 0.08, SY + 0.36, -0.12]],
    hips: (sx) => [[sx * 0.33, SY - 0.2, -0.02], [sx * 0.17, SY - 0.38, 0.02]],
    phone: (sx) => (sx < 0 ? [[sx * 0.24, SY - 0.28, 0.0], [sx * 0.26, SY - 0.55, 0.06]] : [[sx * 0.2, SY - 0.25, 0.12], [sx * 0.05, SY + 0.0, 0.3]]),
  };
  for (const sx of [-1, 1]) {
    let ap = o.pose === 'wave' ? (sx > 0 ? 'up' : 'hips') : o.pose === 'sit' || o.pose === 'feetUp' ? 'relax' : (arms[pose] ? pose : 'stand');
    if (o.arms) ap = o.arms;
    const [E, Hn] = arms[ap](sx);
    const armC = o.sleeves ? top : skin;
    limb(b, [sx * 0.2, SY, 0], E, 0.05, armC, kind);
    limb(b, E, Hn, 0.045, ap === 'up' && o.sleeves ? top : skin, kind);
    if (ap === 'phone' && sx > 0) b.add(G.rbox(0.08, 0.15, 0.015, 0.01), '#111', 'gloss', M([Hn[0], Hn[1] + 0.05, Hn[2] + 0.02], [0.4, 0, 0]));
  }
  b.pop();
  _lo = false;
}

// Надувной 3D-текст (глянец)
export function text3d(b, font, str, o = {}) {
  const size = o.size ?? 1, depth = o.depth ?? size * 0.35, bev = o.bevel ?? size * 0.14;
  const geo = new TextGeometry(str, { font, size, height: depth, depth, curveSegments: o.curve ?? 5, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * (o.bevelK ?? 0.75), bevelSegments: o.bevelSeg ?? 4 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const ax = o.align === 'left' ? -bb.min.x : -(bb.max.x + bb.min.x) / 2;
  geo.translate(ax, -bb.min.y, -depth / 2);
  b.add(geo, o.color ?? '#ff4fb4', o.kind ?? 'gloss', M(o.p, o.r, o.s ?? 1));
  return bb.max.x - bb.min.x;
}

// Ферма (трасс) между двумя точками
export function truss(b, A, B, w = 0.4, color = '#9a9aa8') {
  A = toV(A); B = toV(B);
  const d = B.clone().sub(A), len = d.length(), dir = d.clone().normalize();
  const up = Math.abs(dir.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const s1 = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(w / 2);
  const s2 = new THREE.Vector3().crossVectors(dir, s1).normalize().multiplyScalar(w / 2);
  const cs = [s1.clone().add(s2), s1.clone().sub(s2), s1.clone().negate().sub(s2), s1.clone().negate().add(s2)];
  cs.forEach((c) => rod(b, A.clone().add(c), B.clone().add(c), 0.035, color, 'metal', 6));
  const n = Math.max(2, Math.round(len / w));
  for (let i = 0; i < n; i++) {
    const p0 = A.clone().addScaledVector(d, i / n), p1 = A.clone().addScaledVector(d, (i + 1) / n);
    for (let k = 0; k < 4; k++) rod(b, p0.clone().add(cs[k]), p1.clone().add(cs[(k + 1) % 4]), 0.018, color, 'metal', 4);
  }
}

// Пальма
export function palm(b, p, h = 7, lean = [0.8, 0.2], o = {}) {
  const [x, y, z] = p, segs = 7;
  const pts = [];
  for (let i = 0; i <= segs; i++) { const t = i / segs; pts.push(V(x + lean[0] * h * 0.25 * t * t, y + h * t, z + lean[1] * h * 0.25 * t * t)); }
  for (let i = 0; i < segs; i++) {
    rod(b, pts[i], pts[i + 1], 0.2 - i * 0.015, o.trunk ?? '#5a3d2b', 'matte', 8, 0.2 - (i + 1) * 0.015);
    b.add(G.tor(0.2 - i * 0.015, 0.035, 4, 10), '#3d2a1e', 'matte', M(pts[i].toArray(), [Math.PI / 2, 0, 0]));
  }
  const top = pts[segs];
  const n = o.fronds ?? 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (o.seed ?? 0);
    const droop = 0.35 + (i % 3) * 0.18;
    const L = 2.6 * (o.scale ?? 1);
    b.push(M(top.toArray(), [0, a, 0]));
    // лист — вытянутый эллипсоид, наклонён вниз
    b.add(G.sph(1, 10, 6), o.leaf ?? '#1d5a3c', o.leafKind ?? 'plastic', M([0, -L * 0.18, L * 0.48], [droop, 0, 0], [0.36, 0.05, L * 0.55]));
    b.pop();
  }
  b.add(G.sph(0.32, 10, 8), '#3a2a1c', 'matte', M(top.toArray()));
}

// Колонки
export function speaker(b, p, ry = 0, h = 1.6, w = 1.1) {
  b.push(M(p, [0, ry, 0]));
  b.add(G.rbox(w, h, w * 0.9, 0.06), '#0c0b10', 'plastic', M([0, h / 2, 0]));
  const r1 = w * 0.36;
  b.add(G.cyl(r1, r1, 0.06, 24), '#26232e', 'gloss', M([0, h * 0.33, w * 0.45], [Math.PI / 2, 0, 0]));
  b.add(G.cyl(r1 * 0.35, r1 * 0.35, 0.08, 16), '#3c3846', 'metal', M([0, h * 0.33, w * 0.47], [Math.PI / 2, 0, 0]));
  b.add(G.cyl(r1 * 0.5, r1 * 0.5, 0.06, 20), '#26232e', 'gloss', M([0, h * 0.75, w * 0.45], [Math.PI / 2, 0, 0]));
  b.pop();
}

// Диджейский пульт
export function djBooth(b, p, ry = 0, o = {}) {
  const w = o.w ?? 3, front = o.front ?? '#ff2fb0';
  b.push(M(p, [0, ry, 0]));
  b.add(G.rbox(w, 1.05, 0.9, 0.05), o.body ?? '#0e0c14', 'gloss', M([0, 0.525, 0]));
  b.add(G.box(w * 0.96, 0.06, 0.02), front, 'neon', M([0, 0.85, 0.46]));
  b.add(G.box(w * 0.96, 0.04, 0.02), o.front2 ?? '#2fe6ff', 'neon', M([0, 0.2, 0.46]));
  for (const sx of [-1, 1]) {
    b.add(G.rbox(0.62, 0.08, 0.5, 0.02), '#1b1a22', 'plastic', M([sx * w * 0.27, 1.09, 0]));
    b.add(G.cyl(0.19, 0.19, 0.03, 24), '#3a3946', 'metal', M([sx * w * 0.27, 1.14, 0.02]));
    b.add(G.cyl(0.05, 0.05, 0.035, 12), sx < 0 ? '#2fe6ff' : '#ff2fb0', 'neon', M([sx * w * 0.27, 1.15, 0.02]));
  }
  b.add(G.rbox(0.5, 0.09, 0.45, 0.02), '#22202a', 'plastic', M([0, 1.09, 0]));
  for (let i = 0; i < 4; i++) b.add(G.box(0.05, 0.02, 0.05), pick(['#ff2fb0', '#2fe6ff', '#ffe14a', '#8a4dff'], i), 'neon', M([-0.15 + i * 0.1, 1.15, 0.12]));
  b.pop();
}

// Надувной фламинго
export function flamingo(b, p, s = 1, ry = 0, color = '#ff6fb8') {
  b.push(M(p, [0, ry, 0], s));
  b.add(G.tor(0.75, 0.32, 12, 28), color, 'gloss', M([0, 0.2, 0], [Math.PI / 2, 0, 0]));
  b.add(G.sph(0.55, 16, 12), color, 'gloss', M([0, 0.55, -0.55], [0, 0, 0], [0.8, 0.7, 1.2]));
  const neck = [V(0, 0.7, 0.55), V(0, 1.4, 0.75), V(0, 2.0, 0.45), V(0, 2.2, 0.1)];
  b.add(G.tube(neck, 0.16, 20, 10), color, 'gloss');
  b.add(G.sph(0.25, 14, 10), color, 'gloss', M([0, 2.25, 0.15]));
  b.add(G.cone(0.1, 0.35, 10), '#2a1a22', 'gloss', M([0, 2.15, 0.45], [Math.PI / 2 + 0.6, 0, 0]));
  b.add(G.sph(0.05, 8, 6), '#111', 'gloss', M([0.18, 2.32, 0.25]));
  b.add(G.sph(0.05, 8, 6), '#111', 'gloss', M([-0.18, 2.32, 0.25]));
  b.pop();
}

// Надувной круг
export function ring(b, p, color = '#ffd23f', R = 0.5, r = 0.18, tilt = 0) {
  b.add(G.tor(R, r, 10, 24), color, 'gloss', M(p, [Math.PI / 2 + tilt, 0, 0]));
}

// Шезлонг
export function lounger(b, p, ry = 0, color = '#f4f1ea') {
  b.push(M(p, [0, ry, 0]));
  b.add(G.rbox(0.7, 0.12, 1.4, 0.04), color, 'plastic', M([0, 0.35, 0.2]));
  b.add(G.rbox(0.7, 0.12, 0.8, 0.04), color, 'plastic', M([0, 0.62, -0.8], [0.6, 0, 0]));
  for (const sx of [-1, 1]) for (const z of [-0.8, 0.8]) b.add(G.box(0.05, 0.3, 0.05), '#bbb', 'metal', M([sx * 0.3, 0.15, z]));
  b.pop();
}

// Красный стакан
export function cup(b, p, color = '#e8102a') {
  b.add(G.cyl(0.055, 0.04, 0.13, 12, true), color, 'gloss', M([p[0], p[1] + 0.065, p[2]]));
}

// Спиннер 2017
export function spinner(b, p, r = [0, 0, 0], s = 1, color = '#2f7bff') {
  b.push(M(p, r, s));
  b.add(G.cyl(0.32, 0.32, 0.22, 24), color, 'gloss', M([0, 0, 0], [Math.PI / 2, 0, 0]));
  b.add(G.cyl(0.2, 0.2, 0.26, 24), '#d8d8e0', 'chrome', M([0, 0, 0], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * 0.72, y = Math.sin(a) * 0.72;
    b.add(G.tor(0.3, 0.12, 10, 28), color, 'gloss', M([x, y, 0]));
    b.add(G.cyl(0.19, 0.19, 0.2, 20), '#cfd0d8', 'chrome', M([x, y, 0], [Math.PI / 2, 0, 0]));
    rod(b, [x * 0.4, y * 0.4, 0], [x * 0.62, y * 0.62, 0], 0.13, color, 'gloss', 12);
  }
  b.pop();
}

// Тыква
export function pumpkin(b, p, s = 1, face = true, ry = 0) {
  b.push(M(p, [0, ry, 0], s));
  b.add(G.sph(0.5, 18, 12), '#e8650e', 'gloss', M([0, 0.36, 0], [0, 0, 0], [1, 0.72, 1]));
  for (let i = 0; i < 6; i++) b.add(G.sph(0.5, 14, 10), '#ff7a14', 'gloss', M([0, 0.36, 0], [0, (i / 6) * Math.PI, 0], [0.62, 0.74, 1.02]));
  b.add(G.cyl(0.05, 0.07, 0.2, 8), '#3a5a1a', 'matte', M([0, 0.78, 0], [0.2, 0, 0.1]));
  if (face) {
    for (const sx of [-1, 1]) b.add(G.cone(0.08, 0.12, 3), '#ffd23a', 'neon', M([sx * 0.16, 0.45, 0.47], [Math.PI / 2, 0, 0], [1, 1, 0.4]));
    b.add(G.box(0.3, 0.07, 0.04), '#ffd23a', 'neon', M([0, 0.26, 0.46]));
  }
  b.pop();
}

/* ---------- атмосфера: свечение, небо, звёзды ---------- */
export const glowMats = new Set();
export function glowPoints(list) {
  // list: [x,y,z, color, size(world units), intensity]
  const n = list.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n);
  list.forEach((g, i) => {
    pos.set([g[0], g[1], g[2]], i * 3); _c.set(g[3]); const k = g[5] ?? 1;
    col.set([_c.r * k, _c.g * k, _c.b * k], i * 3); siz[i] = g[4] ?? 1;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 600 } },
    vertexShader: `attribute vec3 aColor; attribute float aSize; uniform float uScale; varying vec3 vC;
      void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=min(aSize*uScale/max(-mv.z,0.1), 512.); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5)*2.; float a=max(0.,1.-d); a=a*a*(0.35+0.65*a*a); gl_FragColor=vec4(vC*a,1.);
      #include <colorspace_fragment>
    }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  glowMats.add(mat);
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false; pts.renderOrder = 3; pts.matrixAutoUpdate = false;
  pts.userData.dispose = () => glowMats.delete(mat);
  return pts;
}

let _haloTex;
function haloTex() {
  if (_haloTex) return _haloTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,.5)'); g.addColorStop(0.5, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _haloTex = new THREE.CanvasTexture(c); return _haloTex;
}
export function halo(p, size, color, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: haloTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity, toneMapped: false, fog: false });
  const s = new THREE.Sprite(m); s.position.set(...p); s.scale.set(size, size, 1); s.renderOrder = 1;
  return s;
}

export function sky(stops, r = 420) {
  const [bot, mid, top, midY = 0.1] = stops;
  const mat = new THREE.ShaderMaterial({
    uniforms: { cb: { value: new THREE.Color(bot) }, cm: { value: new THREE.Color(mid) }, ct: { value: new THREE.Color(top) }, my: { value: midY } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 cb,cm,ct; uniform float my; varying vec3 vP;
      void main(){ float h=vP.y; vec3 c = h>my ? mix(cm,ct,smoothstep(my,0.75,h)) : mix(cb,cm,smoothstep(-0.25,my,h)); gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), mat); m.renderOrder = -1; m.frustumCulled = false;
  return m;
}

export function stars(n = 900, r = 380, minY = 0.05, seed = 7) {
  const R = rng(seed), pos = [], col = [];
  for (let i = 0; i < n; i++) {
    const u = R() * 2 - 1, a = R() * Math.PI * 2, y = minY + (1 - minY) * Math.pow(R(), 0.8);
    const k = Math.sqrt(1 - y * y);
    pos.push(Math.cos(a) * k * r, y * r, Math.sin(a) * k * r);
    const b = 0.5 + R() * 0.5; col.push(b, b, b * (0.9 + R() * 0.2));
    void u;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false }));
  p.frustumCulled = false;
  return p;
}

/* ---------- вода ---------- */
let _ripple;
export function rippleNormal() {
  if (_ripple) return _ripple;
  const N = 256, d = new Uint8Array(N * N * 4);
  const h = (x, y) => {
    const u = (x / N) * Math.PI * 2, v = (y / N) * Math.PI * 2;
    return Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.35 + Math.sin(u * 9 - v * 7) * 0.18 + Math.sin(u * 13 + v * 11) * 0.1;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
    const n = V(-dx * 2.2, -dy * 2.2, 1).normalize(), i = (y * N + x) * 4;
    d[i] = (n.x * 0.5 + 0.5) * 255; d[i + 1] = (n.y * 0.5 + 0.5) * 255; d[i + 2] = (n.z * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  _ripple = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  _ripple.wrapS = _ripple.wrapT = THREE.RepeatWrapping; _ripple.needsUpdate = true; _ripple.generateMipmaps = true;
  _ripple.minFilter = THREE.LinearMipmapLinearFilter; _ripple.magFilter = THREE.LinearFilter;
  _ripple.userData.shared = true;
  return _ripple;
}
export function water(w, h, color, o = {}) {
  const nm = rippleNormal().clone(); nm.needsUpdate = true; nm.repeat.set(w / (o.tile ?? 6), h / (o.tile ?? 6)); nm.userData.shared = false;
  const mat = new THREE.MeshPhysicalMaterial({
    color, roughness: o.rough ?? 0.06, metalness: o.metal ?? 0.1, clearcoat: 1, clearcoatRoughness: 0.03,
    normalMap: nm, normalScale: new THREE.Vector2(o.ns ?? 0.55, o.ns ?? 0.55),
    emissive: new THREE.Color(o.emissive ?? color), emissiveIntensity: o.ei ?? 0.35,
    transparent: o.opacity != null, opacity: o.opacity ?? 1, side: THREE.DoubleSide, depthWrite: o.opacity == null,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 1), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ---------- canvas-текстуры (экраны, постеры, календарь) ---------- */
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...o.repeat); }
  return t;
}
export function screen(w, h, tex, p, r = [0, 0, 0], o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: o.double ? THREE.DoubleSide : THREE.FrontSide, fog: o.fog ?? true }));
  m.position.set(...p); m.rotation.set(r[0], r[1], r[2], 'YXZ');
  return m;
}
export function texPlane(w, h, tex, p, r = [0, 0, 0], o = {}) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(...p); m.rotation.set(r[0], r[1], r[2], 'YXZ');
  return m;
}
export const FONT = '"Unbounded", "Arial Black", sans-serif';
export function gradText(x, txt, cx, cy, size, c1, c2, o = {}) {
  x.font = `${o.weight ?? 900} ${size}px ${FONT}`; x.textAlign = o.align ?? 'center'; x.textBaseline = 'middle';
  const g = x.createLinearGradient(0, cy - size / 2, 0, cy + size / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  if (o.glow) { x.shadowColor = o.glow; x.shadowBlur = size * 0.35; }
  x.fillStyle = g; x.fillText(txt, cx, cy); x.shadowBlur = 0;
}

/* ---------- окружение для глянца ---------- */
// Маленькая «неоновая комната» → PMREM. Глянец отражает цвета сцены.
export function env(renderer, palette, base = '#06040c') {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(base);
  const geo = new THREE.PlaneGeometry(1, 1);
  palette.forEach((c, i) => {
    const a = (i / palette.length) * Math.PI * 2;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(Math.cos(a) * 8, 2 + (i % 2) * 4, Math.sin(a) * 8); m.lookAt(0, 0, 0);
    m.scale.set(5, 2.2 + (i % 3), 1); sc.add(m);
  });
  const top = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: palette[0], side: THREE.DoubleSide }));
  top.position.set(0, 9, 0); top.rotation.x = Math.PI / 2; top.scale.set(6, 6, 1); top.material.color.multiplyScalar(0.5); sc.add(top);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0.04);
  pm.dispose(); geo.dispose(); sc.traverse((o) => o.material && o.material.dispose());
  return rt.texture;
}

/* ---------- путь камеры ---------- */
// keys: [{p:[...], l:[...], t?}] — t не задан → по расстоянию (ровная скорость).
export function camPath(keys) {
  const P = keys.map((k) => toV(k.p)), L = keys.map((k) => toV(k.l));
  const n = keys.length, ts = keys.map((k) => k.t);
  ts[0] ??= 0; ts[n - 1] ??= 1;
  // заполняем пропуски по длине пути между известными t
  let a = 0;
  for (let i = 1; i < n; i++) {
    if (ts[i] == null) continue;
    let tot = 0; const seg = [];
    for (let j = a; j < i; j++) { const d = P[j].distanceTo(P[j + 1]) + 0.001; seg.push(d); tot += d; }
    let acc = 0;
    for (let j = a + 1; j < i; j++) { acc += seg[j - a - 1]; ts[j] = ts[a] + (ts[i] - ts[a]) * (acc / tot); }
    a = i;
  }
  const pc = new THREE.CatmullRomCurve3(P, false, 'centripetal'), lc = new THREE.CatmullRomCurve3(L, false, 'centripetal');
  const out = { p: V(0, 0, 0), l: V(0, 0, 0) };
  return (t) => {
    t = Math.min(1, Math.max(0, t));
    let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
    const f = ts[i + 1] > ts[i] ? (t - ts[i]) / (ts[i + 1] - ts[i]) : 0;
    const u = (i + Math.min(1, Math.max(0, f))) / (n - 1);
    pc.getPoint(u, out.p); lc.getPoint(u, out.l);
    return out;
  };
}

export function disposeScene(scene) {
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.userData.dispose) o.userData.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    ms.forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.userData.shared) v.dispose(); } m.dispose(); });
  });
  if (scene.environment) scene.environment.dispose();
}

/* ---------- луна: одна текстура для арт-объекта в клубе и настоящей луны ---------- */
// Направление «от луны к камере» в кадре-склейке клуб → бассейн. Отношение радиус/дистанция — MOON_K.
export const MOON_DIR = [0, -0.19, -0.982];
export const MOON_K = 0.383;
export function moonTexture() {
  return canvasTex(1024, 512, (x, w, h) => {
    x.fillStyle = '#fff1d6'; x.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 120; i++) {
      const cx = r() * w, cy = h * 0.12 + r() * h * 0.76, rr = 6 + r() * 42;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, 'rgba(160,150,140,.55)'); g.addColorStop(0.7, 'rgba(170,160,150,.25)'); g.addColorStop(1, 'rgba(170,160,150,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.8, 0, 0, 7); x.fill();
    }
  });
}
// Луна с освещённой и тёмной стороной. lightDir — откуда свет (в мире).
export function moonMesh(radius, lightDir = null, o = {}) {
  const map = moonTexture();
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, L: { value: new THREE.Vector3(...(lightDir ?? [0, 0, 0])).normalize() }, lit: { value: lightDir ? 0 : 1 }, glow: { value: new THREE.Color(o.tint ?? '#fff3dc') } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 L, glow; uniform float lit; varying vec2 vUv; varying vec3 vN;
      void main(){ vec3 c=texture2D(map,vUv).rgb*glow; float k = lit>0.5 ? 1. : smoothstep(-0.15,0.35,dot(vN,L)); gl_FragColor=vec4(c*(0.035+0.965*k),1.);
      #include <colorspace_fragment>
    }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), mat);
}
