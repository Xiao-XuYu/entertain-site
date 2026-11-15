// 用 Web Audio 现场合成音效，不占离线缓存。首次播放必须在用户手势内，
// 否则浏览器禁止发声；所以音频上下文懒创建并在每次播放时 resume 兜底。
let ctx = null;

function ac() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, { dur = 0.15, type = 'sine', gain = 0.2, at = 0, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.linearRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  win() {
    for (const [i, f] of [523.25, 659.25, 783.99, 1046.5].entries())
      tone(f, { dur: 0.35, gain: 0.18, at: i * 0.09 });
  },
  wall() { tone(120, { type: 'triangle', gain: 0.25, dur: 0.12, slide: 70 }); },
  step() { tone(680, { gain: 0.08, dur: 0.05 }); },
  place() { tone(880, { gain: 0.13, dur: 0.09 }); },
  click() { tone(520, { gain: 0.08, dur: 0.05, slide: 340 }); },
};