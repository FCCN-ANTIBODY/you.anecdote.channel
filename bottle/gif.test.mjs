// node bottle/gif.test.mjs — the codec round-trips arbitrary two-colour frames, including the LZW edge cases
// (a run that fills the table, KwKwK, a clear mid-stream).
import { encodeGif, decodeGif } from "./gif.mjs";
let fails = 0; const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const rnd = (w, h, seed) => { let s = seed; const m = []; for (let r = 0; r < h; r++) { const row = []; for (let c = 0; c < w; c++) { s = (s * 1103515245 + 12345) >>> 0; row.push((s >> 16) & 1); } m.push(row); } return m; };
const same = (a, b) => a.length === b.length && a.every((row, r) => row.every((v, c) => v === b[r][c]));

for (const [w, h, n] of [[21, 21, 1], [73, 73, 12], [177, 177, 3], [5, 3, 2]]) {
  const frames = Array.from({ length: n }, (_, i) => rnd(w, h, 7 + i * 13));
  const gif = encodeGif(frames);
  const back = decodeGif(gif);
  ok(back.width === w && back.height === h && back.frames.length === n, `${w}x${h} x${n}: shape survives (${gif.length} bytes)`);
  ok(frames.every((f, i) => same(f, back.frames[i].modules)), `${w}x${h} x${n}: every module survives`);
}
// a long run, then noise: exercises the table filling and the clear
const run = Array.from({ length: 120 }, (_, r) => Array.from({ length: 120 }, (_, c) => (r < 60 ? 1 : (r * 31 + c * 17) % 3 === 0 ? 1 : 0)));
ok(same(run, decodeGif(encodeGif([run])).frames[0].modules), "120x120 run-then-noise survives");
ok(String.fromCharCode(...encodeGif([[[1]]]).subarray(0, 6)) === "GIF89a", "it is a GIF89a");
if (fails) { console.error(`${fails} failed`); process.exit(1); } console.log("gif tests passed");
