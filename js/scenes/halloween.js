import { addLoot } from '../loot.js';
// 04 · STAYA HALLOWEEN — дворец XIX века: высокий зал, галереи второго этажа, парадная лестница.
// Двери распахиваются → зал с люстрами и картинами → вокруг фонтана → вверх по лестнице к пульту на площадке →
// заходим за пульт, и начинается мистика: гаснет свет и музыка, при каждой вспышке девочка ближе,
// в третий раз она стоит перед нами и протягивает телефон с постом про Пхукет — камера ныряет в экран.
export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080203');
  scene.fog = new THREE.FogExp2('#1c0605', 0.018);
  scene.environment = kit.env(renderer, ['#ff2a14', '#ff8a2a', '#ffd28a', '#3b4bff', '#8a0d1a'], '#070203');
  const b = new Builder(), glows = [], props = [], R = kit.rng(31);
  const STONE = '#d9c7a4', GOLD = '#c9a24a', RED = '#7e0a16', WALL = '#bfa07e';
  const Z1 = 24.6, Z2 = -31, L0 = Z1 - Z2, C0 = (Z1 + Z2) / 2;
  const FZ = -3;                              // фонтан в центре зала
  const WH = 34, VY = 32;                     // высота стен и центр свода — потолки выше прежнего
  const SZ0 = -12, LZ = -20, LY = 5, LZ2 = -27.5, BZ = -23.4;   // лестница: низ, край площадки, высота площадки, задний край, пульт

  /* --- пол-шахматка и красные дорожки, обходящие фонтан --- */
  const chk = kit.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#e9e2d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#16100e'; x.fillRect(0, 0, w / 2, h / 2); x.fillRect(w / 2, h / 2, w / 2, h / 2); }, { repeat: [20, 28] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, L0), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.22, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, C0); scene.add(floor);
  const runner = (z0, z1) => {
    b.add(G.box(6, 0.03, z0 - z1), RED, 'matte', M([0, 0.015, (z0 + z1) / 2]));
    for (const sx of [-3, 3]) b.add(G.box(0.15, 0.035, z0 - z1), GOLD, 'metal', M([sx, 0.02, (z0 + z1) / 2]));
  };
  runner(Z1, FZ + 7.5); runner(FZ - 7.5, SZ0);
  b.add(G.cyl(8.4, 8.4, 0.03, 64), RED, 'matte', M([0, 0.015, FZ]));
  b.add(G.tor(8.4, 0.07, 6, 64), GOLD, 'metal', M([0, 0.03, FZ], [Math.PI / 2, 0, 0]));

  /* --- стены и свод --- */
  for (const sx of [-1, 1]) b.add(G.box(1, WH, L0), WALL, 'matte', M([sx * 20.5, WH / 2, C0]));
  b.add(G.box(42, WH, 1), WALL, 'matte', M([0, WH / 2, Z2 - 0.5]));
  b.add(new THREE.CylinderGeometry(20.5, 20.5, L0, 48, 1, true, Math.PI / 2, Math.PI), '#5a3020', 'matte', M([0, VY, C0], [Math.PI / 2, 0, 0], [1, 1, 0.35]));   // только верхняя половина: нижняя закрывала роспись
  for (let z = Z1 - 2; z >= Z2 + 2; z -= 6) b.add(G.tor(20.3, 0.2, 5, 40, Math.PI), GOLD, 'metal', M([0, VY, z], [0, 0, 0], [1, 0.35, 1]));
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 7) {
    b.add(G.box(0.1, 9, 3), '#2f3cff', 'neon', M([sx * 19.95, 20.5, z]));
    b.add(G.cyl(1.5, 1.5, 0.1, 18, false), '#2f3cff', 'neon', M([sx * 19.95, 25, z], [0, 0, Math.PI / 2]));
    glows.push([sx * 19, 21, z, '#3b4bff', 7, 0.35]);
    for (const dz of [-1.9, 1.9]) b.add(G.cyl(0.3, 0.42, 13, 8), '#6a0612', 'plastic', M([sx * 19.6, 19.5, z + dz]));
  }
  /* --- отделка: шёлк с узором-дамаском, деревянные панели внизу, расписной свод --- */
  const damask = kit.canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4a0c14'; x.fillRect(0, 0, w, h);
    const motif = (cx, cy, s2) => {
      x.save(); x.translate(cx, cy); x.scale(s2, s2); x.fillStyle = '#7a2228';
      x.beginPath(); x.moveTo(0, -120); x.bezierCurveTo(60, -80, 70, -20, 20, 10); x.bezierCurveTo(80, 0, 90, 70, 0, 120); x.bezierCurveTo(-90, 70, -80, 0, -20, 10); x.bezierCurveTo(-70, -20, -60, -80, 0, -120); x.fill();
      x.fillStyle = '#4a0c14'; x.beginPath(); x.ellipse(0, 20, 18, 40, 0, 0, 7); x.fill();
      x.strokeStyle = '#a8742e'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -120); x.lineTo(0, 120); x.stroke(); x.restore();
    };
    for (const [cx, cy] of [[128, 128], [384, 384], [384, -128], [-128, 384], [640, 384], [384, 640], [128, 640], [640, 128]]) motif(cx, cy, 0.9);
  });
  damask.wrapS = damask.wrapT = THREE.RepeatWrapping;
  const wallM = (w, h) => { const t2 = damask.clone(); t2.needsUpdate = true; t2.repeat.set(w / 2.6, h / 2.6); return new THREE.MeshStandardMaterial({ map: t2, roughness: 0.55, metalness: 0.15 }); };
  const panelT = kit.canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#2a120a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a24a'; x.lineWidth = 6; x.strokeRect(24, 24, w - 48, h - 48);
    const g = x.createLinearGradient(0, 30, 0, h - 30); g.addColorStop(0, '#4a2412'); g.addColorStop(1, '#22100a'); x.fillStyle = g; x.fillRect(30, 30, w - 60, h - 60);
  });
  panelT.wrapS = THREE.RepeatWrapping;
  const plane = (w, h, mat, p, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(...p); m.rotation.y = ry; scene.add(m); return m; };
  for (const sx of [-1, 1]) {
    plane(L0, WH - 3, wallM(L0, WH - 3), [sx * 19.985, (WH + 3) / 2, C0], -sx * Math.PI / 2);
    const pt = panelT.clone(); pt.needsUpdate = true; pt.repeat.set(L0 / 4, 1);
    plane(L0, 3, new THREE.MeshStandardMaterial({ map: pt, roughness: 0.35 }), [sx * 19.98, 1.5, C0], -sx * Math.PI / 2);
  }
  plane(40, WH - 3, wallM(40, WH - 3), [0, (WH + 3) / 2, Z2 + 0.015], 0);
  { const pt = panelT.clone(); pt.needsUpdate = true; pt.repeat.set(10, 1); plane(40, 3, new THREE.MeshStandardMaterial({ map: pt, roughness: 0.35 }), [0, 1.5, Z2 + 0.02], 0); }
  // свод: небо в закатных облаках с золотыми кессонами
  const fresco = kit.canvasTex(2048, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#1a0806'); g.addColorStop(0.3, '#6a2a1a'); g.addColorStop(0.5, '#c8784a'); g.addColorStop(0.7, '#6a2a1a'); g.addColorStop(1, '#1a0806');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const C = kit.rng(8);
    for (let i = 0; i < 160; i++) { const cx = w * (0.22 + C() * 0.56), cy = C() * h, r = 40 + C() * 140; const cg = x.createRadialGradient(cx, cy, 0, cx, cy, r); cg.addColorStop(0, `rgba(255,${190 + C() * 50 | 0},${140 + C() * 60 | 0},.22)`); cg.addColorStop(1, 'rgba(255,200,150,0)'); x.fillStyle = cg; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
    x.strokeStyle = 'rgba(201,162,74,.85)'; x.lineWidth = 10;
    for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(0, (i / 12) * h); x.lineTo(w, (i / 12) * h); x.stroke(); }
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo((i / 16) * w, 0); x.lineTo((i / 16) * w, h); x.stroke(); }
  });
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(20.35, 20.35, L0, 64, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: fresco, emissive: '#ffffff', emissiveMap: fresco, emissiveIntensity: 0.75, roughness: 0.8, side: THREE.BackSide }));
  vault.position.set(0, VY, C0); vault.rotation.x = Math.PI / 2; vault.scale.set(1, 1, 0.35); scene.add(vault);

  /* --- галереи второго этажа: к ним ведут боковые марши парадной лестницы --- */
  for (const sx of [-1, 1]) {
    b.add(G.box(9, 0.8, L0), '#8a6a50', 'plastic', M([sx * 16.5, 10, C0]));
    b.add(G.box(0.3, 0.2, L0), GOLD, 'metal', M([sx * 12, 10.45, C0]));
    for (let z = Z2 + 1; z <= Z1 - 1; z += 0.7) b.add(G.cyl(0.08, 0.12, 1, 6), STONE, 'gloss', M([sx * 12, 10.9, z]));
    b.add(G.box(0.4, 0.15, L0), STONE, 'gloss', M([sx * 12, 11.45, C0]));
    for (let z = -22; z <= 18; z += 10) glows.push([sx * 12, 12.2, z, '#ffb15a', 1.4, 1.6]);
  }
  // колонны — одна мраморная модель (Sketchfab «Classical Marble Column», CC BY), по обоим этажам
  for (const sx of [-1, 1]) for (let z = -24; z <= 20; z += 8.8) {
    props.push(kit.prop(scene, 'sf_column', { p: [sx * 12, 0, z], h: 9.6 }));
    props.push(kit.prop(scene, 'sf_column', { p: [sx * 12, 11.5, z], h: 12 }));
  }
  /* --- люстры (Poly Haven, CC0) --- */
  [['Chandelier_01', 14], ['Chandelier_02', 3], ['Chandelier_03', -14]].forEach(([n, z]) => {
    kit.rod(b, [0, VY, z], [0, 22.1, z], 0.05, GOLD, 'metal');
    props.push(kit.prop(scene, n, { p: [0, 22.2, z], s: 6.2, anchor: 'top', emissive: '#ffb15a', ei: 0.35 }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; glows.push([Math.cos(a) * 1.4, 20.2, z + Math.sin(a) * 1.4, '#ffc27a', 0.6, 2]); }
    glows.push([0, 19.8, z, '#ffb15a', 7, 0.5]);
  });
  for (const sx of [-1, 1]) for (const z of [-12, 6]) {
    props.push(kit.prop(scene, 'lantern_chandelier_01', { p: [sx * 16.5, 9.6, z], s: 2.3, anchor: 'top', emissive: '#ffb15a', ei: 0.3 }));
    glows.push([sx * 16.5, 8.4, z, '#ffc27a', 2.2, 0.8]);
  }
  for (const [sx, z] of [[-1, -14], [-1, 13], [1, -12], [1, 10]]) props.push(kit.prop(scene, 'GothicCabinet_01', { p: [sx * 19.2, 0, z], ry: -sx * Math.PI / 2, s: 2.1 }));

  /* --- картины: полотна Cleveland Museum of Art (CC0) в рамах Poly Haven; видео в раме на левой стене --- */
  const ART = ['149108', '124089', '125247', '141549', '143206', '122349', '149104', '147479'];
  const art = (i, p, ry, h) => props.push(kit.painting(scene, `world/art/cma_${ART[i % ART.length]}.webp`, { p, ry, h }));
  props.push(kit.painting(scene, 'video/halloween-v.mp4', { video: true, p: [-19.85, 5.6, -1], ry: Math.PI / 2, h: 7.6 }));
  [[-1, -19], [-1, 15], [1, -19], [1, -1], [1, 15]].forEach(([sx, z], i) => art(i, [sx * 19.9, 4.8, z], sx < 0 ? Math.PI / 2 : -Math.PI / 2, 4.6));
  for (const sx of [-1, 1]) art(sx < 0 ? 5 : 6, [sx * 14.5, 22, Z2 + 0.1], 0, 6.5);
  art(7, [0, 22, Z1 - 0.5], Math.PI, 5.5);

  /* --- парадный вход --- */
  b.add(G.box(17.8, WH, 0.8), WALL, 'matte', M([-12.1, WH / 2, Z1])); b.add(G.box(17.8, WH, 0.8), WALL, 'matte', M([12.1, WH / 2, Z1]));
  b.add(G.box(6.4, WH - 8.5, 0.8), WALL, 'matte', M([0, 8.5 + (WH - 8.5) / 2, Z1]));
  const front = kit.grandDoor(scene, b, [0, 0, Z1], 0, 1);
  b.add(G.box(6, 0.04, 0.1), '#ff8a2a', 'neon', M([0, 0.03, Z1 - 0.3]));

  /* --- фонтан в центре зала (Sketchfab «Fountain with three putts, Brno», CC BY) --- */
  b.add(G.cyl(5.2, 5.4, 0.9, 48), STONE, 'gloss', M([0, 0.45, FZ]));
  b.add(G.tor(5.2, 0.25, 8, 48), STONE, 'gloss', M([0, 0.9, FZ], [Math.PI / 2, 0, 0]));
  const fw = kit.water(9.6, 9.6, '#1a6a8a', { tile: 2, ei: 0.4, emissive: '#2a8ac0', opacity: 0.85 });
  fw.geometry.dispose(); fw.geometry = new THREE.CircleGeometry(5.0, 48); fw.position.set(0, 0.78, FZ); scene.add(fw);
  props.push(kit.prop(scene, 'sf_fountain', { p: [0, 0.75, FZ], h: 5.2 }));
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; glows.push([Math.cos(a) * 4.4, 0.95, FZ + Math.sin(a) * 4.4, '#7fd8ff', 0.9, 1.2]); }

  /* --- парадная лестница: центральный марш к площадке с пультом, боковые марши — на галереи --- */
  const NS = 25, RISE = LY / NS, RUN = (SZ0 - LZ) / NS;
  for (let i = 0; i < NS; i++) {
    const y = (i + 1) * RISE, z = SZ0 - i * RUN - RUN / 2;
    b.add(G.box(8, y, RUN), STONE, 'gloss', M([0, y / 2, z]));
    b.add(G.box(5.4, 0.03, RUN + 0.02), RED, 'matte', M([0, y + 0.015, z]));
  }
  b.add(G.box(22, LY, LZ - LZ2), STONE, 'gloss', M([0, LY / 2, (LZ + LZ2) / 2]));
  b.add(G.box(16, 0.03, LZ - LZ2 - 0.6), RED, 'matte', M([0, LY + 0.015, (LZ + LZ2) / 2]));
  b.add(G.box(22, 0.25, 0.3), GOLD, 'metal', M([0, LY - 0.1, LZ + 0.1]));
  const GY = 10.4, NS2 = Math.round((GY - LY) / RISE), RUN2 = 12 / NS2;
  for (const sx of [-1, 1]) {
    for (let i = 0; i < NS2; i++) {
      const y = LY + (i + 1) * RISE, z = LZ + i * RUN2 + RUN2 / 2;
      b.add(G.box(3.6, 0.3, RUN2), STONE, 'gloss', M([sx * 8.6, y - 0.15, z]));
      b.add(G.box(2.4, 0.03, RUN2 + 0.02), RED, 'matte', M([sx * 8.6, y + 0.015, z]));
    }
    // косоур под маршем и мостик на галерею
    const ang = Math.atan2(GY - LY, 12), len = Math.hypot(GY - LY, 12);
    b.add(G.box(3.6, 0.5, len), STONE, 'gloss', M([sx * 8.6, (LY + GY) / 2 - 0.45, LZ + 6], [-ang, 0, 0]));
    b.add(G.box(5.4, 0.8, 3.2), STONE, 'gloss', M([sx * 9.5, GY - 0.4, LZ + 12 + 1.6]));
    // перила с балясинами и золотым поручнем
    for (const ex of [6.8, 10.4]) {
      const rl = [];
      for (let i = 0; i <= NS2; i += 3) { const y = LY + i * RISE, z = LZ + i * RUN2; rl.push([sx * ex, y + 1.05, z]); b.add(G.cyl(0.06, 0.1, 1.0, 8), STONE, 'gloss', M([sx * ex, y + 0.5, z])); }
      b.add(G.tube(rl, 0.08, 30, 8), GOLD, 'metal');
    }
  }
  for (const sx of [-1, 1]) {
    const rl = [];
    for (let i = 0; i <= NS; i += 3) { const y = i * RISE, z = SZ0 - i * RUN; rl.push([sx * 4, y + 1.1, z]); b.add(G.cyl(0.07, 0.11, 1.0, 8), STONE, 'gloss', M([sx * 4, y + 0.5, z])); }
    b.add(G.tube(rl, 0.1, 40, 8), GOLD, 'metal');
    // тумбы с канделябрами у начала лестницы
    b.add(G.box(1, 1.4, 1), STONE, 'gloss', M([sx * 4, 0.7, SZ0 + 0.5]));
    kit.rod(b, [sx * 4, 1.4, SZ0 + 0.5], [sx * 4, 3.2, SZ0 + 0.5], 0.06, GOLD, 'metal');
    b.add(G.tor(0.45, 0.04, 6, 16), GOLD, 'metal', M([sx * 4, 3.2, SZ0 + 0.5], [Math.PI / 2, 0, 0]));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; glows.push([sx * 4 + Math.cos(a) * 0.45, 3.55, SZ0 + 0.5 + Math.sin(a) * 0.45, '#ffb15a', 0.7, 2]); }
  }
  /* --- пульт на площадке лестницы; за ним экран с видео и ангелы --- */
  kit.djBooth(b, [0, LY, BZ], 0, { w: 3.2, decks: false, front: '#ff4a1a', front2: '#ffb15a', body: '#1a0606' });
  props.push(kit.decks(scene, [0, LY + 1.05, BZ], 0, 1.7));
  kit.vScreen(scene, 'video/halloween-v2.mp4', [0, LY + 1.6, Z2 + 0.3], 0, 13, { edge: '#ff4a1a', stand: false });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 5.4, LY, BZ - 0.6], 0, 1.8, 1.3); kit.speaker(b, [sx * 5.4, LY + 1.8, BZ - 0.6], 0, 1.4, 1.1); }
  for (const sx of [-1, 1]) props.push(kit.prop(scene, 'sf_angel', { p: [sx * 9.2, LY, LZ2 + 1.4], ry: -sx * 0.4, h: 18 }));
  kit.text3d(b, font, 'HALLOWEEN', { size: 1.25, color: '#ff4a1a', p: [0, 26.5, Z2 + 0.6], bevel: 0.16 });
  kit.text3d(b, font, 'STAYA', { size: 0.8, color: '#f4e6c8', p: [0, 28.6, Z2 + 0.6], bevel: 0.1, kind: 'metal' });

  /* --- телефон лежит на пульте слева от деков, экраном вверх: в нём превью Пхукета --- */
  const PH = [-1.22, LY + 1.05 + 0.017, BZ - 0.1], TILT = 0.14;   // лёгкий наклон: камера смотрит в экран по нормали без вырожденного «взгляда вниз»
  const phone = new THREE.Group(); phone.rotation.order = 'YXZ';
  phone.position.set(...PH); phone.rotation.set(-Math.PI / 2 + TILT, Math.PI + 0.1, 0);
  const body = new THREE.Mesh(kit.G.rbox(0.078, 0.162, 0.009, 0.01, 3), new THREE.MeshPhysicalMaterial({ color: '#0b0b10', roughness: 0.25, clearcoat: 1 }));
  body.position.z = -0.0047; phone.add(body);
  const ui = kit.canvasTex(512, 1024, (x, w, h) => {
    x.fillStyle = '#0d0d10'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ff3fb4'; x.beginPath(); x.arc(52, 70, 28, 0, 7); x.fill();
    x.fillStyle = '#0d0d10'; x.beginPath(); x.arc(52, 70, 23, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(52, 70, 19, 0, 7); x.fill();
    x.font = '800 26px Manrope, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'left'; x.textBaseline = 'middle';
    x.fillText('stayaekb', 96, 62); x.font = '600 19px Manrope, sans-serif'; x.fillStyle = '#9a9aa4'; x.fillText('Phuket, Thailand', 96, 90);
    x.fillStyle = '#fff'; x.font = '700 30px Manrope, sans-serif'; x.fillText('•••', 440, 66);
    // иконки под фото
    const y0 = 760;
    x.fillStyle = '#ff2a55'; x.beginPath(); x.moveTo(52, y0 + 14); x.bezierCurveTo(22, y0 - 6, 30, y0 - 30, 52, y0 - 14); x.bezierCurveTo(74, y0 - 30, 82, y0 - 6, 52, y0 + 14); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 4;
    x.beginPath(); x.arc(122, y0 - 6, 18, 0.6, 7.1); x.stroke();
    x.beginPath(); x.moveTo(170, y0 - 22); x.lineTo(206, y0 - 6); x.lineTo(170, y0 + 10); x.closePath(); x.stroke();
    x.font = '800 26px Manrope, sans-serif'; x.fillStyle = '#fff'; x.fillText('12 847 отметок «Нравится»', 26, y0 + 56);
    x.font = '600 23px Manrope, sans-serif'; x.fillText('stayaekb', 26, y0 + 96); x.fillStyle = '#d8d8e0'; x.fillText('Следующая остановка — Пхукет 🌴', 140, y0 + 96);
    x.fillStyle = '#7a7a84'; x.font = '600 20px Manrope, sans-serif'; x.fillText('Посмотреть все комментарии (318)', 26, y0 + 134);
  });
  const uiM = kit.screen(0.07, 0.1457, ui, [0, 0, 0.0002]); phone.add(uiM);
  const ph = kit.canvasTex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1a5a'); g.addColorStop(0.5, '#ff6a8a'); g.addColorStop(1, '#ffb36b'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const photo = kit.screen(0.07, 0.07, ph, [0, 0.01, 0.0004]); phone.add(photo);
  phone.traverse((c) => (c.userData.dynamic = true));
  scene.add(phone); phone.updateMatrixWorld(true);
  const photoC = photo.getWorldPosition(new THREE.Vector3()).toArray();
  const nrm = new THREE.Vector3(0, 0, 1).applyQuaternion(phone.quaternion);

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#ff6a4a', '#1a0505', 0.5));
  const lights = [], L = (c, i, p, d = 60) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); l.userData.k = i; scene.add(l); lights.push(l); };
  // тёплый ключ от люстр, красный заполняющий, холодный лунный свет из окон — больше контраста, чем раньше
  // четыре лампы вместо девяти: тёплый ключ от люстр, красный заполняющий у входа, холодный лунный из окон, красный над лестницей
  L('#ffd2a0', 760, [0, 19, 0], 50); L('#ff2a14', 520, [0, 13, 12], 40); L('#4a5cff', 520, [0, 16, -4], 44);
  const flash = new THREE.PointLight('#a9bcff', 0, 80, 1.5); flash.position.set(-14, 21, -4); scene.add(flash);
  L('#ff2a14', 420, [0, 12, LZ + 2], 34);

  await Promise.all(props);
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());

  /* --- свечи: на столике, шкафах и у сцены; пламя дрожит --- */
  const flameT = kit.canvasTex(64, 128, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.62, 2, w / 2, h * 0.55, w / 2); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.35, 'rgba(255,190,90,.9)'); g.addColorStop(1, 'rgba(255,90,20,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(w / 2, h * 0.6, w / 2, h * 0.4, 0, 0, 7); x.fill(); });
  const flames = [];
  const candle = (x, y, z, hgt = 0.22) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, hgt, 10), new THREE.MeshStandardMaterial({ color: '#f4ead8', roughness: 0.6, emissive: '#ffcf9a', emissiveIntensity: 0.15 }));
    c.position.set(x, y + hgt / 2, z); scene.add(c);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    f.position.set(x, y + hgt + 0.05, z); f.scale.set(0.06, 0.12, 1); f.userData = { dynamic: true, ph: flames.length * 1.7 }; scene.add(f); flames.push(f);
  };
  for (const [sx, z] of [[-1, -14], [-1, 13], [1, -12], [1, 10]]) for (const d of [-0.5, 0, 0.5]) candle(sx * 19.0, 2.62, z + d, d ? 0.26 : 0.36);
  for (let i = 0; i < 8; i++) candle(-7.5 + i * 2.14 + (i > 3 ? 0 : 0), LY, LZ - 0.25, 0.3 + (i % 3) * 0.08);
  for (let i = 0; i < 25; i += 4) for (const sx of [-1, 1]) candle(sx * 3.5, (i + 1) * RISE, SZ0 - i * RUN - RUN / 2, 0.3);
  const candleL = { intensity: 0 };   // отдельной лампы у свечей больше нет — дрожит только пламя

  /* --- летучие мыши кружат под сводом, машут крыльями --- */
  const batS = new THREE.Shape();
  batS.moveTo(0, 0.2); batS.quadraticCurveTo(0.6, 0.6, 1.4, 0.4); batS.quadraticCurveTo(1.1, 0.1, 1.2, -0.2); batS.quadraticCurveTo(0.8, 0, 0.6, -0.3); batS.quadraticCurveTo(0.3, -0.1, 0, -0.35); batS.lineTo(0, 0.2);
  const wingG = new THREE.ShapeGeometry(batS, 6), batM = new THREE.MeshBasicMaterial({ color: '#120606', side: THREE.DoubleSide });
  const bats = Array.from({ length: 14 }, (_, i) => {
    const g = new THREE.Group(); g.userData.dynamic = true;
    const wl = new THREE.Mesh(wingG, batM), wr = new THREE.Mesh(wingG, batM); wr.scale.x = -1;
    wl.rotation.x = wr.rotation.x = -Math.PI / 2; [wl, wr].forEach((w2) => (w2.userData.dynamic = true));
    const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(wl); pr.add(wr); g.add(pl, pr); pl.userData.dynamic = pr.userData.dynamic = true;
    g.scale.setScalar(0.45 + R() * 0.35); scene.add(g);
    return { g, pl, pr, r: 5 + R() * 10, cz: -20 + R() * 36, y: 16 + R() * 12, sp: (0.25 + R() * 0.35) * (i % 2 ? 1 : -1), ph: R() * 6.28 };
  });

  /* --- молнии за окнами: вспышка в окнах и холодный свет по залу --- */
  const winM = new THREE.MeshBasicMaterial({ color: '#cfd8ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 7) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 10.6), winM); m.position.set(sx * 19.84, 21.2, z); m.rotation.y = -sx * Math.PI / 2; scene.add(m);
  }

  /* --- камера --- */
  // телефон лежит экраном вверх: камера наклоняется над пультом и ныряет в экран по нормали
  const P = (k) => [photoC[0] + nrm.x * k, photoC[1] + nrm.y * k, photoC[2] + nrm.z * k];
  // конец пути: фото (0.07 × 0.07) ровно заполняет кадр по ширине — дальше склейка с первым кадром виллы
  const asp = innerWidth / innerHeight, fov0 = asp < 0.8 ? 72 : asp < 1.2 ? 64 : 54, tn = Math.tan(THREE.MathUtils.degToRad(fov0) / 2);
  const dEnd = 0.0345 / (tn * Math.max(1, asp));
  const BEH = [0, LY + 1.72, BZ - 1.15];         // за пультом, близко к нему: зал виден поверх деков
  const keys = [
    // склейка с дверью клуба: тот же кадр в масштабе дворца, створки приоткрыты так же — и распахиваются
    { p: [0, 4.2, 27.5], l: [0, 3.75, 24.6], t: 0 },
    { p: [0, 3.9, 27.0], l: [0, 3.8, 20], t: 0.1 },
    // в зал: высокий свод, люстры, галереи; видео в золотой раме слева
    { p: [0, 3.4, 19], l: [0, 17, 0], t: 0.17 },
    { p: [-3.8, 3.3, 8], l: [-19.8, 5.8, -1.2], t: 0.25 },
    // вокруг фонтана: впереди парадная лестница, пульт на площадке, экран и ангелы
    { p: [-7.6, 3.2, -1], l: [0, 2.5, FZ], t: 0.32 },
    { p: [-4.6, 3.2, -9.4], l: [0, 8, LZ2], t: 0.4 },
    // вверх по лестнице
    { p: [0, 3.3, SZ0 + 1.2], l: [0, 8, LZ2], t: 0.46 },
    { p: [0, LY + 1.7, LZ + 1.0], l: [0, LY + 3, LZ2], t: 0.53 },
    // обходим пульт слева и встаём за него — взгляд в зал
    { p: [-2.4, LY + 1.65, BZ - 1.4], l: [0, LY + 1.4, BZ], t: 0.58 },
    { p: BEH, l: [0, LY - 0.6, -6], t: 0.66 },
    { p: BEH, l: [0, LY - 0.7, -6], t: 0.76 },
    // взгляд опускается на пульт: рядом с деками лежит телефон
    { p: [PH[0] + 0.25, LY + 1.78, BZ - 1.0], l: photoC, t: 0.84 },
    // камера ныряет в экран
    { p: P(0.6), l: photoC, t: 0.9 },
    { p: P(0.16), l: photoC, t: 0.945 },
    { p: P(dEnd * 1.7), l: photoC },
    { p: P(dEnd), l: photoC, t: 0.985 },
    { p: P(dEnd * 0.97), l: photoC, t: 1 },
  ];
  const sm = (a, c, t) => { const k = Math.min(1, Math.max(0, (t - a) / (c - a))); return k * k * (3 - 2 * k); };
  const update = (t) => {
    const now = performance.now() / 1000;
    front.open(0.35 + 0.65 * sm(0.0, 0.13, t));
    // пламя свечей дрожит
    let fl = 0;
    for (const f of flames) { const k = 0.85 + 0.15 * Math.sin(now * 11 + f.userData.ph) * Math.sin(now * 7.3 + f.userData.ph * 2); f.scale.set(0.06 * k, 0.12 * (0.9 + 0.2 * k), 1); fl += k; }
    candleL.intensity = 3 * (fl / flames.length);
    // мыши
    for (const b2 of bats) {
      const a = b2.ph + now * b2.sp, x = Math.cos(a) * b2.r, z = b2.cz + Math.sin(a) * b2.r * 0.8, y = b2.y + Math.sin(now * 1.3 + b2.ph) * 0.6;
      b2.g.position.set(x, y, z); b2.g.rotation.y = -a + (b2.sp > 0 ? 0 : Math.PI);
      const w2 = Math.sin(now * 14 + b2.ph) * 0.7; b2.pl.rotation.z = w2; b2.pr.rotation.z = -w2;
    }
    // молния: раз в ~7 с двойная вспышка
    const q = (now + 2.3) % 7.3, lf = q < 0.08 ? 1 : q > 0.16 && q < 0.26 ? 0.7 : q < 0.6 ? Math.max(0, 0.35 - (q - 0.26)) : 0;
    winM.opacity = lf; flash.intensity = lf * 900;
    // UI соцсети гаснет в чёрный — остаётся только фото
    uiM.material.color.setScalar(1 - sm(0.9, 0.97, t));
  };
  const near = (t) => (t > 0.9 ? 0.004 : 0.05);
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.6) / 0.04));   // за пультом и у телефона — без влияния головы и курсора
  // фото в телефоне — живой кадр виллы (рендер следующей сцены); fov подобран так, что в конце пути фото = первый кадр виллы
  const preview = { mesh: photo, t: 0, fov: 2 * Math.atan(0.035 / dEnd) * 180 / Math.PI, live: (t) => t > 0.875 };
  // предмет для сбора: тыква-фонарь на правом краю пульта, не на пути камеры
  addLoot(scene, 'pumpkin', 'pumpkin', [1.75, LY + 1.4, BZ + 0.15], { r: 0.6, ry: Math.PI });
  return { scene, cam: kit.camPath(keys), update, near, calm, preview };
}
