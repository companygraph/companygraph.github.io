# Intro Talk Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-aim `talks/intro/index.html` from an eleven-slide explanation of the model into a twelve-slide deck that puts the idea up for scrutiny and closes on four validation questions.

**Architecture:** One self-contained HTML deck; every slide is a `<section class="slide">` with English markup, German in `data-de`, and speaker notes in `data-notes` (German) / `data-notes-en`. The build edits five slides in that file, then re-derives everything downstream of it — narration clips, two PDFs, the share card — and updates the three places that restate the talk's length. `verify/check.mjs` is the test harness: assertions against the rendered DOM, extended first so the build has something to go green.

**Tech Stack:** HTML/CSS by hand. Node + Playwright (`npm run verify`, `npm run og`, `npm run pdf`). Python + ElevenLabs (`tts/generate.py`). No build step.

**Spec:** [`docs/superpowers/specs/2026-08-25-intro-talk-rework-design.md`](../specs/2026-08-25-intro-talk-rework-design.md) — read §3 (the arc), §4 (the questions) and §5 (the rules) before starting. Where plan and spec disagree, the spec wins. The older [`2026-08-24-companygraph-talks-design.md`](../specs/2026-08-24-companygraph-talks-design.md) §4–§11 still govern repository, notes and narration.

## Global Constraints

Copied from the spec and from `CLAUDE.md`. Every task's requirements implicitly include this section.

- **Twelve slides, zero-based `00`–`11`.** The kicker's `data-n`, the counter and the audio filename all say the same number.
- **English markup, German in `data-de`.** Notes are `data-notes` (German) and `data-notes-en` (English). Inside a note, nested markup uses single quotes (`<em class='cue'>`), German quotes are typographic `„…“`, and no HTML comment goes inside a start tag.
- **`<em class='cue'>` is a stage direction and is never spoken.** `<em>` alone is emphasis.
- **`<section class="slide` is a literal** the narration generator splits on; nothing comes between the tag name and `class`.
- **Mono means data.** `.kicker`, `.stamp` and `.mono` only for record values, lengths, URLs, code. `verify` fails mono outside data.
- **Name the plan, never the status.** A slide may say what the project intends to build; never what has shipped, no type count, no type list read out.
- **Never claim "no hallucinations".**
- **"AI" on slides 0–2, "agents" from slide 8 on.**
- **The site makes no offer.** Question 4 asks whether help would be wanted; it never names a rate or a contact.
- **Self-contained.** No external asset; internal paths relative. Outbound links carry `target="_blank" rel="noopener"`.
- **Verify by rendering, never by reading the diff** — both languages, both OS colour schemes, a phone width.
- **`npm run og` never runs in CI**; `og.png` and `og.sha` are committed together with the page that moved.
- **Commits happen when the user asks.** The steps below end in commits because the user asked for a branch and a PR; keep them on `intro-talk-rework`.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `talks/intro/index.html` | the deck — slides, notes, meta, UI strings | slides 03, 06 rewritten; 09, 10, 11 new/replaced; meta + UI descriptions |
| `talks/intro/audio/{en,de}/NN.mp3` + `.sha` | narration, one clip per slide | regenerated for changed slides, `11` added |
| `talks/intro/companygraph-{en,de}.pdf` | printable fallback | re-exported |
| `talks/intro/og.png` + `og.sha` | share card from the title slide | re-rendered |
| `talks/intro/package.json` | description says the length | "12-minute" |
| `talks/index.html` | the talks index | description and `12 min` |
| `index.html` | landing page | `12 minutes · German or English` |
| `verify/check.mjs` | the assertions | slide count, roadmap link, new strings |
| `CLAUDE.md` | the rules | slide numbers, "name the plan, never the status" |
| `../.github/profile/README.md` (repo `companygraph/.github`) | org profile | "twelve-minute" |

Every task runs from the repository root `~/git/companygraph/companygraph.github.io` unless a step says otherwise. `npm run serve` must be running in another terminal for `npm run verify`.

---

### Task 1: Extend the harness first

The deck gains a slide-count assertion, a second outbound link, and the length strings change. Write all of that into `verify/check.mjs` now so every later task is measured against it.

