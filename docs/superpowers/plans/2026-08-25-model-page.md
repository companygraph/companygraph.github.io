# Model Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `companygraph.io/model/` — the core vocabulary of `meta-model` at the pinned commit, drawn with the example page's stage — with the stage extracted into shared files, one pin for both pages, the nav item before Example, a share card, and the checks that go with a page.

**Architecture:** The parser in `example/instance.mjs` learns two things it needs for schema files (several captioned tables in one section; a `parseSchemas(files)` that turns `core/*.md` into the same `{root,types,entities,edges}` shape by reading `ref →` cells and the `**Owner:**` line). `build.mjs` reads one root `source.json` and writes/checks both blocks. The example page's stage CSS and script move to `/stage.css` and `/stage.js` (with `d3.v7.min.js` moved to the root), gaining edge labels and multi-table cards; the model page is the example page's skeleton pointing at `#model-data`.

**Tech Stack:** as the example page — HTML/CSS/JS by hand, Node 22 with no dependencies for the generator and tests, Playwright for `verify` and `og`, vendored d3.

**Spec:** [`docs/superpowers/specs/2026-08-25-model-page-design.md`](../specs/2026-08-25-model-page-design.md) — read §2 (generator), §4 (stage, shared) and §5 (verification) before starting. The example page's spec [`2026-08-25-example-page-design.md`](../specs/2026-08-25-example-page-design.md) §4 still governs the stage's behaviour. Where plan and spec disagree, the spec wins.

## Global Constraints

Copied from the specs and `CLAUDE.md`. Every task's requirements implicitly include this section.

- **Nothing about the model or the example is written by hand.** The only invented strings are the two root labels, named as such in `instance.mjs`. The model page's prose names no type, field or count.
- **One pin:** `/source.json` `{ repo, commit }`; `npm run example` writes both blocks, `npm run example:check` compares both; script names unchanged.
- **Blocks:** `<!-- example data · <commit> -->…<script type="application/json" id="example-data">…</script>…<!-- /example data -->` in `example/index.html`; `<!-- model data · <commit> -->…id="model-data"…<!-- /model data -->` in `model/index.html`.
- **Parsing by the fixed shape only.** A `ref → <type>` with no schema file throws `R4: …`.
- **The example page renders and behaves exactly as before** after the extraction — its existing `verify` spec and `graph` check must pass unchanged except for the data-block id parameter.
- **Self-contained:** relative `<link href="../stage.css">`, `<script src="../d3.v7.min.js">`, `<script src="../stage.js">`; no request off-origin; `sameOrigin: true` on both pages.
- **English markup, German in `data-de`**; the stage's UI strings carry German as today. **Mono means data**; controls are never mono. **Nothing opens in a new tab.** **Additive motion; reduced motion = 0 ms transitions.**
- **Tokens block `design tokens · v2`** copied verbatim from billing; `verify/design.mjs` never edited.
- **Cards:** `og.png` + `og.sha` committed together with the page; `npm run og` never in CI. **Never print an environment variable's value.**
- **Commits on branch `model-page`**, one per task, sentence-style messages ending with a blank line and `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. The PR is opened at the end and **not merged** — the user reviews it.

## File Structure

| File | Responsibility |
|---|---|
| `example/instance.mjs` | `parseInstance` (multi-table sections), `parseSchemas`, `ROOT_LABEL`, `CORE_LABEL` |
| `example/build.mjs` | reads `/source.json`; `TARGETS = [{ dir:"example", id:"example-data", parse:parseInstance, sub:"example/" }, { dir:"model", id:"model-data", parse:parseSchemas, sub:"core/" }]`; write or `--check` both |
| `source.json` | the pin (moved from `example/source.json`) |
| `stage.css`, `stage.js`, `d3.v7.min.js` | the shared stage at the site root |
| `example/index.html` | prose + data block; links the shared stage |
| `model/index.html` | the new page |
| `verify/instance.test.mjs` | parser tests incl. `parseSchemas`; d3 identity test path updated |
| `verify/check.mjs` | `/model/` spec; `graph` parametrised by block id; nav strings on every page |
| `og-recipe.mjs`, `sitemap.xml`, `README.md`, `CLAUDE.md`, `.github/workflows/ci.yml` (only if a path changed) | the per-page debts |

All commands run from the worktree `~/git/companygraph/companygraph.github.io-model`; a server for it runs on `http://localhost:8015` (`BASE=http://localhost:8015 npm run verify`). A meta-model checkout is at `~/git/companygraph/meta-model` (`META_MODEL=$HOME/git/companygraph/meta-model` for local generation; its HEAD must equal the pin).

