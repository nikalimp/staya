// 03 · STAYA POOL — задний двор коттеджа, бассейн, гигантский надувной осьминог и луна.
// Портал: камера взлетает над домом и летит в луну.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#0d0b2a', 0.0045);
  scene.environment = kit.env(renderer, ['#5b4dff', '#2fe6ff', '#ff3fb4', '#ffd28a', '#9fb2ff'], '#070818');
  scene.add(kit.sky(['#2a1a5e', '#120f3c', '#04061a', 0.05]));
  scene.add(kit.stars(1200, 400, 0.12, 3));
  const b = new Builder(), glows = [], R = kit.rng(23);
  const CY = '#2fe6ff', PINK = '#ff3fb4';

  /* --- настоящая луна: светлая сторона к двору, на тёмной — STAYA POOL --- */
  const MOON = [0, 58, 95], MR = 14;
  const moon = kit.moonMesh(MR, kit.MOON_DIR); moon.position.set(...MOON); moon.rotation.y = 0.6; scene.add(moon);
  scene.add(kit.halo(MOON, 95, '#a9b8ff', 0.6));
  scene.add(kit.halo(MOON, 40, '#fff1d0', 0.35));
  const tb = new Builder();
  kit.text3d(tb, font, 'STAYA', { size: 2.7, color: '#ff4fc0', kind: 'neon', p: [MOON[0], MOON[1] + 0.6, MOON[2] + MR + 0.6], bevel: 0.05, depth: 0.25 });
  kit.text3d(tb, font, 'POOL', { size: 2.7, color: '#2fe6ff', kind: 'neon', p: [MOON[0], MOON[1] - 3.4, MOON[2] + MR + 0.4], bevel: 0.05, depth: 0.25 });
  const tg = tb.build(); tg.traverse((o) => o.material && (o.material.fog = false)); scene.add(tg);
  for (let x = -6; x <= 6; x += 2) glows.push([MOON[0] + x, MOON[1] + 1.9, MOON[2] + MR + 1, '#ff4fc0', 3.4, 0.35], [MOON[0] + x * 0.8, MOON[1] - 2.1, MOON[2] + MR + 1, '#2fe6ff', 3.4, 0.35]);

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
  for (let i = 0; i < 4; i++) { const x = [-11, -5.2, 5.2, 11][i]; b.add(G.box(4.4, 3.2, 0.1), i % 2 ? '#ffcf7a' : '#ff6fd0', 'neon', M([x, 2.1, -18.95])); b.add(G.box(0.15, 3.2, 0.15), '#2a2533', 'plastic', M([x, 2.1, -18.9])); glows.push([x, 2.1, -18.5, i % 2 ? '#ffb05a' : PINK, 6, 0.35]); }
  for (let i = 0; i < 5; i++) b.add(G.box(3.4, 2, 0.1), i === 2 ? '#8a6bff' : '#ffd08a', 'neon', M([-12 + i * 6, 6, -18.95]));
  for (let i = 0; i < 3; i++) b.add(G.box(4.5, 2.2, 0.1), '#ffcf7a', 'neon', M([-10 + i * 7, 10, -19.95]));
  // закрытые двери — в них влетает камера
  for (const sx of [-1, 1]) {
    b.add(G.rbox(1.55, 3.8, 0.16, 0.03), '#2a1810', 'gloss', M([sx * 0.8, 2.4, -18.9]));
    for (const y of [1.4, 3.3]) b.add(G.box(1.2, 1.2, 0.04), '#3a2216', 'gloss', M([sx * 0.8, y, -18.8]));
    b.add(G.box(0.05, 0.6, 0.08), '#d8c08a', 'metal', M([sx * 0.15, 2.4, -18.78]));
  }
  b.add(G.box(3.6, 0.25, 0.3), '#2a2533', 'plastic', M([0, 4.42, -18.9]));
  for (const sx of [-1, 1]) glows.push([sx * 2.2, 3.6, -18.6, '#ffcf7a', 1.4, 1.6]);
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
    [[0, 11, -34], [-3, 13.6, -28], [-5, 12.8, -22], [-6.5, 10, -18.6], [-7, 7.2, -18.2], [-7.4, 5.8, -17.6], [-6.6, 5.6, -16.6]],
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

  /* --- сцена сбоку от бассейна, лицом к воде --- */
  const SX = 16;
  for (const z of [-5, 5]) kit.truss(b, [SX, T, z], [SX, 7.5, z], 0.5);
  kit.truss(b, [SX, 7.5, -5], [SX, 7.5, 5], 0.5);
  for (let i = 0; i < 5; i++) { const z = -4 + i * 2, c = kit.pick([PINK, CY, '#9b6bff', '#39ff9a'], i); b.add(G.cyl(0.2, 0.26, 0.45, 10), '#1a1a20', 'metal', M([SX, 7, z])); glows.push([SX, 6.8, z, c, 1.9, 2]); kit.beam(b, [SX, 6.8, z], [6 - i, 0.2, z * 1.6], 1.8, c); }
  kit.djBooth(b, [SX - 0.6, T, 0], -Math.PI / 2, { w: 3, front: PINK, front2: CY });
  kit.figure(b, { p: [SX + 0.3, T, 0], ry: -Math.PI / 2, pose: 'dj', top: '#111', bottom: '#111', cap: '#ffffff', hair: '#1a1210', glasses: true, i: 1 });
  for (const sz of [-1, 1]) { kit.speaker(b, [SX - 0.2, T, sz * 3.6], -Math.PI / 2, 1.8, 1.3); kit.speaker(b, [SX - 0.2, T + 1.8, sz * 3.6], -Math.PI / 2, 1.3, 1.1); }

  /* --- реквизит и люди --- */
  kit.flamingo(b, [-7, 0, 1], 1.1, 0.5);
  kit.flamingo(b, [7.5, 0, 2.5], 0.9, -2.6, '#ffd23f');
  [[-3.5, 3], [3.5, -1], [8, -3.5], [-8.5, -3]].forEach(([x, z], i) => kit.ring(b, [x, 0.15, z], kit.pick(['#ff5fc0', '#ffffff', '#2fe6ff', '#ffd23f'], i), 0.6, 0.22));
  for (let i = 0; i < 6; i++) kit.lounger(b, [-9 + i * 3.6, T, 7.4], Math.PI, kit.pick(['#ffffff', '#ff8ad8'], i));
  for (let i = 0; i < 45; i++) { const a = R() * Math.PI * 2, rr = 13 + R() * 6; kit.cup(b, [Math.cos(a) * rr, T, Math.sin(a) * rr * 0.6 + 1]); }
  const swim = ['#ff2f8f', '#2fe6ff', '#ffe14a', '#b45cff', '#ffffff', '#ff7a3a', '#111111'];
  [[-5, -1.5], [-3.5, 2], [3.5, 3.5], [5, 0], [-9, 2.5], [9.5, -1]].forEach(([x, z], i) => kit.figure(b, { p: [x, -0.85, z], ry: (R() - 0.5) * 2, pose: i % 2 ? 'up' : 'wave', swim: true, top: kit.pick(swim, i), hair: kit.pick(['#1a1210', '#e9c27a', '#3a2216'], i), longHair: 2, i }));
  [[-13, -3, 1.4], [-13.5, 2, 1.9], [13, -2.5, -1.4], [12.6, 3, -2], [-5, 7.2, 3.1], [4, 7.4, 3.3], [-4, -7.2, 0], [4.5, -7, 0.2], [-14.5, 8, 2.4], [12, 8.4, -2.6]].forEach(([x, z, ry], i) =>
    kit.figure(b, { p: [x, T, z], ry, pose: kit.pick(['up', 'hips', 'wave', 'phone', 'up'], i), swim: i % 3 === 0, top: kit.pick(['#ff8ac8', '#f4f4f4', '#2fe6ff', '#111', '#ffd23f', '#9b6bff'], i), bottom: '#22222a', hair: kit.pick(['#1a1210', '#e9c27a', '#3a2216', '#0e0e12'], i), longHair: i % 2 ? 2 : 0, cap: i % 4 === 2 ? '#fff' : null, i }));

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#4d58ff', '#0a0a18', 0.6));
  const dl = new THREE.DirectionalLight('#9fb2ff', 0.9); dl.position.set(0, 58, 95); scene.add(dl);
  const L = (c, i, p, d = 60) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(CY, 220, [0, 2, 0], 30); L(PINK, 220, [13, 6, 0]); L('#ffb36b', 110, [0, 4, -15]); L('#b04dff', 900, [6, 16, -26], 70); L('#ffd28a', 120, [0, 6, 12], 30);
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());
  const w = kit.water(22, 10, '#13c8f0', { tile: 4, ei: 0.75, emissive: '#0aa8e0', opacity: 0.9 });
  w.position.y = 0.1; scene.add(w);

  /* --- камера: тот же кадр на луну, что в конце клуба → облёт → спуск к бассейну → в двери --- */
  const D = MR / kit.MOON_K, hd = Math.hypot(kit.MOON_DIR[0], kit.MOON_DIR[2]) * D, dy = kit.MOON_DIR[1] * D;
  const orb = (f) => [MOON[0] + Math.sin(f) * hd, MOON[1] + dy, MOON[2] - Math.cos(f) * hd];
  const keys = [
    { p: orb(0), l: MOON, t: 0 },
    { p: orb(0.03), l: MOON, t: 0.03 },
    { p: orb(Math.PI * 0.3), l: MOON },
    { p: orb(Math.PI * 0.55), l: MOON },
    { p: orb(Math.PI * 0.8), l: MOON },
    { p: orb(Math.PI), l: [MOON[0], MOON[1] - 1.2, MOON[2]], t: 0.34 },
    { p: [0, MOON[1] + dy - 1, MOON[2] + hd - 2], l: [0, MOON[1] - 1.5, MOON[2]], t: 0.42 },
    // из-за луны открывается двор — плавный спуск
    { p: [0, 36, 116], l: [0, 22, 50] },
    { p: [0, 24, 76], l: [0, 4, 0] },
    { p: [0, 11, 38], l: [0, 2, -6] },
    { p: [0, 3.6, 14], l: [0, 1.5, -10], t: 0.74 },
    // над гладью бассейна
    { p: [0, 1.15, 4.5], l: [0, 1.4, -12] },
    { p: [0, 1.15, -3.5], l: [0, 1.8, -19] },
    { p: [0, 2.1, -12], l: [0, 2.3, -25], t: 0.92 },
    { p: [0, 2.3, -18.6], l: [0, 2.3, -25], t: 1 },
  ];
  return { scene, cam: kit.camPath(keys) };
}
