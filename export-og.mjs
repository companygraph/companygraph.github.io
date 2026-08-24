// The og card is the page itself, rendered. Two things must be right or it ships wrong in a
// way that looks deliberate:
//
// 1. reducedMotion:"reduce" — the figure animates, and a render that merely waits "long
//    enough" catches it mid-draw. Emulating reduced motion draws the settled state the
//    page's own @media block defines, exactly, instead of racing a timer.
// 2. .figure is hidden — not because it wouldn't fit; it would. The card's job is the
//    headline and the call to action, the thing a reader takes in before they've decided
//    to care. The figure is the argument that leads there, and an argument doesn't survive
//    being glanced at in a feed — it needs a page and a reader who has already arrived. So
//    the card leaves it out on purpose, regardless of whether the crop has room for it.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 675 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await page.goto(process.env.BASE || "http://localhost:8000/", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: ".figure{display:none}" });
await page.screenshot({ path: "og.png", clip: { x: 0, y: 22, width: 1200, height: 630 } });
await browser.close();
console.log("wrote og.png 1200×630");
