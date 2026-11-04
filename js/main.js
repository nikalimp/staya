// STAYA — движок путешествия.
// Скролл двигает камеру по пути внутри сцены. На экране нет интерфейса — только полёт.
// Стыки сцен двух видов: 'black' — уход в чёрный; 'cut' — монтажная склейка по совпадающему кадру.
// Кадр рисуется только когда камера сдвинулась: сцены статичны, телефон не греется.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as kit from './kit.js';
import { startHeadTrack } from './headtrack.js';
import { makeSfx } from './sfx.js';
import { lootAt, lootTick, collect, lootCount, LOOT_TOTAL } from './loot.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const SCENES = [
  { id: 'aqua', load: () => import('./scenes/aqua.js'), track: 'music/01-aqua.mp3', w: 1.7, out: 'water', sfx: [[0.02, 'whoosh'], [0.2, 'whoosh'], [0.93, 'whoosh'], [0.97, 'splash']] },
  { id: 'pool', load: () => import('./scenes/pool.js'), track: 'music/03-pool.mp3', w: 1.8, out: 'strobe', sfx: [[0.0, 'bubbles'], [0.04, 'splash'], [0.36, 'splash'], [0.94, 'chime']] },
  { id: 'club', load: () => import('./scenes/club.js'), track: 'music/02-2k17.mp3', w: 1.6, out: 'cut', sfx: [[0.02, 'chime'], [0.97, 'door']] },
  { id: 'halloween', load: () => import('./scenes/halloween.js'), track: 'music/04-halloween.mp3', w: 1.3, out: 'cut', sfx: [[0.93, 'whoosh']] },
  { id: 'phuket', load: () => import('./scenes/phuket.js'), track: 'music/05-phuket.mp3', w: 2.6, out: null, final: 0.975, sfx: [[0.7, 'whoosh'], [0.81, 'chime']] },
];
// Кнопки финала. Пустой href — кнопка не показывается.
const LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/stayaekb/', cls: 'main' },
  { label: 'Telegram', href: 'https://t.me/+JP1gsoNXGpkzZDIy' },
  { label: 'VK', href: 'https://vk.ru/stayaekb' },
  { label: 'Почта', href: 'mailto:contact@stayaekb.ru' },
];

const N = SCENES.length;
const VH_PER_UNIT = 6;
const FADE = 0.06;
const isTouch = matchMedia('(pointer: coarse)').matches;
const mobile = isTouch || innerWidth <= 860;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEBUG = new URLSearchParams(location.search).has('debug');
if (/[?&]nobake/.test(location.search)) globalThis.__noBake = true;   // отладка: исходная геометрия без запечённого света
if (mobile) document.documentElement.classList.add('touch');

