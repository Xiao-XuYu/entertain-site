// 入口:Canvas 初始化、viewport/全屏自适应 (Kindle 兼容)、布局、主循环、启动

function getViewport() {
  var w = 600, h = 800;
  try {
    if (window.visualViewport && window.visualViewport.height) {
      w = window.visualViewport.width  || w;
      h = window.visualViewport.height || h;
    }
    w = window.innerWidth  || w;
    h = window.innerHeight || h;
    if (document.documentElement && document.documentElement.clientHeight) {
      var cw = document.documentElement.clientWidth;
      var ch = document.documentElement.clientHeight;
      if (cw > 0 && cw > w) w = cw;
      if (ch > 0 && ch > h) h = ch;
    }
  } catch (e) {}
  if (w < 100) w = 600;
  if (h < 100) h = 800;
  return { w: w, h: h };
}

function resize() {
  var v = getViewport();
  G.W = v.w; G.H = v.h;
  G.canvas.width  = G.W;
  G.canvas.height = G.H;
  G.canvas.style.width  = G.W + 'px';
  G.canvas.style.height = G.H + 'px';
  layout();
}

function layout() {
  G.scale = Math.min(G.W, G.H) / G.BASE;
  if (G.scale < 1) G.scale = 1;
  G.groundY = G.H * 0.30;
  G.miner = { x: G.W / 2, y: G.H * 0.08 };
  if (G.items) {
    var gy = G.groundY + 20, gh = G.H - gy - 20;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y < gy) it.y = gy + Math.random() * gh;
      it.x = distributeX(G.items.length, i, it.r);
    }
  }
}

var _last = 0;
function loop() {
  var now = Date.now();
  var dt = _last ? Math.min((now - _last) / 1000, 0.1) : 0.016;
  _last = now;
  update(dt);
  draw();
}

// 启动
(function init() {
  G.canvas = document.getElementById('game');
  G.ctx = G.canvas.getContext('2d');

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 200); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
  }

  resize();
  reset();
  // 兜底:Kindle 实验浏览器 viewport 经常延迟到位
  var delays = [100, 300, 600, 1000, 1500, 2500, 4000];
  for (var i = 0; i < delays.length; i++) {
    (function (d) { setTimeout(resize, d); })(delays[i]);
  }
  setInterval(loop, 1000 / 40);
})();