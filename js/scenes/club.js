// 03 · STAYA 2K17 — клуб в духе 2017 года. Камера от первого лица.
// Белая вспышка дискошара под высоким потолком → боковой отлёт с дискошаром по центру кадра → облёт клуба:
// круговая сцена 360° в центре, бар, бир-понг, VIP-зона → выход под табличкой WC → лестница вниз →
// коридор с видео с вечеринок → парадная двустворчатая дверь, как во дворце.
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

  /* --- клуб: x[-16,16], z[-16,16], высокий потолок H --- */
  const WALL = '#120a1c', H = 16;
  b.add(G.box(14.2, H, 0.4), WALL, 'matte', M([-8.9, H / 2, 16])); b.add(G.box(14.2, H, 0.4), WALL, 'matte', M([8.9, H / 2, 16]));
  b.add(G.box(3.6, H - 4.4, 0.4), WALL, 'matte', M([0, 4.4 + (H - 4.4) / 2, 16]));
  b.add(G.box(3.6, 0.1, 0.1), PINK, 'neon', M([0, 4.35, 15.75]));
  b.add(G.box(0.4, H, 32), WALL, 'matte', M([-16, H / 2, 0]));
  // правая стена: проём в коридор к туалетам (z −8.8…−6.2, высота 3.2)
  const CZ = -7.5, CW = 2.6, CH = 3.2, CX = 30;
  b.add(G.box(0.4, H, 7.2), WALL, 'matte', M([16, H / 2, -12.4])); b.add(G.box(0.4, H, 22.2), WALL, 'matte', M([16, H / 2, 4.9]));
  b.add(G.box(0.4, H - CH, CW), WALL, 'matte', M([16, CH + (H - CH) / 2, CZ]));
  b.add(G.box(32, H, 0.4), WALL, 'matte', M([0, H / 2, -16]));
  b.add(G.box(32, 0.4, 32), '#07050c', 'matte', M([0, H + 0.2, 0]));
  b.add(G.box(32, 0.2, 32), '#0b0812', 'gloss', M([0, -0.1, 0]));
  for (let ix = -7; ix < 7; ix++) for (let iz = -7; iz < 6; iz++) {
    const r = R(), c = r < 0.38 ? '#1a0f2a' : r < 0.6 ? PINK : r < 0.78 ? VIO : r < 0.93 ? CY : YEL;
    b.add(G.box(1.1, 0.05, 1.1), c, r < 0.38 ? 'gloss' : 'neon', M([ix * 1.2 + 0.6, 0.03, iz * 1.2 - 0.6]));
  }
  for (const sx of [-1, 1]) for (const y of [2.5, 7.5, 12.5]) {
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
  // за дверью — тёплый свет дворца: в щели приоткрытых створок видно красное зарево (склейка с дверьми дворца)
  const hallT = kit.canvasTex(256, 320, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0806'); g.addColorStop(0.45, '#7a1a10'); g.addColorStop(1, '#3a0806'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const lg = x.createRadialGradient(w / 2, h * 0.12, 0, w / 2, h * 0.12, w * 0.4); lg.addColorStop(0, '#fff2c0'); lg.addColorStop(0.3, '#ffb15a'); lg.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = lg; x.fillRect(0, 0, w, h);
    x.fillStyle = '#c4141e'; x.beginPath(); x.moveTo(w * 0.36, h); x.lineTo(w * 0.47, h * 0.6); x.lineTo(w * 0.53, h * 0.6); x.lineTo(w * 0.64, h); x.fill();
    x.fillStyle = '#e8dccb'; x.beginPath(); x.ellipse(w / 2, h * 0.6, w * 0.14, h * 0.025, 0, 0, 7); x.fill();
  });
  const behind = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshBasicMaterial({ map: hallT, fog: false }));
  behind.position.set(X3 + 0.2, LY + CH / 2, CZ); behind.rotation.y = -Math.PI / 2; scene.add(behind);
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
  // видео с вечеринок вместо постеров на стенах нижнего коридора
  [['video/2k17-v.mp4', 30.4, -1], ['video/2k17-v2.mp4', 33.4, 1], ['video/2k17-v3.mp4', 36.4, -1]].forEach(([src, x, sz], i) =>
    kit.vScreen(scene, src, [x, LY + 0.45, CZ + sz * (CW / 2 - 0.06)], sz < 0 ? 0 : Math.PI, 2.3, { edge: [PINK, CY, PINK][i], stand: false, bezel: 0.06 }));
  for (let x = -12; x <= 12; x += 6) if (x) kit.truss(b, [x, H - 1.6, -14], [x, H - 1.6, 14], 0.45);
  for (let i = 0; i < 10; i++) {
    const x = -12 + (i % 5) * 6, z = i < 5 ? -6 : 8, c = kit.pick([PINK, CY, VIO, '#ffffff'], i);
    if (!x) continue;
    b.add(G.cyl(0.2, 0.26, 0.45, 10), '#1a1a20', 'metal', M([x, H - 2.1, z]));
    glows.push([x, H - 2.35, z, c, 2, 1.8]);
    kit.beam(b, [x, H - 2.35, z], [x * 0.6 + (i % 2 ? 2 : -2), 0, z * 0.4 - 2], 1.8, c);
  }
  /* --- круговая сцена 360° в центре танцпола: диджей лицом во все стороны --- */
  const SC = [0, 0, -1], SR = 3.6;
  b.add(G.cyl(SR, SR + 0.15, 0.9, 48), '#0e0a16', 'gloss', M([SC[0], 0.45, SC[2]]));
  b.add(G.tor(SR + 0.08, 0.05, 6, 64), PINK, 'neon', M([SC[0], 0.9, SC[2]], [Math.PI / 2, 0, 0]));
  b.add(G.tor(SR + 0.16, 0.04, 6, 64), CY, 'neon', M([SC[0], 0.12, SC[2]], [Math.PI / 2, 0, 0]));
  b.add(G.cyl(1.25, 1.25, 1.1, 40), '#120a1c', 'gloss', M([SC[0], 0.9 + 0.55, SC[2]]));
  b.add(G.tor(1.27, 0.035, 6, 48), VIO, 'neon', M([SC[0], 1.75, SC[2]], [Math.PI / 2, 0, 0]));
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + (k * Math.PI) / 2; kit.speaker(b, [SC[0] + Math.cos(a) * (SR - 0.6), 0.9, SC[2] + Math.sin(a) * (SR - 0.6)], -a + Math.PI / 2, 1.5, 0.9); }
  // круглая ферма над сценой со световыми приборами и лазерами
  b.add(G.tor(4.6, 0.12, 8, 64), '#2a2a34', 'metal', M([SC[0], 8.6, SC[2]], [Math.PI / 2, 0, 0]));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, x = SC[0] + Math.cos(a) * 4.6, z = SC[2] + Math.sin(a) * 4.6, c = kit.pick([PINK, CY, VIO, '#ffffff'], k);
    kit.rod(b, [x, 8.6, z], [x, H, z], 0.02, '#c8c8d0', 'metal', 4);
    glows.push([x, 8.3, z, c, 1.6, 1.8]);
    if (k % 2) kit.beam(b, [x, 8.3, z], [x * 2.4, 0, z * 2.4 + SC[2]], 1.4, c);
    else kit.laser(b, [x, 8.3, z], [Math.cos(a) * 30, 2 + (k % 3), SC[2] + Math.sin(a) * 30], k % 4 ? '#39ff6a' : PINK);
  }
  /* --- VIP-зона у задней стены: подиум, диваны, ограждение, неон --- */
  b.add(G.rbox(13, 0.45, 5, 0.06), '#1a0f22', 'gloss', M([0, 0.22, -13.4]));
  b.add(G.box(13, 0.05, 0.05), YEL, 'neon', M([0, 0.46, -10.9]));
  for (const x of [-4.5, 0, 4.5]) {
    b.add(G.rbox(3.2, 0.5, 1.1, 0.15), '#3a0a2a', 'plastic', M([x, 0.7, -15.1])); b.add(G.rbox(3.2, 1.0, 0.35, 0.12), '#3a0a2a', 'plastic', M([x, 1.2, -15.55]));
    b.add(G.cyl(0.55, 0.55, 0.05, 24), '#d9a441', 'metal', M([x, 0.95, -13.6])); b.add(G.cyl(0.08, 0.1, 0.5, 8), '#d9a441', 'metal', M([x, 0.7, -13.6]));
  }
  for (let x = -6; x <= 6; x += 1.5) { b.add(G.cyl(0.04, 0.05, 0.95, 8), '#d9a441', 'metal', M([x, 0.45 + 0.47, -10.9])); b.add(G.sph(0.07, 10, 8), '#d9a441', 'metal', M([x, 1.43, -10.9])); }
  for (let x = -6; x < 6; x += 1.5) b.add(G.tube([[x, 1.3, -10.9], [x + 0.75, 1.05, -10.85], [x + 1.5, 1.3, -10.9]], 0.035, 12, 6), '#8a0a1a', 'plastic');
  kit.text3d(b, font, 'VIP', { size: 1.4, color: YEL, kind: 'neon', p: [0, 4.6, -15.7], bevel: 0.02, depth: 0.08 });
  kit.text3d(b, font, 'STAYA', { size: 1.3, color: '#ff4fe0', p: [0, 11.5, -15.2] });
  glows.push([0, 4.6, -15.3, YEL, 6, 0.4]);

  /* --- диско-шар под потолком --- */
  const MR = 1.6, MC = [0, 12.8, -1];
  kit.rod(b, [MC[0], H, MC[2]], [MC[0], MC[1] + MR, MC[2]], 0.025, '#c8c8d0', 'metal', 6);
  // дискошар — отдельная зеркальная модель (не запекается): гранёный, крутится, отражает огни клуба
  // тот же зеркальный шар, в который превратилась Луна в конце POOL: склейка по форме
  const ball = kit.moonMesh(MR); ball.material.uniforms.tiles.value = 1;
  ball.position.set(...MC); ball.userData.dynamic = true; scene.add(ball);
  glows.push([MC[0], MC[1], MC[2], '#fff1d6', 2.2, 0.22]);
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

  /* --- кирпичные стены зала (живой свет клуба ложится на фактуру) --- */
  const brick = kit.canvasTex(1024, 512, (x, w2, h2) => {
    x.fillStyle = '#0d060f'; x.fillRect(0, 0, w2, h2); const BR = kit.rng(44), rows = 30, cols = 16, bh = h2 / rows, bw = w2 / cols;
    for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
      const v = BR(), off = r % 2 ? bw / 2 : 0;
      x.fillStyle = v < 0.5 ? '#3a1832' : v < 0.8 ? '#45203a' : v < 0.95 ? '#2c1228' : '#5a2a44';
      x.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
    }
  });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping;
  const brickWall = (w2, h2, p, ry) => {
    const t2 = brick.clone(); t2.needsUpdate = true; t2.repeat.set(w2 / 4, h2 / 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), new THREE.MeshStandardMaterial({ map: t2, roughness: 0.85, metalness: 0 }));
    m.position.set(...p); m.rotation.y = ry; scene.add(m);
  };
  brickWall(32, H, [-15.78, H / 2, 0], Math.PI / 2);
  brickWall(32, H, [0, H / 2, -15.78], 0);
  brickWall(7.2, H, [15.78, H / 2, -12.4], -Math.PI / 2); brickWall(22.2, H, [15.78, H / 2, 4.9], -Math.PI / 2); brickWall(CW, H - CH, [15.78, CH + (H - CH) / 2, CZ], -Math.PI / 2);
  brickWall(14.2, H, [-8.9, H / 2, 15.78], Math.PI); brickWall(14.2, H, [8.9, H / 2, 15.78], Math.PI); brickWall(3.6, H - 4.4, [0, 4.4 + (H - 4.4) / 2, 15.78], Math.PI);
  /* --- стена за баром: тёплая подсветка за полками и неон BAR --- */
  const barGlow = kit.canvasTex(1024, 512, (x, w2, h2) => {
    const g = x.createLinearGradient(0, 0, 0, h2); g.addColorStop(0, '#3a0a2a'); g.addColorStop(0.45, '#ff6a8a'); g.addColorStop(0.8, '#ffb36b'); g.addColorStop(1, '#5a1a1a'); x.fillStyle = g; x.fillRect(0, 0, w2, h2);
    x.globalAlpha = 0.35; for (let i = 0; i < 9; i++) { const gx = x.createLinearGradient(i * w2 / 8 - 40, 0, i * w2 / 8 + 40, 0); gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, '#fff3e0'); gx.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gx; x.fillRect(i * w2 / 8 - 40, 0, 80, h2); }
  });
  const bw2 = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), new THREE.MeshBasicMaterial({ map: barGlow, color: '#b8a0b0' }));
  bw2.position.set(7, 1.95, 15.74); bw2.rotation.y = Math.PI; scene.add(bw2);
  kit.text3d(b, font, 'BAR', { size: 0.75, color: '#ffe14a', kind: 'neon', p: [7, 3.6, 15.7], r: [0, Math.PI, 0], bevel: 0.01, depth: 0.05 });
  glows.push([7, 3.95, 15.4, '#ffe14a', 4, 0.35]);
  // бир-понг: неон над столом
  kit.text3d(b, font, 'BEER PONG', { size: 0.5, color: '#21e0ff', kind: 'neon', p: [-15.7, 4.4, 6.4], r: [0, Math.PI / 2, 0], bevel: 0.01, depth: 0.04 });
  glows.push([-15.4, 4.6, 6.4, '#21e0ff', 5, 0.3]);
  kit.beam(b, [-9.2, H - 2.35, 6.4], [-9.2, 0.8, 6.4], 1.6, '#ffffff');

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#6a3bd0', '#0c0614', 0.55));
  const L = (c, i, p, d = 45) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(PINK, 200, [0, 11.5, 37.5], 18); L(PINK, 120, [0, 8, 27], 18); L(VIO, 380, [0, 10, -8]); L(YEL, 260, [0, 3.2, -12.4], 11); L('#ff6fd0', 160, [-5, 3, -13], 8); L('#21e0ff', 160, [5, 3, -13], 8); L('#ffffff', 90, [2.5, 12.2, 2.5], 8); L('#ffe6f4', 160, [-9.2, 3.2, 6.4], 7); L(CY, 120, [-6, 2.5, 8], 6); L('#fff1d6', 120, [0, 11, 2], 16); L(CY, 220, [-10, 5, 0]); L(PINK, 220, [10, 5, 0]); L('#fff1d6', 40, [0, 5, 0], 10); L(PINK, 70, [18, 2.8, -7.5], 9); L('#ff2a55', 90, [24, -2, -7.5], 10); L(PINK, 90, [33, LY + 2.8, -7.5], 11);
  // свет для моделей: бар с вывеской и парадная дверь в конце коридора
  L('#ffd0a0', 260, [7, 3.0, 9.6], 10); L(PINK, 220, [7, 2.8, 14.8], 9); L('#ffb15a', 140, [X3 - 1.6, LY + 2.7, CZ], 6);
  scene.add(kit.glowPoints(glows));
  // реквизит 2017 (Poly Haven, CC0): бумбокс на сцене, кассетники и бутылки на столиках лаунжа
  await Promise.all([
    kit.prop(scene, 'boombox', { p: [-13.6, 0.5, 5.6], ry: 1.4, s: 2.2 }),
    kit.prop(scene, 'portable_cassette_player', { p: [-14.4, 0.5, 2.4], ry: 0.8, s: 2.4 }),
    kit.prop(scene, 'wine_bottles_01', { p: [-14.4, 0.5, 9.4], ry: 1.2, s: 1.6 }),
    kit.decks(scene, [SC[0], 2.0, SC[2] + 0.35], 0, 1.4), kit.decks(scene, [SC[0], 2.0, SC[2] - 0.35], Math.PI, 1.4),
    kit.prop(scene, 'wine_bottles_01', { p: [-4.5, 0.97, -13.6], ry: 0.5, s: 1.4 }), kit.prop(scene, 'wine_bottles_01', { p: [4.5, 0.97, -13.6], ry: 2.0, s: 1.4 }),
    kit.prop(scene, 'sf_indbar', { p: [BX, 0.0, BZ], w: 4.8 }).then((m) => {
      // над стойкой у модели висит полка с перилами — в кадре она выглядела как строительные леса
      m.updateMatrixWorld(true);
      m.traverse((c) => { if (c.isMesh && new THREE.Box3().setFromObject(c).min.y > 1.9) c.visible = false; });
    }),
    kit.prop(scene, 'sf_summer', { p: GL, h: 0.24, ry: 0.6 }),
    // подсвеченные полки с бутылками за баром
    ...[-1.6, -0.5, 0.6, 1.7].flatMap((dx, i) => [kit.prop(scene, 'wine_bottles_01', { p: [BX + dx, 1.66, 15.62], ry: i, s: 1.3 }), kit.prop(scene, 'wine_bottles_01', { p: [BX + dx + 0.3, 2.26, 15.62], ry: i + 2, s: 1.3 })]),
    kit.prop(scene, 'wine_bottles_01', { p: [BX + 1.3, BTOP, BZ + 0.2], ry: 0.4, s: 1.4 }),
    kit.prop(scene, 'sf_martini', { p: [BX - 1.4, BTOP, BZ - 0.6], h: 0.18 }),
    ...[-1.6, -0.5, 0.6, 1.7].map((dx, i) => kit.prop(scene, 'bar_chair_round_01', { p: [BX + dx, 0, BZ - 1.75], ry: i % 2 ? 0.3 : -0.3, s: 1.05 })),
    // бир-понг на краю танцпола (Sketchfab «Beer Pong Table», CC BY)
    kit.prop(scene, 'sf_beerpong', { p: [-9.2, 0.05, 6.4], ry: 0.25, w: 2.5 }),
  ]);
  glows.push([BX, 3.6, 15.4, '#ffe14a', 3, 0.45], [BX, 2.6, BZ, '#ff2fd0', 3.2, 0.5]);
  const built = b.build(); scene.add(built);
  // дым: лучи прожекторов становятся видимыми объёмами
  kit.haze(scene, { box: [-15, 15, 1.2, 10, -15, 14], colors: ['#ff2fd0', '#8a3dff', '#2fe6ff'], n: 36, size: 12, opacity: 0.19 });
  kit.haze(scene, { box: [-14, 14, 0.2, 1.4, -14, 13], colors: ['#d8c8ff', '#ff9ad8'], n: 16, size: 7, opacity: 0.12, seed: 21 });
  kit.haze(scene, { box: [17, 39, -5, 2.8, -8.6, -6.4], colors: ['#ff3fb4'], n: 8, size: 4, opacity: 0.14, seed: 9 });
  await kit.applyBake(scene, built, 'club', { k: 26 });   // свет запечён в Blender (scripts/blender/bake_scene.py)

  /* --- камера --- */
  const EYE = 1.62;
  const keys = [
    // белая вспышка дискошара: камера у самого шара
    { p: [MC[0], MC[1] + 0.1, MC[2] + 1.9], l: MC, t: 0 },
    // боковой отлёт, дискошар по центру кадра
    { p: [4.2, 12.0, 4.6], l: MC, t: 0.08 },
    { p: [9.6, 9.2, 7.6], l: [0, 10.4, -1], t: 0.17 },
    // облёт: бар
    { p: [10.2, 4.6, 5.0], l: [7, 1.2, 11.6], t: 0.26 },
    // круговая сцена 360°
    { p: [4.6, 3.6, 3.4], l: [0, 2.0, -1], t: 0.33 },
    // бир-понг
    { p: [-4.2, 3.2, 3.4], l: [-9.2, 0.9, 6.4], t: 0.41 },
    // VIP-зона
    { p: [-6.4, 3.2, -6.2], l: [0, 1.2, -13.6], t: 0.5 },
    { p: [1.5, 2.6, -8.6], l: [0, 1.6, -14.4], t: 0.56 },
    // к выходу под WC
    { p: [9, EYE, -7.6], l: [16, 2.4, -7.5], t: 0.63 },
    { p: [15.4, EYE, -7.5], l: [21, 0.6, -7.5], t: 0.7 },
    // лестница вниз
    { p: [19.3, EYE, -7.5], l: [26, -3.2, -7.5], t: 0.76 },
    { p: [X2 - 0.4, LY + EYE + 0.15, -7.5], l: [X3, LY + 1.5, -7.5], t: 0.83 },
    // коридор с видео: налево, направо, налево
    { p: [29.2, LY + EYE, -7.5], l: [30.4, LY + 1.6, CZ - 1.3], t: 0.875 },
    { p: [32.2, LY + EYE, -7.5], l: [33.4, LY + 1.6, CZ + 1.3], t: 0.915 },
    { p: [35.2, LY + EYE, -7.5], l: [36.4, LY + 1.6, CZ - 1.3], t: 0.955 },
    { p: [X3 - 1.1, LY + EYE, -7.5], l: [X3, LY + 1.45, -7.5], t: 1 },
  ];
  const path = kit.camPath(keys);
  const sm = (a, c, t) => { const k = Math.min(1, Math.max(0, (t - a) / (c - a))); return k * k * (3 - 2 * k); };
  // шарик бир-понга летит в стаканы и отскакивает
  const pong = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  pong.userData.dynamic = true; scene.add(pong);
  const PT = [-9.2, 0.05, 6.4], ca = Math.cos(0.25), sa = Math.sin(0.25), TOPY = 0.82;
  const update = (t) => {
    const now = performance.now() / 1000;
    door.open(0.35 * sm(0.93, 1, t)); ball.rotation.y = t * 9 + now * 0.5; ball.material.uniforms.time.value = now;
    const q = (now % 1.7) / 1.7, lx = -1.05 + q * 1.95;
    const ly = q < 0.62 ? TOPY + 0.35 + Math.sin((q / 0.62) * Math.PI) * 0.75 - (q / 0.62) * 0.3 : TOPY + 0.05 + Math.abs(Math.sin(((q - 0.62) / 0.38) * Math.PI * 2)) * 0.18 * (1 - (q - 0.62) / 0.38);
    pong.position.set(PT[0] + lx * ca, ly, PT[2] - lx * sa);
  };
  const calm = (t) => Math.min(1, Math.max(0, (0.12 - t) / 0.06));   // отлёт от дискошара — кадр по центру
  return { scene, cam: path, update, calm };
}
