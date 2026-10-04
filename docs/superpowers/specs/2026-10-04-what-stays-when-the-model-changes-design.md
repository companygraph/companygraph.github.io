# What stays when the model changes — design

> A third talk for companygraph.io, about the word "model" and the five things it names around CompanyGraph: a System Two model such as Opus, a System One model such as TypeSafe's Jev, the meta-model, a company's mental model, and the graph drawn from them. It says why each is there, which are fixed and which can be replaced by an equivalent, and closes on the practices that follow. Two steps and one pull request here, after one page in the company's model.

Status: proposed. Decided on 2026-10-04 with the owner, one question at a time, against this repository at d458943, whose `source.json` pins companygraph/mental-model at c10dfc8, and against companygraph/mental-model at 67a20a4 and companygraph/meta-model at 29ad11b, whose files were read that day.

## 1. What is true today

Two talks sit under `/talks/`: the Obsidian plugin talk and "From one command to fully integrated" at `/talks/levels/`, which walks five levels of how far a model reaches. Neither says what the word "model" means when an LLM, a decision model, the vocabulary and a company's facts are all called one.

CompanyGraph already runs on every layer this talk names. The check is typed code and asks no model. `companygraph judge` turns each schema's writing rules into typed questions and sends them, on the owner's yes to exactly what it shows, to TypeSafe's Jev, which answers each with a choice and a calibrated probability; the model is pinned in `bin/judges/typesafe.mjs`, whose header says a second judge is a second file beside it and that a newer model is measured again before it is named. `companygraph-validate` reads the judge's flags first and then every page, and approves nothing: CONVENTIONS says a pass that finds nothing approves nothing, and a change enters the model when a person approves it. The chat on chat.companygraph.io runs the same kind of check over its answers. The skills are written for Claude first, and the decision "Claude is the first agent an instance supports, and not the only one" says the others follow.

The company's model has no page for the judge. A slide about it would rest on nothing, and "The model is corrected first" says the page comes before the surface that shows it.

## 2. What was decided

**The frame is System One and System Two, with code below and a person above.** The owner saw the levels idea in TypeSafe's naming of Jev as a System One model beside System Two models that generate text. The talk names four layers and one sorting rule: each decision goes to the lowest layer that can make it. Code decides what code can decide; a System One model answers typed questions; a System Two model writes and reads; a person approves. TypeSafe, Kahneman, and Stanovich and West who first named the two systems, are credited in the frame slide's note and on a closing credits slide. Nicolas Figay's three maturity levels were considered and left out, so the talk carries one picture rather than two.

**The judge keeps its name.** The talk calls `companygraph-judge` by its name and describes its role as a guard; nothing is renamed.

**Each replaceable part says whether it is replaceable today or by design.** Jev is replaceable by design, a second file; the System Two model is replaceable by design while the skills are Claude's first; the editor and the graph database are replaceable today. "Nothing claims what the model does not hold" governs every such line, and no slide writes a model version, a probability band or a count that moves.

**Fourteen slides after the title**, each naming the pages of the model it rests on:

