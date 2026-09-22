// bottle/fixture.mjs — a real git bundle, built here, for the tests that prove the round trip.
//
// These tests used to read `bottles/control.bundle` — a PUBLISHED ARTIFACT, which belongs to the
// node that hosts an instance and not to this engine. Depending on it meant the crux of the whole
// format only got tested where somebody had already published, and skipped everywhere else. So the
// fixture is built: a repository made in a temp directory, committed, and bundled by real `git`.
// The engine can now prove its own codec from a bare clone, which is the only place that proof is
// worth anything.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// A control-shaped branch: an orphan commit carrying a README and a data file, like bin/control packs.
export function makeBundle({ files = null, ref = "refs/heads/control" } = {}) {
  const d = mkdtempSync(join(tmpdir(), "you-fixture-"));
  const git = (...a) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8", maxBuffer: 1 << 26 });
  execFileSync("git", ["init", "-q", "-b", "control", d]);
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "fixture");
  const content = files || {
    "README.md": "---\ntitle: fixture\n---\n# a fixture\n\nBuilt by the test, not published by anyone.\n",
    "channels.json": '{ "version": 1, "channels": [] }\n',
    "_data/control.yml": "greeting: \"fixture\"\n",
  };
  for (const [p, text] of Object.entries(content)) {
    const full = join(d, p);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, text);
  }
  git("add", "-A");
  git("commit", "-qm", "control: fixture");
  const tip = git("rev-parse", "HEAD").trim();
  const path = join(d, "out.bundle");
  git("bundle", "create", path, "control");
  const bytes = new Uint8Array(readFileSync(path));
  rmSync(d, { recursive: true, force: true });
  return { bytes, tip, ref, paths: Object.keys(content).sort() };
}
