# companygraph.io Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build companygraph.io — one screen that says what CompanyGraph is and sends the
visitor to the code, with a verify suite that renders the page and asserts it.

**Architecture:** A single self-contained `index.html`. No build step, no external asset, no
framework. The tests are Playwright assertions against a served copy, following the harness
three sibling repositories already share: `verify/design.mjs` copies in byte-identical and
brings the design assertions with it; `verify/check.mjs` is this page's own.

**Tech Stack:** HTML and CSS by hand. Node with Playwright for `verify` and the og render.
Python's `http.server` to serve. Nothing else.

**Spec:** [`docs/superpowers/specs/2026-08-23-landing-page-design.md`](../specs/2026-08-23-landing-page-design.md)
— read §1 (the one claim), §2 (what the page says), §3 (what it must not say) and §4 (the mark)
before starting. Where plan and spec disagree, the spec wins and the plan is wrong.

## Global Constraints

Copied from the spec. Every task's requirements implicitly include this section.

- **The page owns exactly one claim: two independent instances converged on the same shape.**
  Everything a reader could check lives in `companygraph/meta-model` and is linked to.
- **Never on this page:** a type count, a type list, a status, a roadmap, a claim about packs,
  anything identifying the source companies, or any service or price. There is no hosted
  anything.
- **Self-contained.** No external asset of any kind. Fonts served from `fonts/` and referenced
  **relatively** — a root-absolute path works on the domain and breaks under `file://`.
- **One URL, two languages.** English in the markup, German in `data-de`. No `hreflang`.
- **Outbound links** carry `target="_blank" rel="noopener"`.
- **Mono means data.** Never on nav, buttons, headings, taglines or prose — `verify` fails it.
- **Brightness is confidence**, and each stop has one job: `--c-weak` a candidate not accepted,
  `--c-mid` anything interactive, `--c-firm` the resolved thing, `--c-flag` a reversal at most
  once per page and never decoration.
- **The token block is a copy**, fenced by `design tokens · vN` markers, and `verify` asserts
  both the values and the version marker.
- **The repository name is load-bearing.** `companygraph.github.io` makes this the org's Pages
  site; `CNAME` cascades to every other Pages repo in the org.

## File Structure

```
index.html            the page — token block, styles, markup, all inline
CNAME                 companygraph.io
logo.svg              the mark; currentColor
favicon.svg
avatar.svg / .png     1024×1024 full-bleed
og.png                the page at 1200×630, rendered by export-og.mjs
export-og.mjs         Playwright render of the og card
fonts/                4 woff2, copied from the sibling
verify/design.mjs     byte-identical fourth copy — do not edit
verify/check.mjs      this page's assertions
robots.txt
sitemap.xml           flat, one URL; becomes an index the day talks lands
package.json
README.md             what the files are, and what the mark means
CLAUDE.md             the constraints that are easy to break
.github/workflows/ci.yml
```

`index.html` stays one file. It is one screen, everything in it changes together, and a deck in
a sibling repo has to open from `file://` — which is why these sites share no stylesheet at all.

---

### Task 1: The harness, and a page for it to check

The smallest thing that produces a green suite: the shared design assertions, the fonts they
measure, and a skeleton page carrying the token block. Copy is Task 2; the mark is Task 3.

**Files:**
- Create: `package.json`, `verify/design.mjs`, `verify/check.mjs`, `index.html`, `fonts/` (4 files)

**Interfaces:**
- Produces: `PAGES` — an array of page specs in `verify/check.mjs`. A spec's keys select which
  checks run: a check whose name is absent from the spec is skipped. Later tasks add keys to
  the existing spec rather than adding checks.
- Produces: `CHECKS` — this task defines `{...DESIGN_CHECKS, title, lang}`. Tasks 2 and 5 add
  `contains`, `links`, `internalLinks` and `card` to the same object.

- [ ] **Step 1: Copy what is shared, verbatim**

