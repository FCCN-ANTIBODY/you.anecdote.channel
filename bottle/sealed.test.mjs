// node bottle/sealed.test.mjs — the sealed round trip: an identity from 32 bytes (the prf path, minus the
// authenticator), the bundle sealed to its recipient as a real age file, bottled, read back, opened.
import { readFileSync } from "node:fs";
import { generateIdentity } from "../anecdote.channel/composer/sign.mjs";
import { encodeIdentity, recipientOf, mintAgeIdentity } from "../anecdote.channel/composer/age-mint.mjs";
import { encrypt, decrypt } from "../anecdote.channel/composer/age-seal.mjs";
import { bottle, unbottle } from "./bottle.mjs";
import { parseBundle } from "./bundle.mjs";
let fails = 0; const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

// 1. an identity from arbitrary 32 bytes, the way prf hands them over
const scalar = crypto.getRandomValues(new Uint8Array(32));
const derived = encodeIdentity(scalar);
const derivedRecipient = await recipientOf(derived);
ok(/^AGE-SECRET-KEY-1/.test(derived) && /^age1/.test(derivedRecipient), "32 bytes -> " + derivedRecipient.slice(0, 16) + "…");

// 2. seal the published bundle to two recipients (one derived, one minted), bottle it, read it back, open it
const bundle = new Uint8Array(readFileSync("bottles/control.bundle"));
const other = await mintAgeIdentity();
const sealed = await encrypt([derivedRecipient, other.recipient], bundle);
ok(sealed.length > bundle.length && new TextDecoder().decode(sealed.subarray(0, 21)) === "age-encryption.org/v1", `an age v1 file of ${sealed.length} bytes, two stanzas`);
const signer = await generateIdentity();
const b = await bottle(sealed, signer, { kind: "age" });
const u = await unbottle(b.gif);
ok(u.ok && u.kind === "age", `bottled as ${b.frames} frames; read back verified`);
const opened = await decrypt(derived, u.bytes);
ok(opened.length === bundle.length && opened.every((v, i) => v === bundle[i]), "the derived identity opens it: the bytes are the bundle");
const opened2 = await decrypt(other.identity, u.bytes);
ok(opened2.length === bundle.length, "so does the other recipient");
ok(parseBundle(opened).refs[0].ref === "refs/heads/control", "and what is inside is the control branch");

// 3. a stranger cannot
const stranger = await mintAgeIdentity();
let refused = false; try { await decrypt(stranger.identity, u.bytes); } catch { refused = true; }
ok(refused, "an identity with no stanza is refused");
if (fails) { console.error(`${fails} failed`); process.exit(1); } console.log("sealed tests passed");
