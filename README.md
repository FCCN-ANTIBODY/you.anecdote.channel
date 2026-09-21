# you.anecdote.channel

**The control point: one origin whose only job is to be the HTTPS context a passkey can be meaningful in, and the index of the channels it will answer for.**

> Provisioned 2026-09-21. The address `you.<apex>` was ruled on 2026-09-02 in
> `anecdote.channel/docs/decisions.md` **D12**: *the keeper moves to `you.<apex>`, and that is the RP ID.*
> This repository is that place, as an engine. The first instance of it is `you.discoverywritten.com`
> (`you.yml`); the canonical `you.anecdote.channel` is not served and is not important yet.

## Why it exists on station-node

It is mounted as `.you-engine`, following the `.<subdomain>-engine` convention, so that the
control point is an **official configurator** of the node rather than a page somebody remembers.
`you.yml` is the configuration, and the one field in it that matters is decide-once.

## The primitive, in one paragraph

Two phones held face to face. The item is a git bundle — a slice of history one side fetches from —
and it goes **both ways** through the same optical channel. Ours to theirs is the clone: big, a QR
stream. Theirs to ours is one commit carrying a passkey public half and a signature: a few hundred
bytes, **one still, one glance**. Nothing in that needs a network, a server, or GitHub; GitHub is a
later-stage proof for the fat direction when it happens to be up. First contact is the enrollment.
After it, reading can happen from anywhere; presence was required to *become* a recipient, not to
stay one.

What makes the passkey load-bearing rather than theater is the WebAuthn **`prf`** extension: 32
stable bytes only that authenticator can produce, from which a reader keypair is derived on every
visit and stored nowhere. That is `git-enough/held-token.mjs`'s crown with a return value.

## What is here today

    you.yml          the instance: url (= RP ID, decide-once), control branch, probe origin
    index.html       the root. Shows the origin it is AT beside the one you.yml MEANT.
    channels.json    the index of allowed channels. Empty, truthfully.
    probe/prf.html   the one experiment that gates everything: does prf answer on this phone?
    wrangler.jsonc   the Pages project. No build; the repository is the site.
    bottle/          gif.mjs (the stored rendering's codec), bundle.mjs (the v2 header), bottle.mjs
                     (bytes -> GIF of QR frames -> bytes, over the mounted composer). Tests beside them.
    bottles/         the published control bottle: control.bundle, control.gif, control.json, and the
                     reader page that opens it in the tab with the camera off. GENERATED AND COMMITTED.
    recipients.txt   THE ARRANGEMENT: <moniker>  <age1…> per line; who may open a sealed bottle
    bottle/you-key.mjs  the reader's age identity from the passkey (prf, salt = this origin), never stored;
                     a labelled at-rest fallback where prf is absent
    bin/control      (re)make refs/heads/control: one orphan commit, force-pushed, the payload
    bin/publish      bundle that branch, sign it, cut it into the GIF, read it back before saying done
    bin/test         the suites in bottle/
    mounts.txt       which directories of each submodule are the site
    bin/mount        apply that: a sparse checkout, re-applied by a verb
    bin/deploy       upload it from the workstation. Refuses a fat mount.
    anecdote.channel the tools shelf and the press — eight entries of the apex, ~2.8 MB of its 50
    _redirects       two rewrites so the press skins find the apex's assets under the mount
    _headers         nothing is kept at the edge; a deploy is what you get. It says why.

## The bottle, as built

`bin/control init` writes an orphan commit; `bin/publish` runs `git bundle create - refs/heads/control`,
wraps the bytes in `transfer.mjs`'s signed envelope, cuts them with `carrier.mjs` into block frames
(blocks, not droplets: a file loses nothing, and a lossless block cut is exactly its floor), renders each
frame with `qr-enough` at one QR version for all, and writes them as a two-colour, one-module-per-pixel,
delay-0 GIF — the *stored* rendering `bottles.anecdote.channel` describes. Then it reads that GIF back
with the page's own reader and refuses to finish unless the bytes match. 723 bytes of bundle became a
5.2 KB GIF of six 73-px frames on 2026-09-21.

The signer is a device-minted Ed25519 key outside the repository. It says *this station bottled these
bytes*; it is not the operator's passkey and is not the workload credential.

## The sealed bottle, as built

The passkey is the master identity; the workload credential is derived from it. `prf` evaluated at
this origin's salt returns 32 bytes, which are an age X25519 scalar, so `encodeIdentity` makes an
`AGE-SECRET-KEY` of them on every visit and nothing is ever at rest. Its public `age1…` half is the
enrollment still. `recipients.txt` is where a person writes it down, and that line is the arrangement.
`bin/publish` then seals the bundle **once** as a real age v1 file (`composer/age-seal.mjs`, one stanza
per recipient), and bottles that exactly like the clear one — encrypt, then cut. The page opens it
with the derived identity and shows the same clone. Removing a line and republishing is revocation;
a stranger's identity is refused (`bottle/sealed.test.mjs`).

## What is not

- The still that comes back *as a commit*: today the enrollment still carries only the recipient
  string, read by a person into `recipients.txt`; a signed one-commit bundle scanned at the station is
  the next form of it.
- One control branch per recipient, so a force-push revokes one rather than everyone.
- The per-channel salt: one identity per origin today; `prf(salt = channel)` per workload is a loop
  over this, not a new mechanism.

## Revocation is an empty branch

The control branch is force-pushed and carries one commit. Killing it revokes every reader at once,
and there is no need to truncate anything to stop a thing being viewed: **a pristine empty QR of any
age is the same bytes as any other.** Old artifacts still open their old bytes and never advance.
That is the design, not a limitation to engineer around.
