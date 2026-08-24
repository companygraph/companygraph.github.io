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
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    // "TALKS" is the nav's first and only link. Asserted here rather than in `links`,
    // which requires target=_blank — wrong for chrome pointing at another page on this
    // same domain, which should stay in the tab the reader is already in.
    //
    // Upper case because `contains` reads `body.innerText`, which is the RENDERED text:
    // the nav sets `text-transform:uppercase`, so the markup's "Talks" arrives here as
    // "TALKS". Asserting the markup's casing fails against a page that is perfectly
    // correct — which is exactly what happened when this line was first written.
    contains: ["Two companies", "The same shape", "CompanyGraph", "TALKS",
               // The talk's call to action and the one fact this page is allowed to
               // restate: its length. A call to action needs it in the moment, not one
               // click away. Both live in companygraph/talks — if the talk is ever
               // recut, this page has no way to find out, so the number is checked
               // against nothing here and must be updated by hand with the deck.
               "Watch intro talk", "10 minutes · German or English"],
    links: ["https://github.com/companygraph/meta-model",
            "https://github.com/companygraph",
            "https://github.com/companygraph/meta-model/blob/HEAD/LICENSE",
            "https://blust.ch/"],
    internalLinks: true,
    // The German half, named by what the reader must see and what must stop being
    // visible. Strings, not element counts: a translation that never got applied leaves
    // the English standing, and that is the failure worth naming.
    translates: { lang: "de",
                  shows: ["Zwei Unternehmen", "Dieselbe", "Das Modell ansehen", "VORTRÄGE", "Einführungsvortrag ansehen", "10 Minuten · Deutsch oder Englisch"],
                  hides: ["Two companies", "Read the model"] },
    card: true, cardBase: "https://companygraph.io" },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none, and
  // `sameOrigin` is the only check that can see that.
  { path: "/privacy/", title: /CompanyGraph/, lang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/companygraph"],
    sameTab: ["https://companygraph.io/talks/", "../", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://companygraph.io", internalLinks: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
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
  //
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
  // Every check above sees the page as it first renders, which is English. That left the
  // German half completely undefended: delete the toggle's click listener, misspell a
  // data-de attribute, or break applyLang outright, and the suite still printed
  // `all checks pass`. Nothing but clicking the control can see the other language.
  //
  // This runs last and puts the page back in English before it returns, because it is the
  // only check that mutates what the others read. If you add a check after this one, keep
  // that restore honest — the round trip is asserted here precisely so a later check
  // cannot silently inherit a German page.
  async translates(page, spec) {
    const body = () => page.evaluate(() => document.body.innerText);
    const htmlLang = () => page.evaluate(() => document.documentElement.lang);
    const english = await body();

    await page.click("#langind");
    const swapped = await htmlLang();
    if (swapped !== spec.translates.lang)
      return `after the toggle lang=${swapped}, expected ${spec.translates.lang}`;
    const german = await body();
    for (const s of spec.translates.shows)
      if (!german.includes(s)) return `German page is missing ${JSON.stringify(s)}`;
    for (const s of spec.translates.hides)
      if (german.includes(s)) return `German page still shows the English ${JSON.stringify(s)}`;

    await page.click("#langind");
    const back = await htmlLang();
    if (back !== "en") return `toggling back left lang=${back}, expected en`;
    if (await body() !== english) return "toggling back did not restore the English text";
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
