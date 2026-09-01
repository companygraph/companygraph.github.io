// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
//
// The design assertions live in verify/design.mjs, which is a byte-identical copy in all
// three repositories. See the comment at the top of that file for what that does and does
// not guarantee.
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "./design.mjs";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
import { FAMILY } from "@robertblust/design/family";

const BASE = process.env.BASE || "http://localhost:8000";
// The public origin, in one place. It was hardcoded in `card`, in the sitemap's expected
// list, and in the seo fetch rewrite — and *derived* in the seo origin filter, by rewriting
// a literal "http://localhost:8000". Run with BASE=http://127.0.0.1:8000 and that derivation
// produced a filter nothing matched, so every URL in every graph was skipped and the check
// printed ✓ having fetched none of them.
const SITE = "https://companygraph.io";

// Every fetch whose body this suite never reads goes through here.
//
// Node 22's bundled undici asserts — `assert(!this.paused)` inside `Parser.finish` — when a
// socket ends while a response body is still unread. A status-only fetch leaks exactly that,
// and the assertion is thrown from a socket `end` handler, so no try/catch at the call site
// can reach it: the process dies with a stack trace into node internals and no mention of any
// check. It killed the run after `✓ /` in CI, which reads as "the landing page broke" and is
// nothing of the kind.
//
// It is a race against the single-threaded `python3 -m http.server` the suite is served from,
// and it is not rare: **6 of 12 local runs crashed on node 22.23.2, 0 of 12 with this helper.**
// CI is a coin flip per run. Node 25 never reproduces it, which is why it was invisible in
// development for as long as it has existed and only ever appeared on a merge to `main`.
//
// So: never call `fetch` for a status alone. Read the body or cancel it.
async function httpStatus(url) {
  const res = await fetch(url);
  await res.body?.cancel();
  return res.status;
}

