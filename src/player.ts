import * as THREE from "three";
import { Entity } from "./game/entity";
import { KeyHandler } from "./game/terminal";
import {World} from "./world";

const PSPEED = 8.2;
const PACC = 3.2;
const PGRAV = 0.98;
const PVMAX = -12;
//const PGRAV = 0;
//const PVMAX = 0;
const FOOTOFFSET = -0.6;
const FOV = 50;

const MSCALE_X = -0.001;
const MSCALE_Y = 0.001;

const AXIS_Y = new THREE.Vector3(0,1,0);
const AXIS_X = new THREE.Vector3(1,0,0);

export class Player implements Entity {
  pos: THREE.Vector3;
  fwd: THREE.Vector3;
  rotX: number;
  rotY: number;
  camera: THREE.PerspectiveCamera;
  velocity: THREE.Vector3;
  vspeed: number;
  floatTime: number;
  grounded: boolean;
  keys: Map<string, boolean>;
  wishDir: THREE.Vector3;
  nextPos: THREE.Vector3;
  working: THREE.Vector3;
  foot: THREE.Vector3;
  focus: KeyHandler;
  focusDebounce: number = 0;
  freeCount: number = 0;
  freeTimer: number = 0;
  world: World;

  constructor(x, y, z) {
    this.pos = new THREE.Vector3(x, y, z);
    this.fwd = new THREE.Vector3(0,0,1);
    this.rotX = 0;
    this.rotY = Math.PI;
    this.camera = new THREE.PerspectiveCamera(FOV, 16/9, 0.1, 1000);
    this.velocity = new THREE.Vector3(0,0,0);
    this.vspeed = 0;
    this.floatTime = 0;
    this.keys = new Map<string,boolean>(); 
    this.updateCamera();
    this.wishDir = new THREE.Vector3();
    this.nextPos= new THREE.Vector3();
    this.working = new THREE.Vector3();
    this.foot = new THREE.Vector3();
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

  tick(dt: number, world: any): void {

    this.wishDir.set(0,0,0);

    if (this.keys["."]) {
      console.dir(this.pos);
    }

    if (this.keys["w"]) {
      this.wishDir.z = 1;
    } 
    if (this.keys["s"]) {
      this.wishDir.z -= 1; 
    }
    if (this.keys["a"]) {
      this.wishDir.x = 1;
    }
    if (this.keys["d"]) {
      this.wishDir.x -= 1;
    }

    if (this.focus !== undefined) {
      this.wishDir.set(0,0,0);
    }

    this.wishDir.normalize();
    this.wishDir.applyAxisAngle(AXIS_Y, this.rotY);

    if (this.wishDir.length() > 0.2) {
      this.wishDir.multiplyScalar(PACC);
      this.velocity.add(this.wishDir);
      if (this.velocity.length() > PSPEED) {
        this.velocity.multiplyScalar(PSPEED / this.velocity.length());
      }
    } else {
      this.velocity.multiplyScalar(0.4);
    }

    if (this.grounded) {
      this.vspeed = 0;
      this.foot.copy(this.pos);
      this.foot.y += FOOTOFFSET;
      if (world.pointFree(this.foot.x, this.foot.y, this.foot.z)) {
        this.grounded = false;
      }
      if (this.keys[" "]) {
        this.grounded = false;
        this.vspeed = 17;
        this.floatTime = 0.09;
        console.log("jump!");
        this.keys[" "] = false;
      }
    } else if (this.floatTime <= 0) {
      this.vspeed = Math.max(this.vspeed - PGRAV, PVMAX);
    }

    this.working.copy(this.velocity);
    this.working.multiplyScalar(dt);

    this.nextPos.copy(this.pos);
    this.nextPos.add(this.working);

    if (this.boxFree(world, this.nextPos)) {
      this.pos.copy(this.nextPos);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.nextPos.copy(this.pos); 
    this.nextPos.y += this.vspeed*dt;

    if (world.pointFree(this.nextPos.x, this.nextPos.y + FOOTOFFSET, this.nextPos.z)) {
      this.pos.copy(this.nextPos);
    } else {
      this.vspeed = 0;
      this.grounded = true;
    }

    this.updateCamera();

    this.floatTime -= dt;
    this.focusDebounce -= dt;
    this.freeTimer -= dt;
    if (this.freeTimer < 0) {
      this.freeCount = 0;
    }
  }

  keyevent(k, b) {
    if (k === "Escape" && this.focus) {
      this.clearFocus();
    }

    if (this.focus) {
      if (b) {
        this.focus.key(k);
      }
      return;
    }
    this.keys[k] = b; 
  }

  mouse(dx, dy) {
    if (this.focus) {
      if (Math.abs(dx) > 200 || Math.abs(dy) > 200) {
        this.freeCount += 1;
        this.freeTimer = 1;
        if (this.freeCount > 3) {
          this.clearFocus();
        }
      }
      return;
    }
    this.rotY = (this.rotY + dx*MSCALE_X) % 6.3; 
    this.rotX = clampf(this.rotX + dy*MSCALE_Y, -1.4, 1.4);
  }

  addToScene(_: THREE.Scene): void {
    // pass
    return;
  }
  removeFromScene(_: THREE.Scene): void {
    // pass;
    return;
  }

  setFocus(k: KeyHandler): void {
    if (this.focusDebounce < 0) {
      this.focus = k;
    }
  }

  clearFocus() {
    this.focus = undefined;
    this.focusDebounce = 1.2;
  }

  bindListeners() {
    document.addEventListener("keydown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keyevent(e.key, true);
      return false;
    });
    document.addEventListener("keyup", (e) => {
      this.keyevent(e.key, false);
    });
    document.addEventListener("mousemove", (e) => {
      this.mouse(e.movementX, e.movementY);
    });
  }

  bindWorld(world: World): void {
    console.log("bind world to player!");
    this.world = world;
  }

  boxFree(world, v) {
    return world.pointFree(v.x - 0.5, v.y, v.z - 0.5)
      && world.pointFree(v.x + 0.5, v.y, v.z - 0.5)
      && world.pointFree(v.x - 0.5, v.y, v.z + 0.5)
      && world.pointFree(v.x + 0.5, v.y, v.z + 0.5);
  }


  updateFromDescribe(flags: any, data: Uint32Array): void {

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
