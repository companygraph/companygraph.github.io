# The dataset and the vocabulary — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Say what `/example/` and `/model/` show — a `Dataset` and a `DefinedTermSet` with a
term per schema — and give each a committed artifact a machine can fetch.

**Architecture:** Two layers. `build/build.mjs` keeps the network and the parser and writes
`example.json` and `model.json` instead of writing pages. `build/pages.mjs` loads both
artifacts, refuses to run if either names a commit other than the one `source.json` pins, and
calls two renderers: `build/block.mjs` for the two data blocks and `build/jsonld.mjs` for the
two JSON-LD graphs.

**Tech Stack:** Node 22 ESM, no framework. `companygraph-meta-model` for `parseInstance` and
`parseSchemas`. `node --test` for unit tests, matching `verify/og-recipe.test.mjs`. Playwright
only in `npm run verify`, which this plan does not change.

**Spec:** `docs/superpowers/specs/2026-09-08-example-dataset-design.md`

## Global constraints

- Branch is `example-dataset`, already created, spec already committed as `ec6e3c8`/`796e2b7`.
- Node built-ins only in `build/pages.mjs`, `build/block.mjs`, `build/jsonld.mjs` and the test
  file. They run before `npm ci`, so no import may reach `node_modules`.
- `example.json` and `model.json` are committed, written with `JSON.stringify(data, null, 2)`
  and a trailing newline. The data blocks inside pages stay minified, `JSON.stringify(data)`.
- **The two data blocks' bytes must not change.** `stage.js`, the vendored d3 and both drawings
  are untouched.
- **Do not add `repo` to the artifacts.** `stage.js:31` and `card.js:227` fall back to
  `"companygraph/meta-model"` when a block omits it, and adding it would change the block's
  bytes. `build/jsonld.mjs` reads `repo` from `source.json` instead. Removing that fallback is
  its own work, noted at the end of this plan.
- `GITHUB_TOKEN` is sent when present and never printed.
- Prose in Markdown follows `conventions/WRITING.md`: American English, spaced em-dash, no
  serial comma, sentence case headings, paragraphs by default, cause before mechanism. Run
  `sh conventions/conventions-check` before committing a Markdown change.
- Commit messages follow the git register in `conventions/WRITING.md`: subject under seventy
  characters, no type prefix, no trailing period, body of one to three paragraphs, a final line
  beginning `Verified:`, then the `Co-Authored-By` trailer.
- Do not merge and do not push. Stop after the last task's commit.
- `npm run build` needs the network. `META_MODEL` is only usable if a local checkout sits at
  `7f58f5e`; do not assume one does.

## File structure

```
build/build.mjs       rewrite  keeps its TARGETS, readLocal, readRemote and finish; writes two
                               artifacts instead of two pages
build/pages.mjs       new      loads both artifacts, holds the pin guard, runs the renderers
build/block.mjs       new      renderer: the data block in example/ and model/
build/jsonld.mjs      new      renderer: the Dataset, the DefinedTermSet and its nine terms
build/renderers.test.mjs new   unit tests for both renderers on fixtures
example.json          new      the parsed example instance, committed
model.json            new      the parsed core vocabulary, committed
package.json          modify   build, build:check, pages, pages:check, test:build; remove example
.github/workflows/ci.yml modify  example:check becomes two steps either side of npm ci
AGENTS.md             modify   lines 69, 136 and 424 name the old command
README.md             modify   lines 54 and 99-100
```

## Measured facts this plan relies on

Counted on 2026-09-08 and reproducible with the commands in each task.

| Fact | Value |
|---|---|
| `example/index.html` block | 23,945 bytes; artifact pretty-prints to 34,127 |
| `model/index.html` block | 40,597 bytes; artifact pretty-prints to 64,349 |
| Both pages' JSON-LD | round-trips exactly through `JSON.stringify(x, null, 2)` |
| Existing nodes on each | 4: `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` |
| Inline `{ "@id": … }` in either JSON-LD block | none — the only match is an HTML comment above it |
| Schema entities | 9, ids `core/<type>`, paths `core/<type>-schema.md` |
| Share cards | 7 `og.sha` files; two pages change, so two go stale |

---

### Task 1: The parse becomes two files

Writes `example.json` and `model.json` and changes no page. The blocks stay where they are, so
nothing can regress yet — this task is proved by showing the artifacts reproduce the blocks.

