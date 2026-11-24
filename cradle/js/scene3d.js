import * as THREE from './vendor/three.module.js';
import {
  FIGURES, PLAYERS, HX, HAND_Y, MOVES,
  N_STRAND_CTRL, shapeWorld, worldPt,
} from './figures.js';
import { createHand } from './hand.js';
import { RopeTube, ropeMaterial, ROPE_R } from './rope.js';

const V = THREE.Vector3;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const SAMP = 76;
const K = N_STRAND_CTRL;
const WORLD_SHAPES = FIGURES.map((_, i) => shapeWorld(i));

/* 两只手的局部坐标系：手指朝上，掌心主要朝向镜头、略向中间，
   屏幕左侧的手拇指在局部 +x，右侧镜像；再各自向内倾一点，
   手指朝中间收，手臂像从画面外伸进来。 */
const UP = new V(0, 1, 0);
const PALM_N = {
  L: new V(0.34, 0, 0.94).normalize(),
  R: new V(-0.12, 0, 0.993).normalize(),
};
const THUMB_X = {
  L: UP.clone().cross(PALM_N.L),
  R: UP.clone().cross(PALM_N.R),
};
const ROLL = { L: -0.20, R: 0.20 };
const BQ = {};
['L', 'R'].forEach((side) => {
  const qb = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(THUMB_X[side], UP, PALM_N[side]),
  );
  const qr = new THREE.Quaternion().setFromAxisAngle(new V(0, 0, 1), ROLL[side]);
  BQ[side] = qb.multiply(qr);
});
const SIDE_SIGN = { L: -1, R: 1 };

