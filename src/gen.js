
import {CHUNK_DIM} from "./game.js";
import {Perlin} from "./noise.js";

const p = new Perlin(48, 48, 1);

export function basicPopulate(chunk) {
  const wox = chunk.wx * CHUNK_DIM;
  const woz = chunk.wy * CHUNK_DIM;
  for(let xx = 0; xx < CHUNK_DIM; xx++) {
    for(let zz = 0; zz < CHUNK_DIM; zz++) {
      const xi = (xx + wox) / CHUNK_DIM;
      const zi = (zz + woz) / CHUNK_DIM;
      const h = p.sample(xi, zi);
      const hz = (h + 1.0) / 2.0;
      const cap = hz * CHUNK_DIM * 0.8;
      for(let yy = 0; yy <= cap; yy++) {
        chunk.set(xx, yy, zz, 1);
      }
    }
  }
}
