(() => {
  const $ = (id) => document.getElementById(id);
  const SETS = window.CHAR_SETS;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const best = store.get('vca_hw_best', {});
  let list = [], idx = 0, writer = null, mistakes = 0, setName = '小一', mode = 'trace', strokeCount = 0;

  const { toneFx, TONE_PENTA, speakZh } = window;
  const pyOf = (c) => window.pinyinPro ? window.pinyinPro.pinyin(c) : '';

  function renderSets() {
    $('sets').innerHTML = Object.keys(SETS).map(k => `<button class="${k === setName ? 'on' : ''}" data-k="${k}">${k}</button>`).join('');
    $('sets').querySelectorAll('button').forEach(b => b.onclick = () => { setName = b.dataset.k; loadList([...SETS[setName]]); renderSets(); });
  }
  function loadList(chars) { list = [...new Set(chars.filter(c => /[一-鿿]/.test(c)))]; idx = 0; renderChars(); open(0); }
  function renderChars() {
    $('chars').innerHTML = list.map((c, i) => `<button class="${i === idx ? 'on' : ''}" data-i="${i}">${c}${best[c] ? `<i>${'★'.repeat(best[c])}</i>` : ''}</button>`).join('');
    $('chars').querySelectorAll('button').forEach(b => b.onclick = () => open(+b.dataset.i));
    const done = list.filter(c => best[c]).length, stars = list.reduce((n, c) => n + (best[c] || 0), 0);
    $('total').textContent = `本组已写 ${done} / ${list.length} 字 · 共 ${stars} ★`;
  }
  function open(i) {
    idx = i; mistakes = 0; renderChars();
    const c = list[idx]; if (!c) return;
    $('py').textContent = `${c}  ${pyOf(c)}`; $('stars').innerHTML = ''; $('board').querySelector('.seal')?.remove();
    $('hint').className = 'hint'; $('hint').textContent = mode === 'trace' ? '跟着淡色笔画，一笔一笔写' : '默写模式：凭记忆写，写错会提示';
    $('writer').innerHTML = '';
    const size = $('board').clientWidth - 8;
    writer = HanziWriter.create('writer', c, { width: size, height: size, padding: size * .06, showOutline: mode === 'trace', showCharacter: false,
      strokeColor: '#2b2420', outlineColor: '#e8d9c0', highlightColor: '#c99a3c', drawingColor: '#b83a2b', drawingWidth: 26, radicalColor: '#2f7a5a',
      strokeAnimationSpeed: 1.4, delayBetweenStrokes: 180,
      onLoadCharDataSuccess: (d) => { strokeCount = d.strokes.length; $('info').textContent = `${strokeCount} 画`; drawDots(0, []); startQuiz(); },
      onLoadCharDataError: () => { $('hint').className = 'hint bad'; $('hint').textContent = `暂时没有「${c}」的笔画数据，换一个字吧`; } });
  }
  let marks = [];
  function drawDots(n, m) { $('strokes').innerHTML = Array.from({ length: strokeCount }, (_, i) => `<span class="${i < n ? (m[i] ? 'miss' : 'ok') : ''}"></span>`).join(''); }
  function startQuiz() {
    marks = []; mistakes = 0;
    writer.quiz({
      leniency: mode === 'trace' ? 1.3 : 1.1, showHintAfterMisses: mode === 'trace' ? 2 : 3,
      onMistake: (d) => { mistakes++; toneFx(200, .2, 'sawtooth', .12); $('hint').className = 'hint bad'; $('hint').textContent = `第 ${d.strokeNum + 1} 笔再试试${d.mistakesOnStroke >= 2 ? '，看金色提示' : ''}`; },
      onCorrectStroke: (d) => { marks[d.strokeNum] = d.mistakesOnStroke > 0; toneFx(TONE_PENTA[d.strokeNum % 8]); drawDots(d.strokeNum + 1, marks);
        $('hint').className = 'hint good'; $('hint').textContent = d.strokesRemaining ? `第 ${d.strokeNum + 1} 笔 ✓ 还有 ${d.strokesRemaining} 笔` : '写完啦！'; },
      onComplete: () => finish(),
    });
  }
  function finish() {
    const c = list[idx];
    const stars = mistakes === 0 ? 3 : mistakes <= Math.max(2, Math.ceil(strokeCount / 4)) ? 2 : 1;
    $('stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
    const seal = document.createElement('div'); seal.className = 'seal'; seal.innerHTML = stars === 3 ? '好<br>字' : '写<br>完'; $('board').appendChild(seal);
    [523, 659, 784, 1047].forEach((f, i) => toneFx(f, .3, 'triangle', .18, i * .1));
    if (stars === 3) petals();
    if (stars > (best[c] || 0)) { best[c] = stars; store.set('vca_hw_best', best); }
    renderChars(); speakZh(c);
  }
  function petals() { for (let i = 0; i < 30; i++) { const p = document.createElement('div'); p.className = 'petal';
    p.style.cssText = `left:${Math.random() * 100}vw;top:-20px;background:${['#e98fa2', '#f3b8c4', '#c8553d', '#f6d6a8'][i % 4]};--dx:${(Math.random() - .5) * 200}px;animation-duration:${2.5 + Math.random() * 2}s;animation-delay:${Math.random() * .5}s`;
    document.body.appendChild(p); setTimeout(() => p.remove(), 5000); } }

  $('demoBtn').onclick = () => { if (!writer) return; writer.cancelQuiz(); writer.showCharacter(); writer.animateCharacter({ onComplete: () => { writer.hideCharacter(); startQuiz(); } }); speakZh(list[idx]); };
  $('againBtn').onclick = () => open(idx);
  $('nextBtn').onclick = () => open((idx + 1) % list.length);
  $('soundBtn').onclick = () => speakZh(list[idx]);
  $('customBtn').onclick = () => { const v = $('customIn').value.trim(); if (v) { setName = ''; renderSets(); loadList([...v]); } };
  $('customIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) $('customBtn').click(); });
  $('mode').querySelectorAll('button').forEach(b => b.onclick = () => { mode = b.dataset.m; $('mode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); open(idx); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => open(idx), 300); });

  renderSets(); loadList([...SETS[setName]]);
})();