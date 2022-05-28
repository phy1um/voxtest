
export class ReadWire {
  _stream: Uint8Array;
  _head: number;

  constructor(buffer: ArrayBuffer) {
    this._stream = new Uint8Array(buffer); 
    this._head = 0;
    console.log(this._stream);
  }

  getU8() :number {
    if (this._head >= this._stream.length) {
      throw Error("bad");
    }
    const rv = this._stream[this._head];
    this._head += 1;
    return rv;
  }

  getU16() : any {
    return this._getNum(2);
  }

  getU32() : any {
    return this._getNum(4);
  }

  getU64() : any {
    return this._getNum(8);
  } 

  _getNum(n: number) {
    while(this._head % n != 0) {
      this._head += 1;
    }
    if (n > 6) {
      let res = 0n;
      for(let i = 0n; i < n; i++) {
        res += BigInt(this.getU8()) << (8n * i);
      }
      return res;
    } else {
      let res = 0;
      for(let i = 0; i < n; i++) {
        res += this.getU8() << (8*i);
      }
      return res;
    }
  }

  _getArray(f: Function, w: Function, n: number) : any {
    const ul = [];
    for(let i = 0; i < n; i++) {
      ul.push(f());
    }
    return w(ul);
  }

  getU8Array(n: number) : Uint8Array {
    return this._getArray(this.getU8, (b: ArrayBuffer) => new Uint8Array(b), n);
  }

  getU16Array(n: number) : Uint16Array {
    return this._getArray(this.getU16, (b: ArrayBuffer) => new Uint16Array(b), n);
  }

  getU32Array(n: number) : Uint32Array {
    return this._getArray(this.getU32, (b: ArrayBuffer) => new Uint32Array(b), n);
  }
}

