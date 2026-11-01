// STAYA — люди. Пять резидентов и двадцать гостей, одни и те же на всех сценах.
// Стиль: глянцевые «виниловые» фигурки, хип-хоп: девушки в бикини, парни в майках и шортах, очки, кепки, цепи.
// person(b, look, o) собирает фигуру в Builder. look — образ из CAST, o — поза и место:
//   o.p [x,y,z] — ноги; o.ry — поворот (лицо в +Z при ry=0); o.pose — руки; o.legs — 'stand' | 'sit' | 'feetUp';
//   o.s — масштаб; o.lo — упрощённая геометрия для толпы.
import { THREE, G, M, V } from './kit.js';

/* ---------- образы ---------- */
const SK = { light: '#f3cdb2', fair: '#ecbf9f', tan: '#d9a07c', olive: '#c98f69', deep: '#8a5a3e' };
const GOLD = '#e8b84a', SILVER = '#d8dce4';

// Резиденты STAYA — узнаваемые детали из фото: очки, причёски, цвета
export const RESIDENTS = {
  dierouzze: { name: 'DIEROUZZE', sex: 'f', skin: SK.fair, hair: 'long', hairC: '#0b0b10', top: 'bikini', topC: '#0e0e12', bottom: 'bikini', bottomC: '#0e0e12',
    glasses: { kind: 'round', c: '#ff8ad8', lens: '#ff6fb8' }, ink: true, hoops: SILVER, shoes: 'platform', shoesC: '#0e0e12' },
  gulidic: { name: 'GULIDIC', sex: 'm', skin: SK.light, hair: 'curly', hairC: '#4a2a18', top: 'jersey', topC: '#141018', trim: '#f2c230', bottom: 'shorts', bottomC: '#141018', bottomTrim: '#f2c230',
    glasses: { kind: 'square', c: '#eef2f6', lens: '#cfe6ff' }, shoes: 'sneaker', shoesC: '#f4f4f4', socks: true },
  klen: { name: 'KLËN', sex: 'm', skin: SK.light, hair: 'swept', hairC: '#5a3a24', top: 'tank', topC: '#0e0e12', bottom: 'cargo', bottomC: '#1a1a1e',
    glasses: { kind: 'shades', c: '#050507' }, chain: SILVER, rings: true, shoes: 'sneaker', shoesC: '#0e0e12' },
  pronto: { name: 'PRONTO', sex: 'm', skin: SK.light, hair: 'buzz', hairC: '#7a5a3a', cap: { c: '#1a1a1e', back: true }, top: 'tank', topC: '#16161a', bottom: 'shorts', bottomC: '#2a2a30',
    chain: GOLD, shoes: 'sneaker', shoesC: '#f4f4f4', socks: true },
  sixphrases: { name: 'SIXPHRASES', sex: 'm', skin: SK.fair, hair: 'bowl', hairC: '#5a3820', top: 'tee', topC: '#0e0e12', trim: '#8a8a94', bottom: 'shorts', bottomC: '#0e0e12',
    glasses: { kind: 'square', c: '#ffffff', lens: '#f0f0f0' }, chain: SILVER, shoes: 'sneaker', shoesC: '#e8e8ec' },
};

