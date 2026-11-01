// 03 · STAYA POOL — задний двор коттеджа, бассейн, гигантский надувной осьминог и луна.
// Портал: камера взлетает над домом и летит в луну.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#0d0b2a', 0.0075);
  scene.environment = kit.env(renderer, ['#5b4dff', '#2fe6ff', '#ff3fb4', '#ffd28a', '#9fb2ff'], '#070818');
  scene.add(kit.sky(['#2a1a5e', '#120f3c', '#04061a', 0.05]));
  scene.add(kit.stars(1200, 400, 0.12, 3));
  const b = new Builder(), glows = [], R = kit.rng(23);
  const CY = '#2fe6ff', PINK = '#ff3fb4';

  /* --- луна --- */
  const MOON = [-30, 40, -110];
  const moonTex = kit.canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#fff4dc'; x.fillRect(0, 0, w, h);
    const r = kit.rng(5);
    for (let i = 0; i < 60; i++) { const cx = r() * w, cy = r() * h, rr = 8 + r() * 46; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(170,160,150,.55)'); g.addColorStop(1, 'rgba(170,160,150,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); }
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 48, 32), new THREE.MeshBasicMaterial({ map: moonTex, toneMapped: false, fog: false }));
  moon.position.set(...MOON); moon.rotation.y = 0.6; scene.add(moon);
  scene.add(kit.halo(MOON, 95, '#a9b8ff', 0.75));
  scene.add(kit.halo(MOON, 40, '#fff1d0', 0.6));

  /* --- двор --- */
  b.add(G.box(240, 0.4, 240), '#0f2a1f', 'matte', M([0, -0.2, 0]));
  const T = 0.3, ST = '#bfb6cf';
  for (const [w, d, x, z] of [[40, 8, 0, -9], [40, 9, 0, 9.5], [9, 10, -15.5, 0], [9, 10, 15.5, 0]]) b.add(G.box(w, T, d), ST, 'plastic', M([x, T / 2, z]));
  for (const [w, d, x, z] of [[22.4, 0.3, 0, -5.15], [22.4, 0.3, 0, 5.15], [0.3, 10.6, -11.15, 0], [0.3, 10.6, 11.15, 0]]) b.add(G.box(w, 0.1, d), '#f4f2fa', 'gloss', M([x, T + 0.05, z]));
  b.add(G.box(22, 0.2, 10), '#0aa7d4', 'plastic', M([0, -1.8, 0]));
  for (const [w, d, x, z] of [[22, 0.2, 0, -5.05], [22, 0.2, 0, 5.05], [0.2, 10, -11.05, 0], [0.2, 10, 11.05, 0]]) b.add(G.box(w, 2, d), '#22c4ee', 'plastic', M([x, -0.8, z]));
  for (let x = -9; x <= 9; x += 3) glows.push([x, -0.5, -4.9, CY, 1.8, 1.5], [x, -0.5, 4.9, CY, 1.8, 1.5]);

  /* --- дом --- */
  const HW = '#a9a1bd';
  b.add(G.box(32, 8, 10), HW, 'plastic', M([0, 4, -24]));
  b.add(G.box(22, 4, 9), HW, 'plastic', M([-3, 10, -24.5]));
  b.add(G.box(33, 0.4, 11), '#2a2533', 'plastic', M([0, 8.1, -24])); b.add(G.box(23, 0.4, 10), '#2a2533', 'plastic', M([-3, 12.1, -24.5]));
  b.add(G.box(26, 0.5, 4), '#6a4a3a', 'plastic', M([0, 0.25, -17]));
  // окна: тёплые и «вечериночные»
  for (let i = 0; i < 4; i++) { const x = -11 + i * 7.3; b.add(G.box(5.8, 3.2, 0.1), i % 2 ? '#ffcf7a' : '#ff6fd0', 'neon', M([x, 2.1, -18.95])); b.add(G.box(0.15, 3.2, 0.15), '#2a2533', 'plastic', M([x, 2.1, -18.9])); glows.push([x, 2.1, -18.5, i % 2 ? '#ffb05a' : PINK, 6, 0.35]); }
  for (let i = 0; i < 5; i++) b.add(G.box(3.4, 2, 0.1), i === 2 ? '#8a6bff' : '#ffd08a', 'neon', M([-12 + i * 6, 6, -18.95]));
  for (let i = 0; i < 3; i++) b.add(G.box(4.5, 2.2, 0.1), '#ffcf7a', 'neon', M([-10 + i * 7, 10, -19.95]));
  // гирлянды
  const poles = [[-17, -18.5], [17, -18.5], [-18, 12], [0, 14], [18, 12]];
  for (const [x, z] of poles.slice(2)) kit.rod(b, [x, 0, z], [x, 6.5, z], 0.08, '#2a2a33', 'metal');
  const strings = [[[-16, 7.5, -19], [-18, 6.5, 12]], [[-6, 7.5, -19], [0, 6.5, 14]], [[6, 7.5, -19], [0, 6.5, 14]], [[16, 7.5, -19], [18, 6.5, 12]], [[-18, 6.5, 12], [0, 6.5, 14]], [[0, 6.5, 14], [18, 6.5, 12]]];
  for (const [a, c] of strings) {
    const n = 26;
    for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 2.2; glows.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag, a[2] + (c[2] - a[2]) * t, i % 3 ? '#ffd28a' : PINK, 0.7, 1.6]); }
  }
  // забор и деревья
  for (let x = -40; x <= 40; x += 2) b.add(G.box(1.8, 2.4, 0.15), '#3a2c2a', 'matte', M([x, 1.2, 24]));
  for (const sx of [-1, 1]) for (let z = -30; z <= 24; z += 2) b.add(G.box(0.15, 2.4, 1.8), '#3a2c2a', 'matte', M([sx * 40, 1.2, z]));
  for (let i = 0; i < 22; i++) {
    const sx = i % 2 ? 1 : -1, x = sx * (24 + R() * 14), z = -30 + R() * 52, h = 6 + R() * 7;
    b.add(G.cyl(0.25, 0.35, h * 0.4, 8), '#2a1d16', 'matte', M([x, h * 0.2, z]));
    b.add(G.cone(2 + R() * 1.4, h, 10), '#14352a', 'matte', M([x, h * 0.4 + h * 0.45, z]));
  }

  /* --- надувной осьминог за домом --- */
  const OC = [5, 21, -42], OBLUE = '#4f5bff', OTEN = '#5f4dff', CUP = '#ff9ae0';
  b.add(G.sph(10, 32, 22), OBLUE, 'gloss', M(OC, [0, 0, 0], [1, 1.2, 0.95]));
  for (const sx of [-1, 1]) {
    b.add(G.sph(2.6, 22, 16), '#ffffff', 'gloss', M([OC[0] + sx * 3.8, OC[1] - 1.5, OC[2] + 8.6]));
    b.add(G.sph(1.35, 18, 12), '#0a0a14', 'gloss', M([OC[0] + sx * 3.6 - 0.3, OC[1] - 1.6, OC[2] + 10.7]));
    b.add(G.sph(0.4, 10, 8), '#ffffff', 'neon', M([OC[0] + sx * 3.6 - 0.7, OC[1] - 1.1, OC[2] + 11.7]));
    b.add(G.sph(1.1, 14, 10), '#ff6fb4', 'gloss', M([OC[0] + sx * 6.4, OC[1] - 4.6, OC[2] + 7.4], [0, 0, 0], [1.2, 0.6, 0.4]));
  }
  const tentacles = [
    [[-1, 12, -36], [-7, 13, -30], [-12, 12.5, -26], [-16, 9, -22], [-18, 4, -19], [-19, 1.4, -15], [-17.5, 1.3, -12], [-15.5, 2.6, -10.5]],
    [[3, 11, -34], [2, 13.6, -28], [0.5, 12.8, -22], [-1, 10, -18.6], [-1.6, 7.2, -18.2], [-2, 5.6, -17.6], [-1, 5.2, -16.6]],
    [[10, 11, -34], [14, 12.5, -28], [18, 9, -24], [21, 4, -20], [22, 1.4, -14], [20.5, 1.3, -9], [18.6, 2.6, -7.4]],
    [[13, 13, -38], [20, 16, -36], [27, 13, -32], [31, 6, -28], [32, 1.5, -22], [30, 1.6, -18]],
    [[-1, 13, -39], [-8, 17, -38], [-16, 15, -35], [-22, 8, -31], [-25, 2, -27], [-28, 1.6, -23]],
    [[12, 15, -38], [17, 21, -36], [19, 28, -35], [17, 32, -34], [14, 31, -33]],
    [[4, 13, -44], [1, 19, -48], [2, 25, -48], [5, 28, -46]],
    [[9, 12, -46], [15, 8, -52], [19, 3, -55], [22, 1.6, -54]],
  ];
  for (const pts of tentacles) {
    const cv = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal');
    const n = 22, P = cv.getSpacedPoints(n);
    for (let i = 0; i < n; i++) {
      const r0 = 1.9 * (1 - i / n) + 0.3, r1 = 1.9 * (1 - (i + 1) / n) + 0.3;
      kit.rod(b, P[i], P[i + 1], r0, OTEN, 'gloss', 14, r1);
      b.add(G.sph(r1, 14, 10), OTEN, 'gloss', M(P[i + 1].toArray()));
      if (i % 2 === 0 && i > 2) b.add(G.sph(r1 * 0.38, 10, 8), CUP, 'gloss', M([P[i].x, P[i].y - r0 * 0.8, P[i].z + 0.2]));
    }
  }

  /* --- сцена: ферма + надувные буквы --- */
  const SZ = -12.5;
  for (const x of [-9, 9]) kit.truss(b, [x, T, SZ], [x, 8, SZ], 0.5);
  kit.truss(b, [-9, 8, SZ], [9, 8, SZ], 0.5);
  for (let i = 0; i < 7; i++) { const x = -6 + i * 2, c = kit.pick([PINK, CY, '#9b6bff', '#39ff9a'], i); b.add(G.cyl(0.2, 0.26, 0.45, 10), '#1a1a20', 'metal', M([x, 7.5, SZ])); glows.push([x, 7.3, SZ, c, 1.9, 2]); }
  kit.text3d(b, font, 'STAYA', { size: 1.6, color: '#ff4fb8', p: [0, 8.4, SZ], bevel: 0.3 });
  kit.djBooth(b, [0, T, SZ + 0.6], 0, { w: 3, front: PINK, front2: CY });
  kit.figure(b, { p: [0, T, SZ - 0.3], pose: 'dj', top: '#111', bottom: '#111', cap: '#ffffff', hair: '#1a1210', glasses: true, i: 1 });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 7.5, T, SZ + 0.8], 0, 1.8, 1.3); kit.speaker(b, [sx * 7.5, T + 1.8, SZ + 0.8], 0, 1.3, 1.1); }
  // надувные буквы POOL в воде
  kit.text3d(b, font, 'POOL', { size: 2.2, color: '#2fdcff', p: [0, -0.5, -3], r: [0, 0, 0.03], bevel: 0.38 });

  /* --- реквизит и люди --- */
  kit.flamingo(b, [-7, 0, 1], 1.1, 0.5);
  kit.flamingo(b, [7.5, 0, 2.5], 0.9, -2.6, '#ffd23f');
  [[-3.5, 3], [3.5, -1], [8, -3.5], [-8.5, -3]].forEach(([x, z], i) => kit.ring(b, [x, 0.15, z], kit.pick(['#ff5fc0', '#ffffff', '#2fe6ff', '#ffd23f'], i), 0.6, 0.22));
  for (let i = 0; i < 6; i++) kit.lounger(b, [-9 + i * 3.6, T, 7.4], Math.PI, kit.pick(['#ffffff', '#ff8ad8'], i));
  for (let i = 0; i < 45; i++) { const a = R() * Math.PI * 2, rr = 13 + R() * 6; kit.cup(b, [Math.cos(a) * rr, T, Math.sin(a) * rr * 0.6 + 1]); }
  const swim = ['#ff2f8f', '#2fe6ff', '#ffe14a', '#b45cff', '#ffffff', '#ff7a3a', '#111111'];
  [[-5, -1.5], [-1.5, 2], [2, 3.5], [5, 0], [-9, 2.5], [9.5, -1]].forEach(([x, z], i) => kit.figure(b, { p: [x, -0.85, z], ry: (R() - 0.5) * 2, pose: i % 2 ? 'up' : 'wave', swim: true, top: kit.pick(swim, i), hair: kit.pick(['#1a1210', '#e9c27a', '#3a2216'], i), longHair: 2, i }));
  [[-13, -3, 1.4], [-13.5, 2, 1.9], [13, -2.5, -1.4], [13.6, 3, -2], [-5, 7.2, 3.1], [4, 7.4, 3.3], [-3, -7.2, 0], [3.5, -7, 0.2], [-14.5, 8, 2.4], [14, 8.4, -2.6]].forEach(([x, z, ry], i) =>
    kit.figure(b, { p: [x, T, z], ry, pose: kit.pick(['up', 'hips', 'wave', 'phone', 'up'], i), swim: i % 3 === 0, top: kit.pick(['#ff8ac8', '#f4f4f4', '#2fe6ff', '#111', '#ffd23f', '#9b6bff'], i), bottom: '#22222a', hair: kit.pick(['#1a1210', '#e9c27a', '#3a2216', '#0e0e12'], i), longHair: i % 2 ? 2 : 0, cap: i % 4 === 2 ? '#fff' : null, i }));

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#4d58ff', '#0a0a18', 0.6));
  const dl = new THREE.DirectionalLight('#9fb2ff', 0.9); dl.position.set(-30, 40, -40); scene.add(dl);
  const L = (c, i, p, d = 60) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(CY, 220, [0, 2, 0], 30); L(PINK, 200, [0, 7, -9]); L('#ffb36b', 110, [0, 4, -15]); L('#b04dff', 900, [6, 16, -26], 70); L('#ffd28a', 120, [0, 6, 12], 30);
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());
  const w = kit.water(22, 10, '#13c8f0', { tile: 4, ei: 0.75, emissive: '#0aa8e0', opacity: 0.9 });
  w.position.y = 0.1; scene.add(w);

  const keys = [
    { p: [-15, 2.2, 19], l: [0, 2.4, -8], t: 0 },
    { p: [-9, 3, 12.5], l: [0, 3, -10] },
    { p: [-3, 3.6, 6], l: [0, 4.5, -14] },
    { p: [0, 4.2, 0.5], l: [0, 6.5, -20], t: 0.44 },
    { p: [0, 6.6, -6], l: [-2, 11, -30] },
    { p: [-1, 12.5, -12], l: [-8, 20, -50], t: 0.66 },
    { p: [-6, 18.5, -30], l: [-20, 30, -90] },
    { p: [-14, 27, -62], l: [MOON[0], MOON[1], MOON[2]] },
    { p: [-25, 36, -91], l: [MOON[0], MOON[1], MOON[2]], t: 1 },
  ];
  return { scene, cam: kit.camPath(keys) };
}
