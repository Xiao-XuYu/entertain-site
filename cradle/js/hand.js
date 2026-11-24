import * as THREE from './vendor/three.module.js';
import { ropeMaterial, ROPE_R } from './rope.js';

const SKIN = new THREE.MeshStandardMaterial({
  color: 0xefc39c, roughness: 0.62, metalness: 0,
});

const PALM_H = 0.185;
/* 整只手（含衣袖）放大倍率：手要足够大，绳圈才不会像拴在两根远处的杆子上 */
export const HAND_SCALE = 2.1;

/* 绕手一圈的绳：从虎口（拇指和食指之间）出发，斜着压过掌心，
   绕小指一侧的手缘到掌背，再回到指根下方——绳是贴着指根缠住的，
   不是松松套在手腕上。背面那一段被手掌挡住，正面看到的是“绳真的绕在指根上”。
   两个出绳点一高一低：虎口 A 高，腕背 B 低，四指绳从两个高度离开手。 */
const RING_PTS = [
  [0.060, 0.162, 0.008], // 0 出绳点 A：虎口（拇指和食指之间）
  [0.042, 0.164, 0.026], // 1 掌面：压过食指根
  [0.008, 0.154, 0.032],
  [-0.026, 0.138, 0.030],
  [-0.054, 0.118, 0.022],
  [-0.070, 0.096, 0.008], // 5 小指侧手缘
  [-0.072, 0.076, -0.010],
  [-0.056, 0.056, -0.024],
  [-0.032, 0.042, -0.030], // 8 掌背
  [-0.008, 0.030, -0.032],
  [0.012, 0.022, -0.030],
  [0.030, 0.018, -0.026],
  [0.044, 0.024, -0.018], // 12 出绳点 B：腕背（低）
  [0.052, 0.050, -0.024], // 13 折回掌背一侧（被手挡住）
  [0.058, 0.090, -0.026],
  [0.060, 0.130, -0.022],
  [0.058, 0.156, -0.014], // 16 沿拇指根背面回到虎口
];
const EXIT_A = 0;
const EXIT_B = 12;

/* 四指：根部位置、分节长度、粗细、张开角度（局部 +x 是拇指一侧）
   手指并拢、只有很小的一点张开，才像一只手而不是叉子 */
const FINGERS = [
  { x: 0.049, segs: [0.070, 0.047, 0.035], r: 0.0162, fan: -0.03 },
  { x: 0.017, segs: [0.076, 0.051, 0.038], r: 0.0168, fan: 0.00 },
  { x: -0.015, segs: [0.071, 0.048, 0.035], r: 0.0160, fan: 0.025 },
  { x: -0.045, segs: [0.059, 0.040, 0.030], r: 0.0144, fan: 0.055 },
];

