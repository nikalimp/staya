// STAYA — люди. Пять резидентов и двадцать гостей, одни и те же на всех сценах.
// Тела и причёски — Quaternius Universal Base Characters (CC0), позы — Quaternius Universal Animation Library (CC0).
// Позы запечены в Blender (scripts/blender/people_build.py) в world/people/people_M|F.glb:
//   тело в позе (цвет вершин + область в альфе: кожа, бельё/бикини, глаза, волосы, майка, шорты), майка и шорты оболочками,
//   упрощённая копия для толпы, якоря костей (голова, грудь, кисти) для причёсок и аксессуаров.
// person(b, look, o) кладёт человека в Builder; при b.build() все люди сцены собираются в InstancedMesh — мало вызовов отрисовки.
// Вид: тёмные силуэты с неоновым контровым светом (цвет — b.rim сцены) и огоньками телефонов в поднятых руках.
//   o.p [x,y,z] — ноги; o.ry — поворот (лицо в +Z при ry=0); o.pose — поза; o.s — масштаб; o.lo — упрощённая копия для толпы.
import { THREE, G, M, V, Builder, loadGLB, glowPoints as kit_glow } from './kit.js';

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

/* ---------- загрузка запечённых поз ---------- */
const DATA = { M: null, F: null };
function toFloat(mesh) {
  const g = mesh.geometry, out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) {
    const a = g.attributes[k], f = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
    out.setAttribute(k, new THREE.BufferAttribute(f, 3));
  }
  const c = g.attributes.color, cf = new Float32Array(c.count * 4);
  for (let i = 0; i < c.count; i++) { cf[i * 4] = c.getX(i); cf[i * 4 + 1] = c.getY(i); cf[i * 4 + 2] = c.getZ(i); cf[i * 4 + 3] = c.getW(i); }
  out.setAttribute('color', new THREE.BufferAttribute(cf, 4));
  if (g.index) out.setIndex(g.index.clone());
  mesh.updateWorldMatrix(true, false); out.applyMatrix4(mesh.matrixWorld);
  out.computeBoundingSphere(); return out;
}
// люди временно выключены: модели не подошли, ищем другую подачу толпы
export const PEOPLE_ON = false;
export async function loadPeople() {
  if (!PEOPLE_ON) return;
  for (const S of ['M', 'F']) {
    const gl = await loadGLB(`world/people/people_${S}.glb`); gl.scene.updateMatrixWorld(true);
    const geo = {}, anchor = {};
    gl.scene.traverse((o) => {
      if (!o.name) return;
      if (o.name.includes('_@')) { anchor[o.name] = o.matrixWorld.clone(); return; }
      const m = o.isMesh ? o : o.children.find((c) => c.isMesh);
      if (m) geo[o.name] = toFloat(m);
    });
    DATA[S] = { geo, anchor };
  }
}

/* ---------- образ → параметры отрисовки ---------- */
const HAIR_MAP = { M: { buzz: 'Buzzed', fade: 'Buzzed', curly: 'SimpleParted', twists: 'Buzzed', swept: 'SimpleParted', bowl: 'SimpleParted' },
  F: { long: 'Long', curlyLong: 'Long', braids: 'Long', bob: 'Long', bun: 'Buns', pony: 'Buns', afro: 'Buns', buzz: 'BuzzedFemale' } };
const POSE_MAP = { stand: 'idle', peace: 'wave', cross: 'hips', relax: 'sit', behindHead: 'sit', neck: 'hug', hold: 'phone', up: 'up', wave: 'wave', dj: 'dj',
  phone: 'phone', hips: 'hips', hug: 'hug', count: 'count', sit: 'sit', idle: 'idle', talk: 'talk', dance_a: 'dance_a', dance_b: 'dance_b', dance_c: 'dance_c', swim: 'swim', drive: 'drive', sit_talk: 'sit_talk' };
const BASE_SKIN = new THREE.Color('#efc3a1');
const col = (h) => new THREE.Color(h);
function resolve(look, o) {
  const S = look.sex === 'f' ? 'F' : 'M';
  let pose = POSE_MAP[o.pose] ?? 'idle';
  if (o.legs === 'sit' || o.legs === 'feetUp') pose = pose === 'talk' ? 'sit_talk' : 'sit';
  const sk = col(look.skin ?? '#ecbf9f'); const skin = new THREE.Color(sk.r / BASE_SKIN.r, sk.g / BASE_SKIN.g, sk.b / BASE_SKIN.b);
  const topC = look.top && look.top !== 'none' && look.top !== 'bikini' ? col(look.topC) : null;
  const shorts = look.bottom === 'shorts' || look.bottom === 'cargo' || (S === 'M' && look.bottom !== 'bikini' && look.bottomC) ? col(look.bottomC ?? '#222') : null;
  const cloth = col(look.top === 'bikini' ? look.topC : (look.bottomC ?? '#111'));
  const hair = HAIR_MAP[S][look.hair] ?? (S === 'M' ? 'Buzzed' : 'Long');
  return { S, pose, skin, cloth, top: topC, shorts, hair, hairC: col(look.hairC ?? '#1a1210') };
}

