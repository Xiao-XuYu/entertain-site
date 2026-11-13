// 网格空间：x∈[0,cols], y∈[0,rows]；笔迹与墙都存网格坐标，resize 后自动重投影
// 迷宫自适应铺满内容区：cellW / cellH 各自按可用宽高缩放，不再锁死成正方形
// cell = min(cellW, cellH)，只作为装饰尺度（圆角、字号、线宽、点距），避免扁格子上装饰溢出
export const CARD_PAD_RATIO = 0.34;

export function computeGeometry(viewW, viewH, cols, rows, insets) {
  const availW = Math.max(60, viewW - insets.left - insets.right);
  const availH = Math.max(60, viewH - insets.top - insets.bottom);
  // 卡片留白按未内缩的格子估算，再用同一个 pad 反推格子：卡片正好贴合内容区边界
  const pad = CARD_PAD_RATIO * Math.min(availW / cols, availH / rows);
  const cellW = (availW - pad * 2) / cols;
  const cellH = (availH - pad * 2) / rows;
  const cell = Math.min(cellW, cellH);
  return {
    cell, cellW, cellH, pad,
    ox: insets.left + pad, oy: insets.top + pad,
    w: cellW * cols, h: cellH * rows,
    cols, rows,
  };
}

export function toGrid(px, py, geo) {
  return { x: (px - geo.ox) / geo.cellW, y: (py - geo.oy) / geo.cellH };
}

export function toPx(gx, gy, geo) {
  return { x: geo.ox + gx * geo.cellW, y: geo.oy + gy * geo.cellH };
}
