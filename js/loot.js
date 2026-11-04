// STAYA — предметы для сбора. Восемь штук по всему пути; найденный предмет исчезает, прогресс хранится в браузере.
// Каждый предмет — простая модель из примитивов + мягкое свечение; парит и медленно вращается (кроме лежащих).
import { THREE, rng } from './kit.js';

export const LOOT_TOTAL = 8;
const KEY = 'staya-loot-v1';
let got = new Set();
try { got = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { /* без хранилища — прогресс только в этой вкладке */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...got])); } catch (e) { /* ignore */ } };
export const lootCount = () => got.size;

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.35, metalness: o.m ?? 0, emissive: o.e ?? '#000000', emissiveIntensity: o.ei ?? 1 });
const GOLD = () => std('#ffcc4a', { r: 0.22, m: 1, e: '#5a3a00', ei: 0.6 });
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// модели, размеры в метрах
const MAKE = {
  // золотая пластинка с розовой «яблоком»
  vinyl() {
    const g = new THREE.Group();
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.012, 48), std('#121014', { r: 0.25 })); d.rotation.x = Math.PI / 2; g.add(d);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.014, 32), std('#ff3fb4', { e: '#ff3fb4', ei: 0.4 })); l.rotation.x = Math.PI / 2; g.add(l);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 48), GOLD()); g.add(r);
    return g;
  },
  // солнечные очки-сердечки
  glasses() {
    const g = new THREE.Group(), lens = std('#ff2f8a', { r: 0.1, e: '#ff2f8a', ei: 0.35 }), fr = std('#ffffff', { r: 0.3 });
    const hs = new THREE.Shape(); hs.moveTo(0, -0.06); hs.bezierCurveTo(-0.1, 0.0, -0.06, 0.08, 0, 0.035); hs.bezierCurveTo(0.06, 0.08, 0.1, 0.0, 0, -0.06);
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.015, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2 }), lens); m.position.x = sx * 0.085; g.add(m); }
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.012), fr); br.position.set(0, 0.03, 0.01); g.add(br);
    for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.16), fr); a.position.set(sx * 0.17, 0.03, -0.07); g.add(a); }
    g.scale.setScalar(1.6); return g;
  },
  // закрытый презерватив в фольге: маленький квадрат с выпуклым кольцом
  condom() {
    const g = new THREE.Group();
    const foil = new THREE.MeshStandardMaterial({ color: '#c8c8d8', roughness: 0.18, metalness: 1, map: canvasTex(128, 128, (x, w) => {
      x.fillStyle = '#ff4fb8'; x.fillRect(0, 0, w, w); x.fillStyle = '#ffffff'; x.font = '900 22px Unbounded, sans-serif'; x.textAlign = 'center'; x.fillText('STAYA', w / 2, w - 14);
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 4; for (let i = 6; i < w; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 6); x.moveTo(i, w - 6); x.lineTo(i, w); x.stroke(); }
    }) });
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.004, 0.07), foil); g.add(p);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 24), foil); ring.rotation.x = Math.PI / 2; ring.position.y = 0.003; g.add(ring);
    return g;
  },
  // золотой баскетбольный мяч
  ball() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 18), GOLD()));
    for (const r of [0, Math.PI / 2]) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.171, 0.006, 6, 40), std('#2a1a08')); s.rotation.y = r; g.add(s); }
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.171, 0.006, 6, 40), std('#2a1a08')); e.rotation.x = Math.PI / 2; g.add(e);
    return g;
  },
  // кассета 2017-го
  cassette() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.19, 0.035), std('#1a1a22', { r: 0.4 })));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 100, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ff3fb4'); gr.addColorStop(1, '#21e0ff'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = '#fff'; x.font = '900 34px Unbounded, sans-serif'; x.textAlign = 'center'; x.fillText('2K17', w / 2, 40); x.fillStyle = '#1a1a22'; x.fillRect(40, 56, w - 80, 34);
    }) }));
    lab.position.set(0, 0.02, 0.0185); g.add(lab);
    for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 16), std('#ffffff')); r.rotation.x = Math.PI / 2; r.position.set(sx * 0.055, 0.003, 0); g.add(r); }
    return g;
  },
  // золотой микрофон
  mic() {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshStandardMaterial({ color: '#d8d8e0', roughness: 0.3, metalness: 1, wireframe: false })); head.position.y = 0.2; g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 8, 28), GOLD()); ring.rotation.x = Math.PI / 2; ring.position.y = 0.16; g.add(ring);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.028, 0.28, 18), GOLD()); body.position.y = 0.02; g.add(body);
    return g;
  },
  // тыква-фонарь со светящимся лицом
  pumpkin() {
    const g = new THREE.Group();
    const face = canvasTex(256, 128, (x, w, h) => {
      x.fillStyle = '#e8641a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffe07a';
      for (const cx of [0.36, 0.64]) { x.beginPath(); x.moveTo(w * cx - 14, h * 0.48); x.lineTo(w * cx, h * 0.3); x.lineTo(w * cx + 14, h * 0.48); x.fill(); }
      x.beginPath(); x.moveTo(w * 0.35, h * 0.62); for (let i = 0; i <= 6; i++) x.lineTo(w * (0.35 + i * 0.05), h * (i % 2 ? 0.74 : 0.64)); x.lineTo(w * 0.65, h * 0.62); x.quadraticCurveTo(w / 2, h * 0.86, w * 0.35, h * 0.62); x.fill();
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 18), new THREE.MeshStandardMaterial({ map: face, emissive: '#ffffff', emissiveMap: face, emissiveIntensity: 0.25, roughness: 0.55 }));
    body.scale.set(1, 0.78, 1); body.rotation.y = -Math.PI / 2; g.add(body);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 8), std('#3a5a1a')); st.position.y = 0.18; g.add(st);
    return g;
  },
  // кокос с трубочкой и зонтиком
  coconut() {
    const g = new THREE.Group();
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), std('#6a4024', { r: 0.8 })); g.add(nut);
    const cut = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), std('#f4efe2')); cut.rotation.x = -Math.PI / 2; cut.position.y = 0.112; g.add(cut);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), std('#ff3fb4')); straw.position.set(0.03, 0.22, 0); straw.rotation.z = -0.3; g.add(straw);
    const um = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.05, 8, 1, true), std('#21e0ff', { r: 0.6 })); um.material.side = THREE.DoubleSide; um.position.set(-0.05, 0.3, 0); um.rotation.z = 0.35; g.add(um);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.24, 6), std('#f4efe2')); pole.position.set(-0.035, 0.2, 0); pole.rotation.z = 0.35; g.add(pole);
    return g;
  },
};