const $ = (s) => document.querySelector(s);
const canvas = $('#gl'), fadeEl = $('#fade'), pctEl = $('#pct'), arc = $('#arc'), ring = $('#ring'), pre = $('#pre');
const spacer = $('#spacer'), finalEl = $('#final'), sndBtn = $('#snd'), headBtn = $('#head'), hintEl = $('#hint');
LINKS.filter((l) => l.href).forEach((l) => {
  const a = document.createElement('a'); a.href = l.href; a.textContent = l.label; if (l.cls) a.className = l.cls;
  if (l.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
  finalEl.querySelector('.row').appendChild(a);
});

/* ---------- рендерер и уровень качества ---------- */
// Три уровня: low — слабые телефоны, mid — телефоны и ноутбуки без отдельной видеокарты, high — десктоп.
// Уровень задаёт плотность пикселей, размер запечённых текстур, bloom, сглаживание и видео на экранах.
// Выбор: по видеокарте и памяти при старте; через 4 секунды после старта — проверка реальной частоты кадров.
const TIERS = {
  low: { pr: 1, tex: '-s', bloom: false, aa: false, video: false, aniso: 1 },
  mid: { pr: 1.5, tex: '-m', bloom: false, aa: false, video: true, aniso: 2 },
  high: { pr: 2, tex: '', bloom: true, aa: true, video: true, aniso: 4 },
};
const TIER_ORDER = ['low', 'mid', 'high'];
function detectTier(gl) {
  const q = new URLSearchParams(location.search).get('q'); if (q in TIERS) return q;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info'); const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '');
  const mem = navigator.deviceMemory ?? 8, cores = navigator.hardwareConcurrency ?? 8, maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const weak = /Mali-4|Mali-T|Mali-G5[0-2]|Adreno \(TM\) [3-5]|PowerVR|Apple A(7|8|9|10)\b|Intel\(R\) HD|UHD Graphics 6[0-2]|SwiftShader/i.test(gpu);
  if (mobile) return weak || mem <= 3 || cores <= 4 || maxTex < 4096 ? 'low' : 'mid';
  return weak || mem <= 4 ? 'mid' : 'high';
}
const probe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
// без WebGL или по ссылке ?lite — лёгкая версия: лента миров с кадрами и текстом (та же разметка, что для поисковиков)
const LITE = !probe || new URLSearchParams(location.search).has('lite');
if (LITE) { document.documentElement.classList.add('lite'); document.body.classList.remove('locked'); }
let tier = probe ? detectTier(probe) : 'low';
let quality = TIERS[tier];
const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.aa, powerPreference: 'high-performance' });
kit.useRenderer(renderer); kit.setQuality(quality);
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pr));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 1);
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 2000);
// десктоп: настоящее свечение неона и солнца (bloom); телефон — лёгкие ореолы-спрайты без постобработки
let composer = null, renderPass = null, bloomPass = null, vigPass = null;
if (quality.bloom) {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(new THREE.Scene(), camera);
  composer.addPass(renderPass);
  composer.addPass(bloomPass = new UnrealBloomPass(new THREE.Vector2(1024, 1024), 0.42, 0.5, 0.9));
  // виньетка и лёгкий расфокус по краям кадра (центр резкий)
  composer.addPass(vigPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAspect: { value: 1 }, uRGB: { value: 0 }, uZoom: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    // края: лёгкий расфокус; uZoom — радиальное смазывание от скорости прокрутки; uRGB — расслоение цветов (скорость, VHS в 2K17)
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAspect, uRGB, uZoom; varying vec2 vUv;
      void main(){
        vec2 d = vUv - 0.5; d.x *= uAspect; float r = length(d);
        float k = smoothstep(0.5, 0.98, r);
        vec2 dir = (vUv - 0.5) * (0.0032 * k + uZoom * smoothstep(0.1, 0.8, r));
        vec4 c = vec4(0.0);
        for (int i = 0; i < 8; i++) c += texture2D(tDiffuse, vUv - dir * float(i));
        c /= 8.0;
        if (uRGB > 0.0) { vec2 o = (vUv - 0.5) * uRGB; c.r = texture2D(tDiffuse, vUv + o).r; c.b = texture2D(tDiffuse, vUv - o).b; }
        c.rgb *= mix(1.0, 0.42, smoothstep(0.38, 0.95, r));
        gl_FragColor = c;
      }`,
  }));
  composer.addPass(new OutputPass());
}

let VH = innerHeight, lastW = innerWidth, glowScale = 600, dirty = true, baseFov = 60;
const totalW = SCENES.reduce((a, s) => a + s.w, 0);
const cum = []; SCENES.reduce((a, s, i) => ((cum[i] = a), a + s.w), 0);
const lidsEl = document.getElementById('lids'); let lastSq = -1;
const fovFor = (aspect) => (aspect < 0.8 ? 72 : aspect < 1.2 ? 64 : 54);
function layout() {
  const w = innerWidth, h = isTouch ? Math.max(VH, innerHeight) : innerHeight;
  renderer.setSize(w, h, false); canvas.style.height = h + 'px';
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); vigPass.uniforms.uAspect.value = w / h; }
  camera.aspect = w / h; camera.fov = baseFov = fovFor(camera.aspect); camera.updateProjectionMatrix();
  glowScale = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  kit.glowMats.forEach((m) => (m.uniforms.uScale.value = glowScale));
  spacer.style.height = (totalW * VH_PER_UNIT * VH + VH) + 'px';
  dirty = true;
}
addEventListener('resize', () => { if (isTouch && innerWidth === lastW) return; lastW = innerWidth; VH = innerHeight; layout(); });
addEventListener('orientationchange', () => setTimeout(() => { lastW = innerWidth; VH = innerHeight; layout(); }, 250));

/* ---------- проверка частоты кадров: если кадр идёт дольше 28 мс, уровень качества опускается на ступень ---------- */
const fps = { t: 0, n: 0, slow: 0, done: false, start: 0 };
function fpsSample() {
  if (fps.done || !started) return;
  const now = performance.now();
  if (!fps.start) { fps.start = now; fps.t = now; return; }
  const dt = now - fps.t; fps.t = now;
  if (dt > 250) return;                         // пауза (вкладка, загрузка) — не считаем
  fps.n++; if (dt > 28) fps.slow++;
  if (now - fps.start < 4000 || fps.n < 60) return;
  fps.done = true;
  if (fps.slow / fps.n > 0.35 && tier !== 'low') setTier(TIER_ORDER[TIER_ORDER.indexOf(tier) - 1]);
  else if (fps.slow / fps.n > 0.6) { lootEl.innerHTML = 'Тормозит? Есть <a href="?lite" style="color:#ffd1ee">лёгкая версия</a>'; lootEl.style.pointerEvents = 'auto'; lootEl.classList.add('on'); setTimeout(() => { lootEl.classList.remove('on'); lootEl.style.pointerEvents = ''; }, 8000); }
  if (DEBUG) console.log(`[staya] fps check: ${fps.n} frames, ${(100 * fps.slow / fps.n).toFixed(0)}% slow → tier ${tier}`);
}
// понижение уровня на лету: меньше пикселей и без bloom (текстуры остаются загруженными)
function setTier(t) {
  tier = t; quality = TIERS[t]; kit.setQuality(quality);
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pr));
  if (!quality.bloom && composer) { composer.dispose?.(); composer = null; bloomPass = null; vigPass = null; }
  layout();
}

/* ---------- сцены ---------- */
const built = new Map(), building = new Map();
let font;
async function buildScene(i) {
  if (built.has(i)) return built.get(i);
  if (building.has(i)) return building.get(i);
  const p = (async () => {
    const mod = await SCENES[i].load();
    const t0 = performance.now();
    const res = await mod.build({ THREE, kit, font, renderer, mobile, quality });
    res.scene.traverse((o) => { if ((o.isMesh || o.isPoints) && !o.userData.dynamic) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
    res.scene.updateMatrixWorld(true);
    // одинаковые неподвижные предметы (пальмы, колонны, лежаки) рисуются одним вызовом
    kit.instanceStatic(res.scene);
    kit.glowMats.forEach((m) => (m.uniforms.uScale.value = glowScale));
    // шейдеры компилируются параллельно (KHR_parallel_shader_compile); видео сцены грузятся позже, при входе в неё
    await (renderer.compileAsync ? renderer.compileAsync(res.scene, camera).catch(() => {}) : Promise.resolve(renderer.compile(res.scene, camera)));
    if (DEBUG) console.log(`[staya] ${SCENES[i].id} built in ${(performance.now() - t0).toFixed(0)} ms`);
    built.set(i, res); building.delete(i);
    if (i === curIdx) kit.playVideos(res.scene);   // сцена догрузилась, когда мы уже в ней
    // превью следующей сцены (фото в телефоне во дворце)
    const prev = built.get(i - 1); if (prev?.preview) renderPreview(prev, res);
    if (res.preview && built.has(i + 1)) renderPreview(res, built.get(i + 1));
    return res;
  })();
  p.catch((e) => { console.error('[staya] scene', SCENES[i].id, e); setTimeout(() => building.delete(i), 3000); });
  building.set(i, p);
  return p;
}
// Рендерим первый кадр следующей сцены в текстуру — это «фотография» в соцсети
function renderPreview(owner, next, again = false) {
  if (owner.previewDone && !again) return;
  const { mesh, t = 0 } = owner.preview, w = mobile ? 768 : 1280, h = w;
  const rt = owner.scene.userData.rt ?? new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace, samples: mobile ? 0 : 4 });
  const cam = new THREE.PerspectiveCamera(owner.preview.fov ?? fovFor(w / h), w / h, 0.05, 2000);
  const c = next.cam(t); cam.position.copy(c.p); cam.lookAt(c.l);
  const keep = [...kit.glowMats].map((m) => m.uniforms.uScale.value);
  kit.glowMats.forEach((m) => (m.uniforms.uScale.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))));
  next.update?.(t);
  renderer.setRenderTarget(rt); renderer.render(next.scene, cam); renderer.setRenderTarget(null);
  [...kit.glowMats].forEach((m, k) => (m.uniforms.uScale.value = keep[k] ?? glowScale));
  mesh.material.map = rt.texture; mesh.material.needsUpdate = true;
  owner.scene.userData.rt = rt; owner.previewDone = true; dirty = true;
}
// Загрузка: прелоадер ждёт первые две сцены, остальные грузятся следом по порядку и остаются в памяти.
// prefetch — страховка, если зритель обогнал фоновую загрузку.
// Сцены на две и больше позади (и дальше двух впереди при скролле назад) выгружаются из памяти и при возврате собираются снова.
const AHEAD = 2;
function prefetch(i) { for (let k = 1; k <= AHEAD; k++) if (i + k < N && !built.has(i + k)) idle(() => buildScene(i + k)); }

/* ---------- скролл → позиция ---------- */
function scrollToG(y) {
  const u = Math.min(totalW, Math.max(0, y / (VH_PER_UNIT * VH)));
  let i = 0; while (i < N - 1 && u >= cum[i + 1]) i++;
  return i + Math.min(0.99999, (u - cum[i]) / SCENES[i].w);
}
function gToScroll(g) { const i = Math.min(N - 1, Math.floor(g)); return (cum[i] + (g - i) * SCENES[i].w) * VH_PER_UNIT * VH; }

let previewTick = false, speedK = 0;
let cur = 0, target = 0, lastG = -1, curIdx = -1, started = false, jumping = false;
// Стык 'black' уходит в чёрный, 'water' — в синеву воды (нырок AQUA → выныривание в POOL), 'cut' — склейка без затемнения
const FADE_COLOR = { black: '#000', water: '#0a5f8f', white: '#fff', strobe: '#fff' };
// нырок AQUA → POOL снят в самих сценах (пузыри, толща воды), заливка только склеивает кадры
const FADE_LEN = { water: 0.014 };
function blackAt(i, t) {
  let k = 0, c = '#000';
  const inT = i === 0 ? 'black' : SCENES[i - 1].out, outT = SCENES[i].out;
  const fi = FADE_LEN[inT] ?? FADE, fo = FADE_LEN[outT] ?? FADE;
  if (FADE_COLOR[inT] && t < fi) { k = 1 - t / fi; c = FADE_COLOR[inT]; }
  if (FADE_COLOR[outT] && t > 1 - fo) { k = (t - (1 - fo)) / fo; c = FADE_COLOR[outT]; }
  if (fadeEl.dataset.c !== c) { fadeEl.style.background = c; fadeEl.dataset.c = c; }
  // стробоскоп на входе в 2K17: белая заливка мигает 12 раз в секунду
  const st = (t < fi && inT === 'strobe') || (t > 1 - fo && outT === 'strobe');
  if (st && k > 0 && !reduced) { k = k * (Math.sin(performance.now() / 1000 * Math.PI * 24) > 0 ? 1 : 0.08); dirty = true; }
  return Math.max(0, Math.min(1, k));
}
function apply(g) {
  const i = Math.min(N - 1, Math.floor(g)), t = g - i;
  const s = built.get(i);
  if (!s) { fadeEl.style.opacity = 1; fadeEl.classList.add('wait'); buildScene(i).then(() => (dirty = true)); return false; }
  fadeEl.classList.remove('wait');
  // сцена может сама погасить свет (мистика во дворце) и выключить музыку
  const fk = blackAt(i, t), dk = s.dark?.(t) ?? 0;
  if (dk > fk && fadeEl.dataset.c !== '#000') { fadeEl.style.background = '#000'; fadeEl.dataset.c = '#000'; }
  fadeEl.style.opacity = Math.max(fk, dk).toFixed(3);
  audio.music(!(s.mute?.(t)));
  s.update?.(t);
  const nr = s.near?.(t) ?? 0.05;
  if (camera.near !== nr) { camera.near = nr; camera.updateProjectionMatrix(); }
  const c = s.cam(t);
  camera.position.copy(c.p);
  camera.lookAt(c.l);
  if (s.roll) camera.rotateZ(s.roll(t));
  // операторская пластика: крен в поворотах (как у стедикама) и едва заметное «дыхание» камеры в покое
  camera.rotateZ(bankAt(s, t));
  if (!reduced) { const bt = performance.now() / 1000, cw0 = 1 - (s.calm?.(t) ?? 0); camera.translateY(Math.sin(bt * 0.9) * 0.012 * cw0); camera.rotateX(Math.sin(bt * 0.7 + 1) * 0.0035 * cw0); camera.rotateZ(Math.sin(bt * 0.5 + 2) * 0.003 * cw0); }
  // погружение: камера чуть поворачивается за головой зрителя, кивки в такт качают сцену
  // сдвиг головы — как взгляд в окно (камера уходит в обратную сторону), поворот головы — камера смотрит туда же
  // у переходов (телефон, стакан) кадр центрируется: влияние головы и курсора плавно гаснет
  const cw = 1 - (s.calm?.(t) ?? 0), hx = head.x * cw, hy = head.y * cw, hyaw = head.yaw * cw, hp = head.pitch * cw;
  const sq = s.squint?.(t) ?? 0;   // «прищур»: сцена просит приблизить дальний объект
  const fv = baseFov * (1 - 0.42 * sq) * (1 - Math.max(-0.6, Math.min(1, head.z * cw)) * 0.2) * (1 + speedK * 0.07);   // зритель ближе к экрану — кадр приближается; быстрая прокрутка — кадр чуть растягивается
  if (sq !== lastSq) { lastSq = sq; lidsEl.style.setProperty('--sq', sq.toFixed(3)); }
  if (Math.abs(camera.fov - fv) > 1e-3) { camera.fov = fv; camera.updateProjectionMatrix(); }
  if (hx || hy || hyaw || hp) {
    // сдвиг головы → камера сдвигается туда же и чуть поворачивается вслед; поворот головы → камера смотрит туда же
    camera.translateX(hx * 0.55); camera.translateY(hy * 0.4);
    camera.rotateY(-hx * 0.16 - hyaw * 0.3); camera.rotateX(hy * 0.12 + hp * 0.2);
  }
  // сила свечения задаётся сценой: на светлом рассвете слабее, иначе небо засвечивает титры
  lootTick(s.scene, performance.now() / 1000, camera); kit.tickTime(performance.now() / 1000);
  touchTick(s, t);
  // живое превью следующей сцены в телефоне (дворец → вилла)
  // (через кадр: кадр виллы почти неподвижен, а рендер второй сцены дорогой)
  if (s.preview?.live?.(t) && built.has(i + 1) && (previewTick = !previewTick)) { renderPreview(s, built.get(i + 1), true); dirty = true; }
  fpsSample();
  if (composer) {
    renderPass.scene = s.scene; bloomPass.strength = (s.bloom ?? 0.42) * (1 + 0.3 * kit.pulse.beat);
    vigPass.uniforms.uZoom.value = speedK * 0.011; vigPass.uniforms.uRGB.value = speedK * 0.007;
    composer.render();
  } else renderer.render(s.scene, camera);
  if (i !== curIdx) { if (curIdx >= 0 && started) audio.fx?.rumble(); curIdx = i; audio.go(i); prefetch(i); kit.playVideos(s.scene); if (started) history.replaceState(null, '', '#' + SCENES[i].id); }
  audio.space(camera, s.scene.userData.stage);
  const fin = i === N - 1 && t > (SCENES[i].final ?? 0.72);
  finalEl.classList.toggle('on', fin);
  if (fin && !finalShown) { finalShown = true; if (lootCount() >= LOOT_TOTAL) confetti(); }
  return true;
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));

/* ---------- клавиатура: ↑ / W — вперёд по траектории, ↓ / S — назад (как в играх) ---------- */
const keyDir = { ArrowUp: 1, KeyW: 1, ArrowDown: -1, KeyS: -1 };
const held = new Set();
addEventListener('keydown', (e) => {
  if (!started || e.metaKey || e.ctrlKey || e.altKey || !(e.code in keyDir) || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  e.preventDefault(); held.add(e.code);
});
addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => held.clear());
let keyVel = 0;
function keyScroll() {
  let dir = 0; for (const c of held) dir += keyDir[c];
  dir = Math.sign(dir);
  // плавный разгон и торможение; скорость — доля высоты окна за кадр
  keyVel += (dir * innerHeight * 0.022 - keyVel) * 0.12;
  if (Math.abs(keyVel) > 0.3) scrollBy(0, keyVel); else keyVel = 0;
}

function loop() {
  keyScroll();
  target = scrollToG(scrollY);
  if (reduced || jumping) cur = target;
  else {
    // адаптивный темп: при быстрой прокрутке камера не отстаёт (срезает путь), при медленной — плавно доезжает
    const d = target - cur, fast = Math.min(1, Math.abs(d) / 0.4);
    cur += Math.sign(d) * Math.min(Math.abs(d) * (0.12 + 0.1 * fast), 0.02 + 0.04 * fast);
    if (Math.abs(target - cur) < 1e-5) cur = target;
  }
  {
    let moved = 0;
    for (const q of HQ) {
      const to = head.tgt[q], d = to - head[q];
      if (Math.abs(d) > 0.0005) { head[q] += d * 0.075; moved = 1; } else head[q] = to;
    }
    if (moved) dirty = true;
  }
  {
    // скорость прокрутки (доля сцены за кадр) → растяжение кадра и смазывание по краям
    const v = lastG >= 0 && !jumping ? Math.min(1, Math.abs(cur - lastG) / 0.012) : 0;
    const sk = speedK + (v - speedK) * (v > speedK ? 0.25 : 0.08);
    if (Math.abs(sk - speedK) > 1e-4) { speedK = sk < 1e-3 ? 0 : sk; dirty = true; }
    // ритм музыки → неон, лучи, огни, свечение
    if (started) { const b = audio.beat(); if (Math.abs(b - kit.pulse.beat) > 0.004) { kit.pulse.apply(b); dirty = true; } }
  }
  if (started && cur > lastG && lastG >= 0 && audio.on && audio.fx) {
    // звуковые эффекты: срабатывают, когда скролл проходит точку вперёд
    for (let i = Math.floor(lastG); i <= Math.min(N - 1, Math.floor(cur)); i++) for (const [t, k] of SCENES[i].sfx || []) { const g = i + t; if (g > lastG && g <= cur) audio.fx[k]?.(); }
  }
  if (started && curIdx >= 0 && built.has(curIdx) && kit.videosPlaying(built.get(curIdx).scene)) dirty = true;
  if (started && (cur !== lastG || dirty)) { if (apply(cur)) { lastG = cur; dirty = false; } }
  requestAnimationFrame(loop);
}
function tweenScroll(toY, ms = 1400) {
  const from = scrollY, t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo(0, from + (toY - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- ссылки в 3D-титрах: клик по строке открывает источник ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function linkAt(ev) {
  const i = curIdx, s = built.get(i), pk = s?.pick; if (!pk || !pk.mesh.visible || lastG - i < pk.from) return null;
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / canvas.clientHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(pk.mesh, false)[0]; if (!hit?.uv) return null;
  return pk.links.find((l) => hit.uv.y >= l.v0 && hit.uv.y <= l.v1) || null;
}
/* ---------- предметы для сбора: нажатие подбирает, всплывает счётчик ---------- */
function lootUnder(ev) {
  const s = built.get(curIdx); if (!s) return null;
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / canvas.clientHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera); return lootAt(ray, s.scene);
}
const lootEl = $('#loot'); let lootTimer = 0;
/* ---------- финал: счёт предметов, картинка для шеринга, конфетти за 8/8 ---------- */
const scoreEl = document.createElement('p'); scoreEl.className = 'score'; finalEl.prepend(scoreEl);
const shareBtn = document.createElement('button'); shareBtn.type = 'button'; shareBtn.className = 'share'; shareBtn.textContent = 'Поделиться'; finalEl.querySelector('.row').prepend(shareBtn);
function scoreText() {
  const n = lootCount();
  scoreEl.innerHTML = n > LOOT_TOTAL ? `<b>${LOOT_TOTAL}/${LOOT_TOTAL} ★</b> — стикерпак твой, и ты нашёл тайную звезду`
    : n >= LOOT_TOTAL ? `<b>${n}/${LOOT_TOTAL}</b> — стикерпак твой! Покажи этот экран на тусовке СТАИ`
    : n ? `<b>${n}/${LOOT_TOTAL}</b> собрано — вернись и найди остальные` : `Собери <b>${LOOT_TOTAL}</b> предметов по пути — получишь стикерпак`;
}
scoreText();
// картинка 1080×1350: «STAYA WORLD · собрано N/8 · staya.nikalimp.ru»
function shareImage() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d'), n = lootCount();
  const bg = x.createLinearGradient(0, 0, 0, 1350); bg.addColorStop(0, '#12041a'); bg.addColorStop(1, '#3a0a3a'); x.fillStyle = bg; x.fillRect(0, 0, 1080, 1350);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.6})`; x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 1350, Math.random() * 2.2, 0, 7); x.fill(); }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const grad = (y0, y1) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#ff5fc0'); g.addColorStop(1, '#c2187f'); return g; };
  x.shadowColor = 'rgba(255,63,180,.6)'; x.shadowBlur = 40;
  x.font = '900 190px Unbounded, Arial Black, sans-serif'; x.fillStyle = grad(330, 520); x.fillText('STAYA', 540, 430); x.fillText('WORLD', 540, 610);
  x.shadowBlur = 0; x.font = '800 34px Unbounded, sans-serif'; x.fillStyle = '#ffd1ee'; x.fillText('B-DAY 8 YEARS', 540, 720);
  x.font = '900 120px Unbounded, sans-serif'; x.fillStyle = n >= LOOT_TOTAL ? '#ffd84a' : '#ffffff'; x.fillText(n > LOOT_TOTAL ? `${LOOT_TOTAL}/${LOOT_TOTAL} ★` : `${n}/${LOOT_TOTAL}`, 540, 900);
  x.font = '700 40px Manrope, sans-serif'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText(n >= LOOT_TOTAL ? 'все предметы собраны — стикерпак мой' : 'предметов собрано', 540, 990);
  x.font = '700 36px Manrope, sans-serif'; x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText('staya.nikalimp.ru', 540, 1240);
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
}
shareBtn.addEventListener('click', async () => {
  const blob = await shareImage(); if (!blob) return;
  const file = new File([blob], 'staya-world.jpg', { type: 'image/jpeg' }), text = `STAYA WORLD — собрано ${lootCount()}/${LOOT_TOTAL}`;
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text, url: location.origin }); return; } catch (e) { /* отмена */ }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'staya-world.jpg'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
// конфетти: холст поверх всего, 160 частиц, 3 секунды
function confetti() {
  if (reduced) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext('2d'), P = Array.from({ length: 160 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 11, r: 4 + Math.random() * 6, a: Math.random() * 6, c: ['#ff3fb4', '#2fe6ff', '#ffd84a', '#ffffff'][Math.random() * 4 | 0] }));
  const t0 = performance.now();
  (function f() { const k = (performance.now() - t0) / 1000; x.clearRect(0, 0, c.width, c.height);
    for (const p of P) { p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.a += 0.15; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.globalAlpha = Math.max(0, 1 - (k - 2) / 1); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
    if (k < 3) requestAnimationFrame(f); else c.remove(); })();
}
let finalShown = false;
function lootToast(n) {
  const done = n >= LOOT_TOTAL;
  if (done) confetti();
  scoreText();
  lootEl.classList.toggle('done', done);
  lootEl.innerHTML = n > LOOT_TOTAL ? `<b>★</b> Тайный предмет найден! Ты видишь больше других`
    : done ? `<b>${n}/${LOOT_TOTAL}</b> — все предметы собраны!<br>Приходи на любую тусовку СТАИ и забирай стикерпак в подарок`
    : `<b>${n}/${LOOT_TOTAL}</b> собрано`;
  lootEl.classList.add('on'); clearTimeout(lootTimer); lootTimer = setTimeout(() => lootEl.classList.remove('on'), done ? 9000 : 2600);
}
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') canvas.style.cursor = linkAt(e) || lootUnder(e) ? 'pointer' : ''; });
canvas.addEventListener('click', (e) => {
  const it = lootUnder(e);
  if (it) { const n = collect(it, performance.now() / 1000); audio.fx?.chime(); lootToast(n); dirty = true; return; }
  const l = linkAt(e); if (l) window.open(l.href, '_blank', 'noopener');
});

