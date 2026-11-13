import { segmentsProperlyCross } from '../geometry/intersect.js';

// 笔迹线段 a→b 是否穿过某面墙；返回被穿过的墙，否则 null
export function findWallCrossing(a, b, segs) {
  const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
  for (const s of segs) {
    if (s.x2 < minX || s.x1 > maxX || s.y2 < minY || s.y1 > maxY) continue;
    if (segmentsProperlyCross(a, b, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 })) return s;
  }
  return null;
}
