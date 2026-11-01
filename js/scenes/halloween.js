// 04 · STAYA HALLOWEEN — двухэтажный дворец XIX века с парадной лестницей посередине.
// Портал: камера поднимается по лестнице и влетает в приоткрытые двери.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080203');
  scene.fog = new THREE.FogExp2('#1c0605', 0.02);
  scene.environment = kit.env(renderer, ['#ff2a14', '#ff8a2a', '#ffd28a', '#3b4bff', '#8a0d1a'], '#070203');
  const b = new Builder(), glows = [], R = kit.rng(31);
  const STONE = '#d9c7a4', GOLD = '#c9a24a', RED = '#7e0a16';

  /* --- пол-шахматка --- */
  const chk = kit.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#e9e2d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#16100e'; x.fillRect(0, 0, w / 2, h / 2); x.fillRect(w / 2, h / 2, w / 2, h / 2); }, { repeat: [20, 27] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 54), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.22, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -3); scene.add(floor);
  // красная дорожка к лестнице
  b.add(G.box(6, 0.03, 26), RED, 'matte', M([0, 0.015, 11]));
  b.add(G.box(0.15, 0.035, 26), GOLD, 'metal', M([-3, 0.02, 11])); b.add(G.box(0.15, 0.035, 26), GOLD, 'metal', M([3, 0.02, 11]));

  /* --- стены, своды --- */
  const WALL = '#bfa07e';
  b.add(G.box(1, 26, 56), WALL, 'matte', M([-20.5, 13, -3])); b.add(G.box(1, 26, 56), WALL, 'matte', M([20.5, 13, -3]));
  b.add(G.box(42, 26, 1), WALL, 'matte', M([0, 13, -31]));
  b.add(G.cyl(20.5, 20.5, 56, 40, true), '#5a3020', 'matte', M([0, 24, -3], [Math.PI / 2, 0, 0], [1, 1, 0.35]));
  // кессоны свода — золотые рёбра
  for (let z = -28; z <= 22; z += 5) b.add(G.tor(20.3, 0.2, 5, 40, Math.PI), GOLD, 'metal', M([0, 24, z], [0, 0, 0], [1, 0.35, 1]));
  // высокие арочные окна с лунным светом
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 7) {
    b.add(G.box(0.1, 7, 3), '#2f3cff', 'neon', M([sx * 19.95, 15.5, z]));
    b.add(G.cyl(1.5, 1.5, 0.1, 18, false), '#2f3cff', 'neon', M([sx * 19.95, 19, z], [0, 0, Math.PI / 2]));
    b.add(G.box(0.2, 7.2, 0.15), '#2a1a12', 'matte', M([sx * 19.85, 15.5, z]));
    glows.push([sx * 19, 16, z, '#3b4bff', 6, 0.35]);
    // красные шторы
    for (const dz of [-1.9, 1.9]) for (let f = 0; f < 3; f++) b.add(G.cyl(0.28, 0.4, 10, 8), '#6a0612', 'plastic', M([sx * 19.6, 15, z + dz + (f - 1) * 0.3]));
  }

  /* --- колонны и галереи 2-го этажа --- */
  for (const sx of [-1, 1]) {
    for (let z = -26; z <= 20; z += 7.5) {
      b.add(G.box(1.8, 0.6, 1.8), STONE, 'gloss', M([sx * 12, 0.3, z]));
      b.add(G.cyl(0.65, 0.72, 9, 20), STONE, 'gloss', M([sx * 12, 5.1, z]));
      b.add(G.box(1.8, 0.7, 1.8), GOLD, 'metal', M([sx * 12, 9.6, z]));
      b.add(G.cyl(0.5, 0.55, 8, 18), STONE, 'gloss', M([sx * 12, 14.4, z]));
      b.add(G.box(1.5, 0.6, 1.5), GOLD, 'metal', M([sx * 12, 18.6, z]));
    }
    // плита галереи
    b.add(G.box(9, 0.8, 56), '#8a6a50', 'plastic', M([sx * 16.5, 10, -3]));
    b.add(G.box(0.3, 0.2, 56), GOLD, 'metal', M([sx * 12, 10.45, -3]));
    // балюстрада галереи
    for (let z = -29; z <= 24; z += 0.7) b.add(G.cyl(0.08, 0.12, 1, 6), STONE, 'gloss', M([sx * 12, 10.9, z]));
    b.add(G.box(0.4, 0.15, 56), STONE, 'gloss', M([sx * 12, 11.45, -3]));
    // канделябры на галерее
    for (let z = -22; z <= 18; z += 10) { glows.push([sx * 12, 12.2, z, '#ffb15a', 1.4, 1.6]); b.add(G.cyl(0.04, 0.04, 0.6, 6), '#fff', 'plastic', M([sx * 12, 11.8, z])); }
  }

  /* --- парадная лестница --- */
  // центральный марш: z от -2 (y 0) до -14 (y 6)
  for (let i = 0; i < 30; i++) {
    const y = (i + 1) * 0.2, z = -2 - i * 0.4 - 0.2;
    b.add(G.box(8, y, 0.4), STONE, 'gloss', M([0, y / 2, z]));
    b.add(G.box(5.4, 0.03, 0.42), RED, 'matte', M([0, y + 0.015, z]));
  }
  // площадка
  b.add(G.box(22, 6, 7), STONE, 'gloss', M([0, 3, -17.5]));
  b.add(G.box(16, 0.03, 6), RED, 'matte', M([0, 6.02, -17.2]));
  // боковые марши: от площадки (y 6, z -14) к галереям (y 10, z -6)
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 20; i++) {
      const y = 6 + (i + 1) * 0.2, z = -14 + i * 0.4 + 0.2;
      b.add(G.box(3.6, 0.3, 0.4), STONE, 'gloss', M([sx * 8.6, y - 0.15, z]));
      b.add(G.box(2.4, 0.03, 0.42), RED, 'matte', M([sx * 8.6, y + 0.015, z]));
    }
    b.add(G.box(4.5, 0.6, 4), STONE, 'gloss', M([sx * 9, 9.7, -4]));
    // перила марша
    const rl = [], rr = [];
    for (let i = 0; i <= 30; i += 2) { const y = i * 0.2, z = -2 - i * 0.4; rl.push([sx * 4, y + 1.1, z]); b.add(G.cyl(0.07, 0.11, 1.0, 8), STONE, 'gloss', M([sx * 4, y + 0.5, z])); }
    b.add(G.tube(rl, 0.11, 40, 8), GOLD, 'metal');
    for (let i = 0; i <= 20; i += 2) { const y = 6 + i * 0.2, z = -14 + i * 0.4; rr.push([sx * 6.8, y + 1.1, z]); b.add(G.cyl(0.07, 0.11, 1.0, 8), STONE, 'gloss', M([sx * 6.8, y + 0.5, z])); }
    b.add(G.tube(rr, 0.1, 30, 8), GOLD, 'metal');
    // тумбы с канделябрами у начала лестницы
    b.add(G.box(1, 1.4, 1), STONE, 'gloss', M([sx * 4, 0.7, -1.6]));
    kit.rod(b, [sx * 4, 1.4, -1.6], [sx * 4, 3.2, -1.6], 0.06, GOLD, 'metal');
    b.add(G.tor(0.45, 0.04, 6, 16), GOLD, 'metal', M([sx * 4, 3.2, -1.6], [Math.PI / 2, 0, 0]));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; glows.push([sx * 4 + Math.cos(a) * 0.45, 3.55, -1.6 + Math.sin(a) * 0.45, '#ffb15a', 0.7, 2]); }
  }
  // свечи на ступенях
  for (let i = 2; i < 30; i += 4) for (const sx of [-1, 1]) { const y = (i + 1) * 0.2, z = -2 - i * 0.4 - 0.2; b.add(G.cyl(0.06, 0.06, 0.3, 8), '#f4ecdc', 'plastic', M([sx * 3.4, y + 0.15, z])); glows.push([sx * 3.4, y + 0.38, z, '#ffb15a', 0.5, 2]); }

  /* --- задняя стена площадки: двери-портал --- */
  const DZ = -20.6;
  b.add(G.box(16.5, 18, 0.8), WALL, 'matte', M([-11.75, 15, DZ])); b.add(G.box(16.5, 18, 0.8), WALL, 'matte', M([11.75, 15, DZ]));
  b.add(G.box(7, 9, 0.8), WALL, 'matte', M([0, 19.5, DZ]));
  b.add(G.tor(4.2, 0.35, 8, 28, Math.PI), GOLD, 'metal', M([0, 15, DZ + 0.45]));
  for (const sx of [-1, 1]) b.add(G.box(0.7, 9, 0.9), GOLD, 'metal', M([sx * 3.85, 10.5, DZ + 0.45]));
  // створки приоткрыты
  for (const sx of [-1, 1]) {
    b.push(M([sx * 3.5, 6, DZ - 0.1], [0, sx * 0.55, 0]));
    b.add(G.rbox(3.2, 9, 0.25, 0.05), '#3a1208', 'gloss', M([-sx * 1.6, 4.5, 0]));
    for (const y of [2, 5, 7.6]) b.add(G.box(2.4, 1.6, 0.05), '#5a1a0a', 'gloss', M([-sx * 1.6, y, 0.15]));
    b.add(G.sph(0.14, 10, 8), GOLD, 'metal', M([-sx * 2.8, 4.5, 0.2]));
    b.pop();
  }
  b.add(G.box(7, 10, 0.1), '#ff7a1a', 'neon', M([0, 11, DZ - 1.6]));
  glows.push([0, 10, DZ - 0.6, '#ff8a2a', 12, 0.7], [0, 8, DZ + 1.5, '#ff5a1f', 8, 0.45]);
  // надпись
  kit.text3d(b, font, 'HALLOWEEN', { size: 1.25, color: '#ff4a1a', p: [0, 20.3, DZ + 0.7], bevel: 0.16 });
  kit.text3d(b, font, 'STAYA', { size: 0.8, color: '#f4e6c8', p: [0, 22.4, DZ + 0.7], bevel: 0.1, kind: 'metal' });
  // огромный портрет над площадкой слева/справа
  const portrait = kit.canvasTex(256, 384, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0806'); g.addColorStop(1, '#0a0202'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e8d6c0'; x.beginPath(); x.ellipse(w / 2, h * 0.38, 46, 60, 0, 0, 7); x.fill();
    x.fillStyle = '#120404'; x.beginPath(); x.ellipse(w / 2 - 17, h * 0.36, 10, 7, 0, 0, 7); x.ellipse(w / 2 + 17, h * 0.36, 10, 7, 0, 0, 7); x.fill();
    x.fillStyle = '#b0101a'; x.beginPath(); x.ellipse(w / 2, h * 0.48, 16, 6, 0, 0, 7); x.fill();
    x.fillStyle = '#1a0606'; x.beginPath(); x.moveTo(w * 0.2, h); x.quadraticCurveTo(w / 2, h * 0.5, w * 0.8, h); x.fill();
  });
  for (const sx of [-1, 1]) {
    const pm = kit.texPlane(3.6, 5.4, portrait, [sx * 10.5, 14, DZ + 0.42], [0, 0, 0], { rough: 0.5 }); scene.add(pm);
    b.add(G.box(4.2, 6, 0.2), GOLD, 'metal', M([sx * 10.5, 14, DZ + 0.3]));
  }

  /* --- люстры --- */
  for (const z of [14, 3, -9]) {
    const y = 16.5;
    kit.rod(b, [0, 24, z], [0, y + 1.4, z], 0.05, GOLD, 'metal');
    for (const [rr, dy] of [[2.4, 0], [1.7, 0.7], [1.0, 1.3]]) {
      b.add(G.tor(rr, 0.07, 6, 36), GOLD, 'metal', M([0, y + dy, z], [Math.PI / 2, 0, 0]));
      const n = Math.round(rr * 7);
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; glows.push([Math.cos(a) * rr, y + dy + 0.3, z + Math.sin(a) * rr, '#ffc27a', 0.55, 2]); b.add(G.cyl(0.04, 0.04, 0.22, 5), '#fff4e0', 'plastic', M([Math.cos(a) * rr, y + dy + 0.12, z + Math.sin(a) * rr])); }
    }
    glows.push([0, y + 0.6, z, '#ffb15a', 7, 0.5]);
  }

  /* --- тыквы, летучие мыши, гости --- */
  [[-5, 0, 1], [5, 0, 1.5], [-6, 0, 6], [6.5, 0, 8], [-3.6, 0, -0.6], [3.6, 0, -0.4], [-9, 6, -15], [9, 6, -15.5], [-6.5, 6, -19], [6.5, 6, -19], [-14, 10.4, 4], [14, 10.4, -3]].forEach((p, i) => kit.pumpkin(b, p, 0.9 + (i % 3) * 0.35, i % 2 === 0, (R() - 0.5) * 0.8));
  const bat = new THREE.Shape();
  bat.moveTo(0, 0.2); bat.quadraticCurveTo(0.6, 0.6, 1.4, 0.4); bat.quadraticCurveTo(1.1, 0.1, 1.2, -0.2); bat.quadraticCurveTo(0.8, 0, 0.6, -0.3); bat.quadraticCurveTo(0.3, -0.1, 0, -0.35);
  bat.quadraticCurveTo(-0.3, -0.1, -0.6, -0.3); bat.quadraticCurveTo(-0.8, 0, -1.2, -0.2); bat.quadraticCurveTo(-1.1, 0.1, -1.4, 0.4); bat.quadraticCurveTo(-0.6, 0.6, 0, 0.2);
  for (let i = 0; i < 16; i++) b.add(new THREE.ExtrudeGeometry(bat, { depth: 0.05, bevelEnabled: false, curveSegments: 6 }), '#0a0505', 'plastic', M([(R() - 0.5) * 24, 14 + R() * 7, -20 + R() * 34], [R() * 0.6 - 0.3 + Math.PI / 2 * 0, R() * 6, R() * 0.4], 0.8 + R() * 0.8));
  const guests = [
    { p: [-2.6, 0, 7], ry: 0.4, top: '#120d16', skirt: '#120d16', mask: '#f2f2f2', hat: 'witch', pose: 'hips' },
    { p: [2.8, 0, 5], ry: -0.5, top: '#7a0010', skirt: '#7a0010', skirtW: 1.3, mask: '#f2e8e0', longHair: 2, hair: '#0e0e12', pose: 'stand' },
    { p: [-7.5, 0, 2], ry: 0.8, top: '#0e0e12', bottom: '#0e0e12', mask: '#ffffff', horns: '#c0101a', pose: 'up' },
    { p: [8, 0, 3], ry: -0.9, top: '#7a0010', skirt: '#7a0010', s: 1.45, mask: '#f2f2f2', longHair: 2, hair: '#5a0808', pose: 'wave' },
    { p: [-8.5, 0, 9.5], ry: 0.3, top: '#1a1a2a', bottom: '#1a1a2a', mask: '#d8d0c8', pose: 'phone' },
    { p: [9, 0, 11], ry: -0.4, top: '#120d16', skirt: '#2a0a2a', mask: '#f2f2f2', hat: 'witch', pose: 'up' },
    { p: [-1.5, 3.2 + 0.2, -9], ry: 0.2, top: '#7a0010', skirt: '#7a0010', skirtW: 1.4, mask: '#f2e8e0', longHair: 2, hair: '#0e0e12', pose: 'stand' },
    { p: [2.2, 6, -16.5], ry: -0.2, top: '#0e0e12', bottom: '#0e0e12', mask: '#fff', horns: '#c0101a', pose: 'hips' },
    { p: [-3, 6, -18], ry: 0.3, top: '#7a0010', skirt: '#7a0010', s: 1.4, mask: '#f2f2f2', hair: '#5a0808', longHair: 2, pose: 'up' },
    { p: [-15, 10.4, -10], ry: 1.3, top: '#120d16', skirt: '#120d16', mask: '#f2f2f2', pose: 'stand' },
    { p: [15.5, 10.4, 6], ry: -1.4, top: '#7a0010', skirt: '#7a0010', mask: '#f2f2f2', hair: '#0e0e12', longHair: 2, pose: 'wave' },
  ];
  guests.forEach((g, i) => kit.figure(b, { ...g, bottom: g.bottom ?? '#120d16', i }));

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#ff6a4a', '#1a0505', 0.45));
  const L = (c, i, p, d = 60) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ff2a14', 650, [0, 12, 8]); L('#ff8a2a', 420, [0, 9, -13]); L('#ffb15a', 260, [0, 15, 3], 30); L('#4a5cff', 160, [-17, 12, 0], 30); L('#4a5cff', 160, [17, 12, 0], 30);
  /* --- парадный вход: стена и двери, которые открываются скроллом --- */
  const FZ = 24.6;
  b.add(G.box(17.8, 26, 0.8), WALL, 'matte', M([-12.1, 13, FZ])); b.add(G.box(17.8, 26, 0.8), WALL, 'matte', M([12.1, 13, FZ]));
  b.add(G.box(6.4, 17.5, 0.8), WALL, 'matte', M([0, 17.25, FZ]));
  b.add(G.tor(3.4, 0.3, 8, 28, Math.PI), GOLD, 'metal', M([0, 8.5, FZ - 0.45]));
  for (const sx of [-1, 1]) b.add(G.box(0.5, 8.5, 0.9), GOLD, 'metal', M([sx * 3.35, 4.25, FZ - 0.45]));
  const doorMat = new THREE.MeshPhysicalMaterial({ color: '#2a0d06', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const panelMat = new THREE.MeshPhysicalMaterial({ color: '#4a1608', roughness: 0.35, clearcoat: 1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.25 });
  const leaves = [-1, 1].map((sx) => {
    const g = new THREE.Group(); g.position.set(sx * 3.1, 0, FZ);
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.userData.dynamic = true; g.add(m); };
    add(kit.G.rbox(3.1, 8.4, 0.25, 0.04), doorMat, -sx * 1.55, 4.2, 0);
    for (const y of [1.8, 4.6, 7.2]) for (const zz of [-0.14, 0.14]) add(new THREE.BoxGeometry(2.3, 1.9, 0.04), panelMat, -sx * 1.55, y, zz);
    for (const zz of [-0.2, 0.2]) add(new THREE.SphereGeometry(0.13, 12, 8), goldMat, -sx * 2.75, 4.2, zz);
    scene.add(g); return { g, sx };
  });
  // свет из-под дверей, пока закрыто
  b.add(G.box(6, 0.04, 0.1), '#ff8a2a', 'neon', M([0, 0.03, FZ - 0.3]));

  /* --- гость на галерее держит смартфон: пост с фото следующей сцены --- */
  const GP = [13.4, 10.4, -0.5], gry = 0.96, cs = Math.cos(gry), sn = Math.sin(gry);
  const W = (x, y, z) => [GP[0] + x * cs + z * sn, GP[1] + y, GP[2] - x * sn + z * cs];
  kit.figure(b, { p: GP, ry: gry, pose: 'hold', top: '#120d16', skirt: '#120d16', mask: '#f2f2f2', horns: '#c0101a', hair: '#0e0e12', longHair: 2, i: 4 });
  // телефон в руках: экран смотрит на лицо (наклон вверх)
  const phone = new THREE.Group(); phone.rotation.order = 'YXZ';
  phone.position.set(...W(0, 1.27, 0.38)); phone.rotation.set(-1.03, gry + Math.PI, 0);
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
  scene.add(phone); phone.updateMatrixWorld(true);
  const photoC = photo.getWorldPosition(new THREE.Vector3()).toArray();
  const nrm = new THREE.Vector3(0, 0, 1).applyQuaternion(phone.quaternion);
  glows.push([...W(0, 1.45, 0.25), '#9fb2ff', 0.6, 0.5]);

  scene.add(kit.glowPoints(glows));
  scene.add(b.build());

  const P = (k) => [photoC[0] + nrm.x * k, photoC[1] + nrm.y * k, photoC[2] + nrm.z * k];
  const keys = [
    // перед закрытыми дверями — двери открываются
    { p: [0, 3.6, 29.2], l: [0, 3.6, 20], t: 0 },
    { p: [0, 3.6, 28.6], l: [0, 3.8, 20], t: 0.13 },
    { p: [0, 3.2, 22], l: [0, 4.8, 0], t: 0.24 },
    { p: [0, 3.2, 12], l: [0, 6, -10] },
    { p: [0, 3.6, 0.5], l: [0, 8, -16], t: 0.42 },
    // вверх по центральному маршу, на площадке — вправо
    { p: [0, 4.6, -6], l: [0, 8.5, -16] },
    { p: [0, 7, -11], l: [2, 8.5, -16] },
    { p: [1.2, 8.3, -15.2], l: [8, 9, -14], t: 0.6 },
    // по правому маршу на второй этаж
    { p: [6.6, 8.6, -14.6], l: [8.6, 10.5, -8] },
    { p: [8.6, 9.6, -12], l: [8.8, 11.6, -4] },
    { p: [8.8, 11.6, -7.6], l: [11, 12.8, -1.5], t: 0.78 },
    // за спину гостя → через плечо в экран его смартфона
    { p: W(1.1, 2.3, -2.8), l: W(0, 1.5, 0.4), t: 0.86 },
    { p: W(0.5, 2.12, -0.5), l: photoC, t: 0.92 },
    { p: P(0.16), l: photoC, t: 0.96 },
    { p: P(0.045), l: photoC },
    { p: P(0.022), l: photoC, t: 1 },
  ];
  const update = (t) => {
    const k = Math.min(1, Math.max(0, (t - 0.02) / 0.13)), a = (k * k * (3 - 2 * k)) * 1.75;
    leaves.forEach(({ g, sx }) => (g.rotation.y = sx < 0 ? a : -a));
  };
  // у экрана смартфона камера подходит на сантиметры — ближняя плоскость отсечения меньше
  const near = (t) => (t > 0.9 ? 0.004 : 0.05);
  return { scene, cam: kit.camPath(keys), update, near, preview: { mesh: photo, w: 512, h: 512 } };
}
