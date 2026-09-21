// bottle/bundle.mjs — the v2 git bundle container: a header over a packfile.
//
//   # v2 git bundle
//   -<oid>                 (a prerequisite, zero or more: what the receiver must already have)
//   <oid> <refname>        (one or more)
//   <blank line>
//   PACK…                  (git-enough/unpack.mjs reads this part)
//
// The one item that goes both ways. Pure, browser-native; the pack is left to git-enough.

const td = new TextDecoder();

export function parseBundle(bytes) {
  let end = -1;
  for (let i = 0; i + 1 < bytes.length; i++) if (bytes[i] === 10 && bytes[i + 1] === 10) { end = i + 1; break; }
  if (end < 0) throw new Error("bundle: no header terminator");
  const lines = td.decode(bytes.subarray(0, end)).split("\n").filter(Boolean);
  const sig = lines.shift();
  if (sig !== "# v2 git bundle") throw new Error("bundle: not a v2 bundle: " + JSON.stringify(sig));
  const prerequisites = [], refs = [];
  for (const l of lines) {
    if (l.startsWith("-")) { prerequisites.push(l.slice(1).split(" ")[0]); continue; }
    const [oid, ref] = l.split(" ");
    if (!/^[0-9a-f]{40}$/.test(oid) || !ref) throw new Error("bundle: bad ref line " + JSON.stringify(l));
    refs.push({ oid, ref });
  }
  return { version: 2, prerequisites, refs, pack: bytes.subarray(end + 1) };
}
