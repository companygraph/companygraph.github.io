# Example Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `companygraph.io/example/` — the fictional company from `meta-model/example`, generated into the page at a pinned commit and drawn as a clickable tree with a detail panel — plus the nav item, share card, sitemap entry and checks that go with a new page.

**Architecture:** A pure parser (`example/instance.mjs`) turns a map of file paths → Markdown into a graph JSON by the fixed shape alone. A small CLI (`example/build.mjs`) feeds it the example at the commit in `example/source.json` (local checkout or GitHub) and writes the JSON into `example/index.html` between markers, or checks that what is there still matches. The page is the billing skeleton with one interactive SVG figure and a panel, all inline, no library. `verify/check.mjs` gets a spec for the page including a scripted click-through; `og-recipe.mjs` gets the fourth card.

**Tech Stack:** HTML/CSS/JS by hand, Node 22 (`fetch`, `node --test`, no dependencies) for the generator and its tests, Playwright for `verify` and `og` as on every other page.

**Spec:** [`docs/superpowers/specs/2026-08-25-example-page-design.md`](../specs/2026-08-25-example-page-design.md) — read §2 (generator and pin), §4 (figure) and §5 (verification) before starting. Where plan and spec disagree, the spec wins.

## Global Constraints

Copied from the spec and from `CLAUDE.md`. Every task's requirements implicitly include this section.

- **Nothing about the example is written by hand.** Names, counts, fields, edges come from the data block. The only invented string is the root label `Fictional Company`, in `instance.mjs`, named as such.
- **The data block** sits in `example/index.html` as `<!-- example data · <commit> -->\n<script type="application/json" id="example-data">…</script>\n<!-- /example data -->`. `npm run example` writes it; `npm run example:check` fails if it differs from a fresh derivation at the pinned commit.
- **Parsing is by the fixed shape only** — frontmatter, H1, `>` tagline, `##` sections, tables by header row. No schema is read. A reference that resolves to nothing throws citing R4; a root folder that is not a plural throws citing R7.
- **Self-contained.** No external asset, no request beyond the page's own files; fonts referenced relatively (`../fonts/…`). Outbound links carry `target="_blank" rel="noopener"`.
- **English markup, German in `data-de`**; the `cg-lang` toggle mechanism copied from billing. Entity content is English data, never translated.
- **Mono means data:** folder names, field keys, the commit, the `.unit` line. Never prose.
- **Tokens:** folder boxes `--c-weak` outline; entity squares `--c-firm`; hover/focus/selected `--c-mid`; owns-lines solid; reference lines dashed `--c-weak`, selected entity's `--c-mid`; no `--c-flag` in the figure.
- **Motion is additive:** no rule outside `@keyframes` sets opacity/transform/dash on the figure; `prefers-reduced-motion` shows the settled state, which the card renders (root + folders, nothing selected).
- **The design token block is a copy** fenced by `design tokens · v1`; `verify/design.mjs` is never edited.
- **Never print an environment variable's value.** Probe with `${VAR:+SET}`.
- **`npm run og` never runs in CI**; `og.png` and `og.sha` are committed together with the page that moved.
- **Commits happen on branch `example-page`**, one per task, messages in the repo's sentence style, ending with a blank line and `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility |
|---|---|
| `example/instance.mjs` | pure: `parseInstance(files) → data`; the R4/R7 errors; the root label constant |
| `example/build.mjs` | CLI: read `source.json`, get files (local or GitHub), write or check the block |
| `example/source.json` | the pin: `{ repo, commit }` |
| `example/index.html` | the page: prose, figure, panel, data block, language toggle |
| `verify/instance.test.mjs` | `node --test` for the parser against inline fixture maps |
| `verify/check.mjs` | `/example/` page spec incl. the `graph` click-through; nav strings on the other pages |
| `og-recipe.mjs` | fourth card |
| `index.html`, `privacy/index.html`, `billing/index.html`, `talks/index.html` | nav item |
| `sitemap.xml`, `package.json`, `.github/workflows/ci.yml`, `CLAUDE.md`, `README.md` | the usual per-page debts |

All commands run from `~/git/companygraph/companygraph.github.io`. `npm run serve` runs in another terminal for `verify`. A local meta-model checkout is at `~/git/companygraph/meta-model`; `META_MODEL=$HOME/git/companygraph/meta-model` makes the generator read it instead of GitHub.

---

### Task 1: The parser, test-first

**Files:**
- Create: `example/instance.mjs`
- Create: `verify/instance.test.mjs`
- Modify: `package.json` — script `"test:example": "node --test verify/instance.test.mjs"`

**Interfaces:**
- Produces: `parseInstance(files: Map<string,string>) → { commit: null, root, types, entities, edges }` where keys of `files` are paths relative to the instance root (`values/craftsmanship.md`, no leading `example/`). `ROOT_LABEL = "Fictional Company"`. Errors are `Error` with messages beginning `R4:` or `R7:`.
- Produces: entity ids are the path without `.md`, and for the folder form the folder (`profiles/mira-halvorsen`). Folder-node ids used later by the page are `<owner id>/<folder>` for owned folders and just `<folder>` at the root.

- [ ] **Step 1: Write the failing tests**

`verify/instance.test.mjs`:

