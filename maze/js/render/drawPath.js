import { toPx } from '../geometry/geometry.js';
import { THEME } from './theme.js';

function strokeWidthPx(geo, stroke) {
  let sum = 0;
  for (const p of stroke.points) sum += p.w;
  const avg = sum / stroke.points.length;
  const base = Math.min(14, Math.max(2.5, geo.cell * 0.11));
  return base * (0.55 + 0.8 * avg);
}

// 用二次贝塞尔中点法平滑笔迹；笔压(触控笔)影响线宽
export function drawStroke(ctx, stroke, geo) {
  const pts = stroke.points;
  if (!pts.length) return;
  const P = pts.map(p => toPx(p.x, p.y, geo));
  const lw = strokeWidthPx(geo, stroke);
  const color = THEME.ink;

  const buildPath = () => {
    ctx.beginPath();
    if (P.length === 1) {
      ctx.arc(P[0].x, P[0].y, lw / 2, 0, Math.PI * 2);
      return true;
    }
    ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length - 1; i++) {
      const mx = (P[i].x + P[i + 1].x) / 2, my = (P[i].y + P[i + 1].y) / 2;
      ctx.quadraticCurveTo(P[i].x, P[i].y, mx, my);
    }
    ctx.lineTo(P[P.length - 1].x, P[P.length - 1].y);
    return false;
  };

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.95;
  if (P.length > 1) {
    // 柔和外发光
    ctx.strokeStyle = THEME.inkGlow;
    ctx.lineWidth = lw * 2;
    buildPath();
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  const isDot = buildPath();
  if (isDot) ctx.fillStyle = color;
  ctx[isDot ? 'fill' : 'stroke']();
  ctx.restore();
}
