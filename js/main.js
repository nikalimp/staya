// STAYA — движок путешествия.
// Скролл двигает камеру по пути внутри сцены. На экране нет интерфейса — только полёт.
// Стыки сцен двух видов: 'black' — уход в чёрный; 'cut' — монтажная склейка по совпадающему кадру.
// Кадр рисуется только когда камера сдвинулась: сцены статичны, телефон не греется.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as kit from './kit.js';

const SCENES = [
  { id: 'aqua', load: () => import('./scenes/aqua.js'), track: 'music/01-aqua.mp3', w: 1.35, out: 'water' },
  { id: 'pool', load: () => import('./scenes/pool.js'), track: 'music/03-pool.mp3', w: 1.5, out: 'black' },
  { id: 'club', load: () => import('./scenes/club.js'), track: 'music/02-2k17.mp3', w: 1.45, out: 'black' },
  { id: 'halloween', load: () => import('./scenes/halloween.js'), track: 'music/04-halloween.mp3', w: 1.3, out: 'cut' },
  { id: 'phuket', load: () => import('./scenes/phuket.js'), track: 'music/05-phuket.mp3', w: 2.2, out: null, final: 0.95 },
];
// Кнопки финала. Пустой href — кнопка не показывается.
const LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/stayaekb/', cls: 'main' },
  { label: 'Telegram', href: 'https://t.me/+JP1gsoNXGpkzZDIy' },
  { label: 'VK', href: '' },
  { label: 'Почта', href: '' },          // mailto:…
  { label: 'Сайт — Nik Alimp', href: 'https://nikalimp.ru', cls: 'dev' },
];

const N = SCENES.length;
const VH_PER_UNIT = 6;
const FADE = 0.06;
const isTouch = matchMedia('(pointer: coarse)').matches;
const mobile = isTouch || innerWidth <= 860;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEBUG = new URLSearchParams(location.search).has('debug');