export function person(b, look, o = {}) {
  if (!PEOPLE_ON) return;
  (b.people ||= []).push({ look, o: { ...o }, base: b.stack[b.stack.length - 1].clone() });
}

/* ---------- аксессуары: в пространстве «позы покоя», ведутся якорем кости ---------- */
const HEAD = { M: { eye: [0, 1.675, 0.098], top: 1.83 }, F: { eye: [0, 1.628, 0.092], top: 1.775 } };
const CHEST = { M: [0, 1.47, 0.05], F: [0, 1.405, 0.045] };
const merge = (parts) => { const b = new Builder(); parts(b); const g = b.build().children[0].geometry; g.deleteAttribute('color'); return g; };
const ACC = {};
function accGeo(kind, S) {
  const key = kind + S; if (ACC[key]) return ACC[key];
  const [ex, ey, ez] = HEAD[S].eye, ht = HEAD[S].top;
  const f = {
    frame: (b) => { for (const sx of [-1, 1]) b.add(G.rbox(0.078, 0.052, 0.012, 0.012), '#fff', 'gloss', M([ex + sx * 0.043, ey, ez + 0.012])); b.add(G.box(0.03, 0.008, 0.008), '#fff', 'gloss', M([ex, ey + 0.008, ez + 0.012]));
      for (const sx of [-1, 1]) b.add(G.box(0.006, 0.006, 0.12), '#fff', 'gloss', M([ex + sx * 0.082, ey + 0.008, ez - 0.05])); },
    lens: (b) => { for (const sx of [-1, 1]) b.add(G.rbox(0.068, 0.044, 0.01, 0.01), '#fff', 'gloss', M([ex + sx * 0.043, ey, ez + 0.016])); },
    cap: (b) => { b.add(G.sph(0.112, 18, 10), '#fff', 'plastic', M([ex, ht - 0.07, ez - 0.085], [0, 0, 0], [1.02, 0.78, 1.06])); b.add(G.rbox(0.19, 0.016, 0.13, 0.008), '#fff', 'plastic', M([ex, ht - 0.075, ez + 0.06], [-0.12, 0, 0])); },
    capBack: (b) => { b.add(G.sph(0.112, 18, 10), '#fff', 'plastic', M([ex, ht - 0.07, ez - 0.085], [0, 0, 0], [1.02, 0.78, 1.06])); b.add(G.rbox(0.19, 0.016, 0.13, 0.008), '#fff', 'plastic', M([ex, ht - 0.085, ez - 0.22], [0.12, 0, 0])); },
    bucket: (b) => { b.add(G.cyl(0.105, 0.125, 0.1, 18), '#fff', 'plastic', M([ex, ht - 0.03, ez - 0.09])); b.add(G.cyl(0.18, 0.18, 0.01, 22), '#fff', 'plastic', M([ex, ht - 0.075, ez - 0.09], [0.06, 0, 0])); },
    chain: (b) => { const [cx, cy, cz] = CHEST[S]; b.add(G.tor(0.105, 0.009, 6, 28), '#fff', 'metal', M([cx, cy, cz], [Math.PI / 2 - 0.5, 0, 0], [1, 0.85, 1])); b.add(G.sph(0.022, 10, 8), '#fff', 'metal', M([cx, cy - 0.085, cz + 0.07])); },
  }[kind];
  return (ACC[key] = merge(f));
}

/* ---------- материал силуэта: почти чёрное тело + неоновый контур по краю (френель) ---------- */
let BODY_MAT = null;
function bodyMat() {
  if (BODY_MAT) return BODY_MAT;
  const m = new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.9, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      attribute vec3 iRim; varying vec3 vRim;`).replace('#include <begin_vertex>', `#include <begin_vertex>
      vRim = iRim;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vRim;`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float fr = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
      totalEmissiveRadiance += vRim * pow(fr, 4.5) * 1.6;`);
  };
  return (BODY_MAT = m);
}
const ACC_MAT = { gloss: () => new THREE.MeshPhysicalMaterial({ roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }), plastic: () => new THREE.MeshStandardMaterial({ color: 0x07060b, roughness: 0.55 }),
  metal: () => new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 1 }), lens: () => new THREE.MeshPhysicalMaterial({ roughness: 0.05, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.85 }) };