**Files:**
- Modify: `build/build.mjs` (replace the page-writing tail)
- Create: `example.json`, `model.json` (generated, committed)
- Modify: `package.json:16-17`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `example.json` and `model.json` at the repository root, each an object with keys
  `commit`, `root`, `rootId`, `types`, `entities`, `edges` — the values every later task loads.

- [ ] **Step 1: Replace the tail of `build/build.mjs`**

Keep everything down to and including the `finish` call. Delete the `START`/`END`/`block`
construction, the page read, the marker search, the check-or-write branch and the trailing
`if (check && !allMatch)`. In their place:

```js
  const OUT = path.join(here, "..", `${target.dir}.json`);
  const text = JSON.stringify(data, null, 2) + "\n";

  if (check) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (current === text) {
      console.log(`  ✓ ${target.dir}.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges`);
    } else {
      console.log(`  ✗ ${target.dir}.json is not what ${repo}@${commit.slice(0, 7)} parses to — run: npm run build`);
      allMatch = false;
    }
    continue;
  }
  fs.writeFileSync(OUT, text);
  console.log(`  wrote ${target.dir}.json: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}

if (check && !allMatch) process.exit(1);
```

Then rewrite the file's header comment. It currently says the script "writes the example
instance and the model vocabulary into their pages as data blocks". It no longer writes pages.
Say what is now true and why: this is the only script here that reaches the network or the
parser, it writes two committed artifacts, and everything derived from them is rendered by
`build/pages.mjs` without either. Keep the paragraphs about the shared trees call, about `sub`
going to the parser, and about the parser living in the repository that defines the conventions
— all three are still true.

- [ ] **Step 2: Rename the scripts**

In `package.json`, replace lines 16-17:

```json
    "build": "node build/build.mjs",
    "build:check": "node build/build.mjs --check",
```

- [ ] **Step 3: Generate both artifacts**

Run: `npm run build`
Expected: two `wrote …` lines, `example.json` with 24 entities and 41 edges, `model.json` with
9 entities and 13 edges, both from `companygraph/meta-model@7f58f5e`.

This needs the network. If GitHub rate-limits, export `GITHUB_TOKEN` first; never echo it.

- [ ] **Step 4: Prove the artifacts reproduce the blocks byte-for-byte**

This is the whole point of the task. The blocks now in the pages were produced by the old code
path; each artifact must serialize to exactly the same bytes.

```bash
node --input-type=module -e '
import fs from "node:fs";
for (const [name, page] of [["example", "example/index.html"], ["model", "model/index.html"]]) {
  const mine = JSON.stringify(JSON.parse(fs.readFileSync(`${name}.json`, "utf8")));
  const onPage = fs.readFileSync(page, "utf8")
    .match(new RegExp(`id="${name}-data" data-stage>([\\s\\S]*?)</script>`))[1];
  console.log(`  ${page}: ${mine === onPage ? "identical" : "DIFFERS"} (${onPage.length} bytes)`);
}'
```
Expected: `example/index.html: identical (23945 bytes)` and `model/index.html: identical (40597 bytes)`.

If either differs, stop and report BLOCKED. It means the parser or the pin moved, or `finish`
ran in the wrong place, and no later task is safe.

- [ ] **Step 5: Confirm the check catches a broken artifact**

Run: `printf '{}\n' >> model.json && npm run build:check; echo "exit: $?"`
Expected: `✗ model.json is not what … parses to — run: npm run build`, exit 1

Run: `npm run build && npm run build:check`
Expected: two `✓` lines.

- [ ] **Step 6: Commit**

```bash
git add build/build.mjs example.json model.json package.json
git commit -F - <<'MSG'
The parse is two files, not two pages

This script fetched the pinned commit, parsed it and wrote the result straight into the two
pages that draw it, so anything else wanting that data had to scrape rendered HTML for it.
Nothing did yet, which is why it never hurt; the structured data this site is about to
publish would have been the first.

It now writes example.json and model.json and stops there, which leaves it the only script
here that reaches GitHub or the parser. Both files are committed and pretty-printed, because
the reason to commit a generated file is that a re-pin shows in review as the fields that
moved rather than as one changed line.

Verified: each artifact serializes to the bytes already in its page's block, 23,945 and
40,597; npm run build:check passes and fails on a corrupted file.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 2: The renderer layer, and the blocks through it

**Files:**
- Create: `build/block.mjs`, `build/pages.mjs`, `build/renderers.test.mjs`
- Modify: `package.json` (add `pages`, `pages:check`, `test:build`)

