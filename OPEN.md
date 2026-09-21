# Open questions

`status: draft` — written 2026-09-21 while provisioning this repository. None of these is decided.

## 1. Does `prf` answer on the operator's phone?

`probe/prf.html` exists and has not been run. Safari/iCloud Keychain support for the extension has
moved and nothing here asserts a version. If it reports `enabled: false`, the shape is unchanged
and only the source of the key-encryption key moves — `largeBlob`, or a hardware authenticator
(`hmac-secret` is reliable on those). **Run it at `probe_origin` first.** A credential minted at the
real instance is a real credential under the real RP ID, even if it is a throwaway.

## 2. The name is attached; the sub-channels are not

`you.discoverywritten.com` was attached to the Pages project in the dashboard on 2026-09-21 and
answers from Cloudflare's edge with a valid certificate. `bin/deploy` verifies it after every
upload by fetching `you.yml` back from that name and comparing bytes.

Sub-channels as `<channel>.you.discoverywritten.com` need two more things, both unsettled: a
wildcard custom domain on the project (`anecdote.channel/docs/flooring.md` records the one-minute
test and the assets-only-Worker fallback), and an edge certificate that covers the second label —
Universal SSL stops at `*.discoverywritten.com`.

## 3. The tools shelf and the press are mounted; the runtime is not

`git-enough/`, `composer/`, `press/`, `jekyll-enough/`, `reducer/`, `viewer/`, `assets/` and
`icon.svg` are served from a sparse mount of `anecdote.channel` at the pin in `.gitmodules`
(`mounts.txt`, `bin/mount`), about 2.8 MB of its 50. #244 merged 2026-09-21 after a four-file
conflict was resolved here, so the press is on `main` and pinned as such.

`runtime/` (24 MB) is deliberately absent. The only path into it is a dynamic import on the
reducer's embedding path, so a page that reaches it meets `404.html`. Whether that path is ever
wanted on a control point is a question, not a bug.

The press skins link `/assets/…` and `/icon.svg` absolutely; `_redirects` rewrites those two
names into the mount. Nothing else is rewritten.

## 4. The bundle header

A v2 git bundle is `# v2 git bundle`, one ref line, a blank line, and a packfile. `git-enough/pack.mjs`
already makes the packfile in the browser. The header belongs beside it in `anecdote.channel`, not here.

## 5. Who reads the still

The return trip is one QR. Something at the station has to scan it and `git fetch` from the bundle
it decodes. Which camera, which verb, and whether the fetch lands on `control/<recipient>` or a
branch the recipient never sees named — undecided.

## 6. One control branch or one per recipient

`you.yml` names `control`. The design also describes a branch we hold *for* each recipient that they
experience only as "the clone." Whether that is `control/<moniker>` with the wrap alongside, or one
`control` plus per-recipient wrap files, decides what a force-push revokes: everyone, or one.
