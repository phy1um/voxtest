
// code stolen from
// https://r105.threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html 

import * as THREE from "three";

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

export class Chunk {

  wx!: number;
  wy!: number;
  blocks!: Uint8Array;
  mesh?: any;
  has_mesh!: boolean;

  constructor(worldx: number, worldy: number) {
    this.wx = worldx;
    this.wy = worldy;
    this.blocks = new Uint8Array(CHUNK_DIM*CHUNK_DIM*CHUNK_DIM);
    this.has_mesh = false;
  }

  getMesh() {
    if (this.has_mesh) {
      return this.mesh;
    }

    const positions = [];
    const normals = [];
    const indices = [];
    const texCoords = [];
    const startX = 0;
    const startY = 0;
    const startZ = 0;
 
    for (let y = 0; y < CHUNK_DIM; ++y) {
      const voxelY = startY + y;
      for (let z = 0; z < CHUNK_DIM; ++z) {
        const voxelZ = startZ + z;
        for (let x = 0; x < CHUNK_DIM; ++x) {
          const voxelX = startX + x;
          const voxel = this.get(voxelX, voxelY, voxelZ);
          if (voxel > 0) {
            for (const {dir, corners, uvs} of VoxelWorld.faces) {
              const neighbor = this.get(
                voxelX + dir[0],
                voxelY + dir[1],
                voxelZ + dir[2]);
              if (!neighbor) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (let i = 0; i < corners.length; i++) {
                  const pos = corners[i];
                  const uv = uvs[i];
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                  texCoords.push(texU(voxel, uv[0]), texV(voxel, uv[1]));
                }
                indices.push(
                  ndx, ndx + 1, ndx + 2,
                  ndx + 2, ndx + 1, ndx + 3,
                );
            }
          }
        }
      }
    }
  }

    const geo = new THREE.BufferGeometry();
    // const col = getcol(0xc0 + Math.random()*0x20, 0xc0 + Math.random()*0x20, 0xc0 + Math.random()*0x20);
    const mat = <any>new THREE.MeshLambertMaterial({side: THREE.DoubleSide, map: voxelTextures}); 
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(texCoords), 2));
    geo.setIndex(indices);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(this.wx*CHUNK_DIM, 0, this.wy*CHUNK_DIM);
    this.has_mesh = true;

    return this.mesh;
  }  

  get(x: number, y: number, z: number) {
    return this.blocks[x + (y * CHUNK_DIM) + (z * CHUNK_DIM_SQ)];
  }

  set(x: number, y: number, z: number, to: number) {
    this.blocks[x + (y * CHUNK_DIM) + (z * CHUNK_DIM_SQ)] = to;
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