---

### Task 1: The parser learns schemas, test-first

**Files:**
- Modify: `example/instance.mjs`
- Modify: `verify/instance.test.mjs`

**Interfaces:**
- Produces: sections gain `tables: [{ caption: string|null, columns, rows }]` (all tables in the section, in order; `caption` is the text of the line directly above the table when it ends with a colon, else null); `table` remains the first table for compatibility, `text` excludes caption lines and table lines.
- Produces: `parseSchemas(files: Map<path, markdown>) → { commit:null, root: CORE_LABEL, types:[{type:"schema", folder:"core", owner:null}], entities, edges }` where entity `id` is `core/<type>` (the filename without `-schema.md`), `type` is `"schema"`, `name` the H1, `fields.owner` from the `**Owner:** x` line when present, `path` = `core/<file>`; edges as spec §2 (`via` = field name / `Section.Column` / `"owner"`, `attrs.type` = the Type cell for table edges). `export const CORE_LABEL = "Core"`.
- Errors: `R4: …` when a `ref → <type>` names no schema; `R9: …` when a schema lacks `## Frontmatter` or `## Sections`.

- [ ] **Step 1: Failing tests** — append to `verify/instance.test.mjs`:

```js
import { parseSchemas, CORE_LABEL } from "../example/instance.mjs";

const core = new Map([
  ["profile-schema.md", `# Profile Schema

> Required structure for profile files.

## File Location

\`profiles/<profile>/<profile>.md\`

A profile owns experiences.

## Frontmatter

| Field | Required | Type | Description |
| --- | --- | --- | --- |
| \`source\` | Yes | ref → source | Where mastered |
| \`email\` | No | string | Contact |

## Sections

| Section | Required | Description |
| --- | --- | --- |
| \`# [Name]\` | Yes | The canonical name. |
| \`## Skills\` | No | Table. One row per skill. |

\`## Skills\` is a table with these columns:

| Column | Required | Type | Description |
| --- | --- | --- | --- |
| \`Skill\` | Yes | ref → skill | Must match |
| \`Level\` | Yes | ref → proficiency-level | Must match |
| \`Evidence\` | Yes | string | A fact |
`],
  ["experience-schema.md", `# Experience Schema

> Required structure for experience files.

**Owner:** profile

## File Location

\`profiles/<profile>/experiences/*.md\`

## Frontmatter

| Field | Required | Type | Description |
| --- | --- | --- | --- |
| \`source\` | Yes | ref → source | Where mastered |
| \`skills\` | No | array of ref → skill | Names |

## Sections

| Section | Required | Description |
| --- | --- | --- |
| \`# [Title]\` | Yes | The name |
`],
  ["skill-schema.md", "# Skill Schema\n\n> Skills.\n\n## File Location\n\n`skills/*.md`\n\n## Frontmatter\n\n| Field | Required | Type | Description |\n| --- | --- | --- | --- |\n| `source` | Yes | ref → source | Where |\n\n## Sections\n\n| Section | Required | Description |\n| --- | --- | --- |\n| `# [Skill]` | Yes | Name |\n"],
  ["proficiency-level-schema.md", "# Proficiency Level Schema\n\n> Levels.\n\n## File Location\n\n`proficiency-levels/*.md`\n\n## Frontmatter\n\n| Field | Required | Type | Description |\n| --- | --- | --- | --- |\n| `source` | Yes | ref → source | Where |\n\n## Sections\n\n| Section | Required | Description |\n| --- | --- | --- |\n| `# [Label]` | Yes | Name |\n"],
  ["source-schema.md", "# Source Schema\n\n> Sources.\n\n## File Location\n\n`sources/*.md`\n\n## Frontmatter\n\n| Field | Required | Type | Description |\n| --- | --- | --- | --- |\n| `url` | No | string | Where |\n\n## Sections\n\n| Section | Required | Description |\n| --- | --- | --- |\n| `# [Name]` | Yes | Name |\n"],
]);

