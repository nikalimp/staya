// 04 · STAYA HALLOWEEN — дворец XIX века, один большой зал (облегчённая версия).
// Парадные двери распахиваются → зал с галереями, колоннами, люстрами и картинами → вокруг фонтана в центре →
// диджейская сцена у задней стены между гигантскими ангелами, за ней экран с видео →
// столик у фонтана: забытый смартфон с постом про Пхукет — камера ныряет в экран.
export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080203');
  scene.fog = new THREE.FogExp2('#1c0605', 0.018);
  scene.environment = kit.env(renderer, ['#ff2a14', '#ff8a2a', '#ffd28a', '#3b4bff', '#8a0d1a'], '#070203');
  const b = new Builder(), glows = [], props = [], R = kit.rng(31);
  const STONE = '#d9c7a4', GOLD = '#c9a24a', RED = '#7e0a16', WALL = '#bfa07e';
  const Z1 = 24.6, Z2 = -31, L0 = Z1 - Z2, C0 = (Z1 + Z2) / 2;
  const FZ = -3, SZ = -24.5;                  // фонтан в центре зала, диджейская сцена у задней стены

  /* --- пол-шахматка и красные дорожки, обходящие фонтан --- */
  const chk = kit.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#e9e2d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#16100e'; x.fillRect(0, 0, w / 2, h / 2); x.fillRect(w / 2, h / 2, w / 2, h / 2); }, { repeat: [20, 28] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, L0), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.22, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, C0); scene.add(floor);
  const runner = (z0, z1) => {
    b.add(G.box(6, 0.03, z0 - z1), RED, 'matte', M([0, 0.015, (z0 + z1) / 2]));
    for (const sx of [-3, 3]) b.add(G.box(0.15, 0.035, z0 - z1), GOLD, 'metal', M([sx, 0.02, (z0 + z1) / 2]));
  };
  runner(Z1, FZ + 7.5); runner(FZ - 7.5, SZ + 3.6);
  b.add(G.cyl(8.4, 8.4, 0.03, 64), RED, 'matte', M([0, 0.015, FZ]));
  b.add(G.tor(8.4, 0.07, 6, 64), GOLD, 'metal', M([0, 0.03, FZ], [Math.PI / 2, 0, 0]));

  /* --- стены и свод --- */
  for (const sx of [-1, 1]) b.add(G.box(1, 26, L0), WALL, 'matte', M([sx * 20.5, 13, C0]));
  b.add(G.box(42, 26, 1), WALL, 'matte', M([0, 13, Z2 - 0.5]));
  b.add(G.cyl(20.5, 20.5, L0, 48, true), '#5a3020', 'matte', M([0, 24, C0], [Math.PI / 2, 0, 0], [1, 1, 0.35]));
  for (let z = Z1 - 2; z >= Z2 + 2; z -= 6) b.add(G.tor(20.3, 0.2, 5, 40, Math.PI), GOLD, 'metal', M([0, 24, z], [0, 0, 0], [1, 0.35, 1]));
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 7) {
    b.add(G.box(0.1, 7, 3), '#2f3cff', 'neon', M([sx * 19.95, 15.5, z]));
    b.add(G.cyl(1.5, 1.5, 0.1, 18, false), '#2f3cff', 'neon', M([sx * 19.95, 19, z], [0, 0, Math.PI / 2]));
    glows.push([sx * 19, 16, z, '#3b4bff', 6, 0.35]);
    for (const dz of [-1.9, 1.9]) b.add(G.cyl(0.3, 0.42, 10, 8), '#6a0612', 'plastic', M([sx * 19.6, 15, z + dz]));
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
    plane(L0, 23, wallM(L0, 23), [sx * 19.985, 14.5, C0], -sx * Math.PI / 2);
    const pt = panelT.clone(); pt.needsUpdate = true; pt.repeat.set(L0 / 4, 1);
    plane(L0, 3, new THREE.MeshStandardMaterial({ map: pt, roughness: 0.35 }), [sx * 19.98, 1.5, C0], -sx * Math.PI / 2);
  }
  plane(40, 23, wallM(40, 23), [0, 14.5, Z2 + 0.015], 0);
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
  vault.position.set(0, 24, C0); vault.rotation.x = Math.PI / 2; vault.scale.set(1, 1, 0.35); scene.add(vault);

  /* --- галереи второго этажа (туда не поднимаемся) --- */
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
    props.push(kit.prop(scene, 'sf_column', { p: [sx * 12, 11.5, z], h: 8.2 }));
  }
  /* --- люстры (Poly Haven, CC0) --- */
  [['Chandelier_01', 14], ['Chandelier_02', 3], ['Chandelier_03', -14]].forEach(([n, z]) => {
    kit.rod(b, [0, 24, z], [0, 18.1, z], 0.05, GOLD, 'metal');
    props.push(kit.prop(scene, n, { p: [0, 18.2, z], s: 6.2, anchor: 'top', emissive: '#ffb15a', ei: 0.35 }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; glows.push([Math.cos(a) * 1.4, 16.2, z + Math.sin(a) * 1.4, '#ffc27a', 0.6, 2]); }
    glows.push([0, 15.8, z, '#ffb15a', 7, 0.5]);
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
  for (const sx of [-1, 1]) art(sx < 0 ? 5 : 6, [sx * 13.5, 16.5, Z2 + 0.1], 0, 6.5);
  art(7, [0, 16.5, Z1 - 0.5], Math.PI, 5.5);

  /* --- парадный вход --- */
  b.add(G.box(17.8, 26, 0.8), WALL, 'matte', M([-12.1, 13, Z1])); b.add(G.box(17.8, 26, 0.8), WALL, 'matte', M([12.1, 13, Z1]));
  b.add(G.box(6.4, 17.5, 0.8), WALL, 'matte', M([0, 17.25, Z1]));
  const front = kit.grandDoor(scene, b, [0, 0, Z1], 0, 1);
  b.add(G.box(6, 0.04, 0.1), '#ff8a2a', 'neon', M([0, 0.03, Z1 - 0.3]));

  /* --- фонтан в центре зала (Sketchfab «Fountain with three putts, Brno», CC BY) --- */
  b.add(G.cyl(5.2, 5.4, 0.9, 48), STONE, 'gloss', M([0, 0.45, FZ]));
  b.add(G.tor(5.2, 0.25, 8, 48), STONE, 'gloss', M([0, 0.9, FZ], [Math.PI / 2, 0, 0]));
  const fw = kit.water(9.6, 9.6, '#1a6a8a', { tile: 2, ei: 0.4, emissive: '#2a8ac0', opacity: 0.85 });
  fw.geometry.dispose(); fw.geometry = new THREE.CircleGeometry(5.0, 48); fw.position.set(0, 0.78, FZ); scene.add(fw);
  props.push(kit.prop(scene, 'sf_fountain', { p: [0, 0.75, FZ], h: 5.2 }));
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; glows.push([Math.cos(a) * 4.4, 0.95, FZ + Math.sin(a) * 4.4, '#7fd8ff', 0.9, 1.2]); }

  /* --- диджейская сцена у задней стены, по сторонам — ангелы высотой во весь зал --- */
  b.add(G.rbox(14, 1.2, 6, 0.08), '#120808', 'gloss', M([0, 0.6, SZ]));
  b.add(G.box(14, 0.06, 0.06), '#ff4a1a', 'neon', M([0, 1.2, SZ + 3]));
  kit.djBooth(b, [0, 1.2, SZ + 1.2], 0, { w: 3.2, decks: false, front: '#ff4a1a', front2: '#ffb15a', body: '#1a0606' });
  props.push(kit.decks(scene, [0, 2.25, SZ + 1.2], 0, 1.7));
  kit.vScreen(scene, 'video/halloween-v2.mp4', [0, 2.2, Z2 + 0.3], 0, 12.5, { edge: '#ff4a1a', stand: false });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 5.6, 1.2, SZ], 0, 1.8, 1.3); kit.speaker(b, [sx * 5.6, 3.0, SZ], 0, 1.4, 1.1); }
  for (const sx of [-1, 1]) props.push(kit.prop(scene, 'sf_angel', { p: [sx * 8.8, 0, SZ - 1.2], ry: -sx * 0.4, h: 21 }));
  kit.text3d(b, font, 'HALLOWEEN', { size: 1.25, color: '#ff4a1a', p: [0, 18.8, Z2 + 0.6], bevel: 0.16 });
  kit.text3d(b, font, 'STAYA', { size: 0.8, color: '#f4e6c8', p: [0, 20.9, Z2 + 0.6], bevel: 0.1, kind: 'metal' });

  /* --- столик у фонтана: напитки и забытый смартфон --- */
  const TP = [6.4, 0, 2.6], TH = 0.98;
  b.add(G.cyl(0.9, 0.9, 0.06, 32), '#4a1218', 'gloss', M([TP[0], TH - 0.03, TP[2]]));
  b.add(G.tor(0.9, 0.025, 6, 48), GOLD, 'metal', M([TP[0], TH - 0.03, TP[2]], [Math.PI / 2, 0, 0]));
  b.add(G.cyl(0.06, 0.08, TH - 0.06, 10), GOLD, 'metal', M([TP[0], (TH - 0.06) / 2, TP[2]]));
  b.add(G.cyl(0.4, 0.45, 0.04, 24), GOLD, 'metal', M([TP[0], 0.02, TP[2]]));
  props.push(kit.prop(scene, 'sf_martini', { p: [TP[0] - 0.42, TH, TP[2] - 0.25], h: 0.18 }));
  props.push(kit.prop(scene, 'sf_summer', { p: [TP[0] + 0.35, TH, TP[2] - 0.38], h: 0.24, ry: 1 }));
  props.push(kit.prop(scene, 'sf_malibu', { p: [TP[0] + 0.45, TH, TP[2] + 0.3], h: 0.2, ry: 2.2 }));
  // смартфон лежит экраном вверх
  const phone = new THREE.Group(); phone.rotation.order = 'YXZ';
  phone.position.set(TP[0] - 0.05, TH + 0.006, TP[2] + 0.12); phone.rotation.set(-Math.PI / 2, 0, 0);
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
  const L = (c, i, p, d = 60) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  // тёплый ключ от люстр, красный заполняющий, холодный лунный свет из окон — больше контраста, чем раньше
  L('#ff2a14', 420, [0, 12, 10]); L('#ff8a2a', 380, [0, 9, -16]); L('#ffe2b0', 420, [0, 15, 3], 34); L('#ffd8a0', 260, [0, 15, -14], 30); L('#4a5cff', 300, [-17, 12, 0], 34); L('#4a5cff', 300, [17, 12, 0], 34);
  const flash = new THREE.PointLight('#a9bcff', 0, 70, 1.5); flash.position.set(-14, 16, -4); scene.add(flash);
  L('#7fd8ff', 90, [0, 4, FZ], 14); L('#ff2a14', 380, [0, 8, SZ + 4], 30); L('#ffb15a', 14, [TP[0], 2.4, TP[2]], 5);

  await Promise.all(props);
  scene.add(kit.glowPoints(glows));
  kit.haze(scene, { box: [-18, 18, 0.5, 6, -28, 22], colors: ['#ff5a1f', '#ff8a2a', '#3b4bff'], n: 22, size: 10, opacity: 0.09 });
  scene.add(b.build());
  // туман стелется по полу
  kit.haze(scene, { box: [-18, 18, 0.05, 1.1, -28, 22], colors: ['#ffd8c8', '#ff8a6a', '#c8c8ff'], n: 30, size: 7, opacity: 0.13, seed: 41 });

  /* --- свечи: на столике, шкафах и у сцены; пламя дрожит --- */
  const flameT = kit.canvasTex(64, 128, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.62, 2, w / 2, h * 0.55, w / 2); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.35, 'rgba(255,190,90,.9)'); g.addColorStop(1, 'rgba(255,90,20,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(w / 2, h * 0.6, w / 2, h * 0.4, 0, 0, 7); x.fill(); });
  const flames = [];
  const candle = (x, y, z, hgt = 0.22) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, hgt, 10), new THREE.MeshStandardMaterial({ color: '#f4ead8', roughness: 0.6, emissive: '#ffcf9a', emissiveIntensity: 0.15 }));
    c.position.set(x, y + hgt / 2, z); scene.add(c);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    f.position.set(x, y + hgt + 0.05, z); f.scale.set(0.06, 0.12, 1); f.userData = { dynamic: true, ph: flames.length * 1.7 }; scene.add(f); flames.push(f);
  };
  for (const [dx, dz] of [[0.42, 0.25], [-0.35, -0.42], [-0.45, 0.36]]) candle(TP[0] + dx, TH, TP[2] + dz, 0.16 + Math.abs(dx) * 0.2);
  for (const [sx, z] of [[-1, -14], [-1, 13], [1, -12], [1, 10]]) for (const d of [-0.5, 0, 0.5]) candle(sx * 19.0, 2.62, z + d, d ? 0.26 : 0.36);
  for (let i = 0; i < 8; i++) candle(-6.3 + i * 1.8, 1.2, SZ + 2.8, 0.3 + (i % 3) * 0.08);
  const candleL = new THREE.PointLight('#ffb15a', 1.2, 3, 2); candleL.position.set(TP[0], TH + 0.5, TP[2]); scene.add(candleL);

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
    return { g, pl, pr, r: 5 + R() * 10, cz: -20 + R() * 36, y: 13 + R() * 8, sp: (0.25 + R() * 0.35) * (i % 2 ? 1 : -1), ph: R() * 6.28 };
  });

  /* --- молнии за окнами: вспышка в окнах и холодный свет по залу --- */
  const winM = new THREE.MeshBasicMaterial({ color: '#cfd8ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 7) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 8.6), winM); m.position.set(sx * 19.84, 16.2, z); m.rotation.y = -sx * Math.PI / 2; scene.add(m);
  }

  /* --- камера --- */
  // чуть со стороны зрителя (+Z), чтобы верх экрана смотрел вверх кадра
  // наклон вперёд нужен, чтобы верх экрана смотрел вверх кадра; у самого экрана он почти нулевой — фото без перекоса
  const P = (k, off = 0.12) => [photoC[0] + nrm.x * k, photoC[1] + nrm.y * k, photoC[2] + nrm.z * k + k * off];
  // конец пути: фото (0.07 × 0.07) ровно заполняет кадр по ширине — дальше склейка с первым кадром виллы
  const asp = innerWidth / innerHeight, fov0 = asp < 0.8 ? 72 : asp < 1.2 ? 64 : 54, tn = Math.tan(THREE.MathUtils.degToRad(fov0) / 2);
  const dEnd = 0.0345 / (tn * Math.max(1, asp));
  const keys = [
    // склейка с дверью клуба: тот же кадр в масштабе дворца, створки приоткрыты так же — и распахиваются
    { p: [0, 4.2, 27.5], l: [0, 3.75, 24.6], t: 0 },
    { p: [0, 3.9, 27.0], l: [0, 3.8, 20], t: 0.12 },
    // в зал: люстры и галереи, видео в золотой раме слева
    { p: [0, 3.4, 19], l: [0, 12, 0], t: 0.2 },
    { p: [-3.8, 3.3, 8], l: [-19.8, 5.8, -1.2], t: 0.29 },
    // вокруг фонтана слева: впереди сцена, экран и ангелы
    { p: [-7.6, 3.2, -1], l: [0, 2.5, FZ], t: 0.38 },
    { p: [-6.8, 3.6, -10], l: [0, 7, SZ - 1], t: 0.48 },
    { p: [0, 4.2, -14], l: [0, 8.5, Z2], t: 0.58 },
    // разворот: с другой стороны фонтана — столик со смартфоном
    { p: [7.6, 3.4, -9], l: [0, 2.6, FZ], t: 0.68 },
    { p: [8.4, 2.6, -1.6], l: [TP[0], TH, TP[2]], t: 0.8 },
    { p: [P(0.6)[0], P(0.6)[1], P(0.6)[2] + 0.25], l: photoC, t: 0.88 },
    { p: P(0.16, 0.06), l: photoC, t: 0.94 },
    { p: P(dEnd * 1.7, 0.02), l: photoC },
    { p: P(dEnd, 0.008), l: photoC, t: 0.985 },
    { p: P(dEnd * 0.97, 0.008), l: photoC, t: 1 },
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
  const near = (t) => (t > 0.88 ? 0.004 : 0.05);
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.82) / 0.05));   // к экрану смартфона — без влияния головы и курсора
  // фото в телефоне — живой кадр виллы (рендер следующей сцены); fov подобран так, что в конце пути фото = первый кадр виллы
  const preview = { mesh: photo, t: 0, fov: 2 * Math.atan(0.035 / dEnd) * 180 / Math.PI, live: (t) => t > 0.78 };
  return { scene, cam: kit.camPath(keys), update, near, calm, preview };
}
