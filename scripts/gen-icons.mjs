// One-off icon generator: draws a simple football badge as raw RGBA pixels
// and PNG-encodes it with zlib (no native deps). Run with: node scripts/gen-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const BG = [15, 17, 21]; // matches --bg
const FOOTBALL = [79, 140, 255]; // matches --accent
const LACE = [232, 233, 236];

function drawIcon(size) {
  const buf = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * 0.42;
  const ry = size * 0.28;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const inEllipse = nx * nx + ny * ny <= 1;
      let color = BG;
      if (inEllipse) {
        color = FOOTBALL;
        // laces: a vertical line segment near center with small ticks
        const laceHalf = ry * 0.5;
        if (Math.abs(x - cx) <= Math.max(1, size * 0.012) && Math.abs(y - cy) <= laceHalf) {
          color = LACE;
        } else if (
          Math.abs(y - cy) <= Math.max(1, size * 0.012) &&
          Math.abs(x - cx) > size * 0.02 &&
          Math.abs(x - cx) <= size * 0.09 &&
          Math.abs(y - cy) <= laceHalf
        ) {
          color = LACE;
        }
      }
      buf[i] = color[0];
      buf[i + 1] = color[1];
      buf[i + 2] = color[2];
      buf[i + 3] = 255;
    }
  }
  return buf;
}

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type none
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const idat = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = process.argv[2] || "public/icons";
const sizes = [32, 180, 192, 512];
for (const size of sizes) {
  const rgba = drawIcon(size);
  const png = encodePng(rgba, size);
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`wrote ${outDir}/icon-${size}.png`);
}
