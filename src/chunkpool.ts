
import * as THREE from "three";

export class CheckedBufferGeometry {
  checkoutId: number;
  geo: THREE.BufferGeometry;
  indexArray: Uint16Array;
  positionArray: Float32Array;
  normalArray: Float32Array;
  uvArray: Float32Array;

  constructor(geo: THREE.BufferGeometry, pos, norm, uv, indexArray: Uint16Array) {
    this.geo = geo;
    this.positionArray = pos;
    this.normalArray = norm;
    this.uvArray = uv;
    this.indexArray = indexArray;
  }

  rebind(posCount: number, normCount: number, uvCount: number, indexCount: number) {
    const posSlice = this.positionArray.subarray(0, posCount);
    const normSlice = this.normalArray.subarray(0, normCount);
    const uvSlice = this.uvArray.subarray(0, uvCount);
    const indexSlice = this.indexArray.subarray(0, indexCount)
    this.geo.setAttribute('position', new THREE.BufferAttribute(posSlice, 3));
    this.geo.setAttribute('normal', new THREE.BufferAttribute(normSlice, 3));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uvSlice, 2));
    this.geo.setIndex(new THREE.BufferAttribute(indexSlice, 1));
  }
}

export class ChunkPool {

  attributePositionCount: number;
  attributePositionElems: number;
  attributeNormalCount: number;
  attributeNormalElems: number;
  attributeUVCount: number;
  attributeUVElems: number;
  indexCount: number;

  checkoutId: number;

  freePool: Array<CheckedBufferGeometry>; 
  used: Object;

  constructor(m: number, n: number, o: number, poolSize: number) {
    const degenVertCount = m * n * o;
    this.attributePositionCount = degenVertCount;
    this.attributePositionElems = 3;
    this.attributeNormalCount = degenVertCount;
    this.attributeNormalElems = 3;
    this.attributeUVCount = degenVertCount;
    this.attributeUVElems = 2;
    const degenIndexCount = 90000;
    this.indexCount = degenIndexCount;
    this.checkoutId = 17;

    this.freePool = [];
    this.used = {};

    for (let i = 0; i < poolSize; i++) {
      this.freePool.push(this.makeGeo());
    }
  }

  makeGeo(): CheckedBufferGeometry {
    const bg = new THREE.BufferGeometry();
    const pos = new Float32Array(this.attributePositionCount * this.attributePositionElems);
    const norm = new Float32Array(this.attributeNormalCount * this.attributeNormalElems);
    const uv = new Float32Array(this.attributeUVCount * this.attributeUVElems);
    const indexArray = new Uint16Array(this.indexCount);
    const c = new CheckedBufferGeometry(bg, pos, norm, uv, indexArray);
    return c;
  }

  alloc(): CheckedBufferGeometry {
    let out: CheckedBufferGeometry = this.freePool.pop();
    if (out === undefined) {
      out = this.makeGeo();
    }

    out.checkoutId = this.checkoutId;
    this.checkoutId += 1;
    this.used[out.checkoutId] = out;
    console.log(`alloc chunk ${out.checkoutId}`);
    return out;
  }

  free(c: CheckedBufferGeometry): void {
    const bg = this.used[c.checkoutId]; 
    if (bg === undefined) {
      console.error(`free: bad checkout ID: ${c.checkoutId}`);
    }
    delete this.used[c.checkoutId];
    console.log(`free chunk ${c.checkoutId}`);
    this.freePool.push(c);
  }
}
