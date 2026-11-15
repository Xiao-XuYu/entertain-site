import { THEMES, findTheme, readThemeKey, saveThemeKey } from '../themes.js';

let theme = findTheme(readThemeKey());
export const THEME = { ...theme.colors };

export function getTheme() {
  return theme;
}

// 切换主题：就地更新 THEME（保持现看引用），并记忆到本地
export function applyTheme(key) {
  theme = findTheme(key);
  Object.assign(THEME, theme.colors);
  saveThemeKey(theme.key);
  return theme;
}