/* ---------- погружение: слежение за головой (только десктоп) ---------- */
// tgt — последние значения с камеры (~18 раз в секунду), x/y/yaw/pitch — плавно догоняют их каждый кадр
/* ---------- крен камеры в поворотах ---------- */
// смотрим, как меняется курс камеры чуть дальше по пути; поворот направо → лёгкий наклон кадра направо (до 2°), сглажено
let bank = 0;
const _d1 = new THREE.Vector3(), _d2 = new THREE.Vector3(), _p1 = new THREE.Vector3();
function bankAt(s, t) {
  let want = 0;
  if (!reduced && t < 0.996) {
    const a = s.cam(t); _d1.copy(a.l).sub(a.p); _p1.copy(a.p);
    const b = s.cam(t + 0.004); _d2.copy(b.l).sub(b.p);
    const y1 = Math.atan2(_d1.x, _d1.z), y2 = Math.atan2(_d2.x, _d2.z); let dy = y2 - y1; if (dy > Math.PI) dy -= 2 * Math.PI; if (dy < -Math.PI) dy += 2 * Math.PI;
    const moving = _p1.distanceTo(b.p) > 0.02;   // стоя на месте (вращение на танцполе) крена нет
    want = moving ? Math.max(-0.035, Math.min(0.035, -dy * 0.9)) * (1 - (s.calm?.(t) ?? 0)) : 0;
  }
  bank += (want - bank) * 0.06; return bank;
}

