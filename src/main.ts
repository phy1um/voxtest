
import {Player} from "./player";
import {Manager} from "./manager";
import {World} from "./world";
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

export function main() {
  const IMPULSE = {};
  const canvas: HTMLElement = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  const ar = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth,window.innerHeight,false);

  const player = new Player(4, 1.6, 4);
  World.spawn(player)

  if (OFFLINE) {
    const off = new OfflineClientCon();
    World.bindClient(off);
  } else {
    const con = new WebSocket("ws://127.0.0.1:9991/")
    const client = new WebsocketClientcon(con);
    World.bindClient(client);
  }
  
  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    IMPULSE[e.key] = true;
    player.keyevent(e.key, true);
    return false;
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



  const camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);
  player.bindCamera(camera);

  const term = new Terminal();
  term.mesh.scale.set(0.6, 0.6, 0.6);
  term.position.set(4, 1.55, 3.3);
  World.spawn(term);

  const mgr = new Manager(player);

  let lastTime: number = performance.now();;
  // const updateHud = makeHudTicker(myStats, renderer);


  function render(time: number) {
    const dt = (time - lastTime) * 0.001;
    lastTime = time;

    stats.begin();
    renderer.render(World.scene, camera);
    stats.end();
    requestAnimationFrame(render);

    // hudTime.innerText = World.time.toString()
    World.update(dt);
    mgr.update(dt); 

    // updateHud();
  }

  requestAnimationFrame(render);

  function runTasks() {
    mgr.runtask();
  }

  setInterval(runTasks, 10);
}


main();
