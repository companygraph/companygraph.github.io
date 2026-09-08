# The dataset and the vocabulary — design

> `/example/` and `/model/` show data and say nothing about it. Each gains the structured
> data that names what it shows, and a committed artifact for a machine to fetch. The build
> splits in two so the pages are rendered from those artifacts rather than from the network.

Status: proposed. Decided on 2026-09-08 against measurements of this repository at `main`
and of `companygraph/meta-model` at `7f58f5e`, the commit `source.json` pins. Every number
below was counted, not estimated.

---

## 1. What is true today, measured

| Fact | Value |
|---|---|
| Scripts that build a page from the model | 1: `build/build.mjs`, 141 lines, two targets |
| Readers of the pinned commit | 1, `git/trees` plus the raw files, shared by both targets |
| Markdown parsers | 1: `parseInstance` and `parseSchemas` from `companygraph-meta-model` |
| Scripts that read a rendered page as their input | 0 |
| `/example/` block | 23,945 bytes; 24 entities of 9 types, a company called Beacon Systems |
| `/model/` block | 40,597 bytes; 9 entities, all of type `schema` |
| Pages carrying a JSON-LD graph | 7 |
| Node types across them | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, and on the home page `Person` and `SoftwareSourceCode` |
| Nodes describing what `/example/` or `/model/` shows | 0 |
| CI steps that check a page against the model | 1: `example:check`, after `npm ci` |

Two of those rows decide the work.

**Nothing in the graph says what these two pages show.** Both draw a model from a pinned
commit, and both describe themselves to a machine only as a `WebPage` — a page with a
breadcrumb, indistinguishable from the billing page. The data behind them is reachable only
by scraping a `<script>` out of rendered HTML, which is the thing a `Dataset` node exists to
make unnecessary.

**The two pages are not the same kind of thing, and one of them is not a dataset.**
`/example/` holds 24 entities across 9 types describing a company: an identity, two profiles,
five experiences, three skills, two values, a vision. `/model/` holds nine entities all of
one type, `schema`, each one a document stating the required structure of a file — `Experience
Schema`, "Required structure for experience files." Records about structure are not records
about a company, so describing both as a `Dataset` would claim something untrue of the second.

This repository does not have the duplication that motivated the same work on blust.ch. One
builder, one reader, one parser, and no script reads a rendered page. The reason to split the
build here is not to remove a copy; it is that generating a node per schema makes a page's
JSON-LD derived output, so a renderer has to exist regardless — and a renderer that reads a
committed artifact needs neither the network nor the parser, while one that refetches needs
both.

## 2. What was decided

**`/example/` gains a `Dataset`, because it is one.** It carries the name of the company it
describes rather than the name of the page, so a reader who meets the node outside this site
learns what the data is about.

```json
{
  "@type": "Dataset",
  "@id": "https://companygraph.io/example/#dataset",
  "name": "Beacon Systems — an example CompanyGraph instance",
  "description": "A fictional company described in CompanyGraph: its identity, profiles, experiences, skills, values and vision.",
  "url": "https://companygraph.io/example/",
  "license": "https://www.apache.org/licenses/LICENSE-2.0",
  "creator": { "@id": "https://companygraph.io/#organization" },
  "isBasedOn": "https://github.com/companygraph/meta-model",
  "distribution": {
    "@type": "DataDownload",
    "contentUrl": "https://companygraph.io/example.json",
    "encodingFormat": "application/json"
  }
}
```

The license is Apache 2.0 because that is what `companygraph/meta-model` carries, and it is
already the license this site claims on its `SoftwareSourceCode` node. Copying blust.ch's
CC-BY would have named a license this data is not under.

**`/model/` gains a `DefinedTermSet`, not a second `Dataset`.** Checked against schema.org on
2026-09-08: `DefinedTermSet` is `CreativeWork > DefinedTermSet`, its own properties are `about`
and `hasDefinedTerm`, and it has no `distribution` — that property belongs to `Dataset` alone
and `DataDownload` is the only type it accepts. `DefinedTermSet` inherits `encoding`, which
takes a `MediaObject`, so that is what carries the file. `DataDownload` is not used there
either: its own definition is "all or part of a Dataset in downloadable form", and this is not
a dataset.

```json
{
  "@type": "DefinedTermSet",
  "@id": "https://companygraph.io/model/#vocabulary",
  "name": "CompanyGraph core vocabulary",
  "description": "The schemas a company is described in: one per type, each stating the structure its files must carry and how they refer to one another.",
  "url": "https://companygraph.io/model/",
  "license": "https://www.apache.org/licenses/LICENSE-2.0",
  "creator": { "@id": "https://companygraph.io/#organization" },
  "encoding": {
    "@type": "MediaObject",
    "contentUrl": "https://companygraph.io/model.json",
    "encodingFormat": "application/json"
  },
  "hasDefinedTerm": [ … one per schema, generated … ]
}
```

**The terms are generated, and they keep the schema's own words.** A term set whose terms are
absent names a vocabulary without naming a word of it, so each schema becomes a `DefinedTerm`:

```json
{
  "@type": "DefinedTerm",
  "@id": "https://companygraph.io/model/#term-experience",
  "name": "Experience Schema",
  "description": "Required structure for experience files.",
  "termCode": "experience",
  "url": "https://github.com/companygraph/meta-model/blob/7f58f5e/core/experience.md",
  "inDefinedTermSet": { "@id": "https://companygraph.io/model/#vocabulary" }
}
```

