// STAYA — движок путешествия.
// Скролл двигает камеру по пути внутри сцены. На экране нет интерфейса — только полёт.
// Стыки сцен двух видов: 'black' — уход в чёрный; 'cut' — монтажная склейка по совпадающему кадру.
// Кадр рисуется только когда камера сдвинулась: сцены статичны, телефон не греется.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as kit from './kit.js';
import { startHeadTrack } from './headtrack.js';
import { makeSfx } from './sfx.js';
import { loadPeople } from './people.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const SCENES = [
  { id: 'aqua', load: () => import('./scenes/aqua.js'), track: 'music/01-aqua.mp3', w: 1.35, out: 'water', sfx: [[0.02, 'whoosh'], [0.37, 'whoosh'], [0.95, 'splash']] },
  { id: 'pool', load: () => import('./scenes/pool.js'), track: 'music/03-pool.mp3', w: 1.5, out: 'black', sfx: [[0.0, 'bubbles'], [0.1, 'bubbles'], [0.36, 'splash'], [0.86, 'clink'], [0.95, 'gulp']] },
  { id: 'club', load: () => import('./scenes/club.js'), track: 'music/02-2k17.mp3', w: 1.45, out: 'black', sfx: [[0.03, 'clink'], [0.97, 'door']] },
  { id: 'halloween', load: () => import('./scenes/halloween.js'), track: 'music/04-halloween.mp3', w: 1.3, out: 'cut', sfx: [[0.03, 'door'], [0.9, 'whoosh']] },
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

const $ = (s) => document.querySelector(s);
const canvas = $('#gl'), fadeEl = $('#fade'), pctEl = $('#pct'), arc = $('#arc'), ring = $('#ring'), pre = $('#pre');
const spacer = $('#spacer'), finalEl = $('#final'), sndBtn = $('#snd'), headBtn = $('#head'), hintEl = $('#hint');
LINKS.filter((l) => l.href).forEach((l) => {
  const a = document.createElement('a'); a.href = l.href; a.textContent = l.label; if (l.cls) a.className = l.cls;
  if (l.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
  finalEl.querySelector('.row').appendChild(a);
});

/* ---------- рендерер ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 1);
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 2000);
// десктоп: настоящее свечение неона и солнца (bloom); телефон — лёгкие ореолы-спрайты без постобработки
let composer = null, renderPass = null;
if (!mobile) {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(new THREE.Scene(), camera);
  composer.addPass(renderPass);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1024, 1024), 0.55, 0.55, 0.82));
  composer.addPass(new OutputPass());
}

let VH = innerHeight, lastW = innerWidth, glowScale = 600, dirty = true, baseFov = 60;
const totalW = SCENES.reduce((a, s) => a + s.w, 0);
const cum = []; SCENES.reduce((a, s, i) => ((cum[i] = a), a + s.w), 0);
const fovFor = (aspect) => (aspect < 0.8 ? 72 : aspect < 1.2 ? 64 : 54);
function layout() {
  const w = innerWidth, h = isTouch ? Math.max(VH, innerHeight) : innerHeight;
  renderer.setSize(w, h, false); canvas.style.height = h + 'px';
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
  camera.aspect = w / h; camera.fov = baseFov = fovFor(camera.aspect); camera.updateProjectionMatrix();
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
// Все сцены собираются во время прелоадера и остаются в памяти — при скролле ничего не догружается.

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
  // погружение: камера чуть поворачивается за головой зрителя, кивки в такт качают сцену
  // сдвиг головы — как взгляд в окно (камера уходит в обратную сторону), поворот головы — камера смотрит туда же
  const fv = baseFov * (1 - Math.max(-0.6, Math.min(1, head.z)) * 0.2);   // зритель ближе к экрану — кадр приближается
  if (Math.abs(camera.fov - fv) > 1e-3) { camera.fov = fv; camera.updateProjectionMatrix(); }
  if (head.x || head.y || head.yaw || head.pitch) {
    // сдвиг головы → камера сдвигается туда же и чуть поворачивается вслед; поворот головы → камера смотрит туда же
    camera.translateX(head.x * 0.55); camera.translateY(head.y * 0.4);
    camera.rotateY(-head.x * 0.16 - head.yaw * 0.3); camera.rotateX(head.y * 0.12 + head.pitch * 0.2);
  }
  if (composer) { renderPass.scene = s.scene; composer.render(); } else renderer.render(s.scene, camera);
  if (i !== curIdx) { curIdx = i; audio.go(i); }
  if (t > 0.3 && i < N - 1 && !built.has(i + 1)) idle(() => buildScene(i + 1));
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
  {
    let moved = 0;
    for (const q of HQ) {
      const to = head.tgt[q], d = to - head[q];
      if (Math.abs(d) > 0.0005) { head[q] += d * 0.075; moved = 1; } else head[q] = to;
    }
    if (moved) dirty = true;
  }
  if (started && cur > lastG && lastG >= 0 && audio.on && audio.fx) {
    // звуковые эффекты: срабатывают, когда скролл проходит точку вперёд
    for (let i = Math.floor(lastG); i <= Math.min(N - 1, Math.floor(cur)); i++) for (const [t, k] of SCENES[i].sfx || []) { const g = i + t; if (g > lastG && g <= cur) audio.fx[k]?.(); }
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

/* ---------- ссылки в 3D-титрах: клик по строке открывает источник ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function linkAt(ev) {
  const i = curIdx, s = built.get(i), pk = s?.pick; if (!pk || !pk.mesh.visible || lastG - i < pk.from) return null;
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / canvas.clientHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(pk.mesh, false)[0]; if (!hit?.uv) return null;
  return pk.links.find((l) => hit.uv.y >= l.v0 && hit.uv.y <= l.v1) || null;
}
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') canvas.style.cursor = linkAt(e) ? 'pointer' : ''; });
canvas.addEventListener('click', (e) => { const l = linkAt(e); if (l) window.open(l.href, '_blank', 'noopener'); });

/* ---------- погружение: слежение за головой (только десктоп) ---------- */
// tgt — последние значения с камеры (~18 раз в секунду), x/y/yaw/pitch — плавно догоняют их каждый кадр
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
  await Promise.all([fontP, cssFontP, loadPeople().then(() => setReal(45))]);
  // все сцены — сразу, пока крутится кольцо: дальше путешествие идёт без подгрузок
  for (let i = 0; i < N; i++) { await buildScene(i); setReal(45 + (50 * (i + 1)) / N); await new Promise((r) => setTimeout(r, 0)); }
  await firstTrack;
  setReal(100);
}
ring.addEventListener('click', () => {
  if (!ring.classList.contains('ready') || started) return;
  audio.init(); audio.setOn(soundOn);
  pre.classList.add('out'); document.body.classList.remove('locked');
  scrollTo(0, 0); cur = target = 0; started = true; dirty = true;
  setTimeout(() => tweenScroll(gToScroll(FADE * 1.4), reduced ? 0 : 2600), 350);
  // подсказка «листайте» — пока зритель сам не прокрутит дальше вступления
  const sh = $('#scrollhint'), lim = () => gToScroll(FADE * 2.2);
  if (isTouch) $('#scrolltxt').textContent = 'Свайпайте вверх';
  setTimeout(() => { if (scrollY < lim()) sh.classList.add('on'); }, 3200);
  const offHint = () => { if (scrollY > lim()) { sh.classList.remove('on'); removeEventListener('scroll', offHint); } };
  addEventListener('scroll', offHint, { passive: true });
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
