# The talk on the landscape pack — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The third pack talk, “Your landscape, in ArchiMate's words”, at `/talks/landscape-pack/`, in English and German, narrated, with both PDFs, its card, its place on `/talks/`, the README and the sitemap, and its link from slide 10 of the talk on core and packs.

**Architecture:** The deck is built from `talks/software-pack/index.html` as its shell — the latest deck of the series, with the window, the levels picture, the two-column list and the sources list — with no animated scene, since no slide shows a run, and a `tts/generate.py` copied unchanged. It is registered where the other two pack talks are and lands in the same commits under the same seats. The site's pin, mental-model fc2e6ad, holds every page the slides rest on, so no re-pin comes first.

**Tech Stack:** HTML and CSS in the site's deck design, `deck.js` and `deck.css` from `@robertblust/design` at the pinned tag, Python 3 and the ElevenLabs API for the clips, Playwright for the PDFs, the card and the fit checks, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-10-talks-on-core-and-packs-design.md`, sections 2, 6 and 7.

## Global Constraints

- The worktree is `~/git/companygraph/companygraph.github.io-talk-on-the-landscape-pack`, on the branch `talk-on-the-landscape-pack`. Every command below runs there.
- Commits are authored by their seat at `companygraph.io`, with the trailers `Process`, `Phase`, `Track` and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, in the git register of `conventions/WRITING.md`, ending the body with a `Verified:` line. An agent never pushes or merges without the owner's word.
- English is en-US, curly quotes, spaced em-dash, no serial comma. German is de-CH and is made only after the owner has reviewed the English, by the translator, the editor without the English, then the back-reader; the owner picks where they flag.
- The terms the owner settled for this series hold: «core» and «Pack» kept, «das Landscape-Pack», «Begriffe», «Ebene», «Prosa».
- No number that still moves on a slide, in a note or in an `aria-label`.
- Every slide names the pages of companygraph/mental-model it rests on, and every chip opens `../../?stage=expanded#<id>`, an id in `company.json` at the pin. Two chips with the same name carry what tells them apart.
- A window shows its page's lines as the page has them at fc2e6ad, in order; a cut is marked `…`; only blank lines may be left out unmarked. English text in a window must not carry guillemets, which the English typography check refuses.
- A slide's visible text holds without its note, and no slide or note says more than its page or the pack's README at meta-model e208de4.
- The chips, the windows, the sources' own names and the pack's type names in mono stay English in both languages.
- `ELEVENLABS_API_KEY` is taken with `eval "$(grep '^export ELEVENLABS_API_KEY=' ~/.zshrc)"` and never printed.
- `npm run pdf` re-renders every deck; the other decks' PDFs are put back before committing, except a deck whose page this branch changed.

## Review Focus

- A window that misstates its page: Task 2 Step 4 holds every window to its page at fc2e6ad.
- A claim on a slide that only its note qualifies, or a claim the README does not make: the owner's read and the final review.
- A window or a list taller than the slide at 1024×768 and 1112×834: Task 2 Step 6 holds every slide clear of the transport at four sizes in both languages.
- German longer than English: the same fit check in German, and no sideways scroll at 320px and 360px.
- Slide 10 of the first talk linking a talk that does not resolve: `npx design links`.

---

### Task 1: The pages the slides show, read at the pin

No commit.

- [ ] **Step 1: Print the pages**

```bash
cd ~/git/companygraph/mental-model
for f in system-kinds/deployment.md systems/mcp-server.md systems/chat-server.md systems/github.md data-objects/snapshot.md services/mcp-endpoint.md; do echo "=== $f"; git show fc2e6ad:model/$f; done
git -C ~/git/companygraph/meta-model show e208de4:packs/landscape/README.md
```

Expected: Deployment has `element: application-component`; the MCP server has `kind: Deployment`, `owner: Owner`, `processor: Google Cloud`, `part-of: Cloud Run`; the chat server's `## Connects to` has rows to the MCP server (`As` Streamable HTTP, `Service` MCP endpoint), the Claude API and TypeSafe; GitHub's `## Holds` has Instance through Repository as `master`; the MCP server holds Instance through Snapshot as `reads`; the MCP endpoint has `provided-by: MCP server` and `realizes: An agent reads the model`.

### Task 2: The talk in English

**Files:**