const OPEN_F = [
  [0.07, 0.10, 0.10],
  [0.06, 0.09, 0.09],
  [0.08, 0.11, 0.10],
  [0.10, 0.13, 0.12],
];
const HOLD_F = [
  [0.26, 0.40, 0.26],
  [0.28, 0.44, 0.28],
  [0.30, 0.46, 0.28],
  [0.34, 0.50, 0.30],
];
const PINCH_F = [
  [0.58, 0.82, 0.48],
  [0.50, 0.72, 0.44],
  [0.36, 0.52, 0.32],
  [0.40, 0.56, 0.34],
];
const POSES = {
  open: { f: OPEN_F, t: [0.14, 0.22] },
  hold: { f: HOLD_F, t: [0.48, 0.38] },
  pinch: { f: PINCH_F, t: [0.66, 0.42] },
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

const phalanxCache = new Map();
/* 指节用圆柱，接缝交给关节球盖住：
   比“胶囊一节节叠起来”干净，弯曲时不会露出珠串或套筒边 */
function phalanxGeo(r, len) {
  const key = `${r.toFixed(4)}:${len.toFixed(4)}`;
  if (!phalanxCache.has(key)) {
    phalanxCache.set(key, new THREE.CylinderGeometry(r * 0.97, r, len, 16, 1));
  }
  return phalanxCache.get(key);
}

/* 两股绳离开虎口的方向（现在主要由花样控制点决定，
   这里只留一个大致方向给外部参考） */
const DIR_A = new THREE.Vector3(0.86, -0.34, 0.14).normalize();
const DIR_B = new THREE.Vector3(0.90, 0.30, 0.16).normalize();

/* side: 'L' 屏幕左侧的手（拇指在局部 +x），'R' 屏幕右侧（镜像） */
export function createHand(side, colorHex) {
  const mx = side === 'L' ? 1 : -1;
  const root = new THREE.Group();
  root.scale.setScalar(HAND_SCALE);

  /* 掌心：圆角矩形轮廓的胶囊体，前后略鼓，边缘圆润 */
  const palmGeo = new THREE.CapsuleGeometry(1, 1.6, 8, 28);
  palmGeo.scale(0.072, 0.0514, 0.025);
  const palm = new THREE.Mesh(palmGeo, SKIN);
  palm.position.set(0, 0.086, 0);
  root.add(palm);
  /* 拇指垫 + 小鱼际 + 腕部：都嵌在掌心轮廓里，只露出一点肉感，不鼓成瘤 */
  blob(root, 0.030, 0.042, 0.024, 0.036, 0.070, 0.004);
  blob(root, 0.025, 0.040, 0.022, -0.048, 0.056, 0.004);
  blob(root, 0.050, 0.038, 0.030, 0, 0.006, -0.002);
  /* 掌根到腕的过渡，别让手掌像一块板 */
  blob(root, 0.042, 0.028, 0.026, 0.004 * mx, -0.020, -0.004);

  /* 掌骨头：埋进掌心，只让掌面有一点点起伏 */
  FINGERS.forEach((def) => {
    blob(root, def.r * 1.02, def.r * 0.85, def.r * 1.0,
      def.x * mx, PALM_H - 0.046, 0.0);
  });

  /* 小臂 + 袖口；小臂要够粗，不然大手掌像插在棍子上 */
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.058, 0.30, 20), SKIN);
  arm.position.set(0.004 * mx, -0.165, -0.006);
  root.add(arm);

  const cuffMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.62 });
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.060, 20), cuffMat);
  cuff.position.set(0.003 * mx, -0.296, -0.005);
  root.add(cuff);

  const fingerJoints = [];
  FINGERS.forEach((def) => {
    const base = new THREE.Group();
    base.position.set(def.x * mx, PALM_H - 0.024, 0.002);
    base.rotation.z = def.fan * mx;
    root.add(base);
    let parent = base;
    const joints = [];
    def.segs.forEach((len, s) => {
      const rr = def.r * (1 - 0.045 * s);
      const seg = new THREE.Mesh(phalanxGeo(rr, len), SKIN);
      seg.position.y = len / 2;
      parent.add(seg);
      if (s === def.segs.length - 1) {
        /* 指尖用半球收口 */
        blob(parent, rr, rr, rr, 0, len - rr * 0.18, 0);
      }
      const joint = new THREE.Group();
      joint.position.y = len;
      parent.add(joint);
      /* 指节只补一个小球填缝，比指节粗就会变成一串珠子 */
      blob(joint, rr * 1.01, rr * 1.01, rr * 1.01, 0, 0, 0);
      joints.push(joint);
      parent = joint;
    });
    fingerJoints.push(joints);
  });

  /* 拇指：从掌侧斜着伸向虎口，和食指之间留出绳穿过的凹口 */
  const thumbBase = new THREE.Group();
  thumbBase.position.set(0.052 * mx, 0.056, 0.014);
  thumbBase.rotation.z = -0.46 * mx;
  thumbBase.rotation.x = 0.18;
  root.add(thumbBase);
  blob(thumbBase, 0.024, 0.030, 0.021, 0, 0.004, 0);
  const thumbJoints = [];
  let tp = thumbBase;
  [0.062, 0.050].forEach((len, s) => {
    const rr = s === 0 ? 0.0194 : 0.0166;
    const seg = new THREE.Mesh(phalanxGeo(rr, len), SKIN);
    seg.position.y = len / 2;
    tp.add(seg);
    if (s === 1) blob(tp, rr, rr, rr, 0, len - rr * 0.18, 0);
    const joint = new THREE.Group();
    joint.position.y = len;
    tp.add(joint);
    if (s === 0) blob(joint, rr * 0.99, rr * 0.99, rr * 0.99, 0, 0, 0);
    thumbJoints.push(joint);
    tp = joint;
  });

  /* 绕手一圈的闭合绳 */
  const ringPts = RING_PTS.map(([x, y, z]) => new THREE.Vector3(x * mx, y, z));
  const ringCurve = new THREE.CatmullRomCurve3(ringPts, true, 'centripetal');
  const bracelet = new THREE.Mesh(
    new THREE.TubeGeometry(ringCurve, 220, ROPE_R / HAND_SCALE, 10, true),
    ropeMaterial(),
  );
  bracelet.frustumCulled = false;
  root.add(bracelet);

  const exits = [ringPts[EXIT_A], ringPts[EXIT_B]];
  const dirs = [
    new THREE.Vector3(DIR_A.x * mx, DIR_A.y, DIR_A.z),
    new THREE.Vector3(DIR_B.x * mx, DIR_B.y, DIR_B.z),
  ];

  return {
    side,
    mx,
    root,
    bracelet,
    exits,
    dirs,
    grip: new THREE.Vector3(0.02, 0.155, 0.046),

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
