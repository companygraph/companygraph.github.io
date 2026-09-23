# companygraph.io

The site for **CompanyGraph** — an open-source meta-model for operating a company: the structure its knowledge takes, as a graph of Markdown files, so people and agents can both rely on it.

**Live:** https://companygraph.io

One repository serves the whole domain. It was two — the talks had their own — and the split cost more than it saved: the talks index copies this site's shell, header and footer, so every nav change had to land in both repositories in the same breath, with no CI on either side able to see the seam. They were merged, history and all, in August 2026.

| Path | |
| --- | --- |
| `/` | The landing page: what CompanyGraph is, and CompanyGraph's own model, drawn on the stage. |
| `/talks/` | The talks index. |
| `/talks/intro/` | The introduction — English and German, narrated, with a PDF in each language. |
| `/cli/` | The command line: one command opens a menu that makes a model, checks it, moves it to a newer release and installs the Obsidian plugin, and each entry is also a subcommand. First in the nav, by the owner's decision. |
| `/team/` | Who does CompanyGraph's work: one board per process, generated from `company.json` by the design package's `render/team`, each opening on the process's owner. |
| `/principles/` | CompanyGraph's vision and values, generated from its own model, `company.json`, by the design package's `render/principles`. |
| `/surfaces/` | Where CompanyGraph's model is published and what makes each place, generated from `company.json` by the design package's `render/surfaces`. |
| `/model/` | The model's own vocabulary, drawn as the graph of what references what — one schema per type. |
| `/example/` | One instance of the model, drawn as the graph its own files form — generated, never written by hand. |
| `/billing/` | What would cost money, if anything ever does. |
| `/privacy/` | What this site collects, which is nothing. |

The repository is named `companygraph.github.io` because that makes it the organization's GitHub Pages site, which is what puts it on the custom domain in `CNAME`. **Renaming it or removing `CNAME` takes the whole domain down**, talks included.

A repository named `talks` in this organization would claim `companygraph.io/talks/` the moment its Pages were enabled — shadowing the folder in this repository, which is how the old split had to be unwound. Do not recreate one.

## Contents

- `index.html`, `cli/`, `billing/`, `privacy/` — the prose pages, each its own markup and prose,
  linking `tokens.css`, `page.css` and `page.js` for the chrome and tokens they share with every
  other page in the family. The landing page also carries a stage, described with the stage
  pages below.
- `talks/index.html` — the talks index, carrying this site's chrome so a visitor crossing into
  it meets no seam.
- `talks/intro/` — the deck: `index.html`, linking `tokens.css` and `deck.css` and loading
  `deck.js` the same way a prose page loads its three, `audio/{en,de}/` — one narrated clip per
  slide and language — both PDFs, and `tts/generate.py`, which reads the deck's speaker notes as
  the single source for what is spoken. Its share card is rendered by the root `export-og.mjs`,
  with the other three. Nothing here requires the deck to open from `file://` any more — it is
  normally read served, like every other page — though it still does, checked rather than
  assumed.
- `tokens.css`, `page.css`, `page.js`, `deck.css`, `deck.js` — five whole files `npm run design`
  writes from `@robertblust/design` at the pinned tag: the tokens, the chrome and the runtime
  every prose page or the deck links and loads instead of carrying a fenced copy. Editing one
  here does nothing — the next `npm run design` overwrites it; change it in the package. See
  `AGENTS.md` for what still stays a fence and why.
- `fonts/` — four self-hosted `.woff2` files, and the only copy. Every page and the deck point
  at them relatively.
- `stage.css`, `stage.js`, `d3.v7.min.js` — **the stage**: the figure, the card and the expand
  dialog that draw the artifact a page names. The one component the stage pages share, so they
  are files at the root that each page links relatively (`stage.css` from the landing page,
  `../stage.css` from the others) rather than a copy inside each page. `stage.js` knows no name from either
  page: it fetches whichever `<link>` the page marks `data-stage`, and takes the folder for
  its source link from `#srclink`'s `data-src`. Edit them here and every
  stage page gets it. The vendored d3 is at the root for the same reason `fonts/` is — self-hosted,
  one copy, reached relatively — and `npm run test:d3` asserts it is still the pinned
  package's build, byte for byte.
- `team/` — `index.html`, the page shell around the boards `build/pages.mjs` writes from
  `company.json` with `@robertblust/design/render/team`, in the order it names. Its CSS is
  `page.css`'s now; `stage contract` and `model card` are the fences it still carries.
- `principles/` — `index.html`, the page shell around a region `build/pages.mjs` writes from
  `company.json` with `@robertblust/design/render/principles`. Its CSS is `page.css`'s now, and
  it carries no fence of its own.
- `surfaces/` — `index.html`, the page shell around the lineage `build/pages.mjs` writes from
  `company.json` with `@robertblust/design/render/surfaces`. Its CSS is `page.css`'s now;
  `stage contract` and `surfaces lineage` are the fences it still carries.
- `example/` and `model/` — `index.html` each, the stage pages beside the landing page: their
  own prose and inline `<style>`, the stage above linked in, and a preload link naming the
  artifact the stage draws. Two steps build what the stage pages draw — `build/build.mjs`
  writes `example.json` and `model.json` by reading `meta-model/example` and `meta-model/core`
  at the `meta-model` pin, and `company.json`, drawn on the landing page, by reading
  `companygraph/mental-model`'s `model/` against its vendored `meta/core/` at the
  `mental-model` pin (or checks each still matches, `--check`); `build/pages.mjs` renders each
  artifact's JSON-LD graph into its page (or checks each still matches, `--check`), touching
  neither the network nor the parser.
