// Does each share card still show the page it was rendered from?
//
// Usage: npm run og:check
//
// It renders nothing and imports nothing outside node's standard library and this package, so
// it needs no browser — a stale card is caught by one of the cheapest steps in the job rather
// than by whoever notices the preview. It does need `npm ci` to have run, which is why CI
// orders it after that step and before `npx playwright install`.
//
// It over-reports and never under-reports, deliberately. Editing a comment in a page marks its
// card stale even though the render would be identical. Clearing that is `npm run og` and a
// commit — cheap, and the opposite error is a card nobody notices for days.
import { checkCards } from "@robertblust/design/cards/check";
import * as recipe from "./og-recipe.mjs";

if (checkCards(recipe)) process.exit(1);
