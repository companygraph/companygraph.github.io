# CompanyGraph Talks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `companygraph/talks` — a talks index and one ten-minute narrated deck,
serving at `companygraph.io/talks/`, and wire it into the site and the org profile.

**Architecture:** Self-contained HTML. No build step and no framework: the index page is a
page, the deck is a deck, and both must open from `file://` as well as from a server. The
sibling repository `~/git/talks` (`guestgraph/talks`) is a working implementation of exactly
this shape — most tasks copy a file from it and change what is CompanyGraph's. Verification
renders the served pages in headless Chromium and asserts the DOM; each task adds its check
first (red), then the content that satisfies it (green).

**Tech Stack:** HTML, CSS, vanilla JS. Node 18+ with Playwright for `verify`, `og` and `pdf`.
Python 3 with `requests` for narration. No dependencies in the pages themselves.

**Spec:** [`../specs/2026-08-24-companygraph-talks-design.md`](../specs/2026-08-24-companygraph-talks-design.md)
— read §3 (the arc), §5 (the index shares the site's chrome), §6 (language and notes) and §7
(narration) before starting. Where this plan and the spec disagree, the spec wins.

## Global Constraints

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
  buttons or prose. `verify` fails if mono appears outside data.
- **The design token block is a copy**, fenced by `design tokens · v1` markers, shared with
  `blust.ch`, `guestgraph.io`, `guestgraph/talks` and `companygraph.io`. Do not edit it here.
  `verify/design.mjs` is byte-identical across all of them and is never edited in this repo.
- **No type count, no type list read aloud, and no status claim that ages.** Slide 9 says "not
  all of it is written yet, the roadmap says what is" and links. It never says how much.
- **Never claim "no hallucinations".** The claim is that the model shrinks the space in which
  an agent has to guess.
- **Never print an environment variable's value**, and never use `${VAR:-UNSET}` — it prints
  the value whenever the variable is set. Probe with `${VAR:+SET}`.
- **Audio is committed, not LFS.** GitHub Pages serves the pointer text for LFS objects.
- **Verify by rendering, never by reading the diff.**

## File Structure

```
package.json                  serve + verify, playwright only
verify/design.mjs             byte-identical copy from ~/git/talks — never edited here
verify/check.mjs              this repo's assertions; every page it names must exist
index.html                    the talks index — companygraph.io's chrome verbatim
favicon.svg                   copied from companygraph.github.io
fonts/*.woff2                 four faces, for the index page
og.png                        the index card
sitemap.xml                   the talk URLs; companygraph.io's sitemap becomes an index
intro/index.html              the deck — ten slides, notes in two languages
intro/fonts/*.woff2           the same four faces again: a deck opens from file://
intro/export-pdf.mjs          → companygraph-en.pdf, companygraph-de.pdf
intro/export-og.mjs           → intro/og.png from the title slide
intro/package.json            pdf + og scripts, playwright + pdf-lib
intro/tts/generate.py         narration; reads the deck's notes directly
intro/audio/{en,de}/NN.mp3    committed clips, one per slide, zero-based
.github/workflows/ci.yml      serves the pages and runs verify
.gitattributes                records why audio is not LFS
CLAUDE.md, README.md
```

`verify/check.mjs` stays one file: every check shares the same page-loading helpers, and the
index and the deck are asserted by the same machinery with different spec objects.

---

### Task 1: The repository, the harness, and the talks index

The index page first, because it is the smaller of the two documents and it proves the shell,
the fonts, the tokens and the suite before a deck is written against them.

**Files:**
- Create: `package.json`, `verify/design.mjs`, `verify/check.mjs`, `index.html`,
  `favicon.svg`, `fonts/*.woff2`, `.gitignore` (exists), `README.md`, `CLAUDE.md`
- Remote: create `companygraph/talks` on GitHub

**Interfaces:**
- Consumes: nothing.
- Produces: `verify/check.mjs` exporting nothing, but defining `PAGES` (array of page spec
  objects keyed by `path`) and `CHECKS` (object of `async (page, spec) => string | null`).
  Later tasks add one entry to `PAGES` and never change the machinery.

- [ ] **Step 1: Create the remote and push the spec that already exists**

```bash
cd ~/git/companygraph-talks
gh repo create companygraph/talks --public \
  --description "Talks on CompanyGraph — the open-source meta-model for operating a company"
git remote add origin git@github.com:companygraph/talks.git
git push -u origin main
```

Expected: the existing spec commit lands on `main`. The repository name is load-bearing —
Pages serves it at `companygraph.io/talks/` because the org's `CNAME` cascades from
`companygraph.github.io`. Do not rename it.

- [ ] **Step 2: Copy the harness from the sibling, unchanged where it must be**

```bash
cd ~/git/companygraph-talks
mkdir -p verify fonts
cp ~/git/talks/verify/design.mjs verify/design.mjs        # byte-identical, never edited here
cp ~/git/talks/fonts/*.woff2 fonts/
cp ~/git/companygraph.github.io/favicon.svg favicon.svg
diff ~/git/talks/verify/design.mjs verify/design.mjs && echo "identical"
```

Expected: `identical`. If it ever differs, the shared-token check in every sibling repository
is asserting something different from this one.

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "companygraph-talks",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "serve": "python3 -m http.server 8000",
    "verify": "node verify/check.mjs"
  },
  "devDependencies": { "playwright": "^1.49.1" }
}
```

- [ ] **Step 4: Write the failing check**

Copy the sibling's suite and reduce `PAGES` to the index alone:

```bash
cp ~/git/talks/verify/check.mjs verify/check.mjs
```

Then replace the `PAGES` array with exactly this, leaving `CHECKS` and the runner untouched:

```js
const PAGES = [
  { path: "/", title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["CompanyGraph", "meta-model"],
    links: ["https://github.com/companygraph"],
    // The nav's Model item points at companygraph.github.io's own page — shared chrome, so
    // it stays in the tab like the rest. verify can assert the link is here; it can never
    // assert the page on the other side still carries an item back. See CLAUDE.md.
    sameTab: ["intro/", "./", "https://companygraph.io/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    translates: { lang: "de", shows: ["Vortrag"], hides: ["Watch the talk"] },
    card: true, cardBase: "https://companygraph.io/talks", internalLinks: true },
];
```

- [ ] **Step 4b: Bring the toggle check across from the landing page**

The sibling's suite does **not** have this check — it asserts only the first render, which is
English, so deleting a toggle's click listener leaves it printing `all checks pass`. It was
written for `companygraph.io` and caught three real breakages there. This repository gets it
from the start rather than discovering the gap later (spec §10).

Copy the `translates` function from `~/git/companygraph.github.io/verify/check.mjs` into
`CHECKS` here, **last in the object**, unchanged. It clicks `#langind`, requires `lang` to
flip and the German strings to appear and the English to be gone, then clicks back and
requires the page to be exactly what it was. It runs last because it is the only check that
mutates what the others read, and the round trip is what stops a later check inheriting a
German page.

If the deck's control has a different id than the index page's, pass it in the spec object
rather than branching inside the check.

- [ ] **Step 5: Run it and watch it fail**

```bash
npm install && npx playwright install chromium
npm run serve &                      # or a second terminal
npm run verify
```

Expected: FAIL — `HTTP 404` for `/`, because `index.html` does not exist yet.

- [ ] **Step 6: Write `index.html`**

Start from the sibling and change what is GuestGraph's:

```bash
cp ~/git/talks/index.html index.html
```

Then, in order:

1. Replace the token block **only** if its `design tokens · v1` marker line differs from
   `companygraph.github.io`'s. It should not — check with
   `diff <(sed -n '/design tokens · v1/,/^  \*\//p' index.html) <(sed -n '/design tokens · v1/,/^  \*\//p' ~/git/companygraph.github.io/index.html)`.
2. Header: wordmark `<b>Company<span>Graph</span></b>`, matching `companygraph.io`'s
   construction, with the same mark SVG copied from `~/git/companygraph.github.io/logo.svg`.
3. Nav: one item, **Model**, pointing at `https://companygraph.io/` — plus the language
   control. No Billing and no Privacy: those are GuestGraph pages and this domain has neither.
4. Title: `Talks · CompanyGraph`. Meta description in English, with `data-de` on the element
   that carries the visible strapline.
5. The talk card: title *An introduction*, the length, and a link to `intro/`. The length is a
   **restated fact** and the only one this repository allows — it belongs next to the call to
   action, and it is quoted from §7 of the spec once the script is rehearsed. Until then write
   `10 minutes` and correct it in Task 6.
6. Footer: organisation, licence, credit — copied from `companygraph.io`'s footer verbatim.
7. `og:*` tags with `cardBase` `https://companygraph.io/talks`, `og:image`
   `https://companygraph.io/talks/og.png`, declared `1200`×`630`.

- [ ] **Step 7: Run the check and watch it pass**

```bash
npm run verify
```

Expected: `✓ /` and `all checks pass`. If `monoScope` fails, prose has been set in mono —
fix the page, never the check.

- [ ] **Step 8: Look at it**

```bash
open http://localhost:8000/
```

Check both OS colour schemes and a phone width. The header, main content and footer must line
up on the same two edges at every width — that is `.shell` doing its job, and it is invisible
in a diff.

- [ ] **Step 9: Write `README.md` and `CLAUDE.md`**

`README.md`: what the repository is, the file list, `npm run serve` / `verify` / `og` / `pdf`,
and that the domain is served by two repositories.

`CLAUDE.md`: the Global Constraints above, plus the two rules that have no CI behind them —

```markdown
## The index is a page; the deck is a deck

`index.html` shares companygraph.io's shell, header and footer **verbatim**. The domain is
served by two repositories and a visitor crossing between them must not meet a seam. Changing
that chrome means changing it in both repositories in the same breath: `verify` here can
assert a link is in the tab, never that the page on the other side still exists or still
carries the same item back. The seam this rule prevents is invisible from either repository
alone.

The decks are out of scope: a deck has a transport bar, not a nav.
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Give the talks a page, and a suite that renders it"
git push
```

---

### Task 2: The deck skeleton and its title slide

One slide, all the chrome. This is where the transport bar, the notes panel, the language
toggle and the keyboard handling are proven — before nine more slides make failures ambiguous.

**Files:**
- Create: `intro/index.html`, `intro/package.json`, `intro/fonts/*.woff2`
- Modify: `verify/check.mjs` (add the `/intro/` page spec)

**Interfaces:**
- Consumes: `PAGES` and `CHECKS` from Task 1.
- Produces: `intro/index.html` with `applyLang()`, a `.deck` element, `.slide` sections, and
  `data-time` / `data-notes` / `data-notes-en` attributes that Task 6's `generate.py` reads.

- [ ] **Step 1: Add the failing page spec**

Append to `PAGES` in `verify/check.mjs`:

```js
  { path: "/intro/", title: /CompanyGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    // The deck's German is the whole second half of the talk, including every speaker note.
    // `shows` names a string from the title slide's data-de, `hides` its English counterpart.
    translates: { lang: "de", shows: ["Unternehmen"], hides: ["a talk by"] },
    card: true, cardBase: "https://companygraph.io/talks", internalLinks: true },
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npm run verify
```

Expected: FAIL — `HTTP 404` for `/intro/`.

- [ ] **Step 3: Copy the sibling deck and strip it to the title slide**

```bash
mkdir -p intro/fonts
cp ~/git/talks/intro/index.html intro/index.html
cp ~/git/talks/intro/fonts/*.woff2 intro/fonts/
cp ~/git/talks/intro/package.json intro/package.json
```

In `intro/index.html`, delete every `<section class="slide">` except the title slide, and
change:

- `<title>` → `CompanyGraph — an introduction · a talk by Robert Blust`
- `<link rel="canonical">` and `og:url` → `https://companygraph.io/talks/intro/`
- `og:site_name` → `CompanyGraph`; `og:image` → `https://companygraph.io/talks/intro/og.png`
- `og:description` / `<meta name="description">` → the talk's own sentence, not the site's
- the title slide's `<h1>` → `CompanyGraph` with `data-de` carrying the German

In `intro/package.json`, set `"name": "companygraph-talk-intro"` and a `description` naming
this talk.

- [ ] **Step 4: Run the check and watch it pass**

```bash
npm run verify
```

Expected: `✓ /` and `✓ /intro/`.

- [ ] **Step 5: Look at the deck, not the diff**

```bash
open http://localhost:8000/intro/
```

Press `→`, `N` (notes) and `L` (language). Confirm: the notes panel shows the note and the
slide does not, the counter reads `00`, and the transport bar's *All talks* control is on the
far side of the divider from play and next.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Open the deck on its title, with its chrome proven"
git push
```

---

### Task 3: Slides 1–4 — the problem, the convergence, the shape, the references

The first half of the arc. Slide 2 is the spine of the whole talk and is new: it is not a
port of anything.

**Files:**
- Modify: `intro/index.html`

**Interfaces:**
- Consumes: the deck skeleton from Task 2.
- Produces: slides `01`–`04`, each a `<section class="slide" data-time="M:SS" data-notes="…"
  data-notes-en="…">`.

- [ ] **Step 1: Add slide 01 — knowledge everywhere and nowhere**

Visible: *A company's knowledge lives everywhere — and nowhere.* `data-de`:
*Das Wissen einer Firma liegt überall — und nirgends.*

Notes (EN, `data-notes-en`) say: every company runs on knowledge — what it is for, how it
works, who decides what, what it measures, which rules hold. It sits in heads, in wiki pages,
in spreadsheets, in tickets. **Name no tool**: "wiki pages" and "tickets", never a product
name. Neither people nor agents can rely on it. `data-time="1:00"`.

- [ ] **Step 2: Add slide 02 — two companies, the same shape**

Visible: *Two companies. The same shape.* — the landing page's own headline, deliberately.

Notes: one company has a payroll and keeps a thin file per person, because the rest lives on a
website. One is a company of one, and was forced to model a person properly — that is where
`profile`, `skill` and `experience` come from. **Neither knew about the other.** Both arrived
at one Markdown file per entity, frontmatter and a body, folders named for the type, schemas
beside them.

**Name neither company.** The structural claim stands without it, and naming them is
forbidden by the model's own conventions. `data-time="1:15"`.

- [ ] **Step 3: Add slide 03 — that shape**

Visible: the brain image from the source deck, with *One file per entity.*

Notes: an entity is a file when it owns nothing and a folder when it owns collections of its
own — one mechanism, not two. The canonical name is the H1, not a field and not the filename.
`data-time="1:10"`.

- [ ] **Step 4: Add slide 04 — references, not links**

Visible: *No dead links.* — the source deck's `keine toten Links`, in English.

Notes: every reference is a canonical name, never a path. Moving a file breaks nothing;
renaming an entity breaks loudly, because a name that does not resolve is caught. Say what is
checked — a person without a role, a rule without an owner. `data-time="1:10"`.

- [ ] **Step 5: Verify by rendering, twice**

```bash
npm run verify
open http://localhost:8000/intro/
```

Walk all five slides in both languages. The three inherited hazards all show up here and only
here: a straight `"` inside a German note dumps the note onto the slide, a `class="cue"` with
double quotes does the same, and an HTML comment inside a start tag swallows `data-notes`
entirely. **Look at each slide with notes open before moving on.**

- [ ] **Step 6: Commit**

```bash
git add intro/index.html
git commit -m "Argue the convergence, then the shape it converged on"
git push
```

---

### Task 4: Slides 5–9 — breadth, a gate, both audiences, the thesis, the offer

**Files:**
- Modify: `intro/index.html`

**Interfaces:**
- Consumes: slides 01–04 from Task 3.
- Produces: slides `05`–`09`; the deck is now complete and `data-time` sums to ≈10:25.

- [ ] **Step 1: Add slide 05 — the breadth**

Visible: *Everything that makes a company — in one vocabulary.*

Notes: roles and groups (who does what), processes with gates (how work flows), strategy and
objectives (where we invest), KPIs (what we measure), rules (what we enforce), concepts (what
we define). **No count and no exhaustive list read aloud** — pick, do not recite.
`data-time="1:20"`.

- [ ] **Step 2: Add slide 06 — a gate, concrete**

Visible: *Governance as data, not as a slide.*

Notes: take the transition from concept to build. The model says who is accountable, what the
gate's criteria are, and which rules sit behind it. Keep the source deck's example shape but
**invent the specifics** — no real company's thresholds. `data-time="1:20"`.

- [ ] **Step 3: Add slide 07 — it pays twice**

Visible: *For people, and for agents.*

Notes: people get onboarding by role, an answer to "who owns this?", and alignment. Agents get
a context layer they can act inside — vision, strategy, process, rules. `data-time="1:15"`.

- [ ] **Step 4: Add slide 08 — Markdown, checked by agents**

Visible: *Markdown. Checked by agents.* — new, and the claim the private model never had to
defend.

Notes: the schemas are Markdown too, and an agent enforces them. This is not a stage on the
way to JSON Schema — a formal schema language would contradict the thesis the model ships
under. Say why it holds: the schema tables are written to a fixed shape, so what an agent
checks is the same thing every time. `data-time="1:00"`.

**This is where the "no hallucinations" restraint applies.** The claim is that the model
shrinks the space in which an agent has to guess, and holds it inside stated guardrails.

- [ ] **Step 5: Add slide 09 — take it**

Visible: *Apache 2.0 · companygraph.io*

Notes: the vocabulary is published, copy it into a repository of your own, nothing to install.
Then the one honesty sentence, in this form and no other: **"Not all of it is written yet —
the roadmap says what is."** No count, no type list, no "the first release describes one
person completely". Those are true the day they are recorded and wrong within a release, and
correcting a recorded slide costs two audio clips and two PDF exports. `data-time="0:55"`.

- [ ] **Step 6: Check the running time**

```bash
grep -o 'data-time="[0-9]:[0-9][0-9]"' intro/index.html \
  | sed 's/[^0-9:]//g' \
  | awk -F: '{s+=$1*60+$2} END {printf "%d:%02d\n", s/60, s%60}'
```

Expected: `10:25`. If it drifts more than ~30s from the spec's budget, the arc has grown —
cut, do not let it run long.

- [ ] **Step 7: Verify by rendering**

```bash
npm run verify
open http://localhost:8000/intro/
```

All ten slides, both languages, notes open. Confirm the counter reads `09` on the last slide —
zero-based everywhere the viewer can see it.

- [ ] **Step 8: Commit**

```bash
git add intro/index.html
git commit -m "Finish the argument, and say plainly what is not written yet"
git push
```

---

### Task 5: The share cards and the PDFs

**Files:**
- Create: `intro/export-og.mjs`, `intro/export-pdf.mjs`, `og.png`, `intro/og.png`,
  `intro/companygraph-en.pdf`, `intro/companygraph-de.pdf`
- Modify: `intro/package.json`, `package.json`

**Interfaces:**
- Consumes: the complete deck from Task 4, and `PAGES[].card` from Task 1.
- Produces: `og.png` and `intro/og.png` at exactly 1200×630, matching the declared tags.

- [ ] **Step 1: Copy both exporters**

```bash
cp ~/git/talks/intro/export-og.mjs intro/export-og.mjs
cp ~/git/talks/intro/export-pdf.mjs intro/export-pdf.mjs
```

In `export-og.mjs`, the `cards` array names the sources and destinations — point one at
`../index.html` → `../og.png` and one at `index.html` → `og.png`. In `export-pdf.mjs`, set the
output names to `companygraph-en.pdf` and `companygraph-de.pdf`.

- [ ] **Step 2: Add the scripts**

In `intro/package.json`, keep `"pdf": "node export-pdf.mjs"` and `"og": "node export-og.mjs"`,
and add `pdf-lib` alongside `playwright` in `devDependencies`.

- [ ] **Step 3: Generate, then look at the files**

```bash
cd intro && npm install && npm run og && npm run pdf
file og.png ../og.png                      # must report 1200 x 630
open og.png ../og.png companygraph-en.pdf
```

Expected: 1200×630 for both cards. `verify`'s `card` check only compares the *declared*
numbers against the literals — it never measures the file, so a card at the wrong size passes.
Looking at it is the check.

- [ ] **Step 4: Run verify**

```bash
cd .. && npm run verify
```

Expected: `all checks pass`, with `card` green for both pages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Give both pages a card, and the talk a PDF in each language"
git push
```

---

### Task 6: Narration

Last of the deck work, deliberately: clips cache on a content hash of the note, so generating
before the words stop moving pays twice.

**Files:**
- Create: `intro/tts/generate.py`, `intro/audio/{en,de}/NN.mp3`, `.gitattributes`
- Modify: `index.html` (correct the quoted length)

**Interfaces:**
- Consumes: `data-notes` / `data-notes-en` and the `<section class="slide` literal from Tasks
  2–4.
- Produces: `intro/audio/en/00.mp3` … `09.mp3` and the same for `de`, plus `.sha` siblings.

- [ ] **Step 1: Copy the generator and set the voices**

```bash
mkdir -p intro/tts
cp ~/git/talks/intro/tts/generate.py intro/tts/generate.py
chmod +x intro/tts/generate.py
```

Keep `VOICE` exactly as it is — Matilda `XrExE9yKIg1WjnnlVkGX` for English, Jessica
`cgSgspJ2msm6clMCkdW9` for German — and **rewrite the comment above it**, which currently says
these are GuestGraph's voices chosen to differ from the person's. Replace with what §7 of the
spec decided: the same two voices, now a house voice across the projects, because the products
are told apart by what the decks say rather than by who reads them.

- [ ] **Step 2: Dry run before anything is billed**

```bash
cd intro/tts
./generate.py --dry-run
```

Expected: 20 clips (ten slides × two languages) and a character count. **Check the slide count
against the deck.** If it is fewer than ten, a `<section` tag has an attribute before `class`
and the generator cannot see that slide — nothing errors, the clip is simply never made.

- [ ] **Step 3: Generate**

```bash
export ELEVENLABS_API_KEY="$(zsh -ic 'printf %s "$ELEVENLABS_API_KEY"' 2>/dev/null)"
[ -n "$ELEVENLABS_API_KEY" ] && echo set || echo unset
./generate.py
```

Never echo the value. `${VAR:-UNSET}` prints it — the form above cannot.

- [ ] **Step 4: Listen to at least slides 00, 02 and 09 in both languages**

An English title read in the German voice is invisible in every diff and every DOM query. It
is caught by listening, and by nothing else.

- [ ] **Step 5: Record why the audio is committed**

`.gitattributes`:

```
# Audio is committed, not LFS: GitHub Pages does not resolve LFS objects — it would serve
# the pointer text to anyone pressing play.
*.mp3 -filter -diff -merge
```

- [ ] **Step 6: Time the narration and correct the quoted length**

Narrated runs shorter than presented, and **the live figure is the one quoted publicly**. Sum
the clip durations, compare against the deck's `data-time` total, and set the length in
`index.html`'s talk card to the live figure.

```bash
for f in intro/audio/en/*.mp3; do ffprobe -v error -show_entries format=duration \
  -of csv=p=0 "$f"; done | awk '{s+=$1} END {printf "narrated %d:%02d\n", s/60, s%60}'
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Narrate the talk in both languages, and quote the length people will sit through"
git push
```

---

### Task 7: Findability, CI, and branch protection

**Files:**
- Create: `sitemap.xml`, `.github/workflows/ci.yml`
- Remote: `protect-main` ruleset

**Interfaces:**
- Consumes: the pages from Tasks 1–5.
- Produces: the URL set that `companygraph.io/sitemap.xml` will point at in Task 8.

- [ ] **Step 1: Write `sitemap.xml`**

```bash
cp ~/git/talks/sitemap.xml sitemap.xml
```

Two URLs: `https://companygraph.io/talks/` and `https://companygraph.io/talks/intro/`. **The
PDFs are deliberately not listed** — the same talk in a second format would compete with the
deck for the same query.

- [ ] **Step 2: Copy the CI workflow**

```bash
mkdir -p .github/workflows
cp ~/git/companygraph.github.io/.github/workflows/ci.yml .github/workflows/ci.yml
```

Keep the job id `verify` — a ruleset requires the job id, not the workflow name, and renaming
it leaves a branch that looks protected and is not. Keep `timeout-minutes: 10` and
`permissions: contents: read`. The server step must stay backgrounded **with its output
redirected** (`> /dev/null 2>&1 &`): a backgrounded process holding the step's log pipe open
hangs the job just as surely as a foreground one. `npm run og` never runs in CI — it would
overwrite the committed cards.

- [ ] **Step 3: Push and confirm CI runs green on a PR**

```bash
git checkout -b ci
git add -A && git commit -m "Run the checks on every pull request, and say where the talks are"
git push -u origin ci
gh pr create --fill
gh pr checks --watch
```

Expected: `verify` passes. The workflow's first run is this PR, because it only exists on the
branch.

- [ ] **Step 4: Add the ruleset after the PR merges**

```bash
gh api repos/companygraph/meta-model/rulesets/21245348 \
  | jq '{name,target,enforcement,bypass_actors,conditions,rules}' > /tmp/ruleset.json
gh api --method POST repos/companygraph/talks/rulesets --input /tmp/ruleset.json
gh api repos/companygraph/talks/rules/branches/main --jq '[.[].type] | join(", ")'
```

Expected: `deletion, non_fast_forward, pull_request, required_status_checks`. This is the
meta-model variant, with the status check, because this repository has CI.

---

### Task 8: Wire it into the site and the profile

**This task edits two repositories other than this one. Confirm with the user before
starting it.** Every change here is a debt already written down in the target repository's
`CLAUDE.md`, which says explicitly not to pre-write any of it before the talk exists.

**Files:**
- Modify: `~/git/companygraph.github.io/index.html`, `sitemap.xml`, `verify/check.mjs`,
  `CLAUDE.md`
- Modify: `~/git/companygraph-org/profile/README.md`, `README.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: the live URLs from Task 7 and the length from Task 6.
- Produces: nothing this repository reads.

- [ ] **Step 1: The landing page's nav and second call to action**

In `~/git/companygraph.github.io/index.html`: the nav gains its first link, **Talks** →
`https://companygraph.io/talks/`, beside the language control it was built to hold. The hero
gains a second button, *Watch the introduction*, with the length quoted inline — the one fact
that page is allowed to restate, because a call to action needs it in the moment rather than
one click away.

Add both to that repository's `verify/check.mjs` `PAGES[0].links` so they are asserted.

- [ ] **Step 2: The landing page's sitemap becomes an index**

`sitemap.xml` there currently lists one page. It becomes a `<sitemapindex>` pointing at
`https://companygraph.io/sitemap.xml`'s own URL set and at
`https://companygraph.io/talks/sitemap.xml`. Its `CLAUDE.md` records this as a debt to pay
"the day `companygraph/talks` ships" — this is that day.

- [ ] **Step 3: Both `CLAUDE.md`s gain the shared-chrome rule**

The same paragraph on both sides: the talks index carries the site's shell verbatim, and
adding, renaming or reordering a nav item means doing it in both repositories in the same
breath. Neither repository's CI can see the other.

- [ ] **Step 4: The org profile gains its entry point**

In `~/git/companygraph-org/profile/README.md`: a `talks` row in the *Where to start* table,
and the "New here?" line the sibling profile has and this one has deliberately lacked —
pointing at `companygraph.io/talks/intro/` with the length. Add the same row to the repo table
in `README.md`, and to `CLAUDE.md`'s fact-ownership table, where "The talk" currently reads
"`companygraph/talks`, the day it exists".

- [ ] **Step 5: Verify the site still passes, and look at both pages**

```bash
cd ~/git/companygraph.github.io && npm run serve &
npm run verify
open http://localhost:8000/
```

Expected: `all checks pass`, including the two new links.

- [ ] **Step 6: Commit and open a PR in each repository separately**

Each repository gets its own commit and its own PR — both have `protect-main` requiring one.

---

## Not in this plan

Per the spec, deliberately excluded:

- **A second talk.** `intro/` is the only deck. The index exists because a talks repository
  needs one and the sitemap wants an owner.
- **Any change to `blust.ch/talks/mental-model/`.** It stays independent and unlinked in both
  directions (spec §8).
- **Per-language URLs and hreflang.** One URL, one indexable language — a known limit,
  recorded, not fixed here.
- **The DNS, Pages settings, and the org avatar.** All already done for this domain; the talks
  repository needs no configuration of its own.