- `source.json` — the site's pins, by name: `meta-model`, a commit of `companygraph/meta-model`
  for the vocabulary and the example, and `mental-model`, a commit of
  `companygraph/mental-model` for CompanyGraph's own model. They are the one thing the
  generated pages are allowed to name from a model, and `npm run pin:check` reports how far
  each is behind.
- `logo.svg` — the mark, described below. `favicon.svg` is the same mark at a size that has to
  survive 16px. `avatar.svg` / `avatar.png` are the org avatar, 1024×1024, full-bleed square.
- `og.png`, `talks/og.png`, `talks/intro/og.png`, `model/og.png`, `example/og.png`,
  `billing/og.png`, `privacy/og.png`, `cli/og.png`, `principles/og.png`, `team/og.png`, `surfaces/og.png` — 1200×630 share cards, each
  rendered from the page it belongs to, and an `og.sha` beside each one: a hash of everything
  that went into the card, so `npm run og:check` can say whether it still shows its page.
  `og-recipe.mjs` defines what goes into a card, `export-og.mjs` renders every one and writes
  the stamps, and `og-check.mjs` reports which have drifted. `export-pdf.mjs`, alongside it at
  the root, renders the deck's two PDFs into `talks/intro/`.
- `CNAME`, `robots.txt`, `sitemap.xml` — the domain, and one flat list of every URL on it.
- `verify/check.mjs` — the suite, covering every page in one run. Its shared page checks
  and `verify/design.mjs` come from `@robertblust/design`, imported by package specifier; edit
  them there, tag a release, and re-pin the tag in `package.json`. A `verify/design.mjs`
  created in this repo would never be resolved by that import, so editing one here does
  nothing — not even fail loudly.
- `docs/superpowers/` — the design and the plan behind the landing page and the talk.

## The mark

An outlined square holding a filled one, with a line out to a second filled square: the model's two kinds of edge, drawn once. **Containment** — an entity that owns collections is a folder holding its own file — is the outlined square around the filled one. **Reference** — by canonical name, to something nothing owns — is the line out to the square beside it. Nothing else is in the glyph; a mark that needs a third element to make its point is not this one.

`logo.svg` and `favicon.svg` are the mark at the two sizes it has to survive.

## Running it

No build step.

```bash
npm install                        # once, for Playwright
npm run serve                      # → http://localhost:8000
npm run verify                     # renders every page and asserts the DOM
npm run og:check                   # do the share cards still show their pages?
npm run test:og                    # the card check's own tests (node --test, no deps)
npm run og                         # re-renders every share card after a visual change
npm run build                      # writes example.json, model.json and company.json from their pins
npm run build:check                # fails if any artifact has drifted from its pin's commit
npm run pages                      # renders each page's JSON-LD graph from its artifact
npm run pages:check                # fails if any graph has drifted from its artifact
npm run sitemap                    # date each sitemap URL from its page's last commit — run before committing a page
npm run sitemap:check              # are those dates still what git says?

npm run pdf                        # both language PDFs
```

`example.json` and `model.json` are committed files, and moving the pin means `npm run build` then `npm run pages`.

`og:check` needs no server and no browser — it re-derives each card's recipe and compares it with the `og.sha` committed beside it, which is why CI runs it before `npm ci`. `npm run og` does need one: the shared exporter in `@robertblust/design` serves this repository's root on a free port and renders every card, the deck's included, from that address, because a stage page's card has to fetch its data the same way a visitor's browser would. Commit each `og.png` with its `og.sha`, in the commit that moved the page.

`verify` needs a server already running in another terminal. It also runs against the live site — `BASE=https://companygraph.io npm run verify` — which is worth doing after a deploy, and is how a bug was once found that could not appear locally: a check rewrote the share card's URL onto `location.origin`, which is only correct when the repository is the root of its host.

Most checks read the page as it first renders, which is English. `translates` is the one that clicks: it presses DE, requires the German to be there and the English to be gone, then presses EN and requires the page to come back exactly as it was. It runs last among the shared checks because it is the only one that changes what the others read. It was written here and now lives in `@robertblust/design` with the other shared checks, so blust.ch and guestgraph.io run the same code; what stays here is each page's spec.

It was written by breaking the page three ways and watching it catch each: the toggle's click listener deleted, an `<h1>`'s `data-de` misspelled, and `applyLang` stopped from setting `document.documentElement.lang`. Before it existed, all three printed `all checks pass`.

`sameOrigin` guards the privacy page's central claim — that nothing is fetched from anywhere else. A font link or an analytics tag is a request, not markup, so no other check here can see one.

## What this site deliberately does not say

No type count, no type list, no status and no roadmap — those live in [`companygraph/meta-model`](https://github.com/companygraph/meta-model), which ships them in the same commit as the thing they describe. No claim that a pack exists. Nothing identifying the companies the model was extracted from.

`/billing/` is the one place a commercial model is stated, and it states one that is not running: consulting, time and material, no rate, nobody to ask, and it may never happen at all. **The absent contact is deliberate** — adding one turns a described model into an offer. Nothing anywhere may imply a hosted product, a license fee, a seat count or a paid edition of the model; those are the four things the billing page rejects by name.

See `AGENTS.md` for why each of those constraints exists, and what has already gone wrong when a page like this one didn't hold them.
