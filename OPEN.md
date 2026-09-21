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

## 4. The bundle header — read here, written by git

`bottle/bundle.mjs` parses a v2 bundle so the tab can open one; `git bundle create` writes it on the
station. The browser-side *writer* (a header over `git-enough/pack.mjs`'s output) is what the return
trip needs and is not here yet — it belongs in `anecdote.channel` beside `pack.mjs`.

## 5. Who reads the still

The return trip is one QR. Something at the station has to scan it and `git fetch` from the bundle
it decodes. Which camera, which verb, and whether the fetch lands on `control/<recipient>` or a
branch the recipient never sees named — undecided.

## 6. One control branch, today

`bin/control` makes exactly one, `refs/heads/control`, as a single orphan commit; `bin/publish`
bottles it whole (no prerequisites, so nothing to fast-forward from). One branch per recipient —
`control/<moniker>`, so a force-push revokes one rather than everyone — is the shape the design
describes and is not built. It is a loop over what exists rather than a new mechanism.

## 7. Workload authentication — the next step

The passkey at this origin is the master identity. A workload — a channel, a control branch — should
be answered by a credential *derived* from it, not by it: D12 already names the mechanism (`prf`
with the workload as the salt), and the reader key for a wrap is `HKDF(prf) → X25519`. What is
unbuilt is the whole path: the enrollment still carrying the derived public half, the wrap file per
recipient, the reader deriving on presence and opening the wrap, and `bin/publish` sealing to a list
of recipients instead of signing in the clear. The bottle above is the payload that path gates.
