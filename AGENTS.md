# Working in this repository

Read `README.md`, then `OPEN.md`, then `anecdote.channel/docs/decisions.md` **D8, D9, D12** — the
keeper, the you-namespace, and the RP ID ruling this address exists to satisfy.

## The rules most likely to be broken here

1. **`url:` in `you.yml` is decide-once.** It is the RP ID. A WebAuthn credential bakes it in at
   creation and cannot be migrated; changing it means every holder enrols again. Do not change it,
   and do not mint a credential anyone is meant to keep at any other name — `probe_origin` is for
   probing, and a probe credential is a throwaway.
2. **`prf` is requested at `create()` or never.** A credential minted without the extension cannot be
   upgraded. Every enrolment path asks for it; a probe that reports it disabled is a stop, not a warning.
3. **Nothing secret is ever committed.** Public halves only. The engine holds no key; the station that
   mounts it holds no key; the reader key is re-derived from the gesture and is never at rest.
4. **The control branch is force-pushed.** That is not history to protect. Its HEAD is the product and
   the previous HEAD is meant to be gone.
5. **Revocation is an empty branch.** Do not invent an expiry field, a token, or a deny-list. Removing
   the bytes is the mechanism, and an empty QR of any age is indistinguishable from any other.
6. **No build.** The repository is the site. If a file must be generated, it is generated *and
   committed* (`channels.json`, everything in `bottles/`), never produced at deploy. `bin/publish` is
   run by a person, and what it wrote is what gets committed.
7. **The apex is mounted sparse, and `mounts.txt` is the record.** `git-enough/` and `composer/` are
   1.7 MB of a 50 MB repository. `bin/mount` applies the checkout; `bin/deploy` refuses one that is
   wider. Widening it is a line in `mounts.txt`, argued, not a `git submodule update` that happened.
8. **The publisher's signer never enters the repository.** `~/.local/state/you/signer.pkcs8` is
   device-minted and says only that this station bottled the bytes. It is not the passkey, and nothing
   here may present it as the operator.
9. **A bottle that was not read back was not published.** `bin/publish` decodes its own GIF before
   it writes the manifest; do not add a path that skips that.
10. **GitHub is a next-stage proof.** Nothing in the two-phones case may require it, a public mirror,
   or any third party. If a design needs one, it is not the primitive.