**Interfaces:**
- Consumes: `example.json` and `model.json` from Task 1.
- Produces: `writeBlock(data, { check }) => string[]` from `build/block.mjs`, returning
  repository-relative paths that did not match. `build/pages.mjs` as the orchestrator Task 3
  registers with. `data` is `{ example, model }` — both artifacts, keyed by directory.

- [ ] **Step 1: Write the failing test**

Create `build/renderers.test.mjs`:

```js
// The renderers are pure functions of the artifacts, so they are tested on fixtures rather
// than on the real files: a test that read model.json would pass for the wrong reason the day
// the model changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeBlock } from "./block.mjs";

const FIXTURE = {
  example: { commit: "0".repeat(40), root: "Someone", rootId: "identity", types: [], entities: [], edges: [] },
  model:   { commit: "0".repeat(40), root: "Core", rootId: null, types: [], entities: [], edges: [] },
};

const EMPTY = (marker, id) => `<p>before</p>
<!-- ${marker} · none -->
<script type="application/json" id="${id}" data-stage></script>
<!-- /${marker} -->
<p>after</p>
`;

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-render-"));
  for (const [d, marker, id] of [["example", "example data", "example-data"], ["model", "model data", "model-data"]]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"), EMPTY(marker, id));
  }
  return dir;
}

test("writeBlock fills both blocks and leaves the rest of each page alone", () => {
  const dir = scratch();
  assert.deepEqual(writeBlock(FIXTURE, { check: false, root: dir }), []);
  for (const [d, name] of [["example", "example"], ["model", "model"]]) {
    const page = fs.readFileSync(path.join(dir, d, "index.html"), "utf8");
    assert.match(page, new RegExp(`<!-- ${name} data · 0{40} -->`));
    assert.ok(page.includes(JSON.stringify(FIXTURE[d])));
    assert.ok(page.startsWith("<p>before</p>"));
    assert.ok(page.trimEnd().endsWith("<p>after</p>"));
  }
});

test("writeBlock in check mode names every page that drifted", () => {
  const dir = scratch();
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }).sort(),
    ["example/index.html", "model/index.html"]);
});

test("writeBlock reports nothing once the pages are written", () => {
  const dir = scratch();
  writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }), []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test build/renderers.test.mjs`
Expected: FAIL, `Cannot find module` for `./block.mjs`

- [ ] **Step 3: Write `build/block.mjs`**

```js
// The data block, written into the two pages that carry one. Fenced by markers naming the
// commit, the way the token block is fenced by its version: a reader of the HTML can see which
// state of the model the page shows, and the check can find the block without parsing the page.
//
// `data-stage` is how the shared stage script finds a block — it queries the attribute, not an
// id, so one script serves both pages.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  { dir: "example", id: "example-data", marker: "example data" },
  { dir: "model", id: "model-data", marker: "model data" },
];

export function writeBlock(data, { check = false, root = HERE } = {}) {
  const stale = [];
  for (const t of TARGETS) {
    const d = data[t.dir];
    if (!d) throw new Error(`no artifact for ${t.dir}`);
    const START = new RegExp(`<!-- ${t.marker} · (?:[0-9a-f]+|none) -->\\n<script type="application\\/json" id="${t.id}"(?: data-stage)?>`);
    const END = `</script>\n<!-- /${t.marker} -->`;
    const block = `<!-- ${t.marker} · ${d.commit} -->\n<script type="application/json" id="${t.id}" data-stage>${JSON.stringify(d)}${END}`;
    const rel = `${t.dir}/index.html`;
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const start = page.search(START), end = page.indexOf(END);
    if (start < 0 || end < 0) throw new Error(`${rel} has no data block markers`);
    if (page.slice(start, end + END.length) === block) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, page.slice(0, start) + block + page.slice(end + END.length));
  }
  return stale;
}
```

- [ ] **Step 4: Run the test and make sure it passes**

Run: `node --test build/renderers.test.mjs`
Expected: PASS, 3 tests

- [ ] **Step 5: Write `build/pages.mjs`**

