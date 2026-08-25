// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
//
// The design assertions live in verify/design.mjs, which is a byte-identical copy in all
// three repositories. See the comment at the top of that file for what that does and does
// not guarantee.
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "./design.mjs";

const BASE = process.env.BASE || "http://localhost:8000";

const PAGES = [
  { path: "/", noNewTab: true, title: /CompanyGraph/, lang: "en",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
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
               "Watch intro talk", "12 minutes · German or English"],
    links: ["https://github.com/companygraph/meta-model",
            "https://github.com/companygraph",
            "https://github.com/companygraph/meta-model/blob/HEAD/LICENSE",
            "https://blust.ch/"],
    internalLinks: true,
    // The German half, named by what the reader must see and what must stop being
    // visible. Strings, not element counts: a translation that never got applied leaves
    // the English standing, and that is the failure worth naming.
    translates: { lang: "de",
                  shows: ["Jede Rolle", "aufgeschrieben", "Das Modell ansehen", "VORTRÄGE", "MODELL", "BEISPIEL", "Einführungsvortrag ansehen", "12 Minuten · Deutsch oder Englisch"],
                  hides: ["Every role", "Read the model"] },
    card: true, cardBase: "https://companygraph.io" },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none, and
  // `sameOrigin` is the only check that can see that.
  { path: "/privacy/", noNewTab: true, title: /CompanyGraph/, lang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../model/", "../example/", "../billing/", "../", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://companygraph.io", internalLinks: true },
  // The billing page. It states a commercial model, so the two claims that make it
  // trustworthy are asserted rather than trusted: that the tooling is free forever, and
  // that nothing here is running yet. Drop either and the page starts selling something.
  { path: "/billing/", noNewTab: true, title: /CompanyGraph/, lang: "en",
    // "FREE, FOREVER" upper case because `contains` reads rendered text and the card
    // headings are uppercased in CSS — the same trap the nav assertion fell into.
    contains: ["Not per seat", "FREE, FOREVER", "The tooling", "None of this is running today"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../model/", "../example/", "../privacy/", "../", "./"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://companygraph.io", internalLinks: true },
  // The example page. Its one promise is that nothing about the example was written by hand,
  // so the strings asserted here are the page's own prose, never a name from the model —
  // those are asserted by `graph`, which reads them out of the data block.
  { path: "/example/", noNewTab: true, title: /CompanyGraph/, lang: "en",
    contains: ["One company", "drawn", "A solid line means", "How to read it", "Where it comes from"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../model/", "../billing/", "../privacy/", "../", "./"],
    sameOrigin: true,
    translates: { lang: "de", shows: ["Eine Firma", "gezeichnet", "Wie man es liest", "BEISPIEL", "Seiten"], hides: ["One company", "How to read it"],
                  title: "Beispiel — CompanyGraph" },
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://companygraph.io", internalLinks: true, graph: "example-data" },
  // The model page. The same page in every respect the suite can see — one stage, one card,
  // one generated block — so its spec is the example's with its own prose and its own block
  // id. `graph` is what makes that possible: it reads the block the spec names, and every
  // name it asserts comes out of that block, so one check serves both pages without either
  // page's vocabulary appearing here.
  { path: "/model/", noNewTab: true, title: /CompanyGraph/, lang: "en",
    contains: ["The model", "drawn", "A dashed line", "How to read it", "Where it comes from"],
    links: ["https://github.com/companygraph"],
    sameTab: ["../talks/", "../example/", "../billing/", "../privacy/", "../", "./"],
    sameOrigin: true,
    translates: { lang: "de", shows: ["Das Modell", "gezeichnet", "Wie man es liest", "MODELL"], hides: ["The model", "How to read it"],
                  title: "Modell — CompanyGraph" },
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://companygraph.io", internalLinks: true, graph: "model-data" },

  { path: "/talks/", noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
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
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    translates: { lang: "de", shows: ["Vortrag", "Vorträge", "MODELL", "BEISPIEL"], hides: ["Watch the talk"],
                  dlHref: { de: "intro/companygraph-de.pdf", en: "intro/companygraph-en.pdf" },
                  title: "Vorträge · CompanyGraph",
                  desc: "Vorträge über CompanyGraph, das quelloffene Meta-Modell für den Betrieb eines Unternehmens." },
    card: true, cardBase: "https://companygraph.io", internalLinks: true },
  { path: "/talks/intro/", noNewTab: true, footerVersion: true, title: /CompanyGraph/, lang: "en", sourceLang: "en", wayOut: "../",
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
    // The deck's German is the whole second half of the talk, including every speaker note.
    // `shows` names a string from the title slide's data-de, `hides` its English counterpart.
    // `hides` named "a talk by" until the byline became `Robert Blust · Software Engineer
    // & Architect`, matching every other deck. That string is gone from the slide now, so
    // the assertion would have passed while checking nothing. "Architect"/"Architekt" is
    // the replacement: one letter apart, present in exactly one language each.
    translates: { lang: "de", shows: ["Unternehmen", "Architekt"], hides: ["Architect"], id: "langtoggle" },
    card: true, cardBase: "https://companygraph.io", internalLinks: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
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
  // The card is fetched back to compare its real pixel size with the declared tags.
  // `cardBase` is the production prefix to strip: this repository is served under
  // /talks/ on the domain but at / locally, so stripping the origin alone would ask
  // for a path that does not exist here — which looked like a broken card and was not.
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

    // The talks index's single toggle is #langind; a deck's transport bar carries its
    // own control under its own id, so the spec names it rather than this check
    // branching on which page it is.
    const toggle = "#" + (spec.translates.id || "langind");
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

    await page.click(toggle);
    const back = await htmlLang();
    if (back !== "en") return `toggling back left lang=${back}, expected en`;
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
  // The click-through. Every name and count here is read out of the page's own data block,
  // so the check restates nothing about either page: it asserts that what the block says is
  // what the neighbourhood draws, at each step of moving the focus. `spec.graph` is the id of
  // the block to read — the example page's instance or the model page's vocabulary — which is
  // the only difference between the two pages this check can see.
  async graph(page, spec) {
    const data = await page.evaluate((id) => JSON.parse(document.getElementById(id).textContent), spec.graph);
    if (!data.entities) return "the data block is empty — run: npm run example";
    // The source link and its short commit are rewritten by the script from the block's own
    // commit, so a stale generator that leaves the markup's placeholder in place would pass
    // every other check here while pointing at the wrong tree.
    // Which folder of the model repository the block came from is the page's to say, not
    // this check's: `stage.js` reads it off #srclink's data-src, so the assertion reads it
    // from the same place rather than carrying a second copy that could disagree.
    const srcSub = await page.evaluate(() => document.getElementById("srclink").getAttribute("data-src"));
    const srcHref = await page.evaluate(() => document.getElementById("srclink").getAttribute("href"));
    const wantHref = `/tree/${data.commit}/${srcSub}`;
    if (!srcHref.endsWith(wantHref)) return `source link is ${JSON.stringify(srcHref)}, expected it to end with ${JSON.stringify(wantHref)}`;
    const srcCommit = await page.evaluate(() => document.getElementById("srccommit").textContent);
    if (srcCommit !== data.commit.slice(0, 7)) return `source commit reads ${JSON.stringify(srcCommit)}, expected ${JSON.stringify(data.commit.slice(0, 7))}`;
    const nodes = () => page.evaluate(() => Array.from(document.querySelectorAll("#fig .n")).map(n => ({ id: n.dataset.id, focus: n.classList.contains("focus") })));
    const click = (id) => page.evaluate((id) => {
      const n = document.querySelector(`#fig .n[data-id="${id}"]`);
      if (n) n.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return !!n;
    }, id);
    const roots = data.types.filter(t => !t.owner).map(t => t.folder);
    let ns = await nodes();
    if (!ns.find(n => n.id === "root" && n.focus)) return "initially the root is not the focus";
    if (ns.length !== roots.length + 1) return `initially ${ns.length} nodes, expected root + ${roots.length} folders`;
    const edge = data.edges[0]; if (!edge) return null;
    const from = data.entities.find(e => e.id === edge.from);
    const folder = from.id.slice(0, from.id.lastIndexOf("/"));
    // Walk down to that folder one click at a time. The canvas is a neighbourhood, not a
    // tree, so a folder four levels down is not on it until its parent is the focus — and
    // every prefix of an id IS a node here, because an id is the thing's path on disk.
    const parts = folder.split("/");
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join("/");
      if (!(await click(prefix))) return `${prefix} is not on the canvas at this point in the walk`;
      await page.waitForTimeout(500);
    }
    ns = await nodes();
    if (!ns.find(n => n.id === folder && n.focus)) return `clicking ${folder} did not focus it`;
    if (!ns.find(n => n.id === "root")) return `focused ${folder}, but its ancestor root is gone`;
    if (!ns.find(n => n.id === from.id)) return `focused ${folder}, but its child ${from.id} is not drawn`;
    await click(from.id); await page.waitForTimeout(500);
    const name = await page.evaluate(() => (document.querySelector("#card h3") || {}).textContent);
    if (name !== from.name) return `card shows ${JSON.stringify(name)}, expected ${JSON.stringify(from.name)}`;
    // The stage, expanded: Expand moves the whole stage — path, canvas and card — into
    // dialog#stagemodal, closed by its ×, Escape or a backdrop click. It is the same stage
    // moved, not a copy, so this checks the dialog actually contains #fig and #card (rather
    // than a second rendering of them) and that the canvas really grew, then that the move
    // back on close lands #fig inside .figure-section again — nothing here is a literal from
    // the example, every name comes from the block or from the DOM itself.
    if (!(await page.evaluate(() => !!document.getElementById("expand")))) return "#expand is missing";
    const widthBefore = await page.evaluate(() => document.getElementById("fig").getBoundingClientRect().width);
    await page.click("#expand");
    await page.waitForTimeout(300);
    const modalOpen = await page.evaluate(() => !!document.querySelector("dialog#stagemodal[open]"));
    if (!modalOpen) return "clicking #expand did not open dialog#stagemodal";
    const holds = await page.evaluate(() => {
      const dialog = document.getElementById("stagemodal");
      return dialog.contains(document.getElementById("fig")) && dialog.contains(document.getElementById("card"));
    });
    if (!holds) return "dialog#stagemodal does not contain #fig and #card — Expand should move the stage, not copy it";
    const widthAfter = await page.evaluate(() => document.getElementById("fig").getBoundingClientRect().width);
    if (!(widthAfter > widthBefore)) return `#fig width in the dialog is ${widthAfter}, expected more than ${widthBefore} before Expand`;
    const stillFocused = await page.evaluate((id) => {
      const n = document.querySelector(`#fig .n[data-id="${id}"]`);
      return !!n && n.classList.contains("focus");
    }, from.id);
    if (!stillFocused) return `${from.id} is no longer the focus after Expand`;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) return "Escape did not close dialog#stagemodal";
    const backInPlace = await page.evaluate(() => document.querySelector(".figure-section").contains(document.getElementById("fig")));
    if (!backInPlace) return "closing the dialog did not move #fig back inside .figure-section";
    const drawn = await page.evaluate((id) => Array.from(document.querySelectorAll(`#fig .ref[data-from="${id}"]`)).map(p => p.dataset.to), from.id);
    for (const x of data.edges.filter(x => x.from === from.id)) if (!drawn.includes(x.to)) return `reference ${from.id} → ${x.to} is in the block but not drawn`;
    ns = await nodes();
    for (const x of data.edges.filter(x => x.from === from.id)) if (!ns.find(n => n.id === x.to)) return `reference target ${x.to} is not on the canvas`;
    const hash = await page.evaluate(() => decodeURIComponent(location.hash.slice(1)));
    if (hash !== from.id) return `hash is ${JSON.stringify(hash)}, expected ${from.id}`;
    return null;
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
