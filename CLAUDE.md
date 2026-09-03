# companygraph.io — working conventions

The site for CompanyGraph, the open-source meta-model for operating a company: the landing
page, the billing and privacy notes, and the talks at `/talks/`. What the files are and what the mark means is in `README.md`; this
file is about the constraints that are easy to break.

## Build & verify

No build. `npm run serve` (`python3 -m http.server 8000`), then `npm run verify` in another
terminal — it renders the served page in headless Chromium and asserts against the DOM, not
the source.

**Verify by rendering, not by reading the diff.** Check both OS color-scheme preferences and
at least a phone width. The page's own palette is fixed — it does not redraw for
`prefers-color-scheme: light` — but the browser's native chrome (scrollbar, form control,
selection color) still follows the OS setting where the page states no opinion, and that gap
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
- **No claim about packs.** The model's own spec admits the pack mechanism ships as prose
  with nothing yet demonstrating it — so this page must not advertise a mechanism the model
  has not earned by shipping one.
- **Nothing identifying the source companies** the model was extracted from.
- **No hosted service, no rate, and no offer.** `/billing/` describes a model that *would*
  be billed — consulting, time and material — and says plainly that nothing is sold today
  and may never be: whether this becomes consulting at all is one of the things being
  validated. Keep it in that mood. The page must go on saying that the model and its tooling
  are free forever, that nothing is running, that there is no rate, and that there is nobody
  to ask — **the absent contact is deliberate, not an oversight**, and adding one turns a
  stated model into an offer. Nothing on this site may imply a hosted product, a license fee,
  a seat count or a paid edition of the model — the four things the billing page rejects by
  name.

This is not hypothetical caution: the sibling org's profile at `guestgraph/.github` once
advertised "Core in development" while two slices had shipped, because it restated a roadmap
that lived in another repository. No CI in *this* repository can catch drift in
`companygraph/meta-model` — the only defence is never restating anything that lives there.

- **The two stage pages are the one mechanical exception:** `/example/` and `/model/` each
  carry a data block generated from `meta-model` at the commit in `source.json` — the example
  from `example/`, the model from `core/`, one pin for both — and `npm run example:check`
  fails when either drifts. Nothing else on the example page names anything from the example,
  and nothing else on the model page names anything from the model.

## Constraints

- **Everything lives in `.shell`** — `max-width:1180px; margin:0 auto; padding:0 7vw` — and the
  header, the main content and the footer each get their own. That is what makes them line up
  on the same two edges at every width, and it is the sibling sites' container verbatim. Without
  the cap the content spreads to the viewport edge on a wide screen, and the language control
  ends up against the browser frame where it reads as chrome rather than as part of the page.
  Removing the cap from any one of the three is the failure mode: two of them still agree and
  the third looks like a bug nobody can name.
- **The language control is a nav item, not a floating badge.** It sits in `<nav>` beside the
  links, because it belongs with the other things you can do to the page rather than on top of
  the page. The nav is empty of links until the talk ships; it exists anyway to hold this.
- **The footer is set in mono because every item in it is data** — a URL, a license identifier,
  a name that is really a link. `monoScope` deliberately does not reach the footer, so nothing
  will stop you putting prose there; do not.

- **The repository name is load-bearing.** `companygraph.github.io` makes this the org's
  Pages site, which is what puts it on the custom domain in `CNAME`. Renaming it or removing
  `CNAME` takes the whole domain down — every page here, the talks included.

- **`companygraph.io` answers on nine DNS records, and all nine matter.** The domain is live
  and pointed at GitHub Pages:

  ```
  A     @     185.199.108.153  185.199.109.153  185.199.110.153  185.199.111.153
  AAAA  @     2606:50c0:8000::153  2606:50c0:8001::153  2606:50c0:8002::153  2606:50c0:8003::153
  CNAME www   companygraph.github.io.
  ```

  **The four AAAA records are not optional garnish.** This entry said "the four Pages A
  records" until someone checked `guestgraph.io`, which answers on all four AAAA records — as
  does `companygraph.github.io` itself. Follow that wording and the domain ships v4-only while
  its own Pages host is dual-stack: invisible to anyone on a v4 connection, and untestable
  from inside this repository.

  If the records are ever removed, there is **no fallback URL**. Pages 301-redirects
  `companygraph.github.io` to the custom domain while `CNAME` is on `main`, so both URLs die
  together, and `og:url` and `og:image` name the dead host — every shared link unfurls blank.