/* ---------- отклик мира: курсор на десктопе, наклон на телефоне ---------- */
// ptr — положение «пальца» на экране (−1…1); его движение даёт ветер, луч из камеры — точку касания в мире
const ptr = { x: 0, y: 0, on: false, vx: 0, vy: 0, t: 0, lx: 0, ly: 0 };
const _sv = new THREE.Vector3();
const _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2(), _plane = new THREE.Plane(), _hit = new THREE.Vector3(), _wp = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
let stillT = 0;
function touchTick(s, t) {
  const now = performance.now(); const dt = Math.min(0.1, (now - (ptr.t || now)) / 1000); ptr.t = now;
  // ветер: от скорости курсора, затухает за ~1,5 с
  const decay = Math.exp(-dt * 1.8);
  kit.touch.wind.x = kit.touch.wind.x * decay + ptr.vx * 0.9; kit.touch.wind.y = kit.touch.wind.y * decay + ptr.vy * 0.9; ptr.vx = ptr.vy = 0;
  // «гость разглядывает»: камера стоит дольше 1,2 с → dwell → 1
  stillT = speedK > 0.02 ? 0 : stillT + dt; const dw = Math.min(1, Math.max(0, (stillT - 1.2) / 1.5));
  kit.touch.dwell += (dw - kit.touch.dwell) * Math.min(1, dt * 2);
  // точка касания: луч из камеры через курсор; по воде — пересечение с её плоскостью, иначе точка на луче в 10 м
  const cw = 1 - (s.calm?.(t) ?? 0), k = ptr.on && !reduced ? cw : 0;
  kit.touch.k += (k - kit.touch.k) * Math.min(1, dt * 6);
  if (kit.touch.k > 0.001) {
    _ndc.set(ptr.x, ptr.y); _ray.setFromCamera(_ndc, camera); let got = false;
    for (const w of kit.waters) { let r = w; while (r.parent) r = r.parent; if (r !== s.scene || !w.visible) continue; w.getWorldPosition(_wp); _plane.set(_up, -_wp.y);
      if (_ray.ray.intersectPlane(_plane, _hit) && _hit.distanceTo(camera.position) < 60) { kit.touch.p.copy(_hit); got = true; break; } }
    if (!got) kit.touch.p.copy(_ray.ray.direction).multiplyScalar(10).add(camera.position);
  }
  kit.touch.apply();
  if (kit.touch.k > 0.001 || kit.touch.dwell > 0.001 || kit.touch.wind.lengthSq() > 1e-5) dirty = true;
}
function ptrMove(x, y) { ptr.vx += (x - ptr.lx); ptr.vy += (y - ptr.ly); ptr.lx = ptr.x = x; ptr.ly = ptr.y = y; ptr.on = true; dirty = true; }
if (!mobile) {
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') ptrMove((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)); });
  document.documentElement.addEventListener('pointerleave', () => { ptr.on = false; });
} else {
  // телефон: наклон задаёт «палец» (по горизонтали ±25°, по вертикали вокруг 45°); касание экрана — точно в точку
  addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; const g = Math.max(-1, Math.min(1, e.gamma / 25)), b = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); ptrMove(g, -b * 0.6); });
  addEventListener('touchmove', (e) => { const t0 = e.touches[0]; if (t0) ptrMove((t0.clientX / innerWidth) * 2 - 1, -((t0.clientY / innerHeight) * 2 - 1)); }, { passive: true });
}

