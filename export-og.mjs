// Render the 1200×630 share cards that link previews use (og:image).
//
// Each card is the page it belongs to: the landing card is the landing page, the talks card is
// the talks index, and the deck's card is its own title slide — so a preview shows what the
// visitor is about to land on rather than a banner kept in step with it by hand.
//
// English, because the head metadata is English: a scraper never runs applyLang(), so a card
// and the og:description it sits beside have to agree.
//
// Everything about what a card contains lives in og-recipe.mjs — the frame, the crop, the hide
// rules, the card list — because `npm run og:check` has to hash the same ones this renders
// with. A second copy is a knob that can be edited without the hash moving, which is the one
// failure the check exists to make impossible. This file is the only one that needs playwright.
//
// Usage: npm run og
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT, cards, stamp } from "./og-recipe.mjs";

const browser = await chromium.launch();
for (const c of cards) {
  const page = await browser.newPage({
    viewport: { width: c.width, height: c.renderHeight },
    deviceScaleFactor: 1,
    // The landing page's figure animates, and a render that merely waits "long enough" catches
    // it mid-draw. Emulating reduced motion draws the settled state the page's own @media block
    // defines, exactly, instead of racing a timer.
    ...(c.settle === "reduced-motion" ? { reducedMotion: "reduce" } : {}),
  });
  // file://, like the deck itself: every page here references its assets relatively for exactly
  // this reason, so no card needs a server to render and `npm run og` needs no second terminal.
  await page.goto(pathToFileURL(path.join(REPO_ROOT, c.dir, "index.html")).href, { waitUntil: "networkidle" });
  // An empty hide rule is a card that hides nothing — the example page's stage is its
  // argument, not chrome — and an empty style tag is rejected outright by Playwright, so
  // skip the call rather than pass content it refuses.
  if (c.hide) await page.addStyleTag({ content: c.hide });
  if (c.titleSlide) {
    await page.evaluate(() => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === 0));
    });
  }
  if (c.settle === "reduced-motion") await page.evaluate(() => document.fonts.ready);
  else await page.waitForTimeout(900);              // let the rise animation settle

  const out = path.join(REPO_ROOT, c.dir, "og.png");
  await page.screenshot({ path: out, clip: { x: 0, y: c.clipY, width: c.width, height: c.height } });
  // Stamped after the screenshot, so a run that dies half way leaves the card reported stale
  // rather than reported current on a file it never wrote.
  stamp(c);
  console.log("  ✓ " + path.join(c.dir, "og.png"));
  await page.close();
}
await browser.close();
