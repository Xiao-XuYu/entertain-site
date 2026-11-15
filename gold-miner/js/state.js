// 游戏状态、重置与物品生成
// 依赖 config.js 提供的 G / srand / R / distributeX、G.ITEM_TYPES

function reset() {
  G.state = G.IDLE;
  G.score = 0;
  G.timeLeft = 60;
  G.hookLen = 0;
  G.hookAngle = Math.PI / 2;
  G.swingDir = 1;
  G.target = null;
  G.retractSpeed = 0;
  G.outSpeed = 560 * G.scale;
  G.items = [];
  spawnItems();
  layout();
}

function spawnItems() {
  var gy = G.groundY + 30;
  var gh = G.H - gy - 30;
  var idx = 0;
  var types = G.ITEM_TYPES;
  for (var t = 0; t < types.length; t++) {
    var type = types[t];
    for (var i = 0; i < type[3]; i++) {
      G.items.push({
        x: 0,
        y: R(gy + 10, gy + gh - type[2]),
        r: type[2] * G.scale,
        val: type[1],
        type: type[0],
        color: type[4],
        dark: type[5],
        taken: false
      });
      G.items[G.items.length - 1].x = distributeX(43, idx++, G.items[G.items.length - 1].r);
    }
  }
}