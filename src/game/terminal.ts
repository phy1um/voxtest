import * as THREE from "three";
import { MenuState, OverlayController } from "../2d/menu";
import { Player } from "../player";
import { Cmd } from "../term/cli";
import { World } from "../world";
import { Entity } from "./entity";

const RT = 0.2;
const BIND_TIMEOUT = 0.3;
const BIND_DIST = 1.8;

const FOCUS_OFFSET = new THREE.Vector3(0,0,1.7);

export interface KeyHandler {
  key(k: string): void;
}

export class Terminal implements Entity, KeyHandler {

  surface: OverlayController;
  texture: THREE.CanvasTexture;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  focusOffset: THREE.Vector3;
  fwd: THREE.Vector3;
  acc: number = 0;
  bindAcc: number = BIND_TIMEOUT + 1;

  constructor() {
    const overlay = new OverlayController();
    overlay.hide();
    document.body.appendChild(overlay.dom);

    const cli = new Cmd();

    overlay.pushState(cli);
    this.surface = overlay;

    const panel = new THREE.PlaneGeometry(2, 2);
    this.texture = new THREE.CanvasTexture(overlay.dom);
    const canvasMat = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(panel, canvasMat);

    this.position = new THREE.Vector3(0,0,0);

    this.surface.draw();

    this.focusOffset = new THREE.Vector3(0,0,1.7);

  }

  getPosition(): THREE.Vector3 {
    return this.position;
  }

  addToScene(scene: THREE.Scene): void {
    console.log("%%%%% add %%%%%");
    scene.add(this.mesh);
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }

  tick(dt: number, w: any): void {
    this.acc += dt;
    if (this.acc > RT) {
      this.surface.draw();
      this.texture.needsUpdate = true;
      this.acc = 0;
    }
    this.bindAcc += dt;
    if (this.bindAcc > BIND_TIMEOUT) {
      this.focusOffset.copy(this.position);
      this.focusOffset.add(FOCUS_OFFSET);
      for (let e of w.entities as Array<Entity>) {
        if (e instanceof Player) {
          const player = e as Player;
          const pd = player.pos.distanceTo(this.focusOffset);
          if (pd < BIND_DIST && player.rotY > 3 && player.rotY < 3.4) {
            player.setFocus(this);
          }
        }
      }
      this.bindAcc = 0;
    }
    this.mesh.position.copy(this.position);
  }

  key(k: string) {
    this.surface.key(k);
  }

  bindWorld(w: World): void {

  }

  updateFromDescribe(flags: any, data: Uint32Array): void {

  }

}