```js
// The parser reads an instance by the fixed shape alone — no schema — so these fixtures are
// small maps of path → Markdown, and every rule the spec names has a fixture that breaks it.
import test from "node:test";
import assert from "node:assert/strict";
import { parseInstance, ROOT_LABEL } from "../example/instance.mjs";

const valid = new Map([
  ["README.md", "# Example instance\n\nIgnored: a README is never an entity.\n"],
  ["values/craftsmanship.md", "# Craftsmanship\n\n> We ship one thing.\n\n## In practice\n\nRefusing a deadline.\n"],
  ["skills/java-programming.md", "---\ngroup: Programming Languages\n---\n\n# Java Programming\n\n> JVM services.\n\n## In practice\n\nReading the stack trace.\n"],
  ["proficiency-levels/proficient.md", "---\nrank: 30\n---\n\n# Proficient\n\n> Exercises judgment.\n\n## What it means\n\nMakes calls.\n"],
  ["profiles/mira-halvorsen/mira-halvorsen.md",
   "---\nemail: mira@example.invalid\nlocation: Bergen\n---\n\n# Mira Halvorsen\n\n> Backend engineer.\n\n## Skills\n\n| Skill | Level | Evidence |\n| --- | --- | --- |\n| Java Programming | Proficient | Owned the JVM services. |\n\n## Summary\n\nEight years.\n"],
  ["profiles/mira-halvorsen/experiences/2022-beacon-systems.md",
   "---\nstart: 2022-02\norganisation: Beacon Systems\nskills: [Java Programming]\n---\n\n# Splitting the billing domain\n\n> Ongoing.\n\n## Achievements\n\n- Split one service.\n"],
]);

test("the root label is the one invented string", () => {
  assert.equal(parseInstance(valid).root, ROOT_LABEL);
  assert.equal(ROOT_LABEL, "Fictional Company");
});

test("types come from folders, singular by R7, with their owner", () => {
  const { types } = parseInstance(valid);
  assert.deepEqual(types, [
    { type: "experience", folder: "experiences", owner: "profile" },
    { type: "proficiency-level", folder: "proficiency-levels", owner: null },
    { type: "profile", folder: "profiles", owner: null },
    { type: "skill", folder: "skills", owner: null },
    { type: "value", folder: "values", owner: null },
  ]);
});

test("an entity is its H1, tagline, fields, sections and path; a README is not one", () => {
  const { entities } = parseInstance(valid);
  assert.equal(entities.length, 5);
  const java = entities.find(e => e.id === "skills/java-programming");
  assert.deepEqual(java, {
    id: "skills/java-programming", type: "skill", name: "Java Programming",
    tagline: "JVM services.", fields: { group: "Programming Languages" },
    sections: [{ heading: "In practice", text: "Reading the stack trace." }],
    owner: null, path: "example/skills/java-programming.md",
  });
});

test("the folder form names the entity by its folder and owns what nests inside it", () => {
  const { entities } = parseInstance(valid);
  const mira = entities.find(e => e.name === "Mira Halvorsen");
  assert.equal(mira.id, "profiles/mira-halvorsen");
  assert.equal(mira.path, "example/profiles/mira-halvorsen/mira-halvorsen.md");
  const exp = entities.find(e => e.type === "experience");
  assert.equal(exp.owner, "profiles/mira-halvorsen");
  assert.equal(exp.id, "profiles/mira-halvorsen/experiences/2022-beacon-systems");
});

test("a table section is kept as rows, and its body text is empty", () => {
  const mira = parseInstance(valid).entities.find(e => e.name === "Mira Halvorsen");
  const skills = mira.sections.find(s => s.heading === "Skills");
  assert.deepEqual(skills.table, {
    columns: ["Skill", "Level", "Evidence"],
    rows: [["Java Programming", "Proficient", "Owned the JVM services."]],
  });
  assert.equal(skills.text, "");
});

test("a frontmatter list that names entities becomes edges", () => {
  const { edges } = parseInstance(valid);
  const e = edges.find(x => x.via === "skills");
  assert.deepEqual(e, {
    from: "profiles/mira-halvorsen/experiences/2022-beacon-systems",
    to: "skills/java-programming", via: "skills", attrs: {},
  });
});

test("a table row's first resolving cell is the edge; other cells are attrs, resolved where they can be", () => {
  const { edges } = parseInstance(valid);
  const e = edges.find(x => x.via === "Skills.Skill");
  assert.deepEqual(e, {
    from: "profiles/mira-halvorsen", to: "skills/java-programming", via: "Skills.Skill",
    attrs: { Level: "proficiency-levels/proficient", Evidence: "Owned the JVM services." },
  });
});

test("a name that resolves to nothing is an R4 error", () => {
  const broken = new Map(valid);
  broken.set("profiles/mira-halvorsen/experiences/2022-beacon-systems.md",
    "---\nstart: 2022-02\nskills: [Kotlin]\n---\n\n# Splitting\n\n> x\n");
  assert.throws(() => parseInstance(broken), /^Error: R4: .*Kotlin/);
});

test("a root folder that is not a plural is an R7 error", () => {
  const broken = new Map(valid);
  broken.set("value/humility.md", "# Humility\n\n> x\n");
  assert.throws(() => parseInstance(broken), /^Error: R7: .*value/);
});

test("output is deterministic regardless of map order", () => {
  const shuffled = new Map([...valid.entries()].reverse());
  assert.deepEqual(parseInstance(shuffled), parseInstance(valid));
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npm run test:example` (after adding the script)
Expected: every test fails with `Cannot find module '../example/instance.mjs'`.

- [ ] **Step 3: Write `example/instance.mjs`**

```js
// Turns one instance — a map of path → Markdown — into the graph the example page draws.
//
// It reads the fixed shape and nothing else: YAML frontmatter as key/scalar or key/list, the
// H1 as the canonical name, the `>` tagline, `##` sections as heading plus text, a table by its
// header row. No schema is consulted. Types are folder names singularised by R7, ownership is
// nesting on disk (R5, R6), and every edge is a name in a file that resolves to another file's
// H1 — a name that resolves to nothing is an R4 error here, so the page can never draw a line
// to nowhere. CONVENTIONS.md in companygraph/meta-model is the source of the rule numbers.
//
// Pure: no filesystem, no network, so verify/instance.test.mjs can feed it fixture maps.

// The one string that is not in the instance. The example's own README calls itself "a
// fictional company", which is why this is the word.
export const ROOT_LABEL = "Fictional Company";

const singular = (folder) => {
  if (folder.endsWith("ies")) return folder.slice(0, -3) + "y";
  if (folder.endsWith("s")) return folder.slice(0, -1);
  return null;
};

function parseFrontmatter(lines) {
  if (lines[0] !== "---") return [{}, lines];
  const end = lines.indexOf("---", 1);
  const fields = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    fields[key] = raw.startsWith("[")
      ? raw.slice(1, raw.lastIndexOf("]")).split(",").map(s => s.trim()).filter(Boolean)
      : raw.trim();
  }
  return [fields, lines.slice(end + 1)];
}

function parseTable(lines) {
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const columns = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  return { columns, rows };
}

