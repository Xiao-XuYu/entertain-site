// 迷宫数量（网格尺寸）：很少≈旧·简单，一般≈旧·中等，很多≈旧·困难
export const SIZES = {
  fewest: { cols: 9,  rows: 7  },
  few:    { cols: 11, rows: 9  },
  medium: { cols: 15, rows: 11 },
  many:   { cols: 17, rows: 13 },
  most:   { cols: 21, rows: 15 },
};
export const DEFAULT_SIZE = 'medium';
export const SIZE_STORAGE_KEY = 'maze.size';

// 真正难度：不影响网格大小，只决定迷宫通路的复杂程度
export const LEVELS = ['easy', 'medium', 'hard'];
export const DEFAULT_LEVEL = 'medium';
export const LEVEL_STORAGE_KEY = 'maze.level';

function readKey(key, allowed, def) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : def;
  } catch { return def; }
}

function saveKey(key, val, allowed) {
  if (!allowed.includes(val)) return;
  try { localStorage.setItem(key, val); }
  catch { /* 无痕模式/配额受限，记住失败不影响玩 */ }
}

export const readSize = () => readKey(SIZE_STORAGE_KEY, Object.keys(SIZES), DEFAULT_SIZE);
export const saveSize = (k) => saveKey(SIZE_STORAGE_KEY, k, Object.keys(SIZES));
export const readDifficulty = () => readKey(LEVEL_STORAGE_KEY, LEVELS, DEFAULT_LEVEL);
export const saveDifficulty = (k) => saveKey(LEVEL_STORAGE_KEY, k, LEVELS);
export const PAD_PX = 14;

// 玩法模式：划线（笔画路径）/ 角色（拖着小公主在迷宫里走）
export const MODE = { STROKE: 'stroke', HERO: 'hero' };
export const MODES = [
  { key: MODE.STROKE, label: '✏️ 划线' },
  { key: MODE.HERO, label: '👸 角色' },
];
export const DEFAULT_MODE = MODE.STROKE;
export const MODE_STORAGE_KEY = 'maze.mode';

// 上次选的模式存在本地；读不到/值非法/存储不可用时回落到默认模式
export function readMode() {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY);
    return MODES.some(m => m.key === v) ? v : DEFAULT_MODE;
  } catch { return DEFAULT_MODE; }
}

export function saveMode(mode) {
  if (!MODES.some(m => m.key === mode)) return;
  try { localStorage.setItem(MODE_STORAGE_KEY, mode); }
  catch { /* 无痕模式/配额受限，记住失败不影响玩 */ }
}

// 角色模式下是否画移动轨迹（足迹）：默认开启
export const TRAIL_STORAGE_KEY = 'maze.heroTrail';
export function readShowTrail() {
  try {
    const v = localStorage.getItem(TRAIL_STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch { return true; }
}
export function saveShowTrail(val) {
  try { localStorage.setItem(TRAIL_STORAGE_KEY, val ? '1' : '0'); }
  catch { /* 无痕模式/配额受限，记住失败不影响玩 */ }
}
