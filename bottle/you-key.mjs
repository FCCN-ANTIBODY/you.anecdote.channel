// bottle/you-key.mjs — the reader's age identity, from the passkey, on every visit, stored nowhere.
//
// anecdote.channel D12: masks are DERIVED, not separately enrolled -- one credential, per-purpose
// secrets from the WebAuthn prf extension with the purpose as the salt. This is that, for one purpose:
// the 32 bytes prf returns for this origin's salt ARE an age X25519 scalar (age itself uses 32 random
// bytes), so `encodeIdentity` turns them straight into an AGE-SECRET-KEY the composer's age battery
// opens files with. The public half is printed once, as the enrollment still, and goes into
// recipients.txt by a person's hand. That line is the arrangement.
//
// Two irreversibles, stated where they bite: the RP ID is location.hostname and a credential cannot
// move; prf must be asked for at create() or it is never available for that credential.
//
// THE FALLBACK IS LABELLED, NOT HIDDEN. Where prf is absent, `mintFallback` makes a random identity
// and keeps it in localStorage: a separately enrolled key, at rest in this browser, which D12 names as
// the deniable escape hatch and which is strictly weaker than the derived one. The page says which it
// is using.

import { encodeIdentity, recipientOf, mintAgeIdentity } from "../anecdote.channel/composer/age-mint.mjs";

const te = new TextEncoder();
const SALT = () => te.encode(location.hostname + "/age/v1");
const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));
const CRED = "you.credId";                // the credential id, so allowCredentials can name it (public, not secret)
const FALLBACK = "you.fallbackIdentity";  // only ever set by mintFallback

const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export function capabilities() {
  return { secure: !!window.isSecureContext, webauthn: typeof PublicKeyCredential !== "undefined", credId: localStorage.getItem(CRED), fallback: !!localStorage.getItem(FALLBACK) };
}

// Mint the passkey with prf requested. Returns { enabled } -- if prf came back disabled, the credential
// is useless for this and the caller should say so rather than fall through silently.
export async function enroll() {
  const c = await navigator.credentials.create({ publicKey: {
    rp: { id: location.hostname, name: "you" },
    user: { id: rnd(16), name: "you@" + location.hostname, displayName: "you" },
    challenge: rnd(32),
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    extensions: { prf: {} },
  }});
  const enabled = !!c.getClientExtensionResults().prf?.enabled;
  if (enabled) localStorage.setItem(CRED, b64u(c.rawId));
  return { enabled, credId: b64u(c.rawId) };
}

// The gesture: assert with prf evaluated at this origin's salt → an age identity, in memory only.
export async function derive() {
  const credId = localStorage.getItem(CRED);
  const a = await navigator.credentials.get({ publicKey: {
    challenge: rnd(32), rpId: location.hostname, userVerification: "required",
    allowCredentials: credId ? [{ type: "public-key", id: unb64u(credId) }] : [],
    extensions: { prf: { eval: { first: SALT() } } },
  }});
  const r = a.getClientExtensionResults().prf;
  if (!r || !r.results || !r.results.first) throw new Error("the authenticator returned no prf result for this credential");
  const identity = encodeIdentity(new Uint8Array(r.results.first));
  return { identity, recipient: await recipientOf(identity), source: "prf" };
}

export async function mintFallback() {
  let identity = localStorage.getItem(FALLBACK);
  if (!identity) { ({ identity } = await mintAgeIdentity()); localStorage.setItem(FALLBACK, identity); }
  return { identity, recipient: await recipientOf(identity), source: "fallback (at rest in this browser)" };
}