test("a section keeps every table it holds, each with the caption that addresses it", () => {
  const { entities } = parseSchemas(core);
  const profile = entities.find(e => e.id === "core/profile");
  const sections = profile.sections.find(s => s.heading === "Sections");
  assert.equal(sections.tables.length, 2);
  assert.equal(sections.tables[0].caption, null);
  assert.equal(sections.tables[1].caption, "`## Skills` is a table with these columns:");
  assert.deepEqual(sections.tables[1].columns, ["Column", "Required", "Type", "Description"]);
  assert.equal(sections.table, sections.tables[0]);
  assert.ok(!sections.text.includes("is a table with these columns"));
});

test("schemas become entities of one type in one folder, named by their H1", () => {
  const { root, types, entities } = parseSchemas(core);
  assert.equal(root, CORE_LABEL);
  assert.deepEqual(types, [{ type: "schema", folder: "core", owner: null }]);
  assert.deepEqual(entities.map(e => e.id), ["core/experience", "core/proficiency-level", "core/profile", "core/skill", "core/source"]);
  const exp = entities.find(e => e.id === "core/experience");
  assert.equal(exp.name, "Experience Schema");
  assert.equal(exp.fields.owner, "profile");
  assert.equal(exp.path, "core/experience-schema.md");
  assert.equal(exp.owner, null);
});

test("a ref → cell in a frontmatter table is an edge to that type's schema", () => {
  const { edges } = parseSchemas(core);
  assert.deepEqual(edges.find(x => x.from === "core/experience" && x.via === "skills"),
    { from: "core/experience", to: "core/skill", via: "skills", attrs: { type: "array of ref → skill" } });
  assert.deepEqual(edges.find(x => x.from === "core/skill" && x.via === "source"),
    { from: "core/skill", to: "core/source", via: "source", attrs: { type: "ref → source" } });
});

test("a ref → cell in a column table is an edge via Section.Column; the Owner line is an edge via owner", () => {
  const { edges } = parseSchemas(core);
  assert.deepEqual(edges.find(x => x.via === "Skills.Level"),
    { from: "core/profile", to: "core/proficiency-level", via: "Skills.Level", attrs: { type: "ref → proficiency-level" } });
  assert.deepEqual(edges.find(x => x.via === "owner"),
    { from: "core/experience", to: "core/profile", via: "owner", attrs: {} });
});

test("a ref → a type with no schema is an R4 error", () => {
  const broken = new Map(core);
  broken.set("skill-schema.md", broken.get("skill-schema.md").replace("ref → source", "ref → team"));
  assert.throws(() => parseSchemas(broken), /^Error: R4: .*team/);
});

