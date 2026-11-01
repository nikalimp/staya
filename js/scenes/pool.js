// 03 · STAYA POOL — двор коттеджа, бассейн, надувной осьминог и луна.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/pool_build.py, pool_bake.py.
// Здесь: загрузка GLB, материалы по группам, живая вода, луна с надписью и путь камеры.
const BASE = 'world/pool/';

export async function build({ THREE, kit, font, renderer, mobile }) {
  const { Builder } = kit;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#0d0b2a', 0.004);
  scene.environment = kit.env(renderer, ['#5b4dff', '#2fe6ff', '#ff3fb4', '#ffd28a', '#9fb2ff'], '#070818');
  scene.add(kit.sky(['#2a1a5e', '#120f3c', '#04061a', 0.05]));
  scene.add(kit.stars(1200, 400, 0.12, 3));
  const glows = [];

  /* --- настоящая луна: светлая сторона к двору, на тёмной — STAYA POOL --- */
  const MOON = [0, 58, 95], MR = 14;
  const moon = kit.moonMesh(MR, kit.MOON_DIR); moon.position.set(...MOON); moon.rotation.y = 0.6; scene.add(moon);
  scene.add(kit.halo(MOON, 95, '#a9b8ff', 0.6));
  scene.add(kit.halo(MOON, 40, '#fff1d0', 0.35));
  const tb = new Builder();
  kit.text3d(tb, font, 'STAYA', { size: 2.7, color: '#ff4fc0', kind: 'neon', p: [MOON[0], MOON[1] + 0.6, MOON[2] + MR + 0.6], bevel: 0.05, depth: 0.25 });
  kit.text3d(tb, font, 'POOL', { size: 2.7, color: '#2fe6ff', kind: 'neon', p: [MOON[0], MOON[1] - 3.4, MOON[2] + MR + 0.4], bevel: 0.05, depth: 0.25 });
  const tg = tb.build(); tg.traverse((o) => o.material && (o.material.fog = false)); scene.add(tg);
  for (let x = -6; x <= 6; x += 2) glows.push([MOON[0] + x, MOON[1] + 1.9, MOON[2] + MR + 1, '#ff4fc0', 3.4, 0.35], [MOON[0] + x * 0.8, MOON[1] - 2.1, MOON[2] + MR + 1, '#2fe6ff', 3.4, 0.35]);

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
  const LM = Math.PI * 2; // свет запечён как L·0.5, а базовый материал делит lightMap на π
  const lit = (map, light) => { light.channel = 0; return new THREE.MeshBasicMaterial({ map, lightMap: light, lightMapIntensity: LM }); };
  const MAT = {
    bake_ground: new THREE.MeshBasicMaterial({ map: groundT }),
    bake_near: lit(nearA, nearL),
    bake_far: lit(farA, farL),
    // глянец: запечённый цвет светится сам, поверх — живые блики от окружения
    bake_gloss: new THREE.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: glossT, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }),
  };
  const letters = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name;
    if (MAT[name]) o.material = MAT[name];
    else if (name.startsWith('letters_')) { o.material = MAT.bake_gloss; o.userData.dynamic = true; letters.push(o); }
    else if (name.startsWith('neon_')) {
      const c = o.material.emissive && o.material.emissive.getHex() ? o.material.emissive : o.material.color;
      o.material = new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(name === 'neon_bulb' ? 1.6 : 1.25), toneMapped: false });
    }
  });
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  // опора каждой надувной надписи — центр её основания (буквы растут от земли)
  const pivots = letters.map((o) => {
    const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
    const g = new THREE.Group(); g.position.set(c.x, bb.min.y, c.z); scene.add(g); g.attach(o); return g;
  });

  /* --- живая вода поверх запечённой чаши --- */
  const w = kit.water(22, 10, '#13c8f0', { tile: 4, ei: 0.55, emissive: '#0aa8e0', opacity: 0.82 });
  w.position.y = 0.12; scene.add(w);

  /* --- свечение: гирлянды, прожекторы, подводные фонари, окна --- */
  for (let x = -9; x <= 9; x += 3) glows.push([x, -0.4, -4.85, '#2fe6ff', 1.8, 1.4], [x, -0.4, 4.85, '#2fe6ff', 1.8, 1.4]);
  [[-11, '#ff6fd0'], [-5.2, '#ffcf7a'], [5.2, '#ff6fd0'], [11, '#ffcf7a']].forEach(([x, c]) => glows.push([x, 2.1, -18.4, c, 5, 0.3]));
  ['#ff3fb4', '#39ff6a', '#ff2a2a', '#2fe6ff', '#ff2a2a'].forEach((c, i) => glows.push([15.6, 6.8, -4 + i * 2, c, 1.8, 2]));
  const strings = [[[-16, 7.5, -19], [-18, 6.5, 12]], [[-6, 7.5, -19], [-4, 6.5, 15]], [[6, 7.5, -19], [-4, 6.5, 15]], [[16, 7.5, -19], [18, 6.5, 12]], [[-18, 6.5, 12], [-4, 6.5, 15]], [[-4, 6.5, 15], [18, 6.5, 12]]];
  for (const [a, c] of strings) for (let i = 1; i < 22; i++) {
    const t = i / 22, sag = Math.sin(t * Math.PI) * 2.2;
    glows.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag - 0.12, a[2] + (c[2] - a[2]) * t, i % 3 ? '#ffd28a' : '#ff3fb4', 0.75, 1.5]);
  }
  for (const sx of [-1, 1]) glows.push([sx * 2.2, 3.6, -18.5, '#ffcf7a', 1.4, 1.5]);
  scene.add(kit.glowPoints(glows));

  /* --- камера: тот же кадр на луну, что в конце клуба → облёт → спуск к бассейну → в двери --- */
  const D = MR / kit.MOON_K, hd = Math.hypot(kit.MOON_DIR[0], kit.MOON_DIR[2]) * D, dy = kit.MOON_DIR[1] * D;
  const orb = (f) => [MOON[0] + Math.sin(f) * hd, MOON[1] + dy, MOON[2] - Math.cos(f) * hd];
  const keys = [
    { p: orb(0), l: MOON, t: 0 },
    { p: orb(0.03), l: MOON, t: 0.03 },
    { p: orb(Math.PI * 0.3), l: MOON },
    { p: orb(Math.PI * 0.55), l: MOON },
    { p: orb(Math.PI * 0.8), l: MOON },
    { p: orb(Math.PI), l: [MOON[0], MOON[1] - 1.2, MOON[2]], t: 0.34 },
    { p: [0, MOON[1] + dy - 1, MOON[2] + hd - 2], l: [0, MOON[1] - 1.5, MOON[2]], t: 0.42 },
    // из-за луны открывается двор — плавный спуск
    { p: [0, 36, 116], l: [0, 22, 50] },
    { p: [0, 24, 76], l: [0, 4, 0] },
    { p: [0, 11, 38], l: [0, 2, -6] },
    { p: [0, 3.6, 14], l: [0, 1.5, -10], t: 0.74 },
    // над гладью бассейна, между надувными STAYA и POOL
    { p: [0, 1.15, 4.5], l: [0, 1.4, -12] },
    { p: [0, 1.25, -3.5], l: [0, 1.8, -19] },
    { p: [0, 2.1, -12], l: [0, 2.3, -25], t: 0.92 },
    { p: [0, 2.3, -18.6], l: [0, 2.3, -25], t: 1 },
  ];
  // буквы надуваются, пока камера спускается к бассейну; на паузе — замирают
  const update = (t) => {
    const k = Math.min(1, Math.max(0, (t - 0.6) / 0.16));
    const e = k === 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); // easeOutBack
    const s = 0.05 + 0.95 * e;
    pivots.forEach((g) => g.scale.set(s, s, s));
  };
  return { scene, cam: kit.camPath(keys), update };
}
