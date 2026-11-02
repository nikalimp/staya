// 02 · STAYA POOL — двор коттеджа: бассейн, главная сцена с хитами и осьминогом, электро-сцена вдали, дом.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/pool_build.py, pool_bake.py.
// Здесь: загрузка GLB, материалы по группам, живая вода, люди, свечение и путь камеры.
// Путь от первого лица: выныриваем в центре бассейна, взгляд с неба вниз на осьминога → плывём к лестнице →
// пешком вдоль бассейна, «прищур» на электро-сцену → бар: нырок в коктейль на стойке → темнота.
const BASE = 'world/pool/';
const T = 0.3, SZ = -12.2, EX = 43, EZ = -4, HZ = 19;

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
    kit.laser(b, [EX - 3.6, 9.4, EZ + (i - 4.5) * 0.9], [EX - 34, 3 + (i % 3) * 3, EZ + Math.sin(a) * 30], i % 2 ? '#2fe6ff' : '#8a3dff');
  }
  /* --- бар у дома: стойка, бутылки, неон, стаканы --- */
  const BX = 12.6, BZ = 12.3, BT = T + 1.1;
  b.add(kit.G.rbox(4.2, 1.1, 1.0, 0.06), '#f4eef8', 'gloss', kit.M([BX, T + 0.55, BZ]));
  b.add(kit.G.rbox(4.5, 0.08, 1.25, 0.03), '#1a1422', 'gloss', kit.M([BX, BT + 0.04, BZ]));
  b.add(kit.G.box(4.2, 0.06, 0.06), '#ff3fb4', 'neon', kit.M([BX, T + 0.12, BZ - 0.53]));
  b.add(kit.G.box(4.4, 2.6, 0.3), '#2a1a3a', 'plastic', kit.M([BX, T + 1.3, BZ + 1.9]));
  for (const y of [1.6, 2.3]) b.add(kit.G.box(4.0, 0.05, 0.3), '#f4eef8', 'gloss', kit.M([BX, T + y, BZ + 1.65]));
  for (let i = 0; i < 18; i++) {
    const x = BX - 1.8 + (i % 9) * 0.45, y = T + (i < 9 ? 1.63 : 2.33), c = kit.pick(['#2fe6ff', '#ff3fb4', '#ffd23f', '#39ff9a', '#b45cff'], i * 7);
    b.add(kit.G.cyl(0.06, 0.07, 0.3, 10), c, 'glass', kit.M([x, y + 0.15, BZ + 1.65]));
    b.add(kit.G.cyl(0.02, 0.03, 0.1, 8), c, 'glass', kit.M([x, y + 0.35, BZ + 1.65]));
  }
  kit.text3d(b, font, 'BAR', { size: 0.55, color: '#ff3fb4', kind: 'neon', p: [BX, T + 2.75, BZ + 1.72], r: [0, Math.PI, 0], bevel: 0.01, depth: 0.04 });
  glows.push([BX, T + 3, BZ + 1.5, '#ff3fb4', 3.4, 0.6], [BX, T + 0.12, BZ - 0.6, '#ff3fb4', 2, 0.6]);
  // стаканы на стойке; один (ближний) — тот, что возьмёт герой
  const GL = [BX - 0.15, BT + 0.08, BZ - 0.32];
  [[-1.2, 0.1], [-0.7, -0.2], [0.5, -0.1], [0.9, 0.2], [1.4, -0.25], [-1.6, -0.3]].forEach(([dx, dz], i) => {
    b.add(kit.G.cyl(0.042, 0.034, 0.12, 16, true), '#dff6ff', 'glass', kit.M([BX + dx, BT + 0.14, BZ + dz]));
    b.add(kit.G.cyl(0.038, 0.034, 0.08, 14), kit.pick(['#ff3fb4', '#2fe6ff', '#ffb23f', '#2a0812'], i), 'gloss', kit.M([BX + dx, BT + 0.12, BZ + dz]));
  });
  const hero = kit.drink(); scene.add(hero.group);
  // барные стулья (Poly Haven, CC0) — по краям стойки, центр свободен для героя
  await Promise.all([-2.0, -1.3, 1.3, 2.0].map((dx, i) => kit.prop(scene, 'bar_chair_round_01', { p: [BX + dx, T, BZ - 1.05], ry: (i % 2 ? 0.3 : -0.4), s: 1.05 })));
  scene.add(b.build());

  /* --- свет для людей (запечённый двор от него не зависит) --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.6));
  const L = (c, i, p, d = 40) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ff3fb4', 260, [-4, 8, SZ + 4]); L('#2fe6ff', 260, [4, 8, SZ + 4]); L('#ffd28a', 120, [0, 4, 2], 25);
  L('#2f6bff', 320, [EX - 2, 7, EZ]); L('#8a3dff', 160, [EX - 8, 5, EZ + 4], 25); L('#ffcf7a', 100, [0, 4, HZ - 3], 20);

  /* --- свечение: подводные фонари, прожекторы, LED, окна, гирлянды --- */
  for (let x = -9; x <= 9; x += 3) glows.push([x, -0.55, -4.85, '#2fe6ff', 1.8, 1.4], [x, -0.55, 4.85, '#2fe6ff', 1.8, 1.4]);
  const PAR = { pink: '#ff3fb4', green: '#39ff6a', red: '#ff2a2a', cyan: '#2fe6ff' };
  ['pink', 'green', 'red', 'cyan', 'red', 'green', 'pink'].forEach((c, i) => glows.push([-6 + i * 2, 8.45, SZ + 2.85, PAR[c], 2, 2]));
  for (let i = 0; i < 9; i++) glows.push([-6.4 + i * 1.6, T + 4.6, SZ - 2.3, ['#ff3fb4', '#8a3dff', '#2fe6ff'][i % 3], 2.4, 0.5]);
  for (let i = 0; i < 6; i++) glows.push([EX - 3.9, 9.25, EZ - 5 + i * 2, i % 2 ? PAR.cyan : PAR.pink, 1.8, 2]);
  for (let y = 2.5; y < 8.5; y += 2) for (let z = EZ - 5; z <= EZ + 5; z += 2.5) glows.push([EX + 3.4, y, z, '#2f6bff', 3.2, 0.45]);
  glows.push([EX - 1.9, 13.3, EZ, '#2fe6ff', 6, 0.6]);
  [-11, -5.2, 5.2, 11].forEach((x, i) => glows.push([x, 2.1, HZ - 0.4, i % 2 ? '#ffcf7a' : '#ff6fd0', 4.5, 0.35]));
  for (const sx of [-1, 1]) glows.push([sx * 2.2, 3.6, HZ - 0.4, '#ffcf7a', 1.4, 1.5]);
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
    // пешком: поворот головы к электро-сцене
    { p: [13.2, EYE, -0.6], l: [EX, 4, EZ], t: 0.47 },
    { p: [13.8, EYE, 1.4], l: [EX, 4.5, EZ + 1], t: 0.57 },
    // вдоль бассейна к бару и нырок в коктейль на стойке
    { p: [14.1, EYE, 5.2], l: [12.8, 1.3, 12.3], t: 0.66 },
    { p: [13.1, EYE, 8.8], l: [GL[0], GL[1] + 0.06, GL[2]], t: 0.75 },
    { p: [12.6, EYE - 0.1, 10.6], l: [GL[0], GL[1] + 0.06, GL[2]], t: 0.83 },
    { p: [GL[0], GL[1] + 0.55, GL[2] - 0.3], l: [GL[0], GL[1], GL[2] + 0.02], t: 0.9 },
    { p: [GL[0], GL[1] + 0.22, GL[2] - 0.05], l: [GL[0], GL[1] - 0.3, GL[2] + 0.01], t: 0.95 },
    { p: [GL[0], GL[1] + 0.108, GL[2]], l: [GL[0], GL[1] - 0.5, GL[2] + 0.004], t: 1 },
  ];
  const path = kit.camPath(keys);
  // коктейль стоит на стойке, камера ныряет в него сверху
  hero.group.position.set(...GL); hero.hand.visible = false;
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
    blow(pv.STAYA, 0.1, 0.1, t); blow(pv.POOL, 0.14, 0.1, t); blow(pv.ELECTRO, 0.45, 0.1, t);
  };
  const near = (t) => (t > 0.93 ? 0.004 : t > 0.84 ? 0.01 : 0.05);
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.8) / 0.05));   // нырок в коктейль — кадр по центру
  // «прищур» на электро-сцену: камера приближает её, сверху и снизу темнеет, как веки
  const squint = (t) => { const a = Math.min(1, Math.max(0, (t - 0.45) / 0.04)), b2 = Math.min(1, Math.max(0, (0.6 - t) / 0.04)); return a * b2 * a * (3 - 2 * a); };
  return { scene, cam, update, near, calm, squint };
}
