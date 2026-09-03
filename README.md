# companygraph.io

The site for **CompanyGraph** — an open-source meta-model for operating a company: the
structure its knowledge takes, as a graph of Markdown files, so people and agents can both
rely on it.

**Live:** https://companygraph.io

One repository serves the whole domain. It was two — the talks had their own — and the split
cost more than it saved: the talks index copies this site's shell, header and footer, so every
nav change had to land in both repositories in the same breath, with no CI on either side able
to see the seam. They were merged, history and all, in August 2026.

| Path | |
|---|---|
| `/` | The landing page. One screen: what CompanyGraph is, and the way to the model. |
| `/talks/` | The talks index. |
| `/talks/intro/` | The introduction — English and German, narrated, with a PDF in each language. |
| `/model/` | The model's own vocabulary, drawn as the graph of what references what — one schema per type. |
| `/example/` | One instance of the model, drawn as the graph its own files form — generated, never written by hand. |
| `/billing/` | What would cost money, if anything ever does. |
| `/privacy/` | What this site collects, which is nothing. |

The repository is named `companygraph.github.io` because that makes it the organization's
GitHub Pages site, which is what puts it on the custom domain in `CNAME`. **Renaming it or
removing `CNAME` takes the whole domain down**, talks included.

A repository named `talks` in this organization would claim `companygraph.io/talks/` the
moment its Pages were enabled — shadowing the folder in this repository, which is how the old
split had to be unwound. Do not recreate one.

## Contents

- `index.html`, `billing/`, `privacy/` — the three prose pages, each self-contained.
- `talks/index.html` — the talks index, carrying this site's chrome so a visitor crossing into
  it meets no seam.
- `talks/intro/` — the deck: `index.html`, `audio/{en,de}/` — one narrated clip per slide and
  language — both PDFs, and `tts/generate.py`, which reads the deck's speaker notes as the
  single source for what is spoken. Its share card is rendered by the root `export-og.mjs`,
  with the other three.
- `fonts/` — four self-hosted `.woff2` files, and the only copy. Every page and the deck point
  at them relatively, so the deck still opens from `file://`.
- `stage.css`, `stage.js`, `d3.v7.min.js` — **the stage**: the figure, the card and the expand
  dialog that draw a page's data block. The one component two pages share, so they are three
  files at the root that each page links relatively (`../stage.css`, `../stage.js`,
  `../d3.v7.min.js`) rather than a copy inside each page. `stage.js` knows no name from either
  page: it reads whichever `<script type="application/json">` the page marks `data-stage`, and
  takes the folder for its source link from `#srclink`'s `data-src`. Edit them here and both
  pages get it. The vendored d3 is at the root for the same reason `fonts/` is — self-hosted,
  one copy, reached relatively — and `npm run test:example` asserts it is still the pinned
  package's build, byte for byte.
- `example/` and `model/` — `index.html` each, the two stage pages: their own prose and inline
  `<style>`, and the stage above linked in. One generator drives both from one pin —
  `build/build.mjs` writes each page's data block (or checks both still match, `--check`) by
  reading `meta-model/example` and `meta-model/core` at the commit `source.json` names;
  `build/instance.mjs` is the parser for both.
- `source.json` — the one pin for the site: a repo and a commit of `companygraph/meta-model`,
  the one thing the generated pages are allowed to name from the model.
- `logo.svg` — the mark, described below. `favicon.svg` is the same mark at a size that has to
  survive 16px. `avatar.svg` / `avatar.png` are the org avatar, 1024×1024, full-bleed square.
- `og.png`, `talks/og.png`, `talks/intro/og.png`, `model/og.png`, `example/og.png` — 1200×630 share cards, each
  rendered from the page it belongs to, and an `og.sha` beside each one: a hash of everything
  that went into the card, so `npm run og:check` can say whether it still shows its page.
  `og-recipe.mjs` defines what goes into a card, `export-og.mjs` renders all five and writes
  the stamps, and `og-check.mjs` reports which have drifted. `export-pdf.mjs`, alongside it at
  the root, renders the deck's two PDFs into `talks/intro/`.
