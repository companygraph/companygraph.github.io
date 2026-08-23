// The og card is the page itself, rendered. Two things must be right or it ships wrong in a
// way that looks deliberate:
//
// 1. reducedMotion:"reduce" — the figure animates, and a render that merely waits "long
//    enough" catches it mid-draw. Emulating reduced motion draws the settled state the
//    page's own @media block defines, exactly, instead of racing a timer.
// 2. .figure is hidden — the card carries the lockup, the headline and the call to action,
//    and that is already a complete thought on its own. The figure is the page's argument,
//    not the card's, and needs room the card does not have: at 1200 wide it runs beside
//    the hero, not inside a 1.9:1 crop, so including it would cut the two trees off above
//    the shape they arrive at, showing the argument's setup with no conclusion.
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
