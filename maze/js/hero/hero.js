import { WALLS } from '../maze/cell.js';
import { toPx } from '../geometry/geometry.js';

// 公主按一个圆处理碰撞：半径取格子短边的 0.34，
// 这样通道不论横竖（cellW ≠ cellH）都钻得过去，又不会贴到墙上
export function heroRadius(geo) {
  return 0.40 * Math.min(geo.cellW, geo.cellH);
}

export function createHero() {
  const hero = {
    gx: 0.5, gy: 0.5,     // 网格空间位置（resize 后自动重投影，不会丢）
    dir: { x: 1, y: 0 },  // 公主“看”的方向
    tween: null,          // 键盘走一格时的补间
    blockedAt: 0,         // 开始撞墙的时间戳，0 = 没在撞墙
    trail: [],            // 走过的足迹（网格空间）
    steps: 0,             // 走过的路程（≈格数）
  };
  return resetHero(hero);
}

// 回起点：清掉足迹和补间
export function resetHero(hero) {
  hero.gx = 0.5;
  hero.gy = 0.5;
  hero.dir = { x: 1, y: 0 };
  hero.tween = null;
  hero.blockedAt = 0;
  hero.trail = [{ x: 0.5, y: 0.5 }];
  hero.steps = 0;
  return hero;
}

const DIRS = [
  [0, -1, WALLS.N, WALLS.S],
  [1, 0, WALLS.E, WALLS.W],
  [0, 1, WALLS.S, WALLS.N],
  [-1, 0, WALLS.W, WALLS.E],
];

function wallMask(maze, c, r) {
  if (c < 0 || r < 0 || c >= maze.cols || r >= maze.rows) return WALLS.N | WALLS.E | WALLS.S | WALLS.W;
  return maze.cells[r * maze.cols + c];
}

// 从格子 (c,r) 往 (dc,dr) 挪一格，中间是否有墙
export function isOpenStep(maze, c, r, dc, dr) {
  for (const [ux, uy, w, opp] of DIRS) {
    if (ux !== dc || uy !== dr) continue;
    if (c + ux < 0 || r + uy < 0 || c + ux >= maze.cols || r + uy >= maze.rows) return false;
    return (wallMask(maze, c, r) & w) === 0 && (wallMask(maze, c + ux, r + uy) & opp) === 0;
  }
  return false;
}

// 公主圆 (gx,gy,r) 是否压到附近的墙：只查覆盖到的 2×2 格子的墙位掩码
function touchesWall(maze, geo, gx, gy, r) {
  const tol = r * 0.97; // 贴墙平移时不至于因浮点误差卡死
  const rx = r / geo.cellW, ry = r / geo.cellH;
  const c0 = Math.max(0, Math.floor(gx - rx)), c1 = Math.min(maze.cols - 1, Math.floor(gx + rx));
  const r0 = Math.max(0, Math.floor(gy - ry)), r1 = Math.min(maze.rows - 1, Math.floor(gy + ry));
  const p = toPx(gx, gy, geo);

  const hit = (ax, ay, bx, by) => {
    const a = toPx(ax, ay, geo), b = toPx(bx, by, geo);
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    let k = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    return Math.hypot(p.x - (a.x + k * dx), p.y - (a.y + k * dy)) < tol;
  };

  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const m = wallMask(maze, col, row);
      if ((m & WALLS.N) && hit(col, row, col + 1, row)) return true;
      if ((m & WALLS.W) && hit(col, row, col, row + 1)) return true;
      if (col === maze.cols - 1 && (m & WALLS.E) && hit(col + 1, row, col + 1, row + 1)) return true;
      if (row === maze.rows - 1 && (m & WALLS.S) && hit(col, row + 1, col + 1, row + 1)) return true;
    }
  }
  return false;
}

