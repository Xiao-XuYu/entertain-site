import { drawMaze } from './drawMaze.js';
import { drawDecor } from './drawDecor.js';
import { drawStroke } from './drawPath.js';
import { toPx } from '../geometry/geometry.js';
import { getTheme } from './theme.js';

export class Renderer {
  constructor(mazeCanvas, inkCanvas) {
    this.mazeCanvas = mazeCanvas;
    this.inkCanvas = inkCanvas;
    this.mctx = mazeCanvas.getContext('2d');
    this.ictx = inkCanvas.getContext('2d');
    this.cssW = 0;
    this.cssH = 0;
  }

  setSize(w, h, dpr) {
    this.cssW = w;
    this.cssH = h;
    for (const c of [this.mazeCanvas, this.inkCanvas]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    this.mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  drawStatic(maze, geo) {
    this.mctx.clearRect(0, 0, this.cssW, this.cssH);
    drawDecor(this.mctx, geo);
    drawMaze(this.mctx, maze, geo);
  }

  drawInk(strokes, activeStroke, geo) {
    this.ictx.clearRect(0, 0, this.cssW, this.cssH);
    for (const s of strokes) drawStroke(this.ictx, s, geo);
    if (activeStroke) drawStroke(this.ictx, activeStroke, geo);
  }

  // 角色模式：同一张 ink 画布上画足迹 + 英雄（画像按当前主题分发）
  drawHero(trail, hero, geo, r, time, flags) {
    const t = getTheme();
    this.ictx.clearRect(0, 0, this.cssW, this.cssH);
    t.trail(this.ictx, trail, geo, r);
    const p = toPx(hero.gx, hero.gy, geo);
    t.painter(this.ictx, p.x, p.y, r, time, flags);
  }
}
