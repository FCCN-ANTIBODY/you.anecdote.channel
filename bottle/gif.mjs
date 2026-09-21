// bottle/gif.mjs — a GIF89a codec for the STORED rendering of a bottle, and nothing more.
//
// bottles.anecdote.channel/README.md: the stored rendering is "a QR for ants" — one module to one pixel,
// no quiet zone, zero-frame-time GIF, read by a program that already holds the file. So this is a
// two-colour, full-frame, delay-0 animated GIF, encoded and decoded here in ~200 lines so the same code
// runs in Node (bin/publish) and in a tab (bottles/index.html) with nothing vendored. Index 1 is black,
// which is a module that is ON.
//
// Deliberately narrow: no interlace, no transparency, no local palettes on encode. Decode tolerates the
// standard extension blocks and a local palette, and rejects interlace by name rather than misreading it.

const te = new TextEncoder();

// ---- LZW ----------------------------------------------------------------------------------------------
// The GIF flavour: LSB-first bit packing, a CLEAR up front, the encoder widening its code just BEFORE it
// adds the entry that would not fit, the decoder widening just AFTER -- which keeps them in step because
// the decoder's table runs one entry behind the encoder's. KwKwK is the one code the decoder has not got
// yet: it is the previous string plus that string's own first byte.

function lzwEncode(indices, minCodeSize) {
  const CLEAR = 1 << minCodeSize, EOI = CLEAR + 1;
  const out = []; let cur = 0, shift = 0, codeSize = minCodeSize + 1, next = EOI + 1;
  const emit = (c) => { cur |= c << shift; shift += codeSize; while (shift >= 8) { out.push(cur & 255); cur >>>= 8; shift -= 8; } };
  let table = new Map();
  emit(CLEAR);
  if (!indices.length) { emit(EOI); if (shift) out.push(cur & 255); return Uint8Array.from(out); }
  let ib = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = (ib << 8) | k, c = table.get(key);
    if (c !== undefined) { ib = c; continue; }
    emit(ib);
    if (next === 4096) { emit(CLEAR); next = EOI + 1; codeSize = minCodeSize + 1; table = new Map(); }
    else { if (next >= (1 << codeSize)) codeSize++; table.set(key, next++); }
    ib = k;
  }
  emit(ib); emit(EOI);
  if (shift) out.push(cur & 255);
  return Uint8Array.from(out);
}

function lzwDecode(bytes, minCodeSize, expected) {
  const CLEAR = 1 << minCodeSize, EOI = CLEAR + 1;
  let next = EOI + 1, codeSize = minCodeSize + 1, mask = (1 << codeSize) - 1;
  const prefix = new Int32Array(4096), suffix = new Uint8Array(4096), len = new Int32Array(4096);
  for (let i = 0; i < CLEAR; i++) { prefix[i] = -1; suffix[i] = i; len[i] = 1; }
  const out = new Uint8Array(expected); let o = 0, cur = 0, bits = 0, p = 0, prev = -1;
  while (o < expected) {
    while (bits < codeSize) { if (p >= bytes.length) return out.subarray(0, o); cur |= bytes[p++] << bits; bits += 8; }
    const code = cur & mask; cur >>>= codeSize; bits -= codeSize;
    if (code === CLEAR) { next = EOI + 1; codeSize = minCodeSize + 1; mask = (1 << codeSize) - 1; prev = -1; continue; }
    if (code === EOI) break;
    const chase = code < next ? code : prev;
    if (chase < 0) throw new Error("gif: LZW code " + code + " before any string");
    const n = len[chase]; let c = chase;
    for (let j = n - 1; j >= 0; j--) { if (o + j < expected) out[o + j] = suffix[c]; c = prefix[c]; }
    const first = out[o]; o += n;
    if (code === next) { if (o < expected) out[o] = first; o++; }        // KwKwK
    if (prev >= 0 && next < 4096) { prefix[next] = prev; suffix[next] = first; len[next] = len[prev] + 1; next++; if (next >= (1 << codeSize) && codeSize < 12) { codeSize++; mask = (1 << codeSize) - 1; } }
    prev = code;
  }
  return out;
}

