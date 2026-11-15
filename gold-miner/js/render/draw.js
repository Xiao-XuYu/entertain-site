// 场景绘制:天空、太阳、云、土地、矿工、绳、钩头、摆动预瞄
// 依赖 state.js (G.state 等)

function drawCloud(x, y, s) {
  var r = Math.max(14, 16 * G.scale * s);
  G.ctx.beginPath();
  G.ctx.arc(x,         y, r,       0, Math.PI * 2);
  G.ctx.arc(x + r,     y, r * 0.85, 0, Math.PI * 2);
  G.ctx.arc(x - r,     y, r * 0.75, 0, Math.PI * 2);
  G.ctx.arc(x + r*0.5, y - r*0.5,  r * 0.7, 0, Math.PI * 2);
  G.ctx.fill();
}

// 椭圆兼容 (Kindle 老 WebKit 不支持 ctx.ellipse)
function drawEllipse(cx, cy, rx, ry) {
  G.ctx.beginPath();
  for (var i = 0; i <= 36; i++) {
    var a = i * Math.PI * 2 / 36;
    var px = cx + rx * Math.cos(a);
    var py = cy + ry * Math.sin(a);
    if (i === 0) G.ctx.moveTo(px, py); else G.ctx.lineTo(px, py);
  }
  G.ctx.closePath();
}

function drawHookHead(x, y) {
  var sz = Math.max(14, 12 * G.scale);
  var ctx = G.ctx;
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.moveTo(x - sz, y);
  ctx.lineTo(x + sz, y);
  ctx.lineTo(x, y + sz * 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - sz - 6 * G.scale, y - 3 * G.scale, 6 * G.scale, 6 * G.scale);
  ctx.fillRect(x + sz,               y - 3 * G.scale, 6 * G.scale, 6 * G.scale);
  // 钩头顶端闪烁 (摆动时提示方向)
  if (G.state === G.IDLE) {
    var blink = Math.floor(Date.now() / 200) % 2;
    ctx.fillStyle = blink ? '#FFFFFF' : '#FFEB3B';
  } else {
    ctx.fillStyle = '#FFFFFF';
  }
  ctx.fillRect(x - 3, y - 10, 6, 5);
}

function draw() {
  var ctx = G.ctx;
  // 天空
  ctx.fillStyle = '#6BB6FF';
  ctx.fillRect(0, 0, G.W, G.groundY);

  // 太阳
  ctx.fillStyle = '#FFEB3B';
  var sr = Math.max(22, 22 * G.scale);
  ctx.beginPath();
  ctx.arc(Math.floor(G.W * 0.85), Math.floor(G.H * 0.08), sr, 0, Math.PI * 2);
  ctx.fill();

  // 云
  ctx.fillStyle = '#FFFFFF';
  drawCloud(G.W * 0.20, G.H * 0.10, 1.0);
  drawCloud(G.W * 0.65, G.H * 0.05, 0.8);

  // 土地
  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(0, G.groundY, G.W, G.H - G.groundY);
  ctx.fillStyle = '#4CAF50';
  var gh = Math.max(8, 8 * G.scale);
  ctx.fillRect(0, G.groundY - gh, G.W, gh);

  // 矿工
  var bw = Math.max(44, 38 * G.scale), bh = Math.max(36, 30 * G.scale);
  ctx.fillStyle = '#E53935';
  ctx.fillRect(G.miner.x - bw / 2, G.miner.y - bh, bw, bh);
  var hr = Math.max(16, 14 * G.scale);
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(G.miner.x, G.miner.y - bh - hr, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(G.miner.x - 18 * G.scale, G.miner.y - bh - hr * 2 - 4 * G.scale, 36 * G.scale, 5 * G.scale);
  ctx.fillRect(G.miner.x - 13 * G.scale, G.miner.y - bh - hr * 2 - 14 * G.scale, 26 * G.scale, 10 * G.scale);

  // 摆动预瞄虚影 (IDLE 时)
  if (G.state === G.IDLE) {
    var previewLen = G.hookLen + 30 * G.scale;
    var px = G.miner.x + Math.cos(G.hookAngle) * previewLen;
    var py = G.miner.y + Math.sin(G.hookAngle) * previewLen;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(px, py, 10 * G.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绳
  var tip = getTip();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(4, 4 * G.scale);
  ctx.beginPath();
  ctx.moveTo(G.miner.x, G.miner.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  // 钩头或抓到的物品
  if (G.state === G.BACK && G.target) {
    drawItem(G.target, G.target.x, G.target.y);
  } else {
    drawHookHead(tip.x, tip.y);
  }

  // 物品
  for (var i = 0; i < G.items.length; i++) {
    var it = G.items[i];
    if (it === G.target && G.state === G.BACK) continue;
    drawItem(it, it.x, it.y);
  }
}