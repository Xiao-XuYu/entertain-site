import { MODES, MODE } from '../config.js';

const CLEAR_LABEL = { [MODE.STROKE]: '🧽 重画', [MODE.HERO]: '🧹 回起点' };

function bindSeg(id, onSelect) {
  const seg = document.getElementById(id);
  const buttons = [...seg.querySelectorAll('.seg-btn')];

  function mark(key) {
    for (const b of buttons) {
      const on = b.dataset.select === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      mark(btn.dataset.select);
      onSelect(btn.dataset.select);
    });
  }

  return { mark };
}

export function initControls({
  size, level, mode, onSize, onLevel, onMode, onNew, onClear, onUndo, onRedo,
}) {
  const sizeCtl = bindSeg('size', onSize);
  const levelCtl = bindSeg('level', onLevel);
  if (size) sizeCtl.mark(size);
  if (level) levelCtl.mark(level);

  // 玩法模式（划线 / 角色）由本地记忆决定选中哪个
  const modeCtl = bindSeg('mode', onMode);
  for (const m of MODES) {
    const btn = document.querySelector(`#mode .seg-btn[data-select="${m.key}"]`);
    if (btn) btn.textContent = m.label;
  }
  if (mode) modeCtl.mark(mode);

  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnClear = document.getElementById('btn-clear');
  document.getElementById('btn-new').addEventListener('click', onNew);
  btnClear.addEventListener('click', onClear);
  btnUndo.addEventListener('click', onUndo);
  btnRedo.addEventListener('click', onRedo);

  let heroMode = false;
  return {
    setUndoRedo(canUndo, canRedo) {
      btnUndo.disabled = heroMode || !canUndo;
      btnRedo.disabled = heroMode || !canRedo;
    },
    setSize: sizeCtl.mark,
    setLevel: levelCtl.mark,
    // 角色模式里公主自己会走，撤销/重做笔迹没意义，重画变成“回起点”
    setMode(key) {
      heroMode = key === MODE.HERO;
      btnClear.textContent = CLEAR_LABEL[key] ?? CLEAR_LABEL[MODE.STROKE];
      btnUndo.title = heroMode ? '角色模式用不上撤销' : '撤销一段笔迹';
      btnRedo.title = heroMode ? '角色模式用不上重做' : '恢复一段笔迹';
      modeCtl.mark(key);
    },
  };
}