```js
// Renders the two artifacts into every region of this site derived from the model —
// `npm run pages` and `npm run pages:check`.
//
// Node built-ins only, and no network. That is the property worth keeping: the parser is a
// dependency and is not on disk until `npm ci` has run, so a check that needed it could not run
// in the cheap half of CI. Everything here is a pure function of two committed files.
//
// The pin guard is what would otherwise be a sentence in AGENTS.md saying which command to run
// first. An artifact that declares its own commit cannot be rendered stale, so the order of
// `npm run build` and `npm run pages` is enforced by the data rather than remembered.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeBlock } from "./block.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));

const data = {};
for (const name of ["example", "model"]) {
  const file = path.join(ROOT, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.error(`  ✗ ${name}.json is missing — run: npm run build`);
    process.exit(1);
  }
  data[name] = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data[name].commit !== commit) {
    console.error(`  ✗ ${name}.json is at ${data[name].commit.slice(0, 7)}, source.json pins ${commit.slice(0, 7)} — run: npm run build`);
    process.exit(1);
  }
}

const check = process.argv.includes("--check");
const RENDERERS = [writeBlock];

const stale = RENDERERS.flatMap((write) => write(data, { check }));

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match the artifacts — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches the artifacts at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from the artifacts at ${repo}@${commit.slice(0, 7)}`);
}
```

- [ ] **Step 6: Add the scripts**

In `package.json`, after the two `build` entries:

```json
    "pages": "node build/pages.mjs",
    "pages:check": "node build/pages.mjs --check",
    "test:build": "node --test build/renderers.test.mjs",
```

- [ ] **Step 7: Prove the data blocks are unchanged**

Run: `npm run pages && git diff --stat`
Expected: no output from `git diff --stat`. The blocks were already correct, so rendering them
again must change nothing.

Run: `npm run pages:check`
Expected: `✓ every derived region matches the artifacts at companygraph/meta-model@7f58f5e`

- [ ] **Step 8: Prove the pin guard**

```bash
cp source.json source.json.bak
node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync("source.json","utf8"));s.commit="a".repeat(40);fs.writeFileSync("source.json",JSON.stringify(s)+"\n")'
npm run pages:check; echo "exit: $?"
mv source.json.bak source.json
```
Expected: `✗ example.json is at 7f58f5e, source.json pins aaaaaaa — run: npm run build`, exit 1.
Then `git diff --stat` must be empty — the backup restored `source.json` exactly.

- [ ] **Step 9: Commit**

```bash
git add build/block.mjs build/pages.mjs build/renderers.test.mjs package.json
git commit -F - <<'MSG'
Pages are rendered from the artifacts, not from the model

Checking that a page still showed the pinned commit meant reaching GitHub and having the
parser installed, which is why that check sits below npm ci while the cheaper ones sit above
it. It is about to hold more than the two data blocks, so it is worth moving.

build/pages.mjs renders from the two committed artifacts with node built-ins and no network,
and refuses to run when either names a commit other than the one source.json pins. That guard
is an ordering rule the data enforces rather than a person remembering it. The data block is
the first renderer to move across; its bytes are unchanged.

Verified: node --test build/renderers.test.mjs passes 3 tests; npm run pages leaves git diff
empty; the guard fails as expected against a moved pin.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 3: The two pages say what they show

The only task that changes published output. Everything else in this plan is proved by an empty
diff; this one is proved by a diff containing exactly what the spec predicted.

**Files:**
- Create: `build/jsonld.mjs`
- Modify: `build/pages.mjs`, `build/renderers.test.mjs`

**Interfaces:**
- Consumes: the `write(data, { check, root }) => string[]` contract from Task 2.
- Produces: `writeJsonLd(data, { check, root, repo }) => string[]`.

Background the implementer needs, all measured on 2026-09-08:

- Both pages' JSON-LD round-trips exactly through `JSON.stringify(x, null, 2)`, so re-emitting
  the whole document leaves the four existing nodes byte-identical.
- Each page's `@graph` is `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` in that order.
  The new node is **appended**, not inserted — this renderer owns the tail, not the head, which
  is the opposite of blust.ch's. Do not reuse that shape.
- The only `{ "@id": … }` on one line in either file is inside an HTML comment above the block.
- `repo` is not in the artifacts and must not be added; read it from `source.json`.
- A schema entity's `id` is `core/<type>` and its `path` is `core/<type>-schema.md`. `termCode`
  comes from the id, the URL from the path.

- [ ] **Step 1: Write the failing test**

Append to `build/renderers.test.mjs`:

