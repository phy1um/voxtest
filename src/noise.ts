function lerp(v0: number, v1: number, i: number) : number {
  return v0 + (v1 - v0) * i;
}

function smoothstep(t: number) : number {
  return t * t * (3 - 2*t);
}

type Vec2 = {
  x: number;
  y: number;
}

export class Perlin {
  width: number;
  height: number;
  scale: number;
  vectors: Array<Vec2>;

  constructor(w: number, h: number, s: number) {
    this.width = w;
    this.height = h;
    this.scale = s;
    this.vectors = new Array(w*h);
    for (let n = 0; n < this.vectors.length; n++) {
      const theta = 2 * Math.PI * Math.random();
      this.vectors[n] = {x: Math.cos(theta), y: Math.sin(theta)};
    }
  }

  vectorAt(x: number, y: number) : Vec2 {
    let xi = x % this.width;
    if (x < 0) {
      xi += this.width;
    }
    let yi = y % this.height;
    if (y < 0) {
      yi += this.height;
    }

    return this.vectors[yi * this.width + xi];
  }

  sample(x: number, y: number) : number {
    const xi = Math.floor(x / this.scale);
    const yi = Math.floor(y / this.scale);

    const v0 = this.vectorAt(xi, yi);
    const v1 = this.vectorAt(xi+1, yi);
    const v2 = this.vectorAt(xi, yi+1);
    const v3 = this.vectorAt(xi+1, yi+1);

    const xlocal = x - xi;
    const ylocal = y - yi;

    const d0 = v0.x * xlocal + v0.y * ylocal;
    const d1 = v1.x * (xlocal - 1) + v1.y * ylocal;
    const d2 = v2.x * xlocal + v2.y * (ylocal-1);
    const d3 = v3.x * (xlocal - 1) + v3.y * (ylocal - 1);

    const iv0 = lerp(d0, d1, xlocal);
    const iv1 = lerp(d2, d3, xlocal);
    return lerp(iv0, iv1, ylocal);
  }


}
