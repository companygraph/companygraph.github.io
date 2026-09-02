// What goes into each 1200×630 share card, and how to tell whether a card still shows it.
//
// `og.png` is not a banner someone drew: it is the page itself, rendered. The cost of that is
// a copy that has to be re-rendered whenever the page moves, and nothing about a stale card
// looks wrong — it advertises the site as it read some commits ago while every check passes.
// `npm run og:check` is what notices; this module is what it and the exporter agree on.
//
// The comparison is the recipe, never the pixels. Two machines rasterise the same text
// differently, so a card compared by its bytes reports which machine rendered it. Re-deriving
// a hash of what went *into* the card needs no browser and no server.
//
// The knobs below are the single copy, and this file is the only place they live. The
// machinery that reads them — the source walk, the hash, the stamp — is
// `@robertblust/design/cards/recipe`, shared with the sibling sites: three copies of it had
// drifted into three different sets of rules, so a case one site had proven was a case the
// other two only happened to satisfy. What is *not* shared is the data: a second copy of a
// knob is a knob that can be edited without the hash moving, which is the one failure this
// whole mechanism exists to make impossible.
//
// `REPO_ROOT` is bound here rather than derived in the package: this file really does sit at
// the repository root, while the package sits inside `node_modules` and would point there.
//
// Nothing here runs on import and nothing here needs playwright, which is what lets
// `verify/og-recipe.test.mjs` load it — an exporter that renders on import could not be tested.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recipeFor } from "@robertblust/design/cards/recipe";

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

// Both stage pages use this. The card shows what the page shows: the stage. The title block
// is the page's opening, and a preview already prints og:title and og:description beside the
// image — repeating them inside it spends the whole card on words the platform renders anyway.
const STAGE_HIDE = ".title{display:none}";

export const cards = [
  { dir: ".", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" },
  { dir: "talks", ...FRAME, hide: DECK_HIDE, titleSlide: false, settle: "wait:900" },
  { dir: "talks/intro", ...FRAME, hide: DECK_HIDE, titleSlide: true, settle: "wait:900" },
  // The two stage pages. Reduced motion makes every d3 transition 0 ms, so the root-focus
  // state the script draws on load is already settled by the time the exporter takes its
  // shot: the card renders that settled state.
  // `hash` is the state to render, not just a page: the model's root view is two nodes and a
  // line, which is a card of mostly empty canvas. #core opens the folder, so the card shows
  // the six schemas fanned out — what the page is actually about, and a state the page
  // reaches on its own from a URL rather than one the exporter poses by hand.
  { dir: "model", ...FRAME, hide: STAGE_HIDE, hash: "#core", titleSlide: false, settle: "reduced-motion" },
  { dir: "example", ...FRAME, hide: STAGE_HIDE, titleSlide: false, settle: "reduced-motion" },
  // /billing/ and /privacy/ advertised the landing card until 2026-08-26 — a paste of either
  // URL previewed the landing hero under the pasted page's title. The seo check now asserts a
  // page points at its own card, which is what surfaced these two.
  { dir: "billing", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" },
  { dir: "privacy", ...FRAME, hide: HOME_HIDE, titleSlide: false, settle: "reduced-motion" },
];

// The machinery, bound to this repository's root so the site's own callers — the exporter, the
// check, the tests — can go on calling `state(card)` with one argument. `export * from` would
// leave `root` unbound and `state()` would throw for every one of them.
export const { sources, recipe, stampOf, state, stamp } = recipeFor(REPO_ROOT);
