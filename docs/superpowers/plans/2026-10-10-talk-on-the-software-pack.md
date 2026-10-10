# The talk on the software pack — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The second of the four talks the spec sets out, “Domain-driven design, as pages you can check”, at `/talks/software-pack/`, in English and German, narrated, with both PDFs, its card, its place on `/talks/`, the README and the sitemap, and its link from slide 10 of the talk on core and packs.

**Architecture:** The deck is built from `talks/core-and-packs/index.html` as its shell — the closest deck, with this talk family's window, levels picture and still-frame scene — plus a `scenes.js` that types slide 09's terminal and a `tts/generate.py` copied unchanged. It is registered in the same places the first talk was, and lands in the same commits under the same seats. The site's pin, mental-model a34e033, already holds every page the slides rest on, so no re-pin comes first.

**Tech Stack:** HTML and CSS in the site's deck design, `deck.js` and `deck.css` from `@robertblust/design` at the pinned tag, plain JavaScript for the scene, Python 3 and the ElevenLabs API for the clips, Playwright for the PDFs and the card, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-10-talks-on-core-and-packs-design.md`, sections 2, 4 and 7.

## Global Constraints

- The worktree is `~/git/companygraph/companygraph.github.io-talk-on-the-software-pack`, on the branch `talk-on-the-software-pack`. Every command below runs there.
- Commits are authored by their seat at `companygraph.io` — `git commit --author "<Seat> <seat@companygraph.io>"` — with the trailers `Process`, `Phase`, `Track` and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, in the git register of `conventions/WRITING.md`, ending the body with a `Verified:` line. An agent never merges without the owner's word.
- English is en-US, curly quotes, spaced em-dash, no serial comma. German is de-CH and is made only after the owner has reviewed the English, by the translator, then the editor without the English, then the back-reader; the owner picks where they flag.
- The terms the owner settled for the first talk hold here: «core» and «Pack» kept, «das Software-Pack», «Begriffe», «Ebene», «Aggregate», and the DDD types in English in German prose — Bounded Contexts, Concept Designs, Domain Events, Feature Designs.
- No number that still moves, on a slide, in a note or in a picture's `aria-label`. The tooling's own output in a window is exempt and is shown as the run printed it.
- Every slide names the pages of companygraph/mental-model it rests on, and every chip opens `../../?stage=expanded#<id>`, an id in `company.json` at the pin.
- A window that shows a page shows its lines as the page has them; a line left out is not silently dropped from the middle — the window ends where it stops, or shows `…`.
- The chips, the windows and the tooling's output stay English in both languages.
- `ELEVENLABS_API_KEY` is taken with `eval "$(grep '^export ELEVENLABS_API_KEY=' ~/.zshrc)"` and never printed.
- `npm run pdf` re-renders every deck; the other decks' PDFs are put back with `git checkout -- talks/intro/*.pdf talks/obsidian-plugin/*.pdf talks/levels/*.pdf talks/what-stays/*.pdf talks/core-and-packs/*.pdf` before committing.

## Review Focus

- A window showing a page with a line missing or added that the page does not have: Task 3 Step 5 diffs every window against its page at the pin.
- A claim on a slide that only the note qualifies: each slide's visible text must hold without its note, which the owner's read in Task 3 Step 8 and the final review check.
- German longer than English: no box overflows at 1280×720, 1024×768 and 360px, and the cover clears the transport at 1024×768 and 1112×834 (Task 4 Step 6).
- The terminal's still frame under reduced motion and in the PDF: it shows the command and every line (Task 3 Step 7).
- Slide 10 of the first talk linking a talk that does not resolve: `npx design links` (Task 3 Step 7).

---

### Task 1: Slide 09's run, again

No commit. It gives slide 09 its output word for word.

- [ ] **Step 1: Break one name on a copy of our model at the pin**

```bash
S=$(mktemp -d); git clone -q ~/git/companygraph/mental-model "$S/m"; cd "$S/m"; git checkout -q a34e033
sed -i '' 's/^| Declaration | one | drawn by |$/| Declarations | one | drawn by |/' model/bounded-contexts/resolution/concept-designs/edge.md
npx --yes github:companygraph/meta-model#v0.90.0 check </dev/null; echo "exit $?"
```

Expected, as on 2026-10-10: exit 1, and these lines:

