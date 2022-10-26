import { Chunk, ChunkToWire, CHUNK_DIM } from "../chunk";
import { ClientCon } from "../client";
import { CMDs } from "../cmd";
import { ReadWire, WriteWire } from "../wire";
import { basicPopulate, flatPopulate } from "./gen";
import { World } from "../world";
import { Terminal } from "../game/terminal";
import { Player } from "../player";

function makeKey(x: number, y: number, z: number) {
  return `${x},${z}`;
}


export class OfflineClientCon implements ClientCon {

  _world!: World

  constructor(w: World) {
    this._world = w;
    const player = new Player(4, 1.6, 1);
    player.bindListeners();
    this._world.spawn(player)
    this._world.bindPlayer(-1, player);
    const term = new Terminal();
    term.mesh.scale.set(0.6, 0.6, 0.6);
    term.position.set(4, 1.55, 3.3);
    this._world.spawn(term);

    this._world.bindClient(this);
  }

  requestChunk(xi: any, zi: any) {
    const key = makeKey(xi, 0, zi);
    const cached = this._world[key];
    if (cached !== undefined) {
      return;
    }

    const newChunk = new Chunk(xi, zi);
    flatPopulate(newChunk); 
    this._world[key] = newChunk;
  }

  finished(): boolean {
    return false;
  }

  tick() : void {
  }
}