**Files:**
- Modify: `verify/check.mjs` — the `/` spec's `contains` (≈line 32), the `/talks/intro/` spec (≈lines 89–104), and `CHECKS`

**Interfaces:**
- Produces: a `slides` key on a page spec — `slides: 12` — checked by `CHECKS.slides`, which counts `section.slide` in the rendered DOM.

- [ ] **Step 1: Add the `slides` check to `CHECKS`**

Directly after `const CHECKS = {` and its `...DESIGN_CHECKS,` line, add:

```js
  // The deck's length in slides. The arc is twelve slides and the numbering is zero-based
  // everywhere a viewer sees it, so a slide added without its neighbours renumbered — or
  // one dropped by an unclosed attribute swallowing the next <section> — shows up here
  // before it shows up as an audio file that does not exist.
  async slides(page, spec) {
    const n = await page.evaluate(() => document.querySelectorAll("section.slide").length);
    return n === spec.slides ? null : `${n} slides, expected ${spec.slides}`;
  },
```

- [ ] **Step 2: Update the `/talks/intro/` page spec**

Change `links: ["https://companygraph.io/"],` to:

```js
    links: ["https://companygraph.io/",
            "https://github.com/companygraph/meta-model#roadmap"],
    slides: 12,
```

Update the comment above `links` so it no longer says "one outbound link": the closing slide keeps `companygraph.io`; slide 10 points at the roadmap, because the deck names the plan and lets the roadmap say the status.

- [ ] **Step 3: Update the landing page's restated length**

In the `/` spec's `contains`, change `"10 minutes · German or English"` to `"12 minutes · German or English"`.

- [ ] **Step 4: Run verify to see it fail**

Run: `npm run verify`
Expected: `✗ /` on the missing "12 minutes" string, and `✗ /talks/intro/` with `slides: 11 slides, expected 12` and a missing-link failure for the roadmap URL. `/talks/` still passes.

- [ ] **Step 5: Commit**

```bash
git add verify/check.mjs
git commit -m "Assert the deck's new shape before it exists"
```

---

### Task 2: Slide 03 — the brain

Replace the convergence slide with the text slide from the spec's §3, row 3.

**Files:**
- Modify: `talks/intro/index.html` — the `<section>` whose kicker is `data-n="03"` (currently "Two companies. The same shape.")

- [ ] **Step 1: Replace the whole section**

Delete from `<section class="slide"` with `data-n="03"` through its `</section>` and put this in its place:

```html
<section class="slide"
    data-time="1:15"
    data-notes="<em class='cue'>Die Kernidee — ruhig und bestimmt.</em> Genau dafür ist CompanyGraph da: eine strukturierte Wissensbasis, das Gehirn der Firma. Die Fakten als Markdown, strukturiert durch ein Meta-Modell, versioniert wie Code. <em class='cue'>Betonen:</em> Das ist keine neue Dokumentation, die verstaubt — es ist eine Projektion davon, wie die Firma läuft. <em class='cue'>Herkunft, ein Satz, nicht mehr:</em> Gebaut in einer Firma mit Angestellten. Dann stellte sich heraus, dass eine Ein-Personen-Firma genau dieselbe Form braucht. <em class='cue'>Keine Namen. Weiter.</em>"
    data-notes-en="<em class='cue'>The core idea — calm and firm.</em> This is what CompanyGraph is for: one structured knowledge base, the brain of the company. The facts as Markdown, structured by a meta-model, versioned like code. <em class='cue'>Stress:</em> Not new documentation that gathers dust — a projection of how the company runs. <em class='cue'>Provenance, one sentence and no more:</em> Built inside a company with a payroll. Then a company of one turned out to need exactly the same shape. <em class='cue'>No names. Move on.</em>">
    <div class="kicker mono" data-n="03" data-de="Die Idee">The idea</div>
    <h1 data-de="Eine strukturierte Wissensbasis — das <em>Gehirn</em> der Firma.">One structured knowledge base — the <em>brain</em> of the company.</h1>
    <p class="sub" data-de="Die Fakten als Markdown, strukturiert durch ein Meta-Modell, versioniert wie Code.">The facts as Markdown, structured by a meta-model, versioned like code.</p>
    <p class="verdict" data-de="Keine neue Dokumentation, sondern eine Projektion davon, wie die Firma läuft. <em>Gebaut in einer Firma — und eine Ein-Personen-Firma brauchte dieselbe Form.</em>">Not new documentation but a projection of how the company runs. <em>Built inside one company — and a company of one needed the same shape.</em></p>
  </section>
```

