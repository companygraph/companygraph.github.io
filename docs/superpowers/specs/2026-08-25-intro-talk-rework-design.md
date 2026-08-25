# CompanyGraph intro talk — rework

> The deck at `companygraph.io/talks/intro/`, re-aimed: from explaining a published model to
> putting an idea up for scrutiny.

Status: design agreed, nothing built.

## 1. Purpose, and what this supersedes

The deck's job changes. Today it explains the model and leads with the claim that two companies
converged on one shape. After this it is the CompanyGraph counterpart of
`guestgraph.io/talks/intro/`: the same opening frame, the same close, the same tone — the
presenter wants to be told where it is wrong.

This spec **supersedes §2 and §3** of
[`2026-08-24-companygraph-talks-design.md`](2026-08-24-companygraph-talks-design.md) — the arc
and the reasoning behind it. That spec's §4–§11 stand unchanged: repository, index page,
language and notes, narration, the independence of `blust.ch/talks/mental-model/`,
verification, and its open questions. The older spec is not rewritten; it carries a header
pointing here.

### Non-goals

- A new visual design. The deck keeps its chrome, its token block and its slide layouts.
- Redesigning the talks index. It is updated to describe the new deck (§6), nothing more.
- Linking to the personal deck. Still decided against, in the older spec's §8.
- Any type count, type list, or shipped/not-shipped statement on a slide.

---

## 2. Why the spine changes

The older spec made *convergence* the spine because it is the strongest claim the project has.
Rehearsed, it confuses: the audience has to hold two companies they know nothing about before
they have been shown a single page of the model. The evidence arrives before the thing it is
evidence for.

The personal deck's spine works because it is concrete before it is general: the brain, one
page, one reference, one gate — then the payoff. The audience sees the shape before it is asked
to believe anything about it. That spine comes back, and convergence becomes what it actually is
in the argument: one sentence of provenance on the slide that introduces the brain.

The GuestGraph deck adds the frame the personal deck never needed: *this is not finished, and I
am here to be argued with*. The title and the close carry it; the middle stays declarative. A
deck that hedges on every slide sounds unsure of itself. One that states the idea plainly and
then asks four hard questions sounds like it means them.

---

## 3. The arc

Twelve slides, about twelve minutes. Times are targets for the notes, not constraints on the
build.

| # | Title (working) | ≈ | Says |
|---|---|---|---|
| 0 | An idea, put up for scrutiny | 0:45 | What CompanyGraph is in one sentence; open source; not finished; *I want pushback, not applause* |
| 1 | Everywhere — and nowhere | 1:00 | Every company runs on knowledge; all of it is written down somewhere; no two people look in the same place |
| 2 | Writing it down is not the hard part | 0:50 | What is written ages and nobody notices when; so you ask a person again — the tax a company pays every day |
| 3 | The brain | 1:15 | Text slide in the form of the personal deck's slide 2: headline *one structured knowledge base — the brain of the company*, sub-line *the facts as Markdown, structured by a meta-model*, stamp *not new documentation but a projection of how the company runs — versioned like code*. **Provenance, one sentence:** built inside one company; a company of one turned out to need the same shape. No names, no figure |
| 4 | One page per thing | 1:00 | A role, a rule, a KPI is a page; its H1 is its name; what owns parts keeps them in its own folder |
| 5 | References, not links | 1:00 | Pages refer to each other by the name of the thing; a name that resolves to nothing is an error; nothing is lost silently |
| 6 | The breadth | 1:10 | The personal deck's slide 3: a grid of areas, each with a gloss — *roles & teams · who does what*, *processes & gates · how work flows*, *strategy & objectives · where we invest*, *KPIs · what we measure*, *rules · what we enforce*, *concepts · what we define*, *decisions · what we decided*, *values · what we believe*, *people · who we are*. The whole vocabulary the design names, not the part that ships; two or three picked out in the notes; a company of one leaves cells empty, and that is fine |
| 7 | A gate as data | 1:10 | Proposal → built: who signs off, what must be true, which rule stands behind it; checkable, not culture |
| 8 | It pays twice | 1:10 | People: onboarding by role, "who owns this?", one answer for everyone. Agents: the same page to read, acting inside rules you wrote. Never "no hallucinations" — it shrinks what they have to guess |
| 9 | Markdown, checked by agents | 1:00 | The schemas are Markdown and an agent enforces them; deliberately not JSON Schema. The thesis: with the right meta-model, prose *is* the schema — not a stage on the way to one |
| 10 | What would make it usable | 1:15 | Three things, stated as intent: a real company described in it — the presenter's own, one person, in the open; a CLI in the manner of spec-kit that scaffolds an instance, adds entities from a schema, checks it, upgrades it in place and exports it as an agent skill; a validator after that. *Which of these exist, the roadmap says* — a link, never a status |
| 11 | Tell me where this is wrong | 1:00 | The four questions (§4), in full on the slide; *a no is worth more to me than a polite yes*; the GitHub org |