- **Self-contained. No external asset at all** — fonts are served from `fonts/`, referenced
  relatively (`fonts/…`, not `/fonts/…`). A root-absolute path works on the domain and breaks
  under `file://`, which is the one failure mode nobody opens a browser to find. `verify`
  asserts the same for every internal path the rendered page carries — the `href`/`src`
  attributes *and* the `url()`s inside the page's own stylesheet. The second half is not
  padding: a CSS `url()` is not an element attribute, so a query over elements cannot see the
  `@font-face` rules at all, and a root-absolute font path still loads perfectly from a served
  copy. That gap was found by making all four rules root-absolute and watching the suite pass.

- **The stage is the one component two pages share, and it is a file, not a copy.**
  `stage.css`, `stage.js` and `d3.v7.min.js` sit at the root and every page that draws a data
  block links all three relatively — `../stage.css`, `../stage.js`, `../d3.v7.min.js` — which
  keeps each page self-contained in the sense the rule above means: nothing off-origin, and it
  still opens from `file://`. `stage.js` and `stage.css` are now generated from
  `@robertblust/design`, not edited directly: edit them there, tag a release, then run
  `npm run design && npm run og` here — that is what "one place" means now. Taking
  `"stage"` out of this repository's `design.config.json` would also clear a red
  `design:check`, but that is not a build fix; it is this site deciding to own the file and
  diverge, a real decision and not the correct way to make the check pass. Every
  other page here is a single self-contained file and stays that way; this is the deliberate
  exception, because a copied stage drifts the first time one page's figure is fixed and
  nothing in this repository can see the two halves disagree. `stage.js` knows no name from
  either page — it reads whichever `<script type="application/json">` carries `data-stage`
  (`build/build.mjs` writes that attribute into every block it generates) and takes its
  source link's folder from `#srclink`'s `data-src`. **And the og recipe hashes all three as
  drawn assets of every page that links them**, so touching the stage marks each of those
  cards stale — `npm run og` and commit the `og.png`/`og.sha` pair with the change, the same
  as for a font.

- **The design tokens are a copy, fenced by `design tokens · vN` markers**, shared with
  `blust.ch` and `guestgraph.io`, which cannot import a stylesheet because a deck has to open
  from `file://` — there is nothing to `import` in that context.

  **They are generated now, and this bullet used to say the opposite.** It said bumping the
  version means editing the block in every repository that carries it and running every suite —
  a habit with a tripwire rather than a guarantee. Six blocks now come from
  `@robertblust/design`, pinned here by tag: `design tokens`, `header contract`,
  `stage contract`, `language`, `prose reset` and `prose footer`. Editing one in place does
  nothing; the next `npm run design` overwrites it. Change it in the package, tag a release, then
  run `npm run design && npm run og` here. `npm run design:check` runs in CI before the browser
  suite, so a page that drifts from the pinned release goes red without anyone going looking —
  which is the guarantee the habit never was. The deck footer and the `<head>` contract are still
  hand-maintained copies; for those two the old discipline applies in full.

- **`package-lock.json` is committed here, although the sibling ignores its own.** CI will
  run `npm ci`, which fails outright without a lockfile in the tree — the workflow itself
  doesn't exist yet (Task 7 adds it), but the lockfile is committed now so that landing it
  later is not also a scramble to unignore a file. `.gitignore` says so inline rather than
  leaving the asymmetry to be rediscovered.

- **The og card is rendered with `reducedMotion: "reduce"` emulated.** The figure animates in
  over a chain that finishes past a second; a render that merely waits "long enough" catches
  it mid-draw. The page's own `@media (prefers-reduced-motion: reduce)` block is what the card
  shows — emulating the preference renders that settled state exactly, instead of racing a
  timer.

