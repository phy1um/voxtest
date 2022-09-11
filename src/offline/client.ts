import { Chunk, ChunkToWire, CHUNK_DIM } from "../chunk";
import { ClientCon } from "../client";
import { CMDs } from "../cmd";
import { ReadWire, WriteWire } from "../wire";
import { basicPopulate } from "./gen";

function makeKey(x: number, y: number, z: number) {
  return `${x},${z}`;
}


export class OfflineClientCon implements ClientCon {

  handlers!: any;
  world: Object = {};

  constructor() {
    this.handlers = {};
  }

  addHandler(kind: any, fn: any) {
    this.handlers[kind] = fn;
  }

  requestChunk(xi: any, zi: any) {
    const hc = this.handlers[CMDs.CHUNKDATA];
    if (!hc) {
      return;
    }

    const key = makeKey(xi, 0, zi);
    const cached = this.world[key];
    if (cached !== undefined) {
      sendChunk(hc, cached);
    }

    const newChunk = new Chunk(xi, zi);
    basicPopulate(newChunk); 
    this.world[key] = newChunk;
    sendChunk(hc, newChunk);
  }
}

function sendChunk(handler: Function, c: Chunk): void {
  const ab = new Uint8Array((CHUNK_DIM * CHUNK_DIM * CHUNK_DIM * 4) + 80);
  const write = new WriteWire(ab);
  ChunkToWire(c, write);
  const read = new ReadWire(ab);
  handler(0, read);
}


