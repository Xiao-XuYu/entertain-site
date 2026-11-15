// 物品绘制:金块、卡通动物、钻石
// 依赖 render/draw.js 的 drawEllipse

function drawItem(it, x, y) {
  var ctx = G.ctx;
  var r = it.r;
  var t = it.type;

  // 金块 (卡通金黄带描边高光)
  if (t === 'goldBig' || t === 'goldMid' || t === 'goldSmall') {
    ctx.fillStyle = it.dark;
    ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = it.color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + r * 0.2, y - r * 0.5, r * 0.15, r * 0.4);
    ctx.fillRect(x + r * 0.05, y - r * 0.35, r * 0.4, r * 0.15);
  }
  else if (t === 'chicken') {
    ctx.fillStyle = it.color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = it.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#FF8F00';
    ctx.beginPath(); ctx.arc(x - r * 0.5, y + r * 0.1, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E53935';
    ctx.beginPath(); ctx.arc(x - r * 0.1, y - r * 0.85, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.2, y - r * 0.95, r * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.3, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.3, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF6F00';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.35, y);
    ctx.lineTo(x + r * 0.75, y + r * 0.15);
    ctx.lineTo(x + r * 0.35, y + r * 0.25);
    ctx.closePath(); ctx.fill();
  }
  else if (t === 'pig') {
    ctx.fillStyle = it.color;
    drawEllipse(x, y, r * 1.0, r * 0.85); ctx.fill();
    ctx.strokeStyle = it.dark; ctx.lineWidth = 2;
    drawEllipse(x, y, r * 1.0, r * 0.85); ctx.stroke();
    ctx.fillStyle = '#F48FB1';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.4); ctx.lineTo(x - r * 0.5, y - r * 0.9); ctx.lineTo(x - r * 0.25, y - r * 0.4);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.25, y - r * 0.4); ctx.lineTo(x + r * 0.5, y - r * 0.9); ctx.lineTo(x + r * 0.7, y - r * 0.4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F06292';
    drawEllipse(x, y + r * 0.1, r * 0.35, r * 0.25); ctx.fill();
    ctx.fillStyle = '#880E4F';
    ctx.beginPath(); ctx.arc(x - r * 0.12, y + r * 0.1, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.12, y + r * 0.1, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.35, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#880E4F'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.25, r * 0.2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
  else if (t === 'rabbit') {
    ctx.fillStyle = it.color;
    ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = it.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    drawEllipse(x - r * 0.35, y - r * 0.7, r * 0.2, r * 0.55); ctx.fill();
    drawEllipse(x + r * 0.35, y - r * 0.7, r * 0.2, r * 0.55); ctx.fill();
    ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 1.5;
    drawEllipse(x - r * 0.35, y - r * 0.7, r * 0.2, r * 0.55); ctx.stroke();
    drawEllipse(x + r * 0.35, y - r * 0.7, r * 0.2, r * 0.55); ctx.stroke();
    ctx.fillStyle = '#F8BBD0';
    drawEllipse(x - r * 0.35, y - r * 0.7, r * 0.1, r * 0.4); ctx.fill();
    drawEllipse(x + r * 0.35, y - r * 0.7, r * 0.1, r * 0.4); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - r * 0.25, y, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.25, y, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F48FB1';
    ctx.beginPath(); ctx.arc(x, y + r * 0.18, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.18); ctx.lineTo(x, y + r * 0.32);
    ctx.moveTo(x, y + r * 0.32); ctx.lineTo(x - r * 0.1, y + r * 0.4);
    ctx.moveTo(x, y + r * 0.32); ctx.lineTo(x + r * 0.1, y + r * 0.4);
    ctx.stroke();
  }
  else if (t === 'cat') {
    ctx.fillStyle = it.color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = it.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#FF8A65';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.85, y - r * 0.5); ctx.lineTo(x - r * 0.4, y - r * 0.95); ctx.lineTo(x - r * 0.25, y - r * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.25, y - r * 0.5); ctx.lineTo(x + r * 0.4, y - r * 0.95); ctx.lineTo(x + r * 0.85, y - r * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFCCBC';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.55); ctx.lineTo(x - r * 0.5, y - r * 0.8); ctx.lineTo(x - r * 0.4, y - r * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.4, y - r * 0.55); ctx.lineTo(x + r * 0.5, y - r * 0.8); ctx.lineTo(x + r * 0.7, y - r * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F48FB1';
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.15); ctx.lineTo(x - r * 0.12, y + r * 0.05); ctx.lineTo(x + r * 0.12, y + r * 0.05);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.15); ctx.lineTo(x, y + r * 0.3);
    ctx.moveTo(x, y + r * 0.3); ctx.lineTo(x - r * 0.15, y + r * 0.4);
    ctx.moveTo(x, y + r * 0.3); ctx.lineTo(x + r * 0.15, y + r * 0.4);
    ctx.stroke();
    ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r * 0.2); ctx.lineTo(x - r, y + r * 0.1);
    ctx.moveTo(x - r * 0.5, y + r * 0.3); ctx.lineTo(x - r, y + r * 0.3);
    ctx.moveTo(x + r * 0.5, y + r * 0.2); ctx.lineTo(x + r, y + r * 0.1);
    ctx.moveTo(x + r * 0.5, y + r * 0.3); ctx.lineTo(x + r, y + r * 0.3);
    ctx.stroke();
  }
  else if (t === 'diamond') {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = it.dark;
    var sz = r + 2;
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
    ctx.fillStyle = it.color;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = '#B2EBF2';
    ctx.fillRect(-r, -r, r, r);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.6, r * 0.6);
    ctx.stroke();
    ctx.restore();
  }
  else if (t === 'turtle') {
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath(); ctx.arc(x - r * 0.7, y + r * 0.55, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.7, y + r * 0.55, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.4, y + r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.4, y + r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = it.color;
    drawEllipse(x, y + r * 0.15, r * 0.85, r * 0.65); ctx.fill();
    ctx.strokeStyle = it.dark; ctx.lineWidth = 2;
    drawEllipse(x, y + r * 0.15, r * 0.85, r * 0.65); ctx.stroke();
    ctx.strokeStyle = it.dark; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.2); ctx.lineTo(x - r * 0.5, y + r * 0.5);
    ctx.moveTo(x, y - r * 0.4); ctx.lineTo(x, y + r * 0.6);
    ctx.moveTo(x + r * 0.5, y - r * 0.2); ctx.lineTo(x + r * 0.5, y + r * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.65, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.12, y - r * 0.65, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1B5E20'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.45, r * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
}