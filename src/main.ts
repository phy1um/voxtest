
import {Player} from "./player";
import {Manager} from "./manager";
import {WSClient} from "./client"; 
import {World} from "./world";
import { OfflineClientCon } from "./offline/client";


import * as Stats from "stats.js";
import * as THREE from "three";

const stats = new Stats();
// stats.showPanel(0);
// document.body.appendChild(stats.dom);


const OFFLINE = true;

/*
function makeHudTicker(e: HTMLElement, r: THREE.WebGLRenderer) {
  return function() {
    const msg = `
calls: ${r.info.render.calls}
tris: ${r.info.render.triangles}
lines: ${r.info.render.lines}
frame: ${r.info.render.frame}
`;
    e.innerText = msg;
  }
}
*/

const QUERY_SETTINGS: any = {};


let world: World;

export function ConnectToServer(addr: string) {
  const con = new WebSocket(addr)
  world = new World();
  const client = new WSClient(world, con);
}

if (window.location.search && window.location.search.length > 1) {
  QUERY_SETTINGS.defaultServer = "ws://" + window.location.search.substring(1);
}


if (!QUERY_SETTINGS.defaultServer) {
  world = new World();
  const off = new OfflineClientCon(world);
  } else {
  ConnectToServer(QUERY_SETTINGS.defaultServer); 
}



export function main() {
  const canvas: HTMLElement = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize(window.innerWidth,window.innerHeight,false);


  // connectToServer("ws://127.0.0.1:9991");
 
  canvas.addEventListener("pointerdown", () => {
    console.log("click!");
    canvas.requestPointerLock();
  }, true);

  let lastTime: number = performance.now();;
  // const updateHud = makeHudTicker(myStats, renderer);

  let fatal = false;

  function render(time: number) {

    if (world._client.finished() || fatal) {
      return; 
    }

    requestAnimationFrame(render);

    try {
      const dt = Math.min((time - lastTime) * 0.001, 0.3);
      lastTime = time;

      stats.begin();
      renderer.render(world.scene, world.cam);
      stats.end();

      // hudTime.innerText = World.time.toString()
      world.update(dt);

    } catch (e) {
      console.error(e);
      fatal = true;
    }
    // updateHud();
  }

  requestAnimationFrame(render);

}


main();
