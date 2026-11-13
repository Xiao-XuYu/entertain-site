import { WALLS } from '../maze/cell.js';
import { THEME } from './theme.js';
import { START_EMOJI, END_EMOJI } from '../config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillCell(ctx, col, row, geo, color) {
  const m = geo.cell * 0.08;
  roundRect(ctx,
    geo.ox + col * geo.cellW + m, geo.oy + row * geo.cellH + m,
    geo.cellW - m * 2, geo.cellH - m * 2, geo.cell * 0.22);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEmoji(ctx, gx, gy, geo, emoji) {
  const x = geo.ox + (gx + 0.5) * geo.cellW, y = geo.oy + (gy + 0.5) * geo.cellH;
  ctx.font = `${Math.floor(geo.cell * 0.58)}px ${THEME.emojiFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y + geo.cell * 0.02);
}

export function drawMaze(ctx, maze, geo) {
  const { cell, cellW, cellH, pad, ox, oy, w, h, cols, rows } = geo;

  // 白色圆角卡片底；阴影半径要小于卡片到视口边缘的留白，否则会被裁出一道硬边
  ctx.save();
  ctx.shadowColor = 'rgba(214,120,170,.30)';
  ctx.shadowBlur = Math.min(12, Math.max(5, cell * 0.3));
  roundRect(ctx, ox - pad, oy - pad, w + pad * 2, h + pad * 2, cell * 0.5);
  ctx.fillStyle = THEME.card;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, ox - pad, oy - pad, w + pad * 2, h + pad * 2, cell * 0.5);
  ctx.strokeStyle = THEME.cardEdge;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 卡片内柔色圆点背景
  ctx.fillStyle = THEME.dot;
  const step = cell / 3;
  for (let x = ox + step / 2; x < ox + w; x += step) {
    for (let y = oy + step / 2; y < oy + h; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 起点（城堡）与终点（皇冠）
  fillCell(ctx, 0, 0, geo, THEME.startBg);
  fillCell(ctx, cols - 1, rows - 1, geo, THEME.endBg);
  ctx.strokeStyle = THEME.ring;
  ctx.lineWidth = cell * 0.05;
  ctx.setLineDash([cell * 0.1, cell * 0.08]);
  ctx.beginPath();
  ctx.arc(ox + 0.5 * cellW, oy + 0.5 * cellH, cell * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  drawEmoji(ctx, 0, 0, geo, START_EMOJI);
  drawEmoji(ctx, cols - 1, rows - 1, geo, END_EMOJI);

  // 墙：宽浅色描边 + 细深色芯，圆润描边端点
  ctx.beginPath();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const w8 = maze.cells[r * cols + c];
      const px = ox + c * cellW, py = oy + r * cellH;
      if (w8 & WALLS.N) { ctx.moveTo(px, py); ctx.lineTo(px + cellW, py); }
      if (w8 & WALLS.W) { ctx.moveTo(px, py); ctx.lineTo(px, py + cellH); }
      if (c === cols - 1 && (w8 & WALLS.E)) { ctx.moveTo(px + cellW, py); ctx.lineTo(px + cellW, py + cellH); }
      if (r === rows - 1 && (w8 & WALLS.S)) { ctx.moveTo(px, py + cellH); ctx.lineTo(px + cellW, py + cellH); }
    }
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = THEME.wallBase;
  ctx.lineWidth = cell * 0.17;
  ctx.stroke();
  ctx.strokeStyle = THEME.wall;
  ctx.lineWidth = cell * 0.08;
  ctx.stroke();
}