`.verdict`, not `.stamp`, carries the provenance: the stamp is mono and this line is prose.

- [ ] **Step 2: Render and look**

Run: `npm run serve` (other terminal), open `http://localhost:8000/talks/intro/`, go to slide 03 with →, toggle DE. Both languages fit the canvas; nothing leaks from the notes onto the slide (a leaked note means a straight `"` inside `data-notes`).

- [ ] **Step 3: Commit**

```bash
git add talks/intro/index.html
git commit -m "Open on the brain, not on two companies"
```

---

### Task 3: Slide 06 — the whole vocabulary

Rebuild the six-cell grid as the nine-cell grid from the spec's §3, row 6.

**Files:**
- Modify: `talks/intro/index.html` — the `<section>` with `data-n="06"`

- [ ] **Step 1: Replace the section**

```html
<section class="slide"
    data-time="1:10"
    data-notes="<em class='cue'>Breite zeigen, nicht vorlesen. Zwei, drei herausgreifen.</em> Es geht nicht nur um Menschen und Rollen. Im selben Vokabular stehen die Prozesse mit ihren Gates, die Strategie und die Ziele, die Kennzahlen, die Regeln, die Begriffe, die eine Firma anders benutzt als alle anderen, die Entscheide — und die Werte. <em class='cue'>Ehrlich bleiben, ohne zu zählen:</em> Nicht jede Firma füllt alles aus. Eine Ein-Personen-Firma hat keine Teams. Die Art bleibt trotzdem im Modell, leer."
    data-notes-en="<em class='cue'>Show the breadth, do not recite it. Pick two or three.</em> This is not only people and roles. The same vocabulary holds the processes and their gates, the strategy and the objectives, the metrics, the rules, the concepts a company uses differently from everyone else, the decisions — and the values. <em class='cue'>Stay honest, without counting:</em> Not every company fills all of it in. A company of one has no teams. The kind stays in the model anyway, empty.">
    <div class="kicker mono" data-n="06" data-de="Die Breite">The breadth</div>
    <h1 data-de="Alles, was eine Firma ausmacht — in einem Vokabular.">Everything that makes a company — in one vocabulary.</h1>
    <div class="grid">
      <div class="cell"><b data-de="Rollen und Teams">Roles and teams</b><span data-de="wer was tut">who does what</span></div>
      <div class="cell"><b data-de="Prozesse und Gates">Processes and gates</b><span data-de="wie Arbeit fliesst">how work flows</span></div>
      <div class="cell"><b data-de="Strategie und Ziele">Strategy and objectives</b><span data-de="wohin investiert wird">where we invest</span></div>
      <div class="cell"><b data-de="Kennzahlen">Metrics</b><span data-de="was gemessen wird">what we measure</span></div>
      <div class="cell"><b data-de="Regeln">Rules</b><span data-de="was durchgesetzt wird">what we enforce</span></div>
      <div class="cell"><b data-de="Begriffe">Concepts</b><span data-de="was definiert wird">what we define</span></div>
      <div class="cell"><b data-de="Entscheide">Decisions</b><span data-de="was entschieden wurde, und was verworfen">what we decided, and what we rejected</span></div>
      <div class="cell"><b data-de="Werte">Values</b><span data-de="was wir glauben">what we believe</span></div>
      <div class="cell"><b data-de="Menschen">People</b><span data-de="wer da ist">who we are</span></div>
    </div>
    <p class="verdict" data-de="Nicht jede Firma füllt alles aus. <em>Die Art bleibt trotzdem im Modell.</em>">Not every company fills all of it in. <em>The kind stays in the model anyway.</em></p>
  </section>
```

