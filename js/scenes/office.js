// 06 · Офис команды STAYA — пять человек вольяжно сидят за столами.
// На столах кейсы с деньгами и диджейские пульты, на стене календарь и афиши тусовок.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050308');
  scene.fog = new THREE.FogExp2('#0a0610', 0.02);
  scene.environment = kit.env(renderer, ['#ff3fb4', '#ffb27a', '#3fe0ff', '#ffffff', '#8a4dff'], '#0a0610');
  const b = new Builder(), glows = [], R = kit.rng(53);
  const PINK = '#ff3fb4';

  /* --- компактный офис внутри виллы: x[-6,6], z[-4.5,4.5], высота 4 --- */
  b.add(G.box(12.4, 0.2, 10), '#2a1d18', 'gloss', M([0, -0.1, 0]));
  for (let x = -5.8; x <= 6; x += 0.6) b.add(G.box(0.02, 0.005, 9.8), '#1d140f', 'matte', M([x, 0.003, 0]));
  b.add(G.box(0.3, 4.2, 10), '#1b1424', 'matte', M([-6.15, 2.1, 0]));
  b.add(G.box(0.3, 4.2, 10), '#1b1424', 'matte', M([6.15, 2.1, 0]));
  b.add(G.box(12.6, 0.2, 10), '#0e0a14', 'matte', M([0, 4.1, 0]));
  // задняя стена: слева панорамное окно на закат, справа — неоновая вывеска
  b.add(G.box(5.6, 4.2, 0.3), '#1b1424', 'matte', M([3.3, 2.1, -4.65]));
  b.add(G.box(6.8, 0.5, 0.3), '#1b1424', 'matte', M([-2.6, 0.25, -4.65])); b.add(G.box(6.8, 0.4, 0.3), '#1b1424', 'matte', M([-2.6, 3.95, -4.65]));
  for (const x of [-6, -3.6, -1.2, 0.5]) b.add(G.box(0.08, 3.4, 0.12), '#0a0a0e', 'metal', M([x, 2.1, -4.6]));
  const sunset = kit.canvasTex(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1a5a'); g.addColorStop(0.55, '#d0457e'); g.addColorStop(0.78, '#ff9a4a'); g.addColorStop(0.8, '#3a1a4a'); g.addColorStop(1, '#1a0d2a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffd08a'; x.beginPath(); x.arc(w * 0.62, h * 0.74, 26, Math.PI, 0); x.fill();
    x.fillStyle = '#24122e'; [[0.12, 46], [0.22, 70], [0.86, 58], [0.94, 40]].forEach(([cx, hh]) => { x.beginPath(); x.ellipse(w * cx, h * 0.8, 22, hh, 0, Math.PI, 0); x.fill(); });
  });
  scene.add(kit.screen(6.8, 3.4, sunset, [-2.6, 2.1, -4.75]));
  glows.push([-2.6, 1.6, -4.2, '#ff8a4a', 6, 0.25]);
  b.add(G.rbox(12, 0.03, 7, 0.01), '#4a1a5a', 'matte', M([0, 0.016, -0.6]));
  for (const z of [-3, 0, 3]) b.add(G.box(10.5, 0.05, 0.08), z === 0 ? PINK : '#ffe2c8', 'neon', M([0, 3.97, z]));
  kit.text3d(b, font, 'STAYA', { size: 0.6, color: '#ff4fc0', p: [3.3, 2.75, -4.48], kind: 'neon', bevel: 0.02, depth: 0.05, curve: 8 });
  glows.push([3.3, 3.0, -4.3, PINK, 3.5, 0.35]);
  b.add(G.box(3.8, 1.1, 0.04), '#14101a', 'gloss', M([3.3, 3.0, -4.48]));

  /* --- афиши пяти форматов --- */
  const posters = [
    ['AQUA', '#2fe6ff', '#0a2a6a', 'аквапарк'], ['2K17', '#ff2fd0', '#3a0a5a', 'клуб'], ['POOL', '#ff4fb8', '#0d0b3a', 'бассейн'],
    ['HALLO\nWEEN', '#ff5a1f', '#2a0606', 'дворец'], ['PHUKET', '#ffa24a', '#4a1a4a', 'вилла'],
  ];
  posters.forEach(([t, c, bg, sub], i) => {
    const tex = kit.canvasTex(256, 360, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bg); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = c; x.globalAlpha = 0.35; x.beginPath(); x.arc(w / 2, h * 0.62, 80, 0, 7); x.fill(); x.globalAlpha = 1;
      x.font = '700 18px Unbounded, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('STAYA', w / 2, 34);
      const lines = t.split('\n'); lines.forEach((ln, k) => kit.gradText(x, ln, w / 2, h * 0.4 + k * 58 - (lines.length - 1) * 29, ln.length > 4 ? 46 : 64, '#ffffff', c, { glow: c }));
      x.font = '600 18px Manrope, sans-serif'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText(sub, w / 2, h * 0.9);
    });
    const z = -3.6 + i * 1.75;
    scene.add(kit.texPlane(1.1, 1.55, tex, [-5.98, 2.25, z], [0, Math.PI / 2, 0], { rough: 0.35 }));
    b.add(G.box(0.04, 1.62, 1.18), '#0a0a0e', 'gloss', M([-5.99, 2.25, z]));
  });

  /* --- календарь --- */
  const cal = kit.canvasTex(384, 432, (x, w, h) => {
    x.fillStyle = '#f6f2ea'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ff3fb4'; x.fillRect(0, 0, w, 70);
    x.font = '900 34px Unbounded, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('НОЯБРЬ', w / 2, 48);
    const days = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    x.font = '700 15px Manrope, sans-serif'; x.fillStyle = '#777'; days.forEach((d, i) => x.fillText(d, 30 + i * 54, 100));
    x.font = '800 22px Manrope, sans-serif';
    const marks = { 7: '#2fe6ff', 14: '#ff2fd0', 21: '#ff5a1f', 28: '#ffa24a', 1: '#ff4fb8' };
    for (let d = 1; d <= 30; d++) {
      const k = d + 5 - 1, cx = 30 + (k % 7) * 54, cy = 140 + Math.floor(k / 7) * 54;
      if (marks[d]) { x.fillStyle = marks[d]; x.beginPath(); x.arc(cx, cy - 7, 21, 0, 7); x.fill(); x.fillStyle = '#fff'; } else x.fillStyle = '#222';
      x.fillText(String(d), cx, cy);
    }
  });
  scene.add(kit.texPlane(1.3, 1.45, cal, [5.98, 2.3, -2.6], [0, -Math.PI / 2, 0], { rough: 0.7 }));
  // постер-анонс на правой стене
  const ann = kit.canvasTex(512, 300, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#ff2fd0'); g.addColorStop(1, '#8a3dff'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    kit.gradText(x, 'СКОРО', w / 2, h * 0.32, 70, '#ffffff', '#ffe0f6');
    kit.gradText(x, 'НОВАЯ ТУСОВКА', w / 2, h * 0.62, 44, '#ffffff', '#ffe0f6');
    x.font = '700 22px Manrope, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('@stayaekb', w / 2, h * 0.86);
  });
  scene.add(kit.texPlane(2.2, 1.3, ann, [5.98, 2.4, 0.6], [0, -Math.PI / 2, 0], { rough: 0.4 }));

  /* --- столы и команда --- */
  const desks = [
    { p: [-3.5, 0, -2.2], ry: 0.2, who: { pose: 'feetUp', top: '#111114', bottom: '#2a2a33', glasses: true, cap: '#ff3fb4', hair: '#1a1210' }, item: 'money' },
    { p: [0, 0, -2.5], ry: 0, who: { pose: 'behindHead', top: '#f4f4f4', bottom: '#111', hair: '#3a2216', glasses: true }, item: 'dj' },
    { p: [3.5, 0, -2.2], ry: -0.2, who: { pose: 'relax', top: '#ff8ac8', bottom: '#f4f4f4', hair: '#e9c27a', longHair: 2 }, item: 'money2' },
    { p: [-2.1, 0, 0.95], ry: 0.3, who: { pose: 'phone', legs: 'sit', top: '#2fe6ff', bottom: '#22222a', hoodie: true, sleeves: true, hair: '#0e0e12' }, item: 'laptop' },
    { p: [2.1, 0, 0.95], ry: -0.3, standing: true, who: { pose: 'dj', top: '#9b6bff', bottom: '#111', cap: '#111', capBack: true, hair: '#1a1210' }, item: 'dj2' },
  ];
  desks.forEach((d, i) => {
    b.push(M(d.p, [0, d.ry, 0]));
    // стол
    b.add(G.rbox(2.6, 0.08, 1.25, 0.03), i % 2 ? '#f2eee8' : '#151219', 'gloss', M([0, 0.76, 0]));
    for (const sx of [-1, 1]) b.add(G.box(0.06, 0.72, 1.1), '#2a2a30', 'metal', M([sx * 1.2, 0.36, 0]));
    b.add(G.box(2.5, 0.025, 0.025), PINK, 'neon', M([0, 0.72, 0.63]));
    // кресло и человек за столом (смотрит на камеру, +z)
    const zc = -1.05;
    if (!d.standing) {
      const back = d.who.pose === 'feetUp' ? -0.35 : d.who.pose === 'behindHead' ? -0.25 : -0.1;
      b.add(G.rbox(0.62, 0.12, 0.6, 0.05), '#0c0c10', 'gloss', M([0, 0.46, zc]));
      b.add(G.rbox(0.62, 0.8, 0.1, 0.05), '#0c0c10', 'gloss', M([0, 0.92, zc - 0.32], [back, 0, 0]));
      kit.rod(b, [0, 0.08, zc], [0, 0.4, zc], 0.04, '#666');
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; kit.rod(b, [0, 0.07, zc], [Math.cos(a) * 0.3, 0.05, zc + Math.sin(a) * 0.3], 0.025, '#444'); }
      kit.figure(b, { p: [0, 0.02, zc - 0.05], ry: 0, i, ...d.who, legs: d.who.pose === 'feetUp' ? 'feetUp' : (d.who.legs ?? 'sit') });
    } else kit.figure(b, { p: [0, 0, zc + 0.3], ry: 0, i, ...d.who });
    // предметы на столе
    const T = 0.8;
    if (d.item.startsWith('money')) {
      const open = (x0) => {
        b.add(G.rbox(0.95, 0.12, 0.62, 0.02), '#121216', 'gloss', M([x0, T + 0.06, 0.15]));
        b.add(G.rbox(0.95, 0.04, 0.62, 0.02), '#121216', 'gloss', M([x0, T + 0.42, -0.2], [-1.75, 0, 0]));
        b.add(G.box(0.18, 0.04, 0.05), '#c0c0c8', 'metal', M([x0, T + 0.1, 0.47]));
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
          b.add(G.box(0.19, 0.06, 0.09), '#4a9a4a', 'plastic', M([x0 - 0.33 + c * 0.22, T + 0.15, 0.0 + r * 0.17]));
          b.add(G.box(0.04, 0.062, 0.092), '#e8d080', 'plastic', M([x0 - 0.33 + c * 0.22, T + 0.15, 0.0 + r * 0.17]));
        }
      };
      open(d.item === 'money' ? 0.55 : -0.5);
      for (let k = 0; k < 6; k++) b.add(G.box(0.19, 0.06, 0.09), '#4a9a4a', 'plastic', M([(d.item === 'money' ? -0.6 : 0.5) + (k % 3) * 0.08, T + 0.03 + Math.floor(k / 3) * 0.065, 0.2 + (k % 2) * 0.05], [0, R() * 0.6, 0]));
      kit.cup(b, [d.item === 'money' ? -0.2 : 0.95, T, 0.3]);
    }
    if (d.item.startsWith('dj')) {
      b.add(G.rbox(1.2, 0.07, 0.55, 0.02), '#0e0e14', 'gloss', M([0, T + 0.035, 0.1]));
      for (const sx of [-1, 1]) { b.add(G.cyl(0.17, 0.17, 0.03, 22), '#3a3946', 'metal', M([sx * 0.35, T + 0.085, 0.1])); b.add(G.cyl(0.04, 0.04, 0.035, 10), sx < 0 ? '#2fe6ff' : PINK, 'neon', M([sx * 0.35, T + 0.09, 0.1])); }
      for (let k = 0; k < 8; k++) b.add(G.box(0.05, 0.015, 0.05), kit.pick([PINK, '#2fe6ff', '#ffe14a', '#8a4dff'], k), 'neon', M([-0.12 + (k % 4) * 0.08, T + 0.08, 0.02 + Math.floor(k / 4) * 0.08]));
      b.add(G.tor(0.11, 0.025, 6, 16, Math.PI), '#111', 'gloss', M([0.85, T + 0.12, -0.1], [0, 0, 0]));
      if (d.item === 'dj') {
        b.add(G.rbox(0.95, 0.12, 0.62, 0.02), '#121216', 'gloss', M([-0.85, T + 0.06, -0.15], [0, 0.3, 0]));
        for (let k = 0; k < 6; k++) b.add(G.box(0.19, 0.06, 0.09), '#4a9a4a', 'plastic', M([-1.0 + (k % 3) * 0.22, T + 0.15, -0.25 + Math.floor(k / 3) * 0.17], [0, 0.3, 0]));
      }
    }
    if (d.item === 'laptop') {
      b.add(G.rbox(0.8, 0.03, 0.55, 0.01), '#c8c8d0', 'metal', M([0, T + 0.015, 0.1]));
      b.add(G.box(0.78, 0.5, 0.02), '#c8c8d0', 'metal', M([0, T + 0.27, -0.17], [-0.25, 0, 0]));
      b.add(G.box(0.72, 0.44, 0.005), '#ff6fd0', 'neon', M([0, T + 0.27, -0.155], [-0.25, 0, 0]));
      b.add(G.rbox(0.95, 0.12, 0.62, 0.02), '#121216', 'gloss', M([0.85, T + 0.06, 0.1], [0, -0.3, 0]));
      kit.cup(b, [-0.8, T, 0.3]); kit.cup(b, [-0.95, T, 0.1]);
    }
    b.pop();
  });

  /* --- мелочи: растения, сейф, надувные буквы, деньги --- */
  for (const [x, z] of [[-5.5, -4], [5.5, 3.8]]) {
    b.add(G.cyl(0.3, 0.24, 0.6, 14), '#e8e2da', 'gloss', M([x, 0.3, z]));
    for (let k = 0; k < 7; k++) b.add(G.sph(1, 8, 6), '#1f5a3a', 'plastic', M([x, 1.05, z], [0.6, (k / 7) * 6.28, 0], [0.13, 0.03, 0.8]));
  }
  b.add(G.rbox(0.9, 1.1, 0.8, 0.06), '#3a3a42', 'metal', M([5.5, 0.55, -3.6]));
  b.add(G.cyl(0.15, 0.15, 0.06, 16), '#c9a24a', 'metal', M([5.5, 0.7, -3.18], [Math.PI / 2, 0, 0]));
  kit.text3d(b, font, 'S', { size: 1.1, color: '#ff4fb8', p: [-5.1, 0, 3.4], r: [0, 0.9, 0], bevel: 0.22 });
  kit.text3d(b, font, 'A', { size: 1.1, color: '#2fdcff', p: [-4.3, 0, 4.2], r: [0, 0.6, 0], bevel: 0.22 });
  for (let k = 0; k < 12; k++) b.add(G.box(0.19, 0.06, 0.09), '#4a9a4a', 'plastic', M([-0.8 + R() * 1.6, 0.03 + (k > 8 ? 0.06 : 0), 2.6 + R() * 0.7], [0, R() * 3, 0]));

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#ffd6f0', '#1a1020', 0.7));
  const L = (c, i, p, d = 22) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ffb27a', 70, [0, 3.6, -1], 14); L(PINK, 40, [3, 3, -3.8], 10); L('#ff8a4a', 50, [-2.6, 2.4, -3.8], 10); L('#ffb27a', 50, [2, 3.4, 3], 12); L('#ffe2c8', 45, [-2.5, 3.4, 2.5], 12);
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());

  const keys = [
    { p: [0.6, 2.2, 7.5], l: [0, 1.6, -2], t: 0 },
    { p: [-1.4, 1.7, 4.3], l: [-2.6, 1.1, -2.5], t: 0.24 },
    { p: [0.3, 1.55, 2.6], l: [0, 1.25, -3], t: 0.4 },
    { p: [1.6, 1.6, 3.2], l: [3.4, 1.2, -2.4], t: 0.54 },
    { p: [0.2, 2.1, 4.6], l: [0, 1.4, -3], t: 0.7 },
    { p: [0, 2.3, 5.4], l: [0, 1.45, -3], t: 0.82 },
    { p: [0, 2.32, 5.5], l: [0, 1.45, -3], t: 1 },
  ];
  return { scene, cam: kit.camPath(keys) };
}
