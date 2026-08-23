# companygraph.io — working conventions

The site for CompanyGraph, the open-source meta-model for operating a company: one landing
page, nothing else yet. What the files are and what the mark means is in `README.md`; this
file is about the constraints that are easy to break.

## Build & verify

No build. `npm run serve` (`python3 -m http.server 8000`), then `npm run verify` in another
terminal — it renders the served page in headless Chromium and asserts against the DOM, not
the source.

**Verify by rendering, not by reading the diff.** Check both OS colour-scheme preferences and
at least a phone width. The page's own palette is fixed — it does not redraw for
`prefers-color-scheme: light` — but the browser's native chrome (scrollbar, form control,
selection colour) still follows the OS setting where the page states no opinion, and that gap
is invisible in a source diff; it only shows up in a rendered window.

## One screen, one job

The page says what CompanyGraph is and sends the visitor to `companygraph/meta-model`. That
is the whole scope of `index.html`, and the list of what it must never say is longer than what
it does say:

- **No type count and no type list.** The model ships five types today and a planned
  eighteen; it moves fast, so any number here is wrong within a release. That sentence
  belongs in the model's own `README`, which ships in the same commit as the type it counts —
  this repository has no way to know when that commit lands.
- **No status and no roadmap.** "The first release describes one person completely" is
  honest, but it is `meta-model`'s sentence, not this page's.
- **No claim about packs.**
- **Nothing identifying the source companies** the model was extracted from.
- **No service and no price.** There is no hosted anything, and nothing here should imply
  there might be.

This is not hypothetical caution: the sibling org's profile at `guestgraph/.github` once
advertised "Core in development" while two slices had shipped, because it restated a roadmap
that lived in another repository. No CI in *this* repository can catch drift in
`companygraph/meta-model` — the only defence is never restating anything that lives there.

## Constraints

- **The repository name is load-bearing.** `companygraph.github.io` makes this the org's
  Pages site, so the custom domain in `CNAME` cascades to every other Pages repository in the
  org — `companygraph/talks` will serve at `companygraph.io/talks/` with no configuration of
  its own, the day it exists. Renaming this repository or removing `CNAME` silently breaks
  that URL before anyone has a reason to look for it.

- **`companygraph.io` does not yet point at GitHub Pages.** The domain currently resolves
  elsewhere at the registrar; until the four Pages A records are added, the live site is
  `companygraph.github.io` and `CNAME` itself fails verification. Don't read that failure as
  a bug in this repository.

- **Self-contained. No external asset at all** — fonts are served from `fonts/`, referenced
  relatively (`fonts/…`, not `/fonts/…`). A root-absolute path works on the domain and breaks
  under `file://`, which is the one failure mode nobody opens a browser to find. `verify`
  asserts the same for every internal link.

- **The design tokens are a copy, fenced by `design tokens · vN` markers**, shared with
  sibling repositories (`blust.ch`, `guestgraph.io`, and its `talks` repo) that cannot import
  a stylesheet because a deck has to open from `file://` — there is nothing to `import` in
  that context. Bumping the version means editing the block and bumping the marker in every
  repository that carries it, then running every one of their suites. `npm run verify` will
  tell you if a page in *this* repository has fallen behind; it cannot tell you that a sibling
  has. The version marker is a habit with a tripwire, not a guarantee — it makes drift visible
  to a person who goes looking, not automatic.

- **`package-lock.json` is committed here, although the sibling ignores its own.** CI runs
  `npm ci`, which fails outright without a lockfile in the tree. `.gitignore` says so inline
  rather than leaving the asymmetry to be rediscovered.

- **The og card is rendered with `reducedMotion: "reduce"` emulated.** The figure animates in
  over a chain that finishes past a second; a render that merely waits "long enough" catches
  it mid-draw. The page's own `@media (prefers-reduced-motion: reduce)` block is what the card
  shows — emulating the preference renders that settled state exactly, instead of racing a
  timer.

- **`.figure` is hidden from the card for an editorial reason, not a spatial one — and the
  comment saying so has already been wrong twice, both times by claiming something about fit
  or cropping that a render then disproved.** The plan's original comment said the figure
  "runs the full page width and cannot fit a 1.9:1 crop" — true when it was written, false the
  moment a later task placed the figure beside the hero instead of under it. The first rewrite
  swapped in a different geometric claim — that hiding it was necessary because the figure
  "needs room the card does not have" and would "cut the two trees off" — and that was
  disproved by literally rendering the card *without* hiding `.figure`: it fit inside the crop
  fine. The comment now in `export-og.mjs` makes no claim about fit, cropping, or dimensions at
  all: the card's job is the headline and the call to action, the figure is the argument that
  leads there, and an argument doesn't survive being glanced at in a feed regardless of whether
  the crop has room for it. If you touch this comment again, keep it that way — a claim about
  geometry is a claim a future layout change can quietly falsify; a claim about what the card
  is *for* can't be.

- **The sitemap is flat, and that is a debt, not an oversight.** `sitemap.xml` lists this one
  page. The sibling's is an index because two repositories share its domain; this domain has
  only one, so an index pointing at a `/talks/sitemap.xml` that doesn't exist would 404. The
  day `companygraph/talks` ships, this file becomes an index too — do that then, not before;
  building it now would be exactly the kind of staleness this file's other rules exist to
  prevent.

- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API for setting an
  org avatar. Upload `avatar.png` at Organisation → Settings → Profile after regenerating it
  from `avatar.svg`.

- **When the talk ships**, the page gains a nav item and a second button — the header markup
  is already built so that this is an addition, not a redesign — and it inherits the sibling's
  one restated fact: the talk's length, quoted inline because a call to action needs it in the
  moment, not one click away. That obligation begins the day the talk repository exists, not
  now; do not pre-write a "talk coming soon" in the meantime, which is exactly the kind of
  status claim §3 above forbids.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
