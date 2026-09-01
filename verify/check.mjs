// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "@robertblust/design/verify/design";
import { httpStatus } from "@robertblust/design/verify/http";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
import { pageChecks } from "@robertblust/design/verify/pages";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE || "http://localhost:8000";
// The public origin, in one place. It was hardcoded in `card`, in the sitemap's expected
// list, and in the seo fetch rewrite — and *derived* in the seo origin filter, by rewriting
// a literal "http://localhost:8000". Run with BASE=http://127.0.0.1:8000 and that derivation
// produced a filter nothing matched, so every URL in every graph was skipped and the check
// printed ✓ having fetched none of them.
const SITE = "https://companygraph.io";

// What every prose footer reads, left to right. The check compares this to the rendered DOM,
// so it is the one place that decides the order — and the German labels never appear here
// because the suite loads each page in its source language.
const FOOTER = ["Robert Blust", "GitHub", "Licence", "Privacy"];

const PAGES = [
  { path: "/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"], fits: true,
    // "TALKS" is the nav's first and only link. Asserted here rather than in `links`,
    // which requires target=_blank — wrong for chrome pointing at another page on this
    // same domain, which should stay in the tab the reader is already in.
    //
    // Upper case because `contains` reads `body.innerText`, which is the RENDERED text:
    // the nav sets `text-transform:uppercase`, so the markup's "Talks" arrives here as
    // "TALKS". Asserting the markup's casing fails against a page that is perfectly
    // correct — which is exactly what happened when this line was first written.
    contains: ["Every role, every rule", "Written down once", "CompanyGraph", "TALKS", "MODEL", "EXAMPLE", "BILLING",
               // The talk's call to action and the one fact this page is allowed to
               // restate: its length. A call to action needs it in the moment, not one
               // click away. The deck is in this repository now — `talks/intro/` — so the
               // number and the thing it describes finally move in the same commit. It is
               // still not derived from the deck's own timings, so re-cut the talk and this
               // string has to be changed by hand; what changed is that nothing crosses a
               // repository boundary to do it.
               "Watch intro talk", "12 minutes · German or English",
               // The sentence exists because a reader who arrives from the word
               // "graph" guesses the wrong thing. Pin its claim: this is a
               // vocabulary. Only the words that carry the claim, so rewording the
               // rest of the sentence does not fail the check.
               "Nothing here matches or merges records", "vocabulary"],
    links: ["https://github.com/companygraph/meta-model",
            "https://github.com/companygraph",
            "https://github.com/companygraph/meta-model/blob/HEAD/LICENSE",
            "https://blust.ch/"],
    // `noNewTab` already asserts nothing outside a slide opens a new tab, which covers this
    // page whole; what `sameTab` adds is the name. The nav gained one item and the check
    // that would have caught it opening elsewhere never mentioned it, so it is named here.
    sameTab: ["model/"],
    internalLinks: true,
    // The German half, named by what the reader must see and what must stop being
    // visible. Strings, not element counts: a translation that never got applied leaves
    // the English standing, and that is the failure worth naming.
    translates: { lang: "de",
      // The head, not just the body: this page carried an id="metadesc" that nothing acted
      // on, so a German visitor read an English title and description under lang="de".
      // Declared here so the swap cannot quietly go away again.
      title: "CompanyGraph — ein Meta-Modell für den Betrieb eines Unternehmens",
      desc: "Ein Meta-Modell für den Betrieb eines Unternehmens — die Struktur, die sein Wissen annimmt, damit Menschen und Agenten sich darauf verlassen können.",
                  shows: ["Jede Rolle", "aufgeschrieben", "Den Quelltext lesen", "VORTRÄGE", "MODELL", "BEISPIEL", "Einführungsvortrag ansehen", "12 Minuten · Deutsch oder Englisch"],
                  hides: ["Every role", "Read the source"] },
    card: true, cardBase: SITE },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none, and
  // `sameOrigin` is the only check that can see that.
  { path: "/privacy/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../model/", "../example/", "../billing/", "../", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"], fits: true,
    card: true, cardBase: SITE, internalLinks: true },
  // The billing page. It states a commercial model, so the two claims that make it
  // trustworthy are asserted rather than trusted: that the tooling is free forever, and
  // that nothing here is running yet. Drop either and the page starts selling something.
  { path: "/billing/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
    // "FREE, FOREVER" upper case because `contains` reads rendered text and the card
    // headings are uppercased in CSS — the same trap the nav assertion fell into.
    contains: ["Not per seat", "FREE, FOREVER", "The tooling", "None of this is running today"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../model/", "../example/", "../privacy/", "../", "./"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"], fits: true,
    card: true, cardBase: SITE, internalLinks: true },
  // The example page. Its one promise is that nothing about the example was written by hand,
  // so the strings asserted here are the page's own prose, never a name from the model —
  // those are asserted by `graph`, which reads them out of the data block.
  { path: "/example/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
    contains: ["One company", "drawn", "A solid line means", "How to read it", "Generated from"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../model/", "../billing/", "../privacy/", "../", "./"],
    sameOrigin: true,
    translates: { lang: "de", shows: ["Eine Firma", "gezeichnet", "Wie man es liest", "BEISPIEL", "Seiten"], hides: ["One company", "How to read it"],
                  title: "Beispiel — CompanyGraph" },
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"], fits: true,
    card: true, cardBase: SITE, internalLinks: true, graph: "example-data", divider: true },
  // The model page. The same page in every respect the suite can see — one stage, one card,
  // one generated block — so its spec is the example's with its own prose and its own block
  // id. `graph` is what makes that possible: it reads the block the spec names, and every
  // name it asserts comes out of that block, so one check serves both pages without either
  // page's vocabulary appearing here.
  { path: "/model/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
    contains: ["The model", "drawn", "A dashed line", "How to read it", "Generated from"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../example/", "../billing/", "../privacy/", "../", "./"],
    sameOrigin: true,
    translates: { lang: "de", shows: ["Das Modell", "gezeichnet", "Wie man es liest", "MODELL"], hides: ["The model", "How to read it"],
                  title: "Modell — CompanyGraph" },
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"], fits: true,
    card: true, cardBase: SITE, internalLinks: true, graph: "model-data", divider: true },

  { path: "/talks/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["CompanyGraph", "meta-model"],
    links: ["https://github.com/companygraph"],
    // "../" is the wordmark, which is the only way back to the model
    // from here now that the nav carries Talks alone. It is shared chrome, so it stays in
    // the tab like the rest. verify can assert the link is here; it can never assert the
    // page on the other side still carries an item back. See CLAUDE.md.
    // "intro/companygraph-en.pdf" is the English deck the download link points at. The
    // German one is reached by data-de-href, which no check here can see: `sameTab` reads
    // the href as delivered, and the swap happens only after a click on the toggle. What
    // this line catches is the path being wrong for everyone; the German half is checked
    // by `translates.dlHref` below.
    sameTab: ["intro/", "./", "../", "../model/", "../example/", "../privacy/", "../billing/", "intro/companygraph-en.pdf"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"], fits: true,
    translates: { lang: "de", shows: ["Vortrag", "Vorträge", "MODELL", "BEISPIEL"], hides: ["Watch the talk"],
                  dlHref: { de: "intro/companygraph-de.pdf", en: "intro/companygraph-en.pdf" },
                  title: "Vorträge · CompanyGraph",
                  desc: "Vorträge über CompanyGraph, das quelloffene Meta-Modell für den Betrieb eines Unternehmens." },
    card: true, cardBase: SITE, internalLinks: true },
  { path: "/talks/intro/", storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    // The deck's outbound links: closing slide points to companygraph.io, slide 10 points
    // to the roadmap. Asserted the same way the index asserts its own: `links` is the only
    // check that fails when an href is simply wrong, so without this line a typo in the
    // deck's call to action would ship silently. Links open in a new tab because a deck a
    // presenter navigates away from is gone.
    landing: "../../",
    links: ["https://blust.ch/",
            "https://companygraph.io/",
            "https://github.com/companygraph/meta-model#roadmap"],
    slides: 12,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true,
    // fences is presence-only and order-blind — deck runtime landing last here while
    // fenceOrder places it third, two lines down, is not the pair disagreeing.
    fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "deck runtime", "language", "deck fit"],
    lockupCollapses: true,
    // The deck's German is the whole second half of the talk, including every speaker note.
    // `shows` names a string from the title slide's data-de, `hides` its English counterpart.
    // `hides` named "a talk by" until the byline became `Robert Blust · Software Engineer
    // & Architect`, matching every other deck. That string is gone from the slide now, so
    // the assertion would have passed while checking nothing. "Architect"/"Architekt" is
    // the replacement: one letter apart, present in exactly one language each.
    translates: { lang: "de", shows: ["Unternehmen", "Architekt"], hides: ["Architect"], id: "langDe", backId: "langEn" },
    card: true, cardBase: SITE, internalLinks: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
  ...STAGE_CHECKS,
  ...pageChecks({ SITE, BASE }),
  // Overrides the package's opensFromFile. That check derives its file:// root from its own
  // import.meta.url, which was correct while design.mjs lived in this site's own verify/
  // folder — one level up from the file was the site root. It is wrong now that the check
  // runs from inside @robertblust/design's copy in node_modules: SITE_ROOT there resolves to
  // the package's own directory, and the deck 404s at file://…/node_modules/@robertblust
  // /design/talks/…/index.html. check.mjs itself still lives in <site>/verify/, so the same
  // one-level-up computation, taken from here instead, gives the right root again. This is a
  // site's decision to diverge from a package default, the same shape as the escape hatches
  // documented for a fence or a design.config.json group — not a convenience, a documented
  // workaround for a defect in @robertblust/design v0.9.0 that a future release should fix.
  async opensFromFile(page, spec) {
    const SITE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    const file = "file://" + path.join(SITE_ROOT, spec.path.replace(/^\/|\/$/g, ""), "index.html");
    const errors = [];
    const probe = await page.context().browser().newPage();
    probe.on("pageerror", (e) => errors.push(e.message));
    try {
      await probe.goto(file);
      await probe.evaluate(() => document.fonts.ready);
      const seen = await probe.evaluate(() => ({
        slides: document.querySelectorAll(".slide").length,
        faceLoaded: [...document.fonts].some((f) => f.status === "loaded"),
        scaled: getComputedStyle(document.querySelector(".deck") || document.body).transform,
      }));
      if (errors.length) return `opened from file:// with JS errors: ${errors.join(" | ")}`;
      if (!seen.slides) return "opened from file:// but rendered no slides";
      if (!seen.faceLoaded) return "opened from file:// but loaded no webfont — check the relative fonts/ path";
      if (seen.scaled === "none")
        return "opened from file:// but the canvas carries no transform — fit() did not run";
      return null;
    } finally {
      await probe.close();
    }
  },
  // The deck's length in slides. The arc is twelve slides and the numbering is zero-based
  // everywhere a viewer sees it, so a slide added without its neighbours renumbered — or
  // one dropped by an unclosed attribute swallowing the next <section> — shows up here
  // before it shows up as an audio file that does not exist. The audio filename is derived
  // from the kicker's data-n, so a duplicate number does not just misnumber a slide — it
  // silently plays the wrong clip, with no error anywhere in that path. Checking the count
  // alone cannot catch a duplicate (two slides sharing one number still sum to the right
  // total, with a number missing elsewhere to balance it), so this also asserts the kicker
  // numbers are exactly the zero-padded sequence 00..spec.slides-1, in order.
  async slides(page, spec) {
    const ns = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section.slide .kicker")).map(k => k.dataset.n));
    if (ns.length !== spec.slides) return `${ns.length} slides, expected ${spec.slides}`;
    const want = Array.from({ length: spec.slides }, (_, i) => String(i).padStart(2, "0"));
    const off = want.filter((n, i) => ns[i] !== n);
    return off.length ? `kicker numbers ${JSON.stringify(ns)} are not ${JSON.stringify(want)}` : null;
  },
  // Run before `graph`: that check walks the figure to an entity and leaves it focused
  // there, and the root/folder card's "N pages" line — where `shows: ["Seiten"]` lives for
  // the example page — only renders while a root or a folder is focused. Toggling the
  // language first, on the page exactly as it loaded, is what keeps this check honest about
  // what a visitor sees before they have clicked anything.
  async translates(page, spec) {
    const body = () => page.evaluate(() => document.body.innerText);
    const htmlLang = () => page.evaluate(() => document.documentElement.lang);
    const desc = () => page.evaluate(() => (document.getElementById("metadesc") || {}).content);
    const english = await body();
    const englishTitle = await page.title();
    const englishDesc = await desc();

    // Press the DE segment — the control that means "switch to German", which is what
    // this check is asserting. It used to click #langind, and #langind used to be the
    // button itself; it is now the box holding both segments, so that click landed on
    // the container and did nothing. Two pages still passed, because the box's centre
    // falls on the seam between DE and EN and the click sometimes caught a button. A
    // check that passes by a rounding accident is worse than one that fails.
    //
    // A deck's transport carries its own control under its own id, so the spec names it
    // rather than this check branching on which page it is.
    const toggle = "#" + (spec.translates.id || "lde");
    // Going back is a different control now, not the same one pressed twice: a segmented
    // control has one button per language, and pressing DE while already in German is
    // correctly a no-op. `back` is what returns the page to English.
    // The deck used to be the exception here: its transport carried a single toggle that
    // flipped both ways, so pressing the same control again was how it went back. That
    // toggle is gone. The deck's spec now names `backId: "langEn"`, a segmented DE/EN
    // control like every other page, so it needs no exception left in this comment.
    const back = "#" + (spec.translates.backId || spec.translates.id || "len");
    await page.click(toggle);
    const swapped = await htmlLang();
    if (swapped !== spec.translates.lang)
      return `after the toggle lang=${swapped}, expected ${spec.translates.lang}`;
    const german = await body();
    for (const s of spec.translates.shows)
      if (!german.includes(s)) return `German page is missing ${JSON.stringify(s)}`;
    for (const s of spec.translates.hides)
      if (german.includes(s)) return `German page still shows the English ${JSON.stringify(s)}`;
    // The <title> and the meta description are the page's word to a crawler or a tab
    // strip — nothing in `shows`/`hides` reaches either, since both assert body text.
    // A visitor who picks German with an English title/description would sail past both.
    if (spec.translates.title) {
      const germanTitle = await page.title();
      if (germanTitle !== spec.translates.title)
        return `after the toggle title is ${JSON.stringify(germanTitle)}, expected ${JSON.stringify(spec.translates.title)}`;
    }
    // The PDF exists in both languages, and the link swaps with the toggle. A German
    // reader handed the English deck is a silent wrong answer: the page still looks
    // right, the download still works, and only the file is in the wrong language.
    if (spec.translates.dlHref) {
      const href = () => page.evaluate(() =>
        (document.querySelector("[data-de-href]") || {}).getAttribute?.("href"));
      const germanHref = await href();
      if (germanHref !== spec.translates.dlHref.de)
        return `after the toggle the download points at ${JSON.stringify(germanHref)}, expected ${JSON.stringify(spec.translates.dlHref.de)}`;
    }
    if (spec.translates.desc) {
      const germanDesc = await desc();
      if (germanDesc !== spec.translates.desc)
        return `after the toggle meta description is ${JSON.stringify(germanDesc)}, expected ${JSON.stringify(spec.translates.desc)}`;
    }

    await page.click(back);
    const returned = await htmlLang();
    if (returned !== "en") return `toggling back left lang=${returned}, expected en`;
    if (await body() !== english) return "toggling back did not restore the English text";
    if (await page.title() !== englishTitle) return "toggling back did not restore the English title";
    if (await desc() !== englishDesc) return "toggling back did not restore the English meta description";
    if (spec.translates.dlHref) {
      const backHref = await page.evaluate(() =>
        (document.querySelector("[data-de-href]") || {}).getAttribute?.("href"));
      if (backHref !== spec.translates.dlHref.en)
        return `toggling back left the download at ${JSON.stringify(backHref)}, expected ${JSON.stringify(spec.translates.dlHref.en)}`;
    }
    return null;
  },
  // A page must not scroll sideways on a phone. `.bar` wraps the nav below the lockup, but
  // the nav itself was a non-wrapping flex row, so a fourth item pushed the row past the
  // viewport and took the whole document with it — every page with a header, worse in
  // German, and invisible to every other check in this file: the markup is correct, the
  // links work, nothing fails to load, and the page is simply 90px too wide.
  //
  // 390px is the narrowest phone this site is drawn for. Both languages are measured,
  // because German is the wider half and the half that broke first — asserting English
  // alone would have passed over the worse of the two. Runs last, and puts the viewport
  // back, so no earlier check ever sees a resized page.
  async fits(page, spec) {
    const before = page.viewportSize();
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const toggle = "#" + ((spec.translates && spec.translates.id) || "lde");
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(250);
      const en = await overflow();
      if (en > 0) return `at 390px the document is ${en}px wider than the viewport in English`;
      if (!(await page.evaluate(sel => !!document.querySelector(sel), toggle))) return null;
      await page.click(toggle);
      await page.waitForTimeout(250);
      const de = await overflow();
      await page.click(toggle);
      await page.waitForTimeout(250);
      if (de > 0) return `at 390px the document is ${de}px wider than the viewport in German`;
      return null;
    } finally {
      if (before) { await page.setViewportSize(before); await page.waitForTimeout(250); }
    }
  },
};

const browser = await chromium.launch();
let failures = 0;

// Two things the page loop cannot say about itself.
//
// Every page must opt into `seo`. The runner skips any check whose key is undefined, so
// deleting one line from PAGES turns the contract off for that page and changes no output.
{
  const off = PAGES.filter(p => !p.seo).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  seo is not enabled on: " + off.join(", ")); failures++; }
}
// And every page must opt into tokenVersion, for the same reason. The deleted page-against-page
// block below asserted every page in PAGES unconditionally; tokenVersion alone does not, because
// the runner skips any check whose key is undefined — a page added to PAGES with neither a
// `design tokens` fence nor `tokenVersion: true` is invisible to design:check (discovery only
// finds fences that exist) and to this suite alike. This line is what restores that half of it.
{
  const off = PAGES.filter(p => !p.tokenVersion).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  tokenVersion is not enabled on: " + off.join(", ")); failures++; }
}
// And every page must opt into `fences`, for the same reason. Task 2 added the check that
// fails a page whose fences no longer include `prose reset` — but not this line, so deleting
// `fences: [...]` from a page's spec (or adding a page to PAGES without it) turns that check
// off for that page and design:check only finds fences that exist, so the whole suite stays
// green while the page silently loses every fence it should have been checked against.
{
  const off = PAGES.filter(p => !p.fences).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  fences is not enabled on: " + off.join(", ")); failures++; }
}

// The token block used to be compared page-against-page here, because there was no
// recorded source to compare it against and a hash would have been a second thing to
// keep in step. `design:check` is that source now: it asserts every page's fence
// byte-for-byte against what @robertblust/design ships, which is strictly stronger than
// pages merely agreeing with each other, and it reads the `page`/`deck` variant word off
// each page rather than expecting every page to share one block. Keeping this check
// alongside it would mean teaching a weaker check about every variant the stronger one
// already handles for free — so it is deleted, not adjusted.

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
// The crawl map is not a page, so it is checked separately, and this suite never checked
// it at all. Two promises live here: every URL a sitemap claims must resolve, and every
// sitemap robots.txt names must exist. guestgraph.io named three and two were 404 in
// production for months; the same block is now in all three suites so it cannot happen
// quietly here either.
{
  const res = await fetch(BASE + "/sitemap.xml");
  if (!res.ok) { console.log(`✗ /sitemap.xml  HTTP ${res.status}`); failures++; }
  else {
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const expected = PAGES.map(p => SITE + p.path);
    const missing = expected.filter(u => !locs.includes(u));
    const extra = locs.filter(u => !expected.includes(u));
    if (missing.length || extra.length) {
      console.log(`✗ /sitemap.xml  missing: ${missing} unexpected: ${extra}`); failures++;
    } else {
      let unreachable = 0;
      for (const u of locs) {
        const s = await httpStatus(u.replace(SITE, BASE));
        if (s !== 200) { console.log(`✗ sitemap URL ${u} → ${s}`); failures++; unreachable++; }
      }
      if (!unreachable) console.log("✓ /sitemap.xml  " + locs.length + " urls, all reachable");
    }
  }

  const rb = await fetch(BASE + "/robots.txt");
  if (!rb.ok) { console.log(`✗ /robots.txt  HTTP ${rb.status}`); failures++; }
  else {
    const named = [...(await rb.text()).matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map(m => m[1]);
    if (!named.length) { console.log("✗ /robots.txt  names no sitemap"); failures++; }
    else {
      const dead = [];
      for (const u of named) {
        const s = await httpStatus(u.replace(SITE, BASE));
        if (s !== 200) dead.push(`${u} → ${s}`);
      }
      if (dead.length) { console.log("✗ /robots.txt  names sitemap(s) that do not exist: " + dead.join(", ")); failures++; }
      else console.log(`✓ /robots.txt  ${named.length} sitemap(s), all reachable`);
    }
  }
}

console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