What moves from the current deck:

- Slides 1, 2, 4, 5, 7, 8 keep their visuals and most of their notes.
- The current slide 3 (convergence) is replaced by the brain, a text slide with one line of
  provenance. The current slide 4 stays the page slide, figure and all.
- The current slide 6 is rebuilt as the grid. It shows the whole vocabulary on purpose: the deck
  argues the shape, and a grid trimmed to what has shipped would age the moment the next type
  lands — which is the status claim §5 forbids, made visually.
- The current slide 9 ("uncomfortably honest") goes. Its honest half survives in slide 10's
  last sentence: the roadmap says what exists.
- The current slide 10 (one question) becomes slide 11 with four.
- Slides 9 and 10 are new. Slide 9 is the one the older spec planned as its slide 8 and the
  built deck never received; the close's second question depends on it having been argued.

---

## 4. The four questions

Ordered from the shape outward, so each presupposes the previous one was answered:

1. **Where does your company not fit this shape?** — the model itself.
2. **Would you keep this as Markdown checked by agents — or do you need a real schema language
   before you trust it?** — the thesis, slide 9.
3. **Would you set up your own instance with a CLI like spec-kit — or is copying a folder of
   schemas enough?** — the tooling, slide 10.
4. **Would you pay for help building one — time and material, nothing hosted — or is that
   something you only do yourselves?** — the consulting model.

Question 4 is the one the site's `CLAUDE.md` guards against: the site makes no offer. Neither
does the slide. It asks whether an offer would be wanted, which is exactly what `/billing/` says
is being validated. The notes say so in as many words, so a later edit cannot turn the question
into a pitch without contradicting the note beside it.

As in the GuestGraph close: the questions are on the slide in full, the presenter reads them,
and then stops. The notes end with *listen, do not defend*.

---

## 5. The rules this touches

- **The site's `CLAUDE.md`.** "Slide 9 says 'not all of it is written yet, the roadmap says
  what is'" becomes slide 10, and the rule takes its new form: *name the plan, never the
  status*. A slide may say what the project intends to build; it may never say what it has
  built, because the deck is the one medium that cannot be edited cheaply.
- **"AI" in the deck, "agents" everywhere else** holds. Slides 0–2 say AI; slide 8 onward
  says agents, because slide 8 is where an agent is shown acting inside stated rules. The
  `CLAUDE.md` paragraph that names slides 00, 01, 07 and 08 is renumbered with the deck.
- **Nothing identifying the source companies** holds for the multi-person one. The company of
  one is the presenter, and slide 10 names it as *mine* because the reference instance the
  roadmap promises is public by design.
- **No type count, no type list read aloud.** Slide 6's grid names *areas* with a gloss, the
  way the personal deck does, not core's types — "roles & teams", not `role` and `group`. It is
  the vocabulary the design names, complete, and it is never counted or read out; the notes
  pick two or three. What has shipped of it is the roadmap's sentence, not this slide's.
- **`package.json`** for the deck says "A 10-minute talk"; it becomes twelve.
- **Never claim "no hallucinations"** — unchanged, and slide 8's notes keep the sentence that
  says so.

---

## 6. Verification and what regenerates

- Verify by rendering, never by reading the diff: both languages, both OS colour schemes, and a
  phone width. Unchanged from the older spec's §10.
- `verify/check.mjs`: any assertion on the slide count moves to twelve. Slide numbers stay
  zero-based everywhere a viewer sees them, so the last slide is `11` in the kicker, the counter
  and the audio filename.
- Narration: every changed note regenerates one clip through the content hash; untouched slides
  keep theirs. Both PDFs re-export.
- `intro/og.png` re-renders from the new title slide, with `og.sha` beside it in the same
  commit; `npm run og:check` is what proves the card moved with the page.
- The talks index at `/talks/` is updated to describe the new deck — its length, its one-line
  description, and the PDFs it links — and its `og.png` re-renders if the page moved.
- The landing page's quoted talk length and the org profile's "New here?" line change to the
  new length — the one restated fact this project allows a page to carry.

---

## 7. Open questions

- **The grid's exact cells.** The nine above are the personal deck's, with *features* and
  *architecture decisions* — product vocabulary, pack material in the design — folded into
  *decisions*, and *people* added. Settled in the build against the design spec's §4.
- **The narrated length.** Twelve minutes is the target; the number the landing page quotes is
  whatever the narration actually runs to, following the older spec's §7.
