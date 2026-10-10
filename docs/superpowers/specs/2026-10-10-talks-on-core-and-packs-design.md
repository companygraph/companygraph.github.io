# Talks on core and packs — design

> Four talks for companygraph.io about how the vocabulary grows with a company: one on core and packs for an adopter choosing what to take, and one for each pack — software, organization and landscape — for a practitioner of the method that pack draws from. Four pull requests here, in that order, each in the two steps the earlier talks took.

Status: proposed. Decided on 2026-10-10 with the owner, one question at a time, against this repository at 845fb81, whose `source.json` pins companygraph/meta-model at 93e13f7 and companygraph/mental-model at d2e152e, and against companygraph/meta-model at 1313afa and companygraph/mental-model at b1ff636, whose files were read that day.

## 1. What is true today

Four talks sit under `/talks/`: the introduction, the Obsidian plugin, "From one command to fully integrated" at `/talks/levels/` and "What stays when the model changes" at `/talks/what-stays/`. None of them says what core is, what a pack is, or how a company decides which packs to take. The levels talk gives the software pack one slide, "A pack climbs every level", as the example of a change moving through every pin.

The meta-model ships three packs beside core under one tag: `software`, taken from domain-driven design; `organization`, for a company of more than one person; and `landscape`, for a company that runs systems, mapped onto ArchiMate. Core is level 0 and a pack level 1; R20 says core names only its own types and a pack names core's and its own, and every edge from a pack to core is optional. An instance takes a pack with `companygraph init --pack` or later with `companygraph upgrade --pack`, which vendors it beside core under the units folder and lists it in the manifest's `packs`.

The company's own model, companygraph/mental-model, takes `software` and `organization`. It holds the concept Pack, the domain Core, the objective "Core holds a company without running out of vocabulary", the question "What if the vocabulary doesn't fit our company?", the decision "A section is open and a field is closed" and the process Feature request, which together are what the first talk rests on. Its software content is a set of bounded contexts with their concept designs, aggregates and domain events, and the feature designs that use them. Its organization content is one team, Maintainers, with the jobs Maintainer and Co-Maintainer, whose `## People` also names the AI agent and the two narration voices as members holding seats without a job. It does not take `landscape`; another session is bringing that pack into it now.

The example company under meta-model's `example/model` takes all three packs, and its organization is the one that shows what ours cannot: departments under a management, a staff unit, a team drawn across units with a start date, jobs a department guides, and openings.

## 2. What was decided

**Four talks, not three.** The owner asked for one talk on extensibility and one for each pack, naming software and organization; `landscape` is a pack too, and the owner chose a talk for it as well.

**The first talk is for an adopter choosing packs.** It says what core gives every company, what a pack adds, how to tell whether a company needs one, and that taking one is one command and leaves core as it was. How a pack is made is not its subject.

**Each pack talk is the practitioner's method, as pages.** It is for someone who already works in the method the pack draws from — domain-driven design, organization design, enterprise architecture — and shows that method becoming checkable pages. Every pack talk runs the same arc: the method and its sources, credited; the types, each as a page; where the pack departs from its sources and why, from the README's own section; how it joins core; and the pack in a real model, closing with a link back to the first talk.

**Every chip rests on our own model, with one exception.** As in the other talks, each slide names the pages it rests on and each chip opens one. The organization talk also opens the example company where our model has nothing to show — the two lines, the staff unit, the team across units, the openings — and each such chip says which instance it opens.

**The landscape talk comes last and waits for the session working on landscape to say it is ready.** It starts only once that session reports two things merged: meta-model's README describing the landscape pack as the pack's own README does, and the landscape pages in companygraph/mental-model. Its slides are written then, against those pages, so the spec fixes only its arc and sources.

**One spec, one pull request per talk, in order:** core and packs, software, organization, landscape. The first talk is the one the others link back to, so it ships first, and each later pull request adds its own link to the first talk's list of pack talks.

## 3. One core, and the words your company adds

At `/talks/core-and-packs/`, listed on `/talks/` after the what-stays talk.

