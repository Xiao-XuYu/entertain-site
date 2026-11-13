// 角色模式的小公主：全部用 canvas 矢量画（椭圆/圆弧/贝塞尔），缩放不糊
// 坐标单位是“公主碰撞半径 r”，所以改半径等于整体等比缩放

const SKIN = '#fff0e4', SKIN_EDGE = 'rgba(190,120,140,.30)';
const HAIR = '#faa6c8', HAIR_DK = '#e884b0', HAIR_LT = '#ffd9e9';
const DRESS_LT = '#ffe7f3', DRESS = '#f793c3', DRESS_DK = '#e8719f', TRIM = '#ffa8cd';
const CROWN_LT = '#ffe08a', CROWN_DK = '#f0b13a';
const EYE = '#6b3a58', BLUSH = 'rgba(255,132,168,.45)';
const GLIT = '#fff3c9';

function ell(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function star4(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.closePath();
}

function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.8);
  ctx.bezierCurveTo(x - s * 1.2, y - s * 0.25, x - s * 0.45, y - s * 1.05, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.2, y - s * 0.25, x, y + s * 0.8);
  ctx.closePath();
}

// 走过的路：淡粉缎带 + 沿途小爱心
export function drawHeroTrail(ctx, trail, geo, rpx) {
  if (trail.length < 2) return;
  const P = trail.map(p => ({ x: geo.ox + p.x * geo.cellW, y: geo.oy + p.y * geo.cellH }));
  const line = () => {
    ctx.beginPath();
    ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  line();
  ctx.strokeStyle = 'rgba(150,120,214,.15)';
  ctx.lineWidth = rpx * 0.78;
  ctx.stroke();
  line();
  ctx.strokeStyle = 'rgba(158,124,236,.95)';
  ctx.lineWidth = rpx * 0.34;
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,86,140,.42)';
  for (let i = 4; i < P.length - 1; i += 7) {
    const a = i / P.length;
    ctx.globalAlpha = 0.25 + 0.5 * a;
    heart(ctx, P[i].x, P[i].y, rpx * (0.22 + 0.14 * a));
    ctx.fill();
  }
  ctx.restore();
}

/**
 * @param o {moving, blocked, dx, crown} — dx∈[-1,1] 眼睛往哪边看，crown 为真时皇冠画在头上
 */
