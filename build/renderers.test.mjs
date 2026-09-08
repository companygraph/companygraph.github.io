// The renderers are pure functions of the artifacts, so they are tested on fixtures rather
// than on the real files: a test that read model.json would pass for the wrong reason the day
// the model changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeBlock } from "./block.mjs";

const FIXTURE = {
  example: { commit: "0".repeat(40), root: "Someone", rootId: "identity", types: [], entities: [], edges: [] },
  model:   { commit: "0".repeat(40), root: "Core", rootId: null, types: [], entities: [], edges: [] },
};

const EMPTY = (marker, id) => `<p>before</p>
<!-- ${marker} · none -->
<script type="application/json" id="${id}" data-stage></script>
<!-- /${marker} -->
<p>after</p>
`;

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-render-"));
  for (const [d, marker, id] of [["example", "example data", "example-data"], ["model", "model data", "model-data"]]) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(path.join(dir, d, "index.html"), EMPTY(marker, id));
  }
  return dir;
}

test("writeBlock fills both blocks and leaves the rest of each page alone", () => {
  const dir = scratch();
  assert.deepEqual(writeBlock(FIXTURE, { check: false, root: dir }), []);
  for (const [d, name] of [["example", "example"], ["model", "model"]]) {
    const page = fs.readFileSync(path.join(dir, d, "index.html"), "utf8");
    assert.match(page, new RegExp(`<!-- ${name} data · 0{40} -->`));
    assert.ok(page.includes(JSON.stringify(FIXTURE[d])));
    assert.ok(page.startsWith("<p>before</p>"));
    assert.ok(page.trimEnd().endsWith("<p>after</p>"));
  }
});

test("writeBlock in check mode names every page that drifted", () => {
  const dir = scratch();
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }).sort(),
    ["example/index.html", "model/index.html"]);
});

test("writeBlock reports nothing once the pages are written", () => {
  const dir = scratch();
  writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }), []);
});
