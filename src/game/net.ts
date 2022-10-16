import * as THREE from "three";

import { World } from "../world";
import { Entity } from "./entity";

export class NetDebugEntity implements Entity {

  position: THREE.Vector3 = new THREE.Vector3;
  mesh: THREE.Mesh;

  constructor() {
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    this.mesh = new THREE.Mesh( geometry, material );
    this.mesh.position.copy(this.position);
  }

  updateFromDescribe(flags: any, data: Uint32Array): void {
    if (data.length < 3) {
      console.error("failed to update: position has 3 elements");
    }
    const fv = new Float32Array(data.buffer);
    this.position.x = fv[0];
    this.position.y = fv[1];
    this.position.z = fv[2];
  }

  bindWorld(world: World): void {
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }

  tick(dt: number, w: any): void {
    this.mesh.position.copy(this.position);
  }

}
