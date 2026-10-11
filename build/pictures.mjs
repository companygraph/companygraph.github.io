// The Processes page's process pictures and the talks' pictures (talk-pictures.mjs), drawn when the
// site builds rather than in the visitor's browser. `@robertblust/design/pictures` lets this site's
// own chat.js draw each one in Chromium and writes it beside its page as pictures/<name>.svg, with a
// stamp of what went into it that `npm run pages:check` reads without a browser.
//
// A talk is a deck that shows one slide at a time, and the package's drawing waits for a figure to
// be on screen, so a talk's pictures are drawn here with the package's own helpers, each after the
// slide that holds it is made the one shown. What is written is the same: the same placeholder
// colors read back as tokens, the same refusal of a color that is none, the same stamp.
//
// Usage: npm run pages && npm run pictures && npm run pages
//
// The package never imports Playwright, so the browser is handed in from here, as the share
// cards' export script hands it in.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { drawPictures, PLACEHOLDERS, picturePath, pictureStamp, tokenized } from "@robertblust/design/pictures";
import { serve } from "@robertblust/design/cards/export";
import { TALK_PAGES } from "./talk-figures.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

await drawPictures({ chromium, root: ROOT, pages: ["processes/index.html"] });

// Every color a drawn picture paints that is no placeholder: the package's own test, read off what
// each element paints, so a picture that would be wrong in one theme is refused here too.
function unnamedPaint(placeholders) {
  const ok = (v) => placeholders.some(([r, g, b]) => new RegExp(`^rgba?\\(${r}, ${g}, ${b}(, [\\d.]+)?\\)$`).test(v));
  const bad = [], shape = /^(rect|path|circle|polygon|ellipse|line|polyline|text|tspan)$/i;
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  for (const e of document.querySelectorAll("figure[data-diagram] .rbchat-diagram-box svg *")) {
    if (/^(style|title|desc)$/i.test(e.tagName)) continue;
    const cs = getComputedStyle(e), where = e.tagName.toLowerCase() + (e.getAttribute("class") ? "." + e.getAttribute("class").split(" ")[0] : "");
    if (cs.filter && cs.filter !== "none") bad.push(`${where} filter ${cs.filter}`);
    if (shape.test(e.tagName)) for (const p of ["fill", "stroke"]) {
      const v = cs.getPropertyValue(p);
      if (v === "none" || (p === "stroke" && parseFloat(cs.strokeWidth) === 0) || ok(v)) continue;
      bad.push(`${where} ${p} ${v}`);
    }
    if (ownText(e) && !ok(cs.color)) bad.push(`${where} color ${cs.color}`);
    const bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !ok(bg)) bad.push(`${where} background ${bg}`);
  }
  return [...new Set(bad)];
}

const srv = await serve(ROOT);
const base = `http://127.0.0.1:${srv.address().port}`;
const written = [];
try {
  const browser = await chromium.launch();
  try {
    for (const page of TALK_PAGES) {
      const tab = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      await tab.addInitScript((tokens) => {
        document.addEventListener("DOMContentLoaded", () => {
          const s = document.createElement("style");
          s.textContent = "figure[data-diagram]{" + tokens.map(([k, [r, g, b]]) => `${k}:rgb(${r},${g},${b})`).join(";") + "}";
          document.head.appendChild(s);
          for (const box of document.querySelectorAll("figure[data-diagram] .rbchat-diagram-box[data-drawn]")) { box.removeAttribute("data-drawn"); box.textContent = ""; }
        });
      }, Object.entries(PLACEHOLDERS));
      await tab.goto(base + "/" + page.replace(/index\.html$/, ""));
      const names = await tab.$$eval("figure[data-diagram][data-picture]", (fs) => fs.map((f) => f.getAttribute("data-picture")));
      for (const name of names) {
        const sel = `figure[data-diagram][data-picture="${name}"]`;
        await tab.evaluate((sel) => {
          const fig = document.querySelector(sel);
          document.querySelectorAll(".slide").forEach((s) => s.classList.toggle("active", s.contains(fig)));
        }, sel);
        await tab.locator(sel).scrollIntoViewIfNeeded();
        await tab.waitForFunction((sel) => !!document.querySelector(sel + " .rbchat-diagram-box svg"), sel, { timeout: 30000 });
      }
      const bad = await tab.evaluate(unnamedPaint, Object.values(PLACEHOLDERS));
      if (bad.length) throw new Error(`${page}: a picture paints a color that is no token, so it would be wrong in one theme:\n  ${bad.join("\n  ")}`);
      const drawn = await tab.$$eval("figure[data-diagram][data-picture]", (fs) => fs.map((f) => ({
        name: f.getAttribute("data-picture"),
        picture: JSON.parse(f.querySelector('script[type="application/json"]').textContent),
        id: f.querySelector(".rbchat-diagram-box svg").id,
        html: f.querySelector(".rbchat-diagram-box").innerHTML,
      })));
      for (const d of drawn) {
        const file = path.join(ROOT, picturePath(page, d.name));
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, tokenized(d.html, d.id, d.name) + "\n");
        fs.writeFileSync(file.replace(/\.svg$/, ".sha"), pictureStamp(d.picture, ROOT) + "\n");
        written.push(path.relative(ROOT, file));
      }
      await tab.close();
    }
  } finally { await browser.close(); }
} finally { srv.close(); }
console.log(`  drew ${written.length} talk picture(s): ${written.join(", ") || "none"}${written.length ? " — now run: npm run pages" : ""}`);
