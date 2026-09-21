// How far each of this site's model pins has fallen behind what it points at.
//
// `source.json` names two pins: `meta-model`, the commit of the meta-model the vocabulary and
// the example are drawn from, and `mental-model`, the commit of CompanyGraph's own instance
// the landing page is to draw. Both are editorial: each says which state of its repository these
// pages publish, so moving one is a decision someone makes rather than one a tool makes for
// them. This reports each pin's distance and nothing else — it writes no pin, and it never
// fails the build, because a pin behind its upstream is not a broken site.
//
// The check itself is `@robertblust/design/verify/pin`, shared with the sibling sites: all of
// them need the identical thing and a second copy would be a second thing to keep true.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinDrift, pinReport } from "@robertblust/design/verify/pin";

const here = path.dirname(fileURLToPath(import.meta.url));
const pins = JSON.parse(readFileSync(path.join(here, "source.json"), "utf8"));

for (const [name, pin] of Object.entries(pins)) {
  pinReport(await pinDrift({ root: here, pin }), console.log, name);
}
