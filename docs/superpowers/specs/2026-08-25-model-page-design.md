# The model page — design

> `companygraph.io/model/`: the meta-model's core vocabulary, drawn the way the example page
> draws an instance — every type a node, every `ref →` a line, generated from `meta-model/core`
> at the pinned commit.

Status: design agreed, nothing built.

## 1. Purpose and non-goals

The example page shows *an instance*. The model page shows *the vocabulary* an instance is
written in: the schemas in `core/`, and what references what. It sits in the nav before
Example — *Talks · Model · Example · Billing* — because a reader meets the model before an
instance of it. It is the same page family, the same stage, the same card; only the data and
the prose differ.

**Owns:**

- a generator that turns `meta-model/core` at the pinned commit into a data block of the same
  shape the example page uses (root, types, entities, edges)
- the page's prose — what a schema is, how to read a line between two
- the stage and card, shared with the example page rather than copied
- the same `check` discipline: the block is regenerated and compared in CI

**Non-goals:**

- restating the model in prose — no type list, no type count, no field list written by hand;
  the graph and the card show whatever `core/` contains at the pinned commit
- packs, or types the design names but `core/` does not yet contain
- a schema editor, search, or anything the tooling spec owns

The rule from the example page holds: nothing about the model is written by hand except the
root label, and that label is named as the invented string.

---

## 2. The generator

One pin for the site. `example/source.json` moves to `/source.json`; both pages are generated
from the same commit, and `npm run example` writes both blocks while `npm run example:check`
compares both. (The script names stay — CI and CLAUDE.md know them.)

**Reading `core/`.** A schema file is read by the same fixed shape as an entity: the H1 is the
canonical name (`Profile Schema`), the `>` line the tagline, `##` sections with text — and,
because the R9 fixed shape puts more than one table in `## Sections`, a section may hold
**several tables, each with the caption line that addresses it** (`` `## Skills` is a table
with these columns: ``). The parser's section gains `tables: [{ caption, columns, rows }]`;
`table` stays as the first of them for the example page's card.

**Entities.** One per schema file, in a single folder `core`, type `schema`:
`{ id: "core/profile", type: "schema", name: "Profile Schema", tagline, fields: {}, sections,
owner: null, path: "core/profile-schema.md" }`. The `**Owner:** profile` line, when present,
is kept as `fields.owner = "profile"`.

**Edges** come from the tables, and only from them:

- a row of the `## Frontmatter` table whose Type is `ref → <type>` or `array of ref → <type>`
  → edge `from` this schema `to core/<type>`, `via` the field name, `attrs: { type: <the Type
  cell> }`
- a row of a column table whose Type is `ref → <type>` → edge `via "<Section>.<Column>"`
- the `**Owner:**` line → edge `via "owner"` to the owning type's schema

A `ref → <type>` naming a type with no schema file is a generator error (R4, applied to the
vocabulary itself). The root label is `Core`, the one invented string, named as such.

**Block.** `<!-- model data · <commit> -->` … `<script type="application/json"
id="model-data">` … `<!-- /model data -->` in `model/index.html`, same markers pattern, same
check.

---

## 3. The page

The example page's skeleton, with its prose replaced:

- **Title:** *The model, drawn.* / *Das Modell, gezeichnet.* **Tagline:** the vocabulary a
  company is described in — one schema per type, drawn as the graph of what references what.
  **Note:** nothing here was written by hand: the page is generated from the model's `core/`
  at the commit named beside the figure.
- **The stage** (§4), full content width, the same caption rewritten for schemas: an
  outlined box is the folder the schemas live in, a filled square is a schema, a dashed line
  is a field that references another type, labelled with the field's name.
- **How to read it** — three paragraphs: a type is one schema file, named for the type, and
  its H1 is what everything references; a line between two schemas is a field typed `ref →`,
  so it can be checked, never a link that can break; a type that is owned says so with one
  line and nests inside its owner on disk.
- **Where it comes from** — `meta-model/core @ <short commit>` linking to the tree at that
  commit; one sentence that the design spec says why these types and not others. Link, not
  restate.
- Footer as every page's. `<title>` *Model — CompanyGraph*; descriptions in both languages;
  the share card rendered from the settled stage with the title block hidden, as the example
  card is.

---

## 4. The stage, shared

The example page's stage — path line, canvas, card, expand dialog, the d3 neighbourhood
layout — moves out of `example/index.html` into two files at the site root, `stage.css` and
`stage.js`, loaded relatively by both pages beside `d3.v7.min.js` (which moves to the root as
well). The share-card recipe hashes all three as drawn assets. Nothing in `stage.js` knows a
name from either data block; it is configured by the id of the block it reads and by the
four UI strings it owns, unchanged.

Two things the model page needs that the example page did not, both generic:

- **Edge labels.** A reference line may carry a label — the model page labels each line with
  the field name it comes from (`skills`, `Skills.Level`, `owner`, `source`). The example page
  passes no labels and looks as it does today.
- **Several tables in a section.** The card renders every table in a section, each under its
  caption, and a caption that names a section of the model (`` `## Skills` is a table with
  these columns: ``) stays mono, as data.

The card for a schema shows: eyebrow *schema · core/profile-schema.md*, the name, the tagline,
the `owner` field when present, then File Location (its code path in mono and its prose),
Frontmatter (the table, or the sentence *No YAML frontmatter.*), Sections (the sections table,
then each column table under its caption). *View file* pinned to the footer, as before.

Everything else — focus and context, ancestors to the left, children to the right, references
below and above, the fitted camera, ctrl/⌘+wheel zoom, keyboard, hash, reduced motion, the
expand dialog — is the same code and behaves the same.

---

## 5. Verification

- `verify/check.mjs` gains a `/model/` spec in the example page's shape, and the `graph`
  check takes its data-block id from the spec (`graph: "model-data"`) so one check serves both
  pages: root focused → its folder; folder → its schemas; the first schema with an outgoing
  edge → the card names it, its targets are on the canvas with dashed lines, the hash names
  it, the source link is pinned.
- Every other page's spec gains *Model* / *Modell* in nav strings; `sitemap.xml` gains the URL;
  `og-recipe.mjs` gains the fifth card with the title-block hide rule.
- `verify/instance.test.mjs` gains tests for several tables in one section with captions, for
  `parseSchemas` (entities, owner, `ref →` edges from both table kinds, the R4 error on an
  unknown type), and the d3 identity test follows the file's move.
- The example page must render exactly as before after the stage moves out — the existing
  `/example/` spec and `graph` check are the regression suite for the extraction.
- CI unchanged: `test:example`, `example:check`, `test:og`, `og:check`, then `verify`.

---

## 6. Decisions recorded

- **One pin, both pages.** Two pins would let the vocabulary and the instance disagree on the
  same site.
- **Shared `stage.js`/`stage.css`, not a copy.** The site's pages are otherwise self-contained
  single files; the stage is the one component two pages share, and a copy would drift the
  first time one page's figure was fixed. Relative files keep the pages self-contained in the
  sense the rule means — nothing off-origin.
- **`Core` as the root label.** The folder is `core`; the root is the vocabulary, not a
  company.
- **The `owner` line is an edge.** On disk the owned type nests inside its owner; in the
  vocabulary that relation is a line like any other, labelled `owner`.
