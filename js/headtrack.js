// Слежение за головой через веб-камеру (только десктоп, по желанию пользователя).
// Видео обрабатывается на устройстве (MediaPipe Face Detector), никуда не отправляется.
// Отдаёт сглаженные смещение (x, y), поворот (yaw, pitch) и приближение к экрану (z) головы от исходного положения, примерно −1…1.
const VER = '0.10.14';
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

export async function startHeadTrack(onMove) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
  const video = Object.assign(document.createElement('video'), { muted: true, playsInline: true, srcObject: stream });
  await video.play();
  const { FilesetResolver, FaceDetector } = await import(/* @vite-ignore */ `${CDN}/vision_bundle.mjs`);
  const files = await FilesetResolver.forVisionTasks(`${CDN}/wasm`);
  const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', minDetectionConfidence: 0.5 });
  let det;
  try { det = await FaceDetector.createFromOptions(files, opts('GPU')); } catch { det = await FaceDetector.createFromOptions(files, opts('CPU')); }
  let run = true, last = -1, base = null, n = 0;
  const sm = { x: 0, y: 0, yaw: 0, pitch: 0, z: 0 }, cal = { x: 0, y: 0, yaw: 0, pitch: 0, z: 0 };
  const tick = () => {
    if (!run) return;
    const now = performance.now();
    if (video.readyState >= 2 && now - last > 55) {
      last = now;
      const d = det.detectForVideo(video, now).detections[0];
      if (d) {
        const b = d.boundingBox, w = video.videoWidth || 320, h = video.videoHeight || 240;
        // положение: центр лица в кадре, −1…1; по X зеркалим, +x — зритель сдвинулся вправо, +y — вверх
        const v = { x: -((b.originX + b.width / 2) / w * 2 - 1), y: -((b.originY + b.height / 2) / h * 2 - 1), yaw: 0, pitch: 0, z: b.width / w };
        // поворот: нос относительно середины глаз (ключевые точки: глаз П, глаз Л, нос, рот, уши)
        const k = d.keypoints;
        if (k && k.length >= 4) {
          const ex = (k[0].x + k[1].x) / 2, ey = (k[0].y + k[1].y) / 2, ed = Math.hypot(k[0].x - k[1].x, k[0].y - k[1].y) || 1;
          v.yaw = -(k[2].x - ex) / ed;                      // + зритель повернул голову вправо
          v.pitch = -((k[2].y - ey) / ((k[3].y - ey) || 1)); // + зритель поднял взгляд
        }
        if (n < 12) { for (const q in cal) cal[q] += v[q]; n++; if (n === 12) { base = {}; for (const q in cal) base[q] = cal[q] / 12; } }
        else {
          const g = { x: 2.2, y: 2.2, yaw: 3, pitch: 4, z: 0 };
          for (const q in sm) {
            // z: насколько лицо крупнее, чем при калибровке (зритель приблизился к экрану)
            let d = q === 'z' ? (v.z / base.z - 1) * 2.5 : (v[q] - base[q]) * g[q];
            d = Math.sign(d) * Math.max(0, Math.abs(d) - 0.04);   // мёртвая зона: дрожь детектора не качает сцену
            sm[q] += (Math.max(-1, Math.min(1, d)) - sm[q]) * 0.5;
          }
          onMove(sm);
        }
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
  return { stop() { run = false; stream.getTracks().forEach((t) => t.stop()); det.close?.(); onMove({ x: 0, y: 0, yaw: 0, pitch: 0, z: 0 }); } };
}
