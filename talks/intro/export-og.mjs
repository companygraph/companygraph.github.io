// Render the 1200×630 share cards that link previews use (og:image).
//
// A deck's card is its own title slide, and the talks index card is the talks index — so
// the preview shows the thing the visitor is about to land on rather than a generic
// banner that has to be kept in step with it by hand.
//
// English, because the head metadata is English: a scraper never runs applyLang(), so the
// card and the og:description it sits next to have to agree.
//
// The frame, the hide rules and the stamp all come from the repository root's og-recipe.mjs,
// which `npm run og:check` hashes — one copy, so a knob cannot be edited here without the
// check seeing it. That check covers all three cards at once; this exporter makes two of them,
// and the landing card is `npm run og` at the root.
//
// Usage: npm run og   (or: node export-og.mjs)
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT, cardFor, stamp } from "../../og-recipe.mjs";

const cards = ["talks", "talks/intro"].map(cardFor);
for (const c of cards) {
  if (c.settle !== "wait:900" || c.from !== "file") {
    throw new Error(`og-recipe.mjs describes ${c.dir} as ${c.settle}/${c.from}, which is not what this renders`);
  }
}

const browser = await chromium.launch();
for (const c of cards) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.renderHeight } });
  await page.goto(pathToFileURL(path.join(REPO_ROOT, c.dir, "index.html")).href, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: c.hide });
  if (c.titleSlide) {
    await page.evaluate(() => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === 0));
    });
  }
  await page.waitForTimeout(900);            // let the rise animation settle
  const out = path.join(REPO_ROOT, c.dir, "og.png");
  await page.screenshot({ path: out, clip: { x: 0, y: c.clipY, width: c.width, height: c.height } });
  // After the screenshot, so a run that dies half way leaves the card reported stale rather
  // than reported current on a file it never wrote.
  stamp(c);
  console.log("  ✓ " + path.join(c.dir, "og.png"));
  await page.close();
}
await browser.close();