- [ ] **Step 2: Render and look**

Slide 06, both languages, and the phone width (narrow the window under 860px — the grid collapses to one column and the page scrolls). Nine cells must fit the 1600×900 canvas above the verdict; if the third row pushes the verdict off the canvas, shorten the glosses — do not touch the shared `.grid` rule.

- [ ] **Step 3: Commit**

```bash
git add talks/intro/index.html
git commit -m "Show the whole vocabulary, not the part that shipped"
```

---

### Task 4: Slide 09 — Markdown, checked by agents

New slide, inserted after the current `data-n="08"` section ("For people, and for AI.") and before the current `data-n="09"` section, which Task 5 replaces.

**Files:**
- Modify: `talks/intro/index.html` — insert after the `</section>` of slide 08

- [ ] **Step 1: Insert the section**

```html
<section class="slide"
    data-time="1:00"
    data-notes="<em class='cue'>Das ist die These, hinter der das Modell steht — hier nicht abschwächen.</em> Die Schemas sind selbst Markdown. Eine Tabelle sagt, welche Felder eine Rolle hat, welche Abschnitte, was Pflicht ist. Und wer das prüft, ist ein Agent, der die Regeln liest — kein Programm, das ein Schema-Format parst. <em class='cue'>Den Einwand selbst nennen:</em> Man könnte sagen, das ist eine Vorstufe, irgendwann kommt das richtige Schema. Nein. <em class='cue'>Pointe:</em> Mit dem richtigen Meta-Modell ist die Prosa das Schema. Genau das kann ein Agent heute, und genau das ist neu."
    data-notes-en="<em class='cue'>This is the thesis the model ships under — do not soften it here.</em> The schemas are Markdown themselves. A table says which fields a role has, which sections, what is required. And what checks it is an agent reading the rules — not a program parsing a schema format. <em class='cue'>Name the objection yourself:</em> One could say this is a stage, the real schema comes later. No. <em class='cue'>The point:</em> With the right meta-model, the prose is the schema. That is what an agent can do today, and that is what is new.">
    <div class="kicker mono" data-n="09" data-de="Die These">The thesis</div>
    <h1 data-de="Markdown, geprüft von Agenten.">Markdown, checked by agents.</h1>
    <div class="thennow">
      <div class="col">
        <h4 data-de="Eine Schema-Sprache">A schema language</h4>
        <p data-de="Ein zweites Format, das niemand liest, gepflegt neben dem, das alle lesen.">A second format nobody reads, kept beside the one everybody does.</p>
      </div>
      <div class="col now">
        <h4 data-de="Ein Schema in Prosa">A schema in prose</h4>
        <p data-de="Eine Tabelle sagt, was eine Rolle hat. Ein Agent liest sie und prüft jede Seite dagegen.">A table says what a role has. An agent reads it and checks every page against it.</p>
      </div>
    </div>
    <p class="verdict" data-de="Keine Vorstufe zu einem richtigen Schema. <em>Mit dem richtigen Meta-Modell ist die Prosa das Schema.</em>">Not a stage on the way to a real schema. <em>With the right meta-model, the prose is the schema.</em></p>
  </section>
```

- [ ] **Step 2: Render and look**

Slide 09, both languages. The `.thennow` two-column layout is the one slide 08 uses; check the right column reads as the resolved side (it carries `now`).

- [ ] **Step 3: Commit**

```bash
git add talks/intro/index.html
git commit -m "Say the thesis out loud: the prose is the schema"
```

---

### Task 5: Slide 10 — what would make it usable

Replace the old "Where it stands" slide (the one that follows the new slide 09; its kicker still says `data-n="09"` and its h1 "The vocabulary is published. Almost nothing else is.").

**Files:**
- Modify: `talks/intro/index.html` — that section, whole

- [ ] **Step 1: Replace the section**

