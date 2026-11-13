function pressOf(e) {
  if (e.pointerType === 'pen' && e.pressure > 0) return e.pressure;
  return 0.55; // 鼠标 / 手指的固定压力
}

// 统一处理鼠标、触控、触控笔（Pointer Events + coalesced 事件保证笔迹平滑）
export function attachPointer(canvas, { onStart, onMove, onEnd }) {
  let tracking = false;

  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    tracking = true;
    canvas.setPointerCapture(e.pointerId);
    onStart(local(e), pressOf(e), e.pointerType);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!tracking) return;
    e.preventDefault();
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length)
      ? e.getCoalescedEvents() : [e];
    for (const ev of evs) onMove(local(ev), pressOf(ev));
  });

  const finish = (e) => {
    if (!tracking) return;
    tracking = false;
    onEnd(local(e), pressOf(e));
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
}
