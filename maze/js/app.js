import {
  SIZES, PAD_PX, MODE,
  readSize, saveSize, readDifficulty, saveDifficulty, readMode, saveMode, readShowTrail, saveShowTrail,
} from './config.js';
import { generateMaze } from './maze/generator.js';
import { wallSegments } from './maze/walls.js';
import { computeGeometry, toGrid, toPx } from './geometry/geometry.js';
import { Renderer } from './render/renderer.js';
import { createStroke, addStrokePoint } from './input/stroke.js';
import { hasWinningRoute } from './input/route.js';
import { attachPointer } from './input/pointer.js';
import { initControls } from './ui/controls.js';
import { initSettings } from './ui/settings.js';
import { getTheme, applyTheme } from './render/theme.js';
import { sfx } from './audio.js';
import { createHud } from './ui/hud.js';
import { showWin, hideWin, bindWinButtons } from './ui/win.js';
import {
  createHero, resetHero, heroRadius, dragHero, stepHero, advanceHero, heroAtEnd,
} from './hero/hero.js';

export function startApp() {
  const inkCanvas = document.getElementById('ink-canvas');
  const controlsEl = document.getElementById('controls');
  const renderer = new Renderer(
    document.getElementById('maze-canvas'), inkCanvas);
  const hud = createHud();
  let showTrail = readShowTrail();

  let sizeKey = readSize();              // 迷宫数量（网格尺寸，本地记忆）
  let levelKey = readDifficulty();       // 真正难度（通路复杂度，本地记忆）
  let mode = readMode();                 // 上次选的模式（本地记忆）
  let maze = null, walls = [], geo = null;
  let strokes = [], undone = [], active = null, won = false;
  let hero = createHero();
  let dragging = false, grab = { x: 0, y: 0 };
  let raf = 0, wallSince = 0, wallNudged = 0;
  let setUndoRedo = () => {}, setModeUi = () => {};

  // 供调试与自动化自测读取内部状态
  window.__maze = () => ({ maze, geo, strokes, undone, walls, mode, hero, won });

  function theme() { return getTheme(); }

  function refreshThemeUi() {
    const t = theme();
    document.title = t.title;
    const brand = document.querySelector('.brand');
    if (brand) brand.textContent = t.brand;
    const body = document.body;
    for (const k of Object.keys(t.css || {})) {
      body.style.setProperty(k, t.css[k]);
    }
    modeMsg();
  }

  function onTheme(key) {
    applyTheme(key);
    refreshThemeUi();
    layout(); // 重新读取主题配色重绘
  }

  function renderHero(time) {
    renderer.drawHero(hero.trail, hero, geo, heroRadius(geo), time, {
      moving: dragging || !!hero.tween,
      blocked: wallSince > 0,
      dx: hero.dir.x,
    }, showTrail);
  }

  function renderInk() {
    if (mode === MODE.HERO) renderHero(performance.now() / 1000);
    else renderer.drawInk(strokes, active, geo);
  }

  function layout() {
    const w = window.innerWidth, h = window.innerHeight;
    const top = controlsEl.getBoundingClientRect().height;
    geo = computeGeometry(w, h, maze.cols, maze.rows, {
      left: PAD_PX, right: PAD_PX, top: top + PAD_PX, bottom: PAD_PX,
    });
    renderer.setSize(w, h, Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.drawStatic(maze, geo);
    renderInk();
  }

  function modeMsg() {
    const t = theme();
    if (mode === MODE.HERO) {
      hud.setMsg(`${t.icon} 按住${t.heroName}，把她在迷宫里拖到 ${t.endEmoji}（别穿墙，方向键也能走）`);
    } else {
      hud.setMsg(`想怎么画就怎么画，碰到墙也没关系～笔迹里有一条 ${t.startEmoji} → ${t.endEmoji} 不穿墙的连通路线就算赢！`);
    }
  }

  function newMaze() {
    const s = SIZES[sizeKey];
    maze = generateMaze(s.cols, s.rows, levelKey);
    walls = wallSegments(maze);
    strokes = []; undone = []; active = null; won = false;
    resetHero(hero);
    dragging = false; wallSince = 0;
    hideWin();
    setUndoRedo(false, false);
    modeMsg();
    hud.startTimer();
    layout();
  }

  function onClear() {
    sfx.click();
    if (mode === MODE.HERO) {
      resetHero(hero);
      dragging = false; wallSince = 0;
      if (won) { won = false; hud.startTimer(); }
      hud.setMsg(`${theme().heroName}回到 ${theme().startEmoji} ${theme().startName}门口啦，再拖${theme().heroName}走一遍～`);
      renderHero(performance.now() / 1000);
      return;
    }
    strokes = []; undone = [];
    renderInk();
    setUndoRedo(false, false);
  }

  // 切换模式：同一道题不重生成，笔迹和公主各自保留，胜负状态清零
  function onMode(next) {
    if (next === mode) return;
    mode = next;
    saveMode(mode);
    setModeUi(mode);
    won = false;
    active = null;
    dragging = false;
    wallSince = 0;
    hideWin();
    hud.startTimer();
    modeMsg();
    renderInk();
    restartLoop();
  }

  function undo() {
    if (mode === MODE.HERO || won || !strokes.length) return;
    sfx.click();
    undone.push(strokes.pop());
    hud.setMsg('↩️ 撤销了一段～');
    renderInk();
    setUndoRedo(strokes.length > 0, true);
  }

  function redo() {
    if (mode === MODE.HERO || won || !undone.length) return;
    sfx.click();
    strokes.push(undone.pop());
    hud.setMsg('↪️ 重做回来啦～');
    renderInk();
    setUndoRedo(true, undone.length > 0);
  }

  function win() {
    if (won) return;
    won = true;
    sfx.win();
    dragging = false;
    hero.tween = null;
    hud.stopTimer();
    hud.setMsg(`🎉 ${theme().endName}找到啦！`);
    const how = mode === MODE.HERO
      ? `${theme().heroName}走了约 ${Math.round(hero.steps)} 格，穿过 ${maze.cols}×${maze.rows} 的迷宫！`
      : `走出了 ${maze.cols}×${maze.rows} 的迷宫！`;
    showWin(`用时 ${hud.elapsedText()}，${how}`);
  }

  // —— 角色模式：按住小公主拖着她走 ——
  function heroStart(p) {
    if (won) return;
    const c = toPx(hero.gx, hero.gy, geo);
    const reach = heroRadius(geo) * 2.2;
    if (Math.hypot(p.x - c.x, p.y - c.y) > reach) {
      hud.nudge(`要按住${theme().heroName}本人才能带着${theme().heroName}走哦 ${theme().icon}`);
      return;
    }
    dragging = true;
    hero.tween = null;
    grab = { x: c.x - p.x, y: c.y - p.y }; // 保持抓取偏移，公主不会“跳”到指尖下
  }

  function heroMove(p) {
    if (!dragging) return;
    const target = toGrid(p.x + grab.x, p.y + grab.y, geo);
    if (dragHero(hero, maze, geo, target, heroRadius(geo))) {
      const now = performance.now();
      if (!wallSince) { wallSince = now; sfx.wall(); }
      else if (now - wallSince > 500 && now - wallNudged > 2500) {
        wallNudged = now;
        hud.nudge('这面墙过不去，绕一绕再走 🧱');
      }
    } else {
      wallSince = 0;
    }
    if (heroAtEnd(hero, maze)) win();
  }

  function heroEnd() {
    if (!dragging) return;
    dragging = false;
    wallSince = 0;
    if (!won) hud.setMsg(`松开手${theme().heroName}就停下；想挪就再按住${theme().heroName}，朝右下角的 ${theme().endEmoji} 走 →`);
  }

  attachPointer(inkCanvas, {
    onStart(p, w) {
      if (mode === MODE.HERO) return heroStart(p);
      if (won) return;
      const g = toGrid(p.x, p.y, geo);
      active = createStroke({ x: g.x, y: g.y, w });
    },
    onMove(p, w) {
      if (mode === MODE.HERO) return heroMove(p);
      if (!active) return;
      const g = toGrid(p.x, p.y, geo);
      addStrokePoint(active, { x: g.x, y: g.y, w });
      renderInk();
    },
    onEnd(p, w) {
      if (mode === MODE.HERO) return heroEnd();
      if (!active) return;
      const g = toGrid(p.x, p.y, geo);
      addStrokePoint(active, { x: g.x, y: g.y, w });
      if (active.points.length >= 2) {
        sfx.place();
        undone = [];
        strokes.push(active);
        if (hasWinningRoute(strokes, walls, maze)) {
          win();
        } else {
          hud.setMsg(`继续画～朝右下角的 ${theme().endEmoji} 画出一条不穿墙的连通路线就好 ✨`);
        }
      }
      active = null;
      setUndoRedo(strokes.length > 0, undone.length > 0);
      renderInk();
    },
  });

  // 角色模式公主会呼吸/摇摆、走过的路会闪，所以只在这一模式跑动画帧
  function loop(now) {
    raf = 0;
    if (mode !== MODE.HERO) return;
    if (advanceHero(hero, now) && heroAtEnd(hero, maze)) win();
    renderHero(now / 1000);
    raf = requestAnimationFrame(loop);
  }

  function restartLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (mode === MODE.HERO) raf = requestAnimationFrame(loop);
  }

  const controls = initControls({
    size: sizeKey,
    level: levelKey,
    mode,
    onSize(key) { sfx.click(); sizeKey = key; saveSize(key); newMaze(); },
    onLevel(key) { sfx.click(); levelKey = key; saveDifficulty(key); newMaze(); },
    onMode: (next) => { sfx.click(); onMode(next); },
    onNew: () => { sfx.click(); newMaze(); },
    onClear,
    onUndo: undo,
    onRedo: redo,
  });
  setUndoRedo = controls.setUndoRedo;
  setModeUi = controls.setMode;

  initSettings({
    onTheme,
    onTrailToggle: (val) => {
      showTrail = val;
      saveShowTrail(val);
      renderInk();
    },
  });

  bindWinButtons({ onAgain: () => { hideWin(); newMaze(); }, onClose: hideWin });

  window.addEventListener('keydown', (e) => {
    if (mode === MODE.HERO) {
      const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (dir) {
        e.preventDefault();
        if (won) return;
        if (stepHero(hero, maze, dir[0], dir[1], performance.now())) {
          sfx.step();
        } else {
          hud.nudge('这面墙过不去，换个方向试试 🧱');
        }
        return;
      }
    }
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (k === 'y') { e.preventDefault(); redo(); }
  });

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  setModeUi(mode);
  refreshThemeUi();
  modeMsg();
  newMaze();
  restartLoop();
}
