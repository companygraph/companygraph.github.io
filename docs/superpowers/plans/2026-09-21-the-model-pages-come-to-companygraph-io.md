# The model pages come to companygraph.io — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** companygraph.io carries Team, Principles and Surfaces, drawn from `company.json`, in the nav order blust.ch uses, and both sites' suites hold those pages to their data through checks this family keeps in one place.

**Architecture:** The renderers and the page fences already ship in `@robertblust/design` v0.68.0. What does not ship is the suite's half: blust.ch's `board` and `lineage` checks are local and hard-code its own model, and each says in its comment it stays local "until a second site has" one. So the checks move into design first, reading everything they expect from the artifact, then blust.ch takes them, then companygraph.io builds each page from its own `/privacy/` shell around the package's regions and fences, one page per pull request.

**Tech Stack:** Node 22, `@robertblust/design` (renderers, fences, page checks), Playwright for the suites, the translator and writer roles of `conventions/`.

**Spec:** [`robertblust/design` · `docs/superpowers/specs/2026-09-21-the-model-pages-are-shared-design.md`](https://github.com/robertblust/design/blob/main/docs/superpowers/specs/2026-09-21-the-model-pages-are-shared-design.md), §2 and §3: companygraph.io "does nothing until it chooses to carry the pages. Adopting them is its own plan, which needs this release and its own instance artifact first." Both now exist: the site is on v0.68.0 and builds `company.json`.

## What was measured before this plan, on 2026-09-21

- The three renderers run against `company.json` at `4406e7d` without an error, written into a scratch copy of blust.ch's three pages. Principles draws the vision "Written once, read by both" and the instance's values. Team draws one board per process, in the artifact's order — Contribution, Delivery, Feature request — with ids prefixed by the process's slug (`contribution-board`, `contribution-openall`, …). Surfaces draws `surfaces/companygraph-io-website` under its build.
- blust.ch's `verify/check.mjs` holds `board` and `lineage` as local checks. `board` asserts blust.ch's own facts: a single `#board`, eight rows, the phase headings `Shape Spec Plan Implement Integrate`, the Owner approving five gates, a Reviewer row, and a card link matching `../model/`. `lineage` reads its facts from the artifact already and names only single-page ids.
- companygraph.io's `/privacy/` carries the same fences as blust.ch's three pages (theme boot, design tokens, prose reset, header contract, title contract, prose footer, language, theme, nav fit) and a `.title` block, so it is the shell each new page starts from. blust.ch's shells cannot be copied: their head, header, footer, JSON-LD and `UI` strings are blust.ch's.
- Every page of companygraph.io with a nav: `index.html`, `model/`, `example/`, `talks/`, `billing/`, `privacy/`. The deck carries no nav.
- companygraph.io's `ci.yml` runs `npm run pages:check` before `npm ci`. Once `build/pages.mjs` imports `@robertblust/design/render/*`, that step fails with `ERR_MODULE_NOT_FOUND` on every push until it moves after `npm ci`, as design v0.68.0's release notes say.
- After #178, every page's footer ends with `company.json`, and `build/jsonld.mjs` writes the company's Dataset into every page listed in its `PAGES`; a test fails when a committed page with JSON-LD is missing from that list. A page built from `/privacy/`'s shell inherits the footer entry, and joins the list in its own task.
- On companygraph.io `/model/` draws the vocabulary; CompanyGraph's instance is drawn on the landing page. So a seat or a surface links to `../?stage=expanded#<id>`, and `STAGE_PAGE` is `"../"` on both pages.

## Global constraints

- Every hand-written English string on a new page is drafted by the writer role of `conventions/WRITER.md` from a brief, and **reviewed by the owner before it is committed**. German is made by the translator role of `conventions/TRANSLATOR.md` from the reviewed English only, and reviewed by its back-translation.
- blust.ch's own English is never copied onto companygraph.io: it describes a company of one, and this site describes CompanyGraph.
- **A number that still moves is not written down** — no seat, profile, phase or surface counts in page prose, `UI` descriptions or JSON-LD.
- A fence is never edited in a site; `npm run design` writes it. A generated region is never edited by hand; `npm run pages` writes it.
- `npm run sitemap` runs with every page edit; `npm run og` runs when `og:check` reports a card stale, and every re-render is committed with its `og.sha`.
- The nav order is `ORDER` in design's `navOrder`: Team, Principles, Surfaces, then Model, Example, Talks, Billing on this site.
- One branch per task, in a sibling worktree named `<repository>-<branch>`; tasks that depend on an unmerged one are stacked with `gh stack link` and merged with `gh stack merge --merge`.
- Commits and pull request bodies are in the git register, ending `Verified:` then the trailers. Merging and tagging are the owner's.
- A local server starts on a free port, and only its own PID is stopped.

---

### Task 1: The board and lineage checks are design's

**Repository:** `robertblust/design`

**Files:**

- Create: `verify/model-pages.mjs`
- Create: `test/model-pages.test.mjs`
- Modify: `package.json` (`exports`), `README.md` (the checks section)

**Interfaces:**

- Consumes: `processesOf`, `phasesOf`, `seatsOf`, `marksOf` from `lib/render/team.mjs`; `makersOf` from `lib/render/surfaces.mjs`
- Produces: `@robertblust/design/verify/model-pages`, exporting `MODEL_PAGE_CHECKS` (an object with `board` and `lineage`, each `async (page, spec) => string | null`, the shape `STAGE_CHECKS` has), and the pure helpers `boardsOf(data)` and `procSlug(name)`

The checks read what they expect from the artifact the page names, so neither carries a name from any model. The expectations are computed in Node from the renderer's own helpers, which is what keeps the check and the board from reading the model two ways; only reading the page happens in the browser.

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/robertblust/design && git fetch origin --quiet
git worktree add -b the-board-and-lineage-checks-are-shared \
  ~/git/robertblust/design-the-board-and-lineage-checks-are-shared origin/main
cd ~/git/robertblust/design-the-board-and-lineage-checks-are-shared && npm ci
```

- [ ] **Step 2: Export the slug the renderer uses**

In `lib/render/team.mjs`, `slug` is module-private. Export it under the name the check imports, without changing it:

```js
export const procSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const slug = procSlug;
```

- [ ] **Step 3: Write the failing test for `boardsOf`**

`test/model-pages.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { boardsOf } from "../verify/model-pages.mjs";

// Two processes, so the ids take the slug; the one profile is an agent holding no seat, so both
// seats are drawn as held by a person.
const role = (name) => ({ id: `roles/${name.toLowerCase()}`, type: "role", name, fields: {}, sections: [] });
const phase = (name, f) => ({ id: `phases/${name.toLowerCase()}`, type: "phase", name, fields: f, sections: [] });
const proc = (name, phases) => ({ id: `processes/${name.toLowerCase().replace(/ /g, "-")}`, type: "process", name,
  path: `model/processes/${name}.md`, fields: { owner: "Owner" },
  sections: [{ heading: "Phases", text: "", table: { rows: phases.map((p) => [p]) } }] });
const DATA = { entities: [
  role("Owner"), role("Requestor"),
  { id: "profiles/ai-agent", type: "profile", name: "AI agent", path: "model/profiles/ai-agent.md", fields: { nature: "agent", roles: [] }, sections: [] },
  phase("Raise", { owner: "Requestor" }),
  phase("Answer", { owner: "Owner", "gate-approvers": ["Owner"] }),
  proc("Feature request", ["Raise", "Answer"]),
  proc("Delivery", ["Answer"]),
] };

test("boardsOf reads each board's ids, headings, rows and gates from the data", () => {
  const boards = boardsOf(DATA);
  assert.deepEqual(boards.map((b) => b.prefix), ["feature-request-", "delivery-"]);
  const fr = boards[0];
  assert.deepEqual(fr.phases, ["Raise", "Answer"]);
  assert.deepEqual(fr.rows.map((r) => r.name).sort(), ["Owner", "Requestor"]);
  assert.equal(fr.rows.find((r) => r.name === "Owner").gates, 1);
  assert.equal(fr.rows.find((r) => r.name === "Requestor").gates, 0);
});

test("a single process draws unprefixed ids, as blust.ch's board has them", () => {
  const one = { entities: DATA.entities.filter((e) => e.name !== "Delivery") };
  assert.deepEqual(boardsOf(one).map((b) => b.prefix), [""]);
});
```

Read `phasesOf` in `lib/render/team.mjs` before running: the fixture's `Phases` section must be in the shape it reads (a table of names, one row per phase). If the shape above is not the one the parser writes, copy the shape from a real process in `company.json` rather than changing `phasesOf`.

- [ ] **Step 4: Run it and watch it fail**

Run: `node --test test/model-pages.test.mjs` Expected: FAIL with `Cannot find module '../verify/model-pages.mjs'`.

- [ ] **Step 5: Write `verify/model-pages.mjs`**

```js
// The checks that hold a page generated from a model to the model it was generated from: the
// team board and the surfaces lineage. They were a site's own until a second site drew them,
// and each hard-coded that site's model — its row count, its phase names, its gate count — so
// they read everything they expect from the artifact the page names instead, through the same
// helpers the renderers use. Only reading the page happens in the browser.
//
// Both also check where a card sends a reader: the page declares STAGE_PAGE, and the page it
// names must draw the same artifact, or a seat or a surface opens onto a stage that does not
// hold it. That is the gap a wrong STAGE_PAGE used to leave green.
import { processesOf, phasesOf, seatsOf, marksOf, procSlug } from "../lib/render/team.mjs";

// Each board the page must carry: its id prefix, its phase headings, and each row's name and
// gate count, in the order the renderer draws them.
export function boardsOf(data) {
  const procs = processesOf(data);
  return procs.map((proc) => {
    const marks = marksOf(data, proc);
    return {
      prefix: procs.length > 1 ? `${procSlug(proc.name)}-` : "",
      name: proc.name,
      phases: phasesOf(data, proc).map((p) => p.name),
      rows: seatsOf(data, proc).map(({ role }) => ({
        name: role.name,
        gates: marks[role.name].filter((m) => m.includes("ga")).length,
      })),
    };
  });
}

async function artifact(page) {
  return page.evaluate(async () => {
    const link = document.querySelector("link[data-stage]");
    if (!link) return null;
    return { href: link.href, data: await (await fetch(link.href)).json() };
  });
}

// STAGE_PAGE is a top-level `var` in the page's own script, so it is a property of window.
// The page it names is fetched and must name, by data-stage, the same file this page draws.
async function stageTarget(page) {
  return page.evaluate(async () => {
    if (typeof window.STAGE_PAGE !== "string") return { error: "the page declares no STAGE_PAGE" };
    const url = new URL(window.STAGE_PAGE, location.href);
    const res = await fetch(url);
    if (!res.ok) return { error: `STAGE_PAGE ${window.STAGE_PAGE} answers HTTP ${res.status}` };
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const link = doc.querySelector("link[data-stage]");
    const href = link && link.getAttribute("href");
    if (!href) return { error: `STAGE_PAGE ${window.STAGE_PAGE} draws no stage` };
    return { stage: window.STAGE_PAGE, draws: new URL(href, url).href };
  });
}

async function provenance(page, data) {
  const said = await page.evaluate(() => document.getElementById("srccommit").textContent.trim());
  const href = await page.evaluate(() => document.getElementById("srclink").href);
  const bad = [];
  if (said !== data.commit.slice(0, 7)) bad.push(`the provenance line reads @${said}, the artifact is at ${data.commit.slice(0, 7)}`);
  if (!href.includes("/tree/" + data.commit + "/")) bad.push("the provenance link is not pinned to the artifact's commit");
  return bad;
}

export const MODEL_PAGE_CHECKS = {
  async board(page, spec) {
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    const art = await artifact(page);
    if (!art) return "the page names no data";
    await page.waitForTimeout(300);
    const bad = await provenance(page, art.data);
    const target = await stageTarget(page);
    if (target.error) bad.push(target.error);
    else if (target.draws !== art.href) bad.push(`STAGE_PAGE ${target.stage} draws ${target.draws}, this page ${art.href}`);

    for (const want of boardsOf(art.data)) {
      const got = await page.evaluate((prefix) => {
        const grid = document.getElementById(prefix + "board");
        if (!grid) return null;
        const rows = [...grid.querySelectorAll("details")];
        return {
          heads: [...grid.querySelectorAll(".ghead .phname")].map((e) => e.textContent.trim()),
          rows: rows.map((d) => ({
            name: d.querySelector(".tw").textContent.trim(),
            gates: d.querySelectorAll("summary > span:not(.sname) .g.ga").length,
            label: d.querySelector("summary").getAttribute("aria-label") || "",
          })),
        };
      }, want.prefix);
      const where = want.prefix ? `${want.name}: ` : "";
      if (!got) { bad.push(`${where}there is no #${want.prefix}board`); continue; }
      if (got.heads.join("|") !== want.phases.join("|")) bad.push(`${where}the phase headings are ${got.heads.join(" · ")}, the model's ${want.phases.join(" · ")}`);
      if (got.rows.map((r) => r.name).join("|") !== want.rows.map((r) => r.name).join("|"))
        bad.push(`${where}the rows are ${got.rows.map((r) => r.name).join(", ")}, the model's ${want.rows.map((r) => r.name).join(", ")}`);
      for (const r of want.rows) {
        const g = got.rows.find((x) => x.name === r.name);
        if (!g) continue;
        if (g.gates !== r.gates) bad.push(`${where}${r.name} carries ${g.gates} gate marks, the model ${r.gates}`);
        if (!g.label.startsWith(r.name + ",")) bad.push(`${where}${r.name}'s summary has no aria-label naming it`);
        if (!/approves (the gate of|no gate)/.test(g.label)) bad.push(`${where}${r.name}'s aria-label says nothing about gates`);
      }
    }

    // A seat opens onto its card, rendered on demand and not before, and its references leave
    // for STAGE_PAGE. The first row of the first board is the one opened.
    const first = boardsOf(art.data)[0];
    const opened = await page.evaluate(async ({ prefix, name }) => {
      const d = [...document.getElementById(prefix + "board").querySelectorAll("details")]
        .find((x) => x.querySelector(".tw").textContent.trim() === name);
      if (!d) return { error: `there is no ${name} row` };
      if (d.querySelector(".cbody").textContent.trim()) return { error: "a card is rendered before its row was opened" };
      d.open = true;
      await new Promise((r) => setTimeout(r, 300));
      const h3 = d.querySelector(".cbody h3");
      const go = d.querySelector(".cbody a.go");
      return { h3: h3 && h3.textContent.trim(), go: go && go.getAttribute("href") };
    }, { prefix: first.prefix, name: first.rows[0].name });
    if (opened.error) bad.push(opened.error);
    else {
      if (opened.h3 !== first.rows[0].name) bad.push(`opening the ${first.rows[0].name} row did not render its card`);
      if (opened.go && !target.error && !opened.go.startsWith(target.stage + "?stage=expanded#"))
        bad.push(`a card link points at ${opened.go}, not at ${target.stage}`);
    }
    return bad.length ? bad.join("; ") : null;
  },

  async lineage(page, spec) {
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    const art = await artifact(page);
    if (!art) return "the page names no data";
    const bad = await provenance(page, art.data);
    const target = await stageTarget(page);
    if (target.error) bad.push(target.error);
    else if (target.draws !== art.href) bad.push(`STAGE_PAGE ${target.stage} draws ${target.draws}, this page ${art.href}`);
    const inPage = await page.evaluate(async (want) => {
      const bad = [];
      const btns = [...document.querySelectorAll("#lineage .ln-s")];
      if (btns.length !== want.length) bad.push(`the drawing has ${btns.length} surfaces, the model ${want.length}`);
      for (const s of want) {
        const b = btns.find((x) => x.getAttribute("data-id") === s.id);
        if (!b) { bad.push(`${s.name} is not drawn`); continue; }
        if (b.getAttribute("data-maker") !== s.maker) bad.push(`${s.name} sits under ${b.getAttribute("data-maker")}, not ${s.maker}`);
        const group = b.closest(".ln-group").querySelector(".ln-maker").getAttribute("data-maker");
        if (group !== s.maker) bad.push(`${s.name} is nested under ${group}, not ${s.maker}`);
        if (b.querySelector(".nm").textContent.trim() !== s.name) bad.push(`${s.id} is labeled ${b.querySelector(".nm").textContent}`);
      }
      const panel = document.getElementById("lnpanel");
      if (!panel.hidden || panel.querySelector(".cbody").textContent.trim()) bad.push("a card is shown before a surface was chosen");
      const wires = document.querySelectorAll("#wires path").length;
      const makers = document.querySelectorAll(".ln-maker").length;
      if (wires !== makers + btns.length) bad.push(`${wires} wires for ${makers} makers and ${btns.length} surfaces`);
      const pick = btns.find((b) => b.getAttribute("data-maker") === "hand") || btns[0];
      pick.click();
      await new Promise((r) => setTimeout(r, 300));
      const h3 = panel.querySelector(".cbody h3");
      const name = pick.querySelector(".nm").textContent.trim();
      if (panel.hidden || !h3 || h3.textContent.trim() !== name) bad.push(`choosing ${name} did not draw its card`);
      if (/\*\*/.test(panel.querySelector(".cbody").textContent)) bad.push(`${name}'s card prints markdown asterisks`);
      if (pick.getAttribute("aria-pressed") !== "true") bad.push(`${name} is not pressed once chosen`);
      if (location.hash !== "#" + pick.id) bad.push(`choosing ${name} left the address at ${location.hash || "no hash"}`);
      const lit = document.querySelectorAll("#wires path.on").length;
      if (lit !== 2) bad.push(`choosing ${name} lit ${lit} wires, not 2`);
      return { bad, id: pick.id };
    }, art.data.entities.filter((e) => e.type === "surface").map((s) => ({
      id: s.id, name: s.name, maker: s.fields.production === "written" ? "hand" : s.fields["built-by"] })));
    bad.push(...inPage.bad);
    // A link must land: arriving with a hash chooses that surface.
    await page.goto(spec.absolute + "#" + inPage.id, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const landed = await page.evaluate((id) => document.getElementById(id).getAttribute("aria-pressed") === "true"
      && !!document.querySelector("#lnpanel .cbody h3"), inPage.id);
    if (!landed) bad.push(`arriving on #${inPage.id} did not choose it`);
    return bad.length ? bad.join("; ") : null;
  },
};
```

`lineage` is blust.ch's check with its facts passed in from Node rather than re-read in the page, plus the `STAGE_PAGE` check. `board` keeps every assertion blust.ch's makes, with each literal replaced by what `boardsOf` reads. The one blust.ch assertion with no general form, "the Owner approves five gates and no other row carries one", is the per-row gate comparison: a row carrying a gate the model does not give it fails either way.

- [ ] **Step 6: Export it**

In `package.json`'s `exports`, beside `"./verify/stage"`:

```json
"./verify/model-pages": "./verify/model-pages.mjs",
```

- [ ] **Step 7: Run the tests**

Run: `npm test` Expected: PASS, the new file included. `test/spelling.test.mjs` reads the new module too; fix any British spelling it reports.

- [ ] **Step 8: Document it**

In `README.md`, where `verify/stage` is described, add one paragraph: what `MODEL_PAGE_CHECKS` holds, that a site spreads it into its `CHECKS` beside `STAGE_CHECKS`, and that a page opts in with `board: true` or `lineage: true` like any other check.

- [ ] **Step 9: Verify against the real page before committing**

The browser half has no test in this package, which has no browser. Prove it on blust.ch without committing there: point a blust.ch worktree's `node_modules/@robertblust/design` at this worktree (`npm install --no-save ../design-the-board-and-lineage-checks-are-shared`), change its `verify/check.mjs` as Task 2 Step 3 says, and run its suite. Then set `STAGE_PAGE` on its `surfaces/index.html` to `"../privacy/"` and run it again.

Expected: `verify` exits `0`, then `1` with `lineage: STAGE_PAGE ../privacy/ draws no stage`. Restore the page, and discard the blust.ch worktree's changes; Task 2 makes them for real.

- [ ] **Step 10: Commit, push, open the pull request, report and stop**

The release that carries this is a minor: a site that takes it changes nothing until it spreads `MODEL_PAGE_CHECKS` into its checks. The release notes say so, and that blust.ch should drop its local `board` and `lineage` when it does. Another session is building a link checker in this repository; if its release lands first, this one takes the next minor after it.

---

### Task 2: blust.ch takes the shared checks

**Repository:** `robertblust/robertblust.github.io`

**Files:**

- Modify: `package.json`, `package-lock.json`, `verify/check.mjs`

**Interfaces:**

- Consumes: the release carrying `@robertblust/design/verify/model-pages`
- Produces: nothing a later task reads; blust.ch's suite holds its pages through the shared checks

- [ ] **Step 1: Branch, in a sibling worktree, after the release is tagged**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/robertblust/robertblust.github.io && git fetch origin --quiet
git worktree add -b the-site-takes-the-shared-model-page-checks \
  ~/git/robertblust/robertblust.github.io-the-site-takes-the-shared-model-page-checks origin/main
cd ~/git/robertblust/robertblust.github.io-the-site-takes-the-shared-model-page-checks
```

- [ ] **Step 2: Re-pin, and prove the lockfile followed**

Set the design pin in `package.json` to the new tag, then `rm -rf node_modules package-lock.json && npm install`. Compare `packages["node_modules/@robertblust/design"].resolved` in `package-lock.json` with `gh api repos/robertblust/design/git/refs/tags/<tag> --jq .object.sha`; they must name the same commit. Run `npm run design` and read what it writes.

- [ ] **Step 3: Use the shared checks, delete the local ones**

```js
import { MODEL_PAGE_CHECKS } from "@robertblust/design/verify/model-pages";
```

Spread `...MODEL_PAGE_CHECKS` into `CHECKS` beside `...STAGE_CHECKS`, and delete the local `board` and `lineage` methods with their comments. The `/team/` and `/surfaces/` entries keep `board: true` and `lineage: true`; nothing else in them changes. `ledger` stays local: no second site has a ledger.

- [ ] **Step 4: Verify, with a positive control**

```bash
P=8741; python3 -m http.server $P >/dev/null 2>&1 & SP=$!; sleep 1
BASE=http://localhost:$P npm run verify; echo "verify: $?"
sed -i '' 's|var STAGE_PAGE = "../model/";   // the page that draws this model on the stage|var STAGE_PAGE = "../privacy/";   // the page that draws this model on the stage|' team/index.html
BASE=http://localhost:$P npm run verify; echo "verify with a wrong STAGE_PAGE: $?"
git checkout team/index.html; kill $SP
```

Expected: `0`, then `1` with `board: STAGE_PAGE ../privacy/ draws no stage`. Then run `design:check`, `pages:check`, `og:check`, `sitemap:check`, and the conventions checks; each exits `0`.

- [ ] **Step 5: Commit, push, open the pull request, report and stop**

---

### Task 3: companygraph.io carries Principles

**Repository:** `companygraph/companygraph.github.io`

**Files:**

- Create: `principles/index.html`, `principles/og.png`, `principles/og.sha`
- Modify: `build/pages.mjs`, `.github/workflows/ci.yml`, `verify/check.mjs`, `og-recipe.mjs`, `sitemap.xml`, the nav of `index.html`, `model/index.html`, `example/index.html`, `talks/index.html`, `billing/index.html`, `privacy/index.html`, `README.md`

**Interfaces:**

- Consumes: `writePrinciples` from `@robertblust/design/render/principles`; `company.json`
- Produces: `/principles/`; `build/pages.mjs` running the model-page renderers on `data.company`, which Tasks 4 and 5 extend

Principles first, because its region carries its own title and all its words: the page needs no English beyond its head, and it proves the renderer wiring before a page with cards does.

- [ ] **Step 1: Branch, in a sibling worktree**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/companygraph/companygraph.github.io && git fetch origin --quiet
git worktree add -b principles-come-to-companygraph-io \
  ~/git/companygraph/companygraph.github.io-principles-come-to-companygraph-io origin/main
cd ~/git/companygraph/companygraph.github.io-principles-come-to-companygraph-io && npm ci
```

- [ ] **Step 2: Brief the writer, present the English, and stop for review**

The page's own English is its head: the `<title>`, the meta description, the `UI` object's `en` strings, and the JSON-LD `WebPage` name and description. Brief the writer role with: the audience (a visitor who found companygraph.io and wants to know what the company behind it holds itself to); the one point (the vision and values on this page are CompanyGraph's own, read from its model, not written for the page); the facts it may claim (the page is generated from `companygraph/mental-model`; the vision is "Written once, read by both"; the values are named in `company.json`), and no count. The `<title>` follows the site's form, `Principles — CompanyGraph`. Present the drafted strings to the owner and stop until they are approved.

- [ ] **Step 3: Build the page from `/privacy/`'s shell**

Copy `privacy/index.html` to `principles/index.html`, then:

- set the `<title>`, `#metadesc`, `og:*` and `twitter:*` tags, the canonical link and the JSON-LD `WebPage` and `BreadcrumbList` to `/principles/` and the approved strings;
- replace everything inside `<main><div class="shell">…</div></main>` with the region markers alone, as blust.ch's page has them:

```html
    <!-- principles:start -->
    <!-- principles:end -->
```

- add the `principles` fence's markers inside `<style>`, after the `prose footer` fence:

```css
  /* ─── principles · v1 · shared ───────────────────────────────────────
  /* ─── end principles ─────────────────────────────────────────────────── */
```

Read the exact end-marker text from blust.ch's `principles/index.html` rather than trusting the line above; `design:check` compares both markers byte for byte.

- remove whatever CSS in the copied `<style>` only `/privacy/`'s own content used, and set the `UI` object to the approved strings.

- [ ] **Step 4: Render the region from the instance**

In `build/pages.mjs`:

```js
import { writePrinciples } from "@robertblust/design/render/principles";
```

and add to `RENDERERS`, beside the JSON-LD writer:

```js
(d, o) => writePrinciples(d.company, { ...o, root: ROOT }),
```

In `build/jsonld.mjs`, add `{ file: "principles/index.html", head: PAGE_HEAD }` to `PAGES`, after `privacy/index.html`'s entry; `npm run pages` then writes the company's Dataset into the page's graph, after the `WebPage` and `BreadcrumbList` it carries from `/privacy/`'s shell.

Update the file's header, which says it uses Node built-ins only and runs before `npm ci`: it now imports the design package, so it runs after it.

In `.github/workflows/ci.yml`, move the step named `The derived regions still match the artifacts` (`npm run pages:check`) from before `npm ci` to after it, and rewrite the comment above it, which says the check is the cheapest in the job because it needs nothing installed.

Then:

```bash
npm run design; npm run pages; git status --short
```

Expected: `design` writes the `principles` fence and `pages` writes `principles/index.html`'s region; open the page and read it.

- [ ] **Step 5: Put Principles in the nav of every page**

In each page with a nav — `index.html`, `model/`, `example/`, `talks/`, `billing/`, `privacy/`, and `principles/` itself — add the link before Model, with the relative path each page uses for the others (`principles/` from the root, `../principles/` elsewhere) and `data-de="Prinzipien"`. On `principles/index.html` it is `href="./" aria-current="page"`, the way `model/index.html` marks its own link.

- [ ] **Step 6: Hold the page in the suite**

In `verify/check.mjs`, add an entry after `/privacy/`'s, built from `/privacy/`'s keys, with `path: "/principles/"`, `title: /Principles/`, `fences` adding `"principles"`, `internalLinks: true`, `contains` holding the vision's name ("Written once") and "Generated from", and a `translates` block whose `title` and `desc` are the approved German head, `shows: ["Werte"]` and `hides: ["Values"]` — the one heading the region translates.

- [ ] **Step 7: Give it a share card**

In `og-recipe.mjs`, add `{ dir: "principles", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" }` after `billing`'s entry; then `npm run og` and commit `principles/og.png` with its `og.sha`. In `README.md`, add `principles/og.png` to the list of share cards, and remove the count in "renders all seven": the number moves with every page.

- [ ] **Step 8: The German, then the sitemap**

Invoke the translator role on the approved English head only; the region's German is the package's. Put the German into the `UI` object's `de` strings and the suite's `translates` block. Then `npm run sitemap`, which adds `/principles/`.

- [ ] **Step 9: Verify, each exit code on its own**

```bash
npm run design:check;  echo "design:check: $?"
npm run pages:check;   echo "pages:check: $?"
npm run build:check;   echo "build:check: $?"
npm run test:build;    echo "test:build: $?"
npm run og:check;      echo "og:check: $?"
npm run test:og;       echo "test:og: $?"
npm run sitemap:check; echo "sitemap:check: $?"
P=8742; python3 -m http.server $P >/dev/null 2>&1 & SP=$!; sleep 1
BASE=http://localhost:$P npm run verify; echo "verify: $?"; kill $SP
sh conventions/conventions-format; echo "format: $?"
sh conventions/conventions-check;  echo "check: $?"
```

Expected: `0` from every one; `navOrder` passes on every page with Principles in its place.

- [ ] **Step 10: Commit, push, open the pull request, report and stop**

---

### Task 4: companygraph.io carries Team

**Repository:** `companygraph/companygraph.github.io`, stacked on Task 3

**Files:**

- Create: `team/index.html`, `team/og.png`, `team/og.sha`
- Modify: `package.json`, `package-lock.json` (the release from Task 1), `build/pages.mjs`, `verify/check.mjs`, `og-recipe.mjs`, `sitemap.xml`, the nav of every page, `README.md`

**Interfaces:**

- Consumes: `writeTeam`; `MODEL_PAGE_CHECKS` from Task 1's release; `build/pages.mjs` from Task 3
- Produces: `/team/`

- [ ] **Step 1: Branch on Task 3, re-pin to Task 1's release**

```bash
cd ~/git/companygraph/companygraph.github.io
git worktree add -b team-comes-to-companygraph-io \
  ~/git/companygraph/companygraph.github.io-team-comes-to-companygraph-io principles-come-to-companygraph-io
```

Re-pin `@robertblust/design` to the release that carries `verify/model-pages` and prove the lockfile, as Task 2 Step 2 does.

- [ ] **Step 2: Brief the writer, present the English, and stop for review**

The strings: the `<h1>` in the title block (the family's two-part headline, `r70` then `rcl` with one `<em>`), the tagline, the section label over the boards, the caption under them, the "How to read it" rules, and the head (`<title>` `Team — CompanyGraph`, description, `UI`, JSON-LD). The audience is a visitor asking who does the work at CompanyGraph. The facts it may claim, each read from `company.json`: the seats are roles, and a profile holds some of them; the one profile is an AI agent; a seat no profile holds is held by a person, which is why its row has no name beside it; each process — delivery, feature requests on GitHub issues, contributions as pull requests — draws its own board; every gate is approved by a seat a person holds. No count of seats, profiles, processes or phases. blust.ch's Team page is the pattern for which elements exist and never for their words.

Put one question to the owner with the draft: seats no profile holds are drawn in the order the model lists roles, so the Contribution board opens on Contributor rather than Owner. Leave it, or change the order in the model?

- [ ] **Step 3: Build the page from `/privacy/`'s shell**

As Task 3 Step 3, with `/team/`, and inside `<main><div class="shell">` the structure of blust.ch's `team/index.html`, with the approved English: the `.title` block carrying the `<!-- team-note:start -->`/`<!-- team-note:end -->` markers under the tagline; a `<section class="figure-section">` with the `.lbl` label, the `<!-- team:start -->`/`<!-- team:end -->` markers and the `.figcap`; the "How to read it" section; and the provenance line, pointing at the instance:

```html
    <p class="derived"><span data-de="Erzeugt aus">Generated from</span> <a id="srclink" data-src="model" href="https://github.com/companygraph/mental-model/tree/HEAD/model">companygraph/mental-model</a>@<span id="srccommit">HEAD</span></p>
```

In `<style>`, the markers of `stage contract` and `team`. In `<head>`, after `</style>`:

```html
<link rel="stylesheet" href="../stage.css">
<link rel="preload" as="fetch" href="../company.json" data-stage crossorigin>
```

At the foot, after the init script, as blust.ch's page has it:

```html
<script src="../card.js"></script>
<script>
  var STAGE_PAGE = "../";          // the page that draws this model on the stage
  var MODEL_CARD = "team";        // the name card.js reports a failed read under
  /* ─── model card · v1 · shared ─────────────────────────────────────
  /* ─── end model card ─────────────────────────────────────────────── */
</script>
```

Copy the `model card` markers byte for byte from blust.ch's `team/index.html`; `npm run design` fills them. `STAGE_PAGE` is `"../"` because the landing page draws the instance here.

- [ ] **Step 4: Render and wire**

Add `import { writeTeam } from "@robertblust/design/render/team";` and `(d, o) => writeTeam(d.company, { ...o, root: ROOT })` to `RENDERERS`, and `{ file: "team/index.html", head: PAGE_HEAD }` to `PAGES` in `build/jsonld.mjs`. Run `npm run design` and `npm run pages`, then open `/team/` at 1280px and 390px: three boards, each under its process's name, a row opening its card, a reference in the card leaving for `../?stage=expanded#…` and landing on the landing page's stage with that node focused.

- [ ] **Step 5: Nav, suite, card, German, sitemap**

- Nav: add `Team` before Principles on every page, `data-de` omitted as blust.ch omits it (the word is the same).
- Suite: import `MODEL_PAGE_CHECKS` and spread it into `CHECKS`; add a `/team/` entry built from `/principles/`'s, with `fences` adding `"stage contract"` and `"team"`, `card: true`, `internalLinks: true`, `board: true`, `contains` holding words of the approved headline and "How to read it", and `translates` holding the approved German head and one approved rule's opening in `shows`/`hides`.
- Share card: `{ dir: "team", …, hide: HOME_HIDE, … }` in `og-recipe.mjs`, `npm run og`, the README list.
- German: the translator role over every approved English string on the page.
- `npm run sitemap`.

- [ ] **Step 6: Verify as Task 3 Step 9, plus a positive control**

Set `STAGE_PAGE` to `"../privacy/"`, run `verify`, and read `board: STAGE_PAGE ../privacy/ draws no stage`; restore it and run again. Expected: `1`, then `0`.

- [ ] **Step 7: Commit, push, open the pull request stacked on Task 3's, report and stop**

---

### Task 5: companygraph.io carries Surfaces

**Repository:** `companygraph/companygraph.github.io`, stacked on Task 4

**Files:**

- Create: `surfaces/index.html`, `surfaces/og.png`, `surfaces/og.sha`
- Modify: `build/pages.mjs`, `verify/check.mjs`, `og-recipe.mjs`, `sitemap.xml`, the nav of every page, `README.md`, `AGENTS.md`

**Interfaces:**

- Consumes: `writeSurfaces`; `MODEL_PAGE_CHECKS`
- Produces: `/surfaces/`; the nav complete in blust.ch's order

- [ ] **Step 1: Branch on Task 4**

```bash
cd ~/git/companygraph/companygraph.github.io
git worktree add -b surfaces-come-to-companygraph-io \
  ~/git/companygraph/companygraph.github.io-surfaces-come-to-companygraph-io team-comes-to-companygraph-io
cd ~/git/companygraph/companygraph.github.io-surfaces-come-to-companygraph-io && npm ci
```

- [ ] **Step 2: Brief the writer, present the English, and stop for review**

The strings: the headline, the tagline, the section label, the legend's two entries, the hint, the caption, the "How to read it" rules, and the head (`Surfaces — CompanyGraph`). The facts it may claim, from `company.json`: a surface is a page where the model is published; each is written by a person or built by a repository from a pinned commit; this site is one of them and is built. blust.ch's example of a LinkedIn profile is blust.ch's and does not transfer; the rule it illustrates — a surface is a page, not a place — may be said in CompanyGraph's own terms. The legend and hint describe controls, and may keep blust.ch's wording where it names no fact about blust.ch.

- [ ] **Step 3: Build the page from `/privacy/`'s shell**

As Task 4 Step 3, with blust.ch's `surfaces/index.html` as the structural pattern: the `surfaces-note` markers in the title block; in the figure section the `surfaces` markers, the `.legend`, the `#lnpanel` panel markup and the `#lnhint` line exactly as blust.ch has them, then the caption; the rules; the provenance line pointing at `companygraph/mental-model`. In `<style>`, the `stage contract` and `surfaces` markers. In `<head>`, `stage.css` and the `../company.json` preload. At the foot:

```html
<script src="../card.js"></script>
<script>
  var STAGE_PAGE = "../";          // the page that draws this model on the stage
  /* ─── surfaces lineage · v1 · shared ───────────────────────────────
  /* ─── end surfaces lineage ─────────────────────────────────────── */
</script>
```

Copy both markers byte for byte from blust.ch's page.

- [ ] **Step 4: Render and wire, nav, suite, card, German, sitemap**

As Task 4 Steps 4 and 5, with `writeSurfaces`, `{ file: "surfaces/index.html", head: PAGE_HEAD }` in `PAGES`, `lineage: true`, `fences` adding `"stage contract"` and `"surfaces"`, `Surfaces` in the nav after Principles with no `data-de` (the family keeps the word in German), and a share card. The nav now reads Team, Principles, Surfaces, Model, Example, Talks, Billing on every page.

- [ ] **Step 5: The documents**

`README.md`: add the three pages to the table of paths and to Contents, beside the stage pages, and say which renderer and which fences each takes from the design package. `AGENTS.md`: the paragraph on the stage pages as the one mechanical exception gains the three pages as generated regions, and says their words come from `company.json` and are not translated, as the page's own note says.

- [ ] **Step 6: Verify as Task 3 Step 9, plus the positive control on `STAGE_PAGE`**

- [ ] **Step 7: Commit, push, open the pull request stacked on Task 4's, report and stop**

---

## After this plan

`conventions/REPOSITORIES.md` describes companygraph.io as "the landing page, the model and example pages, the intro talk", and blust.ch's own purpose line stays as it is. The row gains the three pages in the next conventions release, with the edge the site's second pin added.

The link checker, planned in `robertblust/design` separately, will resolve every card link on these pages as well; the `STAGE_PAGE` check here holds the one link a card writes that no other check could see today.
