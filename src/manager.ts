
import {World} from "./world";

const nearby = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 0],
  [0, -1],
  [-1, -1],
];

export class Manager{

  world: World;
  focusX: number;
  focusZ: number;
  lastCx: number;
  lastCz: number;
  tasks: Array<Function>;
  dead: boolean;

  constructor(w: World, focusX: number, focusZ: number) {
    this.world = w;
    this.focusX = focusX;
    this.focusZ = focusZ;
    this.lastCx = null;
    this.lastCz = null;
    this.tasks = [];
    this.dead = false;
    this.update(0);
  }

  update(dt: number) {
    const px = this.focusX;
    const pz = this.focusZ;

    const chunkX = Math.floor(px / 16);
    const chunkZ = Math.floor(pz / 16);

    if (chunkX != this.lastCx || chunkZ != this.lastCz) {
      this.world.cleanup(chunkX, chunkZ);
      console.log("moved chunk!");
      for (let n of nearby) {
        this.tasks.push(() => {this.world.loadChunk(chunkX + n[0], chunkZ + n[1]);});
        console.log("set task to load chunk..");
      }
    }

    this.lastCx = chunkX;
    this.lastCz = chunkZ;
  }

  runtask() {
    if (this.tasks.length > 0) {
      console.log("do task");
      this.tasks.pop()();
      return true;
    } else {
      return false;
    }
  }

  runTaskLoop(d: number) {
    this.runtask();
    if (!this.dead) {
      setTimeout(() => {
        this.runTaskLoop(d);
      }, d);
    }
  }

}
