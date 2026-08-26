// What goes into each 1200×630 share card, and how to tell whether a card still shows it.
//
// `og.png` is not a banner someone drew: it is the page itself, rendered. The cost of that is
// a copy that has to be re-rendered whenever the page moves, and nothing about a stale card
// looks wrong — it advertises the site as it read some commits ago while every check passes.
// `npm run og:check` is what notices; this module is what it and the exporter agree on.
//
// The comparison is the recipe, never the pixels. Two machines rasterise the same text
// differently, so a card compared by its bytes reports which machine rendered it. Re-deriving
// a hash of what went *into* the card needs no browser and no server, which is why the check
// can run in CI before `npm ci`.
//
// The knobs below are the single copy. `export-og.mjs` reads its frame and hide rules from
// here rather than holding its own: a second copy is a knob that can be edited without the
// hash moving, which is the one failure this whole mechanism exists to make impossible.
//
// Nothing here runs on import and nothing here needs playwright, which is what lets
// `verify/og-recipe.test.mjs` load it — an exporter that renders on import could not be tested.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

// A share card with a progress bar and a play button on it advertises controls that do nothing
// inside a PNG. `.bar` is two different things by the same name — a deck's transport bar and
// the talks index's header bar — and hiding both is what a card wants, but the overlap is
// accidental: rename either one and the other's rule here stops applying, silently.
const DECK_HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  .slide.active > *{animation:none!important}`;

// The landing page's figure is hidden not because it wouldn't fit; it would. The card's job is
// the headline and the call to action, the thing a reader takes in before they've decided to
// care. The figure is the argument that leads there, and an argument doesn't survive being
// glanced at in a feed — it needs a page and a reader who has already arrived.
const HOME_HIDE = ".figure{display:none}";

// Rendered at 16:9 and the middle band taken: these pages lay themselves out in vmin, so
// squeezed straight into 1.9:1 they shrink and leave the frame half empty. deviceScaleFactor
// stays 1 so each file is exactly the size its og:image:width tags claim.
// One crop for every card. The landing card used to be cropped a pixel higher than the other
// two — an accident of having been written in a separate exporter, never a choice — and the
// bands are the same band, so there is one constant.
const FRAME = { width: 1200, height: 630, renderHeight: 675, clipY: Math.round((675 - 630) / 2) };

// The card shows what the page shows: the stage. The title block is the page's opening,
// and a preview already prints og:title and og:description beside the image — repeating
// them inside it spends the whole card on words the platform renders anyway.
const EXAMPLE_HIDE = ".title{display:none}";

export const cards = [
  { dir: ".", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" },
  { dir: "talks", ...FRAME, hide: DECK_HIDE, titleSlide: false, settle: "wait:900" },
  { dir: "talks/intro", ...FRAME, hide: DECK_HIDE, titleSlide: true, settle: "wait:900" },
  // Reduced motion makes every d3 transition on this page 0 ms, so the root-focus state the
  // script draws on load is already settled by the time the exporter takes its shot: the
  // card renders that settled state.
  { dir: "example", ...FRAME, hide: EXAMPLE_HIDE, titleSlide: false, settle: "reduced-motion" },
  // /billing/ and /privacy/ advertised the landing card until 2026-08-26 — a paste of either
  // URL previewed the landing hero under the pasted page's title. The seo check now asserts a
  // page points at its own card, which is what surfaced these two.
  { dir: "billing", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" },
  { dir: "privacy", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" },
];

export const cardFor = (dir) => cards.find((c) => c.dir === dir);

// Everything the page pulls in from this repository: the fonts it declares, the images it
// shows. A font swap changes every card while no HTML changes at all, so hashing the page
// alone would call a card current that no longer looks like its page.
// Quoted spans are consumed whole, so a `>` inside an attribute value cannot end a tag early
// and drop the references after it — the deck keeps prose in `data-notes`, where that
// character is ordinary. And the attribute pattern admits `?` and `#` so the split below can
// strip them: excluding them from the character class instead means a ref that carries either
// fails to match at all and drops out of the recipe silently, which is under-reporting — the
// one direction this must never fail in.
const TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR = /(?:src|href)="([^"]+)"/g;
const CSSURL = /url\((['"]?)([^)'"]+)\1\)/g;

export function sources(dir, root = REPO_ROOT) {
  const page = path.join(dir, "index.html");
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = new Set([page]);
  const refs = [];
  for (const [, tag, attrs] of html.matchAll(TAG)) {
    // An `<a>` names somewhere else to go, not something to draw. The talks index is why this
    // exception exists: it links both multi-megabyte deck PDFs, so hashing link targets
    // reported that card stale on every `npm run pdf`, over a page that had not moved a pixel.
    if (tag.toLowerCase() === "a") continue;
    for (const m of attrs.matchAll(ATTR)) refs.push(m[1]);
  }
  for (const m of html.matchAll(CSSURL)) refs.push(m[2]);
  for (const raw of refs) {
    const ref = raw.split(/[?#]/)[0];
    // absolute, inline and protocol-relative references leave this repository, and the card's
    // own og:image is one of them — hashing it would key the card on itself.
    if (!ref || /^(https?:)?\/\/|^data:|^mailto:/.test(ref)) continue;
    const rel = path.normalize(path.join(dir, ref));
    if (rel.startsWith("..")) continue;
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) found.add(rel);
  }
  return [...found].sort();
}

// Key order in a card literal is not a change to the card, and a knob added to a card later is.
// Sorting the keys and hashing all of them means a new knob enters the recipe by existing,
// rather than by someone remembering to list it here as well.
const canonical = (card) =>
  JSON.stringify(Object.fromEntries(Object.entries(card).sort(([a], [b]) => (a < b ? -1 : 1))));

export function recipe(card, root = REPO_ROOT) {
  const h = crypto.createHash("sha256");
  h.update("og-recipe/1\n" + canonical(card) + "\n");
  for (const rel of sources(card.dir, root)) {
    h.update(rel + "\0");
    h.update(fs.readFileSync(path.join(root, rel)));
  }
  return h.digest("hex");
}

export const stampOf = (dir, root = REPO_ROOT) => path.join(root, dir, "og.sha");

export function state(card, root = REPO_ROOT) {
  const stamp = stampOf(card.dir, root);
  const want = recipe(card, root);
  const have = fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8").trim() : "";
  return {
    dir: card.dir,
    card: path.join(card.dir, "og.png"),
    want,
    have,
    state: !have ? "unstamped" : have === want ? "current" : "stale",
  };
}

// Written after the screenshot by whichever exporter made the card, so an exporter that dies
// half way leaves its card reported stale rather than reported current on a file it never wrote.
export function stamp(card, root = REPO_ROOT) {
  fs.writeFileSync(stampOf(card.dir, root), recipe(card, root) + "\n");
}
