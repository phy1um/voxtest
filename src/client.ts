
import {ReadWire, WriteWire} from "./wire";
import {Chunk, ChunkFromWire, ChunkToWire, CHUNK_DIM} from "./chunk";
import {Name, CMDs} from "./cmd";

export interface ClientCon {
  addHandler(kind: number, fn: Function) : void; 
  requestChunk(xi: number, zi: number) : void;
}

export class OfflineClientCon implements ClientCon {

  handlers!: any;
  chunk: Chunk;

  constructor() {
    this.handlers = {};
    this.chunk = new Chunk(0, 0);
    for ( let xx = 0; xx < CHUNK_DIM; xx++ ) {
      for (let yy = 0; yy < CHUNK_DIM; yy++ ) {
        for (let zz = 0; zz < 3; zz++) {
          this.chunk.set(xx, zz, yy, 1);
        }
      }
    }
  }

  addHandler(kind: any, fn: any) {
    this.handlers[kind] = fn;
  }

  requestChunk(xi: any, zi: any) {
    const hc = this.handlers[CMDs.CHUNKDATA];
    if (!hc) {
      return;
    }
    const ab = new Uint8Array((CHUNK_DIM * CHUNK_DIM * CHUNK_DIM * 4) + 80);
    const write = new WriteWire(ab);
    this.chunk.wx = xi;
    this.chunk.wy = zi;
    ChunkToWire(this.chunk, write);

    const read = new ReadWire(ab);
    hc(0, read);
  }
   
}

export class WebsocketClientcon implements ClientCon {

  _ws!: WebSocket; 
  _handlers!: any;
  _open: boolean;

  constructor(ws: WebSocket) {
    this._ws = ws;
    this._ws.addEventListener("open", e => this.onOpen(e))
    this._ws.addEventListener("message", e => this.handleMessage(e))
    this._handlers = {};
    this._open = false;
  }

  onOpen(event) {
    console.log("connected to server");
  }

  handleMessage(event) {
    event.data.arrayBuffer().then((buf: ArrayBuffer) => {
        const wire = new ReadWire(buf);
        const cmd = wire.getU8();
        if (cmd in this._handlers) {
          this._handlers[cmd](this, wire);
        } else {
          console.log(`unknown command (${cmd}), (${Name(cmd)})`);
        }
      });
  }

  addHandler(kind, fn) {
    this._handlers[kind] = fn;
  }

  requestChunk(xi, zi) {
    const req = new Uint8Array([
      0x10, 0, 0, 0,
      xi, 0, 0, 0,
      zi, 0, 0, 0,
      0,
    ]);
    this.send(req);
  }

  send(req) {
    console.log(`sending ${req}`);
    this._ws.send(req);
  }
}
