
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
  constructor(p) {
    this.focus = p;
    this.lastCx = null;
    this.lastCz = null;
    this.tasks = [];
  }

  update(dt) {
    const px = this.focus.pos.x;
    const pz = this.focus.pos.z;

    const chunkX = Math.floor(px / 16);
    const chunkZ = Math.floor(pz / 16);

    this.tasks.push(() => {
      World.cleanup(chunkX, chunkZ);
      if (chunkX != this.lastCx || chunkZ != this.lastCz) {
        for (let n of nearby) {
          this.tasks.push(() => {World.loadChunk(chunkX + n[0], chunkZ + n[1]);});
        }
      }
    });

    this.lastCx = chunkX;
    this.lastCz = chunkZ;
  }

  runtask() {
    if (this.tasks.length > 0) {
      this.tasks.pop()();
    }
  }
}