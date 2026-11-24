import * as THREE from './vendor/three.module.js';
import { ropeMaterial, ROPE_R } from './rope.js';

const SKIN = new THREE.MeshStandardMaterial({
  color: 0xefc39c, roughness: 0.62, metalness: 0,
});
const NAIL = new THREE.MeshStandardMaterial({ color: 0xf7dcc4, roughness: 0.5 });

const PALM_H = 0.185;

/* 绕手一圈的绳：两股绳分别从虎口上、下沿钻出掌外，正面看不到任何连接段，
   其余绳圈全部埋在掌体内部（等于绕到手掌背面，被手挡住）。
   这样虎口处只会读成“绳从手后面绕出来”，不会读成在手上打了个结。 */
const RING_PTS = [
  [0.058, 0.151, 0.004], // 0 虎口上端（食指侧）出绳点
  [0.050, 0.147, 0.000], // 1 立刻折进掌内，正面看不见
  [0.045, 0.1435, -0.002],
  [0.050, 0.140, 0.000],
  [0.060, 0.136, 0.003], // 4 虎口下端（拇指侧）出绳点
  [0.052, 0.129, -0.004], // 以下全部埋进掌内
  [0.040, 0.122, -0.007],
  [0.026, 0.116, -0.008],
  [0.012, 0.113, -0.007],
  [0.000, 0.117, -0.005],
  [-0.002, 0.128, -0.003],
  [0.006, 0.138, -0.001],
  [0.018, 0.145, 0.000],
  [0.032, 0.150, 0.001],
  [0.044, 0.152, 0.002],
];
const EXIT_A = 0;
const EXIT_B = 4;

/* 四指：根部位置、分节长度、粗细、张开角度（局部 +x 是拇指一侧） */
const FINGERS = [
  { x: 0.052, segs: [0.049, 0.036, 0.027], r: 0.0168, fan: -0.10 },
  { x: 0.019, segs: [0.054, 0.039, 0.029], r: 0.0176, fan: -0.03 },
  { x: -0.015, segs: [0.051, 0.037, 0.027], r: 0.0166, fan: 0.04 },
  { x: -0.048, segs: [0.043, 0.032, 0.023], r: 0.0148, fan: 0.11 },
];

const OPEN_F = [
  [0.05, 0.08, 0.10],
  [0.05, 0.08, 0.10],
  [0.06, 0.09, 0.11],
  [0.08, 0.11, 0.13],
];
const HOLD_F = [
  [0.22, 0.34, 0.26],
  [0.24, 0.38, 0.28],
  [0.26, 0.40, 0.28],
  [0.30, 0.44, 0.30],
];
const PINCH_F = [
  [0.55, 0.78, 0.48],
  [0.48, 0.70, 0.44],
  [0.34, 0.50, 0.32],
  [0.38, 0.54, 0.34],
];
const POSES = {
  open: { f: OPEN_F, t: [0.16, 0.24] },
  hold: { f: HOLD_F, t: [0.52, 0.42] },
  pinch: { f: PINCH_F, t: [0.68, 0.44] },
};

const sphereGeo = new THREE.SphereGeometry(1, 20, 16);

