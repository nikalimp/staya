// Звуковые эффекты, синтезированные в WebAudio (без файлов): плеск, пузыри, звон стакана, скрип двери, свист ветра.
// Играют поверх музыки, через общий мастер-канал (выключатель звука глушит и их).
export function makeSfx(ctx, out) {
  const now = () => ctx.currentTime;
  const noise = (dur) => {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  };
  const env = (g, t0, a, peak, dec) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dec); };
  const bus = ctx.createGain(); bus.gain.value = 0.55; bus.connect(out);

  const fx = {
    // плеск: шумовой всплеск через полосовой фильтр, частота падает
    splash() {
      const t = now(), n = noise(1.4), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(380, t + 1.1);
      env(g, t, 0.02, 0.9, 1.2); n.connect(f).connect(g).connect(bus); n.start(t); n.stop(t + 1.4);
      fx.bubbles(0.25);
    },
    // пузыри: короткие синусы со скользящей вверх высотой
    bubbles(delay = 0) {
      const t0 = now() + delay;
      for (let i = 0; i < 9; i++) {
        const t = t0 + i * 0.07 + Math.random() * 0.05, o = ctx.createOscillator(), g = ctx.createGain(), f0 = 300 + Math.random() * 500;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t + 0.08);
        env(g, t, 0.005, 0.12, 0.09); o.connect(g).connect(bus); o.start(t); o.stop(t + 0.12);
      }
    },
    // звон стакана: несколько негармоничных обертонов с долгим затуханием
    clink() {
      const t = now();
      [[2600, 0.22], [4100, 0.12], [5300, 0.08], [7200, 0.05]].forEach(([fr, a]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = fr * (0.99 + Math.random() * 0.02);
        env(g, t, 0.002, a, 0.9); o.connect(g).connect(bus); o.start(t); o.stop(t + 1);
      });
    },
    // глоток напитка: низкий «глюк»
    gulp() {
      const t = now(), o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.15);
      env(g, t, 0.01, 0.35, 0.16); o.connect(g).connect(bus); o.start(t); o.stop(t + 0.2);
    },
    // скрип двери: пила с медленным вибрато через резонанс
    door() {
      const t = now(), o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(140, t + 1.3);
      lfo.frequency.value = 7; lg.gain.value = 12; lfo.connect(lg).connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
      env(g, t, 0.15, 0.22, 1.3); o.connect(f).connect(g).connect(bus); o.start(t); lfo.start(t); o.stop(t + 1.6); lfo.stop(t + 1.6);
    },
    // свист ветра / проход сквозь пространство
    // гул на стыке миров: низкий тон 48 Гц с медленным нарастанием и спадом
    rumble() {
      const t = now(), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(34, t + 1.4);
      env(g, t, 0.25, 0.5, 1.2); o.connect(g).connect(bus); o.start(t); o.stop(t + 1.6);
    },
    whoosh() {
      const t = now(), n = noise(1.6), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.7); f.frequency.exponentialRampToValueAtTime(500, t + 1.5);
      env(g, t, 0.5, 0.35, 1.0); n.connect(f).connect(g).connect(bus); n.start(t); n.stop(t + 1.6);
    },
    // щелчок рубильника: свет гаснет
    click() {
      const t = now(), n = noise(0.08), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'highpass'; f.frequency.value = 1800; env(g, t, 0.002, 0.6, 0.06); n.connect(f).connect(g).connect(bus); n.start(t); n.stop(t + 0.08);
      const o = ctx.createOscillator(), g2 = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      env(g2, t, 0.003, 0.35, 0.12); o.connect(g2).connect(bus); o.start(t); o.stop(t + 0.15);
    },
    // глухой удар и гул: свет включается — она ближе
    thud() {
      const t = now(), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.9);
      env(g, t, 0.01, 1.0, 1.4); o.connect(g).connect(bus); o.start(t); o.stop(t + 1.5);
      const n = noise(2.2), f = ctx.createBiquadFilter(), g2 = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 220;
      env(g2, t, 0.05, 0.28, 2.0); n.connect(f).connect(g2).connect(bus); n.start(t); n.stop(t + 2.2);
    },
    // мягкий аккорд-колокольчик на начало титров
    chime() {
      const t = now();
      [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = fr;
        env(g, t + i * 0.09, 0.02, 0.1, 2.2); o.connect(g).connect(bus); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 2.4);
      });
    },
  };
  return fx;
}
