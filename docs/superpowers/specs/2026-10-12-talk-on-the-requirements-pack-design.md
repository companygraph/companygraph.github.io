# The talk on the requirements pack — design

> The fifth talk of the series on core and packs: for a requirements engineer who already writes use cases and requirements, showing the requirements pack writing them down as pages a check holds, and the three pictures the MCP server draws of a use case. One pull request, in the two steps the pack talks take, with a slide of drawn pictures as the landscape talk has.

Status: proposed. Decided on 2026-10-12 with the owner against this repository at f13d43a, whose `source.json` pins companygraph/meta-model at 4088f5a, the commit v0.94.0 names, and companygraph/mental-model at 26ad32b, the commit that took the requirements pack and wrote its use cases and requirements; the pack's README is read at that tag. This section extends `2026-10-10-talks-on-core-and-packs-design.md`, whose §2 and §7 hold for this talk as for the other three.

## 1. What is true today

The meta-model ships a fourth pack since v0.94.0, `requirements`: two types, `use-case` and `requirement`, for a company that says what its products must do before it builds them. A use case is Cockburn's fully dressed form as a page: level, scope and primary actor in the front matter, its stakeholders and their interests, its preconditions, trigger, main success scenario and extensions as sections and tables, and its minimal and success guarantees. It names the features it asks something of and, in `includes`, the subordinate use cases its steps call. A requirement is one statement a product is held to, of kind `functional`, `quality` or `constraint` and modality `must`, `should` or `may`, with a fit criterion, the features, products or use cases it applies to, and the company rules it carries into the product in `follows`.

companygraph/mental-model took the pack on 2026-10-12 and wrote fifteen use cases and thirty-two requirements. The MCP server draws a use case three ways since v0.68.0, the chat asks for them since chat-server v0.35.0 and the widget draws them since design v0.151.0, and all three are live on companygraph.io. The site's pins at f13d43a hold every page this talk rests on, so no re-pin comes first.

Four talks of the series are out: core and packs, software, organization and landscape. The landscape talk's slide 11 shows the server's pictures in a tabbed window that steps through them on its own, which this talk takes as its last picture.

## 2. What was decided

**One talk, for the practitioner.** It is for someone who already writes use cases in Cockburn's form and requirements in a standard's, ISO 29148, IREB or Volere. It runs the series' arc: the method and its sources, the two types as pages, where the pack departs and why, how it joins core, what is left for later, and the pack in our own model, drawn.

**Every chip rests on our own model.** Our model holds enough: a user-goal use case with stakeholders, eleven extensions and both guarantees, a subfunction another use case includes, and requirements of every kind and modality, two of them following a rule.

**The drawn slide shows the three pictures of one use case.** `usecase`, `scenario` and `requirements` of Ask the company a question, as the MCP server answers them at the pinned commit, in the landscape talk's tabbed window.

**The close links back to the first talk**, and the first talk's slide 10 gains the requirements row as a link, as every pack talk adds its own.

## 3. What someone wants, and what the product is held to

At `/talks/requirements-pack/`, listed on `/talks/` after the landscape talk.

| # | Slide | What it says | Rests on |
| --- | --- | --- | --- |
| 0 | Title | What someone wants, and what the product is held to. | concept Pack |
| 1 | The method you know | Cockburn's use cases, UML 2.5.1's clause 18, Use-Case 2.0, ISO 29148, IREB's glossary, Volere's snow card, RFC 2119 and spec-kit's template, each linked from the README's Sources: the pack writes their words down. | concept Pack |
| 2 | A use case | A window on Ask the company a question: its level, scope and primary actor, and the features it asks something of. One goal, one actor, all the ways of reaching it. | use-case Ask the company a question, feature A visitor asks the model, seat Visitor |
| 3 | Stakeholders and guarantees | A window on its stakeholders and interests and its two guarantees: what holds whatever happens, and what holds when the goal is reached. Cockburn's two headings, not one table with a kind column. | use-case Ask the company a question |
| 4 | The scenario | A window on the trigger and the first steps of the main success scenario: a step is a row, its actor a seat where the company has one, and a step that calls another use case names it, drawn from `includes`. | use-case Ask the company a question, use-case Read the model from an agent, use-case Walk a long list a page at a time |
| 5 | Extensions | A window on the extensions: a condition at a step, and what happens then; a step may branch more than once. | use-case Ask the company a question |
| 6 | A requirement | A window on A question is answered in the language of its words: kind, modality, why, the fit criterion that shows it met, and what it applies to. | requirement A question is answered in the language of its words |
| 7 | Three kinds, three words | Functional, quality, constraint; must, should, may, from RFC 2119. A row each from our model: a quality must, a functional should, a functional may, a constraint must. | requirements A broken reference is marked when the line is left, A German reader reads the vocabulary pages in German, An instance may make its own ids under a declared pattern, No call changes the model |
| 8 | A rule carried in | A requirement names the company rule it carries into the product: A visitor is told before the first message that an agent answers follows A visitor is told an agent answers, and applies to the feature A visitor asks the model. | requirement A visitor is told before the first message that an agent answers, rule A visitor is told an agent answers, feature A visitor asks the model |
| 9 | Where it departs | The README's list: RFC 2119's three words rather than the rule's; two guarantee sections rather than one table; no black-box and white-box split; Cockburn's words for levels, his lowest left out; a step's actor resolves and includes is drawn; no priority, satisfaction, conflicts or history; a spec-kit success criterion is a quality requirement. | concept Pack |
| 10 | How it joins core | A use case asks something of a feature, its actors are seats; a requirement applies to a feature, a product or a use case and follows a rule; the software pack's feature design refines the same feature, so the trace runs from what is wanted to how it is built, and neither pack names the other. Every edge runs one way and is optional. | feature A visitor asks the model, product CompanyGraph Core, seat Visitor, rule A visitor is told an agent answers |
| 11 | Left for later | The README's list: technology and data variations, secondary actors, extend, user stories and slices, goals in KAOS's or iStar's sense, a stakeholder type, SysML's derive, satisfy and verify, an originator. | concept Pack |
| 12 | A use case, drawn | Three tabs: the use case in its scope, its scenario, and what it is held to, drawn by the MCP server's own code at the pinned commit; the actor outlined, since Visitor is a seat nobody holds. | use-case Ask the company a question, requirements A question is answered in the language of its words and An answer says where the model does not say |
| 13 | Close | What someone wants and what the product is held to, as pages a check holds; the first talk says how a company chooses its packs. | concept Pack |

## 4. The two steps

As §7 of the series' spec, on the branch `talk-on-the-requirements-pack`, from the landscape talk's page as its shell since it carries the tabbed window and its scene. Step 1 is the English deck with its narration clips, served on the LAN for the owner to read and hear at a desk's width and a phone's, in both themes; nothing past the spec and the plan is committed until the owner says the English is right. Step 2, on the owner's word, is the German by the three roles, the German clips, both PDFs, the card, the listing, the sitemap, the README's row and the first talk's link.

The three pictures are the server's answers byte for byte: three entries in `build/talk-pictures.mjs` name them, the site's build asks companygraph-mcp-server at the site's own pin for each over the pinned snapshot and writes the answer into `talks/requirements-pack/pictures/`, and the pages build writes each into its tab as a figure the widget draws, as the landscape talk's are drawn.

## 5. Not in this design

A change to the pack or to our model: where a slide finds a page wrong, the fix lands in companygraph/mental-model first and the talk waits for the re-pin. A mark of its own for a step whose actor is "System", which the owner has not settled. A LinkedIn post or episode about the talk.
