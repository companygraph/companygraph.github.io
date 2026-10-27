# The talk on the requirements pack: how far a release meets it — design

> Two slides join the talk on the requirements pack, on how far a release realizes a requirement and on whose levels those are, and two slides follow the pack's README at v0.95.0. One pull request, in the two steps the pack talks take, stacked on the re-pin it rests on.

Status: decided by the owner on 2026-10-27, against this repository at 5a0f947, the re-pin that takes meta-model v0.95.0 and companygraph/mental-model 9d63a78. This extends `2026-10-12-talk-on-the-requirements-pack-design.md`, whose decisions hold for every slide this one does not name, and §2 and §7 of `2026-10-10-talks-on-core-and-packs-design.md`.

## 1. What is true today

meta-model v0.95.0 adds two types to the requirements pack, `requirement-realization` and `use-case-realization`: levels an instance defines, one page each, with a `rank` that orders them and an `evidence` of `none`, `satisfies` or `verifies` that says what a page at the level must show. A requirement or a use case names its level in `realization`, says in `## Realization` what is realized and what is missing, and lists in `## Evidence` the rows that show it, each a permalink at a commit with `Shows` saying whether it builds the requirement or observes what its fit criterion observes. A check holds a page to what its level asks. The pack's README adds three departures and drops satisfy and verify from Left for later.

companygraph/mental-model 9d63a78 defines four requirement levels, Verified, Released, Partly released and Not released, and three use-case levels, Released end to end, Main scenario released and Not released, each read against the latest tagged release of the product that carries the page, with a repository that deploys rather than tags released at the commit it deployed; every requirement and use case names its level. A list arrives in pages that neither repeat nor skip is Verified by two tests of mcp-server v0.69.0 and applies to Walk a long list a page at a time, the subfunction slide 12 already draws.

## 2. What was decided

**Tell how CompanyGraph uses it, and that the use is the company's own.** The two slides show our own levels and one of our own requirements at one, and say that a company measuring something else, a proof of concept or a pilot, writes its own levels as pages, as it writes its decision statuses, with no release of the meta-model. No company is named.

**No count on a slide.** How many requirements stand at a level moves with every release, so no slide, note or label counts them.

**A realization, not a status.** The notes say so once, since the reader knows status as the word for this, and say why: how far the specification answers a requirement is derived from what names it, how far a release meets it needs evidence.

## 3. The slides

The new slides stand after `s-rule`, so the talk runs from the requirement and its words to how far it is met, before where the pack departs; every slide after them moves two places on and keeps its id.

| # | Slide | What it says | Rests on |
| --- | --- | --- | --- |
| 9 | How far a release meets it (`s-realized`) | A window on A list arrives in pages that neither repeat nor skip: its frontmatter with `realization: Verified`, its H1, then `…`, then `## Evidence` with its three rows. A requirement names how far the latest release meets it and the evidence that shows it: a row that satisfies builds it, a row that verifies observes what the fit criterion observes. The check holds the page to what its level asks. | requirement A list arrives in pages that neither repeat nor skip, requirement-realization Verified, use-case Walk a long list a page at a time |
| 10 | Your levels, your measure (`s-levels`) | A `.departs` list, a level and the evidence it asks on the left and its tagline on the right: Verified · verifies, Released · satisfies, Partly released · satisfies, Not released · none. Ours are read against the latest tagged release, and a site counts at the commit it deployed. A company writes its own: a page per level, a rank to order them, the evidence each asks. | requirement-realization Verified, Released, Partly released and Not released, concept Pack |
| 11 | Where it departs (`s-departs`) | Gains one row from the README at v0.95.0: SysML's satisfy and verify relationships · a `Shows` column on the requirement's own Evidence row, since the code and the tests have no page to draw from. The README's two other new departures, one ordered level for two statuses and the instance's own values, are said on slide 10. | concept Pack |
| 13 | Left for later (`s-later`) | SysML's derive, satisfy and verify becomes SysML's derive, as the README has it at v0.95.0. | concept Pack |

A cell of the window too wide for the slide is cut at its end and marked `…`, as a cut line is; the URL's release tag stays visible. The notes of slide 10 name the use cases' three levels and the README's point that practice keeps implementation and verification as two statuses where the pack keeps one ordered level whose evidence decides.

## 4. The two steps

As the October 12 design's §4, on the branch `talk-requirements-pack-realization`, stacked on `takes-realization`. Step 1 is the English of the four slides with the narration of every changed note, served on the LAN for the owner's read; nothing past this spec and its plan is committed until the owner says the English is right. Step 2, on the owner's word, is the German of the four slides by the three roles, the German clips, both PDFs, the card and the listing's length, and the verify entry's slide count.

## 5. Not in this design

A picture of realization drawn by the MCP server, which draws none at v0.69.0. A change to the use case Ask the company a question, whose extension 1a no rule of chat-server's prompt yet holds. A post or an episode about the change.