```html
<section class="slide"
    data-time="1:15"
    data-notes="<em class='cue'>Als Absicht sagen, nie als Stand. Was davon existiert, steht in der Roadmap — nicht auf dieser Folie.</em> Drei Dinge würden das brauchbar machen. Erstens: eine echte Firma, in diesem Vokabular beschrieben, öffentlich. Meine eigene — eine Person, und trotzdem eine Firma. Zweitens: ein Werkzeug in der Art von spec-kit. Ein Befehl legt eine Instanz an, einer fügt eine Seite nach Schema hinzu, einer prüft, einer bringt die Schemas auf den neuen Stand — und einer verpackt die Firma als Skill, den ein Agent lädt. Drittens, danach: ein Validator. <em class='cue'>Ehrlich, ohne zu zählen:</em> Welche davon es gibt, sagt die Roadmap. Der Link steht unten."
    data-notes-en="<em class='cue'>State as intent, never as status. What exists is in the roadmap — not on this slide.</em> Three things would make this usable. First: a real company described in this vocabulary, in the open. My own — one person, and still a company. Second: a tool in the manner of spec-kit. One command sets up an instance, one adds a page from its schema, one checks, one brings the schemas up to date — and one packages the company as a skill an agent loads. Third, after that: a validator. <em class='cue'>Honest, without counting:</em> Which of these exist, the roadmap says. The link is at the bottom.">
    <div class="kicker mono" data-n="10" data-de="Was es brauchbar macht">What would make it usable</div>
    <h1 data-de="Drei Dinge, damit man es wirklich benutzen kann.">Three things before anyone can really use it.</h1>
    <div class="grid">
      <div class="cell"><b data-de="Eine echte Firma">A real company</b><span data-de="in diesem Vokabular beschrieben, öffentlich — meine eigene, eine Person">described in this vocabulary, in the open — my own, one person</span></div>
      <div class="cell"><b data-de="Ein Werkzeug wie spec-kit">A tool like spec-kit</b><span data-de="Instanz anlegen, Seite nach Schema hinzufügen, prüfen, aktualisieren, als Skill verpacken">set up an instance, add a page from its schema, check, upgrade, package as a skill</span></div>
      <div class="cell"><b data-de="Ein Validator">A validator</b><span data-de="danach — nicht davor">after that — not before</span></div>
    </div>
    <p class="verdict" data-de="Welche davon es gibt, sagt die Roadmap. <em>Nicht diese Folie.</em>">Which of these exist, the roadmap says. <em>Not this slide.</em></p>
    <p class="stamp"><a href="https://github.com/companygraph/meta-model#roadmap" target="_blank" rel="noopener">github.com/companygraph/meta-model#roadmap</a></p>
  </section>
```

The URL sits in `.stamp` because a URL is data; the sentence around it is in `.verdict` because it is prose.

- [ ] **Step 2: Render and look**

Slide 10, both languages. The grid is three cells in one row; the stamp sits under the verdict inside the canvas.

- [ ] **Step 3: Commit**

```bash
git add talks/intro/index.html
git commit -m "Name the plan, and let the roadmap say the status"
```

---

### Task 6: Slide 11 — tell me where this is wrong

Replace the old closing slide (kicker `data-n="10"`, one question) with the four-question close. Uses the `.ask` list the deck's CSS already defines.

**Files:**
- Modify: `talks/intro/index.html` — the last `<section>`

- [ ] **Step 1: Replace the section**