/* 用比例化的球体拼出手掌的肉感：掌心、拇指垫、小鱼际、手腕 */
function blob(parent, sx, sy, sz, x, y, z, mat = SKIN) {
  const m = new THREE.Mesh(sphereGeo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}

const capsuleGeoCache = new Map();
function capsuleGeo(r, len) {
  const key = `${r.toFixed(4)}:${len.toFixed(4)}`;
  if (!capsuleGeoCache.has(key)) {
    capsuleGeoCache.set(key, new THREE.CapsuleGeometry(r, Math.max(0.002, len - r * 2), 4, 12));
  }
  return capsuleGeoCache.get(key);
}

/* 两股绳离开虎口的方向（现在主要由花样控制点决定，
   这里只留一个大致方向给外部参考） */
function exitDir(mx) {
  return new THREE.Vector3(0.86 * mx, 0.30, -0.10).normalize();
}

/* side: 'L' 屏幕左侧的手（拇指在局部 +x），'R' 屏幕右侧（镜像） */
export function createHand(side, colorHex) {
  const mx = side === 'L' ? 1 : -1;
  const root = new THREE.Group();

  /* 掌心：圆角矩形轮廓的胶囊体，前后略鼓，边缘圆润 */
  const palmGeo = new THREE.CapsuleGeometry(1, 1.6, 8, 28);
  palmGeo.scale(0.070, 0.0514, 0.026);
  const palm = new THREE.Mesh(palmGeo, SKIN);
  palm.position.set(0, 0.086, 0);
  root.add(palm);
  /* 拇指垫 + 小鱼际 */
  blob(root, 0.032, 0.046, 0.026, 0.038, 0.072, 0.008);
  blob(root, 0.026, 0.040, 0.023, -0.048, 0.058, 0.006);
  /* 手腕：把掌根和手臂接顺 */
  blob(root, 0.050, 0.036, 0.030, 0, 0.008, -0.004);

  /* 小臂 + 袖口；袖口收在小臂末端，让手臂像从画面外伸进来 */
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.050, 0.30, 20), SKIN);
  arm.position.set(0.004 * mx, -0.155, -0.006);
  root.add(arm);

  const cuffMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.62 });
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.060, 20), cuffMat);
  cuff.position.set(0.003 * mx, -0.296, -0.005);
  root.add(cuff);

  const fingerJoints = [];
  FINGERS.forEach((def) => {
    const base = new THREE.Group();
    base.position.set(def.x * mx, PALM_H - 0.018, 0.002);
    base.rotation.z = def.fan * mx;
    root.add(base);
    /* 指根关节的鼓包 */
    blob(base, def.r * 1.22, def.r * 1.05, def.r * 1.15, 0, 0, 0);
    let parent = base;
    const joints = [];
    def.segs.forEach((len, s) => {
      const rr = def.r * (1 - 0.06 * s);
      const seg = new THREE.Mesh(capsuleGeo(rr, len), SKIN);
      seg.position.y = len / 2;
      parent.add(seg);
      if (s === def.segs.length - 1) {
        /* 指甲在手指背面（-z），收在指尖里不发亮 */
        const nail = blob(parent, rr * 0.66, rr * 0.86, rr * 0.36,
          0, len - rr * 0.75, -rr * 0.72, NAIL);
        nail.scale.z = rr * 0.36;
      }
      const joint = new THREE.Group();
      joint.position.y = len;
      parent.add(joint);
      /* 指节鼓包 */
      blob(joint, rr * 1.12, rr * 1.0, rr * 1.05, 0, 0, 0);
      joints.push(joint);
      parent = joint;
    });
    fingerJoints.push(joints);
  });

  /* 拇指：从掌侧斜着伸向虎口，和食指之间留出绳穿过的凹口 */
  const thumbBase = new THREE.Group();
  thumbBase.position.set(0.054 * mx, 0.068, 0.016);
  thumbBase.rotation.z = -0.66 * mx;
  thumbBase.rotation.x = 0.30;
  root.add(thumbBase);
  blob(thumbBase, 0.024, 0.026, 0.022, 0, 0, 0);
  const thumbJoints = [];
  let tp = thumbBase;
  [0.052, 0.044].forEach((len, s) => {
    const rr = s === 0 ? 0.0175 : 0.0150;
    const seg = new THREE.Mesh(capsuleGeo(rr, len), SKIN);
    seg.position.y = len / 2;
    tp.add(seg);
    const joint = new THREE.Group();
    joint.position.y = len;
    tp.add(joint);
    if (s === 0) blob(joint, rr * 1.1, rr * 1.0, rr * 1.05, 0, 0, 0);
    thumbJoints.push(joint);
    tp = joint;
  });

  /* 绕手一圈的闭合绳（只在虎口露出一段） */
  const ringPts = RING_PTS.map(([x, y, z]) => new THREE.Vector3(x * mx, y, z));
  const ringCurve = new THREE.CatmullRomCurve3(ringPts, true, 'centripetal');
  const bracelet = new THREE.Mesh(
    new THREE.TubeGeometry(ringCurve, 200, ROPE_R, 10, true),
    ropeMaterial(),
  );
  bracelet.frustumCulled = false;
  root.add(bracelet);

  const exits = [ringPts[EXIT_A], ringPts[EXIT_B]];
  const dirs = [exitDir(mx), exitDir(mx)];

  return {
    side,
    mx,
    root,
    bracelet,
    exits,
    dirs,
    grip: new THREE.Vector3(0.02, 0.155, 0.050),

    /* 从 fromName 姿势向 name 姿势过渡，k∈[0,1] */
    setPose(name, k = 1, fromName = 'open') {
      const a = POSES[fromName] || POSES.open;
      const b = POSES[name] || POSES.open;
      for (let i = 0; i < fingerJoints.length; i++) {
        for (let j = 0; j < 3; j++) {
          const v0 = a.f[i][j];
          fingerJoints[i][j].rotation.x = v0 + (b.f[i][j] - v0) * k;
        }
      }
      thumbJoints[0].rotation.x = a.t[0] + (b.t[0] - a.t[0]) * k;
      thumbJoints[1].rotation.x = a.t[1] + (b.t[1] - a.t[1]) * k;
    },

    exitWorld(i, out = new THREE.Vector3()) {
      out.copy(this.exits[i]).applyMatrix4(this.root.matrixWorld);
      return out;
    },

    /* 绳从手环离开的方向（世界空间，单位向量） */
    exitDirWorld(i, out = new THREE.Vector3()) {
      out.copy(dirs[i]).applyQuaternion(this.root.quaternion);
      return out;
    },

    gripWorld(out = new THREE.Vector3()) {
      out.copy(this.grip).applyMatrix4(this.root.matrixWorld);
      return out;
    },
  };
}
