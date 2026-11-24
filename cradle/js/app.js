import { FIGURES, PLAYERS } from './figures.js';
import { createCradleScene } from './scene3d.js';

const $ = (id) => document.getElementById(id);
const holderOf = (i) => FIGURES[i].holder;
const other = (k) => (k === 'A' ? 'B' : 'A');

let scene = null;
let current = 0;
let detailOpen = false;
let busy = false;
let looping = false;

/* ---------------- 列表 ---------------- */
function renderList() {
  $('figureList').innerHTML = FIGURES.map((f, i) => `
    <li>
      <a class="figure-row" href="#/f/${i}">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="row-main">
          <span class="row-title">${f.name}<em>${f.en}</em></span>
          <span class="row-desc">${f.tagline}</span>
        </span>
        <span class="row-holder"><i style="background:${PLAYERS[f.holder].css}"></i>${PLAYERS[f.holder].name}持有</span>
        <span class="row-go">3D 演示 →</span>
      </a>
    </li>`).join('');
}

function renderSteps() {
  $('stepList').innerHTML = FIGURES.map((f, i) => `
    <li data-i="${i}">
      <span class="step-n">${i + 1}</span>
      <span class="step-name">${f.name}</span>
      <span class="step-holder"><i style="background:${PLAYERS[f.holder].css}"></i>${PLAYERS[f.holder].name}</span>
    </li>`).join('');
  $('stepList').querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      if (busy) return;
      const i = +li.dataset.i;
      if (i === current) return;
      if (scene) { markBusy(); scene.startMove(i); }
    });
  });
}

/* ---------------- 详情 ---------------- */
function refresh(i) {
  current = i;
  const f = FIGURES[i];
  const nk = other(f.holder);
  const nf = FIGURES[(i + 1) % FIGURES.length];

  $('figName').textContent = f.name;
  $('figEn').textContent = f.en;
  $('figCounter').textContent = `第 ${i + 1} / ${FIGURES.length} 步`;
  $('figDesc').textContent = f.desc;

  const chip = $('holderChip');
  chip.querySelector('i').style.background = PLAYERS[f.holder].css;
  chip.querySelector('span').textContent = `${PLAYERS[f.holder].name} 正拿着绳子`;

  $('actionWho').textContent = PLAYERS[nk].name;
  $('actionWho').style.color = PLAYERS[nk].css;
  $('actionNextName').textContent = nf.name;
  $('actionText').textContent = f.action;
  $('actionText').classList.remove('pending');

  $('progress').innerHTML = FIGURES.map((_, k) =>
    `<i class="${k === i ? 'on' : ''}"></i>`).join('');

  $('stepList').querySelectorAll('li').forEach(li => {
    li.classList.toggle('on', +li.dataset.i === i);
  });
  document.title = `${f.name} · 翻绳接龙`;
}

function setActionBusy(b) {
  busy = b;
  ['prevBtn', 'nextBtn'].forEach(id => { $(id).disabled = b; });
}

function markBusy() {
  const el = $('actionText');
  el.textContent = '正在把绳子接过去…';
  el.classList.add('pending');
}

function updatePlayBtn() {
  $('playBtn').textContent = looping ? '停止连播' : '连续演示';
  $('playBtn').classList.toggle('on', looping);
}

function initScene() {
  if (scene) return;
  scene = createCradleScene($('stage3d'), {
    onState(s) {
      looping = s.loop;
      setActionBusy(s.animating);
      updatePlayBtn();
    },
    onArrive({ index }) {
      refresh(index);
      setActionBusy(false);
      if (!looping) updatePlayBtn();
    },
  });
  scene.show(current);
  requestAnimationFrame(() => scene && scene.resize());
}

function openDetail(i) {
  detailOpen = true;
  $('listView').hidden = true;
  $('detailView').hidden = false;
  current = i;
  initScene();
  scene.show(i);
  refresh(i);
  setActionBusy(false);
  looping = false;
  updatePlayBtn();
  window.scrollTo(0, 0);
}

function openList() {
  detailOpen = false;
  $('detailView').hidden = true;
  $('listView').hidden = false;
  document.title = '翻绳接龙 · 两个人一根绳';
  if (scene) scene.stop();
  looping = false;
}

function route() {
  const m = location.hash.match(/^#\/f\/(\d+)/);
  if (m) openDetail(Math.min(5, Math.max(0, +m[1])));
  else openList();
}

/* ---------------- 事件 ---------------- */
$('startBtn').addEventListener('click', () => { location.hash = '#/f/0'; });

$('prevBtn').addEventListener('click', () => {
  if (busy || !scene) return;
  markBusy();
  scene.prev();
});
$('nextBtn').addEventListener('click', () => {
  if (busy || !scene) return;
  markBusy();
  scene.next();
});
$('playBtn').addEventListener('click', () => {
  if (!scene) return;
  if (looping) { scene.stop(); looping = false; }
  else { scene.play(); looping = true; }
  updatePlayBtn();
});
$('speedToggle').addEventListener('change', (e) => {
  if (scene) scene.setSpeed(e.target.checked ? 0.58 : 1);
});
$('camBtn').addEventListener('click', () => scene && scene.resetCamera());

window.addEventListener('hashchange', route);
window.addEventListener('keydown', (e) => {
  if (!detailOpen || busy || !scene) return;
  if (e.key === 'ArrowRight') { markBusy(); scene.next(); }
  if (e.key === 'ArrowLeft') { markBusy(); scene.prev(); }
});

renderList();
renderSteps();
route();
