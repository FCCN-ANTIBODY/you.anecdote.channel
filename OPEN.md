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

## 2b. The zone caches over the origin's head

`you.discoverywritten.com` is served through the discoverywritten.com zone, whose cache settings
rewrite `Cache-Control` to `max-age=300` and hold CORS variants of modules for hours past a deploy;
the Pages origin itself honours `_headers` (`max-age=0`). Until a Cache Rule bypasses this hostname
and the held copies are purged, browsers can run the previous deploy's modules while `bin/deploy`
correctly refuses to call the deploy done. Dashboard only; the token here cannot purge.

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

## 7. Workload authentication — the derived half is built; the return still is not

`bottle/you-key.mjs` derives an age identity from the passkey (`prf`, salt = this origin) and prints
the recipient as a still; `recipients.txt` is the arrangement; `bin/publish` seals to it; the page
opens it. What remains: whether `prf` answers on the operator's phone (§1 — the fallback is labelled
and at rest, and strictly weaker); the enrollment still as a signed commit rather than a string a
person copies; per-channel salts; and the station-side scan of the still. None of these changes the
shape.
