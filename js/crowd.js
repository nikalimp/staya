// STAYA — толпа: тёмные силуэты с цветным контровым светом и огоньками телефонов.
// Шесть поз нарисованы на canvas в атлас; каждая фигура — плоскость, всегда развёрнутая к камере вокруг вертикали.
// Все фигуры — один InstancedMesh (один вызов отрисовки). Фигуры подпрыгивают в такт музыке (kit.pulse).
import { THREE, rng, pulse } from './kit.js';

const COLS = 3, ROWS = 2, CELL = 512;

function atlas(rim) {
  const c = document.createElement('canvas'); c.width = COLS * CELL; c.height = ROWS * CELL; const x = c.getContext('2d');
  // координаты фигуры в ячейке: макушка y≈112, плечи 200, таз 340, стопы 512 (рост ≈ 1.75 м при высоте ячейки 2.2 м)
  const poses = [
    { l: [[-85, 130], [-70, 40]], r: [[85, 130], [70, 40]] },                       // обе руки вверх
    { l: [[-74, 280], [-66, 350]], r: [[90, 128], [80, 52]], phone: [80, 40] },      // телефон в поднятой руке
    { l: [[-72, 285], [-64, 355]], r: [[72, 285], [64, 355]] },                       // руки опущены
    { l: [[-66, 110], [-58, 22]], r: [[74, 280], [66, 350]] },                        // кулак вверх
    { l: [[-60, 120], [-26, 52]], r: [[60, 120], [26, 52]], hair: true },             // ладони над головой, длинные волосы
    { l: [[-58, 250], [-14, 178]], r: [[58, 250], [14, 178]], phone: [0, 160] },      // снимает на телефон у лица
  ];
  const body = (cx, p, fill) => {
    x.fillStyle = fill; x.strokeStyle = fill; x.lineCap = 'round'; x.lineJoin = 'round';
    if (p.hair) { x.beginPath(); x.ellipse(cx, 175, 40, 70, 0, 0, 7); x.fill(); }
    x.beginPath(); x.ellipse(cx, 146, 29, 36, 0, 0, 7); x.fill();
    x.fillRect(cx - 12, 170, 24, 34);
    x.beginPath(); x.moveTo(cx - 64, 206); x.quadraticCurveTo(cx, 186, cx + 64, 206); x.lineTo(cx + 50, 340); x.lineTo(cx - 50, 340); x.closePath(); x.fill();
    x.lineWidth = 40; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 26, 330); x.lineTo(cx + s * 32, 505); x.stroke(); }
    x.lineWidth = 27; for (const arm of [p.l, p.r]) { const s = Math.sign(arm[0][0]); x.beginPath(); x.moveTo(cx + s * 56, 212); x.lineTo(cx + arm[0][0], arm[0][1]); x.lineTo(cx + arm[1][0], arm[1][1]); x.stroke(); }
  };
  poses.forEach((p, i) => {
    const ox = (i % COLS) * CELL, oy = Math.floor(i / COLS) * CELL, cx = ox + CELL / 2;
    x.save(); x.beginPath(); x.rect(ox, oy, CELL, CELL); x.clip(); x.translate(0, oy);
    // контровой свет: цветной ореол по контуру с двух сторон
    x.save(); x.shadowColor = rim[i % rim.length]; x.shadowBlur = 12; x.globalAlpha = 0.85; x.translate(-3, 0); body(cx, p, rim[i % rim.length]); x.restore();
    x.save(); x.shadowColor = rim[(i + 1) % rim.length]; x.shadowBlur = 12; x.globalAlpha = 0.85; x.translate(3, 0); body(cx, p, rim[(i + 1) % rim.length]); x.restore();
    body(cx, p, '#07040b');
    if (p.phone) {
      const [px, py] = p.phone; x.save(); x.shadowColor = '#ffffff'; x.shadowBlur = 22; x.fillStyle = '#ffffff'; x.fillRect(cx + px - 12, py - 20, 24, 40); x.restore();
    }
    x.restore();
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// o.pos — массив [x, z]; o.y — уровень пола; o.rim — цвета контрового света; o.fog — туман сцены
export function crowd(o) {
  const R = rng(o.seed ?? 7), n = o.pos.length;
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0));
  const iPos = new Float32Array(n * 3), iH = new Float32Array(n), iVar = new Float32Array(n), iPh = new Float32Array(n);
  o.pos.forEach(([px, pz], i) => { iPos.set([px, o.y ?? 0, pz], i * 3); iH[i] = 2.2 * (0.9 + R() * 0.15); iVar[i] = Math.floor(R() * COLS * ROWS); iPh[i] = R(); });
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
  geo.setAttribute('iH', new THREE.InstancedBufferAttribute(iH, 1));
  geo.setAttribute('iVar', new THREE.InstancedBufferAttribute(iVar, 1));
  geo.setAttribute('iPh', new THREE.InstancedBufferAttribute(iPh, 1));
  geo.instanceCount = n;
  const fog = o.fog;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: atlas(o.rim ?? ['#ff2fd0', '#21e0ff', '#8a3dff']) }, uTime: { value: 0 }, uBeat: pulse.u, fogColor: { value: fog ? fog.color : new THREE.Color() }, fogDensity: { value: fog ? fog.density : 0 } },
    vertexShader: `uniform float uTime, uBeat; attribute vec3 iPos; attribute float iH, iVar, iPh; varying vec2 vUv; varying float vD;
      void main(){
        vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]));
        float hop = abs(sin(uTime * 4.2 + iPh * 6.283)) * 0.05 + uBeat * 0.16 * (0.4 + fract(iPh * 7.31));
        vec3 wp = iPos + right * position.x * iH + vec3(0., position.y * iH + hop, 0.);
        wp += right * sin(uTime * 1.3 + iPh * 9.) * 0.05 * position.y;
        vec4 mv = viewMatrix * vec4(wp, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
        float col = mod(iVar, ${COLS}.), row = floor(iVar / ${COLS}.);
        vUv = vec2((col + uv.x) / ${COLS}., 1. - (row + 1. - uv.y) / ${ROWS}.);
      }`,
    fragmentShader: `uniform sampler2D map; uniform float uBeat, fogDensity; uniform vec3 fogColor; varying vec2 vUv; varying float vD;
      void main(){
        vec4 c = texture2D(map, vUv); if (c.a < 0.45) discard;
        float phone = step(0.9, min(c.r, min(c.g, c.b)));
        vec3 col = c.rgb * (1. + phone * (2.2 + uBeat * 1.5));
        float f = 1. - exp(-fogDensity * fogDensity * vD * vD);
        gl_FragColor = vec4(mix(col, fogColor, f * (1. - phone * 0.7)), 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.userData.dynamic = true;
  mesh.userData.tick = (now) => { mat.uniforms.uTime.value = now; };
  return mesh;
}

// раскладка зрителей вокруг точки: кольцо от rMin до rMax, минимальный шаг gap, ok(x, z) — можно ли ставить
export function scatter(cx, cz, rMin, rMax, gap, ok, seed = 3, tries = 4000) {
  const R = rng(seed), pts = [];
  for (let i = 0; i < tries; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(rMin * rMin + R() * (rMax * rMax - rMin * rMin)), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (!ok(x, z)) continue;
    if (pts.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < gap * gap)) continue;
    pts.push([x, z]);
  }
  return pts;
}