```html
<section class="slide"
    data-time="1:00"
    data-notes="<em class='cue'>Das ist der eigentliche Zweck des Gesprächs — hier nicht hetzen.</em> Ich verkaufe hier nichts. Ich habe eine Form, und ich möchte wissen, wo sie bricht. Vier Fragen, und bei jeder ist ein Nein für mich mehr wert als ein höfliches Ja. <em class='cue'>Die vier vorlesen, langsam.</em> Wo passt Ihre Firma nicht in diese Form? Würden Sie das als Markdown behalten, das Agenten prüfen — oder brauchen Sie eine richtige Schema-Sprache, bevor Sie dem trauen? Würden Sie Ihre eigene Instanz mit einem Werkzeug wie spec-kit anlegen — oder reicht es, einen Ordner mit Schemas zu kopieren? Und: Würden Sie sich beim Aufbau helfen lassen, nach Aufwand, nichts gehostet — oder ist das etwas, das Sie nur selbst machen? <em class='cue'>Die vierte Frage ist eine Frage, kein Angebot: kein Satz, kein Kontakt. Wer Ja sagt, dem wird nichts verkauft — es wird notiert.</em> <em class='cue'>Danach: Pause. Zuhören, nicht verteidigen.</em>"
    data-notes-en="<em class='cue'>This is the actual purpose of the conversation — do not rush it.</em> I am not selling anything here. I have a shape, and I want to know where it breaks. Four questions, and on each one a no is worth more to me than a polite yes. <em class='cue'>Read the four, slowly.</em> Where does your company not fit this shape? Would you keep this as Markdown checked by agents — or do you need a real schema language before you trust it? Would you set up your own instance with a tool like spec-kit — or is copying a folder of schemas enough? And: would you take help building one, time and material, nothing hosted — or is that something you only do yourselves? <em class='cue'>The fourth is a question, not an offer: no rate, no contact. A yes is not sold to — it is noted.</em> <em class='cue'>Then: pause. Listen, do not defend.</em>">
    <div class="kicker mono" data-n="11" data-de="Worum ich bitte">What I am asking</div>
    <h1 data-de="Sagen Sie mir, wo das <em>falsch</em> ist.">Tell me where this is <em>wrong</em>.</h1>
    <ul class="ask">
      <li><b>1 ·</b> <span data-de="Wo passt Ihre Firma nicht in diese Form?">Where does your company not fit this shape?</span></li>
      <li><b>2 ·</b> <span data-de="Würden Sie das als Markdown behalten, das Agenten prüfen — oder brauchen Sie zuerst eine richtige Schema-Sprache?">Would you keep this as Markdown checked by agents — or do you need a real schema language before you trust it?</span></li>
      <li><b>3 ·</b> <span data-de="Würden Sie Ihre Instanz mit einem Werkzeug wie spec-kit anlegen — oder reicht ein kopierter Ordner mit Schemas?">Would you set up your own instance with a tool like spec-kit — or is copying a folder of schemas enough?</span></li>
      <li><b>4 ·</b> <span data-de="Würden Sie sich beim Aufbau helfen lassen — nach Aufwand, nichts gehostet — oder machen Sie das nur selbst?">Would you take help building one — time and material, nothing hosted — or is that something you only do yourselves?</span></li>
    </ul>
    <p class="stamp" data-de="<b>Apache 2.0</b> · <a href='https://companygraph.io/' target='_blank' rel='noopener'>companygraph.io</a> · ein Nein ist mir mehr wert als ein höfliches Ja"><b>Apache 2.0</b> · <a href="https://companygraph.io/" target="_blank" rel="noopener">companygraph.io</a> · a no is worth more to me than a polite yes</p>
  </section>
```

The `data-de` on the stamp carries an `<a>` with single-quoted attributes — it is an attribute value. `applyLang()` swaps `innerHTML`, so the German link renders as a link.

- [ ] **Step 2: Render and look**

Slide 11, both languages, phone width. Four questions fit above the stamp on the canvas; on the phone width the list stacks and the page scrolls. Toggle DE and confirm the stamp's link is still a link.

- [ ] **Step 3: Commit**

```bash
git add talks/intro/index.html
git commit -m "Close on four questions, not one"
```

---

### Task 7: The deck's metadata, the counter, and the title slide's frame

Everything in the deck that describes the deck: `<title>`, the two descriptions, the UI strings, the title-slide notes, `package.json`. Then `npm run verify` goes green for `/talks/intro/`.

**Files:**
- Modify: `talks/intro/index.html` — `<meta name="description">` (≈line 17), `og:description` (≈line 23), `UI.de.desc` and `UI.en.desc` (≈lines 794, 800), the title slide's `data-notes`/`data-notes-en`
- Modify: `talks/intro/package.json` — `description`

- [ ] **Step 1: Descriptions**

Replace the three sentences that say "the vocabulary two independent companies converged on" with:

- `<meta name="description">` and `og:description`, English:
  `A talk on the meta-model for operating a company — a company's knowledge as a graph of Markdown that people and agents can both rely on. An idea put up for scrutiny.`
