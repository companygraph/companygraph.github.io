# CompanyGraph talks — design

> **Partly superseded.** §2 and §3 — the arc and its rationale — are replaced by
> [`2026-08-25-intro-talk-rework-design.md`](2026-08-25-intro-talk-rework-design.md). §4 onward stand.

> The introduction talk, and the repository that serves it at `companygraph.io/talks/`.

## 1. Purpose

`companygraph.io` says what CompanyGraph is in one screen and sends the visitor to the model.
The talk is the step between those two: ten minutes that make the argument the landing page's
figure only gestures at, and that a README cannot make at all.

The argument already exists as a deck. `blust.ch/talks/mental-model/` runs ten slides in
about ten minutes and says most of it: a company's knowledge lives everywhere and nowhere,
the facts belong in Markdown structured by a meta-model, references are canonical names so
there are no dead links, and the same model serves people and agents. This repository is that
argument re-aimed — spoken for the published model rather than for one person's instance.

### Non-goals

- **A second talk.** One deck, `intro/`. The index page exists because a talks repository
  needs one and because the sitemap wants an owner, not because a second deck is planned.
- **Replacing `blust.ch/talks/mental-model/`.** It stays where it is, unchanged, and the two
  decks do not link to each other — see §8.
- **Per-language URLs.** One URL, one indexable language. Inherited limit, recorded in §7.
- **Anything the model owns.** No type count, no type list read aloud, and no status claim
  that ages. Slide 9 links to the roadmap rather than summarising it — see §3.

---

## 2. Why the arc changes

The source deck's spine is *I am building this*. Three slides open with a personal framing,
and its strongest evidence — breadth, references, a gate, three worked examples — is a tour of
one company's model.

The published thing's claim is different and stronger: **two companies that never knew about
each other arrived at the same shape.** One has a payroll and keeps a thin file per person;
one is a company of one and was forced to model a person properly. Neither borrowed from the
other. That convergence is the reason any of this is worth publishing, and it is what the
landing page's animation draws.

So convergence becomes the spine, and the tour becomes evidence. The middle slides survive
almost intact; what changes is what they are *for*.

## 3. The arc

Ten slides, ≈10:25 — the same budget as the source, which is a proven ten-minute shape.

| # | Slide | ≈ | Origin |
|---|---|---|---|
| 0 | Title | 0:00 | source |
| 1 | A company's knowledge lives everywhere — and nowhere | 1:00 | source |
| 2 | **Two companies, the same shape** | 1:15 | **new — the spine** |
| 3 | That shape: one file per entity; a file when it owns nothing, a folder when it owns collections; the H1 is the name | 1:10 | source, re-aimed |
| 4 | References, not links — a name that does not resolve is caught | 1:10 | source |
| 5 | The breadth — what a company is made of, in one vocabulary | 1:20 | source |
| 6 | Concrete: a gate. Governance as data, not as a slide | 1:20 | source |
| 7 | It pays twice — people onboard and decide; agents act inside the guardrails | 1:15 | source |
| 8 | Markdown, checked by agents — and why that is the thesis, not a stage | 1:00 | **new** |
| 9 | Take it — Apache 2.0, what ships today, where the roadmap is | 0:55 | source, re-aimed |

**Slide 8 is new because the published model has a claim the private one never had to
defend.** Schemas are Markdown enforced by agents, deliberately not JSON Schema. A talk that
skipped it would leave the audience assuming the Markdown is a stage on the way to a real
schema language, which is the reading the design explicitly rejects.

**The "brain" image survives** as slide 3's visual. It is the source deck's most memorable
frame and it costs nothing to keep.

**The restraint survives too.** The source deck's own notes say: do not claim "no
hallucinations". The port keeps that. The claim is that the model shrinks the space in which
an agent has to guess, and holds it inside stated guardrails — not that guessing stops.

### Honesty about what ships

Slide 5 shows the vocabulary the *design* names, while only part of it is written today. The
deck does not hedge mid-argument: **slide 9 carries it**, in one sentence that says not all of
this is written yet and that the roadmap says what is.

**It must not say how much.** A count, a type list, or "the first release describes one person
completely" would all be true on the day they are recorded and wrong within a release — and
correcting them means editing a slide, regenerating two clips, and re-exporting two PDFs. The
form "not all of it yet, the roadmap says what" never ages, because the roadmap moves on its
own and the deck points at it rather than copying it.

This is the same rule the site and the org profile already hold, applied to the one medium
that cannot be edited cheaply.

---

## 4. Repository

```
companygraph/talks
  index.html              the talks index — shares companygraph.io's chrome verbatim (§5)
  intro/index.html        the deck
  intro/audio/{en,de}/    narrated clips, committed — Pages does not resolve LFS
  intro/tts/generate.py   reads the deck's notes directly; clips cache on a content hash
  intro/export-pdf.mjs    → companygraph-en.pdf, companygraph-de.pdf
  intro/export-og.mjs     → intro/og.png, rendered from the title slide
  intro/fonts/            self-hosted again here: a deck must open from file://
  verify/check.mjs        this repository's assertions
  verify/design.mjs       the shared design-system suite, byte-identical copy
  fonts/                  for the index page
  sitemap.xml             the talk URLs
  og.png                  the index page's card
  .github/workflows/ci.yml
  CLAUDE.md, README.md
```