test("the example instance still parses with tables, one per section", () => {
  const mira = parseInstance(valid).entities.find(e => e.name === "Mira Halvorsen");
  const skills = mira.sections.find(s => s.heading === "Skills");
  assert.equal(skills.tables.length, 1);
  assert.equal(skills.tables[0].caption, null);
  assert.equal(skills.table, skills.tables[0]);
});
```

- [ ] **Step 2: Run, see the new tests fail** (`npm run test:example`; `parseSchemas` is not exported).
- [ ] **Step 3: Implement.** In `parseBody`'s `flush`, split the section's lines into runs: a caption is a non-table line ending in `:` directly followed by a table block; each table block becomes `{ caption, columns, rows }`; `tables` collects them in order; `table = tables[0]` when any; `text` is the remaining non-table, non-caption lines joined and trimmed. Add `parseSchemas`: for each `*-schema.md` file, `type = file.replace(/-schema\.md$/, "")`, parse frontmatter (none expected) and body; the `**Owner:** x` line is matched before section parsing and removed from the text; require `Frontmatter` and `Sections` sections (else `R9`); entities sorted by id; then edges: for the Frontmatter section's first table, rows whose Type cell matches `/^(array of )?ref → (.+)$/` → edge to `core/<type>` (throw `R4: "<type>" in <path> names no schema` if absent), `via` = the Field cell without backticks, `attrs: { type: cell }`; for the Sections section's captioned tables, `via` = `<section name from caption without backticks and "## ">.<Column cell without backticks>`; the owner edge last. Sort edges as `parseInstance` does. Export `CORE_LABEL = "Core"` with a comment naming it as the one invented string of the model page.
- [ ] **Step 4: Run — all tests pass** (expect 18). Also run `parseSchemas` against the real `core/` via a one-liner (like Task 1 of the example plan did for `parseInstance`) and paste the edge list in the report: expect edges from every schema to `core/source` via `source`, `core/experience → core/skill` via `skills`, `core/profile → core/skill` via `Skills.Skill`, `core/profile → core/proficiency-level` via `Skills.Level`, `core/experience → core/profile` via `owner`.
- [ ] **Step 5: Commit** — `Read the vocabulary the way an instance is read, and keep every table a section holds`.

---

### Task 2: One pin, two blocks

**Files:**
- Move: `example/source.json` → `source.json`
- Modify: `example/build.mjs`; `model/index.html` placeholder block (create the file with only the markers and an empty block so the generator has a target — Task 4 fills the page); `README.md` and `CLAUDE.md` where they name `example/source.json`
- Modify: `verify/check.mjs` if it reads `source.json` (it does not; confirm)

- [ ] **Step 1:** `git mv example/source.json source.json`; `build.mjs` reads `../source.json` relative to itself. Define `TARGETS` as in the File Structure; `readLocal`/`readRemote` take the subfolder (`example/` or `core/`) and return the map with that prefix stripped; for each target parse with its parser, set `commit`, write the block between that page's markers (`example data`/`model data`, ids `example-data`/`model-data`); `--check` compares every target and exits 1 naming the ones that differ; the success line names both pages.
- [ ] **Step 2:** Create `model/index.html` containing only `<!-- model data · none -->\n<script type="application/json" id="model-data">{}</script>\n<!-- /model data -->\n` for now.
- [ ] **Step 3:** `META_MODEL=$HOME/git/companygraph/meta-model npm run example` → writes both; `npm run example:check` (remote) → ✓ both. `npm run test:example` still green. `grep -rn "example/source.json"` → update every mention (README, CLAUDE.md, the spec's file table is historical — leave specs).
- [ ] **Step 4: Commit** — `Pin the site once, and generate the vocabulary beside the instance`.

---

### Task 3: The stage moves out of the example page

**Files:**
- Create: `stage.css`, `stage.js`; move `example/d3.v7.min.js` → `d3.v7.min.js`
- Modify: `example/index.html` (remove the stage CSS/JS, link the files), `verify/instance.test.mjs` (d3 path), `og-recipe.mjs` if a hide rule referenced a moved selector (none expected), `README.md`

**Interfaces:**
- Produces: `stage.js` exposes nothing global except that it initialises on `DOMContentLoaded` (or immediately, since it loads at the end of the body) from the element `document.querySelector('script[type="application/json"][data-stage]')` — the page marks its block with `data-stage`. Everything else is as today: `#path`, `#fig`, `#card`, `#cbody`, `#cfoot`, `#expand`, `#stagemodal`, `#recentre`, `#srclink`, `#srccommit`, `.stagehead`, `.stage`.
- Produces: `stage.js` reads an optional `label` on an edge (`edge.label`, a string) and draws it in mono beside the reference line's target, as the Level attribute is drawn today; when absent, nothing changes. And the card renders `section.tables` (all, each under its `caption` in mono when present) instead of `section.table`.
- Produces: `stage.css` contains every rule that begins `.stagehead`, `.path`, `.stage`, `.canvas`, `.recentre`, `.card`, `.cbody`, `.cfoot`, `.expand`, `.modal`, `#fig`, `dialog` — the figure-section rules; the page keeps its own `.figure-section`, `.figcap` and prose rules.

