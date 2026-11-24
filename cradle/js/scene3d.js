import * as THREE from './vendor/three.module.js';
import { FIGURES, MOVES, PLAYERS, HX, HOLD, REST, buildLoop } from './figures.js';

const V = THREE.Vector3;
const LOOPS = FIGURES.map((_, i) => buildLoop(i));

/* 绳子整体缩放与下移，让手停在胸口高度，位于两个小朋友之间 */
const SS = 0.78;
const YS = 1.35;   // 花样数据偏扁，纵向拉高一点更好认
const SY = -1.134;
const worldPt = (v, zoff) => new V(v.x * SS, v.y * SS * YS + SY, v.z + zoff);

const SKIN = new THREE.MeshStandardMaterial({ color: 0xf4cba6, roughness: 0.9, flatShading: true });
const SKIN_D = new THREE.MeshStandardMaterial({ color: 0xe0ab82, roughness: 0.9, flatShading: true });
const EYE = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 });
const STRING = new THREE.MeshStandardMaterial({ color: 0xd4373f, roughness: 0.55, metalness: 0.05 });
const MARK = new THREE.MeshBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.55, side: THREE.DoubleSide });

function makeHand(side, color) {
  const g = new THREE.Group();
  const inner = -side;
  void color;

  /* 腕部小球把前臂和手掌接上，避免手像浮在小臂外面 */
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.046, 10, 8), SKIN));

  /* 手掌略微后移、手指向前弯，绳正好夹在掌心和指尖之间 */
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), SKIN);
  palm.scale.set(1.0, 1.2, 0.5);
  palm.position.set(0, 0, -0.038);
  g.add(palm);

  const fingers = [];
  const xs = [0.049, 0.017, -0.017, -0.049];
  const lens = [0.07, 0.084, 0.076, 0.062];
  for (let i = 0; i < 4; i++) {
    const fg = new THREE.Group();
    fg.position.set(inner * xs[i], 0.052, -0.024);
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0175, lens[i], 3, 7), SKIN);
    f.position.y = lens[i] / 2 + 0.015;
    fg.add(f);
    g.add(fg);
    fingers.push(fg);
  }
  const thumb = new THREE.Group();
  thumb.position.set(inner * 0.072, -0.01, 0.012);
  thumb.rotation.z = inner * 0.8;
  const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.05, 3, 7), SKIN_D);
  th.position.y = 0.04;
  thumb.add(th);
  g.add(thumb);

  g.userData.pose = (p) => {
    fingers.forEach((f, i) => { f.rotation.x = 0.35 + p * (i === 0 ? 2.0 : 1.8); });
    thumb.rotation.z = inner * (0.8 + p * 0.35);
    thumb.rotation.x = p * 0.5;
  };
  return g;
}

function makeKid(color, z, faceDir) {
  const g = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.235, 0.44, 4, 10), cloth);
  torso.position.y = -0.92;
  torso.scale.z = 0.78;
  g.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8), SKIN);
  neck.position.y = -0.44;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), SKIN);
  head.position.set(0, -0.21, 0);
  head.scale.set(1, 0.97, 0.97);
  g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.207, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
    new THREE.MeshStandardMaterial({ color: 0x3a3129, roughness: 1, flatShading: true }),
  );
  hair.position.copy(head.position);
  hair.rotation.x = -0.26;
  g.add(hair);
  if (faceDir) {
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 6), EYE);
      e.position.set(s * 0.067, -0.228, faceDir * 0.174);
      g.add(e);
    }
    // 腮红
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(
        new THREE.CircleGeometry(0.028, 10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 }),
      );
      b.position.set(s * 0.108, -0.272, faceDir * 0.165);
      b.rotation.y = faceDir * 0.9;
      g.add(b);
    }
  }
  const shoulders = [new V(-0.235, -0.52, z), new V(0.235, -0.52, z)];
  g.position.z = z;
  return { group: g, shoulders };
}

function makeArm(color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 1, 3, 9), mat);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 1, 3, 9), SKIN);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), SKIN);
  return { upper, fore, joint };
}

function setSegment(mesh, a, b) {
  const d = new V().subVectors(b, a);
  const len = Math.max(0.01, d.length());
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new V(0, 1, 0), d.clone().normalize());
  mesh.scale.y = len / 1.1;
}

/* 两段手臂：肩膀→肘→手，肘部向外下方弯，避免直筒感 */
const ARM = 0.55;
function solveArm(arm, sh, hand, side) {
  const d = new V().subVectors(hand, sh);
  const dl = Math.min(d.length(), ARM * 2 - 0.005);
  const dir = d.clone().normalize();
  const h = Math.sqrt(Math.max(0, ARM * ARM - (dl / 2) * (dl / 2)));
  const pref = new V(side * 0.55, -1, 0.15).normalize();
  const perp = pref.clone().addScaledVector(dir, -pref.dot(dir));
  if (perp.lengthSq() < 1e-6) perp.set(0, -1, 0);
  perp.normalize();
  const elbow = sh.clone().addScaledVector(dir, dl / 2).addScaledVector(perp, h);
  setSegment(arm.upper, sh, elbow);
  setSegment(arm.fore, elbow, hand);
  arm.joint.position.copy(elbow);
}

