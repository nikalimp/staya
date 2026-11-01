// 01 · STAYA AQUA — ночной аквапарк под куполом.
// Камера скатывается по прозрачной горке, вылетает над бассейном к сцене и ныряет в воду.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04020c');
  scene.fog = new THREE.FogExp2('#0b0626', 0.011);
  scene.environment = kit.env(renderer, ['#ff2fa8', '#2fe6ff', '#8a4dff', '#ffffff', '#2f6bff', '#ff8ad8']);
  const b = new Builder(), glows = [], R = kit.rng(11);
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
  kit.figure(b, { p: [0, ST, SZ + 0.3], pose: 'dj', top: '#f4f4f4', bottom: '#1a1a22', hair: '#1a1410', cap: '#111', glasses: true, i: 2 });
  kit.figure(b, { p: [-1.6, ST, SZ - 0.2], pose: 'up', top: '#ffe14a', bottom: '#222', hair: '#f3d38a', longHair: 2, i: 3 });
  kit.figure(b, { p: [1.7, ST, SZ - 0.1], pose: 'wave', top: '#ff7ad1', bottom: '#2a2a33', hair: '#2a1710', longHair: 1, i: 0 });
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
  for (const dx of [-3.5, 3.5]) for (const dz of [-3.5, 3.5]) b.add(G.cyl(0.35, 0.35, 19, 10), '#e8e2f6', 'metal', M([TW[0] + dx, 9.5, TW[2] + dz]));
  b.add(G.rbox(9, 0.5, 9, 0.1), '#e8e2f6', 'gloss', M([TW[0], 19, TW[2]]));
  b.add(G.box(9, 0.08, 0.08), CYAN, 'neon', M([TW[0], 19.3, TW[2] + 4.5]));
  // горка камеры (прозрачная, с неоновыми кольцами)
  const S = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 3.5; S.push(V(TW[0] + 6 * Math.cos(a), 18 - (i / 16) * 13, TW[2] + 6 * Math.sin(a))); }
  S.push(V(-19, 3.2, 6.6), V(-14.6, 1.7, 5.0), V(-12.6, 1.35, 4.4));
  const slide = new THREE.CatmullRomCurve3(S, false, 'centripetal');
  const slideMesh = new THREE.Mesh(new THREE.TubeGeometry(slide, 260, 1.5, 18, false),
    new THREE.MeshPhysicalMaterial({ color: '#56dcff', transparent: true, opacity: 0.32, roughness: 0.08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  slideMesh.renderOrder = 2; scene.add(slideMesh);
  for (let i = 1; i < 60; i++) {
    const u = i / 60, p = slide.getPointAt(u), tg = slide.getTangentAt(u);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), tg);
    b.add(G.tor(1.47, 0.045, 5, 36), i % 2 ? PINK : CYAN, 'neon', new THREE.Matrix4().compose(p, q, V(1, 1, 1)));
  }
  // другие горки — глянцевые и цветные
  const others = [
    { c: '#ff5fc0', pts: [[-26, 18.5, 18], [-30, 15, 24], [-22, 11, 27], [-14, 8, 22], [-12, 5, 16], [-8, 2.6, 11], [-5, 1.0, 8]] },
    { c: '#ffd23f', pts: [[-22, 18.5, 12], [-14, 16, 16], [-8, 14, 22], [-2, 11, 24], [4, 7, 20], [6, 3.2, 13], [6, 1.1, 8.5]] },
    { c: '#7a5cff', pts: [[-30, 18.5, 10], [-36, 14, 4], [-34, 9, -6], [-26, 6, -10], [-19, 3, -8], [-15.5, 1.2, -5.5]] },
  ];
  for (const s of others) {
    b.add(G.tube(s.pts, 1.2, 140, 14), s.c, 'gloss');
    const cv = new THREE.CatmullRomCurve3(s.pts.map((p) => V(...p)));
    for (let i = 1; i < 14; i++) { const p = cv.getPointAt(i / 14); glows.push([p.x, p.y + 1.25, p.z, s.c, 1.2, 1]); }
  }
  // большая горка-воронка справа
  b.add(G.cyl(8, 1.8, 6, 32, true), '#ff5fc0', 'gloss', M([28, 10, 12]));
  b.add(G.tube([[28, 7, 12], [26, 5, 6], [20, 3, 3], [15.5, 1.2, 1.5]], 1.4, 60, 14), '#ff5fc0', 'gloss');
  for (const dx of [-5, 5]) for (const dz of [-5, 5]) b.add(G.cyl(0.3, 0.3, 10, 8), '#e8e2f6', 'metal', M([28 + dx, 5, 12 + dz]));

  /* --- люди в бассейне --- */
  const swim = ['#ff2f8f', '#2fe6ff', '#ffe14a', '#b45cff', '#ffffff', '#ff7a3a', '#39ff9a', '#111111'];
  const hairs = ['#1a1210', '#3a2216', '#e9c27a', '#7a2a12', '#0e0e12', '#c9a0ff'];
  const spots = [[-9, 2], [-6, -3], [-3, 4], [0, -5], [-11, -4], [7, -2], [9, 4], [11, -5], [5, 5.5], [-7, 6.5], [12, 1.5], [-1, 0.5], [3.5, -6.5], [-4, -7]];
  spots.forEach(([x, z], i) => {
    if (Math.abs(x - 2.5) < 2 && Math.abs(z - 1) < 2.5) return; // место для нырка камеры
    const ry = i % 3 === 0 ? Math.PI : -0.6 + R() * 1.2;
    kit.figure(b, { p: [x, -0.85, z], ry, pose: i % 4 === 1 ? 'wave' : 'up', swim: true, top: kit.pick(swim, i), hair: kit.pick(hairs, i), longHair: i % 2 ? 2 : 1, i });
    if (i % 2 === 0) kit.ring(b, [x, 0.12, z], kit.pick(['#ff5fc0', '#ffd23f', '#2fe6ff', '#ffffff'], i), 0.5, 0.17);
  });
  kit.flamingo(b, [-5.5, 0, -0.5], 0.9, 0.7);
  kit.flamingo(b, [9.5, 0, 0.5], 0.75, -2.2, '#ffd23f');
  for (let i = 0; i < 6; i++) kit.ring(b, [-12 + i * 4.6, 0.12, 7.5 - (i % 2) * 14], kit.pick(['#2fe6ff', '#ff5fc0', '#ffd23f'], i), 0.55, 0.2, 0.12 * (i % 2 ? 1 : -1));
  for (let i = 0; i < 5; i++) b.add(G.sph(0.4, 14, 10), kit.pick(['#ffffff', '#ff5fc0', '#ffd23f'], i), 'gloss', M([-10 + i * 5, 0.25, -6 + (i % 3) * 5]));
  // люди на бортике
  const deckSpots = [[-17, -6, 1.2], [-17.5, 3, 1.8], [17, -5, -1.4], [17.5, 4, -2], [-8, 11, 3.1], [6, 11.2, 3.3], [-12, -11, 0], [11, -11, 0], [13.5, -11.5, 0.3]];
  deckSpots.forEach(([x, z, ry], i) => kit.figure(b, { p: [x, top, z], ry, pose: kit.pick(['up', 'wave', 'hips', 'up'], i), swim: i % 3 !== 2, top: kit.pick(swim, i + 3), hair: kit.pick(hairs, i + 2), longHair: i % 2 ? 2 : 0, i: i + 1 }));
  for (let i = 0; i < 10; i++) kit.lounger(b, [-24 + (i % 5) * 2.4 + (i > 4 ? 40 : 0), top, 12 + (i % 2)], Math.PI, kit.pick(['#ffffff', '#ff8ad8', '#8ef0ff'], i));
  // пальмы под куполом
  [[-22, -12], [22, -12], [-26, 4], [24, 22], [-14, 22], [14, 24], [30, -2]].forEach(([x, z], i) => kit.palm(b, [x, top, z], 8 + (i % 3), [0.6 * (i % 2 ? 1 : -1), 0.3], { seed: i, leaf: '#1f6a48' }));

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.55));
  const L = (c, i, p, d = 70) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 380, [0, 9, -9]); L(CYAN, 300, [-8, 4, 4]); L(VIOLET, 360, [10, 7, 6]); L(CYAN, 260, [-24, 12, 14], 40);
  scene.add(kit.stars(700, 300, 0.3));
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());
  const w = kit.water(30, 18, '#0b8fc0', { tile: 5, ei: 0.5, opacity: 0.88, emissive: '#0a6fa8' });
  w.position.y = 0.1; scene.add(w);

  /* --- камера: горка → бассейн → сцена → нырок --- */
  const keys = [];
  for (let i = 0; i <= 14; i++) {
    const u = (i / 14) * 0.97;
    const p = slide.getPointAt(u), l = slide.getPointAt(Math.min(1, u + 0.05));
    keys.push({ p: [p.x, p.y + 0.35, p.z], l: [l.x, l.y + 0.2, l.z], t: i === 0 ? 0 : i === 14 ? 0.38 : undefined });
  }
  keys.push(
    { p: [-8.5, 2.6, 3.3], l: [0, 6, -14] },
    { p: [-4, 3.6, 0.5], l: [0, 7.5, -15] },
    { p: [0.5, 4.6, -2.5], l: [0, 9, -16], t: 0.66 },
    { p: [5, 3.6, -4.5], l: [-1, 3.2, -13] },
    { p: [4.2, 1.9, -1.4], l: [2.4, -1.5, 2.5], t: 0.88 },
    { p: [2.8, 0.6, 0.6], l: [2.2, -4, 3.2] },
    { p: [2.4, -1.2, 1.6], l: [2, -6, 3.5], t: 1 },
  );
  return { scene, cam: kit.camPath(keys) };
}
