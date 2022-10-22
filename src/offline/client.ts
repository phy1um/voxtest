import { Chunk, ChunkToWire, CHUNK_DIM } from "../chunk";
import { ClientCon } from "../client";
import { CMDs } from "../cmd";
import { ReadWire, WriteWire } from "../wire";
import { basicPopulate, flatPopulate } from "./gen";
import { World } from "../world";

function makeKey(x: number, y: number, z: number) {
  return `${x},${z}`;
}


export class OfflineClientCon implements ClientCon {

  _world!: World

  constructor(w: World) {
    this._world = w;
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
}