- **The card's declared size must keep matching the file.** `og:image:width`/`height` say
  1200×630; if a regenerated `og.png` ever comes out a different size and the tags aren't
  updated to match, every platform that trusts the tags renders it letterboxed or cropped —
  and nothing on the page itself reveals that, because the page never displays its own card.
  You find out from a link someone else shared, which is the worst possible way to find out.
  `verify/check.mjs`'s `card()` check exists specifically to catch this, and it does: it
  fetches the card the tags name and reads the real width and height out of the PNG's IHDR
  header, so a card whose pixels disagree with its tags fails, and so does one that cannot be
  fetched at all. What it cannot see is *what the card shows*. A card of the right size,
  rendered from a page three commits ago, passes every assertion here — that is what
  `npm run og:check` is for, and why the two run together. After `npm run og`, look at the
  file: neither check can tell you the picture is the right picture.

- **`.figure` is hidden from the card for an editorial reason, not a spatial one — and the
  comment saying so has already been wrong twice, both times by claiming something about fit
  or cropping that a render then disproved.** The plan's original comment said the figure
  "runs the full page width and cannot fit a 1.9:1 crop" — true when it was written, false the
  moment a later task placed the figure beside the hero instead of under it. The first rewrite
  swapped in a different geometric claim — that hiding it was necessary because the figure
  "needs room the card does not have" and would "cut the two trees off" — and that was
  disproved by literally rendering the card *without* hiding `.figure`: it fit inside the crop
  fine. The comment now sits beside `HOME_HIDE` in `og-recipe.mjs`, which is where the rule
  itself moved, and it makes no claim about fit, cropping, or dimensions at
  all: the card's job is the headline and the call to action, the figure is the argument that
  leads there, and an argument doesn't survive being glanced at in a feed regardless of whether
  the crop has room for it. If you touch this comment again, keep it that way — a claim about
  geometry is a claim a future layout change can quietly falsify; a claim about what the card
  is *for* can't be.

- **The sitemap is flat, and stays flat.** It listed one page and carried a note saying it
  would become an index the day `companygraph/talks` shipped, because two repositories were
  going to share this domain. They no longer do: the talks live here, so one file lists every
  URL and there is no second copy to drift.


- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API for setting an
  org avatar. Upload `avatar.png` at Organisation → Settings → Profile after regenerating it
  from `avatar.svg`.

- **When the talk ships**, the page gains a nav item and a second button — the header markup
  is already built so that this is an addition, not a redesign — and it inherits the sibling's
  one restated fact: the talk's length, quoted inline because a call to action needs it in the
  moment, not one click away. That obligation begins the day the talk repository exists, not
  now; do not pre-write a "talk coming soon" in the meantime, which is exactly the kind of
  status claim §3 above forbids.

## The header is a contract, and its copy carries a version

The row across the top — wordmark, links, language control — is one design on three sites,
and like the tokens it is a copy, because a deck opens from `file://` and there is no
stylesheet to share. It is fenced in every page as `header contract · vN` and is
**byte-identical on all sixteen pages** in the three repositories. It is generated, like the
tokens: change it in `robertblust/design`, tag a release, then run `npm run design` here. Editing
it in this file does nothing — the next sync overwrites it.

What the contract says:

- **Order.** Ideas, Principles, Model, Example, Talks, Billing, Privacy, then the language
  control. A site skips what it does not have and reorders nothing. Read right to left, the
  switcher is at the edge and each step left is more the site's own subject.
- **One baseline.** A single line runs through the middle of every text in the row. The
  links carry equal space above and below: the hover underline hangs below the word, and
  centring the boxes instead would ride the text high — which it did, by 5px, until the
  language control sat next to it and made it visible.
- **States are different things.** Hover is an underline and nothing else. The current page
  is brighter ink and carries no line. When both drew the same line, the page you were on
  read as permanently hovered.
- **The wordmark never breaks.** It is `white-space:nowrap` and does not shrink. This one
  sits *outside* the fence, because each site's mark has its own colours; the rule is the
  outcome, not the declaration, and `mobileNav` asserts it.
