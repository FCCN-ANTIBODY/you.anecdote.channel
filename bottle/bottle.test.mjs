// node bottle/bottle.test.mjs — bytes go into a GIF and come back out verified, camera off.
import { generateIdentity } from "../anecdote.channel/composer/sign.mjs";
import { bottle, unbottle } from "./bottle.mjs";
import { parseBundle } from "./bundle.mjs";
let fails = 0; const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

const id = await generateIdentity();
const payload = new Uint8Array(1500); for (let i = 0; i < payload.length; i++) payload[i] = (i * 7919 + 13) & 255;
const b = await bottle(payload, id, { kind: "test-bytes" });
ok(b.frames > 1, `cut into ${b.frames} frames of v${b.version} (${b.size}px), ${b.gif.length} byte GIF`);
const u = await unbottle(b.gif);
ok(u.ok, "reader verifies the transfer: " + (u.errors.join("; ") || "no errors"));
ok(u.decoded === b.frames, `every frame decoded (${u.decoded}/${b.frames})`);
ok(u.by === id.fingerprint, "signed by the identity that bottled it");
ok(u.kind === "test-bytes", "kind survives");
ok(u.bytes && u.bytes.length === payload.length && u.bytes.every((v, i) => v === payload[i]), "the bytes are the bytes");

const hdr = "# v2 git bundle\n-" + "a".repeat(40) + " prereq\n" + "b".repeat(40) + " refs/heads/control\n\nPACKxyz";
const p = parseBundle(new TextEncoder().encode(hdr));
ok(p.prerequisites.length === 1 && p.refs[0].ref === "refs/heads/control" && new TextDecoder().decode(p.pack) === "PACKxyz", "bundle header parses; the pack is what follows");
if (fails) { console.error(`${fails} failed`); process.exit(1); } console.log("bottle tests passed");
