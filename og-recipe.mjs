// What goes into each 1200×630 share card, and how to tell whether a card still shows it.
//
// `og.png` is not a banner someone drew: it is the page itself, rendered. The cost of that is
// a copy that has to be re-rendered whenever the page moves, and nothing about a stale card
// looks wrong — it advertises the site as it read some commits ago while every check passes.
// `npm run og:check` is what notices; this module is what it and both exporters agree on.
//
// The comparison is the recipe, never the pixels. Two machines rasterise the same text
// differently, so a card compared by its bytes reports which machine rendered it. Re-deriving
// a hash of what went *into* the card needs no browser and no server, which is why the check
// can run in CI before `npm ci`.
//
// The knobs below are the single copy. Both exporters read their frame and hide rules from
// here rather than holding their own: a second copy is a knob that can be edited without the
// hash moving, which is the one failure this whole mechanism exists to make impossible.
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
const FRAME = { width: 1200, height: 630, renderHeight: 675 };

// The two exporters crop one pixel apart — 22 against the band's 23 — because they always did.
// That difference is inherited, not introduced here, and it is left alone on purpose: this is a
// port of a check, and a check that quietly re-renders the thing it checks proves nothing.
export const cards = [
  { dir: ".", ...FRAME, clipY: 22, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion", from: "served" },
  { dir: "talks", ...FRAME, clipY: Math.round((675 - 630) / 2), hide: DECK_HIDE, titleSlide: false, settle: "wait:900", from: "file" },
  { dir: "talks/intro", ...FRAME, clipY: Math.round((675 - 630) / 2), hide: DECK_HIDE, titleSlide: true, settle: "wait:900", from: "file" },
];

export const cardFor = (dir) => cards.find((c) => c.dir === dir);

// Everything the page pulls in from this repository: the fonts it declares, the images it
// shows. A font swap changes every card while no HTML changes at all, so hashing the page
// alone would call a card current that no longer looks like its page.
// The attribute branch admits `?` and `#` and lets the split below strip them. Excluding them
// from the class instead — which is what the sibling repositories do — means an attribute
// carrying either simply fails to match, so `href="a.css?v=2"` drops out of the recipe
// entirely and the file stops being tracked. Nothing here uses one today; the check is
// supposed to over-report, and a rule that quietly under-reports is the wrong way to be wrong.
const REF = /(?:src|href)="([^"]+)"|url\((['"]?)([^)'"]+)\2\)/g;

export function sources(dir, root = REPO_ROOT) {
  const page = path.join(dir, "index.html");
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = new Set([page]);
  for (const m of html.matchAll(REF)) {
    const ref = (m[1] ?? m[3] ?? "").split(/[?#]/)[0];
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