// Гости: 10 девушек и 10 парней
export const GUESTS = [
  { sex: 'f', skin: SK.tan, hair: 'long', hairC: '#e9c27a', top: 'bikini', topC: '#ff3fa4', bottomC: '#ff3fa4', glasses: { kind: 'shades', c: '#0a0a0e' }, hoops: GOLD },
  { sex: 'f', skin: SK.light, hair: 'bun', hairC: '#1a1210', top: 'bikini', topC: '#ffffff', bottomC: '#ffffff', glasses: { kind: 'cat', c: '#111', lens: '#2a2a30' }, chain: GOLD },
  { sex: 'f', skin: SK.deep, hair: 'braids', hairC: '#120c0a', top: 'bikini', topC: '#ffd23f', bottomC: '#ffd23f', cap: { c: '#f4f4f4' }, hoops: GOLD },
  { sex: 'f', skin: SK.fair, hair: 'pony', hairC: '#b0522a', top: 'bikini', topC: '#2fe6ff', bottomC: '#2fe6ff', glasses: { kind: 'shades', c: '#1a0a2a', lens: '#7a3dff' } },
  { sex: 'f', skin: SK.olive, hair: 'long', hairC: '#1a1210', top: 'bikini', topC: '#0e0e12', bottomC: '#0e0e12', cap: { c: '#ff3fa4', back: true }, chain: GOLD },
  { sex: 'f', skin: SK.light, hair: 'bob', hairC: '#ff8ad8', top: 'bikini', topC: '#b45cff', bottomC: '#b45cff', glasses: { kind: 'round', c: '#ffd23f', lens: '#ffb800' } },
  { sex: 'f', skin: SK.tan, hair: 'curlyLong', hairC: '#2a1810', top: 'bikini', topC: '#39ff9a', bottomC: '#39ff9a', hoops: GOLD, glasses: { kind: 'shades', c: '#0a0a0e' } },
  { sex: 'f', skin: SK.fair, hair: 'long', hairC: '#f4e4b8', top: 'bikini', topC: '#ff2a55', bottomC: '#ff2a55', bucket: '#f4f4f4' },
  { sex: 'f', skin: SK.deep, hair: 'afro', hairC: '#120c0a', top: 'bikini', topC: '#ff7a3a', bottomC: '#ff7a3a', glasses: { kind: 'cat', c: '#fff', lens: '#1a1a1a' }, hoops: GOLD },
  { sex: 'f', skin: SK.light, hair: 'pony', hairC: '#1a1210', top: 'bikini', topC: '#f4f4f4', bottomC: '#0e0e12', over: { kind: 'shirt', c: '#ff8ac8' }, glasses: { kind: 'shades', c: '#0a0a0e' } },
  { sex: 'm', skin: SK.tan, hair: 'fade', hairC: '#120c0a', cap: { c: '#111', back: true }, top: 'tank', topC: '#f4f4f4', bottom: 'shorts', bottomC: '#1a1a22', chain: GOLD, glasses: { kind: 'shades', c: '#0a0a0e' }, socks: true },
  { sex: 'm', skin: SK.deep, hair: 'twists', hairC: '#120c0a', top: 'jersey', topC: '#2f5bff', trim: '#ffffff', bottom: 'shorts', bottomC: '#2f5bff', bottomTrim: '#ffffff', chain: GOLD },
  { sex: 'm', skin: SK.light, hair: 'buzz', hairC: '#e9c27a', top: 'tank', topC: '#ff3fa4', bottom: 'cargo', bottomC: '#5a5f4a', glasses: { kind: 'wrap', c: '#0a0a0e', lens: '#2fe6ff' } },
  { sex: 'm', skin: SK.olive, hair: 'fade', hairC: '#1a1210', cap: { c: '#f4f4f4' }, top: 'tee', topC: '#111114', trim: '#ff3fa4', bottom: 'shorts', bottomC: '#f4f4f4', chain: SILVER, socks: true },
  { sex: 'm', skin: SK.fair, hair: 'curly', hairC: '#1a1210', bucket: '#111114', top: 'tank', topC: '#ffd23f', bottom: 'shorts', bottomC: '#111114', glasses: { kind: 'shades', c: '#0a0a0e' } },
  { sex: 'm', skin: SK.deep, hair: 'buzz', hairC: '#0a0806', top: 'none', bottom: 'shorts', bottomC: '#ff7a3a', chain: GOLD, glasses: { kind: 'shades', c: '#0a0a0e', lens: '#ffb800' } },
  { sex: 'm', skin: SK.light, hair: 'swept', hairC: '#c88a4a', cap: { c: '#2f5bff', back: true }, top: 'jersey', topC: '#ffffff', trim: '#ff2a55', bottom: 'shorts', bottomC: '#ff2a55', socks: true },
  { sex: 'm', skin: SK.tan, hair: 'fade', hairC: '#120c0a', top: 'tank', topC: '#39ff9a', bottom: 'shorts', bottomC: '#0e0e12', chain: SILVER, glasses: { kind: 'wrap', c: '#f4f4f4', lens: '#0a0a0e' } },
  { sex: 'm', skin: SK.olive, hair: 'twists', hairC: '#1a1210', top: 'tee', topC: '#b45cff', trim: '#ffffff', bottom: 'cargo', bottomC: '#2a2a30', cap: { c: '#0e0e12' } },
  { sex: 'm', skin: SK.fair, hair: 'curly', hairC: '#3a2216', top: 'none', bottom: 'shorts', bottomC: '#2fe6ff', glasses: { kind: 'round', c: '#e8b84a', lens: '#3a2a10' }, chain: GOLD },
];
export const CAST = [...Object.values(RESIDENTS), ...GUESTS];
export const guest = (i) => GUESTS[((i % GUESTS.length) + GUESTS.length) % GUESTS.length];