- **Under 640px the links collapse behind a button.** The language control stays on the bar
  — two characters, reached for constantly by a bilingual audience, and one a visitor
  cannot find costs more than the tap it saves. The button sits to its left, so the order
  still reads. The links are *wrapped*, not duplicated: one list presented two ways, so
  there is no second copy to drift.

`navOrder`, `headerBaseline` and `mobileNav` assert all of it, per repository. What they
cannot do is see a sibling — that is the whole reason the block carries a version. Before
this was written down there were five different mobile behaviours across the family and
eight different wordings of the same CSS, and nothing failed anywhere.

## Share cards go stale silently, and nothing on the page says so

The five `og.png` files are not banners someone drew: `npm run og` renders each from the page
it belongs to — the landing card is the landing page, the talks card is the talks index, the
deck's card is its title slide, and the model and example cards are those two pages — so a
link preview shows what the visitor is about to land on.
The cost is a copy that has to be re-rendered whenever the page moves, and nothing about a
stale card looks wrong: it is a valid PNG of the site as it read some commits ago, and every
other check here passes the whole time it is wrong.

- **`npm run og:check` compares the recipe, never the pixels.** Two machines rasterise the same
  text differently, so a card compared by its bytes reports which machine rendered it. The
  check re-derives a hash of what went *into* the card and compares it with the `og.sha`
  committed beside it. It renders nothing and needs no browser and no server, so CI runs it
  before `npx playwright install` — but after `npm ci`, because it now imports the shared
  harness. Ordered before `npm ci`, as it used to be, every push fails with
  `ERR_MODULE_NOT_FOUND`, and no local run can catch that: `node_modules` exists here.
- **The recipe is the page, plus every local file the page *draws*, plus the exporter's own
  frame.** Fonts and images count: a font swap changes every card while no HTML changes at all.
  Because `fonts/` is one copy at the root and every page reaches it relatively, perturbing a
  font here marks **all five** cards stale — the sibling repositories, whose decks carry their
  own `fonts/`, isolate theirs, and this repository deliberately does not.
- **An `<a href>` is skipped: a link names somewhere to go, not something to draw.** The talks
  index is why the exception exists — it links both multi-megabyte deck PDFs, so hashing link
  targets reported that card stale on every `npm run pdf`, over a page that had not moved a
  pixel. `<link>`, `<img>` and `url()` in the inline CSS all still count. The rule now lives in
  the package and its comment is written for the family rather than for this repository: every
  site here has a talks index that links a deck, so the case was never local to this one.
- **The walk consumes quoted spans whole**, so a `>` inside an attribute value cannot end a tag
  early and silently drop every reference after it. The deck keeps prose in `data-notes`, where
  that character is ordinary.
- **`og-recipe.mjs` holds the frame, the hide rules and the card list, and nothing else does.**
  This is the point of the module, not tidiness. A second copy of a knob is a knob that can be
  edited without the hash moving — a card reported current after the thing that renders it
  changed, which is the one failure the whole mechanism exists to make impossible. It is also
  what makes the module importable by a test: an exporter that renders on import cannot be.
- **The knobs are local; the machinery is not.** `og-recipe.mjs` is one file of data that binds
  `@robertblust/design/cards/recipe` to this repository's root, and `export-og.mjs`,
  `og-check.mjs` and `verify/og-recipe.test.mjs` are each a handful of lines over
  `cards/export`, `cards/check` and `cards/recipe-tests`. The three sites each kept their own
  copy of all four files and the copies drifted: three source walks with three different sets
  of rules, and three test suites of 29, 30 and 30 tests with no one of them a superset of
  another — so a case one site had proven was a case the other two only happened to satisfy.
  The shared harness is the *union*, never the intersection; the site keeps exactly what only
  the site can know. `root` is passed in rather than derived, because a module that works out
  where it is from its own location points inside `node_modules` once it ships as a dependency.
