# companygraph/talks

Talks on [CompanyGraph](https://companygraph.io/), the open-source meta-model for operating
a company. Served at `companygraph.io/talks/` — the domain is served by two repositories:
this one for `/talks/`, and `companygraph.github.io` for everything else. See `CLAUDE.md` for
what that means for anyone changing the shared chrome.

## Files

```
package.json          serve + verify, playwright only
verify/design.mjs      the shared design-token assertions — byte-identical to every sibling
                        repository that carries this design system, never edited here
verify/check.mjs       this repo's page assertions; every page it names must exist
index.html              the talks index — companygraph.io's shell, header and footer verbatim
favicon.svg             copied from companygraph.github.io
fonts/*.woff2           four self-hosted faces, so the pages render the same from file://
og.png                  the index's share card
intro/                  the deck (added in a later task)
```

## Scripts

- `npm run serve` — serves the repository at `http://localhost:8000` with Python's built-in
  HTTP server, so relative paths and `fetch()` behave the way they do in production.
- `npm run verify` — renders every page in `verify/check.mjs`'s `PAGES` list with headless
  Chromium and asserts the DOM: fonts actually load, the design tokens match, mono stays
  data-only, contrast holds, internal links survive `file://`, and the language toggle round
  trips. Run `npm run serve` first, in the background or a second terminal.
- `npm run og` and `npm run pdf` — added under `intro/` once the deck exists, to export its
  share card and its two-language PDF.

## Development

```
npm install && npx playwright install chromium
npm run serve &
npm run verify
```

`npm run verify` must print `all checks pass` before any commit.
