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
    mounts.txt       which directories of each submodule are the site
    bin/mount        apply that: a sparse checkout, re-applied by a verb
    bin/deploy       upload it from the workstation. Refuses a fat mount.
    anecdote.channel the tools shelf — git-enough/ and composer/ of the apex, 1.7 MB of its 50

## What is not

- The bundle header in `git-enough` (a v2 bundle is a four-line header over `packRepo`'s output).
- The QR gif of a control branch's HEAD, and the still that comes back.
- Per-recipient wraps (HPKE to the prf-derived key; encrypt once, *then* fountain-code).
- The shelf at the pin where `press/` has merged (#244): the broadcast target and the catch.

## Revocation is an empty branch

The control branch is force-pushed and carries one commit. Killing it revokes every reader at once,
and there is no need to truncate anything to stop a thing being viewed: **a pristine empty QR of any
age is the same bytes as any other.** Old artifacts still open their old bytes and never advance.
That is the design, not a limitation to engineer around.