const head = { on: false, x: 0, y: 0, yaw: 0, pitch: 0, z: 0, tgt: { x: 0, y: 0, yaw: 0, pitch: 0, z: 0 }, ctl: null };
const HQ = ['x', 'y', 'yaw', 'pitch', 'z'];
// без погружения на десктопе камера мягко смотрит в сторону курсора
if (!mobile) {
  addEventListener('pointermove', (e) => {
    if (head.on || e.pointerType !== 'mouse') return;
    head.tgt.yaw = ((e.clientX / innerWidth) * 2 - 1) * 0.55; head.tgt.pitch = -((e.clientY / innerHeight) * 2 - 1) * 0.45;
  });
  document.documentElement.addEventListener('pointerleave', () => { if (!head.on) { head.tgt.yaw = 0; head.tgt.pitch = 0; } });
}
if (!mobile && navigator.mediaDevices?.getUserMedia) headBtn.hidden = false;
headBtn.addEventListener('click', async () => {
  if (head.ctl) { head.ctl.stop(); head.ctl = null; head.on = false; for (const q of HQ) head.tgt[q] = 0; dirty = true; headBtn.setAttribute('aria-pressed', 'false'); hintEl.textContent = ''; return; }
  headBtn.classList.add('busy'); hintEl.textContent = 'Включаем камеру… видео остаётся на вашем устройстве';
  try {
    head.ctl = await startHeadTrack((v) => Object.assign(head.tgt, v));
    head.on = true; headBtn.setAttribute('aria-pressed', 'true');
    hintEl.textContent = 'Погружение включено: смотрите по сторонам и качайте головой в такт';
  } catch (e) {
    console.warn('[staya] head tracking', e); hintEl.textContent = 'Камера недоступна — путешествие будет без погружения';
  }
  headBtn.classList.remove('busy');
});
/* ---------- звук: выключатель на прелоадере ---------- */
let soundOn = true;
sndBtn.addEventListener('click', () => {
  soundOn = !soundOn; sndBtn.setAttribute('aria-pressed', String(soundOn));
  sndBtn.setAttribute('aria-label', soundOn ? 'Звук включён' : 'Звук выключен');
  if (started) audio.setOn(soundOn);
});

