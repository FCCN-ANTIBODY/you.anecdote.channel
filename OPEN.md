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

## 2b. Two caches, one fixed and one not

There are two knobs and they are commonly mistaken for one:

| knob | what it governs | who can set it |
| --- | --- | --- |
| **Browser Cache TTL** | the `max-age` the visitor is told | zone Caching → Configuration, or a Cache Rule |
| **Edge Cache TTL** | how long Cloudflare's edge keeps the object | **a Cache Rule only** |

**Rules beat the Caching Configuration page**, which is why the first half is now right: the zone had
been rewriting `max-age=0` to `max-age=300`, and a Cache Rule respecting origin headers fixed it.
Measured 2026-09-21 afterwards: `cache-control: public, max-age=0, must-revalidate` — as `_headers`
asks — with `cf-cache-status: HIT` and `age: 4142`. The browser is revalidating on every request,
exactly as told, and **the edge answers that revalidation out of its own hours-old copy.**

So the remaining staleness is entirely Edge TTL, and a rule reading "cache for a day" is pointed the
wrong way — it is this half, and a longer edge TTL is a longer lie.

**The setting is "defer to the origin", not "bypass".** Cache Rules name their three Edge TTL choices
plainly, and the first is the one this site wants:

| Edge TTL choice | effect here |
| --- | --- |
| *Use cache control-header if present, bypass cache if not* | **this one** — `_headers` becomes the policy |
| *Use cache-control header if present, use default Cloudflare caching behavior if not* | same today; differs if `_headers` ever stops covering a path |
| *Ignore cache-control header and use this TTL* | the bug — what a day-long rule is |

A blanket Bypass works too and is worse: it throws away any future ability to cache from `_headers`
without a dashboard visit. Keeping the policy in a committed file is the same argument as the rest of
this repository having no build.

**And strictly, no rule is needed.** Cloudflare "does not cache HTML or JSON by default" and "Origin
Cache Control is enabled by default" on Free, Pro and Business, so the platform already respects this
file; its own fallback TTLs (120 minutes for a 200) apply only "when no cache headers are present",
which `_headers` guarantees never happens. A rule earns its keep only by being explicit, and by
surviving somebody switching Origin Cache Control off. Dashboard only either way; the token here
cannot purge or set rules.

The page no longer depends on this being right — `control.json` is asked for with a fresh query
every time and the artifacts it names carry the transfer id in their URL — but `bin/deploy` will keep
refusing to call a deploy done while any file differs, which is the honest report.

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