const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerpV = (a, b, t) => new V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

export function createCradleScene(canvas, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0xf3efe6, 1);

  const scene = new THREE.Scene();
  /* 正交投影：两个小朋友不会一大一小，绳子两端也不会因为远近在画面上错开 */
  const camera = new THREE.OrthographicCamera(-1.3, 1.3, 1, -1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6ccbc, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(2.4, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.65);
  fill.position.set(-3, 1.5, -2.5);
  scene.add(fill);

  // 两个小朋友
  const kidA = makeKid(PLAYERS.A.color, 0.85, -1);
  const kidB = makeKid(PLAYERS.B.color, -0.85, 1);
  scene.add(kidA.group, kidB.group);

  const hands = {
    A: [makeHand(-1, PLAYERS.A.color), makeHand(1, PLAYERS.A.color)],
    B: [makeHand(-1, PLAYERS.B.color), makeHand(1, PLAYERS.B.color)],
  };
  const arms = {
    A: [makeArm(PLAYERS.A.color), makeArm(PLAYERS.A.color)],
    B: [makeArm(PLAYERS.B.color), makeArm(PLAYERS.B.color)],
  };
  for (const k of ['A', 'B']) {
    hands[k].forEach(h => scene.add(h));
    arms[k].forEach(a => scene.add(a.upper, a.fore, a.joint));
  }

  // 绳子
  const stringMesh = new THREE.Mesh(new THREE.BufferGeometry(), STRING);
  scene.add(stringMesh);

  // 抓取提示
  const markers = [makeMarker(), makeMarker()];
  markers.forEach(m => scene.add(m));

  const HY = HOLD[0][1] * SS * YS + SY;
  const HOLD_V = (k) => [new V(-HX * SS, HY, PLAYERS[k].z), new V(HX * SS, HY, PLAYERS[k].z)];
  /* 空着的手垂在大腿两侧、位置更低：绳子最低点以上都是“在绳上”，以下才是“空手” */
  const REST_V = (k) => {
    const z = (k === 'A' ? 1 : -1) * 0.78;
    return [new V(-0.44, -1.17, z), new V(0.44, -1.17, z)];
  };

  let current = 0;
  let anim = null;          // {from,to,dur,t}
  let loop = false;
  let paused = false;
  let speed = 1;
  let wait = 0;             // 自动连播的停顿
  let time = 0;
  let holdPose = 0;

  // 相机
  let camTheta = 1.08, camPhi = 1.55, camR = 4.2, camH = 1.95;
  const target = new V(0, -0.66, 0);
  function placeCamera() {
    camera.position.set(
      target.x + camR * Math.sin(camPhi) * Math.sin(camTheta),
      target.y + camR * Math.cos(camPhi),
      target.z + camR * Math.sin(camPhi) * Math.cos(camTheta),
    );
    camera.lookAt(target);
  }
  function applyFrustum() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const a = w / h;
    camera.left = -camH * a / 2;
    camera.right = camH * a / 2;
    camera.top = camH / 2;
    camera.bottom = -camH / 2;
    camera.updateProjectionMatrix();
  }
  placeCamera();
  applyFrustum();

  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    camTheta -= (e.clientX - lastX) * 0.007;
    camPhi = Math.min(1.57, Math.max(0.55, camPhi - (e.clientY - lastY) * 0.006));
    lastX = e.clientX; lastY = e.clientY;
    placeCamera();
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camH = Math.min(3.4, Math.max(1.25, camH * (1 + e.deltaY * 0.0012)));
    applyFrustum();
  }, { passive: false });

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    applyFrustum();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function buildString(pts) {
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
    const geo = new THREE.TubeGeometry(curve, 320, 0.02, 7, true);
    stringMesh.geometry.dispose();
    stringMesh.geometry = geo;
  }

  function setHands(k, left, right, pose) {
    hands[k][0].position.copy(left);
    hands[k][1].position.copy(right);
    hands[k][0].userData.pose(pose);
    hands[k][1].userData.pose(pose);
  }

  function settle() {
    const h = FIGURES[current].holder;
    const other = h === 'A' ? 'B' : 'A';
    const hp = HOLD_V(h), rp = REST_V(other);
    setHands(h, hp[0], hp[1], 0);
    setHands(other, rp[0], rp[1], 0);
    buildString(LOOPS[current].map(v => worldPt(v, PLAYERS[h].z)));
    markers.forEach(m => { m.visible = false; });
  }

  function startMove(to, dur) {
    if (to === current) return false;
    anim = { from: current, to, dur: dur || 2.6, t: 0 };
    wait = 0;
    paused = false;
    emit();
    return true;
  }

  function next(dur) { return startMove((current + 1) % FIGURES.length, dur); }
  function prev(dur) { return startMove((current + FIGURES.length - 1) % FIGURES.length, dur); }

  function show(i) {
    current = i;
    anim = null;
    wait = 0;
    settle();
    emit();
  }

  function emit() {
    if (hooks.onState) hooks.onState({ index: current, animating: !!anim, loop, paused, speed });
  }

  function updateMove(dt) {
    anim.t += dt * speed;
    const u = Math.min(1, anim.t / anim.dur);
    const f = anim.from, g = anim.to;
    const giver = FIGURES[f].holder;
    const taker = FIGURES[g].holder;
    const gp = HOLD_V(giver), tr = REST_V(taker);
    const grab = [
      worldPt({ x: MOVES[f].grabL[0], y: MOVES[f].grabL[1], z: 0 }, PLAYERS[giver].z),
      worldPt({ x: MOVES[f].grabR[0], y: MOVES[f].grabR[1], z: 0 }, PLAYERS[giver].z),
    ];
    const th = HOLD_V(taker);

    let tl, trr, gl, gr, tp;
    if (u < 0.30) {
      const k = ease(u / 0.30);
      tl = lerpV(tr[0], grab[0], k); trr = lerpV(tr[1], grab[1], k);
      tp = ease((u - 0.14) / 0.16);
    } else if (u < 0.40) {
      tl = grab[0].clone(); trr = grab[1].clone(); tp = 1;
    } else if (u < 0.88) {
      const k = ease((u - 0.40) / 0.48);
      tl = lerpV(grab[0], th[0], k); trr = lerpV(grab[1], th[1], k);
      tp = 1 - 0.65 * ease((u - 0.55) / 0.33);
    } else {
      tl = th[0].clone(); trr = th[1].clone(); tp = 0;
    }
    if (u < 0.40) { gl = gp[0].clone(); gr = gp[1].clone(); }
    else { const k = ease((u - 0.40) / 0.5); gl = lerpV(gp[0], REST_V(giver)[0], k); gr = lerpV(gp[1], REST_V(giver)[1], k); }

    setHands(taker, tl, trr, tp);
    setHands(giver, gl, gr, 0);

    const mk = ease((u - 0.36) / 0.46);
    const zOff = PLAYERS[giver].z + (PLAYERS[taker].z - PLAYERS[giver].z) * mk;
    const a = LOOPS[f], b = LOOPS[g];
    const pts = a.map((p, i) => lerpV(p, b[i], mk));
    pts.forEach(p => { p.x *= SS; p.y = p.y * SS * YS + SY; p.z += zOff; });
    buildString(pts);

    const showMark = u > 0.04 && u < 0.46;
    markers.forEach((m, i) => {
      m.visible = showMark;
      if (showMark) {
        m.position.copy(grab[i]);
        const pulse = 0.75 + Math.sin(time * 9 + i * 2) * 0.18;
        m.scale.setScalar(pulse);
      }
    });

    if (u >= 1) {
      current = g;
      anim = null;
      holdPose = 0;
      settle();
      if (loop) wait = 1.0;
      if (hooks.onArrive) hooks.onArrive({ index: current });
      emit();
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (anim) {
      updateMove(dt);
    } else if (wait > 0 && !paused) {
      wait -= dt;
      if (wait <= 0 && loop) { startMove((current + 1) % FIGURES.length); }
    }
    for (const k of ['A', 'B']) {
      const sh = k === 'A' ? kidA.shoulders : kidB.shoulders;
      for (let i = 0; i < 2; i++) solveArm(arms[k][i], sh[i], hands[k][i].position, i === 0 ? -1 : 1);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  settle();
  requestAnimationFrame(frame);

  return {
    show,
    startMove,
    next,
    prev,
    play() { loop = true; paused = false; wait = 0; if (!anim) startMove((current + 1) % FIGURES.length); emit(); },
    stop() { loop = false; wait = 0; emit(); },
    pause() { paused = true; emit(); },
    resume() { paused = false; emit(); },
    setSpeed(s) { speed = s; emit(); },
    isAnimating: () => !!anim,
    getIndex: () => current,
    resetCamera() { camTheta = 1.08; camPhi = 1.55; camR = 4.2; camH = 1.95; placeCamera(); applyFrustum(); },
    resize,
    dispose() {
      ro.disconnect();
      renderer.dispose();
      stringMesh.geometry.dispose();
    },
  };
}

function makeMarker() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 24), MARK);
  g.add(ring);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), MARK);
  g.add(dot);
  g.visible = false;
  return g;
}
