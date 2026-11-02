// 02 · STAYA POOL — двор коттеджа: бассейн, главная сцена с хитами и осьминогом, электро-сцена вдали, дом.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/pool_build.py, pool_bake.py.
// Здесь: загрузка GLB, материалы по группам, живая вода, люди, свечение и путь камеры.
// Путь от первого лица: выныриваем в центре бассейна, взгляд с неба вниз на осьминога → плывём к лестнице →
// у лестницы — вертикальный экран → коридор из трёх экранов → вторая сцена с Луной → бар справа от неё: нырок в коктейль.
const BASE = 'world/pool/';
// стойка модели бара: высота столешницы (доля высоты модели) и место стакана относительно центра бара
const BAR_TOP = 0.40, BAR_GLASS = [0.48, -0.33];
const T = 0.3, SZ = -12.2, EX = 14, EZ = 44, HZ = 19;
// электро-сцена в конце коридора из экранов, лицом к бассейну; E() — точка в её исходной системе (лицом к -X) → мир
const E = (dx, y, dz) => [EX - dz, y, EZ + dx];

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
  const pv = { STAYA: pivot(letters.STAYA), POOL: pivot(letters.POOL), ELECTRO: pivot(letters.ELECTRO) };

  /* --- живая вода поверх запечённой чаши --- */
  const w = kit.water(22, 10, '#13c8f0', { tile: 4, ei: 0.55, emissive: '#0aa8e0', opacity: 0.82 });
  w.position.y = 0.12; scene.add(w);

  const b = new Builder();
  // лазеры электро-сцены веером над толпой
  for (let i = 0; i < 10; i++) {
    const a = -0.75 + i * 0.166;
    kit.laser(b, E(-3.6, 9.4, (i - 4.5) * 0.9), E(-26, 3 + (i % 3) * 3, Math.sin(a) * 22), i % 2 ? '#2fe6ff' : '#8a3dff');
  }
  /* --- бар (Sketchfab «Bar bar», CC BY) и коктейль на стойке («Malibu sunset», CC BY) --- */
  const BX = 3.2, BZ = 39.5, BH = 2.6;                     // высота модели бара вместе с полкой бутылок
  const props = [kit.prop(scene, 'sf_barbar', { p: [BX, 0.012, BZ], ry: Math.PI, h: BH })];
  const CT = 0.012 + BH * BAR_TOP, GL = [BX + BAR_GLASS[0], CT, BZ + BAR_GLASS[1]];   // стакан — на краю стойки, ближе к камере
  props.push(kit.prop(scene, 'sf_malibu', { p: GL, h: 0.22, ry: 0.4 + Math.PI }));
  glows.push([BX, T + 2.9, BZ + 0.6, '#ff3fb4', 3.4, 0.4]);
  /* --- пульты Pioneer и экраны с видео на обеих сценах --- */
  props.push(kit.decks(scene, [0, T + 2.1, SZ + 1.0], 0, 1.7), kit.decks(scene, E(-1.2, 2.3, 0), Math.PI, 1.9));
  const vidTex = kit.canvasTex(512, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a0f5c'); g.addColorStop(1, '#0b6c9c'); x.fillStyle = g; x.fillRect(0, 0, w, h); kit.gradText(x, 'STAYA POOL', w / 2, h / 2, 60, '#fff', '#7ff2ff', { glow: '#2fe6ff' }); });
  kit.videoScreen(scene, 'video/pool-h.mp4', 15.2, 6.4, [0, T + 1.0 + 3.4, SZ - 2.42], [0, 0, 0], vidTex);
  kit.videoScreen(scene, 'video/pool-h.mp4', 13.6, 7.8, E(3.72, 5.6, 0), [0, Math.PI, 0], vidTex);
  /* --- вертикальные экраны: первый — сразу у лестницы из бассейна, дальше коридор из трёх --- */
  kit.vScreen(scene, 'video/pool-v.mp4', [17.4, 0.5, -1.5], -Math.PI / 2, 5.6, { edge: '#2fe6ff' });
  kit.vScreen(scene, 'video/pool-v2.mp4', [11.0, 0.5, 6.5], Math.PI / 2, 5.6, { edge: '#ff3fb4' });
  kit.vScreen(scene, 'video/pool-v3.mp4', [17.0, 0.5, 12.5], -Math.PI / 2, 5.6, { edge: '#2fe6ff' });
  kit.vScreen(scene, 'video/pool-v4.mp4', [11.0, 0.5, 18.5], Math.PI / 2, 5.6, { edge: '#ff3fb4' });
  /* --- Луна — арт-объект STAYA — над электро-сценой --- */
  const moonArt = kit.moonMesh(4.6, kit.MOON_DIR); moonArt.position.set(...E(0.5, 16.2, 0)); scene.add(moonArt);
  scene.add(kit.halo(E(0.5, 16.2, 0), 26, '#cfd8ff', 0.35));
  /* --- пальмы (Sketchfab «Coconut Palm», CC BY) --- */
  for (const [x, z, ry, h] of [[-24, -8, 0.4, 10], [-30, 6, 2.0, 11], [-26, 15, 4.1, 10], [26, -18, 1.1, 11], [24, 12, 3.0, 10], [-20, -18, 5.0, 11], [36, 10, 2.5, 10], [70, 9, 0.9, 11], [70, -17, 3.6, 10]])
    props.push(kit.prop(scene, 'sf_palm', { p: [x, T - 0.3, z], ry, h }));
  await Promise.all(props);
  scene.add(b.build());

  /* --- свет для людей (запечённый двор от него не зависит) --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.6));
  const L = (c, i, p, d = 40) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ff3fb4', 260, [-4, 8, SZ + 4]); L('#2fe6ff', 260, [4, 8, SZ + 4]); L('#ffd28a', 120, [0, 4, 2], 25);
  L('#2f6bff', 320, E(-2, 7, 0)); L('#8a3dff', 160, E(-8, 5, 4), 25); L('#ffcf7a', 60, [BX, 3.6, BZ - 1.5], 9);

  /* --- свечение: подводные фонари, прожекторы, LED, окна, гирлянды --- */
  for (let x = -9; x <= 9; x += 3) glows.push([x, -0.55, -4.85, '#2fe6ff', 1.8, 1.4], [x, -0.55, 4.85, '#2fe6ff', 1.8, 1.4]);
  const PAR = { pink: '#ff3fb4', green: '#39ff6a', red: '#ff2a2a', cyan: '#2fe6ff' };
  ['pink', 'green', 'red', 'cyan', 'red', 'green', 'pink'].forEach((c, i) => glows.push([-6 + i * 2, 8.45, SZ + 2.85, PAR[c], 2, 2]));
  for (let i = 0; i < 6; i++) glows.push([...E(-3.9, 9.25, -5 + i * 2), i % 2 ? PAR.cyan : PAR.pink, 1.8, 2]);
  const strings = [[[-16, 7.5, HZ], [-19, 6.5, -6]], [[-6, 7.5, HZ], [-8, 9, SZ + 2.4]], [[6, 7.5, HZ], [8, 9, SZ + 2.4]], [[16, 7.5, HZ], [19, 6.5, -7]], [[-19, 6.5, -6], [-8, 9, SZ + 2.4]], [[19, 6.5, -7], [8, 9, SZ + 2.4]]];
  for (const [a, c] of strings) for (let i = 1; i < 22; i++) {
    const t = i / 22, sag = Math.sin(t * Math.PI) * 2;
    glows.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag - 0.12, a[2] + (c[2] - a[2]) * t, i % 3 ? '#ffd28a' : '#ff3fb4', 0.7, 1.5]);
  }
  scene.add(kit.glowPoints(glows));
  kit.haze(scene, { box: [-20, 20, 2, 12, -16, 8], colors: ['#8a3dff', '#ff3fb4', '#2fe6ff'], n: 18, size: 16, opacity: 0.09 });
  kit.haze(scene, { box: [32, 50, 2, 11, -11, 3], colors: ['#2f6bff', '#2fe6ff'], n: 10, size: 14, opacity: 0.12, seed: 8 });

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
    // первый вертикальный экран — прямо у лестницы
    { p: [12.6, EYE, -1.4], l: [17.4, 3.4, -1.5], t: 0.46 },
    // поворот направо: коридор из трёх экранов — взгляд вправо, влево, вправо
    { p: [13.8, EYE, 1.4], l: [13.6, 2.8, 12], t: 0.5 },
    { p: [14, EYE, 4.2], l: [11.0, 3.3, 6.5], t: 0.55 },
    { p: [14, EYE, 7.2], l: [14, 2.4, 30], t: 0.58 },
    { p: [14, EYE, 10], l: [17.0, 3.3, 12.5], t: 0.61 },
    { p: [14, EYE, 13.2], l: [14, 2.4, 36], t: 0.64 },
    { p: [14, EYE, 16.2], l: [11.0, 3.3, 18.5], t: 0.67 },
    // прямо по курсу — вторая сцена с Луной; недолго идём к ней
    { p: [14, EYE, 21.5], l: [EX, 6.5, EZ], t: 0.72 },
    { p: [13, EYE, 27.5], l: [EX, 6, EZ], t: 0.77 },
    // справа от сцены — бар: нырок в коктейль на стойке
    { p: [7.2, EYE, 33.2], l: [GL[0], GL[1] + 0.06, GL[2]], t: 0.83 },
    { p: [GL[0] + 0.3, EYE - 0.1, GL[2] - 1.6], l: [GL[0], GL[1] + 0.06, GL[2]], t: 0.87 },
    { p: [GL[0], GL[1] + 0.75, GL[2] - 0.35], l: [GL[0], GL[1] + 0.1, GL[2]], t: 0.92 },
    { p: [GL[0], GL[1] + 0.38, GL[2] - 0.06], l: [GL[0], GL[1], GL[2] + 0.01], t: 0.96 },
    { p: [GL[0], GL[1] + 0.17, GL[2]], l: [GL[0], GL[1] - 0.5, GL[2] + 0.004], t: 1 },
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
    blow(pv.STAYA, 0.1, 0.1, t); blow(pv.POOL, 0.14, 0.1, t); blow(pv.ELECTRO, 0.68, 0.08, t);
  };
  const near = (t) => (t > 0.95 ? 0.004 : t > 0.88 ? 0.01 : 0.05);
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.85) / 0.05));   // нырок в коктейль — кадр по центру
  // «прищур» на электро-сцену: камера приближает её, сверху и снизу темнеет, как веки
  return { scene, cam, update, near, calm };
}