```bash
cd ~/git/companygraph.github.io
mkdir -p fonts verify
cp ~/git/guestgraph.github.io/verify/design.mjs verify/design.mjs
cp ~/git/guestgraph.github.io/fonts/*.woff2 fonts/
md5 -q verify/design.mjs ~/git/guestgraph.github.io/verify/design.mjs
```

The two hashes must match. `design.mjs` is byte-identical across every repo that shares the
design system — if you find yourself editing it, you are solving the wrong problem.

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "companygraph-io",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "serve": "python3 -m http.server 8000",
    "verify": "node verify/check.mjs"
  },
  "devDependencies": { "playwright": "^1.49.1" }
}
```

Then `npm install && npx playwright install chromium`.

- [ ] **Step 3: Write the failing test**

Create `verify/check.mjs`:

```js
// The deliverable is a rendered page, so the tests are assertions against a rendered DOM.
// Run against a served copy: npm run serve, then npm run verify.
//
// The design assertions live in verify/design.mjs, which is a byte-identical copy in every
// repository sharing the design system. See the comment at its head for what that does and
// does not guarantee.
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "./design.mjs";

const BASE = process.env.BASE || "http://localhost:8000";

const PAGES = [
  { path: "/", title: /CompanyGraph/, lang: "en",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
  async title(page, spec) {
    const t = await page.title();
    if (!spec.title.test(t)) return `title ${JSON.stringify(t)} does not match ${spec.title}`;
    if (t.length > 70) return `title is ${t.length} chars, over 70`;
    return null;
  },
  async lang(page, spec) {
    const l = await page.evaluate(() => document.documentElement.lang);
    return l === spec.lang ? null : `lang=${l}, expected ${spec.lang}`;
  },
};

const browser = await chromium.launch();
let failures = 0;

for (const spec of PAGES) {
  const page = await browser.newPage();
  const jsErrors = [];
  page.on("pageerror", e => jsErrors.push(String(e)));
  const missing = [];
  page.on("requestfailed", r => missing.push(r.url().split("/").pop()));
  const problems = [];
  spec.absolute = BASE + spec.path;
  try {
    const res = await page.goto(spec.absolute, { waitUntil: "networkidle" });
    if (!res || !res.ok()) problems.push(`HTTP ${res ? res.status() : "no response"}`);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    for (const [name, fn] of Object.entries(CHECKS)) {
      if (spec[name] === undefined) continue;
      const problem = await fn(page, spec);
      if (problem) problems.push(`${name}: ${problem}`);
    }
  } catch (e) { problems.push(String(e)); }
  if (jsErrors.length) problems.push("JS errors: " + jsErrors.join(" | "));
  if (missing.length) problems.push("failed requests: " + missing.join(", "));
  console.log((problems.length ? "✗" : "✓") + " " + spec.path +
    (problems.length ? "\n    " + problems.join("\n    ") : ""));
  failures += problems.length ? 1 : 0;
  await page.close();
}
await browser.close();
console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
```

- [ ] **Step 4: Run it to verify it fails**

```bash
npm run serve &   # or a second terminal
npm run verify
```
Expected: FAIL — `HTTP 404`, because `index.html` does not exist.

- [ ] **Step 5: Write the skeleton page**

Create `index.html`. Copy the `@font-face` rules and the token block **verbatim** from
`~/git/guestgraph.github.io/index.html` — the token values and the `design tokens · v1` marker
must match exactly or `tokens` and `tokenVersion` fail. Reword only the comment's first line,
which currently says "keep in step across all three repositories": make it name no count, so it
cannot go stale. Task 8 propagates that rewording.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CompanyGraph — a meta-model for operating a company</title>
<style>
  /* @font-face rules: copy verbatim from the sibling, paths relative: url("fonts/…") */
  /* design tokens block: copy verbatim, comment reworded to name no repository count */
  *{box-sizing:border-box; margin:0; padding:0}
  body{background:var(--ground); color:var(--ink);
       font-family:"Instrument Sans", system-ui, sans-serif; line-height:1.5}
  h1{font-family:"Bricolage Grotesque", system-ui, sans-serif}
</style>
</head>
<body>
<main>
  <h1>CompanyGraph</h1>
</main>
</body>
</html>
```

- [ ] **Step 6: Run it to verify it passes**

Expected: `✓ /` and `all checks pass`, exit 0.

- [ ] **Step 7: Prove the design checks bite**

Each must fail, and be restored. A check that has never failed is not known to work.

1. Change `--c-mid` to `#666666` → expect `tokens: --c-mid is #666666, expected #7FA3D8` **and**
   `contrast: --c-mid is …:1 on --ground, needs 4.5:1`.
2. Change the marker to `design tokens · v9` → expect
   `tokenVersion: page says v9, this suite expects v1`.
3. Add `font-family:"IBM Plex Mono", monospace` to the `h1` rule → expect
   `monoScope: monospace used outside data: h1`.
4. Change a `@font-face` `src` to `url("fonts/missing.woff2")` → expect `fontsLoaded` to fail
   and the run to list a failed request.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json verify fonts index.html
git commit -m "Render the page in a browser and assert what it renders"
```

---

### Task 2: The hero

The page's argument, its one sentence of explanation, and its single link out.

**Files:**
- Modify: `index.html`, `verify/check.mjs`

**Interfaces:**
- Consumes: `PAGES`, `CHECKS` from Task 1.
- Produces: the `.r70` / `.rcl` span pair on `h1` — Task 4's figure is positioned against it.

- [ ] **Step 1: Write the failing test**

Add to the `/` spec in `PAGES`:

```js
    contains: ["Two companies", "The same shape", "CompanyGraph"],
    links: ["https://github.com/companygraph/meta-model"],
    internalLinks: true,
```

Add to `CHECKS`, after `lang`:

```js
  async contains(page, spec) {
    const text = await page.evaluate(() => document.body.innerText);
    for (const s of spec.contains)
      if (!text.includes(s)) return `body text is missing ${JSON.stringify(s)}`;
    return null;
  },
  // An outbound link that steals the tab loses the visitor; one that opens a new tab
  // without rel=noopener hands the opener a window reference. Both are invisible in review.
  async links(page, spec) {
    const found = await page.evaluate(() =>
      [...document.querySelectorAll("a[href^='http']")].map(a =>
        ({ href: a.href, target: a.target, rel: a.rel })));
    for (const want of spec.links) {
      const hit = found.find(l => l.href === want);
      if (!hit) return `missing outbound link ${want}`;
      if (hit.target !== "_blank" || !hit.rel.includes("noopener"))
        return `${want} must open in a new tab with rel=noopener`;
    }
    return null;
  },
  // A root-absolute internal path works on the domain and breaks under file://, which is
  // the one failure mode nobody opens a browser to find.
  async internalLinks(page) {
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll("[href], [src]")]
        .map(el => el.getAttribute("href") || el.getAttribute("src"))
        .filter(v => v && v.startsWith("/")));
    return bad.length ? "root-absolute internal path: " + bad.join(", ") : null;
  },