```js
import { writeJsonLd, terms } from "./jsonld.mjs";

const SCHEMAS = {
  ...FIXTURE,
  model: { ...FIXTURE.model, entities: [
    { id: "core/experience", type: "schema", name: "Experience Schema",
      tagline: "Required structure for experience files.", path: "core/experience-schema.md", sections: [] },
    { id: "core/skill", type: "schema", name: "Skill Schema",
      tagline: "Required structure for skill files.", path: "core/skill-schema.md", sections: [] },
  ] },
};

test("terms takes its code from the id and its url from the path", () => {
  const [first] = terms(SCHEMAS.model, "example/meta");
  assert.equal(first.name, "Experience Schema");
  assert.equal(first.description, "Required structure for experience files.");
  assert.equal(first.termCode, "experience");
  assert.equal(first.url,
    `https://github.com/example/meta/blob/${SCHEMAS.model.commit}/core/experience-schema.md`);
  assert.deepEqual(first.inDefinedTermSet, { "@id": "https://companygraph.io/model/#vocabulary" });
});

function ldScratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-ld-"));
  const doc = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
    { "@type": "BreadcrumbList", "@id": "https://companygraph.io/model/#breadcrumb", itemListElement: [] },
  ] };
  for (const d of ["example", "model"]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"),
      `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  }
  return { dir, doc };
}

test("writeJsonLd appends its node and leaves the four existing ones untouched", () => {
  const { dir, doc } = ldScratch();
  writeJsonLd(SCHEMAS, { check: false, root: dir, repo: "example/meta" });
  const read = (d) => JSON.parse(fs.readFileSync(path.join(dir, d, "index.html"), "utf8")
    .match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1])["@graph"];
  const model = read("model");
  assert.equal(model.length, 5, "four kept plus one appended");
  assert.deepEqual(model.slice(0, 4), doc["@graph"], "the existing nodes are untouched");
  assert.equal(model[4]["@type"], "DefinedTermSet");
  assert.equal(model[4].hasDefinedTerm.length, 2);
  assert.equal(model[4].encoding.contentUrl, "https://companygraph.io/model.json");
  const example = read("example");
  assert.equal(example[4]["@type"], "Dataset");
  assert.equal(example[4].distribution.contentUrl, "https://companygraph.io/example.json");
});

test("writeJsonLd refuses a graph whose head is not the four it passes through", () => {
  // The guard exists so a differently shaped page is refused rather than having four
  // hand-written nodes silently replaced by one. A graph missing its BreadcrumbList is the
  // case that matters: the slice would keep three of them and drop the fourth.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-ld-bad-"));
  const doc = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": "https://companygraph.io/#organization", name: "CompanyGraph" },
    { "@type": "WebSite", "@id": "https://companygraph.io/#website", name: "CompanyGraph" },
    { "@type": "WebPage", "@id": "https://companygraph.io/model/#webpage", name: "Kept" },
  ] };
  for (const d of ["example", "model"]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"),
      `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  }
  assert.throws(() => writeJsonLd(SCHEMAS, { check: true, root: dir, repo: "example/meta" }),
    /must begin with/);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test build/renderers.test.mjs`
Expected: FAIL, `Cannot find module` for `./jsonld.mjs`

- [ ] **Step 3: Write `build/jsonld.mjs`**

```js
// What the two stage pages show, said in the graph. Both drew a model and described themselves
// to a machine only as a WebPage, so the data behind them was reachable by scraping a script
// element out of rendered HTML and no other way — which is the work these nodes exist to make
// unnecessary.
//
// The two are not the same kind of thing. `/example/` holds a company: an identity, profiles,
// experiences, skills, values, a vision, so it is a Dataset. `/model/` holds nine documents
// stating the structure a file must carry, which are records about structure rather than about
// a company, so it is a DefinedTermSet. Schema.org gives a term set no `distribution` — that
// property takes a DataDownload and belongs to Dataset alone — so the file hangs off `encoding`,
// which takes a MediaObject, and a DataDownload is not used there either because its own
// definition is "all or part of a Dataset in downloadable form".
//
// The terms are generated. A term set whose terms are absent names a vocabulary without naming
// a word of it, and nine names maintained beside a model that already holds them is the drift
// this family keeps removing. Each keeps the schema's own name and tagline: calling the term
// `Experience` rather than `Experience Schema` reads better and is a transformation the model
// never authorized.
//
// This renderer owns the tail of each graph, not the head. The four nodes before it —
// Organization, WebSite, WebPage, BreadcrumbList — are this site's own and stay hand-written,
// so the node is appended and the head is passed through untouched.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://companygraph.io";
const LICENSE = "https://www.apache.org/licenses/LICENSE-2.0";
const CREATOR = { "@id": `${SITE}/#organization` };