| # | Slide | What it says | Rests on |
| --- | --- | --- | --- |
| 0 | Title | One core, and the words your company adds. | |
| 1 | Too small, too large | A vocabulary too small leaves facts out; one too large makes every company carry types it leaves empty. | objective "Core holds a company without running out of vocabulary" |
| 2 | Level 0: core | What fits every business. Core defines a type; it does not oblige a company to populate it. | domain Core, concept Core |
| 3 | Level 1: a pack | Types that are absent for some companies, not optional for all: one pack per kind of company — software, organization, landscape. | concept Pack |
| 4 | The one-way rule | A pack names core; core never names a pack. Every edge from a pack to core is optional, so taking a pack asks nothing new of a page a company already has (R20). | concept Pack, concept Reference |
| 5 | Your own sorts | Kinds are pages in the company's words — product kind, decision kind, group kind, system kind — and add no type. | product-kind Software |
| 6 | Your own sections | A section is open and a field is closed: a page may carry prose its schema does not declare. | decision "A section is open and a field is closed" |
| 7 | Taking a pack | `companygraph init --pack` or `upgrade --pack`: vendored beside core, listed in the manifest, checked and moved with it, under one release tag. An animated terminal. | concept Instance, concept Release, concept Pin |
| 8 | Do you need one? | You build software: software. More than one person: organization. You run systems: landscape. Each with what it adds. | concept Pack |
| 9 | When nothing fits | A feature request; new vocabulary enters core or a pack from a pattern real companies show, not from a wish list. | process Feature request, question "What if the vocabulary doesn't fit our company?" |
| 10 | The pack talks | A link to each pack talk that has shipped; each pack's pull request adds its own. | |
| 11 | Close | Take only the words your company needs. | |

Slide 4's claim is checked before it is written: step 1 runs `companygraph upgrade --pack` on a scratch instance that passes its check without the pack, and the claim stands only if the instance passes unchanged after it.

## 4. Domain-driven design, as pages you can check

At `/talks/software-pack/`. Every chip opens our model, mostly the Resolution context.

| # | Slide | What it says | Rests on |
| --- | --- | --- | --- |
| 0 | Title | Domain-driven design, as pages you can check. | |
| 1 | The method you know | Evans, Vernon, the DDD Crew's canvases, Jackson's *The Essence of Software*, Gherkin: the pack writes their words down rather than inventing its own. | concept Pack |
| 2 | Bounded context | The boundary where one model and one language hold, as a page: its responsibilities, its classification, the domain it realizes. | bounded-context Resolution |
| 3 | Its language | Concept designs, each an entity or a value object, owned by the context. | concept-designs Entity, Edge, Scope, Declaration, Graph under Resolution |
| 4 | Aggregate and event | An aggregate keeps its concepts consistent as one unit. A domain event is a type, because other contexts name it; a command is a row, because nothing outside its aggregate does. | aggregate Graph, domain-event "Name found unresolvable" |
| 5 | Context map | A relationship is a row on the downstream context: Checking is a conformist to Resolution and shares a kernel with Vendoring. | bounded-context Checking |
| 6 | Feature design | How a feature is built across the contexts it touches: an operational principle and Gherkin scenarios. | feature-design "A name that names nothing is reported where it is written" |
| 7 | Where it departs | The classification sits on the context, not the subdomain, so "core domain" never collides with core; an architecture decision is core's `decision`; a payload keeps `Term` apart from `Type`. | decision "A reference resolves by its declared type, never by name alone" |
| 8 | How it joins core | A context realizes a core domain and a feature design refines a core feature; the edges run one way and are optional. | domain Core, feature "Checks an instance runs" |
| 9 | What the check holds | A name is resolved inside the owner its row names, so Publishing, Resolution and Serving each keep their own Entity; a name that names nothing fails where it is written. | concept-designs Entity under Publishing, Resolution and Serving; concept Check |
| 10 | Left for later | Services, repositories, factories and modules, C4, a type for a relationship between contexts: named in the README, not hidden. | concept Pack |
| 11 | Close | Your ubiquitous language, held to its own boundary by a check. | |

## 5. Two lines through one company

At `/talks/organization-pack/`. A chip marked (example) opens the example company; every other chip opens our model.