```

- [ ] **Step 2: Run it to verify it fails**

Expected: FAIL — `contains: body text is missing "Two companies"`.

- [ ] **Step 3: Write the hero**

Replace `<main>`'s contents. The headline carries the argument on the weight axis — light for
the setup, heavy where it lands, `<em>` on the landing word. The tagline says what the thing is,
because the headline does not.

```html
<main>
  <section class="hero">
    <h1 data-de="<span class='r70'>Zwei Unternehmen.</span><span class='rcl'>Dieselbe <em>Form</em>.</span>"><span class="r70">Two companies.</span><span class="rcl">The same <em>shape</em>.</span></h1>
    <p class="tagline" data-de="Ein Meta-Modell für den Betrieb eines Unternehmens — die Struktur, die sein Wissen annimmt, damit Menschen und Agenten sich darauf verlassen können.">A meta-model for operating a company — the structure its knowledge takes, so people and agents can both rely on it.</p>
    <div class="cta">
      <a class="btn" href="https://github.com/companygraph/meta-model" target="_blank" rel="noopener"
         data-de="Das Modell ansehen">Read the model</a>
    </div>
  </section>
</main>
```

Style `.r70` at a light weight and `.rcl` at a heavy one on the display face's variable axis,
matching the sibling's treatment. `em` takes `--c-firm` — it is the resolved thing.

Write the language toggle to swap `data-de` into place. English stays in the markup so a
crawler reads English, which is what the og tags will promise.

- [ ] **Step 4: Run it to verify it passes**

Expected: `all checks pass`.

- [ ] **Step 5: Prove the new checks bite**

1. Drop `rel="noopener"` from the button → expect
   `links: https://github.com/companygraph/meta-model must open in a new tab with rel=noopener`.