- **One exporter, one crop, and no server.** `npm run og` renders all five cards from
  `file://` — the same way the deck opens — because every page here references its assets
  relatively. The landing card was once cropped a pixel higher than the other two; that was an
  accident of a separate exporter, not a choice, and there is now one constant. The shared
  exporter awaits `document.fonts.ready` on *every* card. This repository used to await it only
  in the `reduced-motion` branch, which made it the settle mechanism rather than a font guard
  and left the two `wait:900` deck cards racing font loading against a timer — a card rendered
  in the fallback face is a silent failure: nothing errors, and the type is simply not the type
  the page declares.
- **Both files are committed together** — `og.png` and the `og.sha` beside it, in the same
  commit as the page that moved. The stamp is written after the screenshot, so an exporter that
  dies half way leaves the card reported stale rather than reported current.
- **It over-reports and never under-reports, deliberately.** Editing a comment in a page marks
  its card stale even though the render would be identical. Clearing that is `npm run og` and a
  commit — cheap, and the opposite error is a card nobody notices for days.
- **`npm run test:og` is the check's own suite** (`node --test`). It drives the recipe against
  fixture trees rather than against this site, so it still means something after these pages
  change. A card added to the repository without an entry in `og-recipe.mjs` fails it —
  otherwise the check would keep printing ✓ for the others while the new one drifted. The
  assertions are the family's, so this site now gates on cases it never wrote itself.

## The head is a contract, and `seo` is what holds it

Canonical, description, the `og:` block, `twitter:card` and a JSON-LD graph, on every page.
`verify`'s `seo` check asserts the lot. Three of its assertions exist because the thing they
catch had already shipped green:

- **The canonical is compared against the page's own URL**, not merely against `og:url`.
  Agreeing with `og:url` proves two tags say the same thing, and both can say the same wrong
  thing — a canonical pointing at another page removes this one from the index and hands its
  signals over, silently, which is worse than any tag being absent.
- **Every page points at its own share card.** `card` only asks whether the image resolves at
  its declared size, and a borrowed card does. `/billing/` and `/privacy/` both advertised the landing
  page's card, so a paste of either URL previewed the landing hero under the pasted title.
- **Structured data has to resolve, not merely parse.** Every `@id` a page references must be
  defined on that page — Google reads `@graph` within one document — and every same-origin URL
  in the graph is fetched. `/billing/`, `/privacy/` and `/example/` each declared `isPartOf` a `#website` node no page
  carried.

Two traps worth knowing before editing that check:

- **`page.evaluate` runs in the browser, where `SITE` does not exist**, and it takes exactly
  one argument. Both mistakes were made writing it. Pass `{ url, site }` as an object.
- **Deriving the public origin from `BASE` makes the check vacuous off the default port.** It
  used to rewrite the literal `http://localhost:8000`; run with `127.0.0.1` and the URL filter
  matched nothing, so every graph URL was skipped and the check still printed ✓. Use the `SITE`
  constant.

`PAGES` is the single list: the sitemap's expected URLs derive from it, and the suite fails if
any page lacks `seo: true` — the runner skips a check whose key is undefined, so deleting that
one line would otherwise turn the contract off in silence. The suite also asserts that whatever
is on `BASE` is actually this site: a sibling repository left serving on `:8000` produced a full
run of failures belonging to a site nobody was testing.

**`/favicon.svg` is checked too, separately, by fetch — not by rendering a page.** It is the one
place the mark lives outside a page, so no DOM check can reach it: it cannot `@font-face`
anything and inherits nothing, so every face it names has to be a platform face already in
`SYSTEM_FACES` or a generic keyword. This mark carries no text at all, so today it names no
`font-family` and the check has nothing to reject — it passes on the HTTP 200 alone, not because
a named face was verified against the list. That changes the day lettering is added to it; until
then, a green check here says less than it will later.

**`og:locale` is Open Graph only. No search engine reads it.** It is `en_US`, with
`og:locale:alternate` `de_CH`, and the prose is American to match. Google reads `<html lang>`,
which `sourceLang` fetches cold on every page — `lang` alone cannot, because it reads
`documentElement.lang` after `applyLang()` has already corrected it.

**No `hreflang`.** It names another address for the other language and there is none: one URL
per page, German swapped in at runtime from `data-de`. It becomes correct the day `/de/` URLs
ship, and not before.

