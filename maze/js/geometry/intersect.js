function orient(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

// 严格“穿过”判定：只在两条线段内部真正相交时返回 true；
// 擦过端点、沿墙重合滑动都不算碰墙（贴着墙画线是合法的）
export function segmentsProperlyCross(a, b, c, d, eps = 1e-9) {
  const d1 = orient(a, b, c), d2 = orient(a, b, d);
  const d3 = orient(c, d, a), d4 = orient(c, d, b);
  return ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps))
      && ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps));
}