2. Change the `href` to `/meta-model` → expect both a missing-outbound-link failure and
   `internalLinks: root-absolute internal path: /meta-model`.
3. Change the headline's second span to `The same form.` → expect
   `contains: body text is missing "The same shape"`.

- [ ] **Step 6: Read the page against §3 of the spec**

Open it and check the rendered text says nothing the spec forbids: no type count, no type list,
no status, no roadmap, no pack claim, no source company, no service, no price. This is a reading
step, not a scripted one — the assertions cannot catch a sentence that should not be there.

- [ ] **Step 7: Commit**

```bash
git add index.html verify/check.mjs
git commit -m "Say the one thing this page is for, and link to the code"
```

---

### Task 3: The mark

Containment and reference — the model's two kinds of edge, as one glyph.

**Files:**
- Create: `logo.svg`, `favicon.svg`, `avatar.svg`, `avatar.png`
- Modify: `index.html`

**Interfaces:**
- Consumes: nothing.
- Produces: `logo.svg` inlined into `index.html`'s header lockup; `favicon.svg` linked from
  `<head>`.

- [ ] **Step 1: Draw the mark**

Create `logo.svg`. An outlined square holding a filled one — ownership, carried by nesting —
with a line out to a second filled square: reference, by canonical name, to something nothing
owns. `currentColor` throughout, so it inherits whatever colour it is placed in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.5" stroke-linecap="square">
  <rect x="1.75" y="5.75" width="10.5" height="12.5" rx="1.5"/>
  <rect x="4.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none"/>
  <path d="M12.25 12 h4.5"/>
  <rect x="16.75" y="9.5" width="5" height="5" fill="currentColor" stroke="none"/>