/* ---------- геометрия ---------- */
let LO = false;
const seg = (a, b) => (LO ? b : a);
const rb = (w, h, d, r) => (LO ? G.box(w, h, d) : G.rbox(w, h, d, r));
const sph = (r) => G.sph(r, seg(16, 7), seg(10, 5));
function limb(b, A, B, r, c, kind = 'gloss', r2 = null) {
  A = A.isVector3 ? A : V(...A); B = B.isVector3 ? B : V(...B);
  const d = B.clone().sub(A), len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, V(1, 1, 1));
  if (r2 == null) b.add(G.cap(r, len, seg(3, 1), seg(10, 5)), c, kind, m);
  else b.add(G.cyl(r2, r, len, seg(12, 5), true), c, kind, m);
}
// Тело-«вращение» по профилю [r, y]; z сжимается (тело плоское спереди-сзади)
function lathe(b, prof, c, kind, zk = 0.72, m = null, open = false) {
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, seg(20, 8));
  g.scale(1, 1, zk);
  b.add(g, c, kind, m);
}
const lerp = (a, b, t) => a + (b - a) * t;

// Руки: [локоть, кисть] от плеча; sx = −1 левая, +1 правая
const ARMS = {
  stand: (sx, S) => [[sx * 0.25, S - 0.28, 0.0], [sx * 0.27, S - 0.55, 0.05]],
  up: (sx, S) => [[sx * 0.32, S + 0.28, 0.02], [sx * 0.4, S + 0.6, 0.06]],
  wave: (sx, S) => (sx > 0 ? [[sx * 0.33, S + 0.26, 0.04], [sx * 0.36, S + 0.58, 0.1]] : [[sx * 0.32, S - 0.2, -0.02], [sx * 0.17, S - 0.38, 0.03]]),
  hips: (sx, S) => [[sx * 0.33, S - 0.2, -0.02], [sx * 0.17, S - 0.38, 0.03]],
  dj: (sx, S) => [[sx * 0.27, S - 0.22, 0.14], [sx * 0.16, S - 0.22, 0.42]],
  cross: (sx, S) => [[sx * 0.24, S - 0.24, 0.12], [-sx * 0.1, S - 0.17, 0.17]],
  peace: (sx, S) => (sx > 0 ? [[sx * 0.24, S - 0.12, 0.18], [sx * 0.15, S + 0.22, 0.24]] : [[sx * 0.25, S - 0.28, 0.0], [sx * 0.27, S - 0.55, 0.05]]),
  phone: (sx, S) => (sx < 0 ? [[sx * 0.25, S - 0.28, 0.0], [sx * 0.27, S - 0.55, 0.05]] : [[sx * 0.21, S - 0.25, 0.12], [sx * 0.06, S + 0.0, 0.3]]),
  relax: (sx, S) => [[sx * 0.25, S - 0.26, 0.08], [sx * 0.15, S - 0.38, 0.3]],
  behindHead: (sx, S) => [[sx * 0.36, S + 0.22, -0.02], [sx * 0.08, S + 0.36, -0.12]],
  hug: (sx, S) => [[sx * 0.3, S - 0.14, 0.2], [sx * 0.13, S - 0.1, 0.44]],
  neck: (sx, S) => [[sx * 0.3, S + 0.04, 0.2], [sx * 0.12, S + 0.16, 0.42]],
  hold: (sx, S) => [[sx * 0.22, S - 0.32, 0.12], [sx * 0.07, S - 0.2, 0.36]],
  count: (sx, S) => [[sx * 0.24, S - 0.3, 0.14], [sx * 0.08, S - 0.36, 0.38]],
};
export const POSES = Object.keys(ARMS);