const PAGES = [
  { path: "/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
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
  { path: "/privacy/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
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
  { path: "/billing/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
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
  { path: "/example/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
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
  { path: "/model/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /CompanyGraph/, lang: "en", sourceLang: "en",
    contains: ["The model", "drawn", "A dashed line", "How to read it", "Generated from"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../example/", "../billing/", "../privacy/", "../", "./"],
    sameOrigin: true,
    translates: { lang: "de", shows: ["Das Modell", "gezeichnet", "Wie man es liest", "MODELL"], hides: ["The model", "How to read it"],
                  title: "Modell — CompanyGraph" },
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"], fits: true,
    card: true, cardBase: SITE, internalLinks: true, graph: "model-data", divider: true },

  { path: "/talks/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
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
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true, fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
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
  // A page that says it makes no third-party request must make none. `links` and
  // `internalLinks` cannot see this: they inspect markup, and a font, an analytics tag or
  // an embed is a request. Copied from guestgraph.github.io, where the same claim is made.
  async sameOrigin(page, spec) {
    const seen = [];
    page.on("request", r => seen.push(r.url()));
    await page.reload({ waitUntil: "networkidle" });
    const origin = new URL(spec.absolute).origin;
    const foreign = [...new Set(seen.filter(u => /^https?:/.test(u) && !u.startsWith(origin)))];
    return foreign.length ? "off-origin request(s): " + foreign.join(", ") : null;
  },
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
  // The language declared before any JS runs. It used to be `de`, because the markup was
  // German and JS swapped it to English on load — which meant a crawler without JS read
  // German from a page whose og tags, share card and canonical content were all English.
  // The markup is English-first now, so this asserts the page tells the truth cold.
  //
  // `lang` is not this check. That one reads documentElement.lang *after* applyLang() has
  // run, so a page whose source said `de` would be corrected on load and pass anyway, while
  // a crawler that runs no JS still read German. Only this one is fetched cold, which is why
  // it belongs on every page and not just the decks.
  async sourceLang(page, spec) {
    const html = await (await fetch(spec.absolute)).text();
    const m = html.match(/<html lang="([a-z]+)"/);
    return m && m[1] === spec.sourceLang ? null : `static lang is ${m && m[1]}, expected ${spec.sourceLang}`;
  },
  async contains(page, spec) {
    const text = await page.evaluate(() => document.body.innerText);
    for (const s of spec.contains)
      if (!text.includes(s)) return `body text is missing ${JSON.stringify(s)}`;
    return null;
  },
  // Presence only. This used to assert `target="_blank" rel="noopener"` on every outbound link
  // as well; that half moved to noNewTab and inverted, because nothing outside a slide opens
  // in a new tab any more. What is left is the one thing no other check does: fail when an
  // absolute href is simply wrong.
  async links(page, spec) {
    const found = await page.evaluate(() =>
      [...document.querySelectorAll("a[href^='http']")].map(a => a.href));
    for (const want of spec.links)
      if (!found.includes(want)) return `missing outbound link ${want}`;
    return null;
  },
  // A deck opens in a new tab; navigation between prose pages does not. Neither rule is
  // visible to `links`, which only inspects absolute http hrefs — a relative one slips
  // straight past it, which is exactly how this regresses unnoticed.
  // Nothing opens in a new tab any more. The three sites are one ring — each links the other
  // two, and every deck carries its own way out — so a new tab is a workaround for a problem
  // that no longer exists, and it costs the visitor their back button.
  //
  // The exception is a link inside a slide, and this deck is the only place that has one. A
  // presenter who clicks the roadmap link mid-talk in the same tab loses the deck, and no
  // back-button muscle memory saves that in front of a room. The exception keys on *where* a
  // link sits, not where it points — which is why it is `.closest(".slide")` and not a list
  // of hrefs that would need maintaining.
  // The nav is one row across three sites, and it is written by hand on every page, so it
  // drifted: blust.ch put Principles after Talks on four pages and before it on the fifth,
  // and companygraph.io led with Talks while its siblings did not. Nothing caught it — the
  // items were all present, and `contains` does not see order.
  //
  // The family's order, left to right, is Ideas, Principles, Model, Example, Talks, Billing,
  // Privacy, then the language switcher. Read right to left it is the reverse, which is how
  // the rule was given: the switcher sits at the edge, and the further left an item is, the
  // more it is the site's own subject. A site skips what it does not have; no site may
  // reorder what it does have, and nothing outside the list may appear in the row.
  //
  // Privacy is on the list but lives in the footer on all three sites today. That is a
  // placement, not an exception: if it ever moves into the nav, this is where it goes.
  //
  // This function is a fourth copy, kept identical in all three suites the way the head
  // contract and the no-new-tab check are. A rule that is one row for a visitor is worth
  // asserting the same way everywhere.
  // One line runs through the middle of every word in the header — the wordmark, each nav
  // item, and both language segments. It did not before: nav is a flex row, its links
  // stretched to the row's height with their text at the top, and the language control sat
  // 5px lower than the words beside it.
  //
  // Measured on the text, not the boxes. A box can be centred while the text inside it is
  // not — that is exactly the bug this replaced, and a check comparing boxes would have
  // called it aligned.
  //
  // Two tolerances, because there are two fonts. The nav items and the language segments
  // are the same face at the same size, so they must agree to within half a pixel; that is
  // the pair the fix was about, and a loose bound there proved useless — with the link box
  // already symmetric, undoing `align-items:center` still landed inside 1px. The wordmark
  // is a different face, and where a line box falls inside its em box is the font's
  // business and the platform's, so it gets 1.5px and is judged against the row, not
  // against a single item of it.
  async headerBaseline(page) {
    return await page.evaluate(() => {
      const mid = el => {
        const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim());
        const r = document.createRange(); r.selectNodeContents(n || el);
        const b = r.getBoundingClientRect(); return (b.top + b.bottom) / 2;
      };
      const row = [];
      document.querySelectorAll("nav a").forEach(a => row.push([a.textContent.trim(), mid(a)]));
      for (const id of ["lde", "len"]) {
        const el = document.getElementById(id);
        if (el) row.push([el.textContent.trim(), mid(el)]);
      }
      if (row.length < 2) return "the nav row has fewer texts than a row";
      const vals = row.map(r => r[1]);
      const base = vals.reduce((a, b) => a + b, 0) / vals.length;
      const spread = Math.max(...vals) - Math.min(...vals);
      if (spread > 0.5)
        return `nav texts are ${spread.toFixed(2)}px apart: ` +
          row.map(([n, v]) => `${n} ${(v - base >= 0 ? "+" : "") + (v - base).toFixed(2)}`).join(", ");
      const mark = document.querySelector(".brand b");
      if (mark) {
        const d = mid(mark) - base;
        if (Math.abs(d) > 1.5) return `the wordmark sits ${d.toFixed(2)}px off the nav row`;
      }
      return null;
    });
  },
  // Three domains, three localStorages, one preference. A visitor reading German on one
  // site and following a link to a sibling used to arrive in English, because an origin
  // cannot see what another origin stored. The language travels in the link instead.
  //
  // Three things have to hold, and the middle one is the reason the implementation looks
  // the way it does. A family link can live inside a data-de attribute, and switching
  // language replaces that element whole, so an href decorated at load would be thrown
  // away by the first toggle; decorating on mousedown survives it, and keeps the param
  // out of the served markup — nothing crawlable or copyable carries it.
  //
  // Driven with mousedown rather than click on purpose: it is the event that fires before
  // the browser follows a link, so it can be dispatched without navigating away.
  async carriesLang(page, spec) {
    const problems = [];
    await page.goto(spec.absolute + "?lang=de", { waitUntil: "networkidle" });
    const arrived = await page.evaluate(() => ({
      lang: document.documentElement.lang, search: location.search,
    }));
    if (arrived.lang !== "de")
      problems.push(`arriving with ?lang=de left the page in ${arrived.lang}`);
    if (/lang=/.test(arrived.search))
      problems.push(`the param stayed in the address bar as ${JSON.stringify(arrived.search)}`);

    const probe = await page.evaluate((src) => {
      const pick = test => [...document.querySelectorAll("a[href]")].find(a => {
        try { return test(new URL(a.href, location.href)); } catch (e) { return false; }
      });
      const press = a => {
        const before = a.getAttribute("href");
        a.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        return { before, after: a.getAttribute("href") };
      };
      const FAMILY = new RegExp(src);
      const out = { away: null, home: null };
      const away = pick(u => u.origin !== location.origin && FAMILY.test(u.hostname));
      if (away) out.away = press(away);
      const home = pick(u => u.origin === location.origin);
      if (home) out.home = press(home);
      return out;
    }, FAMILY.source);
    // A page with no link to a sibling domain simply has nothing to carry.
    if (probe.away && !/[?&]lang=de(&|$)/.test(probe.away.after))
      problems.push(`a link to ${probe.away.before} did not pick the language up: ${probe.away.after}`);
    if (probe.home && probe.home.after !== probe.home.before)
      problems.push(`a same-origin link was rewritten to ${probe.home.after}; it shares this storage already`);

    // Leave the page as this check found it, for whatever runs next.
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    return problems.length ? problems.join("; ") : null;
  },
  // The row at phone widths. Every page in the three sites used to answer this its own way
  // — some wrapped the bar, some wrapped the nav, and the two whose `.bar` carried no
  // `flex-wrap` let the wordmark itself break, so "rb Robert Blust" arrived on two lines.
  //
  // Checked at 360px, which is narrower than the phones in the analytics and wide enough
  // that nothing here is a special case. The wordmark is measured against its own mark: if
  // the name has dropped below it the brand is twice the mark's height, and no tolerance is
  // needed to see it.
  //
  // The switcher is asserted visible on purpose. It would be easy to sweep it into the menu
  // with everything else, and for a bilingual audience that is the wrong trade — a language
  // control someone cannot find costs more than the tap it saves.
  async mobileNav(page, spec) {
    const problems = [];
    await page.setViewportSize({ width: 360, height: 640 });
    try {
      await page.goto(spec.absolute, { waitUntil: "networkidle" });
      const shut = await page.evaluate(() => {
        const q = s => document.querySelector(s);
        const seen = el => el && getComputedStyle(el).display !== "none";
        const brand = q(".brand").getBoundingClientRect().height;
        const mark = q(".brand svg").getBoundingClientRect().height;
        return {
          brand: Math.round(brand), mark: Math.round(mark),
          wide: document.documentElement.scrollWidth > window.innerWidth,
          links: seen(q("#navlinks")), burger: seen(q("#burger")), seg: seen(q("#langind")),
        };
      });
      if (shut.brand > shut.mark)
        problems.push(`the wordmark broke: the brand is ${shut.brand}px against a ${shut.mark}px mark`);
      if (shut.wide) problems.push("the page scrolls sideways");
      if (shut.links) problems.push("the links are still in the row at 360px");
      if (!shut.burger) problems.push("there is no menu button");
      if (!shut.seg) problems.push("the language control is not on the bar");

      // Only drive the button if it is there to be driven: clicking a hidden one waits the
      // full timeout and reports that instead of the thing actually wrong.
      if (shut.burger) {
      await page.click("#burger");
      const open = await page.evaluate(() => ({
        links: getComputedStyle(document.getElementById("navlinks")).display !== "none",
        flag: document.getElementById("burger").getAttribute("aria-expanded"),
      }));
      if (!open.links) problems.push("pressing the button did not open the menu");
      if (open.flag !== "true") problems.push(`the button reports aria-expanded=${open.flag} while open`);

      await page.keyboard.press("Escape");
      const closed = await page.evaluate(() =>
        getComputedStyle(document.getElementById("navlinks")).display === "none");
      if (!closed) problems.push("Escape did not close the menu");
      }
    } finally {
      // Every other check runs at the desktop size; leave the page as they expect it.
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(spec.absolute, { waitUntil: "networkidle" });
    }
    return problems.length ? problems.join("; ") : null;
  },
  // The privacy page says "that is everything that gets stored" and then lists the keys. It
  // was true until the divider started remembering its width, and nothing noticed — the claim
  // is prose and the keys are in a script, so the two could only be compared by hand.
  //
  // This drives the page instead of reading it: every write to localStorage is recorded, the
  // page is then made to do the things that write — switch language, move the divider — and
  // each key that turns up must be named on the privacy page. A key the page does not declare
  // is the failure; a key it declares and never writes is not, because a claim to store
  // something is not a claim anyone is harmed by.
  async storageKeys(page, spec) {
    const declared = await (await fetch(new URL("/privacy/", spec.absolute).href)).text();
    await page.addInitScript(() => {
      window.__keys = [];
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { window.__keys.push(k); return real.call(this, k, v); };
    });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    // The write paths this suite knows about, each present-or-skip: prose pages carry the
    // language control as #lde/#len, a deck carries the same control as #langDe/#langEn, and
    // the model page's divider is #gutter. A page matching none of these has nothing here to
    // exercise its storage — the zero-writes check below is what actually catches that, so
    // this list is free to be incomplete without the gap going silent again.
    if (await page.$("#lde")) { await page.click("#lde"); await page.click("#len"); }
    if (await page.$("#langDe")) { await page.click("#langDe"); await page.click("#langEn"); }
    if (await page.$("#gutter")) { await page.focus("#gutter"); await page.keyboard.press("ArrowLeft"); }
    const written = await page.evaluate(() => [...new Set(window.__keys)]);
    // Leave the page as the rest of the suite expects it, storage included.
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    // This is the other half of the check, and the one a page armed with storageKeys used to
    // have no way to fail: a page that writes nothing and a page whose trigger this check
    // failed to find are indistinguishable from the outside, and both used to return a clean
    // pass. Every page armed with storageKeys is here because it is known to write
    // rb-lang/cg-lang/gg-lang on its language control, so zero observed writes means the
    // control above was not found or not exercised — not that the page has nothing to declare.
    if (!written.length)
      return "no write path was exercised — none of #lde/#len, #langDe/#langEn or #gutter " +
             "produced a write on this page; add its control to the list above";
    const undeclared = written.filter((k) => !declared.includes(k));
    return undeclared.length
      ? `writes ${undeclared.join(", ")}, which /privacy/ does not name`
      : null;
  },
  async navOrder(page) {
    const ORDER = ["Ideas", "Principles", "Model", "Example", "Talks", "Billing", "Privacy"];
    return await page.evaluate(order => {
      const nav = document.querySelector("nav");
      if (!nav) return "there is no nav";
      const items = [...nav.querySelectorAll("a")].map(a => a.textContent.trim());
      const unknown = items.filter(i => !order.includes(i));
      if (unknown.length) return "not named by the order rule: " + unknown.join(", ");
      const want = order.filter(i => items.includes(i));
      if (items.join(" ") !== want.join(" "))
        return `order is ${items.join(" · ")}; the rule is ${want.join(" · ")}`;
      // The switcher is the right-hand edge of the row, so nothing may follow it.
      const kids = [...nav.children];
      const sw = kids.findIndex(el => el.id === "langind" || el.classList.contains("langind"));
      if (sw === -1) return "the language switcher is not in the nav";
      if (sw !== kids.length - 1) return "something sits to the right of the language switcher";
      return null;
    }, ORDER);
  },
  async noNewTab(page) {
    const bad = await page.evaluate(() => {
      const live = [...document.querySelectorAll('a[target="_blank"]')]
        .filter(a => !a.closest(".slide"))
        .map(a => a.getAttribute("href"));
      // The rendered DOM is only ever one language. German rides in `data-de` as markup that
      // does not exist until a visitor switches, so a link check that trusts the DOM inspects
      // half the site. That is not hypothetical: the privacy page's German credit kept
      // `target='_blank'` — in single quotes, because it is nested inside an attribute — and
      // survived both a source-wide strip and this check until the attributes were parsed.
      const translated = [...document.querySelectorAll("[data-de]")].flatMap(el => {
        if (el.closest(".slide")) return [];
        const t = document.createElement("template");
        t.innerHTML = el.getAttribute("data-de");
        return [...t.content.querySelectorAll('a[target="_blank"]')]
          .map(a => `${a.getAttribute("href")} [de]`);
      });
      return [...live, ...translated];
    });
    return bad.length ? "must stay in this tab: " + bad.join(", ") : null;
  },

  // The footer carries three destinations: the lockup to this site's landing page, "Robert
  // Blust" to blust.ch, and "Talks" to the index. wayOut covers only the last, and `links`
  // cannot see a relative href at all — so without this the brand could point at a page that
  // no longer exists and the deck would look healthy until somebody clicked it.
  async landing(page, spec) {
    const found = await page.evaluate(href =>
      [...document.querySelectorAll("#chrome a[href]")]
        .filter(a => a.getAttribute("href") === href)
        .map(a => ({
          named: !!(a.getAttribute("aria-label") || (a.textContent || "").trim()),
          isLockup: !!a.querySelector(".namemark svg"),
        })), spec.landing);
    if (!found.length) return `no link to the landing page (${spec.landing}) in the transport bar`;
    if (!found.some(l => l.isLockup)) return `the landing link is not the brand lockup`;
    const unnamed = found.filter(l => !l.named).length;
    return unnamed ? `${unnamed} landing link(s) without an accessible name` : null;
  },
  async sameTab(page, spec) {
    const bad = await page.evaluate(hrefs =>
      [...document.querySelectorAll("a[href]")]
        .filter(a => hrefs.includes(a.getAttribute("href")))
        .filter(a => a.target === "_blank")
        .map(a => a.getAttribute("href")), spec.sameTab);
    return bad.length ? "must stay in this tab: " + bad.join(", ") : null;
  },
  // `links` only sees a[href^='http'], so a root-absolute internal link — which breaks
  // under file:// — is invisible to it.
  // Decks open in the same tab now, which is only safe because the deck carries its own
  // way out. If that button ever disappears the same-tab links strand the reader on a
  // page with no exit — so the two rules are asserted together, deliberately.
  async wayOut(page, spec) {
    const found = await page.evaluate(href => {
      const links = [...document.querySelectorAll("a[href]")]
        .filter(a => a.getAttribute("href") === href);
      return links.map(a => ({
        inChrome: !!a.closest("#chrome"),
        named: !!(a.getAttribute("aria-label") || (a.textContent || "").trim()),
      }));
    }, spec.wayOut);
    if (!found.length) return `no link back to ${spec.wayOut} — a same-tab deck with no exit`;
    if (!found.some(l => l.inChrome)) return `the way back is not in the transport bar`;
    const unnamed = found.filter(l => !l.named).length;
    return unnamed ? `${unnamed} way-back link(s) without an accessible name` : null;
  },
  // Attributes are only half of the surface. A CSS url() is not an element attribute, so
  // querySelectorAll cannot see the @font-face rules — and those are where this mistake is
  // most likely to hide, because every font still loads perfectly from a served copy. A
  // reviewer made all four of them root-absolute and this check passed. So the stylesheets
  // are read for the same mistake, separately.
  async internalLinks(page) {
    const bad = await page.evaluate(() => {
      const out = [...document.querySelectorAll("[href], [src]")]
        .map(el => el.getAttribute("href") || el.getAttribute("src"))
        .filter(v => v && v.startsWith("/"));
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }  // unreadable: not ours
        const css = [...rules].map(r => r.cssText).join("\n");
        for (const m of css.matchAll(/url\(\s*["']?(\/[^"')]*)/g)) out.push(`url(${m[1]})`);
      }
      return out;
    });
    return bad.length ? "root-absolute internal path: " + bad.join(", ") : null;
  },
  // The head Google reads, asserted as a contract rather than page by page. Three of these
  // were live failures before the check existed: a logo.svg blust.ch has never served, an
  // isPartOf naming a #website node defined on another document, and this site's landing page
  // shipped with no head at all. All three had shipped green.
  //
  // The canonical is compared against the page's own URL, not merely against og:url. Agreeing
  // with og:url proves only that two tags say the same thing; both can say the same wrong
  // thing, and a canonical pointing at another page removes this one from the index and hands
  // its signals over — quietly, and worse than anything above.
  async seo(page, spec) {
    const problems = [];
    const want = SITE + spec.path;
    const m = await page.evaluate(() => {
      const meta = (sel) => (document.querySelector(sel) || {}).content || null;
      return {
        canonical: (document.querySelector('link[rel="canonical"]') || {}).getAttribute?.("href") ?? null,
        ogUrl: meta('meta[property="og:url"]'),
        ogTitle: meta('meta[property="og:title"]'),
        ogDesc: meta('meta[property="og:description"]'),
        ogType: meta('meta[property="og:type"]'),
        image: meta('meta[property="og:image"]'),
        desc: meta('meta[name="description"]'),
        site: meta('meta[property="og:site_name"]'),
        locale: meta('meta[property="og:locale"]'),
        alt: meta('meta[property="og:image:alt"]'),
        twitter: meta('meta[name="twitter:card"]'),
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
      };
    });

    if (!m.canonical) problems.push("no canonical");
    else if (m.canonical !== want) problems.push(`canonical ${JSON.stringify(m.canonical)} should be ${want}`);
    if (m.ogUrl !== m.canonical) problems.push(`og:url ${m.ogUrl} != canonical ${m.canonical}`);

    // Every page renders its own card. A page pointing at another's previews the wrong page
    // on every share, looks perfectly healthy, and is what `card` below cannot see: it only
    // asks whether the image resolves at its declared size, and a borrowed card does.
    if (!m.image) problems.push("no og:image");
    else if (m.image !== want + "og.png") problems.push(`og:image ${m.image} is not this page's own card (${want}og.png)`);

    if (!m.desc) problems.push("no meta description");
    else if (m.desc.length > 200) problems.push(`description is ${m.desc.length} chars, over 200`);

    for (const [k, v] of [["og:site_name", m.site], ["og:locale", m.locale],
                          ["og:image:alt", m.alt], ["twitter:card", m.twitter],
                          ["og:title", m.ogTitle], ["og:description", m.ogDesc],
                          ["og:type", m.ogType]])
      if (!v) problems.push(`no ${k}`);
    if (m.ogType && !["website", "article"].includes(m.ogType))
      problems.push(`og:type ${m.ogType} is neither website nor article`);

    // Structured data has to resolve, not merely parse. Google reads @graph within one
    // document, so an @id referenced but defined elsewhere is a pointer to nothing — and a
    // URL inside it is a promise the site either keeps or does not.
    if (!m.ld.length) problems.push("no application/ld+json");
    const defined = new Set(), referenced = [], urls = new Set();
    for (const block of m.ld) {
      let data;
      try { data = JSON.parse(block); }
      catch (e) { problems.push("ld+json does not parse: " + e.message); continue; }
      const nodes = data["@graph"] || (Array.isArray(data) ? data : [data]);
      const walk = (o) => {
        if (Array.isArray(o)) {
          for (const v of o)
            if (typeof v === "string" && /^https?:\/\//.test(v)) urls.add(v); else walk(v);
          return;
        }
        if (!o || typeof o !== "object") return;
        for (const [k, v] of Object.entries(o)) {
          // A bare { "@id": ... } is a pointer; the same key alongside an @type defines the
          // thing pointed at. Both are registered here as well as from the top-level @graph
          // members, so a node inlined under a property satisfies references to it instead of
          // being reported dangling.
          if (k === "@id" && typeof v === "string") {
            if (o["@type"]) defined.add(v);   // a node inlined under a property still defines one
            else referenced.push(v);          // a bare { "@id": … } is a pointer that must land
          }
          else if (typeof v === "string" && /^https?:\/\//.test(v) && k !== "@context") urls.add(v);
          else walk(v);
        }
      };
      nodes.forEach(n => { if (n && n["@id"]) defined.add(n["@id"]); });
      nodes.forEach(walk);
    }
    for (const r of referenced)
      if (!defined.has(r)) problems.push(`ld+json references ${r}, which no node on this page defines`);

    // Fetched from Node against BASE, not in-page against location.origin: an origin carries
    // no path, and a BASE can (the sibling sites are served under one). Nothing about these
    // URLs needs a browser.
    for (const u of urls) {
      if (!u.startsWith(SITE)) continue;              // off-site URLs are not ours to keep
      let status = 0;
      try { status = await httpStatus(u.replace(SITE, BASE)); } catch { status = 0; }
      if (status !== 200) problems.push(`ld+json names ${u} → HTTP ${status}`);
    }

    return problems.length ? problems.join("; ") : null;
  },

  async card(page, spec) {
    const img = await page.evaluate(() =>
      (document.querySelector('meta[property="og:image"]') || {}).content);
    if (!img) return "no og:image";
    const declared = await page.evaluate(() => [
      (document.querySelector('meta[property="og:image:width"]')  || {}).content,
      (document.querySelector('meta[property="og:image:height"]') || {}).content]);
    // Rewrite the card's absolute URL onto whatever is being tested — BASE, not
    // location.origin. An origin has no path, and this repository is served under one:
    // locally it is the root of http://localhost:8000, live it is companygraph.io/talks/.
    // Using the origin dropped the /talks prefix, so a card that was serving perfectly
    // reported "not fetchable" the first time the suite was pointed at production.
    const real = await page.evaluate(async ({ u, base, testBase }) => {
      const r = await fetch(base ? u.replace(base, testBase) : u.replace(/^https:\/\/[^/]+/, testBase));
      if (!r.ok) return null;
      const dv = new DataView(await r.arrayBuffer());
      return [String(dv.getUint32(16)), String(dv.getUint32(20))];   // PNG IHDR
    }, { u: img, base: spec.cardBase, testBase: BASE });
    if (!real) return `${img} is not fetchable`;
    if (real[0] !== declared[0] || real[1] !== declared[1])
      return `card is ${real.join("×")} but declared ${declared.join("×")}`;
    return null;
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
    // A page whose spec names its own control — the deck, whose transport carries a single
    // toggle that flips both ways — returns by pressing that same one again.
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