**The head contract is a third copy**, shared with `blust.ch` and `guestgraph.io` and
carrying no `· vN` tripwire, unlike the token block and the deck footer. Port changes by hand
to all three.

**The landing page is the one that drifts.** It shipped with no head at all after a rework —
no canonical, no description, no structured data — and later with an `id="metadesc"` that
nothing acted on, so a German visitor read an English title under `lang="de"`. Its
`translates` spec now declares the German title and description, which is what makes that
second failure impossible to reintroduce quietly.

**`/example/`'s entity data is fetched from `companygraph/meta-model` at a pinned commit.**
Nothing in it is editable here: `npm run example` would overwrite the edit and `example:check`
guards the pin, so a change to what a node shows is a change upstream and a re-pin.

This paragraph used to name three British spellings the example data carried — they surfaced
when a node was clicked — and say the fix belonged upstream. It did, and it took a while to get
there: core 0.13.0 made American English a rule (R14) and renamed `organisation`, and 0.13.1
caught the two the sweep had missed, because R14 binds an instance's content and the reference
example is instance content. What the note got right was refusing the local fix; what it could
not do was make the upstream one happen.

## CI

- **`.github/workflows/ci.yml` runs the suite on push to `main` and on every pull request** —
  the same `npm run verify` above, just run by something other than a person remembering to.
- **The job is named `verify` because the status-check context a branch ruleset requires is
  the job id, not the workflow name.** Rename the job and the ruleset keeps requiring the old
  name, which will never report again — the branch looks protected and silently isn't.
- **The suite drives a real browser against a served page, so the job has to serve one.** It
  checks out, installs Node with the npm cache, `npm ci` (the reason `package-lock.json` is
  committed above), installs Chromium with its system dependencies, starts
  `python3 -m http.server 8000` in the background, waits for it to answer, and only then runs
  `npm run verify`. The job carries `timeout-minutes: 10`, because the two ways of hanging it
  below are not hypothetical and the default is six hours, and `permissions: contents: read`,
  because checking out and running a browser is the whole of what it does. Started in the
  foreground, the server step never returns and the job hangs until it times out. **Backgrounded without redirecting its output, it hangs the job the same
  way** — a backgrounded process keeps the step's log pipe open, and the runner waits on a
  descriptor that never closes, so the step's output must be redirected away from that pipe
  (`> /dev/null 2>&1 &`), not just sent to the background. `npm run og` never runs here — it
  would regenerate and overwrite the committed cards.
- **`npm run test:og` and `npm run og:check` run before `npm ci`**, because neither installs or
  renders anything, and a stale share card is the one failure the browser suite cannot see: the
  card is a valid PNG of a page that has since moved on. They are the cheapest steps in the job
  and they fail fastest.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- **Merge a pull request with a merge commit — `gh pr merge --merge`, never `--squash`.**
  Squashing is not a history preference here. GitHub *re-authors* a squash commit to the
  account that pressed the button, so a commit made locally under the wrong `user.email`
  lands on the default branch looking correct. That is not hypothetical: it was found in
  `robertblust.github.io`, where the local commit was authored `rob@likemagic.tech` and the
  commit that reached `main` read `robert.blust@flatland.ch`, with nothing anywhere saying
  so. A merge commit preserves the author it was given, which is the point — a wrong
  identity surfaces instead of being laundered.
- **The author is `robert.blust@flatland.ch`, and nothing on GitHub enforces it.** The
  ruleset rule that would — `commit_author_email_pattern`, a metadata restriction — is
  rejected on this plan. Tested, not assumed: an otherwise identical ruleset carrying a
  `deletion` rule was accepted in the same breath. So the identity comes from
  `~/.gitconfig`, where three `includeIf` blocks key it to `~/git/robertblust/`,
  `~/git/guestgraph/` and `~/git/companygraph/` and point at `~/.gitconfig-flatland`. The
  global default stays `rob@likemagic.tech`, which is right for `~/git/likemagic-tech` and
  `~/git/3ap-ag`. A clone made outside those three directories gets the global default and
  no warning, so check `git config user.email` before the first commit in a fresh clone.

### The deck has no package.json of its own

