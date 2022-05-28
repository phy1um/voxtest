
import * as THREE from "three";
import {Player} from "./player.js";
import {Manager} from "./manager.js";
import {World} from "./world.js";
import { ReadWire } from "./wire.js";
import {ChunkFromWire} from "./chunk.js";
import {CMDs, Name} from "./cmd.js";

function requestChunk(xi: number, zi: number) {
  return new Uint8Array([
    0x10, 0, 0, 0,
    xi, 0, 0, 0,
    zi, 0, 0, 0,
    0,
  ]);
}

export function main() {
  const IMPULSE = {};
  const canvas: HTMLElement = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize(1280,720,false);

  const player = new Player(10, 8, 10);

  const con = new WebSocket("ws://127.0.0.1:9991/")
  con.addEventListener("message", event => {
    event.data.arrayBuffer().then((buf: ArrayBuffer) => {
      const wire = new ReadWire(buf);
      const cmd = wire.getU8();
      switch(cmd) {
      case CMDs.CHUNKDATA:
        const c = ChunkFromWire(wire);
        c.getMesh();
        World.addChunk(c);
        break;
      default:
        console.log(`unknown command (${cmd}), (${Name(cmd)})`);
      }
    });
  });

  con.addEventListener("open", () => {
    con.send(requestChunk(0, 0));
    con.send(requestChunk(0, 1));
    con.send(requestChunk(1, 0));
    con.send(requestChunk(1, 1));
  });


  document.addEventListener("keydown", (e) => {
    IMPULSE[e.key] = true;
    player.keyevent(e.key, true);
  });
  document.addEventListener("keyup", (e) => {
    IMPULSE[e.key] = false;
    player.keyevent(e.key, false);
  });

  document.addEventListener("mousemove", (e) => {
    player.mouse(e.movementX, e.movementY);
  });

  canvas.addEventListener("pointerdown", () => {
    console.log("click!");
    canvas.requestPointerLock();
  }, true);



  const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
  player.bindCamera(camera);


  //const mgr = new Manager(player);

  let lastTime: number = 0;
  const hudTime: any = document.querySelector("#time");
  function render(time: number) {
    const dt = (time - lastTime) * 0.001;
    lastTime = time;

    renderer.render(World.scene, camera);
    requestAnimationFrame(render);

    hudTime.innerText = World.time.toString()
    player.update(dt);
    World.update(dt);
    // mgr.update(dt); 

  }

  requestAnimationFrame(render);

  function runTasks() {
    // while(mgr.runtask()) {}
    setInterval(runTasks, 100);
  }

}

