
// code stolen from
// https://r105.threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html 

import * as THREE from "../build/three.module.js"

const CHUNK_SIZE_X = 32;
const CHUNK_SIZE_Y = 32;
const CHUNK_SIZE_Z = 32;

function getcol(r, g, b) {
  return `#${(r&0xff).toString(16)}${(g&0xff).toString(16)}${(b&0xff).toString(16)}`
}

export const CHUNK_DIM = 32;
const CHUNK_DIM_SQ = CHUNK_DIM * CHUNK_DIM;

export class Chunk {
  constructor(worldx, worldy) {
    this.wx = worldx;
    this.wy = worldy;
    this.blocks = new Uint8Array(CHUNK_DIM*CHUNK_DIM*CHUNK_DIM);
    this.mesh = null;
    this.has_mesh = false;
  }

  getMesh() {
    if (this.has_mesh) {
      return this.mesh;
    }

    const positions = [];
    const normals = [];
    const indices = [];
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
            for (const {dir} of VoxelWorld.faces) {
            for (const {dir, corners} of VoxelWorld.faces) {
              const neighbor = this.get(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (!neighbor) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
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
  }

    const geo = new THREE.BufferGeometry();
    const col = getcol(0xc0 + Math.random()*0x20, 0xc0 + Math.random()*0x20, 0xc0 + Math.random()*0x20);
    const mat = new THREE.MeshLambertMaterial({color: col}); 
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geo.setIndex(indices);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(this.wx*CHUNK_DIM, 0, this.wy*CHUNK_DIM);
    this.has_mesh = true;

    return this.mesh;
  }  

  get(x, y, z) {
    return this.blocks[x + (y * CHUNK_DIM) + (z * CHUNK_DIM_SQ)];
  }

  set(x, y, z, to) {
    this.blocks[x + (y * CHUNK_DIM) + (z * CHUNK_DIM_SQ)] = to;
  }


}


const VoxelWorld = {};
VoxelWorld.faces = [
  { // left
    dir: [ -1,  0,  0, ],
    corners: [
      [ 0, 1, 0 ],
      [ 0, 0, 0 ],
      [ 0, 1, 1 ],
      [ 0, 0, 1 ],
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
  },
  { // bottom
    dir: [  0, -1,  0, ],
    corners: [
      [ 1, 0, 1 ],
      [ 0, 0, 1 ],
      [ 1, 0, 0 ],
      [ 0, 0, 0 ],
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
  },
  { // back
    dir: [  0,  0, -1, ],
    corners: [
      [ 1, 0, 0 ],
      [ 0, 0, 0 ],
      [ 1, 1, 0 ],
      [ 0, 1, 0 ],
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
  },
];

