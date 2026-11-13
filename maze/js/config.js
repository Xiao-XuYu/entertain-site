export const DIFFICULTIES = {
  easy:   { cols: 9,  rows: 7  },
  medium: { cols: 15, rows: 11 },
  hard:   { cols: 21, rows: 15 },
};
export const DEFAULT_DIFFICULTY = 'medium';
export const DIFFICULTY_STORAGE_KEY = 'maze.difficulty';

// 上次选的难度存在本地；读不到/值非法/存储不可用时回落到默认难度
export function readDifficulty() {
  try {
    const v = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    return Object.hasOwn(DIFFICULTIES, v) ? v : DEFAULT_DIFFICULTY;
  } catch { return DEFAULT_DIFFICULTY; }
}

export function saveDifficulty(key) {
  if (!Object.hasOwn(DIFFICULTIES, key)) return;
  try { localStorage.setItem(DIFFICULTY_STORAGE_KEY, key); }
  catch { /* 无痕模式/配额受限，记住失败不影响玩 */ }
}
export const PAD_PX = 14;
export const START_EMOJI = '🏰';
export const END_EMOJI = '👑';

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