`name` and `description` are the entity's `name` and `tagline` unchanged. The obvious
alternative is to strip the word Schema and call the term `Experience`, which reads better and
is a transformation the model never authorized; the page shows nine schemas, so the schemas are
the terms. `termCode` is the last segment of the entity's `id`, which is the machine name the
conventions already use, and `url` is built from `path`, `repo` and `commit` exactly as the
stage builds its own file links.

**The parse is written to `example.json` and `model.json` at the repository root, and both are
committed.** Two files rather than one, because each page's pointer must name a file holding
that page's data and not the other's. Committing them is the convention `WORKING.md` already
states: CI never writes what the repository commits, so generated files are built locally and
committed, and CI checks that the committed copy matches what would be built. Pretty-printed
at 34,127 and 64,349 bytes, so a re-pin shows in review as the fields that moved.

**Fetching and rendering become two layers, and only the first one talks to the network.**
`npm run build` resolves the pin, reads the files, parses them and writes the two artifacts;
it stays the only thing needing GitHub and the parser. `npm run pages` renders the artifacts
into four regions and needs neither, so the check that holds every derived region runs before
`npm ci`.

**`pages` refuses to run when an artifact names a commit other than the one `source.json`
pins.** An artifact that declares its own commit cannot be rendered stale, so the order of the
two commands is enforced by the data rather than remembered by a person.

## 3. The files

```
build/build.mjs       fetches, parses, writes example.json and model.json
build/pages.mjs       loads both artifacts, holds the pin guard, calls the renderers      new
build/block.mjs       renderer: the data block, for example/ and model/                   new
build/jsonld.mjs      renderer: the Dataset, the term set and its nine terms              new
```

There is no `read.mjs` here. That file exists on blust.ch because two scripts read the same
commit on two different endpoints and nothing held them together; this repository has one
reader and it stays where it is. Extracting it would be copying a fix for a problem this
repository does not have.

`build/build.mjs` keeps its `TARGETS` table, its `sub` folders, its reading of the pin and the
`finish` hook the model target uses to turn each edge's field name into the label the stage
draws. What it loses is the writing of pages: it writes two files and nothing else.

Each renderer exports one function taking both artifacts as `{ example, model }` and a check
flag, and returns the repository-relative paths that did not match, so a red check names the
page that drifted. Each renderer owns one kind of region across both pages rather than one page
across both kinds, which is why `block.mjs` writes two data blocks and `jsonld.mjs` writes two
graphs.

The JSON-LD renderer replaces the whole `<script type="application/ld+json">` block on each of
the two pages and preserves every node it does not own, the way blust.ch's does. The nodes it
does not own — `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` — come back byte-identical
because they carry no hand formatting; that is a property to verify in the plan, not to assume.

## 4. The commands

```
npm run build         network, parser    writes example.json and model.json
npm run build:check   network, parser    are the artifacts what the pin parses to?
npm run pages         pure               writes all four derived regions
npm run pages:check   pure               do the pages match the artifacts, at the pinned commit?
```

The four regions are the data block in `example/index.html` and `model/index.html`, and the
JSON-LD block in each of the same two pages. Re-pinning is `source.json`, then `npm run build`,
then `npm run pages`. `example` and `example:check` are removed; `pages` covers them, and a
half-run rebuild is what the removal prevents.

## 5. CI

`pages:check` moves above `npm ci`, where it can run because it imports nothing outside `node:`
and reads two committed files. `build:check` takes the place `example:check` held below
`npm ci`, because it is the part that imports the parser. The rest of the job is unchanged.

## 6. What this does not change

The two data blocks' bytes, so `stage.js`, the vendored d3 and both drawings are untouched.
The pin, the parser version, `pin:check`, the PDFs, and the `Organization`, `WebSite`,
`WebPage` and `BreadcrumbList` nodes on every page.

Two consequences to accept rather than avoid. The bytes of both pages change, so their share
cards report stale and are re-rendered and committed as part of the work — the recipe covers
the page, and a card that is not re-rendered fails `og:check` in CI. And both artifacts become
public URLs, which is the point: the design package's page checks fetch every on-site URL in a
graph and require HTTP 200, so `companygraph.io/example.json` and `/model.json` come under a
check that already exists.

One thing is deliberately out of scope. The within-site check proposed for
`robertblust/design` — a node is identical wherever its `@id` appears — is unaffected by this
work, because every node added here is page-specific: one `Dataset` on `/example/`, one term
set on `/model/`. It stays its own piece of work.

## 7. How it is verified

At the pinned commit, `npm run build && npm run pages` must leave every derived region
byte-identical except the two JSON-LD blocks, whose additions are the nodes section 2 names and
nothing else. In particular no `Organization`, `WebSite`, `WebPage` or `BreadcrumbList` line may
appear in the diff; one that does means the renderer is disturbing a node it does not own.

Then the share cards are re-rendered and `npm run verify` runs green, which is what proves both
artifacts are served: the graph check fetches every on-site URL it finds and requires 200.

Each check is then proved by breaking what it holds: an edited data block, an edited term, a
hand-typed `contentUrl`, and a `source.json` moved without `npm run build`. Each must fail
`pages:check` and name the file. `build:check` is proved by editing an artifact and confirming
it goes red against the unchanged pin.