```text
✗ 1 problem in model/ against meta/core, meta/software, meta/organization, meta/landscape/ at core 0.65.0

  model/bounded-contexts/resolution/concept-designs/edge.md: `Concept` in "## Relations" is declared `ref → concept-design` and says "Declarations", which names no entity in model/; a declared reference must resolve, and the concept-design it matches here is "Declaration" (R4)
  not checked: every `## Writing rules` in every schema — that is the agent pass, R0
```

- [ ] **Step 2: Decide**

If the output differs, slide 09's terminal takes the new output and its note is checked against it. Remove `$S`.

### Task 2: Pages the slides show, read at the pin

No commit. It gives Task 3 the exact lines its windows show.

- [ ] **Step 1: Print the heads**

```bash
cd ~/git/companygraph/mental-model
for f in bounded-contexts/resolution/resolution.md bounded-contexts/resolution/aggregates/graph.md bounded-contexts/checking/checking.md feature-designs/a-name-that-names-nothing-is-reported-where-it-is-written.md; do echo "=== $f"; git show a34e033:model/$f; done
for f in entity edge scope declaration graph; do echo "$f: $(git show a34e033:model/bounded-contexts/resolution/concept-designs/$f.md | grep -m1 '^kind:')"; done
```

Expected: Resolution has `classification: core`, `realizes: Core` and the decision “A reference resolves by its declared type, never by name alone”; the aggregate Graph has `root: Graph`, `members: Edge, Scope`, invariants INV-R1 to INV-R7 and two rows under `## Handled commands`; Checking's `## Relationships` has `Resolution | conformist` and `Vendoring | shared kernel`; the feature design has `refines: Checks an instance runs`, `contexts: Resolution`, an operational principle and scenarios SC-C1 onward; Entity, Edge, Scope and Declaration are value objects and Graph is an entity.

### Task 3: The talk in English

**Files:**

