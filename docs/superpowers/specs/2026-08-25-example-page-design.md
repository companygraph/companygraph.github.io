# The example page — design

> `companygraph.io/example/`: the fictional company from `meta-model/example`, drawn as the
> graph its files form, opening on click from one node down to the entities and the references
> between them.

Status: design agreed, nothing built.

## 1. Purpose and non-goals

The page shows what an instance *is* without a reader opening a repository. It is the third
page in the site's plain-page family beside billing and privacy: same shell, nav, footer,
language toggle, `verify` spec and share card. Its one figure is interactive.

**Owns:**

- a generator that turns the example instance at a pinned `meta-model` commit into a data
  block inside the page
- the page's own prose — what you are looking at and how to read it
- the interactive figure and its detail panel
- a check that the block still matches the pinned commit

**Non-goals:**

- any content *about* the example written by hand — names, counts, field values all come
  from the block; the site's rule against restating what lives in `meta-model` holds here
  with one mechanical exception, and that exception is checked
- showing schemas, or types the example does not use
- editing, search, or a viewer for arbitrary instances — the page renders one committed
  block; generality is the tooling's job
- translating entity content — it is data, shown as written

The nav gains **Example** on every page. The talks live in this repository now, so there is
no second repository to keep in step: one repo, five pages, one `verify` run.

---

## 2. The generator and the pin

```
example/
  source.json       { "repo": "companygraph/meta-model", "commit": "<40-hex>" }
  build.mjs         reads example/ at that commit → writes the data block into index.html
  index.html        the page; carries the block between markers
```

**Input.** `META_MODEL=/path/to/checkout` when set, for local work; otherwise the tarball of
`repo` at `commit` from GitHub. The generator refuses a local checkout whose `HEAD` is not
`commit`, so local and CI read the same bytes.

