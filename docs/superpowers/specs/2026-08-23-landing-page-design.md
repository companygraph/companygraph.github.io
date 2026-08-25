# companygraph.io — landing page design

> **Partly superseded.** The page no longer leads with the convergence claim, the headline is set smaller, and the figure sits under the hero at every width; the reasoning is in [`2026-08-25-intro-talk-rework-design.md`](2026-08-25-intro-talk-rework-design.md) §2. The tagline, the links and every rule in §3 stand.

> One screen that says what CompanyGraph is and sends the visitor to the code.

**Status:** design agreed, not yet built.
**Date:** 2026-08-23

This is stage 2 of a three-part goal recorded in
[`companygraph/meta-model`](https://github.com/companygraph/meta-model), §3 of its design spec:
a landing page saying what the idea is, an introduction talk carrying the argument, and the
model itself. Stage 1 shipped. Stage 3 — `companygraph/talks` — follows this one and gets its
own spec.

---

## 1. The one claim this page owns

**Two independent instances converged on the same shape.**

That is the whole of it. Everything else a reader could check lives in `meta-model` and is
linked to, never restated here.

The division of labour is the point and it is stricter here than for a product site. The model
*is* prose; a page that explains it in its own words is a second copy of it, drifting. So this
page holds the hook and the links, the talk will hold everything a visitor asks next, and
anything checkable stays in the repository that owns it.

### Why this claim and not a better sales pitch

Three arguments were considered.

**The problem** — *"Your company is written down. Nothing can read it."* — is the strongest
pitch and was rejected. Knowledge scattered across wikis and trackers, resolving into one
queryable thing, is GuestGraph's sentence and GuestGraph's mark. By the same author, on a
shared design system, one click away, it would read as a house template rather than two
projects.

**The thesis** — *"Facts as Markdown. Structure you can check."* — is the argument the talk
makes and is completely distinct from the sibling, but puts an implementation detail in a
headline and reads smaller than the idea.

**The convergence** is the only claim nobody else can make, and it is the reason to believe the
vocabulary is not arbitrary. An adopter learns it was not designed in a vacuum; someone
evaluating the thinking sees the insight. It argues from the origin rather than from the
visitor's problem, which is its cost, and the tagline carries the weight the headline does not.

---

## 2. What the page says

**Headline**, on the display face's weight axis — light for the setup, heavy for where it
lands, `<em>` on the landing word:

```
Two companies.   The same shape.
   (light)        (heavy · em)
```

**Tagline** says plainly what the thing is, because the headline only carries the argument:
a meta-model for operating a company — the structure its knowledge takes, so people and agents
can both rely on it. Exact wording is drafted at implementation; it is one sentence and it must
not smuggle in a type count.

**One call to action:** the repository. There is no nav, because there is nowhere else to go.
When the talk ships, the header gains a nav item and a second button — the markup is built so
that is an addition, not a redesign.

**The figure draws the headline:** two unlike trees, one small and one large, sharing a
folder-and-file rhythm, resolving into the shape they both arrived at. It stays abstract. This
project's rules forbid naming or characterising the source companies, and the claim survives
being told as "a company of one" and "a company with a payroll".

**Audience:** both halves, sorted at the links — the talk for the curious, the repository for
the adopter. The known failure of writing for everyone is a headline that lands for nobody;
the guard is that the headline states a fact rather than a benefit.

---

## 3. What the page must not say

This matters more here than for the sibling, for a reason specific to CompanyGraph: the model
is five types of a planned eighteen and will move fast.

- **No type counts and no type list.** "Five core types" is wrong the week a sixth lands. That
  sentence belongs in the model's README, which ships in the same commit as the type.
- **No status and no roadmap.** *"The first release describes one person completely"* is
  honest, and it is the repository's sentence, not this page's.
- **No claim about packs**, which the model's own spec admits ships as prose with nothing
  demonstrating it.
- **Nothing identifying the source companies.**
- **No service and no pricing.** There is no hosted anything. The sibling's billing page is its
  one exception to restating nothing, earned because no other repository owns the commercial
  model. CompanyGraph has no equivalent and must not invent one.

The failure this guards against is not hypothetical: the sibling org's profile once advertised
"Core in development" while two slices had shipped, because it restated a roadmap owned
elsewhere. No CI in one repository can catch drift in another.

---

## 4. The mark

The sibling couples three things — glyph, hero figure, and the talk's central diagram are one
idea drawn three times. It can, because its product *is* resolution.

CompanyGraph splits that, more tidily: **the mark is the shape; the hero shows two things
arriving at it.** The mark is the destination the hero animation lands on.

The shape, as one glyph, is the model's own distinctive structural idea — it has exactly two
kinds of edge:

- **ownership**, carried by nesting: an entity that owns collections is a folder holding its
  own file
- **reference**, by canonical name: pointing across at something nothing owns

So: **an outlined square holding a filled one, with a line out to a second filled square.**
Containment and reference, which is §4 of the model's spec as a glyph. `currentColor`, so it
inherits whatever colour it is placed in.

**The favicon test is a gate, not an afterthought.** Four elements is a lot at 16px. Draw it,
render it small, and if the containment does not read, fall back to a plain nested tree rather
than shipping something muddy. A mark that is illegible at favicon size is not a mark.

Rejected: a convergence glyph — two clusters resolving to one shape, the hero compressed.
"Many resolve into one" is the sibling's mark; a second one would rhyme badly enough to look
like a template.

---

## 5. What this repo inherits

```
index.html          the page
CNAME               companygraph.io
logo.svg            the mark
favicon.svg
avatar.svg / .png   1024×1024 full-bleed; GitHub rounds it itself
og.png              the page at 1200×630
fonts/              4 woff2, copied from the sibling
verify/check.mjs    page assertions
verify/design.mjs   byte-identical fourth copy
robots.txt, sitemap.xml
package.json, README.md, CLAUDE.md
```

**The design system, joined as a fourth copy.** Same four colour stops, Bricolage Grotesque
with the weight axis carrying the argument, mono means data, fonts self-hosted and same-origin.
`verify/design.mjs` copies in byte-identical, so the design assertions arrive already written.
The cost is recorded and accepted: bumping the token version now means editing and testing four
repositories, and nothing can detect that one has fallen behind. The version marker in the
token block is what makes that a habit with a tripwire rather than a guarantee.

**The repository name is load-bearing.** `companygraph.github.io` makes this the org's Pages
site, so `CNAME` cascades to every other Pages repository in the org — `companygraph/talks`
will serve at `companygraph.io/talks/` with no configuration of its own. Renaming this
repository or dropping `CNAME` silently breaks the talks URL before it exists.

**Self-contained.** No external asset at all. Fonts referenced relatively, because a
root-absolute path works on the domain and breaks under `file://` — the one failure mode nobody
opens a browser to find.

**One URL, two languages.** English in the markup, German in `data-de`. No `hreflang`, because
there is no second URL to point one at. A known and accepted limit.

**Outbound links open in a new tab** (`target="_blank" rel="noopener"`); links that will later
point into `companygraph.io/talks/` stay in the tab, because a deck carries its own way back.

---

## 6. Two deliberate deviations from the sibling

**The sitemap ships flat.** The sibling's `sitemap.xml` is an index listing no URLs of its own,
because two repositories serve that domain. This one has a single page and no talks repository;
an index pointing at `/talks/sitemap.xml` would 404. So a flat sitemap now, and `CLAUDE.md`
records that it becomes an index the day talks lands. Building for a repository that does not
exist is how the sibling's own staleness rules get broken.

**This repository gets CI, where the sibling has none.** `verify` needs Playwright and a served
copy, both of which run fine in Actions. The argument was made in `meta-model` and holds here:
a suite that runs when someone remembers is not a suite. Same `protect-main` ruleset as the
other repositories, with `verify` required once it has reported at least once — a context that
has never reported blocks every pull request, including the one introducing it.

---

## 7. Prerequisites outside the repository

None of these can be done from here, and the first blocks the domain entirely.

- **Repoint `companygraph.io` at GitHub Pages.** It currently resolves to `217.26.48.101`, a
  single host at the registrar. It needs the four Pages A records, as `guestgraph.io` has.
  Until then the site serves at `companygraph.github.io` and `CNAME` fails verification.
- **Upload `avatar.png`** at Organisation → Settings → Profile. GitHub accepts no SVG and
  offers no API for it. The org is still on a generated identicon.
- **Set the org's description and blog URL.** Both are empty.

---

## 8. Deferred

- **The second link and the nav**, which arrive with the talk. The page ships with one call to
  action rather than a "talk coming soon", because a status claim that goes stale is exactly
  what §3 forbids.
- **The talk's length**, which the sibling restates inline because a call to action needs it.
  That obligation begins the day the deck exists, and `CLAUDE.md` should name it then as the
  one fact this site restates.
- **A second page.** The sibling has one; this has no commercial model to own and must not
  invent one.