- [ ] **Step 1:** Cut the stage CSS and script out of `example/index.html` verbatim into `stage.css` / `stage.js`; in the page add `<link rel="stylesheet" href="../stage.css">` in the head after the inline `<style>`, and `<script src="../d3.v7.min.js"></script><script src="../stage.js"></script>` where the two scripts were; mark the block `data-stage`. In `stage.js`, replace `document.getElementById("example-data")` with the `data-stage` query. Move `d3.v7.min.js`; fix the identity test's path.
- [ ] **Step 2:** Add the two generic features: edge labels (`edge.label`), and the multi-table card (iterate `section.tables`; a `caption` renders as a `<p class="caption mono">` above its table; keep `.go` links for resolving cells). Keep the example page's output identical when no labels and single tables — screenshot the profile focus before and after and compare by eye.
- [ ] **Step 3:** `BASE=http://localhost:8015 npm run verify` — every page passes, `/example/` including `graph`; `npm run og` (the example card's recipe now includes `stage.css`/`stage.js`/`d3` as drawn assets — confirm with `node -e 'import("./og-recipe.mjs").then(m=>console.log(m.sources("example")))'`), `og:check`, `test:og`, `test:example`.
- [ ] **Step 4: Commit** — `Move the stage out of the example page, so a second page can stand on it`.

---

### Task 4: The model page

**Files:**
- Create: `model/index.html` (replace the placeholder, keeping the block), `model/og.png`, `model/og.sha`
- Modify: `verify/check.mjs` (`/model/` spec; `graph` takes its block id from the spec value — `graph: "model-data"`, with `graph: "example-data"` on the example spec; nav strings everywhere), `index.html`, `privacy/index.html`, `billing/index.html`, `talks/index.html`, `example/index.html` (nav: `Model`/`Modell` before Example), `og-recipe.mjs` (fifth card, `EXAMPLE_HIDE` reused), `sitemap.xml`, `README.md`, `CLAUDE.md`

- [ ] **Step 1:** Copy `example/index.html` to `model/index.html` over the placeholder (keep the markers/block from Task 2). Replace: `<title>Model — CompanyGraph</title>`; descriptions EN `The vocabulary a company is described in — one schema per type, drawn as the graph of what references what. Generated from the model's own core, nothing written by hand.` / DE `Das Vokabular, in dem eine Firma beschrieben wird — ein Schema pro Typ, gezeichnet als der Graph dessen, was worauf verweist. Erzeugt aus dem Kern des Modells, nichts von Hand geschrieben.`; canonical/og:url/og:image → `/model/`; `og:image:alt` `The model, drawn: the core vocabulary with its folder and its schemas.`; JSON-LD WebPage → Model; nav with `Model` current and `../example/` as a link; the title block, caption, "How to read it" and "Where it comes from" prose per spec §3 (EN + `data-de`; the source line reads `meta-model/core @ <commit>` and links `…/tree/<commit>/core` — `stage.js` sets it from `data.commit`, so make the sub-path a `data-src="core"` attribute on `#srclink` that `stage.js` reads, defaulting to `example`); the block marked `data-stage`.
- [ ] **Step 2:** Edge labels: the model's generator does not emit `label`; in `stage.js` derive the label from `edge.via` when the block's root type is `schema` — simpler: `parseSchemas` sets `label: via` on every edge (add that to Task 1's expected objects only if you do it there; otherwise set it in `build.mjs` for the model target). Choose the `build.mjs` route: after parsing the model target, `edges.forEach(e => e.label = e.via)`. Update the generated block.
- [ ] **Step 3:** `verify/check.mjs`: `/model/` spec = the example spec with `contains: ["The model", "drawn", "A dashed line", "How to read it", "Where it comes from"]`, `translates.shows: ["Das Modell", "gezeichnet", "Wie man es liest", "MODELL"]`, `graph: "model-data"`, `noNewTab: true`, `sameOrigin: true`; the `graph` check reads `document.getElementById(spec.graph)` and asserts the source link ends with `/tree/${data.commit}/${srcSub}` where `srcSub` is `#srclink`'s `data-src`. Nav strings: landing `contains` gains `"MODEL"`, `translates.shows` `"MODELL"`; privacy/billing/talks/example `sameTab` gain `"../model/"` (landing: `"model/"`), talks `translates.shows` `"MODELL"`.
- [ ] **Step 4:** Nav on every page: `<a href="model/" data-de="Modell">Model</a>` (landing) / `../model/` (others), between Talks and Example. `og-recipe.mjs`: `{ dir: "model", ...FRAME, hide: EXAMPLE_HIDE, titleSlide: false, settle: "reduced-motion" }` — rename the constant `STAGE_HIDE` and update its comment to say both stage pages use it. `sitemap.xml` + `/model/`. README: the model page and the shared stage files. CLAUDE.md: the "one mechanical exception" bullet becomes two pages from one pin; "four cards" → five.
- [ ] **Step 5:** Render `/model/` at 1280 and 390, EN and DE, root and a schema focused (screenshots under `.superpowers/`), look: schemas as squares, edge labels legible, the card showing File Location / Frontmatter table / Sections table + captioned column table. `npm run og && npm run og:check && npm run test:og && npm run test:example && npm run example:check && BASE=http://localhost:8015 npm run verify` — all green.
- [ ] **Step 6: Commit** — `Draw the vocabulary itself, one page before the example`.

---

### Task 5: PR, not merged

- [ ] Merge `origin/main` into `model-page` if it moved; push; `gh pr create --title "Add the model page" --body "…"` naming the spec; wait for CI green; **leave the PR open for review.** Report the PR URL.
