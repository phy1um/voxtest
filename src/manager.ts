
import {World} from "./world.js";

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
  focus: any;
  lastCx: number;
  lastCz: number;
  tasks: Array<Function>;

  constructor(p: any) {
    this.focus = p;
    this.lastCx = null;
    this.lastCz = null;
    this.tasks = [];
    this.update(0);
  }

  update(dt: number) {
    const px = this.focus.pos.x;
    const pz = this.focus.pos.z;

    const chunkX = Math.floor(px / 16);
    const chunkZ = Math.floor(pz / 16);

    if (chunkX != this.lastCx || chunkZ != this.lastCz) {
      this.tasks.push(() => {
        World.cleanup(chunkX, chunkZ);
        console.log("moved chunk!");
        for (let n of nearby) {
          this.tasks.push(() => {World.loadChunk(chunkX + n[0], chunkZ + n[1]);});
          console.log("set task to load chunk..");
        }
      });
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
}