| # | Slide | What it says | Rests on |
| --- | --- | --- | --- |
| 0 | Title | What stays when the model changes. | |
| 1 | "Model" names five things | A System Two model (Opus, Fable, Gemini Flash), a System One model (Jev), the meta-model, a company's mental model, and the graph drawn from them. | concept Core, concept Instance, concept Type |
| 2 | Four layers | Code, System One, System Two, a person. Each decision goes to the lowest layer that can make it. | decision "Agents write the model, and a person approves every change to it" |
| 3 | Fixed: the meta-model | The vocabulary and every schema's writing rules, in Markdown, at a release an instance pins. | concept Schema, decision "The schema written as prose is the only schema", decision "A release is its tag, and nothing we make is published to a registry" |
| 4 | Fixed: the mental model | A company's facts as Markdown in git, checked against the release it adopted, owned by no tool. | concept Instance, objective "A company's model belongs to no tool, and any graph database can hold it", decision "Every entity carries an id that outlives its name" |
| 5 | Code: the check | References, schemas and ids, the same answer every run, no model asked. | concept Check, feature "Checks an instance runs", decision "A reference resolves by its declared type, never by name alone" |
| 6 | System One: the judge | Each writing rule becomes a typed question; Jev answers with a choice and a probability; the owner says yes to exactly what leaves the machine; the report advises and changes nothing. The chat's answers are checked the same way. | the new feature page (section 3), question "Does our data leave our hands?" |
| 7 | System Two: writes and reads | Skills draft an instance; validate reads the judge's flags first and then every page; the server and the chat answer and name the pages an answer rests on. | concept Agent pass, feature "An agent does the work no script can, by the skills an instance ships", decision "The server only reads, and answers at one named commit" |
| 8 | A person approves | A pass that finds nothing approves nothing; the Owner's word merges. | rule "The Owner's word merges", objective "Every gate an agent's work passes is held by a person", control "A reviewer reads the output, not the report" |
| 9 | The flow | check, then judge, then validate, then a person, drawn as one line with what each hands the next. | concept Check, concept Agent pass, the new feature page |
| 10 | Fixed and replaceable | Fixed: meta-model, mental model, check, rules, approval. Replaceable: the System One model, the System Two model, the agent, the editor, the graph database, each marked today or by design. | decision "Claude is the first agent an instance supports, and not the only one", objective "A company keeps its model with whichever agent it chooses", question "Does it only work with Claude, or can we use ChatGPT or Gemini?" |
| 11 | Measure before you swap | The System One model is pinned and its flags are read by a band measured against that one model; the Grounded Answer Rate measures the System Two answers; a new model is measured before it is named. | KPI Grounded Answer Rate, question "Can I trust what this chat says?", rule "A check counts only when its output was seen" |
| 12 | Six practices | Keep knowledge where no model owns it. Let code decide what code can decide. Ask typed questions before free text. A model proposes, a person decides. Pin every model and measure before moving it. Ask before data leaves the machine. | value "Run on what we publish" |
| 13 | Close | The model you will change most often is the one you should depend on least. | |
| 14 | Credits | Inspired by TypeSafe naming Jev a System One model; System One and System Two first named by Keith Stanovich and Richard West and made widely known by Daniel Kahneman; links to TypeSafe, its documentation and the two repositories. Added at the owner's ask after the English was reviewed. | |

The talk lives at `/talks/what-stays/` and is listed on `/talks/` after the levels talk.

## 3. Step 0: the judge in the company's model

One pull request in companygraph/mental-model before anything here: a feature page whose name says what the judge does, "A decision model asks each page its schema's writing rules", naming the concepts Agent pass, Schema, Rule and Instance, which are the only relations the feature schema gives a feature. It names no vendor or model, as that schema's writing rules ask; the talk names them. It went to the owner in chat on its own and was committed (Writer, Delivery, Implement, Prose) on the owner's word: companygraph/mental-model #104, merged as 71a096a.

## 4. Step 1 and step 2: the talk

Step 1 is the English deck in the site's deck design, built from the levels talk's page as its shell, with speaker notes on every slide and the rests-on chips opening the graph modal as on the other two talks. The owner reads it served locally, at a desk's width and a phone's, in both themes, before anything else is built.

Step 2, on the owner's word about the English: the German by the Translator seat after the reviewed English; the narration clips by the Narrator seat in both languages; both PDFs, the og card, the listing on `/talks/` and the sitemap. The content pin in `source.json` moves to the mental-model commit that carries step 0, and, as every content re-pin does, the meta-model and mcp-server pins move to their latest releases in the same pull request.

Each step's commits carry its seat: Specifier for this file, Implementer for the English and the wiring, Translator for the German, Narrator for the clips, Implementer for the PDFs, og and sitemap.

Verified by the talk checks, `npm run pages:check`, `npm run pin:check`, `npm run og:check`, `npm run sitemap:check` and `npm run verify` against a local server exiting 0; by every rests-on chip resolving to a page at the pinned commit; and by reading every slide and its note in both languages, both themes, at both widths.

## 5. Not in this design

A renamed skill. A second judge or a second agent, which the talk names as replaceable by design and does not build. Figay's maturity levels. The flow and lifecycle views of a bounded context. A LinkedIn post or episode about the talk, which is the communication repository's and waits for the owner.

## References

| What | URL |
| --- | --- |
| TypeSafe | https://typesafe.ai/ |
| TypeSafe's API, which the judge calls | https://docs.typesafe.ai/api |
| Jev explained as a System One decision model | https://www.datacamp.com/blog/system-one-models-jev |
