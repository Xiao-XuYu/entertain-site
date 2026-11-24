import * as THREE from './vendor/three.module.js';

/* 绳的半径统一放这里：手环和两股绳必须一样粗才接得上 */
export const ROPE_R = 0.0206;

let _mat = null;

/* 红色棉绳材质：叠一层斜纹贴图，避免纯色管子看起来像塑料 */
export function ropeMaterial() {
  if (_mat) return _mat;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 16, 128);
  g.strokeStyle = 'rgba(110, 8, 14, 0.34)';
  g.lineWidth = 3;
  for (let y = -16; y < 136; y += 9) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(16, y + 7);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 26);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  _mat = new THREE.MeshStandardMaterial({
    map: tex, color: 0xc42f38, roughness: 0.58, metalness: 0.02,
  });
  return _mat;
}

const _t = new THREE.Vector3();
const _t0 = new THREE.Vector3();
const _t1 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _n = new THREE.Vector3();
const _b = new THREE.Vector3();

/* 固定点数的管状绳：每帧只改顶点，不重建 geometry。
   点数恒定是因为整幅花样/交接过程都靠逐点插值。 */
export class RopeTube {
  constructor(rings, { radius = ROPE_R, radial = 10, closed = false } = {}) {
    this.rings = rings;
    this.radial = radial;
    this.radius = radius;
    this.closed = closed;
    this._tan = new Float32Array(rings * 3);
    this._nrm = new Float32Array(rings * 3);

    const nv = rings * radial;
    const pos = new Float32Array(nv * 3);
    const nor = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2);
    for (let i = 0; i < rings; i++) {
      for (let k = 0; k < radial; k++) {
        const o = (i * radial + k) * 2;
        uv[o] = k / radial;
        uv[o + 1] = closed ? i / rings : i / (rings - 1);
      }
    }
    const idx = [];
    const segs = closed ? rings : rings - 1;
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % rings;
      for (let k = 0; k < radial; k++) {
        const k2 = (k + 1) % radial;
        idx.push(i * radial + k, i * radial + k2, j * radial + k2);
        idx.push(i * radial + k, j * radial + k2, j * radial + k);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.geometry = geo;
    this.mesh = new THREE.Mesh(geo, ropeMaterial());
    this.mesh.frustumCulled = false;
  }

  update(pts) {
    const R = this.rings;
    const K = this.radial;
    const rad = this.radius;
    const tan = this._tan;
    const nrm = this._nrm;

    for (let i = 0; i < R; i++) {
      const p0 = pts[this.closed ? (i + R - 1) % R : Math.max(0, i - 1)];
      const p1 = pts[this.closed ? (i + 1) % R : Math.min(R - 1, i + 1)];
      _t.subVectors(p1, p0);
      if (_t.lengthSq() < 1e-10) _t.set(0, 1, 0);
      _t.normalize();
      tan[i * 3] = _t.x;
      tan[i * 3 + 1] = _t.y;
      tan[i * 3 + 2] = _t.z;
    }

    /* 平行输运：法线沿切线逐段旋转，绳子不会自己扭起来 */
    _t.set(tan[0], tan[1], tan[2]);
    _n.set(0, 1, 0);
    if (Math.abs(_n.dot(_t)) > 0.92) _n.set(1, 0, 0);
    _n.addScaledVector(_t, -_n.dot(_t)).normalize();
    for (let i = 0; i < R; i++) {
      if (i > 0) {
        _t0.set(tan[(i - 1) * 3], tan[(i - 1) * 3 + 1], tan[(i - 1) * 3 + 2]);
        _t1.set(tan[i * 3], tan[i * 3 + 1], tan[i * 3 + 2]);
        _q.setFromUnitVectors(_t0, _t1);
        _n.applyQuaternion(_q);
        _n.addScaledVector(_t1, -_n.dot(_t1)).normalize();
      }
      nrm[i * 3] = _n.x;
      nrm[i * 3 + 1] = _n.y;
      nrm[i * 3 + 2] = _n.z;
    }

    const pos = this.geometry.attributes.position.array;
    const nor = this.geometry.attributes.normal.array;
    for (let i = 0; i < R; i++) {
      const p = pts[i];
      _t.set(tan[i * 3], tan[i * 3 + 1], tan[i * 3 + 2]);
      _n.set(nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]);
      _b.crossVectors(_t, _n).normalize();
      for (let k = 0; k < K; k++) {
        const a = (k / K) * Math.PI * 2;
        const cx = Math.cos(a);
        const sx = Math.sin(a);
        const nx = _n.x * cx + _b.x * sx;
        const ny = _n.y * cx + _b.y * sx;
        const nz = _n.z * cx + _b.z * sx;
        const o = (i * K + k) * 3;
        pos[o] = p.x + nx * rad;
        pos[o + 1] = p.y + ny * rad;
        pos[o + 2] = p.z + nz * rad;
        nor[o] = nx;
        nor[o + 1] = ny;
        nor[o + 2] = nz;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }
}
