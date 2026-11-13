import { MODES, MODE } from '../config.js';

const CLEAR_LABEL = { [MODE.STROKE]: '🧽 重画', [MODE.HERO]: '🧹 回起点' };

export function initControls({
  difficulty, mode, onDifficulty, onMode, onNew, onClear, onUndo, onRedo,
}) {
  const seg = document.getElementById('difficulty');
  const buttons = [...seg.querySelectorAll('.seg-btn')];

  function markActive(key) {
    for (const b of buttons) {
      const on = b.dataset.diff === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  if (difficulty) markActive(difficulty);

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      markActive(btn.dataset.diff);
      onDifficulty(btn.dataset.diff);
    });
  }

  // 模式分段（划线 / 角色）由本地记忆决定选中哪个
  const modeSeg = document.getElementById('mode');
  const modeBtns = [...modeSeg.querySelectorAll('.seg-btn')];
  for (const m of MODES) {
    const btn = modeBtns.find(b => b.dataset.mode === m.key);
    if (btn) btn.textContent = m.label;
  }

  function markModeActive(key) {
    for (const b of modeBtns) {
      const on = b.dataset.mode === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  if (mode) markModeActive(mode);

  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      markModeActive(btn.dataset.mode);
      onMode(btn.dataset.mode);
    });
  }

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
    setDifficulty: markActive,
    // 角色模式里公主自己会走，撤销/重做笔迹没意义，重画变成“回起点”
    setMode(key) {
      heroMode = key === MODE.HERO;
      btnClear.textContent = CLEAR_LABEL[key] ?? CLEAR_LABEL[MODE.STROKE];
      btnUndo.title = heroMode ? '角色模式用不上撤销' : '撤销一段笔迹';
      btnRedo.title = heroMode ? '角色模式用不上重做' : '恢复一段笔迹';
      markModeActive(key);
    },
  };
}