// 把公主往目标点挪：拆成小步 + x/y 分别试，所以撞到墙会顺墙滑走而不是硬停下
// 返回 true = 这一帧被墙挡住了
export function dragHero(hero, maze, geo, target, r) {
  const sx = hero.gx, sy = hero.gy;
  const dx = target.x - sx, dy = target.y - sy;
  const distPx = Math.hypot(dx * geo.cellW, dy * geo.cellH);
  const sub = Math.max(1, r * 0.5);
  const n = Math.max(1, Math.ceil(distPx / sub));
  const sh = Math.max(1 / n, 0.04);        // 顺墙滑动的一小步（格）
  const dpx = (x, y) => Math.hypot((target.x - x) * geo.cellW, (target.y - y) * geo.cellH);
  let gx = sx, gy = sy, blocked = false;
  for (let i = 1; i <= n; i++) {
    const tx = gx + dx / n, ty = gy + dy / n;
    let moved = false;
    if (!touchesWall(maze, geo, tx, gy, r)) { gx = tx; moved = true; }
    if (!touchesWall(maze, geo, gx, ty, r)) { gy = ty; moved = true; }
    if (!moved) {
      // 前面是墙：顺着墙往“离手指更近”的那条通道挪一点，不会一撞墙就定住。
      // 只接受严格更接近手指的方向，所以死胡同里她还是会停下，不会自己破解迷宫。
      let best = null, bestD = dpx(gx, gy) - 0.05;
      for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = gx + ux * sh, ny = gy + uy * sh;
        if (touchesWall(maze, geo, nx, ny, r)) continue;
        const d = dpx(nx, ny);
        if (d < bestD) { bestD = d; best = [nx, ny]; }
      }
      if (best) { gx = best[0]; gy = best[1]; moved = true; }
    }
    if (!moved) { blocked = true; break; }
  }
  hero.gx = gx;
  hero.gy = gy;
  hero.steps += Math.hypot(gx - sx, gy - sy);
  if (Math.abs(dx) > 0.03) hero.dir = { x: Math.sign(dx), y: 0 };
  else if (Math.abs(dy) > 0.03) hero.dir.y = Math.sign(dy);
  pushTrail(hero);
  return blocked;
}

// 键盘走一格（无障碍 / 自动化也好用）；被墙挡住返回 false
export function stepHero(hero, maze, dc, dr, now) {
  if (hero.tween) return false;
  const c = Math.floor(hero.gx), r = Math.floor(hero.gy);
  if (!isOpenStep(maze, c, r, dc, dr)) return false;
  hero.tween = {
    fx: hero.gx, fy: hero.gy,
    tx: c + dc + 0.5, ty: r + dr + 0.5,
    t0: now, dur: 130,
  };
  if (dc) hero.dir = { x: Math.sign(dc), y: 0 };
  else if (dr) hero.dir = { x: hero.dir.x, y: Math.sign(dr) };
  return true;
}

// 每帧推进补间；true = 位置变了，要重画
export function advanceHero(hero, now) {
  if (!hero.tween) return false;
  const tw = hero.tween;
  const k = Math.min(1, (now - tw.t0) / tw.dur);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const sx = hero.gx, sy = hero.gy;
  hero.gx = tw.fx + (tw.tx - tw.fx) * e;
  hero.gy = tw.fy + (tw.ty - tw.fy) * e;
  hero.steps += Math.hypot(hero.gx - sx, hero.gy - sy);
  if (k >= 1) {
    hero.gx = tw.tx;
    hero.gy = tw.ty;
    hero.tween = null;
  }
  pushTrail(hero);
  return true;
}

const TRAIL_MAX = 700;

export function pushTrail(hero) {
  const last = hero.trail[hero.trail.length - 1];
  if (!last || Math.hypot(hero.gx - last.x, hero.gy - last.y) > 0.16) {
    hero.trail.push({ x: hero.gx, y: hero.gy });
    if (hero.trail.length > TRAIL_MAX) hero.trail.splice(0, hero.trail.length - TRAIL_MAX);
  }
}

// 到终点判定：公主中心落进终点那一格
export function heroAtEnd(hero, maze) {
  return Math.floor(hero.gx) === maze.cols - 1 && Math.floor(hero.gy) === maze.rows - 1;
}
