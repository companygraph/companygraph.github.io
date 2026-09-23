# The team page draws the chat — design

> The company's model holds a fourth process since today, Answering, with the seats the chat works by: the Answerer, held by the AI Agent, the Visitor, and the Owner at its gate. The site takes that commit, draws the fourth board after Feature request, adds the verb to the seats its tagline lists, and points the chat's cites at the page where the company's own graph is drawn. One pull request here.

Status: proposed. Decided on 2026-09-23 against this repository at 5cafa82, whose `source.json` pins companygraph/mental-model at b57438b, and against companygraph/mental-model at 670ee12, whose files were read that day. The model changes the site takes are companygraph/mental-model #24, the pages' words in the model, and #25, the chat as a seat and a process, both merged. The chat tag's model page was decided in robertblust/design #121 and is built here because it is the site's attribute.

## 1. What is true today

`source.json` pins the company's model at b57438b. Since that commit the model gained the words of the CLI, model, example, talks, billing and privacy pages and those pages as units of the website surface, a feature for the CLI, and the family's name for its second language in six places where the site's `company.json` still says Swiss German (#24); and a fourth process, Answering, with two new seats, the Answerer and the Visitor, the AI Agent holding the Answerer (#25). Everything the site derives from that pin, `company.json`, the landing graph, the principles, team and surfaces pages and the JSON-LD, rebuilds from it. The meta-model pin beside it is a different commit of a different repository and does not move here.

The team page draws three boards in the order `build/pages.mjs` names, Delivery, Contribution, Feature request, and its tagline reads "An AI agent holds the seats that specify, plan, control, implement, review, write and translate. Every gate is approved by a seat a person holds." in both languages. No seat is counted on the page. Both pages that carry the chat's tag say `data-model="/model/"`, the page that draws the meta-model's vocabulary, while the stage that draws the company's own model, the one mcp.companygraph.io serves, is the home page; so a cite under an answer opens the wrong graph today.

## 2. What was decided

**The order gains Answering last.** The work, how an outsider joins it, how an outsider asks for what is missing, and then how a stranger is answered: `order: ["Delivery", "Contribution", "Feature request", "Answering"]`, so the renderer refuses the build if a name leaves the model.

**The tagline lists the new seat.** "An AI agent holds the seats that specify, plan, control, implement, review, write, translate and answer. Every gate is approved by a seat a person holds.", with the German drafted for the Translator as "Ein KI-Agent hält die Sitze, die spezifizieren, planen, steuern, umsetzen, prüfen, schreiben, übersetzen und antworten. Jedes Gate wird von einem Sitz freigegeben, den ein Mensch hält." The second sentence is now true of the chat as well, and the process says how: the gate is the rules, the pinned commit, the fence and the switch, passed once. The headline stays.

**The chat's cites open the home page.** `data-model="/"` on every page that carries the tag, and the page check proves that a cite's address, the home page with `?stage=expanded` and an entity's id as the hash, opens that entity's card on the landing graph.

**Nothing else on the page is typed.** The fourth board, its legend, the phases in words and the head rail are the renderer's, read from the phase's own fields.

## 3. The pull request

One pull request, after #203, the one-line fix to this repository's own `AGENTS.md`, has merged. In order: `source.json` moves the mental-model commit to 670ee12; `npm run model` rewrites `company.json`, which also takes the corrected name of the second language; `build/pages.mjs` gains the fourth name and `npm run pages` regenerates the team page; the two tagline sentences move; `data-model` moves on both pages; `npm run og` re-renders the cards whose stamp moved; `npm run sitemap`.

Verified by `npm run design:check`, `npm run model:check`, `npm run pages:check`, `npm run verify` on a served copy, `npm run og:check` and `npm run sitemap` exiting 0; by a plain grep of `company.json` finding no "Swiss German"; and by reading the rendered team page in both languages, both themes, at a desk's width and a phone's: four boards in that order, Answering with the Owner approving the gate, the Visitor supporting without a name, the Answerer executing and held by the AI Agent; and by opening a cite from the chat and landing on the card on the home page.

## 4. Not in this design

The re-pin of mcp.companygraph.io to the same commit, which waits for the owner's word. The chat's cite line and link style themselves, which are design's #121 and reach this site with that release. The meta-model pin, which moves on its own release.
