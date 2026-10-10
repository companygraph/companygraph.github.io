# The talk on the organization pack — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The talk on the organization pack, “Two lines through one company”, at `/talks/organization-pack/`, in English and German, narrated, with both PDFs, its card, its place on `/talks/`, the README and the sitemap, and its link from slide 10 of the talk on core and packs.

**Architecture:** The deck is built from `talks/software-pack/index.html` as its shell, with no animated scene, since no slide shows a run, and a `tts/generate.py` copied unchanged. Its chips open our model at the landing page's graph, as the other talks do, and the example company at `../../example/?stage=expanded#<id>`, where our model has nothing to show: each such chip's label ends in “· example”. It is registered where the other pack talks are and lands in the same commits under the same seats. The site's pins, mental-model fc2e6ad and meta-model e208de4, hold every page the slides rest on, so no re-pin comes first.

**Tech Stack:** HTML and CSS in the site's deck design, `deck.js` and `deck.css` from `@robertblust/design` at the pinned tag, Python 3 and the ElevenLabs API for the clips, Playwright for the PDFs, the card and the fit checks, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-10-talks-on-core-and-packs-design.md`, sections 2, 5 and 7.

## Global Constraints

- The worktree is `~/git/companygraph/companygraph.github.io-talk-on-the-organization-pack`, on the branch `talk-on-the-organization-pack`. Every command below runs there.
- Commits are authored by their seat at `companygraph.io`, with the trailers `Process`, `Phase`, `Track` and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, in the git register of `conventions/WRITING.md`, ending the body with a `Verified:` line. An agent never pushes or merges without the owner's word.
- English is en-US, curly quotes, spaced em-dash, no serial comma. German is de-CH and is made only after the owner has reviewed the English, by the translator, the editor without the English, then the back-reader; the owner picks where they flag.
- The terms the owner settled for this series hold: «core» and «Pack» kept, «das Organization-Pack», «Begriffe», «Ebene», «Prosa», «Jobs» for the type `job`.
- No number that still moves on a slide, in a note or in an `aria-label`.
- Every slide names the pages it rests on: a chip into our model opens `../../?stage=expanded#<id>`, an id in `company.json`; a chip into the example company opens `../../example/?stage=expanded#<id>`, an id in `example.json`, and its label ends in “· example”.
- A window shows its page's lines as the page has them at the pin — mental-model fc2e6ad, or meta-model e208de4 under `example/model/` for the example company —, in order; a cut is marked `…`; only blank lines may be left out unmarked. English text in a window must not carry guillemets, which the English typography check refuses.
- A slide's visible text holds without its note, and no slide or note says more than its page or the pack's README at meta-model e208de4. The example company is called the example company, as the site calls it.
- The chips, the windows, the sources' own names and the pack's type names in mono stay English in both languages.
- `ELEVENLABS_API_KEY` is taken with `eval "$(grep '^export ELEVENLABS_API_KEY=' ~/.zshrc)"` and never printed.
- `npm run pdf` re-renders every deck; the other decks' PDFs are put back before committing, except a deck whose page this branch changed.

## Review Focus

- A window that misstates its page: Task 2 Step 4 holds every window to its page at its pin.
- A chip into the example company that opens nothing: Task 2 Step 4 checks each against `example.json`, and Task 2 Step 6 opens one in a browser.
- A claim on a slide that only its note qualifies, or a claim the README does not make: the owner's read and the final review.
- A window or a list taller than the slide at 1024×768 and 1112×834: Task 2 Step 6 holds every slide clear of the transport at four sizes in both languages.
- German longer than English: the same fit check in German, and no sideways scroll at 320px and 360px.
- Slide 10 of the first talk linking a talk that does not resolve: `npx design links`.

---

### Task 1: The pages the slides show, read at the pins

No commit. Print `groups/maintainers.md`, `jobs/maintainer.md`, `jobs/co-maintainer.md` and `group-kinds/team.md` from mental-model at fc2e6ad, and `groups/management.md`, `groups/engineering.md`, `groups/legal.md`, `groups/billing-run-team.md`, `group-kinds/department.md`, `group-kinds/team.md`, `group-kinds/staff-unit.md` and `jobs/backend-engineer.md` from meta-model at e208de4 under `example/model/`, and the organization pack's README there.

### Task 2: The talk in English

