import { addLoot } from '../loot.js';
// 03 · STAYA 2K17 — бесконечный клуб без стен. Камера от первого лица.
// Белая вспышка: взгляд вверх на диско-шар, вращение продолжается из POOL → опускаемся на круглую сцену →
// вокруг сцены водит хоровод карусель: портреты артистов, выступавших на STAYA, и видео с вечеринок →
// на месте последнего портрета — мистическая красная дверь; идём к ней и проходим во дворец.

// Артисты из ролика «Артисты, которые выступали на СТАЕ». photo — путь к фото (пока нет: показывается силуэт).
export const ARTISTS = [
  'OG BUDA', 'ПЛАТИНА', 'LIL KRYSTALLL', 'YANIX', 'LOVV66', 'AARNE', 'ROCKET', 'SODA LUV', 'MAYOT', 'SCALLY MILANO',
  'UGLYSTEPHAN', 'NKEEEI', 'ARTEM SHILOVETS', 'UNIQE', 'PINQ', 'MAGNUM OPUS', 'FLESH', 'JOHN HOWEVER', 'KARINA ISTOMINA',
].map((name) => ({ name, photo: null }));
const VIDEOS = ['video/2k17-v.mp4', 'video/2k17-v2.mp4', 'video/2k17-v3.mp4'];

