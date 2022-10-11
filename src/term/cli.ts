import { FontFromDownload } from "../2d/font";
import { OverlayState, OverlayController } from "../2d/menu";
import { ConnectToServer } from "../main";

const font = FontFromDownload("./img/font.png", 8, 16);
const PROMPT = [4, 0];

const cmds = {
  help: {
    text: "PRINT THIS MSG",
    action(c, args) {
      for (let k in cmds) {
        if (k === "help") {
          continue;
        }
        c.printLine(`+ ${k.toUpperCase()}`);
      }
      c.printLine("CMD LIST");
    }
  },
  controls: {
    text: "LIST CONTROLS",
    action(c) {
      c.printLine("+ SHAKE MOUSE TO EXIT");
      c.printLine("+ WASD TO MOVE");
      c.printLine("+ MOUSE TO LOOK");
    },
  },
  connect: {
    text: "CONNECT TO SERVER",
    action(c, args) {
      if (args.length < 2) {
        c.printLine("USAGE: CONNECT <SERVER>");
        return;
      }
      let serverTarget = args[1];
      if (serverTarget[0] == ":") {
        serverTarget = "ws://127.0.0.1" + serverTarget;
      }
      c.printLine(`CONNECTING TO "${serverTarget}"`)
      ConnectToServer(serverTarget);
    },
  },
};

export class Cmd implements OverlayState {

  cx: number = 0;
  cy: number = 0;
  buffer: Array<number> = [];
  lines: Array<Array<number>> = [];
  lineLimit: number = 10;

  constructor() {
    this.printLine("TYPE HELP FOR COMMANDS");
    this.printLine("");
    this.printLine("  VER 0.0.1");
    this.printLine("WELCOME TO TOM OS");
  }

  tick(controller: OverlayController, dt: number): void {
    
  }

  runCommand(buf) {
    const msg = String.fromCharCode(...buf).toLowerCase();
    if (msg === "rm -rf /") {
      this.printLine(":)");
      this.printLine("DELETING SYSTEM32");
      return;
    }
    const args = msg.split(" ");
    const cmd = args[0];
    if (! (cmd in cmds)) {
      this.printLine("UNKNOWN COMMAND: " + cmd);
      return;
    }
    cmds[cmd].action(this, args);
  }

  printLine(msg: string) {
    const ords = [];
    for (let i = 0; i < msg.length; i++) {
      ords.push(msg.charCodeAt(i));
    }
    this.lines.push(ords);
  }

  prompt(ctx: CanvasRenderingContext2D) {
    font.putStringOrds(ctx, PROMPT, 0, 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.prompt(ctx);
    font.putStringOrds(ctx, this.buffer, PROMPT.length * font.charWidth, 0);
    for (let i = 0; i < this.lineLimit; i++) {
      if (i >= this.lines.length) {
        return;
      }
      font.putStringOrds(ctx, this.lines[this.lines.length - 1 - i], 0, font.charHeight * (i+1));
    }
  }

  key(k: string): void {
    k = k.toUpperCase();
    if (k === "BACKSPACE") {
      this.buffer.unshift();
      return;
    }
    let ord = k.charCodeAt(0);
    if (k === "ENTER") {
      ord = 10;
    }
    if (k === "SHIFT" || k === "CONTROL" || k === "ALT") {
      return;
    }
    console.log(`typed ${k} (-> ${ord})`);
    if (ord === 10) {
      this.lines.push(this.buffer);      
      this.runCommand(this.buffer);
      this.buffer = [];
    } else {
      this.buffer.push(ord);
    }
  }

  click(x: number, y: number): void {}
}


