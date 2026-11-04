import { addLoot } from '../loot.js';
// 05 · STAYA PHUKET — вилла на утёсе над морем, рассвет. Финал маршрута.
// Геометрия и свет собраны в Blender и запечены в текстуры (Cycles): scripts/blender/villa_build.py, villa_bake.py.
// Путь: подъезд к вилле → сквозь вход и гостиную → терраса с инфинити-бассейном →
// VIP-беседка с командой → за край утёса, лицом к восходу.
const BASE = 'world/villa/';
const Y2 = 5.2;   // пол второго этажа: терраса с бассейном и диджейской стойкой

import { CREDITS, DEV } from '../credits.js';
export async function build({ THREE, kit, font, renderer, mobile }) {
  const { Builder } = kit;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#e9a27a', 0.0016);
  scene.environment = kit.env(renderer, ['#ffb070', '#ff8a5a', '#8fa6d8', '#ffe2b8', '#3a4a6a'], '#4a3a4a');
  scene.add(kit.sky(['#ffb27a', '#f4a07a', '#5f78b8', 0.03], 1400));
  const glows = [];

  /* --- солнце над горизонтом и море --- */
  const SD = new THREE.Vector3(0.3, 0.07, -1).normalize();          // солнце, по которому запечён свет виллы
  const SV = new THREE.Vector3(0.02, 0.07, -1).normalize();         // видимый диск: левее, над чистым горизонтом
  const SUN = SV.clone().multiplyScalar(1100).toArray();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(26, 32, 16), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false, fog: false }));
  sun.position.set(...SUN); scene.add(sun);
  scene.add(kit.halo(SUN, 900, '#ff9a5a', 0.75)); scene.add(kit.halo(SUN, 260, '#ffe2a8', 0.9));
  const SEA = -30;
  const sea = kit.water(3600, 3600, '#2a5a7a', { tile: 30, ei: 0.12, emissive: '#c07a5a', rough: 0.1, metal: 0.4, ns: 0.35 });
  sea.position.y = SEA; scene.add(sea);

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

  /* --- обрыв к морю под садом виллы: каменная стена во всю ширину участка (скал и островов больше нет) --- */
  const cliffM = new THREE.MeshStandardMaterial({ color: '#8a7460', roughness: 0.95 });
  const cliff = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cliffM); m.position.set(x, y, z); scene.add(m); };
  cliff(144, 30, 1.2, 0, -15.4, -19.8); for (const sx of [-1, 1]) cliff(1.2, 30, 66, sx * 72, -15.4, 13);
  /* --- живая вода: бассейн, джакузи, канал у входа --- */
  const pool = kit.water(18, 11, '#2aa6b0', { tile: 4, ei: 0.35, emissive: '#1a8a9a', opacity: 0.86 });
  pool.position.set(0, -0.1, -12); scene.add(pool);
  const jac = kit.water(3.5, 3.5, '#3fd6e8', { tile: 2, ei: 0.6, opacity: 0.85 });
  jac.geometry.dispose(); jac.geometry = new THREE.CircleGeometry(1.75, 40); jac.position.set(-14.5, 0.45, -9); scene.add(jac);
  const canal = kit.water(1.6, 22, '#3a3a40', { tile: 2, ei: 0.15, emissive: '#ffb070', rough: 0.03, metal: 0.6 });
  canal.position.set(4.6, 0.16, 27); scene.add(canal);
  // бассейн на крыше второго этажа
  const roof = kit.water(7.4, 7.0, '#2aa6b0', { tile: 3, ei: 0.4, emissive: '#1a8a9a', opacity: 0.86 });
  roof.position.set(-8.8, Y2 + 0.72, 1.0); scene.add(roof);
  /* --- второй этаж: пульт Pioneer и экран с видео; пальмы у виллы и на террасе (Sketchfab, CC BY) --- */
  // диджейская сцена-балкон под навесом: пульт Pioneer на большой стойке, неоновая надпись на простенке
  const props = [kit.decks(scene, [0, Y2 + 0.35 + 1.2, 4.6], Math.PI, 1.9)];
  const nb = new Builder(); kit.text3d(nb, font, 'STAYA', { size: 0.9, color: '#ff3fb4', kind: 'neon', p: [0, Y2 + 2.4, 7.76], r: [0, Math.PI, 0], bevel: 0.01, depth: 0.05 }); scene.add(nb.build());
  glows.push([0, Y2 + 2.6, 7.4, '#ff3fb4', 4, 0.5]);
  /* --- видео с вечеринок в гостиной: картина в раме на стене перед диваном и холст на мольберте у кухни --- */
  props.push(kit.painting(scene, 'video/phuket2.mp4', { video: true, p: [-5, 2.5, 13.68], ry: Math.PI, h: 2.3 }));
  /* --- машины у въезда и на боковой террасе (Sketchfab, CC BY): видны в начале и при развороте ко второму этажу --- */
  props.push(
    kit.prop(scene, 'sf_car_porsche', { p: [-6.4, 0.0, 37.5], ry: 0.6, w: 4.3 }),
    kit.prop(scene, 'sf_car_merc', { p: [9.4, 0.0, 41.5], ry: -0.5, w: 4.5 }),
    kit.prop(scene, 'sf_car_lambo', { p: [-22.5, 0.0, 3.5], ry: -2.4, w: 4.4 }),
  );
  /* --- парковки по сторонам от въезда: машины стоят ёлочкой, их видно на подходе к дому (Sketchfab, CC BY) --- */
  const lotT = kit.canvasTex(256, 768, (x, w, h) => {
    x.fillStyle = '#3c3a3e'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 5;
    for (let i = 0; i <= 5; i++) { const y = 40 + i * (h - 80) / 5; x.beginPath(); x.moveTo(w * 0.15, y); x.lineTo(w * 0.95, y - 50); x.stroke(); }
  });
  for (const sx of [-1, 1]) {
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(7, 21), new THREE.MeshStandardMaterial({ map: lotT, roughness: 0.85 }));
    lot.rotation.set(-Math.PI / 2, 0, sx > 0 ? Math.PI : 0); lot.position.set(sx * 21.5, 0.025, 40); scene.add(lot);
  }
  [['sf_car_gclass', -21.6, 33.8, 4.6], ['sf_car_f288', -21.6, 40, 4.4], ['sf_car_koenig', -21.6, 46.2, 4.4],
    ['sf_car_cullinan', 21.6, 33.8, 5.2], ['sf_car_gt3', 21.6, 40, 4.4]].forEach(([n, x, z, w]) =>
    props.push(kit.prop(scene, n, { p: [x, 0.0, z], ry: x < 0 ? Math.PI / 2 - 0.45 : -Math.PI / 2 + 0.45, w })));
  /* --- команда STAYA на балконе второго этажа: пять фото за стеклянными перилами, над каждым — ник --- */
  const TEAM = [['gulidic', 'GULIDIC'], ['sixphrases', 'SIXPHRASES'], ['dierouzze', 'DIEROUZZE'], ['klen', 'KLËN'], ['pronto', 'PRONTO']];
  await Promise.all(TEAM.map(async ([f, nick], i) => {
    const img = new Image(); img.src = `world/team/${f}.webp`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    // низ кадра растворяется — фигура стоит за перилами, а не обрезана
    x.globalCompositeOperation = 'destination-in'; const g = x.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, '#000'); g.addColorStop(0.68, '#000'); g.addColorStop(0.97, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const H = 1.8, W = H * c.width / c.height, X = [8.2, 5.5, 2.8, -2.8, -5.5][i];   // слева направо, как смотрит камера: GULIDIC … PRONTO; середина свободна для неона STAYA
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: t, transparent: true, color: '#fff0e4', depthWrite: false }));
    m.position.set(X, Y2 + 0.3 + H / 2, -2.7); m.rotation.y = Math.PI; m.renderOrder = 2; scene.add(m);
    const nt = kit.canvasTex(1024, 192, (x2, w, h) => kit.gradText(x2, nick, w / 2, h / 2, 104, '#ffffff', '#ff8ad8', { glow: '#ff3fb4' }));
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.4), new THREE.MeshBasicMaterial({ map: nt, transparent: true, toneMapped: false, depthWrite: false }));
    nm.position.set(X, Y2 + 0.3 + H + 0.3, -2.7); nm.rotation.y = Math.PI; scene.add(nm);
  }));
  /* --- далёкие острова: известняковые скалы-«свечи», как в заливе Пханг-Нга — отвесные стены, подмыв у воды, зелёная шапка --- */
  { const iM = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RI = kit.rng(9), cliffC = new THREE.Color('#b9a48e'), darkC = new THREE.Color('#8a7a6c'), greenC = new THREE.Color('#5e7650'), hazeC = new THREE.Color('#eab396');
    const tower = (h, r) => {
      // профиль: подмыв у воды → отвесная стена → скруглённая вершина
      const prof = [[0, -2], [r * 0.82, -2], [r * 0.8, h * 0.05], [r * 0.97, h * 0.14], [r * 0.93, h * 0.45], [r * 0.86, h * 0.72], [r * 0.7, h * 0.88], [r * 0.42, h * 0.97], [0, h]].map(([x, y]) => new THREE.Vector2(x, y));
      const g = new THREE.LatheGeometry(prof, 22), pos = g.attributes.position, col = [];
      const ph = RI() * 6.28, ph2 = RI() * 6.28;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x);
        const k = 1 + 0.12 * Math.sin(a * 3 + ph) + 0.07 * Math.sin(a * 7 + ph2 + y * 0.05) + 0.04 * Math.sin(y * 0.3 + a * 5);
        pos.setXYZ(i, x * k, y, z * k);
        const top = Math.min(1, Math.max(0, (y / h - 0.8) / 0.08)), streak = 0.5 + 0.5 * Math.sin(a * 11 + ph);
        const c = cliffC.clone().lerp(darkC, streak * 0.45).lerp(greenC, top).lerp(hazeC, 0.35); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
    };
    // группы скал: угол от направления на море, дистанция, набор башен [dx, dz, высота, радиус]
    const isles = [
      [-0.6, 700, [[0, 0, 95, 30], [38, 12, 62, 22], [-30, 8, 48, 18]]],
      [-0.42, 930, [[0, 0, 130, 40], [52, -10, 86, 28]]],
      [0.36, 760, [[0, 0, 78, 26], [-34, 6, 104, 30], [30, 14, 44, 16]]],
      [0.55, 1000, [[0, 0, 120, 36], [46, 8, 70, 24], [-40, -6, 56, 20]]],
      [0.47, 560, [[0, 0, 40, 14], [18, 6, 26, 10]]],
      [-0.78, 620, [[0, 0, 52, 18]]],
    ];
    for (const [ang, dist, set] of isles) {
      const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
      for (const [dx, dz, h, r] of set) {
        const m = new THREE.Mesh(tower(h, r), iM); m.scale.set(1, 1, 0.8 + RI() * 0.3);
        m.position.set(dir.x * dist + dx, SEA, dir.z * dist + dz); m.rotation.y = RI() * 6; scene.add(m);
      }
    } }
  /* --- шторы из лёгкой ткани у стеклянного фасада: колышутся от бриза --- */
  const curtains = [];
  { const cM = new THREE.MeshStandardMaterial({ color: '#fbf6ee', roughness: 0.9, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
    for (const [x, w] of [[-5.5, 2.4], [5.5, 2.4], [-12.6, 2.6], [12.6, 2.6]]) {
      const g = new THREE.PlaneGeometry(w, 4.3, 28, 6), m = new THREE.Mesh(g, cM);
      m.position.set(x, 2.2, 0.35); m.userData.dynamic = true; scene.add(m);
      curtains.push({ m, base: Float32Array.from(g.attributes.position.array), ph: x });
    } }
  const EP = [4.4, 0.02, 3.6], ery = -0.98;
  props.push(kit.prop(scene, 'sf_easel', { p: EP, ry: ery, h: 2.2 }).then((m) => m.traverse((c) => { if (c.isMesh && /LOD1/.test(c.name + (c.parent?.name ?? ''))) c.visible = false; })));
  { const fw = 0.86, fh = fw * 16 / 9, off = new THREE.Vector3(0, 1.62, 0.12).applyAxisAngle(new THREE.Vector3(0, 1, 0), ery);
    const cv = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.06, fh + 0.06, 0.03), new THREE.MeshStandardMaterial({ color: '#f2ede4', roughness: 0.8 }));
    cv.position.set(EP[0] + off.x, EP[1] + off.y, EP[2] + off.z); cv.rotation.set(-0.1, ery, 0, 'YXZ'); scene.add(cv);
    const front = new THREE.Vector3(0, 0, 0.02).applyEuler(cv.rotation);
    kit.videoScreen(scene, 'video/phuket.mp4', fw, fh, cv.position.clone().add(front).toArray(), [-0.1, ery, 0]); }
  for (const [x, y, z, h, ry] of [[-13.6, Y2 + 0.8, 6.6, 6, 0.3], [13.4, Y2 + 0.8, 6.6, 6.5, 2.2], [4.6, Y2 + 0.8, -3.0, 5.5, 4.0],
    [-24, 0, -12, 10, 0.5], [-23, 0, 6, 9, 1.7], [-25, 0, -18, 11, 3.1], [22, 0, -3, 10, 2.4], [23, 0, -17, 9.5, 0.9], [20, 0, 20, 10, 5.0], [-19, 0, 22, 9, 4.2], [26, 0, 8, 11, 1.1], [-30, 0, -4, 10, 2.8]])
    props.push(kit.prop(scene, 'sf_palm', { p: [x, y, z], ry, h }));
  await Promise.all(props);

  /* --- живой свет --- */
  scene.add(new THREE.HemisphereLight('#ffd2b0', '#5a4038', 1.0));
  // направленного света нет: он давал блик-дорожку на море под титрами
  const L = (c, i, p, d = 14) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L('#ffd6a0', 30, [0, Y2 + 3.2, 4], 12); L('#ff3fb4', 14, [0, Y2 + 1.4, 4.8], 6);

  /* --- свечение: светильники, бассейн, гирлянда беседки --- */
  for (let x = -8; x <= 8; x += 4) glows.push([x, -0.9, -6.6, '#bff6ff', 1.6, 1.1]);
  glows.push([-14.5, 0.2, -9, '#2fe6ff', 2.5, 0.8], [-13.7, 0.9, 7, '#ff8a2a', 2.2, 0.8]);
  for (const z of [5.6, 7, 8.4]) glows.push([7.5, 2.2, z, '#ffd9a0', 0.9, 1.2]);
  for (let i = 0; i < 5; i++) glows.push([-2.3, 0.15, 17.4 + i * 4.6, '#ffc37a', 1.1, 1.2], [5.9, 0.15, 18.2 + i * 4.6, '#ffc37a', 1.1, 1.2]);
  for (const x of [-11, -8.8, -6.6]) glows.push([x, Y2 + 0.5, -2.4, '#bff6ff', 1.2, 1.1]);
  glows.push([0, Y2 + 0.85, 5.5, '#ff3fb4', 1.6, 0.8]);
  scene.add(kit.glowPoints(glows));

  /* --- финальная композиция: солнце слева, по центру титры встают ровно из-за горизонта --- */
  const CP = new THREE.Vector3(0, 2.6, -21.5);
  const VD = SV.clone().setY(0).applyAxisAngle(new THREE.Vector3(0, 1, 0), mobile ? -0.17 : -0.3).normalize();   // взгляд финала: солнце левее центра
  const RT = new THREE.Vector3(-VD.z, 0, VD.x);                                                    // вправо от взгляда
  const at = (dist, side, y) => CP.clone().addScaledVector(VD, dist).addScaledVector(RT, side).setY(y);
  // титры — большой «щит» вдали по центру, поднимается из-за горизонта
  const CW = 1024, CH = 2400 + CREDITS.length * 128 + 420, links = []; let yEnd = CH;
  const credT = kit.canvasTex(CW, CH, (x, w, h) => {
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(120,40,0,.55)'; x.shadowBlur = 30;
    let y = 150;
    const line = (txt, size, c1 = '#ffffff', c2 = '#ffe2c4', gap = 1.25) => { kit.gradText(x, txt, w / 2, y + size / 2, size, c1, c2, { glow: 'rgba(255,170,110,.7)' }); y += size * gap; };
    const cap = (txt) => { x.shadowBlur = 18; x.font = `800 44px Manrope, sans-serif`; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(txt.toUpperCase().split('').join(String.fromCharCode(8202)), w / 2, y + 10); y += 140; };
    // мелкий текст: крупнее и с тёмной подложкой-тенью — раньше на светлом небе он терялся
    const small = (txt, size = 36, alpha = 0.92, weight = 700) => { x.save(); x.shadowColor = 'rgba(70,20,10,.85)'; x.shadowBlur = 16; x.font = `${weight} ${size}px Manrope, sans-serif`; x.fillStyle = `rgba(255,255,255,${alpha})`; x.fillText(txt, w / 2, y + size / 2, w - 40); x.fillText(txt, w / 2, y + size / 2, w - 40); x.restore(); y += size * 1.35; };
    line('STAYA', 230, '#ffffff', '#ffd1ee', 1.35);
    line('Проводим тусовки', 70); line('с 2020 года', 70, '#ffffff', '#ffe2c4', 2.2);
    line('100 500', 190, '#ffffff', '#ffe2c4', 1.0); cap('гостей');
    line('548', 190, '#ffffff', '#ffe2c4', 1.0); cap('мероприятий');
    line('124', 190, '#ffffff', '#ffe2c4', 1.0); cap('артиста');
    y += 40; line('Делаем рекламные', 70); line('кампании', 70, '#ffffff', '#ffe2c4', 1.6);
    line('и готовы', 70); line('к коллаборациям', 70, '#ffffff', '#ffe2c4', 2.6);
    // источники и лицензии: каждая строка — ссылка (клик по титрам открывает источник)
    small('ИСТОЧНИКИ И ЛИЦЕНЗИИ', 34, 0.75, 800); y += 18;
    for (const c of CREDITS) {
      const y0 = y; small(c.what, 42, 1); small(`${c.who} · ${c.lic}`, 34, 0.86, 600); y += 16;
      links.push({ y0, y1: y, href: c.url });
    }
    y += 90; const y0 = y;
    small(DEV.label, 40, 0.8, 600); line(DEV.name, 96, '#ffffff', '#ffd1ee', 1.2);
    links.push({ y0, y1: y, href: DEV.url }); yEnd = y + 20;
  });  credT.anisotropy = 8;
  const CDIST = 700, CWW = mobile ? 400 : 380, CHH = CWW * CH / CW;
  const cred = new THREE.Mesh(new THREE.PlaneGeometry(CWW, CHH), new THREE.MeshBasicMaterial({ map: credT, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  const cbase = CP.clone().addScaledVector(VD, CDIST);
  cred.position.copy(cbase); cred.lookAt(CP.x, cbase.y, CP.z); cred.userData.dynamic = true; cred.renderOrder = 1; scene.add(cred);
  // в конце титры замирают: ссылки на источники и тег разработчика — в верхней половине кадра, кнопки — под ними
  const below = (CH - yEnd) / CH * CHH;                                   // пустое поле под последней строкой
  const endBottom = CP.y + CDIST * Math.tan(THREE.MathUtils.degToRad(1.5)) - below;
  // линия горизонта на дистанции титров: луч из глаза к дальнему краю моря (море 3600×3600 с центром в 0)
  const toEdge = 1800 / Math.max(Math.abs(VD.x), Math.abs(VD.z)) - CP.clone().projectOnVector(VD).length() * Math.sign(CP.dot(VD));
  const yH = CP.y + (SEA - CP.y) * CDIST / toEdge;
  // всё, что ниже горизонта, срезается: титры выезжают именно из линии горизонта, а не из воды перед ней
  renderer.localClippingEnabled = true;
  cred.material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -yH)];
  const credY = (k) => (yH - CHH / 2) + (endBottom + CHH / 2 - (yH - CHH / 2)) * k;

  /* --- камера: пролёт сквозь виллу к морю и восходу --- */
  const far = (k) => SD.clone().multiplyScalar(k).toArray();
  const fin = (k) => CP.clone().addScaledVector(VD, k).setY(CP.y + k * 0.035).toArray();
  const keys = [
    // подъезд: между парковками с машинами, вдоль канала к входу
    { p: [0, 2.6, 58], l: [0, 2.6, 20], t: 0.0 },
    { p: [0, 2.2, 44], l: [0, 3, 10] },
    { p: [0, 1.95, 32], l: [0, 2.2, 10] },
    { p: [0, 1.8, 20], l: [0, 1.8, 4], t: 0.168 },
    { p: [0, 1.8, 14], l: [0, 1.7, 0], t: 0.21 },
    // гостиная: взгляд налево на камин, затем на видео-картину на стене перед диваном, потом направо — мольберт
    { p: [-0.6, 1.8, 11.8], l: [-13, 2.2, 9], t: 0.25 },
    { p: [-2.4, 1.8, 9.2], l: [-5, 2.4, 13.6], t: 0.295 },
    { p: [-0.4, 1.8, 6.8], l: [4.4, 1.5, 3.6], t: 0.345 },
    { p: [0, 1.8, 1.6], l: [0, 1.6, -12], t: 0.39 },
    // на террасу и сразу разворот налево — без взгляда на пейзаж
    { p: [0.2, 2.4, -3.6], l: [-14, 3.2, -12], t: 0.44 },
    { p: [-3.2, 3.8, -11], l: [-20, 5, 2], t: 0.49 },
    { p: [-6.4, 5.8, -17.5], l: [-4, 6.2, 4], t: 0.545 },
    // боковой пролёт вдоль террасы: бассейн на крыше → диджейская стойка с экраном → балкон
    { p: [-13, 7.3, -12.5], l: [-9, 5.6, 2], t: 0.61 },
    { p: [-2, 7.4, -11.5], l: [1, Y2 + 1.3, -2.7], t: 0.67 },
    { p: [9.5, 7.2, -12.5], l: [11.5, 5.8, -5], t: 0.72 },
    // разворот к морю — в восход
    { p: [5.5, 4.4, -18.5], l: far(600), t: 0.77 },
    { p: CP.toArray(), l: fin(1000), t: 0.83 },
    { p: CP.toArray(), l: fin(1000), t: 1 },
  ];
  const waters = [sea, pool, jac, canal, roof].map((w, i) => [w.material.normalMap, [0.006, 0.02, 0.03, 0.01, 0.02][i]]);
  const update = (t) => {
    const now = performance.now() / 1000;
    // волны: бегущая рябь на море и в бассейнах, блики на дне
    for (const [nm, v] of waters) nm.offset.set(now * v, now * v * 0.6);
    // шторы колышутся: волна вдоль ширины, сильнее внизу
    for (const c of curtains) {
      const p = c.m.geometry.attributes.position, b = c.base;
      for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], low = (2.15 - y) / 4.3; p.setZ(i, (Math.sin(x * 3.1 + now * 1.3 + c.ph) * 0.09 + Math.sin(x * 1.3 - now * 0.8) * 0.06) * (0.4 + low)); }
      p.needsUpdate = true;
    }
    const ck = Math.min(1, Math.max(0, (t - 0.82) / 0.16));
    cred.position.y = credY(ck); cred.visible = t > 0.8;
    if (!pv) return;
    const k = Math.min(1, Math.max(0, (t - 0.37) / 0.08));
    const e = k === 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
    const s = 0.05 + 0.95 * e; pv.scale.set(s, s, s);
  };
  // ссылки в титрах: доли высоты текстуры → v-координата плоскости
  const pick = { mesh: cred, links: links.map((l) => ({ v0: 1 - l.y1 / CH, v1: 1 - l.y0 / CH, href: l.href })), from: 0.9 };
  // предмет для сбора: кокос с зонтиком у мольберта
  addLoot(scene, 'coconut', 'coconut', [3.0, 1.35, 4.9], { r: 0.6 });
  return { scene, cam: kit.camPath(keys), update, pick, bloom: 0.12 };
}