/* ---------- звук: свой трек на каждую сцену, кроссфейд ---------- */
const audio = {
  ctx: null, tracks: [], on: false, idx: -1,
  init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC || this.ctx) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    // музыка: шина → фильтр и панорама (пространство: далеко от сцены — глуше и тише, сцена слева — звук слева) → мастер
    this.bus = this.ctx.createGain(); this.lp = this.ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000; this.lp.Q.value = 0.3;
    this.pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    this.bus.connect(this.lp); (this.pan ? this.lp.connect(this.pan).connect(this.master) : this.lp.connect(this.master));
    this.an = this.ctx.createAnalyser(); this.an.fftSize = 1024; this.an.smoothingTimeConstant = 0.5; this.master.connect(this.an);
    this.fq = new Uint8Array(this.an.frequencyBinCount);
    this.fx = makeSfx(this.ctx, this.master);
    // одна дорожка на файл: если у соседних сцен один трек (когда трек повторяется), музыка не прерывается
    const bySrc = {};
    this.tracks = SCENES.map((s) => {
      if (bySrc[s.track]) return bySrc[s.track];
      const el = new Audio(); el.src = s.track; el.loop = true; el.preload = 'none';
      const tr = { el, gain: null, ok: true }; el.addEventListener('error', () => (tr.ok = false));
      return (bySrc[s.track] = tr);
    });
  },
  wire(tr) {
    if (tr.gain || !this.ctx) return;
    const src = this.ctx.createMediaElementSource(tr.el); tr.gain = this.ctx.createGain(); tr.gain.gain.value = 0;
    src.connect(tr.gain).connect(this.bus);
  },
  go(i) {
    this.idx = i; if (!this.ctx || !this.on) return;
    const now = this.ctx.currentTime;
    const curTr = this.tracks[i];
    [...new Set(this.tracks)].forEach((tr) => {
      if (tr === curTr) {
        if (!tr.ok) return; this.wire(tr);
        if (tr.el.preload === 'none') { tr.el.preload = 'auto'; tr.el.load(); }
        tr.el.play().catch(() => {});
        tr.gain.gain.cancelScheduledValues(now); tr.gain.gain.setTargetAtTime(1, now, 0.6);
      } else if (tr.gain) {
        tr.gain.gain.cancelScheduledValues(now); tr.gain.gain.setTargetAtTime(0, now, 0.4);
        setTimeout(() => { if (this.tracks[this.idx] !== tr) tr.el.pause(); }, 2500);
      }
    });
    const nx = this.tracks[i + 1]; if (nx && nx !== curTr && nx.ok && nx.el.preload === 'none') { nx.el.preload = 'auto'; nx.el.load(); }
  },
  // пространство: положение «сцены» мира (диджейский пульт) относительно камеры → панорама и приглушение вдали
  _sp: 0,
  space(cam, stage) {
    if (!this.ctx || !this.on) return; const now = performance.now(); if (now - this._sp < 120) return; this._sp = now;
    let pan = 0, dist = 0;
    if (stage) { _sv.copy(stage).applyMatrix4(cam.matrixWorldInverse); dist = _sv.length(); pan = Math.max(-1, Math.min(1, _sv.x / Math.max(4, dist))) * 0.45; }
    const far = Math.max(0, Math.min(1, (dist - 10) / 40)), tc = this.ctx.currentTime;
    this.lp.frequency.setTargetAtTime(20000 - far * 17500, tc, 0.25);
    if (this.pan) this.pan.pan.setTargetAtTime(pan, tc, 0.25);
    this.bus.gain.setTargetAtTime(this.musicOn ? 1 - far * 0.3 : 0, tc, 0.25);
  },
  // доля баса 0…1: быстрая огибающая минус медленная — вспышка на каждом ударе бочки.
  // звук выключен — ровный пульс 122 BPM, чтобы сцены не замирали
  musicOn: true,
  music(v) { if (v === this.musicOn) return; this.musicOn = v; if (this.bus) this.bus.gain.setTargetAtTime(v ? 1 : 0, this.ctx.currentTime, v ? 0.4 : 0.03); },
  fast: 0, slow: 0, pv: 0,
  beat() {
    let k;
    if (this.on && this.an && this.ctx.state === 'running') {
      this.an.getByteFrequencyData(this.fq);
      let s = 0; for (let i = 1; i <= 6; i++) s += this.fq[i]; const lvl = s / (6 * 255);
      this.fast += (lvl - this.fast) * 0.6; this.slow += (lvl - this.slow) * 0.03;
      k = Math.max(0, Math.min(1, (this.fast - this.slow * 0.94) * 5));
    } else { const ph = (performance.now() / 1000) * (122 / 60); k = Math.exp(-(ph % 1) * 6) * 0.45; }
    this.pv = Math.max(k, this.pv * 0.86);
    return reduced ? 0 : this.pv;
  },
  setOn(v) {
    this.on = v; if (!this.ctx) return;
    if (v) { this.ctx.resume(); this.master.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2); this.go(this.idx < 0 ? 0 : this.idx); }
    else { this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15); setTimeout(() => !this.on && new Set(this.tracks).forEach((t) => t.el.pause()), 600); }
  },
};
// вкладка скрыта — музыка на паузе
document.addEventListener('visibilitychange', () => { if (started && soundOn) audio.setOn(!document.hidden); });

