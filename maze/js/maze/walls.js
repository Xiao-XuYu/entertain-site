import { WALLS } from './cell.js';

// 把迷宫墙转换成网格空间(x:0..cols, y:0..rows)的线段，供划线碰撞检测用
export function wallSegments(maze) {
  const { cols, rows, cells } = maze;
  const segs = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = cells[y * cols + x];
      if (c & WALLS.N) segs.push({ x1: x, y1: y, x2: x + 1, y2: y });
      if (c & WALLS.W) segs.push({ x1: x, y1: y, x2: x, y2: y + 1 });
      if (x === cols - 1 && (c & WALLS.E)) segs.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1 });
      if (y === rows - 1 && (c & WALLS.S)) segs.push({ x1: x, y1: y + 1, x2: x + 1, y2: y + 1 });
    }
  }
  return segs;
}
