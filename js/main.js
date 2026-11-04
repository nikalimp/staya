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
import { lootAt, lootTick, collect, lootCount, LOOT_TOTAL } from './loot.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const SCENES = [
  { id: 'aqua', load: () => import('./scenes/aqua.js'), track: 'music/01-aqua.mp3', w: 1.7, out: 'water', sfx: [[0.02, 'whoosh'], [0.2, 'whoosh'], [0.93, 'whoosh'], [0.97, 'splash']] },
  { id: 'pool', load: () => import('./scenes/pool.js'), track: 'music/03-pool.mp3', w: 1.8, out: 'white', sfx: [[0.0, 'bubbles'], [0.04, 'splash'], [0.36, 'splash'], [0.94, 'chime']] },
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

/* ---------- рендерер ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
kit.useRenderer(renderer);
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 1);
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 2000);
// десктоп: настоящее свечение неона и солнца (bloom); телефон — лёгкие ореолы-спрайты без постобработки
let composer = null, renderPass = null, bloomPass = null, vigPass = null;
if (!mobile) {
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
    // шейдеры компилируются параллельно (KHR_parallel_shader_compile), видео сцены грузятся вместе с ней
    await Promise.all([renderer.compileAsync ? renderer.compileAsync(res.scene, camera).catch(() => {}) : Promise.resolve(renderer.compile(res.scene, camera)), kit.videosReady(res.scene)]);
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
const FADE_COLOR = { black: '#000', water: '#0a5f8f', white: '#fff' };
// нырок AQUA → POOL снят в самих сценах (пузыри, толща воды), заливка только склеивает кадры
const FADE_LEN = { water: 0.014 };
function blackAt(i, t) {
  let k = 0, c = '#000';
  const inT = i === 0 ? 'black' : SCENES[i - 1].out, outT = SCENES[i].out;
  const fi = FADE_LEN[inT] ?? FADE, fo = FADE_LEN[outT] ?? FADE;
  if (FADE_COLOR[inT] && t < fi) { k = 1 - t / fi; c = FADE_COLOR[inT]; }
  if (FADE_COLOR[outT] && t > 1 - fo) { k = (t - (1 - fo)) / fo; c = FADE_COLOR[outT]; }
  if (fadeEl.dataset.c !== c) { fadeEl.style.background = c; fadeEl.dataset.c = c; }
  return Math.max(0, Math.min(1, k));
}
function apply(g) {
  const i = Math.min(N - 1, Math.floor(g)), t = g - i;
  const s = built.get(i);
  if (!s) { fadeEl.style.opacity = 1; buildScene(i).then(() => (dirty = true)); return false; }
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
  lootTick(s.scene, performance.now() / 1000);
  // живое превью следующей сцены в телефоне (дворец → вилла)
  // (через кадр: кадр виллы почти неподвижен, а рендер второй сцены дорогой)
  if (s.preview?.live?.(t) && built.has(i + 1) && (previewTick = !previewTick)) { renderPreview(s, built.get(i + 1), true); dirty = true; }
  if (composer) {
    renderPass.scene = s.scene; bloomPass.strength = (s.bloom ?? 0.42) * (1 + 0.3 * kit.pulse.beat);
    vigPass.uniforms.uZoom.value = speedK * 0.011; vigPass.uniforms.uRGB.value = speedK * 0.007;
    composer.render();
  } else renderer.render(s.scene, camera);
  if (i !== curIdx) { curIdx = i; audio.go(i); prefetch(i); kit.playVideos(s.scene); }
  finalEl.classList.toggle('on', i === N - 1 && t > (SCENES[i].final ?? 0.72));
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
function lootToast(n) {
  const done = n >= LOOT_TOTAL;
  lootEl.classList.toggle('done', done);
  lootEl.innerHTML = done ? `<b>${n}/${LOOT_TOTAL}</b> — все предметы собраны!<br>Приходи на любую тусовку СТАИ и забирай стикерпак в подарок`
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
    this.bus = this.ctx.createGain(); this.bus.connect(this.master);   // музыка отдельно от звуковых эффектов: её можно приглушить
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
  await Promise.all([fontP, cssFontP, loadPeople().then(() => setReal(45))]);
  // все сцены — сразу, пока крутится кольцо: дальше путешествие идёт без подгрузок
  // на прелоадере собираем первые две сцены; остальные — сразу следом по порядку, без остановки
  await buildScene(0); setReal(70);
  await buildScene(1); setReal(95);
  (async () => { for (let i = 2; i < N; i++) { await buildScene(i).catch(() => {}); await new Promise((r) => idle(r)); } })();
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
  pick: (x, y) => { const r = new THREE.Raycaster(); r.setFromCamera(new THREE.Vector2(x, y), camera); const s = built.get(curIdx)?.scene; return s ? r.intersectObject(s, true).slice(0, 4).map((h) => [h.object.type, h.object.name, h.object.parent?.name, h.object.material?.type, h.object.material?.name, +h.distance.toFixed(2), h.object.geometry?.type, JSON.stringify(h.object.geometry?.parameters ?? {}).slice(0, 80)]) : []; },
  loot: () => (built.get(curIdx)?.scene.userData.loot || []).filter((r) => r.visible).map((r) => { const v = r.getWorldPosition(new THREE.Vector3()).project(camera); return [r.userData.loot.id, +((v.x + 1) / 2 * innerWidth).toFixed(0), +((1 - v.y) / 2 * innerHeight).toFixed(0), v.z < 1]; }),
  dbg: () => ({ dir: camera.getWorldDirection(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)), g: cur, cam: camera.position.toArray().map((v) => +v.toFixed(4)), fov: +camera.fov.toFixed(2), aspect: +camera.aspect.toFixed(3) }),
};