const ACC_KIND = { frame: 'gloss', lens: 'lens', cap: 'plastic', capBack: 'plastic', bucket: 'plastic', chain: 'metal' };

/* ---------- сборка: все люди сцены → InstancedMesh по видам геометрии ---------- */
const _m = new THREE.Matrix4(), _e = new THREE.Matrix4();
Builder.peopleBuild = (list, builder) => {
  const RIM = (builder?.rim ?? ['#ff3fb4', '#2fe6ff', '#8a5cff']).map((h) => col(h)), phones = [], _p = new THREE.Vector3();
  const group = new THREE.Group(); group.name = 'people';
  if (!DATA.M) { console.warn('[staya] people not loaded'); return group; }
  const buckets = new Map();
  const put = (key, geoFn, mat, matrix, attrs) => {
    if (!buckets.has(key)) buckets.set(key, { geoFn, mat, mats: [], attrs: [] });
    const bk = buckets.get(key); bk.mats.push(matrix); bk.attrs.push(attrs);
  };
  let n = 0;
  for (const { look, o, base } of list) {
    const rim = RIM[n % RIM.length]; n++;
    const r = resolve(look, o), D = DATA[r.S], P = `${r.S}_${r.pose}`;
    const pm = base.clone().multiply(M(o.p ?? [0, 0, 0], [0, o.ry ?? 0, 0], (o.s ?? 1) * (r.S === 'F' ? 0.95 : 0.97)));
    // детализация: резиденты — полная, гости — средняя, толпа вдали (o.lo) — упрощённая
    const lod = o.lo ? '_lo' : '_mid', lo = lod === '_lo';
    const tint = { iRim: rim };
    const bk = D.geo[P + lod] ? P + lod : P; put(bk, () => D.geo[bk], 'body', pm, tint);
    const head = pm.clone().multiply(D.anchor[P + '_@Head'] ?? _e.identity());
    const hk = `${r.S}_hair_${r.hair}` + (lo && D.geo[`${r.S}_hair_${r.hair}_lo`] ? '_lo' : ''); if (D.geo[hk]) put(hk, () => D.geo[hk], 'body', head, tint);
    if (look.hair === 'buzz' && r.S === 'M' && look.beard) put(`M_hair_Beard`, () => D.geo.M_hair_Beard, 'body', head, tint);
    // силуэт: кепки и панамы меняют контур, очки и цепи не видны
    const acc = (kind) => put(kind + r.S, () => accGeo(kind, r.S), ACC_KIND[kind], head, { c: col('#07060b') });
    if (look.cap) acc(look.cap.back ? 'capBack' : 'cap');
    if (look.bucket) acc('bucket');
    // огонёк телефона в поднятой руке — у каждого третьего, кто танцует с руками вверх или снимает
    const hr = D.anchor[`${r.S}_rest_@hand_r`];
    if (hr && (r.pose === 'phone' || ((r.pose === 'up' || r.pose === 'wave') && n % 3 === 0))) {
      _p.setFromMatrixPosition(hr).applyMatrix4(D.anchor[P + '_@hand_r'] ?? _e.identity()).applyMatrix4(pm);
      phones.push([_p.x, _p.y + 0.06, _p.z, '#e8f4ff', 0.35, 2.2]);
    }
  }
  for (const [key, bk] of buckets) {
    const src = bk.geoFn(); if (!src) continue;
    const g = new THREE.BufferGeometry();
    for (const k of Object.keys(src.attributes)) g.setAttribute(k, src.attributes[k]);
    if (src.index) g.setIndex(src.index);
    const n = bk.mats.length;
    let mat;
    if (bk.mat === 'body') {
      for (const k of ['iRim']) {
        const a = new Float32Array(n * 3); bk.attrs.forEach((t, i) => t[k].toArray(a, i * 3));
        g.setAttribute(k, new THREE.InstancedBufferAttribute(a, 3));
      }
      mat = bodyMat();
    } else mat = (ACC_MAT['_' + bk.mat] ||= ACC_MAT[bk.mat]());
    const im = new THREE.InstancedMesh(g, mat, n);
    bk.mats.forEach((mm, i) => { im.setMatrixAt(i, mm); if (bk.mat !== 'body') im.setColorAt(i, bk.attrs[i].c); });
    im.computeBoundingSphere(); im.frustumCulled = true; im.userData.dynamic = false;
    group.add(im);
  }
  if (phones.length) group.add(kit_glow(phones));
  return group;
};
export const POSES = Object.keys(POSE_MAP);
