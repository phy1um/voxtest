
import * as THREE from "three";

export interface Entity {
  addToScene(scene: THREE.Scene): void;
  removeFromScene(scene: THREE.Scene): void;
  tick(dt: number, w: any): void;
}

