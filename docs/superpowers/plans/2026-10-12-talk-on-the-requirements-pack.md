# The talk on the requirements pack — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The fifth talk of the series, “What someone wants, and what the product is held to”, at `/talks/requirements-pack/`, first in English with its narration for the owner's read, then in German, narrated, with both PDFs, its card, its place on `/talks/`, the README, the sitemap and its link from slide 10 of the talk on core and packs.

**Architecture:** The deck is built from `talks/landscape-pack/index.html` as its shell, the latest deck of the series and the one with the tabbed window of drawn pictures and its `scenes.js`, which this talk keeps for three tabs. Its pictures are three entries in `build/talk-pictures.mjs`, drawn by the site's build with the server at the site's pin. It is registered where the other pack talks are and lands in the same commits under the same seats. The site's pins at f13d43a hold every page the slides rest on, so no re-pin comes first.

**Tech Stack:** HTML and CSS in the site's deck design, `deck.js` and `deck.css` from `@robertblust/design` at the pinned tag v0.151.0, companygraph-mcp-server v0.68.0 for the pictures, Python 3 and the ElevenLabs API for the clips, Playwright for the PDFs, the card and the fit checks, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-12-talk-on-the-requirements-pack-design.md`, with §2 and §7 of `2026-10-10-talks-on-core-and-packs-design.md`.

## Global Constraints

- The worktree is `~/git/companygraph/companygraph.github.io-talk-on-the-requirements-pack`, on the branch `talk-on-the-requirements-pack`. Every command below runs there.
- Commits are authored by their seat at `companygraph.io`, with the trailers `Process`, `Phase`, `Track` and `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`, in the git register of `conventions/WRITING.md`, ending the body with a `Verified:` line. An agent never pushes or merges without the owner's word.
- English is en-US, curly quotes, spaced em-dash, no serial comma. German is made only after the owner has reviewed the English, by the translator, the editor without the English, then the back-reader; the owner picks where they flag.
- The terms the owner settled for this series hold: «core» and «Pack» kept, «das Requirements-Pack» after «das Landscape-Pack», «Begriffe», «Ebene», «Prosa»; the chat's German for the shapes, Anwendungsfall, Szenario and Anforderungen, holds for the captions.
- No number that still moves on a slide, in a note or in an `aria-label`: the model's fifteen use cases and thirty-two requirements are never counted on a slide.
- Every slide names the pages of companygraph/mental-model it rests on, and every chip opens `../../?stage=expanded#<id>`, an id in `company.json` at the pin.
- A window shows its page's lines as the page has them at 26ad32b, in order; a cut is marked `…`; only blank lines may be left out unmarked. English text in a window must not carry guillemets.
- A slide's visible text holds without its note, and no slide or note says more than its page or the pack's README at v0.94.0.
- The chips, the windows, the sources' own names and the pack's type and field names in mono stay English in both languages.
- `ELEVENLABS_API_KEY` is taken with `eval "$(grep '^export ELEVENLABS_API_KEY=' ~/.zshrc)"` and never printed.
- `npm run pdf` re-renders every deck; the other decks' PDFs are put back before committing, except a deck whose page this branch changed.

## Review Focus

- A window that misstates its page: Task 2 Step 5 holds every window to its page at 26ad32b.
- A claim on a slide that only its note qualifies, or a claim the README does not make: the owner's read and the final review.
- A window or a list taller than the slide at 1024×768 and 1112×834, the extensions table above all: Task 2 Step 7 holds every slide clear of the transport at four sizes.
- The three pictures drawn in the visitor's browser, never at build, since each carries a mark: `browser: true` on all three entries, and the build refusing otherwise.
- Slide 10 of the first talk linking a talk that does not resolve: `npx design links`.

---

### Task 1: The pages the slides show, read at the pin

No commit.

- [ ] **Step 1: Print the pages**

```bash
cd ~/git/companygraph/mental-model
for f in use-cases/ask-the-company-a-question.md use-cases/read-the-model-from-an-agent.md use-cases/walk-a-long-list-a-page-at-a-time.md requirements/a-question-is-answered-in-the-language-of-its-words.md requirements/a-visitor-is-told-before-the-first-message-that-an-agent-answers.md requirements/a-broken-reference-is-marked-when-the-line-is-left.md requirements/a-german-reader-reads-the-vocabulary-pages-in-german.md requirements/an-instance-may-make-its-own-ids-under-a-declared-pattern.md requirements/no-call-changes-the-model.md rules/a-visitor-is-told-an-agent-answers.md; do echo "=== $f"; git show 26ad32b:model/$f; done
git -C ~/git/companygraph/meta-model show v0.94.0:packs/requirements/README.md
```