// The four nodes this site writes by hand, in the order every page carries them. The renderer
// replaces what follows and refuses a page whose head is not this, rather than appending to a
// graph it does not recognize.
const HEAD = ["Organization", "WebSite", "WebPage", "BreadcrumbList"];

export function terms(model, repo) {
  return model.entities.map((e) => ({
    "@type": "DefinedTerm",
    "@id": `${SITE}/model/#term-${e.id.split("/").pop()}`,
    name: e.name,
    description: e.tagline,
    termCode: e.id.split("/").pop(),
    url: `https://github.com/${repo}/blob/${model.commit}/${e.path}`,
    inDefinedTermSet: { "@id": `${SITE}/model/#vocabulary` },
  }));
}

function nodeFor(dir, data, repo) {
  if (dir === "example") {
    return {
      "@type": "Dataset",
      "@id": `${SITE}/example/#dataset`,
      name: "Beacon Systems — an example CompanyGraph instance",
      description: "A fictional company described in CompanyGraph: its identity, profiles, experiences, skills, values and vision.",
      url: `${SITE}/example/`,
      license: LICENSE,
      creator: CREATOR,
      isBasedOn: `https://github.com/${repo}`,
      distribution: {
        "@type": "DataDownload",
        contentUrl: `${SITE}/example.json`,
        encodingFormat: "application/json",
      },
    };
  }
  return {
    "@type": "DefinedTermSet",
    "@id": `${SITE}/model/#vocabulary`,
    name: "CompanyGraph core vocabulary",
    description: "The schemas a company is described in: one per type, each stating the structure its files must carry and how they refer to one another.",
    url: `${SITE}/model/`,
    license: LICENSE,
    creator: CREATOR,
    encoding: {
      "@type": "MediaObject",
      contentUrl: `${SITE}/model.json`,
      encodingFormat: "application/json",
    },
    hasDefinedTerm: terms(data.model, repo),
  };
}

const RE = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/;

export function writeJsonLd(data, { check = false, root = HERE, repo } = {}) {
  if (!repo) throw new Error("writeJsonLd needs the repo from source.json");
  const stale = [];
  for (const dir of ["example", "model"]) {
    const rel = `${dir}/index.html`;
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const m = RE.exec(page);
    if (!m) throw new Error(`${rel} carries no JSON-LD block`);
    const doc = JSON.parse(m[2]);
    if (!Array.isArray(doc["@graph"])) throw new Error(`${rel}'s JSON-LD has no @graph`);
    // The head is this site's and the tail is this renderer's. A graph that does not begin with
    // the four hand-written nodes is one this renderer would corrupt by appending to, so it
    // refuses rather than guessing which entries are its own.
    const head = doc["@graph"].slice(0, HEAD.length).map((n) => n && n["@type"]);
    if (head.join() !== HEAD.join()) {
      throw new Error(`${rel}: @graph must begin with ${HEAD.join(", ")}, not ${head.join(", ") || "nothing"}`);
    }
    doc["@graph"] = [...doc["@graph"].slice(0, HEAD.length), nodeFor(dir, data, repo)];
    const text = JSON.stringify(doc, null, 2);
    const next = page.replace(RE, (all, open, _body, close) => open + text + close);
    // It has to parse after the write as well as before it: this rewrites a region inside a
    // document that the rest of the site, and every crawler, reads as JSON. Re-extracted from
    // the rewritten page rather than from `text`, because parsing what JSON.stringify just
    // returned proves only that JSON.stringify works.
    const after = RE.exec(next);
    if (!after) throw new Error(`${rel}: the JSON-LD block did not survive the write`);
    JSON.parse(after[2]);
    if (next === page) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, next);
  }
  return stale;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `node --test build/renderers.test.mjs`
Expected: PASS, 6 tests

- [ ] **Step 5: Register it**

In `build/pages.mjs`:

```js
import { writeJsonLd } from "./jsonld.mjs";
const RENDERERS = [writeBlock, (d, o) => writeJsonLd(d, { ...o, repo })];
```

- [ ] **Step 6: Render, and read the diff line by line**

Run: `npm run pages && git diff --stat`

Expected: exactly two files changed, `example/index.html` and `model/index.html`, and no change
to either artifact or to either data block.

Run: `git diff -- example/index.html model/index.html | grep '^[-+]' | grep -v '^[-+][-+]' | sort | uniq -c | sort -rn | head -30`

