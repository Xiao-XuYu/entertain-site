import { findWallCrossing } from './collision.js';

// 网格空间采样步长（格子单位）
const STEP = 0.25;

function cellAt(x, y, cols, rows) {
  const c = Math.floor(x), r = Math.floor(y);
  if (c < 0 || r < 0 || c >= cols || r >= rows) return null;
  return r * cols + c;
}

// 过关判定：所有笔迹合起来必须“包含”一条从 🏰(0,0) 到 👑(cols-1,rows-1)、
// 不穿墙的连续路线。穿墙的段照样显示，只是不参与连通；
// 两个格子算连通 ⇔ 有一条不穿墙的笔迹段真实走过这两个格子之间。
export function hasWinningRoute(strokes, walls, maze) {
  const { cols, rows } = maze;
  const center = (n) => ({ x: (n % cols) + 0.5, y: ((n / cols) | 0) + 0.5 });

  const adj = new Map();
  const link = (a, b) => {
    if (a === null || b === null || a === b) return;
    // 防采样在格子边界抖动造成的假连通：格子中心连线穿墙则不算
    if (findWallCrossing(center(a), center(b), walls)) return;
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  };

  for (const st of strokes) {
    const pts = st.points;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      if (findWallCrossing(a, b, walls)) continue; // 穿墙段：保留笔迹但不算路线
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.ceil(len / STEP));
      let prev = cellAt(a.x, a.y, cols, rows);
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const cur = cellAt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, cols, rows);
        link(prev, cur);
        if (cur !== null) prev = cur;
      }
    }
  }

  const start = cellAt(0.5, 0.5, cols, rows);
  const target = cellAt(cols - 0.5, rows - 0.5, cols, rows);
  if (start === target) return true;
  if (!adj.has(start) || !adj.has(target)) return false;

  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const n = q.pop();
    if (n === target) return true;
    for (const m of adj.get(n)) {
      if (!seen.has(m)) { seen.add(m); q.push(m); }
    }
  }
  return false;
}