</svg>
```

Treat these coordinates as a starting point, not a result. Adjust until it reads.

- [ ] **Step 2: The favicon gate — render it at 16px and look**

```bash
node -e '
import("playwright").then(async ({chromium}) => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<body style="margin:0;background:#0C0E13;color:#EFEDE8">
    <div style="width:16px">`+require("fs").readFileSync("logo.svg","utf8")+`</div></body>`);
  await p.locator("div").screenshot({ path: "/tmp/favicon-16.png" });
  await b.close();
});'
open /tmp/favicon-16.png
```

**This is a gate.** If the containment does not read at 16px — if the outer square and its
filled child merge into one blob — do not ship it. Fall back to a plain nested tree: three
marks in a column with one indented. A mark that is illegible at favicon size is not a mark,
and a muddy one is worse than a plain one.

- [ ] **Step 3: Derive the favicon and the avatar**

`favicon.svg` is `logo.svg` with an explicit colour rather than `currentColor` — a favicon has
no inherited context. `avatar.svg` is the mark centred on `--ground` at 1024×1024, **full
bleed**: GitHub rounds org avatars itself, and a rounded rectangle here shows its corners
through that mask. Render `avatar.png` from it at 1024×1024.

- [ ] **Step 4: Put the mark on the page**

Inline `logo.svg` into a header lockup beside the wordmark, and link `favicon.svg` from
`<head>`. Inline rather than `<img>`: `currentColor` only works inlined, and an `<img>` is a
second request on a page whose rule is that it makes none.

- [ ] **Step 5: Run the suite**

Expected: `all checks pass`. The suite lists failed requests, so a mistyped favicon path fails
the run rather than passing quietly.

- [ ] **Step 6: Commit**

```bash
git add logo.svg favicon.svg avatar.svg avatar.png index.html
git commit -m "Draw the model's two edges as one glyph"
```

---

### Task 4: The figure

The hero's argument, drawn: two unlike trees arriving at the same shape.

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: the `.hero` section from Task 2.
- Produces: `.figure` — Task 5's og render hides this element by class name.

- [ ] **Step 1: Draw the settled state first**

Inline SVG in a `<figure class="figure">` after the hero. Left: a small tree — a handful of
nodes, one nested inside another. Right: a large tree, many more nodes, same nesting rhythm.
Between and below them: the shape they share, drawn in `--c-firm` as the resolved thing.

The two source trees use `--c-weak`: they are candidates, considered and not accepted as the
answer — the shape is. That is what the colour stop means, and using `--c-mid` here would say
they are interactive, which they are not.

**It must stay abstract.** No company name, no headcount, no industry. "A company of one" and
"a company with a payroll" is the whole characterisation the spec permits.

Build the settled state before any animation. If the page is right when nothing moves, the
animation is decoration; if it is only right once the animation finishes, the animation is
load-bearing and the og card will be wrong.

- [ ] **Step 2: Add the animation, and its settled fallback**

Animate the two trees drawing in, then the shape resolving last. Then add:

```css
@media (prefers-reduced-motion: reduce) {
  /* the settled state, exactly: every element at its final opacity and transform,
     no transitions, no delays */
}
```

This block is not an accessibility afterthought — Task 5 renders the og card with reduced
motion emulated, so **this block is what the card shows.** If it is wrong or missing, the card
ships showing two trees arriving at nothing.

- [ ] **Step 3: Run the suite, then look at both themes and a phone width**

Expected: `all checks pass`. Then open the page and check it renders at 375px wide. Verify by
rendering, not by reading the diff.

- [ ] **Step 4: Prove the reduced-motion state is complete**

In devtools, emulate `prefers-reduced-motion: reduce`, reload, and screenshot immediately —
before any timer could have run. Every element of the figure must be present and final. If
anything is missing, the fallback is incomplete and Task 5 will ship a broken card.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Draw two companies arriving at the same shape"
```

---

### Task 5: Findability

The domain, the crawl map, and the card a link unfurls into.

**Files:**
- Create: `CNAME`, `robots.txt`, `sitemap.xml`, `export-og.mjs`, `og.png`
- Modify: `index.html`, `verify/check.mjs`

**Interfaces:**
- Consumes: `.figure` from Task 4, `PAGES` and `CHECKS` from Task 1.
- Produces: `og.png` at 1200×630 and the meta tags declaring that exact size.

- [ ] **Step 1: Write the failing test**

Add `card: true, cardBase: "https://companygraph.io"` to the `/` spec, and to `CHECKS`:

```js
  // A card whose declared size does not match the file renders letterboxed or cropped on
  // every platform that trusts the tags, and nothing on the page reveals it.
  async card(page, spec) {
    const meta = await page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll("meta[property^='og:'], meta[name^='twitter:']")]
        .map(m => [m.getAttribute("property") || m.getAttribute("name"), m.content])));
    for (const k of ["og:title", "og:description", "og:image", "og:url", "og:type"])
      if (!meta[k]) return `missing ${k}`;
    if (!meta["og:image"].startsWith(spec.cardBase))
      return `og:image is ${meta["og:image"]}, must be absolute under ${spec.cardBase}`;
    if (meta["og:image:width"] !== "1200" || meta["og:image:height"] !== "630")
      return `og:image declares ${meta["og:image:width"]}×${meta["og:image:height"]}, file is 1200×630`;
    return null;
  },
```

- [ ] **Step 2: Run it to verify it fails**

Expected: FAIL — `card: missing og:title`.

- [ ] **Step 3: Write the domain and crawl files**

`CNAME` — one line, no trailing content:

```
companygraph.io
```

`robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://companygraph.io/sitemap.xml
```

`sitemap.xml` — **flat, one URL.** The sibling's is an index because two repositories serve
that domain; ours has one page and no talks repository, and an index pointing at
`/talks/sitemap.xml` would 404. It becomes an index the day talks lands, and `CLAUDE.md`
records that obligation in Task 6.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://companygraph.io/</loc></url>
</urlset>
```

