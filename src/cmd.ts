
export const CMDs = {
  "NOP": 1,
  "AUTH": 2,
  "REQ_CHUNK": 0x10,
  "CHUNKDATA": 0x11,
  "PSTAT": 0x20,
  "EDESCRIBE": 0x30,
};

const CMDByValue = {};

for (let k in CMDs) {
  const v = CMDs[k]; 
  CMDByValue[v] = k;
}

export function Name(n: number) {
  return CMDByValue[n];
}
