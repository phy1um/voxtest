import { Chunk, ChunkToWire, CHUNK_DIM } from "../chunk";
import { ClientCon } from "../client";
import { CMDs } from "../cmd";
import { ReadWire, WriteWire } from "../wire";
import { World } from "../world";
import { Terminal } from "../game/terminal";
import { Player } from "../player";
import { Entity } from "../game/entity";

function makeKey(x: number, y: number, z: number) {
  return `${x},${z}`;
}


export class OfflineClientCon implements ClientCon {

  _world!: World
  _genChunk!: (_: Chunk) => void;

  constructor(px: number, py: number, w: World, gen: (_: Chunk) => void) {
    this._world = w;
    this._world.bindClient(this);

    this._genChunk = gen;

    const player = new Player(px, 1.6, py);
    const cxi = Math.floor(px / CHUNK_DIM);
    const cyi = Math.floor(py / CHUNK_DIM);
    this.requestChunk(cxi, cyi);

    const localX = px % CHUNK_DIM;
    const localY = py % CHUNK_DIM;

    const cc: Chunk = this._world.getChunk(cxi, cyi);
    for (let yy = 50; yy >= 0; yy--) {
      if (cc.get(localX, yy, localY) != 0) {
        player.pos.setY(yy + 3);
        break;
      }
    }

    const id = -1;
    player.bindCamera(this._world.cam);
    player.bindListeners();
    player.bindWorld(this._world);
    player.addToScene(this._world.scene);
    this._world.entities[id] = player;
    this._world.bindPlayer(id, player);

    const term = new Terminal();
    term.mesh.scale.set(0.6, 0.6, 0.6);
    term.position.set(4, 1.55, 3.3);
    this._world.spawn(term);

  }

  requestChunk(xi: any, zi: any) {
    const key = makeKey(xi, 0, zi);
    const cached = this._world[key];
    if (cached !== undefined) {
      return;
    }

    const newChunk = new Chunk(xi, zi);
    this._genChunk(newChunk); 
    this._world.addChunk(newChunk);
  }

  finished(): boolean {
    return false;
  }

  tick() : void {
  }

  _placeEntityOnGround(e: Entity, x: number, y: number) {
    const cxi = Math.floor(x / CHUNK_DIM);
    const cyi = Math.floor(y / CHUNK_DIM);
    this.requestChunk(cxi, cyi);

    const localX = x % CHUNK_DIM;
    const localY = y % CHUNK_DIM;

    const cc: Chunk = this._world.getChunk(cxi, cyi);
    for (let yy = 50; yy >= 0; yy--) {
      if (cc.get(localX, yy, localY) != 0) {
        break;
      }
    }


  }
}

