import {Chunk, CHUNK_DIM} from "./game.js";
import {basicPopulate} from "./gen.js";
import * as THREE from "../build/three.module.js";

function makeKey(x, y, z) {
  return `${x},${z}`;
}

class world {
  constructor() {
    this.chunks = {};
    this.scene = new THREE.Scene();

    this.ambient = new THREE.AmbientLight(0x404040);
    this.sun = new THREE.DirectionalLight(0xd0d0d0, 0.4);
    this.sun.position.set(1, 10, 1.4);

    this.scene.add(this.ambient);
    this.scene.add(this.sun);

  }

  loadChunk(xi, zi) {
    const key = makeKey(xi, 0, zi);
    if (key in this.chunks) {
      return this.chunks[key];
    }
    const c = new Chunk(xi, zi);
    basicPopulate(c);
    this.chunks[key] = c;
    this.scene.add(c.getMesh());
    return c;
  }

  chunkLoaded(xi, zi) {
    const key = makeKey(xi, 0, zi);
    return key in this.chunks;
  }

  pointFree(x, y, z) {
    const xi = Math.floor(x / CHUNK_DIM); 
    const yi = Math.floor(y / CHUNK_DIM); 
    const zi = Math.floor(z / CHUNK_DIM); 
    const key = makeKey(xi, yi, zi);
    if (key in this.chunks == false) {
      return false;
    }
    const xlocal = Math.floor(x % CHUNK_DIM);
    const ylocal = Math.floor(y % CHUNK_DIM);
    const zlocal = Math.floor(z % CHUNK_DIM);
    const cv = this.chunks[key].get(xlocal, ylocal, zlocal);
    return (cv == 0)
  }

}

export const World = new world();

