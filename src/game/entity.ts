
import * as THREE from "three";
import { World } from "../world";

export interface Entity {
  bindWorld(world: World): void;
  addToScene(scene: THREE.Scene): void;
  removeFromScene(scene: THREE.Scene): void;
  tick(dt: number, w: any): void;
}

