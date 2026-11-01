// STAYA — движок путешествия.
// Скролл двигает камеру по пути внутри сцены. На стыке сцен экран уходит в чёрный,
// прошлая сцена выгружается, следующая уже собрана заранее.
// Кадр рисуется только когда камера сдвинулась: сцены статичны, телефон не греется.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as kit from './kit.js';

const SCENES = [
  { id: 'aqua', label: 'Aqua', load: () => import('./scenes/aqua.js'), track: 'music/01-aqua.mp3', w: 1.35, portal: 'Нырнуть', accent: '#2fe6ff' },
  { id: 'club', label: '2K17', load: () => import('./scenes/club.js'), track: 'music/02-2k17.mp3', w: 1.15, portal: 'В телефон', accent: '#b45cff' },
  { id: 'pool', label: 'Pool', load: () => import('./scenes/pool.js'), track: 'music/03-pool.mp3', w: 1.15, portal: 'К луне', accent: '#ff3fb4' },
  { id: 'halloween', label: 'Halloween', load: () => import('./scenes/halloween.js'), track: 'music/04-halloween.mp3', w: 1.1, portal: 'Открыть двери', accent: '#ff5a1f' },
  { id: 'phuket', label: 'Phuket', load: () => import('./scenes/phuket.js'), track: 'music/05-phuket.mp3', w: 1.1, portal: 'В закат', accent: '#ffa24a' },
  { id: 'office', label: 'Команда', load: () => import('./scenes/office.js'), track: 'music/06-office.mp3', w: 0.9, portal: null, accent: '#ff3fb4' },
];
const N = SCENES.length;
const VH_PER_UNIT = 6;          // экранов прокрутки на единицу веса сцены
const FADE = 0.06;              // доля сцены на уход/выход из чёрного
const isTouch = matchMedia('(pointer: coarse)').matches;
const mobile = isTouch || innerWidth <= 860;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEBUG = new URLSearchParams(location.search).has('debug');

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const canvas = $('#gl'), fadeEl = $('#fade'), pctEl = $('#pct'), barEl = $('#bar'), playBtn = $('#play'), pre = $('#pre');
const portalBtn = $('#portal'), portalLabel = $('#portalLabel'), hint = $('#hint'), spacer = $('#spacer'), rail = $('#rail');
const soundBtn = $('#sound'), soundLabel = $('#soundLabel');
const copies = Object.fromEntries([...document.querySelectorAll('.scene-copy')].map((el) => [el.dataset.scene, el]));

/* ---------- рендерер ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance', alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 1);
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 900);

let VH = innerHeight, lastW = innerWidth;
function layout() {
  const w = innerWidth, h = isTouch ? Math.max(VH, innerHeight) : innerHeight;
  renderer.setSize(w, h, false);
  canvas.style.height = h + 'px';
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 72 : camera.aspect < 1.2 ? 64 : 54;
  camera.updateProjectionMatrix();
  const scale = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  kit.glowMats.forEach((m) => (m.uniforms.uScale.value = scale));
  glowScale = scale;
  spacer.style.height = (totalW * VH_PER_UNIT * VH + VH) + 'px';
  dirty = true;
}
let glowScale = 600;
const totalW = SCENES.reduce((a, s) => a + s.w, 0);
const cum = []; SCENES.reduce((a, s, i) => ((cum[i] = a), a + s.w), 0);
addEventListener('resize', () => {
  // На телефоне URL-бар меняет только высоту — не пересчитываем, чтобы не прыгал скролл.
  if (isTouch && innerWidth === lastW) return;
  lastW = innerWidth; VH = innerHeight; layout();
});
addEventListener('orientationchange', () => setTimeout(() => { lastW = innerWidth; VH = innerHeight; layout(); }, 250));

/* ---------- сцены ---------- */
const built = new Map();   // i -> {scene, cam, meta}
const building = new Map();
let font;

