import { WALLS } from './cell.js';

const DIRS = [
  { dx: 0, dy: -1, wall: WALLS.N, opp: WALLS.S },
  { dx: 1, dy: 0,  wall: WALLS.E, opp: WALLS.W },
  { dx: 0, dy: 1,  wall: WALLS.S, opp: WALLS.N },
  { dx: -1, dy: 0, wall: WALLS.W, opp: WALLS.E },
];

// 递归回溯法生成完美迷宫（cells 用位掩码记录四面墙）
export function generateMaze(cols, rows) {
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
      if (!visited[n]) options.push([n, d.wall, d.opp]);
    }
    if (!options.length) { stack.pop(); continue; }
    const [n, w, opp] = options[(Math.random() * options.length) | 0];
    cells[cur] &= ~w;
    cells[n] &= ~opp;
    visited[n] = 1;
    stack.push(n);
  }
  return { cols, rows, cells };
}
