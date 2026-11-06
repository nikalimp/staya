import { addLoot } from '../loot.js';
// 01 · STAYA AQUA — ночной аквапарк под куполом.
// Камера скатывается по тёмной трубе горки (в ней светятся только ленты, в «окнах» видно аквапарк),
// облетает диджейский пульт, боковым пролётом дрона проходит над ним, летит по ленивой реке вокруг
// экрана-призмы и ныряет с высоты в центр бассейна.
export async function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  // днём: светлое небо за стеклянным куполом, солнце, песок вместо палубы
  scene.background = new THREE.Color('#9fd6ff');
  scene.fog = new THREE.FogExp2('#cfe8fa', 0.0028);
  scene.environment = kit.env(renderer, ['#ffffff', '#bfe6ff', '#ffe8c8', '#7fd0ff', '#ffd28a', '#ffffff'], '#bfe0ff');
  const b = new Builder(), glows = [], R = kit.rng(11);
  b.skip = kit.bakeSkip();   // запечённые виды не строятся кодом: готовая геометрия придёт из GLB (kit.applyBake)
  b.rim = ['#2fe6ff', '#ff3fb4', '#7ff2ff'];   // контровой свет силуэтов
  const PINK = '#ff2fa8', CYAN = '#2fe6ff', VIOLET = '#8a4dff', YEL = '#ffd84a';

  /* --- бассейн-лагуна со скруглёнными берегами и «ленивая река»: выходит из лагуны, огибает экраны и возвращается --- */
  const deck = '#e8d2a0', top = 0.4, FLOOR = -2.1;   // песок
  const rbox = (x, z, hx, hz, r) => { const qx = Math.abs(x) - hx + r, qz = Math.abs(z) - hz + r; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r; };
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const RIVER = new THREE.CatmullRomCurve3([[-11.5, 6.5], [-16.8, 11], [-16.8, 17.5], [-12.5, 21.5], [12.5, 21.5], [16.8, 17.5], [16.8, 11], [11.5, 6.5]].map(([x, z]) => V(x, 0, z)), false, 'centripetal');
  const RP = RIVER.getSpacedPoints(160), RW = 1.8;
  const riverD = (x, z) => { let d = 1e9; for (let i = 1; i < RP.length; i++) { const a = RP[i - 1], c = RP[i], ux = c.x - a.x, uz = c.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * ux + (z - a.z) * uz) / (ux * ux + uz * uz))); d = Math.min(d, Math.hypot(x - a.x - ux * t, z - a.z - uz * t)); } return d - RW; };
  const lagoon = (x, z) => smin(rbox(x, z, 16, 9.5, 7), Math.hypot(x + 10, z + 7) - 5.5, 3);
  const water = (x, z) => smin(lagoon(x, z), riverD(x, z), 2.4);
  const loops = kit.sdfLoops(water, -24, 24, -16, 28, 0.25);
  const outer = loops.filter((l) => l.depth % 2 === 0), isles = loops.filter((l) => l.depth % 2 === 1);
  const toShape = (pts, S = THREE.Shape) => { const sh = new S(); pts.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z))); return sh; };
  const flat = (geo, y) => { geo.rotateX(-Math.PI / 2); geo.translate(0, y, 0); return geo; };
  // палуба: плита с вырезом лагуны и реки + острова между ними
  const deckShape = toShape([[-50, -49], [50, -49], [50, 49], [-50, 49]]);
  outer.forEach((l) => deckShape.holes.push(toShape(l.pts, THREE.Path)));
  for (const sh of [deckShape, ...isles.map((l) => toShape(l.pts))]) b.add(flat(new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 4 }), top - 1), deck, 'sand', new THREE.Matrix4());
  // дно и вода: внешние контуры, острова — дырки
  const waterShapes = outer.map((l) => { const sh = toShape(l.pts); isles.forEach((il) => sh.holes.push(toShape(il.pts, THREE.Path))); return sh; });
  b.add(flat(new THREE.ShapeGeometry(waterShapes), FLOOR), '#0a7fa8', 'plastic', new THREE.Matrix4());
  // стенки чаши и белый бортик вдоль каждого берега; подводные фонари
  for (const l of loops) {
    const P = l.pts, n = P.length, wall = [], rim = [];
    for (let i = 0; i < n; i++) {
      const [ax, az] = P[i], [bx, bz] = P[(i + 1) % n];
      let nx = -(bz - az), nz = bx - ax; const ln = Math.hypot(nx, nz) || 1; nx /= ln; nz /= ln;
      if (water((ax + bx) / 2 + nx * 0.3, (az + bz) / 2 + nz * 0.3) > 0) { nx = -nx; nz = -nz; }   // нормаль — в воду
      const q = [[ax, top, az], [bx, top, bz], [bx, FLOOR, bz], [ax, FLOOR, az]];
      // порядок вершин: лицевая сторона смотрит в воду
      const fw = ((bx - ax) * nz - (bz - az) * nx) > 0;
      wall.push(...(fw ? [q[0], q[2], q[1], q[0], q[3], q[2]] : [q[0], q[1], q[2], q[0], q[2], q[3]]).flat());
      const r1 = [ax - nx * 0.45, top + 0.03, az - nz * 0.45], r2 = [bx - nx * 0.45, top + 0.03, bz - nz * 0.45], w1 = [ax + nx * 0.05, top + 0.03, az + nz * 0.05], w2 = [bx + nx * 0.05, top + 0.03, bz + nz * 0.05];
      rim.push(...(fw ? [r1, w1, w2, r1, w2, r2] : [r1, w2, w1, r1, r2, w2]).flat());
      if (i % 16 === 0) glows.push([ax + nx * 0.25, -0.6, az + nz * 0.25, i % 32 ? '#ffffff' : CYAN, 1.5, 1.2]);
    }
    for (const [arr, c, k] of [[wall, '#1aa6cf', 'plastic'], [rim, '#f5f3ff', 'gloss']]) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); b.add(g, c, k, new THREE.Matrix4());
    }
  }

  /* --- купол: рёбра и кольца --- */
  const DR = 46, DC = [0, 0, -4];
  // сплошной купол аквапарка (без звёздного неба): ночная синева с сеткой панелей
  const domeT = kit.canvasTex(1024, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2f8fe8'); g.addColorStop(0.65, '#6fbcf5'); g.addColorStop(1, '#c4e6fb'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    // облака за стеклом
    const C = kit.rng(5); for (let i = 0; i < 60; i++) { const cx = C() * w, cy = h * (0.35 + C() * 0.55), r = 20 + C() * 60; const cg = x.createRadialGradient(cx, cy, 0, cx, cy, r); cg.addColorStop(0, 'rgba(255,255,255,.75)'); cg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = cg; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3;
    for (let i = 0; i <= 32; i++) { x.beginPath(); x.moveTo((i / 32) * w, 0); x.lineTo((i / 32) * w, h); x.stroke(); }
    for (let j = 1; j < 10; j++) { x.beginPath(); x.moveTo(0, (j / 10) * h); x.lineTo(w, (j / 10) * h); x.stroke(); }
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DR + 0.6, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: domeT, side: THREE.BackSide, fog: false }));
  dome.position.set(...DC); scene.add(dome);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(DR + 0.6, DR + 0.6, 3, 64, 1, true), new THREE.MeshBasicMaterial({ color: '#d9f1ff', side: THREE.BackSide, fog: false }));
  ring.position.set(DC[0], -1.4, DC[2]); scene.add(ring);
  for (let i = 0; i < 12; i++) b.add(G.tor(DR, 0.28, 6, 72, Math.PI), '#f4f6ff', 'gloss', M(DC, [0, (i / 12) * Math.PI, 0]));
  for (const h of [10, 22, 33, 41]) {
    const r = Math.sqrt(DR * DR - h * h);
    b.add(G.tor(r, 0.32, 6, 96), '#f4f6ff', 'gloss', M([DC[0], h, DC[2]], [Math.PI / 2, 0, 0]));
    if (h === 10) for (let a = 0; a < 64; a++) { const t = (a / 64) * Math.PI * 2; glows.push([DC[0] + Math.cos(t) * (r - 0.5), h - 0.4, DC[2] + Math.sin(t) * (r - 0.5), a % 2 ? PINK : '#ffd2a1', 0.9, 1.2]); }
  }
  const TW = [-26, 0, 14];   // вышка горки
  // римские колонны по кругу
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2, x = Math.cos(a) * 32, z = DC[2] + Math.sin(a) * 32;
    if (z < -12 && Math.abs(x) < 12) continue; // за сценой не ставим
    if (Math.hypot(x - TW[0], z - TW[2]) < 9) continue; // и у вышки горки: колонна протыкала трубу
    if (x > 18) continue; // на востоке — аквазона с большими горками
    b.add(G.cyl(0.65, 0.75, 10, 18), '#efe3cc', 'gloss', M([x, top + 5, z]));
    b.add(G.box(1.9, 0.5, 1.9), '#efe3cc', 'gloss', M([x, top + 10.2, z]));
    b.add(G.box(1.9, 0.5, 1.9), '#efe3cc', 'gloss', M([x, top + 0.25, z]));
    glows.push([x, top + 10.8, z, '#ffd2a1', 2.2, 0.9]);
  }
  // кольцо-антаблемент над колоннами — дуга с разрывом у вышки горки: целое кольцо протыкало трубу горки
  { const aT = Math.atan2(TW[2] - DC[2], TW[0] - DC[0]), gap = 0.42;
    b.add(G.tor(32, 0.45, 6, 128, Math.PI * 2 - gap * 2), '#efe3cc', 'gloss', M([0, top + 10.7, DC[2]], [Math.PI / 2, 0, aT + gap])); }

  /* --- сцена --- */
  const SZ = -15.5;
  b.add(G.rbox(18, 1.6, 6.5, 0.1), '#120e1e', 'gloss', M([0, top + 0.8, SZ]));
  b.add(G.box(18, 0.08, 0.08), PINK, 'neon', M([0, top + 1.6, SZ + 3.27]));
  b.add(G.box(18, 0.06, 0.06), CYAN, 'neon', M([0, top + 0.15, SZ + 3.27]));
  const ST = top + 1.6;
  kit.djBooth(b, [0, ST, SZ + 1.2], 0, { w: 3.4, decks: false });
  const props = [kit.decks(scene, [0, ST + 1.05, SZ + 1.2], 0, 1.7)];
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
    // лучи бьют в воду у сцены, а не через весь бассейн: не засвечивают экраны напротив
    kit.beam(b, [x, TY - 0.85, zf], [x * 1.5 + (i % 2 ? 2.5 : -2.5), 0.2, -6.5 + (i % 3) * 2.5], 2.2 + (i % 2), c);
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
  // экран за пультом: видео с вечеринки (video/aqua.mp4), пока его нет — заставка
  // экран поднят и отодвинут: когда камера заходит за спины диджеев, он не закрывает полкадра
  kit.videoScreen(scene, 'video/aqua-h.mp4', 15, 7.5, [0, ST + 5.3, SZ - 3.7], [0, 0, 0], tex);
  // надувные буквы «СТАЯ» (контуры из файла бренда world/logo.svg) стоят на ферме над сценой
  // буквы — часть запечённой геометрии: свет на них посчитан в Blender
  b.add(await kit.inflatableLogo('world/logo.svg', 16, { geometryOnly: true, curve: 4, bevelSeg: 4 }), '#ff3aa6', 'gloss', M([0, TY + 0.5, zf + 0.4]));   // на передней балке фермы — не прячутся за прожекторами
  glows.push([0, TY + 1.8, SZ + 2.2, PINK, 14, 0.14]);
  // светящийся логотип по центру фасада сцены
  const facade = await kit.logoSign('world/logo.svg', 5.6, ['#ff4fb8', '#ffffff', '#7ff2ff']);
  facade.position.set(0, top + 0.8, SZ + 3.3); scene.add(facade);
  glows.push([0, top + 0.8, SZ + 3.6, PINK, 7, 0.22]);
  /* прокачка сцены: ступени, светодиодные колонны по бокам, подвесные линейные массивы, пушки CO2 */
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) b.add(G.box(2.2, 0.4, 0.5), '#1a1528', 'gloss', M([sx * 7.6, top + 0.2 + i * 0.4, SZ + 4.6 - i * 0.5]));
    b.add(G.box(1.3, 8.6, 0.5), '#0b0a12', 'gloss', M([sx * 7.6, ST + 4.3, SZ - 2.2]));
    for (let k = 0; k < 14; k++) b.add(G.box(1.1, 0.34, 0.06), [PINK, CYAN, VIOLET][k % 3], 'neon', M([sx * 7.6, ST + 0.5 + k * 0.58, SZ - 1.92]));
    for (let k = 0; k < 6; k++) b.add(G.box(1.2, 0.42, 0.9), '#16161c', 'metal', M([sx * 9.4, TY - 1.1 - k * 0.46, zf - 0.6], [0.04 * k, 0, 0]));
    for (const dx of [-2.6, 2.6]) { b.add(G.cyl(0.18, 0.22, 0.7, 10), '#d8d8e0', 'metal', M([sx * 4.5 + dx * 0.4, ST + 0.35, SZ + 2.7])); glows.push([sx * 4.5 + dx * 0.4, ST + 0.75, SZ + 2.7, '#ffffff', 0.9, 0.9]); }
  }
  for (let k = 0; k < 18; k++) b.add(G.box(0.9, 0.06, 0.06), k % 2 ? PINK : CYAN, 'neon', M([-8.1 + k * 0.95, ST + 0.02, SZ + 3.0]));

  // колонки
  for (const sx of [-1, 1]) { kit.speaker(b, [sx * 10.6, top, SZ + 1], 0, 1.7, 1.5); kit.speaker(b, [sx * 10.6, top + 1.7, SZ + 1], 0, 1.7, 1.5); }

  /* --- горки --- */
  // опоры вышки — внутри витка горки (радиус витка 6, труба 1.5), чтобы не протыкать трубу
  for (const dx of [-2.4, 2.4]) for (const dz of [-2.4, 2.4]) b.add(G.cyl(0.32, 0.32, 19, 10), '#e8e2f6', 'metal', M([TW[0] + dx, 9.5, TW[2] + dz]));
  // площадка вышки меньше витка горки: углы прежней площадки (6,6 м) протыкали трубу у самого старта
  b.add(G.rbox(5.2, 0.5, 5.2, 0.1), '#e8e2f6', 'gloss', M([TW[0], 19.9, TW[2]]));
  b.add(G.box(5.2, 0.08, 0.08), CYAN, 'neon', M([TW[0], 20.2, TW[2] + 2.6]));
  // горка камеры (прозрачная, с неоновыми кольцами)
  const S = [];
  // короткая горка: ровно один виток с вышки; виток кончается там, где его касательная уже смотрит к бассейну,
  // поэтому выход идёт по прямой без разворота (раньше конец витка смотрел от бассейна и давал петлю)
  const A1 = Math.atan2(-0.97, -0.25) + Math.PI * 2, A0 = A1 - Math.PI * 2;   // касательная (−sin a, cos a) ≈ (0.97, −0.25)
  for (let i = 0; i <= 12; i++) { const a = A0 + (i / 12) * (A1 - A0); S.push(V(TW[0] + 6 * Math.cos(a), 18 - (i / 12) * 13, TW[2] + 6 * Math.sin(a))); }
  S.push(V(-22.6, 3.9, 7.4), V(-17.6, 2.4, 6.0), V(-14.6, 1.7, 5.0), V(-12.6, 1.35, 4.4));
  const slide = new THREE.CatmullRomCurve3(S, false, 'centripetal');
  // труба непрозрачная; несколько коротких «окон» — спойлер того, что снаружи
  const TS = 260, RS = 18, tubeGeo = new THREE.TubeGeometry(slide, TS, 1.5, RS, false);
  const WIN = [[0.42, 0.48]];   // одно окно посередине; начало и конец трубы глухие (в первом окне балка колоннады казалась проткнувшей трубу)
  const isWin = (u) => WIN.some(([a, c]) => u >= a && u < c);
  const idx = tubeGeo.index.array, solid = [], clear = [];
  for (let j = 0; j < TS; j++) (isWin(j / TS) ? clear : solid).push(...idx.slice(j * RS * 6, (j + 1) * RS * 6));
  const part = (list) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', tubeGeo.attributes.position); g.setAttribute('normal', tubeGeo.attributes.normal); g.setIndex(list); return g; };
  scene.add(new THREE.Mesh(part(solid), new THREE.MeshPhysicalMaterial({ color: '#1c1238', emissive: '#12082a', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide })));
  const glassM = new THREE.Mesh(part(clear), new THREE.MeshPhysicalMaterial({ color: '#56dcff', transparent: true, opacity: 0.22, roughness: 0.06, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  glassM.renderOrder = 2; scene.add(glassM);
  // свет лент внутри трубы едет вместе с камерой
  // свет лент в трубе: одна лампа едет вместе с камерой (было две)
  const tl1 = new THREE.PointLight('#ff8ad8', 18, 8, 2), tl2 = { position: new THREE.Vector3(), intensity: 0 }; scene.add(tl1);
  for (let i = 1; i < 60; i++) {
    const u = i / 60, p = slide.getPointAt(u), tg = slide.getTangentAt(u);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), tg);
    b.add(G.tor(1.46, 0.05, 5, 36), i % 2 ? PINK : CYAN, 'neon', new THREE.Matrix4().compose(p, q, V(1, 1, 1)));
    if (!isWin(u)) glows.push([p.x, p.y + 1.3, p.z, i % 2 ? PINK : CYAN, 1.2, 0.5]);
  }
  /* --- экран-призма на острове внутри ленивой реки: три видео по трём граням; призма поворачивается к камере --- */
  const PZ = 15, PH = 8, PW = PH * 9 / 16, PB = 1.6, side = PW + 0.5, AP = side / (2 * Math.sqrt(3)), PR = side / Math.sqrt(3);
  const prism = new THREE.Group(); prism.position.set(0, top, PZ); prism.userData.dynamic = true; scene.add(prism);
  const pm = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; prism.add(m); return m; };
  pm(new THREE.CylinderGeometry(PR + 0.5, PR + 0.8, PB, 3, 1, false, Math.PI / 3), new THREE.MeshStandardMaterial({ color: '#f5f3ff', roughness: 0.25 }), PB / 2);
  pm(new THREE.CylinderGeometry(PR, PR, PH + 0.5, 3, 1, false, Math.PI / 3), new THREE.MeshStandardMaterial({ color: '#0b0a12', roughness: 0.35, metalness: 0.4 }), PB + (PH + 0.5) / 2);
  const edgeM = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 3 + k * (Math.PI * 2 / 3), e = pm(new THREE.CylinderGeometry(0.06, 0.06, PH + 0.6, 6), k === 1 ? new THREE.MeshBasicMaterial({ color: PINK, toneMapped: false }) : edgeM, PB + (PH + 0.5) / 2);
    e.position.x = Math.sin(a) * PR; e.position.z = Math.cos(a) * PR;
  }
  // один ролик на всех трёх гранях: один декодер, призма поворачивается — ролик всегда перед глазами
  ['video/aqua-v3.mp4', 'video/aqua-v3.mp4', 'video/aqua-v3.mp4'].forEach((src, i) => {
    const a = i * (Math.PI * 2 / 3), m = kit.videoScreen(scene, src, PW, PH, [Math.sin(a) * (AP + 0.02), PB + 0.25 + PH / 2, Math.cos(a) * (AP + 0.02)], [0, a, 0]);
    prism.add(m);
  });
  glows.push([0, top + PB + PH + 0.6, PZ, CYAN, 6, 0.3]);
  /* --- надувные круги: хаотично по бассейну, пара лежит на суше (Sketchfab, CC BY); у места прыжка (x≈-10.6, z≈-2) свободно --- */
  // игрушек меньше, центр бассейна свободен — туда ныряет камера
  const FL = [['sf_duck', -11.2, 5.8, 2.2, 1.7], ['sf_flamingo', -5.2, -6.2, -0.7, 1.6], ['sf_flamingo', 12.2, -6.1, 1.9, 1.7],
    ['sf_duck', 9.6, 4.6, 4.1, 1.6], ['sf_flamingo', -11.5, -6.2, 5.2, 1.6]];
  const floatsP = [kit.prop(scene, 'sf_floats', { p: [-7.5, -0.2, 4.2], ry: 1.1, w: 6.5 }), ...FL.map(([n, x, z, ry, w]) => kit.prop(scene, n, { p: [x, -0.12, z], ry, w }))];
  props.push(...floatsP);
  // на суше: фламинго у шезлонгов справа от сцены, утка на западной палубе
  props.push(kit.prop(scene, 'sf_flamingo', { p: [17.6, top, -9.6], ry: 0.6, w: 1.6 }), kit.prop(scene, 'sf_duck', { p: [-19.5, top, 7.8], ry: 2.4, w: 1.5 }));
  // шезлонги (Sketchfab «Plastic lounge chair», CC BY): справа от сцены и на западной палубе у вышки
  for (let i = 0; i < 4; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [17.5 + i * 1.6, top, -13.2], ry: 0, w: 1.9 }));
  for (let i = 0; i < 6; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [-28.5, top, -9.5 + i * 1.6], ry: Math.PI / 2, w: 1.9 }));
  // надувные мячи — на палубах и в воде
  [['sf_ball1', -24.8, top, -7], ['sf_ball2', -25.6, top, 3.4], ['sf_ball2', 7.5, -0.15, -6.5], ['sf_ball2', 20.6, top, -11],
    ['sf_ball1', 22.5, top, 9.5], ['sf_ball2', 41, top, 3.5], ['sf_ball1', 39.5, top, 9.2]]
    .forEach(([n, x, y, z], i) => props.push(kit.prop(scene, n, { p: [x, y, z], ry: i, w: 0.7 })));
  for (const [x, z, ry, h] of [[-30, -14, 0.3, 9], [-37, 4, 2.1, 8], [-13.8, 17.5, 4.0, 8.5], [24.5, -10.5, 1.2, 9], [19.5, 12, 3.3, 8], [44, -13, 0.7, 9.5], [45, 12.5, 2.6, 8.5]])
    props.push(kit.prop(scene, 'sf_palm', { p: [x, top, z], ry, h }));

  /* --- аквазона на востоке, напротив вышки: башня с тремя трубами, открытые горки, лягушатник, грибы-фонтаны --- */
  const AX = 28, AZ = 0, AH1 = 7, AH2 = 14, YEL2 = '#ffc93a';
  for (const dx of [-2.6, 2.6]) for (const dz of [-2.6, 2.6]) b.add(G.cyl(0.3, 0.3, AH2 + 2.2, 10), '#f2efff', 'metal', M([AX + dx, top + (AH2 + 2.2) / 2, AZ + dz]));
  for (const h of [AH1, AH2]) {
    b.add(G.rbox(6.4, 0.4, 6.4, 0.08), '#f5f3ff', 'gloss', M([AX, top + h, AZ]));
    b.add(G.box(6.4, 0.07, 0.07), PINK, 'neon', M([AX, top + h - 0.25, AZ - 3.22])); b.add(G.box(6.4, 0.07, 0.07), CYAN, 'neon', M([AX, top + h - 0.25, AZ + 3.22]));
    b.add(G.box(0.07, 0.07, 6.4), YEL, 'neon', M([AX - 3.22, top + h - 0.25, AZ])); b.add(G.box(0.07, 0.07, 6.4), VIOLET, 'neon', M([AX + 3.22, top + h - 0.25, AZ]));
    for (const dz of [-3.1, 3.1]) b.add(G.box(6.2, 0.06, 0.06), '#e8e2f6', 'metal', M([AX, top + h + 1.05, AZ + dz]));
  }
  // шатёр над верхней площадкой
  b.add(G.cone(5.4, 3.0, 8), PINK, 'gloss', M([AX, top + AH2 + 3.7, AZ], [0, Math.PI / 8, 0]));
  b.add(G.sph(0.5, 12, 8), YEL, 'gloss', M([AX, top + AH2 + 5.4, AZ]));
  // лестница: пролёт с палубы на нижнюю площадку и лесенка между площадками
  for (let i = 0; i < 14; i++) b.add(G.box(0.55, 0.12, 1.5), '#e8e2f6', 'metal', M([AX + 9.8 - i * 0.48, top + 0.25 + i * (AH1 / 14), AZ + 4.1]));
  for (const dz of [3.35, 4.85]) kit.truss(b, [AX + 10.2, top, AZ + dz], [AX + 3.2, top + AH1, AZ + dz], 0.14, '#e8e2f6');
  for (let i = 0; i < 12; i++) b.add(G.box(0.05, 0.05, 0.8), '#e8e2f6', 'metal', M([AX + 3.35, top + AH1 + 0.5 + i * 0.56, AZ + 1.6]));
  // неоновая вывеска на площадке — смотрит на вышку (запад)
  kit.text3d(b, font, 'SPLASH', { size: 1.25, color: '#ff4fb8', p: [AX - 3.5, top + AH2 + 0.25, AZ], r: [0, -Math.PI / 2, 0] });
  // три трубы: жёлтая спираль вокруг башни, розовая петля над палубой, бирюзовая — в лягушатник
  const helix = [];
  for (let i = 0; i <= 40; i++) { const s2 = i / 40, ang = Math.PI - s2 * 3.5 * Math.PI; helix.push([AX + 6 * Math.cos(ang), top + AH2 - 0.3 - s2 * (AH2 - 3.3), AZ + 6 * Math.sin(ang)]); }
  helix.push([AX - 4, top + 2.4, AZ - 6.2], [AX - 10, top + 1.4, AZ - 6.2], [14.4, 0.75, AZ - 6.2]);
  const tubes = [
    [helix, YEL2, 220],
    [[[AX + 2.4, top + AH2 + 1.3, AZ + 1.2], [AX + 9, top + AH2 - 0.8, AZ + 3.4], [AX + 12.5, top + 10.6, AZ + 9.2], [AX + 4, top + 7.4, AZ + 12], [AX - 6, top + 3.8, AZ + 9.2], [19.2, top + 1.4, AZ + 6.3], [14.4, 0.75, AZ + 6.3]], PINK, 160],
    [[[AX + 1, top + AH1 + 0.3, AZ - 3.6], [AX + 3, top + 6.0, AZ - 8.6], [AX + 8, top + 4.6, AZ - 12.2], [AX + 14, top + 3.0, AZ - 11.4], [AX + 15.6, top + 1.8, AZ - 7.4], [AX + 12.4, top + 0.85, AZ - 6.4]], CYAN, 120],
  ];
  for (const [pts, c, seg] of tubes) {
    const curve = new THREE.CatmullRomCurve3(pts.map((q) => V(...q)), false, 'centripetal');
    b.add(new THREE.TubeGeometry(curve, seg, 1.05, 14, false), c, 'gloss', new THREE.Matrix4());
    // светящиеся кольца по трубе — видны ночью издалека
    for (let i = 1; i < 18; i++) {
      const u = i / 18, p = curve.getPointAt(u), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), curve.getTangentAt(u));
      b.add(G.tor(1.1, 0.045, 5, 30), c === YEL2 ? PINK : '#ffffff', 'neon', new THREE.Matrix4().compose(p, q, V(1, 1, 1)));
    }
  }
  // лягушатник для бирюзовой трубы
  const SP = [AX + 12.4, AZ - 8.2];
  for (const [w2, d2, x, z] of [[8, 0.4, 0, -3.2], [8, 0.4, 0, 3.2], [0.4, 6.8, -4, 0], [0.4, 6.8, 4, 0]]) b.add(G.box(w2, 0.6, d2), '#f5f3ff', 'gloss', M([SP[0] + x, top + 0.3, SP[1] + z]));
  // открытые горки (Sketchfab, CC BY) и большая горка-башня — по краям аквазоны
  props.push(
    kit.prop(scene, 'sf_slide_tower', { p: [28.5, top, -17], ry: Math.PI + 0.3, h: 11 }),
    kit.prop(scene, 'sf_slide_orange', { p: [AX + 5, top, AZ + 17.5], ry: Math.PI, h: 5, dropFlat: true }),
    kit.prop(scene, 'sf_slide_green', { p: [AX - 4.5, top, AZ + 17.5], ry: 0, h: 4.6, dropFlat: true }),
  );
  // детская зона: грибы-фонтаны над мелкой водой
  const KZ = [AX + 12, AZ + 8.2];
  for (const [w2, d2, x, z] of [[9, 0.3, 0, -3.6], [9, 0.3, 0, 3.6], [0.3, 7.5, -4.5, 0], [0.3, 7.5, 4.5, 0]]) b.add(G.box(w2, 0.35, d2), '#f5f3ff', 'gloss', M([KZ[0] + x, top + 0.17, KZ[1] + z]));
  const MUSH = [[KZ[0] - 2, KZ[1] - 1, 3.4, 1.9, PINK], [KZ[0] + 1.8, KZ[1] + 0.6, 2.6, 1.5, CYAN], [KZ[0] - 0.4, KZ[1] + 2.2, 1.9, 1.1, YEL]];
  for (const [x, z, h, r, c] of MUSH) {
    b.add(G.cyl(0.22 * r, 0.3 * r, h, 12), '#f5f3ff', 'gloss', M([x, top + h / 2, z]));
    b.add(new THREE.SphereGeometry(r, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), c, 'gloss', M([x, top + h - 0.1, z], [0, 0, 0], [1, 0.55, 1]));
    for (let k = 0; k < 6; k++) { const a2 = (k / 6) * Math.PI * 2; glows.push([x + Math.cos(a2) * r * 0.95, top + h - 0.12, z + Math.sin(a2) * r * 0.95, '#ffffff', 0.8, 0.8]); }
  }
  // подсветка аквазоны
  glows.push([AX, top + AH2 + 5.4, AZ, YEL, 3, 1.5], [AX - 3.2, top + AH2 + 2.2, AZ - 3.2, PINK, 2, 1.2], [AX - 3.2, top + AH2 + 2.2, AZ + 3.2, CYAN, 2, 1.2]);

  /* --- свет --- */
  // днём два источника вместо восьми: небо и солнце (оба запекаются, на сайте освещают модели)
  scene.add(new THREE.HemisphereLight('#d6eeff', '#e8d0a0', 1.15));
  const sun = new THREE.DirectionalLight('#fff1d8', 3.2); sun.position.set(36, 64, 28); scene.add(sun);
  scene.add(kit.glowPoints(glows));
  await Promise.all(props);
  const built = b.build(); scene.add(built);
  await kit.applyBake(scene, built, 'aqua', { k: 2.4 });   // свет запечён в Blender (scripts/blender/bake_scene.py)
  const w = kit.water(30, 18, '#2fc6ea', { tile: 5, ei: 0.22, opacity: 0.86, emissive: '#1aa6d8' });
  w.geometry.dispose(); w.geometry = new THREE.ShapeGeometry(waterShapes); w.material.normalMap.repeat.set(0.2, 0.2);
  w.position.y = 0.1; scene.add(w);
  // по реке плывут надувные круги
  const tubesR = [PINK, YEL, CYAN, '#ff7a3a', VIOLET].map((c, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.26, 12, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0 }));
    m.rotation.x = Math.PI / 2; m.userData = { dynamic: true, ph: i / 5 }; scene.add(m); return m;
  });

  /* --- камера: горка → бассейн → сцена → нырок --- */
  const keys = [];
  for (let i = 0; i <= 14; i++) {
    const u = (i / 14) * 0.97;
    const p = slide.getPointAt(u), l = slide.getPointAt(Math.min(1, u + 0.05));
    keys.push({ p: [p.x, p.y + 0.35, p.z], l: [l.x, l.y + 0.2, l.z], t: i === 0 ? 0 : i === 14 ? 0.2 : undefined });
  }
  keys.push(
    // плавный выход из горки и низкий пролёт над бассейном к сцене (без подъёма)
    { p: [-10.4, 1.75, 3.9], l: [-4, 3, -1.5] },
    { p: [-7.6, 2.7, 2.6], l: [0, 6, -14] },
    { p: [-4, 3.6, 0.5], l: [0, 7.5, -15] },
    { p: [0.5, 4.6, -3], l: [0, 8.5, -16], t: 0.33 },
    // облёт пульта справа и заход за спины диджеев
    { p: [6.5, 4.2, -9.5], l: [0, 3.2, -15], t: 0.38 },
    { p: [7.6, 3.7, -15.6], l: [0, 3.2, -16] },
    { p: [4.6, 3.5, -17.8], l: [0, 3.3, -15] },
    { p: [1.6, 4.0, -17.7], l: [0.85, 4.2, -12], t: 0.47 },
    // дрон над пультом: один плавный боковой пролёт на запад, взгляд не меняется — вперёд и чуть вниз, на бассейн
    { p: [2.8, 4.3, -14.8], l: [1.4, 1.6, -3.5], t: 0.51 },
    { p: [-1.6, 4.45, -14.2], l: [-3.0, 1.6, -2.9], t: 0.55 },
    { p: [-6.0, 4.6, -13.4], l: [-7.4, 1.7, -2.1], t: 0.59 },
    // над западной частью бассейна — к истоку ленивой реки
    { p: [-11.2, 4.0, -5.0], l: [-9, 4.5, 8], t: 0.635 },
  );
  // пролёт над ленивой рекой вокруг экрана-призмы с плавным набором высоты; взгляд — на призму
  for (let i = 0; i <= 10; i++) {
    const u = 0.02 + (i / 10) * 0.96, q = RIVER.getPointAt(u), h = 3.2 + (i / 10) * 5.8;
    keys.push({ p: [q.x, h, q.z], l: [0, top + PB + PH * 0.5 - (i / 10) * 1.2, PZ], t: i === 0 ? 0.67 : i === 10 ? 0.88 : undefined });
  }
  keys.push(
    // набор высоты над бассейном и нырок с высоты в его центр
    { p: [8.5, 13.5, 2.5], l: [0, 1, -1], t: 0.915 },
    { p: [2.2, 16.0, 0.6], l: [0, -4, -1.2], t: 0.945 },
    { p: [0.4, 9.0, 0.1], l: [0, -6, -1.0], t: 0.975 },
    { p: [0, -1.6, -0.2], l: [0.4, -6, -2.6], t: 1 },
  );
  const path = kit.camPath(keys);
  const bub = kit.bubbles(160, 4); scene.add(bub);
  /* --- живая вода: качка игрушек, круги на воде, брызги в трубе и всплеск при прыжке --- */
  const floats = await Promise.all(floatsP);
  floats.forEach((f) => (f.userData.base = f.position.clone()));
  const ringTex = kit.canvasTex(128, 128, (x, w2) => { x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(w2 / 2, w2 / 2, w2 / 2 - 6, 0, 7); x.stroke(); });
  const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#bff3ff' });
  const rings = floats.slice(1).map((f, i) => {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat.clone()); r.rotation.x = -Math.PI / 2;
    r.position.set(f.userData.base.x, 0.13, f.userData.base.z); r.userData = { dynamic: true, ph: i * 0.37 }; scene.add(r); return r;
  });
  const jumpRings = [0, 1, 2].map((i) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat.clone()); r.rotation.x = -Math.PI / 2; r.position.set(0, 0.14, -0.1); r.visible = false; r.userData.dynamic = true; scene.add(r); return r; });
  const wn = w.material.normalMap;
  // под водой — плотная синяя дымка (нырок)
  const fogC = scene.fog.color.clone(), fogD = scene.fog.density, blue = new THREE.Color('#1a8fc0');
  const update = (t) => {
    const now = performance.now() / 1000;
    const u = Math.min(0.97, (t / 0.2) * 0.97);
    tl1.position.copy(slide.getPointAt(Math.min(1, u + 0.012))); tl2.position.copy(slide.getPointAt(Math.min(1, u + 0.03)));
    tl1.intensity = tl2.intensity = t < 0.22 ? 14 : 0;
    const k = Math.min(1, Math.max(0, (t - 0.992) / 0.008));
    scene.fog.color.copy(fogC).lerp(blue, k); scene.fog.density = fogD + k * 0.16;
    // под водой — пузыри вокруг камеры
    bub.userData.tick(path(t).p, k, now, 0.05);
    // вода и игрушки качаются
    wn.offset.set(now * 0.018, now * 0.011);
    floats.forEach((f, i) => { const bs = f.userData.base; f.position.y = bs.y + Math.sin(now * 1.4 + i * 1.7) * 0.07; f.rotation.z = Math.sin(now * 1.1 + i) * 0.05; f.rotation.x = Math.cos(now * 0.9 + i * 2) * 0.04; });
    rings.forEach((r) => { const q = (now * 0.45 + r.userData.ph) % 1; r.scale.setScalar(1.8 + q * 3.2); r.material.opacity = 0.35 * (1 - q); });
    const ks = (t - 0.992) / 0.012;
    jumpRings.forEach((r, i) => { const q = ks * 1.3 - i * 0.18; r.visible = q > 0 && q < 1; r.scale.setScalar(1 + q * 9); r.material.opacity = 0.6 * (1 - q); });
    // круги плывут по реке по кругу
    tubesR.forEach((m) => { const q = (m.userData.ph + now * 0.012) % 1, p = RIVER.getPointAt(q); m.position.set(p.x, 0.16 + Math.sin(now * 1.5 + q * 30) * 0.05, p.z); });
    // призма поворачивается к камере; пока камера летит по реке, к ней по очереди выходят три грани
    const cp = path(t).p, x3 = Math.max(0, Math.min(2.999, (t - 0.66) / 0.22 * 3)), n = Math.floor(x3), fr = x3 - n;
    const e = Math.max(0, (fr - 0.7) / 0.3), face = Math.min(2, n + e * e * (3 - 2 * e));
    prism.rotation.y = Math.atan2(cp.x - prism.position.x, cp.z - prism.position.z) - face * (Math.PI * 2 / 3) - 0.2;
  };
  // предметы для сбора: золотая пластинка у сцены, очки-сердечки на берегу реки по пути к призме
  addLoot(scene, 'vinyl', 'vinyl', [-4.2, ST + 1.0, SZ + 2.6], { r: 0.7 });
  addLoot(scene, 'glasses', 'glasses', [-13.2, top + 0.9, 18.6], { r: 0.6 });
  return { scene, cam: path, update, bloom: 0.2 };
}
