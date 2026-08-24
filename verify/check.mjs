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
  { path: "/", title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["CompanyGraph", "meta-model"],
    links: ["https://github.com/companygraph"],
    // "https://companygraph.io/" is the wordmark, which is the only way back to the model
    // from here now that the nav carries Talks alone. It is shared chrome, so it stays in
    // the tab like the rest. verify can assert the link is here; it can never assert the
    // page on the other side still carries an item back. See CLAUDE.md.
    // "intro/companygraph-en.pdf" is the English deck the download link points at. The
    // German one is reached by data-de-href, which no check here can see: `sameTab` reads
    // the href as delivered, and the swap happens only after a click on the toggle. What
    // this line catches is the path being wrong for everyone; the German half is checked
    // by `translates.dlHref` below.
    sameTab: ["intro/", "./", "https://companygraph.io/", "intro/companygraph-en.pdf"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    translates: { lang: "de", shows: ["Vortrag", "Vorträge"], hides: ["Watch the talk"],
                  dlHref: { de: "intro/companygraph-de.pdf", en: "intro/companygraph-en.pdf" },
                  title: "Vorträge · CompanyGraph",
                  desc: "Vorträge über CompanyGraph, das quelloffene Meta-Modell für den Betrieb eines Unternehmens." },
    card: true, cardBase: "https://companygraph.io/talks", internalLinks: true },
  { path: "/intro/", title: /CompanyGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    // The deck's one outbound link, on the closing slide. Asserted the same way the index
    // asserts its own: `links` is the only check that fails when an href is simply wrong,
    // so without this line a typo in the deck's single call to action would ship silently.
    // It opens in a new tab because a deck a presenter navigates away from is gone.
    links: ["https://companygraph.io/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    // The deck's German is the whole second half of the talk, including every speaker note.
    // `shows` names a string from the title slide's data-de, `hides` its English counterpart.
    // `hides` named "a talk by" until the byline became `Robert Blust · Software Engineer
    // & Architect`, matching every other deck. That string is gone from the slide now, so
    // the assertion would have passed while checking nothing. "Architect"/"Architekt" is
    // the replacement: one letter apart, present in exactly one language each.
    translates: { lang: "de", shows: ["Unternehmen", "Architekt"], hides: ["Architect"], id: "langtoggle" },
    card: true, cardBase: "https://companygraph.io/talks", internalLinks: true },
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
  // A deck opens in a new tab; navigation between prose pages does not. Neither rule is
  // visible to `links`, which only inspects absolute http hrefs — a relative one slips
  // straight past it, which is exactly how this regresses unnoticed.
  async newTab(page, spec) {
    const bad = await page.evaluate(hrefs =>
      [...document.querySelectorAll("a[href]")]
        .filter(a => hrefs.includes(a.getAttribute("href")))
        .filter(a => a.target !== "_blank" || !a.rel.includes("noopener"))
        .map(a => a.getAttribute("href")), spec.newTab);
    return bad.length ? "must open in a new tab with rel=noopener: " + bad.join(", ") : null;
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
  async internalLinks(page) {
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => a.getAttribute("href"))
        .filter(h => h && !/^(https?:|mailto:|tel:|#)/i.test(h) && h.startsWith("/")));
    return bad.length ? `root-absolute internal link(s), break file://: ${bad.join(", ")}` : null;
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