/* ---------- прелоадер: кольцо с процентом → кнопка Play ---------- */
const C = 2 * Math.PI * 56;
let shown = 0, real = 0;
const setReal = (v) => (real = Math.max(real, v));
(function tick() {
  shown += (real - shown) * 0.08 + (real > shown ? 0.15 : 0);
  if (shown > real) shown = real;
  const v = Math.floor(shown);
  pctEl.textContent = v + '%'; arc.style.strokeDashoffset = (C * (1 - v / 100)).toFixed(1);
  if (v >= 100) { ring.classList.add('ready'); ring.disabled = false; ring.setAttribute('aria-label', 'Начать путешествие и включить музыку'); ring.focus({ preventScroll: true }); return; }
  requestAnimationFrame(tick);
})();

async function boot() {
  layout(); setReal(8);
  const fontP = new FontLoader().loadAsync('fonts/unbounded_black.typeface.json').then((f) => { font = f; setReal(35); });
  const cssFontP = (document.fonts ? Promise.all([document.fonts.load('900 64px Unbounded'), document.fonts.load('700 32px Unbounded')]) : Promise.resolve()).then(() => setReal(45));
  const firstTrack = new Promise((res) => {
    const a = new Audio(); a.preload = 'auto'; a.src = SCENES[0].track;
    const done = () => { setReal(60); res(); };
    a.addEventListener('canplaythrough', done, { once: true }); a.addEventListener('error', done, { once: true }); setTimeout(done, 4000);
  });
  await Promise.all([fontP, cssFontP]); setReal(45);
  // прелоадер ждёт только первый мир и начало его музыки; остальные миры строятся по порядку уже во время прогулки
  await buildScene(0); setReal(90);
  (async () => { for (let i = 1; i < N; i++) { await buildScene(i).catch(() => {}); await new Promise((r) => idle(r)); } })();
  await firstTrack;
  setReal(100);
}
ring.addEventListener('click', () => {
  if (!ring.classList.contains('ready') || started) return;
  if (mobile && typeof DeviceOrientationEvent?.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {});   // iOS: наклон телефона
  audio.init(); audio.setOn(soundOn);
  pre.classList.add('out'); document.body.classList.remove('locked');
  scrollTo(0, 0); cur = target = 0; started = true; dirty = true;
  // ссылка на мир (#pool, #phuket…): после Play прыжок сразу туда
  const hi = SCENES.findIndex((sc) => '#' + sc.id === location.hash);
  if (hi > 0) { jumping = true; const g = hi + FADE * 1.4; scrollTo(0, gToScroll(g)); cur = target = g; buildScene(hi).then(() => (dirty = true)); jumping = false; }
  else setTimeout(() => tweenScroll(gToScroll(FADE * 1.4), reduced ? 0 : 2600), 350);
  // подсказка «листайте» — пока зритель сам не прокрутит дальше вступления
  const sh = $('#scrollhint'), lim = () => gToScroll(FADE * 2.2);
  if (isTouch) $('#scrolltxt').textContent = 'Свайпайте вверх';
  setTimeout(() => { if (scrollY < lim()) sh.classList.add('on'); }, 3200);
  const offHint = () => { if (scrollY > lim()) { sh.classList.remove('on'); removeEventListener('scroll', offHint); } };
  addEventListener('scroll', offHint, { passive: true });
});
if (LITE) { pre.remove(); lite(); }
else { boot().catch((e) => { console.error(e); pctEl.textContent = '!'; }); requestAnimationFrame(loop); }
// лёгкая версия: к каждому миру — кадр-постер из его видео и ссылка на полную версию
function lite() {
  const posters = { aqua: 'video/aqua-h.webp', pool: 'video/pool-h.webp', club: 'video/2k17-v2.webp', halloween: 'video/halloween-v.webp', phuket: 'video/phuket2.webp' };
  document.querySelectorAll('main section').forEach((sec, k) => { const id = SCENES[k]?.id; if (!id) return; const im = new Image(); im.src = posters[id]; im.alt = ''; im.loading = 'lazy'; sec.prepend(im); });
  const a = document.createElement('a'); a.href = location.pathname; a.className = 'full'; a.textContent = probe ? 'Открыть полную 3D-версию' : 'Для 3D-версии нужен браузер с WebGL'; document.querySelector('main').prepend(a);
  finalEl.classList.add('on'); document.querySelector('main').appendChild(finalEl);
}

