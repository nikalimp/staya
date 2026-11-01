// 05 · STAYA PHUKET — вилла на скале, инфинити-бассейн над морем, закат.
// Портал: камера перелетает через край бассейна и летит в солнце.
export function build({ THREE, kit, font, renderer }) {
  const { Builder, G, M, V } = kit;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#8a3a6a', 0.0042);
  scene.environment = kit.env(renderer, ['#ff8a3c', '#ff4f9a', '#6a3cff', '#ffd28a', '#2a1650'], '#2a1238');
  scene.add(kit.sky(['#ff9a4a', '#c43a7e', '#1a1446', 0.06]));
  scene.add(kit.stars(300, 400, 0.45, 9));
  const b = new Builder(), glows = [], R = kit.rng(41);
  const PUR = '#9a5cff', CY = '#2fe6ff';

  /* --- солнце, море, острова --- */
  const SUN = [0, 14, -330];
  const sun = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 16), new THREE.MeshBasicMaterial({ color: '#ffd08a', toneMapped: false, fog: false }));
  sun.position.set(...SUN); scene.add(sun);
  scene.add(kit.halo(SUN, 170, '#ff6a3a', 0.9)); scene.add(kit.halo(SUN, 70, '#ffd9a0', 0.8));
  const sea = kit.water(1200, 1200, '#3a1a5a', { tile: 22, ei: 0.08, rough: 0.12, metal: 0.55, ns: 0.35 });
  sea.position.y = -8; sea.material.fog = true; scene.add(sea);
  // солнечная дорожка
  const path = kit.canvasTex(64, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,200,120,.9)'); g.addColorStop(1, 'rgba(255,90,90,0)'); x.fillStyle = g; for (let y = 0; y < h; y += 6) { const ww = w * (0.3 + 0.7 * (1 - y / h)) * (0.6 + Math.random() * 0.4); x.fillRect((w - ww) / 2, y, ww, 3); } });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(60, 320), new THREE.MeshBasicMaterial({ map: path, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pm.rotation.x = -Math.PI / 2; pm.position.set(0, -7.9, -180); scene.add(pm);
  // карстовые острова Пхукета
  [[-90, -200, 38], [-150, -260, 52], [80, -230, 44], [140, -180, 30], [-40, -300, 26], [60, -310, 34], [-200, -150, 40], [210, -260, 60]].forEach(([x, z, h], i) => {
    b.add(G.sph(1, 14, 10), '#2a1636', 'matte', M([x, -8 + h * 0.4, z], [0, i, 0], [h * 0.42, h, h * 0.5]));
    b.add(G.sph(1, 12, 8), '#1f2a30', 'matte', M([x + 4, -8 + h * 1.05, z], [0, i, 0], [h * 0.36, h * 0.18, h * 0.4]));
  });

  /* --- скала и вилла --- */
  b.add(G.box(120, 40, 64), '#4a2e3e', 'matte', M([0, -20, 22]));
  for (let i = 0; i < 14; i++) b.add(G.ico(4 + R() * 6, 0), '#3e2636', 'matte', M([-55 + i * 8.5, -9 + R() * 3, -10 - R() * 3], [R(), R(), R()]), { flat: true });
  // деревянная палуба
  // деревянная палуба вокруг бассейна (бассейн x[-12,12], z[-10,2])
  b.add(G.box(48, 0.5, 16), '#9a6a48', 'plastic', M([0, -0.25, 10]));
  for (const sx of [-1, 1]) b.add(G.box(12, 0.5, 14), '#9a6a48', 'plastic', M([sx * 18, -0.25, -5]));
  for (let x = -23.5; x <= 23.5; x += 0.8) b.add(G.box(0.04, 0.02, 16), '#6a4430', 'matte', M([x, 0.01, 10]));
  // инфинити-бассейн
  b.add(G.box(24, 0.2, 12), '#1c7fb8', 'plastic', M([0, -1.7, -4]));
  for (const sx of [-1, 1]) b.add(G.box(0.3, 1.8, 12), '#2a8fc8', 'plastic', M([sx * 12.15, -0.9, -4]));
  b.add(G.box(24.6, 1.8, 0.3), '#2a8fc8', 'plastic', M([0, -0.9, 2.15]));
  for (const sx of [-1, 1]) b.add(G.box(0.5, 0.08, 12.6), '#efe8f2', 'gloss', M([sx * 12.25, 0.04, -4]));
  b.add(G.box(25, 0.08, 0.5), '#efe8f2', 'gloss', M([0, 0.04, 2.25]));
  b.add(G.box(24, 0.06, 0.06), PUR, 'neon', M([0, -0.12, -10.18]));
  b.add(G.box(24.4, 4, 0.4), '#3a2a44', 'plastic', M([0, -2.2, -10.4]));
  for (let x = -10; x <= 10; x += 4) glows.push([x, 0.1, -10.2, PUR, 1.6, 1.4], [x, 0.0, -4, CY, 3, 0.5]);
  // корпус виллы: z[6,20]
  const VW = '#f1ece6';
  b.add(G.box(28, 6.5, 12), VW, 'plastic', M([0, 3.25, 15]));
  b.add(G.box(20, 4, 13), VW, 'plastic', M([-3, 8.5, 13.5]));
  b.add(G.box(29, 0.4, 13), '#3a2e2a', 'plastic', M([0, 6.6, 15])); b.add(G.box(21, 0.5, 14.5), '#3a2e2a', 'plastic', M([-3, 10.75, 13.5]));
  for (let i = 0; i < 5; i++) { b.add(G.box(4.6, 5, 0.1), '#ffcf8a', 'neon', M([-11 + i * 5.5, 2.8, 8.95])); b.add(G.box(0.15, 5.4, 0.2), '#3a2e2a', 'plastic', M([-13.75 + i * 5.5, 2.8, 8.95])); }
  for (let i = 0; i < 3; i++) b.add(G.box(5.4, 3, 0.1), i === 1 ? '#ff7ac8' : '#ffd8a0', 'neon', M([-9 + i * 6, 8.5, 6.95]));
  glows.push([0, 3, 8.6, '#ffb36b', 16, 0.25]);
  // обратная и боковые стороны виллы: окна, сад, пальмы — для облёта
  for (let i = 0; i < 5; i++) b.add(G.box(4, 3.6, 0.1), i % 2 ? '#ffcf8a' : '#ff8ad0', 'neon', M([-11 + i * 5.5, 2.8, 21.05]));
  for (let i = 0; i < 3; i++) b.add(G.box(4.4, 2.2, 0.1), '#ffd8a0', 'neon', M([-9 + i * 6, 8.5, 20.05]));
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) b.add(G.box(0.1, 3.4, 3.6), '#ffcf8a', 'neon', M([sx * 14.05, 2.8, 11.5 + i * 6]));
  b.add(G.box(70, 0.3, 34), '#1f4a2e', 'plastic', M([0, -0.1, 38]));
  b.add(G.box(8, 0.35, 3), '#8a6a50', 'plastic', M([0, 0, 22.8]));
  [[-20, 28], [-8, 34], [6, 30], [18, 36], [26, 24], [-28, 40], [12, 44]].forEach(([x, z], i) => kit.palm(b, [x, 0, z], 9 + (i % 3) * 2, [(i % 2 ? 0.6 : -0.6), 0.3], { seed: i * 1.3, leaf: '#1a4a34', scale: 1.1 }));
  for (let i = 0; i < 18; i++) { const a2 = (i / 18) * Math.PI * 2; glows.push([Math.cos(a2) * 9, 0.4, 36 + Math.sin(a2) * 6, i % 2 ? '#ffb36b' : '#ff6fd0', 0.8, 1.6]); }

  kit.text3d(b, font, 'PHUKET', { size: 0.9, color: '#ff4fb8', p: [8.6, 7.6, 7.1], kind: 'neon', bevel: 0.0, depth: 0.08 });
  glows.push([8.6, 8, 7.3, '#ff4fb8', 6, 0.5]);
  // павильон с фиолетовой LED-крышей
  const PV = [-19, 0, -3];
  for (const dx of [-5.5, 5.5]) for (const dz of [-6, 6]) b.add(G.cyl(0.18, 0.18, 6, 10), '#e9e2ee', 'gloss', M([PV[0] + dx, 3, PV[2] + dz]));
  b.add(G.box(12.4, 0.5, 13.4), '#e9e2ee', 'gloss', M([PV[0], 6.25, PV[2]]));
  for (let x = -5; x <= 5; x += 1.25) b.add(G.box(0.06, 0.06, 12.4), PUR, 'neon', M([PV[0] + x, 5.95, PV[2]]));
  for (let z = -6; z <= 6; z += 1.5) b.add(G.box(11.4, 0.05, 0.05), '#d27cff', 'neon', M([PV[0], 5.96, PV[2] + z]));
  glows.push([PV[0], 5.6, PV[2], PUR, 14, 0.4]);
  kit.djBooth(b, [PV[0], 0, PV[2] - 3], Math.PI / 2 - 0.3, { w: 2.6, front: PUR, front2: '#ff4fb8' });
  kit.figure(b, { p: [PV[0] - 0.8, 0, PV[2] - 3.3], ry: Math.PI / 2 - 0.3, pose: 'dj', top: '#ffffff', bottom: '#d8c09a', hair: '#1a1210', glasses: true, i: 1 });
  [[-16, 1], [-18, 2.5], [-20.5, 1.2], [-15, -1.5], [-21, -0.8]].forEach(([x, z], i) => kit.figure(b, { p: [x, 0, z], ry: -Math.PI / 2 + (R() - 0.5), pose: kit.pick(['up', 'wave', 'hips', 'up'], i), swim: i % 2 === 0, top: kit.pick(['#ff7a3a', '#ffffff', '#ff4fb8', '#2fe6ff', '#ffd23f'], i), bottom: '#f4e8d8', hair: kit.pick(['#1a1210', '#e9c27a', '#3a2216'], i), longHair: i % 2 ? 0 : 2, i }));
  // шезлонги, зонты
  for (let i = 0; i < 6; i++) { const x = 14 + (i % 2) * 2.2, z = -8 + Math.floor(i / 2) * 3.4; kit.lounger(b, [x, 0, z], -Math.PI / 2 - 0.2, '#ffffff'); }
  for (let i = 0; i < 3; i++) { const z = -6.5 + i * 3.4; kit.rod(b, [17.4, 0, z], [17.4, 3, z], 0.05, '#ddd'); b.add(G.cone(1.8, 0.7, 14), '#f4e2c4', 'plastic', M([17.4, 3.1, z])); }
  kit.figure(b, { p: [14.2, 0.3, -1.2], ry: -Math.PI / 2 - 0.2, pose: 'behindHead', swim: true, top: '#ff4fb8', hair: '#e9c27a', longHair: 2, i: 0 });
  kit.figure(b, { p: [16.4, 0.3, -4.6], ry: -Math.PI / 2 - 0.2, pose: 'relax', swim: true, top: '#111', hair: '#1a1210', i: 2 });
  // люди в бассейне
  [[-9, -6], [-6.5, -2.5], [8.5, -7.5], [9.5, -3], [-8.5, -8.6]].forEach(([x, z], i) => kit.figure(b, { p: [x, -1.1, z], ry: Math.PI + (R() - 0.5) * 1.5, pose: i % 2 ? 'up' : 'wave', swim: true, top: kit.pick(['#ff7a3a', '#ffffff', '#ff4fb8', '#2fe6ff', '#ffd23f'], i + 2), hair: kit.pick(['#1a1210', '#e9c27a', '#3a2216'], i), longHair: 2, i }));
  kit.ring(b, [-8, 0.02, -2], '#ffd23f', 0.6, 0.22); kit.ring(b, [5, 0.02, -1.5], '#ffffff', 0.55, 0.2);
  kit.flamingo(b, [9, -0.1, -6.5], 0.8, -2.4);
  // пальмы
  [[-24, -11], [-26, 6], [24, -11], [22, 4], [-11, 10.5], [13, 11], [26, -2], [-30, -3], [30, 8]].forEach(([x, z], i) => kit.palm(b, [x, 0, z], 8 + (i % 3) * 2, [(i % 2 ? 0.7 : -0.7), -0.4], { seed: i * 0.7, leaf: '#1a4a34', scale: 1.15 }));
  // факелы вдоль края
  for (const x of [-22, -14, 14, 22]) { kit.rod(b, [x, 0, -11.5], [x, 2.2, -11.5], 0.06, '#3a2a20', 'matte'); glows.push([x, 2.45, -11.5, '#ffa04a', 1.3, 2]); }

  /* --- свет --- */
  scene.add(new THREE.HemisphereLight('#ff9a6a', '#2a1240', 0.95));
  const dl = new THREE.DirectionalLight('#ff8a4a', 1.4); dl.position.set(0, 20, -100); scene.add(dl);
  const L = (c, i, p, d = 50) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); };
  L(CY, 160, [0, 0.6, -4], 20); L(PUR, 320, [PV[0], 5, PV[2]], 26); L('#ffb36b', 200, [0, 4, 6], 24);
  scene.add(kit.glowPoints(glows));
  scene.add(b.build());
  const w = kit.water(24, 12, '#2bb6e8', { tile: 4, ei: 0.45, emissive: '#1a8fd0', opacity: 0.88 });
  w.position.set(0, -0.06, -4); scene.add(w);

  /* --- камера: облёт виллы по кругу и влёт в дом --- */
  const C = [0, 4, 8], RR = 40, a0 = -0.55, a1 = Math.PI * 2;
  const orb = (a, h) => [C[0] + Math.sin(a) * RR, h, C[2] - Math.cos(a) * RR];
  const keys = [];
  const n = 11;
  for (let k = 0; k <= n; k++) {
    const u = k / n, a = a0 + (a1 - a0) * u;
    keys.push({ p: orb(a, 21 - 7 * u), l: [C[0], C[1] + 1 - u, C[2]], t: k === 0 ? 0 : k === n ? 0.72 : undefined });
  }
  keys.push(
    { p: [0, 6, -14], l: [0, 3, 9] },
    { p: [0, 3, -3], l: [0, 2.8, 9], t: 0.88 },
    { p: [0, 2.8, 5.5], l: [0, 2.8, 12] },
    { p: [0, 2.8, 8.6], l: [0, 2.8, 12], t: 1 },
  );
  return { scene, cam: kit.camPath(keys) };
}
