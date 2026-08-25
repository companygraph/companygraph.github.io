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
  block; generality is the tooling's job. The figure shows a neighbourhood, never the whole
  graph, precisely because a real instance is too large to draw at once
- translating entity content — it is data, shown as written
- Type names from core's vocabulary — profile, experience — may appear in the prose; they are
  the model's words, not the example's. Entity names, folder names as facts, and counts may not.

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
- Footer as billing's, including the `blust.ch` credit lockup. No link on the page opens a new tab
  (`noNewTab` asserts it, as on every page); the source link and *view file* go to GitHub in
  the same tab. `<title>` *Example — CompanyGraph*; description in both languages; the
  share card rendered from the settled figure.

The page states no type count and no entity count. Those are read off the figure.

---

## 4. The figure

**The stage.** A band of fixed height — `clamp(520px, 62vh, 720px)` — across the content width,
split into two regions that never change size: the graph canvas on the left, flexible in width,
and the card on the right, 360px wide and the stage's height, its body scrolling internally.
On a phone the two stack, each keeping a fixed height. Nothing on the page reflows when a
node is clicked; the page never scrolls horizontally.

**Focus and context, not the whole tree.** An instance can be hundreds of pages, so the canvas
shows one focused node and its neighbourhood only:

- **Ancestors**, as a chain to the left — root, folder, owner, folder — which is the focused
  node's path on disk. The same path is printed above the canvas in mono
  (`profiles / mira-halvorsen / experiences`), because a folder chain is a location and a
  location is data.
- **Children** in a column to the right, joined by solid *owns* lines: the root's folders, a
  folder's entities, an entity's owned folders.
- **References** in two dashed bands, each with a small mono eyebrow: *refers to* below the
  focus, the targets of its outgoing edges, with edge attributes (a Level) printed beside the
  target in mono; *referred by* above the focus, the sources of incoming edges. A reference
  is drawn only to a node that is on the canvas, and every node on the canvas is there
  because of the focus, so no line ever lands on nothing.

Clicking any node makes it the focus. Survivors move to their new places, newcomers fade in,
the rest fade out — a d3 transition of about 400 ms, 0 ms under `prefers-reduced-motion`,
which is also what the share card renders: the root focused, its folders to the right,
nothing selected. Drag pans; ctrl/⌘ + wheel zooms, so a plain wheel still scrolls the page; a
*recentre* control restores the fitted view.
Keyboard: nodes are focusable with Enter and Space; the card is `aria-live="polite"`. The URL
hash names the focus (`#skills/java-programming`) so a state can be shared and is restored
on load.

**The card.** A fixed place and a fixed size, and quiet: a mono eyebrow with the type and the
path; the canonical name; the tagline. Then the frontmatter as a two-column list with mono
keys; then each section as a mono eyebrow heading with its text; a table section as a table
whose resolving cells are links that refocus. *View file* — the path at the pinned commit on
GitHub, opened in the same tab like every link on this site — is pinned to the card's footer. When the root or a folder is focused the card is
not empty: one line says what is focused and how many pages it holds, read from the block.

**The stage, expanded.** An *Expand* control beside the path line opens the whole stage —
path, canvas and card — in a modal that fills the window, closed by its × button, Escape or
a click outside. It is the same stage moved, not a copy: clicks, links, the hash and
*recentre* keep working, and the graph re-fits to the larger canvas.

**Tokens.** Folder boxes outlined `--c-weak`; entity squares filled `--c-firm`; the focus, and
anything clickable on hover or focus, `--c-mid`; owns-lines solid; reference lines dashed in
`--c-mid` — every line drawn belongs to the focus. No `--c-flag`: nothing here is a
reversal. Mono for the path, folder names, field keys, eyebrows and the commit; prose for the
name, tagline and text.

**The library.** d3 v7, vendored as `example/d3.v7.min.js` from the pinned npm package —
`d3` in `devDependencies` — and loaded with a relative `<script src>`, so the page stays
self-contained and the share-card recipe hashes it as a drawn asset. `npm run test:example`
asserts the vendored file is byte-identical to the package's `dist/d3.min.js`, the way
`design.mjs` is held identical across the sites. The full build is ~280 KB; a custom bundle
would need a build step this repository does not have, and that was the trade taken.

---

## 5. Verification

- **`verify/check.mjs`** gains an `/example/` spec in the billing shape: `contains` for the
  title and the legend words; `links` for the tree-at-commit link; `sameTab` for the nav;
  `translates`; `card`; `tokens`, `monoScope`, `contrast`, `tokenVersion`; `internalLinks`;
  `sameOrigin: true` — the data is inline, the page requests nothing beyond its own files;
  `noNewTab: true`.
  Plus a page-specific `graph` check: after load the root is focused and its folders are the
  only other nodes; click a folder → it is the focus, the root its ancestor, its entities the
  children; click the first entity that has outgoing edges → the card names it, its
  reference targets are on the canvas with dashed lines, and the hash names it. Counts and names come from the data block the check reads out of the DOM,
  never from literals, so the check does not restate the example either.
- **Every other page's spec** gains the new nav item in `contains`/`sameTab` and its German in
  `translates.shows`.
- **`npm run example:check`** as in §2. **`npm run test:example`** (`node --test`, no
  dependencies beyond the vendored-file comparison) drives `build.mjs`'s parser against
  fixture instances, and asserts `example/d3.v7.min.js` equals the package's build: a valid one; one with
  a dangling reference, which must throw citing R4; one with a root folder that is not a
  plural; one whose local `HEAD` is not the pin.
- **`og-recipe.mjs`** gains the fourth card, `{ dir: "example", settle: "reduced-motion" }`,
  showing the stage with the root focused — the card region included, since it is part of the
  stage; `test:og` already fails on a card without an entry.
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
