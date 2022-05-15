import {Chunk, CHUNK_DIM} from "./chunk.js";
import {basicPopulate} from "./gen.js";
import * as THREE from "../build/three.module.js";

function makeKey(x, y, z) {
  return `${x},${z}`;
}

const DAY_CYCLE_MAX = 50;
const NIGHT_START = 25;
const NIGHT_FRACTION = NIGHT_START / DAY_CYCLE_MAX;

const DAY_SKY = new THREE.Color(0x8fd9ef);
const NIGHT_SKY = new THREE.Color(0x040514);

class world {
  constructor() {
    this.chunks = {};
    this.scene = new THREE.Scene();

    this.ambient = new THREE.AmbientLight(0x404040);
    this.sun = new THREE.DirectionalLight(0xd0d0d0, 0.4);
    this.sun.position.set(1, 10, 1.4);

    this.moon = new THREE.DirectionalLight(0x15101e, 0.1);
    this.moon.position.set(1.4, 2, 1.1);

    this.scene.add(this.ambient);
    this.scene.add(this.sun);
    this.scene.background = new THREE.Color(0x111111);

    this.time = 0;
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

  update(dt) {
    this.time = (this.time + dt) % DAY_CYCLE_MAX;
    if (this.time < NIGHT_START) {
      const sunTime = this.time / NIGHT_START;
      if (sunTime < 0.5) {
        this.scene.background.lerpColors(NIGHT_SKY, DAY_SKY, sunTime*2);
      } else {
        this.scene.background.lerpColors(DAY_SKY, NIGHT_SKY, (sunTime-0.5)*2);
      }
      this.scene.add(this.sun);
      this.scene.remove(this.moon);
      const hh = Math.sin(Math.PI*sunTime);
      this.sun.position.set(0.1, hh, Math.cos(Math.PI*sunTime));
      this.sun.intensity = hh*0.4;
      this.ambient.color.setRGB(0.2 + hh*0.2, 0.2 + hh*0.2, 0.2 + hh*0.2);
    } else {
      this.scene.remove(this.sun);
      this.ambient.color.setRGB(0.2, 0.2, 0.2);
      this.scene.add(this.moon);
    }
  }

}

export const World = new world();