Expected: additions only, and every one of them inside the new node — the `Dataset` on
`/example/` and the `DefinedTermSet` with nine `DefinedTerm` entries on `/model/`.

**If a line beginning `-` appears at all, or any line mentions `Organization`, `WebSite`,
`WebPage`, `BreadcrumbList`, `isPartOf` or `itemListElement`, stop and report BLOCKED.** That
means the renderer is disturbing a node it does not own, which is the one thing this task
promises will not happen.

- [ ] **Step 7: Confirm the checks**

Run: `npm run pages:check`
Expected: `✓ every derived region matches the artifacts at companygraph/meta-model@7f58f5e`

```bash
node -e 'const fs=require("fs");const p="model/index.html";fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("Experience Schema","EDITED"))'
npm run pages:check; echo "exit: $?"
git checkout model/index.html && npm run pages
```
Expected: `✗ model/index.html no longer match the artifacts — run: npm run pages`, exit 1. The
final `npm run pages` restores the page; confirm `git diff --stat` afterwards shows only the two
pages this task legitimately changed.

- [ ] **Step 8: Commit**

```bash
git add build/jsonld.mjs build/pages.mjs build/renderers.test.mjs example/index.html model/index.html
git commit -F - <<'MSG'
The two stage pages say what they show

Both drew a model from a pinned commit and told a machine only that they were web pages with
a breadcrumb, indistinguishable from the billing page. The data behind them was reachable by
scraping a script element out of rendered HTML and no other way.

The example page now carries a Dataset, because 24 entities describing a company is one, and
the model page a DefinedTermSet with a term per schema, because nine documents stating
required structure are not records about a company. Schema.org gives a term set no
distribution, so its file hangs off encoding instead. The terms are generated from the same
artifact the drawing uses, so a re-pin carries new words into them and a tenth schema becomes
a tenth term with nothing edited by hand.

Verified: node --test build/renderers.test.mjs passes 6 tests; the diff adds only the new node
on each page and removes nothing; pages:check goes red on a hand-edited term.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 4: CI, the cards, and the documents

**Files:**
- Modify: `.github/workflows/ci.yml:47-55`
- Modify: `AGENTS.md:69`, `:136`, `:424`
- Modify: `README.md:54`, `:99-100`
- Modify: `example/og.png`, `example/og.sha`, `model/og.png`, `model/og.sha`

**Interfaces:** none. This task ships no code.

- [ ] **Step 1: Rewrite the CI steps**

Replace the `The stage pages still show the pinned commit` step with two. The first goes
**above** `- run: npm ci`, directly after the `setup-node` block:

```yaml
      # Every region this site derives from the model, held against the artifacts it derives
      # them from. Before npm ci because it installs nothing: pages.mjs and its renderers are
      # node built-ins and two committed files, with no network. That is the whole reason the
      # artifacts are committed — the check that catches a page edited by hand is also the
      # cheapest step in this job.
      - name: The derived regions still match the artifacts
        run: npm run pages:check
```

The second keeps the position and the comment the old step had, below `npm ci`:

```yaml
      # After npm ci, and this is not cosmetic: build/build.mjs imports the parser from
      # companygraph-meta-model, which is not on disk until then. Left above npm ci it fails
      # every push with ERR_MODULE_NOT_FOUND, and a local run cannot catch that, because
      # node_modules is already on the machine.
      - name: The artifacts still match the pinned commit
        run: npm run build:check
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

- [ ] **Step 2: Check the workflow parses and the order is right**

Run: `python3 -c 'import yaml; d=yaml.safe_load(open(".github/workflows/ci.yml")); [print("  ", s.get("name") or ("RUN " + s.get("run","")[:30])) for s in d["jobs"]["verify"]["steps"]]'`

Expected: `pages:check` appears before the `npm ci` step, `build:check` after it, and no step
named for `example` remains. Cross-check every `npm run` in the workflow against `package.json`.

- [ ] **Step 3: Update the documents**

Three places in `AGENTS.md` and two in `README.md` name the old command. Find them with:

```bash
grep -n "npm run example\|example:check\|build/build.mjs" AGENTS.md README.md
```

`AGENTS.md:69` describes one pin serving both pages and `example:check` holding them; it now
describes two artifacts, `npm run build` writing them, `npm run pages` rendering four regions
from them, and the guard that makes the order impossible to get wrong. `AGENTS.md:136` says
`build/build.mjs` writes the `data-stage` attribute into every block — that is `build/block.mjs`
now. `AGENTS.md:424` says `npm run example` would overwrite a hand edit and `example:check`
would catch it — that is `npm run pages` and `pages:check`.

