
import * as THREE from "three";
import {Player} from "./player.js";
import {Manager} from "./manager.js";
import {World} from "./world.js";

export function main() {
  const IMPULSE = {};
  const canvas: HTMLElement = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize(1280,720,false);

  const player = new Player(10, 8, 10);

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


  const mgr = new Manager(player);

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
    mgr.update(dt); 

  }

  requestAnimationFrame(render);

  function runTasks() {
    while(mgr.runtask()) {}
    setInterval(runTasks, 100);
  }

  runTasks();
}

