// 设置弹框：顶栏「设置」按钮打开，内含主题选项（当前主题高亮）
import { THEMES, readThemeKey } from '../themes.js';

export function initSettings({ onTheme }) {
  const gears = document.querySelectorAll('[data-settings]');
  const overlay = document.getElementById('settings-overlay');
  const grid = document.getElementById('theme-list');
  if (!overlay || !grid) return;

  let current = readThemeKey();

  // 由 THEMES 注册表动态生成主题选项按钮
  grid.innerHTML = '';
  const btns = THEMES.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme-opt';
    b.dataset.theme = t.key;
    b.innerHTML = `<span class="theme-opt-icon">${t.icon}</span><span class="theme-opt-name">${t.name}</span>`;
    b.addEventListener('click', () => {
      current = t.key;
      refreshActive();
      onTheme(t.key);
    });
    grid.appendChild(b);
    return b;
  });

  function refreshActive() {
    btns.forEach((b) => b.classList.toggle('is-active', b.dataset.theme === current));
  }

  function open() {
    refreshActive();
    overlay.classList.remove('hidden');
  }
  function close() {
    overlay.classList.add('hidden');
  }

  gears.forEach((g) => g.addEventListener('click', open));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  const closeBtn = overlay.querySelector('[data-close]');
  if (closeBtn) closeBtn.addEventListener('click', close);
}