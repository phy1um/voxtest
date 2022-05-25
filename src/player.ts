import * as THREE from "three";
import {World} from "./world.js";

const PSPEED = 8.2;
const PACC = 3.2;
const PGRAV = 0.98;
const PVMAX = -12;
const FOOTOFFSET = -0.6;

const MSCALE_X = -0.001;
const MSCALE_Y = 0.001;

const AXIS_Y = new THREE.Vector3(0,1,0);
const AXIS_X = new THREE.Vector3(1,0,0);

function boxFree(v) {
  return World.pointFree(v.x - 0.5, v.y, v.z - 0.5)
    && World.pointFree(v.x + 0.5, v.y, v.z - 0.5)
    && World.pointFree(v.x - 0.5, v.y, v.z + 0.5)
    && World.pointFree(v.x + 0.5, v.y, v.z + 0.5);
}

export class Player {
  pos: THREE.Vector3;
  fwd: THREE.Vector3;
  rotX: number;
  rotY: number;
  camera: any;
  velocity: THREE.Vector3;
  vspeed: number;
  floatTime: number;
  grounded: boolean;
  keys: Map<string, boolean>;

  constructor(x, y, z) {
    this.pos = new THREE.Vector3(x, y, z);
    this.fwd = new THREE.Vector3(0,0,1);
    this.rotX = 0;
    this.rotY = 0;
    this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
    this.velocity = new THREE.Vector3(0,0,0);
    this.vspeed = 0;
    this.floatTime = 0;
    this.keys = new Map<string,boolean>(); 
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
    fwd.applyAxisAngle(AXIS_X, this.rotX);
    fwd.applyAxisAngle(AXIS_Y, this.rotY);
    fwd.add(this.pos);
    this.camera.lookAt(fwd);
  }

  update(dt) {

    const wishdir = new THREE.Vector3();

    if (this.keys["w"]) {
      wishdir.z = 1;
    } 
    if (this.keys["s"]) {
      wishdir.z -= 1; 
    }
    if (this.keys["a"]) {
      wishdir.x = 1;
    }
    if (this.keys["d"]) {
      wishdir.x -= 1;
    }

    wishdir.normalize();
    wishdir.applyAxisAngle(AXIS_Y, this.rotY);

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
      foot.y += FOOTOFFSET;
      if (World.pointFree(foot.x, foot.y, foot.z)) {
        this.grounded = false;
      }
      if (this.keys[" "]) {
        this.grounded = false;
        this.vspeed = 20;
        this.floatTime = 0.09;
        console.log("jump!");
        this.keys[" "] = false;
      }
    } else if (this.floatTime <= 0) {
      this.vspeed = Math.max(this.vspeed - PGRAV, PVMAX);
    }

    const fv = new THREE.Vector3();
    fv.copy(this.velocity);
    fv.multiplyScalar(dt);

    const nextPos = new THREE.Vector3();
    nextPos.copy(this.pos);
    nextPos.add(fv);

    if (boxFree(nextPos)) {
      this.pos.copy(nextPos);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    nextPos.copy(this.pos); 
    nextPos.y += this.vspeed*dt;

    if (World.pointFree(nextPos.x, nextPos.y + FOOTOFFSET, nextPos.z)) {
      this.pos.copy(nextPos);
    } else {
      this.vspeed = 0;
      this.grounded = true;
    }

    this.updateCamera();

    this.floatTime -= dt;
  }

  keyevent(k, b) {
    this.keys[k] = b; 
  }

  mouse(dx, dy) {
    this.rotY = (this.rotY + dx*MSCALE_X) % 6.3; 
    this.rotX = clampf(this.rotX + dy*MSCALE_Y, -1.4, 1.4);
  }
  
}

function clampf(v, mi, ma) {
  if (v < mi) {
    return mi;
  } else if (v > ma) {
    return ma;
  }
  return v;
}