export function drawPrincess(ctx, x, y, r, t, o = {}) {
  const mv = !!o.moving;
  const bob = Math.sin(t * (mv ? 9.5 : 3.2)) * (mv ? 0.045 : 0.028);
  const sway = Math.sin(t * (mv ? 7 : 2.1)) * (mv ? 0.05 : 0.025);
  const wig = o.blocked ? Math.sin(t * 40) * 0.07 : 0;
  const look = Math.max(-1, Math.min(1, o.dx || 0));

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r, r);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 脚下柔光（不用 shadowBlur，缩放后不好控制）
  const sh = ctx.createRadialGradient(0, 0.9, 0, 0, 0.9, 0.44);
  sh.addColorStop(0, 'rgba(214,120,170,.18)');
  sh.addColorStop(1, 'rgba(214,120,170,0)');
  ctx.save();
  ctx.translate(0, 0.9);
  ctx.scale(1, 0.20);
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.translate(wig, bob);

  // 头发：一大束在头后 + 两缕垂到肩前
  ctx.fillStyle = HAIR_DK;
  ell(ctx, 0, -0.42, 0.38, 0.37); ctx.fill();
  ell(ctx, -0.30, -0.06, 0.12, 0.30); ctx.fill();
  ell(ctx, 0.30, -0.06, 0.12, 0.30); ctx.fill();
  ctx.strokeStyle = 'rgba(146,44,96,.5)';
  ctx.lineWidth = 0.05;
  ell(ctx, 0, -0.42, 0.38, 0.37); ctx.stroke();

  // 裙子：肩到波浪下摆，下摆随走动轻摆
  const sw = sway;
  ctx.beginPath();
  ctx.moveTo(-0.17, -0.14);
  ctx.bezierCurveTo(-0.30, 0.14, -0.50, 0.46, -0.55, 0.72);
  ctx.quadraticCurveTo(-0.42 + sw, 0.86, -0.30 + sw, 0.74);
  ctx.quadraticCurveTo(-0.15 + sw, 0.88, 0.0 + sw, 0.76);
  ctx.quadraticCurveTo(0.15 + sw, 0.88, 0.30 + sw, 0.74);
  ctx.quadraticCurveTo(0.42 + sw, 0.86, 0.55, 0.72);
  ctx.bezierCurveTo(0.50, 0.46, 0.30, 0.14, 0.17, -0.14);
  ctx.closePath();
  const dg = ctx.createLinearGradient(0, -0.16, 0, 0.8);
  dg.addColorStop(0, DRESS_LT);
  dg.addColorStop(0.55, DRESS);
  dg.addColorStop(1, DRESS_DK);
  ctx.fillStyle = dg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(203,66,116,.55)';
  ctx.lineWidth = 0.05;
  ctx.stroke();

  // 裙摆花边 + 亮点
  ctx.strokeStyle = '#f2799f';
  ctx.lineWidth = 0.07;
  ctx.beginPath();
  ctx.moveTo(-0.55, 0.70);
  ctx.quadraticCurveTo(-0.42 + sw, 0.84, -0.30 + sw, 0.72);
  ctx.quadraticCurveTo(-0.15 + sw, 0.86, 0.0 + sw, 0.74);
  ctx.quadraticCurveTo(0.15 + sw, 0.86, 0.30 + sw, 0.72);
  ctx.quadraticCurveTo(0.42 + sw, 0.84, 0.55, 0.70);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  for (const [dx2, dy2] of [[-0.20, 0.46], [0.12, 0.32]]) {
    ell(ctx, dx2, dy2, 0.017, 0.017);
    ctx.fill();
  }

  // 上身 + 腰带蝴蝶结
  ctx.beginPath();
  ctx.moveTo(-0.17, -0.16);
  ctx.lineTo(0.17, -0.16);
  ctx.lineTo(0.20, 0.06);
  ctx.quadraticCurveTo(0, 0.14, -0.20, 0.06);
  ctx.closePath();
  ctx.fillStyle = DRESS;
  ctx.fill();
  ctx.fillStyle = TRIM;
  ell(ctx, 0, 0.06, 0.10, 0.035); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ell(ctx, 0, 0.06, 0.03, 0.03); ctx.fill();

  // 胳膊
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 0.085;
  ctx.beginPath();
  ctx.moveTo(-0.16, -0.10); ctx.quadraticCurveTo(-0.29, -0.02, -0.28, 0.12);
  ctx.moveTo(0.16, -0.10); ctx.quadraticCurveTo(0.29, -0.02, 0.28, 0.12);
  ctx.stroke();

  // 脸
  ctx.fillStyle = SKIN;
  ell(ctx, 0, -0.44, 0.275, 0.265); ctx.fill();
  ctx.strokeStyle = SKIN_EDGE;
  ctx.lineWidth = 0.02;
  ctx.stroke();

  // 刘海 + 鬓角
  ctx.fillStyle = HAIR;
  ell(ctx, 0, -0.56, 0.285, 0.20); ctx.fill();
  ell(ctx, -0.245, -0.44, 0.06, 0.16); ctx.fill();
  ell(ctx, 0.245, -0.44, 0.06, 0.16); ctx.fill();
  ctx.fillStyle = HAIR_LT;
  ell(ctx, -0.09, -0.63, 0.10, 0.045); ctx.fill();

  // 皇冠：画大、抬高，底边骑在刘海上缘之上，描边加深，小尺寸下也能认出
  ctx.beginPath();
  ctx.moveTo(-0.26, -0.70);
  ctx.lineTo(-0.30, -0.96);
  ctx.lineTo(-0.15, -0.83);
  ctx.lineTo(0, -1.03);
  ctx.lineTo(0.15, -0.83);
  ctx.lineTo(0.30, -0.96);
  ctx.lineTo(0.26, -0.70);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, -1.03, 0, -0.70);
  cg.addColorStop(0, CROWN_LT);
  cg.addColorStop(1, CROWN_DK);
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(178,112,18,.6)';
  ctx.lineWidth = 0.045;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  for (const [dx2, dy2] of [[-0.30, -1.00], [0, -1.08], [0.30, -1.00]]) {
    ell(ctx, dx2, dy2, 0.05, 0.05); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ell(ctx, 0, -0.79, 0.055, 0.045); ctx.fill();

  // 表情：眼睛跟着走的方向偏移一点
  const ex = look * 0.03;
  ctx.fillStyle = EYE;
  ell(ctx, -0.11 + ex, -0.45, 0.062, 0.080); ctx.fill();
  ell(ctx, 0.11 + ex, -0.45, 0.062, 0.080); ctx.fill();
  ctx.fillStyle = '#fff';
  ell(ctx, -0.125 + ex, -0.475, 0.024, 0.026); ctx.fill();
  ell(ctx, 0.09 + ex, -0.475, 0.024, 0.026); ctx.fill();
  ctx.fillStyle = BLUSH;
  ell(ctx, -0.185, -0.375, 0.062, 0.042); ctx.fill();
  ell(ctx, 0.185, -0.375, 0.062, 0.042); ctx.fill();
  ctx.strokeStyle = EYE;
  ctx.lineWidth = 0.052;
  ctx.beginPath();
  ctx.arc(0, -0.355, 0.105, Math.PI * 0.16, Math.PI * 0.84);
  ctx.stroke();

  // 星星魔杖
  const wa = Math.sin(t * 2.6) * 0.10;
  ctx.save();
  ctx.rotate(wa * 0.25);
  // 杆伸到身体轮廓外，白底 + 金杆两层描边，跟粉裙拉开对比
  ctx.beginPath();
  ctx.moveTo(0.30, 0.16); ctx.lineTo(0.63, -0.10);
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 0.10;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0.30, 0.16); ctx.lineTo(0.63, -0.10);
  ctx.strokeStyle = '#d99f4e';
  ctx.lineWidth = 0.05;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,243,201,.30)';
  star4(ctx, 0.70, -0.14, 0.25); ctx.fill();
  ctx.fillStyle = GLIT;
  star4(ctx, 0.70, -0.14, 0.17); ctx.fill();
  ctx.restore();

  // 身边闪烁的小心/星星
  const tw1 = 0.45 + 0.55 * Math.abs(Math.sin(t * 3.1));
  const tw2 = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.2 + 1.1));
  ctx.fillStyle = GLIT;
  ctx.globalAlpha = tw1;
  star4(ctx, -0.46, -0.62, 0.10); ctx.fill();
  ctx.globalAlpha = tw2;
  star4(ctx, 0.50, -0.40, 0.075); ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = 'rgba(255,160,200,.9)';
  heart(ctx, 0.44, -0.72, 0.07); ctx.fill();
  ctx.restore();
}