function parseBody(lines) {
  let name = "", tagline = "";
  const sections = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    const tableLines = cur.lines.filter(l => l.trim().startsWith("|"));
    const textLines = cur.lines.filter(l => !l.trim().startsWith("|"));
    const section = { heading: cur.heading, text: textLines.join("\n").trim() };
    if (tableLines.length) section.table = parseTable(tableLines);
    sections.push(section);
  };
  for (const line of lines) {
    if (line.startsWith("# ") && !name) name = line.slice(2).trim();
    else if (line.startsWith("> ") && !tagline && !cur) tagline = line.slice(2).trim();
    else if (line.startsWith("## ")) { flush(); cur = { heading: line.slice(3).trim(), lines: [] }; }
    else if (cur) cur.lines.push(line);
  }
  flush();
  return { name, tagline, sections };
}

// A path is read pairwise: a folder, then the thing in it. `x.md` in a folder is an entity
// file; a directory `x` is an entity in folder form (its own file is `x/x.md`) and whatever
// follows it is a folder it owns.
function locate(path) {
  const parts = path.split("/");
  const chain = [];              // [{ folder, name, ownerId }]
  let ownerId = null;
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const folder = parts[i], item = parts[i + 1];
    const isFile = item.endsWith(".md");
    const name = isFile ? item.slice(0, -3) : item;
    const id = (ownerId ? ownerId + "/" : "") + folder + "/" + name;
    chain.push({ folder, name, ownerId, id, isFile });
    if (isFile) return { chain, self: chain[chain.length - 1], own: false };
    if (i + 2 === parts.length - 1 && parts[i + 2] === name + ".md") {
      return { chain, self: chain[chain.length - 1], own: true };
    }
    ownerId = id;
  }
  return null;
}

