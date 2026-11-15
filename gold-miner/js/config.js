// 全局共享状态与常量。所有子文件都读写 G,函数用全局局部函数(非模块脚本共享作用域)。
var G = window.G = window.G || {};

// 状态枚举
G.IDLE = 0;
G.OUT  = 1;
G.BACK = 2;

// 尺寸缩放基准:设计以 600 短边为基准
G.BASE = 600;

// 物品表: [type, val, r, count, color, dark]
G.ITEM_TYPES = [
  // 金块 (卡通金黄,带描边)
  ['goldBig',   100, 30, 4, '#FFD700', '#B8860B'],
  ['goldMid',    50, 24, 6, '#FFC107', '#B8860B'],
  ['goldSmall',  20, 18, 8, '#FFB300', '#8B6914'],
  // 卡通动物
  ['chicken',    80, 28, 4, '#FFD54F', '#F9A825'],
  ['pig',        50, 24, 5, '#F8BBD0', '#EC407A'],
  ['rabbit',     30, 22, 5, '#FFFFFF', '#9E9E9E'],
  ['cat',        40, 24, 4, '#FFB74D', '#E65100'],
  ['turtle',     15, 26, 3, '#81C784', '#2E7D32'],
  // 钻石
  ['diamond',   250, 18, 4, '#00E5FF', '#0097A7']
];

// 伪随机 (Kindle 老内核无需浏览器 Math.random,保证一致分布)
G._seed = 12345;
function srand() {
  G._seed = (G._seed * 9301 + 49297) % 233280;
  return G._seed / 233280;
}
function R(a, b) { return a + srand() * (b - a); }

// 水平均匀分布,带抖动,避免物品重叠在中央
function distributeX(total, idx, r) {
  var margin = r + 10;
  var usable = G.W - margin * 2;
  if (usable <= 0) usable = G.W;
  var bucket = usable / total;
  var baseX = margin + bucket * idx + bucket * 0.5;
  var jitter = (srand() - 0.5) * bucket * 0.8;
  var x = baseX + jitter;
  if (x < margin) x = margin;
  if (x > G.W - margin) x = G.W - margin;
  return x;
}