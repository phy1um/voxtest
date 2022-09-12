
export function FontFromDownload(path: string, w: number, h: number) {
  const img = new Image();
  img.src = path;
  return new Font2D(img, w, h);
}

export class Font2D {
  
  img!: HTMLImageElement;
  charWidth!: number;
  charHeight!: number;
  charPerRow!: number;

  constructor(img: HTMLImageElement, w: number, h: number) {
    this.img = img;
    this.img.onload = () => {
      this.charPerRow = Math.floor(this.img.width / this.charWidth);
    }
    this.charWidth = w;
    this.charHeight = h;
  }

  putChar(ctx: CanvasRenderingContext2D, ind: number, x: number, y: number) {
    const ix = ind % this.charPerRow; 
    const iy = Math.floor(ind / this.charPerRow);
    ctx.drawImage(
      this.img,
      ix * this.charWidth, iy * this.charHeight, this.charWidth, this.charHeight,
      x, y, this.charWidth, this.charHeight);
  }

  putString(ctx: CanvasRenderingContext2D, msg: string, x: number, y: number) {
    for ( let i = 0; i < msg.length; i++ ) {
      const ord = msg.charCodeAt(i);
      if (ord == 10) {
        y += this.charHeight;
      } else {
        this.putChar(ctx, ord, x + (this.charWidth * i), y); 
      }
    }
  }

}