// ---- encode: frames of 0/1 matrices, all the same size ---------------------------------------------------

function u16(n) { return [n & 255, (n >> 8) & 255]; }
function subBlocks(bytes) { const out = []; for (let i = 0; i < bytes.length; i += 255) { const s = bytes.subarray(i, i + 255); out.push(s.length, ...s); } out.push(0); return out; }

// `frames`: array of matrices, matrix[r][c] truthy = black. Every frame must be the same size.
export function encodeGif(frames, { loop = true } = {}) {
  if (!frames.length) throw new Error("gif: no frames");
  const h = frames[0].length, w = frames[0][0].length;
  const out = [...te.encode("GIF89a"), ...u16(w), ...u16(h), 0x80, 0, 0, 255, 255, 255, 0, 0, 0];
  if (loop) out.push(0x21, 0xFF, 0x0B, ...te.encode("NETSCAPE2.0"), 3, 1, 0, 0, 0);
  for (const m of frames) {
    if (m.length !== h || m[0].length !== w) throw new Error("gif: frames differ in size");
    const idx = new Uint8Array(w * h); let k = 0;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) idx[k++] = m[r][c] ? 1 : 0;
    out.push(0x21, 0xF9, 4, 0, 0, 0, 0, 0);                        // GCE: no disposal, delay 0, no transparency
    out.push(0x2C, 0, 0, 0, 0, ...u16(w), ...u16(h), 0);          // image descriptor, global palette, no interlace
    out.push(2, ...subBlocks(lzwEncode(idx, 2)));                  // min code size 2 (the spec's floor)
  }
  out.push(0x3B);
  return new Uint8Array(out);
}

// ---- decode: back to matrices ---------------------------------------------------------------------------

export function decodeGif(bytes) {
  const rd = (i) => bytes[i] | (bytes[i + 1] << 8);
  if (String.fromCharCode(...bytes.subarray(0, 6)) !== "GIF89a" && String.fromCharCode(...bytes.subarray(0, 6)) !== "GIF87a") throw new Error("gif: not a GIF");
  const width = rd(6), height = rd(8), packed = bytes[10];
  let p = 13, global = null;
  if (packed & 0x80) { const n = 1 << ((packed & 7) + 1); global = bytes.subarray(p, p + 3 * n); p += 3 * n; }
  const frames = [];
  const dark = (pal, i) => (pal[3 * i] + pal[3 * i + 1] + pal[3 * i + 2]) < 384;
  while (p < bytes.length) {
    const b = bytes[p++];
    if (b === 0x3B) break;
    if (b === 0x21) { p++; while (bytes[p] !== 0) p += bytes[p] + 1; p++; continue; }   // any extension: skip its sub-blocks
    if (b !== 0x2C) throw new Error("gif: unexpected block 0x" + b.toString(16) + " at " + (p - 1));
    const left = rd(p), top = rd(p + 2), w = rd(p + 4), h = rd(p + 6), ip = bytes[p + 8]; p += 9;
    let pal = global;
    if (ip & 0x80) { const n = 1 << ((ip & 7) + 1); pal = bytes.subarray(p, p + 3 * n); p += 3 * n; }
    if (ip & 0x40) throw new Error("gif: interlaced frames are not a stored bottle");
    const minCode = bytes[p++];
    const parts = []; while (bytes[p] !== 0) { const n = bytes[p++]; parts.push(bytes.subarray(p, p + n)); p += n; } p++;
    const data = new Uint8Array(parts.reduce((a, s) => a + s.length, 0)); let o = 0; for (const s of parts) { data.set(s, o); o += s.length; }
    const idx = lzwDecode(data, minCode, w * h);
    const modules = []; let k = 0;
    for (let r = 0; r < h; r++) { const row = new Array(w); for (let c = 0; c < w; c++) row[c] = dark(pal, idx[k++]) ? 1 : 0; modules.push(row); }
    frames.push({ left, top, width: w, height: h, modules });
  }
  return { width, height, frames };
}
