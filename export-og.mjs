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
// with. How they are rendered is `@robertblust/design/cards/export`, shared with the sibling
// sites. This file is the only one that needs playwright, and the package never imports it:
// the site owns the browser and hands it in.
//
// Usage: npm run og
import { chromium } from "playwright";
import { exportCards } from "@robertblust/design/cards/export";
import * as recipe from "./og-recipe.mjs";

await exportCards({ chromium, recipe });