Expected: Ask the company a question has `level: user goal`, `scope: system`, `primary-actor: Visitor`, two features, three stakeholders, a trigger, eight steps and eleven extensions, four minimal and two success guarantees; Read the model from an agent has `includes: Walk a long list a page at a time`, which is a `subfunction` in scope `component` with actor Agent; the requirement on the language is `functional` `must` applying to the use case; the one on the first message `follows` the rule; the four of slide 7 have the kinds and modalities the spec's table names.

### Task 2: The talk in English

**Files:**

- Create: `talks/requirements-pack/index.html`, `talks/requirements-pack/scenes.js` (a copy of the landscape talk's)
- Modify: `build/talk-pictures.mjs` (three entries after the landscape talk's), `talks/index.html` (a row after landscape-pack), `verify/check.mjs` (an entry after landscape-pack), `talks/core-and-packs/index.html` (slide 10 gains the requirements row as a link)

**Interfaces:**

- Consumes: the shell of `talks/landscape-pack/index.html`: its head, the CSS for `.feat`, `.lv`, `.talks`, `.departs`, `.win`, `.win.drawn` and its tabs, the cover and the transport, and its mobile rules; `scenes.js`'s `tabs` scene.
- Produces: fourteen `<section class="slide">` with ids `s-cover`, `s-method`, `s-usecase`, `s-stakeholders`, `s-scenario`, `s-extensions`, `s-requirement`, `s-kinds`, `s-rule`, `s-departs`, `s-joins`, `s-later`, `s-drawn`, `s-close`, each with `data-notes` and `data-time`, `s-drawn` with `data-scene="tabs"` and three tabs `tab-usecase`, `tab-scenario`, `tab-requirements` over panes `panel-usecase`, `panel-scenario`, `panel-requirements`, each pane holding the picture markers `<!-- picture: usecase -->` and so on that `pages.mjs` fills.

- [ ] **Step 1: The three pictures**

In `build/talk-pictures.mjs`, after the landscape entries:

```js
  // One use case of our own model three ways: in its scope with its actor, features and requirements,
  // as its scenario, and what it is held to.
  { page: "talks/requirements-pack/index.html", name: "usecase", from: "company", model: "../../", browser: true, request: { shape: "usecase", id: "01a1312c-4d5f-7923-b896-700a5ce8d15f" } },
  { page: "talks/requirements-pack/index.html", name: "scenario", from: "company", model: "../../", browser: true, request: { shape: "scenario", id: "01a1312c-4d5f-7923-b896-700a5ce8d15f" } },
  { page: "talks/requirements-pack/index.html", name: "requirements", from: "company", model: "../../", browser: true, request: { shape: "requirements", id: "01a1312c-4d5f-7923-b896-700a5ce8d15f" } },
```

`GITHUB_TOKEN=$(gh auth token) npm run build` after Step 2 writes `talks/requirements-pack/pictures/{usecase,scenario,requirements}.json`; expected `usecase` with six nodes, `scenario` with four and `requirements` with three.

- [ ] **Step 2: Copy the shell and replace the slides**

Copy `talks/landscape-pack/index.html` to `talks/requirements-pack/index.html` and `scenes.js` beside it. Replace `talks/landscape-pack/` with `talks/requirements-pack/`, the title in every place with `CompanyGraph — What someone wants, and what the product is held to`, the description in its five places with the cover's subtitle, and both `TALK` strings with the English. Delete every `data-de`, `data-de-href`, `data-de-aria` and `data-notes-de` except the chrome's and each chip label's `data-de="beruht auf"`. Rewrite the “this talk” comment. Replace the thirteen sections with this talk's fourteen, the table in Step 4; the drawn slide keeps the landscape talk's window with a third tab.

- [ ] **Step 3: Draft the English with the writer**

Dispatch the `writer` subagent with the brief below and the file: it edits only each slide's `h1`, `.sub`, visible picture text outside the windows, an `aria-label` its text changes, `data-notes` and `data-time` at 150 words a minute, and the cover subtitle in its five places. The notes' voice and length follow `talks/landscape-pack/index.html`. Audience: a requirements engineer who already writes use cases in Cockburn's form and requirements in a standard's. The one point: the pack writes their own words down as pages a check holds, says where it departs and why, and the server draws a use case from those pages.

- [ ] **Step 4: The slides**

| # | id | Picture | Facts, and where each is shown | Rests on |
| --- | --- | --- | --- | --- |
| 0 | `s-cover` | title lockup | spec §3 | concept Pack `01a0c2a7-ffa8-7e6f-a9a4-1e4a30240f37` |
| 1 | `s-method` | `.talks` list, each a link: Cockburn and Jacobson, Use-Case Foundation; Cockburn, Basic use case template; OMG, UML 2.5.1 clause 18; Jacobson, Spence and Bittner, Use-Case 2.0; ISO/IEC/IEEE 29148:2018; IREB, CPRE glossary; Volere, requirement snow card; RFC 2119 — URLs from the README's Sources | the pack's first line and Sources | concept Pack |
| 2 | `s-usecase` | `.win`: `model/use-cases/ask-the-company-a-question.md` — frontmatter, H1, tagline | a use case is all the ways of using a system to achieve one goal for one actor (README); level, scope, primary actor and features (the page) | use-case Ask the company a question `01a1312c-4d5f-7923-b896-700a5ce8d15f`, feature A visitor asks the model `01a0d646-a0a0-74f1-95d4-cacbba20c3ab`, seat Visitor `01a0ccd4-cfb0-7641-9793-c30711c38403` |
| 3 | `s-stakeholders` | `.win`: the `## Stakeholders and interests` table, header, separator and its three rows, then `…`, then `## Minimal guarantees` with its first two items and `## Success guarantees` with its first item | the two guarantees are two sections under Cockburn's own headings, not one table with a kind column (README departures) | use-case Ask the company a question |
| 4 | `s-scenario` | `.win`: `## Trigger` and its sentence, then `## Main success scenario` with header, separator and steps 1 to 4, then `…` | a step's actor resolves to a seat where the company has one and a step that calls another use case names it, drawn from `includes` (README); Read the model from an agent includes Walk a long list a page at a time, a subfunction (the pages) | use-case Ask the company a question, use-case Read the model from an agent `01a1312c-5cfc-7c71-bd35-b7da880c4254`, use-case Walk a long list a page at a time `01a1312c-7bf1-7220-aac8-2909c906829e` |
| 5 | `s-extensions` | `.win`: `## Extensions` with header, separator and rows 1a, 2a, 3a, 3b, 4a, then `…` | an extension is a condition at a step and what happens then; a step may branch more than once (the page) | use-case Ask the company a question |
| 6 | `s-requirement` | `.win`: `model/requirements/a-question-is-answered-in-the-language-of-its-words.md` — frontmatter, H1, tagline, `## Fit criterion` and its sentence, `## Applies to` with its row | a requirement is one statement a product is held to with the measure that shows it met (README); kind, modality, fit criterion and what it applies to (the page) | requirement A question is answered in the language of its words `01a1312d-4501-7e47-abc4-8b179c53d140` |
| 7 | `s-kinds` | `.departs`: rows “kind · modality” · the requirement's title: quality · must · A broken reference is marked when the line is left; functional · should · A German reader reads the vocabulary pages in German; functional · may · An instance may make its own ids under a declared pattern; constraint · must · No call changes the model | three kinds and RFC 2119's three words, a should the rule lacks and must not written in the statement (README departures); the four pages | requirements `01a1312e-1130-7910-857a-3e4af9bfce31`, `01a1312d-9384-77bc-a0e9-c22318bb2902`, `01a1312c-ba31-768b-ab88-cf336c1c4884`, `01a1312d-a32d-711b-bcd8-29582f3f4110` |
| 8 | `s-rule` | `.win`: `model/requirements/a-visitor-is-told-before-the-first-message-that-an-agent-answers.md` — frontmatter with `follows`, H1, tagline, `## Applies to` with its row | a requirement names the company rules it carries into the product (README) | requirement `01a1312c-f784-7d5d-b36c-d380130e0b09`, rule A visitor is told an agent answers (its id from `company.json`), feature A visitor asks the model |
| 9 | `s-departs` | `.departs`: rows “the source does” · “the pack does” from the README's departures: must, must not, may · must, should, may, must not in the statement; one table of guarantees with a kind column · two sections; black-box and white-box · the steps show how far inside; icons and a fifth level · Cockburn's words, the lowest left out; an underlined step · a step whose actor resolves and includes drawn; priority, satisfaction, conflicts, history · none; a success criterion · a quality requirement | the README's departures, each with its reason | concept Pack |
| 10 | `s-joins` | `.lv`: a level-1 band “use case · requirement” over a level-0 band “feature · product · seat · rule”, the `.arrow` “features · applies to · actor · follows” | a use case asks something of a feature and its actors are seats; a requirement applies to a feature, a product or a use case and follows a rule; the software pack's feature design refines the same features; neither pack names the other; every edge optional (README; R20) | feature A visitor asks the model, product CompanyGraph Core (its id from `company.json`), seat Visitor, rule A visitor is told an agent answers |
| 11 | `s-later` | `.talks` list without links, `.tk` “later”: the README's “Left for later” | the README's list at v0.94.0 | concept Pack |
| 12 | `s-drawn` | `.win.drawn` with three tabs, the panes holding the picture markers | the three pictures as the server answers them at the pin; Visitor is a seat nobody holds, so the actor is outlined; the actor's arrow, includes dashed, features solid, a hexagon per requirement; the scenario's boxes in order with their extensions dashed; the requirements framed by kind | use-case Ask the company a question, requirements `01a1312d-4501-7e47-abc4-8b179c53d140` and An answer says where the model does not say `01a1312d-0688-7aba-a96a-fcbd55585385` |
| 13 | `s-close` | `.lv`, both bands lit | spec §3 | concept Pack |

- [ ] **Step 5: Hold every window to its page, and check the chips**

A script in the workspace reads each `.win` of the deck, strips the markup to lines, and finds those lines in order in the page at 26ad32b, skipping blank lines and a line that is `…`: expected `windows: all hold`. A second reads every chip id and finds it in `company.json`: expected `all in company.json`.

- [ ] **Step 6: Register the talk, and link it from the first talk**

In `talks/index.html`, after the landscape-pack row, a row in the same form with the title, `N min` from the summed `data-time`, the description “A use case with its stakeholders, scenario and extensions, and a requirement with its kind, modality and fit criterion, as pages a check holds and the server draws. Each slide names the pages of our own model it rests on.” and the PDF link `requirements-pack/requirements-pack-en.pdf`. In `verify/check.mjs`, after the landscape-pack entry, an entry copied from it with `path: "/talks/requirements-pack/"`, `title: /What someone wants, and what the product is held to/`, `slides: 14`, `links` the README's eight source URLs, no `translates` yet. In `talks/core-and-packs/index.html`, slide 10's list gains `<li><span class="tk">requirements</span><a href="../requirements-pack/">What someone wants, and what the product is held to</a></li>`, its German left to Task 4.

- [ ] **Step 7: Run the build, the suite, the fit check and the screenshots**

`GITHUB_TOKEN=$(gh auth token) npm run build && npm run pages && npm run pictures && npm run pages`, then the verify suite and `npx design links` against a local server: the only failures are the German of the new row and of the title, the card, the PDF link and the sitemap entry. The fit check: every slide clears the transport at 1600×900, 1280×720, 1024×768 and 1112×834; no sideways scroll at 320px and 390px. Read every slide's screenshot at 1600×900, the three tabs of slide 12 among them.

### Task 3: The English narration, served for the owner's read

**Files:** Create `talks/requirements-pack/tts/generate.py` (a copy), `talks/requirements-pack/audio/en/NN.{mp3,sha}`.

- [ ] **Step 1:** copy the generator from `talks/landscape-pack/tts/`, dry-run (14 `would write`, English only), generate, dry-run again (`unchanged 14`).
- [ ] **Step 2:** serve on the LAN with `npm run serve` and check the first and last clips load with status 200.
- [ ] **Step 3: The owner reads and listens — STOP.** Nothing is committed past the plan until the owner says the English is right; their corrections go in, clips of changed notes are generated again, and Task 2 Steps 5 and 7 run again. Then the English is committed as the Implementer and the clips as the Narrator.

### Task 4: The talk in German

As the landscape talk's Task 4: translator, editor on the German alone, back-reader on the German alone, the owner's term choices, the `translates` check, the run and read in German at every size, the commit as the Translator; slide 10 of the first talk gets its German row by the same roles.

### Task 5: The German narration and the Narrator commit

As the landscape talk's Task 5: German clips, the row's German length, the CI step and the `pins.json` line, the commit as the Narrator.

### Task 6: PDFs, card, README and sitemap

As the landscape talk's Task 6, for `talks/requirements-pack/` and slug `requirements-pack`; the talk on core and packs gets its PDFs and card stamp again, since its slide 10 gains the link.

### Task 7: The final review and the pull request

A fresh review of the whole branch on the most capable model; a fix pass for what matters to a visitor, each fix with a check that fails first; then, on the owner's word, push and `gh pr create`; the owner merges.
