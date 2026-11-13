// 一笔笔迹：网格空间坐标点 {x, y, w(压力 0..1)}
export function createStroke(p) {
  return { points: [p] };
}

export function addStrokePoint(stroke, p) {
  stroke.points.push(p);
}