export function person(b, look, o = {}) {
  LO = !!o.lo;
  const f = look.sex === 'f', skin = look.skin ?? SK.fair, s = (o.s ?? 1) * (f ? 0.95 : 1.02);
  const legs = o.legs ?? (o.pose === 'relax' || o.pose === 'behindHead' ? 'sit' : 'stand');
  const pose = ARMS[o.pose] ? o.pose : 'stand';
  const CL = 'plastic', SKN = 'gloss';
  b.push(M(o.p ?? [0, 0, 0], [0, o.ry ?? 0, 0], s));
  const H = legs === 'stand' ? 0.93 : 0.5;          // высота бёдер
  const hipW = f ? 0.105 : 0.095;

  /* ноги */
  const bot = look.bottom ?? (f ? 'bikini' : 'shorts');
  for (const sx of [-1, 1]) {
    let K, F;
    if (legs === 'sit') { K = [sx * 0.12, H + 0.02, 0.44]; F = [sx * 0.13, 0.08, 0.5]; }
    else if (legs === 'feetUp') { K = [sx * 0.12, H + 0.18, 0.44]; F = [sx * 0.13, H + 0.34, 0.86]; }
    else { const st = o.step ? sx * 0.06 : 0; K = [sx * 0.115, H * 0.52, 0.03 + st]; F = [sx * 0.13, 0.09, 0.02 + st * 1.5]; }
    const Hp = [sx * hipW, H, 0];
    limb(b, Hp, K, f ? 0.08 : 0.078, skin, SKN, f ? 0.066 : 0.066);
    limb(b, K, F, f ? 0.06 : 0.062, skin, SKN, 0.048);
    b.add(sph(0.068), skin, SKN, M(K));
    // шорты: широкие «баскетбольные» до колена, карго — ниже колена
    if (bot === 'shorts' || bot === 'cargo') {
      const kv = V(...K), hv = V(...Hp), e = hv.clone().lerp(kv, bot === 'cargo' ? 1.08 : 0.92);
      limb(b, hv.clone().add(V(sx * 0.01, 0.04, 0)), e.clone().add(V(sx * 0.015, 0, 0)), 0.1, look.bottomC, CL, 0.104);
      if (look.bottomTrim) limb(b, hv.clone().lerp(e, 0.15).add(V(sx * 0.105, 0, 0)), e.clone().add(V(sx * 0.1, 0, 0)), 0.012, look.bottomTrim, CL);
      if (bot === 'cargo') b.add(rb(0.07, 0.11, 0.1, 0.02), look.bottomC, CL, M([kv.x * 0.6 + hv.x * 0.4 + sx * 0.1, lerp(hv.y, kv.y, 0.55), kv.z * 0.5]));
    }
    // носки и обувь
    if (look.socks && legs === 'stand' && !LO) limb(b, [F[0], 0.1, F[2]], [K[0] * 0.3 + F[0] * 0.7, K[1] * 0.42, K[2] * 0.3 + F[2] * 0.7], 0.056, '#f6f6f6', CL, 0.054);
    const shoe = look.shoes ?? (o.barefoot ? 'none' : 'sneaker');
    if (shoe === 'sneaker' || shoe === 'platform') {
      const hh = shoe === 'platform' ? 0.13 : 0.1;
      b.add(rb(0.13, hh, 0.29, 0.045), look.shoesC ?? '#f4f4f4', SKN, M([F[0], F[1] - 0.09 + hh / 2, F[2] + 0.06]));
      b.add(rb(0.135, 0.035, 0.3, 0.015), shoe === 'platform' ? '#f4f4f4' : '#ececec', CL, M([F[0], F[1] - 0.085, F[2] + 0.06]));
    } else b.add(rb(0.1, 0.06, 0.22, 0.03), skin, SKN, M([F[0], F[1] - 0.06, F[2] + 0.06]));
  }

  /* таз и торс */
  const tor = f
    ? [[0.001, H - 0.06], [0.15, H - 0.02], [0.165, H + 0.06], [0.13, H + 0.2], [0.125, H + 0.26], [0.145, H + 0.38], [0.155, H + 0.46], [0.16, H + 0.53], [0.1, H + 0.6], [0.001, H + 0.62]]
    : [[0.001, H - 0.06], [0.145, H - 0.02], [0.15, H + 0.06], [0.145, H + 0.2], [0.155, H + 0.32], [0.18, H + 0.44], [0.195, H + 0.53], [0.11, H + 0.61], [0.001, H + 0.63]];
  lathe(b, tor, skin, SKN, f ? 0.7 : 0.68);
  if (f) for (const sx of [-1, 1]) b.add(sph(0.072), skin, SKN, M([sx * 0.068, H + 0.42, 0.06], [0, 0, 0], [1, 0.95, 0.9]));
  else if (look.top === 'none' && !LO) for (const sx of [-1, 1]) b.add(sph(0.075), skin, SKN, M([sx * 0.08, H + 0.43, 0.045], [0, 0, 0], [1.1, 0.6, 0.55]));
  // низ: бикини или пояс шорт
  if (bot === 'bikini') {
    const g = new THREE.SphereGeometry(0.168, seg(20, 10), seg(10, 6), 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.36);
    g.scale(1, 1.05, 0.72); b.add(g, look.bottomC ?? look.topC, CL, M([0, H + 0.02, 0]));
    for (const sx of [-1, 1]) b.add(G.tor(0.035, 0.007, 5, 10), look.bottomC ?? look.topC, CL, M([sx * 0.16, H + 0.06, 0], [0, Math.PI / 2, 0]));
  } else {
    lathe(b, [[0.001, H - 0.08], [0.16, H - 0.06], [0.168, H + 0.04], [0.158, H + 0.12], [0.001, H + 0.13]], look.bottomC, CL, 0.74);
    if (!LO) b.add(G.tor(0.15, 0.012, 5, 24), look.bottomTrim ?? '#f4f4f4', CL, M([0, H + 0.12, 0], [Math.PI / 2, 0, 0], [1, 0.74, 1]));
  }
  // верх
  const top = look.top ?? 'tank';
  if (top === 'bikini') {
    for (const sx of [-1, 1]) {
      b.add(sph(0.077), look.topC, CL, M([sx * 0.068, H + 0.422, 0.062], [0, 0, 0], [1.04, 0.98, 0.93]));
      limb(b, [sx * 0.07, H + 0.47, 0.1], [sx * 0.045, H + 0.62, 0.02], 0.008, look.topC, CL);
    }
    b.add(G.tor(0.142, 0.01, 5, 24), look.topC, CL, M([0, H + 0.4, 0], [Math.PI / 2, 0, 0], [1, 0.72, 1]));
  } else if (top !== 'none') {
    const k = 1.06, tee = top === 'tee';
    const pr = tor.filter(([, y]) => y >= H + 0.04).map(([r, y]) => [Math.max(r * k + 0.005, 0.07), y + 0.005]);
    pr.unshift([0.001, H + 0.04]);
    lathe(b, pr, look.topC, CL, (f ? 0.7 : 0.68) * 1.05);
    if (tee) for (const sx of [-1, 1]) b.add(sph(0.078), look.topC, CL, M([sx * 0.17, H + 0.52, 0], [0, 0, 0], [1, 0.8, 0.95]));
    if (look.trim) b.add(G.tor(0.17, 0.012, 5, 24), look.trim, CL, M([0, H + 0.1, 0], [Math.PI / 2, 0, 0], [1, 0.72, 1]));
    if (look.trim && top !== 'tee' && !LO) for (const sx of [-1, 1]) b.add(G.tor(0.075, 0.01, 5, 16), look.trim, CL, M([sx * 0.15, H + 0.5, 0], [0, Math.PI / 2, 0.25 * sx]));
    if (top === 'jersey' && !LO) b.add(rb(0.16, 0.14, 0.01, 0.004), look.trim ?? '#fff', CL, M([0, H + 0.33, 0.135]));
  }

  /* шея и голова */
  limb(b, [0, H + 0.58, 0], [0, H + 0.7, 0.01], 0.05, skin, SKN);
  const HY = H + 0.82;
  b.add(sph(0.112), skin, SKN, M([0, HY, 0.01], [0, 0, 0], [0.93, 1.1, 1]));
  b.add(sph(0.06), skin, SKN, M([0, HY - 0.07, 0.04], [0, 0, 0], [1, 0.8, 1]));   // подбородок
  if (!LO) {
    b.add(sph(0.018), skin, SKN, M([0, HY - 0.005, 0.112]));                         // нос
    for (const sx of [-1, 1]) b.add(sph(0.025), skin, SKN, M([sx * 0.104, HY, 0], [0, 0, 0], [0.5, 1, 0.8]));
    b.add(G.cap(0.008, 0.035, 2, 6), f ? '#c0506a' : '#a0605a', SKN, M([0, HY - 0.058, 0.098], [0, 0, Math.PI / 2]));
  }
  const see = !look.glasses || look.glasses.kind === 'square' || look.glasses.kind === 'round';
  if (see && !LO) for (const sx of [-1, 1]) {
    b.add(sph(0.016), '#1a1210', SKN, M([sx * 0.042, HY + 0.012, 0.098]));
    b.add(rb(0.045, 0.011, 0.012, 0.005), look.hairC ?? '#1a1210', SKN, M([sx * 0.045, HY + 0.05, 0.1], [0, 0, -sx * 0.12]));
  }
  hairDo(b, look, HY, f);
  headwear(b, look, HY);
  if (look.glasses) glasses(b, look.glasses, HY);
  if (look.hoops) for (const sx of [-1, 1]) b.add(G.tor(0.028, 0.005, 5, 14), look.hoops, 'metal', M([sx * 0.11, HY - 0.05, 0.005], [0, Math.PI / 2, 0]));
  if (look.chain) {
    b.add(G.tor(0.115, 0.011, 6, seg(28, 14)), look.chain, 'metal', M([0, H + 0.55, 0.05], [Math.PI / 2 - 0.55, 0, 0], [1, 0.8, 1]));
    if (!LO) b.add(sph(0.025), look.chain, 'metal', M([0, H + 0.47, 0.135]));
  }

  /* руки */
  const S = H + 0.5, sw = f ? 0.17 : 0.2;
  for (const sx of [-1, 1]) {
    const [E, Hn] = ARMS[pose](sx, S);
    const Sh = [sx * sw, S, 0];
    const c1 = top === 'tee' ? look.topC : skin;
    limb(b, Sh, E, f ? 0.046 : 0.054, skin, SKN, f ? 0.04 : 0.046);
    if (top === 'tee') limb(b, Sh, V(...Sh).lerp(V(...E), 0.5), 0.07, c1, CL, 0.066);
    limb(b, E, Hn, f ? 0.04 : 0.046, skin, SKN, f ? 0.032 : 0.036);
    b.add(sph(f ? 0.05 : 0.064), skin, SKN, M(Sh, [0, 0, 0], [1, 0.85, 0.9]));
    b.add(sph(f ? 0.04 : 0.046), skin, SKN, M(Hn, [0, 0, 0], [0.85, 1.1, 0.7]));
    if (look.ink && sx > 0 && !LO) limb(b, V(...Sh).lerp(V(...E), 0.25), V(...E).lerp(V(...Hn), 0.8), f ? 0.047 : 0.055, '#2a2a3a', 'matte', f ? 0.041 : 0.047);
    if (look.rings && sx > 0) b.add(G.tor(0.04, 0.008, 5, 12), SILVER, 'metal', M(Hn, [Math.PI / 2, 0, 0]));
    if (pose === 'phone' && sx > 0) b.add(rb(0.08, 0.16, 0.015, 0.012), '#111', 'gloss', M([Hn[0], Hn[1] + 0.06, Hn[2] + 0.03], [0.4, 0, 0]));
    if (pose === 'count') b.add(G.box(0.16, 0.03, 0.08), '#7fa86a', 'matte', M([Hn[0] * 0.5, Hn[1] + 0.03, Hn[2] + 0.02]));
  }
  // распахнутая рубашка поверх (оверсайз)
  if (look.over && legs === 'stand') {
    for (const sx of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.2, 0.235, 0.6, seg(14, 8), 1, true, sx > 0 ? 0.35 : Math.PI, Math.PI * 0.62);
      g.scale(1, 1, 0.8); b.add(g, look.over.c, CL, M([0, H + 0.3, -0.005]));
    }
    lathe(b, [[0.2, H + 0.6], [0.12, H + 0.66]], look.over.c, CL, 0.75);
  }
  b.pop();
  LO = false;
}

