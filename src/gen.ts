
import {Chunk, CHUNK_DIM} from "./chunk";
import {Perlin} from "./noise";

const p = new Perlin(48, 48, 1);

export function basicPopulate(chunk: Chunk) {
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
        const ri = Math.random()*3 + 1;
        chunk.set(xx, yy, zz, ri);
      }
    }
  }
}