- Create: `talks/landscape-pack/index.html`
- Modify: `talks/index.html` (a row after software-pack), `verify/check.mjs` (an entry after software-pack), `talks/core-and-packs/index.html` (slide 10's landscape row becomes a link)

**Interfaces:**

- Consumes: the shell of `talks/software-pack/index.html`: its head, the CSS for `.feat`, `.lv`, `.talks`, `.departs`, `.win`, the cover and the transport, and its mobile rules.
- Produces: twelve `<section class="slide">` with ids `s-cover`, `s-method`, `s-kind`, `s-system`, `s-connects`, `s-holds`, `s-service`, `s-mapping`, `s-departs`, `s-joins`, `s-later`, `s-close`, each with `data-notes` and `data-time`, and no `data-scene`.

- [ ] **Step 1: Copy the shell and replace the slides**

Copy `talks/software-pack/index.html` to `talks/landscape-pack/index.html`. Replace `talks/software-pack/` with `talks/landscape-pack/`, the title in every place with `CompanyGraph — Your landscape, in ArchiMate's words`, the description in its five places with the cover's subtitle, and both `TALK` strings with the English. Delete every `data-de`, `data-de-href` and `data-notes-de` except the chrome's and each chip label's `data-de="beruht auf"`. Remove `<script src="scenes.js" defer></script>`. Rewrite the “this talk” comment to name this talk's pictures: a window on a page, the two levels, the two-column list for the mapping and the departures, the sources list. Replace the twelve sections with this talk's, the table in Step 3.

- [ ] **Step 2: Draft the English with the writer**

Dispatch the `writer` subagent with the brief below and the file, as for the software talk: it edits only each slide's `h1`, `.sub`, visible picture text outside the windows, an `aria-label` its text changes, `data-notes` and `data-time` at 150 words a minute, and the cover subtitle in its five places. Audience: an enterprise architect who already models a landscape in ArchiMate. The one point: the pack writes ArchiMate's elements down as pages a check holds, maps them both ways, and departs from ArchiMate and LeanIX only where its README says why.

- [ ] **Step 3: The slides**

| # | id | Picture | Facts, and where each is shown | Rests on |
| --- | --- | --- | --- | --- |
| 0 | `s-cover` | title lockup | spec §6 | concept Pack `01a0c2a7-ffa8-7e6f-a9a4-1e4a30240f37` |
| 1 | `s-method` | `.talks` list, each a link: The Open Group, ArchiMate 4 Specification; The Open Group, ArchiMate Model Exchange File Format; LeanIX, Application lifecycle — URLs from the README's Sources | the pack's first line and Sources | concept Pack |
| 2 | `s-kind` | `.win`: `model/system-kinds/deployment.md` — frontmatter, H1, tagline | a system is one type where ArchiMate has six internal active structure elements; its kind is a page in the company's words that carries the element once (README) | system-kinds Deployment `01a1256e-57e2-7acc-a706-3177ef8b8dac`, Platform `01a1256e-6753-7f8e-bb52-acb594077fbe`, SaaS `01a1256e-7726-7a24-8893-05b527b55325` |
| 3 | `s-system` | `.win`: `model/systems/mcp-server.md` — frontmatter, H1, tagline | a system names its kind, is owned by a seat, names the data processor behind it where it handles personal data, and runs on another through `part-of` (README; the page) | systems MCP server `01a1256e-8662-7925-9097-a884e87a2658`, Cloud Run `01a1256e-a48a-7d64-ae90-32f51de52f77` |
| 4 | `s-connects` | `.win`: the chat server's `## Connects to` table, header, separator and its rows | a row is written on the side that takes the data, the interface's name in `As`, the service it calls in `Service`; the join is held by the checker (README) | system Chat server `01a1256e-95a8-7252-a79b-d83322045bb1`, service MCP endpoint `01a1256f-009b-7dca-b327-76f8b78a27cf`, system Claude API `01a1256e-e202-757e-8a03-e1c9e58b174a` |
| 5 | `s-holds` | `.win`: GitHub's `## Holds` table, header, separator and its row(s) | a row names a concept, the data object that keeps it in `Data object` and the access; one system holds each concept as `master`; GitHub holds the Instance through the Repository as master, and the MCP server reads it as a Snapshot (README; the pages) | system GitHub `01a1256e-d242-7df9-8f04-c0aed47a1c12`, data-objects Repository `01a12590-0c79-750e-820f-b0a8daa484f4` and Snapshot `01a12590-1b8b-7246-9275-8a7b98436b7b`, concept Instance `01a0c2a7-ffa8-7986-8fbe-c785f2c74afe` |
| 6 | `s-service` | `.win`: `model/services/mcp-endpoint.md` — frontmatter, H1, tagline | a service is what a system exposes to others, provided by the systems that expose it, realizing the feature the business sees (README; the page) | service MCP endpoint, feature An agent reads the model `01a0c29a-9610-7599-88be-da45e0941d77` |
| 7 | `s-mapping` | `.departs`: rows “ArchiMate 4” · “here” chosen from the README's mapping: the six elements → a system whose kind's `element` names it; an interface → the `As` of a Connects to row; a data object → a data object, realizing its business object; access with its mode → a Holds row; function and artifact → dropped | the mapping is the contract a generator reads in both directions; what never comes back is what it says is dropped (README) | concept Pack |
| 8 | `s-departs` | `.departs`: rows “where” · “what the pack does”, from the README's departures: one type for six elements; an interface a row; triggering read as flow; behavior nobody uses dropped; access in three tokens; lifecycle in four stages | the README's departures, each with its reason | concept Pack |
| 9 | `s-joins` | `.lv`: a level-1 band “system · service · data object” over a level-0 band “process · feature · concept · seat”, the `.arrow` “serves · realizes · realizes · owns” | a system serves a process and realizes a feature, a service realizes a feature, a data object realizes a concept, a seat owns a system; every edge to core is optional and core names none of the pack's types (README; R20; Cloud Run's `serves: Answering`; the MCP endpoint; Snapshot's `realizes: Instance`) | process Answering `01a0ccd4-cfb0-782a-a360-4d14ec035b92`, feature An agent reads the model, concept Instance, seat Owner `01a0c202-d668-762c-9cde-906f08564df0`, data-processor Google Cloud `01a107e8-e5b5-7adf-97e6-c0264f27d6f8` |
| 10 | `s-later` | `.talks` list without links, `.tk` “later”: the README's “Left for later” | the README's list at e208de4 | concept Pack |
| 11 | `s-close` | `.lv`, both bands lit | spec §6 | concept Pack |

- [ ] **Step 4: Hold every window to its page, and check the chips**

Run the window check of the software talk's ledger, `windows.py`, pointed at `talks/landscape-pack/index.html` and `fc2e6ad`: expected `windows: all hold`. Run the chip check against `company.json`: expected `all in company.json`.

- [ ] **Step 5: Register the talk, and link it from the first talk**

In `talks/index.html`, after the software-pack row, a row in the same form with the title, `N min` from the summed `data-time`, the description “Systems, their kinds, what they connect to and hold, and the services they expose, as pages mapped to ArchiMate 4 in both directions. Each slide names the pages of our own model it rests on.” and the PDF link `landscape-pack/landscape-pack-en.pdf`. In `verify/check.mjs`, after the software-pack entry, an entry copied from it with `path: "/talks/landscape-pack/"`, `title: /Your landscape, in ArchiMate's words/`, `slides: 12`, `links: ["https://blust.ch/", "https://pubs.opengroup.org/architecture/archimate4-doc/", "https://www.opengroup.org/xsd/archimate/", "https://docs-eam.leanix.net/"]`, no `translates` yet. In `talks/core-and-packs/index.html`, slide 10's landscape row's title `<span>` becomes `<a href="../landscape-pack/">` with the same `data-de`.

- [ ] **Step 6: Run the suite, the fit check and the screenshots**

The verify suite and `npx design links` against a local server: the only failures are the German of the new row and of the title, the card, the PDF link and the sitemap entry. The fit check of the software talk's ledger, `fit.mjs`, pointed at `/talks/landscape-pack/`: every slide clears the transport at 1600×900, 1280×720, 1024×768 and 1112×834; no sideways scroll at 320px and 390px. Read every slide's screenshot at 1600×900.

### Task 3: The English narration, at the owner's ask, before their read

**Files:** Create `talks/landscape-pack/tts/generate.py` (a copy), `talks/landscape-pack/audio/en/NN.{mp3,sha}`.

- [ ] **Step 1:** copy the generator from `talks/software-pack/tts/`, dry-run (12 `would write`, English only), generate, dry-run again (`unchanged 12`).
- [ ] **Step 2:** serve with `npm run serve` and check the first and last clips load with status 200.
- [ ] **Step 3: The owner reads and listens — STOP.** Nothing is committed past the plan until the owner says the English is right; their corrections go in, clips of changed notes are generated again, and Task 2 Steps 4 and 6 run again. Then the English is committed as the Implementer, in the form of `f58b786`'s message.

### Task 4: The talk in German

As the software talk's Task 4: translator, editor on the German alone, back-reader on the German alone, the owner's term choices, the `translates` check, the run and read in German at every size, the commit as the Translator.

### Task 5: The German narration and the Narrator commit

As the software talk's Task 5: German clips, the row's German length, the CI step and the `pins.json` line, the commit as the Narrator with both languages' clips.

### Task 6: PDFs, card, README and sitemap

As the software talk's Task 6, for `talks/landscape-pack/` and slug `landscape-pack`; the talk on core and packs gets its PDFs and card stamp again, since its slide 10 gains the link.

### Task 7: The final review and the pull request

A fresh review of the whole branch on the most capable model; a fix pass for what matters to a visitor, each fix with a check that fails first; then, on the owner's word, push and `gh pr create`; the owner merges.
