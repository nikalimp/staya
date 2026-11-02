// 03 · STAYA 2K17 — клуб в духе 2017 года. Камера от первого лица.
// Голова поднимается от коктейля на барной стойке (память тусовщика всё перемешала: только что был бассейн) →
// разворот — а вокруг клуб → танцпол мимо стола для бир-понга к сцене → выход под табличкой WC →
// лестница вниз → коридор → парадная двустворчатая дверь, как во дворце.
export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05020a');
  scene.fog = new THREE.FogExp2('#14051f', 0.026);
  scene.environment = kit.env(renderer, ['#ff2fd0', '#8a3dff', '#21e0ff', '#ffffff', '#ff5a8a']);
  const b = new Builder(), glows = [], R = kit.rng(17);
  const PINK = '#ff2fd0', VIO = '#8a3dff', CY = '#21e0ff', YEL = '#ffe14a';

  /* --- лобби наверху: пол y=6, x[-7,7], z[34,41] --- */
  const WP = '#f3b9df';
  b.add(G.box(14, 7.6, 7), '#c98fb6', 'matte', M([0, 2.2, 37.5]));
  b.add(G.box(14, 7, 0.4), WP, 'matte', M([0, 9.5, 41.2]));
  for (const sx of [-1, 1]) b.add(G.box(0.4, 7, 7.4), WP, 'matte', M([sx * 7.2, 9.5, 37.5]));
  b.add(G.box(14.8, 0.4, 7.4), '#e9a6d2', 'matte', M([0, 13, 37.5]));
  for (const sx of [-1, 1]) b.add(G.box(5.15, 7, 0.4), WP, 'matte', M([sx * 4.43, 9.5, 33.8]));
  b.add(G.box(3.7, 2.6, 0.4), WP, 'matte', M([0, 11.7, 33.8]));
  b.add(G.box(13.6, 0.05, 0.05), PINK, 'neon', M([0, 12.75, 40.9]));
  b.add(G.box(13.6, 0.05, 0.05), CY, 'neon', M([0, 6.3, 40.9]));
  glows.push([0, 12.4, 38, PINK, 5, 0.6], [-5, 12.4, 37, PINK, 3, 0.5], [5, 12.4, 37, PINK, 3, 0.5]);
  // надпись на стене
  const graf = kit.canvasTex(2048, 900, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f6c4e4'); g.addColorStop(1, '#e79ccc'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.16; x.fillStyle = '#5a0f3a'; for (let i = 0; i < 26; i++) x.fillRect(0, i * 36, w, 2); x.globalAlpha = 1;
    x.save(); x.translate(w * 0.48, h * 0.4); x.rotate(-0.05);
    x.font = `900 400px ${kit.FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 34; x.strokeStyle = '#1a0614'; x.strokeText('STAYA', 0, 0);
    const tg = x.createLinearGradient(0, -200, 0, 200); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.45, '#ff8ad8'); tg.addColorStop(1, '#ff1fa8');
    x.fillStyle = tg; x.fillText('STAYA', 0, 0);
    x.globalAlpha = 0.6; x.fillStyle = '#ff1fa8'; for (let i = 0; i < 18; i++) x.fillRect(-760 + i * 88, 150, 9, 40 + (i * 37) % 120); x.globalAlpha = 1;
    x.restore();
    x.save(); x.translate(w * 0.66, h * 0.8); x.rotate(-0.08);
    x.font = `900 230px ${kit.FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 22; x.strokeStyle = '#1a0614'; x.strokeText('2K17', 0, 0);
    const g2 = x.createLinearGradient(-300, 0, 300, 0); g2.addColorStop(0, '#21e0ff'); g2.addColorStop(1, '#8a3dff'); x.fillStyle = g2; x.fillText('2K17', 0, 0);
    x.restore();
    x.font = `700 70px ${kit.FONT}`; x.fillStyle = '#5a0f3a'; x.fillText('♥ like', w * 0.12, h * 0.86);
    x.font = `700 46px ${kit.FONT}`; x.fillText('#стая', w * 0.88, h * 0.12);
  });
  scene.add(kit.texPlane(13.6, 6, graf, [0, 9.3, 40.98], [0, Math.PI, 0], { rough: 0.85 }));
  kit.spinner(b, [-6.95, 9.6, 36.5], [0, Math.PI / 2, 0.4], 0.9, '#2f7bff');

  /* --- лестница вниз: от z=34 (y=6) до z=16 (y=0) --- */
  for (let i = 0; i < 30; i++) {
    const y = 6 - (i + 1) * 0.2, z = 34 - i * 0.6 - 0.3;
    b.add(G.box(3.4, y + 0.001, 0.6), '#d9a6c8', 'matte', M([0, y / 2, z]));
    b.add(G.box(3.4, 0.03, 0.08), '#ffffff', 'plastic', M([0, y, z + 0.27]));
  }
  for (const sx of [-1, 1]) b.add(G.box(0.3, 12, 18.4), WP, 'matte', M([sx * 1.85, 4.4, 24.9]));
  b.add(G.box(3.4, 0.3, 18.4), '#e9a6d2', 'matte', M([0, 10.55, 24.9]));
  const rail = [];
  for (let i = 0; i <= 30; i += 3) { const y = 6 - i * 0.2, z = 34 - i * 0.6; rail.push([1.45, y + 0.95, z]); kit.rod(b, [1.45, y, z], [1.45, y + 0.95, z], 0.025, '#3a0b22', 'metal', 6); }
  b.add(G.tube(rail, 0.05, 40, 6), '#7a1040', 'gloss');
  for (const z of [30, 23]) { b.add(G.box(0.6, 0.08, 0.3), '#fff', 'neon', M([0, 10.35, z])); glows.push([0, 10.1, z, PINK, 3, 1.2]); }

  /* --- клуб: x[-16,16], z[-16,16], высота 10 --- */
  const WALL = '#120a1c';
  b.add(G.box(14.2, 10, 0.4), WALL, 'matte', M([-8.9, 5, 16])); b.add(G.box(14.2, 10, 0.4), WALL, 'matte', M([8.9, 5, 16]));
  b.add(G.box(3.6, 5.6, 0.4), WALL, 'matte', M([0, 7.2, 16]));
  b.add(G.box(3.6, 0.1, 0.1), PINK, 'neon', M([0, 4.35, 15.75]));
  b.add(G.box(0.4, 10, 32), WALL, 'matte', M([-16, 5, 0]));
  // правая стена: проём в коридор к туалетам (z −8.8…−6.2, высота 3.2)
  const CZ = -7.5, CW = 2.6, CH = 3.2, CX = 30;
  b.add(G.box(0.4, 10, 7.2), WALL, 'matte', M([16, 5, -12.4])); b.add(G.box(0.4, 10, 22.2), WALL, 'matte', M([16, 5, 4.9]));
  b.add(G.box(0.4, 10 - CH, CW), WALL, 'matte', M([16, CH + (10 - CH) / 2, CZ]));
  b.add(G.box(32, 10, 0.4), WALL, 'matte', M([0, 5, -16]));
  b.add(G.box(32, 0.4, 32), '#07050c', 'matte', M([0, 10.2, 0]));
  b.add(G.box(32, 0.2, 32), '#0b0812', 'gloss', M([0, -0.1, 0]));
  for (let ix = -7; ix < 7; ix++) for (let iz = -7; iz < 6; iz++) {
    const r = R(), c = r < 0.38 ? '#1a0f2a' : r < 0.6 ? PINK : r < 0.78 ? VIO : r < 0.93 ? CY : YEL;
    b.add(G.box(1.1, 0.05, 1.1), c, r < 0.38 ? 'gloss' : 'neon', M([ix * 1.2 + 0.6, 0.03, iz * 1.2 - 0.6]));
  }
  for (const sx of [-1, 1]) for (const y of [2.5, 7.5]) {
    if (sx > 0 && y < 3) { b.add(G.box(0.06, 0.08, 6.2), CY, 'neon', M([15.75, y, -11.9])); b.add(G.box(0.06, 0.08, 21.2), CY, 'neon', M([15.75, y, 4.4])); continue; }
    b.add(G.box(0.06, 0.08, 30), sx < 0 ? PINK : CY, 'neon', M([sx * 15.75, y, 0]));
  }
  // рамка проёма и табличка
  b.add(G.box(0.08, 0.08, CW), PINK, 'neon', M([15.7, CH, CZ]));
  for (const sz of [-1, 1]) b.add(G.box(0.08, CH, 0.08), PINK, 'neon', M([15.7, CH / 2, CZ + sz * CW / 2]));
  kit.text3d(b, font, 'WC', { size: 0.45, color: '#ffffff', kind: 'neon', p: [15.7, CH + 0.35, CZ], r: [0, -Math.PI / 2, 0], bevel: 0.01, depth: 0.04 });
  glows.push([15.5, CH + 0.55, CZ, '#ffffff', 1.6, 0.8]);

  /* --- выход под WC: короткий коридор → лестница вниз → коридор с парочками → красная двойная дверь --- */
  const X1 = 19.5, NS = 18, SH = 0.3, SD = 0.5, X2 = X1 + NS * SD, LY = -NS * SH, X3 = 40;
  const corr = (xa, xb, y) => {
    const L = xb - xa, cx = (xa + xb) / 2;
    b.add(G.box(L, 0.1, CW), '#1a0d1c', 'gloss', M([cx, y - 0.05, CZ]));
    b.add(G.box(L, 0.1, CW), '#0c0710', 'matte', M([cx, y + CH + 0.05, CZ]));
    for (const sz of [-1, 1]) {
      b.add(G.box(L, CH, 0.2), '#2a0f2e', 'matte', M([cx, y + CH / 2, CZ + sz * (CW / 2 + 0.1)]));
      b.add(G.box(L, 0.06, 0.06), sz < 0 ? PINK : '#ff2a55', 'neon', M([cx, y + CH - 0.06, CZ + sz * (CW / 2 - 0.04)]));
    }
    for (let x = xa + 1.2; x < xb; x += 2.4) glows.push([x, y + CH - 0.1, CZ, '#ff3fb4', 1.6, 0.6]);
  };
  corr(16, X1, 0); corr(X2, X3, LY);
  // лестница: ступени с неоновыми кромками, наклонный потолок, высокие стены
  for (let i = 0; i < NS; i++) {
    const x = X1 + i * SD + SD / 2, y = -(i + 1) * SH;
    b.add(G.box(SD, 0.3, CW), '#1a0d1c', 'gloss', M([x, y + 0.15 - 0.15, CZ]));
    b.add(G.box(0.05, 0.04, CW - 0.1), i % 2 ? PINK : '#ff2a55', 'neon', M([x - SD / 2 + 0.03, y + 0.15, CZ]));
    b.add(G.box(SD, 0.1, CW), '#0c0710', 'matte', M([x, y + SH + CH + 0.05, CZ]));
  }
  for (const sz of [-1, 1]) {
    b.add(G.box(X2 - X1, CH - LY + 0.4, 0.2), '#2a0f2e', 'matte', M([(X1 + X2) / 2, (CH + LY) / 2, CZ + sz * (CW / 2 + 0.1)]));
    kit.laser(b, [X1, CH - 0.08, CZ + sz * (CW / 2 - 0.04)], [X2, LY + CH - 0.08, CZ + sz * (CW / 2 - 0.04)], sz < 0 ? PINK : '#ff2a55', 0.03);
  }
  for (let i = 1; i < 5; i++) glows.push([X1 + i * 1.8, -i * 1.08 + CH - 0.3, CZ, '#ff3fb4', 1.6, 0.6]);
  b.add(G.box(0.2, CH, CW), '#2a0f2e', 'matte', M([X3 + 0.1, LY + CH / 2, CZ]));
  // парадная двустворчатая дверь — та же, что во дворце (kit.grandDoor), в масштабе коридора
  const door = kit.grandDoor(scene, b, [X3 - 0.25, LY, CZ], -Math.PI / 2, 0.38);
  b.add(G.box(0.06, 0.04, 2.4), '#ff8a2a', 'neon', M([X3 - 0.35, LY + 0.02, CZ]));
  glows.push([X3 - 0.5, LY + 0.1, CZ, '#ff8a2a', 2.2, 0.6]);
  // коридор: неоновые рейки на стенах, подсветка пола, светильники под потолком
  for (let x = X2 + 0.8; x < X3 - 0.8; x += 1.6) for (const sz of [-1, 1]) {
    b.add(G.box(0.05, CH - 0.6, 0.05), sz < 0 ? '#21e0ff' : '#ff2fd0', 'neon', M([x, LY + CH / 2, CZ + sz * (CW / 2 - 0.02)]));
    glows.push([x, LY + CH - 0.25, CZ + sz * 0.6, sz < 0 ? '#21e0ff' : '#ff2fd0', 0.9, 0.9]);
  }
  for (const sz of [-1, 1]) b.add(G.box(X3 - X2, 0.03, 0.05), '#ff2fd0', 'neon', M([(X2 + X3) / 2, LY + 0.02, CZ + sz * (CW / 2 - 0.05)]));
  // постеры 2017 на стенах нижнего коридора
  const poster = (txt, c1, c2) => kit.canvasTex(256, 360, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, w, h);
    kit.gradText(x, txt, w / 2, h * 0.45, 64, '#ffffff', '#ffe0f4', { glow: '#ff2fd0' });
    x.font = `700 20px ${kit.FONT}`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('STAYA · EKB', w / 2, h * 0.86);
  });
  [['2K17', '#ff2fd0', '#4a0060', 29.6, -1], ['SPIN', '#2f7bff', '#16002e', 31.2, 1], ['LOVE', '#ff2a55', '#3a0020', 32.8, -1], ['VIBE', '#39ff6a', '#08301a', 34.4, 1], ['EKB', '#ffe14a', '#3a2a00', 36, -1], ['STAYA', '#21e0ff', '#002a3a', 37.6, 1]].forEach(([t, a, c, x, sz]) =>
    scene.add(kit.screen(0.8, 1.12, poster(t, a, c), [x, LY + 1.75, CZ + sz * (CW / 2 - 0.01)], [0, sz < 0 ? 0 : Math.PI, 0])));
  for (let x = -12; x <= 12; x += 6) kit.truss(b, [x, 9.2, -14], [x, 9.2, 14], 0.45);
  for (let i = 0; i < 10; i++) {
    const x = -12 + (i % 5) * 6, z = i < 5 ? -6 : 8, c = kit.pick([PINK, CY, VIO, '#ffffff'], i);
    b.add(G.cyl(0.2, 0.26, 0.45, 10), '#1a1a20', 'metal', M([x, 8.7, z]));
    glows.push([x, 8.45, z, c, 2, 1.8]);
    kit.beam(b, [x, 8.45, z], [x * 0.6 + (i % 2 ? 2 : -2), 0, z * 0.4 - 2], 1.8, c);
  }
  // сцена, диджей, экран
  b.add(G.rbox(14, 1, 4.4, 0.08), '#0e0a16', 'gloss', M([0, 0.5, -13.4]));
  b.add(G.box(14, 0.07, 0.07), PINK, 'neon', M([0, 1.0, -11.2]));
  kit.djBooth(b, [0, 1, -12.4], 0, { w: 3.2, front: VIO, front2: PINK, decks: false });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 6, 1, -13], 0, 1.8, 1.3); kit.speaker(b, [sx * 6, 2.8, -13], 0, 1.4, 1.1); }
  const scr = kit.canvasTex(1024, 384, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16002e'); g.addColorStop(1, '#4a0060'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,47,208,.6)'; x.lineWidth = 2;
    for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(w / 2, h * 0.55); x.lineTo((i / 13) * w * 1.6 - w * 0.3, h); x.stroke(); }
    for (let i = 0; i < 6; i++) { const y = h * 0.6 + i * i * 6; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    kit.gradText(x, '2K17', w / 2, h * 0.38, 200, '#ffffff', '#ff7af0', { glow: '#ff2fd0' });
    x.font = `700 30px ${kit.FONT}`; x.fillStyle = '#21e0ff'; x.textAlign = 'center'; x.fillText('ВОЗВРАЩАЕМ ТЕБЯ В 2017', w / 2, h * 0.86);
  });
  kit.videoScreen(scene, 'video/club.mp4', 15, 5.6, [0, 5.2, -15.75], [0, 0, 0], scr);
  kit.text3d(b, font, 'STAYA', { size: 1.3, color: '#ff4fe0', p: [0, 8.3, -14.6] });
  for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; kit.laser(b, [(i % 2 ? 1 : -1) * 6.5, 3.6, -12.6], [Math.sin(a) * 30, 6 + (i % 3), -12.6 + Math.cos(a) * 30], i % 2 ? '#39ff6a' : PINK); }

  /* --- диско-шар под потолком --- */
  const MR = 1.3, MC = [0, 7.4, 3];
  kit.rod(b, [MC[0], 10, MC[2]], [MC[0], MC[1] + MR, MC[2]], 0.025, '#c8c8d0', 'metal', 6);
  b.add(new THREE.IcosahedronGeometry(MR, 3).toNonIndexed(), '#e8e8f0', 'chrome', M(MC));
  glows.push([MC[0], MC[1], MC[2], '#fff1d6', 4.5, 0.3]);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = Math.cos(i * 1.7) * 0.9; glows.push([MC[0] + Math.cos(a) * MR * 0.95, MC[1] + y, MC[2] + Math.sin(a) * MR * 0.95, '#ffffff', 0.5, 2]); }

  // полки-светильники за баром (неон, без запекания)
  for (const y of [1.62, 2.22]) { b.add(G.box(4.6, 0.04, 0.34), '#ffd6f0', 'neon', M([7, y, 15.62])); glows.push([7, y + 0.2, 15.5, PINK, 3.4, 0.35]); }
  /* --- бар, с которого начинается сцена (Sketchfab «Modern Industrial Bar», CC BY) --- */
  const BX = 7, BZ = 11.6, BTOP = 0.96, GL = [6.55, BTOP, 10.75];
  /* --- 2017: спиннеры, кальяны, розовое вино, лайк --- */
  kit.spinner(b, [-15.6, 5.2, -4], [0, Math.PI / 2, 0.3], 1.9, '#2f7bff');
  kit.spinner(b, [-15.6, 4.6, 8], [0, Math.PI / 2, 1.1], 1.4, '#ffd23f');
  kit.spinner(b, [15.6, 6.4, 7], [0, -Math.PI / 2, 0.6], 1.6, '#ff3b3b');
  // диванчики у стены, как в клубах 2017-го
  for (const z of [3, 9]) { b.add(G.rbox(1.6, 0.5, 4, 0.2), '#5a0f3a', 'plastic', M([-14.6, 0.25, z])); b.add(G.rbox(0.5, 1.2, 4, 0.2), '#5a0f3a', 'plastic', M([-15.4, 0.6, z])); }
  const hs = new THREE.Shape(); hs.moveTo(0, -1); hs.bezierCurveTo(-1.6, 0.1, -0.9, 1.2, 0, 0.55); hs.bezierCurveTo(0.9, 1.2, 1.6, 0.1, 0, -1);
  b.add(new THREE.ExtrudeGeometry(hs, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 4, curveSegments: 16 }), '#ff2a55', 'gloss', M([15.4, 6.4, -3], [0, -Math.PI / 2, 0], 1.3));
  glows.push([15.2, 6.4, -3, '#ff2a55', 4, 0.8]);
  kit.text3d(b, font, '2K17', { size: 1.5, color: '#b45cff', p: [-15.6, 7.2, -10.5], r: [0, Math.PI / 2, 0] });

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#6a3bd0', '#0c0614', 0.55));
  const L = (c, i, p, d = 45) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 200, [0, 11.5, 37.5], 18); L(PINK, 120, [0, 8, 27], 18); L(VIO, 380, [0, 8, -8]); L(CY, 220, [-10, 5, 0]); L(PINK, 220, [10, 5, 0]); L('#fff1d6', 40, [0, 5, 0], 10); L(PINK, 70, [18, 2.8, -7.5], 9); L('#ff2a55', 90, [24, -2, -7.5], 10); L(PINK, 90, [33, LY + 2.8, -7.5], 11);
  // свет для моделей: бар с вывеской и парадная дверь в конце коридора
  L('#ffd0a0', 260, [7, 3.0, 9.6], 10); L(PINK, 220, [7, 2.8, 14.8], 9); L('#ffb15a', 140, [X3 - 1.6, LY + 2.7, CZ], 6);
  scene.add(kit.glowPoints(glows));
  // реквизит 2017 (Poly Haven, CC0): бумбокс на сцене, кассетники и бутылки на столиках лаунжа
  await Promise.all([
    kit.prop(scene, 'boombox', { p: [-4.6, 1.0, -11.9], ry: 0.25, s: 2.2 }),
    kit.prop(scene, 'boombox', { p: [4.8, 1.0, -11.8], ry: -0.3, s: 2.2 }),
    kit.prop(scene, 'portable_cassette_player', { p: [-14.4, 0.5, 2.4], ry: 0.8, s: 2.4 }),
    kit.prop(scene, 'wine_bottles_01', { p: [-14.4, 0.5, 9.4], ry: 1.2, s: 1.6 }),
    kit.decks(scene, [0, 2.05, -12.4], 0, 1.6),
    kit.prop(scene, 'sf_indbar', { p: [BX, 0.0, BZ], w: 4.8 }),
    kit.prop(scene, 'sf_summer', { p: GL, h: 0.24, ry: 0.6 }),
    // подсвеченные полки с бутылками за баром
    ...[-1.6, -0.5, 0.6, 1.7].flatMap((dx, i) => [kit.prop(scene, 'wine_bottles_01', { p: [BX + dx, 1.66, 15.62], ry: i, s: 1.3 }), kit.prop(scene, 'wine_bottles_01', { p: [BX + dx + 0.3, 2.26, 15.62], ry: i + 2, s: 1.3 })]),
    kit.prop(scene, 'wine_bottles_01', { p: [BX + 1.3, BTOP, BZ + 0.2], ry: 0.4, s: 1.4 }),
    kit.prop(scene, 'sf_martini', { p: [BX - 1.4, BTOP, BZ - 0.6], h: 0.18 }),
    ...[-1.6, -0.5, 0.6, 1.7].map((dx, i) => kit.prop(scene, 'bar_chair_round_01', { p: [BX + dx, 0, BZ - 1.75], ry: i % 2 ? 0.3 : -0.3, s: 1.05 })),
    // бир-понг на краю танцпола (Sketchfab «Beer Pong Table», CC BY)
    kit.prop(scene, 'sf_beerpong', { p: [-4.6, 0.05, 2.2], ry: 0.35, w: 2.5 }),
  ]);
  glows.push([BX, 3.6, 15.4, '#ffe14a', 3, 0.45], [BX, 2.6, BZ, '#ff2fd0', 3.2, 0.5]);
  const built = b.build(); scene.add(built);
  kit.haze(scene, { box: [-15, 15, 3, 9.5, -15, 14], colors: ['#ff2fd0', '#8a3dff', '#2fe6ff'], n: 20, size: 12, opacity: 0.16 });
  kit.haze(scene, { box: [17, 39, -5, 2.8, -8.6, -6.4], colors: ['#ff3fb4'], n: 8, size: 4, opacity: 0.14, seed: 9 });
  await kit.applyBake(scene, built, 'club', { k: 26 });   // свет запечён в Blender (scripts/blender/bake_scene.py)

  /* --- камера --- */
  const EYE = 1.62;
  const keys = [
    // голова поднимается от коктейля на стойке
    { p: [GL[0], GL[1] + 0.3, GL[2] - 0.02], l: [GL[0], GL[1] - 0.5, GL[2] + 0.004], t: 0 },
    { p: [GL[0], GL[1] + 0.45, GL[2] - 0.3], l: [GL[0], GL[1] + 0.05, GL[2]], t: 0.05 },
    { p: [GL[0], EYE, GL[2] - 0.95], l: [BX, 2.2, 15.7], t: 0.12 },
    // разворот: вокруг — клуб
    { p: [GL[0] - 0.2, EYE, GL[2] - 1.2], l: [-2, 1.9, 10], t: 0.2 },
    { p: [GL[0] - 0.5, EYE, GL[2] - 1.5], l: [0, 2.4, -13], t: 0.28 },
    // по танцполу мимо бир-понга к сцене
    { p: [1.5, EYE, 5.5], l: [-4.6, 0.9, 2.2], t: 0.36 },
    { p: [-0.6, EYE, 0.5], l: [0, 2.6, -13] },
    { p: [0.3, 1.6, -6.8], l: [0, 2.7, -14], t: 0.56 },
    // к выходу под WC
    { p: [2.4, EYE, -7.6], l: [16, 2.4, -7.5], t: 0.61 },
    { p: [9, EYE, -7.5], l: [20, 1.8, -7.5] },
    { p: [15.4, EYE, -7.5], l: [21, 0.6, -7.5], t: 0.72 },
    // лестница вниз
    { p: [19.3, EYE, -7.5], l: [26, -3.2, -7.5], t: 0.77 },
    { p: [X2 - 0.4, LY + EYE + 0.15, -7.5], l: [X3, LY + 1.5, -7.5], t: 0.87 },
    // коридор и парадная дверь
    { p: [34, LY + EYE, -7.5], l: [X3, LY + 1.5, -7.5], t: 0.94 },
    { p: [X3 - 1.1, LY + EYE, -7.5], l: [X3, LY + 1.45, -7.5], t: 1 },
  ];
  const path = kit.camPath(keys);
  const sm = (a, c, t) => { const k = Math.min(1, Math.max(0, (t - a) / (c - a))); return k * k * (3 - 2 * k); };
  const update = (t) => door.open(0.35 * sm(0.93, 1, t));
  const near = (t) => (t < 0.06 ? 0.005 : 0.05);
  const calm = (t) => Math.min(1, Math.max(0, (0.14 - t) / 0.06));   // голова поднимается от коктейля — кадр по центру
  return { scene, cam: path, update, near, calm };
}