`README.md:54` describes `build/build.mjs` writing each page's data block; it now writes two
artifacts. `README.md:99-100` are the two command lines, which become four: `build`,
`build:check`, `pages`, `pages:check`.

Add one sentence to `README.md` after the command block: `example.json` and `model.json` are
committed files, and moving the pin means `npm run build` then `npm run pages`.

- [ ] **Step 4: Hold the prose to the conventions**

Run: `sh conventions/conventions-check`
Expected: `✓ every Markdown file follows WRITING.md`

- [ ] **Step 5: Re-render the two stale share cards**

The bytes of both pages changed in Task 3, so their cards report stale and CI runs that check.

Run: `npm run og:check; echo "exit: $?"`
Expected: exit 1, naming `example/og.png` and `model/og.png` — two cards, not seven.

Run: `npm run og`, then `npm run og:check`
Expected: `every card matches the page it renders`, exit 0.

The PNGs may come back byte-identical while only the `og.sha` stamps move; that is correct and
documented — the recipe hashes the page, not the picture.

- [ ] **Step 6: Prove the whole thing from a clean slate**

```bash
rm -f example.json model.json && npm run pages; echo "exit: $?"
npm run build && npm run pages && npm run pages:check && npm run test:build && git diff --stat
```
Expected: the first command fails with `example.json is missing — run: npm run build`, exit 1;
then every command passes and `git diff --stat` shows nothing beyond what Task 3 and Step 5
already committed.

Then the browser suite, which is what proves both artifacts are served — the graph check fetches
every on-site URL it finds and requires HTTP 200:

```bash
python3 -m http.server 8000 > /dev/null 2>&1 &
for i in $(seq 1 20); do curl -sf http://127.0.0.1:8000/ > /dev/null && break; sleep 0.5; done
npm run verify
```
Expected: green, all seven pages.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ci.yml AGENTS.md README.md example/og.png example/og.sha model/og.png model/og.sha
git commit -F - <<'MSG'
CI checks the derived regions before it installs anything

One step checked the two pages against the model and it needed GitHub and the parser, so it
sat below npm ci. Now the check that holds every derived region reads two committed files
with node built-ins and runs above it, and the only step needing the network is the one
asking whether those files are still what the pinned commit parses to.

The documents catch up with the mechanism, and both stage pages' share cards are re-rendered:
their bytes moved when the graph gained a node, and a card that is not re-rendered fails
og:check on the next push.

Verified: npm run pages:check, build:check, test:build, og:check and npm run verify all pass;
conventions-check passes; git diff is empty after a full regenerate from deleted artifacts.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

- [ ] **Step 8: Stop**

Do not push and do not open a pull request. Report what passed and stop; the owner decides
when this is proposed and merged.

---

## Self-review

**Spec coverage.** §2's two nodes, the generated terms, the two artifacts and the pin guard are
Tasks 1 to 3. §3's file structure is Tasks 1 to 3, with no `read.mjs`, as the spec requires.
§4's commands are Tasks 1, 2 and 4. §5's CI is Task 4. §6's card re-render is Task 4 step 5.
§7's acceptance test runs in Task 3 step 6 and Task 4 step 6.

**Placeholders.** None. Every code step carries the code, every check step the command and its
expected output.

**Type consistency.** Both renderers export `write*(data, { check, root }) => string[]` and are
called from the `RENDERERS` array; `writeJsonLd` takes one extra option, `repo`, which
`pages.mjs` binds because the artifacts deliberately do not carry it. `terms` is exported for
its test and used by `nodeFor`.

**One difference from blust.ch worth naming.** That site's JSON-LD renderer owns the *leading*
three nodes and slices from the front. This one owns the *last* node and slices from the front
to keep four. The guard is therefore also inverted: it checks the head is what this site writes
by hand, rather than that the head is what the renderer writes. Reusing blust.ch's shape here
would delete the `Organization`, `WebSite`, `WebPage` and `BreadcrumbList` nodes.

**Left for later, deliberately.** `stage.js:31` and `card.js:227` fall back to a hardcoded
`companygraph/meta-model` when a block carries no `repo`, and the comment in blust.ch's copy
names this repository as the reason the fallback still exists. Adding `repo` to these artifacts
would change both blocks' bytes, which this plan promises not to do, so it is its own small
piece of work in the design package and here.
