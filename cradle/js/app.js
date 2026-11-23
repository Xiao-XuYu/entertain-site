/* 翻绳小花园 · 交互逻辑
   依赖 figures.js 暴露的 FIGURES / LEVELS / RELAY 全局常量。 */
'use strict';

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const STORE_LEARNED = 'cradle.learned';
  const STORE_SOUND = 'cradle.sound';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const readStore = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) { return fallback; }
  };
  const writeStore = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* 隐私模式忽略 */ }
  };

  const learned = new Set(readStore(STORE_LEARNED, []));
  let soundOn = readStore(STORE_SOUND, true) !== false;

  const byId = new Map(FIGURES.map((f) => [f.id, f]));
  const levelStars = (level) => '⭐'.repeat(LEVELS[level].stars);
  const countLevel = (level) => FIGURES.filter((f) => f.level === level && learned.has(f.id)).length;

  /* ───────── 声音 ───────── */

  let audioCtx = null;
  function tone(freq, dur = 0.16, type = 'triangle', gain = 0.045) {
    if (!soundOn) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t0 = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(amp).connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    } catch (err) { /* 忽略音频错误 */ }
  }
  const chirp = (step = 0) => tone(523.25 * Math.pow(2, (step % 5) / 12), 0.13, 'triangle', 0.04);
  const melody = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    setTimeout(() => tone(f, 0.24, 'sine', 0.05), i * 110);
  });

  /* ───────── 轻提示 ───────── */

  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(message, ms = 2500) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* ───────── 彩纸 ───────── */

  const canvas = $('#confettiCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const COLORS = ['#ff6f9c', '#b06fe0', '#45c4b0', '#ffd166', '#ff9dbc', '#8f63c9'];
  let pieces = [];
  let confettiFrame = 0;

  function sizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (canvas) { sizeCanvas(); window.addEventListener('resize', sizeCanvas); }

  function confetti(amount = 90) {
    if (!ctx || reducedMotion) return;
    const w = window.innerWidth;
    for (let i = 0; i < amount; i++) {
      pieces.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: window.innerHeight * 0.32 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 8 - 2,
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1
      });
    }
    if (!confettiFrame) confettiFrame = requestAnimationFrame(drawConfetti);
  }

  function drawConfetti() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    pieces = pieces.filter((p) => p.life > 0 && p.y < h + 60);
    pieces.forEach((p) => {
      p.vy += 0.16;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.006;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (pieces.length) {
      confettiFrame = requestAnimationFrame(drawConfetti);
    } else {
      cancelAnimationFrame(confettiFrame);
      confettiFrame = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }

  /* ───────── 图案 ───────── */

  const HAND_SHAPE = `
    <ellipse class="hand-palm" cx="0" cy="20" rx="54" ry="44"/>
    <ellipse class="hand-finger" cx="-38" cy="-12" rx="11" ry="28"/>
    <ellipse class="hand-finger" cx="-17" cy="-25" rx="11.5" ry="33"/>
    <ellipse class="hand-finger" cx="5" cy="-30" rx="11.5" ry="35"/>
    <ellipse class="hand-finger" cx="27" cy="-24" rx="11" ry="30"/>
    <ellipse class="hand-finger" cx="45" cy="-4" rx="9.5" ry="23" transform="rotate(26 45 -4)"/>
    <ellipse class="hand-nail" cx="-38" cy="-33" rx="5.5" ry="8"/>
    <ellipse class="hand-nail" cx="-17" cy="-49" rx="5.5" ry="8"/>
    <ellipse class="hand-nail" cx="5" cy="-55" rx="5.5" ry="8"/>
    <ellipse class="hand-nail" cx="27" cy="-47" rx="5" ry="7"/>`;
  const HANDS = `
    <g class="hands" aria-hidden="true">
      <g transform="translate(96 358) rotate(-12)">${HAND_SHAPE}</g>
      <g transform="translate(504 358) scale(-1 1) rotate(-12)">${HAND_SHAPE}</g>
    </g>`;

  function figureSVG(fig, { withHands = false } = {}) {
    const hands = withHands && fig.hands !== 'none' ? HANDS : '';
    return `<svg viewBox="0 0 600 420" role="img" aria-label="${fig.name}的翻绳图案" preserveAspectRatio="xMidYMid meet">${hands}${fig.art}</svg>`;
  }

  /* ───────── 花样图鉴 ───────── */

  const grid = $('#figureGrid');
  const emptyState = $('#emptyState');
  const chips = $$('.chip');
  let currentFilter = 'all';

  function cardMarkup(fig) {
    const lv = LEVELS[fig.level];
    return `
      <span class="card-art">${figureSVG(fig)}</span>
      <span class="card-head">
        <span class="level-tag ${fig.level}">${levelStars(fig.level)} ${lv.name}</span>
        <span class="learned-mark" style="display:none">✓</span>
      </span>
      <span class="card-body">
        <span class="card-title">${fig.name}<small>${fig.en}</small></span>
        <span class="card-meta">${fig.players} · 约 ${fig.minutes} 分钟 · ${fig.steps.length} 步</span>
        <span class="card-intro">${fig.intro}</span>
      </span>`;
  }

  function renderGallery() {
    if (!grid) return;
    grid.innerHTML = '';
    FIGURES.forEach((fig) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'figure-card';
      card.dataset.id = fig.id;
      card.setAttribute('aria-label', `查看「${fig.name}」的分步教程`);
      card.innerHTML = cardMarkup(fig);
      card.addEventListener('click', () => openTutorial(fig.id));
      grid.appendChild(card);
    });
    updateCardMarks();
  }

  function updateCardMarks() {
    if (!grid) return;
    $$('.figure-card', grid).forEach((card) => {
      const mark = $('.learned-mark', card);
      if (mark) mark.style.display = learned.has(card.dataset.id) ? 'grid' : 'none';
    });
  }

  const matchesFilter = (fig) => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'done') return learned.has(fig.id);
    if (currentFilter === 'duo') return fig.players.includes('双人') || fig.players.includes('1–2');
    return fig.level === currentFilter;
  };

  function applyFilter() {
    if (!grid) return;
    let shown = 0;
    $$('.figure-card', grid).forEach((card) => {
      const fig = byId.get(card.dataset.id);
      const on = fig ? matchesFilter(fig) : false;
      card.style.display = on ? '' : 'none';
      if (on) shown += 1;
    });
    if (emptyState) {
      emptyState.hidden = shown > 0;
      if (!shown) {
        emptyState.textContent = currentFilter === 'done'
          ? '还没有学会的花样哦，先去翻一个吧～'
          : '这个分类里暂时没有花样，换个筛选看看～';
      }
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      currentFilter = chip.dataset.filter || 'all';
      chips.forEach((c) => c.classList.toggle('active', c === chip));
      applyFilter();
      tone(660, 0.08, 'sine', 0.03);
    });
  });

  /* ───────── 小徽章 & 手册 ───────── */

  const BADGES = [
    { id: 'easy', emoji: '🌱', name: '简单三连', desc: '学会 3 个简单花样', level: 'easy', need: 3 },
    { id: 'mid', emoji: '🌼', name: '中等六朵', desc: '学会 6 个中等花样', level: 'mid', need: 6 },
    { id: 'hard', emoji: '🌹', name: '高手四星', desc: '学会 4 个复杂花样', level: 'hard', need: 4 }
  ];

  const badgeStates = () => BADGES.map((b) => ({ ...b, got: countLevel(b.level) >= b.need }));

  function renderBadgeRow() {
    const row = $('#badgeRow');
    if (!row) return;
    row.innerHTML = badgeStates().map((b) => `
      <span class="badge ${b.got ? 'earned' : 'locked'}">
        <span aria-hidden="true">${b.emoji}</span>${b.name}
      </span>`).join('');
  }

  function renderHandbook() {
    const summary = $('#hbSummary');
    const badgeGrid = $('#badgeGrid');
    const learnedBox = $('#hbLearned');
    if (!summary || !badgeGrid || !learnedBox) return;

    const states = badgeStates();
    const next = states.find((b) => !b.got);
    let hint;
    if (!next) {
      hint = '三个小徽章都点亮啦，真是翻绳小高手！';
    } else {
      const left = next.need - countLevel(next.level);
      hint = `再学会 ${left} 个${LEVELS[next.level].name}花样，就能点亮「${next.name}」。`;
    }
    summary.innerHTML = `已经学会 <strong>${learned.size} / ${FIGURES.length}</strong> 个花样。${hint}`;

    badgeGrid.innerHTML = states.map((b) => {
      const progress = `${Math.min(countLevel(b.level), b.need)}/${b.need}`;
      return `
        <div class="hb-badge ${b.got ? 'earned' : 'locked'}">
          <span class="emoji" aria-hidden="true">${b.emoji}</span>
          <span><b>${b.name}</b><small>${b.desc} · ${b.got ? '已点亮' : progress}</small></span>
        </div>`;
    }).join('');

    const flowers = FIGURES.filter((f) => learned.has(f.id));
    learnedBox.innerHTML = flowers.length
      ? flowers.map((f) => `<span class="hb-flower">🌸 ${f.name}</span>`).join('')
      : '<p class="hb-empty">还没有点亮的花。去图鉴挑一个喜欢的开始吧～</p>';
  }

  function refreshProgress() {
    const progressText = $('#progressText');
    if (progressText) progressText.textContent = `已学会 ${learned.size} / ${FIGURES.length}`;
    updateCardMarks();
    renderBadgeRow();
    renderHandbook();
    applyFilter();
  }

  /* ───────── 教程弹层 ───────── */

  const tutDialog = $('#tutorialDialog');
  const tut = { fig: null, step: 0, strokes: [], totalLen: 0 };

  function prepareStrokes(svg) {
    const els = $$('.s path, .s circle, .s ellipse, .s line, .s polyline, .s polygon, .s rect', svg);
    let total = 0;
    els.forEach((el) => {
      let len = 0;
      try { len = el.getTotalLength(); } catch (err) { len = 0; }
      if (!len || !Number.isFinite(len)) len = 1;
      el._len = len;
      total += len;
      el.style.strokeDasharray = `${len} ${len}`;
      el.style.strokeDashoffset = String(len);
      el.style.transition = reducedMotion ? 'none' : 'stroke-dashoffset .55s cubic-bezier(.4, .9, .3, 1)';
    });
    tut.totalLen = total;
    return els;
  }

  function revealStrokes(step) {
    const n = tut.fig ? tut.fig.steps.length : 1;
    let budget = ((step + 1) / n) * tut.totalLen;
    tut.strokes.forEach((el) => {
      const visible = Math.max(0, Math.min(el._len, budget));
      budget -= el._len;
      el.style.strokeDashoffset = String(el._len - visible);
    });
  }

  function scrollStepIntoView(item) {
    const side = $('.tut-side');
    if (!side || !item) return;
    const r = item.getBoundingClientRect();
    const sr = side.getBoundingClientRect();
    if (r.top < sr.top) side.scrollTop += r.top - sr.top - 10;
    else if (r.bottom > sr.bottom) side.scrollTop += r.bottom - sr.bottom + 10;
  }

  function renderStep(animate = true) {
    if (!tut.fig) return;
    const fig = tut.fig;
    const n = fig.steps.length;
    const step = Math.max(0, Math.min(n - 1, tut.step));
    tut.step = step;
    const meta = fig.steps[step];

    const key = $('#tutKey');
    key.textContent = meta.k;
    if (animate && !reducedMotion) {
      key.classList.remove('pop');
      void key.offsetWidth;
      key.classList.add('pop');
    }

    revealStrokes(step);

    $$('.step-item', $('#tutSteps')).forEach((item, i) => {
      item.classList.toggle('done', i < step);
      item.classList.toggle('current', i === step);
    });
    $$('.dots i', $('#tutDots')).forEach((dot, i) => dot.classList.toggle('on', i === step));

    const percent = Math.round(((step + 1) / n) * 100);
    $('#tutStepNo').textContent = `第 ${step + 1} 步 / 共 ${n} 步`;
    $('#tutPercent').textContent = `${percent}%`;
    $('#tutBar').style.width = `${percent}%`;

    $('#prevStep').disabled = step === 0;
    $('#nextStep').textContent = step === n - 1 ? '我学会啦 ✨' : '下一步 →';

    scrollStepIntoView($(`.step-item[data-i="${step}"]`, $('#tutSteps')));
    if (animate) chirp(step);
  }

  function openTutorial(id) {
    const fig = byId.get(id);
    if (!fig || !tutDialog) return;
    tut.fig = fig;
    tut.step = 0;

    $('#tutLevel').textContent = `${levelStars(fig.level)} ${LEVELS[fig.level].name}`;
    $('#tutTitle').textContent = fig.name;
    $('#tutEn').textContent = fig.en;
    $('#tutMeta').innerHTML = `
      <span class="meta-pill">${fig.players}</span>
      <span class="meta-pill">约 ${fig.minutes} 分钟</span>
      <span class="meta-pill">${fig.steps.length} 步</span>`;
    $('#tutIntro').textContent = fig.intro;
    $('#tutTip').textContent = `💡 小提示：${fig.tip}`;
    $('#tutFun').textContent = `🌟 小知识：${fig.fun}`;

    $('#tutSteps').innerHTML = fig.steps.map((s, i) => `
      <li class="step-item" data-i="${i}">
        <span class="step-key">${s.k}</span>
        <p>${s.t}</p>
      </li>`).join('');
    $('#tutDots').innerHTML = fig.steps.map((_, i) => `<i data-i="${i}"></i>`).join('');

    $('#tutDone').hidden = true;
    $('#tutArt').innerHTML = figureSVG(fig, { withHands: true });
    tut.strokes = prepareStrokes($('svg', $('#tutArt')));
    const side = $('.tut-side');
    if (side) side.scrollTop = 0;

    if (!tutDialog.open) tutDialog.showModal();
    requestAnimationFrame(() => renderStep(false));
  }

  function goStep(delta) {
    if (!tut.fig) return;
    const n = tut.fig.steps.length;
    if (delta > 0 && tut.step >= n - 1) { finishTutorial(); return; }
    const next = Math.max(0, Math.min(n - 1, tut.step + delta));
    if (next === tut.step) return;
    tut.step = next;
    renderStep();
  }

  function finishTutorial() {
    if (!tut.fig) return;
    const fig = tut.fig;
    const isNew = !learned.has(fig.id);
    if (isNew) {
      learned.add(fig.id);
      writeStore(STORE_LEARNED, [...learned]);
    }
    $('#doneText').textContent = isNew
      ? `你点亮了一朵新的小花：${fig.name}。`
      : `又翻了一遍「${fig.name}」，越来越熟练啦。`;
    $('#tutDone').hidden = false;
    refreshProgress();
    confetti(isNew ? 110 : 55);
    melody();
  }

  if (tutDialog) {
    $('#prevStep').addEventListener('click', () => goStep(-1));
    $('#nextStep').addEventListener('click', () => goStep(1));
    $('#tutClose').addEventListener('click', () => tutDialog.close());
    $('#doneClose').addEventListener('click', () => {
      tutDialog.close();
      toast('已经收进小手册啦 🌷');
    });
    $('#doneAgain').addEventListener('click', () => {
      $('#tutDone').hidden = true;
      tut.step = 0;
      renderStep(false);
    });
    tutDialog.addEventListener('close', () => { $('#tutDone').hidden = true; });

    tutDialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goStep(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goStep(1); }
    });

    let swipeStart = null;
    const stage = $('.tut-stage', tutDialog);
    if (stage) {
      stage.addEventListener('pointerdown', (e) => {
        swipeStart = { x: e.clientX, y: e.clientY };
      });
      stage.addEventListener('pointerup', (e) => {
        if (!swipeStart) return;
        const dx = e.clientX - swipeStart.x;
        const dy = e.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) goStep(dx < 0 ? 1 : -1);
      });
      stage.addEventListener('pointercancel', () => { swipeStart = null; });
    }
  }

  /* ───────── 双人接龙 ───────── */

  const timerValue = $('#timerValue');
  const timerNext = $('#timerNext');
  const timerStart = $('#timerStart');
  const timerNextBtn = $('#timerNextBtn');
  const timerResetBtn = $('#timerReset');
  const relay = { running: false, step: 0, start: 0, elapsed: 0, tick: 0 };

  const fmtTime = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  function renderTimer() {
    if (!timerValue) return;
    const ms = relay.elapsed + (relay.running ? Date.now() - relay.start : 0);
    timerValue.textContent = fmtTime(ms);
    if (relay.running) {
      const fig = byId.get(RELAY[relay.step]);
      timerNext.textContent = `第 ${relay.step + 1} 手 · ${fig ? fig.name : ''}`;
    }
  }

  function renderChain() {
    const chain = $('#relayChain');
    if (!chain) return;
    chain.innerHTML = RELAY.map((id, i) => {
      const fig = byId.get(id);
      if (!fig) return '';
      return `
        <li>
          <button type="button" data-fig="${fig.id}" aria-label="查看「${fig.name}」的教程">
            <span class="chain-num">${i + 1}</span>
            <span class="chain-text">
              <span class="chain-name">${fig.name}</span>
              <span class="chain-sub">${fig.players} · ${fig.steps.length} 步</span>
            </span>
          </button>
        </li>`;
    }).join('');
    chain.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-fig]');
      if (btn) openTutorial(btn.dataset.fig);
    });
  }

  function startRelay() {
    if (!timerValue || relay.running) return;
    if (relay.elapsed > 0) { relay.elapsed = 0; relay.step = 0; }
    relay.running = true;
    relay.start = Date.now();
    relay.tick = setInterval(renderTimer, 250);
    timerStart.hidden = true;
    timerNextBtn.hidden = false;
    timerResetBtn.hidden = false;
    timerNextBtn.textContent = '翻好啦，下一手';
    renderTimer();
    chirp(0);
  }

  function relayNext() {
    if (!relay.running) return;
    if (relay.step >= RELAY.length - 1) { finishRelay(); return; }
    relay.step += 1;
    renderTimer();
    chirp(relay.step);
    timerNextBtn.textContent = relay.step >= RELAY.length - 1 ? '接完啦 ✨' : '翻好啦，下一手';
  }

  function finishRelay() {
    if (!relay.running) return;
    relay.running = false;
    clearInterval(relay.tick);
    relay.tick = 0;
    const total = relay.elapsed + (Date.now() - relay.start);
    relay.elapsed = total;
    relay.start = 0;
    timerValue.textContent = fmtTime(total);
    timerNext.textContent = `接完整条接龙，用了 ${fmtTime(total)}`;
    timerNextBtn.hidden = true;
    timerResetBtn.hidden = false;
    timerStart.hidden = false;
    timerStart.textContent = '再玩一次';
    confetti(90);
    melody();
    toast(`接龙完成！用时 ${fmtTime(total)}，配合得真好 🌟`, 3200);
  }

  function resetRelay() {
    relay.running = false;
    relay.step = 0;
    relay.elapsed = 0;
    relay.start = 0;
    clearInterval(relay.tick);
    relay.tick = 0;
    timerValue.textContent = '00:00';
    timerNext.textContent = '从“面条”开始';
    timerStart.hidden = false;
    timerStart.textContent = '开始接龙';
    timerNextBtn.hidden = true;
    timerResetBtn.hidden = true;
  }

  if (timerStart) {
    timerStart.addEventListener('click', startRelay);
    timerNextBtn.addEventListener('click', relayNext);
    timerResetBtn.addEventListener('click', resetRelay);
  }

  /* ───────── 随机抽签 ───────── */

  const drawDialog = $('#drawDialog');
  const drawSlot = $('#drawSlot');
  const drawArt = $('#drawArt');
  const drawDesc = $('#drawDesc');
  let drawPick = null;
  let drawRollTimer = 0;

  function settleDraw() {
    let pool = FIGURES;
    if (drawPick && FIGURES.length > 1) pool = FIGURES.filter((f) => f.id !== drawPick.id);
    drawPick = pool[Math.floor(Math.random() * pool.length)];
    drawSlot.classList.remove('rolling');
    drawSlot.textContent = drawPick.name;
    drawArt.innerHTML = figureSVG(drawPick, { withHands: true });
    drawDesc.textContent = `${drawPick.intro}（${drawPick.players} · 约 ${drawPick.minutes} 分钟）`;
    tone(880, 0.12, 'triangle', 0.04);
  }

  function rollDraw() {
    if (!drawDialog) return;
    clearInterval(drawRollTimer);
    drawSlot.classList.add('rolling');
    drawArt.innerHTML = '';
    drawDesc.textContent = '正在为你抽一个花样…';
    let count = 0;
    drawRollTimer = setInterval(() => {
      const fig = FIGURES[Math.floor(Math.random() * FIGURES.length)];
      drawSlot.textContent = fig.name;
      if (++count >= 9) {
        clearInterval(drawRollTimer);
        drawRollTimer = 0;
        settleDraw();
      }
    }, 70);
  }

  function openDraw() {
    if (!drawDialog) return;
    if (!drawDialog.open) drawDialog.showModal();
    rollDraw();
  }

  if (drawDialog) {
    $('#drawBtn').addEventListener('click', openDraw);
    const drawBtn2 = $('#drawBtn2');
    if (drawBtn2) drawBtn2.addEventListener('click', openDraw);
    $('#drawClose').addEventListener('click', () => drawDialog.close());
    $('#drawAgain').addEventListener('click', rollDraw);
    $('#drawGo').addEventListener('click', () => {
      const id = drawPick ? drawPick.id : null;
      drawDialog.close();
      if (id) setTimeout(() => openTutorial(id), 130);
    });
    drawDialog.addEventListener('close', () => clearInterval(drawRollTimer));
    drawDialog.addEventListener('click', (e) => { if (e.target === drawDialog) drawDialog.close(); });
  }

  /* ───────── 我的手册 ───────── */

  const handbookDialog = $('#handbookDialog');
  if (handbookDialog) {
    const openHandbook = () => {
      renderHandbook();
      if (!handbookDialog.open) handbookDialog.showModal();
    };
    $('#progressBtn').addEventListener('click', openHandbook);
    $('#handbookBtn').addEventListener('click', openHandbook);
    $('#hbClose').addEventListener('click', () => handbookDialog.close());
    handbookDialog.addEventListener('click', (e) => {
      if (e.target === handbookDialog) handbookDialog.close();
    });
  }

  /* ───────── 音效开关 ───────── */

  const soundBtn = $('#soundBtn');
  function renderSound() {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    const icon = $('#soundIcon');
    if (icon) icon.textContent = soundOn ? '🔔' : '🔕';
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundOn = !soundOn;
      writeStore(STORE_SOUND, soundOn);
      renderSound();
      if (soundOn) {
        tone(660, 0.12, 'sine', 0.05);
        setTimeout(() => tone(880, 0.16, 'sine', 0.05), 120);
      }
      toast(soundOn ? '音效打开啦 🔔' : '音效关掉啦 🔕', 1600);
    });
  }

  /* ───────── 移动导航 ───────── */

  const menuBtn = $('#menuToggle');
  const mobileNav = $('#mobileNav');
  if (menuBtn && mobileNav) {
    const closeMenu = () => {
      mobileNav.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', '打开导航');
    };
    menuBtn.addEventListener('click', () => {
      const willOpen = mobileNav.hidden;
      mobileNav.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', String(willOpen));
      menuBtn.setAttribute('aria-label', willOpen ? '关闭导航' : '打开导航');
    });
    mobileNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ───────── 滚动出现 ───────── */

  function initReveal() {
    $$('#learn .lesson-card, #gallery .section-head, #gallery .filters, #relay .relay-layout, #facts .section-head, #facts .fact-card, .handbook-inner')
      .forEach((el) => el.classList.add('reveal'));
    const targets = $$('.reveal');
    if (!('IntersectionObserver' in window) || reducedMotion) {
      targets.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => io.observe(el));
  }

  /* ───────── 启动 ───────── */

  renderGallery();
  renderChain();
  renderSound();
  refreshProgress();
  initReveal();

  window.__cradle = {
    figures: FIGURES,
    openTutorial,
    getLearned: () => [...learned]
  };
})();
