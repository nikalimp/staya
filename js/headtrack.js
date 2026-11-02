// Слежение за головой через веб-камеру (только десктоп, по желанию пользователя).
// Видео обрабатывается на устройстве (MediaPipe Face Detector), никуда не отправляется.
// Отдаёт сглаженное смещение головы от исходного положения: x, y в диапазоне примерно −1…1.
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
  let run = true, last = -1, base = null, n = 0, sx = 0, sy = 0;
  const cal = { x: 0, y: 0 };
  const tick = () => {
    if (!run) return;
    const now = performance.now();
    if (video.readyState >= 2 && now - last > 55) {
      last = now;
      const d = det.detectForVideo(video, now).detections[0];
      if (d) {
        const b = d.boundingBox, w = video.videoWidth || 320, h = video.videoHeight || 240;
        // центр лица в кадре, −1…1; по X зеркалим (как в зеркале)
        const x = -((b.originX + b.width / 2) / w * 2 - 1), y = -((b.originY + b.height / 2) / h * 2 - 1);
        if (n < 12) { cal.x += x; cal.y += y; n++; if (n === 12) base = { x: cal.x / 12, y: cal.y / 12 }; }
        else {
          sx += ((x - base.x) * 2.2 - sx) * 0.35; sy += ((y - base.y) * 2.2 - sy) * 0.35;
          onMove(Math.max(-1, Math.min(1, sx)), Math.max(-1, Math.min(1, sy)));
        }
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
  return { stop() { run = false; stream.getTracks().forEach((t) => t.stop()); det.close?.(); onMove(0, 0); } };
}
