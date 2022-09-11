
import {ReadWire} from "./wire";
import {Name} from "./cmd";

export interface ClientCon {
  addHandler(kind: number, fn: Function) : void; 
  requestChunk(xi: number, zi: number) : void;
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
