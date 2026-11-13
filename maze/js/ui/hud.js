export function createHud() {
  const hudEl = document.getElementById('hud');
  const timeEl = document.getElementById('hud-time');
  const msgEl = document.getElementById('hud-msg');
  let startTs = 0, stopTs = 0, interval = null;

  const fmt = (sec) =>
    `${String((sec / 60) | 0).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const elapsed = () => (((stopTs || Date.now()) - startTs) / 1000) | 0;
  const tick = () => { timeEl.textContent = `⏱ ${fmt(elapsed())}`; };

  return {
    setMsg(t) { msgEl.textContent = t; },
    nudge(t) {
      msgEl.textContent = t;
      hudEl.classList.remove('nudge');
      void hudEl.offsetWidth;
      hudEl.classList.add('nudge');
    },
    startTimer() {
      clearInterval(interval);
      startTs = Date.now();
      stopTs = 0;
      timeEl.textContent = '⏱ 00:00';
      interval = setInterval(tick, 500);
    },
    stopTimer() { stopTs = Date.now(); },
    elapsedText() { return fmt(elapsed()); },
  };
}