export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040108');
  scene.fog = new THREE.FogExp2('#0a0312', 0.03);   // пол и сетка уходят в темноту — края зала не видно
  scene.environment = kit.env(renderer, ['#ff2fd0', '#8a3dff', '#21e0ff', '#ffffff', '#ff5a8a']);
  const b = new Builder(), glows = [];
  b.skip = kit.bakeSkip();   // запечённые виды не строятся кодом: готовая геометрия придёт из GLB (kit.applyBake)
  const PINK = '#ff2fd0', VIO = '#8a3dff', CY = '#21e0ff', RED = '#ff1a2e';

  /* --- бесконечный пол: тёмный глянец и неоновая сетка до горизонта (не запекается) --- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshStandardMaterial({ color: '#07040c', roughness: 0.18, metalness: 0.3 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.01; scene.add(floor);
  for (let k = -40; k <= 40; k++) {
    const c = k % 4 === 0 ? PINK : k % 2 ? VIO : CY;
    b.add(G.box(400, 0.02, 0.05), c, 'neon', M([0, 0.01, k * 4.6]));
    b.add(G.box(0.05, 0.02, 400), c, 'neon', M([k * 4.6, 0.01, 0]));
  }
  // столбы света вдали: кольца лучей в темноту подчёркивают, что зал не кончается
  for (const [r, n, h] of [[34, 14, 40], [58, 20, 55], [90, 26, 70]]) for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r, x = Math.cos(a) * r, z = Math.sin(a) * r, c = kit.pick([PINK, CY, VIO, '#ffffff'], i + r);
    kit.beam(b, [x, h, z], [x * 1.04, 0, z * 1.04], 1.4 + r * 0.02, c);
    glows.push([x, 0.3, z, c, 3 + r * 0.05, 1]);
  }

  /* --- круглая сцена в центре: два яруса, неоновые кольца, светодиодный обод, колонны света --- */
  const SR = 5.4, SH = 0.9;
  b.add(G.cyl(SR + 1.2, SR + 1.4, 0.3, 64), '#0c0814', 'gloss', M([0, 0.15, 0]));
  b.add(G.cyl(SR, SR + 0.15, SH, 64), '#0e0a16', 'gloss', M([0, SH / 2, 0]));
  b.add(G.tor(SR + 0.08, 0.06, 6, 96), PINK, 'neon', M([0, SH, 0], [Math.PI / 2, 0, 0]));
  b.add(G.tor(SR + 0.16, 0.04, 6, 96), CY, 'neon', M([0, 0.45, 0], [Math.PI / 2, 0, 0]));
  b.add(G.tor(SR + 1.32, 0.05, 6, 96), VIO, 'neon', M([0, 0.31, 0], [Math.PI / 2, 0, 0]));
  // светодиодный обод по кромке сцены: сегменты светятся по очереди цветами STAYA
  for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; b.add(G.box(0.55, 0.32, 0.04), kit.pick([PINK, CY, VIO], k), 'neon', M([Math.cos(a) * (SR + 0.16), SH * 0.55, Math.sin(a) * (SR + 0.16)], [0, -a + Math.PI / 2, 0])); }
  // шесть подвесных колонн света над кромкой сцены и круглая ферма над ней
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6, x = Math.cos(a) * (SR - 0.5), z = Math.sin(a) * (SR - 0.5), c = kit.pick([PINK, CY, VIO], k);
    // колонны висят от фермы и не доходят до уровня глаз: не закрывают карусель, когда камера стоит в центре
    b.add(G.cyl(0.16, 0.16, 3.6, 10), '#16121e', 'metal', M([x, SH + 5.5, z]));
    for (let j = 0; j < 5; j++) b.add(G.cyl(0.19, 0.19, 0.42, 10), c, 'neon', M([x, SH + 3.9 + j * 0.7, z]));
    glows.push([x, SH + 7.4, z, c, 2.2, 1.6]);
  }
  b.add(G.tor(5.2, 0.14, 8, 72), '#2a2a34', 'metal', M([0, SH + 7.3, 0], [Math.PI / 2, 0, 0]));
  b.add(G.tor(5.2, 0.05, 6, 72), PINK, 'neon', M([0, SH + 7.05, 0], [Math.PI / 2, 0, 0]));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, x = Math.cos(a) * 5.2, z = Math.sin(a) * 5.2, c = kit.pick([PINK, CY, VIO, '#ffffff'], k);
    b.add(G.cyl(0.2, 0.26, 0.45, 10), '#1a1a20', 'metal', M([x, SH + 6.85, z]));
    glows.push([x, SH + 6.6, z, c, 1.6, 1.8]);
    if (k % 2) kit.beam(b, [x, SH + 6.6, z], [x * 3.2, 0, z * 3.2], 1.6, c);
    else kit.laser(b, [x, SH + 6.6, z], [Math.cos(a) * 60, 1 + (k % 3), Math.sin(a) * 60], k % 4 ? '#39ff6a' : PINK);
  }
  // пульт отодвинут от центра к задней кромке сцены: камера опускается в центр, а не в пульт
  const DJZ = -2.6;
  kit.djBooth(b, [0, SH, DJZ], Math.PI, { w: 3.6 });
  for (const sx of [-1, 1]) kit.speaker(b, [sx * 3.2, SH, DJZ - 0.6], Math.PI, 1.6, 1.0);
  // далеко в темноте парят неоновые надписи
  kit.text3d(b, font, 'STAYA', { size: 3.2, color: '#ff4fe0', kind: 'neon', p: [0, 9, -46], bevel: 0.02, depth: 0.1 });
  kit.text3d(b, font, '2K17', { size: 2.6, color: '#b45cff', kind: 'neon', p: [-40, 6, -10], r: [0, Math.PI / 2, 0], bevel: 0.02, depth: 0.1 });
  glows.push([0, 10.5, -45.5, PINK, 30, 0.12], [-39.5, 7.3, -10, VIO, 24, 0.12]);

  /* --- диско-шар над сценой (тот же шар, в который превратилась Луна в конце POOL) --- */
  const MR = 1.6, MC = [0, 12.8, 0];
  kit.rod(b, [0, 40, 0], [0, MC[1] + MR, 0], 0.025, '#c8c8d0', 'metal', 6);
  const ball = kit.moonMesh(MR); ball.material.uniforms.tiles.value = 1;
  ball.position.set(...MC); ball.userData.dynamic = true; scene.add(ball);
  glows.push([MC[0], MC[1], MC[2], '#fff1d6', 2.2, 0.22]);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = Math.cos(i * 1.7) * 0.9; glows.push([Math.cos(a) * MR * 0.95, MC[1] + y, Math.sin(a) * MR * 0.95, '#ffffff', 0.5, 2]); }

  /* --- хоровод: карусель портретов артистов и видео вокруг сцены; в конце на месте портрета — дверь --- */
  const RR = 11.5, CH = 3.2, CW = CH * 0.7;
  const items = [];   // порядок по кругу: артисты, после каждого 6-го — видео
  let vi = 0;
  ARTISTS.forEach((a, i) => { items.push({ a }); if (i % 6 === 5 && vi < VIDEOS.length) items.push({ v: VIDEOS[vi++] }); });
  while (vi < VIDEOS.length) items.push({ v: VIDEOS[vi++] });
  const NSLOT = items.length + 1, STEP = (Math.PI * 2) / NSLOT;   // +1 — пустое место, за которым стоит дверь
  const ring = new THREE.Group(); ring.userData.dynamic = true; scene.add(ring);
  const silhouette = (name) => kit.canvasTex(512, 732, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0a3e'); g.addColorStop(0.6, '#12061e'); g.addColorStop(1, '#05020a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const lg = x.createRadialGradient(w / 2, h * 0.36, 10, w / 2, h * 0.36, w * 0.62); lg.addColorStop(0, 'rgba(255,47,208,.55)'); lg.addColorStop(1, 'rgba(255,47,208,0)'); x.fillStyle = lg; x.fillRect(0, 0, w, h);
    // силуэт: голова и плечи (позже здесь будет фото артиста)
    x.fillStyle = '#05020a'; x.beginPath(); x.ellipse(w / 2, h * 0.33, w * 0.15, w * 0.18, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(w * 0.12, h * 0.78); x.bezierCurveTo(w * 0.14, h * 0.52, w * 0.3, h * 0.5, w / 2, h * 0.5); x.bezierCurveTo(w * 0.7, h * 0.5, w * 0.86, h * 0.52, w * 0.88, h * 0.78); x.closePath(); x.fill();
    x.fillStyle = '#05020a'; x.fillRect(0, h * 0.78, w, h * 0.22);
    // имя
    x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = 64; x.font = `900 ${fs}px ${kit.FONT}`;
    while (x.measureText(name).width > w * 0.86 && fs > 30) { fs -= 2; x.font = `900 ${fs}px ${kit.FONT}`; }
    x.shadowColor = '#ff2fd0'; x.shadowBlur = 24; x.fillStyle = '#ffffff'; x.fillText(name, w / 2, h * 0.88);
    x.shadowBlur = 0; x.strokeStyle = '#ff2fd0'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
  });
  const frameM = new THREE.MeshBasicMaterial({ color: '#0b0710' });
  const slotAngle = (i) => -(NSLOT - 1 - i) * STEP;   // дверь — в слоте 0 по направлению +Z; карточки идут перед ней по кругу
  items.forEach((it, i) => {
    const a = slotAngle(i), x = Math.sin(a) * RR, z = Math.cos(a) * RR, ry = a + Math.PI;   // карточка смотрит в центр
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; ring.add(g);
    if (it.a) {
      const card = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshBasicMaterial({ map: silhouette(it.a.name), toneMapped: false }));
      card.position.y = 1.0 + CH / 2; g.add(card);
      if (it.a.photo) new THREE.TextureLoader().loadAsync(it.a.photo).then((t) => { t.colorSpace = THREE.SRGBColorSpace; card.material.map = t; card.material.needsUpdate = true; }).catch(() => {});
      const back = new THREE.Mesh(new THREE.BoxGeometry(CW + 0.14, CH + 0.14, 0.08), frameM); back.position.set(0, 1.0 + CH / 2, -0.06); g.add(back);
    } else {
      const vh = CH + 0.4, vw = vh * 9 / 16, m = kit.videoScreen(scene, it.v, vw, vh, [0, 0.8 + vh / 2, 0]); g.add(m);
      const back = new THREE.Mesh(new THREE.BoxGeometry(vw + 0.16, vh + 0.16, 0.08), new THREE.MeshBasicMaterial({ color: CY, toneMapped: false })); back.position.set(0, 0.8 + vh / 2, -0.06); g.add(back);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), frameM); pole.position.set(0, 0.5, -0.1); g.add(pole);
  });

  /* --- мистическая красная дверь: стоит за кольцом карусели в направлении +Z, в красном тумане --- */
  const DZ = RR + 1.6;
  const door = kit.grandDoor(scene, b, [0, 0, DZ], Math.PI, 0.38, { color: '#5a0710', panel: '#8a0d18', gold: '#d8a44a' });
  // за створками — тёплый свет дворца (склейка с дверями дворца)
  const hallT = kit.canvasTex(256, 320, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0806'); g.addColorStop(0.45, '#7a1a10'); g.addColorStop(1, '#3a0806'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const lg = x.createRadialGradient(w / 2, h * 0.12, 0, w / 2, h * 0.12, w * 0.4); lg.addColorStop(0, '#fff2c0'); lg.addColorStop(0.3, '#ffb15a'); lg.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = lg; x.fillRect(0, 0, w, h);
    x.fillStyle = '#c4141e'; x.beginPath(); x.moveTo(w * 0.36, h); x.lineTo(w * 0.47, h * 0.6); x.lineTo(w * 0.53, h * 0.6); x.lineTo(w * 0.64, h); x.fill();
    x.fillStyle = '#e8dccb'; x.beginPath(); x.ellipse(w / 2, h * 0.6, w * 0.14, h * 0.025, 0, 0, 7); x.fill();
  });
  const behind = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), new THREE.MeshBasicMaterial({ map: hallT, fog: false }));
  behind.position.set(0, 1.6, DZ + 0.2); behind.rotation.y = Math.PI; scene.add(behind);
  // стена-портал вокруг двери (иначе за створками видна пустота клуба) и красное сияние
  b.add(G.box(6, 4.6, 0.3), '#120206', 'matte', M([0, 2.3, DZ + 0.45]));
  b.add(G.box(0.06, 0.04, 2.4), RED, 'neon', M([0, 0.02, DZ - 0.12]));
  for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI; glows.push([Math.cos(a) * 1.7, 1.75 + Math.sin(a) * 1.9, DZ - 0.2, RED, 1.6, 1.1]); }
  glows.push([0, 1.7, DZ - 0.4, RED, 9, 0.3]);
  const redFog = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 0.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  redFog.position.set(0, 0.3, DZ - 0.8); redFog.userData.dynamic = true; scene.add(redFog);

  /* --- 2017: бир-понг за каруселью --- */
  const PT = [-15.5, 0.05, 6.4];

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#6a3bd0', '#0c0614', 0.55));
  const lights = [], L = (c, i, p, d = 45, keep = false) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); l.userData.keep = keep; scene.add(l); lights.push(l); };
  L(VIO, 380, [0, 10, -8], 45, true); L(CY, 220, [-10, 5, 0], 45, true); L(PINK, 220, [10, 5, 0], 45, true);
  L('#fff1d6', 120, [0, 9, 0], 16); L(PINK, 90, [0, 3, -6], 10); L(CY, 90, [0, 3, 6], 10);
  L(RED, 160, [0, 2.6, DZ - 2], 9, true);
  scene.add(kit.glowPoints(glows));
  await Promise.all([
    kit.decks(scene, [0, SH + 1.05, DJZ], Math.PI, 1.5),
    kit.prop(scene, 'sf_beerpong', { p: PT, ry: 0.25, w: 2.5 }),
    kit.prop(scene, 'boombox', { p: [-14.2, 0.0, 9.4], ry: 1.4, s: 2.2 }),
  ]);
  const built = b.build(); scene.add(built);
  await kit.applyBake(scene, built, 'club', { k: 26 });
  if (!globalThis.__noBake) lights.filter((l) => !l.userData.keep).forEach((l) => scene.remove(l));

  /* --- камера --- */
  const EYE = 1.62, SY = SH + EYE;
  const sm = (a, c, t) => { const k = Math.min(1, Math.max(0, (t - a) / (c - a))); return k * k * (3 - 2 * k); };
  // направление взгляда задаётся углом γ: взгляд (sin γ, cos γ) по XZ
  // 0…D0: вращение продолжается из POOL (та же скорость) и гаснет, камера опускается с диско-шара на сцену;
  // D0…D1: хоровод — карусель плывёт навстречу, камера медленно поворачивается; к D1 перед ней пустое место и дверь за ним;
  // D1…1: шаг со сцены к двери, створки открываются.
  const D0 = 0.24, D1 = 0.82;
  const W0 = ((2 * Math.PI) / 0.2) / 1.8 * 1.6, TOT = W0 * D0 / 2;
  const REL0 = slotAngle(0) - STEP * 0.6;                   // в начале хоровода в кадре первый портрет
  const ringYaw = (t) => -0.45 * (1 - sm(D0, D1, t)) * (0 - REL0);   // карусель плывёт навстречу взгляду и к D1 встаёт
  const rel = (t) => REL0 * (1 - sm(D0, D1, t));             // угол слота по центру кадра в системе карусели
  const gRing = (t) => rel(t) + ringYaw(t);
  const G0 = gRing(D0) - TOT;
  const out = { p: new THREE.Vector3(), l: new THREE.Vector3() };
  const DOORP = [0, EYE, DZ - 1.1];
  const walk = kit.camPath([
    { p: [0, SY, 0.2], l: [0, SY - 0.1, 10], t: D1 },
    { p: [0, SY, SR - 0.9], l: [0, 1.7, DZ], t: 0.87 },
    { p: [0, EYE + 0.05, SR + 2.6], l: [0, 1.55, DZ], t: 0.93 },
    { p: DOORP, l: [0, 1.45, DZ], t: 1 },
  ]);
  const cam = (t) => {
    if (t >= D1) return walk(t);
    let g, pitch, y;
    if (t < D0) {
      const u = t / D0; g = G0 + TOT * (2 * u - u * u);
      pitch = 1.47 - 1.57 * sm(0, 0.16, t); y = 9.2 + (SY - 9.2) * sm(0.02, 0.18, t);
    } else { g = gRing(t); pitch = -0.1 + 0.08 * sm(D0, D0 + 0.05, t); y = SY; }
    out.p.set(0, y, 0.2 * sm(D1 - 0.06, D1, t));
    out.l.set(Math.sin(g) * Math.cos(pitch), Math.sin(pitch), Math.cos(g) * Math.cos(pitch)).multiplyScalar(10).add(out.p);
    return out;
  };
  // шарик бир-понга летит в стаканы и отскакивает
  const pong = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  pong.userData.dynamic = true; scene.add(pong);
  const ca = Math.cos(0.25), sa = Math.sin(0.25), TOPY = 0.82;
  const update = (t) => {
    const now = performance.now() / 1000;
    ring.rotation.y = ringYaw(t);
    door.open(0.35 * sm(0.93, 1, t)); ball.rotation.y = t * 9 + now * 0.5; ball.material.uniforms.time.value = now;
    redFog.material.opacity = 0.14 + 0.06 * Math.sin(now * 1.3);
    const q = (now % 1.7) / 1.7, lx = -1.05 + q * 1.95;
    const ly = q < 0.62 ? TOPY + 0.35 + Math.sin((q / 0.62) * Math.PI) * 0.75 - (q / 0.62) * 0.3 : TOPY + 0.05 + Math.abs(Math.sin(((q - 0.62) / 0.38) * Math.PI * 2)) * 0.18 * (1 - (q - 0.62) / 0.38);
    pong.position.set(PT[0] + lx * ca, ly, PT[2] - lx * sa);
  };
  const calm = (t) => Math.min(1, Math.max(0, (D0 + 0.04 - t) / 0.06));   // вращение со сцены — без влияния головы и курсора
  // предметы для сбора: кассета на пульте, золотой микрофон перед дверью
  addLoot(scene, 'cassette', 'cassette', [1.4, SH + 1.35, DJZ + 0.1], { r: 0.6, ry: -0.6 });
  addLoot(scene, 'mic', 'mic', [0.9, 1.35, DZ - 2.4], { r: 0.55 });
  return { scene, cam, update, calm };
}
