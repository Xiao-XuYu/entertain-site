import { THEME } from './theme.js';

// 卡片四角的小爱心装饰
export function drawDecor(ctx, geo) {
  const pad = geo.pad;
  const o = pad * 0.5;
  ctx.fillStyle = THEME.decor;
  ctx.font = `${Math.max(10, Math.floor(geo.cell * 0.3))}px ${THEME.emojiFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const spots = [
    [geo.ox - pad + o, geo.oy - pad + o],
    [geo.ox + geo.w + pad - o, geo.oy - pad + o],
    [geo.ox - pad + o, geo.oy + geo.h + pad - o],
    [geo.ox + geo.w + pad - o, geo.oy + geo.h + pad - o],
  ];
  for (const [x, y] of spots) ctx.fillText('♥', x, y);
}
