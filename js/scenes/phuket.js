// 05 · STAYA PHUKET — вилла на утёсе над морем, рассвет. Финал маршрута.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/villa_build.py, villa_bake.py.
// Путь: подъезд к вилле → сквозь вход и гостиную → терраса с инфинити-бассейном →
// VIP-беседка с командой → за край утёса, лицом к восходу.
const BASE = 'world/villa/';
const GX = 15, GZ = -11, GY = 0.5; // VIP-беседка: центр и высота настила

import { person as human, guest as castGuest, RESIDENTS } from '../people.js';
export async function build({ THREE, kit, renderer, mobile }) {
  const { Builder } = kit;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#e9a27a', 0.0016);
  scene.environment = kit.env(renderer, ['#ffb070', '#ff8a5a', '#8fa6d8', '#ffe2b8', '#3a4a6a'], '#4a3a4a');
  scene.add(kit.sky(['#ffb27a', '#f4a07a', '#5f78b8', 0.03], 1400));
  const glows = [];

  /* --- солнце над горизонтом и море --- */
  const SD = new THREE.Vector3(0.3, 0.07, -1).normalize();
  const SUN = SD.clone().multiplyScalar(1100).toArray();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(26, 32, 16), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false, fog: false }));
  sun.position.set(...SUN); scene.add(sun);
  scene.add(kit.halo(SUN, 900, '#ff9a5a', 0.75)); scene.add(kit.halo(SUN, 260, '#ffe2a8', 0.9));
  const SEA = -30;
  const sea = kit.water(3600, 3600, '#2a5a7a', { tile: 30, ei: 0.12, emissive: '#c07a5a', rough: 0.1, metal: 0.4, ns: 0.35 });
  sea.position.y = SEA; scene.add(sea);
  // солнечная дорожка на воде
  const path = kit.canvasTex(64, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,226,170,.95)'); g.addColorStop(1, 'rgba(255,140,90,0)'); x.fillStyle = g;
    for (let y = 0; y < h; y += 5) { const ww = w * (0.25 + 0.75 * (1 - y / h)) * (0.55 + Math.random() * 0.45); x.fillRect((w - ww) / 2, y, ww, 2.5); }
  });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(90, 1000), new THREE.MeshBasicMaterial({ map: path, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  pm.rotation.x = -Math.PI / 2; pm.rotation.z = -Math.atan2(SD.x, -SD.z);
  pm.position.set(SD.x * 560, SEA + 0.05, SD.z * 560); scene.add(pm);

  /* --- вилла из Blender: GLB + запечённые текстуры --- */
  const sz = mobile ? '-m' : '';
  const tl = new THREE.TextureLoader();
  const tex = (name) => tl.loadAsync(BASE + name + sz + '.webp').then((t) => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; });
  const [gltf, groundT, nearA, nearL, innerA, innerL, farA, farL, glossT] = await Promise.all([
    kit.loadGLB(BASE + 'villa.glb'),
    tex('ground'), tex('near_albedo'), tex('near_light'), tex('inner_albedo'), tex('inner_light'), tex('far_albedo'), tex('far_light'), tex('gloss'),
  ]);
  const LM = Math.PI * 1.6;
  const lit = (map, light) => { light.channel = 0; return new THREE.MeshBasicMaterial({ map, lightMap: light, lightMapIntensity: LM }); };
  const MAT = {
    bake_ground: new THREE.MeshBasicMaterial({ map: groundT }),
    bake_near: lit(nearA, nearL), bake_inner: lit(innerA, innerL), bake_far: lit(farA, farL),
    bake_gloss: new THREE.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: glossT, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9 }),
    glass_clear: new THREE.MeshPhysicalMaterial({ color: '#c8d4d8', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, envMapIntensity: 1.4, depthWrite: false }),
  };
  const letters = {};
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name;
    if (MAT[name]) o.material = MAT[name];
    else if (name.startsWith('letters_')) { o.material = MAT.bake_gloss; o.userData.dynamic = true; letters[name.slice(8)] = o; }
    else if (name.startsWith('neon_')) {
      const c = o.material.emissive && o.material.emissive.getHex() ? o.material.emissive : o.material.color;
      o.material = new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.3), toneMapped: false });
    }
  });
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  let pv = null;
  if (letters.STAYA) {
    const o = letters.STAYA, bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
    pv = new THREE.Group(); pv.position.set(c.x, bb.min.y, c.z); scene.add(pv); pv.attach(o);
  }

  /* --- живая вода: бассейн, джакузи, канал у входа --- */
  const pool = kit.water(18, 11, '#2aa6b0', { tile: 4, ei: 0.35, emissive: '#1a8a9a', opacity: 0.86 });
  pool.position.set(0, -0.1, -12); scene.add(pool);
  const jac = kit.water(3.5, 3.5, '#3fd6e8', { tile: 2, ei: 0.6, opacity: 0.85 });
  jac.geometry.dispose(); jac.geometry = new THREE.CircleGeometry(1.75, 40); jac.position.set(-14.5, 0.45, -9); scene.add(jac);
  const canal = kit.water(1.6, 22, '#3a3a40', { tile: 2, ei: 0.15, emissive: '#ffb070', rough: 0.03, metal: 0.6 });
  canal.position.set(4.6, 0.16, 27); scene.add(canal);

  /* --- люди: команда в VIP-беседке и гости у бассейна --- */
  const b = new Builder(), R = kit.rng(5);
  // команда STAYA: двое за диджейской стойкой играют для толпы у бассейна
  human(b, RESIDENTS.gulidic, { p: [GX - 1.7, GY, GZ - 0.6], ry: -Math.PI / 2, pose: 'dj' });
  human(b, RESIDENTS.klen, { p: [GX - 1.7, GY, GZ + 0.6], ry: -Math.PI / 2, pose: 'up' });
  // один отдыхает на шезлонге
  human(b, RESIDENTS.sixphrases, { p: [GX + 2.15, GY + 0.36, GZ - 2.0], ry: -Math.PI / 2, pose: 'behindHead', legs: 'feetUp' });
  // двое считают деньги у кейсов
  human(b, RESIDENTS.dierouzze, { p: [GX + 0.2, GY, GZ + 1.35], ry: Math.PI / 2, pose: 'count' });
  human(b, RESIDENTS.pronto, { p: [GX + 0.2, GY, GZ + 2.25], ry: Math.PI / 2, pose: 'count' });
  // гости: толпа у беседки лицом к диджеям, на террасе и в бассейне
  let k = 0;
  const guest = (x, y, z, ry, o = {}) => {
    human(b, castGuest(k), { p: [x, y, z], ry, pose: kit.pick(['up', 'wave', 'up', 'hips', 'phone', 'peace'], k), s: 0.95 + R() * 0.1, lo: true, barefoot: y < 0, ...o });
    k++;
  };
  for (let x = 9.6; x < 10.9; x += 0.7) for (let z = -14; z <= -8; z += 0.75) if (R() > 0.2) guest(x + (R() - 0.5) * 0.3, 0, z + (R() - 0.5) * 0.3, Math.PI / 2 + (R() - 0.5) * 0.7);
  [[-3, -11], [-6.5, -14.5], [1.5, -15], [5.5, -9], [-1, -8.6], [7.2, -12.5]].forEach(([x, z], i) => guest(x, -1.0, z, Math.PI / 2 + (i % 2 ? 0.6 : -0.3), { pose: i % 2 ? 'up' : 'wave' }));
  [[-14.5, -8.2], [-15.3, -9.6]].forEach(([x, z], i) => guest(x, -0.35, z, i ? 0.4 : 2.6, { pose: 'relax', legs: 'sit' }));
  [[-16.4, -1.4, 1.6], [-18.6, -3, 1.4], [-11.8, -4.2, 3.2], [11.5, -4.4, -2.6]].forEach(([x, z, ry]) => guest(x, 0, z, ry, { pose: 'hips' }));
  scene.add(b.build());

  /* --- свет для людей --- */
  scene.add(new THREE.HemisphereLight('#ffd2b0', '#5a4038', 1.0));
  const dl = new THREE.DirectionalLight('#ffb27a', 2.2); dl.position.set(SD.x * 50, 12, SD.z * 50); scene.add(dl);
  const L = (c, i, p, d = 14) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ffd6a0', 40, [GX, 3.3, GZ]); L('#ff3fb4', 18, [GX - 3.2, 1.6, GZ], 8);

  /* --- свечение: светильники, бассейн, гирлянда беседки --- */
  for (let x = -8; x <= 8; x += 4) glows.push([x, -0.9, -6.6, '#bff6ff', 1.6, 1.1]);
  glows.push([-14.5, 0.2, -9, '#2fe6ff', 2.5, 0.8], [-13.7, 0.9, 7, '#ff8a2a', 2.2, 0.8]);
  for (const z of [5.6, 7, 8.4]) glows.push([7.5, 2.2, z, '#ffd9a0', 0.9, 1.2]);
  for (let i = 0; i < 5; i++) glows.push([-2.3, 0.15, 17.4 + i * 4.6, '#ffc37a', 1.1, 1.2], [5.9, 0.15, 18.2 + i * 4.6, '#ffc37a', 1.1, 1.2]);
  for (let i = 0; i < 26; i += 2) for (const z of [GZ - 3.4, GZ + 3.4]) glows.push([GX - 4 + (i / 26) * 8, 3.72, z, '#ffd9a0', 0.45, 1.4]);
  glows.push([GX - 4.25, 4.3, GZ, '#ff3fb4', 3, 0.7], [GX - 2.9, 1.05, GZ, '#ff3fb4', 1.6, 0.8]);
  scene.add(kit.glowPoints(glows));

  /* --- камера: пролёт сквозь виллу к морю и восходу --- */
  const GAZ = [GX, 1.7, GZ];
  const far = (k) => SD.clone().multiplyScalar(k).toArray();
  const keys = [
    // подъезд: вдоль канала к входу
    { p: [0, 2.2, 44], l: [0, 3, 10], t: 0.0 },
    { p: [0, 1.95, 32], l: [0, 2.2, 10] },
    { p: [0, 1.8, 20], l: [0, 1.8, 4], t: 0.168 },
    { p: [0, 1.8, 14], l: [0, 1.7, 0], t: 0.21 },
    // гостиная: взгляд на камин и диваны, затем на кухню
    { p: [-1, 1.8, 9.6], l: [-8, 1.3, 5.5], t: 0.277 },
    { p: [1.4, 1.8, 5.6], l: [8, 1.3, 6.5], t: 0.336 },
    { p: [0, 1.8, 1.6], l: [0, 1.4, -14], t: 0.386 },
    // на террасу через раздвинутое стекло, над бассейном к беседке
    { p: [0.4, 2.0, -3], l: [5, 1.2, -13], t: 0.437 },
    { p: [4.4, 3.0, -8], l: GAZ, t: 0.504 },
    { p: [7.0, 3.1, -10.4], l: GAZ, t: 0.554 },
    { p: [7.2, 3.0, -11.8], l: [GX, 1.5, GZ - 0.5], t: 0.622 },
    // разворот к морю и полёт за край утёса — в восход
    { p: [3.6, 2.7, -16], l: far(600), t: 0.697 },
    { p: [0.8, 2.6, -19.4], l: far(1000), t: 0.773 },
    { p: [0, 2.6, -21.5], l: far(1100), t: 0.84 },
    { p: [0, 2.6, -21.5], l: far(1100), t: 1 },
  ];
  const update = (t) => {
    if (!pv) return;
    const k = Math.min(1, Math.max(0, (t - 0.37) / 0.08));
    const e = k === 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
    const s = 0.05 + 0.95 * e; pv.scale.set(s, s, s);
  };
  return { scene, cam: kit.camPath(keys), update };
}
