// 02 · STAYA POOL — двор коттеджа: бассейн, главная сцена с хитами и осьминогом, электро-сцена вдали, дом.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/pool_build.py, pool_bake.py.
// Здесь: загрузка GLB, материалы по группам, живая вода, люди, свечение и путь камеры.
// Путь: выныриваем в бассейне лицом к сцене → вылезаем по лестнице → поворот к электро-сцене → к дверям дома.
const BASE = 'world/pool/';
const T = 0.3, SZ = -12.2, EX = 43, EZ = -4, HZ = 19;

export async function build({ THREE, kit, renderer, mobile }) {
  const { Builder } = kit;
  const scene = new THREE.Scene();
  const NIGHT = new THREE.Color('#0d0b2a'), DEEP = new THREE.Color('#0a5f8f');
  scene.fog = new THREE.FogExp2(DEEP.clone(), 0.3);
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

  /* --- люди: толпа у главной сцены, у электро-сцены, пловцы --- */
  const b = new Builder(), R = kit.rng(11);
  const tops = ['#ff2f8f', '#2fe6ff', '#ffe14a', '#b45cff', '#ffffff', '#ff7a3a', '#39ff9a', '#111111'];
  const hairs = ['#1a1210', '#3a2216', '#e9c27a', '#0e0e12', '#ff8ad8'];
  let k = 0;
  const guest = (x, y, z, ry, o = {}) => {
    kit.figure(b, { p: [x, y, z], ry, pose: kit.pick(['up', 'wave', 'up', 'hips', 'phone', 'up'], k), swim: k % 3 !== 2, top: kit.pick(tops, k), bottom: kit.pick(['#22222a', '#5a5f7a', '#111', '#ffffff'], k), hair: kit.pick(hairs, k), longHair: k % 2 ? 2 : 0, cap: k % 5 === 1 ? '#f4f4f4' : null, glasses: k % 4 === 0, s: 0.95 + R() * 0.1, lo: true, i: k, ...o });
    k++;
  };
  for (let z = -6.2; z > -9.2; z -= 0.95) for (let x = -6.6; x <= 6.6; x += 1.05) {
    if (R() < 0.18) continue;
    guest(x + (R() - 0.5) * 0.4, T, z + (R() - 0.5) * 0.35, Math.PI + (R() - 0.5) * 0.8);
  }
  for (let x = 33.5; x < 38.4; x += 1.0) for (let z = EZ - 5.5; z <= EZ + 5.5; z += 1.0) {
    if (R() < 0.25) continue;
    guest(x + (R() - 0.5) * 0.4, 0.06, z + (R() - 0.5) * 0.4, Math.PI / 2 + (R() - 0.5) * 0.8, { swim: false });
  }
  // пловцы — в стороне от пути камеры (камера идёт от центра к лестнице справа)
  [[-6, -2], [-3, -3.6], [-8.4, 2.6], [5.5, 3.6], [7.4, -3.7], [-4.6, 3.4]].forEach(([x, z], i) => {
    guest(x, -0.85, z, Math.PI + (i % 2 ? 0.5 : -0.5), { pose: i % 3 ? 'up' : 'wave', swim: true });
    if (i % 2 === 0) kit.ring(b, [x, 0.12, z], kit.pick(['#ff5fc0', '#ffd23f', '#2fe6ff'], i), 0.5, 0.17);
  });
  // лазеры электро-сцены веером над толпой
  for (let i = 0; i < 10; i++) {
    const a = -0.75 + i * 0.166;
    kit.laser(b, [EX - 3.6, 9.4, EZ + (i - 4.5) * 0.9], [EX - 34, 3 + (i % 3) * 3, EZ + Math.sin(a) * 30], i % 2 ? '#2fe6ff' : '#8a3dff');
  }
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

  /* --- камера --- */
  const STAGE = [0, 6.5, SZ];
  const keys = [
    // под водой → выныриваем лицом к сцене
    { p: [0, -1.25, 4.4], l: [0, 1.5, -6], t: 0 },
    { p: [0, -0.5, 4.2], l: [0, 3, -8] },
    { p: [0, 0.55, 4.1], l: [0, 5.5, -12], t: 0.1 },
    { p: [0, 0.6, 4.0], l: [0, 7, -12] },
    { p: [0.4, 0.62, 3.7], l: STAGE, t: 0.24 },
    // плывём к лестнице справа и вылезаем
    { p: [5.5, 0.6, 0.2], l: [8, 3, -8] },
    { p: [9.6, 0.75, -1.6], l: [13, 1.6, -1.6], t: 0.4 },
    { p: [12.4, 1.8, -1.4], l: [20, 2, -2.5] },
    // поворот: вдалеке электро-сцена
    { p: [13.6, 1.8, -0.2], l: [EX, 4, EZ], t: 0.52 },
    { p: [14.1, 1.8, 1.8], l: [EX, 5, EZ + 1], t: 0.64 },
    // обходим бассейн к дому
    { p: [14.2, 1.8, 6.4], l: [6, 1.9, 14] },
    { p: [10.6, 1.9, 11.5], l: [0, 2.3, HZ], t: 0.8 },
    { p: [4, 2.1, 15.2], l: [0, 2.35, HZ + 2] },
    { p: [0, 2.35, 17.6], l: [0, 2.35, HZ + 6], t: 0.95 },
    { p: [0, 2.35, 18.6], l: [0, 2.35, HZ + 6], t: 1 },
  ];
  // надписи надуваются по очереди: STAYA и POOL при выныривании, ELECTRO при повороте
  const blow = (g, a, d, t) => {
    if (!g) return;
    const k = Math.min(1, Math.max(0, (t - a) / d));
    const e = k === 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); // easeOutBack
    const s = 0.05 + 0.95 * e; g.scale.set(s, s, s);
  };
  const update = (t) => {
    // синяя толща воды рассеивается, когда голова выходит на поверхность
    const u = Math.min(1, Math.max(0, (t - 0.03) / 0.06));
    scene.fog.color.copy(DEEP).lerp(NIGHT, u); scene.fog.density = 0.3 + (0.004 - 0.3) * u;
    blow(pv.STAYA, 0.08, 0.1, t); blow(pv.POOL, 0.12, 0.1, t); blow(pv.ELECTRO, 0.46, 0.1, t);
  };
  return { scene, cam: kit.camPath(keys), update };
}