- [ ] **Step 4: Add the og tags**

In `<head>`, with `og:image` absolute (a card URL must resolve from anywhere), `og:type` set to
`website`, and width and height declared as `1200` and `630`. `og:description` is the tagline —
the same sentence, not a second copy written differently.

- [ ] **Step 5: Write the render script**

Create `export-og.mjs`. Two things matter and both are learned failures from the sibling:

```js
// The og card is the page itself, rendered. Two things must be right or it ships wrong in a
// way that looks deliberate:
//
// 1. reducedMotion:"reduce" — the figure animates, and a render that merely waits "long
//    enough" catches it mid-draw. Emulating reduced motion draws the settled state the
//    page's own @media block defines, exactly, instead of racing a timer.
// 2. .figure is hidden — the figure runs the full page width and cannot fit a 1.9:1 crop.
//    Included, it cuts the two trees off above the shape they arrive at, so the card shows
//    the argument's setup with no conclusion, which says the opposite of the page.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 675 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await page.goto(process.env.BASE || "http://localhost:8000/", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: ".figure{display:none}" });
await page.screenshot({ path: "og.png", clip: { x: 0, y: 22, width: 1200, height: 630 } });
await browser.close();
console.log("wrote og.png 1200×630");
```

Add `"og": "node export-og.mjs"` to `package.json` scripts.

- [ ] **Step 6: Render the card and look at it**

```bash
npm run og && file og.png && open og.png
```

Expected: `PNG image data, 1200 x 630`. Then **look at it.** It must carry the lockup, the
headline and the call to action, and that must read as a complete thought without the figure.
If it looks like a page with something missing, adjust the clip rather than shipping it.

- [ ] **Step 7: Run the suite and commit**

Expected: `all checks pass`.

```bash
git add CNAME robots.txt sitemap.xml export-og.mjs og.png index.html verify/check.mjs package.json
git commit -m "Make the page findable, and its card a complete thought"
```

---

### Task 6: The documents

`README.md` says what the files are; `CLAUDE.md` says what is easy to break.

**Files:**
- Create: `README.md`, `CLAUDE.md`

**Interfaces:** none.

- [ ] **Step 1: Write `README.md`**

Cover: what the site is and where it lives; each file and what it is for; what the mark means —
containment and reference, the model's two kinds of edge, and that it is the shape the hero's
two trees arrive at; how to run it (`npm run serve`, `npm run verify`, `npm run og`); and a
section on what the page deliberately does not say, pointing at `meta-model` as the owner of
every claim it declines to make.

- [ ] **Step 2: Write `CLAUDE.md`**

This is the more valuable of the two. It must carry, each with its reason:

- **One screen, one job**, and the full §3 list of what the page must never say — with the
  reason: the model is a handful of types of a planned many and moves fast, so any count here
  is wrong within a release.
- **The repository name is load-bearing.** `CNAME` cascades to every Pages repo in the org;
  renaming this repo or dropping `CNAME` silently breaks `companygraph.io/talks/` before it
  exists.
- **Self-contained, fonts relative** — a root-absolute path works on the domain and breaks
  under `file://`.
- **The design system is a copy**, fenced by version markers, shared with the sibling
  repositories. Bumping the version means bumping it in all of them and running all their
  suites. Nothing can tell you a sibling has fallen behind: it is a habit with a tripwire, not
  a guarantee.
- **The og card**: rendered with reduced motion emulated and `.figure` hidden, and its declared
  size must keep matching the file.
- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API.
- **The sitemap is flat, and becomes an index the day `companygraph/talks` exists.** Name this
  explicitly as a debt, or it will be found by a crawler rather than by a person.
- **When the talk ships**, the page gains a nav item and a second button, and it inherits the
  sibling's one restated fact: the talk's length, quoted inline because a call to action needs
  it. That obligation begins then, not now.
