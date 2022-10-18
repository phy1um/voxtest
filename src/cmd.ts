
export const CMDs = {
  "NOP": 1,

  "REQ_CHUNK": 0x10,
  "CHUNKDATA": 0x11,

  "PSTAT": 0x20,
  "EDESCRIBE": 0x30,

  "CHALLENGE": 0x80,
  "AUTH": 0x81,
  "CHALLENGE_STATUS": 0x82,
  "CLIENT_SPAWN": 0x83,
};

const CMDByValue = {};

for (let k in CMDs) {
  const v = CMDs[k]; 
  CMDByValue[v] = k;
}

export function Name(n: number) {
  return CMDByValue[n];
}
