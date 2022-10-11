import { FontFromDownload } from "./font";

const font = FontFromDownload("./img/font.png", 8, 16);

export interface OverlayState {
  tick(controller: OverlayController, dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  key(k: string): void;
  click(x: number, y: number): void;
}

export class OverlayController {

  dom!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  state!: Array<OverlayState>;
  
  constructor() {
    this.state = [];
    this.dom = document.createElement("canvas");
    this.dom.width = 640;
    this.dom.height = 480;
    this.dom.className = "displayCanvas";
    this.ctx = this.dom.getContext("2d");
  } 

  pushState(st: OverlayState) {
    this.state.unshift(st);
  }

  popState() {
    this.state.shift();
  }

  show() {
    this.dom.hidden = false;
  }


  hide() {
    this.dom.hidden = true;
  }

  draw() {
    if (this.state.length == 0) {
      return;
    }
    this.state[0].draw(this.ctx);
  }

  key(k: string) {
    this.state[0].key(k);
  }

}

export class MenuState implements OverlayState {

  items: Array<MenuOption> = []; 
  cursor: number = 0;
  bg: string;

  constructor(background: string = "#000000aa") {
    this.bg = background;
  }

  key(k: string): void {
    k = k.toLowerCase();
    if (k === "arrowup") {
      this.cursor = Math.max(0, this.cursor - 1) 
    }
    else if (k === "arrowdown") {
        this.cursor = Math.min(this.items.length, this.cursor + 1) 
    }
    else if (k === "enter") {
      this.items[this.cursor].action(); 
    }
  }

  click(x: number, y: number): void {
  }

  tick(controller: OverlayController, dt: number): void {
    
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, 1000, 1000);
    let xo = 40;
    let yo = 40;
    for ( let i = 0; i < this.items.length; i++ ) {
      const o = this.items[i];
      const yOffset = (font.charHeight + 5) * i;
      if ( this.cursor === i ) {
        ctx.fillStyle = "#ffffff"; 
        ctx.fillRect(20, yo + yOffset + 7, 5, 5);
      }
      font.putString(ctx, o.text, xo, yo + (font.charHeight + 5) * i);          
    }
  }

  addOption(name: string, onClick: Function): void {
    this.items.push(new MenuOption(name, onClick));
  }

}

class MenuOption {
  text!: string;
  action!: Function;

  constructor(text: string, action: Function) {
    this.text = text;
    this.action = action;
  }

}