export function createCradleScene(canvas, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const stage = new THREE.Group();
  scene.add(stage);

  scene.add(new THREE.HemisphereLight(0xfff2e2, 0x93a7c4, 0.72));
  const key = new THREE.DirectionalLight(0xfff2e2, 1.55);
  key.position.set(2.6, 5, 4.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdde8ff, 0.42);
  fill.position.set(-3.2, 1.2, 2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe2c4, 0.85);
  rim.position.set(-2.2, 2.6, -4.2);
  scene.add(rim);

  /* ---------------- 手 ---------------- */
  const hands = {
    A: [createHand('L', PLAYERS.A.color), createHand('R', PLAYERS.A.color)],
    B: [createHand('L', PLAYERS.B.color), createHand('R', PLAYERS.B.color)],
  };
  ['A', 'B'].forEach((p) => hands[p].forEach((h) => stage.add(h.root)));

  const WRIST_Y = worldPt(0, HAND_Y).y - 0.075;
  const holdRoot = (side, player) => new V(
    SIDE_SIGN[side] * HX * 0.78, WRIST_Y, PLAYERS[player].z,
  );
  const restRoot = (side, player) => new V(
    SIDE_SIGN[side] * 0.98, -1.95, PLAYERS[player].z + 0.02,
  );
  const _grip = new V();
  function grabRoot(side, player, targetIndex) {
    const m = MOVES[targetIndex];
    const g = side === 'L' ? m.grabL : m.grabR;
    const target = worldPt(g[0], g[1], PLAYERS[anim.giver].z + 0.02);
    _grip.copy(hands[player][side === 'L' ? 0 : 1].grip).applyQuaternion(BQ[side]);
    return target.sub(_grip);
  }

  /* ---------------- 绳 ---------------- */
  const upTube = new RopeTube(SAMP, { radial: 10 });
  const loTube = new RopeTube(SAMP, { radial: 10 });
  scene.add(upTube.mesh, loTube.mesh);

  const capGeo = new THREE.SphereGeometry(ROPE_R * 1.18, 10, 8);
  const caps = [0, 1, 2, 3].map(() => {
    const m = new THREE.Mesh(capGeo, ropeMaterial());
    scene.add(m);
    return m;
  });

  const upPts = WORLD_SHAPES[0].upper.map((p) => p.clone());
  const loPts = WORLD_SHAPES[0].lower.map((p) => p.clone());
  const upCtrl = Array.from({ length: K }, () => new V());
  const loCtrl = Array.from({ length: K }, () => new V());
  const upCurve = new THREE.CatmullRomCurve3(upCtrl, false, 'centripetal', 0.5);
  const loCurve = new THREE.CatmullRomCurve3(loCtrl, false, 'centripetal', 0.5);
  const upSample = Array.from({ length: SAMP }, () => new V());
  const loSample = Array.from({ length: SAMP }, () => new V());
  const ANC = [new V(), new V(), new V(), new V()];
  const DIR = [new V(), new V(), new V(), new V()];

  /* ---------------- 状态 ---------------- */
  let index = 0;
  let anim = null;
  let looping = false;
  let loopWait = 0;
  let speed = 1;

  /* ---------------- 相机 ---------------- */
  const CAM = { theta: 0.42, phi: 1.30, h: 1.30 };
  const camTarget = new V(0, -0.73, 0);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 80);
  let viewW = 640;
  let viewH = 480;

  function applyCamera() {
    const sp = Math.sin(CAM.phi);
    const cp = Math.cos(CAM.phi);
    camera.position.set(
      camTarget.x + 6 * sp * Math.sin(CAM.theta),
      camTarget.y + 6 * cp,
      camTarget.z + 6 * sp * Math.cos(CAM.theta),
    );
    camera.up.copy(UP);
    camera.lookAt(camTarget);
    const aspect = viewW / Math.max(1, viewH);
    camera.left = (-CAM.h * aspect) / 2;
    camera.right = (CAM.h * aspect) / 2;
    camera.top = CAM.h / 2;
    camera.bottom = -CAM.h / 2;
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth || viewW;
    const h = canvas.clientHeight || viewH;
    if (w <= 0 || h <= 0) return;
    viewW = w;
    viewH = h;
    renderer.setSize(w, h, false);
    applyCamera();
  }

  /* ---------------- 每帧手部摆位 ---------------- */
  function layout() {
    const u = anim ? anim.u : 1;
    const active = anim ? anim.taker : FIGURES[index].holder;
    const prev = anim ? anim.giver : FIGURES[index].holder;

    ['A', 'B'].forEach((p) => {
      ['L', 'R'].forEach((side, si) => {
        const hand = hands[p][si];
        let pos = restRoot(side, p);
        let pose = 'open';
        let poseFrom = 'open';
        let pk = 1;
        let brace = false;

        if (!anim || !anim.handoff) {
          if (p === active) {
            pos = holdRoot(side, p);
            pose = 'hold';
            brace = true;
          }
        } else if (p === active) {
          const rest = restRoot(side, p);
          const grab = grabRoot(side, p, anim.to);
          const hold = holdRoot(side, p);
          if (u < 0.74) {
            pos = rest.clone().lerp(grab, smooth(0.02, 0.34, u));
            pos.lerp(hold, smooth(0.36, 0.74, u));
          } else {
            pos = hold;
          }
          if (u < 0.24) {
            pose = 'open';
          } else if (u < 0.58) {
            pose = 'pinch';
            poseFrom = 'open';
            pk = smooth(0.24, 0.36, u);
          } else if (u < 0.74) {
            pose = 'hold';
            poseFrom = 'pinch';
            pk = smooth(0.58, 0.74, u);
          } else {
            pose = 'hold';
          }
          brace = u > 0.72;
        } else if (p === prev) {
          const rest = restRoot(side, p);
          const hold = holdRoot(side, p);
          if (u < 0.94) pos = hold.clone().lerp(rest, smooth(0.70, 0.94, u));
          else pos = rest;
          if (u < 0.56) pose = 'hold';
          else if (u < 0.66) {
            pose = 'open';
            poseFrom = 'hold';
            pk = smooth(0.56, 0.66, u);
          } else pose = 'open';
          brace = u < 0.76;
        }

        hand.root.position.copy(pos);
        hand.root.quaternion.copy(BQ[side]);
        hand.setPose(pose, pk, poseFrom);
        hand.bracelet.visible = brace;
      });
    });
  }

  /* ---------------- 绳的端点与形状 ---------------- */
  const _ta = [new V(), new V(), new V(), new V()];
  const _td = [new V(), new V(), new V(), new V()];

  /* ANC 顺序：左0 右0 左1 右1；DIR 是该端点绳离开手环的方向 */
  function computeAnchors() {
    let holder = FIGURES[index].holder;
    if (!anim || !anim.handoff) {
      if (anim) holder = FIGURES[anim.to].holder;
      const h = hands[holder];
      ANC[0].copy(h[0].exitWorld(0)); DIR[0].copy(h[0].exitDirWorld(0));
      ANC[1].copy(h[1].exitWorld(0)); DIR[1].copy(h[1].exitDirWorld(0));
      ANC[2].copy(h[0].exitWorld(1)); DIR[2].copy(h[0].exitDirWorld(1));
      ANC[3].copy(h[1].exitWorld(1)); DIR[3].copy(h[1].exitDirWorld(1));
      return ANC;
    }
    const t = hands[anim.taker];
    t[0].exitWorld(0, _ta[0]); t[0].exitDirWorld(0, _td[0]);
    t[1].exitWorld(0, _ta[1]); t[1].exitDirWorld(0, _td[1]);
    t[0].exitWorld(1, _ta[2]); t[0].exitDirWorld(1, _td[2]);
    t[1].exitWorld(1, _ta[3]); t[1].exitDirWorld(1, _td[3]);
    const k = smooth(0.72, 0.84, anim.u);
    for (let i = 0; i < 4; i++) {
      ANC[i].lerpVectors(anim.src[i], _ta[i], k);
      DIR[i].lerpVectors(anim.srcDir[i], _td[i], k).normalize();
    }
    return ANC;
  }

  function updateShape() {
    const from = anim ? anim.from : index;
    const to = anim ? anim.to : index;
    let t = 1;
    if (anim) t = anim.handoff ? smooth(0.40, 0.72, anim.u) : smooth(0.04, 0.92, anim.u);
    const A = WORLD_SHAPES[from];
    const B = WORLD_SHAPES[to];
    for (let i = 0; i < K; i++) {
      upPts[i].lerpVectors(A.upper[i], B.upper[i], t);
      loPts[i].lerpVectors(A.lower[i], B.lower[i], t);
    }
  }

  function updateRope() {
    updateShape();
    const a = computeAnchors();
    /* 整幅花样所在的深度平面：跟着当前持绳的人；交接时随绳一起被拉过去 */
    const holder = FIGURES[anim ? anim.from : index].holder;
    let zPlane = PLAYERS[holder].z;
    if (anim && anim.handoff) {
      zPlane += (PLAYERS[anim.taker].z - zPlane) * smooth(0.72, 0.90, anim.u);
    }
    /* 两端直接钉在虎口出绳点，中间只用花样内部的点：
       端点的切线由相邻控制点决定，绳离开手时是顺的，不会先翘再折 */
    upCtrl[0].copy(a[0]);
    loCtrl[0].copy(a[3]);
    for (let i = 1; i < K - 1; i++) {
      upCtrl[i].copy(upPts[i]);
      upCtrl[i].z += zPlane;
      loCtrl[i].copy(loPts[i]);
      loCtrl[i].z += zPlane;
    }
    upCtrl[K - 1].copy(a[1]);
    loCtrl[K - 1].copy(a[2]);
    for (let s = 0; s < SAMP; s++) {
      const t = s / (SAMP - 1);
      upCurve.getPoint(t, upSample[s]);
      loCurve.getPoint(t, loSample[s]);
    }
    upTube.update(upSample);
    loTube.update(loSample);
    caps[0].position.copy(a[0]);
    caps[1].position.copy(a[1]);
    caps[2].position.copy(a[2]);
    caps[3].position.copy(a[3]);
  }

  /* ---------------- 动作 ---------------- */
  function emitState() {
    hooks.onState?.({ animating: !!anim, loop: looping });
  }

  function finish() {
    index = anim.to;
    anim = null;
    loopWait = 1.6;
    hooks.onArrive?.({ index });
    emitState();
  }

  function startMove(target) {
    const to = ((target % FIGURES.length) + FIGURES.length) % FIGURES.length;
    if (anim || to === index) return;
    const from = index;
    const giver = FIGURES[from].holder;
    const taker = FIGURES[to].holder;
    const handoff = giver !== taker;
    scene.updateMatrixWorld(true);
    let src = null;
    let srcDir = null;
    if (handoff) {
      const g = hands[giver];
      src = [g[0].exitWorld(0), g[1].exitWorld(0), g[0].exitWorld(1), g[1].exitWorld(1)];
      srcDir = [
        g[0].exitDirWorld(0), g[1].exitDirWorld(0),
        g[0].exitDirWorld(1), g[1].exitDirWorld(1),
      ];
    }
    anim = {
      from, to, u: 0, giver, taker, handoff, src, srcDir,
      dur: handoff ? 2.6 : 1.0,
    };
    emitState();
  }

  function show(i) {
    index = clamp(i | 0, 0, FIGURES.length - 1);
    anim = null;
    loopWait = 0;
    layout();
    scene.updateMatrixWorld(true);
    updateRope();
    renderer.render(scene, camera);
  }

  /* ---------------- 交互 ---------------- */
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const onDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    CAM.theta = clamp(CAM.theta - (e.clientX - lastX) * 0.006, -1.1, 1.1);
    CAM.phi = clamp(CAM.phi - (e.clientY - lastY) * 0.005, 0.72, 1.52);
    lastX = e.clientX;
    lastY = e.clientY;
    applyCamera();
  };
  const onUp = (e) => {
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  };
  const onWheel = (e) => {
    e.preventDefault();
    CAM.h = clamp(CAM.h * (1 + e.deltaY * 0.0012), 1.08, 2.6);
    applyCamera();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  /* ---------------- 主循环 ---------------- */
  let raf = 0;
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (anim) {
      anim.u += (dt * speed) / anim.dur;
      if (anim.u >= 1) finish();
    }
    if (looping && !anim) {
      loopWait -= dt;
      if (loopWait <= 0) startMove(index + 1);
    }
    layout();
    scene.updateMatrixWorld(true);
    updateRope();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();
  applyCamera();
  layout();
  scene.updateMatrixWorld(true);
  updateRope();
  raf = requestAnimationFrame(tick);

  return {
    show,
    startMove,
    next() { startMove(index + 1); },
    prev() { startMove(index - 1); },
    play() {
      looping = true;
      loopWait = 0.5;
      emitState();
    },
    stop() {
      looping = false;
      emitState();
    },
    pause() { looping = false; emitState(); },
    resume() { looping = true; emitState(); },
    setSpeed(v) { speed = clamp(v, 0.2, 2); },
    isAnimating: () => !!anim,
    getIndex: () => index,
    resetCamera() {
      CAM.theta = 0.42;
      CAM.phi = 1.30;
      CAM.h = 1.30;
      applyCamera();
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      renderer.dispose();
    },
  };
}
