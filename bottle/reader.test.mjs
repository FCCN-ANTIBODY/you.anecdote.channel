// node bottle/reader.test.mjs — the reader page's exact chain, on a bundle built here:
// GIF -> frames -> verified transfer -> bundle header -> readPack -> the commit and its files.
// Self-contained on purpose: this is the crux of the format, so it must prove itself from a bare
// clone rather than from an artifact somebody's node happened to publish.
import { generateIdentity } from "../anecdote.channel/composer/sign.mjs";
import { bottle, unbottle } from "./bottle.mjs";
import { parseBundle } from "./bundle.mjs";
import { makeBundle } from "./fixture.mjs";
import { readPack } from "../anecdote.channel/git-enough/unpack.mjs";
import { parseCommit, filesAt } from "../anecdote.channel/git-enough/read.mjs";
let fails = 0; const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

const fx = makeBundle();
const signer = await generateIdentity();
const made = await bottle(fx.bytes, signer, { kind: "git-bundle" });
ok(made.frames > 1, `${fx.bytes.length} B bundle -> ${made.frames} frames of v${made.version}, ${made.gif.length} B GIF`);

const u = await unbottle(made.gif);
ok(u.ok && u.by === signer.fingerprint, "the GIF verifies, by the identity that bottled it");
ok(u.decoded === made.frames, `every frame decoded (${u.decoded}/${made.frames})`);

const bundle = parseBundle(u.bytes);
ok(bundle.refs[0].oid === fx.tip && bundle.prerequisites.length === 0, "the bundle names the fixture's tip, whole");
const { objects, count } = await readPack(bundle.pack);
ok(objects.size === count && count >= 3, `readPack opened the pack: ${count} objects (browser-native inflate)`);
const c = parseCommit(objects.get(fx.tip).content);
ok(/^control: /.test(String(c.message)), "the tip is a control commit: " + String(c.message).trim());
const files = filesAt(objects, fx.tip).map((f) => f.path).sort();
ok(JSON.stringify(files) === JSON.stringify(fx.paths), "its files are exactly what went in: " + files.join(", "));
if (fails) { console.error(`${fails} failed`); process.exit(1); } console.log("reader tests passed");
