// 02 · STAYA POOL — двор коттеджа: бассейн, главная сцена с хитами и осьминогом, электро-сцена вдали, дом.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/pool_build.py, pool_bake.py.
// Здесь: загрузка GLB, материалы по группам, живая вода, люди, свечение и путь камеры.
// Путь от первого лица: выныриваем в центре бассейна, взгляд с неба вниз на осьминога → плывём к лестнице →
// коридор из двух диагональных экранов → арка танцпола, большие экраны по сторонам → медленно к Луне → белая вспышка.
const BASE = 'world/pool/';
const T = 0.3, SZ = -12.2, HZ = 19;
const DX = 36, DZ = -1, DS = 18;          // танцпол за коридором экранов: центр и размер
const MOON = [DX, 8.8, DZ], MR = 3.2;      // Луна — арт-объект STAYA — висит над центром танцпола

export async function build({ THREE, kit, font, renderer, mobile }) {
  const { Builder } = kit;
  const scene = new THREE.Scene();
  const NIGHT = new THREE.Color('#0d0b2a'), DEEP = new THREE.Color('#0a5f8f');
  scene.fog = new THREE.FogExp2(DEEP.clone(), 0.12);
  scene.environment = kit.env(renderer, ['#5b4dff', '#2fe6ff', '#ff3fb4', '#ffd28a', '#9fb2ff'], '#070818');
  scene.add(kit.sky(['#2a1a5e', '#120f3c', '#04061a', 0.05]));
  scene.add(kit.stars(1200, 400, 0.12, 3));
  const moon = kit.moonMesh(7, kit.MOON_DIR); moon.position.set(-60, 70, -190); scene.add(moon);
  scene.add(kit.halo([-60, 70, -190], 60, '#a9b8ff', 0.4));
  const glows = [];

  /* --- двор из Blender: GLB + запечённые текстуры --- */
  const sz = mobile ? '-m' : '';
  const tl = new THREE.TextureLoader();
  const tex = (name, srgb = true) => tl.loadAsync(BASE + name + sz + '.webp').then((t) => {
    t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t;
  });
  const [gltf, groundT, nearA, nearL, farA, farL, glossT] = await Promise.all([
    kit.loadGLB(BASE + 'pool.glb'),
    tex('ground'), tex('near_albedo'), tex('near_light'), tex('far_albedo'), tex('far_light'), tex('gloss'),
  ]);
  const LM = Math.PI * 1.6; // свет запечён как L·0.5, а базовый материал делит lightMap на π
  const lit = (map, light) => { light.channel = 0; return new THREE.MeshBasicMaterial({ map, lightMap: light, lightMapIntensity: LM }); };
  const MAT = {
    bake_ground: new THREE.MeshBasicMaterial({ map: groundT }),
    bake_near: lit(nearA, nearL),
    bake_far: lit(farA, farL),
    // глянец: запечённый цвет светится сам, поверх — живые блики от окружения
    bake_gloss: new THREE.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: glossT, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }),
  };
  const letters = {};
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name;
    if (MAT[name]) o.material = MAT[name];
    else if (name.startsWith('letters_')) { o.material = MAT.bake_gloss; o.userData.dynamic = true; letters[name.slice(8)] = o; }
    else if (name.startsWith('neon_')) {
      const c = o.material.emissive && o.material.emissive.getHex() ? o.material.emissive : o.material.color;
      o.material = new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(name === 'neon_bulb' ? 1.6 : 1.25), toneMapped: false });
    }
  });
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  // опора каждой надувной надписи — центр её основания (буквы растут от опоры)
  const pivot = (o) => {
    if (!o) return null;
    const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
    const g = new THREE.Group(); g.position.set(c.x, bb.min.y, c.z); scene.add(g); g.attach(o); return g;
  };
  const pv = { STAYA: pivot(letters.STAYA), POOL: pivot(letters.POOL) };

  /* --- живая вода поверх запечённой чаши --- */
  const w = kit.water(22, 10, '#13c8f0', { tile: 4, ei: 0.55, emissive: '#0aa8e0', opacity: 0.82 });
  w.position.y = 0.12; scene.add(w);

  const b = new Builder(), R2 = kit.rng(23);
  const props = [kit.decks(scene, [0, T + 2.1, SZ + 1.0], 0, 1.7)];
  /* --- главная сцена: горизонтальное видео --- */
  const vidTex = kit.canvasTex(512, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a0f5c'); g.addColorStop(1, '#0b6c9c'); x.fillStyle = g; x.fillRect(0, 0, w, h); kit.gradText(x, 'STAYA POOL', w / 2, h / 2, 60, '#fff', '#7ff2ff', { glow: '#2fe6ff' }); });
  kit.videoScreen(scene, 'video/pool-h.mp4', 15.2, 6.4, [0, T + 1.0 + 3.4, SZ - 2.42], [0, 0, 0], vidTex);
  /* --- коридор из двух экранов прямо от лестницы: развёрнуты к зрителю по диагонали --- */
  kit.vScreen(scene, 'video/pool-v.mp4', [18.2, T + 0.3, -5.6], -0.99, 4.6, { edge: '#2fe6ff' });
  kit.vScreen(scene, 'video/pool-v2.mp4', [18.2, T + 0.3, 2.6], -2.15, 4.6, { edge: '#ff3fb4' });
  /* --- танцпол: светодиодный пол, неоновая арка входа, ферма с прожекторами и лазерами --- */
  const floorT = kit.canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#07060e'; x.fillRect(0, 0, w, h); const n = 12, c = w / n, R = kit.rng(5);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = R(); x.fillStyle = r < 0.45 ? '#120c22' : r < 0.62 ? '#ff2fb0' : r < 0.78 ? '#7a3dff' : r < 0.92 ? '#21e0ff' : '#ffe14a'; x.fillRect(i * c + 4, j * c + 4, c - 8, c - 8); }
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(DS, DS), new THREE.MeshBasicMaterial({ map: floorT, toneMapped: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(DX, 0.04, DZ); scene.add(floor);
  for (const sz of [-1, 1]) b.add(kit.G.box(DS, 0.06, 0.06), sz < 0 ? '#2fe6ff' : '#ff3fb4', 'neon', kit.M([DX, 0.08, DZ + sz * DS / 2]));
  // арка входа — полукольцо из неона, лицом к коридору
  const AX = DX - DS / 2 - 0.6;
  b.add(kit.G.tor(5.2, 0.28, 10, 48, Math.PI), '#ff3fb4', 'neon', kit.M([AX, 0, DZ], [0, Math.PI / 2, 0]));
  b.add(kit.G.tor(5.9, 0.12, 8, 48, Math.PI), '#2fe6ff', 'neon', kit.M([AX - 0.3, 0, DZ], [0, Math.PI / 2, 0]));
  kit.text3d(b, font, 'STAYA', { size: 0.9, color: '#ffffff', kind: 'neon', p: [AX - 0.1, 6.6, DZ], r: [0, -Math.PI / 2, 0], bevel: 0.01, depth: 0.05 });
  for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI; glows.push([AX, Math.sin(a) * 5.2, DZ + Math.cos(a) * 5.2, k % 2 ? '#ff3fb4' : '#ffd28a', 1.4, 1.4]); }
  // ферма над танцполом: Луна висит на тросах в центре
  const TH = 15, FX0 = DX - 7.5, FX1 = DX + 7.5, FZ0 = DZ - 7.5, FZ1 = DZ + 7.5;
  for (const x of [FX0, FX1]) for (const z of [FZ0, FZ1]) kit.truss(b, [x, 0, z], [x, TH, z], 0.5);
  kit.truss(b, [FX0, TH, FZ0], [FX1, TH, FZ0], 0.5); kit.truss(b, [FX0, TH, FZ1], [FX1, TH, FZ1], 0.5);
  kit.truss(b, [FX0, TH, FZ0], [FX0, TH, FZ1], 0.5); kit.truss(b, [FX1, TH, FZ0], [FX1, TH, FZ1], 0.5);
  kit.truss(b, [FX0, TH, DZ], [FX1, TH, DZ], 0.4);
  for (const dz of [-0.9, 0.9]) kit.rod(b, [DX, TH, DZ + dz], [DX, MOON[1] + MR - 0.2, DZ + dz * 0.3], 0.02, '#c8c8d0', 'metal', 6);
  // Луна светится изнутри — без терминатора
  const moonArt = kit.moonMesh(MR); moonArt.position.set(...MOON); scene.add(moonArt);
  scene.add(kit.halo(MOON, 22, '#cfd8ff', 0.35));
  for (let i = 0; i < 12; i++) {
    const x = FX0 + (i % 6) * 3, z = i < 6 ? FZ0 : FZ1, c = i % 2 ? '#2fe6ff' : '#8a3dff';
    glows.push([x, TH - 0.4, z, c, 1.8, 2]);
    kit.laser(b, [x, TH - 0.4, z], [DX + (R2() - 0.5) * 30, 0.5 + R2() * 4, DZ + (z < DZ ? 1 : -1) * (8 + R2() * 10)], c);
  }
  /* --- два больших вертикальных экрана по сторонам танцпола --- */
  kit.vScreen(scene, 'video/pool-v3.mp4', [DX, 0.6, DZ - DS / 2 - 1.2], 0, 10, { edge: '#2fe6ff' });
  kit.vScreen(scene, 'video/pool-v4.mp4', [DX, 0.6, DZ + DS / 2 + 1.2], Math.PI, 10, { edge: '#ff3fb4' });
  /* --- жизнь вокруг танцпола: шезлонги, надувные круги и мячи (Sketchfab, CC BY) --- */
  for (let i = 0; i < 5; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [DX - 6 + i * 2.6, 0.02, DZ + DS / 2 + 4.2], ry: Math.PI + (i % 2 ? 0.15 : -0.15), w: 1.9 }));
  for (let i = 0; i < 4; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [DX + 3 + i * 2.6, 0.02, DZ - DS / 2 - 4.2], ry: (i % 2 ? 0.2 : -0.1), w: 1.9 }));
  [['sf_flamingo', DX - 7.5, DZ - 13.2, 0.4, 1.6], ['sf_duck', DX + 9.5, DZ + 12.6, 2.1, 1.5], ['sf_flamingo', DX + 11.2, DZ - 6, 4.2, 1.7], ['sf_duck', AX - 3.4, DZ + 7.2, 1.2, 1.5],
    ['sf_ball1', DX - 2.2, DZ + 3.4, 0, 0.8], ['sf_ball2', DX + 4.1, DZ - 4.6, 1, 0.8], ['sf_ball1', DX + 7.2, DZ + 5.6, 2, 0.8], ['sf_ball2', AX - 2.2, DZ - 6.3, 3, 0.8], ['sf_ball1', DX - 9.8, DZ + 11.5, 4, 0.8]]
    .forEach(([n, x, z, ry, w]) => props.push(kit.prop(scene, n, { p: [x, n.startsWith('sf_ball') ? 0.05 : 0.02, z], ry, w })));
  // надувные круги и мячи в бассейне
  [['sf_duck', -7.5, -2.6, 2.2, 1.5], ['sf_flamingo', 6.4, 2.8, -0.7, 1.5], ['sf_ball2', -3.2, 3.1, 0, 0.6], ['sf_ball1', 4.5, -3.2, 1, 0.6]]
    .forEach(([n, x, z, ry, w]) => props.push(kit.prop(scene, n, { p: [x, 0.0, z], ry, w })));
  /* --- пальмы (Sketchfab «Coconut Palm», CC BY) --- */
  for (const [x, z, ry, h] of [[-24, -8, 0.4, 10], [-30, 6, 2.0, 11], [-26, 15, 4.1, 10], [26, -18, 1.1, 11], [24, 12, 3.0, 10], [-20, -18, 5.0, 11], [DX + 12, DZ - 13, 2.5, 10], [DX + 12, DZ + 12, 0.9, 11], [DX - 12, DZ + 13, 3.6, 10], [DX - 12, DZ - 14, 1.6, 10.5]])
    props.push(kit.prop(scene, 'sf_palm', { p: [x, T - 0.3, z], ry, h }));
  await Promise.all(props);
  scene.add(b.build());

  /* --- свет для людей (запечённый двор от него не зависит) --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.6));
  const L = (c, i, p, d = 40) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ff3fb4', 260, [-4, 8, SZ + 4]); L('#2fe6ff', 260, [4, 8, SZ + 4]); L('#ffd28a', 120, [0, 4, 2], 25);
  L('#2f6bff', 320, [DX, 10, DZ - 6]); L('#ff3fb4', 260, [DX, 10, DZ + 6]); L('#cfd8ff', 140, [DX - 6, 9, DZ], 20);

  /* --- свечение: подводные фонари, прожекторы, LED, окна, гирлянды --- */
  for (let x = -9; x <= 9; x += 3) glows.push([x, -0.55, -4.85, '#2fe6ff', 1.8, 1.4], [x, -0.55, 4.85, '#2fe6ff', 1.8, 1.4]);
  const PAR = { pink: '#ff3fb4', green: '#39ff6a', red: '#ff2a2a', cyan: '#2fe6ff' };
  ['pink', 'green', 'red', 'cyan', 'red', 'green', 'pink'].forEach((c, i) => glows.push([-6 + i * 2, 8.45, SZ + 2.85, PAR[c], 2, 2]));
  const strings = [[[-16, 7.5, HZ], [-19, 6.5, -6]], [[-6, 7.5, HZ], [-8, 9, SZ + 2.4]], [[6, 7.5, HZ], [8, 9, SZ + 2.4]], [[16, 7.5, HZ], [19, 6.5, -7]], [[-19, 6.5, -6], [-8, 9, SZ + 2.4]], [[19, 6.5, -7], [8, 9, SZ + 2.4]]];
  for (const [a, c] of strings) for (let i = 1; i < 22; i++) {
    const t = i / 22, sag = Math.sin(t * Math.PI) * 2;
    glows.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag - 0.12, a[2] + (c[2] - a[2]) * t, i % 3 ? '#ffd28a' : '#ff3fb4', 0.7, 1.5]);
  }
  scene.add(kit.glowPoints(glows));
  kit.haze(scene, { box: [-20, 20, 2, 12, -16, 8], colors: ['#8a3dff', '#ff3fb4', '#2fe6ff'], n: 18, size: 16, opacity: 0.09 });
  kit.haze(scene, { box: [DX - 9, DX + 9, 2, 12, DZ - 9, DZ + 9], colors: ['#2f6bff', '#ff3fb4', '#2fe6ff'], n: 14, size: 14, opacity: 0.1, seed: 8 });

  /* --- камера: от первого лица --- */
  const STAGE = [0, 6.5, SZ], EYE = T + 1.62;
  const OCT = [0, 10.6, -13.4];   // центр осьминога над главной сценой
  const keys = [
    // выныриваем в центре бассейна: сначала взгляд в ночное небо, затем вниз — осьминог по центру кадра
    { p: [0, -0.9, 2.4], l: [0, 30, -1.2], t: 0 },
    { p: [0, 0.68, 2.8], l: [0, 30, -1.6], t: 0.05 },
    { p: [0, 0.74, 3.5], l: [0, 22, -9], t: 0.12 },
    { p: [0, 0.76, 4.2], l: OCT, t: 0.2 },
    { p: [0.3, 0.74, 4.0], l: OCT, t: 0.25 },
    // плывём к лестнице справа и выбираемся
    { p: [5.5, 0.58, 0.4], l: [9, 0.9, -1.6] },
    { p: [9.7, 0.75, -1.6], l: [13, 1.6, -1.6], t: 0.36 },
    { p: [11.9, EYE, -1.5], l: [18, EYE, -2], t: 0.41 },
    // прямо — коридор из двух экранов, развёрнутых по диагонали: взгляд налево, направо
    { p: [13.6, EYE, -1.5], l: [18.2, 2.9, -5.6], t: 0.45 },
    { p: [16.4, EYE, -1.4], l: [18.2, 2.9, 2.6], t: 0.5 },
    // впереди арка танцпола
    { p: [22.4, EYE, -1.2], l: [DX, 5, DZ], t: 0.56 },
    // сквозь арку: большие экраны по сторонам
    { p: [27.6, EYE, DZ], l: [DX, 6, DZ - DS / 2 - 1.2], t: 0.62 },
    { p: [29.4, 2.2, DZ], l: [DX, 6, DZ + DS / 2 + 1.2], t: 0.68 },
    // медленно поднимаемся к Луне — белая вспышка
    { p: [29.6, 4.0, DZ], l: MOON, t: 0.76 },
    { p: [31.0, 7.4, DZ], l: MOON, t: 0.9 },
    { p: [32.3, 8.6, DZ], l: MOON, t: 1 },
  ];
  const path = kit.camPath(keys);
  const cam = (t) => path(t);
  // надписи надуваются по очереди: STAYA и POOL при выныривании, ELECTRO при повороте
  const blow = (g, a, d, t) => {
    if (!g) return;
    const k = Math.min(1, Math.max(0, (t - a) / d));
    const e = k === 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); // easeOutBack
    const s = 0.05 + 0.95 * e; g.scale.set(s, s, s);
  };
  const update = (t) => {
    // синяя толща воды рассеивается, когда голова выходит на поверхность
    const u = Math.min(1, Math.max(0, (t - 0.025) / 0.03));
    scene.fog.color.copy(DEEP).lerp(NIGHT, u); scene.fog.density = 0.12 + (0.004 - 0.12) * u;
    blow(pv.STAYA, 0.1, 0.1, t); blow(pv.POOL, 0.14, 0.1, t);
  };
  // «прищур» на электро-сцену: камера приближает её, сверху и снизу темнеет, как веки
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.82) / 0.06));   // к Луне — кадр по центру
  return { scene, cam, update, calm };
}