export function parseInstance(files) {
  const entities = [], typeMap = new Map();
  for (const [path, text] of [...files.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!path.endsWith(".md") || path.split("/").pop() === "README.md") continue;
    const loc = locate(path);
    if (!loc) continue;
    const { self, chain } = loc;
    const type = singular(self.folder);
    if (!type) throw new Error(`R7: folder "${self.folder}" is not the plural of a type (${path})`);
    const ownerType = self.ownerId ? singular(chain[chain.length - 2].folder) : null;
    typeMap.set(type, { type, folder: self.folder, owner: ownerType });
    const lines = text.split("\n");
    const [fields, body] = parseFrontmatter(lines);
    const { name, tagline, sections } = parseBody(body);
    entities.push({ id: self.id, type, name, tagline, fields, sections,
                    owner: self.ownerId, path: "example/" + path });
  }
  entities.sort((a, b) => (a.id < b.id ? -1 : 1));

  const byName = new Map();
  for (const e of entities) {
    if (byName.has(e.name)) throw new Error(`R2: two entities share the name "${e.name}"`);
    byName.set(e.name, e.id);
  }
  const resolve = (value, where) => {
    if (!byName.has(value)) throw new Error(`R4: "${value}" in ${where} names no entity`);
    return byName.get(value);
  };

  const edges = [];
  for (const e of entities) {
    for (const [key, value] of Object.entries(e.fields)) {
      if (!Array.isArray(value)) continue;
      for (const v of value) edges.push({ from: e.id, to: resolve(v, e.path), via: key, attrs: {} });
    }
    for (const s of e.sections) {
      if (!s.table) continue;
      for (const row of s.table.rows) {
        let to = null; const attrs = {}; let via = "";
        s.table.columns.forEach((col, i) => {
          const cell = row[i] ?? "";
          const resolved = byName.get(cell);
          if (resolved && !to) { to = resolved; via = `${s.heading}.${col}`; }
          else attrs[col] = resolved ?? cell;
        });
        if (!to) throw new Error(`R4: row "${row[0]}" in ${e.path} names no entity`);
        edges.push({ from: e.id, to, via, attrs });
      }
    }
  }
  edges.sort((a, b) => (a.from + a.via + a.to < b.from + b.via + b.to ? -1 : 1));

  const types = [...typeMap.values()].sort((a, b) => (a.type < b.type ? -1 : 1));
  return { commit: null, root: ROOT_LABEL, types, entities, edges };
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test:example`
Expected: 10/10 pass. If the frontmatter-list test fails on `skills: [Java Programming]`, check `parseFrontmatter` keeps spaces inside list items (it must: names carry spaces).

- [ ] **Step 5: Commit**

```bash
git add example/instance.mjs verify/instance.test.mjs package.json
git commit -m "Read an instance by its shape alone, and refuse a name that resolves to nothing"
```

---

### Task 2: The page, static

The billing skeleton with the example page's prose and an empty figure area. No data yet, no JS beyond the language toggle. `verify` learns the page.

**Files:**
- Create: `example/index.html`
- Modify: `verify/check.mjs` — add the `/example/` page spec (without `graph`, that is Task 4)
- Modify: `sitemap.xml`

- [ ] **Step 1: Copy billing to example and strip it**

```bash
cp billing/index.html example/index.html
```

Then in `example/index.html`:
- `<title>Example — CompanyGraph</title>`; `metadesc`/`og:description` → `A fictional company described in CompanyGraph, drawn as the graph its files form — generated from the model's own example, nothing written by hand.`; `canonical`/`og:url` → `https://companygraph.io/example/`; `og:image` → `https://companygraph.io/example/og.png`; `og:image:alt` → `One company, drawn: a tree from a fictional company to its folders and pages.`; the JSON-LD `WebPage` `@id`/`name`/`url` → example.
- Nav: `<a href="https://companygraph.io/talks/" data-de="Vorträge">Talks</a>`, `<a href="./" aria-current="page" data-de="Beispiel">Example</a>`, `<a href="../billing/" data-de="Abrechnung">Billing</a>`, then the toggle.
- Remove billing's `.unit`, `.cols`, `.card`, `.free`, `.never` CSS and the two `<section>`s that used them, keep `.title`, `.tagline`, `.note`, `section`, `h2`, `.lede`, `.rules`, footer.
- Replace `<main>`'s content with:

```html
    <div class="title">
      <h1 data-de="<span class='r70'>Eine Firma,</span><span class='rcl'><em>gezeichnet</em>.</span>"><span class="r70">One company,</span><span class="rcl"><em>drawn</em>.</span></h1>
      <p class="tagline" data-de="Eine fiktive Firma, in CompanyGraph beschrieben — genau so, wie ihre Dateien es sagen, und gezeichnet als der Graph, den diese Dateien bilden.">A fictional company described in CompanyGraph — exactly as its files say, drawn as the graph those files form.</p>
      <p class="note" data-de="Nichts hier ist echt, und nichts hier wurde von Hand geschrieben: Die Seite wird aus dem Beispiel des Modells erzeugt, beim Commit, der neben der Zeichnung steht.">Nothing here is real, and nothing here was written by hand: the page is generated from the model's example, at the commit named beside the figure.</p>
    </div>

    <section class="figure-section">
      <div class="figwrap">
        <div class="figscroll"><svg id="fig" class="fig" role="img" aria-labelledby="figcap"></svg></div>
        <aside id="panel" class="panel" aria-live="polite"></aside>
      </div>
      <p class="figcap" id="figcap" data-de="Ein durchgezogener Strich heisst <b>besitzt</b>. Ein gestrichelter heisst <b>verweist per Namen auf</b>. Ein umrandeter Kasten ist ein Ordner, ein gefülltes Quadrat eine Seite. Anklicken öffnet.">A solid line means <b>owns</b>. A dashed line means <b>refers to by name</b>. An outlined box is a folder, a filled square is a page. Click to open.</p>
    </section>

    <section>
      <h2 data-de="Wie man es liest">How to read it</h2>
      <div class="rules">
        <p data-de="<b>Ein Ordner ist der Plural seines Typs.</b> Was in <span class='mono'>skills/</span> liegt, ist ein Skill. Es gibt keine Abkürzung, weil die eine Regel, die beide Namen vorhersagbar macht, keine Ausnahme verträgt.">
          <b>A folder is the plural of its type.</b> What sits in <span class="mono">skills/</span> is a skill. Nothing is abbreviated, because the one rule that makes both names predictable cannot afford an exception.</p>
        <p data-de="<b>Eine Seite ist eine Datei, wenn sie nichts besitzt, und ein Ordner, wenn sie eigene Sammlungen besitzt.</b> Das Profil ist das Beispiel für das Zweite: Es hält seine eigene Datei und daneben die Erfahrungen, die ihm gehören.">
          <b>A page is a file when it owns nothing, and a folder when it owns collections of its own.</b> The profile is the example of the second: it holds its own file and, beside it, the experiences that belong to it.</p>
        <p data-de="<b>Jede Linie ist ein Name, der in einer Datei steht.</b> Nichts hier ist ein Link, der kaputtgehen kann: Ein Name, der auf nichts zeigt, ist ein Fehler, keine Warnung.">
          <b>Every line is a name written in a file.</b> Nothing here is a link that can break: a name that points at nothing is an error, not a warning.</p>
      </div>
    </section>

    <section>
      <h2 data-de="Woher es kommt">Where it comes from</h2>
      <p class="unit mono"><a id="srclink" href="https://github.com/companygraph/meta-model/tree/HEAD/example" target="_blank" rel="noopener">meta-model/example @ <span id="srccommit">HEAD</span></a></p>
      <p class="lede" data-de="Das Beispiel ist absichtlich erfunden, und sein README sagt, warum. Diese Seite sagt es nicht noch einmal — sie verlinkt.">The example is fictional by design, and its README says why. This page does not say it again — it links.</p>
    </section>
```

- Add CSS for the figure area (settled state only; motion comes in Task 4):

```css
  .figure-section{margin-top:clamp(2rem,5vh,3.5rem)}
  .figwrap{display:grid; grid-template-columns:minmax(0,1fr); gap:1.4rem; align-items:start}
  @media (min-width: 900px){ .figwrap.has-panel{grid-template-columns:minmax(0,1.4fr) minmax(280px,1fr)} }
  .figscroll{overflow-x:auto; overflow-y:hidden; border:1.5px solid var(--rule); border-radius:12px;
             background:var(--raise); padding:1rem}
  .fig{display:block; height:auto; min-width:100%}
  .figcap{margin-top:1.1rem; color:var(--dim); font-size:clamp(1rem,1.3vw,1.14rem); line-height:1.5; max-width:68ch}
  .figcap b{color:var(--ink); font-weight:600}
  .panel:empty{display:none}
  .panel{background:var(--raise); border:1.5px solid var(--c-mid); border-radius:12px; padding:1.3rem 1.4rem}
  .panel .ptype{font-family:"Plex Mono",monospace; font-size:.76rem; letter-spacing:.08em; color:var(--dim)}
  .panel h3{margin-top:.3rem; font-family:"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
            font-weight:700; letter-spacing:-.02em; font-size:1.5rem}
  .panel .ptag{margin-top:.5rem; color:var(--dim)}
  .panel table{margin-top:1rem; border-collapse:collapse; width:100%; font-size:.9rem}
  .panel th{text-align:left; font-weight:600; color:var(--dim); padding:.3rem .6rem .3rem 0; border-bottom:1px solid var(--rule)}
  .panel td{padding:.35rem .6rem .35rem 0; vertical-align:top; border-bottom:1px solid var(--rule)}
  .panel td.k, .panel td .mono{font-family:"Plex Mono",monospace; font-size:.82rem; color:var(--dim)}
  .panel h4{margin-top:1.1rem; font-size:.76rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--dim)}
  .panel p{margin-top:.4rem; font-size:.95rem; line-height:1.5}
  .panel a.sel{color:var(--c-mid); text-decoration:none; border-bottom:1px solid var(--c-weak); cursor:pointer}
  .panel .view{display:inline-block; margin-top:1.1rem; font-family:"Plex Mono",monospace; font-size:.8rem; color:var(--c-mid); text-decoration:none}
  .mono{font-family:"Plex Mono",monospace; font-size:.9em}
  /* figure tokens — settled state; Task 4 adds the additive motion */
  .fig .own{fill:none; stroke:var(--c-weak); stroke-width:2; stroke-linecap:square}
  .fig .ref{fill:none; stroke:var(--c-weak); stroke-width:1.6; stroke-dasharray:5 5}
  .fig .ref.hot{stroke:var(--c-mid)}
  .fig .box{fill:none; stroke:var(--c-weak); stroke-width:2}
  .fig .sq{fill:var(--c-firm)}
  .fig .n{cursor:pointer}
  .fig .n:hover .box, .fig .n:focus-visible .box, .fig .n.open .box{stroke:var(--c-mid)}
  .fig .n:hover .sq, .fig .n:focus-visible .sq, .fig .n.sel .sq{fill:var(--c-mid)}
  .fig .n:focus{outline:none}
  .fig text{fill:var(--ink); font-family:"Instrument Sans", ui-sans-serif, system-ui, sans-serif; font-size:13px; dominant-baseline:middle}
  .fig text.folder{font-family:"Plex Mono",monospace; font-size:12px}
  .fig text.root{font-family:"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif; font-weight:700; font-size:15px}
```

- Update the language `UI` object: `title:"Beispiel — CompanyGraph"` / `"Example — CompanyGraph"`, and the two `desc` strings (DE: `Eine fiktive Firma, in CompanyGraph beschrieben, gezeichnet als der Graph, den ihre Dateien bilden — erzeugt aus dem Beispiel des Modells, nichts von Hand geschrieben.`).
- Just before `</body>`, add the empty data block, exactly:

```html
<!-- example data · none -->
<script type="application/json" id="example-data">{}</script>
<!-- /example data -->
```

- [ ] **Step 2: Add the page spec to `verify/check.mjs`** after the billing spec:

```js
  // The example page. Its one promise is that nothing about the example was written by hand,
  // so the strings asserted here are the page's own prose, never a name from the model —
  // those are asserted by `graph`, which reads them out of the data block.
  { path: "/example/", noNewTab: false, title: /CompanyGraph/, lang: "en",
    contains: ["One company", "drawn", "A solid line means", "How to read it", "Where it comes from"],
    links: ["https://github.com/companygraph"],
    sameTab: ["https://companygraph.io/talks/", "../billing/", "../privacy/", "../", "./"],
    sameOrigin: true,
    translates: { lang: "de", shows: ["Eine Firma", "gezeichnet", "Wie man es liest", "BEISPIEL"], hides: ["One company", "How to read it"] },
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://companygraph.io", internalLinks: true },
```

`noNewTab` is false because the *view file* link and the source link open GitHub in a new tab. Check `links` in this file asserts `target="_blank" rel="noopener"` for outbound hrefs (it does — `links()` ≈ line 171); the `srclink` href in Step 1 must therefore carry both.

- [ ] **Step 3: Sitemap** — add `<url><loc>https://companygraph.io/example/</loc></url>` after `/billing/`.

- [ ] **Step 4: Render and verify**

Open `http://localhost:8000/example/` in both languages and at a phone width: the page reads like billing with an empty figure box. Run `npm run verify`: `/example/` fails only on `card` (no `og.png` yet — Task 5) and, if it does, on `sameOrigin`/`fontsLoaded` — those two must pass; fix paths if not. All other pages still pass.

- [ ] **Step 5: Commit**

```bash
git add example/index.html verify/check.mjs sitemap.xml
git commit -m "Add the example page's prose and its place in the site, with nothing drawn yet"
```

---

### Task 3: The generator and the pin

**Files:**
- Create: `example/source.json`, `example/build.mjs`
- Modify: `package.json` — scripts `"example": "node example/build.mjs"`, `"example:check": "node example/build.mjs --check"`
- Modify: `example/index.html` — the block gets written
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `parseInstance`, from Task 1.
- Produces: the data block in the page; `#srccommit`/`#srclink` are filled by the page's JS from `data.commit` (Task 4), not by the generator.

- [ ] **Step 1: `example/source.json`**

```json
{ "repo": "companygraph/meta-model", "commit": "400ab2b1278a584cd59930e95c3e68a7b9f20090" }
```

- [ ] **Step 2: `example/build.mjs`**

```js
// Writes the example instance into example/index.html as a data block, or checks that the
// block there still matches — `npm run example` and `npm run example:check`.
//
// The instance is read at exactly the commit source.json names: from a local checkout when
// META_MODEL points at one whose HEAD is that commit, otherwise from GitHub — one call to the
// git trees API for the file list, then the raw files. No tarball, so nothing to untar, and
// no dependency. GITHUB_TOKEN is sent if present and never printed.
//
// The block is fenced by markers that name the commit, the way the token block is fenced by
// its version: a reader of the HTML can see which state of the model the page shows, and the
// check can find the block without parsing the page.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseInstance } from "./instance.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(here, "index.html");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(here, "source.json"), "utf8"));
const START = /<!-- example data · [0-9a-f]+|none -->\n<script type="application\/json" id="example-data">/;
const END = "</script>\n<!-- /example data -->";

async function readLocal(dir) {
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) throw new Error(`META_MODEL is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
  const root = path.join(dir, "example");
  const files = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, "utf8"));
    }
  };
  walk(root);
  return files;
}

