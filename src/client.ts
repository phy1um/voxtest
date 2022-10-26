
import {ReadWire, WriteWire} from "./wire";
import {Name} from "./cmd";
import {ChunkFromWire} from "./chunk";
import { Entity } from "./game/entity";
import { NetDebugEntity } from "./game/net";
import {CMDs} from "./cmd";
import {Player} from "./player";
import {World} from "./world";

export interface ClientCon {
  requestChunk(xi: number, zi: number) : void;
  tick() : void;
  finished(): boolean;
}

class FakeAuther {
  sendAuth(wire: WriteWire) {
    wire.putU8(CMDs.AUTH);
    wire.putU32(12345);
  }
}

export class WSClient {
  _handlers: any = {};
  _isOpen = false;
  _ws: WebSocket;
  _world: World;
  _auther: any;

  constructor(w: World, ws: WebSocket) {
    this._world = w;
    this._ws = ws;
    this._auther = new FakeAuther();
    this._ws.addEventListener("open", e => this._open(e))
    this._ws.addEventListener("message", e => this._handle(e))
    this._addHandler(CMDs.CHUNKDATA, (wire: ReadWire) => this._readChunkData(wire));
    this._addHandler(CMDs.CHALLENGE, (wire: ReadWire) => this._challenge(wire));
    this._addHandler(CMDs.CHALLENGE_STATUS, (wire: ReadWire) => this._readChallengeStatus(wire));
    this._addHandler(CMDs.CLIENT_SPAWN, (wire: ReadWire) => this._clientSpawn(wire));
    this._addHandler(CMDs.EDESCRIBE, (wire: ReadWire) => this._netUpdateEntity(wire));
    this._world.bindClient(this);
  }

  tick() {
    if (this._world.focus) {
      this._netUpdateFocus();
    }
  }

  requestChunk(xi, zi) {
    const req = new Uint8Array([
      0x10, 0, 0, 0,
      xi, 0, 0, 0,
      zi, 0, 0, 0,
      0,
    ]);
    this._send(req);
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
    e.data.arrayBuffer().then((buf: ArrayBuffer) => {
      const wire = new ReadWire(buf);
      const cmd = wire.getU8();
      if (cmd in this._handlers) {
        this._handlers[cmd](this, wire);
      } else {
        console.error(`unknown command (${cmd}), (${Name(cmd)})`);
      }
    });
  }

  _readChunkData(wire: ReadWire) {
    const c = ChunkFromWire(wire);
    this._world.addChunk(c);
  }
  
  _challenge(wire: ReadWire) {
    console.log("GOT CHALLENGE");
    const send = new WriteWire(new Uint8Array(20));
    this._auther.sendAuth(send);
    this._send(send._stream);
  }

  _readChallengeStatus(wire: ReadWire) {
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
    this._send(send._stream);
  }

  _clientSpawn(wire: ReadWire) {
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
    player.bindCamera(this._world.cam);
    player.bindListeners();
    player.bindWorld(this._world);
    player.addToScene(this._world.scene);
    this._world.entities[id] = player;

    this._world.bindPlayer(id, player);
  }

  _netUpdateEntity(wire: ReadWire) {
    const eid = wire.getU32();
    const flags = wire.getU32();
    const dataFields = wire.getU8();
    const data = new Uint32Array(dataFields);
    for (let i = 0; i < dataFields; i++) {
      data[i] = wire.getU32(); 
    }
    if (this._world.entities[eid] === undefined) {
      console.log(`creating new net entity: ${eid}`);
      const e = new NetDebugEntity();
      this._world.entities[eid] = e;
      e.addToScene(this._world.scene);
    }
    const e: Entity = this._world.entities[eid];
    e.updateFromDescribe(flags, data);
  }

  _netUpdateFocus() {
    const w = new WriteWire(new Uint8Array(60));
    w.putU8(CMDs.EDESCRIBE);
    w.putU32(this._world.focusId);
    w.putU32(1);
    w.putU8(3);
    w.putFloat(this._world.focus.pos.x);
    w.putFloat(this._world.focus.pos.y);
    w.putFloat(this._world.focus.pos.z);
    this._send(w._stream);
  }

}

