# 🎀 小公主迷宫

全屏自适应的随机 2D 迷宫网页，粉紫色调，适合小朋友玩。两种玩法：**✏️ 划线**（鼠标、手指、触控笔随便画，碰到或穿过粉色墙都没关系——笔迹里包含一条从 🏰 到 👑 不穿墙的连通路线就算过关）和 **👸 角色**（按住小公主，沿着通道把她在迷宫里拖到终点，穿不过墙）。上一次选的模式会记在浏览器本地。

## 运行

ES Module 需要通过本地服务器打开（二选一）：

```bash
python -m http.server 8000
# 或 npx serve .
```

然后浏览器访问 `http://localhost:8000`。直接双击打开 `index.html` 在 Chrome 下会被 file:// 的模块安全策略拦截。

> 支持 **PWA**：首次在线访问后自动缓存全部静态资源（service worker），之后离线也能玩；Chrome/Edge 地址栏会出现「安装」入口，可像 App 一样全屏启动。改代码后需把 [sw.js](sw.js) 顶部 `VERSION` 升号以触发重新缓存。

## 玩法

- 顶部先选 **✏️ 划线 / 👸 角色**；上次选的模式存在浏览器本地（localStorage，键 `maze.mode`），刷新/重开自动沿用，第一次默认「划线」。切换模式不会重生成迷宫，两边的进度各自保留，只清掉胜负状态并重设计时
- 顶部切换 **简单 / 中等 / 困难**（迷宫行列数随之变化，并自动生成新迷宫）；上次选的难度会记在浏览器本地（localStorage），刷新/重开页面自动沿用，第一次默认「中等」
- 左上角 🏰 是起点、右下角 👑 是终点

**✏️ 划线**：想在哪落笔就在哪落笔，不用接上一段的笔尾，笔线穿墙也会保留；每抬一次笔游戏都会检查所有笔迹里是否存在一条完全不穿墙的连续路线把 🏰 和 👑 串起来，有就过关（穿墙的段只算涂鸦、不算路线）。↩️ 撤销 / ↪️ 重做按段撤销·恢复笔迹（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y）；🧽 重画清除所有笔迹；触控笔按压越重线越粗（pressure），鼠标/手指用固定压力

**👸 角色**：按住小公主本人（按住别处她不动），手指挪多远她就走多远；撞墙不会穿过墙，也不会贴墙卡住——她会顺着墙滑、绕过弯，但死胡同里会停住，所以路线还得自己找。走过的路留下淡粉缎带 + 小爱心足迹，她本人会呼吸、走动时裙摆轻摆、被墙挡住时轻微别扭。方向键 ↑↓←→ 可以一格一格走（无障碍 / 不方便精细拖动时好用），顶到墙会提示。🧹 回起点：把她放回 🏰 门口；角色模式下 ↩️ 撤销 / ↪️ 重做用不上（会置灰）

## 多端适配

- canvas 全屏 + devicePixelRatio 高清渲染，横竖屏 / 窗口缩放自动重排（笔迹存网格坐标，缩放不丢失）
- Pointer Events 统一鼠标 / 触控 / 触控笔，coalesced events 保证笔迹平滑，`touch-action:none` 防滚动干扰
- 顶部控制栏随窄屏换行，迷宫区域按控制栏实际高度避让，适配 `safe-area-inset`
- 角色模式的公主半径按格子短边缩放（`0.40 × min(cellW, cellH)`），横竖屏/窗口缩放后她仍待在原来那条通道里；只有这一模式跑 `requestAnimationFrame`（呼吸、裙摆、足迹闪烁），划线模式不跑动画帧

## 文件结构

```
index.html          页面骨架（双 canvas：maze 静态层 / ink 笔迹层）
css/
  base.css          重置 + 主题变量 + 页面渐变背景
  layout.css        全屏画布舞台
  controls.css      顶部控制栏（模式 / 难度分段、按钮）
  hud.css           计时与提示语（含抖动动画）
  overlay.css       胜利弹窗 + 彩带飘落
js/
  main.js           入口
  app.js            总编排（状态、指针流程、胜负判定）
  config.js         难度表、模式表（划线/角色）、常量、上次难度与模式的本地读写
  maze/
    cell.js         墙体位掩码
    generator.js    递归回溯生成完美迷宫
    walls.js        墙 → 网格空间线段（碰撞数据）
  geometry/
    geometry.js     视口↔网格坐标换算、格子尺寸自适应
    intersect.js    线段严格相交（贴墙/擦角不误判）
  render/
    theme.js        粉紫配色
    renderer.js     双 canvas 分层渲染
    drawMaze.js     卡片底、圆点纹理、墙、起终点 emoji
    drawDecor.js    卡片四角爱心
    drawPath.js     笔迹平滑绘制（笔压线宽）
  input/
    pointer.js      Pointer Events 封装（含 coalesced）
    stroke.js       笔迹数据结构
    collision.js    笔迹段 vs 墙的碰撞查询
    route.js        过关判定：笔迹里含不穿墙的 🏰→👑 连续路线（格子图 BFS）
  ui/
    controls.js     控制栏事件
    hud.js          计时、提示语
    win.js          胜利弹窗与 confetti
```
