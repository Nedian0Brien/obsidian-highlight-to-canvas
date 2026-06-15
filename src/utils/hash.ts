export async function createStableFingerprint(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await sha256(bytes);
  return `sha256:${toHex(digest)}`;
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest("SHA-256", toArrayBuffer(bytes));
    return new Uint8Array(digest);
  }
  return sha256Fallback(bytes);
}

function sha256Fallback(message: Uint8Array): Uint8Array {
  const words = bytesToWords(padMessage(message));
  const hash = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19
  ];

  const schedule = new Array<number>(64);
  for (let offset = 0; offset < words.length; offset += 16) {
    for (let i = 0; i < 16; i += 1) schedule[i] = words[offset + i];
    for (let i = 16; i < 64; i += 1) {
      schedule[i] = add(smallSigma1(schedule[i - 2]), schedule[i - 7], smallSigma0(schedule[i - 15]), schedule[i - 16]);
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const t1 = add(h, bigSigma1(e), choose(e, f, g), SHA256_K[i], schedule[i]);
      const t2 = add(bigSigma0(a), majority(a, b, c));
      h = g;
      g = f;
      f = e;
      e = add(d, t1);
      d = c;
      c = b;
      b = a;
      a = add(t1, t2);
    }

    hash[0] = add(hash[0], a);
    hash[1] = add(hash[1], b);
    hash[2] = add(hash[2], c);
    hash[3] = add(hash[3], d);
    hash[4] = add(hash[4], e);
    hash[5] = add(hash[5], f);
    hash[6] = add(hash[6], g);
    hash[7] = add(hash[7], h);
  }

  const digest = new Uint8Array(32);
  hash.forEach((word, index) => {
    digest[index * 4] = word >>> 24;
    digest[index * 4 + 1] = word >>> 16;
    digest[index * 4 + 2] = word >>> 8;
    digest[index * 4 + 3] = word;
  });
  return digest;
}

function padMessage(message: Uint8Array): Uint8Array {
  const bitLength = message.length * 8;
  const paddedLength = Math.ceil((message.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);
  return padded;
}

function bytesToWords(bytes: Uint8Array): number[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const words: number[] = [];
  for (let offset = 0; offset < bytes.length; offset += 4) {
    words.push(view.getUint32(offset));
  }
  return words;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function add(...values: number[]): number {
  return values.reduce((sum, value) => (sum + value) >>> 0, 0);
}

function rotateRight(value: number, shift: number): number {
  return (value >>> shift) | (value << (32 - shift));
}

function choose(x: number, y: number, z: number): number {
  return (x & y) ^ (~x & z);
}

function majority(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z);
}

function bigSigma0(x: number): number {
  return rotateRight(x, 2) ^ rotateRight(x, 13) ^ rotateRight(x, 22);
}

function bigSigma1(x: number): number {
  return rotateRight(x, 6) ^ rotateRight(x, 11) ^ rotateRight(x, 25);
}

function smallSigma0(x: number): number {
  return rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3);
}

function smallSigma1(x: number): number {
  return rotateRight(x, 17) ^ rotateRight(x, 19) ^ (x >>> 10);
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];
