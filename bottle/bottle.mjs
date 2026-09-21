// bottle/bottle.mjs — bytes → the stored bottle (a GIF of QR frames), and back, with the camera off.
//
// The identity property the operator named: transferring the QR video IS transferring the bytes. So
// the encoder and the reader are the same modules the press would use with a camera — transfer.mjs's
// signed envelope, carrier.mjs's frame strings and session, qr-enough's matrices — composed here with a
// GIF where a screen would be. Nothing new is defined; a stored bottle is a recording of a broadcast.
//
// BLOCKS, NOT DROPLETS, for the stored form: a file has no frame loss, and a block cut with no loss is
// exactly its floor — zero overhead (#244's finding). ecLevel L for the same reason: the reader is a
// program holding the file, and Reed–Solomon inside each code is repair for a camera that is not there.

import { packTransfer, verifyTransfer, transferId } from "../anecdote.channel/composer/transfer.mjs";
import { frameTransfer, carrierSession } from "../anecdote.channel/composer/carrier.mjs";
import { encodeQR, chooseVersion } from "../anecdote.channel/composer/qr-encode.mjs";
import { decodeMatrix } from "../anecdote.channel/composer/qr-decode.mjs";
import { encodeGif, decodeGif } from "./gif.mjs";

const te = new TextEncoder(), td = new TextDecoder();

// Every frame is cut to the SAME QR version -- the largest any of them needs -- so the GIF is one size.
export async function bottle(bytes, identity, { kind = "bytes", blockSize = 256, ecLevel = "L" } = {}) {
  const signed = await packTransfer(kind, bytes, identity);
  const strings = await frameTransfer(signed, blockSize);
  const version = Math.max(...strings.map((s) => chooseVersion(te.encode(s).length, ecLevel)));
  const codes = strings.map((s) => encodeQR(s, { ecLevel, version }));
  const gif = encodeGif(codes.map((c) => c.modules));
  return { gif, signed, id: await transferId(signed), frames: strings.length, version, size: codes[0].size, ecLevel, blockSize };
}

// The reader. Returns { ok, bytes, by, kind, frames, decoded, errors, snapshot }.
export async function unbottle(gifBytes, { friends = [] } = {}) {
  const { frames } = decodeGif(gifBytes);
  const session = carrierSession({ friends });
  let decoded = 0; const errors = [];
  for (const f of frames) {
    const r = decodeMatrix(f.modules);
    const text = r == null ? null : typeof r === "string" ? r : (r.text ?? (r.bytes ? td.decode(r.bytes) : null));
    if (text == null) { errors.push("frame did not decode"); continue; }
    decoded++;
    await session.feed(text);
  }
  const result = await session.result();
  if (!result.ok) return { ok: false, bytes: null, frames: frames.length, decoded, errors: [...errors, result.reason], snapshot: result.snapshot };
  const [t] = result.transfers;
  const v = t.verify;
  return { ok: v.ok, bytes: v.bytes, by: v.by, kind: v.kind, trusted: v.trusted, frames: frames.length, decoded,
           errors: [...errors, ...v.errors], foreign: result.foreign, signed: t.signed };
}
