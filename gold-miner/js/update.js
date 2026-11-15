// 游戏主逻辑:更新状态、钩头位置、抓取判断、得分、倒计时
// 依赖 config.js / state.js / audio.js

var _lastTickCeil = -1;

function getTip() {
  return {
    x: G.miner.x + Math.cos(G.hookAngle) * G.hookLen,
    y: G.miner.y + Math.sin(G.hookAngle) * G.hookLen
  };
}

function update(dt) {
  if (G.timeLeft > 0) G.timeLeft -= dt;
  if (G.timeLeft < 0) G.timeLeft = 0;

  // 最后 10 秒每秒响一次警告
  var c = Math.ceil(G.timeLeft);
  if (c >= 1 && c <= 10 && c !== _lastTickCeil) {
    _lastTickCeil = c;
    G.audio.sfx.tick();
  }

  // IDLE 自动摆动
  if (G.state === G.IDLE) {
    G.hookAngle += G.swingDir * 2.5 * dt;
    if (G.hookAngle > Math.PI - 0.10) G.swingDir = -1;
    if (G.hookAngle < 0.10)           G.swingDir = 1;
  }

  // 伸出
  if (G.state === G.OUT) {
    G.hookLen += G.outSpeed * dt;
    var tip = getTip();
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.taken) continue;
      var dx = tip.x - it.x, dy = tip.y - it.y;
      var rr = (it.r + 6 * G.scale);
      if (dx * dx + dy * dy < rr * rr) {
        G.target = it;
        it.taken = true;
        G.state = G.BACK;
        G.retractSpeed = (it.type === 'diamond') ? 220 * G.scale :
                         (it.type === 'turtle')  ? 110 * G.scale :
                         (it.type === 'pig')     ? 180 * G.scale :
                         (it.type === 'goldBig') ? 200 * G.scale :
                         (600 - it.r * 10) * G.scale;
        // 音效:按物品类型发声
        G.audio.sfx[it.type === 'diamond' ? 'hitDiamond' :
                    (it.type.indexOf('gold') === 0 ? 'hitGold' : 'hitAnimal')]();
        break;
      }
    }
    // 空钩触底收回
    if (G.state === G.OUT) {
      if (G.hookLen >= G.H * 0.95 || tip.y >= G.H - 5) {
        G.state = G.BACK;
        G.retractSpeed = 640 * G.scale;
        G.audio.sfx.miss();
      }
    }
  }

  // 收回
  if (G.state === G.BACK) {
    G.hookLen -= G.retractSpeed * dt;
    if (G.hookLen < 0) G.hookLen = 0;
    if (G.target) {
      G.target.x = G.miner.x + Math.cos(G.hookAngle) * G.hookLen;
      G.target.y = G.miner.y + Math.sin(G.hookAngle) * G.hookLen;
    }
    if (G.hookLen <= 0) {
      G.hookLen = 0;
      if (G.target) {
        G.score += G.target.val;
        G.audio.sfx.collect();
        for (var j = G.items.length - 1; j >= 0; j--) {
          if (G.items[j] === G.target) { G.items.splice(j, 1); break; }
        }
        G.target = null;
      }
      G.hookAngle = Math.PI / 2;
      G.state = G.IDLE;
    }
  }
  updateHud();
}

function updateHud() {
  document.getElementById('score').textContent = '分数 ' + G.score;
  document.getElementById('time').textContent  = '时间 ' + Math.ceil(G.timeLeft);
  var msg = document.getElementById('msg');
  if (G.timeLeft <= 0) {
    msg.style.display = '-webkit-box';
    msg.style.display = 'flex';
    document.getElementById('msgScore').textContent = '得分 ' + G.score;
  } else {
    msg.style.display = 'none';
  }
}