let _glow;
function glowTex() {
  if (_glow) return _glow;
  _glow = canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,240,200,.9)'); g.addColorStop(0.35, 'rgba(255,120,210,.35)'); g.addColorStop(1, 'rgba(255,120,210,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  return _glow;
}

// addLoot(scene, id, kind, p, o) — o.lie: лежит (не парит и не вращается), o.r: радиус области нажатия, o.ry, o.glow — размер свечения
export function addLoot(scene, id, kind, p, o = {}) {
  if (got.has(id)) return null;
  const root = new THREE.Group(); root.position.set(...p); root.rotation.y = o.ry ?? 0;
  const item = MAKE[kind](); root.add(item);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.scale.setScalar(o.glow ?? 0.9); glow.position.y = o.lie ? 0.05 : 0; root.add(glow);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(o.r ?? 0.6, 8, 6), new THREE.MeshBasicMaterial()); hit.visible = false; hit.userData.lootHit = true; root.add(hit);
  root.traverse((c) => (c.userData.dynamic = true));
  root.userData.loot = { id, item, glow, lie: !!o.lie, base: root.position.y, ph: rng(id.length * 7)() * 6, gone: 0 };
  (scene.userData.loot ||= []).push(root); scene.add(root);
  return root;
}

// каждый кадр: парят, вращаются, мерцают; собранные улетают вверх и тают
export function lootTick(scene, now) {
  for (const r of scene.userData.loot || []) {
    const L = r.userData.loot;
    if (L.gone) {
      const k = Math.min(1, (now - L.gone) / 0.6); r.position.y = L.base + k * 1.2; r.scale.setScalar(1 - k * 0.9); L.glow.material.opacity = 1 - k;
      if (k >= 1) r.visible = false; continue;
    }
    if (!L.lie) { r.position.y = L.base + Math.sin(now * 2 + L.ph) * 0.06; L.item.rotation.y = now * 1.2 + L.ph; }
    L.glow.material.opacity = 0.65 + 0.35 * Math.sin(now * 3.2 + L.ph);
  }
}

// попадание луча: id предмета или null
export function lootAt(ray, scene) {
  const list = (scene?.userData.loot || []).filter((r) => r.visible && !r.userData.loot.gone);
  if (!list.length) return null;
  const hits = ray.intersectObjects(list, true).filter((h) => h.object.userData.lootHit);
  if (!hits.length) return null;
  let o = hits[0].object; while (o && !o.userData.loot) o = o.parent;
  return o;
}

export function collect(root, now) {
  const L = root.userData.loot; if (L.gone || got.has(L.id)) return got.size;
  L.gone = now; got.add(L.id); save(); return got.size;
}