`npm run pdf` is a **root** script and `pdf-lib` is a **root** devDependency. Until
2026-08-26 both lived in `talks/intro/package.json`, which is why that file and its lockfile
existed at all — the root had neither, so building the deck's PDFs meant
`cd talks/intro && npm install` first, exactly as the README used to say.

That second manifest cost more than the `cd`. CI only ever runs `npm ci` at the root, so
nothing under `talks/intro` was ever installed or exercised by a check, and a Dependabot bump
there arrived green having proved nothing about the directory it changed. `blust.ch` has had
the single-manifest shape all along; this is the two sibling sites catching up.

`export-pdf.mjs` sits at the repository root, and `root` in the object it hands to
`exportDecks` is derived from its own location — `path.dirname(fileURLToPath(import.meta.url))`
— not from the deck. The deck is named relative to that root by the `decks` list:
`{ dir: "talks/intro", slug: "companygraph" }`. Moving the script back under `talks/intro/`
would break this: `root` would become `talks/intro`, and `goto` would resolve
`talks/intro/talks/intro/index.html`, which does not exist. Verified by rebuilding both PDFs
from the root: same page counts, and the only bytes that moved were pdf-lib's `CreationDate`
and `ModDate`.

## The deck and the talks index

Copied from the spec and from the sibling repositories' `CLAUDE.md`. Every task's
requirements implicitly include this section.

- **English markup, German in `data-de`.** Static `lang="en"`, because the source is English.
  `applyLang()` sets `de` when a visitor switches.
- **Notes are `data-notes` (German) and `data-notes-en`.** They are attribute *values*:
  nested markup uses single quotes (`<em class='cue'>`), German quotes must be typographic
  (`„…“` — one straight `"` terminates the attribute and dumps the note onto the slide), and
  an HTML comment never goes inside a start tag.
- **`<em class='cue'>` is a stage direction and is never spoken.** `<em>` alone is emphasis.
- **`<section class="slide` is a literal the narration generator splits on.** Nothing may come
  between the tag name and `class`: `<section class="slide title-slide" data-say-title="no">`
  is correct, the other order makes the slide invisible to the generator with no error.
- **Slide numbers are zero-based everywhere a viewer can see them** — the kicker, the counter,
  and the audio filename all say the same number.
- **Mono means data.** Record values, lengths, language pairs, URLs, code. Never navigation,
  buttons or prose. `verify` fails if mono appears outside data. That includes the deck's
  footer, which is a row of links.
- **Nothing opens in a new tab, except a link inside a slide.** A new tab takes away the
  visitor's back button, and every deck carries its own way out, so nothing needs one.
  `noNewTab` asserts it on every page.

  The exception is real and this deck is the only place that needs it: a presenter who clicks
  the roadmap link on slide 10 in the same tab loses the deck mid-sentence, in front of a room.
  Note what it keys on — *where the link sits*, not where it points. That is why the check is
  `.closest(".slide")` and not a list of hrefs somebody has to maintain.
- **The deck's footer is three destinations, and two of them are brands.** The lockup goes to
  the landing page (`../../`), `Robert Blust` to `https://blust.ch/`, and *Talks* / *Vorträge*
  to the index (`../`) — the same place the transport control goes, which is the deliberate
  duplicate: the corner offers every level of "out" and is the one corner nobody clicks by
  accident.

  `Robert Blust` is a full lockup, not a name in text — the `rb` plate from `blust.ch` inlined
  beside the wordmark, in the colours `.name b` already defines. It is a brand with a mark of
  its own and reads as a peer of this site's lockup. *Talks* stays `--dim`: the one nav item
  among two brands, and that contrast is what makes the row legible at 15px.

  Three checks share the row and none covers another's link. `wayOut` takes the index link,
  `links` takes the absolute ones (presence only — it no longer asserts anything about tabs),
  and `landing` takes the lockup, which nothing else can: a relative `../../` is invisible to
  `links`, and a dead one looks like a working deck right up until somebody clicks it.

  The same footer is on `guestgraph.io`, and on `blust.ch` in two parts rather than three:
  there the brand and the person are the same name.

  It used to be fenced by its own `deck footer · vN` marker with a `footerVersion` check — the
  same habit-with-a-tripwire the token block gets, for the same reason: no suite can see a
  sibling. Both are gone now, not retargeted: retired in a previous plan and replaced by the
  deck's chrome fences — `deck transport`, `deck lockup`, `deck fit` and `deck runtime` —
  generated like the tokens. What the old marker covered is still a contract, not a look —
  where each of the three links goes, and that none opens in a new tab — and `design:check`
  is what enforces it now, comparing each fence's bytes against the pinned release.

  `verify/design.mjs` now lives in `@robertblust/design`, alongside the nineteen shared page
  checks — edited there, released as a tag, and taken here by re-pinning that tag in
  `package.json`, exactly like the token block below. `verify/check.mjs` imports it by package
  specifier, `@robertblust/design/verify/design`; a `verify/design.mjs` created in this
  repository is never resolved by that import and would be silently ignored — the suite would
  still report green, having run the pinned release's code instead of the one just edited.
