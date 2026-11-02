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
  for (let i = 0; i < 12; i++) b.add(G.tor(DR, 0.28, 6, 72, Math.PI), '#b8b0ff', 'metal', M(DC, [0, (i / 12) * Math.PI, 0]));
  for (const h of [10, 22, 33, 41]) {
    const r = Math.sqrt(DR * DR - h * h);
    b.add(G.tor(r, 0.32, 6, 96), '#d6d0ff', 'metal', M([DC[0], h, DC[2]], [Math.PI / 2, 0, 0]));
    if (h === 10) for (let a = 0; a < 64; a++) { const t = (a / 64) * Math.PI * 2; glows.push([DC[0] + Math.cos(t) * (r - 0.5), h - 0.4, DC[2] + Math.sin(t) * (r - 0.5), a % 2 ? PINK : '#ffd2a1', 0.9, 1.2]); }
  }
  // римские колонны по кругу
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2, x = Math.cos(a) * 32, z = DC[2] + Math.sin(a) * 32;
    if (z < -12 && Math.abs(x) < 12) continue; // за сценой не ставим
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
  kit.djBooth(b, [0, ST, SZ + 1.2], 0, { w: 3.4 });
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
  scene.add(kit.screen(15, 7.5, tex, [0, ST + 4.4, SZ - 3.0]));
  // надувные буквы
  kit.text3d(b, font, 'STAYA', { size: 2.4, color: '#ff4fb8', p: [0, TY + 0.6, SZ - 0.4] });

  // колонки
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 10.6, top, SZ + 1], 0, 1.7, 1.5); kit.speaker(b, [sx * 10.6, top + 1.7, SZ + 1], 0, 1.7, 1.5); }

  /* --- горки --- */
  const TW = [-26, 0, 14];
  // опоры вышки — внутри витка горки (радиус витка 6, труба 1.5), чтобы не протыкать трубу
  for (const dx of [-2.4, 2.4]) for (const dz of [-2.4, 2.4]) b.add(G.cyl(0.32, 0.32, 19, 10), '#e8e2f6', 'metal', M([TW[0] + dx, 9.5, TW[2] + dz]));
  b.add(G.rbox(6.6, 0.5, 6.6, 0.1), '#e8e2f6', 'gloss', M([TW[0], 19.6, TW[2]]));
  b.add(G.box(6.6, 0.08, 0.08), CYAN, 'neon', M([TW[0], 19.9, TW[2] + 3.3]));
  // горка камеры (прозрачная, с неоновыми кольцами)
  const S = [];
  // короткая горка: один виток с вышки и сразу к бассейну
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2; S.push(V(TW[0] + 6 * Math.cos(a), 18 - (i / 10) * 13, TW[2] + 6 * Math.sin(a))); }
  S.push(V(-19, 3.2, 6.6), V(-14.6, 1.7, 5.0), V(-12.6, 1.35, 4.4));
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
  // остальные горки, надувные игрушки, лежаки и пальмы убраны: их заменят модели из библиотек рядом с траекторией

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.55));
  const L = (c, i, p, d = 70) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 380, [0, 9, -9]); L(CYAN, 300, [-8, 4, 4]); L(VIOLET, 360, [10, 7, 6]); L(CYAN, 260, [-24, 12, 14], 40);
  scene.add(kit.stars(700, 300, 0.3));
  scene.add(kit.glowPoints(glows));
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
    { p: [1.6, 3.45, -17.7], l: [0.85, 3.3, -12], t: 0.716 },
    // между спинами диджеев, над пультом — и прыжок в бассейн
    { p: [0.85, 3.5, -15.9], l: [0.85, 3.1, -10] },
    { p: [0.85, 3.75, -13.6], l: [0.85, 2, -6], t: 0.832 },
    { p: [0.85, 3.4, -10.6], l: [0.85, 0, -5], t: 0.897 },
    { p: [0.85, 1.2, -7.6], l: [0.85, -3, -3] },
    { p: [0.85, -1.0, -6.0], l: [0.85, -5, -2], t: 1 },
  );
  // под водой — плотная синяя дымка (нырок)
  const fogC = scene.fog.color.clone(), fogD = scene.fog.density, blue = new THREE.Color('#0a5f8f');
  const update = (t) => {
    const u = Math.min(0.97, (t / 0.2) * 0.97);
    tl1.position.copy(slide.getPointAt(Math.min(1, u + 0.012))); tl2.position.copy(slide.getPointAt(Math.min(1, u + 0.03)));
    tl1.intensity = tl2.intensity = t < 0.22 ? 14 : 0;
    const k = Math.min(1, Math.max(0, (t - 0.955) / 0.03));
    scene.fog.color.copy(fogC).lerp(blue, k); scene.fog.density = fogD + k * 0.25;
  };
  return { scene, cam: kit.camPath(keys), update };
}