function hairDo(b, L, HY, f) {
  const c = L.hairC ?? '#1a1210', K = 'gloss', st = L.hair ?? 'fade';
  const cap = (k = 1.04, lift = 0.03, back = -0.015) => b.add(sph(0.12), c, K, M([0, HY + lift, back], [0, 0, 0], [k * 0.96, k * 0.92, k]));
  if (st === 'buzz' || st === 'fade') { cap(st === 'fade' ? 1.0 : 0.98, 0.02, -0.01); if (st === 'fade') b.add(sph(0.1), c, K, M([0, HY + 0.07, 0.0], [0, 0, 0], [1, 0.6, 1.05])); return; }
  cap();
  if (st === 'long' || st === 'curlyLong') {
    limb(b, [0, HY + 0.02, -0.06], [0, HY - 0.48, -0.1], 0.11, c, K, 0.09);
    for (const sx of [-1, 1]) limb(b, [sx * 0.09, HY, 0.0], [sx * 0.11, HY - 0.36, 0.0], 0.04, c, K);
    if (st === 'curlyLong' && !LO) for (let i = 0; i < 8; i++) b.add(sph(0.06), c, K, M([Math.cos(i) * 0.12, HY - 0.1 - (i % 4) * 0.1, -0.08 + Math.sin(i * 2) * 0.03]));
  } else if (st === 'bun') b.add(sph(0.065), c, K, M([0, HY + 0.13, -0.04]));
  else if (st === 'pony') { b.add(sph(0.04), c, K, M([0, HY + 0.07, -0.11])); limb(b, [0, HY + 0.06, -0.14], [0, HY - 0.3, -0.18], 0.045, c, K, 0.02); }
  else if (st === 'braids') for (const sx of [-1, 1]) limb(b, [sx * 0.07, HY - 0.02, -0.08], [sx * 0.1, HY - 0.55, -0.06], 0.03, c, K, 0.02);
  else if (st === 'bob') { b.add(sph(0.13), c, K, M([0, HY - 0.01, -0.01], [0, 0, 0], [1.02, 0.95, 0.98])); b.add(rb(0.2, 0.05, 0.04, 0.02), c, K, M([0, HY + 0.07, 0.1])); }
  else if (st === 'afro') b.add(sph(0.17), c, K, M([0, HY + 0.06, -0.02], [0, 0, 0], [1.05, 0.95, 1]));
  else if (st === 'curly') for (let i = 0; i < (LO ? 6 : 13); i++) { const a = i * 2.4, r = 0.1; b.add(sph(0.05), c, K, M([Math.cos(a) * r, HY + 0.08 + Math.sin(i * 1.3) * 0.03, Math.sin(a) * r - 0.01])); }
  else if (st === 'twists') for (let i = 0; i < (LO ? 6 : 12); i++) { const a = i * 0.52; limb(b, [Math.cos(a) * 0.07, HY + 0.1, Math.sin(a) * 0.07 - 0.02], [Math.cos(a) * 0.11, HY + 0.16, Math.sin(a) * 0.11 - 0.02], 0.022, c, K); }
  else if (st === 'bowl') { b.add(sph(0.125), c, K, M([0, HY + 0.035, 0], [0, 0, 0], [1.06, 0.92, 1.06])); b.add(rb(0.21, 0.06, 0.05, 0.025), c, K, M([0, HY + 0.06, 0.1])); }
  else if (st === 'swept') { b.add(sph(0.12), c, K, M([0.02, HY + 0.07, 0.03], [0, 0, -0.3], [1.02, 0.6, 1.02])); }
}
function headwear(b, L, HY) {
  if (L.cap) {
    b.add(sph(0.125), L.cap.c, 'plastic', M([0, HY + 0.05, -0.005], [0, 0, 0], [1.0, 0.82, 1.04]));
    b.add(rb(0.2, 0.022, 0.15, 0.01), L.cap.c, 'plastic', M([0, HY + 0.06, 0.15], [L.cap.back ? 0 : -0.12, L.cap.back ? Math.PI : 0, 0]));
  }
  if (L.bucket) {
    b.add(G.cyl(0.11, 0.13, 0.1, seg(18, 10)), L.bucket, 'plastic', M([0, HY + 0.1, 0]));
    b.add(G.cyl(0.19, 0.19, 0.012, seg(22, 12)), L.bucket, 'plastic', M([0, HY + 0.05, 0], [0.08, 0, 0]));
  }
}
function glasses(b, gl, HY) {
  const y = HY + 0.02, z = 0.108, c = gl.c, lens = gl.lens ?? '#0a0a0e';
  if (gl.kind === 'wrap') { b.add(rb(0.23, 0.05, 0.03, 0.02), lens, 'gloss', M([0, y, z])); b.add(rb(0.235, 0.015, 0.035, 0.007), c, 'gloss', M([0, y + 0.03, z])); return; }
  for (const sx of [-1, 1]) {
    const w = gl.kind === 'round' ? 0.075 : gl.kind === 'cat' ? 0.085 : 0.08, h = gl.kind === 'shades' ? 0.05 : gl.kind === 'round' ? 0.065 : 0.055;
    b.add(rb(w + 0.016, h + 0.016, 0.014, 0.012), c, 'gloss', M([sx * 0.052, y, z], [0, 0, gl.kind === 'cat' ? -sx * 0.18 : 0]));
    b.add(rb(w, h, 0.016, 0.01), lens, gl.lens ? 'glass' : 'gloss', M([sx * 0.052, y, z + 0.004]));
    limb(b, [sx * 0.1, y + 0.01, z - 0.01], [sx * 0.112, y + 0.01, -0.02], 0.006, c, 'gloss');
  }
  b.add(G.box(0.03, 0.01, 0.01), c, 'gloss', M([0, y + 0.01, z + 0.002]));
}
