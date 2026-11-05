import { addLoot } from '../loot.js';
// 02 · STAYA POOL — двор коттеджа: бассейн, главная сцена с хитами и осьминогом, электро-сцена вдали, дом.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/pool_build.py, pool_bake.py.
// Здесь: загрузка GLB, материалы по группам, живая вода, люди, свечение и путь камеры.
// Путь от первого лица: выныриваем в центре бассейна, взгляд с неба вниз на осьминога → плывём к лестнице →
// коридор из двух диагональных экранов → арка танцпола, большие экраны по сторонам → медленно к Луне → белая вспышка.
const BASE = 'world/pool/';
const T = 0.3, SZ = -13, HZ = 19;   // сцена с осьминогом стоит у самого бассейна (запечённая сцена была на z = −22)
const OLDZ = -22;                         // где была запечённая сцена в GLB: её треугольники вырезаются
const DX = 36, DZ = -1, DS = 18;          // танцпол: центр; DS — прежний размер (для окружения)
const PRAD = 13, PAP = PRAD * Math.cos(Math.PI / 5);   // танцпол-пентагон: радиус вершин и расстояние до сторон
const MOON = [DX, 8.8, DZ], MR = 3.2;      // Луна — арт-объект STAYA — висит над центром танцпола

export async function build({ THREE, kit, font, renderer, mobile, quality }) {
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
  const sz = quality.tex;   // размер запечённых текстур по уровню качества: '' 4K, '-m' 2K, '-s' 1K
  const tl = new THREE.TextureLoader();
  const tex = (name, srgb = true) => tl.loadAsync(BASE + name + sz + '.webp').then((t) => {
    t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = quality.aniso; return t;
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
  // запечённая сцена с мультяшным осьминогом убрана: новая сцена и осьминог (как настоящий арт-объект STAYA) — ниже, в коде
  const cut = (mesh, drop) => {
    const g = mesh.geometry, pos = g.attributes.position, idx = g.index ? g.index.array : [...Array(pos.count).keys()], keep = [], v = new THREE.Vector3();
    for (let i = 0; i < idx.length; i += 3) {
      v.set(0, 0, 0); for (let k = 0; k < 3; k++) v.x += pos.getX(idx[i + k]) / 3, v.y += pos.getY(idx[i + k]) / 3, v.z += pos.getZ(idx[i + k]) / 3;
      v.applyMatrix4(mesh.matrixWorld); if (!drop(v)) keep.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g.setIndex(keep);
  };
  gltf.scene.updateMatrixWorld(true);
  const oldStage = (v) => Math.abs(v.x) < 12.5 && v.z < OLDZ + 5 && v.z > OLDZ - 9;
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.material.name || o.name;
    if (/gloss_static|letters_|neon_logo|neon_par_(cyan|green|red)/.test(o.name)) o.visible = false;
    else if (o.name === 'far' || o.name === 'neon_par_pink') cut(o, oldStage);
    else if (o.name === 'near') cut(o, (v) => oldStage(v) && v.y > 0.35);
  });
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  // опора каждой надувной надписи — центр её основания (буквы растут от опоры)
  const pivot = (o) => {
    if (!o) return null;
    const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
    const g = new THREE.Group(); g.position.set(c.x, bb.min.y, c.z); scene.add(g); g.attach(o); return g;
  };
  const pv = {};

  /* --- живая вода поверх запечённой чаши --- */
  const w = kit.water(22, 10, '#13c8f0', { tile: 4, ei: 0.55, emissive: '#0aa8e0', opacity: 0.82 });
  w.position.y = 0.12; scene.add(w);

  const b = new Builder(), R2 = kit.rng(23);
  /* --- главная сцена у бассейна (собрана как сцена AQUA): подиум, фермы, светодиодные колонны, колонки, пульт, экран --- */
  const { G, M } = kit, RH = 1.4, ST = T + RH, PINK = '#ff2fa8', CYAN = '#2fe6ff', VIOLET = '#8a4dff';
  b.add(G.rbox(22, RH, 7, 0.08), '#120e1e', 'gloss', M([0, T + RH / 2, SZ]));
  b.add(G.box(22, 0.08, 0.08), PINK, 'neon', M([0, ST, SZ + 3.52])); b.add(G.box(22, 0.06, 0.06), CYAN, 'neon', M([0, T + 0.12, SZ + 3.52]));
  kit.djBooth(b, [0, ST, SZ + 1.0], 0, { w: 3.4, decks: false });
  const props = [kit.decks(scene, [0, ST + 1.05, SZ + 1.0], 0, 1.7)];
  const TY = 10.5;
  for (const sx of [-1, 1]) {
    for (const z of [SZ + 2.8, SZ - 2.8]) kit.truss(b, [sx * 9, ST, z], [sx * 9, TY, z], 0.5);
    kit.truss(b, [sx * 9, TY, SZ + 2.8], [sx * 9, TY, SZ - 2.8], 0.5);
    b.add(G.box(1.3, 7.6, 0.5), '#0b0a12', 'gloss', M([sx * 7.4, ST + 3.8, SZ - 2.6]));
    for (let k = 0; k < 12; k++) b.add(G.box(1.1, 0.34, 0.06), [PINK, CYAN, VIOLET][k % 3], 'neon', M([sx * 7.4, ST + 0.5 + k * 0.6, SZ - 2.32]));
    kit.speaker(b, [sx * 12.2, T, SZ + 2], 0, 1.8, 1.5); kit.speaker(b, [sx * 12.2, T + 1.8, SZ + 2], 0, 1.8, 1.5);
    for (let k = 0; k < 5; k++) b.add(G.box(1.2, 0.42, 0.9), '#16161c', 'metal', M([sx * 9, TY - 1.2 - k * 0.46, SZ + 3.6], [0.05 * k, 0, 0]));
    for (let i = 0; i < 4; i++) b.add(G.box(2.2, 0.35, 0.5), '#1a1528', 'gloss', M([sx * 6.5, T + 0.17 + i * 0.35, SZ + 4.0 - i * 0.45]));
  }
  kit.truss(b, [-9, TY, SZ + 2.8], [9, TY, SZ + 2.8], 0.5);
  ['#ff3fb4', '#39ff6a', '#ff2a2a', '#2fe6ff', '#ff2a2a', '#39ff6a', '#ff3fb4'].forEach((c, i) => { b.add(G.cyl(0.22, 0.28, 0.5, 10), '#1a1a20', 'metal', M([-6 + i * 2, TY - 0.55, SZ + 2.8])); glows.push([-6 + i * 2, TY - 0.85, SZ + 2.8, c, 2.2, 2]); });
  const vidTex = kit.canvasTex(512, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a0f5c'); g.addColorStop(1, '#0b6c9c'); x.fillStyle = g; x.fillRect(0, 0, w, h); kit.gradText(x, 'STAYA POOL', w / 2, h / 2, 60, '#fff', '#7ff2ff', { glow: '#2fe6ff' }); });
  kit.videoScreen(scene, 'video/pool-h.mp4', 12.4, 5.6, [0, ST + 0.6 + 2.8, SZ - 2.7], [0, 0, 0], vidTex);
  const facade = await kit.logoSign('world/logo.svg', 5.2, ['#ff4fb8', '#ffffff', '#7ff2ff']);
  facade.position.set(0, T + RH / 2, SZ + 3.56); scene.add(facade); glows.push([0, T + RH / 2, SZ + 3.9, PINK, 6, 0.22]);

  /* --- осьминог: огромная надувная голова над сценой, светящиеся глаза, щупальца с присосками обнимают сцену --- */
  // по фото настоящего арт-объекта STAYA: тёмно-индиговый в ультрафиолете, белые глаза, щупальца завиваются наружу
  const octM = new THREE.MeshStandardMaterial({ color: '#2b2296', emissive: '#2a17a6', emissiveIntensity: 0.55, roughness: 0.32, metalness: 0, envMapIntensity: 0.8 });
  const suckM = new THREE.MeshStandardMaterial({ color: '#8a78ff', emissive: '#6a4dff', emissiveIntensity: 0.9, roughness: 0.3 });
  const oct = new THREE.Group(); oct.userData.dynamic = true; scene.add(oct);
  const OH = [0, 15.2, SZ - 1.5];
  const head = new THREE.Mesh(new THREE.SphereGeometry(5.6, 48, 32), octM); head.scale.set(1.12, 0.9, 0.82); head.position.set(...OH); oct.add(head);
  // лоб-гребень и «брови» над глазами
  const ridge = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), octM); ridge.scale.set(0.7, 1.5, 0.6); ridge.position.set(0, OH[1] + 1.6, OH[2] + 3.7); oct.add(ridge);
  for (const sx of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.55, 12, 28, Math.PI * 1.15), octM);
    brow.position.set(sx * 2.4, OH[1] + 0.3, OH[2] + 4.35); brow.rotation.set(0.25, 0, sx < 0 ? -0.1 : Math.PI - Math.PI * 0.15 + 0.1); oct.add(brow);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1.45, 32, 20), new THREE.MeshBasicMaterial({ color: '#eef4ff', toneMapped: false }));
    eye.scale.set(1.05, 0.78, 0.5); eye.position.set(sx * 2.4, OH[1] + 0.1, OH[2] + 4.45); eye.rotation.z = sx * -0.25; oct.add(eye);
    glows.push([sx * 2.4, OH[1] + 0.1, OH[2] + 5.3, '#cfe0ff', 7, 0.5]);
    // щёки-мешки под глазами
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), octM); cheek.scale.set(1.2, 0.8, 0.9); cheek.position.set(sx * 1.6, OH[1] - 2.6, OH[2] + 3.6); oct.add(cheek);
  }
  // щупальце: труба по кривой, толщина убывает к кончику; на лицевой стороне — присоски-кольца
  const suck = [];
  const tentacle = (pts, r0, r1, n = 120) => {
    const c = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)), false, 'centripetal');
    const geo = new THREE.TubeGeometry(c, n, 1, 14, false), pos = geo.attributes.position, P = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const u = i / n; c.getPointAt(u, P); const r = r0 + (r1 - r0) * Math.pow(u, 0.8);
      for (let j = 0; j <= 14; j++) { const k = i * 15 + j; pos.setXYZ(k, P.x + (pos.getX(k) - P.x) * r, P.y + (pos.getY(k) - P.y) * r, P.z + (pos.getZ(k) - P.z) * r); }
    }
    geo.computeVertexNormals(); oct.add(new THREE.Mesh(geo, octM));
    // присоски смотрят к зрителю (+z), по одной через равный шаг
    const tg = new THREE.Vector3(), off = new THREE.Vector3();
    for (let u = 0.12; u < 0.97; u += 0.065) {
      c.getPointAt(u, P); c.getTangentAt(u, tg); const r = r0 + (r1 - r0) * Math.pow(u, 0.8);
      off.set(0, 0, 1).addScaledVector(tg, -tg.z).normalize();
      suck.push([P.clone().addScaledVector(off, r * 0.92), off.clone(), r * 0.42]);
    }
  };
  for (const sx of [-1, 1]) {
    const X = (v) => v * sx;
    // передние: спускаются от головы к краю подиума и завиваются наружу у пола — «усы» по краям пульта
    tentacle([[X(1.6), OH[1] - 3.5, SZ + 1.6], [X(3.4), 9.5, SZ + 4.6], [X(5.2), 5.0, SZ + 5.6], [X(6.4), 1.4, SZ + 5.9], [X(8.6), 0.9, SZ + 5.6], [X(9.6), 2.4, SZ + 5.2], [X(8.6), 3.4, SZ + 5.0], [X(7.9), 2.6, SZ + 5.0]], 1.35, 0.3);
    // верхние: рогами вверх и наружу
    tentacle([[X(3.6), OH[1] + 3.0, OH[2]], [X(6.0), OH[1] + 6.0, OH[2] + 0.5], [X(8.6), OH[1] + 6.8, OH[2] + 1.0], [X(10.2), OH[1] + 5.4, OH[2] + 1.2], [X(9.6), OH[1] + 3.9, OH[2] + 1.3], [X(8.6), OH[1] + 4.5, OH[2] + 1.3]], 1.15, 0.28);
    // средние: аркой над фермами и вниз, кольцо завитка снаружи сцены
    tentacle([[X(4.8), OH[1] - 0.5, OH[2] + 0.4], [X(9.5), OH[1] + 0.6, OH[2] + 1.0], [X(13.5), OH[1] - 2.0, SZ + 0.6], [X(15.2), 7.0, SZ + 1.2], [X(14.2), 3.6, SZ + 1.6], [X(12.4), 4.4, SZ + 1.8], [X(12.8), 6.2, SZ + 1.8], [X(14.0), 5.8, SZ + 1.8]], 1.25, 0.3);
    // нижние: стелются по земле наружу
    tentacle([[X(4.6), OH[1] - 3.2, OH[2] + 0.2], [X(8.6), 7.6, SZ + 1.0], [X(12.4), 2.4, SZ + 3.4], [X(16.2), 0.8, SZ + 4.6], [X(18.4), 1.8, SZ + 5.0], [X(17.6), 3.4, SZ + 5.0], [X(16.4), 2.6, SZ + 4.8]], 1.1, 0.26);
  }
  const sm0 = new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.32, 8, 18), suckM, suck.length), mq = new THREE.Matrix4(), qq = new THREE.Quaternion();
  suck.forEach(([p, n, r], i) => { qq.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); mq.compose(p, qq, new THREE.Vector3(r, r, r)); sm0.setMatrixAt(i, mq); });
  oct.add(sm0);
  glows.push([0, OH[1] + 4, OH[2] + 3, '#6a4dff', 22, 0.12]);
  /* --- танцпол: светодиодный пол, неоновая арка входа, ферма с прожекторами и лазерами --- */
  const floorT = kit.canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#07060e'; x.fillRect(0, 0, w, h); const n = 12, c = w / n, R = kit.rng(5);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = R(); x.fillStyle = r < 0.45 ? '#120c22' : r < 0.62 ? '#ff2fb0' : r < 0.78 ? '#7a3dff' : r < 0.92 ? '#21e0ff' : '#ffe14a'; x.fillRect(i * c + 4, j * c + 4, c - 8, c - 8); }
  });
  // танцпол — пентагон: одна сторона (запад) — вход с аркой, на четырёх других — вертикальные экраны с видео
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(1.5, 1.5);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(PRAD, 5, 0), new THREE.MeshBasicMaterial({ map: floorT, toneMapped: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(DX, 0.04, DZ); scene.add(floor);
  const PV = [0, 1, 2, 3, 4].map((k) => { const a = (k * 72) * Math.PI / 180; return [DX + Math.cos(a) * PRAD, DZ + Math.sin(a) * PRAD]; });
  PV.forEach(([ax, az], k) => {
    const [bx, bz] = PV[(k + 1) % 5], len = Math.hypot(bx - ax, bz - az);
    b.add(kit.G.box(len, 0.08, 0.08), k % 2 ? '#ff3fb4' : '#2fe6ff', 'neon', kit.M([(ax + bx) / 2, 0.08, (az + bz) / 2], [0, -Math.atan2(bz - az, bx - ax), 0]));
    glows.push([ax, 0.3, az, '#ffffff', 1.6, 1.2]);
  });
  // арка входа — полукольцо из неона на западной стороне пентагона
  const AX = DX - PAP - 0.6;
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
  const moonArt = kit.moonMesh(MR); moonArt.position.set(...MOON); moonArt.userData.dynamic = true; scene.add(moonArt);
  scene.add(kit.halo(MOON, 22, '#cfd8ff', 0.35));
  for (let i = 0; i < 12; i++) {
    const x = FX0 + (i % 6) * 3, z = i < 6 ? FZ0 : FZ1, c = i % 2 ? '#2fe6ff' : '#8a3dff';
    glows.push([x, TH - 0.4, z, c, 1.8, 2]);
    kit.laser(b, [x, TH - 0.4, z], [DX + (R2() - 0.5) * 30, 0.5 + R2() * 4, DZ + (z < DZ ? 1 : -1) * (8 + R2() * 10)], c);
  }
  /* --- четыре вертикальных экрана на сторонах пентагона, лицом к центру --- */
  ['video/pool-v.mp4', 'video/pool-v2.mp4', 'video/pool-v3.mp4', 'video/pool-v4.mp4'].forEach((src, i) => {
    const phi = [108, 36, -36, -108][i] * Math.PI / 180, r = PAP + 0.8;
    kit.vScreen(scene, src, [DX + Math.cos(phi) * r, 0.6, DZ + Math.sin(phi) * r], Math.atan2(-Math.cos(phi), -Math.sin(phi)), 9, { edge: i % 2 ? '#ff3fb4' : '#2fe6ff' });
  });
  /* --- за танцполом: баскетбольная площадка с кольцом — на тусовке можно покидать мяч --- */
  const BCX = DX + 24, BW = 15, BD = 14;
  const courtT = kit.canvasTex(1024, 960, (x, w, h) => {
    x.fillStyle = '#1d4f8f'; x.fillRect(0, 0, w, h);
    const sx = w / BW, sz = h / BD, X = (v) => v * sx, Z = (v) => v * sz;
    x.fillStyle = '#e8652a'; x.fillRect(w - X(5.8), h / 2 - Z(2.45), X(5.8), Z(4.9));
    x.strokeStyle = '#ffffff'; x.lineWidth = 7; x.strokeRect(6, 6, w - 12, h - 12);
    x.strokeRect(w - X(5.8), h / 2 - Z(2.45), X(5.8), Z(4.9));
    x.beginPath(); x.arc(w - X(5.8), h / 2, X(1.8), Math.PI / 2, Math.PI * 1.5); x.stroke();
    x.beginPath(); x.arc(w - X(1.6), h / 2, X(6.75), Math.PI * 0.62, Math.PI * 1.38); x.stroke();
    x.beginPath(); x.arc(6, h / 2, X(1.8), -Math.PI / 2, Math.PI / 2); x.stroke();
    x.font = `900 ${Z(1.3)}px ${kit.FONT}`; x.fillStyle = 'rgba(255,255,255,.85)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.save(); x.translate(X(4.2), h / 2); x.rotate(-Math.PI / 2); x.fillText('STAYA', 0, 0); x.restore();
  });
  const court = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: courtT, roughness: 0.6 }));
  court.rotation.x = -Math.PI / 2; court.position.set(BCX, 0.035, DZ); scene.add(court);
  // кольцо: стойка, щит, обод, сетка
  const HX = BCX + BW / 2 - 1.2;
  b.add(kit.G.cyl(0.12, 0.14, 3.9, 12), '#2a2a34', 'metal', kit.M([HX + 1.1, 1.95, DZ]));
  b.add(kit.G.box(1.1, 0.12, 0.12), '#2a2a34', 'metal', kit.M([HX + 0.55, 3.75, DZ]));
  b.add(kit.G.box(0.06, 1.1, 1.8), '#f4f4f8', 'plastic', kit.M([HX, 3.55, DZ]));
  b.add(kit.G.box(0.02, 0.45, 0.6), '#ff3fb4', 'neon', kit.M([HX - 0.04, 3.32, DZ]));
  b.add(kit.G.tor(0.23, 0.02, 6, 24), '#ff6a2a', 'metal', kit.M([HX - 0.3, 3.05, DZ], [Math.PI / 2, 0, 0]));
  const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.15, 0.42, 12, 3, true), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.8 }));
  net.position.set(HX - 0.3, 2.83, DZ); scene.add(net);
  const ballT = kit.canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#e8702a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a1408'; x.lineWidth = 4; for (const v of [w / 4, w / 2, w * 0.75]) { x.beginPath(); x.moveTo(v, 0); x.lineTo(v, h); x.stroke(); } x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); });
  for (const [x, z, s2] of [[BCX + 2.5, DZ + 2.2, 0], [BCX - 1.5, DZ - 3.4, 1], [HX - 0.9, DZ + 0.8, 2]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.7 })); m.position.set(x, 0.12, z); m.rotation.set(s2, s2 * 2, 0); scene.add(m);
  }
  // прожекторы площадки
  for (const sz of [-1, 1]) { b.add(kit.G.cyl(0.1, 0.12, 7, 10), '#2a2a34', 'metal', kit.M([BCX, 3.5, DZ + sz * (BD / 2 + 0.8)])); glows.push([BCX, 7.1, DZ + sz * (BD / 2 + 0.6), '#fff1d6', 3, 1.2]); }

  /* --- жизнь вокруг танцпола: шезлонги, надувные круги и мячи (Sketchfab, CC BY) --- */
  for (let i = 0; i < 5; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [DX - 6 + i * 2.6, 0.02, DZ + DS / 2 + 4.2], ry: Math.PI + (i % 2 ? 0.15 : -0.15), w: 1.9 }));
  for (let i = 0; i < 4; i++) props.push(kit.prop(scene, 'sf_lounger', { p: [DX + 3 + i * 2.6, 0.02, DZ - DS / 2 - 4.2], ry: (i % 2 ? 0.2 : -0.1), w: 1.9 }));
  [['sf_flamingo', DX - 7.5, DZ - 13.2, 0.4, 1.6], ['sf_duck', DX + 9.5, DZ + 12.6, 2.1, 1.5], ['sf_flamingo', DX + 11.2, DZ - 6, 4.2, 1.7], ['sf_duck', AX - 3.4, DZ + 7.2, 1.2, 1.5],
    ['sf_ball1', DX - 2.2, DZ + 3.4, 0, 0.8], ['sf_ball2', DX + 4.1, DZ - 4.6, 1, 0.8], ['sf_ball1', DX + 7.2, DZ + 5.6, 2, 0.8], ['sf_ball2', AX - 2.2, DZ - 6.3, 3, 0.8], ['sf_ball1', DX - 9.8, DZ + 11.5, 4, 0.8]]
    .forEach(([n, x, z, ry, w]) => props.push(kit.prop(scene, n, { p: [x, n.startsWith('sf_ball') ? 0.05 : 0.02, z], ry, w })));
  // надувные круги и мячи в бассейне
  [['sf_duck', -7.5, -2.6, 2.2, 1.5], ['sf_flamingo', 6.4, 2.8, -0.7, 1.5], ['sf_ball2', -3.2, 3.1, 0, 0.6], ['sf_ball1', 4.5, -3.2, 1, 0.6],
    ['sf_floats', -6.0, 2.4, 0.6, 4.6], ['sf_duck', -3.2, -3.4, 4.0, 1.4], ['sf_flamingo', 2.4, 4.1, 1.4, 1.4], ['sf_duck', 9.4, 3.2, 5.2, 1.4],
    ['sf_flamingo', -9.6, -0.4, 3.1, 1.5], ['sf_ball2', 1.8, -3.9, 2, 0.6], ['sf_ball1', -9.8, 3.6, 3, 0.6]]
    .forEach(([n, x, z, ry, w]) => props.push(kit.prop(scene, n, { p: [x, 0.0, z], ry, w })));
  /* --- пальмы (Sketchfab «Coconut Palm», CC BY) --- */
  for (const [x, z, ry, h] of [[-24, -8, 0.4, 10], [-30, 6, 2.0, 11], [-26, 15, 4.1, 10], [26, -18, 1.1, 11], [24, 12, 3.0, 10], [-20, -18, 5.0, 11], [DX + 12, DZ - 13, 2.5, 10], [DX + 12, DZ + 12, 0.9, 11], [DX - 12, DZ + 13, 3.6, 10], [DX - 12, DZ - 14, 1.6, 10.5]])
    props.push(kit.prop(scene, 'sf_palm', { p: [x, T - 0.3, z], ry, h }));
  await Promise.all(props);
  scene.add(b.build());

  /* --- свет для людей (запечённый двор от него не зависит) --- */
  scene.add(new THREE.HemisphereLight('#5b4bdf', '#12061f', 0.6));
  const L = (c, i, p, d = 40) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  // двор запечён; живые лампы нужны только моделям: одна у главной сцены, одна над танцполом (было 7)
  L('#ff8ad8', 300, [0, 6, SZ + 6], 40); L('#7a5cff', 380, [0, 16, SZ + 9], 40); L('#8fa8ff', 460, [DX, 10, DZ], 40);

  /* --- свечение: подводные фонари, прожекторы, LED, окна, гирлянды --- */
  for (let x = -9; x <= 9; x += 3) glows.push([x, -0.55, -4.85, '#2fe6ff', 1.8, 1.4], [x, -0.55, 4.85, '#2fe6ff', 1.8, 1.4]);
  const PAR = { pink: '#ff3fb4', green: '#39ff6a', red: '#ff2a2a', cyan: '#2fe6ff' };

  const strings = [[[-16, 7.5, HZ], [-19, 6.5, -6]], [[-6, 7.5, HZ], [-9, TY, SZ + 2.8]], [[6, 7.5, HZ], [9, TY, SZ + 2.8]], [[16, 7.5, HZ], [19, 6.5, -7]], [[-19, 6.5, -6], [-9, TY, SZ + 2.8]], [[19, 6.5, -7], [9, TY, SZ + 2.8]]];
  for (const [a, c] of strings) for (let i = 1; i < 22; i++) {
    const t = i / 22, sag = Math.sin(t * Math.PI) * 2;
    glows.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag - 0.12, a[2] + (c[2] - a[2]) * t, i % 3 ? '#ffd28a' : '#ff3fb4', 0.7, 1.5]);
  }
  // шатёр гирлянд над танцполом: 8 столбов по кругу, нити сходятся к вершине фермы — при вращении на танцполе
  // и взгляде вверх на Луну они расходятся лучами
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8, px = DX + Math.cos(a) * 15, pz = DZ + Math.sin(a) * 15;
    kit.rod(b, [px, 0, pz], [px, 7.5, pz], 0.08, '#2a2232', 'metal', 6); glows.push([px, 7.6, pz, '#ffd28a', 1.4, 1.6]);
    const a2 = ((k + 1) / 8) * Math.PI * 2 + Math.PI / 8, qx = DX + Math.cos(a2) * 15, qz = DZ + Math.sin(a2) * 15;
    for (const [A, Cc, n, sag] of [[[px, 7.5, pz], [DX, TH + 0.3, DZ], 26, 1.6], [[px, 7.5, pz], [qx, 7.5, qz], 14, 1.2]]) for (let i = 1; i < n; i++) {
      const t = i / n;
      glows.push([A[0] + (Cc[0] - A[0]) * t, A[1] + (Cc[1] - A[1]) * t - Math.sin(t * Math.PI) * sag, A[2] + (Cc[2] - A[2]) * t, i % 3 ? '#ffd28a' : (k % 2 ? '#ff3fb4' : '#2fe6ff'), 0.6, 1.4]);
    }
  }
  scene.add(kit.glowPoints(glows));

  /* --- камера: от первого лица --- */
  const STAGE = [0, 6.5, SZ], EYE = T + 1.62;

  const keys = [
    // выныриваем в центре бассейна: сначала взгляд в ночное небо, затем вниз — осьминог по центру кадра
    { p: [0.4, -1.35, 2.0], l: [0.2, 30, -0.6], t: 0 },
    { p: [0.15, -0.55, 2.4], l: [0, 30, -1.0], t: 0.03 },
    { p: [0, 0.68, 2.8], l: [0, 30, -1.6], t: 0.05 },
    { p: [0, 0.74, 3.5], l: [0, 20, SZ + 2], t: 0.12 },
    { p: [0, 0.76, 4.2], l: [0, 8.5, SZ], t: 0.2 },
    { p: [0.3, 0.74, 4.0], l: [0, 7.8, SZ], t: 0.25 },
    // плывём к лестнице справа и выбираемся
    { p: [5.5, 0.58, 0.4], l: [9, 0.9, -1.6] },
    { p: [9.7, 0.75, -1.6], l: [13, 1.6, -1.6], t: 0.36 },
    { p: [11.9, EYE, -1.5], l: [18, EYE, -2], t: 0.41 },
    // прямо к арке танцпола-пентагона; через арку видны экраны на его сторонах
    { p: [14.0, EYE, -1.4], l: [DX, 4.5, DZ], t: 0.47 },
    { p: [20.4, EYE, -1.2], l: [DX, 5, DZ], t: 0.55 },
    // присели — низко над плитками под аркой, и выпрямляемся на танцполе
    { p: [AX - 1.2, 0.95, DZ], l: [DX, 1.3, DZ], t: 0.59 },
    { p: [AX + 3.0, EYE, DZ], l: [DX + 8, 3, DZ], t: 0.62 },
  ];
  const path = kit.camPath(keys);
  // на танцполе: шаг к центру под Луной, обзор площадки против часовой стрелки (если смотреть сверху),
  // затем голова поднимается к Луне, а вращение продолжается по инерции — Луна становится диско-шаром
  const C = new THREE.Vector3(DX, EYE, DZ), SPIN = (2 * Math.PI) / 0.2, R0 = 0.03;
  const yawAt = (t) => { const x = Math.max(0, t - 0.66); return SPIN * (x < R0 ? (x * x) / (2 * R0) : x - R0 / 2); };
  const sm = (a, c, t) => { const k = Math.min(1, Math.max(0, (t - a) / (c - a))); return k * k * (3 - 2 * k); };
  const P0 = new THREE.Vector3(AX + 3.0, EYE, DZ), out = { p: new THREE.Vector3(), l: new THREE.Vector3() };
  const cam = (t) => {
    if (t < 0.62) return path(t);
    out.p.copy(P0).lerp(C, sm(0.62, 0.68, t));
    const a = yawAt(t), pitch = 0.06 + sm(0.86, 0.99, t) * 1.4;
    out.l.set(Math.cos(a) * Math.cos(pitch), Math.sin(pitch), -Math.sin(a) * Math.cos(pitch)).multiplyScalar(10).add(out.p);
    return out;
  };
  /* --- под водой: пузыри и лучи света от поверхности --- */
  const bub = kit.bubbles(170, 9); scene.add(bub);
  const rayM = new THREE.MeshBasicMaterial({ color: '#c8f4ff', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const rays = new THREE.Group(); scene.add(rays);
  const RR = kit.rng(31);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25 + RR() * 0.3, 0.9 + RR() * 0.8, 2.2, 14, 1, true), rayM);
    m.position.set(-3 + RR() * 6, -0.95, -0.5 + RR() * 4.5); m.rotation.set((RR() - 0.5) * 0.35, 0, (RR() - 0.5) * 0.35); m.userData.dynamic = true; rays.add(m);
  }
  // надписи надуваются по очереди: STAYA и POOL при выныривании, ELECTRO при повороте
  const blow = (g, a, d, t) => {
    if (!g) return;
    const k = Math.min(1, Math.max(0, (t - a) / d));
    const e = k === 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); // easeOutBack
    const s = 0.05 + 0.95 * e; g.scale.set(s, s, s);
  };
  // щупальца осьминога машут: поворот вокруг основания
  // надувной осьминог чуть покачивается и «дышит»
  const wave = [];
  // салют за Луной: вспышки по очереди, искры разлетаются и падают
  const FW = ['#ff3fb4', '#2fe6ff', '#ffd84a', '#b78bff', '#ffffff'].map((c, i) => {
    const pts = kit.drops(90, c, 0.32, { fog: false }), R = kit.rng(70 + i);
    const dir = Array.from({ length: 90 }, () => { const u = R() * 2 - 1, a = R() * 6.28, r = Math.sqrt(1 - u * u); return [r * Math.cos(a), u, r * Math.sin(a), 0.7 + R() * 0.3]; });
    scene.add(pts); return { pts, dir, c: [DX + 16 + R() * 14, 15 + R() * 9, DZ - 14 + i * 7], ph: i * 0.53 };
  });
  const update = (t) => {
    const now = performance.now() / 1000;
    head.scale.set(1.12 + Math.sin(now * 1.3) * 0.012, 0.9 + Math.sin(now * 1.3) * 0.014, 0.82);
    // Луна медленно вращается и у самого края превращается в зеркальный диско-шар
    moonArt.rotation.y = now * 0.05 + t * 1.2;
    const mu = moonArt.material.uniforms; mu.tiles.value = Math.min(1, Math.max(0, (t - 0.91) / 0.08)); mu.time.value = now;
    const fwOn = t > 0.62;
    for (const f of FW) {
      const p = f.pts.userData.pos, q = ((now * 0.42 + f.ph) % 1.6) / 1.6;
      for (let i = 0; i < 90; i++) {
        if (!fwOn || q > 0.62) { p[i * 3 + 1] = -999; continue; }
        const [dx, dy, dz, v] = f.dir[i], r = (1 - Math.pow(1 - q / 0.62, 2.4)) * 7 * v;
        p[i * 3] = f.c[0] + dx * r; p[i * 3 + 1] = f.c[1] + dy * r - q * q * 9; p[i * 3 + 2] = f.c[2] + dz * r;
      }
      f.pts.material.opacity = q < 0.62 ? 1 - q / 0.62 : 0; f.pts.userData.commit();
    }
    // синяя толща воды рассеивается, когда голова выходит на поверхность
    const u = Math.min(1, Math.max(0, (t - 0.025) / 0.03));
    scene.fog.color.copy(DEEP).lerp(NIGHT, u); scene.fog.density = 0.12 + (0.004 - 0.12) * u;
    const under = 1 - Math.min(1, Math.max(0, (t - 0.03) / 0.02));
    bub.userData.tick(path(t).p, under, now, 0.08);
    rays.visible = under > 0; rayM.opacity = 0.2 * under * (0.8 + 0.2 * Math.sin(now * 2));

  };
  // «прищур» на электро-сцену: камера приближает её, сверху и снизу темнеет, как веки
  const calm = (t) => Math.min(1, Math.max(0, (t - 0.6) / 0.05));   // вращение на танцполе — без влияния головы и курсора
  // предметы для сбора: презерватив в фольге лежит у выхода из бассейна, золотой мяч парит над танцполом
  addLoot(scene, 'condom', 'condom', [16.9, T + 0.004, -1.2], { lie: true, r: 0.45, glow: 0.5, ry: 0.4 });
  addLoot(scene, 'ball', 'ball', [DX + 3.5, 1.5, DZ + 1.5], { r: 0.7 });
  return { scene, cam, update, calm };
}
