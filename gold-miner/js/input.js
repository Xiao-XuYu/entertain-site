// 输入处理 (触摸/键盘),并负责解锁音频
// IDLE → 点击 → OUT   (基于当前摆动方向发射)
// OUT  → 点击 → BACK  (取消发射,空钩收回)
// BACK → 点击 → OUT   (再发射,跳过收回)
// 0 时间 → 点击 → reset (重玩)

function onTap(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  // 首次交互解锁音频 (浏览器自动播放策略)
  G.audio.unlock();

  if (G.timeLeft <= 0) { reset(); return; }
  if (G.state === G.IDLE) {
    G.state = G.OUT;
    G.outSpeed = 560 * G.scale;
    G.audio.sfx.launch();
  } else if (G.state === G.OUT) {
    if (G.target) { G.target.taken = false; G.target = null; }
    G.state = G.BACK;
    G.retractSpeed = 640 * G.scale;
    G.audio.sfx.miss();
  } else if (G.state === G.BACK) {
    if (G.target) { G.target.taken = false; G.target = null; }
    G.hookLen = 0;
    G.hookAngle = Math.PI / 2;
    G.state = G.OUT;
    G.outSpeed = 560 * G.scale;
    G.audio.sfx.launch();
  }
}

window.addEventListener('load', function () {
  G.canvas.addEventListener('touchstart', onTap, false);
  G.canvas.addEventListener('click', onTap, false);
  document.addEventListener('keydown', function (e) {
    var k = e.keyCode || e.which || 0;
    var key = e.key || '';
    if (key === ' ' || key === 'Enter' || key === 'ArrowDown' ||
        k === 13 || k === 32 || k === 40) {
      if (e.preventDefault) e.preventDefault();
      onTap(e);
    }
  }, false);
});