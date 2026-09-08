// The data block, written into the two pages that carry one. Fenced by markers naming the
// commit, the way the token block is fenced by its version: a reader of the HTML can see which
// state of the model the page shows, and the check can find the block without parsing the page.
//
// `data-stage` is how the shared stage script finds a block — it queries the attribute, not an
// id, so one script serves both pages.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  { dir: "example", id: "example-data", marker: "example data" },
  { dir: "model", id: "model-data", marker: "model data" },
];

export function writeBlock(data, { check = false, root = HERE } = {}) {
  const stale = [];
  for (const t of TARGETS) {
    const d = data[t.dir];
    if (!d) throw new Error(`no artifact for ${t.dir}`);
    // `data-stage` is optional in START and required in the block written back: a block from
    // before the attribute existed still has to be found once, so that the first run can put
    // the attribute there. Dropping the group would make that page unfindable rather than
    // rewritten.
    const START = new RegExp(`<!-- ${t.marker} · (?:[0-9a-f]+|none) -->\\n<script type="application\\/json" id="${t.id}"(?: data-stage)?>`);
    const END = `</script>\n<!-- /${t.marker} -->`;
    const block = `<!-- ${t.marker} · ${d.commit} -->\n<script type="application/json" id="${t.id}" data-stage>${JSON.stringify(d)}${END}`;
    const rel = `${t.dir}/index.html`;
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const start = page.search(START), end = page.indexOf(END);
    if (start < 0 || end < 0) throw new Error(`${rel} has no data block markers`);
    if (page.slice(start, end + END.length) === block) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, page.slice(0, start) + block + page.slice(end + END.length));
  }
  return stale;
}