| # | Slide | What it says | Rests on |
| --- | --- | --- | --- |
| 0 | Title | Two lines through one company. | |
| 1 | The method you know | The W3C Organization Ontology, schema.org, SAP's organizational management, HR-XML, Gabler's Einliniensystem, Mehrliniensystem and Stelle. | concept Pack |
| 2 | Group and its kind | A unit, or a team drawn from units; its kind tells the two apart and says whether it stands in the disciplinary line. | group-kinds Department and Team (example) |
| 3 | A job is not a seat | A job is what a person is employed as; a seat is a responsibility in a process. Our team's agent and voices hold seats and no job. | group Maintainers, job Maintainer, seat Owner |
| 4 | The disciplinary line | It runs through each group's `## People` and its `part-of`: each person answers to the one whose `Place` is `Lead`. A person carries no field naming a superior. | groups Engineering and Management (example) |
| 5 | The professional line | A group's `guides` names jobs wherever the people who do them sit. | group Engineering, job Backend Engineer (example) |
| 6 | A team across units | A temporary group has `start` and `end`, not a status. | group Billing Run Team (example) |
| 7 | Staff and order | A staff unit stands beside the head it serves, the flag on its kind; `rank` orders groups across the type. | group-kind Staff Unit, group Legal (example) |
| 8 | Openings | A row of `## Openings` while a position is open, not a position object that outlives its holders. | group Engineering (example) |
| 9 | Where it departs | Two named lines where the ontology has one `reportsTo`, and "functional line" used for neither; `group` rather than organizational unit, because a team across units is not a unit. | concept Pack |
| 10 | Left for later | Edges from a group to KPIs and processes, a transitive `part-of`, a check that a person in a job holds the seats the job names. | |
| 11 | Close | The chart you draw and the one people work in, both on the page. | |

## 6. Your landscape, in ArchiMate's words

At `/talks/landscape-pack/`, built last. It runs the same arc, credits the ArchiMate 4 specification, the ArchiMate model exchange file format and LeanIX's application lifecycle, and shows the mapping the pack's README gives in both directions. Its slide table is written into this spec in its own pull request, once the landscape pages in companygraph/mental-model are merged, so no slide describes a page that does not exist.

## 7. Each talk in two steps

Each talk is built from the what-stays talk's page as its shell, in its own pull request, in two steps. This spec is the first commit of the first talk's pull request, on the branch `talks-on-core-and-packs`.

Before step 1, the content pin in `source.json` moves to the companygraph/mental-model commit the talk rests on, because a chip may name a page newer than the pin — the first talk's product-kind Software is one — and the graph a chip opens is drawn at the pin. As every content re-pin does, the meta-model and mcp-server pins move to their latest releases in the same commit.

Step 1 is the English deck: every slide with its speaker notes, its rests-on chips opening the graph modal as on the other talks, and a `scenes.js` where a slide animates. The owner reads it served locally, at a desk's width and a phone's, in both themes, before anything else is built.

Step 2, on the owner's word about the English: the German by the translator, the editor and the back-reader in turn; the narration clips in both languages; both PDFs, the og card, the listing on `/talks/`, the sitemap and the talk's row in the README.

A pack talk's pull request also adds its link to slide 10 of the first talk. That slide's German was made already, so the translator, the editor and the back-reader run again on the values the link touched.

Each step's commits carry its seat: Specifier for this file, Implementer for the English and the wiring, Translator for the German, Narrator for the clips, Implementer for the PDFs, og card, listing and sitemap.

Verified by the talk checks, `npm run pages:check`, `npm run pin:check`, `npm run og:check`, `npm run sitemap:check` and `npm run verify` against a local server exiting 0; by every rests-on chip resolving to a page at the pinned commit, including the example company's chips; and by reading every slide and its note in both languages, both themes, at both widths.

## 8. Not in this design

How a pack is made, which is the vocabulary skill's and its specs'. A talk for a pack that does not ship yet. Changes to the packs or to core: where a talk finds a page or a README wrong, it reports it and the fix lands in its own repository first. The drift in meta-model's README, which still says the landscape pack has two types and maps onto ArchiMate 3.2 while the pack's own README has four types and maps onto ArchiMate 4, was reported to the session working on landscape on 2026-10-10 and is fixed there, not here; the landscape talk waits for it. A LinkedIn post or episode about the talks, which waits for the owner.

## References

| What | URL |
| --- | --- |
| The software pack's design | https://github.com/companygraph/meta-model/blob/main/docs/superpowers/specs/2026-09-30-the-software-pack-design.md |
| The organization pack's design | https://github.com/companygraph/meta-model/blob/main/docs/superpowers/specs/2026-10-07-the-organization-pack-design.md |
| The landscape pack's design | https://github.com/companygraph/meta-model/blob/main/docs/superpowers/specs/2026-10-09-the-landscape-pack-design.md |