- **Verify by rendering, not by reading the diff.** Both themes, and a phone width.
- **Commits happen when the user asks**; suggest a message, do not auto-commit.

- [ ] **Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "Write down what this page must not say"
```

---

### Task 7: CI and branch protection

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: a status check context named `verify`, required by the ruleset afterwards.

- [ ] **Step 1: Write the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Serve the site
        run: python3 -m http.server 8000 &
      - name: Assert what it renders
        run: npm run verify
```

- [ ] **Step 2: Commit, push, and open a pull request**

The workflow must run at least once before the ruleset can require it: a status check context
that has never reported blocks every pull request, including the one introducing it.

```bash
git add .github/workflows/ci.yml
git commit -m "Run the checks on every pull request, not on remembering to"
git push -u origin HEAD
gh pr create --base main --title "Run the checks on every pull request" --body \
"Adds .github/workflows/ci.yml.

The verify suite renders the page and asserts it, and until now it has only ever run when
someone typed it. Follows the shape engine uses in the other organisation: CI, on push to main
and on every pull request, with the job named verify so the status-check context matches.

The branch ruleset gains verify as a required check AFTER this merges. A context that has never
reported blocks every pull request, including the one introducing it."
```

- [ ] **Step 3: Confirm the context name**

```bash
gh pr checks
```
Expected: a row named `verify` reporting `pass`. If it reports under another name, the ruleset
must require that name instead — the context is the job id, not the workflow name.

- [ ] **Step 4: After merge, add the ruleset**

Match the sibling repositories exactly: `protect-main`, active, `~DEFAULT_BRANCH`, bypass for
`RepositoryRole:5` with mode `always`, and four rules — `deletion`, `non_fast_forward`,
`pull_request` (0 required approvals, dismiss stale reviews on push), and
`required_status_checks` requiring `verify` with `strict_required_status_checks_policy: true`.
Copy the parameters from `guestgraph/engine`'s ruleset rather than composing them by hand, then
diff the two to confirm they match.

---

### Task 8: Reword the shared token comment across the sibling repositories

**This task edits three repositories other than this one. Confirm with the user before
starting it.**

**Files:**
- Modify: `index.html` in `~/git/guestgraph.github.io`; `index.html` in `~/git/talks` and its
  deck(s); `index.html` and the deck pages in `~/git/robertblust.github.io`

**Interfaces:** none.

- [ ] **Step 1: Find every copy**

```bash
grep -rn "design tokens · v" ~/git/guestgraph.github.io ~/git/talks ~/git/robertblust.github.io \
  --include=*.html
```

- [ ] **Step 2: Reword, without touching the marker**

The comment currently reads `design tokens · v1 · keep in step across all three repositories`.
There are now four. Replace the count with wording that names none — the marker itself
(`design tokens · v1`) must not change, because `verify` matches on it in every repository.

A count in a comment is the same defect this project keeps finding in prose: a number that is
correct on the day it is written and silently wrong afterwards, with nothing to catch it.

- [ ] **Step 3: Run each repository's suite**

```bash
for r in ~/git/guestgraph.github.io ~/git/talks ~/git/robertblust.github.io; do
  (cd $r && npm run verify) || echo "FAILED: $r"
done
```

All three must still pass — the marker is unchanged, so `tokenVersion` still matches.

- [ ] **Step 4: Commit in each repository separately**

Each gets its own commit, in its own repository, with the same message:
`Stop the token comment counting repositories`

---

## Not in this plan

Per the spec, deliberately excluded:

- **A nav and a second call to action.** They arrive with `companygraph/talks`. Shipping "talk
  coming soon" is precisely the stale status claim §3 forbids.
- **The talk's length**, restated inline. That obligation begins the day the deck exists.
- **A second page.** The sibling has one because no other repository owns its commercial model.
  There is no commercial model here and none should be invented.
- **The DNS change, the avatar upload, and the org profile fields** — all outside the
  repository and listed in the spec's §7 as the user's to do.
