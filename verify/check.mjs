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
    fontsLoaded: ["Bricolage Grotesque"],
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