const $ = (s) => document.querySelector(s);
const canvas = $('#gl'), fadeEl = $('#fade'), pctEl = $('#pct'), arc = $('#arc'), ring = $('#ring'), pre = $('#pre');
const spacer = $('#spacer'), finalEl = $('#final');
LINKS.filter((l) => l.href).forEach((l) => {
  const a = document.createElement('a'); a.href = l.href; a.textContent = l.label; if (l.cls) a.className = l.cls;
  if (l.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
  finalEl.appendChild(a);
});

/* ---------- рендерер ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 1);
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 2000);

let VH = innerHeight, lastW = innerWidth, glowScale = 600, dirty = true;
const totalW = SCENES.reduce((a, s) => a + s.w, 0);
const cum = []; SCENES.reduce((a, s, i) => ((cum[i] = a), a + s.w), 0);
const fovFor = (aspect) => (aspect < 0.8 ? 72 : aspect < 1.2 ? 64 : 54);
function layout() {
  const w = innerWidth, h = isTouch ? Math.max(VH, innerHeight) : innerHeight;
  renderer.setSize(w, h, false); canvas.style.height = h + 'px';
  camera.aspect = w / h; camera.fov = fovFor(camera.aspect); camera.updateProjectionMatrix();
  glowScale = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  kit.glowMats.forEach((m) => (m.uniforms.uScale.value = glowScale));
  spacer.style.height = (totalW * VH_PER_UNIT * VH + VH) + 'px';
  dirty = true;
}
addEventListener('resize', () => { if (isTouch && innerWidth === lastW) return; lastW = innerWidth; VH = innerHeight; layout(); });
addEventListener('orientationchange', () => setTimeout(() => { lastW = innerWidth; VH = innerHeight; layout(); }, 250));

/* ---------- сцены ---------- */
const built = new Map(), building = new Map();
let font;
async function buildScene(i) {
  if (built.has(i)) return built.get(i);
  if (building.has(i)) return building.get(i);
  const p = (async () => {
    const mod = await SCENES[i].load();
    const t0 = performance.now();
    const res = await mod.build({ THREE, kit, font, renderer, mobile });
    res.scene.traverse((o) => { if ((o.isMesh || o.isPoints) && !o.userData.dynamic) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
    res.scene.updateMatrixWorld(true);
    kit.glowMats.forEach((m) => (m.uniforms.uScale.value = glowScale));
    try { renderer.compile(res.scene, camera); } catch (e) { /* noop */ }
    if (DEBUG) console.log(`[staya] ${SCENES[i].id} built in ${(performance.now() - t0).toFixed(0)} ms`);
    built.set(i, res); building.delete(i);
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
function renderPreview(owner, next) {
  if (owner.previewDone) return;
  const { mesh, t = 0 } = owner.preview, w = mobile ? 768 : 1024, h = w;
  const rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace, samples: mobile ? 0 : 4 });
  const cam = new THREE.PerspectiveCamera(fovFor(w / h), w / h, 0.05, 2000);
  const c = next.cam(t); cam.position.copy(c.p); cam.lookAt(c.l);
  const keep = [...kit.glowMats].map((m) => m.uniforms.uScale.value);
  kit.glowMats.forEach((m) => (m.uniforms.uScale.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))));
  next.update?.(t);
  renderer.setRenderTarget(rt); renderer.render(next.scene, cam); renderer.setRenderTarget(null);
  [...kit.glowMats].forEach((m, k) => (m.uniforms.uScale.value = keep[k] ?? glowScale));
  mesh.material.map = rt.texture; mesh.material.needsUpdate = true;
  owner.scene.userData.rt = rt; owner.previewDone = true; dirty = true;
}
function dropFar(cur) {
  for (const [i, s] of built) if (Math.abs(i - cur) > 1) {
    s.scene.userData.rt?.dispose(); kit.disposeScene(s.scene); built.delete(i);
    if (DEBUG) console.log('[staya] dropped', SCENES[i].id);
  }
}

/* ---------- скролл → позиция ---------- */
function scrollToG(y) {
  const u = Math.min(totalW, Math.max(0, y / (VH_PER_UNIT * VH)));
  let i = 0; while (i < N - 1 && u >= cum[i + 1]) i++;
  return i + Math.min(0.99999, (u - cum[i]) / SCENES[i].w);
}
function gToScroll(g) { const i = Math.min(N - 1, Math.floor(g)); return (cum[i] + (g - i) * SCENES[i].w) * VH_PER_UNIT * VH; }

let cur = 0, target = 0, lastG = -1, curIdx = -1, started = false, jumping = false;
// Стык 'black' уходит в чёрный, 'water' — в синеву воды (нырок AQUA → выныривание в POOL), 'cut' — склейка без затемнения
const FADE_COLOR = { black: '#000', water: '#0a5f8f' };
function blackAt(i, t) {
  let k = 0, c = '#000';
  const inT = i === 0 ? 'black' : SCENES[i - 1].out, outT = SCENES[i].out;
  if (FADE_COLOR[inT] && t < FADE) { k = 1 - t / FADE; c = FADE_COLOR[inT]; }
  if (FADE_COLOR[outT] && t > 1 - FADE) { k = (t - (1 - FADE)) / FADE; c = FADE_COLOR[outT]; }
  if (fadeEl.dataset.c !== c) { fadeEl.style.background = c; fadeEl.dataset.c = c; }
  return Math.max(0, Math.min(1, k));
}
function apply(g) {
  const i = Math.min(N - 1, Math.floor(g)), t = g - i;
  const s = built.get(i);
  if (!s) { fadeEl.style.opacity = 1; buildScene(i).then(() => (dirty = true)); return false; }
  fadeEl.style.opacity = blackAt(i, t).toFixed(3);
  s.update?.(t);
  const nr = s.near?.(t) ?? 0.05;
  if (camera.near !== nr) { camera.near = nr; camera.updateProjectionMatrix(); }
  const c = s.cam(t);
  camera.position.copy(c.p); camera.lookAt(c.l);
  if (s.roll) camera.rotateZ(s.roll(t));
  renderer.render(s.scene, camera);
  if (i !== curIdx) { curIdx = i; dropFar(i); audio.go(i); }
  // соседей собираем заранее — для склеек 'cut' это обязательно
  if (t > 0.3 && i < N - 1 && !built.has(i + 1)) idle(() => buildScene(i + 1));
  if (t < 0.25 && i > 0 && !built.has(i - 1)) idle(() => buildScene(i - 1));
  finalEl.classList.toggle('on', i === N - 1 && t > (SCENES[i].final ?? 0.72));
  return true;
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));

function loop() {
  target = scrollToG(scrollY);
  if (reduced || jumping) cur = target;
  else {
    const d = target - cur;
    cur += Math.sign(d) * Math.min(Math.abs(d) * 0.12, 0.02);
    if (Math.abs(target - cur) < 1e-5) cur = target;
  }
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

/* ---------- звук: свой трек на каждую сцену, кроссфейд ---------- */
const audio = {
  ctx: null, tracks: [], on: false, idx: -1,
  init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC || this.ctx) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
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
    src.connect(tr.gain).connect(this.master);
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
  setOn(v) {
    this.on = v; if (!this.ctx) return;
    if (v) { this.ctx.resume(); this.master.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2); this.go(this.idx < 0 ? 0 : this.idx); }
    else { this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15); setTimeout(() => !this.on && new Set(this.tracks).forEach((t) => t.el.pause()), 600); }
  },
};
// вкладка скрыта — музыка на паузе
document.addEventListener('visibilitychange', () => { if (started) audio.setOn(!document.hidden); });

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
  const fontP = new FontLoader().loadAsync('fonts/helvetiker_bold.typeface.json').then((f) => { font = f; setReal(35); });
  const cssFontP = (document.fonts ? Promise.all([document.fonts.load('900 64px Unbounded'), document.fonts.load('700 32px Unbounded')]) : Promise.resolve()).then(() => setReal(45));
  const firstTrack = new Promise((res) => {
    const a = new Audio(); a.preload = 'auto'; a.src = SCENES[0].track;
    const done = () => { setReal(60); res(); };
    a.addEventListener('canplaythrough', done, { once: true }); a.addEventListener('error', done, { once: true }); setTimeout(done, 4000);
  });
  await Promise.all([fontP, cssFontP]);
  await buildScene(0); setReal(85);
  await firstTrack;
  idle(() => buildScene(1));
  setReal(100);
}
ring.addEventListener('click', () => {
  if (!ring.classList.contains('ready') || started) return;
  audio.init(); audio.setOn(true);
  pre.classList.add('out'); document.body.classList.remove('locked');
  scrollTo(0, 0); cur = target = 0; started = true; dirty = true;
  setTimeout(() => tweenScroll(gToScroll(FADE * 1.4), reduced ? 0 : 2600), 350);
});
boot().catch((e) => { console.error(e); pctEl.textContent = '!'; });
requestAnimationFrame(loop);

// Отладка: __staya.go(g) — камера в точку g (номер сцены + доля)
window.__staya = {
  async go(g) {
    started = true; pre.classList.add('out'); document.body.classList.remove('locked');
    const i = Math.min(N - 1, Math.floor(g)); await buildScene(i);
    if (i < N - 1 && SCENES[i].out === 'cut') await buildScene(i + 1);
    jumping = true; scrollTo(0, gToScroll(g)); cur = target = g; apply(g); lastG = g; jumping = false;
  },
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, built: [...built.keys()] }),
  ready: () => real >= 100,
  scene: (i) => built.get(i)?.scene,
};