- **The design token block is generated**, fenced by `design tokens · vN` markers, shared with
  `blust.ch` and `guestgraph.io` — each of which now carries its own talks in the same
  repository, as this one does. Do not edit it here: it comes from `@robertblust/design` and
  `npm run design` writes it. This bullet named `v1` for a long time after the block had moved
  past it, which is the argument for naming the mechanism rather than the number.
  `verify/design.mjs`, which holds `TOKEN_VERSION`, lives in that same package now — see
  the footer bullet above for where it moved and what importing it by specifier means.
- **No type count, no type list read aloud, and no status claim that ages — name the plan, never the status.** Slide 10 says what would make the model usable and links to the roadmap for what exists. A slide may say what the project intends to build; it never says what it has built, because the deck is the one medium that cannot be edited cheaply.
- **The `blust.ch` credit in the page footer is a lockup, not a footer link.** It leaves the
  footer's mono for the same treatment it has on every deck — the `rb` plate inlined, wordmark
  with the second word in `--c-mid`. The rest of the row stays mono because the rest of the row
  is data: a repository URL and a license. A prose mention of the name inside a sentence stays
  a plain link — the mark belongs in the footer row, not mid-paragraph.
- **A link check that trusts the DOM inspects half the site.** The rendered DOM is only ever
  one language; German lives in `data-de` as markup that does not exist until a visitor
  switches. The privacy page's German credit kept `target='_blank'` — in single quotes, because
  it is nested inside an attribute — and survived both a source-wide strip and the check.
  `noNewTab` now parses every `[data-de]` value and reports what it finds with a `[de]` suffix;
  any new link check must do the same. A translated link and its English original are two
  separate attributes and nothing pairs them.
- **Never claim "no hallucinations".** The claim is that the model shrinks the space in which
  an agent has to guess.
- **Never print an environment variable's value**, and never use `${VAR:-UNSET}` — it prints
  the value whenever the variable is set. Probe with `${VAR:+SET}`.
- **Audio is committed, not LFS.** GitHub Pages serves the pointer text for LFS objects.
- **Verify by rendering, never by reading the diff.**


## "AI" in the deck, "agents" everywhere else — on purpose

The deck says **AI** on slides 00 and 08 and **agents** from 09 on. Nobody has been given
the narrower word at 0:00, and those opening slides are about who can *read* the thing; an
agent is software that *acts* inside the stated rules, which is a claim slides 09 and 10
earn. Do not level the two words.

The same sentence appears in three other places and deliberately does **not** match:

| Where | Says |
|---|---|
| this deck, slide 00 | "so people and **AI** can both rely on it" |
| `companygraph.io` tagline and `og:description` | "so people and **agents** can both rely on it" |
| `meta-model`'s `README.md` | "so that both people and **agents** can rely on it" |
| `companygraph/.github` profile | "People can read it and **agents** can rely on it" |

The deck is where a newcomer meets the idea; the repositories are read by someone already
at the model, where `agents` is the word its schemas and conventions use throughout. This
is a decision, not drift — if you are here because a reviewer flagged the mismatch, the
answer is that it was flagged and kept.
