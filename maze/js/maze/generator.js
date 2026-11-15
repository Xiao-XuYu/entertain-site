import { WALLS } from './cell.js';

const DIRS = [
  { dx: 0, dy: -1, wall: WALLS.N, opp: WALLS.S },
  { dx: 1, dy: 0,  wall: WALLS.E, opp: WALLS.W },
  { dx: 0, dy: 1,  wall: WALLS.S, opp: WALLS.N },
  { dx: -1, dy: 0, wall: WALLS.W, opp: WALLS.E },
];

// 递归回溯法生成完美迷宫（cells 用位掩码记录四面墙）
// level 控制通路复杂度而不改网格尺寸：
//   easy   偏向紧贴右下终点、通关路短、岔路少
//   medium 纯随机（默认）
//   hard   偏向绕右下终点、通关路蜿蜒、岔路更多
export function generateMaze(cols, rows, level = 'medium') {
  // 每格到终点的曼哈顿距离，用作选路权重（偏大→绕远，偏小→贴终点）
  const dEnd = new Float32Array(cols * rows);
  const ex = cols - 1, ey = rows - 1;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      dEnd[y * cols + x] = (ex - x) + (ey - y);

  const ease = level === 'easy', hard = level === 'hard';
  const exp = ease ? -1.4 : hard ? 1.4 : 0;

  const cells = new Uint8Array(cols * rows).fill(WALLS.N | WALLS.E | WALLS.S | WALLS.W);
  const visited = new Uint8Array(cols * rows);
  const stack = [0];
  visited[0] = 1;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const cx = cur % cols, cy = (cur / cols) | 0;
    const options = [];
    for (const d of DIRS) {
      const nx = cx + d.dx, ny = cy + d.dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const n = ny * cols + nx;
      if (!visited[n]) options.push([n, d.wall, d.opp, Math.pow(dEnd[n] + 1, exp)]);
    }
    if (!options.length) { stack.pop(); continue; }
    // 按权重累计随机选一个，exp=0 时等权退化为纯随机
    let total = 0;
    for (const o of options) total += o[3];
    let r = Math.random() * total;
    let pick = options[0];
    for (const o of options) { r -= o[3]; if (r <= 0) { pick = o; break; } }
    const [n, w, opp] = pick;
    cells[cur] &= ~w;
    cells[n] &= ~opp;
    visited[n] = 1;
    stack.push(n);
  }
  return { cols, rows, cells };
}