- `CNAME`, `robots.txt`, `sitemap.xml` — the domain, and one flat list of every URL on it.
- `verify/check.mjs` — the suite, covering all seven pages in one run. Its shared page checks
  and `verify/design.mjs` come from `@robertblust/design`, imported by package specifier; edit
  them there, tag a release, and re-pin the tag in `package.json`. A `verify/design.mjs`
  created in this repo would never be resolved by that import, so editing one here does
  nothing — not even fail loudly.
- `docs/superpowers/` — the design and the plan behind the landing page and the talk.

## The mark

An outlined square holding a filled one, with a line out to a second filled square: the
model's two kinds of edge, drawn once. **Containment** — an entity that owns collections is a
folder holding its own file — is the outlined square around the filled one. **Reference** — by
canonical name, to something nothing owns — is the line out to the square beside it. Nothing
else is in the glyph; a mark that needs a third element to make its point is not this one.

The hero figure animates two unlike trees toward that same shape — one small, one much
larger — because that convergence is where the model came from, not a diagram either tree
drew on its own. The mark is where the animation lands; `logo.svg` and `favicon.svg` are that
same destination, held still.

## Running it

No build step.

```bash
npm install                        # once, for Playwright
npm run serve                      # → http://localhost:8000
npm run verify                     # renders every page and asserts the DOM
npm run og:check                   # do the five share cards still show their pages?
npm run test:og                    # the card check's own tests (node --test, no deps)
npm run og                         # re-renders all five share cards after a visual change
npm run example                    # writes both pages' data blocks from meta-model at the pin
npm run example:check              # fails if either block has drifted from source.json's commit

npm run pdf                        # both language PDFs
```

`og:check` needs no server and no browser — it re-derives each card's recipe and compares it
with the `og.sha` committed beside it, which is why CI runs it before `npm ci`. `npm run og`
needs no server either: it renders every card from `file://`, the same way the deck opens.
Commit each `og.png` with its `og.sha`, in the commit that moved the page.

`verify` needs a server already running in another terminal. It also runs against the live
site — `BASE=https://companygraph.io npm run verify` — which is worth doing after a deploy,
and is how a bug was once found that could not appear locally: a check rewrote the share
card's URL onto `location.origin`, which is only correct when the repository is the root of
its host.

Most checks read the page as it first renders, which is English. `translates` is the one that
clicks: it presses the language control, requires the German to be there and the English to be
gone, then presses it again and requires the page to come back exactly as it was. It runs last
because it is the only check that changes what the others read.

It was written by breaking the page three ways and watching it catch each: the toggle's click
listener deleted, an `<h1>`'s `data-de` misspelled, and `applyLang` stopped from setting
`document.documentElement.lang`. Before it existed, all three printed `all checks pass`.

`sameOrigin` guards the privacy page's central claim — that nothing is fetched from anywhere
else. A font link or an analytics tag is a request, not markup, so no other check here can
see one.

## What this site deliberately does not say

No type count, no type list, no status and no roadmap — those live in
[`companygraph/meta-model`](https://github.com/companygraph/meta-model), which ships them in
the same commit as the thing they describe. No claim that a pack exists. Nothing identifying
the companies the model was extracted from.

`/billing/` is the one place a commercial model is stated, and it states one that is not
running: consulting, time and material, no rate, nobody to ask, and it may never happen at
all. **The absent contact is deliberate** — adding one turns a described model into an offer.
Nothing anywhere may imply a hosted product, a license fee, a seat count or a paid edition of
the model; those are the four things the billing page rejects by name.

See `CLAUDE.md` for why each of those constraints exists, and what has already gone wrong when
a page like this one didn't hold them.
