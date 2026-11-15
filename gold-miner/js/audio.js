// 游戏音效:全用 Web Audio 合成,零外部文件,离线可用 (Kindle 兼容 webkitAudioContext)。
// due to 自动播放策略,AudioContext 在首次用户交互时才解锁 (见 input.js / main.js)。
var G = window.G = window.G || {};

if (!G._audioInit) {
G._audioInit = true;

var _actx = null;
function _ensure() {
  if (!_actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      try { _actx = new AC(); } catch (e) { _actx = null; }
    }
  }
  if (_actx && _actx.state === 'suspended') { _actx.resume(); }
  return _actx;
}

// 合上一个振荡音符: 从 f0 滑到 f1,带起音/衰减包络
function _tone(opts) {
  var a = _ensure();
  if (!a) return;
  var t0 = a.currentTime + (opts.delay || 0);
  var osc = a.createOscillator();
  var gain = a.createGain();
  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(opts.f0, t0);
  if (opts.f1 && opts.f1 !== opts.f0) {
    osc.frequency.exponentialRampToValueAtTime(opts.f1, t0 + opts.dur);
  }
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(opts.vol || 0.2, t0 + (opts.attack || 0.008));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(gain);
  gain.connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

G.audio = {
  unlock: _ensure,
  // 诊断/测试用:是否已初始化 AudioContext 及当前状态
  ready: function () { return _actx ? _actx.state : 'no-ctx'; },
  sfx: {
    // 发射:短促上扬 whoosh
    launch: function () {
      _tone({ type: 'triangle', f0: 140, f1: 520, dur: 0.28, vol: 0.22 });
    },
    // 抓到金块:明亮两声 "叮"
    hitGold: function () {
      _tone({ type: 'sine', f0: 660, f1: 880, dur: 0.16, vol: 0.25 });
      _tone({ type: 'sine', f0: 990, dur: 0.18, vol: 0.16, delay: 0.04 });
    },
    // 抓到动物:柔和短促 "咚"
    hitAnimal: function () {
      _tone({ type: 'triangle', f0: 330, f1: 240, dur: 0.12, vol: 0.22 });
    },
    // 抓到钻石:清脆琶音闪耀
    hitDiamond: function () {
      var notes = [1046, 1318, 1568, 2093];
      for (var i = 0; i < notes.length; i++) {
        _tone({ type: 'sine', f0: notes[i], dur: 0.2, vol: 0.13, delay: i * 0.06 });
      }
    },
    // 得分结算:上行大三和弦
    collect: function () {
      var notes = [523, 659, 784];
      for (var i = 0; i < notes.length; i++) {
        _tone({ type: 'triangle', f0: notes[i], dur: 0.18, vol: 0.2, delay: i * 0.07 });
      }
    },
    // 空钩没抓到落地
    miss: function () {
      _tone({ type: 'sine', f0: 200, f1: 120, dur: 0.18, vol: 0.2 });
    },
    // 最后 10 秒倒计时警告
    tick: function () {
      _tone({ type: 'square', f0: 880, dur: 0.08, vol: 0.08 });
    }
  }
};

}