It serves at `companygraph.io/talks/` with **no configuration of its own**: the org's Pages
site carries the `CNAME`, and that cascades to every other Pages repository in the org. This
was designed in before the landing page shipped and is why the site repository must keep its
name.

`protect-main` matches the other repositories — `deletion`, `non_fast_forward`,
`pull_request`, and `required_status_checks` on the job id `verify`, since this repository has
CI.

## 5. The index page is a page; the deck is a deck

`index.html` at the root is not a deck. It carries `companygraph.io`'s shell, header and
footer **verbatim**, because the domain is served by two repositories and a visitor crossing
between them must not meet a seam.

**This is a two-repository obligation with no CI that can see it.** `verify` here can assert
that a link is in the tab; it can never assert that the page on the other side still exists or
still carries the same item back. Adding, renaming or reordering a nav item means doing it in
both repositories in the same breath. Both `CLAUDE.md`s record this.

The deck is out of scope for that rule: a deck has a transport bar, not a nav.

## 6. Language and notes

- **English markup, German in `data-de`.** Matches the landing page and the source deck. The
  static attribute is `lang="en"` because the source is English, and `applyLang()` sets `de`
  when a visitor switches.
- **Notes are `data-notes` (German) and `data-notes-en`.**
- **Notes live inside attribute values**, so the inherited hazards apply unchanged: nested
  markup uses single quotes, German quotes must be typographic (`„…“`), and an HTML comment
  never goes inside a start tag.
- **`<em class='cue'>` is a stage direction and is never spoken.** `<em>` alone is emphasis.

## 7. Narration

`generate.py` reads the deck, so the notes are the single source for what is said, and clips
cache on `sha256(voice|model|text)` — editing one note regenerates one clip.

- **Same voices as `guestgraph/talks`:** Matilda (`XrExE9yKIg1WjnnlVkGX`) for English,
  Jessica (`cgSgspJ2msm6clMCkdW9`) for German. Decided explicitly, and English was picked on
  its merits for this talk: "knowledgable, professional" suits an argument about structure.
  German stays Jessica because `generate.py` is right that a voice carrying English well does
  not necessarily carry German, and both ids are already validated in shipped decks.

  **What that makes true:** the two products become indistinguishable by voice. The original
  rationale reasoned about *the product and the person* not sounding alike and never
  anticipated a second product. This is the answer to that question, not an oversight of it —
  the voice is now a house voice, and the distinction between projects is carried by what the
  decks say, which share no vocabulary at all.
- **~20 clips regenerate**, because arc A rewrites nearly every note. `--dry-run` reports the
  exact character count before anything is billed.
- **The key is never printed**, and is pulled in for the single command that needs it with the
  documented one-liner. `${VAR:-UNSET}` is forbidden: it prints the value.
- **Two durations, both true.** Narrated runs shorter than presented. The live figure is the
  one quoted publicly, and it is quoted inline on the landing page's call to action.
- **One URL, one indexable language.** A crawler never runs `applyLang()`, so the card and the
  OG tags are English and only English is indexed. Fixing that needs per-language URLs with
  hreflang — a different shape of deck, and out of scope.

## 8. `blust.ch/talks/mental-model/` stays independent

It is not moved, not retired, and **not linked in either direction**. Decided.

It remains the personal keynote: first person, one company's model, a talk given by a person.
This deck is the project's. Two decks making one argument is only a problem if a reader is
promised they are the same thing, and neither page promises that.

The cost is accepted: someone who finds both hears the argument twice. The alternative — a
cross-link — would make the personal deck look like a redirect to a product, which is not what
it is.

## 9. What lands in other repositories the day this ships

All three are debts already written down where they will be read:

| Repository | Change |
|---|---|
| `companygraph.github.io` | The nav gains its first link. The hero gains a second call to action with the talk's length quoted inline — the one fact this project allows a page to restate, because a call to action needs it in the moment. `sitemap.xml` becomes an index pointing at `/talks/sitemap.xml`. `verify` updated for both. |
| `companygraph/.github` | The "New here?" entry line the profile currently lacks, and a `talks` row in both repository tables. |
| Both `CLAUDE.md`s | The shared-chrome rule from §5. |

The site's `CLAUDE.md` already anticipates every one of these and says explicitly: do not
pre-write them, the obligation begins the day the talk repository exists.

## 10. Verification

- **Verify by rendering, never by reading the diff.** Three bugs in one session of the sibling
  repository were invisible in source and obvious in a screenshot: notes leaking onto slides,
  comment text rendering as content, an English title in the German voice.
- `verify/check.mjs` asserts the index and the deck against a served copy in headless
  Chromium; `verify/design.mjs` is copied in byte-identical and never edited here.
- **The language toggle is asserted**, including the round trip — the check written for
  `companygraph.io`, which caught three real breakages that had previously passed. This
  repository gets it from the start rather than discovering the gap later.
- CI serves the pages and runs the suite on every PR and push to `main`, with the job id
  `verify` so the ruleset's required context resolves.
- `npm run og` is never run in CI: it would regenerate and overwrite committed cards.

## 11. Open questions

- **When the deck's script settles, does the landing page quote a live figure or a narrated
  one?** §7 says live, following the sibling. The number itself is not knowable until the
  script is final and rehearsed.
- **Does the talks index need a card of its own before there is a second talk?** The sibling
  has one. With one deck the index is a signpost, and its card may be redundant with the
  deck's.
