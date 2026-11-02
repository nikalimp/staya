// 03 · STAYA 2K17 — клуб в духе 2017 года. Камера от первого лица.
// Голова поднимается от стакана (из прошлой сцены) — мы уже в толпе → протискиваемся к сцене →
// выход под табличкой WC → лестница вниз → коридор с парочками → красная двойная дверь, как во дворце.
import { person as human, guest as castGuest, RESIDENTS } from '../people.js';
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
  human(b, castGuest(3), { p: [5.2, 6, 37.2], ry: -2.2, pose: 'phone' });
  human(b, castGuest(13), { p: [4.4, 6, 36.2], ry: -2.6, pose: 'hips' });

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
  // красная двойная дверь — такая же, как парадный вход во дворец
  const DRED = '#5a0a12', DPAN = '#7a1018', DGOLD = '#d9a441';
  b.add(G.box(0.14, 2.9, 2.5), DGOLD, 'metal', M([X3 - 0.04, LY + 1.45, CZ]));
  for (const sz of [-1, 1]) {
    b.add(G.rbox(0.12, 2.75, 1.13, 0.03), DRED, 'gloss', M([X3 - 0.12, LY + 1.4, CZ + sz * 0.59]));
    for (const y of [0.6, 1.4, 2.2]) b.add(G.box(0.04, 0.6, 0.8), DPAN, 'gloss', M([X3 - 0.19, LY + y, CZ + sz * 0.59]));
    b.add(G.sph(0.06, 12, 8), DGOLD, 'metal', M([X3 - 0.22, LY + 1.35, CZ + sz * 0.12]));
  }
  b.add(G.box(0.06, 0.04, 2.4), '#ff8a2a', 'neon', M([X3 - 0.2, LY + 0.02, CZ]));
  glows.push([X3 - 0.3, LY + 0.1, CZ, '#ff8a2a', 2.2, 0.6]);
  // постеры 2017 на стенах нижнего коридора
  const poster = (txt, c1, c2) => kit.canvasTex(256, 360, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, w, h);
    kit.gradText(x, txt, w / 2, h * 0.45, 64, '#ffffff', '#ffe0f4', { glow: '#ff2fd0' });
    x.font = `700 20px ${kit.FONT}`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('STAYA · EKB', w / 2, h * 0.86);
  });
  [['2K17', '#ff2fd0', '#4a0060', 30, -1], ['SPIN', '#2f7bff', '#16002e', 33.6, 1], ['LOVE', '#ff2a55', '#3a0020', 36.4, -1], ['VIBE', '#39ff6a', '#08301a', 31.8, 1]].forEach(([t, a, c, x, sz]) =>
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
  kit.djBooth(b, [0, 1, -12.4], 0, { w: 3.2, front: VIO, front2: PINK });
  human(b, RESIDENTS.sixphrases, { p: [0, 1, -13.3], pose: 'dj' });
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 6, 1, -13], 0, 1.8, 1.3); kit.speaker(b, [sx * 6, 2.8, -13], 0, 1.4, 1.1); }
  const scr = kit.canvasTex(1024, 384, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16002e'); g.addColorStop(1, '#4a0060'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,47,208,.6)'; x.lineWidth = 2;
    for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(w / 2, h * 0.55); x.lineTo((i / 13) * w * 1.6 - w * 0.3, h); x.stroke(); }
    for (let i = 0; i < 6; i++) { const y = h * 0.6 + i * i * 6; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    kit.gradText(x, '2K17', w / 2, h * 0.38, 200, '#ffffff', '#ff7af0', { glow: '#ff2fd0' });
    x.font = `700 30px ${kit.FONT}`; x.fillStyle = '#21e0ff'; x.textAlign = 'center'; x.fillText('ВОЗВРАЩАЕМ ТЕБЯ В 2017', w / 2, h * 0.86);
  });
  scene.add(kit.screen(15, 5.6, scr, [0, 5.2, -15.75]));
  kit.text3d(b, font, 'STAYA', { size: 1.3, color: '#ff4fe0', p: [0, 8.3, -14.6] });
  for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; kit.laser(b, [(i % 2 ? 1 : -1) * 6.5, 3.6, -12.6], [Math.sin(a) * 30, 6 + (i % 3), -12.6 + Math.cos(a) * 30], i % 2 ? '#39ff6a' : PINK); }

  /* --- диско-шар под потолком --- */
  const MR = 1.3, MC = [0, 7.4, 3];
  kit.rod(b, [MC[0], 10, MC[2]], [MC[0], MC[1] + MR, MC[2]], 0.025, '#c8c8d0', 'metal', 6);
  b.add(new THREE.IcosahedronGeometry(MR, 3).toNonIndexed(), '#e8e8f0', 'chrome', M(MC));
  glows.push([MC[0], MC[1], MC[2], '#fff1d6', 4.5, 0.3]);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = Math.cos(i * 1.7) * 0.9; glows.push([MC[0] + Math.cos(a) * MR * 0.95, MC[1] + y, MC[2] + Math.sin(a) * MR * 0.95, '#ffffff', 0.5, 2]); }

  /* --- толпа: плотная, с узким коридором для камеры --- */
  const lane = (z) => 0.7 * Math.sin(z * 0.45);
  const tops = ['#9a9aa4', '#111114', '#f4f4f4', '#ff8ac8', '#7cc7ff', '#b7ff6a', '#2a2a40', '#ffd4a8'];
  const hairs = ['#1a1210', '#3a2216', '#e9c27a', '#0e0e12', '#ff8ad8'];
  let k = 0;
  const person = (x, z, ry, lo = false) => {
    const g = k % 2 === 0;
    human(b, castGuest(k), { p: [x, 0.05, z], ry, pose: kit.pick(['up', 'wave', 'up', 'phone', 'peace', 'up'], k), s: 0.95 + R() * 0.12, lo });
    k++;
  };
  for (let z = 5.6; z > -8.5; z -= 1.1) for (let x = -7.4; x <= 7.4; x += 1.1) {
    const xx = x + (R() - 0.5) * 0.5, zz = z + (R() - 0.5) * 0.5, d = Math.abs(xx - lane(zz));
    if (d < 0.75 || (d > 3 && R() < 0.5) || (xx > 1.1 && zz < -6.2 && zz > -8.9)) continue;
    person(xx, zz, Math.PI + (R() - 0.5) * 1.2, d > 1.3);
  }
  // «тесные» соседи по краям коридора — камера протискивается между ними
  for (let z = 5; z > -8; z -= 1.3) for (const sx of [-1, 1]) if (!(sx > 0 && z < -5.8)) person(lane(z) + sx * (0.52 + R() * 0.08), z + (R() - 0.5) * 0.3, Math.PI + sx * 0.6 + (R() - 0.5) * 0.6);

  /* --- парочки в коридоре: обнимаются у стен --- */
  [[29.6, -1, 'hug', 'neck'], [32.2, 1, 'neck', 'hug'], [34.8, -1, 'hug', 'hug'], [37.3, 1, 'neck', 'hug']].forEach(([x, sz, a1, a2], i) => {
    const z = CZ + sz * 0.78;
    human(b, castGuest(10 + i * 2), { p: [x - 0.21, LY + 0.02, z], ry: Math.PI / 2, pose: a1, s: 1.02, lo: true });
    human(b, castGuest(i * 2 + 1), { p: [x + 0.21, LY + 0.02, z], ry: -Math.PI / 2, pose: a2, lo: true });
  });

  /* --- 2017: спиннеры, кальяны, розовое вино, лайк --- */
  kit.spinner(b, [-15.6, 5.2, -4], [0, Math.PI / 2, 0.3], 1.9, '#2f7bff');
  kit.spinner(b, [-15.6, 4.6, 8], [0, Math.PI / 2, 1.1], 1.4, '#ffd23f');
  kit.spinner(b, [15.6, 6.4, 7], [0, -Math.PI / 2, 0.6], 1.6, '#ff3b3b');
  for (const z of [3, 9]) {
    b.add(G.rbox(1.6, 0.5, 4, 0.2), '#5a0f3a', 'plastic', M([-14.6, 0.25, z]));
    b.add(G.rbox(0.5, 1.2, 4, 0.2), '#5a0f3a', 'plastic', M([-15.4, 0.6, z]));
    b.add(G.cyl(0.6, 0.6, 0.06, 20), '#1d1824', 'gloss', M([-12.6, 0.55, z])); b.add(G.cyl(0.08, 0.1, 0.55, 8), '#333', 'metal', M([-12.6, 0.27, z]));
    hookah([-12.6, 0.58, z], 0.65);
  }
  function hookah(p, s) {
    b.push(M(p, [0, 0, 0], s));
    b.add(G.sph(0.42, 18, 12), '#3fffc0', 'glass', M([0, 0.42, 0], [0, 0, 0], [1, 1.05, 1]));
    b.add(G.cyl(0.07, 0.1, 1.4, 10), '#c8c8d8', 'chrome', M([0, 1.45, 0]));
    b.add(G.cyl(0.32, 0.32, 0.03, 16), '#c8c8d8', 'chrome', M([0, 1.5, 0]));
    b.add(G.cyl(0.14, 0.08, 0.2, 12), '#7a2a12', 'gloss', M([0, 2.25, 0]));
    glows.push([p[0], p[1] + 2.4 * s, p[2], '#ff6a2a', 0.5, 1.4]);
    b.add(G.tube([[0.1, 1.2, 0], [0.6, 0.9, 0.2], [0.8, 0.3, 0.6], [0.6, 0.1, 1.0]], 0.035, 20, 6), '#2a1a2a', 'gloss');
    b.pop();
  }
  b.push(M([13.2, 0, 2], [0, 0.3, 0]));
  b.add(G.cyl(0.85, 0.85, 3.2, 28), '#ff6fb4', 'glass', M([0, 1.6, 0]));
  b.add(G.sph(0.85, 28, 14), '#ff6fb4', 'glass', M([0, 3.2, 0], [0, 0, 0], [1, 0.7, 1]));
  b.add(G.cyl(0.3, 0.32, 1.4, 20), '#ff6fb4', 'glass', M([0, 4.2, 0]));
  b.add(G.cyl(0.33, 0.33, 0.5, 20), '#ffd6ec', 'gloss', M([0, 4.8, 0]));
  b.add(G.cyl(0.87, 0.87, 1.3, 28, true), '#ffe7f3', 'gloss', M([0, 1.7, 0]));
  b.pop();
  glows.push([13.2, 1.6, 2, '#ff6fb4', 4, 0.5]);
  const hs = new THREE.Shape(); hs.moveTo(0, -1); hs.bezierCurveTo(-1.6, 0.1, -0.9, 1.2, 0, 0.55); hs.bezierCurveTo(0.9, 1.2, 1.6, 0.1, 0, -1);
  b.add(new THREE.ExtrudeGeometry(hs, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 4, curveSegments: 16 }), '#ff2a55', 'gloss', M([15.4, 6.4, -3], [0, -Math.PI / 2, 0], 1.3));
  glows.push([15.2, 6.4, -3, '#ff2a55', 4, 0.8]);
  kit.text3d(b, font, '2K17', { size: 1.5, color: '#b45cff', p: [-15.6, 7.2, -10.5], r: [0, Math.PI / 2, 0] });

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#6a3bd0', '#0c0614', 0.55));
  const L = (c, i, p, d = 45) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 200, [0, 11.5, 37.5], 18); L(PINK, 120, [0, 8, 27], 18); L(VIO, 380, [0, 8, -8]); L(CY, 220, [-10, 5, 0]); L(PINK, 220, [10, 5, 0]); L('#fff1d6', 40, [0, 5, 0], 10); L(PINK, 70, [18, 2.8, -7.5], 9); L('#ff2a55', 90, [24, -2, -7.5], 10); L(PINK, 90, [33, LY + 2.8, -7.5], 11);
  scene.add(kit.glowPoints(glows));
  // реквизит 2017 (Poly Haven, CC0): бумбокс на сцене, кассетники и бутылки на столиках лаунжа
  await Promise.all([
    kit.prop(scene, 'boombox', { p: [-4.6, 1.0, -11.9], ry: 0.25, s: 2.2 }),
    kit.prop(scene, 'boombox', { p: [4.8, 1.0, -11.8], ry: -0.3, s: 2.2 }),
    kit.prop(scene, 'portable_cassette_player', { p: [-12.2, 0.58, 2.6], ry: 0.8, s: 2.4 }),
    kit.prop(scene, 'wine_bottles_01', { p: [-12.9, 0.58, 9.2], ry: 1.2, s: 1.6 }),
  ]);
  scene.add(b.build());

  /* --- камера --- */
  const EYE = 1.62;
  const keys = [
    // голова поднимается от стакана — мы уже в толпе
    { p: [lane(7.2), EYE - 0.05, 7.2], l: [lane(7.2), 1.0, 6.1], t: 0 },
    { p: [lane(6.8), EYE, 6.8], l: [lane(3), 1.65, 0], t: 0.1 },
    // протискиваемся сквозь толпу
    { p: [lane(4), 1.5, 4], l: [lane(0), 1.45, -1], t: 0.2 },
    { p: [lane(0.5), 1.45, 0.5], l: [lane(-3.5), 1.45, -4.5] },
    { p: [lane(-3.5), 1.45, -3.5], l: [lane(-7), 1.5, -8] },
    { p: [lane(-7.2), 1.5, -7.2], l: [0, 1.9, -13], t: 0.46 },
    // взгляд останавливается на сцене
    { p: [0.3, 1.55, -7.6], l: [0, 2.7, -14], t: 0.56 },
    // к выходу под WC
    { p: [2.4, EYE, -7.6], l: [16, 2.4, -7.5], t: 0.61 },
    { p: [9, EYE, -7.5], l: [20, 1.8, -7.5] },
    { p: [15.4, EYE, -7.5], l: [21, 0.6, -7.5], t: 0.72 },
    // лестница вниз
    { p: [19.3, EYE, -7.5], l: [26, -3.2, -7.5], t: 0.77 },
    { p: [X2 - 0.4, LY + EYE + 0.15, -7.5], l: [X3, LY + 1.5, -7.5], t: 0.87 },
    // коридор с парочками и красная дверь
    { p: [34, LY + EYE, -7.5], l: [X3, LY + 1.5, -7.5], t: 0.94 },
    { p: [X3 - 0.65, LY + EYE, -7.5], l: [X3, LY + 1.45, -7.5], t: 1 },
  ];
  const path = kit.camPath(keys);
  // покачивание в толпе — эффект «протискивания»
  const roll = (t) => (t > 0.14 && t < 0.48 ? Math.sin(t * 34) * 0.045 * Math.sin(((t - 0.14) / 0.34) * Math.PI) : 0);
  // стакан из прошлой сцены: опускается от лица и уходит из кадра
  const hero = kit.drink(); scene.add(hero.group);
  const ease = (x) => x * x * (3 - 2 * x), cl = (x) => Math.min(1, Math.max(0, x));
  const update = (t) => {
    hero.group.visible = t < 0.12; if (!hero.group.visible) return;
    const m = ease(cl(t / 0.07)), d = ease(cl((t - 0.06) / 0.05)), c = path(t);
    hero.hand.visible = m > 0.2;
    hero.at(c, [0.16 * m, -0.03 - 0.29 * m - 0.4 * d, -0.125 - 0.425 * m], 1.25 * (1 - m));
  };
  const near = (t) => (t < 0.06 ? 0.01 : 0.05);
  return { scene, cam: path, roll, update, near };
}
