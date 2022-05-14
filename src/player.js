import * as THREE from "../build/three.module.js";
import {World} from "./world.js";

const PSPEED = 8.2;
const PACC = 3.2;
const PGRAV = 0.98;
const PVMAX = 8;

export class Player {
  constructor(x, y, z) {
    this.pos = new THREE.Vector3(x, y, z);
    this.fwd = new THREE.Vector3(0,0,1);
    this.rot = new THREE.Euler(0, 0, 0);
    this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
    this.velocity = new THREE.Vector3(0,0,0);
    this.vspeed = 0;
    this.keys = {};
    this.updateCamera();
  }

  bindCamera(c) {
    this.camera = c;
  }

  updateCamera() {
    this.camera.position.x = this.pos.x
    this.camera.position.y = this.pos.y;
    this.camera.position.z = this.pos.z;
     
    const fwd = new THREE.Vector3();
    fwd.copy(this.fwd);
    fwd.applyEuler(this.rot);
    fwd.add(this.pos);
    this.camera.lookAt(fwd);
  }

  update(dt) {

    const wishdir = new THREE.Vector3();

    if (this.keys["s"]) {
      wishdir.z = 1;
    } 
    if (this.keys["w"]) {
      wishdir.z -= 1; 
    }
    if (this.keys["d"]) {
      wishdir.x = 1;
    }
    if (this.keys["a"]) {
      wishdir.x -= 1;
    }

    wishdir.normalize();
    if (wishdir.length() > 0.2) {
      wishdir.multiplyScalar(PACC);
      this.velocity.add(wishdir);
      if (this.velocity.length() > PSPEED) {
        this.velocity.multiplyScalar(PSPEED / this.velocity.length());
      }
    } else {
      this.velocity.multiplyScalar(0.4);
    }

    if (this.grounded) {
      this.vspeed = 0;
      const foot = new THREE.Vector3();
      foot.copy(this.pos);
      foot.y -= 1.3;
      if (World.pointFree(foot.x, foot.y, foot.z)) {
        this.grounded = false;
      }
    } else {
      this.vspeed = Math.min(this.vspeed + PGRAV, PVMAX);
    }

    const fv = new THREE.Vector3();
    fv.copy(this.velocity);
    fv.multiplyScalar(dt);

    const nextPos = new THREE.Vector3();
    nextPos.copy(this.pos);
    nextPos.add(fv);

    if (World.pointFree(nextPos.x, nextPos.y, nextPos.z)) {
      this.pos.copy(nextPos);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    nextPos.copy(this.pos); 
    nextPos.y += this.vspeed*dt;

    if (World.pointFree(nextPos.x, nextPos.y - 1.3, nextPos.z)) {
      this.pos.copy(nextPos);
    } else {
      this.vspeed = 0;
      this.grounded = true;
    }


    this.updateCamera();
  }

  keyevent(k, b) {
    this.keys[k] = b; 
  }

  
}