- `UI.en.desc`: the same string.
- `UI.de.desc`: `Ein Vortrag über das Meta-Modell für den Betrieb eines Unternehmens — das Wissen einer Firma als Graph aus Markdown, auf den sich Menschen und Agenten verlassen können. Eine Idee, zur Prüfung gestellt.`

- [ ] **Step 2: Title slide notes**

The title slide's visible text stays (its kicker already reads "An idea, put up for scrutiny"). Replace its notes:

```
data-notes="<em class='cue'>Der Titel liegt an, während ich eröffne.</em> CompanyGraph ist keine fertige Sache. Es ist eine Idee: ein Meta-Modell für den Betrieb eines Unternehmens — die Struktur, die sein Wissen annimmt, damit Menschen und KI sich darauf verlassen können. Quelloffen, und nicht fertig. <em class='cue'>Kurze Pause davor, im Ton wichtig:</em> Ich will Gegenwind, nicht Applaus. Zwölf Minuten, dann vier Fragen."
data-notes-en="<em class='cue'>The title stays up while I open.</em> CompanyGraph is not a finished thing. It is an idea: a meta-model for operating a company — the structure its knowledge takes, so people and AI can both rely on it. Open source, and not finished. <em class='cue'>A short pause first, important in tone:</em> I want pushback, not applause. Twelve minutes, then four questions."
```

- [ ] **Step 3: `package.json`**

`"description": "A 12-minute talk: CompanyGraph, the open-source meta-model for operating a company."`

- [ ] **Step 4: Check the numbering end to end**

Run:
```bash
grep -o 'data-n="[0-9]*"' talks/intro/index.html | tr '\n' ' '
```
Expected: `data-n="00" … data-n="11"` — twelve values, consecutive, no repeats.

- [ ] **Step 5: Run verify**

Run: `npm run verify`
Expected: `✓ /talks/intro/` and `✓ /talks/`; `✗ /` remains only on the "12 minutes" string, which Task 8 fixes.

- [ ] **Step 6: Commit**

```bash
git add talks/intro/index.html talks/intro/package.json
git commit -m "Describe the deck the way it now argues"
```

---

### Task 8: The three places that restate the talk

The landing page's call to action, the talks index, and the site's `CLAUDE.md`.

**Files:**
- Modify: `index.html` — `.ctameta` (≈line 208)
- Modify: `talks/index.html` — the `.talk` block in `<main>`
- Modify: `CLAUDE.md` — the "deck and the talks index" rule about slide 9, and the "AI/agents" paragraph

- [ ] **Step 1: Landing page**

`<p class="ctameta mono" data-de="12 Minuten · Deutsch oder Englisch">12 minutes · German or English</p>`

- [ ] **Step 2: Talks index**

Replace the `.meta` and `.d` spans inside the `<a class="talk" href="intro/">`:

```html
<span class="meta mono"><b>12 min</b></span>
<span class="d" data-de="Das Wissen einer Firma als Graph aus Markdown: eine Datei pro Sache, Verweise über den Namen, Schemas in Prosa, die Agenten prüfen. Was das ist, warum es für Menschen und Agenten zugleich trägt — und vier Fragen, bei denen ein Nein mehr wert ist als ein höfliches Ja.">A company's knowledge as a graph of Markdown: one file per thing, references by name, schemas in prose that agents check. What that is, why it carries for people and agents at once — and four questions where a no is worth more than a polite yes.</span>
```

- [ ] **Step 3: `CLAUDE.md`**

Replace the bullet
`- **No type count, no type list read aloud, and no status claim that ages.** Slide 9 says "not all of it is written yet, the roadmap says what is" and links. It never says how much.`
with:
`- **No type count, no type list read aloud, and no status claim that ages — name the plan, never the status.** Slide 10 says what would make the model usable and links to the roadmap for what exists. A slide may say what the project intends to build; it never says what it has built, because the deck is the one medium that cannot be edited cheaply.`

