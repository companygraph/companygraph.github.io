# companygraph/talks — working conventions

Talks on [CompanyGraph](https://companygraph.io/), served at `companygraph.io/talks/`. This
repository is the index page and the deck; `companygraph.github.io` is everything else on the
domain. See the plan and spec under `docs/superpowers/` for what is built and why.

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

## The index is a page; the deck is a deck

`index.html` shares companygraph.io's shell, header and footer **verbatim**. The domain is
served by two repositories and a visitor crossing between them must not meet a seam. Changing
that chrome means changing it in both repositories in the same breath: `verify` here can
assert a link is in the tab, never that the page on the other side still exists or still
carries the same item back. The seam this rule prevents is invisible from either repository
alone.

The decks are out of scope: a deck has a transport bar, not a nav.

## "AI" in the deck, "agents" everywhere else — on purpose

The deck says **AI** on slides 00 and 01 and **agents** from 07 on. Nobody has been given
the narrower word at 0:00, and those opening slides are about who can *read* the thing; an
agent is software that *acts* inside the stated rules, which is a claim slides 07 and 08
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
