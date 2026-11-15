// 西游记主题的孙悟空：canvas 矢量画，坐标单位是“角色碰撞半径 r”

const FUR = '#c98b3f', FUR_DK = '#a06a2b', FUR_LT = '#e8b878';
const FACE = '#f8c98f', FACE_EDGE = 'rgba(160,90,40,.30)';
const BAND = '#e0483f', BAND_GOLD = '#f3c14e';
const EYE = '#3a2a18', BLUSH = 'rgba(230,120,80,.35)';
const ROBE = '#e8a03c', ROBE_DK = '#ca7f2a', BELT = '#d0463c';
const SKIRT = '#f2c94c', SKIRT_DK = '#c98b2e', SKIRT_STRIPE = '#8a5a1a';
const STAFF = '#f2c14e', STAFF_EDGE = '#c99220';
const GLOW = 'rgba(240,193,80,.20)';

function ell(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function arc(ctx, x, y, r, a0, a1, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1);
  if (fill) { ctx.lineWidth = 0; ctx.strokeStyle = fill; }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; }
  if (fill) { ctx.fill(); } else { ctx.stroke(); }
}

// 走过之路：金黄祥云带，沿途飘小云朵
export function drawMonkeyTrail(ctx, trail, geo, rpx) {
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
  ctx.strokeStyle = 'rgba(214,160,70,.18)';
  ctx.lineWidth = rpx * 0.78;
  ctx.stroke();
  line();
  ctx.strokeStyle = 'rgba(230,170,60,.8)';
  ctx.lineWidth = rpx * 0.32;
  ctx.stroke();
  // 沿途小祥云
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (let i = 4; i < P.length - 1; i += 7) {
    const a = i / P.length;
    ctx.globalAlpha = 0.2 + 0.5 * a;
    const s = rpx * (0.22 + 0.13 * a);
    const x = P[i].x, y = P[i].y;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
    ctx.arc(x - s * 0.6, y, s * 0.34, 0, Math.PI * 2);
    ctx.arc(x + s * 0.6, y, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * @param o {moving, blocked, dx}
 */
export function drawMonkey(ctx, x, y, r, t, o = {}) {
  const mv = !!o.moving;
  const bob = Math.sin(t * (mv ? 9 : 3)) * (mv ? 0.045 : 0.028);
  const sway = Math.sin(t * (mv ? 7 : 2)) * (mv ? 0.06 : 0.03);
  const wig = o.blocked ? Math.sin(t * 40) * 0.07 : 0;
  const look = Math.max(-1, Math.min(1, o.dx || 0));

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r, r);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 脚下金光
  const sh = ctx.createRadialGradient(0, 0.9, 0, 0, 0.9, 0.44);
  sh.addColorStop(0, GLOW);
  sh.addColorStop(1, 'rgba(240,193,80,0)');
  ctx.save();
  ctx.translate(0, 0.9);
  ctx.scale(1, 0.20);
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.translate(wig, bob);

  // 尾巴：右侧一弯猴尾，行走时轻摆
  const tailSw = sway * 0.6;
  ctx.strokeStyle = FUR_DK;
  ctx.lineWidth = 0.09;
  ctx.beginPath();
  ctx.moveTo(0.18, 0.50);
  ctx.bezierCurveTo(0.55, 0.62, 0.72, 0.38, 0.68 + tailSw, 0.10);
  ctx.stroke();
  ctx.strokeStyle = FUR;
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.moveTo(0.18, 0.46);
  ctx.bezierCurveTo(0.52, 0.56, 0.66, 0.36, 0.66 + tailSw, 0.13);
  ctx.stroke();

  // 虎皮裙（下摆随走动轻摆）
  const sw = sway;
  ctx.beginPath();
  ctx.moveTo(-0.30, -0.02);
  ctx.quadraticCurveTo(-0.42, 0.30, -0.50 + sw, 0.60);
  ctx.quadraticCurveTo(-0.25 + sw, 0.74, 0 + sw, 0.62);
  ctx.quadraticCurveTo(0.25 + sw, 0.74, 0.50 + sw, 0.60);
  ctx.quadraticCurveTo(0.42, 0.30, 0.30, -0.02);
  ctx.closePath();
  const sg = ctx.createLinearGradient(0, -0.02, 0, 0.66);
  sg.addColorStop(0, SKIRT);
  sg.addColorStop(1, SKIRT_DK);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(138,90,26,.5)';
  ctx.lineWidth = 0.05;
  ctx.stroke();
  // 虎纹
  ctx.strokeStyle = SKIRT_STRIPE;
  ctx.lineWidth = 0.055;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 0.17 - 0.05, 0.14);
    ctx.quadraticCurveTo(i * 0.21 - 0.08 + sw * 0.4, 0.34, i * 0.17 - 0.05, 0.55);
    ctx.stroke();
  }

  // 腿
  ctx.fillStyle = ROBE;
  ell(ctx, -0.19, 0.62, 0.10, 0.12); ctx.fill();
  ell(ctx, 0.19, 0.62, 0.10, 0.12); ctx.fill();
  // 脚
  ctx.fillStyle = FUR_DK;
  ell(ctx, -0.21, 0.72, 0.08, 0.045); ctx.fill();
  ell(ctx, 0.21, 0.72, 0.08, 0.045); ctx.fill();

  // 上身（黄布短打）+ 红肚兜
  const rg = ctx.createLinearGradient(0, -0.42, 0, 0.06);
  rg.addColorStop(0, FUR_LT);
  rg.addColorStop(1, ROBE);
  ctx.beginPath();
  ctx.moveTo(-0.19, -0.40);
  ctx.lineTo(0.19, -0.40);
  ctx.lineTo(0.24, 0.02);
  ctx.quadraticCurveTo(0, 0.12, -0.24, 0.02);
  ctx.closePath();
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(122,74,18,.5)';
  ctx.lineWidth = 0.045;
  ctx.stroke();
  // 红腰带 + 结
  ctx.fillStyle = BELT;
  ell(ctx, 0, -0.03, 0.22, 0.055); ctx.fill();
  ctx.fillStyle = '#e8a03c';
  ell(ctx, -0.05, -0.02, 0.035, 0.05); ctx.fill();
  ctx.strokeStyle = SKIRT_STRIPE;
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(-0.09, -0.02); ctx.lineTo(-0.22, -0.08);
  ctx.moveTo(0.0, -0.02); ctx.lineTo(0.10, -0.09);
  ctx.stroke();

  // 胳膊：右臂持棒斜在身前，左臂自然下垂
  ctx.strokeStyle = FUR;
  ctx.lineWidth = 0.085;
  ctx.beginPath();
  ctx.moveTo(-0.19, -0.32); ctx.quadraticCurveTo(-0.35, -0.18, -0.36, 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0.19, -0.32); ctx.quadraticCurveTo(0.34, -0.10, 0.26, 0.10);
  ctx.stroke();
  // 手
  ctx.fillStyle = FACE;
  ell(ctx, -0.37, 0.03, 0.075, 0.055); ctx.fill();
  ell(ctx, 0.27, 0.11, 0.075, 0.055); ctx.fill();

  // 金箍棒：斜横在身前，白底+金杆双描边
  const wa = Math.sin(t * 2.6) * 0.08;
  ctx.save();
  ctx.rotate(wa * 0.25);
  ctx.beginPath();
  ctx.moveTo(-0.66, -0.14); ctx.lineTo(0.66, 0.14);
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 0.11;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-0.66, -0.14); ctx.lineTo(0.66, 0.14);
  ctx.strokeStyle = STAFF;
  ctx.lineWidth = 0.06;
  ctx.stroke();
  // 棒端金箍
  ctx.strokeStyle = STAFF_EDGE;
  ctx.lineWidth = 0.045;
  ctx.beginPath();
  ctx.moveTo(-0.66, -0.14); ctx.lineTo(-0.56, -0.12);
  ctx.moveTo(0.66, 0.14); ctx.lineTo(0.56, 0.12);
  ctx.stroke();
  ctx.restore();

  // 头：大圆棕毛脸 + 桃形猴脸
  ctx.fillStyle = FUR;
  ell(ctx, 0, -0.50, 0.30, 0.34); ctx.fill();
  ctx.strokeStyle = FUR_DK;
  ctx.lineWidth = 0.03;
  ell(ctx, 0, -0.50, 0.30, 0.34); ctx.stroke();
  // 耳朵
  ctx.fillStyle = FUR;
  ell(ctx, -0.30, -0.58, 0.10, 0.14); ctx.fill();
  ell(ctx, 0.30, -0.58, 0.10, 0.14); ctx.fill();
  ctx.strokeStyle = FUR_DK;
  ell(ctx, -0.30, -0.58, 0.10, 0.14); ctx.stroke();
  ell(ctx, 0.30, -0.58, 0.10, 0.14); ctx.stroke();
  ctx.fillStyle = 'rgba(255,170,140,.6)';
  ell(ctx, -0.30, -0.58, 0.05, 0.07); ctx.fill();
  ell(ctx, 0.30, -0.58, 0.05, 0.07); ctx.fill();
  // 桃形猴脸
  ctx.beginPath();
  ctx.moveTo(0, -0.66);
  ctx.quadraticCurveTo(0.24, -0.62, 0.24, -0.47);
  ctx.quadraticCurveTo(0.24, -0.32, 0, -0.20);
  ctx.quadraticCurveTo(-0.24, -0.32, -0.24, -0.47);
  ctx.quadraticCurveTo(-0.24, -0.62, 0, -0.66);
  ctx.closePath();
  ctx.fillStyle = FACE;
  ctx.fill();
  ctx.strokeStyle = FACE_EDGE;
  ctx.lineWidth = 0.022;
  ctx.stroke();

  // 金箍（红色系带圈住头）
  ctx.strokeStyle = BAND;
  ctx.lineWidth = 0.055;
  ctx.beginPath();
  ctx.ellipse(0, -0.63, 0.30, 0.20, -0.1, 0, Math.PI * 2);
  ctx.stroke();
  // 圈顶小金泡
  ctx.fillStyle = BAND_GOLD;
  ell(ctx, 0, -0.80, 0.035, 0.05); ctx.fill();
  // 两条垂带
  ctx.strokeStyle = BAND;
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(-0.05, -0.70); ctx.quadraticCurveTo(-0.08, -0.86, -0.03, -0.96);
  ctx.moveTo(0.05, -0.70); ctx.quadraticCurveTo(0.08, -0.86, 0.03, -0.96);
  ctx.stroke();

  // 表情：大眼睛随走位偏移
  const ex = look * 0.03;
  ctx.fillStyle = EYE;
  ell(ctx, -0.10 + ex, -0.50, 0.065, 0.075); ctx.fill();
  ell(ctx, 0.10 + ex, -0.50, 0.065, 0.075); ctx.fill();
  ctx.fillStyle = '#fff';
  ell(ctx, -0.115 + ex, -0.525, 0.024, 0.024); ctx.fill();
  ell(ctx, 0.085 + ex, -0.525, 0.024, 0.024); ctx.fill();
  ctx.fillStyle = BLUSH;
  ell(ctx, -0.175, -0.43, 0.055, 0.038); ctx.fill();
  ell(ctx, 0.175, -0.43, 0.055, 0.038); ctx.fill();
  // 嘴：得意的笑
  ctx.strokeStyle = FUR_DK;
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.arc(0, -0.33, 0.09, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();

  // 头顶一撮火红鬃毛，行走时会晃
  const hairSway = mv ? Math.sin(t * 10) * 0.025 : 0;
  ctx.fillStyle = FUR_DK;
  ctx.beginPath();
  ctx.moveTo(-0.06, -0.80);
  ctx.quadraticCurveTo(0 + hairSway, -1.00, 0.06 + hairSway, -0.80);
  ctx.quadraticCurveTo(0 + hairSway * 0.5, -0.90, -0.06, -0.80);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}