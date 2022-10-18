import {Chunk, CHUNK_DIM, ChunkFromWire} from "./chunk";
import {ClientCon} from "./client"; 
import {CMDs} from "./cmd";
import * as THREE from "three";
import { Entity } from "./game/entity";
import { Manager } from "./manager";
import { Player } from "./player";
import { ReadWire, WriteWire } from "./wire";
import { NetDebugEntity } from "./game/net";

function makeKey(x: number, y: number, z: number) {
  return `${x},${z}`;
}

class FakeAuther {
  sendAuth(wire: WriteWire) {
    wire.putU8(CMDs.AUTH);
    wire.putU32(12345);
  }
}

const DAY_CYCLE_MAX = 50;
const NIGHT_START = 25;
const NIGHT_FRACTION = NIGHT_START / DAY_CYCLE_MAX;

const DAY_SKY = new THREE.Color(0x8fd9ef);
const NIGHT_SKY = new THREE.Color(0x040514);

let UNIQUE_ENTITY_ID = 127;

export class World {
  chunks: Map<string, Chunk>;
  time: number;
  scene: any;
  ambient: THREE.AmbientLight;
  sun: any;
  moon: any;
  entities: object = {};
  _client: ClientCon;
  doDayNight: boolean;
  mgr: Manager;
  focus: any;
  focusId: number;
  auther: FakeAuther;
  cam: THREE.Camera;

  constructor(
    authClient = new FakeAuther(),
    background = new THREE.Color(0x111111),
    ambient = new THREE.AmbientLight(0x404040), 
    sun = new THREE.DirectionalLight(0xd0d0d0, 0.4),
    moon = new THREE.DirectionalLight(0x15101e, 0.1),
    doDayNight = true,
  ) {
    this.chunks = new Map<string, Chunk>();
    this.scene = new THREE.Scene();

    this.ambient = ambient;
    this.sun = sun;
    this.sun.position.set(1, 10, 1.4);

    this.moon = moon;
    this.moon.position.set(1.4, 2, 1.1);

    this.scene.add(this.ambient);
    this.scene.add(this.sun);
    this.scene.background = background;

    this._client = null;

    this.time = 0;
    this.doDayNight = doDayNight;

    this.mgr = new Manager(this, 0, 0);
    this.focus = undefined;

    this.auther = authClient;

    const ar = window.innerWidth / window.innerHeight;
    this.cam = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);

  }

  bindClient(c: ClientCon) {
    this._client = c;
    this._client.addHandler(CMDs.CHUNKDATA, (c, wire) => this.chunkFromWire(wire));

    this._client.addHandler(CMDs.CHALLENGE, (c, wire) => {
      console.log("GOT CHALLENGE");
      const send = new WriteWire(new Uint8Array(20));
      this.auther.sendAuth(send);
      this._client.send(send._stream);
    });
    this._client.addHandler(CMDs.CHALLENGE_STATUS, (c, wire: ReadWire) => {
      const stat = wire.getU8();
      console.log(`CHALLENGE STATUS: ${stat}`);
      if (stat == 1) {
        console.log("challenge pending...");
        return;
      } 
      else if (stat == 2) {
        console.error("challenge failed!");
        return;
      }
      else if (stat != 3) {
        console.error("unknown challenge status: " + stat);
        return;
      }

      // stat == 3 => OK
      const send = new WriteWire(new Uint8Array(5));
      send.putU8(CMDs.CLIENT_SPAWN);
      this._client.send(send._stream);
    });

    this._client.addHandler(CMDs.CLIENT_SPAWN, (c, wire: ReadWire) => {
      const stat = wire.getU8();
      if (stat == 0) {
        console.error("failed to spawn client: server error");
      }
      const id = wire.getU32();
      const flags = wire.getU32();
      const kind = wire.getU8();
      const posX = wire.getU32();
      const posY = wire.getU32();
      const posZ = wire.getU32();

      console.log(`SPAWN PLAYER ${id} ${kind} @ ${posX} ${posY} ${posZ}`);
      const player = new Player(posX, posY, posZ);
      player.bindCamera(this.cam);
      player.bindListeners();
      player.bindWorld(this);
      player.addToScene(this.scene);
      this.entities[id] = player;

      this.focus = player;
      this.focusId = id;
      
    });

    this._client.addHandler(CMDs.EDESCRIBE, (c: number, wire: ReadWire) => {
      const eid = wire.getU32();
      const flags = wire.getU32();
      const dataFields = wire.getU8();
      const data = new Uint32Array(dataFields);
      for (let i = 0; i < dataFields; i++) {
        data[i] = wire.getU32(); 
      }
      if (this.entities[eid] === undefined) {
        console.log(`creating new net entity: ${eid}`);
        const e = new NetDebugEntity();
        this.entities[eid] = e;
        e.addToScene(this.scene);
      }
      const e : Entity = this.entities[eid];
      e.updateFromDescribe(flags, data);
    });
  }

  bindPlayer(p: Player) {
    this.focus = p;
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
    if (this.doDayNight) {
      this.time = (this.time + dt) % DAY_CYCLE_MAX;
    } else {
      this.time = 10;
    }
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
    for (let eid in this.entities) {
      const e = this.entities[eid];
      e.tick(dt, this);
    }
    if (this.focus !== undefined) {
      this.mgr.focusX = this.focus.pos.x;
      this.mgr.focusZ = this.focus.pos.z;
    }
    this.mgr.update(dt);
    if (this.focus) {
      this._updateFocus();
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
    e.bindWorld(this);
    e.addToScene(this.scene);
    this.entities[UNIQUE_ENTITY_ID] = e;
    UNIQUE_ENTITY_ID += 1;
  }

  destroy() {
    this.mgr.dead = true;
  }

  _updateFocus() {
    const w = new WriteWire(new Uint8Array(60));
    w.putU8(CMDs.EDESCRIBE);
    w.putU32(this.focusId);
    w.putU32(1);
    w.putU8(3);
    w.putU32(Math.floor(this.focus.pos.x));
    w.putU32(Math.floor(this.focus.pos.y));
    w.putU32(Math.floor(this.focus.pos.z));
    this._client.send(w._stream);
  }

}

export function NewWorldForClient(c: ClientCon, onCreate: (w: World) => void): World {
  const w = new World();
  w.bindClient(c);
  onCreate(w);
  w.mgr.runTaskLoop(10);
  return w;
}

