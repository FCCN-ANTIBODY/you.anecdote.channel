// node bottle/reader.test.mjs — the reader page's exact chain, on the published bottle, in Node:
// GIF -> frames -> verified transfer -> bundle header -> readPack -> the commit and its files.
// bin/publish proves the bytes come back; this proves the bytes are a repository a tab can open.
import { readFileSync } from "node:fs";
import { unbottle } from "./bottle.mjs";
import { parseBundle } from "./bundle.mjs";
import { readPack } from "../anecdote.channel/git-enough/unpack.mjs";
import { parseCommit, filesAt } from "../anecdote.channel/git-enough/read.mjs";
let fails = 0; const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

const manifest = JSON.parse(readFileSync("bottles/control.json", "utf8"));
const u = await unbottle(new Uint8Array(readFileSync("bottles/" + manifest.gif.file)));
ok(u.ok && u.by === manifest.transfer.by, "the published GIF verifies, by the published signer");
const bundle = parseBundle(u.bytes);
ok(bundle.refs[0].oid === manifest.tip && bundle.prerequisites.length === 0, "the bundle names the published tip, whole");
const { objects, count } = await readPack(bundle.pack);
ok(objects.size === count && count >= 3, `readPack opened the pack: ${count} objects (browser-native inflate)`);
const c = parseCommit(objects.get(manifest.tip).content);
ok(/^control: /.test(String(c.message)), "the tip is a control commit: " + String(c.message).trim());
const files = filesAt(objects, manifest.tip).map((f) => f.path);
ok(files.includes("CONTROL.md") && files.includes("channels.json"), "its files are there: " + files.join(", "));
if (fails) { console.error(`${fails} failed`); process.exit(1); } console.log("reader tests passed");
