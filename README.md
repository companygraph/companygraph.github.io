# CompanyGraph — Landing Page

The landing page for **CompanyGraph** — an open-source meta-model for operating a company: the
structure its knowledge takes, as a graph of Markdown files, so people and agents can both rely
on it.

**Live:** https://companygraph.io, once the domain is repointed at GitHub Pages. Until it
is, the site has no working URL at all — Pages redirects `companygraph.github.io` to the
custom domain the moment `CNAME` is on `main`, and the custom domain still answers from the
registrar. See `CLAUDE.md`.

This is the organisation's GitHub Pages site, which is why the repository is named
`companygraph.github.io`. That name matters: setting the custom domain here makes every other
Pages site in the org inherit it, so `companygraph/talks` will serve at
**companygraph.io/talks/** with no configuration of its own, the day that repository exists.

## Contents

- `index.html` — the page. One screen, self-contained: even the fonts are served from
  `fonts/`, referenced relatively so the file still works opened straight from disk.
- `logo.svg` — the mark, described below. Uses `currentColor`, so it inherits whatever colour
  it is placed in.
- `favicon.svg` — the same mark at a size that has to survive 16px.
- `avatar.svg` / `avatar.png` — the org avatar, 1024×1024, full-bleed square (GitHub rounds
  org avatars itself).
- `CNAME` — the custom domain.
- `og.png` — the page itself, rendered at 1200×630 for link previews. `export-og.mjs`
  regenerates it (`npm run og`): headless Chromium, reduced motion emulated, the figure hidden.
- `robots.txt`, `sitemap.xml` — one page, one URL.
- `verify/check.mjs` — this page's own assertions (title, language, the outbound link, the
  og card, that no internal path — attribute or CSS `url()` — is root-absolute).
- `verify/design.mjs` — the shared design-system assertions, copied in byte-identical from the
  sibling repositories. Never edit it here — see `CLAUDE.md`.
- `fonts/` — the four self-hosted `.woff2` files the page's `@font-face` rules point at.
- `package.json` / `package-lock.json` — `serve`, `verify`, `og` scripts; Playwright as the
  only dependency.

## The mark

An outlined square holding a filled one, with a line out to a second filled square: the
model's two kinds of edge, drawn once. **Containment** — an entity that owns collections is a
folder holding its own file — is the outlined square around the filled one. **Reference** — by
canonical name, to something nothing owns — is the line out to the square beside it. Nothing
else is in the glyph; a mark that needs a third element to make its point is not this one.

The hero figure animates two unlike trees toward that same shape — one small, one much
larger — because the shape is what both converge on, not a diagram either tree drew on its
own. The mark is where the animation lands; `logo.svg` and `favicon.svg` are that same
destination, held still.

## Running it

No build step.

```bash
npm install       # once, for Playwright
npm run serve     # → http://localhost:8000
npm run verify    # renders the served page and asserts the English DOM
npm run og        # regenerates og.png after any visual change
```

`verify` needs a server already running in another terminal (or `BASE=... npm run verify`
against a different one). It exits non-zero on any failure, so `all checks pass` is the bar.

It asserts the page as it first renders, which is English. **The language toggle is not
asserted at all** — misspell a `data-de` attribute, or delete the toggle's click listener
outright, and the suite still prints `all checks pass`. Adding that check is the obvious next
commit; until someone writes it, nothing here defends the German half of the page.

## What this page deliberately does not say

One screen, one job: say what CompanyGraph is and send the visitor to the model. No type
count, no type list, no status, no roadmap, no claim about packs, nothing identifying the
companies the model was extracted from, no service and no price — there is no hosted
anything. Every claim a reader could check lives in
[`companygraph/meta-model`](https://github.com/companygraph/meta-model) and this page links
to it rather than restating it. See `CLAUDE.md` for the reasons those constraints exist and
what has already gone wrong when a page like this one didn't hold them.