async function buildScene(i) {
  if (built.has(i)) return built.get(i);
  if (building.has(i)) return building.get(i);
  const p = (async () => {
    const mod = await SCENES[i].load();
    const t0 = performance.now();
    const res = mod.build({ THREE, kit, font, renderer, mobile });
    res.scene.traverse((o) => { if (o.isMesh || o.isPoints) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
    res.scene.updateMatrixWorld(true);
    kit.glowMats.forEach((m) => (m.uniforms.uScale.value = glowScale));
    // компилируем шейдеры заранее — без рывка на стыке
    try { renderer.compile(res.scene, camera); } catch (e) { /* noop */ }
    if (DEBUG) console.log(`[staya] ${SCENES[i].id} built in ${(performance.now() - t0).toFixed(0)} ms`);
    built.set(i, res); building.delete(i);
    return res;
  })();
  p.catch((e) => { console.error('[staya] scene', SCENES[i].id, e); setTimeout(() => building.delete(i), 3000); });
  building.set(i, p);
  return p;
}
function dropFar(cur) {
  for (const [i, s] of built) {
    if (Math.abs(i - cur) > 1) { kit.disposeScene(s.scene); built.delete(i); if (DEBUG) console.log('[staya] dropped', SCENES[i].id); }
  }
}

/* ---------- скролл → позиция ---------- */
function scrollToG(y) {
  const u = Math.min(totalW, Math.max(0, y / (VH_PER_UNIT * VH)));
  let i = 0; while (i < N - 1 && u >= cum[i + 1]) i++;
  return i + Math.min(0.99999, (u - cum[i]) / SCENES[i].w);
}
function gToScroll(g) {
  const i = Math.min(N - 1, Math.floor(g)), f = g - i;
  return (cum[i] + f * SCENES[i].w) * VH_PER_UNIT * VH;
}

let cur = 0, target = 0, lastG = -1, dirty = true, curIdx = -1, started = false;
const tmpL = new THREE.Vector3();

function apply(g) {
  const i = Math.min(N - 1, Math.floor(g)), t = g - i;
  const s = built.get(i);
  if (!s) { fadeEl.style.opacity = 1; buildScene(i).then(() => (dirty = true)); return false; }
  // чёрный на стыках
  let black = 0;
  if (t < FADE) black = i === 0 ? 1 - t / FADE : 1 - t / FADE;
  if (t > 1 - FADE && i < N - 1) black = (t - (1 - FADE)) / FADE;
  fadeEl.style.opacity = Math.max(0, Math.min(1, black)).toFixed(3);

  const c = s.cam(t);
  camera.position.copy(c.p); tmpL.copy(c.l); camera.lookAt(tmpL);
  if (s.roll) camera.rotateZ(s.roll(t));
  renderer.render(s.scene, camera);

  if (i !== curIdx) onSceneChange(i);
  // предзагрузка соседей
  if (t > 0.35 && i < N - 1 && !built.has(i + 1)) idle(() => buildScene(i + 1));
  if (t < 0.3 && i > 0 && !built.has(i - 1)) idle(() => buildScene(i - 1));
  ui(i, t);
  return true;
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60));

function onSceneChange(i) {
  curIdx = i;
  document.documentElement.style.setProperty('--accent', SCENES[i].accent);
  [...rail.children].forEach((b, k) => b.classList.toggle('on', k === i));
  dropFar(i);
  audio.go(i);
}

let lastCopy = null, portalOn = false;
function ui(i, t) {
  const id = SCENES[i].id;
  const showCopy = i === N - 1 ? t > 0.55 : t > 0.2 && t < 0.78;
  const want = showCopy ? id : null;
  if (want !== lastCopy) { for (const k in copies) copies[k].classList.toggle('on', k === want); lastCopy = want; }
  const po = !!SCENES[i].portal && t > 0.8 && t < 1 - FADE * 0.6;
  if (po !== portalOn) { portalOn = po; portalBtn.classList.toggle('on', po); if (po) portalLabel.textContent = SCENES[i].portal; }
  hint.classList.toggle('off', !(i === 0 && t < 0.12));
}

function loop() {
  target = scrollToG(scrollY);
  if (reduced || jumping) cur = target;
  else {
    const d = target - cur;
    // не даём сглаживанию «пролетать» через целые сцены при резком скролле
    cur += Math.sign(d) * Math.min(Math.abs(d) * 0.12, 0.02);
    if (Math.abs(target - cur) < 1e-5) cur = target;
  }
  if (started && (cur !== lastG || dirty)) { if (apply(cur)) { lastG = cur; dirty = false; } }
  requestAnimationFrame(loop);
}

/* ---------- переходы по кнопкам ---------- */
let jumping = false;
function tweenScroll(toY, ms = 1400) {
  const from = scrollY, t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo(0, from + (toY - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
portalBtn.addEventListener('click', () => {
  const i = Math.min(N - 1, Math.floor(cur));
  if (i < N - 1) tweenScroll(gToScroll(i + 1 + FADE * 1.8), reduced ? 0 : 1300);
});
async function jumpTo(i) {
  fadeEl.style.transition = 'opacity .25s'; fadeEl.style.opacity = 1;
  await buildScene(i);
  await new Promise((r) => setTimeout(r, 260));
  jumping = true;
  scrollTo(0, gToScroll(i + FADE * 1.5));
  requestAnimationFrame(() => requestAnimationFrame(() => { jumping = false; fadeEl.style.transition = ''; }));
}
SCENES.forEach((s, i) => {
  const b = document.createElement('button');
  b.innerHTML = `<span>${s.label}</span><i></i>`; b.setAttribute('aria-label', s.label);
  b.addEventListener('click', () => jumpTo(i));
  rail.appendChild(b);
});
$('#again').addEventListener('click', () => jumpTo(0));
$('#brand').addEventListener('click', (e) => { e.preventDefault(); jumpTo(0); });

/* ---------- звук: свой трек на каждую сцену, кроссфейд ---------- */
const audio = {
  ctx: null, tracks: [], on: false, idx: -1,
  init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.tracks = SCENES.map((s) => {
      const el = new Audio(); el.src = s.track; el.loop = true; el.preload = 'none'; el.crossOrigin = 'anonymous';
      const tr = { el, gain: null, ok: true };
      el.addEventListener('error', () => (tr.ok = false));
      return tr;
    });
  },
  wire(tr) {
    if (tr.gain || !this.ctx) return;
    const src = this.ctx.createMediaElementSource(tr.el); tr.gain = this.ctx.createGain(); tr.gain.gain.value = 0;
    src.connect(tr.gain).connect(this.master);
  },
  go(i) {
    this.idx = i;
    if (!this.ctx || !this.on) return;
    const now = this.ctx.currentTime;
    this.tracks.forEach((tr, k) => {
      if (k === i) {
        if (!tr.ok) return;
        this.wire(tr);
        if (tr.el.preload === 'none') { tr.el.preload = 'auto'; tr.el.load(); }
        tr.el.play().catch(() => {});
        tr.gain.gain.cancelScheduledValues(now); tr.gain.gain.setTargetAtTime(1, now, 0.6);
      } else if (tr.gain) {
        tr.gain.gain.cancelScheduledValues(now); tr.gain.gain.setTargetAtTime(0, now, 0.4);
        setTimeout(() => { if (this.idx !== k) tr.el.pause(); }, 2500);
      }
    });
    // соседний трек подгружаем заранее
    const nx = this.tracks[i + 1]; if (nx && nx.ok && nx.el.preload === 'none') { nx.el.preload = 'auto'; nx.el.load(); }
  },
  setOn(v) {
    this.on = v;
    soundBtn.classList.toggle('off', !v); soundBtn.setAttribute('aria-pressed', String(v)); soundLabel.textContent = v ? 'Звук вкл' : 'Звук выкл';
    if (!this.ctx) return;
    if (v) { this.ctx.resume(); this.master.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2); this.go(this.idx < 0 ? 0 : this.idx); }
    else { this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15); setTimeout(() => !this.on && this.tracks.forEach((t) => t.el.pause()), 600); }
  },
};
soundBtn.addEventListener('click', () => { if (!audio.ctx) audio.init(); audio.setOn(!audio.on); });

/* ---------- прелоадер ---------- */
let shown = 0, real = 0;
const setReal = (v) => (real = Math.max(real, v));
(function tick() {
  shown += (real - shown) * 0.08 + (real > shown ? 0.15 : 0);
  if (shown > real) shown = real;
  const v = Math.floor(shown);
  pctEl.textContent = v + '%'; barEl.style.width = v + '%';
  if (v >= 100) { playBtn.classList.add('on'); pctEl.textContent = '100%'; return; }
  requestAnimationFrame(tick);
})();

async function boot() {
  layout();
  setReal(8);
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

playBtn.addEventListener('click', () => {
  audio.init(); audio.setOn(true);
  pre.classList.add('out'); document.body.classList.remove('locked');
  scrollTo(0, 0); cur = target = 0; started = true; dirty = true;
  playBtn.blur();
  // Вступление: сцена сама выходит из чёрного — камера начинает скатываться по горке
  setTimeout(() => tweenScroll(gToScroll(FADE * 1.4), reduced ? 0 : 2600), 350);
});

boot().catch((e) => { console.error(e); pctEl.textContent = 'Ошибка загрузки'; });
requestAnimationFrame(loop);

// Отладка: ?debug — window.__staya.go(g) мгновенно ставит камеру (g = номер сцены + доля)
window.__staya = {
  async go(g) { started = true; pre.classList.add('out'); document.body.classList.remove('locked'); const i = Math.min(N - 1, Math.floor(g)); await buildScene(i); jumping = true; scrollTo(0, gToScroll(g)); cur = target = g; apply(g); lastG = g; jumping = false; return renderer.info.render; },
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, built: [...built.keys()] }),
  ready: () => real >= 100,
};
