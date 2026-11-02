// 04 · STAYA HALLOWEEN — дворец XIX века. Два зала без подъёма на второй этаж:
// парадные двери → первый зал (колонны, гигантские ангелы, картины, галереи) → большие двери →
// второй зал: фонтан по центру, за ним диджейская инсталляция и экран с видео →
// стол у фонтана, на нём забытый смартфон с постом про Пхукет — камера ныряет в экран.
export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080203');
  scene.fog = new THREE.FogExp2('#1c0605', 0.016);
  scene.environment = kit.env(renderer, ['#ff2a14', '#ff8a2a', '#ffd28a', '#3b4bff', '#8a0d1a'], '#070203');
  const b = new Builder(), glows = [], props = [], R = kit.rng(31);
  const STONE = '#d9c7a4', GOLD = '#c9a24a', RED = '#7e0a16', WALL = '#bfa07e';
  const Z1 = 24.6, Z2 = -31, Z3 = -78;     // фасад, стена между залами, торец второго зала

  /* --- пол-шахматка и красная дорожка через оба зала --- */
  const chk = kit.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#e9e2d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#16100e'; x.fillRect(0, 0, w / 2, h / 2); x.fillRect(w / 2, h / 2, w / 2, h / 2); }, { repeat: [20, 52] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, Z1 - Z3), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.22, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (Z1 + Z3) / 2); scene.add(floor);
  const runner = (z0, z1) => {
    b.add(G.box(6, 0.03, z0 - z1), RED, 'matte', M([0, 0.015, (z0 + z1) / 2]));
    for (const sx of [-3, 3]) b.add(G.box(0.15, 0.035, z0 - z1), GOLD, 'metal', M([sx, 0.02, (z0 + z1) / 2]));
  };
  runner(Z1, Z2 + 0.6); runner(Z2 - 0.6, -44);

  /* --- стены и своды обоих залов --- */
  const L0 = Z1 - Z3, C0 = (Z1 + Z3) / 2;
  for (const sx of [-1, 1]) b.add(G.box(1, 26, L0), WALL, 'matte', M([sx * 20.5, 13, C0]));
  b.add(G.box(42, 26, 1), WALL, 'matte', M([0, 13, Z3 - 0.5]));
  b.add(G.cyl(20.5, 20.5, L0, 48, true), '#5a3020', 'matte', M([0, 24, C0], [Math.PI / 2, 0, 0], [1, 1, 0.35]));
  for (let z = Z1 - 2; z >= Z3 + 2; z -= 5) b.add(G.tor(20.3, 0.2, 5, 40, Math.PI), GOLD, 'metal', M([0, 24, z], [0, 0, 0], [1, 0.35, 1]));
  // окна с лунным светом и красные шторы
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 7) {
    b.add(G.box(0.1, 7, 3), '#2f3cff', 'neon', M([sx * 19.95, 15.5, z]));
    b.add(G.cyl(1.5, 1.5, 0.1, 18, false), '#2f3cff', 'neon', M([sx * 19.95, 19, z], [0, 0, Math.PI / 2]));
    glows.push([sx * 19, 16, z, '#3b4bff', 6, 0.35]);
    for (const dz of [-1.9, 1.9]) for (let f = 0; f < 3; f++) b.add(G.cyl(0.28, 0.4, 10, 8), '#6a0612', 'plastic', M([sx * 19.6, 15, z + dz + (f - 1) * 0.3]));
  }

  /* --- первый зал: галереи второго этажа (туда не поднимаемся) --- */
  for (const sx of [-1, 1]) {
    b.add(G.box(9, 0.8, Z1 - Z2), '#8a6a50', 'plastic', M([sx * 16.5, 10, (Z1 + Z2) / 2]));
    b.add(G.box(0.3, 0.2, Z1 - Z2), GOLD, 'metal', M([sx * 12, 10.45, (Z1 + Z2) / 2]));
    for (let z = Z2 + 1; z <= Z1 - 1; z += 0.7) b.add(G.cyl(0.08, 0.12, 1, 6), STONE, 'gloss', M([sx * 12, 10.9, z]));
    b.add(G.box(0.4, 0.15, Z1 - Z2), STONE, 'gloss', M([sx * 12, 11.45, (Z1 + Z2) / 2]));
    for (let z = -22; z <= 18; z += 10) glows.push([sx * 12, 12.2, z, '#ffb15a', 1.4, 1.6]);
  }
  // колонны: одна мраморная модель (Sketchfab «Classical Marble Column», CC BY), повторена по обоим этажам и во втором зале
  for (const sx of [-1, 1]) {
    for (let z = -26; z <= 20; z += 7.5) {
      props.push(kit.prop(scene, 'sf_column', { p: [sx * 12, 0, z], h: 9.6 }));
      props.push(kit.prop(scene, 'sf_column', { p: [sx * 12, 11.5, z], h: 8.2 }));
    }
    for (let z = -36; z >= -72; z -= 6) props.push(kit.prop(scene, 'sf_column', { p: [sx * 16.5, 0, z], h: 21 }));
  }

  /* --- люстры (Poly Haven, CC0) --- */
  [['Chandelier_01', 14], ['Chandelier_02', 2], ['Chandelier_03', -12], ['Chandelier_02', -52]].forEach(([n, z]) => {
    kit.rod(b, [0, 24, z], [0, 18.1, z], 0.05, GOLD, 'metal');
    props.push(kit.prop(scene, n, { p: [0, 18.2, z], s: 6.2, anchor: 'top', emissive: '#ffb15a', ei: 0.35 }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; glows.push([Math.cos(a) * 1.4, 16.2, z + Math.sin(a) * 1.4, '#ffc27a', 0.6, 2]); }
    glows.push([0, 15.8, z, '#ffb15a', 7, 0.5]);
  });
  for (const sx of [-1, 1]) for (const z of [-20, -8, 4, 16]) {
    props.push(kit.prop(scene, 'lantern_chandelier_01', { p: [sx * 16.5, 9.6, z], s: 2.3, anchor: 'top', emissive: '#ffb15a', ei: 0.3 }));
    glows.push([sx * 16.5, 8.4, z, '#ffc27a', 2.2, 0.8]);
  }
  for (const sx of [-1, 1]) for (const z of (sx < 0 ? [-14, 13] : [-12, -1, 10])) props.push(kit.prop(scene, 'GothicCabinet_01', { p: [sx * 19.2, 0, z], ry: -sx * Math.PI / 2, s: 2.1 }));

  /* --- гигантские статуи высотой во весь зал --- */
  // ангелы (Sketchfab «Angel (old marble version)», CC BY) по сторонам больших дверей
  for (const sx of [-1, 1]) props.push(kit.prop(scene, 'sf_angel', { p: [sx * 8.6, 0, Z2 + 3.6], ry: -sx * 0.35, h: 21 }));
  // девушки с амфорой (Sketchfab «Girl With Amphora», CC BY) — во втором зале по сторонам сцены
  for (const sx of [-1, 1]) props.push(kit.prop(scene, 'sf_amphora', { p: [sx * 12.5, 0, -68], ry: -sx * 0.5, h: 19 }));

  /* --- картины: полотна Cleveland Museum of Art (CC0) в рамах Poly Haven --- */
  const ART = ['149108', '124089', '125247', '141549', '143206', '122349', '149104', '147479', '128842', '145148', '122347', '160885'];
  const art = (i, p, ry, h) => props.push(kit.painting(scene, `world/art/cma_${ART[i % ART.length]}.webp`, { p, ry, h }));
  // видео с вечеринки в золотой раме — на левой стене первого зала
  props.push(kit.painting(scene, 'video/halloween-v.mp4', { video: true, p: [-19.85, 5.6, -1], ry: Math.PI / 2, h: 7.6 }));
  [[-1, -22], [-1, -10], [-1, 8], [-1, 19], [1, -15], [1, -1], [1, 13]].forEach(([sx, z], i) => art(i, [sx * 19.9, 4.6, z], sx < 0 ? Math.PI / 2 : -Math.PI / 2, 4.4));
  [[-1, -39], [-1, -51], [-1, -63], [1, -45], [1, -57], [1, -69]].forEach(([sx, z], i) => art(i + 7, [sx * 19.9, 6, z], sx < 0 ? Math.PI / 2 : -Math.PI / 2, 6.5));
  for (const sx of [-1, 1]) art(sx < 0 ? 0 : 6, [sx * 13, 15.5, Z2 + 0.6], 0, 7);

  /* --- парадный вход и большие двери между залами --- */
  b.add(G.box(17.8, 26, 0.8), WALL, 'matte', M([-12.1, 13, Z1])); b.add(G.box(17.8, 26, 0.8), WALL, 'matte', M([12.1, 13, Z1]));
  b.add(G.box(6.4, 17.5, 0.8), WALL, 'matte', M([0, 17.25, Z1]));
  const front = kit.grandDoor(scene, b, [0, 0, Z1], 0, 1);
  b.add(G.box(6, 0.04, 0.1), '#ff8a2a', 'neon', M([0, 0.03, Z1 - 0.3]));
  // стена между залами: проём под двери в 1.5 раза больше
  const DS = 1.5;
  b.add(G.box(15.6, 26, 1), WALL, 'matte', M([-12.7, 13, Z2])); b.add(G.box(15.6, 26, 1), WALL, 'matte', M([12.7, 13, Z2]));
  b.add(G.box(9.8, 26 - 8.6 * DS, 1), WALL, 'matte', M([0, 8.6 * DS + (26 - 8.6 * DS) / 2, Z2]));
  const inner = kit.grandDoor(scene, b, [0, 0, Z2 + 1.25], 0, DS);
  kit.text3d(b, font, 'HALLOWEEN', { size: 1.25, color: '#ff4a1a', p: [0, 15.2, Z2 + 0.7], bevel: 0.16 });
  kit.text3d(b, font, 'STAYA', { size: 0.8, color: '#f4e6c8', p: [0, 17.3, Z2 + 0.7], bevel: 0.1, kind: 'metal' });
  glows.push([0, 6, Z2 - 3, '#ff8a2a', 14, 0.55]);

  /* --- второй зал: фонтан по центру --- */
  const FZ = -50;
  b.add(G.cyl(5.2, 5.4, 0.9, 48), STONE, 'gloss', M([0, 0.45, FZ]));
  b.add(G.tor(5.2, 0.25, 8, 48), STONE, 'gloss', M([0, 0.9, FZ], [Math.PI / 2, 0, 0]));
  const fw = kit.water(9.6, 9.6, '#1a6a8a', { tile: 2, ei: 0.4, emissive: '#2a8ac0', opacity: 0.85 });
  fw.geometry.dispose(); fw.geometry = new THREE.CircleGeometry(5.0, 48); fw.position.set(0, 0.78, FZ); scene.add(fw);
  // скан фонтана с путти (Sketchfab «Fountain with three putts, Brno», CC BY)
  props.push(kit.prop(scene, 'sf_fountain', { p: [0, 0.75, FZ], h: 5.2 }));
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; glows.push([Math.cos(a) * 4.4, 0.95, FZ + Math.sin(a) * 4.4, '#7fd8ff', 0.9, 1.2]); }

  /* --- диджейская инсталляция за фонтаном и экран с видео --- */
  const SZ = -68;
  b.add(G.rbox(14, 1.2, 6, 0.08), '#120808', 'gloss', M([0, 0.6, SZ]));
  b.add(G.box(14, 0.06, 0.06), '#ff4a1a', 'neon', M([0, 1.2, SZ + 3]));
  kit.djBooth(b, [0, 1.2, SZ + 1.2], 0, { w: 3.2, decks: false, front: '#ff4a1a', front2: '#ffb15a', body: '#1a0606' });
  props.push(kit.decks(scene, [0, 2.25, SZ + 1.2], 0, 1.7));
  kit.vScreen(scene, 'video/halloween-v2.mp4', [0, 2.2, Z3 + 0.3], 0, 13, { edge: '#ff4a1a', stand: false });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 6, 1.2, SZ], 0, 1.8, 1.3); kit.speaker(b, [sx * 6, 3.0, SZ], 0, 1.4, 1.1); }

  /* --- стол у фонтана: напитки и забытый смартфон --- */
  const TP = [5.6, 0, -43.5], TH = 0.98;
  b.add(G.cyl(0.9, 0.9, 0.06, 32), '#1a0606', 'gloss', M([TP[0], TH - 0.03, TP[2]]));
  b.add(G.cyl(0.06, 0.08, TH - 0.06, 10), GOLD, 'metal', M([TP[0], (TH - 0.06) / 2, TP[2]]));
  b.add(G.cyl(0.4, 0.45, 0.04, 24), GOLD, 'metal', M([TP[0], 0.02, TP[2]]));
  props.push(kit.prop(scene, 'sf_martini', { p: [TP[0] - 0.42, TH, TP[2] - 0.25], h: 0.18 }));
  props.push(kit.prop(scene, 'sf_summer', { p: [TP[0] + 0.35, TH, TP[2] - 0.38], h: 0.24, ry: 1 }));
  props.push(kit.prop(scene, 'sf_malibu', { p: [TP[0] + 0.45, TH, TP[2] + 0.3], h: 0.2, ry: 2.2 }));
  // смартфон лежит экраном вверх
  const phone = new THREE.Group(); phone.rotation.order = 'YXZ';
  phone.position.set(TP[0] - 0.05, TH + 0.006, TP[2] + 0.12); phone.rotation.set(-Math.PI / 2, 0.12, 0);
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

  /* --- летучие мыши под сводом --- */
  const bat = new THREE.Shape();
  bat.moveTo(0, 0.2); bat.quadraticCurveTo(0.6, 0.6, 1.4, 0.4); bat.quadraticCurveTo(1.1, 0.1, 1.2, -0.2); bat.quadraticCurveTo(0.8, 0, 0.6, -0.3); bat.quadraticCurveTo(0.3, -0.1, 0, -0.35);
  bat.quadraticCurveTo(-0.3, -0.1, -0.6, -0.3); bat.quadraticCurveTo(-0.8, 0, -1.2, -0.2); bat.quadraticCurveTo(-1.1, 0.1, -1.4, 0.4); bat.quadraticCurveTo(-0.6, 0.6, 0, 0.2);
  for (let i = 0; i < 16; i++) b.add(new THREE.ExtrudeGeometry(bat, { depth: 0.05, bevelEnabled: false, curveSegments: 6 }), '#0a0505', 'plastic', M([(R() - 0.5) * 24, 14 + R() * 7, -70 + R() * 84], [Math.PI / 2 * 0, R() * 6, R() * 0.4], 0.8 + R() * 0.8));

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#ff6a4a', '#1a0505', 0.5));
  const L = (c, i, p, d = 60) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ff2a14', 650, [0, 12, 8]); L('#ff8a2a', 420, [0, 9, -18]); L('#ffb15a', 260, [0, 15, 3], 30); L('#4a5cff', 160, [-17, 12, 0], 30); L('#4a5cff', 160, [17, 12, 0], 30);
  L('#ff5a1f', 520, [0, 12, -46]); L('#7fd8ff', 90, [0, 4, FZ], 14); L('#ff2a14', 380, [0, 8, -64], 30); L('#ffb15a', 14, [TP[0], 2.4, TP[2]], 5);

  await Promise.all(props);
  scene.add(kit.glowPoints(glows));
  kit.haze(scene, { box: [-18, 18, 0.5, 6, -74, 26], colors: ['#ff5a1f', '#ff8a2a', '#3b4bff'], n: 30, size: 10, opacity: 0.09 });
  scene.add(b.build());

  /* --- камера --- */
  // чуть со стороны зрителя (+Z), чтобы верх экрана смотрел вверх кадра
  const P = (k) => [photoC[0] + nrm.x * k, photoC[1] + nrm.y * k, photoC[2] + nrm.z * k + k * 0.12];
  const keys = [
    // перед закрытыми дверями — двери открываются
    { p: [0, 3.6, 29.2], l: [0, 3.6, 20], t: 0 },
    { p: [0, 3.6, 28.6], l: [0, 3.8, 20], t: 0.12 },
    // первый зал: колонны, картины, галереи, гигантские ангелы
    { p: [0, 3.2, 20], l: [-6, 5.5, 0], t: 0.2 },
    { p: [-4.2, 3.3, 3], l: [-19.8, 5.8, -1.2], t: 0.27 },
    { p: [0.2, 3.1, 1], l: [8, 6, -12], t: 0.34 },
    { p: [0, 3.2, -6], l: [0, 9, Z2], t: 0.42 },
    { p: [0, 3.3, -20], l: [0, 6.5, Z2], t: 0.5 },
    // большие двери распахиваются — второй зал
    { p: [0, 3.4, -26], l: [0, 5, -50], t: 0.58 },
    { p: [-3.2, 3.2, -36], l: [0, 3.6, FZ], t: 0.67 },
    // фонтан и диджейская инсталляция за ним, экран с видео
    { p: [-6.4, 3, -44], l: [0, 5.5, -66], t: 0.76 },
    // к столу у фонтана — взгляд на забытый смартфон
    { p: [2.6, 2.3, -41.2], l: [TP[0], TH, TP[2]], t: 0.85 },
    { p: [P(0.6)[0], P(0.6)[1], P(0.6)[2] + 0.25], l: photoC, t: 0.91 },
    { p: P(0.16), l: photoC, t: 0.95 },
    { p: P(0.045), l: photoC },
    { p: P(0.022), l: photoC, t: 1 },
  ];
  const sm = (a, c, t) => { const k = Math.min(1, Math.max(0, (t - a) / (c - a))); return k * k * (3 - 2 * k); };
  const update = (t) => { front.open(sm(0.02, 0.13, t)); inner.open(sm(0.46, 0.58, t)); };
  const near = (t) => (t > 0.9 ? 0.004 : 0.05);
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.84) / 0.05));   // к экрану смартфона — без влияния головы и курсора
  return { scene, cam: kit.camPath(keys), update, near, calm };
}
