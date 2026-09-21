# The landing page draws the company — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** companygraph.io's landing page draws CompanyGraph's own model on the shared stage, in place of the figure drawn by hand.

**Architecture:** The site grows a second pin, a third build target that reads it into `company.json`, and a stage inside the `<figure>` the drawn figure occupies now. Nothing about the share card changes, because `HOME_HIDE` already hides that figure.

**Tech Stack:** Node 22 with built-ins only for `pages.mjs`, `companygraph-meta-model`'s parser for `build.mjs`, d3 v7 vendored at the root, playwright for the suite, `@robertblust/design` for the shared stage, pin and page checks.

**Spec:** [`companygraph/meta-model` · `docs/superpowers/specs/2026-09-21-companygraph-instance-design.md`](https://github.com/companygraph/meta-model/blob/main/docs/superpowers/specs/2026-09-21-companygraph-instance-design.md)

**Sibling plan:** the instance half is `companygraph/meta-model` · `docs/superpowers/plans/2026-09-21-companygraph-mental-model.md`. It has merged, and `companygraph/mental-model` exists with its content complete, so this plan can start.

**Refreshed on 2026-09-21, before execution**, against this repository at `45dd7f6`, `companygraph/mental-model` at `ca495ed` and `@robertblust/design` at v0.68.0. What the refresh measured and changed:

- The instance now vendors core 0.37.0, with products and concepts. This site's parser pin, `companygraph-meta-model` v0.34.0, parses it at `ca495ed` without a problem: the root is `CompanyGraph`, `identity`, and every type the instance uses comes through. The parser pin is editorial and this plan does not move it.
- The site takes design v0.68.0 first, as Task 0. The landing stage is the first of two pieces of work on this site, and the second, adopting Team, Principles and Surfaces, needs v0.68.0; building and verifying the stage on the design the site will ship with means nothing here is verified twice. v0.67.0 reorders the nav check's order, which this site's nav, naming no Principles, does not feel, and v0.68.0 adds fences no page here carries yet, so the re-pin is expected to write nothing.
- **A card links to its source file through `data.repo`, and falls back to `companygraph/meta-model` when the artifact names none** (`card.js` and `stage.js` in the design package). Neither `example.json` nor `model.json` carries `repo`, and neither needs to. `company.json` must, or every card on the landing page links to a path in the wrong repository. Task 2 now says so and tests it.
- Task 3 read `/example/` by line numbers that have since moved; it now finds the same regions by their anchors.

## Global constraints

- The new artifact is **`company.json`** at the repository root. `model.json` is the core
  vocabulary and is not it.
- `source.json` holds **two named pins**, `meta-model` and `mental-model`. Both are editorial:
  they move in a commit that says why, never by a bot.
- **CI never writes what the repository commits.** `company.json` is built locally and
  committed; CI checks the committed copy against the pin.
- Every string the page gains carries a `data-de` attribute. German is made by the translator
  of `conventions/TRANSLATOR.md` from the **reviewed** English only, never from a draft, and is
  reviewed by reading the back-translation.
- `npm run sitemap` runs with every page edit.
- Prose follows `conventions/WRITING.md`. A page is the prose register aimed at a visitor who
  has not decided to stay: the first line is the one point, sentences run shorter than a
  README's, and no adjective sells.
- **A number that still moves is not written down** — no entity or edge counts in page prose.
- One branch per change, in a sibling worktree named
  `companygraph.github.io-<branch>`; the clone stays on `main`.
- Commits and pull request bodies are in the git register, ending `Verified:` then the trailers.
- **Merging is the owner's decision.** Every task ends by opening the pull request, reporting
  the check and stopping.

---

### Task 0: The site takes design v0.68.0

**Files:**

- Modify: `package.json`, `package-lock.json`

**Interfaces:**

- Consumes: `@robertblust/design` v0.68.0
- Produces: every later task builds and verifies against v0.68.0

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b the-site-takes-design-v0-68-0 \
  ~/git/companygraph/companygraph.github.io-the-site-takes-design-v0-68-0 origin/main
cd ~/git/companygraph/companygraph.github.io-the-site-takes-design-v0-68-0
```

- [ ] **Step 2: Move the pin, and make the lockfile follow it**

Set `"@robertblust/design": "github:robertblust/design#v0.68.0"` in `package.json`. A plain `npm install` does not re-resolve a git tag whose lockfile entry npm considers satisfied, and `--package-lock-only` does not either, so resolve from nothing:

```bash
rm -rf node_modules package-lock.json && npm install
```

Then prove the lockfile names the tag's commit rather than trusting the command. Read the entry, not a grep for the tag string, which matches the dependency spec in the root entry of a stale lockfile too:

```bash
gh api repos/robertblust/design/git/refs/tags/v0.68.0 --jq .object.sha
node -e 'const l=require("./package-lock.json").packages["node_modules/@robertblust/design"]; console.log(l.version, l.resolved)'
```

Expected: version `0.68.0`, and `resolved` ending in the sha the first command prints. `git diff package-lock.json` must move only that entry and what it pulls in; if other dependencies moved, restore the lockfile and move only this one with `npm install @robertblust/design@github:robertblust/design#v0.68.0`.

- [ ] **Step 3: Write what the release ships, and expect nothing new**

```bash
npm run design; git status --short
```

Expected: only `package.json` and `package-lock.json` changed. A page that changes here carries a fence whose body moved between v0.66.0 and v0.68.0; read the diff and name it in the pull request body.

- [ ] **Step 4: Verify, each exit code on its own**

```bash
npm run design:check;   echo "design:check: $?"
npm run pin:check;      echo "pin:check: $?"
npm run sitemap:check;  echo "sitemap:check: $?"
npm run og:check;       echo "og:check: $?"
npm run serve > /dev/null 2>&1 &
npm run verify;         echo "verify: $?"
```

Stop only the server this step started, by its PID. Expected: `0` from every one.

- [ ] **Step 5: Commit, push, open the pull request, report and stop**

The body names both releases taken and what each changes for this site: v0.67.0's nav order, felt by no page here, and v0.68.0's renderers and fences, carried by no page here yet, which the adoption of Team, Principles and Surfaces takes up.

---

### Task 1: `source.json` holds two pins

**Files:**

- Modify: `source.json`, `build/build.mjs`, `build/pages.mjs`, `pin-check.mjs`
- Test: `build/renderers.test.mjs`

**Interfaces:**

- Consumes: the merge commit of `companygraph/mental-model`'s content work
- Produces: `PINS`, an object keyed `meta-model` and `mental-model`, each `{ repo, commit }`;
  every module that used the bare `repo` and `commit` constants now names which pin it means

This task changes the shape of a file three modules read and adds **no** new artifact. Keeping those two changes apart is the point: if `example.json` or `model.json` moves a byte here, something is wrong with the refactor rather than with the new target.

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b the-site-pins-two-repositories \
  ~/git/companygraph/companygraph.github.io-the-site-pins-two-repositories origin/main
cd ~/git/companygraph/companygraph.github.io-the-site-pins-two-repositories && npm ci
```

- [ ] **Step 2: Write the failing check first — prove the current shape is assumed**

Add to `build/renderers.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("source.json names both pins, each with a repo and a commit", () => {
  const root = path.join(import.meta.dirname, "..");
  const pins = JSON.parse(fs.readFileSync(path.join(root, "source.json"), "utf8"));
  assert.deepEqual(Object.keys(pins).sort(), ["mental-model", "meta-model"]);
  for (const [name, pin] of Object.entries(pins)) {
    assert.match(pin.repo, /^companygraph\//, `${name}.repo`);
    assert.match(pin.commit, /^[0-9a-f]{40}$/, `${name}.commit`);
  }
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm run test:build`

Expected: FAIL — the current `source.json` has top-level `repo` and `commit`, so `Object.keys(pins).sort()` is `["commit", "repo"]`.

- [ ] **Step 4: Rewrite `source.json`**

```json
{
  "meta-model": { "repo": "companygraph/meta-model", "commit": "<the commit it already names>" },
  "mental-model": { "repo": "companygraph/mental-model", "commit": "<the merge commit of the instance>" }
}
```

Take the first commit verbatim from the current `source.json` — this task does not move that pin. Take the second from `git -C ~/git/companygraph/mental-model rev-parse origin/main` after the instance's content work has merged.

- [ ] **Step 5: Run the test and watch it pass**

Run: `npm run test:build`

Expected: PASS.

- [ ] **Step 6: Teach `build/build.mjs` which pin each target reads**

Replace the module-level destructure:

```js
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(here, "..", "source.json"), "utf8"));
```

with the pins, and give every target a `pin`:

```js
const PINS = JSON.parse(fs.readFileSync(path.join(here, "..", "source.json"), "utf8"));

const TARGETS = [
  { dir: "example", pin: "meta-model", parse: parseInstance, sub: "example/model/", schemas: "core/" },
  {
    dir: "model", pin: "meta-model", parse: parseSchemas, sub: "core/",
    finish(data) { /* unchanged */ },
  },
];
```

`fetchTree` and `readRemote` close over `repo` and `commit` today, and the tree cache is a single module-level `tree`. Both become per-pin: key the cache by pin name, and pass `{ repo, commit }` into the reader rather than reading module state.

```js
const trees = new Map();
async function fetchTree({ repo, commit }) {
  const key = `${repo}@${commit}`;
  if (trees.has(key)) return trees.get(key);
  const headers = { "user-agent": "companygraph.io build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!res.ok) throw new Error(`trees API for ${repo}: HTTP ${res.status}`);
  const { tree: entries, truncated } = await res.json();
  if (truncated) throw new Error(`trees API truncated the listing for ${repo}`);
  const value = { entries, headers };
  trees.set(key, value);
  return value;
}
```

`readLocal` takes the checkout's environment variable name per pin — `META_MODEL` for `meta-model` — and keeps its guard that the checkout's `HEAD` is the commit the pin names. `MENTAL_MODEL` is added in Task 2 and not here.

- [ ] **Step 7: Teach `build/pages.mjs` and `pin-check.mjs` the same shape**

`pages.mjs` reads `repo` and `commit` for its per-artifact commit guard; it now looks the pin up by the artifact's name. `pin-check.mjs` becomes the loop guestgraph.io already runs:

```js
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinDrift, pinReport } from "@robertblust/design/verify/pin";

const here = path.dirname(fileURLToPath(import.meta.url));
const pins = JSON.parse(readFileSync(path.join(here, "source.json"), "utf8"));

for (const [name, pin] of Object.entries(pins)) {
  pinReport(await pinDrift({ root: here, pin }), console.log, name);
}
```

Rewrite the file's header comment to say the site pins two repositories and why each pin is editorial — the existing comment says "one commit of the meta-model" and stops being true.

- [ ] **Step 8: Verify nothing about the two existing artifacts moved**

```bash
cd ~/git/companygraph/companygraph.github.io-the-site-pins-two-repositories
npm run test:build; echo "test:build: $?"
npm run build:check; echo "build:check: $?"
npm run pages:check; echo "pages:check: $?"
npm run pin:check; echo "pin:check: $?"
git diff --stat -- example.json model.json
```

Expected: `0`, `0`, `0`, `0`, and **no diff** on either artifact. `pin:check` now prints two lines, one per pin. If either artifact moved, stop and find out why before going on.

- [ ] **Step 9: Commit, push, open the pull request, report and stop**

The body says why a second repository means a second pin and why both live in one file — one pin file for the site was what consolidating `example/source.json` into a root `source.json` was protecting, and the guestgraph.io `api-sources.json` shape keeps it. End with the `Verified:` line naming the five commands above, then the trailers.

---

### Task 2: `company.json` is built from the second pin

**Files:**

- Create: `company.json`
- Modify: `build/build.mjs`, `build/pages.mjs`, `build/jsonld.mjs`, `README.md`
- Test: `build/renderers.test.mjs`

**Interfaces:**

- Consumes: `PINS["mental-model"]` from Task 1
- Produces: `company.json` — `{ commit, repo, root, rootId, types, entities, edges }`: the
  shape `example.json` has plus `repo`, which `stage.js` reads through its `data-stage` link and
  `card.js` reads to link each card to its source file

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b the-site-builds-the-company \
  ~/git/companygraph/companygraph.github.io-the-site-builds-the-company origin/main
cd ~/git/companygraph/companygraph.github.io-the-site-builds-the-company && npm ci
```

- [ ] **Step 2: Write the failing test**

Add to `build/renderers.test.mjs`:

```js
test("company.json is the instance at the pin, with a root and edges", () => {
  const root = path.join(import.meta.dirname, "..");
  const pins = JSON.parse(fs.readFileSync(path.join(root, "source.json"), "utf8"));
  const data = JSON.parse(fs.readFileSync(path.join(root, "company.json"), "utf8"));
  assert.equal(data.commit, pins["mental-model"].commit);
  // card.js links a card to github.com/<repo>/blob/<commit>/<path> and falls back to
  // companygraph/meta-model when repo is missing, which is the wrong repository here.
  assert.equal(data.repo, pins["mental-model"].repo);
  assert.equal(data.root, "CompanyGraph");
  assert.equal(data.rootId, "identity");
  assert.ok(data.entities.length > 0, "entities");
  assert.ok(data.edges.length > 0, "edges");
  const ids = new Set(data.entities.map((e) => e.id));
  for (const edge of data.edges) {
    assert.ok(ids.has(edge.from), `edge from ${edge.from}`);
    assert.ok(ids.has(edge.to), `edge to ${edge.to}`);
  }
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm run test:build`

Expected: FAIL with `ENOENT` on `company.json` — the file does not exist yet.

- [ ] **Step 4: Add the third target**

In `build/build.mjs`'s `TARGETS`:

```js
{ dir: "company", pin: "mental-model", parse: parseInstance, sub: "model/", schemas: "meta/core/" },
```

`sub` is `model/` and `schemas` is `meta/core/` because an instance carries its own vendored core — which is how blust.ch reads the reference instance, and not how the `example` target works: the example is parsed against the core sitting beside it in the same commit.

Add `MENTAL_MODEL` beside `META_MODEL` as that pin's local-checkout escape hatch, with the same guard that the checkout's `HEAD` is the commit the pin names:

```js
const LOCAL_ENV = { "meta-model": "META_MODEL", "mental-model": "MENTAL_MODEL" };
```

`company.json` carries `repo` as well as `commit`, because it is the one artifact from another repository, and `card.js` and `stage.js` read `data.repo` to link a card to its file and fall back to `companygraph/meta-model` without it. Add it for this target only, for example with a `repo: true` flag on the target that makes the build write `repo: PINS[target.pin].repo` into the data. `example.json` and `model.json` do not gain it: the fallback is already right for them, and Step 8 requires that neither moves a byte.

- [ ] **Step 5: Build it and watch the test pass**

```bash
cd ~/git/companygraph/companygraph.github.io-the-site-builds-the-company
npm run build
npm run test:build; echo "test:build: $?"
```

Expected: `build` prints a line for each of the three artifacts; `test:build` exits `0`.

- [ ] **Step 6: Add `company.json` to `pages.mjs`'s loop**

```js
for (const name of ["example", "model", "company"]) {
```

Its commit guard compares each artifact against **its own** pin, not against one commit — the current code compares every artifact to the single `commit`, which would now fail `company.json` on every run.

- [ ] **Step 7: Name it a Dataset in the landing page's JSON-LD**

`build/jsonld.mjs` writes a `Dataset` for `/example/` with a `DataDownload` under `encoding` whose `contentUrl` is `${SITE}/example.json`. The landing page gains the same shape for `company.json`: a `Dataset` describing CompanyGraph's own model, with its `encoding` pointing at `${SITE}/company.json`. Read the existing block and match its property order rather than inventing a second arrangement.

- [ ] **Step 8: Verify**

```bash
cd ~/git/companygraph/companygraph.github.io-the-site-builds-the-company
npm run test:build; echo "test:build: $?"
npm run build:check; echo "build:check: $?"
npm run pages; npm run pages:check; echo "pages:check: $?"
npm run verify; echo "verify: $?"
git diff --stat -- example.json model.json
```

Expected: `0`, `0`, `0`, `0`, and no diff on the two older artifacts.

- [ ] **Step 9: Commit `company.json` with the code that builds it, push, open the pull request, report and stop**

`git add company.json` explicitly — a generated file that CI checks must be in the same commit as the generator, or `build:check` is red on `main` for the length of a review.

---

### Task 3: The landing page draws it

**Files:**

- Modify: `index.html`, `sitemap.xml`
- Test: `verify/check.mjs`

**Interfaces:**

- Consumes: `company.json` from Task 2; `stage.css`, `stage.js`, `d3.v7.min.js` at the root
- Produces: a landing page whose `<figure class="figure">` holds a stage, which `HOME_HIDE`
  still hides from the share card

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b the-landing-page-draws-the-company \
  ~/git/companygraph/companygraph.github.io-the-landing-page-draws-the-company origin/main
cd ~/git/companygraph/companygraph.github.io-the-landing-page-draws-the-company && npm ci
```

- [ ] **Step 2: Read the page that already does this**

```bash
grep -n 'stage contract · \|end stage contract' example/index.html   # the stage contract fence
grep -n 'stage.css\|data-stage' example/index.html                   # the stylesheet and the data link
grep -n 'id="stagehead"\|id="stagemodal"' example/index.html         # the stage markup, between these
grep -n 'd3.v7.min.js\|stage.js"' example/index.html                 # d3 and stage.js at the foot
```

Read each region in full from the line numbers these print. The markup in Step 5 was taken from `/example/` on 2026-09-21; if the two differ, `/example/` is right.

- [ ] **Step 3: Add the stage contract fence markers, then let `design sync` fill them**

Inside `index.html`'s `<style>`, after the `design tokens` fence, add the marker pair the generator writes between:

```css
  /* ─── stage contract · v2 · shared ───────────────────────────────────
  /* ─── end stage contract ────────────────────────────────────────────────── */
```

Then run `npm run design` and confirm the body was written. Do not paste the contract's rules by hand: `design sync --check` compares them to the package, and a hand copy is a second copy that drifts.

- [ ] **Step 4: Link the stylesheet and the artifact in `<head>`**

```html
<link rel="stylesheet" href="stage.css">
<link rel="preload" as="fetch" href="company.json" data-stage crossorigin>
```

`data-stage` is how `stage.js` finds which artifact to fetch; a page that carries a stage and names no data does not fail quietly — the stage throws.

- [ ] **Step 5: Replace the drawn figure with the stage, inside the same `<figure>`**

Keep `<figure class="figure">` and its `<figcaption>`. Replace the whole `<svg class="fig">` element with the stage's markup, adapted from `/example/`:

```html
  <figure class="figure">
    <div class="stagehead" id="stagehead">
      <p class="path mono" id="path"></p>
      <button type="button" class="expand" id="expand" data-de="Vergrössern">Expand</button>
    </div>
    <div class="stage" id="stage">
      <div class="canvas">
        <svg id="fig" role="group" aria-labelledby="figcap"></svg>
        <button class="recenter" id="recenter" type="button" data-de="neu zentrieren">recenter</button>
      </div>
      <button class="gutter" id="gutter" type="button"
              aria-label="Resize the details panel" data-de-aria="Detailbereich verkleinern oder vergrössern"></button>
      <aside class="card" id="card" aria-live="polite">
        <div class="cbody" id="cbody"></div>
        <div class="cfoot" id="cfoot">
          <span id="cfootlink"></span>
        </div>
      </aside>
    </div>
    <p class="stagehint" data-de="Ziehen bewegt das Diagramm · ⌘- oder Ctrl-Scrollen zoomt">Drag to move · ⌘- or Ctrl-scroll to zoom</p>
    <figcaption class="figcap" id="figcap">…the new caption…</figcaption>

    <dialog id="stagemodal" class="modal" aria-label="CompanyGraph's model, expanded"
            data-de-aria="Das Modell von CompanyGraph, vergrössert">
      <button type="button" class="close" id="modalclose" aria-label="Close" data-de-aria="Schliessen">×</button>
    </dialog>
  </figure>
```

The `<figcaption>` keeps `id="figcap"`, because the `<svg>` names it through `aria-labelledby`.

- [ ] **Step 6: Delete what the drawing left behind**

Remove from the `<style>`: the `.fig .box`, `.fig .ref`, `.fig .node`, `.fig .join`, `.fig .r-box`, `.fig .r-ref`, `.fig .r-node` rules; `.an`, `.land`, `.trace`; the three `@keyframes` blocks `fig-in`, `fig-land`, `fig-trace`; and the figure's `@media (prefers-reduced-motion: reduce)` block. Keep `.figure{display:contents}` and `.figcap`. Confirm nothing else on the page used `.an`:

```bash
grep -n 'class="[^"]*\ban\b' index.html
```

Expected: no output.

- [ ] **Step 7: Write the caption in English, and present it for review**

The caption is the one place the page states plainly what the drawing is. It says this is CompanyGraph's own model, drawn from the repository the page links to — and, as `/example/`'s caption does, what a solid line and a dashed line mean, because a reader meets those before they meet anything else. It does **not** explain the header mark; that derivation left with the drawing, by decision.

- [ ] **Step 8: Load d3 and the stage at the foot**

```html
<script src="d3.v7.min.js"></script>
<script src="stage.js"></script>
```

Root-relative here, where `/example/` uses `../`.

- [ ] **Step 9: Run the sitemap and look at the page**

```bash
cd ~/git/companygraph/companygraph.github.io-the-landing-page-draws-the-company
npm run sitemap
npm run serve &
open http://localhost:8000/
```

Click a node, open Expand, close it, resize to phone width. The stage's own behavior is `stage.js`'s and is not changed here; what is being checked is that it has room, that the card opens, and that the page does not scroll sideways.

- [ ] **Step 10: Commit, push, open the pull request, report and stop**

The suite is extended in Task 4, so `npm run verify` is expected to pass here on the checks the landing page already had. Say in the body that the spec follows, so a reviewer does not read its absence as an oversight.

---

### Task 4: The suite knows the landing page carries a stage

**Files:**

- Modify: `verify/check.mjs`

**Interfaces:**

- Consumes: the page from Task 3
- Produces: `graph: true` and the `stage contract` fence on the `/` spec, so the landing page is
  held to what `/model/` and `/example/` are held to

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b the-suite-holds-the-landing-stage \
  ~/git/companygraph/companygraph.github.io-the-suite-holds-the-landing-stage origin/main
cd ~/git/companygraph/companygraph.github.io-the-suite-holds-the-landing-stage && npm ci
```

- [ ] **Step 2: Extend the `/` spec**

In `PAGES`, the entry whose `path` is `/`:

- add `"stage contract"` to `fences`, which becomes
  `["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"]`.
  `"title contract"` is **not** added: that fence belongs to a page with a `.title` block, and
  the landing page opens with `.hero`.
- add `graph: true`, which reads the artifact the page names and asserts the names it draws —
  so no name from the model appears in this file.
- add the caption's own words to `contains`, choosing only the words that carry the claim, so
  rewording the rest of the sentence does not fail the check.

`card: true`, `cardBase: SITE`, `internalLinks: true` and a `translates` block are already on this entry — do not add a second copy of any of them. `divider: true` is carried by both stage pages and is not on this one: add it, run the suite, and if it fails read what it asserts before deciding whether the landing page should carry it rather than relaxing it.

- [ ] **Step 3: Run the suite and read what it says**

```bash
cd ~/git/companygraph/companygraph.github.io-the-suite-holds-the-landing-stage
npm run verify; echo "verify: $?"
```

Expected: `0`. If `graph` fails, it is reading `company.json` and finding a name the page does not draw — that is a real failure and not a check to relax.

- [ ] **Step 4: Prove the share card did not move**

```bash
npm run og:check; echo "og:check: $?"
npm run test:og; echo "test:og: $?"
```

Expected: `0` and `0`, **with no re-render**. `HOME_HIDE` is `.figure{display:none}` and the stage sits inside that figure, so the card's inputs are unchanged. If `og:check` reports the landing card stale, the stage was put outside the figure — go back to Task 3, Step 5 rather than re-rendering the card.

- [ ] **Step 5: Commit, push, open the pull request, report and stop**

---

### Task 5: The German, and the documents

**Files:**

- Modify: `index.html` (the `data-de` attributes), `README.md`, `AGENTS.md`

**Interfaces:**

- Consumes: the English caption reviewed in Task 3
- Produces: a landing page that carries its second language, and two documents that stop saying
  the site has one pin

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b the-landing-stage-speaks-german \
  ~/git/companygraph/companygraph.github.io-the-landing-stage-speaks-german origin/main
cd ~/git/companygraph/companygraph.github.io-the-landing-stage-speaks-german && npm ci
```

- [ ] **Step 2: Run the translator over the new elements only**

Invoke the translator role of `conventions/TRANSLATOR.md`, with `conventions/GLOSSARY.md` open, one element at a time, over the strings Task 3 added: the caption, and any control whose German was not copied verbatim from `/example/`. The role edits files and reports; it never commits.

Where a string was taken verbatim from `/example/` — the hint, `Expand`, `recenter`, the gutter and dialog aria labels — the German is already made and is copied with it. Do not re-translate a string that has a reviewed translation; two German renderings of one English sentence is the drift the one-glossary rule exists to stop.

- [ ] **Step 3: Read the back-translation, not the German**

The translator hands back an English rendering of what the German says, beside each element. Review that. Reading German prose takes an evening and the family has one reader for it.

- [ ] **Step 4: Add the German to the `/` spec's `translates` block**

`/model/` and `/example/` each name `shows`, `hides` and a `title` for German. The landing page has a `translates` block already; add the caption's German words to `shows` and its English words to `hides`.

- [ ] **Step 5: Update `README.md` and `AGENTS.md`**

Both say the site has one pin and that two artifacts are built from it. Rewrite the file table and the build paragraph to name three artifacts and two pins, and say which repository each artifact comes from. `AGENTS.md`'s note that a page naming no data makes the stage throw now applies to three pages rather than two.

- [ ] **Step 6: Verify everything, each exit code on its own**

```bash
cd ~/git/companygraph/companygraph.github.io-the-landing-stage-speaks-german
npm run design:check;   echo "design:check: $?"
npm run build:check;    echo "build:check: $?"
npm run pages:check;    echo "pages:check: $?"
npm run test:build;     echo "test:build: $?"
npm run verify;         echo "verify: $?"
npm run og:check;       echo "og:check: $?"
npm run test:og;        echo "test:og: $?"
npm run test:d3;        echo "test:d3: $?"
npm run sitemap:check;  echo "sitemap:check: $?"
npm run pin:check;      echo "pin:check: $?"
sh conventions/conventions-format; echo "format: $?"
sh conventions/conventions-check;  echo "check: $?"
```

Expected: `0` from every one.

- [ ] **Step 7: Commit, push, open the pull request, report and stop**

---

## After this plan

The organization profile's diagram gains an edge — companygraph.io now pins `companygraph/mental-model` as well — and that edit belongs with the instance plan's Task 9 if it has not merged yet, or is a one-line follow-up if it has.

`conventions/REPOSITORIES.md` describes which site pins what, and this site now pins two repositories. That edit rides the same conventions release as the new member's row rather than opening one of its own.