async function readRemote() {
  const headers = { "user-agent": "companygraph.io example build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const tree = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!tree.ok) throw new Error(`trees API: HTTP ${tree.status}`);
  const { tree: entries, truncated } = await tree.json();
  if (truncated) throw new Error("trees API truncated the listing");
  const files = new Map();
  for (const e of entries) {
    if (e.type !== "blob" || !e.path.startsWith("example/")) continue;
    const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
    if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
    files.set(e.path.slice("example/".length), await raw.text());
  }
  return files;
}

const files = process.env.META_MODEL ? await readLocal(process.env.META_MODEL) : await readRemote();
const data = { ...parseInstance(files), commit };
const block = `<!-- example data · ${commit} -->\n<script type="application/json" id="example-data">${JSON.stringify(data)}${END}`;

const page = fs.readFileSync(PAGE, "utf8");
const start = page.search(START), end = page.indexOf(END);
if (start < 0 || end < 0) throw new Error("example/index.html has no data block markers");
const current = page.slice(start, end + END.length);

if (process.argv.includes("--check")) {
  if (current === block) { console.log(`  ✓ example/index.html shows ${repo}@${commit.slice(0, 7)}`); process.exit(0); }
  console.log(`  ✗ example/index.html no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run example`);
  process.exit(1);
}
fs.writeFileSync(PAGE, page.slice(0, start) + block + page.slice(end + END.length));
console.log(`  wrote ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
```

- [ ] **Step 3: Generate locally, then check remotely**

Run: `META_MODEL=$HOME/git/companygraph/meta-model npm run example`
Expected: `wrote 11 entities, 7 edges from companygraph/meta-model@400ab2b` (2 values, 2 skills, 4 levels, 1 profile, 2 experiences; edges: Mira→Java, Mira→DDD, 2022→Java, 2022→DDD, 2018→Java = 5 … count what it prints and confirm by reading the block; the plan's numbers are a sanity check, the block is the truth).

Run: `npm run example:check` (no `META_MODEL`) — fetches from GitHub, must print ✓. Then edit one character inside the block by hand, run the check again, see ✗, revert with `npm run example`.

- [ ] **Step 4: CI** — in `.github/workflows/ci.yml`, after the `og:check` step and before `npm ci`:

```yaml
      - name: The instance parser still works
        run: npm run test:example
      - name: The example page still shows the pinned commit
        run: npm run example:check
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

- [ ] **Step 5: Verify, commit**

`npm run verify` — `/example/` unchanged from Task 2 (card still missing). Commit:

```bash
git add example/source.json example/build.mjs example/index.html package.json .github/workflows/ci.yml
git commit -m "Generate the example page from the model's own example, at a commit it names"
```

---

### Task 4: The figure and the panel

**Files:**
- Modify: `example/index.html` — the page script and the motion CSS
- Modify: `verify/check.mjs` — the `graph` check and its key on the `/example/` spec

**Interfaces:**
- Consumes: the data block (`#example-data`), whose shape is Task 1's output plus `commit`.
- Produces: DOM the check drives — every node is `g.n[data-id]` with `role="button"`; folder nodes have `data-kind="folder"`, entity nodes `data-kind="entity"`, the root `data-kind="root"`; `#panel h3` holds the selected entity's name; reference lines are `path.ref[data-from][data-to]`.

- [ ] **Step 1: Add the motion CSS** after the figure tokens (additive only — copy the landing page's comment about the rule):

```css
  .fig .an{animation:fig-in .42s cubic-bezier(.22,.7,.3,1) var(--d,0s) backwards}
  .fig .trace{animation-name:fig-trace; animation-duration:.5s; animation-timing-function:ease-in-out}
  @keyframes fig-in   {from{opacity:0; transform:translateX(-7px)}}
  @keyframes fig-trace{from{stroke-dasharray:0 100} to{stroke-dasharray:100 0}}
  @media (prefers-reduced-motion: reduce){
    .fig, .fig *{animation:none !important; transition:none !important; opacity:1 !important; transform:none !important}
    .fig .own{stroke-dasharray:none !important}
  }
```

(`.ref` keeps its static `5 5` dash, so it is excluded from the reduced-motion dash reset — only `.own` traces.)

- [ ] **Step 2: The page script**, added before the language script:

```html
<script>
// The figure is the data block, drawn. Nothing in this script knows a name from the example:
// it reads types, entities and edges from #example-data and lays them out as the tree they
// already are on disk — root, folders, pages, owned folders, pages — and draws a reference
// only between two pages that are both visible, so a dashed line never lands on nothing.
(function(){
  var data = JSON.parse(document.getElementById("example-data").textContent);
  if (!data.entities) return;                       // the block is empty until npm run example
  var svg = document.getElementById("fig"), panel = document.getElementById("panel");
  var wrap = panel.parentNode;
  var src = document.getElementById("srclink");
  src.href = "https://github.com/companygraph/meta-model/tree/" + data.commit + "/example";
  document.getElementById("srccommit").textContent = data.commit.slice(0, 7);

  var byId = {}; data.entities.forEach(function(e){ byId[e.id] = e; });
  var rootTypes = data.types.filter(function(t){ return !t.owner; });
  var ownedTypes = function(type){ return data.types.filter(function(t){ return t.owner === type; }); };

  // Tree model. Folder ids are the folder's path on disk; the root is "root".
  function children(node){
    if (node.kind === "root") return rootTypes.map(function(t){ return { kind:"folder", id:t.folder, label:t.folder, type:t.type, ownerId:null }; });
    if (node.kind === "folder") return data.entities
      .filter(function(e){ return e.type === node.type && e.owner === node.ownerId; })
      .map(function(e){ return { kind:"entity", id:e.id, label:e.name, entity:e }; });
    return ownedTypes(node.entity.type).map(function(t){ return { kind:"folder", id:node.id + "/" + t.folder, label:t.folder, type:t.type, ownerId:node.id }; });
  }
  var root = { kind:"root", id:"root", label:data.root };

  var open = {}, selected = null, seen = {};
  var COL = 220, ROW = 40, PAD = 16;

  // Tidy layout: leaves take one row each, a parent sits at the middle of its children.
  function layout(node, depth, cursor, out){
    var kids = open[node.id] ? children(node) : [];
    var y;
    if (!kids.length) { y = cursor.y; cursor.y += ROW; }
    else { var ys = kids.map(function(k){ return layout(k, depth + 1, cursor, out).y; }); y = (ys[0] + ys[ys.length - 1]) / 2; }
    var placed = { node:node, x: PAD + depth * COL, y:y, kids:kids };
    out.push(placed);
    return placed;
  }

  function folderOf(entityId){ var e = byId[entityId]; var i = entityId.lastIndexOf("/"); return entityId.slice(0, i); }
  function ownerChain(entityId){ var e = byId[entityId], ids = []; while (e) { ids.unshift(e.id); e = e.owner ? byId[e.owner] : null; } return ids; }
  // Opening an entity opens what it owns and every folder one of its references points at.
  function openEntity(id){
    open[id] = true;
    data.edges.filter(function(x){ return x.from === id; }).forEach(function(x){
      ownerChain(x.to).forEach(function(oid){ open[folderOf(oid)] = true; if (oid !== x.to) open[oid] = true; });
    });
    open["root"] = true;
    ownerChain(id).forEach(function(oid){ open[folderOf(oid)] = true; if (oid !== id) open[oid] = true; });
  }

  function el(name, attrs){ var e = document.createElementNS("http://www.w3.org/2000/svg", name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function draw(){
    var placed = []; layout(root, 0, { y: PAD + ROW / 2 }, placed);
    var pos = {}; placed.forEach(function(p){ pos[p.node.id] = p; });
    var w = PAD * 2 + COL * Math.max.apply(null, placed.map(function(p){ return (p.x - PAD) / COL; })) + 200;
    var h = Math.max.apply(null, placed.map(function(p){ return p.y; })) + ROW;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h); svg.style.width = w + "px";
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var delay = 0;
    placed.forEach(function(p){ p.kids.forEach(function(k){
      var c = pos[k.id]; var fresh = !seen[k.id];
      var d = "M" + (p.x + 12) + " " + p.y + " H" + (p.x + COL / 2) + " V" + c.y + " H" + (c.x - 12);
      var path = el("path", { "class": "own" + (fresh ? " an trace" : ""), d:d, pathLength:"100" });
      if (fresh) path.style.setProperty("--d", (delay += .04) + "s");
      svg.appendChild(path);
    }); });
    data.edges.forEach(function(x){
      if (!pos[x.from] || !pos[x.to]) return;
      var a = pos[x.from], b = pos[x.to];
      var d = "M" + (a.x + 12) + " " + a.y + " C" + (a.x + 80) + " " + a.y + " " + (b.x - 80) + " " + b.y + " " + (b.x - 12) + " " + b.y;
      svg.appendChild(el("path", { "class": "ref" + (selected === x.from ? " hot" : ""), d:d, "data-from":x.from, "data-to":x.to }));
    });
    placed.forEach(function(p){
      var n = p.node, fresh = !seen[n.id]; seen[n.id] = true;
      var g = el("g", { "class": "n" + (open[n.id] ? " open" : "") + (selected === n.id ? " sel" : "") + (fresh ? " an" : ""),
                        role:"button", tabindex:"0", "data-id":n.id, "data-kind":n.kind, "aria-expanded": open[n.id] ? "true" : "false",
                        transform:"translate(" + p.x + " " + p.y + ")" });
      if (fresh) g.style.setProperty("--d", (delay += .04) + "s");
      if (n.kind === "entity") g.appendChild(el("rect", { "class":"sq", x:"-12", y:"-12", width:"24", height:"24" }));
      else g.appendChild(el("rect", { "class":"box", x:"-12", y:"-14", width:"24", height:"28", rx:"4" }));
      var t = el("text", { x:"20", y:"0", "class": n.kind === "folder" ? "folder" : n.kind === "root" ? "root" : "" });
      t.textContent = n.label; g.appendChild(t);
      g.addEventListener("click", function(){ toggle(n); });
      g.addEventListener("keydown", function(ev){ if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(n); } });
      svg.appendChild(g);
    });
    wrap.classList.toggle("has-panel", !!selected);
  }

  function toggle(n){
    if (n.kind === "entity") { if (selected === n.id && open[n.id]) { open[n.id] = false; selected = null; } else { selected = n.id; openEntity(n.id); } }
    else open[n.id] = !open[n.id];
    if (selected && !open[selected]) selected = null;
    location.hash = selected ? "#" + selected : "";
    draw(); showPanel();
  }

  function h(tag, text, cls){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function link(id){ var a = h("a", byId[id].name, "sel"); a.href = "#" + id; a.addEventListener("click", function(ev){ ev.preventDefault(); selected = id; openEntity(id); draw(); showPanel(); }); return a; }
  function showPanel(){
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    if (!selected) return;
    var e = byId[selected];
    panel.appendChild(h("div", e.type, "ptype"));
    panel.appendChild(h("h3", e.name));
    if (e.tagline) panel.appendChild(h("p", e.tagline, "ptag"));
    var keys = Object.keys(e.fields);
    if (keys.length) {
      var t = h("table"), tb = h("tbody"); t.appendChild(tb);
      keys.forEach(function(k){ var tr = h("tr"); tr.appendChild(h("td", k, "k")); var v = e.fields[k];
        var td = h("td"); if (Array.isArray(v)) v.forEach(function(name, i){ if (i) td.appendChild(document.createTextNode(", ")); var id = data.entities.filter(function(x){ return x.name === name; })[0]; td.appendChild(id ? link(id.id) : document.createTextNode(name)); }); else td.textContent = v;
        tr.appendChild(td); tb.appendChild(tr); });
      panel.appendChild(t);
    }
    e.sections.forEach(function(s){
      panel.appendChild(h("h4", s.heading));
      if (s.table) {
        var t = h("table"), thead = h("thead"), hr = h("tr"); s.table.columns.forEach(function(c){ hr.appendChild(h("th", c)); }); thead.appendChild(hr); t.appendChild(thead);
        var tb = h("tbody"); s.table.rows.forEach(function(row){ var tr = h("tr"); row.forEach(function(cell){ var td = h("td"); var m = data.entities.filter(function(x){ return x.name === cell; })[0]; if (m) td.appendChild(link(m.id)); else td.textContent = cell; tr.appendChild(td); }); tb.appendChild(tr); }); t.appendChild(tb);
        panel.appendChild(t);
      }
      if (s.text) s.text.split(/\n\n+/).forEach(function(par){ panel.appendChild(h("p", par.replace(/\n/g, " "))); });
    });
    var view = h("a", "view file", "view"); view.href = "https://github.com/companygraph/meta-model/blob/" + data.commit + "/" + e.path; view.target = "_blank"; view.rel = "noopener";
    panel.appendChild(view);
  }

  var initial = decodeURIComponent(location.hash.slice(1));
  if (initial && byId[initial]) { selected = initial; openEntity(initial); }
  draw(); showPanel();
})();
</script>
```

- [ ] **Step 3: The `graph` check** in `verify/check.mjs` (add to `CHECKS`, and `graph: true` to the `/example/` spec):

```js
  // The click-through. Every name and count here is read out of the page's own data block,
  // so the check restates nothing about the example: it asserts that what the block says is
  // what the figure draws, at each step of opening it.
  async graph(page) {
    const data = await page.evaluate(() => JSON.parse(document.getElementById("example-data").textContent));
    if (!data.entities) return "the data block is empty — run: npm run example";
    const visible = () => page.evaluate(() => Array.from(document.querySelectorAll(".fig .n")).map(n => n.dataset.id));
    const click = (id) => page.evaluate((id) => document.querySelector(`.fig .n[data-id="${id}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })), id);
    let ids = await visible();
    if (ids.length !== 1 || ids[0] !== "root") return `initially ${ids.length} node(s), expected the root alone`;
    await click("root"); ids = await visible();
    const roots = data.types.filter(t => !t.owner).map(t => t.folder);
    for (const f of roots) if (!ids.includes(f)) return `root open, but folder ${f} is not drawn`;
    if (ids.length !== roots.length + 1) return `root open: ${ids.length - 1} folders drawn, block has ${roots.length}`;
    const withEdges = data.edges[0]; if (!withEdges) return null;
    const from = data.entities.find(e => e.id === withEdges.from);
    // open the folder chain down to the first edge's source, then the source itself
    const chain = []; for (let e = from; e; e = e.owner ? data.entities.find(x => x.id === e.owner) : null) chain.unshift(e);
    for (const e of chain) { await click(e.id.slice(0, e.id.lastIndexOf("/"))); if (e !== from) await click(e.id); }
    await click(from.id);
    const name = await page.evaluate(() => (document.querySelector("#panel h3") || {}).textContent);
    if (name !== from.name) return `panel shows ${JSON.stringify(name)}, expected ${JSON.stringify(from.name)}`;
    const drawn = await page.evaluate((id) => Array.from(document.querySelectorAll(`.fig .ref[data-from="${id}"]`)).map(p => p.dataset.to), from.id);
    const want = data.edges.filter(x => x.from === from.id).map(x => x.to);
    for (const to of want) if (!drawn.includes(to)) return `reference ${from.id} → ${to} is in the block but not drawn`;
    const hash = await page.evaluate(() => decodeURIComponent(location.hash.slice(1)));
    return hash === from.id ? null : `hash is ${JSON.stringify(hash)}, expected ${from.id}`;
  },
```

- [ ] **Step 4: Render and look.** With `npm run serve` running, open `/example/`: click the root, the folders, `profiles`, the profile — the `experiences` folder, `skills` and `proficiency-levels` open with dashed lines; the panel shows type, name, tagline, the `email`/`location` fields, the Skills table with linked Skill/Level cells, Summary, *view file*. Toggle DE (chrome changes, entity text does not). Reload with the hash: the state comes back. Phone width: the figure scrolls horizontally inside its box, the page does not; the panel sits below. Reduced motion (DevTools → Rendering → emulate): the settled state, nothing dimmed. Take screenshots of the settled root+folders state and of the profile selected; look at them.

- [ ] **Step 5: Verify and commit**

`npm run verify` — `/example/` fails only on `card`. Then:

```bash
git add example/index.html verify/check.mjs
git commit -m "Draw the example as the tree it is on disk, and open it on click"
```

---

### Task 5: Nav, card, the debts every page pays

**Files:**
- Modify: `index.html`, `privacy/index.html`, `billing/index.html`, `talks/index.html` — nav item
- Modify: `verify/check.mjs` — nav strings on those pages
- Modify: `og-recipe.mjs` — fourth card; regenerate `example/og.png` + `example/og.sha`
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Nav item on every page.** Insert between Talks and Billing:
  - `index.html`: `<a href="example/" data-de="Beispiel">Example</a>`
  - `privacy/`, `billing/`: `<a href="../example/" data-de="Beispiel">Example</a>`
  - `talks/index.html`: `<a href="../example/" data-de="Beispiel">Example</a>`
- [ ] **Step 2: Assertions.** In `verify/check.mjs`: landing `contains` gains `"EXAMPLE"` and `translates.shows` gains `"BEISPIEL"`; privacy/billing/talks `sameTab` gain `"../example/"`; `/talks/` `translates.shows` gains `"Beispiel"`.
- [ ] **Step 3: The card.** In `og-recipe.mjs` add `{ dir: "example", ...FRAME, hide: ".panel{display:none}", titleSlide: false, settle: "reduced-motion" },` with a comment: the panel is hidden because the card shows the figure's settled initial state, and nothing is selected in it. Run `npm run test:og` (the "every og.png has a card" test needs the png — run `npm run og` first, then `test:og`, then `og:check`). Look at `example/og.png`: the title and the root-with-folders figure.

  If the initial state draws only the root (it does — everything starts collapsed), decide: the card is more legible with the root *and* the four folders. Implement by having the page open the root when `prefers-reduced-motion` is on **and** there is no hash — a one-line `if (matchMedia("(prefers-reduced-motion: reduce)").matches && !initial) open.root = true;` before the first `draw()`. Note it in the script comment: the card renders that state. Re-run `og`, `og:check`, and `verify` (the `graph` check's "initially one node" must then only apply without reduced motion — the check does not emulate it, so it still holds).
- [ ] **Step 4: README and CLAUDE.md.** README's file table gains `example/` (page, `build.mjs`, `instance.mjs`, `source.json`) and the two scripts. CLAUDE.md "One screen, one job" section gains a bullet under the never-restate rule: *The example page is the one mechanical exception: its data block is generated from `meta-model/example` at the commit in `example/source.json`, and `npm run example:check` fails when it drifts. Nothing else on that page names anything from the example.* And in "Share cards": "three `og.png` files" → "four".
- [ ] **Step 5: Everything green**

```bash
npm run test:example && npm run example:check && npm run test:og && npm run og:check && npm run verify
```
All pass, every page ✓.

- [ ] **Step 6: Commit**

```bash
git add index.html privacy/index.html billing/index.html talks/index.html verify/check.mjs og-recipe.mjs example/og.png example/og.sha example/index.html README.md CLAUDE.md
git commit -m "Put Example in the nav, give it a card, and say where its one copy comes from"
```

---

### Task 6: PR

- [ ] `git push -u origin example-page`; `gh pr create --title "Add the example page" --body "…spec path…"`; wait for the `verify` job (it now runs `test:example` and `example:check` before `npm ci`); if `main` moved, merge it in (never rebase — repo policy); `gh pr merge --merge --delete-branch`. Check `https://companygraph.io/example/` after Pages deploys.
