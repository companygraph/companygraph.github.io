// What the share-card staleness check has to get right.
//
// Run: npm run test:og   (node --test, no dependencies — the check itself has none either)
//
// The assertions are `@robertblust/design/cards/recipe-tests`, the union of what the three
// sites' three copies of this file each proved: they had drifted to 29, 30 and 30 tests with
// no one of them a superset of another, so a rule one site had proven was a rule the other two
// only happened to satisfy. They run here against this repository's own recipe module, so they
// still gate this site's cards — including the two that read `cards` and `REPO_ROOT` directly.
import { checkRecipe } from "@robertblust/design/cards/recipe-tests";
import * as recipe from "../og-recipe.mjs";

checkRecipe(recipe);
