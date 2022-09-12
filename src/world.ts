import {Chunk, CHUNK_DIM, ChunkFromWire} from "./chunk";
import {ClientCon} from "./client"; 
import {CMDs} from "./cmd";
import * as THREE from "three";
import { Entity } from "./game/entity";

function makeKey(x: number, y: number, z: number) {
  return `${x},${z}`;
}

const DAY_CYCLE_MAX = 50;
const NIGHT_START = 25;
const NIGHT_FRACTION = NIGHT_START / DAY_CYCLE_MAX;

const DAY_SKY = new THREE.Color(0x8fd9ef);
const NIGHT_SKY = new THREE.Color(0x040514);

class world {
  chunks: Map<string, Chunk>;
  time: number;
  scene: any;
  ambient: THREE.AmbientLight;
  sun: any;
  moon: any;
  entities: Array<Entity> = [];
  _client: any;

  constructor() {
    this.chunks = new Map<string, Chunk>();
    this.scene = new THREE.Scene();

    this.ambient = new THREE.AmbientLight(0x404040);
    this.sun = new THREE.DirectionalLight(0xd0d0d0, 0.4);
    this.sun.position.set(1, 10, 1.4);

    this.moon = new THREE.DirectionalLight(0x15101e, 0.1);
    this.moon.position.set(1.4, 2, 1.1);

    this.scene.add(this.ambient);
    this.scene.add(this.sun);
    this.scene.background = new THREE.Color(0x111111);

    this._client = null;

    this.time = 0;
  }

  bindClient(c: ClientCon) {
    this._client = c;
    this._client.addHandler(CMDs.CHUNKDATA, (c, wire) => this.chunkFromWire(wire));
  }

  chunkFromWire(w) {
    const c = ChunkFromWire(w);
    this.addChunk(c);
  }

  loadChunk(xi: number, zi: number) {
    if (xi < 0 || zi < 0) { return; }
    const key = makeKey(xi, 0, zi);
    console.log(`load chunk: ${key}`)
    if (key in this.chunks) {
      console.log(`skip loading chunk in cache`);
      return;
    }
    // request from con  
    this._client.requestChunk(xi, zi);
  }

  addChunk(c: Chunk) {
    console.log("adding chunk to scene");
    const key = makeKey(c.wx, 0, c.wy);
    this.chunks[key] = c;
    this.scene.add(c.getMesh());
  }

  chunkLoaded(xi: number, zi: number) {
    const key = makeKey(xi, 0, zi);
    return key in this.chunks;
  }

  pointFree(x: number, y: number, z: number) {
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

  update(dt: number) {
    this.time = (this.time + dt) % DAY_CYCLE_MAX;
    if (this.time < NIGHT_START) {
      const sunTime = this.time / NIGHT_START;
      if (sunTime < 0.5) {
        this.scene.background.lerpColors(NIGHT_SKY, DAY_SKY, sunTime*2);
      } else {
        this.scene.background.lerpColors(DAY_SKY, NIGHT_SKY, (sunTime-0.5)*2);
      }
      const hh = Math.sin(Math.PI*sunTime);
      this.sun.position.set(0.1, hh, Math.cos(Math.PI*sunTime));
      this.sun.intensity = hh*0.4;
      this.ambient.color.setRGB(0.2 + hh*0.2, 0.2 + hh*0.2, 0.2 + hh*0.2);
    } else {
      this.sun.intensity = 0;
    }
    for (let e of this.entities) {
      e.tick(dt, this);
    }
  }

  cleanup(x: number, z: number) {
    for (let k in this.chunks) {
      const p = k.split(",");
      const xi = parseInt(p[0]);
      const zi = parseInt(p[1]);
      if (Math.abs(x - xi) > 2 || Math.abs(z - zi) > 2) {
        console.log(`cleanup: ${xi},${zi}`);
        const chunk = this.chunks[k];
        if (chunk.has_mesh) {
          this.scene.remove(chunk.getMesh());
        }
        delete this.chunks[k];
        if (chunk.geo) {
          chunk.geo.free();
        }
      }
    }
  }

  spawn(e: Entity) {
    e.addToScene(this.scene);
    this.entities.push(e);
  }

}

export const World = new world();