- Create: `talks/software-pack/index.html`, `talks/software-pack/scenes.js`
- Modify: `talks/index.html` (a row after core-and-packs), `verify/check.mjs` (an entry after core-and-packs), `talks/core-and-packs/index.html` (slide 10's software row becomes a link)

**Interfaces:**

- Consumes: the shell of `talks/core-and-packs/index.html` — its head, its CSS for `.feat`, `.lv`, `.talks`, `.win`, the window classes, the cover and the transport — and its `scenes.js` with the `typed` helper.
- Produces: twelve `<section class="slide">` with ids `s-cover`, `s-method`, `s-context`, `s-language`, `s-aggregate`, `s-map`, `s-feature`, `s-departs`, `s-joins`, `s-check`, `s-later`, `s-close`, each with `data-notes` and `data-time`, and `data-scene="check"` on `s-check`.

- [ ] **Step 1: Copy the shell**

```bash
mkdir -p talks/software-pack && cp talks/core-and-packs/index.html talks/software-pack/index.html && cp talks/core-and-packs/scenes.js talks/software-pack/scenes.js
```

In the copy: replace every `talks/core-and-packs/` with `talks/software-pack/`; the title, `og:title`, `og:image:alt`, the JSON-LD `WebPage` and `BreadcrumbList` names with `CompanyGraph — Domain-driven design, as pages you can check`; the description, `og:description` and both `TALK` descriptions with the cover's subtitle (Step 3); both `TALK` titles with the English title. Delete every `data-de`, `data-de-href` and `data-notes-de` except the chrome's (`Vorträge`, the `data-de-aria` of the switchers) and each chip label's `data-de="beruht auf"`. Replace the twelve sections with this talk's. Delete the `.choose` CSS. Keep `.lv`, `.talks`, `.win`, the cover's title size and every mobile rule. Rewrite the comment that opens “this talk” to name this talk's pictures.

- [ ] **Step 2: Add the one picture this talk adds**

A two-column list for the departures, after the `.talks` CSS:

```css
  /* where the pack departs: what the source does, and what the pack does instead */
  .departs{list-style:none; display:flex; flex-direction:column; gap:1.4cqmin; width:100%}
  .departs li{display:grid; grid-template-columns:1fr 1fr; gap:2.4cqmin; padding:1.4cqmin 2.2cqmin; align-items:baseline;
              background:var(--raise); border:1px solid var(--rule); border-radius:1cqmin; font-size:clamp(.85rem,1.8cqmin,1.3rem); line-height:1.35}
  .departs .was{color:var(--dim)}
  .departs .is{color:var(--ink)}
```

and in the closing mobile block `.departs li{grid-template-columns:1fr; gap:1vw}`.

- [ ] **Step 3: Draft the English with the writer**

Build the twelve sections with first-pass titles from the spec's table (§4) and the pictures below, then dispatch the `writer` subagent with this brief and the file, as for the first talk: it edits only each slide's `h1`, `.sub`, visible picture text, `aria-label` where its text changes the picture, `data-notes` and `data-time` (150 words a minute), and the cover subtitle in its five places. The notes' voice and length follow `talks/core-and-packs/index.html`.

Audience: someone who already works in domain-driven design. The one point: the pack writes DDD's own words down as pages, held to their boundary by a check, and departs from its sources only where a page needs it to. Mental-model files below are under `~/git/companygraph/mental-model/model/` at a34e033; the pack is `~/git/companygraph/meta-model/packs/software/` at v0.90.0.

| # | id | Picture | Facts, and where each is shown | Rests on |
| --- | --- | --- | --- | --- |
| 0 | `s-cover` | title lockup | spec §4 | concept Pack `01a0c2a7-ffa8-7e6f-a9a4-1e4a30240f37` |
| 1 | `s-method` | `.talks` list of the sources, each a link: Evans, *Domain-Driven Design Reference*; Vernon, *Domain-Driven Design Distilled*; the DDD Crew's Bounded Context Canvas, Aggregate Design Canvas and Context Mapping; Jackson, *The Essence of Software*; Cucumber's Gherkin reference — URLs from the pack README's Sources table | The pack takes its types from domain-driven design and names its sources (pack README, first line and Sources) | concept Pack |
| 2 | `s-context` | `.win`: the head of `bounded-contexts/resolution/resolution.md` — frontmatter, H1, tagline, `## Responsibilities` and its first two items, then `…` | A bounded context is the boundary within which one model and one language hold (pack README types table); Resolution's responsibilities, classification `core` and `realizes: Core` (the page) | bounded-context Resolution `01a0faaa-5d02-71db-bcdb-f672c4324bee` |
| 3 | `s-language` | `.win` titled `bounded-contexts/resolution/concept-designs/`: one line per concept design, its name and `kind:` | A concept design is a term of a context's language, an entity or a value object, owned by its context (pack README); Resolution's five and their kinds (Task 2) | concept-designs Entity `01a105f9-65d8-71c9-9c2d-8749093e59a3`, Edge `01a0faae-d24f-77ec-b7ad-bc05c556c781`, Scope `01a0faae-d24f-7b8c-9d2a-23c38b301344`, Declaration `01a0faae-d24f-746e-9e5a-feb86a53dde1`, Graph `01a0faae-d24d-74b8-ac6d-73dc448cbe5d` |
| 4 | `s-aggregate` | `.win`: the aggregate Graph's frontmatter (`root`, `members`), H1, tagline, INV-R1 and INV-R2, then `## Handled commands` with its header and first row | An aggregate is a cluster of concept designs kept consistent as one unit; a domain event is a type because other contexts name it, and a command is a row because nothing outside its aggregate does (pack README and its departures) | aggregate Graph `01a0faae-d24f-7363-b997-383d2b553a2e`, domain-event Name found unresolvable `01a0faae-d24f-72bf-ab89-23fa90ef75c1` |
| 5 | `s-map` | `.win`: Checking's `## Relationships` table, header and both rows | A relationship between contexts is a row on the downstream context (spec §4, pack design); Checking is a conformist to Resolution and shares a kernel with Vendoring (the page) | bounded-context Checking `01a10042-5ce7-7756-9ce4-1cf2a4435aa2` |
| 6 | `s-feature` | `.win`: the feature design's frontmatter (`refines`, `contexts`), H1, `## Operational principle` and its sentence, and SC-C1's heading and its Given line | A feature design says how a feature is built across the contexts it touches, with an operational principle (Jackson) and scenarios in Gherkin (the page; pack README Sources) | feature-design A name that names nothing is reported where it is written `01a10031-6925-7b3c-8f04-87b19b4f6103` |
| 7 | `s-departs` | `.departs`: four rows, “the source does” · “the pack does”: classification on the subdomain · on the context; a domain event and a command both patterns · an event a type, a command a row; an architecture decision record · core's `decision`; one type column · `Term` for a term of the context, `Type` for a plain type | Pack README “Where it departs from its sources”, all four, with their reasons | decision A reference resolves by its declared type, never by name alone `01a0dd52-bc30-75db-ae2a-efe33658a439` |
| 8 | `s-joins` | `.lv`: one level-1 band “bounded context · concept design · feature design” over one level-0 band “domain · concept · feature”, and the `.arrow` “realizes · refines · refines” | A context realizes a core domain, a concept design refines a core concept, a feature design refines a core feature; every edge from the pack to core is optional and core names none of them (Resolution, Entity's `refines: Entity`, the feature design; pack README; R20) | domain Core `01a0c29a-9610-7d3a-a3de-244a58f09307`, feature Checks an instance runs `01a0c29a-9610-7863-a9a5-c9d2ef01c3ff` |
| 9 | `s-check` | `.win.term`, `data-scene="check"`: `$ companygraph check`, then Task 1's three lines as `.l.o` | A name is looked for only within the type its column declares and, for an owned type, within its owner, so Publishing, Resolution and Serving each keep their own Entity; a name that names nothing fails where it is written (the aggregate's INV-R2 and INV-R3; Task 1's run; the three Entity pages) | concept-designs Entity under Publishing `01a105f9-65d8-7256-8032-219d45760551` and Serving `01a105f9-65d8-74af-9303-19ac4f66ad04`, concept Check `01a0c2a7-ffa8-70b3-a43c-a1b44e906b46` |
| 10 | `s-later` | `.talks` list without links: services, repositories, factories and modules; C4's system, container and component; a type for a relationship between contexts; commands as a type; a subdomain type; a `level` field; read models and policies as types, from Event Modeling | Pack README “Left for later”, as it stands at v0.90.0, including why a policy is a row today (the `Reaction` on a Consumes row) and why a read model waits (for an instance that writes one) | concept Pack |
| 11 | `s-close` | `.lv`, both bands lit | Your ubiquitous language, held to its own boundary by a check (spec §4) | concept Pack |

- [ ] **Step 4: Write `scenes.js`**

In the copy, replace `S.take = typed(60, 480);` with `S.check = typed(70, 520);`, and the opening comment's slide number and window with slide 09's terminal.

- [ ] **Step 5: Hold every window to its page**

For slides 02 to 06, set each window's lines against Task 2's output: every line the window shows is a line of the page at a34e033, in order, and a window that stops early ends in `…`. Then check every chip:

```bash
node -e '
const fs=require("fs");const g=JSON.stringify(require("./company.json"));
const ids=[...fs.readFileSync("talks/software-pack/index.html","utf8").matchAll(/stage=expanded#([0-9a-f-]{36})/g)].map(m=>m[1]);
const miss=[...new Set(ids)].filter(i=>!g.includes(i));console.log(ids.length,"chips;",miss.length?"missing "+miss.join(" "):"all in company.json");process.exit(miss.length?1:0)'
```

Expected: `all in company.json`, exit 0.

- [ ] **Step 6: Register the talk, and link it from the first talk**

In `talks/index.html`, after the core-and-packs row:

```html
      <div class="talkrow">
      <a class="talk" href="software-pack/">
        <span class="t">Company<em>Graph</em> — Domain-driven design, as pages you can check</span>
        <span class="meta mono"><b>N min</b></span>
        <span class="d">Bounded contexts, their language, aggregates, events and feature designs as pages a check holds, and where the pack departs from Evans and the DDD Crew. Each slide names the pages of our own model it rests on.</span>
      </a>
      <p class="dl mono"><a href="software-pack/">Watch the talk</a><span class="sep">·</span><a href="software-pack/software-pack-en.pdf">Download PDF</a></p>
      </div>
```

with `N` the notes' `data-time` summed and rounded. In `verify/check.mjs`, after the core-and-packs entry, an entry copied from it with `path: "/talks/software-pack/"`, `title: /Domain-driven design, as pages you can check/`, `slides: 12`, `links: ["https://blust.ch/", …every source URL slide 01 links…]`, no `translates` yet, and the comment “The sixth deck, the software pack, built as the talk on core and packs and checked the same way. Its outbound links are the chrome's blust.ch and slide 01's sources.” In `talks/core-and-packs/index.html`, slide 10's software row: the `<span>` holding “Domain-driven design, as pages you can check” becomes `<a href="../software-pack/">` with the same `data-de`, so the German stays.

- [ ] **Step 7: Run the suite and look at the still frames**

```bash
PORT=$(python3 -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])'); ./node_modules/.bin/design serve --port $PORT & SERVER_PID=$!; sleep 1; BASE=http://127.0.0.1:$PORT npm run verify; V=$?; npx design links --base http://127.0.0.1:$PORT; L=$?; kill $SERVER_PID; echo "verify $V links $L"
sh conventions/conventions-check
```

Expected: the only failures are the German of the new `/talks/` row and of the title, the card, the PDF link and the sitemap entry, which Tasks 4 and 6 bring; conventions-check passes. Screenshot every slide at 1600×900 and at 390px with `.active` toggled per slide, as for the first talk, and read slide 09's terminal: the command and all three lines.

- [ ] **Step 8: The owner reads it — STOP**

Serve with `npm run serve` and give the owner `http://localhost:8000/talks/software-pack/`. Their corrections go in and Steps 5 to 7 run again. Nothing below starts until the owner says the English is right.

- [ ] **Step 9: Commit as the Implementer**

```bash
git add talks/software-pack/index.html talks/software-pack/scenes.js talks/index.html verify/check.mjs talks/core-and-packs/index.html
git commit --author "Implementer <implementer@companygraph.io>" -F - <<'EOF'
A talk shows domain-driven design as pages a check holds

<what no talk said; the twelve slides from the sources through a bounded context, its language, an aggregate and an event, the context map and a feature design to where the pack departs, how it joins core, what the check holds and what is left for later, each slide naming the pages of our model it rests on; built from the talk on core and packs with a scenes.js that types slide 09's terminal from a real run; listed on /talks/, checked by verify, and linked from slide 10 of the first talk.>

Verified: <Step 5's chip check, Step 7's verify and links, conventions-check, and the owner's read>.

Process: Delivery
Phase: Implement
Track: Prose
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 4: The talk in German

On the owner's word about the English.

**Files:** Modify `talks/software-pack/index.html`, `talks/index.html` (the new row), `verify/check.mjs`.

- [ ] **Step 1: The translator** — dispatch `translator` on the deck and the new row, as for the first talk, with the terms in Global Constraints and `talks/core-and-packs/index.html`'s German as the house's settled German for this talk family. It reports each value and its term doubts.
- [ ] **Step 2: The editor** — extract the German alone into a scratch file labeled by slide, as for the first talk, and dispatch `editor` on that file only.
- [ ] **Step 3: The back-reader** — with the editor's corrections and each flag's first option in (sent to the translator to apply), extract again and dispatch `backreader` on that file only; set its literal English against the English, value by value, and send every value whose meaning moved back to the translator.
- [ ] **Step 4: The owner chooses — STOP** — put the translator's term doubts to the owner, with alternatives, and apply what they pick through the translator.
- [ ] **Step 5: The language check** — add `translates: { lang: "de", shows: ["<a phrase of the German cover subtitle>"], hides: ["<the same phrase in English>"], id: "langDe", backId: "langEn" },` to the verify entry.
- [ ] **Step 6: Run and read** — Task 3 Step 7's suite: the only failures left are the card, the PDF link and the sitemap entry. Strip the German from a copy and diff it, whitespace-normalized, against the committed English: empty. No box overflows in German at 1280×720, 1024×768 and 360px, and the cover's lowest element sits above the transport's top at 1024×768 and 1112×834.
- [ ] **Step 7: Commit as the Translator**, in the form of `3ee2a3e`'s message: what the German covers, what the editor and the back-reading found, the owner's choices, and `Verified:` with Step 6's results.

### Task 5: The talk is narrated

**Files:** Create `talks/software-pack/tts/generate.py` (a copy), `talks/software-pack/audio/{en,de}/NN.{mp3,sha}`; Modify `.github/workflows/ci.yml`, `pins.json`, `talks/index.html` (the row's German length).

- [ ] **Step 1: Copy and dry-run**

```bash
mkdir -p talks/software-pack/tts && cp talks/core-and-packs/tts/generate.py talks/software-pack/tts/ && chmod +x talks/software-pack/tts/generate.py
(cd talks/software-pack/tts && ./generate.py --dry-run)
```

Expected: 24 lines saying `would write`.

- [ ] **Step 2: Generate and recheck**

```bash
(cd talks/software-pack/tts && eval "$(grep '^export ELEVENLABS_API_KEY=' ~/.zshrc)" && ./generate.py && ./generate.py --dry-run)
```

Expected: 24 generated, then `generated 0, unchanged 24`.

- [ ] **Step 3: The German length** — sum `afinfo`'s estimated duration over `audio/de/*.mp3`, round to the minute, and set the row's `<b>` to `<b data-de="N min">M min</b>`, as the other rows carry it.
- [ ] **Step 4: Hold the clips to the notes** — in `.github/workflows/ci.yml`, after the core-and-packs step, a step named “Clips still say what the notes say (software pack)” copied from it with `talks/software-pack/tts`; in `pins.json`'s `verify`, after the core-and-packs line, `"(cd talks/software-pack/tts && ./generate.py --dry-run)",`.
- [ ] **Step 5: Commit as the Narrator**, in the form of `9d153b0`'s message, `Process: Narrating`, `Phase: Narrate`, `Track: Clip`.

### Task 6: PDFs, card, README and sitemap

**Files:** Modify `export-pdf.mjs`, `og-recipe.mjs`, `build/jsonld.mjs`, `README.md`, `sitemap.xml`, `talks/og.png`, `talks/og.sha`; Create `talks/software-pack/software-pack-{en,de}.pdf`, `talks/software-pack/og.{png,sha}`.

- [ ] **Step 1: Register the deck** — `export-pdf.mjs`: append `{ dir: "talks/software-pack", slug: "software-pack" }`; `og-recipe.mjs`: after the core-and-packs card, `{ dir: "talks/software-pack", ...FRAME, hide: DECK_HIDE, titleSlide: true, settle: "wait:900" },`; `build/jsonld.mjs`: after the core-and-packs line, `{ file: "talks/software-pack/index.html", head: PAGE_HEAD },`.
- [ ] **Step 2: The README** — after the `/talks/core-and-packs/` row, `| \`/talks/software-pack/\` | CompanyGraph — Domain-driven design, as pages you can check: a bounded context, its language, an aggregate, an event, the context map and a feature design as pages, where the pack departs from its sources and how it joins core — English and German, narrated, with a PDF in each language. |`; in Contents, after the `talks/core-and-packs/` item, `- \`talks/software-pack/\` — the sixth deck, built from the fifth, with a \`scenes.js\` that types slide 09's terminal, under the same still-frame rule.`; and `talks/software-pack/og.png` after `talks/core-and-packs/og.png` in the list of cards.
- [ ] **Step 3: The sitemap** — add `<url><loc>https://companygraph.io/talks/software-pack/</loc><lastmod>…</lastmod></url>` after the core-and-packs line by hand, since `design sitemap` dates only the addresses it lists.
- [ ] **Step 4: Build** — `npm run pdf`, put the other decks' PDFs back, then `npm run pages && npm run og && npm run sitemap`. Expected: two PDFs of twelve pages each, the card from the title slide, `talks/og.png` re-rendered.
- [ ] **Step 5: Run the verify list** — every command in `pins.json`'s `verify`, each exit code read on its own, and `npx markdownlint-cli2 README.md`. Expected: all 0.
- [ ] **Step 6: Commit as the Implementer**, in the form of `e5a0c1f`'s message, `Track: Code`.

### Task 7: The pull request

- [ ] **Step 1: Read the state again** — `git fetch`, `gh pr list`; if `main` moved, merge it in as “Main merged into talk-on-the-software-pack” (Implementer, `Track: Code`), taking `main`'s side in generated files and pins, rebuilding, and running Task 6 Step 5 again.
- [ ] **Step 2: Push and open — on the owner's word** — `git push -u origin talk-on-the-software-pack` and `gh pr create` with the commit bodies reread for a reviewer, ending with the Claude Code line.
- [ ] **Step 3: Report the checks and stop.** The owner merges.
