// 01 · STAYA AQUA — ночной аквапарк под куполом.
// Камера скатывается по тёмной трубе горки (в ней светятся только ленты, в «окнах» видно аквапарк),
// облетает диджейский пульт, проходит между спинами диджеев и прыгает в бассейн.
export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04020c');
  scene.fog = new THREE.FogExp2('#0b0626', 0.011);
  scene.environment = kit.env(renderer, ['#ff2fa8', '#2fe6ff', '#8a4dff', '#ffffff', '#2f6bff', '#ff8ad8']);
  const b = new Builder(), glows = [], R = kit.rng(11);
  b.rim = ['#2fe6ff', '#ff3fb4', '#7ff2ff'];   // контровой свет силуэтов
  const PINK = '#ff2fa8', CYAN = '#2fe6ff', VIOLET = '#8a4dff', YEL = '#ffd84a';

  /* --- зал: палуба вокруг бассейна (бассейн x[-15,15], z[-9,9]) --- */
  const deck = '#7d74a6', top = 0.4;
  b.add(G.box(100, 1, 40), deck, 'plastic', M([0, top - 0.5, -29]));
  b.add(G.box(100, 1, 40), deck, 'plastic', M([0, top - 0.5, 29]));
  b.add(G.box(35, 1, 18), deck, 'plastic', M([-32.5, top - 0.5, 0]));
  b.add(G.box(35, 1, 18), deck, 'plastic', M([32.5, top - 0.5, 0]));
  // бортик
  for (const [w, d, x, z] of [[30.8, 0.4, 0, -9.2], [30.8, 0.4, 0, 9.2], [0.4, 18.8, -15.2, 0], [0.4, 18.8, 15.2, 0]]) b.add(G.box(w, 0.14, d), '#f5f3ff', 'gloss', M([x, top + 0.07, z]));
  // чаша бассейна
  b.add(G.box(30, 0.2, 18), '#0a7fa8', 'plastic', M([0, -2.1, 0]));
  for (const [w, d, x, z] of [[30, 0.2, 0, -9.05], [30, 0.2, 0, 9.05], [0.2, 18, -15.05, 0], [0.2, 18, 15.05, 0]]) b.add(G.box(w, 2.4, d), '#1aa6cf', 'plastic', M([x, -0.9, z]));
  // подводные фонари
  for (let x = -12; x <= 12; x += 4) { glows.push([x, -0.6, -8.8, CYAN, 1.6, 1.4], [x, -0.6, 8.8, '#ffffff', 1.4, 1.0]); }

  /* --- купол: рёбра и кольца --- */
  const DR = 46, DC = [0, 0, -4];
  // сплошной купол аквапарка (без звёздного неба): ночная синева с сеткой панелей
  const domeT = kit.canvasTex(1024, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1550'); g.addColorStop(0.6, '#0f1a4a'); g.addColorStop(1, '#0a1236'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(160,190,255,.16)'; x.lineWidth = 2;
    for (let i = 0; i <= 32; i++) { x.beginPath(); x.moveTo((i / 32) * w, 0); x.lineTo((i / 32) * w, h); x.stroke(); }
    for (let j = 1; j < 10; j++) { x.beginPath(); x.moveTo(0, (j / 10) * h); x.lineTo(w, (j / 10) * h); x.stroke(); }
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DR + 0.6, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: domeT, side: THREE.BackSide, fog: false }));
  dome.position.set(...DC); scene.add(dome);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(DR + 0.6, DR + 0.6, 3, 64, 1, true), new THREE.MeshBasicMaterial({ color: '#0a1236', side: THREE.BackSide, fog: false }));
  ring.position.set(DC[0], -1.4, DC[2]); scene.add(ring);
  for (let i = 0; i < 12; i++) b.add(G.tor(DR, 0.28, 6, 72, Math.PI), '#b8b0ff', 'metal', M(DC, [0, (i / 12) * Math.PI, 0]));
  for (const h of [10, 22, 33, 41]) {
    const r = Math.sqrt(DR * DR - h * h);
    b.add(G.tor(r, 0.32, 6, 96), '#d6d0ff', 'metal', M([DC[0], h, DC[2]], [Math.PI / 2, 0, 0]));
    if (h === 10) for (let a = 0; a < 64; a++) { const t = (a / 64) * Math.PI * 2; glows.push([DC[0] + Math.cos(t) * (r - 0.5), h - 0.4, DC[2] + Math.sin(t) * (r - 0.5), a % 2 ? PINK : '#ffd2a1', 0.9, 1.2]); }
  }
  const TW = [-26, 0, 14];   // вышка горки
  // римские колонны по кругу
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2, x = Math.cos(a) * 32, z = DC[2] + Math.sin(a) * 32;
    if (z < -12 && Math.abs(x) < 12) continue; // за сценой не ставим
    if (Math.hypot(x - TW[0], z - TW[2]) < 9) continue; // и у вышки горки: колонна протыкала трубу
    b.add(G.cyl(0.65, 0.75, 10, 18), '#efe3cc', 'gloss', M([x, top + 5, z]));
    b.add(G.box(1.9, 0.5, 1.9), '#efe3cc', 'gloss', M([x, top + 10.2, z]));
    b.add(G.box(1.9, 0.5, 1.9), '#efe3cc', 'gloss', M([x, top + 0.25, z]));
    glows.push([x, top + 10.8, z, '#ffd2a1', 2.2, 0.9]);
  }
  b.add(G.tor(32, 0.45, 6, 128), '#efe3cc', 'gloss', M([0, top + 10.7, DC[2]], [Math.PI / 2, 0, 0]));

  /* --- сцена --- */
  const SZ = -15.5;
  b.add(G.rbox(18, 1.6, 6.5, 0.1), '#120e1e', 'gloss', M([0, top + 0.8, SZ]));
  b.add(G.box(18, 0.08, 0.08), PINK, 'neon', M([0, top + 1.6, SZ + 3.27]));
  b.add(G.box(18, 0.06, 0.06), CYAN, 'neon', M([0, top + 0.15, SZ + 3.27]));
  const ST = top + 1.6;
  kit.djBooth(b, [0, ST, SZ + 1.2], 0, { w: 3.4, decks: false });
  const props = [kit.decks(scene, [0, ST + 1.05, SZ + 1.2], 0, 1.7)];
  // ферма над сценой
  const TY = 11.5, x0 = -9, x1 = 9, zf = SZ + 3, zb = SZ - 2.6;
  for (const x of [x0, x1]) for (const z of [zf, zb]) kit.truss(b, [x, ST, z], [x, TY, z], 0.5);
  kit.truss(b, [x0, TY, zf], [x1, TY, zf], 0.5); kit.truss(b, [x0, TY, zb], [x1, TY, zb], 0.5);
  kit.truss(b, [x0, TY, zf], [x0, TY, zb], 0.5); kit.truss(b, [x1, TY, zf], [x1, TY, zb], 0.5);
  // прожекторы и лучи
  for (let i = 0; i < 8; i++) {
    const x = -7 + i * 2, c = [PINK, CYAN, VIOLET, '#ffffff'][i % 4];
    b.add(G.cyl(0.22, 0.28, 0.5, 10), '#1a1a20', 'metal', M([x, TY - 0.55, zf]));
    glows.push([x, TY - 0.85, zf, c, 2.4, 2]);
    kit.beam(b, [x, TY - 0.85, zf], [x * 1.9 + (i % 2 ? 3 : -3), 0.2, 4 + (i % 3) * 3], 2.2 + (i % 2), c);
  }
  // экран
  const tex = kit.canvasTex(1024, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2b0a5c'); g.addColorStop(0.5, '#a0106a'); g.addColorStop(1, '#0b5c9c');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.35; for (let i = 0; i < 18; i++) { x.strokeStyle = i % 2 ? '#2fe6ff' : '#ff6fd0'; x.lineWidth = 6; x.beginPath(); for (let k = 0; k <= w; k += 16) x.lineTo(k, h * 0.5 + Math.sin(k / 70 + i) * (40 + i * 10)); x.stroke(); }
    x.globalAlpha = 1; const sg = x.createRadialGradient(w / 2, h * 0.62, 0, w / 2, h * 0.62, 190); sg.addColorStop(0, '#fff2c4'); sg.addColorStop(0.5, '#ff7ab8'); sg.addColorStop(1, 'rgba(255,60,160,0)');
    x.fillStyle = sg; x.beginPath(); x.arc(w / 2, h * 0.62, 190, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#12052a'; for (let i = 0; i < 9; i++) x.fillRect(w / 2 - 200, h * 0.6 + i * 22, 400, 9);
    kit.gradText(x, 'AQUA', w / 2, h * 0.3, 200, '#ffffff', '#7ff2ff', { glow: '#2fe6ff' });
  });
  // экран за пультом: видео с вечеринки (video/aqua.mp4), пока его нет — заставка
  kit.videoScreen(scene, 'video/aqua-h.mp4', 15, 7.5, [0, ST + 4.4, SZ - 3.0], [0, 0, 0], tex);
  // надувные буквы
  kit.text3d(b, font, 'STAYA', { size: 2.4, color: '#ff4fb8', p: [0, TY + 0.6, SZ - 0.4] });

  // колонки
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 10.6, top, SZ + 1], 0, 1.7, 1.5); kit.speaker(b, [sx * 10.6, top + 1.7, SZ + 1], 0, 1.7, 1.5); }

  /* --- горки --- */
  // опоры вышки — внутри витка горки (радиус витка 6, труба 1.5), чтобы не протыкать трубу
  for (const dx of [-2.4, 2.4]) for (const dz of [-2.4, 2.4]) b.add(G.cyl(0.32, 0.32, 19, 10), '#e8e2f6', 'metal', M([TW[0] + dx, 9.5, TW[2] + dz]));
  b.add(G.rbox(6.6, 0.5, 6.6, 0.1), '#e8e2f6', 'gloss', M([TW[0], 19.6, TW[2]]));
  b.add(G.box(6.6, 0.08, 0.08), CYAN, 'neon', M([TW[0], 19.9, TW[2] + 3.3]));
  // горка камеры (прозрачная, с неоновыми кольцами)
  const S = [];
  // короткая горка: ровно один виток с вышки; виток кончается там, где его касательная уже смотрит к бассейну,
  // поэтому выход идёт по прямой без разворота (раньше конец витка смотрел от бассейна и давал петлю)
  const A1 = Math.atan2(-0.97, -0.25) + Math.PI * 2, A0 = A1 - Math.PI * 2;   // касательная (−sin a, cos a) ≈ (0.97, −0.25)
  for (let i = 0; i <= 12; i++) { const a = A0 + (i / 12) * (A1 - A0); S.push(V(TW[0] + 6 * Math.cos(a), 18 - (i / 12) * 13, TW[2] + 6 * Math.sin(a))); }
  S.push(V(-22.6, 3.9, 7.4), V(-17.6, 2.4, 6.0), V(-14.6, 1.7, 5.0), V(-12.6, 1.35, 4.4));
  const slide = new THREE.CatmullRomCurve3(S, false, 'centripetal');
  // труба непрозрачная; несколько коротких «окон» — спойлер того, что снаружи
  const TS = 260, RS = 18, tubeGeo = new THREE.TubeGeometry(slide, TS, 1.5, RS, false);
  const WIN = [[0.2, 0.25], [0.45, 0.5], [0.7, 0.76], [0.93, 1.01]];
  const isWin = (u) => WIN.some(([a, c]) => u >= a && u < c);
  const idx = tubeGeo.index.array, solid = [], clear = [];
  for (let j = 0; j < TS; j++) (isWin(j / TS) ? clear : solid).push(...idx.slice(j * RS * 6, (j + 1) * RS * 6));
  const part = (list) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', tubeGeo.attributes.position); g.setAttribute('normal', tubeGeo.attributes.normal); g.setIndex(list); return g; };
  scene.add(new THREE.Mesh(part(solid), new THREE.MeshPhysicalMaterial({ color: '#1c1238', emissive: '#12082a', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide })));
  const glassM = new THREE.Mesh(part(clear), new THREE.MeshPhysicalMaterial({ color: '#56dcff', transparent: true, opacity: 0.22, roughness: 0.06, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  glassM.renderOrder = 2; scene.add(glassM);
  // свет лент внутри трубы едет вместе с камерой
  const tl1 = new THREE.PointLight(PINK, 14, 7, 2), tl2 = new THREE.PointLight(CYAN, 14, 7, 2); scene.add(tl1, tl2);
  for (let i = 1; i < 60; i++) {
    const u = i / 60, p = slide.getPointAt(u), tg = slide.getTangentAt(u);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), tg);
    b.add(G.tor(1.46, 0.05, 5, 36), i % 2 ? PINK : CYAN, 'neon', new THREE.Matrix4().compose(p, q, V(1, 1, 1)));
    if (!isWin(u)) glows.push([p.x, p.y + 1.3, p.z, i % 2 ? PINK : CYAN, 1.2, 0.5]);
  }
  /* --- три вертикальных экрана напротив сцены, через бассейн --- */
  [['video/aqua-v.mp4', 9], ['video/aqua-v2.mp4', 0], ['video/aqua-v3.mp4', -9]].forEach(([src, x], i) => kit.vScreen(scene, src, [x * 1.05, top + 0.8, 12.6], Math.PI, 13.5, { edge: [CYAN, PINK, CYAN][i] }));
  /* --- надувные круги и пальмы (Sketchfab, CC BY) — у траектории камеры после горки, чтобы детали было видно --- */
  // надувные круги — хаотично по бассейну, пара лежит на суше (Sketchfab, CC BY); у места прыжка (x≈10, z≈0) свободно
  const FL = [['sf_duck', -11.2, 5.8, 2.2, 1.7], ['sf_flamingo', -4.2, -5.4, -0.7, 1.6], ['sf_duck', 3.4, 6.6, -1.2, 1.5], ['sf_flamingo', 12.2, -6.1, 1.9, 1.7],
    ['sf_duck', -2.4, 1.2, 0.8, 1.4], ['sf_flamingo', 6.1, 3.1, 2.8, 1.5], ['sf_duck', 13.1, 6.8, 4.1, 1.6], ['sf_flamingo', -12.8, -6.6, 5.2, 1.6]];
  props.push(kit.prop(scene, 'sf_floats', { p: [-5.5, -0.2, 0.5], ry: 1.1, w: 7.5 }));
  for (const [n, x, z, ry, w] of FL) props.push(kit.prop(scene, n, { p: [x, -0.12, z], ry, w }));
  // на суше: фламинго у шезлонгов справа от сцены, утка на западной палубе
  props.push(kit.prop(scene, 'sf_flamingo', { p: [17.6, top, -9.6], ry: 0.6, w: 1.6 }), kit.prop(scene, 'sf_duck', { p: [-19.5, top, 7.8], ry: 2.4, w: 1.5 }));
  // шезлонги (Sketchfab «Plastic lounge chair», CC BY): справа от сцены и на западной палубе у горок
  for (let i = 0; i < 4; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [17.5 + i * 1.6, top, -13.2], ry: 0, w: 1.9 }));
  for (let i = 0; i < 6; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [-27.5, top, -6.5 + i * 1.6], ry: Math.PI / 2, w: 1.9 }));
  // надувные мячи для игр — на палубе и в воде
  [['sf_ball1', -24.8, top, -4], ['sf_ball2', -25.6, top, 2.4], ['sf_ball1', -8.5, -0.15, -2.4], ['sf_ball2', 7.5, -0.15, -6.5], ['sf_ball2', 20.6, top, -11], ['sf_ball1', 0.5, -0.15, 7.6]]
    .forEach(([n, x, y, z], i) => props.push(kit.prop(scene, n, { p: [x, y, z], ry: i, w: 0.7 })));
  // новые водные горки на западной стороне — их видно с вышки (Sketchfab, CC BY)
  props.push(
    kit.prop(scene, 'sf_slide_tower', { p: [-22.5, top, -1.5], ry: 0.4, h: 11 }),
    kit.prop(scene, 'sf_slide_orange', { p: [-21, top, -10.5], ry: -Math.PI / 2, h: 5, dropFlat: true }),
    kit.prop(scene, 'sf_slide_green', { p: [-19.8, top, 4.6], ry: Math.PI / 2, h: 4.6, dropFlat: true }),
  );
  for (const [x, z, ry, h] of [[-30, -12, 0.3, 9], [-31, 8, 2.1, 8], [-18, 11.5, 4.0, 8.5], [24, -4, 1.2, 9], [24.5, 7, 3.3, 8]]) props.push(kit.prop(scene, 'sf_palm', { p: [x, top, z], ry, h }));
  /* --- вышка для прыжков на восточной стороне (четвёртая сторона бассейна) --- */
  const TWX = 19.4, TWH = 10.6;
  for (const dx of [-1.2, 1.2]) for (const dz of [-1.2, 1.2]) b.add(G.cyl(0.18, 0.2, TWH, 10), '#e8e2f6', 'metal', M([TWX + dx, top + TWH / 2, dz]));
  b.add(G.rbox(3.2, 0.3, 3.2, 0.05), '#f5f3ff', 'gloss', M([TWX, top + TWH, 0]));
  for (const dz of [-1.55, 1.55]) b.add(G.box(3.2, 0.06, 0.06), '#e8e2f6', 'metal', M([TWX, top + TWH + 1.0, dz]));
  b.add(G.box(0.06, 0.06, 3.2), '#e8e2f6', 'metal', M([TWX + 1.55, top + TWH + 1.0, 0]));
  for (const dz of [-1.55, 1.55]) for (const dx of [-1.5, 0, 1.5]) b.add(G.cyl(0.03, 0.03, 1.0, 6), '#e8e2f6', 'metal', M([TWX + dx, top + TWH + 0.5, dz]));
  for (let i = 0; i < 18; i++) b.add(G.box(0.05, 0.05, 0.7), '#e8e2f6', 'metal', M([TWX + 1.75, top + 0.4 + i * 0.58, 0]));   // лестница
  for (const dz of [-0.36, 0.36]) b.add(G.cyl(0.03, 0.03, TWH + 1, 6), '#e8e2f6', 'metal', M([TWX + 1.75, top + (TWH + 1) / 2, dz]));
  b.add(G.box(3.2, 0.06, 0.06), PINK, 'neon', M([TWX, top + TWH - 0.18, 1.62])); b.add(G.box(3.2, 0.06, 0.06), CYAN, 'neon', M([TWX, top + TWH - 0.18, -1.62]));
  props.push(kit.prop(scene, 'sf_diveboard', { p: [TWX - 2.4, top + TWH + 0.15, 0], ry: Math.PI / 2, w: 4.2 }));


  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.55));
  const L = (c, i, p, d = 70) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 380, [0, 9, -9]); L(CYAN, 300, [-8, 4, 4]); L(VIOLET, 360, [10, 7, 6]); L(CYAN, 260, [-24, 12, 14], 40);
  scene.add(kit.glowPoints(glows));
  await Promise.all(props);
  const built = b.build(); scene.add(built);
  kit.haze(scene, { box: [-26, 26, 4, 14, -22, 10], colors: ['#8a4dff', '#2fe6ff', '#ff2fa8'], n: 16, size: 16, opacity: 0.05 });
  await kit.applyBake(scene, built, 'aqua', { k: 32 });   // свет запечён в Blender (scripts/blender/bake_scene.py)
  const w = kit.water(30, 18, '#0b8fc0', { tile: 5, ei: 0.5, opacity: 0.88, emissive: '#0a6fa8' });
  w.position.y = 0.1; scene.add(w);

  /* --- камера: горка → бассейн → сцена → нырок --- */
  const keys = [];
  for (let i = 0; i <= 14; i++) {
    const u = (i / 14) * 0.97;
    const p = slide.getPointAt(u), l = slide.getPointAt(Math.min(1, u + 0.05));
    keys.push({ p: [p.x, p.y + 0.35, p.z], l: [l.x, l.y + 0.2, l.z], t: i === 0 ? 0 : i === 14 ? 0.2 : undefined });
  }
  keys.push(
    // плавный выход из горки: сначала по ходу движения, потом поворот к сцене
    { p: [-10.4, 1.75, 3.9], l: [-4, 3, -1.5] },
    { p: [-7.6, 2.7, 2.6], l: [0, 6, -14] },
    { p: [-4, 3.6, 0.5], l: [0, 7.5, -15] },
    { p: [0.5, 4.6, -3], l: [0, 8.5, -16], t: 0.406 },
    // облёт пульта справа и заход за спины диджеев
    { p: [6.5, 4.2, -9.5], l: [0, 3.2, -15] },
    { p: [7.6, 3.7, -15.6], l: [0, 3.2, -16] },
    { p: [4.6, 3.5, -17.8], l: [0, 3.3, -15] },
    { p: [1.6, 3.45, -17.7], l: [0.85, 3.3, -12], t: 0.6 },
    // над пультом — три экрана через бассейн, справа налево: боковое движение к востоку
    { p: [-1.8, 3.6, -13.2], l: [-9.5, 7.5, 12.6], t: 0.645 },
    { p: [1.8, 3.6, -12.6], l: [0, 7.5, 12.6], t: 0.7 },
    { p: [7.8, 3.6, -12.0], l: [9.5, 7.5, 12.6], t: 0.755 },
    // к четвёртой стороне бассейна и плавно вверх на вышку
    { p: [14.8, 4.8, -6.5], l: [20, 10, 0], t: 0.8 },
    { p: [19.8, 12.4, -1.4], l: [-20, 6, -1], t: 0.85 },
    // с вышки — взгляд на аквапарк напротив: горки, шезлонги, мячи
    { p: [20.2, 13.1, 0], l: [-24, 4.5, 1], t: 0.905 },
    // прыжок и нырок
    { p: [16.0, 12.0, 0], l: [10, 2, 0], t: 0.935 },
    { p: [12.4, 5.0, 0], l: [10.5, -3, 0], t: 0.965 },
    { p: [10.6, -1.0, 0], l: [9.8, -6, 0.2], t: 1 },
  );
  // под водой — плотная синяя дымка (нырок)
  const fogC = scene.fog.color.clone(), fogD = scene.fog.density, blue = new THREE.Color('#0a5f8f');
  const update = (t) => {
    const u = Math.min(0.97, (t / 0.2) * 0.97);
    tl1.position.copy(slide.getPointAt(Math.min(1, u + 0.012))); tl2.position.copy(slide.getPointAt(Math.min(1, u + 0.03)));
    tl1.intensity = tl2.intensity = t < 0.22 ? 14 : 0;
    const k = Math.min(1, Math.max(0, (t - 0.972) / 0.024));
    scene.fog.color.copy(fogC).lerp(blue, k); scene.fog.density = fogD + k * 0.25;
  };
  return { scene, cam: kit.camPath(keys), update };
}