/* ---------- клавиатура: переход к миру по цифрам 1–5 и через скрытое меню (видно при фокусе) ---------- */
const jumpNav = document.createElement('nav'); jumpNav.id = 'jump'; jumpNav.setAttribute('aria-label', 'Перейти к миру');
const NAMES = { aqua: 'AQUA', pool: 'POOL', club: '2K17', halloween: 'HALLOWEEN', phuket: 'PHUKET' };
SCENES.forEach((sc, k) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${k + 1}. ${NAMES[sc.id]}`; b.addEventListener('click', () => jumpTo(k)); jumpNav.appendChild(b); });
document.body.appendChild(jumpNav);
function jumpTo(k) { if (!started || LITE) return; const g = k + FADE * 1.4; jumping = true; scrollTo(0, gToScroll(g)); cur = target = g; buildScene(k).then(() => (dirty = true)); jumping = false; dirty = true; }
addEventListener('keydown', (e) => { if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return; const k = '12345'.indexOf(e.key); if (k >= 0) jumpTo(k); });

// Отладка: __staya.go(g) — камера в точку g (номер сцены + доля)
window.__staya = {
  async go(g) {
    started = true; pre.classList.add('out'); document.body.classList.remove('locked');
    const i = Math.min(N - 1, Math.floor(g)); await buildScene(i);
    if (i < N - 1 && SCENES[i].out === 'cut') await buildScene(i + 1);
    jumping = true; scrollTo(0, gToScroll(g)); cur = target = g; apply(g); lastG = g; jumping = false;
  },
  tier: () => tier, cam: () => camera,
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, built: [...built.keys()] }),
  ready: () => real >= 100,
  scene: (i) => built.get(i)?.scene,
  pick: (x, y) => { const r = new THREE.Raycaster(); r.setFromCamera(new THREE.Vector2(x, y), camera); const s = built.get(curIdx)?.scene; return s ? r.intersectObject(s, true).slice(0, 4).map((h) => [h.object.type, h.object.name, h.object.parent?.name, h.object.material?.type, h.object.material?.name, +h.distance.toFixed(2), h.object.geometry?.type, JSON.stringify(h.object.geometry?.parameters ?? {}).slice(0, 80)]) : []; },
  loot: () => (built.get(curIdx)?.scene.userData.loot || []).filter((r) => r.visible).map((r) => { const v = r.getWorldPosition(new THREE.Vector3()).project(camera); return [r.userData.loot.id, +((v.x + 1) / 2 * innerWidth).toFixed(0), +((1 - v.y) / 2 * innerHeight).toFixed(0), v.z < 1]; }),
  dbg: () => ({ dir: camera.getWorldDirection(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)), g: cur, cam: camera.position.toArray().map((v) => +v.toFixed(4)), fov: +camera.fov.toFixed(2), aspect: +camera.aspect.toFixed(3) }),
};
