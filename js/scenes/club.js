// 02 · STAYA 2K17 — клуб в духе 2017 года.
// Розовый подъезд → лестница вниз → клуб: LED-пол, спиннеры, кальяны, розовое вино, сторис.
// Портал: камера влетает в экран гигантского телефона.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05020a');
  scene.fog = new THREE.FogExp2('#14051f', 0.028);
  scene.environment = kit.env(renderer, ['#ff2fd0', '#8a3dff', '#21e0ff', '#ffffff', '#ff5a8a']);
  const b = new Builder(), glows = [], R = kit.rng(17);
  const PINK = '#ff2fd0', VIO = '#8a3dff', CY = '#21e0ff', YEL = '#ffe14a';

  /* --- подъезд: лестница вниз от z=34 (y=6) до z=16 (y=0) --- */
  const wallP = '#f3b9df';
  b.add(G.box(3.6, 6, 5), '#c98fb6', 'matte', M([0, 3, 36.5]));             // площадка сверху
  for (let i = 0; i < 30; i++) {
    const y = 6 - (i + 1) * 0.2, z = 34 - i * 0.6 - 0.3;
    b.add(G.box(3.4, y + 0.001, 0.6), '#d9a6c8', 'matte', M([0, y / 2, z]));
    b.add(G.box(3.4, 0.03, 0.08), '#ffffff', 'plastic', M([0, y, z + 0.27]));
  }
  b.add(G.box(0.3, 12, 25), wallP, 'matte', M([-1.85, 4.5, 26.5]));
  b.add(G.box(0.3, 12, 25), wallP, 'matte', M([1.85, 4.5, 26.5]));
  b.add(G.box(3.4, 0.3, 25), '#e9a6d2', 'matte', M([0, 10.4, 26.5]));
  b.add(G.box(3.4, 12, 0.3), wallP, 'matte', M([0, 4.5, 39]));
  // перила
  const rail = [];
  for (let i = 0; i <= 30; i += 3) { const y = 6 - i * 0.2, z = 34 - i * 0.6; rail.push([1.45, y + 0.95, z]); kit.rod(b, [1.45, y, z], [1.45, y + 0.95, z], 0.025, '#3a0b22', 'metal', 6); }
  b.add(G.tube(rail, 0.05, 40, 6), '#7a1040', 'gloss');
  // зелёная «советская» полоса на стене и лампы
  b.add(G.box(0.02, 1.4, 25), '#5c1a4a', 'matte', M([-1.69, 0.9 + 3, 26.5], [0, 0, 0]));
  for (const z of [36, 29, 22]) { b.add(G.box(0.6, 0.08, 0.3), '#fff', 'neon', M([0, 10.2, z])); glows.push([0, 9.9, z, PINK, 3, 1.4]); }
  const graf = kit.canvasTex(1024, 384, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0)'; x.fillRect(0, 0, w, h);
    kit.gradText(x, '2K17', w * 0.28, h * 0.5, 210, '#ffffff', '#ff6fe0', { glow: '#ff2fd0' });
    x.save(); x.translate(w * 0.72, h * 0.55); x.rotate(-0.12); kit.gradText(x, 'СТАЯ', 0, 0, 120, '#2a0820', '#5a1040'); x.restore();
    x.font = '700 44px Unbounded, sans-serif'; x.fillStyle = '#3a0b2a'; x.fillText('♥ лайк', w * 0.75, h * 0.9);
  });
  graf.premultiplyAlpha = false;
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), new THREE.MeshStandardMaterial({ map: graf, transparent: true, roughness: 0.9 }));
  gp.position.set(-1.69, 6.2, 27); gp.rotation.y = Math.PI / 2; scene.add(gp);
  // дверной проём в клуб
  /* --- клуб: x[-16,16], z[-16,16], высота 10 --- */
  const WALL = '#120a1c';
  b.add(G.box(14.2, 10, 0.4), WALL, 'matte', M([-8.9, 5, 16])); b.add(G.box(14.2, 10, 0.4), WALL, 'matte', M([8.9, 5, 16]));
  b.add(G.box(3.6, 5.6, 0.4), WALL, 'matte', M([0, 7.2, 16]));
  b.add(G.box(3.6, 0.1, 0.1), PINK, 'neon', M([0, 4.35, 15.75]));
  b.add(G.box(0.4, 10, 32), WALL, 'matte', M([-16, 5, 0])); b.add(G.box(0.4, 10, 32), WALL, 'matte', M([16, 5, 0]));
  b.add(G.box(32, 10, 0.4), WALL, 'matte', M([0, 5, -16]));
  b.add(G.box(32, 0.4, 32), '#07050c', 'matte', M([0, 10.2, 0]));
  b.add(G.box(32, 0.2, 32), '#0b0812', 'gloss', M([0, -0.1, 0]));
  // LED-пол
  for (let ix = -6; ix < 6; ix++) for (let iz = -5; iz < 6; iz++) {
    const r = R(), c = r < 0.38 ? '#1a0f2a' : r < 0.6 ? PINK : r < 0.78 ? VIO : r < 0.93 ? CY : YEL;
    b.add(G.box(1.1, 0.05, 1.1), c, r < 0.38 ? 'gloss' : 'neon', M([ix * 1.2 + 0.6, 0.03, iz * 1.2 - 0.6]));
  }
  // неоновые полосы на стенах
  for (const sx of [-1, 1]) for (const y of [2.5, 7.5]) b.add(G.box(0.06, 0.08, 30), sx < 0 ? PINK : CY, 'neon', M([sx * 15.75, y, 0]));
  // ферма-решётка под потолком
  for (let x = -12; x <= 12; x += 6) kit.truss(b, [x, 9.2, -14], [x, 9.2, 14], 0.45);
  for (let i = 0; i < 10; i++) {
    const x = -12 + (i % 5) * 6, z = i < 5 ? -6 : 6, c = kit.pick([PINK, CY, VIO, '#ffffff'], i);
    b.add(G.cyl(0.2, 0.26, 0.45, 10), '#1a1a20', 'metal', M([x, 8.7, z]));
    glows.push([x, 8.45, z, c, 2, 1.8]);
    kit.beam(b, [x, 8.45, z], [x * 0.6 + (i % 2 ? 2 : -2), 0, z * 0.4 - 2], 1.8, c);
  }
  // сцена и диджей
  b.add(G.rbox(14, 1, 4.4, 0.08), '#0e0a16', 'gloss', M([0, 0.5, -13.4]));
  b.add(G.box(14, 0.07, 0.07), PINK, 'neon', M([0, 1.0, -11.2]));
  kit.djBooth(b, [0, 1, -12.4], 0, { w: 3.2, front: VIO, front2: PINK });
  kit.figure(b, { p: [0, 1, -13.3], pose: 'dj', top: '#e8e8ee', bottom: '#111', cap: '#ff2fd0', capBack: true, hair: '#1a1210', i: 1 });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 6, 1, -13], 0, 1.8, 1.3); kit.speaker(b, [sx * 6, 2.8, -13], 0, 1.4, 1.1); }
  // экран 2K17
  const scr = kit.canvasTex(1024, 384, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16002e'); g.addColorStop(1, '#4a0060'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,47,208,.6)'; x.lineWidth = 2;
    for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(w / 2, h * 0.55); x.lineTo((i / 13) * w * 1.6 - w * 0.3, h); x.stroke(); }
    for (let i = 0; i < 6; i++) { const y = h * 0.6 + i * i * 6; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    kit.gradText(x, '2K17', w / 2, h * 0.38, 200, '#ffffff', '#ff7af0', { glow: '#ff2fd0' });
    x.font = '700 30px Unbounded, sans-serif'; x.fillStyle = '#21e0ff'; x.textAlign = 'center'; x.fillText('ВОЗВРАЩАЕМ ТЕБЯ В 2017', w / 2, h * 0.86);
  });
  scene.add(kit.screen(15, 5.6, scr, [0, 5.2, -15.75]));
  kit.text3d(b, font, 'STAYA', { size: 1.3, color: '#ff4fe0', p: [0, 8.3, -14.6] });
  // диско-шар
  kit.rod(b, [0, 10, -1], [0, 8.9, -1], 0.03, '#888');
  b.add(G.ico(1.1, 3), '#ffffff', 'chrome', M([0, 7.8, -1]), { flat: true });
  for (let i = 0; i < 26; i++) { const u = R() * 2 - 1, a = R() * 6.28, k = Math.sqrt(1 - u * u); glows.push([Math.cos(a) * k * 1.12, 7.8 + u * 1.12, -1 + Math.sin(a) * k * 1.12, R() < 0.5 ? '#ffffff' : '#ff9ae8', 0.22, 2]); }
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2, wall = R();
    const p = wall < 0.33 ? [-15.7, 1 + R() * 8, -15 + R() * 30] : wall < 0.66 ? [15.7, 1 + R() * 8, -15 + R() * 30] : [-15 + R() * 30, 1 + R() * 8, -15.7];
    glows.push([...p, R() < 0.5 ? '#ffffff' : '#ffc0f0', 0.35, 1.2]); void a;
  }
  glows.push([0, 7.8, -1, '#ffffff', 3.2, 0.7]);
  // лазеры
  for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; kit.laser(b, [sxL(i) * 6.5, 3.6, -12.6], [Math.sin(a) * 30, 6 + (i % 3), -12.6 + Math.cos(a) * 30], i % 2 ? '#39ff6a' : PINK); }
  function sxL(i) { return i % 2 ? 1 : -1; }
  // толпа
  const tops = ['#9a9aa4', '#111114', '#f4f4f4', '#ff8ac8', '#7cc7ff', '#b7ff6a', '#2a2a40', '#ffd4a8'];
  const hairs = ['#1a1210', '#3a2216', '#e9c27a', '#0e0e12', '#ff8ad8'];
  let k = 0;
  for (let ix = -5; ix <= 5; ix += 1.6) for (let iz = -7; iz <= 3; iz += 1.9) {
    const x = ix + (R() - 0.5) * 0.7, z = iz + (R() - 0.5) * 0.8;
    if (Math.abs(x) < 1.6 && z > -2 && z < 2.2) continue;
    const g = k % 2 === 0;
    kit.figure(b, { p: [x, 0.05, z], ry: Math.PI + (R() - 0.5) * 0.9, pose: kit.pick(['up', 'wave', 'up', 'phone', 'hips'], k), top: kit.pick(tops, k), bottom: kit.pick(['#22222a', '#5a5f7a', '#111', '#3a3a52'], k), hoodie: k % 3 === 0, sleeves: k % 3 === 0, hair: kit.pick(hairs, k), longHair: g ? 2 : 0, cap: !g && k % 4 === 1 ? kit.pick(['#111', '#ff2fd0', '#f4f4f4'], k) : null, capBack: true, glasses: k % 5 === 0, i: k });
    k++;
  }
  /* --- атрибуты 2017 --- */
  kit.spinner(b, [-15.6, 5.2, -4], [0, Math.PI / 2, 0.3], 1.9, '#2f7bff');
  kit.spinner(b, [-15.6, 4.6, 8], [0, Math.PI / 2, 1.1], 1.4, '#ffd23f');
  kit.spinner(b, [15.6, 6.4, 7], [0, -Math.PI / 2, 0.6], 1.6, '#ff3b3b');
  // лаунж с кальянами слева
  for (const z of [3, 9]) {
    b.add(G.rbox(1.6, 0.5, 4, 0.2), '#5a0f3a', 'plastic', M([-14.6, 0.25, z]));
    b.add(G.rbox(0.5, 1.2, 4, 0.2), '#5a0f3a', 'plastic', M([-15.4, 0.6, z]));
    b.add(G.cyl(0.6, 0.6, 0.06, 20), '#1d1824', 'gloss', M([-12.6, 0.55, z])); b.add(G.cyl(0.08, 0.1, 0.55, 8), '#333', 'metal', M([-12.6, 0.27, z]));
    hookah(b, [-12.6, 0.58, z], 0.65);
    kit.figure(b, { p: [-14.5, 0, z - 1], ry: Math.PI / 2, pose: 'sit', top: '#f4f4f4', bottom: '#222', hair: '#1a1210', i: 3 });
    kit.figure(b, { p: [-14.5, 0, z + 1], ry: Math.PI / 2, pose: 'sit', top: '#ff8ac8', bottom: '#111', hair: '#e9c27a', longHair: 2, i: 0 });
  }
  function hookah(bb, p, s) {
    bb.push(M(p, [0, 0, 0], s));
    bb.add(G.sph(0.42, 18, 12), '#3fffc0', 'glass', M([0, 0.42, 0], [0, 0, 0], [1, 1.05, 1]));
    bb.add(G.cyl(0.07, 0.1, 1.4, 10), '#c8c8d8', 'chrome', M([0, 1.45, 0]));
    bb.add(G.cyl(0.32, 0.32, 0.03, 16), '#c8c8d8', 'chrome', M([0, 1.5, 0]));
    bb.add(G.cyl(0.14, 0.08, 0.2, 12), '#7a2a12', 'gloss', M([0, 2.25, 0]));
    glows.push([p[0], p[1] + 2.4 * s, p[2], '#ff6a2a', 0.5, 1.4]);
    bb.add(G.tube([[0.1, 1.2, 0], [0.6, 0.9, 0.2], [0.8, 0.3, 0.6], [0.6, 0.1, 1.0]], 0.035, 20, 6), '#2a1a2a', 'gloss');
    bb.pop();
  }
  // гигантская бутылка розового вина
  b.push(M([13.2, 0, 2], [0, 0.3, 0.0], 1));
  b.add(G.cyl(0.85, 0.85, 3.2, 28), '#ff6fb4', 'glass', M([0, 1.6, 0]));
  b.add(G.sph(0.85, 28, 14, ), '#ff6fb4', 'glass', M([0, 3.2, 0], [0, 0, 0], [1, 0.7, 1]));
  b.add(G.cyl(0.3, 0.32, 1.4, 20), '#ff6fb4', 'glass', M([0, 4.2, 0]));
  b.add(G.cyl(0.33, 0.33, 0.5, 20), '#ffd6ec', 'gloss', M([0, 4.8, 0]));
  b.add(G.cyl(0.87, 0.87, 1.3, 28, true), '#ffe7f3', 'gloss', M([0, 1.7, 0]));
  b.pop();
  glows.push([13.2, 1.6, 2, '#ff6fb4', 4, 0.5]);
  // лайк-сердце (Instagram 2017)
  const hs = new THREE.Shape(); hs.moveTo(0, -1); hs.bezierCurveTo(-1.6, 0.1, -0.9, 1.2, 0, 0.55); hs.bezierCurveTo(0.9, 1.2, 1.6, 0.1, 0, -1);
  b.add(new THREE.ExtrudeGeometry(hs, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 4, curveSegments: 16 }), '#ff2a55', 'gloss', M([15.4, 6.4, -3], [0, -Math.PI / 2, 0], 1.3));
  glows.push([15.2, 6.4, -3, '#ff2a55', 4, 0.8]);
  // 3D-надпись 2K17
  kit.text3d(b, font, '2K17', { size: 1.5, color: '#b45cff', p: [-15.6, 7.2, -10.5], r: [0, Math.PI / 2, 0] });

  /* --- гигантский телефон (портал) --- */
  const PH = [8.6, 3.3, -8.2], phRy = -0.72;
  b.push(M(PH, [0, phRy, 0]));
  b.add(G.rbox(2.8, 5.6, 0.32, 0.36, 3), '#0b0b10', 'gloss');
  b.add(G.rbox(2.86, 5.66, 0.2, 0.37, 3), '#d8d8e2', 'metal', M([0, 0, -0.08]));
  b.add(G.cyl(0.2, 0.2, 0.08, 16), '#222', 'gloss', M([0.8, 2.4, -0.2], [Math.PI / 2, 0, 0]));
  b.pop();
  const story = kit.canvasTex(512, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ff2fd0'); g.addColorStop(0.5, '#8a3dff'); g.addColorStop(1, '#ffb36b');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { x.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,.4)'; x.fillRect(20 + i * 120, 26, 108, 6); }
    x.fillStyle = '#fff'; x.beginPath(); x.arc(50, 80, 24, 0, 7); x.fill();
    x.font = '700 26px Manrope, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'left'; x.fillText('stayaekb', 86, 89);
    kit.gradText(x, 'СТАЯ', w / 2, h * 0.42, 130, '#ffffff', '#ffe0f6', { glow: '#ff2fd0' });
    kit.gradText(x, '2K17', w / 2, h * 0.56, 150, '#ffffff', '#21e0ff', { glow: '#21e0ff' });
    x.font = '700 30px Manrope, sans-serif'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('свайпни вверх ↑', w / 2, h * 0.9);
  });
  const sc = kit.screen(2.5, 5.3, story, [0, 0, 0]);
  sc.position.set(PH[0] + Math.sin(phRy) * 0.17, PH[1], PH[2] + Math.cos(phRy) * 0.17); sc.rotation.y = phRy; scene.add(sc);
  glows.push([PH[0] + Math.sin(phRy) * 0.6, PH[1], PH[2] + Math.cos(phRy) * 0.6, '#c06cff', 7, 0.5]);

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#6a3bd0', '#0c0614', 0.55));
  const L = (c, i, p, d = 45) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 160, [0, 8, 30], 25); L(PINK, 90, [0, 4, 21], 18); L(VIO, 380, [0, 8, -8]); L(CY, 220, [-10, 5, 0]); L(PINK, 220, [10, 5, 0]); L('#c06cff', 90, [6.5, 3.5, -5.5], 14);
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());

  const keys = [
    { p: [0, 7.7, 37.2], l: [0, 5, 27], t: 0 },
    { p: [0, 6.4, 31], l: [0, 3.6, 21] },
    { p: [0, 4.7, 25], l: [0, 2.6, 15] },
    { p: [0, 3.0, 18.6], l: [0, 2.8, 8], t: 0.36 },
    { p: [0, 3.2, 13], l: [0, 4, -10] },
    { p: [-3, 4.6, 6.5], l: [0, 4.6, -12] },
    { p: [-1.2, 5.2, 1.2], l: [1, 5, -14], t: 0.68 },
    { p: [2.6, 4.2, -2.6], l: [8.6, 3.3, -8.2] },
    { p: [6, 3.5, -5.4], l: [8.6, 3.3, -8.2], t: 0.9 },
    { p: [8.15, 3.3, -7.7], l: [9.3, 3.3, -9.1], t: 1 },
  ];
  return { scene, cam: kit.camPath(keys) };
}
