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
    contains: ["Two companies", "The same shape", "CompanyGraph"],
    links: ["https://github.com/companygraph/meta-model"],
    internalLinks: true,
    card: true, cardBase: "https://companygraph.io" },
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