**Files:** Create `talks/organization-pack/index.html`; Modify `talks/index.html` (a row after software-pack), `verify/check.mjs` (an entry after software-pack), `talks/core-and-packs/index.html` (slide 10's organization row becomes a link).

**Interfaces:** twelve sections with ids `s-cover`, `s-method`, `s-group`, `s-seat`, `s-line`, `s-professional`, `s-team`, `s-staff`, `s-openings`, `s-departs`, `s-later`, `s-close`, each with `data-notes` and `data-time`, no `data-scene`.

- [ ] **Step 1: Copy the shell** from `talks/software-pack/index.html` as the software talk's plan, Task 3 Step 1, does, with the title `CompanyGraph — Two lines through one company`, and without `scenes.js`.
- [ ] **Step 2: Draft the English with the writer**, as for the other pack talks. Audience: someone who designs organizations or runs HR and already draws a company's units and its reporting lines. The one point: the pack writes the two lines a company actually runs on down as pages, the disciplinary through the people a unit names and the professional through the jobs a group guides, and departs from the ontology and SAP only where its README says why.
- [ ] **Step 3: The slides**

| # | id | Picture | Facts, and where each is shown | Rests on |
| --- | --- | --- | --- | --- |
| 0 | `s-cover` | title lockup | spec §5 | concept Pack (ours) |
| 1 | `s-method` | `.talks` list, each a link: W3C, The Organization Ontology; schema.org, department; SAP, Organizational Management in SAP HCM; HR-XML 3.1, ReportsToPositionType; Gabler, Einliniensystem; Gabler, Mehrliniensystem; Gabler, Stelle | the README's Sources, which list more; the pack is vocabulary for a company of more than one person | concept Pack |
| 2 | `s-group` | `.win`: the example's `group-kinds/department.md` head | a group is a unit or a team drawn from units, its kind tells them apart and says whether it stands in the disciplinary line (`in-line`) | group-kinds Department and Team · example |
| 3 | `s-seat` | `.win`: our `groups/maintainers.md`, H1, tagline and its `## People` | a job is what a person is employed as, the same wherever they sit; a seat is core's responsibility in a process; the job names the seats a person in it usually holds; our team names the agent and the two voices with no job | group Maintainers, job Maintainer, job Co-Maintainer, seat Owner (ours) |
| 4 | `s-line` | `.win`: the example's `groups/management.md`, its `## People` with a Lead and a Staff row | the disciplinary line runs through the people a unit names and up through `part-of`: each answers to the person whose `Place` is `Lead`; a person carries no field naming a superior | groups Management and Engineering · example |
| 5 | `s-professional` | `.win`: the example's `groups/engineering.md` frontmatter with `part-of` and `guides` | the professional line is a group's `guides`, naming jobs wherever the people who do them sit | group Engineering, job Backend Engineer · example |
| 6 | `s-team` | `.win`: the example's `groups/billing-run-team.md` — frontmatter with `kind: Team` and `start`, and its `## People` | a team is drawn from people who keep their units; a temporary group has `start` and `end`, not a status | group Billing Run Team · example |
| 7 | `s-staff` | `.win`: the example's `groups/legal.md` frontmatter — `kind: Staff Unit`, `rank`, `part-of` | a staff unit is a group of a kind with `staff: yes`, standing in the line beside the head it serves; a staff person's `Place` is `Staff`; `rank` orders groups across the type | group-kind Staff Unit, group Legal · example |
| 8 | `s-openings` | `.win`: the example's Engineering `## Openings` table | a group says which positions it is looking to fill while they are open, as rows, not a position object that outlives its holders | group Engineering · example |
| 9 | `s-departs` | `.departs`: rows “where” · “what the pack does”, from the README: two lines named by their right; two lines where the ontology has one `reportsTo`; no superior field on a person; `group` rather than organizational unit; an opening a row; the staff flag on the kind | the README's departures with their reasons | concept Pack |
| 10 | `s-later` | `.talks` list without links, `.tk` “later”: the README's “Left for later” | the README's list at e208de4 | concept Pack |
| 11 | `s-close` | `.lv`: a level-1 band “group · group kind · job” over a level-0 band with core's `seat` and `profile`, both lit | the chart you draw and the one people work in, both as pages; the first talk says how a company chooses its packs | concept Pack |

- [ ] **Step 4: Hold every window to its page and check the chips** — the window check pointed at each window's page at its pin; the chip check against `company.json` for chips into our model and `example.json` for chips into the example.
- [ ] **Step 5: Register the talk, and link it from the first talk** — a row on `/talks/` after the software-pack row, a verify entry with slide 01's outbound links, and slide 10's organization row in the first talk becomes `<a href="../organization-pack/">` with its `data-de` kept.
- [ ] **Step 6: Run the suite, the fit check and the screenshots** — the only verify failures are the German of the new row and of the title, the card, the PDF link and the sitemap entry; every slide clears the transport at four sizes; no sideways scroll at 320px and 390px; one example chip opened in a browser lands on its node.

### Task 3: The English narration, at the owner's ask, before their read

Copy the generator, generate the English clips, dry-run again, serve on a free port, and STOP for the owner. The English and the clips are committed only after the owner's read.

### Tasks 4 to 7

As the software talk's plan, Tasks 4 to 7: German, German narration and the Narrator commit, PDFs, card, README and sitemap, then the final review and the pull request on the owner's word.
