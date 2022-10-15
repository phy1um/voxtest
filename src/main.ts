
import {Player} from "./player";
import {Manager} from "./manager";
import {NewWorldForClient, World} from "./world";
import {WebsocketClientcon} from "./client"; 

import { OfflineClientCon } from "./offline/client";

import { Terminal } from "./game/terminal";

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


const ar = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);

let world: World;

export function ConnectToServer(addr: string) {
  const con = new WebSocket(addr)
  const client = new WebsocketClientcon(con);
  world = NewWorldForClient(client, (world: World) => {
    const player = new Player(4, 10, 4);
    world.spawn(player);
    player.bindCamera(camera);
    player.bindListeners();
    world.bindPlayer(player);
  });
}

if (window.location.search && window.location.search.length > 1) {
  QUERY_SETTINGS.defaultServer = "ws://" + window.location.search.substring(1);
}


if (!QUERY_SETTINGS.defaultServer) {
  const off = new OfflineClientCon();
    world = NewWorldForClient(off, (world: World) => {
      //const player = new Player(4, 1.6, 4);
      const player = new Player(4, 1.6, 1);
      player.bindListeners();
      world.spawn(player)
      player.bindCamera(camera);
      world.bindPlayer(player);
      const term = new Terminal();
      term.mesh.scale.set(0.6, 0.6, 0.6);
      term.position.set(4, 1.55, 3.3);
      world.spawn(term);
    });
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


  function render(time: number) {
    const dt = Math.min((time - lastTime) * 0.001, 0.3);
    lastTime = time;

    stats.begin();
    renderer.render(world.scene, camera);
    stats.end();
    requestAnimationFrame(render);

    // hudTime.innerText = World.time.toString()
    world.update(dt);

    // updateHud();
  }

  requestAnimationFrame(render);

}


main();
