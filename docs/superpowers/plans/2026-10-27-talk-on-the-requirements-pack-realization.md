# The talk on the requirements pack: how far a release meets it — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slides `s-realized` and `s-levels` join the talk on the requirements pack after `s-rule`, `s-departs` gains the README's satisfy and verify row, and `s-later` drops satisfy and verify, first in English with their narration for the owner's read, then in German, narrated, with both PDFs and the card.

**Architecture:** The deck is `talks/requirements-pack/index.html` as it stands; the two new slides reuse its `.win` and `.departs` pictures, so no CSS changes. The kickers after `s-rule` move two places on, the verify entry counts sixteen slides, the listing's length is re-measured, and the narration generator writes the clips of the changed and the moved notes. The slides rest on companygraph/mental-model 9d63a78, which `takes-realization` pins.

**Tech Stack:** as the October 12 plan: the site's deck design from `@robertblust/design` at the pinned tag, Python 3 and the ElevenLabs API for the clips, Playwright for the PDFs, the card and the fit checks, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-27-talk-on-the-requirements-pack-realization-design.md`, with the October 12 design and §2 and §7 of `2026-10-10-talks-on-core-and-packs-design.md`.

## Global Constraints

- The worktree is `~/git/companygraph/companygraph.github.io-talk-realization`, on the branch `talk-requirements-pack-realization`, stacked on `takes-realization`; every command runs there.
- The October 12 plan's Global Constraints hold, with the pin read as 9d63a78 and the README as v0.95.0, and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No count of requirements or use cases at a level on a slide, in a note or in an `aria-label`.
- The new slides' chips: requirement A list arrives in pages that neither repeat nor skip `01a1312d-73b9-71de-84f0-e15974164afa`; requirement-realization Verified `01a17bea-82fe-74d4-9219-4ca297178fb8`, Released `01a17bea-922c-7f68-9b5f-8f3c0fc4c8e1`, Partly released `01a17bea-a18b-7c35-ba56-3c91e4e7a512`, Not released `01a17bea-b14e-7e0e-93eb-b7c404142871`; use-case Walk a long list a page at a time `01a1312c-7bf1-7220-aac8-2909c906829e`; concept Pack `01a0c2a7-ffa8-7e6f-a9a4-1e4a30240f37`. Each must be in `company.json` at the pin.
- The status of how far the specification answers a requirement, and the word status for what the pack holds, are named once in a note and never on a slide.
- No company other than CompanyGraph is named.

## Review Focus

- The window on slide 9 misstating its page at 9d63a78, the Evidence row's URL cut so its tag no longer shows: Task 1 Step 3.
- The `.departs` list on slide 10 or the extra row on slide 11 taller than the slide at 1024×768 and 1112×834: Task 1 Step 5.
- A kicker, the counter or an audio filename off by the two new slides: Task 1 Step 5 and the generator's dry run in Task 2.
- A claim in a note the README at v0.95.0 or the pages at 9d63a78 do not make: the owner's read and the final review.

---

### Task 1: The four slides in English

**Files:** Modify `talks/requirements-pack/index.html`, `verify/check.mjs` (`slides: 14` → `16`), `talks/index.html` (the row's length).

- [ ] **Step 1: Insert the two slides** after `s-rule`, each a `<section class="slide"` with `data-time`, `data-notes` and no `data-notes-de` yet: `s-realized` with a `.feat` lead and a `.win` on `model/requirements/a-list-arrives-in-pages-that-neither-repeat-nor-skip.md` (frontmatter, H1, `…`, `## Evidence` with header, separator and three rows), `s-levels` with a `.feat` lead and a `.departs` list of the four requirement levels, `` `Verified` · `verifies` `` and so on on the left, each level's tagline on the right. Renumber every kicker's `data-n` after `s-rule`.
- [ ] **Step 2: Draft the English with the writer:** the writer of `conventions/WRITER.md` edits only the two new slides' `h1`, `.sub`, `aria-label`, `data-notes` and `data-time`, `s-departs`'s new row and its note's new sentence, and `s-later`'s row and note, with the spec's §2 and §3 as the brief, the notes' voice and length from the slides around them.
- [ ] **Step 3: Hold the window to its page:** the October 12 plan's Task 2 Step 5 script over the deck at 9d63a78: expected `windows: all hold` and `all in company.json`.
- [ ] **Step 4: Update the verify entry and the listing:** `slides: 16`; the listing's minutes from the summed `data-time`.
- [ ] **Step 5: Build, suite, fit and screenshots:** as the October 12 plan's Task 2 Step 7; the only failures are the German of the changed slides.

### Task 2: The English narration, served for the owner's read

- [ ] **Step 1:** `talks/requirements-pack/tts/generate.py --dry-run` names the clips to write (the two new slides, the two changed notes, and every slide whose number moved); generate them; dry-run again: all unchanged.
- [ ] **Step 2:** `npm run serve` on the LAN; the new clips load with 200.
- [ ] **Step 3: The owner reads and listens — STOP.** Nothing past the spec and the plan is committed until the owner says the English is right. Then the English is committed as the Writer and the clips as the Narrator.

### Task 3: The German, its narration, the PDFs and the card

As the October 12 plan's Tasks 4 to 6 for the four slides: translator, editor on the German alone, back-reader, the owner's picks, the `translates` check, the German clips, both PDFs, the card, `sitemap`, each committed as its seat.

### Task 4: The final review and the pull request

A fresh review of the branch on the most capable model, a fix pass, then, on the owner's word, push and `gh pr create`, linked above #368 with `gh stack link`; the owner merges from the bottom.