**Parsing is by the fixed shape only**, the same discipline the tooling spec sets for its
`check`: YAML frontmatter as key/scalar or key/list; the H1 as the canonical name; the `>`
tagline; `##` sections as heading plus body text; a body table as rows by its header. No
schema is read. Types are the folder names singularised by R7; the owner relation is nesting
on disk (R5, R6). Reference edges come from two places only: frontmatter values that name an
H1 elsewhere in the instance (`skills:` on an experience), and table cells that do (a
profile's `Skill` and `Level` columns). A name that resolves to nothing is a generator error
under R4, so the page can never draw a dangling edge.

**Output.** One JSON object in `<script type="application/json" id="example-data">`, fenced by
`<!-- example data · <commit> -->` and `<!-- /example data -->` — the committed-copy-with-a-
marker pattern the token block already uses:

```json
{ "commit": "…", "root": "Fictional Company",
  "types":    [{ "type": "value", "folder": "values", "owner": null },
               { "type": "experience", "folder": "experiences", "owner": "profile" }, …],
  "entities": [{ "id": "skills/java-programming", "type": "skill",
                 "name": "Java Programming", "tagline": "…",
                 "fields": { "group": "Programming Languages" },
                 "sections": [{ "heading": "In practice", "text": "…" }],
                 "owner": null, "path": "example/skills/java-programming.md" }, …],
  "edges":    [{ "from": "profiles/mira-halvorsen", "to": "skills/java-programming",
                 "via": "Skills.Skill",
                 "attrs": { "Level": "proficiency-levels/proficient", "Evidence": "…" } }, …] }
```

`"Fictional Company"` is the only string that is not in the instance. It labels the root, it
is the generator's one constant, and the source names it as the one invented string. The
example's own README calls itself a fictional company, which is why that is the word.

**`npm run example`** rebuilds the block. **`npm run example:check`** re-derives it from the
pinned commit into memory and fails with a diff if the page's block differs. It runs in CI
before `npm ci`, beside `og:check` — Node only, and the tarball fetch is the one network
request, on a runner that already has network for `npm ci`.

**Bumping the example** is: edit `commit` in `source.json`, `npm run example`, commit both.
The marker names the commit, so anyone reading the HTML sees which state of the model it shows.

---

## 3. The page

The billing skeleton: `.shell` header with nav — *Talks · Example · Billing* and the language
toggle — `main .shell` with a `.title` block and sections, the footer. English markup, German
in `data-de`, the `cg-lang` mechanism copied verbatim.

- **Title:** *One company, drawn.* / *Eine Firma, gezeichnet.* **Tagline:** a fictional
  company described in CompanyGraph, exactly as its files say, drawn as the graph those files
  form. **Note:** nothing here is real, and nothing here was written by hand — the page is
  generated from `meta-model/example` at the commit named beside the figure.
- **The figure** (§4) takes the full content width. Its caption reads the legend in prose: a
  solid line is *owns*, a dashed line is *refers to by name*, an outlined box is a folder, a
  filled square is a page.
- **How to read it** — three paragraphs in billing's `.rules` style: a folder is the plural of
  its type; an entity is a file when it owns nothing and a folder when it owns collections,
  and the profile is the example of the second; every line is a name written in a file —
  nothing here is a link that can break.
- **Where it comes from** — one `.unit mono` line, `meta-model/example @ <short commit>`,
  linking to the tree at that commit on GitHub, and a sentence saying the example is
  fictional by design and that its README says why. Link, not restate.
- Footer as billing's. `<title>` *Example — CompanyGraph*; description in both languages; the
  share card rendered from the settled figure.

The page states no type count and no entity count. Those are read off the figure.

---

## 4. The figure

**Structure.** A tree drawn left to right, rooted at *Fictional Company*. Depth 1: one folder
node per root type in the block — `values`, `skills`, `proficiency-levels`, `profiles` —
labelled by folder name in mono, because a folder is what is on disk. Depth 2: the entities in
that folder, labelled by canonical name. An entity that owns a collection (the profile) shows
its owned folder — `experiences` — as a child node, faithful to disk, and that folder its
entities. References are dashed lines between entity nodes, drawn only when both ends are
visible.

**Interaction.** Everything starts collapsed except the root. Click a node → its children
appear: the root opens the four folders; a folder opens its entities; an entity opens its
owned folders, if any, *and* every folder one of its references points at, so a dashed line
always lands on a drawn node. Click again → collapse. Clicking an entity also selects it: a
panel beside the figure shows its type, canonical name, tagline, frontmatter fields as a
two-column mono table, each section's heading and text, and a *view file* link to the path at
the pinned commit. Table-backed references (the profile's Skills rows) appear in the panel as a
small table — Skill · Level · Evidence — with the first two as links that select that node.

Keyboard: nodes are `<button>`s in the SVG's DOM order; Enter and Space toggle; the panel is
`aria-live="polite"`. The URL hash names the selected entity (`#skills/java-programming`) so a
state can be shared.

**Layout.** A tidy tree computed in JS: siblings stacked vertically per column, a parent
centred on its children, fixed column x and row spacing — no physics. The SVG's `viewBox`
grows with the tree; the container scrolls horizontally inside `overflow-x:auto`; the page
never does. Phone width: the same drawing, scrollable; the panel moves below the figure.

**Motion.** Additive only — the landing figure's rule, copied with its comment: no rule outside
a `@keyframes` block sets an opacity, transform or dash pattern on any part of the figure.
New nodes animate with `fig-in`, new edges with `fig-trace`; collapse is immediate.
`prefers-reduced-motion` switches all of it off and shows the settled state, which is what
the share card renders — the initial state, root plus four folders, nothing selected.

**Tokens.** Folder boxes outlined `--c-weak`; entity squares filled `--c-firm`; the selected
entity, and anything clickable on hover or focus, `--c-mid`; owns-lines solid; reference
lines dashed in `--c-weak`, the selected entity's in `--c-mid`. No `--c-flag`: nothing here is
a reversal. Mono for folder names, field keys and the commit; prose for everything else.

---

## 5. Verification

- **`verify/check.mjs`** gains an `/example/` spec in the billing shape: `contains` for the
  title and the legend words; `links` for the tree-at-commit link; `sameTab` for the nav;
  `translates`; `card`; `tokens`, `monoScope`, `contrast`, `tokenVersion`; `internalLinks`;
  `sameOrigin: true` — the data is inline, the page requests nothing beyond its own files.
  Plus a page-specific `graph` check: after load exactly one node is visible; click it → the
  folder nodes; click the profiles folder → its entity; click the profile → the panel names
  it, its owned folder appears, and the folders its references point at open with dashed
  lines drawn. Counts and names come from the data block the check reads out of the DOM,
  never from literals, so the check does not restate the example either.
- **Every other page's spec** gains the new nav item in `contains`/`sameTab` and its German in
  `translates.shows`.
- **`npm run example:check`** as in §2. **`npm run test:example`** (`node --test`, no
  dependencies) drives `build.mjs`'s parser against fixture instances: a valid one; one with
  a dangling reference, which must throw citing R4; one with a root folder that is not a
  plural; one whose local `HEAD` is not the pin.
- **`og-recipe.mjs`** gains the fourth card, `{ dir: "example", settle: "reduced-motion" }`
  with a hide rule for the panel; `test:og` already fails on a card without an entry.
  `sitemap.xml` gains the URL.
- CI runs `test:example` and `example:check` before `npm ci`, beside the og steps.

---

## 6. Decisions recorded, and what stays open

- **Root label:** *Fictional Company* — the example README's own word for itself. It is the
  one invented string, and the generator says so.
- **Owned collections are drawn as folders** — `experiences` sits between the profile and its
  two experiences, because that is what is on disk. Fewer clicks was considered and rejected:
  the figure's job is to show the shape, and the folder is part of it.
- **Open — panel placement on narrow screens:** below the figure by default; decided by
  rendering.
