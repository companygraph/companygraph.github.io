// The og card is the page itself, rendered. Two things must be right or it ships wrong in a
// way that looks deliberate:
//
// 1. reducedMotion:"reduce" — the figure animates, and a render that merely waits "long
//    enough" catches it mid-draw. Emulating reduced motion draws the settled state the
//    page's own @media block defines, exactly, instead of racing a timer.
// 2. .figure is hidden — see og-recipe.mjs, which holds the rule and the reason. The frame and
//    the hide rules live there rather than here because `npm run og:check` has to hash the
//    same ones this renders with; a second copy is a knob that can be edited without the
//    check noticing.
//
// The stamp beside the card is what makes staleness visible later — see og-recipe.mjs.
import { chromium } from "playwright";
import { cardFor, stamp } from "./og-recipe.mjs";

const c = cardFor(".");
if (c.settle !== "reduced-motion" || c.from !== "served") {
  throw new Error(`og-recipe.mjs describes the landing card as ${c.settle}/${c.from}, which is not what this renders`);
}

// The recipe hashes the files in this repository. Rendering the deployed site and then
// stamping would write a stamp describing sources the card was not made from — a card
// reported current that nothing here produced.
const BASE = process.env.BASE || "http://localhost:8000/";
const local = /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(BASE);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: c.width, height: c.renderHeight },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: c.hide });
await page.screenshot({ path: "og.png", clip: { x: 0, y: c.clipY, width: c.width, height: c.height } });
await browser.close();

// After the screenshot, so a run that dies half way leaves the card reported stale rather than
// reported current on a file it never wrote.
if (local) {
  stamp(c);
  console.log(`wrote og.png ${c.width}×${c.height} and og.sha`);
} else {
  console.log(`wrote og.png ${c.width}×${c.height} from ${BASE}`);
  console.log("did not stamp og.sha: the recipe describes this repository, and this card came from elsewhere");
}
