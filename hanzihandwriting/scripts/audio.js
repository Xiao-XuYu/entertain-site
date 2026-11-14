// 提示音：Web Audio 振荡器短音
window.toneFx = (function () {
  let actx = null;
  return function tone(f, d = .14, type = 'triangle', v = .18, w = 0) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + w;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  };
})();

// 依笔顺步进的五声音阶（C 大调）
window.TONE_PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];