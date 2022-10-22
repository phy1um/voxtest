
import {ReadWire} from "./wire";
import {Name} from "./cmd";

export interface ClientCon {
  requestChunk(xi: number, zi: number) : void;
  finished(): boolean;
}

export class WSClient {
  this._handlers!: Object = {};
  this._isOpen = false;
  this._ws!: WebSocket;
  this._world!: World;

  constructor(w: World, ws: WebSocket) {
    this._world = w;
    this._ws = ws;
    this._ws.addEventListener("open", e => this._open(e))
    this._ws.addEventListener("message", e => this._handle(e))
    this._addHandler(CMDs.CHUNKDATA, (wire: ReadWire) => this._readChunkData(wire));
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

  finished(): boolean {
    return (this._ws.readyState > 2)
  }

  _addHandler(cmd: number, fn: Function) {
    this._handlers[cmd] = fn;
  }

  _open(ev: any) {
    this._isOpen = true;
  }
  
  _send(msg: Uint8Array) {
    this._ws.send(msg);
  }

  _handle(e) {
    event.data.arrayBuffer().then((buf: ArrayBuffer) => {
      const wire = new ReadWire(buf);
      const cmd = wire.getU8();
      if (cmd in this._handlers) {
        this._handlers[cmd](this, wire);
      } else {
        console.error(`unknown command (${cmd}), (${Name(cmd)})`);
      }
    });
  }


}

