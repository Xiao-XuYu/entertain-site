// 主题注册表：每个主题 = 名称 + 起终点图标 + 迷宫配色 + 英雄/足迹画法
import { drawPrincess, drawHeroTrail } from './hero/princess.js';
import { drawMonkey, drawMonkeyTrail } from './hero/monkey.js';

export const DEFAULT_THEME_KEY = 'princess';
const THEME_STORAGE_KEY = 'maze.theme';

export const THEMES = [
  {
    key: 'princess',
    name: '小公主',
    icon: '👸',
    brand: '🎀 小公主迷宫',
    title: '小公主迷宫 · 公主的皇冠',
    startEmoji: '🏰',
    endEmoji: '👑',
    startName: '城堡',
    endName: '皇冠',
    heroName: '小公主',
    painter: drawPrincess,
    trail: drawHeroTrail,
    colors: {
      card: '#ffffff',
      cardEdge: '#ffdcea',
      dot: '#ffe7f1',
      wallBase: '#fbd3e4',
      wall: '#ea8fbf',
      startBg: '#ffe0ee',
      endBg: '#fff0cd',
      ring: '#f7a8c4',
      ink: '#c0559a',
      inkGlow: 'rgba(192,85,154,.28)',
      inkBroken: '#ff5c8f',
      decor: '#ffc0d9',
      emojiFont: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif',
    },
    css: {
      '--bg-1': '#fff0f6', '--bg-2': '#f3e8ff',
      '--card-edge': '#ffdcea', '--pink': '#f49ec0', '--pink-deep': '#e58bb0',
      '--ink': '#c0559a', '--text': '#7a4b68',
      '--shadow': '0 10px 30px rgba(214,120,170,.22)',
    },
  },
  {
    key: 'monkey',
    name: '西游记',
    icon: '🐒',
    brand: '🥁 西游记迷宫',
    title: '西游记迷宫 · 悟空取经',
    startEmoji: '🏔️',
    endEmoji: '📜',
    startName: '花果山',
    endName: '经书',
    heroName: '孙悟空',
    painter: drawMonkey,
    trail: drawMonkeyTrail,
    colors: {
      card: '#fffdf5',
      cardEdge: '#f6e2ae',
      dot: '#fbf0d7',
      wallBase: '#f4e0ae',
      wall: '#e6a94e',
      startBg: '#fff3d4',
      endBg: '#f0f7e0',
      ring: '#ecc35a',
      ink: '#bf6f24',
      inkGlow: 'rgba(191,111,36,.25)',
      inkBroken: '#e86a2a',
      decor: '#f0c77e',
      emojiFont: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif',
    },
    css: {
      '--bg-1': '#fff8ec', '--bg-2': '#e9f5e0',
      '--card-edge': '#f6e2ae', '--pink': '#d9892f', '--pink-deep': '#c06f1f',
      '--ink': '#bf6f24', '--text': '#7b5619',
      '--shadow': '0 10px 30px rgba(201,138,44,.24)',
    },
  },
];

export function findTheme(key) {
  return THEMES.find((t) => t.key === key) || THEMES.find((t) => t.key === DEFAULT_THEME_KEY);
}

// 上次选的主题存在本地；读不到/值非法/存储不可用时回落到默认主题
export function readThemeKey() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return findTheme(v).key;
  } catch { return DEFAULT_THEME_KEY; }
}

export function saveThemeKey(key) {
  if (!THEMES.some((t) => t.key === key)) return;
  try { localStorage.setItem(THEME_STORAGE_KEY, key); }
  catch { /* 无痕模式/配额受限，记住失败不影响玩 */ }
}