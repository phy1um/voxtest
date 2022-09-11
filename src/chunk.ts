
// code stolen from
// https://r105.threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html 

import * as THREE from "three";
import { ReadWire, WriteWire } from "./wire";
import { CheckedBufferGeometry, ChunkPool } from "./chunkpool";

const voxelTextures = new THREE.TextureLoader().load("./img/tiles.png")
voxelTextures.magFilter = THREE.NearestFilter;
voxelTextures.minFilter = THREE.NearestFilter;

const texTileSize = 16;
const texRows = 16;
const texCols = 16;

function texU(i: number, p: number) {
  const rv = ((i%texCols + p)*texTileSize)/256;
  return rv;
}

function texV(i: number, p: number) {
  const rv = (Math.floor(i/texRows) + p)*texTileSize/256;
  return rv;
}

//function getcol(r: number, g: number, b: number) {
//  return `#${(r&0xff).toString(16)}${(g&0xff).toString(16)}${(b&0xff).toString(16)}`
//}

export const CHUNK_DIM = 16;
const CHUNK_DIM_SQ = CHUNK_DIM * CHUNK_DIM;

export function ChunkFromWire(rw: ReadWire) : Chunk {
  const cx = rw.getU32();
  rw.getU32(); // discard y
  const cz = rw.getU32();
  const ar: Array<number> = [];
  for (let i = 0; i < CHUNK_DIM_SQ * CHUNK_DIM; i++) {
    const bv = rw.getU16();
    ar.push(bv & 0xff);
  }
  return new Chunk(cx, cz, new Uint8Array(ar));
}

export function ChunkToWire(c: Chunk, w: WriteWire) : void {
  w.putU32(c.wx);
  w.putU32(0);
  w.putU32(c.wy); 
  for ( let i = 0; i < CHUNK_DIM_SQ * CHUNK_DIM; i++ ) {
    w.putU16(c.blocks[i]);
  }
  return;
}

const BPOOL = new ChunkPool(CHUNK_DIM, CHUNK_DIM, CHUNK_DIM, 30);

export class Chunk {

  wx!: number;
  wy!: number;
  blocks!: Uint8Array;
  mesh?: any;
  has_mesh!: boolean;
  geo: CheckedBufferGeometry;

  constructor(worldx: number, worldy: number, blocks: Uint8Array = new Uint8Array(CHUNK_DIM_SQ*CHUNK_DIM)) {
    this.wx = worldx;
    this.wy = worldy;
    this.blocks = blocks;
    this.has_mesh = false;
  }

  getMesh() {
    if (this.has_mesh) {
      return this.mesh;
    }

    const chunkGeo = BPOOL.alloc();
    this.geo = chunkGeo;

    const positions = chunkGeo.positionArray;
    let phead = 0;
    const normals = chunkGeo.normalArray;
    let nhead = 0;
    const texCoords = chunkGeo.uvArray;
    let thead = 0;
    const indices = chunkGeo.indexArray;
    let ihead = 0;

    for (let y = 0; y < CHUNK_DIM; ++y) {
      for (let z = 0; z < CHUNK_DIM; ++z) {
        for (let x = 0; x < CHUNK_DIM; ++x) {
          const voxel = this.get(x, y, z);
          if (voxel > 0) {
            for (const {dir, corners, uvs} of VoxelWorld.faces) {
              const neighbor = this.get(
                x + dir[0],
                y + dir[1],
                z + dir[2]);
              if (neighbor == 0) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = Math.floor(phead / 3);
                for (let i = 0; i < corners.length; i++) {
                  const pos = corners[i];
                  const uv = uvs[i];
                  positions[phead] = pos[0] + x;
                  positions[phead+1] = pos[1] + y;
                  positions[phead+2] = pos[2] + z;
                  phead += 3;

                  normals[nhead] = dir[0];
                  normals[nhead+1] = dir[1];
                  normals[nhead+2] = dir[2];
                  nhead += 3;

                  texCoords[thead] = texU(voxel, uv[0]);
                  texCoords[thead+1] = texV(voxel, uv[1]);
                  thead += 2;
                }
                /*
                indices.push(
                  ndx, ndx + 1, ndx + 2,
                  ndx + 2, ndx + 1, ndx + 3,
                );
                */
                indices[ihead] = ndx;
                indices[ihead+1] = ndx+1;
                indices[ihead+2] = ndx+2;
                indices[ihead+3] = ndx+2;
                indices[ihead+4] = ndx+1;
                indices[ihead+5] = ndx+3;
                ihead += 6;
            }
          }
        }
      }
    }
  }

    const mat = <any>new THREE.MeshLambertMaterial({side: THREE.DoubleSide, map: voxelTextures}); 
    chunkGeo.rebind(phead, nhead, thead, ihead);
    this.mesh = new THREE.Mesh(chunkGeo.geo, mat);
    this.mesh.position.set(this.wx*CHUNK_DIM, 0, this.wy*CHUNK_DIM);
    this.has_mesh = true;

    return this.mesh;
  }  

  get(x: number, y: number, z: number) {
    if (x >= 0 && x < CHUNK_DIM && y >= 0 && y < CHUNK_DIM && z >= 0 && z < CHUNK_DIM) {
      return this.blocks[x + (y * CHUNK_DIM) + (z * CHUNK_DIM_SQ)];
    } else {
      return 0;
    }
  }

  set(x: number, y: number, z: number, to: number) {
    if (x >= 0 && x < CHUNK_DIM && y >= 0 && y < CHUNK_DIM && z >= 0 && z < CHUNK_DIM) {
      this.blocks[x + (y * CHUNK_DIM) + (z * CHUNK_DIM_SQ)] = to;
    }
  }


}


type VoxelFaceSpec = {
  dir: Array<number>;
  corners: Array<Array<number>>;
  uvs: Array<Array<number>>;
}

type VoxelWorldKind = {
  faces: Array<VoxelFaceSpec>;
};

const VoxelWorld: VoxelWorldKind = {
  faces: [
    { // left
      dir: [ -1,  0,  0, ],
      corners: [
        [ 0, 1, 0 ],
        [ 0, 0, 0 ],
        [ 0, 1, 1 ],
        [ 0, 0, 1 ],
      ],
      uvs: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
    },
    { // right
      dir: [  1,  0,  0, ],
      corners: [
        [ 1, 1, 1 ],
        [ 1, 0, 1 ],
        [ 1, 1, 0 ],
        [ 1, 0, 0 ],
      ],
      uvs: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],

    },
    { // bottom
      dir: [  0, -1,  0, ],
      corners: [
        [ 1, 0, 1 ],
        [ 0, 0, 1 ],
        [ 1, 0, 0 ],
        [ 0, 0, 0 ],
      ],
      uvs: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],

    },
    { // top
      dir: [  0,  1,  0, ],
      corners: [
        [ 0, 1, 1 ],
        [ 1, 1, 1 ],
        [ 0, 1, 0 ],
        [ 1, 1, 0 ],
      ],
      uvs: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],

    },
    { // back
      dir: [  0,  0, -1, ],
      corners: [
        [ 1, 0, 0 ],
        [ 0, 0, 0 ],
        [ 1, 1, 0 ],
        [ 0, 1, 0 ],
      ],
      uvs: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],

    },
    { // front
      dir: [  0,  0,  1, ],
      corners: [
        [ 0, 0, 1 ],
        [ 1, 0, 1 ],
        [ 0, 1, 1 ],
        [ 1, 1, 1 ],
      ],
      uvs: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],

    },
  ]
};