The "AI in the deck, agents everywhere else" paragraph keeps its numbers: the new slide is inserted after 08, so 00–08 are unchanged. Only the table row for "this deck, slide 00" stays true as well — verify that by reading the title slide's `.sub`, which this plan does not touch.

- [ ] **Step 4: Run verify**

Run: `npm run verify`
Expected: all three pages `✓`, `all checks pass`.

- [ ] **Step 5: Commit**

```bash
git add index.html talks/index.html CLAUDE.md
git commit -m "Restate the talk's new length in the three places allowed to"
```

---

### Task 9: Narration, PDFs, share cards

Everything derived from the deck. Requires `ELEVENLABS_API_KEY` in the environment (probe with `${ELEVENLABS_API_KEY:+SET}`; never print it) and Docker-free Playwright with Chromium installed (`npx playwright install chromium` if `npm run pdf` complains).

**Files:**
- Regenerate: `talks/intro/audio/{en,de}/{00,03,06,09,10,11}.mp3` + `.sha`
- Regenerate: `talks/intro/companygraph-en.pdf`, `talks/intro/companygraph-de.pdf`
- Regenerate: `talks/intro/og.png`, `talks/intro/og.sha`; `talks/og.png`, `talks/og.sha`; `og.png`, `og.sha` at the root

- [ ] **Step 1: Dry-run the narration**

Run: `cd talks/intro && ./tts/generate.py --dry-run`
Expected: exactly slides 00, 03, 06, 09, 10 and 11 listed as needing generation, in both languages, with a character count. Any other slide listed means its note changed by accident — diff it before generating. If 04 or another unchanged slide appears, `read_h1` has flipped languages; stop and fix that first.

- [ ] **Step 2: Generate**

Run: `./tts/generate.py`
Then listen to `audio/en/11.mp3` and `audio/de/11.mp3` at least: the four questions come out as four beats, and the cue text is not spoken.

- [ ] **Step 3: PDFs**

Run: `npm install && npm run pdf` (inside `talks/intro/`)
Expected: both PDFs regenerated with twelve pages each. Open one and check slide 06's nine cells and slide 11's list are inside the page.

- [ ] **Step 4: Share cards**

Run from the repository root: `npm run og && npm run og:check`
Expected: three cards rendered; `og:check` reports all three current. The deck's card renders its title slide, which is visually unchanged — it is re-rendered anyway because the recipe hashes the whole page.

- [ ] **Step 5: The og suite and verify**

Run: `npm run test:og && npm run verify`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add talks/intro/audio talks/intro/*.pdf talks/intro/og.png talks/intro/og.sha talks/og.png talks/og.sha og.png og.sha
git commit -m "Re-derive narration, PDFs and cards from the new deck"
```

---

### Task 10: The org profile

A different repository: `companygraph/.github`, checked out at `~/git/companygraph/.github`.

**Files:**
- Modify: `~/git/companygraph/.github/profile/README.md` — the "New here?" line (≈line 16)

- [ ] **Step 1: Edit**

Change `The [ten-minute introduction](https://companygraph.io/talks/intro/)` to `The [twelve-minute introduction](https://companygraph.io/talks/intro/)`.

- [ ] **Step 2: Branch, commit, PR**

```bash
cd ~/git/companygraph/.github
git checkout -b talk-length
git commit -am "Quote the talk's new length"
git push -u origin talk-length
gh pr create --title "Quote the talk's new length" --body "The intro talk is twelve minutes now."
```

Merge it only after the site's PR (Task 11) is merged, so the profile never quotes a length the live deck does not have.

---

### Task 11: PR

- [ ] **Step 1: Push and open**

```bash
cd ~/git/companygraph/companygraph.github.io
git push -u origin intro-talk-rework
gh pr create --title "Re-aim the intro talk" --body "Twelve slides that put the idea up for scrutiny and close on four validation questions. Spec: docs/superpowers/specs/2026-08-25-intro-talk-rework-design.md."
```

- [ ] **Step 2: Wait for CI**

The `verify` job must be green — it runs `test:og`, `og:check`, then the browser suite against a served copy.

- [ ] **Step 3: Merge, then Task 10's PR**

`gh pr merge --merge --delete-branch`, then merge the profile PR.
